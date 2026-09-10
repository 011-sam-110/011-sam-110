export const meta = {
  name: 'goal',
  description: 'Autonomously review, improve, and verify Sam\'s portfolio: audit -> research exemplars -> plan -> build -> verify animations with Playwright -> ship a PR with a Vercel preview.',
  whenToUse: 'Invoked by the /goal skill. Pass args {goal, runId, repoRoot, projectDir, skillDir, artifactsDir, ship}.',
  phases: [
    { title: 'Audit',    detail: 'Audit index.html + the Next.js app in parallel; pick the canonical site' },
    { title: 'Research', detail: 'Study top dev portfolios; extract implementable, audience-fit features' },
    { title: 'Plan',     detail: 'Synthesize one concrete build plan with disjoint-file tasks + animation targets' },
    { title: 'Build',    detail: 'Implement tasks sequentially against the shared codebase' },
    { title: 'Verify',   detail: 'Build, run, Playwright-probe each animation, judge montages, fix-loop' },
    { title: 'Ship',     detail: 'Branch, commit, push, open a PR (Vercel preview deploy)' },
  ],
}

// ---------------------------------------------------------------------------
// args (passed by the /goal skill)
// ---------------------------------------------------------------------------
const A = args || {}
const GOAL        = A.goal || 'Review the portfolio and make the highest-impact improvements for a junior contract dev targeting agencies.'
const RUN_ID      = A.runId || 'run'
const REPO        = A.repoRoot || '.'
const PROJECT     = A.projectDir || (REPO + '/project')
const SKILL       = A.skillDir || (REPO + '/.claude/skills/goal')
const ARTIFACTS   = A.artifactsDir || (PROJECT + '/.goal-artifacts/' + RUN_ID)
const PROBE       = SKILL + '/playwright/animation-probe.mjs'
const REFS        = SKILL + '/references'
const SHIP        = A.ship !== false   // default: open a PR. Pass ship:false to stop after verify.
const MAX_FIX_ROUNDS = 2

const ctx = `Context every agent shares:
- This is Sam Poplett's portfolio repo. Audience = hiring managers at agencies + clients evaluating a 19-year-old
  contract developer for work / a post-uni job. Every change must make Sam more hireable, not just prettier.
- Repo root: ${REPO}
- Candidate sites: (a) ${REPO}/index.html (live GitHub Pages, single file) and (b) ${PROJECT} (Next.js 14 app with
  React Three Fiber, Framer Motion, GSAP, Lenis — half finished, has duplicate Hero.tsx/Hero/index.tsx cruft).
- Deploy target: Vercel (SSR + API routes allowed). Reference material lives in ${REFS}/ — READ the relevant files.
- The run goal: "${GOAL}"`

// ---------------------------------------------------------------------------
// schemas
// ---------------------------------------------------------------------------
const AUDIT_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['target', 'state', 'buildStatus', 'strengths', 'gaps', 'recommendation', 'recommendationScore'],
  properties: {
    target: { type: 'string' },
    state: { type: 'string', description: 'What works, what is stubbed, what is broken' },
    buildStatus: { type: 'string', description: 'Result of attempting to build/open it' },
    strengths: { type: 'array', items: { type: 'string' } },
    gaps: { type: 'array', items: { type: 'string' } },
    recommendation: { type: 'string', description: 'Invest in this site, or not, and why' },
    recommendationScore: { type: 'number', description: '0-100: how good a foundation this is for the goal' },
  },
}

const FEATURES_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['category', 'features'],
  properties: {
    category: { type: 'string' },
    features: {
      type: 'array', items: {
        type: 'object', additionalProperties: false,
        required: ['name', 'why', 'sourceExamples', 'audienceFit', 'effort', 'priority'],
        properties: {
          name: { type: 'string' },
          why: { type: 'string', description: 'Why it raises hireability for this audience' },
          sourceExamples: { type: 'array', items: { type: 'string' }, description: 'Real portfolios/sites that do it well (URLs or names)' },
          audienceFit: { type: 'string' },
          effort: { type: 'string', enum: ['S', 'M', 'L'] },
          priority: { type: 'number', description: '1 (highest) .. 5' },
        },
      },
    },
  },
}

const PLAN_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['canonicalTarget', 'rationale', 'tasks', 'animationTargets'],
  properties: {
    canonicalTarget: { type: 'string', description: 'Absolute path of the site to build on' },
    rationale: { type: 'string' },
    tasks: {
      type: 'array', items: {
        type: 'object', additionalProperties: false,
        required: ['id', 'title', 'files', 'acceptance'],
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          intent: { type: 'string' },
          files: { type: 'array', items: { type: 'string' }, description: 'Disjoint file ownership — no two tasks share a file' },
          acceptance: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    animationTargets: {
      type: 'object', additionalProperties: true,
      description: 'A targets.json spec for animation-probe.mjs (viewport/durationMs/fps/targets[]). May be empty if no motion changed.',
    },
  },
}

const BUILD_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['taskId', 'ok', 'filesTouched', 'summary'],
  properties: {
    taskId: { type: 'string' },
    ok: { type: 'boolean' },
    filesTouched: { type: 'array', items: { type: 'string' } },
    summary: { type: 'string' },
    notes: { type: 'string' },
  },
}

const RUNNER_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['buildOk', 'serverOk', 'perTarget', 'staticShots', 'consoleErrors'],
  properties: {
    buildOk: { type: 'boolean' },
    buildLog: { type: 'string', description: 'Tail of the build output, esp. errors' },
    serverOk: { type: 'boolean' },
    perTarget: {
      type: 'array', items: {
        type: 'object', additionalProperties: false,
        required: ['id', 'didAnimate', 'montage', 'resultJson', 'consoleErrors'],
        properties: {
          id: { type: 'string' },
          didAnimate: { type: 'boolean' },
          montage: { type: 'string', description: 'Absolute path to montage.png (or empty)' },
          video: { type: 'string' },
          resultJson: { type: 'string', description: 'Absolute path to result.json' },
          consoleErrors: { type: 'number' },
        },
      },
    },
    staticShots: { type: 'array', items: { type: 'string' }, description: 'Absolute paths to desktop+mobile full-page screenshots' },
    consoleErrors: { type: 'array', items: { type: 'string' } },
  },
}

const VERDICT_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['id', 'verdict', 'evidence'],
  properties: {
    id: { type: 'string' },
    verdict: { type: 'string', enum: ['pass', 'fail'] },
    evidence: { type: 'string', description: 'What the montage + timeline actually show' },
    issues: { type: 'array', items: { type: 'string' } },
    fixHint: { type: 'string', description: 'If fail: concrete code-level fix (file + what to change)' },
  },
}

const SHIP_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['branch', 'committed'],
  properties: {
    branch: { type: 'string' },
    committed: { type: 'boolean' },
    prUrl: { type: 'string' },
    commit: { type: 'string' },
    notes: { type: 'string' },
  },
}

// ===========================================================================
// PHASE 0 — AUDIT (parallel)
// ===========================================================================
phase('Audit')
const [auditHtml, auditNext] = await parallel([
  () => agent(
    `${ctx}\n\nYou audit the LEGACY site at ${REPO}/index.html. Read it. Assess content quality, credibility signals,
mobile behavior, performance, and how well it sells a junior contract dev to an agency. Try opening it if useful.
Return AUDIT_SCHEMA with target="index.html (legacy)".`,
    { label: 'audit:index.html', phase: 'Audit', agentType: 'claude', schema: AUDIT_SCHEMA }),
  () => agent(
    `${ctx}\n\nYou audit the NEXT.JS app at ${PROJECT}. Read package.json, app/page.tsx, lib/data.ts, and the components/
folder. Note the duplicate flat-vs-folder components (Hero.tsx vs Hero/index.tsx etc.) and which the app actually imports.
Run \`npm install\` then \`npm run build\` in ${PROJECT} and report whether it builds (this is buildStatus). Assess how
complete it is and whether it is the better foundation. Return AUDIT_SCHEMA with target="next.js app".`,
    { label: 'audit:next.js', phase: 'Audit', agentType: 'claude', schema: AUDIT_SCHEMA }),
])
const audits = [auditHtml, auditNext].filter(Boolean)
log(`Audit done. Scores — ${audits.map(a => `${a.target}: ${a.recommendationScore}`).join(' | ')}`)

// ===========================================================================
// PHASE 1 — RESEARCH (parallel; study exemplar portfolios, extract features)
// ===========================================================================
phase('Research')
const RESEARCH_LENSES = [
  { key: 'hero-and-3d',     ask: 'hero sections, 3D/WebGL, and first-impression motion on standout developer portfolios' },
  { key: 'case-studies',    ask: 'how strong dev portfolios structure project case studies / deep-dives that win work' },
  { key: 'credibility',     ask: 'credibility & social-proof patterns junior devs use to look hireable (proof of work, metrics, testimonials, availability/"open to work", booking a call)' },
  { key: 'motion-scroll',   ask: 'scroll-driven storytelling, reveal-on-scroll, and micro-interactions done tastefully' },
  { key: 'analytics-data',  ask: 'live data / GitHub analytics / dashboards embedded in portfolios' },
]
const researchRaw = await parallel(RESEARCH_LENSES.map(lens => () => agent(
  `${ctx}\n\nResearch lens: ${lens.ask}.
First READ ${REFS}/exemplar-portfolios.md and ${REFS}/audience-brief.md. Then use web search/fetch (or the
duckduckgo-search skill if web tools are unavailable) to study 4-6 real, currently-excellent examples for this lens.
Extract only features that are concretely implementable in a Next.js + R3F + Framer Motion stack AND raise hireability
for a 19-year-old contract dev targeting agencies. Cite the real sites. Return FEATURES_SCHEMA for category="${lens.key}".`,
  { label: `research:${lens.key}`, phase: 'Research', agentType: 'claude', schema: FEATURES_SCHEMA }
)))
const research = researchRaw.filter(Boolean)
const allFeatures = research.flatMap(r => (r.features || []).map(f => ({ ...f, category: r.category })))
log(`Research done. ${allFeatures.length} candidate features across ${research.length} lenses.`)

// ===========================================================================
// PHASE 2 — PLAN (single strong synthesizer)
// ===========================================================================
phase('Plan')
const plan = await agent(
  `${ctx}\n\nYou are the planner. Inputs:
AUDITS:\n${JSON.stringify(audits, null, 2)}
RESEARCH FEATURES:\n${JSON.stringify(allFeatures, null, 2)}

Now READ these references and treat them as REQUIREMENTS, not suggestions:
- ${REFS}/features-scope.md  (must-have features incl. live GitHub analytics report, 3D, project case studies, and a "Book a call" CTA)
- ${REFS}/audience-brief.md  (positioning for an agency-hiring audience)
- ${REFS}/design-and-ship.md (design bar + deploy/booking config conventions)

Produce ONE concrete build plan as PLAN_SCHEMA:
1. canonicalTarget: the absolute path of the site to build on (justify with the audit scores; the Next.js app is the
   expected choice given the 3D/analytics/Vercel goals — but defend it).
2. tasks: an ordered list. CRITICAL: assign DISJOINT files to each task (no two tasks edit the same file) so they are
   safe to build one-by-one without merge conflicts. Cover at minimum: (a) remove the duplicate-component cruft and fix
   imports, (b) live GitHub analytics report via a Next.js API route + client charts, (c) project case-study pages from
   lib/data.ts, (d) a polished 3D hero, (e) a "Book a call" section using a Cal.com inline embed reading
   NEXT_PUBLIC_CAL_LINK (fallback to a mailto CTA when unset), plus the highest-priority researched features.
3. animationTargets: a valid targets.json spec for animation-probe.mjs covering every NEW or CHANGED animation
   (hero headline, 3D scene canvas, scroll reveals, hover states). Use real selectors you intend to ship. If a task adds
   an animation, it MUST appear here so Verify can prove it works.
Keep the task list focused (aim 6-10 tasks). Do NOT write code yet.`,
  { label: 'plan:synthesize', phase: 'Plan', agentType: 'claude', schema: PLAN_SCHEMA, effort: 'high' })

const TARGET = plan.canonicalTarget || PROJECT
log(`Plan: build on ${TARGET} — ${plan.tasks.length} tasks, ${(plan.animationTargets && plan.animationTargets.targets || []).length} animation targets.`)

// ===========================================================================
// PHASE 3 — BUILD (sequential — protects the shared codebase from edit races)
// ===========================================================================
phase('Build')
const buildResults = []
for (let i = 0; i < plan.tasks.length; i++) {
  const t = plan.tasks[i]
  const prior = buildResults.filter(Boolean).map(r => `- ${r.taskId}: ${r.summary}`).join('\n') || '(none yet)'
  const r = await agent(
    `${ctx}\n\nYou implement ONE task in the codebase at ${TARGET}. Build tasks run sequentially; earlier tasks already
landed:\n${prior}\n
TASK ${t.id} — ${t.title}
intent: ${t.intent || ''}
files you own (edit ONLY these, plus new files they imply): ${JSON.stringify(t.files)}
acceptance criteria: ${JSON.stringify(t.acceptance)}

Rules:
- Read before you edit. Match the existing code style. Keep it type-clean (this is a TS Next.js app).
- Honor ${REFS}/design-and-ship.md and the 'animate' / 'emil-design-eng' skills' principles for any motion.
- Do NOT run the dev server or Playwright (Verify does that). Do NOT touch files owned by other tasks.
- After editing, sanity-check your files compile in isolation as best you can.
Return BUILD_SCHEMA.`,
    { label: `build:${t.id}`, phase: 'Build', agentType: 'claude', schema: BUILD_SCHEMA })
  buildResults.push(r)
  log(`Built ${t.id} (${i + 1}/${plan.tasks.length}) ok=${r && r.ok}`)
}

// ===========================================================================
// PHASE 4 — VERIFY (build + run + Playwright animation probe + judges + fix loop)
// ===========================================================================
phase('Verify')
const animTargets = (plan.animationTargets && plan.animationTargets.targets) ? plan.animationTargets : { viewport: { width: 1440, height: 900 }, durationMs: 2500, fps: 6, targets: [] }

async function runProbe(roundLabel, onlyIds) {
  const spec = onlyIds && onlyIds.length
    ? { ...animTargets, targets: (animTargets.targets || []).filter(t => onlyIds.includes(t.id)) }
    : animTargets
  return agent(
    `${ctx}\n\nYou are the Verify RUNNER (${roundLabel}). Work in ${TARGET}.
1. Ensure deps: \`npm install\` in ${TARGET}; ensure the probe harness is installed: in ${SKILL}/playwright run
   \`npm install\` and \`npx playwright install chromium\` if not already present (idempotent).
2. Build the app: \`npm run build\` in ${TARGET}. Capture pass/fail into buildOk and the error tail into buildLog.
3. Start a server on port 3000: if the build passed use \`npm run start\`, else \`npm run dev\`. Run it in the
   background and wait until http://localhost:3000 responds.
4. Write this animation-targets spec to ${ARTIFACTS}/targets.json (create dirs):
${JSON.stringify(spec, null, 2)}
   Then run: \`node "${PROBE}" --url http://localhost:3000 --targets "${ARTIFACTS}/targets.json" --out "${ARTIFACTS}/anim"\`
   It writes, per target: <id>/montage.png, <id>/<id>.webm, <id>/result.json, and a summary.json.
5. Also capture STATIC evidence: with the playwright in ${SKILL}/playwright, screenshot the full page at desktop
   (1440x900) and mobile (390x844) into ${ARTIFACTS}/static/ and collect any console/page errors seen on load.
6. Stop the server.
Return RUNNER_SCHEMA with absolute paths. Read summary.json to populate perTarget (montage/resultJson/didAnimate/consoleErrors).`,
    { label: `verify:run:${roundLabel}`, phase: 'Verify', agentType: 'claude', schema: RUNNER_SCHEMA, effort: 'high' })
}

async function judge(perTarget) {
  const judgeable = perTarget.filter(t => t.montage || t.resultJson)
  const raw = await parallel(judgeable.map(t => () => agent(
    `${ctx}\n\nYou are an animation JUDGE. Read the rubric at ${REFS}/verification-rubric.md.
For animation "${t.id}":
- Read the montage image: ${t.montage}   (a left-to-right, top-to-bottom time-lapse of the animation)
- Read the numeric timeline + change signals: ${t.resultJson}
Decide if the motion is CORRECT: the right element animates, in the right direction, smoothly, to the correct end
state, with no console/WebGL errors (the result.json lists consoleErrors). The signals object tells you whether pixels/
opacity/transform/bbox actually moved — but YOU judge whether it's the *right* motion, not just that something moved.
Return VERDICT_SCHEMA. If fail, give a concrete fixHint naming the file and the change.`,
    { label: `verify:judge:${t.id}`, phase: 'Verify', agentType: 'claude', schema: VERDICT_SCHEMA }
  )))
  return raw.filter(Boolean)
}

let runner = await runProbe('round-1')
let verdicts = runner.perTarget && runner.perTarget.length ? await judge(runner.perTarget) : []
let round = 1
while (round < 1 + MAX_FIX_ROUNDS) {
  const failing = verdicts.filter(v => v.verdict === 'fail')
  const buildBroken = !runner.buildOk
  if (!failing.length && !buildBroken) break
  log(`Verify round ${round}: ${buildBroken ? 'BUILD BROKEN; ' : ''}${failing.length} animation(s) failing — fixing.`)

  const fixBrief = [
    buildBroken ? `BUILD FAILED. Build log tail:\n${runner.buildLog || ''}` : '',
    failing.length ? 'Animation failures:\n' + failing.map(f => `- ${f.id}: ${f.evidence}\n  FIX: ${f.fixHint}`).join('\n') : '',
    runner.consoleErrors && runner.consoleErrors.length ? 'Console errors:\n' + runner.consoleErrors.join('\n') : '',
  ].filter(Boolean).join('\n\n')

  await agent(
    `${ctx}\n\nYou are the FIXER. The build/verify of ${TARGET} surfaced problems. Read the relevant files and fix them
so the app builds cleanly and every animation behaves as intended. Be surgical.\n\n${fixBrief}\n
Make the edits directly. Do not run Playwright. When done, briefly state what you changed.`,
    { label: `verify:fix:round${round}`, phase: 'Verify', agentType: 'claude' })

  const reverifyIds = failing.map(f => f.id)
  runner = await runProbe('round-' + (round + 1), buildBroken ? null : reverifyIds)
  const newVerdicts = runner.perTarget && runner.perTarget.length ? await judge(runner.perTarget) : []
  // merge: replace re-judged ids, keep previously-passing ones
  const byId = {}
  for (const v of verdicts) byId[v.id] = v
  for (const v of newVerdicts) byId[v.id] = v
  verdicts = Object.values(byId)
  round++
}

const passed = verdicts.filter(v => v.verdict === 'pass').map(v => v.id)
const stillFailing = verdicts.filter(v => v.verdict === 'fail')
log(`Verify complete. buildOk=${runner.buildOk}; animations pass=${passed.length} fail=${stillFailing.length}`)

// ===========================================================================
// PHASE 5 — SHIP (branch + commit + PR; never auto-merge to production)
// ===========================================================================
let ship = null
if (SHIP) {
  phase('Ship')
  const verifyOk = runner.buildOk && stillFailing.length === 0
  ship = await agent(
    `${ctx}\n\nYou ship the work. In ${REPO}:
1. Create a branch: goal/${RUN_ID}
2. Stage and commit the changes with a clear message summarizing what /goal did this run.
   End the commit body with: \nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
3. Push the branch. Then open a PR with \`gh pr create\` whose body summarizes: the canonical site chosen, features
   added, verification results (build ${runner.buildOk ? 'passed' : 'FAILED'}; animations pass=${passed.length}
   fail=${stillFailing.length}), and that merging gives a Vercel production deploy while the branch already has a
   preview. End the PR body with: \n🤖 Generated with [Claude Code](https://claude.com/claude-code)
   ${verifyOk ? '' : 'IMPORTANT: verification did NOT fully pass — open the PR as a DRAFT and say so in the title.'}
Do NOT merge. Return SHIP_SCHEMA.`,
    { label: 'ship:pr', phase: 'Ship', agentType: 'claude', schema: SHIP_SCHEMA })
}

// ---------------------------------------------------------------------------
// final structured report (returned to the main agent that ran /goal)
// ---------------------------------------------------------------------------
return {
  goal: GOAL,
  runId: RUN_ID,
  canonicalTarget: TARGET,
  planRationale: plan.rationale,
  tasksBuilt: buildResults.filter(Boolean).map(r => ({ id: r.taskId, ok: r.ok, summary: r.summary, files: r.filesTouched })),
  featuresConsidered: allFeatures.length,
  verification: {
    buildOk: runner.buildOk,
    animationsPassed: passed,
    animationsFailed: stillFailing.map(v => ({ id: v.id, evidence: v.evidence, fixHint: v.fixHint })),
    artifactsDir: ARTIFACTS,
    montages: (runner.perTarget || []).map(t => t.montage).filter(Boolean),
    videos: (runner.perTarget || []).map(t => t.video).filter(Boolean),
    staticShots: runner.staticShots || [],
  },
  ship,
  needsHumanConfig: ['NEXT_PUBLIC_CAL_LINK (your Cal.com/Calendly handle) so "Book a call" goes live'],
}

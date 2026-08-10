# /goal — autonomous portfolio orchestrator

A multi-agent workflow that reviews, improves, and **verifies** Sam's portfolio — including verifying *animations*,
which a model normally can't see.

## Run it
```
/goal                                  # default: highest-impact improvements
/goal add a 3D hero and case studies   # steer it with a goal
/goal plan only                        # stop after the plan (no build/ship)
```

## What happens (6 phases, ~multi-agent)
| Phase | Parallel? | What it does |
|------|-----------|--------------|
| **Audit** | ✅ 2 agents | Audit `index.html` + the Next.js app; pick the canonical site to build on |
| **Research** | ✅ 5 agents | Study top dev portfolios (Awwwards, Brittany Chiang, Bruno Simon, Cassie Evans…), extract implementable, audience-fit features |
| **Plan** | — | Synthesize one plan with **disjoint-file** tasks + an animation-targets spec |
| **Build** | sequential | Implement tasks one-by-one against the shared codebase (no edit races) |
| **Verify** | ✅ per-target | Build, run, Playwright-probe every animation, judge the montages, **fix-loop** |
| **Ship** | — | Branch + commit + PR (Vercel preview deploy). Never auto-merges to prod |

## The animation-verification trick
A model can Read images but not watch video. `playwright/animation-probe.mjs` turns **time → space + numbers**:
- **montage.png** — frames tiled into one image → a judge agent *sees* the whole motion arc in one Read.
- **\<id\>.webm** — the clip, for you to watch.
- **result.json** — per-tick opacity/transform/bbox + frame-to-frame **pixel diff** (the only signal for 3D/WebGL).

The probe proves *something moved*; the judge agent proves *the right thing moved, correctly*.

Validate the rig anytime:
```
cd .claude/skills/goal/playwright && npm run selftest
```

## Files
```
SKILL.md                     the /goal command (what the main agent does)
goal.workflow.js             the orchestration (phases, agents, schemas, fix-loop)
playwright/
  animation-probe.mjs        the verification harness (self-tested ✓)
  package.json               self-contained deps (playwright) — kept out of the site's deps
  targets.example.json       example animation-targets spec
references/                  REQUIREMENTS the agents read (edit these to change behavior)
  audience-brief.md          who the site is for (agency-hiring audience)
  features-scope.md          must-haves: analytics report, 3D, case studies, Book-a-call
  exemplar-portfolios.md     research seeds
  design-and-ship.md         design bar + Vercel/booking config + autonomy boundaries
  verification-rubric.md     what "verified" means
```

## One-time config (so features go fully live)
Set in Vercel (and `.env.local`):
- `NEXT_PUBLIC_CAL_LINK` — your Cal.com handle (e.g. `sam-poplett/15min`) for **Book a call**. Unset → graceful mailto fallback.
- `GITHUB_TOKEN` — optional; raises GitHub API limits for the live analytics report.

To change *what* `/goal` builds, edit `references/` — not the workflow.

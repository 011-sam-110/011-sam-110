---
name: goal
description: Autonomously review, improve, and verify Sam's portfolio website. Orchestrates a multi-agent workflow — audit both sites → research top dev portfolios → plan → build (live GitHub analytics report, 3D hero, project case studies, "Book a call" CTA, + researched features) → verify animations with Playwright (montage + video + numeric timeline) → open a PR with a Vercel preview. Use when the user types /goal [optional goal text], e.g. "/goal add a 3D hero and case studies" or just "/goal".
---

# /goal — autonomous portfolio improvement orchestrator

`/goal` improves Sam Poplett's portfolio (a hiring artifact for a 19-year-old contract dev targeting agencies) by
running a deterministic multi-agent **Workflow**. You (the main agent) set it up, launch it, and report back. The
workflow does the heavy lifting; your job is scouting, launching, and relaying.

**Mode for this project: fully autonomous.** Plan → build → verify → open a PR with no stops. You commit to a branch and
open a PR (reversible, yields a Vercel preview); you never merge to production or delete the live site silently.

## The hard problem this solves: verifying animation
An agent can Read images but cannot watch video. So the Playwright harness (`playwright/animation-probe.mjs`, already
installed + self-tested) turns **time into space + numbers**: per animation it produces a **montage** (frames tiled into
one image — Read it to *see* the motion), a **.webm** (for Sam), and a **numeric timeline + change signals** (opacity /
transform / bbox over time; pixel-diff for 3D canvases). A judge agent rules pass/fail from that evidence, and failures
feed a fix loop. See `references/verification-rubric.md`.

## Procedure (what you do when invoked)

1. **Take the goal.** Everything after `/goal` is the run goal (free text). If empty, use:
   *"Review the portfolio and make the highest-impact improvements for a junior contract dev targeting agencies."*
   Flags: if the user says "plan only" / "don't ship" / "no PR", set `ship:false`.

2. **Scout briefly (inline, cheap).** Confirm the repo is intact: `project/` (Next.js app) and `index.html` exist, and
   `git status` is sane. Don't deep-dive — the workflow's Audit phase does that.

3. **Make a runId** (the workflow can't read the clock — you must):
   ```bash
   git -C "<repoRoot>" rev-parse --short HEAD >/dev/null 2>&1
   date +%Y%m%d-%H%M%S
   ```
   Use `goal-<that timestamp>` (or fall back to a short unique string) as `runId`.

4. **Launch the workflow.** Call the **Workflow** tool with the script on disk and the run args. (This skill explicitly
   authorizes the Workflow call.)
   ```
   Workflow({
     scriptPath: "<repoRoot>/.claude/skills/goal/goal.workflow.js",
     args: {
       goal:        "<the run goal>",
       runId:       "goal-<timestamp>",
       repoRoot:    "<absolute repo root>",
       projectDir:  "<repoRoot>/project",
       skillDir:    "<repoRoot>/.claude/skills/goal",
       artifactsDir:"<repoRoot>/project/.goal-artifacts/goal-<timestamp>",
       ship:        true
     }
   })
   ```
   Use absolute paths. The workflow runs in the background and notifies you on completion; you can watch live with
   `/workflows`.

5. **Relay the result** (the workflow returns a structured report). Tell Sam:
   - which site it built on and why (canonicalTarget + rationale),
   - the tasks built and key features added,
   - **verification**: did it build? which animations passed/failed? — and **Read 2–3 montages** from
     `verification.montages` so you can confirm the motion yourself and show Sam what you saw,
   - the **PR URL** + that the branch has a **Vercel preview deployment**,
   - **action Sam must take**: set `NEXT_PUBLIC_CAL_LINK` (Cal.com/Calendly handle) in Vercel so "Book a call" goes
     live; optionally `GITHUB_TOKEN` for the analytics report's rate limits.
   - If verification did not fully pass, say so plainly (the PR will be a draft) and summarize the open `fixHint`s.

## Notes
- **Build is sequential on purpose** — the tasks share one Next.js codebase, so editing them one-by-one (with
  disjoint-file ownership assigned by the planner) avoids merge races. Audit, research, and verification run in parallel.
- **Requirements live in `references/`** (audience, feature scope incl. book-a-call, design bar, deploy, rubric). The
  workflow's agents read them. To change what `/goal` builds, edit those files — not the workflow.
- **Iterating on the workflow:** edit `goal.workflow.js` then re-run; to resume a stopped run cheaply, relaunch
  `Workflow({scriptPath, resumeFromRunId})` so unchanged phases return cached results.
- **First-time setup** (only if the harness folder is fresh): `cd .claude/skills/goal/playwright && npm install &&
  npx playwright install chromium && npm run selftest`. (Already done in this repo.)

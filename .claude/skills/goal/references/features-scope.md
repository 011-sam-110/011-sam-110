# Feature scope — what /goal should build toward

The planner treats the **Must-have** list as requirements and uses research + audit findings to choose the rest.
All features must be static-export-*or*-Vercel safe; Vercel (SSR + API routes) is the deploy target so live data is OK.

## Must-have features
1. **Clean foundation.** Remove the duplicate component cruft in `project/components` (flat `Hero.tsx` vs `Hero/index.tsx`,
   etc.). Keep whichever the app imports; delete the rest; fix imports; app must `npm run build` cleanly.
2. **Live GitHub analytics report.** A real data report (not vanity badges):
   - A Next.js **API route** (`app/api/github/route.ts`) that fetches from the GitHub REST/GraphQL API for user
     `011-sam-110` (use `process.env.GITHUB_TOKEN` if present to avoid rate limits; degrade gracefully without it).
   - Surface: language breakdown, repo/commit activity over time, stars/forks, most-active repos. Cache sensibly
     (Next.js `revalidate`).
   - Render client-side charts (lightweight — e.g. a small charting lib or hand-rolled SVG/Canvas). Must be readable on
     mobile and have an empty/error state.
3. **Project case studies.** Turn each entry in `project/lib/data.ts` into a proper case-study view (modal or
   `/work/[id]` route): problem → approach → architecture → result/metrics → links to code/demo. This is the single
   highest-signal thing for the hiring audience.
4. **Polished 3D hero.** A performant React-Three-Fiber hero (the app already depends on `@react-three/fiber`,
   `drei`, `postprocessing`). Must: lazy-load, respect `prefers-reduced-motion`, hit ~60fps on a laptop, and never
   block first contentful paint. Subtlety over spectacle.
5. **"Book a call" CTA.** A dedicated booking section + a primary nav CTA:
   - Default: **Cal.com inline embed** via `@calcom/embed-react`, reading `NEXT_PUBLIC_CAL_LINK` (e.g. `"sam-poplett/15min"`).
   - If `NEXT_PUBLIC_CAL_LINK` is unset, render a graceful fallback: a "Book a call" button that opens a mailto with a
     pre-filled subject, plus the email. The component must build and look intentional in BOTH states.
   - Calendly is an acceptable swap (`react-calendly`) if research/agent judges it better — keep it env-configurable.
   - Place the CTA above the fold (nav) and as a full section before the footer.

## Strongly encouraged (pull from research, prioritise by audience fit)
- An "Open to contracts / grad roles" availability badge.
- Reveal-on-scroll for sections + tasteful micro-interactions (hover lifts, magnetic buttons) — all reduced-motion safe.
- Real proof-of-work: contribution graph, "what I'm building now", links to live demos.
- Fast, accessible contact (booking + email + GitHub + the existing MonkeyType flourish, kept subtle).

## Hard constraints
- TypeScript stays clean; `npm run build` must pass — the Verify phase enforces this.
- No secrets committed. Tokens come from env (`GITHUB_TOKEN`, `NEXT_PUBLIC_CAL_LINK`) set in Vercel.
- Every new/changed animation MUST be added to the plan's `animationTargets` so Verify can prove it works.
- Mobile-first: everything must be usable and unbroken at 390px wide.

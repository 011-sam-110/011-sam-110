# Design bar, deploy & config conventions

## Design bar
Two design skills are vendored in this repo — **read and apply them** for any UI/motion work:
- `.claude/skills/animate` (Emil Kowalski's "Animations on the Web") — easing, timing, when NOT to animate,
  performance, reduced-motion.
- `.claude/skills/emil-design-eng` — UI polish, the invisible details that make software feel intentional.

Principles to hold the line on:
- **Motion has a job.** It guides attention or expresses state. Decoration that distracts = cut it.
- **Performance is a feature.** Lazy-load 3D, keep the main thread free, never block first paint. Target ~60fps.
- **Respect `prefers-reduced-motion`.** Every animation needs a calm fallback.
- **Restraint reads as senior.** Tight type, real spacing rhythm, few accent colours (the brand orange `#FF6B35` is
  established), consistent radii/shadows. Avoid the generic AI-template look.
- **Accessibility:** focus states, keyboard-reachable booking CTA, alt text, sufficient contrast.

## Deploy (Vercel)
- The app deploys to **Vercel**. Pushing the `goal/<runId>` branch yields a **preview deployment**; merging to the
  default branch yields **production**. `/goal` opens a PR and never auto-merges to production.
- Environment variables (set in the Vercel dashboard, never committed):
  - `GITHUB_TOKEN` — optional, raises GitHub API rate limits for the analytics report. App must degrade gracefully if absent.
  - `NEXT_PUBLIC_CAL_LINK` — the Cal.com booking handle for "Book a call" (e.g. `sam-poplett/15min`). If unset, the
    booking component shows the mailto fallback.
- If the live `index.html` GitHub Pages site is being replaced, do NOT delete it in the same PR without calling it out —
  surface the cutover as an explicit step for Sam to approve.

## Booking config (one-time, by Sam)
1. Create a free Cal.com account, make an event type (e.g. "15 min intro call"), copy the handle `username/event`.
2. Set `NEXT_PUBLIC_CAL_LINK` in Vercel (and `.env.local` for local dev).
3. Redeploy. The inline embed goes live; no code change needed.
(Calendly alternative: swap `@calcom/embed-react` for `react-calendly` and point it at the scheduling URL — keep it
env-driven.)

## Autonomy boundaries (this run mode = fully autonomous)
- Build, fix, and verify without stopping.
- Commit to a **branch** and open a **PR** automatically — these are reversible and give a preview URL.
- Do **not**: merge to production, delete the legacy live site silently, hardcode secrets, or push to the default branch.

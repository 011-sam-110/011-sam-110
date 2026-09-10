# Exemplar portfolios — research seeds

Research agents should study **currently excellent** developer portfolios and award-winning sites, then extract
*implementable* patterns (not pixel copies). These are starting points — find fresh, live examples too. Always cite
the real source for each feature you recommend.

## Seed sources to search / inspect
- **Awwwards / Godly / Httpster / Land-book** — filter for "portfolio" and "developer". Look at Site of the Day winners.
- **Personal sites frequently cited as best-in-class devs:** Brittany Chiang (brittanychiang.com), Bruno Simon
  (bruno-simon.com — the 3D one), Lynn Fisher (lynnandtonic.com), Cassie Evans (cassie.codes — SVG/GSAP motion),
  Josh Comeau (joshwcomeau.com — interactions), Rauno Freiberg (rauno.me), Paco Coursey (paco.me), Emil Kowalski
  (emilkowalski.com — whose design skill is vendored here).
- **3D / R3F showcases:** the React Three Fiber "Showcase" gallery, pmndrs examples, Codrops "Playground" / tutorials.
- **GitHub-data portfolios:** sites embedding live contribution data, language stats, and activity dashboards.
- **"Hire me" conversion patterns:** how freelancers/contractors surface availability + a booking link (Cal.com /
  Calendly), and how agencies present case studies.

## What to extract (per lens)
- The *mechanism*, not the vibe: "magnetic buttons via pointer-tracked transform", "section reveals via IntersectionObserver
  + Framer Motion stagger", "R3F hero with depth-of-field bloom, lazy-mounted below the fold".
- Whether it survives on **mobile** and with **reduced motion**.
- Whether it actually helps a *junior contract dev get hired* (the bar — see audience-brief.md), or is just flashy.
- Effort to implement in this stack (Next 14 + R3F + Framer Motion + GSAP + Lenis).

## Anti-patterns to flag and avoid
- Heavy 3D that tanks Lighthouse / mobile, or blocks first paint.
- Auto-playing audio, scroll-jacking that fights the user, motion with no reduced-motion fallback.
- Generic AI-template aesthetics (centered hero + three feature cards + gradient blob). Distinctiveness is a signal.
- Vanity metrics with no substance. Prefer real data (the GitHub analytics report) over decorative badges.

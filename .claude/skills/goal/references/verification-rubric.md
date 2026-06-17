# Verification rubric — what "verified" means

Verify has two layers. The **probe** (`animation-probe.mjs`) produces machine evidence; the **judge agent** rules on
correctness from that evidence. Never pass an animation on "it probably works" — pass it on what the montage + timeline
actually show.

## Evidence the probe produces (per animation target)
- `montage.png` — frames laid out left→right, top→bottom = the motion as a single time-lapse image. **Read it.**
- `<id>.webm` — the recorded clip (for the human; you cannot watch it, use the montage).
- `result.json`:
  - `signals.didAnimate` — true if motion was detected at all.
  - `signals.pixelsMoved` / `distinctFrames` — frame-to-frame pixel change (the ONLY signal for WebGL/3D canvases,
    whose motion never shows up in DOM styles).
  - `signals.opacityChanged` + `opacityRange`, `signals.transformChanged`, `signals.bboxMoved` + `bboxTravelPx`.
  - `timeline[]` — per-tick opacity / transform / bounding-box of the observed element.
  - `consoleErrors[]` — page/WebGL/runtime errors seen during the capture.

## Judge criteria (return pass only if ALL hold)
1. **It animates.** `didAnimate` is true and the montage visibly changes across frames. A static montage = fail
   (animation never fired, was off-screen, or is broken).
2. **Right element, right direction.** The thing that moves is the intended element, moving the intended way
   (e.g. headline *fades in AND slides up*; 3D scene *rotates continuously*; cards *stagger in on scroll*). Match
   against the target's `expect` hints and the design intent.
3. **Correct end state.** The final frame is the intended resting state (e.g. opacity ≈ 1, element settled in place,
   not stuck mid-transition, not invisible).
4. **Smooth, not broken.** No obvious jank/teleport, no `NaN`/`matrix(NaN...)` transforms, no layout thrash.
5. **No errors.** `consoleErrors` is empty (especially no WebGL context-lost / React hydration / 3D loader errors).

For a 3D canvas specifically: DOM props won't change — rely on `pixelsMoved`/`distinctFrames` for "is it animating"
and the montage for "is it the right scene, rendering without artifacts".

## Static / responsive checks (separate from animation)
- App **builds** (`npm run build` exit 0). A broken build fails the whole run regardless of animations.
- Desktop (1440×900) and mobile (390×844) full-page screenshots: no overflow, overlap, invisible text, or broken
  layout. Content readable at 390px.
- No uncaught console errors on load.

## On failure
Return a concrete `fixHint`: the **file** and the **change** (e.g. "Hero/index.tsx: the IntersectionObserver threshold
is 1.0 so the reveal never triggers above the fold — lower to 0.2", or "Hero3DScene: rotation runs in a `useEffect`
that never re-runs; drive it from `useFrame` instead"). The fix loop feeds this straight back to a builder.

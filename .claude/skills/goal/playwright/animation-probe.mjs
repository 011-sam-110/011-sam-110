#!/usr/bin/env node
// ---------------------------------------------------------------------------
// animation-probe.mjs  —  the centerpiece of /goal's verification.
//
// An agent can VIEW png/jpg (via Read) but CANNOT watch a video. So instead of
// asking an agent to "see" motion, this probe turns TIME into SPACE + NUMBERS:
//
//   - a timed PNG frame sequence          frame-000.png ... frame-NNN.png
//   - one montage / contact-sheet image   montage.png   (ffmpeg tiles the frames)
//   - a recorded video                    <id>.webm     (for the HUMAN to watch)
//   - a numeric motion timeline           result.json   (computed styles + bbox
//                                                         per tick; canvas pixel-diff)
//   - change signals                      did opacity / transform / bbox / canvas
//                                          pixels actually move?
//
// The probe PROVES "something moved". A verifier AGENT then Reads montage.png +
// result.json and judges CORRECTNESS — right element, right direction, smooth,
// correct end-state, no console errors. Two layers: quantitative + semantic.
//
// Usage:
//   node animation-probe.mjs --url http://localhost:3000 --targets targets.json --out ./artifacts
//   node animation-probe.mjs --selftest [--out ./selftest-out]
//
// --selftest spins up a known CSS + canvas animation via setContent (no server,
// no site) and asserts the harness captures frames, a montage, a video, and the
// right change signals. Run it once after install to prove the rig works.
// ---------------------------------------------------------------------------

import { chromium } from 'playwright'
import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync, existsSync, copyFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

// ---- tiny arg parser -------------------------------------------------------
function parseArgs(argv) {
  const a = {}
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i]
    if (k.startsWith('--')) {
      const key = k.slice(2)
      const next = argv[i + 1]
      if (next === undefined || next.startsWith('--')) { a[key] = true }
      else { a[key] = next; i++ }
    }
  }
  return a
}

// ---- fast non-crypto hash for frame buffers (FNV-1a) -----------------------
function hashBuf(buf) {
  let h = 0x811c9dc5
  for (let i = 0; i < buf.length; i++) {
    h ^= buf[i]
    h = (h * 0x01000193) >>> 0
  }
  return h.toString(16)
}

const pad = (n) => String(n).padStart(3, '0')

// ---- scroll something into view, smooth-scroll libraries included ----------
async function scrollIntoView(page, selector) {
  if (!selector) return
  await page.evaluate(async (sel) => {
    const el = document.querySelector(sel)
    if (!el) return
    // Lenis / smooth-scroll libs hijack the wheel; nudge in steps so they settle.
    const target = el.getBoundingClientRect().top + window.scrollY - 80
    const steps = 14
    for (let i = 1; i <= steps; i++) {
      window.scrollTo(0, (target * i) / steps)
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 40))
    }
    el.scrollIntoView({ behavior: 'auto', block: 'center' })
  }, selector)
  await page.waitForTimeout(350)
}

// ---- sweep the REAL mouse across an element for pointer-driven motion ------
// Magnetic / cursor-follow interactions only move while the pointer moves over
// the element (onPointerMove). A one-shot center hover settles back to 0, so we
// sweep across the bbox firing genuine pointermove events and END off-center,
// leaving a non-zero (capped) spring transform present when sampling begins.
async function pointerSweep(page, selector) {
  const box = await page.locator(selector).first().boundingBox({ timeout: 5000 })
  if (!box) return
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2
  // Approach from outside, cross the element corner-to-corner in steps (each
  // mouse.move emits a pointermove), then rest near a corner so the magnetic
  // pull is at its capped maximum rather than ~0 at dead center.
  await page.mouse.move(box.x - 30, box.y - 30)
  const pts = [
    [box.x + box.width * 0.2, box.y + box.height * 0.3],
    [cx, cy],
    [box.x + box.width * 0.85, box.y + box.height * 0.75],
    [box.x + box.width * 0.85, box.y + box.height * 0.25],
  ]
  for (const [px, py] of pts) {
    // eslint-disable-next-line no-await-in-loop
    await page.mouse.move(px, py, { steps: 6 })
    // eslint-disable-next-line no-await-in-loop
    await page.waitForTimeout(60)
  }
  // Hold off-center so the spring keeps a steady non-zero displacement.
  await page.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.15, { steps: 4 })
}

// ---- run one animation target, return its evidence record ------------------
async function probeTarget(browser, baseUrl, target, outDir, opts) {
  const id = target.id || 'target'
  const dir = join(outDir, id)
  mkdirSync(dir, { recursive: true })
  const videoDir = join(dir, '_video')
  mkdirSync(videoDir, { recursive: true })

  const viewport = target.viewport || opts.viewport || { width: 1440, height: 900 }
  const durationMs = target.durationMs || opts.durationMs || 2500
  const fps = target.fps || opts.fps || 6
  const step = Math.max(60, Math.round(1000 / fps))

  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    recordVideo: { dir: videoDir, size: viewport },
  })
  const page = await context.newPage()

  const consoleErrors = []
  page.on('pageerror', (e) => consoleErrors.push(String(e)))
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })

  // navigate (skip for selftest, which sets content directly)
  if (opts.setContent) {
    await page.setContent(opts.setContent, { waitUntil: 'load' })
  } else {
    // Per-target URL lets one probe run hit multiple routes (e.g. /work/<id>
    // for a case-study page) while sharing one server. Falls back to --url.
    const navUrl = target.url || baseUrl
    // Wait for 'load', not 'networkidle': the hero runs a continuous R3F RAF
    // loop, so the page NEVER reaches network-idle and goto would time out
    // (the prior 60s timeout console error). 'domcontentloaded' + a short
    // settle is enough for the components to mount and start animating.
    await page.goto(navUrl, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {})
    // 'load' targets want to CATCH an entrance tween that fires on mount, so we
    // wait only long enough for hydration to kick the animation off, then start
    // sampling immediately to record the fade/slide from its hidden start.
    // scroll/pointer targets are below the fold or interaction-driven, so a
    // longer settle (mount everything, let the hero RAF spin up) is fine.
    const settle = (target.trigger && target.trigger.type === 'load') ? 250 : 900
    await page.waitForTimeout(settle)
  }

  // trigger the animation
  const trig = target.trigger || { type: 'load' }
  try {
    if (trig.type === 'scrollTo') await scrollIntoView(page, trig.selector || (target.observe && target.observe.selector))
    else if (trig.type === 'hover' && trig.selector) await page.hover(trig.selector, { timeout: 5000 })
    else if (trig.type === 'click' && trig.selector) await page.click(trig.selector, { timeout: 5000 })
    else if (trig.type === 'pointerSweep' && trig.selector) await pointerSweep(page, trig.selector)
    // 'load' => nothing; we just start sampling
  } catch (e) {
    consoleErrors.push('trigger-failed: ' + String(e))
  }

  // sample loop: frames + numeric timeline
  const observe = target.observe || {}
  const sel = observe.selector
  const frames = []
  const timeline = []
  const nSamples = Math.max(2, Math.round(durationMs / step))
  // For pointer-driven (magnetic / cursor-follow) targets, keep the pointer
  // moving DURING sampling — a static hold would settle to one transform and
  // read as "no motion". We oscillate the mouse across the element's bbox each
  // frame so the spring transform varies frame-to-frame and is observable.
  let sweepBox = null
  if (trig.type === 'pointerSweep' && trig.selector) {
    sweepBox = await page.locator(trig.selector).first().boundingBox({ timeout: 2000 }).catch(() => null)
  }
  for (let i = 0; i < nSamples; i++) {
    if (sweepBox) {
      // Lissajous-ish path across the button so x AND y offsets both vary.
      const fx = 0.5 + 0.45 * Math.sin(i * 0.9)
      const fy = 0.5 + 0.45 * Math.cos(i * 0.7)
      await page.mouse.move(
        sweepBox.x + sweepBox.width * fx,
        sweepBox.y + sweepBox.height * fy,
        { steps: 3 }
      )
    }
    const file = join(dir, `frame-${pad(i)}.png`)
    // element clip when we have a selector and it's visible; else full viewport
    let clipped = false
    if (sel) {
      try {
        const box = await page.locator(sel).first().boundingBox({ timeout: 1000 })
        if (box && box.width > 2 && box.height > 2) {
          // pad the clip so motion that leaves the box is still visible
          const px = Math.min(box.x, 40), py = Math.min(box.y, 40)
          await page.screenshot({
            path: file,
            clip: {
              x: Math.max(0, box.x - px),
              y: Math.max(0, box.y - py),
              width: Math.min(viewport.width, box.width + px * 2),
              height: Math.min(viewport.height, box.height + py * 2),
            },
          })
          clipped = true
        }
      } catch { /* fall through to full-viewport */ }
    }
    if (!clipped) await page.screenshot({ path: file })

    const buf = readFileSync(file)
    frames.push({ i, file, hash: hashBuf(buf), bytes: buf.length })

    // numeric state of the observed element
    if (sel) {
      const snap = await page.evaluate((s) => {
        const el = document.querySelector(s)
        if (!el) return null
        const cs = getComputedStyle(el)
        const r = el.getBoundingClientRect()
        return {
          opacity: parseFloat(cs.opacity),
          transform: cs.transform,
          top: Math.round(r.top), left: Math.round(r.left),
          width: Math.round(r.width), height: Math.round(r.height),
        }
      }, sel).catch(() => null)
      timeline.push({ t: i * step, ...(snap || {}) })
    } else {
      timeline.push({ t: i * step })
    }
    await page.waitForTimeout(step)
  }

  await context.close() // flushes the video

  // locate + rename the recorded video
  let videoOut = null
  try {
    const webm = readdirSync(videoDir).find((f) => f.endsWith('.webm'))
    if (webm) {
      videoOut = join(dir, `${id}.webm`)
      copyFileSync(join(videoDir, webm), videoOut)
    }
  } catch { /* non-fatal */ }
  try { rmSync(videoDir, { recursive: true, force: true }) } catch {}

  // ---- compute change signals -------------------------------------------
  const distinctFrames = new Set(frames.map((f) => f.hash)).size
  const ops = timeline.map((t) => t.opacity).filter((v) => typeof v === 'number' && !Number.isNaN(v))
  const transforms = new Set(timeline.map((t) => t.transform).filter(Boolean))
  const tops = timeline.map((t) => t.top).filter((v) => typeof v === 'number')
  const lefts = timeline.map((t) => t.left).filter((v) => typeof v === 'number')
  const range = (arr) => (arr.length ? Math.max(...arr) - Math.min(...arr) : 0)

  const signals = {
    framesCaptured: frames.length,
    distinctFrames,                                   // >1 => pixels changed over time
    pixelsMoved: distinctFrames > 1,
    opacityChanged: range(ops) > 0.02,
    opacityRange: ops.length ? [Math.min(...ops), Math.max(...ops)] : null,
    transformChanged: transforms.size > 1,
    bboxMoved: range(tops) > 1 || range(lefts) > 1,
    bboxTravelPx: Math.round(Math.max(range(tops), range(lefts))),
    isCanvas: !!observe.isCanvas,
  }
  // For a WebGL/3D canvas the DOM props won't change — pixel motion is the signal.
  signals.didAnimate = observe.isCanvas ? signals.pixelsMoved
    : (signals.opacityChanged || signals.transformChanged || signals.bboxMoved || signals.pixelsMoved)

  // ---- ffmpeg montage (one image an agent can Read in a single shot) -----
  let montage = null
  try { montage = buildMontage(dir, frames.length) } catch (e) { /* non-fatal */ }

  const result = {
    id,
    url: opts.setContent ? '(setContent)' : baseUrl,
    trigger: trig,
    observe,
    durationMs, fps, step,
    frames: frames.map((f) => f.file),
    montage,
    video: videoOut,
    timeline,
    signals,
    consoleErrors,
    expect: target.expect || {},
  }
  writeFileSync(join(dir, 'result.json'), JSON.stringify(result, null, 2))
  return result
}

// ---- tile frames into a single contact sheet via ffmpeg --------------------
function buildMontage(dir, n) {
  if (n < 1) return null
  const cols = Math.min(4, n)
  const rows = Math.ceil(n / cols)
  const need = cols * rows
  // ffmpeg `tile` only emits once it has cols*rows inputs: pad with the last frame.
  for (let i = n; i < need; i++) {
    copyFileSync(join(dir, `frame-${pad(n - 1)}.png`), join(dir, `frame-${pad(i)}.png`))
  }
  const out = join(dir, 'montage.png')
  // Run ffmpeg from inside `dir` so ONLY 'frame-%03d.png' is printf-parsed by the
  // image2 demuxer — never the directory path (which may contain spaces / %).
  const r = spawnSync('ffmpeg', [
    '-y', '-framerate', '1',
    '-i', 'frame-%03d.png',
    '-frames:v', '1',
    '-vf', `scale=360:-1,tile=${cols}x${rows}:margin=6:padding=4:color=0x111111`,
    'montage.png',
  ], { encoding: 'utf8', cwd: dir })
  // remove pad frames so they don't pollute the real sequence
  for (let i = n; i < need; i++) {
    try { rmSync(join(dir, `frame-${pad(i)}.png`)) } catch {}
  }
  if (r.status !== 0 || !existsSync(out)) return null
  return out
}

// ---- self-test: a known fade+slide headline and a rotating canvas ---------
const SELFTEST_HTML = `<!doctype html><html><head><style>
  html,body{margin:0;background:#0d1117;height:200vh;font-family:sans-serif}
  .hero{height:100vh;display:flex;align-items:center;justify-content:center}
  h1{color:#FF6B35;font-size:48px;opacity:0;transform:translateY(60px);
     animation:rise 1.6s ease forwards}
  @keyframes rise{to{opacity:1;transform:translateY(0)}}
  canvas{position:fixed;top:20px;right:20px;border:1px solid #333}
</style></head><body>
  <div class="hero"><h1 id="headline">Sam Poplett</h1></div>
  <canvas id="c" width="160" height="160"></canvas>
  <script>
    const ctx = document.getElementById('c').getContext('2d')
    let a = 0
    function loop(){ a += 0.05; ctx.clearRect(0,0,160,160); ctx.save();
      ctx.translate(80,80); ctx.rotate(a); ctx.fillStyle='#06b6d4';
      ctx.fillRect(-40,-40,80,80); ctx.restore(); requestAnimationFrame(loop) }
    loop()
  </script></body></html>`

async function selftest(outDir) {
  const browser = await chromium.launch()
  const targets = [
    { id: 'headline', trigger: { type: 'load' },
      observe: { selector: '#headline', props: ['opacity', 'transform'] },
      expect: { fadesIn: true, slidesUp: true } },
    { id: 'canvas', trigger: { type: 'load' },
      observe: { selector: '#c', isCanvas: true }, expect: { rotates: true } },
  ]
  const results = []
  for (const t of targets) {
    // eslint-disable-next-line no-await-in-loop
    results.push(await probeTarget(browser, 'about:blank', t, outDir,
      { setContent: SELFTEST_HTML, durationMs: 2000, fps: 6 }))
  }
  await browser.close()

  const head = results.find((r) => r.id === 'headline')
  const can = results.find((r) => r.id === 'canvas')
  const checks = [
    ['headline frames captured', head.signals.framesCaptured >= 4],
    ['headline opacity rose', head.signals.opacityChanged],
    ['headline moved (transform or bbox)', head.signals.transformChanged || head.signals.bboxMoved],
    ['headline montage built', !!head.montage],
    ['headline video recorded', !!head.video],
    ['canvas pixels animated', can.signals.pixelsMoved],
    ['no console errors', head.consoleErrors.length === 0 && can.consoleErrors.length === 0],
  ]
  let ok = true
  console.log('\n=== animation-probe self-test ===')
  for (const [name, pass] of checks) { console.log(`  [${pass ? 'PASS' : 'FAIL'}] ${name}`); if (!pass) ok = false }
  console.log(`\nArtifacts: ${outDir}`)
  console.log(ok ? '\nSELF-TEST PASSED ✅\n' : '\nSELF-TEST FAILED ❌\n')
  process.exit(ok ? 0 : 1)
}

// ---- main ------------------------------------------------------------------
async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (args.selftest) {
    const here = fileURLToPath(new URL('.', import.meta.url))
    const out = args.out || join(here, 'selftest-out')
    mkdirSync(out, { recursive: true })
    await selftest(out)
    return
  }

  if (!args.url || !args.targets || !args.out) {
    console.error('Usage: node animation-probe.mjs --url <url> --targets <targets.json> --out <dir>')
    console.error('   or: node animation-probe.mjs --selftest')
    process.exit(2)
  }

  const spec = JSON.parse(readFileSync(args.targets, 'utf8'))
  const outDir = args.out
  mkdirSync(outDir, { recursive: true })

  const browser = await chromium.launch()
  const opts = {
    viewport: spec.viewport || { width: 1440, height: 900 },
    durationMs: spec.durationMs || 2500,
    fps: spec.fps || 6,
  }
  const results = []
  for (const target of (spec.targets || [])) {
    // eslint-disable-next-line no-await-in-loop
    const r = await probeTarget(browser, args.url, target, outDir, opts).catch((e) => ({
      id: target.id, error: String(e), signals: { didAnimate: false }, consoleErrors: [String(e)],
    }))
    results.push(r)
    console.log(`probed ${r.id}: didAnimate=${r.signals && r.signals.didAnimate} ` +
      `montage=${r.montage ? 'yes' : 'no'} errors=${(r.consoleErrors || []).length}`)
  }
  await browser.close()

  const summaryPath = join(outDir, 'summary.json')
  writeFileSync(summaryPath, JSON.stringify({
    url: args.url,
    targets: results.map((r) => ({
      id: r.id, montage: r.montage, result: join(outDir, r.id || 'target', 'result.json'),
      video: r.video, didAnimate: r.signals && r.signals.didAnimate,
      consoleErrors: (r.consoleErrors || []).length, signals: r.signals,
    })),
  }, null, 2))
  console.log('\nwrote ' + summaryPath)
}

main().catch((e) => { console.error(e); process.exit(1) })

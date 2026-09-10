import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'

const OUT = process.argv[2]
const URL = process.argv[3] || 'http://localhost:3000'
mkdirSync(OUT, { recursive: true })

const shots = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
]

const allErrors = []
const browser = await chromium.launch()
const results = []
for (const s of shots) {
  const ctx = await browser.newContext({ viewport: { width: s.width, height: s.height }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  const errs = []
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
  page.on('pageerror', (e) => errs.push('pageerror: ' + (e && e.message ? e.message : String(e))))
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 }).catch((e) => errs.push('goto: ' + e.message))
  await page.waitForTimeout(3500)
  // trigger lazy/scroll-revealed sections by scrolling through the page
  await page.evaluate(async () => {
    await new Promise((res) => {
      let y = 0
      const step = () => {
        window.scrollBy(0, window.innerHeight)
        y += window.innerHeight
        if (y < document.body.scrollHeight) setTimeout(step, 200)
        else { window.scrollTo(0, 0); setTimeout(res, 600) }
      }
      step()
    })
  })
  await page.waitForTimeout(1200)
  const file = `${OUT}/${s.name}.png`
  await page.screenshot({ path: file, fullPage: true })
  results.push(file)
  for (const e of errs) allErrors.push(`[${s.name}] ${e}`)
  await ctx.close()
}
await browser.close()
writeFileSync(`${OUT}/console-errors.json`, JSON.stringify(allErrors, null, 2))
console.log('SHOTS:' + JSON.stringify(results))
console.log('ERRORS:' + JSON.stringify(allErrors))

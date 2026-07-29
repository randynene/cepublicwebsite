// Capture every /ask state for visual review against the design reference.
//
// Desktop frames are shot at 1440x900 and the two mobile frames at 390x844, the
// exact sizes the reference HTML draws.
//
// Shots are taken with `prefers-reduced-motion: reduce` rather than by pausing
// animations. Pausing freezes each rotator card at whatever opacity its negative
// delay lands on, so several cards print on top of each other; the reduced-motion
// path is the one the CSS is actually designed for (one card, held still) and
// taking the shots through it doubles as a check that the path works.
//
// Playwright is NOT a dependency of this project - it is installed ad hoc for a
// review pass so the site's install stays light:
//
//   cd site
//   npm i -D --no-save playwright && npx playwright install chromium --with-deps
//   npm run dev
//   node scripts/ask-shots.mjs [baseUrl] [outDir]
//
// Defaults to http://localhost:3000 and /tmp/ask-shots.

import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'

const BASE = process.argv[2] ?? 'http://localhost:3000'
const OUT = process.argv[3] ?? '/tmp/ask-shots'

const SCREENS = [
  ['S1', 'desktop'],
  ['S2', 'desktop'],
  ['S3', 'desktop'],
  ['S4', 'desktop'],
  ['S5', 'desktop'],
  ['S6', 'desktop'],
  ['S7', 'desktop'],
  ['S8', 'desktop'],
  ['S9', 'mobile'],
  ['S10', 'mobile'],
]

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
}

const errors = []

await mkdir(OUT, { recursive: true })
const browser = await chromium.launch()

for (const [screen, kind] of SCREENS) {
  const page = await browser.newPage({
    viewport: VIEWPORTS[kind],
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  })
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`${screen}: ${message.text()}`)
  })
  page.on('pageerror', (error) => errors.push(`${screen}: ${error.message}`))

  await page.goto(`${BASE}/ask?askDebug=1&askState=${screen}`, {
    waitUntil: 'networkidle',
  })
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${OUT}/${screen}-${kind}-switcher.png` })

  // The switcher would cover the composer, so it is collapsed for the frame that
  // gets compared against the design.
  await page.getByRole('button', { name: 'Hide' }).click()
  await page.waitForTimeout(200)
  await page.screenshot({ path: `${OUT}/${screen}-${kind}.png` })
  await page.close()
}

// Responsiveness check: a desktop-designed state at phone width must fall back to
// the stacked layout rather than squeezing the split.
const responsive = await browser.newPage({
  viewport: VIEWPORTS.mobile,
  reducedMotion: 'reduce',
})
await responsive.goto(`${BASE}/ask`, { waitUntil: 'networkidle' })
await responsive.waitForTimeout(300)
await responsive.screenshot({ path: `${OUT}/S1-at-390.png` })
await responsive.close()

await browser.close()

if (errors.length > 0) {
  console.error(`Console/page errors:\n${errors.join('\n')}`)
  process.exitCode = 1
} else {
  console.log(`Captured ${SCREENS.length * 2 + 1} shots to ${OUT}, no console errors.`)
}

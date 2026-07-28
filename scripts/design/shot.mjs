/**
 * Hero screenshot helper.
 *
 * Local review aid for the 28 Jul hero-band work: renders a page at a real
 * desktop width and captures the first screen, so hero framing can be checked
 * against Seb's annotated screenshots instead of guessed at.
 *
 * Usage:
 *   node scripts/design/shot.mjs <path> <outfile> [width] [height]
 *   node scripts/design/shot.mjs /services/software-engineers /tmp/he.png 1920 1080
 */

import { chromium } from 'playwright'

const [, , path = '/', out = '/tmp/shot.png', w = '1920', h = '1080'] = process.argv
const BASE = process.env.SHOT_BASE ?? 'http://localhost:3120'

const browser = await chromium.launch()
const page = await browser.newPage({
  viewport: { width: Number(w), height: Number(h) },
  deviceScaleFactor: 1,
})
await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
// Let the marquee and any reveal transitions settle.
await page.waitForTimeout(2500)
await page.screenshot({ path: out })

// Measured geometry beats eyeballing a PNG.
const metrics = await page.evaluate(() => {
  const pick = (sel) => {
    const el = document.querySelector(sel)
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width) }
  }
  const logos = [...document.querySelectorAll('img[alt="Salmon"], img[alt="Tidal"]')]
    .slice(0, 4)
    .map((el) => {
      const r = el.getBoundingClientRect()
      return { alt: el.alt, left: Math.round(r.left), width: Math.round(r.width) }
    })
  return {
    viewport: window.innerWidth,
    h1: pick('h1'),
    heroWrap: pick('.hero .wrap, .home-hero > *'),
    trusted: pick('.he-trusted-inner, .trusted-inner'),
    logos,
    docHeight: document.documentElement.scrollHeight,
  }
})
console.log(JSON.stringify(metrics, null, 2))

await browser.close()

// Probe 1b — targeted screenshot capture of 2 representative blog posts.
// Combined with the existing AUDIT-1 capture for
// /scaling-teams/building-a-software-development-team-... the BLOG variant
// matrix has 3 representative captures total.
//
// Each URL is captured at 3 breakpoints (mobile/tablet/desktop) using
// waitUntil: 'networkidle' + a 2.5s hard delay to settle animations.

import { chromium, type ViewportSize } from 'playwright'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const BASE = 'https://cloudemployee.io'

const TARGETS = [
  {
    label: 'complex',
    slug: '/nearshoring-offshoring/7-benefits-of-outsourcing-web-development-for-startups',
    note: 'TL;DR + FAQ + author + inline images',
  },
  {
    label: 'sparse',
    slug: '/managing-engineers/how-peer-forums-are-changing-remote-work-at-cloud-employee',
    note: 'no TL;DR, no FAQ, no author (null-author rendering)',
  },
]

const BREAKPOINTS: Array<{ name: string; viewport: ViewportSize }> = [
  { name: 'mobile', viewport: { width: 390, height: 844 } },
  { name: 'tablet', viewport: { width: 768, height: 1024 } },
  { name: 'desktop', viewport: { width: 1440, height: 900 } },
]

const OUT_DIR = resolve(process.cwd(), 'audit-output/screenshots-template-blog')

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  try {
    for (const target of TARGETS) {
      const dir = resolve(OUT_DIR, target.label)
      mkdirSync(dir, { recursive: true })
      console.log(`\n→ ${target.label}: ${BASE}${target.slug}`)
      for (const bp of BREAKPOINTS) {
        const context = await browser.newContext({ viewport: bp.viewport })
        const page = await context.newPage()
        try {
          await page.goto(`${BASE}${target.slug}`, {
            waitUntil: 'networkidle',
            timeout: 60_000,
          })
          await page.waitForTimeout(2500)
          const path = resolve(dir, `${bp.name}.png`)
          await page.screenshot({ path, fullPage: true })
          console.log(`   ${bp.name}: ${path}`)
        } catch (err) {
          console.error(`   ${bp.name}: FAIL — ${(err as Error).message}`)
        } finally {
          await context.close()
        }
      }
    }
  } finally {
    await browser.close()
  }
  console.log('\n✓ Probe 1b capture complete.')
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})

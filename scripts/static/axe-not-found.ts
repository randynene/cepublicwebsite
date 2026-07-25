// MYGRATR-STATIC-1 Step 2 gate — axe-core a11y scan on the 404 page.
//
// Loads /this-does-not-exist in a headless browser, injects axe-core,
// runs the WCAG 2.1 AA ruleset, and exits non-zero if any violation
// surfaces. Same gate convention TEMPLATE-BLOG will adopt at QA-1.
//
// Requires:
//   - dev server running on http://localhost:3000
//   - playwright + axe-core resolvable from the working directory
//
// playwright lives at the workspace root (`node_modules/.bin/playwright`);
// axe-core is a transitive dep under `site/node_modules/axe-core`. The
// script reads axe.min.js from there and injects it into the page.

import { readFileSync } from 'node:fs'
import path from 'node:path'

import { chromium } from 'playwright'

const URL = 'http://localhost:3000/this-does-not-exist'

// axe-core lives in site/node_modules (transitive via @storybook/addon-a11y)
const AXE_PATH = path.resolve(
  process.cwd(),
  'site',
  'node_modules',
  'axe-core',
  'axe.min.js',
)

async function main() {
  const axeSource = readFileSync(AXE_PATH, 'utf-8')

  const browser = await chromium.launch()
  const ctx = await browser.newContext()
  const page = await ctx.newPage()

  // Per Tech Debt #6 — `networkidle` times out on this site because of
  // third-party widgets loaded sitewide (Clara, HubSpot, Geotargetly,
  // GSAP, etc.). `domcontentloaded` is the agreed substitute.
  const response = await page.goto(URL, { waitUntil: 'domcontentloaded' })
  const status = response?.status() ?? 0
  console.log(`HTTP status: ${status} (expected 404)`)

  await page.addScriptTag({ content: axeSource })

  const results = await page.evaluate(async () => {
    // @ts-expect-error — axe is injected at runtime
    return await window.axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
    })
  })

  await browser.close()

  type Violation = {
    id: string
    impact?: string
    description: string
    help: string
    helpUrl: string
    nodes: Array<{ target: string[]; html: string }>
  }
  const violations = results.violations as Violation[]

  console.log(`Violations: ${violations.length}`)
  for (const v of violations) {
    console.log(`  [${v.impact ?? '?'}] ${v.id} — ${v.help}`)
    for (const n of v.nodes) {
      console.log(`    target: ${n.target.join(', ')}`)
      console.log(`    html:   ${n.html.slice(0, 160)}`)
    }
    console.log(`    learn:  ${v.helpUrl}`)
  }

  const incomplete = results.incomplete as Array<{ id: string; help: string }>
  if (incomplete.length > 0) {
    console.log(`Incomplete checks (manual review): ${incomplete.length}`)
    for (const i of incomplete) console.log(`  ${i.id} — ${i.help}`)
  }

  if (status !== 404) {
    console.error('FAIL: HTTP status is not 404')
    process.exit(1)
  }
  if (violations.length > 0) {
    console.error('FAIL: axe-core found violations')
    process.exit(1)
  }
  console.log('PASS: HTTP 404 + zero axe violations')
}

main().catch((err) => {
  console.error('axe-not-found: FAILED', err)
  process.exit(1)
})

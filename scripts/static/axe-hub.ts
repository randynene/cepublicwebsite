// MYGRATR-STATIC-1 Step 4 — axe-core a11y scan on one or more hub URLs.
//
// Usage:
//   npx tsx scripts/static/axe-hub.ts /blog /services /technology /videos
// Or default to all 16 hubs if no args.

import { readFileSync } from 'node:fs'
import path from 'node:path'

import { chromium } from 'playwright'

const ALL_HUBS = [
  '/blog',
  '/staff-augmentation',
  '/nearshoring-offshoring',
  '/scaling-teams',
  '/hiring-tips',
  '/managing-engineers',
  '/ai-in-software-development',
  '/videos',
  '/tools',
  '/downloads',
  '/events',
  '/services',
  '/technology',
  '/customer-stories',
  '/reviews',
  '/compare',
]

const AXE_PATH = path.resolve(
  process.cwd(),
  'site',
  'node_modules',
  'axe-core',
  'axe.min.js',
)

type Violation = {
  id: string
  impact?: string
  description: string
  help: string
  helpUrl: string
  nodes: Array<{ target: string[]; html: string }>
}

async function main() {
  const argHubs = process.argv.slice(2)
  const hubs = argHubs.length > 0 ? argHubs : ALL_HUBS

  const axeSource = readFileSync(AXE_PATH, 'utf-8')
  const browser = await chromium.launch()
  const ctx = await browser.newContext()

  let totalViolations = 0
  for (const hubPath of hubs) {
    const page = await ctx.newPage()
    const url = `http://localhost:3000${hubPath}`
    const response = await page.goto(url, { waitUntil: 'domcontentloaded' })
    const status = response?.status() ?? 0
    await page.addScriptTag({ content: axeSource })
    const results = await page.evaluate(async () => {
      // @ts-expect-error — axe injected at runtime
      return await window.axe.run(document, {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
        },
      })
    })
    const violations = results.violations as Violation[]
    totalViolations += violations.length

    console.log(
      `${hubPath}: HTTP ${status}, ${violations.length} violations`,
    )
    for (const v of violations) {
      console.log(`  [${v.impact ?? '?'}] ${v.id} — ${v.help}`)
      for (const n of v.nodes.slice(0, 3)) {
        console.log(`    target: ${n.target.join(', ')}`)
        console.log(`    html:   ${n.html.slice(0, 200)}`)
      }
    }
    await page.close()
  }
  await browser.close()

  if (totalViolations === 0) {
    console.log(`\nPASS: ${hubs.length} hub URLs, zero axe violations`)
    process.exit(0)
  }
  console.error(`\nFAIL: ${totalViolations} total violations across ${hubs.length} URLs`)
  process.exit(1)
}

main().catch((err) => {
  console.error('axe-hub: FAILED', err)
  process.exit(1)
})

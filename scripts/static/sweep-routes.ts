// MYGRATR-STATIC-1 Step 6 — site-wide route + console sweep.
//
// Hits every category of route in dev, captures browser console output,
// confirms Header (role=banner) + Footer (role=contentinfo) present, and
// reports any console errors / hydration warnings / React key warnings.
//
// Acceptable warnings (filtered out): preload-cache-mode mismatch on
// third-party scripts (Tech Debt #21 cosmetic), Hotjar bot-detection,
// React DevTools install hint.

import { chromium } from 'playwright'

const ROUTES = [
  '/',
  '/blog',
  '/staff-augmentation',
  '/services',
  '/technology',
  '/videos',
  '/hiring-tips/the-reality-of-modern-tech-recruitment-a-broken-system',
  '/this-does-not-exist',
  '/uk',
  '/uk/blog',
  '/uk/hiring-tips/the-reality-of-modern-tech-recruitment-a-broken-system',
]

// Console messages to ignore (known cosmetic / third-party noise).
const IGNORE_PATTERNS = [
  /Download the React DevTools/i,
  /\[HMR\]/i,
  /preloaded using link preload but not used/i,
  /preload .* but is not used because the request credentials mode/i,
  /Hotjar not launching due to suspicious userAgent/i,
  /GL Driver Message/i,
  /GPU stall due to ReadPixels/i,
  /Sanity is live with automatic revalidation/i,
  /Failed to load resource: .* 404/i, // third-party assets blocked by headless
  /Failed to load resource: .* 403/i,
  /Failed to load resource: net::ERR_BLOCKED/i,
  /Tracking Prevention blocked/i,
  /Encountered a script tag while rendering React/i, // 3p script wrappers, Tech Debt #23
]

function isNoise(text: string): boolean {
  return IGNORE_PATTERNS.some((re) => re.test(text))
}

type RouteReport = {
  route: string
  httpStatus: number
  hasBanner: boolean
  hasFooter: boolean
  hasMainId: boolean
  hasSkipLink: boolean
  errors: string[]
  warnings: string[]
}

async function main() {
  const browser = await chromium.launch()
  const ctx = await browser.newContext()
  const reports: RouteReport[] = []

  for (const route of ROUTES) {
    const page = await ctx.newPage()
    const errors: string[] = []
    const warnings: string[] = []
    page.on('console', (msg) => {
      const text = msg.text()
      if (isNoise(text)) return
      if (msg.type() === 'error') errors.push(text)
      if (msg.type() === 'warning') warnings.push(text)
    })
    page.on('pageerror', (err) => {
      if (isNoise(err.message)) return
      errors.push(`PAGE_ERROR: ${err.message}`)
    })

    const response = await page.goto(`http://localhost:3000${route}`, {
      waitUntil: 'domcontentloaded',
    })
    await page.waitForTimeout(500)
    const httpStatus = response?.status() ?? 0
    const hasBanner = (await page.locator('[role="banner"]').count()) > 0
    const hasFooter = (await page.locator('[role="contentinfo"]').count()) > 0
    const hasMainId = (await page.locator('main#main').count()) > 0
    const hasSkipLink = (await page.locator('a[href="#main"]').count()) > 0

    reports.push({
      route,
      httpStatus,
      hasBanner,
      hasFooter,
      hasMainId,
      hasSkipLink,
      errors,
      warnings,
    })
    await page.close()
  }
  await browser.close()

  console.log('Route'.padEnd(85) + 'HTTP  banner footer #main skip  err warn')
  for (const r of reports) {
    const route = r.route.padEnd(84)
    const status = String(r.httpStatus).padEnd(5)
    const b = r.hasBanner ? '  Y ' : '  -  '
    const f = r.hasFooter ? '  Y  ' : '  -  '
    const m = r.hasMainId ? '  Y  ' : '  -  '
    const s = r.hasSkipLink ? '  Y  ' : '  -  '
    const e = String(r.errors.length).padStart(2)
    const w = String(r.warnings.length).padStart(2)
    console.log(`${route} ${status} ${b}  ${f}  ${m}  ${s}  ${e}   ${w}`)
  }

  // Print first error from each route, if any.
  let totalErr = 0
  for (const r of reports) {
    totalErr += r.errors.length
    if (r.errors.length > 0) {
      console.log(`\nErrors on ${r.route}:`)
      r.errors.slice(0, 5).forEach((e) => console.log(`  ${e.slice(0, 200)}`))
    }
  }

  // Per-route bookkeeping
  let totalIssues = 0
  for (const r of reports) {
    if (!r.hasBanner) {
      console.log(`MISSING banner on ${r.route}`)
      totalIssues++
    }
    if (!r.hasFooter) {
      console.log(`MISSING footer on ${r.route}`)
      totalIssues++
    }
    if (!r.hasMainId) {
      console.log(`MISSING #main on ${r.route}`)
      totalIssues++
    }
    if (!r.hasSkipLink) {
      console.log(`MISSING skip link on ${r.route}`)
      totalIssues++
    }
  }

  if (totalIssues === 0 && totalErr === 0) {
    console.log('\nPASS: every route has banner + footer + #main + skip link, zero console errors')
    process.exit(0)
  }
  console.error(`\nFAIL: ${totalIssues} chrome issues, ${totalErr} console errors`)
  process.exit(1)
}

main().catch((err) => {
  console.error('sweep-routes FAILED', err.message)
  process.exit(1)
})

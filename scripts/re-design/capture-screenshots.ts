// Re-design briefing — full-page screenshot capture across desktop / tablet /
// mobile viewports for cloudemployee.io. Pure read-only data collection.
//
// GeoTargetly + __name shim bypass pattern lifted from
// scripts/audit/static-2/extract-chrome.ts (lines 375-406). Captures land in
// docs/re-design/screenshots/<category>/<slug>__<viewport>.png. A JSON run
// log lands alongside at docs/re-design/screenshots/_run.json for the
// MANIFEST.md compiler.
//
// Run: `npx tsx scripts/re-design/capture-screenshots.ts`

import * as fs from 'node:fs/promises'
import * as path from 'node:path'

import type { Browser, BrowserContext, Page } from 'playwright'
import { chromium } from 'playwright'

// ────────────────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────────────────

const CE_HOST = 'https://www.cloudemployee.io'
const OUT_ROOT = path.resolve(process.cwd(), 'docs', 're-design', 'screenshots')
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

const PAGE_TIMEOUT_MS = 30_000
const POST_LOAD_SETTLE_MS = 1500

type ViewportName = 'desktop' | 'tablet' | 'mobile'

interface Viewport {
  name: ViewportName
  width: number
  height: number
  isMobile: boolean
}

const VIEWPORTS: Viewport[] = [
  { name: 'desktop', width: 1440, height: 900, isMobile: false },
  { name: 'tablet', width: 834, height: 1112, isMobile: false },
  { name: 'mobile', width: 390, height: 844, isMobile: true },
]

type Category = 'chrome' | 'marketing' | 'catalog-indexes' | 'catalog-details' | 'utility'

interface UrlSpec {
  slug: string
  path: string
  category: Category
  note?: string
}

// URLs to capture as standard fullPage screenshots across all 3 viewports.
const URLS: UrlSpec[] = [
  // MARKETING
  { slug: 'home', path: '/', category: 'marketing' },
  { slug: 'how-it-works', path: '/how-it-works', category: 'marketing' },
  { slug: 'about-us', path: '/about-us', category: 'marketing' },
  { slug: 'pricing', path: '/pricing', category: 'marketing' },
  { slug: 'contact', path: '/contact', category: 'marketing' },
  { slug: 'our-work', path: '/our-work', category: 'marketing' },
  // Second-round marketing additions (originally flagged as "live-nav URLs
  // not captured" in the first manifest pass).
  { slug: 'embedding', path: '/embedding', category: 'marketing' },
  { slug: 'sourcing', path: '/sourcing', category: 'marketing' },
  { slug: 'retention', path: '/retention', category: 'marketing' },
  { slug: 'for-developers', path: '/for-developers', category: 'marketing', note: 'careers landing — distinct template from team-member' },

  // CATALOG INDEXES (live nav uses /blog as canonical; /hiring-tips also exists as sub-hub)
  { slug: 'blog-index', path: '/blog', category: 'catalog-indexes', note: 'canonical blog index per live nav' },
  { slug: 'customer-stories-index', path: '/customer-stories', category: 'catalog-indexes' },
  { slug: 'services-index', path: '/services', category: 'catalog-indexes' },
  { slug: 'technology-index', path: '/technology', category: 'catalog-indexes' },
  { slug: 'reviews-index', path: '/reviews', category: 'catalog-indexes', note: 'reviews index — sibling to /customer-stories' },

  // CATALOG DETAILS (one representative per content type)
  {
    slug: 'blog-post',
    path: '/hiring-tips/hiring-developers-in-the-philippines-cost-quality-culture-fit-for-outsourced-software-development',
    category: 'catalog-details',
    note: 'live nav blog post (suggested slug from brief was not found on /blog)',
  },
  { slug: 'customer-story', path: '/customer-story/salmon-software', category: 'catalog-details' },
  { slug: 'service-detail', path: '/services/full-stack-developers', category: 'catalog-details' },
  { slug: 'technology-detail', path: '/technology/react-developers', category: 'catalog-details' },
  { slug: 'team-member', path: '/team/seb-hall', category: 'catalog-details' },
  { slug: 'review', path: '/reviews/salmon-software', category: 'catalog-details' },
  { slug: 'video', path: '/videos/hiring-one-dev-backed-by-200', category: 'catalog-details' },
  { slug: 'download', path: '/download/10-ai-prompts', category: 'catalog-details' },
  {
    slug: 'tool',
    path: '/tools/culture-match',
    category: 'catalog-details',
    note: '/tools/price-comparison-calculator silently redirected to /pricing — switched to /tools/culture-match as the only other Tool detail URL on the live /tools index',
  },
  // NOTE: /events index returns "No upcoming events" — no event detail to capture.
  { slug: 'book-a-call', path: '/book-a-call', category: 'catalog-details' },
  {
    slug: 'compare',
    path: '/compare/inhouse-hiring',
    category: 'catalog-details',
    note: 'first compare URL on /alternatives index; the more-specific cloud-employee-vs-toptal slug from WebFetch returned 404',
  },

  // UTILITY
  { slug: '404', path: '/this-does-not-exist-9z9z', category: 'utility', note: 'expected 404' },
  { slug: 'legal-privacy', path: '/legals/privacy-policy', category: 'utility' },
]

// Catalog details that have no public route on the live site — recorded
// directly into the run log as "skipped (no public URL)" rather than
// attempted.
const SKIPPED_NO_URL: { slug: string; reason: string; category: Category }[] = [
  { slug: 'event', reason: '/events index shows "No upcoming events at the moment" — no event detail URL exists', category: 'catalog-details' },
]

// ────────────────────────────────────────────────────────────────────────
// Run log shape (consumed by MANIFEST.md compiler)
// ────────────────────────────────────────────────────────────────────────

type CaptureStatus = 'success' | 'failed' | 'skipped'

interface CaptureResult {
  slug: string
  category: Category
  viewport: ViewportName
  url: string
  filePath: string
  status: CaptureStatus
  reason?: string
  landedUrl?: string
  fullPage?: boolean
}

interface RunLog {
  startedAt: string
  finishedAt: string
  results: CaptureResult[]
}

const results: CaptureResult[] = []

// ────────────────────────────────────────────────────────────────────────
// Browser setup — GeoTargetly bypass + __name shim
// ────────────────────────────────────────────────────────────────────────

async function makeContext(browser: Browser, vp: Viewport): Promise<BrowserContext> {
  const context = await browser.newContext({
    userAgent: USER_AGENT,
    locale: 'en-US',
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
    },
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
    isMobile: vp.isMobile,
    hasTouch: vp.isMobile,
  })

  // GeoTargetly short-circuit: stub the loader so the talent.cloudemployee.io
  // redirect never fires. Belt-and-braces with the en-US locale + header above.
  await context.route(/geotargetly\.com/, (route) => route.fulfill({ status: 200, body: '/* geotargetly stubbed */' }))

  // __name shim — tsx/esbuild emits `__name(fn, "name")` wrappers in
  // transpiled callbacks shipped to the browser; the browser has no __name
  // global, so without this every page.evaluate with a named arrow
  // ReferenceErrors. One-line no-op shim defends against that.
  await context.addInitScript(() => {
    ;(window as unknown as { __name: (fn: unknown) => unknown }).__name = (fn) => fn
  })

  return context
}

// ────────────────────────────────────────────────────────────────────────
// Navigation + page prep
// ────────────────────────────────────────────────────────────────────────

interface GotoResult {
  ok: boolean
  landedUrl: string
  is404: boolean
  reason?: string
}

async function gotoUrl(page: Page, url: string): Promise<GotoResult> {
  let response
  try {
    response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: PAGE_TIMEOUT_MS })
  } catch (err) {
    return { ok: false, landedUrl: page.url(), is404: false, reason: `goto error: ${(err as Error).message}` }
  }
  const status = response?.status() ?? 0
  const landed = page.url()
  // Webflow returns 200 even on slug-not-found pages that render a "page not
  // found" template, so the explicit /this-does-not-exist URL may resolve 200
  // with a 404-page body. Treat any explicit 404 status as is404; HTTP 308
  // chasing into a 404 page also surfaces here once Playwright follows the
  // redirect.
  const is404 = status === 404
  if (status >= 400 && !is404) {
    return { ok: false, landedUrl: landed, is404, reason: `HTTP ${status}` }
  }
  await page.waitForTimeout(POST_LOAD_SETTLE_MS)
  return { ok: true, landedUrl: landed, is404 }
}

// Common cookie-banner / consent dismissal. Tries a handful of well-known
// selectors and class fragments — silent no-op if none match.
async function dismissCookieBanner(page: Page): Promise<void> {
  const acceptSelectors = [
    'button#onetrust-accept-btn-handler',
    'button:has-text("Accept all")',
    'button:has-text("Accept All")',
    'button:has-text("Accept cookies")',
    'button:has-text("I accept")',
    'button:has-text("Got it")',
    '[aria-label="Accept cookies"]',
    '[class*="cookie" i] button:has-text("Accept")',
    '[class*="consent" i] button:has-text("Accept")',
  ]
  for (const sel of acceptSelectors) {
    try {
      const btn = await page.$(sel)
      if (btn && (await btn.isVisible())) {
        await btn.click({ timeout: 1500 }).catch(() => {})
        await page.waitForTimeout(400)
        return
      }
    } catch {
      // selector engine errors — ignore and continue
    }
  }
}

// After a chrome capture that opened a menu (mega-menu hover OR mobile
// drawer tap), explicitly close it before moving on: press Escape, park
// the cursor at (0, 0) so no `data-hover` trigger remains under the mouse,
// and wait long enough for any close-transition to run. Verifies any
// `aria-expanded="true"` triggers in the header have flipped back to
// `false` (best-effort — Webflow dropdowns often manage state via a CSS
// class on the parent rather than the trigger's aria attr, so we treat a
// timeout as a soft warning rather than a hard fail).
async function closeAnyOpenMenu(page: Page): Promise<void> {
  await page.keyboard.press('Escape').catch(() => {})
  await page.mouse.move(0, 0).catch(() => {})
  await page.waitForTimeout(400)
  // Best-effort verification: log if any header trigger still reports
  // aria-expanded=true. Don't block on it.
  try {
    const stillOpen = await page.evaluate(() => {
      const triggers = Array.from(document.querySelectorAll('header [aria-expanded="true"]'))
      return triggers.map((t) => (t as HTMLElement).textContent?.trim().slice(0, 40) ?? '')
    })
    if (stillOpen.length > 0) {
      console.warn(`    closeAnyOpenMenu: ${stillOpen.length} trigger(s) still aria-expanded=true: ${stillOpen.join(', ')}`)
    }
  } catch {
    // ignore
  }
}

// Webflow defaults to a chat widget overlay (Clara) that floats above the
// page. Hide it via CSS so it doesn't sit on every screenshot.
async function hideOverlayWidgets(page: Page): Promise<void> {
  await page
    .addStyleTag({
      content: `
        [id*="clara" i],
        [class*="clara" i],
        [id*="chat" i][style*="position: fixed"],
        [class*="chat-widget" i],
        iframe[src*="hsforms"][style*="display: none"] { display: none !important; }
      `,
    })
    .catch(() => {})
}

// ────────────────────────────────────────────────────────────────────────
// Capture primitives
// ────────────────────────────────────────────────────────────────────────

function ensureDir(p: string): Promise<void> {
  return fs.mkdir(path.dirname(p), { recursive: true }).then(() => undefined)
}

async function takeFullPage(page: Page, outPath: string): Promise<void> {
  await ensureDir(outPath)
  await page.screenshot({ path: outPath, fullPage: true, type: 'png' })
}

async function takeViewport(page: Page, outPath: string): Promise<void> {
  await ensureDir(outPath)
  await page.screenshot({ path: outPath, fullPage: false, type: 'png' })
}

// ────────────────────────────────────────────────────────────────────────
// Standard URL pass — one fullPage capture per (url × viewport)
// ────────────────────────────────────────────────────────────────────────

function outPathFor(category: Category, slug: string, vp: ViewportName): string {
  return path.join(OUT_ROOT, category, `${slug}__${vp}.png`)
}

async function captureUrl(page: Page, spec: UrlSpec, vp: Viewport): Promise<void> {
  const fullUrl = `${CE_HOST}${spec.path}`
  const outPath = outPathFor(spec.category, spec.slug, vp.name)
  const base: CaptureResult = {
    slug: spec.slug,
    category: spec.category,
    viewport: vp.name,
    url: fullUrl,
    filePath: path.relative(OUT_ROOT, outPath),
    status: 'failed',
    fullPage: true,
  }
  // STATE RESET (round-3 contamination fix): park the mouse cursor in the
  // top-left corner and load about:blank to drop any prior page's DOM +
  // hover state before navigating to the target. The original flow ran
  // mega-menu captures with `data-hover="true"` triggers; the cursor would
  // get parked over the Resources nav link, and Webflow's CSS-driven hover
  // dropdown would re-open the moment a new page's nav rendered under the
  // same coordinate — overlaying every subsequent page screenshot.
  await page.mouse.move(0, 0).catch(() => {})
  await page.goto('about:blank', { waitUntil: 'load', timeout: 5000 }).catch(() => {})
  const nav = await gotoUrl(page, fullUrl)
  base.landedUrl = nav.landedUrl
  if (nav.is404) {
    // 404 is expected for the explicit /this-does-not-exist URL — capture it.
    // For any other URL hitting 404, log + skip per brief.
    if (spec.slug === '404') {
      await dismissCookieBanner(page)
      await hideOverlayWidgets(page)
      try {
        await takeFullPage(page, outPath)
        results.push({ ...base, status: 'success' })
        console.log(`  ✓ ${spec.slug} @ ${vp.name} (404 page)`)
      } catch (err) {
        results.push({ ...base, status: 'failed', reason: (err as Error).message })
        console.warn(`  ✗ ${spec.slug} @ ${vp.name}: ${(err as Error).message}`)
      }
      return
    }
    results.push({ ...base, status: 'skipped', reason: '404 from live site' })
    console.warn(`  ⊘ ${spec.slug} @ ${vp.name}: 404 from live site`)
    return
  }
  if (!nav.ok) {
    results.push({ ...base, status: 'failed', reason: nav.reason })
    console.warn(`  ✗ ${spec.slug} @ ${vp.name}: ${nav.reason}`)
    return
  }
  try {
    await dismissCookieBanner(page)
    await hideOverlayWidgets(page)
    // Nudge lazy-loaded images: scroll to bottom + back to top, then settle.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)).catch(() => {})
    await page.waitForTimeout(800)
    await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {})
    await page.waitForTimeout(400)
    await takeFullPage(page, outPath)
    results.push({ ...base, status: 'success' })
    console.log(`  ✓ ${spec.slug} @ ${vp.name}`)
  } catch (err) {
    results.push({ ...base, status: 'failed', reason: (err as Error).message })
    console.warn(`  ✗ ${spec.slug} @ ${vp.name}: ${(err as Error).message}`)
  }
}

// ────────────────────────────────────────────────────────────────────────
// Chrome captures — header, scrolled header, footer, mega-menus, mobile drawer
// ────────────────────────────────────────────────────────────────────────

async function captureChromeFor(page: Page, vp: Viewport): Promise<void> {
  const homeUrl = `${CE_HOST}/`
  const nav = await gotoUrl(page, homeUrl)
  if (!nav.ok) {
    for (const slug of ['header', 'header-scroll', 'footer']) {
      results.push({
        slug,
        category: 'chrome',
        viewport: vp.name,
        url: homeUrl,
        filePath: path.relative(OUT_ROOT, outPathFor('chrome', slug, vp.name)),
        status: 'failed',
        reason: `home navigation failed: ${nav.reason}`,
      })
    }
    return
  }
  await dismissCookieBanner(page)
  await hideOverlayWidgets(page)
  await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {})
  await page.waitForTimeout(400)

  // header (scroll 0)
  await captureChromeShot(page, 'header', vp, async () => {
    await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {})
    await page.waitForTimeout(300)
  })

  // header-scroll (scroll y=500)
  await captureChromeShot(page, 'header-scroll', vp, async () => {
    await page.evaluate(() => window.scrollTo(0, 500)).catch(() => {})
    await page.waitForTimeout(400)
  })

  // footer (scroll to bottom; capture viewport)
  await captureChromeShot(page, 'footer', vp, async () => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)).catch(() => {})
    await page.waitForTimeout(800)
  })
}

async function captureChromeShot(
  page: Page,
  slug: 'header' | 'header-scroll' | 'footer',
  vp: Viewport,
  prep: () => Promise<void>,
): Promise<void> {
  const outPath = outPathFor('chrome', slug, vp.name)
  const base: CaptureResult = {
    slug,
    category: 'chrome',
    viewport: vp.name,
    url: `${CE_HOST}/`,
    filePath: path.relative(OUT_ROOT, outPath),
    status: 'failed',
    fullPage: false,
  }
  try {
    await prep()
    await takeViewport(page, outPath)
    results.push({ ...base, status: 'success' })
    console.log(`  ✓ chrome/${slug} @ ${vp.name}`)
  } catch (err) {
    results.push({ ...base, status: 'failed', reason: (err as Error).message })
    console.warn(`  ✗ chrome/${slug} @ ${vp.name}: ${(err as Error).message}`)
  }
}

// Desktop-only mega-menu captures. The triggers behave as hover dropdowns on
// the live site (Webflow `data-hover="true"`). Approach mirrors extract-chrome
// openDropdown(): hover first, click fallback. We don't need the panel-token
// dance from the audit script — we just need the panel visually present long
// enough for a screenshot.
async function captureMegaMenus(page: Page): Promise<void> {
  const triggers: { label: string; slug: 'mega-services' | 'mega-howitworks' | 'mega-resources' }[] = [
    { label: 'Services', slug: 'mega-services' },
    { label: 'How It Works', slug: 'mega-howitworks' },
    { label: 'Resources', slug: 'mega-resources' },
  ]
  for (const t of triggers) {
    await captureMegaMenu(page, t.label, t.slug)
  }
}

async function captureMegaMenu(
  page: Page,
  triggerText: string,
  slug: 'mega-services' | 'mega-howitworks' | 'mega-resources',
): Promise<void> {
  const outPath = outPathFor('chrome', slug, 'desktop')
  const base: CaptureResult = {
    slug,
    category: 'chrome',
    viewport: 'desktop',
    url: `${CE_HOST}/`,
    filePath: path.relative(OUT_ROOT, outPath),
    status: 'failed',
    fullPage: false,
  }
  // Always re-navigate to a clean home + scroll-0 before each mega-menu
  // capture so any prior open menu / scroll state is reset.
  const nav = await gotoUrl(page, `${CE_HOST}/`)
  if (!nav.ok) {
    results.push({ ...base, status: 'failed', reason: `home re-nav failed: ${nav.reason}` })
    return
  }
  await dismissCookieBanner(page)
  await hideOverlayWidgets(page)
  await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {})
  await page.waitForTimeout(400)

  try {
    // Locate the trigger by visible text under the header. Prefer .w-nav-link
    // scope; fallback to header anchors.
    const trigger = page.locator(`header a:has-text("${triggerText}"), .w-nav-link:has-text("${triggerText}")`).first()
    await trigger.waitFor({ state: 'visible', timeout: 5000 })
    const box = await trigger.boundingBox()
    if (!box) throw new Error('trigger has no bounding box')
    // hover-first (mirrors openDropdown attempt 1)
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.waitForTimeout(200)
    await page.mouse.move(box.x + box.width / 2 + 1, box.y + box.height / 2)
    await page.waitForTimeout(900)
    // If hover didn't open a panel, try click as fallback
    const panelOpen = await page.evaluate(() => {
      const panels = Array.from(document.querySelectorAll('nav [class*="dropdown" i], header [class*="dropdown" i], [class*="mega" i]'))
      return panels.some((el) => {
        const rect = (el as HTMLElement).getBoundingClientRect()
        return rect.width > 100 && rect.height > 100 && rect.top < 600
      })
    })
    if (!panelOpen) {
      await trigger.click({ timeout: 2000, trial: false }).catch(() => {})
      await page.waitForTimeout(700)
    }
    await takeViewport(page, outPath)
    results.push({ ...base, status: 'success' })
    console.log(`  ✓ chrome/${slug} @ desktop`)
    // Belt-and-braces: actively close the menu so the next iteration starts
    // from a clean state. Without this, the cursor stays parked on the nav
    // link and the hover-open dropdown contaminates the next page load.
    await closeAnyOpenMenu(page)
  } catch (err) {
    results.push({ ...base, status: 'failed', reason: (err as Error).message })
    console.warn(`  ✗ chrome/${slug}: ${(err as Error).message}`)
    await closeAnyOpenMenu(page)
  }
}

async function captureMobileDrawer(page: Page): Promise<void> {
  const homeUrl = `${CE_HOST}/`
  const nav = await gotoUrl(page, homeUrl)
  if (!nav.ok) {
    for (const slug of ['mobile-drawer', 'mobile-drawer-section-open']) {
      results.push({
        slug,
        category: 'chrome',
        viewport: 'mobile',
        url: homeUrl,
        filePath: path.relative(OUT_ROOT, outPathFor('chrome', slug, 'mobile')),
        status: 'failed',
        reason: `home navigation failed: ${nav.reason}`,
      })
    }
    return
  }
  await dismissCookieBanner(page)
  await hideOverlayWidgets(page)
  await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {})
  await page.waitForTimeout(400)

  // Find hamburger — Webflow nav button is typically .w-nav-button.
  const drawerOutPath = outPathFor('chrome', 'mobile-drawer', 'mobile')
  const drawerBase: CaptureResult = {
    slug: 'mobile-drawer',
    category: 'chrome',
    viewport: 'mobile',
    url: homeUrl,
    filePath: path.relative(OUT_ROOT, drawerOutPath),
    status: 'failed',
    fullPage: false,
  }
  try {
    const hamburger = page
      .locator(
        '.w-nav-button, [aria-label*="menu" i], header button[class*="menu" i], header button[class*="nav" i], header button[class*="hamburger" i]',
      )
      .first()
    await hamburger.waitFor({ state: 'visible', timeout: 5000 })
    await hamburger.tap({ timeout: 3000 }).catch(async () => {
      await hamburger.click({ timeout: 3000 })
    })
    await page.waitForTimeout(900)
    await takeViewport(page, drawerOutPath)
    results.push({ ...drawerBase, status: 'success' })
    console.log(`  ✓ chrome/mobile-drawer @ mobile`)
  } catch (err) {
    results.push({ ...drawerBase, status: 'failed', reason: (err as Error).message })
    console.warn(`  ✗ chrome/mobile-drawer: ${(err as Error).message}`)
    // Without an open drawer there's no meaningful "section open" follow-up,
    // so log a paired skip and bail.
    results.push({
      slug: 'mobile-drawer-section-open',
      category: 'chrome',
      viewport: 'mobile',
      url: homeUrl,
      filePath: path.relative(OUT_ROOT, outPathFor('chrome', 'mobile-drawer-section-open', 'mobile')),
      status: 'skipped',
      reason: 'drawer did not open',
      fullPage: false,
    })
    return
  }

  // Section-open: tap a top-level entry that has children (Services) and
  // capture the expanded accordion. On Webflow's default mobile menu these
  // are sibling .w-dropdown-toggle elements.
  const sectionOutPath = outPathFor('chrome', 'mobile-drawer-section-open', 'mobile')
  const sectionBase: CaptureResult = {
    slug: 'mobile-drawer-section-open',
    category: 'chrome',
    viewport: 'mobile',
    url: homeUrl,
    filePath: path.relative(OUT_ROOT, sectionOutPath),
    status: 'failed',
    fullPage: false,
  }
  try {
    const servicesToggle = page
      .locator(
        '.w-nav-overlay :text("Services"), .w-nav-overlay .w-dropdown-toggle:has-text("Services"), nav :text("Services")',
      )
      .first()
    await servicesToggle.waitFor({ state: 'visible', timeout: 4000 })
    await servicesToggle.tap({ timeout: 3000 }).catch(async () => {
      await servicesToggle.click({ timeout: 3000 })
    })
    await page.waitForTimeout(800)
    await takeViewport(page, sectionOutPath)
    results.push({ ...sectionBase, status: 'success' })
    console.log(`  ✓ chrome/mobile-drawer-section-open @ mobile`)
  } catch (err) {
    results.push({ ...sectionBase, status: 'failed', reason: (err as Error).message })
    console.warn(`  ✗ chrome/mobile-drawer-section-open: ${(err as Error).message}`)
  }
  // Close the drawer before continuing — leaves the page in a clean state
  // (matches the closeAnyOpenMenu discipline used after mega-menu captures).
  await closeAnyOpenMenu(page)
}

// ────────────────────────────────────────────────────────────────────────
// Orchestrator
// ────────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const startedAt = new Date().toISOString()
  console.log(`[capture] start ${startedAt}`)
  console.log(`[capture] output root: ${OUT_ROOT}`)

  const browser = await chromium.launch()

  // Pre-record skipped detail templates with no public URL.
  for (const skip of SKIPPED_NO_URL) {
    for (const vp of VIEWPORTS) {
      results.push({
        slug: skip.slug,
        category: skip.category,
        viewport: vp.name,
        url: '(no public URL)',
        filePath: path.relative(OUT_ROOT, outPathFor(skip.category, skip.slug, vp.name)),
        status: 'skipped',
        reason: skip.reason,
      })
    }
  }

  try {
    for (const vp of VIEWPORTS) {
      console.log(`\n[capture] === viewport: ${vp.name} (${vp.width}×${vp.height}) ===`)
      const context = await makeContext(browser, vp)
      const page = await context.newPage()
      page.setDefaultTimeout(PAGE_TIMEOUT_MS)

      // Ordering rationale (round-3 contamination fix): chrome captures
      // that open menus (mega-menus, mobile drawer) park the cursor on the
      // nav and can leave the page in an open-overlay state. If those run
      // first, every subsequent URL load re-triggers the hover dropdown
      // (Webflow `data-hover="true"` default) and the overlay paints over
      // the actual page hero. URL captures now run first against a fresh
      // page state; chrome captures last, after the URL pass is done.

      // 1. Standard URL pass (each captureUrl resets state via mouse-park
      //    + about:blank navigation before the target URL load).
      for (const spec of URLS) {
        await captureUrl(page, spec, vp)
      }

      // 2. Chrome: header (scroll 0), header-scroll (y=500), footer.
      await captureChromeFor(page, vp)

      // 3. Desktop-only: mega-menus. Each mega-menu capture is followed by
      //    closeAnyOpenMenu() so the page is reset before the next iteration.
      if (vp.name === 'desktop') {
        await captureMegaMenus(page)
      }

      // 4. Mobile-only: drawer. Same close-after-capture discipline applies.
      if (vp.name === 'mobile') {
        await captureMobileDrawer(page)
      }

      await context.close()
    }
  } finally {
    await browser.close()
  }

  const finishedAt = new Date().toISOString()
  const log: RunLog = { startedAt, finishedAt, results }
  await fs.mkdir(OUT_ROOT, { recursive: true })
  await fs.writeFile(path.join(OUT_ROOT, '_run.json'), JSON.stringify(log, null, 2))
  console.log(`\n[capture] done ${finishedAt}`)
  console.log(`[capture] results: ${results.filter((r) => r.status === 'success').length} success, ${results.filter((r) => r.status === 'failed').length} failed, ${results.filter((r) => r.status === 'skipped').length} skipped`)
}

main().catch((err) => {
  console.error('[capture] fatal:', err)
  process.exit(1)
})

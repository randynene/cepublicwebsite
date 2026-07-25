// MYGRATR-STATIC-2 Step 1 — live-site chrome audit.
//
// Playwright-driven extraction of cloudemployee.io's header + footer +
// three mega-menus. Produces seven JSON artefacts + a downloaded-asset
// tree under audit-output/static-2/, which Step 4 (seed-globals-v2)
// reads to populate the navigation + footer Sanity globals and
// backfill service.thumbnail per DELTA-1.
//
// Pre-conditions (per Brief §3 Step 0):
//   - Plan-mode closed. All DELTAs noted in the brief have landed.
//   - SANITY_PROJECT_ID + SANITY_DATASET in env (read-only access).
//   - GeoTargetly bypass strategy locked: Accept-Language: en-US +
//     a redirect-guard on the first navigation.
//   - networkidle is the correct waitUntil: mega-menu HTML is JS-rendered
//     by Webflow's runtime and must settle before extraction.
//
// Outputs (audit-output/static-2/):
//   - navigation.json              full nav structure incl. mega-menu items
//   - footer.json                  structured footer (top CTA + sections + ...)
//   - scroll-behavior.json         default vs scrolled header CSS diff
//   - assets-manifest.json         every downloaded asset (sha256-named)
//   - slug-match-report.json       mega-menu URLs ↔ Sanity service/technology docs
//   - how-it-works-photo-comparison.json   Option B deterministic stub (DELTA-2/4)
//   - static-2-brief-deltas.json   brief-vs-reality findings (A-D)
//   - static-3-brief-deltas.json   STATIC-3-DELTA-1 (scroll-triggered pill)
//
// DELTA-1 (service.thumbnail backfill) DROPPED from STATIC-2 scope after
// panel-shape probe confirmed service items have no icons on live site.
// See static-2-brief-deltas.json STATIC-2-DELTA-B.
//
// The script is read-only against Sanity (slug-match queries only). All
// Sanity writes happen in Step 4 (seed-globals-v2). Re-running this
// script re-downloads assets + re-writes JSON; no Sanity state changes.
//
// Run: `npm run audit:static-2`

import 'dotenv/config'

import * as crypto from 'node:crypto'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'

import { createClient } from '@sanity/client'
import type { Browser, Page } from 'playwright'
import { chromium } from 'playwright'

// ────────────────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────────────────

const CE_HOST = 'https://www.cloudemployee.io'
const OUT_ROOT = path.resolve(process.cwd(), 'audit-output', 'static-2')
const ASSETS_NAV = path.join(OUT_ROOT, 'assets', 'nav')
const ASSETS_FOOTER = path.join(OUT_ROOT, 'assets', 'footer')
const ASSETS_HIW = path.join(OUT_ROOT, 'assets', 'how-it-works-photos')

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

const PAGE_TIMEOUT_MS = 30_000
const NETWORK_IDLE_TIMEOUT_MS = 15_000
const KNOWN_SUBSCRIBE_FORM_GUID = 'deac2450-b51b-4630-b9e2-47017a13da15'

const sanity = createClient({
  projectId: process.env.SANITY_PROJECT_ID ?? 'lzbhll1u',
  dataset: process.env.SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
})

// ────────────────────────────────────────────────────────────────────────
// Captured-data types
// ────────────────────────────────────────────────────────────────────────

interface CapturedImage {
  src: string
  alt: string
  width?: number
  height?: number
}

interface CapturedLink {
  label: string
  url: string
  hasArrow?: boolean
}

type IconSource = 'img-src' | 'svg-use' | 'inline-svg' | 'background-image' | 'material-font' | null

interface CapturedItem {
  label: string
  url: string
  tagline: string | null
  iconSource: IconSource
  iconUrl: string | null         // HTTP URL for img-src / background-image; fragment href for svg-use
  iconName: string | null        // Material icon ligature OR svg-use anchor name
  iconSvgInline: string | null   // Raw SVG markup for inline-svg case (capped at 4096 chars)
  iconAlt: string | null
}

interface MegaMenuSection {
  sectionLabel: string
  sectionLink: string | null
  sectionLabelStyle: string
  items: CapturedItem[]
  highlightedItems?: CapturedItem[]
  viewAllLink?: CapturedLink | null
}

interface ServicesMegaCapture {
  leftColumn: MegaMenuSection
  rightColumnTop: MegaMenuSection
  rightColumnBottom: { sections: MegaMenuSection[] }
  rawHtml: string
}

interface HowItWorksCard {
  title: string
  subtitle: string
  imageUrl: string
  imageAlt: string
  ctaLabel: string
  ctaUrl: string
}

interface HowItWorksMegaCapture {
  cards: HowItWorksCard[]
  bottomPanel: {
    heading: string
    subheading: string
    ctaLabel: string
    ctaUrl: string
    imageUrl: string
    imageAlt: string
  }
  rawHtml: string
}

interface ResourcesLeftItem {
  label: string
  url: string
  iconSource: IconSource
  iconUrl: string | null
  iconName: string | null
  iconSvgInline: string | null
  iconAlt: string | null
}

interface ResourcesMegaCapture {
  leftColumn: {
    sectionLabel: string
    items: ResourcesLeftItem[]
  }
  middleColumn: {
    sectionLabel: string
    viewAllLink: CapturedLink | null
    featuredPosts: Array<{ title: string; url: string; thumbnailUrl: string; thumbnailAlt: string }>
  }
  rightColumn: {
    sectionLabel: string
    viewAllLink: CapturedLink | null
    featuredStories: Array<{ headline: string; url: string; logoUrl: string; logoAlt: string }>
  }
  rawHtml: string
}

interface PrimaryLink {
  label: string
  url: string
  dropdownType: 'none' | 'services-mega' | 'how-it-works-mega' | 'resources-mega'
}

interface CtaCapture {
  label: string
  url: string
  captureMethod: 'anchor-href' | 'data-attribute' | 'canonical-fallback'
  captureNotes: string
}

interface NavigationCapture {
  primaryLinks: PrimaryLink[]
  ctaButton: CtaCapture
  servicesMegaMenu: ServicesMegaCapture
  howItWorksMegaMenu: HowItWorksMegaCapture
  resourcesMegaMenu: ResourcesMegaCapture
  headerRawHtml: string
}

interface FooterColumn {
  heading: string
  headingHasArrow: boolean
  headingUrl: string | null
  links: CapturedLink[]
}

interface FooterSection {
  sectionLabel: string
  sectionLabelStyle: string
  columns: FooterColumn[]
  bottomPillLinks: CapturedLink[] | null
}

interface FooterCapture {
  topCtaBlock: {
    heading: string
    statRow: string
    primaryCta: CtaCapture
    secondaryCta: CtaCapture
  }
  sections: FooterSection[]
  talentLocations: {
    sectionLabel: string
    sectionLabelStyle: string
    items: CapturedLink[]
  }
  subscribe: {
    heading: string
    description: string
    formId: string
    submitLabel: string
  }
  bottomBar: {
    copyrightText: string
    links: CapturedLink[]
    regionSelector: { enabled: boolean; options: Array<{ label: string; url: string }> }
  }
  rawHtml: string
}

interface HeaderStateCss {
  background: string
  boxShadow: string
  padding: string
  borderRadius: string
  position: string
  transition: string
  marginTop: string
  marginLeft: string
  marginRight: string
  width: string
  height: string
}

interface ScrollBehaviorCapture {
  scrollTriggerPx: number
  defaultState: HeaderStateCss
  scrolledState: HeaderStateCss
  changedProperties: string[]
  transitionDurationMs: number | null
  transitionEasing: string | null
}

interface AssetManifestEntry {
  originalUrl: string
  localPath: string
  sha256: string
  bytes: number
  surface: 'nav' | 'footer' | 'how-it-works-photos'
  contextLabel: string
}

interface SlugMatchEntry {
  label: string
  url: string
  capturedTagline: string | null
  capturedIconUrl: string | null
  matchStatus: 'matched' | 'orphan'
  matchedDocId: string | null
  matchedDocType: 'service' | 'technology' | null
  matchedDocThumbnail: string | null
}

// ────────────────────────────────────────────────────────────────────────
// Utilities
// ────────────────────────────────────────────────────────────────────────

function sha256(buf: Buffer | string): string {
  return crypto.createHash('sha256').update(buf).digest('hex')
}

function shortHash(s: string): string {
  return sha256(s).slice(0, 8)
}

function extFromUrl(url: string): string {
  const clean = url.split('?')[0].split('#')[0]
  const ext = path.extname(clean).toLowerCase()
  if (
    ext === '.png' ||
    ext === '.jpg' ||
    ext === '.jpeg' ||
    ext === '.svg' ||
    ext === '.webp' ||
    ext === '.gif' ||
    ext === '.avif'
  ) {
    return ext
  }
  return '.bin'
}

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true })
}

async function writeJson(filename: string, data: unknown): Promise<void> {
  const fullPath = path.join(OUT_ROOT, filename)
  await fs.writeFile(fullPath, JSON.stringify(data, null, 2) + '\n', 'utf8')
  console.log(`  wrote ${path.relative(process.cwd(), fullPath)}`)
}

async function downloadAsset(
  url: string,
  intoDir: string,
  surface: AssetManifestEntry['surface'],
  contextLabel: string,
): Promise<AssetManifestEntry | null> {
  if (!url) return null
  try {
    const res = await fetch(url)
    if (!res.ok) {
      console.warn(`  asset fetch ${res.status}: ${url}`)
      return null
    }
    const buf = Buffer.from(await res.arrayBuffer())
    const hash = sha256(buf)
    const filename = `${hash.slice(0, 8)}${extFromUrl(url)}`
    const localPath = path.join(intoDir, filename)
    await ensureDir(intoDir)
    await fs.writeFile(localPath, buf)
    return {
      originalUrl: url,
      localPath: path.relative(process.cwd(), localPath),
      sha256: hash,
      bytes: buf.length,
      surface,
      contextLabel,
    }
  } catch (err) {
    console.warn(`  asset fetch failed: ${url} (${(err as Error).message})`)
    return null
  }
}

function slugFromHref(href: string): { slug: string; routePrefix: 'services' | 'technology' | 'unknown' } | null {
  try {
    const u = new URL(href, CE_HOST)
    const parts = u.pathname.split('/').filter(Boolean)
    if (parts.length >= 2 && (parts[0] === 'services' || parts[0] === 'technology')) {
      return { slug: parts[1], routePrefix: parts[0] }
    }
    return null
  } catch {
    return null
  }
}

function uniqueByUrl<T extends { url?: string; src?: string; originalUrl?: string }>(arr: T[]): T[] {
  const seen = new Set<string>()
  const out: T[] = []
  for (const item of arr) {
    const key = item.url ?? item.src ?? item.originalUrl ?? ''
    if (key && !seen.has(key)) {
      seen.add(key)
      out.push(item)
    }
  }
  return out
}

// ────────────────────────────────────────────────────────────────────────
// Browser setup with GeoTargetly bypass
// ────────────────────────────────────────────────────────────────────────

async function launchBrowser(): Promise<{ browser: Browser; page: Page }> {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    userAgent: USER_AGENT,
    locale: 'en-US',
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
    },
    viewport: { width: 1440, height: 900 },
  })
  // Strategy (b) from brief §3 Step 1: short-circuit GeoTargetly by
  // intercepting its script URL and serving an empty stub. Combined with
  // the en-US Accept-Language header above this gives belt-and-braces
  // protection against the talent.cloudemployee.io redirect.
  await context.route(/geotargetly\.com/, (route) => route.fulfill({ status: 200, body: '/* geotargetly stubbed */' }))

  // Compensate for tsx/esbuild emitting __name(fn, "name") wrappers in
  // transpiled output that gets shipped to the browser via page.evaluate.
  // The browser has no __name global, so without this shim every evaluate
  // callback that uses a named arrow const or named function declaration
  // throws ReferenceError: __name is not defined. One-line no-op shim makes
  // all such callbacks work without contorting source style.
  // Registered on the context so it runs on every navigation, including
  // navigations triggered by recovery paths inside openDropdown.
  await context.addInitScript(() => {
    ;(window as unknown as { __name: (fn: unknown) => unknown }).__name = (fn) => fn
  })

  const page = await context.newPage()
  page.setDefaultTimeout(PAGE_TIMEOUT_MS)
  return { browser, page }
}

async function gotoCe(page: Page, urlPath = '/'): Promise<void> {
  const target = `${CE_HOST}${urlPath}`
  console.log(`→ ${target}`)
  await page.goto(target, { waitUntil: 'networkidle', timeout: NETWORK_IDLE_TIMEOUT_MS }).catch(async () => {
    // Some Webflow pages keep long-poll connections open and never reach
    // networkidle within the timeout. Fall back to domcontentloaded +
    // a small settle delay so we still get the rendered DOM.
    console.warn('  networkidle timed out; falling back to domcontentloaded + 2500ms settle')
    await page.goto(target, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2500)
  })
  const landed = page.url()
  if (!landed.startsWith(CE_HOST) && !landed.startsWith('https://cloudemployee.io')) {
    throw new Error(`Redirected away from CE: ${landed}. GeoTargetly bypass failed.`)
  }
}

// ────────────────────────────────────────────────────────────────────────
// Header capture (default + scrolled)
// ────────────────────────────────────────────────────────────────────────

async function readHeaderCss(page: Page): Promise<HeaderStateCss> {
  return page.evaluate(() => {
    const header =
      document.querySelector('header') ??
      document.querySelector('[role="banner"]') ??
      document.querySelector('[class*="navbar" i]') ??
      document.body.firstElementChild
    if (!header) {
      throw new Error('no header element found on page')
    }
    const cs = getComputedStyle(header as Element)
    const rect = (header as Element).getBoundingClientRect()
    return {
      background: cs.backgroundColor,
      boxShadow: cs.boxShadow,
      padding: cs.padding,
      borderRadius: cs.borderRadius,
      position: cs.position,
      transition: cs.transition,
      marginTop: cs.marginTop,
      marginLeft: cs.marginLeft,
      marginRight: cs.marginRight,
      width: `${rect.width}`,
      height: `${rect.height}`,
    }
  })
}

async function captureHeaderRawHtml(page: Page): Promise<string> {
  return page.evaluate(() => {
    const header =
      document.querySelector('header') ??
      document.querySelector('[role="banner"]') ??
      document.querySelector('[class*="navbar" i]')
    return header ? (header as Element).outerHTML : ''
  })
}

async function captureScrollBehavior(page: Page): Promise<ScrollBehaviorCapture> {
  const defaultState = await readHeaderCss(page)
  const scrollTriggerPx = 200
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior }), scrollTriggerPx)
  await page.waitForTimeout(600) // let CSS transitions finish
  const scrolledState = await readHeaderCss(page)
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }))
  await page.waitForTimeout(400)

  const changedProperties: string[] = []
  for (const key of Object.keys(defaultState) as Array<keyof HeaderStateCss>) {
    if (defaultState[key] !== scrolledState[key]) changedProperties.push(key)
  }

  const transitionDurationMs = parseTransitionDurationMs(defaultState.transition)
  const transitionEasing = parseTransitionEasing(defaultState.transition)

  return {
    scrollTriggerPx,
    defaultState,
    scrolledState,
    changedProperties,
    transitionDurationMs,
    transitionEasing,
  }
}

function parseTransitionDurationMs(t: string): number | null {
  const m = t.match(/(\d*\.?\d+)(ms|s)/)
  if (!m) return null
  const n = parseFloat(m[1])
  return m[2] === 's' ? Math.round(n * 1000) : Math.round(n)
}

function parseTransitionEasing(t: string): string | null {
  const m = t.match(/(cubic-bezier\([^)]+\)|ease[-a-z]*|linear|steps\([^)]+\))/)
  return m ? m[1] : null
}

// ────────────────────────────────────────────────────────────────────────
// Mega-menu captures
// ────────────────────────────────────────────────────────────────────────

// Locate a primary-nav trigger:
//   1. DOM walk to find the deepest small element whose text starts with the label
//   2. Walk UP up to 5 levels to find the nearest Webflow dropdown-toggle ancestor
//      (.w-dropdown-toggle / [class*="w-dropdown"] / [data-hover]) — that's the
//      real hover target. Fall back to the matched label element if no such
//      ancestor exists.
//   3. Discover the sibling .w-dropdown-list panel adjacent to the toggle (or
//      one level higher under .w-dropdown). Tag both toggle + panel with a
//      data attribute so the wait loop can re-query them deterministically.
//   4. Return bounding-box center of the toggle + the unique data-attr token.
async function findTriggerBox(
  page: Page,
  triggerText: string,
): Promise<{
  x: number
  y: number
  toggleTagName: string
  toggleClassName: string
  panelTagName: string | null
  panelClassName: string | null
  matchedText: string
  triggerToken: string
  ancestorWalkLevels: number
} | null> {
  return page.evaluate((label) => {
    const target = label.toLowerCase().trim()
    const triggerToken = target.replace(/\s+/g, '-')

    const header =
      document.querySelector('header') ??
      document.querySelector('[role="banner"]') ??
      document.querySelector('.w-nav') ??
      document.body

    const scaffoldSelectors = [
      '.w-nav',
      '.w-dropdown',
      '.w-dropdown-toggle',
      '[class*="dropdown" i]',
      '[class*="nav-link" i]',
      '[class*="navbar" i]',
      'nav',
    ]
    const scopes: Element[] = [header]
    for (const sel of scaffoldSelectors) {
      header.querySelectorAll(sel).forEach((el) => scopes.push(el))
    }

    // Pick the deepest small element whose trimmed text starts with the label.
    const seen = new Set<Element>()
    let best: { el: Element; depth: number } | null = null
    for (const scope of scopes) {
      const all = Array.from(scope.querySelectorAll('*')) as Element[]
      for (const el of all) {
        if (seen.has(el)) continue
        seen.add(el)
        const rect = el.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) continue
        if (rect.width > 600 || rect.height > 200) continue
        const text = (el.textContent ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
        if (!text.startsWith(target)) continue
        if (text.length > target.length + 24) continue
        let depth = 0
        let p: Element | null = el
        while (p && p !== document.body) {
          depth++
          p = p.parentElement
        }
        if (!best || depth > best.depth) best = { el, depth }
      }
    }
    if (!best) return null

    // Ancestor walk: nearest .w-dropdown-toggle / .w-dropdown / [data-hover] within 5 levels.
    const isToggleAncestor = (el: Element): boolean => {
      const cls = (typeof el.className === 'string' ? (el.className as string) : '').toLowerCase()
      if (cls.includes('w-dropdown-toggle')) return true
      if (cls.includes('w-dropdown') && !cls.includes('w-dropdown-list')) return true
      if (el.hasAttribute('data-hover')) return true
      return false
    }
    let toggle: Element = best.el
    let walker: Element | null = best.el
    let ancestorWalkLevels = 0
    let foundAncestor = false
    for (let i = 0; i < 5 && walker; i++) {
      if (isToggleAncestor(walker)) {
        toggle = walker
        ancestorWalkLevels = i
        foundAncestor = true
        break
      }
      walker = walker.parentElement
      ancestorWalkLevels = i + 1
    }
    if (!foundAncestor) ancestorWalkLevels = -1 // signal: fell back to label

    // Sibling panel discovery: look for .w-dropdown-list among siblings of the
    // toggle, then siblings one level higher (under the .w-dropdown wrapper).
    const findPanel = (start: Element): Element | null => {
      const candidates: Element[] = []
      const parent = start.parentElement
      if (parent) {
        Array.from(parent.children).forEach((c) => {
          if (c !== start) candidates.push(c)
        })
        const grandparent = parent.parentElement
        if (grandparent) {
          Array.from(grandparent.children).forEach((c) => {
            if (c !== parent && c !== start) candidates.push(c)
          })
        }
      }
      for (const c of candidates) {
        const cls = (typeof c.className === 'string' ? (c.className as string) : '').toLowerCase()
        if (cls.includes('w-dropdown-list') || cls.includes('dropdown-list')) return c
      }
      return null
    }
    const panel = findPanel(toggle)

    // Mark toggle + panel for deterministic re-query in the wait loop.
    toggle.setAttribute('data-mygratr-toggle', triggerToken)
    if (panel) panel.setAttribute('data-mygratr-panel', triggerToken)

    const rect = toggle.getBoundingClientRect()
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      toggleTagName: toggle.tagName,
      toggleClassName: typeof toggle.className === 'string' ? (toggle.className as string).slice(0, 120) : '',
      panelTagName: panel ? panel.tagName : null,
      panelClassName: panel
        ? typeof panel.className === 'string'
          ? (panel.className as string).slice(0, 120)
          : ''
        : null,
      matchedText: (best.el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 60),
      triggerToken,
      ancestorWalkLevels,
    }
  }, triggerText)
}

// Wait for the specific tagged panel ([data-mygratr-panel="<token>"]) to be
// visible: display !== 'none' AND visibility !== 'hidden' AND
// aria-hidden !== 'true' AND width × height > 200×150. If no panel was tagged
// (ancestor walk found no .w-dropdown-list sibling), fall back to a broad
// "any large visible element with anchors" check inside the header.
async function waitForPanelByToken(page: Page, triggerToken: string, timeoutMs: number): Promise<boolean> {
  try {
    await page.waitForFunction(
      (token) => {
        const panel = document.querySelector(`[data-mygratr-panel="${token}"]`)
        if (panel) {
          const cs = getComputedStyle(panel)
          if (cs.display === 'none' || cs.visibility === 'hidden') return false
          if (panel.getAttribute('aria-hidden') === 'true') return false
          const rect = panel.getBoundingClientRect()
          return rect.width > 200 && rect.height > 150
        }
        // Fallback: broad sweep when no panel was tagged.
        const header = document.querySelector('header') ?? document.body
        const all = Array.from(header.querySelectorAll('*'))
        for (const el of all) {
          const cs = getComputedStyle(el)
          if (cs.display === 'none' || cs.visibility === 'hidden') continue
          if (el.getAttribute('aria-hidden') === 'true') continue
          const rect = el.getBoundingClientRect()
          if (rect.height < 150 || rect.width < 250) continue
          const anchors = el.querySelectorAll('a')
          if (anchors.length >= 3 && el.children.length > 0) return true
        }
        return false
      },
      triggerToken,
      { timeout: timeoutMs, polling: 200 },
    )
    return true
  } catch {
    return false
  }
}

// Navigation guard: run an interaction and report whether the page URL
// changed afterwards. Used to detect when mouse.click() follows an anchor's
// href (the original bug) so we can recover by re-navigating to /.
async function urlChangedAfter(page: Page, interaction: () => Promise<void>, settleMs = 400): Promise<boolean> {
  const initialUrl = page.url()
  await interaction()
  await page.waitForTimeout(settleMs)
  return page.url() !== initialUrl
}

async function openDropdown(page: Page, triggerText: string): Promise<boolean> {
  const triggerBox = await findTriggerBox(page, triggerText)
  if (!triggerBox) {
    console.warn(
      `  trigger "${triggerText}" not found via DOM walk (strategy: text-prefix match across .w-nav / .w-dropdown / [class*="dropdown"] / [class*="nav-link"] / nav scopes)`,
    )
    return false
  }
  const toggleCls = triggerBox.toggleClassName.split(/\s+/)[0] || '(no-class)'
  if (triggerBox.ancestorWalkLevels < 0) {
    console.log(`  found trigger (no .w-dropdown-toggle ancestor — using label element) for "${triggerText}"`)
  } else {
    console.log(
      `  found trigger ancestor ${triggerBox.toggleTagName}.${toggleCls} for "${triggerText}" (walked ${triggerBox.ancestorWalkLevels} levels)`,
    )
  }
  if (triggerBox.panelTagName) {
    const panelCls = (triggerBox.panelClassName ?? '').split(/\s+/)[0] || '(no-class)'
    console.log(`  discovered panel ${triggerBox.panelTagName}.${panelCls}`)
  } else {
    console.log(`  no sibling .w-dropdown-list discovered; will use broad panel-visibility fallback`)
  }
  console.log(`  waiting for panel visible...`)

  // Attempt 1: HOVER FIRST (Webflow dropdowns default to data-hover="true").
  const hoverNavigated = await urlChangedAfter(page, async () => {
    await page.mouse.move(triggerBox.x, triggerBox.y)
    await page.waitForTimeout(50)
    await page.mouse.move(triggerBox.x + 1, triggerBox.y) // nudge to ensure mouseenter fires
    await page.waitForTimeout(750)
  })
  if (hoverNavigated) {
    console.warn(`  hover caused navigation (unexpected) — re-navigating to /`)
    await gotoCe(page, '/')
    return false
  }
  if (await waitForPanelByToken(page, triggerBox.triggerToken, 4000)) {
    console.log(`  panel opened ✓ (hover)`)
    return true
  }

  // Attempt 2: click as fallback. Move-away first to reset hover state.
  console.warn(`  hover did not open panel; trying click fallback for "${triggerText}"`)
  await page.mouse.move(0, 0)
  await page.waitForTimeout(200)
  const clickNavigated = await urlChangedAfter(page, async () => {
    await page.mouse.click(triggerBox.x, triggerBox.y)
    await page.waitForTimeout(400)
  })
  if (clickNavigated) {
    console.warn(`  click followed anchor href (page navigated away) — re-navigating to /`)
    await gotoCe(page, '/')
    return false
  }
  if (await waitForPanelByToken(page, triggerBox.triggerToken, 4000)) {
    console.log(`  panel opened ✓ (click)`)
    return true
  }

  console.warn(
    `  panel did not appear for "${triggerText}" — strategies attempted: ancestor walk → hover(${Math.round(triggerBox.x)},${Math.round(triggerBox.y)}) → click(). toggle=${triggerBox.toggleTagName}.${toggleCls} panel=${triggerBox.panelTagName ?? '(none)'}`,
  )
  return false
}

async function closeAllDropdowns(page: Page): Promise<void> {
  await page.keyboard.press('Escape').catch(() => {})
  await page.mouse.move(10, 10)
  await page.waitForTimeout(300)
}

// Per-link extracted shape from readVisibleMenuPanel. Mirrors CapturedItem
// minus `url`-as-required; this is what flattenMegaMenuItems consumes.
interface ExtractedLink {
  label: string
  url: string
  tagline: string | null
  iconSource: IconSource
  iconUrl: string | null
  iconName: string | null
  iconSvgInline: string | null
  iconAlt: string | null
}

interface RawMenuPayload {
  outerHtml: string
  links: ExtractedLink[]
  images: CapturedImage[]
  pillCandidates: Array<{ label: string; href: string | null; classNames: string }>
}

// Read a panel's content. If `panelToken` is provided (matches a token set
// by findTriggerBox / data-mygratr-panel), query that specific element.
// Otherwise fall back to the largest visible dropdown-like element.
async function readVisibleMenuPanel(page: Page, panelToken?: string): Promise<RawMenuPayload | null> {
  return page.evaluate((token: string | null) => {
    // ── Panel discovery
    let panel: Element | null = null
    if (token) {
      panel = document.querySelector(`[data-mygratr-panel="${token}"]`)
    }
    if (!panel) {
      const broad = Array.from(
        document.querySelectorAll(
          'header [class*="dropdown" i], header [class*="mega" i], header [class*="menu" i], [class*="dropdown" i][class*="open" i], [class*="dropdown-list" i]',
        ),
      ).filter((el) => {
        const cs = getComputedStyle(el)
        const rect = el.getBoundingClientRect()
        return cs.display !== 'none' && cs.visibility !== 'hidden' && rect.height > 100 && rect.width > 200
      }) as Element[]
      if (broad.length === 0) return null
      panel = broad.sort((a, b) => {
        const ar = a.getBoundingClientRect()
        const br = b.getBoundingClientRect()
        return br.width * br.height - ar.width * ar.height
      })[0]
    }
    if (!panel) return null

    // ── Helpers — using const arrows; the __name shim makes them safe
    // Decision 3: detect Material-style icons by class-name pattern in
    // addition to font-family. Probe revealed CE uses `.md-icon` class
    // wrapping the Material Icons font; getComputedStyle.fontFamily on
    // such an element may not include the literal "material icons" string
    // depending on CSS cascade, but the class name is a reliable signal.
    const MD_ICON_CLASS_RE = /(^|\s)(md-icon|material-icons|material-symbols|icon-md|mi)(\s|$)/i
    const isIconFontElement = (el: Element): boolean => {
      const cls = typeof el.className === 'string' ? (el.className as string) : ''
      if (MD_ICON_CLASS_RE.test(cls)) return true
      const ff = getComputedStyle(el).fontFamily.toLowerCase()
      return (
        ff.includes('material icons') ||
        ff.includes('material-icons') ||
        ff.includes('material symbols') ||
        ff.includes('material-symbols')
      )
    }

    // Extract icon from an anchor by trying strategies in order. Returns null
    // when no usable icon can be identified.
    const extractIcon = (
      a: HTMLAnchorElement,
    ): {
      source: IconSourceJs
      url: string | null
      name: string | null
      svgInline: string | null
      alt: string | null
    } | null => {
      // Strategy 1: <img src>
      const img = a.querySelector('img') as HTMLImageElement | null
      if (img && img.src) {
        return { source: 'img-src', url: img.src, name: null, svgInline: null, alt: img.getAttribute('alt') }
      }
      // Strategy 2: <svg><use href=...>
      const useEl = a.querySelector('svg use')
      if (useEl) {
        const href = useEl.getAttribute('href') ?? useEl.getAttribute('xlink:href')
        if (href) {
          const name = href.startsWith('#') ? href.slice(1) : href
          return { source: 'svg-use', url: href, name, svgInline: null, alt: null }
        }
      }
      // Strategy 3: inline <svg> (no <use>)
      const svgEl = a.querySelector('svg') as SVGElement | null
      if (svgEl && !svgEl.querySelector('use') && svgEl.children.length > 0) {
        const outer = svgEl.outerHTML
        const capped = outer.length > 4096 ? outer.slice(0, 4096) + '...' : outer
        return { source: 'inline-svg', url: null, name: null, svgInline: capped, alt: null }
      }
      // Strategy 4: Material icon font (ligature glyph)
      const allChildren = Array.from(a.querySelectorAll('*'))
      for (const el of allChildren) {
        if (!isIconFontElement(el)) continue
        const ligature = (el.textContent ?? '').trim()
        if (ligature && ligature.length < 40 && /^[a-z0-9_]+$/i.test(ligature)) {
          return { source: 'material-font', url: null, name: ligature, svgInline: null, alt: null }
        }
      }
      // Strategy 5: CSS background-image on anchor or any child
      const scan = [a, ...allChildren]
      for (const el of scan) {
        const bg = getComputedStyle(el).backgroundImage
        if (bg && bg !== 'none') {
          const m = bg.match(/url\(["']?([^"')]+)["']?\)/)
          if (m) return { source: 'background-image', url: m[1], name: null, svgInline: null, alt: null }
        }
      }
      return null
    }

    // Extract label + tagline from an anchor by partitioning text-bearing
    // children by font-size (largest = label, smaller text = tagline).
    // Excludes Material-icon-font glyphs, raw <img> and <svg> children.
    const extractLabelAndTagline = (a: HTMLAnchorElement, iconLigature: string | null): { label: string; tagline: string | null } => {
      const parts: Array<{ text: string; fontSize: number }> = []
      for (const child of Array.from(a.children)) {
        if (isIconFontElement(child)) continue
        if (child.tagName === 'SVG' || child.tagName === 'IMG') continue
        // Recurse into child to collect text, but skip any nested icon-font el
        const collect = (root: Element): string => {
          let out = ''
          for (const node of Array.from(root.childNodes)) {
            if (node.nodeType === 3) {
              out += (node.textContent ?? '')
            } else if (node.nodeType === 1) {
              const el = node as Element
              if (isIconFontElement(el)) continue
              if (el.tagName === 'SVG' || el.tagName === 'IMG') continue
              out += collect(el)
            }
          }
          return out
        }
        const text = collect(child).trim().replace(/\s+/g, ' ')
        if (!text) continue
        const fs = parseFloat(getComputedStyle(child).fontSize) || 0
        parts.push({ text, fontSize: fs })
      }
      // Also include direct text nodes of the anchor itself.
      for (const node of Array.from(a.childNodes)) {
        if (node.nodeType !== 3) continue
        const t = (node.textContent ?? '').trim().replace(/\s+/g, ' ')
        if (t) parts.push({ text: t, fontSize: 0 })
      }

      // Fallback: anchor has no structured children — slurp textContent + strip ligature.
      if (parts.length === 0) {
        let raw = (a.textContent ?? '').trim().replace(/\s+/g, ' ')
        if (iconLigature) {
          const lig = iconLigature.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          raw = raw.replace(new RegExp('^' + lig + '\\s*', 'i'), '')
          raw = raw.replace(new RegExp('^' + lig, 'i'), '')
        }
        return { label: raw, tagline: null }
      }

      // Sort by font size DESC: largest first = label, rest = tagline (joined).
      parts.sort((x, y) => y.fontSize - x.fontSize)
      // Dedupe: a parent that wraps the label child can repeat the same text;
      // drop later parts whose text is a substring of the first.
      const seen = new Set<string>()
      const cleaned: Array<{ text: string; fontSize: number }> = []
      for (const p of parts) {
        if (seen.has(p.text)) continue
        // skip if this text is contained within an already-collected part
        let isSubset = false
        for (const c of cleaned) {
          if (c.text.includes(p.text) || p.text.includes(c.text)) {
            isSubset = true
            break
          }
        }
        if (isSubset) continue
        seen.add(p.text)
        cleaned.push(p)
      }
      let label = cleaned[0]?.text ?? ''
      const tagline = cleaned.length > 1 ? cleaned.slice(1).map((c) => c.text).join(' ').trim() : null

      // Strip ligature if it leaked into label
      if (iconLigature) {
        const lig = iconLigature.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        label = label.replace(new RegExp('^' + lig + '\\s*', 'i'), '').trim() || label
      }

      return { label, tagline: tagline || null }
    }

    type IconSourceJs = 'img-src' | 'svg-use' | 'inline-svg' | 'background-image' | 'material-font'

    // ── Anchor sweep
    const anchors = Array.from(panel.querySelectorAll('a')) as HTMLAnchorElement[]
    const links: Array<{
      label: string
      url: string
      tagline: string | null
      iconSource: IconSourceJs | null
      iconUrl: string | null
      iconName: string | null
      iconSvgInline: string | null
      iconAlt: string | null
    }> = anchors.map((a) => {
      const icon = extractIcon(a)
      const lt = extractLabelAndTagline(a, icon?.source === 'material-font' ? icon.name : null)
      return {
        label: lt.label,
        url: a.href,
        tagline: lt.tagline,
        iconSource: icon?.source ?? null,
        iconUrl: icon?.url ?? null,
        iconName: icon?.name ?? null,
        iconSvgInline: icon?.svgInline ?? null,
        iconAlt: icon?.alt ?? null,
      }
    })

    // ── Image sweep (panel-scoped, unchanged shape)
    const images = Array.from(panel.querySelectorAll('img')).map((i) => {
      const im = i as HTMLImageElement
      return {
        src: im.src,
        alt: im.getAttribute('alt') ?? '',
        width: im.naturalWidth || undefined,
        height: im.naturalHeight || undefined,
      }
    })

    // ── Pill candidates (unchanged)
    const pillCandidates = Array.from(panel.querySelectorAll('[class*="pill" i], [class*="badge" i], [class*="label" i]'))
      .filter((el) => (el.textContent ?? '').trim().length > 0 && (el.textContent ?? '').trim().length < 40)
      .map((el) => {
        const anchor = el.closest('a') as HTMLAnchorElement | null
        return {
          label: (el.textContent ?? '').trim(),
          href: anchor ? anchor.href : null,
          classNames: typeof el.className === 'string' ? el.className : '',
        }
      })

    return {
      outerHtml: panel.outerHTML,
      links,
      images,
      pillCandidates,
    }
  }, panelToken ?? null)
}

function inferPillStyle(classNames: string): string {
  const c = classNames.toLowerCase()
  if (c.includes('gradient') || c.includes('ai')) return 'pill-gradient'
  if (c.includes('navy') || c.includes('product')) return 'pill-navy'
  if (c.includes('dark') || c.includes('technology')) return 'pill-dark'
  if (c.includes('outline') || c.includes('ghost') || c.includes('border')) return 'pill-outline-light'
  return 'pill-green'
}

async function captureServicesMega(page: Page): Promise<ServicesMegaCapture> {
  const opened = await openDropdown(page, 'Services')
  if (!opened) throw new Error('failed to open Services dropdown')
  const payload = await readVisibleMenuPanel(page, 'services')
  if (!payload) throw new Error('Services mega-menu panel not visible after open')

  // Heuristic split:
  // - First 2 service links → highlightedItems (left column sub-card)
  // - Next service-route links → leftColumn.items
  // - Technology-route links → rightColumnTop.items
  // - Remaining service-route links (AI Services / Product Builds groups) → rightColumnBottom.sections
  // Apply LABEL_BLOCKLIST_RE at the extraction layer (not just at
  // flattenMegaMenuItems). Live mega-menu has a "Try our Product Scoping
  // service" CTA promo block at the bottom of the Staff Augmentation column
  // whose href is /services/product-scoping-service and label is "Learn more".
  // Without this filter that CTA leaks into leftColumn.items as a 6th
  // "service". Sanity-doc collision check in main() confirms no real service
  // has a name matching the blocklist, so this is safe to apply.
  const serviceLinks = payload.links.filter(
    (l) => l.url.includes('/services/') && !LABEL_BLOCKLIST_RE.test(l.label),
  )
  const technologyLinks = payload.links.filter(
    (l) => l.url.includes('/technology/') && !LABEL_BLOCKLIST_RE.test(l.label),
  )
  const aiLinks = serviceLinks.filter((l) => /ai[- ]/i.test(l.label) || /ai[- ]/i.test(l.url))
  const productBuildLinks = serviceLinks.filter((l) => /mvp|mobile app|web[- ]?based/i.test(l.label))
  const corePeopleLinks = serviceLinks.filter((l) => !aiLinks.includes(l) && !productBuildLinks.includes(l))

  const toItem = (l: RawMenuPayload['links'][number]): CapturedItem => ({
    label: l.label,
    url: l.url,
    tagline: l.tagline,
    iconSource: l.iconSource,
    iconUrl: l.iconUrl,
    iconName: l.iconName,
    iconSvgInline: l.iconSvgInline,
    iconAlt: l.iconAlt,
  })

  const highlightedItems = corePeopleLinks.slice(0, 2).map(toItem)
  const leftFlat = corePeopleLinks.slice(2).map(toItem)

  // Pill-style inference per Step 0 item 11
  const findPill = (predicate: (label: string) => boolean, fallback: string): { label: string; href: string | null; style: string } => {
    const match = payload.pillCandidates.find((p) => predicate(p.label))
    return {
      label: match?.label ?? '',
      href: match?.href ?? null,
      style: match ? inferPillStyle(match.classNames) : fallback,
    }
  }

  const staffAug = findPill((l) => /staff augmentation/i.test(l), 'pill-green')
  const byTech = findPill((l) => /technology/i.test(l) && !/by/i.test(l) === false || /by technology/i.test(l), 'pill-dark')
  const aiSvc = findPill((l) => /ai services/i.test(l), 'pill-gradient')
  const productBuilds = findPill((l) => /product builds/i.test(l), 'pill-navy')

  return {
    leftColumn: {
      sectionLabel: staffAug.label || 'Staff Augmentation',
      sectionLink: staffAug.href,
      sectionLabelStyle: staffAug.style,
      highlightedItems,
      items: leftFlat,
      viewAllLink: null,
    },
    rightColumnTop: {
      sectionLabel: byTech.label || 'By Technology',
      sectionLink: byTech.href,
      sectionLabelStyle: byTech.style,
      items: technologyLinks.map(toItem),
      viewAllLink: null,
    },
    rightColumnBottom: {
      sections: [
        {
          sectionLabel: aiSvc.label || 'AI Services',
          sectionLink: aiSvc.href,
          sectionLabelStyle: aiSvc.style,
          items: aiLinks.map(toItem),
        },
        {
          sectionLabel: productBuilds.label || 'Product Builds',
          sectionLink: productBuilds.href,
          sectionLabelStyle: productBuilds.style,
          items: productBuildLinks.map(toItem),
        },
      ],
    },
    rawHtml: payload.outerHtml,
  }
}

async function captureHowItWorksMega(page: Page): Promise<HowItWorksMegaCapture> {
  await closeAllDropdowns(page)
  const opened = await openDropdown(page, 'How It Works')
  if (!opened) throw new Error('failed to open How It Works dropdown')
  const payload = await readVisibleMenuPanel(page, 'how-it-works')
  if (!payload) throw new Error('How It Works mega-menu panel not visible after open')

  // The 3 known CTAs map to /sourcing, /embedding, /retention (locked).
  const findCard = (route: string, title: string, subtitle: string): HowItWorksCard => {
    const cta = payload.links.find((l) => l.url.endsWith(`/${route}`) || l.url.endsWith(`/${route}/`))
    const image = payload.images.find((i) => i.alt.toLowerCase().includes(title.toLowerCase().split(' ')[1] ?? '')) ?? payload.images[0]
    return {
      title,
      subtitle,
      imageUrl: image?.src ?? '',
      imageAlt: image?.alt ?? '',
      ctaLabel: cta?.label ?? '',
      ctaUrl: cta?.url ?? `${CE_HOST}/${route}`,
    }
  }

  const cards: HowItWorksCard[] = [
    findCard('sourcing', 'Better hiring', 'Role-specific sourcing every time'),
    findCard('embedding', 'Better delivery', 'Embedded talent that ships'),
    findCard('retention', 'Better retention', 'Teams that stay 2+ years'),
  ]

  const howItWorksCta = payload.links.find((l) => l.url.endsWith('/how-it-works') || l.url.endsWith('/how-it-works/'))
  const remainingImages = payload.images.filter((i) => !cards.some((c) => c.imageUrl === i.src))

  return {
    cards,
    bottomPanel: {
      heading: 'How does partnering with Cloud Employee work?',
      subheading: '',
      ctaLabel: howItWorksCta?.label ?? 'Discover how we do it',
      ctaUrl: howItWorksCta?.url ?? `${CE_HOST}/how-it-works`,
      imageUrl: remainingImages[0]?.src ?? '',
      imageAlt: remainingImages[0]?.alt ?? '',
    },
    rawHtml: payload.outerHtml,
  }
}

// Strategy 6 — Resources featured-cards capture. Panel-shape probe
// (audit-output/static-2/panel-shape-probe.json) revealed cards use
// `<a class="resources-item-link">` overlay anchors (empty textContent,
// aria-label only) wrapping `.resources-item.{size}.w-dyn-item` containers
// that hold the visible text in a `.resources-item-top` sibling div and
// the thumbnail in a sibling `<img>`. Categorization:
//   - customer-story: pathname matches /^/customer-story/.+/ (SINGULAR, DELTA-C)
//   - blog: any other path (DELTA-D — blog posts span /nearshoring-offshoring/,
//           /hiring-tips/, /scaling-teams/, etc.)
interface ResourceCard {
  category: 'blog' | 'customer-story'
  url: string
  title: string
  thumbnailUrl: string | null
  thumbnailAlt: string | null
}

async function captureResourceCards(page: Page): Promise<ResourceCard[]> {
  return page.evaluate(() => {
    const panel = document.querySelector('[data-mygratr-panel="resources"]')
    if (!panel) return []

    const overlayAnchors = Array.from(panel.querySelectorAll('a.resources-item-link')) as HTMLAnchorElement[]
    const seenHrefs = new Set<string>()
    const cards: Array<{
      category: 'blog' | 'customer-story'
      url: string
      title: string
      thumbnailUrl: string | null
      thumbnailAlt: string | null
    }> = []

    for (const a of overlayAnchors) {
      if (!a.href) continue
      if (seenHrefs.has(a.href)) continue
      let path = ''
      try {
        path = new URL(a.href).pathname
      } catch {
        continue
      }
      // Skip index / View-all routes
      if (path === '/blog' || path === '/blog/' || path === '/customer-stories' || path === '/customer-stories/' || path === '/') continue
      seenHrefs.add(a.href)

      // Walk up to find a card container that holds both the anchor + an <img>.
      // Webflow structure: `.resources-item.{size}.w-dyn-item` is the typical
      // wrapper. Cap walk at 5 levels to avoid escaping into the panel root.
      let container: Element = a
      for (let i = 0; i < 5 && container.parentElement; i++) {
        const next = container.parentElement
        if (next.querySelector('img')) {
          container = next
          break
        }
        container = next
      }

      // Title precedence: overlay anchor aria-label → .resources-item-top text →
      // container text (capped). The overlay anchor's own textContent is empty
      // by construction, so we never use it.
      const ariaLabel = a.getAttribute('aria-label')?.trim() ?? ''
      const topEl = container.querySelector('.resources-item-top')
      const topText = (topEl?.textContent ?? '').trim().replace(/\s+/g, ' ')
      const containerText = (container.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 200)
      const title = ariaLabel || topText || containerText

      const img = container.querySelector('img') as HTMLImageElement | null
      const thumbnailUrl = img?.src ?? null
      const thumbnailAlt = img?.getAttribute('alt') ?? null

      const category: 'blog' | 'customer-story' = /^\/customer-story\/.+/.test(path) ? 'customer-story' : 'blog'

      cards.push({ category, url: a.href, title, thumbnailUrl, thumbnailAlt })
    }
    return cards
  })
}

async function captureResourcesMega(page: Page): Promise<ResourcesMegaCapture> {
  await closeAllDropdowns(page)
  const opened = await openDropdown(page, 'Resources')
  if (!opened) throw new Error('failed to open Resources dropdown')
  const payload = await readVisibleMenuPanel(page, 'resources')
  if (!payload) throw new Error('Resources mega-menu panel not visible after open')

  const RESOURCE_PATHS = ['/downloads', '/tools', '/videos', '/events']
  const leftItems: ResourcesLeftItem[] = payload.links
    .filter(
      (l) =>
        RESOURCE_PATHS.some((p) => new URL(l.url).pathname.startsWith(p)) && !LABEL_BLOCKLIST_RE.test(l.label),
    )
    .map((l) => ({
      label: l.label,
      url: l.url,
      iconSource: l.iconSource,
      iconUrl: l.iconUrl,
      iconName: l.iconName,
      iconSvgInline: l.iconSvgInline,
      iconAlt: l.iconAlt,
    }))

  // Strategy 6 cards (DELTA-C + DELTA-D)
  const allCards = await captureResourceCards(page)
  const featuredPosts = allCards
    .filter((c) => c.category === 'blog')
    .slice(0, 3)
    .map((c) => ({
      title: c.title,
      url: c.url,
      thumbnailUrl: c.thumbnailUrl ?? '',
      thumbnailAlt: c.thumbnailAlt ?? '',
    }))
  const featuredStories = allCards
    .filter((c) => c.category === 'customer-story')
    .slice(0, 3)
    .map((c) => ({
      headline: c.title,
      url: c.url,
      logoUrl: c.thumbnailUrl ?? '',
      logoAlt: c.thumbnailAlt ?? '',
    }))

  const blogViewAll = payload.links.find((l) => {
    try {
      const p = new URL(l.url).pathname
      return p === '/blog' || p === '/blog/'
    } catch {
      return false
    }
  })
  const storiesViewAll = payload.links.find((l) => {
    try {
      const p = new URL(l.url).pathname
      return p === '/customer-stories' || p === '/customer-stories/'
    } catch {
      return false
    }
  })

  if (featuredPosts.length === 0) console.warn('  ⚠️ no featured blog cards found in Resources panel (expected 3)')
  if (featuredStories.length === 0) console.warn('  ⚠️ no featured customer-story cards found in Resources panel (expected 3)')

  return {
    leftColumn: {
      sectionLabel: 'Resources',
      items: leftItems,
    },
    middleColumn: {
      sectionLabel: 'Blogs',
      viewAllLink: blogViewAll ? { label: 'View all', url: blogViewAll.url } : null,
      featuredPosts,
    },
    rightColumn: {
      sectionLabel: 'Customer Stories',
      viewAllLink: storiesViewAll ? { label: 'View all', url: storiesViewAll.url } : null,
      featuredStories,
    },
    rawHtml: payload.outerHtml,
  }
}

// ────────────────────────────────────────────────────────────────────────
// Primary nav + CTA capture
// ────────────────────────────────────────────────────────────────────────

interface PrimaryNavCapture {
  primaryLinks: PrimaryLink[]
  ctaButton: CtaCapture
}

const CTA_CANONICAL_URL = 'https://calendly.com/d/cwwf-6k5-2qy/intro-call-cloud-employee'

// CTA-affordance labels that should NOT be treated as mega-menu items.
// These are generic action prompts (e.g. "Learn more", "View all") that
// appear inside cards but route into wrapper pages, not service/technology
// docs. The runtime collision check in main() verifies no Sanity doc has a
// name matching any of these — if a future doc literally named "Learn More"
// is added, the script will warn before applying the blocklist.
const LABEL_BLOCKLIST_RE = /^(learn more|view all|see more|read more|explore|find out more)$/i
const LABEL_BLOCKLIST_LITERALS = ['learn more', 'view all', 'see more', 'read more', 'explore', 'find out more']

interface RawCtaProbe {
  found: boolean
  tagName: string
  matchedText: string
  href: string | null
  dataAttrs: Record<string, string>
  onclickAttr: string | null
}

async function capturePrimaryNav(page: Page): Promise<PrimaryNavCapture> {
  const data = await page.evaluate(() => {
    const header = document.querySelector('header') ?? document.querySelector('[role="banner"]')
    if (!header) return { items: [], cta: null as RawCtaProbe | null }
    const anchors = Array.from(header.querySelectorAll('a')) as HTMLAnchorElement[]
    const items = anchors
      .filter((a) => {
        const t = (a.textContent ?? '').trim()
        return t.length > 0 && t.length < 40 && a.href && !a.href.includes('calendly.com')
      })
      .map((a) => ({ label: (a.textContent ?? '').trim().replace(/\s+/g, ' '), url: a.href }))

    // CTA probe — DOM walk for "Schedule a Call" matching anchor OR button OR
    // div. Records tag, href (if any), data-* attributes, and onclick — so the
    // caller can pick the highest-fidelity URL source available.
    const ctaLabelPattern = /schedule a call/i
    let ctaProbe: RawCtaProbe | null = null
    const all = Array.from(header.querySelectorAll('*')) as Element[]
    for (const el of all) {
      const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ')
      if (!ctaLabelPattern.test(text)) continue
      // skip elements that bundle the entire nav strip (text far longer than label)
      if (text.length > 'Schedule a Call'.length + 24) continue
      const dataAttrs: Record<string, string> = {}
      for (const attr of Array.from(el.attributes)) {
        if (attr.name.startsWith('data-')) dataAttrs[attr.name] = attr.value
      }
      const href = el.tagName === 'A' ? (el as HTMLAnchorElement).href : null
      const onclickAttr = el.getAttribute('onclick')
      ctaProbe = {
        found: true,
        tagName: el.tagName,
        matchedText: text,
        href,
        dataAttrs,
        onclickAttr,
      }
      break
    }
    return { items, cta: ctaProbe }
  })

  const seen = new Set<string>()
  const deduped: Array<{ label: string; url: string }> = []
  for (const item of data.items) {
    const key = `${item.label}|${item.url}`
    if (!seen.has(key)) {
      seen.add(key)
      deduped.push(item)
    }
  }

  const classify = (label: string): PrimaryLink['dropdownType'] => {
    if (/services/i.test(label)) return 'services-mega'
    if (/how it works/i.test(label)) return 'how-it-works-mega'
    if (/resources/i.test(label)) return 'resources-mega'
    return 'none'
  }

  const wanted = ['Services', 'Our Clients', 'How It Works', 'Resources', 'Pricing', 'About Us']
  const primaryLinks: PrimaryLink[] = wanted
    .map((label) => {
      const match = deduped.find((d) => d.label.toLowerCase() === label.toLowerCase())
      if (!match) return null
      return { label, url: match.url, dropdownType: classify(label) }
    })
    .filter((x): x is PrimaryLink => x !== null)

  // Resolve CTA URL by precedence: anchor href → data-attribute → canonical fallback.
  let ctaButton: CtaCapture
  if (data.cta && data.cta.found) {
    const probe = data.cta
    const dataAttrUrl = Object.values(probe.dataAttrs).find((v) => /^https?:\/\//i.test(v) && v.includes('calendly.com'))
    if (probe.href && probe.href.includes('calendly.com')) {
      ctaButton = {
        label: probe.matchedText,
        url: probe.href,
        captureMethod: 'anchor-href',
        captureNotes: `Anchor element with href to calendly. tag=${probe.tagName}.`,
      }
    } else if (dataAttrUrl) {
      const attrName =
        Object.entries(probe.dataAttrs).find(([, v]) => v === dataAttrUrl)?.[0] ?? '(unknown-attr)'
      ctaButton = {
        label: probe.matchedText,
        url: dataAttrUrl,
        captureMethod: 'data-attribute',
        captureNotes: `URL recovered from ${attrName} on ${probe.tagName} element.`,
      }
    } else {
      const dataAttrSummary =
        Object.keys(probe.dataAttrs).length > 0
          ? `data-attrs: ${Object.keys(probe.dataAttrs).join(',')}`
          : 'no data-* attrs'
      ctaButton = {
        label: probe.matchedText,
        url: CTA_CANONICAL_URL,
        captureMethod: 'canonical-fallback',
        captureNotes: `Element found (${probe.tagName}) but no usable URL on it. ${dataAttrSummary}. Falling back to canonical Calendly URL.`,
      }
    }
  } else {
    ctaButton = {
      label: 'Schedule a Call',
      url: CTA_CANONICAL_URL,
      captureMethod: 'canonical-fallback',
      captureNotes: 'No element matching "Schedule a Call" found in header during DOM walk. Falling back to canonical Calendly URL.',
    }
  }

  return { primaryLinks, ctaButton }
}

// ────────────────────────────────────────────────────────────────────────
// Footer capture
// ────────────────────────────────────────────────────────────────────────

interface RawCtaCandidate {
  label: string
  tagName: string
  href: string | null
  dataAttrs: Record<string, string>
}

interface RawFooterPayload {
  outerHtml: string
  links: CapturedLink[]
  ctaCandidates: RawCtaCandidate[]
  images: CapturedImage[]
  hubspotFormGuids: string[]
  copyrightText: string
  headings: Array<{ text: string; level: number }>
}

async function captureFooterRaw(page: Page): Promise<RawFooterPayload> {
  return page.evaluate(() => {
    const footer =
      document.querySelector('footer') ?? document.querySelector('[role="contentinfo"]') ?? document.querySelector('[class*="footer" i]')
    if (!footer) throw new Error('no footer found on page')

    const anchors = Array.from(footer.querySelectorAll('a')) as HTMLAnchorElement[]
    const links = anchors
      .filter((a) => (a.textContent ?? '').trim().length > 0)
      .map((a) => ({
        label: (a.textContent ?? '').trim().replace(/\s+/g, ' '),
        url: a.href,
        hasArrow: !!a.querySelector('svg, [class*="arrow" i], [class*="icon" i]'),
      }))

    // Fix 5 — CTA candidate sweep beyond anchors. The footer's primary CTA
    // "Start building your team" is a button (no href). Walk all button/role=button
    // /div-with-onclick elements + collect their text + data-* attrs so the
    // structured-build pass can apply canonical-fallback provenance.
    const ctaTextPattern = /^(start building your team|start hiring|book a call|schedule|talk to us|contact us today|contact us)$/i
    const ctaCandidates: RawCtaCandidate[] = []
    const ctaSeen = new Set<Element>()
    const allFooterEls = Array.from(footer.querySelectorAll('button, [role="button"], a, div, span'))
    for (const el of allFooterEls) {
      if (ctaSeen.has(el)) continue
      const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ')
      if (!ctaTextPattern.test(text)) continue
      if (text.length > 40) continue
      ctaSeen.add(el)
      const dataAttrs: Record<string, string> = {}
      for (const attr of Array.from(el.attributes)) {
        if (attr.name.startsWith('data-')) dataAttrs[attr.name] = attr.value
      }
      const href = el.tagName === 'A' ? (el as HTMLAnchorElement).href : null
      ctaCandidates.push({
        label: text,
        tagName: el.tagName,
        href,
        dataAttrs,
      })
    }

    const images = Array.from(footer.querySelectorAll('img')).map((i) => {
      const im = i as HTMLImageElement
      return {
        src: im.src,
        alt: im.getAttribute('alt') ?? '',
        width: im.naturalWidth || undefined,
        height: im.naturalHeight || undefined,
      }
    })

    const hubspotFormGuids: string[] = []
    Array.from(footer.querySelectorAll('[data-form-id], [data-hsforms-id]')).forEach((el) => {
      const v = el.getAttribute('data-form-id') ?? el.getAttribute('data-hsforms-id')
      if (v) hubspotFormGuids.push(v)
    })
    // also scan inline scripts for hubspot form GUIDs
    Array.from(document.querySelectorAll('script')).forEach((s) => {
      const t = s.textContent ?? ''
      const m = t.match(/formId:\s*['"]([0-9a-f-]{36})['"]/i)
      if (m) hubspotFormGuids.push(m[1])
    })

    const txt = footer.textContent ?? ''
    const copyrightMatch = txt.match(/©[^\n]{0,140}/)

    const headings = Array.from(footer.querySelectorAll('h1, h2, h3, h4, h5, h6')).map((h) => ({
      text: (h.textContent ?? '').trim(),
      level: parseInt(h.tagName.substring(1)),
    }))

    return {
      outerHtml: footer.outerHTML,
      links,
      ctaCandidates,
      images,
      hubspotFormGuids: Array.from(new Set(hubspotFormGuids)),
      copyrightText: copyrightMatch ? copyrightMatch[0] : '',
      headings,
    }
  })
}

// Resolve a CTA URL by precedence: anchor href → data-attribute calendly/url →
// canonical fallback. Mirrors the header CTA capture path.
function resolveFooterCta(raw: RawFooterPayload, labelPatterns: RegExp[], fallbackLabel: string, useCanonicalCalendly: boolean): CtaCapture {
  // First try anchor links (have href baked in).
  for (const re of labelPatterns) {
    const anchor = raw.links.find((l) => re.test(l.label))
    if (anchor && anchor.url) {
      return {
        label: anchor.label,
        url: anchor.url,
        captureMethod: 'anchor-href',
        captureNotes: `Anchor element with href.`,
      }
    }
  }
  // Fall back to non-anchor CTA candidates from the sweep.
  for (const re of labelPatterns) {
    const cand = raw.ctaCandidates.find((c) => re.test(c.label))
    if (!cand) continue
    if (cand.href && cand.href !== '') {
      return {
        label: cand.label,
        url: cand.href,
        captureMethod: 'anchor-href',
        captureNotes: `CTA element tag=${cand.tagName} with href.`,
      }
    }
    const dataAttrUrl = Object.values(cand.dataAttrs).find((v) => /^https?:\/\//i.test(v))
    if (dataAttrUrl) {
      const attrName = Object.entries(cand.dataAttrs).find(([, v]) => v === dataAttrUrl)?.[0] ?? '(unknown-attr)'
      return {
        label: cand.label,
        url: dataAttrUrl,
        captureMethod: 'data-attribute',
        captureNotes: `URL recovered from ${attrName} on ${cand.tagName} element.`,
      }
    }
    // Element found, no usable URL → canonical fallback (when applicable)
    const dataSummary = Object.keys(cand.dataAttrs).length > 0 ? `data-attrs: ${Object.keys(cand.dataAttrs).join(',')}` : 'no data-* attrs'
    return {
      label: cand.label,
      url: useCanonicalCalendly ? CTA_CANONICAL_URL : '',
      captureMethod: 'canonical-fallback',
      captureNotes: `Element found (${cand.tagName}) but no usable URL on it. ${dataSummary}. ${useCanonicalCalendly ? 'Falling back to canonical Calendly URL.' : 'No canonical fallback configured for this CTA.'}`,
    }
  }
  // Nothing matched.
  return {
    label: fallbackLabel,
    url: useCanonicalCalendly ? CTA_CANONICAL_URL : '',
    captureMethod: 'canonical-fallback',
    captureNotes: `No element matching "${fallbackLabel}" found in footer during sweep. ${useCanonicalCalendly ? 'Falling back to canonical Calendly URL.' : 'No URL captured.'}`,
  }
}

function buildStructuredFooter(raw: RawFooterPayload): FooterCapture {
  // CTA block — heading "Ready to hire your next engineer?" + two CTAs at the top.
  const ctaHeading = raw.headings.find((h) => /ready to hire/i.test(h.text))?.text ?? 'Ready to hire your next engineer?'

  // Fix 5 — both CTAs go through the canonical-fallback resolver. "Start
  // building your team" is a button (no href) that opens Calendly via JS;
  // gets the canonical Calendly URL. "Contact us today" is an anchor with
  // a real href to /contact; gets captureMethod: 'anchor-href'.
  const primaryCta = resolveFooterCta(
    raw,
    [/^start building your team$/i, /^start hiring$/i, /^book a call$/i],
    'Start building your team',
    true, // canonical Calendly fallback applies
  )
  const secondaryCta = resolveFooterCta(
    raw,
    [/^contact us today$/i, /^contact us$/i],
    'Contact us today',
    false, // not a Calendly opener; leave url empty if not found
  )

  // Heuristic column splits: well-known labels group into Our Expertise / Learn more.
  const expertiseStaffAug = [
    'Software Engineers',
    'AI Engineers',
    'Fractional CTOs',
    'Mobile Developers',
    'QA Analysts & Testers',
    'DevOps Engineers',
    'Data Scientists',
    'No-Code Developers',
  ]
  const expertiseTechnology = ['React', 'Node.js', 'Python', 'TypeScript', 'AWS', '.NET', 'Java']
  const learnAbout = ['How it works', 'About us', 'Pricing', 'Reviews', 'Careers']
  const learnResources = ['Customer Stories', 'CE vs. Alternatives', 'Blogs', 'Free Downloads', 'Tools', 'Video Library']

  const matchLinks = (labels: string[]): CapturedLink[] =>
    labels.map((l) => {
      const found = raw.links.find((r) => r.label.toLowerCase() === l.toLowerCase())
      return found ?? { label: l, url: '' }
    })

  const sections: FooterSection[] = [
    {
      sectionLabel: 'Our Expertise',
      sectionLabelStyle: 'pill-outline-light',
      columns: [
        {
          heading: 'Full-time Staff Augmentation',
          headingHasArrow: true,
          headingUrl: raw.links.find((l) => /staff augmentation/i.test(l.label))?.url ?? null,
          links: matchLinks(expertiseStaffAug),
        },
        {
          heading: 'Technology',
          headingHasArrow: true,
          headingUrl: raw.links.find((l) => l.label.toLowerCase() === 'technology')?.url ?? null,
          links: matchLinks(expertiseTechnology),
        },
      ],
      bottomPillLinks: [
        {
          label: 'Project Builds',
          url: raw.links.find((l) => /project builds/i.test(l.label))?.url ?? '',
          hasArrow: true,
        },
        {
          label: 'AI Services',
          url: raw.links.find((l) => /ai services/i.test(l.label))?.url ?? '',
          hasArrow: true,
        },
      ],
    },
    {
      sectionLabel: 'Learn more',
      sectionLabelStyle: 'pill-outline-light',
      columns: [
        {
          heading: 'About',
          headingHasArrow: true,
          headingUrl: raw.links.find((l) => l.label.toLowerCase() === 'about')?.url ?? null,
          links: matchLinks(learnAbout),
        },
        {
          heading: 'Resources',
          headingHasArrow: true,
          headingUrl: raw.links.find((l) => l.label.toLowerCase() === 'resources')?.url ?? null,
          links: matchLinks(learnResources),
        },
      ],
      bottomPillLinks: null,
    },
  ]

  const talentLocations = {
    sectionLabel: 'Talent Locations',
    sectionLabelStyle: 'pill-outline-light',
    items: [
      {
        label: 'LATAM Developers',
        url: raw.links.find((l) => /latam/i.test(l.label))?.url ?? '',
      },
      {
        label: 'Philippines Developers',
        url: raw.links.find((l) => /philippines/i.test(l.label))?.url ?? '',
      },
    ],
  }

  const subscribeHeading = raw.headings.find((h) => /subscribe/i.test(h.text))?.text ?? 'Subscribe'
  const subscribe = {
    heading: subscribeHeading,
    description: 'Everything you need to find, manage and retain exceptional tech talent, delivered monthly.',
    formId: raw.hubspotFormGuids[0] ?? KNOWN_SUBSCRIBE_FORM_GUID,
    submitLabel: 'Subscribe',
  }

  const bottomBar = {
    copyrightText: raw.copyrightText.replace(/\d{4}/, '{year}') || '© {year} Cloud Employee. All rights reserved.',
    links: ['General Terms', 'Privacy Policy', 'Sitemap']
      .map((lbl) => raw.links.find((r) => r.label.toLowerCase() === lbl.toLowerCase()) ?? { label: lbl, url: '' }),
    regionSelector: {
      enabled: true,
      options: [
        { label: 'US', url: `${CE_HOST}/` },
        { label: 'UK', url: `${CE_HOST}/uk/` },
      ],
    },
  }

  return {
    topCtaBlock: {
      heading: ctaHeading,
      statRow: '300+ teams built · 97% stay 2+ years · Cancel anytime',
      primaryCta,
      secondaryCta,
    },
    sections,
    talentLocations,
    subscribe,
    bottomBar,
    rawHtml: raw.outerHtml,
  }
}

// ────────────────────────────────────────────────────────────────────────
// Slug-match against Sanity
// ────────────────────────────────────────────────────────────────────────

interface SanityMatchRow {
  _id: string
  _type: 'service' | 'technology'
  slug: string
  name: string | null
  thumbnailUrl: string | null
}

async function fetchAllMatchableDocs(): Promise<SanityMatchRow[]> {
  const query = `*[_type in ['service', 'technology']]{
    _id,
    _type,
    "slug": slug.current,
    "name": coalesce(name, technologyName),
    "thumbnailUrl": select(
      _type == 'service' => thumbnail.asset->url,
      _type == 'technology' => techLogo.asset->url,
      null
    )
  }`
  return sanity.fetch<SanityMatchRow[]>(query)
}

function matchSlug(
  href: string,
  docs: SanityMatchRow[],
): { matchedDocId: string | null; matchedDocType: 'service' | 'technology' | null; matchedDocThumbnail: string | null } {
  const slugInfo = slugFromHref(href)
  if (!slugInfo) return { matchedDocId: null, matchedDocType: null, matchedDocThumbnail: null }
  const candidates = docs.filter((d) => d.slug === slugInfo.slug)
  // Prefer a same-route-prefix match: /services/* → service, /technology/* → technology
  const exact =
    candidates.find((d) => d._type === slugInfo.routePrefix.replace(/s$/, '')) ??
    candidates[0]
  if (!exact) return { matchedDocId: null, matchedDocType: null, matchedDocThumbnail: null }
  return {
    matchedDocId: exact._id,
    matchedDocType: exact._type,
    matchedDocThumbnail: exact.thumbnailUrl,
  }
}

function flattenMegaMenuItems(
  nav: NavigationCapture,
): Array<{ label: string; url: string; tagline: string | null; iconSource: IconSource; iconUrl: string | null; iconName: string | null }> {
  const out: Array<{ label: string; url: string; tagline: string | null; iconSource: IconSource; iconUrl: string | null; iconName: string | null }> = []
  const push = (items: CapturedItem[]) => {
    for (const i of items) {
      // Fix 1+3 — label blocklist: skip generic CTA-affordance text that
      // happens to be wrapped in an anchor with a /services/ or /technology/ href.
      // Runtime collision check (in main()) verifies no Sanity doc has a name
      // matching the blocklist before this filter is applied.
      if (LABEL_BLOCKLIST_RE.test(i.label)) continue
      out.push({
        label: i.label,
        url: i.url,
        tagline: i.tagline,
        iconSource: i.iconSource,
        iconUrl: i.iconUrl,
        iconName: i.iconName,
      })
    }
  }
  push(nav.servicesMegaMenu.leftColumn.highlightedItems ?? [])
  push(nav.servicesMegaMenu.leftColumn.items)
  push(nav.servicesMegaMenu.rightColumnTop.items)
  for (const s of nav.servicesMegaMenu.rightColumnBottom.sections) push(s.items)
  return uniqueByUrl(out)
}

// ────────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('STATIC-2 Step 1: live-site chrome audit\n')
  await ensureDir(OUT_ROOT)
  await ensureDir(ASSETS_NAV)
  await ensureDir(ASSETS_FOOTER)
  await ensureDir(ASSETS_HIW)

  const { browser, page } = await launchBrowser()
  try {
    // ── Navigate + GeoTargetly check
    await gotoCe(page, '/')

    // ── Header default + scroll behavior
    console.log('\n[1/7] capture scroll behavior')
    const scrollBehavior = await captureScrollBehavior(page)
    await writeJson('scroll-behavior.json', scrollBehavior)

    // ── STATIC-3 brief delta: floating-pill VISUAL TREATMENT is scroll-triggered
    //    Surfacing this here, not in the STATIC-3 brief, so STATIC-3 plan-mode
    //    must address it explicitly before Step 1.
    await writeJson('static-3-brief-deltas.json', {
      finding: 'STATIC-3-DELTA-1',
      severity: 'scope-change',
      summary: 'Floating-pill visual treatment is scroll-triggered, not steady-state',
      brief_claim:
        "STATIC-3 §1: 'live CE site shows the floating pill at scroll-position-0; it is not a scrolled state'",
      audit_finding:
        'scroll-0 header has transparent bg + no shadow + border-radius 30px; scroll-200 header has opaque white bg + soft shadow + border-radius 16px',
      implication:
        'STATIC-3 needs a scroll listener after all, OR ships the scrolled-state visual at all scroll positions (no listener) and accepts the visual delta. Plan-mode decision required at STATIC-3 Step 0.',
      data_source: 'audit-output/static-2/scroll-behavior.json',
    })

    // ── Primary nav + CTA
    console.log('\n[2/7] capture primary nav')
    const primary = await capturePrimaryNav(page)
    console.log(`  primary links: ${primary.primaryLinks.map((l) => l.label).join(', ')}`)
    console.log(`  CTA: ${primary.ctaButton.label} → ${primary.ctaButton.url}`)

    // ── Mega-menus
    console.log('\n[3/7] capture Services mega-menu')
    const services = await captureServicesMega(page)
    console.log(`  ${services.leftColumn.items.length + (services.leftColumn.highlightedItems?.length ?? 0)} left, ${services.rightColumnTop.items.length} tech, ${services.rightColumnBottom.sections.reduce((n, s) => n + s.items.length, 0)} ai/product`)

    console.log('\n[4/7] capture How It Works mega-menu')
    const howItWorks = await captureHowItWorksMega(page)
    console.log(`  cards: ${howItWorks.cards.length}, bottom-panel-photo: ${howItWorks.bottomPanel.imageUrl ? 'yes' : 'no'}`)

    console.log('\n[5/7] capture Resources mega-menu')
    const resources = await captureResourcesMega(page)
    console.log(`  left: ${resources.leftColumn.items.length}, posts: ${resources.middleColumn.featuredPosts.length}, stories: ${resources.rightColumn.featuredStories.length}`)

    await closeAllDropdowns(page)

    const headerRawHtml = await captureHeaderRawHtml(page)

    const navigation: NavigationCapture = {
      primaryLinks: primary.primaryLinks,
      ctaButton: primary.ctaButton,
      servicesMegaMenu: services,
      howItWorksMegaMenu: howItWorks,
      resourcesMegaMenu: resources,
      headerRawHtml,
    }
    await writeJson('navigation.json', navigation)

    // ── Footer
    console.log('\n[6/7] capture footer')
    const footerRaw = await captureFooterRaw(page)
    const footer = buildStructuredFooter(footerRaw)
    if (footer.subscribe.formId !== KNOWN_SUBSCRIBE_FORM_GUID) {
      console.warn(`  subscribe form GUID mismatch: captured ${footer.subscribe.formId}, expected ${KNOWN_SUBSCRIBE_FORM_GUID}`)
    }
    await writeJson('footer.json', footer)

    // ── Asset downloads
    console.log('\n[7/7] download assets + write manifests')
    const manifest: AssetManifestEntry[] = []

    // Dispatcher — chooses between fetch-download and inline-SVG save based on
    // iconSource. For material-font / svg-use, no asset to save; the manifest
    // entry isn't created. Currently only used for Resources left-column icons
    // (material-font case dominant after DELTA-1 drop).
    const persistIconAsset = async (
      item: { label: string; iconSource: IconSource; iconUrl: string | null; iconSvgInline?: string | null },
      intoDir: string,
      surface: AssetManifestEntry['surface'],
      contextLabel: string,
    ): Promise<AssetManifestEntry | null> => {
      if (item.iconSource === 'img-src' || item.iconSource === 'background-image') {
        if (!item.iconUrl) return null
        return downloadAsset(item.iconUrl, intoDir, surface, contextLabel)
      }
      if (item.iconSource === 'inline-svg' && item.iconSvgInline) {
        await ensureDir(intoDir)
        const buf = Buffer.from(item.iconSvgInline, 'utf8')
        const hash = sha256(buf)
        const filename = `${hash.slice(0, 8)}.svg`
        const localPath = path.join(intoDir, filename)
        await fs.writeFile(localPath, buf)
        return {
          originalUrl: 'inline-svg',
          localPath: path.relative(process.cwd(), localPath),
          sha256: hash,
          bytes: buf.length,
          surface,
          contextLabel,
        }
      }
      // svg-use + material-font: nothing to download. Recorded elsewhere.
      return null
    }

    // Resources left-column icons (4 expected; live site uses Material icon font so most resolve to material-font with iconName)
    for (const item of resources.leftColumn.items) {
      const entry = await persistIconAsset(item, ASSETS_NAV, 'nav', `resources-icon-${item.label}`)
      if (entry) manifest.push(entry)
    }
    // Resources featured-post thumbnails (3 expected — these are img-src)
    for (const post of resources.middleColumn.featuredPosts) {
      if (post.thumbnailUrl) {
        const entry = await downloadAsset(post.thumbnailUrl, ASSETS_NAV, 'nav', `resources-blog-${post.title}`)
        if (entry) manifest.push(entry)
      }
    }
    // Resources customer-story logos (3 expected — img-src on dark-green cards)
    for (const story of resources.rightColumn.featuredStories) {
      if (story.logoUrl) {
        const entry = await downloadAsset(story.logoUrl, ASSETS_NAV, 'nav', `resources-story-${story.headline}`)
        if (entry) manifest.push(entry)
      }
    }
    // How It Works photos (4 expected — 3 cards + 1 bottom panel; Option B locked)
    const hiwCapturedPhotos: Array<{ key: string; liveUrl: string; localPath: string }> = []
    for (const card of howItWorks.cards) {
      if (card.imageUrl) {
        const entry = await downloadAsset(card.imageUrl, ASSETS_HIW, 'how-it-works-photos', `card-${card.title}`)
        if (entry) {
          manifest.push(entry)
          hiwCapturedPhotos.push({ key: card.title, liveUrl: card.imageUrl, localPath: entry.localPath })
        }
      }
    }
    if (howItWorks.bottomPanel.imageUrl) {
      const entry = await downloadAsset(howItWorks.bottomPanel.imageUrl, ASSETS_HIW, 'how-it-works-photos', 'bottom-panel')
      if (entry) {
        manifest.push(entry)
        hiwCapturedPhotos.push({ key: 'bottomPanel', liveUrl: howItWorks.bottomPanel.imageUrl, localPath: entry.localPath })
      }
    }
    // Footer images (wordmark, decorative)
    for (const img of footerRaw.images) {
      if (img.src) {
        const entry = await downloadAsset(img.src, ASSETS_FOOTER, 'footer', `footer-img-${img.alt || shortHash(img.src)}`)
        if (entry) manifest.push(entry)
      }
    }
    // (DELTA-1 service-icon-backfill DROPPED — see static-2-brief-deltas.json STATIC-2-DELTA-B.
    // Probe of live-site DOM confirmed service items have no icons. Reference
    // screenshot confirms text-only items. Services mega-menu renders text-only
    // matching the live site; service.thumbnail stays null on all 23 docs.)
    await writeJson('assets-manifest.json', { count: manifest.length, items: manifest })

    // ── Slug-match against Sanity
    console.log('\nslug-match against Sanity (read-only)')
    const sanityDocs = await fetchAllMatchableDocs()
    console.log(`  fetched ${sanityDocs.length} service+technology docs from Sanity`)

    // Sanity collision check — confirm no real doc has a name that would be
    // filtered out by LABEL_BLOCKLIST_RE. If a service is literally named
    // "Learn more", drop the blocklist filter and warn (better to keep a
    // legitimate doc + accept one false positive than to lose a real item).
    const sanityCollisions = sanityDocs.filter(
      (d) => d.name !== null && LABEL_BLOCKLIST_LITERALS.includes(d.name.toLowerCase()),
    )
    if (sanityCollisions.length > 0) {
      console.warn(
        `  ⚠️ ${sanityCollisions.length} Sanity docs collide with label blocklist — blocklist filter NOT applied:`,
      )
      for (const c of sanityCollisions) console.warn(`     - ${c._type} "${c.name}" (slug: ${c.slug})`)
    } else {
      console.log(`  blocklist sanity-check: 0 Sanity docs collide with ${LABEL_BLOCKLIST_LITERALS.length}-pattern blocklist (filter safe to apply)`)
    }

    const allMegaItems = flattenMegaMenuItems(navigation)
    const slugMatchEntries: SlugMatchEntry[] = allMegaItems.map((item) => {
      const m = matchSlug(item.url, sanityDocs)
      return {
        label: item.label,
        url: item.url,
        capturedTagline: item.tagline,
        capturedIconUrl: item.iconUrl,
        matchStatus: m.matchedDocId ? 'matched' : 'orphan',
        matchedDocId: m.matchedDocId,
        matchedDocType: m.matchedDocType,
        matchedDocThumbnail: m.matchedDocThumbnail,
      }
    })

    // Footer-surface probes (Java, Reviews, CE vs. Alternatives)
    const footerProbes = ['Java', 'Reviews', 'CE vs. Alternatives']
    for (const label of footerProbes) {
      const link = footerRaw.links.find((l) => l.label.toLowerCase() === label.toLowerCase())
      if (!link) continue
      const m = matchSlug(link.url, sanityDocs)
      slugMatchEntries.push({
        label,
        url: link.url,
        capturedTagline: null,
        capturedIconUrl: null,
        matchStatus: m.matchedDocId ? 'matched' : 'orphan',
        matchedDocId: m.matchedDocId,
        matchedDocType: m.matchedDocType,
        matchedDocThumbnail: m.matchedDocThumbnail,
      })
    }
    const orphans = slugMatchEntries.filter((e) => e.matchStatus === 'orphan')
    console.log(`  matched: ${slugMatchEntries.length - orphans.length}, orphans: ${orphans.length}`)
    await writeJson('slug-match-report.json', {
      totalProbed: slugMatchEntries.length,
      matched: slugMatchEntries.length - orphans.length,
      orphans: orphans.length,
      entries: slugMatchEntries,
    })

    // ── How It Works photo comparison (Option B deterministic stub per DELTA-2/4)
    await writeJson('how-it-works-photo-comparison.json', {
      decision: 'B',
      reason:
        'Sanity singletons (sourcingPage / embeddingPage / retentionPage / howItWorksPage) are empty stubs; no hero URLs exist to compare against. Locked at plan-mode close.',
      capturedPhotos: hiwCapturedPhotos,
    })

    // (DELTA-1 backfill manifest DROPPED — service items have no icons on live site
    // per panel-shape probe + reference screenshot confirmation. See
    // static-2-brief-deltas.json STATIC-2-DELTA-B for 7 brief edits required at
    // phase close.)

    // ── STATIC-2 brief-vs-reality findings (canonical write — overwrites any
    //    bootstrap version written by probe-panel-shape.ts)
    await writeJson('static-2-brief-deltas.json', {
      'STATIC-2-DELTA-A': {
        finding: 'Footer primary CTA label',
        brief_claim:
          "Footer §Top CTA block 'Start building your team' (per STATIC-2 brief Step 1 §5 + STATIC-3 brief Step 5 §3)",
        audit_finding: `Live footer primary CTA labeled "${footer.topCtaBlock.primaryCta.label}" → ${footer.topCtaBlock.primaryCta.url}`,
        implication:
          'Step 4 reseed should populate the captured label + url. If the brief intended "Start building your team", the live site has drifted since screenshots were captured. Jake decides.',
        data_source: 'audit-output/static-2/footer.json topCtaBlock.primaryCta',
      },
      'STATIC-2-DELTA-B': {
        finding: 'Service mega-menu items have NO icons on live site',
        brief_claim:
          "Brief §1 'Extended scope: service.thumbnail backfill' premised on audit downloading service icons from the live mega-menu",
        audit_finding:
          'Probe of all service-route items shows the anchor DOM is just two text divs (h6-nav name + small-p grey tagline). No <img>, no <svg>, no background-image, no Material-icon span. Reference screenshot mega-menu-services.png confirms text-only items.',
        resolution:
          'DROP DELTA-1 scope entirely. Services mega-menu renders text-only (matches live site). service.thumbnail remains null on all 23 docs. Hybrid CMS-driven architecture still works for name + tagline references. Schema field stays in case editorial wants to add icons later.',
        brief_edits_at_phase_close: [
          "STATIC-2 §1 — remove 'Extended scope: service.thumbnail backfill' paragraph",
          'STATIC-2 §3 Step 1 — remove item 9 (service icon capture)',
          'STATIC-2 §3 Step 4 — remove step 2 (service.thumbnail patch)',
          'STATIC-2 §3 Step 4 gate — remove the defined(thumbnail.asset) check',
          'STATIC-2 §3 Step 0 item 15 — revise asset count expectation back to 4-8 (4 Resources icons + 4 HIW photos)',
          'STATIC-2 §5 Risks — remove DELTA-1 row',
          'STATIC-2 §4 Modify — keep the type-aware GROQ select() projection (still correct; technology.techLogo still applies)',
        ],
        data_source: 'audit-output/static-2/panel-shape-probe.json + docs/design/static-3-reference/mega-menu-services.png',
      },
      'STATIC-2-DELTA-C': {
        finding: 'Customer story URLs use SINGULAR /customer-story/<slug>',
        audit_finding:
          '7 customer-story cards in Resources panel use /customer-story/<slug> (singular). Plural /customer-stories is the index/listing route.',
        resolution:
          'Updated extract-chrome.ts URL filter to /^\\/customer-story\\/.+/. Captured cards now populate featuredStories. No brief edit needed (brief is route-agnostic on this).',
        data_source: 'audit-output/static-2/panel-shape-probe.json',
      },
      'STATIC-2-DELTA-D': {
        finding: 'Resources blog cards span multiple URL namespaces, not /blog/',
        audit_finding:
          'Blog posts live at /nearshoring-offshoring/<slug>, /hiring-tips/<slug>, /scaling-teams/<slug>, etc. Probe found 4 such cards across 3 namespaces. The /blog URL is the hub index, not the per-post namespace.',
        resolution:
          "Updated extract-chrome.ts Strategy 6 to detect blog cards by 'non-customer-story' pattern within Resources panel rather than '/blog/' prefix. Brief 'featuredPosts' description is route-shape-agnostic; no brief edit needed.",
        data_source: 'audit-output/static-2/panel-shape-probe.json',
      },
    })

    console.log('\n── summary ──')
    console.log(`  primary nav links: ${navigation.primaryLinks.length}`)
    console.log(`  services items: ${flattenMegaMenuItems(navigation).length}`)
    console.log(`  how-it-works cards: ${howItWorks.cards.length}`)
    console.log(`  resources left/posts/stories: ${resources.leftColumn.items.length}/${resources.middleColumn.featuredPosts.length}/${resources.rightColumn.featuredStories.length}`)
    const leftIconBreakdown: Record<string, number> = {}
    for (const i of resources.leftColumn.items) {
      const k = i.iconSource ?? 'none'
      leftIconBreakdown[k] = (leftIconBreakdown[k] ?? 0) + 1
    }
    console.log(`  resources leftColumn iconSource: ${JSON.stringify(leftIconBreakdown)}`)
    console.log(`  footer raw links: ${footerRaw.links.length}`)
    console.log(`  total assets downloaded: ${manifest.length}`)
    console.log(`  slug-match orphans: ${orphans.length}`)
    if (orphans.length > 0) {
      console.log('\n  ⚠️  orphans:')
      for (const o of orphans) console.log(`    - ${o.label} → ${o.url}`)
    }
    console.log('\nstep 1 audit complete.')
  } finally {
    await browser.close()
  }
}

main().catch((err) => {
  console.error('\nFAIL:', err)
  process.exit(1)
})

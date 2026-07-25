// MYGRATR-STATIC-2 Step 1 — panel-shape diagnostic probe.
//
// extract-chrome.ts's 5-strategy icon extraction returned `iconSource: null`
// for every service-mega-menu item. The screenshots show icons render on the
// live site, so they exist — just not where the anchor-scoped extraction
// looks. This probe dumps the actual DOM structure of each mega-menu panel
// so a new strategy can be designed from data instead of assumptions.
//
// Outputs:
//   - audit-output/static-2/panel-shape-probe.json
//   - audit-output/static-2/static-2-brief-deltas.json
//
// Self-contained: duplicates browser setup + trigger logic from
// extract-chrome.ts intentionally (this is one-off diagnostic code, no need
// to refactor the main audit for it).
//
// Run: `npm run audit:static-2:probe`

import 'dotenv/config'

import * as fs from 'node:fs/promises'
import * as path from 'node:path'

import type { Browser, Page } from 'playwright'
import { chromium } from 'playwright'

const CE_HOST = 'https://www.cloudemployee.io'
const OUT_ROOT = path.resolve(process.cwd(), 'audit-output', 'static-2')
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

// ────────────────────────────────────────────────────────────────────────
// Browser setup (mirrors extract-chrome.ts)
// ────────────────────────────────────────────────────────────────────────

async function launchBrowser(): Promise<{ browser: Browser; page: Page }> {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    userAgent: USER_AGENT,
    locale: 'en-US',
    extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' },
    viewport: { width: 1440, height: 900 },
  })
  await context.route(/geotargetly\.com/, (route) => route.fulfill({ status: 200, body: '/* stubbed */' }))
  await context.addInitScript(() => {
    ;(window as unknown as { __name: (fn: unknown) => unknown }).__name = (fn) => fn
  })
  const page = await context.newPage()
  page.setDefaultTimeout(30_000)
  return { browser, page }
}

async function gotoCe(page: Page, urlPath = '/'): Promise<void> {
  const target = `${CE_HOST}${urlPath}`
  console.log(`→ ${target}`)
  await page.goto(target, { waitUntil: 'networkidle', timeout: 15_000 }).catch(async () => {
    await page.goto(target, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1500)
  })
}

// ────────────────────────────────────────────────────────────────────────
// Trigger discovery (slim version — matches extract-chrome.ts's approach)
// ────────────────────────────────────────────────────────────────────────

async function findAndTagTrigger(page: Page, triggerText: string): Promise<{ x: number; y: number; token: string } | null> {
  return page.evaluate((label) => {
    const target = label.toLowerCase().trim()
    const token = target.replace(/\s+/g, '-')
    const header =
      document.querySelector('header') ??
      document.querySelector('[role="banner"]') ??
      document.querySelector('.w-nav') ??
      document.body
    const scaffold = ['.w-nav', '.w-dropdown', '.w-dropdown-toggle', '[class*="dropdown" i]', '[class*="nav-link" i]', '[class*="navbar" i]', 'nav']
    const scopes: Element[] = [header]
    for (const sel of scaffold) header.querySelectorAll(sel).forEach((el) => scopes.push(el))

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

    const isToggleAncestor = (el: Element): boolean => {
      const cls = (typeof el.className === 'string' ? (el.className as string) : '').toLowerCase()
      if (cls.includes('w-dropdown-toggle')) return true
      if (cls.includes('w-dropdown') && !cls.includes('w-dropdown-list')) return true
      if (el.hasAttribute('data-hover')) return true
      return false
    }
    let toggle: Element = best.el
    let walker: Element | null = best.el
    for (let i = 0; i < 5 && walker; i++) {
      if (isToggleAncestor(walker)) {
        toggle = walker
        break
      }
      walker = walker.parentElement
    }

    // sibling panel discovery + tag
    const findPanel = (start: Element): Element | null => {
      const cands: Element[] = []
      const parent = start.parentElement
      if (parent) {
        Array.from(parent.children).forEach((c) => {
          if (c !== start) cands.push(c)
        })
        const gp = parent.parentElement
        if (gp) {
          Array.from(gp.children).forEach((c) => {
            if (c !== parent && c !== start) cands.push(c)
          })
        }
      }
      for (const c of cands) {
        const cls = (typeof c.className === 'string' ? (c.className as string) : '').toLowerCase()
        if (cls.includes('w-dropdown-list') || cls.includes('dropdown-list')) return c
      }
      return null
    }
    toggle.setAttribute('data-mygratr-toggle', token)
    const panel = findPanel(toggle)
    if (panel) panel.setAttribute('data-mygratr-panel', token)

    const rect = toggle.getBoundingClientRect()
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, token }
  }, triggerText)
}

async function waitForPanelVisible(page: Page, token: string, timeoutMs: number): Promise<boolean> {
  try {
    await page.waitForFunction(
      (t) => {
        const panel = document.querySelector(`[data-mygratr-panel="${t}"]`)
        if (!panel) return false
        const cs = getComputedStyle(panel)
        if (cs.display === 'none' || cs.visibility === 'hidden') return false
        if (panel.getAttribute('aria-hidden') === 'true') return false
        const r = panel.getBoundingClientRect()
        return r.width > 200 && r.height > 150
      },
      token,
      { timeout: timeoutMs, polling: 200 },
    )
    return true
  } catch {
    return false
  }
}

async function openByHover(page: Page, triggerText: string): Promise<string | null> {
  const trig = await findAndTagTrigger(page, triggerText)
  if (!trig) {
    console.warn(`  trigger "${triggerText}" not found`)
    return null
  }
  await page.mouse.move(trig.x, trig.y)
  await page.waitForTimeout(50)
  await page.mouse.move(trig.x + 1, trig.y)
  await page.waitForTimeout(750)
  if (await waitForPanelVisible(page, trig.token, 2000)) return trig.token
  // click fallback
  await page.mouse.move(0, 0)
  await page.waitForTimeout(200)
  await page.mouse.click(trig.x, trig.y)
  await page.waitForTimeout(400)
  if (await waitForPanelVisible(page, trig.token, 2000)) return trig.token
  return null
}

async function closeAllDropdowns(page: Page): Promise<void> {
  await page.keyboard.press('Escape').catch(() => {})
  await page.mouse.move(10, 10)
  await page.waitForTimeout(300)
}

// ────────────────────────────────────────────────────────────────────────
// Probe pass — capture panel shape + pseudo-element styles
// ────────────────────────────────────────────────────────────────────────

async function probePanel(page: Page, token: string): Promise<unknown> {
  return page.evaluate((t: string) => {
    const panel = document.querySelector(`[data-mygratr-panel="${t}"]`)
    if (!panel) return null

    const allAnchors = Array.from(panel.querySelectorAll('a')) as HTMLAnchorElement[]
    const anchors = allAnchors.slice(0, 5)

    const dumpStyle = (el: Element, pseudo: string) => {
      const cs = getComputedStyle(el, pseudo)
      return {
        content: cs.content,
        backgroundImage: cs.backgroundImage,
        maskImage: cs.maskImage,
      }
    }

    const dumpSibling = (s: Element) => ({
      tag: s.tagName,
      className: typeof s.className === 'string' ? (s.className as string).slice(0, 200) : '',
      text: (s.textContent ?? '').trim().slice(0, 60),
      backgroundImage: getComputedStyle(s).backgroundImage,
      hasImgChild: !!s.querySelector('img'),
      hasSvgChild: !!s.querySelector('svg'),
    })

    const anchorDetails = anchors.map((a) => {
      const parent = a.parentElement
      const grandparent = parent?.parentElement ?? null
      const siblings = parent ? Array.from(parent.children).filter((c) => c !== a).map(dumpSibling) : []
      return {
        anchorOuterHtml: a.outerHTML,
        anchorHref: a.href,
        anchorText: (a.textContent ?? '').trim().slice(0, 100),
        anchorRect: (() => {
          const r = a.getBoundingClientRect()
          return { width: Math.round(r.width), height: Math.round(r.height), x: Math.round(r.x), y: Math.round(r.y) }
        })(),
        anchorBackgroundImage: getComputedStyle(a).backgroundImage,
        parentOuterHtml: parent?.outerHTML ?? null,
        grandparentOuterHtml: grandparent?.outerHTML ?? null,
        pseudoBefore: dumpStyle(a, '::before'),
        pseudoAfter: dumpStyle(a, '::after'),
        siblings,
      }
    })

    // Panel-scoped icon-class sweep
    const iconCandidates = Array.from(
      panel.querySelectorAll('[class*="icon" i], [class*="glyph" i], [class*="ic-" i]'),
    ) as Element[]
    const iconShapes = iconCandidates.map((el) => ({
      tag: el.tagName,
      className: typeof el.className === 'string' ? (el.className as string).slice(0, 200) : '',
      backgroundImage: getComputedStyle(el).backgroundImage,
      hasSvgChild: !!el.querySelector('svg'),
      hasImgChild: !!el.querySelector('img'),
      text: (el.textContent ?? '').trim().slice(0, 60),
      pseudoBefore: dumpStyle(el, '::before'),
      pseudoAfter: dumpStyle(el, '::after'),
    }))

    return {
      panelToken: t,
      anchorCount: allAnchors.length,
      anchorSamples: anchorDetails,
      iconClassSweep: { count: iconShapes.length, items: iconShapes },
    }
  }, token)
}

async function probeResourcesCards(page: Page): Promise<unknown> {
  return page.evaluate(() => {
    const panel = document.querySelector(`[data-mygratr-panel="resources"]`)
    if (!panel) return null

    const cardCandidates = Array.from(
      panel.querySelectorAll('[class*="card" i], [class*="item" i], [class*="post" i], [class*="story" i]'),
    ) as Element[]
    const cards = cardCandidates.map((el) => {
      const anchor = el.querySelector('a') as HTMLAnchorElement | null
      const img = el.querySelector('img') as HTMLImageElement | null
      return {
        tag: el.tagName,
        className: typeof el.className === 'string' ? (el.className as string).slice(0, 200) : '',
        hasAnchorChild: anchor !== null,
        childAnchorHref: anchor?.href ?? null,
        childImgSrc: img?.src ?? null,
        text: (el.textContent ?? '').trim().slice(0, 200),
        backgroundImage: getComputedStyle(el).backgroundImage,
      }
    })

    const onclickEls = Array.from(panel.querySelectorAll('[onclick]')).map((el) => ({
      tag: el.tagName,
      className: typeof el.className === 'string' ? (el.className as string).slice(0, 200) : '',
      onclick: el.getAttribute('onclick')?.slice(0, 200) ?? '',
      text: (el.textContent ?? '').trim().slice(0, 100),
    }))

    return {
      cardShapeSweep: { count: cards.length, items: cards },
      onclickSweep: { count: onclickEls.length, items: onclickEls },
    }
  })
}

// ────────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('STATIC-2 Step 1: panel-shape probe\n')
  await fs.mkdir(OUT_ROOT, { recursive: true })

  const { browser, page } = await launchBrowser()
  try {
    await gotoCe(page, '/')

    const probeResults: Record<string, unknown> = {}

    for (const [label, token] of [
      ['Services', 'services'],
      ['How It Works', 'how-it-works'],
      ['Resources', 'resources'],
    ] as Array<[string, string]>) {
      console.log(`opening ${label}...`)
      await closeAllDropdowns(page)
      const openedToken = await openByHover(page, label)
      if (!openedToken) {
        console.warn(`  skipped: failed to open ${label}`)
        probeResults[token] = { error: 'failed-to-open' }
        continue
      }
      const result = await probePanel(page, openedToken)
      const anchorCount = (result as { anchorCount?: number } | null)?.anchorCount ?? 0
      const iconShapesCount =
        ((result as { iconClassSweep?: { count: number } } | null)?.iconClassSweep?.count) ?? 0
      console.log(`  captured ${anchorCount} anchors, ${iconShapesCount} icon-class candidates`)
      probeResults[token] = result

      if (token === 'resources') {
        const cards = await probeResourcesCards(page)
        const cardCount = ((cards as { cardShapeSweep?: { count: number } } | null)?.cardShapeSweep?.count) ?? 0
        const onclickCount = ((cards as { onclickSweep?: { count: number } } | null)?.onclickSweep?.count) ?? 0
        console.log(`  resources cards: ${cardCount} card-shaped elements, ${onclickCount} onclick handlers`)
        probeResults['resources-cards'] = cards
      }
    }

    const probePath = path.join(OUT_ROOT, 'panel-shape-probe.json')
    await fs.writeFile(probePath, JSON.stringify(probeResults, null, 2) + '\n', 'utf8')
    console.log(`\nwrote ${path.relative(process.cwd(), probePath)}`)

    // Brief-vs-reality findings
    const deltas = {
      'STATIC-2-DELTA-A': {
        finding: 'Footer primary CTA label',
        brief_claim:
          "Footer §Top CTA block 'Start building your team' (per STATIC-2 brief Step 1 §5 + STATIC-3 brief Step 5 §3)",
        audit_finding: "Live footer primary CTA labeled 'Book A Call' → /book-a-call",
        implication:
          'Step 4 reseed should populate the captured label + url. If the brief intended "Start building your team", the live site has drifted since screenshots were captured. Jake decides.',
        data_source: 'audit-output/static-2/footer.json topCtaBlock.primaryCta',
      },
      'STATIC-2-DELTA-B': {
        finding: 'Service mega-menu icons not anchor-scoped',
        brief_claim:
          'Brief §1 image-source principle assumes service icons captured via image-download from live site can be patched into service.thumbnail',
        audit_finding:
          '5-strategy icon extraction (img-src, svg-use, inline-svg, background-image on element + children, material-font) returns iconSource: null for all 13 service-route items. Icons render on live site but live outside the anchor scope. See panel-shape-probe.json for actual DOM structure.',
        implication:
          'DELTA-1 backfill blocked until extraction strategy adapted to live DOM structure. Strategy 6 to be designed from probe data.',
        data_source: 'audit-output/static-2/panel-shape-probe.json',
      },
    }
    const deltasPath = path.join(OUT_ROOT, 'static-2-brief-deltas.json')
    await fs.writeFile(deltasPath, JSON.stringify(deltas, null, 2) + '\n', 'utf8')
    console.log(`wrote ${path.relative(process.cwd(), deltasPath)}`)
  } finally {
    await browser.close()
  }
}

main().catch((err) => {
  console.error('\nprobe FAILED:', err)
  process.exit(1)
})

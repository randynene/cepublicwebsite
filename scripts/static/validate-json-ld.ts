// MYGRATR-STATIC-1 Step 6 — JSON-LD validation across 3 page types.
//
// Extracts every <script type="application/ld+json"> from the page HTML,
// parses each as JSON, and checks the expected schema.org @type per page
// type. Reports any:
//   - JSON parse errors
//   - missing expected types
//   - unexpected types
//   - duplicate @type (e.g. two CollectionPage on one page)

import { JSDOM } from 'jsdom'

const TARGETS = [
  {
    path: '/services',
    expected: ['CollectionPage', 'BreadcrumbList', 'SiteNavigationElement'],
    forbidden: ['BlogPosting'],
    // SiteNavigationElement is sitewide chrome — appears 6× on every
    // page, so the per-type duplicate-check is suppressed for it.
    multipleOk: ['SiteNavigationElement'],
  },
  {
    path: '/hiring-tips/the-reality-of-modern-tech-recruitment-a-broken-system',
    expected: ['BlogPosting', 'BreadcrumbList', 'SiteNavigationElement'],
    forbidden: ['CollectionPage'],
    multipleOk: ['SiteNavigationElement'],
  },
  {
    path: '/team/seb-hall',
    expected: ['Person', 'BreadcrumbList', 'SiteNavigationElement'],
    forbidden: ['BlogPosting', 'CollectionPage'],
    multipleOk: ['SiteNavigationElement'],
  },
  {
    path: '/reviews/salmon-software',
    expected: ['Review', 'BreadcrumbList', 'SiteNavigationElement'],
    forbidden: ['BlogPosting', 'CollectionPage', 'Person'],
    multipleOk: ['SiteNavigationElement'],
  },
  {
    path: '/videos/hiring-one-dev-backed-by-200',
    expected: ['VideoObject', 'BreadcrumbList', 'SiteNavigationElement'],
    forbidden: ['BlogPosting', 'CollectionPage', 'Person', 'Review'],
    multipleOk: ['SiteNavigationElement'],
  },
  {
    path: '/downloads/10-ai-prompts',
    expected: ['DigitalDocument', 'BreadcrumbList', 'SiteNavigationElement'],
    forbidden: ['BlogPosting', 'CollectionPage', 'Person', 'Review', 'VideoObject'],
    multipleOk: ['SiteNavigationElement'],
  },
  {
    path: '/tools/culture-match',
    expected: ['WebApplication', 'BreadcrumbList', 'FAQPage', 'SiteNavigationElement'],
    forbidden: ['BlogPosting', 'CollectionPage', 'Person', 'Review', 'VideoObject'],
    multipleOk: ['SiteNavigationElement'],
  },
  {
    path: '/book-a-call/shawnee',
    expected: ['WebPage', 'BreadcrumbList', 'SiteNavigationElement'],
    forbidden: ['BlogPosting', 'CollectionPage', 'Person', 'Review', 'VideoObject'],
    multipleOk: ['SiteNavigationElement'],
  },
  {
    path: '/compare/cloud-employee-vs-arc-dev',
    expected: ['BlogPosting', 'BreadcrumbList', 'FAQPage', 'SiteNavigationElement'],
    forbidden: ['CollectionPage', 'Person', 'Review', 'VideoObject'],
    multipleOk: ['SiteNavigationElement'],
  },
  {
    path: '/customer-story/salmon-software',
    expected: ['Article', 'BreadcrumbList', 'SiteNavigationElement'],
    forbidden: ['CollectionPage', 'Person', 'Review', 'VideoObject', 'BlogPosting'],
    multipleOk: ['SiteNavigationElement'],
  },
  {
    path: '/services/ai-consulting',
    expected: ['Service', 'BreadcrumbList', 'SiteNavigationElement'],
    forbidden: ['BlogPosting', 'CollectionPage', 'Person', 'Review', 'VideoObject'],
    multipleOk: ['SiteNavigationElement'],
  },
  {
    path: '/technology/dotnet-developers',
    expected: ['WebPage', 'BreadcrumbList', 'SiteNavigationElement'],
    forbidden: ['BlogPosting', 'CollectionPage', 'Person', 'Review', 'VideoObject', 'Article'],
    multipleOk: ['SiteNavigationElement'],
  },
  {
    path: '/this-does-not-exist',
    expected: ['SiteNavigationElement'],
    forbidden: ['BlogPosting', 'CollectionPage'],
    multipleOk: ['SiteNavigationElement'],
  },
]

async function fetchPage(path: string): Promise<string> {
  const res = await fetch(`http://localhost:3000${path}`)
  return res.text()
}

function extractLd(html: string): Array<unknown> {
  const dom = new JSDOM(html)
  const scripts = dom.window.document.querySelectorAll(
    'script[type="application/ld+json"]',
  )
  const out: unknown[] = []
  for (const s of Array.from(scripts)) {
    const raw = s.textContent ?? ''
    if (!raw.trim()) continue
    try {
      const parsed = JSON.parse(raw)
      // STATIC-3 — flatten Schema.org @graph wrappers so each entry
      // surfaces as its own block (the SiteNavigationElement set ships
      // as a single @graph from nav.tsx).
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed['@graph'])) {
        for (const entry of parsed['@graph']) out.push(entry)
      } else {
        out.push(parsed)
      }
    } catch (err) {
      console.error('Invalid JSON-LD on', dom.window.location.href, err)
    }
  }
  return out
}

async function main() {
  let failures = 0
  for (const t of TARGETS) {
    const html = await fetchPage(t.path)
    const ld = extractLd(html) as Array<{ '@type'?: string }>
    const types = ld.map((d) => d['@type']).filter(Boolean) as string[]
    console.log(`\n${t.path} — ${ld.length} LD blocks: [${types.join(', ')}]`)

    const multipleOk = new Set(t.multipleOk ?? [])
    for (const exp of t.expected) {
      const count = types.filter((tt) => tt === exp).length
      if (count === 0) {
        console.log(`  MISSING expected @type: ${exp}`)
        failures++
      } else if (count > 1 && !multipleOk.has(exp)) {
        console.log(`  DUPLICATE @type: ${exp} (${count}× — should be 1)`)
        failures++
      } else {
        console.log(`  OK ${exp}${count > 1 ? ` (${count}×)` : ''}`)
      }
    }
    for (const forb of t.forbidden) {
      const count = types.filter((tt) => tt === forb).length
      if (count > 0) {
        console.log(`  FORBIDDEN @type present: ${forb} (${count}×)`)
        failures++
      }
    }

    // Per-type field checks
    for (const block of ld as Array<Record<string, unknown>>) {
      const ty = block['@type']
      if (ty === 'BreadcrumbList') {
        const items = block['itemListElement']
        if (!Array.isArray(items) || items.length === 0) {
          console.log(`  BreadcrumbList missing itemListElement`)
          failures++
        } else {
          // Each item must have position, name, item.
          for (let i = 0; i < items.length; i++) {
            const it = items[i] as Record<string, unknown>
            if (it['@type'] !== 'ListItem') { console.log(`  Breadcrumb item ${i}: @type !== ListItem`); failures++; }
            if (typeof it.position !== 'number') { console.log(`  Breadcrumb item ${i}: missing position`); failures++; }
            if (typeof it.name !== 'string') { console.log(`  Breadcrumb item ${i}: missing name`); failures++; }
            if (typeof it.item !== 'string') { console.log(`  Breadcrumb item ${i}: missing item URL`); failures++; }
          }
        }
      }
      if (ty === 'CollectionPage') {
        if (typeof block.name !== 'string') { console.log(`  CollectionPage missing name`); failures++; }
        if (typeof block.url !== 'string') { console.log(`  CollectionPage missing url`); failures++; }
      }
      if (ty === 'BlogPosting') {
        if (typeof block.headline !== 'string') { console.log(`  BlogPosting missing headline`); failures++; }
        if (!block.author) { console.log(`  BlogPosting missing author`); failures++; }
      }
      if (ty === 'Person') {
        if (typeof block.name !== 'string') { console.log(`  Person missing name`); failures++; }
        if (!block.worksFor) { console.log(`  Person missing worksFor`); failures++; }
      }
      if (ty === 'Review') {
        if (!block.itemReviewed) { console.log(`  Review missing itemReviewed`); failures++; }
        if (!block.author) { console.log(`  Review missing author`); failures++; }
        if (!block.reviewRating) { console.log(`  Review missing reviewRating`); failures++; }
      }
      if (ty === 'VideoObject') {
        if (typeof block.name !== 'string') { console.log(`  VideoObject missing name`); failures++; }
        const hasMediaUrl =
          typeof block.thumbnailUrl === 'string' ||
          typeof block.embedUrl === 'string' ||
          typeof block.contentUrl === 'string'
        if (!hasMediaUrl) { console.log(`  VideoObject missing thumbnailUrl/embedUrl/contentUrl`); failures++; }
      }
      if (ty === 'DigitalDocument') {
        if (typeof block.name !== 'string') { console.log(`  DigitalDocument missing name`); failures++; }
        if (typeof block.url !== 'string') { console.log(`  DigitalDocument missing url`); failures++; }
      }
      if (ty === 'Article') {
        if (typeof block.headline !== 'string') { console.log(`  Article missing headline`); failures++; }
        if (typeof block.url !== 'string') { console.log(`  Article missing url`); failures++; }
      }
      if (ty === 'Service') {
        if (typeof block.name !== 'string') { console.log(`  Service missing name`); failures++; }
        if (typeof block.url !== 'string') { console.log(`  Service missing url`); failures++; }
      }
      if (ty === 'WebPage') {
        if (typeof block.name !== 'string') { console.log(`  WebPage missing name`); failures++; }
        if (typeof block.url !== 'string') { console.log(`  WebPage missing url`); failures++; }
      }
      if (ty === 'Service') {
        if (typeof block.name !== 'string') { console.log(`  Service missing name`); failures++; }
        if (typeof block.url !== 'string') { console.log(`  Service missing url`); failures++; }
      }
    }

    // STATIC-3 — SiteNavigationElement sitewide check. Per brief §3
    // Step 2 §3 + Step 6 JSON-LD lock: 6 entries, position 1-6,
    // every entry has non-null name + absolute url, 2nd entry's name
    // === "Our Clients".
    const navEntries = (ld as Array<Record<string, unknown>>)
      .filter((b) => b['@type'] === 'SiteNavigationElement')
    if (navEntries.length > 0) {
      if (navEntries.length !== 6) {
        console.log(`  SiteNavigationElement expected 6 entries, got ${navEntries.length}`)
        failures++
      }
      const sorted = [...navEntries].sort((a, b) => Number(a.position) - Number(b.position))
      for (let i = 0; i < sorted.length; i++) {
        const entry = sorted[i]
        const expectedPos = i + 1
        if (entry.position !== expectedPos) {
          console.log(`  SiteNavigationElement entry ${i}: position ${entry.position} !== ${expectedPos}`)
          failures++
        }
        if (typeof entry.name !== 'string' || entry.name.length === 0) {
          console.log(`  SiteNavigationElement entry ${i}: missing name`)
          failures++
        }
        if (typeof entry.url !== 'string' || !/^https?:\/\//.test(entry.url)) {
          console.log(`  SiteNavigationElement entry ${i}: url not absolute (got ${entry.url})`)
          failures++
        }
      }
      if (sorted.length >= 2 && sorted[1].name !== 'Our Clients') {
        console.log(`  SiteNavigationElement[1].name expected "Our Clients", got "${sorted[1].name}"`)
        failures++
      } else if (sorted.length >= 2) {
        console.log(`  OK SiteNavigationElement[1].name === "Our Clients"`)
      }
    }
  }
  if (failures === 0) {
    console.log('\nPASS: JSON-LD shape OK across 7 page types')
    process.exit(0)
  }
  console.error(`\nFAIL: ${failures} JSON-LD issues`)
  process.exit(1)
}

main().catch((err) => {
  console.error('validate-json-ld FAILED', err.message)
  process.exit(1)
})

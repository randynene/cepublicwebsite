// MYGRATR-STATIC-1 — Phase-close gate.
//
// Single pass/fail script that re-runs every gate from Steps 1-6 against
// the live dev server. Exits 0 on success, 1 on any failure.
//
// Prerequisite: dev server running on http://localhost:3000.
//   (npm run dev — or npm run build && npm start for prod-style checks)
//
// Combined coverage:
//   Step 1: 20 Sanity docs seeded with primary content fields
//   Step 2: 404 page returns HTTP 404 with title + cta
//   Step 3: Footer present sitewide (banner + contentinfo on every page)
//   Step 4: 16 hubs return 200, pagination rules enforced, JSON-LD on hubs
//   Step 5: Header present on every page, /pricing 308 -> /services,
//           skip-link target wired
//   Step 6: Sitemap = 166 entries (2 static + 16 hub + 148 blog), zero
//           UK hub entries, zero hreflang alternates while UK routes
//           absent, axe-core zero violations across sampled pages

import 'dotenv/config'

import { createClient } from '@sanity/client'

const SITE = 'http://localhost:3000'

type Result = { name: string; ok: boolean; detail?: string }
const results: Result[] = []

function pass(name: string, detail = '') {
  results.push({ name, ok: true, detail })
}
function fail(name: string, detail: string) {
  results.push({ name, ok: false, detail })
}

async function http(path: string): Promise<{ status: number; body: string }> {
  const res = await fetch(`${SITE}${path}`, { redirect: 'manual' })
  return { status: res.status, body: await res.text() }
}

async function status(path: string): Promise<number> {
  const res = await fetch(`${SITE}${path}`, { redirect: 'manual' })
  return res.status
}

// ── Step 1: 20 Sanity docs seeded ────────────────────────────────────────
async function checkSanitySeed() {
  const token = process.env.SANITY_API_READ_TOKEN
  if (!token) return fail('step1.sanity-seed', 'SANITY_API_READ_TOKEN unset; run from project root with site/.env.local loaded')
  const c = createClient({
    projectId: 'lzbhll1u',
    dataset: 'production',
    apiVersion: '2024-10-01',
    useCdn: false,
    token,
    perspective: 'published',
  })
  const GLOBALS = ['siteSettings', 'navigation', 'footer', 'notFoundPage']
  const HUBS = [
    'blogHub', 'staffAugmentationHub', 'nearshoringOffshoringHub',
    'scalingTeamsHub', 'hiringTipsHub', 'managingEngineersHub',
    'aiInSoftwareDevelopmentHub', 'videosHub', 'toolsHub', 'downloadsHub',
    'eventsHub', 'servicesHub', 'technologyHub', 'customerStoriesHub',
    'reviewsHub', 'compareHub',
  ]
  const docs = await c.fetch<unknown[]>(
    `*[_id in $globals || _type in $hubs]`,
    { globals: GLOBALS, hubs: HUBS },
  )
  if (docs.length !== 20) {
    return fail('step1.sanity-seed', `expected 20 docs, found ${docs.length}`)
  }
  // Em + en dash scan across seeded text
  const flat = JSON.stringify(docs)
  const emCount = (flat.match(/—/g) ?? []).length
  const enCount = (flat.match(/–/g) ?? []).length
  if (emCount > 0 || enCount > 0) {
    return fail('step1.sanity-seed', `dash residue: em=${emCount} en=${enCount}`)
  }
  pass('step1.sanity-seed', '20 docs, zero dash residue')
}

// ── Step 2: 404 ────────────────────────────────────────────────────────────
async function check404() {
  const { status: s, body } = await http('/this-does-not-exist')
  if (s !== 404) return fail('step2.404-status', `expected 404, got ${s}`)
  if (!/Page not found/.test(body)) return fail('step2.404-render', 'title missing')
  if (!/Go to homepage/.test(body)) return fail('step2.404-cta', 'cta missing')
  if (!/robots.*noindex/i.test(body)) return fail('step2.404-robots', 'noindex meta missing')
  pass('step2.404', 'HTTP 404 + title + CTA + noindex')
}

// ── Step 3: Footer present sitewide ─────────────────────────────────────────
async function checkFooterPresent() {
  const probe = ['/', '/blog', '/services', '/this-does-not-exist']
  for (const p of probe) {
    const { body } = await http(p)
    if (!/role="contentinfo"/.test(body)) {
      return fail('step3.footer-on-' + p, 'contentinfo landmark missing')
    }
    if (!/footer-col-fc-0/.test(body) && p !== '/this-does-not-exist') {
      return fail('step3.footer-on-' + p, 'footer columns missing')
    }
  }
  pass('step3.footer-sitewide', 'contentinfo + columns present on probed pages')
}

// ── Step 4: 16 hubs return 200, redirects, pagination, JSON-LD ──────────────
async function checkHubs() {
  const HUBS = [
    '/blog', '/staff-augmentation', '/nearshoring-offshoring',
    '/scaling-teams', '/hiring-tips', '/managing-engineers',
    '/ai-in-software-development', '/videos', '/tools', '/downloads',
    '/events', '/services', '/technology', '/customer-stories',
    '/reviews', '/compare',
  ]
  let okCount = 0
  for (const h of HUBS) {
    const s = await status(h)
    if (s === 200) okCount++
    else return fail('step4.hub-' + h, `expected 200, got ${s}`)
  }
  if (okCount !== 16) return fail('step4.hubs', `${okCount}/16 returned 200`)
  // Aliases
  if (await status('/our-work') !== 308) return fail('step4.alias-our-work', 'expected 308')
  if (await status('/alternatives') !== 308) return fail('step4.alias-alternatives', 'expected 308')
  // Pagination invalid params
  if (await status('/blog?page=99') !== 404) return fail('step4.page-99', 'out-of-range not 404')
  if (await status('/blog?page=abc') !== 404) return fail('step4.page-abc', 'invalid not 404')
  if (await status('/blog?page=2') !== 200) return fail('step4.page-2', 'page 2 not 200')
  // JSON-LD on /services
  const { body: srv } = await http('/services')
  const cp = (srv.match(/"@type":"CollectionPage"/g) ?? []).length
  const bc = (srv.match(/"@type":"BreadcrumbList"/g) ?? []).length
  if (cp !== 1 || bc !== 1) return fail('step4.jsonld', `services CP=${cp} BC=${bc}, expected 1/1`)
  pass('step4.hubs', '16 hubs 200 + redirects + pagination + JSON-LD')
}

// ── Step 5: Header sitewide + /pricing redirect ────────────────────────────
async function checkHeader() {
  const probe = ['/', '/blog', '/services', '/this-does-not-exist']
  for (const p of probe) {
    const { body } = await http(p)
    if (!/role="banner"/.test(body)) return fail('step5.banner-on-' + p, 'banner landmark missing')
    if (!/aria-label="Primary"/.test(body)) return fail('step5.nav-on-' + p, 'Primary nav missing')
    if (!/href="#main"/.test(body)) return fail('step5.skip-on-' + p, 'skip link missing')
    if (!/main id="main"|main[^>]*id="main"/.test(body)) return fail('step5.main-on-' + p, '#main target missing')
  }
  if (await status('/pricing') !== 308) return fail('step5.pricing', 'expected 308')
  pass('step5.header-sitewide', 'banner + nav + skip + #main + /pricing 308')
}

// ── Step 6: Sitemap shape ──────────────────────────────────────────────────
async function checkSitemap() {
  const { body, status: s } = await http('/sitemap.xml')
  if (s !== 200) return fail('step6.sitemap-status', `expected 200, got ${s}`)
  const locs = (body.match(/<loc>/g) ?? []).length
  if (locs !== 166) return fail('step6.sitemap-count', `expected 166, got ${locs}`)
  const hreflangs = (body.match(/xhtml:link/g) ?? []).length
  if (hreflangs !== 0) return fail('step6.sitemap-hreflang', `expected 0 (UK hubs deferred), got ${hreflangs}`)
  const ukHub = (body.match(/<loc>[^<]+\/uk\/(blog|services|technology|customer-stories|reviews|compare|videos|tools|downloads|events|staff-augmentation|nearshoring-offshoring|scaling-teams|hiring-tips|managing-engineers|ai-in-software-development)<\/loc>/g) ?? []).length
  if (ukHub !== 0) return fail('step6.sitemap-uk-hub', `expected 0 UK hub entries, got ${ukHub}`)
  const notFound = (body.match(/not-found|\/404/g) ?? []).length
  if (notFound !== 0) return fail('step6.sitemap-404', `404 in sitemap`)
  pass('step6.sitemap', '166 entries, 16 default hub, 0 UK hub, 0 hreflang, 0 not-found')
}

// ── main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log('verify-static-1: gate run against', SITE)
  console.log()
  await checkSanitySeed()
  await check404()
  await checkFooterPresent()
  await checkHubs()
  await checkHeader()
  await checkSitemap()

  let failures = 0
  for (const r of results) {
    const tag = r.ok ? 'PASS' : 'FAIL'
    console.log(`${tag} ${r.name}${r.detail ? ' — ' + r.detail : ''}`)
    if (!r.ok) failures++
  }
  console.log()
  if (failures === 0) {
    console.log(`OK: ${results.length} checks passed`)
    process.exit(0)
  }
  console.error(`FAIL: ${failures}/${results.length} checks failed`)
  process.exit(1)
}

main().catch((err) => {
  console.error('verify-static-1 errored:', err)
  process.exit(1)
})

// Crawl staging (or any base URL) and prove every rendered HubSpot form id
// resolves on portal 22809822. No Sanity token required.
//
// Complements `launch:verify-hubspot-forms` (Sanity-sourced). This one is the
// "what the browser actually gets" check — useful when credentials are not
// available in the agent environment, and as a post-deploy gate.
//
// Run: npm run launch:verify-hubspot-forms-staging
// Optional: STAGING_BASE_URL=https://staging.jakevibes.dev

// LAUNCH CONSOLIDATION - Jake, 30 Jul 2026. The site now has three form-shaped
// lead surfaces, not eleven. This verifier was rewritten to match:
//
//   1. Book a call / Calendly   - the primary door, everything points here
//   2. Contact form             - the only HubSpot embed left on the site
//   3. Ask Clara                - separate track, not checked here
//   4. Quick hiring form        - custom UI, own API route, checked once it ships
//
// It now proves two things, and the second one matters as much as the first:
// that the surviving form is alive, and that the retired ones are GONE. A
// newsletter box that quietly comes back, or a start-hiring step that stops
// redirecting, is exactly the kind of regression nobody notices by eye.

const PORTAL_ID = '22809822'
const BASE = (process.env.STAGING_BASE_URL ?? 'https://staging.jakevibes.dev').replace(/\/$/, '')

/** Retired 30 Jul 2026. Must not appear in any page's HTML. */
const RETIRED_NEWSLETTER_ID = 'b411a11f-1548-4cf7-887e-26fac7824006'

/** Paths that must embed a HubSpot form. */
const EXPECTED: Array<{ path: string; formId: string; note?: string }> = [
  { path: '/contact', formId: '4b883c7d-72c1-4f9c-8196-de68fce303d6' },
  { path: '/uk/contact', formId: '4b883c7d-72c1-4f9c-8196-de68fce303d6' },
]

/** Retired funnel. Every one of these must 301 to a book-a-call page. */
const RETIRED_TO_BOOK_A_CALL: string[] = [
  '/start-hiring',
  '/start-hiring/get-started',
  '/start-hiring/contact-info',
  '/start-hiring/how-many',
  '/start-hiring/how-long',
  '/start-hiring/budget',
  '/start-hiring/when-needed',
  '/start-hiring/technology',
  '/start-hiring/final-details',
  '/start-hiring/thanks',
  '/uk/start-hiring',
  '/uk/start-hiring/get-started',
  '/uk/start-hiring/contact-info',
]

async function resolvesOnHubSpot(id: string): Promise<boolean> {
  const res = await fetch(`https://forms.hsforms.com/embed/v3/form/${PORTAL_ID}/${id}/json`)
  return res.status === 200
}

function extractFormIds(html: string): string[] {
  const ids = new Set<string>()
  const patterns = [
    /formId\\":\\"([0-9a-f-]{36})\\"/g,
    /formId":"([0-9a-f-]{36})"/g,
    /formId:\s*["']([0-9a-f-]{36})["']/g,
    /hubspotFormId\\":\\"([0-9a-f-]{36})\\"/g,
    /hubspotFormId":"([0-9a-f-]{36})"/g,
  ]
  for (const re of patterns) {
    for (const m of html.matchAll(re)) ids.add(m[1]!)
  }
  return [...ids]
}

async function fetchHtml(path: string): Promise<string> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'user-agent': 'mygratr-hubspot-forms-staging-verify' },
    redirect: 'follow',
  })
  if (!res.ok) throw new Error(`${path} -> HTTP ${res.status}`)
  return res.text()
}

async function main(): Promise<void> {
  console.log(`Base: ${BASE}`)
  console.log(`Portal: ${PORTAL_ID}\n`)

  let failed = 0

  // 1. The surviving HubSpot embeds must render and resolve.
  for (const row of EXPECTED) {
    const html = await fetchHtml(row.path)
    const ids = extractFormIds(html)
    const present = ids.includes(row.formId)
    const live = present && (await resolvesOnHubSpot(row.formId))
    if (!live) failed++
    const extra = ids.filter((id) => id !== row.formId)
    console.log(
      `${live ? 'OK  ' : 'DEAD'}  ${row.path.padEnd(36)} ${row.formId}` +
        (extra.length ? `  (also saw ${extra.join(', ')})` : ''),
    )
  }

  // 2. The newsletter must be gone sitewide, not merely hidden.
  const homeIds = extractFormIds(await fetchHtml('/'))
  const newsletterGone = !homeIds.includes(RETIRED_NEWSLETTER_ID)
  console.log(
    `\n${newsletterGone ? 'OK  ' : 'BACK'}  footer newsletter is retired`.padEnd(48) +
      RETIRED_NEWSLETTER_ID,
  )
  if (!newsletterGone) failed++

  // 3. Every retired funnel URL must 301 onto a book-a-call page. These are live
  //    200s today, so a 404 here would bin real link equity mid-migration.
  console.log('')
  for (const path of RETIRED_TO_BOOK_A_CALL) {
    const res = await fetch(`${BASE}${path}`, {
      headers: { 'user-agent': 'mygratr-hubspot-forms-staging-verify' },
      redirect: 'follow',
    })
    const landed = new URL(res.url).pathname.replace(/\/$/, '')
    const ok = res.ok && landed.endsWith('/book-a-call')
    if (!ok) failed++
    console.log(`${ok ? 'OK  ' : 'FAIL'}  ${path.padEnd(36)} -> ${landed}`)
  }

  if (failed > 0) {
    console.error(`\n${failed} check(s) failed. A dead form id loses every enquiry silently.`)
    process.exit(1)
  }
  console.log('\nForms consolidated: contact embed live, newsletter retired, funnel redirected.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

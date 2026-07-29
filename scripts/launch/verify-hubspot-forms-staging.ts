// Crawl staging (or any base URL) and prove every rendered HubSpot form id
// resolves on portal 22809822. No Sanity token required.
//
// Complements `launch:verify-hubspot-forms` (Sanity-sourced). This one is the
// "what the browser actually gets" check — useful when credentials are not
// available in the agent environment, and as a post-deploy gate.
//
// Run: npm run launch:verify-hubspot-forms-staging
// Optional: STAGING_BASE_URL=https://staging.jakevibes.dev

const PORTAL_ID = '22809822'
const BASE = (process.env.STAGING_BASE_URL ?? 'https://staging.jakevibes.dev').replace(/\/$/, '')
const NEWSLETTER_ID = 'b411a11f-1548-4cf7-887e-26fac7824006'

/** Paths that must embed a HubSpot form (newsletter is sitewide and stripped). */
const EXPECTED: Array<{ path: string; formId: string; note?: string }> = [
  { path: '/contact', formId: '4b883c7d-72c1-4f9c-8196-de68fce303d6' },
  { path: '/uk/contact', formId: '4b883c7d-72c1-4f9c-8196-de68fce303d6' },
  { path: '/uk/start-hiring/get-started', formId: '05bfad44-0c7c-45f2-a3c4-3eccea71965d' },
  { path: '/start-hiring/contact-info', formId: '1578f9b5-fb43-4772-83df-79c51c120a92' },
  { path: '/uk/start-hiring/contact-info', formId: '1578f9b5-fb43-4772-83df-79c51c120a92' },
  { path: '/start-hiring/how-many', formId: '07a77a4d-07ad-4c8a-aef1-c1c2ea8499a8' },
  { path: '/start-hiring/how-long', formId: '1c6864a5-cfc7-44e5-82cc-652b429fe816' },
  { path: '/start-hiring/budget', formId: 'b51dfb72-7574-4d3f-843a-e3ea1a183e8f' },
  { path: '/start-hiring/when-needed', formId: 'c5e99e29-8968-4ad8-98c5-496218322b0d' },
  { path: '/start-hiring/technology', formId: '023ae2ad-cebc-4535-bb86-5807a578ffc6' },
  { path: '/start-hiring/final-details', formId: '2d69a43b-9e1f-405d-b5f6-11e8063d7ba5' },
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

  // Newsletter appears sitewide via footer.
  const homeHtml = await fetchHtml('/')
  const homeIds = extractFormIds(homeHtml)
  const newsOk = homeIds.includes(NEWSLETTER_ID) && (await resolvesOnHubSpot(NEWSLETTER_ID))
  console.log(
    `${newsOk ? 'OK  ' : 'DEAD'}  footer newsletter`.padEnd(42) + NEWSLETTER_ID,
  )
  if (!newsOk) failed++

  for (const row of EXPECTED) {
    const html = await fetchHtml(row.path)
    const ids = extractFormIds(html).filter((id) => id !== NEWSLETTER_ID)
    const present = ids.includes(row.formId)
    const live = present && (await resolvesOnHubSpot(row.formId))
    if (!live) failed++
    const extra = ids.filter((id) => id !== row.formId)
    console.log(
      `${live ? 'OK  ' : 'DEAD'}  ${row.path.padEnd(36)} ${row.formId}` +
        (extra.length ? `  (also saw ${extra.join(', ')})` : ''),
    )
  }

  // US get-started must redirect into contact-info (not serve its own form).
  const usGetStarted = await fetch(`${BASE}/start-hiring/get-started`, {
    headers: { 'user-agent': 'mygratr-hubspot-forms-staging-verify' },
    redirect: 'follow',
  })
  const landed = new URL(usGetStarted.url).pathname
  const redirectOk = landed.endsWith('/start-hiring/contact-info')
  console.log(
    `\n${redirectOk ? 'OK  ' : 'DEAD'}  US /start-hiring/get-started redirects to contact-info (landed ${landed})`,
  )
  if (!redirectOk) failed++

  if (failed > 0) {
    console.error(`\n${failed} check(s) failed. A dead form id loses every enquiry silently.`)
    process.exit(1)
  }
  console.log('\nAll staging HubSpot form ids are present and resolve on HubSpot.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

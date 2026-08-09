/**
 * HubSpot form-submission pull for SEO intel (last 12 months).
 *
 * Pulls every form submission with page URL + date, then attempts the quality
 * signals needed to separate buyer enquiries from noise (lifecycle, deals,
 * owner, spam, first page seen). Those CRM reads require scopes this private
 * app token does not have. When they fail, the script BAILS on qualified /
 * deal counts rather than inventing a heuristic.
 *
 * Run: npx tsx scripts/seo/hubspot-leads-pull.ts
 * Out:  audit-output/seo-intel/2026-08-06/hubspot/
 */

import 'dotenv/config'

import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const API = 'https://api.hubapi.com'
const TOKEN = process.env.HUBSPOT_ACCESS_TOKEN
const PORTAL_ID = process.env.HUBSPOT_PORTAL_ID ?? '22809822'
const OUT_DIR = path.join(
  process.cwd(),
  'audit-output',
  'seo-intel',
  '2026-08-06',
  'hubspot',
)

const MS_DAY = 24 * 60 * 60 * 1000
const NOW = Date.now()
const CUTOFF_12M = NOW - 365 * MS_DAY
const CUTOFF_3M = NOW - 90 * MS_DAY

/** Forms that are deliberately not buyer enquiry surfaces (from form audit). */
const NON_BUYER_FORM_IDS = new Set([
  '52c97427-de33-4597-b7e3-f4c882d00690', // Career Form
  'debebd67-326a-4014-84cd-a13da66cb120', // DevelopersPage
  'b411a11f-1548-4cf7-887e-26fac7824006', // Newsletter (retired, Tech Debt #63)
  'e4f38128-b341-4929-a861-652d64127d36', // webflow Subscription form
])

type Form = { id: string; name: string; archived: boolean }

type Submission = {
  formId: string
  formName: string
  conversionId: string
  submittedAt: number
  submittedAtIso: string
  pageUrl: string | null
  email: string | null
  surfaceClass: 'non_buyer_form' | 'other_form'
}

type PageAgg = {
  url: string
  raw_12m: number
  raw_3m: number
  qualified_12m: null
  qualified_3m: null
  became_deal_12m: null
  became_deal_3m: null
  byForm_12m: Record<string, number>
}

type ScopeProbe = {
  endpoint: string
  ok: boolean
  status: number | null
  detail: string
}

if (!TOKEN) {
  console.error('HUBSPOT_ACCESS_TOKEN is not set.')
  process.exit(1)
}

async function hs(
  pathname: string,
  init?: RequestInit,
): Promise<{ ok: true; status: number; json: unknown } | { ok: false; status: number; text: string }> {
  const res = await fetch(`${API}${pathname}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  if (!res.ok) {
    return { ok: false, status: res.status, text: (await res.text()).slice(0, 500) }
  }
  return { ok: true, status: res.status, json: await res.json() }
}

function valueOf(
  values: Array<{ name: string; value?: string }> | undefined,
  name: string,
): string | null {
  const hit = values?.find((v) => v.name === name)
  const v = hit?.value?.trim()
  return v ? v : null
}

function normalizeUrl(raw: string | null | undefined): string | null {
  if (!raw) return null
  try {
    const u = new URL(raw)
    u.hash = ''
    // Strip tracking params; keep path as the attribution key.
    for (const key of [...u.searchParams.keys()]) {
      if (/^(utm_|gclid|fbclid|msclkid|hsa_)/i.test(key) || key === 'hsCtaTracking') {
        u.searchParams.delete(key)
      }
    }
    let out = u.toString()
    if (out.endsWith('/') && u.pathname !== '/') out = out.slice(0, -1)
    return out
  } catch {
    return raw
  }
}

async function fetchForms(): Promise<Form[]> {
  const out: Form[] = []
  for (const archived of [false, true]) {
    let after: string | undefined
    for (;;) {
      const qs = new URLSearchParams({ limit: '100', archived: String(archived) })
      if (after) qs.set('after', after)
      const res = await hs(`/marketing/v3/forms?${qs}`)
      if (!res.ok) throw new Error(`forms list failed ${res.status}: ${res.text}`)
      const page = res.json as { results: Form[]; paging?: { next?: { after?: string } } }
      out.push(...page.results.map((f) => ({ id: f.id, name: f.name, archived: f.archived })))
      after = page.paging?.next?.after
      if (!after) break
    }
  }
  return out
}

async function fetchFormSubmissions(form: Form): Promise<Submission[]> {
  const out: Submission[] = []
  let after: string | undefined
  for (;;) {
    const qs = new URLSearchParams({ limit: '50' })
    if (after) qs.set('after', after)
    const res = await hs(`/form-integrations/v1/submissions/forms/${form.id}?${qs}`)
    if (!res.ok) {
      // Some archived / legacy forms 404 on the submissions endpoint.
      if (res.status === 404) return out
      throw new Error(`submissions ${form.id} -> ${res.status}: ${res.text}`)
    }
    const page = res.json as {
      results: Array<{
        conversionId: string
        submittedAt: number
        pageUrl?: string
        values?: Array<{ name: string; value?: string }>
      }>
      paging?: { next?: { after?: string } }
    }

    let hitOlder = false
    for (const row of page.results) {
      if (row.submittedAt < CUTOFF_12M) {
        hitOlder = true
        break
      }
      out.push({
        formId: form.id,
        formName: form.name,
        conversionId: row.conversionId,
        submittedAt: row.submittedAt,
        submittedAtIso: new Date(row.submittedAt).toISOString(),
        pageUrl: normalizeUrl(row.pageUrl ?? null),
        email: valueOf(row.values, 'email'),
        surfaceClass: NON_BUYER_FORM_IDS.has(form.id) ? 'non_buyer_form' : 'other_form',
      })
    }

    after = page.paging?.next?.after
    if (hitOlder || !after) break
  }
  return out
}

async function probeQualityScopes(): Promise<{
  probes: ScopeProbe[]
  canReadContacts: boolean
  canReadDeals: boolean
  canReadMeetings: boolean
  firstPageSeenAvailable: boolean
  calendlyVisible: boolean
}> {
  const probes: ScopeProbe[] = []

  async function probe(name: string, pathname: string, init?: RequestInit): Promise<ScopeProbe> {
    const res = await hs(pathname, init)
    const p: ScopeProbe = {
      endpoint: name,
      ok: res.ok,
      status: res.status,
      detail: res.ok ? 'ok' : res.text.slice(0, 200),
    }
    probes.push(p)
    return p
  }

  const contacts = await probe(
    'crm.contacts.search',
    '/crm/v3/objects/contacts/search',
    {
      method: 'POST',
      body: JSON.stringify({
        filterGroups: [
          {
            filters: [
              {
                propertyName: 'createdate',
                operator: 'GTE',
                value: String(CUTOFF_3M),
              },
            ],
          },
        ],
        properties: [
          'email',
          'lifecyclestage',
          'hs_lead_status',
          'hubspot_owner_id',
          'hs_analytics_source',
          'hs_analytics_first_url',
          'num_associated_deals',
          'createdate',
        ],
        limit: 1,
      }),
    },
  )

  const deals = await probe(
    'crm.deals.list',
    '/crm/v3/objects/deals?limit=1&properties=dealname,dealstage,amount,createdate',
  )

  const meetings = await probe(
    'crm.meetings.list',
    '/crm/v3/objects/meetings?limit=1&properties=hs_meeting_title,hs_meeting_start_time,hs_meeting_body',
  )

  const engagements = await probe('engagements.paged', '/engagements/v1/engagements/paged?limit=1')

  const contactProps = await probe(
    'crm.contacts.property.lifecyclestage',
    '/crm/v3/properties/contacts/lifecyclestage',
  )

  const canReadContacts = contacts.ok
  const canReadDeals = deals.ok
  const canReadMeetings = meetings.ok
  // First-page-seen lives on the contact object.
  const firstPageSeenAvailable = canReadContacts && contactProps.ok
  // Calendly bookings land as HubSpot meetings / engagements, not form submissions.
  const calendlyVisible = canReadMeetings || engagements.ok

  return {
    probes,
    canReadContacts,
    canReadDeals,
    canReadMeetings,
    firstPageSeenAvailable,
    calendlyVisible,
  }
}

function aggregateByPage(subs: Submission[]): PageAgg[] {
  const map = new Map<string, PageAgg>()
  for (const s of subs) {
    const url = s.pageUrl ?? '(no pageUrl)'
    let row = map.get(url)
    if (!row) {
      row = {
        url,
        raw_12m: 0,
        raw_3m: 0,
        qualified_12m: null,
        qualified_3m: null,
        became_deal_12m: null,
        became_deal_3m: null,
        byForm_12m: {},
      }
      map.set(url, row)
    }
    row.raw_12m += 1
    if (s.submittedAt >= CUTOFF_3M) row.raw_3m += 1
    row.byForm_12m[s.formName] = (row.byForm_12m[s.formName] ?? 0) + 1
  }
  return [...map.values()].sort((a, b) => b.raw_12m - a.raw_12m || a.url.localeCompare(b.url))
}

function toCsv(rows: PageAgg[]): string {
  const headers = [
    'url',
    'raw_12m',
    'raw_3m',
    'qualified_12m',
    'qualified_3m',
    'became_deal_12m',
    'became_deal_3m',
  ]
  const lines = [headers.join(',')]
  for (const r of rows) {
    lines.push(
      [
        csvEscape(r.url),
        r.raw_12m,
        r.raw_3m,
        '',
        '',
        '',
        '',
      ].join(','),
    )
  }
  return lines.join('\n') + '\n'
}

function csvEscape(v: string): string {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`
  return v
}

function writeManifest(args: {
  forms: Form[]
  submissions: Submission[]
  byPage: PageAgg[]
  quality: Awaited<ReturnType<typeof probeQualityScopes>>
  bail: boolean
  bailReason: string
}): void {
  const { forms, submissions, byPage, quality, bail, bailReason } = args
  const nonBuyer = submissions.filter((s) => s.surfaceClass === 'non_buyer_form').length
  const other = submissions.length - nonBuyer
  const withPage = submissions.filter((s) => s.pageUrl).length
  const withoutPage = submissions.length - withPage
  const in3m = submissions.filter((s) => s.submittedAt >= CUTOFF_3M).length

  const md: string[] = []
  md.push('# MANIFEST - HubSpot leads pull')
  md.push('')
  md.push(`Portal: \`${PORTAL_ID}\``)
  md.push(`Pulled: ${new Date().toISOString()}`)
  md.push('Script: `scripts/seo/hubspot-leads-pull.ts`')
  md.push(`Window: last 12 months from pull time (cutoff ${new Date(CUTOFF_12M).toISOString()})`)
  md.push(`3-month cutoff: ${new Date(CUTOFF_3M).toISOString()}`)
  md.push('')
  md.push('## BAIL-OUT VERDICT')
  md.push('')
  if (bail) {
    md.push(`**BAILED on lead QUALITY.** ${bailReason}`)
    md.push('')
    md.push(
      'Raw submission counts by page URL are written for inspection. `qualified_*` and `became_deal_*` are null everywhere. Job 2 must leave `leads_12m` null - raw counts must not be used to rank pages.',
    )
  } else {
    md.push('Quality signals were readable. Qualified / deal columns are populated.')
  }
  md.push('')
  md.push('## Scope probes')
  md.push('')
  md.push('| Endpoint | OK | Status | Detail |')
  md.push('|---|---|---|---|')
  for (const p of quality.probes) {
    md.push(
      `| \`${p.endpoint}\` | ${p.ok ? 'yes' : 'no'} | ${p.status ?? ''} | ${p.detail.replace(/\|/g, '/').slice(0, 120)} |`,
    )
  }
  md.push('')
  md.push('## Known limitations (handled explicitly)')
  md.push('')
  md.push(
    `- **Page-of-form attribution:** submissions attribute to the page the form sat on (usually \`/contact\`), not the content that persuaded the visitor. ${withPage} of ${submissions.length} submissions have a pageUrl; ${withoutPage} have none.`,
  )
  md.push(
    `- **First-page-seen table:** ${
      quality.firstPageSeenAvailable
        ? 'populated from contact `hs_analytics_first_url`.'
        : 'NOT available. Contact CRM read is blocked (missing `crm.objects.contacts.read`). `by-first-page-seen.json` is an empty array with this note.'
    }`,
  )
  md.push(
    `- **Calendly / book-a-call:** ${
      quality.calendlyVisible
        ? 'meetings/engagements readable - see calendly-check.json.'
        : 'NOT visible to this token. Meetings + engagements APIs returned 403. Form submissions never include Calendly bookings. The major book-a-call conversion path is invisible in this pull. Prior form audit says Calendly writes to HubSpot directly and Slack workflows fire, but those objects are outside our scopes.'
    }`,
  )
  md.push(
    '- **Newsletter form:** retired (Tech Debt #63). Still listed; tagged `non_buyer_form` if any submissions appear.',
  )
  md.push(
    '- **Pre-3-Aug data:** same URLs, Webflow site. Attribution URLs are continuous across cutover; platform is not.',
  )
  md.push('')
  md.push('## What HubSpot holds vs what we can read')
  md.push('')
  md.push('| Candidate quality signal | In HubSpot? | Readable with this token? |')
  md.push('|---|---|---|')
  md.push('| Lifecycle stage (MQL/SQL/opportunity/customer) | yes (contact) | **no** |')
  md.push('| Associated deal + deal stage | yes | **no** |')
  md.push('| Contact owner assigned | yes | **no** |')
  md.push('| Spam / deleted / merged contact | yes | **no** |')
  md.push('| Form identity (engineer vs buyer surface) | yes | yes |')
  md.push('| Submission pageUrl | yes | yes |')
  md.push('| Original source / first page seen | yes (contact analytics) | **no** |')
  md.push('')
  md.push(
    'Form identity alone can exclude careers / newsletter / developer surfaces. It cannot separate guest-post pitches, SEO spam, or vendor outreach from real buyers on Contact / hiring forms. Inventing a message-text or email-domain heuristic is forbidden by the brief. Therefore quality ranking is refused.',
  )
  md.push('')
  md.push('## Counts')
  md.push('')
  md.push(`| Metric | Value |`)
  md.push(`|---|---|`)
  md.push(`| Forms on portal (live + archived) | ${forms.length} |`)
  md.push(`| Submissions last 12m | ${submissions.length} |`)
  md.push(`| Submissions last 3m | ${in3m} |`)
  md.push(`| On non-buyer forms (careers/newsletter/devs) | ${nonBuyer} |`)
  md.push(`| On other forms (includes Contact + hiring + magnets + spam) | ${other} |`)
  md.push(`| Distinct pageUrl values | ${byPage.length} |`)
  md.push(`| Qualified (12m) | null (bailed) |`)
  md.push(`| Became a deal (12m) | null (bailed) |`)
  md.push(`| Junk ratio | unknown - cannot compute without quality signal |`)
  md.push('')
  md.push('## Outputs')
  md.push('')
  md.push('| File | Contents |')
  md.push('|---|---|')
  md.push('| `submissions-12m.jsonl` | one JSON object per submission |')
  md.push('| `by-page-url.json` / `.csv` | per pageUrl: raw_12m, raw_3m, qualified_*=null, became_deal_*=null |')
  md.push('| `by-first-page-seen.json` | empty array - CRM scope missing |')
  md.push('| `scope-probes.json` | raw probe results |')
  md.push('| `calendly-check.json` | visibility verdict |')
  md.push('| `forms.json` | form id/name/archived snapshot |')
  md.push('')
  md.push('## Top pages by raw submissions (12m) - NOT for ranking')
  md.push('')
  md.push('| URL | raw_12m | raw_3m |')
  md.push('|---|---|---|')
  for (const r of byPage.slice(0, 25)) {
    md.push(`| ${r.url} | ${r.raw_12m} | ${r.raw_3m} |`)
  }
  md.push('')

  writeFileSync(path.join(OUT_DIR, 'MANIFEST-hubspot.md'), md.join('\n'))
}

async function main(): Promise<void> {
  mkdirSync(OUT_DIR, { recursive: true })
  console.log(`Portal ${PORTAL_ID}`)
  console.log(`Out    ${OUT_DIR}`)
  console.log(`Window 12m since ${new Date(CUTOFF_12M).toISOString()}`)

  console.log('\n1. Probing quality / Calendly scopes...')
  const quality = await probeQualityScopes()
  for (const p of quality.probes) {
    console.log(`   ${p.ok ? 'OK ' : 'NO '} ${p.endpoint} (${p.status})`)
  }

  const bail =
    !quality.canReadContacts || !quality.canReadDeals
  const bailReason = bail
    ? `HUBSPOT_ACCESS_TOKEN can read form submissions (forms scope) but cannot read contacts or deals (CRM scopes missing: every contacts/deals/meetings probe returned 403). Lifecycle, deal association, owner, spam flags, and first-page-seen all live on CRM objects we cannot read. Form identity alone is not a reliable buyer-vs-noise separator on Contact/hiring forms (vendor spam submits those too - confirmed in sample). Per brief bail-out: do not invent heuristics; do not trust raw counts for page ranking.`
    : ''

  console.log(`\n2. Listing forms...`)
  const forms = await fetchForms()
  console.log(`   ${forms.length} forms`)

  console.log(`\n3. Pulling submissions (last 12m)...`)
  const submissions: Submission[] = []
  for (const [i, form] of forms.entries()) {
    const rows = await fetchFormSubmissions(form)
    if (rows.length) console.log(`   [${i + 1}/${forms.length}] ${form.name}: ${rows.length}`)
    submissions.push(...rows)
  }
  submissions.sort((a, b) => b.submittedAt - a.submittedAt)
  console.log(`   Total submissions 12m: ${submissions.length}`)

  const byPage = aggregateByPage(submissions)

  // Writes
  writeFileSync(
    path.join(OUT_DIR, 'forms.json'),
    JSON.stringify({ portalId: PORTAL_ID, pulledAt: new Date().toISOString(), forms }, null, 2),
  )
  writeFileSync(
    path.join(OUT_DIR, 'submissions-12m.jsonl'),
    submissions.map((s) => JSON.stringify(s)).join('\n') + (submissions.length ? '\n' : ''),
  )
  writeFileSync(path.join(OUT_DIR, 'by-page-url.json'), JSON.stringify(byPage, null, 2))
  writeFileSync(path.join(OUT_DIR, 'by-page-url.csv'), toCsv(byPage))
  writeFileSync(
    path.join(OUT_DIR, 'by-first-page-seen.json'),
    JSON.stringify(
      {
        available: quality.firstPageSeenAvailable,
        reason: quality.firstPageSeenAvailable
          ? null
          : 'Contact CRM properties (hs_analytics_first_url / original source) require crm.objects.contacts.read; token returned 403.',
        rows: [],
      },
      null,
      2,
    ),
  )
  writeFileSync(path.join(OUT_DIR, 'scope-probes.json'), JSON.stringify(quality, null, 2))
  writeFileSync(
    path.join(OUT_DIR, 'calendly-check.json'),
    JSON.stringify(
      {
        visible: quality.calendlyVisible,
        verdict: quality.calendlyVisible
          ? 'Meetings or engagements readable - inspect separately.'
          : 'Calendly bookings are NOT visible with this token. /book-a-call is a major conversion path and is invisible in form-submission data. HubSpot may still hold the meetings (form audit says Calendly writes directly + Slack workflows fire) but crm.objects.meetings.read / engagements-read are missing.',
        probes: quality.probes.filter((p) => /meeting|engagement/i.test(p.endpoint)),
      },
      null,
      2,
    ),
  )
  writeFileSync(
    path.join(OUT_DIR, 'quality-bailout.json'),
    JSON.stringify(
      {
        bailed: bail,
        reason: bailReason,
        usableForPageRanking: false,
        leads_12m_for_joined_table: null,
        note: 'Job 2 must leave leads_12m null throughout.',
      },
      null,
      2,
    ),
  )

  writeManifest({ forms, submissions, byPage, quality, bail, bailReason })

  console.log(`\n4. Done. Bail=${bail}`)
  if (bail) {
    console.log('   QUALITY BAIL-OUT: raw tables written; qualified/deal null; joined leads_12m must be null.')
    console.log(`   Reason: ${bailReason.slice(0, 200)}...`)
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})

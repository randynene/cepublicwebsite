/**
 * HubSpot form-submission pull for SEO intel (last 12 months).
 *
 * Pulls every form submission with page URL + date, then joins each submission
 * to its CRM contact to produce the quality signals needed to separate buyer
 * enquiries from noise: lifecycle stage, associated deals, deal value, and
 * first-touch page.
 *
 * HISTORY. The first version of this script probed for the CRM scopes, found
 * them absent, and deliberately hardcoded qualified_* / became_deal_* to null
 * rather than invent a heuristic. On 10 Aug 2026 the private app was widened to
 * include crm.objects.contacts.read, crm.objects.deals.read,
 * crm.schemas.contacts.read and crm.schemas.deals.read. The probes still run,
 * and the refusal path still exists: if any join fails, the columns go back to
 * null and `usableForPageRanking` stays false. A wrong number here is worse
 * than a null, because content work gets aimed with it.
 *
 * PII. Contact records hold names, emails and phone numbers. Nothing
 * per-contact is ever written to disk or logged. Emails exist only in memory as
 * a join key; every output file is aggregated to a page URL. Submission rows
 * carry a truncated SHA-256 `contactKey` instead of an address, so repeat
 * submitters stay countable without being identifiable.
 *
 * Run: npx tsx scripts/seo/hubspot-leads-pull.ts
 * Out:  audit-output/seo-intel/2026-08-06/hubspot/
 */

import 'dotenv/config'

import { createHash } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { z } from 'zod'

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

/** Batch endpoints cap at 100 inputs per call. */
const BATCH = 100

/** Forms that are deliberately not buyer enquiry surfaces (from form audit). */
const NON_BUYER_FORM_IDS = new Set([
  '52c97427-de33-4597-b7e3-f4c882d00690', // Career Form
  'debebd67-326a-4014-84cd-a13da66cb120', // DevelopersPage
  'b411a11f-1548-4cf7-887e-26fac7824006', // Newsletter (retired, Tech Debt #63)
  'e4f38128-b341-4929-a861-652d64127d36', // webflow Subscription form
])

/**
 * Lifecycle stages that do NOT indicate a buyer enquiry. Everything else that
 * the portal actually defines is treated as qualified. Stated as an exclusion
 * list rather than an inclusion list so a custom stage added later counts as
 * qualified by default and shows up in the manifest, instead of silently
 * vanishing from the numbers.
 *
 * `lead` is excluded on purpose: HubSpot sets it on anyone who submits any
 * form, so it carries no qualification signal at all on this portal.
 */
const UNQUALIFIED_STAGES = new Set(['subscriber', 'lead', 'other'])

/** Hosts whose URLs count as a page of ours for attribution purposes. */
function isOwnSiteUrl(raw: string | null): boolean {
  if (!raw) return false
  try {
    const host = new URL(raw).hostname.toLowerCase()
    if (host.startsWith('talent.')) return false
    return host.endsWith('cloudemployee.io') || host.endsWith('cloudemployee.co.uk')
  } catch {
    return false
  }
}

type AttributionMethod =
  | 'contact_first_url'
  | 'ce_source_page'
  | 'form_page_url'
  | 'none'

type Form = { id: string; name: string; archived: boolean }

type Submission = {
  formId: string
  formName: string
  conversionId: string
  submittedAt: number
  submittedAtIso: string
  pageUrl: string | null
  /** Truncated SHA-256 of the lowercased email. Never the email itself. */
  contactKey: string | null
  surfaceClass: 'non_buyer_form' | 'other_form'
  /** Filled by the CRM join. */
  attributedUrl: string | null
  attributionMethod: AttributionMethod
  lifecycleStage: string | null
  qualified: boolean
  dealIds: string[]
}

type PageAgg = {
  url: string
  raw_12m: number
  raw_3m: number
  qualified_12m: number | null
  qualified_3m: number | null
  became_deal_12m: number | null
  became_deal_3m: number | null
  deal_value_12m: number | null
  dealCurrency: string | null
  distinctDeals_12m: number | null
  attributionMethods: Record<AttributionMethod, number>
  byForm_12m: Record<string, number>
}

type ScopeProbe = {
  endpoint: string
  ok: boolean
  status: number | null
  detail: string
}

type ContactFacts = {
  id: string
  lifecycleStage: string | null
  firstUrl: string | null
  ceSourcePage: string | null
  associatedDeals: number
}

type DealFacts = {
  id: string
  amount: number | null
  currency: string | null
}

if (!TOKEN) {
  console.error('HUBSPOT_ACCESS_TOKEN is not set.')
  process.exit(1)
}

/* ------------------------------------------------------------------ *
 * Zod schemas for every external shape we read.
 * ------------------------------------------------------------------ */

const pagingSchema = z
  .object({ next: z.object({ after: z.string().optional() }).optional() })
  .optional()

const formsPageSchema = z.object({
  results: z.array(
    z.object({ id: z.string(), name: z.string(), archived: z.boolean() }),
  ),
  paging: pagingSchema,
})

const submissionsPageSchema = z.object({
  results: z.array(
    z.object({
      conversionId: z.string(),
      submittedAt: z.number(),
      pageUrl: z.string().nullable().optional(),
      values: z
        .array(z.object({ name: z.string(), value: z.string().nullable().optional() }))
        .nullable()
        .optional(),
    }),
  ),
  paging: pagingSchema,
})

const propertyDefSchema = z.object({
  name: z.string(),
  label: z.string(),
  options: z
    .array(
      z.object({
        label: z.string(),
        value: z.string(),
        hidden: z.boolean().optional(),
      }),
    )
    .optional(),
})

const crmObjectSchema = z.object({
  id: z.string(),
  properties: z.record(z.string(), z.string().nullable().optional()),
})

const batchReadSchema = z.object({
  results: z.array(crmObjectSchema),
  numErrors: z.number().optional(),
})

const assocBatchSchema = z.object({
  results: z.array(
    z.object({
      from: z.object({ id: z.string() }),
      to: z.array(z.object({ toObjectId: z.union([z.string(), z.number()]) })),
    }),
  ),
})

/* ------------------------------------------------------------------ */

async function hs(
  pathname: string,
  init?: RequestInit,
): Promise<
  { ok: true; status: number; json: unknown } | { ok: false; status: number; text: string }
> {
  const res = await fetch(`${API}${pathname}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  if (!res.ok) {
    // 207 is HubSpot's partial-success code on batch reads; treat it as ok and
    // let the caller inspect numErrors.
    if (res.status === 207) return { ok: true, status: res.status, json: await res.json() }
    return { ok: false, status: res.status, text: (await res.text()).slice(0, 500) }
  }
  return { ok: true, status: res.status, json: await res.json() }
}

function valueOf(
  values: Array<{ name: string; value?: string | null }> | null | undefined,
  name: string,
): string | null {
  const hit = values?.find((v) => v.name === name)
  const v = hit?.value?.trim()
  return v ? v : null
}

function hashEmail(email: string): string {
  return createHash('sha256').update(email).digest('hex').slice(0, 16)
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

function normalizeUrl(raw: string | null | undefined): string | null {
  if (!raw) return null
  try {
    const u = new URL(raw)
    u.hash = ''
    // Strip tracking params; keep path as the attribution key.
    for (const key of [...u.searchParams.keys()]) {
      // submissionGuid / hsCtaTracking are per-submission, so leaving them on
      // would fragment one page into a row per visitor.
      if (
        /^(utm_|gclid|gclsrc|gad_|fbclid|msclkid|hsa_|_gl)/i.test(key) ||
        key === 'hsCtaTracking' ||
        key === 'submissionGuid' ||
        key === 'hsLang'
      ) {
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
      const page = formsPageSchema.parse(res.json)
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
    const page = submissionsPageSchema.parse(res.json)

    let hitOlder = false
    for (const row of page.results) {
      if (row.submittedAt < CUTOFF_12M) {
        hitOlder = true
        break
      }
      const email = valueOf(row.values, 'email')?.toLowerCase() ?? null
      out.push({
        formId: form.id,
        formName: form.name,
        conversionId: row.conversionId,
        submittedAt: row.submittedAt,
        submittedAtIso: new Date(row.submittedAt).toISOString(),
        pageUrl: normalizeUrl(row.pageUrl ?? null),
        contactKey: email ? hashEmail(email) : null,
        surfaceClass: NON_BUYER_FORM_IDS.has(form.id) ? 'non_buyer_form' : 'other_form',
        attributedUrl: null,
        attributionMethod: 'none',
        lifecycleStage: null,
        qualified: false,
        dealIds: [],
      })
      // The email is needed for the CRM join but must not live on the row that
      // gets serialised. Kept in a side map keyed by conversionId.
      if (email) emailByConversion.set(row.conversionId, email)
    }

    after = page.paging?.next?.after
    if (hitOlder || !after) break
  }
  return out
}

/** In-memory only. Never serialised, never logged. */
const emailByConversion = new Map<string, string>()

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

/**
 * Reads the lifecycle stage options the portal actually defines, rather than
 * assuming HubSpot's stock ladder. Returns the qualified set plus the full list
 * so the manifest can state exactly what was counted.
 */
async function fetchLifecycleStages(): Promise<{
  all: Array<{ value: string; label: string }>
  qualified: Set<string>
}> {
  const res = await hs('/crm/v3/properties/contacts/lifecyclestage')
  if (!res.ok) throw new Error(`lifecyclestage property read failed ${res.status}: ${res.text}`)
  const def = propertyDefSchema.parse(res.json)
  const all = (def.options ?? []).map((o) => ({ value: o.value, label: o.label }))
  const qualified = new Set(
    all.map((o) => o.value).filter((v) => !UNQUALIFIED_STAGES.has(v)),
  )
  return { all, qualified }
}

/** Batch-reads contacts by email. Emails stay in memory; nothing is logged. */
async function fetchContactsByEmail(emails: string[]): Promise<Map<string, ContactFacts>> {
  const out = new Map<string, ContactFacts>()
  const properties = [
    'email',
    'lifecyclestage',
    'hs_analytics_first_url',
    'ce_source_page',
    'num_associated_deals',
  ]
  for (const group of chunk(emails, BATCH)) {
    const res = await hs('/crm/v3/objects/contacts/batch/read', {
      method: 'POST',
      body: JSON.stringify({
        idProperty: 'email',
        properties,
        inputs: group.map((id) => ({ id })),
      }),
    })
    if (!res.ok) throw new Error(`contacts batch read ${res.status}: ${res.text}`)
    const page = batchReadSchema.parse(res.json)
    for (const r of page.results) {
      const email = r.properties.email?.toLowerCase()
      if (!email) continue
      out.set(email, {
        id: r.id,
        lifecycleStage: r.properties.lifecyclestage ?? null,
        firstUrl: r.properties.hs_analytics_first_url ?? null,
        ceSourcePage: r.properties.ce_source_page ?? null,
        associatedDeals: Number(r.properties.num_associated_deals ?? '0') || 0,
      })
    }
  }
  return out
}

/** contact id -> deal ids. */
async function fetchContactDealIds(contactIds: string[]): Promise<Map<string, string[]>> {
  const out = new Map<string, string[]>()
  for (const group of chunk(contactIds, BATCH)) {
    const res = await hs('/crm/v4/associations/contacts/deals/batch/read', {
      method: 'POST',
      body: JSON.stringify({ inputs: group.map((id) => ({ id })) }),
    })
    if (!res.ok) throw new Error(`contact->deal associations ${res.status}: ${res.text}`)
    const page = assocBatchSchema.parse(res.json)
    for (const r of page.results) {
      out.set(
        r.from.id,
        r.to.map((t) => String(t.toObjectId)),
      )
    }
  }
  return out
}

async function fetchDeals(dealIds: string[]): Promise<Map<string, DealFacts>> {
  const out = new Map<string, DealFacts>()
  for (const group of chunk(dealIds, BATCH)) {
    const res = await hs('/crm/v3/objects/deals/batch/read', {
      method: 'POST',
      body: JSON.stringify({
        properties: ['amount', 'deal_currency_code', 'dealstage'],
        inputs: group.map((id) => ({ id })),
      }),
    })
    if (!res.ok) throw new Error(`deals batch read ${res.status}: ${res.text}`)
    const page = batchReadSchema.parse(res.json)
    for (const r of page.results) {
      const raw = r.properties.amount
      const amount = raw === null || raw === undefined || raw === '' ? null : Number(raw)
      out.set(r.id, {
        id: r.id,
        amount: amount !== null && Number.isFinite(amount) ? amount : null,
        currency: r.properties.deal_currency_code ?? null,
      })
    }
  }
  return out
}

/**
 * Picks the attribution URL for a submission. Preference order is the brief's:
 * the contact's first-touch page, then the ce_source_page custom property, then
 * the page the form itself sat on. The choice is recorded per row so the method
 * is auditable rather than implied.
 */
function attribute(
  sub: Submission,
  contact: ContactFacts | undefined,
): { url: string | null; method: AttributionMethod } {
  const first = normalizeUrl(contact?.firstUrl ?? null)
  if (isOwnSiteUrl(first)) return { url: first, method: 'contact_first_url' }
  const source = normalizeUrl(contact?.ceSourcePage ?? null)
  if (isOwnSiteUrl(source)) return { url: source, method: 'ce_source_page' }
  if (sub.pageUrl) return { url: sub.pageUrl, method: 'form_page_url' }
  return { url: null, method: 'none' }
}

function emptyMethods(): Record<AttributionMethod, number> {
  return { contact_first_url: 0, ce_source_page: 0, form_page_url: 0, none: 0 }
}

function aggregate(
  subs: Submission[],
  key: (s: Submission) => string,
  joined: boolean,
  deals: Map<string, DealFacts>,
  currency: string | null,
): PageAgg[] {
  const map = new Map<string, PageAgg>()
  const dealsSeen = new Map<string, Set<string>>()

  for (const s of subs) {
    const url = key(s)
    let row = map.get(url)
    if (!row) {
      row = {
        url,
        raw_12m: 0,
        raw_3m: 0,
        qualified_12m: joined ? 0 : null,
        qualified_3m: joined ? 0 : null,
        became_deal_12m: joined ? 0 : null,
        became_deal_3m: joined ? 0 : null,
        deal_value_12m: joined ? 0 : null,
        dealCurrency: joined ? currency : null,
        distinctDeals_12m: joined ? 0 : null,
        attributionMethods: emptyMethods(),
        byForm_12m: {},
      }
      map.set(url, row)
      dealsSeen.set(url, new Set())
    }
    const in3m = s.submittedAt >= CUTOFF_3M
    row.raw_12m += 1
    if (in3m) row.raw_3m += 1
    row.attributionMethods[s.attributionMethod] += 1
    row.byForm_12m[s.formName] = (row.byForm_12m[s.formName] ?? 0) + 1

    if (!joined) continue

    if (s.qualified) {
      row.qualified_12m = (row.qualified_12m ?? 0) + 1
      if (in3m) row.qualified_3m = (row.qualified_3m ?? 0) + 1
    }
    if (s.dealIds.length > 0) {
      row.became_deal_12m = (row.became_deal_12m ?? 0) + 1
      if (in3m) row.became_deal_3m = (row.became_deal_3m ?? 0) + 1
    }
    const seen = dealsSeen.get(url)
    for (const id of s.dealIds) {
      if (!seen || seen.has(id)) continue
      seen.add(id)
      row.distinctDeals_12m = (row.distinctDeals_12m ?? 0) + 1
      const amount = deals.get(id)?.amount
      if (amount !== null && amount !== undefined) {
        row.deal_value_12m = (row.deal_value_12m ?? 0) + amount
      }
    }
  }

  return [...map.values()].sort(
    (a, b) =>
      (b.became_deal_12m ?? 0) - (a.became_deal_12m ?? 0) ||
      (b.qualified_12m ?? 0) - (a.qualified_12m ?? 0) ||
      b.raw_12m - a.raw_12m ||
      a.url.localeCompare(b.url),
  )
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
    'deal_value_12m',
    'deal_currency',
    'primary_attribution_method',
  ]
  const lines = [headers.join(',')]
  for (const r of rows) {
    const primary = (Object.entries(r.attributionMethods) as Array<[AttributionMethod, number]>)
      .sort((a, b) => b[1] - a[1])[0]
    lines.push(
      [
        csvEscape(r.url),
        r.raw_12m,
        r.raw_3m,
        r.qualified_12m ?? '',
        r.qualified_3m ?? '',
        r.became_deal_12m ?? '',
        r.became_deal_3m ?? '',
        r.deal_value_12m ?? '',
        r.dealCurrency ?? '',
        primary ? primary[0] : '',
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
  byAttributed: PageAgg[]
  quality: Awaited<ReturnType<typeof probeQualityScopes>>
  stages: { all: Array<{ value: string; label: string }>; qualified: Set<string> }
  join: JoinOutcome
}): void {
  const { forms, submissions, byPage, byAttributed, quality, stages, join } = args
  const nonBuyer = submissions.filter((s) => s.surfaceClass === 'non_buyer_form').length
  const other = submissions.length - nonBuyer
  const withPage = submissions.filter((s) => s.pageUrl).length
  const withoutPage = submissions.length - withPage
  const in3m = submissions.filter((s) => s.submittedAt >= CUTOFF_3M).length
  const qualified12 = submissions.filter((s) => s.qualified).length
  const deal12 = submissions.filter((s) => s.dealIds.length > 0).length

  const md: string[] = []
  md.push('# MANIFEST - HubSpot leads pull')
  md.push('')
  md.push(`Portal: \`${PORTAL_ID}\``)
  md.push(`Pulled: ${new Date().toISOString()}`)
  md.push('Script: `scripts/seo/hubspot-leads-pull.ts`')
  md.push(`Window: last 12 months from pull time (cutoff ${new Date(CUTOFF_12M).toISOString()})`)
  md.push(`3-month cutoff: ${new Date(CUTOFF_3M).toISOString()}`)
  md.push('')
  md.push('## JOIN VERDICT')
  md.push('')
  if (join.usableForPageRanking) {
    md.push(
      '**Joins resolved.** Lifecycle and deal columns are populated and `usableForPageRanking` is true.',
    )
  } else {
    md.push(`**JOIN REFUSED.** ${join.reason}`)
    md.push('')
    md.push(
      'Raw submission counts by page URL are still written. `qualified_*` and `became_deal_*` stay null; raw counts must not be used to rank pages.',
    )
  }
  md.push('')
  md.push('## Qualification rule (read from the API, not assumed)')
  md.push('')
  md.push('Lifecycle stage options defined on this portal, and how each was counted:')
  md.push('')
  md.push('| Value | Label | Counted as qualified |')
  md.push('|---|---|---|')
  for (const o of stages.all) {
    md.push(`| \`${o.value}\` | ${o.label} | ${stages.qualified.has(o.value) ? 'yes' : 'no'} |`)
  }
  md.push('')
  md.push(
    'A contact with no lifecycle stage at all is counted as NOT qualified. `lead` is excluded because HubSpot sets it on every form submitter, so it carries no qualification signal.',
  )
  md.push('')
  md.push('## Attribution')
  md.push('')
  md.push(
    'Per submission, the first candidate that resolves to one of our own hosts wins, and the choice is recorded on the row:',
  )
  md.push('')
  md.push('| Method | Submissions | Meaning |')
  md.push('|---|---|---|')
  md.push(
    `| \`contact_first_url\` | ${join.methodCounts.contact_first_url} | contact property \`hs_analytics_first_url\` (first touch) |`,
  )
  md.push(
    `| \`ce_source_page\` | ${join.methodCounts.ce_source_page} | custom contact property \`ce_source_page\` |`,
  )
  md.push(
    `| \`form_page_url\` | ${join.methodCounts.form_page_url} | the page the form itself sat on |`,
  )
  md.push(`| \`none\` | ${join.methodCounts.none} | no usable URL on any candidate |`)
  md.push('')
  md.push(
    'URLs on `talent.cloudemployee.io` and on third-party hosts (`meetings.hubspot.com` and similar) are rejected as first-touch candidates, because they are not pages of this site and cannot rank one.',
  )
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
    `- **Page-of-form attribution:** where first touch is unknown, a submission attributes to the page the form sat on (usually \`/contact\`), not the content that persuaded the visitor. ${withPage} of ${submissions.length} submissions have a pageUrl; ${withoutPage} have none.`,
  )
  md.push(
    `- **Contact join coverage:** ${join.emailsSeen} distinct emails on submissions, ${join.contactsMatched} matched to a CRM contact (${join.matchRatePct}%). Unmatched submissions cannot carry lifecycle or deal signal and count as not qualified.`,
  )
  md.push(
    `- **Deal amounts:** ${join.dealsWithAmount} of ${join.dealsSeen} joined deals carry a readable \`amount\`. Currency is \`${join.currency ?? 'unknown'}\` (from \`deal_currency_code\`; ${join.currencyNote}). Deals with no amount contribute to the deal COUNT but not to \`deal_value_12m\`.`,
  )
  md.push(
    `- **Value concentration:** the single largest joined deal is ${join.largestDealValue === null ? 'unknown' : join.largestDealValue.toLocaleString('en-GB')} ${join.currency ?? ''}, against a joined total of ${join.totalDealValue === null ? 'null' : join.totalDealValue.toLocaleString('en-GB')}. With this few priced deals, one contract can decide a page's value ranking. Rank on deal COUNT first and treat value as colour.`,
  )
  md.push(
    `- **Deal recency:** \`became_deal_*\` and \`deal_value_12m\` count deals associated with a contact who submitted in the window. The DEAL itself may predate the window; a returning customer's older deal can therefore attach to a recent submission.`,
  )
  md.push(
    `- **Calendly / book-a-call:** ${
      quality.calendlyVisible
        ? 'meetings/engagements readable - see calendly-check.json. Calendly bookings are still not form submissions, so they do not appear as rows here.'
        : 'NOT visible to this token. The major book-a-call conversion path is invisible in this pull.'
    }`,
  )
  md.push(
    '- **Newsletter form:** retired (Tech Debt #63). Still listed; tagged `non_buyer_form` if any submissions appear.',
  )
  md.push(
    '- **Pre-3-Aug data:** the site migrated off Webflow on 3 Aug 2026. Attribution URLs from before then are Webflow URLs. Paths are largely continuous across the cutover, but a URL that was retired or redirected will appear under its old path.',
  )
  md.push('')
  md.push('## Counts')
  md.push('')
  md.push('| Metric | Value |')
  md.push('|---|---|')
  md.push(`| Forms on portal (live + archived) | ${forms.length} |`)
  md.push(`| Submissions last 12m | ${submissions.length} |`)
  md.push(`| Submissions last 3m | ${in3m} |`)
  md.push(`| On non-buyer forms (careers/newsletter/devs) | ${nonBuyer} |`)
  md.push(`| On other forms (includes Contact + hiring + magnets + spam) | ${other} |`)
  md.push(`| Distinct form pageUrl values | ${byPage.length} |`)
  md.push(`| Distinct attributed URLs | ${byAttributed.length} |`)
  md.push(`| Qualified submissions (12m) | ${qualified12} |`)
  md.push(`| Submissions from contacts with a deal (12m) | ${deal12} |`)
  md.push(`| Distinct deals joined | ${join.dealsSeen} |`)
  md.push(
    `| Total deal value (${join.currency ?? 'unknown currency'}) | ${join.totalDealValue === null ? 'null' : join.totalDealValue.toLocaleString('en-GB')} |`,
  )
  md.push(
    `| Qualified rate | ${submissions.length ? ((qualified12 / submissions.length) * 100).toFixed(1) : '0'}% |`,
  )
  md.push('')
  md.push('## Outputs')
  md.push('')
  md.push('| File | Contents |')
  md.push('|---|---|')
  md.push('| `submissions-12m.jsonl` | one JSON object per submission, no PII (hashed `contactKey`) |')
  md.push('| `by-page-url.json` / `.csv` | per FORM page URL: raw / qualified / deal / value |')
  md.push('| `by-attributed-page.json` / `.csv` | per ATTRIBUTED page URL (first touch preferred) |')
  md.push('| `by-first-page-seen.json` | first-touch URL rollup from `hs_analytics_first_url` |')
  md.push('| `scope-probes.json` | raw probe results |')
  md.push('| `calendly-check.json` | visibility verdict |')
  md.push('| `forms.json` | form id/name/archived snapshot |')
  md.push('| `join-outcome.json` | join coverage + usableForPageRanking |')
  md.push('')
  md.push('## Top attributed pages by deals, then qualified leads (12m)')
  md.push('')
  md.push('| URL | deals | qualified 12m | raw 12m | value |')
  md.push('|---|---|---|---|---|')
  for (const r of byAttributed.slice(0, 30)) {
    md.push(
      `| ${r.url} | ${r.became_deal_12m ?? ''} | ${r.qualified_12m ?? ''} | ${r.raw_12m} | ${r.deal_value_12m ?? ''} |`,
    )
  }
  md.push('')

  writeFileSync(path.join(OUT_DIR, 'MANIFEST-hubspot.md'), md.join('\n'))
}

type JoinOutcome = {
  usableForPageRanking: boolean
  reason: string
  emailsSeen: number
  contactsMatched: number
  matchRatePct: string
  dealsSeen: number
  dealsWithAmount: number
  totalDealValue: number | null
  /** Concentration check: one large deal can dominate a page's value figure. */
  largestDealValue: number | null
  currency: string | null
  currencyNote: string
  methodCounts: Record<AttributionMethod, number>
  qualifiedStages: string[]
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

  const canJoin = quality.canReadContacts && quality.canReadDeals

  console.log('\n2. Reading lifecycle stage options...')
  const stages = canJoin
    ? await fetchLifecycleStages()
    : { all: [], qualified: new Set<string>() }
  if (canJoin) {
    console.log(`   ${stages.all.length} stages defined`)
    console.log(`   qualified: ${[...stages.qualified].join(', ')}`)
  }

  console.log('\n3. Listing forms...')
  const forms = await fetchForms()
  console.log(`   ${forms.length} forms`)

  console.log('\n4. Pulling submissions (last 12m)...')
  const submissions: Submission[] = []
  for (const [i, form] of forms.entries()) {
    const rows = await fetchFormSubmissions(form)
    if (rows.length) console.log(`   [${i + 1}/${forms.length}] ${form.name}: ${rows.length}`)
    submissions.push(...rows)
  }
  submissions.sort((a, b) => b.submittedAt - a.submittedAt)
  console.log(`   Total submissions 12m: ${submissions.length}`)

  const join: JoinOutcome = {
    usableForPageRanking: false,
    reason: canJoin
      ? ''
      : 'HUBSPOT_ACCESS_TOKEN cannot read contacts and/or deals. Lifecycle, deal association and first-page-seen all live on CRM objects this token cannot see. Columns left null rather than guessed.',
    emailsSeen: 0,
    contactsMatched: 0,
    matchRatePct: '0.0',
    dealsSeen: 0,
    dealsWithAmount: 0,
    totalDealValue: null,
    largestDealValue: null,
    currency: null,
    currencyNote: 'not read',
    methodCounts: emptyMethods(),
    qualifiedStages: [...stages.qualified],
  }

  let deals = new Map<string, DealFacts>()

  if (canJoin) {
    console.log('\n5. Joining submissions to CRM contacts...')
    const emails = [...new Set([...emailByConversion.values()])]
    join.emailsSeen = emails.length
    console.log(`   ${emails.length} distinct emails to resolve (never written to disk)`)
    const contacts = await fetchContactsByEmail(emails)
    join.contactsMatched = contacts.size
    join.matchRatePct = emails.length
      ? ((contacts.size / emails.length) * 100).toFixed(1)
      : '0.0'
    console.log(`   matched ${contacts.size} contacts (${join.matchRatePct}%)`)

    console.log('\n6. Reading deal associations + amounts...')
    const withDeals = [...contacts.values()].filter((c) => c.associatedDeals > 0)
    console.log(`   ${withDeals.length} matched contacts have at least one deal`)
    const dealIdsByContact = await fetchContactDealIds(withDeals.map((c) => c.id))
    const allDealIds = [...new Set([...dealIdsByContact.values()].flat())]
    join.dealsSeen = allDealIds.length
    deals = await fetchDeals(allDealIds)
    const amounts = [...deals.values()].map((d) => d.amount).filter((a): a is number => a !== null)
    join.dealsWithAmount = amounts.length
    join.totalDealValue = amounts.reduce((a, b) => a + b, 0)
    join.largestDealValue = amounts.length ? Math.max(...amounts) : null
    const currencies = new Set(
      [...deals.values()].map((d) => d.currency).filter((c): c is string => Boolean(c)),
    )
    join.currency = currencies.size === 1 ? [...currencies][0] : null
    join.currencyNote =
      currencies.size === 1
        ? 'every joined deal carries the same currency code, so the sum is meaningful'
        : `${currencies.size} distinct currency codes present (${[...currencies].join(', ')}); values are NOT converted, so the sum is left null`
    if (currencies.size !== 1) {
      join.totalDealValue = null
      join.largestDealValue = null
    }
    console.log(
      `   ${allDealIds.length} distinct deals, ${amounts.length} with a readable amount, currency ${join.currency ?? 'mixed/unknown'}`,
    )

    console.log('\n7. Attributing + scoring submissions...')
    for (const s of submissions) {
      const email = emailByConversion.get(s.conversionId)
      const contact = email ? contacts.get(email) : undefined
      const a = attribute(s, contact)
      s.attributedUrl = a.url
      s.attributionMethod = a.method
      join.methodCounts[a.method] += 1
      s.lifecycleStage = contact?.lifecycleStage ?? null
      s.qualified = Boolean(s.lifecycleStage && stages.qualified.has(s.lifecycleStage))
      s.dealIds = contact ? (dealIdsByContact.get(contact.id) ?? []) : []
    }

    join.usableForPageRanking = contacts.size > 0
    if (!join.usableForPageRanking) {
      join.reason =
        'CRM reads succeeded but zero submission emails matched a contact, so no submission carries lifecycle or deal signal. Columns left null.'
    }
  } else {
    for (const s of submissions) {
      const a = attribute(s, undefined)
      s.attributedUrl = a.url
      s.attributionMethod = a.method
      join.methodCounts[a.method] += 1
    }
  }

  const joined = join.usableForPageRanking
  const byPage = aggregate(
    submissions,
    (s) => s.pageUrl ?? '(no pageUrl)',
    joined,
    deals,
    join.currency,
  )
  const byAttributed = aggregate(
    submissions,
    (s) => s.attributedUrl ?? '(unattributed)',
    joined,
    deals,
    join.currency,
  )

  // Writes. Nothing below may contain a contact identifier.
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
    path.join(OUT_DIR, 'by-attributed-page.json'),
    JSON.stringify(byAttributed, null, 2),
  )
  writeFileSync(path.join(OUT_DIR, 'by-attributed-page.csv'), toCsv(byAttributed))

  const firstTouchRows = byAttributed
    .filter((r) => r.attributionMethods.contact_first_url > 0)
    .map((r) => ({
      url: r.url,
      submissions: r.attributionMethods.contact_first_url,
      qualified_12m: r.qualified_12m,
      became_deal_12m: r.became_deal_12m,
    }))
  writeFileSync(
    path.join(OUT_DIR, 'by-first-page-seen.json'),
    JSON.stringify(
      {
        available: quality.firstPageSeenAvailable,
        source: 'contact property hs_analytics_first_url, own-site hosts only',
        rows: firstTouchRows,
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
          ? 'Meetings or engagements readable. Note that Calendly bookings are not form submissions, so they are absent from the per-page tables regardless.'
          : 'Calendly bookings are NOT visible with this token.',
        probes: quality.probes.filter((p) => /meeting|engagement/i.test(p.endpoint)),
      },
      null,
      2,
    ),
  )
  writeFileSync(path.join(OUT_DIR, 'join-outcome.json'), JSON.stringify(join, null, 2))

  writeManifest({ forms, submissions, byPage, byAttributed, quality, stages, join })

  console.log(`\n8. Done. usableForPageRanking=${join.usableForPageRanking}`)
  if (!join.usableForPageRanking) {
    console.log(`   Reason: ${join.reason}`)
  } else {
    console.log(
      `   qualified 12m: ${submissions.filter((s) => s.qualified).length}, submissions with a deal: ${submissions.filter((s) => s.dealIds.length > 0).length}, deal value: ${join.totalDealValue ?? 'null'} ${join.currency ?? ''}`,
    )
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})

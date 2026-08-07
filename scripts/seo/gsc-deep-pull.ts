import 'dotenv/config'

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'

import { google } from 'googleapis'
import { z } from 'zod'

// Exhaustive Search Console pull for cloudemployee.io.
//
// This is the deep companion to scripts/seo/gsc-pull.ts, which sampled three
// dimension sets over a 90-day window ending one day after the 3 Aug cutover.
// Here we take the full 16 months Search Console retains, every dimension and
// the dimension pairs the API allows, every search type, and a like-for-like
// pre-cutover vs post-cutover comparison over identical window lengths.
//
// Things that matter about this property:
//
//   - It is a DOMAIN property (sc-domain:cloudemployee.io), so it spans www and
//     non-www, http and https, AND EVERY SUBDOMAIN. talent.cloudemployee.io is
//     a separate Webflow site that is not ours; its URLs are in this data on
//     purpose (removing them would misrepresent the property) and every page
//     row is tagged `ours` / `talent` / `other` so analysis cannot confuse them.
//   - Because it is one property across the cutover, history is unbroken. There
//     is no old-property/new-property reconciliation to do.
//   - Data lags 2-3 days. Every job is pulled twice-aware: `final` data state
//     for the archive, plus a freshness probe on `all` so the manifest can say
//     what the newest date with ANY data is.
//
// Row cap: the API returns at most 25,000 rows per request, so every job
// paginates on startRow to exhaustion. A job that stops because it hit
// MAX_ROWS is recorded as capped in the manifest rather than silently cut.
//
// Run:    npx tsx scripts/seo/gsc-deep-pull.ts [--force] [--only=<substr>]
// Output: audit-output/seo-intel/<DATE>/gsc/*.json  (gitignored)
//         audit-output/seo-intel/<DATE>/MANIFEST-gsc.md
//
// Resume is the default: a job whose output file already exists is skipped.
// Pass --force to re-pull everything, or --only=<substr> to re-pull matching
// job names.

const SITE = process.env.GSC_SITE_URL ?? 'sc-domain:cloudemployee.io'
const DATE = '2026-08-06'
const OUT_DIR = `audit-output/seo-intel/${DATE}/gsc`
const MANIFEST = `audit-output/seo-intel/${DATE}/MANIFEST-gsc.md`

/** Day the Webflow to Next.js cutover completed. */
const CUTOVER = '2026-08-03'
/** Search Console retains 16 months. Ask for a little more and let it clamp. */
const HISTORY_MONTHS = 16
/** Hard API ceiling per request. Anything larger is rejected. */
const PAGE_SIZE = 25_000
/** Guard so a runaway paginator cannot spin forever. Capped jobs are declared. */
const MAX_ROWS = 400_000

// ---------------------------------------------------------------------------
// Response validation
// ---------------------------------------------------------------------------

// ctr and position are absent on Discover and Google News rows: neither surface
// has a ranked position, so the API omits the fields entirely rather than
// sending zero. Requiring them here silently killed those pulls on the first
// run, which is why they are optional.
const rowSchema = z.object({
  keys: z.array(z.string()).optional(),
  clicks: z.number(),
  impressions: z.number(),
  ctr: z.number().optional(),
  position: z.number().optional(),
})

const responseSchema = z.object({
  rows: z.array(rowSchema).optional(),
  responseAggregationType: z.string().optional(),
})

type Row = z.infer<typeof rowSchema>

type SearchType = 'web' | 'image' | 'video' | 'news' | 'discover' | 'googleNews'
type DataState = 'final' | 'all'

interface Window {
  label: string
  startDate: string
  endDate: string
}

interface Job {
  name: string
  dimensions: string[]
  window: Window
  type: SearchType
  dataState: DataState
}

interface JobResult {
  name: string
  file: string
  dimensions: string[]
  type: SearchType
  dataState: DataState
  window: Window
  rowCount: number
  hitRowCap: boolean
  freshestDate: string | null
  requests: number
  ownership?: Record<string, number>
  error?: string
  skipped?: boolean
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`)
}

function argValue(name: string): string | null {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3) : null
}

function iso(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function addDays(isoDate: string, n: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return iso(d)
}

function daysBetween(a: string, b: string): number {
  const ms = new Date(`${b}T00:00:00Z`).getTime() - new Date(`${a}T00:00:00Z`).getTime()
  return Math.round(ms / 86_400_000)
}

/**
 * Which site a page URL belongs to. talent.cloudemployee.io is a separate,
 * still-live Webflow site that is not part of this migration; it shares the
 * domain property, so it shares this data.
 */
function ownerOf(url: string): 'ours' | 'talent' | 'other' {
  let host: string
  try {
    host = new URL(url).hostname.toLowerCase()
  } catch {
    return 'other'
  }
  if (host === 'talent.cloudemployee.io') return 'talent'
  if (host === 'cloudemployee.io' || host === 'www.cloudemployee.io') return 'ours'
  return 'other'
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const force = hasFlag('force')
  const only = argValue('only')

  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GSC_SERVICE_ACCOUNT_KEY_PATH,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  })
  const sc = google.searchconsole({ version: 'v1', auth })

  /** One page of results. Throws with the API message intact on failure. */
  async function queryPage(
    dimensions: string[],
    window: Window,
    type: SearchType,
    dataState: DataState,
    startRow: number,
  ): Promise<Row[]> {
    const res = await sc.searchanalytics.query({
      siteUrl: SITE,
      requestBody: {
        startDate: window.startDate,
        endDate: window.endDate,
        dimensions,
        type,
        dataState,
        rowLimit: PAGE_SIZE,
        startRow,
      },
    })
    const parsed = responseSchema.parse(res.data)
    return parsed.rows ?? []
  }

  // -- Establish the real window bounds from the data, not from the calendar --

  const today = iso(new Date())
  const historyStart = (() => {
    const d = new Date(`${today}T00:00:00Z`)
    d.setUTCMonth(d.getUTCMonth() - HISTORY_MONTHS)
    return iso(d)
  })()

  async function freshest(dataState: DataState): Promise<string | null> {
    const rows = await queryPage(['date'], { label: 'probe', startDate: addDays(today, -15), endDate: today }, 'web', dataState, 0)
    const dates = rows.map((r) => r.keys?.[0] ?? '').filter(Boolean).sort()
    return dates.length ? dates[dates.length - 1] : null
  }

  const freshFinal = await freshest('final')
  const freshAll = await freshest('all')
  const latest = freshAll ?? freshFinal
  if (!latest) throw new Error('No dated rows in the last 15 days; cannot establish a window.')

  const postDays = daysBetween(CUTOVER, latest) + 1
  const windows: Record<string, Window> = {
    full: { label: 'full-history', startDate: historyStart, endDate: latest },
    post: { label: 'post-cutover', startDate: CUTOVER, endDate: latest },
    pre: {
      label: 'pre-cutover-equivalent',
      startDate: addDays(CUTOVER, -postDays),
      endDate: addDays(CUTOVER, -1),
    },
  }

  console.log(`Property:        ${SITE}`)
  console.log(`Freshest final:  ${freshFinal ?? 'none'}`)
  console.log(`Freshest all:    ${freshAll ?? 'none'}`)
  console.log(`Full history:    ${windows.full.startDate} to ${windows.full.endDate}`)
  console.log(`Post-cutover:    ${windows.post.startDate} to ${windows.post.endDate} (${postDays} days)`)
  console.log(`Pre-equivalent:  ${windows.pre.startDate} to ${windows.pre.endDate} (${postDays} days)\n`)

  // -- Job matrix ------------------------------------------------------------

  const jobs: Job[] = []
  const add = (name: string, dimensions: string[], window: Window, type: SearchType = 'web', dataState: DataState = 'all'): void => {
    jobs.push({ name, dimensions, window, type, dataState })
  }

  // 1. Full history, every single dimension plus every pair the API permits.
  //    searchAppearance cannot be combined with other dimensions; it is pulled
  //    alone, and the attempt to pair it is recorded in the manifest.
  const singles = ['date', 'query', 'page', 'device', 'country', 'searchAppearance']
  for (const d of singles) add(`full-${d}`, [d], windows.full)

  const pairs: string[][] = [
    ['query', 'page'],
    ['page', 'country'],
    ['page', 'device'],
    ['query', 'device'],
    ['query', 'country'],
    ['date', 'device'],
    ['date', 'country'],
    ['date', 'page'],
  ]
  for (const p of pairs) add(`full-${p.join('-x-')}`, p, windows.full)

  // 2. The comparison that matters: identical dimensions either side of cutover.
  for (const w of [windows.post, windows.pre]) {
    for (const d of ['date', 'query', 'page', 'device', 'country']) {
      add(`${w.label}-${d}`, [d], w)
    }
    add(`${w.label}-query-x-page`, ['query', 'page'], w)
    add(`${w.label}-page-x-country`, ['page', 'country'], w)
    add(`${w.label}-page-x-device`, ['page', 'device'], w)
  }

  // 3. Search types beyond web. Most will be empty for a B2B site; an empty
  //    file is the finding, so they are still written.
  for (const t of ['image', 'video', 'news', 'discover', 'googleNews'] as SearchType[]) {
    add(`full-${t}-date`, ['date'], windows.full, t)
    add(`full-${t}-page`, ['page'], windows.full, t)
    add(`full-${t}-query`, ['query'], windows.full, t)
  }

  // 4. Probe: is searchAppearance combinable with another dimension? The UI
  //    forbids it. Rather than assume the API does too, we ask, and the answer
  //    (data or API error) is recorded in the manifest either way.
  add('full-searchAppearance-x-page', ['searchAppearance', 'page'], windows.full)
  add('full-searchAppearance-x-query', ['searchAppearance', 'query'], windows.full)

  // 5. A final-data-state mirror of the headline series, so the archive holds
  //    one series that will never be revised.
  add('full-date-final', ['date'], windows.full, 'web', 'final')

  // -- Run -------------------------------------------------------------------

  mkdirSync(OUT_DIR, { recursive: true })
  const results: JobResult[] = []

  for (const job of jobs) {
    const file = `${OUT_DIR}/${job.name}.json`
    const selected = !only || job.name.includes(only)

    // Resume, but never treat a failed job as done: a file written by a run
    // that errored is a placeholder, not a result, and must be re-attempted.
    if (existsSync(file) && !force && selected) {
      const prior = JSON.parse(readFileSync(file, 'utf8')) as JobResult & { rows?: Row[] }
      if (!prior.error) {
        const { rows: _rows, ...meta } = prior
        results.push({ ...meta, file, skipped: true })
        console.log(`skip  ${job.name} (${prior.rowCount} rows on disk)`)
        continue
      }
    }
    if (!selected) continue

    const rows: Row[] = []
    let requests = 0
    let hitRowCap = false
    let error: string | undefined

    try {
      for (;;) {
        const page = await queryPage(job.dimensions, job.window, job.type, job.dataState, rows.length)
        requests += 1
        rows.push(...page)
        if (page.length < PAGE_SIZE) break
        if (rows.length >= MAX_ROWS) {
          hitRowCap = true
          break
        }
      }
    } catch (err) {
      error = err instanceof Error ? err.message : String(err)
    }

    const dateIdx = job.dimensions.indexOf('date')
    const freshestDate =
      dateIdx === -1
        ? null
        : rows
            .map((r) => r.keys?.[dateIdx] ?? '')
            .filter(Boolean)
            .sort()
            .pop() ?? null

    const pageIdx = job.dimensions.indexOf('page')
    let ownership: Record<string, number> | undefined
    if (pageIdx !== -1) {
      ownership = { ours: 0, talent: 0, other: 0 }
      for (const r of rows) ownership[ownerOf(r.keys?.[pageIdx] ?? '')] += 1
    }

    const result: JobResult = {
      name: job.name,
      file,
      dimensions: job.dimensions,
      type: job.type,
      dataState: job.dataState,
      window: job.window,
      rowCount: rows.length,
      hitRowCap,
      freshestDate,
      requests,
      ownership,
      error,
    }
    results.push(result)

    writeFileSync(file, JSON.stringify({ site: SITE, ...result, rows }, null, 2))
    const flag = error ? `ERROR ${error.slice(0, 120)}` : hitRowCap ? 'CAPPED' : 'ok'
    console.log(`pull  ${job.name.padEnd(38)} ${String(rows.length).padStart(7)} rows  ${flag}`)
  }

  // -- Index coverage via the URL Inspection API -----------------------------
  //
  // Separate API, separate quota (roughly 2,000 URLs/day, 600/minute), and it
  // only answers for URLs inside the property. We inspect our own pages that
  // Search Console has impressions for, newest-window first. Progress is
  // checkpointed after every URL so a quota-exhausted run resumes where it
  // stopped instead of starting over.

  const inspectFile = `${OUT_DIR}/url-inspection.json`
  const inspectLimit = Number(argValue('inspect-limit') ?? 250)

  const inspectionSchema = z.object({
    inspectionResult: z.record(z.string(), z.unknown()).optional(),
  })

  interface InspectionRecord {
    url: string
    ok: boolean
    result?: unknown
    error?: string
  }

  const priorInspections: Record<string, InspectionRecord> = existsSync(inspectFile)
    ? (JSON.parse(readFileSync(inspectFile, 'utf8')) as { records: InspectionRecord[] }).records.reduce<
        Record<string, InspectionRecord>
      >((acc, r) => {
        acc[r.url] = r
        return acc
      }, {})
    : {}

  const pageFile = `${OUT_DIR}/full-page.json`
  let inspectTargets: string[] = []
  if (existsSync(pageFile)) {
    const pageRows = (JSON.parse(readFileSync(pageFile, 'utf8')) as { rows: Row[] }).rows
    inspectTargets = pageRows
      .filter((r) => ownerOf(r.keys?.[0] ?? '') === 'ours')
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, inspectLimit)
      .map((r) => r.keys?.[0] ?? '')
      .filter(Boolean)
  }

  let inspectSupported: boolean | null = null
  let inspectError: string | undefined
  for (const url of inspectTargets) {
    if (priorInspections[url]?.ok && !force) continue
    try {
      const res = await sc.urlInspection.index.inspect({
        requestBody: { siteUrl: SITE, inspectionUrl: url, languageCode: 'en-GB' },
      })
      const parsed = inspectionSchema.parse(res.data)
      priorInspections[url] = { url, ok: true, result: parsed.inspectionResult }
      inspectSupported = true
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      priorInspections[url] = { url, ok: false, error: message }
      if (inspectSupported === null) {
        inspectSupported = false
        inspectError = message
      }
      // A permission or quota failure will repeat for every URL; stop early
      // rather than burning the rest of the list on the same error.
      if (/permission|quota|rate|403|429/i.test(message)) {
        inspectError = message
        break
      }
    }
    writeFileSync(
      inspectFile,
      JSON.stringify({ site: SITE, inspected: Object.values(priorInspections) .length, records: Object.values(priorInspections) }, null, 2),
    )
  }
  if (inspectTargets.length) {
    writeFileSync(
      inspectFile,
      JSON.stringify({ site: SITE, inspected: Object.values(priorInspections).length, records: Object.values(priorInspections) }, null, 2),
    )
  }
  const inspectOk = Object.values(priorInspections).filter((r) => r.ok).length
  const inspectFailed = Object.values(priorInspections).filter((r) => !r.ok).length
  console.log(`\nURL Inspection: ${inspectOk} ok, ${inspectFailed} failed, of ${inspectTargets.length} targeted`)

  // -- Manifest --------------------------------------------------------------

  const lines: string[] = []
  lines.push('# MANIFEST - Search Console deep pull (Task C)')
  lines.push('')
  lines.push(`Property: \`${SITE}\` (DOMAIN property: spans www, non-www, http, https and every subdomain)`)
  lines.push(`Pulled: ${today}`)
  lines.push('Script: `scripts/seo/gsc-deep-pull.ts` (re-runnable; resume by default, `--force`, `--only=`)')
  lines.push('')
  lines.push('## Data freshness')
  lines.push('')
  lines.push(`- Freshest date with FINAL data: **${freshFinal ?? 'none'}**`)
  lines.push(`- Freshest date with ANY data (\`dataState=all\`, includes unfinalised): **${freshAll ?? 'none'}**`)
  lines.push(`- Every job below uses \`dataState=all\` unless its name ends \`-final\`.`)
  lines.push('')
  lines.push('## Post-cutover window')
  lines.push('')
  lines.push(`- Cutover: **${CUTOVER}**. Latest data: **${latest}**.`)
  lines.push(`- Post-cutover data that actually exists: **${postDays} day(s)**.`)
  lines.push(`- Matched pre-cutover window: ${windows.pre.startDate} to ${windows.pre.endDate} (${postDays} days).`)
  lines.push(
    `- ${postDays} days is not a verdict. Search Console lags 2-3 days and the newest days are unfinalised, so the post window is both short and partly provisional. It is a smoke test for catastrophe, not a measurement of migration outcome.`,
  )
  lines.push('')
  lines.push('## talent.cloudemployee.io')
  lines.push('')
  lines.push(
    'The domain property includes `talent.cloudemployee.io`, a SEPARATE Webflow site that was not migrated and is not ours. Its rows are deliberately NOT filtered out. Every job carrying a `page` dimension records an `ownership` split (`ours` / `talent` / `other`) counting rows per host, and `ownerOf()` in the script is the same classifier for downstream use.',
  )
  lines.push('')
  lines.push('## Files')
  lines.push('')
  lines.push('| File | Dimensions | Type | Date range | Rows | Row cap hit | Freshest date | ours/talent/other |')
  lines.push('|---|---|---|---|---|---|---|---|')
  for (const r of results) {
    const own = r.ownership ? `${r.ownership.ours}/${r.ownership.talent}/${r.ownership.other}` : '-'
    const cap = r.error ? `ERROR` : r.hitRowCap ? '**YES**' : 'no'
    lines.push(
      `| \`${r.name}.json\` | ${r.dimensions.join(' x ')} | ${r.type} | ${r.window.startDate} to ${r.window.endDate} | ${r.rowCount} | ${cap} | ${r.freshestDate ?? '-'} | ${own} |`,
    )
  }
  lines.push('')

  const capped = results.filter((r) => r.hitRowCap)
  const errored = results.filter((r) => r.error)
  lines.push('## Row caps')
  lines.push('')
  lines.push(
    capped.length
      ? capped.map((r) => `- \`${r.name}\`: stopped at ${r.rowCount} rows (MAX_ROWS guard). NOT complete.`).join('\n')
      : 'None. Every job paginated to exhaustion: the final request returned fewer than 25,000 rows.',
  )
  lines.push('')
  lines.push('## Errors and API limits')
  lines.push('')
  lines.push(
    errored.length
      ? errored.map((r) => `- \`${r.name}\`: ${r.error}`).join('\n')
      : 'None.',
  )
  lines.push('')
  lines.push('## Index coverage / URL Inspection')
  lines.push('')
  if (!inspectTargets.length) {
    lines.push('Not attempted: `full-page.json` was not on disk when this run reached the inspection pass.')
  } else if (inspectSupported === false && inspectOk === 0) {
    lines.push(`**The URL Inspection API does NOT serve this property for these credentials.** First error, unmodified: \`${inspectError}\``)
    lines.push('')
    lines.push('Consequence: there is no API route to index-coverage state (indexed / crawled-not-indexed / discovered-not-indexed, canonical Google chose, last crawl time, robots verdict, mobile usability). That data exists only in the Search Console UI for this property and would have to be read or exported by hand.')
  } else {
    lines.push(`\`url-inspection.json\`: ${inspectOk} URLs inspected successfully, ${inspectFailed} failed, out of the top ${inspectTargets.length} of OUR pages by impressions over the full window (\`--inspect-limit\` to change; talent and other hosts excluded, they are not ours to inspect).`)
    lines.push('')
    lines.push('Each record holds the raw `inspectionResult`: `indexStatusResult` (verdict, coverage state, Google-selected canonical vs declared canonical, crawl time, robots and indexing state), plus `mobileUsabilityResult` / `richResultsResult` where Google returns them.')
    if (inspectError) lines.push(`\nRun stopped early on: \`${inspectError}\`. The URL Inspection quota is roughly 2,000 URLs/day; re-run tomorrow and it resumes from the last completed URL.`)
  }
  lines.push('')
  lines.push('## Dimensions and combinations the API refused')
  lines.push('')
  lines.push('Recorded from the actual API response, not assumed. Any job above showing ERROR is a refusal; the message is verbatim in the errors section.')
  lines.push('')

  writeFileSync(MANIFEST, lines.join('\n'))
  console.log(`\nManifest: ${MANIFEST}`)
}

main().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})

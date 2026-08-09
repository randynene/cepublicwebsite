import 'dotenv/config'

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'

import { z } from 'zod'

// Weekly Ahrefs Brand Radar pull for cloudemployee.io.
//
// Brand Radar is the AEO progress metric: multi-engine AI brand mentions across
// a fixed set of buyer-intent prompts. The day-one baseline (7 Aug 2026) was
// Toptal 7, Turing 6, arc 6, BairesDev 6, Cloud Employee 0 across 10 prompts on
// ChatGPT / Gemini / Perplexity / Google AI Overviews. It is the only instrument
// we have for AI visibility outside Bing / Copilot (authority.md AUTH-08). This
// script turns the manual pickup into a repeatable weekly pull.
//
// WHY THIS IS FREE, AND HOW TO KEEP IT FREE.
// The endpoint bills per the `prompts` parameter: requests returning ONLY custom
// prompt data are 0 units; requests that include Ahrefs prompt data are billed at
// standard rates. So this script hard-codes prompts=custom and drives everything
// else from a saved Brand Radar report (which holds the 10 custom prompts, the
// brand, the competitors, the market and the country). The Ahrefs unit pool is
// per WORKSPACE and is exhausted until 17 Aug 2026, so a pull that silently
// started spending would starve every other Ahrefs job. This script therefore
// reads the workspace unit balance before and after every request and logs the
// delta even when it is 0; a non-zero total is treated as a loud failure.
//
// METHOD IS GET, NOT POST. EXECUTION_SESSIONS.md and the roadmap say
// "POST /v3/brand-radar/mentions-overview"; the live API is GET (POST is the
// history variant). This script uses GET. Noted so the next reader is not
// surprised by the divergence from the brief.
//
// COLUMNS ARE NOT GUESSED BLINDLY. Ahrefs v3 exposes different `select` columns
// per plan (CLAUDE.md Tech Debt #4). The default select below is a best effort
// pending the first live run; if it is wrong the API returns an "available
// columns" error, which this script surfaces verbatim and exits non-zero rather
// than writing an empty file. Run with --probe to discover the real column ids
// on demand, then pass --select=... or update DEFAULT_SELECT.
//
// Run:
//   npx tsx scripts/seo/brand-radar-pull.ts --dry-run    # no key needed, prints the exact requests
//   npx tsx scripts/seo/brand-radar-pull.ts --probe      # discover valid select columns (needs key)
//   npx tsx scripts/seo/brand-radar-pull.ts              # the weekly pull (needs key + report id)
//   npx tsx scripts/seo/brand-radar-pull.ts --force      # re-pull and overwrite today's banked files
//
// Output: audit-output/seo-intel/<DATE>/brand-radar/  (gitignored, like every pull)

const API = 'https://api.ahrefs.com/v3'
const OUT_ROOT = 'audit-output/seo-intel'

/**
 * prompts=custom is the whole reason this pull is free. Do not change it to
 * `ahrefs` or `both` without accepting that the request starts spending units.
 */
const PROMPTS = 'custom'

/**
 * The chatbots to measure. Google models (google_ai_overviews, google_ai_mode)
 * cannot be combined with each other or with non-Google models in one request,
 * so this script issues one request PER engine. That also gives a clean
 * per-engine breakdown, and every request stays 0 units. Override with
 * --engines=chatgpt,perplexity.
 */
const DEFAULT_ENGINES = ['chatgpt', 'perplexity', 'gemini', 'google_ai_overviews']

/**
 * Best-effort column set for the mentions overview, pending confirmation on the
 * first live run (see the header note on Tech Debt #4). The overview aggregates
 * mention counts per brand, so a brand identifier plus its mention count is the
 * minimum useful shape. If the API rejects these, it returns the valid column
 * ids in the error body; re-run with --select=... using those.
 */
const DEFAULT_SELECT = 'brand,brand_mentions'

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const argv = process.argv.slice(2)
const hasFlag = (name: string): boolean => argv.includes(`--${name}`)
const argValue = (name: string): string | undefined =>
  argv.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=')

const DRY_RUN = hasFlag('dry-run')
const PROBE = hasFlag('probe')
const FORCE = hasFlag('force')

const DAYS = ((): number => {
  const raw = argValue('days')
  const n = raw === undefined ? Number.NaN : Number(raw)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 7
})()

const SELECT = argValue('select') ?? DEFAULT_SELECT
const ENGINES = (argValue('engines') ?? DEFAULT_ENGINES.join(','))
  .split(',')
  .map((e) => e.trim())
  .filter(Boolean)

function isoDaysAgo(n: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - n)
  return d.toISOString().slice(0, 10)
}

const TODAY = new Date().toISOString().slice(0, 10)
const DATE_TO = argValue('to') ?? TODAY
const DATE_FROM = argValue('from') ?? isoDaysAgo(DAYS)

const OUT_DIR = `${OUT_ROOT}/${TODAY}/brand-radar`

// ---------------------------------------------------------------------------
// Config that is CE-specific: comes from env, never hard-coded in logic.
// ---------------------------------------------------------------------------

/**
 * The saved Brand Radar report. It carries the brand, the competitors, the 10
 * custom prompts, the market and the country, so the request needs no
 * CE-specific values inlined here. Required for prompts=custom (and therefore
 * for the free pull). Set AHREFS_BRAND_RADAR_REPORT_ID in .env.
 */
function reportId(): string {
  const id = process.env.AHREFS_BRAND_RADAR_REPORT_ID
  if (!id) {
    throw new Error(
      'AHREFS_BRAND_RADAR_REPORT_ID is not set. It is the saved Brand Radar report\n' +
        'that holds the 10 custom prompts, the brand and the competitors, and it is\n' +
        'required for prompts=custom (the free pull). Set it in .env at the repo root.',
    )
  }
  return id
}

function apiKey(): string {
  const key = process.env.AHREFS_API_KEY
  if (!key) throw new Error('AHREFS_API_KEY is not set. Add it to .env at the repo root.')
  return key
}

// ---------------------------------------------------------------------------
// Transport + unit accounting
// ---------------------------------------------------------------------------

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

/** Build the query string for one engine's mentions-overview request. */
function overviewParams(engine: string): Record<string, string> {
  return {
    report_id: DRY_RUN && !process.env.AHREFS_BRAND_RADAR_REPORT_ID
      ? '<AHREFS_BRAND_RADAR_REPORT_ID unset>'
      : reportId(),
    prompts: PROMPTS,
    data_source: engine,
    date_from: DATE_FROM,
    date_to: DATE_TO,
    select: SELECT,
  }
}

function urlFor(path: string, params: Record<string, string>): string {
  return `${API}/${path}?${new URLSearchParams(params)}`
}

/**
 * GET a JSON body. Throws on any non-2xx (auth, bad columns, quota) with the
 * response body included, so an error is never swallowed into an empty file.
 * One light retry on 429 / 5xx, matching the sibling pull scripts.
 */
async function getJson(path: string, params: Record<string, string>): Promise<Record<string, unknown>> {
  const url = urlFor(path, params)
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey()}` } })
    if (res.ok) return (await res.json()) as Record<string, unknown>
    const body = (await res.text()).slice(0, 600)
    if (res.status !== 429 && res.status < 500) {
      throw new Error(`${path}: HTTP ${res.status} - ${body}`)
    }
    await sleep(2000 * 2 ** attempt)
  }
  throw new Error(`${path}: retries exhausted`)
}

const limitsSchema = z.object({
  limits_and_usage: z.object({
    subscription: z.string(),
    units_limit_workspace: z.number().nullable(),
    units_usage_workspace: z.number(),
  }),
})

/**
 * Workspace units remaining. This call is free metadata. Returns +Infinity when
 * the plan reports no workspace limit, so budget maths still works.
 */
async function unitsRemaining(): Promise<number> {
  const body = await getJson('subscription-info/limits-and-usage', {})
  const parsed = limitsSchema.parse(body).limits_and_usage
  return parsed.units_limit_workspace === null
    ? Number.POSITIVE_INFINITY
    : parsed.units_limit_workspace - parsed.units_usage_workspace
}

// ---------------------------------------------------------------------------
// Response handling
// ---------------------------------------------------------------------------

/** Pull the row array out of a v3 body, tolerating column-name variation. */
function rowsOf(body: Record<string, unknown>): Record<string, unknown>[] {
  const arr = Object.values(body).find(Array.isArray)
  if (Array.isArray(arr)) return arr as Record<string, unknown>[]
  // Some overview shapes return a single metrics object rather than an array.
  return [body]
}

interface EngineResult {
  engine: string
  rows: Record<string, unknown>[]
  unitCost: number
  cached: boolean
}

function rawFile(engine: string): string {
  return `${OUT_DIR}/mentions-overview-${engine}.json`
}

/** Resume guard: an already-banked file for today is not silently re-pulled. */
function alreadyBanked(engine: string): Record<string, unknown>[] | null {
  if (FORCE || !existsSync(rawFile(engine))) return null
  const parsed: unknown = JSON.parse(readFileSync(rawFile(engine), 'utf8'))
  const rows = (parsed as { rows?: unknown }).rows
  return Array.isArray(rows) ? (rows as Record<string, unknown>[]) : []
}

// ---------------------------------------------------------------------------
// Markdown summary
// ---------------------------------------------------------------------------

function stringify(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

/** Render rows as a markdown table, schema-agnostically (union of all keys). */
function rowsTable(rows: Record<string, unknown>[]): string[] {
  if (rows.length === 0) return ['_No rows returned._']
  const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))]
  const lines = [`| ${cols.join(' | ')} |`, `| ${cols.map(() => '---').join(' | ')} |`]
  for (const r of rows) {
    lines.push(`| ${cols.map((c) => stringify(r[c]).replace(/\|/g, '\\|')).join(' | ')} |`)
  }
  return lines
}

function writeSummary(results: EngineResult[], totalCost: number): void {
  const reportLabel = process.env.AHREFS_BRAND_RADAR_REPORT_ID ?? '(unset)'
  const lines: string[] = [
    '# Brand Radar - weekly mentions overview',
    '',
    `Pulled: ${TODAY}`,
    `Window: ${DATE_FROM} to ${DATE_TO}`,
    `Report: ${reportLabel}`,
    `Prompts: ${PROMPTS} (custom-only keeps this a 0-unit pull)`,
    `Engines: ${results.map((r) => r.engine).join(', ')}`,
    `Select: \`${SELECT}\``,
    '',
    'Context: the AEO progress metric (authority.md AUTH-08). Day-one baseline',
    '7 Aug 2026 across 10 buyer prompts was Toptal 7, Turing 6, arc 6, BairesDev 6,',
    'Cloud Employee 0. Re-run weekly; each run banks into its own dated folder.',
    '',
    '## Unit cost',
    '',
    '| Engine | Units this request | Source |',
    '| --- | --- | --- |',
  ]
  for (const r of results) {
    lines.push(`| ${r.engine} | ${r.unitCost}${r.cached ? ' (cached)' : ''} | ${r.cached ? 'banked earlier' : 'live pull'} |`)
  }
  lines.push(
    `| **total** | **${totalCost}** | expected 0 for prompts=custom |`,
    '',
    '## Mentions by engine',
    '',
  )
  for (const r of results) {
    lines.push(`### ${r.engine}`, '', ...rowsTable(r.rows), '')
  }
  writeFileSync(`${OUT_DIR}/SUMMARY.md`, lines.join('\n') + '\n')
}

// ---------------------------------------------------------------------------
// Modes
// ---------------------------------------------------------------------------

function runDryRun(): void {
  console.log('DRY RUN - no network calls, no credentials required.\n')
  console.log(`Method:  GET`)
  console.log(`Headers: Authorization: Bearer <AHREFS_API_KEY>`)
  console.log(`Output:  ${OUT_DIR}/ (per engine + SUMMARY.md)`)
  console.log(`Window:  ${DATE_FROM} to ${DATE_TO}\n`)
  for (const engine of ENGINES) {
    console.log(`-- ${engine}`)
    console.log(`   ${urlFor('brand-radar/mentions-overview', overviewParams(engine))}\n`)
  }
  console.log('Unit accounting each live request is bracketed by a free')
  console.log('subscription-info/limits-and-usage read; total must stay 0 for prompts=custom.')
}

async function runProbe(): Promise<void> {
  // Deliberately send an invalid column so the API answers with the list of
  // columns this plan actually exposes (the Tech Debt #4 discovery method).
  console.log('PROBE - sending an invalid select to read the available-columns error.\n')
  const params = { ...overviewParams(ENGINES[0]), select: '__invalid_probe_column__' }
  console.log(`GET ${urlFor('brand-radar/mentions-overview', params)}\n`)
  try {
    const body = await getJson('brand-radar/mentions-overview', params)
    console.log('Unexpected: the probe select was accepted. Body:')
    console.log(JSON.stringify(body, null, 2).slice(0, 2000))
  } catch (err) {
    console.log('Error body (read the valid column ids from here):\n')
    console.log(err instanceof Error ? err.message : String(err))
  }
}

async function runPull(): Promise<void> {
  // Validate credentials BEFORE creating any file, so a missing key exits
  // non-zero without leaving an empty result behind.
  apiKey()
  reportId()

  mkdirSync(OUT_DIR, { recursive: true })
  console.log(`Brand Radar pull (${TODAY}), window ${DATE_FROM} to ${DATE_TO}`)

  const before = await unitsRemaining()
  console.log(`Workspace units remaining: ${before}\n`)

  const results: EngineResult[] = []
  let totalCost = 0

  for (const engine of ENGINES) {
    const banked = alreadyBanked(engine)
    if (banked !== null) {
      console.log(`   ${engine}: cached (${banked.length} rows) - use --force to re-pull`)
      results.push({ engine, rows: banked, unitCost: 0, cached: true })
      continue
    }

    const unitsBefore = await unitsRemaining()
    const body = await getJson('brand-radar/mentions-overview', overviewParams(engine))
    const unitsAfter = await unitsRemaining()

    const cost = Number.isFinite(unitsBefore) && Number.isFinite(unitsAfter) ? unitsBefore - unitsAfter : 0
    totalCost += cost
    const rows = rowsOf(body)

    writeFileSync(
      rawFile(engine),
      JSON.stringify(
        { engine, report_id: reportId(), prompts: PROMPTS, date_from: DATE_FROM, date_to: DATE_TO, select: SELECT, rows },
        null,
        2,
      ),
    )
    console.log(`   ${engine}: ${rows.length} rows, ${cost} units`)
    results.push({ engine, rows, unitCost: cost, cached: false })
  }

  const after = await unitsRemaining()
  const runCost = Number.isFinite(before) && Number.isFinite(after) ? before - after : totalCost
  writeSummary(results, runCost)

  console.log(`\nWritten to ${OUT_DIR}/`)
  console.log(`Units used this run: ${runCost} (expected 0 for prompts=custom)`)

  if (runCost > 0) {
    // A plan change has silently started charging for what was a free pull.
    // Fail loud rather than let quota drain unnoticed.
    console.error(
      `\nWARNING: this pull cost ${runCost} units. prompts=custom is supposed to be free.\n` +
        `The Ahrefs plan or endpoint pricing has changed; investigate before the next run.`,
    )
    process.exit(1)
  }
}

// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  if (DRY_RUN) {
    runDryRun()
    return
  }
  if (PROBE) {
    await runProbe()
    return
  }
  await runPull()
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})

import 'dotenv/config'

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'

// DataForSEO pull — the three signals neither Search Console nor Ahrefs gives us.
//
// SEO_PROGRAMME.md §5.2 item 3. Search Console tells us where we rank; Ahrefs
// tells us who links to us. Neither tells us what the result page around us
// actually LOOKS like, and that is what decides whether a position-4 ranking
// earns a click or gets buried under an AI Overview, a video carousel and four
// ads. This script covers exactly that gap:
//
//   1. serp-features    — which SERP elements occupy each of our keywords
//   2. ai-overview      — whether an AI Overview fires, and whether we are cited
//   3. competitor-gap   — keywords toptal/turing/andela rank for and we do not
//
// On the AI Overview question specifically: DataForSEO only returns the element
// on the `advanced` SERP endpoint, never on `regular`. The `regular` endpoint
// will happily return 200 with no ai_overview item and look like a clean
// negative, which is the failure mode this script exists to avoid.
//
// Auth is HTTP Basic, login:password base64-encoded, matching the working
// integration in ce-sales-brain/apps/enrichment (same two env var names, so the
// credentials are interchangeable between projects).
//
// COST. Live SERP is billed per request, roughly $0.002-0.003 each. Defaults
// here are deliberately small. Nothing bills until you pass --serp or --gap;
// a bare run only validates credentials, which is free.
//
// Run:
//   npx tsx scripts/seo/dataforseo-pull.ts                 # credential check only, free
//   npx tsx scripts/seo/dataforseo-pull.ts --serp          # top 25 keywords
//   npx tsx scripts/seo/dataforseo-pull.ts --serp --limit 100
//   npx tsx scripts/seo/dataforseo-pull.ts --gap           # competitor gap
//   npx tsx scripts/seo/dataforseo-pull.ts --serp --gap    # everything
//
// Output: audit-output/seo-intel/<date>/dataforseo-*.json

const BASE = 'https://api.dataforseo.com'
const OUT_ROOT = 'audit-output/seo-intel'
const IN_DIR = 'audit-output/seo-post-launch'

const OUR_DOMAIN = 'cloudemployee.io'
const COMPETITORS = ['toptal.com', 'turing.com', 'andela.com']

/** Where the money goes. Live advanced SERP, US desktop. */
const LOCATION_CODE = 2840 // United States
const LANGUAGE_CODE = 'en'

/** Rough per-request cost, for the running total printed at the end. */
const COST_PER_SERP = 0.003
const COST_PER_LABS = 0.02

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const argv = process.argv.slice(2)
const has = (flag: string) => argv.includes(flag)
const num = (flag: string, fallback: number) => {
  const i = argv.indexOf(flag)
  if (i === -1) return fallback
  const v = Number(argv[i + 1])
  return Number.isFinite(v) && v > 0 ? v : fallback
}

const DO_SERP = has('--serp')
const DO_GAP = has('--gap')
const SERP_LIMIT = num('--limit', 25)

const TODAY = new Date().toISOString().slice(0, 10)
const OUT_DIR = `${OUT_ROOT}/${TODAY}`

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

function auth(): string {
  const login = process.env.DATAFORSEO_LOGIN
  const password = process.env.DATAFORSEO_PASSWORD
  if (!login || !password) {
    throw new Error(
      'DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD must be set in .env at the repo root.\n' +
        'They are the API credentials from https://app.dataforseo.com/api-access,\n' +
        'NOT the email and password you log into the dashboard with.',
    )
  }
  return Buffer.from(`${login}:${password}`).toString('base64')
}

interface DfsEnvelope<T> {
  status_code?: number
  status_message?: string
  tasks?: Array<{
    status_code?: number
    status_message?: string
    result?: T[] | null
  }>
}

/**
 * POST a DataForSEO task array and return the first task's result rows.
 *
 * DataForSEO returns HTTP 200 with a non-20000 status_code for most real
 * failures (bad credentials, insufficient funds, malformed task), so checking
 * res.ok alone silently produces empty output. Both layers get checked here:
 * the envelope AND the per-task code.
 */
async function post<T>(path: string, task: Record<string, unknown>, label: string): Promise<T[]> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([task]),
    signal: AbortSignal.timeout(120_000), // live SERP can genuinely take 20-40s
  })

  if (!res.ok) {
    throw new Error(`${label}: HTTP ${res.status} — ${(await res.text()).slice(0, 200)}`)
  }

  const json = (await res.json()) as DfsEnvelope<T>

  if (json.status_code !== 20000) {
    throw new Error(`${label}: API status ${json.status_code} — ${json.status_message}`)
  }

  const t = json.tasks?.[0]
  if (!t) throw new Error(`${label}: response contained no task`)
  if (t.status_code !== 20000) {
    // 40402 = insufficient funds, 40100 = auth. Worth surfacing verbatim.
    throw new Error(`${label}: task status ${t.status_code} — ${t.status_message}`)
  }

  return t.result ?? []
}

// ---------------------------------------------------------------------------
// Keyword seeding
// ---------------------------------------------------------------------------

interface Seed {
  keyword: string
  source: string
  /** Search Console position, where we have one. */
  position?: number
  volume?: number
}

function readJson<T>(path: string): T | null {
  if (!existsSync(path)) return null
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T
  } catch {
    return null
  }
}

/**
 * Seed the SERP sweep from what we already know we rank for, rather than a
 * hand-written keyword list that would go stale the moment content changes.
 *
 * Ahrefs first (it carries volume, which is what makes a keyword worth the
 * request), Search Console second for anything Ahrefs missed. Brand terms are
 * dropped: we already own position 1-2 for "cloud employee" and a SERP feature
 * audit of our own brand name tells us nothing actionable.
 */
function seedKeywords(limit: number): Seed[] {
  const seeds = new Map<string, Seed>()

  const ahrefs = readJson<Array<{ keyword?: string; volume?: number; best_position?: number }>>(
    `${IN_DIR}/ahrefs-organic-keywords.json`,
  )
  for (const r of ahrefs ?? []) {
    if (!r.keyword) continue
    seeds.set(r.keyword.toLowerCase(), {
      keyword: r.keyword,
      source: 'ahrefs',
      volume: r.volume,
      position: r.best_position,
    })
  }

  const gsc = readJson<{ rows?: Array<{ keys?: string[]; position?: number }> }>(
    `${IN_DIR}/gsc-queries.json`,
  )
  for (const r of gsc?.rows ?? []) {
    const kw = r.keys?.[0]
    if (!kw) continue
    const key = kw.toLowerCase()
    if (seeds.has(key)) continue
    seeds.set(key, { keyword: kw, source: 'gsc', position: r.position })
  }

  const BRAND = /cloud\s*employee/i
  const ranked = [...seeds.values()]
    .filter((s) => !BRAND.test(s.keyword))
    .sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0))

  if (ranked.length === 0) {
    throw new Error(
      `No keyword seeds found. Run these first:\n` +
        `  npx tsx scripts/seo/ahrefs-pull.ts\n` +
        `  npx tsx scripts/seo/gsc-pull.ts --days 90`,
    )
  }

  return ranked.slice(0, limit)
}

// ---------------------------------------------------------------------------
// 1 + 2. SERP features and AI Overview
// ---------------------------------------------------------------------------

interface SerpItem {
  type?: string
  rank_absolute?: number
  domain?: string
  url?: string
  title?: string
  /** AI Overview carries its sources in a nested references array. */
  references?: Array<{ domain?: string; url?: string; title?: string }>
  items?: SerpItem[]
}

interface SerpResult {
  keyword?: string
  se_results_count?: number
  item_types?: string[]
  items?: SerpItem[]
}

interface SerpRow {
  keyword: string
  source: string
  volume: number | null
  known_position: number | null
  /** Every distinct SERP element type present, in order of appearance. */
  item_types: string[]
  ai_overview_present: boolean
  /** True only if cloudemployee.io is cited inside the AI Overview itself. */
  ai_overview_cites_us: boolean
  ai_overview_sources: string[]
  our_organic_rank: number | null
  our_organic_url: string | null
  competitor_ranks: Record<string, number | null>
  organic_top10: Array<{ rank: number; domain: string; url: string }>
}

function domainOf(item: SerpItem): string {
  if (item.domain) return item.domain.replace(/^www\./, '')
  try {
    return new URL(item.url ?? '').hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

/** Walk nested SERP items (AI Overview and carousels nest their children). */
function flatten(items: SerpItem[] | undefined): SerpItem[] {
  const out: SerpItem[] = []
  for (const it of items ?? []) {
    out.push(it)
    if (it.items?.length) out.push(...flatten(it.items))
  }
  return out
}

async function pullSerp(seed: Seed): Promise<SerpRow> {
  const results = await post<SerpResult>(
    // `advanced`, NOT `regular`. The regular endpoint omits ai_overview
    // entirely and would report a clean false negative on every keyword.
    '/v3/serp/google/organic/live/advanced',
    {
      keyword: seed.keyword,
      location_code: LOCATION_CODE,
      language_code: LANGUAGE_CODE,
      device: 'desktop',
      os: 'windows',
      depth: 100,
      load_async_ai_overview: true,
    },
    `serp:${seed.keyword}`,
  )

  const r = results[0] ?? {}
  const all = flatten(r.items)

  const aio = all.find((i) => i.type === 'ai_overview')
  const aioSources = [...new Set((aio?.references ?? []).map((x) => (x.domain ?? '').replace(/^www\./, '')).filter(Boolean))]

  const organic = all.filter((i) => i.type === 'organic')
  const ours = organic.find((i) => domainOf(i).endsWith(OUR_DOMAIN))

  const competitor_ranks: Record<string, number | null> = {}
  for (const c of COMPETITORS) {
    const hit = organic.find((i) => domainOf(i).endsWith(c))
    competitor_ranks[c] = hit?.rank_absolute ?? null
  }

  return {
    keyword: seed.keyword,
    source: seed.source,
    volume: seed.volume ?? null,
    known_position: seed.position ?? null,
    item_types: r.item_types ?? [],
    ai_overview_present: Boolean(aio),
    ai_overview_cites_us: aioSources.some((d) => d.endsWith(OUR_DOMAIN)),
    ai_overview_sources: aioSources,
    our_organic_rank: ours?.rank_absolute ?? null,
    our_organic_url: ours?.url ?? null,
    competitor_ranks,
    organic_top10: organic
      .filter((i) => (i.rank_absolute ?? 999) <= 10)
      .map((i) => ({ rank: i.rank_absolute ?? 0, domain: domainOf(i), url: i.url ?? '' })),
  }
}

// ---------------------------------------------------------------------------
// 3. Competitor keyword gap
// ---------------------------------------------------------------------------

interface RankedKeyword {
  keyword_data?: {
    keyword?: string
    keyword_info?: { search_volume?: number; competition?: number }
  }
  ranked_serp_element?: {
    serp_item?: { rank_absolute?: number; url?: string }
  }
}

interface RankedResult {
  items?: RankedKeyword[]
}

/**
 * DataForSEO Labs has no single "keyword gap" endpoint that means what people
 * mean by the phrase. `domain_intersection` returns keywords BOTH domains rank
 * for, which is the opposite of a gap. So the gap is computed here: pull each
 * domain's ranked keywords, then subtract ours.
 *
 * This also keeps the definition of "gap" explicit and auditable rather than
 * hidden inside a vendor endpoint whose semantics we would be guessing at.
 */
async function pullRanked(domain: string, limit: number): Promise<Map<string, { volume: number; rank: number; url: string }>> {
  const results = await post<RankedResult>(
    '/v3/dataforseo_labs/google/ranked_keywords/live',
    {
      target: domain,
      location_code: LOCATION_CODE,
      language_code: LANGUAGE_CODE,
      limit,
      order_by: ['keyword_data.keyword_info.search_volume,desc'],
      filters: [['ranked_serp_element.serp_item.rank_absolute', '<=', 20]],
    },
    `ranked:${domain}`,
  )

  const map = new Map<string, { volume: number; rank: number; url: string }>()
  for (const item of results[0]?.items ?? []) {
    const kw = item.keyword_data?.keyword
    if (!kw) continue
    map.set(kw.toLowerCase(), {
      volume: item.keyword_data?.keyword_info?.search_volume ?? 0,
      rank: item.ranked_serp_element?.serp_item?.rank_absolute ?? 99,
      url: item.ranked_serp_element?.serp_item?.url ?? '',
    })
  }
  return map
}

interface GapRow {
  keyword: string
  volume: number
  /** Which competitors rank top-20, and where. */
  competitors: Record<string, { rank: number; url: string }>
  best_competitor_rank: number
  /** How many of the three rank for it. 3 = the whole category owns it, we do not. */
  competitor_count: number
}

async function pullGap(limit: number) {
  console.log(`\n── competitor gap: pulling ranked keywords (top 20, limit ${limit}/domain)`)

  const ours = await pullRanked(OUR_DOMAIN, limit)
  console.log(`   ${OUR_DOMAIN.padEnd(18)} ${String(ours.size).padStart(5)} keywords in top 20`)

  const theirs: Record<string, Map<string, { volume: number; rank: number; url: string }>> = {}
  for (const c of COMPETITORS) {
    theirs[c] = await pullRanked(c, limit)
    console.log(`   ${c.padEnd(18)} ${String(theirs[c].size).padStart(5)} keywords in top 20`)
  }

  const gap = new Map<string, GapRow>()
  for (const c of COMPETITORS) {
    for (const [kw, data] of theirs[c]) {
      if (ours.has(kw)) continue // not a gap, we already rank
      const row = gap.get(kw) ?? {
        keyword: kw,
        volume: data.volume,
        competitors: {},
        best_competitor_rank: 99,
        competitor_count: 0,
      }
      row.competitors[c] = { rank: data.rank, url: data.url }
      row.best_competitor_rank = Math.min(row.best_competitor_rank, data.rank)
      row.competitor_count = Object.keys(row.competitors).length
      row.volume = Math.max(row.volume, data.volume)
      gap.set(kw, row)
    }
  }

  // Rank by how many competitors validate the term, then by volume. A keyword
  // all three rank for is a proven category term, not a lucky one-off.
  const rows = [...gap.values()].sort(
    (a, b) => b.competitor_count - a.competitor_count || b.volume - a.volume,
  )

  writeFileSync(`${OUT_DIR}/dataforseo-competitor-gap.json`, JSON.stringify(rows, null, 2))
  console.log(`\n   ${rows.length} gap keywords (they rank top-20, we do not)`)
  for (const r of rows.slice(0, 25)) {
    console.log(
      `   vol ${String(r.volume).padStart(7)}  ${r.competitor_count}/3 rivals  best pos ${String(r.best_competitor_rank).padStart(2)}  ${r.keyword}`,
    )
  }
  if (rows.length > 25) console.log(`   ... and ${rows.length - 25} more (see JSON)`)

  return rows.length
}

// ---------------------------------------------------------------------------
// Credential check — free, and the thing to run first
// ---------------------------------------------------------------------------

async function checkCredentials(): Promise<boolean> {
  try {
    const rows = await post<Record<string, unknown>>('/v3/appendix/user_data', {}, 'user_data')
    const money = (rows[0] as { money?: { balance?: number } } | undefined)?.money
    console.log('Credentials OK.')
    if (typeof money?.balance === 'number') {
      console.log(`Account balance: $${money.balance.toFixed(2)}`)
      if (money.balance < 1) {
        console.log('WARNING: balance under $1. Live SERP calls will fail with task status 40402.')
      }
    }
    return true
  } catch (err) {
    console.error(`Credential check FAILED.\n${(err as Error).message}`)
    return false
  }
}

// ---------------------------------------------------------------------------

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })
  console.log(`DataForSEO pull for ${OUR_DOMAIN}  (${TODAY})\n`)

  const ok = await checkCredentials()
  if (!ok) process.exit(1)

  if (!DO_SERP && !DO_GAP) {
    console.log(
      '\nCredential check only. Nothing was billed.\n' +
        'Add --serp for SERP features + AI Overview, --gap for the competitor gap.',
    )
    return
  }

  let spend = COST_PER_LABS

  if (DO_SERP) {
    const seeds = seedKeywords(SERP_LIMIT)
    console.log(`\n── serp features + ai overview: ${seeds.length} keywords`)
    console.log(`   estimated cost ~$${(seeds.length * COST_PER_SERP).toFixed(2)}\n`)

    const rows: SerpRow[] = []
    for (const [i, seed] of seeds.entries()) {
      try {
        const row = await pullSerp(seed)
        rows.push(row)
        spend += COST_PER_SERP
        const aio = row.ai_overview_present
          ? row.ai_overview_cites_us
            ? 'AIO+CITED'
            : 'AIO'
          : '   -    '
        console.log(
          `   ${String(i + 1).padStart(3)}/${seeds.length}  ${aio}  ` +
            `us ${String(row.our_organic_rank ?? '-').padStart(3)}  ` +
            `${row.item_types.length} features  ${row.keyword}`,
        )
      } catch (err) {
        // One bad keyword must not abort a paid sweep midway.
        console.log(`   ${String(i + 1).padStart(3)}/${seeds.length}  FAILED  ${seed.keyword} — ${(err as Error).message}`)
      }
    }

    writeFileSync(`${OUT_DIR}/dataforseo-serp-features.json`, JSON.stringify(rows, null, 2))

    const withAio = rows.filter((r) => r.ai_overview_present)
    const cited = withAio.filter((r) => r.ai_overview_cites_us)
    console.log(`\n   ${rows.length} keywords measured`)
    console.log(`   AI Overview fires on ${withAio.length}/${rows.length}`)
    console.log(`   we are cited in ${cited.length} of those ${withAio.length}`)

    const featureCounts = new Map<string, number>()
    for (const r of rows) for (const t of r.item_types) featureCounts.set(t, (featureCounts.get(t) ?? 0) + 1)
    console.log('\n   SERP features by frequency:')
    for (const [t, n] of [...featureCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)) {
      console.log(`   ${String(n).padStart(4)}  ${t}`)
    }
  }

  if (DO_GAP) {
    await pullGap(1000)
    spend += COST_PER_LABS * COMPETITORS.length
  }

  console.log(`\nWritten to ${OUT_DIR}/`)
  console.log(`Estimated spend this run: ~$${spend.toFixed(2)}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

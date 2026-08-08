import 'dotenv/config'

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { z } from 'zod'

// Exhaustive Ahrefs v3 pull for cloudemployee.io.
//
// This is the deep companion to scripts/seo/ahrefs-pull.ts, which sampled four
// endpoints. Here we pull every endpoint the subscription exposes, every column
// the plan grants us, and every row (paginated to completion) unless a cap is
// declared explicitly in CAPPED_NOTES and recorded in the manifest.
//
// Column lists are NOT guessed. They were discovered by sending an invalid
// `select` to each endpoint and reading the "Available columns" error, per the
// lesson in CLAUDE.md Tech Debt #4: Ahrefs v3 exposes different columns per
// plan. If a pull starts failing after a plan change, re-run the discovery
// probe rather than editing columns by hand:
//   curl -H "Authorization: Bearer $AHREFS_API_KEY" \
//     "https://api.ahrefs.com/v3/site-explorer/<endpoint>?target=x&select=__probe__"
//
// Run:    npx tsx scripts/seo/ahrefs-deep-pull.ts
// Output: audit-output/seo-intel/<DATE>/ahrefs/*.json  (gitignored)
//         audit-output/seo-intel/<DATE>/MANIFEST-ahrefs.md

const TARGET = 'cloudemployee.io'
const DATE = '2026-08-06'
const OUT_DIR = `audit-output/seo-intel/${DATE}/ahrefs`
const MANIFEST = `audit-output/seo-intel/${DATE}/MANIFEST-ahrefs.md`
const API = 'https://api.ahrefs.com/v3'

/** Competitors named in the brief. /alternatives and /compare/* target these. */
const COMPETITORS = ['toptal.com', 'turing.com', 'andela.com', 'arc.dev', 'revelo.com']

/**
 * The API silently caps a page at 250 rows however large a `limit` you send, so
 * this must stay 250: paginating on any larger figure stops after one page and
 * quietly truncates the report.
 */
const PAGE_SIZE = 250
/** Guard so a runaway paginator cannot burn the monthly unit allowance. */
const MAX_ROWS_DEFAULT = 100_000
/** Competitor keyword sets are enormous; capped and declared in the manifest. */
const COMPETITOR_KEYWORD_CAP = 5_000
/**
 * Remaining-unit figure below which the run stops rather than degrading.
 *
 * The unit pool is per WORKSPACE, not per key or per session, so a big pull
 * here starves anything else running against the same Ahrefs account. Override
 * with --floor=N. Rows cost roughly one unit each, so a 250-row page is a
 * 250-unit purchase and a report is priced by how big it is.
 */
const DEFAULT_UNIT_FLOOR = 20_000

// ---------------------------------------------------------------------------
// Discovered column sets (see header note on provenance)
// ---------------------------------------------------------------------------

const COLS = {
  metricsHistory: 'date,org_traffic,org_cost,paid_traffic,paid_cost',
  metricsByCountry:
    'country,org_keywords,org_keywords_1_3,org_traffic,org_cost,paid_keywords,paid_traffic,paid_cost,paid_pages',
  keywordsHistory: 'date,top3,top4_10,top11_20,top21_50,top51_plus,top11_plus',
  // All 82 columns the plan grants. Note url_rating_target is NOT among them
  // even though the sibling report exposes url_rating_source.
  allBacklinks:
    'ahrefs_rank_source,ahrefs_rank_target,alt,anchor,broken_redirect_new_target,broken_redirect_reason,broken_redirect_source,class_c,discovered_status,domain_rating_source,domain_rating_target,drop_reason,encoding,first_seen,first_seen_link,http_code,http_crawl,ip_source,is_alternate,is_canonical,is_content,is_dofollow,is_form,is_frame,is_image,is_lost,is_new,is_nofollow,is_redirect,is_redirect_lost,is_root_source,is_root_target,is_rss,is_spam,is_sponsored,is_text,is_ugc,js_crawl,languages,last_seen,last_visited,link_group_count,link_type,linked_domains_source_domain,linked_domains_source_page,linked_domains_target_domain,links_external,links_internal,lost_reason,name_source,name_target,noindex,page_category_source,page_size,page_type_source,port_source,port_target,positions,powered_by,redirect_code,redirect_kind,refdomains_source,refdomains_source_domain,refdomains_target_domain,root_name_source,root_name_target,snippet_left,snippet_right,source_page_author,source_page_publish_date,title,tld_class_source,tld_class_target,traffic,traffic_domain,url_from,url_from_plain,url_rating_source,url_redirect,url_redirect_with_target,url_to,url_to_plain',
  brokenBacklinks:
    'url_from,url_to,url_from_plain,url_to_plain,domain_rating_source,domain_rating_target,url_rating_source,ahrefs_rank_source,anchor,title,link_type,is_dofollow,is_nofollow,is_content,is_redirect,is_spam,first_seen,first_seen_link,last_seen,last_visited,http_code,redirect_code,redirect_kind,traffic,traffic_domain,positions,refdomains_source,refdomains_source_domain,links_internal,links_external,name_source,name_target,root_name_target,ip_source,page_size,powered_by',
  refdomains:
    'domain,domain_rating,traffic_domain,links_to_target,dofollow_links,dofollow_refdomains,dofollow_linked_domains,new_links,lost_links,positions_source_domain,is_root_domain,is_spam,ip_source,first_seen,last_seen',
  anchors:
    'anchor,links_to_target,refdomains,refpages,dofollow_links,new_links,lost_links,top_domain_rating,is_spam,first_seen,last_seen',
  linkedDomains:
    'domain,domain_rating,linked_domain_traffic,links_from_target,linked_pages,dofollow_links,dofollow_refdomains,dofollow_linked_domains,is_root_domain,first_seen',
  linkedAnchorsExternal: 'anchor,links_from_target,linked_pages,linked_domains,dofollow_links,first_seen',
  linkedAnchorsInternal: 'anchor,links_from_target,linked_pages,dofollow_links,first_seen',
  organicKeywords:
    'keyword,keyword_country,keyword_language,language,volume,volume_desktop_pct,volume_mobile_pct,cpc,keyword_difficulty,words,best_position,best_position_url,best_position_kind,best_position_has_video,best_position_has_thumbnail,best_position_set,all_positions,is_best_position_set_top_3,is_best_position_set_top_4_10,is_best_position_set_top_11_50,sum_traffic,sum_paid_traffic,serp_features,serp_features_count,serp_target_positions_count,serp_target_main_positions_count,is_branded,is_local,is_navigational,is_informational,is_commercial,is_transactional,entities,last_update',
  organicCompetitors:
    'competitor_domain,competitor_url,domain_rating,keywords_common,keywords_target,keywords_competitor,pages,traffic,value,share,group_mode',
  topPages:
    'url,raw_url,sum_traffic,value,keywords,referring_domains,ur,page_type,top_keyword,top_keyword_volume,top_keyword_country,top_keyword_best_position,top_keyword_best_position_kind,top_keyword_best_position_title',
  paidPages:
    'url,raw_url,sum_traffic,value,keywords,referring_domains,ur,ads_count,top_keyword,top_keyword_volume,top_keyword_country,top_keyword_best_position,top_keyword_best_position_kind,top_keyword_best_position_title',
  bestByExternalLinks:
    'url_to,url_to_plain,title_target,http_code_target,url_rating_target,refdomains_target,links_to_target,dofollow_to_target,nofollow_to_target,new_links_to_target,lost_links_to_target,redirects_to_target,target_redirect,top_domain_rating_source,languages_target,powered_by_target,is_spam,first_seen_link,last_seen,last_visited_source,last_visited_target',
  bestByInternalLinks:
    'url_to,url_to_plain,title_target,http_code_target,url_rating_target,links_to_target,dofollow_to_target,nofollow_to_target,redirects_to_target,target_redirect,canonical_to_target,languages_target,powered_by_target,first_seen_link,last_seen,last_visited_source,last_visited_target',
  keywordsOverview:
    'keyword,difficulty,volume,global_volume,volume_monthly,volume_monthly_history,volume_desktop_pct,volume_mobile_pct,cpc,cps,clicks,traffic_potential,parent_topic,parent_volume,serp_features,serp_last_update,intents,first_seen,searches_pct_clicks_organic_only,searches_pct_clicks_paid_only,searches_pct_clicks_organic_and_paid',
  keywordTerms:
    'keyword,difficulty,volume,global_volume,volume_monthly,volume_desktop_pct,volume_mobile_pct,cpc,cps,traffic_potential,parent_topic,serp_features,serp_last_update,intents,first_seen',
  serpOverview:
    'position,url,title,type,page_type,domain_rating,url_rating,ahrefs_rank,backlinks,refdomains,traffic,value,keywords,top_keyword,top_keyword_volume,update_date',
  batchAnalysis:
    'index,url,mode,protocol,url_rating,domain_rating,ahrefs_rank,org_keywords,org_keywords_1_3,org_keywords_4_10,org_keywords_11_20,org_keywords_21_50,org_keywords_51_plus,org_traffic,org_cost,paid_keywords,paid_ads,paid_traffic,paid_cost,backlinks,backlinks_dofollow,backlinks_nofollow,backlinks_redirect,backlinks_internal,refdomains,refdomains_dofollow,refdomains_nofollow,refips,refips_subnets,outgoing_links,outgoing_links_dofollow,linked_domains,linked_domains_dofollow,ip',
} as const

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

const limitsSchema = z.object({
  limits_and_usage: z.object({
    subscription: z.string(),
    units_limit_workspace: z.number().nullable(),
    units_usage_workspace: z.number(),
    units_usage_api_key: z.number().nullable(),
  }),
})

interface ManifestRow {
  file: string
  endpoint: string
  params: string
  rows: number
  note: string
}

/**
 * Resume mode. Ahrefs bills per request, so a re-run after fixing one broken
 * pull must not re-buy the 50 files that already succeeded. Pass --force to
 * refetch everything.
 */
const FORCE = process.argv.includes('--force')

function argValue(name: string, fallback: number): number {
  const raw = process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1]
  const parsed = raw === undefined ? Number.NaN : Number(raw)
  return Number.isFinite(parsed) ? parsed : fallback
}

const UNIT_FLOOR = argValue('floor', DEFAULT_UNIT_FLOOR)

/**
 * Which groups to pull, so a re-run can fill one gap without re-pricing the
 * whole job: --only=own,keywords,competitors,audit (default: all four).
 */
const ONLY = (process.argv.find((a) => a.startsWith('--only='))?.split('=')[1] ?? 'own,keywords,competitors,audit')
  .split(',')
  .map((g) => g.trim())

const wants = (group: string): boolean => ONLY.includes(group)

/** Set once the workspace budget floor is hit; every later pull is skipped. */
let budgetExhausted = false

async function budgetOk(label: string): Promise<boolean> {
  if (budgetExhausted) return false
  const remaining = await unitsRemaining()
  if (remaining >= UNIT_FLOOR) return true
  budgetExhausted = true
  const msg = `${label} and everything after it skipped: ${remaining} units remain, floor is ${UNIT_FLOOR}`
  console.log(`   ! ${msg}`)
  failures.push(msg)
  return false
}

const manifestRows: ManifestRow[] = []
const failures: string[] = []

function key(): string {
  const k = process.env.AHREFS_API_KEY
  if (!k) throw new Error('AHREFS_API_KEY is not set')
  return k
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

/** GET with backoff. Returns the parsed body, or null after exhausting retries. */
async function request(
  path: string,
  params: Record<string, string>,
): Promise<Record<string, unknown> | null> {
  const url = `${API}/${path}?${new URLSearchParams(params)}`
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${key()}` } })
    if (res.ok) {
      await sleep(600)
      return (await res.json()) as Record<string, unknown>
    }
    const body = (await res.text()).slice(0, 300)
    // 429 and 5xx are worth retrying; a 400 is a request we built wrong.
    if (res.status !== 429 && res.status < 500) {
      failures.push(`${path} -> HTTP ${res.status}: ${body}`)
      console.log(`   ! ${path} HTTP ${res.status}: ${body}`)
      return null
    }
    const wait = 2000 * 2 ** attempt
    console.log(`   . ${path} HTTP ${res.status}, backing off ${wait}ms`)
    await sleep(wait)
  }
  failures.push(`${path} -> retries exhausted`)
  return null
}

function rowsOf(body: Record<string, unknown>): Record<string, unknown>[] {
  const arr = Object.values(body).find(Array.isArray)
  return (arr ?? []) as Record<string, unknown>[]
}

/**
 * Page through an endpoint.
 *
 * The API has NO offset parameter. It also ignores unknown query parameters
 * silently, so sending `offset` looks like it works and in fact refetches page
 * one forever. The first pass of this pull did exactly that and burned roughly
 * 110,000 units re-buying the same 250 rows. Pagination here is therefore
 * KEYSET: sort ascending on a unique-ish key column and ask for rows strictly
 * greater than the last key seen.
 *
 * Caveat: `order_by` honours ONE column only (multi-column sorts are ignored),
 * so if several rows share a key value across a page boundary the remainder of
 * that group is skipped. Key columns below are chosen to make that rare, and
 * any endpoint where it is not rare is aggregated so the key is unique.
 */
async function paginate(
  path: string,
  params: Record<string, string>,
  maxRows: number,
  keyColumn: string,
): Promise<Record<string, unknown>[] | null> {
  const out: Record<string, unknown>[] = []
  let cursor: string | null = null
  for (;;) {
    const page: Record<string, string> = {
      ...params,
      limit: String(PAGE_SIZE),
      order_by: `${keyColumn}:asc`,
    }
    if (cursor !== null) {
      page.where = JSON.stringify({ field: keyColumn, is: ['gt', cursor] })
    }
    const body = await request(path, page)
    if (!body) return out.length > 0 ? out : null
    const rows = rowsOf(body)
    out.push(...rows)
    const last = rows.at(-1)?.[keyColumn]
    if (rows.length < PAGE_SIZE || out.length >= maxRows || typeof last !== 'string') break
    cursor = last
    process.stdout.write(`\r   ... ${path} ${out.length} rows`)
  }
  return out
}

function write(file: string, data: unknown, endpoint: string, params: string, rows: number, note = ''): void {
  writeFileSync(`${OUT_DIR}/${file}`, JSON.stringify(data, null, 2))
  manifestRows.push({ file, endpoint, params, rows, note })
  console.log(`   ${String(rows).padStart(7)} rows  ${file}`)
}

/** Scalar reports (no pagination): whole body is the payload. */
function alreadyHave(file: string, endpoint: string, params: string): boolean {
  if (FORCE || !existsSync(`${OUT_DIR}/${file}`)) return false
  const parsed: unknown = JSON.parse(readFileSync(`${OUT_DIR}/${file}`, 'utf8'))
  const rows = Array.isArray(parsed) ? parsed.length : 1
  manifestRows.push({ file, endpoint, params, rows, note: 'Unchanged from an earlier run (resume mode).' })
  console.log(`   ${String(rows).padStart(7)} rows  ${file} (cached)`)
  return true
}

async function pullScalar(file: string, path: string, params: Record<string, string>): Promise<void> {
  if (alreadyHave(file, path, JSON.stringify(params))) return
  if (!(await budgetOk(file))) return
  const body = await request(path, params)
  if (!body) return
  const arr = Object.values(body).find(Array.isArray)
  write(file, body, path, JSON.stringify(params), Array.isArray(arr) ? arr.length : 1)
}

async function pullList(
  file: string,
  path: string,
  params: Record<string, string>,
  keyColumn: string,
  maxRows = MAX_ROWS_DEFAULT,
  note = '',
): Promise<void> {
  if (alreadyHave(file, path, JSON.stringify(params))) return
  if (!(await budgetOk(file))) return
  const rows = await paginate(path, params, maxRows, keyColumn)
  if (!rows) return
  const capped = rows.length >= maxRows ? `CAPPED at ${maxRows} rows. ${note}` : note
  write(file, rows, path, JSON.stringify(params), rows.length, capped)
}

async function unitsRemaining(): Promise<number> {
  const body = await request('subscription-info/limits-and-usage', {})
  if (!body) return Number.POSITIVE_INFINITY
  const parsed = limitsSchema.parse(body).limits_and_usage
  const limit = parsed.units_limit_workspace
  return limit === null ? Number.POSITIVE_INFINITY : limit - parsed.units_usage_workspace
}

// ---------------------------------------------------------------------------
// Pull plan
// ---------------------------------------------------------------------------

const SE = 'site-explorer'
const KE = 'keywords-explorer'
/** Applied to every Site Explorer call so figures are comparable across files. */
const scope = { target: TARGET, mode: 'subdomains', protocol: 'both' }
const history = { date_from: '2020-01-01', date_to: DATE }

async function pullOwnDomain(): Promise<void> {
  console.log('\n== Site Explorer: cloudemployee.io')

  await pullScalar('domain-rating.json', `${SE}/domain-rating`, { ...scope, date: DATE })
  await pullScalar('backlinks-stats.json', `${SE}/backlinks-stats`, { ...scope, date: DATE })
  await pullScalar('outlinks-stats.json', `${SE}/outlinks-stats`, { ...scope, date: DATE })
  await pullScalar('metrics.json', `${SE}/metrics`, { ...scope, date: DATE })
  await pullScalar('pages-by-traffic.json', `${SE}/pages-by-traffic`, { ...scope, date: DATE })

  console.log('\n== Site Explorer: history')
  await pullScalar('domain-rating-history.json', `${SE}/domain-rating-history`, { ...scope, ...history })
  await pullScalar('url-rating-history.json', `${SE}/url-rating-history`, { ...scope, ...history })
  await pullScalar('refdomains-history.json', `${SE}/refdomains-history`, { ...scope, ...history })
  await pullScalar('pages-history.json', `${SE}/pages-history`, { ...scope, ...history })
  await pullScalar('total-search-volume-history.json', `${SE}/total-search-volume-history`, {
    ...scope,
    ...history,
  })
  await pullScalar('metrics-history.json', `${SE}/metrics-history`, {
    ...scope,
    ...history,
    select: COLS.metricsHistory,
  })
  await pullScalar('keywords-history.json', `${SE}/keywords-history`, {
    ...scope,
    ...history,
    select: COLS.keywordsHistory,
    country: 'us',
  })
  await pullList('metrics-by-country.json', `${SE}/metrics-by-country`, {
    ...scope,
    date: DATE,
    select: COLS.metricsByCountry,
  }, 'country')

  console.log('\n== Site Explorer: backlink graph')
  // history=live is the default; the lost/new pull below is a separate file so
  // neither view is diluted by the other.
  await pullList('backlinks-live.json', `${SE}/all-backlinks`, {
    ...scope,
    select: COLS.allBacklinks,
    history: 'live',
    aggregation: 'all',
  }, 'url_from')
  await pullList(
    'backlinks-all-time.json',
    `${SE}/all-backlinks`,
    {
      ...scope,
      select: COLS.allBacklinks,
      history: 'all_time',
      aggregation: '1_per_domain',
    },
    'url_from',
    MAX_ROWS_DEFAULT,
    'history=all_time with aggregation=1_per_domain. Carries is_lost / is_new / lost_reason / drop_reason, so lost and new links are derivable per referring domain. Un-aggregated all-time is ~79k links; aggregated keeps the run inside the unit budget.',
  )
  await pullList('broken-backlinks.json', `${SE}/broken-backlinks`, {
    ...scope,
    select: COLS.brokenBacklinks,
  }, 'url_from')
  await pullList('refdomains.json', `${SE}/refdomains`, {
    ...scope,
    select: COLS.refdomains,
  }, 'domain')
  await pullList('anchors.json', `${SE}/anchors`, {
    ...scope,
    select: COLS.anchors,
  }, 'anchor')
  await pullList('linked-domains.json', `${SE}/linkeddomains`, {
    ...scope,
    select: COLS.linkedDomains,
  }, 'domain')
  await pullList('linked-anchors-external.json', `${SE}/linked-anchors-external`, {
    ...scope,
    select: COLS.linkedAnchorsExternal,
  }, 'anchor')
  await pullList('linked-anchors-internal.json', `${SE}/linked-anchors-internal`, {
    ...scope,
    select: COLS.linkedAnchorsInternal,
  }, 'anchor')
  await pullList('best-by-external-links.json', `${SE}/best-by-external-links`, {
    ...scope,
    select: COLS.bestByExternalLinks,
  }, 'url_to')
  await pullList('best-by-internal-links.json', `${SE}/best-by-internal-links`, {
    ...scope,
    select: COLS.bestByInternalLinks,
  }, 'url_to')

  console.log('\n== Site Explorer: organic')
  for (const country of ['us', 'gb']) {
    await pullList(`organic-keywords-${country}.json`, `${SE}/organic-keywords`, {
      ...scope,
      select: COLS.organicKeywords,
      date: DATE,
      country,
    }, 'keyword')
    await pullList(`top-pages-${country}.json`, `${SE}/top-pages`, {
      ...scope,
      select: COLS.topPages,
      date: DATE,
      country,
    }, 'url')
    await pullList(`organic-competitors-${country}.json`, `${SE}/organic-competitors`, {
      ...scope,
      select: COLS.organicCompetitors,
      date: DATE,
      country,
    }, 'competitor_domain')
    await pullList(`paid-pages-${country}.json`, `${SE}/paid-pages`, {
      ...scope,
      select: COLS.paidPages,
      date: DATE,
      country,
    }, 'url')
  }
}

async function pullCompetitors(): Promise<void> {
  console.log('\n== Competitors')
  for (const domain of COMPETITORS) {
    const cScope = { target: domain, mode: 'subdomains', protocol: 'both' }
    const slug = domain.replace(/\./g, '-')
    await pullScalar(`competitor-${slug}-metrics.json`, `${SE}/metrics`, { ...cScope, date: DATE })
    await pullScalar(`competitor-${slug}-domain-rating.json`, `${SE}/domain-rating`, {
      ...cScope,
      date: DATE,
    })
    await pullScalar(`competitor-${slug}-backlinks-stats.json`, `${SE}/backlinks-stats`, {
      ...cScope,
      date: DATE,
    })
    await pullList(
      `competitor-${slug}-organic-keywords-us.json`,
      `${SE}/organic-keywords`,
      {
        ...cScope,
        select: COLS.organicKeywords,
        date: DATE,
        country: 'us',
      },
      'keyword',
      COMPETITOR_KEYWORD_CAP,
      `Top ${COMPETITOR_KEYWORD_CAP} US keywords by traffic. Ahrefs v3 has no content-gap or keyword-gap endpoint; gap analysis is computed downstream by set-differencing these files against organic-keywords-us.json.`,
    )
    await pullList(
      `competitor-${slug}-top-pages-us.json`,
      `${SE}/top-pages`,
      { ...cScope, select: COLS.topPages, date: DATE, country: 'us' },
      'url',
      COMPETITOR_KEYWORD_CAP,
      'Content-gap input: competitor pages by traffic.',
    )
  }

  // One batch row per domain, ours included, so the comparison table needs no joins.
  const targets = [TARGET, ...COMPETITORS].map((url) => ({ url, mode: 'subdomains', protocol: 'both' }))
  if (alreadyHave('batch-analysis.json', 'batch-analysis/batch-analysis (POST)', 'see earlier run')) return
  const res = await fetch(`${API}/batch-analysis/batch-analysis`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ select: COLS.batchAnalysis.split(','), targets, country: 'us' }),
  })
  if (res.ok) {
    const body = (await res.json()) as Record<string, unknown>
    write(
      'batch-analysis.json',
      body,
      'batch-analysis/batch-analysis (POST)',
      JSON.stringify({ targets: targets.map((t) => t.url), country: 'us' }),
      rowsOf(body).length,
    )
  } else {
    failures.push(`batch-analysis -> HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`)
  }
}

const organicRowSchema = z.object({ keyword: z.string() }).passthrough()

async function pullKeywordsExplorer(): Promise<void> {
  console.log('\n== Keywords Explorer')

  // Seed from the keywords we actually rank for, so this is our surface and not
  // a guessed list.
  let seeds: string[] = []
  try {
    const raw = await import(`${process.cwd()}/${OUT_DIR}/organic-keywords-us.json`, {
      with: { type: 'json' },
    })
    const parsed = z.array(organicRowSchema).parse((raw as { default: unknown }).default)
    seeds = [...new Set(parsed.map((r) => r.keyword))]
  } catch {
    console.log('   ! organic-keywords-us.json unreadable; skipping Keywords Explorer seeds')
    failures.push('keywords-explorer -> no seed keywords available')
    return
  }

  // `keywords` is a comma-separated batch param; chunk to keep URLs sane.
  const overview: Record<string, unknown>[] = []
  for (let i = 0; i < seeds.length; i += 100) {
    const body = await request(`${KE}/overview`, {
      keywords: seeds.slice(i, i + 100).join(','),
      country: 'us',
      select: COLS.keywordsOverview,
      volume_monthly_date_from: '2024-08-01',
      volume_monthly_date_to: DATE,
    })
    if (body) overview.push(...rowsOf(body))
  }
  write(
    'keywords-overview-us.json',
    overview,
    `${KE}/overview`,
    JSON.stringify({ keywords: `${seeds.length} seeds from organic-keywords-us`, country: 'us' }),
    overview.length,
    'Volume, difficulty, parent topic, traffic potential and intents for every keyword we rank for.',
  )

  // Ideas expansion off the highest-traffic seeds. Matching/related/suggestions
  // take a single seed each, so this is bounded deliberately.
  const ideaSeeds = seeds.slice(0, 25)
  for (const [name, path] of [
    ['matching-terms', `${KE}/matching-terms`],
    ['related-terms', `${KE}/related-terms`],
    ['search-suggestions', `${KE}/search-suggestions`],
  ] as const) {
    const acc: Record<string, unknown>[] = []
    for (const seed of ideaSeeds) {
      const rows = await paginate(
        path,
        { keywords: seed, country: 'us', select: COLS.keywordTerms, match_mode: 'terms' },
        5_000,
        'keyword',
      )
      for (const row of rows ?? []) acc.push({ seed, ...row })
    }
    write(
      `keywords-${name}-us.json`,
      acc,
      path,
      JSON.stringify({ seeds: ideaSeeds.length, country: 'us' }),
      acc.length,
      `Expansion over the top ${ideaSeeds.length} seed keywords by traffic. Every row carries the seed that produced it.`,
    )
  }

  // SERP overview is one request per keyword, so it is scoped to the top 25.
  const serp: Record<string, unknown>[] = []
  for (const seed of ideaSeeds) {
    const body = await request('serp-overview/serp-overview', {
      keyword: seed,
      country: 'us',
      date: DATE,
      select: COLS.serpOverview,
      top_positions: '100',
    })
    for (const row of body ? rowsOf(body) : []) serp.push({ keyword: seed, ...row })
  }
  write(
    'serp-overview-us.json',
    serp,
    'serp-overview/serp-overview',
    JSON.stringify({ keywords: ideaSeeds.length, country: 'us', date: DATE }),
    serp.length,
    `Top ${ideaSeeds.length} keywords by traffic only: SERP overview costs one request per keyword.`,
  )

  for (const seed of ideaSeeds.slice(0, 10)) {
    await pullScalar(`keyword-volume-by-country-${seed.replace(/\W+/g, '-')}.json`, `${KE}/volume-by-country`, {
      keyword: seed,
    })
  }
}

async function pullSiteAudit(): Promise<void> {
  console.log('\n== Site Audit + management')
  await pullScalar('site-audit-projects.json', 'site-audit/projects', {})
  await pullScalar('management-projects.json', 'management/projects', {})
  // project_id 9325640 = the "Cloudemployee" Site Audit project on this workspace.
  await pullScalar('site-audit-issues.json', 'site-audit/issues', { project_id: '9325640' })
}

// ---------------------------------------------------------------------------

function writeManifest(before: number, after: number): void {
  const lines: string[] = [
    '# MANIFEST - Ahrefs deep pull',
    '',
    `Target: ${TARGET} (mode=subdomains, protocol=both)`,
    `Pulled: ${DATE}`,
    `Script: scripts/seo/ahrefs-deep-pull.ts (re-runnable)`,
    `Units consumed this run: ${before - after} (remaining: ${after})`,
    '',
    'Column sets in the script were discovered from the API rather than assumed,',
    'per CLAUDE.md Tech Debt #4. See ahrefs/ENDPOINTS.md for the full surface,',
    'including endpoints this plan does not expose.',
    '',
    '| File | Endpoint | Parameters | Rows | Notes |',
    '|---|---|---|---|---|',
  ]
  for (const r of manifestRows) {
    const params = r.params.replace(/\|/g, '\\|')
    lines.push(`| ${r.file} | ${r.endpoint} | \`${params}\` | ${r.rows} | ${r.note.replace(/\|/g, '\\|')} |`)
  }
  lines.push('', '## Requests that failed or returned nothing', '')
  if (failures.length === 0) lines.push('None.')
  for (const f of failures) lines.push(`- ${f}`)
  lines.push(
    '',
    '## Columns wanted but not exposed on this plan',
    '',
    '- No content-gap or keyword-gap endpoint exists in Ahrefs v3 at any plan level.',
    '  Both are UI-only features. The competitor organic-keywords and top-pages files',
    '  are the raw inputs; the gap is a downstream set operation.',
    '- No page-level on-page data (word count, headings) from Site Explorer. The Site',
    '  Audit project covers that, but its API surface here is projects + issues only;',
    '  per-URL crawl data needs site-audit/page-content one target_url at a time.',
    '- Rank Tracker holds 0 keywords on this workspace, so rank-tracker/* returns nothing',
    '  of value until keywords are added in the Ahrefs UI.',
  )
  writeFileSync(MANIFEST, lines.join('\n') + '\n')
}

async function main(): Promise<void> {
  mkdirSync(OUT_DIR, { recursive: true })
  const before = await unitsRemaining()
  console.log(`Ahrefs deep pull for ${TARGET}\nUnits remaining before run: ${before}`)
  if (before < UNIT_FLOOR) throw new Error(`Only ${before} units remain; refusing to start.`)

  if (wants('own')) await pullOwnDomain()
  if (wants('keywords')) await pullKeywordsExplorer()
  if (wants('competitors')) await pullCompetitors()
  if (wants('audit')) await pullSiteAudit()
  for (const group of ['own', 'keywords', 'competitors', 'audit']) {
    if (!wants(group)) failures.push(`group '${group}' not requested on this run (--only=${ONLY.join(',')})`)
  }

  const after = await unitsRemaining()
  writeManifest(before, after)
  console.log(`\nDone. ${manifestRows.length} files, ${failures.length} failures.`)
  console.log(`Units used: ${before - after}. Manifest: ${MANIFEST}`)
}

main().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})

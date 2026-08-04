import 'dotenv/config'

import { mkdirSync, writeFileSync } from 'node:fs'

// Pull the Ahrefs signals that matter immediately after a platform migration.
//
// The domain did not change, so this is not a domain migration and link equity
// is not at risk wholesale. What IS at risk is per-URL: a page that carries
// referring domains and now 404s silently drops that equity. So the priority
// order here is backlink-weighted, not traffic-weighted.
//
// Endpoints are attempted independently: Ahrefs plans differ in what they
// expose, and one 403 should not abort the run.
//
// Run: npx tsx scripts/seo/ahrefs-pull.ts
// Output: audit-output/seo-post-launch/ahrefs-*.json

const TARGET = 'cloudemployee.io'
const OUT_DIR = 'audit-output/seo-post-launch'
const BASE = 'https://api.ahrefs.com/v3/site-explorer'
const TODAY = new Date().toISOString().slice(0, 10)

interface Pull {
  name: string
  path: string
  params: Record<string, string>
  /** Column to sort the console summary by. */
  show: (row: Record<string, unknown>) => string
}

const PULLS: Pull[] = [
  {
    name: 'top-pages',
    path: 'top-pages',
    params: {
      select: 'url,sum_traffic,keywords,top_keyword,top_keyword_volume,top_keyword_best_position',
      order_by: 'sum_traffic:desc',
      limit: '50',
      date: TODAY,
    },
    show: (r) =>
      `${String(r.sum_traffic ?? 0).padStart(6)} traffic  ${String(r.keywords ?? 0).padStart(5)} kw  ${r.url}`,
  },
  {
    name: 'best-by-external-links',
    path: 'best-by-external-links',
    params: {
      select: 'url_to,refdomains_target,http_code_target,links_to_target',
      order_by: 'refdomains_target:desc',
      limit: '50',
    },
    show: (r) =>
      `${String(r.refdomains_target ?? 0).padStart(5)} refdomains  http ${String(r.http_code_target ?? '?').padStart(3)}  ${r.url_to}`,
  },
  {
    name: 'broken-backlinks',
    path: 'broken-backlinks',
    params: {
      select: 'url_to,url_from,domain_rating_source,http_code_target',
      order_by: 'domain_rating_source:desc',
      limit: '100',
    },
    show: (r) =>
      `DR ${String(r.domain_rating_source ?? 0).padStart(3)}  http ${String(r.http_code_target ?? '?').padStart(3)}  -> ${r.url_to}`,
  },
  {
    name: 'organic-keywords',
    path: 'organic-keywords',
    params: {
      select: 'keyword,best_position,volume,sum_traffic,best_position_url',
      order_by: 'volume:desc',
      limit: '100',
      date: TODAY,
      country: 'us',
    },
    show: (r) =>
      `vol ${String(r.volume ?? 0).padStart(6)}  pos ${String(r.best_position ?? '-').padStart(3)}  ${r.keyword}`,
  },
]

async function pull(p: Pull): Promise<Record<string, unknown>[] | null> {
  const qs = new URLSearchParams({ target: TARGET, mode: 'subdomains', ...p.params })
  const res = await fetch(`${BASE}/${p.path}?${qs}`, {
    headers: { Authorization: `Bearer ${process.env.AHREFS_API_KEY}` },
  })
  if (!res.ok) {
    console.log(`\n── ${p.name}: HTTP ${res.status} — ${(await res.text()).slice(0, 160)}`)
    return null
  }
  const json = (await res.json()) as Record<string, unknown>
  const rows = (Object.values(json).find(Array.isArray) ?? []) as Record<string, unknown>[]
  return rows
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })
  console.log(`Ahrefs pull for ${TARGET}\n`)

  for (const p of PULLS) {
    const rows = await pull(p)
    if (!rows) continue
    writeFileSync(`${OUT_DIR}/ahrefs-${p.name}.json`, JSON.stringify(rows, null, 2))
    console.log(`\n── ${p.name}: ${rows.length} rows`)
    for (const r of rows.slice(0, 20)) console.log('   ' + p.show(r))
    if (rows.length > 20) console.log(`   ... and ${rows.length - 20} more (see JSON)`)
  }

  console.log(`\nWritten to ${OUT_DIR}/`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

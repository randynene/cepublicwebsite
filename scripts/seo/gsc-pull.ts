import 'dotenv/config'

import { mkdirSync, writeFileSync } from 'node:fs'

import { google } from 'googleapis'

// Pull Search Console performance data for cloudemployee.io.
//
// The property is a DOMAIN property (sc-domain:cloudemployee.io), so it spans
// www and non-www, http and https, and every subdomain. That matters here: the
// Webflow site and the Next.js site live at the same domain, so this one
// property holds continuous history across the cutover. There is no "old
// property vs new property" split to reconcile.
//
// GSC data lags roughly 2-3 days, so "yesterday" is normally empty. The
// baseline window therefore ends 3 days back rather than today.
//
// Run: npx tsx scripts/seo/gsc-pull.ts [--days 90]
// Output: audit-output/seo-post-launch/gsc-*.json

const SITE = process.env.GSC_SITE_URL ?? 'sc-domain:cloudemployee.io'
const OUT_DIR = 'audit-output/seo-post-launch'
const ROW_LIMIT = 5000

function arg(name: string, fallback: number): number {
  const i = process.argv.indexOf(`--${name}`)
  if (i === -1) return fallback
  const v = Number(process.argv[i + 1])
  return Number.isFinite(v) ? v : fallback
}

function isoDaysAgo(n: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - n)
  return d.toISOString().slice(0, 10)
}

interface Row {
  keys: string[]
  clicks: number
  impressions: number
  ctr: number
  position: number
}

async function main() {
  const days = arg('days', 90)
  // GSC finalises data ~3 days back; anything newer under-reports.
  const endDate = isoDaysAgo(3)
  const startDate = isoDaysAgo(3 + days)

  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GSC_SERVICE_ACCOUNT_KEY_PATH,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  })
  const sc = google.searchconsole({ version: 'v1', auth })

  async function query(dimensions: string[]): Promise<Row[]> {
    const res = await sc.searchanalytics.query({
      siteUrl: SITE,
      requestBody: { startDate, endDate, dimensions, rowLimit: ROW_LIMIT },
    })
    return (res.data.rows ?? []) as Row[]
  }

  mkdirSync(OUT_DIR, { recursive: true })
  console.log(`Property: ${SITE}`)
  console.log(`Window:   ${startDate} to ${endDate} (${days} days)\n`)

  const pages = await query(['page'])
  const queries = await query(['query'])
  const daily = await query(['date'])

  const totals = pages.reduce(
    (a, r) => ({ clicks: a.clicks + r.clicks, impressions: a.impressions + r.impressions }),
    { clicks: 0, impressions: 0 },
  )

  writeFileSync(
    `${OUT_DIR}/gsc-pages.json`,
    JSON.stringify({ site: SITE, startDate, endDate, rows: pages }, null, 2),
  )
  writeFileSync(
    `${OUT_DIR}/gsc-queries.json`,
    JSON.stringify({ site: SITE, startDate, endDate, rows: queries }, null, 2),
  )
  writeFileSync(
    `${OUT_DIR}/gsc-daily.json`,
    JSON.stringify({ site: SITE, startDate, endDate, rows: daily }, null, 2),
  )

  console.log(`Totals: ${totals.clicks} clicks, ${totals.impressions} impressions`)
  console.log(`Pages with impressions: ${pages.length}`)
  console.log(`Queries: ${queries.length}\n`)

  console.log('Top 25 pages by clicks:')
  for (const r of pages.sort((a, b) => b.clicks - a.clicks).slice(0, 25)) {
    const path = r.keys[0].replace(/^https?:\/\/[^/]+/, '') || '/'
    console.log(
      `  ${String(r.clicks).padStart(5)} clicks ${String(r.impressions).padStart(7)} impr  pos ${r.position.toFixed(1).padStart(5)}  ${path}`,
    )
  }

  console.log('\nTop 20 queries by clicks:')
  for (const r of queries.sort((a, b) => b.clicks - a.clicks).slice(0, 20)) {
    console.log(
      `  ${String(r.clicks).padStart(5)} clicks ${String(r.impressions).padStart(7)} impr  pos ${r.position.toFixed(1).padStart(5)}  ${r.keys[0]}`,
    )
  }

  console.log(`\nWritten to ${OUT_DIR}/`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

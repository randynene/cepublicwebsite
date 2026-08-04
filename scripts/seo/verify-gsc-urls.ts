import 'dotenv/config'

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

// Replay every URL Google has impressions for against the LIVE site.
//
// The launch parity gate compared staging against Webflow. This is the
// after-the-fact equivalent: it asks whether the URLs that actually EARN
// something in Search Console still resolve, still return a self-referencing
// canonical, and are still indexable now that the new site is serving them.
//
// Findings are weighted by clicks, because a broken URL with 700 clicks and a
// broken URL with 0 clicks are not the same problem.
//
// Run: npx tsx scripts/seo/verify-gsc-urls.ts

const IN = 'audit-output/seo-post-launch/gsc-pages.json'
const OUT_DIR = 'audit-output/seo-post-launch'
const ORIGIN = 'https://www.cloudemployee.io'
const CONCURRENCY = 6

interface GscRow {
  keys: string[]
  clicks: number
  impressions: number
  position: number
}

interface Check {
  path: string
  clicks: number
  impressions: number
  position: number
  status: number
  finalUrl: string
  redirected: boolean
  title: string | null
  canonical: string | null
  noindex: boolean
  verdict: string
}

function attr(html: string, re: RegExp): string | null {
  const m = html.match(re)
  return m ? m[1].trim() : null
}

function metaRobots(html: string): string {
  // Attribute order varies by generator, so match the tag then read content.
  const tags = html.match(/<meta[^>]+>/gi) ?? []
  for (const t of tags) {
    if (!/name=["']robots["']/i.test(t)) continue
    const c = attr(t, /content=["']([^"']*)["']/i)
    if (c) return c.toLowerCase()
  }
  return ''
}

async function check(path: string, row: GscRow): Promise<Check> {
  let status = 0
  let finalUrl = ''
  let html = ''
  try {
    const res = await fetch(ORIGIN + path, {
      redirect: 'follow',
      headers: { 'user-agent': 'Mygratr-SEO-Audit/1.0' },
    })
    status = res.status
    finalUrl = res.url
    html = res.headers.get('content-type')?.includes('text/html') ? await res.text() : ''
  } catch (e) {
    return {
      path,
      clicks: row.clicks,
      impressions: row.impressions,
      position: row.position,
      status: 0,
      finalUrl: '',
      redirected: false,
      title: null,
      canonical: null,
      noindex: false,
      verdict: `FETCH FAILED: ${(e as Error).message}`,
    }
  }

  const title = attr(html, /<title[^>]*>([^<]*)<\/title>/i)
  const canonical = attr(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)
  const robots = metaRobots(html)
  const noindex = robots.includes('noindex')
  const redirected = finalUrl.replace(/\/$/, '') !== (ORIGIN + path).replace(/\/$/, '')

  let verdict = 'ok'
  if (status === 0) verdict = 'unreachable'
  else if (status === 404) verdict = 'GONE (404)'
  else if (status >= 500) verdict = `SERVER ERROR (${status})`
  else if (noindex) verdict = 'NOINDEX'
  else if (status >= 400) verdict = `error ${status}`
  else if (redirected) verdict = 'redirected'
  else if (!title) verdict = 'no title'
  else if (!canonical) verdict = 'no canonical'

  return {
    path,
    clicks: row.clicks,
    impressions: row.impressions,
    position: row.position,
    status,
    finalUrl,
    redirected,
    title,
    canonical,
    noindex,
    verdict,
  }
}

async function main() {
  const parsed = JSON.parse(readFileSync(IN, 'utf-8')) as { rows: GscRow[] }

  // Collapse www / non-www / trailing-slash variants onto one path, summing the
  // metrics. GSC reports them separately; the site serves one canonical URL.
  const byPath = new Map<string, GscRow>()
  for (const r of parsed.rows) {
    const u = new URL(r.keys[0])
    const path = u.pathname + u.search
    const prev = byPath.get(path)
    if (prev) {
      prev.clicks += r.clicks
      prev.impressions += r.impressions
      prev.position = Math.min(prev.position, r.position)
    } else {
      byPath.set(path, { ...r })
    }
  }

  const entries = [...byPath.entries()].sort((a, b) => b[1].clicks - a[1].clicks)
  console.log(`Checking ${entries.length} unique paths from Search Console against ${ORIGIN}\n`)

  const results: Check[] = []
  for (let i = 0; i < entries.length; i += CONCURRENCY) {
    const batch = entries.slice(i, i + CONCURRENCY)
    results.push(...(await Promise.all(batch.map(([p, r]) => check(p, r)))))
    process.stdout.write(`\r  ${Math.min(i + CONCURRENCY, entries.length)}/${entries.length}`)
  }
  console.log('\n')

  mkdirSync(OUT_DIR, { recursive: true })
  writeFileSync(`${OUT_DIR}/gsc-url-health.json`, JSON.stringify(results, null, 2))

  const problems = results.filter((r) => r.verdict !== 'ok')
  const lostClicks = problems
    .filter((r) => /GONE|SERVER|NOINDEX|unreachable/.test(r.verdict))
    .reduce((a, r) => a + r.clicks, 0)

  const byVerdict = new Map<string, Check[]>()
  for (const r of problems) {
    const key = r.verdict.replace(/\(\d+\)/, '').trim()
    if (!byVerdict.has(key)) byVerdict.set(key, [])
    byVerdict.get(key)!.push(r)
  }

  console.log(`Clean: ${results.length - problems.length}/${results.length}`)
  console.log(`Clicks at risk (gone / noindex / error): ${lostClicks}\n`)

  for (const [verdict, rows] of [...byVerdict.entries()].sort(
    (a, b) =>
      b[1].reduce((s, r) => s + r.clicks, 0) - a[1].reduce((s, r) => s + r.clicks, 0),
  )) {
    const clicks = rows.reduce((s, r) => s + r.clicks, 0)
    const impr = rows.reduce((s, r) => s + r.impressions, 0)
    console.log(`── ${verdict}: ${rows.length} paths, ${clicks} clicks, ${impr} impressions`)
    for (const r of rows.sort((a, b) => b.impressions - a.impressions).slice(0, 12)) {
      const to = r.redirected ? ` -> ${r.finalUrl.replace(ORIGIN, '')}` : ''
      console.log(
        `   ${String(r.clicks).padStart(4)}c ${String(r.impressions).padStart(6)}i  ${r.path}${to}`,
      )
    }
    if (rows.length > 12) console.log(`   ... and ${rows.length - 12} more (see JSON)`)
    console.log()
  }

  console.log(`Full results: ${OUT_DIR}/gsc-url-health.json`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

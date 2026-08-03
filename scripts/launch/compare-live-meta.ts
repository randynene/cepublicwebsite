// Cutover evidence: does the new site say the same thing to Google as live does?
//
// The parity gate proves every URL BEHAVES the same (200 vs 301 vs 404, and where
// the redirects land). It says nothing about what the page then tells a crawler.
// A page can 200 perfectly and still lose its ranking because its <title> no
// longer carries the phrase it ranks for. That is the gap this fills.
//
// Compares <title>, meta description and og:image for every indexable URL in the
// new site's sitemap against the same path on live, and writes a report.
//
//   npm run launch:compare-meta
//   npm run launch:compare-meta -- --limit 40
//   npm run launch:compare-meta -- --target https://staging.jakevibes.dev
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

const LIVE_ORIGIN = 'https://www.cloudemployee.io'
const REPORT_PATH = 'audit-output/launch/meta-parity.json'
const CONCURRENCY = 10
const UA = 'Mozilla/5.0 (compatible; MygratrMetaParity/1.0)'

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag)
  return i === -1 ? undefined : process.argv[i + 1]
}

const TARGET = (argValue('--target') ?? 'https://staging.jakevibes.dev').replace(/\/$/, '')
const LIMIT = Number(argValue('--limit') ?? '0')

type Meta = {
  title: string | null
  description: string | null
  ogImage: string | null
  status: number
}

// Webflow writes `content="..." name="description"`; Next writes
// `name="description" content="..."`. Matching only one order silently reports
// "live has no description" for the entire site, which is how a first pass at
// this check produced a clean bill of health it had not earned.
function metaContent(html: string, key: string, attr: 'name' | 'property'): string | null {
  const forward = new RegExp(`<meta[^>]+${attr}=["']${key}["'][^>]*>`, 'i')
  const tag = html.match(forward)?.[0]
  if (!tag) return null
  return tag.match(/content=["']([^"']*)["']/i)?.[1] ?? null
}

function decode(value: string | null): string | null {
  if (value === null) return null
  return value
    .replace(/&amp;/g, '&')
    .replace(/&#x27;|&apos;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

async function fetchMeta(url: string): Promise<Meta> {
  const res = await fetch(url, { headers: { 'user-agent': UA }, redirect: 'follow' })
  if (!res.ok) return { title: null, description: null, ogImage: null, status: res.status }
  const html = await res.text()
  return {
    title: decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? null),
    description: decode(metaContent(html, 'description', 'name')),
    ogImage: decode(metaContent(html, 'og:image', 'property')),
    status: res.status,
  }
}

async function sitemapPaths(): Promise<string[]> {
  const xml = await (await fetch(`${TARGET}/sitemap.xml`, { headers: { 'user-agent': UA } })).text()
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
  return locs.map((l) => new URL(l).pathname).sort()
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length)
  let cursor = 0
  async function worker(): Promise<void> {
    for (;;) {
      const i = cursor++
      if (i >= items.length) return
      out[i] = await fn(items[i])
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return out
}

type Row = {
  path: string
  titleMatch: boolean
  descriptionMatch: boolean
  ogImageBoth: boolean
  live: Meta
  target: Meta
  // A title whose live counterpart starts with it, but is longer, is not a
  // rewrite — it is the same string with the tail lost. Worth separating,
  // because the fix is a data backfill rather than a copy decision.
  truncated: boolean
}

async function main(): Promise<void> {
  let paths = await sitemapPaths()
  if (LIMIT > 0) paths = paths.slice(0, LIMIT)

  console.log(`Comparing ${paths.length} paths`)
  console.log(`  live:   ${LIVE_ORIGIN}`)
  console.log(`  target: ${TARGET}\n`)

  const rows = await mapWithConcurrency(paths, CONCURRENCY, async (path): Promise<Row> => {
    const [live, target] = await Promise.all([
      fetchMeta(`${LIVE_ORIGIN}${path}`).catch(
        (): Meta => ({ title: null, description: null, ogImage: null, status: 0 }),
      ),
      fetchMeta(`${TARGET}${path}`).catch(
        (): Meta => ({ title: null, description: null, ogImage: null, status: 0 }),
      ),
    ])

    const truncated =
      !!live.title &&
      !!target.title &&
      live.title !== target.title &&
      live.title.startsWith(target.title)

    return {
      path,
      titleMatch: live.title === target.title,
      descriptionMatch: live.description === target.description,
      ogImageBoth: !!live.ogImage === !!target.ogImage,
      truncated,
      live,
      target,
    }
  })

  // Only pages that exist on live can diverge from it. A net-new page has
  // nothing to match, and counting it as a failure would bury the real ones.
  const comparable = rows.filter((r) => r.live.status === 200)
  const netNew = rows.filter((r) => r.live.status !== 200)

  const titleDiffs = comparable.filter((r) => !r.titleMatch)
  const truncations = titleDiffs.filter((r) => r.truncated)
  const rewrites = titleDiffs.filter((r) => !r.truncated)
  const descDiffs = comparable.filter((r) => !r.descriptionMatch)
  const missingOg = comparable.filter((r) => r.live.ogImage && !r.target.ogImage)

  console.log(`Comparable (live 200):     ${comparable.length}`)
  console.log(`Net-new (not on live):     ${netNew.length}`)
  console.log(`Title matches live:        ${comparable.length - titleDiffs.length}`)
  console.log(`  truncated (tail lost):   ${truncations.length}`)
  console.log(`  rewritten:               ${rewrites.length}`)
  console.log(`Description matches live:  ${comparable.length - descDiffs.length}`)
  console.log(`Lost an og:image live has: ${missingOg.length}\n`)

  if (truncations.length) {
    console.log('TRUNCATED TITLES (data fix - restore the live string):')
    for (const r of truncations) {
      console.log(`  ${r.path}`)
      console.log(`    live: ${r.live.title}`)
      console.log(`    new : ${r.target.title}`)
    }
    console.log()
  }

  if (rewrites.length) {
    console.log('REWRITTEN TITLES (copy decision - keep or revert):')
    for (const r of rewrites) {
      console.log(`  ${r.path}`)
      console.log(`    live: ${r.live.title}`)
      console.log(`    new : ${r.target.title}`)
    }
    console.log()
  }

  mkdirSync(dirname(REPORT_PATH), { recursive: true })
  writeFileSync(
    REPORT_PATH,
    JSON.stringify(
      {
        comparedAt: new Date().toISOString(),
        liveOrigin: LIVE_ORIGIN,
        target: TARGET,
        totals: {
          compared: comparable.length,
          netNew: netNew.length,
          titleDiffs: titleDiffs.length,
          truncations: truncations.length,
          rewrites: rewrites.length,
          descriptionDiffs: descDiffs.length,
          missingOgImage: missingOg.length,
        },
        truncations,
        rewrites,
        descriptionDiffs: descDiffs,
        missingOgImage: missingOg,
        // Every page that exists on both sites, divergent or not. The backfill
        // needs the matching ones too: a title that matches today may only match
        // because the layout is bolting the brand suffix on, and the stored value
        // has to become the whole string for that to keep being true.
        allComparable: comparable,
      },
      null,
      2,
    ),
  )
  console.log(`Full report: ${REPORT_PATH}`)
}

void main()

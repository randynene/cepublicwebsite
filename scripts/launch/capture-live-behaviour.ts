// Record what the LIVE site actually does for every URL we know about.
//
// This is the reference the cutover is graded against. Webflow's redirect config
// cannot be re-exported through the API (Enterprise-only endpoint), so
// data/webflow/webflow-redirects.csv is a manual export from April and may be
// stale. Rather than trust it, we ask the live site directly: for each known
// URL, what status does it return, and where does it end up?
//
// The output is the input to `npm run launch:verify-parity`, which replays the
// same URLs against the new site and fails on any behavioural difference. That
// pair is the launch gate: "no cutover without redirect parity verified"
// (CLAUDE.md, Hard Rules).
//
// Run: npm run launch:capture-live
//
// Writes data/webflow/live-behaviour.json (tracked — the verifier must be
// runnable from a clean clone, e.g. in CI).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

import { collectSeoExportPaths } from '@/lib/launch/seo-exports'
import { collectWebflowUrls } from '@/lib/launch/webflow-urls'

const LIVE_ORIGIN = 'https://www.cloudemployee.io'
const OUT_PATH = 'data/webflow/live-behaviour.json'

// Politeness, and self-preservation. This walks a customer's production site,
// which sits behind Cloudflare. A first pass at concurrency 5 with no delay got
// 1178 of 1275 URLs rate-limited (429) — and a 429 recorded as if it were the
// real answer would have silently poisoned the parity baseline, which is the one
// artefact the whole cutover is graded against. Slow, with retries, is correct.
const CONCURRENCY = 2
const REQUEST_DELAY_MS = 250
const MAX_HOPS = 5
const MAX_RETRIES = 5
const RETRY_BASE_MS = 2000

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Retry on 429 and on 5xx, backing off exponentially. Anything still rate-limited
// after MAX_RETRIES throws rather than returning a 429 as a result: a poisoned
// baseline is far worse than a failed run.
async function fetchWithRetry(url: string): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { redirect: 'manual' })
    if (res.status !== 429 && res.status < 500) return res
    if (attempt >= MAX_RETRIES) {
      throw new Error(`${url}: still ${res.status} after ${MAX_RETRIES} retries`)
    }
    const retryAfter = Number(res.headers.get('retry-after')) * 1000
    await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : RETRY_BASE_MS * 2 ** attempt)
  }
}

export type LiveBehaviour = {
  path: string
  /** Status of the FIRST response. This is what a crawler sees. */
  status: number
  /** Location header of the first response, normalised to a path where same-origin. */
  location: string | null
  /** Where the chain ends up after following redirects. */
  finalPath: string | null
  finalStatus: number | null
  hops: number
}

function toPath(url: string): string {
  try {
    const u = new URL(url, LIVE_ORIGIN)
    // Off-site destinations (talent.cloudemployee.io, calendly, ...) keep their
    // full URL: a redirect that leaves the origin is a materially different
    // outcome from one that stays on it, and parity must preserve that.
    if (u.origin !== LIVE_ORIGIN) return u.toString()
    return u.pathname.replace(/\/$/, '') || '/'
  } catch {
    return url
  }
}

async function probe(path: string): Promise<LiveBehaviour> {
  let current = `${LIVE_ORIGIN}${path}`
  let first: { status: number; location: string | null } | null = null
  let hops = 0

  for (;;) {
    await sleep(REQUEST_DELAY_MS)
    const res = await fetchWithRetry(current)
    const location = res.headers.get('location')

    if (first === null) {
      first = { status: res.status, location: location ? toPath(location) : null }
    }

    const isRedirect = res.status >= 300 && res.status < 400 && location
    if (!isRedirect || hops >= MAX_HOPS) {
      return {
        path,
        status: first.status,
        location: first.location,
        finalPath: toPath(current),
        finalStatus: res.status,
        hops,
      }
    }

    current = new URL(location, current).toString()
    hops++
  }
}

// Every URL that must not break at cutover: everything the April crawl saw, and
// every redirect source Webflow declares.
//
// Some rows in both sources are Webflow REGEX PATTERNS ("/resources/(.*)"), not
// URLs. Probing them is meaningless — Webflow happily matches the literal string
// against its own rule and substitutes a literal "%1" — and they showed up as
// phantom divergences in the first run. Skip anything that is not a path a
// browser could actually request.
function isProbeablePath(path: string): boolean {
  if (!path.startsWith('/')) return false
  if (path.includes('(') || path.includes('*') || path.includes('%')) return false
  // /cdn-cgi/* is Cloudflare's namespace, not the site's. It exists only because
  // Cloudflare fronts Webflow and will not exist on Vercel, so comparing it
  // across the two is meaningless.
  if (path.startsWith('/cdn-cgi/')) return false
  return true
}

async function collectUrls(): Promise<string[]> {
  const paths = new Set<string>()

  const add = (raw: string | undefined): void => {
    if (!raw) return
    const path = raw.replace(/\?.*$/, '').replace(/\/$/, '') || '/'
    if (isProbeablePath(path)) paths.add(path)
  }

  // The April crawl. Comprehensive, but three months old.
  const canonical = JSON.parse(
    readFileSync('data/webflow/ce-canonical-urls.json', 'utf-8'),
  ) as { canonicalUrls: Array<{ path: string }> }
  for (const u of canonical.canonicalUrls) add(u.path)

  // Every URL Webflow declares a redirect for. These are the legacy URLs with
  // inbound links; they are the whole reason the redirect table exists.
  const csv = readFileSync('data/webflow/webflow-redirects.csv', 'utf-8')
  for (const line of csv.split(/\r?\n/).slice(1)) add(line.split(',')[0]?.trim())

  // The LIVE sitemap, fetched fresh. Without this the corpus can only ever be as
  // current as the April crawl, so anything published since is invisible to the
  // gate — and a URL the gate never checks is a URL that breaks silently. This
  // is how the miscategorised /staff-augmentation/... post was nearly missed.
  const res = await fetchWithRetry(`${LIVE_ORIGIN}/sitemap.xml`)
  const xml = await res.text()
  for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    try {
      const u = new URL(match[1])
      if (u.origin === LIVE_ORIGIN) add(u.pathname)
    } catch {
      // A malformed <loc> is the sitemap's problem, not ours. Skip it.
    }
  }

  // Webflow itself. The authoritative list, and the only source that can see a
  // page which exists but has never been crawled, linked or ranked — every other
  // source describes pages someone has already looked at. /legals/general-terms
  // (live, both locales) and most of the /start-hiring funnel were invisible to
  // all of them. Every static page gets its /uk mirror too, since Webflow serves
  // both from the one page.
  const webflow = await collectWebflowUrls()
  for (const path of webflow.staticPaths) {
    add(path)
    add(path === '/' ? '/uk' : `/uk${path}`)
  }
  for (const path of webflow.cmsPaths) {
    add(path)
    add(`/uk${path}`)
  }
  console.log(
    `Webflow: ${webflow.staticPaths.length} static page(s), ${webflow.cmsPaths.length} CMS item(s)\n`,
  )

  const ownSources = paths.size

  // Search Console + Ahrefs. Everything above is the site describing itself, and
  // so can only ever list URLs the site still knows it has. These two describe
  // what the OUTSIDE WORLD still points at, which is the set that actually
  // carries ranking equity — including URLs deleted years ago whose backlinks
  // are still live. Missing exports are skipped, not an error.
  const { paths: seoPaths, summaries } = collectSeoExportPaths([new URL(LIVE_ORIGIN).host])
  for (const path of seoPaths) add(path)

  if (summaries.length > 0) {
    console.log('SEO exports:')
    for (const s of summaries) {
      if (s.onSite > 0) console.log(`  ${s.file}: ${s.onSite} on-site URLs`)
    }
    console.log(`  -> ${paths.size - ownSources} URLs the site itself never told us about\n`)
  } else {
    console.log(`No SEO exports found in data/seo-exports/. See its README — without them`)
    console.log(`the gate cannot see legacy URLs that still carry backlinks.\n`)
  }

  return [...paths].sort()
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let cursor = 0

  async function worker(): Promise<void> {
    for (;;) {
      const i = cursor++
      if (i >= items.length) return
      results[i] = await fn(items[i], i)
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

async function main(): Promise<void> {
  const paths = await collectUrls()
  console.log(`Probing ${paths.length} URLs against ${LIVE_ORIGIN} (concurrency ${CONCURRENCY})\n`)

  let done = 0
  const failures: string[] = []

  const settled = await mapWithConcurrency(paths, CONCURRENCY, async (path) => {
    const out = await probe(path).catch((err): null => {
      failures.push(`${path}: ${err instanceof Error ? err.message : String(err)}`)
      return null
    })
    done++
    if (done % 100 === 0) console.log(`  ${done}/${paths.length}`)
    return out
  })

  const results = settled.filter((r): r is LiveBehaviour => r !== null)

  // A URL we could not read is a hole in the baseline, not a data point. Refuse
  // to write a partial capture: a verifier run against an incomplete reference
  // would report parity it never actually checked.
  if (failures.length > 0) {
    console.error(`\n${failures.length} URL(s) could not be captured:`)
    for (const f of failures.slice(0, 20)) console.error(`  ${f}`)
    console.error('\nRefusing to write a partial baseline. Re-run when the site is reachable.')
    process.exit(1)
  }

  const byStatus = new Map<number, number>()
  for (const r of results) byStatus.set(r.status, (byStatus.get(r.status) ?? 0) + 1)

  mkdirSync(dirname(OUT_PATH), { recursive: true })
  writeFileSync(
    OUT_PATH,
    JSON.stringify({ origin: LIVE_ORIGIN, capturedAt: new Date().toISOString(), results }, null, 2),
  )

  console.log(`\nCaptured ${results.length} URLs -> ${OUT_PATH}\n`)
  console.log('First-response status distribution:')
  for (const [status, count] of [...byStatus].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${status || 'error'}  ${count}`)
  }

  const chains = results.filter((r) => r.hops > 1)
  if (chains.length > 0) {
    console.log(`\n${chains.length} URL(s) redirect more than once on the live site:`)
    for (const c of chains.slice(0, 10)) {
      console.log(`  ${c.path} -> ${c.location} -> ... -> ${c.finalPath} (${c.hops} hops)`)
    }
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

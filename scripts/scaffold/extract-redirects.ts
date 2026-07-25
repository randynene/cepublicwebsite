// Extracts redirect data from data/webflow/ into tracked TS files inside
// site/. next.config.ts must only import from tracked files, because Vercel
// builds from a clean clone.
//
// The three inputs live in data/webflow/ (tracked), NOT audit-output/
// (gitignored, holds PII). They used to be read from audit-output/, which meant
// the redirect table — the thing that carries three years of SEO equity across
// the cutover — could not be regenerated from a fresh checkout. The inputs are
// URL lists with no PII in them, so they belong in the repo.
//
// Webflow's redirect config cannot be re-exported through the API (the
// /sites/{id}/redirects endpoint is Enterprise-only, and this site is not on
// Enterprise). data/webflow/webflow-redirects.csv is therefore a manual export
// and can go stale. Do not trust it blindly: `npm run launch:capture-live`
// records what the live site ACTUALLY does for every known URL, and
// `npm run launch:verify-parity` fails the build if the new site disagrees.
//
// Re-run with: npm run redirects:extract
//
// Outputs:
//   site/src/lib/redirects/generated-redirects.ts  — crawl-discovered
//     301/302s from ce-canonical-urls.json (drops null-target rows).
//   site/src/lib/redirects/webflow-redirects.ts    — non-job-role rows
//     from webflow-redirects.csv (the 336 /live-job-role/* rows are
//     collapsed by the catch-all regex in next.config.ts).
//   site/src/lib/redirects/regex-redirects.ts      — 11 Webflow regex
//     rules from ce-regex-redirects.json, translated to Next.js
//     :path* syntax.
//
// Brief deviation noted in DEBUG_CONTEXT.md: brief Step 6d says
// webflow-redirects.ts is "hand-authored from the verified markdown
// source", but that markdown only contains summary stats + 5 examples.
// The 317 actual rows live in webflow-redirects.csv, so
// this script extends the same Step 6c extraction pattern to the CSV.

import fs from 'fs'
import { UrlStatus, type CanonicalUrl } from '../../src/lib/audit-types'

interface CanonicalUrlsPayload {
  canonicalUrls: CanonicalUrl[]
}

const REDIRECT_STATUSES: UrlStatus[] = [UrlStatus.REDIRECT_301, UrlStatus.REDIRECT_302]

// Sources handled by hand in next.config.ts `lockedRules`, so they must not also
// be emitted here. /our-work and /alternatives used to be in this set; they were
// removed because they are live 200 pages, not redirects (see next.config.ts).
const LOCKED_RULE_SOURCES = new Set(['/team'])

const JOB_ROLE_PREFIXES = ['/live-job-role', '/uk/live-job-role', '/ph/live-job-role']

// A Webflow rule whose source carries a query string cannot become a Next.js
// redirect: `source` matches the path only, so stripping the query broadens the
// rule to the bare path. CE's three /media/*.webp?width=... rules did exactly
// that, turning three URLs that 404 on live into 308s to the homepage — a
// soft-404, which is worse than the 404 it replaced. Drop them; the bare paths
// 404 on live and should 404 here.
function hasQueryString(source: string): boolean {
  return source.includes('?')
}

// Destinations that are not final: either a page we chose not to rebuild, or a
// URL that is itself only a redirect. Kept in sync with the lockedRules in
// site/next.config.ts and with data/webflow/parity-exceptions.json.
//
// Webflow's export points redirects AT these (/embed -> /embedding,
// /start-hiring -> /start-hiring/get-started). Carried over as-is each becomes a
// chain — /embed -> /embedding -> /how-it-works — and every hop leaks a little
// link equity, costs a round-trip, and passes through a URL that is not a page.
// Rewriting the destination to the real endpoint collapses them to one hop.
const REDIRECT_DESTINATION_REWRITES: Record<string, string> = {
  // Retired pages (see next.config.ts lockedRules).
  '/sourcing': '/how-it-works',
  '/embedding': '/how-it-works',
  '/retention': '/how-it-works',
  '/scale-this-week': '/start-hiring/contact-info',
  '/uk/sourcing': '/uk/how-it-works',
  '/uk/embedding': '/uk/how-it-works',
  '/uk/retention': '/uk/how-it-works',
  '/uk/scale-this-week': '/uk/start-hiring/contact-info',

  // /start-hiring/get-started is not a step of the US funnel — it is a redirect into
  // it. Webflow sends /start-hiring here, which would make every inbound link to
  // /start-hiring (it has 4 referring domains) take two hops to reach the first
  // real page. Collapsing the chain is correct.
  '/start-hiring/get-started': '/start-hiring/contact-info',

  // THE UK LINE IS NOT HERE, AND MUST NOT BE. /uk/start-hiring/get-started is a REAL
  // PAGE (HTTP 200) — it is the UK funnel's first step, the HubSpot form CE call
  // "Start Hiring (Part 1/8)". The US funnel has 8 pages and the UK one has 9, and
  // this is the extra one.
  //
  // Rewriting it collapsed a chain through a page that is not a redirect, so
  // /uk/start-hiring-now skipped the UK funnel's entry form and dropped visitors
  // straight into question two. next.config.ts already carries a comment warning
  // that the two locales' funnels are not the same shape, because this exact mistake
  // had already been made once — and then it was made again, here, in the generator.
  // The parity gate caught it: it was the last of 6,937 URLs to diverge.
}

function collapseDroppedTarget(destination: string): string {
  return REDIRECT_DESTINATION_REWRITES[destination] ?? destination
}

// /cdn-cgi/* is Cloudflare's own infrastructure namespace (email obfuscation,
// bot challenges), not the customer's site. It exists only because Cloudflare
// fronts Webflow, and it will not exist on Vercel. Webflow's export nevertheless
// declares a redirect for /cdn-cgi/l/email-protection, which the live site
// itself 404s — carrying it over would mean redirecting a path that does not
// exist to the privacy policy, for no reason.
function isInfrastructurePath(source: string): boolean {
  return source.startsWith('/cdn-cgi/')
}

// Redirect targets in the Webflow export are sometimes absolute URLs on the
// customer's own domain. Emitting those as-is bakes the current hostname into
// the redirect table (breaking CLAUDE.md rule 9: no CE-specific values in lib
// logic) and turns a same-origin redirect into an absolute one. Rewrite them to
// paths. The host set is derived from the crawl data rather than hardcoded, so
// this stays correct for the next customer.
// Compare hosts with the `www.` prefix stripped. The crawl recorded the apex
// (cloudemployee.io) while the redirect export writes the www form, so a naive
// exact match treats the site's own www URLs as off-site and leaves them
// absolute. Subdomains that are genuinely a different property — talent. — do
// not collapse under this and stay absolute, which is correct: they must remain
// cross-origin redirects.
function bareHost(host: string): string {
  return host.replace(/^www\./, '')
}

function siteHostsFrom(urls: Array<{ url?: string }>): Set<string> {
  const hosts = new Set<string>()
  for (const u of urls) {
    if (!u.url) continue
    try {
      hosts.add(bareHost(new URL(u.url).host))
    } catch {
      // Not a URL. The path-only rows are the common case; skip them.
    }
  }
  return hosts
}

function toRelativeIfSameSite(target: string, hosts: Set<string>): string {
  if (!target.startsWith('http')) return target
  try {
    const u = new URL(target)
    if (!hosts.has(bareHost(u.host))) return target // genuinely off-site (talent subdomain)
    return `${u.pathname}${u.search}`.replace(/\/$/, '') || '/'
  } catch {
    return target
  }
}

function isJobRolePath(path: string): boolean {
  return JOB_ROLE_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  )
}

// 1. Crawl-discovered redirects from ce-canonical-urls.json
const canonicalPayload: CanonicalUrlsPayload = JSON.parse(
  fs.readFileSync('data/webflow/ce-canonical-urls.json', 'utf-8')
)

const crawlRedirects = canonicalPayload.canonicalUrls
  .filter((u) => REDIRECT_STATUSES.includes(u.status))
  // Some crawl rows recorded a 301/302 status without a captured
  // destination. Those cannot become Next.js redirects — the Webflow
  // CSV export covers them.
  .filter((u): u is CanonicalUrl & { redirectTarget: string } =>
    typeof u.redirectTarget === 'string' && u.redirectTarget.length > 0
  )
  .filter((u) => !LOCKED_RULE_SOURCES.has(u.path))
  .filter((u) => !isInfrastructurePath(u.path))
  .map((u) => ({
    source: u.path,
    destination: collapseDroppedTarget(
      toRelativeIfSameSite(u.redirectTarget, siteHostsFrom(canonicalPayload.canonicalUrls)),
    ),
    permanent: u.status === UrlStatus.REDIRECT_301,
  }))

const crawlOutput = `// AUTO-GENERATED by scripts/scaffold/extract-redirects.ts
// Do not edit manually. Re-run the script if data/webflow/ changes.
import type { Redirect } from 'next/dist/lib/load-custom-routes'

export const crawlRedirects: Redirect[] = ${JSON.stringify(crawlRedirects, null, 2)}
`

fs.mkdirSync('site/src/lib/redirects', { recursive: true })
fs.writeFileSync('site/src/lib/redirects/generated-redirects.ts', crawlOutput)
console.log(`Extracted ${crawlRedirects.length} crawl redirects`)

// 2. Heterogeneous Webflow redirects from webflow-redirects.csv
// Tiny custom CSV parser — the file has just two unquoted columns.
const csvText = fs.readFileSync('data/webflow/webflow-redirects.csv', 'utf-8')
const csvRows = csvText
  .split(/\r?\n/)
  .slice(1) // header
  .filter((line) => line.trim().length > 0)
  .map((line) => {
    const idx = line.indexOf(',')
    if (idx === -1) return null
    return { source: line.slice(0, idx).trim(), target: line.slice(idx + 1).trim() }
  })
  .filter((row): row is { source: string; target: string } => row !== null)

// Drop query-string sources rather than stripping them (see hasQueryString).
const siteHosts = siteHostsFrom(canonicalPayload.canonicalUrls)
const seenSources = new Set<string>()
const webflowRedirects = csvRows
  .filter((row) => !isJobRolePath(row.source))
  .filter((row) => !LOCKED_RULE_SOURCES.has(row.source))
  .filter((row) => !hasQueryString(row.source))
  .filter((row) => !isInfrastructurePath(row.source))
  .map((row) => ({
    source: row.source,
    target: collapseDroppedTarget(toRelativeIfSameSite(row.target, siteHosts)),
  }))
  .filter((row) => {
    if (seenSources.has(row.source)) return false
    seenSources.add(row.source)
    return true
  })
  // Webflow exports don't include status codes — every row is a
  // permanent redirect (Webflow's UI only emits 301s for canonicalised
  // moves; CONTENT-1 can downgrade individual rows to 307 if needed).
  .map((row) => ({
    source: row.source,
    destination: row.target,
    permanent: true,
  }))

const webflowOutput = `// AUTO-GENERATED by scripts/scaffold/extract-redirects.ts
// Do not edit manually. Re-run the script if data/webflow/ changes.
//
// Source: data/webflow/webflow-redirects.csv (tracked). The /live-job-role/*
// rows are emitted one-per-slug by scripts/scaffold/generate-job-role-redirects.ts
// into job-role-redirects.ts; this file holds the heterogeneous redirects (page
// renames, blog rollups, locale moves), preserved individually per
// docs/investigations-2026-04-23/redirects-verification.md.
//
// They are NOT collapsed into a catch-all. That is what they used to be, and the
// catch-all over-matched: Webflow has no rule for 29 of the job slugs and 404s
// them, while the catch-all redirected them into a talent-site URL that is also a
// 404. A pattern that "obviously" generalises a list is a guess about the list.
import type { Redirect } from 'next/dist/lib/load-custom-routes'

export const webflowRedirects: Redirect[] = ${JSON.stringify(webflowRedirects, null, 2)}
`

fs.writeFileSync('site/src/lib/redirects/webflow-redirects.ts', webflowOutput)
console.log(`Extracted ${webflowRedirects.length} Webflow heterogeneous redirects`)

// 3. Webflow regex redirects from ce-regex-redirects.json
// Webflow uses (.*) capture with %1 reference; Next.js uses :path*.
// Strip query strings from sources — Next.js redirect sources don't
// match query strings by default, and the orphan media-file rules in
// CE's regex set are the only ones with queries.
interface WebflowRegexRedirect {
  pattern: string
  target: string
}
interface WebflowRegexPayload {
  count: number
  redirects: WebflowRegexRedirect[]
}

const regexPayload: WebflowRegexPayload = JSON.parse(
  fs.readFileSync('data/webflow/ce-regex-redirects.json', 'utf-8'),
)

// Webflow's (.*) capture maps to Next.js path-to-regexp. Two rules matter:
//
// NEVER emit ':slug*'. Zero-or-more matches the PARENT path as well as its
// children, so `/customer-stories/:slug*` swallows the bare `/customer-stories`
// hub, which is a real page that returns 200 on the live site. That is Tech Debt
// #37: it was patched by hand inside this generator's own output file, and the
// patch was destroyed the next time the generator ran. ':slug+' (one-or-more) is
// the faithful translation, because Webflow's `/customer-stories/(.*)` requires
// the separating slash and therefore does not match the bare parent either.
//
// The exception is a capture glued straight onto a segment with no separator
// (`/tools/price-comparison-calculator(.*)`). Webflow DOES match the bare path
// there — live 301s it — so that case emits two rules: an exact match plus a
// one-or-more wildcard.
function translateWebflowRegex(
  rule: WebflowRegexRedirect,
): Array<{ source: string; destination: string; permanent: boolean }> {
  // Query-string rules cannot be expressed as a Next.js redirect source. See
  // hasQueryString: stripping the query broadens the rule and manufactures a
  // soft-404. CE's 3 /media/*.webp?width=... rules are the only ones affected.
  if (hasQueryString(rule.pattern)) return []

  const cleanedPattern = rule.pattern
  const captureCount = (cleanedPattern.match(/\(\.\*\)/g) ?? []).length

  if (captureCount === 0) {
    return [{ source: cleanedPattern, destination: rule.target, permanent: true }]
  }

  const destination = rule.target.replace(/%1/g, ':slug+')

  // Separator-preceded capture: `/prefix/(.*)`. The bare `/prefix` must NOT
  // match, so one-or-more, and a single rule.
  if (cleanedPattern.endsWith('/(.*)')) {
    return [
      {
        source: cleanedPattern.replace(/\(\.\*\)/g, ':slug+'),
        destination,
        permanent: true,
      },
    ]
  }

  // Glued capture: `/prefix(.*)`. Webflow matches the bare `/prefix` too, and
  // path-to-regexp cannot express "optional suffix on the same segment", so
  // split it into the two cases.
  const noCapture = cleanedPattern.replace(/\(\.\*\)/g, '')
  return [
    { source: noCapture, destination: rule.target.replace(/%1/g, ''), permanent: true },
    { source: `${noCapture}/:slug+`, destination, permanent: true },
  ]
}

const regexRedirects = regexPayload.redirects.flatMap(translateWebflowRegex)

const regexOutput = `// AUTO-GENERATED by scripts/scaffold/extract-redirects.ts
// Do not edit manually. Re-run the script if data/webflow/ changes.
//
// Source: data/webflow/ce-regex-redirects.json. Webflow's (.*) + %1
// syntax has been translated to Next.js :slug* path-to-regexp syntax.
import type { Redirect } from 'next/dist/lib/load-custom-routes'

export const regexRedirects: Redirect[] = ${JSON.stringify(regexRedirects, null, 2)}
`

fs.writeFileSync('site/src/lib/redirects/regex-redirects.ts', regexOutput)
console.log(`Extracted ${regexRedirects.length} regex redirects`)

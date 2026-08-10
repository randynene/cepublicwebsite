import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Next.js 16 renamed the `middleware` convention to `proxy`. Same runtime
// position (before routing, before the response is produced), new filename and
// new export name. See node_modules/next/dist/docs/01-app/01-getting-started/
// 16-proxy.md and .../02-guides/upgrading/version-16.md. The `edge` runtime is
// not available under `proxy`; this file runs on Node, which is fine because it
// reads headers and does string work only.

// ---------------------------------------------------------------------------
// KILL SWITCH
// ---------------------------------------------------------------------------
// Set this to false to disable ALL geo redirecting in one line. Everything else
// in this file (the S1 whitespace trim, the x-pathname header) keeps working.
// This rule redirects every country outside an 11-code allow-list, so it needs
// an off switch that does not require unpicking any logic. See Tech Debt #63:
// a country rule ported from Cloudflare locked out CE's entire Philippines
// delivery team for 25 minutes on launch night.
const GEO_REDIRECT_ENABLED = true

// ---------------------------------------------------------------------------
// CE-48, server side
// ---------------------------------------------------------------------------
// Spec: docs/seo/GEO_ROUTING.md sections 2 and 4.7. Visitors from CE's buying
// markets see the normal marketing site. Everyone else goes to the
// engineer-facing page, which is what they are almost always here for.
//
// This replaces the GeoTargetly vendor rule rather than porting it. The vendor
// snippet hid the whole page with body{opacity:0} before it knew anything about
// the visitor, then waited a hardcoded 5,000 ms before restoring visibility
// whenever a redirect fired. That wait is the measured cause of the site's
// render delay, and every visitor from every country paid it. Deciding here
// costs nothing: Vercel already puts the country on the request.

// ISO 3166-1 alpha-2, matching what x-vercel-ip-country returns. GB, not UK:
// UK is not a valid ISO country code and never matches.
const ALLOWED_COUNTRIES: ReadonlySet<string> = new Set([
  'GB',
  'US',
  'AU',
  'NZ',
  'SG',
  'SE',
  'NO',
  'DK',
  'NL',
  'DE',
  'FR',
])

const GEO_REDIRECT_DESTINATION = '/for-developers'

// Substring matches against the pathname, exactly as the vendor rule had them.
// Two groups, and both matter:
//
// 1. The destination and its UK twin. /for-developers and /uk/for-developers are
//    both live 200s. Without these a visitor from an unlisted country landing on
//    either one is redirected to /for-developers forever. `for-developers` as a
//    substring covers both, but the explicit entries document the intent.
// 2. The engineer funnel and the legal pages. The audience being redirected is
//    exactly the audience that needs the assessments, and nobody should be
//    bounced off a privacy policy.
const GEO_EXCLUDED_PATH_SUBSTRINGS: readonly string[] = [
  'for-developers',
  '/uk/for-developers',
  'psychometric-test',
  'self-assessment',
  'initial-assessment',
  // The live path the assessment actually sits on. `psychometric-test` is a
  // legacy Webflow URL that 308s to /tools/culture-match, and next.config
  // redirects are evaluated BEFORE the proxy, so excluding only the old name
  // let the visitor be bounced on the very next hop. Excluding the substring
  // covers /tools/culture-match, /thank-you-culture-match and the UK twins.
  // (Verified in S5: /self-assessment and /initial-assessment are themselves
  // 404s now; they are kept above because the vendor rule listed them.)
  'culture-match',
  '/legals',
  '/uk/legals',
]

// Crawlers are never redirected. A crawler bounced off the marketing site does
// not just fail to read one page: it indexes, or cites, the engineer page in
// place of whatever it came for.
//
// This list is deliberately GENEROUS, and wider than the vendor rule's. The
// asymmetry is the whole argument. A crawler wrongly redirected costs indexed
// pages and AI citations across the site, quietly, for as long as nobody
// notices. A human wrongly served the marketing site costs one page view, and
// they can click through to /for-developers themselves. When in doubt, do not
// redirect. Adding a user agent here is close to free.
//
// The vendor rule listed only Googlebot and Bingbot, which was defensible when
// it redirected 12 LATAM and PH countries. CE-48 redirects everything outside an
// 11-code allow-list, so any crawler fetching from a non-allow-list IP is now in
// scope, and most of these fetch from wherever their infrastructure happens to
// be. The AI crawlers matter most: 8,640 Copilot citations are the strongest
// single asset in the 6 Aug audit (AUTH-08 and CONT-04 in
// audit-output/seo-intel/2026-08-06/analysis/authority.md), and AI citation is
// the headline metric of this SEO programme.
//
// Matched as lowercase substrings, so 'claudebot' also catches 'Claude-User'
// only if that string appears; add new agents verbatim rather than guessing at
// prefixes.
const BOT_USER_AGENT_PATTERNS: readonly string[] = [
  // Search
  'googlebot',
  'bingbot',
  'applebot',
  'duckduckbot',
  'yandexbot',
  // AI crawlers and answer engines
  'gptbot',
  'oai-searchbot',
  'chatgpt-user',
  'claudebot',
  'claude-user',
  'anthropic-ai',
  'perplexitybot',
  'perplexity-user',
  'google-extended',
  'bytespider',
  'ccbot',
  'meta-externalagent',
  // SEO tooling we measure ourselves with. If AhrefsBot is redirected, our own
  // crawl data quietly describes a site nobody is served.
  'ahrefsbot',
  'semrushbot',
  'screaming frog',
]

// Escape hatch. Appending ?r=0 to any URL disables the redirect for that one
// request, e.g. https://www.cloudemployee.io/pricing?r=0. Carried over from the
// vendor rule, and it is how this gets debugged in production without turning
// the whole thing off. Not remembered, not session scoped: one request only.
const GEO_ESCAPE_HATCH_PARAM = 'r'
const GEO_ESCAPE_HATCH_VALUE = '0'

// First visit only. The vendor rule ignored internal navigation, and without
// that a redirected visitor cannot browse the site at all: every click sends
// them back to /for-developers. A session cookie set at the moment we redirect
// records "this visitor has already been routed" and nothing redirects them
// again. Deliberately set ONLY on the redirect response, so ordinary visitors
// never receive a Set-Cookie header from this file.
const GEO_COOKIE_NAME = 'ce_geo_routed'

// Whitespace that a URL picked up on its way into someone else's HTML. The
// encoded forms are what actually arrive: %20 for a space, %09 for a tab, and
// the literal characters for clients that do not encode.
const EDGE_WHITESPACE = /^(?:%20|%09|%0a|%0d|\s)+|(?:%20|%09|%0a|%0d|\s)+$/gi

// Strips whitespace off the ends of a path so a link that was typed or pasted
// with a trailing space still lands somewhere.
//
// Tech Debt #65 / SEO session S1. A DR 91 backlink points at one of our URLs
// with a trailing %20 on it. The path does not exist with the space on the end,
// so the redirect table misses it and the visitor, and the equity, hit a 404
// over a character nobody meant to type. Rather than add a %20 twin for each of
// 773 redirect rules, normalise once here.
//
// This costs the malformed URL one extra hop: Next.js evaluates next.config
// redirects BEFORE proxy, so a trailing-space URL misses the table, gets
// trimmed here, and picks up its real redirect on the next request. One extra
// hop on a mistyped inbound link is a good trade against a 404, and the clean
// URLs (all of them, in practice) are untouched.
function trimPath(pathname: string): string {
  return pathname.replace(EDGE_WHITESPACE, '')
}

function isBotUserAgent(userAgent: string): boolean {
  const lower = userAgent.toLowerCase()
  return BOT_USER_AGENT_PATTERNS.some((pattern) => lower.includes(pattern))
}

function isExcludedPath(pathname: string): boolean {
  const lower = pathname.toLowerCase()
  return GEO_EXCLUDED_PATH_SUBSTRINGS.some((fragment) => lower.includes(fragment))
}

// Fails OPEN. A missing header, the "XX" placeholder Vercel sends when it cannot
// resolve an IP, or anything that is not two ASCII letters all mean "we do not
// know", and we never redirect on data we do not have.
function shouldRedirectCountry(rawCountry: string | null): boolean {
  if (rawCountry === null) return false
  const country = rawCountry.toUpperCase()
  if (!/^[A-Z]{2}$/.test(country)) return false
  if (country === 'XX') return false
  return !ALLOWED_COUNTRIES.has(country)
}

function shouldGeoRedirect(request: NextRequest): boolean {
  if (!GEO_REDIRECT_ENABLED) return false
  if (request.nextUrl.searchParams.get(GEO_ESCAPE_HATCH_PARAM) === GEO_ESCAPE_HATCH_VALUE) {
    return false
  }
  if (request.cookies.has(GEO_COOKIE_NAME)) return false
  if (isBotUserAgent(request.headers.get('user-agent') ?? '')) return false
  if (isExcludedPath(request.nextUrl.pathname)) return false
  return shouldRedirectCountry(request.headers.get('x-vercel-ip-country'))
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const trimmed = trimPath(pathname)

  // S1's trim runs FIRST. A path with trailing whitespace is not a path we want
  // to make a geo decision about; clean it up and let the next request through
  // the whole chain properly.
  if (trimmed !== pathname && trimmed.startsWith('/') && trimmed.length > 1) {
    const url = request.nextUrl.clone()
    url.pathname = trimmed
    return NextResponse.redirect(url, 308)
  }

  if (shouldGeoRedirect(request)) {
    const url = request.nextUrl.clone()
    url.pathname = GEO_REDIRECT_DESTINATION
    // The path is deliberately NOT preserved: there is one destination, and the
    // pages this visitor came from have no engineer-facing equivalent. The query
    // string IS preserved, matching the vendor rule, so campaign attribution
    // survives the hop.
    // 307, not 308: this is a decision about who is asking, not about where the
    // URL lives, and it must never be cached as permanent by a browser that
    // later travels.
    const response = NextResponse.redirect(url, 307)
    response.cookies.set(GEO_COOKIE_NAME, '1', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
    })
    return response
  }

  // Pass pathname to root layout so <html lang> can follow the same locale
  // signal as hreflang (en-US default, en-GB under /uk).
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)
  return NextResponse.next({ request: { headers: requestHeaders } })
}

// The proxy runs on page routes only. Everything excluded here is something a
// redirect would break rather than route:
//
// - `api/` is the big one. /api/lead is the POST target of the quick-hiring
//   form, and a 307 PRESERVES THE METHOD, so a lead from a non-allow-list
//   country would have been POSTed at /for-developers and lost silently. The
//   draft-mode routes are Sanity Presentation visual editing, and CE's delivery
//   team is in the Philippines, which CE-48 redirects, so they would have lost
//   visual editing with no error to explain it.
// - robots.txt and sitemap.xml are real routes (src/app/robots.ts and
//   sitemap.ts), not static files, so they were matching. The user-agent bypass
//   is not a safety net here: it only covers crawlers we named, and a crawler
//   that cannot read robots.txt is exactly the outcome robots.txt exists to
//   prevent.
//
// One negative lookahead rather than a second matcher entry, so there is a
// single place to read what this file does and does not see. `api(?:/|$)` so a
// future page route beginning with the letters "api" is not silently excluded.
export const config = {
  matcher: [
    '/((?!api(?:/|$)|_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}

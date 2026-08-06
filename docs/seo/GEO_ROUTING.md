# Geo routing - current state, the CE-48 fix, and where this should end up

Authored 6 Aug 2026, against ticket CE-48.

## 1. Where the logic actually lives

Not in this repo. `site/src/components/third-party-scripts.tsx` injects **three**
GeoTargetly snippets, each an independent rule configured in the GeoTargetly
dashboard:

| Rule id | Timestamp |
|---|---|
| `-OJz6mUkL51tX4CyQPmd` | 1740520761398 |
| `-OK8LE2WwpalZvadeMTu` | 1740692320540 |
| `-OK8QFN5yqnrUvZ_ZFAC` | 1740693636858 |

Our code knows nothing about which countries go where. It only loads the loader
and registers the callback the loader invokes by name. Changing the country
lists is a dashboard change, not a deploy.

## 2. The CE-48 rule spec, for the dashboard

Seb's requirement: visitors from supported buying markets see the normal site.
Everyone else goes straight to the engineer-facing page, with no choice offered.

**Allow through to the main site** (ISO 3166-1 alpha-2):

| Country | Code |
|---|---|
| United Kingdom | `GB` |
| United States | `US` |
| Australia | `AU` |
| New Zealand | `NZ` |
| Singapore | `SG` |
| Sweden | `SE` |
| Norway | `NO` |
| Denmark | `DK` |
| Netherlands ("Holland") | `NL` |
| Germany | `DE` |
| France | `FR` |

**Everything else** redirects to `https://www.cloudemployee.io/for-developers`.

Two things to get right when entering this:

- `GB` is the code for the United Kingdom. `UK` is not a valid ISO country code
  and some dashboards silently accept it and then never match.
- The redirect target must be excluded from its own rule, or a visitor from
  Nigeria landing on `/for-developers` gets redirected to `/for-developers`
  forever. Check GeoTargetly's page-exclusion setting before enabling.

**Before enabling, read Tech Debt #63.** On launch night a country rule ported
from Cloudflare locked out CE's entire Philippines delivery team and every
Filipino visitor for 25 minutes. This rule sends the Philippines to
`/for-developers` by design, which is the intent here - but confirm with the PH
team that they can still reach the pages they need for work, and check whether
`talent.cloudemployee.io` should be the target for them rather than
`/for-developers`.

## 3. Why this should not stay in GeoTargetly

The dashboard fix is the right move today, because it is reversible in seconds
and needs no deploy. It should not be the permanent answer, for three reasons.

**It is a measurable chunk of the render-delay problem.** Each of the three
snippets opens by injecting `body{opacity:0.0 !important}` and only restores
visibility when GeoTargetly's remote script answers - and if a redirect fires,
it waits a further 5,000 ms before doing so. That is the mechanism behind the
7,340 ms render delay documented in `docs/seo/SEO_PROGRAMME.md`. The page is
fully downloaded and deliberately held invisible, three times over, waiting on
a third-party host.

**A client-side redirect is the weakest kind for SEO.** Googlebot largely
crawls from US IPs, so it mostly sees the main site and this is not currently
an indexing catastrophe. But a JavaScript redirect passes no signal, costs a
round trip to `g10498469755.co` before anything renders, and puts a third
party's uptime in front of every page load on the site.

**We already have the data for free.** Vercel gives us `x-vercel-ip-country` on
every request, and we already read it - `VisitorCountryScript` uses it to gate
Hotjar. Doing the routing in middleware means a server-side 307 decided before
a single byte of HTML is sent: no flash, no hidden body, no 5-second wait, no
external dependency, and no opacity hack.

**Recommended sequence:** apply the dashboard fix now to satisfy CE-48, then
fold the migration to middleware into the SEO programme as part of the
render-delay work, and retire all three GeoTargetly rules in the same pass.
Doing it there rather than as a standalone change means the redirect behaviour
gets verified against the same before/after Lighthouse measurements, which is
the only way to prove the 7.3 s actually went away.

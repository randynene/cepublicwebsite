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

---

## 4. DASHBOARD EXPORT, captured 10 Aug 2026

Captured by Jake from the GeoTargetly dashboard, screen by screen. This section
is the SPEC that session S5 replicates server-side. Read it before writing any
middleware.

### 4.1 What is actually live

**Four setups exist. Exactly ONE is ON.**

| Setup | Website | State | Pageviews 30d | Targets 30d |
|---|---|---|---|---|
| New Geo Redirect | www.cloudemployee.io/ | OFF | 0 | 0 |
| **Marketing Website Locations Redirect** | www.cloudemployee.io | **ON** | 6,024 | 1,229 |
| Marketing Website Locations Redirect - UK | www.cloudemployee.io/uk | OFF | 0 | 0 |
| Marketing Website Locations Redirect - PH | www.cloudemployee.io/ph | OFF | 0 | 0 |

**This is the single most useful fact in this document.** The code in
`site/src/components/third-party-scripts.tsx` injects THREE loaders, one per
rule id in the table in section 1. Only one of those three rules does anything.
Two of the three body-hides, two of the three round trips to
`g10498469755.co`, and two thirds of the render-delay cost buy nothing at all.

### 4.2 The one live setup, in full

**General setup:** redirect ALL pages of `https://www.cloudemployee.io`.
Redirect visitors automatically upon visit (no permission popup). Location
selector NOT enabled.

**Segment 1, "UK": OFF.** Targets the United Kingdom plus effectively all of
Europe (Aland Islands, Albania, Andorra, Austria, Belarus, Belgium, Bosnia,
Bulgaria, Croatia, Czech Republic, Denmark, Estonia, Faroe Islands, Finland,
France, Germany, Gibraltar, Greece, Guernsey, Vatican, Hungary, Iceland,
Ireland, Isle of Man, Italy, Jersey, Latvia, Liechtenstein, Lithuania,
Luxembourg, Macedonia, Malta, Moldova, Monaco, Montenegro, Netherlands, Norway,
Poland, Portugal, Romania, Russian Federation, San Marino, Serbia, Slovakia,
Slovenia, Spain, Svalbard, Sweden, Switzerland, Turkey, Ukraine) plus New
Zealand and Australia. Destination `https://www.cloudemployee.io/uk`, with sub
page path passing, forced sub page passing, and query string passing all ON.
Page exclusions: `/uk`, `/ph`.

**DO NOT RESURRECT THIS SEGMENT WITHOUT A DECISION FROM JAKE.** It is off, it
has produced zero targets, and auto-redirecting every European visitor into
`/uk` is a content-geotargeting choice with real consequences, not a
performance detail. If UK routing is wanted later it belongs in the same
conversation as decision D1 and the UK programme, not in S5.

**Segment 2, "Phillipines": ON.** This is the only rule with live traffic.

- Countries: Philippines, Brazil, Peru, Chile, Argentina, Colombia, Bolivia,
  Nicaragua, Uruguay, Paraguay, Ecuador. In ISO 3166-1 alpha-2, matching what
  `x-vercel-ip-country` returns: `PH`, `BR`, `PE`, `CL`, `AR`, `CO`, `BO`,
  `NI`, `UY`, `PY`, `EC`.
- Destination: `https://talent.cloudemployee.io`.
- **Sub page path passing is OFF; query string passing is ON.** So every
  matching visitor lands on the talent-site ROOT regardless of which page they
  arrived on, carrying the query string. Do not "improve" this by preserving
  the path: talent.cloudemployee.io is a separate Webflow site with different
  URLs, so a preserved path would 404.
- Page exclusions (11): `/uk`, `/ph/for-developers`, `/ph/legals`,
  `/ph/downloads`, `/ph/resources`, `/legals`, `/uk/legals`,
  `psychometric-test`, `self-assessment`, `initial-assessment`,
  `for-developers`. Note these are substring matches, not exact paths.

**Segment 3, "All Other Locations": OFF.**

### 4.3 Advanced settings that MUST be preserved

These are the difference between a faithful port and a support incident.

- **External sources only, first visit only.** "Redirect visitors from external
  sources only. This will redirect the visitor only on first visit to your
  website. Any internal navigation will be ignored." ENABLED. A naive
  middleware port that redirects on every request would trap a Filipino visitor
  who clicks any internal link.
- **Referrer bypass:** skip the redirect if the visitor came from
  `https://www.cloudemployee.io/ph` or `https://www.cloudemployee.io/uk`.
- **Cookie time: 0** (bypassed visitors are not remembered for a fixed window).
- **User agent bypass:** `Googlebot`, `Bingbot`.
- **Escape hatch:** `?r=0` in the URL disables the redirect. Not remembered for
  any hours, not session-scoped. Keep an equivalent, and keep it documented -
  it is how you debug this in production without turning the rule off.

### 4.4 The body-hide, verbatim

From the Tracking code tab of the live setup:

```
<style id="georedirect1740520761398style">body{opacity:0.0 !important;}</style>
...
georedirect1740520761398loaded=function(redirect){var to=0;if(redirect){to=5000};
setTimeout(function(){s();},to)};
```

Three things this confirms, and they were previously inference:

1. **The 5,007 ms render delay is literally `to=5000` plus overhead.** It is not
   a mystery to be profiled. It is a hardcoded 5-second wait before the page is
   allowed to become visible when a redirect fires.
2. **The style is injected unconditionally, before any country is known.** So
   EVERY visitor from EVERY country pays the hidden-body wait on first visit
   while the vendor script is fetched, not only the 494 who get redirected.
3. **The user-agent bypass does not save crawlers from the body-hide.** The
   whitelist is evaluated inside the vendor's script; the `opacity:0` style is
   already in the document by then. This resolves the PERF-05 contradiction:
   Ahrefs' throttled mobile lab starves the un-hide on every page, which is why
   "no page performs well" there while fast desktop field traffic resolves it.
   Google rendering pages at `opacity:0` is a real risk, not lab pedantry.

### 4.5 Volume, for sizing the change

August to date: 2,443 pageviews saw the script, 494 were redirected by the
Philippines segment. So roughly 20 percent of affected traffic is actually
routed, and 100 percent of it pays the render cost.

### 4.6 Both open questions, now answered

1. **CE-48 was never applied, and Jake has confirmed it is still what he
   wants.** Decided 10 Aug 2026. The section 2 spec stands: the 11-country
   allow-list sees the normal site, and EVERYONE ELSE goes to
   `/for-developers`. From there a visitor who wants to see jobs clicks through
   to `talent.cloudemployee.io` themselves. So S5 does NOT port the live
   LATAM-to-talent rule. It replaces it. See 4.7.
2. **Geo Location: nothing to capture.** One setup, "New Geo Location", OFF,
   0 pageviews, 0 targets. Never used. Combined with the three OFF Geo Redirect
   setups, the entire GeoTargetly account performs exactly ONE function, and S5
   removes it. **The subscription is cancellable once S5 ships and is verified.**

### 4.7 What S5 has to build - REVISED per Jake's 10 Aug decision

**Do not port the live rule. Implement CE-48 instead.** This is a deliberate
behaviour change, not a like-for-like migration, and it is a bigger change than
the performance work that motivated it. Sequence it carefully.

**The rule:** if `x-vercel-ip-country` is NOT in the allow-list, redirect to
`/for-developers`. Allow-list (section 2): `GB`, `US`, `AU`, `NZ`, `SG`, `SE`,
`NO`, `DK`, `NL`, `DE`, `FR`.

**Carry these over from the dashboard export, they are not optional:**

- **Exclude the destination from its own rule.** A visitor from Nigeria landing
  on `/for-developers` must not be redirected to `/for-developers`. Same for
  its UK twin if one exists.
- **Exclude the engineer-funnel and legal paths** already excluded in the live
  rule: `psychometric-test`, `self-assessment`, `initial-assessment`,
  `for-developers`, `/legals`, `/uk/legals`. These are substring matches. They
  exist because the audience being redirected is exactly the audience that needs
  those pages.
- **Bypass `Googlebot` and `Bingbot`.** Non-US crawler IPs must not be
  redirected away from the marketing site.
- **Keep an `?r=0` escape hatch**, and document it. It is how this gets
  debugged in production without disabling the rule.
- **First visit / external referrer only.** The live rule ignores internal
  navigation. Preserve that semantic or a redirected visitor cannot browse.

**Read Tech Debt #63 before shipping this.** On launch night a country rule
locked out CE's entire Philippines delivery team for 25 minutes. This rule
deliberately sends the Philippines to `/for-developers`, which is now the
intended behaviour - but it is the same shape as the incident. Therefore:

- Tell the PH team before it goes live, and confirm the paths they need for work
  are either in the exclusion list or reachable from `/for-developers`.
- Ship it behind something that can be turned off in one commit, and state in
  the PR exactly how to disable it.
- Verify by spoofing several countries, including at least one allow-list
  country, one excluded path, and one crawler user agent.

**Then remove the vendor entirely.** Delete all three snippets from
`site/src/components/third-party-scripts.tsx` and every `body{opacity:0}`
injection with them.

**Free win available immediately, ahead of S5.** Two of the three snippets
(`-OK8LE2WwpalZvadeMTu`, `-OK8QFN5yqnrUvZ_ZFAC`) correspond to dashboard setups
that are switched OFF. They inject a body-hide and make a round trip to
`g10498469755.co` on every page load and change nothing. They can be deleted on
their own, with no behaviour change, before any of the above. If those two
dashboard setups are ever re-enabled they will silently do nothing until the
snippets are restored.

# Technical Health Lens (TECH-*)

Analyst run: 8 Aug 2026. Machine-readable twin: `technical-health.json`.

**Method note before anything else:** `MANIFEST-gsc.md` says `gsc/url-inspection.json`
holds 109 URLs. It now holds **890 records** (891 ok, 1 failed; file mtime 8 Aug
11:29) - the sample was extended after the manifest was written. Every GSC-inspection
number below is from the 890-record file. Zero talent.cloudemployee.io URLs are in it.

A second snapshot caveat: `ahrefs/site-audit-issues.json` and the CSV folder
`ahrefs/site-audit/cloudemployee_06-aug-2026_all-issues_.../` are **different crawl
snapshots** and disagree on several counts (links-to-broken-page: 55-row CSV vs 570 in
issues.json; IndexNow: 5,051 vs 55). I cite the CSV folder throughout as the export
tied to the 6 Aug crawl, and flag the discrepancy in TECH-12.

Every "live-verified" claim below was checked with curl against production on 8 Aug,
not read from a document.

---

## TECH-01 (CRITICAL) - Google is refusing to index the UK locale

This is the finding everything else in this lens orbits.

Google's own verdicts (`gsc/url-inspection.json`, coverageState by locale):

| Coverage state | US | UK |
|---|---|---|
| Submitted and indexed | 232 | **15** |
| Duplicate, Google chose different canonical | 1 | **41** |
| Duplicate without user-selected canonical | 3 | **8** |
| URL is unknown to Google | 326 | 82 |
| Crawled - currently not indexed | 91 | 17 |

Of the 53 duplicate verdicts, **46 are a UK page where Google discarded our
self-canonical and selected the US twin** - `/uk/pricing` -> `/pricing`,
`/uk/how-it-works` -> `/how-it-works`, `/uk/services/full-stack-developers` ->
`/services/full-stack-developers`, and so on. hreflang is present and 323/326 pairs
reciprocal (TECH-10), but hreflang does not save word-identical bodies:
`crawl/uk-us-pairs.json` shows **307 of 326 UK pairs word-identical**, and Ahrefs'
independent duplicate-content report agrees (389 URLs, 192 hash groups, **183 of them
pure UK/US pairs** - `site-audit/...duplicate-content...csv`).

What the UK mirror earns (`joined/pages.json`, status=200):

- UK: 368 pages, **4,522 impressions / 56 clicks** in 90d - and 49 of those 56 clicks
  are the `/uk` homepage.
- US: 3,475 pages, 483,430 impressions / 1,168 clicks.

So roughly half the 653-URL sitemap is spent on a locale earning ~1% of impressions,
and Google is actively folding it into the US site anyway. The current state is the
worst of both: we pay the crawl/index cost of 326 pages and get neither UK rankings
nor clean consolidation (Google decides page-by-page, inconsistently).

**Decision for Jake/Seb, not code:** (a) accept consolidation - canonicalise
word-identical `/uk/` pages to the US URL and drop them from the sitemap, keeping the
18 genuinely-different UK pages; or (b) actually differentiate the UK pages worth
ranking (currency, spelling, UK proof points). Days of effort either way. Doing
nothing is the only wrong option.

## TECH-02 (HIGH, quick win) - VideoObject missing uploadDate; video rich results ineligible

The only structured-data error that survives on **post-cutover** crawls of our new
site. Five `/videos/*` pages Google crawled 5-7 Aug carry ERROR "Missing field
'uploadDate'" (`gsc/url-inspection.json`). **Live-verified 8 Aug:** the production
VideoObject on `/videos/employee-experience` has name/description/thumbnailUrl/embedUrl
and no `uploadDate`. 44 pages emit VideoObject (`crawl/json-ld.json`). One older page
also shows "Invalid datetime / missing time zone" warnings, so emit full ISO 8601 with
offset. ~3h template fix; Sanity already holds the dates. This is what Ahrefs' "370
schema.org validation errors" is mostly made of.

## TECH-03 (MEDIUM, quick win) - 434 apex-host internal links, each a forced 308

Of 729 internal-link instances pointing at redirects
(`Warning-indexable-Page_has_links_to_redirect-links.csv`): **434 (60%) target
`https://cloudemployee.io/...`** - the apex host, missing www - written into blog and
compare body copy in Sanity. Another 49 target the retired
`/tools/price-comparison-calculator` (308 -> `/pricing`), and 166 more target various
internal redirects; 153 distinct source pages. Everything resolves, so this costs a
hop and some link-signal dilution, not rankings. One Sanity Portable Text patch script
fixes the lot; add a content-lint so customer-2 migrations can't reintroduce it. This
reconciles the brief's "776 links to redirects" - the CSV holds 729 link rows.

## TECH-04 (MEDIUM, decision) - 51 previously-noindex pages silently became indexable

`Notice-Noindex_page_became_indexable.csv`: 30 `team/*`, 10 `book-a-call/*`,
`/for-developers` x2, `/customer-story/travelx` x2, `/technology/android-studio` x2,
best-staff-augmentation-companies x2. **Live-verified:** all sampled pages now serve
`index, follow`. (GSC still shows 9 as "Excluded by noindex" - stale Webflow-era
crawls; Ahrefs is right about the present.) Team pages indexable is the deliberate
TEMPLATE-TEAM_MEMBER design. The 10 personal `/book-a-call/*` pages were noindex on
Webflow and are thin, near-duplicate booking forms - recommend restoring noindex
there. 10-minute decision, then trivial.

## TECH-05 (MEDIUM, quick win) - 4 redirects sitting in the 653-URL sitemap

`crawl/sitemap-not-200.json` + Ahrefs concur: `/customer-story/virgin` (both
locales, doc retired), `/tools/price-comparison-calculator` (moved into /pricing),
`/compare/cloud-employee-vs-arc-dev` (the deliberate parity shadow, Tech Debt #55, 2
hops). Google already lists the calculator as "Page with redirect". Also add
`/technology/android-studio` + UK twin to the sitemap (indexable, absent -
`Notice-Indexable_page_not_in_sitemap.csv`). Real orphans are otherwise **zero**:
the 7 rows in `crawl/orphans.json` are 6 query-param artifacts + /sitemap.xml itself.

## TECH-06 (LOW, quick win) - 28 redirect chains, worst 3 hops

`crawl/redirect-chains.json`: `/hire` -> `/start-hiring` -> `/start-hiring/contact-info`
-> `/book-a-call` (3 hops); five `/compare/*` all 2-hop via the retired `/compare` ->
`/alternatives`; `/book-a-cto-consultation` -> `/book-anto` -> `/book-a-call/anto`.
Plus exactly **1 broken redirect**, in the dead /ph namespace
(`/ph/services/filipino-developers?utm...` -> a 404). All tidiness: 308s pass full
signal and every chain lands on a 200. Collapse first hops in the tracked redirect
tables; ~3h.

## TECH-07 (LOW) - JSON-LD is healthy; one template inconsistency

`crawl/json-ld.json`: **0 invalid blocks on all 656 pages**; Organization + WebSite +
SiteNavigationElement sitewide; BlogPosting on 193, FAQPage on 428, Service on 39,
VideoObject on 44, Person on 51, Review on 16. The gap: **190 `technology/*` pages
emit WebPage where the parallel `services/*` template emits Service.** Google's 23
"Unparsable structured data" parse errors are all **pre-cutover Webflow crawls** -
falsified as a current problem (0 parse errors in our own crawl of the new site).
One watch item: Google's Breadcrumbs rich results show "Unnamed item" on 249 of 354
items - mixed-age crawls, not re-verified live; spot-check one post-cutover URL
before acting. Tech Debt #49 (nav JSON-LD skips serializeJsonLd) has no
crawl-visible symptom in this data - code hygiene only.

## TECH-08 (LOW, quick win) - US redirects without UK mirrors -> UK 404s

Live-verified: `/managing-engineers/software-developer-performance-metrics-for-ctos`
308s to its hub while `/uk/` same path **404s**; same shape for
`/download/our-internal-hiring-sop` (US 308 -> `/`, UK 404). Three more pairs in
`crawl/urls.json`. ~5 URLs, near-zero traffic, but it's systematic: retiring a US doc
adds a US-only redirect, and the gap grows silently. Mirror locale in the redirect
generator; backfill the 5.

## TECH-09 (LOW, no action) - the scary GSC numbers are mostly Google's memory of Webflow

358 of 491 inspected records with a crawl date were last crawled **before** cutover.
The 7 "Blocked by robots.txt" (`/live-job-role/*`) are stale - live robots.txt
(fetched 8 Aug) is `Allow: /` + `Disallow: /download-thank-you/` only, and
/live-job-role now 308s offsite to talent. The 36 "Not found (404)" are 28 dead-/ph/*
+ 3 ancient /blog/* + 3 live-job-role + 2 retired team members - all explained. The
three "/" duplicates showing "Page with redirect" are the http/apex entry points
correctly 308ing to https://www - **not a bug**. Self-heals; 133 post-cutover crawls
in 5 days shows recrawl underway. The one number worth re-measuring at the 31 Aug
read: **108 "Crawled - currently not indexed" (91 US)**. Optional: 410 the /ph/*
namespace to clear Google's memory faster.

## TECH-10 (LOW) - hreflang: 3 real failures out of 326 pairs

`crawl/hreflang.json`: 9 non-reciprocal, 6 of them query-param crawl artifacts. The 3
real: `/uk/compare/cloud-employee-vs-arc-dev` (US twin is the parity-shadow 308),
`/uk/team/caitlin-murray` (Tech Debt #58, UK-only member), `/uk/tools/price-comparison-calculator`
(US twin 308s). Matches Ahrefs' count of 3 exactly. Cosmetic; fold into TECH-01/05.

## TECH-11 (LOW, no action) - "duplicate content beyond UK" dissolves on inspection

The brief asked what the ~80 non-UK Ahrefs duplicates are. Answer: **the same UK
problem plus parameter noise.** 389 duplicate URLs -> 192 hash groups -> 183 pure
UK/US pairs; the 9 remaining groups are `?utm_source=chatgpt.com`, Webflow pagination
params and calculator state params, all already canonicalising to the clean URL
(Ahrefs' own Canonical_URL_changed.csv shows the canonical working) with `?page=N`
pagination noindexed by design. Defenses working; nothing to fix. Synthesis: do not
count Ahrefs-389 and crawl-307 as two problems.

## TECH-12 (LOW, no action) - crawl-efficiency trivia, and one unreproducible number

- 19 URLs with >3 params: 13 are `/_next/image` optimizer internals, 6 are
  calculator/pricing state. Cosmetic.
- IndexNow: 5,051 eligible pages flagged (6 Aug CSV) - IndexNow simply isn't wired.
  Optional nice-to-have given the Copilot/Bing channel; nothing is broken.
- **The brief's "879 links to URLs blocked by robots.txt" did not reproduce.** Live
  robots.txt blocks only `/download-thank-you/`, and the crawl's internal-link graph
  contains **0** links to that prefix. The figure is not in any file I could find;
  treat as unverified until its source surfaces.

---

## CROSS-LENS NOTES

- **Content lens:** the UK question (TECH-01) is ultimately a content-investment
  decision; the technical fix is trivial once decided. Also `?utm_source=chatgpt.com`
  appears organically across crawled URLs - ChatGPT referral traffic is real and
  belongs to the AEO/traffic lens.
- **Performance lens:** `crawl/response-times.json` exists (6,520 rows, single
  uncached samples) - I did not analyse it; single-sample response times are theirs
  to treat with care. Ahrefs "Slow page": 44.
- **Links lens:** 211 indexable pages have only one dofollow incoming internal link
  (`Notice-indexable-Page_has_only_one_dofollow_incoming_internal_link.csv`); 570-vs-55
  links-to-broken-page snapshot discrepancy noted in TECH-12; most broken-link targets
  are EXTERNAL rot (centumsearch.com, sciflare.com, a Glassdoor URL) - external link
  hygiene is their angle.
- **Traffic lens:** "Organic traffic dropped": 1 page; "Pages dropped from Top 10": 2
  (`ahrefs/site-audit-issues.json`) - remarkably quiet for day 5 of a migration, but
  per the shared caveat, no verdict until ~31 Aug.
- **On-page lens:** Open Graph tags incomplete: 579 (issues.json) / 1,444 link rows
  (CSV); title too long: 42; meta description missing: 2, too long: 75. I did not dig
  - clearly theirs.

## DATA GAPS

- **URL inspection covers 890 of ~1,070 of our impression-bearing pages** - good, but
  the manifest is stale (says 109). Whoever owns the manifests should regenerate.
- **The "879 robots-blocked links" source** - not found in gsc/, crawl/, or ahrefs/;
  either a pre-brief number from a superseded crawl or a different property.
- **Ahrefs site-audit has two disagreeing snapshots** (CSV folder vs
  site-audit-issues.json). A single re-export after the 17 Aug quota reset would
  remove the ambiguity.
- **No per-URL Lighthouse** (known; lighthouse_score null throughout).
- **Breadcrumb "Unnamed item"** needs one post-cutover rich-results check in the GSC
  UI to confirm or dismiss - the API data mixes crawl ages.

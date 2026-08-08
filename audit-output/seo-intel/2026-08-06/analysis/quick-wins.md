# Lens 1 - Quick Wins

Analyst date: 8 Aug 2026. Data: audit-output/seo-intel/2026-08-06/. All GSC numbers are our hosts only (talent.cloudemployee.io excluded). All claims cite their source file.

## THE FRAME FIRST (QW-01): rank by clicks, not impressions

Before any quick-win table, one finding re-sizes everything else.

**Impressions exploded; clicks did not move.** Monthly, from `gsc/full-date.json`:

| Month | Impressions | Clicks | CTR |
|---|---|---|---|
| 2025-10 | 32,195 | 538 | 1.67% |
| 2026-01 | 109,457 | 523 | 0.48% |
| 2026-03 | 133,722 | 597 | 0.45% |
| 2026-06 | 177,865 | 543 | 0.31% |

**The CTR-by-position curve is not a blue-link curve.** From `gsc/full-query-x-page.json`, 16 months, impression-weighted:
pos 5 = 0.13%, pos 6 = 0.11%, pos 8 = 0.04%, pos 10 = 0.05%. Question-shaped queries: 62,656 impressions, **8 clicks** (0.013%).

**The last 10 days (29 Jul-7 Aug, pre+post cutover files): brand 1,047 imp / 66 clicks; non-brand 31,253 imp / 10 clicks.** The site currently earns roughly one non-brand Google click per day.

The high-impression "striking distance" inventory is dominated by synthetic, AI-shaped queries that never click: "causalens engineering challenges nearshoring" (483 imp, pos 5.2, 0 clicks), "number of employees at cloudcomunicaciones.cl" (513 imp, pos 7.9, 0 clicks, /about-us), "toptal voucher/vouchers/codes" (~700 imp combined, /compare/toptal-vs-upwork). These look like AI Overview / AI Mode / conversational surfaces registering impressions with no click behaviour.

**Consequence:** "1,400 impressions at position 11, move to 5, gain ~60 clicks" arithmetic is invalid on most of this impression base. Every impact estimate below uses OBSERVED CTRs and is honest about being small. The real traffic upside for this site short-term is (a) the small set of commercial queries that do click, (b) AI-citation presence - which is another lens's territory (see cross-lens notes).

**Correction to the brief:** there is no "toptal alternatives" query at position 4 pointing at /alternatives anywhere in the 16-month query x page data (`gsc/full-query-x-page.json`). The largest alternatives-family query is "alternatives to nearshore software development outsourcing" - 2,216 imp, pos 4.8, 0 clicks - pointing at the blog post `/scaling-teams/why-consider-alternatives-to-software-development-outsourcing`. The known example the brief asked us to verify does not hold.

---

## THE MONDAY TABLE - everything shippable inside two weeks, best first

| # | Finding | What to ship | URLs | Hours | Who | Expected gain (arithmetic shown) | Quick win? |
|---|---|---|---|---|---|---|---|
| 1 | QW-02 | Sitemap/redirect/hreflang hygiene: drop 4 redirecting URLs from sitemap; fix the /ph/services/filipino-developers 308-to-404 chain; stop /uk pages hreflang-ing to 308/404 twins; fix 1 internal link to a missing /uk article | 12 | 3 | Claude | No direct clicks; removes 12 crawl defects in week 1 of Google re-evaluating the migration. Highest certainty, lowest risk | YES |
| 2 | QW-04 | Re-point internal links that hit redirects (scripted Sanity content pass, aggregate the -links.csv by target) | 257 pages, 76 with impressions | 6 | Claude | Link equity through 1 hop not 2 during re-indexing; no click arithmetic claimed | YES |
| 3 | QW-03 | Add contextual internal links to the ~20 one-inlink pages with impressions and pos 4-20. Headline case: /compare/toptal-vs-upwork = 44,019 imp/90d, pos 7.0, ONE dofollow inlink (vs 330 on /services/philippines-developers) | ~20 | 8 | Claude | At observed CTR 0.03-0.09% a 3-pos gain is single-digit clicks/mo per page, but the clicking sub-queries (costs post: 24 clicks/90d) are the ones that benefit. Est. 10-30 clicks/mo across set, LOW confidence | YES |
| 4 | QW-06 | Fix metadata defects only on impression-bearing pages: 20 long titles, 33 long descriptions, 9 missing descriptions (review-detail + legal templates = 2 template fixes, not 9 page fixes) | ~55 | 6 | Claude | Affected set earns ~60 clicks/90d; +20-40% CTR on the clicking subset = 5-15 clicks/mo | YES |
| 5 | QW-07 | Align the 26 titles Google rewrites (all 26 have impressions; includes /, /about-us, typescript-developers, latam-developers). Sanity metaTitle edits only; H1s stay per Tech Debt #43b | 26 | 4 | Claude | Cheapest CTR lever on exactly the pages with clicks; 5-20 clicks/mo, LOW confidence. Overlaps #4 - do together | YES |
| 6 | QW-09 | Replace/remove 27 dead external links (batch with #2's scripted pass) | 27 | 2 | Claude | Trust/quality polish; no click claim | YES |
| 7 | QW-05 | Philippines cannibalisation: 301 /services/filipino-developers and /hire/philippines-offshoring into /services/philippines-developers; same for /hire/no-code-developers and /hire/full-stack-developers duplicates | 7 | 4 | **Jake decides** | Consolidates the split "hire developers philippines" family (1,156+290+274+244+213+316... imp across 3 pages, pos 9-17); est. 5-15 clicks/mo + removes duplicate-content risk | NO (needs decision) |
| 8 | QW-08 | Watchlist only: 11 Ahrefs traffic-drop pages + 1 top-10 dropout. Re-measure 31 Aug | 12 | 1 | Claude | None now; prevents shipping "fixes" for drops a 5-day window cannot confirm | YES |

Total Claude effort rows 1-6+8: ~30 hours. Everything is reversible; nothing needs design work or new content.

---

## Findings in detail

### QW-02 - Launch-week hygiene defects (medium, 3h)
- Sitemap 308s (`Error-3XX_redirect_in_sitemap.csv`): `/customer-story/virgin`, `/uk/customer-story/virgin`, `/tools/price-comparison-calculator` (52 inlinks, redirects to /pricing), `/compare/cloud-employee-vs-arc-dev` (redirects to /compare which itself 308s - a 2-hop chain in the sitemap).
- Broken redirect (`Error-Broken_redirect.csv`): `/ph/services/filipino-developers?utm_source=chatgpt.com` 308 → `/ph/services/philippines-developers` → 404. Note the utm_source=chatgpt.com: an AI assistant is sending this traffic somewhere that dies.
- Hreflang to non-200 (`Error-Hreflang_to_redirect_or_broken_page.csv`): `/uk/tools/price-comparison-calculator`, `/uk/team/caitlin-murray` (US twin 404s - this is known Tech Debt #58, Seb decision), `/uk/compare/cloud-employee-vs-arc-dev`.
- 404s with inlinks (`Error-404_page.csv`): 4, incl. `/uk/managing-engineers/software-developer-performance-metrics-for-ctos` linked from `/uk/compare/cloud-employee-vs-arc-dev`.

### QW-03 - Internal link starvation on the exact pages that rank (high, 8h)
54 of the 211 one-inlink pages (`Notice-indexable-Page_has_only_one_dofollow_incoming_internal_link.csv`) have 90d impressions (joined/pages.json). The distribution is absurd: `/services/philippines-developers` has 330 incoming internal links; `/compare/toptal-vs-upwork`, the single biggest non-brand impression earner on the site (44,019/90d, pos 7.0), has 0-1. Also starved: arc-dev-alternatives guide (5,286 imp, pos 8.4, 1 inlink), `/services/front-end-developers` (3,665, 1 inlink), `/nearshoring-offshoring/nearshore-vs-offshore-costs-...` (27,802 imp, pos 7.2, 4 inlinks) - that costs post is also the top non-brand CLICK earner (24 clicks/90d), so it is the one page where a position gain demonstrably pays.
Do not bulk-fix all 211 - most earn nothing.

### QW-05 - Cannibalisation (high, but needs Jake)
266 non-brand queries have 2+ pages with >=50 impressions (16m aggregate of `full-query-x-page.json`). Most are noise or resolved namespaces (/blog/*, /resources/* are gone). The real, live clusters, all pages 200 + indexable in joined/pages.json:
1. **Philippines**: `/services/philippines-developers` (330 inlinks, 17,064 imp/90d) vs `/services/filipino-developers` vs `/hire/philippines-offshoring`. Queries split three ways ("hire developers philippines" 274/244/213 across the three).
2. **No-code**: `/services/no-code-developers` (1,206 imp on "hire no code developers", pos 11.7) vs live duplicate `/hire/no-code-developers` (204 imp, pos 18.8).
3. **Full-stack**: `/services/full-stack-developers` (799 imp) vs `/hire/full-stack-developers` (56 imp).
Caveat to check before shipping: if /hire/* and /services/filipino-developers were live on Webflow, this is inherited cannibalisation, not migration damage - still worth fixing, but it changes the parity-exceptions bookkeeping.

### QW-06 / QW-07 - Metadata (medium, 10h combined)
Site-audit counts confirmed and intersected with impressions: titles too long 46 → 20 matter; descriptions too long 71 → 33 matter; descriptions missing 18 → 9 matter (8 are /reviews/* detail pages + /legals/general-terms: TEMPLATE-level gaps, two fixes not nine). SERP-title mismatch 26 → all 26 matter (`Notice-indexable-Page_and_SERP_titles_do_not_match.csv`), including the homepage (11,187 imp, 701 clicks) and /about-us (27,823 imp). Under the QW-01 frame the click upside is small but the cost is near-zero and it touches only Sanity fields.

### QW-08 - "Lost traffic" pages: watch, don't fix (low, 1h)
`Notice-Organic_traffic_dropped.csv` lists 11 pages; the largest has an estimated 65 monthly visits and the top 4 are brand-navigational (/uk, /about-us, /how-it-works). Exactly one page dropped from top 10 (`Notice-Pages_dropped_from_Top_10.csv`): the offshoring explainer, "what is offshoring" US now pos 10. With a 5-day post-cutover window (3 final), causation is unknowable; re-measure 31 Aug.

---

## CROSS-LENS NOTES

- **AI surfaces lens**: QW-01's zero-click pattern is your center of gravity. Also: a live inbound link with `utm_source=chatgpt.com` currently dies in a 308→404 chain (`Error-Broken_redirect.csv`); Bing AI citation data exists in bing/ and Copilot citations collapsed 27 Jul pre-cutover (per manifest); "toptal voucher/codes" style queries suggest the compare pages are being surfaced by assistants for intents we don't serve.
- **Locale/UK lens**: `/ph` still serves 200 and earned 650+354 brand clicks over 16m (gsc full-query-x-page: "cloud employee"→/ph 650 clicks) despite the PH locale being discontinued; joined table shows indexable=null for it. Someone should own what /ph is supposed to be now. Also `/uk/technology/typescript-developers` outranks its US twin on some US queries ("hire typescript developers" 98 imp pos 3.9 UK vs 5,412 imp pos 10.9 US) - hreflang/targeting question, not mine.
- **Content lens**: sitemap.xml itself ranks for "hire weaviate developers" (57 imp, pos 63) - harmless but odd. The 307 word-identical UK clones (crawl/uk-us-pairs.json) are the elephant; three lenses will hit it.
- **Performance lens**: nothing in my lens contradicts the 0-CrUX / lab-only caveat.
- **Synthesis**: the brief's "toptal alternatives, pos 4, ~2,000 searches, /alternatives" example is not in the data (QW-01). If another lens "confirms" it, check their filter - the nearest real thing is a blog post, zero clicks.

## DATA GAPS

- **No per-URL SERP-title strings in our extract**: `Notice-indexable-Page_and_SERP_titles_do_not_match.csv` flags the 26 pages but the export we intersected doesn't carry the SERP title text alongside cleanly enough to prewrite replacements; a small Ahrefs re-export (or manual SERP check for 26 URLs) is needed at execution time.
- **Search-appearance dimension refused by GSC API** (`full-searchAppearance-x-page` ERROR per MANIFEST-gsc.md), so the AI-surface hypothesis in QW-01 rests on CTR shape + query text, not on Google labelling. GSC UI "Search appearance" tab may distinguish AI Overviews - worth a manual check.
- **No lead data** (confirmed by design, hubspot/quality-bailout.json): every impact here is clicks, not revenue. Where a page choice matters commercially (Philippines cluster), that is stated, not quantified.
- **Ahrefs keyword volumes for the clicking queries**: API allowance exhausted until 17 Aug (ahrefs/RESUME.md); volume-based sizing of e.g. "toptal vs upwork" (54 imp/10d observed) would sharpen QW-03's estimate.

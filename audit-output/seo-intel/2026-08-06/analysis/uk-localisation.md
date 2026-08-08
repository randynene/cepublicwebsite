# Lens 4 - UK Localisation

Analyst date: 8 Aug 2026. Data root: `audit-output/seo-intel/2026-08-06/`.
All GSC figures exclude talent.cloudemployee.io. The full-history window is
2025-04-07..2026-08-07 (16 months) from `gsc/full-page-x-country.json`
(13,055 rows, no row cap; 12,367 after the talent filter).

## The verdict in one paragraph

This is an **investment case, not a recovery case**. The /uk/ pages never had
rankings to lose: 170 of the 326 live /uk/ pages (52%) have earned zero
impressions in 16 months, the whole /uk/ tree earned 253 clicks all-time, and
242 of the 245 GB clicks on /uk/ pages came from ONE page (the /uk homepage,
on the brand query). GB is nonetheless the second market - 67,857 impressions -
but 87% of that demand resolves to US pages that GB searchers barely click
(0.25% CTR). Localisation is a bet that British pages can intercept demand
Google is currently sending, unpersuasively, to American pages. Before any of
it can happen, a blocking architecture fact must be dealt with: **there is no
UK content in Sanity at all - zero locale='uk' documents - and every UK route
renders the same document as its US twin.**

---

## UK-01 (high) - What the UK half earns today: almost nothing

- All-country, all-time, /uk/ paths: **15,741 impressions, 253 clicks, 156
  distinct pages** (`gsc/full-page-x-country.json`).
- /uk/ pages live: **326** (`crawl/MANIFEST-crawl.md`). So **170 (52%) have
  never earned one impression**. The brief's "roughly 54%, overwhelmingly the
  UK half" is confirmed in direction; the precise UK figure is 52%.
- GB market: **67,857 impressions, 394 clicks** across 490 page rows. Split:
  - GB -> /uk/ paths: 8,627 impressions (12.7%), 245 clicks, wpos **31.6**
  - GB -> US paths: 59,230 impressions (87.3%), 149 clicks, wpos **22.6**
- Ahrefs GB sees a near-zero footprint: the GB organic-keywords export holds
  **10 keywords for the entire domain**
  (`ahrefs-exports/cloudemployee.io-organic-keywords-subdomains-gb-_2026-08-07_11-01-13.csv`).
  Only 'it outsourcing' (vol 800, pos 1, US path), 'typescript developer'
  (vol 40, pos 10, /uk path) and brand are ranked.

So: no recovery to stage. The case for D1 rests on the 59,230 GB impressions
currently landing on US pages, plus GB demand we do not yet rank for at all
(the Ahrefs GB competitor/content-gap data is the other lens's territory).

## UK-02 (medium) - Falsified before reporting: the "UK pages convert better" reading

Naively, GB /uk/ CTR is 2.84% vs 0.25% for US paths - an 11x advantage. It is
composition. The /uk homepage alone is 1,894 impressions / **242 of the 245
clicks** at position 13.9, and its only Ahrefs GB keyword is 'cloud employee'
(brand, pos 1). **Excluding it: 6,733 impressions, 3 clicks, 0.04% CTR.**
The clone pages convert essentially nothing. Nobody at synthesis should be
allowed to conclude UK pages outperform; the truthful version is the opposite
and is itself the best data argument for differentiated titles and snippets.

## UK-03 (critical, blocking) - DFH-2 answered by probing, not guessing

**One shared document serves both locales. There are no UK documents.**

- Live GROQ against project `lzbhll1u` / dataset `production`:
  `{all: 1020, default: 290, uk: 0}` - **zero** documents with
  `locale == "uk"`; 290 carry `locale == "default"`.
- `localeField()` exists (`studio/schemas/_shared.ts:19-28`, options
  'Default (US)' / 'UK') and is applied to 13 types - but it is a dormant
  CONTENT-1 migration artefact. No detail query filters content on it.
- UK routes fetch by slug with no locale parameter
  (`site/src/app/uk/technology/[slug]/page.tsx` calls `fetchTechnology(slug)`).
  The only locale-aware predicate in the query layer is `VISIBLE_IN_LOCALE`
  (`site/src/lib/sanity/queries/_filters.ts:40`), which exists to gate the
  single `ukOnly` document (Caitlin Murray, Tech Debt #58) - visibility,
  not content.

**Consequence:** Seb cannot edit UK copy independently today. Nothing in D1 -
not even a UK meta title - can be authored until this is decided and wired.

**Recommendation: locale-override fields on the shared document**, not
separate documents. Reasons: separate docs fork 326 documents and every
reference between them (the same class of operation Tech Debt #61 calls large
and risky); they break the derived slug-pairing that hreflang depends on
(UK-07); and they contradict the single-doc route architecture that already
ships. Override fields (`ukMetaTitle`, `ukMetaDescription`, optional UK body
overrides per template section) keep slugs paired, live in the same Studio
form, and degrade gracefully - missing override renders exactly what renders
today. Wiring estimate: 2-3 days (Claude): schema fields + query projections +
template fallback logic + Studio deploy.

## UK-04 (high) - Metadata first, and across all 326: it IS the site's duplication problem

- **305 of 306** duplicate-title groups and **321 of 322**
  duplicate-description groups reduce to exactly a {US path, /uk twin} pair
  once query-string URL variants are normalised
  (`crawl/duplicate-titles.json`, `crawl/duplicate-descriptions.json`,
  normalisation computed this session).
- All 307 word-identical pairs also share title AND description
  (`crawl/uk-us-pairs.json`: 309/326 titleIdentical, 324/326 descriptionIdentical).

A UK metadata pass across all 326 pages therefore clears ~99% of site-wide
metadata duplication in one move, and it attacks UK-02 directly: 6,733
zero-click GB impressions currently show an American snippet. It is far
cheaper than body work - templated first drafts (£, British phrasing,
'UK' geo-qualifiers where query data supports them) with Seb reviewing.

**Is it a quick win?** Not by the shared definition - it depends on the UK-03
schema decision, which is Jake's call. Once UK-03 is wired it is roughly 2
days of generation plus review across 326 pages. Sequence it BEFORE the
10-page body work: broadest coverage per hour of anything in this lens.

## UK-05 (low) - The 18+1 already-differing pages are accidents; the natural experiment is void

The crawl's exact split is **307 identical / 18 differing / 1
no-US-counterpart** (`crawl/uk-us-pairs.json`) - the brief's "19 that differ"
conflates the last two. The 1 is /uk/team/caitlin-murray, the known ukOnly
page (Tech Debt #58). Of the 18:

- 10 differ **only in title** or trivially (jaccard >= 0.86, equal word
  counts): 3 technology pages at jaccard 1.0 (azure-developers, qase,
  unity-developers), 6 team pages, 2 videos, /uk/work-with-shawnee.
- The two large body divergences are known artefacts, not localisation:
  /uk/compare/cloud-employee-vs-arc-dev (jaccard 0.269) is the US-side
  accidental redirect shadow (Tech Debt #55); /uk/tools/price-comparison-
  calculator (0.451) is a client-rendered calculator the server-HTML word
  count sees unevenly.
- Performance: none. /uk/technology/azure-developers: 102 GB impressions,
  0 clicks, position 60.9. qase and unity-developers: no recorded GB
  impressions at all.

Nothing here is a deliberate UK variant, so the data cannot say whether
differentiation lifts rankings. **Phase A must be designed as the
experiment**: localise 10, hold the rest as controls, read GB positions at
+60/+90 days.

## UK-06 (high) - The Phase A ten, on evidence

GB impressions per logical page (US+UK paths folded together, 16 months,
commercial templates), from `gsc/full-page-x-country.json`:

| # | Page | GB impr | GB clicks | wpos | Why |
|---|---|---|---|---|---|
| 1 | /technology/typescript-developers | 1,983 | 0 | 11.5 | UK twin already pos 6.9 on 396 impr; the only non-brand /uk/ Ahrefs GB keyword. Cheapest, fastest test |
| 2 | /compare/toptal-vs-upwork | 4,694 | 0 | 9.4 | Largest GB commercial demand on the site, page 1, zero clicks |
| 3 | /services/philippines-developers | 2,087 | 1 | 14.2 | Core commercial service page |
| 4 | /technology/nodejs-developers | 2,412 | 0 | 35.7 | Largest technology-page GB demand |
| 5 | /technology/python-developers | 1,424 | 0 | 46.1 | Volume, poor position - most headroom |
| 6 | /technology/aws-developers | 1,346 | 0 | 28.4 | Same shape |
| 7 | /how-it-works | 495 | 2 | 7.7 | Funnel page; 2 of the 3 non-home /uk/ GB clicks |
| 8 | / (the /uk homepage) | 4,031 | 329 | 21.5 | Brand landing; the one /uk/ page GB users actually see |
| 9 | /about-us + /contact | 1,036 + 582 | 17 + 0 | 6.1 / 6.0 | Both already page 1 in GB; UK contact details are the cheapest possible localisation |
| 10 | /pricing | ~0 recorded | - | - | **Judgment, not data**: D1's currency page par excellence. Labelled as such |

Coverage: the set spans ~18,600 of 67,857 GB impressions (27%).
Ranking basis is traffic only - `leads_12m` is null on every row by design
(`joined/MANIFEST-joined.md`, HubSpot bail-out), so "whether the US
equivalent already converts" is **unanswerable from this data** and is
recorded as a data gap below.

## UK-07 (medium) - Risk register: three ways to break the hreflang that currently protects everything

`crawl/hreflang.json`: 656 pages carry hreflang; **9 rows have reciprocity
issues and every one is a query-string variant** (?ref=, ?page=), not a real
page. Real-page hreflang is clean, which is why 307 word-identical pairs are
not being treated as duplicates.

The pairing is **derived from the shared slug** at render time
(`generateHreflang(usPath)` in the UK route files), not stored. Three rules:

1. **Never fork UK pages onto different slugs.** This alone rules out naive
   separate-documents for UK-03 unless slugs are pinned to the US twin.
2. **Prune both sides together.** If any zero-earning UK page is ever removed
   (UK-08), the US twin's en-GB pointer must go in the same change, or it
   dangles.
3. **Canonicals stay self-referencing on UK pages.** A "canonical to US"
   shortcut would deindex the UK half wholesale and silently repeal D1.

## UK-08 (medium) - Phase B is a triage, not a 316-page rewrite

D1 says "every remaining UK page gets worked through and differentiated over
time" (SEO_PROGRAMME.md:240-246). The data says most of that work would be
wasted: 170 pages have earned nothing in 16 months, and the GB tail below the
top ~30 pages is under 100 impressions each. There is no duplicate-content
penalty to escape (UK-07), so a clone that earns nothing costs nothing
except crawl budget. Proposal - **a deliberate narrowing of D1, for Jake to
ratify**: metadata-localise all 326 (UK-04); body-localise only pages
clearing a demand bar (>=100 GB impressions/16mo or a ranked GB keyword),
which is roughly 30-50 pages; leave the remaining ~270 as UK-metadata'd
clones and re-triage quarterly.

---

## THE PHASED PLAN (deliverable)

**Phase 0 - Architecture (blocks everything). ~2-3 days, Claude + Jake decision.**
Decide UK-03 (recommendation: locale-override fields on shared documents).
Wire schema + queries + templates + Studio. Exit test: editing a UK meta
title in Studio changes /uk/x and not /x, and hreflang/canonicals unchanged.

**Phase A1 - Metadata pass, all 326 pages. ~2 days Claude generation + ~8-10h Seb review.**
UK titles/descriptions/OG for every pair. Clears 305/306 + 321/322 duplicate
groups. Ship in batches; watch GSC for the pairs' GB positions.

**Phase A2 - Body localisation, the ten (UK-06 order). ~3-4h Seb copy per page + ~1h wiring each: ~40-50h total over 3-4 weeks.**
Per-page standard (the definition of "differentiated" - concrete enough to
apply without asking):
- **Currency**: every $ figure gets a £ equivalent or replacement; salary/rate
  comparisons rebuilt against UK salary benchmarks, not converted.
- **Naming**: UK-English spellings throughout; "UK account manager";
  role titles as the UK market writes them (e.g. "contractor day rate",
  "IR35" where staffing models are discussed).
- **Proof**: at least one UK-relevant case study or client reference per page;
  if none exists, say so to Jake rather than fabricate - that is a content
  gap, not a writing task.
- **Contact**: UK phone format, UK-appropriate CTA and meeting times; the
  contact/about pages carry any real UK presence (address, registration) that
  exists - needs Jake to confirm what is true of the business.
- **Metadata**: already done in A1; re-check it still matches the new body.
- **Structure**: H1 keeps its ranking phrase (the Tech Debt #43b rule); UK
  qualifier goes in title/meta/eyebrow, not by rewriting ranking H1s.
- **Never**: change the slug, drop the self-canonical, or remove hreflang.

**Phase B - Triage the remaining ~316. Ongoing, ~150h total for the ~30-50 pages that clear the demand bar.**
Quarterly GSC re-read; promote pages over the bar into the A2 treatment;
leave the rest as metadata-localised clones.

**Honest cost and return.** Total: ~25-35h Claude (Phase 0 + A1 generation +
wiring) + ~50h Seb (A2) + ~150h (Phase B, spread over quarters). Return: the
observable GB market is 67,857 impressions/16mo (~4,200/month) and currently
yields ~25 clicks/month site-wide, almost all brand. If Phase A pages reach
positions 5-6 on their existing demand at ~2% CTR, the estimate is **20-40
incremental GB clicks/month at +90 days** (low confidence - GB volumes are
small and the post-cutover window is 5 days). The strategic upside - GB
keywords we do not rank for at all - is not measurable from this pull because
the Ahrefs GB footprint is 10 keywords; the content-gap GB data belongs to
the content lens. This is a modest, patient bet, and the honest way to sell
it is UK-02: six and a half thousand GB impressions, three clicks.

---

## CROSS-LENS NOTES

- **Content lens**: GB demand overwhelmingly lands on US blog/informational
  pages (/staff-augmentation/what-is-staff-augmentation... 5,840 GB impr, 1
  click; the two nearshoring-offshoring definition posts ~9,000 combined).
  Those are not UK-localisation candidates; they are CTR/title problems.
- **Metadata/on-page lens**: the site-wide duplicate-title and
  duplicate-description findings are ~99% UK/US pairs (UK-04) - do not
  double-count them as an independent problem.
- **Migration/parity lens**: /uk/compare/cloud-employee-vs-arc-dev serves
  2,287 words where the US side serves a 538-word redirect shadow (Tech Debt
  #55's mirror). Post-launch decision with Seb pending.
- **Performance lens**: nothing UK-specific found; UK pages are the same
  templates.
- **/resources** earned 2,196 GB impressions at position 61 (full-history) -
  whoever owns hub pages should look at what that page is and was.

## DATA GAPS

1. **Conversion by page is unanswerable** (HubSpot CRM scopes absent; leads_*
   null by design). The Phase A ranking is traffic-only. If a page-level
   buyer-enquiry signal ever becomes trustworthy, re-rank the ten.
2. **No GSC page x country x date cut exists**, so GB performance cannot be
   trended per page across the cutover; post-cutover GB totals (1,138
   impressions, 3 clicks over 3-7 Aug vs 1,678/6 the week before,
   `gsc/post-cutover-page-x-country.json`) are too small and too early to
   read, per the shared caveat.
3. **Ahrefs GB keyword data is nearly empty for us** (10 rows). The GB
   opportunity sizing (what we COULD rank for) needs the GB content-gap /
   keyword-ideas pull after the Ahrefs allowance resets on 17 Aug
   (`ahrefs/RESUME.md`).
4. **Whether CE has a real UK business presence** (address, registration,
   UK-based staff, UK case studies) is a fact about the company, not the
   data. Phase A2's proof standard needs Jake to answer it once.

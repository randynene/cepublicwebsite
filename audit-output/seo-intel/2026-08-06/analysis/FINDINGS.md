# SYNTHESIS - the ranked roadmap

Synthesised 8 Aug 2026 from six lens reports (60 findings) plus independent
re-verification against source files and live production. Machine-readable
twin: `ROADMAP.json`. All six lenses landed; none missing or incomplete.

---

## 0. The impression-pollution question, settled first

**Verdict: the pollution is real, confirmed independently, and impressions
are not a safe ranking basis on this site.** Verified this session, not
taken from the lenses:

- Monthly totals recomputed from `gsc/full-date.json` match QW-01 exactly:
  impressions 32,195 (Oct 2025) to 177,865 (Jun 2026), a 5.5x rise, while
  clicks stayed flat (538 to 543).
- The two named machine families alone ("<company> engineering challenges
  nearshoring", "number of employees at <domain>") total **80,042
  impressions and 0 clicks** - 8.8% of all 16-month impressions
  (`gsc/full-query-x-page.json`, talent excluded). They are the tip: the
  wider set of templated, never-clicking queries is what drove the 5.5x.
- Strict non-brand CTR at rounded positions 4-6 is **0.161%** (181 clicks
  on 112,590 impressions), roughly 30x below any human curve. Human-shaped
  queries inside the same band click normally ("shawnee malesich" 3.9%,
  "data engineer vs ai engineer" 1.5%), which proves the curve is polluted
  rather than the site being unclickable.

**Rule applied throughout:** nothing below is ranked on raw
`impressions_90d`. Rankings use clicks, query-level data with junk families
excluded, and position. Where a click estimate appears it uses observed
CTRs or is labelled an industry-curve guess.

**Findings downgraded because their impression numbers could not be
trusted:**

- `/nearshoring-offshoring/what-is-nearshoring-benefits...` (47,822 imp) -
  mostly the junk family; not a top upgrade target despite the biggest
  blog impression count.
- `/about-us` (27,823 imp) - "number of employees at" junk; metadata-only
  attention.
- `/compare/toptal-vs-upwork` raw total (44,019 imp) - top queries are
  "toptal vouchers" and "toptal api", intents we do not serve. The page
  stays in the roadmap for its real sub-queries and its zero-inlink
  defect, but its headline number is discounted.
- Any "move pos 11 to 5, gain N clicks" arithmetic from any lens - invalid
  on this impression base; all such estimates were re-based or labelled.

The silver lining stands (CONT-04, AUTH-07): AI agents repeatedly select
our pages as sources. The zero-click impressions are partly evidence of AI
surface presence, which is the AEO strategy's target anyway.

---

## 1. What was verified, and what failed

Every top-15 item below had its load-bearing number rechecked against the
cited file, or against live production by curl, this session.

**Confirmed (spot checks):** monthly imp/click table exact; junk families
80,042/0; `/compare/toptal-vs-upwork` 44,019 imp / 12 clicks / 0 inlinks /
2,578 words (`joined/pages.json`); staff-aug pillar 48,992 imp / 11 clicks /
1,783 words / 12 inlinks; costs post 27,802 imp / 24 clicks / 684 words;
307 of 326 UK pairs word-identical (`crawl/uk-us-pairs.json` verdicts:
307/18/1); 154 referring domains landing on `/blog` (join of
`ahrefs/backlinks.export.json` x `crawl/urls.json`: exact); 45.8% of live
backlinks routing via cloudemployee.co.uk (5,864/12,795: exact); 4
redirecting URLs in the sitemap; body-hide present in production HTML 8
Aug; `cache-control: no-store` + `x-vercel-cache: MISS` live; VideoObject
missing uploadDate live; `/team/shawnee-malesich` 404 live; `/alternatives`
page 1 links only 14 of 30 compare pages live.

**Updated by fresher data:** `gsc/url-inspection.json` now holds 1,070
records (manifest said 109, tech lens saw 890 - a background job was
completing during analysis). The UK indexing refusal is STRONGER in the
full file: UK pages "Submitted and indexed" **15**, versus **48**
"Duplicate, Google chose different canonical" + 9 "Duplicate without
user-selected canonical". US: 232 indexed. TECH-01 stands, amplified.

**Failed verification or demoted:**

1. **The brief's "toptal alternatives at position 4 on ~2,000 monthly
   searches" is false.** The query exists with **7 impressions in 16
   months** (pos 4.1, 0 clicks, pointing at /compare/toptal-vs-upwork, not
   /alternatives). SEO_PROGRAMME.md SEO-6 was built partly on this; it is
   corrected in the rewrite. (Lens 1 flagged it; verified here.)
2. **"879 links to robots-blocked URLs" - unreproducible** (TECH-12). Live
   robots.txt blocks only /download-thank-you/, and the crawl has 0 links
   to it. Killed.
3. **"UK pages convert better" - falsified by composition** (UK-02).
   Excluding the /uk homepage: 6,733 GB impressions, 3 clicks, 0.04% CTR.
4. **The 281-to-242 Poor-page drop attributed to the Marker.io removal** -
   demoted to hypothesis; no per-URL Lighthouse export exists to test it
   (PERF-09).
5. **Most scary GSC coverage numbers** (robots-blocked, 404s, unparsable
   structured data) - stale Webflow-era crawls, self-healing (TECH-09).
   Not in the roadmap.
6. **Thin-content programme** - killed (CONT-08). 118 of 165 thin pages
   earn nothing and are mostly UK clones or functional stubs.
7. **Bulk fixes of all 211 one-inlink pages, all 26 title rewrites as a
   traffic play, blanket 301 of all 69 dead blog URLs** - all scoped down
   to the impression- or domain-bearing subsets by their own lenses;
   synthesis concurs.

**Contradictions resolved:**

- **Ahrefs "no page performs well" vs Vercel "several score 100":** both
  right, different populations (PERF-05). Throttled mobile lab starves the
  JS un-hide on every page; fast desktop field traffic resolves it. The
  incoherent Vercel mobile sample (FCP > LCP) is discarded as measurement.
  Called for: the lab is the better predictor of the CrUX mobile data now
  accumulating, so the performance fix is real work, not lab pedantry.
- **Brand Radar "zero AI presence" vs 8,640 Copilot citations:** different
  instruments (AUTH-08). Copilot cites us heavily on comparison and
  staff-augmentation queries; Brand Radar tracks 10 multi-engine buyer
  prompts where we score 0 vs Toptal 7. Both kept, labelled.
- **TECH-01 "consider consolidating UK" vs locked decision D1 "UK becomes
  British":** resolved in favour of D1, narrowed per UK-08. Google's
  refusal to index clones is the strongest evidence FOR differentiation,
  not against the locale. The consolidation option is recorded as the
  fallback if Jake ever reverses D1. Canonical-to-US is ruled out (it
  would silently repeal D1 - UK-07).
- **Ahrefs "all pages under 100KB" vs 525KB homepage:** compressed vs raw
  transfer (PERF-08). Both numbers kept with labels.
- **Internal-link counts (336 vs "1 inlink"):** joined-table counts include
  nav/mega-menu links; the Ahrefs one-dofollow report and content-lens
  counts measure in-content links. Not a contradiction; the roadmap items
  say which they mean.

---

## 2. WAVE 1 - this week (shippable now, under a day each, no decisions)

Ranked by expected gain per unit of effort.

| # | Item | What | Effort | Evidence | Expected gain |
|---|---|---|---|---|---|
| 1.1 | **Restore /team/shawnee-malesich** (or 301 to /team as interim) | The 9th most AI-cited page (286 Copilot citations) and a 2,877-imp / 112-click personal-name query currently 404s. Same per-locale retirement shape as Tech Debt #58. Default: 301 to /team today, ask Seb about restoring | 1h | bing/ AIPageStats; gsc query data; curl 404 verified | Stops live citation + click loss now |
| 1.2 | **VideoObject uploadDate** template fix, full ISO 8601 with offset | Only structured-data ERROR on post-cutover crawls; 44 pages; Sanity holds the dates | 3h | gsc/url-inspection.json; curl verified | Video rich-result eligibility |
| 1.3 | **Sitemap + redirect hygiene batch**: drop the 4 redirecting URLs from the sitemap; add /technology/android-studio pair; fix the /ph broken 308-to-404 chain (it currently kills traffic arriving with utm_source=chatgpt.com); collapse the 28 redirect chains; add whitespace-tolerant redirect normalisation (the DR 91 %20 link, Tech Debt #65) | 4h | crawl/sitemap-not-200.json (verified); Error-Broken_redirect.csv; redirect-chains.json | 12+ crawl defects removed in the window Google re-evaluates the migration |
| 1.4 | **/alternatives page 1 renders all 30 compare cards** + related-comparisons module on compare templates | The site's best-position pages rank on one paginated hub link; 15 of 30 (14 verified live) are behind ?page=2, including the top 3 Copilot-cited pages | 4h | AUTH-03; curl verified | Internal equity to the pages that already rank pos 5-7 and carry 45% of AI citations |
| 1.5 | **Orphan + starved internal-link pass**: 7 zero-inlink new posts (61 Copilot citations among them), then contextual links to the ~20 one-in-content-link pages with real impressions | 6h | CONT-06; QW-03; crawl/internal-links.json | Newest cited.io content gets equity; single-digit clicks/mo near-term, compounding |
| 1.6 | **Scripted Sanity link rewrite**: 434 apex-host internal links, 49 retired-calculator links, 166 other redirect targets, 27 dead external links, plus a content-lint to stop recurrence | 6h | TECH-03; QW-04; QW-09 | One-hop link signal during re-indexing; customer-2 IP |
| 1.7 | **Sanity image URL params** (auto=format, honest widths) | 33 instances, 59.7MB, all cdn.sanity.io; one 3.19MB asset on 10 pages | 3h | PERF-07; Error-Image_file_size_too_large.csv | Real bytes off real pages; not the LCP cause but free |
| 1.8 | **Material-icon ligature anchor fix** (aria-hidden the icon span; article-title aria-labels on blog cards) | "location_oneastern europe..." concatenations in every page's chrome, 686 occurrences; crawlers and screen readers both eat it | 2h | AUTH-10 | Anchor-text hygiene sitewide + a11y |
| 1.9 | **Wire the free Brand Radar weekly pull** (0 API units, verified) | Multi-engine AI-mention baseline is day-one (us 0, Toptal 7); manual pickup due ~14 Aug | 3h | AUTH-08; MANIFEST-ahrefs-exports.md | The AEO progress metric, measured weekly |
| 1.10 | **Jake, 30 min in dashboards**: confirm cloudemployee.co.uk auto-renew + set a monitor on 2-3 deep URLs (45.8% of all live backlinks route through it - verified); delete the 9 dead sitemap submissions in Search Console (Tech Debt #64, still open) | 0.5h | AUTH-02 verified; post-launch audit | Insures ~half the link profile; unburies real GSC errors |

Wave 1 total: roughly 32 hours of Claude work + 30 minutes of Jake.

## 3. WAVE 2 - this month (days of work, or exactly one decision)

| # | Item | What | Effort | Depends on |
|---|---|---|---|---|
| 2.1 | **THE performance package (SEO-1)**: move geo routing server-side on x-vercel-ip-country (already read on every request), delete all three GeoTargetly body-hide snippets, defer HubSpot analytics to idle preserving hubspotutk, then restore HTML cacheability (isolate the headers() read; ISR for Sanity routes) | Measured floor: render delay 5,007ms to 1,496ms with both gates removed; TTFB 1.37s field vs 178ms crawler median; every HTML response is no-store (verified live) | 3-5 days | DFH-1 confirmation (recommended: delete). Sequenced now because the first CrUX window is accumulating from this month's traffic |
| 2.2 | **Metadata batch on impression-bearing pages**: 26 Google-rewritten titles, 20 long titles, 33 long descriptions, 2 template-level missing-description fixes | Cheapest CTR lever on the pages that already click; needs a small manual SERP check for the 26 (data gap) | 1-2 days | Nothing |
| 2.3 | **Dead-blog 301 map, top ~25 by referring domains**: 154 domains' links currently soft-404 into /blog; map to topically honest targets only, accept the rest, plus the ~5 clean AUTH-06 reclaims (/web-developer etc.) | Largest recoverable authority item; every target is a judgment call | 2-3 days incl. Jake per URL | Jake availability |
| 2.4 | **Claimable-profile outreach, Tier 1**: g2, cbinsights, builtin, techbehemoths, designrush, saashub, producthunt + 6 more (DR 72-91, each already listing 7-10 competitors) | Hours per profile, no pitch needed | 1-2 days spread | Jake/marketing |
| 2.5 | **Book-a-call noindex restore** (10 pages, were noindex on Webflow, thin near-duplicates) | 10-minute decision, then trivial | 1h | Jake yes/no |
| 2.6 | **Technology template emits Service JSON-LD** (190 pages emit WebPage where the services template emits Service) | Consistency; supports the hire-fleet content work | 3h | Nothing |
| 2.7 | **Locale-mirrored redirect generator** + backfill the 5 UK 404 twins | Systematic gap: retiring a US doc creates a US-only redirect | 3h | Nothing |
| 2.8 | **Staff-augmentation pillar upgrade** (CONT-03): answer-box lead, meaning/benefits/vs/pricing H2s, hub-and-spoke links to all 13 cluster posts | The best single content upgrade: 48,992 imp / 11 clicks verified, real queries at pos 13-27, already 1,783 words | 2 days | cited.io pipeline |
| 2.9 | **Cost/definitional trio upgrade** (CONT-10): the costs post (24 clicks/90d - the top real click earner outside brand), outsourcing-definition, offshoring-explainer; per-country rate tables linking the live calculators | 684-word page carrying 48 Copilot citations | 2-3 days | cited.io pipeline |

## 4. WAVE 3 - the quarter (programme-sized)

| # | Programme | Shape | Effort |
|---|---|---|---|
| 3.1 | **Hire-fleet upgrade programme** (CONT-01/02): 15 priority /services/ + /technology/ pages from 600-900 words to 1,500-2,000 with rates table, vetting, engagement models, FAQ, GSC query variants. Order: typescript, philippines, latam, aws, devops, openai, python, no-code, then the rest by clean impressions. Competitors win these terms with exactly one template (toptal.com/developers/<tech>) | ~40h through cited.io | The core commercial bet: 642 true-gap keywords, 159,250 monthly searches, median KD 5-10 in our clusters |
| 3.2 | **Two new pages only** (CONT-07): /technology/javascript-developers (4,550-vol cluster, KD 5, page missing entirely) + one definitive software-development-outsourcing pillar (24,100-vol cluster served only by blog posts) | ~2 days each | Everything else is upgrades, per the governing steer |
| 3.3 | **UK programme** (D1, reshaped by evidence - see decisions): Phase 0 wire locale-override fields (2-3 days, blocked on DFH-2); Phase A1 metadata-localise all 326 (clears 305/306 dup-title + 321/322 dup-description groups in one move); Phase A2 body-localise the evidence-ranked ten; Phase B triage ~30-50 pages over the demand bar, leave ~270 as metadata-localised clones | ~25-35h Claude + ~50h Seb + quarterly triage | Google currently refuses the clone UK: 15 indexed vs 57 duplicate verdicts (verified, 1,070-record file) |
| 3.4 | **Per-template performance pass** (only after 2.1, re-measuring between steps): blog detail (worst field score, 45.5% of impressions), /our-work (46), Vimeo hero facade, lazy HubSpot forms + Calendly | 1-2 weeks spread | PERF-04/06 |
| 3.5 | **Editorial outreach, Tier 2**: stats aggregators + tech press with LATAM/PH salary-and-cost data as the hook (research.com, thenextweb, hackernoon, techcrunch...) | Ongoing | AUTH-05; content footprint multiplies authority (the Andela lesson: DR 71 + 49 keywords = nothing) |
| 3.6 | **Best Practices / cookie / consent batch** (Tech Debt #29-32) | Last; no ranking effect | 3-5 days |

## 5. Decisions for Jake (nothing above 2.1 can be called final until its decision lands)

| ID | Decision | Recommendation | Unblocks |
|---|---|---|---|
| DFH-1 | Body-hide replacement | **Delete it**; geo routing moves server-side on x-vercel-ip-country (the round trip is already redundant - the server renders the country into HTML). The GeoTargetly subscription itself may then be retirable | 2.1 |
| DFH-2 | UK content storage in Sanity | **Locale-override fields on shared documents**, not separate docs (probed: zero locale=uk documents exist today; separate docs would fork 326 documents + every reference and break derived hreflang pairing) | 3.3 entirely |
| D-UK-SCOPE | Ratify the narrowing of D1 | Metadata-localise all 326; body-localise only pages clearing a demand bar (~30-50), re-triage quarterly. 170 UK pages have earned zero impressions in 16 months | 3.3 Phase B |
| D-PH | Philippines consolidation (QW-05/CONT-09): 301 /services/filipino-developers + /hire/philippines-offshoring into /services/philippines-developers; same for the no-code and full-stack /hire duplicates | Yes, but **after the 31 Aug migration read**; check first whether the duplicates are inherited from Webflow (parity bookkeeping) | ~27,500 clean split impressions consolidate |
| D-BAC | Restore noindex on the 10 /book-a-call/* pages | Yes (was Webflow behaviour) | 2.5 |
| D-EDIT | Seb items: shawnee restore vs 301; Caitlin Murray UK page (Tech Debt #58); is cloudemployee.com.au ours? Any real UK business presence (address, registration, case studies) for Phase A2 proof standard? | Ask as one batch | 1.1, 3.3 |
| D-CONSENT | Consent-management strategy for the pixel stack | Needed before 3.6 | 3.6 |

## 6. Watch list (monitor, do not act)

| What | Look again | Trigger to act |
|---|---|---|
| **The 28-day post-migration GSC read** - the 5-day window (3 final days) is a catastrophe check, not a verdict | **31 Aug** | Any sustained click/position drop vs the 29 Jul-2 Aug baseline |
| **Copilot collapse recovery** (exonerated twice: began 27 Jul pre-cutover; Google impressions +36% same week) | Weekly; escalate ~**31 Aug** | Cited pages not back to ~10/day: raise with Bing Webmaster (IndexNow/sitemap) |
| "Crawled - currently not indexed": 94 US records | 31 Aug | Growth rather than decay |
| First CrUX window (zero coverage today; accumulating since launch) | Early **Sep** | Whatever it says - it is the before/after for 2.1 |
| QW-08's 11 Ahrefs traffic-drop pages + 1 top-10 dropout | 31 Aug | Confirmed drops after a full window |
| Ahrefs unit reset - buy only the RESUME.md recommended groups (keywords-explorer overview + SERP overview, ~30-60k units); pull GB content-gap for UK sizing; re-pull live backlink graph for is_lost | **17 Aug** | n/a |
| Brand Radar first weekly data - manual pickup | **~14 Aug** | n/a (then automated by 1.9) |
| IndexNow wiring (5,051 pages flagged) | After Bing import lands | Optional; supports the Copilot channel |

## 7. What we still cannot answer (data gaps, consolidated)

1. **Revenue/lead value per page** - HubSpot token is forms-only; leads_*
   null everywhere. Closing it (CRM scopes: contacts, deals, meetings)
   would let every ranking above be re-cut by money instead of clicks.
   The single most valuable gap on this list.
2. **Per-URL Lighthouse** - exists in the Ahrefs UI, absent from exports.
   Blocks PERF-09 and per-template lab tracking. One UI export closes it.
3. **AI citation data outside Bing** - page-level ChatGPT/Perplexity/
   Gemini visibility is not purchasable on this plan; Brand Radar gives
   brand mentions only. We are flying on Copilot as a proxy.
4. **GB keyword opportunity sizing** - Ahrefs GB footprint is 10 keywords;
   the GB content-gap pull waits for 17 Aug. UK Phase A2 ordering could
   change with it.
5. **SERP-title strings for the 26 rewritten titles** - needs a small
   re-export or 26 manual checks at execution time.
6. **Search-appearance dimension** (would label AI Overview impressions
   directly) - refused by the GSC API; a manual UI check could partly
   confirm the pollution mechanism.
7. **Why Copilot's grounding set shrank 27 Jul** - not answerable from any
   data we hold.
8. **Competitor page quality** - the winning competitor URLs for the big
   clusters have not been crawled; a ~30-URL crawl would sharpen the
   cited.io briefs for 3.1.

---

*Method note: lens numbers that differ from this document (890 vs 1,070
inspection records; 41 vs 48 UK duplicate verdicts) are snapshot drift
from a background GSC job completing during analysis - direction unchanged
in every case. The manifests should be regenerated; noted for housekeeping.*

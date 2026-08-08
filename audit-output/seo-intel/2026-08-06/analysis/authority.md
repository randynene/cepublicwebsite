# Lens 6 - Authority and AI Visibility

Analyst run: 8 Aug 2026. Finding ids AUTH-01..AUTH-11 (machine version: `authority.json`).

Method note: every number below was computed from the files cited, and the load-bearing
claims (the hub catch-alls, the 404, the /alternatives pagination) were re-verified against
production with curl on 8 Aug, not taken from the 4-6 Aug documents.

---

## The one-paragraph answer

We are a DR 36 site in a DR 70-90 category, and roughly half of what authority we do have
is either arriving through a legacy-domain redirect chain (46% of live backlinks route via
cloudemployee.co.uk) or evaporating into hub catch-all redirects (168 referring domains'
links land on `/blog`, `/technology` or another index page - a soft 404 in Google's eyes).
Internally, the pages that earn the most - the compare pages that hold our best Google
positions AND 45% of our AI citations - are the least linked: the site's biggest
impression-earner after home has zero internal inlinks. The AI position is real but narrow:
strong on Toptal-comparison and staff-augmentation queries inside Copilot, baselined at
zero on the multi-engine buyer prompts Brand Radar tracks, and 27% of the whole Copilot
presence rides on a single page. The July Copilot collapse is exonerated twice over:
it began a week before cutover, and Google impressions rose 36% the same week it happened.

---

## AUTH-01 (HIGH) - 168 referring domains land on hub catch-alls; 69 dead blog posts funnel 154 of them into /blog

Joining `ahrefs/backlinks.export.json` (12,795 rows, 995 distinct referring domains) to
`crawl/urls.json` finalUrl:

| Redirect destination | Distinct domains | Links |
|---|---|---|
| /blog | **154** | 359 |
| /downloads (via old /resources) | 9 | 26 |
| / | 7 | 138 |
| /contact (incl. old /write-for-us) | 5 | 112 |
| /book-a-call (old /start-hiring, /ui-ux/...) | 5 | 58 |
| /pricing (old /developer-pricing) | 5 | 24 |
| /technology | 4 | 2,929 |
| /how-it-works, /about-us, /for-developers, /reviews | 3 each | 946 |

Total: **168 of 995 domains (16.9%), 142 with at least one dofollow link.**

Two corrections I made to my own first read, so synthesis doesn't repeat them:

1. **The 2,929 links to /technology are only 4 domains** - scraper networks hitting
   thousands of old `/developers/*` paths. Near-worthless. The headline is /blog's 154
   real domains, not /technology's link count.
2. **Zero of the 69 dead blog URLs have a live same-slug article.** The apparent slug
   matches (e.g. `/blog/the-future-of-drone-technology`) are themselves catch-all
   redirects (`hopCount>0` in the crawl; curl-confirmed 308 → `/blog`). Every redirect
   target is therefore a topical judgment call, which is why this is days-not-hours and
   needs Jake per URL.

**Top dead blog URLs by referring domains** (full 69 reproducible from the join above):

| Dead URL | Domains | Max DR | Suggested live target |
|---|---|---|---|
| /blog/programming-tips/10-best-websites-to-practice-coding-online | 30 | 76 | no strong match - for-developers angle, or accept |
| /blog/it-outsourcing/why-philippines-for-business | 20 | 76 | /hiring-tips/hiring-developers-in-the-philippines-... (curl 200; NOT /why-the-philippines, which 308s to /how-it-works) |
| /blog/tech-news/importance-of-technology-advancement-in-business-sector | 14 | 76 | none honest - accept |
| /blog/it-outsourcing/the-5-challenges-you-will-face-when-hiring-software-developers | 11 | 94 | /hiring-tips/how-to-avoid-costly-mistakes-when-hiring-a-remote-developer (topical) |
| /blog/productivity/10-tips-for-effective-communication-with-a-remote-team | 10 | 82 | /managing-engineers/how-to-manage-remote-engineers (topical) |
| /blog/productivity/11-signs-you-lack-work-life-balance | 10 | 76 | none - accept |
| /blog/productivity/being-stressed-at-work | 9 | 91 | none - accept |
| /blog/tech-news/in-demand-digital-skills-in-the-uk | 9 | 73 | none - accept |
| /blog/it-outsourcing/outsourcing-vs-freelance-the-pros-and-cons-to-consider | 6 | 34 | /blog/it-outsourcing/7-risks-...-freelance-developers IF live - see caveat |
| /blog/it-outsourcing/7-risks-you-will-encounter-when-hiring-freelance-developers | 5 | 75 | see caveat below |

⚠️ Caveat on apparent live twins: the joined table's `status` column follows redirects,
so several of these paths LOOK live there while the crawl records `hopCount>0` →
/blog. The authoritative check is crawl/urls.json `status==200 AND hopCount==0`, and by
that check **none of the 69 has a live same-path or same-slug twin**. Every target above
is a topical nearest-match, to be eyeballed before the rule ships.

**Recommendation.** Fix the top ~25 by referring domains with specific 301s where a
topically honest target exists; leave the rest on the hub catch-all and record the
loss as accepted. Do not blanket-map - an irrelevant 301 is a soft 404 anyway.

## AUTH-02 (HIGH) - The .co.uk legacy domain carries 46% of the link profile

`ahrefs/backlinks.export.json` `redirect chain urls`: **5,864 of 12,795 live backlinks
route through cloudemployee.co.uk**; 702 via other redirects; 6,229 direct. Corroborated
by `ahrefs/batch-analysis.json` (`backlinks_redirect: 5,586 of 8,913`). The single largest
external anchor is `cloudemployee.co.uk` (284 refdomains, `ahrefs/anchors.export.json`).

If that domain's registration or redirect config ever lapses, nearly half the link profile
vanishes. It is not currently broken - this is a fragility finding, not a damage finding.
Action: auto-renew confirmed + a monitor on 2-3 known .co.uk deep URLs. Quick win.

## AUTH-03 (HIGH) - The best-performing pages are the least internally linked

The single strongest number in this lens:

> **/compare/toptal-vs-upwork: 44,019 impressions in 90 days at average position 7.0 -
> and zero internal inlinks.** (joined/pages.json clean-URL row; 0 linkers in
> crawl/internal-links.json; 200 live.)

Cause, verified against production 8 Aug: `/alternatives` page 1 renders links to exactly
**15 of the 30 compare pages**; the other 15 exist only behind `?page=2`. The unlinked
half includes the top Copilot-cited pages: `/compare/dedicated-teams-vs-toptal` (2,351
citations, 1 inlink - and that one is from /alternatives page 1), `/compare/cloud-employee-vs-proxify`
(674 citations, 0), `/compare/cloud-employee-vs-upwork` (278, 0).

Wider distribution (684 real pages with inlink data, joined/pages.json): 94 at zero,
198 at exactly one. Caveat I verified: some "zero" rows are query-param URL variants
(`/about-us?61e47ae8_page=2`) - the counts quoted here were spot-checked on clean URLs.
The brief's "zero orphans" holds in the reachability sense (sitemap); the crawl's
orphans.json contains only param-variant noise.

**The 43 single-inlink pages that earn impressions** are mostly service/technology detail
pages: /services/front-end-developers (3,665 impr), /services/android-developers (3,067),
/technology/laravel-developers (2,544), /technology/php-developers (2,511),
/services/cloud-engineers (2,435), /compare/cloud-employee-vs-andela (2,409 impr at
**position 5.7**). These rank on one paginated hub link and nothing else.

**Fix** (quick win, no design): all 30 compare cards on /alternatives page 1 or a text
"all comparisons" block; a related-comparisons module on each compare page; contextual
links from matching service pages. Note for Jake: Ahrefs' "Internal link opportunities"
tool (Site Audit UI) will generate anchor-level suggestions for free.

## AUTH-04 (MEDIUM) - The competitive gap is content footprint more than raw links

`ahrefs/batch-analysis.json`, 6 Aug:

| Domain | DR | Refdomains | US keywords | Organic traffic |
|---|---|---|---|---|
| cloudemployee.io | 36 | 692 | 48 | 415 |
| toptal.com | 90 | 47,172 | 17,670 | 194,785 |
| turing.com | 74 | 8,357 | 2,511 | 12,584 |
| arc.dev | 72 | 5,003 | 4,895 | 30,821 |
| andela.com | 71 | 5,406 | **49** | 2,339 |
| revelo.com | 70 | 4,158 | 395 | 1,626 |

The Andela row is the tell: 7.8x our referring domains, DR 71 - and 49 US keywords to our
48. Authority without pages targeting keywords buys almost nothing; arc.dev converts the
same authority into 4,895 keywords. Meanwhile we hold 16 of our 48 keywords in the top 3
(batch-analysis) - the domain can rank when a page exists. Sequencing implication for
synthesis: content-gap pages first, outreach as the compounding second track.

## AUTH-05 (MEDIUM) - The outreach list

`ahrefs/link-intersect.export.json`: 30,000 domains (CAPPED - export limit, true total
unknown, per MANIFEST-ahrefs-exports.md), every row 0 links to us by construction.
Intersect ≥5 competitors: 2,603. Filtered to DR 40-92 + domain traffic ≥5k: **131 targets**.

**Tier 1 - claimable profiles/listings (hours, no pitch):**
g2.com (9 competitors, DR 91), cbinsights.com (10, DR 86), builtin.com (8, DR 86),
techbehemoths.com (9, DR 76), designrush.com (7, DR 90), saashub.com (8, DR 79),
producthunt.com (7, DR 91), index.dev (8, DR 72), softwareworld.co (7, DR 73),
getlatka.com (8, DR 72), owler.com (8, DR 73), craft.co (7, DR 72), uplers.com (9, DR 75).

**Tier 2 - editorial pitch (ongoing; use LATAM/PH salary + cost data as the hook):**
research.com (9, DR 83), thenextweb.com (8, DR 89), hackernoon.com (9, DR 88),
techcrunch.com (7, DR 92), techbullion.com (8, DR 81), gitnux.org (7, DR 85),
worldmetrics.org (7, DR 78) - the stats aggregators cite any well-sourced data page.

**Discard from the raw list** (platforms/scrapers, not outreach targets): webflow.io,
netlify.app, hashnode.dev, glarity.app, c99.nl, me.sh, rocketreach.co, contactout.com,
webcatalog.io, grokipedia.com.

Reproduce: filter link-intersect rows on `intersect>=5 && DR 40-92 && traffic>=5000`.

## AUTH-06 (MEDIUM) - The reclaim list, URL by URL

Source: `ahrefs/broken-backlinks.json` (28 rows; the 4 Aug file has 27). Honest headline
first: **the total value here is smaller than the DR numbers suggest** - the DR 91 source
is a UR 0 portfolio citations page - and AUTH-01 recovers more equity. Do them in one pass.

| DR | Dead URL | Verdict |
|---|---|---|
| 91 | /blog/tech-news/the-future-of-drone-technology**%20** | Add whitespace-tolerant normalisation (trailing %20/space → trim). Lands on the /blog catch-all; a specific target doesn't exist. Value modest (source page UR 0). |
| 75 | /blog/productivity/how-to-write-an-nda-for-software-development | **No good live target** (nothing NDA/contract-adjacent for buyers except a staff-aug contract-terms post - defensible: /staff-augmentation/staff-augmentation-contract-terms-explained-...). Otherwise: write/restore, or accept. Do not 301 to an unrelated page. Best single link in the file (testgorilla.com, dofollow, in-content). |
| 73 | /blog/productivity/how-to-create-a-compelling-github-portfolio | Developer-audience content; nearest live is the /for-developers page. Weak match - accept, or restore the article (its twin at /blog/how-to-create-... is also a catch-all now). |
| 61 | /blog/tech-news/sunrise-industries-in-2018 (+DR 52 masaischool variant) | Dated listicle, no target. Accept the 404/catch-all. |
| 59 | /web-developer | **→ /services/web-developers.** Legitimate topical match. Best mechanical win in the list. |
| 58 | /blog/productivity/tools-for-digital-marketing | No target. Accept. |
| 55 | /blog/productivity/5-tips-for-staying-productive-...-working-from-home | Nearest: /managing-engineers/how-to-manage-remote-engineers. Marginal - Jake's call. |
| 53 | /r/remote-r-developer | → /technology hub or a specific R/technology page if one exists. Check /developers/* live set. |
| 53 | /blog/programming-tips/software-developer-mindset | No target. Accept. |
| 48 | /blog/benefits-of-it-outsourcing-service-provider | Curl-check: the obvious twin (/blog/it-outsourcing/partnering-it-outsourcing-service-provider) is itself a 308 → /blog. No live target - accept, or restore. |
| 37 | /blog/it-outsourcing/how-to-hire-react-native-developer-step-by-step-guide | **→ /technology/react-native-developers.** Good match. |
| 34 | /brew/remote-brew-developer, /blog/programming-tips/website-design-tips... | No targets. Accept. |
| 30 | /blog/it-outsourcing/neck-and-neck-...-india-and-the-philippines | → /hiring-tips/hiring-developers-in-the-philippines-... (curl 200). Note /why-the-philippines is itself a 308 → /how-it-works; do not use it. |
| 28-21 | mobile-data, startup-courses (x3 femaleswitch), laptop-business-ideas | No targets. Accept. |
| 18 | 6x papasearch.net + /careers/graphic-designer | Scraper, zero value. Leave 404. |
| 3, 0 | onlyjs.com, koralkyanastazie.cz (/careers/shopify-developer-senior) | Leave 404. Careers pages belong to the talent site, which is not ours. |

Net: ~5 clean redirects (/web-developer, IT-outsourcing pair, react-native, philippines),
1 normalisation rule, 2 restore-or-accept decisions for Jake (NDA, github-portfolio),
rest accepted losses. State that in the roadmap so nobody re-litigates the DR 18 rows.

## AUTH-07 (HIGH) - AI citations: real, concentrated, and one cited page is a live 404

`bing/cloudemployee.io_AIPageStatsReport_8_7_2026.csv` (97 pages, 8,640 citations):

- `/compare/dedicated-teams-vs-toptal` = **2,351 citations, 27.2% of everything**
- Top 12 pages = 82% cumulative
- By section: /compare 45.3%, /staff-augmentation 16.2%, /managing-engineers 8.7%
- **`/team/shawnee-malesich` = 286 citations (9th) and returns 404** (curl-verified 8 Aug).
  Same shape as Tech Debt #58's per-locale retirement problem - decide restore vs 301 to /team.
- talent.cloudemployee.io/ appears with 292 citations - excluded from our totals per hard rule 4.

What the cited pages have in common: long-form (1,000-4,800 words) named-competitor
comparison or ranked-list content. The `/staff-augmentation` ranked-list format earned
1,128 citations across 3 pages - that is the replicable pattern. And per AUTH-03, these
same pages are the internally under-linked ones.

## AUTH-08 (MEDIUM) - Brand Radar zero vs Copilot 7.5k: both right, one correction

`bing/cloudemployee.io_AISearchQueriesReport_8_7_2026.csv` (146 queries, 5,704 citations):
Comparison 48.8%, Research 28.7%, Navigational 13.7% (one query: "cloud employee"),
Informational 4.8%, Commercial 1.0%. Queries naming Toptal: 44.7% of citations.

So the brief's proposed reading - dominate comparison, invisible on generic - **holds on
the comparison half but is too strong on the generic half**: "best practices managing
remote engineers" (214 citations, 32.6% share), "staff augmentation services" (50),
"best offshore staff augmentation firms... Latin America" (47) are generic and cite us.
The precise reconciliation: **Copilot cites us on comparison + staff-augmentation +
engineering-management queries; Brand Radar's zero is a different instrument** - 10
developer-hiring-marketplace buyer prompts across ChatGPT/Gemini/Perplexity/AI Overviews
(day-one baseline 7 Aug: Toptal 7, Turing 6, arc 6, BairesDev 6, us 0 -
MANIFEST-ahrefs-exports.md follow-up #2). Outside Bing we currently have **no page-level
visibility at all** (Ahrefs AI columns not grantable on this plan, MANIFEST-ahrefs.md).

Action: wire the free Brand Radar API (`POST /v3/brand-radar/mentions-overview`, verified
0 units) into a weekly pull. Memory note: Brand Radar needs manual pickup ~14 Aug.

## AUTH-09 (MEDIUM) - The Copilot collapse: exonerated twice, cause unknown, watch weekly

`bing/cloudemployee.io_AIPerformanceOverviewStats_8_7_2026.csv`: 186 citations/10 cited
pages (26 Jul) → 58/4 (27 Jul) → 13/2 (28 Jul) → 0/0 (2 Aug) → 9, 13, 23 since cutover.
The collapse is in cited *pages* (10→2), i.e. pages fell out of Bing's grounding set.

Corroboration hunt in GSC (`gsc/full-date.json`): **none - the opposite.** Mean daily
impressions 4,120 (12-26 Jul) vs 5,592 (27 Jul-2 Aug), +36%, clicks and position flat.
Nothing site-side explains a Bing-only, pre-cutover event. "Cause unknown, watch weekly"
is the correct answer. If cited pages haven't recovered to ~10/day by ~31 Aug, escalate
to Bing Webmaster (IndexNow/sitemap). The recovery is landing on the new site's pages,
which is the reassuring detail.

## AUTH-10 (LOW) - Internal anchors: healthy, two component-level fixes

38,605 internal anchors (`ahrefs/site-audit/...anchor-texts...csv`, UTF-16 TSV):
650 empty, 1,130 classic-generic ("view all" 684, "read article" 442, "here" 4), and
2,046 "read full story ›" blog-card CTAs. Everything else descriptive. Verdict: NOT the
"click here" disaster the brief feared - ~4.6% generic excluding the blog card.

Real defect found instead: **Material icon ligature names are concatenated into anchor
text sitewide** - "location_oneastern europetop-tier technical and ai talent",
"event_upcomingevents & webinars", "calculatetools & quizzes" (686 occurrences each =
every page's chrome). Crawlers and screen readers both eat that. Fix: aria-hidden the
icon span; give blog cards the article title as anchor/aria-label. Both quick wins.

## AUTH-11 (LOW) - External anchors: 75% brand, plus an inert spam footprint

`ahrefs/anchors.export.json`: brand/URL anchors = 1,009 of 1,346 refdomain-anchor pairs
(75%). Penalty-safe, but no descriptive-anchor equity. A visible nofollow spam cluster
(~130 refdomains) pushes "SEOExpress.org" text mentioning cloudemployee.com.au and .io.
No disavow needed (nofollow, inert). Open question for Seb: **is cloudemployee.com.au
CE's domain?** It's targeted alongside .io. Also means the "987 referring domains"
headline overstates the clean profile.

---

## CROSS-LENS NOTES

- **Performance lens:** nothing to add from here; the cited-page set is the same
  compare/staff-aug templates - if the blog detail template is the Lighthouse-worst, note
  the AI-cited pages are mostly topic-hub articles on that template.
- **Content lens:** the AI-citation winning format (ranked lists with named competitors +
  pricing, 1,000-4,800 words) is the strongest content-brief evidence in the corpus.
  Also: `ahrefs/content-gap-us.export.json` (25,557 rows) was not analysed here beyond
  the intersect - it is the content lens's raw material. AUTH-04's Andela-vs-arc.dev
  contrast is the strategic frame: content footprint multiplies authority.
- **Technical lens:** (1) GSC/crawl still surface Webflow query-param pagination URLs
  (`?61e47ae8_page=2`) as indexed variants - canonical handling worth a look;
  (2) the hub catch-all redirect (everything unknown under /blog and /developers/* 308s
  to a hub) is doing double duty as a 404 handler - the soft-404 pattern in AUTH-01 is
  its side effect; (3) trailing-whitespace URL normalisation is missing (%20 → 404).
- **UK/locale lens:** /uk compare clones earn Copilot citations (355 + 58 + 77) -
  whatever hreflang/duplication verdict that lens reaches should account for the UK
  clones having independent AI visibility.

## DATA GAPS

1. **No page-level AI citation data outside Bing.** Ahrefs AI columns 400 on this plan;
   Brand Radar gives brand mentions, not cited URLs. ChatGPT/Perplexity/Gemini position
   is baselined (zero) but unexplained at page level.
2. **Link-intersect export capped at exactly 30,000 rows** - the tail (intersect 1-2,
   low DR) is truncated; fine for outreach, but the true universe is unknown.
3. **Live per-link backlink graph (8,816 links x 82 columns)** still missing until the
   Ahrefs unit reset on 17 Aug (`ahrefs/RESUME.md`) - the `is_lost`/`lost_reason` fields
   there would let us measure post-cutover link loss directly. Re-run
   `npx tsx scripts/seo/ahrefs-deep-pull.ts` on the 17th.
4. **Why the Copilot grounding set shrank on 27 Jul** - not answerable from any file we
   hold; only Bing-side. Weekly watch is the mitigation.
5. **cloudemployee.com.au ownership** - not in any dataset; ask Seb (AUTH-11).

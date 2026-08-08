# LENS 3 - Content and Keywords

Analyst run: 8 Aug 2026. Data: audit-output/seo-intel/2026-08-06/. Machine-readable findings: analysis/content.json (CONT-01 to CONT-10).

Governing steer: upgrading existing pages beats writing new ones. The data agrees emphatically; of everything found, only two new pages are worth commissioning (CONT-07). Everything else is upgrade work on URLs that already have rankings, internal links, or AI citations.

A measurement warning first, because it reshapes every number below.

## CONT-04 (high, quick win): the impression data is polluted, and our CTR curve is unusable

Two machine-generated query families dominate several headline pages in gsc/full-query-x-page.json:

- "<company> engineering challenges nearshoring" (siteimprove 8,092 imp, causalens 8,088, rallyware 6,543, sydecar 5,873, launchdarkly, mattermost, pointclickcare, vestwell, ledgebrook...), all landing on /nearshoring-offshoring/what-is-nearshoring-benefits-and-challenges-for-software-development-teams at pos 4-8 with 0 clicks. That page's 47,822 joined impressions are mostly this.
- "number of employees at <random domain>" (cloudsports.at 3,237, cloudcomunicaciones.cl 2,903, dozens more), all landing on /about-us, 0 clicks.

Consequence: site non-brand CTR at positions 4-6 is 0.05 percent (35 clicks on 74,528 impressions), roughly 100x below any human curve. These are almost certainly AI-agent tool-use searches. So:

1. Nothing below is ranked on raw impressions_90d; I used query-level data with junk families excluded.
2. Every CTR-based impact figure below uses industry-standard curves (roughly 4-6 percent at pos 3-5, 1-2 percent at pos 10) and is labelled an estimate.
3. /nearshoring-offshoring/what-is-nearshoring-benefits... and /about-us are NOT the top opportunities their impression counts suggest. /compare/toptal-vs-upwork (44,019 imp, 12 clicks, top queries "toptal vouchers" and "toptal api public") is a third false positive: high numbers, wrong intent.

Silver lining, for the AI-visibility lens: AI agents repeatedly select our pages as sources. That corroborates the AEO strategy.

## The headline: one upgrade programme covers findings 1, 2 and 9

### CONT-01 (critical): the hire-page fleet is 600-900 words and stuck at position 10-30 for its exact target keywords

The /services/* and /technology/* hire pages already rank in striking distance for the precise commercial keywords the Ahrefs content gap says competitors own. Cross-referencing gsc/full-query-x-page.json (26,110 rows, talent.* excluded, non-brand, junk families excluded) with joined/pages.json word counts:

| Page | Clean striking-distance imp (pos 8-30, queries >=100 imp) | Flagship query (imp, pos) | Words |
|---|---|---|---|
| /services/philippines-developers | 18,257 | hire developers in the philippines (1,156, 12.9) | 896 |
| /technology/typescript-developers | 17,716 | hire typescript developers (5,412, 10.9) | 628 |
| /technology/aws-developers | 11,766 | hire aws developers (4,711, 23.3) | 625 |
| /services/latam-developers | 11,244 | hire latam developers (4,264, 28.2) | 884 |
| /services/devops-engineers | 6,908 | devops staff augmentation (1,866, 13.3) | 801 |
| /technology/openai-developers | 5,389 | hire openai developer (1,170, 9.2) | ~630 |
| /services/filipino-developers | 4,422 | hire developer philippines (720, 15.5) | ~780 |
| /technology/nodejs-developers | 3,581 | nearshore nodejs engineer (1,597, 15.9) | 624 |
| /technology/dotnet-developers | 3,410 | hire .net developers (619, 26.2) | 622 |
| /services/no-code-developers | 3,172 | hire no code developers (1,206, 11.7) | 811 |
| /technology/python-developers | (13,837 joined imp, avg pos 50.1) | hire python developers | 647 |

Plus front-end, cloud-engineers, full-stack, back-end, android, kotlin, langchain, xamarin, laravel, php, ionic, java: all 595-820 words, all avg pos 20-58 (joined/pages.json).

The competitors winning these terms (per the content-gap competitor URL columns) do it with exactly one template: toptal.com/developers/<tech>. The fix is a template-level upgrade applied across the fleet: expand each page to 1,500-2,000 words with a rates table, vetting process, engagement models, FAQ, and the query variants GSC already lists per page. Estimated 2-3 hours per page through cited.io, ~40 hours for the priority 15.

Impact (estimate, medium confidence): ~90,000 clean striking-distance impressions across the set; at industry CTR for pos 3-8, on the order of 2,000-4,000 clicks/month, on keywords whose gap-file CPCs run 11-49 USD.

### CONT-02 (high): the content gap quantified, and it mostly maps to pages we already have

The gap export (ahrefs-exports/cloudemployee.io-content-gap-subdomains-us_2026-08-06_16-42-53.csv, 25,557 keywords) has an empty cloudemployee.io position on every row: it is a true gap set. Filtered to Commercial or Transactional intent, non-branded (no competitor/vendor brand in the keyword), volume >= 100, and 2+ of the 10 competitors in the top 10: **642 keywords, 159,250 monthly searches**.

Clustered:

| Cluster | Kws | Volume | Median KD | Existing target page |
|---|---|---|---|---|
| outsourcing / offshore / nearshore | 96 | 24,100 | 8 | blog posts only; see CONT-07 pillar |
| mobile (ios/android/flutter/unity) | 48 | 11,150 | 7 | /services/ios-developers, /services/android-developers, /technology/unity-developers |
| AI/ML | 23 | 9,450 | 42 | /services/ai-engineers (hard: KD 42-54, defer head terms) |
| web dev services | 26 | 6,900 | 9 | /services (hub) |
| backend | 5 | 5,500 | 10 | /services/back-end-developers |
| full stack | 23 | 5,300 | 6 | /services/full-stack-developers |
| php / laravel / wordpress | 22 | 5,100 | 5.5 | /technology/php-developers, /technology/laravel-developers |
| javascript | 22 | 4,550 | 5 | MISSING (CONT-07) |
| python | 26 | 4,350 | 5 | /technology/python-developers |
| frontend | 14 | 4,000 | 8 | /services/front-end-developers |
| devops / cloud / aws / azure | 12 | 3,500 | 2.5 | /services/devops-engineers, /technology/aws-developers, /technology/azure-developers |
| react / react native | 12 | 3,300 | 6.5 | /technology (react pages exist per crawl) |
| java | 8 | 3,200 | 3 | /technology/java-developers |

Best single keywords by low-KD-high-CPC: hire backend developers (2,500 vol, KD 10, CPC 29.40), hire dedicated java developers (1,700, KD 3, CPC 33.85), hire offshore developers (600, KD 5, CPC 48.65, 4 competitors), hire python developer (600, KD 4, CPC 30.00, 4 competitors), hire full stack developers (900, KD 8, CPC 15.17, 4 competitors).

The 271-keyword "(other)" bucket (58,550 vol) is mostly off-vertical noise (freelance seo services, hire a hacker, discord bot developer, app designers); do not chase it. The "hire a hacker" type rows are why the raw 642 total overstates the addressable volume; the clusters table above is the honest scope.

### CONT-09 (medium): Philippines cannibalisation

"hire developer philippines" returns three of our URLs in GSC (filipino-developers pos 15.5, /hire/philippines-offshoring pos 7.9, philippines-developers pos 9.8), with the hiring-tips cost post making a fourth page in the family. ~27,500 clean striking-distance impressions split four ways, none top-5, on CE's core geo offer. Recommend consolidating on /services/philippines-developers for hire intent (it has 330 internal links in), differentiating or 301ing the other two, keeping the blog post on cost/rates intent. Needs Jake's sign-off (retires live URLs) and should wait until after the 31 Aug migration read.

## Individual page upgrades

### CONT-03 (high): the staff augmentation pillar

/staff-augmentation/what-is-staff-augmentation-and-what-are-the-benefits holds 22,263 CLEAN striking-distance impressions ("what is staff augmentation" 3,354 pos 19.3, "augmented staff" 2,051 pos 15.0, "benefits of staff augmentation" 1,533 pos 13.5, "staff augmentation meaning" 1,366 pos 27.4) at 1,783 words and 5 clicks. Best individual upgrade on the site: definition answer-box in the first 60 words, meaning/benefits/vs-outsourcing/pricing H2s, and hub-and-spoke links to the 13 other staff-augmentation posts (several currently orphaned, CONT-06). Estimated 900-1,100 clicks/month at pos 3-5 (industry curve, medium confidence).

### CONT-10 (medium): the cost/definitional trio

- /nearshoring-offshoring/nearshore-vs-offshore-costs-2026-software-development-rates: 6,835 clean striking-distance imp, cost queries at pos 9-21, only 684 words, and already 48 Copilot citations.
- /nearshoring-offshoring/what-is-it-outsourcing-definition-models-when-to-use-it: 9,468 imp, "outsourcing models" pos 11.2, 852 words.
- /nearshoring-offshoring/what-is-offshoring-cost-effective-tech-teams-explained: 3,779 imp, "what is offshoring" pos 8.4.

Upgrade each to 1,800+ words with per-country rate tables (link the live calculators) and cross-links up to the CONT-07 outsourcing pillar.

## New content worth commissioning (the short list)

### CONT-07 (medium): exactly two holes

1. **/technology/javascript-developers does not exist** (no javascript path in the 656-page crawl) against a 22-keyword, 4,550-vol cluster at median KD 5 where 4 competitors rank top-10. Standard hire-page template.
2. **A definitive software-development-outsourcing pillar.** The 24,100-vol outsourcing/offshore/nearshore cluster is served only by blog posts capped at pos 11-22. "outsourcing software development" is 1,900 vol at KD 1. Competitors win the whole cluster with one guide URL each (turing.com/resources/everything-you-need-to-know-about-software-outsourcing; arc.dev/employer-blog/offshore-software-development). One pillar page, with the existing nearshoring/offshoring posts linking up to it.

Also from CONT-05, for cited.io's queue: more ranked-listicle and X-vs-Y pages in the proven format (below), targeted at gap clusters, but as upgrades of the existing best-staff-augmentation pages first.

## What already works

### CONT-05 (high): the AI-citation template

Of 95 pages with Copilot citations (joined copilot_citations, from bing/cloudemployee.io_AIPageStatsReport_8_7_2026.csv), the top 10 are almost all long-form ranked comparisons: /compare/dedicated-teams-vs-toptal 2,351 citations (3,502 words); /compare/cloud-employee-vs-proxify 674; /staff-augmentation/best-staff-augmentation-companies-in-latin-america-2026 658 (4,830 words, also 16,642 Google imp at pos 6.5); /compare/toptal-vs-cloud-employee... 418 (3,060); /staff-augmentation/best-staff-augmentation-companies-2026 254 (4,042). Median ~3,200 words, ranked list or head-to-head, explicit pricing, tables, year in title.

That is the cited.io production template. It matters because the Brand Radar day-one baseline is AI share of voice 0 percent vs Toptal 7 mentions (MANIFEST-ahrefs-exports.md). Caveat: citation counts predate the 27 Jul Copilot collapse; treat as directional.

Google clicks tell a different story: 16 months of full-page data (gsc/full-page.json) is brand-dominated (/ 3,054 clicks, /ph 1,204, /about-us 368) with only one blog post in the top 10 (/managing-engineers/data-engineer-vs-data-scientist-vs-ai-engineer, 128 clicks, 30,889 imp, pos 9.5, itself a comparison format and an upgrade candidate: "data engineer vs ai engineer" 1,338 imp pos 5.9). AI citations and Google clicks select the same format; the site earns almost no non-brand Google clicks yet, which is what CONT-01/02/03 attack.

### CONT-06 (medium, quick win): the newest content is the least linked

7 posts have ZERO inbound internal links from all 656 crawled pages, and they are precisely the new cited.io-style pieces: staff-augmentation-vs-outsourcing, latam-staff-augmentation-trends-2026 (680 imp, 5 citations), staff-augmentation-fintech-security-compliance (61 citations), staff-augmentation-myths-debunked, staff-augmentation-pricing-models-in-latam (526 imp), and the two cloud-employee-pricing posts. All 2,700-3,500 words, all earning impressions with no link equity at all. More broadly, 32 of 70 posts get no links from any other post (median post-to-post outbound is 6, so posts link out, mostly to the same few targets). Fix: contextual links from the CONT-03 pillar and siblings; a related-posts pass per hub. Hours of work, immediate.

## CONT-08 (low): thin content is a non-problem, do not run a thin-content programme

Of 165 pages under 300 words (crawl/thin-pages.json), 118 have zero 90d impressions, and those are 80 /uk clones, 19 /team bios, 10 /customer-story stubs, 6 /book-a-call pages. The 47 with impressions are functional pages thin by design (/contact 4,667 imp pos 7.5, team bios, video pages, hub indexes). Only /download/10-ai-prompts (391 imp, pos 15.7, 275 words) and the video pages merit a light copy pass. Bulk expansion would produce nothing.

## Ranked upgrade list (the deliverable)

1. /staff-augmentation/what-is-staff-augmentation-and-what-are-the-benefits: restructure as pillar, answer-box lead, link all 13 cluster posts (CONT-03).
2. /technology/typescript-developers: 628 to ~1,800 words, rates/vetting/FAQ, cover the 8 GSC variants (CONT-01).
3. /services/philippines-developers: same template upgrade, absorb the query family, then the CONT-09 consolidation after 31 Aug.
4. /services/latam-developers: same; add the latam staff-aug posts as spokes.
5. /technology/aws-developers: same; fold "hire aws cloud engineers" variants.
6. /services/devops-engineers: same; add a staff-augmentation angle section ("devops staff augmentation" pos 13.3).
7. /nearshoring-offshoring/nearshore-vs-offshore-costs-2026-software-development-rates: 684 to 1,800+ words, per-country rate tables (CONT-10).
8. /technology/python-developers: template upgrade against the KD 5 python cluster.
9. /nearshoring-offshoring/what-is-it-outsourcing-definition-models-when-to-use-it: models matrix, link to new pillar.
10. /technology/openai-developers, /services/no-code-developers: template upgrades (already pos 9-12, smallest push needed).
11. /staff-augmentation/best-staff-augmentation-companies-2026 and -in-latin-america: refresh + internal links; they are the AI-citation engines (CONT-05).
12. /managing-engineers/data-engineer-vs-data-scientist-vs-ai-engineer: expand the vs-sections (queries at pos 5.9-15.3).
13. Remaining hire fleet (dotnet, nodejs, front-end, full-stack, back-end, cloud-engineers, android, kotlin, java, langchain) in descending clean-impression order.
14. Internal-link pass: 7 orphans + 32 no-post-inbound posts (CONT-06, do first, it is hours).

New commissions (only these): /technology/javascript-developers; the software-development-outsourcing pillar guide (CONT-07). Then cited.io listicle/comparison production against gap clusters in the CONT-05 format.

## CROSS-LENS NOTES

- The junk-query pollution (CONT-04) affects every lens using impressions; synthesis should apply the family filters before deduplicating impact claims.
- 80 of the 118 zero-impression thin pages are /uk clones; the UK-duplication and indexation story belongs to the international/technical lens (crawl reports 307 of 326 UK pages word-identical to US, crawl/uk-us-pairs.json).
- /about-us appears twice in GSC top pages, once as /about-us?61e47ae8_page=2 (4,338 imp, 65 clicks): parameter-URL indexation, technical lens.
- /team/shawnee-malesich has 286 Copilot citations and 144 clicks on a 0-word crawl count; either a crawl word-count artifact or a client-rendered page, worth a technical look.
- The nearshoring "engineering challenges" junk family clicking at pos 4-8 with 0 CTR may interest the AI-visibility lens: it looks like LLM agents running templated research queries and selecting us.
- Internal linking: hire pages show internal_links_in of either ~330 (nav) or 0-8 (content only); the mega-menu carries the fleet, in-content linking is near absent (linking lens will quantify).

## DATA GAPS

- No per-keyword volume for the GSC queries (GSC gives impressions, not market volume); matching-terms.export.json covers "dedicated development" seeds only. The 17 Aug Ahrefs unit reset should pull keyword-ideas volumes for the CONT-01 target list (add to scripts/seo/ahrefs-deep-pull.ts).
- No lead data (confirmed absent); every priority here is ranked on traffic value and CPC as the commercial proxy, not revenue.
- Copilot citation counts predate the 27 Jul collapse; a post-recovery pull is needed before treating CONT-05 numbers as current.
- Content-gap export is US only (a GB export exists only for organic keywords, 10 rows); UK opportunity is unquantified.
- No competitor content-QUALITY data (word counts/structure of the winning competitor pages inferred from URL patterns, not crawled). A small crawl of the ~30 competitor URLs that win the biggest clusters would sharpen the cited.io briefs.

# SEO analysis briefs — six lenses plus synthesis

**What this is:** the prompts for the analysis phase of the SEO programme. The
collection phase is complete (roughly 380MB across five sources, assembled 6-8
Aug 2026). These briefs turn it into a ranked roadmap.

**How to run:** each lens is an independent session. Run all six in parallel,
then the synthesis once they have all reported. Every lens reads the same data
and writes to the same place; none of them depends on another.

**Model:** Fable for all seven.

Authored 8 Aug 2026.

---

## SHARED PREAMBLE

Paste this block at the TOP of every one of the seven prompts. It is identical
each time and it is what stops seven sessions reaching seven different sets of
facts.

```
Today is 8 August 2026. The site went live on 3 August 2026.

You are one analyst in a six-lens SEO analysis of cloudemployee.io. Five
other analysts are running in parallel on the same data with different
lenses, and a seventh session will synthesise all six.

**On overlap.** The lenses deliberately overlap - internal linking will be
found by at least three of them, from different angles. That is by design;
the synthesis session deduplicates, and a finding reached independently by
three lenses is stronger than one reached by one. So do NOT skip something
because you think another lens owns it. Analyse anything your lens can see.
What you should not do is go hunting outside your lens: if you notice
something important that is clearly someone else's territory and you have
no angle on it, put it under CROSS-LENS NOTES rather than digging in.

## Context, read first

- CLAUDE.md - the project. The site went live on cloudemployee.io on 3 Aug
  2026, migrated from Webflow to Next.js + Sanity.
- docs/seo/SEO_PROGRAMME.md - the plan as it stood on 4 Aug. Parts of it
  have since been proven wrong by data. Treat it as a hypothesis to test,
  not as fact. See ALREADY FIXED below before you report anything from it.
- docs/seo/POST_LAUNCH_AUDIT.md - the launch-day audit.
- audit-output/seo-intel/2026-08-06/MANIFEST*.md - what every data file
  is, how it was pulled, and its known gaps. READ THE MANIFESTS BEFORE
  THE DATA.

## The data

Everything lives under audit-output/seo-intel/2026-08-06/:

| Folder | What |
|---|---|
| joined/pages.json | THE MASTER TABLE. One row per page, every source joined. START HERE. |
| gsc/ | Search Console, 16 months, 49 files, no row caps hit |
| crawl/ | Our own crawl of 6,520 URLs: titles, H1s, word counts, canonicals, hreflang, schema, internal links, UK-clone verdicts |
| ahrefs/ | Ahrefs API pull + 15 UI exports (backlinks, refdomains, anchors, content gap vs 10 competitors, link intersect) |
| ahrefs/site-audit/ | Post-migration site audit: Lighthouse per URL, duplicate content, links-to-redirects, missing alt, 66 issue reports |
| bing/ | Bing Webmaster + Microsoft Copilot AI citations |
| hubspot/ | Leads per page - MAY BE ABSENT or flagged untrustworthy, check the manifest |

## Hard rules

1. **Start with joined/pages.json.** It is the pre-joined per-URL table. Go
   to raw sources only for what it does not carry. Read MANIFEST-joined.md
   FIRST - it records per-column coverage, so you can see which columns are
   well populated and which are mostly null. If a column you need has poor
   coverage, go to the raw source rather than drawing conclusions from a
   sparse column. If the file does not exist at all, proceed from the raw
   sources and say so prominently in your report.

2. **Never load a large file whole.** content-gap-us.export.json is 108MB;
   links is 89,194 rows; anchor-texts is 38,605. Stream, grep, aggregate,
   sample. A session that cats a 108MB file dies and produces nothing.

3. **anchor-texts CSV is UTF-16, tab-delimited.** Every other CSV is UTF-8,
   comma-delimited.

4. **EXCLUDE talent.cloudemployee.io.** It is a separate, still-live Webflow
   site that is not ours and was never migrated. It is 185 of 1,257 pages in
   the GSC data - large enough to distort any unfiltered read.

5. **Cite the source of every claim.** File path plus the number. A finding
   without a citation is an opinion and will be discarded at synthesis.

6. **Say when you do not know.** "The data does not answer this" is a valid
   and valuable finding. Do not fill a gap with a plausible guess. Every
   estimate must be labelled as an estimate.

## Data caveats you must respect

- **The post-cutover window is 5 days (3-7 Aug), of which only 3 are final.**
  It is NOT enough to judge the migration's effect on traffic. Do not present
  it as a verdict. A real read comes around 31 Aug.
- **Google holds no field performance data on us.** Ahrefs' site audit shows
  0 of 688 pages have CrUX metrics. So Core Web Vitals are not currently
  affecting rankings much either way. Lab scores are all we have, plus Vercel
  Speed Insights.
- **There is NO lead data. Confirmed, not a maybe.** The HubSpot token is
  forms-only with no CRM scopes, so buyer enquiries cannot be separated from
  spam, vendor pitches and job applicants. The pull deliberately bailed out
  rather than produce a misleading table. `leads_12m`,
  `leads_qualified_12m` and `leads_became_deal_12m` are null on every row.
  Rank on traffic, not revenue, and say so where it matters. Raw submission
  counts do exist in hubspot/ (303 submissions across 121 page URLs) but are
  NOT trustworthy for ranking - do not quietly use them as a proxy.
- **`lighthouse_score` is null on every row.** Ahrefs holds per-URL
  Lighthouse data but it was not in the export we took. Performance evidence
  comes from Vercel Speed Insights (real users, per route) and the Ahrefs
  site-audit aggregate (588 pages: 281 Poor, 307 Needs improvement, 0 Good).
- **`impressions_90d` covers only 320 of 7,027 rows, and that is real, not a
  gap.** Roughly half the sitemap has never earned an impression, mostly the
  UK half. Treat a null as "earned nothing", not "unknown".
- **7,027 rows is not 7,027 pages.** Only 3,845 return 200 and only ~688 are
  real internal HTML pages; the rest are redirect sources and known paths
  from other datasets. Filter on status and template_type before counting
  anything.
- **Microsoft Copilot citations collapsed 98% on 27 July**, a week BEFORE
  cutover, and are slowly recovering. The migration did not cause it. Cause
  unknown.
- **Ahrefs API data is partial** - the monthly unit allowance was exhausted
  mid-pull on 6 Aug and resets 17 Aug. The UI exports are more complete than
  the API pull; prefer them. See ahrefs/RESUME.md.
- Vercel Speed Insights is real-user data but only started collecting 6 Aug,
  and the mobile sample was too small to be coherent as of 7 Aug.

## ALREADY FIXED - do not report these as problems

SEO_PROGRAMME.md and POST_LAUNCH_AUDIT.md were written on 4 Aug and describe
these as live problems. They have since been fixed and verified in
production. Reporting them again wastes a slot in the roadmap and makes the
whole report look careless.

- **/llms.txt returned 404.** Fixed. Returns 200 as of 7 Aug.
- **The Marker.io bug-report widget rendered for real customers.** Fixed and
  verified absent from production HTML.
- **Both were the same root cause** - three copies of a canonical-host check
  comparing build-time env vars. Now one shared helper at
  site/src/lib/canonical-host.ts reading the request host. Merged as 2fe4fcb.
- **Ahrefs did not cover the domain** (Tech Debt #4). It does now.
- **Vercel Speed Insights was not enabled.** It is, and collecting.
- **Screaming Frog crawl outstanding.** No longer needed - the Ahrefs site
  audit plus our own 6,520-URL crawl cover it.
- **insight-bank/cited.io "not on the filesystem".** It exists, at
  github.com/galaxyfunk/insight-bank. It is a real AEO content platform.
- **Bing / AI citation data unavailable.** It is available and pulled.

If you find EVIDENCE that one of these is still broken, that is a genuine
and important finding - report it with the evidence. What you must not do is
report it because a 4 Aug document said so.

## Falsify your own findings

Before you write a finding down, ask what would have to be true for it to be
wrong, and go and check that. Specifically:

- Is this already fixed? Check the current code or the live response, not a
  document describing the past.
- Is the number what I think it is? "Missing alt text: 688" counts image
  INSTANCES, not pages, and some will be decorative images where empty alt
  is correct. Check what a metric actually counts before building on it.
- Am I reading a sample as if it were the whole? Several files are partial
  by design and the manifests say which.
- Would this survive someone hostile checking it?

A smaller set of findings that all hold up is worth far more than a long
list where a third collapse under scrutiny. The synthesis session WILL
check your top findings against source files, and anything that fails is
discarded.

## What you produce

TWO files, both in audit-output/seo-intel/2026-08-06/analysis/:

**1. `<lens>.json`** - machine-readable, for the synthesis session. An array
of findings, each shaped:

{
  "id": "PERF-01",
  "title": "One line, specific and factual",
  "lens": "performance",
  "severity": "critical | high | medium | low",
  "evidence": [
    {"claim": "588 pages measured, 0 score Good",
     "source": "ahrefs/site-audit/...csv",
     "value": "281 Poor, 307 Needs improvement"}
  ],
  "affected_urls": {"count": 588, "sample": ["/", "/pricing"]},
  "effort": {"band": "hours | days | weeks", "estimate_hours": 4,
             "who": "claude | jake | seb | agency"},
  "impact": {"metric": "clicks | leads | rankings | crawl efficiency",
             "estimate": "text", "confidence": "high | medium | low"},
  "depends_on": ["other finding ids, or empty"],
  "quick_win": true,
  "recommendation": "What to actually do, concretely"
}

**2. `<lens>.md`** - the readable version. Findings in priority order, with
your reasoning, the numbers, and anything ambiguous.

## Definitions, so all six of us agree

- **Quick win** = shippable in under one day, needs no design work, no new
  content written from scratch, and no decision from Jake or Seb.
- **Effort** is calendar effort for whoever does it, not agent tokens.
- **Impact** must be grounded in a number from the data. "Improves SEO" is
  not an impact. "1,400 impressions at position 11; moving to 5 would be
  roughly 60 clicks a month" is.

## Also report

**CROSS-LENS NOTES** - anything important you saw that belongs to another
lens. The synthesis session will route it.

**DATA GAPS** - anything you needed and could not get. This feeds the next
collection round.

## What NOT to do

- Do not write code fixes. This is analysis. The roadmap comes first.
- Do not modify anything outside analysis/.
- Do not commit to main. If you commit at all, branch and use a git worktree.
  Other sessions are working in this repo.
```

---

## LENS 1 — QUICK WINS

```
YOUR LENS: quick wins. Prefix your finding ids QW-.

THE QUESTION: what can we ship in the next week or two that measurably
increases traffic or leads? This is the lens Jake cares most about. Bias
hard towards things that are cheap, safe, and reversible.

Look for, at minimum:

1. **Striking distance rankings.** Pages at position 5-20 with real
   impressions. These move to page one with on-page work rather than new
   content. Rank by impressions x realistic position gain. Known example
   to verify and extend: "toptal alternatives" sits at position 4 on
   ~2,000 monthly searches pointing at /alternatives.

2. **High impressions, terrible click-through.** Pages ranking well that
   nobody clicks. That is a title and description problem and it is an
   hour of work per page. Distinguish carefully from pages at position
   25+, which have a RANKING problem that no title rewrite fixes.

3. **Metadata defects at scale.** From the Ahrefs site audit: 71 meta
   descriptions too long, 46 titles too long, 18 missing entirely, 26
   pages where the page title and the SERP title disagree. Which of those
   sit on pages with real impressions? Those are the ones worth fixing.

4. **Internal linking.** 211 pages have exactly one incoming internal
   link; 153 internal links point at a redirect rather than the final URL.
   Both are mechanical fixes. Work out which pages would benefit most -
   ideally pages already ranking 5-20 that are starved of internal links.

5. **Cannibalisation.** Two of our pages competing for the same query.
   Find them in the GSC query x page data. Usually fixed by consolidating
   or re-pointing internal links.

6. **Pages that lost traffic at or before the migration.** Ahrefs flagged
   11 pages with dropped organic traffic and 1 that fell out of the top
   10. Identify them. Be careful: the post-cutover window is only 5 days
   and 3 final, so do not attribute causation you cannot support.

7. **Anything else cheap.** 4 x 404 pages, 4 x 4XX, 3 hreflang pointing at
   redirects or broken pages, 4 redirects sitting in the sitemap, 1 broken
   redirect, 27 external links to dead pages.

FOR EACH quick win: the URLs, the current numbers, the specific change,
the hours, and the expected gain WITH its arithmetic shown.

DELIVERABLE, on top of the standard two files: a single ranked table,
best-first, of everything shippable inside two weeks. This table is the
thing Jake will work from on Monday morning. Make it good.
```

---

## LENS 2 — TECHNICAL HEALTH

```
YOUR LENS: technical health. Prefix your finding ids TECH-.

THE QUESTION: what is technically broken or degraded, and what does it
cost us?

Cover:

1. **Indexing reality vs intention.** gsc/url-inspection.json holds
   Google's own verdict per URL: coverage state, the canonical GOOGLE
   selected (not the one we declared), and last crawl time. Where does
   Google disagree with us? That is the most valuable question in this
   lens. Note the file may cover only a sample - check the manifest.

2. **Sitemap integrity.** 653 URLs declared. Which return non-200? Which
   200s are missing from it? Ahrefs found 4 redirects sitting in the
   sitemap, 62 pages added, 2 indexable pages absent.

3. **Redirects.** 110 3XX, 16 redirect chains, 1 broken redirect, 776
   internal links pointing at redirects. Next.js runs redirects() BEFORE
   routing while Webflow does the opposite - see CLAUDE.md - so redirect
   bugs behave differently here than on the old site.

4. **Canonicals and indexability.** 25 noindex pages, 2 nofollow, 51
   "noindex became indexable" (probably the robots.txt flip at cutover -
   verify), 7 "indexable became non-indexable" (that one matters), 2
   canonical changes.

5. **Structured data.** What JSON-LD we emit per template, whether it
   parses, whether types are right. Note Tech Debt #49: nav JSON-LD skips
   the XSS-safe serialiser.

6. **hreflang.** 3 pointing at redirects or broken pages. Check
   reciprocity across all 326 UK pairs.

7. **Duplicate content beyond the UK issue.** Ahrefs flags 389
   near-duplicates; our crawl found 307 word-identical UK pairs. What is
   the other 80-odd?

8. **Crawl efficiency.** 879 links to URLs blocked by robots.txt, 19 URLs
   with more than three query parameters, 726 pages flagged for IndexNow.

For each: what is broken, how many URLs, whether it costs traffic or just
tidiness, and the fix with an effort estimate. Be honest about the ones
that are cosmetic - a long list of trivia buries the things that matter.
```

---

## LENS 3 — CONTENT AND KEYWORDS

```
YOUR LENS: content and keyword opportunity. Prefix your finding ids CONT-.

THE QUESTION: which existing pages should we upgrade, in what order, and
what should we write next?

Jake's steer, and it governs this lens: UPGRADING EXISTING PAGES BEATS
WRITING NEW ONES. Weight accordingly.

Cover:

1. **The content gap.** ahrefs/content-gap-us.export.json holds 25,557
   keywords across TEN competitors (toptal, turing, andela, arc.dev,
   revelo, lemon.io, distillery, cleveroad, bairesdev, proxify) with each
   competitor's position and traffic per keyword. 108MB - stream it, do
   not load it. Find keywords where several competitors rank and we do
   not, filtered to commercial intent and real volume. This is the single
   richest file in the corpus.

2. **Pages worth upgrading.** Cross GSC impressions and position against
   word count and internal links from the crawl. A page at position 12
   with 40,000 impressions and 400 words is the best possible target.

3. **Thin content.** 165 pages under 300 words. Which have impressions?
   Those are worth expanding. Which have none and never will? Those might
   be worth removing - say so if you think it.

4. **Query-to-page mismatch.** From GSC query x page (26,110 rows): pages
   ranking for queries they do not properly answer. Usually a content gap
   on a page that already has authority - the cheapest possible win.

5. **What already works.** Our top pages by clicks and by AI citation.
   What do they have in common - format, length, structure? That pattern
   is the template for everything cited.io produces next.

6. **Blog architecture.** 74 blog posts across 6 topic hubs. Are they
   internally linked into clusters, or is each an island? 211 pages with
   one internal link suggests islands.

Note for context, do not analyse: content creation runs through cited.io
(github.com/galaxyfunk/insight-bank), an AEO content platform. Your job
is to tell it what to work on, not to write anything.

DELIVERABLE: a ranked list of pages to upgrade with the specific change
per page, and separately a list of new topics worth commissioning.
```

---

## LENS 4 — UK LOCALISATION

```
YOUR LENS: the UK locale. Prefix your finding ids UK-.

THE QUESTION: 307 of 326 /uk/ pages are word-for-word identical to their
US counterpart. What do we do, in what order, and what will it earn?

This is locked decision D1 in SEO_PROGRAMME.md: the UK becomes genuinely
British rather than a URL prefix. Your job is to make that executable.

Cover:

1. **Establish what the UK half actually earns today.** From GSC filtered
   to /uk/ pages and to country GB: impressions, clicks, positions. Roughly
   54% of sitemap URLs have never earned an impression and they are
   overwhelmingly the UK half - verify that, and quantify it precisely. If
   the UK pages earn nothing, the case for localisation is an investment
   case, not a recovery case. Say which it is.

2. **Which 10 pages first.** D1 says the top 10 commercial pages get real
   localisation first. Determine which 10, on evidence: UK impressions, GB
   query volume from Ahrefs GB data, commercial intent, and whether the US
   equivalent already converts.

3. **What "differentiated" means, concretely.** Currency, role and team
   naming, UK case studies, UK contact details, UK-specific proof. Define
   a standard specific enough that Seb could apply it to a page without
   asking what it means.

4. **Metadata separately.** D1 is explicit that titles, descriptions and
   OG text are their own pass, not a by-product. 306 duplicate titles and
   322 duplicate descriptions exist site-wide. How many are UK/US pairs?
   Metadata localisation alone is far cheaper than body content - is it
   worth doing across all 326 first, as a quick win, before the deep work
   on 10?

5. **The 19 that already differ.** Our crawl says 307 of 326 are identical,
   so 19 differ. How do they differ, and do they perform any better? A
   natural experiment sitting in the data - use it.

6. **The architecture question (DFH-2).** Does UK content live as separate
   Sanity documents per locale, or as locale-variant fields on one document?
   This decides whether Seb can edit UK copy independently. PROBE THE
   ACTUAL SANITY SCHEMA in studio/schemas/ and site/src/lib/sanity/ and
   report what is true. Do not guess. This is a blocking architecture
   decision for the whole programme.

7. **Risk.** hreflang is correctly implemented, which is why there is no
   duplicate-content penalty today. Flag anything in your recommendations
   that could break it.

DELIVERABLE: a phased plan. Phase A the 10 pages, Phase B the rest, with
a per-page standard and an honest estimate of what the whole thing costs
in hours and what it might return.
```

---

## LENS 5 — PERFORMANCE

```
YOUR LENS: performance and Core Web Vitals. Prefix your finding ids PERF-.

THE QUESTION: every page fails Lighthouse. What actually fixes it, in what
order, and how much does it matter?

Start from SEO_PROGRAMME.md §2.1 and §2.2, then TEST those hypotheses
against the field data that did not exist when they were written.

The evidence you have:

1. **Ahrefs site audit, whole site:** 588 pages measured, 281 Poor, 307
   Needs improvement, ZERO Good. Simulated mobile.

2. **Vercel Speed Insights, real visitors, 6-7 Aug.** Desktop: RES 71,
   LCP 4.26s, FCP 4.1s, TTFB 1.37s, CLS 0. Mobile: RES 85, LCP 2.02s,
   TTFB 0.84s - but only 98 data points and FCP 5.36s exceeds LCP 2.02s,
   which is impossible in one page load and means the mobile sample is
   incoherent. Do not treat mobile as measured.

3. **Per-route field data, desktop.** Great: /for-developers 99, /pricing
   100, /services/software-engineers 100, /about-us 100, /ask 100,
   /technology/[slug] 98. Poor: /our-work 46. Needs work: / 81, /blog
   detail 56, /book-a-call 65, /contact 56, /services/fractional-ctos 55.

4. **CrUX: 0 of 688 pages have data.** Google has no field performance
   data on us at all.

5. **The Ahrefs Performance aggregate, read from the dashboard 8 Aug.
   This is the most diagnostic evidence in the corpus - there is no
   per-URL export, these aggregates are what we have:**

   Lighthouse metrics distribution across 688 pages:
   - CLS: 100% Good
   - TBT: roughly 40% Poor, 50% Needs improvement, 10% Good
   - LCP: **100% Poor. Every single page.**

   Ahrefs server metrics across the same 688 pages:
   - Time to first byte: 526 under 200ms, 107 at 200-300ms, 45 at
     300-500ms, 10 over 500ms
   - Load time: 677 under 500ms, 8 at 500-1000ms, 3 over 2000ms
   - File size: all 688 under 100KB
   - Content encoding: all 688 Brotli

   **Read those two blocks together.** The server answers in under 200ms,
   ships under 100KB, and finishes loading in under half a second - and
   the largest paint is Poor on 100% of pages. The page arrives almost
   instantly and then refuses to draw. That is the signature of paint
   being gated behind a JavaScript callback, which is exactly what
   SEO_PROGRAMME §2.1 predicted with body{opacity:0}.

   It also rules out the usual suspects before you spend time on them:
   not hosting, not page weight, not images, not compression.

   Your job is to VERIFY this against the current production HTML, not to
   assume it. Then quantify what fixing it is worth.

6. **A new crawl on 8 Aug shows Poor Lighthouse fell 281 to 242**, a drop
   of 39 pages in two days. The only production change in that window was
   the canonical-host fix (merged 2fe4fcb), which removed the Marker.io
   widget - 148KB and 135ms of blocking - from every page. Test whether
   that explains it. If it does, it is a measured before-and-after on a
   real fix and worth stating precisely.

The questions that matter:

- **Reconcile the contradiction.** Ahrefs says no page is good; Vercel says
  several routes score 100 with real users. Lab is harsher than field, but
  not that much harsher. Which is right, and what does that imply?

- **Is it chrome or is it templates?** If the body-hide and HubSpot were
  the whole story, every route would score the same. They do not. Separate
  the sitewide cost from the per-template cost, with numbers.

- **Test the body-hide hypothesis.** §2.1 says GeoTargetly injects
  body{opacity:0} and the un-hide is a setTimeout starved by HubSpot's
  main-thread work. docs/seo/GEO_ROUTING.md adds that a firing redirect
  waits a further 5,000ms. Is this still the case in the current
  production HTML? Verify, do not assume.

- **How much does it actually matter right now?** With zero CrUX coverage,
  Google has no field data to rank us on. Make the honest case for
  priority - is this a ranking issue today, a conversion issue, or an
  investment against future traffic? Jake needs the truth, not the
  orthodoxy.

- **The blog detail template scores worst on both devices** and carries our
  highest-impression pages. Quantify what fixing it is worth.

Also: 33 images too large, and Best Practices stuck at 54-56 sitewide
(third-party cookies, deprecated APIs - Tech Debt #29-#32).

DELIVERABLE: an ordered fix list with expected gain per item, separating
"one sitewide change" from "per-template work", and an honest priority
call given the CrUX situation.
```

---

## LENS 6 — AUTHORITY AND AI VISIBILITY

```
YOUR LENS: authority, backlinks, internal linking, and AI search. Prefix
your finding ids AUTH-.

THE QUESTION: how much authority do we have, where is it wasted, and what
is our real position in AI answers?

Cover:

1. **The backlink profile.** 12,795 live backlinks, 987 referring domains,
   525 anchors, DR 36. How does that compare to the competitors we hold
   data on? ahrefs/link-intersect.export.json holds 30,000 domains across
   10 competitors - who links to several of them but not to us? That is
   the outreach target list.

2. **Reclaimable links.** 24 dead URLs hold live backlinks from sites at
   DR 91, 75, 73, 61, 59, 58. 23 of the 24 were already broken BEFORE the
   cutover, so this is inherited link rot, not migration damage. Each needs
   a redirect target decision - a 301 to an irrelevant page is treated as a
   soft 404 and wastes the link. Propose a target per URL, and say plainly
   where there is no good target. Note the DR 91 link has a trailing %20
   and needs a whitespace-tolerant rule. Full list in
   audit-output/seo-post-launch/ahrefs-broken-backlinks.json.

3. **Internal linking as authority distribution.** 211 pages have exactly
   one incoming internal link. Zero orphans, so everything is reachable -
   the problem is distribution, not access. Which of those 211 are pages we
   actually want to rank? Use ahrefs/site-audit/ links and anchor-texts
   (UTF-16, tab-delimited) plus the crawl's internal link data. Ahrefs also
   has an "Internal link opportunities" tool - note it for Jake if useful.

4. **Anchor text.** 38,605 anchors. Is our internal anchor text
   descriptive or is it "click here" and "read more"? Cheap, high-leverage
   fix if it is bad.

5. **AI visibility, and be careful here.** Two sources appear to
   contradict each other and both are probably right:
   - Ahrefs Brand Radar: across 10 generic buying questions, Toptal 7
     mentions, Turing 6, arc.dev 6, BairesDev 6, Cloud Employee ZERO.
   - Bing/Copilot: 7,500 citations over 3 months across 106 grounding
     queries, citation share 26-66%, overwhelmingly on TOPTAL COMPARISON
     queries plus brand navigation.
   The reconciliation appears to be: we dominate comparison queries and are
   invisible on generic ones. TEST that reading against bing/ and say
   whether it holds.

6. **The Copilot collapse.** Citations fell from 186/day on 26 July to 0 on
   2 Aug, and are recovering slowly (9, 13, 23 since cutover). This started
   a WEEK BEFORE the migration, which exonerates it. Look for any
   corroborating signal in GSC or elsewhere around 26-27 July. If there is
   none, say so - "cause unknown, watch weekly" is the correct answer.

7. **Which pages does Copilot cite**, and what do they have in common? That
   pattern is worth more than the citation count.

DELIVERABLE: the outreach target list, the reclaim list with a proposed
target per URL, the internal linking fix, and an honest assessment of the
AI position including what we cannot currently measure.
```

---

## SYNTHESIS

Run this only once all six have reported.

```
You are the synthesis session for a six-lens SEO analysis of
cloudemployee.io. Six analysts have finished. Your job is to turn their
findings into one ranked roadmap Jake can execute.

## Inputs

All six landed. Exact filenames, in
audit-output/seo-intel/2026-08-06/analysis/:
quick-wins, technical-health, content, uk-localisation, performance,
authority - each as .json (structured findings) and .md (readable).
60 findings in total.

## Deal with this FIRST, before ranking anything

Two lenses independently found that **GSC impression data is polluted by
machine-generated query families** (QW-01 and CONT-04): impressions grew
roughly 5x while clicks stayed flat. If that is right, impressions are not
a safe basis for ranking, and several findings across ALL SIX lenses are
ranked on impressions.

So: establish first whether the pollution is real and how big it is, then
work out which findings survive it. Say plainly which items you had to
downgrade because their impression numbers could not be trusted. Getting
this wrong invalidates the roadmap, so do it before anything else.

Plus the shared preamble context: CLAUDE.md, docs/seo/SEO_PROGRAMME.md,
and the MANIFEST files. Read the shared preamble's ALREADY FIXED section -
it applies to you too, and you are the last line of defence against a
stale finding reaching the roadmap.

**If a lens is missing or obviously incomplete, proceed without it and say
so at the top of FINDINGS.md.** Name which lens, and which questions are
therefore unanswered. Do not attempt to do its analysis yourself - a rushed
seventh-hand version of a missing lens is worse than an honest gap. Do not
wait or block.

## What to do

1. **Read all six.** Then read the master table joined/pages.json yourself
   so you can check their claims rather than trusting them.

2. **Verify before you promote.** Any finding you rank in the top 15 must
   have its evidence checked against the source file. Analysts working in
   parallel produce plausible-but-wrong findings; catching those is the
   main reason this session exists. Record what you checked and what
   failed verification.

3. **Deduplicate.** Several lenses will find the same thing from different
   angles - internal linking will appear in at least three. Merge them,
   keep the best evidence from each, and note which lenses agreed. A
   finding that three independent lenses reached is stronger than one that
   one lens reached.

4. **Resolve contradictions explicitly.** Where two lenses disagree, say
   so, say which you believe and why, and do not quietly pick one. Known
   candidate: Ahrefs says no page performs well, Vercel says several score
   100 with real users.

5. **Rank everything** by expected gain per unit of effort. Show the
   ranking logic. Where impact is a guess, label it a guess.

6. **Group into waves:**
   - **Wave 1 - this week.** Under a day each, no decisions needed, no
     design. Shippable immediately.
   - **Wave 2 - this month.** Days of work, or needs one decision.
   - **Wave 3 - the quarter.** Programme-sized: UK localisation, content
     production, performance rebuild.
   - **Decisions for Jake.** Things that cannot start until he chooses.
     Include DFH-2 (UK content storage in Sanity) if lens 4 surfaced it.
   - **Watch list.** Things to monitor rather than act on, with the date
     to look again. The Copilot collapse and the 28-day post-migration
     read both belong here.

7. **Be honest about what we still cannot answer.** Collect every DATA
   GAP from the six and say what closing each would change.

## Output

**1. `analysis/FINDINGS.md`** - the full synthesised report. Waves, ranked,
with evidence and effort. This is the deliverable Jake reads.

**2. `analysis/ROADMAP.json`** - machine-readable, every item with id,
wave, rank, effort, impact, dependencies, owner.

**3. A REWRITE of `docs/seo/SEO_PROGRAMME.md`.** Same document, rebuilt on
what we now know. Keep its structure and its plain-spoken tone. It must:
   - keep the locked decisions D1-D5, but note where evidence has changed
     the shape of one
   - CORRECT what has been disproven. Known corrections so far: llms.txt
     and the Marker.io widget are fixed and live; the Ahrefs subscription
     does cover the domain; insight-bank/cited.io is real and is at
     github.com/galaxyfunk/insight-bank; Bing and Copilot citation data
     turned out to be available; Google holds no CrUX data on us;
     Screaming Frog is no longer needed
   - replace estimates with measured numbers throughout
   - state plainly what changed since 4 Aug and why

Preserve the old version as docs/seo/SEO_PROGRAMME_v1_4aug.md before you
overwrite it. It is the record of what we believed at launch.

## House style

- No em-dashes or en-dashes anywhere. Hyphens only. This is a hard rule.
- Plain English. Jake is not a developer.
- Every number carries its source.
- Do not oversell. If the honest answer is "this is a 20-click-a-month
  win", say that.

## Report back

HANDBACK, under 20 lines:
- Task: synthesis
- Status:
- Files written:
- WAVE 1 COUNT: [how many things are shippable this week]
- FAILED VERIFICATION: [findings you demoted or killed, and why]
- CONTRADICTIONS RESOLVED: [what, and which way you called it]
- TOP 3: [the three highest-value items, one line each]
- DECISIONS FOR JAKE:
- SURPRISES:
- NOT DONE:

Append to audit-output/seo-intel/2026-08-06/HANDBACKS.md.
```

---

## Running order

1. Wait for `joined/pages.json` to exist. Everything reads it.
2. Run lenses 1-6 in parallel, each its own session, each on Fable.
3. When all six have written to `analysis/`, run synthesis.
4. Jake reviews `FINDINGS.md` before the rewritten programme doc is adopted.

## Notes for whoever runs this next time

- The shared preamble is the load-bearing part. Six sessions given the same
  facts and the same caveats produce findings that can actually be merged.
  Six sessions given only a lens produce six incompatible reports.
- The bail-out and "say when you do not know" instructions matter more than
  they look. The failure mode of parallel analysis is confident invention.
- Synthesis verifying the top findings rather than trusting them is what
  makes the output safe to act on.

# SEO Programme - cloudemployee.io

**What this is:** the scope document for turning a technically-clean migration into a
site that actually earns traffic. Rebuilt 8 Aug 2026 on the six-lens analysis of the
full data collection (GSC 16 months, our own 6,520-URL crawl, Ahrefs API + UI exports,
Bing/Copilot, HubSpot). The ranked execution list lives in
`audit-output/seo-intel/2026-08-06/analysis/FINDINGS.md` (readable) and
`ROADMAP.json` (machine). This document is the strategy and the record.

**The 4 Aug version is preserved at `docs/seo/SEO_PROGRAMME_v1_4aug.md`.** It is the
record of what we believed at launch. This rewrite states what changed and why.

**Status:** programme scope, not a build brief. Phases get their own briefs when they
start.

Rebuilt 8 Aug 2026. Every number below is measured and carries its source.

---

## 1. The honest picture (revised)

The migration did no damage. That held: the 28-day read is still due 31 Aug, but at
day 5 there is one dropped top-10 page and nothing else
(`ahrefs/site-audit-issues.json`), and Google is recrawling briskly (133 post-cutover
crawls in 5 days, `gsc/url-inspection.json`).

Four things are true at the same time, and they are the whole programme:

**1. Our impression data is polluted, and the site earns almost no non-brand Google
clicks.** Impressions rose 5.5x from Oct 2025 to Jun 2026 (32,195 to 177,865/month)
while clicks stayed flat at ~540 (`gsc/full-date.json`). A large share is
machine-generated query families - "<company> engineering challenges nearshoring",
"number of employees at <domain>" - which alone total 80,042 impressions and 0 clicks.
Strict non-brand CTR at positions 4-6 is 0.16%, roughly 30x below a human curve. The
last 10 days: non-brand 31,253 impressions, 10 clicks. Roughly one non-brand Google
click per day. Every plan built on raw impressions was rebuilt on clicks and cleaned
query-level data. The upside reading: AI agents repeatedly select our pages as
sources, which supports the AEO bet.

**2. The site is invisibly slow, and the clock is now running.** Confirmed live 8 Aug:
three GeoTargetly snippets still inject `body{opacity:0}` and gate first paint behind
a starvable JavaScript callback; controlled runs measured render delay 5,007ms
falling to 1,496ms with the gates removed. New finding: no HTML response is CDN-cached
at all (`cache-control: no-store`, `x-vercel-cache: MISS` sitewide; field TTFB 1.37s
vs 178ms crawler median). Google holds ZERO CrUX field data on us, so this is not a
ranking input today - but the first-ever CrUX window is accumulating from this month's
real traffic, and what ships in the next few weeks decides whether it says Poor. The
fix is unusually clean: the server already renders the visitor country from Vercel's
`x-vercel-ip-country` header, so geo routing moves server-side and the body-hide gets
deleted, not patched.

**3. Google is refusing to index the UK clone.** Not just duplication in theory:
Google's own verdicts (1,070 inspected URLs) show UK pages "Submitted and indexed"
**15**, versus **57** where Google discarded our canonical as a duplicate of the US
twin. 307 of 326 UK pairs are word-identical; 170 UK pages have earned zero
impressions in 16 months; excluding the /uk homepage, GB searchers gave the UK tree
6,733 impressions and **3 clicks**. There is no UK content in Sanity at all - zero
locale=uk documents; every UK route renders the US document. D1 stands, but narrowed
(see D1 below).

**4. The commercial content is too thin to win its own keywords, and the authority is
leaking.** The hire-page fleet (/services/*, /technology/*) sits at 600-900 words and
positions 10-30 on its exact target terms; the true content gap vs competitors is 642
commercial keywords / 159,250 monthly searches at median KD 5-10, and it mostly maps
to pages we already have. Meanwhile 154 referring domains' links soft-404 into the
/blog catch-all, 45.8% of all live backlinks route through the legacy
cloudemployee.co.uk domain, and the pages that rank best and carry 45% of our AI
citations have zero or one internal link.

---

## 2. What the analysis measured (superseding the 4 Aug findings)

### 2.1 Performance: mechanism confirmed, two layers added

The 4 Aug body-hide diagnosis and the correction (it is the hide technique, not
GeoTargetly or HubSpot individually) both held under live re-verification on 8 Aug.
Two additions:

- **The geo round trip is redundant.** `VisitorCountryScript` already renders
  `window.VISITOR_COUNTRY` server-side from `x-vercel-ip-country` on every request.
  Routing can move server-side; the GeoTargetly snippets (and possibly the
  subscription) become deletable.
- **No HTML caching anywhere.** Every route returns `no-store` and misses the CDN,
  because the root layout's `headers()` read opts the whole site out of static/ISR.
  Field TTFB 1.37s is the floor under LCP. The same header read that causes this is
  what makes the geo fix free; design them together.

Lab-vs-field contradiction resolved: Vercel desktop field scores of 99-100 and
Ahrefs' "0 of 588 pages Good" are both right - fast desktops resolve the un-hide,
throttled mobile starves it. The population we cannot yet measure (real mobile) is
the one the lab says suffers, and CrUX is mobile-weighted.

### 2.2 The pollution finding (new, reshapes everything)

Section 1 point 1. Consequence for this document: the 4 Aug "514,635 impressions per
90 days" framing is retired as a planning number. Planning numbers are now: clicks
(1,235/90d site-wide, 750 of them the homepage), clean striking-distance impressions
per page (junk families excluded), and Ahrefs keyword volume/KD/CPC for market
sizing.

### 2.3 UK duplication (was §2.5, now measured end-to-end)

Section 1 point 3. Also: UK/US pairs are ~99% of ALL sitewide duplicate-title and
duplicate-description groups (305/306 and 321/322), so the UK metadata pass doubles
as the site's metadata-duplication fix. hreflang is clean (3 real failures out of
326 pairs) and must be protected: never fork slugs, never canonical UK to US, prune
both sides together.

### 2.4 Authority (new lens)

- DR 36 vs a DR 70-90 category. But Andela proves authority without content buys
  nothing (DR 71, 49 US keywords); arc.dev converts the same authority into 4,895
  keywords. Content first, outreach as the compounding second track.
- 154 referring domains' links land on the /blog catch-all via dead-URL redirects -
  a soft 404 in Google's eyes. Top ~25 get honest topical 301s; the rest are
  accepted losses, recorded.
- 45.8% of live backlinks (5,864/12,795) arrive via cloudemployee.co.uk redirects.
  Auto-renew + monitoring is cheap insurance on half the link profile.
- 131 realistic outreach targets from the link intersect (DR 40-92, 5+ competitors,
  0 links to us), of which 13 are claim-a-profile listings needing no pitch.

### 2.5 AI visibility (new lens)

- Copilot cites us 8,640 times across 97 pages; 45% of citations are /compare pages;
  the winning format is long-form ranked comparisons with pricing (median ~3,200
  words). That is the cited.io production template, now evidence-backed.
- Concentration risk: one page (/compare/dedicated-teams-vs-toptal) is 27% of all
  citations. And the 9th most-cited page, /team/shawnee-malesich, is currently a
  live 404.
- Brand Radar day-one baseline on 10 multi-engine buyer prompts: Toptal 7 mentions,
  Turing 6, arc 6, us **0**. Different instrument from Copilot; both tracked. The
  Brand Radar API is free (0 units) and gets a weekly pull.
- The 27 Jul Copilot collapse is exonerated of migration involvement twice over: it
  began a week before cutover, and Google impressions rose 36% the same week.
  Cause unknown; weekly watch; escalate to Bing Webmaster ~31 Aug if not recovered.

---

## 3. Locked decisions (D1-D5, with evidence updates)

**D1 - UK becomes genuinely British, not a clone.** STANDS, with an evidence-driven
narrowing for Jake to ratify: metadata-localise all 326 pages (it clears 99% of
sitewide metadata duplication in one move); body-localise the evidence-ranked ten,
then only pages clearing a demand bar (>=100 GB impressions/16mo or a ranked GB
keyword - roughly 30-50 pages); leave the remaining ~270 as metadata-localised
clones, re-triaged quarterly. 170 pages have earned nothing in 16 months; localising
them all would burn Seb's time for no measurable return. Honest return estimate:
20-40 incremental GB clicks/month at +90 days, low confidence - this is a patient
strategic bet, not a traffic lever. Blocking prerequisite: DFH-2 (below).

**D2 - The design system arrives by export.** Unchanged. Still on Jake. Design
changes to chrome or above-the-fold land AFTER the performance package so the fix is
measured against a still target.

**D3 - Sequence: speed and bugs first, then content, then design system.** STANDS,
sharpened: speed is not a ranking input today (zero CrUX), but the first CrUX window
is forming now, which makes this month the cheap moment. Content is the growth
engine on the evidence (the gap is content depth, not authority or technicals).

**D4 - Complete the data coverage before declaring the audit finished.** DONE, with
named residual gaps: HubSpot CRM scopes (lead value per page - the most valuable
missing dataset), per-URL Lighthouse export, AI citation data outside Bing, GB
keyword sizing (Ahrefs reset 17 Aug). Everything else is connected and pulled.

**D5 - Content is the growth engine, and it gets a system.** STANDS, now with a
proven template: the AI-citation and Google-click data independently select the same
format (long-form ranked comparison/listicle with pricing tables). cited.io picks
and scores topics; Beem creates; this repo publishes. The steer "upgrade existing
pages over writing new ones" is emphatically confirmed: exactly two new pages are
justified by the data (a /technology/javascript-developers hire page and one
software-development-outsourcing pillar); everything else is upgrades.

---

## 4. The roadmap (rebuilt)

Full ranked detail with evidence in `analysis/FINDINGS.md` + `ROADMAP.json`. Shape:

### Wave 1 - this week (~32 hours, no decisions, no design)

Hygiene and leaks: fix the 404ed AI-cited team page; VideoObject uploadDate; sitemap
redirect entries + broken /ph chain + redirect-chain collapse + whitespace-tolerant
redirects; /alternatives page 1 links all 30 compare pages; internal links to the 7
orphaned new posts; scripted rewrite of 434 apex-host + 242 other redirecting
internal links; Sanity image params; icon-ligature anchor fix; Brand Radar weekly
pull; Jake confirms co.uk auto-renew and deletes the 9 dead GSC sitemap submissions.

### Wave 2 - this month

1. **The performance package** (the old SEO-1, now precisely scoped): server-side
   geo, delete the body-hide, defer HubSpot analytics preserving hubspotutk, restore
   HTML cacheability. 3-5 days. Needs DFH-1 confirmed.
2. Metadata batch on impression-bearing pages (26 Google-rewritten titles + 55
   defects).
3. Dead-blog 301 map, top ~25 referring-domain URLs, Jake deciding targets.
4. Tier-1 profile claims (13 listing sites).
5. Small fixes: book-a-call noindex (decision), technology-template Service JSON-LD,
   locale-mirrored redirect generator.
6. First content upgrades: the staff-augmentation pillar (48,992 imp / 11 clicks /
   1,783 words) and the cost/definitional trio (includes the site's top real
   non-brand click earner at 684 words).

### Wave 3 - the quarter

1. **Hire-fleet upgrade programme**: 15 priority /services/ + /technology/ pages to
   1,500-2,000 words against the 642-keyword / 159,250-search gap. The core
   commercial bet.
2. The two new pages (javascript hire page; outsourcing pillar).
3. **UK programme** per D1-as-narrowed: schema wiring (DFH-2), metadata all 326,
   body for the ten, triage the rest.
4. Per-template performance pass (blog detail first - 45.5% of impressions), only
   after Wave 2's sitewide work, re-measuring between steps.
5. Tier-2 editorial outreach with LATAM/PH salary-cost data as the hook.
6. Best Practices / consent batch (Tech Debt #29-32), last.

### Decisions for Jake (the gate list)

DFH-1 confirm body-hide deletion; DFH-2 UK storage (recommendation: locale-override
fields on shared documents - probed, zero UK docs exist); ratify the D1 narrowing;
Philippines/no-code/full-stack cannibalisation consolidation (after 31 Aug);
book-a-call noindex; the Seb batch (shawnee, Caitlin Murray, cloudemployee.com.au,
real UK business presence); consent strategy.

### Watch list

31 Aug: the 28-day migration read, the Copilot recovery check, the
crawled-not-indexed count, the 11 Ahrefs traffic-drop pages. 17 Aug: Ahrefs unit
reset (buy only keywords-explorer + SERP overview; pull GB content-gap; re-pull the
live backlink graph for is_lost). ~14 Aug: Brand Radar manual pickup. Early Sep:
first CrUX window.

---

## 5. Data coverage - the answer to "have we got everything?"

### 5.1 Connected and pulled (6-8 Aug collection, ~380MB)

| Source | State |
|---|---|
| Google Search Console API | 16 months, 49 files, no row caps; URL Inspection API works on this property (1,070 URLs inspected) |
| Own crawl | 6,520 URLs replayed: status, redirects, hreflang, JSON-LD, internal links, UK-clone verdicts |
| Ahrefs | API pull + 15 UI exports incl. content gap (25,557 kws) and link intersect (30,000 domains). Unit quota resets 17 Aug; UI exports beat the API for anything large |
| Bing Webmaster + Copilot | AI citation data per page and per query |
| Vercel Speed Insights | Live and collecting since 6 Aug; mobile sample not yet coherent |
| HubSpot | Forms only - lead quality data BLOCKED on CRM scopes |
| Brand Radar | Collecting weekly; API free; first data ~14 Aug |
| joined/pages.json | The master table: 7,027 rows x 26 cols, every source joined |

### 5.2 Corrections to the 4 Aug version, stated plainly

- **llms.txt 404** - fixed, 200 in production since 7 Aug.
- **Marker.io widget live for customers** - fixed and verified absent; one shared
  request-host guard at `site/src/lib/canonical-host.ts` (PR #86).
- **Ahrefs "does not cover the domain"** - it does; Tech Debt #4 resolved.
- **Vercel Speed Insights not enabled** - enabled and collecting.
- **Screaming Frog still needed** - no longer; the Ahrefs site audit + our own
  6,520-URL crawl cover it. The PSI key task remains useful only if we later want
  hosted Lighthouse at scale.
- **insight-bank/cited.io "not on this filesystem"** - it is real, at
  github.com/galaxyfunk/insight-bank.
- **Bing/Copilot citation data unavailable** - it is available and pulled.
- **Google CrUX** - holds no data on us at all (0 of 688 pages), so CWV is not a
  current ranking input; it becomes one as the first window forms.
- **"toptal alternatives at position 4 on ~2,000 searches"** - false. The query has
  7 impressions in 16 months. SEO-6's "obvious first target" did not exist; the
  content plan is now built on the verified gap and striking-distance data instead.

### 5.3 Deliberately not adding

Unchanged: GA4 (until conversion attribution is the question), SEMrush/Moz/Sistrix
(no new signal over Ahrefs + DataForSEO), rank-tracking software (GSC gives true
positions). Add: no thin-content programme (118 of 165 thin pages earn nothing and
are mostly UK clones or functional stubs - measured, closed).

---

## 6. Design system intake (D2)

Unchanged from v1: Jake exports, we diff against existing components, tag re-skin /
shape-edit / new, and only then scope build work. Chrome or above-the-fold changes
land after the Wave-2 performance package.

---

## 7. Content and AI search (D5)

**Rankings before backlinks** - confirmed by the Andela contrast (§2.4).
**Upgrade before create** - confirmed; two new pages only.
**AI visibility is downstream of ranking** - refined, not repealed: Copilot already
cites the pages that rank and are long-form; the AEO play is (a) produce in the
proven cited format, (b) protect the cited pages (internal links, no 404s), (c)
measure weekly via Brand Radar + Copilot stats. The pollution finding adds a twist:
AI agents are already heavy consumers of our pages; impressions from them do not
click, but citations reach buyers off-Google.

Division of labour unchanged: cited.io picks and scores topics (its DataForSEO
integration is live; pattern shared with ce-sales-brain), Beem creates, this repo
publishes.

---

## 8. Decisions for human

**DFH-1 - body-hide replacement.** Recommendation unchanged and now cheaper: delete
the hide AND the client-side geo round trip; route server-side on
`x-vercel-ip-country`, which the server already reads on every request. Needs the
three rule definitions exported from the GeoTargetly dashboard (they live there, we
hold only IDs). The subscription itself may then be retirable.

**DFH-2 - UK content storage in Sanity.** Now answered by probing:
zero `locale == "uk"` documents exist; every UK route renders the US document.
Recommendation: **locale-override fields on the shared document** (ukMetaTitle,
ukMetaDescription, optional per-section body overrides). Separate documents would
fork 326 docs plus every reference (the Tech Debt #61 class of risky operation) and
break the derived slug-pairing that hreflang depends on. Jake decides; 2-3 days to
wire once decided.

Plus the gate list in §4: D1 narrowing, cannibalisation consolidation, book-a-call
noindex, the Seb batch, consent strategy.

---

## 9. What Jake does next

1. **Confirm DFH-1** (delete body-hide) - unblocks the performance package
2. **Decide DFH-2** (UK storage) - unblocks the whole UK programme
3. **30 minutes of dashboards**: cloudemployee.co.uk auto-renew + monitor; delete
   the 9 dead sitemap submissions in Search Console; resubmit
   `https://www.cloudemployee.io/sitemap.xml`
4. **Export the GeoTargetly rules** from its dashboard (needed for DFH-1 execution)
5. **~14 Aug**: pick up the first Brand Radar weekly data
6. **Answer the Seb batch** (§8)
7. **Claim the Tier-1 profiles** (13 sites, no pitch needed) as time allows
8. **Grant HubSpot CRM scopes** (contacts, deals, meetings) on the private app -
   closes the most valuable data gap: lead value per page
9. **Export the design system** from Claude Design when ready (D2)

---

## 10. Non-goals

Unchanged from v1: no template rebuilds (re-skin only), nothing migrates off Sanity,
no GA4 yet, no /live-job-role revival, no second Search Console property. Added: no
thin-content programme (§5.3); no bulk 301 of all 69 dead blog URLs (top ~25 by
referring domains only, the rest are accepted, recorded losses); no localisation of
the ~270 zero-demand UK pages beyond metadata.

---

## 11. Deferred

| Item | Why deferred | Revisit at |
|---|---|---|
| Best Practices 54-56 | Needs consent/CSP strategy (D-CONSENT) | After Wave 2 |
| Accessibility 86 on services template | Real but narrow; ARIA + contrast | With template perf pass |
| IndexNow wiring (5,051 pages flagged) | Optional; supports the Bing/Copilot channel | After Bing import verified |
| Philippines cannibalisation consolidation | Two variables at once during migration re-read | After 31 Aug |
| GA4 | Conversion attribution not yet the question | When it is |
| Per-URL Lighthouse export | One Ahrefs UI export | Next Ahrefs session |

---

## 12. What changed since 4 Aug, in one place

The 4 Aug document was written from launch-day spot checks; this one from the full
collection plus six parallel analyses. The diagnosis survived: speed, UK clone,
content depth. What changed: (1) the impression base was found polluted, so the plan
now ranks on clicks and cleaned query data; (2) the performance fix got both bigger
(no HTML caching at all) and simpler (the geo round trip is redundant - delete, not
patch); (3) the UK problem escalated from "Google ignores the clones" to "Google is
actively refusing them" (15 indexed vs 57 duplicate verdicts), while its scope
narrowed from all-326 body work to metadata-everywhere + body-for-the-demand-bearing;
(4) authority leaks were quantified for the first time (154 domains into /blog,
45.8% via the legacy .co.uk, best pages least linked); (5) AI visibility went from
aspiration to instrumented (8,640 Copilot citations, a proven content format, a
zero baseline on buyer prompts, a free weekly metric); (6) SEO-6's flagship keyword
("toptal alternatives", pos 4, 2,000 searches) was falsified - 7 impressions in 16
months; and (7) the fixed-since-4-Aug list (§5.2) is closed and verified in
production.

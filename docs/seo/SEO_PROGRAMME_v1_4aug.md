# SEO Programme — cloudemployee.io

**What this is:** the scope document for turning a technically-clean migration into a
site that actually earns traffic. It audits the post-launch plan, closes the gaps in
that plan, inventories every data source, and sequences the work.

**Status:** programme scope, not a build brief. The work here is larger than one
supervised brief, so it is decomposed into named phases (SEO-1 … SEO-7). Each phase
gets its own build brief written against `.cursor/rules/10-brief-standards.mdc` when
it starts. Flagged Mode B per the brief-authoring scope cap.

**Companion doc:** `docs/seo/POST_LAUNCH_AUDIT.md` holds the raw launch-day audit.
This document supersedes its "Priority order" section.

Authored 4 Aug 2026. Every number below was measured today, not estimated.

---

## 1. The honest picture

The migration did no damage. Search Console SEO scores 100 out of 100 on every page
Lighthouse tested, canonicals and hreflang are correct, cumulative layout shift is a
perfect zero sitewide, and zero clicks were lost to the platform change. That part is
genuinely done.

Three things are true at the same time, and they are the whole programme:

**The site is invisibly slow.** Not slow to download. Slow to *appear*. Every page
arrives in about 1.2 seconds and then sits blank for several more, because the page is
hidden by CSS until a JavaScript callback un-hides it, and that callback is stuck behind
heavy third-party scripts. Self-inflicted, measured, and fixable without removing any
third-party tool. It is the single biggest thing on this list.

**Half the site is a literal clone of the other half.** 326 of 653 sitemap URLs are
`/uk/` pages whose visible text is word-for-word identical to the US version. Not
similar. Identical, to the word.

**Non-brand organic traffic is about 9 clicks a day** against 514,635 impressions per
90 days. The technical foundation is sound, so the constraint from here is content
depth, differentiation, and authority.

---

## 2. What I measured today (new findings, not in the launch audit)

### 2.1 The killer: pages are deliberately hidden for 7 seconds

This is the most important finding in the document.

Lighthouse on `/services/software-engineers`, mobile:

| LCP phase | Share | Time |
|---|---|---|
| Time to first byte | 14% | 1,222 ms |
| Load delay | 0% | 0 ms |
| Load time | 0% | 0 ms |
| **Render delay** | **86%** | **7,340 ms** |

Render-blocking resources: **none**. The largest element is a plain `<h1>`. There is
no image to blame, no stylesheet, no font. The page is fully downloaded and simply
refuses to draw.

The cause is in the production HTML. The GeoTargetly snippets each inject this:

```
body{opacity:0.0 !important;}
```

Three separate rules, three separate blocking network calls to
`g10498469755.co/gr?id=…`, each hiding the entire page until it answers. The comment in
`site/src/components/third-party-scripts.tsx` states the intent plainly: hide the body
"so the visitor never sees the wrong page flash up before being redirected."

The intent is right. The cost is not. Avoiding a brief flash for the small percentage of
visitors who get redirected is being paid for with several seconds of blank screen for
**every visitor on every page**, including Googlebot. Largest Contentful Paint is a
confirmed Google ranking signal and the threshold is 2.5 seconds. We fail it on every
page tested.

#### CORRECTION (measured 4 Aug, after this section was first written)

The first draft of this section blamed GeoTargetly alone. **That was wrong**, and the
correction matters because it would have driven the wrong fix. Controlled Lighthouse
runs on `/services/software-engineers`, blocking each script in turn:

| Test | Perf | LCP | TBT | Render delay |
|---|---|---|---|---|
| Baseline | 51 | 5.7 s | 840 ms | 5,007 ms |
| GeoTargetly blocked | 49 | 5.9 s | 750 ms | 4,996 ms |
| HubSpot blocked | 67 | 5.7 s | 330 ms | 4,861 ms |
| **Both blocked** | 66 | **4.2 s** | 300 ms | **1,496 ms** |

Removing either one alone does essentially nothing to first paint. Removing both drops
render delay by 3.5 seconds. They are two independent gates on the same paint, and the
mechanism is now clear:

1. GeoTargetly inserts `body{opacity:0}` **synchronously and inline**. This happens even
   when its network request is blocked, because only the request is blocked, not the
   inline style insert.
2. The un-hide is a `setTimeout(…, 0)` callback. It is JavaScript, so it can only run
   when the main thread is free.
3. HubSpot occupies the main thread. So the un-hide sits in the queue behind it.

Separately confirmed: the GeoTargetly endpoint is **not slow**. All three rules answer in
165-227 ms, and each returns `georedirect<TIMESTAMP>loaded()` called with **no argument**,
which means `redirect` is undefined, `to = 0`, and the page is told to un-hide
immediately. GeoTargetly is doing its job correctly and quickly.

**So the fault is not GeoTargetly and not HubSpot. It is the body-hide technique**, which
converts "slow to become interactive" into "completely invisible". Any heavy script
anywhere on the page now delays first paint, because painting is gated behind a
JavaScript callback.

**Recommended fix, in this order:**

1. **Defer HubSpot analytics** to idle or first interaction. Biggest single win: perf 51
   to 67, blocking time 840 ms to 330 ms.
2. **Stop gating paint on JavaScript.** Either delete the body-hide entirely and accept a
   brief flash for redirected visitors, or make the un-hide a pure CSS timeout that
   cannot be starved by a busy main thread.
3. **Then re-measure.** Even with both blocked, LCP is still 4.2 s against a 2.5 s
   threshold, and TTFB is 1.2-1.4 s. There is more underneath, currently masked.

Note that **none of this requires removing GeoTargetly**. Its routing rules can stay
exactly as they are; it is the body-hiding that has to change. Moving the routing into
Vercel middleware remains an option worth taking on its own merits (server-side redirect
means zero flash *and* zero JavaScript dependency), but it is no longer the performance
fix, and it should not be sequenced as though it were.

**Measurement caveat:** these are single Lighthouse runs from a local machine and
run-to-run variance is significant. An earlier run of the same page recorded 7,340 ms
render delay against the 5,007 ms baseline above. The *relative* comparison between the
four blocked configurations was taken in one batch under identical conditions and is the
trustworthy part. Absolute numbers need field data to confirm (§5.2).

### 2.2 One HubSpot script eats 3.6 seconds of main thread

From the homepage third-party breakdown:

| Entity | Main-thread blocking | Transfer |
|---|---|---|
| **HubSpot** | **3,610 ms** | 106 KB |
| Google Tag Manager | 275 ms | 616 KB |
| Facebook | 139 ms | 171 KB |
| Marker.io | 135 ms | 148 KB |
| Everything else combined | 0 ms | — |

The specific offender is `js.hs-analytics.net/analytics/…/22809822.js` at 4,844 ms of
JavaScript execution. HubSpot alone accounts for 87% of all third-party blocking.

The script is loaded `afterInteractive` via `next/script`, which is already the right
strategy, so the fix is not a one-line change: it needs the analytics load deferred
until user interaction or idle. HubSpot's tracking cookie (`hubspotutk`) is read by the
lead form, so the deferral has to preserve attribution. That constraint is real and
goes in the brief.

### 2.3 Confirmed bug: the internal bug-reporting widget is live for real customers

`Marker.io` is a staging review tool. It is currently loading for every visitor on
cloudemployee.io. I confirmed it in the production HTML:

```
markerConfig = { project: '6a607cb9bba82be8b774fc61', source: 'snippet' }
```

The guard exists and is well-intentioned. `isCanonicalProductionSite()` in
`site/src/components/third-party-scripts.tsx:51-60` compares
`NEXT_PUBLIC_CANONICAL_HOST` against the host parsed from `NEXT_PUBLIC_SITE_URL`. It has
failed, and the reason is a subtle asymmetry with the equivalent check in
`site/src/app/robots.ts:39-47`:

- `robots.ts` normalises with `.trim().toLowerCase()` and compares against the **live
  request host**. It works — robots.txt correctly serves `Allow: /`.
- `third-party-scripts.tsx` does **neither**. No trim, no lowercase, and it compares two
  build-time environment variables to each other rather than to the actual request.

So a trailing space or a capital letter in the Vercel environment value is enough to
silently flip the widget on in production while robots.txt looks perfectly fine. The fix
is to make the Marker guard use the same request-host check that robots.ts already uses,
rather than duplicating the logic differently in two places.

Cost of the bug: 148 KB, 135 ms of blocking, and a bug-report button shown to paying
customers.

### 2.4 Full Lighthouse baseline

| Page | Device | Perf | A11y | SEO | Best Prac. | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|---|
| Home | desktop | 65 | 89 | 100 | 56 | 4.3 s | 0 ms | 0 |
| Home | mobile | 31 | — | — | — | 15.9 s | 3,580 ms | 0 |
| Blog (staff-augmentation) | mobile | 55 | 100 | 100 | 56 | 5.5 s | 530 ms | 0 |
| /alternatives | mobile | 39 | 100 | 100 | 54 | 6.9 s | 900 ms | 0 |
| /services/software-engineers | mobile | 41 | 86 | 100 | 56 | 8.6 s | 880 ms | 0 |

Reading it:

- **SEO 100 across the board.** The technical SEO work genuinely landed. This is the
  proof.
- **CLS 0 across the board.** Layout stability is perfect. Nothing to do.
- **LCP fails on every page.** Google's "good" threshold is 2.5 s. Our best is 4.3 s and
  our worst is 15.9 s. This is §2.1.
- **Best Practices stuck at 54-56 everywhere.** Causes: deprecated APIs, third-party
  cookies, console errors. Consistent across pages, so it is a chrome/third-party
  problem, not a template problem. Matches existing Tech Debt #30.
- **Accessibility 86 on the services page** while blog pages score 100. Specific
  failures: ARIA progressbar with no accessible name, prohibited ARIA attributes,
  insufficient colour contrast, non-sequential headings, unlabelled select elements. The
  contrast one may be the known Clara chatbot violation (Tech Debt #31).

**Caveat, stated honestly:** these are lab numbers from my machine. Network latency here
inflates LCP relative to a real user near a Vercel edge. The *render delay* and *blocking
time* numbers are CPU-bound and therefore trustworthy; the absolute LCP may improve for
real visitors. This is precisely why we need field data — see §5.

### 2.5 UK duplication, quantified

Word-level diff of `/services/software-engineers` against `/uk/services/software-engineers`:
**zero differences**. Not one word. Same for the title tag.

326 of 653 sitemap URLs are `/uk/`, exactly 49.9% of the site. hreflang is correctly
implemented (self-canonical, reciprocal `en-US`/`en-GB` alternates, `x-default`), which
is why there is no duplicate-content penalty. But correct hreflang tells Google these are
*locale variants of the same thing*, and when the content is byte-identical Google
generally picks one and ignores the other. Which is what the click data shows.

### 2.6 Smaller items

- `llms.txt` returns **404**. Directly relevant to the ChatGPT visibility goal (§7).
- Time to first byte on the homepage is **1.4 s**. Not the main problem, but not good.
  Worth a look once §2.1 is fixed and it stops being masked.
- 653 sitemap URLs; roughly 54% have earned zero impressions, overwhelmingly the `/uk/`
  half.

---

## 3. Locked decisions

Taken by Jake, 4 Aug 2026. These are the spine of every brief that follows.

**D1 — UK becomes genuinely British, not a clone.**
The top 10 commercial pages get real localisation: currency (£ vs $), role and team
naming ("UK account manager" vs "US account manager"), UK case studies, UK contact
details. Beyond those 10, every remaining UK page gets worked through and differentiated
over time. **Metadata is localised separately from body content** — titles, descriptions
and OG text are their own pass, not a by-product. Each page is treated individually. UK
is a real locale with its own content, not a URL prefix.

**D2 — The design system arrives by export.**
It currently lives inside Claude Design. Jake exports it into the repo. This is a task
on Jake, and no design work starts before it lands. See §6.

**D3 — Sequence: speed and bugs first, then content, then design system.**
Performance is a ranking factor and a conversion factor simultaneously, and it is the
cheapest item on the list. It goes first.

**D4 — Complete the data coverage before declaring the audit finished.**
Jake's explicit requirement: no data source left unconnected, no blind spots, so the
roadmap is provably built on everything available rather than on a sample. §5 is the
answer to this.

**D5 — Content is the growth engine, and it gets a system.**
Consistent content production, with Beem used for creation. Rankings first, then
backlinks, then broader AI-search visibility.

---

## 4. The roadmap

Ordered by impact per unit of effort. Highest first, exactly as asked.

### SEO-1 — Performance emergency (do first)

The whole of §2.1, §2.2 and §2.3. Measured expectation, not a guess: the controlled test
in §2.1 shows perf 51 to 66 and LCP 5.7 s to 4.2 s from items 1 and 2 together. That is
short of a "good" LCP, so item 4 matters.

1. **Defer HubSpot analytics** to idle or first interaction, preserving `hubspotutk`
   attribution for the lead form. Largest single win.
2. **Remove the paint dependency on JavaScript** — delete the `body{opacity:0}` hide, or
   replace the JS un-hide with a CSS-driven one that a busy main thread cannot starve.
   GeoTargetly's routing rules are untouched by this.
3. **Fix the Marker.io guard** to use the request host, matching `robots.ts`.
4. **Re-measure, then attack what is underneath.** LCP is still 4.2 s and TTFB 1.2-1.4 s
   with both scripts blocked. Those are currently masked and cannot be scoped until
   items 1 and 2 land.

**Not blocked on anything.** Items 1-3 are self-contained code changes needing no
credentials and no decisions. This can start immediately.

### SEO-2 — Complete the data layer

Everything in §5. This is what makes the audit provably complete rather than
sample-based. Runs in parallel with SEO-1 because it is mostly account setup.

### SEO-3 — Full-site crawl and the master issue list

The Screaming Frog crawl with every API joined on, plus a Lighthouse sweep across all
653 URLs (I can automate this locally now — see §5.1). Produces the definitive
page-by-page issue list: internal linking depth, orphan pages, thin content, structured
data errors, per-page Core Web Vitals.

**Blocked on:** SEO-2 finishing, and Jake running the crawl.

### SEO-4 — UK localisation programme (D1)

Phase A: the 10 commercial pages, body content and metadata.
Phase B: a tracked, page-by-page work-through of the remaining ~316, with a
differentiation standard defined once and applied consistently.

This needs a Sanity schema question answered first: whether UK content is stored as
genuinely separate documents per locale or as locale-variant fields on one document.
That determines whether Seb can edit UK copy independently in Studio, and it is a real
architecture decision, so it gets surfaced in the SEO-4 brief rather than assumed here.

### SEO-5 — Reclaim the dead backlinks

24 dead URLs holding live backlinks from sites at DR 91, 75, 73, 61, 59 and 58. 23 of the
24 were already broken before the cutover, so this is inherited link rot and a clean win.
Each needs a human decision on redirect target, because a 301 to an irrelevant page is
treated as a soft 404 and wastes the link.

### SEO-6 — Content system (D5)

The engine for consistent production. Insight-bank/cited.io is the right home for topic
selection and viability scoring — it already integrates DataForSEO and Ahrefs for exactly
that. Beem for creation. This repo stays the publishing target.

Highest-value starting point from the existing keyword data: `toptal alternatives`,
position 4 on 2,000 monthly searches, pointing at `/alternatives`, a page we control and
have just rebuilt.

### SEO-7 — AI search visibility

`llms.txt`, entity and answer-shaped markup, Bing Webmaster Tools (§5.2), and measuring
actual citation rates in ChatGPT and Perplexity. Deliberately last: AI assistants
overwhelmingly cite pages that already rank, so SEO-1 through SEO-6 are the prerequisite,
not a detour from it.

---

## 5. Data coverage — the answer to "have we got everything?"

### 5.1 What we have working right now

| Source | State | What it gives us |
|---|---|---|
| Google Search Console API | **Working** | Impressions, clicks, positions, queries, per-URL. `scripts/seo/gsc-pull.ts` |
| Ahrefs API v3 | **Working** | Backlinks, broken backlinks, top pages, keyword positions. `scripts/seo/ahrefs-pull.ts` |
| Live URL replay | **Working** | Status, redirects, canonical, indexability for every known URL. `scripts/seo/verify-gsc-urls.ts` |
| **Lighthouse, run locally** | **Working, proven today** | Performance, accessibility, SEO, best practices, full Core Web Vitals lab data, third-party attribution, LCP phase breakdown |

On the Lighthouse question specifically: **yes, I can see all of it, on every page, with
no quota limit.** Google's hosted PageSpeed API refused me today ("quota exceeded" on the
shared anonymous pool), so I ran Lighthouse locally instead and it worked perfectly. That
is how every number in §2.4 was produced. I can sweep all 653 URLs this way; it is just
time, not access.

What local Lighthouse cannot give us is **field data** — what real visitors on real
devices and real networks actually experience. That is the gap below.

### 5.2 What is missing and worth adding

Ranked by value.

**1. Vercel Speed Insights — the biggest gap.** First-party Core Web Vitals from your
actual visitors, on your actual site, already on your existing Vercel plan. This is the
data Google uses to judge you, and it is the only way to confirm whether my lab LCP
numbers hold for real users. Enable it in the Vercel dashboard. Highest value per minute
of effort on this entire list.

**2. Bing Webmaster Tools — free, and directly serves the ChatGPT goal.** ChatGPT's web
search is powered by Bing's index. If you want to be recommended in ChatGPT, being
properly indexed and understood by Bing is not optional, and right now we have no
visibility into it at all. It also imports straight from Search Console, so setup is a
few minutes.

**3. DataForSEO — you have the account, it just needs wiring here.** Gives us SERP
features, AI Overview presence, and competitor gap analysis. **Do not paste the
credentials into chat.** Add them to `.env` yourself as `DATAFORSEO_LOGIN` and
`DATAFORSEO_PASSWORD`, then tell me. Note that insight-bank already has a working
DataForSEO integration I can copy the pattern from, and your credentials are already
in that project's environment.

**4. PageSpeed Insights API key — free, ten minutes.** You already have the Google Cloud
project `cloud-employee-seo` from the Search Console service account. Enabling the
PageSpeed Insights API there gives a key, which unlocks both hosted PSI at scale and the
Chrome UX Report (real-world CWV aggregated by Google). Belt and braces alongside Vercel
Speed Insights.

**5. Screaming Frog crawl with the APIs joined on.** Still outstanding, still the single
richest artefact. Config unchanged from `POST_LAUNCH_AUDIT.md` §"Screaming Frog", with one
addition now that we know PSI's anonymous quota is exhausted: connect Screaming Frog's
PageSpeed API using the key from item 4, or it will silently return nothing.

### 5.3 Deliberately not adding

Being straight with you, because more tools is not the same as more insight:

- **Google Analytics 4** — worth connecting eventually for conversion attribution, but it
  answers "what did visitors do" and every current question is "why aren't there more
  visitors". Not now.
- **SEMrush / Moz / Sistrix** — overlap almost entirely with Ahrefs plus DataForSEO. Pure
  cost, no new signal.
- **Rank tracking software** — Search Console already gives true positions for free.

### 5.4 The honest caveat on "every bit of data"

More data will not change the top of this roadmap. I already know the site is hidden for
7 seconds, that half of it is a clone, and that one script eats 3.6 seconds. Those are
measured, not inferred, and they are the top three items regardless of what the crawl
says. The remaining data matters for **completeness of the long tail** — the page-by-page
issue list in SEO-3 — and for **proving** the fixes worked. It is worth collecting. It is
not worth waiting for before starting SEO-1.

---

## 6. Design system intake (D2)

Nothing here can start until the export lands. The sequence once it does:

1. **Jake exports from Claude Design** into `docs/design/` (task on Jake)
2. I diff it against the existing components in `site/src/components/ui/` and
   `docs/design/COMPONENTS.md`, and tag every component **re-skin / shape-edit / new**
3. Only then do we scope build work

Point 2 is the important one and it is a standing rule in this repo: a rebuild where a
re-skin was correct is wasted money and lost behaviour. The site already has 27 working
templates with tested behaviour. The design system should change how they look, not throw
them away.

One dependency worth stating now: if the design system changes chrome or above-the-fold
layout, it lands **after** SEO-1, so we do not measure a performance fix against a moving
target.

---

## 7. Content and AI search (D5)

Sequencing, and the reasoning behind it:

**Rankings before backlinks.** Backlink acquisition to a page ranking at position 30 is
expensive and slow. The same effort on a page at position 4-8 moves it onto page one.
`toptal alternatives` at position 4 is the obvious first target.

**Fix presentation only where presentation is the problem.** Two different patterns are
visible in the data and they need opposite treatment. Pages at position 25-40 do not have
a click-through problem, they have a ranking problem, and no title rewrite fixes that.
Pages at position 7 with 40,000 impressions and a handful of clicks genuinely do have a
presentation problem worth testing.

**AI visibility is downstream of ranking, not parallel to it.** ChatGPT, Perplexity and
Google's AI Overviews overwhelmingly cite pages that already rank well. Doing SEO-1
through SEO-6 properly *is* the AI-search strategy. `llms.txt` and entity markup are
worth shipping, but they amplify existing authority rather than substitute for it.

**Division of labour:** insight-bank/cited.io picks and scores the topics (it already
has DataForSEO and Ahrefs wired for precisely this). Beem creates. This repo publishes.
Three tools, three jobs, no overlap.

---

## 8. Decisions for human

**DFH-1 — What replaces the body-hide.** Superseded in scope by the §2.1 correction: this
is no longer a question about GeoTargetly, because GeoTargetly is not the cause. The real
question is narrower and cheaper. When we stop hiding the page behind a JavaScript
callback, redirected visitors will briefly see the US page before being sent on. Options:

- **Delete the hide entirely** (recommended). Simplest, fastest, and the flash only
  affects the minority of visitors who are being redirected anyway.
- **CSS-only timeout.** Keep a short hide (say 300 ms) that expires on its own via CSS
  animation and cannot be starved by a busy main thread. Preserves most of the
  no-flash behaviour at a small fixed cost to everyone.

**Separate and optional: move the routing itself into Vercel middleware.** Worth doing on
its own merits (server-side redirect means no flash *and* no JavaScript dependency), and
we already read `x-vercel-ip-country` for the Hotjar gate so the mechanism is proven. But
it needs the three rules exported from the GeoTargetly dashboard first, since their logic
lives there and not in our code. It is **not** required for the performance fix.

**DFH-2 — UK content storage in Sanity.** Whether UK pages become genuinely separate
documents (Seb edits them independently) or locale-variant fields on shared documents.
This is an architecture decision that shapes the entire SEO-4 programme. It gets probed
and surfaced properly in the SEO-4 brief rather than guessed at here.

---

## 9. What Jake does next

In this order. The first four are roughly an hour total and they unblock everything.

1. **Enable Vercel Speed Insights** in the dashboard (biggest win per minute)
2. **Set up Bing Webmaster Tools** and import from Search Console (the ChatGPT prerequisite)
3. **Add DataForSEO credentials to `.env`** as `DATAFORSEO_LOGIN` / `DATAFORSEO_PASSWORD`,
   then tell me
4. **Enable the PageSpeed Insights API** in the existing `cloud-employee-seo` Google Cloud
   project and grab the key
5. **Answer DFH-1** — delete the body-hide, or replace it with a CSS timeout. Not
   blocking; SEO-1 can start on the HubSpot and Marker.io items regardless.
6. **Run the Screaming Frog crawl** with all APIs connected, into `screaming-frog/pass5-production/`
7. **Export the design system** from Claude Design into `docs/design/`

Optional, only if we later decide to retire the GeoTargetly script entirely: export the
three redirect rules from the GeoTargetly dashboard, since their logic lives there and
we hold only the rule IDs.

Housekeeping still outstanding from the launch audit, unchanged:

8. Delete the 8 dead RSS sitemap submissions and the non-www sitemap in Search Console
9. Resubmit `https://www.cloudemployee.io/sitemap.xml`

---

## 10. Non-goals

Explicitly not in this programme, so nobody builds them by accident:

- **Rebuilding templates.** 27 templates work. The design system re-skins them.
- **Migrating anything off Sanity.** The CMS is correct and content is complete.
- **Google Analytics 4 integration.** Deferred, §5.3.
- **Reviving `/live-job-role/*`.** Expired postings that 404 on the talent site too.
- **A second Search Console property.** The existing domain property already spans www,
  non-www and every subdomain, with unbroken history through the cutover.

---

## 11. Deferred

| Item | Why deferred | Revisit at |
|---|---|---|
| Best Practices score 54-56 | Third-party cookies + deprecated APIs; needs a consent/CSP strategy, which is its own project | After SEO-1 |
| Accessibility 86 on services pages | Real but narrow; ARIA and contrast fixes | SEO-3 |
| TTFB 1.4 s | Currently masked by the 7 s render delay; measure again once that is gone | After SEO-1 |
| `/live-job-role/*` inconsistency | Nothing lost either way | Only if jobs return |
| GA4 | §5.3 | When conversion attribution becomes the question |

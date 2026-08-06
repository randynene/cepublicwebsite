# Post-launch SEO audit — cloudemployee.io

> **The "Priority order" section below is SUPERSEDED by
> `docs/seo/SEO_PROGRAMME.md`** (4 Aug 2026). That document carries the sequenced
> roadmap, the locked decisions, and the full data-source inventory. It also adds
> findings this audit did not have: every page is hidden by CSS until a JavaScript
> callback un-hides it, and that callback is starved by heavy third-party scripts, so
> pages sit blank for seconds; one HubSpot script blocks the main thread; and the
> Marker.io review widget is live for real customers. The measured findings below
> remain accurate and are still the reference for the launch-day state.

Cutover: 3 Aug 2026. This audit: 4 Aug 2026, roughly 12 hours after DNS.

Everything below is measured, not assumed. Every claim has a script behind it that
can be re-run.

---

## Headline

**The migration did no SEO damage.** Of the 330 URLs Search Console has
impressions for, 309 are clean, and every one of the 21 exceptions is either
faithful to what Webflow already did or belongs to the separate `talent.`
subdomain. Zero regressions. Zero clicks lost to the platform change.

**The real problem is older and bigger than the migration**: the domain earns
514,635 impressions per 90 days and converts them into 1,616 clicks. That is a
0.31% click-through rate. Roughly half of those clicks are people typing "cloud
employee" into Google, so genuine non-brand organic traffic is about **9 clicks a
day** against a domain rating of 36.

The migration was the right groundwork. It is not, by itself, going to move
traffic. What follows separates the small amount of tidying from the actual
opportunity.

---

## Data sources

| Source | State | Notes |
|---|---|---|
| Google Search Console API | Working | Service account `gsc-reader@cloud-employee-seo.iam.gserviceaccount.com`, full user on `sc-domain:cloudemployee.io`. Library was missing; installed. |
| Ahrefs API v3 | Working | Contradicts Tech Debt #4, which said the plan didn't cover this domain. It does now. DR 36, Ahrefs rank 2,140,702. |
| Screaming Frog | Stale | Every existing crawl targeted `staging.jakevibes.dev`. Needs a fresh crawl of production. Spec below. |

The Search Console property is a **domain property**, which matters more than it
sounds. It spans www, non-www, http, https and every subdomain, so it holds
continuous history straight through the cutover. There is no old-property /
new-property split to reconcile, and no need to add a new property.

Scripts added:

- `scripts/seo/gsc-pull.ts` — performance data, any window
- `scripts/seo/verify-gsc-urls.ts` — replays every URL Google knows about against production
- `scripts/seo/ahrefs-pull.ts` — top pages, backlink targets, broken backlinks, keywords

Output lands in `audit-output/seo-post-launch/`.

---

## What is actually broken

Very little, and nothing urgent.

### 1. Eight dead RSS feeds are registered as sitemaps in Search Console

Webflow served per-category RSS feeds and someone submitted all eight to Search
Console as sitemaps in March. They all 404 now:

`/customer-story/rss.xml`, `/compare/rss.xml`, `/ai-in-software-development/rss.xml`,
`/nearshoring-offshoring/rss.xml`, `/staff-augmentation/rss.xml`,
`/managing-engineers/rss.xml`, `/scaling-teams/rss.xml`, `/hiring-tips/rss.xml`

Consequence is cosmetic but noisy: Search Console will start reporting sitemap
fetch failures, which buries real errors. Fix is to delete the eight submissions
in Search Console. No code change; we have no reason to serve RSS.

### 2. The non-www sitemap registration is redundant

`https://cloudemployee.io/sitemap.xml` is registered and now 308s to www. Harmless,
but remove it so the sitemap list reflects reality.

### 3. `/live-job-role/*` handling is inconsistent

One of these paths redirects to `talent.cloudemployee.io`; the rest 404 directly.
All of them are expired job postings that 404 on the talent site too, so nothing is
lost either way. Worth making consistent only if the jobs section is ever revived.

**Not broken, despite appearances:** `/team/shawnee-malesich` and
`/team/jimmy-mclellan` 404. Both were already 404 on Webflow before cutover
(verified against the captured pre-cutover behaviour), because CE removed them.
Their Search Console clicks are historical.

---

## The opportunity that the audit surfaced

### A. 24 dead URLs are holding live backlinks, including from a DR 91 site

Ahrefs finds 27 backlinks pointing at 24 unique URLs that return 404. The sources
include sites at DR 91, 75, 73, 61, 59 and 58. Almost all are old Webflow blog
posts under the retired `/blog/<category>/<slug>` pattern, some dating to 2018.

**23 of the 24 were already 404 before the cutover.** This is inherited link rot,
not migration damage. That makes it a clean win rather than a repair: a 301 from
each dead URL to the closest live equivalent reclaims link equity that has been
leaking for years.

Highest value targets:

| DR | Dead URL |
|---|---|
| 91 | `/blog/tech-news/the-future-of-drone-technology` (link has a trailing space, so needs a tolerant rule) |
| 75 | `/blog/productivity/how-to-write-an-nda-for-software-development` |
| 73 | `/blog/productivity/how-to-create-a-compelling-github-portfolio` |
| 61 | `/blog/tech-news/sunrise-industries-in-2018` |
| 59 | `/web-developer` |
| 58 | `/blog/productivity/tools-for-digital-marketing` |

Full list in `audit-output/seo-post-launch/ahrefs-broken-backlinks.json`.

This needs a human decision per URL on the redirect target, because a 301 to an
irrelevant page is treated as a soft 404 and wastes the link. Where no relevant
page exists, the honest options are to leave the 404 or write the replacement
article.

### B. High impressions, near-zero clicks, because rankings sit on page 3+

The pages carrying the most visibility are ranking where nobody clicks:

| Impressions (90d) | Avg position | Page |
|---|---|---|
| 49,921 | 39.3 | `/staff-augmentation/what-is-staff-augmentation-and-what-are-the-benefits` |
| 40,807 | 6.9 | `/compare/toptal-vs-upwork` |
| 33,275 | 25.1 | `/nearshoring-offshoring/what-is-it-outsourcing-definition-models-when-to-use-it` |
| 28,439 | 7.0 | `/nearshoring-offshoring/nearshore-vs-offshore-costs-2026-software-development-rates` |
| 27,572 | 7.2 | `/about-us` |

The two patterns need opposite treatment. Pages at position 25-40 do not have a
click-through problem, they have a ranking problem, and no title rewrite fixes
that. Pages at position 7 with 40,000 impressions and 12 clicks genuinely do have
a presentation problem worth testing.

### C. Keywords already close to the money

From Ahrefs, ranked by volume against current position:

| Volume | Position | Keyword |
|---|---|---|
| 2,700 | 26 | offshoring |
| 2,000 | 4 | toptal alternatives |
| 2,000 | 30 | outsourced it |
| 1,000 | 43 | staff augmentation meaning |
| 700 | 18 | hire latam developers |
| 350 | 30 | hire devops engineers |

"toptal alternatives" at position 4 on 2,000 monthly searches is the standout: it
is commercial, it is close, and `/alternatives` is a page we control and have just
rebuilt.

---

## Screaming Frog: what to send me

The existing crawls in `screaming-frog/` all targeted staging and are now
superseded. Please run one fresh crawl of production.

**Configuration**

- Crawl `https://www.cloudemployee.io`
- Rendering: **JavaScript** (Configuration > Spider > Rendering). The site is
  server-rendered but some sections hydrate client-side, and text-only mode will
  under-report.
- Respect robots.txt: yes
- Crawl subdomains: **off** (`talent.` is a separate Webflow site and will pollute
  the numbers)
- Crawl depth: unlimited

**Connect the APIs inside Screaming Frog.** This is the part that makes the crawl
far more useful than a plain one, and you already hold both keys. Under
Configuration > API Access, connect:

- **Google Search Console** — joins real clicks and impressions onto every crawled
  URL, so issues can be sorted by what they actually cost
- **Ahrefs** — joins referring domains onto every URL, so we can see which pages
  are worth protecting
- **PageSpeed Insights** — gives Core Web Vitals per URL, which I have no other way
  to measure at scale and which we have never checked on the new build

**Exports to send** (Bulk Export, or the tab exports):

1. Internal > All (`internal_all.csv`) — the master file, most of the audit runs off this
2. Response Codes > All
3. Page Titles > All
4. Meta Description > All
5. H1 > All
6. Canonicals > All
7. Directives > All
8. Images > Missing Alt Text
9. Structured Data > Validation Errors and Warnings
10. Hreflang > All
11. Reports > Redirects > All Redirects (and Redirect Chains)
12. Reports > Crawl Overview

Drop them in `screaming-frog/pass5-production/`.

---

## Priority order

**Now, low effort**

1. Delete the 8 dead RSS sitemap submissions and the non-www sitemap in Search Console
2. Resubmit `https://www.cloudemployee.io/sitemap.xml` to force a fresh fetch of all 653 URLs
3. Run the production Screaming Frog crawl with the APIs connected

**This week**

4. Decide redirect targets for the 24 dead backlink URLs, then implement as 301s
5. Review the Screaming Frog crawl for anything the URL-level audit could not see:
   internal linking depth, orphan pages, Core Web Vitals, structured data errors
6. Watch Search Console index coverage daily for two weeks; the risk window for a
   platform migration is where Google re-crawls and re-evaluates, not day one

**Strategic, needs a decision from Jake**

7. Non-brand organic is ~9 clicks a day. Growing that is a content and authority
   programme, not a technical fix. The audit says the technical foundation is sound,
   which means the constraint is now content quality, topical depth and links.

---

## Monitoring

Re-run any time:

```
npx tsx scripts/seo/gsc-pull.ts --days 30
npx tsx scripts/seo/verify-gsc-urls.ts
npx tsx scripts/seo/ahrefs-pull.ts
```

Search Console data lags 2-3 days, so post-cutover performance will not be
readable until roughly 6 Aug. The comparison that matters is the 28 days after
cutover against the 28 days before, on the same property.

# PER-TEMPLATE SEO / GEO / AEO CHECKLIST

**Purpose:** every TEMPLATE-* build brief must satisfy this checklist before phase-close. SEO/AEO is structural (a gate, like schema-lock), not remembered. Grounded in the SEO infrastructure audit (what already exists in the repo) and verified mid-2026 AEO reality (what actually moves AI-citation outcomes).

**Two things to hold in mind:**

1. **The one technical principle:** AI-search crawlers fetch HTML on demand, don't reliably execute JS, and work under short (1-5s) timeouts and finite context windows. The whole game is: get meaningful content into the initial server-rendered HTML, structure it so it's extractable, describe it with structured data, and make it fast.

2. **The strategic reality (don't forget this):** 2026 studies find brands are ~6.5x more likely to be cited via THIRD-PARTY sources than their own domain, and AI-citation overlap with Google's top 10 is only ~12% (ChatGPT ~8%). Translation: a perfectly optimized CE site is necessary but NOT sufficient for AEO citations. The site makes CE citable and readable; actual citations also depend on off-site presence (listicles, reviews, industry mentions). That off-site motion is a separate post-launch workstream (see end). Don't expect the site alone to win AI citations.

---

# TIER 1 — LAUNCH GATE (blocking; site cannot go live until these pass)

These are binary pass/fail per the AEO research ("blocking conditions - they block AI visibility until fixed"). Every built template + chrome must satisfy all of these before cutover. **This is the go-live SEO checklist.**

### G1. Indexable + HTTPS
- [ ] Real pages have NO stray `noindex`. (404, thank-you, preview pages SHOULD be noindex; everything else must be indexable.)
- [ ] Production robots.txt allows crawling; served over HTTPS.
- [ ] Page actually builds — a route that fails `npm run build` (e.g. the privacy-policy Zod-null bug) is invisible. No build-broken routes at launch.

### G2. Content in server-rendered HTML
- [ ] Route is an async server component; primary content is in the initial HTML response, NOT client-gated behind hydration/scroll/interaction.
- [ ] Body copy via server-side `PortableText` (no `'use client'` on content-bearing components).
- [ ] All internal links are real `<a href>` / Next `<Link href>` in the SSR HTML — never `<span>`+onClick, never label-only. (This is the mega-menu gap — gap brief P0-1.)

### G3. Metadata (`generateMetadata`) — every template, no title-only pages
- [ ] `title` (Sanity `metaTitle`) and `description` (`metaDescription`).
- [ ] `generateCanonical(usPath, locale)` → `alternates.canonical`.
- [ ] `generateHreflang(usPath)` → `alternates.languages` (en-US / en-GB / x-default).
- [ ] `openGraph`: title, description, url (= canonical), type, image.
- [ ] `twitter`: `summary_large_image`, title, description, image. (Blog detail is MISSING this — do not copy that omission.)
- [ ] OG image: Sanity `openGraphImage ?? thumbnailImage` → 1200x630, else `/og-default.png`.

### G4. JSON-LD per template — correct type, reflecting VISIBLE content
- [ ] Dedicated module `site/src/components/templates/{type}/json-ld.tsx`, piped through `serializeJsonLd()` (never raw `JSON.stringify`).
- [ ] Correct schema.org `@type`, chosen deliberately:
  - Team member → **Person** (name, jobTitle, image, worksFor→Organization, sameAs)
  - Review → **Review** (itemReviewed, author, reviewRating, reviewBody)
  - Video → **VideoObject** (name, description, thumbnailUrl, uploadDate, duration, embedUrl)
  - Service → **Service** (name, provider→Organization, serviceType, areaServed)
  - Download/guide → **CreativeWork** / **DigitalDocument** (or **HowTo** if procedural)
  - Event → **Event** (name, startDate, endDate, location/VirtualLocation, organizer)
  - Tool/calculator → **WebApplication** / **SoftwareApplication**
  - Comparison → **ItemList** or structured comparison markup
- [ ] **BreadcrumbList** on every non-home template, mirroring the visible breadcrumb.
- [ ] Schema reflects content actually VISIBLE on the page — never mark up hidden/implied content (2026 research: this hurts, not helps).
- [ ] Resolves from real Sanity data; missing schema.org fields flagged as data gaps, never fabricated.

### G5. Sitemap registration
- [ ] Doc type added to `URL_BUILDERS` in `sitemap.ts` (only `blogPost` is registered — a template that skips this never enters the sitemap).
- [ ] Both `default` and `uk` locale URLs where bilingual.

### G6. Semantic HTML + heading structure
- [ ] Route wraps template in `<main id="main">`.
- [ ] Exactly one `<h1>`; sequential `<h2>` > `<h3>` > `<h4>` hierarchy. (2026 research: sequential heading structure = 2.8x citation lift. This is not cosmetic.)
- [ ] `<article>` / `<section>` / `<aside>` / `<nav aria-label>` used correctly.

### G7. Speed (crawlable within timeout)
- [ ] Images via E1 `Image` wrapper (`next/image` + Sanity loader), never bare `<img>`; LCP image `priority` + `sizes`; below-fold lazy.
- [ ] Meaningful `alt` on all images (flag empty Sanity alt fields, don't ship blank alt).
- [ ] No new render-blocking `<head>` scripts; defer/lazy third-party.
- [ ] Lighthouse **SEO = 100** (hard gate). Perf/BP may carry documented tech debt but must not be egregiously slow — AI bots time out in 1-5s.

**Tier 1 phase-close gate per template:** all G1-G7 ticked · Lighthouse SEO 100 · `validate-json-ld.ts` extended for the new `@type` and passing · sitemap entry verified in `/sitemap.xml` · data gaps flagged not fabricated.

---

# TIER 2 — OPTIMIZE AFTER LAUNCH (measurable citation lift; not blocking)

Ship the site with Tier 1; layer these in to drive citations. Ordered by evidenced impact.

### O1. FAQPage schema wherever content supports it — HIGHEST-impact Tier 2 signal
- [ ] 2026 research: FAQPage schema is the single strongest predictor of AI citation rate.
- [ ] Visible FAQ section + matching FAQPage JSON-LD (plain-text Q&A).
- [ ] Answers must be DIRECT and specific ("The answer is X") — not hedged, not "contact us." Vague answers don't drive citations.
- [ ] Depends on FAQ content being captured (the hub audit flagged no FAQ field on hub types — schema addition needed there first).

### O2. Answer-formatted content
- [ ] Question phrased as the heading; 40-60 word direct answer in the first paragraph; elaboration after. (If the answer only makes sense after 3 paragraphs of build-up, the page can't be quoted.)
- [ ] Definitions phrased as clean standalone statements in the first sentence of their section.
- [ ] Comparisons/steps/specs in real `<table>` / `<ol>` / `<dl>`, not prose blobs.

### O3. Freshness + `dateModified` (a real 2026 ranking factor)
- [ ] Emit `dateModified` / `datePublished` in Article/relevant schema from Sanity `_updatedAt`.
- [ ] Establish a quarterly content-refresh discipline on high-value pages. (Research: 83% of commercial-query citations come from pages updated <12 months; pages not refreshed quarterly are 3x more likely to LOSE citations.)

### O4. Evidence & authority signals (Princeton GEO study quantified these)
- [ ] Expert quotes where the content supports them (~+41% visibility).
- [ ] Statistics with sources (~+30%).
- [ ] Inline citations to reputable sources (~+30%).
- [ ] Author/expert attribution (Person schema, real bio, credentials) on authored content.

### O5. HowTo schema on procedural/step content.

### O6. Internal linking to related content (related posts/services, parent hub) as crawlable anchors.

---

# TIER 3 — POST-LAUNCH / OFF-SITE (the 6.5x factor — do NOT skip strategically)

Not a code task, not part of the site build — but this is where MOST AI citations actually originate. Flag as a separate workstream to stand up after launch:

- **Off-site citation building:** get CE mentioned in third-party listicles ("best staff augmentation companies"), review sites, comparison articles, industry publications, podcasts. Research says brands are ~6.5x more likely to be cited via third-party sources than their own domain. The site alone will not deliver AEO citations.
- **AI-citation monitoring:** periodically test target queries across ChatGPT / Perplexity / Google AI Overviews / Gemini; track whether CE is cited and which sources win.
- **`llms.txt`:** ship one (near-zero cost, real value for agentic/IDE consumers like Cursor), but verified low value as a citation lever — the search/answer bots ignore it and crawl HTML directly. Do NOT prioritize it or treat it as ranking strategy. Do NOT create per-page Markdown mirrors (duplicate-content crawl-budget dilution).

---

# APPLICATION — how this gets used

- **Every TEMPLATE-* brief references this file by name** and must satisfy Tier 1 before phase-close (like schema-lock).
- **Tier 1 = the launch gate.** Before cutover, confirm all built templates + chrome pass G1-G7. That's the go-live SEO bar.
- **Tier 2 rides along** as templates/hubs get their content (FAQ capture, answer-formatting, freshness) — layered in during and after builds, not blocking launch.
- **Tier 3 is a post-launch workstream** owned separately (content/PR), not part of the Cursor build pipeline.
- **Template category tag** in each brief: Simple/pattern-apply (Claude Code/v0) vs Complex/animated (human dev) — SEO layer applies to both.

Update this file if the established pattern or the AEO evidence changes.

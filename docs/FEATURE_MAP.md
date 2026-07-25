# FEATURE_MAP.md

## Services + Technology — Sanity Wiring (detail + hub, Phase 2A + 2B, Jul 2026)
- Description: `/services` and `/technology` (detail `[slug]` + hub index + UK mirrors) moved off hardcoded data onto Sanity, rendering the approved design. Detail pages use the CatalogueDetail transform + a two-layer shared/per-page FAQ block; hub pages use a data-driven card grouping. Unknown detail slugs 404 (no duplicate-content boilerplate).
- Phase: MYGRATR Phase 2A (detail, commit `b95b1ae`) + Phase 2B (hubs, uncommitted)
- Files:
  - Detail transform: `site/src/lib/catalogue/content.ts` (`mapServiceToContent`, `mapTechnologyToContent`); template `site/src/components/templates/catalogue/detail.tsx`; FAQPage JSON-LD `site/src/components/templates/catalogue/faq-json-ld.tsx`
  - Detail routes: `site/src/app/{services,technology}/[slug]/page.tsx` (+ `/uk/` mirrors)
  - Hub data: `site/src/lib/sanity/queries/catalogue-hub.ts` (one round-trip per hub: singleton + child list)
  - Hub transform: `site/src/lib/catalogue/hub-content.ts` (`mapServicesHubData`, `mapTechnologyHubData`)
  - Hub templates: `site/src/components/templates/{services-hub,technology-hub}/index.tsx` (now take `content` + `pathPrefix` props)
  - Hub routes: `site/src/app/{services,technology}/page.tsx` (+ `/uk/` mirrors)
  - Shared FAQ singleton: `studio/schemas/singletons/shared-service-faqs.ts`; per-page override `service.faqs` / `technology.faqs`; seed `npm run content:seed-shared-faqs`
- Grouping (data-driven, no schema change): featured = `servicesHub.featuredItems` (fallback Software Engineers + Fractional CTOs); specialists = `type==staffAugmentation` && !`aiOffering` && !`location`; AI = `aiOffering`; builds = `type==productBuilds` && !AI; Product Scoping (consultingServices) = promo CTA. Live split reproduced: 2 / 12 / 3 / 3.
- Decisions: keep CatalogueDetail design (D1); keep live H1s; hub meta from the singleton; technology directory = real Sanity techs A-Z (listItemOnly excluded).

## Blog Family — Listing Pages + Article Template + Floating TOC (design, Jul 2026)
- Description: 7 listing pages (`/blog` + 6 topic hubs + UK mirrors) rebuilt from one shared shell to `docs/blog_topic_hubs.pdf`; article detail template widened with an H2-only auto-generated floating table of contents. Search/pill FILTERING deferred Phase 2 (markup already in place).
- Phase: MYGRATR-LAUNCH-PARITY design track (Jul 2026)
- Files:
  - Shell: `site/src/components/templates/blog-hub/index.tsx`; data resolver `site/src/lib/blog/render-route.ts`
  - Pieces: `site/src/components/blog/{article-card,featured-block,category-pill,author-byline,topic-pills,search-form,long-form-band,faq-accordion,pagination,section-label,container,article-body,table-of-contents}.tsx`
  - Logic: `site/src/lib/blog/{featured.ts,hero-copy.ts,toc.ts}`
  - Article template: `site/src/components/templates/blog/index.tsx`
  - Data: hub `faqs` + `featuredArticles/featuredItems` cap 5 (`studio/schemas/singletons/_factories.ts`); `metaDescription` projected in `site/src/lib/sanity/queries/hubs.ts`; `defined(date) desc` on date-sorted hubs
  - Seed: `npm run content:seed-blog-hero`, `npm run content:capture-hubs`
- Decisions (Tech Debt #43b): live H1s kept verbatim; long lead moved (not overwritten) into the long-form band.

## Calculators — Price Comparison + Hiring Cost (Jul 2026)
- Description: two interactive calculators rebuilt from CE's real cost models. Price-comparison model readable in source (verified 60 scenarios); hiring-cost model recovered empirically from a minified bundle (verified 900 figures, re-checkable via `npm run verify:hiring-cost`).
- Phase: MYGRATR-LAUNCH-PARITY (Jul 2026)
- Files:
  - Models: `site/src/lib/calculators/{price-comparison.ts,hiring-cost.ts}` (formulas in code)
  - Rate card in Sanity: `calculatorRate` object + `priceComparisonCalculatorPage.rates`; seed `npm run content:seed-calculator-rates`
  - UI: `site/src/components/templates/{price-comparison,hiring-cost}-calculator/calculator.tsx`
  - Routes: `/price-comparison-calculator` (+ UK, noindex), `/hiring-cost-calculator`
- Tech Debt #59 (/pricing should render the component, not iframe), #60 (calculators undesigned; hiring-cost model in code not Sanity).

## Post-Conversion Pages (Jul 2026)
- Description: 7 pages (`/book-a-call` + 2 booking confirmations + 4 thank-yous) x 2 locales that HubSpot forms and Calendly bookings redirect to. `calendlyUrl` added to the static-page shape; inline booking widget reused from TEMPLATE-BOOK_A_CALL. 6 of 7 noindex (matching live); `/book-a-call` indexable + in sitemap.
- Phase: MYGRATR-LAUNCH-PARITY (Jul 2026)
- Files: `site/src/components/templates/static-page/index.tsx` (calendlyUrl render), `site/src/lib/static-page/render-route.tsx` (noindex set + empty-page guard counts widget), route shims under `site/src/app/`.

## Site Chrome Visual Rebuild (STATIC-3)
- Description: Visual rebuild of header, mega-menus, footer, and announcement bar on D2 dark/lime tokens against Header.html + Footer.html exports. Consumes STATIC-2 globals; no Supabase DDL.
- Phase: MYGRATR-STATIC-3 (Jul 2026, closed)
- Files:
  - Shared alignment: `site/src/components/layout/chrome-band.tsx` (`CHROME_CONTENT_BAND`, `CHROME_HEADER_ROW`, `CHROME_H_PAD`)
  - Header: `site/src/components/layout/nav.tsx` (StickyChrome + announcement wiring + SiteNavigationElement JSON-LD), `nav-client.tsx` (desktop flex nav + mega-menu triggers), `announcement-bar.tsx`
  - Mega-menus: `site/src/components/layout/mega-menus/{services,resources,_shell,_parts}.tsx`
  - Footer: `site/src/components/layout/footer/{index,link-grid,subscribe,subscribe-form,bottom-bar,top-cta,_parts}.tsx`
  - Region: `site/src/components/layout/region-selector.tsx` (footer mount)
  - Queries: `site/src/lib/sanity/queries/navigation.ts` (+ `announcementBar` projection), `footer.ts`
  - Studio: `studio/schemas/globals/navigation.ts` (+ `announcementBar`)
  - Scripts: `scripts/static/patch-announcement-bar.ts`, `validate-json-ld.ts` (@graph flatten)
  - Tokens: `site/src/app/tokens.css` (`--announcement-bar-active-height`), `globals.css` (calc padding-top)
- Data state: `navigation.announcementBar` patch-seeded in production; Studio deployed Jul 2026.

---

## Chrome Schema v2 — Navigation + Footer Extensions + Tagline (STATIC-2)
- Description: Schema + content phase extending navigation + footer globals to support STATIC-3's visual rebuild. Adds mega-menu structures (Services hybrid CMS-driven references, How It Works image cards, Resources featured posts + stories), footer top-CTA + section grouping + Talent Locations + restructured Subscribe + Bottom bar, service+technology `tagline` fields. Legacy fields preserved for STATIC-1 render regression safety.
- Phase: MYGRATR-STATIC-2 (May 2026)
- Schema:
  - `studio/schemas/globals/navigation.ts` (rewrite — `dropdownType` discriminator + `servicesMegaMenu` + `howItWorksMegaMenu` + `resourcesMegaMenu`)
  - `studio/schemas/globals/footer.ts` (rewrite — `topCtaBlock` + `sections` + `talentLocations` + `subscribe` + `bottomBar`)
  - `studio/schemas/documents/{service,technology}.ts` (+`tagline`)
  - `studio/schemas/_shared.ts` (`imageField()` + `altRequired` opt)
- Site Zod + GROQ:
  - `site/src/lib/sanity/queries/navigation.ts` (Zod rewrite; GROQ projection with reference dereferencing + type-aware icon `select()`)
  - `site/src/lib/sanity/queries/footer.ts` (Zod rewrite; GROQ projection for new structured fields)
- Audit + reseed scripts:
  - `scripts/audit/static-2/extract-chrome.ts` (Playwright audit; ~2100 lines)
  - `scripts/audit/static-2/probe-panel-shape.ts` (diagnostic probe)
  - `scripts/static/seed-globals-v2.ts` (reseed; ~700 lines)
  - `scripts/static/verify-static-2.ts` (phase-close gate)
- npm scripts: `audit:static-2`, `audit:static-2:probe`, `static:seed-globals-v2`, `static:verify-2`
- Data state on close: 19 taglines populated; 25 references in navigation resolve (19 services/tech + 3 customerStory + 3 blogPost); 4 inline HIW images uploaded (2 net new after dedupe); backup at `audit-output/static-2/pre-reseed-backup.tar.gz` (943K, 422 docs).
- Locked decisions: Services mega-menu hybrid CMS-driven (references); HIW mega-menu inline images (Option B); Resources featuredPosts/featuredStories hand-curated (Decisions A + B). Footer `/alternatives` not `/compare` (DELTA-6). "Our Clients" → `/our-work` (DELTA-5).
- Brief-vs-reality deltas filed: A (footer CTA "Book A Call"), B (service mega-menu text-only), C (customer-story URL singular), D (blog cards multi-namespace), STATIC-3-DELTA-1 (floating-pill scroll-triggered).
- Customer-2 reusable patterns (CAPABILITY_LOG.md): `__name` shim, plan-mode DOM-confirmation discipline, discriminated icon shape, audit-driven brief refinement.

---

## Site Chrome — Header, Footer, Hubs, 404 (STATIC-1)
- Description: Foundational chrome layer. Every template phase renders inside it.
- Phase: MYGRATR-STATIC-1 (May 2026)
- Files:
  - Site Header (server shell + client island)
    - `site/src/components/layout/nav.tsx` (server shell, fetches `navigation` global, renders skip-link + logo + Container, hands data to NavClient)
    - `site/src/components/layout/nav-client.tsx` (interactive island: desktop dropdowns via WAI-ARIA Disclosure pattern, mobile drawer via Radix Dialog, locale switcher pathname-aware, Calendly CTA wired to canonical CE intro popup URL)
  - Site Footer (server, dark-navy surface)
    - `site/src/components/layout/footer.tsx` (4 columns + HubSpot newsletter + legal + `{year}`-substituted copyright; `role="contentinfo"`, 5 ARIA labels)
  - 16 Hub pages (1 shared render helper + 16 thin route files)
    - `site/src/lib/hubs/render-hub.tsx` (hero + featured + paginated card grid + prev/next + inline CollectionPage + BreadcrumbList JSON-LD; sr-only h2 bridge between hub h1 and card h3 on collection hubs for heading-order)
    - `site/src/lib/hubs/pagination.ts` (`parsePageParam` + `buildPagination` + `buildPageNumbers`; notFound() on invalid input or out-of-range)
    - `site/src/lib/hubs/metadata.ts` (one `buildHubMetadata` for all 16 routes; OG image cascade hub.openGraphImage → siteSettings.defaultOgImage → omit)
    - `site/src/lib/hubs/render-route.ts` (`resolveHubRoute` orchestrator)
    - `site/src/lib/sanity/queries/hubs.ts` (`HUB_CONFIG` table + generic singleton/child/count fetchers via `sanityFetch`)
    - 16 hub `page.tsx` under `site/src/app/<hub>/` (23 lines each)
    - 3 cards under `site/src/components/cards/` + `_shared.tsx` helpers
  - 404 page
    - `site/src/app/not-found.tsx` (renders `notFoundPage` singleton; explicit noindex; Next.js auto-injected noindex on 404 response)
    - `site/src/lib/sanity/queries/not-found-page.ts` (GROQ + Zod + `fetchNotFoundPage` + `findCtaSection`)
  - Shared lib
    - `site/src/lib/url.ts` (`toInternalHref()` — strips known CE hosts to bare pathname; used by Header, Footer, cards, 404)
    - `site/src/lib/sanity/queries/{navigation,footer}.ts` (GROQ + Zod + fetchers)
  - Routing
    - `site/next.config.ts` lockedRules — `/pricing → /services` 308 added
    - `site/src/lib/redirects/regex-redirects.ts` — `:slug+` manual edits for /customer-stories (Tech Debt #37)
    - `site/src/app/sitemap.ts` — extended with 16 default-locale hub entries (Step 4); 16 UK hub entries removed at Step 7 close (Gap 1)
  - Sanity content (seeded once in Step 1, read-only thereafter)
    - 3 globals: `navigation`, `footer`, `siteSettings` (with `defaultOgImage` asset from CE `usthumb.png`)
    - 16 hub singletons (7 `defineBlogHub` + 9 `defineCollectionHub`)
    - `notFoundPage` singleton
  - Seed + verification scripts
    - `scripts/static/seed-globals.ts` (3 docs createOrReplace)
    - `scripts/static/seed-hubs.ts` (17 docs createOrReplace; reads audit-output for 14 hubs, uses Jake-authored copy for 2)
    - `scripts/static/patch-hub-metadescriptions.ts` (videosHub + staffAugmentationHub patch)
    - `scripts/static/seed-default-og-image.ts` (CE Webflow source → Sanity asset)
    - `scripts/static/axe-not-found.ts`, `axe-hub.ts` (Playwright + axe-core a11y sweep)
    - `scripts/static/probe-nav-interactive.ts` (keyboard contract verification)
    - `scripts/static/sweep-routes.ts` (11-route Playwright + console capture)
    - `scripts/static/validate-json-ld.ts` (JSDOM-parse + schema.org type check)
    - `scripts/static/verify-static-1.ts` (single-command phase-close gate combining all Steps 1-6 checks)

## Repo Scaffold
- Description: Base project structure with TypeScript, dependencies, briefs folder
- Phase: MYGRATR-0

## Database Schema
- Description: 10-table Supabase schema, RLS on all, org_id on all
- DB Tables: organisations, migrations, audit_manifests, schema_designs,
  content_migrations, template_builds, qa_runs, redirects, launches
- Phase: MYGRATR-0

## Shared TypeScript Types
- Description: All domain interfaces, enums, and Zod schemas
- Files: src/lib/types.ts
- Phase: MYGRATR-0

## Webflow Inventory Script
- Description: Fetches all pages, collections, fields, forms from Webflow API v2
- Files: scripts/webflow-inventory.js
- Output: audit-output/ce-inventory.json
- Phase: MYGRATR-0 (pre-session)

## Firecrawl Sitemap Script
- Description: Full site crawl of cloudemployee.io, maps all reachable URLs
- Files: scripts/firecrawl-sitemap.js
- Output: audit-output/ce-sitemap.json
- Phase: MYGRATR-0 (pre-session)

## Audit Types
- **Description:** Shared enums and interfaces for the audit pipeline. Defines
  UrlStatus, TemplateType, ClassificationMethod, InteractionType, CanonicalUrl,
  ScreenshotRecord, PageContent, ThirdPartyScript, ScriptInventory,
  HubSpotForm, TemplateClassification, CollectionRecord, AuditAnomaly.
- **Lib Modules:**
  - `src/lib/audit-types.ts` — exports all audit-domain types
- **Phase:** MYGRATR-AUDIT-1

## Schema Design Doc (locked input to SCHEMA-1)
- **Description:** Authoritative Sanity schema design decisions for the CE
  migration. Defines 21 document types, ~30 singletons, 3 hardcoded routes,
  6 global schemas, redirect preservation strategy, and 32 locked decisions.
  Consumed verbatim by MYGRATR-SCHEMA-1 to produce Sanity schema files.
- **Page:** None (documentation)
- **API Routes:** None
- **Lib Modules:** None
- **Artefacts:**
  - `docs/CE_RAW_EXTRACT.md` — verbatim audit output (reference only)
  - `docs/CE_SITE_TRUTH.md` — structured source-of-truth derived from the extract
  - `docs/MYGRATR_SCHEMA_DESIGN_DECISIONS.md` — locked design doc (v1.2)
  - `docs/SCHEMA_DECISIONS_AUDIT_REPORT.md` — v1.0 red-team audit
  - `docs/SCHEMA_DECISIONS_AUDIT_REPORT_V2.md` — v1.1 re-audit
  - `docs/investigations-2026-04-23/` — three investigations + redirects verification
- **DB Tables:** None (SCHEMA-1 will write to `schema_designs`)
- **Phase:** MYGRATR-SCHEMA-0

## Sanity Schema Design (input to CONTENT-1 and the Studio)
- **Description:** 71 Sanity schema types covering every CE migration target
  — 21 CMS document types, 31 singletons (hubs + static pages +
  calculators), 3 globals, and 16 shared/polymorphic object types.
  Translates the locked design doc into working code. Studio v5 scaffold
  under `studio/` connects to Sanity project `lzbhll1u` / dataset
  `production`. Zod mirrors live under `src/types/sanity/` for use by
  the Next.js app. Four scripts under `scripts/schema/` drive the phase
  transitions and seed operations.
- **Page:** Sanity Studio (local via `npx sanity dev` in `studio/`)
- **API Routes:** None (SCAFFOLD-1 builds the Next.js app)
- **Lib Modules:**
  - `src/lib/env.ts` — Zod-validated env loader + runtime guards
  - `src/lib/supabase.ts` — `createServerClient()`
  - `src/lib/pipeline/state-machine.ts` — `assertValidTransition()`
  - `src/types/sanity/shared.ts` — Zod primitives, Fold, Section
    discriminated union, FaqItem, QuoteBlock, meta field groups
  - `src/types/sanity/documents/*.ts` — 21 Zod schemas + factory
  - `src/types/sanity/singletons/*.ts` — 31 Zod schemas + factories
  - `src/types/sanity/globals/*.ts` — 3 Zod schemas
- **Studio Schemas:**
  - `studio/schemas/objects/*.ts` — portable-text, faq-item, quote-block,
    fold, section (12 variants)
  - `studio/schemas/documents/*.ts` — 21 CMS types + landing-page factory
  - `studio/schemas/singletons/*.ts` — 31 singletons + 4 factories
  - `studio/schemas/globals/*.ts` — siteSettings, navigation, footer
  - `studio/schemas/_shared.ts` — shared field builders
  - `studio/schemas/structure.ts` — grouped singleton navigation
  - `studio/sanity.config.ts` — singleton templates + actions filters
- **Scripts:**
  - `scripts/schema/start-schema-phase.ts` — audit_complete →
    schema_running transition
  - `scripts/schema/seed-singletons.ts` — createIfNotExists for 34 stub
    singleton/global docs in production
  - `scripts/schema/smoke-test-seed.ts` — 5-doc integration test
    (blogCategory, tag, teamMember, technology with 3 folds, blogPost)
  - `scripts/schema/record-schema-designs.ts` — inserts 21
    `schema_designs` rows + transitions to schema_complete
- **DB Tables:** `schema_designs` (write — 21 rows, all `status='approved'`),
  `migrations` (status update to `schema_complete` with
  metadata.schema_phase block)
- **External systems:** Sanity project `lzbhll1u` (dataset: production) —
  34 seeded stub docs + 5 smoke-test docs
- **Docs:**
  - `docs/WEBFLOW_TO_SANITY_FIELD_MAP.md` — field-level mapping for every
    Webflow collection; consumed by CONTENT-1
- **npm scripts:** `npm run schema:start`, `schema:seed-singletons`,
  `schema:smoke-test`, `schema:record`
- **Phase:** MYGRATR-SCHEMA-1

## Next.js Scaffold (CE customer-facing site)
- **Description:** Customer-facing Next.js 16 app at `site/` that renders
  Sanity content. Includes Sanity client + preview client wiring, locale
  routing helpers (canonical / hreflang / `/uk` prefix mirror), root
  layout with the 17 audit-confirmed third-party scripts, robots and
  sitemap stubs, full redirect translation pipeline, Sanity Presentation
  Tool integration with draft-mode + visual editing.
- **Pages:**
  - `site/src/app/page.tsx` — `/` (homePage placeholder; TEMPLATE-HOME
    fills in the fold sections)
  - `site/src/app/uk/page.tsx` — `/uk` (UK locale mirror)
  - `site/src/app/uk/[...slug]/page.tsx` — catch-all 404 placeholder
    (TEMPLATE-* replaces with explicit dynamic segments per design doc §10)
  - `site/src/app/layout.tsx` — root layout: Inter font, metadata
    defaults, GeoTargetly + GTM head/body, Nav/Footer stubs, SanityLive,
    conditional VisualEditing, GlobalScripts
- **API Routes:**
  - `site/src/app/api/draft-mode/enable/route.ts` — preview-secret
    validation, same-origin redirect guard, draftMode().enable()
  - `site/src/app/api/draft-mode/disable/route.ts` — draftMode().disable()
- **File-convention routes:**
  - `site/src/app/robots.ts` — Disallow: /download-thank-you/
  - `site/src/app/sitemap.ts` — homepage + UK homepage stub (CONTENT-1
    expands)
- **Lib Modules (site):**
  - `site/src/lib/env.ts` — Zod env loader scoped to the Next.js app
  - `site/src/lib/locale.ts` — `LOCALES`, `getLocaleFromPath`,
    `buildLocalePath`, `generateCanonical`, `generateHreflang`
  - `site/src/lib/sanity/client.ts` — `sanityClient` + `previewClient`
  - `site/src/lib/sanity/queries.ts` — `getSiteSettings` smoke-test stub
  - `site/src/lib/sanity/live.ts` — `defineLive({ client })` factory
    exposing `sanityFetch` and `SanityLive`
  - `site/src/lib/redirects/{generated,regex,webflow}-redirects.ts` —
    auto-generated tracked redirect tables
- **Components:**
  - `site/src/components/locale-provider.tsx` — client `LocaleContext`
  - `site/src/components/third-party-scripts.tsx` — `GeoTargetlyScript`,
    `GtmHeadScript`, `GtmNoScript`, `GlobalScripts`
  - `site/src/components/layout/nav.tsx`, `footer.tsx` — server stubs
    that null-guard `getSiteSettings()`
- **Studio change:** `studio/sanity.config.ts` adds `presentationTool`
  from `sanity/presentation` with previewMode/draftMode pointing at
  `/api/draft-mode/enable`.
- **Scripts:**
  - `scripts/scaffold/extract-redirects.ts` — reads gitignored
    `audit-output/` and writes three tracked TS files into
    `site/src/lib/redirects/`
  - `scripts/scaffold/start-scaffold-phase.ts` — schema_complete →
    scaffold_running transition
  - `scripts/scaffold/complete-scaffold-phase.ts` — scaffold_running →
    scaffold_complete; records `metadata.scaffold_phase.vercel_preview_url`
- **Config:**
  - `site/next.config.ts` — composes the four redirect tables,
    `turbopack.root: __dirname`
  - `site/.env.local.example` — committed env template
- **DB Tables:** `migrations` (status → scaffold_complete with
  `metadata.scaffold_phase`)
- **External systems:** Vercel preview deploy at
  `https://mygratr-c3utcgloa-cloud-employee.vercel.app`
- **npm scripts:** `npm run redirects:extract`, `scaffold:start`,
  `scaffold:complete`, plus `cd site && npm run dev|build|start`
- **Phase:** MYGRATR-SCAFFOLD-1

## Content Migration — Webflow w-embed Recovery (CONTENT-1E)
- **Description:** Post-phase patch on closed CONTENT-1C that recovers
  Webflow RichText embed content flattened by `@sanity/block-tools.htmlToBlocks`.
  Adds `videoEmbed` + `table` PortableText types; extends `toPortableText`
  deserializer for `<figure class="w-richtext-figure-type-video">` and
  `<div data-rt-embed-type='true'>` wrappers; ships B3 renderers + LinkedIn
  `parseVideoUrl` extension. `migrations.status` unchanged at `content_complete`
  (post-phase patch invariant). Resolves Tech Debt #25.
- **Schema additions:**
  - `studio/schemas/objects/portable-text.ts` — `videoEmbed` (url + caption)
    + `table` (headerRows + bodyRows + caption + boldFirstColumn) added to
    canonical PortableText `of[]` array.
- **Deserializer (extends CONTENT-1C `toPortableText`):**
  - `src/lib/content/migration-helpers.ts` — 3 new rule branches in the
    htmlToBlocks deserializer (figure-video → videoEmbed; div[data-rt-embed-type]
    + `<table>` → table block with first-row-`<th>` header normalization +
    `bold-col-one` → `boldFirstColumn`; div[data-rt-embed-type] + `<iframe>`
    (no table) → videoEmbed; defensive catch-all warn). Deterministic `_key`s:
    `{type}-{webflowId}-{position}` when `opts.webflowId` provided.
- **Scripts:**
  - `scripts/content/probe-w-embed-sweep.ts` — Step 1 read-only sweep probe.
  - `scripts/content/migrate-w-embed-recovery.ts` — Step 4 migrator; HARD
    GATE; dedup-aware pre-flight (`classifySweepTargets`); halt-on-first-failure
    per-doc guards; pre-patch snapshots to disk.
  - `scripts/content/verify-content-1e.ts` +
    `scripts/content/run-verify-content-1e.ts` — Step 6 verifier; 5 hard-gate
    checks (schema round-trip, _type frequencies, migrations.status invariant,
    w-embed-recovery row healthy, no prior-phase regression).
- **Renderers:**
  - `site/src/components/ui/portable-text/index.tsx` — `videoEmbed` +
    `table` handlers in `defaultComponents.types` (eager-mode VideoEmbed;
    `bg-brand-tertiary text-text-on-dark` header per locked Option α).
  - `site/src/components/ui/video-embed/index.tsx` — `parseVideoUrl`
    extended for LinkedIn; `buildEmbedUrl` branches per provider;
    `LINKEDIN_ALLOW` iframe permissions.
- **Migration outputs:**
  - 79 docs patched (49 blogPost + 27 compareBlog + 3 customerStory)
  - 149 embeds recovered (142 tables + 7 videoEmbeds)
  - 9 deduped-to-canonical Webflow mirrors skipped
  - 0 orphans
  - 1 `content_migrations` row: `collection_slug='w-embed-recovery'`,
    `status='complete'`, `parity_score=100`
- **Audit artefacts (gitignored):**
  - `audit-output/content-1e/w-embed-sweep-inventory.json`
  - `audit-output/content-1e/pre-patch-snapshots/*.json` (79 files)
  - `audit-output/content-1e/render-coverage-check.md`
- **Phase:** MYGRATR-CONTENT-1E

## Content Migration — Blogs / Compare / Tech / Services / Stories (CONTENT-1C)
- **Description:** Third slice of the Webflow → Sanity content migration.
  246 items across 5 Sanity document types: `blogPost` (74 unique across
  7 source collections after dedup against the canonical
  `Blogs & Guides` master), `compareBlog` (30), `technology` (101),
  `service` (23), `customerStory` (18). The 6 sub-category blog
  collections were near-complete duplicates of `Blogs & Guides`;
  CONTENT-1C established the canonical-master + global-slug-set dedup
  pattern. Inline `<img>` tags in Webflow RichText now upload to real
  Sanity assets via the upgraded async `toPortableText()` two-pass walk
  (Pass 1 JSDOM-extract + `Promise.allSettled` upload; Pass 2
  htmlToBlocks with `<img>` and `<figure><img>` rules; iframe-in-figure
  / Vimeo embeds skipped). 29 hard-gate verification checks pass.
- **Page:** None (CLI scripts)
- **API Routes:** None
- **Lib Modules (extends CONTENT-1B):**
  - `src/lib/content/migration-helpers.ts` — `toPortableText` upgraded
    to async two-pass with inline image upload + null guard;
    `fetchOptionIdMap` and `resolveOption` lifted from per-script
    duplicates into shared exports; new `decodeHtmlEntities` for
    VideoLink URLs; `toRefs` validates every Webflow ref ID against
    `/^[a-f0-9]{24}$/i` before constructing `_ref` and uses the full
    Webflow ID as the deterministic `_key`.
  - `src/lib/content/migration-tracker.ts` — accepts an optional
    `parityBaselineCount` so cross-collection dedup rows record full
    `source_item_count` while parity is measured on the deduplicated
    set; vacuous success (denominator=0, migrated=0, no errors)
    yields 100.
  - `src/lib/content/ce-collection-ids.ts` — extended with 11
    CONTENT-1C collection IDs and a typed `CE_BLOG_COLLECTIONS`
    iteration array.
- **Scripts:**
  - `scripts/content/verify-content-1c-prereqs.ts` — pre-flight check:
    asserts `migrations.status = content_running` and that every
    required brief §2 slug is present on the union of fields across
    each of the 11 source collections.
  - `scripts/content/migrate-blog-posts.ts` — `blogPost` (74 unique
    across 7 source collections); canonical-master dedup pattern;
    7 `content_migrations` rows, one per source collection.
  - `scripts/content/migrate-compare-blogs.ts` — `compareBlog` (30);
    `tags-2` slug; competitor extracted via three explicit regex
    patterns; payload omits `category` field entirely.
  - `scripts/content/migrate-technology.ts` — `technology` (101,
    single pass — `associated-technologies` is 0% populated); brief
    §2.3 slug sweep applied verbatim; `focus-3-title` double-duty
    (fold-2 bullet 3 + fold-3 label) read once; 1 outlier handled
    with `folds: []` + `needsReview: true`.
  - `scripts/content/migrate-services.ts` — `service` (23);
    `fetchOptionIdMap` calls hoisted above the item loop;
    SERVICE_TYPE_MAP / PREFIX_MAP camelCase enums; `short-label`
    slug (NOT `short-description`); `fold-2---paragraph-2` (trailing
    `-2`); `associated-technologies` refs validated and resolved to
    `technology-{id}`.
  - `scripts/content/migrate-customer-stories.ts` — `customerStory`
    (18); brief §2.5 slug corrections (`name`→`companyName`,
    switch fields, VideoLink + `decodeHtmlEntities`, `the-` content
    prefixes, triple-dash quote slugs); problem/solution/impact
    packed independently — quote not gated on content presence.
  - `scripts/content/verify-content-1c.ts` — final verifier: 29
    hard-gate checks (Sanity counts excluding `smoke-test-*`,
    Supabase parity for 11 rows, blogPost slug uniqueness,
    `count(compareBlog && defined(category)) == 0`, reference
    integrity spot-checks, service type/prefix enums, shortLabel
    cross-check, inline image presence end-to-end, fold structure,
    customerStory packing).
- **DB Tables:** `content_migrations` (11 new rows: 7 blog source
  collections + compare-blogs + technology + services +
  customer-stories — all `status='complete'`, `parity_score=100`).
  No schema migrations.
- **Sanity Studio dataset:** 246 new CMS docs in `lzbhll1u/production`.
  Total CMS docs after this phase: 404.
- **Brief deviations vs live data:**
  - blogPost: 74 unique (brief expected 98 — based on raw collection
    sums; didn't account for master/sub-category duplication).
  - compareBlog: 30 (brief expected 29 — live API returned 30).
  - All deviations documented in PHASE_HISTORY.md and Step 7
    expected-count overrides.
- **Carryovers (CONTENT-1D scope):**
  - metaTitle / metaDescription backfill on technology (101),
    service (23), customerStory (18), teamMember (28), review (11 published;
    26 migrated CONTENT-1B, 15 deleted CONTENT-1D),
    bookACall (6) — ~202 fields total.
  - Image-asset uploads for `benefitValue.thumbnailImage` (9) and
    `staffBenefit.icon` (6) still on `webflowImageUrl` strings.
  - 1 `video.backupImage` CDN retry; 1 video URL with `&amp;`
    entity-encoded query string (run through `decodeHtmlEntities`).
  - `migrations.status = content_complete` transition.
- **npm scripts:** `npm run content:verify-1c-prereqs`,
  `content:migrate-blog-posts`, `content:migrate-compare-blogs`,
  `content:migrate-technology`, `content:migrate-services`,
  `content:migrate-customer-stories`, `content:verify-1c`
- **Phase:** MYGRATR-CONTENT-1C

## Content Migration — Reference-Light Collections (CONTENT-1B)
- **Description:** Second slice of the Webflow → Sanity content migration.
  105 items across 8 Sanity document types (`teamMember` 28, `review` 26,
  `video` 32, `bookACall` 6, `event` 1, `tool` 2, `download` 5,
  `downloadAccess` 5). Standalone collections + collections that
  reference only `tag` documents already migrated in CONTENT-1A. Image
  fields land as real Sanity assets via `uploadImage()` (no more
  staging URLs). Webflow RichText fields parse into Sanity Portable
  Text via JSDOM-injected `@sanity/block-tools`. Slug fix from this
  phase was retroactively applied to the 5 CONTENT-1A migrators.
- **Page:** None (CLI scripts)
- **API Routes:** None
- **Lib Modules (extends CONTENT-1A):**
  - `src/lib/content/migration-helpers.ts` — `toPortableText` (with
    JSDOM `parseHtml`), `extractUrl`, `uploadImage`, `toRefs`,
    `extractOption`, `webflowSlug`
  - `src/lib/content/ce-collection-ids.ts` — extended with 8 CONTENT-1B
    collection IDs
- **Scripts:**
  - `scripts/content/migrate-team-members.ts` — `teamMember` (28)
  - `scripts/content/migrate-reviews.ts` — `review` (26); Sanity
    `nameClient` ← Webflow `name-client`, drops Webflow `name`
  - `scripts/content/migrate-videos.ts` — `video` (32); resolves
    `type` and `team` Option fields via `fetchOptionIdMap()` →
    TYPE_MAP/TEAM_MAP camelCase
  - `scripts/content/migrate-book-a-call.ts` — `bookACall` (6); Webflow
    `title` → Sanity `metaDescription` (mislabelled in Webflow)
  - `scripts/content/migrate-events.ts` — `event` (1)
  - `scripts/content/migrate-tools.ts` — `tool` (2); strips API keys
    from Culture Match `hidden-code` (empirically also dropped by
    `htmlToBlocks` script-discard)
  - `scripts/content/migrate-downloads.ts` — `download` (5); reads
    Webflow `meta-thunbnail` (Webflow's typo) for `metaThumbnail`
  - `scripts/content/migrate-downloads-access.ts` — `downloadAccess` (5)
  - `scripts/content/verify-content-1b.ts` — final parity check;
    exits 0 when all 8 collections show `migrated == expected` and
    `status == 'complete'`
- **DB Tables:** `content_migrations` (8 new rows, all
  `status='complete'`, `parity_score=100`, `error_log=[]`)
- **Sanity Studio dataset:** 105 new CMS docs in `lzbhll1u/production`,
  plus retroactive slug backfill on the 53 CONTENT-1A docs
- **Dependencies added:** `@sanity/block-tools`, `@sanity/schema`,
  `jsdom`, `@types/jsdom`
- **Docs:** `CONVENTIONS.md §"Content Migration Conventions"` updated;
  `docs/WEBFLOW_TO_SANITY_FIELD_MAP.md` consulted (six of eight
  collections had brief / field-map mismatches against the live API,
  resolved by Jake decision 2026-04-28)
- **npm scripts:** `npm run content:migrate-team-members`,
  `content:migrate-reviews`, `content:migrate-videos`,
  `content:migrate-book-a-call`, `content:migrate-events`,
  `content:migrate-tools`, `content:migrate-downloads`,
  `content:migrate-downloads-access`, `content:verify-1b`
- **Phase:** MYGRATR-CONTENT-1B

## Content Migration — Flat Collections (CONTENT-1A)
- **Description:** First slice of the Webflow → Sanity content migration.
  Migrates 53 reference-free items across 5 Sanity document types
  (`tag`, `blogCategory`, `glassdoorReview`, `benefitValue`, `staffBenefit`)
  from 10 Webflow collections (6 tag collections consolidate per D2,
  hubs → blogCategory per D13, plus 3 single-mapping types). No cross-
  references, no fold structures, no portable text — those land in
  CONTENT-1B/C. Deterministic Sanity `_id`s of the form
  `{type}-{webflowId}` keep migrators idempotent.
- **Page:** None (CLI scripts)
- **API Routes:** None
- **Lib Modules:**
  - `src/lib/content/sanity-write-client.ts` — `@sanity/client` write client
  - `src/lib/content/webflow-read-client.ts` — paginated Webflow REST reader
  - `src/lib/content/migration-tracker.ts` — `recordMigration()` upsert into
    `content_migrations` keyed by `(org_id, migration_id, collection_slug)`
  - `src/lib/content/ce-collection-ids.ts` — CE-specific Webflow collection
    ID seed map (10 IDs in scope for CONTENT-1A)
- **Scripts:**
  - `scripts/content/start-content-phase.ts` — scaffold_complete →
    content_running transition (requires `--confirm`)
  - `scripts/content/migrate-tags.ts` — 6 collections → `tag` (22 items)
  - `scripts/content/migrate-blog-categories.ts` — hubs → `blogCategory` (6)
  - `scripts/content/migrate-glassdoor-reviews.ts` — `glassdoorReview` (10)
  - `scripts/content/migrate-benefit-values.ts` — `benefitValue` (9), with
    Webflow Option-field resolution via collection schema fetch
  - `scripts/content/migrate-staff-benefits.ts` — `staffBenefit` (6)
  - `scripts/content/verify-content-1a.ts` — final parity check; exits 0
    when all 5 collections show `migrated == expected` and
    `status == 'complete'`
- **DB Tables:** `content_migrations` (5 new rows, all
  `status='complete'`, `parity_score=100`, `error_log=[]`),
  `migrations` (status update to `content_running`). New unique
  constraint `content_migrations_org_migration_collection_unique` on
  `(org_id, migration_id, collection_slug)` added via Supabase SQL editor.
- **External systems:** Webflow REST API v2 (read), Sanity
  project `lzbhll1u` (write — 53 new CMS docs)
- **Docs:** `docs/WEBFLOW_TO_SANITY_FIELD_MAP.md` (authoritative field
  mapping consumed by every migrator)
- **npm scripts:** `npm run content:start`, `content:migrate-tags`,
  `content:migrate-blog-categories`, `content:migrate-glassdoor-reviews`,
  `content:migrate-benefit-values`, `content:migrate-staff-benefits`,
  `content:verify-1a`
- **Phase:** MYGRATR-CONTENT-1A

## Site Audit Agent
- **Description:** Produces the authoritative migration manifest for a source
  site — reconciles URLs from four sources, extracts content per page,
  classifies templates, inventories forms/scripts/assets/interactions, and
  writes the full manifest to Supabase. The output is the source-of-truth
  every downstream migration session depends on.
- **Page:** None (pipeline scripts, not UI)
- **API Routes:** None
- **Lib Modules:**
  - `scripts/audit/00-verify-inputs.ts` — pre-flight env + file checks
  - `scripts/audit/00-ahrefs-baseline.ts` — Ahrefs REST v3 SEO snapshot
  - `scripts/audit/01-reconcile-urls.ts` — URL reconciliation across 4 sources
  - `scripts/audit/02-screenshot-agent.ts` — Playwright 3-breakpoint capture
  - `scripts/audit/03-content-extractor.ts` — Firecrawl deep extraction
  - `scripts/audit/03b-field-population.ts` — Webflow field + locale diff
  - `scripts/audit/03c-global-components.ts` — nav/footer/Clara/Finsweet
  - `scripts/audit/03d-asset-manifest.ts` — CDN asset inventory
  - `scripts/audit/03e-template-custom-code.ts` — per-template script diff
  - `scripts/audit/04-interaction-inventory.ts` — tier-1 patterns + tier-2 Claude
  - `scripts/audit/05-script-inventory.ts` — 27-pattern script detector
  - `scripts/audit/06-forms-inventory.ts` — HubSpot Forms v2 API verify
  - `scripts/audit/07-template-classifier.ts` — rules + LLM hybrid
  - `scripts/audit/08-manifest-builder.ts` — assembles MigrationManifest
  - `scripts/audit/09-manifest-writer.ts` — upserts to Supabase
  - `scripts/audit/run-audit.ts` — orchestrator for Steps 00–3e
  - `scripts/audit/run-audit-chunk2.ts` — orchestrator for Steps 4–9
  - `scripts/audit/run-audit-chunk3.ts` — LLM refresh for 4, 7, 3e, 8, 9
- **DB Tables:** `audit_manifests` (write), `migrations` (update status)
- **External APIs:** Webflow v2, Firecrawl REST v1, Ahrefs REST v3,
  Anthropic (Opus 4.7), HubSpot Forms v2 + Automation v3, Playwright
- **Outputs:** `audit-output/ce-*.json`, `audit-output/pages/{slug}/*.json`,
  `audit-output/screenshots/{slug}/{bp}.png`
- **npm scripts:** `npm run audit:run`, `audit:chunk2`, `audit:chunk3`
- **Phase:** MYGRATR-AUDIT-1

## Content Migration — Meta Backfills + Carryover Fixes (CONTENT-1D)
- **Description:** Live-site meta backfill (`metaTitle` +
  `metaDescription`) for the 6 Tier-1 CMS doc types whose CONTENT-1A/B/C
  migrators left the fields null. Plus image carryovers from CONTENT-1A
  (benefitValue.thumbnailImage, staffBenefit.icon) and CONTENT-1B fixups
  (video.backupImage retry, mainVideoEmbedLink &amp; encoding).
  SCHEMA-1 smoke-test cleanup. State transition to `content_complete`.
  Three brief deviations applied with explicit per-doc guards: drift
  cleanup (16 deletions), bookACall metaDescription truncation (6
  patches), bookACall stale needsReview unset (6 unsets).
- **Lib Modules:**
  - `src/lib/content/url-builder.ts` — `urlForDoc({_type, slug})` switch
    over the 6 in-scope types using routes from
    `MYGRATR_SCHEMA_DESIGN_DECISIONS.md §10`
  - `src/lib/content/meta-scraper.ts` — Playwright `scrapeMeta` +
    `withBrowser` factory; 20s per-page timeout,
    `waitUntil: 'domcontentloaded'`, custom UA
  - `src/lib/content/meta-normaliser.ts` — `normaliseMeta` (brand-suffix
    strip + length compliance + split title/description warnings) +
    `truncateAtWord(s, max)` with F17 whitespace-prefix fallback
  - `src/lib/content/meta-backfill-runner.ts` — shared `runMetaBackfill`
    with FieldPolicy enum, pre-scrape hook, F1 abort gate, F4
    monotonic needsReview, F5 metaTitle-never-empty, F6 never-touch
    structural, F7 hook-before-URL, F8 truncation assertion, F13
    delay, F21 split provenance, hard/soft separation
  - `src/lib/content/migration-helpers.ts` (extended) —
    `deleteByIdStrict(client, id, expectedType)`
  - `src/lib/content/sanity-write-client.ts` (modified) — module-load
    assertion for `SANITY_MIGRATION_WRITE_TOKEN` presence + read-token
    absence
  - `src/lib/env.ts` (modified) — `SANITY_MIGRATION_WRITE_TOKEN` +
    `SANITY_API_READ_TOKEN` declarations + `ensureSanityMigrationWriteToken()`
- **Sanity Schemas (extended):**
  - `studio/schemas/_shared.ts` — new helpers
    `sourceTrackingFieldsCarryover()` (hidden source/generatedAt, NOT
    required) + `metaSourceFields()` (split provenance pair)
  - `studio/schemas/documents/{customer-story,team-member,review,book-a-call}.ts` —
    add carryover §7.2 + provenance pair
  - `studio/schemas/documents/{technology,service}.ts` — add provenance
    pair only (already had §7.2)
- **Zod Twins (extended):**
  - `src/types/sanity/shared.ts` — new `MetaSourceFieldsSchema` +
    `SourceTrackingFieldsCarryoverSchema`
  - `src/types/sanity/documents/{customer-story,team-member,review,book-a-call,technology,service}.ts`
- **Scripts (executed):**
  - `scripts/content/verify-content-1d-prereqs.ts` — 32-check pre-flight
  - `scripts/content/test-url-builder.ts` — two-tier (HARD known-good
    + INFO coverage) URL assertion
  - `scripts/content/migrate-meta-{technology,service,customer-story,team-member,review,book-a-call}.ts`
  - `scripts/content/migrate-{benefit-value-thumbnails,staff-benefit-icons,video-backup-image-retry}.ts`
  - `scripts/content/fix-video-embed-link-encoding.ts`
  - `scripts/content/cleanup-smoke-test-docs.ts` (5-doc scope per
    Decision B)
  - `scripts/content/cleanup-drift-docs.ts` (16 deletions, DEV-3)
  - `scripts/content/truncate-bookacall-metadescription.ts` (DEV-4)
  - `scripts/content/unset-bookacall-stale-needsreview.ts` (DEV-5)
  - `scripts/content/verify-content-1d.ts` +
    `scripts/content/run-verify-content-1d.ts` (verifier-throws
    pattern, F2)
  - `scripts/content/complete-content-phase.ts` (state transition;
    NO try/catch around verifier per F2)
- **Read-only diagnostics (reusable for customer 2+):**
  - `scripts/content/inspect-smoke-test-state.ts`
  - `scripts/content/inspect-validation-issues.ts`
  - `scripts/content/diag-1d-canonical-cross-check.ts`
  - `scripts/content/diag-2-1d-inbound-refs.ts`
  - `scripts/content/diag-3-1d-bookacall-truncation-preview.ts`
  - `scripts/content/diag-4-1d-runner-bug-postmortem.ts`
  - `scripts/content/diag-5-1d-builder-orphan-check.ts`
- **DB Tables:** `content_migrations` (14 new rows for CONTENT-1D —
  6 meta backfill + 4 carryover + 1 cleanup + 3 deviation), `migrations`
  (update status to `content_complete` + populate
  `metadata.content_phase`)
- **External APIs:** Playwright (Chromium headless), Sanity HTTP API
  (write client only, single-dataset scope)
- **npm scripts:** `content:verify-1d-prereqs`, `content:test-url-builder`,
  `content:migrate-meta-technology`, `content:migrate-meta-service`,
  `content:migrate-meta-customer-story`, `content:migrate-meta-team-member`,
  `content:migrate-meta-review`, `content:migrate-meta-book-a-call`,
  `content:migrate-benefit-value-thumbnails`,
  `content:migrate-staff-benefit-icons`,
  `content:migrate-video-backup-image-retry`,
  `content:fix-video-embed-link-encoding`,
  `content:cleanup-smoke-test-docs`, `content:cleanup-drift-docs`,
  `content:truncate-bookacall-metadescription`,
  `content:unset-bookacall-stale-needsreview`, `content:verify-1d`,
  `content:complete`
- **Phase:** MYGRATR-CONTENT-1D

## Content Migration — Migrator-Pattern Cleanup (CONTENT-1D-CLEANUP)
- **Description:** Post-phase patch on closed CONTENT-1D
  (`migrations.status` stayed `content_complete` throughout).
  Tech Debt #14 RESOLVED. Surfaced + fixed the migrator-pattern bug
  where `uploadImage()` returned null when the Webflow source field
  was empty and the CONTENT-1A/1B/1C migrators wrote that null
  literal directly into the doc rather than omitting via conditional
  spread; Studio's strict validation flagged every such doc with
  "Invalid property value". 158 top-level + 100 nested null-literal
  unsets across `service`, `technology`, `customerStory`. 4
  audit-trail rows added to `content_migrations` (CE total 38 → 42).
  Brief Deviation DEV-6.
- **Lib Modules:** none new. Reuses existing
  `src/lib/content/sanity-write-client.ts`,
  `src/lib/content/migration-tracker.ts`,
  `src/lib/content/migration-helpers.ts`.
- **Scripts (executed):**
  - `scripts/content/cleanup-service-null-thumbnail.ts` — Op A;
    23 service docs; per-doc literal-null guard; surgical
    `.unset(['thumbnail'])`.
  - `scripts/content/cleanup-technology-null-image-fields.ts` — Op B;
    101 technology docs; atomic per-doc patch covering 1–2 fields
    (thumbnail always; techLogo on 2 hardcoded `_id`s).
  - `scripts/content/cleanup-technology-null-folds-featured-image.ts` —
    Op C; path-patch primitive
    (`folds[_key=="..."].featuredImage`) on 100 docs.
  - `scripts/content/cleanup-customerstory-null-image-fields.ts` —
    Op D; 17 customerStory docs; atomic per-doc patch covering 1–3
    fields. EXPLICITLY OUT of scope: `companyLogo` (deferred per
    Tech Debt #16 — Travel Tech Client anonymised customer; schema-
    side fix expected).
- **Read-only diagnostics + probe (reusable for customer 2+):**
  - `scripts/content/diag-tech-debt-14-service-nulls.ts` — service
    null-image scan (initial Tech Debt #14 investigation).
  - `scripts/content/diag-1d-cleanup-scope.ts` — generalised
    null-literal scope check across `service` / `technology` /
    `customerStory`. Distinguishes "null literal stored" from "field
    absent" via direct `getDocument` key inspection (GROQ projection
    conflates both). Cross-references `audit-output/ce-field-population.json`.
    Also serves as post-cleanup re-verification.
  - `scripts/content/probe-path-patch-syntax.ts` — read-only probe
    that constructs `client.patch(id).unset(['folds[_key=="..."].featuredImage'])`,
    calls `PatchBuilder.toJSON()` to inspect the serialised payload,
    and validates Sanity's path syntax acceptance before any
    destructive use.
- **DB Tables:** `content_migrations` — 4 new audit-trail rows
  (`service-null-thumbnail-unset`,
  `technology-null-image-fields-unset`,
  `technology-null-folds-featured-image-unset`,
  `customer-story-null-image-fields-unset`). `migrations` —
  unchanged (post-phase patch on closed phase).
- **External APIs:** Sanity HTTP API (migration write client only;
  least-privilege single-dataset token).
- **npm scripts:** `content:probe-path-patch-syntax`,
  `content:cleanup-service-null-thumbnail`,
  `content:cleanup-technology-null-image-fields`,
  `content:cleanup-technology-null-folds-featured-image`,
  `content:cleanup-customerstory-null-image-fields`.
- **Patterns established (CONVENTIONS.md):**
  - **Migrator Field-Write Pattern — Conditional Spread** —
    migrators that read optional source fields MUST omit the field
    via conditional spread; never write null literal. Worst-offender
    found in `migrate-customer-stories.ts:143`
    (`openGraphImage: null` for every doc).
  - **Path-Patch Primitive for Nested Array-of-Object Fields** —
    `_key`-addressed unset shape; validate `_key` is non-empty
    string before constructing path; probe with `PatchBuilder.toJSON()`
    before destructive use; atomic per-doc patch with all paths.
  - **Floor-check (`>=`) for `content_migrations` row count in the
    verifier** — post-phase patches add rows without breaking the
    verifier; the membership-set check still hard-asserts every
    in-phase row by exact slug.
- **Halt-on-first-guard-failure (phase-wide):** a literal-null
  assertion mismatch on any doc in any cleanup op fires
  `process.exit(1)` and skips subsequent ops; recovery is "re-run
  from scratch" not "continue past failure".
- **Deferred items tracked in CLAUDE.md Tech Debt:**
  - **#16** customerStory.companyLogo on Travel Tech Client
    (anonymised real customer; schema-side fix direction logged).
  - **#17** 10 other doc types with image fields not yet scanned;
    closure scan defined as extending `diag-1d-cleanup-scope.ts`.
- **Phase:** MYGRATR-CONTENT-1D-CLEANUP

## Design System Primitives + Icon System (Step 2 milestone)

- **Description:** 22 brand-inventory primitives + Icon foundation
  shipped as the consumable component library for Step 4 template
  authors. Hand-built atop @radix-ui directly (no shadcn). CVA
  standardised for variant API; no-className-variants rule; folder-
  per-primitive structure (`site/src/components/ui/{name}/index.tsx`).
  GSAP banned from primitives (CSS transitions only). 9-glyph SVG
  sprite for icons (no lucide-react / Material Symbols), served from
  `/icons/sprite.svg`. Layout-root providers (TooltipProvider +
  ToastProvider) mount once at `app/layout.tsx`. C5 FormField smart
  wrapper auto-handles ids + aria + error reading via
  `useFormContext()`.
- **Components:**
  - **A. Foundation:** Button, Link, Tag, Card, Accordion, Marquee
  - **B. Typography:** Heading, Text, PortableText
  - **C. Forms:** Input, Textarea, Select, Checkbox, RadioGroup,
    FormField, HubSpotFormEmbed
  - **D. Overlays:** Dialog, Tooltip, DropdownMenu, Toast
  - **E. Media + Layout:** Image, VideoEmbed, Container, Divider
  - **Foundation:** Icon (sprite-based)
- **Files (created):**
  - `site/src/components/ui/{22 primitives}/index.tsx`
  - `site/src/components/ui/icon/index.tsx`
  - `site/src/components/ui/_icons/icon-names.ts` (typed `IconName`
    union)
  - `site/src/components/ui/_icons/sprite.svg` (source-of-truth)
  - `site/src/components/ui/_utils/cn.ts` (clsx + tailwind-merge)
  - `site/public/icons/sprite.svg` (emitted via
    `scripts/design/emit-icon-sprite.mjs`)
- **Files (modified):**
  - `site/src/app/tokens.css` (DEV-13/14/20/24 amendments)
  - `site/src/app/layout.tsx` (TooltipProvider + ToastProvider mount)
  - `site/src/lib/env.ts` (DEV-23 amendment)
  - `site/src/components/ui/accordion/index.tsx` (HALT 10 fix —
    chevron → plus/× pattern; commit `4c0514f`)
- **Demo route:**
  - `site/src/app/demo/page.tsx` — production-guarded kitchen-sink
    rendering all 22 primitives + ~200+ mutation cases on one page
- **Probe scripts (`scripts/design/probe-*.mjs` × 21):**
  - `accordion-chevron`, `accordion-marquee-styles`,
    `blockquote-mobile`, `blockquote-styles`, `button-styles`,
    `card-styles`, `checkbox-radio-textarea`, `container-styles`,
    `divider-styles`, `eyebrow-styles`, `heading-styles`,
    `hubspot-embed`, `hubspot-mounted-dom`, `icon-inventory`,
    `image-quality`, `image-styles`, `input-styles`,
    `link-tag-styles`, `richtext-styles`, `text-styles`,
    `video-embeds`. Each emits a JSON file under
    `audit-output/design-1/` consumed by per-primitive source
    comments.
- **Sprite generation scripts:**
  - `scripts/design/build-icon-sprite.mjs`,
    `scripts/design/emit-icon-sprite.mjs`,
    `scripts/design/refetch-full-svgs.mjs`,
    `scripts/design/check-probe-doc-cleanup.mjs`
- **Sanity image-builder verify:**
  - `scripts/design/verify-sanity-image-builder.mjs`
- **Patterns established (CONVENTIONS.md):**
  - **Token System Pattern** — Tailwind v4 CSS-first; multi-namespace
    probe required; dual-consumer pattern for tokens read by both
    Tailwind utilities and GSAP; raw-value rule with two narrow
    exceptions (Tailwind arbitrary values for one-off colours; inline
    style for one-off easing).
  - **Primitive Component Pattern** — 10 categorical patterns
    (hand-built atop Radix without shadcn; CVA variant API;
    no-className-variants rule; SVG sprite icons; GSAP-banned;
    probe-first; folder-per-primitive; inline source-comment as
    spec; layout-root provider mount; register-vs-Controller form
    split). Full enumeration in `docs/CAPABILITY_LOG.md`.
  - **HALT-Discipline Pattern** — 4 patterns captured at HALT 10
    (probe-first dismissal protocol; HALT 10 visual eyeball as
    last-line defense; browser cache trap; demo-route width as
    layout-context observation, not primitive bug).
- **Reference docs:**
  - `docs/design/COMPONENTS.md` (806 lines) — single-source primitive
    inventory; one row per primitive with path, type, deps, variants,
    migration improvement, usage notes.
  - `docs/design/TOKENS.md` — per-token catalogue + provenance.
  - `docs/CAPABILITY_LOG.md` (NEW) — productisation IP framing per
    pattern.
- **Phase:** MYGRATR-DESIGN-1 (Step 2 milestone; Steps 3–11 pending)

## Tier-1 Component Specs (Step 3 milestone)

- **Description:** 5 complex-component 8-section specs covering the Tier-1
  inventory locked at HALT 1 (1 High + 3 Medium + 1 Low). These specs are
  the contract for TEMPLATE-* phases — first-draft implementations ship
  against the spec, not against "make it like CE's site." Per-spec captures
  (screenshots + recordings) populate during TEMPLATE-* drafting; capture-
  asset directory skeleton ready.
- **Tier-1 inventory (locked v1.0):**
  - **#1 Section fade-reveal cascade** — GLOBAL render utility (sitewide
    on 14 templates); GSAP attribute-selector orchestration via
    `[fade-animation]` (parent-with-children-stagger) and
    `[cms-fade-animation]` (single-element-no-stagger). High complexity.
  - **#2 Hero scale-in animation** — HOME (`/`); GSAP fromTo single
    property (scale 1.2→1, duration 1.5s, power2.out). Medium.
  - **#3 Sticky nav transition** — GLOBAL; GSAP ScrollTrigger driven by
    `.cc-hero` + plain JS handler for mobile menu toggle. Medium.
  - **#4 Testimonial Swiper carousel** — GLOBAL (HOME, /reviews, /services);
    Swiper 11 with autoplay 6s + bullet pagination + loop. Medium.
  - **#5 Service card-grid hover-reveal** — SERVICE landing (`/services`);
    pure CSS hover transitions (translateY -16px + shadow + padding-left
    grow + arrow swap). Low (down-classified from Medium at HALT 1 L3).
- **Files (created):**
  - `docs/design/TIER_1_INVENTORY.md` (locked v1.0)
  - `docs/design/components/section-fade-reveal-global.md`
  - `docs/design/components/home-hero-scale-in.md`
  - `docs/design/components/nav-sticky-transition-global.md`
  - `docs/design/components/testimonial-swiper-global.md`
  - `docs/design/components/service-card-grid-hover-reveal.md`
- **Capture-asset directories (skeleton):**
  - `docs/design/components/_assets/{slug}/{screenshots,recordings}/`
    (5 component dirs × 2 leaf dirs = 10 leaf dirs; populated during
    TEMPLATE-*)
- **Patterns established (CONVENTIONS.md):**
  - **Tier-1 Component Spec Pattern** — 8-section mandatory format;
    verifier asserts at Step 10
  - **5 §4 Timing Provenance Shapes** — library-mediated, GSAP-clean,
    GSAP-mixed, CSS-only, GSAP-attribute-selector orchestration
  - **Render-Utility Classification** — third component category
    alongside primitive (Step 2) and Tier-1 component
  - **Path A Mechanical Trigger** — §6 GROQ-mandate gating on "does this
    component touch Sanity data?"
  - **Brief-vs-Reality Finding** — parallel discipline to
    schema-vs-reality; structural rule wins over brief literal
- **Schema-vs-reality findings:** 9 total across 5 specs
  (1 schema-relax → STATIC-1/SCHEMA-2; 4 template-fallback; 1 N/A
  render-discipline; 3 decision-needed of which 1 resolved at HALT 3,
  2 deferred per phase pin)
- **Deferred Tech Debt (log at Step 11 DESIGN-1 close):**
  - Sibling `.swiper.testimonies` variant on `/reviews` → TEMPLATE-REVIEW
  - `service.folds[0].subhead` description-preview projection accuracy
    → TEMPLATE-SERVICE
- **Reference docs:**
  - `docs/CAPABILITY_LOG.md` — Step 3 productisation IP consolidated
    (Tier-1 audit lessons + 5 timing provenance shapes + render-utility
    classification + Path A mechanical trigger + brief-vs-reality
    finding)
  - `docs/briefs/active/MYGRATR-DESIGN-1-STEP-3_BRIEF_v1.1.md` — phase
    brief
- **Phase:** MYGRATR-DESIGN-1 (Step 3 milestone; Steps 4–11 pending)

## Storybook Scaffold (Step 4 milestone)

- **Description:** 30 stories on disk — 25 primitive (Pair-rule: one
  `stories.tsx` per primitive folder under `site/src/components/ui/`)
  plus 5 Tier-1 scaffold-stage previews under
  `site/src/components/tier-1/`. Storybook 10.3.6 running
  `@storybook/nextjs` with webpack5 forced per Brief A v1.2 D2 lock
  (`@storybook/nextjs-vite` deferred until upstream
  `storybookjs/storybook#34688` closes — logged as new Tech Debt at
  Brief A close). Tier-1 stories ship as primitive-composition previews
  per Hard Rule #7 — primitives from each spec's §3 Tech stack composed
  with §6-shaped mock data + visible `<ScaffoldNote>` panel; NO library
  wiring (no `gsap`, no `swiper` init, no working `ScrollTrigger`, no
  autoplay) until TEMPLATE-* time.
- **Files (created):**
  - `site/.storybook/main.ts` (22 lines including HALT 1 env config)
  - `site/.storybook/preview.tsx` (26 lines; imports `globals.css` for
    Tailwind v4 utility availability)
  - `site/src/components/ui/{primitive}/stories.tsx` (×25 across all
    primitive folders — Pair-rule)
  - `site/src/components/tier-1/{slug}.stories.tsx` (×5: home-hero-
    scale-in, nav-sticky-transition-global, section-fade-reveal-global,
    service-card-grid-hover-reveal, testimonial-swiper-global)
  - `docs/design/storybook-deploy.md` (157 lines — customer-2 Vercel
    deploy runbook)
- **Files (modified):**
  - `site/.gitignore` (`*storybook.log` + `storybook-static`)
  - `site/eslint.config.mjs` (`eslint-plugin-storybook` flat-config
    integration)
  - `site/package.json` (`storybook` + `build-storybook` scripts;
    7 devDeps incl. prop-types §4.0 workaround)
  - `site/package-lock.json` (mechanical lockfile for new Storybook
    10.3.6 deps)
  - `CONVENTIONS.md` (+72 lines: "Storybook Story Pattern" section
    before §4 Phase History)
  - `docs/CAPABILITY_LOG.md` (Step 4 consolidation +
    customer-2 reusability matrix rows)
- **Vercel deploy:** `https://mygratr-cloud-employee-storybook.vercel.app`
  on a separate Vercel project. Framework Preset `Other` (NOT Next.js
  — `next build` would replace `storybook build`). Root Directory `site`.
  Build Command `npm run build-storybook`. Output Directory
  `storybook-static`. Standard Deployment Protection enabled.
- **HALT 1 env-vars bug + fix:** First deploy surfaced `TypeError:
  Cannot read properties of undefined (reading 'cn')` on 3 Tier-1
  stories (Image importers) and `ReferenceError: Cannot access
  '__WEBPACK_DEFAULT_EXPORT__' before initialization` on Image's own
  story. Root cause: `@storybook/nextjs` does NOT auto-pass-through
  `NEXT_PUBLIC_*` env vars to webpack DefinePlugin — semantic divergence
  from Next.js conventions despite the framework name. Fix:
  `env: (config) => ({...config, NEXT_PUBLIC_SANITY_PROJECT_ID:
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? '',
  NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET
  ?? '' })` config function in `.storybook/main.ts`.
- **Patterns established (CONVENTIONS.md):**
  - **Storybook Story Pattern** (72-line section) — Pair-rule per
    folder; primitive + Tier-1 story shapes (incl. Hard Rule #7
    scaffold-stage rule); mock-data discipline (Hard Rule #1 exception
    scoped to story files); render-only-over-args lock; env-vars
    gotcha + canonical fix shape; Pair-rule mechanical check
    (`find site/src/components/ui -mindepth 2 -name stories.tsx | wc -l`).
- **Brief-vs-Reality findings (Brief A Step 4):** 9 findings logged
  during Step 4 (vs zero at Step 5 — validates BvR-velocity-as-brief-
  quality-metric Pattern 13). Three cross-cutting brief-drafter
  mental-model gaps: non-interactive CLI flags for automation;
  CI/CD-aware commit ordering; build-vs-runtime correctness for any
  schema-validated module load.
- **Reference docs:**
  - `docs/design/storybook-deploy.md` — customer-2 Vercel deploy
    runbook (Framework Preset checklist + env-vars requirement +
    Standard Protection + customer-2 reusability notes)
  - `docs/CAPABILITY_LOG.md` — 13 Storybook-setup productisation IP
    patterns consolidated at Step 4 close
  - `docs/briefs/active/MYGRATR-DESIGN-1-BRIEF-A_v1.2.md` — phase brief
- **Phase:** MYGRATR-DESIGN-1 (Step 4 milestone — Brief A close;
  Steps 5+ pending at time of Step 4)

## v0.dev Prompt Template (Step 5 milestone)

- **Description:** Canonical v0.dev prompt template for TEMPLATE-*
  phases. 6-section format from v2.0 brief §Step 5: Design system
  constraints / Primitive components available / Visual reference /
  Sanity data shape / Constraints / Output format. Sections 1, 2, 5, 6
  paste-as-is per template; Sections 3, 4 per-template fill-in.
  Storybook URL cross-referenced in Section 2 as live primitive-shape
  reference. 3 worked examples on disk demonstrate shape variation
  (detail-page-by-slug vs listing-page-no-slug query; full-meta vs
  no-OG-image meta).
- **Files (created):**
  - `docs/V0_PROMPT_TEMPLATE.md` (406 lines — 6-section format)
  - `docs/templates/_examples/v0-prompt-blog.md` (168 lines — `blogPost`
    detail page `/blog/{slug}`; 74 docs)
  - `docs/templates/_examples/v0-prompt-team-member.md` (166 lines —
    `teamMember` detail page `/team/{slug}`; 28 docs)
  - `docs/templates/_examples/v0-prompt-review.md` (224 lines —
    `review` listing page `/reviews`; **11 published docs** today — 26
    migrated CONTENT-1B, 15 deleted CONTENT-1D drift cleanup)
- **REVIEW example schema-vs-reality carry-forward:** Per Brief A v1.2
  §5.2 mandate, the REVIEW worked example carries forward both
  schema-vs-reality findings from
  `docs/design/components/testimonial-swiper-global.md` (5-star rating
  field deferred to STATIC-1 / SCHEMA-2; sibling `.swiper.testimonies`
  variant decision deferred to TEMPLATE-REVIEW).
- **Patterns established (CAPABILITY_LOG.md):** 6 v0.dev-template
  productisation IP patterns at Step 5 close — 6-section paste-as-is
  vs fill-in split; self-explaining placeholder discipline (HALT 2
  lesson); worked-example-as-clarification pattern; schema-vs-reality
  findings carried into example bodies; Storybook URL as Section 2
  cross-reference; per-doc-type variation surfaced via worked examples
  (canonical stays universal).
- **HALT 2 clarifications applied:** Section 3 placeholder block
  replaced with self-explaining REFERENCE-doc workflow (no roadmap-
  leaky "TBD-pending-Step-7" references); Section 4 schema placeholder
  renamed to `PLACEHOLDER_REPLACE_ME_Schema` to prevent accidental
  copy-paste.
- **Reference docs:**
  - `docs/V0_PROMPT_TEMPLATE.md` — canonical template
  - `docs/templates/_examples/` — 3 worked examples
  - `docs/CAPABILITY_LOG.md` — 6 v0.dev-template productisation IP
    patterns
  - `docs/briefs/active/MYGRATR-DESIGN-1-BRIEF-A_v1.2.md` — phase brief
- **Phase:** MYGRATR-DESIGN-1 (Step 5 milestone — Brief A close;
  Steps 6+ pending at time of Step 5)

## UI_STRINGS Lint Rule + Canonical SoT (Step 6 milestone)

- **Description:** Two-rule chrome-string discipline enforcing the
  `UI_STRINGS` canonical map. Upstream `react/jsx-no-literals` (from
  `eslint-plugin-react@7.37.5`) with `noStrings: true` +
  `allowedStrings` + `ignoreProps` covers most JSX text. Project-local
  `local/no-conditional-strings-in-jsx` covers the upstream
  `ConditionalExpression` branch gap surfaced in §6.4. 9 exemption
  file patterns (Storybook stories Pair-rule + flat-file, tests,
  demo route, Next.js framework templates, vendor SDK init, generated
  `ui-strings.ts` itself). Canonical SoT at
  `tools/eslint/ui-strings.json` (14 keys + `_meta` provenance);
  byte-idempotent generator emits do-not-edit `site/src/lib/ui-strings.ts`.
- **Files (created):**
  - `tools/eslint/ui-strings.json` (canonical SoT — 14 keys with
    `_meta` provenance block)
  - `tools/eslint/rules/no-conditional-strings-in-jsx.js` (~65 lines —
    project-local custom rule)
  - `tools/eslint/plugin-local.js` (plugin wrapper, `local/` namespace)
  - `tools/eslint/__tests__/ui-strings.test.mjs` (8-fixture
    `Linter.verify` AST-coverage harness)
  - `scripts/design/generate-ui-strings.mjs` (byte-idempotent JSON → TS
    generator)
  - `scripts/design/probe-ui-strings-reality.mjs` (one-shot §6.0a
    seed-list provenance script — archived after use)
  - `site/src/lib/ui-strings.ts` (generated, do-not-edit; 21 lines)
- **Files (modified):**
  - `package.json` (+`generate-ui-strings` script)
  - `site/eslint.config.mjs` (+62 lines: rule registration,
    9 exemption globs, plugin import)
  - `site/src/app/page.tsx` + `site/src/app/uk/page.tsx` (4 SCAFFOLD-1
    comment-disables with TEMPLATE-HOME reference)
  - `site/src/components/ui/hubspot-form-embed/index.tsx` (3 strings
    migrated to UI_STRINGS — `form.loading` + `form.error.loadFailed`
    with placeholder-as-split-template pattern)
  - `CONVENTIONS.md` (+212 lines: "UI_STRINGS Rule (post-DESIGN-1
    Brief B)" section)
- **2 new UI_STRINGS keys:** `form.loading`, `form.error.loadFailed`
  (added during §6.3 codebase fixes; total key count now 14).
- **AST coverage verification:** 8-fixture harness — F7a regression-
  catch for the upstream `ConditionalExpression` branch gap; F7b
  verifies the custom rule. Uses `Linter.verify` directly because
  ESLint 9 `RuleTester` silently no-ops on plugin-namespaced rules
  (logged as BvR #26 for HALT 3 capability-log consolidation).
- **Patterns established (CONVENTIONS.md):**
  - **UI_STRINGS Rule (post-DESIGN-1 Brief B)** (212-line section) —
    both rules, 5-path violation triage, exemption table, naming
    convention table, test infrastructure, generator discipline.
    Productisation IP consolidation into `docs/CAPABILITY_LOG.md`
    deferred to HALT 3 (Brief B close) per Brief B v1.3 protocol.
- **Brief-vs-Reality findings (gitignored draft, consolidates at
  HALT 3):** BvR #23 (§6.1.1 tsc CLI shape), BvR #24 (D3 exemption
  glob mismatch with Brief A Pair-rule), BvR #25 (`storybook-static/**`
  missing from `globalIgnores`), BvR #26 (ESLint 9 RuleTester
  plugin-namespace silent failure). 3 productisation IP patterns
  staged for HALT 3 consolidation: placeholder-as-split-template,
  two-gate ESLint rule verification, narrow custom-rule supplement.
- **Lint state at HALT 1 close:** 25 problems (9 errors + 16
  warnings), all pre-existing rules outside Brief B scope —
  5 `react/no-unescaped-entities` in `demo/_demo-client.tsx`,
  2 `react-hooks/set-state-in-effect` in `hubspot-form-embed/index.tsx`,
  2 `@typescript-eslint/no-empty-object-type` in `input`/`textarea`,
  16 warnings (flagged for HALT 3 tech debt log). Zero
  `react/jsx-no-literals` or `local/no-conditional-strings-in-jsx`
  violations. `tsc --noEmit` clean.
- **Reference docs:**
  - `tools/eslint/ui-strings.json` — canonical SoT
  - `CONVENTIONS.md` §"UI_STRINGS Rule (post-DESIGN-1 Brief B)"
  - `docs/briefs/active/MYGRATR-DESIGN-1-BRIEF-B_v1.3.md` §6 — phase
    brief
- **Phase:** MYGRATR-DESIGN-1 (Step 6 milestone — Brief B HALT 1
  close; Steps 7, 8, 9, 10, 11 pending)

## Visual Editing Wiring + Draft-Mode Route Hardening (Step 8 milestone)

- **Description:** Single-client Sanity architecture + hardened
  `/api/draft-mode/{enable,disable}` routes + `defineLive` with
  viewer-scoped `serverToken` + strict zod env schema. Replaces
  SCAFFOLD-1's two-client baseline (`sanityClient` + `previewClient`)
  with a single `sanityClient` export per CMA-C2 + D4. Six-step
  security-ordered handler on enable (GET) per CMA F-2 v1.3; dual
  Origin+Referer check on disable (POST) per CMA F-3 Option A v1.3.
  BvR #34 dev-only allow-list expansion (canonical-vs-serving-origin
  split) + BvR #35 null-origin escape hatch (Sanity Presentation
  strips both headers — null/null gated on 3-query-param signature
  via `hasSanityPreviewSignature` helper) + BvR #36 STEP 4 defense-
  in-depth posture (library API doesn't expose off-origin
  `redirectTo`).
- **Files (modified):**
  - `site/src/lib/env.ts` (47 lines — §8.1 D14 strictness: `.url()`
    / `.min(1)` / conditional required-in-prod `.refine()`)
  - `site/src/lib/sanity/client.ts` (96 lines — single-client
    collapse; stega gating per F2/F4/F15/I5)
  - `site/src/lib/sanity/live.ts` (17 lines — `defineLive({ client,
    serverToken })` with viewer-scoped token per CMA-C2)
  - `site/src/app/api/draft-mode/enable/route.ts` (241 lines —
    6-step security order + module-scope `previewValidationClient`
    + BvR #34 NODE_ENV-gated dev expansion + BvR #35 null-origin
    escape hatch via `hasSanityPreviewSignature`)
  - `site/src/app/api/draft-mode/disable/route.ts` (75 lines —
    GET → POST + dual Origin+Referer check + BvR #34 dev expansion)
  - `CONVENTIONS.md` (+346 lines cumulative across HALTs — Entry 3
    rewrite "Draft-Mode Route Hardening" + Entries 2/4/5 NEW
    "Sanity Fetch Pattern" / "Env Schema Strictness" / "Visual
    Editing Method Probe Discipline")
  - `docs/context/REGISTRY.md` (+4 lines at HALT 2 — API routes
    table updated for enable + disable)
  - `docs/CAPABILITY_LOG.md` (+243 lines at HALT 3 — DESIGN-1 H2
    extended with 18 productisation patterns + Customer-2
    reusability matrix extension)
  - `CLAUDE.md` (+25 lines at HALT 3 — Current Phase, phase table,
    design system state, Tech Debt #18/#19/#20, footer)
- **File-local helpers (introduced):**
  - `safeUrlOrigin(url: string): string | null` — try/catch wrap of
    `new URL().origin`; used for Referer parsing + BvR #34 dev
    expansion. Defined module-scope in both route files.
  - `hasSanityPreviewSignature(url: string, origin: string | null,
    referer: string | null): boolean` — 3-param helper gating the
    BvR #35 null-origin escape hatch on Sanity's canonical
    3-query-param signature (`sanity-preview-secret` +
    `sanity-preview-perspective` + `sanity-preview-pathname`).
    Sanity-specific by design; future CMS swap requires renaming
    the helper + signature constants.
- **API Routes (hardened — supersedes SCAFFOLD-1 baseline):**
  - `/api/draft-mode/enable` (GET) — 6 invariant steps: allow-list
    build (F8 literal-`"null"` + empty-string guard + F-1 fail-
    closed-on-malformed-env + BvR #34 dev expansion) → Origin/
    Referer check (with BvR #35 null-origin escape hatch via
    `hasSanityPreviewSignature`) → preview-url-secret validation
    (F-6 try/catch + F7 no-Sentry-leak comment) → `redirectTo`
    same-origin check (defense-in-depth per BvR #36) →
    `draftMode().enable()` → same-origin redirect (Next.js 307).
  - `/api/draft-mode/disable` (POST) — dual Origin AND Referer
    check (NOT OR); F11 v2.1 acknowledged trade-off captured as
    Tech Debt #18 for TEMPLATE-* (disable-button page must set
    `Referrer-Policy: strict-origin-when-cross-origin` or stricter).
- **Env vars (retasked / tightened):**
  - `NEXT_PUBLIC_SITE_URL` — `.catch()` fallback stripped →
    `z.string().url()`. URL semantics enforced at validation time.
  - `NEXT_PUBLIC_SANITY_STUDIO_URL` — NEW; required in production +
    preview, optional in development (F5 v2.1 conditional `.refine()`).
  - `SANITY_API_READ_TOKEN` — `.optional().default('')` →
    `z.string().min(1)`. Retasked from SCAFFOLD-1's `previewClient`
    role to `defineLive` `serverToken` slot (same env var, new
    architectural position per CMA-C2).
- **Studio change:** `studio/sanity.config.ts` unchanged at Step 8
  (already wired in SCAFFOLD-1); HALT 2 §8.5 confirmed Sanity
  Presentation tool wires both `previewMode.enable` AND
  `draftMode.enable` to the same `/api/draft-mode/enable` route —
  uniform auth barriers serve both flows (BvR #33 v2.2).
- **Mandatory probes (HALT 2 — all PASS, artifacts gitignored per
  D15):**
  - `audit-output/design-1/draft-read-probe.md` — §8.0a Step 2
    viewer-token reads drafts.** slice (F3 v2.1)
  - §8.0a Step 3 previewSecret-read (F9 v2.1) — null result on
    fresh project (expected)
  - §8.1.5 createClient stega-with-undefined-studioUrl probe (F4
    v2.1) — confirmed THROWS empirically; dispatched §8.3.2 code
    path gating `stega.enabled` on env presence
  - §8.3.0 / §8.3.N pre/post-refactor symbol+path greps (F10 v2.1)
- **Smoke + integration test artifacts (HALT 3 — gitignored per
  D15):**
  - `audit-output/design-1/visual-editing-method-probe.md` — §8.4
    GET-vs-POST method probe (CMA F-1 v1.3 contract confirmation)
  - `audit-output/design-1/visual-editing-smoke-test.md` — §8.7
    manual round-trip PASS + 10-test integration matrix (9 of 10
    PASS: a/b/d.1-4/d.5a/b/e; test (c) STEP 4 NOT EXERCISABLE per
    BvR #36, Tech Debt #20)
- **Patterns established (CONVENTIONS.md — 4 sections cumulating
  ~346 lines):**
  - **Entry 3 (rewrite)** — Draft-Mode Route Hardening (DESIGN-1
    supersedes SCAFFOLD-1 baseline). 6-step enable order + dual-
    check disable + helpers + layout integration + studio side +
    customer 2 transfer notes.
  - **Entry 2 (new)** — Sanity Fetch Pattern. Single client +
    `defineLive` wrapper + layout integration + what this pattern
    is NOT + customer 2 transfer.
  - **Entry 4 (new)** — Env Schema Strictness. `.min(1)` over
    `.string()`; `.url()` over `.string()`; conditional required-
    in-prod / optional-in-dev `.refine()`; optional-with-default;
    customer 2 transfer; anti-pattern.
  - **Entry 5 (new)** — Visual Editing Method Probe Discipline.
    Why this pattern exists; the probe pattern; what goes in the
    artifact; counter-pattern; customer 2 transfer.
- **Productisation IP (docs/CAPABILITY_LOG.md — 18 patterns added
  at HALT 3):**
  - "Visual Editing infrastructure" sub-section — 8 patterns
    (single-client architecture; six-step security order; F8
    literal-`"null"` guard + Pattern 13 (a) verification; BvR #34
    dev expansion; BvR #35 null-origin escape hatch; BvR #36
    defense-in-depth posture; Env Schema Strictness Zod
    refinements; Sanity Presentation single-route wiring).
  - "ESLint rule adoption methodology — Brief B Step 6
    productisation IP" sub-section — 6 patterns (Step 6 deferred
    IP consolidated at HALT 3 per Brief B v2.2 §8.8 two-phase
    protocol).
  - "Pattern 13 — Defensive code, tests, and probes need their
    own audit lens" sub-section — 4 sharpening layers.
  - "Customer-2 reusability assessment" matrix extended with all
    Step 8 patterns.
- **Tech Debt added (CLAUDE.md table — 3 entries at HALT 3):**
  - **#18** — Disable UI must set `Referrer-Policy:
    strict-origin-when-cross-origin` (F11 v2.1) at TEMPLATE-*
    time. Fix in MYGRATR-TEMPLATE-*.
  - **#19** — Brief authoring discipline: DEBUG-logging probe
    step BEFORE integration tests fire (Pattern 13 Layer 4
    application). Fix in Customer 2 brief authoring + future
    Mygratr phase briefs.
  - **#20** — STEP 4 defense-in-depth coverage gap (no end-to-end
    integration test exists per `@sanity/preview-url-secret` API
    constraints). Fix in future testing-infra phase.
- **Reference docs:**
  - `CONVENTIONS.md` §"Draft-Mode Route Hardening" (Entry 3
    rewrite) — primary reference for TEMPLATE-* authors
  - `CONVENTIONS.md` §"Sanity Fetch Pattern" (Entry 2)
  - `CONVENTIONS.md` §"Env Schema Strictness" (Entry 4)
  - `CONVENTIONS.md` §"Visual Editing Method Probe Discipline"
    (Entry 5)
  - `docs/CAPABILITY_LOG.md` §"Visual Editing infrastructure"
    sub-section
  - `docs/briefs/active/MYGRATR-DESIGN-1-BRIEF-B_v2.2.md` §8
- **Phase:** MYGRATR-DESIGN-1 (Brief B Step 8 milestone — HALTs
  2 + 3 close; Steps 7, 9, 10, 11 pending)

## Blog Post Template (TEMPLATE-BLOG)
- **Description:** First detail-page template — pattern-establishing for
  12 subsequent template types. Renders 74 blog post documents at
  `/{category}/{slug}` (default locale) + `/uk/{category}/{slug}` (UK
  mirror) = 148 routes total. SEO surface complete: canonical + 3 hreflang
  (en-US, en-GB, x-default) + BlogPosting + BreadcrumbList + (conditional)
  FAQPage JSON-LD + sitemap inclusion. Lighthouse acceptance: SEO 100 +
  A11y 96.
- **Pages / Routes:**
  - `site/src/app/[category]/[slug]/page.tsx` — default locale
  - `site/src/app/uk/[category]/[slug]/page.tsx` — UK locale mirror
- **Template:**
  - `site/src/components/templates/blog/index.tsx` — 277 lines; all
    primitives composed (Heading, Text, Image, PortableText, Card,
    Tag, Accordion, Container, Divider, Icon, Link, Breadcrumbs)
  - `site/src/components/templates/blog/json-ld.tsx` — schema.org
    object builders for BlogPosting / BreadcrumbList / FAQPage
- **Data layer:**
  - `site/src/lib/sanity/queries/blog-post.ts` — 4 queries (full,
    meta, related-3, params) + Zod parse boundary
  - `site/src/types/sanity/documents/blog-post.ts` — read-model Zod
    schemas + types
  - `site/src/types/sanity/shared.ts` — shared Zod (SanityImage,
    PortableText narrowed to TypedObject[], FaqItem)
- **Shared infra introduced:**
  - `site/src/lib/seo/serialize-json-ld.ts` — XSS-safe JSON-LD
    serializer (CMA F4 v1.3 pattern; shared by all future templates)
  - `site/src/components/shared/breadcrumbs.tsx` — accessible
    breadcrumbs primitive (reusable across detail-page templates)
  - `site/src/components/ui/_utils/parse-sanity-image-ref.ts` —
    image-ref dimensions helper (server-import-safe)
  - `site/src/app/sitemap.ts` — `URL_BUILDERS` dispatch pattern;
    future templates add a builder entry per type
- **Primitives extended (sitewide inheritance benefit):**
  - `site/src/components/ui/portable-text/index.tsx` — h5/h6 handlers
    added (BvR #46); inline-image rounded-lg (BvR #42); body→lead
    sizing sitewide (BvR #43)
  - `site/src/components/ui/image/index.tsx` — `'use client'`
    marking; inline `NEXT_PUBLIC_*` env reads (BvR #37); named
    `@sanity/image-url` import (BvR #44)
  - `site/next.config.ts` — `images.qualities: [75, 80]` (BvR #39)
- **Special patterns established (all locked in CONVENTIONS.md):**
  - Detail-Page Template Pattern — four-file fixed structure
  - Sanity Perspective Discipline — `sanityFetch` exclusive in
    `app/` + `components/templates/`
  - Parameterized GROQ Only — `$paramName` + `params` object
  - JSON-LD XSS-Safe Serialization — `serializeJsonLd` helper
    uniformly applied
  - Read-Model Zod Co-Location — site-bound schemas inside
    `site/src/types/sanity/`
  - Next.js Statically-Generated Routes + VERCEL_ENV at Build Time
- **Known limitations (Tech Debt opened):**
  - **#25** — CONTENT-1E pre-CUSTOMER_STORY: w-embed recovery (videos
    + tables flattened by CONTENT-1C `htmlToBlocks`); 10–30 docs
    affected
  - **#29 / #30 / #31** — SCAFFOLD-AUDIT: third-party perf budget /
    cookie hygiene / ClaraChatBot contrast (Lighthouse Perf 79 + BP
    54 traced to sitewide third-party scripts)
  - **#32** — TEMPLATE-* image strategy: hero `aspect-[16/9]` vs
    1200×628 source intrinsic; resolution options at
    `audit-output/template-blog/lighthouse-checkpoint-c.md`
- **Reference docs:**
  - `CONVENTIONS.md` §"Detail-Page Template Pattern" + 5 sibling
    sections — primary reference for TEMPLATE-* authors
  - `PHASE_HISTORY.md` §"MYGRATR-TEMPLATE-BLOG — Pattern-establishing
    first detail-page template (May 2026)" — commit chain + BvR
    ledger + Tech Debt opened
  - `audit-output/template-blog/*.md` — probes, smoke reports,
    spot-check matrix, rich-text gap analysis, Lighthouse
    Checkpoint-C diagnosis, methodology note
  - `docs/briefs/archive/MYGRATR-TEMPLATE-BLOG_BRIEF_v1.3.md`
- **Phase:** MYGRATR-TEMPLATE-BLOG (complete, May 2026)

## Team Member Template (TEMPLATE-TEAM_MEMBER)
- **Description:** Pattern-apply second detail template. Renders 28 `teamMember`
  documents at `/team/{slug}` (default) + `/uk/team/{slug}` (UK mirror) = 56
  routes. Dark/lime D2 skin matching screenshot content structure (not the old
  light theme). Articles section queries `blogPost` where `author→teamMember`
  (39/74 posts have author refs). Tier-1 SEO: canonical + hreflang + OG +
  twitter card + Person + BreadcrumbList JSON-LD + sitemap inclusion.
- **Pages / Routes:**
  - `site/src/app/team/[slug]/page.tsx` — default locale
  - `site/src/app/uk/team/[slug]/page.tsx` — UK locale mirror
- **Template:**
  - `site/src/components/templates/team-member/index.tsx`
  - `site/src/components/templates/team-member/json-ld.tsx` — Person +
    BreadcrumbList (worksFor from siteSettings)
- **Data layer:**
  - `site/src/lib/sanity/queries/team-member.ts` — 4 queries (full, meta,
    author-posts, params) + Zod parse boundary
  - `site/src/types/sanity/documents/team-member.ts`
- **Data gaps flagged:**
  - All 28 docs: null `teamMemberImage.alt` (template uses name fallback;
    Tech Debt #50)
  - `bookACallLink` populated on 5/28 only — layout handles absence
- **Phase:** MYGRATR-TEMPLATE-TEAM_MEMBER (complete, Jul 2026)

## Review Template (TEMPLATE-REVIEW)
- **Description:** Pattern-apply third detail template. Renders **11 published**
  `review` docs at `/reviews/{slug}` (default) + `/uk/reviews/{slug}` (UK
  mirror) = 22 routes. Sanity holds 11 total (0 drafts); CONTENT-1B migrated
  26, CONTENT-1D drift cleanup deleted 15. Dark/lime skin matched to
  `Review.html` export (Team Member reconciliation = fidelity reference for
  simple detail templates). Related reviews grid (3 others by `order`).
  Tier-1 SEO: canonical + hreflang + OG + twitter card + Review +
  BreadcrumbList JSON-LD + sitemap inclusion.
- **Pages / Routes:**
  - `site/src/app/reviews/[slug]/page.tsx` — default locale
  - `site/src/app/uk/reviews/[slug]/page.tsx` — UK locale mirror
- **Template:**
  - `site/src/components/templates/review/index.tsx`
  - `site/src/components/templates/review/json-ld.tsx` — Review +
    BreadcrumbList (itemReviewed → Organization; fixed 5-star rating)
- **Data layer:**
  - `site/src/lib/sanity/queries/review.ts` — 4 queries (full, meta,
    related, params) + Zod parse boundary
  - `site/src/types/sanity/documents/review.ts`
  - `site/src/lib/review/display-name.ts` — company H1 derivation
- **Pre-launch / data gaps flagged:**
  - **Tech Debt #51:** 3 slugs unreachable via legacy Webflow redirects
    (`cameron-pearson`, `emsl`, `mercato` → hub)
  - **Tech Debt #52:** H1 company name derived (metaTitle / slug), not
    schema-backed — spot-check all 11 before launch
  - Case study link omitted (no `customerStory` ref)
- **Phase:** MYGRATR-TEMPLATE-REVIEW (complete, Jul 2026)

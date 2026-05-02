# FEATURE_MAP.md

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
    service (23), customerStory (18), teamMember (28), review (26),
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

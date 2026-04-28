# PHASE_HISTORY.md

## MYGRATR-CONTENT-1B — Reference-Light & Standalone Collections Migration (April 2026)

### What Was Built

**Step 1 — `CE_COLLECTION_IDS` extended:**

- 8 new collection IDs added to `src/lib/content/ce-collection-ids.ts`
  (teamMembers, reviews, videos, bookACall, eventsWebinars, toolsQuizzes,
  downloads, downloadsAccess), all verified against
  `GET /v2/sites/{siteId}/collections` on 2026-04-28.

**Step 1a — Shared helpers (`src/lib/content/migration-helpers.ts`):**

- `toPortableText(html)` — Converts Webflow RichText HTML to a Sanity
  Portable Text array via `@sanity/block-tools`. Critical fix: the
  package's default `parseHtml` uses the browser `DOMParser` global,
  which doesn't exist in Node.js. Injects `(html) => new JSDOM(html).window.document`
  via the `parseHtml` option. `jsdom` + `@types/jsdom` added to deps.
  Without this fix every RichText field falls back to a single
  plain-text block — caught during the team-members spot-check.
- `extractUrl(linkField)` — Accepts both Webflow Link objects (with
  `.url`/`.href`) and plain-string Link fields. Trims whitespace,
  treats empty strings as null. Webflow returns Link fields in both
  shapes depending on collection (team `linkedin-link` is a string;
  video `main-video-embed-link` is an object).
- `uploadImage(imageField)` — Fetches the Webflow CDN URL, uploads
  via `sanityWriteClient.assets.upload('image', Buffer, { filename })`,
  returns a Sanity image asset reference. Logs a warning and returns
  null on failure — a missing image is acceptable; a crashed migration
  is not. Replaces the CONTENT-1A `webflowImageUrl` staging pattern.
- `toRefs(field, refPrefix)` — MultiReference fields → Sanity
  references using deterministic `{prefix}-{webflowId}` IDs. Accepts
  both the legacy `{id: string}` object form and the modern
  plain-string ID form Webflow returns on video/download/event tags.
- `extractOption(field)` — Pull `.name` from a Webflow Option field
  object. Note: Webflow v2 returns Option fields as opaque ID strings
  for most collections, so this helper is only useful when an Option
  arrives as an object. Video/tool migrators use `fetchOptionIdMap()`
  instead — fetch the collection schema once, build an ID→name map.
- `webflowSlug(item)` — Reads `item.fieldData.slug` first, falls back
  to top-level `item.slug`. Webflow v2 returns the slug only on
  `fieldData.slug` for some collections (every team member has
  `item.slug === null`).

**Step 1b — Slug fix retroactively applied to CONTENT-1A:**

- During team-members spot-check, every CONTENT-1A document was found
  to have `slug.current = null` because the original CONTENT-1A
  migrators referenced `item.slug` directly. The 5 CONTENT-1A
  migrators (migrate-tags, migrate-blog-categories,
  migrate-glassdoor-reviews, migrate-benefit-values,
  migrate-staff-benefits) were updated to use `webflowSlug(item)` and
  re-run idempotently via `createOrReplace`. After the fix:
  53 CONTENT-1A docs + 28 team-member docs all carry populated slugs
  (verified via GROQ count query — 0 missing across 6 doc types).
- CONVENTIONS.md §"Content Migration Conventions" updated to show the
  helper and document the historical bug.

**Step 2 — Migrate teamMembers (28):**

- `scripts/content/migrate-team-members.ts`. Field-name corrections
  from live-API verification: image is `team-member` (not
  `team-member-image`); tenure is `time-at-cloudemployee` (not
  `time-at-cloud-employee`). Both `linkedin-link` and `book-a-call-link`
  arrive as plain strings, handled via the loosened `extractUrl`.
  metaTitle/metaDescription deferred to CONTENT-1C backfill.

**Step 3 — Migrate reviews (26):**

- `scripts/content/migrate-reviews.ts`. Sanity `nameClient` ← Webflow
  `name-client` (the personal name, e.g. "Euan Cameron"). Webflow
  `name` (the company name, e.g. "Willo®") is dropped — there is no
  Sanity destination for it on the current `review` schema. Drops
  legacy `featured-in-which-page` and `webpage-for-testimonial`
  fields. metaTitle/metaDescription deferred to CONTENT-1C backfill.

**Step 4 — Migrate videos (32):**

- `scripts/content/migrate-videos.ts`. Webflow `meta-title` does not
  exist on this collection — dropped from the migrator. `type` and
  `team` resolve via `fetchOptionIdMap()` (CONTENT-1A pattern from
  migrate-benefit-values.ts) → TYPE_MAP / TEAM_MAP camelCase. Video
  tags use the plain-string ID form, handled by `toRefs` after a
  helper loosening (matches the extractUrl precedent).

**Step 5 — Migrate book-a-call (6):**

- `scripts/content/migrate-book-a-call.ts`. Webflow `name` →
  `firstName`, `last-name` → `lastName`. Webflow `title` field is
  mislabelled and contains meta description copy — maps to
  `metaDescription` per field map §12.

**Step 6 — Migrate events (1):**

- `scripts/content/migrate-events.ts`. Webflow slug is
  `header-description---post-event` (three dashes). Webflow
  `speakers-header` is dropped — no Sanity destination on the event
  schema. Topics filter is `t.title && t.description` (not `||`)
  because the Sanity `topicItem` sub-schema requires both fields.
  `event-type` resolves from a single string ID via `tag-{id}`.

**Step 7 — Migrate tools (2):**

- `scripts/content/migrate-tools.ts`. FAQ slugs are `faq-header-1..10`
  (not the brief's `faq-title-`). Webflow `blurbs` →
  `metaDescription`. Culture Match `hidden-code` runs through
  `stripApiKeys` (covers quoted-property forms; Webflow's embedded JS
  uses unquoted property names so the regex doesn't actually match).
  Empirically safe in this batch because `htmlToBlocks` discards
  `<script>` content — both tools land in Sanity with `hiddenCode: []`
  and zero key text. Verified by grep on the live key prefix.

**Step 8 — Migrate downloads (5):**

- `scripts/content/migrate-downloads.ts`. `metaThumbnail` reads from
  Webflow `meta-thunbnail` (sic — Webflow's own typo). Three-dash
  slugs throughout (`faq-title---N`, `button-text---N`,
  `button-link---N`). `youllGet` packed into a `string[]` from three
  separate Webflow fields. `howToUseIt`, `theImpact`, `getItNow`
  packed into Sanity object fields.

**Step 9 — Migrate downloads-access (5):**

- `scripts/content/migrate-downloads-access.ts`. Three fields:
  `name`, `slug`, `download-file-link`. Required `downloadFileLink`
  validated explicitly (throws if missing).

**Step 10 — Verification (`scripts/content/verify-content-1b.ts`):**

- Reads `content_migrations` for the 8 CONTENT-1B collections, asserts
  each has `migrated_item_count === expected && status === 'complete'`.
  Final state: 8/8 collections at parity 100, exit 0.

### Patterns Established

- **JSDOM-injected `parseHtml` for `@sanity/block-tools` in Node.**
  The package defaults to `DOMParser` which is browser-only. Always
  pass `{ parseHtml: (html) => new JSDOM(html).window.document }` as
  the third argument to `htmlToBlocks` in any Node-side migrator.
- **Image upload at write time, not staging.** CONTENT-1A used a
  `webflowImageUrl` string staged on the doc root. CONTENT-1B uploads
  via `sanityWriteClient.assets.upload`. Failures are non-fatal: log
  + return null + continue.
- **MultiReference loosening parallels Link loosening.** Both
  `extractUrl` and `toRefs` now accept the plain-string form Webflow
  returns alongside the object form. Apply the same pattern to any
  future helpers that wrap Webflow field shapes.
- **`webflowSlug(item)` is mandatory.** Never reference `item.slug`
  directly — top-level slug is `null` for some collections. CONTENT-1A
  shipped with this bug; never repeat it.
- **Field names verified against the live API before writing the
  migrator.** Six of the eight CONTENT-1B collections had at least
  one slug or shape mismatch between the brief / field map and the
  live Webflow API. The DEBUG_CONTEXT.md sweep that surfaced these
  is the recommended pre-flight for every future migrator.

### Data State After Phase

- Sanity production dataset (`lzbhll1u/production`):
  - 53 CONTENT-1A docs (re-run with slugs backfilled).
  - 105 CONTENT-1B docs across 8 types.
  - 158 CMS docs total. Plus 34 SCHEMA-1 stubs + 5 smoke-test docs.
- Image fields uploaded as real Sanity assets (no staging URLs)
  except where the Webflow CDN was unhappy on the day. One
  `backupImage` upload failed in videos (logged); 3 nullable
  team-member `bookACallLink` strings were null in source (already
  expected per brief §2 "18% fill rate").
- `content_migrations` table: 13 rows for the CE migration (5
  CONTENT-1A + 8 CONTENT-1B), all `status='complete'`,
  `parity_score=100`, `error_log=[]`.
- `migrations.status = content_running` (still partial — content
  complete ships with CONTENT-1C).

### Tech Debt Tracked

- One `scaling-teams (SMOKE TEST)` tag document persists in Sanity
  from SCHEMA-1; reference resolution from CONTENT-1A used the real
  Webflow IDs so it's harmless, but should be deleted in Studio
  before launch.
- `stripApiKeys` regex only matches quoted-property forms
  (`'key': '...'`); Webflow's embedded JS uses unquoted property
  names (`key: '...'`). Currently safe because `htmlToBlocks`
  discards `<script>` content, but the regex would not protect a
  future migrator that preserves script content. Tighten before
  CONTENT-1C if any RichText body could carry a credential.

---

## MYGRATR-CONTENT-1A — Flat Collections Migration (April 2026)

### What Was Built

**Step 0a — Tech debt #10 and #11:**

- Deleted the legacy `MigrationStatus` enum (shortform values like `'audit'`,
  `'schema'`) and the duplicate `TemplateType` enum from `src/lib/types.ts`.
- Replaced internal references with imports from the canonical sources:
  `MigrationStatus` (string-literal union) from
  `src/lib/pipeline/state-machine.ts`, and `TemplateType` (UPPERCASE enum
  matching all audit scripts) from `src/lib/audit-types.ts`.
- Locale, Migration, Organisation, PageRecord, QAResult, etc. all kept;
  none are imported externally — types.ts is internal scaffolding only.
- `npx tsc --noEmit` clean.

**Step 0b — Phase transition:**

- `scripts/content/start-content-phase.ts` mirrors the
  `start-scaffold-phase.ts` shape exactly: `--confirm` required, idempotent
  on re-run if status is already `content_running`, calls
  `assertValidTransition()` from `pipeline/state-machine.ts` before update.
- `migrations.status` and `current_phase` moved
  `scaffold_complete → content_running`.

**Step 1 — Migration infrastructure (`src/lib/content/`):**

- `sanity-write-client.ts` — `@sanity/client` write client with
  `apiVersion: '2024-01-01'`, `useCdn: false`, token from
  `env.SANITY_API_TOKEN`. No `'server-only'` import (CLI scripts run via
  `tsx`, not Next.js).
- `webflow-read-client.ts` — single `getCollectionItems(collectionId)`
  helper with offset+limit pagination at 100 per page (exits when a page
  returns fewer items than the limit; safer than comparing against
  `pagination.total` which can shift on live data). All migrators read
  Webflow exclusively through this module.
- `migration-tracker.ts` — `recordMigration({ collectionSlug, source,
  migrated, status, errorLog })` upserts to `content_migrations` with
  `onConflict: 'org_id,migration_id,collection_slug'`. Computes
  `parity_score` as `migrated/source*100` (or 0 if source is 0). Includes
  `org_id` filter via the upsert payload.
- `ce-collection-ids.ts` — typed `as const` map of the 10 Webflow
  collection IDs in scope for CONTENT-1A, fetched live from
  `GET /v2/sites/{siteId}/collections` and committed as seed data per
  CONVENTIONS.md §"CE-Specific vs Reusable Discipline".

**Step 1d — DDL gap:**

- Brief §1d requires the `content_migrations_org_migration_collection_unique`
  constraint on `(org_id, migration_id, collection_slug)`. A REST-side probe
  (upsert with `onConflict` spec) returned `42P10`, confirming the
  constraint was missing. Direct `pg` connection to the Supabase pooler
  failed with `Tenant or user not found` at both 5432 and 6543, and the
  `db.<ref>.supabase.co` direct hostname doesn't resolve — REST works
  but DDL-via-pg is blocked. Per the brief's stop-on-ambiguity protocol,
  DEBUG_CONTEXT.md was created with the exact ALTER TABLE; Jake ran it
  via the Supabase SQL editor; the probe was re-run and confirmed the
  constraint after which the migrators were written.

**Step 2 — Tags (22 items, D2):**

- `migrate-tags.ts` iterates a 6-key `CATEGORY_MAP`
  (`tagsBlogs/Alternatives/Tools/VideoLibrary/Downloads/EventsWebinars`)
  and writes Sanity `tag` documents with deterministic `_id: tag-{webflowId}`,
  `slug: { _type: 'slug', current: webflowSlug }`, `category` from the map,
  and `singularName` only when the source is `eventsWebinars` and Webflow
  has a `singular-name` value. 22/22 migrated, 0 errors.

**Step 3 — Blog categories (6 items, D13):**

- `migrate-blog-categories.ts` reads the Webflow `hubs` collection and
  writes `blogCategory-{webflowId}` Sanity docs. `name → name`,
  `slug → slug.current`. `order` left unset — Seb sets it in Studio. 6/6.

**Step 4 — Glassdoor reviews (10 items):**

- `migrate-glassdoor-reviews.ts` follows the field map (`§14`):
  `name → clientName` (required), `title → title`,
  `review-description → reviewDescription`, `work-field → workField`.
  Brief's indicative table (rating/date/source-url) was discarded in favour
  of the actual field map per its own instruction. 10/10.

**Step 5 — Benefit values (9 items):**

- Webflow Option fields are stored as opaque IDs in `fieldData`. The
  migrator first fetches `GET /v2/collections/{id}` to build an
  `optionId → name` map for the `category` field, then resolves
  `21c13274484fde9403a3d56c33fe7160 → benefits` and
  `c0ffb288e564af046e3d5dfe99d1b52f → values`. The Sanity enum values
  are lowercase (`benefits`/`values`) per the schema. Image handling:
  `thumbnail-image.url` written to a `webflowImageUrl` staging string;
  no Sanity asset upload (CONTENT-1C). 9/9.

**Step 6 — Staff benefits (6 items):**

- Same image strategy: `icon.url` stored at `webflowImageUrl`. No category
  field on this collection. 6/6.

**Step 7 — Verification:**

- `verify-content-1a.ts` reads all rows for the CE migration from
  `content_migrations`, compares `migrated_item_count` against an
  `EXPECTED` map for the 5 slugs, and exits 1 on any mismatch. All 5
  rows show `migrated/source = 22/22 | 6/6 | 10/10 | 9/9 | 6/6` and
  `parity_score = 100`. Exits 0.

### Patterns Established (added to CONVENTIONS.md)

- **Single read-client + write-client per source/target.** Webflow reads
  go through `src/lib/content/webflow-read-client.ts`; Sanity writes go
  through `src/lib/content/sanity-write-client.ts`. Migration scripts
  never call the Webflow REST API or `@sanity/client` constructors
  directly. Adapter pattern doesn't apply yet (we're still single-source
  CE/Webflow); these clients are the migration-lane equivalents and will
  graduate to `CmsAdapter` implementations in a follow-up.
- **Deterministic Sanity `_id`s** of the form `{typeName}-{sourceId}`
  for every migrated doc. Idempotent re-runs use `createOrReplace`;
  reference resolution (CONTENT-1B/C) becomes a string-template lookup
  with no need for an ID translation table.
- **Webflow Option-field resolution.** Webflow stores Option fields as
  opaque IDs in `fieldData`. Resolve by fetching the collection schema
  (`GET /v2/collections/{id}`) once per migrator and building an
  `optionId → name` map; then map names to the target Sanity enum.
- **Image staging.** Webflow CDN URLs land at `webflowImageUrl` on the
  Sanity doc rather than triggering a Sanity asset upload during
  CONTENT-1A. CONTENT-1C handles the actual asset migration.
- **Pre-flight env guards.** Every migrator opens with `ensureSanity()`
  + `ensureWebflow()` from `src/lib/env.ts` so a missing token throws
  immediately with a clear message rather than failing mid-migration.
- **Per-script `content_migrations` upsert.** Each migrator records its
  own `parity_score`, `error_log[]`, and `status` ('complete' | 'failed')
  via `recordMigration()`. The verifier is the single readout.

### Files Created / Modified

- `src/lib/content/{sanity-write-client,webflow-read-client,migration-tracker,ce-collection-ids}.ts`
- `scripts/content/{start-content-phase,migrate-tags,migrate-blog-categories,migrate-glassdoor-reviews,migrate-benefit-values,migrate-staff-benefits,verify-content-1a}.ts`
- `src/lib/types.ts` — removed `MigrationStatus` and `TemplateType` enums;
  imports replaced with the canonical sources.
- `package.json` — 7 new scripts: `content:start`, `content:migrate-tags`,
  `content:migrate-blog-categories`, `content:migrate-glassdoor-reviews`,
  `content:migrate-benefit-values`, `content:migrate-staff-benefits`,
  `content:verify-1a`.
- Database: `content_migrations` got the
  `content_migrations_org_migration_collection_unique` constraint via
  the SQL editor (no migration script committed — DDL was a one-off
  unblock).
- DEBUG_CONTEXT.md created mid-phase for the constraint blocker; deleted
  after verification.

### Data State After Phase

- Supabase `migrations` (CE): `status = content_running`,
  `current_phase = content_running`. `metadata.scaffold_phase` block
  preserved from SCAFFOLD-1; no `content_phase` block written yet
  (closes when `content_complete` ships in CONTENT-1C).
- Supabase `content_migrations`: 5 rows for CE migration —
  `tags-consolidated 22/22`, `blog-categories 6/6`,
  `glassdoor-reviews 10/10`, `benefit-values 9/9`,
  `staff-benefits 6/6`. All `status = 'complete'`, `parity_score = 100`,
  `error_log = []`.
- Sanity production dataset (project `lzbhll1u`): 53 new CMS docs across
  5 types — `tag` (22), `blogCategory` (6), `glassdoorReview` (10),
  `benefitValue` (9), `staffBenefit` (6). The 34 SCHEMA-1 stub
  singletons/globals untouched.
- Filesystem: `src/lib/content/` (4 files), `scripts/content/` (7 files).
- 7 commits on `feat/content-1a` (tech debt + transition + infra +
  5 migrator slices + verifier).

### Surprises / Brief Deviations

- **Constraint missing** on `content_migrations`. Brief anticipated this
  and explicitly said "add it via the Supabase SQL editor before
  proceeding". Direct `pg` from the script can't apply DDL — pooler auth
  fails with `Tenant or user not found` at both 5432 and 6543, and the
  direct DB hostname doesn't resolve. Resolved by Jake via SQL editor.
  Minor follow-up for INFRA: rotate `SUPABASE_DB_URL` so future scripts
  can apply DDL automatically.
- **Glassdoor field map.** Brief's indicative table named
  `rating/date/source-url`, but the actual `WEBFLOW_TO_SANITY_FIELD_MAP §14`
  documents `clientName/title/reviewDescription/workField` — the brief
  itself instructs "use the exact Webflow API field slugs listed there".
  Followed the field map.
- **Benefit values category.** Webflow Option fields ship as opaque IDs
  rather than the Sanity enum string. Resolved by fetching the collection
  schema and translating once. New pattern noted above.
- **Image fields.** benefitValue and staffBenefit both have image fields
  in their Sanity schemas (typed `image`), but the brief explicitly
  defers asset migration to CONTENT-1C. Stored as `webflowImageUrl`
  string at the doc root. Sanity is permissive about extra fields not in
  the schema; they're stored on the doc and ignored by Studio.
- **Tech Debt #11 wording.** Brief says "Standardise on the string-literal
  union in `src/lib/audit-types.ts`", but `audit-types.ts` has
  `TemplateType` as an UPPERCASE enum (and is heavily referenced by
  `TemplateType.HOME` syntax across 4 audit scripts). Rewriting it as a
  literal union would have broken those callsites. Took the pragmatic
  read: "remove the duplicate from `src/lib/types.ts` and standardise on
  whatever lives in audit-types.ts" — kept the enum, deleted the
  duplicate. Type-checker clean.

---

## MYGRATR-SCAFFOLD-1 — Next.js Scaffold (April 2026)

### What Was Built

**Step 0a — pre-flight context update (`CLAUDE.md`):**

- Phase status table: SCHEMA-1 → ✅ Complete; SCAFFOLD-1 → 🔄 In Progress.
- Tech debt rows 10/11 (legacy `MigrationStatus` enum, `TemplateType` clash)
  reassigned `Fix In: MYGRATR-CONTENT-1` per brief — those clean-ups are
  out of the SCAFFOLD lane.

**Step 1 — Next.js app scaffold:**

- `npx create-next-app@latest site/` produced Next.js 16.2.4 (App Router,
  TypeScript strict, Tailwind v4, ESLint, src-dir, `@/*` alias). Brief
  permits 15+; 16 is the current latest.
- Sanity dependencies installed in `site/`: `next-sanity@12`,
  `@sanity/client`, `@sanity/image-url`, `@sanity/presentation`,
  `@sanity/visual-editing`, plus `clsx` and `tailwind-merge`.
- Root `.gitignore` extended: `site/.next/`, `site/node_modules/` ignored;
  `.audit/` restored (had been removed by an earlier edit).
- Site `.gitignore` modified: `!.env.local.example` exception so the
  template stays tracked while `.env.local` itself remains ignored.

**Step 2 — Sanity client + env:**

- `site/.env.local.example` (committed) and `site/.env.local` (ignored)
  with `NEXT_PUBLIC_SANITY_PROJECT_ID=lzbhll1u`,
  `NEXT_PUBLIC_SANITY_DATASET=production`,
  `NEXT_PUBLIC_SITE_URL=https://staging.jakevibes.dev`,
  `NEXT_PUBLIC_SANITY_STUDIO_URL=http://localhost:3333`,
  `SANITY_API_READ_TOKEN`.
- `site/src/lib/env.ts` — Zod-validated env loader scoped to the Next.js
  app. `NEXT_PUBLIC_SITE_URL` falls back to
  `https://${NEXT_PUBLIC_VERCEL_URL}` then `http://localhost:3000` so
  preview builds never crash.
- `site/src/lib/sanity/client.ts` — `sanityClient` (perspective
  `published`, `useCdn` only in production, stega gated by
  `VERCEL_ENV === 'preview' && NODE_ENV !== 'production'`) +
  `previewClient` (`previewDrafts`, no CDN, authenticated, stega on).
  `'server-only'` import at the top of the file prevents accidental
  client-bundle inclusion.
- `site/src/lib/sanity/queries.ts` — single `getSiteSettings` smoke-test
  query stub; CONTENT-1 / TEMPLATE-* expand.

**Step 3 — locale routing:**

- `site/src/lib/locale.ts` — `LOCALES` (en-US, en-GB), `DEFAULT_LOCALE`,
  `getLocaleFromPath`, `buildLocalePath`, `generateCanonical`,
  `generateHreflang`. Both generators normalise defensively (strip a
  leading `/uk/` if a UK path is passed). The `/uk` prefix guard
  explicitly checks `=== '/uk'` and `startsWith('/uk/')` so paths like
  `/ukraine/...` aren't mangled. A header comment block locks the
  contract for TEMPLATE-* phases — every `generateMetadata()` calls
  both helpers.
- `site/src/components/locale-provider.tsx` — client `LocaleContext`
  with `useLocale()` hook.
- UK route stubs: `site/src/app/uk/layout.tsx` wraps in `LocaleProvider
  locale="en-GB"`; `site/src/app/uk/page.tsx` mirrors `/`;
  `site/src/app/uk/[...slug]/page.tsx` calls `notFound()` (Next 16 async
  params) until TEMPLATE-* defines explicit dynamic segments.

**Step 4 — root layout, scripts, fonts, metadata, robots, sitemap:**

- `site/src/components/third-party-scripts.tsx` — three exports:
  `GeoTargetlyScript` (beforeInteractive, GeoTargetly inline redirect),
  `GtmHeadScript` + `GtmNoScript` (afterInteractive head + body iframe),
  and `GlobalScripts` for the rest. Each component renders its
  `<Script>` only when the corresponding identifier is confirmed in
  `audit-output/ce-scripts.json`. IDs sourced verbatim:
  GTM-WL45TCTW, LinkedIn 4901289, Hotjar 4985481, Clara workspace
  09aa62df-5af6-4cec-b565-c335e907327d, Facebook Pixel 160820827844254,
  HubSpot 22809822. GA4 (G-2Q22ZM5PLY) is fired through GTM and not
  loaded as a separate tag. GSAP/Swiper/Finsweet load
  afterInteractive; Calendly is `lazyOnload` globally for now (TEMPLATE-BAC
  may scope to /book-a-call/* later). Vector Tag, Ahrefs Analytics, and
  Cloudflare Insights are deliberately omitted — they appear in the
  audit but lack confirmed CE-tied identifiers; CONTENT-1 confirms.
- `site/src/app/layout.tsx` — async server component, `<html lang="en">`
  (UK pages override via `LocaleProvider` + per-page metadata), Inter
  font (300/400/500/600/700) loaded via `next/font/google` —
  confirmed in audit-output/pages/home/content.json customHeadCode
  (`WebFont.load: Inter:300,400,500,600,700`). `metadataBase` from
  `env.NEXT_PUBLIC_SITE_URL`, `title.template` "%s | Cloud Employee",
  `openGraph.images` defaults to `/og-default.png`. The OG override
  pattern for TEMPLATE-* phases is documented as a top-of-file comment.
  Body order: GTM noscript → Nav → children → Footer → SanityLive →
  conditional VisualEditing (draftMode().isEnabled) → GlobalScripts.
- `site/public/og-default.png` — 1×1 transparent PNG written via Node
  base64 decode. Seb replaces with the real 1200×630 brand asset
  pre-launch.
- `site/src/app/robots.ts` — `Disallow: /download-thank-you/` (design
  doc §10), sitemap link to `/sitemap.xml`.
- `site/src/app/sitemap.ts` — homepage + UK homepage stub. CONTENT-1
  expands across all 21 CMS types + singletons.

**Step 5 — nav and footer stubs:**

- `site/src/components/layout/nav.tsx` and `footer.tsx` — both server
  components. Each calls `getSiteSettings()` and null-guards before
  reading any properties (Sanity returns `null` if the singleton hasn't
  been created yet). Tech Debt #5 noted in `nav.tsx`: AUDIT-1's selector
  merged Technology dropdown into Services in
  `ce-global-components.json`; TEMPLATE-NAV will source the canonical
  link tree from the Sanity `navigation` global.

**Step 6 — redirects:**

- `scripts/scaffold/extract-redirects.ts` (`npm run redirects:extract`)
  reads three gitignored audit artefacts and writes three tracked TS
  files inside `site/src/lib/redirects/`:
  - `generated-redirects.ts` — 12 entries from
    `audit-output/ce-canonical-urls.json` (filter status=301/302, drop
    null `redirectTarget`, dedupe against locked rules).
  - `regex-redirects.ts` — 12 entries from
    `audit-output/ce-regex-redirects.json`. Webflow `(.*)` becomes
    Next.js `:slug*`; Webflow `%1` becomes `:slug*`. Webflow rules
    where the capture has no slash separator (`/foo(.*)`) are split
    into two rules — exact match + `/foo/:slug*` — because
    path-to-regexp can't repeat a parameter without a separator.
  - `webflow-redirects.ts` — 316 entries from
    `audit-output/webflow-redirects.csv` (drop 336 `/live-job-role/*`
    rows handled by the locked catch-all regex; drop the `/team` row
    that overlaps with the locked rule; strip query strings; dedupe
    against `regex-redirects.ts` entries that also live in the CSV).
- `site/next.config.ts` composes `[crawlRedirects, regexRedirects,
  webflowRedirects, lockedRules]` in that order. Locked rules from
  design doc §8: `/live-job-role/:path*` → talent.cloudemployee.io
  (308), `/team` → /about-us, `/our-work` → /customer-stories,
  `/alternatives` → /compare. Pinned `turbopack.root` to `__dirname`
  to silence the multi-lockfile warning. The `/archive/old-home` 410
  Gone behaviour is parked with a TODO for TEMPLATE-STATIC.
- Brief deviation: brief Step 6d says `webflow-redirects.ts` is
  "hand-authored from the verified markdown source" but the markdown
  only contains summary statistics + 5 examples — the 317 actual rows
  live in the gitignored CSV. The same Step 6c extraction-script
  pattern was applied. Tracked in commit `a61a161` and originally
  documented in `DEBUG_CONTEXT.md` (cleared at end of phase).

**Step 7 — Presentation Tool + draft mode:**

- `studio/sanity.config.ts` adds `presentationTool({ previewUrl: …
  previewMode/draftMode → '/api/draft-mode/enable' })`. Imported from
  `sanity/presentation` (the bundled path) — the standalone
  `@sanity/presentation` package is now a deprecated re-export that
  would crash at runtime. `@sanity/presentation` is still listed as a
  dependency to satisfy the brief's install step but the actual import
  path is the bundled one.
- `site/src/app/api/draft-mode/enable/route.ts` — calls
  `validatePreviewUrl(previewClient, request.url)`,
  same-origin-checks the redirectTo against
  `env.NEXT_PUBLIC_SITE_URL` (F10 hardening), then
  `(await draftMode()).enable()` and redirects to
  `pathname + search + hash` only.
- `site/src/app/api/draft-mode/disable/route.ts` — disables the cookie
  and returns "Draft mode disabled". F15 (POST-only + origin check) is
  deferred per brief.
- `site/src/lib/sanity/live.ts` — `defineLive({ client: sanityClient })`
  exposes `sanityFetch` and `SanityLive`. The brief's
  `export { SanityLive } from 'next-sanity'` form doesn't exist in
  next-sanity@12; the factory pattern is the current API.
- Layout renders `<SanityLive />` always and `<VisualEditing />` only
  when `(await draftMode()).isEnabled`. `VisualEditing` imported from
  `next-sanity/visual-editing` (the brief's `next-app-router` subpath
  also doesn't exist in this version).

**Step 8 — phase scripts + smoke test + Vercel deploy:**

- `scripts/scaffold/start-scaffold-phase.ts` requires `--confirm`,
  asserts the schema_complete → scaffold_running transition, idempotent
  on re-run.
- `scripts/scaffold/complete-scaffold-phase.ts` requires `--confirm`
  and `--preview-url`, transitions to scaffold_complete and writes
  `metadata.scaffold_phase = { completed_at, vercel_preview_url }`.
- `npm run build` passes locally with zero TS / ESLint errors. `npm
  run start` smoke tests on http://localhost:3000 confirmed `/`,
  `/uk`, `/team→/about-us`, `/our-work→/customer-stories`,
  `/live-job-role/x→talent.cloudemployee.io/x`, sample webflow
  `/after-care→/how-it-works`, `/sitemap.xml`, `/robots.txt`, GTM and
  GeoTargetly tags all working.
- Preview deploy at
  `https://mygratr-c3utcgloa-cloud-employee.vercel.app` (Vercel
  deployment protection on; smoke-tested via the project owner's
  account, all 9 brief-spec checks pass).
- `migrations.status = scaffold_complete` for CE migration; metadata
  includes the preview URL.

### Patterns Established (added to CONVENTIONS.md)

- **Next.js App Router conventions for the generated site**: every
  page's `generateMetadata()` calls `generateCanonical(path, locale)`
  and `generateHreflang(usPath)` from `site/src/lib/locale.ts`. The
  canonical/hreflang generators normalise paths defensively and are
  the single source of truth.
- **UK locale via URL prefix, not Next.js i18n**: handled by an
  explicit `site/src/app/uk/` segment, never the framework's i18n
  config.
- **Third-party scripts only render with confirmed identifiers**: each
  script in `site/src/components/third-party-scripts.tsx` is gated on
  a constant pulled verbatim from audit output. Unconfirmed IDs return
  `null` — never fabricated values.
- **Redirect data extraction pattern**: gitignored audit artefacts go
  through `scripts/scaffold/extract-redirects.ts` and produce tracked
  TS files inside `site/`. `next.config.ts` only imports tracked files
  so Vercel builds don't depend on `audit-output/`.
- **Sanity Live factory**: `defineLive({ client })` in
  `site/src/lib/sanity/live.ts` exports `sanityFetch` + `SanityLive`
  for the rest of the site.

### Files Created / Modified

- `site/` — entire Next.js 16 app (≈40 files including create-next-app
  scaffold).
- `site/src/lib/env.ts`, `locale.ts`, `sanity/{client,queries,live}.ts`,
  `redirects/{generated,regex,webflow}-redirects.ts`.
- `site/src/components/locale-provider.tsx`, `third-party-scripts.tsx`,
  `layout/{nav,footer}.tsx`.
- `site/src/app/{layout,page,robots,sitemap}.ts(x)`,
  `uk/{layout,page,[...slug]/page}.tsx`,
  `api/draft-mode/{enable,disable}/route.ts`.
- `site/next.config.ts` (overwrote create-next-app stub).
- `studio/sanity.config.ts` (added `presentationTool`).
- `studio/package.json` + `studio/package-lock.json` (added
  `@sanity/presentation`).
- `scripts/scaffold/{extract-redirects,start-scaffold-phase,complete-scaffold-phase}.ts`.
- `package.json` — three new scripts: `redirects:extract`,
  `scaffold:start`, `scaffold:complete`.
- `.gitignore` extended; `site/.gitignore` exception for
  `.env.local.example`.

### Data State After Phase

- `migrations` row CE: `status = scaffold_complete`,
  `current_phase = scaffold_complete`,
  `metadata.scaffold_phase = { completed_at, vercel_preview_url }`.
- Vercel preview URL: `https://mygratr-c3utcgloa-cloud-employee.vercel.app`.
- 11 commits on `feat/scaffold-1`; merging to `main` closes the phase.

### Surprises / Brief Deviations

- **Next.js 16 instead of 15.** create-next-app installs 16.2.4; brief
  permits 15+. Recorded for context only — no code adjustments needed.
- **Brief mentioned three import paths that don't exist in the current
  package versions**:
  `@sanity/visual-editing/next-app-router` (use
  `@sanity/visual-editing/react` or `next-sanity/visual-editing`),
  `@sanity/presentation` direct import (use `sanity/presentation`),
  `next-sanity` root re-export of `SanityLive` (use
  `defineLive({ client })`). All three resolved by the more current
  recommended path.
- **Webflow redirects source.** Brief says hand-authored from
  redirects-verification.md, but that markdown only contains summary
  statistics + 5 examples; the 317 actual rows live in
  webflow-redirects.csv (gitignored). Resolved by extending the
  Step 6c extraction-script pattern.
- **Path-to-regexp parameter rules.** Webflow `/foo(.*)` doesn't
  translate cleanly because path-to-regexp can't repeat without a
  separator. Split into two rules per affected pattern.
- **Vercel deployment protection.** Preview URL returned 401 to
  ordinary curl; Jake verified the smoke checklist against the
  protected URL through `vercel curl` / browser auth.

---

## MYGRATR-SCHEMA-1 — Sanity Schema Design (April 2026)

### What Was Built

**Pre-requisite infrastructure (Step 0a — not in original brief scope; the
brief referenced these as existing but they were not yet in the repo):**

- `tsconfig.json` — added `paths: { "@/*": ["./src/*"] }` (no baseUrl;
  TypeScript 5+ supports paths without it, and TS6 deprecated baseUrl)
- `src/lib/env.ts` — Zod-validated env loader with runtime guards
  (`ensureSanity`, `ensureWebflow`, etc.) for optional service keys
- `src/lib/supabase.ts` — `createServerClient()` for admin/migrations
- `src/lib/pipeline/state-machine.ts` — canonical `MigrationStatus`
  string-literal union + VALID_TRANSITIONS map + `assertValidTransition()`.
  The legacy `MigrationStatus` enum in `src/lib/types.ts` predates the
  running/complete/failed split and uses shortform values; state-machine.ts
  defines its own type locally (flagged in Known Tech Debt).
- `studio/` — Sanity v5 Studio scaffold: package.json, sanity.cli.ts,
  sanity.config.ts, tsconfig.json, .gitignore. `sanity` + `@sanity/vision`
  + `react` + `styled-components` installed. Structure tool enabled;
  singletons filtered out of "new document" menu + duplicate/delete
  disabled via document actions filter.

**Shared object schemas (Step 2):**

- `studio/schemas/objects/portable-text.ts` — named array type; styles
  (normal, h2, h3, h4, blockquote), bullet/numbered lists, 5 decorators,
  link annotation with href + blank-target, inline image with hotspot
- `studio/schemas/objects/faq-item.ts` — `{question, answer:portableText}`
- `studio/schemas/objects/quote-block.ts` —
  `{paragraph, personImage, personName, personTitle}` for customerStory
- `studio/schemas/objects/fold.ts` — typed fold per §3.4 with FOLD_TYPES
  enum [headerIntro, featureBullets, itemList, paragraphSection, headerOnly]
- `studio/schemas/objects/section.ts` — 12 polymorphic variants per §4.4
  (richTextSection, twoColumnSection, ctaSection, imageSection,
  videoSection, testimonialSection, benefitsGrid, staffBenefitsGrid,
  glassdoorGrid, customerStoriesGrid, faqSection, hubspotFormSection)
- `studio/schemas/_shared.ts` — `localeField()`, `sourceTrackingFields()`,
  `metaFields({og})`, `slugField()`, `imageField()` reusable field builders

**21 CMS document types (Step 3):**

Simple leaf types: tag, blogCategory, glassdoorReview, benefitValue,
staffBenefit, downloadAccess, teamMember, review.

Reference-heavy types: video (→ tag), download (→ tag), bookACall (custom
slug from firstName+lastName), event (→ tag, teamMember), tool (→ tag),
compareBlog (→ tag, teamMember), blogPost (→ blogCategory, tag, teamMember).

Complex types: customerStory (problem/solution/impact with quoteBlock),
technology (typed folds replacing 34 flat fields), service (folds +
associatedTechnologies ref array), industry/persona/location (three
AI-search landing-page types sharing a factory in
`_landing-page-factory.ts`).

**31 singletons (Step 4):**

Four factory functions in `studio/schemas/singletons/_factories.ts` keep
shape consistent across all 31 files:

- `defineBlogHub` — §4.1 — blogHub + 6 category hubs (7 files)
- `defineCollectionHub` — §4.2/§4.3 — 4 resource hubs + 5 collection-index
  hubs (9 files; teamHub dropped per brief §6 deferred note since /team
  is a 301 to /about-us)
- `defineStaticPage` — §4.4 — 13 static content singletons with the
  12-variant sections array + locale
- `defineCalculatorPage` — §5 — 2 Tier-3 calculator pages (marketing
  copy wrappers; logic hardcoded in Next.js)

**3 globals (Step 5):** siteSettings, navigation, footer per §6.1–§6.3.

**Studio structure config (Step 6):**

`studio/schemas/structure.ts` groups the 34 singleton/global docs into
six nav sections: Static Pages, Blog Hubs, Resource Hubs, Collection
Indexes, Calculator Pages, Site Globals. Each surfaces as a direct
single-document nav item (not a list view). Regular CMS document types
appear below a divider using `S.documentTypeListItems()` filtered to
exclude singletons. `sanity.config.ts` also filters singletons from the
"new document" templates menu and strips duplicate/delete from their
document actions.

**Zod types mirroring every schema (Step 7):**

- `src/types/sanity/shared.ts` — primitives (SanityImage, SanitySlug,
  SanityRef), PortableTextSchema (z.unknown-backed array per brief §3.2),
  enums (Locale, Source, FoldType), shared embedded objects
  (FoldSchema, FaqItemSchema, QuoteBlockSchema), discriminated-union
  SectionSchema across 12 variants, MetaFieldsSchema /
  MetaFieldsNoOgSchema / SourceTrackingFieldsSchema factories,
  SanityBaseDocumentSchema (system fields)
- `src/types/sanity/documents/` — 21 files + `_landing-page-factory.ts`
- `src/types/sanity/singletons/` — 31 files + `_factories.ts`
  (blogHubSchema, collectionHubSchema, staticPageSchema,
  calculatorPageSchema)
- `src/types/sanity/globals/` — 3 files
- All types `export *`-ed through `src/types/sanity/index.ts`

**Migration-map doc (Step 8):**

`docs/WEBFLOW_TO_SANITY_FIELD_MAP.md` (500 lines, v1.0): 20 sections
covering all 33 Webflow collections (7 blogs consolidate under §1, 6 tags
under §17, 17 single-mapping types across §2–§19, 3 dropped under §20).
Each section has a field mapping table + DROPPED FIELDS + NEW FIELDS
callouts. MIGRATION BLOCKS table at the bottom lists pre-launch blockers:
meta backfills (157 items across technology/service/teamMember/review/
bookACall), required author refs (127 blog+compare items),
`/customer-story/virgin` placeholder text, and the 4 UNKNOWN canonical
URLs (tech-debt #9).

**Four scripts under `scripts/schema/`:**

- `start-schema-phase.ts` — assertValidTransition audit_complete →
  schema_running, update migrations row
- `seed-singletons.ts` — createIfNotExists for 34 singleton/global docs
  with per-type minimal shapes; requires --confirm-production; 34 docs
  seeded in production dataset (logged created vs already-exists)
- `smoke-test-seed.ts` — self-contained integration test; createOrReplace
  with deterministic _ids; seeds dummy blogCategory/tag/teamMember,
  then technology with 3 typed folds, then a blogPost referencing all
  three. All 5 docs accepted by the Sanity API.
- `record-schema-designs.ts` — 21 schema_designs inserts with curated
  sanity_schema JSONB summaries (typeName, schemaFile, sourceCollections,
  sourceItemCount, fieldCount, requiredFields, referenceFields, notes),
  then assertValidTransition schema_running → schema_complete and
  metadata.schema_phase = {document_types:21, singletons:31, globals:3,
  objects:16, completed_at}

### Data State After This Phase

- Supabase `migrations` (CE): `status = schema_complete`,
  `current_phase = schema_complete`,
  `metadata.schema_phase = {document_types:21, singletons:31, globals:3, objects:16, completed_at:"2026-04-24T11:08:54.363Z"}`
- Supabase `schema_designs`: 21 rows for CE migration, all at
  `version=1`, `status='approved'`, `specialist_reviewed=false`.
  Slugs: blogs-consolidated, compare-blogs, technology-pages, services,
  customer-stories, team-members, reviews, videos, downloads,
  downloads-access-pages, tools-quizzes, book-a-call-pages,
  events-webinars, glassdoor-reviews, client-benefits-company-values,
  staff-benefits, tags-consolidated, hubs, industry-placeholder,
  persona-placeholder, location-placeholder.
- Sanity production dataset (project `lzbhll1u`): 34 singleton/global
  stub docs + 5 smoke-test docs with `smoke-test-*` prefix. Stub docs
  have placeholder titles and trivial fields; required content
  (metaTitle, metaDescription, required images) intentionally omitted
  so Studio flags them as TODOs for content migration.
- Filesystem: studio/ (Sanity project), studio/schemas/ (71 schema
  types), src/types/sanity/ (55 Zod files), scripts/schema/ (4 scripts),
  docs/WEBFLOW_TO_SANITY_FIELD_MAP.md.

### Key Decisions / Interpretations

The brief and the design doc both referenced infrastructure
(`src/lib/env.ts`, `src/lib/supabase.ts`, `src/lib/pipeline/state-machine.ts`)
that did not exist in the repo. Jake authorised creating it inside this
session rather than splitting into a separate INFRA brief — patterns were
fully documented in CONVENTIONS.md §69-101 / §142-184 / §402-435, so no
architecture decisions were taken. The SCHEMA lane (brief §7) was
extended to include `src/lib/*` prereqs.

Brief step order (Step 4 → 4a → 5) reordered to Step 4 → 5 → 4a, because
Step 4a seeds all 34 singleton/global docs and needed the global schemas
registered first. Idempotent `createIfNotExists` means the reorder is
safe either way.

TeamHub singleton dropped (brief §6 deferred note — `/team` is a 301 to
`/about-us`, so 5 collection-index singletons instead of 6). Total 31
singletons matches the brief's Step 6 SINGLETON_TYPES list.

Sanity Studio v5 (latest `sanity` package) used; the brief's "Sanity v3"
reference means the v3 Studio API (`defineType` / `defineField` /
`defineArrayMember`), which is still current in v5. No
`__experimental_actions` — singleton enforcement via the `document.actions`
filter in sanity.config.ts + the grouped structure in structure.ts.

`sanity_schema` JSONB column stores a curated summary, not a full
`defineType` serialisation. The `fields[].validation` callbacks aren't
JSON-safe, and the `sanity` package is only installed in `studio/` (not
root), so serialising from root scripts would require ESM/CJS bridging.
The summary (typeName, fieldCount, requiredFields, referenceFields,
notes) captures the design decisions that matter for provenance and
diffing; the full schema lives in code.

### Patterns Established (see CONVENTIONS.md)

- Sanity v3 schema conventions (`defineType` / `defineField` /
  `defineArrayMember`; default-export per file; registry aggregated in
  `studio/schemas/index.ts`)
- Factory functions for repeated schema shapes (singleton factories,
  landing-page factory; same pattern on the Zod side)
- Zod mirror pattern: every Sanity schema has a matching Zod schema
  with inferred type alias; PortableText is z.unknown() pending
  TEMPLATE-* when renderers are built
- Curated `sanity_schema` JSONB summaries (not full serialisation)
- Studio structure config pattern: group singletons into topical nav
  lists; hide them from new-doc menu; strip duplicate/delete actions

### Surprises

- Sanity v3's `templates` filter in `schema.templates: (templates) =>
  templates.filter(...)` is the v5-current way to hide types from the
  new-doc menu. The brief mentioned `structureTool` is "no longer" the
  place for this filter, but didn't spell out the `templates` or
  `document.actions` filters — the canonical v5 approach landed on
  checking the installed Sanity package and using whichever API is live.
- TypeScript 6 deprecated `baseUrl` at the tsconfig level. Adding
  `paths: { "@/*": ["./src/*"] }` without baseUrl works cleanly (TS 5+).
- The existing `MigrationStatus` enum in `src/lib/types.ts` uses shortform
  values (`'audit'`, `'schema'`) that don't match the actual Supabase
  data (`'audit_complete'`, `'schema_running'`). Not used anywhere in
  working code, but it's dead-code tech debt flagged for future cleanup.

### Known Tech Debt Added

Logged in CLAUDE.md — see the Known Tech Debt table. In short:
- `src/lib/types.ts` MigrationStatus enum is out of sync with
  `state-machine.ts`'s canonical string-literal type and with the
  Supabase `migrations.status` column. Delete the enum or align values.
  Dead code today (no import sites) but a trap for future contributors.

## MYGRATR-SCHEMA-0 — Schema Design Lock (April 2026)

### What Was Built
- `docs/CE_RAW_EXTRACT.md` (91,269 lines) — verbatim audit output kept
  as an unedited reference. Not structured for reading; used as the
  source the SITE_TRUTH doc derives from.
- `docs/CE_SITE_TRUTH.md` (3,615 lines) — structured authoritative
  source-of-truth document. Section 1 enumerates every CMS collection
  with field counts, item counts, and field-population rates. Section 2
  enumerates every page template with URL patterns. Section 10 lists
  every existing Webflow redirect behaviour that must be preserved.
- `docs/MYGRATR_SCHEMA_DESIGN_DECISIONS.md` v1.0 → v1.1 → v1.2
  (1,190 lines locked) — the authoritative input to MYGRATR-SCHEMA-1.
  Defines 21 Sanity document types (16 core CMS types + 2 supporting
  embedded types + 3 AI-search placeholders), ~30 singletons, 3
  hardcoded Next.js routes, 6 global schemas, redirect preservation
  strategy, and 32 locked design decisions (D1–D32 in §12).
- `docs/SCHEMA_DECISIONS_AUDIT_REPORT.md` (251 lines) — red-team audit
  of v1.0 against ground truth (`audit-output/*.json` + CE_SITE_TRUTH).
  5 HIGH findings, 6 MEDIUM findings, 5 missing-coverage items, 5
  unverifiable claims. Zero critical structural errors.
- `docs/SCHEMA_DECISIONS_AUDIT_REPORT_V2.md` — re-audit of v1.1
  confirming all 5 HIGH and all 5 missing-coverage findings were
  correctly fixed; flagged one residual "40 flat fields" text error
  (NEW-1) and recommended referencing the completed redirects
  verification instead of deferring to CONTENT-1.
- `docs/investigations-2026-04-23/` — three investigations that
  unblocked open schema questions:
  - Investigation 1: static pages inventory (37 US paths)
  - Investigation 2: customer-stories `video-url-2` field validity
    (confirmed 2/17 populated, both malformed — DROP decision)
  - Investigation 3: Glassdoor reviews rendering locations
    (183 hits on `/for-developers`, 183 on `/reviews` — separate
    `glassdoorReview` doc type decision)
  - Redirects verification: 653 Webflow-configured redirects
    broken down: 336 `/live-job-role/*` (collapse to 1 regex),
    317 non-job-role (preserve individually). No `/live-job-role/*`
    URLs active in current crawl or sitemap. Ahrefs baseline empty
    per Tech Debt #4 — backlink value unverifiable.

### Decisions Locked (32)
Full list in `docs/MYGRATR_SCHEMA_DESIGN_DECISIONS.md` §12. Highlights:
- D1: Consolidate 7 blog collections → single `blogPost` with category field
- D2: Consolidate 6 taxonomy collections → single `tag` with category field
- D3/D4: Typed `folds` array replaces 34 flat fold-related fields on
  Technology Pages (and same pattern for Services)
- D5: Drop `Customer Stories.video-url-2` — broken data
- D6/D7: Add `metaDescription` to Technology and Services (missing in Webflow schema)
- D8: Replace `faq-schema-2` PlainText with structured `faqs` array
- D9: Rename Book A Call `title` field to `metaDescription` (Webflow naming bug)
- D10: Add industry/persona/location placeholder schemas for AI-search strategy
- D11: Author field REQUIRED on `blogPost` and `compareBlog`
- D14/D15/D16: Do NOT migrate Insights (1), New Blog Templates (5), Lead magnets (17)
- D18: Culture Match tool PARKED — placeholder page, logic rebuilt post-launch
- D21: UK/US content duplicated by default; split post-launch in MYGRATR-LOCALE-1
- D25: Single global blog (not separate US/UK)
- D26: Preserve Webflow slugs exactly — no slug cleanup
- D27–D29: JSON-LD, canonicals, hreflang — all server-side
- D32: GeoTargetly preserved via `siteSettings` global script list

### Pre-Session Inputs Verified
- `audit-output/ce-inventory.json` — 33 collections, 451 items
- `audit-output/ce-canonical-urls.json` — 636 URLs, 602 indexable
- `audit-output/ce-sitemap-xml.json` — 522 indexable URLs from sitemap
- `audit-output/ce-field-population.json` — 0%-fill justifications
- `audit-output/ce-forms.json` — 3 verified HubSpot form GUIDs
- `audit-output/webflow-redirects.csv` — 653 source→target rows
- `audit-output/ce-regex-redirects.json` — 11 regex patterns

### Key Discoveries During Lock
- Technology Pages CMS schema has no `meta-description` field at the
  CMS layer; SEO metadata currently lives in Webflow's template SEO
  settings. Migration must backfill metaTitle/metaDescription on all
  101 technology pages.
- Services collection has the same missing-metaDescription bug (23 items).
- Tools & Quizzes has a `hidden-code` RichText field that is not in
  Section 9 (excluded) and was missing from v1.0 — now mapped to
  `hiddenCode: array[portableText]` in v1.1 with Culture Match API key
  explicitly excluded during migration.
- `/archive/old-home` and `/uk/archive/old-home` both return HTTP 200
  with a "Not Found" template body (soft 404). LAUNCH must emit proper
  HTTP 410 Gone on both paths — locked in §8.
- Webflow primary `name` field (100% populated on every collection)
  wasn't explicitly mapped in v1.0; v1.1 added §7.13 as a cross-cutting
  migration rule.
- Legal pages collection (1 item, 4 fields) wasn't mapped in Section 3
  of v1.0; v1.1 added §7.14 with full field mapping to
  `privacyPolicyPage` singleton.

### Surprises
- v1.0 audit's "17 Sanity document types" count matched no clean
  subset of the enumerated types. v1.1 restated as "21 types
  (16 core + 2 supporting + 3 placeholders)" with the math verifiable
  against §3.1–§3.20 directly.
- v1.0 said "5 taxonomy collections" but listed 6 (Blogs, Downloads,
  Tools & Quizzes, Video Library, Alternatives, Events & Webinars).
  Fixed in v1.1.
- v1.0 typed Videos `backgroundVideoPreviewLink` and
  `vimeoYoutubeStandardLink` as `url` — but Webflow stores both as
  `PlainText`. Sanity `url` validator would reject malformed strings
  at migration time. Fixed in v1.1 to `string` with a post-launch
  validate/normalise note.
- Ahrefs baseline is empty — not only does the subscription not cover
  cloudemployee.io (Tech Debt #4), the two API calls that ran also
  failed with `400: missing argument date`. Backlink value for retired
  URLs can't be assessed from this artefact. Deferred to MONITOR-1 or
  resolved via GSC Links / Semrush before LAUNCH.

### Data State After This Phase
- Supabase: unchanged from AUDIT-1. `audit_manifests` row
  `708d9d52-7721-4c8d-bc78-a6e31ffb3225` still authoritative.
  `migrations.current_phase = audit_complete` still the state.
  No schema_designs rows yet — those get inserted in SCHEMA-1.
- Filesystem: 5 new doc artefacts in `docs/`. 1 new directory
  `docs/investigations-2026-04-23/` with 11 files. 1 new directory
  `docs/SKILLS/` with 2 skill definitions (post-phase-update, red-team-audit).
- Git: 4 commits since AUDIT-1 closeout (398aa4f, 1ee0911, e9cda38, 07ba8cf).

### Patterns Established (see CONVENTIONS.md)
No new code patterns — doc-only phase. The decision-doc lifecycle
(CE_RAW_EXTRACT → CE_SITE_TRUTH → DESIGN_DECISIONS → red-team audit
→ surgical fixes → re-audit → lock) is a repeatable process for
future phases but is a workflow, not a code convention, so it's not
added to CONVENTIONS.md Section 1/2 patterns.

## MYGRATR-AUDIT-1 — Site Audit Agent (April 2026)

### What Was Built
- `src/lib/audit-types.ts` — shared enums and interfaces for the audit
  pipeline (UrlStatus, TemplateType, ClassificationMethod, InteractionType,
  CanonicalUrl, ScreenshotRecord, PageContent, ThirdPartyScript,
  ScriptInventory, HubSpotForm, TemplateClassification, CollectionRecord,
  AuditAnomaly)
- `scripts/audit/00-verify-inputs.ts` — pre-flight env + file check
- `scripts/audit/00-ahrefs-baseline.ts` — Ahrefs REST v3 SEO snapshot
- `scripts/audit/01-reconcile-urls.ts` — merges Screaming Frog +
  sitemap.xml + Firecrawl + Webflow redirects → canonical URL list,
  regex-redirect extraction, HTTP-429 fallback (trusts sitemap/Firecrawl)
- `scripts/audit/02-screenshot-agent.ts` — Playwright 3-breakpoint capture
  with GSAP scroll-trigger priming; resumable (skip if PNGs on disk);
  rules-only template classifier inlined for sample selection
- `scripts/audit/03-content-extractor.ts` — Firecrawl `/scrape` per URL,
  concurrency 5, circuit breaker, 4-min phase timeout, resumable
- `scripts/audit/03b-field-population.ts` — Webflow API field-population
  + EN vs EN-GB diff for all collections
- `scripts/audit/03c-global-components.ts` — nav, footer, Clara widget,
  Finsweet attributes, newsletter form GUID, locale dropdown
- `scripts/audit/03d-asset-manifest.ts` — `<img>` + `<source>` + inline
  CSS url() dedup; site/CMS/external CDN classification
- `scripts/audit/03e-template-custom-code.ts` — per-template script diff
  against global inventory, SEO-critical flagging
- `scripts/audit/04-interaction-inventory.ts` — tier-1 CSS selector +
  class pattern detection, tier-2 Claude Opus 4.7 analysis for
  technology pages and pages with >3 content-affecting elements
- `scripts/audit/05-script-inventory.ts` — 27-pattern detector (GTM,
  GA4, LinkedIn, HubSpot, Hotjar, FullStory, Intercom, Drift, Crisp,
  Cloudflare Turnstile, Cloudflare Insights, Cookiebot, OneTrust,
  Ahrefs, Vector, GeoTargetly, Calendly, socks-ui, Swiper, GSAP, Clara,
  Finsweet, Vimeo, YouTube)
- `scripts/audit/06-forms-inventory.ts` — hbspt.forms.create() +
  data-webflow-hubspot-api-form-url extraction, HubSpot Forms v2 API
  verification, workflow cross-reference
- `scripts/audit/07-template-classifier.ts` — hybrid rules (URL pattern
  match) + LLM fallback (Claude Opus 4.7, 20-URL batches)
- `scripts/audit/08-manifest-builder.ts` — assembles full
  MigrationManifest from all step outputs, strips rawHtml
- `scripts/audit/09-manifest-writer.ts` — upserts audit_manifests,
  updates migrations.current_phase = audit_complete
- `scripts/audit/run-audit.ts` — orchestrator for Steps 00–3e
- `scripts/audit/run-audit-chunk2.ts` — orchestrator for Steps 4–9
- `scripts/audit/run-audit-chunk3.ts` — orchestrator for LLM refresh
  of Steps 4, 7, 3e, 8, 9
- `package.json` — added `audit:run`, `audit:chunk2`, `audit:chunk3`
- `.gitignore` — added `audit-output/` and `.audit/` (audit outputs
  contain PII and infrastructure identifiers)

### Pre-Session Inputs Verified
- `audit-output/screaming-frog-export.csv` (692 KB) — full-site crawl
- `audit-output/screaming-frog-redirects.csv` (742 KB) — redirect chains
- `audit-output/webflow-redirects.csv` (58 KB) — 653 rows, 11 regex
- `audit-output/ce-inventory.json` (213 KB) — 33 collections from WF API
- `audit-output/ce-sitemap.json` (46 KB) — 620 URLs from Firecrawl
- HubSpot private-app token with `forms` scope active
- Ahrefs API key active (but subscription lacks cloudemployee.io data)

### Outputs Written to `audit-output/`
- `ce-ahrefs-baseline.json` — SEO baseline (empty — not in Ahrefs sub)
- `ce-canonical-urls.json` — 636 URLs, 602 indexable, 30 redirects
- `ce-regex-redirects.json` — 11 patterns for `next.config.js`
- `ce-sitemap-xml.json` — 522 URLs cached from sitemap.xml
- `ce-content-extraction-summary.json` — 312/312 extracted
- `pages/{slug}/content.json` (×312) — full extracted content
- `pages/{slug}/interactions.json` (×308) — per-page interactions
- `ce-field-population.json` + `-summary.json` — 33 collections
- `ce-global-components.json` — nav + footer + widgets
- `ce-assets.json` — 608 unique CDN assets
- `ce-template-map-rules.json` — rules-only pass
- `ce-screenshots.json` + `screenshots/{slug}/{bp}.png` (×44)
- `ce-interactions-summary.json` — 5560 content + 2021 cosmetic
- `ce-scripts.json` — 17 global + 261 pages with unique scripts
- `ce-forms.json` — 3 verified HubSpot forms
- `ce-template-map.json` + `ce-template-map-llm-review.json` — 602
  classified (561 rules, 41 LLM)
- `ce-template-custom-code.json` + `-review.json` — 14 templates, 789
  review items, 31 SEO-critical
- `ce-manifest.json` — full MigrationManifest (119 MB)

### Key CE Discoveries
- Tracking stack: GTM `GTM-WL45TCTW`, GA4 `G-2Q22ZM5PLY`, LinkedIn
  Insight `4901289`, Hotjar, Clara chat workspace
  `09aa62df-5af6-4cec-b565-c335e907327d`
- No cookie-consent tool detected globally — worth confirming via GTM
- Only 3 HubSpot forms are embedded live (vs. 25 in portal) — the other
  22 forms are either retired or email-campaign-only
- Every collection uses `single-document` locale strategy — UK
  variations are done via client-side JSON-LD swap script
  (currency/address), not Webflow locale overrides
- `Blogs & Guides` collection: 31/31 items draft-in-UK (100%)
- Nav Technology dropdown merged into Services dropdown in extraction
  (selector issue — needs tweak before SCAFFOLD-1)

### Surprises
- Screaming Frog CSV had HTTP 429 rate-limits on 49 URLs (24 US pages
  missed initially). Step 1 now falls back to `UrlStatus.OK` if URL is
  confirmed in sitemap or Firecrawl.
- Firecrawl v4 SDK restructured (`FirecrawlApp` → `FirecrawlAppV1`) —
  used REST API directly instead of SDK to match existing scripts.
- 2 Playwright `networkidle` timeouts on Vimeo-embedded video pages
  (`/work-with-shawnee`, `/videos/how-cloud-employee-keeps-remote-developers-motivated`).
- Ahrefs API v3 requires a `select` parameter — brief's sample code
  omitted it, fix applied post-run.

### Data State After This Phase
- Supabase `audit_manifests`: row `708d9d52-7721-4c8d-bc78-a6e31ffb3225`
  for CE migration (602 indexable, 33 collections, 451 items, 3 forms)
- Supabase `migrations`: `current_phase = audit_complete`,
  `status = audit_complete`, metadata with counts + 4 manual-review URLs
- 312 page content JSON files on disk (+308 interactions)
- 44 screenshot directories with 3 breakpoints each
- 4 remaining manual-review URLs: `/cdn-cgi/.../main.js`, `/sitemap.xml`,
  `/haqt6iy0.../a`, `/uk/embedding`

### Patterns Established (see CONVENTIONS.md)
- Resumable orchestrator chunks with skip-if-exists
- Tier-1/tier-2 LLM degradation (rules always run; Claude optional)
- Inline rules-based classifier for cross-step dependencies
- Phase-timeout + circuit-breaker for API-driven batch steps
- PII-safe audit outputs via `.gitignore`

## MYGRATR-0 — Foundation (April 2026)

### What Was Built
- Repo structure scaffolded with /src/, /briefs/, /audit-output/
- TypeScript configured (strict mode, ES2022)
- All production and dev dependencies installed
- Supabase schema: 10 tables, RLS on all, org_id on all
- CE org seeded: ce000000-0000-0000-0000-000000000001
- CE migration seeded: ce000000-0000-0000-0000-000000000002
- Shared TypeScript types in src/lib/types.ts
- Context files at root: CLAUDE.md, SCHEMA.md, CONVENTIONS.md,
  CHANGELOG.md, PHASE_HISTORY.md, FEATURE_MAP.md, REGISTRY.md

### Pre-Session Work (Already Complete)
- scripts/webflow-inventory.js — Webflow API inventory
- scripts/firecrawl-sitemap.js — Firecrawl full crawl
- audit-output/ce-inventory.json — 33 collections, 435 items, 25 forms
- audit-output/ce-sitemap.json — 643 crawled URLs
- audit-output/ce-sitemap-xml.json — 522 indexable URLs
- audit-output/ce-sitemap-diff.json — crawl vs sitemap diff

### Key CE Facts Confirmed by Audit
- 522 indexable pages (sitemap.xml source of truth)
- 643 crawled URLs (includes pagination, archives, locale mirrors)
- Locales: US (default) + UK (/uk/ prefix)
- PH locale discontinued — Geotargetly → talent.cloudemployee.io
- 33 CMS collections — most are simple taxonomy tables
- Technology Pages: 101 items, 43 fields, fold-based conditional layout
- 25 forms — HubSpot — decision pending before MYGRATR-CONTENT-1
- Custom code: Webflow API blocked (plan limit) → Firecrawl in AUDIT-1

### Data State After This Phase
- Supabase: schema live, CE org and migration seeded
- Webflow: read-only API token active
- Firecrawl: key in .env, initial crawl complete
- GitHub: galaxyfunk/mygratr (private)

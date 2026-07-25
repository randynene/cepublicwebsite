# SCHEMA.md — Mygratr Database Schema

Version: 0.9
Last updated: Jul 2026 (LAUNCH-PARITY + DESIGN track — hub `faqs`, `calculatorRate` object + calculator `rates`, `teamMember.ukOnly`, static-page `calendlyUrl`; hub `featuredArticles`/`featuredItems` cap 2 -> 5. See "Sanity schema additions (Launch-parity + design, Jul 2026)" below. Prior: STATIC-3 `navigation.announcementBar`. Backfill of CONTENT-1B/1C/1D version-history rows remains Tech Debt #33.)

## Sanity schema additions (Launch-parity + design, Jul 2026)

All additive; no migration state transition (`migrations.status` stays `content_complete`).

**Hub singletons** (`studio/schemas/singletons/_factories.ts`):
- **`faqs`** — added to `defineBlogHub` AND `defineCollectionHub` (was only on `defineCalculatorPage`). `array of faqItem`, max 20. Rendered below the grid + emitted as FAQPage JSON-LD. Populated on the 6 Knowledge Hubs + `/services` + `/technology` by `npm run content:capture-hubs`.
- **`featuredArticles` / `featuredItems` cap raised 2 -> 5.** The D3 hub design's featured block is 1 large + 4 small = 5. Projected + rendered; auto-fills from most-recent when unpinned (`site/src/lib/blog/featured.ts`).
- `introContent` (pre-existing field) is now PROJECTED and rendered — it never was before, which is why hubs shipped as a headline over a grid (Tech Debt #44).

**Calculator pages** (`_factories.ts` `defineCalculatorPage` + new object):
- **`rates`** — `array of calculatorRate`, on `priceComparisonCalculatorPage`. The in-house-vs-CE rate card. Seeded from live via `npm run content:seed-calculator-rates` (6 rows: US/UK x junior/mid/senior).
- **`calculatorRate`** (NEW object, `studio/schemas/objects/calculator-rate.ts`) — region (usa|uk) + role (junior|mid|senior) + salary + cloudEmployeeCost + trainingCost + recruitmentPct, plus region-specific on-costs (US: benefitsPct/ficaPct/ficaWageBase/futaFlat/medicarePct; UK: niPct/holidayWeeks). Formulas live in code (`site/src/lib/calculators/price-comparison.ts`); numbers live here so Seb can update stale market salaries without a deploy. The hiring-cost calculator's model is in code only (recovered from a minified bundle; move to Sanity if CE want self-serve — Tech Debt #60).

**Static pages** (`_factories.ts` `defineStaticPage`):
- **`calendlyUrl`** — url. Renders an inline Calendly booking widget below the hero. Every post-conversion page carries one on live (`/book-a-call`, the thank-yous, `/contact`). Counted as content by the empty-page guard (a booking widget IS the page on `/book-a-call`). Captured from live markup, not hardcoded.
- 7 NEW static-page singletons registered: `bookACallPage`, `bookACallConfirmedPage`, `bookACallThankYouPage`, `thankYouPage`, `thankYouCultureMatchPage`, `thankYouForYourMessagePage`, `thankYouNowBookACallPage`.

**teamMember** (`studio/schemas/documents/team-member.ts`):
- **`ukOnly`** — boolean. Renders under `/uk/team/...` only; the US page 404s. Models Webflow's PER-LOCALE publishing, which the global `retired` flag cannot express. Exactly 1 doc uses it (Caitlin Murray). Read via `VISIBLE_IN_LOCALE` GROQ filter (`site/src/lib/sanity/queries/_filters.ts`), which takes a `$locale` param. Editorial follow-up: Tech Debt #58.

**start-hiring** (`studio/schemas/documents/start-hiring-step.ts`, prior in this branch):
- `startHiringStep` docs with `ukOnly` boolean. Order is COMPUTED per locale in code, not stored (US funnel 8 steps, UK 9 — `/uk/start-hiring/get-started` is a real entry page). NOT `metaFields()` — the funnel is noindex.

**Retirement** (`studio/schemas/_shared.ts` `retiredField()`, prior in this branch):
- `retired` boolean on detail-doc types. Excluded from routing/listing/sitemap via `NOT_RETIRED = !(retired == true)` (NOT `!retired` — the field is undefined on pre-existing docs and `!undefined` is not true in GROQ). 35 docs retired in Phase 0.

## STATIC-2 schema additions (May 2026)

**Navigation global** (`studio/schemas/globals/navigation.ts`):
- `primaryLinks[].dropdownType` — enum (`none | services-mega | how-it-works-mega | resources-mega`), discriminator for STATIC-3 mega-menu mounting
- `servicesMegaMenu` — object. `leftColumn` (sectionLabel + sectionLink + sectionLabelStyle pill-enum + `highlightedItems[]→reference[service|technology]` max-2 + `items[]→reference[service|technology]` flat + viewAllLink). `rightColumnTop` (same shape; "By Technology"). `rightColumnBottom.sections[]` max-2 (AI Services + Product Builds).
- `howItWorksMegaMenu` — object. `cards[]` max-3 (title + subtitle + inline `image` with `altRequired: true, required: true` + ctaLabel + ctaUrl). `bottomPanel` (heading + subheading + inline image + ctaLabel + ctaUrl).
- `resourcesMegaMenu` — object. `leftColumn` (sectionLabel + items[] with discriminated `icon: {source: 'material-font'|'asset', name, asset, alt}` validated via `Rule.custom()`). `middleColumn` (sectionLabel + viewAllLink + `featuredPosts[]→reference[blogPost]` max-3). `rightColumn` (sectionLabel + viewAllLink + `featuredStories[]→reference[customerStory]` max-3).
- **`announcementBar`** (STATIC-3, Jul 2026) — object. `enabled` boolean (required, default false). `badgeLabel` optional max 20. `message` max 120, required when enabled (`Rule.custom()`). `linkLabel` optional max 40. `linkUrl` plain string (internal paths allowed). When `enabled: false`, renderer returns null and reserves no layout space.
- Legacy preserved (marked ⚠️ Legacy): `primaryLinks[].cmsDriven`, `primaryLinks[].cmsCollection`, `primaryLinks[].dropdownItems`, `localeDropdown`.

**Footer global** (`studio/schemas/globals/footer.ts`):
- `topCtaBlock` — object (heading + statRow + primaryCta + secondaryCta).
- `sections[]` — sectionLabel + 5-variant `sectionLabelStyle` pill-enum + `columns[]` (heading + headingHasArrow + headingUrl + links[]) + optional `bottomPillLinks[]`.
- `talentLocations` — object (sectionLabel + items[]).
- `subscribe` — object (heading + description + formId + submitLabel).
- `bottomBar` — object (copyrightText + links[] + regionSelector with hreflang options).
- Legacy preserved (marked ⚠️ Legacy): `newsletterFormId`, `copyrightText`, `columns`, `legalLinks`.

**Service + Technology documents:**
- `service.tagline` — optional string, max 80 chars. Description: "Short tagline used by Services mega-menu..."
- `technology.tagline` — same shape; "By Technology" column.

**Shared helper** (`studio/schemas/_shared.ts`):
- `imageField(name, title, { altRequired?: boolean })` — `altRequired: true` applies `Rule.required()` to alt subfield. Used by HIW card image + bottom panel image.

**Migration discipline:** Additive only. Legacy fields populated by reseed for STATIC-1 render regression safety; cleanup deferred to a future schema-cleanup phase (Tech Debt #40).

## Tables

### organisations
Purpose: One row per customer org. CE is the seed.
| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| name | text | NO | — | Display name |
| slug | text | NO | — | Unique URL-safe identifier |
| plan | text | NO | 'internal' | internal / guided / dfy |
| created_at | timestamptz | NO | now() | — |
| updated_at | timestamptz | NO | now() | — |

### migrations
Purpose: One row per site migration. Tracks state across all phases.
| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| org_id | uuid | NO | — | FK → organisations |
| source_domain | text | NO | — | e.g. cloudemployee.io |
| target_domain | text | YES | — | e.g. staging.jakevibes.dev |
| status | text | NO | 'pending' | MigrationStatus enum |
| current_phase | text | NO | 'foundation' | Active phase name |
| tier | text | NO | 'internal' | internal / guided / dfy |
| started_at | timestamptz | NO | now() | — |
| completed_at | timestamptz | YES | — | Set on completion |
| metadata | jsonb | NO | {} | Phase-specific metadata |
| created_at | timestamptz | NO | now() | — |
| updated_at | timestamptz | NO | now() | — |

### audit_manifests
Purpose: Full Phase 1 audit output per migration.
| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| org_id | uuid | NO | — | FK → organisations |
| migration_id | uuid | NO | — | FK → migrations |
| total_pages | integer | NO | 0 | Confirmed indexable page count |
| total_collections | integer | NO | 0 | CMS collection count |
| total_cms_items | integer | NO | 0 | Total items across all collections |
| total_forms | integer | NO | 0 | Form count |
| page_inventory | jsonb | NO | [] | Array of PageRecord |
| collection_inventory | jsonb | NO | [] | Array of CollectionRecord |
| form_inventory | jsonb | NO | [] | Array of FormRecord |
| custom_code_inventory | jsonb | NO | [] | Array of CustomCodeRecord |
| raw_sitemap_urls | jsonb | NO | [] | All crawled URLs |
| generated_at | timestamptz | NO | now() | — |
| created_at | timestamptz | NO | now() | — |
| updated_at | timestamptz | NO | now() | — |

### schema_designs
Purpose: Sanity schema per CMS collection, versioned.
| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| org_id | uuid | NO | — | FK → organisations |
| migration_id | uuid | NO | — | FK → migrations |
| collection_slug | text | NO | — | Webflow collection slug |
| collection_display_name | text | NO | — | Human-readable name |
| sanity_schema | jsonb | NO | {} | Full Sanity schema definition |
| version | integer | NO | 1 | Increments on revision |
| status | text | NO | 'draft' | draft / reviewed / approved |
| specialist_reviewed | boolean | NO | false | Async specialist sign-off |
| notes | text | YES | — | Design notes |
| created_at | timestamptz | NO | now() | — |
| updated_at | timestamptz | NO | now() | — |

### content_migrations
Purpose: Per-collection migration state and parity tracking.
| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| org_id | uuid | NO | — | FK → organisations |
| migration_id | uuid | NO | — | FK → migrations |
| collection_slug | text | NO | — | Webflow collection slug |
| source_item_count | integer | NO | 0 | Count in Webflow |
| migrated_item_count | integer | NO | 0 | Count in Sanity |
| parity_score | numeric(5,2) | YES | — | % match, 100 = perfect |
| status | text | NO | 'pending' | pending / running / complete / failed |
| last_run_at | timestamptz | YES | — | Last run timestamp |
| error_log | jsonb | NO | [] | Array of error messages |
| created_at | timestamptz | NO | now() | — |
| updated_at | timestamptz | NO | now() | — |

UNIQUE (org_id, migration_id, collection_slug) — `content_migrations_org_migration_collection_unique`. Added in v0.6 to support per-slug upsert from CONTENT-1A migrators.

### template_builds
Purpose: Per-template build attempt linked to git SHA and QA score.
| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| org_id | uuid | NO | — | FK → organisations |
| migration_id | uuid | NO | — | FK → migrations |
| template_type | text | NO | — | TemplateType enum value |
| git_sha | text | YES | — | Git commit SHA |
| preview_url | text | YES | — | Vercel preview URL |
| current_qa_score | numeric(5,2) | YES | — | Latest QA score 0-100 |
| status | text | NO | 'pending' | pending / building / qa / passed / failed / escalated |
| attempt_count | integer | NO | 0 | Build+QA cycle count |
| created_at | timestamptz | NO | now() | — |
| updated_at | timestamptz | NO | now() | — |

### qa_runs
Purpose: Per-page Playwright QA run results.
| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| org_id | uuid | NO | — | FK → organisations |
| migration_id | uuid | NO | — | FK → migrations |
| template_build_id | uuid | NO | — | FK → template_builds |
| template_type | text | NO | — | TemplateType enum value |
| page_url | text | NO | — | URL tested |
| passed | boolean | NO | false | Overall pass/fail |
| visual_diff_score | numeric(5,2) | YES | — | pixelmatch score 0-100 |
| content_diff_passed | boolean | YES | — | Text content match |
| meta_diff_passed | boolean | YES | — | Meta tags match |
| structured_data_diff_passed | boolean | YES | — | JSON-LD match |
| lighthouse_scores | jsonb | NO | {} | {performance, seo, accessibility, bestPractices} |
| failure_reasons | jsonb | NO | [] | Specific failure descriptions |
| screenshot_paths | jsonb | NO | {} | {mobile, tablet, desktop} |
| attempt_number | integer | NO | 1 | Which attempt |
| run_at | timestamptz | NO | now() | — |
| created_at | timestamptz | NO | now() | — |

### redirects
Purpose: URL preservation map for cutover.
| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| org_id | uuid | NO | — | FK → organisations |
| migration_id | uuid | NO | — | FK → migrations |
| source_url | text | NO | — | Original URL |
| target_url | text | NO | — | New URL |
| status_code | integer | NO | 301 | 301 or 302 |
| tested | boolean | NO | false | Has redirect been verified |
| test_passed | boolean | YES | — | Did test pass |
| created_at | timestamptz | NO | now() | — |
| updated_at | timestamptz | NO | now() | — |

### launches
Purpose: Post-launch monitoring state.
| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| org_id | uuid | NO | — | FK → organisations |
| migration_id | uuid | NO | — | FK → migrations |
| cutover_date | timestamptz | YES | — | DNS cutover timestamp |
| gsc_indexed_count | integer | YES | — | Post-cutover indexed pages |
| gsc_baseline_count | integer | YES | — | Pre-cutover baseline |
| rank_preservation_score | numeric(5,2) | YES | — | % keywords within 1.5 spots |
| alert_thresholds | jsonb | NO | {} | Configurable triggers |
| monitoring_active | boolean | NO | false | 30-day monitoring running |
| status | text | NO | 'pending' | pending / monitoring / complete / alerted |
| created_at | timestamptz | NO | now() | — |
| updated_at | timestamptz | NO | now() | — |

## Indexes

| Name | Table | Columns |
|---|---|---|
| idx_migrations_org_id | migrations | org_id |
| idx_migrations_status | migrations | status |
| idx_audit_manifests_migration_id | audit_manifests | migration_id |
| idx_audit_manifests_org_id | audit_manifests | org_id |
| idx_schema_designs_migration_id | schema_designs | migration_id |
| idx_schema_designs_org_id | schema_designs | org_id |
| idx_content_migrations_migration_id | content_migrations | migration_id |
| idx_content_migrations_org_id | content_migrations | org_id |
| idx_template_builds_migration_id | template_builds | migration_id |
| idx_template_builds_org_id | template_builds | org_id |
| idx_qa_runs_migration_id | qa_runs | migration_id |
| idx_qa_runs_template_build_id | qa_runs | template_build_id |
| idx_qa_runs_org_id | qa_runs | org_id |
| idx_redirects_migration_id | redirects | migration_id |
| idx_redirects_org_id | redirects | org_id |
| idx_launches_migration_id | launches | migration_id |
| idx_launches_org_id | launches | org_id |

## Seeded Data

| Entity | ID |
|---|---|
| Cloud Employee org | ce000000-0000-0000-0000-000000000001 |
| CE migration | ce000000-0000-0000-0000-000000000002 |

## Version History

| Version | Date | Changes |
|---|---|---|
| 0.1 | April 2026 | Initial schema — 10 tables created |
| 0.2 | April 2026 | MYGRATR-AUDIT-1: No schema changes (no DDL, no new tables, no new columns, no new constraints). First write to `audit_manifests` table: row `708d9d52-7721-4c8d-bc78-a6e31ffb3225` inserted for CE migration with `total_pages=602`, `total_collections=33`, `total_cms_items=451`, `total_forms=3`, plus JSONB payloads (page_inventory, collection_inventory, form_inventory, custom_code_inventory, raw_sitemap_urls). Also: `migrations` row for CE migration updated — `current_phase` and `status` moved from `foundation`/`pending` to `audit_complete`/`audit_complete`, with `metadata` payload of phase counts. |
| 0.3 | April 2026 | MYGRATR-SCHEMA-0: No schema changes (no DDL, no new tables, no new columns, no new constraints, no new indexes, no new RPC functions, no data migrations). Doc-only phase producing the locked Sanity schema design doc (`docs/MYGRATR_SCHEMA_DESIGN_DECISIONS.md` v1.2) as input to SCHEMA-1. No rows written to Supabase in this phase — `schema_designs` table remains empty; first rows inserted in SCHEMA-1. `migrations.current_phase` unchanged (still `audit_complete`). |
| 0.4 | April 2026 | MYGRATR-SCHEMA-1: No DDL changes. First write to `schema_designs` table — 21 rows inserted for CE migration, one per Sanity document type, all with `version=1`, `status='approved'`, `specialist_reviewed=false`, populated `sanity_schema` JSONB summary (typeName, schemaFile, sourceCollections, sourceItemCount, fieldCount, requiredFields, referenceFields, notes) and `notes` text column. Collection slugs: blogs-consolidated (7 Webflow blog collections → blogPost), tags-consolidated (6 Tags collections → tag), plus 19 single-mapping slugs. `migrations` row for CE: `status` moved `audit_complete` → `schema_running` → `schema_complete`, `current_phase` mirrors, `metadata.schema_phase` added with counts `{document_types:21, singletons:31, globals:3, objects:16, completed_at:"2026-04-24T11:08:54.363Z"}`. Both transitions passed through `assertValidTransition()` (src/lib/pipeline/state-machine.ts). |
| 0.5 | April 2026 | MYGRATR-SCAFFOLD-1: No schema changes (no DDL, no new tables, no new columns, no new constraints, no new indexes, no new RPC functions, no data migrations). Phase ran end-to-end against the v0.4 schema. `migrations` row for CE: `status` moved `schema_complete` → `scaffold_running` → `scaffold_complete`, `current_phase` mirrors, `metadata.scaffold_phase` added with `{completed_at:"2026-04-25T03:20:48.524Z", vercel_preview_url:"https://mygratr-c3utcgloa-cloud-employee.vercel.app"}`. Both transitions passed through `assertValidTransition()` (src/lib/pipeline/state-machine.ts). No rows written to other tables — the `redirects` table is still empty (its first write happens in MYGRATR-LAUNCH; in SCAFFOLD-1 the redirect map lives in `next.config.ts` only). |
| 0.6 | April 2026 | MYGRATR-CONTENT-1A: One DDL change — added `content_migrations_org_migration_collection_unique` UNIQUE constraint on `content_migrations(org_id, migration_id, collection_slug)` via Supabase SQL editor (direct `pg` from scripts is currently blocked — see CLAUDE.md Tech Debt #12). No new tables/columns/indexes/RPCs. First writes to `content_migrations` — 5 rows inserted for CE migration, one per slug: `tags-consolidated` (22/22), `blog-categories` (6/6), `glassdoor-reviews` (10/10), `benefit-values` (9/9), `staff-benefits` (6/6); all `status='complete'`, `parity_score=100`, `error_log=[]`. `migrations` row for CE: `status` moved `scaffold_complete` → `content_running`; `current_phase` mirrors; metadata.scaffold_phase preserved (no `content_phase` block written yet — closes in CONTENT-1C). Transition passed through `assertValidTransition()`. |
| 0.6 | May 2026 | MYGRATR-CONTENT-1E: No Supabase DDL. Sanity Studio schema extended additively — `videoEmbed` + `table` array members added to `studio/schemas/objects/portable-text.ts` (deployed to production Studio via `sanity deploy` at Checkpoint 2). See "Sanity Schema Extensions (Post-SCHEMA-1)" below for shape. +1 `content_migrations` row inserted for CE migration: `w-embed-recovery` (79/79 eligible after CONTENT-1C dedup; `status='complete'`, `parity_score=100`); bringing CE row total 42 → 43. `migrations` row for CE: `status` and `current_phase` unchanged at `content_complete` (post-phase patch invariant — CONTENT-1E does not transition state). Note: version-history table missing per-phase rows for CONTENT-1B / 1C / 1D / 1D-CLEANUP — logged as CLAUDE.md Tech Debt #33 for pre-launch backfill. |

---

## Sanity Schema Extensions (Post-SCHEMA-1)

Schema additions made AFTER the initial SCHEMA-1 build, grouped by phase.
None involve Supabase DDL — all extend `studio/schemas/`.

### CONTENT-1D, May 2026

CONTENT-1D ran no Supabase DDL. The Sanity studio schemas were extended
retroactively as part of Step 0a — the only structural-data note worth
recording here.

#### New shared helpers in `studio/schemas/_shared.ts`

- `sourceTrackingFieldsCarryover()` — applies the §7.2 source-tracking
  triplet (`source`, `generatedAt`, `needsReview`) to schemas that
  already have published content. Differences from the existing
  `sourceTrackingFields()` (used by `technology` / `service`):
  - `source` is `hidden: true` and NOT required (F18: `initialValue`
    does NOT retroactively populate; required would fail validation
    on existing docs).
  - `generatedAt` is `hidden: true`.
  - `needsReview` is visible (drives Seb's review queue).
- `metaSourceFields()` — returns the split per-field provenance pair
  (`metaTitleSource`, `metaDescriptionSource`). Both are hidden
  `object` types with `provider`, `scrapedAt`, `url` sub-fields.

#### Schemas modified

- `customer-story.ts`, `team-member.ts`, `review.ts`, `book-a-call.ts`
  — added `...sourceTrackingFieldsCarryover()` + `...metaSourceFields()`.
- `technology.ts`, `service.ts` — added `...metaSourceFields()` only
  (already had `...sourceTrackingFields()`).

#### Zod twins

- `src/types/sanity/shared.ts` — new `MetaSourceFieldsSchema` and
  `SourceTrackingFieldsCarryoverSchema` (all fields optional;
  pre-CONTENT-1D docs have these undefined despite Studio
  `initialValue`).
- 6 corresponding `src/types/sanity/documents/*.ts` files extended via
  `.merge()` of the appropriate combo.

#### Studio production deploy

First-ever deploy at `https://mygratr-cloudemployee.sanity.studio/`
(hostname `mygratr-cloudemployee` chosen by user). `appId` pinned in
`studio/sanity.cli.ts` for non-interactive future deploys.

#### Supabase impact

None. `migrations.metadata.content_phase` block populated with
CONTENT-1D completion metadata (388 docs / 0 smoke-test remaining /
38 content_migrations rows at CONTENT-1D close — stale; actual 42
post-CONTENT-1D-CLEANUP / phases list). 14 new
`content_migrations` rows added to existing schema in CONTENT-1D
(no DDL — same columns); +4 cleanup audit rows added in
CONTENT-1D-CLEANUP (cleanup-service-null-thumbnail,
cleanup-technology-null-image-fields,
cleanup-technology-null-folds-featured-image,
cleanup-customerstory-null-image-fields), bringing CE migration's
content_migrations row total to 42. DESIGN-1 Step 0a refreshes the
metadata.content_phase.content_migrations_rows value from stale 38
to actual 42.

### CONTENT-1E, May 2026

CONTENT-1E ran no Supabase DDL. The Sanity Studio `portableText`
object schema was extended additively to recover Webflow RichText
embed wrappers flattened by CONTENT-1C's `@sanity/block-tools` pass.
Studio production deploy landed at Checkpoint 2 (before any migrator
ran — HARD GATE per CONTENT-1D precedent).

#### Schema modified — `studio/schemas/objects/portable-text.ts`

Two new `defineArrayMember` entries appended to the `portableText.of[]`
array (now 5 members total: `block`, `image`, `videoEmbed`, `table`):

- `videoEmbed` (object): `url` (url, required) + `caption` (string,
  optional). Preview composes `{title: caption ?? '(no caption)',
  subtitle: url}`. Renderer routes through E2 VideoEmbed primitive
  (eager mode). Provider auto-detect supports Vimeo / YouTube /
  LinkedIn (LinkedIn added in CONTENT-1E `parseVideoUrl` extension).
- `table` (object): `headerRows` (array of `tableHeaderRow` — inline
  object with `cells: string[]`) + `bodyRows` (array of `tableBodyRow`
  — same shape) + `caption` (string, optional) + `boldFirstColumn`
  (boolean, optional). Preview surfaces row counts. Cells are
  `string[]` per CONTENT-1E sweep (zero `<a>` inside CE table cells —
  link-bearing-cells upgrade to PortableText[] is additive future
  work). Inline row types named `tableHeaderRow` / `tableBodyRow`
  prevent Sanity anonymous-inline-object warnings.

Sitewide blast: `portableText` is referenced by `singletons/_factories.ts`
+ `objects/section.ts` + every document type whose body field uses it
— so editors see "Video embed" + "Data table" insert options anywhere
PortableText is used. Existing PortableText docs continue to validate
(additive extension).

#### Block-tools parallel registration — `src/lib/content/migration-helpers.ts`

The block-tools `defaultSchema` mirrors the studio shape (separate
schema-compile internals, kept in sync by convention):

- `videoEmbed` registered as `{type: 'object', name: 'videoEmbed',
  fields: [{type: 'url', name: 'url'}, {type: 'string', name:
  'caption'}]}`.
- `table` registered with the same headerRows / bodyRows / caption /
  boldFirstColumn shape, including the `tableHeaderRow` / `tableBodyRow`
  inline objects with `cells: array[string]`.

This registration is what permits `htmlToBlocks(...)` to emit blocks
of these `_type` values during the CONTENT-1E migrator pass.

#### Zod twins

No new Zod additions in CONTENT-1E — `site/src/types/sanity/documents/blog-post.ts`
already treated `content: array[unknown()]` per CONTENT-1B's
PortableText decision (deferred narrowing to TEMPLATE-*). The new
block types pass through the `unknown()` boundary cleanly. PortableText
narrowing to discriminated-union types remains TEMPLATE-* scope.

#### Studio production deploy

Re-deploy at `https://mygratr-cloudemployee.sanity.studio/` via
`cd studio && npm run deploy` (Checkpoint 2). Build clean (29.7s).
Deployment was a HARD GATE — migrator carried top-of-file `// HARD GATE`
comment, and verifier Check 1 round-trips a `videoEmbed` block to
confirm production schema accepts the new type.

#### Supabase impact

1 row added to `content_migrations` for CE migration:
`w-embed-recovery` — `migrated=79`, `parityBaselineCount=79`
(eligible-after-dedup), `parity_score=100`, `status='complete'`,
6 errorLog entries (success summary + dedup-semantics note).
Brings CE migration row total 42 → 43. `migrations.status` and
`migrations.current_phase` UNCHANGED at `content_complete` — CONTENT-1E
is a post-phase patch by design (Sanity-side data fix, no state-machine
transition).

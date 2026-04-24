# SCHEMA.md — Mygratr Database Schema

Version: 0.4
Last updated: April 2026

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

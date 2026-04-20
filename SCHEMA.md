# SCHEMA.md — Mygratr Database Schema

Version: 0.1
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

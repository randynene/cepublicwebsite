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

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

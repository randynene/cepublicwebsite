# CLAUDE.md — Mygratr

> Read this file first. Every session. No exceptions.
> If this file is getting long, see REGISTRY.md for route/component/table lists.

## What Mygratr Is

Automated website migration platform. Takes a production website on a
legacy CMS (Webflow first, then WordPress/Squarespace/Wix) and rebuilds
it on Next.js + Sanity through a six-phase agentic pipeline:
Audit → Schema → Scaffold → Content → Build → QA → Launch.

Parent brand: Saxon.io. Owner: Jake Hall (non-developer, directs Claude Code).

## Current Phase

**MYGRATR-SCAFFOLD-1 — Next.js Scaffold** — IN PROGRESS

| Phase | Name | Status |
|---|---|---|
| MYGRATR-0 | Foundation | ✅ Complete |
| MYGRATR-AUDIT-1 | Site Audit Agent | ✅ Complete |
| MYGRATR-SCHEMA-0 | Schema Design Lock | ✅ Complete |
| MYGRATR-SCHEMA-1 | Sanity Schema Design | ✅ Complete |
| **MYGRATR-SCAFFOLD-1** | **Next.js Scaffold** | 🔄 **In Progress** |
| MYGRATR-CONTENT-1 | Content Migration | Planned |
| MYGRATR-TEMPLATE-* | Template Build | Planned |
| MYGRATR-QA-1 | Visual + Structural QA | Planned |
| MYGRATR-LAUNCH | Cutover + Redirects | Planned |
| MYGRATR-MONITOR-1 | Post-cutover SEO | Planned |

## First Customer: Cloud Employee

- Source: Webflow (cloudemployee.io)
- Target: Next.js + Sanity, hosted on Vercel
- Staging: staging.jakevibes.dev
- Locales: US (default) + UK (/uk/ prefix)
- PH locale: discontinued — Geotargetly routes to talent.cloudemployee.io
- Pages: 522 indexable (sitemap.xml)
- Crawled URLs: 643 total including pagination/archives/locale mirrors
- CMS Collections: 33
- CMS Items: 451 total (post-audit Webflow API count, up from 435 at MYGRATR-0)
- Forms: 25 in HubSpot portal, **3 embedded on live pages** (verified via Forms v2 API)
- Custom code: inventoried in AUDIT-1 — see `audit-output/ce-template-custom-code.json`

**Audit data state (as of AUDIT-1 complete):**
- 636 canonical URLs · 602 indexable (288 US + 314 UK) · 30 redirects · 11 regex redirects
- 312 US pages content-extracted (`audit-output/pages/`)
- 44 screenshots captured across 3 breakpoints
- 608 unique CDN assets (124 site / 341 CMS / 143 external)
- 17 global third-party scripts (GTM `GTM-WL45TCTW`, GA4 `G-2Q22ZM5PLY`,
  LinkedIn `4901289`, Clara, Hotjar, Finsweet, Swiper, GSAP, GeoTargetly,
  Calendly)
- `audit_manifests` row `708d9d52-7721-4c8d-bc78-a6e31ffb3225` in Supabase
- `migrations.current_phase = audit_complete` for CE migration

**Schema design state (as of SCHEMA-0 complete):**
- `docs/MYGRATR_SCHEMA_DESIGN_DECISIONS.md` LOCKED at v1.2 — 21 Sanity
  document types, ~30 singletons, 3 hardcoded routes, 6 globals, 32
  locked decisions. Authoritative input to SCHEMA-1.
- `docs/CE_SITE_TRUTH.md` — structured source-of-truth (3,615 lines).
- Two red-team audits of the design doc (v1.0 → v1.1 → v1.2) — all
  HIGH and missing-coverage findings resolved; no structural blockers.
- Redirects verification closed: 336 of 653 Webflow redirects collapse
  to one regex; 317 preserved individually. See
  `docs/investigations-2026-04-23/redirects-verification.md`.

**Schema build state (as of SCHEMA-1 complete):**
- Sanity Studio v5 scaffolded at `studio/` (project `lzbhll1u`, dataset
  `production`). 71 schema types registered and Studio build passes.
- 21 CMS document types under `studio/schemas/documents/`, 31 singletons
  under `studio/schemas/singletons/`, 3 globals under
  `studio/schemas/globals/`, 16 shared/polymorphic objects under
  `studio/schemas/objects/` (incl. 12 section variants).
- Matching Zod types under `src/types/sanity/` — 55 files.
- `docs/WEBFLOW_TO_SANITY_FIELD_MAP.md` — field-level mapping for every
  Webflow collection; consumed by CONTENT-1.
- Supabase `schema_designs`: 21 rows, all `version=1` / `status='approved'`
  (slugs: blogs-consolidated, compare-blogs, technology-pages, services,
  customer-stories, team-members, reviews, videos, downloads,
  downloads-access-pages, tools-quizzes, book-a-call-pages,
  events-webinars, glassdoor-reviews, client-benefits-company-values,
  staff-benefits, tags-consolidated, hubs, industry-placeholder,
  persona-placeholder, location-placeholder).
- `migrations.status = schema_complete` / `current_phase = schema_complete`
  for CE migration. `metadata.schema_phase` records the counts.
- Sanity production dataset: 34 stub singleton/global docs seeded
  (createIfNotExists, idempotent) + 5 `smoke-test-*` integration-test
  docs created.

## Tech Stack

| Layer | Choice |
|---|---|
| Language | TypeScript (strict) |
| Runtime | Node.js |
| Database | Supabase (mygratr, Singapore) |
| Target CMS | Sanity |
| Generated sites | Next.js 16 + Tailwind |
| Hosting | Vercel |
| QA Agent | Playwright + pixelmatch + Claude vision |
| Source readers | Webflow API v2 + Firecrawl |

## Supabase

- Project: mygratr
- URL: https://xpzrhzfzppypxbipvyzm.supabase.co
- Region: ap-southeast-1 (Singapore)
- RLS: enabled on all tables
- org_id on every table

## Cloud Employee IDs (Seeded)

- org_id:       ce000000-0000-0000-0000-000000000001
- migration_id: ce000000-0000-0000-0000-000000000002

## Environment Variables

| Variable | Description |
|---|---|
| WEBFLOW_API_TOKEN | Webflow read-only API token |
| WEBFLOW_SITE_ID | 673326831abed6267051fa11 |
| SUPABASE_URL | https://xpzrhzfzppypxbipvyzm.supabase.co |
| SUPABASE_SERVICE_ROLE_KEY | In .env — never commit |
| FIRECRAWL_API_KEY | In .env — never commit |
| ANTHROPIC_API_KEY | In .env — required for Steps 4 and 7 (Claude Opus 4.7) |
| HUBSPOT_ACCESS_TOKEN | In .env — private app token with `forms` scope (AUDIT-1) |
| HUBSPOT_PORTAL_ID | In .env — CE HubSpot portal ID (AUDIT-1) |
| AHREFS_API_KEY | In .env — REST v3 key for SEO baseline (AUDIT-1) |
| SANITY_PROJECT_ID | In .env — for SCHEMA-1 |
| SANITY_DATASET | In .env — for SCHEMA-1 |
| SANITY_API_TOKEN | In .env — for SCHEMA-1 |
| SUPABASE_DB_URL | In .env — Postgres direct URL (migrations) |

## Repo Structure

| Path | Purpose |
|---|---|
| /CLAUDE.md | This file — read first |
| /CONVENTIONS.md | Code patterns and naming rules |
| /CHANGELOG.md | One paragraph per completed phase |
| /PHASE_HISTORY.md | Detailed phase records |
| /docs/SCHEMA.md | Database schema source of truth |
| /docs/FEATURE_MAP.md | Feature → file mapping |
| /docs/context/REGISTRY.md | Growing lists — tables, routes, scripts, components |
| /docs/briefs/active/ | Current session brief |
| /docs/briefs/archive/ | Completed session briefs |
| /docs/SKILLS/ | Reusable Claude skill definitions (post-phase-update, etc.) |
| /audit-output/ | Audit artefacts (gitignored — contains PII) |
| /scripts/ | One-off run scripts (Webflow, Firecrawl bootstrap) |
| /scripts/audit/ | Full audit pipeline (14 steps + 3 orchestrators) |
| /src/orchestrator/ | Job runner and phase orchestration |
| /src/lib/adapters/webflow/ | WebflowAdapter (AUDIT-1 uses REST directly pending adapter) |
| /src/lib/types.ts | Domain types + Zod schemas |
| /src/lib/audit-types.ts | Audit pipeline enums and interfaces |

## Architecture Rules — Non-Negotiable

1. **TypeScript only.** No Python. No shell scripts for logic.
2. **Adapter pattern for all CMS interactions.** No direct Webflow API calls outside `src/lib/adapters/`.
3. **Migrations before code.** Verify SQL runs in Supabase before writing dependent code.
4. **org_id on every table, every query.** No exceptions.
5. **assertValidTransition() before every status update.** No silent phase jumps.
6. **Artefact storage split.** Supabase stores paths. Filesystem stores blobs.
7. **Config maps over conditionals.** No `if (sourceType === 'x')` branches.
8. **Never recreate existing database functions.** Check REGISTRY.md first.
9. **CE-specific values in env or seed data only.** Never hardcoded in lib logic.
10. **Git commit after every working step.** Not at end of session.
11. **If Claude Code needs to make an architecture decision not covered by the brief: STOP and ask.**

## Session Lanes — Stay In Your Lane

| Session Type | Touches | Never Touches |
|---|---|---|
| AUDIT | `/src/lib/adapters/`, `/scripts/`, `audit_manifests` table | QA agent code, template code |
| SCHEMA | `/src/lib/schema/`, `schema_designs` table | Adapter code, QA agent code |
| SCAFFOLD | Generated Next.js site repo | Orchestrator, adapter code |
| CONTENT | `/src/lib/content/`, `content_migrations` table | Template builds, QA agent code |
| BUILD | Template files in generated site | Orchestrator, adapter code |
| QA | `/src/lib/qa/`, `qa_runs` table | Template code, adapter code |
| LAUNCH | `/src/lib/launch/`, `redirects`, `launches` tables | All build/QA code |
| INFRA | Orchestrator, shared types, Supabase schema | Phase-specific lib code |

**If unsure which lane applies: stop and ask before writing any code.**

## Key Conventions

- TypeScript strict mode — no any types
- Zod for all external data validation
- Every Supabase query includes org_id filter
- RLS always on — service role only for migrations and admin scripts
- Git commit after every working step
- Adapter pattern: all CMS interactions through CmsAdapter interface — see CONVENTIONS.md §2
- Phase transitions: always call assertValidTransition() — see CONVENTIONS.md §2
- Artefact storage: Supabase stores paths, filesystem stores blobs — see CONVENTIONS.md §2
- See CONVENTIONS.md for full patterns
- See REGISTRY.md for all tables, templates, and routes

## Hard Rules — Never Violate

- No CE-specific values hardcoded in lib logic (domains, org IDs, site IDs belong in env or seed data)
- No queries without org_id filter
- No CMS API calls outside the adapter
- No phase status updates without assertValidTransition()
- No template build started without audit screenshots confirmed
- No cutover without redirect parity verified (manifest page count = redirect record count)

## Debugging Rules

- **Never diagnose and fix in the same session.** Diagnosis sessions explore.
  Execution sessions implement. Mixing them causes speculative fixes.
- If a fix attempt fails, do NOT retry the same approach. Write `DEBUG_CONTEXT.md`
  to the repo root: the bug, what was tried, why it failed, current best hypothesis.
- If the same approach is tried twice and fails twice, that approach is a confirmed
  dead end. Log it and never retry it.
- After 2 failed fix attempts on the same bug: **STOP.** Do not improvise a third attempt.
- Every fix must be verified against CONVENTIONS.md before execution. If the fix
  introduces a pattern not in CONVENTIONS.md, that is a blocker — not a note.
- `DEBUG_CONTEXT.md` is temporary. Delete it after the bug is resolved.

## Post-Phase Checklist

After every phase, update in this order:
1. `CHANGELOG.md` — one paragraph: what shipped, what exists
2. `PHASE_HISTORY.md` — detailed record, files created, patterns established, data state
3. `CONVENTIONS.md` — any new patterns that emerged
4. `FEATURE_MAP.md` — new feature entries; update modified feature entries
5. `CLAUDE.md` — phase status, new routes, env vars
6. `SCHEMA.md` — if any migrations ran (do this immediately after migration, before writing dependent code)
7. `REGISTRY.md` — update table, template, and script registries
8. Post-phase code audit — fresh chat, load codebase, verify nothing broken

Only after ALL of the above are complete do you start planning the next phase.

## Known Tech Debt

| # | Source | Description | Fix In |
|---|--------|-------------|--------|
| 1 | MYGRATR-0 | `src/lib/types.ts` is a single flat file — will need splitting by domain once QA and template types are added | MYGRATR-SCAFFOLD-1 |
| 2 | AUDIT-1 | AUDIT-1 called Webflow REST directly instead of using `CmsAdapter` — the adapter interface was not ready. Adapter must wrap Webflow v2 calls before CONTENT-1. | MYGRATR-SCAFFOLD-1 |
| 3 | AUDIT-1 | Firecrawl v4 SDK was bypassed in favour of direct REST calls — align once we upgrade to the new `Firecrawl` / `FirecrawlClient` class. | MYGRATR-CONTENT-1 |
| 4 | AUDIT-1 | Ahrefs account subscription doesn't include cloudemployee.io — baseline snapshot is empty. Needs Ahrefs plan verification before MONITOR-1. | MYGRATR-MONITOR-1 |
| 5 | AUDIT-1 | Nav Technology dropdown merged into Services in `ce-global-components.json` — selector tweak needed before nav is built. | MYGRATR-SCAFFOLD-1 |
| 6 | AUDIT-1 | Playwright `networkidle` times out on Vimeo-embedded video pages (2 captures failed across runs). Switch to `domcontentloaded` for VIDEO template. | MYGRATR-QA-1 |
| 7 | AUDIT-1 | Step 3e `semi_global` count (745+) is inflated because the global-script 80%-of-pages threshold misses scripts that appear on most but not all templates. Consider lowering to 60% or moving more patterns into the explicit `SCRIPT_PATTERNS` list. | MYGRATR-CONTENT-1 |
| 8 | AUDIT-1 | HubSpot access token lacks `automation` scope — workflow cross-reference returned nothing. Verify scope before CONTENT-1 if per-form workflow routing matters. | MYGRATR-CONTENT-1 |
| 9 | AUDIT-1 | 4 canonical URLs remain `UNKNOWN` (Cloudflare challenge script, sitemap.xml, hash URL, `/uk/embedding`). Step 1 content-type filter should drop the first three. | MYGRATR-CONTENT-1 |
| 10 | SCHEMA-1 | Legacy `MigrationStatus` enum in `src/lib/types.ts` uses shortform values — conflicts with canonical string-literal union in `src/lib/pipeline/state-machine.ts`. Needs consolidation. | MYGRATR-CONTENT-1 |
| 11 | SCHEMA-1 | `TemplateType` conflict between string-literal and enum representations across `src/lib/types.ts` and `src/lib/audit-types.ts`. | MYGRATR-CONTENT-1 |

*Last updated: April 2026 — MYGRATR-SCAFFOLD-1 in progress.*
# MYGRATR-0 Session Brief v1.2
## Project Foundation

**Status:** READY FOR BUILD
**Session:** MYGRATR-0
**Date:** April 2026
**Depends on:** Nothing — this is session 1
**Unlocks:** MYGRATR-AUDIT-1

---

## What This Session Builds

Everything that exists before a single line of product code is written.
After this session: the repo is structured, Supabase schema is live,
all context files are written, environment is configured, and Claude Code
can open CLAUDE.md and know exactly what it's working on.

---

## Exit Criteria

- [ ] Repo structure matches the spec below exactly
- [ ] All context files exist in the root and are populated
- [ ] REGISTRY.md exists and is populated
- [ ] Briefs folder structure exists (briefs/active/, briefs/archive/)
- [ ] Supabase schema is live — all tables created, RLS enabled, org_id on every table
- [ ] CE org and migration rows seeded
- [ ] .env is populated and .gitignore excludes it
- [ ] npm install runs clean
- [ ] npx tsc --noEmit passes with zero errors
- [ ] node scripts/webflow-inventory.js runs and produces output (verify existing)
- [ ] node scripts/firecrawl-sitemap.js runs and produces output (verify existing)
- [ ] Git history is clean — one commit per working step
- [ ] Sanity connection verified and project ID documented in credentials

---

## Repo Structure (Final)

```
/
├── CLAUDE.md                  ← root level, read first every session
├── CONVENTIONS.md             ← root level
├── CHANGELOG.md               ← root level
├── SCHEMA.md                  ← root level
├── FEATURE_MAP.md             ← root level
├── PHASE_HISTORY.md           ← root level
├── REGISTRY.md                ← root level — grows as build progresses
│
├── briefs/
│   ├── active/                ← current session brief lives here
│   │   └── MYGRATR-0_BRIEF_v1.1.md
│   └── archive/               ← completed briefs move here after phase closes
│
├── audit-output/              ← already exists
│   ├── ce-inventory.json
│   ├── ce-sitemap.json
│   ├── ce-sitemap-xml.json
│   └── ce-sitemap-diff.json
│
├── docs/
│   └── credentials            ← already exists, never commit
│
├── scripts/                   ← already exists
│   ├── webflow-inventory.js
│   └── firecrawl-sitemap.js
│
├── src/
│   ├── orchestrator/          ← empty, future job runner
│   ├── adapters/
│   │   └── webflow/           ← empty, future WebflowAdapter
│   └── lib/
│       └── types.ts           ← shared TypeScript types
│
├── .env                       ← already exists, never commit
├── .gitignore                 ← already exists
├── package.json               ← already exists
└── tsconfig.json              ← to be created
```

---

## Step-by-Step Build Order

### Step 1 — Verify existing work
```
Verify the following files exist and are non-empty:
- audit-output/ce-inventory.json
- audit-output/ce-sitemap.json
- audit-output/ce-sitemap-xml.json
- audit-output/ce-sitemap-diff.json
- scripts/webflow-inventory.js
- scripts/firecrawl-sitemap.js
- .env (contains FIRECRAWL_API_KEY, WEBFLOW_API_TOKEN, WEBFLOW_SITE_ID, SUPABASE_URL)
- .gitignore (confirm .env is excluded)

Report any missing files before proceeding.
```
Git commit: `chore: verify pre-existing audit output and scripts`

---

### Step 2 — Scaffold repo structure
```
Create the following directories and placeholder files.
Do not add content yet — just create the structure.

- briefs/active/.gitkeep
- briefs/archive/.gitkeep
- src/orchestrator/.gitkeep
- src/adapters/webflow/.gitkeep
- src/lib/types.ts (empty file)

Move the current session brief into briefs/active/ if it exists locally.
```
Git commit: `chore: scaffold repo structure`

---

### Step 3 — Write tsconfig.json
```
Create tsconfig.json in the repo root with:
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "dist",
    "rootDir": "src",
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```
Git commit: `chore: add tsconfig`

---

### Step 4 — Install dependencies
```
Install the following packages.

Production dependencies:
- @supabase/supabase-js
- node-fetch
- @anthropic-ai/sdk
- dotenv
- zod
- playwright
- pixelmatch
- pngjs
- @sanity/client

Dev dependencies:
- typescript
- @types/node
- tsx
- nodemon

Run: npm install
Confirm: no errors, node_modules exists.
```
Git commit: `chore: install dependencies`

---

### Step 5 — Write shared TypeScript types
```
Write src/lib/types.ts with the following content exactly:

import { z } from 'zod';

// ─── Enums ───────────────────────────────────────────────────────────────────

export enum MigrationStatus {
  PENDING = 'pending',
  AUDIT = 'audit',
  SCHEMA = 'schema',
  SCAFFOLD = 'scaffold',
  CONTENT = 'content',
  BUILDING = 'building',
  QA = 'qa',
  LAUNCH = 'launch',
  CUTOVER = 'cutover',
  COMPLETE = 'complete',
  FAILED = 'failed',
}

export enum PhaseStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETE = 'complete',
  FAILED = 'failed',
  ESCALATED = 'escalated',
}

export enum TemplateType {
  HOME = 'home',
  TECHNOLOGY = 'technology',
  SERVICE = 'service',
  BLOG = 'blog',
  COMPARE = 'compare',
  CUSTOMER_STORY = 'customer_story',
  TEAM_MEMBER = 'team_member',
  VIDEO = 'video',
  REVIEW = 'review',
  BOOK_A_CALL = 'book_a_call',
  DOWNLOAD = 'download',
  TOOL = 'tool',
  STATIC = 'static',
  UNKNOWN = 'unknown',
}

export enum Locale {
  US = 'us',
  UK = 'uk',
}

export enum MigrationTier {
  INTERNAL = 'internal',
  GUIDED = 'guided',
  DFY = 'dfy',
}

// ─── Core Domain Interfaces ───────────────────────────────────────────────────

export interface Organisation {
  id: string;
  name: string;
  slug: string;
  plan: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Migration {
  id: string;
  orgId: string;
  sourceDomain: string;
  targetDomain?: string;
  status: MigrationStatus;
  currentPhase: string;
  tier: MigrationTier;
  startedAt: Date;
  completedAt?: Date;
  metadata: Record<string, unknown>;
}

// ─── Audit Interfaces ─────────────────────────────────────────────────────────

export interface FieldRecord {
  id: string;
  slug: string;
  displayName: string;
  type: string;
  required: boolean;
}

export interface CollectionRecord {
  id: string;
  slug: string;
  displayName: string;
  singularName: string;
  fieldCount: number;
  itemCount: number;
  fields: FieldRecord[];
}

export interface PageRecord {
  url: string;
  slug: string;
  title: string;
  locale: Locale;
  templateType: TemplateType;
  isIndexable: boolean;
  screenshotPaths: Partial<Record<'mobile' | 'tablet' | 'desktop', string>>;
}

export interface FormRecord {
  pageUrl: string;
  formName: string;
  fields: string[];
  action: string;
}

export interface CustomCodeRecord {
  pageUrl: string;
  scripts: string[];
  embeds: string[];
}

export interface AuditManifest {
  migrationId: string;
  totalPages: number;
  totalCollections: number;
  totalCmsItems: number;
  totalForms: number;
  pageInventory: PageRecord[];
  collectionInventory: CollectionRecord[];
  formInventory: FormRecord[];
  customCodeInventory: CustomCodeRecord[];
  rawSitemapUrls: string[];
  generatedAt: Date;
}

// ─── QA Interfaces ────────────────────────────────────────────────────────────

export interface LighthouseScores {
  performance: number;
  seo: number;
  accessibility: number;
  bestPractices: number;
}

export interface QAResult {
  templateType: TemplateType;
  pageUrl: string;
  passed: boolean;
  visualDiffScore: number;
  contentDiffPassed: boolean;
  metaDiffPassed: boolean;
  structuredDataDiffPassed: boolean;
  lighthouseScores: LighthouseScores;
  failureReasons: string[];
  attemptNumber: number;
  runAt: Date;
}

// ─── Adapter Interface ────────────────────────────────────────────────────────

export interface CmsAdapter {
  fetchContent(collectionId: string): Promise<unknown[]>;
  listCollections(): Promise<CollectionRecord[]>;
  verifyConnection(): Promise<boolean>;
}

// ─── Zod Schemas (for runtime validation) ────────────────────────────────────

export const FieldRecordSchema = z.object({
  id: z.string(),
  slug: z.string(),
  displayName: z.string(),
  type: z.string(),
  required: z.boolean(),
});

export const CollectionRecordSchema = z.object({
  id: z.string(),
  slug: z.string(),
  displayName: z.string(),
  singularName: z.string(),
  fieldCount: z.number(),
  itemCount: z.number(),
  fields: z.array(FieldRecordSchema),
});

export const PageRecordSchema = z.object({
  url: z.string().url(),
  slug: z.string(),
  title: z.string(),
  locale: z.nativeEnum(Locale),
  templateType: z.nativeEnum(TemplateType),
  isIndexable: z.boolean(),
  screenshotPaths: z.record(z.string()),
});
```
Git commit: `feat: add shared TypeScript types`

---

### Step 6 — Run Supabase migrations

Open the Supabase SQL editor at:
https://supabase.com/dashboard/project/xpzrhzfzppypxbipvyzm/sql

Run each block separately. Confirm success before the next.

```sql
-- BLOCK 1: Enable UUID extension
create extension if not exists "uuid-ossp";
```

```sql
-- BLOCK 2: organisations
create table organisations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  plan text not null default 'internal',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table organisations enable row level security;
```

```sql
-- BLOCK 3: migrations
create table migrations (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organisations(id) on delete cascade,
  source_domain text not null,
  target_domain text,
  status text not null default 'pending',
  current_phase text not null default 'foundation',
  tier text not null default 'internal',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table migrations enable row level security;
create index idx_migrations_org_id on migrations(org_id);
create index idx_migrations_status on migrations(status);
```

```sql
-- BLOCK 4: audit_manifests
create table audit_manifests (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organisations(id) on delete cascade,
  migration_id uuid not null references migrations(id) on delete cascade,
  total_pages integer not null default 0,
  total_collections integer not null default 0,
  total_cms_items integer not null default 0,
  total_forms integer not null default 0,
  page_inventory jsonb not null default '[]',
  collection_inventory jsonb not null default '[]',
  form_inventory jsonb not null default '[]',
  custom_code_inventory jsonb not null default '[]',
  raw_sitemap_urls jsonb not null default '[]',
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table audit_manifests enable row level security;
create index idx_audit_manifests_migration_id on audit_manifests(migration_id);
create index idx_audit_manifests_org_id on audit_manifests(org_id);
```

```sql
-- BLOCK 5: schema_designs
create table schema_designs (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organisations(id) on delete cascade,
  migration_id uuid not null references migrations(id) on delete cascade,
  collection_slug text not null,
  collection_display_name text not null,
  sanity_schema jsonb not null default '{}',
  version integer not null default 1,
  status text not null default 'draft',
  specialist_reviewed boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table schema_designs enable row level security;
create index idx_schema_designs_migration_id on schema_designs(migration_id);
create index idx_schema_designs_org_id on schema_designs(org_id);
```

```sql
-- BLOCK 6: content_migrations
create table content_migrations (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organisations(id) on delete cascade,
  migration_id uuid not null references migrations(id) on delete cascade,
  collection_slug text not null,
  source_item_count integer not null default 0,
  migrated_item_count integer not null default 0,
  parity_score numeric(5,2),
  status text not null default 'pending',
  last_run_at timestamptz,
  error_log jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table content_migrations enable row level security;
create index idx_content_migrations_migration_id on content_migrations(migration_id);
create index idx_content_migrations_org_id on content_migrations(org_id);
```

```sql
-- BLOCK 7: template_builds
create table template_builds (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organisations(id) on delete cascade,
  migration_id uuid not null references migrations(id) on delete cascade,
  template_type text not null,
  git_sha text,
  preview_url text,
  current_qa_score numeric(5,2),
  status text not null default 'pending',
  attempt_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table template_builds enable row level security;
create index idx_template_builds_migration_id on template_builds(migration_id);
create index idx_template_builds_org_id on template_builds(org_id);
```

```sql
-- BLOCK 8: qa_runs
create table qa_runs (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organisations(id) on delete cascade,
  migration_id uuid not null references migrations(id) on delete cascade,
  template_build_id uuid not null references template_builds(id) on delete cascade,
  template_type text not null,
  page_url text not null,
  passed boolean not null default false,
  visual_diff_score numeric(5,2),
  content_diff_passed boolean,
  meta_diff_passed boolean,
  structured_data_diff_passed boolean,
  lighthouse_scores jsonb not null default '{}',
  failure_reasons jsonb not null default '[]',
  screenshot_paths jsonb not null default '{}',
  attempt_number integer not null default 1,
  run_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table qa_runs enable row level security;
create index idx_qa_runs_migration_id on qa_runs(migration_id);
create index idx_qa_runs_template_build_id on qa_runs(template_build_id);
create index idx_qa_runs_org_id on qa_runs(org_id);
```

```sql
-- BLOCK 9: redirects
create table redirects (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organisations(id) on delete cascade,
  migration_id uuid not null references migrations(id) on delete cascade,
  source_url text not null,
  target_url text not null,
  status_code integer not null default 301,
  tested boolean not null default false,
  test_passed boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table redirects enable row level security;
create index idx_redirects_migration_id on redirects(migration_id);
create index idx_redirects_org_id on redirects(org_id);
```

```sql
-- BLOCK 10: launches
create table launches (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organisations(id) on delete cascade,
  migration_id uuid not null references migrations(id) on delete cascade,
  cutover_date timestamptz,
  gsc_indexed_count integer,
  gsc_baseline_count integer,
  rank_preservation_score numeric(5,2),
  alert_thresholds jsonb not null default '{}',
  monitoring_active boolean not null default false,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table launches enable row level security;
create index idx_launches_migration_id on launches(migration_id);
create index idx_launches_org_id on launches(org_id);
```

```sql
-- BLOCK 11: Seed Cloud Employee org and migration
insert into organisations (id, name, slug, plan)
values (
  'ce000000-0000-0000-0000-000000000001',
  'Cloud Employee',
  'cloud-employee',
  'internal'
);

insert into migrations (id, org_id, source_domain, target_domain, status, current_phase, tier)
values (
  'ce000000-0000-0000-0000-000000000002',
  'ce000000-0000-0000-0000-000000000001',
  'cloudemployee.io',
  'staging.jakevibes.dev',
  'pending',
  'foundation',
  'internal'
);
```

Confirm all 11 blocks run successfully.

Git commit: `feat: run initial Supabase schema migrations`

---

### Step 7 — Write CLAUDE.md (root)
```
Write CLAUDE.md in the repo root with this content exactly:

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

**MYGRATR-0 — Foundation** — COMPLETE
**Next: MYGRATR-AUDIT-1** — Site Audit Agent

## First Customer: Cloud Employee

- Source: Webflow (cloudemployee.io)
- Target: Next.js + Sanity, hosted on Vercel
- Staging: staging.jakevibes.dev
- Locales: US (default) + UK (/uk/ prefix)
- PH locale: discontinued — Geotargetly routes to talent.cloudemployee.io
- Pages: 522 indexable (sitemap.xml)
- Crawled URLs: 643 total including pagination/archives/locale mirrors
- CMS Collections: 33
- CMS Items: 435 total
- Forms: 25 (HubSpot — decision pending)
- Custom code: to be inventoried via Firecrawl in MYGRATR-AUDIT-1

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
| ANTHROPIC_API_KEY | In .env — add when needed |

## Repo Structure

| Path | Purpose |
|---|---|
| /CLAUDE.md | This file — read first |
| /CONVENTIONS.md | Code patterns and naming rules |
| /CHANGELOG.md | One paragraph per completed phase |
| /SCHEMA.md | Database schema source of truth |
| /FEATURE_MAP.md | Feature → file mapping |
| /PHASE_HISTORY.md | Detailed phase records |
| /REGISTRY.md | Growing lists — tables, routes, templates |
| /briefs/active/ | Current session brief |
| /briefs/archive/ | Completed session briefs |
| /audit-output/ | Audit artefacts (JSON, screenshots) |
| /scripts/ | One-off run scripts |
| /src/orchestrator/ | Job runner and phase orchestration |
| /src/adapters/webflow/ | WebflowAdapter |
| /src/lib/types.ts | Shared TypeScript interfaces |

## Key Conventions

- TypeScript strict mode — no any types
- Zod for all external data validation
- Every Supabase query includes org_id filter
- RLS always on — service role only for migrations and admin scripts
- Git commit after every working step
- See CONVENTIONS.md for full patterns
- See REGISTRY.md for all tables, templates, and routes
```

Git commit: `docs: write CLAUDE.md`

---

### Step 8 — Write SCHEMA.md (root)
```
Write SCHEMA.md in the repo root with this content:

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
```

Git commit: `docs: write SCHEMA.md`

---

### Step 9 — Write REGISTRY.md (root)
```
Write REGISTRY.md in the repo root with this content:

# REGISTRY.md — Mygratr

> Growing reference lists. Overflow from CLAUDE.md.
> Update after each phase as new routes, templates, and components are added.

## Database Tables

| Table | Purpose | Phase Built |
|---|---|---|
| organisations | Customer orgs | MYGRATR-0 |
| migrations | One per site migration | MYGRATR-0 |
| audit_manifests | Phase 1 audit output | MYGRATR-0 |
| schema_designs | Sanity schema per collection | MYGRATR-0 |
| content_migrations | Per-collection migration state | MYGRATR-0 |
| template_builds | Per-template build attempt | MYGRATR-0 |
| qa_runs | Per-page QA results | MYGRATR-0 |
| redirects | URL preservation map | MYGRATR-0 |
| launches | Post-launch monitoring | MYGRATR-0 |

## Template Types

| TemplateType | URL Pattern | Collections | Phase Built |
|---|---|---|---|
| HOME | / | — | TBD |
| TECHNOLOGY | /technology/[slug] | Technology Pages | TBD |
| SERVICE | /services/[slug] | Services | TBD |
| BLOG | /[category]/[slug] | 7 blog collections | TBD |
| COMPARE | /compare/[slug] | Compare Blogs | TBD |
| CUSTOMER_STORY | /customer-story/[slug] | Customer Stories | TBD |
| TEAM_MEMBER | /team/[slug] | Team Members | TBD |
| VIDEO | /videos/[slug] | Videos | TBD |
| REVIEW | /reviews/[slug] | Reviews | TBD |
| BOOK_A_CALL | /book-a-call/[slug] | Book A Call Pages | TBD |
| DOWNLOAD | /download/[slug] | Downloads | TBD |
| TOOL | /tools/[slug] | Tools & Quizzes | TBD |
| STATIC | Various | — | TBD |

## CMS Collections (CE — 33 total)

| Collection | Items | Complexity | Template |
|---|---|---|---|
| Technology Pages | 101 | HIGH (43 fields, fold structure) | TECHNOLOGY |
| Videos | 32 | LOW | VIDEO |
| Blogs & Guides | 31 | LOW | BLOG |
| Compare Blogs | 29 | LOW | COMPARE |
| Team Members | 28 | LOW | TEAM_MEMBER |
| Staff Augmentation Blogs | 28 | LOW | BLOG |
| Reviews | 26 | LOW | REVIEW |
| Services | 23 | MEDIUM | SERVICE |
| Customers / Customer Stories | 18 | MEDIUM | CUSTOMER_STORY |
| Lead magnets / Tags | 17 | LOW (taxonomy) | — |
| Nearshoring & Offshoring Blogs | 13 | LOW | BLOG |
| Glassdoor reviews | 10 | LOW | — |
| Client Benefits & Company Values | 9 | LOW | — |
| Scaling Teams Blogs | 9 | LOW | BLOG |
| Tags >> Blogs | 8 | LOW (taxonomy) | — |
| Hiring Tips Blogs | 7 | LOW | BLOG |
| Managing Engineers Blogs | 7 | LOW | BLOG |
| Hubs | 6 | LOW | — |
| Staff Benefits | 6 | LOW | — |
| Book A Call Pages | 6 | LOW | BOOK_A_CALL |
| Downloads | 5 | LOW | DOWNLOAD |
| Downloads Access Pages | 5 | LOW (gated) | — |
| New Blog Templates | 5 | LOW | BLOG |
| Tags >> Alternatives | 4 | LOW (taxonomy) | — |
| AI in Software Development Blogs | 3 | LOW | BLOG |
| Tags >> Tools & Quizzes | 3 | LOW (taxonomy) | — |
| Tags >> Video Library | 3 | LOW (taxonomy) | — |
| Tools & Quizzes | 2 | MEDIUM | TOOL |
| Tags >> Downloads | 2 | LOW (taxonomy) | — |
| Tags >> Events & Webinars | 2 | LOW (taxonomy) | — |
| Events & Webinars | 1 | LOW | STATIC |
| Legal pages | 1 | LOW | STATIC |
| Insights | 1 | LOW | STATIC |

## API Routes

None yet. Updated as MYGRATR-SCAFFOLD-1 and later sessions build them.

## Scripts

| Script | Purpose | Output |
|---|---|---|
| scripts/webflow-inventory.js | Webflow API full inventory | audit-output/ce-inventory.json |
| scripts/firecrawl-sitemap.js | Full site crawl via Firecrawl | audit-output/ce-sitemap.json |
```

Git commit: `docs: write REGISTRY.md`

---

### Step 10 — Write remaining context files (root)
```
Write the following four files in the repo root:

--- CHANGELOG.md ---
# CHANGELOG.md

## MYGRATR-0 — Foundation (April 2026)
Project foundation established. Repo scaffolded with TypeScript strict mode,
all dependencies installed, Supabase schema live with 10 tables and RLS
enabled on all. CE org and migration seeded with fixed UUIDs. All context
files written at root level. Webflow inventory and Firecrawl sitemap scripts
complete from pre-session work — full CE audit data in audit-output/.

--- CONVENTIONS.md ---
# CONVENTIONS.md

## Established in MYGRATR-0

### File Locations
- Product code → /src/
- One-off scripts → /scripts/
- Audit artefacts → /audit-output/
- Session briefs → /briefs/active/ (archive after phase closes)
- Context docs → repo root

### TypeScript
- Strict mode always on
- No `any` types — use `unknown` and narrow
- Zod for all external data validation
- Interfaces over types for object shapes
- Enums for all fixed value sets

### Environment
- dotenv loaded once at entry point only
- Never commit .env
- Service role key only in admin scripts and migrations
- Never use service role key in product code

### Supabase
- Every query includes org_id filter
- RLS always enabled — never bypass in product code
- Use fixed UUIDs for seeded data (CE pattern)

### Git
- Commit after every working step — not at end of session
- Format: type(scope): description
- Types: feat, fix, chore, docs, refactor, test

### Naming
- Files: kebab-case
- TypeScript interfaces/enums: PascalCase
- Variables/functions: camelCase
- Database columns/tables: snake_case
- Environment variables: SCREAMING_SNAKE_CASE

### Context File Updates
- After every phase: CHANGELOG → PHASE_HISTORY → CONVENTIONS →
  FEATURE_MAP → CLAUDE.md → SCHEMA.md → REGISTRY.md
- Move completed brief from briefs/active/ to briefs/archive/
- Open fresh Claude Code chat for post-phase audit

--- PHASE_HISTORY.md ---
# PHASE_HISTORY.md

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

--- FEATURE_MAP.md ---
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
```

Git commit: `docs: write CHANGELOG, CONVENTIONS, PHASE_HISTORY, FEATURE_MAP`

---

### Step 11 — Final verification
```
Run all of the following and report results:

1. ls -la in repo root — confirm all 7 context files exist at root level
2. ls briefs/active/ — confirm brief is in place
3. npx tsc --noEmit — must pass with zero errors
4. node -e "require('dotenv').config(); console.log(process.env.SUPABASE_URL)"
   — must print the Supabase URL
5. node scripts/webflow-inventory.js — must run successfully
6. In Supabase dashboard, confirm all 10 tables exist
7. Run: select id, name, slug from organisations;
   — must return Cloud Employee row
8. Run: select id, source_domain, status from migrations;
   — must return CE migration row

Report any failures before closing the session.
```

Git commit: `chore: MYGRATR-0 complete — foundation verified`

---

### Step 12 — Verify Sanity connection and document credentials
```
Do the following three things in order:

1. Verify the Sanity connection by making a test API call using the
   SANITY_API_TOKEN from .env to this endpoint:
   https://lzbhll1u.api.sanity.io/v2021-06-07/data/query/production?query=*[0]
   Confirm it returns a valid response with no auth errors.
   If it returns a 401 or 403, stop and report — the token is wrong.

2. Add these two lines to docs/credentials:
   SANITY_PROJECT_ID=lzbhll1u
   SANITY_DATASET=production

3. Run this SQL in Supabase to store Sanity details on the CE migration row:
   update migrations
   set metadata = '{"sanity_project_id": "lzbhll1u", "sanity_dataset": "production"}'
   where id = 'ce000000-0000-0000-0000-000000000002';
   Confirm the update returned 1 row affected.
```

Git commit: `chore: verify Sanity connection and document credentials`

---

## Deferred Items

| Feature | Deferred To | Reason |
|---|---|---|
| WebflowAdapter class | MYGRATR-AUDIT-1 | Not needed until audit agent |
| Sanity client setup | MYGRATR-SCAFFOLD-1 | Not needed until Next.js scaffold |
| RLS row-level policies | MYGRATR-AUDIT-1 | Need real user auth context first |
| Langfuse observability | v1 | Not needed for CE solo build |
| HubSpot forms decision | MYGRATR-CONTENT-1 | Needs full audit data first |
| Anthropic API key | MYGRATR-AUDIT-1 | Not needed until vision calls |

---

## Open Decisions (Resolve Before MYGRATR-AUDIT-1)

| # | Decision | Default |
|---|---|---|
| 1 | HubSpot forms: embed vs native | Decide after seeing all 25 forms |
| 2 | Content freeze protocol | Full freeze preferred |
| 3 | Sanity plan tier | Growth ($99/mo) |
| 4 | Sanity project ownership | Jake personal for v0 |
| 5 | Beem write cutover timing | Hard cut at CE go-live |

---

## Post-Phase Protocol

- [ ] CHANGELOG.md updated ← done in Step 10
- [ ] PHASE_HISTORY.md updated ← done in Step 10
- [ ] CONVENTIONS.md updated ← done in Step 10
- [ ] FEATURE_MAP.md updated ← done in Step 10
- [ ] CLAUDE.md updated ← done in Step 7
- [ ] SCHEMA.md updated ← done in Step 8
- [ ] REGISTRY.md updated ← done in Step 9
- [ ] Move brief from briefs/active/ to briefs/archive/
- [ ] Open fresh Claude Code chat for post-phase audit

---

*Brief version: 1.2 — April 2026*
*Status: READY FOR BUILD*
*Next session: MYGRATR-AUDIT-1*

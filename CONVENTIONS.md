# CONVENTIONS.md — Mygratr

> Coding patterns and conventions established in this codebase.
> Updated after each phase to prevent architectural drift.
> Patterns documented here reflect reality — never speculative.

**Status:** MYGRATR-STATIC-2 close (May 2026). DESIGN-1 Brief B Steps 7, 9, 10, 11 still pending.

---

---

## Section 0b: STATIC-3 close additions (Jul 2026)

### Chrome content band — header + footer horizontal alignment

Header nav and footer link grid share one max-width band so logo/CTA edges line up with footer Roles/Region:

- **Constants:** `site/src/components/layout/chrome-band.tsx` — `CHROME_H_PAD` (`px-4 lg:px-16`), `CHROME_CONTENT_BAND` (`max-w-[1152px] mx-auto`), `CHROME_HEADER_ROW` (flex: logo left, nav centre cluster, CTA right).
- **Footer:** wrap all footer sections in `CHROME_CONTENT_BAND` inside horizontal padding.
- **Header:** `nav-client.tsx` desktop row uses `CHROME_HEADER_ROW`; mega-menu panel spans the band (`left-0 right-0` on the band-relative wrapper).

Customer-2: reuse for any sitewide chrome that must align with marketing page content width.

### Announcement bar — collapse when disabled

`navigation.announcementBar.enabled: false` must render **nothing** and reserve **zero** height (fixes empty reserved gap):

- CSS: `--announcement-bar-height: 0px` default; set to `--announcement-bar-active-height` (32px) only when enabled + message present.
- Body offset: `padding-top: calc(var(--header-height) + var(--announcement-bar-height))` in `globals.css`.
- Sticky wrapper: negative top margin equal to the same calc on the sticky chrome wrapper in `nav.tsx` so body padding does not double-offset the header.
- Schema: `message` required only when `enabled` via `Rule.custom()` on `studio/schemas/globals/navigation.ts`.

---

## Section 0: STATIC-2 close additions (May 2026)

### CE-specific route conventions (DELTA-5)

- **"Our Clients" primary nav link points to `/our-work`.** NOT `/customer-stories`, NOT `/our-clients`. Discovered via STATIC-2 Step 1 live-site audit; the brief's URL guess was wrong. STATIC-2 Step 4 reseed populates the live-faithful URL. STATIC-3 visual rebuild reads from `navigation.primaryLinks[].url`. Customer-2: don't assume primary-nav URLs match nav labels — verify against the live site.
- **Customer-story individual pages live at `/customer-story/<slug>` (SINGULAR).** Plural `/customer-stories` is the index/listing route. `/our-work` is the curated showcase. Three distinct customer-related URL spaces.
- **Blog posts live at `/<category>/<slug>` across multiple namespaces** (`/nearshoring-offshoring/`, `/hiring-tips/`, `/scaling-teams/`, etc.). Plain `/blog/<slug>` is NOT the per-post URL; `/blog` is the hub index. Customer-2: do not assume blog posts use a single `/blog/` namespace; capture and respect the actual URL shape from audit.
- **"CE vs. Alternatives" canonical URL is `/alternatives`** (HUB_CONFIG canonical, matches Webflow `hrefLang="x-default"` declaration). Live site also serves `/compare` as an alias (both 200), but STATIC-2 footer reseed uses `/alternatives` for SEO link-equity consistency.

### Discriminated icon shape — `material-font | asset`

Sanity doesn't have native tagged unions. Pattern adopted in STATIC-2's `resourcesMegaMenu.leftColumn.items[].icon`:

```ts
icon: {
  source: 'material-font' | 'asset' | undefined,
  name: string | null,     // ligature name when source = 'material-font' (e.g. 'download', 'calculate')
  asset: image | null,     // uploaded asset when source = 'asset'
  alt: string | null,      // required when source = 'asset'
}
// Rule.custom() validates conditionally:
//   - source === 'material-font' → name required (non-empty)
//   - source === 'asset' → asset + alt both required
//   - source undefined → all fields valid (blank icon slot)
```

Caller (STATIC-3 render component) reads `source` to pick the rendering branch. Supports editorial flexibility — Seb toggles between Material font glyph and uploaded asset per item without a schema change. Customer-2: reuse for any chrome icon surface that mixes font-glyph and image sources.

### Conditional-spread on optional Sanity fields (reaffirmed from CONTENT-1D-CLEANUP)

When writing optional fields to Sanity, NEVER write `null` literals. Use conditional spread:

```ts
// GOOD
const doc = {
  _id, _type,
  name: 'Service Name',
  ...(tagline ? { tagline } : {}),
  ...(thumbnail ? { thumbnail: { asset: {...} } } : {}),
}

// BAD
const doc = {
  _id, _type,
  name: 'Service Name',
  tagline: tagline || null,  // ❌ writes null literal — fails Studio strict validation on optional fields
  thumbnail: thumbnail || null,
}
```

Same applies to `.patch().set()` — only include keys whose values are non-null and non-empty. STATIC-2 Step 4 `seed-globals-v2.ts` enforces this via per-key conditional checks before `.set()`.

### Legacy field preservation for additive schema migrations

When extending a Sanity schema in a phase that doesn't ship the new rendering (e.g., STATIC-2 extends schemas but STATIC-3 ships the visual rebuild against them):

- **Keep ALL existing fields.** No removals.
- Tag deprecated fields with `description: '⚠️ Legacy field — populated by <PHASE> reseed but no longer rendered. Will be removed in a future cleanup phase.'`
- Do NOT use `hidden:` callback (would break regression-safety reads from prior-phase components).
- Reseed populates BOTH new fields AND legacy fields for the transition window.
- Cleanup phase removes legacy fields from schema + data afterward (deferred Tech Debt entry).

This protects against the failure mode where deploying schema changes mid-phase orphans the prior-phase render. STATIC-2 → STATIC-3 transition uses this pattern explicitly.

### Audit-driven brief refinement pattern

When a brief makes assumptions that need DOM-level verification:

1. Run a probe at plan-mode entry. Save raw output as JSON artifacts under `audit-output/<phase>/` (gitignored — fresh per-phase).
2. When the probe surfaces brief-vs-reality findings, file them in `<phase>-brief-deltas.json` (gitignored too) and continue execution against the probe truth, not the brief assumption.
3. Update the brief at phase close (revise v1 → v1.N), reconciling the §4 file list + spec sections against actuals.
4. Document the discipline in the post-phase CHANGELOG + PHASE_HISTORY entries.

STATIC-2 went through v1 → v1.1 (DELTA-B applied mid-phase after Step 1) → v1.2 (phase-close reconciliation). Pattern enables fast execution without blocking on brief edits.

---

## Section 1: Universal Patterns

Patterns carried from Jake's broader stack (Beem, Voice Profile, AEO).
Identical behaviour expected here unless this file explicitly overrides.

---

### File Naming

| Category | Pattern | Example |
|----------|---------|---------|
| Scripts | `kebab-case.ts` or `.js` | `scripts/webflow-inventory.ts` |
| Lib modules | `kebab-case.ts` | `src/lib/adapters/webflow-adapter.ts` |
| Types | `kebab-case.ts` (plural noun) | `src/types/migrations.ts` |
| Orchestrator modules | `kebab-case.ts` | `src/orchestrator/phase-runner.ts` |
| QA modules | `kebab-case.ts` | `src/lib/qa/visual-diff.ts` |
| Context docs | `SCREAMING_SNAKE_CASE.md` | `CLAUDE.md`, `SCHEMA.md` |
| Audit artefacts | `ce-{type}.json` | `audit-output/ce-inventory.json` |

---

### Function Naming

| Context | Convention | Example |
|---------|------------|---------|
| Exported lib functions | `camelCase` verb-first | `fetchCollections()`, `runVisualDiff()` |
| Internal helpers | `camelCase` verb-first | `buildManifest()`, `parseFieldType()` |
| Type interfaces | `PascalCase` | `MigrationJob`, `QARunResult` |
| Enums | `PascalCase` | `MigrationStatus`, `TemplateType` |
| Constants | `SCREAMING_SNAKE_CASE` | `MAX_QA_ATTEMPTS`, `VISUAL_DIFF_TOLERANCE` |

---

### Import Ordering

Standard order (top to bottom):

```typescript
import { createClient } from '@supabase/supabase-js'  // 1. External libraries
import { z } from 'zod'                                 // 2. External utilities
import { env } from '@/lib/env'                         // 3. Internal env
import { createServerClient } from '@/lib/supabase'     // 4. Internal lib
import type { MigrationJob } from '@/types/migrations'  // 5. Internal types
```

---

### TypeScript

- Strict mode always on — no exceptions
- No `any` — use `unknown` and narrow with Zod or type guards
- Zod for all external data validation (Webflow API responses, Firecrawl responses, Claude outputs)
- Interfaces over types for object shapes
- Enums for all fixed value sets (MigrationStatus, TemplateType, QAResult, etc.)
- Result types for all lib functions — define the return shape before writing the function

---

### Environment Variable Validation

All environment variables validated at startup in `src/lib/env.ts` using Zod.
The process will not start if a required key is missing.

```typescript
// src/lib/env.ts
import { z } from 'zod'

const schema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  WEBFLOW_API_TOKEN: z.string().min(1),
  // Optional at boot-time, required at call-time:
  FIRECRAWL_API_KEY: z.string().optional().default(''),
  ANTHROPIC_API_KEY: z.string().optional().default(''),
})

export const env = schema.parse(process.env)
```

**Runtime guard for optional keys** — external service keys may not be configured
in all environments. Module-level `.min(1)` throws at import time, crashing ALL
routes that transitively import `env.ts`. Use runtime guards instead:

```typescript
function ensureFirecrawl() {
  if (!env.FIRECRAWL_API_KEY) {
    throw new Error('FIRECRAWL_API_KEY not configured — set in .env')
  }
}
```

Never access `process.env` directly in lib functions — always import from `src/lib/env.ts`.

---

### Error Handling

**In scripts and lib functions:**

```typescript
// Fatal — throw
if (!env.WEBFLOW_API_TOKEN) throw new Error('WEBFLOW_API_TOKEN not set')

// Recoverable in batch operations — collect, don't throw
if (insertError) {
  result.errors.push(`Insert failed for "${slug}": ${insertError.message}`)
  continue
}
```

**Extracting error messages from unknown:**

```typescript
const message = error instanceof Error ? error.message : 'Unknown error'
```

**Result types for all lib functions:**

```typescript
interface MigrationResult {
  itemsProcessed: number
  itemsSkipped: number
  errors: string[]
}
```

Define result type before writing the function. Return it from every code path.

---

### Supabase Patterns

#### Client creation

```typescript
// Admin scripts and migrations — bypasses RLS
import { createServerClient } from '@/lib/supabase'
const supabase = createServerClient()

// Product code — must use RLS-scoped client
// (v1 — not yet needed while Jake is sole user)
```

#### Query pattern

```typescript
const { data, error } = await supabase
  .from('migrations')
  .select('id, status, current_phase')
  .eq('org_id', orgId)          // ALWAYS include org_id
  .eq('id', migrationId)
  .single()

if (error) {
  throw new Error(`Failed to fetch migration: ${error.message}`)
}
```

#### Insert pattern

```typescript
const { error: insertError } = await supabase
  .from('qa_runs')
  .insert({
    org_id: orgId,              // ALWAYS include org_id
    migration_id: migrationId,
    template_build_id: buildId,
    // ... fields
  })

if (insertError) {
  result.errors.push(`QA run insert failed: ${insertError.message}`)
}
```

#### RLS policy syntax

`get_user_org_ids()` returns `SETOF uuid`. Postgres requires `IN (SELECT ...)` not `ANY()`:

```sql
-- CORRECT
CREATE POLICY "org_isolation" ON migrations FOR ALL USING (
  org_id IN (SELECT unnest(get_user_org_ids()))
);

-- WRONG — type error: SETOF uuid ≠ uuid[]
CREATE POLICY "org_isolation" ON migrations FOR ALL USING (
  org_id = ANY(get_user_org_ids())
);
```

#### REVOKE hygiene for SECURITY DEFINER functions

Every new SECURITY DEFINER function must explicitly REVOKE after GRANT:

```sql
CREATE OR REPLACE FUNCTION insert_qa_run_and_update_build(...)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$ BEGIN ... END; $$;

GRANT EXECUTE ON FUNCTION insert_qa_run_and_update_build(...) TO service_role;
REVOKE EXECUTE ON FUNCTION insert_qa_run_and_update_build(...) FROM anon, authenticated, public;
```

Always GRANT before REVOKE. Always include all three roles in REVOKE.
Include full function signature (with argument types) in both statements.

---

### Config Map Pattern

Never `if (type === 'x')` conditionals. Always a config map.
This applies to: CMS adapters, template builders, QA diff strategies, field type parsers.

```typescript
// WRONG
if (sourceType === 'webflow') return new WebflowAdapter()
if (sourceType === 'wordpress') return new WordPressAdapter()

// CORRECT
const ADAPTER_MAP: Record<string, () => CmsAdapter> = {
  webflow: () => new WebflowAdapter(),
  wordpress: () => new WordPressAdapter(),
}

const factory = ADAPTER_MAP[sourceType]
if (!factory) throw new Error(`Unsupported CMS: ${sourceType}`)
return factory()
```

When adding a new CMS, template type, or QA strategy: add an entry to the map.
Never add a conditional branch.

---

### Robust LLM JSON Parsing

When parsing JSON from Claude responses, always apply two cleanup steps:

```typescript
import { stripMarkdownFences } from '@/lib/utils/json'

function parseLLMJson<T>(text: string): T {
  const cleaned = stripMarkdownFences(text)         // removes ```json fences
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/)     // extracts first JSON object
  const jsonStr = jsonMatch ? jsonMatch[0] : cleaned
  return JSON.parse(jsonStr) as T
}
```

LLMs sometimes add preamble text before JSON, or wrap in markdown fences
even when instructed not to. Both steps are required for reliability.
Wrap in try/catch and log the raw text on failure for debugging.

---

### Background Job Pattern (waitUntil / polling)

Long-running pipeline phases use fire-and-poll:

```typescript
// Route handler
waitUntil(runPhase(jobId, migrationId, orgId))  // fires background task
return { jobId }                                 // returns immediately

// Client polls GET /jobs/[jobId] every 3s
// Job row updated with current_step as pipeline progresses
// Terminal statuses: complete, failed
```

Rules:
- Create the job row BEFORE calling `waitUntil()` — client needs a job ID to poll
- Pipeline catches top-level errors and sets job status to `failed`
- Always set `maxDuration` on the route (300 = 5 min Vercel Pro limit)
- Client timeout: 20 minutes, with user notification on expiry

---

### Batched External API Calls

When calling external APIs in bulk, batch with delays to avoid rate limits:

```typescript
const BATCH_SIZE = 5
const BATCH_DELAY_MS = 500

for (let i = 0; i < items.length; i += BATCH_SIZE) {
  const batch = items.slice(i, i + BATCH_SIZE)
  const results = await Promise.allSettled(batch.map(item => processItem(item)))
  // handle results...
  if (i + BATCH_SIZE < items.length) await delay(BATCH_DELAY_MS)
}
```

Use `Promise.allSettled` not `Promise.all` — partial failures are acceptable.
Log non-fatal failures with `console.warn`. Never throw on partial failure.
Standard batch sizes: Webflow API: 5, Firecrawl: 3, Anthropic: 10.

---

### Langfuse Observability

Optional per-pipeline tracing. Fully no-op if keys not configured.

```typescript
import { createTrace } from '@/lib/langfuse'

const trace = createTrace('audit_agent', { migrationId, orgId })
const span = trace?.span({ name: 'webflow_collection_fetch' })
// ... work ...
span?.end({ output: { collectionCount: 33 } })
```

Rules:
- Always use optional chaining: `trace?.span()`, `span?.end()`
- One trace per pipeline phase, one span per meaningful unit of work
- `createTrace()` returns `null` if `LANGFUSE_PUBLIC_KEY` or `LANGFUSE_SECRET_KEY` not set
- Never instantiate Langfuse directly — use `createTrace()` from the shared wrapper

---

### Cron Auth

Bearer tokens compared via `crypto.timingSafeEqual`, never `===`:

```typescript
import { timingSafeEqual } from 'crypto'

export function verifyCronRequest(request: Request): boolean {
  const provided = request.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
  const expected = env.CRON_SECRET
  if (!expected || provided.length !== expected.length) return false
  try {
    return timingSafeEqual(Buffer.from(provided, 'utf8'), Buffer.from(expected, 'utf8'))
  } catch {
    return false
  }
}
```

---

### Git Commit Discipline

- Commit after every working step — not at end of session
- Format: `type(scope): description`
- Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `migration`
- Examples:
  - `feat(audit): webflow collection inventory complete`
  - `migration(schema): add qa_runs table`
  - `fix(qa): pixelmatch threshold adjusted for retina screenshots`

---

## Section 2: Mygratr-Specific Architectural Patterns

Patterns unique to Mygratr's domain. These define the product's core behaviour.

---

### The Adapter Interface — Source of Truth

Every external CMS interaction goes through the `CmsAdapter` interface
defined in `src/lib/adapters/types.ts`. This is Mygratr's primary
abstraction boundary.

```typescript
// src/lib/adapters/types.ts
export interface CmsAdapter {
  readonly sourceType: string
  fetchSiteMetadata(): Promise<SiteMetadata>
  fetchCollections(): Promise<CmsCollection[]>
  fetchCollectionItems(collectionId: string): Promise<CmsItem[]>
  fetchPage(pageId: string): Promise<CmsPage>
  fetchCustomCode(pageId: string): Promise<CustomCode | null>
  fetchForms(): Promise<CmsForm[]>
  verifyConnection(): Promise<boolean>
}
```

Rules:
- Interface is defined before any implementation — never the other way around
- `WebflowAdapter` is the first implementation. All others follow the same interface.
- No direct Webflow API calls outside `src/lib/adapters/webflow/`
- When adding a new source CMS (WordPress, Squarespace), create a new adapter file.
  Zero changes to the orchestrator — the config map handles routing.
- The interface is versioned (bump when signatures change) and documented in SCHEMA.md

---

### Phase Pipeline State Machine

Migrations follow a strict state machine. Invalid transitions must throw.

```
pending
  → audit_running → audit_complete → audit_failed
  → schema_running → schema_complete → schema_failed
  → scaffold_running → scaffold_complete → scaffold_failed
  → content_running → content_complete → content_failed
  → build_running → build_complete → build_failed (→ escalated)
  → qa_running → qa_complete → qa_failed (→ escalated)
  → launch_running → launch_complete → launch_failed
  → cutover_complete  ← terminal success
  → archived          ← terminal abandoned
```

Valid transitions are defined in `src/lib/pipeline/state-machine.ts`:

```typescript
const VALID_TRANSITIONS: Record<MigrationStatus, MigrationStatus[]> = {
  pending: ['audit_running'],
  audit_running: ['audit_complete', 'audit_failed'],
  audit_complete: ['schema_running'],
  // ...
}

export function assertValidTransition(from: MigrationStatus, to: MigrationStatus): void {
  const valid = VALID_TRANSITIONS[from] ?? []
  if (!valid.includes(to)) {
    throw new Error(`Invalid transition: ${from} → ${to}`)
  }
}
```

Rules:
- `assertValidTransition()` called before every status update — no silent jumps
- Scripts that seed or reset data are the only exception — must be clearly commented
- Terminal statuses: `cutover_complete`, `archived`. Nothing transitions out of these.
- `escalated` is a flag on `template_builds`, not a migration-level status

---

### Artefact Storage Split

Supabase stores metadata and status. The filesystem stores blobs.
Never put screenshot binary data, HTML snapshots, or full page content in JSONB.

```
Supabase rows:          id, status, scores, timestamps, counts, paths
Filesystem artefacts:   /audit-output/{domain}/screenshots/{page-slug}-{breakpoint}.png
                        /audit-output/{domain}/html/{page-slug}.html
                        /audit-output/{domain}/manifests/audit-manifest.json
                        /audit-output/{domain}/diffs/{template}-{attempt}-diff.png
```

Supabase columns store **paths**, not content:

```typescript
// CORRECT
screenshot_paths: {
  mobile: 'audit-output/cloudemployee.io/screenshots/home-mobile.png',
  tablet: 'audit-output/cloudemployee.io/screenshots/home-tablet.png',
  desktop: 'audit-output/cloudemployee.io/screenshots/home-desktop.png',
}

// WRONG
screenshot_data: {
  mobile: '<base64 blob>',
}
```

The path convention is `audit-output/{domain}/{type}/{slug}-{variant}.{ext}`.
New artefact types follow this convention. New columns store paths, not blobs.

---

### Org Isolation — Non-Negotiable

`org_id` is on every table. Every query filters by `org_id`. No exceptions.
This applies even during v0 when Jake is the only user. The CE UUID is proof
of pattern, not a shortcut.

```typescript
// EVERY query, without exception:
const { data } = await supabase
  .from('template_builds')
  .select('*')
  .eq('org_id', orgId)       // ← always present
  .eq('migration_id', migrationId)
```

If a query doesn't have `.eq('org_id', orgId)`, it is a bug.
RLS is always enabled — service role is for migrations and admin scripts only.

---

### QA Result Shape

All QA agent functions return this typed shape. Define it before writing QA code.

```typescript
// src/types/qa.ts
export interface QARunResult {
  passed: boolean
  visualDiffScore: number | null      // 0-100, pixelmatch
  contentDiffPassed: boolean | null
  metaDiffPassed: boolean | null
  structuredDataDiffPassed: boolean | null
  lighthouseScores: {
    performance: number
    seo: number
    accessibility: number
    bestPractices: number
  } | null
  failures: QAFailure[]
  screenshotPaths: {
    mobile: string
    tablet: string
    desktop: string
  }
  attemptNumber: number
}

export interface QAFailure {
  type: 'visual' | 'content' | 'meta' | 'structured_data' | 'lighthouse' | 'interaction'
  selector?: string             // CSS selector for element failures
  expected?: string
  actual?: string
  description: string
}
```

This shape is what the QA agent returns. It maps directly to `qa_runs` columns.
The Supabase insert is derived from `QARunResult` — never built ad hoc.

---

### Tolerance Thresholds as Named Constants

All QA and diff thresholds live in `src/lib/qa/thresholds.ts`.
Never hardcode tolerance values inside functions.

```typescript
// src/lib/qa/thresholds.ts
export const QA_THRESHOLDS = {
  VISUAL_DIFF_PASS: 90,           // pixelmatch score — 90+ = pass
  VISUAL_DIFF_WARN: 75,           // 75-89 = warn (still passes, flagged)
  LIGHTHOUSE_PERFORMANCE_MIN: 85, // mobile Lighthouse floor
  LIGHTHOUSE_SEO_MIN: 95,         // SEO floor — CE is revenue-critical
  LIGHTHOUSE_A11Y_MIN: 85,        // accessibility parity with source
  MAX_QA_ATTEMPTS: 3,             // consecutive failures → escalation
  CONTENT_MATCH_THRESHOLD: 0.95,  // text content similarity floor
} as const
```

When tuning a threshold for a tricky template, change it here.
The reasoning for any change should be in the commit message.

---

### Loop-Until-Pass Convention

The Builder ↔ QA loop is the product's core value. The convention:

```
attempt 1: Builder produces template → QA runs → pass? done : fail with reasons
attempt 2: Builder reads QA failures + original screenshots → revises → QA runs
attempt 3: Builder reads ALL prior attempts + ALL failures → revises → QA runs
attempt 3 fail on SAME issue: → escalation triggered
```

"Same issue" is defined by failure fingerprint: `{type}:{selector}` pair.
If the same fingerprint appears in attempts 2 and 3 of the same template,
that constitutes "3 consecutive failures" and triggers escalation.

Context packaging for each attempt:
- Original audit screenshots (all breakpoints)
- Sanity schema for the template's content type
- Current replica screenshots
- Every prior QA failure with descriptions
- Specific failing selectors highlighted in the diff image

The Builder must never start attempt N without ALL prior failures in context.

---

### Screenshot-First Development

Before writing a single line of template code, the audit screenshots for
that page type must be loaded and confirmed. This is the template build rule.

Build order for every template:
1. Locate screenshots in `/audit-output/{domain}/screenshots/`
2. Confirm source screenshots exist at all three breakpoints
3. Confirm Sanity schema for the content type is approved
4. Write template code against the screenshot + schema
5. Commit → trigger QA → loop

If screenshots are missing for a page type, the audit is incomplete.
Stop and re-run the audit for that page type before building.

---

### CE-Specific vs Reusable Discipline

Every function built for CE must work for customer 2 without modification.
CE-specific values live only in seed data and `.env`. Never inside lib logic.

```typescript
// WRONG — CE-specific value hardcoded in logic
async function fetchCEInventory() {
  return fetchCollections('673326831abed6267051fa11') // Webflow site ID
}

// CORRECT — CE-specific value passed as parameter
async function fetchSiteCollections(siteId: string): Promise<CmsCollection[]> {
  return fetchCollections(siteId)
}

// Caller (script or seed) supplies the CE value:
const collections = await fetchSiteCollections(env.WEBFLOW_SITE_ID)
```

If a function contains a domain name, org ID, UUID, or site ID hardcoded
inside the logic (not as a default parameter with clear documentation),
it is a violation. Fix before committing.

---

### Redirect Map Integrity

The audit manifest page count equals the redirect record count.
This is a hard exit criterion for MYGRATR-LAUNCH-1. Not approximate. Exact.

```typescript
// Pre-launch verification
async function verifyRedirectParity(migrationId: string): Promise<void> {
  const manifest = await getAuditManifest(migrationId)
  const redirectCount = await countRedirects(migrationId)

  if (redirectCount !== manifest.total_pages) {
    throw new Error(
      `Redirect parity failure: ${manifest.total_pages} pages in manifest, ` +
      `${redirectCount} redirect records. Delta: ${manifest.total_pages - redirectCount}`
    )
  }
}
```

Every page the audit finds — including paginated pages and locale variants —
must have a redirect record before cutover. Pagination and locale pages that
resolve to the same template still need their own redirect row.

---

### Multi-Locale Handling

CE has US (default) and UK (`/uk/` prefix) locales.
All pipeline code that touches URLs must be locale-aware from the start.

```typescript
export type Locale = 'en-US' | 'en-GB'

export interface LocalisedUrl {
  path: string      // e.g. /technology/cloud-computing
  locale: Locale
  canonical: string // full URL with locale prefix if non-default
}
```

Rules:
- Never strip locale prefixes silently — always track which locale a page belongs to
- US pages use paths as-is. UK pages use `/uk/` prefix.
- Content migration runs per locale — source items fetched per Webflow locale ID
- QA runs against both locale variants for every template
- Redirect map must cover both locale variants explicitly

---

### Batch Size + Runtime Budget Guards

Every pipeline phase that loops over items needs explicit batch size and runtime constants.
Vercel functions have a 300s hard timeout — phases must stop gracefully before hitting it.

```typescript
const MAX_RUNTIME_MS = 240_000  // leave 60s headroom before Vercel's 300s limit
const BATCH_SIZE = 10
const startTime = Date.now()

for (const item of items) {
  if (Date.now() - startTime > MAX_RUNTIME_MS) {
    result.stoppedEarly = true
    break
  }
  // process item...
}
```

`stoppedEarly` in the result shape means the next run picks up where this one left off.
Per-item timeouts via `Promise.race` prevent single slow items from blocking the pipeline.

---

### Atomic State Updates via RPC

When a pipeline step inserts derived data AND updates the parent row's status,
both operations must happen in a single SECURITY DEFINER RPC — not two separate queries.
This prevents desync if one operation succeeds and the other fails.

```sql
-- Example: insert QA run results AND update template_build status atomically
CREATE OR REPLACE FUNCTION insert_qa_run_and_update_build(
  p_qa_run jsonb,
  p_build_id uuid,
  p_new_status text,
  p_org_id uuid
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO qa_runs (...) VALUES (...);
  UPDATE template_builds SET status = p_new_status WHERE id = p_build_id AND org_id = p_org_id;
END;
$$;
```

Rules:
- Use for any operation that must succeed or fail as a unit
- RPC must be SECURITY DEFINER with `SET search_path = public`
- All data passed as parameters — no lookups inside the RPC for correctness-critical data

---

### Sanity Schema Versioning

Sanity schemas are versioned and immutable once approved. Never overwrite
an approved schema row — insert a new version and increment the version counter.

```typescript
// WRONG
await supabase.from('schema_designs').update({ sanity_schema: newSchema }).eq('id', id)

// CORRECT
const latest = await getLatestSchemaVersion(migrationId, collectionSlug)
await supabase.from('schema_designs').insert({
  ...base,
  sanity_schema: newSchema,
  version: latest.version + 1,
  status: 'draft',           // new version starts as draft, not approved
  specialist_reviewed: false,
})
```

Only one schema design per collection is `status = 'approved'` at a time.
The content migration runs against the approved version only.

---

## Section 3: Anti-Patterns

Explicit violations. If Claude Code does any of these, stop and fix before continuing.

- **No CE-specific values hardcoded in lib logic** — domain names, org IDs, site IDs belong in env or seed data
- **No inline tolerance values** — use `QA_THRESHOLDS` constants
- **No direct CMS API calls outside the adapter** — everything goes through `CmsAdapter`
- **No queries without `org_id` filter** — every single query
- **No JSONB blobs of binary data** — store paths, not content
- **No `if (sourceType === 'x')` branches** — use config maps
- **No migration status jumps without `assertValidTransition()`**
- **No template build without prior screenshots confirmed**
- **No cutover without redirect parity verification**
- **No `any` types** — use `unknown` and narrow
- **No direct `process.env` access** — always import from `src/lib/env.ts`
- **No `===` for bearer token comparison** — use `timingSafeEqual`
- **No logic in scripts that should be in lib** — scripts are thin callers, logic lives in `src/lib/`
- **No Python** — everything is TypeScript

---

## Resumable Orchestrator Chunks (MYGRATR-AUDIT-1)

Long-running audit orchestrators are split into independent chunks that
load all prior-step outputs from disk. A chunk can be restarted without
re-running earlier steps, and new chunks can extend the pipeline without
re-executing the parts that have already succeeded.

```typescript
// scripts/audit/run-audit-chunk2.ts
function loadPageContentsFromDisk(): Record<string, PageContent> {
  // reads audit-output/pages/{slug}/content.json into memory
}

async function runChunk2(): Promise<void> {
  const canonicalUrls = loadCanonicalUrls();
  const pageContents = loadPageContentsFromDisk();
  await buildInteractionInventory(pageContents);
  await buildScriptInventory(pageContents);
  // ...
}
```

**Rules:**
- Chunks read prerequisites from disk files in `audit-output/`, not from
  in-memory state passed between runs.
- Each step writes its output immediately on success (no in-memory-only state).
- A chunk must be safely re-runnable without corrupting earlier outputs.
- Register each chunk as a `package.json` script (`audit:run`,
  `audit:chunk2`, `audit:chunk3`) so re-runs are a one-liner.

---

## Skip-if-Exists for Expensive Steps (MYGRATR-AUDIT-1)

Content extraction and screenshot capture are expensive (network I/O,
browser automation). Each step checks disk state and skips already-done
items unless explicitly forced via `AUDIT_SKIP_EXISTING=0`.

```typescript
// scripts/audit/03-content-extractor.ts
const skipExisting = options.skipExisting ?? (process.env.AUDIT_SKIP_EXISTING !== '0');
const toExtract = skipExisting
  ? candidates.filter(cu => !fs.existsSync(path.join(PAGES_DIR, cu.slug, 'content.json')))
  : candidates;
```

**Rules:**
- Default to skip-if-exists; never default to re-do-everything.
- The existence-check must be the final output file of that step (content.json,
  three PNGs, etc.) — not intermediate state.
- An env var override (`AUDIT_SKIP_EXISTING=0`) forces a full re-run.
- Re-runs must still write `ce-{step}-summary.json` so downstream steps
  always see fresh metadata.

---

## Tier-1 / Tier-2 LLM Degradation (MYGRATR-AUDIT-1)

Steps that use the Anthropic API for judgement calls always have a
deterministic tier-1 (rules or pattern detection) that runs first and
works without the API. Tier-2 Claude calls refine the tier-1 output but
never replace it. If `ANTHROPIC_API_KEY` is missing, tier-2 is skipped
and the tier-1 result is flagged for manual review.

```typescript
// scripts/audit/07-template-classifier.ts
const rulesResult = applyRules(cu.path);       // tier 1 — URL pattern match
if (rulesResult !== null) {
  classifications.push({ ...tier1, requiresManualReview: false });
} else if (!anthropic) {
  classifications.push({ ...defaultedStatic, requiresManualReview: true });
} else {
  const llmResult = await classifyWithLLM(batch);  // tier 2 — Claude refines
  classifications.push({ ...llmResult, requiresManualReview: lowConfidence });
}
```

**Rules:**
- Tier 1 is never skipped, even when tier 2 is available — it's a
  deterministic baseline and fallback.
- Tier-2 auth or quota errors are fatal and rethrown; transient errors
  fall back to tier 1 with a `requiresManualReview: true` flag.
- Anthropic model string is `claude-opus-4-7` — keep a single
  `MODEL` constant near the top of the file.
- Every LLM-classified item includes `reasoning` so a human can audit
  the call later.

---

## Inline Rules Classifier for Cross-Step Dependencies (MYGRATR-AUDIT-1)

When a downstream step needs a template classification before the full
`07-template-classifier.ts` runs (e.g. the screenshot agent needs to pick
samples by template type), the rules tier is exported as a standalone
helper the downstream step can call inline.

```typescript
// scripts/audit/02-screenshot-agent.ts
export function buildRulesOnlyTemplateMap(canonicalUrls: CanonicalUrl[]): TemplateClassification[] {
  return canonicalUrls
    .filter(cu => cu.status === UrlStatus.OK)
    .map(cu => ({ ...rulesClassify(cu.path) }));
}
```

**Rules:**
- If Step N needs Step M's output but Step M hasn't run yet, export
  Step M's rules tier (not its full implementation) and inline it.
- Never duplicate rule logic — import a shared helper from the
  producing step or from `src/lib/audit-types.ts`.

---

## Phase Timeout + Circuit Breaker for API Batch Steps (MYGRATR-AUDIT-1)

Steps that fan out many API calls (Firecrawl, Playwright, Anthropic)
enforce both a phase-wide timeout and a consecutive-failure circuit
breaker. Both write partial progress to disk before stopping.

```typescript
// scripts/audit/03-content-extractor.ts
const PHASE_TIMEOUT_MS = 600_000;
const MAX_CONSECUTIVE_FAILURES = 15;
if (Date.now() - phaseStart > PHASE_TIMEOUT_MS) { stoppedEarly = true; return; }
if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) { stoppedEarly = true; return; }
```

**Rules:**
- Phase timeout is wall-clock, not request count.
- Circuit breaker resets on every success.
- `stoppedEarly` must be persisted in the step's summary file so the next
  chunk can detect partial completion.

---

## PII-Safe Audit Outputs (MYGRATR-AUDIT-1)

The `audit-output/` directory can contain PII (HubSpot notification
emails), infrastructure identifiers (GTM, LinkedIn partner IDs), and
full page HTML. It must never be committed.

**Rules:**
- `.gitignore` includes `audit-output/` and `.audit/` from the first
  audit run onwards.
- Pre-audit files that predate the gitignore rule (e.g.
  `ce-inventory.json`, `ce-sitemap.json`) are allowed to stay tracked
  because they contain no PII. Audit this manually when adding new
  already-tracked files.
- Credentials (HubSpot tokens, Anthropic keys, Ahrefs keys) live in
  `.env` only — never in commits, never in `audit-output/`, never
  echoed to logs.

---

## Sanity Schema Conventions (MYGRATR-SCHEMA-1)

Sanity v3 API (still current on the `sanity@^5` package). Every schema
file default-exports a `defineType({...})` result; aggregators collect
those default exports into typed arrays.

```typescript
// studio/schemas/documents/tag.ts
import { defineField, defineType } from 'sanity'
import { slugField } from '../_shared'

export default defineType({
  name: 'tag',
  title: 'Tag',
  type: 'document',
  fields: [
    defineField({ name: 'name', type: 'string', validation: (R) => R.required().max(100) }),
    slugField('name'),
    defineField({ name: 'category', type: 'string', options: { list: [...] }, validation: (R) => R.required() }),
  ],
  preview: { select: { title: 'name', subtitle: 'category' } },
})
```

**Rules:**

- One schema per file; filename is kebab-case of the type name
  (`blog-post.ts` → `name: 'blogPost'`).
- Default export only — the registry (`studio/schemas/{kind}/index.ts`)
  imports defaults and collects them into an exported `typeArray`.
- Use `defineArrayMember` for polymorphic arrays (sections, folds, tags).
- Field-level `validation` via `(Rule) => Rule.required().max(n)`. For
  required `portableText`, use the explicit `defineField` form (the
  functional shorthand trips TS inference with the nullable return).
- Enum options use `options.list: [{title, value}, ...]` — `value` is
  the stored string.
- Reference fields with a type filter use
  `options: { filter: 'category == "blogs"' }`. Filters are GROQ strings.
- Slug sources: `options.source: '<fieldName>'` for simple cases, or a
  function `(doc) => string` for derived sources (bookACall uses
  firstName+lastName).
- Factory functions for repeated schema shapes: `_landing-page-factory.ts`
  (industry/persona/location share one shape), `singletons/_factories.ts`
  (blog hub, collection hub, static page, calculator page — 31 files
  through 4 factories).
- Shared field builders in `studio/schemas/_shared.ts`:
  `localeField()`, `sourceTrackingFields()`, `metaFields({og})`,
  `slugField(source)`, `imageField(name, title, {required})`. Callers
  spread the return into their field arrays.

---

## Singleton Enforcement — Sanity v5 (MYGRATR-SCHEMA-1)

Singleton document types are plain `document` schemas. Enforcement is in
`sanity.config.ts`, not the schema files. Do **not** use
`__experimental_actions` — that was a Sanity v2 pattern.

```typescript
// studio/sanity.config.ts
import { SINGLETON_TYPES } from './schemas/structure'

export default defineConfig({
  // ...
  schema: {
    types: schemaTypes,
    // Hide singletons from the "new document" menu:
    templates: (templates) =>
      templates.filter(({ schemaType }) => !SINGLETON_TYPES.includes(schemaType)),
  },
  document: {
    // Disable duplicate + delete for singleton docs:
    actions: (input, context) =>
      SINGLETON_TYPES.includes(context.schemaType)
        ? input.filter(({ action }) => action !== 'duplicate' && action !== 'delete')
        : input,
  },
})
```

Studio `structure.ts` surfaces each singleton as a direct single-document
nav item rather than a list view:

```typescript
const singletonItem = (typeName: string) =>
  S.listItem()
    .title(humanise(typeName))
    .id(typeName)
    .child(S.document().schemaType(typeName).documentId(typeName))
```

Group singletons into topical sections (Static Pages, Blog Hubs, etc.)
so a 34-item nav stays scannable.

---

## Zod Mirror Pattern (MYGRATR-SCHEMA-1)

Every Sanity schema has a matching Zod schema in `src/types/sanity/`.
Same file layout: `documents/`, `singletons/`, `globals/`. Each file
exports both a Zod schema and its inferred TypeScript type:

```typescript
export const TagSchema = SanityBaseDocumentSchema.extend({
  _type: z.literal('tag'),
  name: z.string(),
  slug: SanitySlugSchema,
  category: z.enum([...]),
  singularName: z.string().optional(),
})
export type Tag = z.infer<typeof TagSchema>
```

**Primitives** — `src/types/sanity/shared.ts`:
- `SanityImageSchema` (asset._ref + optional alt/hotspot/crop)
- `SanitySlugSchema` (current + optional _type)
- `SanityRefSchema` (_ref + _type literal 'reference')
- `PortableTextSchema = z.array(z.unknown())` — brief §3.2 rule;
  tightens in TEMPLATE-* when renderers exist
- `SanityBaseDocumentSchema` (_id, _type, _createdAt, _updatedAt, _rev)

**Composition** — `.merge()` shared field groups (`MetaFieldsSchema`,
`SourceTrackingFieldsSchema`) onto the extended base.

**Polymorphic arrays** — `SectionSchema = z.discriminatedUnion('_type',
[RichTextSectionSchema, ...])` for the 12 section variants.

Fields are required by default in Zod; only use `.optional()` when the
design doc marks the field optional. Never use `.required()` on
individual types — that's not the Zod API.

---

## Schema Design Record Pattern (MYGRATR-SCHEMA-1)

`schema_designs` rows store a **curated JSON summary** of each Sanity
document type, not a full serialisation of `defineType()`. Rationale:
`fields[].validation` is a callback function that's not JSON-safe, and
the `sanity` package is installed in `studio/` only, so serialising from
a root `scripts/` script would require an ESM/CJS bridge.

```typescript
sanity_schema: {
  typeName: 'technology',
  title: 'Technology',
  schemaFile: 'studio/schemas/documents/technology.ts',
  sourceCollections: ['technology-pages'],
  sourceItemCount: 101,
  fieldCount: 15,
  requiredFields: ['technologyName', 'slug', 'folds', 'metaTitle', 'metaDescription', ...],
  referenceFields: [{ field: 'associatedTechnologies[]', to: 'technology' }],
  notes: ['Typed folds[] replaces 34 flat fields', 'metaTitle/metaDescription backfill required'],
}
```

The full schema lives in code under `studio/schemas/`. The Supabase row
is a provenance record: captures which Webflow collection(s) contributed,
which fields are required, which refs to which types, and the design
notes that matter for version-over-version diffing. Version bumps create
a new row per CONVENTIONS.md "Sanity Schema Versioning" (§2).

Every row is inserted with `.eq('org_id', ORG_ID)` on write and a fixed
`status='approved'` for the lock. `specialist_reviewed=false` until an
explicit second-pass review records a new `version`.

---

## Generated-Site Layout (MYGRATR-SCAFFOLD-1)

The customer-facing Next.js app lives at `site/` in the same monorepo as
`studio/` (Sanity Studio) and `src/` (orchestrator lib). Vercel deploys
from the repo root with Root Directory overridden to `site/`. The site has
its own `package.json`, `tsconfig.json`, `.gitignore`, and `.env.local`.

**Strict separation across the three packages:**

- `src/` is orchestrator-only: never imported by `site/` (the type folder
  `src/types/sanity/` is duplicated under `site/src/types/sanity/` until
  CONTENT-1 extracts a shared package).
- `studio/` is Sanity Studio only.
- `site/` is the public Next.js site.

**Path aliases:** `@/*` resolves to `site/src/*` inside `site/` and to
`src/*` at the repo root. Always use `@/...` imports inside `site/`; never
use `../../src/...` to reach into the orchestrator (Vercel builds with
Root Directory `site/` won't see anything outside).

---

## Locale Routing for the Generated Site (MYGRATR-SCAFFOLD-1)

CE has US (default) + UK (`/uk/` prefix). This is **a URL prefix
convention, not Next.js i18n** — the `i18n` config in `next.config.ts` is
not used.

Helpers live in `site/src/lib/locale.ts`:

```typescript
export const LOCALES = ['en-US', 'en-GB'] as const
export type Locale = (typeof LOCALES)[number]

getLocaleFromPath(path)        // 'en-GB' if /uk or /uk/..., else 'en-US'
buildLocalePath(path, locale)  // re-prefix or de-prefix as needed
generateCanonical(path, locale)
generateHreflang(usPath)       // { 'en-US', 'en-GB', 'x-default' }
```

**Contract:** every TEMPLATE-* `generateMetadata()` calls
`generateCanonical` and `generateHreflang`. Always pass the canonical US
path (no `/uk` prefix). Both helpers normalise defensively, but callers
should pass the US path for clarity.

**`/uk` prefix guard rule:** strip `/uk` only when the path is `=== '/uk'`
or `startsWith('/uk/')`. Never use a bare `startsWith('/uk')` — that
corrupts paths like `/ukraine/...`.

UK pages live under `site/src/app/uk/`:
- `layout.tsx` wraps in `<LocaleProvider locale="en-GB">`.
- Static UK pages are explicit route files.
- `[...slug]/page.tsx` is a scaffold placeholder that 404s; TEMPLATE-*
  defines explicit dynamic segments per design doc §10.

---

## Third-Party Scripts in the Generated Site (MYGRATR-SCAFFOLD-1)

All global third-party scripts live in
`site/src/components/third-party-scripts.tsx` and are loaded via
`next/script`. The component is split into:

- `<GeoTargetlyScript />` — `strategy="beforeInteractive"`, must run
  before render to redirect at the edge.
- `<GtmHeadScript />` + `<GtmNoScript />` — GTM head + body noscript pair,
  `afterInteractive`. **GA4 fires through GTM**; never load it directly.
- `<GlobalScripts />` — LinkedIn Insight, Clara, Hotjar, Facebook Pixel,
  HubSpot, GSAP, Swiper, Finsweet, Calendly. Calendly uses `lazyOnload`
  globally for now; everything else `afterInteractive`.

**ID provenance rule:** every script identifier is a top-of-file constant
sourced verbatim from `audit-output/ce-scripts.json`. Each `<Script>`
renders only when its identifier is truthy. Unconfirmed IDs return `null`
— never fabricate or guess. Adding a new global script requires confirming
the identifier in audit output first.

---

## Redirect Pipeline for the Generated Site (MYGRATR-SCAFFOLD-1)

`audit-output/` is gitignored and absent on Vercel's build server.
`next.config.ts` must therefore never import from `audit-output/`
directly.

**Pattern:** the one-shot script `scripts/scaffold/extract-redirects.ts`
(`npm run redirects:extract`) reads gitignored audit artefacts and writes
tracked TS files inside `site/src/lib/redirects/`. `next.config.ts`
imports only from those tracked files.

Three generated files:

- `generated-redirects.ts` — crawl-discovered 301/302 from
  `ce-canonical-urls.json`. Drop rows with null `redirectTarget` (no
  destination = no redirect possible).
- `regex-redirects.ts` — Webflow regex rules from
  `ce-regex-redirects.json`. Webflow `(.*)` → Next.js `:slug*`; Webflow
  `%1` → `:slug*`. **Path-to-regexp can't repeat a parameter without a
  prefix-and-suffix separator** — for Webflow `/foo(.*)` (no slash before
  the capture), emit two rules: exact `/foo` and wildcard `/foo/:slug*`.
- `webflow-redirects.ts` — heterogeneous CSV rows from
  `webflow-redirects.csv`. Strip query strings; drop `/live-job-role/*`
  rows (covered by the locked catch-all regex); dedupe against locked
  rules and against rows already emitted by `regex-redirects.ts`.

`next.config.ts` composes them in `[crawl, regex, webflow, lockedRules]`
order. Locked rules come from design doc §8 and are inlined in
`next.config.ts` — they never live in the generated files.

**Next.js `permanent: true` emits HTTP 308, not 301.** This is by design
(308 preserves request method) and is functionally equivalent for SEO.

---

## Sanity Client Pattern in the Generated Site (DESIGN-1 supersedes SCAFFOLD-1's two-client baseline)

**Sanity Single-Client Pattern (DESIGN-1 Brief B §8.3 supersedes SCAFFOLD-1's
two-client setup).** `site/src/lib/sanity/client.ts` exports a single
`sanityClient` (perspective `published`). Stega gating per CMA F-4 v1.3 +
F1+F2+I5 v2.1/v2.2:

- **Branch A:** `SANITY_STEGA_ENABLED === '1' && VERCEL_ENV !== 'production'`
  — explicit opt-in for local dev and any non-production Vercel environment.
- **Branch B:** `VERCEL_ENV === 'preview'` — automatic enable on Vercel
  preview. The v2.0 `&& NODE_ENV !== 'production'` clause was dropped per
  F2 v2.1 because Vercel sets `NODE_ENV='production'` for ALL builds and
  runtimes (preview AND production), so the clause was always false on
  preview and silently broke out-of-the-box preview Visual Editing.
- **Raw-env safety check (F1 v2.1 + I5 v2.2):** if both
  `VERCEL_ENV === 'production'` AND `SANITY_STEGA_ENABLED === '1'` (a
  misconfiguration), emit `console.warn` (NOT `throw` — preserves
  availability under module-scope evaluation in the layout import chain)
  and force `stegaEnabled = false`. The check fires regardless of the
  computed gate, so a future edit that weakens the gate expression is
  still caught. Severity is `console.warn` not `console.error` because
  module-scope code re-evaluates on every serverless cold start and all
  major observability platforms (Sentry, Datadog, PagerDuty, NewRelic)
  map `console.error` to fatal severity at default thresholds — causing
  false-positive on-call pages under concurrent cold-start traffic.
- **Stega gating on `NEXT_PUBLIC_SANITY_STUDIO_URL` presence (F4 v2.1):**
  `stega.enabled` is `stegaEnabled && !!env.NEXT_PUBLIC_SANITY_STUDIO_URL`
  because `createClient` throws at construction when `stega.enabled: true`
  with `studioUrl: undefined` (verified empirically via §8.1.5 probe,
  outcome THROWS). Local dev with the env var unset silently disables
  stega — broken overlays in dev are acceptable; a module-scope
  construction crash that takes down every page render is not.

Server-side draft fetches use `defineLive`'s `serverToken`: the existing
viewer-scoped `SANITY_API_READ_TOKEN`, env-validated as `z.string().min(1)`,
viewer-scope plus draft-read scope verified at Brief B §8.0a F3+F9 probes.
`SanityLive` and `sanityFetch` are produced by
`defineLive({ client: sanityClient, serverToken: env.SANITY_API_READ_TOKEN })`
in `site/src/lib/sanity/live.ts`. There is no direct `SanityLive` export
from `next-sanity` root in v12+; `defineLive` is the factory.

Where a draft-perspective client is required at a specific call site
(e.g., `validatePreviewUrl` in the draft-mode enable route), construct
it as a NAMED module-scope helper (e.g., `previewValidationClient`) per
CMA F-7 v1.3 — equivalence vs SCAFFOLD-1's separate draft-perspective
client export is reviewable in diff. Module-scope (not per-request)
avoids re-instantiation overhead per CMA F-12 v1.3. The construction
site gets an F12+M7 belt-and-braces guard:
`if (!env?.SANITY_API_READ_TOKEN) throw new Error(...)` — optional
chaining is REQUIRED (M7 v2.2) because without `?.` the dereference of
`env.SANITY_API_READ_TOKEN` throws a native `TypeError` BEFORE the
condition evaluates when `env` itself is undefined (the circular-import
edge case F12 defends against), masking the authored diagnostic.

Do NOT export a second draft-perspective client from
`site/src/lib/sanity/client.ts`. Server-only import (`import 'server-only'`)
at the top of every Sanity-client file prevents accidental client-bundle
inclusion.

CMA-C2 + F7 of v2.0 brief Step 8 lock this pattern; CMA F-4 + F-7 + F-12
v1.3 refine; CMA F1 + F2 + F4 + F12 v2.1 sharpen the stega gate and the
F12 guard; CMA I5 + M7 v2.2 finalise severity + optional chaining.

---

## Draft-Mode Route Hardening (MYGRATR-DESIGN-1 Brief B Step 8 supersedes SCAFFOLD-1 baseline)

Two-route pair under `site/src/app/api/draft-mode/` plus a layout flag.
Both routes enforce origin-allowlist auth in front of Sanity's
preview-url-secret protocol. The enable route is GET (per Sanity's
iframe-navigation flow — CMA F-1 v1.3 / §8.4 probe-verified); the
disable route is POST (button click → fetch; CMA F-3 v1.3 Option A).

### Enable route — six-step security order (NEVER reorder)

`site/src/app/api/draft-mode/enable/route.ts`:

1. **Build Origin/Referer allow-list.** Source: `[NEXT_PUBLIC_SITE_URL,
   NEXT_PUBLIC_SANITY_STUDIO_URL]`. Each entry passes through
   `new URL().origin` inside try/catch (fail closed). F8 v2.1 guard:
   reject literal-string `"null"` and empty-string origins (sandboxed
   iframes send `Origin: null` as a literal string — must not enter
   the allow-list). **BvR #34 v2.2 dev-only expansion:**
   `NEXT_PUBLIC_SITE_URL` is the canonical/hreflang URL (e.g.
   `https://staging.jakevibes.dev`), which differs from the local
   serving origin (`http://localhost:3000`). In
   `NODE_ENV === 'development'`, the serving origin from
   `safeUrlOrigin(request.url)` is pushed into `allowedOrigins`.
   Production untouched — Vercel sets `NODE_ENV='production'` on all
   deploy tiers.
2. **Origin/Referer check.** Reads `request.headers.get('origin')` and
   parses `request.headers.get('referer')` via `safeUrlOrigin`. The
   caller origin is `origin ?? refererOrigin`. **BvR #35 v2.2:** Sanity
   Presentation strips BOTH headers on the iframe-initiated enable nav
   — JS-null, not the literal string `"null"`. The route accepts
   `callerOrigin === null` ONLY when the request bears Sanity's
   canonical 3-query-param signature
   (`sanity-preview-secret` + `sanity-preview-perspective` +
   `sanity-preview-pathname`), checked via the `hasSanityPreviewSignature`
   helper. The signature is forgeable — it is NOT a security boundary;
   STEP 3 secret validation is the actual auth gate. Pattern 13
   question (a) empirically verified: literal-string `"null"` still
   rejects (callerOrigin is the string `"null"`, not JS `null`) via
   the `callerOriginAllowed` path because F8 kept `"null"` out of
   `allowedOrigins`. Tests d.5a + d.5b cover this.
3. **Preview-url secret validation.** `validatePreviewUrl(client, request.url)`
   from `@sanity/preview-url-secret`. Wrapped in try/catch — the
   exception path returns 500 WITHOUT enabling draft mode (CMA F6
   v2.1; F-2 v1.3 security ordering). The `previewValidationClient`
   is constructed module-scope (CMA F-7 v1.3 / F-12 v2.1) with the
   `SANITY_API_READ_TOKEN`; the catch-block ID-binding is named `err`
   but MUST NEVER be logged / serialized / forwarded to any
   observability service — Authorization header values may be
   captured inside `validatePreviewUrl`'s internal HTTP-call traces
   (F7 v2.1 prohibition comment).
4. **`redirectTo` same-origin check.** `new URL(validation.redirectTo ?? '/', base)`
   where `base = new URL(NEXT_PUBLIC_SITE_URL)`. If `target.origin !== base.origin`
   → 400 `Invalid redirect target`. STEP 4 is **defense-in-depth**:
   per BvR #36 v2.2, `@sanity/preview-url-secret` does not currently
   expose an off-origin `validation.redirectTo` value (the library
   reads `sanity-preview-pathname` and parses it as same-origin), so
   STEP 4 cannot be exercised end-to-end through the real library
   API. STEP 4 guards against future library regressions where
   `redirectTo` could become externally controllable. **Never reorder
   ahead of STEP 5** — Set-Cookie-on-400 would be the open-redirect-
   into-session-fixation chain F-2 v1.3 specifically guards against.
5. **Enable draft mode.** `(await draftMode()).enable()`. Last
   operation before redirect; never moved earlier in the chain.
6. **Redirect.** `redirect(`${target.pathname}${target.search}${target.hash}`)`
   — same-origin redirect to the validated path; Next.js issues 307.

### Disable route — dual-header check (CMA F-3 v1.3 Option A)

`site/src/app/api/draft-mode/disable/route.ts`:

1. **Build Origin/Referer allow-list** — identical to enable (same
   F8 v2.1 + F14 v2.1 + BvR #34 v2.2 dev expansion).
2. **Dual-check Origin AND Referer.** Both headers MUST match (NOT
   OR). Disable has no preview-url secret — the dual-check IS the
   CSRF barrier. CMA F11 v2.1 acknowledged trade-off: legitimate
   same-origin fetches with stripped Referer (Referrer-Policy:
   no-referrer, privacy extensions) get 403 and must fall back to
   manual cookie deletion. Tech Debt for TEMPLATE-*: the disable-
   button page must set `Referrer-Policy: strict-origin-when-cross-origin`
   or stricter.
3. **`draftMode().disable()`** + return 200 `Draft mode disabled`.

### Helpers (file-local, no cross-import)

- `safeUrlOrigin(url: string): string | null` — wraps `new URL().origin`
  in try/catch; returns null on parse failure. Used for `Referer`
  header parsing and (in enable only) the BvR #34 dev expansion.
- `hasSanityPreviewSignature(url: string): boolean` — checks for the
  3-query-param Sanity signature. **Sanity-specific by design.** Future
  CMS swap (Contentful, Storyblok, etc.) requires renaming the helper
  + signature constants; the architecture pattern (null-origin escape
  hatch gated on protocol-specific signature) transfers as-is.

### Layout integration

Root layout renders `<VisualEditing />` (from `next-sanity/visual-editing`)
only when `(await draftMode()).isEnabled`. `<SanityLive />` always
renders so that live-revalidating fetches keep flowing on the
published site too. The single `sanityClient` (see "Sanity Client
Pattern in the Generated Site" above) is the source for both modes —
the SCAFFOLD-1 two-client baseline (`sanityClient` + `previewClient`)
was collapsed at DESIGN-1 Step 8.3 per CMA-C2 / D4.

### Studio side

`presentationTool` from `sanity/presentation` (the bundled path, not
the deprecated standalone `@sanity/presentation` package) is added to
`studio/sanity.config.ts` plugins, with BOTH `previewMode.enable` AND
`draftMode.enable` pointing at the same `/api/draft-mode/enable`
route. The hardened handler does not need to distinguish — uniform
auth barriers serve both flows (BvR #33 v2.2).

### Customer 2 transfer notes

- The 6-step security order + dual-check disable + F8 literal-`"null"`
  guard + BvR #34 dev expansion + BvR #35 Sanity-null-origin escape
  hatch all transfer **as-is** for any Sanity-migration customer.
- The `hasSanityPreviewSignature` helper is Sanity-specific. CMS
  swaps require renaming the helper and the param-name constants.
- §8.7 integration tests cover STEP 2 (a/d.1-3/d.5a/d.5b), STEP 3 (b),
  STEPs 5+6 (real Sanity flow), and STEP catch-all (e). STEP 4 is
  defense-in-depth without end-to-end integration coverage (BvR #36).

---

## Content Migration Conventions (MYGRATR-CONTENT-1A)

The CONTENT lane reads from a source CMS (Webflow for CE) and writes to
Sanity. Until WordPress/Squarespace adapters land, the lane is single-source
and lives at `src/lib/content/`. These conventions apply to every migrator
in this lane.

**Two clients, one tracker, one seed file:**

- `src/lib/content/webflow-read-client.ts` — single
  `getCollectionItems(collectionId)` helper. Webflow paginates at 100;
  loop with offset+limit and exit when a page returns fewer items than
  the limit (don't compare against `pagination.total` — that can shift
  on live data). Migrators never call the Webflow REST API directly.
- `src/lib/content/sanity-write-client.ts` — `@sanity/client` write
  client. No `'server-only'` import (CLI scripts are not Next.js).
  `apiVersion: '2024-01-01'`, `useCdn: false`, token from
  `env.SANITY_MIGRATION_WRITE_TOKEN` (NOT the legacy
  `SANITY_API_TOKEN` — see "Token Scoping Rule" below). Module-load
  assertion in the client file throws if the migration token is
  unset OR if `SANITY_API_READ_TOKEN` is also present.
- `src/lib/content/migration-tracker.ts` — `recordMigration({...})`
  upserts to `content_migrations` keyed by
  `(org_id, migration_id, collection_slug)`. Computes `parity_score`,
  collects `error_log[]`, sets `status = 'complete' | 'failed'`. Required
  unique constraint:
  `content_migrations_org_migration_collection_unique`.
- `src/lib/content/ce-collection-ids.ts` — typed `as const` map of CE
  Webflow collection IDs in scope for the current CONTENT slice.
  CE-specific values per CONVENTIONS.md §"CE-Specific vs Reusable
  Discipline" — never hardcoded inside lib logic.

**Migrator script shape:**

```typescript
import { ensureSanity, ensureWebflow } from '@/lib/env'
import { CE_COLLECTION_IDS } from '@/lib/content/ce-collection-ids'
import { webflowSlug } from '@/lib/content/migration-helpers'
import { recordMigration } from '@/lib/content/migration-tracker'
import { sanityWriteClient } from '@/lib/content/sanity-write-client'
import { getCollectionItems } from '@/lib/content/webflow-read-client'

ensureSanity()
ensureWebflow()

async function migrate(): Promise<void> {
  const items = await getCollectionItems(CE_COLLECTION_IDS.someCollection)
  const errors: string[] = []
  let migrated = 0
  for (const item of items) {
    try {
      await sanityWriteClient.createOrReplace({
        _id: `someType-${item.id}`,        // deterministic
        _type: 'someType',
        slug: { _type: 'slug', current: webflowSlug(item) },
        // field map from docs/WEBFLOW_TO_SANITY_FIELD_MAP.md
      })
      migrated++
    } catch (err) {
      errors.push(`Failed ${item.id}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }
  await recordMigration({
    collectionSlug: 'some-slug',
    sourceItemCount: items.length,
    migratedItemCount: migrated,
    status: errors.length === 0 ? 'complete' : 'failed',
    errorLog: errors,
  })
  if (errors.length > 0) process.exit(1)
}
```

**Rules:**

- **Deterministic `_id`s.** Every migrated Sanity doc uses
  `{typeName}-{webflowId}`. Idempotent re-runs use `createOrReplace`;
  reference resolution in CONTENT-1B/C is a string-template lookup, no
  ID translation table.
- **`createOrReplace`, not `create`.** Migrators must be safely
  re-runnable.
- **Slug resolution via `webflowSlug(item)`.** The Webflow v2 API
  returns the slug on `fieldData.slug` for every collection; the
  top-level `item.slug` is inconsistent — populated for some
  collections, `null` for others (e.g. team members all have
  `item.slug === null` while `item.fieldData.slug` is the real
  slug). Always use the `webflowSlug(item)` helper from
  `migration-helpers.ts` instead of `item.slug`. The original
  CONTENT-1A migrators referenced `item.slug` directly and shipped
  every CONTENT-1A document with `slug.current = null`; they were
  back-filled in CONTENT-1B by re-running each migrator after the
  helper landed.
- **Pre-flight env guards.** Open with `ensureSanity()` +
  `ensureWebflow()` so a missing token throws immediately with a clear
  message instead of failing mid-migration.
- **Field slugs from the field map.** Webflow `fieldData` keys are API
  slugs (`review-description`, `thumbnail-image`), not display names.
  Use `docs/WEBFLOW_TO_SANITY_FIELD_MAP.md` as the authority; brief
  field tables are indicative only.
- **Webflow Option fields are opaque IDs.** The collection schema
  (`GET /v2/collections/{id}`) exposes `validations.options` as
  `[{id, name}]`. Fetch once at the top of the migrator and map option
  IDs to the target Sanity enum values.
- **Image upload at write time (CONTENT-1B+).** `uploadImage(field)`
  fetches the Webflow CDN URL, uploads via
  `sanityWriteClient.assets.upload('image', Buffer, { filename })`,
  returns a Sanity image asset reference. Failures log a warning and
  return null rather than crashing the migration. CONTENT-1A used a
  `webflowImageUrl` string staging field; that pattern is retired.
  CONTENT-1A image fields (benefitValue.thumbnailImage,
  staffBenefit.icon) still need a one-shot upload pass — deferred to
  CONTENT-1C.
- **Portable Text via JSDOM-injected `parseHtml`.**
  `@sanity/block-tools` defaults to the browser `DOMParser` global
  which doesn't exist in Node. Always pass
  `{ parseHtml: (html) => new JSDOM(html).window.document }` as the
  third argument to `htmlToBlocks`. Without this, every RichText
  field falls back to a single plain-text block — caught during the
  CONTENT-1B team-members spot-check. `jsdom` and `@types/jsdom` are
  required deps.
- **`webflowSlug(item)` for every Sanity slug.** Webflow v2 returns
  the slug only on `fieldData.slug` for some collections; the
  top-level `item.slug` is `null` (e.g. all 28 team members had
  `item.slug === null`). The `webflowSlug` helper reads
  `fieldData.slug` first, falls back to `item.slug`. Never reference
  `item.slug` directly. The original CONTENT-1A migrators did, and
  shipped every CONTENT-1A doc with `slug.current = null`; they
  were back-filled in CONTENT-1B.
- **Webflow MultiReference / Link field shape variance.** Webflow v2
  returns these in two shapes depending on the collection: object
  with `.id` / `.url`, or a plain string (the ID, or the URL).
  `extractUrl` and `toRefs` both accept both shapes. When adding a
  new Webflow-shape helper, follow the same loosening pattern
  rather than special-casing inside each migrator.
- **One `content_migrations` row per slug.** The verifier
  (`content:verify-1a`, `content:verify-1b`, …) reads this table to
  enforce parity. Assert `migrated_item_count === expected` and
  `status === 'complete'`; exit non-zero on failure.
- **Per-script npm runner.** Every migrator gets its own
  `content:migrate-{slug}` npm script for individual re-runs; the phase
  orchestration runs them in sequence by hand.

---

## Async toPortableText with Inline Image Upload (MYGRATR-CONTENT-1C)

`toPortableText` is async and uploads inline `<img>` tags from Webflow
RichText to real Sanity assets via a two-pass walk. CONTENT-1B's
synchronous variant silently dropped every `<img>`; CONTENT-1C catches
them. Every caller must `await` the helper.

```typescript
// Pass 1 — extract and upload (one broken CDN URL must not abort the doc)
const doc = new JSDOM(html).window.document
const srcs = [...doc.querySelectorAll('img')]
  .map(img => img.getAttribute('src'))
  .filter((s): s is string => !!s)
const results = await Promise.allSettled(srcs.map(uploadAssetFromUrl))
const srcToAssetRef = new Map(/* fulfilled results only */)

// Pass 2 — deserialize with image rules
return htmlToBlocks(html, blockContentType, {
  parseHtml,                 // JSDOM-backed, same parser as Pass 1
  rules: [{ deserialize(el, _next, block) { /* <img> + <figure> */ } }],
})

// Inside scripts/content/*.ts
aboutContent: await toPortableText(f['about-content']),

// Inside .map() callbacks
const faqs = (await Promise.all(
  Array.from({ length: 6 }, (_, i) => i + 1).map(async (n) => ({
    _key: `faq-${n}`,
    question: f[`faq-title-${n}`],
    answer: await toPortableText(f[`faq-content-${n}`]),
  }))
)).filter((faq) => faq.question)
```

**Rules:**

- Always `await` the call. Inside `.map()`, wrap with
  `await Promise.all(...)` over the inner async map.
- Use `Promise.allSettled` for image uploads, never `Promise.all` — one
  broken CDN URL must not abort the whole document.
- `<figure>` deserializer MUST check for an `<img>` child before
  processing. Iframe-in-figure (Vimeo embeds) lacks one — return
  `undefined` so the body falls through to text rules. Emitting an
  image block with `_ref: undefined` corrupts Sanity references.
- Both Pass 1 src extraction and Pass 2 deserialization must use
  JSDOM. Mixing a regex extractor in Pass 1 with the DOM parser in
  Pass 2 produces an entity-encoding mismatch (`&amp;` ≠ `&`) and the
  Pass 2 `<img>` rule will look up a key that doesn't exist in the
  map.
- Null guard at entry — `null`, `undefined`, and empty strings all
  return `[]`. Every nullable RichText call site (customerStory empty
  fields, FAQ answers) is protected by the helper, not by the caller.
- The compiled block-tools schema must register the `image` type
  alongside `block` so `htmlToBlocks` can emit image blocks. Add the
  registration once per process — it lives in
  `migration-helpers.ts`.

---

## Cross-Collection Dedup with Parity Baseline (MYGRATR-CONTENT-1C)

When multiple Webflow source collections consolidate into one Sanity
type and contain duplicate items (slug collision), designate one
collection as the canonical master and dedupe every other collection
against it. Each item's category/tag/etc. comes from its own
`resource-category` ref — never from its source collection. The
`migration-tracker` accepts an optional `parityBaselineCount` so
`parity_score` is measured against the deduplicated set rather than
raw source count.

```typescript
// In the migrator
const globalSlugSet = new Set<string>(sanityExistingSlugs)

for (const collection of CE_BLOG_COLLECTIONS) {
  const items = await getCollectionItems(collection.id)
  const isMaster = collection.id === CE_COLLECTION_IDS.blogsAndGuides

  const eligible = items.filter((item) => {
    const slug = webflowSlug(item)
    if (!slug) return false
    if (!isMaster && globalSlugSet.has(slug)) return false  // dup
    return true
  })

  for (const item of eligible) {
    await sanityWriteClient.createOrReplace(buildDoc(item))
    const slug = webflowSlug(item)
    if (slug) globalSlugSet.add(slug)
  }

  await recordMigration({
    collectionSlug: collection.collectionSlug,
    sourceItemCount: items.length,        // full Webflow count
    migratedItemCount: eligible.length,   // unique-only that we wrote
    parityBaselineCount: eligible.length, // parity baseline
    status: 'complete',
    errorLog: [],
  })
}
```

**Rules:**

- Pre-flight slug-collision check is a hard gate. Before writing any
  documents, fetch every slug across the union of source collections
  and report duplicates. Stop on collision in a single-source
  migrator (compareBlog). For multi-source dedup migrators (blogPost),
  the duplicates are expected — designate the canonical master and
  iterate it first.
- Seed the `globalSlugSet` with slugs already in Sanity for
  partial-rerun resilience. A previously-migrated slug at a different
  `_id` won't be re-written under a new ID.
- `parityBaselineCount` defaults to `sourceItemCount`. Override only
  when the collection participates in cross-collection dedup AND the
  "expected to migrate" count is smaller than the source count.
- Vacuous success (denominator=0, migrated=0, no errors) yields
  `parity_score = 100`. Without this, a sub-category collection
  whose every item duplicates the master would false-fail the Step 7
  verifier with `parity_score = 0`.

---

## Live-Site Meta Backfill Pattern (MYGRATR-CONTENT-1D)

When meta tags (`metaTitle`, `metaDescription`) need to be populated from
the customer's live site rather than the source CMS, the pipeline is
Playwright-backed and serial. The reusable shape:

```typescript
// src/lib/content/meta-scraper.ts
export async function scrapeMeta(browser: Browser, url: string): Promise<ScrapedMeta>
export async function withBrowser<T>(fn: (b: Browser) => Promise<T>): Promise<T>

// src/lib/content/meta-normaliser.ts
export function normaliseMeta(raw): NormaliseResult        // strips brand suffixes, enforces 60/140-160
export function truncateAtWord(s: string, max: number): string

// src/lib/content/meta-backfill-runner.ts
export async function runMetaBackfill(opts: RunOptions): Promise<void>
```

**Rules:**

- `waitUntil: 'domcontentloaded'`, 20s per-page timeout. `page.title()`
  reads `document.title` (post-JS-mutation) — correct semantic for SEO.
- Concurrency is **serial** — one Playwright context at a time.
  Customer hosting (especially shared / Cloudflare-fronted) will throttle
  parallel scrapes.
- **1.5-second inter-request delay** between fetches, skipped on the
  last iteration. Run during off-peak hours (timezone-aware) to minimise
  collision with live customer activity.
- **20-minute phase-wide wall-clock abort gate** in the runner. Hard
  `process.exit(1)` (NOT `break`) — break would let the script continue
  to the next collection. Failure `content_migrations` row written
  BEFORE the exit so the verifier sees an explicit "phase aborted" signal.
- **Never pad / fabricate a metaDescription to hit 140 chars.** Short is
  recoverable in Studio; fabricated is not. The normaliser logs a
  warning when a description falls below 140 chars and the runner
  surfaces this via `needsReview = true`.
- Brand-suffix stripping is the only customer-specific bit of the
  normaliser; pass `BRAND_SUFFIXES` as an arg when generalising.
- **Hard failures vs soft warnings** in the runner: HTTP non-200,
  length issues, missing optional fields are SOFT (logged, surfaced via
  `needsReview = true`, do not mark the `content_migrations` row
  `failed`). Only `patch.commit()` errors, `urlForDoc` throws, and
  bypass-patch errors are HARD. The row's status semantically reflects
  "did the migration step succeed end-to-end" — drift docs (404 from
  the live site) are not script failures.
- **Per-field provenance must split** (`metaTitleSource` +
  `metaDescriptionSource`). A single `metaSource` object can't represent
  the case where title comes from live-scrape but description comes from
  a different upstream source (e.g. `snippetForMeta-copy` for review docs).

**FieldPolicy enum** drives runner behaviour declaratively:

```typescript
interface FieldPolicy {
  title: 'scrape-always'
  description: 'scrape-always' | 'skip-if-present-else-scrape'
              | 'snippet-copy-else-scrape' | 'never-touch'
}
```

`'never-touch'` is structural — the runner MUST NOT call `scrapeMeta()`
for the description field, MUST NOT normalise it, MUST NOT validate it.
It writes only `metaTitle` (always scraped) and the doc's other fields
remain untouched.

**Pre-scrape decision hook** evaluated BEFORE URL construction:

```typescript
type PreScrapeDecision =
  | { kind: 'continue' }
  | { kind: 'bypass'; patch: Record<string, unknown> }
```

Lets per-collection scripts short-circuit known-placeholder docs (e.g.
`/customer-story/virgin`) with a hardcoded patch and `provider:
'placeholder'` provenance, without ever fetching the live URL.

---

## Deletion Safety Rule (MYGRATR-CONTENT-1D)

**Migration scripts MUST use `deleteByIdStrict()` for all deletions.**
Query-based delete patterns (`*[name == ...]` then iterate-and-delete,
or `*[slug.current == ...]`) are forbidden — `name` and `slug` are
mutable, non-unique fields and using one as a deletion key is a
single-keystroke disaster waiting to happen.

```typescript
// src/lib/content/migration-helpers.ts
export async function deleteByIdStrict(
  client: SanityWriteClient,
  id: string,
  expectedType: string,
): Promise<void>
```

The double-guard:
1. Caller passes the exact `_id` (no querying for it).
2. Helper fetches the doc and asserts `_type === expectedType` BEFORE
   delete. Even if the wrong `_id` is passed, the type mismatch halts
   before any destructive call.

**Throws on:** doc not found at the supplied `_id`; doc found but `_type`
doesn't match expectedType.

**Idempotency:** callers handle "doc already gone" themselves (catch the
not-found throw and continue). The strict default keeps accidental
no-ops from masking deletion-graph mistakes.

When deleting a graph of related docs, **order matters** — delete the
ref-holders FIRST so subsequent deletions don't trip the brief's
halt-on-refs guard. Document the ordering in a top-of-file comment in
the deletion script.

---

## Verifier-Throws Pattern (MYGRATR-CONTENT-1D)

State-transition scripts that depend on a verifier's pass/fail decision
**must rely on structural unreachability**, not boolean return-value
inspection.

```typescript
// scripts/content/verify-content-1d.ts
export async function verifyContent1D(opts: VerifyOptions = {}): Promise<void> {
  const failures: string[] = []
  // ... all checks push to `failures` (do NOT short-circuit)
  if (failures.length > 0) {
    throw new Error(`Content-1D verification failed:\n${failures.map(f => `  - ${f}`).join('\n')}`)
  }
}

// scripts/content/complete-content-phase.ts
async function main(): Promise<void> {
  if (!process.argv.includes('--confirm')) {
    console.error('Refusing to run without --confirm flag.')
    process.exit(1)
  }
  await verifyContent1D({ skipStateCheck: true })   // throws on failure → unhandled rejection
  await assertValidTransition(current.status, 'content_complete')
  await supabase.from('migrations').update({ ... }).eq('id', migrationId)
}
main()   // NO `.catch(...)` — unhandled rejection intentionally propagates
```

**Rules:**
- The verifier function exports `Promise<void>` and throws on any
  failure. Never returns a boolean.
- Collect all failures into an array and throw once at the end with
  every failure joined. Don't fail-on-first.
- The state-transition script MUST NOT wrap the verifier call in
  try/catch.
- The script's `main()` must be invoked WITHOUT `.catch()` at the top
  level. The unhandled rejection is intentional — it propagates to
  Node's top-level handler, the process exits non-zero, and the lines
  AFTER the verifier call (`assertValidTransition`, the Supabase
  update) become structurally unreachable.
- `--confirm`-style flags gate HUMAN INTENT. The verifier is the
  CORRECTNESS gate. Both are required.
- If the verifier needs to be invoked from a context where the
  state-related checks aren't yet meaningful (e.g. before the
  state transition has happened), expose a `{skipStateCheck: boolean}`
  option rather than a separate verifier function.

---

## Token Scoping Rule (MYGRATR-CONTENT-1D)

Destructive operations (writes, patches, deletes, asset uploads) must
use a least-privilege scoped token, separate from any read tokens.

**For the CE Sanity dataset (CONTENT-1D and beyond):**

- `SANITY_MIGRATION_WRITE_TOKEN` — single-dataset (`production`),
  least-privilege (document patch + delete + asset upload only — no
  project-admin, no all-datasets).
- `SANITY_API_READ_TOKEN` — site read-only token; lives in
  `site/.env.local` ONLY. **Must NEVER be present in the migration
  script process.**

`src/lib/content/sanity-write-client.ts` calls
`ensureSanityMigrationWriteToken()` at module load:

```typescript
if (!env.SANITY_MIGRATION_WRITE_TOKEN) {
  throw new Error('SANITY_MIGRATION_WRITE_TOKEN required')
}
if (env.SANITY_API_READ_TOKEN) {
  throw new Error('SANITY_API_READ_TOKEN must NOT be present in migration script context')
}
```

The read-token-presence check is the path-alias collision guard (F14):
if a migration script accidentally imports `@/lib/sanity/client`
(resolves to the site's read client), the read token's presence in the
process would be the only signal something's wrong. The throw at
module load short-circuits before any write happens.

**Rules:**
- A new least-privilege token per phase that performs writes against
  shared infrastructure.
- Token rotation is a hard pre-launch gate, not optional tech debt.
  CONTENT-1D rotation tracked as Tech Debt #15: **MUST resolve before
  MYGRATR-LAUNCH** (Exit Criterion #10).
- Document both tokens in `.env.example`. `.env.example` carries the
  comment that the read token is intentionally absent in the migration
  context.

---

## Path Alias Discipline (MYGRATR-CONTENT-1D)

The monorepo has two `@/*` path aliases — `@/*` resolves to `src/*` at
the repo root and to `site/src/*` inside `site/`. Migration scripts run
from the repo root and must import the migration write client only from
the orchestrator lib, never from the site's read client.

**Rule:** migration scripts under `scripts/**` and library code under
`src/lib/content/**` import `sanityWriteClient` exclusively from
`@/lib/content/sanity-write-client`. They MUST NOT import from
`@/lib/sanity/*` or from `site/src/lib/sanity/*`.

**Two-layer guard:**

1. **Static check** — the prereq verifier runs a regex grep across
   `scripts/**` and `src/lib/content/**` for forbidden import patterns
   (`@/lib/sanity/*`, `site/src/lib/sanity/*`). The check is part of
   `verify-content-1d-prereqs.ts` and ran clean every time it was
   invoked. (An ESLint `no-restricted-imports` rule would also work
   if/when ESLint is added at repo root.)
2. **Runtime assertion** — the read-token-presence check in the
   write-client (Token Scoping Rule above) is the load-bearing guard.
   Even if a wrong import slips past static analysis, the throw at
   module load happens before any write.

---

## Two-Factor scrapedAt-Guarded Unset (MYGRATR-CONTENT-1D)

When clearing a monotonically-set flag is necessary as a one-off
correction (e.g. clearing false-positive `needsReview` flags from a
buggy migrator pass), the protection MUST be structural — not a
temporal "I'll be careful" — so future re-runs of the migrator can't
accidentally re-trigger the clear logic on a legitimate flag.

```typescript
// guard 1: flag must currently be the artefact value
if (doc.needsReview !== true) throw new Error('flag may already be cleared, or never set')

// guard 2: the doc must carry a provenance timestamp from the known buggy-run date
const scrapedAt = doc.metaTitleSource?.scrapedAt
if (typeof scrapedAt !== 'string' || !scrapedAt.startsWith('2026-05-02')) {
  throw new Error('flag may have been set by a later legitimate review pass')
}

// only after BOTH conditions pass
await sanityWriteClient.patch(doc._id).unset(['needsReview']).commit()
```

**Why both factors:** the flag value alone (`needsReview === true`)
doesn't distinguish "buggy-pass artefact" from "real review". The
scrapedAt timestamp pinpoints exactly which migrator run set the value.
Re-running the migrator after the buggy run moves `scrapedAt` to a new
date → the guard refuses → no clearance fires.

**Use sparingly.** This is a one-off corrective tool, not a routine
pattern. The brief's monotonic-flag rule still holds for general
operations. Document each application as a brief deviation.

---

## Migrator Field-Write Pattern — Conditional Spread (MYGRATR-CONTENT-1D-CLEANUP)

Migrators that read an optional source-CMS field and may produce a
null/missing result MUST omit the field via conditional spread rather
than writing `null` into the doc literal. Sanity's strict validation
flags any null literal stored under a key whose schema declares a
non-nullable type (e.g. `image`, `reference`, `url`) as
"Invalid property value — The property value is stored as a value type
that does not match the expected type". The fix is to make the field
absent on the doc rather than present-with-null.

```typescript
// WRONG — writes null literal when uploadImage returns null;
//        Studio flags every doc with "Invalid property value"
const doc = {
  _id: `service-${item.id}`,
  _type: 'service',
  thumbnail: await uploadImage(f['thumbnail']),  // ← null when source empty
  // ...
}
await sanityWriteClient.createOrReplace(doc)

// CORRECT — field absent on doc when source is empty
const thumbnail = await uploadImage(f['thumbnail'])
const doc = {
  _id: `service-${item.id}`,
  _type: 'service',
  ...(thumbnail ? { thumbnail } : {}),
  // ...
}
await sanityWriteClient.createOrReplace(doc)
```

**Rules:**

- Applies to every nullable schema field sourced from external CMS:
  `image`, `reference`, `url`, optional `string`, etc.
- The conditional MUST NOT be `field !== null` alone — also reject
  empty strings, empty arrays, and other falsy-but-present shapes that
  the schema would reject. Use the field-type-appropriate predicate.
- Migrators that write `null` for "the value is intentionally empty"
  on a `string` field must instead use `Rule.allowNull()` on the
  schema or omit the field entirely. Never write `null` to satisfy a
  template's `?? defaultValue` fallback — Sanity's storage layer is
  not the place to encode editorial defaults.
- Worst-offender example surfaced in CONTENT-1D-CLEANUP:
  `migrate-customer-stories.ts` wrote `openGraphImage: null` for
  every customerStory doc, ensuring Studio flagged 17/17 docs even
  though the schema was happy with the field being absent.

**Detection / cleanup pattern when this rule has been violated** (see
`scripts/content/cleanup-*.ts` for working examples):

1. Read-only diagnostic walks every doc, classifies each schema-declared
   non-primitive field as `absent` / `null` / `valid` / `invalid` (must
   inspect raw doc shape — GROQ projection conflates absent with null).
2. Per-doc guarded `.unset(['fieldName'])` patch with a literal-null
   assertion before the destructive call.
3. Halt on first guard failure across all ops in the cleanup phase
   (`process.exit(1)`); recovery is "re-run from scratch" not "continue
   past failure".
4. Audit-trail row in `content_migrations` per cleanup op even though
   the data correction sits outside the original phase scope.

---

## Path-Patch Primitive for Nested Array-of-Object Fields (MYGRATR-CONTENT-1D-CLEANUP)

Sanity's `@sanity/client` supports `_key`-addressed path patches for
nested fields inside arrays-of-objects. This is the right primitive
when only specific elements inside an array need a change and a full
array-rewrite would be wasteful or unsafe.

```typescript
// Unset featuredImage on the fold whose _key === "fold-1":
client.patch(id).unset(['folds[_key=="fold-1"].featuredImage']).commit()

// Multiple paths in one atomic patch:
client.patch(id).unset([
  `folds[_key=="${k1}"].featuredImage`,
  `folds[_key=="${k2}"].featuredImage`,
]).commit()
```

**Rules:**

- **Address by `_key`, never by positional index.** Array reordering
  in Studio leaves `_key`s stable but shifts indices.
- **Validate `_key` is a non-empty string before constructing the
  path.** A missing or non-string `_key` produces a path that either
  silently no-ops or targets the wrong element. The cleanup pattern:

  ```typescript
  for (const fold of doc.folds) {
    if (typeof fold !== 'object' || !fold) continue
    if (!('featuredImage' in fold)) continue
    if (fold.featuredImage !== null) continue
    if (typeof fold._key !== 'string' || fold._key.length === 0) {
      throw new Error(`fold with featuredImage:null has invalid _key`)
    }
    targetKeys.push(fold._key)
  }
  ```
- **Probe new path syntax before destructive use.** The first time a
  codebase exercises a path-patch shape, write a one-shot read-only
  probe that constructs the patch via `client.patch(id).unset([...])`,
  calls `PatchBuilder.toJSON()` to inspect the serialised payload, and
  prints — without committing. Confirms the client accepts the syntax
  and emits the expected `{ id, unset: [<paths>] }` shape. See
  `scripts/content/probe-path-patch-syntax.ts` for the canonical example.
- **Atomic per-doc patch.** Collect every `_key` for a doc into one
  patch builder; issue ONE `.commit()` per doc covering all in-scope
  elements. Splitting into multiple commits per doc is wasteful and
  introduces a window where the doc is partially patched.
- **`'fieldName' in obj` distinguishes absent from null.** `obj.field`
  alone returns `undefined` for both cases. The cleanup pattern uses
  `'featuredImage' in fold` AND `fold.featuredImage !== null` to
  target only entries where the key is present and the value is null
  (the buggy case), skipping both already-absent entries and
  valid-image entries.

---

## Brief Deviation Logging (MYGRATR-CONTENT-1D)

When a phase encounters scope or constraints that require deviating
from the locked brief, document each deviation explicitly:

1. **Per-deviation `content_migrations` row.** New `collection_slug`
   identifying the deviation (e.g. `drift-cleanup`,
   `bookacall-metadescription-truncation`,
   `bookacall-stale-needsreview-unset`). The row's `error_log` carries
   the rationale + the affected `_id` list.
2. **Per-doc structural guards.** Every write inside a deviation passes
   through preconditions that fail closed if state has shifted since
   the deviation was authorised (length-snapshot match,
   provenance-timestamp prefix, etc.).
3. **Numbered deviation IDs in commit messages, brief deviation log,
   and PHASE_HISTORY.** Pattern: `DEV-N` where N is a monotonic counter.
4. **Halt on first guard failure.** Deviations are bundled but NOT
   greedy — a single state mismatch halts the operation; the user
   re-diagnoses before any further writes.
5. **Verifier expectations updated.** The verifier's
   `ALL_NEW_1D_SLUGS` list (or equivalent) extends to include each
   deviation's `content_migrations` slug; counts and totals update
   accordingly.

---

## Token System Pattern (MYGRATR-DESIGN-1)

Tailwind v4 is CSS-first per DEV-3. The single source of truth for
design tokens is `site/src/app/tokens.css` (NOT a JS config — v4
dropped `tailwind.config.ts` for CSS-first); `site/src/app/globals.css`
imports it. Tokens defined inside `@theme {…}` generate Tailwind
utility classes automatically — IF AND ONLY IF the token name uses
the v4 namespace expected for its property type:

| CSS property | Required v4 namespace |
|---|---|
| color | `--color-*` |
| font-size | `--text-*` (NOT `--font-size-*`) |
| font-family | `--font-*` (NOT `--font-family-*`) |
| font-weight | `--font-weight-*` |
| line-height | `--leading-*` (NOT `--line-height-*`) |
| transition-duration | `--duration-*` (NOT `--motion-duration-*`) |
| transition-timing-function | `--ease-*` (NOT `--motion-easing-*`) |
| spacing | `--spacing` (single scalar; utilities multiply: `p-3 = calc(var(--spacing) * 3)`) |
| border-radius | `--radius-*` |
| box-shadow | `--shadow-*` |
| breakpoint | `--breakpoint-*` |

**Multi-namespace probe is mandatory before locking tokens** — verify
each namespace's utility classes appear in compiled `output.css` after
a token edit. Customer-2 onboarding MUST run this probe (logged as
DEV-5; a prior assumption based on colour-only aliasing was wrong).

**Dual-consumer pattern.** Tokens read by both Tailwind utilities AND
non-Tailwind code (e.g. GSAP via `getComputedStyle`) declare a
`--{semantic}-*` source-of-truth group plus `--{tailwind-namespace}-*`
aliases via `var()`. Single source, two consumers, no drift:

```css
--motion-reveal-duration: 500ms;                    /* GSAP source */
--duration-reveal: var(--motion-reveal-duration);   /* Tailwind alias */
```

**Raw-value rule.** Raw hex / px / ms forbidden in project source files
(`site/src/**`) — every Tailwind class must resolve to a `tokens.css`
entry. Vendor CSS in `node_modules` exempt. Two narrow exceptions
documented inline at the source: (a) **literal arbitrary values via
Tailwind v4 `bg-[#xxxxxx]` / `text-[14px]` syntax** when no token
exists AND adding one for a single one-off use is over-engineering
(e.g. A5 Accordion's `bg-[#0e100f]` for the plus/× black circle —
`brand-tertiary` is navy, `text-default` is grey, neither matches
CE's `#0e100f`); (b) **inline style for one-off easing** (e.g.
`style={{ transitionTimingFunction: 'cubic-bezier(.165,.84,.44,1)' }}`
on the same accordion icon — not promoted to a `--ease-*` token
because it appears in exactly one place).

Reference: `docs/design/TOKENS.md` (per-token catalogue + provenance);
running notes in `docs/CAPABILITY_LOG.md`.

---

## Primitive Component Pattern (MYGRATR-DESIGN-1)

22 brand-inventory primitives + Icon foundation = 23 components live
under `site/src/components/ui/{name}/index.tsx` (folder-per-primitive
per v2.0 supersession of v1.5's flat shape). 10 categorical patterns
established at Step 2; full enumeration in `docs/CAPABILITY_LOG.md`
under "Primitive component patterns — 10 categorical patterns".
Summary:

1. **Hand-built atop @radix-ui** — direct Radix consumption with CVA
   + Tailwind v4 utility classes. **No shadcn dependency** (CE brand
   warrants probe-first; shadcn AI-aesthetic defaults net higher
   unwind cost than starting from raw Radix).
2. **CVA-standardised variant API** — every primitive uses
   `class-variance-authority` for variants. The `variants:` object is
   the contract surface; Step 4 templates rely on its predictability.
3. **No-className-variants rule** — variants are CVA inputs, not
   arbitrary `className` overrides. `className` is for one-off layout
   adjustments only (margins, widths). Variant-shaped behaviour goes
   through CVA.
4. **SVG sprite for icons** — no `lucide-react`, no Material Symbols.
   9 CE-derived glyphs at `site/public/icons/sprite.svg`, served via
   `<Icon name="..." />` with typed `IconName` union. Source-of-truth
   at `site/src/components/ui/_icons/sprite.svg`; emitted via
   `scripts/design/emit-icon-sprite.mjs`.
5. **GSAP banned from primitives** — CSS transitions/animations only.
   GSAP scoped to Tier-1 composite components (Step 3 spec).
6. **Probe-first discipline (Hard Rule #2)** — every primitive
   shipping decision backed by a `scripts/design/probe-*.mjs` script
   + JSON output in `audit-output/design-1/`. Decisions made without
   a probe are inevitably wrong (see HALT-Discipline Pattern below).
7. **Per-primitive folder structure** — `{name}/index.tsx` enables
   co-located `stories.tsx` (Path-A-conditional at Step 4),
   `index.test.tsx`, and primitive-internal helpers.
8. **Inline source-comment as primitive-level spec** — each
   `index.tsx` carries probe-driven decisions + DEV-N references in
   the file's top-of-file comment. Tier-1 composite components still
   get external 8-section specs at Step 3; primitives don't.
9. **Layout-root provider mount** — TooltipProvider + ToastProvider
   mount once at `site/src/app/layout.tsx`. `delayDuration={300}`
   overrides Radix's 700ms tooltip default. Primitives never bring
   their own provider.
10. **Form integration split** — register-based for native HTML
    children (Input/Textarea/Checkbox/RadioGroup), Controller-based
    for Radix-controlled children (Select). C5 FormField smart
    wrapper auto-handles ids + aria + error reading via
    `useFormContext()`.

Reference: `docs/design/COMPONENTS.md` (single-source primitive
inventory; one row per primitive with path/type/deps/variants/usage
notes); `docs/CAPABILITY_LOG.md` (productisation IP framing per
pattern).

---

## HALT-Discipline Pattern (MYGRATR-DESIGN-1)

Visual eyeball at HALT 10 (kitchen-sink `/demo` route comparison
against the live source site, side-by-side in two browser windows)
catches what static checks miss. Visual brand-pattern divergences
pass tsc + build cleanly because they're not type errors or runtime
errors — they're **fidelity errors**. Four patterns established at
Step 2's HALT 10 close; full text in `docs/CAPABILITY_LOG.md` under
"HALT-discipline patterns captured at HALT 10". Summary:

1. **Probe-first dismissal protocol** — when a probe surfaces an
   unfamiliar pattern, the burden of proof is on DISMISSAL, not on
   adoption. "Likely Webflow artifact" / "modern convention is
   better" are speculation, not evidence. Custom-named class names
   (`faq-btn` not `w-*`) signal intentional brand design. Hard Rule
   #2 visual fidelity overrides "modern convention" assumptions when
   the source pattern is sitewide and intentional. The A5 Accordion
   chevron-vs-plus/× catch is the canonical case (DEV-12 retroactive
   correction, commit `4c0514f`).
2. **HALT 10 visual eyeball as last-line defense** — non-negotiable
   for any customer with brand fidelity requirements. Schedule
   explicit time for human review against the live source site,
   side-by-side. Specifically check: button text colours, icon
   patterns within components (accordion toggles, dropdown
   indicators, close buttons), hover states, focus states, animation
   timing/easing.
3. **Browser cache trap** — HALT 10 checklist line item #1 =
   hard-refresh (Cmd-Shift-R) + DevTools cache-disabled before any
   visual review. False-positive bugs at HALT 10 should ALWAYS
   verify against probe data + compiled CSS before triggering a fix
   cycle.
4. **Demo-route width is layout context, not a primitive bug** —
   primitives are width-agnostic by design (width is parent-
   controlled). Distinguish primitive bugs (rendering wrong content/
   styling) from layout-context observations (rendering correctly
   but in different parent context than production templates).
   Layout-context observations defer to template phase, never
   trigger primitive fixes.

---

## Tier-1 Component Spec Pattern (MYGRATR-DESIGN-1 Step 3)

5 Tier-1 components identified at the Step 3a audit walk and locked at HALT 1
(`docs/design/TIER_1_INVENTORY.md` v1.0 — 1 High + 3 Medium + 1 Low). Each has
an 8-section spec at `docs/design/components/{slug}.md`. Verifier asserts file
structure at Step 10.

**8 mandatory sections** (in order):

1. **Behaviour** — plain-language description of what the component does, in
   what order, in response to what triggers. Variant notes (sibling shapes
   not specced here) called out inline.
2. **State machine** — ASCII or mermaid diagram for non-trivial mechanisms;
   skip if single-state.
3. **Tech stack** — library + version pin + rationale (per Step-3 brief §3:
   "GSAP if reproducing live-site timelines; CSS-only if the live site is
   also CSS-only; library if the live site uses one"). Lists ALL relevant
   primitives from `docs/design/COMPONENTS.md` as composable inputs (no cap
   — Step-4 template authors need the full shopping list). Render utilities
   cite "None — render utility" cleanly.
4. **Timing** — per-spec provenance paragraph at the top (see "5 §4 Timing
   Provenance Shapes" below) + table of timings with phase / duration /
   easing / property columns. Boilerplate copy-paste destroys the section's
   purpose.
5. **Breakpoints** — desktop / tablet / mobile + reduced-motion. TBD-pending-
   capture markers acceptable at first-spec; resolve during 3c/3d/3e captures
   pass.
6. **Data binding** — Sanity field paths AND a GROQ query shape **per Path A
   mechanical trigger** (see below). Render utilities declare "N/A — render
   utility".
7. **Edge cases** — empty-data, slow-load, reduced-motion (mandatory),
   keyboard, screen reader, plus component-specific cases.
8. **Acceptance criteria** — checkbox list verifiable in QA-1.

Trailing **Schema-vs-reality findings** section captures any schema gaps with
enum-tagged resolution direction (one of: `schema-relax`, `template-fallback`,
`data-backfill`, `deferred-to-STATIC-1`, `deferred-to-SCHEMA-2`,
`decision-needed`, or `N/A — render-discipline note`).

---

## 5 §4 Timing Provenance Shapes (MYGRATR-DESIGN-1 Step 3)

The §4 Timing provenance paragraph adapts per-spec to the component's tech
stack — never copy-pasted boilerplate (D3 lock from Step-3 brief). 5 distinct
shapes documented as productisation IP:

| Shape | When | Provenance template |
|---|---|---|
| **Library-mediated** | Component uses a JS library other than GSAP (Swiper, framer-motion, etc.) | "Library-mediated, not GSAP-driven. Shim does not capture library internals — structural gap, not F10/F11/F12 failure. Timings extracted manually from inline init script in `audit-output/ce-template-custom-code.json`." |
| **GSAP-clean** | Single GSAP call, post-assignment, no caveats | "GSAP-driven and clean. Shim captured the call. No F10/F11/F12 caveats. All timings shim-extracted with no concerns." |
| **GSAP-mixed** | GSAP + plain JS, or `ScrollTrigger.create()` static methods that bypass shim | "Partially shim-extracted, partially source-code-extracted, partially library-default. Per-call provenance noted. CSS class-toggle timings TBD-pending-capture if applicable." |
| **CSS-only** | No GSAP, no JS, no library | "No GSAP, no JS, no library. Shim structurally inapplicable — nothing to capture. F10/F11/F12 do not apply. All timings CSS-source-extracted from compiled CSS." |
| **GSAP attribute-selector orchestration** | Sitewide pattern via attribute selectors; multi-instance per page | "Partially shim-extracted (multiple instances captured cleanly across multiple pages), partially source-code-extracted (full orchestration source in custom-code.json). Cross-page corroboration plus source confirms config. Implicit library defaults documented." |

**Customer-2 take-away:** classify the component's tech stack first; pick the
matching shape; fill in specifics. The shapes name the productisation IP
explicitly so spec-author cognitive load drops on subsequent specs.

---

## Render-Utility Classification (MYGRATR-DESIGN-1 Step 3)

Three component categories now exist:

| Category | Phase | Location | §6 Data binding |
|---|---|---|---|
| **Primitive** | Step 2 | `site/src/components/ui/{name}/index.tsx` | composed by Tier-1 / template; primitives don't query data |
| **Tier-1 component** | Step 3 | `docs/design/components/{slug}.md` (spec) + `site/src/components/...` (TBD-TEMPLATE-* path) | **GROQ + field paths required** |
| **Render utility** | Step 3 (new category) | `docs/design/components/{slug}.md` (spec) + `site/src/components/utilities/` or `/animations/` (TBD-TEMPLATE-* path) | **"N/A — render utility" allowed** when the component does not touch Sanity data anywhere |

Render utilities **orchestrate** other components rather than composing
primitives, AND do not touch Sanity data. They get 8-section specs for the
same reason Tier-1 components do: TEMPLATE-* phases would otherwise
reverse-engineer them. Classification is mechanical (see "Path A Mechanical
Trigger" below).

The DESIGN-1 Step 3 inventory has 1 render utility (#1
section-fade-reveal-global) — sitewide GSAP attribute-selector orchestration.
The other 4 components touch Sanity data and follow Tier-1 component rules.

---

## Path A Mechanical Trigger (MYGRATR-DESIGN-1 Step 3)

§6 Data binding mandate: "Sanity field paths AND a GROQ query shape" — with
one mechanical exception:

> **Trigger:** does this component render or query Sanity data anywhere?
> - **YES** → GROQ + field paths required (no exception).
> - **NO** → §6 may declare `N/A — render utility` cleanly.

Mechanical trigger removes per-author judgment ambiguity. No "we could argue
this is a utility" debates — the question is binary. Approved at HALT 3 of
DESIGN-1 Step 3.

**Customer-2 take-away:** tighten format mandates with mechanical triggers;
ambiguous mandates degrade into per-author interpretation drift over time.

---

## Brief-vs-Reality Finding (MYGRATR-DESIGN-1 Step 3)

Parallel discipline to schema-vs-reality. When **brief literal** conflicts
with **structural rule** (gitignore, framework convention, tooling
constraint, etc.), the structural rule wins. Surface the conflict explicitly,
choose the structural path, document the resolution.

**Canonical instance (HALT 4 of DESIGN-1 Step 3):** brief 3f.d literal
instruction (`git add audit-output/design-1/capability-log-draft.md`) vs the
`audit-output/` gitignore rule per `CLAUDE.md` repo structure ("Audit
artefacts (gitignored — contains PII)"). Structural rule won — the running
draft stays gitignored; Step 9 consolidation into the canonical
`docs/CAPABILITY_LOG.md` is the productisation-IP preservation path. The
brief literal would have set a bad precedent eroding the gitignore rule
across phases.

**Customer-2 take-away:** brief writers can't anticipate every structural
rule downstream. When the conflict surfaces, the workflow that catches it
(named pattern: brief-vs-reality finding) is more valuable than perfect
brief drafting.

---

## Storybook Story Pattern (MYGRATR-DESIGN-1 Brief A)

Path A from v2.0 brief §Step 4 — Storybook IN at Brief A entry decision.
Pair-rule: every primitive folder `site/src/components/ui/{name}/` ships a
`stories.tsx` sibling to `index.tsx`. Tier-1 component stories live at
`site/src/components/tier-1/{slug}.stories.tsx` (placeholder location
pending TEMPLATE-* architecture lock per DESIGN-1 Step 3 brief HALT 1
lock L4).

**Story shape per primitive:**

- `Default` story showing the primitive with default props.
- `AllVariants` story rendering every variant × size on a single-canvas
  grid (per Brief A D3: minimal investment, dev sandbox).
- `States` story for state-bearing primitives — Brief A locked list:
  Input, Textarea, Select, Checkbox, Accordion, Dialog, Tooltip,
  DropdownMenu, Toast. Covers default / error (via `aria-invalid`) /
  disabled / open-default where applicable; hover/focus surface via CSS
  pseudo on interaction.

**Story shape per Tier-1 component (scaffold-stage rule per Brief A
Hard Rule #7):** render the primitive composition listed in the spec's
§3 Tech stack with mock data matching §6 Data binding shape, plus a
visible `ScaffoldNote` panel describing what library wires in at
TEMPLATE-* time, the §6 GROQ query, and relevant §4 Timing values. NO
library wiring at scaffold stage — no `gsap` import, no `swiper` init,
no working ScrollTrigger, no autoplay logic. Story file header comment
notes implementation lands at the relevant TEMPLATE-* phase.

**Mock data discipline:** generic placeholders (`Sample Author Name`,
`/og-default.png`, lorem-ipsum-style copy). No real CE marketing copy
in stories — Brief A Hard Rule #1 exception applies in story files only.
Stories must be deterministic and runnable offline (no Sanity fetches).

**Render-only stories preferred over `args` + `argTypes`.** Locked at
Brief A because polymorphic primitives (Card / Heading / Text / Container —
forwardRef + restricted-set + per-element prop typing per the
HALT-2-locked Card pattern) don't fit cleanly into Storybook's argTypes
generic inference. Render functions with inline JSX keep stories
deterministic and tightly typed without fighting the generic inference.

**Storybook env-vars gotcha (BvR #8 from Brief A close).**
`@storybook/nextjs` does NOT auto-pass `NEXT_PUBLIC_*` env vars through
DefinePlugin like `next build` does — divergence from Next.js conventions
despite the framework name. Any schema-validated env module
(`src/lib/env.ts` Zod parse at module-evaluation time) requires explicit
`env: (config) => ({ ...config, NEXT_PUBLIC_X: process.env.NEXT_PUBLIC_X ?? '' })`
config function in `.storybook/main.ts`. Without it, env throws ZodError
at module-evaluation → cascading TDZ on `__WEBPACK_DEFAULT_EXPORT__` (at
processCSFFile) or `cn`-undefined TypeError (at render call site) for
any story whose import graph touches the env-using primitive. Build-time
exit-0 alone does NOT catch this — Zod parses at runtime; build-success
≠ runtime correctness for schema-validated module loads.

**Pair-rule enforced at Step 10 verifier** (per v2.0 brief): every
primitive folder must have `index.tsx` AND `stories.tsx`. Mechanical
check: `find site/src/components/ui -mindepth 2 -name stories.tsx | wc -l`
returns the exact count. Per Brief A BvR #6, the brief's "23 stories"
count was logical-primitive (22 + Icon = 23); the per-folder Pair-rule
produces 25 stories because C4 Checkbox + C4b RadioGroup ship as
separate folders. Total Brief A story count: 25 primitive + 5 Tier-1
= 30.

**Customer-2 take-away:** Storybook at the design system phase is
dev-sandbox-only, not stakeholder-facing — render-only + mock-data
discipline keep authoring cost low. The two cross-cutting gotchas
(`NEXT_PUBLIC_*` env config + per-folder Pair-rule counting) are both
customer-2-reusable and documented at `docs/briefs/active/`
+ `docs/design/storybook-deploy.md` runbook.

---

## UI_STRINGS Rule (post-DESIGN-1 Brief B)

Chrome strings (button labels, error messages, ARIA text, page-meta
strings, form labels) live in `tools/eslint/ui-strings.json` as the
canonical source of truth. The JSON is generated to a typed TypeScript
const at `site/src/lib/ui-strings.ts` via `npm run generate-ui-strings`
(root `package.json` script). Two ESLint rules enforce the discipline
at lint time, ensuring no template author can hardcode a chrome string
outside the canonical map.

### The two rules

**1. `react/jsx-no-literals`** (upstream, `eslint-plugin-react@7.37.5`,
registered transitively via `eslint-config-next/typescript`):

```js
"react/jsx-no-literals": ["error", {
  noStrings: true,
  allowedStrings: ["", " ", "·", "—", "–", "*"],
  ignoreProps: true,
}],
```

Catches JSXText, JSX expression with string literals, template literals
(with or without interpolation), and string concatenation in JSX
expression containers. `noStrings: true` is the option that extends the
default behaviour to cover JSXExpressionContainer cases. `ignoreProps`
exempts JSX attribute values (so `aria-label="Close"` is fine — ARIA
attribute values are not chrome text). `allowedStrings` is the
visual-punctuation allow-list shared with the local custom rule below.

**2. `local/no-conditional-strings-in-jsx`** (project-local custom rule
at `tools/eslint/rules/no-conditional-strings-in-jsx.js`, exposed via
`tools/eslint/plugin-local.js` under the `local/` namespace):

```js
"local/no-conditional-strings-in-jsx": ["error", {
  allowedStrings: ["", " ", "·", "—", "–", "*"],
}],
```

Covers the upstream rule's AST gap on ConditionalExpression branches in
JSXExpressionContainer. The upstream rule does NOT recurse into
`cond ? "yes" : "no"` patterns even with `noStrings: true` — the local
rule fills that gap exactly, narrow-scoped to ConditionalExpression
only. Both branches are reported independently: `cond ? "yes" : "no"`
produces 2 errors; `cond ? "yes" : someVar` produces 1 (only the literal
branch); `cond ? value : other` produces 0 (no literal branches). Same
`allowedStrings` list as upstream so visual-punctuation accepts behave
consistently across both rules. If a future `eslint-plugin-react`
release closes the ConditionalExpression gap, the F7a fixture in
`tools/eslint/__tests__/ui-strings.test.mjs` flips and the local rule
can be retired cleanly.

### When you hit a violation

The five fix paths in priority order:

1. **Chrome string** (label, button text, error message, ARIA text,
   page-meta string) → add a key to `tools/eslint/ui-strings.json`'s
   `strings` block, run `npm run generate-ui-strings` to regenerate
   `site/src/lib/ui-strings.ts`, import `UI_STRINGS` from
   `@/lib/ui-strings`, reference as `{UI_STRINGS["key.path"]}` in JSX.
   See naming convention below.

2. **Sentence with embedded link / button / inline element** → use the
   **placeholder-as-split-template** pattern. Single key with a
   `{{token}}` placeholder, module-level split, render
   `{BEFORE}<Link/>{AFTER}`. Canonical example:

   ```jsonc
   // tools/eslint/ui-strings.json
   "form.error.loadFailed": "Could not load form. Email us at {{email}} instead."
   ```

   ```tsx
   // At the consumer:
   import { UI_STRINGS } from '@/lib/ui-strings'

   const [LOAD_FAILED_BEFORE, LOAD_FAILED_AFTER] =
     UI_STRINGS['form.error.loadFailed'].split('{{email}}')

   // In render:
   <div>
     {LOAD_FAILED_BEFORE}
     <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
     {LOAD_FAILED_AFTER}
   </div>
   ```

   Module-level split (not per-render) is cheaper and matches the
   `UI_STRINGS as const` shape. Spaces around `{{token}}` get captured
   naturally in the split halves, replacing the explicit `{' '}`
   whitespace handling of pre-pattern shape. Two-key prefix/suffix is
   an i18n antipattern — single key with placeholder keeps translator
   context and avoids locking English word order into the contract.

3. **Visual punctuation that's NOT chrome text** (asterisks, bullets,
   em-dashes used as visual separators) → add to the rule config's
   `allowedStrings` allow-list in `site/eslint.config.mjs`. Apply to
   BOTH rules' `allowedStrings` arrays so behaviour stays consistent.
   Current allow-list: `["", " ", "·", "—", "–", "*"]`.

4. **Truly out-of-scope file** (framework templates, vendor SDK init
   code, generated files) → add the file path to the exemption block
   in `site/eslint.config.mjs`. Current exemption list below. Use this
   sparingly — exemption is a last resort, not a workaround.

5. **Truly throwaway placeholder content** (e.g. SCAFFOLD-1 content
   awaiting deletion in TEMPLATE-* phase) → `eslint-disable-next-line
   react/jsx-no-literals` with a justification comment that references
   the phase that will remove the placeholder. Example (from
   `site/src/app/page.tsx`):

   ```tsx
   {/* eslint-disable-next-line react/jsx-no-literals -- SCAFFOLD-1 placeholder; will be replaced by TEMPLATE-HOME phase rendering the homePage singleton */}
   <h1>Cloud Employee</h1>
   ```

   The justification text is required — readers should immediately see
   why the disable exists and when it'll be removed.

### Exemption files (current list)

Maintained in `site/eslint.config.mjs`:

| Pattern | Reason |
|---|---|
| `**/*.stories.tsx` | Storybook story files (Tier-1 flat-file shape) |
| `**/stories.tsx` | Storybook story files (primitive folder-per-primitive Pair-rule shape) |
| `**/*.test.{ts,tsx}` | Test fixtures (mock data is acceptable per Brief A Pattern) |
| `src/app/demo/**` | Demo route (production-guarded; dev-only) |
| `src/app/**/error.tsx` | Next.js framework error templates |
| `src/app/**/not-found.tsx` | Next.js framework 404 templates |
| `src/app/global-error.tsx` | Next.js global error template |
| `src/components/third-party-scripts.tsx` | Vendor analytics SDK init code (GTM / LinkedIn / Hotjar / Facebook Pixel) — JavaScript SDK initializers as JSX children, not UI text |
| `**/ui-strings.ts` | The generated SoT file itself (would otherwise self-flag) |

Both Storybook patterns are listed explicitly so customer-2 brief
readers understand the project carries two story-file naming
conventions (Brief A Pair-rule canonized bare `stories.tsx` for the
folder-per-primitive shape; Tier-1 stories use the flat-file
`*.stories.tsx` shape).

### Naming convention for UI_STRINGS keys

Dotted, surface-scoped, lowerCamelCase tail. Pattern: `<surface>.<element>`.

| Surface | Use for | Examples |
|---|---|---|
| `form.*` | Form labels, submit buttons, field-level error messages | `form.email.label`, `form.submit`, `form.error.required`, `form.error.invalidEmail`, `form.loading`, `form.error.loadFailed` |
| `cta.*` | Call-to-action buttons (cancel, primary action, etc.) | `cta.cancel` |
| `error.*` | Page-level / generic error messages and retry CTAs | `error.retry`, `error.generic` |
| `meta.*` | Page-meta strings, loading states, empty-results messages | `meta.loading`, `meta.emptyResults` |
| `aria.*` | ARIA-only labels for icon buttons and screen-reader-only text (NOT aria-attribute VALUES — those are exempt via `ignoreProps: true`) | `aria.close`, `aria.menu` |

Sentence-with-link patterns use `{{token}}` placeholders within the
value. Canonical example: `form.error.loadFailed` uses `{{email}}`.

Three-segment forms (`form.email.label`, `form.error.required`,
`form.error.invalidEmail`) are preferred over collapsed two-segment
forms when sibling keys are anticipated (e.g. `form.email.label` plus
future `form.email.placeholder` + `form.email.helpText` for the same
field). Pre-empts a naming collision at template-build time.

### Test infrastructure

`tools/eslint/__tests__/ui-strings.test.mjs` verifies both rules' AST
coverage via 8 fixtures (F1, F2, F3, F4, F5, F6, F7a, F7b). The harness
uses `Linter.verify` directly with explicit `plugins: { react,
local }` registration rather than `RuleTester` — ESLint 9's RuleTester
silently no-ops on plugin-namespaced rules passed directly, which would
mask real rule failures. The Linter-based harness exercises the exact
production config shape, so a passing test guarantees parity with
production lint behaviour.

Run from any working directory:

```bash
node tools/eslint/__tests__/ui-strings.test.mjs
```

Fixture summary:
- **F1** — JSX text literal flags (1 error from `react/jsx-no-literals`)
- **F2** — JSX attribute literal with `ignoreProps: true` does NOT flag (0 errors)
- **F3** — JSX expression with string literal flags (1 error)
- **F4** — JSX expression with template literal (no interpolation) flags (1 error)
- **F5** — JSX expression with template literal WITH interpolation flags (1 error)
- **F6** — JSX expression with string concatenation flags (1 error)
- **F7a** — `react/jsx-no-literals` does NOT flag ConditionalExpression branches (0 errors — regression catch for the upstream gap; if future eslint-plugin-react closes the gap, F7a fails and signals the custom rule can be retired)
- **F7b** — `local/no-conditional-strings-in-jsx` flags both ConditionalExpression branches (2 errors)

The harness is deterministic and idempotent. Each fixture declares
`expectedRuleId` so the harness counts only errors from the rule under
test, ignoring noise from the other rule's complementary coverage.

### Generator discipline

`scripts/design/generate-ui-strings.mjs` reads
`tools/eslint/ui-strings.json` (the `strings` block; `_meta` is
provenance) and writes `site/src/lib/ui-strings.ts`. Byte-idempotent
for the TS file: a no-op generator run produces a no-op git diff. The
JSON's `_meta.provenance.reconciled_at` is bumped only when the
`strings` block actually changed (not on every run) — making CI diff
checks reliable.

A future CI assertion (Step 11 verifier) can run the generator and
check `git diff --exit-code site/src/lib/ui-strings.ts` to enforce
JSON/TS parity.

---

## Sanity Fetch Pattern (MYGRATR-DESIGN-1 Brief B Step 8)

The site reads from Sanity via a single client + `defineLive`-wrapped
`sanityFetch`. The SCAFFOLD-1 two-client baseline (`sanityClient` +
separate draft-perspective client) was collapsed at DESIGN-1 Step 8.3
per CMA-C2 / D4 — see "Sanity Client Pattern in the Generated Site"
above for the supersession rationale.

### Single client at `site/src/lib/sanity/client.ts`

- `'server-only'` import — the module is unusable from client
  components by design (the read token must never ship to the
  browser).
- `createClient` from `next-sanity`. No `token` in the client itself —
  server-side reads go through `defineLive`'s `serverToken` (see
  below). The token-bound client lives ONLY at the security boundary
  (live.ts + the route-local `previewValidationClient` inside
  enable/route.ts), never on the long-lived module-scope export.
- `useCdn` depends on `stegaEnabled` (CMA F-9 v1.3): stega requires
  fresh API responses, so dev/preview disable CDN; production-without-
  stega uses CDN.
- `stega.enabled` is gated on **both** the computed `stegaEnabled`
  expression AND `!!env.NEXT_PUBLIC_SANITY_STUDIO_URL` (CMA F4 v2.1 /
  §8.1.5 probe-verified — `createClient` throws at construction if
  `stega.enabled === true` and `stega.studioUrl === undefined`). In
  local dev with the env var unset, stega silently disables; broken
  overlays in dev are acceptable, module-scope crash is not.

### `defineLive` wrapper at `site/src/lib/sanity/live.ts`

- Wraps the single `sanityClient` with `defineLive` and re-exports
  `{ sanityFetch, SanityLive }`. Wrapping once here keeps import
  paths stable across the site (next-sanity 12 API change moved
  away from a direct `SanityLive` export).
- `serverToken: env.SANITY_API_READ_TOKEN` — viewer-scoped token
  (re-confirmed at §8.0a F3 v2.1 probe). Non-empty enforced by D14
  schema strictness in `env.ts` (`z.string().min(1)`). This token
  also services `previewValidationClient` inside `enable/route.ts`
  (CMA F-7 v1.3 / F-12 v2.1) — single token, two consumers, both
  module-scope.
- `browserToken: env.SANITY_API_READ_TOKEN` (added Jul 2026) — enables
  LIVE streaming of draft edits into the Presentation preview. Without
  it, only PUBLISHED content live-updates; draft edits require a manual
  refresh (⟳). Same viewer-scoped, draft-read token as `serverToken`
  (never a write token). next-sanity ships `browserToken` to the browser
  ONLY in draft mode, which is gated behind the secret-protected
  `/api/draft-mode/enable` route, so the token is exposed only to
  authenticated preview sessions, never on the published site.

### Layout integration

- `<SanityLive />` rendered unconditionally in the root layout — live
  fetches flow on the published site too (not just inside Presentation).
- `<VisualEditing />` rendered ONLY when `(await draftMode()).isEnabled`
  (see "Draft-Mode Route Hardening" above).

### What this pattern is NOT

- Not a place to gate stega via `SANITY_STEGA_ENABLED=1` on production
  — CMA F1 v2.1 raw-env guard force-disables stega + emits
  `console.warn` (I5 v2.2 severity downgrade — Sentry/Datadog map
  `console.warn` to Warning, not the on-call-paging Error severity).
- Not a place to expose a WRITE token, or ANY token on the published
  site. The `browserToken` above is the one deliberate exception: a
  viewer/draft-read token, shipped to the browser by next-sanity ONLY in
  draft mode (gated behind the secret-protected enable route). The
  module-scope `sanityClient` still carries no token, and `'server-only'`
  still guards `live.ts`.

### Customer 2 transfer

The single-client pattern + `defineLive` wrapper + viewer-scoped read
token + stega-gated-on-studio-url pattern all transfer as-is for any
Sanity-migration customer. The SCAFFOLD-1 two-client baseline is
deprecated and should not be reintroduced.

---

## Stega-Tolerant Enums at the Sanity Fetch Boundary (Jul 2026)

**Rule: never parse a value out of a `sanityFetch` result with a bare
`z.enum([...])` (or `z.literal` on a non-`_type` field). Use `stegaEnum([...])`
from `site/src/lib/sanity/stega-enum.ts` instead.**

### Why

Draft / Presentation mode auto-enables **stega**: invisible per-field marker
characters injected into every string so Visual Editing overlays can map a
rendered pixel back to its source field. Those characters make a value like
`"pill-green"` no longer strictly equal to `"pill-green"`, so a strict
`z.enum` rejects it with `invalid_value` and **500s the entire page in draft
mode**, which stops `<VisualEditing />` mounting and shows Studio
"Unable to connect". (This was the single root cause of a run of confusing
"stale error" / "unable to connect" symptoms in Jul 2026; it does NOT
reproduce in normal browsing because stega is off outside draft mode, which
is exactly why it is easy to miss.)

### The helper

```ts
// site/src/lib/sanity/stega-enum.ts, isomorphic (NO 'server-only' guard;
// shared.ts is imported by client bundles). stegaClean from
// '@sanity/client/stega' (not 'next-sanity', which drags server code).
export function stegaEnum<const T extends readonly [string, ...string[]]>(
  values: T,
) {
  return z.preprocess(
    (v) => (typeof v === 'string' ? stegaClean(v) : v),
    z.enum(values),
  )
}
```

- The `const` type parameter is load-bearing: without it the tuple widens to
  `string[]`, `z.enum` infers `string`, and every consumer loses the literal
  union (a `tsc` error at the call sites, not a silent widening).
- Lossless: these enum fields are logic / style selectors (`sectionLabelStyle`,
  `dropdownType`, icon `source`, cta `type`, `localeField`, service/video type),
  never click-to-edit display text, so stripping stega from them changes
  nothing visible. Display strings keep their stega and overlays still work.

### Scope + exceptions

- Applied to every enum at the fetch boundary: `queries/navigation.ts`,
  `queries/footer.ts`, `types/sanity/shared.ts` (`LocaleFieldSchema`),
  `types/sanity/documents/{service,video}.ts`.
- **`z.literal` on `_type` is fine as-is**: stega never encodes `_type`
  (a structural system field), so those parses cannot break.
- **Discriminated unions** cannot use `stegaEnum` as the discriminator
  (`z.discriminatedUnion` needs a literal). None exist in the read models today;
  if one is added, `stegaClean` the discriminant field in the projection instead.

---

## Env Schema Strictness (MYGRATR-DESIGN-1 Brief B Step 8)

`site/src/lib/env.ts` validates every env var at module load via Zod.
Failures throw at startup with a clear message, NOT silently at runtime
with cryptic 401/500 responses downstream.

### Required strings: `.min(1)`, not `.string()`

Empty values fail fast. `SANITY_API_READ_TOKEN: z.string().min(1)`
(CMA F-6 v1.3 / D14) — empty token causes `validatePreviewUrl` to
return 401 with no clear error path; the `.min(1)` refinement catches
it at server boot.

### URLs: `.url()`, not `.string()`

`NEXT_PUBLIC_SITE_URL: z.string().url()` (CMA F-1 v1.3 / D14) — the
SCAFFOLD-1 `.catch()` fallback to `NEXT_PUBLIC_VERCEL_URL` was removed
at DESIGN-1 Step 8.1 (D14 lock) because `new URL(undefined)` throws at
runtime in route handlers. Failing at startup is the better posture.

### Conditional required-in-prod / optional-in-dev

`NEXT_PUBLIC_SANITY_STUDIO_URL` (CMA F5 v2.1):

```ts
z.string().url().optional().refine(
  (val) => process.env.NODE_ENV === 'development' || val !== undefined,
  { message: '...required in production and preview...' },
)
```

The pattern: `.optional()` lets local dev omit the var (Studio runs on
`localhost:3333`); `.refine()` enforces it on Vercel where `NODE_ENV`
is always `'production'` (NOT `'development'`) for both production
deploys and preview deploys.

### Optional-with-default

`NEXT_PUBLIC_HUBSPOT_PORTAL_ID: z.string().optional().default('')` —
empty default keeps the rest of the system bootable without HubSpot
config; consumer components runtime-check at mount and render error
fallback if portal ID is empty.

### Customer 2 transfer

The schema is the auth contract between deployment env + route
handlers. Every new customer migration should:

1. Copy the schema verbatim.
2. Update only the per-customer defaults (e.g.,
   `NEXT_PUBLIC_FALLBACK_EMAIL.default('...')`).
3. Set the required env vars in the customer's Vercel project before
   first deploy. Server boot will refuse to start otherwise.

### Anti-pattern

Reading `process.env.X` directly in route handlers or lib code without
going through `env.X`. The schema-validated `env` is the only legitimate
source — direct `process.env` access bypasses validation and lets
malformed values reach runtime.

---

## Visual Editing Method Probe Discipline (MYGRATR-DESIGN-1 Brief B Step 8)

Before authoring an HTTP route handler against a third-party
framework's wiring (Sanity Presentation, Contentful Live Preview,
Storyblok Visual Editor, etc.), run a diagnostic probe to capture the
**actual** HTTP method + transport + query-string shape — don't author
against assumed framework behavior.

### Why this pattern exists

DESIGN-1 Step 8 surfaced **three** brief-vs-reality findings rooted in
authoring against assumed third-party behavior:

- **BvR #34** — assumed `NEXT_PUBLIC_SITE_URL` matched serving origin.
- **BvR #35** — assumed Sanity iframe nav carries `Origin` or `Referer`.
- **BvR #36** — assumed `@sanity/preview-url-secret` reads a `redirectTo`
  query param.

Each was structurally invisible to synthetic-origin curl tests
(authored from the same assumptions as the route code) and trivially
visible the moment a real-client probe ran.

### The probe pattern

1. Wire a temporary diagnostic — either:
   - A dev-only `console.log` block inside the candidate route
     handler that captures incoming headers + parsed origins (TEMP
     DEBUG marker; HALT-cleanup commitment to remove before commit),
     OR
   - A scratch script under `scripts/design/` that hits node_modules
     source files and asserts library behavior for representative
     inputs.
2. Trigger the real client (real Sanity Studio Presentation in
   browser; real CMS preview button; etc.).
3. Capture the observed shape in an artifact under
   `audit-output/design-1/` per D15 — e.g., `visual-editing-method-probe.md`,
   `next-sanity-probe.md`. Gitignored, but survives across sessions
   in the working tree.
4. Author the route handler against the OBSERVED shape, not the
   assumed shape.
5. After landing, remove the diagnostic (`grep "TEMP DEBUG"` → 0
   matches) before committing.

### What goes in the artifact

- The exact HTTP method + path + query string the real client sends.
- Header values (with secrets/tokens redacted).
- For library-behavior probes: the relevant source-file path + line
  numbers + the assertion conclusion ("library reads `X` not `Y`").

### Counter-pattern

Writing the route + the integration tests in the same authoring pass
without a probe in between. The tests will encode the same assumptions
as the route, and the suite will be uniformly assumption-bound. Only
the real client reveals the assumption gap.

### Customer 2 transfer

Every customer's TEMPLATE-* phase that wraps a third-party auth /
preview / live-editing library MUST include the three-step authoring
discipline:

1. **Probe** — capture real library/client behavior.
2. **Assertion design** — write tests against observed behavior.
3. **Assertion test** — run the suite.

Skipping step 1 reproduces the BvR #34/#35/#36 blindspot. The probe
artifact is the auditable evidence that the discipline was followed.

---

## Detail-Page Template Pattern (MYGRATR-TEMPLATE-BLOG)

Every detail-page template (blog post, team member, review, video,
customer story, etc.) is composed of four files in a fixed layout:

1. **Route file** at `site/src/app/{...}/page.tsx` (and locale-mirror
   `site/src/app/uk/{...}/page.tsx`) exports `generateStaticParams`,
   `generateMetadata`, and the default async page component.
2. **GROQ + Zod module** at `site/src/lib/sanity/queries/{type}.ts`
   pairs each query with a `*Schema.parse()` validator. Queries
   marked `/* groq */` for editor highlighting. Fetch functions throw
   on parse fail to surface schema drift loudly.
3. **Template component** at `site/src/components/templates/{type}/index.tsx`
   takes already-fetched + already-validated data and renders.
   Never fetches Sanity itself.
4. **JSON-LD module** at `site/src/components/templates/{type}/json-ld.tsx`
   builds the schema.org object(s) and renders the
   `<script type="application/ld+json">` block(s) via `serializeJsonLd`.

The route never touches presentation; the template never touches
data fetch; the JSON-LD module never touches the page UI. Each file
has a single responsibility, customer 2's TEMPLATE-* phases inherit
the layout verbatim. Locked at TEMPLATE-BLOG HALT 3.

## Sanity Perspective Discipline (MYGRATR-TEMPLATE-BLOG)

`sanityFetch` from `@/lib/sanity/live` is the EXCLUSIVE Sanity query
caller inside `site/src/app/` and `site/src/components/templates/`.
Build-time queries (`generateStaticParams`, `sitemap.ts`, etc.) use
the bare `sanityClient` from `@/lib/sanity/client`. Per-template
`perspective` overrides are forbidden — the perspective is selected
centrally by `defineLive` and Draft Mode at the request layer, not
by template authors.

The literal string `'previewDrafts'` is forbidden in `site/src/app/`
and `site/src/components/templates/` (legacy v3 string; v4 uses
`'drafts'` per `defineLive` config). Probe via grep at CI time;
if it ever reappears, that's a CMA-F5 violation. Locked per CMA-F5
v1.3 at TEMPLATE-BLOG HALT 3.

## Parameterized GROQ Only (MYGRATR-TEMPLATE-BLOG)

No template-literal interpolation of user-controlled values into
GROQ queries. Slug, category, IDs always pass via `$paramName`
placeholder + `params` object. Forbidden pattern:

```ts
const q = `*[slug.current == "${slug}"][0]`  // BANNED
```

Correct pattern:

```ts
const q = `*[slug.current == $slug][0]`
sanityFetch({ query: q, params: { slug } })
```

GROQ does not have shell-style injection but template-literal
interpolation breaks parameterized caching, breaks Sanity's query
cost analyzer, and creates a habit-pattern that DOES open injection
risk against future query shapes (Sanity functions that take
user-side input). Slug regex hardening at the route boundary is
optional defense-in-depth; parameterization is the load-bearing
protection. Locked per CMA-F15 v1.3 at TEMPLATE-BLOG HALT 3.
Carries forward to every TEMPLATE-* phase.

## JSON-LD XSS-Safe Serialization (MYGRATR-TEMPLATE-BLOG)

All `<script type="application/ld+json">` emissions pass through
`serializeJsonLd` from `@/lib/seo/serialize-json-ld`. The helper
escapes `<` / `>` / `&` (as `<` / `>` / `&`) and
U+2028 / U+2029 (JS-only line terminators that break `JSON.parse`
on some clients) in the serialized string. Apply to ALL emission
sites uniformly — no "safe field" carve-outs. Sanity is the
authoring layer and any CMS field is potentially in scope for a
malicious or accidental `</script>` sequence.

Forbidden pattern:

```tsx
<script type="application/ld+json">
  {`{ "headline": "${post.title}" }`}  {/* BANNED — template-literal interpolation */}
</script>
```

Correct pattern:

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLdObject) }}
/>
```

Build the JSON-LD as a plain JS object first, then serialize once
at the emission boundary. Locked per CMA-F4 v1.3 at TEMPLATE-BLOG
HALT 3. Carries forward to every TEMPLATE-* phase + any future
emission site (HOME template, STATIC pages, sitemap-adjacent
structured data).

## Read-Model Zod Co-Location (MYGRATR-TEMPLATE-BLOG)

Site-bound Zod schemas + types live inside `site/src/types/sanity/`,
not in the repo-root `/src/types/sanity/` directory. Reason: the
Vercel build root is `site/`, so anything outside it is invisible
to the production build (the SCAFFOLD-1 monorepo layout intentionally
isolates the customer-facing build from the orchestrator code).

The repo-root `src/` types are write-model Sanity schemas (editorial
Studio shape with full strict constraints — `author required`,
required fields, etc.). The `site/src/types/sanity/` types are
read-model (runtime-fetched shape with nullable/optional adjustments
matching the migrated data state — `author.nullable().optional()`
because 47% of docs lack it pre-Seb-backfill).

Read-model loosenings get a `// TB18` style brief-ref comment at the
field; never silently relax Studio's editorial schema to match data
state. Locked at TEMPLATE-BLOG HALT 1; reinforced at HALT 3 close
when the split structure was confirmed across both default + UK
locale routes.

## Next.js Statically-Generated Routes + VERCEL_ENV at Build Time (MYGRATR-TEMPLATE-BLOG)

Next.js `MetadataRoute.*` file-based routes (`robots.ts`, `sitemap.ts`,
`opengraph-image.ts`, etc.) are STATICALLY GENERATED at `npm run build`
unless explicitly marked `export const dynamic = 'force-dynamic'`. The
env vars present at BUILD time get baked into the generated artifacts;
runtime env-var changes do NOT propagate.

Practical consequence: any env-driven branch inside a `MetadataRoute`
file (e.g. `robots.ts` checking `VERCEL_ENV === 'production'` to
toggle index allow vs disallow) requires the env var to be set on the
`npm run build` command, not just `npm run start`. Vercel sets
`VERCEL_ENV` automatically at both build and runtime per deployment
context; local Lighthouse tests must mirror that:

```bash
# CORRECT — both build and runtime
VERCEL_ENV=production npm run build
VERCEL_ENV=production npm run start

# WRONG — runtime-only, build artifact uses unset env
npm run build
VERCEL_ENV=production npm run start  # robots.txt still serves non-prod rules
```

Surfaced at TEMPLATE-BLOG HALT 3 Checkpoint C2 when Lighthouse
`is-crawlable` failed against `npm run start` despite `VERCEL_ENV=production`
on the start command. Pattern 13 Layer 4 sharpening example (5th in
the TEMPLATE-BLOG cycle). Customer 2 transfer: any Lighthouse run
that exercises env-driven file-based metadata routes must set the
env on the build step. Locked at TEMPLATE-BLOG HALT 3.

---

## Post-Phase Content Mirror Constraint (MYGRATR-CONTENT-1E)

Once CONTENT-1C migrators have populated the `content[]` PortableText
field on a document type, that field is the **canonical mirror of the
Webflow RichText source**, not a Studio-editable field. Manual Studio
edits to `content[]` will NOT survive a re-migration: the CONTENT-1E
w-embed-recovery migrator (and any future post-phase content patch)
uses `.set({ content: newPortableText })` to rebuild the array
end-to-end from Webflow source. Any Studio-side hand-edit is silently
overwritten on re-run.

This constraint applies to the 5 doc types whose `content` (or
field-equivalent: `customerStory.hiringNeedsTable`) flowed through
`toPortableText` at CONTENT-1C: **blogPost, compareBlog, technology,
service, customerStory**. It lasts until the not-yet-scheduled
**ContentReady-1** phase, which will transition these fields from
"mirror" to "editable" — at that point, Studio becomes source-of-truth
and Webflow source is decommissioned.

Practical consequences for any future CONTENT-1F+ post-phase patches:

- Plan migrators as full `.set()` rebuilds, not field-level merges.
- Don't ask Studio editors to fix data in `content[]` between
  CONTENT-1C and ContentReady-1 — fix at the Webflow source instead,
  or run a one-off migrator.
- Verifier counts should match structurally (block type frequencies,
  expected embed counts) rather than `_key`-equality, because
  `@sanity/block-tools` regenerates `markDefs` IDs on each run.
- Pre-patch snapshot to `audit-output/content-1e/pre-patch-snapshots/`
  (or analog) is the rollback escape hatch — write JSON-serialised
  current state for each doc BEFORE the `.set()` patch.

Surfaced at CONTENT-1E phase planning (locked decision Option B —
full content[] rebuild over field-level merge). Customer 2 transfer:
**any** customer's CONTENT-1C analog inherits this constraint until
the ContentReady-1 analog runs. Document this in customer-onboarding
materials so editorial teams don't waste time hand-fixing fields
that will be overwritten.

---

## CMS-Driven Nav Resolution (MYGRATR-STATIC-1)

The `navigation` Sanity global's `primaryLinks[]` items carry:

- `cmsDriven: boolean` (default `false`)
- `cmsCollection: string` (e.g. `'service'` / `'technology'` / `'blogPost'`)
- `dropdownItems[]` of `{ label, url }`

The schema does **not** auto-resolve. The Header component must, at render time:

1. Read `primaryLinks[]` from the navigation singleton.
2. For each link where `cmsDriven === true`, run a follow-up GROQ against `cmsCollection` and substitute the children.
3. For each link where `cmsDriven === false`, use the hand-curated `dropdownItems[]` array.

For CE specifically, both dropdowns ship `cmsDriven=false` because the source dropdowns mix `service/*` + `technology/*` URLs in ways that don't cleanly map to a single Sanity collection query. The `cmsDriven=true` path is reserved for a future "auto-resolve" enhancement once the mix is normalised. The schema field stays, the runtime resolver stays — only the seed payload differs.

---

## Title-As-Link Card Pattern (MYGRATR-STATIC-1)

Hub cards (BlogCard / ResourceCard / CollectionCard) wrap the title in the single anchor per card:

```tsx
<Heading as="h3">
  <Link href={...}>{title}</Link>
</Heading>
```

- Image and body are visually within the card's hover surface but **not separately linked**. No nested anchors.
- Category Tags render with **no `href`** on cards (decorative `<span>` from the Tag primitive's discriminated union).
- No JS-driven whole-card click handler.

Differs from TEMPLATE-BLOG's related-posts pattern (separate "Read article" Link below the title). The hub-card pattern was chosen for STATIC-1 because (a) single anchor per card simplifies accessibility, (b) the title text becomes the link text — best SEO anchor-text signal.

When porting to another customer or another card surface, preserve the single-anchor-on-title rule. If the card needs a secondary "Read more" affordance, render it as `<span>` styled like a link inside the same `<a>`, NOT as a second `<a>`.

---

## Pagination URL Convention (MYGRATR-STATIC-1)

Hub pagination URLs:

- Page 1: `/<hub>` — **no `?page=1` suffix in the canonical**
- Page 2+: `/<hub>?page=N`

Search-param rather than route-segment (`/<hub>/page/N`) because:

1. Fewer route files to maintain — no `[page]/page.tsx` duplicate-rendering each hub.
2. Filtering UI can compose as additional search params (`?page=2&tag=react`) without redesigning the URL.
3. Google handles `?page=` correctly with `rel="prev"` / `rel="next"` link tags (React 19 hoists these from JSX body to `<head>`).

Pagination state lives in `site/src/lib/hubs/pagination.ts`:

- `parsePageParam(raw)` returns 1 for missing input; calls `notFound()` on invalid input (`abc`, `-1`, `0`, `1.5`).
- `buildPagination({ currentPage, totalItems, basePath, pageSize })` returns `{ offset, limit, hasPrev, hasNext, prevUrl, nextUrl, canonicalUrl, totalPages }`. Calls `notFound()` when `currentPage > totalPages`.
- `buildPageNumbers(current, total)` returns the number-badge array with `null` markers for ellipsis gaps.

Canonical URL on page 1 has no `?page=1`; canonical on page 2+ self-references with `?page=N`. The metadata helper at `site/src/lib/hubs/metadata.ts` enforces this. hreflang alternates point at the base URL (paginated pages don't pair with paginated UK pages; Google treats them as distinct content units).

---

## URL Normalization via `toInternalHref()` (MYGRATR-STATIC-1)

`site/src/lib/url.ts` exports `toInternalHref(rawHref)` → `{ href, isExternal }`.

Sanity-stored URLs are fully-qualified (the schema's `type: 'url'` field rejects bare relative paths). Components that render Sanity URLs must pass them through `toInternalHref()` before handing to `next/link`:

```tsx
const { href, isExternal } = toInternalHref(link.url)
<Link
  href={href}
  {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
>
  {link.label}
</Link>
```

`toInternalHref()` strips a known set of CE hosts (`www.cloudemployee.io`, `cloudemployee.io`, `NEXT_PUBLIC_SITE_URL`) and returns the bare pathname. Anything not in the known set is treated as external.

Used by Header (Step 5), Footer (Step 3), 404 CTA (Step 2), and all 3 hub-card components (Step 4). Reuse anywhere a Sanity-stored URL is rendered as a link.

**Direct `process.env` read pattern** (Tech Debt #22 bridge): `url.ts` reads `process.env.NEXT_PUBLIC_SITE_URL` directly rather than importing from `@/lib/env`. Reason: `url.ts` is consumed by client components (`nav-client.tsx`); importing `env.ts` validates server-only secrets (`SANITY_API_READ_TOKEN`) that are stripped from the client bundle and would crash hydration. Same pattern Image primitive uses for `NEXT_PUBLIC_SANITY_PROJECT_ID`; same pattern HubSpotFormEmbed uses after the STATIC-1 Step 5 fix.

---

## Heading-Order Bridge on Collection Hubs (MYGRATR-STATIC-1)

The `<h1>` → card-`<h3>` skip on collection hubs (servicesHub / technologyHub / customerStoriesHub / reviewsHub / videosHub / toolsHub / downloadsHub / eventsHub / compareHub) fails Lighthouse's `heading-order` audit. Blog hubs render a real `<h2>` (`hub.topicsHeader`), so they're fine.

Fix: `renderHub.tsx` emits a `sr-only` `<h2>` for collection hubs to bridge the outline:

```tsx
{!(cfg.shape === 'blog' && hub.topicsHeader) && (
  <h2 className="sr-only">
    {UI_STRINGS['hub.collectionListSuffix'].replace('{name}', cfg.breadcrumbName)}
  </h2>
)}
```

Visual surface unchanged; assistive tech gets a well-formed outline. Apply the same pattern any time a list section's lone heading would otherwise be `<h3>` directly under the page `<h1>`.

---

## UI_STRINGS Rule Reinforcement (MYGRATR-STATIC-1 Step 6)

STATIC-1 added 19 chrome strings to `tools/eslint/ui-strings.json` (30 → 49 keys). The 2-rule architecture from DESIGN-1 Brief B Step 6 is **enforced sitewide**:

- `react/jsx-no-literals` — no string literals in JSX children/attributes.
- `local/no-conditional-strings-in-jsx` — no conditional string literals in JSX expressions.

When you add chrome UI (header, footer, navigation, pagination affordances, empty states, ARIA labels), add the string to `tools/eslint/ui-strings.json`, run `npm run generate-ui-strings`, and consume via `UI_STRINGS['<key>']`. The lint rule catches every regression.

When you have a runtime-substituted string (`{n}`, `{year}`, `{category}`, `{name}`), define the key with the placeholder and apply `.replace('{token}', value)` at the call site — same pattern `UI_STRINGS['blogPost.authorByline']` uses.

When you have a value-driven conditional (`opt.hreflang === 'en' ? 'US' : 'UK'`), extract to a `Record<string, string>` lookup at module scope:

```tsx
const LOCALE_LABELS: Record<string, string> = {
  en: UI_STRINGS['nav.localeUS'],
  'en-GB': UI_STRINGS['nav.localeUK'],
}
// JSX:
{LOCALE_LABELS[opt.hreflang] ?? opt.label}
```

---

## Tech Debt Pulled Forward Pattern (MYGRATR-STATIC-1 Step 5)

Latent issues from earlier phases that don't visibly break anything can surface unexpectedly in a later phase that exercises a different code path. Tech Debt #22 (env.ts client-bundle crash) was logged at TEMPLATE-BLOG HALT 2 close as a SCAFFOLD-AUDIT deferred item; Step 5 of STATIC-1 had to fix it inline because the Header's interactive client island couldn't hydrate while env.ts threw on missing `SANITY_API_READ_TOKEN`.

Discipline:

1. Don't auto-defer "latent" issues without a concrete trigger. Tech Debt #22 had been latent for 4 phases (TEMPLATE-BLOG → CONTENT-1E → STATIC-1 Steps 1-4) before surfacing.
2. When phase verification adds a new code path (here: Header client hydration), expect latent issues to surface. The Tier 3 verification matrix (axe-core + Playwright keyboard probe + console-error capture) catches them.
3. When fixing a latent issue in a later phase, document it as "pulled forward" in PHASE_HISTORY + CHANGELOG. Don't silently bury it inside a feature commit.

---

## Proof-Hub Mid-Gate Pattern (MYGRATR-STATIC-1 Step 4)

Any phase that bulk-generates 3+ similar artefacts (routes, components, scripts) builds **one** first, validates against a mini-gate, then bulk-builds the rest.

STATIC-1 Step 4 built `/blog` first (largest dataset, 74 posts → 7 pages, exercises pagination boundaries) and ran a mini-gate:

- HTTP 200 + correct title + correct card count
- Pagination across `?page=2`, `?page=7` (last), `?page=99` (out-of-range → 404), `?page=abc` (invalid → 404)
- JSON-LD CollectionPage + BreadcrumbList present
- Canonical correct on page 1 (no `?page`) and page 2 (self-canonical)
- axe-core 0 violations

The proof caught two issues before the other 15 routes were generated: a Zod nullable-field bug + a color-contrast violation. Both fixes propagated to all 16 routes from the shared helper, so the bulk-build was clean.

Apply this pattern whenever a brief calls for N similar artefacts: build one, mid-gate, then bulk-build the remainder. The Template Phase Runbook should codify this as default.

---

## The 8px Spacing Scale Trap (LAUNCH-PARITY + design, Jul 2026)

`site/src/app/tokens.css` sets `--spacing: 0.5rem` (8px), not Tailwind's default 4px.
So **every spacing utility on this project renders at DOUBLE the number in the class**:
`mb-5` is 40px, `mt-12` is 96px, `px-3 py-1.5` is 24px/12px. This bit us three separate
times (search box `h-12` rendered 96px not 48px; heading `mt-12` produced 96px gaps;
Claude Design's `px-3 py-1.5` pill spec would have doubled). **Rule: any spacing whose
exact value matters is written in explicit `px` (`mb-[20px]`, `h-[48px]`), so the number
in the class is the number on screen.** Applies especially to design hand-offs, whose
authors assume a 4px scale.

## Prose Typography Over a Renderer's Defaults (design, Jul 2026)

Two non-obvious rules when styling PortableText / any renderer whose blocks carry their
own classes (`site/src/components/blog/article-body.tsx`):
1. **Per-element font-size, not inherited.** The default paragraph renders with an
   explicit `text-body` (13px) class. An inherited `font-size` on a wrapper LOSES to a
   class on the element itself, so the body stayed 13px until targeted with
   `[&_p]:text-[18px]` (a descendant selector, specificity (0,1,1), which wins).
2. **Margins do NOT collapse in a flex container.** PortableText wraps blocks in
   `flex flex-col gap-4`. Element margins ADD to that gap instead of collapsing, so
   default list margins + heading margins + the gap all stacked (52px between
   paragraphs, 80px above headings — the "spacing feels off" report). Fix: ONE source of
   rhythm (override the wrapper gap, e.g. `[&>div]:gap-[20px]`), and only headings add a
   `margin-top`. Zero the renderer's default block margins (`[&_ul]:my-0 [&_li]:my-0`).

## Sticky Offsets Bound to Header Variables (design, Jul 2026)

A sticky in-page element (TOC rail) must clear the sticky site header, which is 126px
here (`--header-height: 94px` + `--announcement-bar-height: 32px`, both resolved at
runtime; the tokens.css defaults are lower and are overridden by the chrome). **Bind the
offset to those CSS variables, don't hardcode:**
`sticky top-[calc(var(--header-height)+var(--announcement-bar-height)+16px)]`, plus a
matching `scroll-mt` on anchor targets so a clicked heading lands below the header, plus
a `max-h-[calc(100vh-...)]` + `overflow-y-auto` so a list taller than the viewport scrolls
inside itself. For a long list, nudge the rail's OWN `scrollTop` (never the page) to keep
the active item visible. See `site/src/components/blog/table-of-contents.tsx`.

## The Parity Gate as Launch Governor (LAUNCH-PARITY, Jul 2026)

The launch discipline is now a GATE, not a checklist: `npm run launch:verify-parity`
captures what the LIVE site does for every known URL (6,937, assembled from six sources
because each has a blind spot — April crawl, Webflow redirect export, live sitemap,
Search Console, Ahrefs, Webflow page-list API) and replays it against the new site,
failing on any behavioural difference. It compares by status CLASS (301≈308 both
"permanent"; 400≈404 both "no page") AND verifies the destination RESOLVES (an earlier
version passed `/team` because it only compared the destination path, not whether it
200s). Deliberate divergences live in `data/webflow/parity-exceptions.json`, each with
who decided it and why — an allowlist that still probes, not a mute button, because a
gate that accumulates known-red entries stops catching the unintended ones. Indexing is
OPT-IN on the hostname (`robots.ts` gates on `NEXT_PUBLIC_CANONICAL_HOST`, NOT
`VERCEL_ENV` — staging IS the Vercel production deployment); `npm run launch:verify-noindex`
enforces it. Run the gate against a PRODUCTION build (`npm start`), not `next dev` — dev
is too slow/fragile for 6,937 requests, and it must be a server you will not restart
mid-run.

## Empirical Model Recovery + Continuous Re-Verification (calculators, Jul 2026)

When a live feature's logic is not readable (the hiring-cost calculator ships as a
minified bundle), recover the model by DRIVING the live widget across every input
combination and deriving the model from the outputs, then keep a script that RE-CHECKS it
against live on demand (`npm run verify:hiring-cost` — 900 figures). A model recovered by
observation is a hypothesis; the only honest way to hold one is to keep re-testing it
against the thing it was copied from, so it fails loudly if CE change their rates rather
than the pricing page silently disagreeing. The price-comparison model WAS readable
(inline script) and is verified to reproduce live across 60 scenarios. Split invariant:
formulas in code (payroll rules), numbers in Sanity (market salaries go stale, Seb edits
them). Refuse plausible-but-wrong output: a missing rate row 404s the page rather than
costing that seniority at zero (which would flatter CE's saving).

## Per-Locale Publishing vs a Global Flag (LAUNCH-PARITY, Jul 2026)

Webflow publishes CMS items PER LOCALE; a global `retired` flag cannot express "gone in
US, live in UK". Model it with a locale-scoped field (`teamMember.ukOnly`) read via a
GROQ predicate taking a `$locale` param (`VISIBLE_IN_LOCALE` in
`site/src/lib/sanity/queries/_filters.ts`). Also: verify redirect DESTINATIONS resolve on
live before mirroring them (29 `/live-job-role/*` URLs redirected into a cross-domain
404, from a catch-all that over-matched Webflow's 333 explicit per-slug rules — "a
pattern that generalises a list is a guess about the list; read the list"). And the two
locales' conversion funnels are NOT the same shape (US 8 steps, UK 9) — a rewrite that
collapsed `/uk/start-hiring/get-started` skipped the UK funnel's real entry page.

## Section 4: Phase History

| Phase | Status | Key Patterns Established |
|-------|--------|-------------------------|
| MYGRATR-LAUNCH-PARITY + BLOG | In progress (Jul 2026) | Parity gate as launch governor (6-source corpus, class+resolution comparison, exceptions allowlist, robots.ts hostname opt-in). 8px spacing-scale trap (explicit px for design hand-offs). Prose typography over renderer defaults (per-element font-size beats inheritance; margins don't collapse in flex). Sticky offsets bound to header CSS vars + active-item auto-scroll. Empirical model recovery + continuous re-verification (calculators; formulas-in-code/numbers-in-Sanity split). Per-locale publishing via locale-scoped field + `$locale` GROQ predicate. Hub content capture (`.faq-btn` is the glyph not the question; `<strong> </strong>` whitespace-emphasis glues words; textContent drops internal links; textContent baseline welds adjacent elements). Blog family: one shared shell + 3-variant ArticleCard + featured auto-fill/≥8-suppression + long-form band + numbered pagination; `defined(date) desc` first on date-sorted hubs (null sorts first in GROQ). Tech Debt #58–61. |
| MYGRATR-0 | Complete | Repo structure, Supabase schema (10 tables, RLS on all), TypeScript strict mode, CE org + migration seeded, context files at root, Webflow inventory + Firecrawl sitemap scripts, audit artefacts in audit-output/ |
| MYGRATR-AUDIT-1 | Complete | Resumable orchestrator chunks, skip-if-exists for expensive steps, tier-1/tier-2 LLM degradation (rules always run; Claude optional), inline rules classifier for cross-step deps, phase timeout + circuit breaker for API batch steps, PII-safe audit outputs |
| MYGRATR-SCHEMA-0 | Complete | No new code patterns — doc-only phase. Locked schema design doc (`docs/MYGRATR_SCHEMA_DESIGN_DECISIONS.md`) produced through a CE_RAW_EXTRACT → CE_SITE_TRUTH → DESIGN_DECISIONS → red-team audit → fixes → re-audit → lock workflow. |
| MYGRATR-SCHEMA-1 | Complete | Sanity v3 schema conventions (`defineType` / factory-function reuse / aggregator indexes), Sanity v5 singleton enforcement via `schema.templates` + `document.actions` filters (no `__experimental_actions`), Zod mirror pattern (every Sanity schema has a Zod twin; PortableText as `z.unknown()` until TEMPLATE-*), curated `schema_designs.sanity_schema` JSONB summaries rather than full defineType serialisation, env.ts / supabase.ts / state-machine.ts concrete implementations against the previously-abstract CONVENTIONS.md patterns. |
| MYGRATR-SCAFFOLD-1 | Complete | Generated-site monorepo layout (`site/` + `studio/` + `src/`), locale routing via URL prefix (not Next i18n), generateCanonical / generateHreflang single-source helpers, third-party script identifier provenance from audit output, redirect extraction script writes tracked TS into `site/` (Vercel never reads `audit-output/`), defineLive factory for Sanity Live, draft-mode enable route with same-origin redirectTo check, presentationTool from `sanity/presentation` (bundled path, not the deprecated standalone package). |
| MYGRATR-CONTENT-1A | Complete | Content-migration lane infrastructure under `src/lib/content/` (Webflow read-client with offset+limit pagination, Sanity write-client, migration tracker upserting `content_migrations` via `(org_id, migration_id, collection_slug)` unique key, CE-specific Webflow collection IDs as seed data); deterministic Sanity `_id`s of the form `{type}-{webflowId}` for idempotent re-runs and downstream reference resolution; Webflow Option-field resolution by fetching the collection schema once and mapping option IDs to names; image staging via top-level `webflowImageUrl` string instead of Sanity asset upload (deferred to CONTENT-1C); pre-flight env guards (`ensureSanity()` + `ensureWebflow()`) at the top of every migrator. |
| MYGRATR-CONTENT-1B | Complete | Shared migration-helpers module (`src/lib/content/migration-helpers.ts`): `toPortableText` with JSDOM-injected `parseHtml` for `@sanity/block-tools` (defaults to browser DOMParser which is absent in Node), `extractUrl` / `toRefs` accepting both Webflow object and plain-string shapes, `uploadImage` replacing the CONTENT-1A staging pattern with real Sanity asset uploads, `webflowSlug(item)` reading `fieldData.slug` first (top-level `item.slug` is `null` on some collections — caused every CONTENT-1A doc to ship with `slug.current = null`, retroactively backfilled), `extractOption` for object-shaped Option fields and `fetchOptionIdMap()` for the more common opaque-ID shape. Pre-flight live-API field-name verification before writing any migrator (six of eight CONTENT-1B collections had brief / field-map mismatches against reality — slug typos, missing fields, mislabelled fields). Webflow → Sanity field-name corrections logged in PHASE_HISTORY.md and reflected in `docs/WEBFLOW_TO_SANITY_FIELD_MAP.md`. Image-upload failures are non-fatal: log + return null + continue. |
| MYGRATR-CONTENT-1C | Complete | `toPortableText` upgraded to async two-pass walk for inline image upload (Pass 1 JSDOM-extract `<img>` srcs and `Promise.allSettled` upload them; Pass 2 deserialize with custom rules emitting image blocks for `<img>` and `<figure><img>`, skipping iframe-in-figure); null-guard at entry; both passes use JSDOM so src URLs decode identically (no entity-encoding mismatch). `<figure>` deserializer must check for `<img>` child before processing — iframe-in-figure (Vimeo embeds) lacks one and falls through to text rules. Cross-collection deduplication pattern: when multiple Webflow source collections consolidate into one Sanity type and contain duplicate items, designate one as the canonical master (`Blogs & Guides` for blogPost), iterate it first, build a running slug set seeded with Sanity-existing slugs, skip duplicates in subsequent collections; `migration-tracker.recordMigration` accepts an optional `parityBaselineCount` so `parity_score = migrated / parityBaselineCount * 100` is measured on the deduplicated set rather than raw source count, and vacuous success (denominator=0, migrated=0, no errors) yields 100. Every Webflow ref ID validated against `/^[a-f0-9]{24}$/i` (Webflow ObjectId shape) before constructing a `_ref` — `toRefs` drops malformed entries with a console warning rather than writing `tag-[object Object]`. Deterministic `_key` from the full Webflow ID for refs (was sliced 8-char prefix); positional indices for FAQ (`faq-{n}`) and fold items (`fold-{n}-item-{m}`). Date parsing via regex prefix `/^(\d{4}-\d{2}-\d{2})/` instead of `new Date(raw).toISOString().slice(0,10)` (timezone shift). Pre-flight slug-collision check is a hard gate — surface duplicates and stop before writing any documents. Option-field map fetches must hoist above the item loop (Webflow rate-limit avoidance). `decodeHtmlEntities` for VideoLink URLs (`?h=xxx&amp;title=0` → `?h=xxx&title=0`). `fetchOptionIdMap` and `resolveOption` lifted out of duplicates in two migrators and consolidated in shared helpers. |
| MYGRATR-CONTENT-1D | Complete | Live-Site Meta Backfill Pattern (Playwright-driven `<title>` + `<meta description>` extraction with brand-suffix strip, length compliance, never-fabricate rule, 1.5s inter-request delay, 20-min phase-wide hard abort gate). FieldPolicy enum drives runner behaviour declaratively (`title: 'scrape-always'`; `description: 'scrape-always' | 'snippet-copy-else-scrape' | 'never-touch'`); pre-scrape hook evaluated BEFORE URL construction so placeholders short-circuit cleanly. Hard-failure vs soft-warning separation in the runner: HTTP non-200 + length warnings are SOFT (logged, surfaced via `needsReview=true`, do NOT mark the row failed); only `patch.commit()` errors / `urlForDoc` throws / bypass-patch errors are HARD. Split per-field provenance (`metaTitleSource` + `metaDescriptionSource`) replaces a single `metaSource` object — required because review docs may have title from live-scrape AND description from snippetForMeta-copy. `deleteByIdStrict()` mandatory for migration-script deletions: query-based deletes forbidden, `_id`-only with `_type` validation before delete. Verifier-throws structural pattern: verifier exports a function that throws on failure (never returns boolean), state-transition script calls it WITHOUT try/catch, unhandled rejection propagates → state transition unreachable. Token Scoping: migration scripts use a least-privilege single-dataset `SANITY_MIGRATION_WRITE_TOKEN` (NOT the legacy `SANITY_API_TOKEN`); module-load assertion in the write client throws if the migration token is missing OR if the site's read token is also present (path-alias collision guard). Studio production deploy is a hard ordering gate before any data write that depends on new schema fields — every meta-backfill script carries a top-of-file `// HARD GATE` comment. Two-factor scrapedAt-guarded `unset` for one-off corrections of a monotonically-set flag (`flag === true` AND `metaTitleSource.scrapedAt` startsWith the known buggy-run date — re-running the migrator moves scrapedAt forward and structurally blocks accidental clearance of any future legitimate flag). Brief deviations recorded with explicit per-doc guards + dedicated `content_migrations` rows (`drift-cleanup`, `bookacall-metadescription-truncation`, `bookacall-stale-needsreview-unset`) for audit trail. |
| MYGRATR-CONTENT-1D-CLEANUP | Complete | Migrator Field-Write Pattern — Conditional Spread (migrators that read an optional source field MUST omit the field via `...(value ? { field: value } : {})` rather than writing `null` into the doc literal; null literal stored under a key the schema declares as a non-nullable type triggers Studio's "Invalid property value" warning). Path-Patch Primitive for Nested Array-of-Object Fields (`_key`-addressed unset shape: `client.patch(id).unset(['folds[_key=="fold-1"].featuredImage'])`; validate `_key` is non-empty string before constructing path; probe new path syntax via `PatchBuilder.toJSON()` before destructive use). Floor-check (`>=`) on `content_migrations` row count in the verifier so post-phase patches add rows without breaking the verifier; membership-set check still enforces every in-phase row is present. Halt-on-first-guard-failure phase-wide semantic: a literal-null assertion mismatch on any doc in any cleanup op fires `process.exit(1)` and skips subsequent ops; recovery is "re-run from scratch" not "continue past failure". Brief deviation DEV-6 (post-phase patch on a closed phase; `migrations.status` stays `content_complete`; 4 audit-trail rows added: `service-null-thumbnail-unset`, `technology-null-image-fields-unset`, `technology-null-folds-featured-image-unset`, `customer-story-null-image-fields-unset`). |
| MYGRATR-DESIGN-1 (Step 2 milestone) | Superseded by Step 3 row below | Token System Pattern (Tailwind v4 CSS-first, multi-namespace probe required, dual-consumer pattern, raw-value rule with two narrow exceptions). Primitive Component Pattern (folder-per-primitive at `site/src/components/ui/{name}/index.tsx`, hand-built atop @radix-ui without shadcn, CVA-standardised variant API, no-className-variants rule, SVG sprite for icons, GSAP banned from primitives, probe-first discipline as Hard Rule #2, inline source-comment as primitive-level spec, layout-root provider mount, register-vs-Controller form integration split via FormField smart wrapper). HALT-Discipline Pattern (probe-first dismissal protocol — burden of proof on dismissal not adoption; HALT 10 visual eyeball as last-line defense for fidelity errors that pass tsc/build cleanly; browser cache trap requires hard-refresh + cache-disabled before review; demo-route width misalignment is a layout-context observation, not a primitive bug). DEV-1 through DEV-12 logged in `docs/briefs/active/MYGRATR-DESIGN-1_BRIEF_v2.0.md` §15. CAPABILITY_LOG.md (NEW) consolidates 10 categorical primitive patterns + 4 HALT-discipline patterns + token-system architecture into single productisation-IP doc. |
| MYGRATR-DESIGN-1 (Step 3 milestone) | In progress | Tier-1 Component Spec Pattern (8-section format mandatory: Behaviour · State machine · Tech stack · Timing · Breakpoints · Data binding · Edge cases · Acceptance criteria + trailing Schema-vs-reality findings). 5 Tier-1 components locked in `docs/design/TIER_1_INVENTORY.md` v1.0 (1 High + 3 Medium + 1 Low). 5 §4 Timing Provenance Shapes named explicitly (library-mediated · GSAP-clean · GSAP-mixed · CSS-only · GSAP-attribute-selector orchestration). Render-Utility Classification (third component category alongside primitive and Tier-1 component; 1 render utility: section-fade-reveal-global). Path A Mechanical Trigger for §6 GROQ-mandate ("does this component touch Sanity data? if yes → GROQ; if no → N/A — render utility allowed"). Brief-vs-Reality Finding (parallel discipline to schema-vs-reality; structural rule wins over brief literal — canonical instance: brief 3f.d "git add capability-log-draft.md" vs `audit-output/` gitignore rule; gitignore won). 9 schema-vs-reality findings logged across 5 specs (1 schema-relax → STATIC-1/SCHEMA-2; 4 template-fallback; 1 N/A render-discipline; 3 decision-needed of which 1 resolved at HALT 3 via Path A; 2 deferred per phase pin: testimonial F2 → TEMPLATE-REVIEW, service-card-grid F1 → TEMPLATE-SERVICE; both log as Tech Debt at Step 11 DESIGN-1 close). Capture-asset directory tree skeleton at `docs/design/components/_assets/{slug}/{screenshots,recordings}/` ready for population during TEMPLATE-* phases. Steps 4–11 of DESIGN-1 pending. |
| MYGRATR-TEMPLATE-BLOG | Complete | Detail-Page Template Pattern (route + GROQ/Zod + template + JSON-LD as four-file fixed layout — see new CONVENTIONS section). Sanity Perspective Discipline (`sanityFetch` exclusive in `app/` + `components/templates/`; bare `sanityClient` for build-time queries; no per-template perspective override; `'previewDrafts'` string banned). Parameterized GROQ Only (`$paramName` + `params` object; no template-literal interpolation of user-controlled values). JSON-LD XSS-Safe Serialization (`serializeJsonLd` helper at `site/src/lib/seo/`; `<`/`>`/`&`/U+2028/U+2029 escapes uniformly applied to every emission site). Read-Model Zod Co-Location (site-bound schemas at `site/src/types/sanity/`, NOT repo-root `src/`; read-model nullable adjustments separate from Studio editorial write-model). Next.js Statically-Generated Routes + VERCEL_ENV at Build Time (Lighthouse-against-`npm run start` requires `VERCEL_ENV=production npm run build` first; robots.ts/sitemap.ts bake env vars at build, not runtime). BvR ledger #37–#46 documented in PHASE_HISTORY entry. Pattern 13 Layer 4 sharpening — 5 sub-examples (status≠hydration; diagnosis≠Pattern13-exempt; HTTP-200≠script-executed; probes-need-probing; build-time-env). 158 static pages built; SEO 100 + A11y 96 Lighthouse acceptance. Tech Debt #21–#32 opened (SCAFFOLD-AUDIT scope: perf budget, cookie hygiene, ClaraChatBot contrast, image-aspect-strategy; CONTENT-1E expanded scope: w-embed recovery; misc env split / Header-Footer gap / script-tag warning). |
| MYGRATR-CONTENT-1E | Complete | Post-Phase Content Mirror Constraint (new CONVENTIONS section): `content[]` is canonical mirror of Webflow RichText source post-CONTENT-1C; manual Studio edits don't survive re-migration; lasts until ContentReady-1. Webflow RichText Embed Selector (`<div data-rt-embed-type='true'>` for custom-embed wrappers; `<figure class="w-richtext-figure-type-video">` for video figures; `w-embed` CSS class only exists on published site, NOT in CMS HTML — original CONTENT-1C diagnosis had wrong selector). `toPortableText` extended with deterministic-_key `videoEmbed` + `table` blocks (deserializer rules: figure-video → videoEmbed; `div[data-rt-embed-type]` containing `<table>` → table with tbody-only-header normalization + `bold-col-one` → `boldFirstColumn`; `div[data-rt-embed-type]` containing `<iframe>` → videoEmbed; catch-all → console.warn + undefined). Dedup-aware migrator pre-flight (classifySweepTargets → {existing, dedupedToCanonical, orphan}; skip deduped with log, halt on orphan, patch existing). Pre-patch snapshots (audit-output/content-1e/pre-patch-snapshots/) as rollback escape hatch — write current Sanity field state to disk BEFORE `.set()`. `parseVideoUrl` extension for LinkedIn (`linkedin.com/embed/feed/update/urn:li:share:{id}` URL pattern; LinkedIn iframes use eager mode only, no autoplay query param). Pattern 13 Layer 4 6th sub-example (plan-encoded-prior-diagnosis-bug — checkpoint probe surfaces incorrect technical assumptions before they propagate downstream). 79 docs patched / 149 embeds recovered / 88 sweep docs total / 9 deduped / 0 orphans. Tech Debt #25 RESOLVED. `migrations.status` unchanged at `content_complete` (post-phase patch). |
| MYGRATR-STATIC-1 | Complete | CMS-Driven Nav Resolution (Header component resolves `cmsDriven=true` dropdown items at render time via per-collection GROQ; CE specifically ships `cmsDriven=false` because both source dropdowns mix `service/*` + `technology/*` URLs that don't cleanly map to a single collection). Title-As-Link Card Pattern (single `<a>` per card wrapping `<h3>` title; image + body decorative; Tags rendered with no `href`). Pagination URL Convention (`?page=N` search param; page 1 canonical has no suffix; `parsePageParam` `notFound()`s on invalid input). URL Normalization via `toInternalHref()` (every Sanity-stored fully-qualified CE URL passes through this helper before `next/link`). Heading-Order Bridge (`renderHub` emits sr-only `<h2>` on collection hubs to bridge `<h1>` → card `<h3>` outline gap). UI_STRINGS Rule Reinforcement (19 new chrome keys; 49 total at `tools/eslint/ui-strings.json`; runtime substitution via `.replace('{token}', value)` + `Record<string, string>` lookup for value-driven conditionals). Tech Debt Pulled Forward Pattern (latent Tech Debt #22 client-bundle env crash invisible Steps 1-4 because static SSR didn't need hydration; Step 5 needed interactive nav, surfaced + fixed inline). Proof-Hub Mid-Gate Pattern (`/blog` built + verified before bulk-building 15 more hub routes; caught Zod nullable-field bug + color-contrast violation that would have propagated × 15). Hand-Built Disclosure Nav (Radix DropdownMenu's `role=menu/menuitem` semantics are for application commands, semantically wrong for site nav; hand-build with `<nav><ul><li><a>` + `aria-haspopup` + `aria-expanded` + `aria-controls`). UK Sitemap Learning (Tech Debt #38): future briefs that seed multi-locale sitemap entries must first confirm routes exist for every locale being seeded. `verify-static-1.ts` single-command phase-close gate template. `migrations.status` unchanged at `content_complete` (chrome work). 8 commits / 7 steps. Tech Debt #34, #35, #36, #37, #38 opened. |

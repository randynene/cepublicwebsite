# CONVENTIONS.md — Mygratr

> Coding patterns and conventions established in this codebase.
> Updated after each phase to prevent architectural drift.
> Patterns documented here reflect reality — never speculative.

**Status:** MYGRATR-SCHEMA-0 Complete

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

## Section 4: Phase History

| Phase | Status | Key Patterns Established |
|-------|--------|-------------------------|
| MYGRATR-0 | Complete | Repo structure, Supabase schema (10 tables, RLS on all), TypeScript strict mode, CE org + migration seeded, context files at root, Webflow inventory + Firecrawl sitemap scripts, audit artefacts in audit-output/ |
| MYGRATR-AUDIT-1 | Complete | Resumable orchestrator chunks, skip-if-exists for expensive steps, tier-1/tier-2 LLM degradation (rules always run; Claude optional), inline rules classifier for cross-step deps, phase timeout + circuit breaker for API batch steps, PII-safe audit outputs |
| MYGRATR-SCHEMA-0 | Complete | No new code patterns — doc-only phase. Locked schema design doc (`docs/MYGRATR_SCHEMA_DESIGN_DECISIONS.md`) produced through a CE_RAW_EXTRACT → CE_SITE_TRUTH → DESIGN_DECISIONS → red-team audit → fixes → re-audit → lock workflow. |
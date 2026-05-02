# CONVENTIONS.md — Mygratr

> Coding patterns and conventions established in this codebase.
> Updated after each phase to prevent architectural drift.
> Patterns documented here reflect reality — never speculative.

**Status:** MYGRATR-CONTENT-1B Complete

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

## Sanity Client Pattern in the Generated Site (MYGRATR-SCAFFOLD-1)

Two clients, one factory:

- `sanityClient` (`site/src/lib/sanity/client.ts`) — published perspective,
  `useCdn: process.env.NODE_ENV === 'production'`, stega gated on
  `VERCEL_ENV === 'preview' && NODE_ENV !== 'production'`. Both
  conditions are required to prevent stega metadata leaking into
  production on misconfigured deployments.
- `previewClient` — `previewDrafts` perspective, no CDN, authenticated
  with `SANITY_API_READ_TOKEN`, stega always on. Used for draft-mode
  secret validation and preview rendering.
- `SanityLive` (`site/src/lib/sanity/live.ts`) — produced by
  `defineLive({ client: sanityClient })` from `next-sanity/live`. The
  factory also returns `sanityFetch` for live-revalidating queries. There
  is no direct `SanityLive` export from `next-sanity` root in v12+.

`'server-only'` is imported at the top of every Sanity-client file to
prevent accidental client-bundle inclusion.

---

## Draft Mode + Visual Editing (MYGRATR-SCAFFOLD-1)

Draft mode is a two-route pair plus a layout flag:

- `site/src/app/api/draft-mode/enable/route.ts` validates the secret with
  `validatePreviewUrl(previewClient, request.url)`, then **same-origin
  checks `redirectTo`** against `env.NEXT_PUBLIC_SITE_URL` before calling
  `(await draftMode()).enable()`. Never trust `redirectTo` from the
  Sanity payload — the same-origin check is the F10 hardening.
- `site/src/app/api/draft-mode/disable/route.ts` disables the cookie. F15
  (POST-only + origin check) is deferred to TEMPLATE-* / pre-launch.
- Root layout renders `<VisualEditing />` (from
  `next-sanity/visual-editing`) only when `(await draftMode()).isEnabled`.
  `<SanityLive />` always renders so that live-revalidating fetches keep
  flowing on the published site too.

Studio side: `presentationTool` from `sanity/presentation` (the bundled
path, not the deprecated standalone `@sanity/presentation` package) is
added to `studio/sanity.config.ts` plugins, with `previewMode.enable` and
`draftMode.enable` both pointing at `/api/draft-mode/enable`.

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

## Section 4: Phase History

| Phase | Status | Key Patterns Established |
|-------|--------|-------------------------|
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
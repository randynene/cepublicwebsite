# MYGRATR-CONTENT-1A — Flat Collections Migration
## Session Brief v1.1

> **Executor:** Claude Code
> **Planner sign-off:** Jake Hall
> **Preset:** `preset:quick` — run cross-model audit before execution
> **Branch:** `feat/content-1a` → merge to main on completion
> **State machine transition:** `scaffold_complete → content_running → content_complete` (partial — content_running only; content_complete after CONTENT-1C)

---

## 0. READ FIRST

Before writing a single line of code:

1. Read `CLAUDE.md` — confirm `migrations.status = scaffold_complete` for CE row. If not, STOP.
2. Read `CONVENTIONS.md` — all patterns apply in full.
3. Read `docs/WEBFLOW_TO_SANITY_FIELD_MAP.md` — the field-level mapping for every collection migrated in this session.
4. Read `docs/MYGRATR_SCHEMA_DESIGN_DECISIONS.md §3` — consolidation decisions for tags and blogCategory.

**What this session does:** Migrates the flat, reference-free collections from Webflow into Sanity. No cross-references, no complex fields, no fold structures. These are the simplest documents — migrate and verify one collection at a time.

**What this session does NOT do:** Blog posts, technology pages, services, customer stories, team members, or anything with references. Those are CONTENT-1B and CONTENT-1C.

**Session lane:** CONTENT touches `/src/lib/content/` and `content_migrations` table only. Never touches `site/`, `studio/` schemas, or template code.

**Architecture rule:** No decisions in this session. If something in the field map is ambiguous, write it to `DEBUG_CONTEXT.md` and stop.

---

## 0a. Pre-flight — Resolve Tech Debt #10 and #11

Before the migration pipeline starts, fix the two CONTENT-1 tech debt items from `CLAUDE.md`:

**Tech Debt #10:** `src/lib/types.ts` has a legacy `MigrationStatus` enum with shortform values (`'audit'`, `'schema'` etc.) that conflicts with the canonical string-literal union in `src/lib/pipeline/state-machine.ts`. Delete the enum from `src/lib/types.ts` and replace any imports with the `MigrationStatus` type from `state-machine.ts`. Verify zero TypeScript errors after.

**Tech Debt #11:** `TemplateType` is defined in both `src/lib/types.ts` (string literals, lowercase) and `src/lib/audit-types.ts` (UPPERCASE enum). Standardise on the string-literal union in `src/lib/audit-types.ts` and remove the duplicate from `src/lib/types.ts`. Update any imports.

Commit: `fix(types): resolve MigrationStatus and TemplateType conflicts — tech debt #10 #11`

---

## 0b. Transition to content_running

Create `scripts/content/start-content-phase.ts`:
- Calls `assertValidTransition('scaffold_complete', 'content_running')`
- Updates `migrations.status = 'content_running'` and `current_phase = 'content_running'`
- Requires `--confirm` flag — parse `process.argv`, throw immediately if absent, no interactive prompts

Add npm script: `"content:start": "tsx scripts/content/start-content-phase.ts"`

Run: `npm run content:start -- --confirm`

Commit: `feat(content): transition to content_running`

---

## 1. Migration Infrastructure

Before migrating any content, establish the shared infrastructure all content scripts will use.

### 1a. Sanity write client

Create `src/lib/content/sanity-write-client.ts`:

```typescript
import { createClient } from '@sanity/client'
import { env } from '@/lib/env'

// Write client — used only by migration scripts, never by the Next.js app.
// Do NOT add 'server-only' here — migration scripts run via tsx, not Next.js.
// SANITY_API_TOKEN must have Editor or above permissions.
export const sanityWriteClient = createClient({
  projectId: env.SANITY_PROJECT_ID,
  dataset: env.SANITY_DATASET,
  apiVersion: '2024-01-01',
  useCdn: false,
  token: env.SANITY_API_TOKEN,
})
```

### 1b. Webflow read client

Create `src/lib/content/webflow-read-client.ts`:

```typescript
import { env } from '@/lib/env'

// Thin wrapper around Webflow REST API v2.
// All content migration scripts read from Webflow through this module only.
// Never call the Webflow API directly in migration scripts.

const BASE_URL = 'https://api.webflow.com/v2'

async function webflowGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${env.WEBFLOW_API_TOKEN}`,
      'accept-version': '2.0.0',
    },
  })
  if (!res.ok) {
    throw new Error(`Webflow API error ${res.status} on ${path}: ${await res.text()}`)
  }
  return res.json() as Promise<T>
}

export async function getCollectionItems(collectionId: string): Promise<WebflowItem[]> {
  // Webflow paginates at 100 items. Fetch all pages.
  // Exit when a page returns fewer items than the limit — safer than
  // comparing against total which can shift on live data.
  const items: WebflowItem[] = []
  let offset = 0
  const limit = 100

  while (true) {
    const data = await webflowGet<{ items: WebflowItem[]; pagination: { total: number } }>(
      `/collections/${collectionId}/items?offset=${offset}&limit=${limit}`
    )
    items.push(...data.items)
    if (data.items.length < limit) break
    offset += limit
  }

  return items
}

export type WebflowItem = {
  id: string
  fieldData: Record<string, unknown>
  slug: string
  lastPublished: string | null
  lastUpdated: string
  createdOn: string
  isArchived: boolean
  isDraft: boolean
}
```

### 1c. Content migration tracker

`src/lib/supabase.ts` uses `@supabase/supabase-js` `createClient` directly with no Next.js request context — it is safe to use in CLI scripts. Use `createServerClient` from `@/lib/supabase`.

Create `src/lib/content/migration-tracker.ts`:

```typescript
import { createServerClient } from '@/lib/supabase'

const ORG_ID = 'ce000000-0000-0000-0000-000000000001'
const MIGRATION_ID = 'ce000000-0000-0000-0000-000000000002'

export async function recordMigration(params: {
  collectionSlug: string
  sourceItemCount: number
  migratedItemCount: number
  status: 'complete' | 'failed'
  errorLog?: string[]
}) {
  const client = createServerClient()
  const { error } = await client
    .from('content_migrations')
    .upsert(
      {
        org_id: ORG_ID,
        migration_id: MIGRATION_ID,
        collection_slug: params.collectionSlug,
        source_item_count: params.sourceItemCount,
        migrated_item_count: params.migratedItemCount,
        parity_score:
          params.sourceItemCount > 0
            ? (params.migratedItemCount / params.sourceItemCount) * 100
            : 0,
        status: params.status,
        last_run_at: new Date().toISOString(),
        error_log: params.errorLog ?? [],
      },
      { onConflict: 'org_id,migration_id,collection_slug' }
    )

  if (error) throw new Error(`recordMigration failed: ${error.message}`)
}
```

**Guard pattern for all migration scripts:** Every migration script must call the relevant guard functions at the top before doing anything else:

```typescript
import { ensureSanity, ensureWebflow } from '@/lib/env'
ensureSanity()
ensureWebflow()
```

This throws immediately with a clear message if the required env vars are missing, rather than failing silently mid-migration.

### 1d. Collection ID map

**Before writing the tracker or any migration script:** Open `docs/SCHEMA.md` and verify that the `content_migrations` table has a unique constraint on `(org_id, migration_id, collection_slug)`. If no such constraint exists, add it via the Supabase SQL editor before proceeding:

```sql
ALTER TABLE content_migrations
ADD CONSTRAINT content_migrations_org_migration_collection_unique
UNIQUE (org_id, migration_id, collection_slug);
```

Run this in the Supabase SQL editor and confirm it succeeds before writing any migration scripts. If the constraint already exists, proceed.

Create `src/lib/content/ce-collection-ids.ts`. Populate the Webflow collection IDs for every collection being migrated in CONTENT-1A. Collection IDs come from the Webflow API — fetch them:

```bash
curl https://api.webflow.com/v2/sites/${WEBFLOW_SITE_ID}/collections \
  -H "Authorization: Bearer ${WEBFLOW_API_TOKEN}" | jq '.collections[] | {id, slug, displayName}'
```

Store the results in the file as a typed map:

```typescript
export const CE_COLLECTION_IDS = {
  // Populate from curl output above
  tagsBlogs: '<id>',
  tagsAlternatives: '<id>',
  tagsTools: '<id>',
  tagsVideoLibrary: '<id>',
  tagsDownloads: '<id>',
  tagsEventsWebinars: '<id>',
  hubs: '<id>',              // → blogCategory
  glassdoorReviews: '<id>',
  clientBenefits: '<id>',   // → benefitValue
  staffBenefits: '<id>',
} as const
```

Commit: `feat(content): migration infrastructure — write client, tracker, collection IDs`

---

## 2. Migrate Tags (6 collections → `tag` document type)

**Source:** 6 Webflow tag collections — 22 items total
**Target:** `tag` Sanity document type
**Decision D2:** All 6 consolidate into one type with a `category` field

Category mapping:
| Webflow collection | Sanity `category` value |
|---|---|
| Tags >> Blogs | `blogs` |
| Tags >> Alternatives | `alternatives` |
| Tags >> Tools & Quizzes | `tools` |
| Tags >> Video Library | `videoLibrary` |
| Tags >> Downloads | `downloads` |
| Tags >> Events & Webinars | `eventsWebinars` |

### 2a. Migration script

Create `scripts/content/migrate-tags.ts`:

```typescript
import { getCollectionItems } from '@/lib/content/webflow-read-client'
import { sanityWriteClient } from '@/lib/content/sanity-write-client'
import { recordMigration } from '@/lib/content/migration-tracker'
import { CE_COLLECTION_IDS } from '@/lib/content/ce-collection-ids'

const CATEGORY_MAP = {
  tagsBlogs: 'blogs',
  tagsAlternatives: 'alternatives',
  tagsTools: 'tools',
  tagsVideoLibrary: 'videoLibrary',
  tagsDownloads: 'downloads',
  tagsEventsWebinars: 'eventsWebinars',
} as const

async function migrateTags() {
  let totalSource = 0
  let totalMigrated = 0
  const errors: string[] = []

  for (const [key, category] of Object.entries(CATEGORY_MAP)) {
    const collectionId = CE_COLLECTION_IDS[key as keyof typeof CE_COLLECTION_IDS]
    const items = await getCollectionItems(collectionId)
    totalSource += items.length

    for (const item of items) {
      try {
        const doc = {
          _id: `tag-${item.id}`,
          _type: 'tag',
          name: item.fieldData['name'] as string,
          slug: { _type: 'slug', current: item.slug },
          category,
          // singularName only populated for eventsWebinars if present
          ...(category === 'eventsWebinars' && item.fieldData['singular-name']
            ? { singularName: item.fieldData['singular-name'] as string }
            : {}),
        }

        await sanityWriteClient.createOrReplace(doc)
        totalMigrated++
        console.log(`✓ tag: ${doc.name} [${category}]`)
      } catch (err) {
        const msg = `Failed tag ${item.id}: ${err instanceof Error ? err.message : String(err)}`
        errors.push(msg)
        console.error(`✗ ${msg}`)
      }
    }
  }

  await recordMigration({
    collectionSlug: 'tags-consolidated',
    sourceItemCount: totalSource,
    migratedItemCount: totalMigrated,
    status: errors.length === 0 ? 'complete' : 'failed',
    errorLog: errors,
  })

  console.log(`\nTags: ${totalMigrated}/${totalSource} migrated. Errors: ${errors.length}`)
}

migrateTags().catch(console.error)
```

Add npm script: `"content:migrate-tags": "tsx scripts/content/migrate-tags.ts"`

### 2b. Verify

Run: `npm run content:migrate-tags`

Expected: 22 items migrated, 0 errors.

In Sanity Studio, open the `tag` document list — confirm 22 documents exist with correct names, slugs, and categories.

Commit: `feat(content): migrate tags — 22 items across 6 collections`

---

## 3. Migrate Blog Categories (`hubs` collection → `blogCategory`)

**Source:** `-- Hubs` collection — 6 items
**Target:** `blogCategory` Sanity document type
**Decision D13:** Hubs become blogCategory documents + separate blogHub singletons. This script handles the blogCategory documents only. The blogHub singletons are already seeded as stubs.

Field mapping:
| Webflow field | Sanity field |
|---|---|
| name | name |
| slug | slug.current |
| (order not in Webflow) | order — set manually post-migration |

### 3a. Migration script

Create `scripts/content/migrate-blog-categories.ts`. Follow the same pattern as migrate-tags.ts:

- Fetch all items from the `hubs` collection
- For each item, createOrReplace a `blogCategory` document with `_id: 'blogCategory-{webflow-id}'`
- Map `name` → `name`, `slug` → `slug.current`
- Leave `order` unset (Seb sets ordering in Studio post-migration)
- Record to `content_migrations` with slug `'blog-categories'`

Add npm script: `"content:migrate-blog-categories": "tsx scripts/content/migrate-blog-categories.ts"`

Expected: 6 items migrated.

Commit: `feat(content): migrate blog categories — 6 items`

---

## 4. Migrate Glassdoor Reviews (`glassdoorReview`)

**Source:** `Glassdoor reviews` collection — 10 items
**Target:** `glassdoorReview` Sanity document type

**Before writing this script:** Open `docs/WEBFLOW_TO_SANITY_FIELD_MAP.md` and find the Glassdoor Reviews section. Use the exact Webflow API field slugs listed there — do not guess field names. The field names below are indicative only.

Field mapping (confirm exact slugs from field map doc):
| Webflow field | Sanity field | Notes |
|---|---|---|
| name | reviewerTitle | Display title |
| rating | rating | number 1-5 |
| review-text | reviewText | plain text |
| date | date | date field |
| source-url | sourceUrl | optional |

Create `scripts/content/migrate-glassdoor-reviews.ts` following the same pattern.

Expected: 10 items migrated.

Commit: `feat(content): migrate glassdoor reviews — 10 items`

---

## 5. Migrate Benefit Values (`benefitValue`)

**Source:** `Client Benefits & Company Values` collection — 9 items
**Target:** `benefitValue` Sanity document type

**Before writing this script:** Open `docs/WEBFLOW_TO_SANITY_FIELD_MAP.md` and find the Client Benefits & Company Values section. Use the exact Webflow API field slugs listed there — do not guess field names.

Field mapping (confirm exact slugs from field map doc):
| Webflow field | Sanity field | Notes |
|---|---|---|
| name | title | benefit title |
| description | description | plain text |
| icon | icon | image — store as webflowImageUrl string, do not upload to Sanity |

Create `scripts/content/migrate-benefit-values.ts` following the same pattern.

Expected: 9 items migrated.

Commit: `feat(content): migrate benefit values — 9 items`

---

## 6. Migrate Staff Benefits (`staffBenefit`)

**Source:** `Staff Benefits` collection — 6 items
**Target:** `staffBenefit` Sanity document type

**Before writing this script:** Open `docs/WEBFLOW_TO_SANITY_FIELD_MAP.md` and find the Staff Benefits section. Use the exact Webflow API field slugs listed there — do not guess field names.

Field mapping (confirm exact slugs from field map doc):
| Webflow field | Sanity field | Notes |
|---|---|---|
| name | title | benefit title |
| description | description | plain text |
| icon | icon | image — store as webflowImageUrl string, do not upload to Sanity |

Create `scripts/content/migrate-staff-benefits.ts` following the same pattern.

Expected: 6 items migrated.

Commit: `feat(content): migrate staff benefits — 6 items`

---

## 7. Verify All Migrations

After all 5 migration scripts complete, run a final parity check:

Create `scripts/content/verify-content-1a.ts`:

```typescript
import { createServerClient } from '@/lib/supabase'

const ORG_ID = 'ce000000-0000-0000-0000-000000000001'
const MIGRATION_ID = 'ce000000-0000-0000-0000-000000000002'

const EXPECTED = {
  'tags-consolidated': 22,
  'blog-categories': 6,
  'glassdoor-reviews': 10,
  'benefit-values': 9,
  'staff-benefits': 6,
}

async function verify() {
  const client = createServerClient()
  const { data } = await client
    .from('content_migrations')
    .select('collection_slug, source_item_count, migrated_item_count, parity_score, status')
    .eq('org_id', ORG_ID)
    .eq('migration_id', MIGRATION_ID)
    .throwOnError()

  let allPassed = true

  for (const [slug, expected] of Object.entries(EXPECTED)) {
    const row = data?.find((r) => r.collection_slug === slug)
    if (!row) {
      console.error(`✗ ${slug}: no migration record found`)
      allPassed = false
      continue
    }
    const passed = row.migrated_item_count === expected && row.status === 'complete'
    console.log(
      `${passed ? '✓' : '✗'} ${slug}: ${row.migrated_item_count}/${expected} (${row.parity_score}%)`
    )
    if (!passed) allPassed = false
  }

  if (!allPassed) {
    console.error('\nVerification failed. Fix errors before merging.')
    process.exit(1)
  }

  console.log('\nAll CONTENT-1A collections verified. ✓')
}

verify().catch(console.error)
```

Add npm script: `"content:verify-1a": "tsx scripts/content/verify-content-1a.ts"`

Run: `npm run content:verify-1a`

Must exit 0 before proceeding.

Commit: `feat(content): CONTENT-1A verification script`

---

## 8. Post-Phase

### 8a. Update CLAUDE.md

Note that CONTENT-1A is complete — add a "Content migration state" section:

```
**Content migration state (as of CONTENT-1A complete):**
- migrations.status = content_running (partial — CONTENT-1A of 3)
- Collections migrated: tags-consolidated (22), blog-categories (6),
  glassdoor-reviews (10), benefit-values (9), staff-benefits (6)
- Total items in Sanity: 53
- Remaining: CONTENT-1B (team members, reviews, videos, downloads,
  events, tools, book-a-call) + CONTENT-1C (blogs, technology,
  services, customer stories)
```

### 8b. Merge

Merge `feat/content-1a` → `main`.

Push to GitHub using the PAT pattern confirmed in SCAFFOLD-1.

### 8c. Post-phase context file updates

Follow post-phase protocol from `CLAUDE.md §Post-Phase Checklist` in order:
1. CHANGELOG.md
2. PHASE_HISTORY.md
3. CONVENTIONS.md — add any new content migration patterns
4. FEATURE_MAP.md — add CONTENT-1A entry
5. CLAUDE.md — update content migration state block
6. SCHEMA.md — no DDL changes; note content_migrations rows written
7. REGISTRY.md — add migration scripts

Commit: `chore(docs): post-phase context file updates — CONTENT-1A complete`

---

## Session Outputs (Definition of Done)

- [ ] Tech debt #10 and #11 resolved — zero TypeScript errors
- [ ] `migrations.status = content_running` in Supabase
- [ ] `scripts/content/` infrastructure: sanity-write-client, webflow-read-client, migration-tracker, ce-collection-ids
- [ ] Tags migrated — 22 documents in Sanity across 6 category values
- [ ] Blog categories migrated — 6 documents in Sanity
- [ ] Glassdoor reviews migrated — 10 documents in Sanity
- [ ] Benefit values migrated — 9 documents in Sanity
- [ ] Staff benefits migrated — 6 documents in Sanity
- [ ] `content:verify-1a` exits 0
- [ ] All 5 collections show `parity_score = 100` in `content_migrations` table
- [ ] All commits on main
- [ ] Context files updated per post-phase protocol

---

## Known Risks

**Webflow collection IDs:** Must be fetched live from the API in Step 1d — they are not in the project files. If any collection ID is wrong, the migration script will fail gracefully with a clear error. Fix the ID in `ce-collection-ids.ts` and re-run.

**Field name mismatches:** Webflow `fieldData` keys are the API slugs, not the display names. If a field is not found, log a warning and continue — do not crash the whole migration. Unmatched fields get a `TODO` comment in the record.

**Image fields:** For this batch, all collections have minimal or no image fields. If an image field is present, store the Webflow CDN URL as a string in a `webflowImageUrl` staging field — do not attempt Sanity asset upload in CONTENT-1A. Asset migration is CONTENT-1C work.

**Sanity rate limits:** The write client makes one API call per item. For 53 items this is fine. If you hit rate limits, add a 100ms delay between writes.

---

*MYGRATR-CONTENT-1A Session Brief v1.3 — env vars confirmed, constraints verified, 8 fixes total, ready for execution.*

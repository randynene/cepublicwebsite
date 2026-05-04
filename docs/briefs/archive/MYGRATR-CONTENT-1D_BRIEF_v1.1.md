# MYGRATR-CONTENT-1D — Meta Backfills + Carryover Fixes + content_complete

**Phase ID:** MYGRATR-CONTENT-1D
**Brief version:** v1.1
**Status:** READY FOR CROSS-MODEL AUDIT
**Predecessor:** MYGRATR-CONTENT-1C (complete — 246 docs migrated, 24 `content_migrations` rows at parity 100)
**Successor:** MYGRATR-TEMPLATE-* (template build phases)

**Changelog from v1.0 (post self-audit, 2026-04-30):**
- Finding 1 (high): `needsReview`, `source`, `generatedAt` did not exist on `customerStory`, `teamMember`, `review`, `bookACall` schemas. CONTENT-1D now retroactively applies the §7.2 source-tracking pattern to those 4 schemas. Scope expansion: 4 schema files modified (and 4 Zod twins).
- Finding 2 (high): Documented contradiction between `WEBFLOW_TO_SANITY_FIELD_MAP.md` MIGRATION BLOCKS table (says `snippetForMeta` feeds `metaTitle` for review) and `MYGRATR_SCHEMA_DESIGN_DECISIONS.md` §3.8 (says `snippetForMeta` feeds `metaDescription`). Schema decisions doc is authority. Locked here: `snippetForMeta` → `metaDescription` only; `metaTitle` always scraped fresh.
- Finding 3 (high): Doc-count maths corrected — `total_cms_docs: 404` post-1D (smoke-test docs aren't real content). 2 of 5 SCHEMA-1 smoke-test docs remain post-1D and are flagged for pre-launch cleanup.
- Finding 4 (medium): Audit-output cross-check removed. Live scrape is authoritative; cross-check added complexity without actionable output.
- Finding 5/7/8 (low): Annotations on `page.title()` semantics, smoke-test slug-collision logic phrasing, runtime estimate revised to ~10 minutes with 20-minute abort gate.

---

## 1. Phase Goal

Close out `content_running`. After this phase the Sanity dataset is fully populated with verified meta tags, all carryover image uploads from CONTENT-1A and CONTENT-1B are resolved, the smoke-test pollution is gone, and `migrations.status` advances to `content_complete`. The site can move into TEMPLATE-* with no residual content debt.

This is a cleanup phase, not a feature phase. No new schema. No new shared helpers other than what is strictly required for live-page meta scraping. No new patterns the codebase doesn't already need.

---

## 2. Authoritative Inputs

Read these before writing any code. The phase will fail if any of these are not freshly read.

| File | Why |
|---|---|
| `CLAUDE.md` | Confirm `migrations.status = content_running` and CMS doc count = 404 before starting |
| `CONVENTIONS.md` §"Content Migration Conventions" | Two-clients-one-tracker pattern, deterministic `_id` form, `recordMigration()` shape |
| `CONVENTIONS.md` §"Sanity Client Pattern in the Generated Site" | NOT applicable here — CONTENT-1D uses the `sanityWriteClient` from `src/lib/content/`, not `site/src/lib/sanity/` |
| `docs/WEBFLOW_TO_SANITY_FIELD_MAP.md` | metaTitle / metaDescription target fields per collection; "MIGRATION BLOCKS" table at the bottom |
| `docs/MYGRATR_SCHEMA_DESIGN_DECISIONS.md` §3.4, §3.5, §3.7, §3.13, §3.14, §10 | Schema constraints (length limits) and the full routing table for URL construction |
| `CE_SITE_TRUTH.md` "Coverage matrix" rows | Verifies which collections have CMS-level meta (already migrated) vs require live scrape |
| `PHASE_HISTORY.md` (CONTENT-1B and CONTENT-1C entries) | Confirms what's already in Sanity for bookACall.metaDescription and review.snippetForMeta |

---

## 3. Pre-Phase State (verified 2026-04-30)

| Item | State |
|---|---|
| `migrations.status` | `content_running` |
| `migrations.current_phase` | `content_running` |
| Sanity CMS docs | 404 (53 + 105 + 246) plus 34 SCHEMA-1 stubs plus 5 smoke-test docs |
| `content_migrations` rows for CE | 24 (5 + 8 + 11), all `status='complete'`, `parity_score=100` |
| Branch | `main` (CONTENT-1C merged) |

### 3.1 Meta tag state per collection

This is the precise scope. Reading existing Sanity data before scraping prevents overwriting correctly populated fields.

**Documented contradiction resolved:** `WEBFLOW_TO_SANITY_FIELD_MAP.md` MIGRATION BLOCKS table says *"derive from `snippetForMeta` where present"* in the context of `metaTitle` for review. `MYGRATR_SCHEMA_DESIGN_DECISIONS.md` §3.8 says `snippetForMeta` (max 300 chars) feeds `metaDescription`, not `metaTitle`. The schema decisions doc is authoritative — `metaTitle` is constrained to 60 chars, which `snippetForMeta` cannot reliably satisfy. **Lock for v1.1: `snippetForMeta` → `metaDescription` only (truncated to 160). `metaTitle` is always scraped fresh.**

| Collection | Doc count | metaTitle status | metaDescription status |
|---|---|---|---|
| `technology` | 101 | NOT POPULATED — scrape required | NOT POPULATED — scrape required |
| `service` | 23 | NOT POPULATED — scrape required | NOT POPULATED — scrape required |
| `customerStory` | 18 | NOT POPULATED — scrape required | NOT POPULATED — scrape required (`/customer-story/virgin` is a known placeholder; flag and continue) |
| `teamMember` | 28 | NOT POPULATED — scrape required | NOT POPULATED — scrape required |
| `review` | 26 | NOT POPULATED — always scrape | **PARTIALLY POPULATED via CONTENT-1B `snippetForMeta` migration** — for each doc: if `metaDescription` is null AND `snippetForMeta` is non-null, copy `snippetForMeta` (truncated to 160) to `metaDescription`. If both null, scrape. If `metaDescription` already non-null, skip. |
| `bookACall` | 6 | NOT POPULATED — scrape required | **POPULATED in CONTENT-1B (Webflow `title` field)** — DO NOT TOUCH |

**Counted writes:** 101×2 + 23×2 + 18×2 + 28×2 + 26 metaTitle + (~26 review metaDesc, mix of snippetForMeta-copy and scrape) + 6 metaTitle = ~278 field writes. Live-scrape network calls = ~177 URLs (every doc except bookACall, which only needs metaTitle but still requires a live page fetch — so 177 URLs is precise: 101 + 23 + 18 + 28 + 26 reviews where we always scrape metaTitle anyway + 6 bookACall = 202 scrape fetches; but customerStory virgin is a hardcoded skip, so 201; tighter estimate: **~200 page fetches**).

The script must compute its own scope at runtime — not assume the table above is current.

### 3.2 Image carryover state

| Collection | Field | Doc count | State |
|---|---|---|---|
| `benefitValue` | `thumbnailImage` | 9 | All 9 still hold `webflowImageUrl` staging strings |
| `staffBenefit` | `icon` | 6 | All 6 still hold `webflowImageUrl` staging strings |
| `video` | `backupImage` | 1 | One CONTENT-1B failure (CDN retry needed) — identify by querying `*[_type == "video" && !defined(backupImage) && defined(webflowImageUrl)]` |

### 3.3 Other carryovers

| Item | Scope | Source |
|---|---|---|
| `video.mainVideoEmbedLink` `&amp;` entity | unknown count, query at runtime | CONTENT-1B fix |
| Smoke-test docs | 3 docs (`scaling-teams (SMOKE TEST)` tag, `smoke-test-blog-category-scaling-teams`, `smoke-test-team-member`) | SCHEMA-1 |

---

## 4. Out of Scope (Explicit)

Do not do these things. They belong elsewhere.

- **UK locale scraping.** All five in-scope collections use `localeStrategy=single-document` with `ukOverrideFields=[]`. UK pages are duplicates that won't diverge until LOCALE-1.
- **Author backfill.** 127 blog/compareBlog docs need authors. That is Seb's job in Studio, not Mygratr's.
- **`/customer-story/virgin` content rewrite.** CE rewrites the placeholder. CONTENT-1D writes `metaDescription = 'Customer story in progress.'` and `needsReview = true`, nothing more.
- **The 4 UNKNOWN canonical URLs (tech debt #9).** These are not in any of our 5 in-scope collections (verified pre-flight; if they are, halt and re-scope).
- **Open Graph image scraping.** `openGraphImage` is optional in the schema. Out of scope.
- **Re-running CONTENT-1A, 1B, or 1C migrators.** All three slices are sealed. CONTENT-1D writes via patches only, never via `createOrReplace` of source-shape documents.

---

## 5. Step-by-Step Plan

### Step 0 — Branch + pre-flight

```
git checkout -b feat/content-1d
```

Create `scripts/content/verify-content-1d-prereqs.ts`:

1. Assert `migrations.status === 'content_running'` and `migrations.current_phase === 'content_running'` for the CE migration.
2. Query Sanity, count docs per in-scope type — assert exactly: technology 101, service 23, customerStory 18, teamMember 28, review 26, bookACall 6.
3. Query Sanity for current meta-field state on each in-scope type. Build the actual scrape scope (which docs need metaTitle, which need metaDescription). Print the scope; refuse to continue if the count is zero or anomalously high.
4. Confirm none of the 4 UNKNOWN canonical URLs (from tech debt #9) overlap with in-scope slugs. Halt if any do.
5. Confirm the 3 smoke-test doc IDs exist in Sanity. Confirm they have **zero inbound references** via `*[references($smokeTestId)]` per ID. Halt if any have references — do not silently break things.
6. Confirm Playwright is installed (`npx playwright --version`).

Add `npm run content:verify-1d-prereqs` to `package.json`.

Run it. Halt if anything fails. Commit `chore(content-1d): pre-flight checks`.

### Step 0a — Retroactive §7.2 source-tracking field application

**Context:** §7.2 of the schema decisions doc establishes `source` / `generatedAt` / `needsReview` source-tracking fields on `blogPost`, `compareBlog`, `technology`, `service`, `industry`, `persona`, `location`. CONTENT-1D needs `needsReview` flagging on all 6 in-scope doc types. Four of those six (`customerStory`, `teamMember`, `review`, `bookACall`) were not given §7.2 fields in SCHEMA-1. CONTENT-1D corrects this gap before writing any meta data.

**Scope:** Add the §7.2 triplet (`source`, `generatedAt`, `needsReview`) to `customerStory`, `teamMember`, `review`, `bookACall` schemas. Add the `metaSource` audit field (§5 below) to all 6 in-scope schemas (the 2 that already have §7.2 fields plus the 4 we're patching now).

**Schema additions per file:**

```typescript
// In studio/schemas/documents/customer-story.ts (and the 3 others — teamMember, review, bookACall):
defineField({
  name: 'source',
  type: 'string',
  options: { list: [{ title: 'Manual', value: 'manual' }, { title: 'Beem', value: 'beem' }, { title: 'Claude Code', value: 'claude_code' }, { title: 'Imported', value: 'imported' }] },
  initialValue: 'manual',
  hidden: true,  // Studio does not display by default — Seb opts in via field-level visibility toggle
}),
defineField({ name: 'generatedAt', type: 'datetime', hidden: true }),
defineField({ name: 'needsReview', type: 'boolean', initialValue: false }),  // visible — Seb filters by this for review queue
```

**Why `needsReview` is visible (not hidden) but `source`/`generatedAt` are:**

`needsReview` drives Seb's Studio review queue — a default Sanity Structure list that filters to `*[needsReview == true]`. It must be visible to be queryable in Studio's UI. `source`/`generatedAt` are provenance metadata Seb doesn't need to see by default; visible only when troubleshooting.

**`metaSource` field (the original v1.0 audit field, still applies):**

```typescript
defineField({
  name: 'metaSource',
  type: 'object',
  hidden: true,
  fields: [
    defineField({ name: 'provider', type: 'string' }),     // 'live-scrape' | 'snippetForMeta-copy' | 'placeholder' | 'webflow-cms'
    defineField({ name: 'scrapedAt', type: 'datetime' }),
    defineField({ name: 'url', type: 'url' }),
  ],
}),
```

Add `metaSource` to all 6 in-scope schemas.

**Zod twins:** Update `src/types/sanity/customer-story.ts`, `team-member.ts`, `review.ts`, `book-a-call.ts` to add `source`, `generatedAt`, `needsReview` as optional fields. Update all 6 type files to add `metaSource` as optional.

**Studio rebuild check:** After saving the schema files, run `cd studio && npm run dev` once locally to confirm the schemas compile without errors. Sanity ignores unknown fields on write — even without the rebuild, the migration scripts could write the new fields successfully. The rebuild is for Studio editor visibility, which Seb needs.

**Validation:** Add to `verify-content-1d-prereqs.ts` — confirm the 4 affected schema files compile (TypeScript) and that the Zod twins parse a sample doc with the new fields.

Commit `feat(content-1d): retroactive §7.2 source-tracking + metaSource on 4 doc types`.

### Step 1 — URL list construction

Create `src/lib/content/url-builder.ts`:

```typescript
export function urlForDoc(doc: { _type: string; slug: { current: string } }): string {
  const base = 'https://www.cloudemployee.io';
  switch (doc._type) {
    case 'technology':    return `${base}/technology/${doc.slug.current}`;
    case 'service':       return `${base}/services/${doc.slug.current}`;
    case 'customerStory': return `${base}/customer-story/${doc.slug.current}`;
    case 'teamMember':    return `${base}/team/${doc.slug.current}`;
    case 'review':        return `${base}/reviews/${doc.slug.current}`;
    case 'bookACall':     return `${base}/book-a-call/${doc.slug.current}`;
    default: throw new Error(`urlForDoc: unsupported _type ${doc._type}`);
  }
}
```

URL paths are taken verbatim from `MYGRATR_SCHEMA_DESIGN_DECISIONS.md §10 ROUTING TABLE`. Do not improvise.

Add a unit-style assertion script `scripts/content/test-url-builder.ts` that round-trips a known-good slug from each collection and compares against `audit-output/ce-canonical-urls.json` to confirm the URL exists in the audit's canonical set. Halt the phase if any constructed URL is not in the canonical set.

### Step 2 — Live meta scraper (Playwright)

Create `src/lib/content/meta-scraper.ts`:

```typescript
import { chromium, type Browser } from 'playwright';

export interface ScrapedMeta {
  url: string;
  status: number;                     // HTTP status from goto()
  rawTitle: string | null;            // raw <title> text
  rawDescription: string | null;      // raw <meta name="description"> content
  scrapedAt: string;                  // ISO timestamp
}

export async function scrapeMeta(browser: Browser, url: string): Promise<ScrapedMeta> {
  const ctx = await browser.newContext({ userAgent: 'Mygratr-MetaBackfill/1.0' });
  const page = await ctx.newPage();
  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    const status = response?.status() ?? 0;
    if (status !== 200) {
      return { url, status, rawTitle: null, rawDescription: null, scrapedAt: new Date().toISOString() };
    }
    const rawTitle = await page.title();
    const rawDescription = await page.locator('meta[name="description"]').first().getAttribute('content').catch(() => null);
    return { url, status, rawTitle: rawTitle || null, rawDescription: rawDescription || null, scrapedAt: new Date().toISOString() };
  } finally {
    await ctx.close();
  }
}

export async function withBrowser<T>(fn: (b: Browser) => Promise<T>): Promise<T> {
  const browser = await chromium.launch();
  try { return await fn(browser); } finally { await browser.close(); }
}
```

Why Playwright, not cheerio: any meta tag rendered by Webflow custom code (Technology pages have JSON-LD injection in custom code per AUDIT-1) may not appear in the static HTML response. Playwright executes JS and returns the DOM as Google sees it. Runtime cost is ~3-4s per page worst case for ~200 URLs = ~10 minutes — irrelevant.

**Annotation on `page.title()`:** Playwright's `page.title()` reads `document.title`, which is the post-JS-mutation title (i.e., what Google sees after page render). This is the correct semantic for SEO meta backfill. If a Webflow page mutates `document.title` after `domcontentloaded`, we capture the mutated value — which is what we want.

Concurrency: process URLs serially (one Playwright context at a time). ~200 URLs × ~3-4s = ~10 minutes; live-site rate-limit risk negligible. Do not parallelise — Cloud Employee is on Webflow shared hosting and we don't want to trigger their bot defences during a migration.

**Hard abort gate:** if total scrape time exceeds 20 minutes, abort and investigate. Most likely cause is Webflow rate-limiting or DNS/CDN issues. Resume capability not in scope for v1.1 — re-run from scratch is acceptable since writes are idempotent patches.

### Step 3 — Normaliser

Create `src/lib/content/meta-normaliser.ts`:

```typescript
const BRAND_SUFFIXES = [
  ' | Cloud Employee',
  ' - Cloud Employee',
  ' - CloudEmployee',
  ' | CloudEmployee',
];

export interface NormaliseResult {
  metaTitle: string | null;
  metaDescription: string | null;
  warnings: string[];     // logged into content_migrations.error_log
}

export function normaliseMeta(raw: { rawTitle: string | null; rawDescription: string | null }): NormaliseResult {
  const warnings: string[] = [];

  let metaTitle = raw.rawTitle?.trim() ?? null;
  if (metaTitle) {
    for (const suffix of BRAND_SUFFIXES) {
      if (metaTitle.endsWith(suffix)) { metaTitle = metaTitle.slice(0, -suffix.length).trim(); break; }
    }
    if (metaTitle.length > 60) {
      warnings.push(`metaTitle exceeded 60 chars (${metaTitle.length}); truncated at word boundary`);
      metaTitle = truncateAtWord(metaTitle, 60);
    }
    if (metaTitle.length === 0) metaTitle = null;
  } else {
    warnings.push('rawTitle missing on live page');
  }

  let metaDescription = raw.rawDescription?.trim() ?? null;
  if (metaDescription) {
    if (metaDescription.length > 160) {
      warnings.push(`metaDescription exceeded 160 chars (${metaDescription.length}); truncated at word boundary`);
      metaDescription = truncateAtWord(metaDescription, 160);
    }
    if (metaDescription.length < 140) {
      warnings.push(`metaDescription under 140 chars (${metaDescription.length}); accepted as-is`);
    }
    if (metaDescription.length === 0) metaDescription = null;
  } else {
    warnings.push('rawDescription missing on live page');
  }

  return { metaTitle, metaDescription, warnings };
}

function truncateAtWord(s: string, max: number): string {
  if (s.length <= max) return s;
  const slice = s.slice(0, max);
  const lastSpace = slice.lastIndexOf(' ');
  return (lastSpace > max * 0.7 ? slice.slice(0, lastSpace) : slice).trim();
}
```

**Hard rule: never pad or fabricate a metaDescription to hit 140 chars.** Short is recoverable in Studio. Fabricated is not.

### Step 4 — (REMOVED in v1.1)

Originally the audit-output cross-check step. Removed per Finding 4 of the v1.0 self-audit. Rationale: live-scrape was already chosen as authoritative; cross-checking against AUDIT-1 audit-output without a way to surface the diff to Seb in Studio added complexity for no actionable output. The `metaSource` provenance field (Step 5) replaces it — every meta write logs `provider='live-scrape'` with `scrapedAt` and `url`, providing all the auditability we actually need.

If, post-launch, we want a "did marketing change meta since the audit" diff report, that's a separate read-only script — not part of the migration write path.

### Step 5 — Per-collection backfill scripts

Create five scripts, one per in-scope collection. They share most of the body. Implement once via a shared `runMetaBackfill()` helper in `src/lib/content/meta-backfill-runner.ts` and have each script supply its `_type`, target Sanity field policy (skip-if-not-null rules), and slug.

**Skip-if-not-null policy per collection:**

| Collection | metaTitle | metaDescription |
|---|---|---|
| `technology` | always write (scrape) | always write (scrape) |
| `service` | always write (scrape) | always write (scrape) |
| `customerStory` | always write (scrape; `virgin` placeholder) | always write (scrape; `virgin` placeholder) |
| `teamMember` | always write (scrape) | always write (scrape) |
| `review` | always write (scrape) | **conditional:** if `metaDescription` already set → skip. Else if `snippetForMeta` set → copy (truncate to 160). Else → scrape. |
| `bookACall` | always write (scrape) | **never write** (already populated from Webflow `title` in 1B) |

**Write pattern (patch, not createOrReplace):**

```typescript
await sanityWriteClient
  .patch(doc._id)
  .set({
    metaTitle: normalised.metaTitle ?? '',
    ...(shouldWriteDescription ? { metaDescription: normalised.metaDescription ?? '' } : {}),
    needsReview: shouldFlagForReview(normalised, scraped),
    metaSource: { provider: providerLabel, scrapedAt: scraped.scrapedAt, url: scraped.url },
  })
  .commit();
```

**`providerLabel` values:** `'live-scrape'` | `'snippetForMeta-copy'` | `'placeholder'`. Used for downstream auditability.

**`needsReview = true` when ANY of:**
- `scraped.status !== 200`
- `scraped.rawTitle` is null on a doc that needs metaTitle
- `scraped.rawDescription` is null on a doc that needs scraped metaDescription (does NOT apply when source is `snippetForMeta-copy`)
- `normalised.warnings.length > 0` (truncation, length, missing fields)
- `customerStory.slug.current === 'virgin'` (always — known placeholder; provider = `'placeholder'`)

**`needsReview` does NOT override an existing `true` to `false`.** Any prior flag stays. The patch only sets `true` (use `setIfMissing` semantics conceptually — do `.set({needsReview: true})` only when our computed value is `true`; otherwise omit from the patch).

**Schema fields used here are all added in Step 0a.** No further schema changes in Step 5.

**One `content_migrations` row per script:**

```typescript
await recordMigration({
  collectionSlug: 'meta-backfill-technology',  // namespace separate from CONTENT-1A/1B/1C slugs
  sourceItemCount: scrapeScope.length,
  migratedItemCount: succeeded,
  status: errors.length === 0 ? 'complete' : 'failed',
  errorLog: errors,
});
```

5 new `content_migrations` rows total (one per in-scope `_type` excluding `bookACall` which has no metaDescription work, but bookACall metaTitle still needs its own row → **6 rows total**).

### Step 6 — Image carryover scripts

#### 6.1 `scripts/content/migrate-benefit-value-thumbnails.ts`

For each of the 9 `benefitValue` docs that have a populated `webflowImageUrl` and no `thumbnailImage`:

1. Call `uploadImage(webflowImageUrl)` from `src/lib/content/migration-helpers.ts`.
2. Patch the doc: `set({thumbnailImage: <uploaded asset>}).unset(['webflowImageUrl']).commit()`.
3. If upload fails, leave `webflowImageUrl` in place, log to `error_log`, set `needsReview: true`. Do not block the phase.

Record one `content_migrations` row: `slug = 'image-carryover-benefit-values'`.

#### 6.2 `scripts/content/migrate-staff-benefit-icons.ts`

Identical pattern for the 6 `staffBenefit` docs. `slug = 'image-carryover-staff-benefits'`.

#### 6.3 `scripts/content/migrate-video-backup-image-retry.ts`

Query `*[_type == "video" && !defined(backupImage) && defined(webflowImageUrl)]`. For each (expected: 1):

1. Same upload + patch pattern.
2. `slug = 'image-carryover-video-backup'`. **If query returns 0 docs, write a row with `sourceItemCount=0, migratedItemCount=0, parity_score=100` (vacuous-success per CONTENT-1C convention).**

#### 6.4 `scripts/content/fix-video-embed-link-encoding.ts`

Query `*[_type == "video" && mainVideoEmbedLink match "*&amp;*"]`. For each:

1. Patch: `set({mainVideoEmbedLink: decodeHtmlEntities(doc.mainVideoEmbedLink)}).commit()`.
2. `slug = 'video-embed-link-encoding-fix'`. Vacuous-success rule applies.

### Step 7 — Smoke-test cleanup

`scripts/content/cleanup-smoke-test-docs.ts`:

1. For each of the 3 known smoke-test docs (note: 5 smoke-test docs total exist from SCHEMA-1; the 2 not listed here are out-of-scope for CONTENT-1D and will be cleaned pre-launch):
   - `scaling-teams (SMOKE TEST)` tag — query by exact `name == "scaling-teams (SMOKE TEST)"`
   - `smoke-test-blog-category-scaling-teams` — known `_id`
   - `smoke-test-team-member` — known `_id`
2. **Reference check:** `*[references($id)]` — if any results, halt with the referencing doc IDs printed. Do not delete.
3. **Production tag sanity check (only applies to the smoke-test tag deletion):** confirm a real `tag` document with `slug.current === "scaling-teams"` and `name == "Scaling Teams"` (the production category tag, written in CONTENT-1A) exists in the dataset. This proves we're deleting the SMOKE TEST variant only, not the production tag. Halt if the production tag is missing — that would mean it was never created or was lost, and deleting the SMOKE TEST variant would leave us with zero `scaling-teams` tag in production.
4. Delete via `sanityWriteClient.delete(id)`.
5. Verify post-delete: confirm the 3 specific smoke-test `_id`s no longer exist. Total CMS doc count remains 404 (smoke-test docs aren't real CMS content). Total smoke-test docs remaining: 2 (out-of-scope, flagged in `metadata.content_phase.smoke_test_docs_remaining`).

`slug = 'smoke-test-cleanup'`. Vacuous-success exception applies if smoke-test docs are already gone (idempotent re-run).

### Step 8 — State transition

`scripts/content/complete-content-phase.ts`:

1. Run the verifier (Step 9) inline — if it returns non-zero, abort.
2. `assertValidTransition('content_running', 'content_complete')`.
3. Update `migrations` row:
   ```
   status = 'content_complete'
   current_phase = 'content_complete'
   metadata.content_phase = {
     started_at: <CONTENT-1A start_at from existing metadata if recorded, else null>,
     completed_at: <ISO now>,
     total_cms_docs: 404,                // unchanged from CONTENT-1C — smoke-test docs were never real CMS content
     smoke_test_docs_remaining: 2,       // SCHEMA-1 left 5; CONTENT-1D deleted 3; pre-launch cleanup handles the remaining 2
     content_migrations_rows: <count from query, expected 35>,
     phases: ['CONTENT-1A', 'CONTENT-1B', 'CONTENT-1C', 'CONTENT-1D']
   }
   ```
4. Requires `--confirm` flag to run.

`npm run content:complete` — needs `-- --confirm`.

This step is a hard gate. If the verifier fails, do not transition. The phase remains `content_running` until the underlying issue is resolved.

**Pre-launch follow-up flagged by this step:** the 2 remaining smoke-test docs (out of the original 5 from SCHEMA-1, minus the 3 deleted in CONTENT-1D) need to be cleaned up before MYGRATR-LAUNCH. Add to `CLAUDE.md` Tech Debt during post-phase update.

### Step 9 — Verifier

`scripts/content/verify-content-1d.ts`:

Hard-gate checks that exit non-zero on any failure:

1. **Meta coverage:** every `technology`, `service`, `customerStory`, `teamMember` doc has `metaTitle` and `metaDescription` populated (non-null, non-empty). Every `review` doc has `metaTitle` and `metaDescription` populated (description from snippetForMeta-copy or scrape). Every `bookACall` doc has `metaTitle` (description was already populated in 1B).
2. **Length compliance:** every populated `metaTitle` ≤ 60 chars; every populated `metaDescription` ≤ 160 chars.
3. **`metaSource` provenance:** every in-scope doc has a `metaSource` object with `provider`, `scrapedAt`, `url` set (except `bookACall` description which came from CONTENT-1B and has no metaSource).
4. **Image carryovers:** zero `benefitValue` docs with `webflowImageUrl` set and `thumbnailImage` unset. Zero `staffBenefit` docs with `webflowImageUrl` set and `icon` unset. Zero `video` docs with `webflowImageUrl` set and `backupImage` unset.
5. **Encoding fix:** zero `video` docs whose `mainVideoEmbedLink` matches `*&amp;*`.
6. **Smoke-test cleanup (partial — CONTENT-1D scope only):** the 3 specific in-scope smoke-test `_id`s no longer exist. Note: 2 other SCHEMA-1 smoke-test docs remain — verifier does NOT fail on these; pre-launch cleanup handles them.
7. **`content_migrations`:** 6 new meta rows + 4 carryover rows + 1 cleanup row = **11 new rows for CONTENT-1D**, all `status='complete'`, `parity_score=100`. Total CE rows post-1D = 35.
8. **State:** `migrations.status === 'content_complete'`, `migrations.current_phase === 'content_complete'`, `metadata.content_phase` block exists with `total_cms_docs: 404` and `smoke_test_docs_remaining: 2`.

Print summary. Exit 0 only when everything passes.

`npm run content:verify-1d`.

---

## 6. Files Created / Modified

### New
- `scripts/content/verify-content-1d-prereqs.ts`
- `scripts/content/test-url-builder.ts`
- `scripts/content/migrate-meta-technology.ts`
- `scripts/content/migrate-meta-service.ts`
- `scripts/content/migrate-meta-customer-story.ts`
- `scripts/content/migrate-meta-team-member.ts`
- `scripts/content/migrate-meta-review.ts`
- `scripts/content/migrate-meta-book-a-call.ts`
- `scripts/content/migrate-benefit-value-thumbnails.ts`
- `scripts/content/migrate-staff-benefit-icons.ts`
- `scripts/content/migrate-video-backup-image-retry.ts`
- `scripts/content/fix-video-embed-link-encoding.ts`
- `scripts/content/cleanup-smoke-test-docs.ts`
- `scripts/content/complete-content-phase.ts`
- `scripts/content/verify-content-1d.ts`
- `src/lib/content/url-builder.ts`
- `src/lib/content/meta-scraper.ts`
- `src/lib/content/meta-normaliser.ts`
- `src/lib/content/meta-backfill-runner.ts`

### Modified

**Studio schemas (Step 0a — retroactive §7.2 application + metaSource):**
- `studio/schemas/documents/customer-story.ts` — add `source`, `generatedAt`, `needsReview`, `metaSource`
- `studio/schemas/documents/team-member.ts` — same 4 fields
- `studio/schemas/documents/review.ts` — same 4 fields
- `studio/schemas/documents/book-a-call.ts` — same 4 fields
- `studio/schemas/documents/technology.ts` — already has §7.2 fields; add `metaSource` only
- `studio/schemas/documents/service.ts` — already has §7.2 fields; add `metaSource` only

**Zod twins:**
- `src/types/sanity/customer-story.ts` — add 4 optional fields
- `src/types/sanity/team-member.ts` — same
- `src/types/sanity/review.ts` — same
- `src/types/sanity/book-a-call.ts` — same
- `src/types/sanity/technology.ts` — add `metaSource` only
- `src/types/sanity/service.ts` — add `metaSource` only

**Configuration:**
- `package.json` — 11 new npm scripts (one per migrator + verify + complete)

### Dependencies added
- `playwright` (runtime), `@playwright/test` not needed
- `npx playwright install chromium` as a one-off post-install step (document in CLAUDE.md tech-debt-resolution if not already)

### No DDL
- No Supabase migrations. `content_migrations` already has the required columns.
- 11 new `content_migrations` rows on the existing schema.

### Removed from v1.0
- `src/lib/content/audit-output-meta-reader.ts` (was in v1.0; removed in v1.1 — see Step 4)

---

## 7. Edge Cases / Risk Register

| Risk | Mitigation |
|---|---|
| Live page returns non-200 on a slug that exists in Sanity (URL drift since AUDIT-1) | Step 2 captures status; row written with `needsReview: true`, empty meta fields, scrape entry recorded in error_log. Phase does not abort. Step 9 verifier will fail if any doc lacks meta — forcing a manual decision before transition. |
| Webflow blocks the scraper (rate limit, bot detection) | Serial execution + custom UA; if blocked, phase halts for human review. Hard abort gate at 20 minutes total scrape time. Do not retry-storm. |
| Page meta is JS-rendered and DOMContentLoaded fires before meta is set | `waitUntil: 'domcontentloaded'` is conservative for Webflow (tested SSR for tech pages in audit). If a smoke-test of 5 URLs in dev shows empty meta despite live values, switch to `waitUntil: 'networkidle'`. |
| Step 0a schema expansion breaks existing docs | The §7.2 fields and `metaSource` are all optional with defaults (`needsReview: false`, others null). Sanity does not require existing docs to backfill optional new fields on read. The 4 affected schemas are SCHEMA-1 documents already populated with content; verify in Studio after the rebuild that existing docs render without errors before running any migration scripts. |
| Step 0a Studio rebuild required before scripts can run | `cd studio && npm run dev` once locally to compile and validate. Scripts can technically write the new fields even without Studio rebuild (Sanity ignores unknown fields server-side), but Studio must be rebuilt for Seb to see/filter `needsReview` in the editor — and that's the whole point of adding it as visible. |
| `customerStory` slug `virgin` placeholder | Hardcoded special-case: write `metaTitle: 'Customer story in progress'`, `metaDescription: 'Customer story in progress.'`, `needsReview: true`, `metaSource.provider: 'placeholder'`. Skip live scrape entirely (the live page is itself a placeholder). |
| Smoke-test docs have inbound references we didn't expect | Step 7 reference check halts the cleanup with the referencing doc IDs printed. Manual decision required (probably: rewrite the reference, then re-run cleanup). Do not delete despite references. |
| `metaSource` field bloats Studio doc size | Per-doc cost is ~150 bytes. Across ~200 docs, ~30KB total. Negligible. |
| `snippetForMeta` for review is longer than 160 chars (max 300 per schema) | Truncate at 160 with word boundary via `truncateAtWord()`. Provider stays `snippetForMeta-copy`; warning logged in error_log. Set `needsReview: true` since truncation may have cut mid-sentence. |
| Doc-count narrative drift (404 vs 401 vs other) | v1.0 audit caught this — v1.1 locks `total_cms_docs: 404` (smoke-test docs were never real CMS content) and tracks `smoke_test_docs_remaining` separately. |

---

## 8. Exit Criteria

All must hold before the phase is considered complete.

1. `migrations.status === 'content_complete'` and `current_phase === 'content_complete'` for the CE migration.
2. `metadata.content_phase` block populated with completion timestamp, doc count, phase list.
3. `npm run content:verify-1d` exits 0.
4. Every in-scope doc has its target meta fields populated OR `needsReview: true` flagged with reason in `metaSource` / error_log.
5. Zero benefitValue / staffBenefit / video docs hold `webflowImageUrl` staging strings.
6. Zero video docs have `&amp;` in `mainVideoEmbedLink`.
7. Zero `smoke-test-*` docs in the dataset.
8. `content_migrations` table holds 35 rows for the CE migration (24 prior + 11 new), all `status='complete'`, `parity_score=100`.
9. Branch `feat/content-1d` merged to `main` after post-phase context-file update.

---

## 9. Post-Phase Updates (Required Before Closing)

Apply the standard post-phase protocol from `CLAUDE.md`. In order:

1. **`CHANGELOG.md`** — one paragraph: 11 new content_migrations rows, ~177 meta fields backfilled via Playwright live scrape, image carryovers cleared, smoke-test docs deleted, `content_complete` reached. Note any disagreement counts between live and audit-output.
2. **`PHASE_HISTORY.md`** — detailed record. Files created. Patterns established (live-scrape pattern, `metaSource` provenance pattern, hidden-field-for-migration-metadata pattern). Final doc counts. Any discoveries or surprises during execution.
3. **`CONVENTIONS.md`** — add new section "Live-Site Meta Backfill Pattern" if Playwright + provenance is reused later (likely — Mygratr customer 2 will hit this same problem). Document the brand-suffix strip rule, the `needsReview` liberality rule, and the "never fabricate metaDescription" rule.
4. **`FEATURE_MAP.md`** — new section: "Content Migration — Meta Backfills (CONTENT-1D)" with files, scripts, npm commands, doc counts.
5. **`CLAUDE.md`** — update phase status table; mark CONTENT-1D complete; mark CONTENT-1C the predecessor of TEMPLATE-* (next phase). Update doc count: 401 CMS docs total. Update `migrations.status` to `content_complete`.
6. **`SCHEMA.md`** — no DDL ran; no update needed unless `content_migrations` row count narrative is in the doc.
7. **`REGISTRY.md`** — add 11 new scripts; add `metaSource` field reference; add 11 new npm commands.

Then post-phase audit: fresh chat, load codebase, verify nothing broken.

---

## 10. Cross-Model Audit Targets

This phase warrants `preset:full` ($1.50, 5 models) because:
- Live web scraping with Sanity writes is a destructive-on-failure pattern
- The schema modification (`metaSource` hidden field) touches 6 doc types
- The `needsReview` liberality rule has follow-on implications for Seb's Studio queue size
- The state transition is the gate from CONTENT to TEMPLATE

Specific audit prompts to seed:

- "Is the Step 0a schema expansion (adding `source`/`generatedAt`/`needsReview` to 4 existing doc types that already have published content in Sanity) safe? Will existing docs continue to render and publish without backfilling these new optional fields?"
- "Is the `metaSource` hidden-field pattern safe to add post-hoc to documents that already exist in the dataset?"
- "Is `waitUntil: 'domcontentloaded'` correct for Webflow templated pages, or is `networkidle` safer? Specifically for Technology pages which use custom-code JSON-LD injection per AUDIT-1."
- "Is the URL construction in `urlForDoc()` complete? Are there any edge cases (URL encoding, slug-with-special-chars, redirect chains) it misses against the routing table in §10 of the schema decisions doc?"
- "Are the 11 expected `content_migrations` rows correct? Does splitting review into a single row (covering both metaTitle scrape and metaDescription mixed-source) lose information vs splitting into two rows?"
- "Is the `snippetForMeta` truncation rule for review.metaDescription (truncate to 160 + flag needsReview) the right call, or should we always scrape regardless of snippetForMeta presence to get a properly-targeted metaDescription?"

---

## 11. Estimated Runtime

- Step 0 pre-flight: 30s
- Step 0a schema additions + Studio rebuild check: 2 min
- Step 1 URL list construction + tests: 30s
- Step 2 Playwright scrape (~200 URLs, serial, ~3-4s each): **~10-12 minutes**
- Steps 3, 5 normalisation + Sanity writes: ~30s (writes are ~50ms each)
- Step 6 image carryovers (16 uploads): ~30s
- Step 7 smoke-test cleanup: 5s
- Step 8 state transition: 5s
- Step 9 verifier: 10s

**Total: ~15 minutes execution time, plus Claude Code's reading/thinking overhead. Phase should close inside one Claude Code session.**

**Hard abort gate:** if Step 2 scrape exceeds 20 minutes, abort and investigate before re-running. Most likely cause: Webflow rate-limiting or DNS/CDN issue. Re-run is safe — writes are idempotent patches.

---

## 12. Mygratr-Reusable Primitives Established

What from this phase is reusable for customer 2+:

- **`meta-scraper.ts`** — generic Playwright-backed `<title>` + `<meta description>` extractor. Reusable as-is for any customer's live site.
- **`meta-normaliser.ts`** — brand-suffix stripping is the only customer-specific bit; pass `BRAND_SUFFIXES` as an arg, lift the rest. Refactor into `Mygratr.MetaBackfill` module post-CE.
- **Live-scrape + audit-output cross-check pattern** — the freshness-doubt-resolution flow generalises to any "we audited a site, we migrated it, did the source change in between" question.
- **`needsReview` provenance flagging** — same pattern applies to any data Mygratr writes that the customer's editor needs to verify. Solidify into `CONVENTIONS.md` so customer 2's brief can reference it.

What is NOT reusable and stays CE-specific:

- The 6-collection scope list
- The `urlForDoc()` switch (every customer has different routing)
- Brand-suffix list

This is the leverage flag for productisation: every customer needs meta backfill, every customer's live-vs-audit drift will be different, every customer will route URLs differently. The scraper + normaliser + cross-check pattern is reusable; the wiring is not. Pull the reusable bits into `src/lib/mygratr/meta-backfill/` post-CE.

---

*End of MYGRATR-CONTENT-1D_BRIEF_v1.1.md*

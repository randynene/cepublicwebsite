# MYGRATR-CONTENT-1D — Meta Backfills + Carryover Fixes + content_complete

**Phase ID:** MYGRATR-CONTENT-1D
**Brief version:** v1.2
**Status:** READY FOR EXECUTION (post cross-model audit + Jake sign-off)
**Predecessor:** MYGRATR-CONTENT-1C (complete — 246 docs migrated, 24 `content_migrations` rows at parity 100)
**Successor:** MYGRATR-TEMPLATE-* (template build phases)

**Changelog from v1.1 (post cross-model audit, 2026-04-30):**

*Critical findings (3):*
- F1: Abort gate now structurally implemented in shared runner. Phase-wide wall-clock check, hard `process.exit(1)`, failure row written before exit.
- F2: Verifier rewritten as `verifyContent1D()` that throws on failure — never returns boolean. State transition is structurally unreachable on verification failure (no try/catch wrapping).
- F3: Token least-privilege requirement added. Dedicated `SANITY_MIGRATION_WRITE_TOKEN` scoped to single dataset; runtime assertion against read-token presence; rotation requirement post-1D.

*Important findings (13):*
- F4: Patch sample rewritten — `needsReview` is omitted from patch when false (never overwrites prior `true`).
- F5: `metaTitle` never written when null/empty — field stays undefined; verifier catches it.
- F6: Per-field policy enum (`FieldPolicy.description: 'never-touch' | 'scrape-always' | …`). `bookACall` description never scraped, normalised, or validated.
- F7: Pre-scrape decision hook added to runner. `customerStory/virgin` short-circuits before URL construction.
- F8: `snippetForMeta-copy` path explicitly routes through `truncateAtWord(s, 160)` with assertion before patch.
- F9: All Step 0 count queries use `&& !(_id match "smoke-test-*")` exclusion pattern.
- F10: Exit criterion #7 reworded to match Step 7/8/9 (3 deleted, 2 remain tracked).
- F11: Smoke-test tag deletion uses `_id` only (never name query). New `deleteByIdStrict()` helper. Convention: query-based deletes forbidden in migration scripts.
- F12: "Five scripts" → "Six scripts" corrected throughout.
- F13: 1.5-second inter-request delay added. Run timing recommended off-peak UTC.
- F14: ESLint `no-restricted-imports` rule + runtime assertion against read-token environment in write client.
- F16: Image upload idempotency — fetch-and-skip pattern + same-commit set/unset.
- F22: Studio deploy is a hard ordering gate before Steps 5-7. Operational checklist with Seb confirmation step.

*Minor findings (6):*
- F17: `truncateAtWord()` fixed for whitespace-only-prefix edge case.
- F18: Comment in Zod twins re: `initialValue` not retroactive on existing docs.
- F19: Convention rule + helper for explicit-`_id` deletion only.
- F20: Vacuous-success row write made explicit before any return path.
- F21: Provenance split into `metaTitleSource` and `metaDescriptionSource` (option a). Per-field accuracy.
- (F15 absent — not a finding.)

*Changelog from v1.0 (post self-audit, 2026-04-30):* (preserved)
- Schema-spec interpretation locked: `snippetForMeta` → `metaDescription` only; `metaTitle` always scraped fresh.
- Step 0a added: retroactive §7.2 source-tracking on customerStory, teamMember, review, bookACall.
- Doc count maths corrected — `total_cms_docs: 404` post-1D; `smoke_test_docs_remaining: 2`.
- Audit-output cross-check removed.
- Runtime estimate revised: ~15 min total, 20-min hard abort.

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

**0.1 Token scoping (REQUIRED before any write — F3 from audit):**

Migration writes must use a least-privilege token, separate from any read tokens. CONTENT-1A through 1C used a generic `SANITY_API_TOKEN` — CONTENT-1D upgrades to a scoped pattern.

1. In Sanity manage console, create a new API token: `SANITY_MIGRATION_WRITE_TOKEN`. Permissions: minimum role permitting document patch, document delete, asset upload. Scope: single dataset (`production`). Do NOT grant project-admin or all-datasets scope.
2. Add to `.env.local` and document in `.env.example`. Remove any reference to the generic `SANITY_API_TOKEN` from migration scripts.
3. In `src/lib/content/sanity-write-client.ts`:
   - Read `process.env.SANITY_MIGRATION_WRITE_TOKEN` (NOT `SANITY_API_TOKEN`).
   - At module load, throw if the variable is unset OR if `SANITY_API_READ_TOKEN` is also present in the same process — the read token's presence signals wrong client context (the read client is for the site, not migration scripts):
     ```typescript
     if (!process.env.SANITY_MIGRATION_WRITE_TOKEN) throw new Error('SANITY_MIGRATION_WRITE_TOKEN required');
     if (process.env.SANITY_API_READ_TOKEN) throw new Error('Read token must not be present in migration script context');
     ```
4. **Post-1D rotation:** Rotate `SANITY_MIGRATION_WRITE_TOKEN` after CONTENT-1D completes. Track in `CLAUDE.md` Tech Debt as a launch checklist item.

**0.2 Pre-flight verifier — `scripts/content/verify-content-1d-prereqs.ts`:**

All count queries MUST exclude smoke-test docs using the CONTENT-1C exclusion pattern (verified in `scripts/content/verify-content-1c.ts`):

```groq
count(*[_type == $type && !(_id match "smoke-test-*")])
```

This is non-negotiable — without exclusion, `count(*[_type == "teamMember"])` returns 29 (28 real + 1 smoke-test) and the pre-flight halts on a false-positive.

Verifier checks:

1. Assert `migrations.status === 'content_running'` and `migrations.current_phase === 'content_running'` for the CE migration.
2. Query Sanity with smoke-test exclusion, count docs per in-scope type — assert exactly: technology 101, service 23, customerStory 18, teamMember 28, review 26, bookACall 6.
3. Query Sanity for current meta-field state on each in-scope type. Build the actual scrape scope (which docs need metaTitle, which need metaDescription). Print the scope; refuse to continue if the count is zero or anomalously high.
4. Confirm none of the 4 UNKNOWN canonical URLs (from tech debt #9) overlap with in-scope slugs. Halt if any do.
5. Confirm the 3 smoke-test doc IDs exist in Sanity. Confirm they have **zero inbound references** via `*[references($smokeTestId)]` per ID. Halt if any have references — do not silently break things.
6. Confirm Playwright is installed (`npx playwright --version`).
7. Confirm `SANITY_MIGRATION_WRITE_TOKEN` is set and `SANITY_API_READ_TOKEN` is NOT set in current shell.

Add `npm run content:verify-1d-prereqs` to `package.json`.

Run it. Halt if anything fails. Commit `chore(content-1d): pre-flight checks + token scoping`.

### Step 0a — Retroactive §7.2 source-tracking field application

**Context:** §7.2 of the schema decisions doc establishes `source` / `generatedAt` / `needsReview` source-tracking fields on `blogPost`, `compareBlog`, `technology`, `service`, `industry`, `persona`, `location`. CONTENT-1D needs `needsReview` flagging on all 6 in-scope doc types. Four of those six (`customerStory`, `teamMember`, `review`, `bookACall`) were not given §7.2 fields in SCHEMA-1. CONTENT-1D corrects this gap before writing any meta data.

**Scope:** Add the §7.2 triplet (`source`, `generatedAt`, `needsReview`) to `customerStory`, `teamMember`, `review`, `bookACall` schemas. Add the per-field provenance fields (`metaTitleSource`, `metaDescriptionSource`) to all 6 in-scope schemas (the 2 that already have §7.2 fields plus the 4 we're patching now).

**Schema additions per file:**

```typescript
// In studio/schemas/documents/customer-story.ts (and the 3 others — teamMember, review, bookACall):
defineField({
  name: 'source',
  type: 'string',
  options: { list: [{ title: 'Manual', value: 'manual' }, { title: 'Beem', value: 'beem' }, { title: 'Claude Code', value: 'claude_code' }, { title: 'Imported', value: 'imported' }] },
  initialValue: 'manual',
  hidden: true,  // F18: initialValue does NOT retroactively populate the 105 pre-CONTENT-1D docs — they remain undefined
}),
defineField({ name: 'generatedAt', type: 'datetime', hidden: true }),
defineField({ name: 'needsReview', type: 'boolean', initialValue: false }),  // visible — Seb filters by this for review queue
```

**Why `needsReview` is visible (not hidden) but `source`/`generatedAt` are:**

`needsReview` drives Seb's Studio review queue — a default Sanity Structure list that filters to `*[needsReview == true]`. It must be visible to be queryable in Studio's UI. `source`/`generatedAt` are provenance metadata Seb doesn't need to see by default; visible only when troubleshooting.

**Per-field provenance (split per F21 — replaces single `metaSource` from v1.1):**

```typescript
// Add to all 6 in-scope schemas:
defineField({
  name: 'metaTitleSource',
  type: 'object',
  hidden: true,
  fields: [
    defineField({ name: 'provider', type: 'string' }),     // 'live-scrape' | 'placeholder'
    defineField({ name: 'scrapedAt', type: 'datetime' }),
    defineField({ name: 'url', type: 'url' }),
  ],
}),
defineField({
  name: 'metaDescriptionSource',
  type: 'object',
  hidden: true,
  fields: [
    defineField({ name: 'provider', type: 'string' }),     // 'live-scrape' | 'snippetForMeta-copy' | 'placeholder' | 'webflow-cms'
    defineField({ name: 'scrapedAt', type: 'datetime' }),
    defineField({ name: 'url', type: 'url' }),
  ],
}),
```

**Why split (option a):** for `review` docs, `metaTitle` may be scraped while `metaDescription` is copied from `snippetForMeta`. A single `metaSource` object cannot represent both accurately. Splitting per-field doubles 2 hidden objects per doc (~150 bytes more per doc, ~30KB total across the dataset) — negligible cost for accurate audit trail.

**Zod twins:** Update `src/types/sanity/customer-story.ts`, `team-member.ts`, `review.ts`, `book-a-call.ts` to add `source`, `generatedAt`, `needsReview` as optional fields. Update all 6 type files to add `metaTitleSource` and `metaDescriptionSource` as optional. Add comment in each: *"// Pre-CONTENT-1D docs have source: undefined despite initialValue. See Finding F18."*

**0a.1 Studio deploy ordering gate (HARD ORDERING — F22 from audit):**

The schema deploy must precede any write to the new fields. If Seb opens Studio before the deploy and a doc has `needsReview: true`, the field is invisible (schema not yet deployed), Seb may mentally treat the doc as clean, and post-deploy the flag suddenly appears — confusion.

**Required ordering — DO NOT SKIP:**

1. Modify schema files (Step 0a).
2. Run `cd studio && npm run build` locally to validate compilation.
3. **Deploy Studio to production:** `cd studio && npm run deploy` (or whatever path the SCHEMA-1 deploy used — confirm via `studio/package.json` scripts).
4. **Wait for Seb confirmation:** "I can see the `needsReview` toggle on customerStory / teamMember / review / bookACall when I open a doc in Studio." This confirms the deploy succeeded.
5. **Only then proceed to Steps 5-7.** Do NOT run any meta backfill or carryover script before Seb's confirmation.

Add to a top-of-file comment in every meta-backfill script:

```typescript
// HARD GATE: do not run this script until Studio production deploy is confirmed.
// See CONTENT-1D brief Step 0a.1.
```

**0a.2 Path alias collision prevention (F14 from audit):**

The monorepo has both a root `@/*` alias and a `site/` `@/*` alias. A migration script accidentally importing `@/lib/sanity/client` could resolve to `site/src/lib/sanity/client.ts` (the read-only published client) instead of `src/lib/content/sanity-write-client.ts` — silent write failure or developer "fix" that grants write credentials to the site boundary.

**Three-layer guard:**

1. **Hard rule in script headers** — every migration script imports `sanityWriteClient` exclusively from `@/lib/content/sanity-write-client`. Never from `@/lib/sanity/*` or `site/src/lib/sanity/*`.
2. **ESLint rule** — add `no-restricted-imports` to `scripts/**` and `src/lib/content/**` blocking `site/src/lib/sanity/*` and `@/lib/sanity/*`:
   ```json
   "no-restricted-imports": ["error", {
     "paths": [
       { "name": "@/lib/sanity/client", "message": "Use @/lib/content/sanity-write-client in migration scripts" }
     ],
     "patterns": ["site/src/lib/sanity/*", "@/lib/sanity/*"]
   }]
   ```
3. **Runtime assertion** — already covered in Step 0.1 (the `SANITY_API_READ_TOKEN` presence check throws if the wrong client context is used).

**Validation:** Add to `verify-content-1d-prereqs.ts` — confirm the 4 affected schema files compile (TypeScript) and that the Zod twins parse a sample doc with the new fields.

Commit `feat(content-1d): retroactive §7.2 + split per-field provenance + Studio deploy gate`.

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

Concurrency: process URLs serially (one Playwright context at a time). Do not parallelise — Cloud Employee is on Webflow shared hosting and we don't want to trigger their bot defences during a migration.

**Inter-request delay (F13 from audit):** the scrape loop must include a 1.5-second delay between page fetches to avoid Cloudflare JS challenges and 429 responses on Webflow shared hosting. 200 URLs × 1.5s = +5 minutes total — well within the 20-minute abort gate.

```typescript
const INTER_REQUEST_DELAY_MS = 1500;
// In the runner loop, after each scrape (except the last):
await new Promise(resolve => setTimeout(resolve, INTER_REQUEST_DELAY_MS));
```

**Run timing recommendation:** schedule the scrape during off-peak UTC hours (early morning UTC = quietest CE traffic period based on AUDIT-1 traffic data) to minimise collision with live customer activity and Cloudflare's behavioral baseline.

**Phase-wide abort gate (implemented in shared runner — see Step 5):** if total wall-clock time across the scrape phase exceeds 20 minutes, the runner writes a failure `content_migrations` row and calls `process.exit(1)` (hard exit, not `break`). This is the structural gate that backstops Webflow rate-limit scenarios. See Step 5's `meta-backfill-runner.ts` spec for implementation.

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
  // F17 from audit: if the slice up to lastSpace is whitespace-only, fall back to the hard slice
  // — never return empty for non-empty input.
  const candidate = lastSpace > max * 0.7 ? slice.slice(0, lastSpace).trim() : slice.trim();
  return candidate.length > 0 ? candidate : slice.trim();
}
```

**Hard rule: never pad or fabricate a metaDescription to hit 140 chars.** Short is recoverable in Studio. Fabricated is not.

### Step 4 — (REMOVED in v1.1)

Originally the audit-output cross-check step. Removed per Finding 4 of the v1.0 self-audit. Rationale: live-scrape was already chosen as authoritative; cross-checking against AUDIT-1 audit-output without a way to surface the diff to Seb in Studio added complexity for no actionable output. The `metaTitleSource` / `metaDescriptionSource` provenance fields (Step 5, split per F21) replace it — every meta write logs `provider`, `scrapedAt`, and `url`, providing all the auditability we actually need.

If, post-launch, we want a "did marketing change meta since the audit" diff report, that's a separate read-only script — not part of the migration write path.

### Step 5 — Per-collection backfill scripts

Create **six** scripts, one per in-scope collection. They share most of the body. Implement once via a shared `runMetaBackfill()` helper in `src/lib/content/meta-backfill-runner.ts` and have each script supply its `_type`, `FieldPolicy`, and a pre-scrape decision hook.

**Per-field policy enum (F6 from audit):** the runner accepts an explicit policy object that distinguishes "scrape always" from "skip if present" from "never touch":

```typescript
export type TitlePolicy = 'scrape-always';
export type DescriptionPolicy =
  | 'scrape-always'              // technology, service, customerStory, teamMember
  | 'skip-if-present-else-scrape'  // (no current users — kept for forward use)
  | 'snippet-copy-else-scrape'   // review (copy snippetForMeta to metaDescription, scrape if null)
  | 'never-touch';               // bookACall (already populated in CONTENT-1B)

export interface FieldPolicy {
  title: TitlePolicy;
  description: DescriptionPolicy;
}
```

**Critical (F6):** when `description: 'never-touch'`, the runner MUST NOT call `scrapeMeta()` for the description field, MUST NOT normalise it, and MUST NOT validate it. The `bookACall` migrator hardcodes a sanity check at the top:

```typescript
// IMMUTABLE: metaDescription populated in CONTENT-1B from Webflow 'title' field.
// See CONTENT-1B PHASE_HISTORY entry. Do not change without explicit revision.
const policy: FieldPolicy = { title: 'scrape-always', description: 'never-touch' };
```

**Pre-scrape decision hook (F7 from audit):** the runner supports a per-doc override evaluated BEFORE URL construction:

```typescript
export type PreScrapeDecision =
  | { kind: 'continue' }
  | { kind: 'bypass'; patch: Record<string, unknown> };

// For customerStory:
function preScrapeCustomerStory(doc: SanityDoc): PreScrapeDecision {
  if (doc.slug.current === 'virgin') {
    return {
      kind: 'bypass',
      patch: {
        metaTitle: 'Customer story in progress',
        metaDescription: 'Customer story in progress.',
        needsReview: true,
        metaTitleSource: { provider: 'placeholder' },
        metaDescriptionSource: { provider: 'placeholder' },
      },
    };
  }
  return { kind: 'continue' };
}
```

The runner only calls `urlForDoc()` and `scrapeMeta()` when the hook returns `{kind: 'continue'}`. This guarantees the `virgin` placeholder is never scraped.

**Skip-if-not-null policy per collection:**

| Collection | title | description |
|---|---|---|
| `technology` | `scrape-always` | `scrape-always` |
| `service` | `scrape-always` | `scrape-always` |
| `customerStory` | `scrape-always` | `scrape-always` (`virgin` short-circuits via pre-scrape hook) |
| `teamMember` | `scrape-always` | `scrape-always` |
| `review` | `scrape-always` | `snippet-copy-else-scrape` |
| `bookACall` | `scrape-always` | `never-touch` |

**snippet-copy logic for review.metaDescription (F8 from audit):** when policy is `snippet-copy-else-scrape` AND `doc.metaDescription` is null AND `doc.snippetForMeta` is non-null, the runner copies `truncateAtWord(doc.snippetForMeta, 160)` and provider becomes `'snippetForMeta-copy'`. Truncation is mandatory — `snippetForMeta` allows up to 300 chars. After truncation, assert:

```typescript
assert(metaDescription.length <= 160, `Truncated snippetForMeta still exceeds 160: ${metaDescription.length}`);
```

If this assertion fires it's a logic bug; phase halts.

**Shared runner spec — `src/lib/content/meta-backfill-runner.ts`:**

```typescript
const PHASE_ABORT_MS = 20 * 60 * 1000;
const INTER_REQUEST_DELAY_MS = 1500;

export async function runMetaBackfill(opts: {
  type: string;                    // Sanity _type, e.g. 'technology'
  policy: FieldPolicy;
  preScrapeHook?: (doc: SanityDoc) => PreScrapeDecision;
  collectionSlug: string;          // for content_migrations row
}): Promise<void> {
  const phaseStart = Date.now();
  const errors: string[] = [];
  let succeeded = 0;
  const docs = await fetchInScopeDocs(opts.type, opts.policy);

  await withBrowser(async (browser) => {
    for (let i = 0; i < docs.length; i++) {
      // F1: phase-wide abort gate
      if (Date.now() - phaseStart > PHASE_ABORT_MS) {
        errors.push(`Phase aborted at 20-minute gate. Processed ${succeeded}/${docs.length}.`);
        await recordMigration({
          collectionSlug: opts.collectionSlug,
          sourceItemCount: docs.length,
          migratedItemCount: succeeded,
          status: 'failed',
          errorLog: errors,
        });
        process.exit(1);   // hard exit — not break — F1
      }

      const doc = docs[i];

      // F7: pre-scrape decision evaluated BEFORE URL construction
      const decision = opts.preScrapeHook?.(doc) ?? { kind: 'continue' };
      if (decision.kind === 'bypass') {
        await sanityWriteClient.patch(doc._id).set(decision.patch).commit();
        succeeded++;
        continue;
      }

      // Normal flow
      const url = urlForDoc(doc);
      const scraped = await scrapeMeta(browser, url);
      const patch = buildPatch(doc, scraped, opts.policy);
      try {
        await sanityWriteClient.patch(doc._id).set(patch).commit();
        succeeded++;
      } catch (e) {
        errors.push(`${doc._id}: ${(e as Error).message}`);
      }

      // F13: inter-request delay (skip on last iteration)
      if (i < docs.length - 1) {
        await new Promise(resolve => setTimeout(resolve, INTER_REQUEST_DELAY_MS));
      }
    }
  });

  await recordMigration({
    collectionSlug: opts.collectionSlug,
    sourceItemCount: docs.length,
    migratedItemCount: succeeded,
    status: errors.length === 0 ? 'complete' : 'failed',
    errorLog: errors,
  });
}
```

**Write pattern (F4, F5 from audit):**

`buildPatch()` constructs the patch object structurally — `needsReview` is OMITTED when false (never overwrites prior `true`); `metaTitle` is OMITTED when null/empty (verifier catches it; never writes ambiguous empty string):

```typescript
type DescriptionPathUsed = 'live-scrape' | 'snippetForMeta-copy' | 'never-touch' | 'no-write';

function buildPatch(doc: SanityDoc, scraped: ScrapedMeta, policy: FieldPolicy): Record<string, unknown> {
  const normalised = normaliseMeta({ rawTitle: scraped.rawTitle, rawDescription: scraped.rawDescription });
  const patch: Record<string, unknown> = {};
  let descriptionPath: DescriptionPathUsed = 'no-write';

  // metaTitle — F5: never write empty string. If null, leave field undefined.
  if (normalised.metaTitle) {
    patch.metaTitle = normalised.metaTitle;
    patch.metaTitleSource = { provider: 'live-scrape', scrapedAt: scraped.scrapedAt, url: scraped.url };
  }

  // metaDescription — depends on policy
  if (policy.description === 'never-touch') {
    descriptionPath = 'never-touch';
    // Explicitly do nothing — neither write metaDescription nor metaDescriptionSource
  } else if (policy.description === 'snippet-copy-else-scrape' && doc.metaDescription == null && doc.snippetForMeta) {
    // F8: route through truncateAtWord with assertion
    const truncated = truncateAtWord(doc.snippetForMeta, 160);
    if (truncated.length === 0 || truncated.length > 160) {
      throw new Error(`snippetForMeta truncation invalid for ${doc._id}: length=${truncated.length}`);
    }
    patch.metaDescription = truncated;
    patch.metaDescriptionSource = { provider: 'snippetForMeta-copy' };
    descriptionPath = 'snippetForMeta-copy';
  } else if (normalised.metaDescription) {
    patch.metaDescription = normalised.metaDescription;
    patch.metaDescriptionSource = { provider: 'live-scrape', scrapedAt: scraped.scrapedAt, url: scraped.url };
    descriptionPath = 'live-scrape';
  }

  // F4: needsReview is set ONLY when computed value is true. Never written false.
  // Omission preserves any prior `true` from CONTENT-1A/B/C.
  if (shouldFlagForReview(normalised, scraped, policy, descriptionPath)) {
    patch.needsReview = true;
  }

  return patch;
}

function shouldFlagForReview(
  normalised: NormaliseResult,
  scraped: ScrapedMeta,
  policy: FieldPolicy,
  descriptionPath: DescriptionPathUsed,
): boolean {
  if (scraped.status !== 200) return true;
  if (!normalised.metaTitle) return true;                              // title scrape failed
  if (descriptionPath === 'live-scrape' && !normalised.metaDescription) return true;  // description scrape failed
  if (descriptionPath === 'snippetForMeta-copy') return true;          // truncation may have cut mid-sentence
  if (normalised.warnings.length > 0) return true;                     // any normalisation warning
  return false;
}
```

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

**Six** new `content_migrations` rows total — one per in-scope `_type`. `bookACall`'s row records `metaTitle` scrape work only (description policy is `never-touch`).

### Step 6 — Image carryover scripts

**Image upload idempotency rule (F16 from audit) — applies to 6.1, 6.2, 6.3:**

If an image upload succeeds but the subsequent Sanity patch fails (network blip, token expiry), the image is uploaded to Sanity's asset store but the doc state is unchanged. On naive re-run, `uploadImage` uploads the same image again, accumulating orphaned assets. Three required guards on every image carryover script:

1. **Idempotency check before upload:** fetch the current doc; if the target field is already set, skip and continue.
2. **Same-commit set/unset:** `.set({field: asset}).unset(['webflowImageUrl']).commit()` — single transaction. Never `.set()` and `.unset()` in separate commits.
3. **On upload failure:** patch only `needsReview: true` and continue. Do not unset `webflowImageUrl` until the asset is successfully attached.

```typescript
const current = await sanityWriteClient.getDocument(doc._id);
if (current?.[targetField]?._ref) {
  console.log(`Skipping ${doc._id} — already uploaded`);
  continue;
}
const asset = await uploadImage(doc.webflowImageUrl);
if (!asset) {
  await sanityWriteClient.patch(doc._id).set({ needsReview: true }).commit();
  errors.push(`${doc._id}: upload failed`);
  continue;
}
await sanityWriteClient
  .patch(doc._id)
  .set({ [targetField]: asset })
  .unset(['webflowImageUrl'])
  .commit();
```

#### 6.1 `scripts/content/migrate-benefit-value-thumbnails.ts`

For each of the 9 `benefitValue` docs that have a populated `webflowImageUrl` and no `thumbnailImage`, apply the idempotency pattern above with `targetField = 'thumbnailImage'`.

Record one `content_migrations` row: `slug = 'image-carryover-benefit-values'`.

#### 6.2 `scripts/content/migrate-staff-benefit-icons.ts`

Identical pattern for the 6 `staffBenefit` docs with `targetField = 'icon'`. `slug = 'image-carryover-staff-benefits'`.

#### 6.3 `scripts/content/migrate-video-backup-image-retry.ts`

**Vacuous-success ordering (F20 from audit):** the control flow is:

1. Query: `*[_type == "video" && !defined(backupImage) && defined(webflowImageUrl)]`.
2. **If query returns 0 docs:** immediately call `recordMigration({slug: 'image-carryover-video-backup', sourceItemCount: 0, migratedItemCount: 0, status: 'complete', errorLog: []})` and return. The verifier expects 11 rows; an early return without recording fails verification.
3. **Else:** apply the idempotency pattern with `targetField = 'backupImage'`, then record migration row.

#### 6.4 `scripts/content/fix-video-embed-link-encoding.ts`

Same vacuous-success ordering as 6.3:

1. Query: `*[_type == "video" && mainVideoEmbedLink match "*&amp;*"]`.
2. **If query returns 0 docs:** record migration row with 0/0, return.
3. **Else:** patch each: `set({mainVideoEmbedLink: decodeHtmlEntities(doc.mainVideoEmbedLink)}).commit()`. Then record migration row.

`slug = 'video-embed-link-encoding-fix'`.

### Step 7 — Smoke-test cleanup

`scripts/content/cleanup-smoke-test-docs.ts`:

**Deletion safety rule (F11, F19 from audit):** All deletions in CONTENT-1D MUST use explicit `_id` only. Query-based deletions are forbidden — `name` and `slug` fields are mutable and non-unique; an editable field as a deletion key is a single-keystroke disaster waiting to happen.

A new shared helper `deleteByIdStrict()` enforces this:

```typescript
// In src/lib/content/migration-helpers.ts
export async function deleteByIdStrict(
  client: SanityWriteClient,
  id: string,
  expectedType: string,
): Promise<void> {
  const doc = await client.getDocument(id);
  if (!doc) throw new Error(`deleteByIdStrict: doc ${id} not found`);
  if (doc._type !== expectedType) {
    throw new Error(`deleteByIdStrict: ${id} expected type ${expectedType}, got ${doc._type}`);
  }
  console.log(`Deleting ${id} (${expectedType}, name="${doc.name ?? doc.slug?.current ?? '(no label)'}")`);
  await client.delete(id);
}
```

Add a CONVENTIONS.md rule (post-phase update): *"Migration scripts MUST use `deleteByIdStrict()` for all deletions. Query-based delete patterns (`*[name == ...]` then iterate) are forbidden — `_id` is the only acceptable deletion key."*

**Cleanup steps:**

1. **Identify the smoke-test tag's `_id`:** the brief assumes `_id` follows the `tag-{webflowId}` deterministic pattern from CONTENT-1A. To find it, run a one-shot read query (this is a discovery query, NOT a deletion query):
   ```groq
   *[_type == "tag" && name == "scaling-teams (SMOKE TEST)"]{_id, name, slug}
   ```
   This must return exactly 1 result. Print and confirm. If 0 or >1, halt.
2. The 3 known smoke-test docs to delete:
   - The smoke-test tag (`_id` from step 1; expected to start with `tag-` or be a smoke-test pattern)
   - `smoke-test-blog-category-scaling-teams` (`_type: blogCategory`)
   - `smoke-test-team-member` (`_type: teamMember`)
3. **Reference check:** for each of the 3 `_id`s, run `*[references($id)]` — if any results, halt with the referencing doc IDs printed. Do not delete.
4. **Production-tag sanity check (specific to the smoke-test tag deletion):** confirm a real `tag` document with `slug.current === "scaling-teams"` AND `name == "Scaling Teams"` (production category tag from CONTENT-1A) exists. This proves we're deleting the SMOKE TEST variant only, not the production tag. Halt if missing.
5. Delete each via `deleteByIdStrict(sanityWriteClient, id, expectedType)`.
6. Verify post-delete: confirm the 3 specific `_id`s no longer exist. Total CMS doc count remains 404 (smoke-test docs aren't real CMS content). Total smoke-test docs remaining: 2 (out-of-scope, flagged in `metadata.content_phase.smoke_test_docs_remaining`).

`slug = 'smoke-test-cleanup'`. Vacuous-success exception applies if smoke-test docs are already gone (idempotent re-run): record migration row with 0/0 and return.

### Step 8 — State transition

`scripts/content/complete-content-phase.ts`:

**Critical structural constraint (F2 from audit):** The verifier MUST throw a typed error on any failure (never return a boolean). The state-transition script MUST NOT wrap the verifier in try/catch — let the unhandled rejection propagate to Node's top-level handler so the process exits non-zero. The state transition is then structurally unreachable on verification failure:

```typescript
// scripts/content/complete-content-phase.ts
import { verifyContent1D } from './verify-content-1d';
import { sanityWriteClient } from '@/lib/content/sanity-write-client';
import { assertValidTransition } from '@/lib/content/migrations';

async function main() {
  if (!process.argv.includes('--confirm')) {
    console.error('Refusing to run without --confirm flag.');
    process.exit(1);
  }

  await verifyContent1D();   // F2: throws on failure → process exits non-zero → transition never happens
                             // DO NOT wrap in try/catch. Ever.

  await assertValidTransition('content_running', 'content_complete');

  await supabase.from('migrations').update({
    status: 'content_complete',
    current_phase: 'content_complete',
    metadata: {
      // ... existing metadata
      content_phase: {
        started_at: /* CONTENT-1A start_at from existing metadata if recorded, else null */,
        completed_at: new Date().toISOString(),
        total_cms_docs: 404,                // unchanged from CONTENT-1C — smoke-test docs were never real CMS content
        smoke_test_docs_remaining: 2,       // SCHEMA-1 left 5; CONTENT-1D deleted 3; pre-launch cleanup handles the remaining 2
        content_migrations_rows: /* count from query, expected 35 */,
        phases: ['CONTENT-1A', 'CONTENT-1B', 'CONTENT-1C', 'CONTENT-1D'],
      },
    },
  }).eq('id', migrationId);
}

main();   // unhandled rejection is intentional — propagates to Node top-level → exit non-zero
```

`npm run content:complete` — needs `-- --confirm`.

This step is a hard gate. If the verifier throws, the state remains `content_running` until the underlying issue is resolved. The `--confirm` flag gates **human intent**, not data correctness — the verifier is the correctness gate, and it is structurally unbypassable.

**Pre-launch follow-up flagged by this step:** the 2 remaining smoke-test docs (out of the original 5 from SCHEMA-1, minus the 3 deleted in CONTENT-1D) need to be cleaned up before MYGRATR-LAUNCH. Add to `CLAUDE.md` Tech Debt during post-phase update.

### Step 9 — Verifier

`scripts/content/verify-content-1d.ts`:

**Structural constraint (F2):** export `verifyContent1D()` as a function that throws on any failure. Never returns a boolean. The function collects all failures into an array and throws once at the end with all failures joined — this gives Seb a complete picture rather than fail-on-first.

```typescript
export async function verifyContent1D(): Promise<void> {
  const failures: string[] = [];

  // ... all checks push to failures
  // (each check is independent; do not short-circuit)

  if (failures.length > 0) {
    throw new Error(`Content-1D verification failed:\n${failures.map(f => `  - ${f}`).join('\n')}`);
  }
}
```

A separate CLI entrypoint script (`run-verify-content-1d.ts`) calls `verifyContent1D()` without try/catch — same pattern as Step 8. `npm run content:verify-1d` runs the CLI entrypoint.

**Hard-gate checks (each pushes to `failures` array on violation):**

1. **Meta coverage:** every `technology`, `service`, `customerStory`, `teamMember` doc has `metaTitle` AND `metaDescription` populated (defined, non-empty). Every `review` doc has `metaTitle` AND `metaDescription` populated. Every `bookACall` doc has `metaTitle` (description was already populated in 1B).
2. **Length compliance:** every populated `metaTitle` ≤ 60 chars; every populated `metaDescription` ≤ 160 chars.
3. **Per-field provenance (F21):** every in-scope doc has `metaTitleSource` set with `provider` field. Every in-scope doc except `bookACall` has `metaDescriptionSource` set with `provider` field. (`bookACall.metaDescriptionSource` is left undefined since description came from CONTENT-1B without provenance tracking.)
4. **Provider value sanity:** `metaTitleSource.provider` ∈ `{'live-scrape', 'placeholder'}`. `metaDescriptionSource.provider` ∈ `{'live-scrape', 'snippetForMeta-copy', 'placeholder'}` (no `'webflow-cms'` since that wasn't a write path in CONTENT-1D).
5. **Image carryovers:** zero `benefitValue` docs with `webflowImageUrl` set and `thumbnailImage` unset. Zero `staffBenefit` docs with `webflowImageUrl` set and `icon` unset. Zero `video` docs with `webflowImageUrl` set and `backupImage` unset.
6. **Encoding fix:** zero `video` docs whose `mainVideoEmbedLink` matches `*&amp;*`.
7. **Smoke-test cleanup (CONTENT-1D scope only):** the 3 specific in-scope smoke-test `_id`s no longer exist. **Note:** 2 other SCHEMA-1 smoke-test docs remain — verifier does NOT fail on these; pre-launch cleanup handles them.
8. **`content_migrations`:** 6 new meta rows + 4 carryover rows + 1 cleanup row = **11 new rows for CONTENT-1D**, all `status='complete'`, `parity_score=100`. Total CE rows post-1D = 35.
9. **State (called only when running CLI verifier post-Step-8):** `migrations.status === 'content_complete'`, `migrations.current_phase === 'content_complete'`, `metadata.content_phase` block exists with `total_cms_docs: 404` and `smoke_test_docs_remaining: 2`. Note: when called from `complete-content-phase.ts` (Step 8) BEFORE the state transition, this check is skipped — the verifier supports a `{skipStateCheck: boolean}` parameter for that purpose.

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
- `scripts/content/run-verify-content-1d.ts` (CLI entrypoint for the verifier)
- `src/lib/content/url-builder.ts`
- `src/lib/content/meta-scraper.ts`
- `src/lib/content/meta-normaliser.ts`
- `src/lib/content/meta-backfill-runner.ts`

### Modified

**Studio schemas (Step 0a — retroactive §7.2 application + split provenance):**
- `studio/schemas/documents/customer-story.ts` — add `source`, `generatedAt`, `needsReview`, `metaTitleSource`, `metaDescriptionSource`
- `studio/schemas/documents/team-member.ts` — same 5 fields
- `studio/schemas/documents/review.ts` — same 5 fields
- `studio/schemas/documents/book-a-call.ts` — same 5 fields
- `studio/schemas/documents/technology.ts` — already has §7.2 fields; add `metaTitleSource` + `metaDescriptionSource` only
- `studio/schemas/documents/service.ts` — already has §7.2 fields; add `metaTitleSource` + `metaDescriptionSource` only

**Zod twins:** match each schema modification with a corresponding update in `src/types/sanity/{type}.ts`. All new fields are optional. Add comment in each: *"// Pre-CONTENT-1D docs have source: undefined despite initialValue. See Finding F18."*

**Shared helpers:**
- `src/lib/content/migration-helpers.ts` — add `deleteByIdStrict()` (F11, F19)
- `src/lib/content/sanity-write-client.ts` — switch to `SANITY_MIGRATION_WRITE_TOKEN`; add runtime assertion against read token presence (F3, F14)

**Configuration:**
- `package.json` — 11 new npm scripts (one per migrator + verify + complete + verify-1d-prereqs)
- `.eslintrc.json` (or equivalent) — add `no-restricted-imports` rule for `scripts/**` and `src/lib/content/**` blocking `site/src/lib/sanity/*` and `@/lib/sanity/*` (F14)
- `.env.example` — document `SANITY_MIGRATION_WRITE_TOKEN` requirement (F3)

### Dependencies added
- `playwright` (runtime), `@playwright/test` not needed
- `npx playwright install chromium` as a one-off post-install step

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
| Webflow blocks the scraper (rate limit, bot detection) | Serial execution + custom UA + 1.5s inter-request delay (F13) + 20-minute hard abort gate (F1). Run in off-peak UTC hours. If blocked, runner writes failure row and `process.exit(1)` immediately. |
| Page meta is JS-rendered and DOMContentLoaded fires before meta is set | `waitUntil: 'domcontentloaded'` is conservative for Webflow (tested SSR for tech pages in audit). If a smoke-test of 5 URLs in dev shows empty meta despite live values, switch to `waitUntil: 'networkidle'`. |
| Step 0a schema expansion breaks existing docs | The §7.2 fields and provenance fields are all optional with defaults (`needsReview: false`, others null/undefined). Sanity does not require existing docs to backfill optional new fields on read. The 4 affected schemas are SCHEMA-1 documents already populated; verify in Studio after the deploy that existing docs render without errors. |
| Studio NOT deployed before scripts run (Seb sees stale schema) | F22: hard ordering gate. Studio deploys to production AND Seb confirms `needsReview` toggle is visible BEFORE Steps 5-7 run. Top-of-file comment in every meta script reiterates the gate. |
| `customerStory` slug `virgin` placeholder | F7: pre-scrape decision hook short-circuits before URL construction. Hardcoded patch with `provider: 'placeholder'` on both `metaTitleSource` and `metaDescriptionSource`. The live URL is never fetched. |
| Smoke-test docs have inbound references we didn't expect | Step 7 reference check halts the cleanup with the referencing doc IDs printed. Manual decision required (probably: rewrite the reference, then re-run cleanup). Do not delete despite references. |
| Smoke-test deletion targets wrong doc due to mutable `name`/`slug` | F11, F19: deletion uses `_id` only via `deleteByIdStrict()` which fetches and validates `_type` before deleting. Convention rule added to CONVENTIONS.md banning query-based deletes in migration scripts. |
| `snippetForMeta` for review is longer than 160 chars (max 300 per schema) | F8: route through `truncateAtWord(s, 160)` with a post-truncation assertion. Provider stays `snippetForMeta-copy`; warning logged in error_log. Set `needsReview: true` since truncation may have cut mid-sentence. |
| Patch silently overwrites prior `needsReview: true` to `false` | F4: `buildPatch()` structurally OMITS `needsReview` when computed value is false. Never written false. Idempotent re-runs preserve any prior `true`. |
| Empty string written for `metaTitle` on scrape failure | F5: when normalised value is null/empty, `metaTitle` is OMITTED from patch. Field stays undefined; verifier catches it; phase halts for manual resolution. Never writes ambiguous empty string. |
| Image upload succeeds but patch fails — orphaned asset accumulation | F16: idempotency check before upload (skip if target field already set); set/unset in same `.commit()`; on upload failure, only `needsReview: true` is patched (not `unset`). |
| Verifier failure bypassed by swallowed exception in state-transition script | F2: verifier throws on failure (never returns boolean); `complete-content-phase.ts` does NOT wrap in try/catch; unhandled rejection propagates to Node top-level → process exits non-zero → state transition unreachable. |
| Production token (`SANITY_API_TOKEN`) compromise leads to dataset destruction | F3: dedicated `SANITY_MIGRATION_WRITE_TOKEN` scoped to single dataset, minimum role. Read token must NOT be present in script env (runtime assertion). Token rotated post-1D. |
| Migration script imports site read client via `@/*` alias collision | F14: ESLint `no-restricted-imports` rule blocks `site/src/lib/sanity/*` and `@/lib/sanity/*` from `scripts/**` and `src/lib/content/**`. Runtime read-token-presence check provides last-line defence. |
| Pre-flight count query inflated by smoke-test doc → false halt | F9: all count queries use `&& !(_id match "smoke-test-*")` exclusion pattern (matches CONTENT-1C verifier). |
| Vacuous-success row missed → verifier fails on row count | F20: image carryover scripts 6.3, 6.4 explicitly write `recordMigration(0/0/complete)` BEFORE early return when query returns 0 docs. |
| `truncateAtWord()` returns empty string for whitespace-prefix input | F17: fallback to hard-slice trim if word-boundary trim is empty. Never returns empty for non-empty input. |
| Doc-count narrative drift (404 vs 401 vs other) | v1.0 audit caught this — v1.1 locks `total_cms_docs: 404` (smoke-test docs were never real CMS content) and tracks `smoke_test_docs_remaining` separately. |

---

## 8. Exit Criteria

All must hold before the phase is considered complete.

1. `migrations.status === 'content_complete'` and `current_phase === 'content_complete'` for the CE migration.
2. `metadata.content_phase` block populated with completion timestamp, doc count, smoke-test remaining count, phase list.
3. `npm run content:verify-1d` exits 0 (verifier throws nothing).
4. Every in-scope doc has its target meta fields populated OR `needsReview: true` flagged with reason logged in `content_migrations.error_log`.
5. Zero benefitValue / staffBenefit / video docs hold `webflowImageUrl` staging strings.
6. Zero video docs have `&amp;` in `mainVideoEmbedLink`.
7. **The 3 CONTENT-1D-scoped `smoke-test-*` docs are deleted; 2 SCHEMA-1 smoke-test docs remain and are tracked in `metadata.content_phase.smoke_test_docs_remaining = 2` for pre-launch cleanup.** (F10: this corrects the v1.1 wording which read "Zero smoke-test-* docs" — that was contradicted by every other section of the brief.)
8. `content_migrations` table holds 35 rows for the CE migration (24 prior + 11 new), all `status='complete'`, `parity_score=100`.
9. Branch `feat/content-1d` merged to `main` after post-phase context-file update.
10. `SANITY_MIGRATION_WRITE_TOKEN` rotation flagged in `CLAUDE.md` Tech Debt as a launch-checklist item.

---

## 9. Post-Phase Updates (Required Before Closing)

Apply the standard post-phase protocol from `CLAUDE.md`. In order:

1. **`CHANGELOG.md`** — one paragraph: 11 new content_migrations rows, ~177 meta fields backfilled via Playwright live scrape, image carryovers cleared, smoke-test docs deleted, `content_complete` reached. Note retroactive §7.2 schema expansion on 4 doc types.
2. **`PHASE_HISTORY.md`** — detailed record. Files created. Patterns established (live-scrape pattern, split per-field provenance pattern, `FieldPolicy` enum pattern, `deleteByIdStrict` pattern, structural verifier-throws pattern). Final doc counts. Any discoveries or surprises during execution.
3. **`CONVENTIONS.md`** — add new sections:
   - **"Live-Site Meta Backfill Pattern"** — Playwright + provenance split, brand-suffix strip, never-fabricate rule, 1.5s inter-request delay.
   - **"Deletion Safety Rule"** — *"Migration scripts MUST use `deleteByIdStrict()` for all deletions. Query-based delete patterns (`*[name == ...]` or `*[slug.current == ...]` then iterate-and-delete) are forbidden — `_id` is the only acceptable deletion key."*
   - **"Verifier-Throws Pattern"** — verifiers throw typed errors; state-transition scripts MUST NOT wrap in try/catch.
   - **"Token Scoping Rule"** — destructive operations require dedicated scoped tokens; runtime assertion against read-token presence required.
   - **"Path Alias Discipline"** — migration scripts import `sanityWriteClient` from `@/lib/content/sanity-write-client` only. ESLint `no-restricted-imports` enforces.
4. **`FEATURE_MAP.md`** — new section: "Content Migration — Meta Backfills (CONTENT-1D)" with files, scripts, npm commands, doc counts.
5. **`CLAUDE.md`** — update phase status table; mark CONTENT-1D complete; mark TEMPLATE-* the next phase. Update doc count: 404 CMS docs unchanged. Update `migrations.status` to `content_complete`. Add to Tech Debt: (a) `SANITY_MIGRATION_WRITE_TOKEN` rotation, (b) 2 remaining smoke-test docs for pre-launch cleanup.
6. **`SCHEMA.md`** — no DDL ran; no update needed unless `content_migrations` row count narrative is in the doc. Note: 4 Sanity schemas were retroactively extended (not a Supabase change).
7. **`REGISTRY.md`** — add 11 new scripts; add `metaTitleSource`/`metaDescriptionSource`/`source`/`generatedAt`/`needsReview` field references; add 11 new npm commands.

Then post-phase audit: fresh chat, load codebase, verify nothing broken.

---

## 10. Cross-Model Audit Targets

This phase warrants `preset:full` ($1.50, 5 models) because:
- Live web scraping with Sanity writes is a destructive-on-failure pattern
- The schema modifications (split provenance fields + retroactive §7.2 source-tracking) touch 6 doc types
- The `needsReview` liberality rule has follow-on implications for Seb's Studio queue size
- The state transition is the gate from CONTENT to TEMPLATE

Specific audit prompts to seed (if running another audit on v1.2):

- "Is the Step 0a schema expansion (adding `source`/`generatedAt`/`needsReview` + split provenance fields to 4 existing doc types that already have published content) safe? Will existing docs continue to render and publish without backfilling these new optional fields?"
- "Is the structural verifier-throws-no-try/catch pattern in `complete-content-phase.ts` safe? Are there any process-level handlers (e.g. unhandled rejection swallow) that could still bypass it?"
- "Is `waitUntil: 'domcontentloaded'` correct for Webflow templated pages, or is `networkidle` safer? Specifically for Technology pages with custom-code JSON-LD injection per AUDIT-1."
- "Is the URL construction in `urlForDoc()` complete? Are there any edge cases (URL encoding, slug-with-special-chars, redirect chains) it misses against the routing table in §10 of the schema decisions doc?"
- "Is the per-field provenance split (`metaTitleSource` + `metaDescriptionSource`) the right call vs single `metaSource` with explicit definition? Does it correctly serve audit/debugging needs without overcomplicating the schema?"
- "Is the 1.5-second inter-request delay sufficient for Cloudflare-fronted Webflow shared hosting, or should it be 2-3 seconds with retry-with-backoff on 429?"
- "Is the `deleteByIdStrict()` helper sufficient as a guard against deletion errors, or should it require an additional confirmation flag for delete operations?"

---

## 11. Estimated Runtime

- Step 0 pre-flight + token setup: 2 min
- Step 0a schema additions + Studio production deploy + Seb confirmation: 15-30 min (includes Seb-availability wait)
- Step 1 URL list construction + tests: 30s
- Step 2 Playwright scrape (~200 URLs, serial, ~3-4s each + 1.5s inter-request delay): **~15 minutes**
- Step 3, 5 normalisation + Sanity writes: ~30s (writes are ~50ms each)
- Step 6 image carryovers (16 uploads): ~30s
- Step 7 smoke-test cleanup: 5s
- Step 8 state transition: 5s
- Step 9 verifier: 10s

**Total: ~35-50 minutes wall-clock (including Seb deploy-confirmation wait), ~20 minutes pure execution.**

**Hard abort gate:** if Step 2 scrape exceeds 20 minutes wall-clock, `meta-backfill-runner.ts` writes a failure `content_migrations` row and calls `process.exit(1)`. Re-run is safe — writes are idempotent patches. Investigate Webflow rate-limiting / DNS / CDN before re-running.

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

*End of MYGRATR-CONTENT-1D_BRIEF_v1.2.md*

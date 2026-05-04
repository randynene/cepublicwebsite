# MYGRATR-CONTENT-1C — Blog, CompareBlog, Technology, Service, CustomerStory Migration
## Session Brief v1.2

> **Executor:** Claude Code
> **Planner sign-off:** Jake Hall
> **Preset:** `preset:quick` — cross-model audit COMPLETE
> **Branch:** `feat/content-1c` (branch from main after CONTENT-1B merge) → merge to main on completion
> **State machine transition:** `content_running` remains — no transition this session. Reconcile with CLAUDE.md before execution — if CLAUDE.md says `content_complete` fires with CONTENT-1C, update CLAUDE.md to match this brief (fires after CONTENT-1D).

**v1.2 changes from v1.1 (cross-model audit fixes):**
- Step 0a: `Promise.all` → `Promise.allSettled` for inline image uploads (Finding 1)
- Step 0a: `<figure>` deserializer must check for `<img>` child before processing — skip iframe-in-figure (Finding 2)
- Step 0a: Normalize image src URLs identically in both passes (use JSDOM in Pass 1 too, or decode entities before map insertion) to prevent entity-encoding mismatch (Finding 3)
- Step 0a: `toPortableText()` must null-guard at entry: if input is null/undefined/empty string, return `[]` (Finding 5)
- Steps 4/5: All `uploadImage()` calls in fold packing must be explicitly `await`ed (Finding 4)
- Step 2: Date parsing uses regex `YYYY-MM-DD` prefix extraction, not `new Date()` (Finding 12)
- Step 2: FAQ loop explicitly 1-indexed (`for i = 1; i <= 6`) (Finding 13)
- All array `_key` values use deterministic patterns, not random generation (Finding 14)
- Step 2 pre-flight slug check extended to all 8 collections (7 blog + compareBlog) (Finding 11)
- Step 5: `fetchOptionIdMap` calls hoisted outside item loop (Finding 9)
- Step 3: Explicit competitor extraction patterns with separate regexes (Finding 10)
- Step 3: Explicit note — compareBlog payload must NOT include `category` field (Finding 18)
- All ref ID extraction validated against `/^[a-f0-9]{24}$/i` before constructing `_ref` (Finding 19)
- Step 7: Count queries exclude `_id match "smoke-test-*"` (Finding 17)
- Supabase tracking enforced as 11 individual rows (1 per source collection) (Finding 16)

**v1.1 changes from v1.0:**
- `_id` format corrected to `{type}-{webflowItemId}` (not `{type}-{slug}`)
- Reference resolution simplified to direct ID construction (no lookup maps)
- Blog category resolution uses `resource-category` ref directly (static map removed)
- customerStory source tracking fields removed (schema has no `source`/`generatedAt`/`needsReview`)
- Step 0 added: `toPortableText()` inline image upgrade + shared helper consolidation
- Technology fold 3 slugs corrected (`focus-3-title`/`focus-3-blurb`, not `focus-us-3-*`)
- Technology two-pass removed (single pass — `associated-technologies` is 0% fill)
- Technology fold 3 item-1 filter fixed (include if header OR description populated)
- CustomerStory quote packing fixed (pack quote even when content is empty)
- VideoLink HTML entity decode added
- Smoke-test blogCategory added to carryover cleanup

---

## 0. READ FIRST

Before writing a single line of code:

1. Read `CLAUDE.md` — confirm `migrations.status = content_running` for CE row. If not, STOP.
2. Read `CONVENTIONS.md` — all patterns apply in full.
3. Read `docs/WEBFLOW_TO_SANITY_FIELD_MAP.md` §1–5 — field-level mapping for every collection in this session. **WARNING:** The field map has known slug errors corrected in this brief's §2. When the field map and this brief disagree, this brief wins.
4. Read `docs/MYGRATR_SCHEMA_DESIGN_DECISIONS.md` §3.1 (blogPost), §3.2 (compareBlog), §3.4 (technology), §3.5 (service), §3.6 (customerStory).
5. Read `src/lib/content/migration-helpers.ts` — reuse all existing helpers. Do NOT rebuild (except the `toPortableText()` upgrade in Step 0).
6. Read `src/lib/content/ce-collection-ids.ts` — verify all 11 collection IDs from §1 are registered. Add any missing ones.

**Existing infrastructure (reuse — do not rebuild):**
- `src/lib/content/sanity-write-client.ts`
- `src/lib/content/webflow-read-client.ts`
- `src/lib/content/migration-tracker.ts`
- `src/lib/content/ce-collection-ids.ts`
- `src/lib/content/migration-helpers.ts` — `toPortableText`, `extractUrl`, `uploadImage`, `toRefs`, `extractOption`, `webflowSlug`, `fetchOptionIdMap` (note: `fetchOptionIdMap` currently exists as local duplicates in migrate-videos.ts and migrate-benefit-values.ts — Step 0 lifts it to shared)

**`_id` convention (established in CONTENT-1A/1B — do not deviate):**
All migrated Sanity documents use `_id` format `{camelCaseType}-{webflowItemId}` where `webflowItemId` is the 24-char hex Webflow ObjectId. Examples: `tag-68a75e19d65515279312ee66`, `teamMember-674ef9cbeb71924c1a61764e`, `blogCategory-67459d1ec447fee5445b6d20`.

**Reference resolution pattern (established in CONTENT-1A/1B):**
To reference a migrated Sanity document from a Webflow reference field, construct `_ref` directly: `{targetType}-{webflowRefId}`. No lookup maps needed. Example: if a blog's `author-2` field returns Webflow ID `674ef9cbeb71924c1a61764e`, the Sanity ref is `{ _type: 'reference', _ref: 'teamMember-674ef9cbeb71924c1a61764e' }`.

---

## 1. SCOPE

This phase migrates **5 Sanity document types from 11 Webflow source collections** — 269 items total.

| # | Sanity type | Source collection | Webflow collection ID | Items | Complexity |
|---|---|---|---|---|---|
| 1a | `blogPost` | Blogs & Guides | `67459ce1ce88de64c07213a7` | 31 | MEDIUM |
| 1b | `blogPost` | Staff Augmentation Blogs | `68f65c9a068e55b032b196ab` | 28 | MEDIUM |
| 1c | `blogPost` | Nearshoring & Offshoring Blogs | `68f65d73dbe40dd7e103ef15` | 13 | MEDIUM |
| 1d | `blogPost` | Scaling Teams Blogs | `68f65dbd5dfc1bedb4edb50b` | 9 | MEDIUM |
| 1e | `blogPost` | Hiring Tips Blogs | `68f65d2c0e71fdbba5046b0e` | 7 | MEDIUM |
| 1f | `blogPost` | Managing Engineers Blogs | `68f65d86e9f1630e92f762ec` | 7 | MEDIUM |
| 1g | `blogPost` | AI in Software Development Blogs | `68f65dd531a77bd2a3936581` | 3 | MEDIUM |
| 2 | `compareBlog` | Compare Blogs | `68d2ef79fb8136fee577c68e` | 29 | MEDIUM |
| 3 | `technology` | Technology Pages | `67bcf13e56583ba5581b1d38` | 101 | HIGH |
| 4 | `service` | Services | `6838a76ae8981810f6c2089b` | 23 | HIGH |
| 5 | `customerStory` | Customers / Customer Stories | `673a5beebf20965117eab8f4` | 18 | HIGH |

**Target: 269 Sanity documents, all parity_score = 100**

**Not in scope:**
- Meta backfills (metaTitle/metaDescription for technology, service, teamMember, review, bookACall) → CONTENT-1D
- CONTENT-1A/1B image upload carryovers (benefitValue thumbnails, staffBenefit icons, 1 video CDN retry) → CONTENT-1D
- CONTENT-1B video URL entity encoding fix → CONTENT-1D
- Smoke-test doc cleanup → pre-launch
- Author assignment for blogPost/compareBlog where author is null → Seb in Studio post-migration

---

## 2. FIELD SLUG SWEEP — VERIFIED DISCREPANCIES

Cross-referenced CE_SITE_TRUTH.md against live Webflow API responses (April 2026). Every slug below is verified against actual API payloads.

### 2.1 All 7 Blog Collections

**Author field slug is `author-2`, NOT `author`.**
All 7 blog collections return `author-2` as the API slug for the author Reference field.

**Date field type is `DateTime`, not `Date`.**
Migration script should parse as ISO datetime and output as Sanity `date` (YYYY-MM-DD) — strip time component.

**All other blog field slugs confirmed:** `thumbnail-image`, `open-graph-wide-image`, `tldr-section`, `content`, `resource-category`, `tags`, `meta-title`, `meta-description`, `featured`, `resource-description`, `faq-title-1`..`faq-title-6`, `faq-content-1`..`faq-content-6`, `name`, `slug`.

**Inline image prevalence:** 26% of Blogs & Guides (8/31) contain `<img>` tags in the `content` field. Extrapolated to ~25-30 inline images across the full 98-item blog corpus. `toPortableText()` upgrade in Step 0 is required to avoid silent data loss.

### 2.2 Compare Blogs

**Tags field slug is `tags-2`, NOT `tags`.**
References `Tags >> Alternatives`. Different from regular blogs which use `tags`.

**Author field slug is `author-2`, NOT `author`** — same as blogs.

**No `resource-category` field.** Compare Blogs have 25 fields; `resource-category` is not among them. compareBlog has no category reference.

**All other compare blog slugs match the blog pattern.**

### 2.3 Technology Pages — VERIFIED SLUG TABLE

The Technology Pages collection uses chaotic field slugs with no consistent naming pattern. This table is verified against live API responses. **Use these exact slugs — do not construct patterns.**

**Non-fold fields:**

| Display name | API slug | Population (of 101) | Maps to |
|---|---|---|---|
| Developer Name | `technology-name` | 100 | `technologyName` |
| Short Label | `short-description` | 101 | `shortLabel` |
| Order | `order` | varies | `order` |
| List Item Only | `list-item-only` | varies | `listItemOnly` |
| Tech Logo | `tech-logo` | varies | `techLogo` |
| Thumbnail | `thumbnail` | 0 | `thumbnail` |
| FAQ Schema | `faq-schema-2` | 5 | DROPPED |
| Associated Technologies | `associated-technologies` | 0 | `associatedTechnologies` (skip — no data) |
| Name | `name` | 101 | (system field) |
| Slug | `slug` | 101 | `slug.current` |

**Fold fields (verified slugs and population rates):**

| Fold | Role | API slug | Population |
|---|---|---|---|
| **Fold 1** | Header Pre | `header-blurb` | 100 |
| | Paragraph | `fold-1---paragraph` | 100 |
| | Bullet 1 | `section-1-label` | 100 |
| | Bullet 2 | `section-1-header` | 100 |
| | Bullet 3 | `section-1-description` | 100 |
| | Featured Image | `fold-1---featured-image` | 0 |
| **Fold 2** | Label | `focus-1-title` | 100 |
| | Header | `focus-1-blurb` | 100 |
| | Paragraph | `fold-2---paragraph` | 100 |
| | Bullet 1 | `focus-2-title` | 100 |
| | Bullet 2 | `focus-2-blurb` | 100 |
| | Bullet 3 | `focus-3-title` | 100 |
| **Fold 3** | Label | `focus-3-title` | 100 |
| | Header | `focus-3-blurb` | 100 |
| | Item 1 Header | `fold-3---item-1-header` | 0 |
| | Item 1 Description | `fold-3---item-1-description` | 100 |
| | Item 2-6 Header | `fold-3---item-{N}-header` | 100 |
| | Item 2-6 Description | `fold-3---item-{N}-description` | 100 |
| **Fold 4** | Label | `fold-4---label` | 0 |
| | Header | `fold-4---header` | 0 |
| **Fold 5** | Label | `fold-5---label` | 100 |
| | Header | `fold-5---header` | 100 |
| | Description | `fold-5---description` | 100 |
| | Bullet 1/2/3 | `fold-5---bullet-{N}` | 100 |
| **Fold 6** | Label | `fold-6---label` | 44 |
| | Header | `fold-6---header` | 44 |

**NOTE on fold 2 / fold 3 slug overlap:** `focus-3-title` appears in BOTH fold 2 (as "Bullet 3") and fold 3 (as "Label"). This is the same field — it serves double duty. The migrator reads it once; it goes into fold 2 bullets AND fold 3 label. This is how the Webflow template was built.

**NOTE on the 1 outlier item:** One technology item (100 vs 101 on most fields) is missing all fold content and `technology-name`. Migrator should handle gracefully: empty `folds` array, fall back to `name` for `technologyName`, set `needsReview: true`.

### 2.4 Services — VERIFIED

**`short-label` NOT `short-description`.**
The field map says `short-description`. The API returns `short-label`. Different from Technology which uses `short-description`.

**Fold 2 Paragraph is `fold-2---paragraph-2`** (trailing `-2`), NOT `fold-2---paragraph`.

**Type and Prefix fields return Option IDs, not string values.**

Type option IDs:
- `e65d0cf07ca57468720af519be368349` → `staffAugmentation`
- `d087a0a41606a705a43030a0ecc2f35b` → `productBuilds`
- `5366828a84793dd582697f1bc0fd19c3` → `consultingServices`

Prefix option IDs:
- `c78e22c58a9af1f506af55fed0ff4011` → `hire`
- `1cd523f050224f6c79b856e1b797be28` → `build`
- `4fa71c045ab6f3940bf783413020e219` → `expert`
- `7b115bb333dd0d7faf4db96ffde91925` → `endToEnd`

**`thumbnail` has 0% fill rate.** Still migrate the field — expect null on every item.

**Service fold slugs are consistent** (unlike Technology): `fold-N---label`, `fold-N---header`, `fold-N---paragraph` (except fold 2: `fold-2---paragraph-2`), `fold-N---bullet-N`, `fold-N---featured-image`, `fold-N---item-N-header`, `fold-N---item-N-description`.

**All other service slugs confirmed:** `type`, `order`, `ai-offering`, `location`, `prefix`, `associated-technologies`, `name`, `slug`.

### 2.5 Customer Stories — VERIFIED

**`name` → `companyName`, `customer-story-title` → `customerStoryTitle`.**
CE_SITE_TRUTH field #33 `name` has display name "Company name". Separate field #9 `customer-story-title` maps to `customerStoryTitle`.

**Switch field slug corrections:**
- `feature-in-home-page-header-scrolls` (NOT `feature-in-home-header`)
- `feature-in-featured-customers-section` (NOT `feature-in-featured-customers`)
- `featured-on-cs-page` (NOT `featured-on-customer-stories-page`)

**VideoLink field shape:**
`video-testimonial-if-available` returns a VideoLink object:
```json
{
  "url": "https://player.vimeo.com/video/...?h=...&amp;title=0&amp;...",
  "metadata": { "html": "...", "type": "video", "title": "...", ... }
}
```
Extract `.url` and decode HTML entities (`&amp;` → `&`).

**Content field slug corrections:**
- `the-problem-content` (note `the-` prefix)
- `the-solution-content`
- `the-impact-content`
- `the-customer-content`

**Quote field slugs use triple-dash:**
- `problem-quote---paragraph`, `problem-quote---person-image`, `problem-quote---person-name`, `problem-quote---person-title`
- Same pattern for `solution-quote---*` and `impact-quote---*`

**`video-testimonial-intro-content`** (NOT `video-intro-content`).

**Fill rate reality (verified across all 18 items):**
- Only 3/18 have full problem+solution+impact narratives with quotes
- 4/18 have impact-quote only (no content)
- 11/18 have none of these fields populated

---

## 3. COLLECTION ID REGISTRY UPDATE

Add these to `src/lib/content/ce-collection-ids.ts`:

```typescript
// Blog collections (7 → blogPost)
BLOGS_AND_GUIDES: '67459ce1ce88de64c07213a7',
STAFF_AUGMENTATION_BLOGS: '68f65c9a068e55b032b196ab',
NEARSHORING_OFFSHORING_BLOGS: '68f65d73dbe40dd7e103ef15',
SCALING_TEAMS_BLOGS: '68f65dbd5dfc1bedb4edb50b',
HIRING_TIPS_BLOGS: '68f65d2c0e71fdbba5046b0e',
MANAGING_ENGINEERS_BLOGS: '68f65d86e9f1630e92f762ec',
AI_SOFTWARE_DEV_BLOGS: '68f65dd531a77bd2a3936581',

// Compare Blogs
COMPARE_BLOGS: '68d2ef79fb8136fee577c68e',

// Technology Pages
TECHNOLOGY_PAGES: '67bcf13e56583ba5581b1d38',

// Services
SERVICES: '6838a76ae8981810f6c2089b',

// Customer Stories
CUSTOMER_STORIES: '673a5beebf20965117eab8f4',
```

---

## 4. EXECUTION STEPS

### Step 0: Infrastructure upgrades (BLOCKING — complete before any migration)

**0a. Upgrade `toPortableText()` to handle inline images.**

Current state: `toPortableText()` silently drops all `<img>` tags because the compiled schema only registers `block` type and no custom `<img>` deserialization rule exists. It also throws on null/undefined input.

Required changes to `src/lib/content/migration-helpers.ts`:

**0a-i. Null guard at entry point:**
```typescript
export function toPortableText(html: string | null | undefined): PortableTextBlock[] {
  if (!html || typeof html !== 'string' || html.trim() === '') return []
  // ... existing logic
}
```
This protects ALL call sites — customerStory empty fields, FAQ content, any future nullable RichText field.

**0a-ii. Register image type in compiled schema:**
```typescript
{ type: 'image', name: 'image', fields: [{ type: 'string', name: 'alt' }] }
```

**0a-iii. Two-pass inline image upload:**

Pass 1 — Extract and upload:
- Parse HTML with JSDOM (same parser as Pass 2 — this ensures src URLs are decoded identically in both passes, avoiding entity-encoding mismatch where regex extracts `&amp;` but JSDOM returns `&`)
- Find all `<img>` elements, collect their `src` attributes
- Upload via `Promise.allSettled(srcs.map(uploadImage))` — NOT `Promise.all`. A single broken CDN URL must not abort the entire document.
- Build `src → assetRef` map from fulfilled results only. Log warnings for rejected uploads.

```typescript
const doc = new JSDOM(html).window.document
const imgEls = doc.querySelectorAll('img')
const srcs = [...imgEls].map(img => img.getAttribute('src')).filter(Boolean) as string[]

const results = await Promise.allSettled(srcs.map(src => uploadImage(src)))
const srcToAssetRef = new Map<string, string>()
srcs.forEach((src, i) => {
  const r = results[i]
  if (r.status === 'fulfilled' && r.value) {
    srcToAssetRef.set(src, r.value)
  } else {
    console.warn(`[toPortableText] Failed to upload inline image: ${src}`)
  }
})
```

Pass 2 — Deserialize with pre-built map:
- Add `<img>` rule: look up `src` in `srcToAssetRef`, emit image block if found, skip if not
- Add `<figure>` rule with explicit `<img>` child guard:

```typescript
{
  deserialize(el, next, block) {
    if (el.tagName === 'FIGURE') {
      const img = el.querySelector('img')
      if (!img) return undefined  // iframe-in-figure (Vimeo embeds) — skip entirely
      const src = img.getAttribute('src') ?? ''
      const assetRef = srcToAssetRef.get(src)
      if (!assetRef) return undefined  // upload failed — skip rather than emit broken ref
      const caption = el.querySelector('figcaption')?.textContent ?? undefined
      return block({
        _type: 'image',
        asset: { _type: 'reference', _ref: assetRef },
        ...(caption ? { caption } : {}),
      })
    }
    if (el.tagName === 'IMG') {
      const src = el.getAttribute('src') ?? ''
      const assetRef = srcToAssetRef.get(src)
      if (!assetRef) return undefined  // upload failed — skip
      const alt = el.getAttribute('alt') ?? undefined
      return block({
        _type: 'image',
        asset: { _type: 'reference', _ref: assetRef },
        ...(alt ? { alt } : {}),
      })
    }
    return undefined
  }
}
```

**Key safety properties:**
- `Promise.allSettled` ensures one broken image doesn't abort the document (Finding 1)
- `<figure>` rule checks for `<img>` child before processing — iframe-in-figure is skipped (Finding 2)
- Both passes use JSDOM for src extraction — no entity-encoding mismatch (Finding 3)
- Null guard at entry point protects all callers (Finding 5)

**Test:** Run the upgraded function against the "Peer Forums" blog content (3 `<img>` tags, 5 `<figure>` tags — 2 of which are iframe embeds). Verify: 3 image blocks emitted with valid asset refs, 2 iframe figures skipped, no crashes. Also test with `null` input → expect `[]`.

Git commit: `fix(content): toPortableText inline image support with null guard`

**0b. Lift `fetchOptionIdMap` and `resolveOption` to shared helpers.**

Move from `scripts/content/migrate-videos.ts` into `src/lib/content/migration-helpers.ts`. Export both. Delete the duplicate in `scripts/content/migrate-benefit-values.ts` and update that script's import.

Signatures:
```typescript
export async function fetchOptionIdMap(
  collectionId: string,
  fieldSlug: string,
): Promise<Record<string, string>>  // { optionId: optionDisplayName }

export function resolveOption(
  optionId: unknown,
  idToName: Record<string, string>,
  enumMap: Record<string, string>,
  fieldName: string,
  itemId: string,
): string | null
```

Git commit: `refactor(content): lift fetchOptionIdMap and resolveOption to shared helpers`

**0c. Add `decodeHtmlEntities` helper.**

Add a simple utility to decode `&amp;` → `&`, `&lt;` → `<`, etc. in extracted URLs. Used for VideoLink URL extraction.

```typescript
export function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}
```

Git commit: `feat(content): add decodeHtmlEntities helper`

### Step 1: Branch and verify

1. `git checkout main && git pull`
2. `git checkout -b feat/content-1c`
3. Verify `migrations.status = content_running` in Supabase
4. Add all 11 collection IDs to `ce-collection-ids.ts`
5. **API verification:** Fetch one item from each of the 11 collections via Webflow API. Log the response field keys. Compare against the slug sweep in §2. If ANY field slug doesn't match, STOP and report the discrepancy before proceeding.
6. Git commit: `feat(content-1c): register collection IDs and verify API slugs`

### Step 2: Migrate blogPost (98 items from 7 collections)

**Script:** `scripts/content/migrate-blog-posts.ts`

**Blog collection iteration order:**
```typescript
const BLOG_COLLECTIONS = [
  { id: '67459ce1ce88de64c07213a7', name: 'Blogs & Guides' },
  { id: '68f65c9a068e55b032b196ab', name: 'Staff Augmentation Blogs' },
  { id: '68f65d73dbe40dd7e103ef15', name: 'Nearshoring & Offshoring Blogs' },
  { id: '68f65dbd5dfc1bedb4edb50b', name: 'Scaling Teams Blogs' },
  { id: '68f65d2c0e71fdbba5046b0e', name: 'Hiring Tips Blogs' },
  { id: '68f65d86e9f1630e92f762ec', name: 'Managing Engineers Blogs' },
  { id: '68f65dd531a77bd2a3936581', name: 'AI in Software Development Blogs' },
]
```

**Pre-flight slug check:** Before writing any documents, fetch all slugs from **all 8 collections** (7 blog + compareBlog). Check for duplicates across the combined set. If any slug collision is found, STOP and report. Also query Sanity for existing `blogPost` and `compareBlog` slugs to catch collisions with prior partial runs. All 7 blog collections consolidate into one Sanity type — duplicate slugs are a hard failure.

**Ref ID validation (apply to ALL reference fields in ALL steps):**
Every Webflow ref ID extracted from a reference or multiRef field must be validated against `/^[a-f0-9]{24}$/i` before constructing a `_ref`. If validation fails, log the raw value, set the ref to null, and set `needsReview: true`. Do not write malformed `_ref` values (e.g., `tag-[object Object]` or `tag-undefined`) to Sanity.

**Author field constant (apply to ALL blog and compareBlog scripts):**
```typescript
const AUTHOR_FIELD = 'author-2' as const  // NEVER fall back to 'author'
```

For each item:

1. Set `_id` to `blogPost-{item.id}` (Webflow item ID)
2. Set `_type` to `blogPost`
3. Map `name` → `title`
4. Set `slug.current` via `webflowSlug(item)`
5. Map `resource-category` → construct `_ref: 'blogCategory-{fieldValue}'` where fieldValue is the Webflow ref ID returned by the API. If `resource-category` is empty (shouldn't be — it's required), set `category: null` and `needsReview: true`
6. Map `tags` → for each Webflow ref ID in the multiRef array, validate against `/^[a-f0-9]{24}$/i`, then construct `{ _type: 'reference', _ref: 'tag-{refId}', _key: refId }` (deterministic key = Webflow ID of the referenced tag)
7. Map `author-2` → if populated, construct `{ _type: 'reference', _ref: 'teamMember-{refId}' }`. If empty, set `author: null` and `needsReview: true`
8. Map `date` (DateTime) → extract `YYYY-MM-DD` prefix via regex, NOT `new Date()` (avoids timezone shift):
   ```typescript
   function parseWebflowDate(raw: unknown): string | null {
     if (!raw || typeof raw !== 'string') return null
     const match = raw.match(/^(\d{4}-\d{2}-\d{2})/)
     return match ? match[1] : null
   }
   ```
9. Upload `thumbnail-image` → `thumbnailImage` via `uploadImage()`
10. Upload `open-graph-wide-image` → `openGraphImage` via `uploadImage()`
11. Convert `tldr-section` → `tldrSection` via `toPortableText()` (now handles inline images)
12. Convert `content` → `content` via `toPortableText()`
13. Map `resource-description` → `resourceDescription`
14. Map `featured` → `featured` (boolean)
15. Map `meta-title` → `metaTitle`
16. Map `meta-description` → `metaDescription`
17. Pack FAQs: loop `for (let i = 1; i <= 6; i++)` (1-indexed, inclusive). If `faq-title-${i}` is non-empty, create `{ _key: 'faq-${i}', question: faqTitle, answer: toPortableText(faqContent) }`. Skip empty pairs. Output as `faqs` array. `toPortableText` null-guards internally so null `faqContent` returns `[]`.
18. Set `source: 'imported'`, `needsReview` (true if no author, false otherwise), `locale: 'default'`
19. Write to Sanity via `createOrReplace`
20. Track in Supabase `content_migrations` table — **one row per source collection** (7 rows for the 7 blog collections). Each row must have its own `collection_slug`, `source_item_count`, `migrated_item_count`, and `parity_score`. Do NOT aggregate into a single "blogs-consolidated" row.

Git commit after each collection or after all 98 if latency is reasonable.

### Step 3: Migrate compareBlog (29 items)

**Script:** `scripts/content/migrate-compare-blogs.ts`

Identical structure to blogPost (Step 2) with these differences:

1. Set `_id` to `compareBlog-{item.id}`
2. Set `_type` to `compareBlog`
3. Map `tags-2` → construct refs as `tag-{refId}` for each (**corrected slug — `tags-2` not `tags`**). Use `_key: refId` (deterministic).
4. **No `resource-category` field** — compareBlog has no category reference. **Do NOT include a `category` field in the document payload.** If using a shared builder from blogPost, explicitly omit `category`. Post-migration check: `*[_type == "compareBlog" && defined(category)] | count` must be 0.
5. **Extract `competitor` from title:** Use separate regex patterns to avoid capture group index ambiguity:
   ```typescript
   function extractCompetitor(title: string): string | null {
     const patterns = [
       /Cloud Employee vs ([^—–|\n]+)/i,
       /([^—–|\n]+) vs Cloud Employee/i,
       /Cloud Employee Alternatives? to ([^—–|\n]+)/i,
     ]
     for (const pattern of patterns) {
       const match = title.match(pattern)
       if (match?.[1]) return match[1].trim()
     }
     return null
   }
   ```
   If extraction fails, set `competitor: null` and `needsReview: true`.
6. All other fields follow same mapping as blogPost (images, content, FAQs, meta, etc.)

Git commit: `feat(content-1c): migrate 29 compareBlog documents`

### Step 4: Migrate technology (101 items — SINGLE PASS)

**Script:** `scripts/content/migrate-technology.ts`

This is the most complex migration in CONTENT-1C due to the fold restructure. **Single pass — no second pass needed** (`associated-technologies` is 0% populated).

For each item:

1. Set `_id` to `technology-{item.id}`
2. Set `_type` to `technology`
3. Map `technology-name` → `technologyName`. If empty, fall back to `name`. Log the fallback.
4. Set `slug.current` via `webflowSlug(item)`
5. Map `short-description` → `shortLabel`
6. Map `order` → `order`
7. Map `list-item-only` → `listItemOnly`
8. Upload `tech-logo` → `techLogo` via `uploadImage()`
9. Upload `thumbnail` → `thumbnail` via `uploadImage()` (expect 0% fill — still attempt)

**Fold packing logic (CRITICAL — use exact API slugs from §2.3):**

**All `uploadImage()` calls MUST be `await`ed.** Assigning an unresolved Promise to a Sanity field will corrupt the document.

**All `_key` values MUST be deterministic** for idempotent re-runs: `fold-{n}` for folds, `fold-{n}-item-{m}` for items within folds.

```typescript
// Read focus-3-title once — used in fold 2 bullets AND fold 3 label
const focus3Title = item.fieldData['focus-3-title']

Fold 1 (headerIntro):
  _type = 'fold'
  _key = 'fold-1'
  type = 'headerIntro'
  header = item['header-blurb']
  paragraph = toPortableText(item['fold-1---paragraph'])
  bullets = [item['section-1-label'], item['section-1-header'], item['section-1-description']].filter(Boolean)
  featuredImage = await uploadImage(item['fold-1---featured-image'])  // 0% fill — still attempt

Fold 2 (featureBullets):
  _type = 'fold'
  _key = 'fold-2'
  type = 'featureBullets'
  label = item['focus-1-title']
  header = item['focus-1-blurb']
  paragraph = toPortableText(item['fold-2---paragraph'])
  bullets = [item['focus-2-title'], item['focus-2-blurb'], focus3Title].filter(Boolean)

Fold 3 (itemList):
  _type = 'fold'
  _key = 'fold-3'
  type = 'itemList'
  label = focus3Title     // same field as fold 2 bullet 3 — read once, used in both
  header = item['focus-3-blurb']
  items = [1,2,3,4,5,6].map(n => ({
    _key: `fold-3-item-${n}`,
    header: item[`fold-3---item-${n}-header`] || null,
    description: item[`fold-3---item-${n}-description`] || null,
  })).filter(i => i.header || i.description)   // NOTE: include if EITHER populated (item-1 has description only)

Fold 4 (headerOnly):
  _type = 'fold'
  _key = 'fold-4'
  type = 'headerOnly'
  label = item['fold-4---label']      // 0% fill — still attempt
  header = item['fold-4---header']    // 0% fill — still attempt
  // Will produce empty fold on all 101 items — presence check below will skip it

Fold 5 (paragraphSection):
  _type = 'fold'
  _key = 'fold-5'
  type = 'paragraphSection'
  label = item['fold-5---label']
  header = item['fold-5---header']
  paragraph = toPortableText(item['fold-5---description'])
  bullets = [item['fold-5---bullet-1'], item['fold-5---bullet-2'], item['fold-5---bullet-3']].filter(Boolean)

Fold 6 (headerOnly):
  _type = 'fold'
  _key = 'fold-6'
  type = 'headerOnly'
  label = item['fold-6---label']      // 44% fill
  header = item['fold-6---header']    // 44% fill
```

**Fold presence rule:** Only include a fold in the `folds[]` array if at least one meaningful field is populated (header, label, paragraph, any bullet, any item, featuredImage). Do NOT emit empty folds. Every fold object uses deterministic `_key: 'fold-{n}'` for idempotent re-runs.

**Outlier handling:** One item is missing all fold content and `technology-name`. If the folds array would be empty, set `folds: []` and `needsReview: true`. Do not throw.

10. `faq-schema-2` → DROPPED. Do not migrate.
11. `associated-technologies` → 0% populated. Read the field; if somehow populated, construct refs as `technology-{refId}`. Otherwise skip.
12. `metaTitle` / `metaDescription` → leave empty (BACKFILL in CONTENT-1D)
13. Set `source: 'imported'`, `needsReview: true` (all technology items need meta backfill), `locale: 'default'`
14. Write to Sanity, track in Supabase

Git commit: `feat(content-1c): migrate 101 technology documents`

### Step 5: Migrate service (23 items)

**Script:** `scripts/content/migrate-services.ts`

**Hoist option map fetches BEFORE the item loop (do NOT call inside the loop — Webflow rate limit):**
```typescript
const serviceTypeIdToName = await fetchOptionIdMap(SERVICE_COLLECTION_ID, 'type')
const prefixIdToName = await fetchOptionIdMap(SERVICE_COLLECTION_ID, 'prefix')
```

For each item:

1. Set `_id` to `service-{item.id}`
2. Set `_type` to `service`
3. Map `name` → `name`
4. Set `slug.current` via `webflowSlug(item)`
5. Map `type` → resolve via pre-fetched `serviceTypeIdToName` + static enum map:
   ```typescript
   const SERVICE_TYPE_MAP: Record<string, string> = {
     'Staff Augmentation': 'staffAugmentation',
     'Product Builds': 'productBuilds',
     'Consulting Services': 'consultingServices',
   } as const
   ```
   Use `resolveOption(item['type'], serviceTypeIdToName, SERVICE_TYPE_MAP, 'type', item.id)`
6. Map `prefix` → resolve via pre-fetched `prefixIdToName` + static enum map:
   ```typescript
   const PREFIX_MAP: Record<string, string> = {
     'Hire': 'hire',
     'Build': 'build',
     'Expert': 'expert',
     'End-to-End': 'endToEnd',
   } as const
   ```
7. Map `order` → `order`
8. Map `ai-offering` → `aiOffering`
9. Map `location` → `location`
10. Map `short-label` → `shortLabel` (**corrected slug — NOT `short-description`**)
11. Upload `thumbnail` → `thumbnail` (0% fill — still attempt)
12. Map `associated-technologies` → for each Webflow ref ID, validate against `/^[a-f0-9]{24}$/i`, then construct `{ _type: 'reference', _ref: 'technology-{refId}', _key: refId }` (deterministic key). These refs will resolve because technology was migrated in Step 4.

**Service fold packing (consistent naming — simpler than Technology):**

**Same rules as Technology: all `uploadImage()` calls MUST be `await`ed. All `_key` values deterministic.**

```
Fold 1 (headerIntro):
  _key = 'fold-1'
  header = item['fold-1---header-pre']
  paragraph = toPortableText(item['fold-1---paragraph'])
  bullets = [item['fold-1---bullet-1'], item['fold-1---bullet-2'], item['fold-1---bullet-3']].filter(Boolean)
  featuredImage = await uploadImage(item['fold-1---featured-image'])

Fold 2 (featureBullets):
  _key = 'fold-2'
  label = item['fold-2---label']
  header = item['fold-2---header']
  paragraph = toPortableText(item['fold-2---paragraph-2'])    // NOTE: trailing -2
  bullets = [item['fold-2---bullet-1'], item['fold-2---bullet-2'], item['fold-2---bullet-3']].filter(Boolean)
  featuredImage = await uploadImage(item['fold-2---featured-image'])

Fold 3 (itemList):
  label = item['fold-3---label']
  header = item['fold-3---header']
Fold 3 (itemList):
  _key = 'fold-3'
  label = item['fold-3---label']
  header = item['fold-3---header']
  items = [1,2,3,4,5,6].map(n => ({
    _key: `fold-3-item-${n}`,
    header: item[`fold-3---item-${n}-header`],
    description: item[`fold-3---item-${n}-description`]
  })).filter(i => i.header || i.description)

Fold 4 (headerOnly):
  _key = 'fold-4'
  label = item['fold-4---label']
  header = item['fold-4---header']

Fold 5 (paragraphSection):
  _key = 'fold-5'
  label = item['fold-5---label']
  header = item['fold-5---header']
  paragraph = toPortableText(item['fold-5---description'])
  bullets = [item['fold-5---bullet-1'], item['fold-5---bullet-2'], item['fold-5---bullet-3']].filter(Boolean)

Fold 6 (headerOnly):
  _key = 'fold-6'
  label = item['fold-6---label']
  header = item['fold-6---header']
```

Same fold presence rule and deterministic `_key` pattern as Technology.

13. `metaTitle` / `metaDescription` → leave empty (BACKFILL in CONTENT-1D)
14. Set `source: 'imported'`, `needsReview: true`, `locale: 'default'`
15. Write to Sanity, track in Supabase

Git commit: `feat(content-1c): migrate 23 service documents`

### Step 6: Migrate customerStory (18 items)

**Script:** `scripts/content/migrate-customer-stories.ts`

For each item:

1. Set `_id` to `customerStory-{item.id}`
2. Set `_type` to `customerStory`
3. Map `name` → `companyName` (**`name` is "Company name" per CE_SITE_TRUTH**)
4. Map `customer-story-title` → `customerStoryTitle`
5. Set `slug.current` via `webflowSlug(item)`
6. Map `order` → `order`
7. Map `feature-in-home-page-header-scrolls` → `featureInHomeHeader` (**corrected slug**)
8. Map `feature-in-featured-customers-section` → `featureInFeaturedCustomers` (**corrected slug**)
9. Map `featured-on-cs-page` → `featuredOnCustomerStoriesPage` (**corrected slug**)
10. Upload `company-logo` → `companyLogo`
11. Upload `company-product-image` → `companyProductImage`
12. Upload `company-people-image` → `companyPeopleImage`
13. Upload `thumbnail` → `thumbnail`
14. Map `video-testimonial-if-available` → extract `.url` from VideoLink object, decode HTML entities (`decodeHtmlEntities(field.url)`), store as `videoUrl`. If field is null, set `videoUrl: null`.
15. Convert `video-testimonial-intro-content` → `videoIntroContent` via `toPortableText()` (**corrected slug**)
16. Convert `tldr-content` → `tldrContent`
17. Convert `hiring-needs-table` → `hiringNeedsTable`
18. Convert `the-customer-content` → `theCustomerContent` (**note `the-` prefix**)

**Problem / Solution / Impact structured objects:**

For each of problem, solution, impact — pack INDEPENDENTLY. Do not gate quote on content presence. If content is empty but quote exists, still pack the object.

```typescript
// Example for 'problem' — repeat for 'solution' and 'impact'
const problemContent = toPortableText(item['the-problem-content'])
const problemQuoteParagraph = item['problem-quote---paragraph'] || null
const problemQuoteImage = item['problem-quote---person-image']
  ? await uploadImage(item['problem-quote---person-image'])
  : null
const problemQuoteName = item['problem-quote---person-name'] || null
const problemQuoteTitle = item['problem-quote---person-title'] || null

const hasAnyProblemData = problemContent?.length > 0
  || problemQuoteParagraph
  || problemQuoteImage
  || problemQuoteName

const problem = hasAnyProblemData ? {
  content: problemContent?.length > 0 ? problemContent : null,
  quote: (problemQuoteParagraph || problemQuoteImage || problemQuoteName || problemQuoteTitle)
    ? {
        paragraph: problemQuoteParagraph,
        personImage: problemQuoteImage,
        personName: problemQuoteName,
        personTitle: problemQuoteTitle,
      }
    : null,
} : null
```

19. Convert `cta-content` → `ctaContent`
20. Map `review-snippet-for-google-meta` → `reviewSnippetForMeta`
21. `video-url-2` → IGNORE (DROPPED per D5)
22. `metaTitle` / `metaDescription` → leave empty (BACKFILL in CONTENT-1D)
23. `openGraphImage` → leave empty (no Webflow source field)
24. Set `locale: 'default'`
25. **No `source`, `generatedAt`, `needsReview` fields** — customerStory schema does not have source tracking fields. Items needing attention (11 empty-shell stories, `/customer-story/virgin` placeholder) are tracked via console log output and the carryover table in §7 only — there is no in-Sanity flag for these.
26. Write to Sanity, track in Supabase

Git commit: `feat(content-1c): migrate 18 customerStory documents`

### Step 7: Verification (HARD GATE — do not merge until all checks pass)

1. **Count check (exclude smoke-test docs):** Query Sanity for each type:
   - `*[_type == "blogPost" && !(_id match "smoke-test-*")] | count` → expect 98
   - `*[_type == "compareBlog" && !(_id match "smoke-test-*")] | count` → expect 29
   - `*[_type == "technology" && !(_id match "smoke-test-*")] | count` → expect 101
   - `*[_type == "service" && !(_id match "smoke-test-*")] | count` → expect 23
   - `*[_type == "customerStory" && !(_id match "smoke-test-*")] | count` → expect 18

2. **Supabase tracking check:** Verify exactly **11 rows** in `content_migrations` for CONTENT-1C (7 blog collections + compareBlog + technology + service + customerStory). Each row must have `source_item_count == migrated_item_count` and `parity_score = 100`.

3. **Reference integrity spot-checks (3 items per type):**
   - blogPost: `category` ref resolves to a blogCategory doc, `tags[]` refs resolve, `author` ref resolves (where populated)
   - compareBlog: `tags[]` refs resolve (should be `tag-{id}` docs with `category == 'alternatives'`), `author` ref resolves. **Verify zero compareBlog docs have `defined(category)`.**
   - service: `associatedTechnologies[]` refs resolve to technology docs (where populated)

4. **Slug uniqueness:** `*[_type == "blogPost"].slug.current` — verify no duplicates across all 98 items.

5. **Inline image spot-check:** Open 2 blog posts known to have inline images (e.g., "Peer Forums" with 3 `<img>` tags). Verify images render in Sanity Studio's Portable Text preview.

6. **Fold structure spot-check:** Open 3 technology items in Sanity Studio. Verify folds render as typed blocks with correct content. Open 2 service items — same check.

7. **CustomerStory spot-checks:**
   - Open "Event Connections" (full narrative) — verify problem/solution/impact all have content + quotes
   - Open "SQR" (impact-quote only, no content) — verify impact object exists with quote but null content
   - Open an empty-shell story — verify no crash, fields are just empty

8. **Service option resolution:** Open 3 services in Studio. Verify `type` shows a valid enum value (not an option ID string).

9. **Short-label / short-description cross-check:** Verify at least 1 technology item has non-empty `shortLabel` AND at least 1 service item has non-empty `shortLabel`. This catches the swap bug where technology's `short-description` and service's `short-label` get confused.

Git commit: `feat(content-1c): verification pass complete`

### Step 8: Merge and log

1. `git push origin feat/content-1c`
2. Merge `feat/content-1c` to main
3. Log final counts to console

---

## 5. EDGE CASES AND TRAPS

### 5.1 Blog slug collisions across 7 collections
All 7 blog collections consolidate into one Sanity type. If "my-great-post" exists in both Blogs & Guides AND Staff Augmentation Blogs, the `_id` won't collide (different Webflow IDs) but the `slug.current` will. Pre-flight check in Step 2 catches this. If found, STOP.

### 5.2 Author fill rates are low
`author-2` fill rates across blog collections: 23% (Blogs & Guides), 25-33% (others). Most blogPost items will have `author: null`. This is expected and tracked as a MIGRATION BLOCK. Set `needsReview: true` on authorless items.

### 5.3 Technology fold type is position-driven, not data-driven
Unlike a generic CMS where fold type could vary per item, Technology Pages use a fixed template. Fold 1 is always `headerIntro`, fold 2 is always `featureBullets`, fold 3 is always `itemList`, fold 5 is always `paragraphSection`, fold 6 is always `headerOnly`. The fold type is determined by position, not by inspecting which fields are populated. **Do not use a heuristic — use the fixed mapping above.**

### 5.4 Technology fold 3 item-1 has no header
0/101 items have `fold-3---item-1-header` populated, but 100/101 have `fold-3---item-1-description`. The filter is `filter(i => i.header || i.description)` — not just `filter(i => i.header)`. Item-1 will have `{ header: null, description: "..." }`.

### 5.5 The `focus-3-title` double-duty field
`focus-3-title` is used as fold 2's third bullet AND fold 3's label. Read it once from the API, use it in both places. This is how the Webflow template was designed.

### 5.6 Service type/prefix Option ID resolution
If `resolveOption()` doesn't find a match, it logs a warning and returns null. Set the field to null + log the raw ID. Do not throw.

### 5.7 CustomerStory VideoLink extraction
The field returns `{ url: "...", metadata: {...} }`. Extract `.url` and run through `decodeHtmlEntities()`. If the field is null (65% of items), set `videoUrl: null`.

### 5.8 RichText content may contain Webflow-specific markup
The `toPortableText()` upgrade handles `<img>` tags. Other Webflow artifacts to watch for:
- Embedded Webflow component references (will become broken links in Portable Text — acceptable for now)
- Webflow-specific CSS classes in inline styles (stripped by block-tools — acceptable)
- `<figure>` wrapping iframes (embedly/Vimeo embeds) — these are NOT images and should NOT be uploaded. The `<img>` deserializer should only fire on `<img>` tags, not `<iframe>` inside `<figure>`.

### 5.9 One technology outlier
One item across 101 is missing `technology-name` and all fold content. Migrator should not throw — produce a minimal document with `technologyName` fallen back to `name`, empty `folds: []`, and `needsReview: true`.

---

## 6. EXECUTION ORDER SUMMARY

```
Step 0a: toPortableText inline image upgrade     → commit
Step 0b: Lift fetchOptionIdMap/resolveOption      → commit
Step 0c: Add decodeHtmlEntities helper            → commit
Step 1:  Branch, verify, register IDs             → commit
Step 2:  Migrate blogPost (98 items, 7 colls)     → commit(s)
Step 3:  Migrate compareBlog (29)                  → commit
Step 4:  Migrate technology (101, single pass)     → commit
Step 5:  Migrate service (23)                      → commit
Step 6:  Migrate customerStory (18)                → commit
Step 7:  Verification                              → commit
Step 8:  Merge and log                             → merge
```

**Total expected Sanity documents after CONTENT-1C: 158 (existing) + 269 (new) = 427**

---

## 7. OUTSTANDING CARRYOVERS (DO NOT FIX — LOG ONLY)

| Item | Source | Resolution |
|---|---|---|
| benefitValue.thumbnailImage uploads | CONTENT-1A | CONTENT-1D |
| staffBenefit.icon uploads | CONTENT-1A | CONTENT-1D |
| 1 video.backupImage CDN failure | CONTENT-1B | CONTENT-1D |
| CONTENT-1B video URL entity encoding (`&amp;`) | CONTENT-1B | CONTENT-1D |
| `scaling-teams` smoke-test tag doc | SCHEMA-1 | Pre-launch cleanup |
| `smoke-test-blog-category-scaling-teams` doc | SCHEMA-1 | Pre-launch cleanup |
| `smoke-test-team-member` doc | SCHEMA-1 | Pre-launch cleanup |
| Meta backfills (~180 fields) | SCHEMA-0 design | CONTENT-1D |
| Author assignment for all blogPost/compareBlog | D11 / §7.1 | Seb in Studio post-migration |
| `/customer-story/virgin` meta placeholder | §3.6 | CE to rewrite |
| 11/18 customerStory items with empty narratives | Live data | CE content debt — not a migration issue |

---

## 8. SUCCESS CRITERIA

- [ ] Step 0 infrastructure upgrades complete and tested before any migration runs
- [ ] 269 new Sanity documents created (98 blogPost + 29 compareBlog + 101 technology + 23 service + 18 customerStory)
- [ ] All 269 tracked in Supabase `content_migrations` with `parity_score = 100`
- [ ] All images uploaded as real Sanity assets — including inline images in RichText content
- [ ] All RichText fields converted to valid Portable Text with inline images preserved
- [ ] All cross-references (author, category, tags, associatedTechnologies) use deterministic `_id` construction and resolve correctly
- [ ] Zero slug collisions within any single document type
- [ ] Technology fold packing produces valid fold objects using exact verified API slugs
- [ ] Service type/prefix Option IDs resolved to correct camelCase enum values
- [ ] CustomerStory problem/solution/impact objects packed correctly (quote independent of content)
- [ ] CustomerStory videoUrl extracted from VideoLink object with HTML entities decoded
- [ ] Branch merged to main, pushed to origin

*End of MYGRATR-CONTENT-1C_BRIEF_v1.1.md*

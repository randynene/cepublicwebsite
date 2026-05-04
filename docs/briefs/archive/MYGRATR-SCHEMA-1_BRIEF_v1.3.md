# MYGRATR-SCHEMA-1 — Sanity Schema Design
## Session Brief v1.3

**Phase:** MYGRATR-SCHEMA-1  
**Status:** READY FOR BUILD  
**Preceded by:** MYGRATR-SCHEMA-0 (Schema Design Lock — Complete)  
**Followed by:** MYGRATR-SCAFFOLD-1 (Next.js Scaffold)  
**Audit preset:** `preset:full` ($1.50, 5 models) — schema-heavy phase  

---

## 1. WHAT THIS PHASE DOES

Translates the locked schema design document (`docs/MYGRATR_SCHEMA_DESIGN_DECISIONS.md` v1.2) into three concrete outputs:

1. **Sanity schema files** — one file per document type, under `studio/schemas/`, fully typed and organised per Sanity v3 conventions
2. **Zod validation types** — matching every Sanity schema, living in the Next.js app at `src/types/sanity/`
3. **Migration map document** — `docs/WEBFLOW_TO_SANITY_FIELD_MAP.md` — field-level mapping for every collection, consumed by CONTENT-1

**No architecture decisions are made in this phase.** Every decision is already in `docs/MYGRATR_SCHEMA_DESIGN_DECISIONS.md`. If Claude Code encounters an ambiguity not covered by the design doc or this brief: STOP and ask Jake. Do not improvise.

---

## 2. AUTHORITATIVE INPUTS

Read these files before writing a single line of code:

| File | Purpose |
|---|---|
| `docs/MYGRATR_SCHEMA_DESIGN_DECISIONS.md` v1.2 | The locked schema spec. This brief is a wrapper; the spec is the source of truth for every field. |
| `docs/CE_SITE_TRUTH.md` | CE site facts. Reference when the design doc points back to audit data. |
| `CONVENTIONS.md` | File naming, TypeScript patterns, import ordering. |
| `CLAUDE.md` | Repo structure, current phase, architecture rules. |

---

## 3. DELIVERABLES

### 3.1 Sanity schema files

**Location:** `studio/schemas/`  
**Sanity version:** v3 (use `defineType`, `defineField`, `defineArrayMember` — not the v2 object syntax)

**File structure:**

```
studio/
  schemas/
    index.ts                    ← schema registry (exports all types)
    documents/
      blog-post.ts
      compare-blog.ts
      technology.ts
      service.ts
      customer-story.ts
      team-member.ts
      review.ts
      video.ts
      download.ts
      download-access.ts
      tool.ts
      book-a-call.ts
      event.ts
      glassdoor-review.ts
      benefit-value.ts
      staff-benefit.ts
      blog-category.ts
      tag.ts
      industry.ts
      persona.ts
      location.ts
    singletons/
      home-page.ts
      about-us-page.ts
      how-it-works-page.ts
      contact-page.ts
      for-developers-page.ts
      retention-page.ts
      sourcing-page.ts
      embedding-page.ts
      scale-this-week-page.ts
      work-with-shawnee-page.ts
      start-hiring-page.ts
      not-found-page.ts
      privacy-policy-page.ts
      blog-hub.ts
      staff-augmentation-hub.ts
      nearshoring-offshoring-hub.ts
      scaling-teams-hub.ts
      hiring-tips-hub.ts
      managing-engineers-hub.ts
      ai-in-software-development-hub.ts
      videos-hub.ts
      tools-hub.ts
      downloads-hub.ts
      events-hub.ts
      services-hub.ts
      technology-hub.ts
      customer-stories-hub.ts
      reviews-hub.ts
      compare-hub.ts
      hiring-cost-calculator-page.ts
      price-comparison-calculator-page.ts
    globals/
      site-settings.ts
      navigation.ts
      footer.ts
    objects/
      fold.ts                   ← shared fold object (used by technology, service, industry, persona, location)
      section.ts                ← shared section object (used by static content singletons)
      faq-item.ts               ← {question, answer} reusable object
      quote-block.ts            ← {paragraph, personImage, personName, personTitle} used in customerStory
      portable-text.ts          ← base portable text field definition (reused by all richtext fields)
```

**`studio/schemas/index.ts` must export every schema in a flat array** per Sanity v3 conventions. Singletons need special handling in Studio — they must be registered in `sanity.config.ts` as well (see Step 6).

### 3.2 Zod types

**Location:** `src/types/sanity/`

```
src/
  types/
    sanity/
      index.ts                  ← re-exports all types
      documents/
        blog-post.ts
        compare-blog.ts
        technology.ts
        service.ts
        customer-story.ts
        team-member.ts
        review.ts
        video.ts
        download.ts
        download-access.ts
        tool.ts
        book-a-call.ts
        event.ts
        glassdoor-review.ts
        benefit-value.ts
        staff-benefit.ts
        blog-category.ts
        tag.ts
        industry.ts
        persona.ts
        location.ts
      singletons/
        home-page.ts
        about-us-page.ts
        how-it-works-page.ts
        contact-page.ts
        for-developers-page.ts
        retention-page.ts
        sourcing-page.ts
        embedding-page.ts
        scale-this-week-page.ts
        work-with-shawnee-page.ts
        start-hiring-page.ts
        not-found-page.ts
        privacy-policy-page.ts
        blog-hub.ts
        staff-augmentation-hub.ts
        nearshoring-offshoring-hub.ts
        scaling-teams-hub.ts
        hiring-tips-hub.ts
        managing-engineers-hub.ts
        ai-in-software-development-hub.ts
        videos-hub.ts
        tools-hub.ts
        downloads-hub.ts
        events-hub.ts
        services-hub.ts
        technology-hub.ts
        customer-stories-hub.ts
        reviews-hub.ts
        compare-hub.ts
        hiring-cost-calculator-page.ts
        price-comparison-calculator-page.ts
      globals/
        site-settings.ts
        navigation.ts
        footer.ts
      shared.ts                 ← Fold, Section, FaqItem, QuoteBlock, SanityImage, SanitySlug, SanityRef
```

**Zod schema rules:**
- Every Zod type mirrors its Sanity schema exactly
- Sanity `image` fields → `z.object({ asset: z.object({ _ref: z.string() }), alt: z.string().optional() })`
- Sanity `slug` fields → `z.object({ current: z.string() })`
- Sanity `reference` fields → `z.object({ _ref: z.string(), _type: z.literal('reference') })`
- Sanity `array[portableText]` fields → `z.array(z.unknown())` (Portable Text blocks are complex; type them as `unknown` for now, tighten in TEMPLATE-* when the renderer is built. This maintains `CONVENTIONS.md` strict no-`any` rule.)
- Fields are required by default in Zod — only use `.optional()` for fields marked optional in the design doc. Do NOT call `.required()` on individual field types (that is not valid Zod API).
- Export both the Zod schema and the inferred TypeScript type: `export type BlogPost = z.infer<typeof BlogPostSchema>`

### 3.3 Migration map document

**Location:** `docs/WEBFLOW_TO_SANITY_FIELD_MAP.md`

One section per Webflow collection. Each section is a table:

```markdown
## [Collection Name] → [Sanity document type]

| Webflow field | Webflow type | Sanity field | Sanity type | Notes |
|---|---|---|---|---|
| name | PlainText | title | string | Primary title — §7.13 rule |
| slug | Slug | slug.current | slug | Preserved exactly — D26 |
| ... | ... | ... | ... | ... |
```

**Also include:**

- A **DROPPED FIELDS** section per collection listing every field explicitly excluded and why (matching Section 9 of the design doc)
- A **NEW FIELDS** section per collection listing every field added in Sanity that has no Webflow source (e.g. added metaDescription fields — backfill required)
- A **MIGRATION BLOCKS** section at the bottom of the document listing any items flagged as blockers for launch (e.g. `/customer-story/virgin` placeholder meta description)

---

## 4. STEP-BY-STEP EXECUTION

Execute steps in order. Git commit after each step that produces working output.

### Step 0 — Transition migration status to `schema_running`

Before any code is written, transition the CE migration from `audit_complete` to `schema_running` using the state machine guard.

```typescript
// scripts/schema/start-schema-phase.ts
import { assertValidTransition } from '@/lib/pipeline/state-machine'
import { env } from '@/lib/env'

const ORG_ID = 'ce000000-0000-0000-0000-000000000001'
const MIGRATION_ID = 'ce000000-0000-0000-0000-000000000002'

assertValidTransition('audit_complete', 'schema_running')

await supabase
  .from('migrations')
  .update({ status: 'schema_running', current_phase: 'schema_running' })
  .eq('id', MIGRATION_ID)
  .eq('org_id', ORG_ID)
```

**Prerequisite check:** Before running this script, verify the Sanity Studio project exists:
- `studio/package.json` must exist (scaffolded in MYGRATR-0 or needs `npm create sanity@latest`)
- `studio/sanity.config.ts` must exist
- `studio/sanity.cli.ts` must exist
- `sanity` and `@sanity/client` must be installed
- If any of these are missing: initialize the Studio project first. Do NOT proceed with schema files until the Studio scaffolding is confirmed.

Also verify Sanity environment variables are in `src/lib/env.ts`:
- `SANITY_PROJECT_ID` (value: `lzbhll1u`)
- `SANITY_DATASET` (value: `production` — but seed/smoke scripts should verify this is the intended target before writing)
- `SANITY_API_TOKEN` (write token)

If these are not yet in `src/lib/env.ts`, add them as validated fields per the existing pattern.

**Commit:** `chore(schema): transition migration to schema_running, verify Studio prerequisites`

---

### Step 1 — Set up the schema directory structure

```bash
mkdir -p studio/schemas/documents
mkdir -p studio/schemas/singletons
mkdir -p studio/schemas/globals
mkdir -p studio/schemas/objects
mkdir -p src/types/sanity/documents
mkdir -p src/types/sanity/singletons
mkdir -p src/types/sanity/globals
```

Create placeholder `index.ts` files in each directory so the structure is committed.

**Commit:** `chore(schema): scaffold studio/schemas and src/types/sanity directory structure`

---

### Step 2 — Write shared object schemas first

These are consumed by multiple document types. Write them before anything that depends on them.

**Order:**

1. `studio/schemas/objects/portable-text.ts` — base Portable Text field definition
2. `studio/schemas/objects/faq-item.ts` — `{question: string, answer: portableText[]}`
3. `studio/schemas/objects/quote-block.ts` — `{paragraph, personImage, personName, personTitle}`
4. `studio/schemas/objects/fold.ts` — typed fold object per §3.4 of design doc:

```typescript
// fold type enum values: headerIntro, featureBullets, itemList, paragraphSection, headerOnly
// fold fields: type, label, header, paragraph (portableText), bullets (string[]), 
//              items ({header, description}[]), featuredImage
```

5. `studio/schemas/objects/section.ts` — polymorphic section object per §4.4 of design doc:

```typescript
// section variants: richTextSection, twoColumnSection, ctaSection, imageSection,
// videoSection, testimonialSection, benefitsGrid, staffBenefitsGrid, 
// glassdoorGrid, customerStoriesGrid, faqSection, hubspotFormSection
```

**CRITICAL: Read §4.4 of the design doc for the complete field specification of each section variant.** The full field list for all 12 variants is defined there. Do NOT create empty placeholder variants with only a `_type` field — each variant must have all its fields implemented per the spec.

**Export pattern:** Every schema file must use `export default defineType({...})`. The `index.ts` registry imports each default export and collects them into a `schemaTypes` array. Be consistent — do not mix default and named exports.

**Commit:** `feat(schema): add shared object schemas (fold, section, faq-item, quote-block, portable-text)`

---

### Step 3 — Write CMS document type schemas

Write one file per document type. Follow the field specs in `docs/MYGRATR_SCHEMA_DESIGN_DECISIONS.md` §3.1–§3.20 exactly.

**Order (simplest to most complex):**

1. `tag.ts` — simplest, no dependencies
2. `blog-category.ts` — no dependencies
3. `glassdoor-review.ts` — no dependencies
4. `benefit-value.ts` — no dependencies
5. `staff-benefit.ts` — no dependencies
6. `download-access.ts` — no dependencies
7. `team-member.ts` — no dependencies
8. `review.ts` — no dependencies
9. `video.ts` — references `tag`
10. `download.ts` — references `tag`
11. `book-a-call.ts` — no CMS dependencies
12. `event.ts` — references `tag`, `teamMember`
13. `tool.ts` — references `tag`
14. `compare-blog.ts` — references `tag`, `teamMember`
15. `blog-post.ts` — references `blogCategory`, `tag`, `teamMember`
16. `customer-story.ts` — no CMS dependencies (complex structure)
17. `technology.ts` — uses `fold` object (most complex)
18. `service.ts` — uses `fold` object, references `technology`
19. `industry.ts` — uses `fold` object
20. `persona.ts` — identical structure to `industry`
21. `location.ts` — identical structure to `industry`

**Critical field rules to enforce:**

- `slug` fields: `{ type: 'slug', options: { source: '[primary title field]' } }` — the source must be the actual primary title field for each type per §7.13 of the design doc. Do not assume `title` — overrides: `technology` → `technologyName`, `review` → `nameClient`, `teamMember` → `name`, `glassdoorReview` → `clientName`, `customerStory` → `customerStoryTitle`, `bookACall` → custom source function:
  ```typescript
  options: {
    source: (doc: { firstName?: string; lastName?: string }) =>
      [doc.firstName, doc.lastName].filter(Boolean).join(' '),
    maxLength: 96,
  }
  ```
- `locale` fields: always `string` with `options.list: [{title: 'Default (US)', value: 'default'}, {title: 'UK', value: 'uk'}]`
- `source` tracking fields: `options.list: ['manual', 'beem', 'claude_code', 'imported']`
- Every schema must have `title` in `defineType` set to the human-readable name Seb will see in Studio
- Fields marked `required` in the design doc must have `validation: Rule => Rule.required()` in the Sanity schema
- Fields with `max X chars` constraints must have `validation: Rule => Rule.max(X)`

**Commit after every 5 schemas:** e.g. `feat(schema): add tag, blog-category, glassdoor-review, benefit-value, staff-benefit schemas`

---

### Step 4 — Write singleton schemas

Singletons in Sanity v3 are standard `document` types — no special schema-level restriction. The "one instance only" behaviour is enforced via the Studio structure config (Step 6) and by pre-seeding each singleton document (Step 4a below). Do **not** use `__experimental_actions` — that was a Sanity v2 pattern and is not supported in v3.

**Singleton schema pattern:**

```typescript
export default defineType({
  name: 'homePage',
  title: 'Home Page',
  type: 'document',
  // No __experimental_actions — singleton enforcement is in sanity.config.ts structure config
  fields: [...]
})
```

**Blog hubs** (7 files — `blog-hub.ts` + 6 category hubs): use the shared hub schema from §4.1.
**Resource hubs** (4 files): use the shared hub schema from §4.2.
**Collection index singletons** (6 files): use the shared hub schema from §4.3.
**Static content singletons** (13 files): use the `sections` array pattern from §4.4. Each has a `sections` field of `array[section]`.
**Tier 3 singletons** (2 files — calculator pages): use the schema from §5.

**Commit:** `feat(schema): add all singleton schemas (hubs, static pages, calculator pages)`

---

### Step 4a — Seed all singleton documents

Singletons don't exist in Sanity until a document is created. Seb cannot edit a singleton that hasn't been seeded — the Studio will show nothing at that nav entry. Seed all 31 singleton documents and 3 global documents now so they're ready for content migration.

Write `scripts/schema/seed-singletons.ts`:
- Uses the Sanity client (`@sanity/client`) with the write token from `src/lib/env.ts` (not `process.env` directly)
- Before writing, log the project ID and dataset name. If `SANITY_DATASET` is `production`, require an explicit `--confirm-production` flag to proceed.
- For each type name in the `SINGLETON_TYPES` list (same list as Step 6), call `client.createIfNotExists(doc)` — this is atomic and idempotent, no check-then-create pattern needed
- Document shape: `{ _id: typeName, _type: typeName, ...minimalFields }` — use a per-type config map for the minimal valid document shape, since not every type has a `title` field (e.g. `navigation` has `primaryLinks`, `footer` has `copyrightText`)
- Log created vs already-exists for each

```bash
npm run schema:seed-singletons
```

Add to `package.json` scripts: `"schema:seed-singletons": "tsx scripts/schema/seed-singletons.ts"` (use `tsx` — confirm it matches the project's existing script runner; if the project uses a different runner, match that instead).

**Commit:** `feat(schema): seed all 34 singleton/global documents in Sanity`

---

### Step 5 — Write global schemas

Three files, per §6 of the design doc:

1. `globals/site-settings.ts` — includes `hubspotPortalId`, `claraChat`, `announcementBar`, `socialProof`
2. `globals/navigation.ts` — `primaryLinks` array with dropdowns, `ctaButton`, `localeDropdown`
3. `globals/footer.ts` — `newsletterFormId`, `copyrightText`, `columns`, `legalLinks`

**Commit:** `feat(schema): add global schemas (site-settings, navigation, footer)`

---

### Step 6 — Wire up schema registry and singleton structure config

`studio/schemas/index.ts` must export all types in a flat array. Also update `sanity.config.ts` to handle singletons correctly using the Sanity v3 `structure` tool.

**There is no `singletonPlugin` in Sanity v3.** Do not import one. The correct v3 approach is:

1. In `sanity.config.ts`, configure the `structureTool` to filter singleton types out of the "new document" menu and instead surface each singleton as a direct nav link to its single document.
2. Use `S.documentTypeListItems()` filtered to exclude singleton type names, then add individual `S.listItem()` entries for each singleton pointing directly to its document.

```typescript
// sanity.config.ts — structure tool config pattern
// Check the installed Sanity version in package.json FIRST.
// Do NOT import from both 'sanity/structure' and '@sanity/desk' — they are
// different eras of the same API. Use whichever matches the installed version.

const SINGLETON_TYPES = [
  // 31 singleton types (singletons/ directory)
  'homePage', 'aboutUsPage', 'howItWorksPage', 'contactPage',
  'forDevelopersPage', 'retentionPage', 'sourcingPage', 'embeddingPage',
  'scaleThisWeekPage', 'workWithShawneePage', 'startHiringPage',
  'notFoundPage', 'privacyPolicyPage', 'blogHub', 'staffAugmentationHub',
  'nearshoringOffshoringHub', 'scalingTeamsHub', 'hiringTipsHub',
  'managingEngineersHub', 'aiInSoftwareDevelopmentHub', 'videosHub',
  'toolsHub', 'downloadsHub', 'eventsHub', 'servicesHub', 'technologyHub',
  'customerStoriesHub', 'reviewsHub', 'compareHub',
  'hiringCostCalculatorPage', 'priceComparisonCalculatorPage',
  // 3 global types (globals/ directory)
  'siteSettings', 'navigation', 'footer',
]
// Total: 34 entries. All need the same structure config treatment:
// filter out of "new document" menu, surface as single-document nav items.
```

**Check the exact Sanity version in `package.json` before writing this config.** The `structureTool` builder API changed between Sanity v3 minor versions. Use the structure API that matches the installed version — do not assume.

**Commit:** `feat(schema): wire schema registry and singleton structure config in sanity.config.ts`

---

### Step 7 — Write Zod types

For each Sanity schema file across `documents/`, `singletons/`, and `globals/`, write the matching Zod schema in the mirrored `src/types/sanity/` subdirectory.

Start with `shared.ts` (SanityImage, SanitySlug, SanityRef, Fold, Section, FaqItem, QuoteBlock), then each document type.

All Zod types must be importable from `src/types/sanity/index.ts`.

**Commit:** `feat(types): add Zod schemas and TypeScript types for all Sanity document types`

---

### Step 8 — Write the migration map document

`docs/WEBFLOW_TO_SANITY_FIELD_MAP.md`

One section per Webflow collection (33 collections → 21 Sanity types + dropped/consolidated collections). Include:

- Field mapping table
- DROPPED FIELDS (with reason from design doc)
- NEW FIELDS (backfill required — flag clearly)
- MIGRATION BLOCKS at bottom of document

Reference `docs/MYGRATR_SCHEMA_DESIGN_DECISIONS.md` §7.13 for the cross-cutting `name` field rule that applies to every collection.

**Use this consolidation table as the master list — every Webflow collection must appear exactly once:**

| Disposition | Webflow collections |
|---|---|
| `maps_to: blogPost` | Blogs & Guides, Staff Augmentation Blogs, Nearshoring & Offshoring Blogs, Scaling Teams Blogs, Hiring Tips Blogs, Managing Engineers Blogs, AI in Software Development Blogs |
| `maps_to: tag` | Tags >> Blogs, Tags >> Alternatives, Tags >> Tools & Quizzes, Tags >> Video Library, Tags >> Downloads, Tags >> Events & Webinars |
| `maps_to: blogCategory` | -- Hubs |
| `maps_to: technology` | Technology Pages |
| `maps_to: service` | Services |
| `maps_to: customerStory` | Customers / Customer Stories |
| `maps_to: teamMember` | Team Members |
| `maps_to: review` | Reviews |
| `maps_to: video` | Videos |
| `maps_to: compareBlog` | Compare Blogs |
| `maps_to: download` | Downloads |
| `maps_to: downloadAccess` | > Downloads Access Pages |
| `maps_to: tool` | Tools & Quizzes |
| `maps_to: bookACall` | Book A Call Pages |
| `maps_to: event` | Events & Webinars |
| `maps_to: glassdoorReview` | -- Glassdoor reviews |
| `maps_to: benefitValue` | -- Client Benefits & Company Values |
| `maps_to: staffBenefit` | -- Staff Benefits |
| `maps_to_singleton: privacyPolicyPage` | Legal pages |
| `dropped` | Insights, New Blog Templates, -- Lead magnets / Tags |

Cross-check the completed map against the actual schema files before marking exit criteria complete.

**Commit:** `docs(schema): add WEBFLOW_TO_SANITY_FIELD_MAP.md for CONTENT-1`

---

### Step 9 — Smoke test: validate schema against real data

Two-part test. Both parts required.

**Part A — Manual Studio check:**
- Start Sanity Studio locally: `cd studio && npx sanity dev`
- Confirm Studio loads without TypeScript errors
- Confirm all 21 document types appear in the left nav as list views
- Confirm all 34 singleton/global types appear as single-document nav entries (not list views) — this validates Step 6 structure config
- Confirm all 34 singleton/global documents exist (seeded in Step 4a) and are editable
- Manually create one Blog Post via Studio UI: assign author, category, tags — confirm no validation errors

**Part B — API seed script (tests the actual migration path):**

Write `scripts/schema/smoke-test-seed.ts`:
- **Self-contained** — do NOT read from `audit-output/` (gitignored, won't exist in CI or fresh clones). Hardcode the test document shapes directly in the script.
- Import Sanity client config from `src/lib/env.ts` (not `process.env`)
- Log project ID + dataset before writing. Require `--confirm-production` flag if dataset is `production`.
- Use a deterministic `_id` for each test document (e.g. `smoke-test-technology-page`) so the script is safe to rerun via `client.createOrReplace()`.
- **Seed prerequisite documents first:** Create a dummy `blogCategory`, `tag`, and `teamMember` document before creating the blog post (these are needed for reference fields). The blog post's `author` field references `teamMember`, not a separate `author` type.
- **Technology Page seed:** Manually construct the expected Sanity document shape for a Technology Page with 3 populated folds. Omit image asset references (use `null` or omit optional image fields) — do not attempt to upload assets in the smoke test. Focus on testing the fold typed array structure.
- If the API rejects any document: schema has a structural bug — log the error clearly and do not proceed to CONTENT-1.
- If all succeed: log the created document IDs.

```bash
npm run schema:smoke-test
```

**Exit criteria for smoke test:**
- [ ] Studio loads without TypeScript errors (`cd studio && npx sanity build` or `tsc --noEmit` passes)
- [ ] All 21 document types appear in the left nav
- [ ] All 34 singleton/global types appear as single-document nav entries (not list views)
- [ ] All 34 singleton/global documents exist and are editable in Studio
- [ ] Blog Post created via Studio UI with teamMember as author, category, and tags — no validation errors
- [ ] Technology Page document created via API seed script — accepted without errors
- [ ] Seeded Technology Page visible in Studio with folds array displaying all sub-fields (type, label, header, paragraph, bullets, items, featuredImage) correctly in the document editor
- [ ] Field count verification: manually verify the 3 most complex schemas (`technology`, `service`, `customerStory`) have the correct number of fields matching the design doc

**Commit:** `test(schema): smoke test — Studio validated, API seed confirmed`

---

### Step 10 — Record schema designs in Supabase and advance phase

Write `scripts/schema/record-schema-designs.ts`. This script does two things atomically:

**Part A — Insert one `schema_designs` row per document type (21 rows):**

The `schema_designs` table is designed for one row per Webflow collection / Sanity document type — NOT one summary row per phase. Required columns per SCHEMA.md:

```typescript
{
  org_id: 'ce000000-0000-0000-0000-000000000001',     // REQUIRED on every write
  migration_id: 'ce000000-0000-0000-0000-000000000002', // REQUIRED
  collection_slug: 'technology-pages',                   // Webflow collection slug (NOT NULL)
  collection_display_name: 'Technology Pages',           // Human-readable name (NOT NULL)
  sanity_schema: { /* full Sanity schema definition as JSON */ }, // JSONB (NOT NULL)
  version: 1,                                            // integer, NOT string '1.0'
  status: 'approved',                                    // 'draft' | 'reviewed' | 'approved' — NOT 'complete'
  specialist_reviewed: false,
}
```

For each of the 21 document types, read the corresponding Sanity schema file, serialize it to JSON, and insert with the correct `collection_slug` matching the Webflow source collection. For consolidated types (e.g. `blogPost` from 7 blog collections), insert one row with `collection_slug: 'blogs-consolidated'` and note the source collections in `notes`.

**Every read and write MUST include `.eq('org_id', ORG_ID)`.** No exceptions.

**Part B — Transition migration status from `schema_running` to `schema_complete`:**

```typescript
import { assertValidTransition } from '@/lib/pipeline/state-machine'

assertValidTransition('schema_running', 'schema_complete')

await supabase
  .from('migrations')
  .update({ 
    status: 'schema_complete', 
    current_phase: 'schema_complete',
    metadata: { 
      ...existingMetadata,
      schema_phase: { document_types: 21, singletons: 31, globals: 3, objects: 5 }
    }
  })
  .eq('id', MIGRATION_ID)
  .eq('org_id', ORG_ID)
```

**Ordering:** Insert all 21 `schema_designs` rows first. Only advance `migrations.status` after all inserts succeed. If any insert fails, do not advance the phase — log the failure and exit.

Add to `package.json`: `"schema:record": "tsx scripts/schema/record-schema-designs.ts"`

**Commit:** `feat(schema): record 21 schema design rows and advance to schema_complete`

---

### Step 11 — Post-phase context file updates

Run the standard post-phase update protocol. Update each file in this order:

1. **CHANGELOG.md** — one paragraph summarising what SCHEMA-1 produced: number of schema files, Zod types, migration map status, smoke test result
2. **PHASE_HISTORY.md** — detailed record: all artefacts created, any deviations from the brief, smoke test outcomes, anything flagged for CONTENT-1
3. **CONVENTIONS.md** — add any new patterns established in this phase (Sanity v3 schema conventions, Zod typing patterns, singleton seeding approach)
4. **FEATURE_MAP.md** — add entries for: Sanity schema files, Zod types, migration map document, singleton seed script, smoke test seed script
5. **CLAUDE.md** — update current phase from `MYGRATR-SCHEMA-1` to `MYGRATR-SCAFFOLD-1`, update schema design state section
6. **SCHEMA.md** — update to reflect that Sanity schemas are now written; link to `studio/schemas/` and `src/types/sanity/`
7. **REGISTRY.md** — add all new scripts and schema files to the relevant tables. Specifically: `scripts/schema/start-schema-phase.ts`, `scripts/schema/seed-singletons.ts`, `scripts/schema/smoke-test-seed.ts`, `scripts/schema/record-schema-designs.ts`. Also register the `package.json` scripts: `schema:seed-singletons`, `schema:smoke-test`, `schema:record`.

**Commit:** `chore(context): post-phase context file updates for SCHEMA-1`

---

## 5. EXIT CRITERIA

Phase is not complete until all of these pass:

- [ ] All 21 document type schemas written and TypeScript-valid
- [ ] All 31 singleton schemas written and TypeScript-valid
- [ ] All 3 global schemas written and TypeScript-valid
- [ ] All 5 object schemas written and TypeScript-valid
- [ ] `studio/schemas/index.ts` exports every type without error
- [ ] TypeScript compiles cleanly: `cd studio && tsc --noEmit` passes; root project `tsc --noEmit` passes for Zod types
- [ ] `sanity.config.ts` structure config hides all 34 singleton/global types from "new document" menu
- [ ] All 34 singleton/global documents seeded in Sanity (Step 4a)
- [ ] All Zod schemas written for documents, singletons, and globals
- [ ] `src/types/sanity/index.ts` re-exports all types without error
- [ ] `docs/WEBFLOW_TO_SANITY_FIELD_MAP.md` complete with all 33 collections mapped
- [ ] Smoke test Part A: Studio loads cleanly, singletons appear as single-document nav entries
- [ ] Smoke test Part B: Technology Page API seed accepted without errors
- [ ] Supabase: 21 `schema_designs` rows inserted (one per document type), all with correct `org_id` filter
- [ ] `migrations.status = schema_complete` via `assertValidTransition()`
- [ ] All Supabase reads and writes include `.eq('org_id', ORG_ID)` — no exceptions
- [ ] Post-phase context files updated (Step 11)
- [ ] All git commits made (one per step minimum)

---

## 6. DEFERRED ITEMS

| Item | Deferred to | Reason |
|---|---|---|
| Portable Text custom block types (form embeds, Vimeo annotations) | CONTENT-1 | Block types are defined during content migration when actual HTML is processed |
| Studio structure plugin (custom desk layout) | SCAFFOLD-1 | General desk customisation (grouping, icons, ordering) deferred. SCHEMA-1 only implements the **minimal singleton filtering** in Step 6 — hiding singleton types from "new document" and surfacing them as direct nav links. |
| `@sanity/document-internationalization` plugin | SCAFFOLD-1 | Locale plugin installed with the rest of the Sanity plugin stack |
| `needsReview` dashboard widget | Post-SCAFFOLD-1 | Studio customisation requiring the full Studio to be configured |
| Blog post authorship backfill | CONTENT-1 | Every post needs a valid `author` reference — flagged in migration map |
| Smoke test with full 451-item migration | CONTENT-1 | Step 9 of this brief covers representative validation only |
| `notFoundPage` content delivery | SCAFFOLD-1 | Next.js App Router 404 page (`app/not-found.tsx`) cannot make async data fetches in the standard pattern. SCAFFOLD-1 must handle this via static generation, hardcoded fallback, or ISR. Schema is correct; delivery mechanism needs special handling. |
| `teamHub` singleton — DROPPED | N/A | Design doc §4.3 lists `teamHub` → `/team` but §8 defines `/team` → `/about-us` as an existing 301 redirect. Since `/team` never renders a page, no singleton is needed. `aboutUsPage` serves `/about-us`. If `/team` is ever un-redirected, add `teamHub` singleton at that point — trivial to add later. This is a minor inconsistency in the design doc, not a structural error. |

---

## 7. ARCHITECTURE RULES — ENFORCED IN THIS PHASE

From `CLAUDE.md`. Non-negotiable:

- **TypeScript strict mode always on** — no `any` anywhere. Portable Text arrays use `z.unknown()` (not `z.any()`). This is the only place `unknown` is permitted without narrowing — it will be tightened in TEMPLATE-*.
- **No architecture decisions** — every field, every type, every structure is in the design doc. If something is missing, STOP and ask.
- **Sanity v3 API only** — use `defineType`, `defineField`, `defineArrayMember`. Do not use the v2 object syntax.
- **Git commit after every working step** — not at end of session
- **Session lane: SCHEMA** — touches `studio/schemas/`, `studio/sanity.config.ts` (singleton structure config only), `src/types/sanity/`, `scripts/schema/`, `docs/WEBFLOW_TO_SANITY_FIELD_MAP.md`. Does not touch adapter code, QA code, orchestrator code, or Next.js template files.

---

## 8. NOTES FOR CLAUDE CODE

- The design doc is 1,195 lines. Read it in full before writing any schema. The field specs are in §3–§6. Cross-cutting rules are in §7. Do not rely on this brief's summaries alone — the design doc is authoritative.
- `industry`, `persona`, and `location` schemas are structurally identical — build `industry.ts` first, then copy and adjust the `name`, `title`, and route comment for `persona.ts` and `location.ts`.
- The `section` object in `studio/schemas/objects/section.ts` is polymorphic — 12 variants. Use Sanity's `defineArrayMember` to define each variant inline.
- Singletons do not use `__experimental_actions` — singleton enforcement is handled via the Studio `structure` config in `sanity.config.ts` (Step 6) and the seeding script (Step 4a). The schema files for singletons are plain `document` types.
- The three HubSpot form IDs embedded in content (§7.10 of design doc) are hardcoded values that appear in the migration map, not in the schema itself. The schema only stores `hubspotPortalId` in `siteSettings` and `formId` as a string field where forms appear.

---

*Brief version: v1.3 | Cross-model audit applied (5-model, preset:full). Critical fixes: C1 (schema_designs table rewrite — 21 rows not 1), C2 (state machine transitions + assertValidTransition), C3 (Studio prerequisite check), C4 (org_id on all queries), C5 (createIfNotExists), C6 (smoke test prereqs). Important fixes: I1 (z.unknown not z.any), I2 (bookACall slug function), I3 (self-contained smoke test), I4+I13 (package.json scripts), I5 (env.ts), I6 (section field specs), I7 (structure config scope), I10 (consolidation table), I14 (reference handling), I15 (field count verification), I17 (Zod required/optional), I18 (tsc --noEmit). Minor fixes: M2 (export pattern), M5 (notFoundPage), M6 (folds criterion). | READY FOR BUILD*

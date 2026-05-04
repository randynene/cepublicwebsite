# MYGRATR-CONTENT-1B — Reference-Light & Standalone Collections Migration
## Session Brief v1.1

> **Executor:** Claude Code
> **Planner sign-off:** Jake Hall
> **Preset:** `preset:quick` — run cross-model audit before execution
> **Branch:** `feat/content-1b` (branch from main after CONTENT-1A merge) → merge to main on completion
> **State machine transition:** `content_running` remains — no transition this session (content_complete fires after CONTENT-1C)

---

## 0. READ FIRST

Before writing a single line of code:

1. Read `CLAUDE.md` — confirm `migrations.status = content_running` for CE row. If not, STOP.
2. Read `CONVENTIONS.md` — all patterns apply in full.
3. Read `docs/WEBFLOW_TO_SANITY_FIELD_MAP.md` — this is the authoritative source for every field name and Sanity field type. The field tables in this brief are summaries derived from it. If there is any conflict between this brief and the field map, the field map wins. Stop and write to `DEBUG_CONTEXT.md` if you find a conflict.
4. Read `docs/MYGRATR_SCHEMA_DESIGN_DECISIONS.md §3` — decisions for bookACall (§3.14), event (§3.15), tool (§3.13), download (§3.12), downloadAccess (§3.11).

**What this session does:** Migrates 8 collections that have no outbound cross-references to other migrated CMS documents (or where references are to `tag` documents already in Sanity from CONTENT-1A). Images are uploaded to Sanity as real assets in this session — not staged as URLs.

**What this session does NOT do:** Blog posts, technology pages, services, customer stories, or compare blogs. Those are CONTENT-1C.

**Session lane:** CONTENT touches `/src/lib/content/` and `content_migrations` table only. Never touches `site/`, `studio/` schemas, or template code.

**Architecture rule:** No decisions in this session. If something in the field map is ambiguous or contradicts this brief, write it to `DEBUG_CONTEXT.md` and stop.

**Infrastructure reuse:** The full migration infrastructure from CONTENT-1A already exists:
- `src/lib/content/sanity-write-client.ts`
- `src/lib/content/webflow-read-client.ts`
- `src/lib/content/migration-tracker.ts`
- `src/lib/content/ce-collection-ids.ts`

Do not recreate any of these. Extend `ce-collection-ids.ts` with the new collection IDs from Step 1.

---

## 1. Extend Collection ID Map

Open `src/lib/content/ce-collection-ids.ts`. Add the following entries to `CE_COLLECTION_IDS`. All 8 IDs are confirmed below — add them directly, then verify against the live API:

```bash
curl https://api.webflow.com/v2/sites/${WEBFLOW_SITE_ID}/collections \
  -H "Authorization: Bearer ${WEBFLOW_API_TOKEN}" | jq '.collections[] | {id, slug, displayName}'
```

**Confirmed collection IDs:**

```typescript
// CONTENT-1B additions
teamMembers: '673766d51434465f74c59142',
reviews: '673a50eebf20965117e1fa9f',
videos: '685d8ce311e274210e36fdca',
bookACall: '68cc200833fe6f7277646d72',
eventsWebinars: '68d585745aa126329fe687ee',
toolsQuizzes: '68b893c2861ab8104a00477f',
downloads: '6749e40f04d10cf9b88d5bb3',
downloadsAccess: '67e18cb55008a1170e325a83',
```

Cross-check every ID against the API output. If any mismatch, STOP — do not guess.

Commit: `feat(content): extend CE_COLLECTION_IDS for CONTENT-1B collections`

---

## 1a. Shared Helpers

Add the following two helpers to a new file `src/lib/content/migration-helpers.ts`. Every migration script in this session imports from here — do not duplicate these inline.

```typescript
import { sanityWriteClient } from '@/lib/content/sanity-write-client'
import { htmlToBlocks } from '@sanity/block-tools'
import { Schema } from '@sanity/schema'

// Portable text conversion using @sanity/block-tools.
// Webflow RichText fields return HTML strings.
// Install if not present: npm install @sanity/block-tools @sanity/schema
const defaultSchema = Schema.compile({
  name: 'default',
  types: [
    {
      type: 'object',
      name: 'blogPost',
      fields: [{ name: 'body', type: 'array', of: [{ type: 'block' }] }],
    },
  ],
})
const blockContentType = defaultSchema
  .get('blogPost')
  .fields.find((f: { name: string }) => f.name === 'body').type

export function toPortableText(html: unknown): unknown[] {
  if (!html || typeof html !== 'string' || html.trim() === '') return []
  try {
    return htmlToBlocks(html, blockContentType)
  } catch {
    // If block-tools fails, fall back to a single plain-text block
    // rather than crashing the migration. Log the failure.
    console.warn(`toPortableText fallback for value: ${String(html).slice(0, 80)}`)
    return [
      {
        _type: 'block',
        _key: Math.random().toString(36).slice(2, 10),
        children: [{ _type: 'span', text: String(html) }],
        markDefs: [],
        style: 'normal',
      },
    ]
  }
}

// Extract URL string from a Webflow Link field object.
export function extractUrl(linkField: unknown): string | null {
  if (!linkField || typeof linkField !== 'object') return null
  const link = linkField as Record<string, unknown>
  return (link['url'] as string) ?? (link['href'] as string) ?? null
}

// Upload a Webflow CDN image to Sanity and return a Sanity image asset reference.
// Returns null if the image field is absent.
export async function uploadImage(imageField: unknown): Promise<unknown | null> {
  if (!imageField || typeof imageField !== 'object') return null
  const img = imageField as Record<string, unknown>
  const url = (img['url'] as string) ?? null
  if (!url) return null
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`HTTP ${response.status} fetching ${url}`)
    const buffer = await response.arrayBuffer()
    const filename = url.split('/').pop()?.split('?')[0] ?? 'image.jpg'
    const asset = await sanityWriteClient.assets.upload(
      'image',
      Buffer.from(buffer),
      { filename }
    )
    return { _type: 'image', asset: { _type: 'reference', _ref: asset._id } }
  } catch (err) {
    console.warn(`Image upload failed for ${url}: ${err instanceof Error ? err.message : String(err)}`)
    return null
  }
}

// Build a Sanity reference array from a Webflow MultiReference field.
// refPrefix: the _id prefix used when the referenced documents were created
// (e.g. 'tag' → _ref becomes 'tag-{webflowId}')
export function toRefs(
  multiRefField: unknown,
  refPrefix: string
): Array<{ _type: 'reference'; _ref: string; _key: string }> {
  if (!Array.isArray(multiRefField)) return []
  return multiRefField
    .filter((ref): ref is { id: string } => !!ref?.id)
    .map((ref) => ({
      _type: 'reference' as const,
      _ref: `${refPrefix}-${ref.id}`,
      _key: ref.id.slice(0, 8),
    }))
}

// Extract the string name from a Webflow Option field object.
export function extractOption(optionField: unknown): string | null {
  if (!optionField || typeof optionField !== 'object') return null
  return (optionField as Record<string, unknown>)['name'] as string ?? null
}
```

**Note on `@sanity/block-tools`:** Check if it is already installed (`cat package.json | grep block-tools`). If not, install it before proceeding: `npm install @sanity/block-tools @sanity/schema`.

Commit: `feat(content): add shared migration helpers`

---

## 2. Migrate Team Members (`teamMember`)

**Source:** `team` collection — 28 items
**Target:** `teamMember` Sanity document type
**Route:** `/team/[slug]`

**Field mapping (from `docs/WEBFLOW_TO_SANITY_FIELD_MAP.md §6`):**

| Webflow slug | Sanity field | Type |
|---|---|---|
| `name` | `name` | string (required) |
| `slug` | `slug.current` | slug |
| `order` | `order` | number |
| `position` | `position` | string |
| `team-member-image` | `teamMemberImage` | image — upload via `uploadImage()` |
| `about-content` | `aboutContent` | portableText |
| `time-at-cloud-employee` | `timeAtCloudEmployee` | string |
| `areas-of-expertise` | `areasOfExpertise` | portableText |
| `linkedin-link` | `linkedinLink` | url — extract via `extractUrl()` |
| `book-a-call-link` | `bookACallLink` | url — extract via `extractUrl()` — 18% fill rate |
| `hide-from-team-about-page` | `hideFromTeamAboutPage` | boolean |

**Omitted:** `metaTitle`, `metaDescription` — not in Webflow collection. CONTENT-1C backfill. Do not invent values.

Create `scripts/content/migrate-team-members.ts`:

```typescript
import { ensureSanity, ensureWebflow } from '@/lib/env'
import { getCollectionItems } from '@/lib/content/webflow-read-client'
import { sanityWriteClient } from '@/lib/content/sanity-write-client'
import { recordMigration } from '@/lib/content/migration-tracker'
import { CE_COLLECTION_IDS } from '@/lib/content/ce-collection-ids'
import { toPortableText, extractUrl, uploadImage } from '@/lib/content/migration-helpers'

ensureSanity()
ensureWebflow()

async function migrateTeamMembers() {
  const items = await getCollectionItems(CE_COLLECTION_IDS.teamMembers)
  let migrated = 0
  const errors: string[] = []

  for (const item of items) {
    try {
      const f = item.fieldData
      const doc = {
        _id: `teamMember-${item.id}`,
        _type: 'teamMember',
        name: f['name'] as string,
        slug: { _type: 'slug', current: item.slug },
        order: (f['order'] as number) ?? null,
        position: (f['position'] as string) ?? null,
        teamMemberImage: await uploadImage(f['team-member-image']),
        aboutContent: toPortableText(f['about-content'] as string),
        timeAtCloudEmployee: (f['time-at-cloud-employee'] as string) ?? null,
        areasOfExpertise: toPortableText(f['areas-of-expertise'] as string),
        linkedinLink: extractUrl(f['linkedin-link']),
        bookACallLink: extractUrl(f['book-a-call-link']),
        hideFromTeamAboutPage: (f['hide-from-team-about-page'] as boolean) ?? false,
      }
      await sanityWriteClient.createOrReplace(doc)
      migrated++
      console.log(`✓ teamMember: ${doc.name}`)
    } catch (err) {
      const msg = `Failed teamMember ${item.id}: ${err instanceof Error ? err.message : String(err)}`
      errors.push(msg)
      console.error(`✗ ${msg}`)
    }
  }

  await recordMigration({
    collectionSlug: 'team-members',
    sourceItemCount: items.length,
    migratedItemCount: migrated,
    status: errors.length === 0 ? 'complete' : 'failed',
    errorLog: errors,
  })

  console.log(`\nTeam Members: ${migrated}/${items.length} migrated. Errors: ${errors.length}`)
}

migrateTeamMembers().catch(console.error)
```

Add npm script: `"content:migrate-team-members": "tsx scripts/content/migrate-team-members.ts"`

**Expected:** 28 items migrated, 0 errors. In Sanity Studio, spot-check 3 team member documents — confirm name, position, and photo render correctly.

Commit: `feat(content): migrate team members — 28 items`

---

## 3. Migrate Reviews (`review`)

**Source:** `reviews` collection — 26 items
**Target:** `review` Sanity document type
**Route:** `/reviews/[slug]`

**Field mapping (from `docs/WEBFLOW_TO_SANITY_FIELD_MAP.md §7`):**

| Webflow slug | Sanity field | Type |
|---|---|---|
| `name` | `nameClient` | string (required — per-type primary override) |
| `slug` | `slug.current` | slug |
| `position` | `position` | string |
| `order` | `order` | number |
| `testimony-short` | `testimonyShort` | text (plain string) |
| `testimony-paragraph-2` | `testimonyParagraph` | portableText |
| `testimony-full-page` | `testimony-full-page` | portableText |
| `snippet-for-meta` | `snippetForMeta` | string |
| `member-image` | `memberImage` | image — upload via `uploadImage()` |
| `company-logo` | `companyLogo` | image — upload via `uploadImage()` |
| `thumbnail-image` | `thumbnailImage` | image — upload via `uploadImage()` |
| `additional-info` | `additionalInfo` | portableText — 36% fill rate |

**Dropped fields (do not migrate):**
- `featured-in-which-page` — legacy, dropped per field map §7
- `webpage-for-testimonial` — marked "No Longer Used" in Webflow, dropped per field map §7

**Omitted:** `metaTitle`, `metaDescription` — CONTENT-1C backfill. `metaDescription` prefers `snippetForMeta` where present — that mapping happens at backfill time, not now.

Create `scripts/content/migrate-reviews.ts` following the same pattern as migrate-team-members.ts. Use `_id: 'review-${item.id}'`.

Add npm script: `"content:migrate-reviews": "tsx scripts/content/migrate-reviews.ts"`

**Expected:** 26 items migrated, 0 errors.

Commit: `feat(content): migrate reviews — 26 items`

---

## 4. Migrate Videos (`video`)

**Source:** `videos` collection — 32 items
**Target:** `video` Sanity document type
**Route:** `/videos/[slug]`

**Field mapping (from `docs/WEBFLOW_TO_SANITY_FIELD_MAP.md §8`):**

| Webflow slug | Sanity field | Type |
|---|---|---|
| `name` | `name` | string (required) |
| `slug` | `slug.current` | slug |
| `label-short-name-like-talent-retention` | `label` | string |
| `type` | `type` | string — extract option name, normalise to camelCase: `Fireside chats` → `firesideChats`, `Working with us` → `workingWithUs`, `Interviews` → `interviews` |
| `team` | `team` | string — extract option name, normalise to camelCase |
| `order` | `order` | number — 28% fill rate |
| `featured` | `featured` | boolean |
| `main-video-embed-link` | `mainVideoEmbedLink` | url — extract via `extractUrl()` |
| `background-video-preview-link` | `backgroundVideoPreviewLink` | string (kept as string, not url — tolerance for malformed values per field map §8) |
| `vimeo-youtube-standard-link` | `vimeoYoutubeStandardLink` | string (same tolerance rule) |
| `backup-image` | `backupImage` | image — upload via `uploadImage()` — REQUIRED |
| `description-of-video` | `descriptionOfVideo` | portableText |
| `full-video-transcript` | `fullVideoTranscript` | portableText |
| `links-mentioned-in-video` | `linksMentionedInVideo` | portableText — 3% fill rate |
| `linkedin-profiles-of-speakers-in-video` | `linkedinProfilesOfSpeakersInVideo` | portableText |
| `tags` | `tags` | reference[] → tag — use `toRefs(f['tags'], 'tag')` |
| `meta-title` | `metaTitle` | string — exists in this collection, migrate it |
| `meta-description` | `metaDescription` | text — exists in this collection, migrate it |

**Option normalisation helper for video type and team:**
```typescript
const TYPE_MAP: Record<string, string> = {
  'Fireside chats': 'firesideChats',
  'Working with us': 'workingWithUs',
  'Interviews': 'interviews',
}
const TEAM_MAP: Record<string, string> = {
  'Talent Success Team': 'talentSuccessTeam',
  'Client Success Team': 'clientSuccessTeam',
  'People and Culture Team': 'peopleAndCultureTeam',
  'Engineering Team': 'engineeringTeam',
  'Leadership Team': 'leadershipTeam',
  'Talent Recruitment Team': 'talentRecruitmentTeam',
  'Technical Vetting Team': 'technicalVettingTeam',
  'HR, Compliance and Legal Team': 'hrComplianceAndLegalTeam',
  'Learning & Development Team': 'learningAndDevelopmentTeam',
  'Employee Experience Team': 'employeeExperienceTeam',
}
```

**New field:** `locale` — set to `'default'` on all documents.

Create `scripts/content/migrate-videos.ts`. Use `_id: 'video-${item.id}'`.

Add npm script: `"content:migrate-videos": "tsx scripts/content/migrate-videos.ts"`

**Expected:** 32 items migrated, 0 errors. Spot-check one video in Studio — confirm thumbnail image, tags reference, and metaTitle are present.

Commit: `feat(content): migrate videos — 32 items`

---

## 5. Migrate Book A Call Pages (`bookACall`)

**Source:** `book-a-call` collection — 6 items
**Target:** `bookACall` Sanity document type
**Route:** `/book-a-call/[slug]`

**Field mapping (from `docs/WEBFLOW_TO_SANITY_FIELD_MAP.md §12`):**

| Webflow slug | Sanity field | Type |
|---|---|---|
| `name` | `firstName` | string (required) — confirmed via live API: this field contains only the first name, e.g. "Anto" |
| `last-name` | `lastName` | string (required) — confirmed via live API: separate field, e.g. "Čabraja" |
| `slug` | `slug.current` | slug — use `item.slug` directly |
| `calendly-embed` | `calendlyEmbed` | portableText (required) |
| `title` | `metaDescription` | text — **CRITICAL: the Webflow field is named `title` but contains meta description copy. Maps to `metaDescription`, not any title field. This is an intentional fix per §3.14 / D9.** |

**Omitted:** `metaTitle` — new field not in Webflow, CONTENT-1C backfill.

Create `scripts/content/migrate-book-a-call.ts`. Use `_id: 'bookACall-${item.id}'`.

Add npm script: `"content:migrate-book-a-call": "tsx scripts/content/migrate-book-a-call.ts"`

**Expected:** 6 items migrated, 0 errors.

Commit: `feat(content): migrate book-a-call pages — 6 items`

---

## 6. Migrate Events & Webinars (`event`)

**Source:** `events` collection — 1 item
**Target:** `event` Sanity document type
**Route:** `/events/[slug]`

**Field mapping (from `docs/WEBFLOW_TO_SANITY_FIELD_MAP.md §13`):**

| Webflow slug | Sanity field | Type |
|---|---|---|
| `name` | `name` | string (required) |
| `slug` | `slug.current` | slug |
| `date-time` | `dateTime` | datetime string |
| `header-description` | `headerDescription` | portableText |
| `header-description-post-event` | `headerDescriptionPostEvent` | portableText |
| `header-button-text` | `headerButtonText` | string |
| `featured-image` | `featuredImage` | image — upload via `uploadImage()` |
| `thumbnail-image` | `thumbnailImage` | image — upload via `uploadImage()` |
| `topics-header` | `topics.header` | string |
| `topics-description` | `topics.description` | portableText |
| `topics-section---title-1..4` + `topics-section---description-1..4` | `topics.items[]` | array of `{title, description}` — skip null pairs |
| `speakers` | `speakers` | reference[] → teamMember — use `toRefs(f['speakers'], 'teamMember')` |
| `sign-up-header` | `signUp.header` | string |
| `sign-up-description` | `signUp.description` | portableText |
| `sign-up-form-embed` | `signUp.formEmbed` | portableText |
| `on-demand-embed-description` | `onDemandEmbedDescription` | portableText — 0% fill rate |
| `event-type` | `eventType` | single reference → tag — resolve as `tag-${ref.id}` — 0% fill rate |
| `event-category` | `eventCategory` | reference[] → tag — use `toRefs()` |
| `meta-title` | `metaTitle` | string |
| `meta-description` | `metaDescription` | text |

**New field:** `locale` — set to `'default'`.

**Topics items construction:**
```typescript
const topicsItems = [1, 2, 3, 4]
  .map((n) => ({
    _key: `topic-${n}`,
    title: (f[`topics-section---title-${n}`] as string) ?? null,
    description: (f[`topics-section---description-${n}`] as string) ?? null,
  }))
  .filter((t) => t.title || t.description)
```

Create `scripts/content/migrate-events.ts`. Use `_id: 'event-${item.id}'`.

Add npm script: `"content:migrate-events": "tsx scripts/content/migrate-events.ts"`

**Expected:** 1 item migrated, 0 errors. (One event in the collection — this is correct.)

Commit: `feat(content): migrate events — 1 item`

---

## 7. Migrate Tools & Quizzes (`tool`)

**Source:** `tools` collection — 2 items
**Target:** `tool` Sanity document type
**Route:** `/tools/[slug]`

**Field mapping (from `docs/WEBFLOW_TO_SANITY_FIELD_MAP.md §11`):**

| Webflow slug | Sanity field | Type |
|---|---|---|
| `name` | `name` | string (required) |
| `slug` | `slug.current` | slug |
| `sub-header` | `subHeader` | string |
| `header-blurb` | `headerBlurb` | portableText |
| `description` | `description` | portableText |
| `button-1-text` / `button-1-link` | `button1Text` / `button1Link` | string / url |
| `button-2-text` / `button-2-link` | `button2Text` / `button2Link` | string / url |
| `tool-embed` | `toolEmbed` | portableText |
| `hidden-code` | `hiddenCode` | portableText — **API key must be stripped. See security rule below.** |
| `video-overview` | `videoOverview` | portableText |
| `faq-title-1..10` / `faq-answer-1..10` | `faqs[].question` / `faqs[].answer` | faqItem[] max 10 |
| `thumbnail` | `thumbnail` | image — upload via `uploadImage()` |
| `meta-title` | `metaTitle` | string |
| `blurbs` | `metaDescription` | text — Webflow field is mislabelled; maps to metaDescription per field map §11 |
| `tags` | `tags` | reference[] → tag — use `toRefs(f['tags'], 'tag')` |
| `featured` | `featured` | boolean |

**New field:** `locale` — set to `'default'`.

**SECURITY RULE — Culture Match API key (§3.13 / D3):**

Before writing `hiddenCode` to Sanity, strip any API key values. The field contains embedded JavaScript with key patterns like `key: 'abc123...'` or `api: 'https://...'`. Apply this sanitisation:

```typescript
function stripApiKeys(html: string | null): string | null {
  if (!html) return null
  // Replace key/api string literals in JS — conservative pattern
  return html
    .replace(/(['"])key\1\s*:\s*(['"])[^'"]+\2/g, '"key": "[REDACTED]"')
    .replace(/(['"])api\s*\1\s*:\s*(['"])[^'"]+\2/g, '"api": "[REDACTED]"')
}
```

Apply `stripApiKeys` to the raw HTML value **before** passing to `toPortableText`. Log a warning if the function modified the string. If you are not certain the key has been removed, set `hiddenCode` to `null` entirely and log `WARN: hiddenCode omitted — API key stripping uncertain`.

**FAQ construction:**
```typescript
const faqs = Array.from({ length: 10 }, (_, i) => i + 1)
  .map((n) => ({
    _key: `faq-${n}`,
    question: (f[`faq-title-${n}`] as string) ?? null,
    answer: toPortableText(f[`faq-answer-${n}`] as string),
  }))
  .filter((faq) => faq.question)
```

Create `scripts/content/migrate-tools.ts`. Use `_id: 'tool-${item.id}'`.

Add npm script: `"content:migrate-tools": "tsx scripts/content/migrate-tools.ts"`

**Expected:** 2 items migrated, 0 errors. In Studio, open the Culture Match tool document and confirm `hiddenCode` either contains `[REDACTED]` or is null — never contains a real API key.

Commit: `feat(content): migrate tools — 2 items`

---

## 8. Migrate Downloads (`download`)

**Source:** `download` collection — 5 items
**Target:** `download` Sanity document type
**Route:** `/download/[slug]`

**Field mapping (from `docs/WEBFLOW_TO_SANITY_FIELD_MAP.md §9`):**

| Webflow slug | Sanity field | Type |
|---|---|---|
| `name` | `name` | string (required) |
| `slug` | `slug.current` | slug |
| `title` | `title` | string |
| `featured` | `featured` | boolean |
| `coming-soon` | `comingSoon` | boolean |
| `tags` | `tags` | reference[] → tag — use `toRefs(f['tags'], 'tag')` |
| `main-description` | `mainDescription` | portableText |
| `benefits-image` | `headerFooterImage` | image — upload via `uploadImage()` |
| `button-text---1` / `button-link---1` | `button1Text` / `button1Link` | string / url |
| `button-text---2` / `button-link---2` | `button2Text` / `button2Link` | string / url |
| `you-ll-get-tag--1` / `you-ll-get-tag--2` / `you-ll-get-tag--3` | `youllGet[]` | string[] — pack into array, filter nulls |
| `how-to-use-it-video-thumbnail` | `howToUseIt.videoThumbnail` | image — upload via `uploadImage()` |
| `how-to-use-it-video-link` | `howToUseIt.videoUrl` | url — extract via `extractUrl()` |
| `how-to-use-it-title` | `howToUseIt.title` | string |
| `how-to-use-it-description` | `howToUseIt.description` | portableText |
| `thumbnail-image` | `theImpact.image` | image — upload via `uploadImage()` |
| `benefits-title` | `theImpact.title` | string |
| `the-impact-description` | `theImpact.description` | portableText |
| `faq-title---1..6` / `faq-answer---1..6` | `faqs[].question` / `faqs[].answer` | faqItem[] max 6 — note three-dash slugs |
| `get-it-now-title` | `getItNow.title` | string |
| `get-it-now-description` | `getItNow.description` | portableText |
| `meta-title` | `metaTitle` | string |
| `meta-description` | `metaDescription` | text |
| `open-graph-wide-image` | `metaThumbnail` | image — upload via `uploadImage()` |
| `hubspot-form-id` | `hubspotFormId` | string |

**New field:** `locale` — set to `'default'`.

**Dropped fields (0% fill rate — do not migrate):**
- `code-rich-text`
- `you-ll-get-tag--4-2`
- `you-ll-get-tag--5-2`
- `faq-title---7`, `faq-answer---7`
- `faq-title---8`, `faq-answer---8`

**You'll get tags construction:**
```typescript
const youllGet = [
  f['you-ll-get-tag--1'],
  f['you-ll-get-tag--2'],
  f['you-ll-get-tag--3'],
].filter(Boolean).map(String)
```

**FAQ construction — three-dash slugs:**
```typescript
const faqs = Array.from({ length: 6 }, (_, i) => i + 1)
  .map((n) => ({
    _key: `faq-${n}`,
    question: (f[`faq-title---${n}`] as string) ?? null,
    answer: toPortableText(f[`faq-answer---${n}`] as string),
  }))
  .filter((faq) => faq.question)
```

Create `scripts/content/migrate-downloads.ts`. Use `_id: 'download-${item.id}'`.

Add npm script: `"content:migrate-downloads": "tsx scripts/content/migrate-downloads.ts"`

**Expected:** 5 items migrated, 0 errors.

Commit: `feat(content): migrate downloads — 5 items`

---

## 9. Migrate Downloads Access Pages (`downloadAccess`)

**Source:** `download-thank-you` collection — 5 items
**Target:** `downloadAccess` Sanity document type
**Route:** `/download-thank-you/[slug]` — noindex, not in sitemap

**Field mapping (from `docs/WEBFLOW_TO_SANITY_FIELD_MAP.md §10`):**

| Webflow slug | Sanity field | Type |
|---|---|---|
| `name` | `name` | string (required) |
| `slug` | `slug.current` | slug |
| `download-file-link` | `downloadFileLink` | url — REQUIRED — extract via `extractUrl()` |

Three fields. No images. No rich text. Simplest collection in this session.

Create `scripts/content/migrate-downloads-access.ts`. Use `_id: 'downloadAccess-${item.id}'`.

Add npm script: `"content:migrate-downloads-access": "tsx scripts/content/migrate-downloads-access.ts"`

**Expected:** 5 items migrated, 0 errors.

Commit: `feat(content): migrate downloads access pages — 5 items`

---

## 10. Verify All Migrations

After all 8 scripts complete, run a parity check.

Create `scripts/content/verify-content-1b.ts`:

```typescript
import { createServerClient } from '@/lib/supabase'

const ORG_ID = 'ce000000-0000-0000-0000-000000000001'
const MIGRATION_ID = 'ce000000-0000-0000-0000-000000000002'

const EXPECTED: Record<string, number> = {
  'team-members': 28,
  'reviews': 26,
  'videos': 32,
  'book-a-call': 6,
  'events': 1,
  'tools': 2,
  'downloads': 5,
  'downloads-access': 5,
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
      `${passed ? '✓' : '✗'} ${slug}: ${row.migrated_item_count}/${expected} (parity: ${row.parity_score}%)`
    )
    if (!passed) allPassed = false
  }

  if (!allPassed) {
    console.error('\nVerification failed. Fix errors before merging.')
    process.exit(1)
  }

  console.log('\nAll CONTENT-1B collections verified. ✓')
}

verify().catch(console.error)
```

Add npm script: `"content:verify-1b": "tsx scripts/content/verify-content-1b.ts"`

Run: `npm run content:verify-1b`

Must exit 0 before proceeding.

Commit: `feat(content): CONTENT-1B verification script`

---

## 11. Post-Phase

### 11a. Update CLAUDE.md

Add to the "Content migration state" section established in CONTENT-1A:

```
**Content migration state (as of CONTENT-1B complete):**
- migrations.status = content_running (partial — CONTENT-1B of 3)
- Collections migrated (CONTENT-1A): tags-consolidated (22), blog-categories (6),
  glassdoor-reviews (10), benefit-values (9), staff-benefits (6)
- Collections migrated (CONTENT-1B): team-members (28), reviews (26), videos (32),
  book-a-call (6), events (1), tools (2), downloads (5), downloads-access (5)
- Total items in Sanity: 158
- Images: uploaded as real Sanity assets (no staging URLs)
- Remaining: CONTENT-1C (blogs 98, technology 101, services 23,
  customer stories 18, compare blogs 29) + meta backfills (~180 fields)
- Known debt: 1 smoke-test tag document (scaling-teams SMOKE TEST) to delete before launch
```

### 11b. Merge

Merge `feat/content-1b` → `main`.

Push to GitHub using the PAT pattern confirmed in SCAFFOLD-1.

### 11c. Post-phase context file updates

Follow post-phase protocol from `CLAUDE.md §Post-Phase Checklist` in order:
1. CHANGELOG.md
2. PHASE_HISTORY.md
3. CONVENTIONS.md — add: `toPortableText` uses `@sanity/block-tools`; `uploadImage` pattern for Sanity asset uploads; `toRefs` for MultiReference fields; `extractOption` for Option fields; option normalisation to camelCase
4. FEATURE_MAP.md — add CONTENT-1B entry
5. CLAUDE.md — update content migration state block
6. SCHEMA.md — no DDL changes; note content_migrations rows written
7. REGISTRY.md — add all new migration scripts and `src/lib/content/migration-helpers.ts`

Commit: `chore(docs): post-phase context file updates — CONTENT-1B complete`

---

## Session Outputs (Definition of Done)

- [ ] `@sanity/block-tools` confirmed installed
- [ ] `src/lib/content/migration-helpers.ts` created — `toPortableText`, `extractUrl`, `uploadImage`, `toRefs`, `extractOption`
- [ ] `ce-collection-ids.ts` extended with all 8 CONTENT-1B IDs, verified against live API
- [ ] Team Members migrated — 28 documents in Sanity with real image assets
- [ ] Reviews migrated — 26 documents in Sanity, `featured-in-which-page` and `webpage-for-testimonial` confirmed absent
- [ ] Videos migrated — 32 documents in Sanity, tag references resolve, option fields normalised to camelCase
- [ ] Book A Call pages migrated — 6 documents in Sanity, `title` → `metaDescription` mapping confirmed, `firstName`/`lastName` confirmed split correctly
- [ ] Events migrated — 1 document in Sanity
- [ ] Tools migrated — 2 documents in Sanity, Culture Match `hiddenCode` confirmed contains `[REDACTED]` or null — never a real key
- [ ] Downloads migrated — 5 documents in Sanity, three-dash FAQ slugs used, dropped fields absent
- [ ] Downloads Access pages migrated — 5 documents in Sanity
- [ ] `content:verify-1b` exits 0
- [ ] All 8 collections show `parity_score = 100` in `content_migrations` table
- [ ] All commits on main
- [ ] Context files updated per post-phase protocol

---

## Known Risks

**Image upload failures:** The `uploadImage` helper logs a warning and returns `null` on failure rather than crashing the migration. After running each script, check the console output for any `Image upload failed` warnings. A null image on a REQUIRED field (e.g. `backupImage` on video, `teamMemberImage` on teamMember) will cause a Sanity validation warning in Studio — acceptable pre-launch, not acceptable at cutover.

**Tag reference integrity:** References use the `tag-${webflowId}` ID pattern from CONTENT-1A. After running video and download migrations, spot-check one document in Studio and confirm tags show as resolved references, not "Document not found".

**`@sanity/block-tools` compatibility:** This package must be installed in the repo root (not `studio/`), as it runs in the migration scripts via tsx. If import fails, check the package version is compatible with the Sanity version in use.

**Culture Match API key:** The stripping regex covers the known patterns from the audit output. If a new pattern is present in the Webflow data that the regex doesn't catch, the raw key may pass through. Verify in Studio after migration.

**Smoke test tag document:** One `scaling-teams (SMOKE TEST)` tag exists in Sanity from SCHEMA-1. It will not affect migrations — references from CONTENT-1A used real Webflow IDs. Delete it manually in Studio before launch.

---

*MYGRATR-CONTENT-1B Session Brief v1.1 — field names verified against WEBFLOW_TO_SANITY_FIELD_MAP.md, images upload as real Sanity assets, bookACall firstName/lastName confirmed via live API, shared helpers extracted, ready for cross-model audit.*

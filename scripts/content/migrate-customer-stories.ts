// Migrates the Webflow `Customers / Customer Stories` collection into Sanity
// `customerStory` documents. Field mapping per WEBFLOW_TO_SANITY_FIELD_MAP §5
// with CONTENT-1C brief slug-sweep §2.5 corrections (Jake-approved 2026-04-30):
//
//   - Webflow `name` → Sanity `companyName` (the field display name in
//     CE_SITE_TRUTH is "Company name").
//   - Webflow `customer-story-title` → Sanity `customerStoryTitle`.
//   - Switch slugs: `feature-in-home-page-header-scrolls`,
//     `feature-in-featured-customers-section`, `featured-on-cs-page`.
//   - VideoLink: `video-testimonial-if-available` returns
//     `{ url, metadata }`. Extract `.url` and run through
//     `decodeHtmlEntities` (e.g. `&amp;title=0` → `&title=0`).
//   - Content slugs use `the-` prefix: `the-customer-content`,
//     `the-problem-content`, `the-solution-content`, `the-impact-content`.
//   - Quote slugs use triple-dash: `problem-quote---paragraph`, etc.
//   - `video-testimonial-intro-content` (NOT `video-intro-content`).
//
// Problem / Solution / Impact packing rules (brief §6):
//   - Pack each section INDEPENDENTLY. Quote is NOT gated on content
//     presence — if content is empty but quote exists, still emit the
//     quote. The brief explicitly fixes this from v1.0.
//   - Fill rate reality: 3/18 full narratives + 4/18 impact-quote-only +
//     11/18 empty shells.
//
// Schema does NOT have source/generatedAt/needsReview fields; tracking
// happens via the carryover table in §7 of the brief, not in-Sanity.
//
// `video-url-2` is DROPPED per design decision §3.6 / D5.
// `metaTitle` / `metaDescription` / `openGraphImage` left null —
// backfill in CONTENT-1D.
import { ensureSanity, ensureWebflow } from '@/lib/env'
import { CE_COLLECTION_IDS } from '@/lib/content/ce-collection-ids'
import {
  decodeHtmlEntities,
  toPortableText,
  uploadImage,
  webflowSlug,
} from '@/lib/content/migration-helpers'
import { recordMigration } from '@/lib/content/migration-tracker'
import { sanityWriteClient } from '@/lib/content/sanity-write-client'
import { getCollectionItems } from '@/lib/content/webflow-read-client'

ensureSanity()
ensureWebflow()

function nonEmpty(s: unknown): string | null {
  return typeof s === 'string' && s.trim() !== '' ? s : null
}

function extractVideoUrl(field: unknown): string | null {
  if (!field || typeof field !== 'object') return null
  const url = (field as Record<string, unknown>)['url']
  if (typeof url !== 'string' || url.trim() === '') return null
  return decodeHtmlEntities(url)
}

type Section = {
  content: unknown[] | null
  quote:
    | {
        paragraph: string | null
        personImage: unknown | null
        personName: string | null
        personTitle: string | null
      }
    | null
} | null

async function packSection(
  f: Record<string, unknown>,
  contentField: string,
  quotePrefix: string,
): Promise<Section> {
  const content = await toPortableText(f[contentField])
  const hasContent = Array.isArray(content) && content.length > 0
  const quoteParagraph = nonEmpty(f[`${quotePrefix}---paragraph`])
  const quoteImage = await uploadImage(f[`${quotePrefix}---person-image`])
  const quoteName = nonEmpty(f[`${quotePrefix}---person-name`])
  const quoteTitle = nonEmpty(f[`${quotePrefix}---person-title`])

  const hasQuote = !!(quoteParagraph || quoteImage || quoteName || quoteTitle)
  if (!hasContent && !hasQuote) return null

  return {
    content: hasContent ? content : null,
    quote: hasQuote
      ? {
          paragraph: quoteParagraph,
          personImage: quoteImage,
          personName: quoteName,
          personTitle: quoteTitle,
        }
      : null,
  }
}

async function migrateCustomerStories(): Promise<void> {
  const items = await getCollectionItems(CE_COLLECTION_IDS.customerStories)
  let migrated = 0
  const errors: string[] = []
  let emptyShells = 0

  for (const item of items) {
    try {
      const f = item.fieldData

      const problem = await packSection(f, 'the-problem-content', 'problem-quote')
      const solution = await packSection(f, 'the-solution-content', 'solution-quote')
      const impact = await packSection(f, 'the-impact-content', 'impact-quote')

      // Empty-shell detection — informational only. No needsReview field
      // on customerStory schema.
      const isEmptyShell = !problem && !solution && !impact
      if (isEmptyShell) emptyShells++

      const doc = {
        _id: `customerStory-${item.id}`,
        _type: 'customerStory',
        companyName: (f['name'] as string) ?? null,
        customerStoryTitle: (f['customer-story-title'] as string) ?? null,
        slug: { _type: 'slug', current: webflowSlug(item) },
        order: typeof f['order'] === 'number' ? (f['order'] as number) : null,
        featureInHomeHeader: (f['feature-in-home-page-header-scrolls'] as boolean) ?? false,
        featureInFeaturedCustomers: (f['feature-in-featured-customers-section'] as boolean) ?? false,
        featuredOnCustomerStoriesPage: (f['featured-on-cs-page'] as boolean) ?? false,
        companyLogo: await uploadImage(f['company-logo']),
        companyProductImage: await uploadImage(f['company-product-image']),
        companyPeopleImage: await uploadImage(f['company-people-image']),
        thumbnail: await uploadImage(f['thumbnail']),
        videoUrl: extractVideoUrl(f['video-testimonial-if-available']),
        videoIntroContent: await toPortableText(f['video-testimonial-intro-content']),
        tldrContent: await toPortableText(f['tldr-content']),
        hiringNeedsTable: await toPortableText(f['hiring-needs-table']),
        theCustomerContent: await toPortableText(f['the-customer-content']),
        problem,
        solution,
        impact,
        ctaContent: await toPortableText(f['cta-content']),
        reviewSnippetForMeta: nonEmpty(f['review-snippet-for-google-meta']),
        // CONTENT-1D backfill.
        metaTitle: null,
        metaDescription: null,
        openGraphImage: null,
        locale: 'default',
      }
      await sanityWriteClient.createOrReplace(doc)
      migrated++
      const status = isEmptyShell
        ? '[empty shell — content pending]'
        : `[problem=${problem ? 'y' : '·'}, solution=${solution ? 'y' : '·'}, impact=${impact ? 'y' : '·'}]`
      console.log(`✓ customerStory: ${doc.companyName ?? doc.customerStoryTitle ?? item.id} ${status}`)
    } catch (err) {
      const msg = `Failed customerStory ${item.id}: ${err instanceof Error ? err.message : String(err)}`
      errors.push(msg)
      console.error(`✗ ${msg}`)
    }
  }

  await recordMigration({
    collectionSlug: 'customer-stories',
    sourceItemCount: items.length,
    migratedItemCount: migrated,
    status: errors.length === 0 ? 'complete' : 'failed',
    errorLog: errors,
  })

  console.log(
    `\nCustomer Stories: ${migrated}/${items.length} migrated. Empty shells: ${emptyShells}. Errors: ${errors.length}`,
  )
  if (errors.length > 0) process.exit(1)
}

migrateCustomerStories().catch((err) => {
  console.error(err)
  process.exit(1)
})

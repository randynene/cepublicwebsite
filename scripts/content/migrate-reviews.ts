// Migrates the Webflow `reviews` collection into Sanity `review`
// documents. Field mapping per WEBFLOW_TO_SANITY_FIELD_MAP §7 with the
// CONTENT-1B brief correction (Jake-approved 2026-04-28):
// - Sanity `nameClient` ← Webflow `name-client` (the actual client's
//   personal name, e.g. "Euan Cameron"). Webflow `name` is the
//   company name and is dropped — there is no Sanity destination for
//   it on the current `review` schema.
// - `featured-in-which-page` and `webpage-for-testimonial` are
//   dropped per the field map.
// - metaTitle / metaDescription deferred to CONTENT-1C backfill.
import { ensureSanity, ensureWebflow } from '@/lib/env'
import { CE_COLLECTION_IDS } from '@/lib/content/ce-collection-ids'
import {
  toPortableText,
  uploadImage,
  webflowSlug,
} from '@/lib/content/migration-helpers'
import { recordMigration } from '@/lib/content/migration-tracker'
import { sanityWriteClient } from '@/lib/content/sanity-write-client'
import { getCollectionItems } from '@/lib/content/webflow-read-client'

ensureSanity()
ensureWebflow()

async function migrateReviews(): Promise<void> {
  const items = await getCollectionItems(CE_COLLECTION_IDS.reviews)
  let migrated = 0
  const errors: string[] = []

  for (const item of items) {
    try {
      const f = item.fieldData
      const nameClient = (f['name-client'] as string) ?? null
      if (!nameClient) {
        throw new Error(`Missing name-client (clientName) on review ${item.id}`)
      }
      const doc = {
        _id: `review-${item.id}`,
        _type: 'review',
        nameClient,
        slug: { _type: 'slug', current: webflowSlug(item) },
        position: (f['position'] as string) ?? null,
        order: (f['order'] as number) ?? null,
        testimonyShort: (f['testimony-short'] as string) ?? null,
        testimonyParagraph: toPortableText(f['testimony-paragraph-2']),
        testimonyFullPage: toPortableText(f['testimony-full-page']),
        snippetForMeta: (f['snippet-for-meta'] as string) ?? null,
        memberImage: await uploadImage(f['member-image']),
        companyLogo: await uploadImage(f['company-logo']),
        thumbnailImage: await uploadImage(f['thumbnail-image']),
        additionalInfo: toPortableText(f['additional-info']),
      }
      await sanityWriteClient.createOrReplace(doc)
      migrated++
      console.log(`✓ review: ${nameClient}`)
    } catch (err) {
      const msg = `Failed review ${item.id}: ${err instanceof Error ? err.message : String(err)}`
      errors.push(msg)
      console.error(`✗ ${msg}`)
    }
  }

  await recordMigration({
    collectionSlug: 'reviews',
    sourceItemCount: items.length,
    migratedItemCount: migrated,
    status: errors.length === 0 ? 'complete' : 'failed',
    errorLog: errors,
  })

  console.log(`\nReviews: ${migrated}/${items.length} migrated. Errors: ${errors.length}`)
  if (errors.length > 0) process.exit(1)
}

migrateReviews().catch((err) => {
  console.error(err)
  process.exit(1)
})

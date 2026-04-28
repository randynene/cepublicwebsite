// Migrates the Webflow `-- Glassdoor reviews` collection into Sanity
// `glassdoorReview` documents. Field mapping per WEBFLOW_TO_SANITY_FIELD_MAP §14.
import { ensureSanity, ensureWebflow } from '@/lib/env'
import { CE_COLLECTION_IDS } from '@/lib/content/ce-collection-ids'
import { recordMigration } from '@/lib/content/migration-tracker'
import { sanityWriteClient } from '@/lib/content/sanity-write-client'
import { getCollectionItems } from '@/lib/content/webflow-read-client'

ensureSanity()
ensureWebflow()

async function migrateGlassdoorReviews(): Promise<void> {
  const items = await getCollectionItems(CE_COLLECTION_IDS.glassdoorReviews)
  const errors: string[] = []
  let migrated = 0

  for (const item of items) {
    try {
      const clientName = item.fieldData['name'] as string
      const title = item.fieldData['title'] as string | undefined
      const reviewDescription = item.fieldData['review-description'] as string | undefined
      const workField = item.fieldData['work-field'] as string | undefined

      const doc = {
        _id: `glassdoorReview-${item.id}`,
        _type: 'glassdoorReview',
        clientName,
        slug: { _type: 'slug', current: item.slug },
        ...(title ? { title } : {}),
        ...(reviewDescription ? { reviewDescription } : {}),
        ...(workField ? { workField } : {}),
      }
      await sanityWriteClient.createOrReplace(doc)
      migrated++
      console.log(`✓ glassdoorReview: ${clientName}`)
    } catch (err) {
      const msg = `Failed glassdoorReview ${item.id}: ${err instanceof Error ? err.message : String(err)}`
      errors.push(msg)
      console.error(`✗ ${msg}`)
    }
  }

  await recordMigration({
    collectionSlug: 'glassdoor-reviews',
    sourceItemCount: items.length,
    migratedItemCount: migrated,
    status: errors.length === 0 ? 'complete' : 'failed',
    errorLog: errors,
  })

  console.log(`\nGlassdoor reviews: ${migrated}/${items.length} migrated. Errors: ${errors.length}`)
  if (errors.length > 0) process.exit(1)
}

migrateGlassdoorReviews().catch((err) => {
  console.error(err)
  process.exit(1)
})

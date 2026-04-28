// Migrates the Webflow Hubs collection into Sanity `blogCategory` documents
// (D13 / WEBFLOW_TO_SANITY_FIELD_MAP §18). The blogHub singletons are seeded
// separately and live as stubs already.
//
// Order is intentionally left unset; Seb sets ordering in Studio post-migration.
import { ensureSanity, ensureWebflow } from '@/lib/env'
import { CE_COLLECTION_IDS } from '@/lib/content/ce-collection-ids'
import { webflowSlug } from '@/lib/content/migration-helpers'
import { recordMigration } from '@/lib/content/migration-tracker'
import { sanityWriteClient } from '@/lib/content/sanity-write-client'
import { getCollectionItems } from '@/lib/content/webflow-read-client'

ensureSanity()
ensureWebflow()

async function migrateBlogCategories(): Promise<void> {
  const items = await getCollectionItems(CE_COLLECTION_IDS.hubs)
  const errors: string[] = []
  let migrated = 0

  for (const item of items) {
    try {
      const name = item.fieldData['name'] as string
      const doc = {
        _id: `blogCategory-${item.id}`,
        _type: 'blogCategory',
        name,
        slug: { _type: 'slug', current: webflowSlug(item) },
      }
      await sanityWriteClient.createOrReplace(doc)
      migrated++
      console.log(`✓ blogCategory: ${name}`)
    } catch (err) {
      const msg = `Failed blogCategory ${item.id}: ${err instanceof Error ? err.message : String(err)}`
      errors.push(msg)
      console.error(`✗ ${msg}`)
    }
  }

  await recordMigration({
    collectionSlug: 'blog-categories',
    sourceItemCount: items.length,
    migratedItemCount: migrated,
    status: errors.length === 0 ? 'complete' : 'failed',
    errorLog: errors,
  })

  console.log(`\nBlog categories: ${migrated}/${items.length} migrated. Errors: ${errors.length}`)
  if (errors.length > 0) process.exit(1)
}

migrateBlogCategories().catch((err) => {
  console.error(err)
  process.exit(1)
})

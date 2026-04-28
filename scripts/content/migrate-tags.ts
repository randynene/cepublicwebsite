// Migrates the 6 Webflow Tags collections into a single Sanity `tag` document
// type with a `category` field (D2 / WEBFLOW_TO_SANITY_FIELD_MAP §17).
// Total source items: 22.
import { ensureSanity, ensureWebflow } from '@/lib/env'
import { CE_COLLECTION_IDS } from '@/lib/content/ce-collection-ids'
import { webflowSlug } from '@/lib/content/migration-helpers'
import { recordMigration } from '@/lib/content/migration-tracker'
import { sanityWriteClient } from '@/lib/content/sanity-write-client'
import { getCollectionItems } from '@/lib/content/webflow-read-client'

ensureSanity()
ensureWebflow()

const CATEGORY_MAP = {
  tagsBlogs: 'blogs',
  tagsAlternatives: 'alternatives',
  tagsTools: 'tools',
  tagsVideoLibrary: 'videoLibrary',
  tagsDownloads: 'downloads',
  tagsEventsWebinars: 'eventsWebinars',
} as const

async function migrateTags(): Promise<void> {
  let totalSource = 0
  let totalMigrated = 0
  const errors: string[] = []

  for (const [key, category] of Object.entries(CATEGORY_MAP)) {
    const collectionId = CE_COLLECTION_IDS[key as keyof typeof CATEGORY_MAP]
    const items = await getCollectionItems(collectionId)
    totalSource += items.length

    for (const item of items) {
      try {
        const name = item.fieldData['name'] as string
        const singularName = item.fieldData['singular-name'] as string | undefined
        const doc = {
          _id: `tag-${item.id}`,
          _type: 'tag',
          name,
          slug: { _type: 'slug', current: webflowSlug(item) },
          category,
          ...(category === 'eventsWebinars' && singularName
            ? { singularName }
            : {}),
        }

        await sanityWriteClient.createOrReplace(doc)
        totalMigrated++
        console.log(`✓ tag: ${name} [${category}]`)
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
  if (errors.length > 0) process.exit(1)
}

migrateTags().catch((err) => {
  console.error(err)
  process.exit(1)
})

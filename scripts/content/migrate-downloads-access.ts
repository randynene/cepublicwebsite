// Migrates the Webflow `download-thank-you` collection into Sanity
// `downloadAccess` documents. Field mapping per
// WEBFLOW_TO_SANITY_FIELD_MAP §10.
//
// Routing: /download-thank-you/[slug] is noindex/nofollow per §3.12.
// Schema applies that meta at render time; nothing collection-level here.
import { ensureSanity, ensureWebflow } from '@/lib/env'
import { CE_COLLECTION_IDS } from '@/lib/content/ce-collection-ids'
import {
  extractUrl,
  webflowSlug,
} from '@/lib/content/migration-helpers'
import { recordMigration } from '@/lib/content/migration-tracker'
import { sanityWriteClient } from '@/lib/content/sanity-write-client'
import { getCollectionItems } from '@/lib/content/webflow-read-client'

ensureSanity()
ensureWebflow()

async function migrateDownloadsAccess(): Promise<void> {
  const items = await getCollectionItems(CE_COLLECTION_IDS.downloadsAccess)
  let migrated = 0
  const errors: string[] = []

  for (const item of items) {
    try {
      const f = item.fieldData
      const downloadFileLink = extractUrl(f['download-file-link'])
      if (!downloadFileLink) {
        throw new Error(
          `downloadAccess ${item.id}: download-file-link is required but missing`,
        )
      }
      const doc = {
        _id: `downloadAccess-${item.id}`,
        _type: 'downloadAccess',
        name: f['name'] as string,
        slug: { _type: 'slug', current: webflowSlug(item) },
        downloadFileLink,
      }
      await sanityWriteClient.createOrReplace(doc)
      migrated++
      console.log(`✓ downloadAccess: ${doc.name}`)
    } catch (err) {
      const msg = `Failed downloadAccess ${item.id}: ${err instanceof Error ? err.message : String(err)}`
      errors.push(msg)
      console.error(`✗ ${msg}`)
    }
  }

  await recordMigration({
    collectionSlug: 'downloads-access',
    sourceItemCount: items.length,
    migratedItemCount: migrated,
    status: errors.length === 0 ? 'complete' : 'failed',
    errorLog: errors,
  })

  console.log(`\nDownloads access: ${migrated}/${items.length} migrated. Errors: ${errors.length}`)
  if (errors.length > 0) process.exit(1)
}

migrateDownloadsAccess().catch((err) => {
  console.error(err)
  process.exit(1)
})

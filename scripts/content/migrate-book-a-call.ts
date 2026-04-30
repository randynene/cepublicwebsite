// Migrates the Webflow `book-a-call` collection into Sanity `bookACall`
// documents. Field mapping per WEBFLOW_TO_SANITY_FIELD_MAP §12 — the
// Webflow `title` field is mislabelled and contains meta description
// copy (§3.14 / D9), so it maps to `metaDescription`.
import { ensureSanity, ensureWebflow } from '@/lib/env'
import { CE_COLLECTION_IDS } from '@/lib/content/ce-collection-ids'
import {
  toPortableText,
  webflowSlug,
} from '@/lib/content/migration-helpers'
import { recordMigration } from '@/lib/content/migration-tracker'
import { sanityWriteClient } from '@/lib/content/sanity-write-client'
import { getCollectionItems } from '@/lib/content/webflow-read-client'

ensureSanity()
ensureWebflow()

async function migrateBookACall(): Promise<void> {
  const items = await getCollectionItems(CE_COLLECTION_IDS.bookACall)
  let migrated = 0
  const errors: string[] = []

  for (const item of items) {
    try {
      const f = item.fieldData
      const doc = {
        _id: `bookACall-${item.id}`,
        _type: 'bookACall',
        firstName: f['name'] as string,
        lastName: (f['last-name'] as string) ?? null,
        slug: { _type: 'slug', current: webflowSlug(item) },
        calendlyEmbed: await toPortableText(f['calendly-embed']),
        metaDescription: (f['title'] as string) ?? null,
      }
      await sanityWriteClient.createOrReplace(doc)
      migrated++
      console.log(`✓ bookACall: ${doc.firstName} ${doc.lastName ?? ''}`.trim())
    } catch (err) {
      const msg = `Failed bookACall ${item.id}: ${err instanceof Error ? err.message : String(err)}`
      errors.push(msg)
      console.error(`✗ ${msg}`)
    }
  }

  await recordMigration({
    collectionSlug: 'book-a-call',
    sourceItemCount: items.length,
    migratedItemCount: migrated,
    status: errors.length === 0 ? 'complete' : 'failed',
    errorLog: errors,
  })

  console.log(`\nBook A Call: ${migrated}/${items.length} migrated. Errors: ${errors.length}`)
  if (errors.length > 0) process.exit(1)
}

migrateBookACall().catch((err) => {
  console.error(err)
  process.exit(1)
})

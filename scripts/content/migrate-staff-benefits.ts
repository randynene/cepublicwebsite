// Migrates the Webflow `-- Staff Benefits` collection into Sanity
// `staffBenefit` documents. Field mapping per WEBFLOW_TO_SANITY_FIELD_MAP §16.
//
// Image handling: brief §"Known Risks / Image fields" — store the Webflow CDN
// URL on a `webflowImageUrl` staging field. Asset upload is CONTENT-1C work.
import { ensureSanity, ensureWebflow } from '@/lib/env'
import { CE_COLLECTION_IDS } from '@/lib/content/ce-collection-ids'
import { webflowSlug } from '@/lib/content/migration-helpers'
import { recordMigration } from '@/lib/content/migration-tracker'
import { sanityWriteClient } from '@/lib/content/sanity-write-client'
import { getCollectionItems } from '@/lib/content/webflow-read-client'

ensureSanity()
ensureWebflow()

type WebflowImage = { url: string; alt: string | null; fileId?: string }

async function migrateStaffBenefits(): Promise<void> {
  const items = await getCollectionItems(CE_COLLECTION_IDS.staffBenefits)
  const errors: string[] = []
  let migrated = 0

  for (const item of items) {
    try {
      const name = item.fieldData['name'] as string
      const icon = item.fieldData['icon'] as WebflowImage | undefined

      const doc = {
        _id: `staffBenefit-${item.id}`,
        _type: 'staffBenefit',
        name,
        slug: { _type: 'slug', current: webflowSlug(item) },
        ...(icon?.url ? { webflowImageUrl: icon.url } : {}),
      }
      await sanityWriteClient.createOrReplace(doc)
      migrated++
      console.log(`✓ staffBenefit: ${name}`)
    } catch (err) {
      const msg = `Failed staffBenefit ${item.id}: ${err instanceof Error ? err.message : String(err)}`
      errors.push(msg)
      console.error(`✗ ${msg}`)
    }
  }

  await recordMigration({
    collectionSlug: 'staff-benefits',
    sourceItemCount: items.length,
    migratedItemCount: migrated,
    status: errors.length === 0 ? 'complete' : 'failed',
    errorLog: errors,
  })

  console.log(`\nStaff benefits: ${migrated}/${items.length} migrated. Errors: ${errors.length}`)
  if (errors.length > 0) process.exit(1)
}

migrateStaffBenefits().catch((err) => {
  console.error(err)
  process.exit(1)
})

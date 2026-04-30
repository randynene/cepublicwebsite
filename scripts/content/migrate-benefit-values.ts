// Migrates the Webflow `-- Client Benefits & Company Values` collection into
// Sanity `benefitValue` documents. Field mapping per
// WEBFLOW_TO_SANITY_FIELD_MAP §15.
//
// Image handling: brief §"Known Risks / Image fields" — store the Webflow CDN
// URL on a `webflowImageUrl` staging field. Asset upload is CONTENT-1C work.
//
// Webflow Option fields are stored as opaque IDs in fieldData; we resolve them
// to the option name by fetching the collection schema once up front.
import { ensureSanity, ensureWebflow } from '@/lib/env'
import { CE_COLLECTION_IDS } from '@/lib/content/ce-collection-ids'
import { fetchOptionIdMap, webflowSlug } from '@/lib/content/migration-helpers'
import { recordMigration } from '@/lib/content/migration-tracker'
import { sanityWriteClient } from '@/lib/content/sanity-write-client'
import { getCollectionItems } from '@/lib/content/webflow-read-client'

ensureSanity()
ensureWebflow()

const CATEGORY_VALUE_MAP: Record<string, 'benefits' | 'values'> = {
  benefits: 'benefits',
  values: 'values',
}

type WebflowImage = { url: string; alt: string | null; fileId?: string }

async function migrateBenefitValues(): Promise<void> {
  const optionMap = await fetchOptionIdMap(CE_COLLECTION_IDS.clientBenefits, 'category')
  const items = await getCollectionItems(CE_COLLECTION_IDS.clientBenefits)
  const errors: string[] = []
  let migrated = 0

  for (const item of items) {
    try {
      const name = item.fieldData['name'] as string
      const paragraph = item.fieldData['paragraph'] as string | undefined
      const categoryId = item.fieldData['category'] as string | undefined
      const categoryName = categoryId ? optionMap[categoryId] : undefined
      const categoryEnum = categoryName ? CATEGORY_VALUE_MAP[categoryName.toLowerCase()] : undefined

      if (!categoryEnum) {
        throw new Error(`Unmapped category id="${categoryId}" name="${categoryName}"`)
      }

      const thumbnail = item.fieldData['thumbnail-image'] as WebflowImage | undefined

      const doc = {
        _id: `benefitValue-${item.id}`,
        _type: 'benefitValue',
        name,
        slug: { _type: 'slug', current: webflowSlug(item) },
        category: categoryEnum,
        ...(paragraph ? { paragraph } : {}),
        ...(thumbnail?.url ? { webflowImageUrl: thumbnail.url } : {}),
      }
      await sanityWriteClient.createOrReplace(doc)
      migrated++
      console.log(`✓ benefitValue: ${name} [${categoryEnum}]`)
    } catch (err) {
      const msg = `Failed benefitValue ${item.id}: ${err instanceof Error ? err.message : String(err)}`
      errors.push(msg)
      console.error(`✗ ${msg}`)
    }
  }

  await recordMigration({
    collectionSlug: 'benefit-values',
    sourceItemCount: items.length,
    migratedItemCount: migrated,
    status: errors.length === 0 ? 'complete' : 'failed',
    errorLog: errors,
  })

  console.log(`\nBenefit values: ${migrated}/${items.length} migrated. Errors: ${errors.length}`)
  if (errors.length > 0) process.exit(1)
}

migrateBenefitValues().catch((err) => {
  console.error(err)
  process.exit(1)
})

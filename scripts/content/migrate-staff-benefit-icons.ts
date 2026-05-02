// CONTENT-1D §6.2 — staffBenefit.icon carryover.
//
// 6 docs hold the CONTENT-1A staging string `webflowImageUrl`. Upload
// each to Sanity, set `icon`, unset `webflowImageUrl` — all in a
// single .commit() transaction (F16).
import { sanityWriteClient } from '@/lib/content/sanity-write-client'
import { recordMigration } from '@/lib/content/migration-tracker'
import { uploadImage } from '@/lib/content/migration-helpers'

interface CarryoverDoc {
  _id: string
  webflowImageUrl?: string
  icon?: { asset?: { _ref?: string } } | null
}

async function main(): Promise<void> {
  const docs = await sanityWriteClient.fetch<CarryoverDoc[]>(
    `*[_type == "staffBenefit" && defined(webflowImageUrl)]{_id, webflowImageUrl, icon}`,
  )
  console.log(`[staffBenefit.icon] ${docs.length} docs with webflowImageUrl`)

  if (docs.length === 0) {
    await recordMigration({
      collectionSlug: 'image-carryover-staff-benefits',
      sourceItemCount: 0,
      migratedItemCount: 0,
      status: 'complete',
      errorLog: [],
    })
    console.log('Vacuous success — no carryover work; row recorded.')
    return
  }

  const errors: string[] = []
  let succeeded = 0

  for (const doc of docs) {
    if (doc.icon?.asset?._ref) {
      console.log(`  ${doc._id} already has icon — skipping`)
      succeeded++
      continue
    }
    if (!doc.webflowImageUrl) {
      console.log(`  ${doc._id} no webflowImageUrl — skipping`)
      continue
    }
    const asset = await uploadImage({ url: doc.webflowImageUrl })
    if (!asset) {
      try {
        await sanityWriteClient.patch(doc._id).set({ needsReview: true }).commit()
      } catch (e) {
        errors.push(`${doc._id}: upload failed AND needsReview patch failed: ${(e as Error).message}`)
        continue
      }
      errors.push(`${doc._id}: upload failed for ${doc.webflowImageUrl}`)
      console.log(`  ❌ ${doc._id} upload failed — needsReview=true patched`)
      continue
    }
    try {
      await sanityWriteClient
        .patch(doc._id)
        .set({ icon: asset })
        .unset(['webflowImageUrl'])
        .commit()
      succeeded++
      console.log(`  ✅ ${doc._id} icon uploaded`)
    } catch (e) {
      errors.push(`${doc._id}: same-commit set/unset failed: ${(e as Error).message}`)
      console.log(`  ❌ ${doc._id} commit failed: ${(e as Error).message}`)
    }
  }

  await recordMigration({
    collectionSlug: 'image-carryover-staff-benefits',
    sourceItemCount: docs.length,
    migratedItemCount: succeeded,
    status: errors.length === 0 ? 'complete' : 'failed',
    errorLog: errors,
  })
  console.log(`[staffBenefit.icon] succeeded=${succeeded}/${docs.length}, errors=${errors.length}`)
  if (errors.length > 0) process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

// CONTENT-1D §6.3 — video.backupImage CDN retry.
//
// Identifies videos missing backupImage but holding webflowImageUrl
// (the CONTENT-1B failure case). F20 vacuous-success ordering: when
// query returns 0 docs, record migration row (0/0/complete) BEFORE
// returning so the verifier's row-count check passes.
import { sanityWriteClient } from '@/lib/content/sanity-write-client'
import { recordMigration } from '@/lib/content/migration-tracker'
import { uploadImage } from '@/lib/content/migration-helpers'

interface CarryoverDoc {
  _id: string
  webflowImageUrl?: string
  backupImage?: { asset?: { _ref?: string } } | null
}

async function main(): Promise<void> {
  // Brief query: `*[_type == "video" && !defined(backupImage) && defined(webflowImageUrl)]`.
  const docs = await sanityWriteClient.fetch<CarryoverDoc[]>(
    `*[_type == "video" && !defined(backupImage) && defined(webflowImageUrl)]{_id, webflowImageUrl, backupImage}`,
  )
  console.log(`[video.backupImage retry] ${docs.length} docs need retry`)

  // F20 — vacuous-success ordering. Record migration row even with 0
  // docs so the verifier's 11-CONTENT-1D-row count holds.
  if (docs.length === 0) {
    await recordMigration({
      collectionSlug: 'image-carryover-video-backup',
      sourceItemCount: 0,
      migratedItemCount: 0,
      status: 'complete',
      errorLog: [],
    })
    console.log('Vacuous success — no video backupImage retry needed; row recorded.')
    return
  }

  const errors: string[] = []
  let succeeded = 0

  for (const doc of docs) {
    if (doc.backupImage?.asset?._ref) {
      console.log(`  ${doc._id} already has backupImage — skipping`)
      succeeded++
      continue
    }
    if (!doc.webflowImageUrl) continue
    const asset = await uploadImage({ url: doc.webflowImageUrl })
    if (!asset) {
      try {
        await sanityWriteClient.patch(doc._id).set({ needsReview: true }).commit()
      } catch (e) {
        errors.push(`${doc._id}: upload failed AND needsReview patch failed: ${(e as Error).message}`)
        continue
      }
      errors.push(`${doc._id}: upload retry failed for ${doc.webflowImageUrl}`)
      console.log(`  ❌ ${doc._id} retry upload failed — needsReview=true patched`)
      continue
    }
    try {
      await sanityWriteClient
        .patch(doc._id)
        .set({ backupImage: asset })
        .unset(['webflowImageUrl'])
        .commit()
      succeeded++
      console.log(`  ✅ ${doc._id} backupImage uploaded`)
    } catch (e) {
      errors.push(`${doc._id}: same-commit set/unset failed: ${(e as Error).message}`)
      console.log(`  ❌ ${doc._id} commit failed: ${(e as Error).message}`)
    }
  }

  await recordMigration({
    collectionSlug: 'image-carryover-video-backup',
    sourceItemCount: docs.length,
    migratedItemCount: succeeded,
    status: errors.length === 0 ? 'complete' : 'failed',
    errorLog: errors,
  })
  console.log(`[video.backupImage retry] succeeded=${succeeded}/${docs.length}, errors=${errors.length}`)
  if (errors.length > 0) process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

// CONTENT-1D §6.1 — benefitValue.thumbnailImage carryover.
//
// 9 docs hold the CONTENT-1A staging string `webflowImageUrl`. Upload
// each to Sanity's asset store, set `thumbnailImage`, unset
// `webflowImageUrl` — all in a single .commit() transaction (F16).
import { sanityWriteClient } from '@/lib/content/sanity-write-client'
import { recordMigration } from '@/lib/content/migration-tracker'
import { uploadImage } from '@/lib/content/migration-helpers'

interface CarryoverDoc {
  _id: string
  webflowImageUrl?: string
  thumbnailImage?: { asset?: { _ref?: string } } | null
}

async function main(): Promise<void> {
  const docs = await sanityWriteClient.fetch<CarryoverDoc[]>(
    `*[_type == "benefitValue" && defined(webflowImageUrl)]{_id, webflowImageUrl, thumbnailImage}`,
  )
  console.log(`[benefitValue.thumbnailImage] ${docs.length} docs with webflowImageUrl`)

  // F20 — vacuous-success ordering: record migration row even when 0
  // docs match, so the verifier's row-count check passes.
  if (docs.length === 0) {
    await recordMigration({
      collectionSlug: 'image-carryover-benefit-values',
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
    // F16 — idempotency check before upload. Re-run safety: if
    // thumbnailImage is already set, skip.
    if (doc.thumbnailImage?.asset?._ref) {
      console.log(`  ${doc._id} already has thumbnailImage — skipping`)
      succeeded++
      continue
    }
    if (!doc.webflowImageUrl) {
      console.log(`  ${doc._id} no webflowImageUrl — skipping`)
      continue
    }
    // uploadImage expects a Webflow-shaped image field {url, ...}.
    // We have a bare URL string; wrap it.
    const asset = await uploadImage({ url: doc.webflowImageUrl })
    if (!asset) {
      // F16 — on upload failure, only patch needsReview:true; do NOT
      // unset webflowImageUrl (a future re-run can retry the upload).
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
    // F16 — same-commit set/unset.
    try {
      await sanityWriteClient
        .patch(doc._id)
        .set({ thumbnailImage: asset })
        .unset(['webflowImageUrl'])
        .commit()
      succeeded++
      console.log(`  ✅ ${doc._id} thumbnailImage uploaded`)
    } catch (e) {
      errors.push(`${doc._id}: same-commit set/unset failed: ${(e as Error).message}`)
      console.log(`  ❌ ${doc._id} commit failed: ${(e as Error).message}`)
    }
  }

  await recordMigration({
    collectionSlug: 'image-carryover-benefit-values',
    sourceItemCount: docs.length,
    migratedItemCount: succeeded,
    status: errors.length === 0 ? 'complete' : 'failed',
    errorLog: errors,
  })
  console.log(`[benefitValue.thumbnailImage] succeeded=${succeeded}/${docs.length}, errors=${errors.length}`)
  if (errors.length > 0) process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

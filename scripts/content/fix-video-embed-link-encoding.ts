// CONTENT-1D §6.4 — video.mainVideoEmbedLink HTML-entity decode.
//
// Identifies videos whose mainVideoEmbedLink contains literal `&amp;`
// (the CONTENT-1B encoding bug) and replaces with decoded entities via
// decodeHtmlEntities. F20 vacuous-success ordering: 0 matches still
// records a migration row so the verifier's row-count check passes.
import { sanityWriteClient } from '@/lib/content/sanity-write-client'
import { recordMigration } from '@/lib/content/migration-tracker'
import { decodeHtmlEntities } from '@/lib/content/migration-helpers'

interface VideoDoc {
  _id: string
  mainVideoEmbedLink?: string
}

async function main(): Promise<void> {
  // Brief query: `*[_type == "video" && mainVideoEmbedLink match "*&amp;*"]`.
  // GROQ `match` with `*pattern*` is wildcard contains.
  const docs = await sanityWriteClient.fetch<VideoDoc[]>(
    `*[_type == "video" && mainVideoEmbedLink match "*&amp;*"]{_id, mainVideoEmbedLink}`,
  )
  console.log(`[video.mainVideoEmbedLink encoding] ${docs.length} docs need decoding`)

  if (docs.length === 0) {
    await recordMigration({
      collectionSlug: 'video-embed-link-encoding-fix',
      sourceItemCount: 0,
      migratedItemCount: 0,
      status: 'complete',
      errorLog: [],
    })
    console.log('Vacuous success — no encoding fix needed; row recorded.')
    return
  }

  const errors: string[] = []
  let succeeded = 0

  for (const doc of docs) {
    if (!doc.mainVideoEmbedLink) continue
    const decoded = decodeHtmlEntities(doc.mainVideoEmbedLink)
    if (decoded === doc.mainVideoEmbedLink) {
      // Idempotent re-run safety: GROQ matched but decode is a no-op.
      console.log(`  ${doc._id} already decoded — skipping`)
      succeeded++
      continue
    }
    try {
      await sanityWriteClient.patch(doc._id).set({ mainVideoEmbedLink: decoded }).commit()
      succeeded++
      console.log(`  ✅ ${doc._id} encoding fixed`)
    } catch (e) {
      errors.push(`${doc._id}: ${(e as Error).message}`)
      console.log(`  ❌ ${doc._id} patch failed: ${(e as Error).message}`)
    }
  }

  await recordMigration({
    collectionSlug: 'video-embed-link-encoding-fix',
    sourceItemCount: docs.length,
    migratedItemCount: succeeded,
    status: errors.length === 0 ? 'complete' : 'failed',
    errorLog: errors,
  })
  console.log(`[video.mainVideoEmbedLink encoding] succeeded=${succeeded}/${docs.length}, errors=${errors.length}`)
  if (errors.length > 0) process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

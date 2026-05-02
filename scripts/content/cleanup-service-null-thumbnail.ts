// CONTENT-1D-CLEANUP Op A — service.thumbnail unset (DEV-6).
//
// Brief deviation DEV-6 (Jake authorisation 2026-05-02):
// 23 service docs hold `thumbnail: null` from the CONTENT-1C migrator
// pattern (uploadImage() returns null when Webflow source field is
// empty; migrator wrote null literal rather than omitting the field
// via conditional spread). Studio's strict validation flags every
// such doc with "Invalid property value" because a null literal stored
// where the schema declares `image` doesn't match the expected type.
//
// Per-doc guard sequence — no patch unless every assertion passes:
//   1. doc fetched by exact _id
//   2. doc._type === 'service'
//   3. doc.thumbnail === null (literal null check; rules out:
//      someone uploaded a thumbnail image since the scope check)
// Then surgical .unset(['thumbnail']).commit() — no other field touched.
//
// Halt on first guard failure per the established Op-pattern.
import { sanityWriteClient } from '@/lib/content/sanity-write-client'
import { recordMigration } from '@/lib/content/migration-tracker'

async function main(): Promise<void> {
  console.log('=== Op A — service.thumbnail unset ===\n')

  // Re-fetch in-scope service _ids at runtime — don't trust a stale
  // hardcoded list. The full GROQ filter excludes smoke-test (none for
  // service, but consistent with established pattern).
  const docs = await sanityWriteClient.fetch<Array<{ _id: string }>>(
    `*[_type == "service" && !(_id match "smoke-test-*")]{_id} | order(_id asc)`,
  )
  console.log(`[service] ${docs.length} docs to process`)

  const errors: string[] = []
  const unsetIds: string[] = []

  for (const { _id: id } of docs) {
    try {
      const doc = await sanityWriteClient.getDocument(id)
      if (!doc) throw new Error('not found')
      if (doc._type !== 'service') {
        throw new Error(`_type mismatch: expected service, got ${doc._type}`)
      }
      const current = (doc as Record<string, unknown>).thumbnail
      if (current !== null) {
        throw new Error(
          `thumbnail is ${typeof current} (key present? ${'thumbnail' in (doc as Record<string, unknown>)}), expected null literal — state changed since scope check; halt for re-diagnosis.`,
        )
      }
      await sanityWriteClient.patch(id).unset(['thumbnail']).commit()
      unsetIds.push(id)
      console.log(`  ✅ ${id}: thumbnail unset`)
    } catch (e) {
      const msg = `${id}: ${(e as Error).message}`
      errors.push(msg)
      console.error(`  ❌ ${msg}`)
      // Halt on first guard failure per Op-pattern.
      break
    }
  }

  await recordMigration({
    collectionSlug: 'service-null-thumbnail-unset',
    sourceItemCount: docs.length,
    migratedItemCount: unsetIds.length,
    status: errors.length === 0 ? 'complete' : 'failed',
    errorLog: [
      'CONTENT-1D-CLEANUP Brief Deviation DEV-6 (authorised 2026-05-02): service.thumbnail null-literal cleanup.',
      'Migrator pattern: uploadImage() returned null on empty Webflow source; CONTENT-1C migrator wrote null literal. Studio flags Invalid property value.',
      `Per-doc guard sequence: _type === 'service' AND thumbnail === null literal.`,
      ...unsetIds.map((id) => `unset thumbnail: ${id}`),
      ...errors,
    ],
  })

  console.log(`\n[service-null-thumbnail-unset] unset=${unsetIds.length}/${docs.length}, errors=${errors.length}`)
  if (errors.length > 0) process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

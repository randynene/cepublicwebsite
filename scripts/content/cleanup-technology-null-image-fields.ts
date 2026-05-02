// CONTENT-1D-CLEANUP Op B — technology.{techLogo,thumbnail} unset (DEV-6).
//
// Brief deviation DEV-6 — same migrator pattern as Op A but for
// technology docs:
//   - techLogo: 2 of 101 docs hold null literal (the 2 Webflow source
//     items where tech-logo is missing).
//   - thumbnail: 101 of 101 docs hold null literal (Webflow source 0%
//     populated for thumbnail across the entire collection).
//
// Per-doc guard sequence (atomic: 1 patch.commit per doc covers
// 1–2 fields based on which targets apply):
//   1. doc fetched by exact _id
//   2. doc._type === 'technology'
//   3. For thumbnail: doc.thumbnail === null literal (applies to all)
//   4. For techLogo: only when _id ∈ TECHLOGO_NULL_IDS, doc.techLogo === null literal
// Then surgical .unset([...]) on the collected fields.
import { sanityWriteClient } from '@/lib/content/sanity-write-client'
import { recordMigration } from '@/lib/content/migration-tracker'

// Hardcoded from the scope-check output (diag-1d-cleanup-scope.ts run
// 2026-05-02). 2 of 101 technology docs have techLogo === null.
const TECHLOGO_NULL_IDS = new Set<string>([
  'technology-685d6a68391b571d12d62ccf',
  'technology-685d6a68795f734ced0f53b9',
])

async function main(): Promise<void> {
  console.log('=== Op B — technology.{techLogo,thumbnail} unset ===\n')

  const docs = await sanityWriteClient.fetch<Array<{ _id: string }>>(
    `*[_type == "technology" && !(_id match "smoke-test-*")]{_id} | order(_id asc)`,
  )
  console.log(`[technology] ${docs.length} docs to process`)

  const errors: string[] = []
  let thumbnailUnsetCount = 0
  let techLogoUnsetCount = 0

  for (const { _id: id } of docs) {
    try {
      const doc = await sanityWriteClient.getDocument(id)
      if (!doc) throw new Error('not found')
      if (doc._type !== 'technology') {
        throw new Error(`_type mismatch: expected technology, got ${doc._type}`)
      }
      const docRec = doc as Record<string, unknown>

      const fieldsToUnset: string[] = []

      // thumbnail — applies to every technology doc.
      if (docRec.thumbnail !== null) {
        throw new Error(
          `thumbnail is ${typeof docRec.thumbnail}, expected null literal — state changed since scope check.`,
        )
      }
      fieldsToUnset.push('thumbnail')

      // techLogo — only the 2 known _ids.
      if (TECHLOGO_NULL_IDS.has(id)) {
        if (docRec.techLogo !== null) {
          throw new Error(
            `techLogo is ${typeof docRec.techLogo} on a doc the scope check said had null — state changed; halt for re-diagnosis.`,
          )
        }
        fieldsToUnset.push('techLogo')
      } else {
        // Defensive: scope check said this _id has techLogo non-null;
        // verify that's still true so we don't silently mask drift.
        if (docRec.techLogo === null) {
          throw new Error(
            `techLogo is null on a doc not in TECHLOGO_NULL_IDS — scope expanded since scope check; halt for re-diagnosis.`,
          )
        }
      }

      await sanityWriteClient.patch(id).unset(fieldsToUnset).commit()
      thumbnailUnsetCount++
      if (fieldsToUnset.includes('techLogo')) techLogoUnsetCount++
      console.log(`  ✅ ${id}: unset [${fieldsToUnset.join(', ')}]`)
    } catch (e) {
      const msg = `${id}: ${(e as Error).message}`
      errors.push(msg)
      console.error(`  ❌ ${msg}`)
      break
    }
  }

  await recordMigration({
    collectionSlug: 'technology-null-image-fields-unset',
    sourceItemCount: docs.length,
    migratedItemCount: thumbnailUnsetCount,
    status: errors.length === 0 ? 'complete' : 'failed',
    errorLog: [
      'CONTENT-1D-CLEANUP Brief Deviation DEV-6 (authorised 2026-05-02): technology.{techLogo,thumbnail} null-literal cleanup.',
      `Atomic per-doc patches covering 1–2 fields each. thumbnail unset on ${thumbnailUnsetCount} docs (every doc); techLogo unset on ${techLogoUnsetCount} docs.`,
      'Migrator pattern as Op A. Per-doc guards: _type === "technology" AND target fields === null literal AND scope-membership consistency check.',
      ...errors,
    ],
  })

  console.log(
    `\n[technology-null-image-fields-unset] thumbnail unset=${thumbnailUnsetCount}/${docs.length}, techLogo unset=${techLogoUnsetCount}/${TECHLOGO_NULL_IDS.size}, errors=${errors.length}`,
  )
  if (errors.length > 0) process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

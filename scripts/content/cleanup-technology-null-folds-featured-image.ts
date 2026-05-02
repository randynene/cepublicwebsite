// CONTENT-1D-CLEANUP Op C — technology.folds[].featuredImage path-patch
// unset (DEV-6).
//
// Brief deviation DEV-6 — nested-field instance of the same migrator
// pattern. ~100 fold entries across 100+ technology docs hold
// `featuredImage: null` because the CONTENT-1C migrator wrote the
// uploadImage() return value (null when Webflow source was empty) into
// every fold object that survived `foldHasContent()`. For technology,
// fold-1 has other content (header, paragraph, bullets) that keeps the
// fold alive even when fold-1's featured image was unpopulated; the
// null featuredImage rides along.
//
// Path-patch primitive — establishes a new convention:
//   client.patch(id).unset(['folds[_key=="fold-1"].featuredImage']).commit()
//
// Per-doc guard sequence:
//   1. doc fetched by exact _id
//   2. doc._type === 'technology'
//   3. doc.folds is an array
//   4. Walk folds[], for each fold object:
//      - skip if 'featuredImage' not in fold (already absent)
//      - skip if featuredImage is non-null (valid image)
//      - throw if _key is missing/non-string (cannot construct path)
//      - collect _key into targetKeys
//   5. If targetKeys is empty, skip patch entirely (nothing to do).
//   6. Issue ONE atomic patch with all collected paths.
//
// The 'featuredImage' in f → featuredImage !== null progression
// distinguishes three cases: absent (skip), valid (skip), null (target).
import { sanityWriteClient } from '@/lib/content/sanity-write-client'
import { recordMigration } from '@/lib/content/migration-tracker'

interface FoldEntry {
  _key?: unknown
  type?: unknown
  featuredImage?: unknown
}

async function main(): Promise<void> {
  console.log('=== Op C — technology.folds[].featuredImage path-patch unset ===\n')

  const docs = await sanityWriteClient.fetch<Array<{ _id: string }>>(
    `*[_type == "technology" && !(_id match "smoke-test-*")]{_id} | order(_id asc)`,
  )
  console.log(`[technology] ${docs.length} docs to scan for fold-level null entries`)

  const errors: string[] = []
  let docsPatched = 0
  let totalUnsets = 0
  const docsWithoutWork: string[] = []

  for (const { _id: id } of docs) {
    try {
      const doc = await sanityWriteClient.getDocument(id)
      if (!doc) throw new Error('not found')
      if (doc._type !== 'technology') {
        throw new Error(`_type mismatch: expected technology, got ${doc._type}`)
      }
      const folds = (doc as Record<string, unknown>).folds
      if (folds === undefined || folds === null) {
        // Doc has no folds — schema requires folds.min(1), so this
        // would be a separate problem. Surface, don't proceed.
        throw new Error(`folds is ${typeof folds} — expected array (schema requires folds.min(1))`)
      }
      if (!Array.isArray(folds)) {
        throw new Error(`folds is not an array (got ${typeof folds})`)
      }

      const targetKeys: string[] = []
      for (const fold of folds as FoldEntry[]) {
        if (!fold || typeof fold !== 'object') continue
        if (!('featuredImage' in fold)) continue
        if (fold.featuredImage !== null) continue
        // Need a string _key to construct the path patch.
        if (typeof fold._key !== 'string' || fold._key.length === 0) {
          throw new Error(
            `fold with featuredImage:null has missing/invalid _key (got ${JSON.stringify(fold._key)}) — cannot path-patch`,
          )
        }
        targetKeys.push(fold._key)
      }

      if (targetKeys.length === 0) {
        docsWithoutWork.push(id)
        continue
      }

      const paths = targetKeys.map((k) => `folds[_key=="${k}"].featuredImage`)
      await sanityWriteClient.patch(id).unset(paths).commit()
      docsPatched++
      totalUnsets += paths.length
      console.log(`  ✅ ${id}: unset ${paths.length} fold(s) [keys=${targetKeys.join(', ')}]`)
    } catch (e) {
      const msg = `${id}: ${(e as Error).message}`
      errors.push(msg)
      console.error(`  ❌ ${msg}`)
      break
    }
  }

  await recordMigration({
    collectionSlug: 'technology-null-folds-featured-image-unset',
    sourceItemCount: docs.length,
    migratedItemCount: docsPatched,
    status: errors.length === 0 ? 'complete' : 'failed',
    errorLog: [
      'CONTENT-1D-CLEANUP Brief Deviation DEV-6 (authorised 2026-05-02): technology.folds[].featuredImage null-literal cleanup.',
      'Path-patch primitive: client.patch(id).unset([\'folds[_key=="..."].featuredImage\']).',
      'Per-doc guards: _type === "technology" AND folds is array AND each in-scope fold entry has featuredImage === null AND _key is non-empty string.',
      `${docsPatched} docs patched (${totalUnsets} fold unsets total). ${docsWithoutWork.length} docs already clean (no fold-level null featuredImage).`,
      ...errors,
    ],
  })

  console.log(
    `\n[technology-null-folds-featured-image-unset] docsPatched=${docsPatched}/${docs.length}, totalUnsets=${totalUnsets}, alreadyClean=${docsWithoutWork.length}, errors=${errors.length}`,
  )
  if (errors.length > 0) process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

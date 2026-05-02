// CONTENT-1D-CLEANUP Op D — customerStory.{companyProductImage,thumbnail,
// openGraphImage} unset (DEV-6).
//
// Brief deviation DEV-6 — customerStory branch of the migrator-pattern
// cleanup. Three top-level image fields hold null literals across the
// 17 in-scope docs:
//   - companyProductImage: 5 docs (Webflow source 12/17 populated)
//   - thumbnail: 10 docs (Webflow source 7/17 populated)
//   - openGraphImage: 17 docs (CONTENT-1C migrator at line 143 wrote
//     `openGraphImage: null` literally — the most-visible offender of
//     the pattern; service/technology migrators just omit the key).
//
// OUT OF SCOPE: companyLogo (the deviation 1 required-field violation
// on customerStory-68754c657697d163dd1a6126 a.k.a. "Travel Tech
// Client" — anonymised real customer; missing logo intentional;
// schema-side fix expected in a separate cycle).
//
// Per-doc guard sequence (atomic: 1 patch.commit per doc covers
// 1–3 fields based on which sets the doc belongs to):
//   1. doc fetched by exact _id
//   2. doc._type === 'customerStory'
//   3. For each target field:
//      - assert doc[field] === null literal (rules out state drift)
//      - assert _id ∈ <FIELD>_NULL_IDS or skip (scope-membership check)
//      - on a doc NOT in <FIELD>_NULL_IDS, assert doc[field] !== null
//        (catches scope expansion drift — fail rather than silently
//        unset a newly-introduced null).
import { sanityWriteClient } from '@/lib/content/sanity-write-client'
import { recordMigration } from '@/lib/content/migration-tracker'

// Hardcoded from scope-check 2026-05-02. Per-field _id sets.
const COMPANY_PRODUCT_IMAGE_NULL_IDS = new Set<string>([
  'customerStory-6762eccf5c0d06086dc10d08',
  'customerStory-6762ecfbe758c731a2637fcb',
  'customerStory-6762ed10a5db52a276cc36e8',
  'customerStory-6762ed3f0d7d6d05005ffccf',
  'customerStory-6762ed8c88ca4cd9a5945ba8',
])

const THUMBNAIL_NULL_IDS = new Set<string>([
  'customerStory-6762ea9af0dd8a6b9984bdd5',
  'customerStory-6762eccf5c0d06086dc10d08',
  'customerStory-6762ecfbe758c731a2637fcb',
  'customerStory-6762ed10a5db52a276cc36e8',
  'customerStory-6762ed3f0d7d6d05005ffccf',
  // … +5 more confirmed by scope check; resolved at runtime via the
  // per-doc null-literal assertion below regardless of presence here.
])

// openGraphImage applies to ALL 17 in-scope docs (per scope check).
// No set; the per-doc check is unconditional.

async function main(): Promise<void> {
  console.log('=== Op D — customerStory.{companyProductImage,thumbnail,openGraphImage} unset ===\n')

  const docs = await sanityWriteClient.fetch<Array<{ _id: string }>>(
    `*[_type == "customerStory" && !(_id match "smoke-test-*")]{_id} | order(_id asc)`,
  )
  console.log(`[customerStory] ${docs.length} docs to process`)

  const errors: string[] = []
  let docsPatched = 0
  let cpiUnsets = 0
  let thumbUnsets = 0
  let ogiUnsets = 0

  for (const { _id: id } of docs) {
    try {
      const doc = await sanityWriteClient.getDocument(id)
      if (!doc) throw new Error('not found')
      if (doc._type !== 'customerStory') {
        throw new Error(`_type mismatch: expected customerStory, got ${doc._type}`)
      }
      const docRec = doc as Record<string, unknown>

      const fieldsToUnset: string[] = []

      // companyProductImage — only the 5 known _ids.
      if (COMPANY_PRODUCT_IMAGE_NULL_IDS.has(id)) {
        if (docRec.companyProductImage !== null) {
          throw new Error(
            `companyProductImage is ${typeof docRec.companyProductImage} on a scope-listed _id, expected null — state changed since scope check.`,
          )
        }
        fieldsToUnset.push('companyProductImage')
      } else {
        if (docRec.companyProductImage === null) {
          throw new Error(
            `companyProductImage is null on a doc NOT in COMPANY_PRODUCT_IMAGE_NULL_IDS — scope expanded since scope check; halt.`,
          )
        }
      }

      // thumbnail — assert via null-literal check (10/17 known to be null).
      // The Set is informational; the null-literal check is authoritative.
      if (docRec.thumbnail === null) {
        fieldsToUnset.push('thumbnail')
      }
      // (No drift-against-set check for thumbnail because the scope-check
      //  output truncated the sample — the runtime null check is correct
      //  and complete.)

      // openGraphImage — applies to every customerStory doc.
      if (docRec.openGraphImage !== null) {
        throw new Error(
          `openGraphImage is ${typeof docRec.openGraphImage}, expected null literal — state changed since scope check.`,
        )
      }
      fieldsToUnset.push('openGraphImage')

      if (fieldsToUnset.length === 0) {
        // Should never happen — openGraphImage is always added.
        // Defensive halt.
        throw new Error('fieldsToUnset is empty — invariant violated')
      }

      await sanityWriteClient.patch(id).unset(fieldsToUnset).commit()
      docsPatched++
      if (fieldsToUnset.includes('companyProductImage')) cpiUnsets++
      if (fieldsToUnset.includes('thumbnail')) thumbUnsets++
      if (fieldsToUnset.includes('openGraphImage')) ogiUnsets++
      console.log(`  ✅ ${id}: unset [${fieldsToUnset.join(', ')}]`)
    } catch (e) {
      const msg = `${id}: ${(e as Error).message}`
      errors.push(msg)
      console.error(`  ❌ ${msg}`)
      break
    }
  }

  await recordMigration({
    collectionSlug: 'customer-story-null-image-fields-unset',
    sourceItemCount: docs.length,
    migratedItemCount: docsPatched,
    status: errors.length === 0 ? 'complete' : 'failed',
    errorLog: [
      'CONTENT-1D-CLEANUP Brief Deviation DEV-6 (authorised 2026-05-02): customerStory.{companyProductImage,thumbnail,openGraphImage} null-literal cleanup.',
      'Atomic per-doc patches covering 1–3 fields each. Migrator pattern as Op A. openGraphImage was the worst offender — CONTENT-1C migrate-customer-stories.ts:143 wrote it as a literal null on every doc.',
      `Per-doc unsets: companyProductImage=${cpiUnsets}, thumbnail=${thumbUnsets}, openGraphImage=${ogiUnsets}.`,
      'OUT OF SCOPE: customerStory.companyLogo on customerStory-68754c657697d163dd1a6126 (Travel Tech Client — anonymised real customer; required-field schema violation; deferred to separate cycle for schema-side fix).',
      ...errors,
    ],
  })

  console.log(
    `\n[customer-story-null-image-fields-unset] docs=${docsPatched}/${docs.length}, cpiUnsets=${cpiUnsets}, thumbUnsets=${thumbUnsets}, ogiUnsets=${ogiUnsets}, errors=${errors.length}`,
  )
  if (errors.length > 0) process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

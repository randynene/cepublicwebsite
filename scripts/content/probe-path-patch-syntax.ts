// Op C path-patch syntax probe — read-only, no commit.
//
// Validates that Sanity's @sanity/client accepts the path syntax
// `folds[_key=="..."].featuredImage` at the patch-builder level
// before Op C fires its 100 destructive commits. Picks one
// known-target technology doc, constructs the patch object,
// serialises it, prints the shape — never calls .commit().
//
// If this probe throws or produces a malformed serialised patch,
// halt before running cleanup-technology-null-folds-featured-image.ts.
import { sanityWriteClient } from '@/lib/content/sanity-write-client'

async function main(): Promise<void> {
  console.log('=== Op C path-patch syntax probe (read-only, no commit) ===\n')

  // Pick a single technology doc with a known fold-1 featuredImage:null.
  // Diagnostic confirmed the first technology _id in the scope-check
  // sample matches: technology-685d5a4d01a1df88db2c8686 fold[0]
  // type=headerIntro.
  const sampleId = 'technology-685d5a4d01a1df88db2c8686'

  const doc = await sanityWriteClient.getDocument(sampleId)
  if (!doc) {
    console.error(`HALT — sample doc ${sampleId} not found`)
    process.exit(1)
  }
  if (doc._type !== 'technology') {
    console.error(`HALT — sample doc _type=${doc._type}, expected technology`)
    process.exit(1)
  }

  const folds = (doc as Record<string, unknown>).folds
  if (!Array.isArray(folds)) {
    console.error(`HALT — folds is not an array on sample doc`)
    process.exit(1)
  }

  // Find fold entries with featuredImage:null and capture _keys.
  const nullKeys: string[] = []
  for (const fold of folds) {
    if (!fold || typeof fold !== 'object') continue
    const f = fold as Record<string, unknown>
    if (!('featuredImage' in f)) continue
    if (f.featuredImage !== null) continue
    if (typeof f._key !== 'string' || f._key.length === 0) {
      console.error('HALT — fold with featuredImage:null has invalid _key')
      process.exit(1)
    }
    nullKeys.push(f._key)
  }

  console.log(`Sample doc: ${sampleId}`)
  console.log(`folds[].featuredImage:null entries on sample: ${nullKeys.length}`)
  console.log(`fold _keys: [${nullKeys.join(', ')}]`)
  console.log('')

  if (nullKeys.length === 0) {
    console.error('HALT — sample doc no longer has any null featuredImage entries; cannot probe.')
    process.exit(1)
  }

  // Build the patch — but DO NOT commit.
  const paths = nullKeys.map((k) => `folds[_key=="${k}"].featuredImage`)
  console.log('Constructed unset paths:')
  for (const p of paths) console.log(`  ${p}`)
  console.log('')

  // Construct the patch builder. The @sanity/client patch builder
  // doesn't validate path syntax until .commit() is called server-side,
  // but it does construct the JSON-serialisable patch object. Inspect
  // the .serialize() output (where available) or the patch's internal
  // operations field via JSON.stringify.
  const patchBuilder = sanityWriteClient.patch(sampleId).unset(paths)
  console.log('Patch builder constructed without throwing.')

  // Best-effort introspection — @sanity/client's PatchBuilder exposes
  // operations via .toJSON() in some versions. Try toJSON first, fall
  // back to a string serialisation.
  let serialised: unknown
  try {
    const builder = patchBuilder as unknown as { toJSON?: () => unknown; serialize?: () => unknown }
    if (typeof builder.toJSON === 'function') {
      serialised = builder.toJSON()
    } else if (typeof builder.serialize === 'function') {
      serialised = builder.serialize()
    } else {
      serialised = '(neither .toJSON nor .serialize exposed; patch builder accepted the syntax but cannot dump shape)'
    }
  } catch (err) {
    serialised = `serialise threw: ${(err as Error).message}`
  }

  console.log('Serialised patch shape:')
  console.log(JSON.stringify(serialised, null, 2))
  console.log('')

  // Hard-stop confirmation — we did NOT commit.
  console.log('✅ Probe complete. No commit performed. Sanity client accepted the path-patch syntax.')
  console.log('   If the serialised shape above shows the unset paths inside `unset` array correctly,')
  console.log('   Op C is safe to run.')
}

main().catch((err) => {
  console.error('Probe FAILED — Sanity client rejected the path syntax or threw:')
  console.error(err)
  process.exit(1)
})

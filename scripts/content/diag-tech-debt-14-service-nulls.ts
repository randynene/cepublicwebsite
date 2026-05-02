// Tech Debt #14 read-only diagnostic — service docs Studio "Invalid
// property value" on null-valued non-primitive fields.
//
// For each of the 23 service docs, classify every schema-declared
// non-primitive field (image / reference / object / array / portableText)
// by its actual stored value:
//   - null               (the suspect — Studio flags as Invalid type)
//   - undefined          (field not on the doc — Studio happy)
//   - present (valid)    (proper shape)
//   - present (invalid)  (wrong shape; would also be Invalid)
//
// Cross-reference Webflow source field population from
// audit-output/ce-field-population.json so we can attribute each null
// to: (a) Webflow source empty, (b) migrator didn't write, (c) other.
//
// No writes. No schema mutations.
import * as fs from 'node:fs'
import * as path from 'node:path'

import { sanityWriteClient } from '@/lib/content/sanity-write-client'

const REPO_ROOT = process.cwd()

// Service schema — non-primitive fields per studio/schemas/documents/service.ts.
// Classification: 'required' when the schema has Rule.required(), else 'optional'.
interface FieldSpec {
  name: string
  schemaType: 'image' | 'reference' | 'object' | 'array' | 'portableText'
  required: boolean
  notes?: string
}

const NON_PRIMITIVE_FIELDS: FieldSpec[] = [
  // Top-level fields on service.
  { name: 'thumbnail', schemaType: 'image', required: false, notes: 'imageField helper, no required arg' },
  { name: 'associatedTechnologies', schemaType: 'array', required: false, notes: 'array of references to technology' },
  { name: 'folds', schemaType: 'array', required: true, notes: 'Rule.required().min(1)' },
  { name: 'openGraphImage', schemaType: 'image', required: false, notes: 'metaFields() default og: true' },
  { name: 'metaTitleSource', schemaType: 'object', required: false, notes: 'metaSourceFields helper, hidden' },
  { name: 'metaDescriptionSource', schemaType: 'object', required: false, notes: 'metaSourceFields helper, hidden' },
]

// Predicates per schemaType for "value is structurally valid".
function classifyValue(value: unknown, fs_: FieldSpec): { kind: string; detail: string } {
  if (value === null) return { kind: 'null', detail: 'null literal stored — Studio flags Invalid' }
  if (value === undefined) return { kind: 'undefined', detail: 'field absent — Studio happy' }

  switch (fs_.schemaType) {
    case 'image': {
      if (typeof value !== 'object' || Array.isArray(value)) {
        return { kind: 'invalid', detail: `not an object (got ${Array.isArray(value) ? 'array' : typeof value})` }
      }
      const v = value as Record<string, unknown>
      if (v.asset === undefined || v.asset === null) return { kind: 'invalid', detail: 'missing asset' }
      return { kind: 'valid', detail: 'image with asset' }
    }
    case 'array': {
      if (!Array.isArray(value)) return { kind: 'invalid', detail: `not an array (got ${typeof value})` }
      return { kind: 'valid', detail: `array(${value.length})` }
    }
    case 'object': {
      if (typeof value !== 'object' || Array.isArray(value)) {
        return { kind: 'invalid', detail: `not an object (got ${Array.isArray(value) ? 'array' : typeof value})` }
      }
      const k = Object.keys(value as object)
      return { kind: 'valid', detail: `object{${k.join(',')}}` }
    }
    case 'reference': {
      if (typeof value !== 'object' || Array.isArray(value)) {
        return { kind: 'invalid', detail: `not an object (got ${typeof value})` }
      }
      const v = value as Record<string, unknown>
      if (typeof v._ref !== 'string') return { kind: 'invalid', detail: 'missing _ref' }
      return { kind: 'valid', detail: `ref→${v._ref}` }
    }
    case 'portableText': {
      if (!Array.isArray(value)) return { kind: 'invalid', detail: `not an array (got ${typeof value})` }
      return { kind: 'valid', detail: `pt(${value.length} blocks)` }
    }
  }
}

// Walk fold[] and classify featuredImage (image) inside each fold object.
interface FoldNullEntry {
  docId: string
  foldKey: string
  foldType: string
  foldIndex: number
}

function findFoldFeaturedImageNulls(docId: string, folds: unknown): FoldNullEntry[] {
  if (!Array.isArray(folds)) return []
  const entries: FoldNullEntry[] = []
  folds.forEach((fold, i) => {
    if (!fold || typeof fold !== 'object') return
    const f = fold as Record<string, unknown>
    if (f.featuredImage === null) {
      entries.push({
        docId,
        foldKey: typeof f._key === 'string' ? f._key : `(no _key)`,
        foldType: typeof f.type === 'string' ? f.type : '(no type)',
        foldIndex: i,
      })
    }
  })
  return entries
}

interface FieldStats {
  field: string
  schemaType: string
  required: boolean
  nullCount: number
  undefinedCount: number
  validCount: number
  invalidCount: number
  nullDocIds: string[]
}

async function main(): Promise<void> {
  console.log('=== Tech Debt #14 — service doc null-field diagnostic ===\n')

  // Webflow source field population (cross-reference).
  type CollectionFP = {
    displayName?: string
    collectionSlug?: string
    totalItems?: number
    fields?: Array<{ slug: string; type: string; usPopulatedCount: number; usPopulatedRate: number }>
  }
  const fpRaw = JSON.parse(
    fs.readFileSync(path.join(REPO_ROOT, 'audit-output', 'ce-field-population.json'), 'utf-8'),
  ) as Record<string, unknown> | CollectionFP[]
  const fpArr: CollectionFP[] = Array.isArray(fpRaw)
    ? fpRaw
    : (Object.values(fpRaw) as CollectionFP[])
  const svcWebflow = fpArr.find((c) =>
    /service/i.test(c.displayName ?? c.collectionSlug ?? ''),
  )

  console.log('## Webflow source — Services field population (audit-output)\n')
  if (svcWebflow?.fields) {
    for (const f of svcWebflow.fields) {
      if (/Image|Reference/i.test(f.type)) {
        console.log(
          `  ${f.slug.padEnd(36)} ${String(f.type).padEnd(15)} ${f.usPopulatedCount}/${svcWebflow.totalItems} (${f.usPopulatedRate}%)`,
        )
      }
    }
  }
  console.log('')

  // Fetch all 23 service docs (smoke-test exclusion is moot — none for service).
  const docs = await sanityWriteClient.fetch<Array<Record<string, unknown> & { _id: string }>>(
    `*[_type == "service" && !(_id match "smoke-test-*")]{_id, name, slug, thumbnail, associatedTechnologies, folds, openGraphImage, metaTitleSource, metaDescriptionSource}`,
  )
  console.log(`## Sanity production — ${docs.length} service docs scanned\n`)

  // Stats per top-level non-primitive field.
  const stats: Record<string, FieldStats> = {}
  for (const f of NON_PRIMITIVE_FIELDS) {
    stats[f.name] = {
      field: f.name,
      schemaType: f.schemaType,
      required: f.required,
      nullCount: 0,
      undefinedCount: 0,
      validCount: 0,
      invalidCount: 0,
      nullDocIds: [],
    }
  }

  for (const doc of docs) {
    for (const fs_ of NON_PRIMITIVE_FIELDS) {
      const cls = classifyValue(doc[fs_.name], fs_)
      const s = stats[fs_.name]
      if (cls.kind === 'null') {
        s.nullCount++
        s.nullDocIds.push(doc._id)
      } else if (cls.kind === 'undefined') {
        s.undefinedCount++
      } else if (cls.kind === 'valid') {
        s.validCount++
      } else if (cls.kind === 'invalid') {
        s.invalidCount++
      }
    }
  }

  console.log('## Top-level non-primitive field — null vs undefined vs valid (per 23 docs)\n')
  console.log(
    '| field                     | schema      | required | null | undef | valid | invalid |',
  )
  console.log(
    '|---------------------------|-------------|----------|------|-------|-------|---------|',
  )
  for (const f of NON_PRIMITIVE_FIELDS) {
    const s = stats[f.name]
    console.log(
      `| ${f.name.padEnd(25)} | ${f.schemaType.padEnd(11)} | ${(f.required ? 'yes' : 'no').padEnd(8)} | ${String(s.nullCount).padStart(4)} | ${String(s.undefinedCount).padStart(5)} | ${String(s.validCount).padStart(5)} | ${String(s.invalidCount).padStart(7)} |`,
    )
  }
  console.log('')

  // Sample doc IDs per null field
  for (const f of NON_PRIMITIVE_FIELDS) {
    const s = stats[f.name]
    if (s.nullCount === 0) continue
    console.log(`  ${f.name}: ${s.nullCount}/${docs.length} docs hold null`)
    console.log(`    sample _ids: ${s.nullDocIds.slice(0, 5).join(', ')}${s.nullDocIds.length > 5 ? ` (+${s.nullDocIds.length - 5})` : ''}`)
  }
  console.log('')

  // Inspect folds[].featuredImage nulls — the array is required, but the
  // featuredImage inside each fold is an optional image field that the
  // migrator wrote as null when uploadImage returned null.
  console.log('## Nested — folds[].featuredImage null entries\n')
  const foldNulls: FoldNullEntry[] = []
  for (const doc of docs) {
    foldNulls.push(...findFoldFeaturedImageNulls(doc._id, doc.folds))
  }
  if (foldNulls.length === 0) {
    console.log('  No folds[].featuredImage null entries.')
  } else {
    console.log(`  ${foldNulls.length} fold entries hold featuredImage: null`)
    // Group by foldType to see which folds typically lack image
    const byType = new Map<string, number>()
    for (const e of foldNulls) byType.set(e.foldType, (byType.get(e.foldType) ?? 0) + 1)
    for (const [t, n] of [...byType.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`    foldType=${t}: ${n} entries`)
    }
    console.log('  sample:')
    for (const e of foldNulls.slice(0, 5)) {
      console.log(`    ${e.docId}  fold[${e.foldIndex}] _key=${e.foldKey} type=${e.foldType}`)
    }
    if (foldNulls.length > 5) console.log(`    … +${foldNulls.length - 5} more`)
  }
  console.log('')

  // Names of docs with thumbnail null — to surface which ones Studio flags.
  if (stats.thumbnail.nullCount > 0) {
    const sample = await sanityWriteClient.fetch<Array<{ _id: string; name?: string; slug?: { current?: string } }>>(
      `*[_id in $ids]{_id, name, "slug": slug.current}`,
      { ids: stats.thumbnail.nullDocIds.slice(0, 23) },
    )
    console.log('## Service docs with thumbnail: null (a representative sample)\n')
    for (const s of sample.slice(0, 10)) {
      console.log(`  ${s._id.padEnd(40)} name="${s.name}" slug="${s.slug}"`)
    }
    if (sample.length > 10) console.log(`  … +${sample.length - 10} more`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

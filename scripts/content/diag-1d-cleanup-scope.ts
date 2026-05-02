// CONTENT-1D-CLEANUP scope check — read-only.
//
// For each of {service, technology, customerStory}, find every
// schema-declared image field that holds a literal null value (key
// present, value null) — the buggy migrator pattern that trips
// Studio's "Invalid property value" warning.
//
// `defined()` and `field == null` in GROQ both conflate "absent" with
// "null literal", so we MUST inspect the raw doc shape via getDocument
// to distinguish. (See the Tech Debt #14 investigation report for
// the GROQ-projection false positive on openGraphImage.)
//
// Cross-reference Webflow source population from
// audit-output/ce-field-population.json to attribute each null to
// (a) Webflow source empty, or (b) migrator wrote null unconditionally.
//
// No writes. No schema mutations.
import * as fs from 'node:fs'
import * as path from 'node:path'

import { sanityWriteClient } from '@/lib/content/sanity-write-client'

const REPO_ROOT = process.cwd()

interface FieldSpec {
  // Sanity field path. Top-level fields are simple names; folds are
  // walked separately because they're array-of-objects; CS quote
  // images are walked under problem/solution/impact.
  name: string
  required: boolean
  // Webflow source slug to look up in ce-field-population.json (when
  // there's a 1:1 mapping). For openGraphImage there's no Webflow
  // source — it was a CONTENT-1D-introduced field.
  webflowSlug?: string
}

const TOP_LEVEL_IMAGE_FIELDS: Record<string, FieldSpec[]> = {
  service: [
    { name: 'thumbnail', required: false, webflowSlug: 'thumbnail' },
    { name: 'openGraphImage', required: false }, // schema-introduced, no Webflow source
  ],
  technology: [
    { name: 'techLogo', required: false, webflowSlug: 'tech-logo' },
    { name: 'thumbnail', required: false, webflowSlug: 'thumbnail' },
    { name: 'openGraphImage', required: false },
  ],
  customerStory: [
    { name: 'companyLogo', required: true, webflowSlug: 'company-logo' },
    { name: 'companyProductImage', required: false, webflowSlug: 'company-product-image' },
    { name: 'companyPeopleImage', required: false, webflowSlug: 'company-people-image' },
    { name: 'thumbnail', required: false, webflowSlug: 'thumbnail' },
    { name: 'openGraphImage', required: false },
  ],
}

interface FieldStats {
  type: string
  field: string
  total: number
  keyPresent: number
  keyAbsent: number
  nullLiteral: number  // ← the buggy case
  validImage: number
  invalidShape: number
  nullDocIds: string[]
}

function classifyDocFieldValue(doc: Record<string, unknown>, key: string): 'absent' | 'null' | 'valid-image' | 'invalid' {
  if (!(key in doc)) return 'absent'
  const v = doc[key]
  if (v === null) return 'null'
  if (typeof v === 'object' && !Array.isArray(v)) {
    const asset = (v as Record<string, unknown>).asset
    if (asset !== undefined && asset !== null) return 'valid-image'
    return 'invalid'
  }
  return 'invalid'
}

interface FoldNullEntry {
  docId: string
  type: string
  foldIndex: number
  foldKey: string
  foldType: string
}

interface QuoteNullEntry {
  docId: string
  section: 'problem' | 'solution' | 'impact'
}

async function main(): Promise<void> {
  console.log('=== CONTENT-1D-CLEANUP scope check ===\n')

  // ---------- Webflow source cross-reference ----------
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
  const wfBySanityType: Record<string, CollectionFP | undefined> = {
    service: fpArr.find((c) => /^services?$/i.test(c.collectionSlug ?? '') || /^services$/i.test(c.displayName ?? '')),
    technology: fpArr.find((c) => /technology/i.test(c.displayName ?? c.collectionSlug ?? '')),
    customerStory: fpArr.find((c) => /customer/i.test(c.displayName ?? c.collectionSlug ?? '')),
  }

  console.log('## Webflow source — image-field population (audit-output)\n')
  for (const [t, c] of Object.entries(wfBySanityType)) {
    if (!c?.fields) {
      console.log(`  ${t}: collection not found in audit-output`)
      continue
    }
    console.log(`  ${t} (${c.totalItems} items):`)
    for (const f of c.fields) {
      if (/Image/i.test(f.type)) {
        console.log(`    ${f.slug.padEnd(36)} ${f.usPopulatedCount}/${c.totalItems} (${f.usPopulatedRate}%)`)
      }
    }
  }
  console.log('')

  // ---------- Sanity scan ----------
  const allStats: FieldStats[] = []
  const foldNulls: FoldNullEntry[] = []
  const quoteNulls: QuoteNullEntry[] = []

  for (const type of Object.keys(TOP_LEVEL_IMAGE_FIELDS)) {
    const docs = await sanityWriteClient.fetch<Array<Record<string, unknown> & { _id: string }>>(
      `*[_type == $type && !(_id match "smoke-test-*")]`,
      { type },
    )

    // Top-level image fields — initialise stats.
    for (const f of TOP_LEVEL_IMAGE_FIELDS[type]) {
      const stats: FieldStats = {
        type,
        field: f.name,
        total: docs.length,
        keyPresent: 0,
        keyAbsent: 0,
        nullLiteral: 0,
        validImage: 0,
        invalidShape: 0,
        nullDocIds: [],
      }
      for (const doc of docs) {
        const cls = classifyDocFieldValue(doc, f.name)
        if (cls === 'absent') {
          stats.keyAbsent++
        } else {
          stats.keyPresent++
          if (cls === 'null') {
            stats.nullLiteral++
            stats.nullDocIds.push(doc._id)
          } else if (cls === 'valid-image') {
            stats.validImage++
          } else {
            stats.invalidShape++
          }
        }
      }
      allStats.push(stats)
    }

    // Nested — folds[].featuredImage on service + technology only.
    if (type === 'service' || type === 'technology') {
      for (const doc of docs) {
        const folds = doc.folds
        if (!Array.isArray(folds)) continue
        folds.forEach((fold, i) => {
          if (!fold || typeof fold !== 'object') return
          const f = fold as Record<string, unknown>
          if ('featuredImage' in f && f.featuredImage === null) {
            foldNulls.push({
              docId: doc._id,
              type,
              foldIndex: i,
              foldKey: typeof f._key === 'string' ? f._key : '(no _key)',
              foldType: typeof f.type === 'string' ? f.type : '(no type)',
            })
          }
        })
      }
    }

    // Nested — problem/solution/impact.quote.personImage on customerStory.
    if (type === 'customerStory') {
      for (const doc of docs) {
        for (const section of ['problem', 'solution', 'impact'] as const) {
          const obj = doc[section]
          if (!obj || typeof obj !== 'object') continue
          const o = obj as Record<string, unknown>
          const quote = o.quote
          if (!quote || typeof quote !== 'object') continue
          const q = quote as Record<string, unknown>
          if ('personImage' in q && q.personImage === null) {
            quoteNulls.push({ docId: doc._id, section })
          }
        }
      }
    }
  }

  // ---------- Report ----------
  console.log('## Sanity production — top-level image-field state per doc type\n')
  console.log(
    '| type           | field                   | required | total | absent | null | valid | invalid |',
  )
  console.log(
    '|----------------|-------------------------|----------|-------|--------|------|-------|---------|',
  )
  for (const s of allStats) {
    const isRequired = TOP_LEVEL_IMAGE_FIELDS[s.type].find((f) => f.name === s.field)?.required ?? false
    console.log(
      `| ${s.type.padEnd(14)} | ${s.field.padEnd(23)} | ${(isRequired ? 'yes' : 'no').padEnd(8)} | ${String(s.total).padStart(5)} | ${String(s.keyAbsent).padStart(6)} | ${String(s.nullLiteral).padStart(4)} | ${String(s.validImage).padStart(5)} | ${String(s.invalidShape).padStart(7)} |`,
    )
  }
  console.log('')

  // Per-field null-doc-_id list.
  console.log('## Per-field null-literal doc IDs (the buggy case)\n')
  for (const s of allStats) {
    if (s.nullLiteral === 0) continue
    console.log(`### ${s.type}.${s.field} — ${s.nullLiteral}/${s.total} docs hold null`)
    console.log(`  sample: ${s.nullDocIds.slice(0, 5).join(', ')}${s.nullDocIds.length > 5 ? ` (+${s.nullDocIds.length - 5})` : ''}`)
  }
  console.log('')

  // Nested — folds.
  console.log('## Nested — folds[].featuredImage null entries (service + technology)\n')
  if (foldNulls.length === 0) {
    console.log('  None.')
  } else {
    const byType = new Map<string, number>()
    for (const e of foldNulls) byType.set(e.type, (byType.get(e.type) ?? 0) + 1)
    for (const [t, n] of byType) console.log(`  ${t}: ${n} fold entries hold featuredImage: null`)
    console.log('  sample:')
    for (const e of foldNulls.slice(0, 5)) {
      console.log(`    ${e.docId} fold[${e.foldIndex}] type=${e.foldType}`)
    }
    if (foldNulls.length > 5) console.log(`    … +${foldNulls.length - 5} more`)
  }
  console.log('')

  // Nested — quote person images.
  console.log('## Nested — customerStory {problem,solution,impact}.quote.personImage null entries\n')
  if (quoteNulls.length === 0) {
    console.log('  None.')
  } else {
    console.log(`  ${quoteNulls.length} entries hold quote.personImage: null`)
    const bySection = new Map<string, number>()
    for (const e of quoteNulls) bySection.set(e.section, (bySection.get(e.section) ?? 0) + 1)
    for (const [s, n] of bySection) console.log(`    section=${s}: ${n}`)
    console.log('  sample:')
    for (const e of quoteNulls.slice(0, 5)) {
      console.log(`    ${e.docId} (${e.section})`)
    }
    if (quoteNulls.length > 5) console.log(`    … +${quoteNulls.length - 5} more`)
  }
  console.log('')

  // Aggregate summary.
  const nullishFields = allStats.filter((s) => s.nullLiteral > 0)
  console.log('## Summary')
  console.log('')
  console.log(`Top-level fields holding null literal: ${nullishFields.length} field-type pairs`)
  for (const s of nullishFields) {
    console.log(`  - ${s.type}.${s.field}: ${s.nullLiteral}/${s.total} docs`)
  }
  console.log(`Folds[].featuredImage null entries: ${foldNulls.length}`)
  console.log(`customerStory quote.personImage null entries: ${quoteNulls.length}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

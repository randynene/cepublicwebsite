/**
 * TEMPLATE-SERVICE Step 0 — read-only Sanity probe.
 * Reports doc count, locale split, field fill rates, enum values (type/prefix),
 * folds shape (types, counts, per-fold field fill, PortableText block types),
 * meta fill, QA slug pick. Read-only. Never mutates the dataset.
 */
import { createClient } from '@sanity/client'

import { ensureSanity, env } from '@/lib/env'

ensureSanity()

const client = createClient({
  projectId: env.SANITY_PROJECT_ID,
  dataset: env.SANITY_DATASET,
  apiVersion: '2024-01-01',
  useCdn: false,
  token: env.SANITY_API_TOKEN,
  perspective: 'published',
})

type PtBlock = { _type: string; [key: string]: unknown }
type ImageRef = { asset?: unknown; alt?: string | null } | null
type FoldItem = { header?: string | null; description?: string | null }
type Fold = {
  type?: string | null
  label?: string | null
  header?: string | null
  paragraph?: PtBlock[] | null
  bullets?: string[] | null
  items?: FoldItem[] | null
  featuredImage?: ImageRef
}

type ServiceRow = {
  _id: string
  name: string
  slug: string
  order?: number | null
  type?: string | null
  prefix?: string | null
  aiOffering?: boolean | null
  location?: boolean | null
  shortLabel?: string | null
  tagline?: string | null
  thumbnail?: ImageRef
  associatedTechnologies?: unknown[] | null
  folds?: Fold[] | null
  metaTitle?: string | null
  metaDescription?: string | null
  openGraphImage?: ImageRef
  locale?: string | null
}

const TOP_FIELDS: Array<keyof ServiceRow> = [
  'name',
  'type',
  'prefix',
  'shortLabel',
  'tagline',
  'thumbnail',
  'associatedTechnologies',
  'folds',
  'metaTitle',
  'metaDescription',
  'openGraphImage',
]

function pct(n: number, total: number): string {
  if (total === 0) return '0%'
  return `${Math.round((n / total) * 100)}%`
}

function hasPt(v: PtBlock[] | null | undefined): boolean {
  return Array.isArray(v) && v.length > 0
}

function isFilled(doc: ServiceRow, field: keyof ServiceRow): boolean {
  const value = doc[field]
  if (field === 'thumbnail' || field === 'openGraphImage') return Boolean((value as ImageRef)?.asset)
  if (field === 'folds' || field === 'associatedTechnologies') return Array.isArray(value) && value.length > 0
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  return true
}

function foldFieldPresence(fold: Fold) {
  return {
    label: Boolean(fold.label?.trim()),
    header: Boolean(fold.header?.trim()),
    paragraph: hasPt(fold.paragraph),
    bullets: Array.isArray(fold.bullets) && fold.bullets.length > 0,
    items: Array.isArray(fold.items) && fold.items.length > 0,
    featuredImage: Boolean(fold.featuredImage?.asset),
  }
}

function coverageScore(doc: ServiceRow): number {
  let score = 0
  for (const field of TOP_FIELDS) if (isFilled(doc, field)) score += 1
  score += (doc.folds?.length ?? 0)
  return score
}

async function main(): Promise<void> {
  const docs = await client.fetch<ServiceRow[]>(
    `*[_type == "service" && !(_id match "smoke-test-*") && !(_id match "drafts.*")] | order(name asc) {
      _id, name, "slug": slug.current, order, type, prefix, aiOffering, location,
      shortLabel, tagline, thumbnail, associatedTechnologies,
      folds[]{ type, label, header, paragraph, bullets, items, featuredImage },
      metaTitle, metaDescription, openGraphImage, locale
    }`,
  )

  const total = docs.length
  console.log(`\n=== TEMPLATE-SERVICE Step 0 — Sanity probe ===`)
  console.log(`Dataset: ${env.SANITY_DATASET} | Total service docs: ${total}`)

  const locales = new Map<string, number>()
  for (const doc of docs) {
    const loc = doc.locale ?? '(missing)'
    locales.set(loc, (locales.get(loc) ?? 0) + 1)
  }
  console.log(`\nLocale split:`)
  for (const [loc, count] of [...locales.entries()].sort()) console.log(`  ${loc}: ${count}`)

  console.log(`\nTop-level field fill (${total} docs):`)
  for (const field of TOP_FIELDS) {
    const filled = docs.filter((d) => isFilled(d, field)).length
    console.log(`  ${String(field).padEnd(22)} ${String(filled).padStart(2)}/${total} (${pct(filled, total)})`)
  }

  // enum values (Zod to LIVE)
  const typeVals = new Map<string, number>()
  const prefixVals = new Map<string, number>()
  for (const d of docs) {
    const t = d.type ?? '(null)'
    typeVals.set(t, (typeVals.get(t) ?? 0) + 1)
    const p = d.prefix ?? '(null)'
    prefixVals.set(p, (prefixVals.get(p) ?? 0) + 1)
  }
  console.log(`\nENUM: service.type live values (Zod to these, do NOT mutate Sanity):`)
  for (const [v, c] of [...typeVals.entries()].sort()) console.log(`  ${v}: ${c}`)
  console.log(`\nENUM: service.prefix live values:`)
  for (const [v, c] of [...prefixVals.entries()].sort()) console.log(`  ${v}: ${c}`)

  // folds shape
  const foldTypeCounts = new Map<string, number>()
  const foldsPerDoc: number[] = []
  const ptTypes = new Map<string, number>()
  const foldFieldTotals = { label: 0, header: 0, paragraph: 0, bullets: 0, items: 0, featuredImage: 0 }
  let totalFolds = 0
  for (const d of docs) {
    const folds = d.folds ?? []
    foldsPerDoc.push(folds.length)
    for (const f of folds) {
      totalFolds++
      const ft = f.type ?? '(null)'
      foldTypeCounts.set(ft, (foldTypeCounts.get(ft) ?? 0) + 1)
      const pres = foldFieldPresence(f)
      for (const k of Object.keys(foldFieldTotals) as Array<keyof typeof foldFieldTotals>) {
        if (pres[k]) foldFieldTotals[k]++
      }
      for (const b of f.paragraph ?? []) ptTypes.set(b._type, (ptTypes.get(b._type) ?? 0) + 1)
    }
  }
  console.log(`\nFOLDS: ${totalFolds} folds across ${total} docs (avg ${(totalFolds / (total || 1)).toFixed(1)}/doc)`)
  console.log(`  folds-per-doc range: ${Math.min(...foldsPerDoc)}–${Math.max(...foldsPerDoc)}`)
  console.log(`\nFold type frequencies:`)
  for (const [v, c] of [...foldTypeCounts.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${v}: ${c}`)
  console.log(`\nFold field presence (of ${totalFolds} folds):`)
  for (const [k, c] of Object.entries(foldFieldTotals)) console.log(`  ${k.padEnd(14)} ${c}/${totalFolds} (${pct(c, totalFolds)})`)
  console.log(`\nFold paragraph PortableText _type frequencies:`)
  for (const [v, c] of [...ptTypes.entries()].sort()) console.log(`  ${v}: ${c}`)

  const withEmbed = docs.filter((d) => (d.folds ?? []).some((f) => (f.paragraph ?? []).some((b) => b._type === 'videoEmbed' || b._type === 'table')))
  console.log(`\nCONTENT-1E embeds in folds (table/videoEmbed): ${withEmbed.length}/${total}`)
  for (const d of withEmbed) console.log(`  ${d.slug}`)

  console.log(`\nmeta fill: metaTitle ${docs.filter((d) => isFilled(d, 'metaTitle')).length}/${total} | metaDescription ${docs.filter((d) => isFilled(d, 'metaDescription')).length}/${total} | openGraphImage ${docs.filter((d) => isFilled(d, 'openGraphImage')).length}/${total}`)

  const slugPick = [...docs].sort((a, b) => coverageScore(b) - coverageScore(a))[0]
  console.log(`\nRecommended QA slug (fullest coverage):`)
  console.log(`  slug: ${slugPick?.slug ?? '(none)'}`)
  console.log(`  name: ${slugPick?.name ?? '(none)'}`)
  console.log(`  type: ${slugPick?.type} | prefix: ${slugPick?.prefix} | folds: ${slugPick?.folds?.length ?? 0}`)
  console.log(`  fold types: ${(slugPick?.folds ?? []).map((f) => f.type).join(' → ')}`)

  console.log(`\nTop 8 fullest docs by coverage:`)
  for (const d of [...docs].sort((a, b) => coverageScore(b) - coverageScore(a)).slice(0, 8)) {
    console.log(`  ${d.slug} (score ${coverageScore(d)}) — type:${d.type} folds:${d.folds?.length ?? 0} meta:${isFilled(d, 'metaDescription') ? 'Y' : 'N'} og:${isFilled(d, 'openGraphImage') ? 'Y' : 'N'}`)
  }

  console.log(`\nAll ${total} slugs:`)
  for (const d of docs) console.log(`  /services/${d.slug}  (folds:${d.folds?.length ?? 0} type:${d.type})`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

/**
 * TEMPLATE-TECHNOLOGY Step 0 — read-only Sanity probe.
 * technology reuses the `fold` object (like service) + adds techLogo, faqs,
 * listItemOnly (no-page flag). Reports doc count, locale split, field fill,
 * fold type/shape, faq fill, listItemOnly count, meta fill, QA slug pick.
 * Read-only. Never mutates the dataset.
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
type Faq = { question?: string | null; answer?: unknown }

type TechRow = {
  _id: string
  technologyName: string
  slug: string
  order?: number | null
  shortLabel?: string | null
  tagline?: string | null
  techLogo?: ImageRef
  thumbnail?: ImageRef
  listItemOnly?: boolean | null
  folds?: Fold[] | null
  faqs?: Faq[] | null
  metaTitle?: string | null
  metaDescription?: string | null
  locale?: string | null
}

function pct(n: number, total: number): string {
  if (total === 0) return '0%'
  return `${Math.round((n / total) * 100)}%`
}

async function main(): Promise<void> {
  const docs = await client.fetch<TechRow[]>(
    `*[_type == "technology" && !(_id match "drafts.*") && !(_id match "smoke-test-*")] | order(technologyName asc) {
      _id, technologyName, "slug": slug.current, order, shortLabel, tagline,
      techLogo, thumbnail, listItemOnly,
      folds[]{ type, label, header, paragraph, bullets, items, featuredImage },
      faqs[]{ question, answer },
      metaTitle, metaDescription, locale
    }`,
  )

  const total = docs.length
  console.log(`\n=== TEMPLATE-TECHNOLOGY Step 0 — Sanity probe ===`)
  console.log(`Dataset: ${env.SANITY_DATASET} | Total technology docs: ${total}`)

  const locales = new Map<string, number>()
  for (const d of docs) {
    const loc = d.locale ?? '(missing)'
    locales.set(loc, (locales.get(loc) ?? 0) + 1)
  }
  console.log(`\nLocale split:`)
  for (const [loc, count] of [...locales.entries()].sort()) console.log(`  ${loc}: ${count}`)

  const listItemOnly = docs.filter((d) => d.listItemOnly === true)
  const routable = docs.filter((d) => d.listItemOnly !== true && d.slug)
  console.log(`\nlistItemOnly (NO dedicated page — exclude from routes/sitemap): ${listItemOnly.length}`)
  console.log(`Routable technology docs (listItemOnly !== true && has slug): ${routable.length}`)

  const fold = (d: TechRow) => (Array.isArray(d.folds) ? d.folds : [])
  console.log(`\nTop-level field fill (${total} docs):`)
  const tl = (name: string, pred: (d: TechRow) => boolean) =>
    console.log(`  ${name.padEnd(22)} ${docs.filter(pred).length}/${total} (${pct(docs.filter(pred).length, total)})`)
  tl('technologyName', (d) => Boolean(d.technologyName?.trim()))
  tl('shortLabel', (d) => Boolean(d.shortLabel?.trim()))
  tl('tagline', (d) => Boolean(d.tagline?.trim()))
  tl('techLogo', (d) => Boolean(d.techLogo?.asset))
  tl('thumbnail', (d) => Boolean(d.thumbnail?.asset))
  tl('folds(>=1)', (d) => fold(d).length > 0)
  tl('faqs(>=1)', (d) => Array.isArray(d.faqs) && d.faqs.filter((f) => f.question?.trim()).length > 0)
  tl('metaTitle', (d) => Boolean(d.metaTitle?.trim()))
  tl('metaDescription', (d) => Boolean(d.metaDescription?.trim()))

  const foldsPer = docs.map((d) => fold(d).length)
  const allFolds = docs.flatMap(fold)
  console.log(`\nFOLDS: ${allFolds.length} folds across ${total} docs`)
  console.log(`  folds-per-doc range: ${Math.min(...foldsPer)}–${Math.max(...foldsPer)}`)

  const foldTypes = new Map<string, number>()
  for (const f of allFolds) foldTypes.set(f.type ?? '(null)', (foldTypes.get(f.type ?? '(null)') ?? 0) + 1)
  console.log(`\nFold type frequencies:`)
  for (const [t, c] of [...foldTypes.entries()].sort()) console.log(`  ${t}: ${c}`)

  const fp = (name: string, pred: (f: Fold) => boolean) =>
    console.log(`  ${name.padEnd(14)} ${allFolds.filter(pred).length}/${allFolds.length} (${pct(allFolds.filter(pred).length, allFolds.length)})`)
  console.log(`\nFold field presence (of ${allFolds.length} folds):`)
  fp('label', (f) => Boolean(f.label?.trim()))
  fp('header', (f) => Boolean(f.header?.trim()))
  fp('paragraph', (f) => Array.isArray(f.paragraph) && f.paragraph.length > 0)
  fp('bullets', (f) => Array.isArray(f.bullets) && f.bullets.length > 0)
  fp('items', (f) => Array.isArray(f.items) && f.items.length > 0)
  fp('featuredImage', (f) => Boolean(f.featuredImage?.asset))

  const ptTypes = new Map<string, number>()
  for (const f of allFolds) for (const b of f.paragraph ?? []) ptTypes.set(b._type, (ptTypes.get(b._type) ?? 0) + 1)
  console.log(`\nFold paragraph PortableText _type frequencies:`)
  for (const [t, c] of [...ptTypes.entries()].sort()) console.log(`  ${t}: ${c}`)
  const embedTypes = [...ptTypes.keys()].filter((t) => t === 'table' || t === 'videoEmbed')
  console.log(`CONTENT-1E embeds in folds (table/videoEmbed): ${embedTypes.length ? embedTypes.join(', ') : 'none'}`)

  const faqCounts = docs.map((d) => (Array.isArray(d.faqs) ? d.faqs.filter((f) => f.question?.trim()).length : 0))
  console.log(`\nFAQ counts: docs with >=1 faq = ${faqCounts.filter((n) => n > 0).length}/${total}; max faqs on a doc = ${Math.max(0, ...faqCounts)}`)

  console.log(`\nmeta fill: metaTitle ${docs.filter((d) => d.metaTitle?.trim()).length}/${total} | metaDescription ${docs.filter((d) => d.metaDescription?.trim()).length}/${total}`)

  const score = (d: TechRow) =>
    (d.tagline?.trim() ? 1 : 0) +
    (d.techLogo?.asset ? 1 : 0) +
    fold(d).length +
    (Array.isArray(d.faqs) ? d.faqs.filter((f) => f.question?.trim()).length : 0)
  const slugPick = [...routable].sort((a, b) => score(b) - score(a))[0]
  console.log(`\nRecommended QA slug (routable, fullest coverage incl. faqs):`)
  console.log(`  slug: ${slugPick?.slug ?? '(none)'}`)
  console.log(`  name: ${slugPick?.technologyName ?? '(none)'}`)
  console.log(`  folds: ${slugPick ? fold(slugPick).length : 0} | faqs: ${slugPick && Array.isArray(slugPick.faqs) ? slugPick.faqs.filter((f) => f.question?.trim()).length : 0} | tagline:${slugPick?.tagline ? 'Y' : 'N'} | techLogo:${slugPick?.techLogo?.asset ? 'Y' : 'N'}`)
  if (slugPick) console.log(`  fold types: ${fold(slugPick).map((f) => f.type).join(' -> ')}`)

  console.log(`\nTop 8 routable docs by coverage:`)
  for (const d of [...routable].sort((a, b) => score(b) - score(a)).slice(0, 8)) {
    const faqN = Array.isArray(d.faqs) ? d.faqs.filter((f) => f.question?.trim()).length : 0
    console.log(`  ${d.slug} (score ${score(d)}) — folds:${fold(d).length} faqs:${faqN} tagline:${d.tagline ? 'Y' : 'N'} logo:${d.techLogo?.asset ? 'Y' : 'N'}`)
  }

  console.log(`\nAll routable slugs (${routable.length}):`)
  for (const d of routable) console.log(`  /technology/${d.slug}  (folds:${fold(d).length})`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

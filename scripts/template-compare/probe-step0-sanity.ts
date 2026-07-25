/**
 * TEMPLATE-COMPARE Step 0 — read-only Sanity probe.
 * Reports doc count, locale split, field fill rates, author refs, PT block types.
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

type CompareRow = {
  _id: string
  title: string
  slug: string
  competitor?: string | null
  tags?: Array<{ _ref?: string; name?: string }> | null
  author?: { _id?: string; name?: string; slug?: string } | null
  date?: string | null
  featured?: boolean | null
  thumbnailImage?: { asset?: unknown; alt?: string | null } | null
  tldrSection?: PtBlock[] | null
  content?: PtBlock[] | null
  resourceDescription?: string | null
  faqs?: Array<{ question?: string; answer?: PtBlock[] }> | null
  metaTitle?: string | null
  metaDescription?: string | null
  locale?: string | null
}

const EXPORT_FIELDS: Array<keyof CompareRow> = [
  'title',
  'competitor',
  'tags',
  'author',
  'date',
  'thumbnailImage',
  'tldrSection',
  'content',
  'faqs',
  'metaTitle',
  'metaDescription',
]

function pct(n: number, total: number): string {
  if (total === 0) return '0%'
  return `${Math.round((n / total) * 100)}%`
}

function hasPortableText(value: PtBlock[] | null | undefined): boolean {
  return Array.isArray(value) && value.length > 0
}

function isFilled(doc: CompareRow, field: keyof CompareRow): boolean {
  const value = doc[field]
  if (field === 'thumbnailImage') {
    return Boolean(doc.thumbnailImage?.asset)
  }
  if (field === 'tldrSection' || field === 'content') {
    return hasPortableText(value as PtBlock[] | null | undefined)
  }
  if (field === 'tags') {
    return Array.isArray(value) && value.length > 0
  }
  if (field === 'author') {
    return Boolean(doc.author?._id)
  }
  if (field === 'faqs') {
    return Array.isArray(value) && value.length > 0
  }
  if (field === 'featured') {
    return value === true
  }
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  return true
}

function ptBlockTypes(blocks: PtBlock[] | null | undefined): Map<string, number> {
  const counts = new Map<string, number>()
  for (const block of blocks ?? []) {
    counts.set(block._type, (counts.get(block._type) ?? 0) + 1)
  }
  return counts
}

function coverageScore(doc: CompareRow): number {
  let score = 0
  for (const field of EXPORT_FIELDS) {
    if (isFilled(doc, field)) score += 1
  }
  return score
}

async function main(): Promise<void> {
  const docs = await client.fetch<CompareRow[]>(
    `*[_type == "compareBlog" && !(_id match "smoke-test-*")] | order(title asc) {
      _id,
      title,
      "slug": slug.current,
      competitor,
      tags[]->{ _id, name },
      author->{ _id, name, "slug": slug.current },
      date,
      featured,
      thumbnailImage,
      tldrSection,
      content,
      resourceDescription,
      faqs,
      metaTitle,
      metaDescription,
      locale
    }`,
  )

  const total = docs.length
  console.log(`\n=== TEMPLATE-COMPARE Step 0 — Sanity probe ===`)
  console.log(`Dataset: ${env.SANITY_DATASET} | Total compareBlog docs: ${total}`)
  console.log(`Expected: ~30 (handover) / 29 (CE_SITE_TRUTH)`)

  const locales = new Map<string, number>()
  for (const doc of docs) {
    const loc = doc.locale ?? '(missing)'
    locales.set(loc, (locales.get(loc) ?? 0) + 1)
  }
  console.log(`\nLocale split:`)
  for (const [loc, count] of [...locales.entries()].sort()) {
    console.log(`  ${loc}: ${count}`)
  }

  console.log(`\nField fill rates (${total} docs):`)
  for (const field of EXPORT_FIELDS) {
    const filled = docs.filter((d) => isFilled(d, field)).length
    console.log(`  ${String(field).padEnd(22)} ${String(filled).padStart(2)}/${total} (${pct(filled, total)})`)
  }

  const thumbAltFilled = docs.filter((d) => Boolean(d.thumbnailImage?.alt?.trim())).length
  console.log(`\nthumbnailImage.alt (editorial): ${thumbAltFilled}/${total} (${pct(thumbAltFilled, total)})`)

  const missingAuthor = docs.filter((d) => !isFilled(d, 'author'))
  console.log(`\nDocs with unresolved/missing author ref: ${missingAuthor.length}/${total}`)
  for (const d of missingAuthor.slice(0, 10)) {
    console.log(`  ${d.slug} (${d._id})`)
  }

  const missingCompetitor = docs.filter((d) => !isFilled(d, 'competitor'))
  if (missingCompetitor.length) {
    console.log(`\nDocs missing competitor string (${missingCompetitor.length}):`)
    for (const d of missingCompetitor.slice(0, 10)) {
      console.log(`  ${d.slug} — "${d.title}"`)
    }
  }

  const contentPtTypes = new Map<string, number>()
  const tldrPtTypes = new Map<string, number>()
  for (const doc of docs) {
    for (const [type, count] of ptBlockTypes(doc.content)) {
      contentPtTypes.set(type, (contentPtTypes.get(type) ?? 0) + count)
    }
    for (const [type, count] of ptBlockTypes(doc.tldrSection)) {
      tldrPtTypes.set(type, (tldrPtTypes.get(type) ?? 0) + count)
    }
  }

  console.log(`\ncontent[] Portable Text _type frequencies (all docs):`)
  for (const [type, count] of [...contentPtTypes.entries()].sort()) {
    console.log(`  ${type}: ${count}`)
  }

  console.log(`\ntldrSection[] Portable Text _type frequencies (populated docs only):`)
  for (const [type, count] of [...tldrPtTypes.entries()].sort()) {
    console.log(`  ${type}: ${count}`)
  }

  const withVideoEmbed = docs.filter((d) =>
    (d.content ?? []).some((b) => b._type === 'videoEmbed'),
  ).length
  const withTable = docs.filter((d) => (d.content ?? []).some((b) => b._type === 'table')).length
  console.log(`\nCONTENT-1E embed recovery in compareBlog.content:`)
  console.log(`  docs with videoEmbed blocks: ${withVideoEmbed}/${total}`)
  console.log(`  docs with table blocks: ${withTable}/${total}`)

  const faqCounts = docs.map((d) => d.faqs?.length ?? 0)
  const withFaqs = faqCounts.filter((n) => n > 0).length
  const maxFaqs = faqCounts.length ? Math.max(...faqCounts) : 0
  console.log(`\nFAQs: ${withFaqs}/${total} docs have faqs[] (${maxFaqs} max items on one doc)`)

  const slugPick =
    docs.find((d) => d.slug === 'cloud-employee-vs-toptal') ??
    [...docs]
      .filter(
        (d) =>
          isFilled(d, 'tldrSection') &&
          isFilled(d, 'content') &&
          isFilled(d, 'faqs') &&
          isFilled(d, 'author'),
      )
      .sort((a, b) => coverageScore(b) - coverageScore(a))[0] ??
    [...docs].sort((a, b) => coverageScore(b) - coverageScore(a))[0]

  console.log(`\nRecommended QA slug (fullest + Compare.html parity):`)
  console.log(`  slug: ${slugPick?.slug ?? '(none)'}`)
  console.log(`  title: ${slugPick?.title ?? '(none)'}`)
  console.log(`  competitor: ${slugPick?.competitor ?? '(none)'}`)
  console.log(`  author: ${slugPick?.author?.name ?? '(none)'}`)
  console.log(`  coverage: ${slugPick ? coverageScore(slugPick) : 0}/${EXPORT_FIELDS.length} export fields`)
  console.log(`  faqs: ${slugPick?.faqs?.length ?? 0} | tldr: ${hasPortableText(slugPick?.tldrSection) ? 'yes' : 'no'}`)

  console.log(`\nTop 5 fullest docs by export coverage:`)
  for (const d of [...docs].sort((a, b) => coverageScore(b) - coverageScore(a)).slice(0, 5)) {
    console.log(
      `  ${d.slug} (${coverageScore(d)}/${EXPORT_FIELDS.length}) — faqs:${d.faqs?.length ?? 0} tldr:${hasPortableText(d.tldrSection) ? 'Y' : 'N'} tables:${(d.content ?? []).some((b) => b._type === 'table') ? 'Y' : 'N'}`,
    )
  }

  console.log(`\nOMIT list (export sections with no schema backing):`)
  console.log(`  - Inline closing CTA: omit (FooterTopCta)`)
  console.log(`  - Related / share rows: omit unless schema backs`)
  console.log(`  - Visible breadcrumbs: DEFAULT hide visual + BreadcrumbList JSON-LD only (HALT for Jake)`)

  const qa = await client.fetch<{
    title: string
    competitor?: string
    date?: string
    author?: { name?: string; slug?: string }
    faqCount: number
    tldrBlocks: number
    contentBlocks: number
    contentTypes: string[]
    metaTitle?: string
    metaDescription?: string
  } | null>(
    `*[_type == "compareBlog" && slug.current == $slug][0]{
      title,
      competitor,
      date,
      author->{ name, "slug": slug.current },
      "faqCount": count(faqs),
      "tldrBlocks": count(tldrSection),
      "contentBlocks": count(content),
      "contentTypes": array::unique(content[]._type),
      metaTitle,
      metaDescription
    }`,
    { slug: slugPick?.slug ?? 'cloud-employee-vs-toptal' },
  )
  console.log(`\nQA slug snapshot:`)
  console.log(JSON.stringify(qa, null, 2))

  console.log(`\nSample slugs (first 8):`)
  for (const d of docs.slice(0, 8)) {
    console.log(`  /compare/${d.slug}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

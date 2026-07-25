/**
 * TEMPLATE-BOOK-A-CALL Step 0 — read-only Sanity probe.
 * Reports doc count, field fill rates, calendlyEmbed PT shape, QA slug pick.
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

type BookACallRow = {
  _id: string
  firstName: string
  lastName: string
  slug: string
  calendlyEmbed?: PtBlock[] | null
  metaTitle?: string | null
  metaDescription?: string | null
  locale?: string | null
}

const EXPORT_FIELDS: Array<keyof BookACallRow> = [
  'firstName',
  'lastName',
  'calendlyEmbed',
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

function isFilled(doc: BookACallRow, field: keyof BookACallRow): boolean {
  const value = doc[field]
  if (field === 'calendlyEmbed') {
    return hasPortableText(value as PtBlock[] | null | undefined)
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

function calendlyUrls(blocks: PtBlock[] | null | undefined): string[] {
  const urls: string[] = []
  for (const block of blocks ?? []) {
    if (block._type === 'block') {
      const children = block.children as Array<{ text?: string }> | undefined
      const text = children?.map((c) => c.text ?? '').join('') ?? ''
      const matches = text.match(/https?:\/\/[^\s"']*calendly[^\s"']*/gi)
      if (matches) urls.push(...matches)
    }
    if (block._type === 'videoEmbed' && typeof block.url === 'string') {
      urls.push(block.url)
    }
  }
  return urls
}

function coverageScore(doc: BookACallRow): number {
  let score = 0
  for (const field of EXPORT_FIELDS) {
    if (isFilled(doc, field)) score += 1
  }
  return score
}

async function main(): Promise<void> {
  const docs = await client.fetch<BookACallRow[]>(
    `*[_type == "bookACall" && !(_id match "smoke-test-*")] | order(firstName asc) {
      _id,
      firstName,
      lastName,
      "slug": slug.current,
      calendlyEmbed,
      metaTitle,
      metaDescription,
      locale
    }`,
  )

  const total = docs.length
  console.log(`\n=== TEMPLATE-BOOK-A-CALL Step 0 — Sanity probe ===`)
  console.log(`Dataset: ${env.SANITY_DATASET} | Total bookACall docs: ${total}`)
  console.log(`Expected: 6 (CONTENT-1B parity)`)
  console.log(`Schema note: NO localeField — single-document mirror (same slug US + UK)`)

  const locales = new Map<string, number>()
  for (const doc of docs) {
    const loc = doc.locale ?? '(none — expected)'
    locales.set(loc, (locales.get(loc) ?? 0) + 1)
  }
  console.log(`\nLocale field on docs (schema has none):`)
  for (const [loc, count] of [...locales.entries()].sort()) {
    console.log(`  ${loc}: ${count}`)
  }

  console.log(`\nField fill rates (${total} docs):`)
  for (const field of EXPORT_FIELDS) {
    const filled = docs.filter((d) => isFilled(d, field)).length
    console.log(`  ${String(field).padEnd(20)} ${String(filled).padStart(2)}/${total} (${pct(filled, total)})`)
  }

  console.log(`\nAll docs (slug → name):`)
  for (const d of docs) {
    const calBlocks = d.calendlyEmbed?.length ?? 0
    const metaTitleOk = isFilled(d, 'metaTitle') ? 'metaTitle:OK' : 'metaTitle:MISSING'
    console.log(
      `  /book-a-call/${d.slug} → ${d.firstName} ${d.lastName} | calendlyEmbed blocks: ${calBlocks} | ${metaTitleOk}`,
    )
  }

  const sitewidePtTypes = new Map<string, number>()
  for (const doc of docs) {
    for (const [type, count] of ptBlockTypes(doc.calendlyEmbed)) {
      sitewidePtTypes.set(type, (sitewidePtTypes.get(type) ?? 0) + count)
    }
  }
  console.log(`\ncalendlyEmbed Portable Text _type frequencies (all docs):`)
  for (const [type, count] of [...sitewidePtTypes.entries()].sort()) {
    console.log(`  ${type}: ${count}`)
  }

  const sampleDoc = docs.find((d) => hasPortableText(d.calendlyEmbed)) ?? docs[0]
  if (sampleDoc?.calendlyEmbed?.length) {
    console.log(`\nSample calendlyEmbed blocks (${sampleDoc.slug} — first non-block if any):`)
    for (const block of sampleDoc.calendlyEmbed.slice(0, 6)) {
      if (block._type !== 'block') {
        console.log(JSON.stringify(block, null, 2))
      }
    }
    const firstBlock = sampleDoc.calendlyEmbed.find((b) => b._type === 'block')
    if (firstBlock) {
      console.log(`\nFirst block-type entry (${sampleDoc.slug}):`)
      console.log(JSON.stringify(firstBlock, null, 2).slice(0, 1200))
    }
  }

  console.log(`\nCalendly URLs detected in calendlyEmbed text:`)
  for (const d of docs) {
    const urls = calendlyUrls(d.calendlyEmbed)
    console.log(`  ${d.slug}: ${urls.length ? urls.join(', ') : '(none in PT text)'}`)
  }

  const missingMetaTitle = docs.filter((d) => !isFilled(d, 'metaTitle'))
  if (missingMetaTitle.length) {
    console.log(`\nDocs missing metaTitle (${missingMetaTitle.length}) — backfill via migrate-meta-book-a-call:`)
    for (const d of missingMetaTitle) {
      console.log(`  ${d.slug} (${d._id})`)
    }
  }

  const exportSlugs = new Set(['seb', 'shawnee'])
  const exportMatch = docs.filter((d) => exportSlugs.has(d.slug))
  console.log(`\nExport-adjacent slugs (Book A Call.html / CE audit samples):`)
  for (const d of exportMatch) {
    console.log(`  ${d.slug} — coverage ${coverageScore(d)}/${EXPORT_FIELDS.length}`)
  }

  const slugPick =
    docs.find((d) => d.slug === 'shawnee') ??
    docs.find((d) => d.slug === 'seb') ??
    [...docs].sort((a, b) => coverageScore(b) - coverageScore(a))[0]

  console.log(`\nRecommended QA slug:`)
  console.log(`  slug: ${slugPick?.slug ?? '(none)'}`)
  console.log(`  name: ${slugPick ? `${slugPick.firstName} ${slugPick.lastName}` : '(none)'}`)
  console.log(`  routes: /book-a-call/${slugPick?.slug ?? '{slug}'} + /uk/book-a-call/${slugPick?.slug ?? '{slug}'}`)
  console.log(`  coverage: ${slugPick ? coverageScore(slugPick) : 0}/${EXPORT_FIELDS.length} export fields`)

  console.log(`\nOMIT list (export sections with no schema backing):`)
  console.log(`  - FAQ block: no faqs[] on bookACall schema`)
  console.log(`  - Inline closing CTA: omit (FooterTopCta owns sitewide)`)
  console.log(`  - Visible breadcrumbs: omit visual; BreadcrumbList JSON-LD only`)

  const qa = await client.fetch<{
    firstName: string
    lastName: string
    metaTitle?: string
    metaDescription?: string
    calendlyBlockCount: number
    calendlyTypes: string[]
  } | null>(
    `*[_type == "bookACall" && slug.current == $slug][0]{
      firstName,
      lastName,
      metaTitle,
      metaDescription,
      "calendlyBlockCount": count(calendlyEmbed),
      "calendlyTypes": array::unique(calendlyEmbed[]._type)
    }`,
    { slug: slugPick?.slug ?? 'shawnee' },
  )
  console.log(`\nQA slug snapshot:`)
  console.log(JSON.stringify(qa, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

// Probe — generate spot-check URL list maximizing variation coverage for
// pre-HALT-3 browser review. Pulls blogPost metadata via read-only GROQ
// (perspective:published), scores variation profiles, greedy-selects
// 12-15 URLs across the matrix:
//   - 13 categories (one per where data permits)
//   - has/null author
//   - has/no TL;DR
//   - has/no FAQ
//   - has/no inline images
//   - has/null date
//   - body length: short (<3 paragraphs) / medium / long (10+)
//
// Writes audit-output/template-blog/spot-check-urls.md.

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

import { createClient } from '@sanity/client'

import { env, ensureSanity } from '@/lib/env'

ensureSanity()

const c = createClient({
  projectId: env.SANITY_PROJECT_ID,
  dataset: env.SANITY_DATASET,
  apiVersion: '2024-01-01',
  useCdn: false,
  token: env.SANITY_API_TOKEN,
  perspective: 'published',
})

type RawDoc = {
  _id: string
  title: string
  slug: string | null
  categorySlug: string | null
  categoryName: string | null
  hasAuthor: boolean
  hasTldr: boolean
  faqCount: number
  imageBlockCount: number
  paragraphCount: number
  blockCount: number
  date: string | null
}

const QUERY = `
*[_type == "blogPost" && defined(slug.current)]{
  _id,
  title,
  "slug": slug.current,
  "categorySlug": category->slug.current,
  "categoryName": category->name,
  "hasAuthor": defined(author->_id),
  "hasTldr": defined(tldrSection) && length(tldrSection) > 0,
  "faqCount": count(faqs[]),
  "imageBlockCount": count(content[_type == "image"]),
  "paragraphCount": count(content[_type == "block"]),
  "blockCount": count(content[]),
  date
}
`

type LengthBucket = 'short' | 'medium' | 'long'
function bucketLength(n: number): LengthBucket {
  if (n < 3) return 'short'
  if (n < 11) return 'medium'
  return 'long'
}

type Axis = string
function axes(d: RawDoc): Axis[] {
  return [
    `author=${d.hasAuthor ? 'yes' : 'null'}`,
    `tldr=${d.hasTldr ? 'yes' : 'no'}`,
    `faq=${d.faqCount > 0 ? 'yes' : 'no'}`,
    `images=${d.imageBlockCount > 0 ? 'yes' : 'no'}`,
    `date=${d.date ? 'yes' : 'null'}`,
    `len=${bucketLength(d.paragraphCount)}`,
  ]
}

function notable(d: RawDoc): string {
  const parts: string[] = []
  parts.push(d.hasAuthor ? 'author' : '**null author**')
  parts.push(d.hasTldr ? 'TL;DR' : 'no TL;DR')
  parts.push(d.faqCount > 0 ? `FAQ×${d.faqCount}` : 'no FAQ')
  parts.push(
    d.imageBlockCount > 0 ? `images×${d.imageBlockCount}` : 'no inline images',
  )
  parts.push(d.date ? `dated` : '**null date**')
  parts.push(`${bucketLength(d.paragraphCount)} body (${d.paragraphCount}¶)`)
  return parts.join(' · ')
}

async function main() {
  const docs = await c.fetch<RawDoc[]>(QUERY)
  const valid = docs.filter(
    (d): d is RawDoc & { slug: string; categorySlug: string } =>
      !!d.slug && !!d.categorySlug,
  )

  // Corpus-level stats
  const stats = {
    total: valid.length,
    nullAuthor: valid.filter((d) => !d.hasAuthor).length,
    hasTldr: valid.filter((d) => d.hasTldr).length,
    hasFaq: valid.filter((d) => d.faqCount > 0).length,
    hasImages: valid.filter((d) => d.imageBlockCount > 0).length,
    nullDate: valid.filter((d) => !d.date).length,
    short: valid.filter((d) => bucketLength(d.paragraphCount) === 'short').length,
    medium: valid.filter((d) => bucketLength(d.paragraphCount) === 'medium').length,
    long: valid.filter((d) => bucketLength(d.paragraphCount) === 'long').length,
    categories: new Set(valid.map((d) => d.categorySlug)).size,
  }

  // Greedy selection: maximize new-axis coverage per pick. Ensure each
  // category appears at least once before allowing dup-category picks.
  const selected: RawDoc[] = []
  const seenCategories = new Set<string>()
  const coveredAxes = new Set<Axis>()
  const TARGET = 14

  function score(d: RawDoc): number {
    let s = 0
    if (!seenCategories.has(d.categorySlug!)) s += 1000
    for (const a of axes(d)) if (!coveredAxes.has(a)) s += 10
    // Tiny tiebreaker: prefer rarer variation profiles overall (favor
    // docs with null-author / null-date / short body — under-represented
    // in the corpus).
    if (!d.hasAuthor) s += 2
    if (!d.date) s += 2
    if (bucketLength(d.paragraphCount) === 'short') s += 1
    return s
  }

  while (selected.length < TARGET) {
    const pool = valid.filter((d) => !selected.includes(d))
    if (pool.length === 0) break
    pool.sort((a, b) => {
      const sa = score(a)
      const sb = score(b)
      if (sb !== sa) return sb - sa
      // Stable tiebreaker by _id so output is reproducible.
      return a._id.localeCompare(b._id)
    })
    const pick = pool[0]
    selected.push(pick)
    seenCategories.add(pick.categorySlug!)
    for (const a of axes(pick)) coveredAxes.add(a)
  }

  // Surface coverage report
  const allCategories = Array.from(
    new Set(valid.map((d) => d.categorySlug!)),
  ).sort()
  const missedCategories = allCategories.filter((c) => !seenCategories.has(c))

  // Render markdown
  const lines: string[] = []
  lines.push('# TEMPLATE-BLOG — Spot-check URL sampling matrix')
  lines.push('')
  lines.push(
    'Generated read-only via GROQ against Sanity production dataset. ' +
      `${TARGET} URLs selected greedy-coverage across 6 variation axes ` +
      'plus per-category spread. Open each in browser against ' +
      'http://localhost:3000 (dev server from prior session is still on port 3000).',
  )
  lines.push('')
  lines.push(`**Corpus stats** (n=${stats.total} blog posts, ${stats.categories} categories):`)
  lines.push(
    `- null author: ${stats.nullAuthor} · TL;DR: ${stats.hasTldr} · ` +
      `FAQ: ${stats.hasFaq} · inline images: ${stats.hasImages} · ` +
      `null date: ${stats.nullDate}`,
  )
  lines.push(
    `- length: short ${stats.short} / medium ${stats.medium} / long ${stats.long}`,
  )
  lines.push('')
  lines.push('| # | URL | Category | Notable variations |')
  lines.push('|---|-----|----------|---------------------|')
  selected.forEach((d, i) => {
    const url = `http://localhost:3000/${d.categorySlug}/${d.slug}`
    const cat = d.categoryName ?? d.categorySlug
    lines.push(`| ${i + 1} | ${url} | ${cat} | ${notable(d)} |`)
  })
  lines.push('')
  lines.push('## Coverage verification')
  lines.push('')
  lines.push(
    `Categories present in selection: ${seenCategories.size}/${allCategories.length}`,
  )
  if (missedCategories.length > 0) {
    lines.push('Categories NOT covered (data permits did not allow within budget):')
    for (const c of missedCategories) lines.push(`- ${c}`)
  } else {
    lines.push('All categories in corpus represented in selection.')
  }
  lines.push('')
  lines.push('Axes covered in selection:')
  for (const a of Array.from(coveredAxes).sort()) lines.push(`- ${a}`)
  lines.push('')
  lines.push(
    '## Reproducibility',
  )
  lines.push('')
  lines.push(
    'Selection is deterministic: greedy coverage with `_id` stable tiebreaker. ' +
      'Re-running this probe against the same dataset yields the same picks.',
  )

  const outputPath = 'audit-output/template-blog/spot-check-urls.md'
  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, lines.join('\n') + '\n')
  console.log(`Wrote ${selected.length} URLs to ${outputPath}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

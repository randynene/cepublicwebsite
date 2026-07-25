/**
 * TEMPLATE-CUSTOMER-STORY Step 0 — read-only Sanity probe.
 * Reports doc count, locale split, field fill rates, image/logo gaps,
 * Portable Text block types (incl. CONTENT-1E table/videoEmbed recovery),
 * problem/solution/impact fold fill, QA slug pick.
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
type Fold = { content?: PtBlock[] | null; quote?: unknown } | null

type StoryRow = {
  _id: string
  customerStoryTitle: string
  companyName?: string | null
  slug: string
  order?: number | null
  companyLogo?: ImageRef
  companyProductImage?: ImageRef
  companyPeopleImage?: ImageRef
  thumbnail?: ImageRef
  videoUrl?: string | null
  videoIntroContent?: PtBlock[] | null
  tldrContent?: PtBlock[] | null
  hiringNeedsTable?: PtBlock[] | null
  theCustomerContent?: PtBlock[] | null
  problem?: Fold
  solution?: Fold
  impact?: Fold
  ctaContent?: PtBlock[] | null
  reviewSnippetForMeta?: string | null
  metaTitle?: string | null
  metaDescription?: string | null
  locale?: string | null
}

const EXPORT_FIELDS: Array<keyof StoryRow> = [
  'customerStoryTitle',
  'companyName',
  'companyLogo',
  'companyProductImage',
  'companyPeopleImage',
  'thumbnail',
  'videoUrl',
  'videoIntroContent',
  'tldrContent',
  'hiringNeedsTable',
  'theCustomerContent',
  'problem',
  'solution',
  'impact',
  'ctaContent',
  'reviewSnippetForMeta',
  'metaTitle',
  'metaDescription',
]

const IMAGE_FIELDS: Array<keyof StoryRow> = [
  'companyLogo',
  'companyProductImage',
  'companyPeopleImage',
  'thumbnail',
]

const PT_FIELDS: Array<keyof StoryRow> = [
  'videoIntroContent',
  'tldrContent',
  'hiringNeedsTable',
  'theCustomerContent',
  'ctaContent',
]

const FOLD_FIELDS: Array<keyof StoryRow> = ['problem', 'solution', 'impact']

function pct(n: number, total: number): string {
  if (total === 0) return '0%'
  return `${Math.round((n / total) * 100)}%`
}

function hasPortableText(value: PtBlock[] | null | undefined): boolean {
  return Array.isArray(value) && value.length > 0
}

function foldFilled(fold: Fold): boolean {
  if (!fold) return false
  const hasContent = hasPortableText(fold.content)
  const hasQuote = Boolean(fold.quote)
  return hasContent || hasQuote
}

function isFilled(doc: StoryRow, field: keyof StoryRow): boolean {
  const value = doc[field]
  if (IMAGE_FIELDS.includes(field)) {
    return Boolean((value as ImageRef)?.asset)
  }
  if (PT_FIELDS.includes(field)) {
    return hasPortableText(value as PtBlock[] | null | undefined)
  }
  if (FOLD_FIELDS.includes(field)) {
    return foldFilled(value as Fold)
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

function coverageScore(doc: StoryRow): number {
  let score = 0
  for (const field of EXPORT_FIELDS) {
    if (isFilled(doc, field)) score += 1
  }
  return score
}

function allBlocks(doc: StoryRow): PtBlock[] {
  const fields: Array<PtBlock[] | null | undefined> = [
    doc.videoIntroContent,
    doc.tldrContent,
    doc.hiringNeedsTable,
    doc.theCustomerContent,
    doc.ctaContent,
    doc.problem?.content,
    doc.solution?.content,
    doc.impact?.content,
  ]
  return fields.flatMap((f) => f ?? [])
}

async function main(): Promise<void> {
  const docs = await client.fetch<StoryRow[]>(
    `*[_type == "customerStory" && !(_id match "smoke-test-*") && !(_id match "drafts.*")] | order(customerStoryTitle asc) {
      _id,
      customerStoryTitle,
      companyName,
      "slug": slug.current,
      order,
      companyLogo,
      companyProductImage,
      companyPeopleImage,
      thumbnail,
      videoUrl,
      videoIntroContent,
      tldrContent,
      hiringNeedsTable,
      theCustomerContent,
      problem,
      solution,
      impact,
      ctaContent,
      reviewSnippetForMeta,
      metaTitle,
      metaDescription,
      locale
    }`,
  )

  const total = docs.length
  console.log(`\n=== TEMPLATE-CUSTOMER-STORY Step 0 — Sanity probe ===`)
  console.log(`Dataset: ${env.SANITY_DATASET} | Total customerStory docs: ${total}`)
  console.log(`Expected: ~17 (Tech Debt #16 references companyLogo gap on 1 of 17)`)

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
    console.log(
      `  ${String(field).padEnd(24)} ${String(filled).padStart(2)}/${total} (${pct(filled, total)})`,
    )
  }

  console.log(`\nImage alt (editorial) fill:`)
  for (const field of IMAGE_FIELDS) {
    const altFilled = docs.filter((d) => Boolean((d[field] as ImageRef)?.alt?.trim())).length
    const assetFilled = docs.filter((d) => Boolean((d[field] as ImageRef)?.asset)).length
    console.log(
      `  ${String(field).padEnd(24)} alt ${altFilled}/${assetFilled} present-of-asset`,
    )
  }

  const missingLogo = docs.filter((d) => !d.companyLogo?.asset)
  console.log(`\ncompanyLogo missing asset (Tech Debt #16 — do NOT backfill/delete): ${missingLogo.length}`)
  for (const d of missingLogo) {
    console.log(`  ${d.slug} (${d._id}) — "${d.companyName ?? d.customerStoryTitle}"`)
  }

  console.log(`\nFold fill (problem/solution/impact — content + quote):`)
  for (const field of FOLD_FIELDS) {
    const withContent = docs.filter((d) => hasPortableText((d[field] as Fold)?.content)).length
    const withQuote = docs.filter((d) => Boolean((d[field] as Fold)?.quote)).length
    console.log(
      `  ${String(field).padEnd(10)} content ${withContent}/${total} | quote ${withQuote}/${total}`,
    )
  }

  const ptTypesAll = new Map<string, number>()
  for (const doc of docs) {
    for (const [type, count] of ptBlockTypes(allBlocks(doc))) {
      ptTypesAll.set(type, (ptTypesAll.get(type) ?? 0) + count)
    }
  }
  console.log(`\nPortable Text _type frequencies across ALL rich fields:`)
  for (const [type, count] of [...ptTypesAll.entries()].sort()) {
    console.log(`  ${type}: ${count}`)
  }

  const withVideoEmbed = docs.filter((d) => allBlocks(d).some((b) => b._type === 'videoEmbed'))
  const withTable = docs.filter((d) => allBlocks(d).some((b) => b._type === 'table'))
  console.log(`\nCONTENT-1E embed recovery (reuse Blog/Compare handlers):`)
  console.log(`  docs with videoEmbed blocks: ${withVideoEmbed.length}/${total}`)
  for (const d of withVideoEmbed) console.log(`    ${d.slug}`)
  console.log(`  docs with table blocks: ${withTable.length}/${total}`)
  for (const d of withTable) console.log(`    ${d.slug}`)

  const videoUrlFilled = docs.filter((d) => isFilled(d, 'videoUrl'))
  console.log(`\nvideoUrl present: ${videoUrlFilled.length}/${total}`)
  for (const d of videoUrlFilled.slice(0, 12)) {
    console.log(`    ${d.slug} — ${d.videoUrl}`)
  }

  const slugPick =
    [...docs]
      .filter((d) => Boolean(d.companyLogo?.asset))
      .sort((a, b) => coverageScore(b) - coverageScore(a))[0] ??
    [...docs].sort((a, b) => coverageScore(b) - coverageScore(a))[0]

  console.log(`\nRecommended QA slug (fullest coverage + has companyLogo):`)
  console.log(`  slug: ${slugPick?.slug ?? '(none)'}`)
  console.log(`  title: ${slugPick?.customerStoryTitle ?? '(none)'}`)
  console.log(`  company: ${slugPick?.companyName ?? '(none)'}`)
  console.log(`  coverage: ${slugPick ? coverageScore(slugPick) : 0}/${EXPORT_FIELDS.length} export fields`)

  console.log(`\nTop 6 fullest docs by export coverage:`)
  for (const d of [...docs].sort((a, b) => coverageScore(b) - coverageScore(a)).slice(0, 6)) {
    console.log(
      `  ${d.slug} (${coverageScore(d)}/${EXPORT_FIELDS.length}) — logo:${d.companyLogo?.asset ? 'Y' : 'N'} P:${foldFilled(d.problem ?? null) ? 'Y' : 'N'} S:${foldFilled(d.solution ?? null) ? 'Y' : 'N'} I:${foldFilled(d.impact ?? null) ? 'Y' : 'N'} video:${d.videoUrl ? 'Y' : 'N'}`,
    )
  }

  console.log(`\nmeta fill:`)
  const metaTitle = docs.filter((d) => isFilled(d, 'metaTitle')).length
  const metaDesc = docs.filter((d) => isFilled(d, 'metaDescription')).length
  const reviewSnippet = docs.filter((d) => isFilled(d, 'reviewSnippetForMeta')).length
  console.log(`  metaTitle: ${metaTitle}/${total} | metaDescription: ${metaDesc}/${total} | reviewSnippetForMeta: ${reviewSnippet}/${total}`)

  console.log(`\nQA slug snapshot:`)
  const qa = await client.fetch<unknown>(
    `*[_type == "customerStory" && slug.current == $slug][0]{
      customerStoryTitle,
      companyName,
      "hasLogo": defined(companyLogo.asset),
      "hasProductImage": defined(companyProductImage.asset),
      "hasPeopleImage": defined(companyPeopleImage.asset),
      "hasThumbnail": defined(thumbnail.asset),
      videoUrl,
      "videoIntroBlocks": count(videoIntroContent),
      "tldrBlocks": count(tldrContent),
      "hiringNeedsBlocks": count(hiringNeedsTable),
      "theCustomerBlocks": count(theCustomerContent),
      "problemBlocks": count(problem.content),
      "problemQuote": defined(problem.quote),
      "solutionBlocks": count(solution.content),
      "solutionQuote": defined(solution.quote),
      "impactBlocks": count(impact.content),
      "impactQuote": defined(impact.quote),
      "ctaBlocks": count(ctaContent),
      reviewSnippetForMeta,
      metaTitle,
      metaDescription,
      "allTypes": array::unique(
        (videoIntroContent[]._type) + (tldrContent[]._type) + (hiringNeedsTable[]._type)
        + (theCustomerContent[]._type) + (ctaContent[]._type)
        + (problem.content[]._type) + (solution.content[]._type) + (impact.content[]._type)
      )
    }`,
    { slug: slugPick?.slug ?? '' },
  )
  console.log(JSON.stringify(qa, null, 2))

  console.log(`\nSample slugs (all ${total}):`)
  for (const d of docs) {
    console.log(`  /customer-story/${d.slug}  (logo:${d.companyLogo?.asset ? 'Y' : 'N'})`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

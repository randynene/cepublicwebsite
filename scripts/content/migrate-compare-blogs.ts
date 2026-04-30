// Migrates the Webflow `Compare Blogs` collection into Sanity `compareBlog`
// documents. Field mapping per WEBFLOW_TO_SANITY_FIELD_MAP §2 with CONTENT-1C
// brief corrections (Jake-approved 2026-04-30):
//
//   - tags slug is `tags-2` (NOT `tags`). References Tags >> Alternatives;
//     toRefs validates each ref ID against the Webflow ObjectId regex.
//   - Author slug is `author-2` (same correction as blogPost).
//   - There is NO `resource-category` field on this collection. The
//     Sanity payload MUST NOT include a `category` field — Step 7
//     asserts `*[_type == "compareBlog" && defined(category)] | count == 0`.
//   - `competitor` is extracted from the title via three explicit regexes
//     (separate patterns avoid capture-group index ambiguity). Failures
//     emit needsReview = true.
//   - Date regex parsing, FAQ 1-indexed loop, deterministic _keys — same
//     rules as blogPost (Step 2).
import { ensureSanity, ensureWebflow } from '@/lib/env'
import { CE_COLLECTION_IDS } from '@/lib/content/ce-collection-ids'
import {
  toPortableText,
  toRefs,
  uploadImage,
  webflowSlug,
} from '@/lib/content/migration-helpers'
import { recordMigration } from '@/lib/content/migration-tracker'
import { sanityWriteClient } from '@/lib/content/sanity-write-client'
import { getCollectionItems } from '@/lib/content/webflow-read-client'

ensureSanity()
ensureWebflow()

const AUTHOR_FIELD = 'author-2' as const
const WEBFLOW_ID_RE = /^[a-f0-9]{24}$/i

function parseWebflowDate(raw: unknown): string | null {
  if (!raw || typeof raw !== 'string') return null
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/)
  return match ? match[1] : null
}

function validRefId(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return WEBFLOW_ID_RE.test(trimmed) ? trimmed : null
}

function extractCompetitor(title: string): string | null {
  const patterns = [
    /Cloud Employee vs ([^—–|\n]+)/i,
    /([^—–|\n]+) vs Cloud Employee/i,
    /Cloud Employee Alternatives? to ([^—–|\n]+)/i,
  ]
  for (const pattern of patterns) {
    const match = title.match(pattern)
    if (match?.[1]) return match[1].trim()
  }
  return null
}

async function packFaqs(
  f: Record<string, unknown>,
): Promise<Array<{ _key: string; question: string; answer: unknown[] }>> {
  const out: Array<{ _key: string; question: string; answer: unknown[] }> = []
  for (let i = 1; i <= 6; i++) {
    const question = f[`faq-title-${i}`]
    if (typeof question !== 'string' || question.trim() === '') continue
    const answer = await toPortableText(f[`faq-content-${i}`])
    out.push({ _key: `faq-${i}`, question: question.trim(), answer })
  }
  return out
}

async function migrateCompareBlogs(): Promise<void> {
  const items = await getCollectionItems(CE_COLLECTION_IDS.compareBlogs)
  let migrated = 0
  const errors: string[] = []

  // Pre-flight: dedup against compareBlog slugs already in Sanity (partial
  // re-runs) and against the just-migrated blogPost slugs. Hard fail on
  // collisions WITHIN compareBlog (those would corrupt routing); blogPost
  // collisions are warnings only (different type, different routes).
  const sanityRows = await sanityWriteClient.fetch<Array<{ slug: string | null; type: string }>>(
    `*[_type in ["compareBlog","blogPost"] && !(_id match "smoke-test-*")]{ "slug": slug.current, "type": _type }`,
  )
  const existingCompareSlugs = new Set<string>()
  const existingBlogSlugs = new Set<string>()
  for (const row of sanityRows) {
    if (!row.slug) continue
    if (row.type === 'compareBlog') existingCompareSlugs.add(row.slug)
    else existingBlogSlugs.add(row.slug)
  }

  // Detect within-compareBlog dupes BEFORE writing.
  const seenSlugs = new Map<string, string>() // slug → first item.id
  const internalDupes: Array<{ slug: string; ids: string[] }> = []
  for (const item of items) {
    const s = webflowSlug(item)
    if (!s) continue
    if (seenSlugs.has(s)) {
      internalDupes.push({ slug: s, ids: [seenSlugs.get(s)!, item.id] })
    } else {
      seenSlugs.set(s, item.id)
    }
  }
  if (internalDupes.length > 0) {
    console.error('=== compareBlog internal slug collision — STOP ===')
    for (const d of internalDupes) console.error(`  • "${d.slug}": ${d.ids.join(', ')}`)
    throw new Error(`compareBlog: ${internalDupes.length} internal slug collision(s)`)
  }

  // Cross-type warning only.
  const crossType: string[] = []
  for (const s of seenSlugs.keys()) {
    if (existingBlogSlugs.has(s)) crossType.push(s)
  }
  if (crossType.length > 0) {
    console.warn(
      `[warn] ${crossType.length} compareBlog slug(s) collide with blogPost (cross-type, routes differ): ${crossType
        .slice(0, 5)
        .join(', ')}`,
    )
  }

  for (const item of items) {
    try {
      const f = item.fieldData
      const id = `compareBlog-${item.id}`
      const title = (f['name'] as string) ?? ''

      const competitor = title ? extractCompetitor(title) : null

      let author: { _type: 'reference'; _ref: string } | null = null
      const authorRefId = validRefId(f[AUTHOR_FIELD])
      if (authorRefId) author = { _type: 'reference', _ref: `teamMember-${authorRefId}` }

      const tags = toRefs(f['tags-2'], 'tag')
      const faqs = await packFaqs(f)
      const needsReview = !author || !competitor

      // EXPLICITLY do not include `category` — compareBlog has no category.
      const doc = {
        _id: id,
        _type: 'compareBlog',
        title: title || null,
        slug: { _type: 'slug', current: webflowSlug(item) },
        competitor,
        tags,
        author,
        date: parseWebflowDate(f['date']),
        featured: (f['featured'] as boolean) ?? false,
        thumbnailImage: await uploadImage(f['thumbnail-image']),
        openGraphImage: await uploadImage(f['open-graph-wide-image']),
        tldrSection: await toPortableText(f['tldr-section']),
        content: await toPortableText(f['content']),
        resourceDescription: (f['resource-description'] as string) ?? null,
        faqs,
        metaTitle: (f['meta-title'] as string) ?? null,
        metaDescription: (f['meta-description'] as string) ?? null,
        source: 'imported',
        needsReview,
        locale: 'default',
      }
      await sanityWriteClient.createOrReplace(doc)
      migrated++
      console.log(`✓ compareBlog: ${title} ${competitor ? `[vs ${competitor}]` : '[no competitor]'}`)
    } catch (err) {
      const msg = `Failed compareBlog ${item.id}: ${err instanceof Error ? err.message : String(err)}`
      errors.push(msg)
      console.error(`✗ ${msg}`)
    }
  }

  await recordMigration({
    collectionSlug: 'compare-blogs',
    sourceItemCount: items.length,
    migratedItemCount: migrated,
    status: errors.length === 0 ? 'complete' : 'failed',
    errorLog: errors,
  })

  console.log(`\nCompare Blogs: ${migrated}/${items.length} migrated. Errors: ${errors.length}`)
  if (existingCompareSlugs.size > 0) {
    console.log(`(Sanity already had ${existingCompareSlugs.size} compareBlog slugs — replaced via createOrReplace.)`)
  }
  if (errors.length > 0) process.exit(1)
}

migrateCompareBlogs().catch((err) => {
  console.error(err)
  process.exit(1)
})

// Migrates the 7 Webflow blog collections into Sanity `blogPost` documents.
// Field mapping per WEBFLOW_TO_SANITY_FIELD_MAP §1 with CONTENT-1C brief
// corrections (Jake-approved 2026-04-30).
//
// Dedup model (Jake clarification 2026-04-30):
//   `Blogs & Guides` (67459ce1ce88de64c07213a7) is the canonical master.
//   The 6 sub-category collections (Staff Augmentation, Nearshoring &
//   Offshoring, Scaling Teams, Hiring Tips, Managing Engineers, AI in
//   Software Dev) are mostly duplicates of master entries with new
//   Webflow IDs. The migrator iterates Blogs & Guides first, builds a
//   running slug set, then for each sub-category skips items whose slug
//   is already in the set. Each item's blogCategory comes from its
//   `resource-category` ref, never from its source collection.
//
//   Each collection still produces one Supabase `content_migrations`
//   row (7 total). For sub-categories: source_item_count = full Webflow
//   count, migrated_item_count = unique-only count, parity_score is
//   measured on the deduplicated set via parityBaselineCount.
//
// Brief-mandated rules:
//   - Author slug = `author-2`. NEVER fall back to `author`.
//   - Date = regex `YYYY-MM-DD` prefix (no `new Date()` — timezone shift).
//   - FAQ loop = 1-indexed inclusive, `for i = 1; i <= 6`.
//   - Every reference ID validated against /^[a-f0-9]{24}$/i before
//     constructing a `_ref`. Malformed → log + null + needsReview.
import { ensureSanity, ensureWebflow } from '@/lib/env'
import { CE_COLLECTION_IDS, CE_BLOG_COLLECTIONS } from '@/lib/content/ce-collection-ids'
import {
  toPortableText,
  toRefs,
  uploadImage,
  webflowSlug,
} from '@/lib/content/migration-helpers'
import { recordMigration } from '@/lib/content/migration-tracker'
import { sanityWriteClient } from '@/lib/content/sanity-write-client'
import { getCollectionItems, type WebflowItem } from '@/lib/content/webflow-read-client'

ensureSanity()
ensureWebflow()

const AUTHOR_FIELD = 'author-2' as const // NEVER fall back to 'author'
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

async function packFaqs(
  f: Record<string, unknown>,
): Promise<Array<{ _key: string; question: string; answer: unknown[] }>> {
  // 1-indexed inclusive: faq-title-1..6 / faq-content-1..6.
  const out: Array<{ _key: string; question: string; answer: unknown[] }> = []
  for (let i = 1; i <= 6; i++) {
    const question = f[`faq-title-${i}`]
    if (typeof question !== 'string' || question.trim() === '') continue
    const answer = await toPortableText(f[`faq-content-${i}`])
    out.push({ _key: `faq-${i}`, question: question.trim(), answer })
  }
  return out
}

async function preflight(): Promise<{
  itemsByCollection: Map<string, WebflowItem[]>
  sanityExisting: Set<string>
}> {
  const itemsByCollection = new Map<string, WebflowItem[]>()
  for (const c of CE_BLOG_COLLECTIONS) {
    const items = await getCollectionItems(c.id)
    itemsByCollection.set(c.id, items)
  }
  // Also fetch compareBlog items for cross-type warning only — compareBlog
  // is migrated in Step 3, separate type, separate route. Cross-type slug
  // collisions are surfaced as warnings, not hard failures.
  const compareItems = await getCollectionItems(CE_COLLECTION_IDS.compareBlogs)
  itemsByCollection.set(CE_COLLECTION_IDS.compareBlogs, compareItems)

  const sanityExisting = new Set<string>()
  const sanityRows = await sanityWriteClient.fetch<Array<{ slug: string | null; type: string }>>(
    `*[_type in ["blogPost","compareBlog"] && !(_id match "smoke-test-*")]{ "slug": slug.current, "type": _type }`,
  )
  for (const row of sanityRows) {
    if (row.slug) sanityExisting.add(row.slug)
  }
  return { itemsByCollection, sanityExisting }
}

async function migrateOneItem(
  item: WebflowItem,
  collectionName: string,
): Promise<void> {
  const f = item.fieldData
  const id = `blogPost-${item.id}`

  // Category — Webflow `resource-category` is a ref into Hubs (which migrates
  // to blogCategory). The item's own resource-category determines its
  // blogCategory, regardless of which collection it came from.
  let category: { _type: 'reference'; _ref: string } | null = null
  const categoryRefId = validRefId(f['resource-category'])
  if (categoryRefId) {
    category = { _type: 'reference', _ref: `blogCategory-${categoryRefId}` }
  } else {
    console.warn(`[blogPost ${item.id}] missing or invalid resource-category`)
  }

  // Author — `author-2` slug only. ~25% fill rate; null is expected.
  let author: { _type: 'reference'; _ref: string } | null = null
  const authorRefId = validRefId(f[AUTHOR_FIELD])
  if (authorRefId) author = { _type: 'reference', _ref: `teamMember-${authorRefId}` }

  const tags = toRefs(f['tags'], 'tag')
  const faqs = await packFaqs(f)
  const needsReview = !author || !category

  const doc = {
    _id: id,
    _type: 'blogPost',
    title: (f['name'] as string) ?? null,
    slug: { _type: 'slug', current: webflowSlug(item) },
    category,
    tags,
    author,
    date: parseWebflowDate(f['date']),
    thumbnailImage: await uploadImage(f['thumbnail-image']),
    openGraphImage: await uploadImage(f['open-graph-wide-image']),
    tldrSection: await toPortableText(f['tldr-section']),
    content: await toPortableText(f['content']),
    resourceDescription: (f['resource-description'] as string) ?? null,
    featured: (f['featured'] as boolean) ?? false,
    metaTitle: (f['meta-title'] as string) ?? null,
    metaDescription: (f['meta-description'] as string) ?? null,
    faqs,
    source: 'imported',
    needsReview,
    locale: 'default',
  }
  await sanityWriteClient.createOrReplace(doc)
  console.log(`✓ blogPost [${collectionName}]: ${doc.title}`)
}

async function migrateOneCollection(
  collection: { id: string; name: string; collectionSlug: string },
  items: WebflowItem[],
  globalSlugSet: Set<string>,
  isMaster: boolean,
): Promise<{ migrated: number; uniqueCount: number; errors: string[] }> {
  let migrated = 0
  const errors: string[] = []

  // Build the list of items to attempt for this collection.
  const eligible: WebflowItem[] = []
  let skipped = 0
  for (const item of items) {
    const slug = webflowSlug(item)
    if (!slug) {
      errors.push(`[${collection.name}] item ${item.id} has no slug; skipped`)
      continue
    }
    if (!isMaster && globalSlugSet.has(slug)) {
      skipped++
      continue // already covered by master or earlier sub-category
    }
    eligible.push(item)
  }
  if (skipped > 0) {
    console.log(`[${collection.name}] skipped ${skipped} duplicates already in master/earlier collections`)
  }

  for (const item of eligible) {
    try {
      await migrateOneItem(item, collection.name)
      migrated++
      const slug = webflowSlug(item)
      if (slug) globalSlugSet.add(slug)
    } catch (err) {
      const msg = `Failed blogPost ${item.id} (${collection.name}): ${err instanceof Error ? err.message : String(err)}`
      errors.push(msg)
      console.error(`✗ ${msg}`)
    }
  }

  await recordMigration({
    collectionSlug: collection.collectionSlug,
    sourceItemCount: items.length,
    migratedItemCount: migrated,
    parityBaselineCount: eligible.length,
    status: errors.length === 0 ? 'complete' : 'failed',
    errorLog: errors,
  })

  console.log(
    `[${collection.name}] source=${items.length}, eligible=${eligible.length}, migrated=${migrated}, errors=${errors.length}`,
  )
  return { migrated, uniqueCount: eligible.length, errors }
}

async function main(): Promise<void> {
  const { itemsByCollection, sanityExisting } = await preflight()
  console.log(`[preflight] Sanity already has ${sanityExisting.size} non-smoke-test blogPost/compareBlog slugs\n`)

  // Cross-type warning only — compareBlog slug collision with a blogPost
  // is unusual but not a routing failure.
  const compareSlugs = new Set<string>()
  for (const item of itemsByCollection.get(CE_COLLECTION_IDS.compareBlogs) ?? []) {
    const s = webflowSlug(item)
    if (s) compareSlugs.add(s)
  }

  // Global slug set seeded with what's already in Sanity so a partial
  // re-run never double-writes a slug under a new _id. Master collection
  // first; sub-categories see master's slugs and skip duplicates.
  const globalSlugSet = new Set<string>(sanityExisting)

  let totalMigrated = 0
  let totalUnique = 0
  let totalErrors = 0

  for (const c of CE_BLOG_COLLECTIONS) {
    const items = itemsByCollection.get(c.id) ?? []
    const isMaster = c.id === CE_COLLECTION_IDS.blogsAndGuides
    const result = await migrateOneCollection(c, items, globalSlugSet, isMaster)
    totalMigrated += result.migrated
    totalUnique += result.uniqueCount
    totalErrors += result.errors.length
  }

  // Cross-type slug collision warnings against compareBlog (informational).
  const blogSlugs = new Set<string>()
  for (const c of CE_BLOG_COLLECTIONS) {
    for (const item of itemsByCollection.get(c.id) ?? []) {
      const s = webflowSlug(item)
      if (s) blogSlugs.add(s)
    }
  }
  const crossTypeOverlaps = [...compareSlugs].filter((s) => blogSlugs.has(s))
  if (crossTypeOverlaps.length > 0) {
    console.warn(
      `\n[warn] ${crossTypeOverlaps.length} compareBlog slug(s) overlap with blogPost: ${crossTypeOverlaps
        .slice(0, 5)
        .join(', ')}${crossTypeOverlaps.length > 5 ? ', …' : ''}`,
    )
  }

  console.log(
    `\n=== blogPost migration: ${totalMigrated}/${totalUnique} unique items written across ${CE_BLOG_COLLECTIONS.length} collections (errors: ${totalErrors}) ===`,
  )
  if (totalErrors > 0) process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

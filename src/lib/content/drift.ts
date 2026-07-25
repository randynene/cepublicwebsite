// Content drift analysis: Webflow (live) vs Sanity (production).
//
// The CONTENT-1 migration ran against a 2026-04 Webflow snapshot. Anything that
// changed upstream since then is drift, and drift is what breaks a cutover: a
// document Sanity still holds but Webflow no longer serves would resurrect a
// page the customer deliberately took down.
//
// Shared by scripts/content/diag-drift-jul-2026.ts (reports) and
// scripts/content/retire-orphaned-docs.ts (acts). They must never disagree
// about what an orphan is, so the definition lives here once.
import { CE_BLOG_COLLECTIONS, CE_COLLECTION_IDS } from '@/lib/content/ce-collection-ids'
import { webflowSlug } from '@/lib/content/migration-helpers'
import { sanityWriteClient } from '@/lib/content/sanity-write-client'
import { getLiveCollectionItems, type WebflowItem } from '@/lib/content/webflow-read-client'

export type DriftSource = {
  sanityType: string
  label: string
  collectionIds: string[]
}

export const DRIFT_SOURCES: DriftSource[] = [
  { sanityType: 'tag', label: 'Tags (6 collections)', collectionIds: [
    CE_COLLECTION_IDS.tagsBlogs,
    CE_COLLECTION_IDS.tagsAlternatives,
    CE_COLLECTION_IDS.tagsTools,
    CE_COLLECTION_IDS.tagsVideoLibrary,
    CE_COLLECTION_IDS.tagsDownloads,
    CE_COLLECTION_IDS.tagsEventsWebinars,
  ] },
  { sanityType: 'blogCategory', label: 'Hubs', collectionIds: [CE_COLLECTION_IDS.hubs] },
  { sanityType: 'glassdoorReview', label: 'Glassdoor Reviews', collectionIds: [CE_COLLECTION_IDS.glassdoorReviews] },
  { sanityType: 'benefitValue', label: 'Client Benefits', collectionIds: [CE_COLLECTION_IDS.clientBenefits] },
  { sanityType: 'staffBenefit', label: 'Staff Benefits', collectionIds: [CE_COLLECTION_IDS.staffBenefits] },
  { sanityType: 'teamMember', label: 'Team Members', collectionIds: [CE_COLLECTION_IDS.teamMembers] },
  { sanityType: 'review', label: 'Reviews', collectionIds: [CE_COLLECTION_IDS.reviews] },
  { sanityType: 'video', label: 'Videos', collectionIds: [CE_COLLECTION_IDS.videos] },
  { sanityType: 'bookACall', label: 'Book A Call', collectionIds: [CE_COLLECTION_IDS.bookACall] },
  { sanityType: 'event', label: 'Events & Webinars', collectionIds: [CE_COLLECTION_IDS.eventsWebinars] },
  { sanityType: 'tool', label: 'Tools & Quizzes', collectionIds: [CE_COLLECTION_IDS.toolsQuizzes] },
  { sanityType: 'download', label: 'Downloads', collectionIds: [CE_COLLECTION_IDS.downloads] },
  { sanityType: 'downloadAccess', label: 'Downloads Access', collectionIds: [CE_COLLECTION_IDS.downloadsAccess] },
  { sanityType: 'blogPost', label: 'Blog Posts (7 collections)', collectionIds: CE_BLOG_COLLECTIONS.map((c) => c.id) },
  { sanityType: 'compareBlog', label: 'Compare Blogs', collectionIds: [CE_COLLECTION_IDS.compareBlogs] },
  { sanityType: 'technology', label: 'Technology Pages', collectionIds: [CE_COLLECTION_IDS.technologyPages] },
  { sanityType: 'service', label: 'Services', collectionIds: [CE_COLLECTION_IDS.services] },
  { sanityType: 'customerStory', label: 'Customer Stories', collectionIds: [CE_COLLECTION_IDS.customerStories] },
]

type SanityRow = {
  _id: string
  _updatedAt: string
  slug: string | null
  retired: boolean | null
}

export type Drift = {
  source: DriftSource
  /** Live in Webflow, absent from Sanity. Migrate these. */
  missing: Array<{ slug: string; title: string; webflowId: string }>
  /** In Sanity, not live in Webflow. Retire these; do not delete. */
  orphan: Array<{ slug: string; id: string; alreadyRetired: boolean }>
  /**
   * Slug present in both, but the Sanity _id does not match the current Webflow
   * item ID. Every CONTENT-1 migrator derives _id as `${_type}-${webflowItemId}`,
   * so re-running one would createOrReplace under a NEW _id: the old document
   * survives as a duplicate and every inbound reference to it still points at
   * the stale copy. Fix the migrators to key on slug before re-running any.
   */
  idChurn: Array<{ slug: string; sanityId: string; expectedId: string }>
  /** Published upstream more recently than the Sanity doc was touched. Advisory. */
  stale: Array<{ slug: string; webflow: string; sanity: string }>
  webflowCount: number
  sanityCount: number
}

function itemTitle(item: WebflowItem): string {
  const name = item.fieldData['name']
  return typeof name === 'string' ? name : '(untitled)'
}

export async function analyseDrift(source: DriftSource): Promise<Drift> {
  // /items/live, never /items. The staged endpoint diverges from the published
  // site in both directions: it retains deleted items, and it flags as isDraft
  // items whose published version is still serving. See getLiveCollectionItems.
  const items: WebflowItem[] = []
  for (const collectionId of source.collectionIds) {
    items.push(...(await getLiveCollectionItems(collectionId)))
  }

  const rows = await sanityWriteClient.fetch<SanityRow[]>(
    `*[_type == $type && !(_id match "smoke-test-*")]{ _id, _updatedAt, "slug": slug.current, retired }`,
    { type: source.sanityType },
  )

  const sanityBySlug = new Map<string, SanityRow>()
  for (const row of rows) {
    if (row.slug) sanityBySlug.set(row.slug, row)
  }

  const missing: Drift['missing'] = []
  const idChurn: Drift['idChurn'] = []
  const stale: Drift['stale'] = []
  const webflowSlugs = new Set<string>()

  for (const item of items) {
    const slug = webflowSlug(item)
    if (!slug) continue
    webflowSlugs.add(slug)

    const row = sanityBySlug.get(slug)
    if (!row) {
      missing.push({ slug, title: itemTitle(item), webflowId: item.id })
      continue
    }

    const expectedId = `${source.sanityType}-${item.id}`
    if (row._id !== expectedId) {
      idChurn.push({ slug, sanityId: row._id, expectedId })
      continue
    }

    // lastPublished is null for an item that has never been published. Fall back
    // to lastUpdated so an edited-but-unpublished item does not read as fresh.
    const webflowStamp = item.lastPublished ?? item.lastUpdated
    if (webflowStamp && new Date(webflowStamp) > new Date(row._updatedAt)) {
      stale.push({ slug, webflow: webflowStamp, sanity: row._updatedAt })
    }
  }

  const orphan = rows
    .filter((r) => r.slug !== null && !webflowSlugs.has(r.slug))
    .map((r) => ({ slug: r.slug as string, id: r._id, alreadyRetired: r.retired === true }))

  return {
    source,
    missing,
    orphan,
    idChurn,
    stale,
    webflowCount: items.length,
    sanityCount: rows.length,
  }
}

export async function analyseAllDrift(): Promise<Drift[]> {
  const out: Drift[] = []
  for (const source of DRIFT_SOURCES) {
    out.push(await analyseDrift(source))
  }
  return out
}

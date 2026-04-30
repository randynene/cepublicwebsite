// Pre-flight verification for MYGRATR-CONTENT-1C (Step 1).
//
// 1. Confirms migrations.status = content_running for the CE row.
// 2. Fetches one item from each of the 11 CONTENT-1C source collections
//    and asserts that every API slug listed in the brief §2 slug sweep
//    is actually present on the response. Exits non-zero with a concrete
//    discrepancy list if any field is missing.
import { ensureSanity, ensureWebflow } from '@/lib/env'
import { createServerClient } from '@/lib/supabase'
import { CE_COLLECTION_IDS, CE_BLOG_COLLECTIONS } from '@/lib/content/ce-collection-ids'
import { getCollectionItems } from '@/lib/content/webflow-read-client'

ensureSanity()
ensureWebflow()

const ORG_ID = 'ce000000-0000-0000-0000-000000000001'
const MIGRATION_ID = 'ce000000-0000-0000-0000-000000000002'

// Expected API slugs per brief §2 slug sweep. The migrator only fails if a
// REQUIRED slug is missing — optional ones (0% fill rate fields) are
// tolerated since Webflow may omit empty fields from a single item's payload.
type SlugCheck = {
  collectionId: string
  collectionName: string
  required: string[]
  optional: string[]
}

const BLOG_REQUIRED = [
  'name',
  'slug',
  'author-2',
  'thumbnail-image',
  'tldr-section',
  'content',
  'resource-category',
  'tags',
]
const BLOG_OPTIONAL = [
  'open-graph-wide-image',
  'meta-title',
  'meta-description',
  'featured',
  'resource-description',
  'date',
  ...Array.from({ length: 6 }, (_, i) => `faq-title-${i + 1}`),
  ...Array.from({ length: 6 }, (_, i) => `faq-content-${i + 1}`),
]

const CHECKS: SlugCheck[] = [
  ...CE_BLOG_COLLECTIONS.map((c) => ({
    collectionId: c.id,
    collectionName: c.name,
    required: BLOG_REQUIRED,
    optional: BLOG_OPTIONAL,
  })),
  {
    collectionId: CE_COLLECTION_IDS.compareBlogs,
    collectionName: 'Compare Blogs',
    required: ['name', 'slug', 'author-2', 'thumbnail-image', 'tldr-section', 'content', 'tags-2'],
    optional: BLOG_OPTIONAL,
  },
  {
    collectionId: CE_COLLECTION_IDS.technologyPages,
    collectionName: 'Technology Pages',
    required: [
      'name',
      'slug',
      'short-description',
      'header-blurb',
      'fold-1---paragraph',
      'section-1-label',
      'focus-1-title',
      'focus-1-blurb',
      'fold-2---paragraph',
      'focus-2-title',
      'focus-3-title',
      'focus-3-blurb',
      'fold-3---item-2-header',
      'fold-3---item-2-description',
      'fold-5---label',
      'fold-5---header',
      'fold-5---description',
    ],
    optional: ['technology-name', 'order', 'list-item-only', 'tech-logo', 'thumbnail', 'fold-6---label', 'fold-6---header'],
  },
  {
    collectionId: CE_COLLECTION_IDS.services,
    collectionName: 'Services',
    required: ['name', 'slug', 'type', 'short-label', 'fold-1---header-pre', 'fold-2---paragraph-2'],
    optional: [
      'order',
      'prefix',
      'ai-offering',
      'location',
      'thumbnail',
      'associated-technologies',
      'fold-1---paragraph',
      'fold-1---bullet-1',
      'fold-2---label',
      'fold-2---header',
      'fold-3---label',
      'fold-3---header',
      'fold-4---label',
      'fold-4---header',
      'fold-5---label',
      'fold-5---header',
      'fold-5---description',
      'fold-6---label',
      'fold-6---header',
    ],
  },
  {
    collectionId: CE_COLLECTION_IDS.customerStories,
    collectionName: 'Customer Stories',
    required: [
      'name',
      'slug',
      'customer-story-title',
    ],
    optional: [
      'order',
      'feature-in-home-page-header-scrolls',
      'feature-in-featured-customers-section',
      'featured-on-cs-page',
      'company-logo',
      'company-product-image',
      'company-people-image',
      'thumbnail',
      'video-testimonial-if-available',
      'video-testimonial-intro-content',
      'tldr-content',
      'hiring-needs-table',
      'the-customer-content',
      'the-problem-content',
      'the-solution-content',
      'the-impact-content',
      'problem-quote---paragraph',
      'problem-quote---person-image',
      'problem-quote---person-name',
      'problem-quote---person-title',
      'solution-quote---paragraph',
      'impact-quote---paragraph',
      'cta-content',
      'review-snippet-for-google-meta',
    ],
  },
]

async function checkMigrationStatus(): Promise<void> {
  const client = createServerClient()
  const { data, error } = await client
    .from('migrations')
    .select('status, current_phase')
    .eq('org_id', ORG_ID)
    .eq('id', MIGRATION_ID)
    .single()
  if (error) throw new Error(`migrations row fetch failed: ${error.message}`)
  if (!data) throw new Error('CE migrations row missing')
  console.log(`[migrations] status=${data.status} current_phase=${data.current_phase}`)
  if (data.status !== 'content_running') {
    throw new Error(
      `Expected migrations.status=content_running, got "${data.status}" — STOP. Brief Step 1 precondition violated.`,
    )
  }
}

async function checkCollectionSlugs(check: SlugCheck): Promise<{
  collectionName: string
  missing: string[]
  optionalMissing: string[]
  present: string[]
  itemId: string | null
}> {
  // Fetch a single item — first page is enough for slug sweep.
  const items = await getCollectionItems(check.collectionId)
  if (items.length === 0) {
    return {
      collectionName: check.collectionName,
      missing: check.required,
      optionalMissing: check.optional,
      present: [],
      itemId: null,
    }
  }
  // Use the union of all field keys across all items so an empty value on
  // a sample item doesn't false-positive a missing slug. Webflow omits some
  // empty fields from a per-item payload; the sweep across the whole
  // collection produces a complete key set.
  const keys = new Set<string>()
  for (const item of items) {
    for (const k of Object.keys(item.fieldData)) keys.add(k)
  }
  const missing = check.required.filter((s) => !keys.has(s))
  const optionalMissing = check.optional.filter((s) => !keys.has(s))
  return {
    collectionName: check.collectionName,
    missing,
    optionalMissing,
    present: [...keys],
    itemId: items[0].id,
  }
}

async function main(): Promise<void> {
  console.log('=== MYGRATR-CONTENT-1C pre-flight check ===\n')

  await checkMigrationStatus()
  console.log('')

  const failures: string[] = []
  for (const check of CHECKS) {
    process.stdout.write(`[${check.collectionName}] `)
    try {
      const result = await checkCollectionSlugs(check)
      if (result.missing.length === 0) {
        console.log(`OK — ${result.present.length} fields present`)
      } else {
        console.log(`MISSING REQUIRED: ${result.missing.join(', ')}`)
        failures.push(`${check.collectionName}: missing required slugs ${JSON.stringify(result.missing)}`)
      }
      if (result.optionalMissing.length > 0) {
        console.log(`  ⚠ optional slugs not present (may be 0% fill): ${result.optionalMissing.join(', ')}`)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.log(`FETCH FAILED: ${msg}`)
      failures.push(`${check.collectionName}: ${msg}`)
    }
  }

  console.log('')
  if (failures.length > 0) {
    console.error('=== PRE-FLIGHT FAILED ===')
    for (const f of failures) console.error(`  • ${f}`)
    process.exit(1)
  }
  console.log('=== PRE-FLIGHT PASSED — safe to proceed with CONTENT-1C migration ===')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

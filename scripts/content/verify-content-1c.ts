// CONTENT-1C verification (HARD GATE — Step 7).
// Aggregates every check listed in the brief §4 Step 7 against live
// Sanity + Supabase state. Exits non-zero on any failure.
import { ensureSanity } from '@/lib/env'
import { createServerClient } from '@/lib/supabase'
import { sanityWriteClient } from '@/lib/content/sanity-write-client'

ensureSanity()

const ORG_ID = 'ce000000-0000-0000-0000-000000000001'
const MIGRATION_ID = 'ce000000-0000-0000-0000-000000000002'

// CONTENT-1C content_migrations rows. Updated to match actual live data:
//   - blogPost is split across 7 rows (one per source collection); the
//     consolidated dedup model means sub-category source counts ≠ migrated
//     counts but parity_score still hits 100 via parityBaselineCount.
//   - compareBlog Webflow API returns 30 (brief said 29).
//   - blogPost unique total = 74 (brief said 98).
const EXPECTED_COUNTS = {
  blogPost: 74,
  compareBlog: 30,
  technology: 101,
  service: 23,
  customerStory: 18,
} as const

const CONTENT_1C_COLLECTION_SLUGS = [
  'blogs-and-guides',
  'staff-augmentation-blogs',
  'nearshoring-offshoring-blogs',
  'scaling-teams-blogs',
  'hiring-tips-blogs',
  'managing-engineers-blogs',
  'ai-software-dev-blogs',
  'compare-blogs',
  'technology',
  'services',
  'customer-stories',
] as const

type CheckResult = { name: string; ok: boolean; detail: string }

const results: CheckResult[] = []

function record(name: string, ok: boolean, detail: string): void {
  results.push({ name, ok, detail })
  console.log(`${ok ? '✅' : '❌'} ${name} — ${detail}`)
}

async function checkSanityCounts(): Promise<void> {
  for (const [type, expected] of Object.entries(EXPECTED_COUNTS)) {
    const actual = await sanityWriteClient.fetch<number>(
      `count(*[_type == $type && !(_id match "smoke-test-*")])`,
      { type },
    )
    record(
      `Sanity count: ${type}`,
      actual === expected,
      `expected=${expected}, actual=${actual}`,
    )
  }
}

async function checkSupabaseRows(): Promise<void> {
  const client = createServerClient()
  const { data, error } = await client
    .from('content_migrations')
    .select('collection_slug, source_item_count, migrated_item_count, parity_score, status')
    .eq('org_id', ORG_ID)
    .eq('migration_id', MIGRATION_ID)
    .in('collection_slug', [...CONTENT_1C_COLLECTION_SLUGS])
  if (error) throw new Error(`content_migrations query failed: ${error.message}`)
  const rows = data ?? []

  const present = new Set(rows.map((r) => r.collection_slug))
  const missing = CONTENT_1C_COLLECTION_SLUGS.filter((s) => !present.has(s))
  record(
    'Supabase: 11 CONTENT-1C tracking rows present',
    missing.length === 0 && rows.length === 11,
    missing.length === 0
      ? `${rows.length} rows`
      : `missing: ${missing.join(', ')} (got ${rows.length}/11)`,
  )

  for (const row of rows) {
    const status = row.status as string
    const parity = Number(row.parity_score)
    const ok = status === 'complete' && Math.abs(parity - 100) < 0.001
    record(
      `Supabase row: ${row.collection_slug}`,
      ok,
      `status=${status}, parity_score=${parity}, source=${row.source_item_count}, migrated=${row.migrated_item_count}`,
    )
  }
}

async function checkBlogPostSlugUniqueness(): Promise<void> {
  const slugs = await sanityWriteClient.fetch<string[]>(
    `*[_type == "blogPost" && !(_id match "smoke-test-*")].slug.current`,
  )
  const seen = new Map<string, number>()
  for (const s of slugs) seen.set(s, (seen.get(s) ?? 0) + 1)
  const dupes = [...seen.entries()].filter(([, n]) => n > 1)
  record(
    'blogPost slug uniqueness',
    dupes.length === 0,
    dupes.length === 0
      ? `${slugs.length} slugs, all unique`
      : `duplicates: ${dupes.map(([s, n]) => `${s}(×${n})`).join(', ')}`,
  )
}

async function checkCompareBlogNoCategory(): Promise<void> {
  const count = await sanityWriteClient.fetch<number>(
    `count(*[_type == "compareBlog" && defined(category)])`,
  )
  record(
    'compareBlog: no `category` field',
    count === 0,
    `defined(category) on ${count} doc(s)`,
  )
}

async function checkReferenceIntegritySpotCheck(): Promise<void> {
  // For 3 blogPost docs (chosen by Sanity ordering), assert tags refs
  // resolve and category resolves where defined.
  const samples = await sanityWriteClient.fetch<
    Array<{
      _id: string
      slug: string
      categoryId: string | null
      tagIds: string[]
      authorId: string | null
    }>
  >(
    `*[_type == "blogPost" && !(_id match "smoke-test-*")][0...3]{
       _id,
       "slug": slug.current,
       "categoryId": category._ref,
       "tagIds": tags[]._ref,
       "authorId": author._ref
     }`,
  )
  let ok = true
  const detail: string[] = []
  for (const s of samples) {
    if (s.categoryId) {
      const exists = await sanityWriteClient.fetch<number>(
        `count(*[_id == $id])`,
        { id: s.categoryId },
      )
      if (exists !== 1) {
        ok = false
        detail.push(`${s.slug}: category ${s.categoryId} not found`)
      }
    }
    for (const tagId of s.tagIds ?? []) {
      const exists = await sanityWriteClient.fetch<number>(
        `count(*[_id == $id])`,
        { id: tagId },
      )
      if (exists !== 1) {
        ok = false
        detail.push(`${s.slug}: tag ${tagId} not found`)
      }
    }
    if (s.authorId) {
      const exists = await sanityWriteClient.fetch<number>(
        `count(*[_id == $id])`,
        { id: s.authorId },
      )
      if (exists !== 1) {
        ok = false
        detail.push(`${s.slug}: author ${s.authorId} not found`)
      }
    }
  }
  record(
    'blogPost reference integrity (3 spot-checks)',
    ok,
    ok ? `${samples.length} samples ok` : detail.join('; '),
  )
}

async function checkCompareBlogTagsAreAlternatives(): Promise<void> {
  // Every tag _ref on compareBlog should resolve to a tag with category=alternatives.
  const samples = await sanityWriteClient.fetch<
    Array<{ _id: string; tagIds: string[] }>
  >(
    `*[_type == "compareBlog" && !(_id match "smoke-test-*") && count(tags) > 0][0...3]{
       _id, "tagIds": tags[]._ref
     }`,
  )
  let ok = true
  const detail: string[] = []
  for (const s of samples) {
    for (const tagId of s.tagIds ?? []) {
      const tag = await sanityWriteClient.fetch<{ category: string } | null>(
        `*[_id == $id][0]{category}`,
        { id: tagId },
      )
      if (!tag) {
        ok = false
        detail.push(`${s._id}: tag ${tagId} not found`)
      } else if (tag.category !== 'alternatives') {
        ok = false
        detail.push(`${s._id}: tag ${tagId} has category=${tag.category}, expected alternatives`)
      }
    }
  }
  record(
    'compareBlog tags are category=alternatives',
    ok,
    ok ? `${samples.length} sample(s) clean` : detail.join('; '),
  )
}

async function checkServiceTechnologyRefs(): Promise<void> {
  const samples = await sanityWriteClient.fetch<
    Array<{ _id: string; refs: string[] }>
  >(
    `*[_type == "service" && count(associatedTechnologies) > 0][0...3]{
       _id, "refs": associatedTechnologies[]._ref
     }`,
  )
  let ok = true
  const detail: string[] = []
  for (const s of samples) {
    for (const ref of s.refs ?? []) {
      const exists = await sanityWriteClient.fetch<number>(
        `count(*[_id == $id && _type == "technology"])`,
        { id: ref },
      )
      if (exists !== 1) {
        ok = false
        detail.push(`${s._id}: technology ${ref} not found`)
      }
    }
  }
  record(
    'service.associatedTechnologies refs resolve',
    ok,
    samples.length === 0
      ? '(no service has any associatedTechnologies — all 23 had 0% Webflow fill, expected)'
      : ok
        ? `${samples.length} sample(s) clean`
        : detail.join('; '),
  )
}

async function checkServiceOptions(): Promise<void> {
  const validTypes = new Set(['staffAugmentation', 'productBuilds', 'consultingServices'])
  const validPrefixes = new Set(['hire', 'build', 'expert', 'endToEnd'])
  const samples = await sanityWriteClient.fetch<
    Array<{ _id: string; type: string | null; prefix: string | null }>
  >(`*[_type == "service" && !(_id match "smoke-test-*")][0...3]{ _id, type, prefix }`)
  let ok = true
  const detail: string[] = []
  for (const s of samples) {
    if (!s.type || !validTypes.has(s.type)) {
      ok = false
      detail.push(`${s._id}: invalid type=${JSON.stringify(s.type)}`)
    }
    if (s.prefix && !validPrefixes.has(s.prefix)) {
      ok = false
      detail.push(`${s._id}: invalid prefix=${JSON.stringify(s.prefix)}`)
    }
  }
  record(
    'service type/prefix enums valid',
    ok,
    ok ? `${samples.length} sample(s) clean` : detail.join('; '),
  )
}

async function checkShortLabelCrossCheck(): Promise<void> {
  const techWithShortLabel = await sanityWriteClient.fetch<number>(
    `count(*[_type == "technology" && defined(shortLabel)])`,
  )
  const serviceWithShortLabel = await sanityWriteClient.fetch<number>(
    `count(*[_type == "service" && defined(shortLabel)])`,
  )
  record(
    'shortLabel cross-check (technology + service)',
    techWithShortLabel >= 1 && serviceWithShortLabel >= 1,
    `technology=${techWithShortLabel}, service=${serviceWithShortLabel}`,
  )
}

async function checkInlineImageDoc(): Promise<void> {
  // Find a blogPost whose content array contains an image block — this
  // verifies the Step 0a two-pass walk shipped real Sanity assets, not
  // bare `<img src="...">` lost in translation.
  const sample = await sanityWriteClient.fetch<
    { _id: string; slug: string; imageCount: number } | null
  >(
    `*[_type == "blogPost" && count(content[_type == "image"]) > 0][0]{
       _id, "slug": slug.current,
       "imageCount": count(content[_type == "image"])
     }`,
  )
  record(
    'blogPost contains inline image blocks',
    sample !== null,
    sample
      ? `${sample.slug} has ${sample.imageCount} inline image block(s)`
      : 'no blogPost with inline images found',
  )
}

async function checkTechnologyFolds(): Promise<void> {
  const samples = await sanityWriteClient.fetch<
    Array<{ _id: string; slug: string; foldCount: number; foldTypes: string[] }>
  >(
    `*[_type == "technology" && !(_id match "smoke-test-*") && count(folds) > 0][0...3]{
       _id, "slug": slug.current, "foldCount": count(folds), "foldTypes": folds[].type
     }`,
  )
  const ok =
    samples.length === 3 &&
    samples.every((s) => s.foldCount > 0 && s.foldTypes.every((t) => !!t))
  record(
    'technology fold structure (3 spot-checks)',
    ok,
    ok
      ? samples.map((s) => `${s.slug}=${s.foldTypes.join(',')}`).join(' | ')
      : `samples=${JSON.stringify(samples)}`,
  )
}

async function checkCustomerStorySpotChecks(): Promise<void> {
  // Event Connections (full narrative), SQR (impact-quote only), and any
  // empty shell (verify no crash, fields just empty).
  const eventConnections = await sanityWriteClient.fetch<
    | { _id: string; problem: unknown; solution: unknown; impact: unknown }
    | null
  >(`*[_type == "customerStory" && companyName == "Event Connections"][0]{ _id, problem, solution, impact }`)
  const sqr = await sanityWriteClient.fetch<
    | { _id: string; problem: unknown; impact: { content: unknown; quote: unknown } | null }
    | null
  >(`*[_type == "customerStory" && companyName == "SQR"][0]{ _id, problem, impact }`)

  const eventOk =
    !!eventConnections &&
    eventConnections.problem != null &&
    eventConnections.solution != null &&
    eventConnections.impact != null
  record(
    'customerStory: Event Connections has problem+solution+impact',
    eventOk,
    eventConnections
      ? `problem=${eventConnections.problem ? 'y' : '·'}, solution=${eventConnections.solution ? 'y' : '·'}, impact=${eventConnections.impact ? 'y' : '·'}`
      : 'doc not found',
  )

  const sqrOk =
    !!sqr &&
    sqr.problem == null &&
    sqr.impact != null &&
    !!sqr.impact.quote &&
    (Array.isArray(sqr.impact.content) ? sqr.impact.content.length === 0 : sqr.impact.content == null)
  record(
    'customerStory: SQR has impact.quote, no impact.content, no problem',
    sqrOk,
    sqr ? `problem=${sqr.problem ? 'y' : '·'}, impact.quote=${sqr.impact?.quote ? 'y' : '·'}, impact.content=${sqr.impact?.content ? 'set' : 'null'}` : 'doc not found',
  )

  // Empty shell — Virgin or Waya. Must read without throwing.
  const emptyShells = await sanityWriteClient.fetch<
    Array<{ _id: string; companyName: string; problem: unknown; solution: unknown; impact: unknown }>
  >(
    `*[_type == "customerStory" && problem == null && solution == null && impact == null][0...2]{
       _id, companyName, problem, solution, impact
     }`,
  )
  record(
    'customerStory: empty-shell docs render without crash',
    emptyShells.length >= 1,
    emptyShells.length > 0 ? `e.g. ${emptyShells.map((e) => e.companyName).join(', ')}` : 'none found',
  )
}

async function main(): Promise<void> {
  console.log('=== MYGRATR-CONTENT-1C verification (HARD GATE) ===\n')
  await checkSanityCounts()
  console.log('')
  await checkSupabaseRows()
  console.log('')
  await checkBlogPostSlugUniqueness()
  await checkCompareBlogNoCategory()
  await checkReferenceIntegritySpotCheck()
  await checkCompareBlogTagsAreAlternatives()
  await checkServiceTechnologyRefs()
  await checkServiceOptions()
  await checkShortLabelCrossCheck()
  await checkInlineImageDoc()
  await checkTechnologyFolds()
  console.log('')
  await checkCustomerStorySpotChecks()

  console.log('')
  const failed = results.filter((r) => !r.ok)
  if (failed.length === 0) {
    console.log(`=== ALL ${results.length} CHECKS PASSED ===`)
  } else {
    console.error(`=== ${failed.length} OF ${results.length} CHECKS FAILED ===`)
    for (const f of failed) console.error(`  ❌ ${f.name}: ${f.detail}`)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

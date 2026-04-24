// Smoke test for MYGRATR-SCHEMA-1 Step 9 Part B.
// Self-contained — does not read from audit-output/. Seeds:
//   1. A dummy blogCategory, tag, teamMember (prerequisites for blog-post ref fields)
//   2. A technology doc with 3 populated folds (exercises the typed fold array)
//   3. A blog post that references teamMember / blogCategory / tag
// Uses createOrReplace with deterministic _ids so the script is safe to
// re-run. On any API rejection the script logs the failure and exits 1.
import { createClient } from '@sanity/client'

import { env, ensureSanity } from '@/lib/env'

interface AnyDoc {
  _id: string
  _type: string
  [key: string]: unknown
}

const TEST_DOCS: Record<string, AnyDoc> = {
  'smoke-test-blog-category-scaling-teams': {
    _id: 'smoke-test-blog-category-scaling-teams',
    _type: 'blogCategory',
    name: 'Scaling Teams (SMOKE TEST)',
    slug: { _type: 'slug', current: 'scaling-teams-smoke-test' },
    order: 99,
  },
  'smoke-test-tag-scaling-teams': {
    _id: 'smoke-test-tag-scaling-teams',
    _type: 'tag',
    name: 'scaling-teams (SMOKE TEST)',
    slug: { _type: 'slug', current: 'scaling-teams-smoke-test-tag' },
    category: 'blogs',
  },
  'smoke-test-team-member': {
    _id: 'smoke-test-team-member',
    _type: 'teamMember',
    name: 'Smoke Test Author',
    slug: { _type: 'slug', current: 'smoke-test-author' },
    position: 'Integration Test',
    hideFromTeamAboutPage: true,
    metaTitle: 'Smoke Test Author',
    metaDescription:
      'Integration-test team member used by the MYGRATR-SCHEMA-1 smoke test suite to validate the teamMember document schema and reference fields.',
    locale: 'default',
    // teamMemberImage is required but we skip uploading assets during
    // smoke tests; Sanity accepts the doc without it at the API layer.
  },
  'smoke-test-technology-with-folds': {
    _id: 'smoke-test-technology-with-folds',
    _type: 'technology',
    technologyName: 'Smoke Test Technology',
    slug: { _type: 'slug', current: 'smoke-test-technology' },
    order: 99,
    shortLabel: 'Integration test',
    listItemOnly: false,
    folds: [
      {
        _type: 'fold',
        _key: 'fold-1',
        type: 'headerIntro',
        label: 'Header + Intro',
        header: 'First fold — heading + paragraph',
        paragraph: [
          {
            _type: 'block',
            _key: 'b1',
            children: [{ _type: 'span', _key: 's1', text: 'Smoke test paragraph content.' }],
            markDefs: [],
            style: 'normal',
          },
        ],
      },
      {
        _type: 'fold',
        _key: 'fold-2',
        type: 'featureBullets',
        label: 'Features',
        header: 'Second fold — bullets',
        bullets: ['Bullet one', 'Bullet two', 'Bullet three'],
      },
      {
        _type: 'fold',
        _key: 'fold-3',
        type: 'itemList',
        label: 'Items',
        header: 'Third fold — items',
        items: [
          { _key: 'i1', header: 'Item A', description: 'Description A' },
          { _key: 'i2', header: 'Item B', description: 'Description B' },
        ],
      },
    ],
    metaTitle: 'Smoke test tech',
    metaDescription:
      'Integration-test technology page used by the MYGRATR-SCHEMA-1 smoke test to validate the typed fold array and the required metadata fields in the technology schema.',
    source: 'manual',
    needsReview: false,
    locale: 'default',
  },
  'smoke-test-blog-post': {
    _id: 'smoke-test-blog-post',
    _type: 'blogPost',
    title: 'Smoke Test Blog Post',
    slug: { _type: 'slug', current: 'smoke-test-blog-post' },
    category: { _type: 'reference', _ref: 'smoke-test-blog-category-scaling-teams' },
    tags: [{ _type: 'reference', _key: 'tag-1', _ref: 'smoke-test-tag-scaling-teams' }],
    author: { _type: 'reference', _ref: 'smoke-test-team-member' },
    date: '2026-04-24',
    content: [
      {
        _type: 'block',
        _key: 'b1',
        children: [{ _type: 'span', _key: 's1', text: 'Body content for the smoke-test blog post.' }],
        markDefs: [],
        style: 'normal',
      },
    ],
    featured: false,
    metaTitle: 'Smoke test blog post',
    metaDescription:
      'Integration-test blog post used by the MYGRATR-SCHEMA-1 smoke test to validate the blogPost schema, reference fields (category, tags, author), and portable text content.',
    source: 'manual',
    needsReview: false,
    locale: 'default',
  },
}

// Order matters — prerequisites first so references resolve.
const SEED_ORDER = [
  'smoke-test-blog-category-scaling-teams',
  'smoke-test-tag-scaling-teams',
  'smoke-test-team-member',
  'smoke-test-technology-with-folds',
  'smoke-test-blog-post',
]

async function main(): Promise<void> {
  ensureSanity()

  const isProduction = env.SANITY_DATASET === 'production'
  const confirmFlag = process.argv.includes('--confirm-production')

  console.log(`Project:  ${env.SANITY_PROJECT_ID}`)
  console.log(`Dataset:  ${env.SANITY_DATASET}${isProduction ? ' (PRODUCTION)' : ''}`)

  if (isProduction && !confirmFlag) {
    console.error(
      '\nRefusing to write smoke-test docs to PRODUCTION dataset without --confirm-production.\n' +
        'Run again with: npm run schema:smoke-test -- --confirm-production\n',
    )
    process.exit(1)
  }

  const client = createClient({
    projectId: env.SANITY_PROJECT_ID,
    dataset: env.SANITY_DATASET,
    token: env.SANITY_API_TOKEN,
    apiVersion: '2024-10-01',
    useCdn: false,
  })

  const failures: Array<{ id: string; error: string }> = []

  for (const id of SEED_ORDER) {
    const doc = TEST_DOCS[id]
    try {
      await client.createOrReplace(doc)
      console.log(`[ok]      ${id} (${doc._type})`)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[FAIL]    ${id} (${doc._type}): ${message}`)
      failures.push({ id, error: message })
    }
  }

  console.log('')
  if (failures.length > 0) {
    console.error(`Smoke test FAILED — ${failures.length} document(s) rejected:`)
    for (const f of failures) console.error(`  - ${f.id}: ${f.error}`)
    process.exit(1)
  }

  console.log('Smoke test PASSED — all documents accepted by the Sanity API.')
  console.log('Inspect the seeded docs in Studio to confirm fold/ref fields render correctly.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

// Final parity check for CONTENT-1B. Reads `content_migrations` for the
// CE migration and asserts each of the 8 collections in this batch has
// migrated_item_count === expected and status === 'complete'.
//
// Exits 0 on full pass; exits 1 with a per-collection summary on any failure.
import { createServerClient } from '@/lib/supabase'

const ORG_ID = 'ce000000-0000-0000-0000-000000000001'
const MIGRATION_ID = 'ce000000-0000-0000-0000-000000000002'

const EXPECTED: Record<string, number> = {
  'team-members': 28,
  reviews: 26,
  videos: 32,
  'book-a-call': 6,
  events: 1,
  tools: 2,
  downloads: 5,
  'downloads-access': 5,
}

async function verify(): Promise<void> {
  const client = createServerClient()
  const { data } = await client
    .from('content_migrations')
    .select(
      'collection_slug, source_item_count, migrated_item_count, parity_score, status',
    )
    .eq('org_id', ORG_ID)
    .eq('migration_id', MIGRATION_ID)
    .throwOnError()

  let allPassed = true

  for (const [slug, expected] of Object.entries(EXPECTED)) {
    const row = data?.find((r) => r.collection_slug === slug)
    if (!row) {
      console.error(`✗ ${slug}: no migration record found`)
      allPassed = false
      continue
    }
    const passed =
      row.migrated_item_count === expected && row.status === 'complete'
    console.log(
      `${passed ? '✓' : '✗'} ${slug}: ${row.migrated_item_count}/${expected} (parity ${row.parity_score}%)`,
    )
    if (!passed) allPassed = false
  }

  if (!allPassed) {
    console.error('\nVerification failed. Fix errors before merging.')
    process.exit(1)
  }

  console.log('\nAll CONTENT-1B collections verified. ✓')
}

verify().catch((err) => {
  console.error(err)
  process.exit(1)
})

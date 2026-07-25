// HARD GATE: do not run this script until Studio production deploy is confirmed.
// See CONTENT-1D brief Step 0a.1.

// Scope with --slug to backfill specific documents instead of re-scraping the
// whole collection. A full re-run was right for CONTENT-1D against a cold
// dataset; it is wrong now, because it would overwrite meta edited in Studio
// since. Retired documents are always excluded (their live pages are gone).
//
//   npx tsx scripts/content/migrate-meta-team-member.ts --slug molly-miller
//   npx tsx scripts/content/migrate-meta-team-member.ts        # whole collection

import { runMetaBackfill, slugsFromArgv, type FieldPolicy } from '@/lib/content/meta-backfill-runner'

const policy: FieldPolicy = { title: 'scrape-always', description: 'scrape-always' }

runMetaBackfill({
  type: 'teamMember',
  policy,
  collectionSlug: 'meta-backfill-team-member',
  onlySlugs: slugsFromArgv(),
}).catch((err) => {
  console.error(err)
  process.exit(1)
})

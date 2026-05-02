// HARD GATE: do not run this script until Studio production deploy is confirmed.
// See CONTENT-1D brief Step 0a.1.

import { runMetaBackfill, type FieldPolicy } from '@/lib/content/meta-backfill-runner'

const policy: FieldPolicy = { title: 'scrape-always', description: 'scrape-always' }

runMetaBackfill({
  type: 'teamMember',
  policy,
  collectionSlug: 'meta-backfill-team-member',
}).catch((err) => {
  console.error(err)
  process.exit(1)
})

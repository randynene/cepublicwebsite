// HARD GATE: do not run this script until Studio production deploy is confirmed.
// See CONTENT-1D brief Step 0a.1.

import { runMetaBackfill, type FieldPolicy } from '@/lib/content/meta-backfill-runner'

// IMMUTABLE: bookACall.metaDescription was populated in CONTENT-1B from
// the Webflow `title` field (mislabelled in Webflow but contains
// description copy — §3.14 / D9). The runner is structurally forbidden
// from touching it: never-touch means no scrape, no normalisation, no
// validation against the description field. metaTitle is still scraped
// fresh.
//
// See CONTENT-1B PHASE_HISTORY entry. Do not change without explicit revision.
const policy: FieldPolicy = { title: 'scrape-always', description: 'never-touch' }

runMetaBackfill({
  type: 'bookACall',
  policy,
  collectionSlug: 'meta-backfill-book-a-call',
}).catch((err) => {
  console.error(err)
  process.exit(1)
})

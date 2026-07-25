// HARD GATE: do not run this script until Studio production deploy is confirmed.
// See CONTENT-1D brief Step 0a.1.

// Scope with --slug to backfill specific documents instead of re-scraping the
// whole collection. A full re-run was right for CONTENT-1D against a cold
// dataset; it is wrong now, because it would overwrite meta edited in Studio
// since. Retired documents are always excluded (their live pages are gone).
//
//   npx tsx scripts/content/migrate-meta-book-a-call.ts --slug molly
//   npx tsx scripts/content/migrate-meta-book-a-call.ts          # whole collection

import { runMetaBackfill, slugsFromArgv, type FieldPolicy } from '@/lib/content/meta-backfill-runner'

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
  onlySlugs: slugsFromArgv(),
}).catch((err) => {
  console.error(err)
  process.exit(1)
})

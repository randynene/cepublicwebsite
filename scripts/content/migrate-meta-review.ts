// HARD GATE: do not run this script until Studio production deploy is confirmed.
// See CONTENT-1D brief Step 0a.1.

import { runMetaBackfill, type FieldPolicy } from '@/lib/content/meta-backfill-runner'

// review.metaDescription policy: snippet-copy-else-scrape (F8).
// For each doc: if metaDescription is null AND snippetForMeta is non-null,
// copy truncateAtWord(snippetForMeta, 160) → metaDescription with provider
// 'snippetForMeta-copy'. Else if metaDescription already populated, skip.
// Else (both null), scrape. Truncation routes through truncateAtWord
// with a post-truncation length assertion.
const policy: FieldPolicy = {
  title: 'scrape-always',
  description: 'snippet-copy-else-scrape',
}

runMetaBackfill({
  type: 'review',
  policy,
  collectionSlug: 'meta-backfill-review',
}).catch((err) => {
  console.error(err)
  process.exit(1)
})

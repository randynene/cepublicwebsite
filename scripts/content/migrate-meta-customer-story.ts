// HARD GATE: do not run this script until Studio production deploy is confirmed.
// See CONTENT-1D brief Step 0a.1.

import {
  runMetaBackfill,
  type FieldPolicy,
  type PreScrapeDecision,
  type SanityDocLite,
} from '@/lib/content/meta-backfill-runner'

const policy: FieldPolicy = { title: 'scrape-always', description: 'scrape-always' }

// F7 — short-circuit /customer-story/virgin BEFORE URL construction.
// The page on cloudemployee.io is a known placeholder ("Customer story
// in progress…"); we hardcode the meta and flag for review rather
// than scrape the placeholder copy.
function preScrapeCustomerStory(doc: SanityDocLite): PreScrapeDecision {
  if (doc.slug?.current === 'virgin') {
    return {
      kind: 'bypass',
      patch: {
        metaTitle: 'Customer story in progress',
        metaDescription: 'Customer story in progress.',
        needsReview: true,
        metaTitleSource: { provider: 'placeholder' },
        metaDescriptionSource: { provider: 'placeholder' },
      },
    }
  }
  return { kind: 'continue' }
}

runMetaBackfill({
  type: 'customerStory',
  policy,
  collectionSlug: 'meta-backfill-customer-story',
  preScrapeHook: preScrapeCustomerStory,
}).catch((err) => {
  console.error(err)
  process.exit(1)
})

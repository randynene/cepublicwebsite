// MYGRATR-STATIC-1 Step 1 follow-up — patch authored-hub metaDescriptions
// to clear the 140-160 char Studio publish-warning floor.
//
// Affects 2 hubs only: videosHub + staffAugmentationHub. Patch (not
// createOrReplace) so other fields seeded in Step 1 stay intact.
//
// Run once. Idempotent (re-running rewrites the same text).

import 'dotenv/config'

import { sanityWriteClient } from '@/lib/content/sanity-write-client'

const VIDEOS_META_DESC =
  'Watch customer interviews, hiring process walkthroughs, and short explainers on offshoring, retention, and embedded engineering from Cloud Employee.'

const STAFF_META_DESC =
  'Practical guides on hiring offshore developers, embedding them into your team, and managing retention, from people who run these engagements daily.'

function assertInBound(label: string, s: string) {
  if (s.length < 140 || s.length > 160) {
    throw new Error(`${label} length ${s.length} outside [140, 160] bound`)
  }
}

async function main() {
  assertInBound('videosHub.metaDescription', VIDEOS_META_DESC)
  assertInBound('staffAugmentationHub.metaDescription', STAFF_META_DESC)

  await sanityWriteClient.patch('videosHub').set({ metaDescription: VIDEOS_META_DESC }).commit()
  await sanityWriteClient
    .patch('staffAugmentationHub')
    .set({ metaDescription: STAFF_META_DESC })
    .commit()

  console.log(`videosHub.metaDescription: ${VIDEOS_META_DESC.length} chars`)
  console.log(`staffAugmentationHub.metaDescription: ${STAFF_META_DESC.length} chars`)
}

main().catch((err) => {
  console.error('patch-hub-metadescriptions: FAILED', err)
  process.exit(1)
})

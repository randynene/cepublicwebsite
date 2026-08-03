import 'dotenv/config'

import { sanityWriteClient } from '@/lib/content/sanity-write-client'

import { FOR_ENGINEERS_CONTENT as FE } from '../../site/src/components/templates/for-engineers/content'

// Point the /for-developers testimonial tile at CE's Boracay Cloudfest film.
//
// Why a patch and not the seed script: seed-for-developers-page.ts runs
// createOrReplace on the whole singleton, which would drop anything Seb has
// edited in Studio since the last seed. This touches three fields.
//
// SCOPE: one document by id ("forDevelopersPage"), three named fields under
// `tests`. Values come from the committed content module, so this and the code
// fallback can never disagree. Idempotent - re-running writes the same values.
//
// OVERWRITES any Studio edit to tests.videoUrl / videoPill / videoLabel. The
// pill and label were the Figma export's "Snr. Front-End Engineer - Dani"
// placeholders, which describe a testimonial the video is not.
//
// Run: npx tsx scripts/static/patch-for-developers-video.ts
// Token: SANITY_MIGRATION_WRITE_TOKEN

async function main() {
  const fields = {
    'tests.videoUrl': FE.tests.videoUrl,
    'tests.videoPill': FE.tests.videoPill,
    'tests.videoLabel': FE.tests.videoLabel,
  }

  await sanityWriteClient.patch('forDevelopersPage').set(fields).commit()

  const after = await sanityWriteClient.fetch(
    '*[_id=="forDevelopersPage"][0].tests{videoUrl,videoPill,videoLabel}',
  )
  console.log('forDevelopersPage.tests <-', JSON.stringify(after, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

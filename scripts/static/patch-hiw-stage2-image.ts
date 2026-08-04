import 'dotenv/config'

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { sanityWriteClient } from '@/lib/content/sanity-write-client'

// CE-36 (dup: CE-26): replace the How It Works Stage 2 image.
//
// Stage 2 was showing a square 1024x1024 mock of a "Live Coding Interview"
// labelled David Barnes / Alex Morgan. Seb asked for the real footage.
//
// This is a Sanity fix, not a code fix. /how-it-works serves every image from
// the Sanity CDN, and how-it-works/content.ts ALREADY points at the correct
// asset (/design/home/media/coding-interview-v2.jpg, the same still the
// homepage uses) - the document value was simply overriding it.
//
// Idempotent: re-running once the correct asset is referenced reports no change.
//
// Run:   npm run static:patch-hiw-stage2-image -- --apply
// Token: SANITY_MIGRATION_WRITE_TOKEN

const ASSET_PATH = 'site/public/design/home/media/coding-interview-v2.jpg'
const STAGE = 'Stage 2'
const ALT =
  'Cloud Employee engineers running a live pair-programming interview on the candidate stack'

type Item = { _key?: string; stage?: string; image?: { asset?: { _ref?: string } } }

async function main() {
  const apply = process.argv.includes('--apply')

  const items = await sanityWriteClient.fetch<Item[] | null>(
    `*[_id == "howItWorksPage"][0].stages.items[]{ _key, stage, image }`,
  )
  if (!items?.length) throw new Error('howItWorksPage.stages.items not found.')

  const index = items.findIndex((i) => i.stage === STAGE)
  if (index === -1) throw new Error(`${STAGE} not found in stages.items.`)

  const current = items[index].image?.asset?._ref ?? '(none)'
  console.log(`howItWorksPage.stages.items[${index}] (${STAGE})`)
  console.log(`  current asset: ${current}`)
  console.log(`  replace with:  ${ASSET_PATH}`)

  if (!apply) {
    console.log('\nDry run complete. Re-run with -- --apply to write.')
    return
  }

  const file = readFileSync(resolve(process.cwd(), ASSET_PATH))
  const asset = await sanityWriteClient.assets.upload('image', file, {
    filename: 'how-it-works-stage-2-pair-programming.jpg',
    contentType: 'image/jpeg',
  })
  console.log(`  uploaded asset ${asset._id}`)

  if (asset._id === current) {
    console.log('  already referencing this asset - nothing to do.')
    return
  }

  await sanityWriteClient
    .patch('howItWorksPage')
    .set({
      [`stages.items[${index}].image`]: {
        _type: 'image',
        alt: ALT,
        asset: { _type: 'reference', _ref: asset._id },
      },
    })
    .commit()

  console.log('  committed.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

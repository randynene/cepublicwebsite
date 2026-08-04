import 'dotenv/config'

import { sanityWriteClient } from '@/lib/content/sanity-write-client'

// Fill the two empty image wells found by the site-wide audit (Aug 2026).
//
// Both templates render a styled container unconditionally and the <img> inside
// it conditionally, so an unset field ships as a blank navy box rather than as
// nothing. Jake spotted the fractional-CTO one; the audit found the other.
//
//   fractionalCtoPage.matched.feature.image  - "Tell us what you need." card
//   aboutUsPage.founderImage                 - "Our story" panel
//
// Both are real imageFields in the Studio schema, so these are content, not
// code: Seb can swap either in Studio afterwards. The assets chosen are already
// in the CE media library (571 images) - nothing new was uploaded.
//
// The templates were ALSO hardened in the same pass so an unset field renders
// nothing instead of an empty well. This script fills the slots; the code change
// makes the failure mode safe if anyone ever clears them again.
//
// Idempotent: re-running once both are set reports no change.
//
// Run:   npm run static:patch-fill-image-slots -- --apply
// Token: SANITY_MIGRATION_WRITE_TOKEN

type Slot = {
  docId: string
  path: string
  /** Existing asset in the CE media library. */
  assetId: string
  why: string
}

const SLOTS: Slot[] = [
  {
    docId: 'fractionalCtoPage',
    path: 'matched.feature.image',
    // "Office Zoom Client-1308" - an account manager on a client video call,
    // which is literally what the card describes.
    assetId: 'image-deeea4ab9725ba6a23f08f3b2428d3aee6332a80-5184x3456-heif',
    why: 'Office Zoom Client-1308 (client video call)',
  },
  {
    docId: 'aboutUsPage',
    path: 'founderImage',
    // "Office Meeting-1252" - two CE colleagues working together. The panel sits
    // beside the founding story, so a real team photo beats a stock founder shot.
    assetId: 'image-38dbf30aa600c49cb5330a5e6dda89660b46baf2-5184x3456-heif',
    why: 'Office Meeting-1252 (CE team)',
  },
]

async function main() {
  const apply = process.argv.includes('--apply')

  for (const slot of SLOTS) {
    const current = await sanityWriteClient.fetch<string | null>(
      `*[_id == $id][0].${slot.path}.asset._ref`,
      { id: slot.docId },
    )

    console.log(`\n${slot.docId}.${slot.path}`)
    if (current === slot.assetId) {
      console.log('  already set to this asset - nothing to do.')
      continue
    }
    console.log(`  current: ${current ?? '(empty - renders a blank box)'}`)
    console.log(`  set to:  ${slot.why}`)

    if (!apply) {
      console.log('  (dry run - pass --apply to commit)')
      continue
    }

    await sanityWriteClient
      .patch(slot.docId)
      .set({
        [slot.path]: {
          _type: 'image',
          asset: { _type: 'reference', _ref: slot.assetId },
        },
      })
      .commit()
    console.log('  committed.')
  }

  if (!apply) console.log('\nDry run complete. Re-run with -- --apply to write.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

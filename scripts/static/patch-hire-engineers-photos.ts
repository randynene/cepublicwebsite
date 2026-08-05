import 'dotenv/config'

import { existsSync, readFileSync } from 'node:fs'

import { sanityWriteClient } from '@/lib/content/sanity-write-client'

// Fill the three "Image suggestion" slots on /services/software-engineers.
//
// Jake spotted these on the live PROOF band: tiles reading "IMAGE SUGGESTION"
// with a brief inside them ("A client meeting their team in person...") plus a
// footnote telling the reader they are placeholders. They shipped to production.
//
// Why the earlier empty-slot audit missed them: it looked for containers with NO
// text, and these are full of text - the brief IS the placeholder. Any future
// audit needs to look for the marker copy as well as for empty boxes.
//
// The template already suppresses the tag + caption as soon as `image` is set
// (same pattern as offer.img, which shipped a real photo months ago), so filling
// the slot is all that is needed. All three are `imageSlot()` fields in the
// Studio schema, so Seb can swap any of them later.
//
// Idempotent: re-running once all three are set reports no change.
//
// Run:   npm run static:patch-hire-engineers-photos -- --apply
// Token: SANITY_MIGRATION_WRITE_TOKEN

const DOC_ID = 'hireEngineersPage'

/** Jake's pick for the client-visit slot, uploaded from his media folder. */
const VISIT_UPLOAD = {
  path: '/Users/jakehall/Desktop/Website images/additional website images/Events Connection Visit 2025-78.jpg',
  filename: 'events-connection-visit-2025-78.jpg',
}

type Slot = {
  path: string
  /** Existing library asset, or null when the asset is uploaded by this script. */
  assetId: string | null
  why: string
}

const SLOTS: Slot[] = [
  {
    path: 'proof.sideImg.image',
    // "Team Building 2022" - the whole company behind the CloudEmployee banner.
    // The caption asks for "the team behind the engineer ... proves the
    // retention claim", and a 100-person group shot argues that better than a
    // posed HR portrait would.
    assetId: 'image-9c19e75b89379f376386b9bb24cbba7eeb163515-1947x1125-png',
    why: 'Team Building 2022 (whole-company group shot)',
  },
  {
    path: 'proof.visitImg.image',
    assetId: null, // uploaded from VISIT_UPLOAD
    why: "Events Connection Visit 2025-78 (Jake's pick: client round a table with their team)",
  },
  {
    // `find`, NOT `matchform`. matchform is the fractional-CTO page's section
    // name; on hireEngineersPage the form-side photo lives under `find`, which
    // is what the schema defines and the GROQ projects. Writing the wrong path
    // does not error - Sanity happily creates an undeclared field that no query
    // reads - so the first run of this script silently made a dead
    // `matchform` object. cleanupStrayMatchform() below removes it.
    path: 'find.img.image',
    // "Workstation Photos" - an engineer at her desk, code on screen, mid-call.
    // The caption asks for "a candid working shot ... not a headshot".
    assetId: 'image-8a54beaf552febc82c8589e8e473a64baa1a5501-4592x2584-heif',
    why: 'Workstation Photos (candid engineer at desk)',
  },
]

/** Remove the undeclared `matchform` object written by this script's first run. */
async function cleanupStrayMatchform(apply: boolean) {
  const stray = await sanityWriteClient.fetch<unknown>(
    `*[_id == $id][0].matchform`,
    { id: DOC_ID },
  )
  if (!stray) return
  console.log(`\n${DOC_ID}.matchform`)
  console.log('  stray field not in the schema (wrong path on an earlier run) - unsetting')
  if (apply) {
    await sanityWriteClient.patch(DOC_ID).unset(['matchform']).commit()
    console.log('  committed.')
  }
}

/** The placeholder footnote under the proof band. */
const NOTE_PATH = 'proof.note'

async function main() {
  const apply = process.argv.includes('--apply')

  for (const slot of SLOTS) {
    const current = await sanityWriteClient.fetch<string | null>(
      `*[_id == $id][0].${slot.path.replace(/\.image$/, '')}.image.asset._ref`,
      { id: DOC_ID },
    )

    console.log(`\n${DOC_ID}.${slot.path}`)
    if (current) {
      console.log(`  already set (${current}) - skipping.`)
      continue
    }
    console.log('  current: (empty - renders an "Image suggestion" tile)')
    console.log(`  set to:  ${slot.why}`)

    if (!apply) {
      console.log('  (dry run - pass --apply to commit)')
      continue
    }

    let assetId = slot.assetId
    if (!assetId) {
      if (!existsSync(VISIT_UPLOAD.path)) {
        throw new Error(
          `Source image not found: ${VISIT_UPLOAD.path}\n` +
            'macOS blocks directory listing on Desktop, so the exact path matters.',
        )
      }
      const asset = await sanityWriteClient.assets.upload(
        'image',
        readFileSync(VISIT_UPLOAD.path),
        { filename: VISIT_UPLOAD.filename, contentType: 'image/jpeg' },
      )
      assetId = asset._id
      console.log(`  uploaded ${asset._id}`)
    }

    await sanityWriteClient
      .patch(DOC_ID)
      .set({
        [slot.path]: { _type: 'image', asset: { _type: 'reference', _ref: assetId } },
      })
      .commit()
    console.log('  committed.')
  }

  // Drop the "these are placeholders, swap before publish" footnote.
  const note = await sanityWriteClient.fetch<string | null>(
    `*[_id == $id][0].${NOTE_PATH}`,
    { id: DOC_ID },
  )
  console.log(`\n${DOC_ID}.${NOTE_PATH}`)
  if (!note) {
    console.log('  already empty.')
  } else {
    console.log(`  unset: "${note.slice(0, 80)}..."`)
    if (apply) {
      await sanityWriteClient.patch(DOC_ID).unset([NOTE_PATH]).commit()
      console.log('  committed.')
    }
  }

  await cleanupStrayMatchform(apply)

  if (!apply) console.log('\nDry run complete. Re-run with -- --apply to write.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

import 'dotenv/config'

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { sanityWriteClient } from '@/lib/content/sanity-write-client'

// CE-38: give the LATAM and Philippines hero cards the landscape `-slide` crops.
//
// Seb reported Mateo R.'s face being cut off on LATAM and asked for the rotating
// card used on the homepage and Eastern Europe. Switching `hero.visual` to
// 'slideshow' in code is only half the fix: the transform in
// lib/sanity/queries/location-page.ts PREFERS Sanity's hero.cards when present,
// and all three docs carry three cards.
//
// Eastern Europe already looks right precisely because its Sanity cards point at
// ivana-m-slide / petra-k-slide / marcelo-p-slide. LATAM and Philippines still
// point at the portrait stack crops (mateo-r.jpg etc), which are framed for the
// old overlapping stack and are what clip faces in the 488x280 slideshow photo
// area. This brings those two docs in line with Eastern Europe.
//
// Scope note: this only re-points the images of the cards already in each doc.
// It deliberately does not add or remove people - Grace O. is now region 'latam'
// in the code roster, so the code list would produce four LATAM cards, but
// changing who appears on a location hero is a content decision nobody asked
// for. Live stays at the existing three per page.
//
// Idempotent: re-running once every card points at a `-slide` asset is a no-op.
//
// Run:   npm run static:patch-location-hero-slides -- --apply
// Token: SANITY_MIGRATION_WRITE_TOKEN

const PHOTO_DIR = 'site/public/design/talent'

const TARGET_IDS = ['locationPage-latam-developers', 'locationPage-philippines-developers']

/** Card name -> roster slug, for the two docs this script touches. */
const SLUG_BY_NAME: Record<string, string> = {
  'Mateo R.': 'mateo-r',
  'Rafael S.': 'rafael-s',
  'Gabriel K.': 'gabriel-k',
  'Russel D.': 'russel-d',
  'Stephen L.': 'stephen-l',
  'Kyla T.': 'kyla-t',
}

type Card = {
  _key?: string
  name?: string
  image?: { _type?: string; alt?: string; asset?: { _ref?: string } }
}

type Doc = { _id: string; cards?: Card[] }

/** Upload once per slug, even if two docs share a face. */
const uploaded = new Map<string, string>()

async function assetIdFor(slug: string): Promise<string> {
  const cached = uploaded.get(slug)
  if (cached) return cached
  const file = readFileSync(resolve(process.cwd(), `${PHOTO_DIR}/${slug}-slide.jpg`))
  const asset = await sanityWriteClient.assets.upload('image', file, {
    filename: `${slug}-slide.jpg`,
    contentType: 'image/jpeg',
  })
  uploaded.set(slug, asset._id)
  return asset._id
}

async function main() {
  const apply = process.argv.includes('--apply')

  const docs = await sanityWriteClient.fetch<Doc[]>(
    `*[_id in $ids]{ _id, "cards": hero.cards[]{ _key, name, image } } | order(_id asc)`,
    { ids: TARGET_IDS },
  )
  if (docs.length === 0) throw new Error('No target locationPage documents found.')

  for (const doc of docs) {
    console.log(`\n${doc._id}`)
    const cards = doc.cards ?? []
    if (cards.length === 0) {
      console.log('  no hero.cards - nothing to do.')
      continue
    }

    const plan: { index: number; name: string; slug: string }[] = []
    for (const [index, card] of cards.entries()) {
      const name = (card.name ?? '').trim()
      const slug = SLUG_BY_NAME[name]
      if (!slug) {
        console.log(`  ! ${name || '(unnamed)'} - no slug mapping, SKIPPED`)
        continue
      }
      plan.push({ index, name, slug })
      console.log(`  - ${name}: -> ${slug}-slide.jpg`)
    }

    if (plan.length === 0 || !apply) {
      if (!apply) console.log('  (dry run - pass --apply to commit)')
      continue
    }

    const patch = sanityWriteClient.patch(doc._id)
    for (const item of plan) {
      const assetId = await assetIdFor(item.slug)
      patch.set({
        [`hero.cards[${item.index}].image`]: {
          _type: 'image',
          alt: item.name,
          asset: { _type: 'reference', _ref: assetId },
        },
      })
    }
    await patch.commit()
    console.log('  committed.')
  }

  if (!apply) console.log('\nDry run complete. Re-run with -- --apply to write.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

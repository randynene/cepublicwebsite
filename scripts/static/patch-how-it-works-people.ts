import 'dotenv/config'

import * as fs from 'node:fs/promises'
import * as path from 'node:path'

import { sanityWriteClient } from '@/lib/content/sanity-write-client'

import { HIW_CONTENT } from '../../site/src/components/templates/how-it-works/content'

// Put the two hero engineer cards on How It Works onto real roster people.
//
// Sanity WINS over the code fallback for this field, so editing content.ts
// alone changes nothing on staging: the document still holds the export's
// invented "Ana M." and "Reinaldo A." with their stock photos.
//
// SCOPE: one document (howItWorksPage), one field (hero.people). Everything
// else on the document is untouched (patch/set, not createOrReplace). It does
// overwrite anything Seb may have edited on those two cards in Studio.
//
// Idempotent: Sanity content-hashes uploaded assets so a re-upload returns the
// same ref, and the array _keys are derived from the photo filename.
//
// Run: npx tsx scripts/static/patch-how-it-works-people.ts
// Token: SANITY_MIGRATION_WRITE_TOKEN

const PUBLIC_ROOT = path.resolve(process.cwd(), 'site', 'public')

async function imageRef(publicPath: string, alt: string) {
  const buf = await fs.readFile(path.join(PUBLIC_ROOT, publicPath.replace(/^\//, '')))
  const asset = await sanityWriteClient.assets.upload('image', buf, {
    filename: path.basename(publicPath),
    contentType: 'image/jpeg',
  })
  return { _type: 'image' as const, asset: { _type: 'reference' as const, _ref: asset._id }, alt }
}

async function main() {
  const people = await Promise.all(
    HIW_CONTENT.hero.people.map(async (p) => ({
      _key: `hero-${path.basename(p.image).replace(/\.[a-z]+$/i, '')}`,
      _type: 'heroPerson',
      name: p.name,
      role: p.role,
      flag: p.flag,
      tags: [...p.tags],
      image: await imageRef(p.image, p.imageAlt),
      rotate: p.rotate,
    })),
  )

  await sanityWriteClient.patch('howItWorksPage').set({ 'hero.people': people }).commit()

  const after = await sanityWriteClient.fetch(
    '*[_id=="howItWorksPage"][0].hero.people[]{name, role, flag, tags, "photo": image.asset->originalFilename}',
  )
  console.log('howItWorksPage.hero.people <-', JSON.stringify(after, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

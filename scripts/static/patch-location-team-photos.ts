import 'dotenv/config'

import * as fs from 'node:fs/promises'
import * as path from 'node:path'

import { sanityWriteClient } from '@/lib/content/sanity-write-client'

// Narrow patch: upload the two "on the ground" team photos and set
// locationPage-*.onGround.image. One named field per named document.
//
// Run: npx tsx scripts/static/patch-location-team-photos.ts

const PUBLIC_ROOT = path.resolve(process.cwd(), 'site', 'public')

const PATCHES = [
  {
    id: 'locationPage-eastern-europe-developers',
    publicPath: '/location/eastern-europe/team.jpg',
    alt: 'Cloud Employee team on the ground in Eastern Europe',
  },
  {
    id: 'locationPage-latam-developers',
    publicPath: '/location/latam/team.jpg',
    alt: 'Cloud Employee team collaborating in Latin America',
  },
]

async function main() {
  for (const p of PATCHES) {
    const localPath = path.join(PUBLIC_ROOT, p.publicPath.replace(/^\//, ''))
    const buf = await fs.readFile(localPath)
    const asset = await sanityWriteClient.assets.upload('image', buf, {
      filename: path.basename(localPath),
      contentType: 'image/jpeg',
    })
    await sanityWriteClient
      .patch(p.id)
      .set({
        'onGround.image': {
          _type: 'image',
          asset: { _type: 'reference', _ref: asset._id },
          alt: p.alt,
        },
      })
      .commit()
    console.log(`${p.id}.onGround.image <- ${p.publicPath} (${asset._id})`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

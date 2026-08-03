import 'dotenv/config'

import * as fs from 'node:fs/promises'
import * as path from 'node:path'

import { sanityWriteClient } from '@/lib/content/sanity-write-client'

import { HOME_CONTENT as HC } from '../../site/src/components/templates/home/content'

// Narrow patch: homePage.whereWeWork.hubs only.
//
// Swaps the five Picsum placeholder URLs for the real CE office photos in
// site/public/design/home/hubs/. Name + href come straight from HOME_CONTENT,
// so a re-run is idempotent (Sanity content-hashes assets, so re-uploading the
// same file returns the same ref). Nothing else on the document is touched.
//
// Run: npx tsx scripts/static/patch-home-hub-photos.ts

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
  const hubs = await Promise.all(
    HC.whereWeWork.hubs.map(async (h, i) => ({
      _key: `hub-${i}`,
      name: h.name,
      href: h.href,
      image: await imageRef(h.image, `The Cloud Employee team at work in ${h.name}`),
    })),
  )

  await sanityWriteClient.patch('homePage').set({ 'whereWeWork.hubs': hubs }).commit()

  const after = await sanityWriteClient.fetch(
    '*[_id=="homePage"][0].whereWeWork.hubs[]{name, href, imageUrl, "photo": image.asset->originalFilename}',
  )
  console.log('homePage.whereWeWork.hubs <-', JSON.stringify(after, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

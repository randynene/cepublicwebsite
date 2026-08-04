import 'dotenv/config'

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { sanityWriteClient } from '@/lib/content/sanity-write-client'

// CE-32: add the Vector logo to the trusted-by strip.
//
// The logo list on homePage is Sanity-owned (uploaded image assets, not paths),
// so adding Vector to CLIENT_LOGOS in code is not enough on its own - the code
// list is only the fallback. This uploads the SVG Seb attached to the issue and
// appends a logo entry.
//
// The SVG is black artwork on transparency, which is what the strip's default
// 'lineart' treatment expects (it flattens to white via brightness(0) invert(1)).
//
// Idempotent: re-running finds the existing Vector entry and stops.
//
// Run:   npm run static:patch-add-vector-logo -- --apply
// Token: SANITY_MIGRATION_WRITE_TOKEN

// PNG rather than the source SVG: every other mark in the strip is a PNG, and
// next/image will not run SVG through the optimiser without dangerouslyAllowSVG.
const ASSET_PATH = 'site/public/design/home/logos/vector.png'
const LOGO_NAME = 'Vector'

/** Wide wordmark (4.6:1), so it sits lower than the squarer marks beside it. */
const DISPLAY_HEIGHT = 26

type Logo = { _key?: string; name?: string }

async function main() {
  const apply = process.argv.includes('--apply')

  const doc = await sanityWriteClient.fetch<{ logos?: Logo[] } | null>(
    `*[_id == "homePage"][0]{ "logos": trustedBy.logos }`,
  )
  if (!doc) throw new Error('homePage document not found.')

  const logos = doc.logos ?? []
  const already = logos.some((l) => (l.name ?? '').trim().toLowerCase() === LOGO_NAME.toLowerCase())

  console.log(`homePage.trustedBy.logos: ${logos.length} present (${logos.map((l) => l.name).join(', ')})`)

  if (already) {
    console.log(`${LOGO_NAME} already present - nothing to do.`)
    return
  }

  console.log(`  - append ${LOGO_NAME} (displayHeight ${DISPLAY_HEIGHT}) from ${ASSET_PATH}`)

  if (!apply) {
    console.log('\nDry run complete. Re-run with -- --apply to write.')
    return
  }

  const file = readFileSync(resolve(process.cwd(), ASSET_PATH))
  const asset = await sanityWriteClient.assets.upload('image', file, {
    filename: 'vector-logo.png',
    contentType: 'image/png',
  })
  console.log(`  uploaded asset ${asset._id}`)

  await sanityWriteClient
    .patch('homePage')
    .append('trustedBy.logos', [
      {
        _key: `logo-${logos.length}`,
        _type: 'logo',
        name: LOGO_NAME,
        displayHeight: DISPLAY_HEIGHT,
        image: {
          _type: 'image',
          alt: LOGO_NAME,
          asset: { _type: 'reference', _ref: asset._id },
        },
      },
    ])
    .commit()

  console.log('  committed.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

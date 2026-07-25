/**
 * TEMPLATE-TOOL — patch Culture Match walkthrough Loom into `videoOverview`.
 *
 * Webflow migration only preserved the "See how it works:" heading; the Loom
 * embed was lost. Jake runs this once after review.
 *
 * Usage (repo root, SANITY_MIGRATION_WRITE_TOKEN in .env):
 *   npx tsx scripts/content/patch-culture-match-loom.ts
 */

import 'dotenv/config'

import { createClient } from '@sanity/client'

const LOOM_SHARE_URL =
  'https://www.loom.com/share/5960e2de96bc47ff9e83d72b9f318a30'

const projectId =
  process.env.SANITY_PROJECT_ID ??
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ??
  'lzbhll1u'
const dataset =
  process.env.SANITY_DATASET ??
  process.env.NEXT_PUBLIC_SANITY_DATASET ??
  'production'
const token = process.env.SANITY_MIGRATION_WRITE_TOKEN

if (!token) {
  console.error(
    'Missing SANITY_MIGRATION_WRITE_TOKEN in .env (repo root).',
  )
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2024-01-01',
  useCdn: false,
})

const VIDEO_OVERVIEW = [
  {
    _key: 'video-overview-heading',
    _type: 'block',
    style: 'h3',
    markDefs: [],
    children: [
      {
        _key: 'video-overview-heading-span',
        _type: 'span',
        marks: [],
        text: 'See how it works:',
      },
    ],
  },
  {
    _key: 'culture-match-walkthrough-loom',
    _type: 'videoEmbed',
    url: LOOM_SHARE_URL,
    caption: 'Culture Match walkthrough',
  },
]

async function main() {
  const doc = await client.fetch<{ _id: string; name: string } | null>(
    `*[_type == "tool" && slug.current == "culture-match" && locale == "default"][0]{ _id, name }`,
  )

  if (!doc?._id) {
    console.error('No default-locale tool doc found for slug culture-match.')
    process.exit(1)
  }

  console.log(`Patching ${doc._id} (${doc.name}) videoOverview with Loom embed...`)
  await client.patch(doc._id).set({ videoOverview: VIDEO_OVERVIEW }).commit()
  console.log('Done.', LOOM_SHARE_URL)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

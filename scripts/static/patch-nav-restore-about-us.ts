/**
 * WP-04 — restore "About Us" on the primary nav if NAV-SIMPLE dropped it.
 *
 * Idempotent: no-op when a primary link already points at /about-us.
 *
 * Usage: npx tsx scripts/static/patch-nav-restore-about-us.ts
 * Token: SANITY_MIGRATION_WRITE_TOKEN
 */

import 'dotenv/config'

import { createClient } from '@sanity/client'

const projectId =
  process.env.SANITY_PROJECT_ID ??
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ??
  'lzbhll1u'
const dataset =
  process.env.SANITY_DATASET ?? process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'
const token = process.env.SANITY_MIGRATION_WRITE_TOKEN

if (!token) {
  console.error('Missing SANITY_MIGRATION_WRITE_TOKEN in .env (repo root).')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2024-01-01',
  useCdn: false,
})

const CE_HOST = 'https://www.cloudemployee.io'
const ABOUT_URL = `${CE_HOST}/about-us`

type PrimaryLink = {
  _key?: string
  label?: string
  url?: string
  dropdownType?: string
  cmsDriven?: boolean
  dropdownItems?: unknown[]
  _type?: string
}

async function main() {
  const nav = await client.fetch<{ primaryLinks?: PrimaryLink[] } | null>(
    `*[_id == "navigation"][0]{ primaryLinks }`,
  )
  const links = nav?.primaryLinks ?? []
  const hasAbout = links.some(
    (l) =>
      (typeof l.url === 'string' && l.url.includes('/about-us')) ||
      (typeof l.label === 'string' && l.label.toLowerCase() === 'about us'),
  )
  if (hasAbout) {
    console.log('About Us already in navigation.primaryLinks — no change.')
    return
  }

  const next = [
    ...links,
    {
      _key: 'pl-about-us',
      _type: 'primaryLink',
      label: 'About Us',
      url: ABOUT_URL,
      dropdownType: 'none',
      cmsDriven: false,
      dropdownItems: [],
    },
  ]

  await client.patch('navigation').set({ primaryLinks: next }).commit()
  console.log(`Appended About Us to primaryLinks (now ${next.length} links).`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

/**
 * MYGRATR-STATIC-3 — patch `navigation.announcementBar` only (additive).
 *
 * Jake runs this after Studio deploy. Does NOT re-run the full STATIC-2 reseed.
 *
 * Usage (from repo root, with SANITY_MIGRATION_WRITE_TOKEN in .env):
 *   npx tsx scripts/static/patch-announcement-bar.ts
 */

import 'dotenv/config'

import { createClient } from '@sanity/client'

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
    'Missing SANITY_MIGRATION_WRITE_TOKEN in .env (repo root). Same token used by seed-globals-v2.',
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

// Header.html frame 01 copy. linkUrl → /pricing (price calculator merged per PRICING_SCHEMA_PROPOSAL).
// Jake: change linkUrl in Studio if the live promo should point elsewhere.
const ANNOUNCEMENT_BAR = {
  _type: 'object' as const,
  enabled: true,
  badgeLabel: 'NEW',
  message: 'Compare engineer costs by region with our live Price Calculator.',
  linkLabel: 'Open calculator',
  linkUrl: '/pricing',
}

async function main() {
  console.log('Patching navigation.announcementBar...')
  await client
    .patch('navigation')
    .set({ announcementBar: ANNOUNCEMENT_BAR })
    .commit()
  console.log('Done. announcementBar.enabled = true')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

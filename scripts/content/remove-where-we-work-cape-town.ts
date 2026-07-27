/**
 * Home "Where we work" — remove the Cape Town panel.
 *
 * The section's six hubs live on the `homePage` singleton
 * (`whereWeWork.hubs`), not in code: the static fallback in
 * `site/src/components/templates/home/content.ts` only ever had five. So the
 * panel can only be removed from the dataset. Jake runs this once after review.
 *
 * Matches on the hub NAME rather than an array index, so a re-order in Studio
 * cannot make this delete the wrong city. Prints the before/after hub list and
 * exits without writing if Cape Town is already gone.
 *
 * Usage (repo root, SANITY_MIGRATION_WRITE_TOKEN in .env):
 *   npx tsx scripts/content/remove-where-we-work-cape-town.ts          # dry run
 *   npx tsx scripts/content/remove-where-we-work-cape-town.ts --apply  # writes
 */

import 'dotenv/config'

import { createClient } from '@sanity/client'

const TARGET_HUB_NAME = 'Cape Town'

const apply = process.argv.includes('--apply')

const projectId =
  process.env.SANITY_PROJECT_ID ??
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ??
  'lzbhll1u'
const dataset =
  process.env.SANITY_DATASET ??
  process.env.NEXT_PUBLIC_SANITY_DATASET ??
  'production'
const token = process.env.SANITY_MIGRATION_WRITE_TOKEN

if (apply && !token) {
  console.error('Missing SANITY_MIGRATION_WRITE_TOKEN in .env (repo root).')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  ...(token ? { token } : {}),
  apiVersion: '2024-01-01',
  useCdn: false,
})

interface Hub {
  _key: string
  name: string | null
  href: string | null
}

async function main() {
  const hubs = await client.fetch<Hub[] | null>(
    `*[_id == "homePage"][0].whereWeWork.hubs[]{ _key, name, href }`,
  )

  if (!hubs?.length) {
    console.error('homePage.whereWeWork.hubs is empty or missing — nothing to do.')
    process.exit(1)
  }

  console.log(`Before (${hubs.length} hubs):`)
  for (const hub of hubs) console.log(`  - ${hub.name} -> ${hub.href}`)

  const target = hubs.find((hub) => hub.name === TARGET_HUB_NAME)
  if (!target) {
    console.log(`\n"${TARGET_HUB_NAME}" is not in the list. Nothing to do.`)
    return
  }

  if (!apply) {
    console.log(
      `\nDRY RUN. Would remove "${TARGET_HUB_NAME}" (_key ${target._key}), leaving ${hubs.length - 1} hubs.`,
    )
    console.log('Re-run with --apply to write.')
    return
  }

  await client
    .patch('homePage')
    .unset([`whereWeWork.hubs[_key=="${target._key}"]`])
    .commit()

  const after = await client.fetch<Hub[]>(
    `*[_id == "homePage"][0].whereWeWork.hubs[]{ _key, name, href }`,
  )
  console.log(`\nAfter (${after.length} hubs):`)
  for (const hub of after) console.log(`  - ${hub.name} -> ${hub.href}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

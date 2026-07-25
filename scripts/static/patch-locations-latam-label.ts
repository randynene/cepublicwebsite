/**
 * Rename the Locations nav dropdown label "LATAM" -> "Latin America".
 *
 * Surgical: touches ONLY navigation.locationsDropdown.<section>.<loc-latam>.label.
 * Leaves the URL (/services/latam-developers), icon, subtitle, and every other
 * nav/footer field untouched. Idempotent — re-running is a no-op once applied.
 *
 * Safe by default: prints the current + intended value and DOES NOT WRITE.
 * Pass --apply to commit the change to the live `production` dataset.
 *
 * Usage (from repo root, with SANITY_MIGRATION_WRITE_TOKEN in .env):
 *   npx tsx scripts/static/patch-locations-latam-label.ts            # dry-run
 *   npx tsx scripts/static/patch-locations-latam-label.ts --apply    # write
 */

import 'dotenv/config'

import { createClient } from '@sanity/client'

const NEW_LABEL = 'Latin America'
const APPLY = process.argv.includes('--apply')

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

const client = createClient({ projectId, dataset, token, apiVersion: '2024-01-01', useCdn: false })

interface DropdownItem { _key: string; label?: string; url?: string }
interface DropdownSection { _key: string; items?: DropdownItem[] }

async function main() {
  console.log(`Locations label patch  (dataset: ${dataset})`)
  console.log(APPLY ? 'MODE: APPLY (will write)\n' : 'MODE: dry-run (no write) — pass --apply to commit\n')

  const nav = await client.fetch<{
    locationsDropdown?: { sections?: DropdownSection[] }
  } | null>(`*[_id == "navigation"][0]{ locationsDropdown }`)

  const sections = nav?.locationsDropdown?.sections ?? []

  // Find the LATAM item by key, then fall back to url match for robustness.
  let sectionKey: string | undefined
  let item: DropdownItem | undefined
  for (const s of sections) {
    const found =
      (s.items ?? []).find((i) => i._key === 'loc-latam') ??
      (s.items ?? []).find((i) => (i.url ?? '').includes('/services/latam-developers'))
    if (found) { sectionKey = s._key; item = found; break }
  }

  if (!item || !sectionKey) {
    console.error('Could not find the LATAM item in navigation.locationsDropdown. Nothing changed.')
    process.exit(1)
  }

  console.log(`  found item: _key="${item._key}"  section="${sectionKey}"`)
  console.log(`  current label: "${item.label ?? ''}"`)
  console.log(`  target  label: "${NEW_LABEL}"`)

  if (item.label === NEW_LABEL) {
    console.log('\nAlready "Latin America" — no change needed.')
    return
  }

  if (!APPLY) {
    console.log('\nDry-run only. Re-run with --apply to write this single label.')
    return
  }

  const path = `locationsDropdown.sections[_key=="${sectionKey}"].items[_key=="${item._key}"].label`
  await client.patch('navigation').set({ [path]: NEW_LABEL }).commit()

  const check = await client.fetch<string | null>(
    `*[_id == "navigation"][0].locationsDropdown.sections[_key=="${sectionKey}"][0].items[_key=="${item._key}"][0].label`,
  )
  console.log(`\nWritten. Live label is now: "${check}"`)
}

main().catch((err) => { console.error('\nFAIL:', err); process.exit(1) })

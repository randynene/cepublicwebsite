/**
 * Reorder the talent locations to Eastern Europe → Latin America → Philippines.
 *
 * Seb's call on the 28 Jul review: "On locations, put Eastern Europe top, then
 * Latin America, then Philippines on the dropdown from the header."
 *
 * WHAT THIS TOUCHES — two documents, one field each:
 *   1. navigation.locationsDropdown.sections[].items   (the header dropdown)
 *   2. footer.talentLocations.items                    (the footer column)
 *
 * It REORDERS the items that are already there. It does not rewrite labels,
 * subtitles, icons or URLs, so anything Seb has edited in Studio survives.
 * Items that are not one of the three known locations keep their relative
 * order and sit after the three.
 *
 * Idempotent: run it twice and the second run reports "already ordered" and
 * writes nothing.
 *
 * Usage (from repo root, with SANITY_MIGRATION_WRITE_TOKEN in .env):
 *   npx tsx scripts/static/reorder-locations.ts            # dry run, prints the plan
 *   npx tsx scripts/static/reorder-locations.ts --apply    # writes
 */

import 'dotenv/config'

import { createClient } from '@sanity/client'

const projectId =
  process.env.SANITY_PROJECT_ID ?? process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? 'lzbhll1u'
const dataset =
  process.env.SANITY_DATASET ?? process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'
const token = process.env.SANITY_MIGRATION_WRITE_TOKEN
const APPLY = process.argv.includes('--apply')

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

/** Slug fragments in the order Seb asked for. Matched against each item's url. */
const ORDER = [
  'eastern-europe-developers',
  'latam-developers',
  'philippines-developers',
] as const

type Item = { _key?: string; url?: string; label?: string }

/** Index in ORDER, or ORDER.length for anything we do not recognise. */
function rank(item: Item): number {
  const url = item.url ?? ''
  const i = ORDER.findIndex((slug) => url.includes(slug))
  return i === -1 ? ORDER.length : i
}

/** Stable sort by rank — unknown items keep their relative order, at the end. */
function reorder<T extends Item>(items: T[]): T[] {
  return items
    .map((item, i) => ({ item, i, r: rank(item) }))
    .sort((a, b) => a.r - b.r || a.i - b.i)
    .map((e) => e.item)
}

const sameOrder = (a: Item[], b: Item[]) =>
  a.length === b.length && a.every((item, i) => item._key === b[i]._key)

const describe = (items: Item[]) =>
  items.map((i) => i.label ?? i.url ?? '(unlabelled)').join(' → ')

async function main() {
  console.log(`Reorder talent locations — ${projectId}/${dataset}`)
  console.log(`Target order: ${ORDER.join(' → ')}`)
  console.log(APPLY ? 'MODE: apply\n' : 'MODE: dry run (pass --apply to write)\n')

  let changes = 0

  // 1. Header dropdown.
  const nav = await client.fetch<{
    locationsDropdown?: { sections?: { items?: Item[] }[] }
  } | null>(`*[_id == "navigation"][0]{ locationsDropdown }`)

  const sections = nav?.locationsDropdown?.sections
  if (!sections?.length) {
    console.log('[1/2] navigation.locationsDropdown — no sections found, skipping')
  } else {
    const next = sections.map((s) => ({ ...s, items: reorder(s.items ?? []) }))
    const changed = sections.some((s, i) => !sameOrder(s.items ?? [], next[i].items))
    if (!changed) {
      console.log('[1/2] navigation.locationsDropdown — already ordered')
    } else {
      for (const [i, s] of sections.entries()) {
        console.log(`[1/2] navigation.locationsDropdown.sections[${i}]`)
        console.log(`        from: ${describe(s.items ?? [])}`)
        console.log(`        to:   ${describe(next[i].items)}`)
      }
      changes += 1
      if (APPLY) {
        await client
          .patch('navigation')
          .set({ 'locationsDropdown.sections': next })
          .commit()
        console.log('        written')
      }
    }
  }

  // 2. Footer column.
  const footer = await client.fetch<{
    talentLocations?: { items?: Item[] }
  } | null>(`*[_id == "footer"][0]{ talentLocations }`)

  const footerItems = footer?.talentLocations?.items
  if (!footerItems?.length) {
    console.log('[2/2] footer.talentLocations — no items found, skipping')
  } else {
    const next = reorder(footerItems)
    if (sameOrder(footerItems, next)) {
      console.log('[2/2] footer.talentLocations — already ordered')
    } else {
      console.log('[2/2] footer.talentLocations.items')
      console.log(`        from: ${describe(footerItems)}`)
      console.log(`        to:   ${describe(next)}`)
      changes += 1
      if (APPLY) {
        await client.patch('footer').set({ 'talentLocations.items': next }).commit()
        console.log('        written')
      }
    }
  }

  console.log(
    changes === 0
      ? '\nNothing to do.'
      : APPLY
        ? `\nDone — ${changes} field(s) reordered.`
        : `\n${changes} field(s) would be reordered. Re-run with --apply to write.`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

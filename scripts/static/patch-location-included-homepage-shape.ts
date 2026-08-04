import 'dotenv/config'

import { sanityWriteClient } from '@/lib/content/sanity-write-client'

// CE-37: align the location "What's included" block with the homepage YOU / US
// card, on all three location pages.
//
// The template change alone is not enough. `included` is Sanity-owned on the
// three locationPage docs (patched 27 Jul), and the transform prefers the
// document over the code defaults - so the old counted labels ("You - 3 things"
// / "We - 8 things") and the 8-item "We" list would keep rendering.
//
// This writes the same values regionalIncluded() now returns in
// site/src/components/templates/location/content.ts, keeping the region name in
// the payroll line. The fields the homepage layout has nowhere for (youBody,
// youFootnote, wePill, weBody) are deliberately LEFT IN PLACE rather than
// unset: they are inert where they sit, and removing fields from live singletons
// belongs in the Tech Debt #62/#63 cleanup pass, not here.
//
// Idempotent: re-running against already-aligned docs reports no change.
//
// Run:   npm run static:patch-location-included-homepage -- --apply
// Token: SANITY_MIGRATION_WRITE_TOKEN

const REGION_BY_ID: Record<string, string> = {
  'locationPage-latam-developers': 'Latin America',
  'locationPage-philippines-developers': 'the Philippines',
  'locationPage-eastern-europe-developers': 'Eastern Europe',
}

const YOU_LABEL = 'You'
const WE_LABEL = 'Us'

const YOU_ITEMS = [
  "Direct your engineer's work",
  'Bring them into your standups & Slack',
  'Treat them like a full-time hire',
]

function weItems(region: string): string[] {
  return [
    "Source and vet the engineer (free if you don't hire)",
    'Employ them locally with full benefits and private healthcare',
    `Handle payroll, taxes, and compliance across ${region}`,
    'Provide a US or UK-based account manager',
    "Replace them at no cost if it isn't working",
    'Support their training, performance, and retention long-term',
    'Liability insurance + IP/data protection on every contract',
  ]
}

type Doc = { _id: string; youLabel?: string; weLabel?: string; we?: string[]; you?: string[] }

async function main() {
  const apply = process.argv.includes('--apply')

  const docs = await sanityWriteClient.fetch<Doc[]>(
    `*[_type == "locationPage"]{
      _id,
      "youLabel": included.youLabel,
      "weLabel": included.weLabel,
      "you": included.you,
      "we": included.we
    } | order(_id asc)`,
  )

  if (docs.length === 0) throw new Error('No locationPage documents found.')

  for (const doc of docs) {
    const region = REGION_BY_ID[doc._id]
    if (!region) {
      console.log(`\n${doc._id}\n  SKIPPED - no region mapping. Add it before running again.`)
      continue
    }

    const we = weItems(region)
    const aligned =
      doc.youLabel === YOU_LABEL &&
      doc.weLabel === WE_LABEL &&
      JSON.stringify(doc.you) === JSON.stringify(YOU_ITEMS) &&
      JSON.stringify(doc.we) === JSON.stringify(we)

    console.log(`\n${doc._id}`)
    if (aligned) {
      console.log('  already aligned.')
      continue
    }
    console.log(`  - youLabel: ${doc.youLabel} -> ${YOU_LABEL}`)
    console.log(`  - weLabel:  ${doc.weLabel} -> ${WE_LABEL}`)
    console.log(`  - we:       ${doc.we?.length ?? 0} items -> ${we.length} (payroll names ${region})`)

    if (!apply) {
      console.log('  (dry run - pass --apply to commit)')
      continue
    }

    await sanityWriteClient
      .patch(doc._id)
      .set({
        'included.youLabel': YOU_LABEL,
        'included.weLabel': WE_LABEL,
        'included.you': YOU_ITEMS,
        'included.we': we,
      })
      .commit()
    console.log('  committed.')
  }

  if (!apply) console.log('\nDry run complete. Re-run with -- --apply to write.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

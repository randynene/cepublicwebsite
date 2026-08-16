import 'dotenv/config'

import { randomUUID } from 'node:crypto'

import { sanityWriteClient } from '@/lib/content/sanity-write-client'

// CE-68 - seed the Fractional CTO "Your match" panel into Sanity.
//
// Why this exists: the panel was hardcoded in the template, so re-pricing three
// tiers needed a developer and a deploy. That is what made CE-68 a ticket at
// all. The schema now carries the panel (studio/schemas/singletons/
// fractional-cto-page.ts) and the page reads it, so this writes the values in
// once and Seb owns them from then on.
//
// The numbers. Seb supplied GBP monthly retainers:
//   Seed CTO             1 day/week    £3,500/mo
//   Scaling CTO          2 days/week   £5,500/mo
//   AI transformation    2 days/week   £7,500/mo
// The page previously showed USD DAY rates ($1,800 / $2,000 / $2,800) and gave
// AI transformation 3 days a week. So this changes the unit, the currency and
// one commitment level at the same time, and it is a large reduction - the AI
// tier drops from roughly $36k/mo equivalent. Confirmed with Jake before
// running, not inferred.
//
// USD figures are Jake's: converted at about 1.28 and rounded to marketing
// numbers rather than left as exact FX output.
//
// Order matters. The panel renders top to bottom in array order, and the design
// leads with Scaling (the middle tier) rather than the cheapest - that is the
// existing order and it is preserved.
//
// Idempotent: overwrites hero.match wholesale, so re-running restores exactly
// this state. It does NOT touch anything else on the document.
//
// Run (preview):  npx tsx scripts/content/seed-fcto-match-panel.ts
// Run (write):    npx tsx scripts/content/seed-fcto-match-panel.ts --apply
// Token: SANITY_MIGRATION_WRITE_TOKEN

const DOC_TYPE = 'fractionalCtoPage'

interface MatchRow {
  _key: string
  _type: 'fctoMatchRow'
  icon: 'trend' | 'spark' | 'idea'
  title: string
  meta: string
  price: string
  priceGbp: string
  per: string
}

const PER = '/ mo'

const ROWS: Array<Omit<MatchRow, '_key' | '_type'>> = [
  {
    icon: 'trend',
    title: 'Scaling CTO',
    meta: 'Series A · scaled eng team 5+ · 2 days/week',
    price: '$7,000',
    priceGbp: '£5,500',
    per: PER,
  },
  {
    icon: 'spark',
    title: 'AI transformation CTO',
    meta: 'GenAI rollout · B2B SaaS · 2 days/week',
    price: '$9,500',
    priceGbp: '£7,500',
    per: PER,
  },
  {
    icon: 'idea',
    title: 'Seed CTO',
    meta: 'Product roadmap · 1 day/week',
    price: '$4,500',
    priceGbp: '£3,500',
    per: PER,
  },
]

const MATCH = {
  label: 'Your match',
  badge: 'Shortlist in 7 days',
  footnote: 'Sourced and vetted against your brief.',
  rows: ROWS.map((r) => ({ _key: randomUUID(), _type: 'fctoMatchRow' as const, ...r })),
}

async function main(): Promise<void> {
  const apply = process.argv.includes('--apply')

  const doc = await sanityWriteClient.fetch<{ _id: string } | null>(
    `*[_type == $type][0]{ _id }`,
    { type: DOC_TYPE },
  )
  if (!doc) throw new Error(`No ${DOC_TYPE} document found.`)

  console.log(`Target: ${doc._id}\n`)
  console.log(`  ${'Tier'.padEnd(24)} ${'US'.padEnd(9)} ${'UK'.padEnd(9)} Unit`)
  for (const r of MATCH.rows) {
    console.log(`  ${r.title.padEnd(24)} ${r.price.padEnd(9)} ${r.priceGbp.padEnd(9)} ${r.per}`)
  }

  if (!apply) {
    console.log(`\nPreview only. Re-run with --apply to write it.`)
    return
  }

  await sanityWriteClient.patch(doc._id).set({ 'hero.match': MATCH }).commit()
  console.log(`\nWritten. Seb can now edit these in Studio under Fractional CTO > Hero > Your match panel.`)
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})

import 'dotenv/config'

import { sanityWriteClient } from '@/lib/content/sanity-write-client'

// CE-29: remove the itemised cost breakdown from the pricing calculator.
//
// The `calculator.model.breakdownRows` array itemised base salary, employer
// taxes, benefits and the Cloud Employee management fee. The management-fee row
// published CE's gross margin on an indexable production page. Jake's call
// (Aug 2026): drop the line items, keep the all-in total, the savings line and
// the CTA.
//
// The code change alone is NOT sufficient. The GROQ projection preferred the
// Sanity values over the code defaults, so the rows must be unset on the
// document or the deployed page keeps serving them.
//
// Narrow + idempotent: unsets one field and sets one number, on the published
// doc and its draft if one exists. Re-running is a no-op.
//
// Run:   npm run static:patch-pricing-remove-breakdown -- --apply
// Token: SANITY_MIGRATION_WRITE_TOKEN

const ROWS_PATH = 'calculator.model.breakdownRows'
const TOTAL_PATH = 'calculator.model.breakdownTotalAmount'

/** The design's reference all-in monthly rate, and the sum of the old rows. */
const ALL_IN_TOTAL = 5400

type BreakdownRow = { label?: string; amount?: number }

type PricingDoc = {
  _id: string
  rows?: BreakdownRow[] | null
  total?: number | null
}

async function main() {
  const apply = process.argv.includes('--apply')

  const docs = await sanityWriteClient.fetch<PricingDoc[]>(
    `*[_id in ["pricingPage", "drafts.pricingPage"]]{
      _id,
      "rows": ${ROWS_PATH},
      "total": ${TOTAL_PATH}
    }`,
  )

  if (docs.length === 0) {
    throw new Error('No pricingPage document found (published or draft).')
  }

  for (const doc of docs) {
    const rows = doc.rows ?? []
    const needsUnset = rows.length > 0
    const needsTotal = doc.total !== ALL_IN_TOTAL

    console.log(`\n${doc._id}`)
    if (needsUnset) {
      for (const row of rows) {
        console.log(`  - remove row: ${row.label} (${row.amount})`)
      }
    } else {
      console.log('  - rows already absent')
    }
    console.log(
      needsTotal
        ? `  - set ${TOTAL_PATH}: ${doc.total ?? '(unset)'} -> ${ALL_IN_TOTAL}`
        : `  - ${TOTAL_PATH} already ${ALL_IN_TOTAL}`,
    )

    if (!needsUnset && !needsTotal) continue

    if (!apply) {
      console.log('  (dry run - pass --apply to commit)')
      continue
    }

    await sanityWriteClient
      .patch(doc._id)
      .unset([ROWS_PATH])
      .set({ [TOTAL_PATH]: ALL_IN_TOTAL })
      .commit()
    console.log('  committed.')
  }

  if (!apply) {
    console.log('\nDry run complete. Re-run with -- --apply to write.')
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

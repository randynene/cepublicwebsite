import 'dotenv/config'

import { sanityWriteClient } from '@/lib/content/sanity-write-client'

// CE-29 follow-up: the COPY around the all-in rate still promised an itemisation.
//
// The first CE-29 pass removed the line items from the code and unset the rows
// in Sanity, but left these label fields alone - and they are Sanity-owned, so
// the document kept overriding the code. The live page therefore still read
// "THE FULL BREAKDOWN / Here's exactly what makes up the GBP 5,400/mo..." above
// a panel that no longer breaks anything down.
//
// Same trap as the rest of this batch: the fix is only real once BOTH sides
// agree. Values here mirror templates/pricing/content.ts.
//
// The show/hide labels are deliberately NOT rewritten - the toggle itself was
// removed (a button that collapses a single number is furniture), so those two
// fields are now unread. Left in the schema rather than deleted mid-flight.
//
// Idempotent.
//
// Run:   npm run static:patch-pricing-breakdown-copy -- --apply
// Token: SANITY_MIGRATION_WRITE_TOKEN

const DOC_ID = 'pricingPage'

const COPY: Record<string, string> = {
  'calculator.breakdownEyebrow': 'The all-in rate',
  'calculator.breakdownIntroPrefix': "Here's the",
}

async function main() {
  const apply = process.argv.includes('--apply')

  const current = await sanityWriteClient.fetch<Record<string, string | null>>(
    `*[_id == $id][0]{
      "calculator.breakdownEyebrow": calculator.breakdownEyebrow,
      "calculator.breakdownIntroPrefix": calculator.breakdownIntroPrefix
    }`,
    { id: DOC_ID },
  )

  const changes: Record<string, string> = {}
  console.log(DOC_ID)
  for (const [path, next] of Object.entries(COPY)) {
    const now = current?.[path] ?? null
    if (now === next) {
      console.log(`  ${path}: already "${next}"`)
      continue
    }
    console.log(`  ${path}: "${now}" -> "${next}"`)
    changes[path] = next
  }

  if (Object.keys(changes).length === 0) {
    console.log('\nNothing to do.')
    return
  }
  if (!apply) {
    console.log('\nDry run complete. Re-run with -- --apply to write.')
    return
  }

  await sanityWriteClient.patch(DOC_ID).set(changes).commit()
  console.log('\ncommitted.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

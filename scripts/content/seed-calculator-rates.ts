// Seed the price-comparison rate card from the live calculator's own source.
//
// These are not estimates. The live page ships its cost model as an inline script,
// so the salaries, the on-costs and Cloud Employee's own rate are all readable, and
// these are those numbers verbatim. Reconstructing them by guesswork would have
// produced a calculator that looked right and argued CE's case with the wrong
// figures, on the page CE uses to talk about money.
//
// Kept as a seed rather than a hardcoded table so Seb can correct the salaries in
// Studio when they go stale, which they will: they are 2025/26 market rates.
//
//   npm run content:seed-calculator-rates
import { sanityWriteClient } from '@/lib/content/sanity-write-client'
import { ensureSanity } from '@/lib/env'

ensureSanity()

type Rate = {
  _key: string
  _type: 'calculatorRate'
  region: 'usa' | 'uk'
  role: 'junior' | 'mid' | 'senior'
  salary: number
  cloudEmployeeCost: number
  trainingCost: number
  recruitmentPct: number
  benefitsPct?: number
  ficaPct?: number
  ficaWageBase?: number
  futaFlat?: number
  medicarePct?: number
  niPct?: number
  holidayWeeks?: number
}

// US: FICA at 6.2% up to the $176,100 Social Security wage base, FUTA flat at $420,
// Medicare at 1.45% uncapped, benefits and recruitment each at 20% of salary.
const us = (role: Rate['role'], salary: number, cloud: number): Rate => ({
  _key: `usa-${role}`,
  _type: 'calculatorRate',
  region: 'usa',
  role,
  salary,
  cloudEmployeeCost: cloud,
  trainingCost: 1500,
  recruitmentPct: 0.2,
  benefitsPct: 0.2,
  ficaPct: 0.062,
  ficaWageBase: 176100,
  futaFlat: 420,
  medicarePct: 0.0145,
})

// UK: employer National Insurance at 17%, statutory holiday of 5.6 weeks costed as
// salary / 52 * weeks, recruitment at 20%.
const uk = (role: Rate['role'], salary: number, cloud: number): Rate => ({
  _key: `uk-${role}`,
  _type: 'calculatorRate',
  region: 'uk',
  role,
  salary,
  cloudEmployeeCost: cloud,
  trainingCost: 1000,
  recruitmentPct: 0.2,
  niPct: 0.17,
  holidayWeeks: 5.6,
})

const RATES: Rate[] = [
  us('junior', 106_000, 39_750),
  us('mid', 160_000, 53_000),
  us('senior', 212_000, 66_200),
  uk('junior', 83_200, 31_200),
  uk('mid', 124_800, 41_600),
  uk('senior', 166_400, 52_000),
]

async function main(): Promise<void> {
  const id = 'priceComparisonCalculatorPage'

  await sanityWriteClient
    .transaction()
    .createIfNotExists({ _id: id, _type: id })
    .patch(id, (p) => p.set({ rates: RATES }))
    .commit()

  console.log(`Seeded ${RATES.length} rate rows into ${id}.\n`)
  for (const r of RATES) {
    console.log(
      `  ${r.region.toUpperCase().padEnd(3)} ${r.role.padEnd(6)} ` +
        `salary ${r.salary.toLocaleString().padStart(9)}   ` +
        `cloud employee ${r.cloudEmployeeCost.toLocaleString().padStart(8)}`,
    )
  }
  console.log(`\nSalaries are 2025/26 market rates. Seb edits them in Studio when they age.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

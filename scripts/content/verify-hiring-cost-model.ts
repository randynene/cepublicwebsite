// Does our hiring-cost model still say what the live widget says?
//
// The live calculator ships as a minified bundle, so its rate matrix could not be
// read; it was recovered by driving the real widget and recording the answers. A
// model recovered that way is a hypothesis, and the only honest way to hold it is to
// keep re-testing it against the thing it was copied from.
//
// So this drives the live page across every combination of inputs it accepts, plus
// several headcounts, and asserts our model reproduces every figure. It fails loudly
// if CE changes their rates, which is exactly what we want it to do: the alternative
// is our pricing page quietly disagreeing with theirs.
//
//   npm run verify:hiring-cost
import { chromium } from 'playwright'

import {
  COMPANY_REGIONS,
  CURRENCIES,
  TALENT_REGIONS,
  hiringCost,
  type CompanyRegion,
  type Currency,
  type TalentRegion,
} from '../../site/src/lib/calculators/hiring-cost'

const LIVE = 'https://www.cloudemployee.io/hiring-cost-calculator'

// The widget's own option labels, mapped onto our identifiers.
const COMPANY_LABEL: Record<CompanyRegion, string> = {
  usa: 'United States',
  uk: 'United Kingdom',
  australia: 'Australia',
  europe: 'Europe',
}
const TALENT_LABEL: Record<TalentRegion, string> = {
  latam: 'Latin America',
  easternEurope: 'Eastern Europe',
  philippines: 'Philippines',
}
// The currency <option> carries value="USD" and text="$ USD". The company and talent
// selects carry the label in BOTH. Setting a select to a string that is not one of
// its option VALUES does not throw: the select simply ignores it and stays where it
// was, so the widget kept answering in dollars while the script believed it had
// asked for pounds, and the "mismatch" was ours. Our Currency identifiers already
// match the option values, so they are passed straight through.

// 100 is deliberately included: the live widget clamps to 50, and a model that
// did not would disagree with CE by millions on an input a real visitor can type.
const HEADCOUNTS = [1, 3, 10, 50, 100]

const num = (s: string | undefined): number | null =>
  s === undefined ? null : Number(s.replace(/[^\d.]/g, ''))

async function main(): Promise<void> {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  // tsx compiles through esbuild, which rewrites named arrow functions to call a
  // `__name` helper it injects at module scope. Inside page.evaluate the function is
  // serialised and run in the BROWSER, where that helper does not exist, so any
  // evaluate() containing a named inner function dies with "__name is not defined".
  // Shim it. (Filed as a customer-2 pattern in docs/CAPABILITY_LOG.md.)
  await page.addInitScript(() => {
    ;(window as unknown as { __name: (fn: unknown) => unknown }).__name = (fn) => fn
  })

  await page.goto(LIVE, { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await page.waitForTimeout(3_500)

  let checked = 0
  const failures: string[] = []

  for (const company of COMPANY_REGIONS) {
    for (const talent of TALENT_REGIONS) {
      for (const currency of CURRENCIES) {
        for (const devs of HEADCOUNTS) {
          await page.evaluate(
            ({ devs, company, talent, currency }) => {
              const setNative = (el: HTMLElement, v: string) => {
                const proto = Object.getPrototypeOf(el)
                const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
                setter?.call(el, v)
                el.dispatchEvent(new Event('input', { bubbles: true }))
                el.dispatchEvent(new Event('change', { bubbles: true }))
              }
              const input = document.querySelector('input[type=number]')
              const sels = [...document.querySelectorAll('select')]
              if (input) setNative(input as HTMLElement, String(devs))
              setNative(sels[0], company)
              setNative(sels[1], talent)
              setNative(sels[2], currency)
            },
            {
              devs,
              company: COMPANY_LABEL[company],
              talent: TALENT_LABEL[talent],
              currency,
            },
          )
          await page.waitForTimeout(500)

          const text = (await page.evaluate(() => document.body.innerText ?? ''))
            .replace(/\s+/g, ' ')
            .trim()

          const monthly = text.match(/Hiring with\D*([\d,]+)\D+to\D*([\d,]+)\s*\/\s*month/)
          const saving = text.match(/Save an avg\. of\D*([\d,]+)/)

          const mine = hiringCost(devs, company, talent, currency)
          const where = `${company}/${talent}/${currency} x${devs}`

          const cases: Array<[string, number, number | null]> = [
            ['monthly.min', Math.round(mine.monthly.min), num(monthly?.[1])],
            ['monthly.max', Math.round(mine.monthly.max), num(monthly?.[2])],
            ['savings', Math.round(mine.savings), num(saving?.[1])],
          ]

          for (const [name, ours, live] of cases) {
            checked++
            if (live === null) {
              failures.push(`${where} ${name}: could not read the live figure`)
            } else if (Math.abs(ours - live) > 1) {
              failures.push(`${where} ${name}: ours=${ours} live=${live}`)
            }
          }
        }
      }
    }
  }

  await browser.close()

  console.log(
    `${checked} figures checked across ` +
      `${COMPANY_REGIONS.length} company regions x ${TALENT_REGIONS.length} talent regions ` +
      `x ${CURRENCIES.length} currencies x ${HEADCOUNTS.length} headcounts.`,
  )

  if (failures.length > 0) {
    console.error(`\n${failures.length} figure(s) disagree with the live widget:`)
    failures.slice(0, 25).forEach((f) => console.error(`  ${f}`))
    console.error(`\nCE has probably changed their rates. Update TALENT_RATE_USD /`)
    console.error(`LOCAL_COST_USD in site/src/lib/calculators/hiring-cost.ts to match.`)
    process.exit(1)
  }

  console.log(`\nOur model reproduces the live widget exactly.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

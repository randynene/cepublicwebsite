// The hiring-cost model: what a developer costs through Cloud Employee, and what
// you save against hiring one locally.
//
// This one could NOT be read off the page the way the price-comparison model could.
// The live widget ships as a minified bundle with its rate matrix buried inside, so
// the model here was recovered EMPIRICALLY: drive the real widget across every
// combination of inputs it accepts (4 company regions x 3 talent regions x
// 5 currencies) and record what it says.
//
// That produced 60 readings, and the model below reproduces all 180 figures in them
// exactly. The derivation is in scripts/content/verify-hiring-cost-model.ts, which
// re-checks it against the live site rather than trusting this comment.
//
// The structure that fell out of the readings:
//
//   savings = (what a developer costs you locally) - (what they cost through CE)
//
// so a company in Sydney sees a smaller saving than one in San Francisco, not
// because CE charges them more, but because they were paying less to begin with.
// The talent region sets CE's rate; the company region sets the thing it is
// compared against. Those are two different numbers and the live widget keeps them
// separate, which is worth preserving: collapsing them into one "saving" figure per
// region would look identical on the US page and be wrong everywhere else.

export const TALENT_REGIONS = ['latam', 'easternEurope', 'philippines'] as const
export const COMPANY_REGIONS = ['usa', 'uk', 'australia', 'europe'] as const
export const CURRENCIES = ['USD', 'GBP', 'AUD', 'EUR', 'CAD'] as const

export type TalentRegion = (typeof TALENT_REGIONS)[number]
export type CompanyRegion = (typeof COMPANY_REGIONS)[number]
export type Currency = (typeof CURRENCIES)[number]

/** Cloud Employee's monthly rate per developer, in USD, by where the talent sits. */
const TALENT_RATE_USD: Record<TalentRegion, { min: number; max: number }> = {
  latam: { min: 5_000, max: 8_500 },
  easternEurope: { min: 5_000, max: 9_000 },
  philippines: { min: 4_000, max: 6_000 },
}

/**
 * The annual all-in cost of hiring the same developer locally, in USD, by where the
 * COMPANY is. This is the number CE's rate is compared against.
 *
 * Australia's is far lower than the US figure, which is why an Australian company
 * sees a saving of about $22k where an American one sees $150k. That is not a bug
 * and it is not CE being cheaper in America.
 *
 * The decimals are not decoration. These were first derived from the single-developer
 * figure, which the widget rounds to the nearest dollar, and the rounding error then
 * showed up as a $6 discrepancy once the headcount reached ten. Re-derived at the
 * widget's 50-developer cap, where the error divides away: all three talent regions
 * then agree on each baseline to the cent, which is what says the model's SHAPE is
 * right and not just its arithmetic.
 */
const LOCAL_COST_USD: Record<CompanyRegion, number> = {
  usa: 231_244.76,
  uk: 178_677.56,
  australia: 103_480.5,
  europe: 178_677.56,
}

/**
 * The live widget silently clamps the headcount to 50. Type 100 and the field
 * rewrites itself to 50.
 *
 * Worth copying rather than "improving". Without it, someone types 200, sees a
 * saving of twenty million dollars, and stops believing the page - and our figure
 * would then disagree with CE's own for the same input, which is the one thing this
 * rebuild must never do.
 */
export const MAX_DEVELOPERS = 50

/** Multipliers off USD, as the live widget uses them. */
const FX: Record<Currency, number> = {
  USD: 1,
  GBP: 0.748,
  AUD: 1.44,
  EUR: 0.877,
  CAD: 1.41,
}

export const CURRENCY_SYMBOL: Record<Currency, string> = {
  USD: '$',
  GBP: '£',
  AUD: 'A$',
  EUR: '€',
  CAD: 'C$',
}

/** Billable hours in a month. 160 = the divisor the live widget's hourly rate implies. */
const HOURS_PER_MONTH = 160

export type HiringCost = {
  monthly: { min: number; max: number }
  hourly: { min: number; max: number }
  yearly: { min: number; max: number }
  /** Annual, against hiring the same people locally. */
  savings: number
  currency: Currency
}

export function hiringCost(
  developers: number,
  companyRegion: CompanyRegion,
  talentRegion: TalentRegion,
  currency: Currency,
): HiringCost {
  const n = Math.min(MAX_DEVELOPERS, Math.max(1, Math.floor(developers) || 1))
  const fx = FX[currency]
  const rate = TALENT_RATE_USD[talentRegion]

  const scale = (usd: number) => usd * n * fx

  // The saving is per developer, against the local cost of that same developer.
  const cloudEmployeeAnnualUsd = ((rate.min + rate.max) / 2) * 12
  const savings = scale(LOCAL_COST_USD[companyRegion] - cloudEmployeeAnnualUsd)

  // Hourly is PER DEVELOPER and does not scale with headcount: it is a rate, not a
  // bill. Hiring five people does not make each of them cost five times as much an
  // hour, and the live widget agrees.
  const hourly = {
    min: (rate.min * fx) / HOURS_PER_MONTH,
    max: (rate.max * fx) / HOURS_PER_MONTH,
  }

  return {
    monthly: { min: scale(rate.min), max: scale(rate.max) },
    hourly,
    yearly: { min: scale(rate.min) * 12, max: scale(rate.max) * 12 },
    savings,
    currency,
  }
}

export function formatMoney(amount: number, currency: Currency): string {
  return `${CURRENCY_SYMBOL[currency]}${Math.round(amount).toLocaleString('en-US')}`
}

/** "$60k". The live widget abbreviates the annual figures and not the monthly ones. */
export function formatThousands(amount: number, currency: Currency): string {
  return `${CURRENCY_SYMBOL[currency]}${Math.round(amount / 1000).toLocaleString('en-US')}k`
}

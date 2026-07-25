// The in-house vs Cloud Employee cost model.
//
// Reconstructed from the live calculator's own source, so the formulas and the
// on-costs are CE's rather than a plausible-looking invention. This page is how CE
// argues about money in public; a number that is subtly wrong here is worse than no
// calculator at all.
//
// Split deliberately:
//
//   the formulas live HERE      they are payroll rules, they change when the law
//                               changes, and getting them wrong is a bug
//   the numbers live in SANITY  they are market salaries with a year on them, they
//                               go stale within twelve months, and the person who
//                               notices is Seb, not a developer
//
// The two regions are genuinely different payrolls, not one payroll with different
// numbers. The US carries FICA (capped at a wage base), FUTA (flat), Medicare
// (uncapped) and health benefits. The UK carries employer National Insurance and
// statutory holiday accrual. Flattening them into a single formula would mean
// pretending they are the same, which is how you end up quietly charging FICA to a
// developer in Manchester.
import { z } from 'zod'

export const REGIONS = ['usa', 'uk'] as const
export const ROLES = ['junior', 'mid', 'senior'] as const

export type Region = (typeof REGIONS)[number]
export type Role = (typeof ROLES)[number]

export const CalculatorRateSchema = z.object({
  region: z.enum(REGIONS),
  role: z.enum(ROLES),
  salary: z.number(),
  cloudEmployeeCost: z.number(),
  trainingCost: z.number(),
  recruitmentPct: z.number(),
  // US
  benefitsPct: z.number().nullable().optional(),
  ficaPct: z.number().nullable().optional(),
  ficaWageBase: z.number().nullable().optional(),
  futaFlat: z.number().nullable().optional(),
  medicarePct: z.number().nullable().optional(),
  // UK
  niPct: z.number().nullable().optional(),
  holidayWeeks: z.number().nullable().optional(),
})

export type CalculatorRate = z.infer<typeof CalculatorRateSchema>

/** A single named cost that makes up the in-house total. Shown as a table row. */
export type LineItem = { key: string; label: string; amount: number }

export type RoleBreakdown = {
  role: Role
  quantity: number
  /** What the role costs in-house, itemised. */
  lineItems: LineItem[]
  inHouseTotal: number
  cloudEmployeeTotal: number
  savings: number
  /** Savings as a share of the in-house total. Null when nobody is being hired. */
  savingsPct: number | null
}

export type Comparison = {
  region: Region
  /** Per person per year, or per person per month. */
  period: Period
  roles: RoleBreakdown[]
  inHouseTotal: number
  cloudEmployeeTotal: number
  totalSavings: number
}

export type Period = 'monthly' | 'annual'

export const MAX_PER_ROLE = 100

/**
 * The itemised annual cost of ONE person, in-house.
 *
 * Every number is annual and for a single head. Quantity and the monthly/annual
 * period are applied afterwards, so the arithmetic here stays in one unit and the
 * scaling happens once, in one place.
 */
function inHouseLineItems(rate: CalculatorRate): LineItem[] {
  const salary = rate.salary
  const items: LineItem[] = [{ key: 'salary', label: 'Base salary', amount: salary }]

  if (rate.region === 'usa') {
    // FICA is charged on salary UP TO the wage base, not on all of it. Dropping the
    // cap overstates the cost of a senior by roughly a thousand dollars a year,
    // which is exactly the sort of error that makes a customer distrust the whole
    // page.
    const ficaBase = Math.min(salary, rate.ficaWageBase ?? salary)
    items.push(
      { key: 'fica', label: 'FICA', amount: (rate.ficaPct ?? 0) * ficaBase },
      { key: 'futa', label: 'FUTA', amount: rate.futaFlat ?? 0 },
      { key: 'medicare', label: 'Medicare', amount: (rate.medicarePct ?? 0) * salary },
      { key: 'benefits', label: 'Benefits', amount: (rate.benefitsPct ?? 0) * salary },
    )
  } else {
    items.push(
      { key: 'ni', label: 'National Insurance', amount: (rate.niPct ?? 0) * salary },
      {
        key: 'holidays',
        label: 'Statutory holiday',
        amount: (salary / 52) * (rate.holidayWeeks ?? 0),
      },
    )
  }

  items.push(
    { key: 'recruitment', label: 'Recruitment', amount: rate.recruitmentPct * salary },
    { key: 'training', label: 'Training', amount: rate.trainingCost },
  )

  return items
}

const perPeriod = (annual: number, period: Period): number =>
  period === 'monthly' ? annual / 12 : annual

/**
 * The whole comparison, for one region and one set of headcounts.
 *
 * A role with a quantity of zero still appears, with zeroes: the live calculator
 * renders every row all the time, and a table whose rows appear and disappear as
 * you type is a worse table.
 */
export function compare(
  rates: CalculatorRate[],
  region: Region,
  quantities: Record<Role, number>,
  period: Period,
): Comparison {
  const roles: RoleBreakdown[] = ROLES.map((role) => {
    const rate = rates.find((r) => r.region === region && r.role === role)
    const requested = quantities[role] ?? 0
    const quantity = Math.min(MAX_PER_ROLE, Math.max(0, Math.floor(requested) || 0))

    // A missing rate row is not a zero. It means the rate card in Sanity is
    // incomplete, and silently costing that seniority at nothing would understate
    // the in-house total and overstate CE's saving - an error that flatters us,
    // which is the kind you least want to ship.
    if (!rate) {
      return {
        role,
        quantity,
        lineItems: [],
        inHouseTotal: 0,
        cloudEmployeeTotal: 0,
        savings: 0,
        savingsPct: null,
      }
    }

    const lineItems = inHouseLineItems(rate).map((item) => ({
      ...item,
      amount: perPeriod(item.amount * quantity, period),
    }))

    const inHouseTotal = lineItems.reduce((sum, i) => sum + i.amount, 0)
    const cloudEmployeeTotal = perPeriod(rate.cloudEmployeeCost * quantity, period)
    const savings = inHouseTotal - cloudEmployeeTotal

    return {
      role,
      quantity,
      lineItems,
      inHouseTotal,
      cloudEmployeeTotal,
      savings,
      savingsPct: inHouseTotal > 0 ? (savings / inHouseTotal) * 100 : null,
    }
  })

  const inHouseTotal = roles.reduce((sum, r) => sum + r.inHouseTotal, 0)
  const cloudEmployeeTotal = roles.reduce((sum, r) => sum + r.cloudEmployeeTotal, 0)

  return {
    region,
    period,
    roles,
    inHouseTotal,
    cloudEmployeeTotal,
    totalSavings: inHouseTotal - cloudEmployeeTotal,
  }
}

const SYMBOL: Record<Region, string> = { usa: '$', uk: '£' }

export function formatCurrency(amount: number, region: Region): string {
  return `${SYMBOL[region]}${Math.round(amount).toLocaleString('en-US')}`
}

/** Which rows a missing rate card would silently zero out. Surfaced, not swallowed. */
export function missingRates(rates: CalculatorRate[]): Array<{ region: Region; role: Role }> {
  const gaps: Array<{ region: Region; role: Role }> = []
  for (const region of REGIONS) {
    for (const role of ROLES) {
      if (!rates.some((r) => r.region === region && r.role === role)) gaps.push({ region, role })
    }
  }
  return gaps
}

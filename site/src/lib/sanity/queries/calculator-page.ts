import 'server-only'

import { z } from 'zod'

import { CalculatorRateSchema } from '@/lib/calculators/price-comparison'
import { sanityFetch } from '@/lib/sanity/live'

// The calculator singletons. Marketing copy from Sanity; the rate card from Sanity;
// the arithmetic from lib/calculators/price-comparison.ts.

const PortableBlockSchema = z
  .object({ _key: z.string().optional(), _type: z.string() })
  .passthrough()

export const CalculatorPageSchema = z.object({
  _id: z.string(),
  title: z.string(),
  eyebrow: z.string().nullable().optional(),
  heroDescription: z.array(PortableBlockSchema).nullable().optional(),
  belowCalculatorContent: z.array(PortableBlockSchema).nullable().optional(),
  faqs: z
    .array(
      z.object({
        _key: z.string().optional(),
        question: z.string(),
        answer: z.array(PortableBlockSchema),
      }),
    )
    .nullable()
    .optional(),
  // Parsed, not passed through. A rate row with a missing salary would render as
  // "$NaN" on the page CE uses to argue about money, and it would do it silently.
  rates: z.array(CalculatorRateSchema).nullable().optional(),
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
})

export type CalculatorPage = z.infer<typeof CalculatorPageSchema>

export type CalculatorPageId =
  | 'priceComparisonCalculatorPage'
  | 'hiringCostCalculatorPage'

const CALCULATOR_PAGE_QUERY = /* groq */ `
*[_id == $id][0]{
  _id,
  title,
  eyebrow,
  heroDescription,
  belowCalculatorContent,
  faqs[]{ _key, question, answer },
  rates[]{
    region, role, salary, cloudEmployeeCost, trainingCost, recruitmentPct,
    benefitsPct, ficaPct, ficaWageBase, futaFlat, medicarePct,
    niPct, holidayWeeks
  },
  metaTitle,
  metaDescription
}
`

export async function fetchCalculatorPage(
  id: CalculatorPageId,
): Promise<CalculatorPage | null> {
  const { data } = await sanityFetch({ query: CALCULATOR_PAGE_QUERY, params: { id } })
  if (data === null || data === undefined) return null
  return CalculatorPageSchema.parse(data)
}

import { z } from 'zod'

import { calculatorPageSchema } from './_factories'

export const PriceComparisonCalculatorPageSchema = calculatorPageSchema(
  'priceComparisonCalculatorPage',
)
export type PriceComparisonCalculatorPage = z.infer<typeof PriceComparisonCalculatorPageSchema>

import { z } from 'zod'

import { calculatorPageSchema } from './_factories'

export const HiringCostCalculatorPageSchema = calculatorPageSchema('hiringCostCalculatorPage')
export type HiringCostCalculatorPage = z.infer<typeof HiringCostCalculatorPageSchema>

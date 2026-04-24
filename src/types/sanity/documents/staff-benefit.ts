import { z } from 'zod'

import { SanityBaseDocumentSchema, SanityImageSchema, SanitySlugSchema } from '../shared'

export const StaffBenefitSchema = SanityBaseDocumentSchema.extend({
  _type: z.literal('staffBenefit'),
  name: z.string(),
  slug: SanitySlugSchema,
  icon: SanityImageSchema.optional(),
})
export type StaffBenefit = z.infer<typeof StaffBenefitSchema>

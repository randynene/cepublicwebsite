import { z } from 'zod'

import { SanityBaseDocumentSchema, SanityImageSchema, SanitySlugSchema } from '../shared'

export const BenefitValueSchema = SanityBaseDocumentSchema.extend({
  _type: z.literal('benefitValue'),
  name: z.string(),
  slug: SanitySlugSchema,
  category: z.enum(['benefits', 'values']),
  thumbnailImage: SanityImageSchema.optional(),
  paragraph: z.string().optional(),
})
export type BenefitValue = z.infer<typeof BenefitValueSchema>

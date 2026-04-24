import { z } from 'zod'

import { SanityBaseDocumentSchema, SanitySlugSchema } from '../shared'

export const GlassdoorReviewSchema = SanityBaseDocumentSchema.extend({
  _type: z.literal('glassdoorReview'),
  clientName: z.string(),
  slug: SanitySlugSchema,
  title: z.string().optional(),
  reviewDescription: z.string().optional(),
  workField: z.string().optional(),
})
export type GlassdoorReview = z.infer<typeof GlassdoorReviewSchema>

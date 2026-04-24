import { z } from 'zod'

import { SanityBaseDocumentSchema, SanitySlugSchema } from '../shared'

export const BlogCategorySchema = SanityBaseDocumentSchema.extend({
  _type: z.literal('blogCategory'),
  name: z.string(),
  slug: SanitySlugSchema,
  order: z.number().optional(),
})
export type BlogCategory = z.infer<typeof BlogCategorySchema>

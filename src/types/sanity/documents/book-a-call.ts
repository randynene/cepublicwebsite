import { z } from 'zod'

import { PortableTextSchema, SanityBaseDocumentSchema, SanitySlugSchema } from '../shared'

export const BookACallSchema = SanityBaseDocumentSchema.extend({
  _type: z.literal('bookACall'),
  firstName: z.string(),
  lastName: z.string(),
  slug: SanitySlugSchema,
  calendlyEmbed: PortableTextSchema,
  metaTitle: z.string(),
  metaDescription: z.string(),
})
export type BookACall = z.infer<typeof BookACallSchema>

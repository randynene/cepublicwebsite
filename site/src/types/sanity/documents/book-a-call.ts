import { z } from 'zod'

import { PortableTextSchema } from '../shared'

export const BookACallSchema = z.object({
  _id: z.string(),
  _type: z.literal('bookACall'),
  firstName: z.string(),
  lastName: z.string(),
  slug: z.string(),
  calendlyEmbed: PortableTextSchema,
  metaTitle: z.string(),
  metaDescription: z.string(),
})
export type BookACall = z.infer<typeof BookACallSchema>

export const BookACallMetaSchema = z.object({
  _id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  slug: z.string(),
  metaTitle: z.string(),
  metaDescription: z.string(),
})
export type BookACallMeta = z.infer<typeof BookACallMetaSchema>

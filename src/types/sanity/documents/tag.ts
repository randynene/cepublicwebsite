import { z } from 'zod'

import { SanityBaseDocumentSchema, SanitySlugSchema } from '../shared'

export const TagSchema = SanityBaseDocumentSchema.extend({
  _type: z.literal('tag'),
  name: z.string(),
  slug: SanitySlugSchema,
  category: z.enum(['blogs', 'alternatives', 'tools', 'videoLibrary', 'downloads', 'eventsWebinars']),
  singularName: z.string().optional(),
})
export type Tag = z.infer<typeof TagSchema>

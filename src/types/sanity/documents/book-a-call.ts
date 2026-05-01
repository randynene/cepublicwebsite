import { z } from 'zod'

import {
  MetaSourceFieldsSchema,
  PortableTextSchema,
  SanityBaseDocumentSchema,
  SanitySlugSchema,
  SourceTrackingFieldsCarryoverSchema,
} from '../shared'

// Pre-CONTENT-1D docs have source: undefined despite initialValue. See Finding F18.

export const BookACallSchema = SanityBaseDocumentSchema.extend({
  _type: z.literal('bookACall'),
  firstName: z.string(),
  lastName: z.string(),
  slug: SanitySlugSchema,
  calendlyEmbed: PortableTextSchema,
  metaTitle: z.string(),
  metaDescription: z.string(),
})
  .merge(MetaSourceFieldsSchema)
  .merge(SourceTrackingFieldsCarryoverSchema)
export type BookACall = z.infer<typeof BookACallSchema>

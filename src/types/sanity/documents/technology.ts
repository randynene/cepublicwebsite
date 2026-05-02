import { z } from 'zod'

import {
  FaqItemSchema,
  FoldSchema,
  LocaleSchema,
  MetaFieldsSchema,
  MetaSourceFieldsSchema,
  SanityBaseDocumentSchema,
  SanityImageSchema,
  SanitySlugSchema,
  SourceTrackingFieldsSchema,
} from '../shared'

// Pre-CONTENT-1D docs have source: undefined despite initialValue. See Finding F18.

export const TechnologySchema = SanityBaseDocumentSchema.extend({
  _type: z.literal('technology'),
  technologyName: z.string(),
  slug: SanitySlugSchema,
  order: z.number().optional(),
  shortLabel: z.string().optional(),
  techLogo: SanityImageSchema.optional(),
  listItemOnly: z.boolean(),
  thumbnail: SanityImageSchema.optional(),
  folds: z.array(FoldSchema).min(1),
  faqs: z.array(FaqItemSchema).max(6).optional(),
  locale: LocaleSchema,
})
  .merge(MetaFieldsSchema)
  .merge(MetaSourceFieldsSchema)
  .merge(SourceTrackingFieldsSchema)
export type Technology = z.infer<typeof TechnologySchema>

import { z } from 'zod'

import {
  FoldSchema,
  LocaleSchema,
  MetaFieldsSchema,
  SanityBaseDocumentSchema,
  SanityImageSchema,
  SanitySlugSchema,
  SourceTrackingFieldsSchema,
} from '../shared'

export function landingPageSchema<T extends string>(typeName: T) {
  return SanityBaseDocumentSchema.extend({
    _type: z.literal(typeName),
    name: z.string(),
    slug: SanitySlugSchema,
    order: z.number().optional(),
    shortLabel: z.string().optional(),
    thumbnail: SanityImageSchema.optional(),
    folds: z.array(FoldSchema).min(1),
    locale: LocaleSchema,
  })
    .merge(MetaFieldsSchema)
    .merge(SourceTrackingFieldsSchema)
}

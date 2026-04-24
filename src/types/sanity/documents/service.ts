import { z } from 'zod'

import {
  FoldSchema,
  LocaleSchema,
  MetaFieldsSchema,
  SanityBaseDocumentSchema,
  SanityImageSchema,
  SanityRefSchema,
  SanitySlugSchema,
  SourceTrackingFieldsSchema,
} from '../shared'

export const ServiceSchema = SanityBaseDocumentSchema.extend({
  _type: z.literal('service'),
  name: z.string(),
  slug: SanitySlugSchema,
  order: z.number().optional(),
  type: z.enum(['staffAugmentation', 'productBuilds', 'consultingServices']),
  prefix: z.enum(['hire', 'build', 'expert', 'endToEnd']).optional(),
  aiOffering: z.boolean(),
  location: z.boolean(),
  shortLabel: z.string().optional(),
  thumbnail: SanityImageSchema.optional(),
  associatedTechnologies: z.array(SanityRefSchema).optional(),
  folds: z.array(FoldSchema).min(1),
  locale: LocaleSchema,
})
  .merge(MetaFieldsSchema)
  .merge(SourceTrackingFieldsSchema)
export type Service = z.infer<typeof ServiceSchema>

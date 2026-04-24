import { z } from 'zod'

import {
  LocaleSchema,
  MetaFieldsNoOgSchema,
  PortableTextSchema,
  SanityBaseDocumentSchema,
  SanityImageSchema,
  SanitySlugSchema,
} from '../shared'

export const ReviewSchema = SanityBaseDocumentSchema.extend({
  _type: z.literal('review'),
  nameClient: z.string(),
  slug: SanitySlugSchema,
  position: z.string().optional(),
  order: z.number().optional(),
  testimonyShort: z.string().optional(),
  testimonyParagraph: PortableTextSchema.optional(),
  testimonyFullPage: PortableTextSchema.optional(),
  snippetForMeta: z.string().optional(),
  memberImage: SanityImageSchema.optional(),
  companyLogo: SanityImageSchema.optional(),
  thumbnailImage: SanityImageSchema.optional(),
  additionalInfo: PortableTextSchema.optional(),
  locale: LocaleSchema,
}).merge(MetaFieldsNoOgSchema)
export type Review = z.infer<typeof ReviewSchema>

import { z } from 'zod'

import {
  FaqItemSchema,
  LocaleSchema,
  MetaFieldsSchema,
  PortableTextSchema,
  SanityBaseDocumentSchema,
  SanityImageSchema,
  SanityRefSchema,
  SanitySlugSchema,
  SourceTrackingFieldsSchema,
} from '../shared'

export const CompareBlogSchema = SanityBaseDocumentSchema.extend({
  _type: z.literal('compareBlog'),
  title: z.string(),
  slug: SanitySlugSchema,
  competitor: z.string().optional(),
  tags: z.array(SanityRefSchema).min(1),
  author: SanityRefSchema,
  date: z.string(),
  featured: z.boolean(),
  thumbnailImage: SanityImageSchema,
  tldrSection: PortableTextSchema.optional(),
  content: PortableTextSchema,
  resourceDescription: z.string().optional(),
  faqs: z.array(FaqItemSchema).max(6).optional(),
  locale: LocaleSchema,
})
  .merge(MetaFieldsSchema)
  .merge(SourceTrackingFieldsSchema)
export type CompareBlog = z.infer<typeof CompareBlogSchema>

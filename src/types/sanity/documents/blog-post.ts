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

export const BlogPostSchema = SanityBaseDocumentSchema.extend({
  _type: z.literal('blogPost'),
  title: z.string(),
  slug: SanitySlugSchema,
  category: SanityRefSchema,
  tags: z.array(SanityRefSchema).min(1),
  author: SanityRefSchema,
  date: z.string(),
  thumbnailImage: SanityImageSchema,
  tldrSection: PortableTextSchema.optional(),
  content: PortableTextSchema,
  resourceDescription: z.string().optional(),
  featured: z.boolean(),
  faqs: z.array(FaqItemSchema).max(6).optional(),
  locale: LocaleSchema,
})
  .merge(MetaFieldsSchema)
  .merge(SourceTrackingFieldsSchema)
export type BlogPost = z.infer<typeof BlogPostSchema>

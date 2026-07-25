import { z } from 'zod'

import {
  FaqItemSchema,
  LocaleFieldSchema,
  PortableTextSchema,
  SanityImageSchema,
} from '../shared'

export const CompareBlogAuthorSchema = z
  .object({
    _id: z.string(),
    name: z.string(),
    slug: z.string().nullable().optional(),
    position: z.string().nullable().optional(),
    teamMemberImage: SanityImageSchema.nullable().optional(),
  })
  .nullable()
  .optional()
export type CompareBlogAuthor = z.infer<typeof CompareBlogAuthorSchema>

export const CompareBlogTagSchema = z.object({
  _id: z.string(),
  name: z.string(),
})
export type CompareBlogTag = z.infer<typeof CompareBlogTagSchema>

export const CompareBlogSchema = z.object({
  _id: z.string(),
  _type: z.literal('compareBlog'),
  title: z.string(),
  slug: z.string(),
  competitor: z.string().nullable().optional(),
  tags: z.array(CompareBlogTagSchema).nullable().optional(),
  author: CompareBlogAuthorSchema,
  date: z.string().nullable().optional(),
  thumbnailImage: SanityImageSchema.nullable().optional(),
  tldrSection: PortableTextSchema.nullable().optional(),
  content: PortableTextSchema,
  faqs: z.array(FaqItemSchema).nullable().optional(),
  resourceDescription: z.string().nullable().optional(),
  featured: z.boolean().nullable().optional(),
  locale: LocaleFieldSchema.nullable().optional(),
  metaTitle: z.string(),
  metaDescription: z.string(),
})
export type CompareBlog = z.infer<typeof CompareBlogSchema>

export const CompareBlogMetaSchema = z.object({
  _id: z.string(),
  title: z.string(),
  slug: z.string(),
  metaTitle: z.string(),
  metaDescription: z.string(),
  thumbnailImage: SanityImageSchema.nullable().optional(),
})
export type CompareBlogMeta = z.infer<typeof CompareBlogMetaSchema>

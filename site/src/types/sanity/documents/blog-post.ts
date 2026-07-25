import { z } from 'zod'

import {
  FaqItemSchema,
  LocaleFieldSchema,
  PortableTextSchema,
  SanityImageSchema,
} from '../shared'

// Author projection — dereferenced from blogPost.author->{ ... }
// Nullable + optional at the read-model layer per TB18 — 47% of migrated
// docs have author absent at HALT 1 authoring time. Studio editorial schema
// stays required (separate concern).
export const BlogPostAuthorSchema = z
  .object({
    _id: z.string(),
    name: z.string(),
    slug: z.string().nullable().optional(),
    position: z.string().nullable().optional(),
    teamMemberImage: SanityImageSchema.nullable().optional(),
    aboutContent: PortableTextSchema.nullable().optional(),
    areasOfExpertise: PortableTextSchema.nullable().optional(),
    linkedinLink: z.string().nullable().optional(),
  })
  .nullable()
  .optional()
export type BlogPostAuthor = z.infer<typeof BlogPostAuthorSchema>

// Category projection — dereferenced from blogPost.category->{ ... }
// _id projection MANDATORY per TB20 (related-posts joins on category._id, not _ref).
export const BlogPostCategorySchema = z.object({
  _id: z.string(),
  name: z.string(),
  slug: z.string(),
})
export type BlogPostCategory = z.infer<typeof BlogPostCategorySchema>

// Tag projection — dereferenced from blogPost.tags[]->{ ... }
export const BlogPostTagSchema = z.object({
  _id: z.string(),
  name: z.string(),
  slug: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
})
export type BlogPostTag = z.infer<typeof BlogPostTagSchema>

// Full blogPost — matches the §3.1 page-fetch GROQ projection exactly.
//
// Nullability adjustments versus the editorial Studio schema (TB18 read-model):
//   - author: nullable + optional (47% of docs lack it pre-launch backfill).
//   - date: nullable (18/74 docs have null date — programmatically generated batch).
//   - thumbnailImage: nullable (1 doc has explicit null literal — CONTENT-1D-CLEANUP escape).
//   - openGraphImage: optional (schema says optional; matches reality).
//   - tldrSection / faqs / resourceDescription: optional.
export const BlogPostSchema = z.object({
  _id: z.string(),
  _type: z.literal('blogPost'),
  title: z.string(),
  slug: z.string(),
  date: z.string().nullable().optional(),
  thumbnailImage: SanityImageSchema.nullable().optional(),
  openGraphImage: SanityImageSchema.nullable().optional(),
  tldrSection: PortableTextSchema.nullable().optional(),
  content: PortableTextSchema,
  faqs: z.array(FaqItemSchema).nullable().optional(),
  resourceDescription: z.string().nullable().optional(),
  featured: z.boolean().nullable().optional(),
  locale: LocaleFieldSchema.nullable().optional(),
  metaTitle: z.string(),
  metaDescription: z.string(),
  category: BlogPostCategorySchema,
  tags: z.array(BlogPostTagSchema).nullable().optional(),
  author: BlogPostAuthorSchema,
})
export type BlogPost = z.infer<typeof BlogPostSchema>

// Related-post projection — narrow shape used by the §3.3 side-query.
export const RelatedBlogPostSchema = z.object({
  _id: z.string(),
  title: z.string(),
  slug: z.string(),
  date: z.string().nullable().optional(),
  thumbnailImage: SanityImageSchema.nullable().optional(),
  resourceDescription: z.string().nullable().optional(),
  category: BlogPostCategorySchema,
})
export type RelatedBlogPost = z.infer<typeof RelatedBlogPostSchema>

// Trimmed meta projection — feeds generateMetadata only.
export const BlogPostMetaSchema = z.object({
  _id: z.string(),
  title: z.string(),
  slug: z.string(),
  metaTitle: z.string(),
  metaDescription: z.string(),
  openGraphImage: SanityImageSchema.nullable().optional(),
  thumbnailImage: SanityImageSchema.nullable().optional(),
  category: BlogPostCategorySchema,
})
export type BlogPostMeta = z.infer<typeof BlogPostMetaSchema>

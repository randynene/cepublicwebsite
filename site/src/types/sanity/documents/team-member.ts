import { z } from 'zod'

import {
  LocaleFieldSchema,
  PortableTextSchema,
  SanityImageSchema,
} from '../shared'

// Full teamMember read-model — matches TEAM_MEMBER page-fetch GROQ projection.
//
// Nullability vs editorial schema: linkedinLink / bookACallLink can hold
// null literals from the CONTENT-1 migrator (2/28 linkedin null; 23/28
// bookACall absent or null). Read-model tolerates migrated data state.

export const TeamMemberSchema = z.object({
  _id: z.string(),
  _type: z.literal('teamMember'),
  name: z.string(),
  slug: z.string(),
  position: z.string().nullable().optional(),
  teamMemberImage: SanityImageSchema,
  aboutContent: PortableTextSchema.nullable().optional(),
  timeAtCloudEmployee: z.string().nullable().optional(),
  areasOfExpertise: PortableTextSchema.nullable().optional(),
  linkedinLink: z.string().url().nullable().optional(),
  bookACallLink: z.string().url().nullable().optional(),
  locale: LocaleFieldSchema.nullable().optional(),
  metaTitle: z.string(),
  metaDescription: z.string(),
})
export type TeamMember = z.infer<typeof TeamMemberSchema>

export const TeamMemberMetaSchema = z.object({
  _id: z.string(),
  name: z.string(),
  slug: z.string(),
  metaTitle: z.string(),
  metaDescription: z.string(),
  teamMemberImage: SanityImageSchema,
})
export type TeamMemberMeta = z.infer<typeof TeamMemberMetaSchema>

export const AuthorBlogPostSchema = z.object({
  _id: z.string(),
  title: z.string(),
  slug: z.string(),
  date: z.string().nullable().optional(),
  thumbnailImage: SanityImageSchema.nullable().optional(),
  resourceDescription: z.string().nullable().optional(),
  category: z.object({
    _id: z.string(),
    name: z.string(),
    slug: z.string(),
  }),
})
export type AuthorBlogPost = z.infer<typeof AuthorBlogPostSchema>

import { z } from 'zod'

import {
  LocaleFieldSchema,
  PortableTextSchema,
  SanityImageSchema,
} from '../shared'

export const ReviewSchema = z.object({
  _id: z.string(),
  _type: z.literal('review'),
  nameClient: z.string(),
  slug: z.string(),
  position: z.string().nullable().optional(),
  order: z.number().nullable().optional(),
  testimonyShort: z.string().nullable().optional(),
  testimonyParagraph: PortableTextSchema.nullable().optional(),
  testimonyFullPage: PortableTextSchema.nullable().optional(),
  snippetForMeta: z.string().nullable().optional(),
  memberImage: SanityImageSchema.nullable().optional(),
  companyLogo: SanityImageSchema.nullable().optional(),
  thumbnailImage: SanityImageSchema.nullable().optional(),
  additionalInfo: PortableTextSchema.nullable().optional(),
  locale: LocaleFieldSchema.nullable().optional(),
  metaTitle: z.string(),
  metaDescription: z.string(),
})
export type Review = z.infer<typeof ReviewSchema>

export const ReviewMetaSchema = z.object({
  _id: z.string(),
  nameClient: z.string(),
  slug: z.string(),
  metaTitle: z.string(),
  metaDescription: z.string(),
  thumbnailImage: SanityImageSchema.nullable().optional(),
  memberImage: SanityImageSchema.nullable().optional(),
  companyLogo: SanityImageSchema.nullable().optional(),
})
export type ReviewMeta = z.infer<typeof ReviewMetaSchema>

export const RelatedReviewSchema = z.object({
  _id: z.string(),
  nameClient: z.string(),
  slug: z.string(),
  position: z.string().nullable().optional(),
  testimonyShort: z.string().nullable().optional(),
  memberImage: SanityImageSchema.nullable().optional(),
  companyLogo: SanityImageSchema.nullable().optional(),
})
export type RelatedReview = z.infer<typeof RelatedReviewSchema>

import { z } from 'zod'

import {
  FaqItemSchema,
  LocaleFieldSchema,
  PortableTextSchema,
  SanityImageSchema,
} from '../shared'

const DownloadTagSchema = z.object({
  name: z.string(),
})
export type DownloadTag = z.infer<typeof DownloadTagSchema>

const HowToUseItSchema = z
  .object({
    videoThumbnail: SanityImageSchema.nullable().optional(),
    videoLink: z.string().nullable().optional(),
    title: z.string().nullable().optional(),
    description: PortableTextSchema.nullable().optional(),
  })
  .nullable()
  .optional()

const TheImpactSchema = z
  .object({
    image: SanityImageSchema.nullable().optional(),
    title: z.string().nullable().optional(),
    description: PortableTextSchema.nullable().optional(),
  })
  .nullable()
  .optional()

const GetItNowSchema = z
  .object({
    title: z.string().nullable().optional(),
    description: PortableTextSchema.nullable().optional(),
  })
  .nullable()
  .optional()

export const DownloadSchema = z.object({
  _id: z.string(),
  _type: z.literal('download'),
  name: z.string(),
  slug: z.string(),
  title: z.string().nullable().optional(),
  featured: z.boolean().nullable().optional(),
  comingSoon: z.boolean().nullable().optional(),
  tags: z.array(DownloadTagSchema).nullable().optional(),
  mainDescription: PortableTextSchema.nullable().optional(),
  headerFooterImage: SanityImageSchema.nullable().optional(),
  button1Text: z.string().nullable().optional(),
  button1Link: z.string().nullable().optional(),
  button2Text: z.string().nullable().optional(),
  button2Link: z.string().nullable().optional(),
  youllGet: z.array(z.string()).nullable().optional(),
  howToUseIt: HowToUseItSchema,
  theImpact: TheImpactSchema,
  faqs: z.array(FaqItemSchema).nullable().optional(),
  getItNow: GetItNowSchema,
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string(),
  metaThumbnail: SanityImageSchema.nullable().optional(),
  hubspotFormId: z.string().nullable().optional(),
  locale: LocaleFieldSchema.nullable().optional(),
})
export type Download = z.infer<typeof DownloadSchema>

export const DownloadMetaSchema = z.object({
  _id: z.string(),
  name: z.string(),
  slug: z.string(),
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string(),
  metaThumbnail: SanityImageSchema.nullable().optional(),
  headerFooterImage: SanityImageSchema.nullable().optional(),
})
export type DownloadMeta = z.infer<typeof DownloadMetaSchema>

import { z } from 'zod'

import {
  FaqItemSchema,
  LocaleSchema,
  PortableTextSchema,
  SanityBaseDocumentSchema,
  SanityImageSchema,
  SanityRefSchema,
  SanitySlugSchema,
} from '../shared'

export const DownloadSchema = SanityBaseDocumentSchema.extend({
  _type: z.literal('download'),
  name: z.string(),
  slug: SanitySlugSchema,
  title: z.string().optional(),
  featured: z.boolean(),
  comingSoon: z.boolean(),
  tags: z.array(SanityRefSchema).optional(),
  mainDescription: PortableTextSchema.optional(),
  headerFooterImage: SanityImageSchema.optional(),
  button1Text: z.string().optional(),
  button1Link: z.string().url().optional(),
  button2Text: z.string().optional(),
  button2Link: z.string().url().optional(),
  youllGet: z.array(z.string()).max(5).optional(),
  howToUseIt: z
    .object({
      videoThumbnail: SanityImageSchema.optional(),
      videoLink: z.string().url().optional(),
      title: z.string().optional(),
      description: PortableTextSchema.optional(),
    })
    .optional(),
  theImpact: z
    .object({
      image: SanityImageSchema.optional(),
      title: z.string().optional(),
      description: PortableTextSchema.optional(),
    })
    .optional(),
  faqs: z.array(FaqItemSchema).max(6).optional(),
  getItNow: z
    .object({
      title: z.string().optional(),
      description: PortableTextSchema.optional(),
    })
    .optional(),
  metaTitle: z.string(),
  metaDescription: z.string(),
  metaThumbnail: SanityImageSchema.optional(),
  hubspotFormId: z.string().optional(),
  locale: LocaleSchema,
})
export type Download = z.infer<typeof DownloadSchema>

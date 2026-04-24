import { z } from 'zod'

import {
  LocaleSchema,
  MetaFieldsSchema,
  PortableTextSchema,
  QuoteBlockSchema,
  SanityBaseDocumentSchema,
  SanityImageSchema,
  SanitySlugSchema,
} from '../shared'

const StorySectionSchema = z.object({
  content: PortableTextSchema.optional(),
  quote: QuoteBlockSchema.optional(),
})

export const CustomerStorySchema = SanityBaseDocumentSchema.extend({
  _type: z.literal('customerStory'),
  customerStoryTitle: z.string(),
  companyName: z.string(),
  slug: SanitySlugSchema,
  order: z.number().optional(),
  featureInHomeHeader: z.boolean(),
  featureInFeaturedCustomers: z.boolean(),
  featuredOnCustomerStoriesPage: z.boolean(),
  companyLogo: SanityImageSchema,
  companyProductImage: SanityImageSchema.optional(),
  companyPeopleImage: SanityImageSchema.optional(),
  thumbnail: SanityImageSchema.optional(),
  videoUrl: z.string().url().optional(),
  videoIntroContent: PortableTextSchema.optional(),
  tldrContent: PortableTextSchema.optional(),
  hiringNeedsTable: PortableTextSchema.optional(),
  theCustomerContent: PortableTextSchema.optional(),
  problem: StorySectionSchema.optional(),
  solution: StorySectionSchema.optional(),
  impact: StorySectionSchema.optional(),
  ctaContent: PortableTextSchema.optional(),
  reviewSnippetForMeta: z.string().optional(),
  locale: LocaleSchema,
}).merge(MetaFieldsSchema)
export type CustomerStory = z.infer<typeof CustomerStorySchema>

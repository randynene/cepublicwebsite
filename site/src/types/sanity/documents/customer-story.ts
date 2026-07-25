import { z } from 'zod'

import {
  LocaleFieldSchema,
  PortableTextSchema,
  SanityImageSchema,
} from '../shared'

// TEMPLATE-CUSTOMER-STORY read-model. Zod'd to the LIVE production data shape.
//
// Field fill is SPARSE (Step 0 probe): every rich section is nullable/optional
// so a doc with an empty section parses cleanly and the template omits it.
// EVERY optional field tolerates Sanity `null` (via .nullable().optional()) so
// generateMetadata / fetch parse never rejects a null value — this is the exact
// bug that blocks the privacy-policy build (Tech Debt #46). Do NOT reintroduce.

// Inline quote block — matches studio/schemas/objects/quoteBlock. personImage
// and personTitle are optional; travel-tech-client-style anonymised docs may
// omit person media without crashing.
const QuoteBlockSchema = z.object({
  _type: z.literal('quoteBlock').optional(),
  paragraph: z.string(),
  personImage: SanityImageSchema.nullable().optional(),
  personName: z.string(),
  personTitle: z.string().nullable().optional(),
})
export type QuoteBlock = z.infer<typeof QuoteBlockSchema>

// problem / solution / impact — each an object with optional PT + optional quote.
const StorySectionSchema = z.object({
  content: PortableTextSchema.nullable().optional(),
  quote: QuoteBlockSchema.nullable().optional(),
})
export type StorySection = z.infer<typeof StorySectionSchema>

export const CustomerStorySchema = z.object({
  _id: z.string(),
  _type: z.literal('customerStory'),
  customerStoryTitle: z.string(),
  companyName: z.string(),
  slug: z.string(),
  // Images all optional — companyLogo is 16/17 (travel-tech-client is null per
  // Tech Debt #16); the rest are sparse. #16 handled with an initial fallback
  // in the template, never a fabricated asset.
  companyLogo: SanityImageSchema.nullable().optional(),
  companyProductImage: SanityImageSchema.nullable().optional(),
  companyPeopleImage: SanityImageSchema.nullable().optional(),
  thumbnail: SanityImageSchema.nullable().optional(),
  // Background Vimeo URL (autoplay/muted/loop), not a poster embed. 6/17.
  videoUrl: z.string().nullable().optional(),
  videoIntroContent: PortableTextSchema.nullable().optional(),
  tldrContent: PortableTextSchema.nullable().optional(),
  hiringNeedsTable: PortableTextSchema.nullable().optional(),
  theCustomerContent: PortableTextSchema.nullable().optional(),
  problem: StorySectionSchema.nullable().optional(),
  solution: StorySectionSchema.nullable().optional(),
  impact: StorySectionSchema.nullable().optional(),
  ctaContent: PortableTextSchema.nullable().optional(),
  reviewSnippetForMeta: z.string().nullable().optional(),
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  openGraphImage: SanityImageSchema.nullable().optional(),
  locale: LocaleFieldSchema.nullable().optional(),
})
export type CustomerStory = z.infer<typeof CustomerStorySchema>

// Lighter Meta-only schema for generateMetadata — same null tolerance.
export const CustomerStoryMetaSchema = z.object({
  _id: z.string(),
  customerStoryTitle: z.string(),
  companyName: z.string(),
  slug: z.string(),
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  reviewSnippetForMeta: z.string().nullable().optional(),
  openGraphImage: SanityImageSchema.nullable().optional(),
  thumbnail: SanityImageSchema.nullable().optional(),
  companyProductImage: SanityImageSchema.nullable().optional(),
})
export type CustomerStoryMeta = z.infer<typeof CustomerStoryMetaSchema>

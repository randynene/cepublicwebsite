// Shared Zod primitives for Sanity document shapes.
// Portable Text uses z.unknown() per brief §3.2 — will tighten in TEMPLATE-*.
import { z } from 'zod'

export const SanityImageSchema = z.object({
  asset: z.object({ _ref: z.string() }),
  alt: z.string().optional(),
  hotspot: z
    .object({
      x: z.number(),
      y: z.number(),
      height: z.number(),
      width: z.number(),
    })
    .optional(),
  crop: z
    .object({
      top: z.number(),
      bottom: z.number(),
      left: z.number(),
      right: z.number(),
    })
    .optional(),
})
export type SanityImage = z.infer<typeof SanityImageSchema>

export const SanitySlugSchema = z.object({
  current: z.string(),
  _type: z.literal('slug').optional(),
})
export type SanitySlug = z.infer<typeof SanitySlugSchema>

export const SanityRefSchema = z.object({
  _ref: z.string(),
  _type: z.literal('reference'),
})
export type SanityRef = z.infer<typeof SanityRefSchema>

export const PortableTextSchema = z.array(z.unknown())
export type PortableText = z.infer<typeof PortableTextSchema>

export const LocaleSchema = z.enum(['default', 'uk'])
export type Locale = z.infer<typeof LocaleSchema>

export const SourceSchema = z.enum(['manual', 'beem', 'claude_code', 'imported'])
export type Source = z.infer<typeof SourceSchema>

export const FaqItemSchema = z.object({
  _type: z.literal('faqItem').optional(),
  question: z.string(),
  answer: PortableTextSchema,
})
export type FaqItem = z.infer<typeof FaqItemSchema>

export const QuoteBlockSchema = z.object({
  _type: z.literal('quoteBlock').optional(),
  paragraph: z.string(),
  personImage: SanityImageSchema.optional(),
  personName: z.string(),
  personTitle: z.string().optional(),
})
export type QuoteBlock = z.infer<typeof QuoteBlockSchema>

export const FoldTypeSchema = z.enum([
  'headerIntro',
  'featureBullets',
  'itemList',
  'paragraphSection',
  'headerOnly',
])
export type FoldType = z.infer<typeof FoldTypeSchema>

export const FoldItemSchema = z.object({
  _type: z.literal('foldItem').optional(),
  header: z.string(),
  description: z.string(),
})
export type FoldItem = z.infer<typeof FoldItemSchema>

export const FoldSchema = z.object({
  _type: z.literal('fold').optional(),
  type: FoldTypeSchema,
  label: z.string().optional(),
  header: z.string().optional(),
  paragraph: PortableTextSchema.optional(),
  bullets: z.array(z.string()).max(6).optional(),
  items: z.array(FoldItemSchema).max(6).optional(),
  featuredImage: SanityImageSchema.optional(),
})
export type Fold = z.infer<typeof FoldSchema>

// Section variants — mirror studio/schemas/objects/section.ts.
// Each variant carries a discriminator `_type`.

const BaseSectionSchema = {
  _key: z.string().optional(),
}

export const RichTextSectionSchema = z.object({
  ...BaseSectionSchema,
  _type: z.literal('richTextSection'),
  heading: z.string().optional(),
  content: PortableTextSchema,
})

export const TwoColumnSectionSchema = z.object({
  ...BaseSectionSchema,
  _type: z.literal('twoColumnSection'),
  heading: z.string().optional(),
  leftContent: PortableTextSchema,
  rightContent: PortableTextSchema,
})

export const CtaSectionSchema = z.object({
  ...BaseSectionSchema,
  _type: z.literal('ctaSection'),
  heading: z.string(),
  description: z.string().optional(),
  buttonText: z.string(),
  buttonLink: z.string().url(),
})

export const ImageSectionSchema = z.object({
  ...BaseSectionSchema,
  _type: z.literal('imageSection'),
  image: SanityImageSchema,
  caption: z.string().optional(),
})

export const VideoSectionSchema = z.object({
  ...BaseSectionSchema,
  _type: z.literal('videoSection'),
  videoUrl: z.string().url(),
  caption: z.string().optional(),
})

export const TestimonialSectionSchema = z.object({
  ...BaseSectionSchema,
  _type: z.literal('testimonialSection'),
  review: SanityRefSchema,
})

export const BenefitsGridSchema = z.object({
  ...BaseSectionSchema,
  _type: z.literal('benefitsGrid'),
  heading: z.string().optional(),
  benefits: z.array(SanityRefSchema),
})

export const StaffBenefitsGridSchema = z.object({
  ...BaseSectionSchema,
  _type: z.literal('staffBenefitsGrid'),
  heading: z.string().optional(),
  benefits: z.array(SanityRefSchema),
})

export const GlassdoorGridSchema = z.object({
  ...BaseSectionSchema,
  _type: z.literal('glassdoorGrid'),
  heading: z.string().optional(),
  reviews: z.array(SanityRefSchema),
})

export const CustomerStoriesGridSchema = z.object({
  ...BaseSectionSchema,
  _type: z.literal('customerStoriesGrid'),
  heading: z.string().optional(),
  stories: z.array(SanityRefSchema),
})

export const FaqSectionSchema = z.object({
  ...BaseSectionSchema,
  _type: z.literal('faqSection'),
  heading: z.string().optional(),
  faqs: z.array(FaqItemSchema),
})

export const HubspotFormSectionSchema = z.object({
  ...BaseSectionSchema,
  _type: z.literal('hubspotFormSection'),
  heading: z.string().optional(),
  formId: z.string(),
  portalId: z.string().optional(),
})

export const SectionSchema = z.discriminatedUnion('_type', [
  RichTextSectionSchema,
  TwoColumnSectionSchema,
  CtaSectionSchema,
  ImageSectionSchema,
  VideoSectionSchema,
  TestimonialSectionSchema,
  BenefitsGridSchema,
  StaffBenefitsGridSchema,
  GlassdoorGridSchema,
  CustomerStoriesGridSchema,
  FaqSectionSchema,
  HubspotFormSectionSchema,
])
export type Section = z.infer<typeof SectionSchema>

// Cross-cutting field groups ----------------------------------------------

export const MetaFieldsSchema = z.object({
  metaTitle: z.string(),
  metaDescription: z.string(),
  openGraphImage: SanityImageSchema.optional(),
})

export const MetaFieldsNoOgSchema = z.object({
  metaTitle: z.string(),
  metaDescription: z.string(),
})

export const SourceTrackingFieldsSchema = z.object({
  source: SourceSchema,
  generatedAt: z.string().datetime().optional(),
  needsReview: z.boolean(),
})

// CONTENT-1D §0a — retroactive source-tracking applied to schemas that
// already have published content without these fields. All optional —
// pre-CONTENT-1D docs have these as undefined despite the studio
// `initialValue: 'manual'` (Finding F18: initialValue does NOT
// retroactively populate existing docs).
export const SourceTrackingFieldsCarryoverSchema = z.object({
  source: SourceSchema.optional(),
  generatedAt: z.string().datetime().optional(),
  needsReview: z.boolean().optional(),
})

// CONTENT-1D §0a — split per-field provenance (Finding F21).
// Pre-CONTENT-1D docs have these as undefined.
const MetaSourceObjectSchema = z.object({
  provider: z.string().optional(),
  scrapedAt: z.string().datetime().optional(),
  url: z.string().optional(),
})
export const MetaSourceFieldsSchema = z.object({
  metaTitleSource: MetaSourceObjectSchema.optional(),
  metaDescriptionSource: MetaSourceObjectSchema.optional(),
})

// Base document — every Sanity document has these.
export const SanityBaseDocumentSchema = z.object({
  _id: z.string(),
  _type: z.string(),
  _createdAt: z.string(),
  _updatedAt: z.string(),
  _rev: z.string(),
})

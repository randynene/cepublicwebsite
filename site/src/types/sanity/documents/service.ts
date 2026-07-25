import { z } from 'zod'

import { stegaEnum } from '@/lib/sanity/stega-enum'
import {
  LocaleFieldSchema,
  PortableTextSchema,
  SanityImageSchema,
} from '../shared'

// TEMPLATE-SERVICE read-model. Zod'd to the LIVE production data shape
// (Step 0 probe — do NOT re-probe / do NOT mutate Sanity).
//
// Enums are Zod'd to the EXACT live values (never mutate Sanity to match):
//   type   = staffAugmentation | productBuilds | consultingServices
//   prefix = hire | build | expert | endToEnd
//   fold.type = headerIntro | featureBullets | itemList | paragraphSection
//               | headerOnly
//
// Field fill is SPARSE. EVERY optional field tolerates Sanity `null` (via
// .nullable().optional()) so fetch / generateMetadata parse never rejects a
// null value — this is the exact bug that blocks the privacy-policy build
// (Tech Debt #46). Do NOT reintroduce it.

export const ServiceTypeSchema = stegaEnum([
  'staffAugmentation',
  'productBuilds',
  'consultingServices',
])
export type ServiceType = z.infer<typeof ServiceTypeSchema>

export const ServicePrefixSchema = stegaEnum(['hire', 'build', 'expert', 'endToEnd'])
export type ServicePrefix = z.infer<typeof ServicePrefixSchema>

export const FoldTypeSchema = stegaEnum([
  'headerIntro',
  'featureBullets',
  'itemList',
  'paragraphSection',
  'headerOnly',
])
export type FoldType = z.infer<typeof FoldTypeSchema>

// A single {header, description} entry inside a fold's `items` array. Both
// fields are Rule.required() in the Studio schema, but the read-model stays
// tolerant so a mid-migration partial doc parses rather than crashing build.
const FoldItemSchema = z.object({
  _key: z.string().optional(),
  header: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
})
export type FoldItem = z.infer<typeof FoldItemSchema>

// One fold. `type` is the required discriminator; every content field is
// optional/nullable and rendered only when present (no placeholder cards).
export const FoldSchema = z.object({
  _key: z.string().optional(),
  type: FoldTypeSchema,
  label: z.string().nullable().optional(),
  header: z.string().nullable().optional(),
  paragraph: PortableTextSchema.nullable().optional(),
  bullets: z.array(z.string()).nullable().optional(),
  items: z.array(FoldItemSchema).nullable().optional(),
  featuredImage: SanityImageSchema.nullable().optional(),
})
export type Fold = z.infer<typeof FoldSchema>

// A resolved `associatedTechnologies` reference. Projected in SERVICE_QUERY as
// name/slug/sub/techLogo. 100% filled on service docs (7-10 refs each); the
// source for the hero skill pills and the "technology coverage" cards.
const AssocTechnologySchema = z.object({
  name: z.string().nullable().optional(),
  slug: z.string().nullable().optional(),
  sub: z.string().nullable().optional(),
  techLogo: SanityImageSchema.nullable().optional(),
})
export type AssocTechnology = z.infer<typeof AssocTechnologySchema>

// One FAQ (question + PortableText answer), matching the Studio `faqItem`
// object. Reused by the per-page service/technology override AND by the shared
// FAQ singleton read-model. `answer` is PortableText; the template flattens it
// to plain text for the accordion + FAQPage JSON-LD.
export const FaqItemSchema = z.object({
  _key: z.string().optional(),
  question: z.string().nullable().optional(),
  answer: PortableTextSchema.nullable().optional(),
})
export type FaqItem = z.infer<typeof FaqItemSchema>

export const ServiceSchema = z.object({
  _id: z.string(),
  _type: z.literal('service'),
  name: z.string(),
  slug: z.string(),
  type: ServiceTypeSchema,
  prefix: ServicePrefixSchema.nullable().optional(),
  shortLabel: z.string().nullable().optional(),
  // tagline is 13/23 filled — omit in the template when absent.
  tagline: z.string().nullable().optional(),
  // thumbnail is 0% filled — never rendered, kept for JSON-LD image fallback.
  thumbnail: SanityImageSchema.nullable().optional(),
  associatedTechnologies: z.array(AssocTechnologySchema).nullable().optional(),
  folds: z.array(FoldSchema),
  // Optional per-page FAQ override. Empty on every live doc today -> the shared
  // FAQ singleton renders instead (launch parity). See mapServiceToContent.
  faqs: z.array(FaqItemSchema).nullable().optional(),
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  openGraphImage: SanityImageSchema.nullable().optional(),
  locale: LocaleFieldSchema.nullable().optional(),
})
export type Service = z.infer<typeof ServiceSchema>

// Lighter Meta-only schema for generateMetadata — same null tolerance.
export const ServiceMetaSchema = z.object({
  _id: z.string(),
  name: z.string(),
  slug: z.string(),
  type: ServiceTypeSchema,
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  openGraphImage: SanityImageSchema.nullable().optional(),
  thumbnail: SanityImageSchema.nullable().optional(),
})
export type ServiceMeta = z.infer<typeof ServiceMetaSchema>

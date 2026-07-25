import { z } from 'zod'

import {
  LocaleFieldSchema,
  SanityImageSchema,
} from '../shared'
// Technology reuses the SAME `fold` object as service (Step 0 confirmed
// identical 5 fold types + design). Reuse the fold data model from the service
// read-model rather than redefine it (do not greenfield — brief §Cost mode).
import { FoldSchema, type Fold } from './service'

export type { Fold }

// TEMPLATE-TECHNOLOGY read-model. Zod'd to the LIVE production data shape
// (Step 0 probe — do NOT re-probe / do NOT mutate Sanity).
//
// Step 0 facts:
//   101 docs (all locale `default`); 1 listItemOnly (no page) -> 100 routable.
//   fold.type live values = headerIntro | featureBullets | itemList
//     | paragraphSection | headerOnly (same as service).
//   tagline 6% (omit when absent). techLogo 98% but NOT placed in the desktop
//     export hero -> not rendered (follow the export; documented residual).
//   faqs 0/101 -> section omitted, no FAQPage JSON-LD.
//   featuredImage 0/444 folds.
//
// EVERY optional field tolerates Sanity `null` (via .nullable().optional()) so
// fetch / generateMetadata parse never rejects a null (Tech Debt #46 — do NOT
// reintroduce).

// FAQ item — present in schema (max 6) but 0/101 filled in production. Kept in
// the read-model so a future-populated doc parses; never rendered while empty.
const TechnologyFaqSchema = z.object({
  _key: z.string().optional(),
  question: z.string().nullable().optional(),
  answer: z.unknown().nullable().optional(),
})
export type TechnologyFaq = z.infer<typeof TechnologyFaqSchema>

export const TechnologySchema = z.object({
  _id: z.string(),
  _type: z.literal('technology'),
  technologyName: z.string(),
  slug: z.string(),
  shortLabel: z.string().nullable().optional(),
  // tagline 6/101 filled — omit in the template when absent.
  tagline: z.string().nullable().optional(),
  // techLogo 98% filled but the desktop export hero is text-only — kept for
  // JSON-LD image fallback, not rendered in the hero.
  techLogo: SanityImageSchema.nullable().optional(),
  thumbnail: SanityImageSchema.nullable().optional(),
  listItemOnly: z.boolean().nullable().optional(),
  folds: z.array(FoldSchema),
  faqs: z.array(TechnologyFaqSchema).nullable().optional(),
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  openGraphImage: SanityImageSchema.nullable().optional(),
  locale: LocaleFieldSchema.nullable().optional(),
})
export type Technology = z.infer<typeof TechnologySchema>

// Lighter Meta-only schema for generateMetadata — same null tolerance.
export const TechnologyMetaSchema = z.object({
  _id: z.string(),
  technologyName: z.string(),
  slug: z.string(),
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  openGraphImage: SanityImageSchema.nullable().optional(),
  thumbnail: SanityImageSchema.nullable().optional(),
  techLogo: SanityImageSchema.nullable().optional(),
})
export type TechnologyMeta = z.infer<typeof TechnologyMetaSchema>

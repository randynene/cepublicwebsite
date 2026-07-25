import type { TypedObject } from '@portabletext/types'
import { z } from 'zod'

import { stegaEnum } from '@/lib/sanity/stega-enum'

// Read-model shared Zod types for the site's Sanity fetch boundary.
//
// Architectural note (TEMPLATE-BLOG HALT 1): these types are authored fresh
// inside site/ because the repo-root /src/types/sanity/ schemas live outside
// the Vercel build root. Read-model and write-model are intentionally separate
// per brief TB18 — the Studio editorial schema (write-model) keeps strict
// constraints (author required, etc.) while the runtime read-model tolerates
// the migrated data state (author null in 47% of docs at time of authoring).

export const SanityImageSchema = z
  .object({
    _type: z.literal('image').optional(),
    asset: z.object({ _ref: z.string(), _type: z.literal('reference').optional() }),
    alt: z.string().nullable().optional(),
    hotspot: z
      .object({
        x: z.number(),
        y: z.number(),
        height: z.number().optional(),
        width: z.number().optional(),
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
  .passthrough()
export type SanityImage = z.infer<typeof SanityImageSchema>

// Schema is permissive (matches Sanity's loose block shape) but the inferred
// type is narrowed to PortableText library's TypedObject[] so templates can
// pass it straight into <PortableText value={...} /> without an extra cast.
export const PortableTextSchema = z.array(z.unknown()) as unknown as z.ZodType<
  TypedObject[]
>
export type PortableText = TypedObject[]

export const FaqItemSchema = z.object({
  _key: z.string().optional(),
  _type: z.literal('faqItem').optional(),
  question: z.string(),
  answer: PortableTextSchema,
})
export type FaqItem = z.infer<typeof FaqItemSchema>

export const LocaleFieldSchema = stegaEnum(['default', 'uk'])
export type LocaleField = z.infer<typeof LocaleFieldSchema>

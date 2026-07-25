import 'server-only'

import { z } from 'zod'

import { sanityFetch } from '@/lib/sanity/live'

// MYGRATR-STATIC-1 Step 2 — notFoundPage singleton fetch.
//
// Schema: defineStaticPage shape (studio/schemas/singletons/not-found-page.ts).
// Projection trimmed to what the 404 render needs: title, heroDescription,
// sections[0] ctaSection, metaTitle, metaDescription. Other section variants
// (richTextSection, twoColumnSection, etc.) are out of scope for STATIC-1's
// 404; only ctaSection is rendered.

// Lean Zod boundary parse — matches CONVENTIONS "Zod for all external data
// validation" rule. Permissive on optional fields to avoid hard fails when
// Seb edits the doc in Studio between deploys.

const PortableBlockSchema = z.object({
  _key: z.string().optional(),
  _type: z.string(),
}).passthrough() // PT blocks have many shapes; trust the schema's union

const CtaSectionSchema = z.object({
  _key: z.string(),
  _type: z.literal('ctaSection'),
  heading: z.string(),
  description: z.string().optional(),
  buttonText: z.string(),
  buttonLink: z.string(),
})

export const NotFoundPageSchema = z.object({
  _id: z.string(),
  _type: z.string(),
  title: z.string(),
  eyebrow: z.string().optional(),
  heroDescription: z.array(PortableBlockSchema).optional(),
  // sections[] schema is a union; we only render ctaSection variants in
  // STATIC-1. Other section types pass through schema validation but
  // aren't surfaced by the render. Use a wider passthrough then filter at
  // the page level.
  sections: z.array(z.object({
    _key: z.string(),
    _type: z.string(),
  }).passthrough()).optional(),
  metaTitle: z.string(),
  metaDescription: z.string(),
})

export type NotFoundPage = z.infer<typeof NotFoundPageSchema>
export type NotFoundCtaSection = z.infer<typeof CtaSectionSchema>

const NOT_FOUND_PAGE_QUERY = /* groq */ `
*[_id == "notFoundPage"][0]{
  _id,
  _type,
  title,
  eyebrow,
  heroDescription,
  sections,
  metaTitle,
  metaDescription
}
`

export async function fetchNotFoundPage(): Promise<NotFoundPage | null> {
  const { data } = await sanityFetch({ query: NOT_FOUND_PAGE_QUERY })
  if (data === null || data === undefined) return null
  return NotFoundPageSchema.parse(data)
}

export function findCtaSection(
  page: NotFoundPage,
): NotFoundCtaSection | null {
  const first = page.sections?.find((s) => s._type === 'ctaSection')
  if (!first) return null
  return CtaSectionSchema.parse(first)
}

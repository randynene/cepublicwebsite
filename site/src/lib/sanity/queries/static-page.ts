import 'server-only'

import { z } from 'zod'

import { sanityFetch } from '@/lib/sanity/live'

// The marketing pages with no bespoke design yet. All share the defineStaticPage
// shape: hero (eyebrow, title, description, image) plus an ordered list of
// sections. One query, parameterised by singleton id.

const PortableBlockSchema = z
  .object({ _key: z.string().optional(), _type: z.string() })
  .passthrough()

const ImageSchema = z
  .object({
    asset: z.object({ _ref: z.string().optional() }).passthrough().optional(),
    alt: z.string().nullable().optional(),
  })
  .passthrough()

// Sections are a discriminated union in Sanity, and the set will grow (grids of
// team members, customer stories, FAQs). Parse permissively on _type and let the
// template decide what it can render: a new section type added in Studio should
// not 500 the page, it should simply not render until the template learns it.
const SectionSchema = z
  .object({
    _key: z.string().optional(),
    _type: z.string(),
    heading: z.string().nullable().optional(),
    content: z.array(PortableBlockSchema).nullable().optional(),
    formId: z.string().nullable().optional(),
  })
  .passthrough()

export const StaticPageSchema = z.object({
  _id: z.string(),
  title: z.string(),
  eyebrow: z.string().nullable().optional(),
  heroDescription: z.array(PortableBlockSchema).nullable().optional(),
  heroImage: ImageSchema.nullable().optional(),
  calendlyUrl: z.string().nullable().optional(),
  sections: z.array(SectionSchema).nullable().optional(),
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
})

export type StaticPage = z.infer<typeof StaticPageSchema>
export type StaticSection = z.infer<typeof SectionSchema>

export type StaticPageId =
  | 'aboutUsPage'
  | 'contactPage'
  | 'forDevelopersPage'
  | 'workWithShawneePage'
  | 'ourWorkPage'
  | 'pricingPage'
  | 'referralsPage'
  // The post-conversion pages. Nobody navigates to these, which is exactly why
  // they get forgotten: they are what a HubSpot form or a Calendly booking
  // redirects TO. If they 404 at cutover, every form on the site ends on a broken
  // page and the failure is invisible until a real lead hits it.
  | 'bookACallPage'
  | 'bookACallConfirmedPage'
  | 'bookACallThankYouPage'
  | 'thankYouPage'
  | 'thankYouCultureMatchPage'
  | 'thankYouForYourMessagePage'
  | 'thankYouNowBookACallPage'

const STATIC_PAGE_QUERY = /* groq */ `
*[_id == $id][0]{
  _id,
  title,
  eyebrow,
  heroDescription,
  heroImage,
  calendlyUrl,
  sections,
  metaTitle,
  metaDescription
}
`

export async function fetchStaticPage(id: StaticPageId): Promise<StaticPage | null> {
  const { data } = await sanityFetch({ query: STATIC_PAGE_QUERY, params: { id } })
  if (data === null || data === undefined) return null
  return StaticPageSchema.parse(data)
}

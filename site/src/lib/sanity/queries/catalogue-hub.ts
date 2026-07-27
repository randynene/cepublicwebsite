import 'server-only'

import { z } from 'zod'

import { sanityFetch } from '@/lib/sanity/live'
import { NOT_RETIRED } from '@/lib/sanity/queries/_filters'

// MYGRATR Phase 2B — data layer for the /services and /technology HUB pages.
//
// The hubs render the approved D3 design (services-hub / technology-hub
// templates) fed entirely by Sanity, so every card links to a real detail page
// (unknown slugs 404 since Phase 2A). Each query is a single round-trip that
// returns the hub singleton (hero + meta + FAQs) alongside the full child list.
//
// Services grouping is data-driven off fields that already exist on the service
// doc: `type` (staffAugmentation | productBuilds | consultingServices),
// `aiOffering`, and `location`. Featured cards come from the Studio-editable
// `featuredItems` refs, with a fixed fallback so the page works before Seb curates
// them. See mapServicesHubData in lib/catalogue/hub-content.ts.

// ────────────────────────────────────────────────────────────────────────
// Shared shapes
// ────────────────────────────────────────────────────────────────────────

const FaqItemSchema = z.object({
  _key: z.string().optional(),
  question: z.string().nullable().optional(),
  answer: z.array(z.unknown()).nullable().optional(),
})

const HubMetaSchema = z
  .object({
    title: z.string().nullable().optional(),
    eyebrow: z.string().nullable().optional(),
    heroDescription: z.array(z.unknown()).nullable().optional(),
    introContent: z.array(z.unknown()).nullable().optional(),
    faqs: z.array(FaqItemSchema).nullable().optional(),
    metaTitle: z.string().nullable().optional(),
    metaDescription: z.string().nullable().optional(),
  })
  .nullable()

// ────────────────────────────────────────────────────────────────────────
// Services hub
// ────────────────────────────────────────────────────────────────────────

const ServiceHubCardSchema = z.object({
  name: z.string(),
  slug: z.string(),
  type: z.string().nullable().optional(),
  ai: z.boolean().nullable().optional(),
  location: z.boolean().nullable().optional(),
  order: z.number().nullable().optional(),
  shortLabel: z.string().nullable().optional(),
  tagline: z.string().nullable().optional(),
})

// techLogo is the real brand mark, migrated from Webflow - 99 of the 101
// technology docs carry one. `extension` drives whether it can go through the
// Sanity image pipeline: SVG is served as-is (the CDN does not transform it),
// raster gets resized down, since a couple of the PNGs are 300kB+ at source.
const TechLogoSchema = z
  .object({
    url: z.string(),
    extension: z.string().nullable().optional(),
  })
  .nullable()
  .optional()

const TechChipCardSchema = z.object({
  name: z.string(),
  slug: z.string(),
  shortLabel: z.string().nullable().optional(),
  tagline: z.string().nullable().optional(),
  logo: TechLogoSchema,
})

export const ServicesHubDataSchema = z.object({
  hub: HubMetaSchema.and(
    z.object({ featuredSlugs: z.array(z.string().nullable()).nullable().optional() }).partial(),
  ),
  services: z.array(ServiceHubCardSchema),
  techChips: z.array(TechChipCardSchema),
})

export type ServiceHubCard = z.infer<typeof ServiceHubCardSchema>
export type TechChipCard = z.infer<typeof TechChipCardSchema>
export type ServicesHubData = z.infer<typeof ServicesHubDataSchema>

export const SERVICES_HUB_DATA_QUERY = /* groq */ `
{
  "hub": *[_type == "servicesHub"][0]{
    title,
    eyebrow,
    heroDescription,
    introContent,
    faqs[]{ _key, question, answer },
    metaTitle,
    metaDescription,
    "featuredSlugs": featuredItems[]->slug.current
  },
  "services": *[_type == "service" && defined(slug.current) && ${NOT_RETIRED}]{
    name,
    "slug": slug.current,
    type,
    "ai": aiOffering,
    "location": location,
    order,
    shortLabel,
    tagline
  } | order(order asc, name asc),
  "techChips": *[_type == "technology" && defined(slug.current) && listItemOnly != true && ${NOT_RETIRED}]{
    "name": technologyName,
    "slug": slug.current,
    shortLabel,
    tagline,
    order,
    "logo": techLogo.asset->{ url, extension }
  } | order(order asc, technologyName asc)[0...10]
}
`

export async function fetchServicesHubData(): Promise<ServicesHubData> {
  const { data } = await sanityFetch({ query: SERVICES_HUB_DATA_QUERY })
  return ServicesHubDataSchema.parse(data)
}

// ────────────────────────────────────────────────────────────────────────
// Technology hub
// ────────────────────────────────────────────────────────────────────────

const TechnologyHubCardSchema = z.object({
  name: z.string(),
  slug: z.string(),
  shortLabel: z.string().nullable().optional(),
  tagline: z.string().nullable().optional(),
  logo: TechLogoSchema,
})

export const TechnologyHubDataSchema = z.object({
  hub: HubMetaSchema,
  technologies: z.array(TechnologyHubCardSchema),
})

export type TechnologyHubCard = z.infer<typeof TechnologyHubCardSchema>
export type TechnologyHubData = z.infer<typeof TechnologyHubDataSchema>

// listItemOnly is excluded from the directory (mirrors the hubs.ts childFilter
// and Webflow keeping android-studio out of listings while still serving it).
// Sorted A-Z by name to match the live directory ("sorted A-Z").
export const TECHNOLOGY_HUB_DATA_QUERY = /* groq */ `
{
  "hub": *[_type == "technologyHub"][0]{
    title,
    eyebrow,
    heroDescription,
    introContent,
    faqs[]{ _key, question, answer },
    metaTitle,
    metaDescription
  },
  "technologies": *[_type == "technology" && defined(slug.current) && listItemOnly != true && ${NOT_RETIRED}]{
    "name": technologyName,
    "slug": slug.current,
    shortLabel,
    tagline,
    "logo": techLogo.asset->{ url, extension }
  } | order(technologyName asc)
}
`

export async function fetchTechnologyHubData(): Promise<TechnologyHubData> {
  const { data } = await sanityFetch({ query: TECHNOLOGY_HUB_DATA_QUERY })
  return TechnologyHubDataSchema.parse(data)
}

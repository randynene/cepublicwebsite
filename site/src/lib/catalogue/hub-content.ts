import 'server-only'

import {
  SERVICES_HUB,
  type HubFaq,
  type HubQuote,
  type HubStory,
  type ServiceCard,
  type TechChip,
} from '@/data/services'
import { TECHNOLOGY_HUB, type Technology } from '@/data/technologies'
import type {
  ServiceHubCard,
  ServicesHubData,
  TechnologyHubData,
} from '@/lib/sanity/queries/catalogue-hub'

// MYGRATR Phase 2B — Sanity -> hub-template transform.
//
// Shapes the Sanity hub data (singleton + child docs) into the exact content the
// services-hub / technology-hub templates already consume. Card grids, hero lead,
// and FAQs come from Sanity; section headings, the promo block, and the
// stories/quotes carousels stay fixed brand furniture (identical to the detail
// pages, which also keep fixed furniture). Every card links to a real Sanity slug.
//
// Services grouping is data-driven (no schema change):
//   featured    -> servicesHub.featuredItems (Studio-editable) or a fixed fallback
//   specialists -> type == staffAugmentation, not AI, not a location page
//   ai          -> aiOffering == true
//   builds      -> type == productBuilds, not AI
//   Product Scoping (consultingServices) -> promo CTA target

function clean(v?: string | null): string | undefined {
  const t = v?.trim()
  return t ? t : undefined
}

// Flatten simple PortableText to plain text (single/multi `normal` blocks). The
// live hub copy is plain blocks only, so this is lossless.
function ptToPlain(pt: unknown): string | undefined {
  if (!Array.isArray(pt)) return undefined
  const text = pt
    .map((b) => {
      const block = b as { children?: { text?: string }[] }
      if (!Array.isArray(block.children)) return ''
      return block.children.map((c) => c?.text ?? '').join('')
    })
    .filter((s) => s.length > 0)
    .join('\n\n')
  return text.length > 0 ? text : undefined
}

type FaqLike = { question?: string | null; answer?: unknown }

function faqsToHubFaqs(items?: FaqLike[] | null): HubFaq[] {
  if (!Array.isArray(items)) return []
  return items
    .map((it) => ({ q: clean(it.question) ?? '', a: ptToPlain(it.answer) ?? '' }))
    .filter((f) => f.q.length > 0 && f.a.length > 0)
}

// First two alphanumerics, uppercased — the small chip badge (Sanity has no abbr).
function abbrOf(name: string): string {
  return name.replace(/[^a-z0-9]/gi, '').slice(0, 2).toUpperCase()
}

function toServiceCard(s: ServiceHubCard): ServiceCard {
  return { name: s.name, sub: clean(s.tagline) ?? clean(s.shortLabel) ?? '', slug: s.slug }
}

// Fallback featured pair when servicesHub.featuredItems is not curated yet.
const FEATURED_FALLBACK = ['software-engineers', 'fractional-ctos']

export interface ServicesHubContent {
  hero: typeof SERVICES_HUB.hero
  category1Heading: string
  aiHeading: typeof SERVICES_HUB.aiHeading
  buildsHeading: typeof SERVICES_HUB.buildsHeading
  techCoverage: typeof SERVICES_HUB.techCoverage
  promo: typeof SERVICES_HUB.promo
  featured: ServiceCard[]
  specialists: ServiceCard[]
  ai: ServiceCard[]
  builds: ServiceCard[]
  techChips: TechChip[]
  stories: HubStory[]
  quotes: HubQuote[]
  faqs: HubFaq[]
}

export function mapServicesHubData(data: ServicesHubData): ServicesHubContent {
  const { hub, services, techChips } = data
  const bySlug = new Map(services.map((s) => [s.slug, s]))

  const featuredSlugs = (hub?.featuredSlugs ?? []).filter((x): x is string => Boolean(x))
  const wanted = featuredSlugs.length > 0 ? featuredSlugs : FEATURED_FALLBACK
  const featured = wanted
    .map((sl) => bySlug.get(sl))
    .filter((s): s is ServiceHubCard => Boolean(s))
    .map(toServiceCard)
  const featuredSet = new Set(featured.map((c) => c.slug))

  const specialists = services
    .filter((s) => s.type === 'staffAugmentation' && !s.ai && !s.location && !featuredSet.has(s.slug))
    .map(toServiceCard)

  const ai = services.filter((s) => s.ai === true && !featuredSet.has(s.slug)).map(toServiceCard)

  const builds = services
    .filter((s) => s.type === 'productBuilds' && !s.ai && !featuredSet.has(s.slug))
    .map(toServiceCard)

  // Product Scoping is the one non-AI consulting service; point the promo at its
  // real slug so the CTA never 404s (the hardcoded href predates the Sanity slug).
  const scoping = services.find((s) => s.type === 'consultingServices' && !s.ai)
  const promo = {
    ...SERVICES_HUB.promo,
    ctaHref: scoping ? `/services/${scoping.slug}` : SERVICES_HUB.promo.ctaHref,
  }

  const chips: TechChip[] = techChips.map((t) => ({
    name: t.name,
    sub: clean(t.tagline) ?? clean(t.shortLabel) ?? '',
    abbr: abbrOf(t.name),
    slug: t.slug,
  }))

  const faqs = faqsToHubFaqs(hub?.faqs)

  return {
    hero: { ...SERVICES_HUB.hero, lead: ptToPlain(hub?.heroDescription) ?? SERVICES_HUB.hero.lead },
    category1Heading: SERVICES_HUB.category1Heading,
    aiHeading: SERVICES_HUB.aiHeading,
    buildsHeading: SERVICES_HUB.buildsHeading,
    techCoverage: SERVICES_HUB.techCoverage,
    promo,
    featured,
    specialists,
    ai,
    builds,
    techChips: chips.length > 0 ? chips : SERVICES_HUB.techChips,
    stories: SERVICES_HUB.stories,
    quotes: SERVICES_HUB.quotes,
    faqs: faqs.length > 0 ? faqs : SERVICES_HUB.faqs,
  }
}

export interface TechnologyHubContent {
  hero: typeof TECHNOLOGY_HUB.hero
  gridEyebrow: string
  gridHeading: string
  countLabel: string
  technologies: Technology[]
  stories: HubStory[]
  quotes: HubQuote[]
  faqs: HubFaq[]
}

export function mapTechnologyHubData(data: TechnologyHubData): TechnologyHubContent {
  const { hub } = data
  const technologies: Technology[] = data.technologies.map((t) => ({
    title: t.name,
    subtitle: clean(t.tagline) ?? clean(t.shortLabel) ?? '',
    abbr: abbrOf(t.name),
    slug: t.slug,
  }))

  const faqs = faqsToHubFaqs(hub?.faqs)

  return {
    hero: { ...TECHNOLOGY_HUB.hero, lead: ptToPlain(hub?.heroDescription) ?? TECHNOLOGY_HUB.hero.lead },
    gridEyebrow: TECHNOLOGY_HUB.gridEyebrow,
    gridHeading: TECHNOLOGY_HUB.gridHeading,
    countLabel: `${technologies.length} technologies \u00b7 sorted A-Z`,
    technologies,
    stories: TECHNOLOGY_HUB.stories,
    quotes: TECHNOLOGY_HUB.quotes,
    faqs: faqs.length > 0 ? faqs : TECHNOLOGY_HUB.faqs,
  }
}

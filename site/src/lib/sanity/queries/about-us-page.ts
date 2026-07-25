import 'server-only'

import { stegaClean } from '@sanity/client/stega'
import { z } from 'zod'

import { ABOUT_US_CONTENT, type AboutUsContent } from '@/components/templates/about-us/content'
import { sanityFetch } from '@/lib/sanity/live'
import { NOT_RETIRED, VISIBLE_IN_LOCALE } from '@/lib/sanity/queries/_filters'
import type { Locale } from '@/lib/locale'

// aboutUsPage singleton + parallel doc mounts for /about-us.
// Page chrome from the singleton; team / values / reviews / logos from their
// own documents (Our Work pattern).

const ABOUT_US_QUERY = /* groq */ `
*[_id == "aboutUsPage"][0]{
  _id,
  _type,
  metaTitle,
  metaDescription,
  hero{ eyebrow, titleLead, titleAccent, intro, cta, ctaHref },
  trusted{ pre, highlight, post },
  stats[]{ value, label },
  "founderImage": founderImage.asset->url,
  story{ eyebrow, titleLead, titleAccent, body },
  team{ eyebrow, titleLead, titleAccent, intro },
  values{ eyebrow, titleLead, titleAccent, intro },
  reviews{ eyebrow, titleLead, titleAccent },
  midCta{ eyebrow, heading, cta, ctaHref, micro }
}
`

const TEAM_QUERY = /* groq */ `
*[_type == "teamMember" && ${NOT_RETIRED} && ${VISIBLE_IN_LOCALE} && !(hideFromTeamAboutPage == true)]
  | order(order asc){
    _id,
    name,
    "slug": slug.current,
    position,
    timeAtCloudEmployee,
    "image": teamMemberImage.asset->url
  }
`

const VALUES_QUERY = /* groq */ `
*[_type == "benefitValue" && category == "values"]
  | order(name asc){
    _id,
    name,
    paragraph,
    "image": thumbnailImage.asset->url
  }
`

const nzs = z.string().nullable().optional()

export const AboutUsPageSchema = z.object({
  _id: z.string(),
  _type: z.string(),
  metaTitle: nzs,
  metaDescription: nzs,
  hero: z
    .object({
      eyebrow: nzs,
      titleLead: nzs,
      titleAccent: nzs,
      intro: nzs,
      cta: nzs,
      ctaHref: nzs,
    })
    .nullable()
    .optional(),
  trusted: z.object({ pre: nzs, highlight: nzs, post: nzs }).nullable().optional(),
  stats: z.array(z.object({ value: nzs, label: nzs })).nullable().optional(),
  founderImage: nzs,
  story: z
    .object({ eyebrow: nzs, titleLead: nzs, titleAccent: nzs, body: nzs })
    .nullable()
    .optional(),
  team: z
    .object({ eyebrow: nzs, titleLead: nzs, titleAccent: nzs, intro: nzs })
    .nullable()
    .optional(),
  values: z
    .object({ eyebrow: nzs, titleLead: nzs, titleAccent: nzs, intro: nzs })
    .nullable()
    .optional(),
  reviews: z
    .object({ eyebrow: nzs, titleLead: nzs, titleAccent: nzs })
    .nullable()
    .optional(),
  midCta: z
    .object({ eyebrow: nzs, heading: nzs, cta: nzs, ctaHref: nzs, micro: nzs })
    .nullable()
    .optional(),
})

export type AboutUsPageData = z.infer<typeof AboutUsPageSchema>

const TeamCardSchema = z.object({
  _id: z.string(),
  name: nzs,
  slug: nzs,
  position: nzs,
  timeAtCloudEmployee: nzs,
  image: nzs,
})
export type AboutUsTeamCard = z.infer<typeof TeamCardSchema>

const ValueCardSchema = z.object({
  _id: z.string(),
  name: nzs,
  paragraph: nzs,
  image: nzs,
})
export type AboutUsValueCard = z.infer<typeof ValueCardSchema>

function localeParam(locale: Locale): 'uk' | 'us' {
  return locale === 'en-GB' ? 'uk' : 'us'
}

export async function fetchAboutUsPage(): Promise<AboutUsPageData | null> {
  const { data } = await sanityFetch({ query: ABOUT_US_QUERY })
  if (data === null || data === undefined) return null
  const result = AboutUsPageSchema.safeParse(data)
  if (!result.success) {
    console.warn('[aboutUsPage] Sanity parse failed, falling back to static content:', result.error.message)
    return null
  }
  return result.data
}

export async function fetchAboutUsTeam(locale: Locale): Promise<AboutUsTeamCard[]> {
  const { data } = await sanityFetch({
    query: TEAM_QUERY,
    params: { locale: localeParam(locale) },
  })
  return z.array(TeamCardSchema).parse(data ?? [])
}

export async function fetchAboutUsValues(): Promise<AboutUsValueCard[]> {
  const { data } = await sanityFetch({ query: VALUES_QUERY })
  return z.array(ValueCardSchema).parse(data ?? [])
}

function cleanUrl(v: string | null | undefined): string | undefined {
  return typeof v === 'string' && v.trim() ? stegaClean(v) : undefined
}

function pick(v: string | null | undefined, fallback: string): string {
  return typeof v === 'string' && v.trim() ? v : fallback
}

export function toAboutUsContent(data: AboutUsPageData): AboutUsContent {
  const FE = ABOUT_US_CONTENT
  const stats = (data.stats ?? [])
    .filter((s): s is { value: string; label: string } => Boolean(s?.value && s?.label))
    .map((s) => ({ value: s.value, label: s.label }))

  return {
    hero: {
      eyebrow: pick(data.hero?.eyebrow, FE.hero.eyebrow),
      titleLead: pick(data.hero?.titleLead, FE.hero.titleLead),
      titleAccent: pick(data.hero?.titleAccent, FE.hero.titleAccent),
      intro: pick(data.hero?.intro, FE.hero.intro),
      cta: pick(data.hero?.cta, FE.hero.cta),
      ctaHref: pick(data.hero?.ctaHref, FE.hero.ctaHref),
    },
    trusted: {
      pre: pick(data.trusted?.pre, FE.trusted.pre),
      highlight: pick(data.trusted?.highlight, FE.trusted.highlight),
      post: pick(data.trusted?.post, FE.trusted.post),
    },
    stats: stats.length > 0 ? stats : FE.stats,
    founderImage: cleanUrl(data.founderImage) || FE.founderImage,
    story: {
      eyebrow: pick(data.story?.eyebrow, FE.story.eyebrow),
      titleLead: pick(data.story?.titleLead, FE.story.titleLead),
      titleAccent: pick(data.story?.titleAccent, FE.story.titleAccent),
      body: pick(data.story?.body, FE.story.body),
    },
    team: {
      eyebrow: pick(data.team?.eyebrow, FE.team.eyebrow),
      titleLead: pick(data.team?.titleLead, FE.team.titleLead),
      titleAccent: pick(data.team?.titleAccent, FE.team.titleAccent),
      intro: pick(data.team?.intro, FE.team.intro),
    },
    values: {
      eyebrow: pick(data.values?.eyebrow, FE.values.eyebrow),
      titleLead: pick(data.values?.titleLead, FE.values.titleLead),
      titleAccent: pick(data.values?.titleAccent, FE.values.titleAccent),
      intro: pick(data.values?.intro, FE.values.intro),
    },
    reviews: {
      eyebrow: pick(data.reviews?.eyebrow, FE.reviews.eyebrow),
      titleLead: pick(data.reviews?.titleLead, FE.reviews.titleLead),
      titleAccent: pick(data.reviews?.titleAccent, FE.reviews.titleAccent),
    },
    midCta: {
      eyebrow: pick(data.midCta?.eyebrow, FE.midCta.eyebrow),
      heading: pick(data.midCta?.heading, FE.midCta.heading),
      cta: pick(data.midCta?.cta, FE.midCta.cta),
      ctaHref: pick(data.midCta?.ctaHref, FE.midCta.ctaHref),
      micro: pick(data.midCta?.micro, FE.midCta.micro),
    },
  }
}

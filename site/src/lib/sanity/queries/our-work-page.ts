import 'server-only'

import { z } from 'zod'

import { sanityFetch } from '@/lib/sanity/live'
import { OUR_WORK_CONTENT, type OurWorkContent } from '@/components/templates/our-work/content'

// ourWorkPage singleton fetch (routes /our-work + /uk/our-work).
//
// The three decorative photo tiles are dereferenced to plain URLs (the template
// renders them with a bare <img>, matching the Fractional CTO pattern). The
// customer stories, logos, reviews and bento grid come from their OWN documents
// via social-proof queries - they are NOT part of this singleton.
//
// The internal link targets (ctaHref) and the small UI labels are NOT in the
// schema: they are code-owned structural routes / furniture, spliced back from the
// static OUR_WORK_CONTENT in the transform so an editor cannot break navigation or
// have them corrupted by Presentation's stega encoding. Every editable string is
// plain prose rendered as text, so no stega cleaning is needed. page.tsx falls back
// to the static OUR_WORK_CONTENT when this returns null.

const OUR_WORK_QUERY = /* groq */ `
*[_id == "ourWorkPage"][0]{
  _id,
  _type,
  metaTitle,
  metaDescription,
  hero{ eyebrow, titleLead, titleAccent, titleRest, intro, cta },
  trusted{ pre, highlight, post },
  statsPrimary[]{ value, lead, rest },
  "statsPhoto": statsPhoto.asset->url,
  impact{ eyebrow, heading, cta },
  beyondHiring{
    headingLead, headingAccent,
    stats1525{ value, lead, rest },
    rating{ lead, rest },
    stats300{ value, lead, rest },
    "photo": photo.asset->url
  },
  reviews{ eyebrow, headingLead, headingAccent, headingRest },
  midCta{ eyebrow, heading, cta, micro, "photo": photo.asset->url }
}
`

// ── Zod boundary schema (lenient - the static OUR_WORK_CONTENT is the fallback) ──
const nzs = z.string().nullable().optional()
const zStat = z.object({ value: nzs, lead: nzs, rest: nzs }).nullable().optional()

export const OurWorkPageSchema = z.object({
  _id: z.string(),
  _type: z.string(),
  metaTitle: nzs,
  metaDescription: nzs,
  hero: z
    .object({ eyebrow: nzs, titleLead: nzs, titleAccent: nzs, titleRest: nzs, intro: nzs, cta: nzs })
    .nullable()
    .optional(),
  trusted: z.object({ pre: nzs, highlight: nzs, post: nzs }).nullable().optional(),
  statsPrimary: z.array(z.object({ value: nzs, lead: nzs, rest: nzs })).nullable().optional(),
  statsPhoto: nzs,
  impact: z.object({ eyebrow: nzs, heading: nzs, cta: nzs }).nullable().optional(),
  beyondHiring: z
    .object({
      headingLead: nzs,
      headingAccent: nzs,
      stats1525: zStat,
      rating: z.object({ lead: nzs, rest: nzs }).nullable().optional(),
      stats300: zStat,
      photo: nzs,
    })
    .nullable()
    .optional(),
  reviews: z
    .object({ eyebrow: nzs, headingLead: nzs, headingAccent: nzs, headingRest: nzs })
    .nullable()
    .optional(),
  midCta: z
    .object({ eyebrow: nzs, heading: nzs, cta: nzs, micro: nzs, photo: nzs })
    .nullable()
    .optional(),
})

export type OurWorkPageData = z.infer<typeof OurWorkPageSchema>

// Returns the parsed singleton, or null when absent / invalid. sanityFetch dedupes
// within a request so generateMetadata and the page body both call it cheaply.
export async function fetchOurWorkPage(): Promise<OurWorkPageData | null> {
  const { data } = await sanityFetch({ query: OUR_WORK_QUERY })
  if (data === null || data === undefined) return null
  const result = OurWorkPageSchema.safeParse(data)
  if (!result.success) {
    console.warn(
      '[ourWorkPage] Sanity parse failed, falling back to static content:',
      result.error.message,
    )
    return null
  }
  return result.data
}

// Cast the lenient boundary shape into the template's content type, then splice the
// code-owned values (link targets + UI labels) back from the static content. Each
// top-level section falls back to the static block if absent, so a partial doc
// never yields an undefined section.
export function toOurWorkContent(data: OurWorkPageData): OurWorkContent {
  const c = data as unknown as OurWorkContent

  return {
    hero: { ...(c.hero ?? OUR_WORK_CONTENT.hero), ctaHref: OUR_WORK_CONTENT.hero.ctaHref },
    trusted: c.trusted ?? OUR_WORK_CONTENT.trusted,
    statsPrimary:
      c.statsPrimary && c.statsPrimary.length ? c.statsPrimary : OUR_WORK_CONTENT.statsPrimary,
    statsPhoto: c.statsPhoto ?? undefined,
    impact: { ...(c.impact ?? OUR_WORK_CONTENT.impact), ctaHref: OUR_WORK_CONTENT.impact.ctaHref },
    beyondHiring: c.beyondHiring
      ? { ...c.beyondHiring, photo: c.beyondHiring.photo ?? undefined }
      : OUR_WORK_CONTENT.beyondHiring,
    reviews: c.reviews ?? OUR_WORK_CONTENT.reviews,
    midCta: {
      ...(c.midCta ?? OUR_WORK_CONTENT.midCta),
      ctaHref: OUR_WORK_CONTENT.midCta.ctaHref,
      photo: c.midCta?.photo ?? undefined,
    },
    labels: OUR_WORK_CONTENT.labels,
  }
}

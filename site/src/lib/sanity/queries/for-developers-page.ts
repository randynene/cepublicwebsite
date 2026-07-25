import 'server-only'

import { stegaClean } from '@sanity/client/stega'
import { z } from 'zod'

import { sanityFetch } from '@/lib/sanity/live'
import { FOR_ENGINEERS_CONTENT, JOIN_CONTENT, type ForEngineersContent } from '@/components/templates/for-engineers/content'

// forDevelopersPage singleton fetch (routes /for-developers + /uk).
//
// The template body is a tokenised Figma export hydrated from the content
// object; every image URL is embedded into a CSS background-image value, so the
// 10 image slots are projected as plain asset URLs and stega-cleaned in the
// transform (stega characters would corrupt a url("...") value). Editable text
// keeps its stega encoding so Presentation click-to-edit works. The multi-step
// form (join) is code-owned and always spliced from JOIN_CONTENT. page.tsx falls
// back to the static FOR_ENGINEERS_CONTENT when the doc is null.

const FOR_DEVELOPERS_QUERY = /* groq */ `
*[_id == "forDevelopersPage"][0]{
  _id,
  _type,
  metaTitle,
  metaDescription,
  hero{
    eyebrow, titleLead, titleAccent, sub, ctaPrimary, ctaGhost, trust,
    card{ name, role, matched, workLabel, tags, foot[]{ n, l }, "image": image.asset->url }
  },
  problem{
    eyebrow, titleLead, titleAccent, leadPre, leadStrong, leadPost,
    stats[]{ num, body }
  },
  how{
    eyebrow, titleLead, titleAccent,
    steps{
      one{ n, h, p, tag, miniLabel, rows },
      two{ n, badge, h, p, live, camYou, camEng, "camYouImage": camYouImage.asset->url, "camEngImage": camEngImage.asset->url },
      three{ n, h, p, incomingLabel, msgs[]{ co, ln, mt } },
      four{ n, h, p, tag, handleLabel, chips }
    }
  },
  benefits{
    eyebrow, titleLead, titleAccent, lead,
    items[]{ h, p },
    photos[]{ caption, sub, "image": image.asset->url }
  },
  mission{ eyebrow, titleLead, titleAccent, p },
  tests{
    eyebrow, titleLead, titleAccent, videoPill, videoLabel, "videoImage": videoImage.asset->url,
    quotes[]{ name, role, quote, "image": image.asset->url }
  },
  final{ titleLead, titleAccent, p, cta, trust }
}
`

// ── Zod boundary schema (lenient - static content is the fallback) ───────
const nzs = z.string().nullable().optional()
const zStrArr = z.array(z.string()).nullable().optional()

export const ForDevelopersPageSchema = z.object({
  _id: z.string(),
  _type: z.string(),
  metaTitle: nzs,
  metaDescription: nzs,
  hero: z
    .object({
      eyebrow: nzs,
      titleLead: nzs,
      titleAccent: nzs,
      sub: nzs,
      ctaPrimary: nzs,
      ctaGhost: nzs,
      trust: zStrArr,
      card: z
        .object({
          name: nzs,
          role: nzs,
          matched: nzs,
          workLabel: nzs,
          tags: zStrArr,
          foot: z.array(z.object({ n: nzs, l: nzs })).nullable().optional(),
          image: nzs,
        })
        .nullable()
        .optional(),
    })
    .nullable()
    .optional(),
  problem: z
    .object({
      eyebrow: nzs,
      titleLead: nzs,
      titleAccent: nzs,
      leadPre: nzs,
      leadStrong: nzs,
      leadPost: nzs,
      stats: z.array(z.object({ num: nzs, body: nzs })).nullable().optional(),
    })
    .nullable()
    .optional(),
  how: z
    .object({
      eyebrow: nzs,
      titleLead: nzs,
      titleAccent: nzs,
      steps: z
        .object({
          one: z
            .object({ n: nzs, h: nzs, p: nzs, tag: nzs, miniLabel: nzs, rows: zStrArr })
            .nullable()
            .optional(),
          two: z
            .object({
              n: nzs,
              badge: nzs,
              h: nzs,
              p: nzs,
              live: nzs,
              camYou: nzs,
              camEng: nzs,
              camYouImage: nzs,
              camEngImage: nzs,
            })
            .nullable()
            .optional(),
          three: z
            .object({
              n: nzs,
              h: nzs,
              p: nzs,
              incomingLabel: nzs,
              msgs: z.array(z.object({ co: nzs, ln: nzs, mt: nzs })).nullable().optional(),
            })
            .nullable()
            .optional(),
          four: z
            .object({ n: nzs, h: nzs, p: nzs, tag: nzs, handleLabel: nzs, chips: zStrArr })
            .nullable()
            .optional(),
        })
        .nullable()
        .optional(),
    })
    .nullable()
    .optional(),
  benefits: z
    .object({
      eyebrow: nzs,
      titleLead: nzs,
      titleAccent: nzs,
      lead: nzs,
      items: z.array(z.object({ h: nzs, p: nzs })).nullable().optional(),
      photos: z.array(z.object({ caption: nzs, sub: nzs, image: nzs })).nullable().optional(),
    })
    .nullable()
    .optional(),
  mission: z
    .object({ eyebrow: nzs, titleLead: nzs, titleAccent: nzs, p: nzs })
    .nullable()
    .optional(),
  tests: z
    .object({
      eyebrow: nzs,
      titleLead: nzs,
      titleAccent: nzs,
      videoPill: nzs,
      videoLabel: nzs,
      videoImage: nzs,
      quotes: z
        .array(z.object({ name: nzs, role: nzs, quote: nzs, image: nzs }))
        .nullable()
        .optional(),
    })
    .nullable()
    .optional(),
  final: z
    .object({ titleLead: nzs, titleAccent: nzs, p: nzs, cta: nzs, trust: zStrArr })
    .nullable()
    .optional(),
})

export type ForDevelopersPageData = z.infer<typeof ForDevelopersPageSchema>

// Returns the parsed singleton, or null when absent / invalid. sanityFetch
// dedupes within a request so generateMetadata and the page body share one call.
export async function fetchForDevelopersPage(): Promise<ForDevelopersPageData | null> {
  const { data } = await sanityFetch({ query: FOR_DEVELOPERS_QUERY })
  if (data === null || data === undefined) return null
  const result = ForDevelopersPageSchema.safeParse(data)
  if (!result.success) {
    console.warn(
      '[forDevelopersPage] Sanity parse failed, falling back to static content:',
      result.error.message,
    )
    return null
  }
  return result.data
}

// stega-clean an image URL string in place (leave null/absent alone).
function cleanUrl(v: string | null | undefined): string | undefined {
  return typeof v === 'string' ? stegaClean(v) : undefined
}

// Cast the lenient boundary shape into the template content type. Whole sections
// fall back to the static content when absent; image URLs are stega-cleaned (a
// CSS url() value cannot carry stega characters); editable text keeps its stega
// encoding for Presentation click-to-edit; the code-owned form is always static.
export function toForEngineersContent(data: ForDevelopersPageData): ForEngineersContent {
  const c = data as unknown as ForEngineersContent
  const FE = FOR_ENGINEERS_CONTENT

  const hero: ForEngineersContent['hero'] = c.hero
    ? { ...c.hero, card: { ...c.hero.card, image: cleanUrl(c.hero.card?.image) } }
    : FE.hero

  const how: ForEngineersContent['how'] = c.how
    ? {
        ...c.how,
        steps: {
          ...c.how.steps,
          two: {
            ...c.how.steps.two,
            camYouImage: cleanUrl(c.how.steps.two?.camYouImage),
            camEngImage: cleanUrl(c.how.steps.two?.camEngImage),
          },
        },
      }
    : FE.how

  const benefits: ForEngineersContent['benefits'] = c.benefits
    ? {
        ...c.benefits,
        photos: (c.benefits.photos ?? []).map((p) => ({ ...p, image: cleanUrl(p.image) })),
      }
    : FE.benefits

  const tests: ForEngineersContent['tests'] = c.tests
    ? {
        ...c.tests,
        videoImage: cleanUrl(c.tests.videoImage),
        quotes: (c.tests.quotes ?? []).map((q) => ({ ...q, image: cleanUrl(q.image) })),
      }
    : FE.tests

  return {
    hero,
    problem: c.problem ?? FE.problem,
    how,
    benefits,
    mission: c.mission ?? FE.mission,
    tests,
    final: c.final ?? FE.final,
    // Code-owned interactive form - never from Sanity.
    join: JOIN_CONTENT,
  }
}

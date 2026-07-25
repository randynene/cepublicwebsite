import 'server-only'

import { z } from 'zod'

import { sanityFetch } from '@/lib/sanity/live'
import type { HomeContent } from '@/components/templates/home/content'

// homePage singleton fetch (route /). The GROQ projection dereferences every
// image into the exact shape the template already consumes:
//   - logos + leadImage + poster  → { src, width, height }
//   - profiles / avatar / testimonial photos → a plain `src` url string
// so the template's <Image> usage stays unchanged. The parsed result is cast
// to HomeContent (the template's content shape); Zod is the runtime contract,
// and page.tsx falls back to the static HOME_CONTENT when this returns null.

// ── GROQ image fragments ────────────────────────────────────────────────
const WH = `"src": asset->url, "width": asset->metadata.dimensions.width, "height": asset->metadata.dimensions.height`

const HOME_PAGE_QUERY = /* groq */ `
*[_id == "homePage"][0]{
  _id,
  _type,
  metaTitle,
  metaDescription,
  hero{
    eyebrow, titleLead, titleAccent, paragraphLines, primaryCta, secondaryCta,
    bottomPills, floatingPills,
    profiles[]{ name, role, flag, tags, "image": image.asset->url }
  },
  trustedBy{
    label, labelLine1, labelLine2,
    logos[]{ name, ${WH.replace(/asset->/g, 'image.asset->')}, invert, "displayH": displayHeight, displayOpacity }
  },
  clientStory{
    eyebrow, quoteLines, name, role,
    "avatar": avatar.asset->url,
    logo{ name, ${WH.replace(/asset->/g, 'image.asset->')} }
  },
  whyDifferent{
    eyebrow, titleLead, titleAccent, paragraph,
    lead{ title, body, icon, proof },
    leadImage{ ${WH} },
    reasons[]{ title, body, icon, proof }
  },
  process{
    eyebrow, titleLead, titleAccent,
    steps[]{ number, title, body, cta },
    video{ name, roleLine, caption, subtitle, cta, videoUrl, poster{ ${WH} } }
  },
  testimonials{
    eyebrow, title,
    items[]{
      quote, name, role,
      logo{ name, ${WH.replace(/asset->/g, 'image.asset->')} },
      "image": image.asset->url,
      stats[]{ value, label }
    }
  },
  included{
    eyebrow, titleLead, titleAccent,
    you{ label, heading, items },
    us{ label, heading, items },
    footnote
  },
  calculator{
    eyebrow, titleLead, titleAccent,
    fields[]{ label, value },
    resultLabel, price, priceSuffix, comparison, saving, badgeSave, badgeSub, cta, footnote
  },
  realEngineers{
    eyebrow, titleLead, titleAccent, badge,
    profiles[]{ name, role, flag, tags, "image": image.asset->url }
  },
  readyToFind{
    eyebrow, titleLead, titleAccent, paragraph, steps, question, questionSub,
    roles, bottomPills, nextLabel,
    matching{ label, unlocks, tags, note, stats[]{ value, label } },
    talkPrompt, talkCtas
  },
  locations{ eyebrow, titleLead, titleAccent, placeholder, cards },
  faq{
    eyebrow, titleLead, titleAccent, fallbackLabel, fallbackBody, fallbackCta,
    items[]{ number, question, answer }
  }
}
`

// ── Zod boundary schema (lenient — the static file is the fallback) ──────
const nzs = z.string().nullable().optional()
const nzn = z.number().nullable().optional()
const zStrArr = z.array(z.string()).nullable().optional()

const zImage = z.object({ src: nzs, width: nzn, height: nzn }).nullable().optional()
const zLogo = z.object({
  name: nzs,
  src: nzs,
  width: nzn,
  height: nzn,
  invert: z.boolean().nullable().optional(),
  displayH: nzn,
  displayOpacity: nzn,
})
const zProfile = z.object({ name: nzs, role: nzs, flag: nzs, tags: zStrArr, image: nzs })
const zStat = z.object({ value: nzs, label: nzs })
const zReason = z.object({ title: nzs, body: nzs, icon: nzs, proof: nzs })

export const HomePageSchema = z.object({
  _id: z.string(),
  _type: z.string(),
  metaTitle: nzs,
  metaDescription: nzs,
  hero: z
    .object({
      eyebrow: nzs,
      titleLead: nzs,
      titleAccent: nzs,
      paragraphLines: zStrArr,
      primaryCta: nzs,
      secondaryCta: nzs,
      bottomPills: zStrArr,
      floatingPills: zStrArr,
      profiles: z.array(zProfile).nullable().optional(),
    })
    .nullable()
    .optional(),
  trustedBy: z
    .object({
      label: nzs,
      labelLine1: nzs,
      labelLine2: nzs,
      logos: z.array(zLogo).nullable().optional(),
    })
    .nullable()
    .optional(),
  clientStory: z
    .object({
      eyebrow: nzs,
      quoteLines: zStrArr,
      name: nzs,
      role: nzs,
      avatar: nzs,
      logo: zLogo.nullable().optional(),
    })
    .nullable()
    .optional(),
  whyDifferent: z
    .object({
      eyebrow: nzs,
      titleLead: nzs,
      titleAccent: nzs,
      paragraph: nzs,
      lead: zReason.nullable().optional(),
      leadImage: zImage,
      reasons: z.array(zReason).nullable().optional(),
    })
    .nullable()
    .optional(),
  process: z
    .object({
      eyebrow: nzs,
      titleLead: nzs,
      titleAccent: nzs,
      steps: z
        .array(z.object({ number: nzs, title: nzs, body: nzs, cta: nzs }))
        .nullable()
        .optional(),
      video: z
        .object({
          name: nzs,
          roleLine: nzs,
          caption: nzs,
          subtitle: nzs,
          cta: nzs,
          videoUrl: nzs,
          poster: zImage,
        })
        .nullable()
        .optional(),
    })
    .nullable()
    .optional(),
  testimonials: z
    .object({
      eyebrow: nzs,
      title: nzs,
      items: z
        .array(
          z.object({
            quote: nzs,
            name: nzs,
            role: nzs,
            logo: zLogo.nullable().optional(),
            image: nzs,
            stats: z.array(zStat).nullable().optional(),
          }),
        )
        .nullable()
        .optional(),
    })
    .nullable()
    .optional(),
  included: z
    .object({
      eyebrow: nzs,
      titleLead: nzs,
      titleAccent: nzs,
      you: z.object({ label: nzs, heading: nzs, items: zStrArr }).nullable().optional(),
      us: z.object({ label: nzs, heading: nzs, items: zStrArr }).nullable().optional(),
      footnote: nzs,
    })
    .nullable()
    .optional(),
  calculator: z
    .object({
      eyebrow: nzs,
      titleLead: nzs,
      titleAccent: nzs,
      fields: z.array(z.object({ label: nzs, value: nzs })).nullable().optional(),
      resultLabel: nzs,
      price: nzs,
      priceSuffix: nzs,
      comparison: nzs,
      saving: nzs,
      badgeSave: nzs,
      badgeSub: nzs,
      cta: nzs,
      footnote: nzs,
    })
    .nullable()
    .optional(),
  realEngineers: z
    .object({
      eyebrow: nzs,
      titleLead: nzs,
      titleAccent: nzs,
      badge: nzs,
      profiles: z.array(zProfile).nullable().optional(),
    })
    .nullable()
    .optional(),
  readyToFind: z
    .object({
      eyebrow: nzs,
      titleLead: nzs,
      titleAccent: nzs,
      paragraph: nzs,
      steps: zStrArr,
      question: nzs,
      questionSub: nzs,
      roles: zStrArr,
      bottomPills: zStrArr,
      nextLabel: nzs,
      matching: z
        .object({
          label: nzs,
          unlocks: nzs,
          tags: zStrArr,
          note: nzs,
          stats: z.array(zStat).nullable().optional(),
        })
        .nullable()
        .optional(),
      talkPrompt: nzs,
      talkCtas: zStrArr,
    })
    .nullable()
    .optional(),
  locations: z
    .object({
      eyebrow: nzs,
      titleLead: nzs,
      titleAccent: nzs,
      placeholder: nzs,
      cards: zStrArr,
    })
    .nullable()
    .optional(),
  faq: z
    .object({
      eyebrow: nzs,
      titleLead: nzs,
      titleAccent: nzs,
      fallbackLabel: nzs,
      fallbackBody: nzs,
      fallbackCta: nzs,
      items: z
        .array(z.object({ number: nzs, question: nzs, answer: nzs }))
        .nullable()
        .optional(),
    })
    .nullable()
    .optional(),
})

export type HomePageData = z.infer<typeof HomePageSchema>

// Returns the parsed homePage singleton, or null when it is absent / fails to
// validate. sanityFetch dedupes within a request, so generateMetadata and the
// page body can both call this cheaply. page.tsx casts the result into the
// template's HomeContent shape (Zod is the runtime guard) and falls back to
// the static HOME_CONTENT when this is null.
export async function fetchHomePage(): Promise<HomePageData | null> {
  const { data } = await sanityFetch({ query: HOME_PAGE_QUERY })
  if (data === null || data === undefined) return null
  const result = HomePageSchema.safeParse(data)
  if (!result.success) {
    console.warn(
      '[homePage] Sanity parse failed, falling back to static content:',
      result.error.message,
    )
    return null
  }
  return result.data
}

// Cast the lenient boundary shape into the template's literal content type.
// Kept as a single named helper so the `as unknown as` bridge lives in one
// place; the runtime object already matches HomeContent field-for-field.
export function toHomeContent(data: HomePageData): HomeContent {
  return data as unknown as HomeContent
}

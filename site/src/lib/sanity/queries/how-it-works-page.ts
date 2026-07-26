import 'server-only'

import { stegaClean } from '@sanity/client/stega'
import { z } from 'zod'

import { CHAT_HREF } from '@/lib/chat'
import { sanityFetch } from '@/lib/sanity/live'
import { stegaEnum } from '@/lib/sanity/stega-enum'
import { HIW_CONTENT, type HiwContent } from '@/components/templates/how-it-works/content'

// howItWorksPage singleton fetch (route /how-it-works). The GROQ projection
// dereferences every photo into a plain `image` url string plus its `imageAlt`,
// so the template's <Image> usage (which expects string paths) stays unchanged.
// The parsed result is cast to HiwContent (the template's content shape); Zod is
// the runtime contract, and the route falls back to the static HIW_CONTENT when
// this returns null.

const HOW_IT_WORKS_QUERY = /* groq */ `
*[_id == "howItWorksPage"][0]{
  _id,
  _type,
  metaTitle,
  metaDescription,
  hero{
    eyebrow, titleLead, titleAccent, paragraph, cta, ctaHref, bottomPills, vetted,
    people[]{ name, role, flag, tags, "image": image.asset->url, "imageAlt": image.alt, rotate }
  },
  stages{
    eyebrow, titleLead, titleAccent,
    items[]{ stage, title, intro, checks, "image": image.asset->url, "imageAlt": image.alt },
    brief{
      label, status, timer, role, scopedBy, stackLabel, stack,
      fields[]{ label, value },
      searchingNote, resultNote
    },
    funnel{ label, rows[]{ label, value, barWidth, highlight } },
    handled{ title, status, rows[]{ title, sub }, footnote, footprint },
    stats[]{ value, label }
  },
  deRisk{ eyebrow, items },
  testimonials{
    eyebrow, titleLead, titleAccent,
    items[]{ quote, name, role, variant, "image": image.asset->url, "imageAlt": image.alt }
  },
  matcher{
    eyebrow, titleLead, titleAccent, paragraph, steps, question, questionSub,
    roles, bottomPills, nextLabel,
    matching{ label, unlocks, tags, note, stats[]{ value, label } },
    talkPrompt,
    // Left unprojected on purpose: documents seeded before the schema change
    // hold plain strings here, and a projection would flatten those to null.
    // The mapper below normalises both shapes.
    talkCtas,
    bookHref
  },
  faq{
    eyebrow, titleLead, titleAccent, fallbackLabel, fallbackBody, fallbackCta,
    fallbackCtaHref,
    items[]{ number, question, answer }
  }
}
`

// ── Zod boundary schema (lenient — the static file is the fallback) ──────
const nzs = z.string().nullable().optional()
const nzn = z.number().nullable().optional()
const nzb = z.boolean().nullable().optional()
const zStrArr = z.array(z.string()).nullable().optional()

const zStat = z.object({ value: nzs, label: nzs })
const zLabelValue = z.object({ label: nzs, value: nzs })
const zPerson = z.object({
  name: nzs,
  role: nzs,
  flag: nzs,
  tags: zStrArr,
  image: nzs,
  imageAlt: nzs,
  rotate: nzn,
})

export const HowItWorksPageSchema = z.object({
  _id: z.string(),
  _type: z.string(),
  metaTitle: nzs,
  metaDescription: nzs,
  hero: z
    .object({
      eyebrow: nzs,
      titleLead: nzs,
      titleAccent: nzs,
      paragraph: nzs,
      cta: nzs,
      ctaHref: nzs,
      bottomPills: zStrArr,
      vetted: nzs,
      people: z.array(zPerson).nullable().optional(),
    })
    .nullable()
    .optional(),
  stages: z
    .object({
      eyebrow: nzs,
      titleLead: nzs,
      titleAccent: nzs,
      items: z
        .array(
          z.object({
            stage: nzs,
            title: nzs,
            intro: nzs,
            checks: zStrArr,
            image: nzs,
            imageAlt: nzs,
          }),
        )
        .nullable()
        .optional(),
      brief: z
        .object({
          label: nzs,
          status: nzs,
          timer: nzs,
          role: nzs,
          scopedBy: nzs,
          stackLabel: nzs,
          stack: zStrArr,
          fields: z.array(zLabelValue).nullable().optional(),
          searchingNote: nzs,
          resultNote: nzs,
        })
        .nullable()
        .optional(),
      funnel: z
        .object({
          label: nzs,
          rows: z
            .array(z.object({ label: nzs, value: nzs, barWidth: nzs, highlight: nzb }))
            .nullable()
            .optional(),
        })
        .nullable()
        .optional(),
      handled: z
        .object({
          title: nzs,
          status: nzs,
          rows: z.array(z.object({ title: nzs, sub: nzs })).nullable().optional(),
          footnote: nzs,
          footprint: nzs,
        })
        .nullable()
        .optional(),
      stats: z.array(zStat).nullable().optional(),
    })
    .nullable()
    .optional(),
  deRisk: z
    .object({ eyebrow: nzs, items: zStrArr })
    .nullable()
    .optional(),
  testimonials: z
    .object({
      eyebrow: nzs,
      titleLead: nzs,
      titleAccent: nzs,
      items: z
        .array(
          z.object({
            quote: nzs,
            name: nzs,
            role: nzs,
            // Logic selector (photo vs quote card) — stega-cleaned before the
            // enum match so draft/Presentation mode does not reject it.
            variant: stegaEnum(['photo', 'quote']).nullable().optional(),
            image: nzs,
            imageAlt: nzs,
          }),
        )
        .nullable()
        .optional(),
    })
    .nullable()
    .optional(),
  matcher: z
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
      // Union tolerates the pre-schema-change string form. Normalised in
      // toHiwContent so the template only ever sees { label, href }.
      talkCtas: z
        .array(z.union([z.string(), z.object({ label: nzs, href: nzs }).passthrough()]))
        .nullable()
        .optional(),
      bookHref: nzs,
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
      fallbackCtaHref: nzs,
      items: z
        .array(z.object({ number: nzs, question: nzs, answer: nzs }))
        .nullable()
        .optional(),
    })
    .nullable()
    .optional(),
})

export type HowItWorksPageData = z.infer<typeof HowItWorksPageSchema>

// Returns the parsed howItWorksPage singleton, or null when it is absent /
// fails to validate. sanityFetch dedupes within a request, so generateMetadata
// and the page body can both call this cheaply. The route casts the result into
// the template's HiwContent shape (Zod is the runtime guard) and falls back to
// the static HIW_CONTENT when this is null.
export async function fetchHowItWorksPage(): Promise<HowItWorksPageData | null> {
  const { data } = await sanityFetch({ query: HOW_IT_WORKS_QUERY })
  if (data === null || data === undefined) return null
  const result = HowItWorksPageSchema.safeParse(data)
  if (!result.success) {
    console.warn(
      '[howItWorksPage] Sanity parse failed, falling back to static content:',
      result.error.message,
    )
    return null
  }
  return result.data
}

// Cast the lenient boundary shape into the template's literal content type.
// The funnel bar widths are decorative CSS values applied as inline `width`,
// not click-to-edit display text, so they are stega-cleaned here — otherwise
// draft/Presentation mode injects invisible characters that break the CSS
// `width` declaration and collapse the bars. (CountUp target strings tolerate
// stega, since their parser reads the numeric run and ignores trailing
// characters; the testimonial `variant` selector is cleaned at the Zod
// boundary via stegaEnum.)
//
// Hrefs get the same treatment for the same reason: they are machine values,
// never display text, and a stega-tagged "#chat" would not match the chat
// token or resolve as a URL.
export function toHiwContent(data: HowItWorksPageData): HiwContent {
  const rows = data.stages?.funnel?.rows
  if (rows) {
    for (const row of rows) {
      if (typeof row.barWidth === 'string') row.barWidth = stegaClean(row.barWidth)
    }
  }

  if (data.hero) data.hero.ctaHref = cleanHref(data.hero.ctaHref, HIW_CONTENT.hero.ctaHref)
  if (data.matcher) {
    data.matcher.bookHref = cleanHref(data.matcher.bookHref, HIW_CONTENT.matcher.bookHref)
    data.matcher.talkCtas = normaliseTalkCtas(data.matcher.talkCtas)
  }
  if (data.faq) {
    data.faq.fallbackCtaHref = cleanHref(data.faq.fallbackCtaHref, HIW_CONTENT.faq.fallbackCtaHref)
  }

  return data as unknown as HiwContent
}

function cleanHref(value: string | null | undefined, fallback: string): string {
  const cleaned = typeof value === 'string' ? stegaClean(value).trim() : ''
  return cleaned || fallback
}

// Accepts both the current { label, href } members and the plain strings that
// documents seeded before the schema change still hold. Legacy strings inherit
// the static content's destination for the same position, so the CTA is live
// the moment the schema deploys, without waiting for a reseed.
type TalkCtaInput = NonNullable<HowItWorksPageData['matcher']>['talkCtas']

function normaliseTalkCtas(value: TalkCtaInput): { label: string; href: string }[] {
  const items = Array.isArray(value) ? value : []
  const defaults = HIW_CONTENT.matcher.talkCtas

  return items.flatMap((item, i) => {
    const fallbackHref = defaults[i]?.href ?? CHAT_HREF
    if (typeof item === 'string') {
      const label = item.trim()
      return label ? [{ label, href: fallbackHref }] : []
    }
    const label = typeof item.label === 'string' ? item.label : ''
    return label ? [{ label, href: cleanHref(item.href, fallbackHref) }] : []
  })
}

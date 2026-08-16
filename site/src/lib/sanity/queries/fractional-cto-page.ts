import 'server-only'

import { stegaClean } from '@sanity/client/stega'
import { z } from 'zod'

import { sanityFetch } from '@/lib/sanity/live'
import { FCTO, type FctoContent } from '@/components/templates/fractional-cto/content'

// fractionalCtoPage singleton fetch (routes /services/fractional-ctos + /uk).
// The page has no image assets (see the schema note), so this projection is
// plain scalars/arrays. Layout fields (card offsets, pill icon/offsets, option
// width) are seeded + hidden in Studio and projected here so the parsed object
// matches FctoContent field-for-field; the transform is therefore a blunt cast,
// identical to homePage. page.tsx falls back to the static FCTO when null.

const FRACTIONAL_CTO_QUERY = /* groq */ `
*[_id == "fractionalCtoPage"][0]{
  _id,
  _type,
  metaTitle,
  metaDescription,
  hero{
    eyebrow, h1Lead, h1Em, sub, ctaPrimary, ctaGhost, trust,
    match{ label, badge, footnote, rows[]{ icon, title, meta, price, priceGbp, per } },
    cards[]{ role, days, name, cred, tags, left, top, rot, "image": image.asset->url },
    statusPills[]{ label, icon, left, top }
  },
  trusted{ label, logos, aiPill },
  video{
    eyebrow, title, videoUrl, "poster": poster.asset->url, tag, name, role, play,
    timeStart, timeEnd, stateIdle, statePlaying
  },
  does{ eyebrow, title, cards[]{ h4, p } },
  statement{ eyebrow, line1, line2, sub },
  matched{
    eyebrow, h2Lead, h2Em, topSub,
    feature{ h3, p, foot, "image": image.asset->url },
    steps[]{ h4, p }
  },
  derisk{ eyebrow, benefits },
  selfcheck{ eyebrow, h2Lead, h2Em, items[]{ n, p } },
  matchform{
    eyebrow, h2Lead, h2Em, lead,
    progress[]{ num, lb },
    options[]{ label, wide },
    back,
    steps[]{ title, hint },
    nextDefault, nextStep2, nextStep3,
    reassureLabel, pillAi, pillBook, trust
  },
  faq{
    eyebrow, title, ctaEyebrow, ctaBody, ctaBtn,
    items[]{ n, q, a }
  },
  final{ h2Lead, h2Em, p, cta, metrics }
}
`

// ── Zod boundary schema (lenient - the static FCTO is the fallback) ──────
const nzs = z.string().nullable().optional()
const zStrArr = z.array(z.string()).nullable().optional()

export const FractionalCtoPageSchema = z.object({
  _id: z.string(),
  _type: z.string(),
  metaTitle: nzs,
  metaDescription: nzs,
  hero: z
    .object({
      eyebrow: nzs,
      h1Lead: nzs,
      h1Em: nzs,
      sub: nzs,
      ctaPrimary: nzs,
      ctaGhost: nzs,
      trust: zStrArr,
      cards: z
        .array(
          z.object({
            role: nzs,
            days: nzs,
            name: nzs,
            cred: nzs,
            tags: zStrArr,
            left: nzs,
            top: nzs,
            rot: nzs,
            image: nzs,
          }),
        )
        .nullable()
        .optional(),
      statusPills: z
        .array(z.object({ label: nzs, icon: nzs, left: nzs, top: nzs }))
        .nullable()
        .optional(),
    })
    .nullable()
    .optional(),
  trusted: z
    .object({ label: nzs, logos: zStrArr, aiPill: nzs })
    .nullable()
    .optional(),
  video: z
    .object({
      eyebrow: nzs,
      title: nzs,
      videoUrl: nzs,
      poster: nzs,
      tag: nzs,
      name: nzs,
      role: nzs,
      play: nzs,
      timeStart: nzs,
      timeEnd: nzs,
      stateIdle: nzs,
      statePlaying: nzs,
    })
    .nullable()
    .optional(),
  does: z
    .object({
      eyebrow: nzs,
      title: nzs,
      cards: z.array(z.object({ h4: nzs, p: nzs })).nullable().optional(),
    })
    .nullable()
    .optional(),
  statement: z
    .object({ eyebrow: nzs, line1: nzs, line2: nzs, sub: nzs })
    .nullable()
    .optional(),
  matched: z
    .object({
      eyebrow: nzs,
      h2Lead: nzs,
      h2Em: nzs,
      topSub: nzs,
      feature: z.object({ h3: nzs, p: nzs, foot: nzs, image: nzs }).nullable().optional(),
      steps: z.array(z.object({ h4: nzs, p: nzs })).nullable().optional(),
    })
    .nullable()
    .optional(),
  derisk: z
    .object({ eyebrow: nzs, benefits: zStrArr })
    .nullable()
    .optional(),
  selfcheck: z
    .object({
      eyebrow: nzs,
      h2Lead: nzs,
      h2Em: nzs,
      items: z.array(z.object({ n: nzs, p: nzs })).nullable().optional(),
    })
    .nullable()
    .optional(),
  matchform: z
    .object({
      eyebrow: nzs,
      h2Lead: nzs,
      h2Em: nzs,
      lead: nzs,
      progress: z.array(z.object({ num: nzs, lb: nzs })).nullable().optional(),
      options: z
        .array(z.object({ label: nzs, wide: z.boolean().nullable().optional() }))
        .nullable()
        .optional(),
      back: nzs,
      steps: z.array(z.object({ title: nzs, hint: nzs })).nullable().optional(),
      nextDefault: nzs,
      nextStep2: nzs,
      nextStep3: nzs,
      reassureLabel: nzs,
      pillAi: nzs,
      pillBook: nzs,
      trust: zStrArr,
    })
    .nullable()
    .optional(),
  faq: z
    .object({
      eyebrow: nzs,
      title: nzs,
      ctaEyebrow: nzs,
      ctaBody: nzs,
      ctaBtn: nzs,
      items: z.array(z.object({ n: nzs, q: nzs, a: nzs })).nullable().optional(),
    })
    .nullable()
    .optional(),
  final: z
    .object({ h2Lead: nzs, h2Em: nzs, p: nzs, cta: nzs, metrics: zStrArr })
    .nullable()
    .optional(),
})

export type FractionalCtoPageData = z.infer<typeof FractionalCtoPageSchema>

// Returns the parsed singleton, or null when absent / invalid. sanityFetch
// dedupes within a request so generateMetadata and the page body both call it
// cheaply. The route casts into FctoContent and falls back to static FCTO.
export async function fetchFractionalCtoPage(): Promise<FractionalCtoPageData | null> {
  const { data } = await sanityFetch({ query: FRACTIONAL_CTO_QUERY })
  if (data === null || data === undefined) return null
  const result = FractionalCtoPageSchema.safeParse(data)
  if (!result.success) {
    console.warn(
      '[fractionalCtoPage] Sanity parse failed, falling back to static content:',
      result.error.message,
    )
    return null
  }
  return result.data
}

// Cast the lenient boundary shape into the template's content type, then repair
// the values that must NOT carry Sanity's stega encoding.
//
// In Presentation, stega injects invisible characters into every string so text
// is click-to-editable. That is correct for prose, but it corrupts strings used
// as CSS values or lookup keys: the hero card offsets/rotation and the status-
// pill icon/offsets would become invalid, collapsing the three cards into one.
// Those fields are code-owned + hidden in Studio, so we splice them straight
// from the static FCTO by index (keeping the editable text from Sanity). The
// video URL is editable, so it cannot be spliced - we stega-clean it instead so
// parseVideoUrl + the iframe src stay valid.
export function toFctoContent(data: FractionalCtoPageData): FctoContent {
  const c = data as unknown as FctoContent

  const hero: FctoContent['hero'] = c.hero
    ? {
        ...c.hero,
        // CE-68: the "Your match" panel is Sanity-owned now. It used to be
        // spliced from FCTO unconditionally, which meant the prices could not
        // be edited in Studio at all - changing three numbers needed a deploy.
        //
        // The fallback still matters. It covers a dataset seeded before this
        // field existed, and an editor who empties the tier list. Falling back
        // per-field rather than wholesale would let a half-filled panel render
        // with a heading and no prices, so the whole panel is taken from one
        // source or the other.
        match: c.hero.match?.rows?.length ? c.hero.match : FCTO.hero.match,
        cards: (c.hero.cards ?? []).map((card, i) => ({
          ...card,
          left: FCTO.hero.cards[i]?.left ?? card.left,
          top: FCTO.hero.cards[i]?.top ?? card.top,
          rot: FCTO.hero.cards[i]?.rot ?? card.rot,
        })),
        statusPills: (c.hero.statusPills ?? []).map((pill, i) => ({
          ...pill,
          icon: FCTO.hero.statusPills[i]?.icon ?? pill.icon,
          left: FCTO.hero.statusPills[i]?.left ?? pill.left,
          top: FCTO.hero.statusPills[i]?.top ?? pill.top,
        })),
      }
    : FCTO.hero

  const video: FctoContent['video'] = c.video
    ? {
        ...c.video,
        videoUrl:
          typeof c.video.videoUrl === 'string' ? stegaClean(c.video.videoUrl) : c.video.videoUrl,
      }
    : FCTO.video

  // Match-form eyebrow is code-owned for now (empty = hidden). Sanity still
  // holds the old "Ready to find…" string; do not let it win until Jake restores it.
  const matchform: FctoContent['matchform'] = {
    ...(c.matchform ?? FCTO.matchform),
    eyebrow: FCTO.matchform.eyebrow,
  }

  return { ...c, hero, video, matchform }
}

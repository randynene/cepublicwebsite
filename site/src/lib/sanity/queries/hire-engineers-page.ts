import 'server-only'

import { stegaClean } from '@sanity/client/stega'
import { z } from 'zod'

import { sanityFetch } from '@/lib/sanity/live'
import { HE, type HireEngineersContent } from '@/components/templates/hire-engineers/content'

// hireEngineersPage singleton fetch (routes /services/software-engineers + /uk).
// The GROQ projection is 1:1 with the HireEngineersContent shape the template
// consumes; every image field is dereferenced to a plain URL string (hero
// shortlist avatars, offer photo, sample-profile avatar, author avatar, proof
// image bands, match photos, form-side photo, tour poster), matching the
// template's <img src> usage. Zod is the lenient runtime contract; the route
// falls back to the code HE const when this returns null.
//
// Calculator: the three pricing option arrays (roleOptions / regionOptions /
// senOptions) double as the calculator's numeric-table lookup keys, so
// toHireEngineersContent() splices them from the code HE (they are seeded +
// hidden in Studio). The tour video URL is stega-cleaned before it reaches
// parseVideoUrl / the iframe src. Image asset URLs need no cleaning.

const HIRE_ENGINEERS_QUERY = /* groq */ `
*[_id == "hireEngineersPage"][0]{
  _id,
  _type,
  metaTitle,
  metaDescription,
  hero{
    eyebrow, h1Lead, h1Em, sub, ctaPrimary, ctaGhost, trust,
    card{ label, badge, per, foot, candidates[]{ av, nm, rl, rate, "image": image.asset->url } }
  },
  offer{
    eyebrow, h2Lead, h2Em, lead,
    cards[]{ h4, p },
    img{ tag, t, s, "image": image.asset->url }
  },
  roles{ eyebrow, h2Lead, h2Em, items[]{ rn, rd } },
  how{ eyebrow, h2Lead, h2Em, steps[]{ n, h4, p }, more },
  vet{
    eyebrow, h2Lead, h2Em,
    points[]{ h4, p },
    profile{ av, nm, rl, tabs, assessment, scores[]{ sn, w, sp }, openTitle, openBtn, "image": image.asset->url },
    tour, modalStrong, modalBody, tourVideoUrl, "tourPoster": tourPoster.asset->url
  },
  proof{
    eyebrow, h2Lead, h2Em, stat, quote, whoName, whoRole,
    "whoImage": whoImage.asset->url,
    sideImg{ tag, t, s, "image": image.asset->url },
    mini{ n, l },
    visitImg{ tag, t, s, "image": image.asset->url },
    note
  },
  price{
    eyebrow, h2Lead, h2Em, roleLabel, regionLabel, senLabel,
    roleOptions, regionOptions, senOptions,
    outLabel, initialCost, per, vsLabel, initialSave, cta, note
  },
  find{
    eyebrow, h2Lead, h2Em, lead,
    stepper[]{ num, lbl },
    step0{ q, hint, opts },
    step1{ q, hint, opts },
    step2{ q, hint, opts },
    step3{ q, hint, per, matches[]{ ftag, nm, rl, rate, "image": image.asset->url }, cta },
    footTrust, back, next,
    img{ tag, t, s, "image": image.asset->url },
    talkLabel, talkAi, talkBook
  },
  final{ h2Lead, h2Em, p, cta, sub }
}
`

// ── Zod boundary schema (lenient - the static HE is the fallback) ────────
const nzs = z.string().nullable().optional()
const nzn = z.number().nullable().optional()
const zStrArr = z.array(z.string()).nullable().optional()

const zImageSlot = z.object({ tag: nzs, t: nzs, s: nzs, image: nzs })
const zStepQuestion = z.object({ q: nzs, hint: nzs, opts: zStrArr })

export const HireEngineersPageSchema = z.object({
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
      card: z
        .object({
          label: nzs,
          badge: nzs,
          per: nzs,
          foot: nzs,
          candidates: z
            .array(z.object({ av: nzs, nm: nzs, rl: nzs, rate: nzs, image: nzs }))
            .nullable()
            .optional(),
        })
        .nullable()
        .optional(),
    })
    .nullable()
    .optional(),
  offer: z
    .object({
      eyebrow: nzs,
      h2Lead: nzs,
      h2Em: nzs,
      lead: nzs,
      cards: z.array(z.object({ h4: nzs, p: nzs })).nullable().optional(),
      img: zImageSlot.nullable().optional(),
    })
    .nullable()
    .optional(),
  roles: z
    .object({
      eyebrow: nzs,
      h2Lead: nzs,
      h2Em: nzs,
      items: z.array(z.object({ rn: nzs, rd: nzs })).nullable().optional(),
    })
    .nullable()
    .optional(),
  how: z
    .object({
      eyebrow: nzs,
      h2Lead: nzs,
      h2Em: nzs,
      steps: z.array(z.object({ n: nzs, h4: nzs, p: nzs })).nullable().optional(),
      more: nzs,
    })
    .nullable()
    .optional(),
  vet: z
    .object({
      eyebrow: nzs,
      h2Lead: nzs,
      h2Em: nzs,
      points: z.array(z.object({ h4: nzs, p: nzs })).nullable().optional(),
      profile: z
        .object({
          av: nzs,
          nm: nzs,
          rl: nzs,
          tabs: zStrArr,
          assessment: nzs,
          scores: z.array(z.object({ sn: nzs, w: nzn, sp: nzs })).nullable().optional(),
          openTitle: nzs,
          openBtn: nzs,
          image: nzs,
        })
        .nullable()
        .optional(),
      tour: nzs,
      modalStrong: nzs,
      modalBody: nzs,
      tourVideoUrl: nzs,
      tourPoster: nzs,
    })
    .nullable()
    .optional(),
  proof: z
    .object({
      eyebrow: nzs,
      h2Lead: nzs,
      h2Em: nzs,
      stat: nzs,
      quote: nzs,
      whoName: nzs,
      whoRole: nzs,
      whoImage: nzs,
      sideImg: zImageSlot.nullable().optional(),
      mini: z.object({ n: nzs, l: nzs }).nullable().optional(),
      visitImg: zImageSlot.nullable().optional(),
      note: nzs,
    })
    .nullable()
    .optional(),
  price: z
    .object({
      eyebrow: nzs,
      h2Lead: nzs,
      h2Em: nzs,
      roleLabel: nzs,
      regionLabel: nzs,
      senLabel: nzs,
      roleOptions: zStrArr,
      regionOptions: zStrArr,
      senOptions: zStrArr,
      outLabel: nzs,
      initialCost: nzs,
      per: nzs,
      vsLabel: nzs,
      initialSave: nzs,
      cta: nzs,
      note: nzs,
    })
    .nullable()
    .optional(),
  find: z
    .object({
      eyebrow: nzs,
      h2Lead: nzs,
      h2Em: nzs,
      lead: nzs,
      stepper: z.array(z.object({ num: nzs, lbl: nzs })).nullable().optional(),
      step0: zStepQuestion.nullable().optional(),
      step1: zStepQuestion.nullable().optional(),
      step2: zStepQuestion.nullable().optional(),
      step3: z
        .object({
          q: nzs,
          hint: nzs,
          per: nzs,
          matches: z
            .array(z.object({ ftag: nzs, nm: nzs, rl: nzs, rate: nzs, image: nzs }))
            .nullable()
            .optional(),
          cta: nzs,
        })
        .nullable()
        .optional(),
      footTrust: zStrArr,
      back: nzs,
      next: nzs,
      img: zImageSlot.nullable().optional(),
      talkLabel: nzs,
      talkAi: nzs,
      talkBook: nzs,
    })
    .nullable()
    .optional(),
  final: z
    .object({ h2Lead: nzs, h2Em: nzs, p: nzs, cta: nzs, sub: nzs })
    .nullable()
    .optional(),
})

export type HireEngineersPageData = z.infer<typeof HireEngineersPageSchema>

// Returns the parsed singleton, or null when absent / invalid. sanityFetch
// dedupes within a request so generateMetadata and the page body both call it
// cheaply. The route casts into HireEngineersContent and falls back to HE.
export async function fetchHireEngineersPage(): Promise<HireEngineersPageData | null> {
  const { data } = await sanityFetch({ query: HIRE_ENGINEERS_QUERY })
  if (data === null || data === undefined) return null
  const result = HireEngineersPageSchema.safeParse(data)
  if (!result.success) {
    console.warn(
      '[hireEngineersPage] Sanity parse failed, falling back to static content:',
      result.error.message,
    )
    return null
  }
  return result.data
}

// Cast the lenient boundary shape into the template's content type, then repair
// the values that must NOT carry Sanity's stega encoding or that are code-owned.
//
// The three pricing option arrays are the calculator's lookup keys (CALC in
// content.ts), so they are spliced from the code HE - a stega-encoded or edited
// key would miss the numeric table and break the maths. The tour video URL is
// editable, so it is stega-cleaned so parseVideoUrl + the iframe src stay valid.
// Image asset URLs do not need cleaning (homePage proves this).
export function toHireEngineersContent(data: HireEngineersPageData): HireEngineersContent {
  const c = data as unknown as HireEngineersContent

  const price: HireEngineersContent['price'] = c.price
    ? {
        ...c.price,
        roleOptions: HE.price.roleOptions,
        regionOptions: HE.price.regionOptions,
        senOptions: HE.price.senOptions,
      }
    : HE.price

  // The offer photo ships as a real file in /public. Sanity wins when Seb
  // uploads one; until then the code asset must survive the Sanity spread
  // (which would otherwise leave image undefined and show the placeholder).
  const offer: HireEngineersContent['offer'] = c.offer
    ? { ...c.offer, img: { ...c.offer.img, image: c.offer.img?.image || HE.offer.img.image } }
    : HE.offer

  const vet: HireEngineersContent['vet'] = c.vet
    ? {
        ...c.vet,
        tourVideoUrl:
          typeof c.vet.tourVideoUrl === 'string' ? stegaClean(c.vet.tourVideoUrl) : c.vet.tourVideoUrl,
      }
    : HE.vet

  return { ...c, offer, price, vet }
}

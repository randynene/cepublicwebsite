import 'server-only'

import { z } from 'zod'

import { sanityFetch } from '@/lib/sanity/live'
import type { LocationContent } from '@/components/templates/location/content'

// locationPage document fetch (route /services/<slug>). Bespoke regional hiring
// page. The GROQ projection is 1:1 with the LocationContent shape the template
// consumes. Every image is a Sanity image asset (WIRE-BESPOKE v2), so the
// projection dereferences each one to a plain URL string (hero cards, logos,
// video poster, on-the-ground photo, hub photos, engineer photos), matching the
// template's <img src> usage. Zod is the lenient runtime contract; the route
// falls back to the code registry when this returns null.
//
// Calculator: only the surrounding COPY comes from Sanity. The numeric config
// (roles, region multipliers, currency, comparison multiple, seniority) stays
// code-driven per the WIRE-BESPOKE brief, so toLocationContent() splices it in
// from the code fallback. Null/empty image URLs also coalesce from fallback.

// Logo image fragment: URL + intrinsic dimensions (same shape as homePage).
const LOGO_WH = `"src": image.asset->url, "width": image.asset->metadata.dimensions.width, "height": image.asset->metadata.dimensions.height`

const LOCATION_PAGE_QUERY = /* groq */ `
*[_type == "locationPage" && slug.current == $slug][0]{
  _id,
  _type,
  region,
  "slug": slug.current,
  metaTitle,
  metaDescription,
  logosLabelLines,
  logos[]{ name, ${LOGO_WH}, invert, "displayH": displayHeight, displayOpacity },
  hero{
    eyebrow, titleLead, titleConnector, titleAccent, paragraph, ctaPrimary, ctaSecondary,
    trustPills, floatingBadges,
    cards[]{ name, role, skills, flag, "image": image.asset->url }
  },
  advantage{
    eyebrow, titleLead, titleAccent, intro,
    cards[]{ eyebrow, title, body }
  },
  offer{
    eyebrow, titleLead, titleAccent, intro,
    cards[]{ title, body },
    "image": image.asset->url, "imageAlt": image.alt
  },
  video{ eyebrow, titleLead, titleAccent, intro, presenter, pullQuote, videoUrl, "image": image.asset->url },
  onGround{ eyebrow, titleLead, titleAccent, body, bullets, "image": image.asset->url },
  eor{
    eyebrow, titleLead, titleAccent, subhead, intro,
    items[]{ title, body }
  },
  included{
    eyebrow, titleLead, titleAccent,
    youLabel, you, youSubhead, youBody, youFootnote,
    weLabel, we, weSubhead, weBody, wePill,
    footnote
  },
  regionsStrip{
    title, retentionValue, retentionLabel,
    hubs[]{ city, note, "image": image.asset->url }
  },
  primaryHub{
    eyebrow, titleLead, titleAccent, bannerEyebrow, bannerTitle, bannerBody, "image": image.asset->url,
    secondaryEyebrow,
    secondary[]{ city, note, "image": image.asset->url }
  },
  engineers{
    titleLead, titleAccent, intro,
    profiles[]{ name, role, skills, years, bio, flag, "image": image.asset->url }
  },
  funFact{ eyebrow, body, source },
  calculator{
    eyebrow, titleLead, titleAccent, titleSuffix, resultEyebrow, savedPrefix,
    savingsSticker, savingsStickerSub, disclaimer
  },
  start{
    eyebrow, titleLead, titleAccent, variant,
    cards[]{ eyebrow, title, body, bullets, cta, ctaHref }
  },
  faq{
    eyebrow, title, helpEyebrow, helpBody, helpCta,
    items[]{ number, question, answer }
  }
}
`

// ── Zod boundary schema (lenient - the code registry is the fallback) ────
const nzs = z.string().nullable().optional()
const nzn = z.number().nullable().optional()
const zStrArr = z.array(z.string()).nullable().optional()

const zLogo = z.object({
  name: nzs,
  src: nzs,
  width: nzn,
  height: nzn,
  invert: z.boolean().nullable().optional(),
  displayH: nzn,
  displayOpacity: nzn,
})
const zHeroCard = z.object({
  name: nzs,
  role: nzs,
  skills: zStrArr,
  flag: nzs,
  image: nzs,
})
const zAdvantageCard = z.object({ eyebrow: nzs, title: nzs, body: nzs })
const zHubCard = z.object({ city: nzs, note: nzs, image: nzs })
const zEngineerProfile = z.object({
  name: nzs,
  role: nzs,
  skills: zStrArr,
  years: nzs,
  bio: nzs,
  flag: nzs,
  image: nzs,
})
const zStartCard = z.object({
  eyebrow: nzs,
  title: nzs,
  body: nzs,
  bullets: zStrArr,
  cta: nzs,
  ctaHref: nzs,
})
const zFaqItem = z.object({ number: nzs, question: nzs, answer: nzs })

export const LocationPageSchema = z.object({
  _id: z.string(),
  _type: z.string(),
  region: nzs,
  slug: nzs,
  metaTitle: nzs,
  metaDescription: nzs,
  logosLabelLines: zStrArr,
  logos: z.array(zLogo).nullable().optional(),
  hero: z
    .object({
      eyebrow: nzs,
      titleLead: nzs,
      titleConnector: nzs,
      titleAccent: nzs,
      paragraph: nzs,
      ctaPrimary: nzs,
      ctaSecondary: nzs,
      trustPills: zStrArr,
      floatingBadges: zStrArr,
      cards: z.array(zHeroCard).nullable().optional(),
    })
    .nullable()
    .optional(),
  advantage: z
    .object({
      eyebrow: nzs,
      titleLead: nzs,
      titleAccent: nzs,
      intro: nzs,
      cards: z.array(zAdvantageCard).nullable().optional(),
    })
    .nullable()
    .optional(),
  offer: z
    .object({
      eyebrow: nzs,
      titleLead: nzs,
      titleAccent: nzs,
      intro: nzs,
      cards: z.array(z.object({ title: nzs, body: nzs })).nullable().optional(),
      image: nzs,
      imageAlt: nzs,
    })
    .nullable()
    .optional(),
  video: z
    .object({
      eyebrow: nzs,
      titleLead: nzs,
      titleAccent: nzs,
      intro: nzs,
      presenter: nzs,
      pullQuote: nzs,
      videoUrl: nzs,
      image: nzs,
    })
    .nullable()
    .optional(),
  onGround: z
    .object({
      eyebrow: nzs,
      titleLead: nzs,
      titleAccent: nzs,
      body: nzs,
      bullets: zStrArr,
      image: nzs,
    })
    .nullable()
    .optional(),
  eor: z
    .object({
      eyebrow: nzs,
      titleLead: nzs,
      titleAccent: nzs,
      subhead: nzs,
      intro: nzs,
      items: z.array(z.object({ title: nzs, body: nzs })).nullable().optional(),
    })
    .nullable()
    .optional(),
  included: z
    .object({
      eyebrow: nzs,
      titleLead: nzs,
      titleAccent: nzs,
      youLabel: nzs,
      you: zStrArr,
      youSubhead: nzs,
      youBody: nzs,
      youFootnote: nzs,
      weLabel: nzs,
      we: zStrArr,
      weSubhead: nzs,
      weBody: nzs,
      wePill: nzs,
      footnote: nzs,
    })
    .nullable()
    .optional(),
  regionsStrip: z
    .object({
      title: nzs,
      retentionValue: nzs,
      retentionLabel: nzs,
      hubs: z.array(zHubCard).nullable().optional(),
    })
    .nullable()
    .optional(),
  primaryHub: z
    .object({
      eyebrow: nzs,
      titleLead: nzs,
      titleAccent: nzs,
      bannerEyebrow: nzs,
      bannerTitle: nzs,
      bannerBody: nzs,
      image: nzs,
      secondaryEyebrow: nzs,
      secondary: z.array(zHubCard).nullable().optional(),
    })
    .nullable()
    .optional(),
  engineers: z
    .object({
      titleLead: nzs,
      titleAccent: nzs,
      intro: nzs,
      profiles: z.array(zEngineerProfile).nullable().optional(),
    })
    .nullable()
    .optional(),
  funFact: z.object({ eyebrow: nzs, body: nzs, source: nzs }).nullable().optional(),
  calculator: z
    .object({
      eyebrow: nzs,
      titleLead: nzs,
      titleAccent: nzs,
      titleSuffix: nzs,
      resultEyebrow: nzs,
      savedPrefix: nzs,
      savingsSticker: nzs,
      savingsStickerSub: nzs,
      disclaimer: nzs,
    })
    .nullable()
    .optional(),
  start: z
    .object({
      eyebrow: nzs,
      titleLead: nzs,
      titleAccent: nzs,
      variant: z.enum(['cards', 'quiz', 'none']).nullable().optional(),
      cards: z.array(zStartCard).nullable().optional(),
    })
    .nullable()
    .optional(),
  faq: z
    .object({
      eyebrow: nzs,
      title: nzs,
      helpEyebrow: nzs,
      helpBody: nzs,
      helpCta: nzs,
      items: z.array(zFaqItem).nullable().optional(),
    })
    .nullable()
    .optional(),
})

export type LocationPageData = z.infer<typeof LocationPageSchema>

// Returns the parsed locationPage doc, or null when it is absent / fails to
// validate. sanityFetch dedupes within a request, so generateMetadata and the
// page body can both call this cheaply. The route casts the result into the
// template's LocationContent shape (splicing the code-driven calculator
// numerics) and falls back to the registry entry when this is null.
export async function fetchLocationPage(slug: string): Promise<LocationPageData | null> {
  const { data } = await sanityFetch({ query: LOCATION_PAGE_QUERY, params: { slug } })
  if (data === null || data === undefined) return null
  const result = LocationPageSchema.safeParse(data)
  if (!result.success) {
    console.warn(
      `[locationPage:${slug}] Sanity parse failed, falling back to static content:`,
      result.error.message,
    )
    return null
  }
  return result.data
}

function isEmptyImageValue(value: unknown): boolean {
  return value === null || value === undefined || value === ''
}

function isImageKey(key: string): boolean {
  return key === 'image' || key === 'src'
}

// Deep-merge Sanity data over the code fallback. For any `image` / `src` key
// (or nested object/array slot) that is null/undefined/empty in Sanity, take
// the fallback value at the same path. Arrays are merged index-by-index.
function coalesceImages<T>(sanity: T, fallback: T): T {
  if (isEmptyImageValue(sanity) && !isEmptyImageValue(fallback)) return fallback
  if (Array.isArray(sanity) && Array.isArray(fallback)) {
    const len = Math.max(sanity.length, fallback.length)
    const out: unknown[] = []
    for (let i = 0; i < len; i++) {
      const s = sanity[i]
      const f = fallback[i]
      if (s === undefined || s === null) {
        out.push(f)
      } else if (f === undefined) {
        out.push(s)
      } else {
        out.push(coalesceImages(s, f))
      }
    }
    return out as T
  }
  if (
    sanity &&
    fallback &&
    typeof sanity === 'object' &&
    typeof fallback === 'object' &&
    !Array.isArray(sanity) &&
    !Array.isArray(fallback)
  ) {
    const sObj = sanity as Record<string, unknown>
    const fObj = fallback as Record<string, unknown>
    const keys = new Set([...Object.keys(sObj), ...Object.keys(fObj)])
    const out: Record<string, unknown> = {}
    for (const key of keys) {
      const sVal = sObj[key]
      const fVal = fObj[key]
      if (isImageKey(key) && isEmptyImageValue(sVal) && !isEmptyImageValue(fVal)) {
        out[key] = fVal
      } else if (sVal === undefined) {
        out[key] = fVal
      } else if (fVal === undefined) {
        out[key] = sVal
      } else {
        out[key] = coalesceImages(sVal, fVal)
      }
    }
    return out as T
  }
  return (isEmptyImageValue(sanity) ? fallback : sanity) as T
}

// Stale-seed detector: v1 seeds stored string paths in image fields; after the
// v2 imageField upgrade GROQ `image.asset->url` returns null for every photo.
// When that happens the registry copy is the fidelity target (wrong hero names,
// missing regions strip, Mid-level calculator, etc. are all on the stale doc).
function isStaleImageSeed(data: LocationPageData): boolean {
  const cards = data.hero?.cards
  if (!cards?.length) return true
  return cards.every((c) => isEmptyImageValue(c.image))
}

// Cast the lenient boundary shape into the template's LocationContent type, and
// splice the calculator's numeric config back in from the code fallback (the
// registry entry) because calculator logic stays code-driven. Null/empty image
// URLs coalesce from the fallback. `region`/`slug` and the logo strip fall back
// to the code entry if unset.
export function toLocationContent(data: LocationPageData, fallback: LocationContent): LocationContent {
  // Broken/missing Sanity image assets → serve the locked registry content so
  // staging matches docs/raw-html until a fresh image seed lands.
  if (isStaleImageSeed(data)) {
    return {
      ...fallback,
      region: data.region ?? fallback.region,
      slug: data.slug ?? fallback.slug,
    }
  }

  const casted = data as unknown as LocationContent
  const merged = coalesceImages(casted, fallback)
  const logos = data.logos?.length ? merged.logos : fallback.logos
  const logosLabelLines = data.logosLabelLines?.length
    ? (data.logosLabelLines as string[])
    : fallback.logosLabelLines
  return {
    ...merged,
    region: data.region ?? fallback.region,
    slug: data.slug ?? fallback.slug,
    logosLabel: fallback.logosLabel,
    logosLabelLines,
    logos,
    // Hero visual mode (stack vs home-style slideshow) is code-driven — Studio
    // has no field for it, so a Sanity merge must not wipe the registry value.
    hero: {
      ...merged.hero,
      visual: fallback.hero.visual ?? 'stack',
      // Prefer Sanity cards when present; otherwise the registry slideshow /
      // stack list (EE needs every European roster face, not a truncated trio).
      // objectPosition is code-only (not in Studio) — stitch it back by name
      // so Anto's center-top crop survives a Sanity merge.
      cards: (() => {
        const cards = merged.hero?.cards?.length ? merged.hero.cards : fallback.hero.cards
        if (!fallback.hero.cards?.length) return cards
        const posByName = new Map(
          fallback.hero.cards
            .filter((c) => c.objectPosition)
            .map((c) => [c.name, c.objectPosition] as const),
        )
        if (posByName.size === 0) return cards
        return cards.map((c) => {
          const pos = posByName.get(c.name)
          return pos ? { ...c, objectPosition: pos } : c
        })
      })(),
    },
    // Empty Studio videoUrl must not wipe the registry Vimeo link (seed left
    // videoUrl blank on purpose; PH/EE now ship known Vimeo IDs in code).
    video: {
      ...merged.video,
      videoUrl: merged.video?.videoUrl?.trim() || fallback.video.videoUrl,
      videoSrc: merged.video?.videoSrc?.trim() || fallback.video.videoSrc,
    },
    // PH regions strip stays available from the registry when Sanity docs
    // predate that field.
    regionsStrip: merged.regionsStrip ?? fallback.regionsStrip,
    // CE-51. The primary-hub headline and banner copy is code-owned: the seeded
    // Sanity docs still name the old hub city (EE said Warsaw / "Eastern
    // Europe"), and a merge that let the doc win kept the stale copy on the
    // page. Photos and the secondary hub cards stay editable in Studio.
    primaryHub: {
      ...(merged.primaryHub ?? fallback.primaryHub),
      eyebrow: fallback.primaryHub.eyebrow,
      titleLead: fallback.primaryHub.titleLead,
      titleAccent: fallback.primaryHub.titleAccent,
      bannerEyebrow: fallback.primaryHub.bannerEyebrow,
      bannerTitle: fallback.primaryHub.bannerTitle,
      bannerBody: fallback.primaryHub.bannerBody,
    },
    // CE-57 "What you get". A doc that predates the field (or leaves the block
    // untouched) has no cards, so the registry copy is what renders - never a
    // half-empty section. Cards come as a whole set, not merged index-wise, so
    // removing one in Studio removes it on the page.
    offer: (() => {
      // Card count is read off the RAW doc: `merged` fills short arrays from the
      // fallback index-by-index, which would resurrect a card Seb deleted.
      if (!data.offer?.cards?.length) return fallback.offer
      const cards = data.offer.cards.map((c, i) => ({
        title: c.title ?? fallback.offer?.cards[i]?.title ?? '',
        body: c.body ?? fallback.offer?.cards[i]?.body ?? '',
      }))
      return merged.offer ? { ...merged.offer, cards } : undefined
    })(),
    // The start quiz is retired (LeadFormSection replaces it); 'quiz' and 'none'
    // both skip the Start block, so a legacy Sanity `variant: 'quiz'` needs no
    // dataset write. CTA destinations are code-owned as of 3 Aug: /start-hiring
    // is retired from marketing CTAs (→ /book-a-call or /contact). Remap any
    // Sanity leftover.
    start: {
      ...merged.start,
      variant: merged.start?.variant ?? fallback.start.variant,
      cards: (() => {
        const cards = merged.start?.cards?.length ? merged.start.cards : fallback.start.cards
        return cards.map((card, i) => {
          const fb = fallback.start.cards[i]
          if (!fb) return card
          if (!card.ctaHref?.includes('start-hiring')) return card
          return { ...card, ctaHref: fb.ctaHref, cta: fb.cta }
        })
      })(),
    },
    calculator: {
      ...merged.calculator,
      calcRegions: fallback.calculator.calcRegions,
      roles: fallback.calculator.roles,
      currency: fallback.calculator.currency,
      comparisonMultiple: fallback.calculator.comparisonMultiple,
      seniorityOptions: fallback.calculator.seniorityOptions,
    },
    // `hidden` is code-only (not in Studio) — preserve LATAM's temporary hide.
    engineers: {
      ...merged.engineers,
      hidden: fallback.engineers.hidden,
    },
  }
}

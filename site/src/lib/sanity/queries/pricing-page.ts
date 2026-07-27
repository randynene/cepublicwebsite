import 'server-only'

import { stegaClean } from '@sanity/client/stega'
import { z } from 'zod'

import { sanityFetch } from '@/lib/sanity/live'
import { PRICING_CONTENT } from '@/components/templates/pricing/content'
import type { PricingContent } from '@/components/templates/pricing/content'

// pricingPage singleton fetch (route /pricing + /uk/pricing). The GROQ
// projection mirrors the schema shape; toPricingContent reshapes it into the
// template's PricingContent (notably folding monthlyLow/monthlyHigh into the
// [low, high] tuples the calculator model expects). The route falls back to the
// static PRICING_CONTENT when this returns null.

const PRICING_QUERY = /* groq */ `
*[_id == "pricingPage"][0]{
  _id,
  metaTitle,
  metaDescription,
  hero{
    eyebrow, titleLead, titleAccent, paragraph,
    pills[]{ value, label },
    candidate{ name, role, vettedLabel, skills, flag, image, imageAlt }
  },
  calculator{
    eyebrow, titleLead, titleAccent, devCountLabel, countryPrompt, regionPrompt,
    currencyPrompt, ceCardTitle, ceLogo, ceBrand, localCardTitlePrefix, savingsNote, ceFootnote,
    localFootnote, toWord, perMonth, thatsPrefix, perHourSuffix, orYearSuffix,
    saveAvgPrefix, saveAvgYearSuffix, higherCostSuffix, breakdownShowLabel,
    breakdownHideLabel, breakdownEyebrow, breakdownIntroPrefix, breakdownIntroSuffix,
    breakdownTotalLabel, breakdownSavedTemplate, breakdownCta, breakdownCtaHref,
    model{
      regions[]{ id, label, monthlyLow, monthlyHigh },
      countries[]{ id, label, flag, monthlyLow, monthlyHigh },
      currencies[]{ id, label, symbol, rate },
      breakdownRole,
      breakdownRows[]{ label, desc, amount },
      hoursPerMonth
    }
  },
  benefits{ eyebrow, titleLead, titleAccent, cards[]{ title, body, icon } },
  fixedFee{ statement, bullets, cta, ctaHref, disclaimer },
  deRisk{ eyebrow, items },
  glassdoor{ rating, reviewsLabel, logo, wordmark },
  logoBar{ label, logos[]{ name, src, height } },
  testimonial{ eyebrow, titleLead, titleAccent, quote, stats[]{ value, label }, name, role, caption, companyLogo, videoUrl },
  faq{
    eyebrow, titleLead, titleAccent, helpEyebrow, helpBody, helpCta, helpCtaHref,
    items[]{ number, question, answer }
  }
}
`

const s = z.string().nullable().optional()
const n = z.number().nullable().optional()
const range = z.object({ id: s, label: s, flag: s, monthlyLow: n, monthlyHigh: n })

const PricingPageSchema = z.object({
  _id: z.string(),
  metaTitle: s,
  metaDescription: s,
  hero: z.unknown().nullable().optional(),
  calculator: z
    .object({ model: z.object({ regions: z.array(range).nullable().optional(), countries: z.array(range).nullable().optional() }).passthrough().nullable().optional() })
    .passthrough()
    .nullable()
    .optional(),
  benefits: z.unknown().nullable().optional(),
  fixedFee: z.unknown().nullable().optional(),
  deRisk: z.unknown().nullable().optional(),
  glassdoor: z.unknown().nullable().optional(),
  logoBar: z.unknown().nullable().optional(),
  testimonial: z.unknown().nullable().optional(),
  faq: z.unknown().nullable().optional(),
})

export type PricingPageDoc = z.infer<typeof PricingPageSchema>

export async function fetchPricingPage(): Promise<PricingPageDoc | null> {
  const { data } = await sanityFetch({ query: PRICING_QUERY })
  if (!data) return null
  const parsed = PricingPageSchema.safeParse(stegaClean(data))
  return parsed.success ? parsed.data : null
}

// Reshape the Sanity doc into the template's PricingContent. Any section the doc
// omits falls back to the corresponding PRICING_CONTENT section, so a partially
// filled document still renders. The only structural transform is the range
// tuple: schema stores monthlyLow/monthlyHigh, the model wants [low, high].
function toTuples<T extends { id?: string | null; label?: string | null; monthlyLow?: number | null; monthlyHigh?: number | null }>(
  rows: T[] | null | undefined,
  fallback: { id: string; label: string; ceMonthly?: [number, number]; localMonthly?: [number, number] }[],
  key: 'ceMonthly' | 'localMonthly',
) {
  if (!rows || rows.length === 0) return fallback
  return rows
    .filter((r) => r.id && r.label && typeof r.monthlyLow === 'number' && typeof r.monthlyHigh === 'number')
    .map((r) => ({ id: r.id as string, label: r.label as string, [key]: [r.monthlyLow as number, r.monthlyHigh as number], ...((r as { flag?: string }).flag ? { flag: (r as { flag?: string }).flag } : {}) }))
}

// GROQ returns an explicit null for any field the document has not filled in.
// Spreading those nulls over the static defaults would blank them, so unset keys
// are dropped before the merge.
function filled(obj: unknown): Record<string, unknown> {
  if (!obj || typeof obj !== 'object') return {}
  return Object.fromEntries(Object.entries(obj as Record<string, unknown>).filter(([, v]) => v !== null && v !== undefined))
}

export function toPricingContent(doc: PricingPageDoc): PricingContent {
  const base = PRICING_CONTENT
  const d = doc as unknown as Record<string, unknown>
  const merge = <K extends keyof PricingContent>(key: K): PricingContent[K] =>
    (d[key] ? { ...base[key], ...filled(d[key]) } : base[key]) as PricingContent[K]

  const calcDoc = (d.calculator ?? {}) as Record<string, unknown>
  const modelDoc = (calcDoc.model ?? {}) as Record<string, unknown>
  const baseModel = base.calculator.model

  const model = {
    ...baseModel,
    ...(modelDoc as object),
    regions: toTuples(modelDoc.regions as never, baseModel.regions, 'ceMonthly'),
    countries: toTuples(modelDoc.countries as never, baseModel.countries, 'localMonthly'),
    currencies:
      (modelDoc.currencies as never[])?.length ? (modelDoc.currencies as never) : baseModel.currencies,
    breakdownRows:
      (modelDoc.breakdownRows as never[])?.length ? (modelDoc.breakdownRows as never) : baseModel.breakdownRows,
    breakdownRole: (modelDoc.breakdownRole as string) || baseModel.breakdownRole,
    hoursPerMonth: (modelDoc.hoursPerMonth as number) || baseModel.hoursPerMonth,
  } as PricingContent['calculator']['model']

  return {
    hero: merge('hero'),
    calculator: { ...base.calculator, ...filled(calcDoc), model },
    benefits: merge('benefits'),
    fixedFee: merge('fixedFee'),
    deRisk: merge('deRisk'),
    glassdoor: merge('glassdoor'),
    logoBar: merge('logoBar'),
    testimonial: merge('testimonial'),
    faq: merge('faq'),
  }
}

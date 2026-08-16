import 'server-only'

import { z } from 'zod'

import type {
  HireEngineersMarketContent,
  MarketImageSlot,
} from '@/components/templates/hire-engineers-market/content-types'
import { sanityFetch } from '@/lib/sanity/live'

// hireUsEngineersPage / hireUkEngineersPage fetch.
//
// FOUR routes, TWO documents. Market and locale are different axes, so the
// US-market document backs both /services/hire-us-engineers and
// /uk/services/hire-us-engineers, and likewise for UK. The locale decides the
// chrome and the canonical, not which document is read.
//
// Design data (code-block indentation, bar percentages and tones, monograms,
// photo paths, the CSS market modifier, the brief-builder step count) is
// code-owned: seeded and hidden in Studio, then spliced back from the static
// content by index in the transform below. Editors own the words; the drawing
// stays with the design. Same posture as fractionalCtoPage.
//
// The route falls back to the static UHE / UKHE content when the document is
// absent or fails validation, so the page renders either way.

export type HireEngineersMarketDocId = 'hireUsEngineersPage' | 'hireUkEngineersPage'

const HIRE_ENGINEERS_MARKET_QUERY = /* groq */ `
*[_id == $id][0]{
  _id,
  _type,
  metaTitle,
  metaDescription,
  market,
  hero{
    eyebrow, h1Lead, h1Em, sub, ctaPrimary, ctaGhost, ticks,
    card{
      label, badge, foot, illustrative,
      profiles[]{ role, meta, stack, salary, salaryNote, initial }
    }
  },
  problem{
    eyebrow, h2, stat, body, gridCaption, floatCaption,
    floatCards[]{ role, note }
  },
  process{
    eyebrow, h2Lead, h2Em,
    stages[]{ n, eyebrow, h3, body, emphasis, pill, arrow },
    brief{
      label, role, note,
      requirements[]{ text, met },
      photo{ brief, label, image, alt }
    },
    code{
      title, live,
      lines[]{ text, indent, comment },
      rail[]{ brief, label, image, alt }
    },
    report{
      role, meta, open, initial, tabs, note,
      scores[]{ label, value, pct, tone }
    },
    funnel{ label, rows[]{ label, value, pct } }
  },
  derisk{ claims },
  differentiators{ eyebrow, h2Lead, h2Em, h2Tail, lead, cards[]{ h3, p } },
  intake{
    eyebrow, h2Lead, h2Em, lead, label, heading, stepLabel, stepCounter, stepCount,
    dropTitle, dropHint, pillGuided, pillSay, pillType,
    fileChosenLabel, fileRemoveLabel, fileNote, fileTypeError, fileSizeError,
    jobLabel, jobPlaceholder, helper,
    nameLabel, namePlaceholder, emailLabel, emailPlaceholder,
    consentNote, footNote, submit, submitting, errorRequired, errorEmail, caption
  },
  faq{
    eyebrow, titleLead, titleAccent,
    card{ h3, p, cta },
    items[]{ q, a, linkText, linkHref }
  },
  finalCta{ h2Lead, h2Em, lead, ctaPrimary, ctaGhost, foot }
}
`

// Every field is nullable/optional on purpose. A half-filled document must
// still parse: the transform then falls back per-section rather than throwing
// the whole page onto the static content because one string is missing.
const nzs = z.string().nullable().optional()
const nzn = z.number().nullable().optional()
const nzb = z.boolean().nullable().optional()
const nzsa = z.array(z.string()).nullable().optional()

function nullableArray<T extends z.ZodTypeAny>(inner: T) {
  return z.array(inner).nullable().optional()
}

const imageSlotSchema = z
  .object({ brief: nzs, label: nzs, image: nzs, alt: nzs })
  .nullable()
  .optional()

export const HireEngineersMarketPageSchema = z.object({
  _id: z.string(),
  _type: z.string(),
  metaTitle: nzs,
  metaDescription: nzs,
  market: nzs,
  hero: z
    .object({
      eyebrow: nzs,
      h1Lead: nzs,
      h1Em: nzs,
      sub: nzs,
      ctaPrimary: nzs,
      ctaGhost: nzs,
      ticks: nzsa,
      card: z
        .object({
          label: nzs,
          badge: nzs,
          foot: nzs,
          illustrative: nzs,
          profiles: nullableArray(
            z.object({
              role: nzs,
              meta: nzs,
              stack: nzsa,
              salary: nzs,
              salaryNote: nzs,
              initial: nzs,
            }),
          ),
        })
        .nullable()
        .optional(),
    })
    .nullable()
    .optional(),
  problem: z
    .object({
      eyebrow: nzs,
      h2: nzs,
      stat: nzs,
      body: nzs,
      gridCaption: nzs,
      floatCaption: nzs,
      floatCards: nullableArray(z.object({ role: nzs, note: nzs })),
    })
    .nullable()
    .optional(),
  process: z
    .object({
      eyebrow: nzs,
      h2Lead: nzs,
      h2Em: nzs,
      stages: nullableArray(
        z.object({
          n: nzs,
          eyebrow: nzs,
          h3: nzs,
          body: nzs,
          emphasis: nzs,
          pill: nzs,
          arrow: nzs,
        }),
      ),
      brief: z
        .object({
          label: nzs,
          role: nzs,
          note: nzs,
          requirements: nullableArray(z.object({ text: nzs, met: nzb })),
          photo: imageSlotSchema,
        })
        .nullable()
        .optional(),
      code: z
        .object({
          title: nzs,
          live: nzs,
          lines: nullableArray(z.object({ text: nzs, indent: nzn, comment: nzb })),
          rail: nullableArray(z.object({ brief: nzs, label: nzs, image: nzs, alt: nzs })),
        })
        .nullable()
        .optional(),
      report: z
        .object({
          role: nzs,
          meta: nzs,
          open: nzs,
          initial: nzs,
          tabs: nzsa,
          note: nzs,
          scores: nullableArray(z.object({ label: nzs, value: nzs, pct: nzn, tone: nzs })),
        })
        .nullable()
        .optional(),
      funnel: z
        .object({
          label: nzs,
          rows: nullableArray(z.object({ label: nzs, value: nzs, pct: nzn })),
        })
        .nullable()
        .optional(),
    })
    .nullable()
    .optional(),
  derisk: z.object({ claims: nzsa }).nullable().optional(),
  differentiators: z
    .object({
      eyebrow: nzs,
      h2Lead: nzs,
      h2Em: nzs,
      h2Tail: nzs,
      lead: nzs,
      cards: nullableArray(z.object({ h3: nzs, p: nzs })),
    })
    .nullable()
    .optional(),
  intake: z
    .object({
      eyebrow: nzs,
      h2Lead: nzs,
      h2Em: nzs,
      lead: nzs,
      label: nzs,
      heading: nzs,
      stepLabel: nzs,
      stepCounter: nzs,
      stepCount: nzn,
      dropTitle: nzs,
      dropHint: nzs,
      pillGuided: nzs,
      pillSay: nzs,
      pillType: nzs,
      fileChosenLabel: nzs,
      fileRemoveLabel: nzs,
      fileNote: nzs,
      fileTypeError: nzs,
      fileSizeError: nzs,
      jobLabel: nzs,
      jobPlaceholder: nzs,
      helper: nzs,
      nameLabel: nzs,
      namePlaceholder: nzs,
      emailLabel: nzs,
      emailPlaceholder: nzs,
      consentNote: nzs,
      footNote: nzs,
      submit: nzs,
      submitting: nzs,
      errorRequired: nzs,
      errorEmail: nzs,
      caption: nzs,
    })
    .nullable()
    .optional(),
  faq: z
    .object({
      eyebrow: nzs,
      titleLead: nzs,
      titleAccent: nzs,
      card: z.object({ h3: nzs, p: nzs, cta: nzs }).nullable().optional(),
      items: nullableArray(z.object({ q: nzs, a: nzs, linkText: nzs, linkHref: nzs })),
    })
    .nullable()
    .optional(),
  finalCta: z
    .object({
      h2Lead: nzs,
      h2Em: nzs,
      lead: nzs,
      ctaPrimary: nzs,
      ctaGhost: nzs,
      foot: nzs,
    })
    .nullable()
    .optional(),
})

export type HireEngineersMarketPageData = z.infer<typeof HireEngineersMarketPageSchema>

export async function fetchHireEngineersMarketPage(
  id: HireEngineersMarketDocId,
): Promise<HireEngineersMarketPageData | null> {
  const { data } = await sanityFetch({
    query: HIRE_ENGINEERS_MARKET_QUERY,
    params: { id },
  })
  if (data === null || data === undefined) return null
  const result = HireEngineersMarketPageSchema.safeParse(data)
  if (!result.success) {
    console.warn(
      `[${id}] Sanity parse failed, falling back to static content:`,
      result.error.message,
    )
    return null
  }
  return result.data
}

// -- Transform ----------------------------------------------------------

/** Sanity string wins only when it is a non-empty string. */
function pick(value: string | null | undefined, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback
}

/** Same rule for optional fields: an empty Sanity string means "not set". */
function pickOptional(
  value: string | null | undefined,
  fallback: string | undefined,
): string | undefined {
  if (typeof value === 'string' && value.trim()) return value
  return fallback
}

function pickList(value: readonly string[] | null | undefined, fallback: string[]): string[] {
  const cleaned = (value ?? []).filter((v): v is string => typeof v === 'string' && v.trim() !== '')
  return cleaned.length ? cleaned : fallback
}

/**
 * Zip a Sanity array against the static one.
 *
 * The static entry is the source of design data, so the merge is per-INDEX and
 * the static array decides the LENGTH. That is deliberate: these panels are
 * drawn to a fixed composition (three process stages, five funnel rows, two
 * shortlist profiles), and an editor adding a sixth row in Studio would push
 * the bar chart out of its track rather than produce a longer chart. Copy is
 * editable, arity is not.
 */
function zip<S, F>(sanity: readonly S[] | null | undefined, fallback: readonly F[], merge: (s: S | undefined, f: F) => F): F[] {
  return fallback.map((f, i) => merge(sanity?.[i], f))
}

function mergeImageSlot(
  s: { brief?: string | null; label?: string | null; image?: string | null; alt?: string | null } | null | undefined,
  f: MarketImageSlot,
): MarketImageSlot {
  const alt = pickOptional(s?.alt, f.alt)
  const label = pickOptional(s?.label, f.label)
  return {
    brief: pick(s?.brief, f.brief),
    // The photo path stays code-owned: the assets live in /public and are
    // referenced by the design, so Studio does not get to point it elsewhere.
    ...(f.image ? { image: f.image } : {}),
    ...(label ? { label } : {}),
    ...(alt ? { alt } : {}),
  }
}

export function toHireEngineersMarketContent(
  data: HireEngineersMarketPageData,
  fallback: HireEngineersMarketContent,
): HireEngineersMarketContent {
  const F = fallback

  return {
    // Pure CSS modifier. Never taken from Sanity.
    market: F.market,

    hero: {
      eyebrow: pick(data.hero?.eyebrow, F.hero.eyebrow),
      h1Lead: pick(data.hero?.h1Lead, F.hero.h1Lead),
      h1Em: pick(data.hero?.h1Em, F.hero.h1Em),
      sub: pick(data.hero?.sub, F.hero.sub),
      ctaPrimary: pick(data.hero?.ctaPrimary, F.hero.ctaPrimary),
      ctaGhost: pick(data.hero?.ctaGhost, F.hero.ctaGhost),
      ticks: pickList(data.hero?.ticks, F.hero.ticks),
      card: {
        label: pick(data.hero?.card?.label, F.hero.card.label),
        badge: pick(data.hero?.card?.badge, F.hero.card.badge),
        foot: pick(data.hero?.card?.foot, F.hero.card.foot),
        illustrative: pick(data.hero?.card?.illustrative, F.hero.card.illustrative),
        profiles: zip(data.hero?.card?.profiles, F.hero.card.profiles, (s, f) => ({
          role: pick(s?.role, f.role),
          meta: pick(s?.meta, f.meta),
          stack: pickList(s?.stack, f.stack),
          salary: pick(s?.salary, f.salary),
          salaryNote: pick(s?.salaryNote, f.salaryNote),
          initial: f.initial,
        })),
      },
    },

    problem: {
      eyebrow: pick(data.problem?.eyebrow, F.problem.eyebrow),
      h2: pick(data.problem?.h2, F.problem.h2),
      stat: pick(data.problem?.stat, F.problem.stat),
      body: pick(data.problem?.body, F.problem.body),
      gridCaption: pick(data.problem?.gridCaption, F.problem.gridCaption),
      floatCaption: pick(data.problem?.floatCaption, F.problem.floatCaption),
      floatCards: zip(data.problem?.floatCards, F.problem.floatCards, (s, f) => ({
        role: pick(s?.role, f.role),
        note: pick(s?.note, f.note),
      })),
    },

    process: {
      eyebrow: pick(data.process?.eyebrow, F.process.eyebrow),
      h2Lead: pick(data.process?.h2Lead, F.process.h2Lead),
      h2Em: pick(data.process?.h2Em, F.process.h2Em),
      stages: zip(data.process?.stages, F.process.stages, (s, f) => {
        const pill = pickOptional(s?.pill, f.pill)
        const arrow = pickOptional(s?.arrow, f.arrow)
        return {
          n: pick(s?.n, f.n),
          eyebrow: pick(s?.eyebrow, f.eyebrow),
          h3: pick(s?.h3, f.h3),
          body: pick(s?.body, f.body),
          emphasis: pick(s?.emphasis, f.emphasis),
          ...(pill ? { pill } : {}),
          ...(arrow ? { arrow } : {}),
        }
      }),
      brief: {
        label: pick(data.process?.brief?.label, F.process.brief.label),
        role: pick(data.process?.brief?.role, F.process.brief.role),
        note: pick(data.process?.brief?.note, F.process.brief.note),
        requirements: zip(
          data.process?.brief?.requirements,
          F.process.brief.requirements,
          (s, f) => ({
            text: pick(s?.text, f.text),
            met: typeof s?.met === 'boolean' ? s.met : f.met,
          }),
        ),
        photo: mergeImageSlot(data.process?.brief?.photo, F.process.brief.photo),
      },
      code: {
        title: pick(data.process?.code?.title, F.process.code.title),
        live: pick(data.process?.code?.live, F.process.code.live),
        lines: zip(data.process?.code?.lines, F.process.code.lines, (s, f) => ({
          text: pick(s?.text, f.text),
          // Indentation and comment colouring draw the block.
          indent: f.indent,
          comment: f.comment,
        })),
        rail: zip(data.process?.code?.rail, F.process.code.rail, (s, f) => mergeImageSlot(s, f)),
      },
      report: {
        role: pick(data.process?.report?.role, F.process.report.role),
        meta: pick(data.process?.report?.meta, F.process.report.meta),
        open: pick(data.process?.report?.open, F.process.report.open),
        initial: F.process.report.initial,
        tabs: pickList(data.process?.report?.tabs, F.process.report.tabs),
        note: pick(data.process?.report?.note, F.process.report.note),
        scores: zip(data.process?.report?.scores, F.process.report.scores, (s, f) => ({
          label: pick(s?.label, f.label),
          value: pick(s?.value, f.value),
          // Bar width and colour are design data.
          pct: f.pct,
          tone: f.tone,
        })),
      },
      funnel: {
        label: pick(data.process?.funnel?.label, F.process.funnel.label),
        rows: zip(data.process?.funnel?.rows, F.process.funnel.rows, (s, f) => ({
          label: pick(s?.label, f.label),
          value: pick(s?.value, f.value),
          pct: f.pct,
        })),
      },
    },

    derisk: { claims: pickList(data.derisk?.claims, F.derisk.claims) },

    differentiators: {
      eyebrow: pick(data.differentiators?.eyebrow, F.differentiators.eyebrow),
      h2Lead: pick(data.differentiators?.h2Lead, F.differentiators.h2Lead),
      h2Em: pick(data.differentiators?.h2Em, F.differentiators.h2Em),
      h2Tail: pick(data.differentiators?.h2Tail, F.differentiators.h2Tail),
      lead: pick(data.differentiators?.lead, F.differentiators.lead),
      cards: zip(data.differentiators?.cards, F.differentiators.cards, (s, f) => ({
        h3: pick(s?.h3, f.h3),
        p: pick(s?.p, f.p),
      })),
    },

    intake: {
      eyebrow: pick(data.intake?.eyebrow, F.intake.eyebrow),
      h2Lead: pick(data.intake?.h2Lead, F.intake.h2Lead),
      h2Em: pick(data.intake?.h2Em, F.intake.h2Em),
      lead: pick(data.intake?.lead, F.intake.lead),
      label: pick(data.intake?.label, F.intake.label),
      heading: pick(data.intake?.heading, F.intake.heading),
      stepLabel: pick(data.intake?.stepLabel, F.intake.stepLabel),
      stepCounter: pick(data.intake?.stepCounter, F.intake.stepCounter),
      // Drives the progress rail segment count, not the words.
      stepCount: F.intake.stepCount,
      dropTitle: pick(data.intake?.dropTitle, F.intake.dropTitle),
      dropHint: pick(data.intake?.dropHint, F.intake.dropHint),
      pillGuided: pick(data.intake?.pillGuided, F.intake.pillGuided),
      pillSay: pick(data.intake?.pillSay, F.intake.pillSay),
      pillType: pick(data.intake?.pillType, F.intake.pillType),
      fileChosenLabel: pick(data.intake?.fileChosenLabel, F.intake.fileChosenLabel),
      fileRemoveLabel: pick(data.intake?.fileRemoveLabel, F.intake.fileRemoveLabel),
      fileNote: pick(data.intake?.fileNote, F.intake.fileNote),
      fileTypeError: pick(data.intake?.fileTypeError, F.intake.fileTypeError),
      fileSizeError: pick(data.intake?.fileSizeError, F.intake.fileSizeError),
      jobLabel: pick(data.intake?.jobLabel, F.intake.jobLabel),
      jobPlaceholder: pick(data.intake?.jobPlaceholder, F.intake.jobPlaceholder),
      helper: pick(data.intake?.helper, F.intake.helper),
      nameLabel: pick(data.intake?.nameLabel, F.intake.nameLabel),
      namePlaceholder: pick(data.intake?.namePlaceholder, F.intake.namePlaceholder),
      emailLabel: pick(data.intake?.emailLabel, F.intake.emailLabel),
      emailPlaceholder: pick(data.intake?.emailPlaceholder, F.intake.emailPlaceholder),
      consentNote: pick(data.intake?.consentNote, F.intake.consentNote),
      footNote: pick(data.intake?.footNote, F.intake.footNote),
      submit: pick(data.intake?.submit, F.intake.submit),
      submitting: pick(data.intake?.submitting, F.intake.submitting),
      errorRequired: pick(data.intake?.errorRequired, F.intake.errorRequired),
      errorEmail: pick(data.intake?.errorEmail, F.intake.errorEmail),
      caption: pick(data.intake?.caption, F.intake.caption),
    },

    faq: {
      eyebrow: pick(data.faq?.eyebrow, F.faq.eyebrow),
      titleLead: pick(data.faq?.titleLead, F.faq.titleLead),
      titleAccent: pick(data.faq?.titleAccent, F.faq.titleAccent),
      card: {
        h3: pick(data.faq?.card?.h3, F.faq.card.h3),
        p: pick(data.faq?.card?.p, F.faq.card.p),
        cta: pick(data.faq?.card?.cta, F.faq.card.cta),
      },
      // FAQ items are the one array an editor can legitimately GROW: the
      // accordion has no fixed composition and the JSON-LD is generated from
      // whatever is here. So this list comes from Sanity when it has entries,
      // rather than being zipped against the static arity.
      items: (() => {
        const fromSanity = (data.faq?.items ?? [])
          .filter((it) => typeof it?.q === 'string' && it.q.trim() && typeof it?.a === 'string' && it.a.trim())
          .map((it) => {
            const linkText = pickOptional(it.linkText, undefined)
            const linkHref = pickOptional(it.linkHref, undefined)
            return {
              q: it.q as string,
              a: it.a as string,
              // A link is only rendered when BOTH halves are present AND the
              // link text really is a substring of the answer. If an editor
              // rewrites the answer and orphans the link text, the template
              // would otherwise fail to find it and silently drop the anchor
              // while the structured data still claimed it; dropping it here
              // keeps the two in agreement.
              ...(linkText && linkHref && (it.a as string).includes(linkText)
                ? { linkText, linkHref }
                : {}),
            }
          })
        return fromSanity.length ? fromSanity : F.faq.items
      })(),
    },

    finalCta: {
      h2Lead: pick(data.finalCta?.h2Lead, F.finalCta.h2Lead),
      h2Em: pick(data.finalCta?.h2Em, F.finalCta.h2Em),
      lead: pick(data.finalCta?.lead, F.finalCta.lead),
      ctaPrimary: pick(data.finalCta?.ctaPrimary, F.finalCta.ctaPrimary),
      ctaGhost: pick(data.finalCta?.ctaGhost, F.finalCta.ctaGhost),
      foot: pick(data.finalCta?.foot, F.finalCta.foot),
    },
  }
}

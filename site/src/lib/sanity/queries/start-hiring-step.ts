import 'server-only'

import { z } from 'zod'

import type { Locale } from '@/lib/locale'
import { sanityClient } from '@/lib/sanity/client'
import { sanityFetch } from '@/lib/sanity/live'
import { NOT_RETIRED } from '@/lib/sanity/queries/_filters'

// The /start-hiring lead-capture funnel.
//
// THE TWO LOCALES DO NOT RUN THE SAME FUNNEL, and the step numbering therefore
// differs between them:
//
//   UK: 9 steps. /uk/start-hiring/get-started is a real first page ("Let's Find
//       Your Developer", HubSpot form Part 1/8).
//   US: 8 steps. /start-hiring/get-started is a REDIRECT into contact-info.
//
// So `order` cannot be a number stored on the document — it is different in each
// locale. It is computed here, from the position of the step within the list its
// locale actually shows. The stored `order` only fixes the sequence; the number a
// visitor sees is derived.
//
// Assuming the locales matched is how the UK funnel silently lost its first page.

const StepRowSchema = z.object({
  _id: z.string(),
  heading: z.string(),
  slug: z.string(),
  lead: z.string().nullable().optional(),
  hubspotFormId: z.string().nullable().optional(),
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  ukOnly: z.boolean().nullable().optional(),
})

export type StartHiringStep = z.infer<typeof StepRowSchema> & {
  /** Position in THIS locale's funnel, from 1. */
  order: number
  /** Number of steps in THIS locale's funnel. */
  totalSteps: number
}

const ALL_STEPS_QUERY = /* groq */ `
*[_type == "startHiringStep" && defined(slug.current) && ${NOT_RETIRED}] | order(order asc){
  _id,
  heading,
  "slug": slug.current,
  lead,
  hubspotFormId,
  metaTitle,
  metaDescription,
  ukOnly
}
`

function stepsForLocale(rows: z.infer<typeof StepRowSchema>[], locale: Locale) {
  return locale === 'en-GB' ? rows : rows.filter((r) => r.ukOnly !== true)
}

export async function fetchStartHiringStep(
  slug: string,
  locale: Locale,
): Promise<StartHiringStep | null> {
  const { data } = await sanityFetch({ query: ALL_STEPS_QUERY })
  const rows = z.array(StepRowSchema).parse(data ?? [])

  const steps = stepsForLocale(rows, locale)
  const index = steps.findIndex((s) => s.slug === slug)
  if (index === -1) return null

  return { ...steps[index], order: index + 1, totalSteps: steps.length }
}

export async function fetchStartHiringStepParams(
  locale: Locale,
): Promise<{ step: string }[]> {
  const rows = z
    .array(StepRowSchema)
    .parse(await sanityClient.fetch(ALL_STEPS_QUERY))
  return stepsForLocale(rows, locale).map((s) => ({ step: s.slug }))
}

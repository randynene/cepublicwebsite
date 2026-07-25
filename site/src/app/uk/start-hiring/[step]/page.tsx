import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import StartHiringTemplate from '@/components/templates/start-hiring'
import { generateCanonical, generateHreflang } from '@/lib/locale'
import {
  fetchStartHiringStep,
  fetchStartHiringStepParams,
} from '@/lib/sanity/queries/start-hiring-step'

// /start-hiring/<step> (UK locale) — the 8-step lead-capture funnel.
//
// NOINDEX, and absent from the sitemap. That matches the live site, and it is
// correct on its own terms: these are mid-flow form pages, not content. Indexing
// them would put "Do you have a set monthly budget?" in the search results and
// drop people into the middle of a funnel they never started.

type RouteParams = { step: string }

export async function generateStaticParams(): Promise<RouteParams[]> {
  const steps = await fetchStartHiringStepParams('en-GB')
  if (steps.length < 9) {
    console.error(
      `[TEMPLATE-START_HIRING] generateStaticParams (UK locale): ${steps.length} steps (expected 9)`,
    )
  }
  return steps
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>
}): Promise<Metadata> {
  const { step: slug } = await params
  const step = await fetchStartHiringStep(slug, 'en-GB')
  if (!step) return {}

  const usPath = `/start-hiring/${slug}`

  return {
    title: step.metaTitle ?? step.heading,
    ...(step.metaDescription ? { description: step.metaDescription } : {}),
    robots: { index: false, follow: true },
    alternates: {
      canonical: generateCanonical(usPath, 'en-GB'),
      languages: generateHreflang(usPath),
    },
  }
}

export default async function StartHiringStepUkPage({
  params,
}: {
  params: Promise<RouteParams>
}) {
  const { step: slug } = await params
  const step = await fetchStartHiringStep(slug, 'en-GB')
  if (!step) notFound()

  return (
    <main id="main">
      <StartHiringTemplate step={step} />
    </main>
  )
}

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { CatalogueDetail } from '@/components/templates/catalogue/detail'
import { TechnologyJsonLd } from '@/components/templates/technology/json-ld'
import { mapTechnologyToContent } from '@/lib/catalogue/content'
import { generateCanonical, generateHreflang } from '@/lib/locale'
import { fetchAllTechnologySlugs, fetchTechnology, fetchTechnologyMeta } from '@/lib/sanity/queries/technology'
import { fetchSharedServiceFaqs } from '@/lib/sanity/queries/shared-faqs'
import { resolvePageTitle } from '@/lib/seo/page-title'

type RouteParams = { slug: string }

export async function generateStaticParams(): Promise<RouteParams[]> {
  // Only real Sanity technology slugs. The old hardcoded directory slugs
  // (e.g. `react` vs `react-developers`) are dropped so no duplicate URLs
  // exist; any unknown slug now 404s (see the default export).
  const sanity = await fetchAllTechnologySlugs()
  return sanity.map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<RouteParams> }): Promise<Metadata> {
  const { slug } = await params
  const usPath = `/technology/${slug}`
  const meta = await fetchTechnologyMeta(slug)
  if (!meta) return {}
  const metaTitle = meta.metaTitle?.trim()
  return {
    // metaTitle already carries the full live title (incl. "| Cloud Employee"),
    // so render it verbatim rather than letting the root layout append its
    // "%s | Cloud Employee" template and double-brand the page.
    title: resolvePageTitle(metaTitle ? metaTitle  : meta.technologyName),
    description: meta.metaDescription?.trim() || undefined,
    alternates: { canonical: generateCanonical(usPath, 'en-US'), languages: generateHreflang(usPath) },
  }
}

export default async function TechnologyDetailPage({ params }: { params: Promise<RouteParams> }) {
  const { slug } = await params
  const technology = await fetchTechnology(slug)
  if (!technology) notFound()

  const shared = await fetchSharedServiceFaqs()
  const content = mapTechnologyToContent(technology, shared)

  return (
    <>
      <TechnologyJsonLd technology={technology} locale="en-US" faqs={content.faqs} />
      <CatalogueDetail content={content} hireHref="/book-a-call" scheduleHref="/book-a-call" />
    </>
  )
}

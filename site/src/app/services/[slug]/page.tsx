import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { LocationTemplate } from '@/components/templates/location'
import { LocationJsonLd } from '@/components/templates/location/json-ld'
import { roleForServiceSlug } from '@/components/lead-form/section'
import { CatalogueDetail } from '@/components/templates/catalogue/detail'
import { ServiceJsonLd } from '@/components/templates/service/json-ld'
import { getLocationEntry, LOCATION_SLUGS } from '@/lib/location/registry'
import { fetchLocationPage, toLocationContent } from '@/lib/sanity/queries/location-page'
import { mapServiceToContent } from '@/lib/catalogue/content'
import { generateCanonical, generateHreflang } from '@/lib/locale'
import { fetchAllServiceSlugs, fetchService, fetchServiceMeta } from '@/lib/sanity/queries/service'
import { fetchSharedServiceFaqs } from '@/lib/sanity/queries/shared-faqs'
import { resolvePageTitle } from '@/lib/seo/page-title'

type RouteParams = { slug: string }

export async function generateStaticParams(): Promise<RouteParams[]> {
  // Only real Sanity service slugs + the bespoke location pages. The old
  // hardcoded short-slug variants are intentionally dropped so no duplicate
  // URLs exist; any unknown slug now 404s (see the default export).
  const sanity = await fetchAllServiceSlugs()
  const set = new Set(sanity.map((s) => s.slug))
  for (const s of LOCATION_SLUGS) set.add(s)
  return [...set].map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<RouteParams> }): Promise<Metadata> {
  const { slug } = await params
  const usPath = `/services/${slug}`

  const loc = getLocationEntry(slug)
  if (loc) {
    // Sanity-first, code registry as fallback (WIRE-BESPOKE).
    const data = await fetchLocationPage(slug)
    return {
      title: resolvePageTitle(data?.metaTitle ?? loc.metaTitle),
      description: data?.metaDescription ?? loc.metaDescription,
      alternates: { canonical: generateCanonical(usPath, 'en-US'), languages: generateHreflang(usPath) },
    }
  }

  const meta = await fetchServiceMeta(slug)
  if (!meta) return {}
  return {
    title: resolvePageTitle(meta.metaTitle?.trim() || meta.name),
    description: meta.metaDescription?.trim() || undefined,
    alternates: { canonical: generateCanonical(usPath, 'en-US'), languages: generateHreflang(usPath) },
  }
}

export default async function ServiceDefaultPage({ params }: { params: Promise<RouteParams> }) {
  const { slug } = await params

  // Location pages (Phase 3.3 / Decision D2) keep their bespoke template.
  // Sanity-first (WIRE-BESPOKE): fetch the locationPage doc, fall back to the
  // code registry content when the doc is absent or fails validation.
  const loc = getLocationEntry(slug)
  if (loc) {
    const data = await fetchLocationPage(slug)
    const content = data ? toLocationContent(data, loc.content) : loc.content
    const title = data?.metaTitle ?? loc.metaTitle
    const description = data?.metaDescription ?? loc.metaDescription
    return (
      <>
        <LocationJsonLd
          locale="en-US"
          path={`/services/${slug}`}
          title={title}
          description={description}
          faqItems={content.faq.items}
        />
        <LocationTemplate content={content} />
      </>
    )
  }

  const service = await fetchService(slug)
  if (!service) notFound()

  const shared = await fetchSharedServiceFaqs()
  const content = mapServiceToContent(service, shared)

  return (
    <>
      <ServiceJsonLd service={service} locale="en-US" faqs={content.faqs} />
      <CatalogueDetail
        content={content}
        hireHref="/book-a-call"
        leadForm={{
          sourcePage: `/services/${slug}`,
          prefillRole: roleForServiceSlug(slug),
        }}
      />
    </>
  )
}

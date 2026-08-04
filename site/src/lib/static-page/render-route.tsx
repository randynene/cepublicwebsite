import 'server-only'

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'

import type { BreadcrumbItem } from '@/components/shared/breadcrumbs'
import StaticPageTemplate from '@/components/templates/static-page'
import { buildLocalePath, generateCanonical, generateHreflang, type Locale } from '@/lib/locale'
import { fetchStaticPage, type StaticPageId } from '@/lib/sanity/queries/static-page'
import { urlFor } from '@/lib/sanity/image'
import { resolvePageTitle } from '@/lib/seo/page-title'

// Shared metadata + render for the static marketing pages, so that fourteen route
// files (7 pages x 2 locales) cannot drift apart on canonical tags, hreflang or
// breadcrumbs. Each route file is then a three-line shim naming its singleton.

// The pages a visitor only reaches AFTER converting. Live marks every one of them
// noindex and keeps them out of its sitemap, and it is right to: a page reading
// "thanks, your form has been submitted" has nothing to offer a searcher, and one
// that ranks is actively bad - it puts the end of the funnel in front of someone who
// has not entered it.
//
// /book-a-call is deliberately NOT here. It is a real landing page with a booking
// widget, it is indexable on live, and it is in live's sitemap.
//
// /price-comparison-calculator is noindex on live too, which looks like an oversight
// and is not: the canonical copy of that tool is /tools/price-comparison-calculator,
// and CE are avoiding competing with themselves for it. Mirrored rather than
// "corrected".
const NOINDEX: ReadonlySet<StaticPageId> = new Set<StaticPageId>([
  'bookACallConfirmedPage',
  'bookACallThankYouPage',
  'thankYouPage',
  'thankYouCultureMatchPage',
  'thankYouForYourMessagePage',
  'thankYouNowBookACallPage',
])

export async function buildStaticPageMetadata(
  id: StaticPageId,
  usPath: string,
  locale: Locale,
): Promise<Metadata> {
  const page = await fetchStaticPage(id)
  if (!page) return {}

  const noindex = NOINDEX.has(id)

  const rawTitle = page.metaTitle ?? page.title
  const title = resolvePageTitle(rawTitle)
  const canonical = generateCanonical(usPath, locale)
  const description = page.metaDescription ?? undefined

  const ogImage = page.heroImage?.asset
    ? urlFor(page.heroImage as Record<string, unknown>).width(1200).height(630).url()
    : null

  return {
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
    alternates: {
      canonical,
      languages: generateHreflang(usPath),
    },
    openGraph: {
      ...(rawTitle ? { title: rawTitle } : {}),
      ...(description ? { description } : {}),
      url: canonical,
      type: 'website',
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      ...(rawTitle ? { title: rawTitle } : {}),
      ...(description ? { description } : {}),
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  }
}

export async function renderStaticPage(
  id: StaticPageId,
  usPath: string,
  locale: Locale,
  breadcrumbName: string,
  options?: {
    showBreadcrumbs?: boolean
    calendlyOnly?: boolean
    /**
     * Extra content rendered inside <main>, after the static page body. Used by
     * the post-booking thank-you pages (CE-41) to add onward paths that the
     * static-page shape has no field for. Kept as a slot rather than baked in so
     * the other six static pages are untouched.
     */
    after?: ReactNode
  },
) {
  const page = await fetchStaticPage(id)

  // An empty page is not a page. This is what kept /legals/privacy-policy 404ing
  // for months — the singleton existed with a title and nothing else — and the
  // guard is right: shipping a blank marketing page is worse than 404ing one,
  // because a blank page gets indexed.
  //
  // A booking widget counts as content. /book-a-call is a headline over a Calendly
  // embed and carries no prose whatsoever, so a guard that only looks for words
  // would 404 a page whose entire purpose is the thing it is not looking at.
  const hasContent =
    page &&
    ((page.heroDescription?.length ?? 0) > 0 ||
      (page.sections?.length ?? 0) > 0 ||
      !!page.calendlyUrl)
  if (!hasContent) notFound()

  const breadcrumbs: BreadcrumbItem[] = [
    { name: 'Home', href: buildLocalePath('/', locale) },
    { name: breadcrumbName, href: buildLocalePath(usPath, locale) },
  ]

  return (
    <main id="main">
      <StaticPageTemplate
        page={page}
        breadcrumbs={breadcrumbs}
        showBreadcrumbs={options?.showBreadcrumbs}
        calendlyOnly={options?.calendlyOnly}
        tightBottom={Boolean(options?.after)}
      />
      {options?.after ?? null}
    </main>
  )
}

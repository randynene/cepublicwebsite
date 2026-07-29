import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import ReviewTemplate from '@/components/templates/review'
import { ReviewJsonLd } from '@/components/templates/review/json-ld'
import { generateCanonical, generateHreflang } from '@/lib/locale'
import { urlFor } from '@/lib/sanity/image'
import {
  fetchRelatedReviews,
  fetchReview,
  fetchReviewMeta,
  fetchReviewParams,
} from '@/lib/sanity/queries/review'
import { fetchSiteSettingsForJsonLd } from '@/lib/sanity/queries/site-settings'
import { resolvePageTitle } from '@/lib/seo/page-title'

type RouteParams = { slug: string }

export async function generateStaticParams(): Promise<RouteParams[]> {
  const slugs = await fetchReviewParams()
  if (slugs.length < 8) {
    console.error(
      `[TEMPLATE-REVIEW] generateStaticParams (default locale): ${slugs.length} routable paths (expected 8)`,
    )
  }
  return slugs
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>
}): Promise<Metadata> {
  const { slug } = await params
  const review = await fetchReviewMeta(slug)
  if (!review) return {}

  const usPath = `/reviews/${slug}`
  const canonical = generateCanonical(usPath, 'en-US')
  const hreflang = generateHreflang(usPath)

  const ogSource =
    review.thumbnailImage ?? review.memberImage ?? review.companyLogo
  const ogUrl = ogSource?.asset
    ? urlFor(ogSource).width(1200).height(630).url()
    : '/og-default.png'

  return {
    title: resolvePageTitle(review.metaTitle),
    description: review.metaDescription,
    alternates: { canonical, languages: hreflang },
    openGraph: {
      title: review.metaTitle,
      description: review.metaDescription,
      url: canonical,
      type: 'article',
      images: [ogUrl],
    },
    twitter: {
      card: 'summary_large_image',
      title: review.metaTitle,
      description: review.metaDescription,
      images: [ogUrl],
    },
  }
}

export default async function ReviewDefaultPage({
  params,
}: {
  params: Promise<RouteParams>
}) {
  const { slug } = await params
  const review = await fetchReview(slug)
  if (!review) notFound()

  const [relatedReviews, siteSettings] = await Promise.all([
    fetchRelatedReviews(slug),
    fetchSiteSettingsForJsonLd(),
  ])

  return (
    <main id="main">
      <ReviewJsonLd
        review={review}
        locale="en-US"
        siteSettings={siteSettings}
      />
      <ReviewTemplate
        review={review}
        relatedReviews={relatedReviews}
        locale="en-US"
      />
    </main>
  )
}

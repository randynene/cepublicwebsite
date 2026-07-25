import 'server-only'

import { toPlainText } from '@portabletext/toolkit'

import { env } from '@/lib/env'
import { generateCanonical, type Locale } from '@/lib/locale'
import { getReviewCompanyName } from '@/lib/review/display-name'
import { urlFor } from '@/lib/sanity/image'
import type { SiteSettingsJsonLd } from '@/lib/sanity/queries/site-settings'
import { serializeJsonLd } from '@/lib/seo/serialize-json-ld'
import type { Review } from '@/types/sanity/documents/review'

const FALLBACK_OG_PATH = '/og-default.png'
const REVIEW_RATING_VALUE = 5

interface JsonLdProps {
  review: Review
  locale: Locale
  siteSettings: SiteSettingsJsonLd | null
}

export function ReviewJsonLd({ review, locale, siteSettings }: JsonLdProps) {
  const reviewBlock = buildReviewJsonLd(review, locale, siteSettings)
  const breadcrumb = buildBreadcrumbListJsonLd(review, locale)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(reviewBlock) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumb) }}
      />
    </>
  )
}

function buildReviewBody(review: Review): string {
  if (Array.isArray(review.testimonyParagraph) && review.testimonyParagraph.length > 0) {
    return toPlainText(review.testimonyParagraph)
  }
  if (review.testimonyShort?.trim()) {
    return review.testimonyShort.trim()
  }
  if (review.snippetForMeta?.trim()) {
    return review.snippetForMeta.trim()
  }
  return ''
}

function buildReviewJsonLd(
  review: Review,
  locale: Locale,
  settings: SiteSettingsJsonLd | null,
) {
  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  const usPath = `/reviews/${review.slug}`
  const canonical = generateCanonical(usPath, locale)
  const reviewBody = buildReviewBody(review)

  const social = settings?.socialProof
  const orgName = social?.organizationName ?? settings?.siteName ?? 'Cloud Employee'
  const orgUrl = social?.organizationUrl ?? settings?.siteUrl ?? base

  const author: Record<string, unknown> = {
    '@type': 'Person',
    name: review.nameClient,
  }
  if (review.position) {
    author.jobTitle = review.position
  }
  if (review.memberImage?.asset) {
    author.image = urlFor(review.memberImage).width(400).height(400).url()
  }

  const json: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Review',
    '@id': `${canonical}#review`,
    url: canonical,
    itemReviewed: {
      '@type': 'Organization',
      name: orgName,
      url: orgUrl,
    },
    author,
    reviewRating: {
      '@type': 'Rating',
      ratingValue: REVIEW_RATING_VALUE,
      bestRating: REVIEW_RATING_VALUE,
    },
  }

  if (reviewBody) {
    json.reviewBody = reviewBody
  }

  return json
}

function buildBreadcrumbListJsonLd(review: Review, locale: Locale) {
  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  const localePrefix = locale === 'en-GB' ? '/uk' : ''
  const home = `${base}${localePrefix}/`
  const reviewsIndex = `${base}${localePrefix}/reviews`
  const detail = generateCanonical(`/reviews/${review.slug}`, locale)
  const companyName = getReviewCompanyName(review)

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: home },
      { '@type': 'ListItem', position: 2, name: 'Reviews', item: reviewsIndex },
      { '@type': 'ListItem', position: 3, name: companyName, item: detail },
    ],
  }
}

import 'server-only'

import { env } from '@/lib/env'
import { generateCanonical, type Locale } from '@/lib/locale'
import { urlFor } from '@/lib/sanity/image'
import { serializeJsonLd } from '@/lib/seo/serialize-json-ld'
import { UI_STRINGS } from '@/lib/ui-strings'
import type { CustomerStory } from '@/types/sanity/documents/customer-story'

interface JsonLdProps {
  story: CustomerStory
  locale: Locale
}

export function CustomerStoryJsonLd({ story, locale }: JsonLdProps) {
  const articleBlock = buildArticleJsonLd(story, locale)
  const breadcrumb = buildBreadcrumbListJsonLd(story, locale)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(articleBlock) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumb) }}
      />
    </>
  )
}

function buildArticleJsonLd(story: CustomerStory, locale: Locale) {
  const usPath = `/customer-story/${story.slug}`
  const canonical = generateCanonical(usPath, locale)

  // Article @type — a customer success story is editorial content. No author /
  // datePublished (schema has no field backing them); no Review / aggregateRating
  // (no rating data). Only fields the data actually backs are emitted.
  const json: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${canonical}#article`,
    url: canonical,
    headline: story.customerStoryTitle,
  }

  const description =
    story.metaDescription?.trim() || story.reviewSnippetForMeta?.trim() || ''
  if (description) {
    json.description = description
  }

  const imageSource =
    story.openGraphImage?.asset
      ? story.openGraphImage
      : story.thumbnail?.asset
        ? story.thumbnail
        : story.companyProductImage?.asset
          ? story.companyProductImage
          : story.companyPeopleImage?.asset
            ? story.companyPeopleImage
            : null
  if (imageSource?.asset) {
    json.image = urlFor(imageSource).width(1200).height(630).url()
  }

  return json
}

function buildBreadcrumbListJsonLd(story: CustomerStory, locale: Locale) {
  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  const localePrefix = locale === 'en-GB' ? '/uk' : ''
  const home = `${base}${localePrefix}/`
  // Detail route is singular (/customer-story/[slug]); the collection HUB is
  // plural (/customer-stories) per HUB_CONFIG + webflow-redirects.
  const hub = `${base}${localePrefix}/customer-stories`
  const detail = generateCanonical(`/customer-story/${story.slug}`, locale)

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: UI_STRINGS['breadcrumb.home'],
        item: home,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: UI_STRINGS['breadcrumb.customerStories'],
        item: hub,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: story.customerStoryTitle,
        item: detail,
      },
    ],
  }
}

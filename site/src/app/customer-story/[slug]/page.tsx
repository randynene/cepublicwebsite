import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import CustomerStoryTemplate from '@/components/templates/customer-story'
import { CustomerStoryJsonLd } from '@/components/templates/customer-story/json-ld'
import { generateCanonical, generateHreflang } from '@/lib/locale'
import { urlFor } from '@/lib/sanity/image'
import { resolvePageTitle } from '@/lib/seo/page-title'
import {
  fetchAllCustomerStorySlugs,
  fetchCustomerStory,
  fetchCustomerStoryMeta,
} from '@/lib/sanity/queries/customer-story'

type RouteParams = { slug: string }

export async function generateStaticParams(): Promise<RouteParams[]> {
  const slugs = await fetchAllCustomerStorySlugs()
  if (slugs.length < 17) {
    console.error(
      `[TEMPLATE-CUSTOMER-STORY] generateStaticParams (default locale): ${slugs.length} routable paths (expected 17)`,
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
  const story = await fetchCustomerStoryMeta(slug)
  if (!story) return {}

  const title = story.metaTitle ?? story.customerStoryTitle
  const description =
    story.metaDescription ?? story.reviewSnippetForMeta ?? undefined
  const usPath = `/customer-story/${slug}`
  const canonical = generateCanonical(usPath, 'en-US')
  const hreflang = generateHreflang(usPath)

  const imageSource =
    story.openGraphImage?.asset
      ? story.openGraphImage
      : story.thumbnail?.asset
        ? story.thumbnail
        : story.companyProductImage?.asset
          ? story.companyProductImage
          : null
  const ogUrl = imageSource
    ? urlFor(imageSource).width(1200).height(630).url()
    : '/og-default.png'

  return {
    title: resolvePageTitle(title),
    description,
    alternates: { canonical, languages: hreflang },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'article',
      images: [ogUrl],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogUrl],
    },
  }
}

export default async function CustomerStoryDefaultPage({
  params,
}: {
  params: Promise<RouteParams>
}) {
  const { slug } = await params
  const story = await fetchCustomerStory(slug)
  if (!story) notFound()

  return (
    <main id="main">
      <CustomerStoryJsonLd story={story} locale="en-US" />
      <CustomerStoryTemplate story={story} locale="en-US" />
    </main>
  )
}

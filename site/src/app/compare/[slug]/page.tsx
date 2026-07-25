import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import CompareTemplate from '@/components/templates/compare'
import { CompareJsonLd } from '@/components/templates/compare/json-ld'
import { generateCanonical, generateHreflang } from '@/lib/locale'
import { urlFor } from '@/lib/sanity/image'
import {
  fetchCompareBlog,
  fetchCompareBlogMeta,
  fetchCompareBlogParams,
} from '@/lib/sanity/queries/compare-blog'

type RouteParams = { slug: string }

export async function generateStaticParams(): Promise<RouteParams[]> {
  const slugs = await fetchCompareBlogParams()
  if (slugs.length < 27) {
    console.error(
      `[TEMPLATE-COMPARE] generateStaticParams (default locale): ${slugs.length} routable paths (expected 27)`,
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
  const post = await fetchCompareBlogMeta(slug)
  if (!post) return {}

  const usPath = `/compare/${slug}`
  const canonical = generateCanonical(usPath, 'en-US')
  const hreflang = generateHreflang(usPath)

  const ogUrl = post.thumbnailImage?.asset
    ? urlFor(post.thumbnailImage).width(1200).height(630).url()
    : '/og-default.png'

  return {
    title: post.metaTitle,
    description: post.metaDescription,
    alternates: { canonical, languages: hreflang },
    openGraph: {
      title: post.metaTitle,
      description: post.metaDescription,
      url: canonical,
      type: 'article',
      images: [ogUrl],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.metaTitle,
      description: post.metaDescription,
      images: [ogUrl],
    },
  }
}

export default async function CompareDefaultPage({
  params,
}: {
  params: Promise<RouteParams>
}) {
  const { slug } = await params
  const post = await fetchCompareBlog(slug)
  if (!post) notFound()

  return (
    <main id="main">
      <CompareJsonLd post={post} locale="en-US" />
      <CompareTemplate post={post} locale="en-US" />
    </main>
  )
}

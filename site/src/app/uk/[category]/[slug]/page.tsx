import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import BlogTemplate from '@/components/templates/blog'
import { generateCanonical, generateHreflang } from '@/lib/locale'
import { urlFor } from '@/lib/sanity/image'
import { resolvePageTitle } from '@/lib/seo/page-title'
import {
  fetchBlogPost,
  fetchBlogPostMeta,
  fetchBlogPostParams,
  fetchRelatedBlogPosts,
} from '@/lib/sanity/queries/blog-post'

// UK locale mirror — same document, same render, /uk/ prefix.
// Single-document strategy per TB4 + §8.x; locale derives from this route
// path only, never from the doc's `locale` field (filter dropped per TB19).

type RouteParams = { category: string; slug: string }

export async function generateStaticParams(): Promise<RouteParams[]> {
  const pairs = await fetchBlogPostParams()
  if (pairs.length < 70) {
    console.error(
      `[TEMPLATE-BLOG] generateStaticParams (UK locale): ${pairs.length} routable paths (expected 70)`,
    )
  }
  return pairs
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>
}): Promise<Metadata> {
  const { category, slug } = await params
  const post = await fetchBlogPostMeta(category, slug)
  if (!post) return {}

  const usPath = `/${category}/${slug}`
  const canonical = generateCanonical(usPath, 'en-GB')
  const hreflang = generateHreflang(usPath)

  const ogSource = post.openGraphImage ?? post.thumbnailImage
  const ogUrl = ogSource
    ? urlFor(ogSource).width(1200).height(630).url()
    : '/og-default.png'

  return {
    title: resolvePageTitle(post.metaTitle),
    description: post.metaDescription,
    alternates: { canonical, languages: hreflang },
    openGraph: {
      title: post.metaTitle,
      description: post.metaDescription,
      url: canonical,
      type: 'article',
      images: [ogUrl],
    },
  }
}

export default async function BlogPostUkPage({
  params,
}: {
  params: Promise<RouteParams>
}) {
  const { category, slug } = await params
  const post = await fetchBlogPost(category, slug)
  if (!post) notFound()
  const relatedPosts = await fetchRelatedBlogPosts(post.category._id, post.slug)
  return (
    // STATIC-1 Step 6 — wrap BlogTemplate (which renders <article>) in a
    // <main id="main"> landmark so the Header skip-link has a target on
    // every page sitewide.
    <main id="main">
      <BlogTemplate post={post} relatedPosts={relatedPosts} locale="en-GB" />
    </main>
  )
}

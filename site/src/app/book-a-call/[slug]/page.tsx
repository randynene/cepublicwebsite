import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import BookACallTemplate from '@/components/templates/book-a-call'
import { BookACallJsonLd } from '@/components/templates/book-a-call/json-ld'
import { generateCanonical, generateHreflang } from '@/lib/locale'
import { resolvePageTitle } from '@/lib/seo/page-title'
import {
  fetchBookACall,
  fetchBookACallMeta,
  fetchBookACallParams,
} from '@/lib/sanity/queries/book-a-call'

type RouteParams = { slug: string }

export async function generateStaticParams(): Promise<RouteParams[]> {
  const slugs = await fetchBookACallParams()
  if (slugs.length < 6) {
    console.error(
      `[TEMPLATE-BOOK_A_CALL] generateStaticParams (default locale): ${slugs.length} routable paths (expected 6)`,
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
  const page = await fetchBookACallMeta(slug)
  if (!page) return {}

  const usPath = `/book-a-call/${slug}`
  const canonical = generateCanonical(usPath, 'en-US')
  const hreflang = generateHreflang(usPath)

  return {
    title: resolvePageTitle(page.metaTitle),
    description: page.metaDescription,
    alternates: { canonical, languages: hreflang },
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      url: canonical,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: page.metaTitle,
      description: page.metaDescription,
    },
  }
}

export default async function BookACallDefaultPage({
  params,
}: {
  params: Promise<RouteParams>
}) {
  const { slug } = await params
  const page = await fetchBookACall(slug)
  if (!page) notFound()

  return (
    <main id="main">
      <BookACallJsonLd page={page} locale="en-US" />
      <BookACallTemplate page={page} locale="en-US" />
    </main>
  )
}

import 'server-only'

import { toPlainText } from '@portabletext/toolkit'
import type { TypedObject } from '@portabletext/types'

import { env } from '@/lib/env'
import { generateCanonical, type Locale } from '@/lib/locale'
import { urlFor } from '@/lib/sanity/image'
import { serializeJsonLd } from '@/lib/seo/serialize-json-ld'
import type { CompareBlog } from '@/types/sanity/documents/compare-blog'

const PUBLISHER_LOGO_PATH = '/og-default.png'

interface JsonLdProps {
  post: CompareBlog
  locale: Locale
}

export function CompareJsonLd({ post, locale }: JsonLdProps) {
  const blogPosting = buildBlogPostingJsonLd(post, locale)
  const breadcrumb = buildBreadcrumbListJsonLd(post, locale)
  const hasFaqs = Array.isArray(post.faqs) && post.faqs.length > 0
  const faqPage = hasFaqs ? buildFaqPageJsonLd(post.faqs!) : null

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(blogPosting) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumb) }}
      />
      {faqPage && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqPage) }}
        />
      )}
    </>
  )
}

function buildBlogPostingJsonLd(post: CompareBlog, locale: Locale) {
  const base = env.NEXT_PUBLIC_SITE_URL
  const path = `/compare/${post.slug}`
  const canonical = generateCanonical(path, locale)

  const ogSource = post.thumbnailImage
  const image = ogSource?.asset
    ? urlFor(ogSource).width(1200).height(630).url()
    : `${base}${PUBLISHER_LOGO_PATH}`

  const json: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${canonical}#blogposting`,
    headline: post.title,
    description: post.metaDescription,
    image,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    author: buildAuthor(post, base),
    publisher: {
      '@type': 'Organization',
      name: 'Cloud Employee',
      url: base,
      logo: { '@type': 'ImageObject', url: `${base}${PUBLISHER_LOGO_PATH}` },
    },
  }

  if (post.date) {
    json.datePublished = post.date
    json.dateModified = post.date
  }

  return json
}

function buildAuthor(post: CompareBlog, base: string) {
  if (post.author) {
    const person: Record<string, unknown> = {
      '@type': 'Person',
      name: post.author.name,
    }
    if (post.author.slug) {
      person.url = `${base}/team/${post.author.slug}`
    }
    return [person]
  }
  return [
    {
      '@type': 'Organization',
      name: 'Cloud Employee',
      url: base,
    },
  ]
}

function buildBreadcrumbListJsonLd(post: CompareBlog, locale: Locale) {
  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  const localePrefix = locale === 'en-GB' ? '/uk' : ''
  const home = `${base}${localePrefix}/`
  const compareHub = `${base}${localePrefix}/compare`
  const detail = generateCanonical(`/compare/${post.slug}`, locale)

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: home },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Compare',
        item: compareHub,
      },
      { '@type': 'ListItem', position: 3, name: post.title, item: detail },
    ],
  }
}

interface FaqItem {
  question: string
  answer: TypedObject[]
}

function buildFaqPageJsonLd(faqs: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.slice(0, 6).map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: toPlainText(faq.answer ?? []),
      },
    })),
  }
}

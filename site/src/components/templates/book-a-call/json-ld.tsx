import 'server-only'

import { env } from '@/lib/env'
import { generateCanonical, type Locale } from '@/lib/locale'
import { serializeJsonLd } from '@/lib/seo/serialize-json-ld'
import type { BookACall } from '@/types/sanity/documents/book-a-call'

interface JsonLdProps {
  page: BookACall
  locale: Locale
}

export function BookACallJsonLd({ page, locale }: JsonLdProps) {
  const webPage = buildWebPageJsonLd(page, locale)
  const breadcrumb = buildBreadcrumbListJsonLd(page, locale)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(webPage) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumb) }}
      />
    </>
  )
}

function buildWebPageJsonLd(page: BookACall, locale: Locale) {
  const usPath = `/book-a-call/${page.slug}`
  const canonical = generateCanonical(usPath, locale)
  const name = [page.firstName, page.lastName].filter(Boolean).join(' ')

  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${canonical}#webpage`,
    url: canonical,
    name: page.metaTitle,
    description: page.metaDescription,
    about: {
      '@type': 'Person',
      name,
    },
  }
}

function buildBreadcrumbListJsonLd(page: BookACall, locale: Locale) {
  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  const localePrefix = locale === 'en-GB' ? '/uk' : ''
  const home = `${base}${localePrefix}/`
  const detail = generateCanonical(`/book-a-call/${page.slug}`, locale)
  const name = [page.firstName, page.lastName].filter(Boolean).join(' ')

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: home },
      { '@type': 'ListItem', position: 2, name: name, item: detail },
    ],
  }
}

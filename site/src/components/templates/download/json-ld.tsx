import 'server-only'

import { toPlainText } from '@portabletext/toolkit'

import { env } from '@/lib/env'
import { generateCanonical, type Locale } from '@/lib/locale'
import { urlFor } from '@/lib/sanity/image'
import { serializeJsonLd } from '@/lib/seo/serialize-json-ld'
import type { Download } from '@/types/sanity/documents/download'

interface JsonLdProps {
  download: Download
  locale: Locale
}

export function DownloadJsonLd({ download, locale }: JsonLdProps) {
  const documentBlock = buildDigitalDocumentJsonLd(download, locale)
  const breadcrumb = buildBreadcrumbListJsonLd(download, locale)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(documentBlock) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumb) }}
      />
    </>
  )
}

function buildDownloadDescription(download: Download): string {
  if (download.metaDescription?.trim()) {
    return download.metaDescription.trim()
  }
  if (
    Array.isArray(download.mainDescription) &&
    download.mainDescription.length > 0
  ) {
    return toPlainText(download.mainDescription)
  }
  return ''
}

function buildDigitalDocumentJsonLd(download: Download, locale: Locale) {
  const usPath = `/download/${download.slug}`
  const canonical = generateCanonical(usPath, locale)
  const description = buildDownloadDescription(download)

  const imageSource =
    download.metaThumbnail?.asset
      ? download.metaThumbnail
      : download.headerFooterImage

  const json: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'DigitalDocument',
    '@id': `${canonical}#download`,
    url: canonical,
    name: download.name,
  }

  if (description) {
    json.description = description
  }
  if (imageSource?.asset) {
    json.thumbnailUrl = urlFor(imageSource).width(1200).height(630).url()
  }

  return json
}

function buildBreadcrumbListJsonLd(download: Download, locale: Locale) {
  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  const localePrefix = locale === 'en-GB' ? '/uk' : ''
  const home = `${base}${localePrefix}/`
  const downloadsIndex = `${base}${localePrefix}/downloads`
  const detail = generateCanonical(`/download/${download.slug}`, locale)

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: home },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Free Downloads',
        item: downloadsIndex,
      },
      { '@type': 'ListItem', position: 3, name: download.name, item: detail },
    ],
  }
}

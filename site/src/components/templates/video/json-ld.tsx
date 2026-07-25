import 'server-only'

import { toPlainText } from '@portabletext/toolkit'

import { env } from '@/lib/env'
import { generateCanonical, type Locale } from '@/lib/locale'
import { urlFor } from '@/lib/sanity/image'
import { serializeJsonLd } from '@/lib/seo/serialize-json-ld'
import type { Video } from '@/types/sanity/documents/video'

interface JsonLdProps {
  video: Video
  locale: Locale
}

export function VideoJsonLd({ video, locale }: JsonLdProps) {
  const videoBlock = buildVideoObjectJsonLd(video, locale)
  const breadcrumb = buildBreadcrumbListJsonLd(video, locale)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(videoBlock) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumb) }}
      />
    </>
  )
}

function buildVideoDescription(video: Video): string {
  if (video.metaDescription?.trim()) {
    return video.metaDescription.trim()
  }
  if (
    Array.isArray(video.descriptionOfVideo) &&
    video.descriptionOfVideo.length > 0
  ) {
    return toPlainText(video.descriptionOfVideo)
  }
  return ''
}

function buildVideoObjectJsonLd(video: Video, locale: Locale) {
  const usPath = `/videos/${video.slug}`
  const canonical = generateCanonical(usPath, locale)
  const description = buildVideoDescription(video)

  const json: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    '@id': `${canonical}#video`,
    url: canonical,
    name: video.name,
  }

  if (description) {
    json.description = description
  }
  if (video.backupImage?.asset) {
    json.thumbnailUrl = urlFor(video.backupImage).width(1200).height(630).url()
  }
  if (video.mainVideoEmbedLink) {
    json.embedUrl = video.mainVideoEmbedLink
  }

  return json
}

function buildBreadcrumbListJsonLd(video: Video, locale: Locale) {
  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  const localePrefix = locale === 'en-GB' ? '/uk' : ''
  const home = `${base}${localePrefix}/`
  const videosIndex = `${base}${localePrefix}/videos`
  const detail = generateCanonical(`/videos/${video.slug}`, locale)

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: home },
      { '@type': 'ListItem', position: 2, name: 'Videos', item: videosIndex },
      { '@type': 'ListItem', position: 3, name: video.name, item: detail },
    ],
  }
}

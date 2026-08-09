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

  // uploadDate (roadmap W1-02) is deliberately NOT emitted.
  //
  // Google flags "Missing field 'uploadDate'" on these VideoObjects, but there
  // is no genuine per-video date to emit. The Webflow videos collection did not
  // carry a publish date into the migration (see scripts/content/migrate-videos.ts:
  // no createdOn / lastPublished field is mapped), so Sanity holds none, and the
  // Webflow export under data/webflow/ has no per-video date either. The Sanity
  // system field _createdAt is the CONTENT-1B migration timestamp (2026), NOT the
  // publish date - emitting it would falsely declare every video as published in
  // 2026 when many are older. A wrong uploadDate is a false freshness claim to
  // Google and is worse than an absent one, so the property is omitted per
  // schema.org's rule that an absent optional field is valid.
  //
  // Closing W1-02 needs a content-side date backfill (an editorial uploadDate
  // field on the video document, populated per video), not a template change.
  // This is consistent with Tech Debt #54 (video metaTitle was likewise dropped
  // at migration). Once a real date field exists in Sanity, project it in
  // VIDEO_QUERY and emit it here as a full ISO 8601 datetime with UTC offset.

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

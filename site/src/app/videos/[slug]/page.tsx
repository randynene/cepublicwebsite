import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import VideoTemplate from '@/components/templates/video'
import { VideoJsonLd } from '@/components/templates/video/json-ld'
import { generateCanonical, generateHreflang } from '@/lib/locale'
import { urlFor } from '@/lib/sanity/image'
import {
  fetchVideo,
  fetchVideoMeta,
  fetchVideoParams,
} from '@/lib/sanity/queries/video'

type RouteParams = { slug: string }

export async function generateStaticParams(): Promise<RouteParams[]> {
  const slugs = await fetchVideoParams()
  if (slugs.length < 22) {
    console.error(
      `[TEMPLATE-VIDEO] generateStaticParams (default locale): ${slugs.length} routable paths (expected 22)`,
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
  const video = await fetchVideoMeta(slug)
  if (!video) return {}

  const title = video.metaTitle ?? video.name
  const usPath = `/videos/${slug}`
  const canonical = generateCanonical(usPath, 'en-US')
  const hreflang = generateHreflang(usPath)

  const ogUrl = video.backupImage?.asset
    ? urlFor(video.backupImage).width(1200).height(630).url()
    : '/og-default.png'

  return {
    title,
    description: video.metaDescription,
    alternates: { canonical, languages: hreflang },
    openGraph: {
      title,
      description: video.metaDescription,
      url: canonical,
      type: 'video.other',
      images: [ogUrl],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: video.metaDescription,
      images: [ogUrl],
    },
  }
}

export default async function VideoDefaultPage({
  params,
}: {
  params: Promise<RouteParams>
}) {
  const { slug } = await params
  const video = await fetchVideo(slug)
  if (!video) notFound()

  return (
    <main id="main">
      <VideoJsonLd video={video} locale="en-US" />
      <VideoTemplate video={video} locale="en-US" />
    </main>
  )
}

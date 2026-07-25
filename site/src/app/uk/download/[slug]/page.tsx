import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import DownloadTemplate from '@/components/templates/download'
import { DownloadJsonLd } from '@/components/templates/download/json-ld'
import { generateCanonical, generateHreflang } from '@/lib/locale'
import { urlFor } from '@/lib/sanity/image'
import {
  fetchDownload,
  fetchDownloadMeta,
  fetchDownloadParams,
} from '@/lib/sanity/queries/download'

type RouteParams = { slug: string }

export async function generateStaticParams(): Promise<RouteParams[]> {
  const slugs = await fetchDownloadParams()
  if (slugs.length < 2) {
    console.error(
      `[TEMPLATE-DOWNLOAD] generateStaticParams (UK locale): ${slugs.length} routable paths (expected 2)`,
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
  const download = await fetchDownloadMeta(slug)
  if (!download) return {}

  const title = download.metaTitle ?? download.name
  const usPath = `/download/${slug}`
  const canonical = generateCanonical(usPath, 'en-GB')
  const hreflang = generateHreflang(usPath)

  const ogSource =
    download.metaThumbnail?.asset
      ? download.metaThumbnail
      : download.headerFooterImage

  const ogUrl = ogSource?.asset
    ? urlFor(ogSource).width(1200).height(630).url()
    : '/og-default.png'

  return {
    title,
    description: download.metaDescription,
    alternates: { canonical, languages: hreflang },
    openGraph: {
      title,
      description: download.metaDescription,
      url: canonical,
      type: 'website',
      images: [ogUrl],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: download.metaDescription,
      images: [ogUrl],
    },
  }
}

export default async function DownloadUkPage({
  params,
}: {
  params: Promise<RouteParams>
}) {
  const { slug } = await params
  const download = await fetchDownload(slug)
  if (!download) notFound()

  return (
    <main id="main">
      <DownloadJsonLd download={download} locale="en-GB" />
      <DownloadTemplate download={download} locale="en-GB" />
    </main>
  )
}

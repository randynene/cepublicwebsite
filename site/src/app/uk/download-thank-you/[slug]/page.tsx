import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import DownloadThankYouTemplate from '@/components/templates/download-thank-you'
import {
  fetchDownloadAccess,
  fetchDownloadAccessMeta,
  fetchDownloadAccessParams,
} from '@/lib/sanity/queries/download-access'

type RouteParams = { slug: string }

export async function generateStaticParams(): Promise<RouteParams[]> {
  return fetchDownloadAccessParams()
}

// Private lead-magnet thank-you page — noindex, nofollow. No JSON-LD.
export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>
}): Promise<Metadata> {
  const { slug } = await params
  const download = await fetchDownloadAccessMeta(slug)
  return {
    title: download?.name,
    robots: { index: false, follow: false },
  }
}

export default async function DownloadThankYouUkPage({
  params,
}: {
  params: Promise<RouteParams>
}) {
  const { slug } = await params
  const download = await fetchDownloadAccess(slug)
  if (!download) notFound()

  return (
    <main id="main">
      <DownloadThankYouTemplate download={download} locale="en-GB" />
    </main>
  )
}

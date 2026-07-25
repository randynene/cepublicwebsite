import 'server-only'

import { sanityClient } from '@/lib/sanity/client'
import { sanityFetch } from '@/lib/sanity/live'
import { NOT_RETIRED } from '@/lib/sanity/queries/_filters'
import {
  DownloadMetaSchema,
  DownloadSchema,
  type Download,
  type DownloadMeta,
} from '@/types/sanity/documents/download'

export const DOWNLOAD_QUERY = /* groq */ `
*[_type == "download" && slug.current == $slug && ${NOT_RETIRED}][0]{
  _id,
  _type,
  name,
  "slug": slug.current,
  title,
  featured,
  comingSoon,
  "tags": tags[]->{name},
  mainDescription,
  headerFooterImage,
  button1Text,
  button1Link,
  button2Text,
  button2Link,
  youllGet,
  howToUseIt{
    videoThumbnail,
    "videoLink": coalesce(videoLink, videoUrl),
    title,
    description
  },
  theImpact{
    image,
    title,
    description
  },
  faqs,
  getItNow{
    title,
    description
  },
  metaTitle,
  metaDescription,
  metaThumbnail,
  hubspotFormId,
  locale
}
`

export const DOWNLOAD_META_QUERY = /* groq */ `
*[_type == "download" && slug.current == $slug && ${NOT_RETIRED}][0]{
  _id,
  name,
  "slug": slug.current,
  metaTitle,
  metaDescription,
  metaThumbnail,
  headerFooterImage
}
`

export const DOWNLOAD_PARAMS_QUERY = /* groq */ `
*[_type == "download" && defined(slug.current) && ${NOT_RETIRED}]{
  "slug": slug.current
}
`

export async function fetchDownload(slug: string): Promise<Download | null> {
  const { data } = await sanityFetch({
    query: DOWNLOAD_QUERY,
    params: { slug },
  })
  if (data === null || data === undefined) return null
  return DownloadSchema.parse(data)
}

export async function fetchDownloadMeta(
  slug: string,
): Promise<DownloadMeta | null> {
  const { data } = await sanityFetch({
    query: DOWNLOAD_META_QUERY,
    params: { slug },
  })
  if (data === null || data === undefined) return null
  return DownloadMetaSchema.parse(data)
}

type RawDownloadParam = { slug: string | null }

export async function fetchDownloadParams(): Promise<{ slug: string }[]> {
  const raw = await sanityClient.fetch<RawDownloadParam[]>(
    DOWNLOAD_PARAMS_QUERY,
  )
  return raw
    .filter((p): p is { slug: string } => !!p.slug)
    .map((p) => ({ slug: p.slug }))
}

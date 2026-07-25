import 'server-only'

import { sanityClient } from '@/lib/sanity/client'
import { sanityFetch } from '@/lib/sanity/live'
import { NOT_RETIRED } from '@/lib/sanity/queries/_filters'
import {
  DownloadAccessMetaSchema,
  DownloadAccessSchema,
  type DownloadAccess,
  type DownloadAccessMeta,
} from '@/types/sanity/documents/download-access'

export const DOWNLOAD_ACCESS_QUERY = /* groq */ `
*[_type == "downloadAccess" && slug.current == $slug && ${NOT_RETIRED}][0]{
  _id,
  _type,
  name,
  "slug": slug.current,
  downloadFileLink
}
`

export const DOWNLOAD_ACCESS_META_QUERY = /* groq */ `
*[_type == "downloadAccess" && slug.current == $slug && ${NOT_RETIRED}][0]{
  _id,
  name,
  "slug": slug.current
}
`

export const DOWNLOAD_ACCESS_PARAMS_QUERY = /* groq */ `
*[_type == "downloadAccess" && defined(slug.current) && ${NOT_RETIRED}]{
  "slug": slug.current
}
`

export async function fetchDownloadAccess(
  slug: string,
): Promise<DownloadAccess | null> {
  const { data } = await sanityFetch({
    query: DOWNLOAD_ACCESS_QUERY,
    params: { slug },
  })
  if (data === null || data === undefined) return null
  return DownloadAccessSchema.parse(data)
}

export async function fetchDownloadAccessMeta(
  slug: string,
): Promise<DownloadAccessMeta | null> {
  const { data } = await sanityFetch({
    query: DOWNLOAD_ACCESS_META_QUERY,
    params: { slug },
  })
  if (data === null || data === undefined) return null
  return DownloadAccessMetaSchema.parse(data)
}

type RawParam = { slug: string | null }

export async function fetchDownloadAccessParams(): Promise<{ slug: string }[]> {
  const raw = await sanityClient.fetch<RawParam[]>(DOWNLOAD_ACCESS_PARAMS_QUERY)
  return raw
    .filter((p): p is { slug: string } => !!p.slug)
    .map((p) => ({ slug: p.slug }))
}

import 'server-only'

import { sanityClient } from '@/lib/sanity/client'
import { sanityFetch } from '@/lib/sanity/live'
import { NOT_RETIRED } from '@/lib/sanity/queries/_filters'
import {
  VideoMetaSchema,
  VideoSchema,
  type Video,
  type VideoMeta,
} from '@/types/sanity/documents/video'

export const VIDEO_QUERY = /* groq */ `
*[_type == "video" && slug.current == $slug && ${NOT_RETIRED}][0]{
  _id,
  _type,
  name,
  "slug": slug.current,
  label,
  type,
  team,
  mainVideoEmbedLink,
  backupImage,
  descriptionOfVideo,
  fullVideoTranscript,
  linksMentionedInVideo,
  linkedinProfilesOfSpeakersInVideo,
  "tags": tags[]->{name},
  metaTitle,
  metaDescription,
  locale
}
`

export const VIDEO_META_QUERY = /* groq */ `
*[_type == "video" && slug.current == $slug && ${NOT_RETIRED}][0]{
  _id,
  name,
  "slug": slug.current,
  metaTitle,
  metaDescription,
  backupImage
}
`

export const VIDEO_PARAMS_QUERY = /* groq */ `
*[_type == "video" && defined(slug.current) && ${NOT_RETIRED}]{
  "slug": slug.current
}
`

export async function fetchVideo(slug: string): Promise<Video | null> {
  const { data } = await sanityFetch({
    query: VIDEO_QUERY,
    params: { slug },
  })
  if (data === null || data === undefined) return null
  return VideoSchema.parse(data)
}

export async function fetchVideoMeta(slug: string): Promise<VideoMeta | null> {
  const { data } = await sanityFetch({
    query: VIDEO_META_QUERY,
    params: { slug },
  })
  if (data === null || data === undefined) return null
  return VideoMetaSchema.parse(data)
}

type RawVideoParam = { slug: string | null }

export async function fetchVideoParams(): Promise<{ slug: string }[]> {
  const raw = await sanityClient.fetch<RawVideoParam[]>(VIDEO_PARAMS_QUERY)
  return raw
    .filter((p): p is { slug: string } => !!p.slug)
    .map((p) => ({ slug: p.slug }))
}

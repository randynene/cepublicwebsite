import 'server-only'

import { sanityClient } from '@/lib/sanity/client'
import { sanityFetch } from '@/lib/sanity/live'
import { NOT_RETIRED } from '@/lib/sanity/queries/_filters'
import {
  TechnologyMetaSchema,
  TechnologySchema,
  type Technology,
  type TechnologyMeta,
} from '@/types/sanity/documents/technology'

export const TECHNOLOGY_QUERY = /* groq */ `
*[_type == "technology" && slug.current == $slug && ${NOT_RETIRED}][0]{
  _id,
  _type,
  technologyName,
  "slug": slug.current,
  shortLabel,
  tagline,
  techLogo,
  thumbnail,
  listItemOnly,
  folds[]{
    _key,
    type,
    label,
    header,
    paragraph,
    bullets,
    items[]{
      _key,
      header,
      description
    },
    featuredImage
  },
  faqs[]{
    _key,
    question,
    answer
  },
  metaTitle,
  metaDescription,
  openGraphImage,
  locale
}
`

export const TECHNOLOGY_META_QUERY = /* groq */ `
*[_type == "technology" && slug.current == $slug && ${NOT_RETIRED}][0]{
  _id,
  technologyName,
  "slug": slug.current,
  metaTitle,
  metaDescription,
  openGraphImage,
  thumbnail,
  techLogo
}
`

// listItemOnly is NOT filtered here, deliberately.
//
// The one listItemOnly technology (android-studio) was previously excluded from
// routing on the assumption that it has no page. It does: Webflow serves
// /technology/android-studio with a 200. What Webflow actually does is keep it
// out of the sitemap while still serving the URL, so excluding it here would 404
// a live page and drop any links pointing at it.
//
// We mirror Webflow exactly: routed and reachable, but absent from the sitemap.
// The sitemap-side filter lives in site/src/app/sitemap.ts, which is the only
// place listItemOnly is still applied.
export const TECHNOLOGY_PARAMS_QUERY = /* groq */ `
*[_type == "technology" && defined(slug.current) && ${NOT_RETIRED}]{
  "slug": slug.current
}
`

export async function fetchTechnology(slug: string): Promise<Technology | null> {
  const { data } = await sanityFetch({
    query: TECHNOLOGY_QUERY,
    params: { slug },
  })
  if (data === null || data === undefined) return null
  return TechnologySchema.parse(data)
}

export async function fetchTechnologyMeta(
  slug: string,
): Promise<TechnologyMeta | null> {
  const { data } = await sanityFetch({
    query: TECHNOLOGY_META_QUERY,
    params: { slug },
  })
  if (data === null || data === undefined) return null
  return TechnologyMetaSchema.parse(data)
}

type RawTechnologyParam = { slug: string | null }

export async function fetchAllTechnologySlugs(): Promise<{ slug: string }[]> {
  const raw = await sanityClient.fetch<RawTechnologyParam[]>(
    TECHNOLOGY_PARAMS_QUERY,
  )
  return raw
    .filter((p): p is { slug: string } => !!p.slug)
    .map((p) => ({ slug: p.slug }))
}

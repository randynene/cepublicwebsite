import 'server-only'

import { sanityClient } from '@/lib/sanity/client'
import { sanityFetch } from '@/lib/sanity/live'
import { NOT_RETIRED } from '@/lib/sanity/queries/_filters'
import {
  ServiceMetaSchema,
  ServiceSchema,
  type Service,
  type ServiceMeta,
} from '@/types/sanity/documents/service'

export const SERVICE_QUERY = /* groq */ `
*[_type == "service" && slug.current == $slug && ${NOT_RETIRED}][0]{
  _id,
  _type,
  name,
  "slug": slug.current,
  type,
  prefix,
  shortLabel,
  tagline,
  thumbnail,
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
  "associatedTechnologies": associatedTechnologies[]->{
    "name": technologyName,
    "slug": slug.current,
    "sub": shortLabel,
    techLogo
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

export const SERVICE_META_QUERY = /* groq */ `
*[_type == "service" && slug.current == $slug && ${NOT_RETIRED}][0]{
  _id,
  name,
  "slug": slug.current,
  type,
  metaTitle,
  metaDescription,
  openGraphImage,
  thumbnail
}
`

export const SERVICE_PARAMS_QUERY = /* groq */ `
*[_type == "service" && defined(slug.current) && ${NOT_RETIRED}]{
  "slug": slug.current
}
`

export async function fetchService(slug: string): Promise<Service | null> {
  const { data } = await sanityFetch({
    query: SERVICE_QUERY,
    params: { slug },
  })
  if (data === null || data === undefined) return null
  return ServiceSchema.parse(data)
}

export async function fetchServiceMeta(slug: string): Promise<ServiceMeta | null> {
  const { data } = await sanityFetch({
    query: SERVICE_META_QUERY,
    params: { slug },
  })
  if (data === null || data === undefined) return null
  return ServiceMetaSchema.parse(data)
}

type RawServiceParam = { slug: string | null }

export async function fetchAllServiceSlugs(): Promise<{ slug: string }[]> {
  const raw = await sanityClient.fetch<RawServiceParam[]>(SERVICE_PARAMS_QUERY)
  return raw
    .filter((p): p is { slug: string } => !!p.slug)
    .map((p) => ({ slug: p.slug }))
}

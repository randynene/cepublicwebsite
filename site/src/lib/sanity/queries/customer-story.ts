import 'server-only'

import { sanityClient } from '@/lib/sanity/client'
import { sanityFetch } from '@/lib/sanity/live'
import { NOT_RETIRED } from '@/lib/sanity/queries/_filters'
import {
  CustomerStoryMetaSchema,
  CustomerStorySchema,
  type CustomerStory,
  type CustomerStoryMeta,
} from '@/types/sanity/documents/customer-story'

export const CUSTOMER_STORY_QUERY = /* groq */ `
*[_type == "customerStory" && slug.current == $slug && ${NOT_RETIRED}][0]{
  _id,
  _type,
  customerStoryTitle,
  companyName,
  "slug": slug.current,
  companyLogo,
  companyProductImage,
  companyPeopleImage,
  thumbnail,
  videoUrl,
  videoIntroContent,
  tldrContent,
  hiringNeedsTable,
  theCustomerContent,
  problem,
  solution,
  impact,
  ctaContent,
  reviewSnippetForMeta,
  metaTitle,
  metaDescription,
  openGraphImage,
  locale
}
`

export const CUSTOMER_STORY_META_QUERY = /* groq */ `
*[_type == "customerStory" && slug.current == $slug && ${NOT_RETIRED}][0]{
  _id,
  customerStoryTitle,
  companyName,
  "slug": slug.current,
  metaTitle,
  metaDescription,
  reviewSnippetForMeta,
  openGraphImage,
  thumbnail,
  companyProductImage
}
`

export const CUSTOMER_STORY_PARAMS_QUERY = /* groq */ `
*[_type == "customerStory" && defined(slug.current) && ${NOT_RETIRED}]{
  "slug": slug.current
}
`

export async function fetchCustomerStory(
  slug: string,
): Promise<CustomerStory | null> {
  const { data } = await sanityFetch({
    query: CUSTOMER_STORY_QUERY,
    params: { slug },
  })
  if (data === null || data === undefined) return null
  return CustomerStorySchema.parse(data)
}

export async function fetchCustomerStoryMeta(
  slug: string,
): Promise<CustomerStoryMeta | null> {
  const { data } = await sanityFetch({
    query: CUSTOMER_STORY_META_QUERY,
    params: { slug },
  })
  if (data === null || data === undefined) return null
  return CustomerStoryMetaSchema.parse(data)
}

type RawCustomerStoryParam = { slug: string | null }

export async function fetchAllCustomerStorySlugs(): Promise<{ slug: string }[]> {
  const raw = await sanityClient.fetch<RawCustomerStoryParam[]>(
    CUSTOMER_STORY_PARAMS_QUERY,
  )
  return raw
    .filter((p): p is { slug: string } => !!p.slug)
    .map((p) => ({ slug: p.slug }))
}

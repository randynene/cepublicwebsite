import 'server-only'

import { sanityClient } from '@/lib/sanity/client'
import { sanityFetch } from '@/lib/sanity/live'
import { NOT_RETIRED } from '@/lib/sanity/queries/_filters'
import {
  RelatedReviewSchema,
  ReviewMetaSchema,
  ReviewSchema,
  type RelatedReview,
  type Review,
  type ReviewMeta,
} from '@/types/sanity/documents/review'

export const REVIEW_QUERY = /* groq */ `
*[_type == "review" && slug.current == $slug && ${NOT_RETIRED}][0]{
  _id,
  _type,
  nameClient,
  "slug": slug.current,
  position,
  order,
  testimonyShort,
  testimonyParagraph,
  testimonyFullPage,
  snippetForMeta,
  memberImage,
  companyLogo,
  thumbnailImage,
  additionalInfo,
  locale,
  metaTitle,
  metaDescription
}
`

export const REVIEW_META_QUERY = /* groq */ `
*[_type == "review" && slug.current == $slug && ${NOT_RETIRED}][0]{
  _id,
  nameClient,
  "slug": slug.current,
  metaTitle,
  metaDescription,
  thumbnailImage,
  memberImage,
  companyLogo
}
`

export const RELATED_REVIEWS_QUERY = /* groq */ `
*[_type == "review"
  && slug.current != $slug
  && defined(slug.current)
  && ${NOT_RETIRED}
] | order(coalesce(order, 9999) asc, nameClient asc) [0...3] {
  _id,
  nameClient,
  "slug": slug.current,
  position,
  testimonyShort,
  memberImage,
  companyLogo
}
`

export const REVIEW_PARAMS_QUERY = /* groq */ `
*[_type == "review" && defined(slug.current) && ${NOT_RETIRED}]{
  "slug": slug.current
}
`

export async function fetchReview(slug: string): Promise<Review | null> {
  const { data } = await sanityFetch({
    query: REVIEW_QUERY,
    params: { slug },
  })
  if (data === null || data === undefined) return null
  return ReviewSchema.parse(data)
}

export async function fetchReviewMeta(slug: string): Promise<ReviewMeta | null> {
  const { data } = await sanityFetch({
    query: REVIEW_META_QUERY,
    params: { slug },
  })
  if (data === null || data === undefined) return null
  return ReviewMetaSchema.parse(data)
}

export async function fetchRelatedReviews(
  slug: string,
): Promise<RelatedReview[]> {
  const { data } = await sanityFetch({
    query: RELATED_REVIEWS_QUERY,
    params: { slug },
  })
  if (!Array.isArray(data)) return []
  return data.map((item) => RelatedReviewSchema.parse(item))
}

type RawReviewParam = { slug: string | null }

export async function fetchReviewParams(): Promise<{ slug: string }[]> {
  const raw = await sanityClient.fetch<RawReviewParam[]>(REVIEW_PARAMS_QUERY)
  return raw
    .filter((p): p is { slug: string } => !!p.slug)
    .map((p) => ({ slug: p.slug }))
}

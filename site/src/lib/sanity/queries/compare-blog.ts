import 'server-only'

import { sanityClient } from '@/lib/sanity/client'
import { sanityFetch } from '@/lib/sanity/live'
import { NOT_RETIRED } from '@/lib/sanity/queries/_filters'
import {
  CompareBlogMetaSchema,
  CompareBlogSchema,
  type CompareBlog,
  type CompareBlogMeta,
} from '@/types/sanity/documents/compare-blog'

export const COMPARE_BLOG_QUERY = /* groq */ `
*[_type == "compareBlog" && slug.current == $slug && ${NOT_RETIRED}][0]{
  _id,
  _type,
  title,
  "slug": slug.current,
  competitor,
  "tags": tags[]->{ _id, name },
  author->{
    _id,
    name,
    "slug": slug.current,
    position,
    teamMemberImage
  },
  date,
  thumbnailImage,
  tldrSection,
  content,
  faqs,
  resourceDescription,
  featured,
  locale,
  metaTitle,
  metaDescription
}
`

export const COMPARE_BLOG_META_QUERY = /* groq */ `
*[_type == "compareBlog" && slug.current == $slug && ${NOT_RETIRED}][0]{
  _id,
  title,
  "slug": slug.current,
  metaTitle,
  metaDescription,
  thumbnailImage
}
`

export const COMPARE_BLOG_PARAMS_QUERY = /* groq */ `
*[_type == "compareBlog" && defined(slug.current) && ${NOT_RETIRED}]{
  "slug": slug.current
}
`

export async function fetchCompareBlog(slug: string): Promise<CompareBlog | null> {
  const { data } = await sanityFetch({
    query: COMPARE_BLOG_QUERY,
    params: { slug },
  })
  if (data === null || data === undefined) return null
  return CompareBlogSchema.parse(data)
}

export async function fetchCompareBlogMeta(
  slug: string,
): Promise<CompareBlogMeta | null> {
  const { data } = await sanityFetch({
    query: COMPARE_BLOG_META_QUERY,
    params: { slug },
  })
  if (data === null || data === undefined) return null
  return CompareBlogMetaSchema.parse(data)
}

type RawCompareBlogParam = { slug: string | null }

export async function fetchCompareBlogParams(): Promise<{ slug: string }[]> {
  const raw = await sanityClient.fetch<RawCompareBlogParam[]>(
    COMPARE_BLOG_PARAMS_QUERY,
  )
  return raw
    .filter((p): p is { slug: string } => !!p.slug)
    .map((p) => ({ slug: p.slug }))
}

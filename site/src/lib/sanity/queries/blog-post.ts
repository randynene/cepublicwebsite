import 'server-only'

import { sanityClient } from '@/lib/sanity/client'
import { sanityFetch } from '@/lib/sanity/live'
import { NOT_RETIRED } from '@/lib/sanity/queries/_filters'
import {
  BlogPostMetaSchema,
  BlogPostSchema,
  RelatedBlogPostSchema,
  type BlogPost,
  type BlogPostMeta,
  type RelatedBlogPost,
} from '@/types/sanity/documents/blog-post'

// -------------------------------------------------------------------------
// GROQ queries — parameterized only (TB23 / CMA F15 v1.3).
// Locale filter REMOVED per TB19 (single-document mirror strategy).
// _id projection on category/tags/author MANDATORY per TB20.
// -------------------------------------------------------------------------

export const BLOG_POST_QUERY = /* groq */ `
*[_type == "blogPost"
  && slug.current == $slug
  && category->slug.current == $category
  && ${NOT_RETIRED}
][0]{
  _id,
  _type,
  title,
  "slug": slug.current,
  date,
  thumbnailImage,
  openGraphImage,
  tldrSection,
  content,
  faqs,
  resourceDescription,
  featured,
  locale,
  metaTitle,
  metaDescription,
  category->{ _id, name, "slug": slug.current },
  tags[]->{ _id, name, "slug": slug.current, category },
  author->{
    _id,
    name,
    "slug": slug.current,
    position,
    teamMemberImage,
    aboutContent,
    areasOfExpertise,
    linkedinLink
  }
}
`

export const BLOG_POST_META_QUERY = /* groq */ `
*[_type == "blogPost"
  && slug.current == $slug
  && category->slug.current == $category
  && ${NOT_RETIRED}
][0]{
  _id,
  title,
  "slug": slug.current,
  metaTitle,
  metaDescription,
  openGraphImage,
  thumbnailImage,
  category->{ _id, name, "slug": slug.current }
}
`

export const RELATED_BLOG_POSTS_QUERY = /* groq */ `
*[_type == "blogPost"
  && category->_id == $categoryId
  && slug.current != $currentSlug
  && ${NOT_RETIRED}
] | order(date desc) [0...3] {
  _id,
  title,
  "slug": slug.current,
  date,
  thumbnailImage,
  resourceDescription,
  category->{ _id, name, "slug": slug.current }
}
`

// generateStaticParams query — defined() guard at GROQ level (TB / CMA F6).
export const BLOG_POST_PARAMS_QUERY = /* groq */ `
*[_type == "blogPost"
  && defined(slug.current)
  && defined(category->slug.current)
  && ${NOT_RETIRED}
]{
  "slug": slug.current,
  "category": category->slug.current
}
`

// -------------------------------------------------------------------------
// Fetch + parse helpers — Zod validation at fetch boundary (§3.6).
// throw on parse fail to surface schema drift loudly.
// -------------------------------------------------------------------------

export async function fetchBlogPost(
  category: string,
  slug: string,
): Promise<BlogPost | null> {
  const { data } = await sanityFetch({
    query: BLOG_POST_QUERY,
    params: { category, slug },
  })
  if (data === null || data === undefined) return null
  return BlogPostSchema.parse(data)
}

export async function fetchBlogPostMeta(
  category: string,
  slug: string,
): Promise<BlogPostMeta | null> {
  const { data } = await sanityFetch({
    query: BLOG_POST_META_QUERY,
    params: { category, slug },
  })
  if (data === null || data === undefined) return null
  return BlogPostMetaSchema.parse(data)
}

export async function fetchRelatedBlogPosts(
  categoryId: string,
  currentSlug: string,
): Promise<RelatedBlogPost[]> {
  const { data } = await sanityFetch({
    query: RELATED_BLOG_POSTS_QUERY,
    params: { categoryId, currentSlug },
  })
  if (!Array.isArray(data)) return []
  return data.map((item) => RelatedBlogPostSchema.parse(item))
}

// Build-time enumeration — uses bare sanityClient per §2.5 / CMA F5 v1.3.
// sanityFetch is for runtime requests in Visual Editing context only.
type RawBlogPostParam = { slug: string | null; category: string | null }

export async function fetchBlogPostParams(): Promise<
  { category: string; slug: string }[]
> {
  const raw = await sanityClient.fetch<RawBlogPostParam[]>(BLOG_POST_PARAMS_QUERY)
  return raw
    .filter(
      (p): p is { slug: string; category: string } => !!p.slug && !!p.category,
    )
    .map((p) => ({ category: p.category, slug: p.slug }))
}

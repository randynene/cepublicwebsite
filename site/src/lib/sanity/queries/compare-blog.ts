import 'server-only'

import { sanityClient } from '@/lib/sanity/client'
import { sanityFetch } from '@/lib/sanity/live'
import { NOT_RETIRED } from '@/lib/sanity/queries/_filters'
import {
  HubChildItemSchema,
  type HubChildItem,
} from '@/lib/sanity/queries/hubs'
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

// Related-comparisons module (SEO S2, roadmap W1-04). The 27 compare pages hold
// the site's best positions and ~45% of its AI citations but link only UPWARD to
// the hub; this cross-links them laterally so equity flows between them.
//
// Relatedness is derived from DATA, never a hand-coded slug list: a shared
// competitor scores highest, then shared tags, then recency. The recency tail is
// a deliberate fallback so every one of the 27 pages links to three siblings even
// when it shares no competitor or tag - the whole point is lateral link equity,
// and `competitor` is null on most docs (the template parses it from the title).
//
// NOT_RETIRED + `slug.current != $slug` guarantee the module can never emit a link
// to a retired doc or to itself. Projection mirrors the hub child shape so the
// result renders through the same BlogCard as the /alternatives grid.
export const RELATED_COMPARISONS_QUERY = /* groq */ `
*[_type == "compareBlog"
  && slug.current != $slug
  && defined(slug.current)
  && ${NOT_RETIRED}
]{
  _id, _type,
  title, name, nameClient, customerStoryTitle, technologyName,
  "slug": slug.current,
  thumbnailImage, thumbnail, backupImage, headerFooterImage, featuredImage, techLogo, companyLogo,
  date, dateTime,
  resourceDescription, subHeader, headerDescription, mainDescription, descriptionOfVideo,
  snippetForMeta, reviewSnippetForMeta, shortLabel, competitor,
  metaDescription,
  "author": author->{ name, teamMemberImage },
  "category": category->{ name, "slug": slug.current },
  companyName, position,
  "sameCompetitor": defined($competitor) && defined(competitor) && competitor == $competitor,
  "sharedTags": coalesce(count(tags[@._ref in $tagIds]), 0)
}
| order(sameCompetitor desc, sharedTags desc, defined(date) desc, date desc)
[0...3]
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

export async function fetchRelatedComparisons(
  post: Pick<CompareBlog, 'slug' | 'competitor' | 'tags'>,
): Promise<HubChildItem[]> {
  const tagIds = (post.tags ?? []).map((tag) => tag._id)
  const { data } = await sanityFetch({
    query: RELATED_COMPARISONS_QUERY,
    params: {
      slug: post.slug,
      competitor: post.competitor ?? null,
      tagIds,
    },
  })
  if (!Array.isArray(data)) return []
  return data.map((item) => HubChildItemSchema.parse(item))
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

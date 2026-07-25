import 'server-only'

import { sanityClient } from '@/lib/sanity/client'
import { sanityFetch } from '@/lib/sanity/live'
import { NOT_RETIRED, VISIBLE_IN_LOCALE } from '@/lib/sanity/queries/_filters'
import type { Locale } from '@/lib/locale'
import {
  AuthorBlogPostSchema,
  TeamMemberMetaSchema,
  TeamMemberSchema,
  type AuthorBlogPost,
  type TeamMember,
  type TeamMemberMeta,
} from '@/types/sanity/documents/team-member'

// -------------------------------------------------------------------------
// GROQ queries — parameterized only (TEMPLATE-BLOG convention).
//
// One document, mirrored into both locales (TB19). $locale exists ONLY so that
// VISIBLE_IN_LOCALE can hide a ukOnly person from the default locale; it does not
// select a translation. See _filters.ts for why that one exception exists.
// -------------------------------------------------------------------------

export const TEAM_MEMBER_QUERY = /* groq */ `
*[_type == "teamMember"
  && slug.current == $slug
  && _id != "smoke-test-team-member"
  && ${NOT_RETIRED}
  && ${VISIBLE_IN_LOCALE}
][0]{
  _id,
  _type,
  name,
  "slug": slug.current,
  position,
  teamMemberImage,
  aboutContent,
  timeAtCloudEmployee,
  areasOfExpertise,
  linkedinLink,
  bookACallLink,
  locale,
  metaTitle,
  metaDescription
}
`

export const TEAM_MEMBER_META_QUERY = /* groq */ `
*[_type == "teamMember"
  && slug.current == $slug
  && _id != "smoke-test-team-member"
  && ${NOT_RETIRED}
  && ${VISIBLE_IN_LOCALE}
][0]{
  _id,
  name,
  "slug": slug.current,
  metaTitle,
  metaDescription,
  teamMemberImage
}
`

export const AUTHOR_BLOG_POSTS_QUERY = /* groq */ `
*[_type == "blogPost"
  && author._ref == $authorId
  && defined(slug.current)
  && defined(category->slug.current)
  && ${NOT_RETIRED}
] | order(date desc) [0...6] {
  _id,
  title,
  "slug": slug.current,
  date,
  thumbnailImage,
  resourceDescription,
  category->{ _id, name, "slug": slug.current }
}
`

export const TEAM_MEMBER_PARAMS_QUERY = /* groq */ `
*[_type == "teamMember"
  && defined(slug.current)
  && _id != "smoke-test-team-member"
  && ${NOT_RETIRED}
  && ${VISIBLE_IN_LOCALE}
]{
  "slug": slug.current
}
`

// -------------------------------------------------------------------------
// Fetch + parse helpers
// -------------------------------------------------------------------------

// GROQ sees "uk" or "us", not the BCP-47 tag. One place, so the two route trees
// cannot disagree about what "uk" means.
export function groqLocale(locale: Locale): string {
  return locale === 'en-GB' ? 'uk' : 'us'
}

export async function fetchTeamMember(
  slug: string,
  locale: Locale,
): Promise<TeamMember | null> {
  const { data } = await sanityFetch({
    query: TEAM_MEMBER_QUERY,
    params: { slug, locale: groqLocale(locale) },
  })
  if (data === null || data === undefined) return null
  return TeamMemberSchema.parse(data)
}

export async function fetchTeamMemberMeta(
  slug: string,
  locale: Locale,
): Promise<TeamMemberMeta | null> {
  const { data } = await sanityFetch({
    query: TEAM_MEMBER_META_QUERY,
    params: { slug, locale: groqLocale(locale) },
  })
  if (data === null || data === undefined) return null
  return TeamMemberMetaSchema.parse(data)
}

export async function fetchAuthorBlogPosts(
  authorId: string,
): Promise<AuthorBlogPost[]> {
  const { data } = await sanityFetch({
    query: AUTHOR_BLOG_POSTS_QUERY,
    params: { authorId },
  })
  if (!Array.isArray(data)) return []
  return data.map((item) => AuthorBlogPostSchema.parse(item))
}

type RawTeamMemberParam = { slug: string | null }

export async function fetchTeamMemberParams(
  locale: Locale,
): Promise<{ slug: string }[]> {
  const raw = await sanityClient.fetch<RawTeamMemberParam[]>(
    TEAM_MEMBER_PARAMS_QUERY,
    { locale: groqLocale(locale) },
  )
  return raw
    .filter((p): p is { slug: string } => !!p.slug)
    .map((p) => ({ slug: p.slug }))
}

import 'server-only'

import { sanityClient } from '@/lib/sanity/client'
import { sanityFetch } from '@/lib/sanity/live'
import { NOT_RETIRED } from '@/lib/sanity/queries/_filters'
import {
  BookACallMetaSchema,
  BookACallSchema,
  type BookACall,
  type BookACallMeta,
} from '@/types/sanity/documents/book-a-call'

export const BOOK_A_CALL_QUERY = /* groq */ `
*[_type == "bookACall" && slug.current == $slug && ${NOT_RETIRED}][0]{
  _id,
  _type,
  firstName,
  lastName,
  "slug": slug.current,
  calendlyEmbed,
  metaTitle,
  metaDescription
}
`

export const BOOK_A_CALL_META_QUERY = /* groq */ `
*[_type == "bookACall" && slug.current == $slug && ${NOT_RETIRED}][0]{
  _id,
  firstName,
  lastName,
  "slug": slug.current,
  metaTitle,
  metaDescription
}
`

export const BOOK_A_CALL_PARAMS_QUERY = /* groq */ `
*[_type == "bookACall" && defined(slug.current) && ${NOT_RETIRED}]{
  "slug": slug.current
}
`

export async function fetchBookACall(slug: string): Promise<BookACall | null> {
  const { data } = await sanityFetch({
    query: BOOK_A_CALL_QUERY,
    params: { slug },
  })
  if (data === null || data === undefined) return null
  return BookACallSchema.parse(data)
}

export async function fetchBookACallMeta(
  slug: string,
): Promise<BookACallMeta | null> {
  const { data } = await sanityFetch({
    query: BOOK_A_CALL_META_QUERY,
    params: { slug },
  })
  if (data === null || data === undefined) return null
  return BookACallMetaSchema.parse(data)
}

type RawBookACallParam = { slug: string | null }

export async function fetchBookACallParams(): Promise<{ slug: string }[]> {
  const raw = await sanityClient.fetch<RawBookACallParam[]>(
    BOOK_A_CALL_PARAMS_QUERY,
  )
  return raw
    .filter((p): p is { slug: string } => !!p.slug)
    .map((p) => ({ slug: p.slug }))
}

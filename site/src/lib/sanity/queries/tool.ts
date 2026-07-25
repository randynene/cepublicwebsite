import 'server-only'

import { sanityClient } from '@/lib/sanity/client'
import { sanityFetch } from '@/lib/sanity/live'
import { NOT_RETIRED } from '@/lib/sanity/queries/_filters'
import {
  ToolMetaSchema,
  ToolSchema,
  type Tool,
  type ToolMeta,
} from '@/types/sanity/documents/tool'

export const TOOL_QUERY = /* groq */ `
*[_type == "tool" && slug.current == $slug && ${NOT_RETIRED}][0]{
  _id,
  _type,
  name,
  "slug": slug.current,
  subHeader,
  headerBlurb,
  description,
  button1Text,
  button1Link,
  button2Text,
  button2Link,
  toolEmbed,
  videoOverview,
  faqs[]{
    _key,
    question,
    answer
  },
  thumbnail,
  "tags": tags[]->{name},
  featured,
  metaTitle,
  metaDescription,
  locale
}
`

export const TOOL_META_QUERY = /* groq */ `
*[_type == "tool" && slug.current == $slug && ${NOT_RETIRED}][0]{
  _id,
  name,
  "slug": slug.current,
  metaTitle,
  metaDescription,
  thumbnail
}
`

export const TOOL_PARAMS_QUERY = /* groq */ `
*[_type == "tool" && defined(slug.current) && ${NOT_RETIRED}]{
  "slug": slug.current
}
`

export async function fetchTool(slug: string): Promise<Tool | null> {
  const { data } = await sanityFetch({
    query: TOOL_QUERY,
    params: { slug },
  })
  if (data === null || data === undefined) return null
  return ToolSchema.parse(data)
}

export async function fetchToolMeta(slug: string): Promise<ToolMeta | null> {
  const { data } = await sanityFetch({
    query: TOOL_META_QUERY,
    params: { slug },
  })
  if (data === null || data === undefined) return null
  return ToolMetaSchema.parse(data)
}

type RawToolParam = { slug: string | null }

export async function fetchToolParams(): Promise<{ slug: string }[]> {
  const raw = await sanityClient.fetch<RawToolParam[]>(TOOL_PARAMS_QUERY)
  return raw
    .filter((p): p is { slug: string } => !!p.slug)
    .map((p) => ({ slug: p.slug }))
}

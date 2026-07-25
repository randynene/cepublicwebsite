import type { Metadata } from 'next'

import BlogHubTemplate from '@/components/templates/blog-hub'
import { resolveBlogHubRoute } from '@/lib/blog/render-route'
import { buildHubMetadata } from '@/lib/hubs/metadata'

// /managing-engineers
//
// Blog family, spec docs/blog_topic_hubs.pdf. All 7 pages share BlogHubTemplate;
// this file only names the hub and the locale.

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams
}): Promise<Metadata> {
  return buildHubMetadata('managingEngineersHub', await searchParams)
}

export default async function ManagingEngineersHubPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const data = await resolveBlogHubRoute('managingEngineersHub', await searchParams)
  return <BlogHubTemplate {...data} />
}

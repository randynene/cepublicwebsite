import type { Metadata } from 'next'

import BlogHubTemplate from '@/components/templates/blog-hub'
import { resolveBlogHubRoute } from '@/lib/blog/render-route'
import { buildHubMetadata } from '@/lib/hubs/metadata'

// /scaling-teams
//
// Blog family, spec docs/blog_topic_hubs.pdf. All 7 pages share BlogHubTemplate;
// this file only names the hub and the locale.

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams
}): Promise<Metadata> {
  return buildHubMetadata('scalingTeamsHub', await searchParams)
}

export default async function ScalingTeamsHubPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const data = await resolveBlogHubRoute('scalingTeamsHub', await searchParams)
  return <BlogHubTemplate {...data} />
}

import type { Metadata } from 'next'

import BlogHubTemplate from '@/components/templates/blog-hub'
import { resolveBlogHubRoute } from '@/lib/blog/render-route'
import { buildHubMetadata } from '@/lib/hubs/metadata'

// /nearshoring-offshoring  (UK mirror - byte-identical per spec §1)
//
// Blog family, spec docs/blog_topic_hubs.pdf. All 7 pages share BlogHubTemplate;
// this file only names the hub and the locale.

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams
}): Promise<Metadata> {
  return buildHubMetadata('nearshoringOffshoringHub', await searchParams, 'en-GB')
}

export default async function NearshoringOffshoringHubUkPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const data = await resolveBlogHubRoute('nearshoringOffshoringHub', await searchParams, 'en-GB')
  return <BlogHubTemplate {...data} />
}

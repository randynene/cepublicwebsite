import type { Metadata } from 'next'

import BlogHubTemplate from '@/components/templates/blog-hub'
import { resolveBlogHubRoute } from '@/lib/blog/render-route'
import { buildHubMetadata } from '@/lib/hubs/metadata'

// /staff-augmentation
//
// Blog family, spec docs/blog_topic_hubs.pdf. All 7 pages share BlogHubTemplate;
// this file only names the hub and the locale.

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams
}): Promise<Metadata> {
  return buildHubMetadata('staffAugmentationHub', await searchParams)
}

export default async function StaffAugmentationHubPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const data = await resolveBlogHubRoute('staffAugmentationHub', await searchParams)
  return <BlogHubTemplate {...data} />
}

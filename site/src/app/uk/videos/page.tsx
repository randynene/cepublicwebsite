import type { Metadata } from 'next'

import { buildHubMetadata } from '@/lib/hubs/metadata'
import ResourceHubTemplate from '@/components/templates/resource-hub'
import { resolveResourceHubRoute } from '@/lib/hubs/resource-route'

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams
}): Promise<Metadata> {
  return buildHubMetadata('videosHub', await searchParams, 'en-GB')
}

export default async function VideosHubUkPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const data = await resolveResourceHubRoute('videosHub', await searchParams, 'en-GB')
  return <ResourceHubTemplate {...data} />
}

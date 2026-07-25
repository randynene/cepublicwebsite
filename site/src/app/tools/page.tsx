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
  return buildHubMetadata('toolsHub', await searchParams)
}

export default async function ToolsHubPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const data = await resolveResourceHubRoute('toolsHub', await searchParams)
  return <ResourceHubTemplate {...data} />
}

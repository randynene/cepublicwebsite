import type { Metadata } from 'next'

import AlternativesHubTemplate from '@/components/templates/alternatives-hub'
import { resolveAlternativesHubRoute } from '@/lib/hubs/alternatives-route'
import { buildHubMetadata } from '@/lib/hubs/metadata'

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams
}): Promise<Metadata> {
  return buildHubMetadata('alternativesHub', await searchParams, 'en-GB')
}

export default async function AlternativesHubUkPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const data = await resolveAlternativesHubRoute(await searchParams, 'en-GB')
  return <AlternativesHubTemplate {...data} />
}

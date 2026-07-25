import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import CustomerStoriesTemplate from '@/components/templates/customer-stories-hub'
import { fetchCustomerStoriesData } from '@/lib/sanity/queries/social-proof'
import { buildHubMetadata } from '@/lib/hubs/metadata'

// /customer-stories  (UK mirror) - bespoke social-proof design (docs/raw-html/).

export async function generateMetadata(): Promise<Metadata> {
  return buildHubMetadata('customerStoriesHub', {}, 'en-GB')
}

export default async function CustomerStoriesUkPage() {
  const data = await fetchCustomerStoriesData()
  if (!data) notFound()
  return <CustomerStoriesTemplate data={data} locale="en-GB" />
}

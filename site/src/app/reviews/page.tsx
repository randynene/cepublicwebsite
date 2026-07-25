import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import ReviewsTemplate from '@/components/templates/reviews-hub'
import { fetchReviewsData } from '@/lib/sanity/queries/social-proof'
import { buildHubMetadata } from '@/lib/hubs/metadata'

// /reviews - bespoke social-proof design (docs/raw-html/).

export async function generateMetadata(): Promise<Metadata> {
  return buildHubMetadata('reviewsHub', {})
}

export default async function ReviewsPage() {
  const data = await fetchReviewsData()
  if (!data) notFound()
  return <ReviewsTemplate data={data} locale="en-US" />
}

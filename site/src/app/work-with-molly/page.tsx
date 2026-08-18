import type { Metadata } from 'next'

import { WorkWithMollyTemplate } from '@/components/templates/work-with-molly'
import { WORK_WITH_MOLLY_META } from '@/components/templates/work-with-molly/content'
import { generateCanonical } from '@/lib/locale'
import { fetchReviewsData } from '@/lib/sanity/queries/social-proof'
import { resolvePageTitle } from '@/lib/seo/page-title'

// /work-with-molly - single-rep landing page (design:
// docs/design/"V1 - First version to try.png").
//
// NO UK MIRROR and NOT IN THE SITEMAP. The page speaks to US buyers in Molly's
// first person, so a /uk/ copy would be wrong rather than merely redundant, and
// a campaign landing page has no business competing with /book-a-call in
// organic search until Jake says it should.

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: resolvePageTitle(WORK_WITH_MOLLY_META.title),
    description: WORK_WITH_MOLLY_META.description,
    alternates: { canonical: generateCanonical('/work-with-molly', 'en-US') },
  }
}

export default async function WorkWithMollyPage() {
  // One live query, the same one /reviews uses, so the testimonial photos,
  // names, roles, logos and quotes are real Sanity documents rather than the
  // invented names in the export.
  const data = await fetchReviewsData()
  const reviews = (data?.reviews ?? []).filter((r) => r.quote).slice(0, 6)
  return <WorkWithMollyTemplate reviews={reviews} locale="en-US" />
}

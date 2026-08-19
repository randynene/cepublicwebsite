import type { Metadata } from 'next'

import { WorkWithMollyTemplate, type BookingPanel } from '@/components/templates/work-with-molly'
import {
  FALLBACK_CALENDLY_URL,
  MOLLY_BOOKING_SLUG,
  WORK_WITH_MOLLY_META,
} from '@/components/templates/work-with-molly/content'
import { extractSchedulingUrl } from '@/lib/booking/scheduling-url'
import { generateCanonical } from '@/lib/locale'
import { fetchBookACall } from '@/lib/sanity/queries/book-a-call'
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

/**
 * Molly's booking link, from the single document that owns it.
 *
 * This is the SAME fetch and the SAME resolution that /book-a-call/molly runs,
 * so the two pages cannot drift into booking different diaries: change her
 * Calendly in Studio and both follow. Hardcoding the URL here would have been a
 * second copy that nobody updates, on the page whose whole promise is that you
 * are booking time with her specifically.
 *
 * `fetchBookACall` filters retired documents, so an unpublished or retired
 * Molly falls through to the generic team event rather than rendering a dead
 * panel. The panel's subtitle changes with it - see content.ts.
 */
async function resolveBooking(): Promise<BookingPanel> {
  const doc = await fetchBookACall(MOLLY_BOOKING_SLUG)
  const url = extractSchedulingUrl(doc?.calendlyEmbed)
  if (url) return { url, isMollys: true }
  return { url: FALLBACK_CALENDLY_URL, isMollys: false }
}

export default async function WorkWithMollyPage() {
  // Two live queries. Reviews are the same ones /reviews renders, so the
  // testimonial photos, names, roles, logos and quotes are real Sanity
  // documents rather than the invented names in the export.
  const [data, booking] = await Promise.all([fetchReviewsData(), resolveBooking()])
  const reviews = (data?.reviews ?? []).filter((r) => r.quote).slice(0, 6)
  return <WorkWithMollyTemplate reviews={reviews} booking={booking} locale="en-US" />
}

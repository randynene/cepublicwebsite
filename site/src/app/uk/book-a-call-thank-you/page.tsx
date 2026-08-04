import type { Metadata } from 'next'

import { PostBookingNext } from '@/components/shared/post-booking-next'
import {
  buildStaticPageMetadata,
  renderStaticPage,
} from '@/lib/static-page/render-route'

// /book-a-call-thank-you  (UK locale mirror)
//
// A post-conversion page: nobody navigates here, they are redirected here by a
// HubSpot form or a Calendly booking. That is precisely why it must exist at
// cutover - if it 404s, every form that lands on it ends on a broken page, and
// nothing in a build or a typecheck will tell you.
//
// Content captured from the live page (npm run content:capture-marketing) and
// rendered through the shared static-page template until the design lands.

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata('bookACallThankYouPage', '/book-a-call-thank-you', 'en-GB')
}

export default async function BookACallThankYouUkPage() {
  // See the US route for why breadcrumbs are off and what `after` carries (CE-41).
  return renderStaticPage('bookACallThankYouPage', '/book-a-call-thank-you', 'en-GB', 'Thank You', {
    showBreadcrumbs: false,
    after: <PostBookingNext locale="en-GB" />,
  })
}

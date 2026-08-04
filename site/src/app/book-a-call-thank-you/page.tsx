import type { Metadata } from 'next'

import { PostBookingNext } from '@/components/shared/post-booking-next'
import {
  buildStaticPageMetadata,
  renderStaticPage,
} from '@/lib/static-page/render-route'

// /book-a-call-thank-you
//
// A post-conversion page: nobody navigates here, they are redirected here by a
// HubSpot form or a Calendly booking. That is precisely why it must exist at
// cutover - if it 404s, every form that lands on it ends on a broken page, and
// nothing in a build or a typecheck will tell you.
//
// Content captured from the live page (npm run content:capture-marketing) and
// rendered through the shared static-page template until the design lands.

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata('bookACallThankYouPage', '/book-a-call-thank-you', 'en-US')
}

export default async function BookACallThankYouPage() {
  // CE-41: breadcrumbs off (a "> Thank You" crumb on a page nobody navigates to
  // is noise), and the onward-paths block replaces the Calendly embed that used
  // to sit here - which offered a second booking to someone who had just booked.
  return renderStaticPage('bookACallThankYouPage', '/book-a-call-thank-you', 'en-US', 'Thank You', {
    showBreadcrumbs: false,
    after: <PostBookingNext locale="en-US" />,
  })
}

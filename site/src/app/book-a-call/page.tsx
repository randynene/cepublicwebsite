import type { Metadata } from 'next'

import {
  buildStaticPageMetadata,
  renderStaticPage,
} from '@/lib/static-page/render-route'

// /book-a-call
//
// A post-conversion page: nobody navigates here, they are redirected here by a
// HubSpot form or a Calendly booking. That is precisely why it must exist at
// cutover - if it 404s, every form that lands on it ends on a broken page, and
// nothing in a build or a typecheck will tell you.
//
// Content captured from the live page (npm run content:capture-marketing) and
// rendered through the shared static-page template until the design lands.

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata('bookACallPage', '/book-a-call', 'en-US')
}

export default async function BookACallPage() {
  return renderStaticPage('bookACallPage', '/book-a-call', 'en-US', 'Book A Call', {
    showBreadcrumbs: false,
  })
}

import type { Metadata } from 'next'

import {
  buildStaticPageMetadata,
  renderStaticPage,
} from '@/lib/static-page/render-route'

// /thank-you-culture-match  (UK locale mirror)
//
// A post-conversion page: nobody navigates here, they are redirected here by a
// HubSpot form or a Calendly booking. That is precisely why it must exist at
// cutover - if it 404s, every form that lands on it ends on a broken page, and
// nothing in a build or a typecheck will tell you.
//
// Content captured from the live page (npm run content:capture-marketing) and
// rendered through the shared static-page template until the design lands.

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata('thankYouCultureMatchPage', '/thank-you-culture-match', 'en-GB')
}

export default async function ThankYouCultureMatchUkPage() {
  return renderStaticPage('thankYouCultureMatchPage', '/thank-you-culture-match', 'en-GB', 'Thank You')
}

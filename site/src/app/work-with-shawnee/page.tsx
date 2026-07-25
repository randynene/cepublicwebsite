import type { Metadata } from 'next'

import {
  buildStaticPageMetadata,
  renderStaticPage,
} from '@/lib/static-page/render-route'

// /work-with-shawnee
//
// Content captured from the live page into the workWithShawneePage singleton
// (npm run content:capture-marketing). Rendered through the shared static-page
// template until this page's design lands, at which point it is a template change
// and not another content migration.

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata('workWithShawneePage', '/work-with-shawnee', 'en-US')
}

export default async function WorkWithShawneePage() {
  return renderStaticPage('workWithShawneePage', '/work-with-shawnee', 'en-US', 'Work With Shawnee')
}

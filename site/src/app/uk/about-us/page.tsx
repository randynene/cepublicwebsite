import type { Metadata } from 'next'

import {
  buildStaticPageMetadata,
  renderStaticPage,
} from '@/lib/static-page/render-route'

// /about-us (UK locale)
//
// Content captured from the live page into the aboutUsPage singleton
// (npm run content:capture-marketing). Rendered through the shared static-page
// template until this page's design lands, at which point it is a template change
// and not another content migration.

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata('aboutUsPage', '/about-us', 'en-GB')
}

export default async function AboutUsUkPage() {
  return renderStaticPage('aboutUsPage', '/about-us', 'en-GB', 'About Us')
}

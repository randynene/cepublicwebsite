import type { Metadata } from 'next'

import {
  buildStaticPageMetadata,
  renderStaticPage,
} from '@/lib/static-page/render-route'

// /contact
//
// Content captured from the live page into the contactPage singleton
// (npm run content:capture-marketing). Rendered through the shared static-page
// template until this page's design lands, at which point it is a template change
// and not another content migration.

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata('contactPage', '/contact', 'en-US')
}

export default async function ContactPage() {
  return renderStaticPage('contactPage', '/contact', 'en-US', 'Contact')
}

import type { Metadata } from 'next'

import { ContactTemplate } from '@/components/templates/contact'
import { CONTACT_CONTENT, CONTACT_META } from '@/components/templates/contact/content'
import { generateCanonical, generateHreflang } from '@/lib/locale'
import { fetchContactPage, toContactContent } from '@/lib/sanity/queries/contact-page'
import { resolvePageTitle } from '@/lib/seo/page-title'

// /contact — bespoke Contact page (WP-05). Hero prose, quick-contact strip,
// the real HubSpot enquiry form, and the offices grid all come from the
// contactPage singleton with a static fallback.

export async function generateMetadata(): Promise<Metadata> {
  const data = await fetchContactPage()
  return {
    title: resolvePageTitle(data?.metaTitle ?? CONTACT_META.title ),
    description: data?.metaDescription ?? CONTACT_META.description,
    alternates: {
      canonical: generateCanonical('/contact', 'en-US'),
      languages: generateHreflang('/contact'),
    },
  }
}

export default async function ContactPage() {
  const data = await fetchContactPage()
  const content = data ? toContactContent(data) : CONTACT_CONTENT
  return <ContactTemplate locale="en-US" content={content} />
}

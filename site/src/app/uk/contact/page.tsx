import type { Metadata } from 'next'

import { ContactTemplate } from '@/components/templates/contact'
import { CONTACT_CONTENT, CONTACT_META } from '@/components/templates/contact/content'
import { generateCanonical, generateHreflang } from '@/lib/locale'
import { fetchContactPage, toContactContent } from '@/lib/sanity/queries/contact-page'

// /uk/contact — same contactPage singleton as the US route.

export async function generateMetadata(): Promise<Metadata> {
  const data = await fetchContactPage()
  return {
    title: { absolute: data?.metaTitle ?? CONTACT_META.title },
    description: data?.metaDescription ?? CONTACT_META.description,
    alternates: {
      canonical: generateCanonical('/contact', 'en-GB'),
      languages: generateHreflang('/contact'),
    },
  }
}

export default async function ContactUkPage() {
  const data = await fetchContactPage()
  const content = data ? toContactContent(data) : CONTACT_CONTENT
  return <ContactTemplate locale="en-GB" content={content} />
}

import type { Metadata } from 'next'

import { AboutUsTemplate } from '@/components/templates/about-us'
import { ABOUT_US_CONTENT, ABOUT_US_META } from '@/components/templates/about-us/content'
import { generateCanonical, generateHreflang } from '@/lib/locale'
import { fetchAboutUsPage, toAboutUsContent } from '@/lib/sanity/queries/about-us-page'

// /uk/about-us — same aboutUsPage singleton; team grid respects ukOnly.

export async function generateMetadata(): Promise<Metadata> {
  const data = await fetchAboutUsPage()
  return {
    title: { absolute: data?.metaTitle ?? ABOUT_US_META.title },
    description: data?.metaDescription ?? ABOUT_US_META.description,
    alternates: {
      canonical: generateCanonical('/about-us', 'en-GB'),
      languages: generateHreflang('/about-us'),
    },
  }
}

export default async function AboutUsUkPage() {
  const data = await fetchAboutUsPage()
  const content = data ? toAboutUsContent(data) : ABOUT_US_CONTENT
  return <AboutUsTemplate locale="en-GB" content={content} />
}

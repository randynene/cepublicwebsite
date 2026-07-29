import type { Metadata } from 'next'

import { AboutUsTemplate } from '@/components/templates/about-us'
import { ABOUT_US_CONTENT, ABOUT_US_META } from '@/components/templates/about-us/content'
import { generateCanonical, generateHreflang } from '@/lib/locale'
import { fetchAboutUsPage, toAboutUsContent } from '@/lib/sanity/queries/about-us-page'
import { resolvePageTitle } from '@/lib/seo/page-title'

// /about-us — bespoke About Us (D3). Team / values / reviews mount from their
// own Sanity docs; page chrome from aboutUsPage with static fallback.

export async function generateMetadata(): Promise<Metadata> {
  const data = await fetchAboutUsPage()
  return {
    title: resolvePageTitle(data?.metaTitle ?? ABOUT_US_META.title ),
    description: data?.metaDescription ?? ABOUT_US_META.description,
    alternates: {
      canonical: generateCanonical('/about-us', 'en-US'),
      languages: generateHreflang('/about-us'),
    },
  }
}

export default async function AboutUsPage() {
  const data = await fetchAboutUsPage()
  const content = data ? toAboutUsContent(data) : ABOUT_US_CONTENT
  return <AboutUsTemplate locale="en-US" content={content} />
}

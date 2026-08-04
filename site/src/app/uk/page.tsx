import type { Metadata } from 'next'

import { HomeTemplate } from '@/components/templates/home'
import { HOME_CONTENT, HOME_META } from '@/components/templates/home/content'
import { HomeJsonLd } from '@/components/templates/home/json-ld'
import { generateCanonical, generateHreflang } from '@/lib/locale'
import { fetchHomePage, toHomeContent } from '@/lib/sanity/queries/home-page'
import { resolvePageTitle } from '@/lib/seo/page-title'

export async function generateMetadata(): Promise<Metadata> {
  const data = await fetchHomePage()
  return {
    title: resolvePageTitle(data?.metaTitle ?? HOME_META.title),
    description: data?.metaDescription ?? HOME_META.description,
    alternates: {
      canonical: generateCanonical('/', 'en-GB'),
      languages: generateHreflang('/'),
    },
  }
}

export default async function UkHomePage() {
  const data = await fetchHomePage()
  const content = data ? toHomeContent(data) : HOME_CONTENT
  const title = data?.metaTitle ?? HOME_META.title
  const description = data?.metaDescription ?? HOME_META.description
  return (
    <>
      <HomeJsonLd
        locale="en-GB"
        title={title}
        description={description}
        faqItems={content.faq.items}
      />
      {/* locale is load-bearing, not decoration: HomeTemplate defaults to
          'en-US', and it drives both the hero CTA target (/uk/book-a-call) and
          the lead form's sourcePage. Omitting it sent UK visitors to the US
          booking page. */}
      <HomeTemplate content={content} locale="en-GB" />
    </>
  )
}

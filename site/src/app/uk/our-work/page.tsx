import type { Metadata } from 'next'

import { OurWorkTemplate } from '@/components/templates/our-work'
import { OUR_WORK_CONTENT, OUR_WORK_META } from '@/components/templates/our-work/content'
import { generateCanonical, generateHreflang } from '@/lib/locale'
import { fetchOurWorkPage, toOurWorkContent } from '@/lib/sanity/queries/our-work-page'
import { resolvePageTitle } from '@/lib/seo/page-title'

// /uk/our-work - UK locale mirror of the bespoke Our Work page.

export async function generateMetadata(): Promise<Metadata> {
  const data = await fetchOurWorkPage()
  return {
    title: resolvePageTitle(data?.metaTitle ?? OUR_WORK_META.title ),
    description: data?.metaDescription ?? OUR_WORK_META.description,
    alternates: { canonical: generateCanonical('/our-work', 'en-GB'), languages: generateHreflang('/our-work') },
  }
}

export default async function UkOurWorkPage() {
  const data = await fetchOurWorkPage()
  const content = data ? toOurWorkContent(data) : OUR_WORK_CONTENT
  return <OurWorkTemplate locale="en-GB" content={content} />
}

import type { Metadata } from 'next'

import { HIW_CONTENT, HIW_META } from '@/components/templates/how-it-works/content'
import { HowItWorksTemplate } from '@/components/templates/how-it-works'
import { HowItWorksJsonLd } from '@/components/templates/how-it-works/json-ld'
import { generateCanonical, generateHreflang } from '@/lib/locale'
import { fetchHowItWorksPage, toHiwContent } from '@/lib/sanity/queries/how-it-works-page'

export async function generateMetadata(): Promise<Metadata> {
  const data = await fetchHowItWorksPage()
  return {
    title: data?.metaTitle ?? HIW_META.title,
    description: data?.metaDescription ?? HIW_META.description,
    alternates: {
      canonical: generateCanonical('/how-it-works', 'en-US'),
      languages: generateHreflang('/how-it-works'),
    },
  }
}

export default async function HowItWorksPage() {
  const data = await fetchHowItWorksPage()
  const content = data ? toHiwContent(data) : HIW_CONTENT
  const title = data?.metaTitle ?? HIW_META.title
  const description = data?.metaDescription ?? HIW_META.description
  return (
    <>
      <HowItWorksJsonLd
        locale="en-US"
        title={title}
        description={description}
        faqItems={content.faq.items}
      />
      <HowItWorksTemplate content={content} />
    </>
  )
}

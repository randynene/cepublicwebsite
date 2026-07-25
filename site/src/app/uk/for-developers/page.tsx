import type { Metadata } from 'next'

import { ForEngineersTemplate } from '@/components/templates/for-engineers'
import { FOR_ENGINEERS_CONTENT, FOR_ENGINEERS_META } from '@/components/templates/for-engineers/content'
import { generateCanonical, generateHreflang } from '@/lib/locale'
import { fetchForDevelopersPage, toForEngineersContent } from '@/lib/sanity/queries/for-developers-page'

// /uk/for-developers (UK locale) - bespoke "For Engineers" marketing page.
// Same body + Sanity singleton as the US route; canonical always points at the
// US path. Falls back to the static FOR_ENGINEERS_CONTENT when the doc is absent.

export async function generateMetadata(): Promise<Metadata> {
  const data = await fetchForDevelopersPage()
  const title = data?.metaTitle ?? FOR_ENGINEERS_META.title
  const description = data?.metaDescription ?? FOR_ENGINEERS_META.description
  return {
    title,
    description,
    alternates: { canonical: generateCanonical('/for-developers', 'en-GB'), languages: generateHreflang('/for-developers') },
    openGraph: {
      title: `${title} | Cloud Employee`,
      description,
      url: generateCanonical('/for-developers', 'en-US'),
      type: 'website',
    },
  }
}

export default async function ForDevelopersUkPage() {
  const data = await fetchForDevelopersPage()
  const content = data ? toForEngineersContent(data) : FOR_ENGINEERS_CONTENT
  return <ForEngineersTemplate locale="en-GB" content={content} />
}

import type { Metadata } from 'next'

import { ForEngineersTemplate } from '@/components/templates/for-engineers'
import { FOR_ENGINEERS_CONTENT, FOR_ENGINEERS_META } from '@/components/templates/for-engineers/content'
import { generateCanonical, generateHreflang } from '@/lib/locale'
import { fetchForDevelopersPage, toForEngineersContent } from '@/lib/sanity/queries/for-developers-page'

// /for-developers - bespoke dark/lime "For Engineers" marketing page.
// Header, footer and shared chrome come from the root layout; this route renders
// only the page body via ForEngineersTemplate. Copy + photos are editable in
// Sanity (forDevelopersPage singleton); the static FOR_ENGINEERS_CONTENT stays
// as the fallback when the doc is absent / fails validation.

export async function generateMetadata(): Promise<Metadata> {
  const data = await fetchForDevelopersPage()
  const title = data?.metaTitle ?? FOR_ENGINEERS_META.title
  const description = data?.metaDescription ?? FOR_ENGINEERS_META.description
  return {
    title,
    description,
    alternates: { canonical: generateCanonical('/for-developers', 'en-US'), languages: generateHreflang('/for-developers') },
    openGraph: {
      title: `${title} | Cloud Employee`,
      description,
      url: generateCanonical('/for-developers', 'en-US'),
      type: 'website',
    },
  }
}

export default async function ForDevelopersPage() {
  const data = await fetchForDevelopersPage()
  const content = data ? toForEngineersContent(data) : FOR_ENGINEERS_CONTENT
  return <ForEngineersTemplate locale="en-US" content={content} />
}

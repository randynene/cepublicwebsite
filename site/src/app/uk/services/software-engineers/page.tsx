import type { Metadata } from 'next'

import { HireEngineersTemplate } from '@/components/templates/hire-engineers'
import { HE, HIRE_ENGINEERS_META } from '@/components/templates/hire-engineers/content'
import { generateCanonical, generateHreflang } from '@/lib/locale'
import { fetchHireEngineersPage, toHireEngineersContent } from '@/lib/sanity/queries/hire-engineers-page'

// /uk/services/software-engineers - UK locale mirror of the Hire Engineers
// landing page. Declared destination of the /uk/hire/software-engineers redirect.
// Copy is editable in Sanity (hireEngineersPage singleton); the static HE stays
// as the fallback when the doc is absent / fails validation.

export async function generateMetadata(): Promise<Metadata> {
  const data = await fetchHireEngineersPage()
  return {
    title: { absolute: data?.metaTitle ?? HIRE_ENGINEERS_META.title },
    description: data?.metaDescription ?? HIRE_ENGINEERS_META.description,
    alternates: {
      canonical: generateCanonical('/services/software-engineers', 'en-GB'),
      languages: generateHreflang('/services/software-engineers'),
    },
  }
}

export default async function UkHireEngineersPage() {
  const data = await fetchHireEngineersPage()
  const content = data ? toHireEngineersContent(data) : HE
  return <HireEngineersTemplate content={content} locale="en-GB" />
}

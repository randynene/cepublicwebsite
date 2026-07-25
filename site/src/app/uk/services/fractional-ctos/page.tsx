import type { Metadata } from 'next'

import { FractionalCtoTemplate } from '@/components/templates/fractional-cto'
import { FCTO, FRACTIONAL_CTO_META } from '@/components/templates/fractional-cto/content'
import { generateCanonical, generateHreflang } from '@/lib/locale'
import { fetchFractionalCtoPage, toFctoContent } from '@/lib/sanity/queries/fractional-cto-page'

// /uk/services/fractional-ctos - UK locale mirror of the Fractional CTO
// landing page. Takes precedence over the /uk/services/[slug] Sanity route.
// Same Sanity-first, static-fallback wiring as the US route.

export async function generateMetadata(): Promise<Metadata> {
  const data = await fetchFractionalCtoPage()
  return {
    title: { absolute: data?.metaTitle ?? FRACTIONAL_CTO_META.title },
    description: data?.metaDescription ?? FRACTIONAL_CTO_META.description,
    alternates: {
      canonical: generateCanonical('/services/fractional-ctos', 'en-GB'),
      languages: generateHreflang('/services/fractional-ctos'),
    },
  }
}

export default async function UkFractionalCtoPage() {
  const data = await fetchFractionalCtoPage()
  const content = data ? toFctoContent(data) : FCTO
  return <FractionalCtoTemplate content={content} />
}

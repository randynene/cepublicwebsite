import type { Metadata } from 'next'

import { FractionalCtoTemplate } from '@/components/templates/fractional-cto'
import { FCTO, FRACTIONAL_CTO_META } from '@/components/templates/fractional-cto/content'
import { generateCanonical, generateHreflang } from '@/lib/locale'
import { fetchFractionalCtoPage, toFctoContent } from '@/lib/sanity/queries/fractional-cto-page'
import { resolvePageTitle } from '@/lib/seo/page-title'

// /services/fractional-ctos - bespoke dark/lime "Fractional CTO" landing page
// (docs/raw-html/Fractional CTO Page (offline).html). Header and footer come
// from the shared layout; the sections (hero -> final CTA) are the ported
// design. This static route takes precedence over the services/[slug] Sanity
// route, and is the destination of the Services hub "Fractional CTOs" card.
// Copy is now editable in Sanity (fractionalCtoPage singleton); the static FCTO
// stays as the fallback when the doc is absent / fails validation.

export async function generateMetadata(): Promise<Metadata> {
  const data = await fetchFractionalCtoPage()
  return {
    title: resolvePageTitle(data?.metaTitle ?? FRACTIONAL_CTO_META.title ),
    description: data?.metaDescription ?? FRACTIONAL_CTO_META.description,
    alternates: {
      canonical: generateCanonical('/services/fractional-ctos', 'en-US'),
      languages: generateHreflang('/services/fractional-ctos'),
    },
  }
}

export default async function FractionalCtoPage() {
  const data = await fetchFractionalCtoPage()
  const content = data ? toFctoContent(data) : FCTO
  return <FractionalCtoTemplate content={content} />
}

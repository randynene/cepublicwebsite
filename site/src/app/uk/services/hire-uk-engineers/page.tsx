import type { Metadata } from 'next'

import { HireEngineersMarketTemplate } from '@/components/templates/hire-engineers-market'
import { HireEngineersMarketJsonLd } from '@/components/templates/hire-engineers-market/json-ld'
import { UKHE, UK_HIRE_ENGINEERS_META } from '@/components/templates/hire-engineers-market/content.uk'
import { generateCanonical, generateHreflang } from '@/lib/locale'
import { resolvePageTitle } from '@/lib/seo/page-title'

// /uk/services/hire-uk-engineers - UK market, UK locale. The en-GB half of the
// pair whose en-US half is /services/hire-uk-engineers.
//
// app/layout.tsx derives `lang` from the path, so this route gets UK chrome for
// free. See the locale-vs-market axis note in
// services/hire-us-engineers/page.tsx for why there are four of these.
/** Sitewide fallback card. No bespoke OG art exists for these pages yet. */
const OG_IMAGE = '/og-default.png'
const PATH = '/services/hire-uk-engineers'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: resolvePageTitle(UK_HIRE_ENGINEERS_META.title),
    description: UK_HIRE_ENGINEERS_META.description,
    alternates: {
      canonical: generateCanonical(PATH, 'en-GB'),
      languages: generateHreflang(PATH),
    },
    // og:url and og:type are NOT inferred by Next from the canonical, so without
    // this block a share card has no canonical URL and no type. `type` is
    // 'website' rather than 'article': this is a landing page, not a post.
    //
    // `images` is repeated here on purpose. Metadata merges SHALLOWLY, so
    // declaring an `openGraph` object at all REPLACES the root layout's
    // `openGraph: { images: ['/og-default.png'] }` rather than extending it.
    // Omitting it silently stripped og:image and twitter:image from all four
    // pages - the share card lost its picture the moment og:url was added.
    openGraph: {
      title: UK_HIRE_ENGINEERS_META.title,
      description: UK_HIRE_ENGINEERS_META.description,
      url: generateCanonical(PATH, 'en-GB'),
      type: 'website',
      images: [OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      images: [OG_IMAGE],
      title: UK_HIRE_ENGINEERS_META.title,
      description: UK_HIRE_ENGINEERS_META.description,
    },
  }
}

export default function UkLocaleHireUkEngineersPage() {
  return (
    <>
      <HireEngineersMarketJsonLd content={UKHE} meta={UK_HIRE_ENGINEERS_META} locale="en-GB" path={PATH} />
      <HireEngineersMarketTemplate content={UKHE} locale="en-GB" path={PATH} />
    </>
  )
}

import type { Metadata } from 'next'

import { HireEngineersMarketTemplate } from '@/components/templates/hire-engineers-market'
import { HireEngineersMarketJsonLd } from '@/components/templates/hire-engineers-market/json-ld'
import { UHE, US_HIRE_ENGINEERS_META } from '@/components/templates/hire-engineers-market/content.us'
import { generateCanonical, generateHreflang } from '@/lib/locale'
import { resolvePageTitle } from '@/lib/seo/page-title'

// /uk/services/hire-us-engineers - US market, UK locale. The mirror image of
// /services/hire-uk-engineers, and it exists for the mirror-image reason: a
// London CTO opening a US office needs the US market page without being thrown
// off the UK site to get it.
//
// app/layout.tsx derives `lang` from the path, so this route gets UK chrome for
// free. See the locale-vs-market axis note in
// services/hire-us-engineers/page.tsx.
/** Sitewide fallback card. No bespoke OG art exists for these pages yet. */
const OG_IMAGE = '/og-default.png'
const PATH = '/services/hire-us-engineers'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: resolvePageTitle(US_HIRE_ENGINEERS_META.title),
    description: US_HIRE_ENGINEERS_META.description,
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
      title: US_HIRE_ENGINEERS_META.title,
      description: US_HIRE_ENGINEERS_META.description,
      url: generateCanonical(PATH, 'en-GB'),
      type: 'website',
      images: [OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      images: [OG_IMAGE],
      title: US_HIRE_ENGINEERS_META.title,
      description: US_HIRE_ENGINEERS_META.description,
    },
  }
}

export default function UkLocaleHireUsEngineersPage() {
  return (
    <>
      <HireEngineersMarketJsonLd content={UHE} meta={US_HIRE_ENGINEERS_META} locale="en-GB" path={PATH} />
      <HireEngineersMarketTemplate content={UHE} locale="en-GB" path={PATH} />
    </>
  )
}

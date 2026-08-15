import type { Metadata } from 'next'

import { HireEngineersMarketTemplate } from '@/components/templates/hire-engineers-market'
import { HireEngineersMarketJsonLd } from '@/components/templates/hire-engineers-market/json-ld'
import { UKHE, UK_HIRE_ENGINEERS_META } from '@/components/templates/hire-engineers-market/content.uk'
import { generateCanonical, generateHreflang } from '@/lib/locale'
import { resolvePageTitle } from '@/lib/seo/page-title'

// /services/hire-uk-engineers - permanent UK engineering hires, served on the
// DEFAULT (US) locale.
//
// This route is the reason the 2x2 exists. A US founder wanting engineers in
// London is an ordinary case, not an edge case, and until this page existed the
// UK market was reachable only from /uk/ - so the buyer most likely to search
// for it was the one who could not get to it.
//
// Locale stays en-US here (US chrome, US-facing site) while the CONTENT is the
// UK market file, prices in pounds, and describes UK notice periods. That split
// is deliberate: see the axis note in services/hire-us-engineers/page.tsx.
//
// HREFLANG pairs this with /uk/services/hire-uk-engineers (same market, other
// locale), NOT with /services/hire-us-engineers (different market, same locale).
/** Sitewide fallback card. No bespoke OG art exists for these pages yet. */
const OG_IMAGE = '/og-default.png'
const PATH = '/services/hire-uk-engineers'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: resolvePageTitle(UK_HIRE_ENGINEERS_META.title),
    description: UK_HIRE_ENGINEERS_META.description,
    alternates: {
      canonical: generateCanonical(PATH, 'en-US'),
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
      url: generateCanonical(PATH, 'en-US'),
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

export default function HireUkEngineersPage() {
  return (
    <>
      <HireEngineersMarketJsonLd content={UKHE} meta={UK_HIRE_ENGINEERS_META} locale="en-US" path={PATH} />
      <HireEngineersMarketTemplate content={UKHE} locale="en-US" path={PATH} />
    </>
  )
}

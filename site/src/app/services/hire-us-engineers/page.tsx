import type { Metadata } from 'next'

import { HireEngineersMarketTemplate } from '@/components/templates/hire-engineers-market'
import { HireEngineersMarketJsonLd } from '@/components/templates/hire-engineers-market/json-ld'
import { UHE, US_HIRE_ENGINEERS_META } from '@/components/templates/hire-engineers-market/content.us'
import { generateCanonical, generateHreflang } from '@/lib/locale'
import { resolveHireEngineersMarket } from '@/lib/hire-engineers-market/content'
import { resolvePageTitle } from '@/lib/seo/page-title'

// /services/hire-us-engineers - permanent US engineering hires (direct hire).
//
// LOCALE AND MARKET ARE DIFFERENT AXES. This is the load-bearing idea behind all
// four of these routes, and getting it wrong is what the first cut did:
//
//   locale (/ vs /uk/)  = who is READING. Currency, spelling, legal entity.
//   market (hire-us- vs hire-uk-) = where the ENGINEERS are. The product.
//
// They are orthogonal, so the routes are a 2x2 rather than a diagonal:
//
//   /services/hire-us-engineers        en-US   content.us
//   /services/hire-uk-engineers        en-US   content.uk
//   /uk/services/hire-us-engineers     en-GB   content.us
//   /uk/services/hire-uk-engineers     en-GB   content.uk
//
// The first version shipped only the diagonal (US market on the US site, UK
// market on the UK site), which meant a US buyer who wanted UK engineers could
// not reach that page at all. That is a normal thing to want and it was
// unreachable.
//
// HREFLANG pairs the SAME MARKET ACROSS LOCALES - this page with
// /uk/services/hire-us-engineers - because those two ARE regional variants of
// one page. It deliberately does NOT pair the two MARKET pages with each other:
// "hire US engineers" and "hire UK engineers" answer different searches, and
// declaring them alternates invites Google to collapse one into the other.
// `generateHreflang` produces exactly the right pair now that both locales of
// this path exist.
//
// This static route takes precedence over the services/[slug] Sanity route, and
// no Sanity `service` doc uses this slug (checked against the production
// dataset), so the URL is emitted once in the sitemap.
//
// SANITY: copy is static (hire-engineers-market/content.us.ts) by design in this
// pass. A singleton would attach the way hireEngineersPage does on
// /services/software-engineers, with UHE kept as the fallback.
/** Sitewide fallback card. No bespoke OG art exists for these pages yet. */
const OG_IMAGE = '/og-default.png'
const PATH = '/services/hire-us-engineers'

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await resolveHireEngineersMarket('hireUsEngineersPage', UHE, US_HIRE_ENGINEERS_META)
  return {
    title: resolvePageTitle(meta.title),
    description: meta.description,
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
      title: meta.title,
      description: meta.description,
      url: generateCanonical(PATH, 'en-US'),
      type: 'website',
      images: [OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      images: [OG_IMAGE],
      title: meta.title,
      description: meta.description,
    },
  }
}

export default async function HireUsEngineersPage() {
  const { content, meta } = await resolveHireEngineersMarket('hireUsEngineersPage', UHE, US_HIRE_ENGINEERS_META)
  return (
    <>
      <HireEngineersMarketJsonLd content={content} meta={meta} locale="en-US" path={PATH} />
      <HireEngineersMarketTemplate content={content} locale="en-US" path={PATH} />
    </>
  )
}

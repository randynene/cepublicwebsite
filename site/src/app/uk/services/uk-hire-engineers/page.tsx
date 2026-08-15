import type { Metadata } from 'next'

import { buildFaqPageJsonLd } from '@/components/templates/catalogue/faq-json-ld'
import { HireEngineersMarketTemplate } from '@/components/templates/hire-engineers-market'
import { UKHE, UK_HIRE_ENGINEERS_META } from '@/components/templates/hire-engineers-market/content.uk'
import { generateCanonical } from '@/lib/locale'
import { resolvePageTitle } from '@/lib/seo/page-title'

// /uk/services/uk-hire-engineers - bespoke dark/lime landing page for PERMANENT
// UK engineering hires (direct hire). Header and footer come from the shared
// layout, and because app/layout.tsx derives `lang` from the path, this route
// gets UK chrome for free. The sections (hero -> final CTA) are the ported
// design (docs/design/uk-hire-engineers.html).
//
// This static route takes precedence over the uk/services/[slug] Sanity route,
// and no Sanity `service` doc uses this slug (checked against the production
// dataset), so the URL is emitted once in the sitemap.
//
// SANITY: copy is static (components/templates/hire-engineers-market/content.uk.ts)
// by design in this pass, matching the US sibling.
//
// UK ONLY, and NOT a translation of /services/us-hire-engineers. The two are
// separate MARKET pages answering different searches ("hire software engineers
// UK" vs "hire software engineers US") with different pricing, different notice
// periods and different candidate pools. They are therefore NOT paired in
// hreflang: pairing them invites Google to treat one as a duplicate of the
// other and collapse it, which would cost whichever page it picked. Each is
// self-canonical with a single self-referencing alternate, the same posture the
// US route takes. `generateHreflang` is deliberately unused here because it
// always emits BOTH locales, and the en-US form of this path does not exist.
const PATH = '/services/uk-hire-engineers'

export async function generateMetadata(): Promise<Metadata> {
  const canonical = generateCanonical(PATH, 'en-GB')
  return {
    title: resolvePageTitle(UK_HIRE_ENGINEERS_META.title),
    description: UK_HIRE_ENGINEERS_META.description,
    alternates: {
      canonical,
      languages: { 'en-GB': canonical },
    },
  }
}

export default function UkHireEngineersMarketPage() {
  const faqJsonLd = buildFaqPageJsonLd(PATH, 'en-GB', UKHE.faq.items)
  return (
    <>
      {faqJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      ) : null}
      <HireEngineersMarketTemplate content={UKHE} locale="en-GB" path={PATH} />
    </>
  )
}

import type { Metadata } from 'next'

import { buildFaqPageJsonLd } from '@/components/templates/catalogue/faq-json-ld'
import { HireEngineersMarketTemplate } from '@/components/templates/hire-engineers-market'
import { UHE, US_HIRE_ENGINEERS_META } from '@/components/templates/hire-engineers-market/content.us'
import { generateCanonical } from '@/lib/locale'
import { resolvePageTitle } from '@/lib/seo/page-title'

// /services/us-hire-engineers - bespoke dark/lime landing page for PERMANENT US
// engineering hires (direct hire). Header and footer come from the shared
// layout; the sections (hero -> final CTA) are the ported design
// (docs/design/us-hire-engineers.html). This static route takes precedence over
// the services/[slug] Sanity route, and no Sanity `service` doc uses this slug,
// so the URL is emitted once in the sitemap.
//
// SANITY: copy is static (components/templates/hire-engineers-market/content.us.ts)
// by design in this pass. A `usHireEngineersPage` singleton would attach exactly
// where hireEngineersPage does on /services/software-engineers: fetch the doc
// here, transform it into UsHireEngineersContent, and keep UHE as the fallback.
//
// US ONLY. There is deliberately no /uk/services/us-hire-engineers - the page is
// about hiring in the United States. `generateHreflang` is therefore NOT used:
// it always emits an en-GB alternate, which here would point at a URL that does
// not exist. The canonical and the single en-US alternate are declared
// explicitly instead.
//
// The UK equivalent is /uk/services/uk-hire-engineers, built from the SAME
// template off content.uk.ts. It is deliberately NOT paired with this page in
// hreflang: they are two market pages answering different searches, not two
// translations of one page, and pairing them invites Google to collapse one.
// FAQ 10 links across to it in the body copy instead, which is the signal we
// actually want (a relationship, not an equivalence).
const PATH = '/services/us-hire-engineers'

export async function generateMetadata(): Promise<Metadata> {
  const canonical = generateCanonical(PATH, 'en-US')
  return {
    title: resolvePageTitle(US_HIRE_ENGINEERS_META.title),
    description: US_HIRE_ENGINEERS_META.description,
    alternates: {
      canonical,
      languages: { 'en-US': canonical, 'x-default': canonical },
    },
  }
}

export default function UsHireEngineersPage() {
  const faqJsonLd = buildFaqPageJsonLd(PATH, 'en-US', UHE.faq.items)
  return (
    <>
      {faqJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      ) : null}
      <HireEngineersMarketTemplate content={UHE} locale="en-US" path={PATH} />
    </>
  )
}

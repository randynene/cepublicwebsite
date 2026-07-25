import type { Metadata } from 'next'

import { PRICING_CONTENT, PRICING_META } from '@/components/templates/pricing/content'
import { PricingTemplate } from '@/components/templates/pricing'
import { PricingJsonLd } from '@/components/templates/pricing/json-ld'
import { generateCanonical, generateHreflang } from '@/lib/locale'
import { fetchPricingPage, toPricingContent } from '@/lib/sanity/queries/pricing-page'

// /pricing
//
// The locked design (docs/raw-html/Pricing Page 2.dc.html) rendered through the
// bespoke pricing template with its interactive cost calculator. Copy arrives via
// the typed PRICING_CONTENT fallback; the Sanity pricingPage singleton overrides
// it once wired (next commit).

export async function generateMetadata(): Promise<Metadata> {
  const doc = await fetchPricingPage()
  return {
    title: doc?.metaTitle ?? PRICING_META.title,
    description: doc?.metaDescription ?? PRICING_META.description,
    alternates: {
      canonical: generateCanonical('/pricing', 'en-US'),
      languages: generateHreflang('/pricing'),
    },
  }
}

export default async function PricingPage() {
  const doc = await fetchPricingPage()
  const content = doc ? toPricingContent(doc) : PRICING_CONTENT
  return (
    <>
      <PricingJsonLd
        locale="en-US"
        path="/pricing"
        title={doc?.metaTitle ?? PRICING_META.title}
        description={doc?.metaDescription ?? PRICING_META.description}
        faqItems={content.faq.items}
      />
      <PricingTemplate content={content} />
    </>
  )
}

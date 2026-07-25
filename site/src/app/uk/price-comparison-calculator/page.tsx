import type { Metadata } from 'next'

import {
  buildCalculatorMetadata,
  renderCalculatorPage,
} from '@/lib/calculators/render-route'

// /price-comparison-calculator  (UK locale mirror)
//
// The in-house vs Cloud Employee cost comparison. Rebuilt from the live
// calculator's own source: the rate card is in Sanity (market salaries go stale and
// Seb must be able to fix them), the arithmetic is in lib/calculators, and it
// reproduces the live figures exactly across every region, seniority, headcount and
// period.
//
// The result lives in the query string, so a comparison can be sent to a CFO as a
// link. That is the point of the page.

export async function generateMetadata(): Promise<Metadata> {
  return buildCalculatorMetadata(
    'priceComparisonCalculatorPage',
    '/price-comparison-calculator',
    'en-GB',
  )
}

export default async function PriceComparisonCalculatorUkPage() {
  return renderCalculatorPage(
    'priceComparisonCalculatorPage',
    '/price-comparison-calculator',
    'en-GB',
    'Price Comparison Calculator',
  )
}

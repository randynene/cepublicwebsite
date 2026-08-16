import 'server-only'

import type { HireEngineersMarketContent } from '@/components/templates/hire-engineers-market/content-types'
import type { HireEngineersMarketMeta } from '@/components/templates/hire-engineers-market/json-ld'
import {
  fetchHireEngineersMarketPage,
  toHireEngineersMarketContent,
  type HireEngineersMarketDocId,
} from '@/lib/sanity/queries/hire-engineers-market-page'

// Resolves a market page's content + meta from Sanity, falling back to the
// static content the template ships with.
//
// Shared by all FOUR market routes because market and locale are different
// axes: /services/hire-us-engineers and /uk/services/hire-us-engineers read the
// SAME document and differ only in chrome and canonical. Putting the resolution
// here is what stops those two routes drifting.
//
// Both `generateMetadata` and the page body call this. That is two calls per
// render, which is the same shape contactPage uses: `sanityFetch` is
// request-deduplicated, so it is one query.
//
// serviceType / breadcrumbLabel / areaServed stay CODE-OWNED. They are
// structured-data facts about what the page sells and where, not page copy,
// and a typo in `areaServed` is a schema.org error rather than a wording
// choice. Only the title and description are editable.

export async function resolveHireEngineersMarket(
  id: HireEngineersMarketDocId,
  fallbackContent: HireEngineersMarketContent,
  fallbackMeta: HireEngineersMarketMeta,
): Promise<{ content: HireEngineersMarketContent; meta: HireEngineersMarketMeta }> {
  const data = await fetchHireEngineersMarketPage(id)
  if (!data) return { content: fallbackContent, meta: fallbackMeta }

  const metaTitle =
    typeof data.metaTitle === 'string' && data.metaTitle.trim() ? data.metaTitle : fallbackMeta.title
  const metaDescription =
    typeof data.metaDescription === 'string' && data.metaDescription.trim()
      ? data.metaDescription
      : fallbackMeta.description

  return {
    content: toHireEngineersMarketContent(data, fallbackContent),
    meta: { ...fallbackMeta, title: metaTitle, description: metaDescription },
  }
}

import 'server-only'

import { env } from '@/lib/env'
import { generateCanonical, type Locale } from '@/lib/locale'
import { serializeJsonLd } from '@/lib/seo/serialize-json-ld'
import type { HubFaq } from '@/data/services'

// WebPage (+ FAQPage) JSON-LD for the Services/Technology catalogue pages, mirroring
// the pricing/how-it-works/location json-ld pattern.
export function CatalogueJsonLd({
  locale,
  path,
  title,
  description,
  faqs,
}: {
  locale: Locale
  path: string
  title: string
  description: string
  faqs?: HubFaq[]
}) {
  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  const canonical = generateCanonical(path, locale)
  const graph: Record<string, unknown>[] = [
    {
      '@type': 'WebPage',
      '@id': `${canonical}#webpage`,
      name: title,
      description,
      url: canonical,
      isPartOf: { '@id': `${base}/#website` },
    },
  ]
  if (faqs && faqs.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${canonical}#faq`,
      isPartOf: { '@id': `${canonical}#webpage` },
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    })
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd({ '@context': 'https://schema.org', '@graph': graph }) }}
    />
  )
}

import 'server-only'

import { env } from '@/lib/env'
import { generateCanonical, type Locale } from '@/lib/locale'
import { serializeJsonLd } from '@/lib/seo/serialize-json-ld'

interface LocationFaqEntry {
  question?: string | null
  answer?: string | null
}

interface LocationJsonLdProps {
  locale: Locale
  path: string
  title: string
  description: string
  faqItems?: readonly LocationFaqEntry[]
}

// Location page structured data. The root layout emits the sitewide
// Organization + WebSite nodes; this adds a WebPage node (isPartOf the WebSite)
// plus a FAQPage node built from the region FAQ - one @graph, mirroring
// templates/how-it-works/json-ld and templates/pricing/json-ld.
export function LocationJsonLd({ locale, path, title, description, faqItems }: LocationJsonLdProps) {
  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  const canonical = generateCanonical(path, locale)

  const webPage = {
    '@type': 'WebPage',
    '@id': `${canonical}#webpage`,
    name: title,
    description,
    url: canonical,
    isPartOf: { '@id': `${base}/#website` },
  }

  const answered = (faqItems ?? []).filter(
    (f): f is { question: string; answer: string } => Boolean(f.question) && Boolean(f.answer),
  )

  const graph: Record<string, unknown>[] = [webPage]
  if (answered.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${canonical}#faq`,
      isPartOf: { '@id': `${canonical}#webpage` },
      mainEntity: answered.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer },
      })),
    })
  }

  const jsonLd = { '@context': 'https://schema.org', '@graph': graph }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
    />
  )
}

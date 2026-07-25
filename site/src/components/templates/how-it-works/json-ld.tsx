import 'server-only'

import { env } from '@/lib/env'
import { generateCanonical, type Locale } from '@/lib/locale'
import { serializeJsonLd } from '@/lib/seo/serialize-json-ld'

interface HiwFaqEntry {
  question?: string | null
  answer?: string | null
}

interface HowItWorksJsonLdProps {
  locale: Locale
  title: string
  description: string
  /** FAQ Q&A pairs. Emits a FAQPage node (AEO: answer-engine citation surface)
   *  when present. Entries missing a question or answer are dropped so no
   *  invalid acceptedAnswer is fabricated. */
  faqItems?: readonly HiwFaqEntry[]
}

// How It Works structured data. The root layout already emits the sitewide
// Organization + WebSite nodes (Tech Debt #47), so this adds a WebPage node
// (isPartOf the WebSite) plus a FAQPage node built from the real, answered FAQ
// now stored in Sanity. Both nodes ship in one @graph - mirrors
// templates/home/json-ld.
export function HowItWorksJsonLd({ locale, title, description, faqItems }: HowItWorksJsonLdProps) {
  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  const canonical = generateCanonical('/how-it-works', locale)

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

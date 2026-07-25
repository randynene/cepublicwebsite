import 'server-only'

import { generateCanonical, type Locale } from '@/lib/locale'
import type { HubFaq } from '@/data/services'

// Builds a standalone FAQPage JSON-LD node for a catalogue (service/technology)
// detail page, keyed to the page's canonical URL. Returns null when there are no
// FAQs so the caller can skip emitting an empty node. Answers are already plain
// text (flattened from PortableText in the transform).
export function buildFaqPageJsonLd(
  path: string,
  locale: Locale,
  faqs?: HubFaq[],
): Record<string, unknown> | null {
  if (!faqs || faqs.length === 0) return null
  const canonical = generateCanonical(path, locale)
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${canonical}#faq`,
    url: canonical,
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }
}

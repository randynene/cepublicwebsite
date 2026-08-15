import 'server-only'

import { buildFaqPageJsonLd } from '@/components/templates/catalogue/faq-json-ld'
import { env } from '@/lib/env'
import { generateCanonical, type Locale } from '@/lib/locale'
import { serializeJsonLd } from '@/lib/seo/serialize-json-ld'
import { UI_STRINGS } from '@/lib/ui-strings'

import type { HireEngineersMarketContent } from './content-types'

/** The shape both markets' *_HIRE_ENGINEERS_META consts satisfy. */
export interface HireEngineersMarketMeta {
  title: string
  description: string
  serviceType: string
  breadcrumbLabel: string
  areaServed: string
}

// Structured data for the two hire-engineers MARKET pages.
//
// Extracted into a module rather than left inline in the routes for the reason
// the per-template SEO checklist gives (G4): every emission site goes through
// `serializeJsonLd`, never raw `JSON.stringify`. The routes previously used raw
// stringify. The content is static today so there was no live XSS vector, but
// the escaping is not really about today - it is about the Sanity singleton
// these pages are already designed to accept, at which point an editor-authored
// `</script>` in any FAQ answer breaks out of the tag. Doing it at the point the
// content is static is free; doing it after the singleton lands is a fix.
//
// Three nodes, each earning its place:
//   Service        - what the page sells. These are engagements CE sells, so
//                    they mirror the service/technology templates rather than
//                    emitting a generic WebPage.
//   BreadcrumbList - required on every non-home template.
//   FAQPage        - the visible FAQ, same plain-text answers as the DOM.

interface JsonLdProps {
  content: HireEngineersMarketContent
  meta: HireEngineersMarketMeta
  locale: Locale
  /** Unprefixed site path, e.g. /services/hire-us-engineers. */
  path: string
}

export function HireEngineersMarketJsonLd({ content, meta, locale, path }: JsonLdProps) {
  const service = buildServiceJsonLd(meta, locale, path)
  const breadcrumb = buildBreadcrumbListJsonLd(meta, locale, path)
  const faqPage = buildFaqPageJsonLd(path, locale, content.faq.items)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(service) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumb) }}
      />
      {faqPage ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqPage) }}
        />
      ) : null}
    </>
  )
}

/**
 * `areaServed` is the one field that makes these two pages distinguishable to a
 * crawler: same provider, same process, different market. It is data-backed -
 * `content.market` is what already drives the copy - rather than inferred from
 * the slug.
 */
function buildServiceJsonLd(meta: HireEngineersMarketMeta, locale: Locale, path: string) {
  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  const canonical = generateCanonical(path, locale)

  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${canonical}#service`,
    name: meta.breadcrumbLabel,
    description: meta.description,
    url: canonical,
    serviceType: meta.serviceType,
    areaServed: { '@type': 'Country', name: meta.areaServed },
    provider: { '@id': `${base}/#organization` },
  }
}

function buildBreadcrumbListJsonLd(meta: HireEngineersMarketMeta, locale: Locale, path: string) {
  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  const localePrefix = locale === 'en-GB' ? '/uk' : ''

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: UI_STRINGS['breadcrumb.home'],
        item: `${base}${localePrefix}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: UI_STRINGS['breadcrumb.services'],
        item: `${base}${localePrefix}/services`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: meta.breadcrumbLabel,
        item: generateCanonical(path, locale),
      },
    ],
  }
}

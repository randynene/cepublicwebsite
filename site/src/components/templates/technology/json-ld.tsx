import 'server-only'

import { env } from '@/lib/env'
import { generateCanonical, type Locale } from '@/lib/locale'
import { serializeJsonLd } from '@/lib/seo/serialize-json-ld'
import { UI_STRINGS } from '@/lib/ui-strings'
import type { HubFaq } from '@/data/services'
import type { Technology } from '@/types/sanity/documents/technology'
import { buildFaqPageJsonLd } from '@/components/templates/catalogue/faq-json-ld'

interface JsonLdProps {
  technology: Technology
  locale: Locale
  faqs?: HubFaq[]
}

export function TechnologyJsonLd({ technology, locale, faqs }: JsonLdProps) {
  const webPage = buildWebPageJsonLd(technology, locale)
  const breadcrumb = buildBreadcrumbListJsonLd(technology, locale)
  const faqPage = buildFaqPageJsonLd(`/technology/${technology.slug}`, locale, faqs)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(webPage) }}
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

// WebPage @type — technology docs describe a skill/technology (the sellable
// service entities are the separate `service` docs). WebPage is the honest,
// non-overclaiming type; it references the sitewide WebSite node via isPartOf.
// Only data-backed fields are emitted.
function buildWebPageJsonLd(technology: Technology, locale: Locale) {
  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  const canonical = generateCanonical(`/technology/${technology.slug}`, locale)

  const json: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${canonical}#webpage`,
    name: technology.metaTitle?.trim() || technology.technologyName,
    url: canonical,
    isPartOf: { '@id': `${base}/#website` },
  }

  const description = technology.metaDescription?.trim()
  if (description) {
    json.description = description
  }

  return json
}

function buildBreadcrumbListJsonLd(technology: Technology, locale: Locale) {
  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  const localePrefix = locale === 'en-GB' ? '/uk' : ''
  const home = `${base}${localePrefix}/`
  // Detail route is /technology/[slug]; the collection HUB is /technology.
  const hub = `${base}${localePrefix}/technology`
  const detail = generateCanonical(`/technology/${technology.slug}`, locale)

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: UI_STRINGS['breadcrumb.home'],
        item: home,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: UI_STRINGS['breadcrumb.technology'],
        item: hub,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: technology.technologyName,
        item: detail,
      },
    ],
  }
}

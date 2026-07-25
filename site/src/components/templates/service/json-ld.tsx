import 'server-only'

import { serviceCategoryLabel } from '@/components/templates/service'
import { env } from '@/lib/env'
import { generateCanonical, type Locale } from '@/lib/locale'
import { urlFor } from '@/lib/sanity/image'
import { serializeJsonLd } from '@/lib/seo/serialize-json-ld'
import { UI_STRINGS } from '@/lib/ui-strings'
import type { HubFaq } from '@/data/services'
import type { Service } from '@/types/sanity/documents/service'
import { buildFaqPageJsonLd } from '@/components/templates/catalogue/faq-json-ld'

interface JsonLdProps {
  service: Service
  locale: Locale
  faqs?: HubFaq[]
}

export function ServiceJsonLd({ service, locale, faqs }: JsonLdProps) {
  const serviceBlock = buildServiceJsonLd(service, locale)
  const breadcrumb = buildBreadcrumbListJsonLd(service, locale)
  const faqPage = buildFaqPageJsonLd(`/services/${service.slug}`, locale, faqs)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(serviceBlock) }}
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

function buildServiceJsonLd(service: Service, locale: Locale) {
  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  const canonical = generateCanonical(`/services/${service.slug}`, locale)

  // Service @type. provider references the sitewide Organization node (@id)
  // rather than fabricating an org name. Only data-backed fields are emitted.
  const json: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${canonical}#service`,
    name: service.name,
    url: canonical,
    serviceType: serviceCategoryLabel(service.type),
    provider: { '@id': `${base}/#organization` },
  }

  const description = service.metaDescription?.trim()
  if (description) {
    json.description = description
  }

  const imageSource = service.openGraphImage?.asset
    ? service.openGraphImage
    : service.thumbnail?.asset
      ? service.thumbnail
      : null
  if (imageSource?.asset) {
    json.image = urlFor(imageSource).width(1200).height(630).url()
  }

  return json
}

function buildBreadcrumbListJsonLd(service: Service, locale: Locale) {
  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  const localePrefix = locale === 'en-GB' ? '/uk' : ''
  const home = `${base}${localePrefix}/`
  // Detail route is /services/[slug]; the collection HUB is /services.
  const hub = `${base}${localePrefix}/services`
  const detail = generateCanonical(`/services/${service.slug}`, locale)

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
        name: UI_STRINGS['breadcrumb.services'],
        item: hub,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: service.name,
        item: detail,
      },
    ],
  }
}

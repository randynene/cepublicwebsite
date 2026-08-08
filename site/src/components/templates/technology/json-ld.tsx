import 'server-only'

import { env } from '@/lib/env'
import { generateCanonical, type Locale } from '@/lib/locale'
import { urlFor } from '@/lib/sanity/image'
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
  const serviceBlock = buildServiceJsonLd(technology, locale)
  const breadcrumb = buildBreadcrumbListJsonLd(technology, locale)
  const faqPage = buildFaqPageJsonLd(`/technology/${technology.slug}`, locale, faqs)

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

// Service @type (roadmap W2-06). Technology detail pages are engagements CE
// sells (React development, cloud engineering, and so on), so they mirror the
// parallel `service` template's Service block rather than emitting WebPage.
// Shape, helper usage and escaping follow site/src/components/templates/service/
// json-ld.tsx exactly. `provider` references the sitewide Organization node
// (@id) rather than fabricating an org name. serviceType is intentionally not
// emitted: technology docs carry no category enum equivalent to service.type,
// and only data-backed fields are emitted.
function buildServiceJsonLd(technology: Technology, locale: Locale) {
  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  const canonical = generateCanonical(`/technology/${technology.slug}`, locale)

  const json: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${canonical}#service`,
    name: technology.technologyName,
    url: canonical,
    provider: { '@id': `${base}/#organization` },
  }

  const description = technology.metaDescription?.trim()
  if (description) {
    json.description = description
  }

  const imageSource = technology.openGraphImage?.asset
    ? technology.openGraphImage
    : technology.thumbnail?.asset
      ? technology.thumbnail
      : null
  if (imageSource?.asset) {
    json.image = urlFor(imageSource).width(1200).height(630).url()
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

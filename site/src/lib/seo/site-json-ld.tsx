import 'server-only'

import { env } from '@/lib/env'
import { urlFor } from '@/lib/sanity/image'
import { fetchSiteSettingsForJsonLd } from '@/lib/sanity/queries/site-settings'
import { serializeJsonLd } from '@/lib/seo/serialize-json-ld'

// Sitewide Organization + WebSite JSON-LD (SEO launch gate P0-2).
//
// Entity facts sourced from Sanity siteSettings.socialProof where present.
// Logo falls back to /ce-logo.svg (the live chrome asset) when Studio has
// not uploaded socialProof.logo. sameAs omitted — no verified social URLs
// in siteSettings schema today (data gap for Jake/Seb).

const FALLBACK_LOGO_PATH = '/ce-logo.svg'

function resolveLogoUrl(
  logo: Record<string, unknown> | null | undefined,
  base: string,
): string {
  if (logo?.asset) {
    return urlFor(logo).url()
  }
  return `${base}${FALLBACK_LOGO_PATH}`
}

export async function SiteJsonLd() {
  const settings = await fetchSiteSettingsForJsonLd()
  if (!settings) return null

  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  const social = settings.socialProof
  const orgName = social?.organizationName ?? settings.siteName
  const orgUrl = social?.organizationUrl ?? settings.siteUrl
  const logoUrl = resolveLogoUrl(social?.logo ?? null, base)
  const orgId = `${base}/#organization`

  const organization: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': orgId,
    name: orgName,
    url: orgUrl,
    logo: {
      '@type': 'ImageObject',
      url: logoUrl,
    },
  }

  if (social?.foundingDate) {
    organization.foundingDate = social.foundingDate
  }
  if (social?.description) {
    organization.description = social.description
  }

  const website: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${base}/#website`,
    name: settings.siteName,
    url: settings.siteUrl,
    publisher: { '@id': orgId },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(website) }}
      />
    </>
  )
}

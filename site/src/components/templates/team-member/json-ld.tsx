import 'server-only'

import { env } from '@/lib/env'
import { generateCanonical, type Locale } from '@/lib/locale'
import { urlFor } from '@/lib/sanity/image'
import type { SiteSettingsJsonLd } from '@/lib/sanity/queries/site-settings'
import { serializeJsonLd } from '@/lib/seo/serialize-json-ld'
import type { TeamMember } from '@/types/sanity/documents/team-member'

const FALLBACK_OG_PATH = '/og-default.png'

interface JsonLdProps {
  member: TeamMember
  locale: Locale
  siteSettings: SiteSettingsJsonLd | null
}

export function TeamMemberJsonLd({ member, locale, siteSettings }: JsonLdProps) {
  const person = buildPersonJsonLd(member, locale, siteSettings)
  const breadcrumb = buildBreadcrumbListJsonLd(member, locale)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(person) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumb) }}
      />
    </>
  )
}

function buildPersonJsonLd(
  member: TeamMember,
  locale: Locale,
  settings: SiteSettingsJsonLd | null,
) {
  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  const usPath = `/team/${member.slug}`
  const canonical = generateCanonical(usPath, locale)

  const imageSource = member.teamMemberImage
  const image = imageSource?.asset
    ? urlFor(imageSource).width(800).height(800).url()
    : `${base}${FALLBACK_OG_PATH}`

  const social = settings?.socialProof
  const orgName = social?.organizationName ?? settings?.siteName ?? 'Cloud Employee'
  const orgUrl = social?.organizationUrl ?? settings?.siteUrl ?? base

  const json: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${canonical}#person`,
    name: member.name,
    url: canonical,
    image,
    worksFor: {
      '@type': 'Organization',
      name: orgName,
      url: orgUrl,
    },
  }

  if (member.position) {
    json.jobTitle = member.position
  }

  if (member.linkedinLink) {
    json.sameAs = [member.linkedinLink]
  }

  return json
}

function buildBreadcrumbListJsonLd(member: TeamMember, locale: Locale) {
  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  const localePrefix = locale === 'en-GB' ? '/uk' : ''
  const home = `${base}${localePrefix}/`
  const aboutUs = `${base}${localePrefix}/about-us`
  const profile = generateCanonical(`/team/${member.slug}`, locale)

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: home },
      { '@type': 'ListItem', position: 2, name: 'About Us', item: aboutUs },
      { '@type': 'ListItem', position: 3, name: member.name, item: profile },
    ],
  }
}

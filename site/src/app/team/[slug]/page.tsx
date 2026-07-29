import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import TeamMemberTemplate from '@/components/templates/team-member'
import { TeamMemberJsonLd } from '@/components/templates/team-member/json-ld'
import { generateCanonical, generateHreflang } from '@/lib/locale'
import { urlFor } from '@/lib/sanity/image'
import {
  fetchAuthorBlogPosts,
  fetchTeamMember,
  fetchTeamMemberMeta,
  fetchTeamMemberParams,
} from '@/lib/sanity/queries/team-member'
import { fetchSiteSettingsForJsonLd } from '@/lib/sanity/queries/site-settings'
import { resolvePageTitle } from '@/lib/seo/page-title'

type RouteParams = { slug: string }

export async function generateStaticParams(): Promise<RouteParams[]> {
  const slugs = await fetchTeamMemberParams('en-US')
  if (slugs.length < 25) {
    console.error(
      `[TEMPLATE-TEAM_MEMBER] generateStaticParams (default locale): ${slugs.length} routable paths (expected 25)`,
    )
  }
  return slugs
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>
}): Promise<Metadata> {
  const { slug } = await params
  const member = await fetchTeamMemberMeta(slug, 'en-US')
  if (!member) return {}

  const usPath = `/team/${slug}`
  const canonical = generateCanonical(usPath, 'en-US')
  const hreflang = generateHreflang(usPath)

  const ogUrl = member.teamMemberImage?.asset
    ? urlFor(member.teamMemberImage).width(1200).height(630).url()
    : '/og-default.png'

  return {
    title: resolvePageTitle(member.metaTitle),
    description: member.metaDescription,
    alternates: { canonical, languages: hreflang },
    openGraph: {
      title: member.metaTitle,
      description: member.metaDescription,
      url: canonical,
      type: 'profile',
      images: [ogUrl],
    },
    twitter: {
      card: 'summary_large_image',
      title: member.metaTitle,
      description: member.metaDescription,
      images: [ogUrl],
    },
  }
}

export default async function TeamMemberDefaultPage({
  params,
}: {
  params: Promise<RouteParams>
}) {
  const { slug } = await params
  const member = await fetchTeamMember(slug, 'en-US')
  if (!member) notFound()
  const [articles, siteSettings] = await Promise.all([
    fetchAuthorBlogPosts(member._id),
    fetchSiteSettingsForJsonLd(),
  ])
  return (
    <main id="main">
      <TeamMemberJsonLd
        member={member}
        locale="en-US"
        siteSettings={siteSettings}
      />
      <TeamMemberTemplate
        member={member}
        articles={articles}
        locale="en-US"
      />
    </main>
  )
}

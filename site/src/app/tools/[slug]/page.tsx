import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import ToolTemplate from '@/components/templates/tool'
import { ToolJsonLd } from '@/components/templates/tool/json-ld'
import { generateCanonical, generateHreflang } from '@/lib/locale'
import { urlFor } from '@/lib/sanity/image'
import { resolvePageTitle } from '@/lib/seo/page-title'
import {
  fetchTool,
  fetchToolMeta,
  fetchToolParams,
} from '@/lib/sanity/queries/tool'

type RouteParams = { slug: string }

export async function generateStaticParams(): Promise<RouteParams[]> {
  const slugs = await fetchToolParams()
  if (slugs.length < 2) {
    console.error(
      `[TEMPLATE-TOOL] generateStaticParams (default locale): ${slugs.length} routable paths (expected 2)`,
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
  const tool = await fetchToolMeta(slug)
  if (!tool) return {}

  const title = tool.metaTitle ?? tool.name
  const usPath = `/tools/${slug}`
  const canonical = generateCanonical(usPath, 'en-US')
  const hreflang = generateHreflang(usPath)

  const ogUrl = tool.thumbnail?.asset
    ? urlFor(tool.thumbnail).width(1200).height(630).url()
    : '/og-default.png'

  return {
    title: resolvePageTitle(title),
    description: tool.metaDescription,
    alternates: { canonical, languages: hreflang },
    openGraph: {
      title,
      description: tool.metaDescription,
      url: canonical,
      type: 'website',
      images: [ogUrl],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: tool.metaDescription,
      images: [ogUrl],
    },
  }
}

export default async function ToolDefaultPage({
  params,
}: {
  params: Promise<RouteParams>
}) {
  const { slug } = await params
  const tool = await fetchTool(slug)
  if (!tool) notFound()

  return (
    <main id="main">
      <ToolJsonLd tool={tool} locale="en-US" />
      <ToolTemplate tool={tool} locale="en-US" />
    </main>
  )
}

import 'server-only'

import { toPlainText } from '@portabletext/toolkit'

import { env } from '@/lib/env'
import { generateCanonical, type Locale } from '@/lib/locale'
import { urlFor } from '@/lib/sanity/image'
import { serializeJsonLd } from '@/lib/seo/serialize-json-ld'
import type { FaqItem } from '@/types/sanity/shared'
import type { Tool } from '@/types/sanity/documents/tool'

interface JsonLdProps {
  tool: Tool
  locale: Locale
}

export function ToolJsonLd({ tool, locale }: JsonLdProps) {
  const webApplication = buildWebApplicationJsonLd(tool, locale)
  const breadcrumb = buildBreadcrumbListJsonLd(tool, locale)
  const hasFaqs = Array.isArray(tool.faqs) && tool.faqs.length > 0
  const faqPage = hasFaqs ? buildFaqPageJsonLd(tool.faqs!) : null

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(webApplication) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumb) }}
      />
      {faqPage && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqPage) }}
        />
      )}
    </>
  )
}

function buildToolDescription(tool: Tool): string {
  if (tool.metaDescription?.trim()) {
    return tool.metaDescription.trim()
  }
  if (Array.isArray(tool.description) && tool.description.length > 0) {
    return toPlainText(tool.description)
  }
  if (Array.isArray(tool.headerBlurb) && tool.headerBlurb.length > 0) {
    return toPlainText(tool.headerBlurb)
  }
  return ''
}

function buildWebApplicationJsonLd(tool: Tool, locale: Locale) {
  const usPath = `/tools/${tool.slug}`
  const canonical = generateCanonical(usPath, locale)
  const description = buildToolDescription(tool)

  const json: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    '@id': `${canonical}#webapplication`,
    url: canonical,
    name: tool.name,
    applicationCategory: 'BusinessApplication',
  }

  if (description) {
    json.description = description
  }
  if (tool.thumbnail?.asset) {
    json.image = urlFor(tool.thumbnail).width(1200).height(630).url()
  }

  return json
}

function buildBreadcrumbListJsonLd(tool: Tool, locale: Locale) {
  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  const localePrefix = locale === 'en-GB' ? '/uk' : ''
  const home = `${base}${localePrefix}/`
  const toolsIndex = `${base}${localePrefix}/tools`
  const detail = generateCanonical(`/tools/${tool.slug}`, locale)

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: home },
      { '@type': 'ListItem', position: 2, name: 'Tools', item: toolsIndex },
      { '@type': 'ListItem', position: 3, name: tool.name, item: detail },
    ],
  }
}

function buildFaqPageJsonLd(faqs: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.slice(0, 10).map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: toPlainText(faq.answer ?? []),
      },
    })),
  }
}

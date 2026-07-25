import 'server-only'

import Link from 'next/link'
import { Fragment } from 'react'

import { toPlainText } from '@portabletext/toolkit'

import { BlogCard } from '@/components/cards/blog-card'
import { CollectionCard } from '@/components/cards/collection-card'
import { ResourceCard } from '@/components/cards/resource-card'
import { Breadcrumbs, type BreadcrumbItem } from '@/components/shared/breadcrumbs'
import { Container } from '@/components/ui/container'
import { FaqList } from '@/components/ui/faq-list'
import { Heading } from '@/components/ui/heading'
import { PortableText } from '@/components/ui/portable-text'
import { Text } from '@/components/ui/text'
import type { FaqItem } from '@/types/sanity/shared'
import { env } from '@/lib/env'
import { buildPageNumbers, type PaginationState } from '@/lib/hubs/pagination'
import {
  HUB_CONFIG,
  type FeaturedRef,
  type HubChildItem,
  type HubSingleton,
  type HubType,
} from '@/lib/sanity/queries/hubs'
import { buildLocalePath, type Locale } from '@/lib/locale'
import { serializeJsonLd } from '@/lib/seo/serialize-json-ld'
import { UI_STRINGS } from '@/lib/ui-strings'

// MYGRATR-STATIC-1 Step 4 — shared hub render helper.
//
// Consumed by all 16 hub page.tsx route files. Each route stays thin:
// fetch the hub singleton + page-slice of children + count, then call
// renderHub. Per-route work is constrained to fetching + metadata.
//
// Renders, in order:
//   1) Breadcrumbs
//   2) Hero (eyebrow + title + heroDescription)
//   3) Featured cards (0-2 hub-pinned references; empty at seed)
//   4) Optional topicsHeader (blog hubs only)
//   5) Main paginated grid of cards
//   6) Pagination controls (prev/next + page badges when total > 5)
//   7) JSON-LD CollectionPage + BreadcrumbList (inline scripts)
//
// JSON-LD goes through serializeJsonLd (XSS-safe per CMA F4 v1.3).

// ────────────────────────────────────────────────────────────────────────
// Card kind dispatch
// ────────────────────────────────────────────────────────────────────────

function CardFor({
  item,
  hubType,
  priority,
  locale,
}: {
  item: HubChildItem
  hubType: HubType
  priority?: boolean
  locale: Locale
}) {
  const kind = HUB_CONFIG[hubType].cardKind
  if (kind === 'blog') return <BlogCard item={item} priority={priority} locale={locale} />
  if (kind === 'resource') return <ResourceCard item={item} priority={priority} locale={locale} />
  return <CollectionCard item={item} priority={priority} locale={locale} />
}

// ────────────────────────────────────────────────────────────────────────
// Pagination control
// ────────────────────────────────────────────────────────────────────────

function PaginationControl({ pagination }: { pagination: PaginationState }) {
  const { hasPrev, hasNext, prevUrl, nextUrl, currentPage, totalPages } = pagination
  if (totalPages <= 1) return null
  const pageNumbers = buildPageNumbers(currentPage, totalPages)

  return (
    <nav
      aria-label={UI_STRINGS['hub.paginationLabel']}
      className="mt-12 flex flex-wrap items-center justify-center gap-2"
    >
      {prevUrl && (
        <Link
          href={prevUrl}
          aria-label={UI_STRINGS['hub.previousPage']}
          rel="prev"
          className="inline-flex h-10 items-center rounded-pill border border-brand-tertiary/15 px-4 text-body-sm font-medium text-text-default hover:bg-brand-tertiary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring transition duration-reveal ease-reveal"
        >
          {UI_STRINGS['hub.previous']}
        </Link>
      )}

      <ol className="flex flex-wrap items-center gap-1">
        {pageNumbers.map((n, idx) => {
          if (n === null) {
            return (
              <li key={`gap-${idx}`} aria-hidden="true" className="px-2 text-text-default/50">
                {UI_STRINGS['hub.ellipsis']}
              </li>
            )
          }
          const isCurrent = n === currentPage
          const url = n === 1 ? pagination.canonicalUrl.split('?')[0] : `${pagination.canonicalUrl.split('?')[0]}?page=${n}`
          return (
            <li key={n}>
              {isCurrent ? (
                <span
                  aria-current="page"
                  className="inline-flex h-10 min-w-10 items-center justify-center rounded-pill bg-brand-primary px-3 text-body-sm font-medium text-text-dark"
                >
                  {n}
                </span>
              ) : (
                <Link
                  href={url}
                  aria-label={UI_STRINGS['hub.pageBadge'].replace('{n}', String(n))}
                  className="inline-flex h-10 min-w-10 items-center justify-center rounded-pill border border-brand-tertiary/15 px-3 text-body-sm font-medium text-text-default hover:bg-brand-tertiary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring transition duration-reveal ease-reveal"
                >
                  {n}
                </Link>
              )}
            </li>
          )
        })}
      </ol>

      {nextUrl && (
        <Link
          href={nextUrl}
          aria-label={UI_STRINGS['hub.nextPage']}
          rel="next"
          className="inline-flex h-10 items-center rounded-pill border border-brand-tertiary/15 px-4 text-body-sm font-medium text-text-default hover:bg-brand-tertiary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring transition duration-reveal ease-reveal"
        >
          {UI_STRINGS['hub.next']}
        </Link>
      )}
    </nav>
  )
}

// ────────────────────────────────────────────────────────────────────────
// Breadcrumbs trail builder
// ────────────────────────────────────────────────────────────────────────

// Every href is locale-prefixed. On a UK hub an unprefixed trail would both
// navigate the visitor out of their locale and emit a BreadcrumbList whose
// items point at the US pages, telling Google the UK hub belongs to a US trail.
function buildBreadcrumbs(hubType: HubType, locale: Locale): BreadcrumbItem[] {
  const cfg = HUB_CONFIG[hubType]
  const trail: BreadcrumbItem[] = [{ name: 'Home', href: buildLocalePath('/', locale) }]
  if (cfg.underBlog) {
    trail.push({ name: 'Blog', href: buildLocalePath('/blog', locale) })
  }
  trail.push({ name: cfg.breadcrumbName, href: buildLocalePath(cfg.basePath, locale) })
  return trail
}

// ────────────────────────────────────────────────────────────────────────
// JSON-LD builders
// ────────────────────────────────────────────────────────────────────────

function buildCollectionPageJsonLd(hub: HubSingleton, basePath: string) {
  const base = env.NEXT_PUBLIC_SITE_URL
  const url = `${base}${basePath}`
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${url}#collectionpage`,
    name: hub.title,
    description: hub.metaDescription,
    url,
  }
}

// The reason the hub FAQs are structured items rather than prose. A crawler cannot
// tell a question from a heading, so without this the answers are just paragraphs.
// Capped at 10 to match the other templates: Google reads the whole block but only
// ever surfaces a handful, and a 20-question rich result is not a thing.
function buildFaqPageJsonLd(faqs: FaqItem[], basePath: string) {
  const url = `${env.NEXT_PUBLIC_SITE_URL}${basePath}`
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${url}#faq`,
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

function buildBreadcrumbListJsonLd(items: BreadcrumbItem[]) {
  const base = env.NEXT_PUBLIC_SITE_URL
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: `${base}${item.href}`,
    })),
  }
}

// ────────────────────────────────────────────────────────────────────────
// Public surface
// ────────────────────────────────────────────────────────────────────────

export type RenderHubProps = {
  hub: HubSingleton
  hubType: HubType
  items: HubChildItem[]
  featured: FeaturedRef[]
  pagination: PaginationState
  locale?: Locale
}

export default function renderHub({
  hub,
  hubType,
  items,
  featured,
  pagination,
  locale = 'en-US',
}: RenderHubProps) {
  const cfg = HUB_CONFIG[hubType]
  const breadcrumbs = buildBreadcrumbs(hubType, locale)
  const localePath = buildLocalePath(cfg.basePath, locale)
  const collectionLd = buildCollectionPageJsonLd(hub, localePath)
  const breadcrumbLd = buildBreadcrumbListJsonLd(breadcrumbs)

  const body = hub.introContent ?? []
  const faqs = (hub.faqs ?? []) as FaqItem[]

  return (
    <Fragment>
      {/* JSON-LD — emitted inline per Step 4 brief. XSS-safe via serializeJsonLd. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(collectionLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbLd) }}
      />
      {faqs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildFaqPageJsonLd(faqs, localePath)) }}
        />
      )}

      {/* rel=prev / rel=next — React 19 hoists <link> tags to <head>. */}
      {pagination.prevUrl && (
        <link rel="prev" href={`${env.NEXT_PUBLIC_SITE_URL}${pagination.prevUrl}`} />
      )}
      {pagination.nextUrl && (
        <link rel="next" href={`${env.NEXT_PUBLIC_SITE_URL}${pagination.nextUrl}`} />
      )}

      <main id="main" className="pb-16 lg:pb-24">
        <Container as="section" className="pt-8 lg:pt-12">
          <Breadcrumbs items={breadcrumbs} className="mb-6" />
          <header className="flex flex-col gap-4 mb-10 lg:mb-12">
            {hub.eyebrow && (
              <Text as="p" size="small" className="uppercase tracking-wider text-brand-primary font-medium">
                {hub.eyebrow}
              </Text>
            )}
            <Heading as="h1">{hub.title}</Heading>
            {hub.heroDescription && hub.heroDescription.length > 0 && (
              <div className="max-w-prose">
                <PortableText
                  value={hub.heroDescription as Parameters<typeof PortableText>[0]['value']}
                />
              </div>
            )}
          </header>

          {/* Featured pinned items (0-2). Currently always empty at seed,
              but the render gates on length so the section disappears. */}
          {featured.length > 0 && (
            <section aria-labelledby="featured-heading" className="mb-12">
              <Heading id="featured-heading" as="h2" className="mb-6">
                {UI_STRINGS['hub.featuredHeading']}
              </Heading>
              <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {featured.map((ref, idx) => (
                  <li key={ref._id} className="contents">
                    <CardFor item={ref as unknown as HubChildItem} hubType={hubType} priority={idx < 2} locale={locale} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Topics header (blog hubs only). */}
          {cfg.shape === 'blog' && hub.topicsHeader && (
            <Heading as="h2" size="h2" className="mb-6">
              {hub.topicsHeader}
            </Heading>
          )}

          {/* Heading-order bridge for collection hubs (Lighthouse a11y
              audit fix, STATIC-1 Step 6). Without a real h2 between the
              page <h1> and the card <h3>s, Lighthouse flags heading-order.
              Blog hubs get topicsHeader above; collection hubs render a
              sr-only h2 so the outline is well-formed without changing
              the visual surface. */}
          {!(cfg.shape === 'blog' && hub.topicsHeader) && (
            <h2 className="sr-only">
              {UI_STRINGS['hub.collectionListSuffix'].replace('{name}', cfg.breadcrumbName)}
            </h2>
          )}

          {/* Main paginated list. */}
          {items.length > 0 ? (
            <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {items.map((item, idx) => (
                <li key={item._id} className="contents">
                  <CardFor item={item} hubType={hubType} priority={idx < 4} locale={locale} />
                </li>
              ))}
            </ul>
          ) : (
            <Text as="p" size="lead" className="text-text-default/70">
              {UI_STRINGS['hub.emptyState']}
            </Text>
          )}

          <PaginationControl pagination={pagination} />

          {/* Body copy, below the grid — which is where the live hub puts it, and
              where it belongs. On the six Knowledge Hubs this is the substance of
              the page: "Key Topics", "Key Market Insights", several hundred words
              of prose that is the reason these URLs rank. It shipped empty until
              now because the field was never projected.

              max-w-prose, not the full grid width: it is reading matter, and a
              line of text 1152px wide is not readable. */}
          {body.length > 0 && (
            <section className="mt-16 max-w-prose lg:mt-20">
              <PortableText value={body as Parameters<typeof PortableText>[0]['value']} />
            </section>
          )}

          {faqs.length > 0 && (
            <section aria-labelledby="hub-faqs" className="mt-16 lg:mt-20">
              <Heading id="hub-faqs" as="h2" className="mb-8">
                {UI_STRINGS['hub.faqHeading']}
              </Heading>
              <FaqList items={faqs} className="max-w-3xl" />
            </section>
          )}
        </Container>
      </main>
    </Fragment>
  )
}

import { toPlainText } from '@portabletext/toolkit'
import { Fragment } from 'react'

import { BlogCard } from '@/components/cards/blog-card'
import { BlogBand } from '@/components/blog/container'
import { LongFormBand } from '@/components/blog/long-form-band'
import { BlogPagination } from '@/components/blog/pagination'
import { SectionLabel } from '@/components/blog/section-label'
import { PortableText } from '@/components/ui/portable-text'
import { cn } from '@/components/ui/_utils/cn'
import { env } from '@/lib/env'
import type { PaginationState } from '@/lib/hubs/pagination'
import { buildLocalePath, type Locale } from '@/lib/locale'
import {
  getChildHref,
  HUB_CONFIG,
  type HubChildItem,
  type HubSingleton,
} from '@/lib/sanity/queries/hubs'
import { serializeJsonLd } from '@/lib/seo/serialize-json-ld'
import { UI_STRINGS } from '@/lib/ui-strings'
import type { FaqItem } from '@/types/sanity/shared'

// The /alternatives hub, re-skinned to the site's dark/lime hub pattern.
//
// One standalone hub over the 27 compareBlog docs. It mirrors the blog + resource
// hub shell - radial-glow hero, a featured row, a dark card grid, numbered
// pagination, then intro copy + FAQ - so it stops rendering the pre-redesign grey
// grid and reads as the same site.
//
// Differences from the resource hubs: NO left sidebar (alternatives has no sibling
// hubs to cross-link) and a 3-up grid, not 2-up, because the catalogue is large
// enough to fill it and the live layout is 3-wide.
//
// The sibling `/compare` hub root is retired via a 301 to this page; the individual
// `/compare/{slug}` articles the cards point at are untouched.

export type AlternativesHubTemplateProps = {
  hub: HubSingleton
  items: HubChildItem[]
  featured: HubChildItem[]
  pagination: PaginationState
  locale?: Locale
}

export default function AlternativesHubTemplate({
  hub,
  items,
  featured,
  pagination,
  locale = 'en-US',
}: AlternativesHubTemplateProps) {
  const cfg = HUB_CONFIG.alternativesHub
  const eyebrow = hub.eyebrow ?? null
  const title = hub.title || cfg.breadcrumbName
  const leadBlocks = hub.heroDescription ?? []
  const body = hub.introContent ?? []
  const faqs = (hub.faqs ?? []) as FaqItem[]

  const basePath = buildLocalePath(cfg.basePath, locale)
  const base = env.NEXT_PUBLIC_SITE_URL

  const breadcrumbs: Array<{ name: string; href: string }> = [
    { name: UI_STRINGS['breadcrumb.home'], href: buildLocalePath('/', locale) },
    { name: cfg.breadcrumbName, href: basePath },
  ]

  const collectionLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${base}${basePath}#collectionpage`,
    name: title,
    description: hub.metaDescription,
    url: `${base}${basePath}`,
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: b.name,
      item: `${base}${b.href}`,
    })),
  }

  // ItemList over what is actually on THIS page, in render order (featured first,
  // then the grid). Items whose href cannot be resolved are dropped rather than
  // pointed at '#'.
  const onPage = [...featured, ...items]
  const itemUrls = onPage
    .map((item) => getChildHref(item, locale))
    .filter((href) => href !== '#')
  const itemListLd =
    itemUrls.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          itemListElement: itemUrls.map((href, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: `${base}${href}`,
          })),
        }
      : null

  const faqLd =
    faqs.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          '@id': `${base}${basePath}#faq`,
          mainEntity: faqs.slice(0, 10).map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: toPlainText(faq.answer ?? []),
            },
          })),
        }
      : null

  return (
    <Fragment>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(collectionLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbLd) }}
      />
      {itemListLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(itemListLd) }}
        />
      ) : null}
      {faqLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqLd) }}
        />
      ) : null}

      {/* rel=prev/next. React 19 hoists these to <head>. */}
      {pagination.prevUrl ? <link rel="prev" href={`${base}${pagination.prevUrl}`} /> : null}
      {pagination.nextUrl ? <link rel="next" href={`${base}${pagination.nextUrl}`} /> : null}

      <main id="main" className="pb-20 lg:pb-28">
        {/* Hero - radial glow, same as the blog + resource hubs. */}
        <section
          className="pb-14 pt-14 lg:pb-14 lg:pt-[72px]"
          style={{
            backgroundImage:
              'radial-gradient(120% 60% at 50% 0%, #0c1830 0%, #070D18 56%)',
          }}
        >
          <BlogBand>
            <div className="mx-auto flex max-w-[760px] flex-col items-center gap-5 text-center">
              {eyebrow ? (
                <span className="inline-flex items-center rounded-pill border border-brand-primary/25 bg-brand-primary/10 px-3.5 py-[7px] text-[13px] font-semibold leading-none text-brand-primary">
                  {eyebrow}
                </span>
              ) : null}

              <h1 className="text-[40px] font-semibold leading-[1.08] tracking-[-0.02em] text-text-default md:text-[52px] lg:text-[62px]">
                {title}
              </h1>

              {leadBlocks.length > 0 ? (
                <div className="max-w-[620px] text-[17px] leading-relaxed text-text-default/60 [&_p]:m-0">
                  <PortableText
                    value={leadBlocks as Parameters<typeof PortableText>[0]['value']}
                  />
                </div>
              ) : null}
            </div>
          </BlogBand>
        </section>

        {/* The SAME band as the header, so content lines up with the logo + CTA. */}
        <BlogBand>
          {/* Featured (0-3; auto-filled by the resolver, suppressed on sparse data). */}
          {featured.length > 0 ? (
            <section aria-labelledby="featured-alternatives">
              <SectionLabel id="featured-alternatives">
                {UI_STRINGS['alternativesHub.featured']}
              </SectionLabel>
              <ul className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {featured.map((item, i) => (
                  <li key={item._id} className="contents">
                    <BlogCard item={item} priority={i < 3} locale={locale} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* All alternatives - the paginated grid, or an honest empty state. The
              SectionLabel is a real <h2>, so the outline stays well-formed. */}
          <section
            aria-labelledby="all-alternatives"
            className={cn(featured.length > 0 && 'mt-14')}
          >
            <SectionLabel id="all-alternatives">
              {UI_STRINGS['alternativesHub.all']}
            </SectionLabel>

            {items.length > 0 ? (
              <Fragment>
                <ul className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {items.map((item, i) => (
                    <li key={item._id} className="contents">
                      <BlogCard
                        item={item}
                        priority={featured.length === 0 && i < 3}
                        locale={locale}
                      />
                    </li>
                  ))}
                </ul>
                <BlogPagination pagination={pagination} />
              </Fragment>
            ) : (
              <p className="mt-6 text-[15px] leading-relaxed text-text-default/60">
                {UI_STRINGS['hub.emptyState']}
              </p>
            )}
          </section>

          {/* Intro copy + FAQ band. Absent unless the hub carries body copy or FAQs. */}
          <LongFormBand body={body} faqs={faqs} />
        </BlogBand>
      </main>
    </Fragment>
  )
}

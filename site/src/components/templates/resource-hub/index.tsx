import { toPlainText } from '@portabletext/toolkit'
import { Fragment } from 'react'

import { BlogBand } from '@/components/blog/container'
import { LongFormBand } from '@/components/blog/long-form-band'
import { BlogPagination } from '@/components/blog/pagination'
import { SectionLabel } from '@/components/blog/section-label'
import { ResourceCard } from '@/components/cards/resource-card'
import { ResourceHubSidebar } from '@/components/templates/resource-hub/resource-hub-sidebar'
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
  type HubType,
} from '@/lib/sanity/queries/hubs'
import { serializeJsonLd } from '@/lib/seo/serialize-json-ld'
import { UI_STRINGS, type UIStringKey } from '@/lib/ui-strings'
import type { FaqItem } from '@/types/sanity/shared'

// The four resource hubs' shared shell. Brief MYGRATR-HUB-RESOURCE.
//
// ONE component for /videos, /tools, /downloads, /events (and their /uk mirrors).
// It mirrors the blog family's shell - radial-glow hero on the same band as the
// header, dark cards, numbered pagination, long-form + FAQ band - so the resource
// hubs stop rendering the generic STATIC-1 grid and read as the same site.
//
// The one structural difference from the blog shell is the left sidebar: the four
// resource types cross-link each other (real <a> links, not filters), which is how
// the live site organises this section. The grid is 2-up, not 3-up, because these
// catalogues are sparse (2-6 items each) and a 3-up grid of two cards looks broken.
//
// Empty is a first-class state: /events has no published items, so it renders the
// heading and an honest "nothing here yet" line rather than an empty grid.

export type ResourceHubTemplateProps = {
  hub: HubSingleton
  hubType: HubType
  items: HubChildItem[]
  featured: HubChildItem[]
  pagination: PaginationState
  locale?: Locale
}

// The "All videos" / "All tools & quizzes" / ... section label, per hub.
function allLabelKey(hubType: HubType): UIStringKey {
  switch (hubType) {
    case 'toolsHub':
      return 'resourceHub.allTools'
    case 'downloadsHub':
      return 'resourceHub.allDownloads'
    case 'eventsHub':
      return 'resourceHub.allEvents'
    case 'videosHub':
    default:
      return 'resourceHub.allVideos'
  }
}

export default function ResourceHubTemplate({
  hub,
  hubType,
  items,
  featured,
  pagination,
  locale = 'en-US',
}: ResourceHubTemplateProps) {
  const cfg = HUB_CONFIG[hubType]
  const eyebrow = hub.eyebrow ?? null
  const title = hub.title || cfg.breadcrumbName
  const leadBlocks = hub.heroDescription ?? []
  const body = hub.introContent ?? []
  const faqs = (hub.faqs ?? []) as FaqItem[]

  const basePath = buildLocalePath(cfg.basePath, locale)
  const base = env.NEXT_PUBLIC_SITE_URL

  // The trail is emitted as structured data only - not rendered - matching the blog
  // hub. On a hub the last visible crumb would just restate the H1 beneath it, but the
  // BreadcrumbList is where Google prints the trail instead of the raw URL.
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
        {/* ── Hero — radial glow, same as the blog hub. ─────────────────────── */}
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
          <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
            <ResourceHubSidebar currentHubType={hubType} locale={locale} />

            <div className="min-w-0">
              {/* ── Featured (0-N hub-pinned items; empty at seed). ──────────── */}
              {featured.length > 0 ? (
                <section aria-labelledby="featured-resources">
                  <SectionLabel id="featured-resources">
                    {UI_STRINGS['resourceHub.featured']}
                  </SectionLabel>
                  <ul className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                    {featured.map((item, i) => (
                      <li key={item._id} className="contents">
                        <ResourceCard item={item} priority={i < 2} locale={locale} />
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {/* ── All <resources> — the paginated grid, or an honest empty
                  state. The SectionLabel is a real <h2>, so the page keeps a
                  well-formed outline even when the catalogue is empty. ─────── */}
              <section
                aria-labelledby="all-resources"
                className={cn(featured.length > 0 && 'mt-14')}
              >
                <SectionLabel id="all-resources">{UI_STRINGS[allLabelKey(hubType)]}</SectionLabel>

                {items.length > 0 ? (
                  <Fragment>
                    <ul className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                      {items.map((item, i) => (
                        <li key={item._id} className="contents">
                          <ResourceCard
                            item={item}
                            priority={featured.length === 0 && i < 2}
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

              {/* ── Long-form + FAQ band. Absent unless the hub carries body copy
                  or FAQs; returns null on its own otherwise. ────────────────── */}
              <LongFormBand body={body} faqs={faqs} />
            </div>
          </div>
        </BlogBand>
      </main>
    </Fragment>
  )
}

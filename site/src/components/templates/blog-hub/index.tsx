import { toPlainText } from '@portabletext/toolkit'
import { Fragment } from 'react'

import { ArticleCard } from '@/components/blog/article-card'
import { FeaturedBlock } from '@/components/blog/featured-block'
import { LongFormBand } from '@/components/blog/long-form-band'
import { BlogPagination } from '@/components/blog/pagination'
import { SectionLabel } from '@/components/blog/section-label'
import { BlogSearchForm } from '@/components/blog/search-form'
import { TopicPills } from '@/components/blog/topic-pills'
import { BlogBand } from '@/components/blog/container'
import { PortableText } from '@/components/ui/portable-text'
import { env } from '@/lib/env'
import { buildLocalePath, type Locale } from '@/lib/locale'
import type { PaginationState } from '@/lib/hubs/pagination'
import { BLOG_HERO_COPY } from '@/lib/blog/hero-copy'
import {
  HUB_CONFIG,
  type HubChildItem,
  type HubSingleton,
  type HubType,
} from '@/lib/sanity/queries/hubs'
import { serializeJsonLd } from '@/lib/seo/serialize-json-ld'
import { UI_STRINGS } from '@/lib/ui-strings'
import type { FaqItem } from '@/types/sanity/shared'

// The blog family's shared shell. Spec §1.
//
// ONE component for all seven pages. /blog and the six topic hubs are the same page
// with a different article set; the only structural difference is that the topic hubs
// carry the long-form + FAQ band and /blog does not, and that falls out of the data
// (blogHub has no introContent) rather than needing a branch.
//
// Top to bottom, per the spec:
//   1. Hero          eyebrow -> H1 -> lead -> search, on the radial glow
//   2. Topic pills   real links, not filters
//   3. Featured      1 feature + 4 compact, suppressed below 8 articles
//   4. All articles  the paginated grid
//   5. Pagination    numbered, 12/page
//   6. Long-form     720px reading column + FAQ, topic hubs only
//   7. Closing CTA   NOT BUILT HERE - the footer already renders it sitewide.
//
// The UK mirror is byte-identical: same components, same content, /uk prefix. There is
// no UK-specific code anywhere below, only a locale passed to the link builders.

export type BlogHubTemplateProps = {
  hub: HubSingleton
  hubType: HubType
  items: HubChildItem[]
  featured: HubChildItem[]
  pagination: PaginationState
  locale?: Locale
}

export default function BlogHubTemplate({
  hub,
  hubType,
  items,
  featured,
  pagination,
  locale = 'en-US',
}: BlogHubTemplateProps) {
  const cfg = HUB_CONFIG[hubType]
  const fallback = BLOG_HERO_COPY[hubType]

  // Sanity first, the §7 table as the fallback. The copy is seeded into Sanity so Seb
  // can change it without a deploy; the table is here so an unseeded field renders the
  // spec's words rather than an empty hero.
  const eyebrow = hub.eyebrow ?? fallback?.eyebrow ?? null
  const title = hub.title || fallback?.h1 || cfg.breadcrumbName
  const leadBlocks = hub.heroDescription ?? []
  const lead =
    leadBlocks.length > 0
      ? null
      : (fallback?.lead ?? null)

  const body = hub.introContent ?? []
  const faqs = (hub.faqs ?? []) as FaqItem[]

  const basePath = buildLocalePath(cfg.basePath, locale)

  // The trail is NOT rendered on the page any more - Jake removed it, because on a hub
  // the last crumb ("Scaling Teams") restates the H1 sitting directly beneath it.
  //
  // It is still BUILT, because the BreadcrumbList JSON-LD below is where a breadcrumb
  // trail actually earns its keep: Google prints it in the search result instead of the
  // raw URL. Deleting the visual row is a design decision; deleting the structured data
  // would have been an SEO regression dressed up as one.
  const breadcrumbs: Array<{ name: string; href: string }> = [
    { name: UI_STRINGS['breadcrumb.home'], href: buildLocalePath('/', locale) },
    ...(cfg.underBlog
      ? [{ name: UI_STRINGS['breadcrumb.blog'], href: buildLocalePath('/blog', locale) }]
      : []),
    { name: cfg.breadcrumbName, href: basePath },
  ]

  const base = env.NEXT_PUBLIC_SITE_URL

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

  // ItemList over what is actually on THIS page, in the order it is rendered - the
  // featured five first, then the grid. A crawler reading it should find the page it
  // was told about, not a different one.
  const onPage = [...featured, ...items]
  const itemListLd =
    onPage.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          itemListElement: onPage.map((item, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: `${base}${buildLocalePath(`/${item.category?.slug ?? 'blog'}/${item.slug}`, locale)}`,
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
        {/* ── 1. Hero ─────────────────────────────────────────────────────────
            The radial glow behind it, per spec §1. */}
        <section
          className="pb-14 pt-14 lg:pb-14 lg:pt-[72px]"
          style={{
            backgroundImage:
              'radial-gradient(120% 60% at 50% 0%, #0c1830 0%, #070D18 56%)',
          }}
        >
          <BlogBand>
            {/* NO BREADCRUMB ROW. Jake removed it: on a hub the trail is
                Home > Blog > Scaling Teams, and the last crumb is the H1 immediately
                below it - so it restates the page title six pixels above the page
                title. The BreadcrumbList JSON-LD is still emitted for crawlers, which
                is where a breadcrumb trail actually earns its keep. */}
            <div className="mx-auto flex max-w-[760px] flex-col items-center gap-5 text-center">
              {eyebrow ? (
                <span className="inline-flex items-center rounded-pill border border-brand-primary/25 bg-brand-primary/10 px-3.5 py-[7px] text-[13px] font-semibold leading-none text-brand-primary">
                  {eyebrow}
                </span>
              ) : null}

              {/* EXACTLY ONE h1 PER PAGE (spec §7). Every other heading on this page
                  is an h2 or h3. */}
              <h1 className="text-[40px] font-semibold leading-[1.08] tracking-[-0.02em] text-text-default md:text-[52px] lg:text-[62px]">
                {title}
              </h1>

              {leadBlocks.length > 0 ? (
                <div className="max-w-[620px] text-[17px] leading-relaxed text-text-default/60 [&_p]:m-0">
                  <PortableText
                    value={leadBlocks as Parameters<typeof PortableText>[0]['value']}
                  />
                </div>
              ) : lead ? (
                <p className="max-w-[620px] text-[17px] leading-relaxed text-text-default/60">
                  {lead}
                </p>
              ) : null}

              <div className="mt-2 w-full">
                <BlogSearchForm locale={locale} action={cfg.basePath} />
              </div>
            </div>
          </BlogBand>
        </section>

        {/* The SAME band as the header, so the grid's left edge lines up with the logo
            and its right edge with the Schedule-a-Call button. */}
        <BlogBand>
          {/* ── 2. Topic pills ──────────────────────────────────────────────── */}
          <TopicPills currentPath={cfg.basePath} locale={locale} />

          {/* ── 3. Featured ─────────────────────────────────────────────────── */}
          <FeaturedBlock items={featured} locale={locale} />

          {/* ── 4. All articles ─────────────────────────────────────────────────
              NEVER RENDER AN EMPTY GRID (spec §9). A topic with no published
              articles shows the long-form band and nothing else - not an "All
              articles" heading standing over a void. */}
          {items.length > 0 ? (
            <section aria-labelledby="all-articles" className="mt-16">
              <SectionLabel id="all-articles">{UI_STRINGS['blog.allArticles']}</SectionLabel>

              <ul className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {items.map((item, i) => (
                  <li key={item._id} className="contents">
                    <ArticleCard
                      item={item}
                      // The featured block already claimed the top of the page, so the
                      // grid's first row is only LCP-critical when there is no featured
                      // block above it.
                      priority={featured.length === 0 && i < 3}
                      locale={locale}
                    />
                  </li>
                ))}
              </ul>

              {/* ── 5. Pagination ─────────────────────────────────────────────── */}
              <BlogPagination pagination={pagination} />
            </section>
          ) : null}

          {/* ── 6. Long-form + FAQ ────────────────────────────────────────────
              Topic hubs only. Absent on /blog, which carries no introContent. */}
          <LongFormBand body={body} faqs={faqs} />
        </BlogBand>

        {/* ── 7. Closing CTA band ───────────────────────────────────────────────
            Deliberately NOT here. The footer already renders "Ready to hire your next
            engineer?" sitewide from footer.topCtaBlock, serif accent word and all.
            Building it again would put it on the page twice. */}
      </main>
    </Fragment>
  )
}

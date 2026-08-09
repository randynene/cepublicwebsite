import type { ReactNode } from 'react'

import { BlogCard } from '@/components/cards/blog-card'
import { Container } from '@/components/ui/container'
import { FaqList } from '@/components/ui/faq-list'
import { Heading } from '@/components/ui/heading'
import { Image } from '@/components/ui/image'
import { MegaMenuPillLabel } from '@/components/ui/mega-menu-pill-label'
import { PortableText } from '@/components/ui/portable-text'
import { Tag } from '@/components/ui/tag'
import { Text } from '@/components/ui/text'
import { cn } from '@/components/ui/_utils/cn'
import { STICKY_ASIDE } from '@/components/layout/sticky-aside'
import { buildLocalePath, type Locale } from '@/lib/locale'
import type { HubChildItem } from '@/lib/sanity/queries/hubs'
import { UI_STRINGS } from '@/lib/ui-strings'
import type { CompareBlog } from '@/types/sanity/documents/compare-blog'

export interface CompareTemplateProps {
  post: CompareBlog
  /**
   * Sibling comparisons for the related-comparisons module (SEO S2). Selected
   * from data upstream (shared competitor / tags, recency fallback) and already
   * filtered against retired docs; the template only renders them.
   */
  relatedComparisons: HubChildItem[]
  locale: Locale
}

const BODY_MUTED_CLASS =
  'text-[16px] font-normal leading-[25px] tracking-[-0.08px] text-text-secondary'

const BAND_CLASS = 'mx-auto max-w-[1280px]'
const BAND_PX_CLASS = 'px-[22px] sm:px-[32px] lg:px-[64px]'

const bodyComponents = {
  block: {
    normal: ({ children }: { children?: ReactNode }) => (
      <p className={cn(BODY_MUTED_CLASS, 'mb-[18px] last:mb-0')}>{children}</p>
    ),
    h2: ({ children }: { children?: ReactNode }) => (
      <Heading as="h2" className="mb-[16px] mt-[36px] first:mt-0">
        {children}
      </Heading>
    ),
    h3: ({ children }: { children?: ReactNode }) => (
      <Heading as="h3" className="mb-[12px] mt-[28px] first:mt-0">
        {children}
      </Heading>
    ),
  },
}

const tldrComponents = {
  block: {
    normal: ({ children }: { children?: ReactNode }) => (
      <p className="m-0 text-[18px] font-normal leading-[29px] tracking-[-0.1px] text-[#dfe9d6]">
        {children}
      </p>
    ),
  },
}

function formatPostDate(
  iso: string | null | undefined,
  locale: Locale,
): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d)
}

function deriveCompetitor(post: CompareBlog): string | null {
  if (post.competitor?.trim()) return post.competitor.trim()
  const title = post.title.trim()
  const patterns = [
    /Cloud Employee vs\.?\s+([^—–|\n]+)/i,
    /([^—–|\n]+)\s+vs\.?\s+Cloud Employee/i,
    /Cloud Employee Alternatives? to\s+([^—–|\n]+)/i,
  ]
  for (const pattern of patterns) {
    const match = title.match(pattern)
    if (match?.[1]) return match[1].trim()
  }
  return null
}

function CompareFaqsIntro() {
  const intro = UI_STRINGS['compare.faqsIntro']
  const email = UI_STRINGS['compare.faqsEmail']
  const parts = intro.split('{email}')

  return (
    <p className="m-0 text-[15px] font-normal leading-[23px] tracking-[-0.08px] text-text-secondary">
      {parts[0]}
      <a
        href={`mailto:${email}`}
        className="text-brand-primary no-underline hover:underline"
      >
        {email}
      </a>
      {parts[1] ?? ''}
    </p>
  )
}

export default function CompareTemplate({
  post,
  relatedComparisons,
  locale,
}: CompareTemplateProps) {
  const competitor = deriveCompetitor(post)
  const formattedDate = formatPostDate(post.date, locale)
  const author = post.author ?? null
  const authorByline = author
    ? UI_STRINGS['compare.authorByline'].replace('{name}', author.name)
    : null
  const faqItems = (post.faqs ?? []).filter((faq) => faq.question?.trim())
  const hasFaqs = faqItems.length > 0
  const hasTldr =
    Array.isArray(post.tldrSection) && post.tldrSection.length > 0
  const tags = (post.tags ?? []).filter((tag) => tag.name?.trim())

  return (
    <article>
      <Container width="full" className="pt-0">
        <div className={BAND_CLASS}>
          <header
            className={cn(
              BAND_PX_CLASS,
              'pb-[32px] pt-[32px] lg:pb-[48px] lg:pt-[48px]',
            )}
          >
            <Heading
              as="h1"
              className="mb-[24px] max-w-[920px] text-[36px] font-semibold leading-[40px] tracking-[-1.2px] text-white lg:text-[58px] lg:leading-[63px] lg:tracking-[-2px]"
            >
              {UI_STRINGS['compare.h1Prefix']}
              {competitor ? (
                <>
                  {' '}
                  <span className="font-serif italic font-normal text-brand-primary">
                    {competitor}
                  </span>
                </>
              ) : null}
            </Heading>

            {(formattedDate || authorByline) && (
              <div className="mb-[24px] flex flex-wrap items-center gap-3 text-text-secondary">
                {formattedDate && <Text size="small">{formattedDate}</Text>}
                {formattedDate && authorByline && (
                  <Text size="small" aria-hidden="true">
                    ·
                  </Text>
                )}
                {authorByline && <Text size="small">{authorByline}</Text>}
              </div>
            )}

            {tags.length > 0 && (
              <div className="mb-[28px] flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Tag key={tag._id} tone="ghost-lime">
                    {tag.name}
                  </Tag>
                ))}
              </div>
            )}

            {post.thumbnailImage?.asset && (
              <div className="relative aspect-[16/9] w-full max-w-[920px] overflow-hidden rounded-[20px] border border-[#22314D]">
                <Image
                  source={post.thumbnailImage}
                  alt={post.title}
                  fill
                  priority
                  sizes="(min-width: 768px) 920px, 100vw"
                />
              </div>
            )}
          </header>

          <section className={cn(BAND_PX_CLASS, 'pb-[56px] lg:pb-[72px]')}>
            {hasTldr && (
              <aside
                className="mb-[40px] rounded-[18px] border border-brand-primary/25 bg-brand-primary/[0.06] px-[28px] py-[28px] lg:px-[32px]"
              >
                <div className="mb-[14px]">
                  <span className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-[14px] py-[6px] text-[12px] font-bold leading-none tracking-[0.4px] text-[#060F1E]">
                    ★ {UI_STRINGS['compare.tldrBadge']}
                  </span>
                </div>
                <PortableText value={post.tldrSection!} components={tldrComponents} />
              </aside>
            )}

            <PortableText value={post.content} components={bodyComponents} />
          </section>

          {hasFaqs && (
            <section
              className={cn(
                'border-t border-[#22314D] bg-[#0A1628]',
                BAND_PX_CLASS,
                'grid grid-cols-1 items-start gap-[32px] py-[56px] lg:grid-cols-[340px_1fr] lg:gap-[48px] lg:py-[72px]',
              )}
            >
              <div className={STICKY_ASIDE}>
                <Heading
                  as="h2"
                  className="mb-[14px] text-[30px] font-semibold leading-[34px] tracking-[-1px] text-white lg:mb-[18px] lg:text-[46px] lg:leading-[56px] lg:tracking-[-1.4px]"
                >
                  {UI_STRINGS['compare.faqsHeadingPrefix']}
                  <span className="font-serif italic font-normal text-brand-primary">
                    {UI_STRINGS['compare.faqsHeadingAccent']}
                  </span>
                </Heading>
                <CompareFaqsIntro />
              </div>
              <FaqList items={faqItems} />
            </section>
          )}

          {/* Related comparisons (SEO S2, roadmap W1-04). Lateral internal links
              between the compare pages, which otherwise link only up to the hub.
              Renders through the same BlogCard as the /alternatives grid; the
              upstream query already excludes retired docs and this page itself. */}
          {relatedComparisons.length > 0 && (
            <section
              aria-labelledby="related-comparisons-heading"
              className={cn(
                'border-t border-[#22314D]',
                BAND_PX_CLASS,
                'py-[56px] lg:py-[72px]',
              )}
            >
              <div className="mb-[32px] flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <Heading
                  as="h2"
                  id="related-comparisons-heading"
                  className="text-[30px] font-semibold leading-[34px] tracking-[-1px] text-white lg:text-[46px] lg:leading-[52px] lg:tracking-[-1.4px]"
                >
                  {UI_STRINGS['compare.relatedHeadingPrefix']}{' '}
                  <span className="font-serif italic font-normal text-brand-primary">
                    {UI_STRINGS['compare.relatedHeadingAccent']}
                  </span>
                </Heading>
                <MegaMenuPillLabel
                  as="a"
                  href={buildLocalePath('/alternatives', locale)}
                  variant="pill-outline-dark"
                  size="cta"
                  leadingArrow
                  leadingGlyph="→"
                  label={UI_STRINGS['compare.viewAllComparisons']}
                />
              </div>

              <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {relatedComparisons.map((item) => (
                  <li key={item._id} className="contents">
                    <BlogCard item={item} locale={locale} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </Container>
    </article>
  )
}

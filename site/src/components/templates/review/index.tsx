import type { ReactNode } from 'react'

import { Breadcrumbs, type BreadcrumbItem } from '@/components/shared/breadcrumbs'
import { Container } from '@/components/ui/container'
import { Heading } from '@/components/ui/heading'
import { Image } from '@/components/ui/image'
import { Link } from '@/components/ui/link'
import { MegaMenuPillLabel } from '@/components/ui/mega-menu-pill-label'
import { PortableText } from '@/components/ui/portable-text'
import { cn } from '@/components/ui/_utils/cn'
import { buildLocalePath, type Locale } from '@/lib/locale'
import { getReviewCompanyName } from '@/lib/review/display-name'
import { UI_STRINGS } from '@/lib/ui-strings'
import type { RelatedReview, Review } from '@/types/sanity/documents/review'

export interface ReviewTemplateProps {
  review: Review
  relatedReviews: RelatedReview[]
  locale: Locale
}

const BODY_MUTED_CLASS =
  'text-[16px] font-normal leading-[25px] tracking-[-0.08px] text-text-secondary'

const heroQuoteComponents = {
  block: {
    normal: ({ children }: { children?: ReactNode }) => (
      <p className="mb-0 text-[27px] font-normal leading-[40px] tracking-[-0.5px] text-text-default">
        {children}
      </p>
    ),
  },
}

const additionalInfoComponents = {
  block: {
    normal: ({ children }: { children?: ReactNode }) => (
      <p className={cn(BODY_MUTED_CLASS, 'mb-0')}>{children}</p>
    ),
  },
}

function StarBadge() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-brand-primary/25 bg-brand-primary/10 px-4 py-2 text-[13px] font-semibold tracking-[0.4px] text-brand-primary">
      <span aria-hidden="true" className="tracking-[1px] text-brand-primary">
        ★★★★★
      </span>
      {UI_STRINGS['review.starBadge']}
    </span>
  )
}

function ReviewerAvatar({
  image,
  name,
  size,
}: {
  image: Review['memberImage']
  name: string
  size: 'hero' | 'card'
}) {
  const dim = size === 'hero' ? 'h-16 w-16' : 'h-[46px] w-[46px]'

  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-full border border-[#32435F]',
        'bg-gradient-to-br from-[#16223A] to-[#0D1626]',
        dim,
      )}
    >
      {image?.asset && (
        <Image
          source={image}
          alt={image.alt?.trim() || name}
          fill
          sizes={size === 'hero' ? '64px' : '46px'}
          className="object-cover"
        />
      )}
    </div>
  )
}

function CompanyLogoSlot({
  logo,
  companyName,
  variant,
}: {
  logo: Review['companyLogo']
  companyName: string
  variant: 'hero' | 'card'
}) {
  const sizeClass =
    variant === 'hero'
      ? 'mb-9 h-[90px] w-[220px]'
      : 'mb-6 h-[54px] w-[130px]'

  return (
    <div
      className={cn(
        'relative flex items-center justify-center overflow-hidden rounded-xl',
        'border border-[#22314D] bg-[#16223A]',
        sizeClass,
      )}
    >
      {logo?.asset && (
        <Image
          source={logo}
          alt={logo.alt?.trim() || `${companyName} logo`}
          width={variant === 'hero' ? 220 : 130}
          height={variant === 'hero' ? 90 : 54}
          className="max-h-full max-w-full object-contain p-3"
        />
      )}
    </div>
  )
}

function QuoteMark({ size }: { size: 'hero' | 'card' }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'block font-serif italic leading-[0.5] text-brand-primary',
        size === 'hero' ? 'mb-2 text-[72px]' : 'mb-1.5 text-[46px]',
      )}
    >
      "
    </span>
  )
}

function RelatedReviewCard({
  item,
  locale,
}: {
  item: RelatedReview
  locale: Locale
}) {
  const quote = item.testimonyShort?.trim()
  const href = buildLocalePath(`/reviews/${item.slug}`, locale)

  return (
    <article className="flex h-full flex-col rounded-[20px] border border-[#22314D] bg-[#101B30] p-[30px]">
      <CompanyLogoSlot
        logo={item.companyLogo}
        companyName={item.nameClient}
        variant="card"
      />
      {quote && (
        <>
          <QuoteMark size="card" />
          <p className="mb-[26px] flex-1 text-[16px] font-normal leading-[25px] tracking-[-0.08px] text-text-default">
            {quote}
          </p>
        </>
      )}
      <div className="mb-[22px] flex items-center gap-3">
        <ReviewerAvatar image={item.memberImage} name={item.nameClient} size="card" />
        <div>
          <p className="mb-1 text-[15px] font-semibold leading-tight text-text-default">
            {item.nameClient}
          </p>
          {item.position && (
            <p className="text-[13px] font-medium leading-none text-brand-primary">
              {item.position}
            </p>
          )}
        </div>
      </div>
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-[15px] font-semibold text-brand-primary transition-colors hover:text-brand-primary/90"
      >
        {UI_STRINGS['review.readMore']}
        <span aria-hidden="true">→</span>
      </Link>
    </article>
  )
}

export default function ReviewTemplate({
  review,
  relatedReviews,
  locale,
}: ReviewTemplateProps) {
  const companyName = getReviewCompanyName(review)
  const hasHeroQuote =
    (Array.isArray(review.testimonyParagraph) &&
      review.testimonyParagraph.length > 0) ||
    Boolean(review.testimonyShort?.trim())
  const hasAdditionalInfo =
    Array.isArray(review.additionalInfo) && review.additionalInfo.length > 0

  const hearFromTeam = UI_STRINGS['review.hearFromTeam'].replace(
    '{company}',
    companyName,
  )

  const breadcrumbItems: BreadcrumbItem[] = [
    { name: UI_STRINGS['breadcrumb.home'], href: buildLocalePath('/', locale) },
    {
      name: UI_STRINGS['breadcrumb.reviews'],
      href: buildLocalePath('/reviews', locale),
    },
    {
      name: companyName,
      href: buildLocalePath(`/reviews/${review.slug}`, locale),
    },
  ]

  return (
    <article>
      <Container width="default" className="pt-8 lg:pt-12">
        <Breadcrumbs items={breadcrumbItems} className="mb-8" />

        <div
          className={cn(
            'bg-[radial-gradient(120%_55%_at_50%_0%,#0c1830_0%,#070D18_60%)]',
            'px-[22px] py-12 pb-16',
            'sm:px-8 lg:px-16 lg:py-[72px] lg:pb-24',
          )}
        >
          <header className="mx-auto max-w-[880px] text-center">
            <p className="mb-[22px] text-[11.5px] font-semibold uppercase tracking-[1.68px] text-brand-primary">
              {UI_STRINGS['review.eyebrow']}
            </p>
            <Heading as="h1" size="h1" className="mx-auto max-w-[880px]">
              {companyName}
              {UI_STRINGS['review.h1PossessiveSuffix']}{' '}
              <span className="font-serif italic font-normal text-brand-primary">
                {UI_STRINGS['nav.brandName']}
              </span>
            </Heading>
          </header>

          <div className="mt-14 flex flex-col gap-6 lg:mt-[56px] lg:flex-row lg:items-center lg:gap-6">
            <StarBadge />
            <Heading as="h2" size="h4" className="text-[32px] leading-none tracking-[-0.9px]">
              {hearFromTeam}
            </Heading>
          </div>

          <div className="mt-9 lg:mt-9">
            <div className="grid grid-cols-1 gap-10 rounded-[20px] border border-[#22314D] bg-[#101B30] p-8 lg:grid-cols-[300px_1fr] lg:gap-14 lg:p-12">
              <div>
                <CompanyLogoSlot
                  logo={review.companyLogo}
                  companyName={companyName}
                  variant="hero"
                />
                <div className="flex items-center gap-4">
                  <ReviewerAvatar
                    image={review.memberImage}
                    name={review.nameClient}
                    size="hero"
                  />
                  <div>
                    <p className="mb-1.5 text-[18px] font-semibold leading-tight text-text-default">
                      {review.nameClient}
                    </p>
                    {review.position && (
                      <p className="text-[14.5px] font-medium leading-none text-brand-primary">
                        {review.position}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {hasHeroQuote && (
                <div>
                  <QuoteMark size="hero" />
                  {Array.isArray(review.testimonyParagraph) &&
                  review.testimonyParagraph.length > 0 ? (
                    <PortableText
                      value={review.testimonyParagraph}
                      components={heroQuoteComponents}
                    />
                  ) : (
                    <p className="text-[27px] font-normal leading-[40px] tracking-[-0.5px] text-text-default">
                      {review.testimonyShort}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {hasAdditionalInfo && (
            <div className="mt-6">
              <div className="flex items-start gap-4 rounded-2xl border border-[#22314D] bg-[rgba(27,42,69,0.25)] px-7 py-6">
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand-primary/25 bg-brand-primary/10 text-[15px] font-bold text-brand-primary"
                >
                  i
                </span>
                <PortableText
                  value={review.additionalInfo!}
                  components={additionalInfoComponents}
                />
              </div>
            </div>
          )}

          {relatedReviews.length > 0 && (
            <section className="mt-16" aria-labelledby="related-reviews-heading">
              <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <Heading
                  as="h2"
                  id="related-reviews-heading"
                  size="h2"
                  className="text-[46px] leading-none tracking-[-1px]"
                >
                  {UI_STRINGS['review.readMorePrefix']}{' '}
                  <span className="font-serif italic font-normal text-brand-primary">
                    {UI_STRINGS['review.readMoreAccent']}
                  </span>
                  …
                </Heading>
                <MegaMenuPillLabel
                  as="a"
                  href={buildLocalePath('/reviews', locale)}
                  variant="pill-outline-dark"
                  size="cta"
                  leadingArrow
                  leadingGlyph="→"
                  label={UI_STRINGS['review.viewAllReviews']}
                />
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {relatedReviews.map((item) => (
                  <RelatedReviewCard key={item._id} item={item} locale={locale} />
                ))}
              </div>
            </section>
          )}
        </div>
      </Container>
    </article>
  )
}

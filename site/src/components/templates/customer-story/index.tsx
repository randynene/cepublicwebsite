import type { ReactNode } from 'react'

import { Container } from '@/components/ui/container'
import { Heading } from '@/components/ui/heading'
import { Image } from '@/components/ui/image'
import { PortableText } from '@/components/ui/portable-text'
import { cn } from '@/components/ui/_utils/cn'
import type { Locale } from '@/lib/locale'
import { UI_STRINGS } from '@/lib/ui-strings'
import type {
  CustomerStory,
  QuoteBlock,
  StorySection,
} from '@/types/sanity/documents/customer-story'

export interface CustomerStoryTemplateProps {
  story: CustomerStory
  locale: Locale
}

// Export architecture: sibling sections inside a 1280px frame, each with its
// OWN single 64px horizontal padding layer (band 1280 − 2×64 = 1152 content).
// Body sections + headings sit in a 780px reading column; hero H1 = 880px.
// All spacing utilities are ARBITRARY px because tokens.css sets
// `--spacing: 0.5rem` (8px/unit), which would double any scale utility.
const BAND_CLASS = 'mx-auto max-w-[1280px]'
const BAND_PX_CLASS = 'px-[22px] sm:px-[32px] lg:px-[64px]'
const READING_CLASS = 'mx-auto max-w-[780px]'

// Card surface — dark elevated (#101B30) + border (#22314D) + 20px radius.
const CARD_CLASS = 'rounded-[20px] border border-[#22314D] bg-[#101B30]'

// Section eyebrow — 11.5px / 600 / 1.68px tracking / uppercase / lime.
// leading-none so the line-height computes to 11.5px (export target), not the
// browser-default 17.25px.
const EYEBROW_CLASS =
  'text-[11.5px] font-semibold uppercase leading-none tracking-[1.68px] text-brand-primary'

// Body copy — 18px / 400 / lh30 / -0.1px / #B8C2D1 (text-secondary).
const BODY_COPY_CLASS =
  'text-[18px] font-normal leading-[30px] tracking-[-0.1px] text-text-secondary'

// Main body-content renderer (paragraphs + headings + tables/videoEmbed pass
// straight through the primitive's default type handlers).
const bodyComponents = {
  block: {
    normal: ({ children }: { children?: ReactNode }) => (
      <p className={cn(BODY_COPY_CLASS, 'mb-[20px] last:mb-0')}>{children}</p>
    ),
    h2: ({ children }: { children?: ReactNode }) => (
      <Heading
        as="h2"
        className="mb-[18px] mt-[36px] text-[28px] leading-[36px] font-semibold tracking-[-1px] text-white first:mt-0 lg:text-[28px]"
      >
        {children}
      </Heading>
    ),
    h3: ({ children }: { children?: ReactNode }) => (
      <Heading
        as="h3"
        size="h4"
        className="mb-[12px] mt-[28px] text-[22px] font-semibold leading-[30px] tracking-[-0.6px] text-white first:mt-0"
      >
        {children}
      </Heading>
    ),
  },
}

// TL;DR "Key results" — bullet list rendered as a lime tick panel.
const tldrComponents = {
  block: {
    normal: ({ children }: { children?: ReactNode }) => (
      <p className={cn(BODY_COPY_CLASS, 'mb-[12px] last:mb-0')}>{children}</p>
    ),
  },
  list: {
    bullet: ({ children }: { children?: ReactNode }) => (
      <ul className="flex flex-col gap-[12px]">{children}</ul>
    ),
  },
  listItem: {
    bullet: ({ children }: { children?: ReactNode }) => (
      <li className="flex items-start gap-[12px] text-[16px] leading-[24px] text-text-secondary">
        <TickGlyph />
        <span>{children}</span>
      </li>
    ),
  },
}

function TickGlyph() {
  return (
    <span
      aria-hidden="true"
      className="mt-[1px] flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full border border-brand-primary/25 bg-brand-primary/10 text-brand-primary"
    >
      <svg
        className="h-[13px] w-[13px]"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3.5 8.5l3 3 6-7" />
      </svg>
    </span>
  )
}

function QuoteMark() {
  // Decorative opening double-quote glyph rendered as an SVG (not a text
  // literal) so it passes the UI_STRINGS jsx-no-literals gate.
  return (
    <svg
      aria-hidden="true"
      className="mb-[10px] h-[36px] w-[36px] text-brand-primary"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M9.6 4C6.5 5.7 4.5 8.9 4.5 12.4c0 3.1 1.9 5.1 4.3 5.1 2.1 0 3.7-1.6 3.7-3.7 0-2-1.4-3.5-3.3-3.5-.36 0-.86.08-1 .12.3-1.6 1.9-3.6 3.9-4.72L9.6 4Zm9 0c-3.1 1.7-5.1 4.9-5.1 8.4 0 3.1 1.9 5.1 4.3 5.1 2.1 0 3.7-1.6 3.7-3.7 0-2-1.4-3.5-3.3-3.5-.36 0-.86.08-1 .12.3-1.6 1.9-3.6 3.9-4.72L18.6 4Z" />
    </svg>
  )
}

// Parse a Vimeo numeric id for a background (autoplay/muted/loop) hero video.
// Local parse (not the E2 primitive) because E2's lite/eager modes are poster
// embeds, not the background=1 ambient loop the design uses. Composing a native
// iframe here is NOT forking a primitive.
function parseVimeoId(url: string): string | null {
  const match = url.match(/(?:player\.)?vimeo\.com\/(?:video\/)?(\d+)/)
  return match ? match[1] : null
}

function CompanyLogoSlot({
  logo,
  companyName,
}: {
  logo: CustomerStory['companyLogo']
  companyName: string
}) {
  // Tech Debt #16 — travel-tech-client has a null companyLogo (intentional
  // anonymisation). Render the company initial rather than a fabricated asset.
  if (!logo?.asset) {
    const initial = companyName.trim().charAt(0).toUpperCase()
    return (
      <span className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full border border-[#22314D] bg-[#16223A] text-[18px] font-semibold text-white">
        {initial}
      </span>
    )
  }
  return (
    <span className="relative flex h-[44px] w-[132px] items-center justify-start overflow-hidden">
      <Image
        source={logo}
        alt={logo.alt?.trim() || `${companyName} logo`}
        width={132}
        height={44}
        className="max-h-full max-w-full object-contain object-left"
      />
    </span>
  )
}

function StoryQuote({ quote }: { quote: QuoteBlock }) {
  const paragraph = quote.paragraph?.trim()
  if (!paragraph) return null
  return (
    <figure className={cn(CARD_CLASS, 'mt-[32px] p-[32px]')}>
      <QuoteMark />
      <blockquote className="mb-[24px] text-[22px] font-normal leading-[32px] tracking-[-0.4px] text-text-default">
        {paragraph}
      </blockquote>
      <figcaption className="flex items-center gap-[14px]">
        {quote.personImage?.asset && (
          <span className="relative h-[46px] w-[46px] shrink-0 overflow-hidden rounded-full border border-[#32435F] bg-[#16223A]">
            <Image
              source={quote.personImage}
              alt={quote.personImage.alt?.trim() || quote.personName}
              fill
              sizes="46px"
              className="object-cover"
            />
          </span>
        )}
        <span>
          <span className="block text-[15px] font-semibold leading-tight text-text-default">
            {quote.personName}
          </span>
          {quote.personTitle?.trim() && (
            <span className="mt-[2px] block text-[13px] font-medium leading-none text-brand-primary">
              {quote.personTitle}
            </span>
          )}
        </span>
      </figcaption>
    </figure>
  )
}

function StoryFold({
  eyebrow,
  heading,
  section,
}: {
  eyebrow: string
  heading: string
  section: StorySection | null | undefined
}) {
  const hasContent =
    Array.isArray(section?.content) && section!.content.length > 0
  const quote = section?.quote ?? null
  const hasQuote = Boolean(quote?.paragraph?.trim())
  if (!hasContent && !hasQuote) return null

  return (
    <section className="mb-[56px] last:mb-0">
      <p className={cn(EYEBROW_CLASS, 'mb-[14px]')}>{eyebrow}</p>
      <Heading
        as="h2"
        className="mb-[18px] text-[34px] font-semibold leading-[42px] tracking-[-1.1px] text-white lg:text-[34px]"
      >
        {heading}
      </Heading>
      {hasContent && (
        <PortableText value={section!.content!} components={bodyComponents} />
      )}
      {hasQuote && <StoryQuote quote={quote!} />}
    </section>
  )
}

export default function CustomerStoryTemplate({
  story,
}: CustomerStoryTemplateProps) {
  const vimeoId = story.videoUrl ? parseVimeoId(story.videoUrl) : null
  const heroImage = story.companyProductImage?.asset
    ? story.companyProductImage
    : story.companyPeopleImage?.asset
      ? story.companyPeopleImage
      : null

  const hasTldr =
    Array.isArray(story.tldrContent) && story.tldrContent.length > 0
  const hasHiringNeeds =
    Array.isArray(story.hiringNeedsTable) && story.hiringNeedsTable.length > 0
  const hasTheCustomer =
    Array.isArray(story.theCustomerContent) &&
    story.theCustomerContent.length > 0
  const hasCta = Array.isArray(story.ctaContent) && story.ctaContent.length > 0

  return (
    <article>
      <Container width="full" className="pt-0">
        <div className={BAND_CLASS}>
          {/* Hero — radial wash behind the eyebrow + H1 + company row.
              Breadcrumbs omitted visually; BreadcrumbList JSON-LD remains. */}
          <header
            className={cn(
              'bg-[radial-gradient(120%_60%_at_50%_0%,#0c1830_0%,#070D18_60%)]',
              BAND_PX_CLASS,
              'pt-[32px] text-center lg:pt-[48px]',
            )}
          >
            <p className={cn(EYEBROW_CLASS, 'mb-[16px]')}>
              {UI_STRINGS['customerStory.heroLabel']}
            </p>
            <Heading
              as="h1"
              size="h1"
              className="mx-auto mb-[22px] max-w-[880px] text-[40px] font-semibold leading-[46px] tracking-[-1.4px] text-white lg:text-[54px] lg:leading-[60px] lg:tracking-[-1.9px]"
            >
              {story.customerStoryTitle}
            </Heading>
            <div className="flex items-center justify-center gap-[12px]">
              <CompanyLogoSlot
                logo={story.companyLogo}
                companyName={story.companyName}
              />
              <span className="text-[15px] font-semibold leading-none text-white">
                {story.companyName}
              </span>
            </div>
          </header>

          {/* Hero media — background Vimeo loop when present, else product/
              people image. No fabricated placeholder when both are absent. */}
          {(vimeoId || heroImage) && (
            <div className={cn(BAND_PX_CLASS, 'pt-[40px]')}>
              <div className="relative aspect-[1152/600] w-full overflow-hidden rounded-[24px] border border-[#22314D] bg-[#070D18]">
                {vimeoId ? (
                  <iframe
                    src={`https://player.vimeo.com/video/${vimeoId}?background=1&autoplay=1&loop=1&muted=1`}
                    title={story.customerStoryTitle}
                    allow="autoplay; fullscreen; picture-in-picture"
                    className="absolute inset-0 h-full w-full border-0"
                  />
                ) : (
                  heroImage && (
                    <Image
                      source={heroImage}
                      alt={heroImage.alt?.trim() || story.companyName}
                      fill
                      priority
                      sizes="(min-width: 1024px) 1152px, 100vw"
                      className="object-cover"
                    />
                  )
                )}
              </div>
            </div>
          )}

          {/* Body content — 780px reading column. */}
          <div className={cn(BAND_PX_CLASS, 'pt-[56px] pb-[80px]')}>
            <div className={READING_CLASS}>
              {hasTldr && (
                <section className={cn(CARD_CLASS, 'mb-[56px] p-[32px]')}>
                  <p className="mb-[20px] text-[18px] font-semibold leading-none tracking-[-0.4px] text-white">
                    {UI_STRINGS['customerStory.keyResultsHeading']}
                  </p>
                  <PortableText
                    value={story.tldrContent!}
                    components={tldrComponents}
                  />
                </section>
              )}

              {hasHiringNeeds && (
                <section className="mb-[56px]">
                  <p className={cn(EYEBROW_CLASS, 'mb-[16px]')}>
                    {UI_STRINGS['customerStory.hiringNeedsEyebrow']}
                  </p>
                  <PortableText
                    value={story.hiringNeedsTable!}
                    components={bodyComponents}
                  />
                </section>
              )}

              {hasTheCustomer && (
                <section className="mb-[56px]">
                  <Heading
                    as="h2"
                    className="mb-[18px] text-[34px] font-semibold leading-[42px] tracking-[-1.1px] text-white lg:text-[34px]"
                  >
                    {UI_STRINGS['customerStory.theCustomerHeading']}
                  </Heading>
                  <PortableText
                    value={story.theCustomerContent!}
                    components={bodyComponents}
                  />
                </section>
              )}

              <StoryFold
                eyebrow={UI_STRINGS['customerStory.actOne']}
                heading={UI_STRINGS['customerStory.problemHeading']}
                section={story.problem}
              />
              <StoryFold
                eyebrow={UI_STRINGS['customerStory.actTwo']}
                heading={UI_STRINGS['customerStory.solutionHeading']}
                section={story.solution}
              />
              <StoryFold
                eyebrow={UI_STRINGS['customerStory.actThree']}
                heading={UI_STRINGS['customerStory.impactHeading']}
                section={story.impact}
              />

              {hasCta && (
                <section className="mt-[8px] border-t border-[#22314D] pt-[32px]">
                  <Heading
                    as="h2"
                    className="mb-[18px] text-[28px] font-semibold leading-[34px] tracking-[-1.1px] text-white lg:text-[28px]"
                  >
                    {UI_STRINGS['customerStory.ctaHeading']}
                  </Heading>
                  <PortableText
                    value={story.ctaContent!}
                    components={bodyComponents}
                  />
                </section>
              )}
            </div>
          </div>
        </div>
      </Container>
    </article>
  )
}

import { Breadcrumbs, type BreadcrumbItem } from '@/components/shared/breadcrumbs'
import { CalendlyInlineEmbed } from '@/components/templates/book-a-call/calendly-inline-embed'
import { Container } from '@/components/ui/container'
import { Heading } from '@/components/ui/heading'
import { HubSpotFormEmbed } from '@/components/ui/hubspot-form-embed'
import { Image } from '@/components/ui/image'
import { PortableText } from '@/components/ui/portable-text'
import { Text } from '@/components/ui/text'
import type { StaticPage, StaticSection } from '@/lib/sanity/queries/static-page'

// One template for every marketing page that has no bespoke design yet:
// About Us, Contact, For Developers, Our Work, Work With Shawnee, Pricing.
//
// These pages must EXIST at cutover — their URLs carry rankings, and a URL that
// 404s loses them irreversibly. They do not have to look final. So this renders
// the real content, on brand, and the page gets restyled when its design lands.
// Because the content is already in Sanity in the shape the redesign will use,
// that restyle is a template change, not another content migration.
//
// Deliberately plain. Every flourish added here is a flourish thrown away in a few
// weeks, and a page that looks obviously provisional is more honest than one that
// looks finished and is not.

type PortableValue = Parameters<typeof PortableText>[0]['value']

function Section({ section }: { section: StaticSection }) {
  if (section._type === 'richTextSection') {
    if (!section.content || section.content.length === 0) return null
    return (
      <section className="flex flex-col gap-5">
        {section.heading ? <Heading as="h2">{section.heading}</Heading> : null}
        <div className="max-w-prose">
          <PortableText value={section.content as PortableValue} />
        </div>
      </section>
    )
  }

  if (section._type === 'hubspotFormSection') {
    if (!section.formId) return null
    return (
      <section className="flex flex-col gap-5">
        {section.heading ? <Heading as="h2">{section.heading}</Heading> : null}
        <HubSpotFormEmbed formId={section.formId} />
      </section>
    )
  }

  // Unknown section type. Render nothing rather than guess: a section we do not
  // understand is a section we would render wrongly.
  return null
}

// Narrowed in its own component: the Image primitive's props are a discriminated
// union (Sanity `source` XOR plain `src`), so an optional `source` does not
// satisfy either arm. Checking the asset here gives TypeScript the guarantee.
function HeroImage({
  image,
  title,
}: {
  image: StaticPage['heroImage']
  title: string
}) {
  const source = image?.asset ? image : null
  if (!source) return null

  return (
    <div className="mb-12 overflow-hidden rounded-lg lg:mb-16">
      <Image
        source={source}
        alt={image?.alt ?? title}
        width={1200}
        height={630}
        sizes="(min-width: 1024px) 1152px, 100vw"
        priority
      />
    </div>
  )
}

export default function StaticPageTemplate({
  page,
  breadcrumbs,
  showBreadcrumbs = true,
  calendlyOnly = false,
  tightBottom = false,
}: {
  page: StaticPage
  breadcrumbs: BreadcrumbItem[]
  /** Hide the `> …` breadcrumb row (book-a-call keeps the lime eyebrow only). */
  showBreadcrumbs?: boolean
  /**
   * Collapse the trailing whitespace when something else follows this template
   * on the page (renderStaticPage's `after` slot).
   *
   * The header carries `lg:mb-16` and the container `lg:pb-24` so that a hero
   * image and body sections have room to breathe. On a page that has NEITHER -
   * the book-a-call thank-you page is a headline, a paragraph, and then its own
   * onward-paths block - those two rules resolve to 128px + 192px of empty dark
   * space between the copy and whatever comes next. Measured, not guessed.
   */
  tightBottom?: boolean
  /**
   * Booking landing mode: header + Calendly + footer only. Drops the eyebrow,
   * H1, hero copy, and body sections. A visually-hidden H1 stays for SEO/a11y.
   */
  calendlyOnly?: boolean
}) {
  const hasCalendly = Boolean(page.calendlyUrl)
  const hasSections = (page.sections ?? []).length > 0
  // Only collapse when there is genuinely nothing under the header to space out.
  const hasBodyBelowHeader = hasSections || Boolean(page.heroImage?.asset)
  const collapseTrailing = tightBottom && !hasBodyBelowHeader && !hasCalendly

  if (calendlyOnly && page.calendlyUrl) {
    return (
      <>
        <Heading as="h1" className="sr-only">
          {page.title}
        </Heading>
        {/* CE-40: Calendly stands on its own, full width. A side panel of our own
            was tried and rejected (Jake, Aug 2026) - the booking widget is the
            page, and flanking it just pushed it off-centre. Legibility is solved
            in the theme params instead, not by moving furniture around it.
            The widget now runs a LIGHT theme (see calendly-inline-embed.tsx for
            the browser-verified reason), so it sits on a rounded light card
            rather than bleeding a white rectangle onto the dark page ground. */}
        <div className="w-full bg-bg-primary px-[22px] pb-16 pt-8 sm:px-8 lg:px-16 lg:pb-24 lg:pt-12">
          <CalendlyInlineEmbed
            url={page.calendlyUrl}
            className="mx-auto w-full max-w-[1240px] overflow-hidden rounded-[20px] bg-white"
          />
        </div>
      </>
    )
  }

  return (
    <>
      <Container
        as="div"
        className={
          collapseTrailing
            ? 'pb-0 pt-8 lg:pb-0 lg:pt-12'
            : hasCalendly
              ? 'pb-8 pt-8 lg:pb-10 lg:pt-12'
              : 'pb-16 pt-8 lg:pb-24 lg:pt-12'
        }
      >
        {showBreadcrumbs ? (
          <Breadcrumbs items={breadcrumbs} className="mb-6" />
        ) : null}

        <header
          className={
            collapseTrailing
              ? 'mb-0 flex flex-col gap-4 lg:mb-0'
              : hasCalendly
                ? 'mb-8 flex flex-col gap-4 lg:mb-10'
                : 'mb-12 flex flex-col gap-4 lg:mb-16'
          }
        >
          {page.eyebrow ? (
            <Text
              as="p"
              size="small"
              className="uppercase tracking-wider text-brand-primary font-medium"
            >
              {page.eyebrow}
            </Text>
          ) : null}

          {/* whitespace-pre-line so an editor can force a line break in the
              Studio title field. The book-a-call thank-you page uses it to keep
              "You're booked." on its own line; every other page has no newline
              in its title, so this changes nothing for them. */}
          <Heading as="h1" className="whitespace-pre-line">
            {page.title}
          </Heading>

          {page.heroDescription && page.heroDescription.length > 0 ? (
            <div className="max-w-prose text-text-default/80">
              <PortableText value={page.heroDescription as PortableValue} />
            </div>
          ) : null}
        </header>

        <HeroImage image={page.heroImage} title={page.title} />

        {hasSections ? (
          <div className="flex flex-col gap-12 lg:gap-16">
            {(page.sections ?? []).map((section, i) => (
              <Section key={section._key ?? `s-${i}`} section={section} />
            ))}
          </div>
        ) : null}
      </Container>

      {/* Booking widget: full-bleed band on page ground (#070D18). Calendly's
          own panel stays the card navy (#101B30) via embed theme params. */}
      {page.calendlyUrl ? (
        <div className="w-full bg-bg-primary px-[22px] pb-16 sm:px-8 lg:px-16 lg:pb-24">
          <CalendlyInlineEmbed
            url={page.calendlyUrl}
            className="mx-auto w-full max-w-[1440px]"
          />
        </div>
      ) : null}
    </>
  )
}

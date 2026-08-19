import { cn } from '@/components/ui/_utils/cn'
import { MegaMenuPillLabel } from '@/components/ui/mega-menu-pill-label'
import { Reveal } from '@/components/motion/reveal'
import { ChatLink } from '@/components/shared/chat-link'
import { FaqChatCard } from '@/components/shared/faq-chat-card'
import { HeroTrustBar } from '@/components/social-proof/hero-trust-bar'
import { ReviewCard } from '@/components/social-proof/review-card'
import { CalendlyInlineEmbed } from '@/components/templates/book-a-call/calendly-inline-embed'
import { HomeCalculatorCard } from '@/components/templates/home/calculator-card'
import { HOME_CONTENT } from '@/components/templates/home/content'
import { CHAT_HREF } from '@/lib/chat'
import type { Locale } from '@/lib/locale-path'
import type { ReviewCard as ReviewCardData } from '@/lib/sanity/queries/social-proof'

import { WORK_WITH_MOLLY_CONTENT as C } from './content'
import { MollyVideoCard } from './video-card'

// /work-with-molly
//
// A single-rep landing page, built from docs/design/"V1 - First version to
// try.png". Header, footer and announcement bar are NOT part of this template:
// they come from the root layout, which is what Jake asked for - the page wears
// the normal site chrome, not the chrome drawn in the export.
//
// WHAT IS REUSED RATHER THAN REBUILT
//   logo bar        HeroTrustBar (the same band every marketing page closes its
//                   hero with, including the "Ask our AI anything" link)
//   testimonials    ReviewCard, fed live from Sanity `review` docs, so every
//                   face, name, role, logo and quote belongs to the same
//                   document and cannot mismatch
//   calculator      HomeCalculatorCard on HOME_CONTENT.calculator - the exact
//                   widget the design copied, not a lookalike
//   FAQ copy        HOME_CONTENT.faq.items, which already carries the eight
//                   questions in the export, in the same order
//   chat card       FaqChatCard, the shared "Can't find your question?" panel
//   booking         CalendlyInlineEmbed - see the note on the booking section
//
// The export's calendar is a drawing, not a scheduler. It is replaced with the
// real Calendly panel per Jake's instruction.

const BAND = 'mx-auto w-full max-w-[1440px] px-[22px] sm:px-[32px] lg:px-[64px]'
const CARD = 'rounded-[20px] border border-[#22314D] bg-[#101B30]'
const EYEBROW =
  'text-[12px] font-semibold uppercase leading-[18.6px] tracking-[1.68px] text-brand-primary'
const H2 =
  'text-[34px] font-semibold leading-[1.05] tracking-[-1.3px] text-white lg:text-[52px] lg:tracking-[-1.6px]'
const ACCENT = 'font-serif font-normal italic text-brand-primary'
const GLYPH = { arrow: '\u2192', check: '\u2713', plus: '+', dot: '\u00B7' } as const

/** Every CTA on the page lands on the booking panel further down, so the
 *  visitor never leaves the page to book. */
const BOOK_ANCHOR = `#${C.booking.id}`

function BookPill({ label, className }: { label: string; className?: string }) {
  return (
    <MegaMenuPillLabel
      as="a"
      href={BOOK_ANCHOR}
      variant="pill-green"
      size="cta"
      leadingArrow
      leadingGlyph={GLYPH.arrow}
      label={label}
      className={cn('!h-[48px] !py-0 !pr-[24px] !text-[15px]', className)}
    />
  )
}

function Hero() {
  return (
    // Short-viewport tightening below lives on the elements as arbitrary media
    // variants rather than in globals.css. Only the vertical rhythm of the left
    // stack moves: this headline is three lines and carries a proof row the home
    // hero does not, so it is the constraint on a zoomed-in desktop. Type size is
    // deliberately untouched - shrinking a headline per page is what produced the
    // sitewide mismatch DESIGN-1 had to undo.
    <section className="bg-[#070D18] pb-[40px] pt-[72px] lg:pb-[0px] lg:pt-[104px]">
      <div className={cn(BAND, 'grid items-center gap-[56px] lg:grid-cols-[1.05fr_1fr]')}>
        <div>
          <span
            className="inline-flex items-center gap-[8px] rounded-full border px-[20px] py-[7px] text-[11.5px] font-bold uppercase leading-none tracking-[0.92px] text-brand-primary"
            style={{
              background: 'rgba(212,255,60,0.12)',
              borderColor: 'rgba(212,255,60,0.24)',
            }}
          >
            <span
              aria-hidden
              className="h-[6px] w-[6px] rounded-full bg-brand-primary"
              style={{ boxShadow: '0 0 8px #D4FF3C' }}
            />
            {C.hero.eyebrow}
          </span>

          {/* `text-marketing-hero` is the shared sitewide hero scale, not a
              per-page size. DESIGN-1 learned the hard way that shrinking a
              headline on one page only makes the site read as two sites. */}
          <h1 className="mt-[22px] [@media(max-height:820px)]:lg:mt-[14px] [@media(max-height:660px)]:lg:mt-[8px] text-marketing-hero text-white">
            {C.hero.titleLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
            <span className={cn(ACCENT, 'block')}>{C.hero.titleAccent}</span>
          </h1>

          <p className="mt-[22px] [@media(max-height:820px)]:lg:mt-[16px] [@media(max-height:720px)]:lg:mt-[12px] [@media(max-height:660px)]:lg:mt-[8px] max-w-[480px] text-[17px] leading-[26px] tracking-[-0.08px] text-[#B8C2D1] lg:max-w-[520px] lg:text-[18px] lg:leading-[28px]">
            {C.hero.paragraph}
          </p>

          <div className="mt-[30px] [@media(max-height:820px)]:lg:mt-[20px] [@media(max-height:720px)]:lg:mt-[14px] [@media(max-height:660px)]:lg:mt-[10px]">
            <BookPill label={C.hero.cta} />
          </div>
        </div>

        {/* `hero-visual` opts the card into the shared short-viewport
            compression (globals.css). Zooming in shortens the viewport in CSS
            pixels, and this is what keeps the hero on one screen when it does -
            the same mechanism the home and location heroes use. */}
        <Reveal variant="scale" className="hero-visual">
          <MollyVideoCard />
        </Reveal>
      </div>

      {/* Proof points, full width under both columns - as in the export. */}
      <div className={cn(BAND, 'mt-[54px] [@media(max-height:820px)]:lg:mt-[30px] [@media(max-height:720px)]:lg:mt-[16px] [@media(max-height:660px)]:lg:mt-[10px] flex flex-wrap gap-x-[56px] gap-y-[12px]')}>
        {C.hero.proofPoints.map((point) => (
          <span key={point.lead} className="flex items-center gap-[10px] text-[14px]">
            {/* Dark disc, lime tick - as drawn. The first build had this
                inverted (lime disc, dark tick), which read as three small
                buttons rather than as quiet reassurance under the CTA. */}
            <span
              aria-hidden
              className="flex h-[20px] w-[20px] items-center justify-center rounded-full bg-[#16233B] text-[11px] font-bold text-brand-primary"
            >
              {GLYPH.check}
            </span>
            <span className="font-semibold text-white">{point.lead}</span>
            <span className="text-[#7F8CA0]">{point.rest}</span>
          </span>
        ))}
      </div>
    </section>
  )
}

function TrustedBy({ locale }: { locale: Locale }) {
  return (
    <section className="bg-[#070D18] pb-[72px] pt-[40px]">
      <Reveal className={BAND}>
        {/* HeroTrustBar carries the "Ask our AI anything" pill and its slow
            breathing lime glow (globals.css `.htb-ai`) - the same treatment as
            home, rather than a second, plainer version of the same CTA. */}
        <HeroTrustBar locale={locale} />
      </Reveal>
    </section>
  )
}

function Booking({ booking }: { booking: BookingPanel }) {
  return (
    // scroll-mt clears the fixed header when a CTA jumps here.
    <section id={C.booking.id} className="scroll-mt-[110px] bg-[#070D18] py-[56px]">
      <div className={BAND}>
        {/* One box, not three. The heading sits inside the same plate as the
            scheduler and the embed runs edge to edge under it, so there is no
            card-inside-a-card-inside-a-card. */}
        <div className={cn(CARD, 'overflow-hidden')}>
          <div className="px-[22px] pb-[18px] pt-[22px] lg:px-[28px] lg:pt-[28px]">
            <p className="text-[22px] font-semibold text-white lg:text-[26px]">
              {C.booking.title}
            </p>
            <p className="mt-[6px] text-[14px] text-[#7F8CA0]">
              {booking.isMollys ? C.booking.subtitle : C.booking.subtitleFallback}
            </p>
          </div>
            {/* The export draws a bespoke month grid. That is a picture of a
              scheduler, not one - it cannot know Molly's availability or write
              a booking. The real Calendly panel goes here instead, using the
              same self-loading embed as /book-a-call and /contact, pointed at
              whichever URL the route resolved. */}
          <CalendlyInlineEmbed url={booking.url} backgroundColor="#101B30" />
        </div>
      </div>
    </section>
  )
}

function Testimonials({
  reviews,
  locale,
}: {
  reviews: ReviewCardData[]
  locale: Locale
}) {
  if (reviews.length === 0) return null
  return (
    <section className="bg-[#070D18] py-[80px] lg:py-[104px]">
      <div className={BAND}>
        <p className={EYEBROW}>{C.testimonials.eyebrow}</p>
        <h2 className={cn('mt-[10px]', H2)}>
          {C.testimonials.titleLead}{' '}
          <span className={ACCENT}>{C.testimonials.titleAccent}</span>
        </h2>
        <div className="mt-[44px] grid gap-[28px] md:grid-cols-2 lg:grid-cols-3 lg:gap-[32px]">
          {reviews.map((review, i) => (
            <Reveal key={review._id} delay={i * 60}>
              <ReviewCard review={review} locale={locale} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function Process({ locale }: { locale: Locale }) {
  return (
    <section className="bg-[#070D18] pb-[88px] pt-[64px] lg:pb-[104px]">
      <div className={BAND}>
        <div className="flex flex-wrap items-start justify-between gap-[16px]">
          <div>
            <p className={EYEBROW}>{C.process.eyebrow}</p>
            <h2 className={cn('mt-[10px]', H2)}>
              {C.process.titleLead} <span className={ACCENT}>{C.process.titleAccent}</span>
            </h2>
          </div>
          {/* Same pill and same breathing lime glow as the one in the trust
              bar. `hero-trust-bar` is on the wrapper purely so the `.htb-*`
              rules in globals.css apply - those are two-class selectors and
              cannot be reached any other way (see the note above them). */}
          <span className="hero-trust-bar !w-auto">
            <ChatLink href={CHAT_HREF} locale={locale} className="htb-ai !text-[14px]">
              <span aria-hidden className="htb-ai-arrow">
                {GLYPH.arrow}
              </span>
              {C.process.askAi}
            </ChatLink>
          </span>
        </div>

        <div className="mt-[44px] grid gap-[32px] sm:grid-cols-2 lg:grid-cols-4">
          {C.process.steps.map((step, i) => (
            <Reveal key={step.number} delay={i * 80}>
              <p className="font-serif text-[34px] italic leading-none text-brand-primary">
                {step.number}
              </p>
              <p className="mt-[16px] text-[17px] font-semibold leading-[24px] text-white">
                {step.title}
              </p>
              <p className="mt-[10px] text-[14.5px] leading-[22px] text-[#7F8CA0]">{step.body}</p>
              <p className="mt-[16px] text-[13.5px] font-semibold leading-[20px] text-brand-primary">
                <span aria-hidden>{GLYPH.arrow}</span> {step.note}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function Calculator() {
  const calc = HOME_CONTENT.calculator
  return (
    // Wider bands than the sections above it. The process steps, the calculator
    // and the FAQ are three separate asks stacked in a row, and at 64px they ran
    // together as one long column.
    <section className="bg-[#070D18] py-[88px] lg:py-[120px]">
      <div className={BAND}>
        <p className={EYEBROW}>{calc.eyebrow}</p>
        <h2 className={cn('mt-[10px]', H2)}>
          {calc.titleLead} <span className={ACCENT}>{calc.titleAccent}</span>
        </h2>
        <div className="mt-[36px]">
          <HomeCalculatorCard calculator={calc} />
        </div>
      </div>
    </section>
  )
}

function Faq({ locale }: { locale: Locale }) {
  return (
    <section className="bg-[#070D18] pb-[96px] pt-[88px] lg:pb-[120px] lg:pt-[120px]">
      <div className={cn(BAND, 'grid gap-[40px] lg:grid-cols-[minmax(0,340px)_1fr]')}>
        <div>
          <p className={EYEBROW}>{C.faq.eyebrow}</p>
          <h2 className={cn('mt-[10px]', H2)}>
            {C.faq.titleLead} <span className={ACCENT}>{C.faq.titleAccent}</span>
          </h2>
          <FaqChatCard
            label={C.faq.chatLabel}
            body={C.faq.chatBody}
            cta={C.faq.chatCta}
            locale={locale}
            className="mt-[28px]"
          />
        </div>

        {/* Native <details>, same affordance as ui/faq-list, plus the export's
            lime item number. Server-rendered, so the answers are in the HTML
            for crawlers whether or not a visitor opens them. */}
        <div className="border-t border-[#22314D]">
          {HOME_CONTENT.faq.items.map((item) => (
            <details key={item.number} className="group border-b border-[#22314D]">
              <summary className="flex cursor-pointer list-none items-center gap-[20px] px-[4px] py-[20px] [&::-webkit-details-marker]:hidden">
                <span className="w-[28px] shrink-0 font-serif text-[14px] italic text-brand-primary">
                  {item.number}
                </span>
                <span className="flex-1 text-[15.5px] font-semibold leading-[22px] text-white">
                  {item.question}
                </span>
                <span
                  aria-hidden
                  className="shrink-0 text-[20px] leading-none text-[#7F8CA0] transition-transform duration-200 group-open:rotate-45"
                >
                  {GLYPH.plus}
                </span>
              </summary>
              <p className="pb-[22px] pl-[52px] pr-[16px] text-[14.5px] leading-[23px] text-[#B8C2D1]">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

function ClosingBand() {
  return (
    <section className="bg-brand-primary py-[56px]">
      <div className={cn(BAND, 'flex flex-wrap items-center justify-between gap-[28px]')}>
        <div>
          <p className="text-[32px] font-semibold leading-[1.05] tracking-[-1.2px] text-[#060F1E] lg:text-[44px] lg:tracking-[-1.6px]">
            {C.closing.titleLead}{' '}
            <span className="font-serif font-normal italic">{C.closing.titleAccent}</span>
          </p>
          <p className="mt-[12px] text-[15px] leading-[23px] text-[#060F1E]/80">
            {C.closing.paragraphLines.map((line, i) => (
              <span key={line}>
                {i > 0 && <br />}
                {line}
              </span>
            ))}
          </p>
        </div>
        <div className="flex flex-col items-start gap-[10px] lg:items-end">
          <MegaMenuPillLabel
            as="a"
            href={BOOK_ANCHOR}
            variant="pill-dark"
            size="cta"
            leadingArrow
            leadingGlyph={GLYPH.arrow}
            label={C.closing.cta}
            className="!h-[48px] !py-0 !pr-[24px] !text-[15px]"
          />
          <p className="flex gap-[10px] text-[13px] font-semibold text-[#060F1E]/70">
            {C.closing.trust.map((item, i) => (
              <span key={item}>
                {i > 0 && <span aria-hidden className="pr-[10px]">{GLYPH.dot}</span>}
                {item}
              </span>
            ))}
          </p>
        </div>
      </div>
    </section>
  )
}

/** Which diary the panel is showing, resolved by the route from Sanity. */
export interface BookingPanel {
  url: string
  /** False when the lookup fell back to CE's generic team event. */
  isMollys: boolean
}

export function WorkWithMollyTemplate({
  reviews,
  booking,
  locale = 'en-US',
}: {
  reviews: ReviewCardData[]
  booking: BookingPanel
  locale?: Locale
}) {
  return (
    <main className="bg-[#070D18]">
      {/* Hero + trust bar claim the first screen together, centred at any
          zoom level - the same `.hero-screen` mechanism home, How It Works and
          the service pages use. Nothing below is visible on landing. */}
      <div className="hero-screen">
        <Hero />
        <TrustedBy locale={locale} />
      </div>
      <Booking booking={booking} />
      <Testimonials reviews={reviews} locale={locale} />
      <Process locale={locale} />
      <Calculator />
      <Faq locale={locale} />
      <ClosingBand />
    </main>
  )
}

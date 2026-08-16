import { BlogBand } from '@/components/blog/container'
import { Marquee } from '@/components/ui/marquee'
import { FaqToggleGlyph } from '@/components/ui/faq-list'
import { cn } from '@/components/ui/_utils/cn'
import { TypewriterText } from '@/components/motion/typewriter-text'
import { FaqChatCard } from '@/components/shared/faq-chat-card'
import { STICKY_ASIDE } from '@/components/layout/sticky-aside'
import { HeroTrustBar } from '@/components/social-proof/hero-trust-bar'

import type { BenefitCard, PricingContent } from './content'
import { CalculatorGate } from './calculator-gate'
import { TestimonialVideo } from './testimonial-video'

// TEMPLATE-PRICING - faithful port of the locked "/pricing" design
// (docs/raw-html/Pricing Page 2.dc.html + docs/raw-html-pdf/pricing-page-full.png).
//
// Same dark/lime system as TEMPLATE-HOME / HOW-IT-WORKS: ground #070D18, lime
// accent #D4FF3C, elevated card #101B30 on border #22314D, Inter semibold
// headings, Source Serif 4 italic accent word. Every string arrives on the
// `content` prop; no JSX string literals. The interactive calculator is the one
// client island. The closing lime "Ready to hire" CTA and the footer are
// sitewide chrome (FooterTopCta) - not rebuilt here.
//
// Image slots (candidate photo, client logos, Glassdoor logo, testimonial video
// still + Salmon logo) point at /pricing/<file>; they render as soon as the
// design's pricing_assets are dropped into site/public/pricing.

const EYEBROW =
  'text-[12px] font-semibold uppercase leading-[18.6px] tracking-[1.68px] text-brand-primary'
const H2 =
  'text-[34px] font-semibold leading-[1.05] tracking-[-1.3px] text-white lg:text-[48px] lg:leading-[52px] lg:tracking-[-1.5px]'
const ACCENT = 'font-serif font-normal italic text-brand-primary'
/** Hero accent. `nowrap` keeps the two words together so the headline always
 *  breaks as "World-class Senior engineers at a" / "fair price". */
const ACCENT_HERO = 'font-serif font-normal italic text-brand-primary whitespace-nowrap'
const CARD = 'rounded-[20px] border border-[#22314D] bg-[#101B30]'
/** Anchor target for the hero's "See pricing" cue. `scroll-mt` clears the sticky header. */
const CALCULATOR_SECTION_ID = 'pricing-calculator'
const GLYPH = { arrow: '→', check: '✓', star: '★', play: '▶', quote: '"' } as const

function Eyebrow({ children }: { children: string }) {
  return <p className={EYEBROW}>{children}</p>
}

function SectionHeading({ lead, accent }: { lead: string; accent: string }) {
  return (
    <h2 className={H2}>
      {lead} <span className={ACCENT}>{accent}</span>
    </h2>
  )
}

// ── Benefit stroke icons (no sprite entries exist for these) ────────────────
const iconBase = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '1.8',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}
const BENEFIT_ICONS: Record<string, React.ReactNode> = {
  'user-round': (
    <svg {...iconBase} className="h-5 w-5"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
  ),
  'heart-pulse': (
    <svg {...iconBase} className="h-5 w-5"><path d="M12 21s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 6c-.6 1-1.5 2-2.5 3" /><path d="M3 12h4l2-3 3 6 2-3h4" /></svg>
  ),
  palmtree: (
    <svg {...iconBase} className="h-5 w-5"><rect x="4" y="5" width="16" height="4" rx="1" /><path d="M5 9v11h14V9" /><path d="M10 13h4" /></svg>
  ),
  'trending-up': (
    <svg {...iconBase} className="h-5 w-5"><path d="M3 17l6-6 4 4 8-8" /><path d="M17 7h4v4" /></svg>
  ),
  'graduation-cap': (
    <svg {...iconBase} className="h-5 w-5"><path d="M22 10 12 5 2 10l10 5 10-5Z" /><path d="M6 12v5c0 1 3 3 6 3s6-2 6-3v-5" /></svg>
  ),
  laptop: (
    <svg {...iconBase} className="h-5 w-5"><rect x="4" y="5" width="16" height="11" rx="1.5" /><path d="M2 20h20" /></svg>
  ),
}

// ── Hero ──────────────────────────────────────────────────────────────────
// Centred single column (Jake, Aug 2026). It was a two-column split with a
// three-card talent stack on the right; the stack came out and the copy is now
// centred, so the standard HeroTrustBar below it reads as the foot of the hero
// the way it does on home / how-it-works / hire-engineers. `hero.cards` and
// `hero.candidate` are consequently unread here - left in the schema rather
// than removed mid-flight, same posture as Tech Debt #62/#63.
function Hero({ content }: { content: PricingContent }) {
  const { hero } = content
  return (
    <section className="flex flex-col items-center text-center">
      <Eyebrow>{hero.eyebrow}</Eyebrow>
      {/* The hero is FIXED, not fluid, from `lg` up (Jake, Aug 2026: "even if
          you zoom in or zoom out, the text and the shape of the hero section
          stay the same"). Browser zoom changes the CSS viewport width, so
          anything sized in vw or % re-flows as you zoom - the headline broke in
          a different place at nearly every zoom level. With a fixed font size
          and a fixed max-width, zoom scales the whole block uniformly instead:
          same shape, same line break, just bigger or smaller. Below `lg` the
          fluid token takes back over, because a pinned 60px headline cannot fit
          a phone.

          Both numbers are measured against the copy, not picked by eye.
          "World-class Senior engineers at a" is 910px at 60px, which does not
          fit the 896px band at 1024px - so the pinned size is 58px, where the
          line measures 880px and clears it. 890px of max-width then holds that
          line and nothing more: the accent is `whitespace-nowrap`, so "fair
          price" is atomic and can only fall to line two. */}
      <h1 className="mt-5 max-w-[890px] text-marketing-hero text-white lg:text-[58px]">
        {hero.titleLead}{' '}
        <TypewriterText segments={[{ text: hero.titleAccent, className: ACCENT_HERO }]} />
      </h1>
      {/* Fixed too, for the same reason as the headline. 820px is what holds
          the copy on the two lines the reference shows; 760 dropped
          "surprises." onto a third. */}
      <p className="mt-6 max-w-[820px] text-[18px] leading-[28px] text-text-default/70">{hero.paragraph}</p>
      <ul className="mt-6 flex flex-wrap justify-center gap-x-8 gap-y-3">
        {hero.pills.map((p) => (
          <li key={p.label} className="flex items-center gap-2">
            <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary" />
            <span className="text-[13px] text-white">
              {p.value} {p.label}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

// ── "See pricing" scroll cue ────────────────────────────────────────────────
// Deliberately NOT a button (Jake, Aug 2026): a second filled pill here would
// compete with the page's real CTAs. It is a text link with a chevron and a
// soft lime glow - an affordance saying "there is more below", not an offer.
// Anchors to the calculator section, so it works with JS off and is a real,
// focusable link rather than a scroll handler.
function SeePricingCue({ label }: { label: string }) {
  return (
    <div className="mt-4 flex justify-center [@media(min-height:880px)]:mt-6">
      <a
        href={`#${CALCULATOR_SECTION_ID}`}
        className="see-pricing-cue group inline-flex flex-col items-center gap-1.5 rounded-pill px-4 py-1 text-[14px] font-semibold text-brand-primary transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#070D18]"
      >
        <span>{label}</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="h-4 w-4"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </a>
    </div>
  )
}

// ── Calculator section ──────────────────────────────────────────────────────
function CalculatorSection({ content }: { content: PricingContent }) {
  const { calculator } = content
  return (
    <section id={CALCULATOR_SECTION_ID} className="mt-24 scroll-mt-[120px]">
      <div className="max-w-[640px]">
        <Eyebrow>{calculator.eyebrow}</Eyebrow>
        <div className="mt-3">
          <SectionHeading lead={calculator.titleLead} accent={calculator.titleAccent} />
        </div>
      </div>
      {/* 88px, not the section default: the gate card sits over the calculator
          and needs the heading to stay clear above it. */}
      <div className="mt-[88px]">
        <CalculatorGate content={calculator} />
      </div>
    </section>
  )
}

// ── Benefits ────────────────────────────────────────────────────────────────
function BenefitTile({ card }: { card: BenefitCard }) {
  return (
    <li className={cn(CARD, 'flex flex-col gap-3 p-6')}>
      <span className="flex h-[48px] w-[48px] items-center justify-center rounded-[12px] bg-brand-primary text-[#0A1628]">
        {BENEFIT_ICONS[card.icon] ?? BENEFIT_ICONS['user-round']}
      </span>
      <h3 className="text-[18px] font-semibold text-text-default">{card.title}</h3>
      <p className="text-[15px] leading-[23px] text-text-default/65">{card.body}</p>
    </li>
  )
}

function Benefits({ content }: { content: PricingContent }) {
  const { benefits } = content
  return (
    <section className="mt-28">
      <div className="max-w-[640px]">
        <Eyebrow>{benefits.eyebrow}</Eyebrow>
        <div className="mt-3">
          <SectionHeading lead={benefits.titleLead} accent={benefits.titleAccent} />
        </div>
      </div>
      <ul className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {benefits.cards.map((card) => (
          <BenefitTile key={card.title} card={card} />
        ))}
      </ul>
    </section>
  )
}

// ── Fixed fee (left/right split, top divider, on page bg) ───────────────────
function FixedFee({ content }: { content: PricingContent }) {
  const { fixedFee } = content
  return (
    <section className="mt-24 border-t border-[#22314D] pt-14">
      <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
        <ul className="flex max-w-[820px] flex-col gap-3">
          {fixedFee.bullets.map((b) => (
            <li key={b} className="flex items-center gap-3 text-[22px] font-semibold leading-[1.25] tracking-[-0.4px] text-white lg:text-[24px]">
              <span aria-hidden="true" className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-brand-primary/15 text-[12px] text-brand-primary">
                {GLYPH.check}
              </span>
              {b}
            </li>
          ))}
        </ul>
        <a
          href={fixedFee.ctaHref}
          className="sf sf-p inline-flex h-[52px] shrink-0 items-center gap-2.5 rounded-pill py-[8px] pl-3 pr-6 text-[15px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#070D18]"
        >
          <span aria-hidden="true" className="ic flex h-[26px] w-[26px] items-center justify-center text-[12px]">
            {GLYPH.arrow}
          </span>
          <span className="c">{fixedFee.cta}</span>
        </a>
      </div>
      <p className="mt-8 max-w-[900px] text-[12px] leading-[19px] text-[#6B7589]">{fixedFee.disclaimer}</p>
    </section>
  )
}

// ── De-risk marquee (full-bleed) ────────────────────────────────────────────
// Reuses the site-wide Marquee primitive (same pattern as How It Works): two
// large 58px rows scrolling in opposite directions, lime-diamond separators
// only, pause-on-hover + reduced-motion pause built into the primitive. Rendered
// OUTSIDE the content band so the rows run edge to edge; the eyebrow stays inset
// in the band gutter.
function DeRiskItem({ label }: { label: string }) {
  return (
    <span className="flex items-center">
      <span className="whitespace-nowrap text-[40px] font-normal tracking-[-1.7px] text-white lg:text-[58px] lg:leading-[61px]">
        {label}
      </span>
      <span
        aria-hidden="true"
        className="mx-[26px] inline-block h-[12px] w-[12px] rotate-45 bg-brand-primary lg:mx-[44px] lg:h-[14px] lg:w-[14px]"
      />
    </span>
  )
}

function DeRisk({ content }: { content: PricingContent }) {
  const { deRisk } = content
  const looped = [...deRisk.items, ...deRisk.items, ...deRisk.items]
  return (
    <section className="mt-28 overflow-hidden bg-[#070D18] py-[72px] lg:py-[96px]">
      <div className="mb-[36px]">
        <BlogBand>
          <Eyebrow>{deRisk.eyebrow}</Eyebrow>
        </BlogBand>
      </div>
      <div className="flex flex-col gap-[16px]">
        <Marquee speed="slow" direction="left" className="py-[4px]">
          {looped.map((item, i) => (
            <DeRiskItem key={`l-${item}-${i}`} label={item} />
          ))}
        </Marquee>
        <Marquee speed="slow" direction="right" className="py-[4px]">
          {looped.map((item, i) => (
            <DeRiskItem key={`r-${item}-${i}`} label={item} />
          ))}
        </Marquee>
      </div>
    </section>
  )
}

// ── Rating callout + logo bar ────────────────────────────────────────────────
function RatingAndLogos({ content }: { content: PricingContent }) {
  const { glassdoor } = content
  return (
    <section className="mt-20 flex flex-col items-center gap-12">
      <div className={cn(CARD, 'flex flex-wrap items-center justify-center gap-4 px-6 py-4')}>
        <span className="text-[18px] font-bold tracking-[-0.3px] text-[#0CAA41]">{glassdoor.wordmark}</span>
        <span aria-hidden="true" className="text-[15px] text-brand-primary">
          {GLYPH.star}
          {GLYPH.star}
          {GLYPH.star}
          {GLYPH.star}
          {GLYPH.star}
        </span>
        <span className="text-[18px] font-bold tabular-nums text-text-default">{glassdoor.rating}</span>
        <span className="border-l border-[#22314D] pl-4 text-[13px] text-text-default/60">{glassdoor.reviewsLabel}</span>
      </div>

      {/* The client logos and the "Trusted by 300+ engineering teams" label
          that used to sit here came out on Jake's instruction (Aug 2026). The
          page now carries the standard shared HeroTrustBar under the hero
          instead, so repeating the same logos here was the second showing of
          one proof point. The Glassdoor rating above keeps this section's job.
          `logoBar` (label + logos) is consequently unread; left in the schema
          rather than removed mid-flight, same posture as Tech Debt #62/#63. */}
    </section>
  )
}

// ── Testimonial ─────────────────────────────────────────────────────────────
function Testimonial({ content }: { content: PricingContent }) {
  const { testimonial } = content
  return (
    <section className="mt-28">
      <div className="max-w-[640px]">
        <Eyebrow>{testimonial.eyebrow}</Eyebrow>
        <div className="mt-[16px]">
          <SectionHeading lead={testimonial.titleLead} accent={testimonial.titleAccent} />
        </div>
      </div>
      <div
        className={cn(
          CARD,
          'mt-[56px] grid grid-cols-1 items-stretch overflow-hidden rounded-[24px] lg:min-h-[520px] lg:grid-cols-[44fr_56fr]',
        )}
      >
        <div className="flex flex-col justify-between gap-[28px] p-[32px] lg:px-[48px] lg:py-[44px]">
          <img
            src={testimonial.companyLogo}
            alt={testimonial.role}
            className="h-[30px] w-auto self-start [filter:brightness(0)_invert(1)]"
            loading="lazy"
          />
          <div className="flex flex-col items-start gap-[12px]">
            <span
              aria-hidden="true"
              className="text-[28px] font-extrabold leading-none tracking-[-2px] text-brand-primary"
            >
              {GLYPH.quote}
            </span>
            <blockquote className="max-w-[430px] text-[18px] leading-[28px] tracking-[-0.3px] text-white">
              {testimonial.quote}
            </blockquote>
          </div>
          <div className="flex flex-wrap gap-[28px]">
            {testimonial.stats.map((stat) => (
              <div key={stat.label} className="w-[140px] border-l border-brand-primary pl-[12px]">
                <p className="text-[26px] font-extrabold leading-none tracking-[-0.8px] text-brand-primary">
                  {stat.value}
                </p>
                <p className="mt-[8px] text-[12px] leading-[16px] tracking-[-0.08px] text-white/85">{stat.label}</p>
              </div>
            ))}
          </div>
          <div>
            <p className="text-[19px] font-semibold tracking-[-0.38px] text-white">{testimonial.name}</p>
            <p className="mt-[2px] text-[12.5px] tracking-[-0.08px] text-[#6B7589]">{testimonial.role}</p>
          </div>
        </div>

        {/* Video fills the whole right panel, edge to edge */}
        <TestimonialVideo
          videoUrl={testimonial.videoUrl}
          poster={testimonial.videoPoster}
          caption={testimonial.caption}
          title={testimonial.caption}
          playLabel={testimonial.caption}
        />
      </div>
    </section>
  )
}

// ── FAQ (numbered, string-answer accordion) ─────────────────────────────────
function Faq({ content }: { content: PricingContent }) {
  const { faq } = content
  return (
    <section className="mt-28">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className={STICKY_ASIDE}>
          <Eyebrow>{faq.eyebrow}</Eyebrow>
          <div className="mt-3">
            <SectionHeading lead={faq.titleLead} accent={faq.titleAccent} />
          </div>
          <FaqChatCard
            className="mt-8"
            label={faq.helpEyebrow}
            body={faq.helpBody}
            cta={faq.helpCta}
            href={faq.helpCtaHref}
          />
        </div>

        <div className="flex flex-col gap-3">
          {faq.items.map((item, i) => (
            <details
              key={item.number ?? `faq-${i}`}
              className="group rounded-[14px] border border-[#22314D] border-l-[3px] border-l-transparent bg-[#0A1628] transition-colors duration-200 open:border-l-brand-primary motion-reduce:transition-none"
            >
              <summary className="flex cursor-pointer list-none items-start gap-4 p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#070D18] [&::-webkit-details-marker]:hidden">
                <span className="mt-0.5 shrink-0 text-[14px] font-semibold tabular-nums text-brand-primary">{item.number}</span>
                <span className="flex-1 text-[16px] font-semibold leading-snug text-text-default">{item.question}</span>
                <FaqToggleGlyph />
              </summary>
              <p className="px-5 pb-5 pl-[46px] text-[15px] leading-[24px] text-text-default/70">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

export function PricingTemplate({ content }: { content: PricingContent }) {
  return (
    <main id="main" className="pb-24">
      <BlogBand>
        {/* The hero is a VIEWPORT-HEIGHT BAND with its content vertically
            centred (Jake, Aug 2026: "perfectly centralised onto the hero
            section when you come onto the website... it needs to stay
            perfectly fitted").

            Fixed top padding could not do this. It pinned the block to a
            distance from the header, so the leftover space all collected at the
            bottom: at 90% zoom the hero floated high with a gap under it, and at
            100% the block was 883px inside 774px of room and the "See pricing"
            cue fell off the fold. Centring in the remaining height makes the
            same layout sit correctly at every zoom level, because the band is
            measured in viewport units rather than assumed.

            126px is the chrome above it: the 32px announcement bar plus the 94px
            header. `svh` rather than `vh` so a mobile URL bar does not make the
            band taller than the screen. The 96px of bottom padding (pb-12 - the
            spacing unit here is 8px, not 4px) reserves room for the floating
            Clara ask-bar, which is fixed to the bottom of the viewport and would
            otherwise sit on top of the cue. Content centres in what is left, so
            the gap below reads as 96px larger than the gap above by design. */}
        <div className="flex flex-col justify-center pb-12 lg:min-h-[calc(100svh-126px)]">
          <Hero content={content} />
          {/* The standard trust bar that closes every marketing hero (home,
              how-it-works, hire-engineers, locations). Pricing was the only one
              without it; it now uses the same shared component and the same
              default logo set, so the page foots its hero like the rest. */}
          {/* The logos and the cue sit lower on the page when there is room for
              them to (Jake, Aug 2026: "a little bit further down, just a little
              bit"). The extra gap is height-conditional rather than flat: at
              780px of viewport - a 13in laptop once browser chrome is taken off
              - the hero only just fits, and a flat increase would push the cue
              back under the floating Clara bar, which is the thing we just
              fixed. Above 880px there is slack, so it gets spent here. */}
          <div className="mt-6 [@media(min-height:880px)]:mt-12">
            <HeroTrustBar />
          </div>
          <SeePricingCue label={content.hero.seePricingLabel} />
        </div>
        <CalculatorSection content={content} />
        <Benefits content={content} />
        <FixedFee content={content} />
      </BlogBand>
      <DeRisk content={content} />
      <BlogBand>
        <RatingAndLogos content={content} />
        <Testimonial content={content} />
        <Faq content={content} />
      </BlogBand>
    </main>
  )
}

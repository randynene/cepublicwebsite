import { BlogBand } from '@/components/blog/container'
import { Marquee } from '@/components/ui/marquee'
import { FaqToggleGlyph } from '@/components/ui/faq-list'
import { cn } from '@/components/ui/_utils/cn'

import type { BenefitCard, PricingContent } from './content'
import { CostCalculator } from './cost-calculator'

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
const CARD = 'rounded-[20px] border border-[#22314D] bg-[#101B30]'
const GLYPH = { arrow: '→', check: '✓', star: '★', play: '▶', quote: '“' } as const

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
function Hero({ content }: { content: PricingContent }) {
  const { hero } = content
  const c = hero.candidate
  return (
    <section className="grid grid-cols-1 items-center gap-12 pt-16 lg:grid-cols-[1.1fr_0.9fr] lg:pt-24">
      <div>
        <Eyebrow>{hero.eyebrow}</Eyebrow>
        <h1 className="mt-5 text-[42px] font-semibold leading-[1.03] tracking-[-1.8px] text-white lg:text-[64px] lg:leading-[66px] lg:tracking-[-2.4px]">
          {hero.titleLead} <span className={ACCENT}>{hero.titleAccent}</span>
        </h1>
        <p className="mt-6 max-w-[540px] text-[18px] leading-[28px] text-text-default/70">{hero.paragraph}</p>
        <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
          {hero.pills.map((p) => (
            <li key={p.label} className="flex items-center gap-2">
              <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary" />
              <span className="text-[13px] text-white">
                {p.value} {p.label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Rotated candidate photo card */}
      <div className="flex justify-center lg:justify-end">
        <div
          className="group relative h-[420px] w-[320px] overflow-hidden rounded-[24px] bg-[#16223A] shadow-[inset_0_0_0_10px_#22314D,0_40px_60px_-30px_rgba(0,0,0,.8)] transition-transform duration-300 ease-out will-change-transform hover:[transform:rotate(-1deg)_translateY(-10px)_scale(1.02)] motion-reduce:transition-none motion-reduce:hover:transform-none"
          style={{ transform: 'rotate(-3deg)' }}
        >
          <img src={c.image} alt={c.imageAlt} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
          <span aria-hidden="true" className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#060F1E]/70 to-transparent" />
          <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-[#060F1E]/[0.98] via-[#060F1E]/70 to-transparent" />

          <div className="absolute inset-0 flex flex-col justify-between p-5">
            <div className="flex items-start justify-between gap-3">
              <span>
                <span className="block text-[17px] font-semibold text-white">{c.name}</span>
                <span className="block text-[13px] text-white/70">{c.role}</span>
              </span>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/25 bg-[#0A1628] text-[11px] font-semibold text-white/80">
                {c.flag}
              </span>
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-pill bg-brand-primary/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.6px] text-brand-primary">
                <span aria-hidden="true">{GLYPH.check}</span>
                {c.vettedLabel}
              </span>
              <ul className="mt-3 flex flex-wrap gap-2">
                {c.skills.map((s) => (
                  <li key={s} className="rounded-md bg-brand-primary px-2.5 py-1 text-[12px] font-semibold text-[#0A1628]">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Calculator section ──────────────────────────────────────────────────────
function CalculatorSection({ content }: { content: PricingContent }) {
  const { calculator } = content
  return (
    <section className="mt-24">
      <div className="max-w-[640px]">
        <Eyebrow>{calculator.eyebrow}</Eyebrow>
        <div className="mt-3">
          <SectionHeading lead={calculator.titleLead} accent={calculator.titleAccent} />
        </div>
      </div>
      <div className="mt-8">
        <CostCalculator content={calculator} />
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
  const { glassdoor, logoBar } = content
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

      <div className="flex flex-col items-center gap-6 lg:flex-row lg:gap-8">
        <p className="max-w-[120px] text-center text-[12px] font-semibold uppercase leading-[1.5] tracking-[1.2px] text-[#7F8CA0] lg:text-left">
          {logoBar.label}
        </p>
        <span aria-hidden="true" className="hidden h-10 w-px bg-[#22314D] lg:block" />
        <ul className="flex flex-wrap items-center justify-center divide-x divide-[#22314D]">
          {logoBar.logos.map((logo) => (
            <li key={logo.name} className="flex items-center px-5 py-2">
              <img
                src={logo.src}
                alt={logo.name}
                style={{ height: logo.height }}
                className="w-auto opacity-70 [filter:brightness(0)_invert(1)]"
                loading="lazy"
              />
            </li>
          ))}
        </ul>
      </div>
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
        <div className="mt-3">
          <SectionHeading lead={testimonial.titleLead} accent={testimonial.titleAccent} />
        </div>
      </div>
      <div className={cn(CARD, 'mt-10 grid grid-cols-1 items-stretch overflow-hidden lg:grid-cols-[1fr_620px]')}>
        <div className="flex flex-col p-8 lg:p-12">
          <img src={testimonial.companyLogo} alt={testimonial.role} className="h-6 w-auto self-start opacity-90 [filter:brightness(0)_invert(1)]" loading="lazy" />
          <span aria-hidden="true" className="mt-6 text-[64px] leading-none text-brand-primary">{GLYPH.quote}</span>
          <blockquote className="mt-2 text-[20px] leading-[30px] text-text-default/90">{testimonial.quote}</blockquote>
          <div className="mt-8 flex flex-wrap gap-4">
            {testimonial.stats.map((stat) => (
              <div key={stat.label} className="rounded-[14px] border border-brand-primary/60 px-5 py-4">
                <p className="text-[32px] font-semibold text-brand-primary">{stat.value}</p>
                <p className="mt-1 max-w-[160px] text-[13px] text-text-default/60">{stat.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <p className="text-[18px] font-semibold text-text-default">{testimonial.name}</p>
            <p className="text-[13px] text-brand-primary">{testimonial.role}</p>
          </div>
        </div>

        {/* Video fills the whole right panel, edge to edge */}
        <div className="relative min-h-[320px] overflow-hidden bg-[#0A1628]">
          <img src={testimonial.videoStill} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span aria-hidden="true" className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary text-[22px] text-[#0A1628] shadow-[0_0_0_10px_rgba(212,255,60,0.25)]">
              {GLYPH.play}
            </span>
          </span>
          <span className="absolute inset-x-4 top-4 flex items-center gap-2 rounded-pill bg-[#060F1E]/85 px-4 py-2 text-[12px] text-white/90">
            <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-[#FF4D4D]" />
            {testimonial.caption}
          </span>
        </div>
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
        <div>
          <Eyebrow>{faq.eyebrow}</Eyebrow>
          <div className="mt-3">
            <SectionHeading lead={faq.titleLead} accent={faq.titleAccent} />
          </div>
          <div className={cn(CARD, 'mt-8 p-6')}>
            <p className="text-[12px] font-semibold uppercase tracking-[1.2px] text-text-default/50">{faq.helpEyebrow}</p>
            <p className="mt-2 text-[15px] text-text-default/70">{faq.helpBody}</p>
            <a
              href={faq.helpCtaHref}
              className="sf sf-p mt-4 inline-flex h-[46px] items-center gap-2.5 rounded-pill py-[8px] pl-[8px] pr-5 text-[14px] font-bold shadow-[0_0_24px_rgba(212,255,60,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#070D18]"
            >
              <span aria-hidden="true" className="ic flex h-[30px] w-[30px] items-center justify-center text-[13px]">
                {GLYPH.arrow}
              </span>
              <span className="c">{faq.helpCta}</span>
            </a>
          </div>
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
        <Hero content={content} />
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

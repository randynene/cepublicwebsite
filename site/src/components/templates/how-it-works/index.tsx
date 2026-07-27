import Image from 'next/image'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { MegaMenuPillLabel } from '@/components/ui/mega-menu-pill-label'
import { Marquee } from '@/components/ui/marquee'
import { cn } from '@/components/ui/_utils/cn'
import { Reveal } from '@/components/motion/reveal'
import { CountUp } from '@/components/motion/count-up'
import { Spotlight } from '@/components/motion/spotlight'
import { EngineerMatchQuiz } from '@/components/shared/engineer-match-quiz'
import { ChatPill } from '@/components/shared/chat-link'
import { STICKY_ASIDE } from '@/components/layout/sticky-aside'
import type { Locale } from '@/lib/locale-path'
import { toInternalHref } from '@/lib/url'

import type { HiwContent } from './content'
import { HeroCard } from './hero-cards'
import { TestimonialsSlider } from './testimonials-slider'

// TEMPLATE-HOW-IT-WORKS — faithful reproduction of the locked "How It Works"
// export (docs/raw-html/How It Works.html desktop artboard + PDF), with the
// approved design corrections applied: hero cards flank the centered headline
// (Ana left, Reinaldo right); stages 1-3 are text-left / photo-right with the
// funnel widget inside Stage 2's text column; testimonials alternate photo and
// quote cards. Same design system as TEMPLATE-HOME: dark ground #070D18, lime
// accent #D4FF3C, elevated card #101B30 / border #22314D, Inter semibold
// headings, Source Serif 4 italic accent word. All copy arrives via the
// `content` prop (Sanity howItWorksPage, or the static HIW_CONTENT fallback);
// no JSX string literals. The closing lime CTA and footer are sitewide chrome
// (FooterTopCta) — not rebuilt here. The interactive matcher is a static stub.

const BAND = 'mx-auto w-full max-w-[1440px] px-[22px] sm:px-[32px] lg:px-[64px]'
const CARD = 'rounded-[20px] border border-[#22314D] bg-[#101B30]'
const EYEBROW =
  'text-[12px] font-semibold uppercase leading-[18.6px] tracking-[1.68px] text-brand-primary'
const MUTED = 'text-[#7F8CA0]'
// Heading sizes match THIS export's LIVE token scale (H1 67 / H2 58 / H3 46).
const H1 =
  'text-[38px] font-semibold leading-[1.05] tracking-[-1.5px] text-white lg:text-[67px] lg:leading-[70.56px] lg:tracking-[-2.52px]'
const H2 =
  'text-[34px] font-semibold leading-[1.05] tracking-[-1.3px] text-white lg:text-[58px] lg:leading-[61px] lg:tracking-[-1.7px]'
const H2_SM =
  'text-[30px] font-semibold leading-[1.08] tracking-[-1px] text-white lg:text-[46px] lg:leading-[56px] lg:tracking-[-1.4px]'
const ACCENT = 'font-serif font-normal italic text-brand-primary'

const GLYPH = {
  arrow: '→',
  check: '✓',
} as const

function Eyebrow({ children }: { children: string }) {
  return <p className={EYEBROW}>{children}</p>
}

type SectionProps = { content: HiwContent; locale: Locale }

function Hero({ content, locale }: SectionProps) {
  const { hero } = content
  const [ana, reinaldo] = hero.people
  const textStack = (
    <div className="text-center">
      <span
        className="inline-flex items-center gap-[8px] rounded-full border px-[20px] py-[7px] text-[11.5px] font-bold uppercase leading-none tracking-[0.92px] text-brand-primary"
        style={{ background: 'rgba(212,255,60,0.12)', borderColor: 'rgba(212,255,60,0.24)' }}
      >
        <span
          aria-hidden
          className="h-[6px] w-[6px] rounded-full bg-brand-primary"
          style={{ boxShadow: '0 0 8px #D4FF3C' }}
        />
        {hero.eyebrow}
      </span>
      <h1 className={cn('mt-[22px]', H1)}>
        {hero.titleLead}
        <br />
        <span className={ACCENT}>{hero.titleAccent}</span>
      </h1>
      <p className="mx-auto mt-[22px] max-w-[440px] text-[17px] font-normal leading-[26px] tracking-[-0.08px] text-[#B8C2D1] lg:text-[19px] lg:leading-[28.5px]">
        {hero.paragraph}
      </p>
      <div className="mt-[30px] flex flex-wrap items-center justify-center gap-[14px]">
        <MegaMenuPillLabel
          as="a"
          href={toInternalHref(hero.ctaHref, locale).href}
          variant="pill-green"
          size="cta"
          leadingArrow
          leadingGlyph={GLYPH.arrow}
          label={hero.cta}
          className="!h-[48px] !py-0 !pr-[24px] !text-[15px]"
        />
      </div>
      <div className="mt-[26px] flex flex-wrap justify-center gap-x-[20px] gap-y-[10px]">
        {hero.bottomPills.map((pill) => (
          <span
            key={pill}
            className="flex items-center gap-[7px] text-[13.5px] font-medium text-[#B8C2D1]"
          >
            <span aria-hidden className="h-[6px] w-[6px] rounded-full bg-brand-primary" />
            {pill}
          </span>
        ))}
      </div>
    </div>
  )

  return (
    <section className="bg-[#070D18] pb-[72px] pt-[88px] lg:pb-[88px] lg:pt-[120px]">
      {/* Wider band than the text column so the two cards sit further out,
       * roughly under the nav logo (left) and Schedule-a-Call CTA (right). */}
      <div className="mx-auto w-full max-w-[1512px] px-[22px] sm:px-[32px] lg:px-[48px]">
        {/* Desktop: two cards flank the centered headline */}
        <div className="grid items-center gap-[24px] lg:grid-cols-[minmax(0,310px)_minmax(0,1fr)_minmax(0,310px)] lg:gap-[32px]">
          <div className="hidden lg:block">
            <HeroCard person={ana} vetted={hero.vetted} />
          </div>
          {textStack}
          <div className="hidden lg:block">
            <HeroCard person={reinaldo} vetted={hero.vetted} />
          </div>
        </div>
        {/* Mobile: cards drop below the headline */}
        <div className="mx-auto mt-[40px] grid max-w-[440px] grid-cols-2 gap-[16px] lg:hidden">
          <HeroCard person={ana} vetted={hero.vetted} />
          <HeroCard person={reinaldo} vetted={hero.vetted} />
        </div>
      </div>
    </section>
  )
}

// ─── Stage visuals ──────────────────────────────────────────────────────────

// Stage 1 illustrative "Matching Brief" scoping card (from stages.brief).
function MatchingBriefCard({ content }: { content: HiwContent }) {
  const { brief } = content.stages
  return (
    <Reveal
      variant="scale"
      scaleFrom={0.98}
      className="overflow-hidden rounded-[24px] border border-[#22314D] bg-[#0A0A0C] shadow-[0_30px_50px_rgba(0,0,0,.35)]"
    >
      <div className="flex items-center justify-between border-b border-white/[0.06] px-[24px] py-[16px]">
        <span className="flex items-center gap-[8px]">
          <span aria-hidden className="h-[14px] w-[14px] rounded-[4px] bg-[#3A3B42]" />
          <span className="text-[13px] font-bold text-[#E7E8EC]">{brief.label}</span>
        </span>
        <span className="flex items-center gap-[8px] rounded-full bg-[#16241C] px-[12px] py-[5px] text-[11px] font-medium text-[#5FCF86]">
          <span aria-hidden className="h-[6px] w-[6px] rounded-full bg-[#5FCF86]" />
          {brief.status} {brief.timer}
        </span>
      </div>
      <div className="p-[28px]">
        <div className="text-[16px] font-bold text-white">{brief.role}</div>
        <div className="mt-[2px] text-[12px] font-normal text-[#8C8E96]">{brief.scopedBy}</div>

        <dl className="mt-[20px] flex flex-col gap-[12px]">
          {/* Stack row = green chips, right-aligned */}
          <div className="flex items-start justify-between gap-[16px]">
            <dt className="shrink-0 text-[12.5px] font-medium text-[#8C8E96]">{brief.stackLabel}</dt>
            <dd className="flex flex-wrap justify-end gap-[6px]">
              {brief.stack.map((tech) => (
                <span
                  key={tech}
                  className="rounded-[6px] border border-[rgba(167,214,138,0.25)] bg-[#1E2A18] px-[8px] py-[3px] text-[11.5px] font-medium text-[#A7D68A]"
                >
                  {tech}
                </span>
              ))}
            </dd>
          </div>
          {/* label / right-aligned value rows */}
          {brief.fields.map((field) => (
            <div
              key={field.label}
              className="flex items-start justify-between gap-[16px] border-t border-white/[0.07] pt-[12px]"
            >
              <dt className="shrink-0 text-[12.5px] font-medium text-[#8C8E96]">{field.label}</dt>
              <dd className="max-w-[62%] text-right text-[13px] font-medium text-[#E7E8EC]">
                {field.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-[20px] flex flex-wrap items-center justify-between gap-[10px] rounded-[12px] bg-[#111114] px-[18px] py-[14px]">
          <span className="text-[12.5px] font-medium text-[#B8BAC1]">{brief.searchingNote}</span>
          <span className="text-[12px] font-medium text-[#7FB3FF]">{brief.resultNote}</span>
        </div>
      </div>
    </Reveal>
  )
}

function StagePhoto({ src, alt }: { src: string; alt: string }) {
  return (
    <Reveal
      variant="scale"
      scaleFrom={0.98}
      className="relative aspect-[4/3.4] w-full overflow-hidden rounded-[24px] border border-[#22314D] shadow-[0_24px_40px_rgba(0,0,0,.3)]"
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 1024px) 90vw, 600px"
        className="object-cover"
      />
    </Reveal>
  )
}

function FunnelCard({ content }: { content: HiwContent }) {
  const { funnel } = content.stages
  return (
    <Reveal className="mt-[28px] rounded-[16px] border border-[#22314D] bg-[#1B2A45] p-[24px]">
      <p className={cn('text-[11.5px] font-semibold uppercase tracking-[1.4px]', MUTED)}>
        {funnel.label}
      </p>
      <div className="mt-[20px] flex flex-col gap-[16px]">
        {funnel.rows.map((row, i) => (
          <div key={row.label}>
            <div className="flex items-baseline justify-between gap-[12px]">
              <span className="text-[14.5px] font-normal text-[#B8C2D1]">{row.label}</span>
              <span
                className={cn(
                  'text-[14.5px] font-extrabold',
                  row.highlight ? 'text-brand-primary' : 'text-white',
                )}
              >
                <CountUp value={row.value} />
              </span>
            </div>
            <div className="mt-[8px] h-[8px] w-full overflow-hidden rounded-full bg-[#0E1830]">
              <Reveal
                variant="scale-x"
                delay={i * 140}
                className={cn(
                  'h-full rounded-full',
                  row.highlight ? 'bg-brand-primary' : 'bg-[#3A5A96]',
                )}
                style={{
                  width: row.barWidth,
                  transitionDuration: '720ms',
                  transitionTimingFunction: 'cubic-bezier(0.165,0.84,0.44,1)',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </Reveal>
  )
}

function HandledCard({ content }: { content: HiwContent }) {
  const { handled } = content.stages
  return (
    <Reveal
      variant="scale"
      scaleFrom={0.98}
      className="rounded-[24px] border border-[#22314D] bg-[#0A0A0C] p-[28px]"
    >
      <div className="flex items-center justify-between">
        <span className="text-[15px] font-bold text-white">{handled.title}</span>
        <span className="flex items-center gap-[8px] rounded-full bg-[#16241C] px-[12px] py-[6px] text-[11px] font-medium text-[#5FCF86]">
          <span aria-hidden className="h-[6px] w-[6px] rounded-full bg-[#5FCF86]" />
          {handled.status}
        </span>
      </div>
      <ul className="mt-[20px] flex flex-col gap-[12px]">
        {handled.rows.map((row) => (
          <li key={row.title} className="flex items-start gap-[12px]">
            <span aria-hidden className="mt-[1px] text-[14px] font-bold text-brand-primary">
              {GLYPH.check}
            </span>
            <div>
              <div className="text-[14px] font-semibold text-[#EAF0F7]">{row.title}</div>
              <div className="text-[12px] font-normal text-[#6B7280]">{row.sub}</div>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-[20px] flex items-center justify-between border-t border-white/[0.07] pt-[16px]">
        <span className="text-[12px] font-normal text-[#6B7280]">{handled.footnote}</span>
        <span className="text-[12px] font-semibold text-brand-primary">{handled.footprint}</span>
      </div>
    </Reveal>
  )
}

// Stage-4 outcome stats — compact 3-up strip rendered inside the Stage 4 text
// column (the payoff to "we handle everything else"), mirroring how the funnel
// sits inside Stage 2's text column.
function StageStats({ content }: { content: HiwContent }) {
  const { stats } = content.stages
  return (
    <div className="mt-[28px] grid grid-cols-3 gap-[8px] rounded-[16px] border border-[#22314D] bg-[#101B30] p-[20px]">
      {stats.map((stat, i) => (
        <Reveal
          key={stat.label}
          delay={i * 80}
          className={cn('px-[4px]', i > 0 && 'border-l border-[#22314D] pl-[16px]')}
        >
          <div className="text-[22px] font-extrabold leading-none tracking-[-0.6px] text-brand-primary lg:text-[26px]">
            <CountUp value={stat.value} />
          </div>
          <div className={cn('mt-[8px] text-[12px] leading-[15px]', MUTED)}>{stat.label}</div>
        </Reveal>
      ))}
    </div>
  )
}

// Alternating stage rows. Visual on the LEFT for even indexes (Stage 1 Matching
// Brief, Stage 3 photo); text stays first in the DOM for reading/crawl order
// and is re-ordered visually with lg:order-*. Stage 2 carries the funnel under
// its checklist; Stage 4 carries the outcome stats under its checklist.
function StageRow({ content, index }: { content: HiwContent; index: number }) {
  const stage = content.stages.items[index]
  const visualLeft = index % 2 === 0
  // Pin the SHORTER column so it travels within the taller one: on stages 1 & 3
  // (even, tall visual) pin the TEXT; on stages 2 & 4 (tall text) pin the VISUAL.
  const STICKY = 'lg:sticky lg:top-[104px] lg:self-start'
  const text = (
    <div className={cn(visualLeft && 'lg:order-2', visualLeft && STICKY)}>
      <span className={EYEBROW}>{stage.stage}</span>
      <h3 className="mt-[12px] text-[26px] font-extrabold leading-[32px] tracking-[-0.6px] text-white">
        {stage.title}
      </h3>
      <p className="mt-[14px] max-w-[480px] text-[14.5px] font-normal leading-[22.48px] text-[#B8C2D1]">
        {stage.intro}
      </p>
      <ul className="mt-[20px] flex flex-col gap-[12px]">
        {stage.checks.map((check, i) => (
          <Reveal as="li" key={check} delay={i * 60} className="flex items-start gap-[10px]">
            <span aria-hidden className="mt-[2px] text-[14px] font-bold text-brand-primary">
              {GLYPH.check}
            </span>
            <span className="text-[14.5px] font-normal leading-[22.48px] text-[#B8C2D1]">{check}</span>
          </Reveal>
        ))}
      </ul>
      {index === 1 ? <FunnelCard content={content} /> : null}
      {index === 3 ? <StageStats content={content} /> : null}
    </div>
  )
  const visualNode =
    index === 0 ? (
      <MatchingBriefCard content={content} />
    ) : index === 3 ? (
      <HandledCard content={content} />
    ) : stage.image ? (
      <StagePhoto src={stage.image} alt={stage.imageAlt ?? stage.title} />
    ) : null
  // Sticky pins a column while the other scrolls past it, releasing at the next
  // stage (the grid is items-start, so the pin travels only within this row).
  // Sticky is inherently reduced-motion-safe.
  const visual = (
    <div className={cn(visualLeft && 'lg:order-1', !visualLeft && STICKY)}>{visualNode}</div>
  )
  return (
    <div className="grid items-start gap-[40px] lg:grid-cols-2 lg:gap-[64px]">
      {text}
      {visual}
    </div>
  )
}

function Stages({ content }: { content: HiwContent }) {
  const { stages } = content
  return (
    <section id="stages" className="scroll-mt-[96px] bg-[#070D18] py-[72px] lg:py-[104px]">
      <div className={cn(BAND, 'flex flex-col gap-[72px] lg:gap-[104px]')}>
        <div>
          <Eyebrow>{stages.eyebrow}</Eyebrow>
          {/* One line on desktop — slightly reduced from 58px so the full line
           * fits inside the band; wraps naturally below lg. */}
          <h2
            className={cn(
              'mt-[16px]',
              H2,
              'lg:whitespace-nowrap lg:text-[52px] lg:leading-[56px] lg:tracking-[-1.6px]',
            )}
          >
            {stages.titleLead} <span className={ACCENT}>{stages.titleAccent}</span>
          </h2>
        </div>

        {stages.items.map((_, i) => (
          <StageRow key={i} content={content} index={i} />
        ))}
      </div>
    </section>
  )
}

// De-risk marquee — two large looping rows scrolling in opposite directions.
// Reuses the Marquee primitive (direction prop + prefers-reduced-motion pause).
// Items tripled inline so each row's set exceeds the viewport for a gap-free
// loop; a lime diamond separates items.
function DeRiskRow({ content, direction }: { content: HiwContent; direction: 'left' | 'right' }) {
  const { deRisk } = content
  const looped = [...deRisk.items, ...deRisk.items, ...deRisk.items]
  return (
    <Marquee speed="slow" direction={direction} className="py-[4px]">
      {looped.map((item, i) => (
        <span key={`${direction}-${item}-${i}`} className="flex items-center">
          <span className="text-[40px] font-normal text-white lg:text-[58px]">{item}</span>
          <span
            aria-hidden
            className="mx-[32px] inline-block h-[10px] w-[10px] rotate-45 bg-brand-primary lg:mx-[44px] lg:h-[12px] lg:w-[12px]"
          />
        </span>
      ))}
    </Marquee>
  )
}

function DeRisk({ content }: { content: HiwContent }) {
  const { deRisk } = content
  return (
    <section className="bg-[#070D18] py-[72px] lg:py-[96px]">
      <div className={cn(BAND, 'mb-[36px]')}>
        <Eyebrow>{deRisk.eyebrow}</Eyebrow>
      </div>
      <div className="flex flex-col gap-[16px]">
        <DeRiskRow content={content} direction="left" />
        <DeRiskRow content={content} direction="right" />
      </div>
    </section>
  )
}

function Testimonials({ content }: { content: HiwContent }) {
  const { testimonials } = content
  return (
    // overflow-hidden clips the full-bleed slider so it never adds a page-level
    // horizontal scrollbar (this section has no sticky, so it is safe here).
    <section className="overflow-hidden bg-[#070D18] py-[72px] lg:py-[104px]">
      <div className={cn(BAND, 'mb-[40px] flex flex-col gap-[16px]')}>
        <Eyebrow>{testimonials.eyebrow}</Eyebrow>
        <h2 className={cn(H2)}>
          {testimonials.titleLead} <span className={ACCENT}>{testimonials.titleAccent}</span>
        </h2>
      </div>
      {/* Slider breaks out of the band to full viewport width. */}
      <TestimonialsSlider items={[...testimonials.items]} />
    </section>
  )
}

function Matcher({ content, locale }: SectionProps) {
  const { matcher } = content
  return (
    // Cursor spotlight on the heading block only - the quiz below is an input
    // surface and must stay full-bright.
    <Spotlight className="py-[72px] lg:py-[104px]">
      <div className={BAND}>
        <div data-spot-item className="transition-opacity duration-300 motion-safe:opacity-50">
          <Eyebrow>{matcher.eyebrow}</Eyebrow>
          <h2 className={cn('mt-[16px]', H2_SM)}>
            {matcher.titleLead}{' '}
            <span className={cn(ACCENT, 'whitespace-nowrap')}>{matcher.titleAccent}</span>
          </h2>
          <p className="mt-[18px] max-w-[560px] text-[16px] font-normal leading-[24px] tracking-[-0.08px] text-text-secondary">
            {matcher.paragraph}
          </p>
        </div>
        <div className="mt-[40px]">
          <EngineerMatchQuiz content={matcher} locale={locale} />
        </div>
      </div>
    </Spotlight>
  )
}

function Faq({ content, locale }: SectionProps) {
  const { faq } = content
  return (
    <section id="faq" className="scroll-mt-[96px] bg-[#070D18] py-[72px] lg:py-[104px]">
      <div className={cn(BAND, 'grid gap-[40px] lg:grid-cols-[0.9fr_1.6fr]')}>
        <div className={STICKY_ASIDE}>
          <Eyebrow>{faq.eyebrow}</Eyebrow>
          <h2 className={cn('mt-[16px]', H2)}>
            {faq.titleLead} <span className={ACCENT}>{faq.titleAccent}</span>
          </h2>
          <div className={cn(CARD, 'mt-[28px] flex flex-col items-start gap-[10px] p-[24px]')}>
            <div className="text-[13px] font-bold uppercase tracking-[0.9px] text-white">
              {faq.fallbackLabel}
            </div>
            <p className={cn('text-[14px] leading-[21px]', MUTED)}>{faq.fallbackBody}</p>
            <ChatPill
              href={faq.fallbackCtaHref}
              locale={locale}
              variant="pill-green"
              size="cta"
              leadingArrow
              leadingGlyph={GLYPH.arrow}
              label={faq.fallbackCta}
            />
          </div>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faq.items.map((item, i) => (
            <Reveal
              as={AccordionItem}
              key={item.number}
              value={item.number}
              delay={i * 60}
              className="border-t border-[#22314D] last:border-b last:border-[#22314D]"
            >
              <AccordionTrigger className="gap-[20px] px-0 py-[24px] text-left hover:no-underline">
                <span className="shrink-0 text-[13px] font-bold text-brand-primary">{item.number}</span>
                <span className="flex-1 text-[16px] font-semibold leading-[24px] text-white transition-colors group-hover:text-brand-primary lg:text-[18px]">
                  {item.question}
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-0 pb-[20px] pt-0">
                <p className={cn('pl-[34px] text-[15px] leading-[24px]', MUTED)}>{item.answer}</p>
              </AccordionContent>
            </Reveal>
          ))}
        </Accordion>
      </div>
    </section>
  )
}

export function HowItWorksTemplate({
  content,
  locale = 'en-US',
}: {
  content: HiwContent
  locale?: Locale
}) {
  return (
    <main id="main" className="bg-[#070D18]">
      <Hero content={content} locale={locale} />
      <Stages content={content} />
      <DeRisk content={content} />
      <Testimonials content={content} />
      <Matcher content={content} locale={locale} />
      <Faq content={content} locale={locale} />
    </main>
  )
}

export default HowItWorksTemplate

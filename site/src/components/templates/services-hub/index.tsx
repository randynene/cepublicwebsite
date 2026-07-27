import Link from 'next/link'

import { cn } from '@/components/ui/_utils/cn'
import { STICKY_ASIDE } from '@/components/layout/sticky-aside'
import { type ServiceCard, type TechChip } from '@/data/services'
import type { ServicesHubContent } from '@/lib/catalogue/hub-content'
import { CatalogueFaq } from '@/components/templates/catalogue/faq'
import { TechBadge } from '@/components/ui/tech-badge'
import { ACCENT, BAND, BODY, CAT_LABELS, Chevron, Eyebrow, GLYPH, HubQuotes, HubStories, LimeCheck, SectionHeading } from '@/components/templates/catalogue/shared'

// TEMPLATE-SERVICES-HUB - /services index. Approved D3 design, fed by Sanity
// (Phase 2B): card grids + hero lead + FAQs come from Sanity via
// mapServicesHubData; section headings, the promo block, and the stories/quotes
// carousels stay fixed brand furniture. Every card links to a real Sanity slug.
// `pathPrefix` carries the locale ('' for US, '/uk' for UK). Header/footer + the
// closing "Ready to hire" CTA are sitewide chrome.

// Service card: full-bleed image with the caption (lime check + name + subtitle)
// overlaid across the bottom over a scrim. Sanity image drops into the placeholder.
function SvcCard({ card, prefix, featured }: { card: ServiceCard; prefix: string; featured?: boolean }) {
  return (
    <a
      href={`${prefix}/services/${card.slug}`}
      className={cn(
        'group relative flex flex-col justify-end overflow-hidden rounded-[20px] border bg-[#1B2A45]',
        'transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-[3px] hover:shadow-[0_20px_50px_-24px_rgba(212,255,60,0.25)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#070D18]',
        featured ? 'min-h-[280px] border-brand-primary/40 hover:border-brand-primary' : 'min-h-[220px] border-[#22314D] hover:border-brand-primary/60',
      )}
    >
      {/* Image placeholder (Sanity image later) */}
      <span aria-hidden="true" className="absolute inset-0 opacity-40" style={{ backgroundImage: 'repeating-linear-gradient(135deg, #22314D 0 2px, transparent 2px 12px)' }} />
      <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#060F1E] via-[#060F1E]/70 to-transparent" />
      {/* Overlaid caption */}
      <span className="relative flex flex-col gap-2 p-6">
        <span className="flex items-center gap-2.5">
          <LimeCheck />
          <span className={cn('font-semibold text-white', featured ? 'text-[20px]' : 'text-[17px]')}>{card.name}</span>
        </span>
        <span className={cn('text-[14px] leading-[20px]', BODY)}>{card.sub}</span>
      </span>
    </a>
  )
}

function TechChipCard({ chip, prefix }: { chip: TechChip; prefix: string }) {
  return (
    <a
      href={`${prefix}/technology/${chip.slug}`}
      className="group flex items-center gap-4 rounded-[16px] border border-[#22314D] bg-[#101B30] p-5 transition-colors duration-200 hover:bg-[#1B2A45] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#070D18]"
    >
      <TechBadge slug={chip.slug} logo={chip.logo} abbr={chip.abbr} />
      <span className="min-w-0 flex-1">
        <span className="block text-[16.5px] font-semibold text-white">{chip.name}</span>
        <span className="block truncate text-[13.5px] text-[#7F8CA0]">{chip.sub}</span>
      </span>
      <Chevron className="h-4 w-4 shrink-0 text-[#7F8CA0] transition-colors group-hover:text-brand-primary" />
    </a>
  )
}

function CardCategory({ eyebrow, lead, accent, cards, prefix }: { eyebrow: string; lead: string; accent: string; cards: ServiceCard[]; prefix: string }) {
  return (
    <section className={cn(BAND, 'py-[56px]')}>
      <SectionHeading eyebrow={eyebrow} lead={lead} accent={accent} center />
      <ul className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {cards.map((c) => (
          <li key={c.slug} className="contents">
            <SvcCard card={c} prefix={prefix} />
          </li>
        ))}
      </ul>
    </section>
  )
}

export function ServicesHubTemplate({ content, pathPrefix = '' }: { content: ServicesHubContent; pathPrefix?: string }) {
  const h = content
  return (
    // overflow-x-CLIP, not hidden: `hidden` makes this element a scroll
    // container, which silently kills the sticky FAQ intro column inside it.
    <main id="main" className="overflow-x-clip">
      {/* Hero */}
      <section className={cn(BAND, 'pb-[24px] pt-[72px] text-center lg:pt-[96px]')}>
        <span className="inline-flex items-center gap-2 rounded-pill border border-brand-primary/30 bg-brand-primary/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[1px] text-brand-primary">
          {h.hero.eyebrow}
        </span>
        <h1 className="mx-auto mt-6 max-w-[900px] text-[42px] font-semibold leading-[1.03] tracking-[-2px] text-white lg:text-[64px] lg:leading-[68px] lg:tracking-[-2.4px]">
          {h.hero.titleLead} <span className={ACCENT}>{h.hero.titleAccent}</span>
        </h1>
        <p className={cn('mx-auto mt-5 max-w-[560px] text-[18px] leading-[28px]', BODY)}>{h.hero.lead}</p>
      </section>

      {/* Category 1: featured 2-up + 12-card grid, with search */}
      <section className={cn(BAND, 'py-[40px]')}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-[28px] font-semibold tracking-[-0.8px] text-white lg:text-[32px]">{h.category1Heading}</h2>
          <form action={`${pathPrefix}/services`} className="relative w-full max-w-[280px]">
            <input
              type="search"
              name="q"
              placeholder={h.hero.searchPlaceholder}
              aria-label={h.hero.searchPlaceholder}
              className="w-full rounded-pill border border-[#22314D] bg-[#101B30] px-5 py-3 text-[14px] text-white placeholder:text-[#7F8CA0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </form>
        </div>
        {/* Featured 2-up */}
        <ul className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
          {h.featured.map((c) => (
            <li key={c.slug} className="contents">
              <SvcCard card={c} prefix={pathPrefix} featured />
            </li>
          ))}
        </ul>
        {/* Specialists 4-col */}
        <ul className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {h.specialists.map((c) => (
            <li key={c.slug} className="contents">
              <SvcCard card={c} prefix={pathPrefix} />
            </li>
          ))}
        </ul>
      </section>

      <CardCategory eyebrow={h.aiHeading.eyebrow} lead={h.aiHeading.lead} accent={h.aiHeading.accent} cards={h.ai} prefix={pathPrefix} />
      <CardCategory eyebrow={h.buildsHeading.eyebrow} lead={h.buildsHeading.lead} accent={h.buildsHeading.accent} cards={h.builds} prefix={pathPrefix} />

      {/* Product Scoping promo */}
      <section className={cn(BAND, 'py-[40px]')}>
        <div className="grid grid-cols-1 items-stretch gap-6 overflow-hidden rounded-[24px] border border-[#22314D] bg-[#101B30] lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col justify-center p-8 lg:p-12">
            <Eyebrow>{h.promo.eyebrow}</Eyebrow>
            <p className="mt-4 text-[26px] font-semibold leading-[1.25] tracking-[-0.5px] text-white lg:text-[30px]">
              {h.promo.titleLead} <span className={ACCENT}>{h.promo.titleAccent}</span>
            </p>
            <p className={cn('mt-4 max-w-[460px] text-[15px] leading-[23px]', BODY)}>{h.promo.body}</p>
            <a
              href={`${pathPrefix}${h.promo.ctaHref}`}
              className="sf sf-p mt-6 inline-flex w-fit items-center gap-2.5 rounded-pill py-[8px] pl-[8px] pr-5 text-[15px] font-bold"
            >
              <span aria-hidden="true" className="ic flex h-[30px] w-[30px] items-center justify-center text-[13px]">{GLYPH.arrow}</span>
              <span className="c">{h.promo.cta}</span>
            </a>
          </div>
          <span aria-hidden="true" className="relative hidden min-h-[240px] overflow-hidden bg-[#1B2A45] lg:block">
            <span className="absolute inset-0 opacity-40" style={{ backgroundImage: 'repeating-linear-gradient(135deg, #22314D 0 2px, transparent 2px 12px)' }} />
          </span>
        </div>
      </section>

      {/* Technology coverage */}
      <section className={cn(BAND, 'py-[56px]')}>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionHeading eyebrow={h.techCoverage.eyebrow} lead={h.techCoverage.titleLead} accent={h.techCoverage.titleAccent} />
            <p className={cn('mt-4 max-w-[380px] text-[16px]', BODY)}>{h.techCoverage.body}</p>
            <Link href={`${pathPrefix}/technology`} className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-semibold text-brand-primary">
              {h.techCoverage.seeAll}
              <Chevron className="h-3.5 w-3.5" />
            </Link>
          </div>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {h.techChips.map((chip) => (
              <li key={chip.slug} className="contents">
                <TechChipCard chip={chip} prefix={pathPrefix} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <HubStories eyebrow="Shared · Customer stories" heading="Hear from our customers" stories={h.stories} />
      <HubQuotes eyebrow="Reviews from real teams" lead="What the difference" accent="feels like" quotes={h.quotes} />

      {/* FAQ */}
      <section className={cn(BAND, 'py-[64px]')}>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div className={STICKY_ASIDE}>
            <Eyebrow>{CAT_LABELS.gotQuestions}</Eyebrow>
            <h2 className="mt-3 text-[34px] font-semibold tracking-[-1px] text-white lg:text-[42px]">
              {CAT_LABELS.theQuestionsLead} <span className={ACCENT}>{CAT_LABELS.ctosAskAccent}</span>
            </h2>
          </div>
          <CatalogueFaq items={h.faqs} />
        </div>
      </section>
    </main>
  )
}

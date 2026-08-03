import Link from 'next/link'

import { LeadFormSection, type LeadFormSectionProps } from '@/components/lead-form/section'
import { cn } from '@/components/ui/_utils/cn'
import type { HubQuote, HubStory } from '@/data/services'
import { SERVICES_HUB } from '@/data/services'
import type { CatalogueContent, CatalogueItem, CatalogueSection, CatalogueStatement } from '@/lib/catalogue/content'
import { AlternativeSection } from './alternative'
import { CatalogueFaqPanel } from './faq-panel'
import { OpsSlideshow } from './ops-slideshow'
import { ACCENT, BAND_1280, BODY, Chevron, Eyebrow, GLYPH, LimeCheck } from './shared'

// Drives BOTH /services/[slug] and /technology/[slug] (Decision D1: keep this
// approved design, fed by Sanity content). Section HEADINGS + body come from the
// Sanity doc via mapServiceToContent / mapTechnologyToContent (real per-page
// copy, zero content loss). The hero furniture, "trusted by" marquee, ops
// slideshow, CTA, customer-stories and testimonial marquee are FIXED sitewide
// furniture; the "no upfront fees" bullets are fixed brand copy. Header/footer +
// the closing "Ready to hire" CTA are sitewide chrome. Contextual imagery below
// is fixed design furniture (Sanity image swap is a later pass).

export interface CatalogueDetailProps {
  content: CatalogueContent
  hireHref?: string
  /**
   * Quick hiring form, rendered at the foot of the page. Optional so a caller
   * that has no sensible source path simply does not get one, rather than
   * reporting a lead as coming from somewhere it did not.
   */
  leadForm?: LeadFormSectionProps
}

// Fixed furniture copy + serif-italic accent phrases (verbatim from the reference).
const DC = {
  hire: 'Hire',
  trusted: ['TRUSTED BY 300+', 'ENGINEERING TEAMS'],
  techEyebrow: 'Technology coverage',
  techLead: 'From your front end to your back end,',
  techAccent: "we've got your stack handled.",
  frequentlyPlaced: 'Frequently placed for',
  opsEyebrow: 'Fully supported',
  opsLead: 'We handle the rest',
  opsAccent: 'so your engineers can focus on building.',
  noFeeEyebrow: 'In-house, without the friction',
  noFeeLead: 'No upfront fees.',
  noFeeAccent: 'No lock-in contracts.',
  customersEyebrow: 'Proof, not promises',
  customersLead: 'Hear from our',
  customersAccent: 'customers',
  diffEyebrow: 'In their words',
  diffLead: 'What the difference',
  diffAccent: 'feels like',
} as const

// Fixed "no upfront fees" bullets — brand furniture, identical across pages by
// design (the section header is fixed too). Not per-page Sanity content.
const NO_FEE_BULLETS = [
  'No placement or upfront fees',
  'Rolling 30-day contract, cancel anytime',
  'One monthly rate, everything included',
] as const

// Fixed contextual imagery for this template. Every path is a real committed file
// under /public. Centralised so a later Sanity swap is a one-spot change.
const IMG = {
  hero: { src: '/design/services/hero.avif', alt: 'Software engineer working at a dual-monitor dev workspace' },
  ourService: { src: '/design/home/media/coding-interview.jpg', alt: 'Two engineers pair-programming together' },
  depthA: { src: '/design/services/candid-1.png', alt: 'Engineer reviewing code on screen' },
  depthB: { src: '/design/services/candid-2.avif', alt: 'Development team collaborating in the office' },
  why: { src: '/location/latam/team.jpg', alt: 'Long-tenure engineering team at work' },
} as const

const OPS_SLIDES = [
  { caption: 'Performance reviews', src: '/how-it-works/stage2-coding.png', alt: 'Engineer in a performance review session' },
  { caption: 'Payroll & compliance', src: '/design/services/candid-3.avif', alt: 'Team member handling payroll and compliance' },
  { caption: 'Equipment', src: '/design/services/hero.avif', alt: 'Dual-monitor engineering workstation and equipment' },
  { caption: 'Workspace', src: '/location/eastern-europe/team.jpg', alt: 'Engineering team in a modern office workspace' },
]

const STORY_IMG = [
  { src: '/location/latam/hub-buenosaires.jpg', alt: 'Client engineering team in the office' },
  { src: '/location/philippines/team.jpg', alt: 'Product team collaborating' },
  { src: '/design/services/ui-card.webp', alt: 'Product interface built by the team' },
]

const LOGOS = [
  { name: 'Virgin Experience Days', src: '/design/home/logos/virgin.png', h: 26, invert: true },
  { name: 'Salmon', src: '/design/home/logos/salmon.png', h: 22, invert: true },
  { name: 'Hotelplan', src: '/design/home/logos/hotelplan.png', h: 20, invert: true },
  { name: 'Willo', src: '/design/home/logos/willo.png', h: 22, invert: true },
  { name: 'Travelex', src: '/design/home/logos/travelex.png', h: 22, invert: false },
  { name: 'Tidal', src: '/design/home/logos/tidal.png', h: 24, invert: true },
  { name: 'Scorpion', src: '/design/home/logos/scorpion.png', h: 22, invert: true },
]

// Image frame: renders a real committed image (object-cover) when `src` is given,
// otherwise the striped dark placeholder. Overlay children render on top.
function Placeholder({ className, children, src, alt }: { className?: string; children?: React.ReactNode; src?: string; alt?: string }) {
  return (
    <span className={cn('relative block overflow-hidden bg-[#1B2A45]', className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt ?? ''} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
      ) : (
        <span aria-hidden="true" className="absolute inset-0 opacity-40" style={{ backgroundImage: 'repeating-linear-gradient(135deg, #22314D 0 2px, transparent 2px 12px)' }} />
      )}
      {children}
    </span>
  )
}

// Depth grid: lime-check text card. Header optional (some Sanity items are
// description-only); renders whatever is present.
function DepthCard({ item }: { item: CatalogueItem }) {
  return (
    <li className="flex min-h-[224px] flex-col gap-[11px] rounded-[20px] border border-[#22314D] bg-[#101B30] p-6">
      <LimeCheck />
      {item.header ? <span className="text-[18px] font-semibold leading-[1.25] text-white">{item.header}</span> : null}
      {item.desc ? <span className={cn('text-[14px] leading-[21px]', BODY)}>{item.desc}</span> : null}
    </li>
  )
}

function DepthTile({ img }: { img: { src: string; alt: string } }) {
  return (
    <li className="contents">
      <Placeholder src={img.src} alt={img.alt} className="min-h-[224px] rounded-[20px] border border-[#22314D]" />
    </li>
  )
}

// Lime-check bullet list, reused by hero / our-service / why sections.
function CheckList({ items, className }: { items: string[]; className?: string }) {
  if (items.length === 0) return null
  return (
    <ul className={cn('flex flex-col gap-4', className)}>
      {items.map((b) => (
        <li key={b} className="flex items-start gap-3 text-[16px] text-white">
          <LimeCheck className="mt-0.5" />
          {b}
        </li>
      ))}
    </ul>
  )
}

// Statement band — renders a Sanity `headerOnly` fold (eyebrow + statement H2) so
// no fold content is dropped (zero-loss).
function StatementBand({ statement }: { statement: CatalogueStatement }) {
  return (
    <section className={cn(BAND_1280, 'py-[40px]')}>
      <div className="rounded-[28px] border border-[#22314D] bg-[radial-gradient(120%_140%_at_0%_0%,#101B30_0%,#0B1424_100%)] px-[28px] py-[40px] lg:px-[56px] lg:py-[56px]">
        <div className="max-w-[920px]">
          <span aria-hidden="true" className="mb-[24px] block h-[3px] w-[56px] rounded-full bg-brand-primary" />
          {statement.eyebrow ? <Eyebrow className="mb-3">{statement.eyebrow}</Eyebrow> : null}
          <h2 className="text-[28px] font-semibold leading-[1.15] tracking-[-1px] text-white lg:text-[40px] lg:leading-[46px]">
            {statement.heading}
          </h2>
        </div>
      </div>
    </section>
  )
}

// Content section (our-service / why): eyebrow + H2 + paragraph + bullets.
// Headings are the real Sanity per-page copy.
function ContentBlock({ section }: { section: CatalogueSection }) {
  return (
    <div>
      {section.eyebrow ? <Eyebrow>{section.eyebrow}</Eyebrow> : null}
      {section.heading ? (
        <h2 className="mt-3 text-[30px] font-semibold leading-[1.1] tracking-[-1.2px] text-white lg:text-[44px] lg:leading-[52px]">
          {section.heading}
        </h2>
      ) : null}
      {section.paragraph ? <p className={cn('mt-5 text-[18px] leading-[28px] whitespace-pre-line', BODY)}>{section.paragraph}</p> : null}
      <CheckList items={section.bullets} className="mt-6" />
    </div>
  )
}

export function CatalogueDetail({ content, hireHref = '/book-a-call', leadForm }: CatalogueDetailProps) {
  const { name, eyebrow, heroSubhead, heroBullets, skillBadges, ourService, capabilities, why, statements, techCoverage, faqs, isTechnology } = content
  const stories = SERVICES_HUB.stories as HubStory[]
  const quotes = SERVICES_HUB.quotes as HubQuote[]
  const qtrack = [...quotes, ...quotes, ...quotes]
  const ltrack = [...LOGOS, ...LOGOS]
  const items = capabilities.items
  // Statements: on service pages the first sits after the depth grid and the
  // rest after "why" (their live document order); on technology pages all sit
  // after "why".
  const depthStatement = !isTechnology ? statements[0] : undefined
  const trailingStatements = isTechnology ? statements : statements.slice(1)

  return (
    // overflow-x-CLIP, not hidden: `hidden` makes this element a scroll
    // container, which silently kills the sticky FAQ intro column inside it.
    <main id="main" className="overflow-x-clip">
      {/* 1. HERO */}
      <section className={cn(BAND_1280, 'grid grid-cols-1 items-center gap-12 pt-[64px] lg:grid-cols-[1fr_0.9fr] lg:pt-[88px]')}>
        <div>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="mt-5 text-[38px] font-semibold leading-[42px] tracking-[-1.5px] text-white lg:text-[64px] lg:leading-[68px] lg:tracking-[-2.4px]">{name}</h1>
          {heroSubhead ? <p className={cn('mt-5 max-w-[480px] text-[15px] leading-[24px] lg:text-[19px] lg:leading-[28.5px]', BODY)}>{heroSubhead}</p> : null}
          <CheckList items={heroBullets} className="mt-6 max-w-[480px]" />
          <a href={hireHref} className="sf sf-p mt-8 inline-flex w-fit items-center gap-2.5 rounded-pill py-[10px] pl-[10px] pr-6 text-[15px] font-bold">
            <span aria-hidden="true" className="ic flex h-[32px] w-[32px] items-center justify-center text-[14px]">{GLYPH.arrow}</span>
            <span className="c">{DC.hire} {name}</span>
          </a>
        </div>
        <Placeholder src={IMG.hero.src} alt={IMG.hero.alt} className="h-[400px] rounded-[24px]">
          <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#070D18]/85 via-transparent to-transparent" />
          {skillBadges.length > 0 ? (
            <span className="absolute inset-x-6 bottom-6 flex flex-wrap gap-2.5">
              {skillBadges.map((b) => (
                <span key={b} className="inline-flex items-center gap-2 rounded-pill border border-[#32435F] bg-[#070D18]/[0.82] px-[15px] py-[9px] text-[13px] font-semibold text-white backdrop-blur-sm">
                  <span aria-hidden="true" className="h-[7px] w-[7px] shrink-0 rounded-full bg-brand-primary" />
                  {b}
                </span>
              ))}
            </span>
          ) : null}
        </Placeholder>
      </section>

      {/* 2. TRUSTED BY marquee */}
      <section className="mt-[64px] overflow-hidden border-y border-[#16203A] py-[36px]">
        <div className="flex items-center gap-8 px-6 lg:px-16">
          <span className="shrink-0 text-[12px] font-bold uppercase leading-[18px] tracking-[0.9px] text-[#7F8CA0]">
            {DC.trusted.map((line) => <span key={line} className="block whitespace-nowrap">{line}</span>)}
          </span>
          <div aria-hidden="true" className="flex flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
            <ul className="flex shrink-0 animate-marquee items-center gap-[56px] pr-[56px] motion-reduce:animate-none">
              {ltrack.map((l, i) => (
                <li key={`${l.name}-${i}`} className="flex shrink-0 items-center">
                  <img src={l.src} alt={l.name} style={{ height: l.h, opacity: 0.85 }} className={cn('w-auto', l.invert && '[filter:brightness(0)_invert(1)]')} loading="lazy" />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 3. OUR SERVICE */}
      <section className={cn(BAND_1280, 'grid grid-cols-1 items-center gap-12 py-[72px] lg:grid-cols-[360px_1fr]')}>
        <Placeholder src={IMG.ourService.src} alt={IMG.ourService.alt} className="h-[360px] rounded-[20px] border border-[#22314D]" />
        <ContentBlock section={ourService} />
      </section>

      {/* 4. DEPTH / CAPABILITIES - 4-col, 6 cards + 2 image tiles */}
      <section className={cn(BAND_1280, 'py-[40px] text-center')}>
        {capabilities.eyebrow ? <Eyebrow className="text-center">{capabilities.eyebrow}</Eyebrow> : null}
        {capabilities.heading ? (
          <h2 className="mx-auto mt-4 max-w-[820px] text-[32px] font-semibold leading-[1.1] tracking-[-1.2px] text-white lg:text-[42px] lg:leading-[50px]">
            {capabilities.heading}
          </h2>
        ) : null}
        <ul className="mt-10 grid grid-cols-1 gap-5 text-left sm:grid-cols-2 lg:grid-cols-4">
          {items[0] ? <DepthCard item={items[0]} /> : null}
          {items[1] ? <DepthCard item={items[1]} /> : null}
          <DepthTile img={IMG.depthA} />
          {items[2] ? <DepthCard item={items[2]} /> : null}
          <DepthTile img={IMG.depthB} />
          {items[3] ? <DepthCard item={items[3]} /> : null}
          {items[4] ? <DepthCard item={items[4]} /> : null}
          {items[5] ? <DepthCard item={items[5]} /> : null}
        </ul>
      </section>

      {/* 4b. Statement band (service: fold after the item list) */}
      {depthStatement ? <StatementBand statement={depthStatement} /> : null}

      {/* 4c. THE ALTERNATIVE - technology detail only */}
      {isTechnology ? <AlternativeSection /> : null}

      {/* 5. TECHNOLOGY COVERAGE - service pages only */}
      {!isTechnology && techCoverage.length > 0 ? (
        <section className={cn(BAND_1280, 'py-[40px]')}>
          <Eyebrow>{DC.techEyebrow}</Eyebrow>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
            <h2 className="max-w-[720px] text-[32px] font-semibold leading-[1.1] tracking-[-1.2px] text-white lg:text-[42px] lg:leading-[50px]">
              {DC.techLead} <span className={ACCENT}>{DC.techAccent}</span>
            </h2>
            <span className="rounded-pill border border-[#22314D] px-3 py-1 text-[12px] text-[#7F8CA0]">{DC.frequentlyPlaced} {name}</span>
          </div>
          <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {techCoverage.map((t) => (
              <li key={t.slug} className="contents">
                <Link href={`/technology/${t.slug}`} className="group flex min-h-[92px] items-center gap-4 rounded-[16px] border border-[#22314D] bg-[#101B30] px-5 py-4 transition-colors hover:bg-[#1B2A45]">
                  {t.logo ? (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.04] p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={t.logo} alt={`${t.name} logo`} className="h-full w-full object-contain" loading="lazy" />
                    </span>
                  ) : (
                    <Placeholder className="h-12 w-12 shrink-0 rounded-[10px]" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block text-[17px] font-semibold text-white">{t.name}</span>
                    {t.sub ? <span className="block truncate text-[13px] text-[#7F8CA0]">{t.sub}</span> : null}
                  </span>
                  <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#22314D] text-brand-primary transition-colors group-hover:border-brand-primary">
                    <Chevron className="h-3.5 w-3.5" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* 6. WHY US */}
      <section className={cn(BAND_1280, 'grid grid-cols-1 items-center gap-12 py-[72px] lg:grid-cols-[1fr_380px]')}>
        <ContentBlock section={why} />
        <Placeholder src={IMG.why.src} alt={IMG.why.alt} className="h-[380px] rounded-[20px] border border-[#22314D]" />
      </section>

      {/* 6b. Trailing statement band(s) */}
      {trailingStatements.map((s) => (
        <StatementBand key={s.heading} statement={s} />
      ))}

      {/* 7. OPS SLIDESHOW */}
      <section className="py-[40px]">
        <OpsSlideshow slides={OPS_SLIDES} eyebrow={DC.opsEyebrow} lead={DC.opsLead} accent={DC.opsAccent} />
      </section>

      {/* 8. NO UPFRONT FEES */}
      <section className={cn(BAND_1280, 'grid grid-cols-1 items-center gap-12 py-[72px] lg:grid-cols-[380px_1fr]')}>
        <Placeholder src="/how-it-works/stage3-onboard.png" alt="Onboarding and agreement paperwork" className="h-[360px] rounded-[20px] border border-[#22314D]" />
        <div>
          <Eyebrow>{DC.noFeeEyebrow}</Eyebrow>
          <h2 className="mt-3 text-[34px] font-semibold leading-[1.1] tracking-[-1.2px] text-white lg:text-[46px] lg:leading-[54px]">
            {DC.noFeeLead} <span className={ACCENT}>{DC.noFeeAccent}</span>
          </h2>
          <CheckList items={[...NO_FEE_BULLETS]} className="mt-6" />
        </div>
      </section>

      {/* 8b. FAQs (per-page override else shared block; matches live) */}
      {leadForm && <LeadFormSection {...leadForm} />}
      {faqs.length > 0 ? <CatalogueFaqPanel items={faqs} /> : null}

      {/* 9. REMOVED - "Tell us who you need. We'll handle the rest." CTA band.
          Jake's call, 3 Aug. The quick hiring form directly above the FAQ does
          the same job and does it better: it captures the requirement instead of
          just asking for a call. Two competing CTAs in the same scroll region
          split the intent rather than doubling it, and this one also carried an
          empty placeholder tile where an image was never supplied. */}

      {/* 10. CUSTOMERS */}
      <section className={cn(BAND_1280, 'py-[72px]')}>
        <Eyebrow>{DC.customersEyebrow}</Eyebrow>
        <h2 className="mt-3 text-[34px] font-semibold tracking-[-1px] text-white lg:text-[42px]">
          {DC.customersLead} <span className={ACCENT}>{DC.customersAccent}</span>
        </h2>
        <ul className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {stories.map((s, i) => (
            <li key={s.title}>
              <Link href="/customer-stories" className="group flex h-full flex-col overflow-hidden rounded-[20px] border border-[#22314D] bg-[#101B30] transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-brand-primary/50">
                <Placeholder src={STORY_IMG[i]?.src} alt={STORY_IMG[i]?.alt} className="aspect-[16/10] w-full">
                  <span className="absolute inset-0 bg-gradient-to-t from-[#060F1E]/80 to-transparent" />
                  <span className="absolute bottom-4 left-4 rounded-md bg-[#0A1628]/80 px-2.5 py-1 text-[12px] font-semibold text-white">{s.logo}</span>
                </Placeholder>
                <span className="flex flex-1 flex-col p-6">
                  <span className="text-[18px] font-semibold leading-snug text-white">{s.title}</span>
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-[14px] font-semibold text-brand-primary">
                    {GLYPH.readMore}
                    <Chevron className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* 11. DIFFERENCE - testimonial marquee */}
      <section className="overflow-hidden py-[40px]">
        <div className={cn(BAND_1280, 'mb-8')}>
          <Eyebrow>{DC.diffEyebrow}</Eyebrow>
          <h2 className="mt-3 text-[34px] font-semibold tracking-[-1px] text-white lg:text-[42px]">
            {DC.diffLead} <span className={ACCENT}>{DC.diffAccent}</span>
          </h2>
        </div>
        <div aria-hidden="true" className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
          <ul className="flex shrink-0 animate-marquee items-stretch gap-5 pr-5 motion-reduce:animate-none">
            {qtrack.map((q, i) => (
              <li key={`${q.name}-${i}`} className="flex w-[360px] shrink-0 flex-col rounded-[18px] border border-[#22314D] bg-[#101B30] p-6">
                <span aria-hidden="true" className={cn('text-[44px] leading-[0.5]', ACCENT)}>{GLYPH.quote}</span>
                <p className="mt-4 flex-1 text-[15px] leading-[24px] text-[#B8C2D1]">{q.text}</p>
                <span className="mt-5 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#16223A] text-[12px] font-semibold text-brand-primary">{q.initials}</span>
                  <span>
                    <span className="block text-[14px] font-semibold text-white">{q.name}</span>
                    <span className="block text-[12px] text-brand-primary">{q.role}</span>
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

    </main>
  )
}

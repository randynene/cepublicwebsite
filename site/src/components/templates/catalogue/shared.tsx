import Link from 'next/link'

import { cn } from '@/components/ui/_utils/cn'
import type { HubQuote, HubStory } from '@/data/services'

// Shared server primitives for the Services/Technology catalogue pages.
// 1440 content band with 64px gutters (hubs); dark/lime system.

export const BAND = 'mx-auto w-full max-w-[1440px] px-6 lg:px-16'
// Detail-page content band. Widened to match the homepage band (1440 / 64px
// gutters) so detail sections line up with the rest of the site.
export const BAND_1280 = 'mx-auto w-full max-w-[1440px] px-6 lg:px-16'
export const EYEBROW = 'text-[12px] font-semibold uppercase tracking-[1.68px] text-brand-primary'
export const ACCENT = 'font-serif font-normal italic text-brand-primary'
export const BODY = 'text-[#B8C2D1]'

// Display strings kept out of raw JSX to satisfy the jsx-no-literals gate.
export const CAT_LABELS = {
  readMore: 'Read more',
  gotQuestions: 'Got questions?',
  theQuestionsLead: 'The questions',
  ctosAskAccent: 'CTOs ask',
  search: 'Search',
  ourService: 'Our service',
  depth: 'Depth across the stack',
  firepowerLead: 'who bring full-stack',
  firepowerAccent: 'firepower',
  techCoverage: 'Technology coverage',
  frequentlyPlaced: 'Frequently placed for',
  whyCe: 'Why Cloud Employee',
  fullySupported: 'Fully supported',
  inHouse: 'In-house, without the friction',
  twoVetted: 'Two vetted',
  withinDays: 'in front of you within 7 working days. No job boards, no CVs, no time wasted.',
  hire: 'Hire',
  faqsLead: 'FAQs -',
  faqsAccent: 'about',
} as const
export const GLYPH = { arrow: '→', check: '✓', readMore: 'Read more', quote: '“' } as const

export function Eyebrow({ children, className }: { children: string; className?: string }) {
  return <p className={cn(EYEBROW, className)}>{children}</p>
}

// 22px lime check (design: #D4FF3C bg, #060F1E glyph).
export function LimeCheck({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-brand-primary text-[12px] text-[#060F1E]', className)}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </span>
  )
}

export function Chevron({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

// Section heading: eyebrow + H2 with serif-italic lime accent phrase.
export function SectionHeading({
  eyebrow,
  lead,
  accent,
  sub,
  center,
}: {
  eyebrow?: string
  lead: string
  accent: string
  sub?: string
  center?: boolean
}) {
  return (
    <div className={cn(center && 'text-center')}>
      {eyebrow ? <Eyebrow className={cn(center && 'text-center')}>{eyebrow}</Eyebrow> : null}
      <h2 className={cn('font-semibold leading-[1.05] tracking-[-1.4px] text-white', eyebrow ? 'mt-3' : '', 'text-[34px] lg:text-[46px] lg:leading-[54px]')}>
        {lead} <span className={ACCENT}>{accent}</span>
      </h2>
      {sub ? <p className={cn('mt-4 max-w-[560px] text-[16px]', BODY, center && 'mx-auto')}>{sub}</p> : null}
    </div>
  )
}

// ── Shared "customer stories" row ───────────────────────────────────────────
export function HubStories({ eyebrow, heading, stories }: { eyebrow: string; heading: string; stories: HubStory[] }) {
  return (
    <section className={cn(BAND, 'py-[80px]')}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-3 text-[34px] font-semibold tracking-[-1px] text-white lg:text-[42px]">{heading}</h2>
      <ul className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
        {stories.map((s) => (
          <li key={s.title}>
            <Link
              href="/customer-stories"
              className="group flex h-full flex-col overflow-hidden rounded-[20px] border border-[#22314D] bg-[#101B30] transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-brand-primary/50"
            >
              <span aria-hidden="true" className="relative block h-[180px] w-full overflow-hidden bg-[#1B2A45]">
                <span className="absolute inset-0 bg-gradient-to-t from-[#060F1E]/80 to-transparent" />
                <span className="absolute bottom-4 left-4 rounded-md bg-[#0A1628]/80 px-2.5 py-1 text-[12px] font-semibold text-white">
                  {s.logo}
                </span>
              </span>
              <span className="flex flex-1 flex-col p-6">
                <span className="text-[18px] font-semibold leading-snug text-white">{s.title}</span>
                <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-[14px] font-semibold text-brand-primary">
                  {CAT_LABELS.readMore}
                  <Chevron className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

// ── Shared quote marquee ────────────────────────────────────────────────────
export function HubQuotes({ eyebrow, lead, accent, quotes }: { eyebrow: string; lead: string; accent: string; quotes: HubQuote[] }) {
  const track = [...quotes, ...quotes, ...quotes]
  return (
    <section className="overflow-hidden py-[40px]">
      <div className={cn(BAND, 'mb-8')}>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="mt-3 text-[34px] font-semibold tracking-[-1px] text-white lg:text-[42px]">
          {lead} <span className={ACCENT}>{accent}</span>
        </h2>
      </div>
      <div aria-hidden="true" className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
        <ul className="flex shrink-0 animate-marquee items-stretch gap-5 pr-5 motion-reduce:animate-none">
          {track.map((q, i) => (
            <li key={`${q.name}-${i}`} className="flex w-[380px] shrink-0 flex-col rounded-[18px] border border-[#22314D] bg-[#101B30] p-6">
              <p className="flex-1 text-[15px] leading-[24px] text-[#B8C2D1]">{q.text}</p>
              <span className="mt-5 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#16223A] text-[12px] font-semibold text-brand-primary">
                  {q.initials}
                </span>
                <span>
                  <span className="block text-[14px] font-semibold text-white">{q.name}</span>
                  <span className="block text-[12px] text-[#7F8CA0]">{q.role}</span>
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

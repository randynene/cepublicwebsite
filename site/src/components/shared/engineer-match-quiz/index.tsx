import { ChatLink } from '@/components/shared/chat-link'
import { MegaMenuPillLabel } from '@/components/ui/mega-menu-pill-label'
import { cn } from '@/components/ui/_utils/cn'
import { Reveal } from '@/components/motion/reveal'
import type { Locale } from '@/lib/locale-path'
import { toInternalHref } from '@/lib/url'

// Engineer Match Quiz — SHARED component (How It Works + future Home adoption).
//
// STATUS: STATIC PREVIEW STUB. This renders the reference "Ready to find your
// engineer?" matcher card in its step-1 resting state (role select shown, the
// match panel locked "Unlocks at step 4"). The interactive multi-step flow
// (steps advance/back, single-select role/team, skills add/remove, preview
// unlock at step 4) is deferred to a follow-up session — this file is the
// standalone home so that upgrade lands here with no template rewrite.
//
// The card is a demo, but every CTA leaving it is real (decision D2): the
// "Next" pill and the two talk CTAs below the card all go somewhere.
//
// Prop-driven so Home can pass its own copy later. All strings arrive via
// props (no JSX literals here beyond the two decorative glyphs).

const GLYPH_ARROW = '→'
const GLYPH_CHECK = '✓'

export interface MatchQuizContent {
  steps: readonly string[]
  question: string
  questionSub: string
  roles: readonly string[]
  bottomPills: readonly string[]
  nextLabel: string
  matching: {
    label: string
    unlocks: string
    tags: readonly string[]
    note: string
    stats: readonly { value: string; label: string }[]
  }
  talkPrompt: string
  talkCtas: readonly { label: string; href: string }[]
  bookHref: string
}

const CARD = 'rounded-[20px] border border-[#22314D] bg-[#101B30]'
const MUTED = 'text-[#7F8CA0]'
const TALK_PILL =
  'rounded-full bg-[#16233B] px-[16px] py-[8px] text-[13px] font-semibold text-white transition-colors hover:bg-[#1E2E4A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'

export function EngineerMatchQuiz({
  content,
  locale = 'en-US',
}: {
  content: MatchQuizContent
  locale?: Locale
}) {
  return (
    <>
      <Reveal className={cn(CARD, 'grid gap-[28px] p-[28px] lg:grid-cols-[1.5fr_1fr] lg:p-[36px]')}>
        {/* Left column — step rail + role select */}
        <div>
          <div className="flex flex-wrap gap-x-[36px] gap-y-[12px]">
            {content.steps.map((step, i) => (
              <span key={step} className="flex items-center gap-[8px] text-[14px] font-semibold">
                <span
                  className={cn(
                    'flex h-[24px] w-[24px] items-center justify-center rounded-full text-[11px] font-bold',
                    i === 0 ? 'bg-brand-primary text-[#060F1E]' : 'bg-[#16233B] text-text-secondary',
                  )}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className={cn(i === 0 ? 'text-white' : 'text-text-secondary')}>{step}</span>
              </span>
            ))}
          </div>

          <h3 className="mt-[28px] text-[24px] font-semibold leading-[30px] tracking-[-0.5px] text-white lg:text-[27px]">
            {content.question}
          </h3>
          <p className={cn('mt-[6px] text-[13px]', MUTED)}>{content.questionSub}</p>

          <div className="mt-[20px] grid gap-[14px] sm:grid-cols-2">
            {content.roles.map((role, i) => (
              <div
                key={role}
                className={cn(
                  'flex items-center gap-[12px] rounded-[12px] border bg-[#16233B] px-[16px] py-[14px]',
                  i === 0 ? 'border-brand-primary' : 'border-[#22314D]',
                )}
              >
                <span
                  aria-hidden
                  className="flex h-[28px] w-[28px] items-center justify-center rounded-[8px] bg-[#0A1120] text-[12px] text-brand-primary"
                >
                  {GLYPH_ARROW}
                </span>
                <span className="text-[15px] font-semibold text-white">{role}</span>
              </div>
            ))}
          </div>

          <div className="mt-[24px] flex flex-wrap items-center justify-between gap-[16px]">
            <div className="flex flex-wrap gap-x-[16px] gap-y-[8px]">
              {content.bottomPills.map((pill) => (
                <span
                  key={pill}
                  className="flex items-center gap-[6px] text-[12px] font-normal text-text-secondary"
                >
                  <span aria-hidden className="text-brand-primary">
                    {GLYPH_CHECK}
                  </span>
                  {pill}
                </span>
              ))}
            </div>
            <MegaMenuPillLabel
              as="a"
              href={toInternalHref(content.bookHref, locale).href}
              variant="pill-green"
              size="cta"
              leadingArrow
              leadingGlyph={GLYPH_ARROW}
              label={content.nextLabel}
            />
          </div>
        </div>

        {/* Right column — locked match panel */}
        <div className="rounded-[16px] border border-[#22314D] bg-[#0A1120] p-[24px]">
          <div className="flex items-center gap-[8px]">
            <span aria-hidden className="h-[7px] w-[7px] rounded-full bg-brand-primary" />
            <span className="text-[12px] font-bold uppercase tracking-[0.9px] text-white">
              {content.matching.label}
            </span>
          </div>
          {/* Decorative progress fills — scale-x reveal, box keeps final width
           * so nothing here causes CLS. */}
          <Reveal variant="scale-x" className="mt-[40px] h-[10px] w-[70%] rounded-full bg-[#1B2942]" />
          <Reveal
            variant="scale-x"
            delay={150}
            className="mt-[10px] h-[10px] w-[45%] rounded-full bg-[#1B2942]"
          />
          <p className={cn('mt-[14px] text-[13px]', MUTED)}>{content.matching.unlocks}</p>
          <div className="mt-[20px] flex flex-wrap gap-[8px]">
            {content.matching.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[#16233B] px-[10px] py-[5px] text-[12px] font-semibold text-text-secondary"
              >
                {tag}
              </span>
            ))}
          </div>
          <p className={cn('mt-[16px] text-[13px] leading-[20px]', MUTED)}>{content.matching.note}</p>
          <div className="mt-[20px] flex gap-[28px]">
            {content.matching.stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-[22px] font-extrabold leading-none text-brand-primary">
                  {stat.value}
                </div>
                <div className={cn('mt-[6px] text-[12px]', MUTED)}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      <div className="mt-[24px] flex flex-wrap items-center justify-center gap-[14px]">
        <span className={cn('text-[14px]', MUTED)}>{content.talkPrompt}</span>
        {content.talkCtas.map((cta) => (
          <ChatLink key={cta.label} href={cta.href} locale={locale} className={TALK_PILL}>
            {cta.label}
          </ChatLink>
        ))}
      </div>
    </>
  )
}

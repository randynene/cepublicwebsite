import { ChatPill } from '@/components/shared/chat-link'
import { StoryCard } from '@/components/social-proof/story-card'
import { cn } from '@/components/ui/_utils/cn'
import { CHAT_HREF } from '@/lib/chat'
import { buildLocalePath, type Locale } from '@/lib/locale'
import { fetchCustomerStoriesData } from '@/lib/sanity/queries/social-proof'

import { POST_BOOKING as COPY } from './content'

// CE-41: what a visitor sees AFTER booking a call.
//
// The page used to re-embed the Calendly widget under "your call has been
// booked", so the first thing a converted visitor saw was an invitation to
// convert again. This replaces that dead end with three onward paths, ordered by
// how useful they are to someone who has just booked and is now waiting:
//
//   1. Ask Clara - the only one that answers a question TODAY.
//   2. Case studies - auto-pulled, newest first, so the block stays current with
//      no upkeep. Seb curates nothing here.
//
// A "latest articles" row was built here too and removed on Jake's call (Aug
// 2026): two onward content blocks under a confirmation message is one more than
// the moment warrants, and the case studies are the ones that keep selling.
//
// Everything degrades honestly: each section renders only if it has content, so
// an empty dataset produces no empty heading (the exact bug this page had - an
// orphaned "Discover our latest articles:" with nothing beneath it).

const BAND = 'mx-auto w-full max-w-[1440px] px-[22px] sm:px-[32px] lg:px-[64px]'
const CARD = 'rounded-[20px] border border-[#22314D] bg-[#101B30]'
const SECTION_TITLE =
  'text-[24px] font-semibold leading-[32px] tracking-[-0.5px] text-white lg:text-[30px] lg:leading-[38px]'
const ACCENT = 'font-serif font-normal italic text-brand-primary'
const EYEBROW = 'text-[11px] font-semibold uppercase tracking-[1.6px] text-[#7F8CA0]'
const QUIET_LINK =
  'text-[14px] font-medium text-brand-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#070D18]'

const STORY_COUNT = 3

export async function PostBookingNext({ locale = 'en-US' }: { locale?: Locale }) {
  const stories = await fetchCustomerStoriesData().catch(() => null)

  // featured first, then the grid, so the strongest stories lead.
  const storyCards = [...(stories?.featured ?? []), ...(stories?.grid ?? [])].slice(0, STORY_COUNT)

  return (
    <section className="bg-[#070D18] pb-[96px] pt-[24px]">
      <div className={cn(BAND, 'flex flex-col gap-[56px]')}>
        {/* 1. Ask Clara.
            fallbackHref is overridden deliberately: ChatPill defaults to
            /book-a-call, which on THIS page would send someone who just booked
            straight back to the booking form. /ask is the honest destination
            when the widget cannot open. */}
        <div className={cn(CARD, 'flex flex-col gap-[20px] p-[32px] lg:flex-row lg:items-center lg:justify-between lg:p-[40px]')}>
          <div className="max-w-[620px]">
            <p className={EYEBROW}>{COPY.chat.eyebrow}</p>
            <h2 className={cn('mt-[12px]', SECTION_TITLE)}>
              {COPY.chat.titleLead} <span className={ACCENT}>{COPY.chat.titleAccent}</span>
            </h2>
            <p className="mt-[14px] text-[15px] leading-[24px] text-text-secondary">
              {COPY.chat.body}
            </p>
          </div>
          <ChatPill
            href={CHAT_HREF}
            fallbackHref="/ask"
            locale={locale}
            label={COPY.chat.cta}
            leadingArrow
            leadingGlyph={COPY.chat.ctaGlyph}
            className="!h-[48px] !py-0 !pr-[24px] !text-[15px]"
          />
        </div>

        {/* 2. Case studies. */}
        {storyCards.length > 0 ? (
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-[16px]">
              <h2 className={SECTION_TITLE}>{COPY.stories.title}</h2>
              <a href={buildLocalePath('/customer-stories', locale)} className={QUIET_LINK}>
                {COPY.stories.cta}
              </a>
            </div>
            <div className="mt-[28px] grid grid-cols-1 gap-[20px] md:grid-cols-2 lg:grid-cols-3">
              {storyCards.map((story) => (
                <StoryCard key={story._id} story={story} locale={locale} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}

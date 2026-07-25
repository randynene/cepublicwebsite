import { buildLocalePath, type Locale } from '@/lib/locale'
import { UI_STRINGS } from '@/lib/ui-strings'

// The hero search box. Spec §4.
//
// PHASE 1 SHIPS THE MARKUP, NOT THE FEATURE. There is no search route yet, and the
// spec is explicit that the 7 pages ship without one.
//
// But it is a real <form method="get"> pointing at the path that WILL serve results,
// because that is the difference between an upgrade and a rewrite: today it performs a
// full page navigation, and when Phase 2 puts a server-side query behind the same URL
// this component does not change at all. It also means the box is never a lie - it is a
// real form that really submits, it simply cannot narrow the results yet.
//
// 48px TALL, MATCHING THE HEADER'S SCHEDULE-A-CALL BUTTON. It was previously `h-12`,
// which reads as 48px and is not: this project sets `--spacing: 0.5rem`, so Tailwind's
// scale is 8px-based and `h-12` rendered at 96px - exactly double the header CTA, and
// the reason the box looked so heavy. Written in px so the number in the code is the
// number on the screen.
const CONTROL_H = 'h-[48px]'

export function BlogSearchForm({
  locale = 'en-US',
  /** Scope the query to a topic hub, so search on /hiring-tips searches hiring tips. */
  action = '/blog',
  defaultValue,
}: {
  locale?: Locale
  action?: string
  defaultValue?: string
}) {
  return (
    <form
      method="get"
      action={buildLocalePath(action, locale)}
      role="search"
      className="mx-auto flex w-full max-w-[520px] items-center gap-3"
    >
      <label htmlFor="blog-search" className="sr-only">
        {UI_STRINGS['blog.searchLabel']}
      </label>
      <input
        id="blog-search"
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={UI_STRINGS['blog.searchPlaceholder']}
        className={`${CONTROL_H} min-w-0 flex-1 rounded-pill border border-[#22314D] bg-[#101B30] px-[20px] text-[14px] text-text-default placeholder:text-text-default/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
      />

      {/* The same pill as the header's Schedule-a-Call CTA: dark circle glyph on the
          left, bold 13px label, lime fill with dark text. Lime ALWAYS carries dark text
          (spec §0). SWEEP-CTA (Jul 2026): primary sweep-fill (`sf sf-p`). */}
      <button
        type="submit"
        className={`${CONTROL_H} sf sf-p inline-flex shrink-0 items-center gap-1.5 rounded-pill py-[4px] pl-[4px] pr-[18px] text-[13px] font-bold leading-none tracking-[-0.08px] shadow-[0_2px_8px_-3px_rgba(0,0,0,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#070D18]`}
      >
        <span aria-hidden="true" className="ic h-[40px] w-[40px] text-[13px]">
          {UI_STRINGS['blog.searchArrow']}
        </span>
        {/* Collapses to an icon-only button below 640px (spec §8). */}
        <span className="c hidden pr-1 sm:inline">{UI_STRINGS['blog.searchButton']}</span>
      </button>
    </form>
  )
}

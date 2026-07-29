'use client'

import Link from 'next/link'

import { MegaMenuPillLabel } from '@/components/ui/mega-menu-pill-label'
import { buildLocalePath, type Locale } from '@/lib/locale-path'

import { ASK_LABELS, GLYPH } from './content'

// The /ask header: logo, Back to site, Schedule a Call. Three things, nothing else.
//
// No mega-nav, no announcement bar, no footer. /ask is a conversation surface, and
// the sitewide chrome gives the visitor five ways to leave it before they have said
// anything. The opt-out is wired in src/app/layout.tsx (see isAskPath).
//
// Two deliberate differences from the sitewide header:
//
//   - Schedule a Call is a <button>, not a link to /book-a-call. On this page it
//     opens the booking canvas in place, so the conversation and the brief survive
//     the booking.
//   - Back to site exists BECAUSE this header is a dead end otherwise. Stripping the
//     nav removes every route out, and leaving the logo as the only exit is not
//     discoverable enough for a page a visitor may land on cold.

export function AskHeader({
  locale,
  onSchedule,
}: {
  locale: Locale
  onSchedule: () => void
}) {
  const home = buildLocalePath('/', locale)

  return (
    <header className="flex h-[54px] shrink-0 items-center justify-between gap-[8px] border-b border-[#1a2740] px-[10px] @min-[30rem]:gap-[12px] @min-[30rem]:px-[16px] @min-[62rem]:h-[60px] @min-[62rem]:px-[24px]">
      <Link
        href={home}
        aria-label={ASK_LABELS.logoHome}
        className="inline-flex shrink-0 items-center rounded-[4px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-[2px] focus-visible:ring-offset-bg-primary"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/ce-logo.svg"
          alt=""
          aria-hidden="true"
          className="block h-[16px] w-auto @min-[30rem]:h-[19px] @min-[62rem]:h-[22px]"
        />
      </Link>

      <div className="flex shrink-0 items-center gap-[6px] @min-[30rem]:gap-[8px] @min-[62rem]:gap-[10px]">
        {/* Below 480px the three controls cannot share a line without clipping the
            CTA, so Back to site drops its label and keeps a back arrow. It stays the
            same control with the same accessible name either way.
            Fits without overflow from 360px up, which covers every phone in current
            use; below that the header scrolls horizontally by a few pixels. */}
        <MegaMenuPillLabel
          as="a"
          href={home}
          aria-label={ASK_LABELS.backToSite}
          variant="pill-outline-dark"
          size="cta"
          label={GLYPH.arrowLeft}
          className="!px-[10px] !text-[14px] @min-[30rem]:hidden"
        />
        <MegaMenuPillLabel
          as="a"
          href={home}
          variant="pill-outline-dark"
          size="cta"
          label={ASK_LABELS.backToSite}
          className="hidden !text-[13px] @min-[30rem]:inline-flex"
        />
        {/* `size="cta"` is the canonical CE pill, but its `pr-3.5` resolves to 28px
            against this project's 0.5rem spacing scalar - wider than the reference's
            18px. Trimmed here rather than in the shared primitive, which every other
            CTA on the site depends on. */}
        <MegaMenuPillLabel
          as="button"
          onClick={onSchedule}
          variant="pill-green"
          size="cta"
          leadingArrow
          leadingGlyph={GLYPH.arrow}
          label={ASK_LABELS.scheduleCall}
          className="!pr-[13px] !text-[12.5px] @min-[62rem]:!pr-[18px] @min-[62rem]:!text-[14px]"
        />
      </div>
    </header>
  )
}

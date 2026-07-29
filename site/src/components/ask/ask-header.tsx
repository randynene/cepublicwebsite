'use client'

import Link from 'next/link'

import { MegaMenuPillLabel } from '@/components/ui/mega-menu-pill-label'
import { cn } from '@/components/ui/_utils/cn'
import { buildLocalePath, type Locale } from '@/lib/locale-path'

import { ASK_LABELS, GLYPH } from './content'
import type { AskHeaderState } from '@/lib/ask/types'

// The /ask header: logo and one CTA. No mega-nav, no announcement bar, no footer.
//
// That is a locked layout decision, not a shortcut - the page is a conversation
// surface, and the sitewide chrome would give the visitor five ways to leave it
// before they have said anything. The opt-out itself is wired in
// src/app/layout.tsx (see isAskPath).
//
// The CTA is a <button>, not a link to /book-a-call: on this page Schedule a Call
// opens the booking canvas in place so the conversation survives the booking.

function ScheduleCallButton({
  label,
  emphasised,
  onSchedule,
  className,
}: {
  label: string
  emphasised: boolean
  onSchedule: () => void
  className?: string
}) {
  return (
    <MegaMenuPillLabel
      as="button"
      onClick={onSchedule}
      variant="pill-green"
      size="cta"
      leadingArrow
      leadingGlyph={GLYPH.arrow}
      label={label}
      className={cn(
        // Once the brief is strong the design puts a soft lime halo behind the
        // pill rather than changing its shape or colour.
        emphasised && 'shadow-[0_0_0_4px_rgba(212,255,60,0.14)]',
        className,
      )}
    />
  )
}

export function AskHeader({
  header,
  locale,
  onSchedule,
}: {
  header: AskHeaderState
  locale: Locale
  onSchedule: () => void
}) {
  const emphasised = header.kind === 'cta-emphasised'

  return (
    <header className="flex h-[54px] shrink-0 items-center justify-between border-b border-[#1a2740] px-4 @min-[62rem]:h-[60px] @min-[62rem]:px-6">
      <Link
        href={buildLocalePath('/', locale)}
        aria-label={ASK_LABELS.logoAlt}
        className="inline-flex items-center rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/ce-logo.svg"
          alt=""
          aria-hidden="true"
          className="block h-[19px] w-auto @min-[62rem]:h-[22px]"
        />
      </Link>

      {header.kind === 'booked' ? (
        <span className="text-[12.5px] font-medium text-text-tertiary">
          {header.text}
        </span>
      ) : (
        <>
          {/* `size="cta"` is the canonical CE pill, but its `pr-3.5` resolves to
              28px against this project's 0.5rem spacing scalar - wider than the
              reference's 18px. Trimmed here rather than in the shared primitive,
              which every other CTA on the site depends on. */}
          <ScheduleCallButton
            label={ASK_LABELS.scheduleCall}
            emphasised={emphasised}
            onSchedule={onSchedule}
            className="hidden !pr-[18px] !text-[14px] @min-[62rem]:inline-flex"
          />
          {/* The phone frame shortens the label; the control is the same one. */}
          <ScheduleCallButton
            label={ASK_LABELS.scheduleCallShort}
            emphasised={emphasised}
            onSchedule={onSchedule}
            className="!pr-[13px] !text-[12.5px] @min-[62rem]:hidden"
          />
        </>
      )}
    </header>
  )
}

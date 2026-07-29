'use client'

import { MegaMenuPillLabel } from '@/components/ui/mega-menu-pill-label'

import { ASK_LABELS, GLYPH } from '../content'
import type { Brief } from '@/lib/ask/brief'

// What the visitor can do with the brief they have built.
//
// This bar sits OUTSIDE the brief's scroll area, pinned to the bottom of the
// canvas. The brief is expected to grow long - it is the document a CTO reviews on
// the call - so anchoring the actions here means they stay reachable no matter how
// far the brief has grown, instead of scrolling off the end of it.
//
// Book a call is a real control and opens the booking canvas in place.
//
// Download and Email are rendered as the design's affordances but are NOT
// interactive in P1, for the same reason "Download PDF" and "Add to calendar" are
// static in S8: generating the PDF and posting to HubSpot is P5, and a button that
// silently does nothing is worse than a label that plainly is one. They become
// buttons in P5 when `/api/ask/booking` exists to back them.

export function BriefActions({
  brief,
  onSchedule,
}: {
  brief: Brief
  onSchedule: () => void
}) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-[12px] border-t border-[#1a2740] px-[32px] py-[16px] @max-[62rem]:px-[16px] @max-[62rem]:py-[12px]">
      <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
        <span className="text-[12.5px] font-semibold leading-[1.3] text-white">
          {ASK_LABELS.briefActionsTitle}
        </span>
        <span className="text-[11.5px] leading-[1.4] text-text-tertiary">
          {ASK_LABELS.briefActionsNote}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-[8px]">
        <span className="rounded-pill border border-border-subtle px-[13px] py-[8px] text-[12px] font-medium leading-none text-text-secondary">
          {ASK_LABELS.downloadBrief}
        </span>
        <span className="rounded-pill border border-border-subtle px-[13px] py-[8px] text-[12px] font-medium leading-none text-text-secondary">
          {ASK_LABELS.emailBrief}
        </span>
        <MegaMenuPillLabel
          as="button"
          onClick={onSchedule}
          variant="pill-green"
          size="cta"
          leadingArrow
          leadingGlyph={GLYPH.arrow}
          label={ASK_LABELS.bookToReview}
          className="!pr-[16px] !text-[12.5px]"
          // Version is what a human would quote back on the call, so it is worth
          // exposing to assistive tech rather than leaving it purely decorative.
          aria-describedby={undefined}
          title={`${ASK_LABELS.briefVersion} ${brief.version}`}
        />
      </div>
    </div>
  )
}

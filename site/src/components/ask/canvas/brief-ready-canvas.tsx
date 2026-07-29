'use client'

import { MegaMenuPillLabel } from '@/components/ui/mega-menu-pill-label'

import { ASK_LABELS, GLYPH } from '../content'
import { BriefField, Chip, MicroLabel, ProfileMark } from '../primitives'
import { BriefActions } from './brief-actions'
import type { BriefCanvas, BriefReadyCta } from '@/lib/ask/types'

// S6 - the brief is strong enough to be worth a human's half hour.
//
// The canvas changes in three ways, all deliberate: the ground picks up a faint
// lime wash, the strength meter is replaced by a completed-state tick, and the
// booking CTA becomes the largest thing in the panel. The proof strip is gone by
// now - the brief has earned the whole column.
//
// Copy discipline (Option A): "strong enough for a matching conversation". Never
// "we have found you an engineer".

/** Faint lime bloom from the top-right, marking the completed state. */
export const READY_CANVAS_BACKGROUND =
  'radial-gradient(120% 90% at 100% 0%,#101f1a 0%,#0B1424 62%)'

function CompletedTick() {
  return (
    <span
      aria-hidden="true"
      className="flex size-[17px] shrink-0 items-center justify-center rounded-full bg-brand-primary text-[9.5px] font-bold leading-none text-text-dark"
    >
      {GLYPH.check}
    </span>
  )
}

export function BriefReadyCanvas({
  canvas,
  cta,
  onSchedule,
}: {
  canvas: BriefCanvas
  cta: BriefReadyCta
  onSchedule: () => void
}) {
  const { brief, display } = canvas
  const strengthLine = `${cta.strengthLabel} ${Math.round(brief.strength)}%`

  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      style={{ background: READY_CANVAS_BACKGROUND }}
    >
      {/* Scrolls independently. The ready brief is the longest one - it is what a
          CloudEmployee lead reads before the call - and the action bar below has to
          stay put however far it grows. */}
      <div className="ask-scroll flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-[32px] pb-[30px] pt-[26px] @max-[62rem]:px-[16px] @max-[62rem]:pb-[20px] @max-[62rem]:pt-[16px]">
        <div className="flex shrink-0 items-center justify-between gap-[16px]">
          <div className="flex items-center gap-[9px]">
            <CompletedTick />
            <MicroLabel size="lg" tone="accent">
              {cta.eyebrow}
            </MicroLabel>
          </div>
          <span className="whitespace-nowrap text-[12px] font-medium leading-none text-text-tertiary">
            {strengthLine}
          </span>
        </div>

        <div className="mt-[20px] rounded-[18px] border border-[#2c3f33] bg-section-bg-card px-[26px] py-[24px]">
          <div className="mb-[22px] flex items-center gap-[20px]">
            <ProfileMark size="md" />
            <div>
              <h2 className="mb-[9px] text-[23px] font-semibold leading-[1.15] tracking-[-0.7px] text-white">
                {display.title}
              </h2>
              {display.summaryLine ? (
                <p className="text-[14px] leading-none text-text-tertiary">
                  {display.summaryLine}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-x-[22px] gap-y-[16px] border-t border-border-subtle pt-[20px]">
            <BriefField
              label={ASK_LABELS.seniority}
              value={display.seniorityBadge}
            />
            <BriefField label={ASK_LABELS.overlap} value={display.overlapLine} />
            <BriefField
              label={ASK_LABELS.teamContext}
              value={display.teamContextLine}
            />
          </div>

          {brief.techStacks?.length ? (
            <div className="mt-[18px] border-t border-border-subtle pt-[18px]">
              <MicroLabel size="sm" className="mb-[10px] block">
                {ASK_LABELS.techStack}
              </MicroLabel>
              <div className="flex flex-wrap gap-[7px]">
                {brief.techStacks.map((stack) => (
                  <Chip key={stack}>{stack}</Chip>
                ))}
              </div>
            </div>
          ) : null}

          {brief.goals ? (
            <div className="mt-[18px] border-t border-border-subtle pt-[18px]">
              <MicroLabel size="sm" className="mb-[8px] block">
                {ASK_LABELS.goalInYourWords}
              </MicroLabel>
              <p className="max-w-[600px] text-[14.5px] leading-[23px] text-text-secondary">
                {brief.goals}
              </p>
            </div>
          ) : null}
        </div>

        <div className="mt-auto flex items-center gap-[24px] rounded-[18px] border border-brand-primary bg-[#0F1B12] px-[24px] py-[22px] @max-[62rem]:flex-col @max-[62rem]:items-start @max-[62rem]:gap-[16px]">
          <div className="flex-1">
            <h3 className="mb-[7px] text-[20px] font-semibold leading-[1.25] tracking-[-0.6px] text-white">
              {cta.title}
            </h3>
            <p className="max-w-[380px] text-[13.5px] leading-[20px] text-text-secondary">
              {cta.body}
            </p>
          </div>
          <div className="flex flex-col items-end gap-[10px] @max-[62rem]:items-start">
            <MegaMenuPillLabel
              as="button"
              onClick={onSchedule}
              variant="pill-green"
              size="cta"
              leadingArrow
              leadingGlyph={GLYPH.arrow}
              label={cta.ctaLabel}
              className="!py-[7px] !pr-[24px] !text-[15.5px]"
            />
            <span className="text-[12.5px] font-medium leading-none text-text-tertiary">
              {cta.secondary}
            </span>
          </div>
        </div>
      </div>

      <BriefActions brief={brief} onSchedule={onSchedule} />
    </div>
  )
}

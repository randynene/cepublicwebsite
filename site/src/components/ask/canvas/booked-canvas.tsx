import { cn } from '@/components/ui/_utils/cn'

import { GLYPH } from '../content'
import { Chip, MicroLabel } from '../primitives'
import { READY_CANVAS_BACKGROUND } from './brief-ready-canvas'
import type { BookedCanvas as BookedCanvasData } from '@/lib/ask/types'

// S8 - booked. The confirmation replaces the calendar, the brief that travelled
// with the booking is shown back to the visitor, and the chat stays live so a
// detail they remember afterwards still lands on the brief.
//
// P1 renders the confirmed state from a fixture. P5 arrives here off Calendly's
// `event_scheduled` message and posts the brief to HubSpot at that point - which is
// the only moment any of this touches the CRM.

export function BookedCanvas({ booked }: { booked: BookedCanvasData }) {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col gap-[18px] overflow-y-auto px-[32px] pb-[30px] pt-[26px] @max-[62rem]:px-[16px] @max-[62rem]:pb-[20px] @max-[62rem]:pt-[16px]"
      style={{ background: READY_CANVAS_BACKGROUND }}
    >
      <div className="flex items-center gap-[9px]">
        <span
          aria-hidden="true"
          className="flex size-[17px] shrink-0 items-center justify-center rounded-full bg-brand-primary text-[9.5px] font-bold leading-none text-text-dark"
        >
          {GLYPH.check}
        </span>
        <MicroLabel size="lg" tone="accent">
          {booked.eyebrow}
        </MicroLabel>
      </div>

      <div className="flex items-center gap-[24px] rounded-[18px] border border-brand-primary bg-section-bg-card px-[26px] py-[24px] @max-[62rem]:flex-wrap @max-[62rem]:gap-[16px]">
        <div className="w-[78px] shrink-0 rounded-[14px] border border-[#2c3f33] bg-[#0F1B12] py-[12px] text-center">
          <div className="mb-[7px] font-plex text-[10.5px] font-medium uppercase leading-none tracking-[1.2px] text-brand-primary">
            {booked.month}
          </div>
          <div className="text-[30px] font-bold leading-none tracking-[-1.2px] text-white">
            {booked.day}
          </div>
        </div>
        <div className="flex-1">
          <h2 className="mb-[8px] text-[21px] font-semibold leading-[1.2] tracking-[-0.6px] text-white">
            {booked.title}
          </h2>
          <p className="text-[13.5px] leading-[21px] text-text-secondary">
            {booked.detail}
          </p>
        </div>
        <div className="flex flex-col gap-[8px]">
          {booked.actions.map((action, index) => (
            <span
              key={action}
              className={cn(
                'whitespace-nowrap rounded-pill px-[15px] py-[8px] text-center text-[12.5px]',
                index === 0
                  ? 'border border-[#2c3f33] font-semibold text-brand-primary'
                  : 'border border-border-subtle font-medium text-text-secondary',
              )}
            >
              {action}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-[18px] border border-[#2c3f33] bg-section-bg-card px-[24px] py-[22px]">
        <div className="mb-[16px] flex items-center justify-between gap-[12px]">
          <MicroLabel size="sm">{booked.briefSentLabel}</MicroLabel>
          <span className="whitespace-nowrap text-[12.5px] font-semibold text-brand-primary">
            {booked.downloadLabel}
          </span>
        </div>
        <h3 className="mb-[14px] text-[20px] font-semibold leading-[1.2] tracking-[-0.6px] text-white">
          {booked.briefTitle}
        </h3>
        <div className="flex flex-wrap gap-[7px]">
          {booked.briefChips.map((chip) => (
            <Chip key={chip}>{chip}</Chip>
          ))}
        </div>
      </div>

      <div className="mt-auto grid grid-cols-2 gap-[22px] border-t border-[#1a2740] pt-[18px] @max-[62rem]:grid-cols-1 @max-[62rem]:gap-[16px]">
        {booked.notes.map((note) => (
          <div key={note.title}>
            <div className="mb-[6px] text-[13.5px] font-semibold text-white">
              {note.title}
            </div>
            <p className="text-[12.5px] leading-[1.5] text-text-tertiary">
              {note.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

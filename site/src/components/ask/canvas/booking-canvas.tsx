import { cn } from '@/components/ui/_utils/cn'

import { ASK_LABELS, BOOKING_PLACEHOLDER, GLYPH } from '../content'
import { MicroLabel } from '../primitives'
import type { BookingCanvas as BookingCanvasData } from '@/lib/ask/types'

// S7 - booking happens inside the canvas. The visitor never leaves /ask and the
// chat stays live beside them, which is the whole reason this is not a link to
// /book-a-call.
//
// ============================ P1 PLACEHOLDER =================================
// Everything below the chip row is a STATIC PICTURE of the CE Calendly page,
// transcribed from the design reference. No Calendly script is loaded and no slot
// can be selected.
//
// P5 swaps the two panels below for the existing
// components/templates/book-a-call/calendly-inline-embed.tsx, fed the URL from
// Sanity, and listens for `calendly.event_scheduled` to advance to S8. It is a
// placeholder rather than the real embed because the P1 gate is the canvas
// composition, and mounting a third-party iframe would make that harder to judge,
// not easier.
// =============================================================================

/** Four overlapping discs standing in for the CE team photos on the event card. */
function HostCluster() {
  return (
    <div aria-hidden="true" className="relative h-[58px] w-[200px]">
      {[
        { left: 12, top: 5, alt: false },
        { left: 50, top: 2, alt: true },
        { left: 88, top: 2, alt: false },
        { left: 126, top: 5, alt: true },
      ].map((disc) => (
        <span
          key={disc.left}
          className={cn(
            'absolute block size-[52px] rounded-full border-2 border-white',
            disc.alt ? 'bg-border-subtle' : 'bg-surface-tertiary',
          )}
          style={{ left: disc.left, top: disc.top }}
        />
      ))}
    </div>
  )
}

function EventPanel() {
  return (
    <div className="flex w-2/5 shrink-0 flex-col border-r border-border-subtle @max-[62rem]:w-full @max-[62rem]:border-b @max-[62rem]:border-r-0">
      <div className="flex flex-col items-center gap-[10px] border-b border-border-subtle px-[24px] pb-[22px] pt-[26px]">
        <HostCluster />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/ce-logo.svg"
          alt=""
          aria-hidden="true"
          className="block h-[19px] w-auto opacity-35"
        />
      </div>
      {/* Scrolls rather than clips: the reference fits this column at exactly
          900px tall, and any font-metric difference would otherwise put the legal
          links out of reach. */}
      <div className="flex flex-1 flex-col gap-[13px] overflow-y-auto px-[24px] pb-[18px] pt-[22px]">
        <h3 className="text-[23px] font-bold leading-[1.2] tracking-[-0.7px] text-white">
          {BOOKING_PLACEHOLDER.eventTitle}
        </h3>
        <div className="flex items-center gap-[9px]">
          <span
            aria-hidden="true"
            className="block size-[19px] rounded-full border-[1.5px] border-text-secondary"
          />
          <span className="text-[14px] font-semibold text-white">
            {BOOKING_PLACEHOLDER.duration}
          </span>
        </div>
        <p className="text-[13.5px] leading-[21px] text-text-secondary">
          {BOOKING_PLACEHOLDER.intro}
        </p>
        <p className="text-[13.5px] leading-[21px] text-text-secondary">
          {BOOKING_PLACEHOLDER.hostsLead}
        </p>
        <ul className="flex flex-col gap-[8px]">
          {BOOKING_PLACEHOLDER.bullets.map((bullet) => (
            <li key={bullet} className="flex gap-[9px]">
              <span
                aria-hidden="true"
                className="text-[13.5px] leading-[21px] text-text-tertiary"
              >
                ·
              </span>
              <span className="text-[13.5px] font-semibold leading-[21px] text-white">
                {bullet}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-[13px] leading-[20px] text-text-tertiary">
          {BOOKING_PLACEHOLDER.reassurance}
        </p>
        <div className="mt-auto flex gap-[22px] pt-[14px]">
          {BOOKING_PLACEHOLDER.legalLinks.map((link) => (
            <span
              key={link}
              className="text-[12.5px] font-semibold text-brand-primary"
            >
              {link}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function DatePicker() {
  const { weekdays, leadingBlanks, daysInMonth, selectedDay, availableDays } =
    BOOKING_PLACEHOLDER
  const days = Array.from({ length: daysInMonth }, (_, index) => index + 1)
  const timezoneLine = `${BOOKING_PLACEHOLDER.timezoneValue} ${GLYPH.chevronDown}`

  return (
    <div className="flex flex-1 flex-col px-[28px] py-[24px] @max-[62rem]:px-[16px] @max-[62rem]:py-[20px]">
      <h3 className="mb-[18px] text-[20px] font-bold tracking-[-0.5px] text-white">
        {BOOKING_PLACEHOLDER.pickerTitle}
      </h3>

      <div className="mb-[16px] flex items-center justify-center gap-[26px]">
        <span aria-hidden="true" className="text-[17px] text-[#5f6b7d]">
          {GLYPH.prev}
        </span>
        <span className="text-[14.5px] font-semibold text-white">
          {BOOKING_PLACEHOLDER.month}
        </span>
        <span aria-hidden="true" className="text-[17px] text-brand-primary">
          {GLYPH.next}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 gap-[22px] @max-[62rem]:flex-col @max-[62rem]:gap-[20px]">
        <div className="min-w-0 flex-1">
          <div className="mb-[6px] grid grid-cols-7 gap-[4px]">
            {weekdays.map((weekday) => (
              <span
                key={weekday}
                className="text-center text-[11.5px] font-medium text-text-tertiary"
              >
                {weekday}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-[4px]">
            {Array.from({ length: leadingBlanks }, (_, index) => (
              <span key={`blank-${index}`} />
            ))}
            {days.map((day) => {
              const isSelected = day === selectedDay
              const isAvailable = availableDays.includes(day)
              return (
                <span
                  key={day}
                  className="flex h-[38px] items-center justify-center"
                >
                  {isSelected || isAvailable ? (
                    <span
                      className={cn(
                        'flex size-[38px] items-center justify-center rounded-full text-[14px]',
                        isSelected
                          ? 'bg-brand-primary font-bold text-text-dark'
                          : 'bg-[#0E4E57] font-semibold text-brand-primary',
                      )}
                    >
                      {day}
                    </span>
                  ) : (
                    <span className="text-[14px] text-[#3f4a5c]">{day}</span>
                  )}
                </span>
              )
            })}
          </div>

          <div className="mt-[18px]">
            <div className="mb-[9px] text-[13px] font-semibold text-white">
              {BOOKING_PLACEHOLDER.timezoneLabel}
            </div>
            <div className="flex items-center gap-[9px]">
              <span
                aria-hidden="true"
                className="block size-[16px] rounded-full border-[1.5px] border-text-tertiary"
              />
              <span className="text-[13px] text-text-secondary">
                {timezoneLine}
              </span>
            </div>
          </div>
        </div>

        <div className="flex w-[158px] shrink-0 flex-col gap-[8px] @max-[62rem]:w-full">
          <div className="mb-[2px] text-[13px] font-semibold text-white">
            {BOOKING_PLACEHOLDER.slotsHeading}
          </div>
          {BOOKING_PLACEHOLDER.slots.map((slot) =>
            slot === BOOKING_PLACEHOLDER.activeSlot ? (
              // The frame catches this slot mid-selection: the time slides left
              // and a confirm button takes the other half.
              <div key={slot} className="flex gap-[6px]">
                <span className="flex-1 rounded-[8px] bg-surface-tertiary py-[11px] text-center text-[13.5px] font-semibold text-text-secondary">
                  {slot}
                </span>
                <span className="flex-1 rounded-[8px] bg-brand-primary py-[11px] text-center text-[13.5px] font-bold text-text-dark">
                  {BOOKING_PLACEHOLDER.confirmLabel}
                </span>
              </div>
            ) : (
              <span
                key={slot}
                className="rounded-[8px] border border-[#2c3f33] py-[11px] text-center text-[13.5px] font-medium text-brand-primary"
              >
                {slot}
              </span>
            ),
          )}
        </div>
      </div>
    </div>
  )
}

export function BookingCanvas({ booking }: { booking: BookingCanvasData }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-[16px] px-[24px] pb-[24px] pt-[22px] @max-[62rem]:px-[12px] @max-[62rem]:pb-[12px] @max-[62rem]:pt-[12px]">
      <div className="flex shrink-0 flex-wrap items-center gap-[10px]">
        <MicroLabel size="sm">{booking.attachedLabel}</MicroLabel>
        {booking.attachedChips.map((chip, index) => (
          <span
            key={chip}
            className={cn(
              'rounded-pill bg-section-bg-card px-[12px] py-[7px] text-[12.5px] font-medium',
              index === 0
                ? 'border border-[#2c3f33] text-white'
                : 'border border-border-subtle text-text-secondary',
            )}
          >
            {chip}
          </span>
        ))}
        <span className="ml-auto text-[12.5px] font-semibold text-brand-primary">
          {booking.backLabel}
        </span>
      </div>

      <div
        aria-label={ASK_LABELS.bookingPlaceholder}
        className="flex min-h-0 flex-1 overflow-hidden rounded-[14px] border border-border-subtle bg-[#0E1A2E] @max-[62rem]:flex-col @max-[62rem]:overflow-y-auto"
      >
        <EventPanel />
        <DatePicker />
      </div>
    </div>
  )
}

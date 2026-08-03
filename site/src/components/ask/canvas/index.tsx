'use client'

import { BookedCanvas } from './booked-canvas'
import { BookingCanvas } from './booking-canvas'
import { BriefCanvas } from './brief-canvas'
import { BriefCardMobile } from './brief-card-mobile'
import { BriefReadyCanvas } from './brief-ready-canvas'
import { ProofCanvas, ProofCardMobile } from './proof-panel'
import type { AskCanvas as AskCanvasData } from '@/lib/ask/types'

// The canvas shows exactly ONE of proof, brief or booking - never two stacked.
// That is a locked layout rule from the execution plan: the panel is a single
// surface whose job changes as the conversation earns it.
//
// Note the proof strip is NOT an exception to that rule. It belongs to the brief
// canvas (see brief-canvas.tsx) and rotates in a band underneath it, exactly as
// the S3/S4/S5 frames draw it.

export function AskCanvas({
  canvas,
  onSchedule,
  onBookingBack,
}: {
  canvas: AskCanvasData
  onSchedule: () => void
  onBookingBack?: () => void
}) {
  switch (canvas.kind) {
    case 'proof':
      return <ProofCanvas proof={canvas.proof} />
    case 'brief':
      return <BriefCanvas canvas={canvas.brief} onSchedule={onSchedule} />
    case 'brief-ready':
      return (
        <BriefReadyCanvas
          canvas={canvas.brief}
          cta={canvas.cta}
          onSchedule={onSchedule}
        />
      )
    case 'booking':
      return (
        <BookingCanvas booking={canvas.booking} onBack={onBookingBack} />
      )
    case 'booked':
      return <BookedCanvas booked={canvas.booked} />
  }
}

/**
 * The mobile counterpart: a single card pinned above the thread. Booking and
 * booked states keep the full panels, which scroll under the thread on a phone.
 */
export function AskCanvasMobile({
  canvas,
  onSchedule,
  onBookingBack,
}: {
  canvas: AskCanvasData
  onSchedule: () => void
  onBookingBack?: () => void
}) {
  switch (canvas.kind) {
    case 'proof':
      return <ProofCardMobile proof={canvas.proof} />
    case 'brief':
      return <BriefCardMobile canvas={canvas.brief} />
    case 'brief-ready':
      return (
        <BriefReadyCanvas
          canvas={canvas.brief}
          cta={canvas.cta}
          onSchedule={onSchedule}
        />
      )
    case 'booking':
      return (
        <BookingCanvas booking={canvas.booking} onBack={onBookingBack} />
      )
    case 'booked':
      return <BookedCanvas booked={canvas.booked} />
  }
}

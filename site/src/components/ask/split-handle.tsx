'use client'

import { useCallback, useRef, useState } from 'react'

import { cn } from '@/components/ui/_utils/cn'

import { ASK_LABELS } from './content'
import { createPersistedStore } from './use-persisted'

// The draggable divider between chat and canvas.
//
// Constraints from the layout contract: 44% default, 35-65% range, remembered in
// localStorage. The range matters - below 35% the chat cannot hold a readable line
// length, above 65% the brief card's field grid starts wrapping.

export const SPLIT_DEFAULT = 44
export const SPLIT_MIN = 35
export const SPLIT_MAX = 65
const SPLIT_STORAGE_KEY = 'ask.splitPercent'
/** Nudge per arrow keypress, so the divider is usable without a pointer. */
const SPLIT_STEP = 2

function clampSplit(value: number): number {
  return Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, value))
}

const splitStore = createPersistedStore<number>({
  key: SPLIT_STORAGE_KEY,
  fallback: SPLIT_DEFAULT,
  decode: (raw) => {
    const parsed = Number.parseFloat(raw)
    return Number.isFinite(parsed) ? clampSplit(parsed) : null
  },
  encode: (value) => String(Math.round(value)),
})

/**
 * Owns the split position. `split` is the live value (the drag position while
 * dragging, otherwise the remembered one); `commit` persists.
 */
export function useSplit() {
  const stored = splitStore.use()
  /** Non-null only mid-drag, so a drag never writes to localStorage per frame. */
  const [dragging, setDragging] = useState<number | null>(null)

  const commit = useCallback((value: number) => {
    setDragging(null)
    splitStore.set(clampSplit(value))
  }, [])

  const drag = useCallback((value: number) => {
    setDragging(clampSplit(value))
  }, [])

  return { split: dragging ?? stored, drag, commit }
}

export function SplitHandle({
  split,
  onDrag,
  onCommit,
}: {
  split: number
  onDrag: (value: number) => void
  onCommit: (value: number) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)

  const percentFromEvent = useCallback((clientX: number): number | null => {
    // The handle is positioned against its offset parent, which is also the grid
    // being resized - so that parent's box is the measurement we need.
    const track = ref.current?.parentElement
    if (!track) return null
    const rect = track.getBoundingClientRect()
    if (rect.width === 0) return null
    return ((clientX - rect.left) / rect.width) * 100
  }, [])

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    setActive(true)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!active) return
    const percent = percentFromEvent(event.clientX)
    if (percent !== null) onDrag(percent)
  }

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!active) return
    setActive(false)
    event.currentTarget.releasePointerCapture(event.pointerId)
    onCommit(split)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      onCommit(split - SPLIT_STEP)
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      onCommit(split + SPLIT_STEP)
    }
    if (event.key === 'Home') {
      event.preventDefault()
      onCommit(SPLIT_DEFAULT)
    }
  }

  // Hidden until wanted, per the reference annotation ("handle appears on hover").
  // Held visible for the whole drag so the grab point cannot vanish under the
  // cursor.
  const barClass = active
    ? 'bg-brand-primary opacity-100'
    : 'opacity-0 group-hover:opacity-100 group-focus-visible:bg-brand-primary group-focus-visible:opacity-100'

  return (
    <div
      ref={ref}
      role="separator"
      aria-orientation="vertical"
      aria-label={ASK_LABELS.resizeHandle}
      aria-valuenow={Math.round(split)}
      aria-valuemin={SPLIT_MIN}
      aria-valuemax={SPLIT_MAX}
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={handleKeyDown}
      style={{ left: `${split}%` }}
      className="group absolute bottom-0 top-0 z-[3] -ml-[8px] flex w-[16px] cursor-col-resize touch-none items-center justify-center focus-visible:outline-none"
    >
      <span
        aria-hidden="true"
        className={cn(
          'block h-[48px] w-[3px] rounded-pill bg-[#4a586e] transition-opacity duration-reveal ease-reveal motion-reduce:transition-none',
          barClass,
        )}
      />
    </div>
  )
}

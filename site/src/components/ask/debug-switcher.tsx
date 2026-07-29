'use client'

import { useState } from 'react'

import { cn } from '@/components/ui/_utils/cn'

import { ASK_DEBUG } from './content'
import { FOCUS_RING } from './primitives'
import { ASK_SCREENS, ASK_SCREEN_ORDER } from '@/lib/ask/fixtures'
import type { AskScreenId } from '@/lib/ask/types'

// Dev-only state switcher, mounted when the URL carries ?askDebug=1.
//
// It exists because P1 has no Clara and no way to walk the conversation forwards,
// and every one of the ten designed states still has to be reviewable. It is a
// review instrument, not a feature: it renders nothing without the query
// parameter, and P2's scripted transport removes the need for most of it.
//
// It deliberately does NOT gate on NODE_ENV. The states have to be clickable on the
// Vercel preview, which is a production build.

export function AskDebugSwitcher({
  screenId,
  onSelect,
}: {
  screenId: AskScreenId
  onSelect: (id: AskScreenId) => void
}) {
  const [open, setOpen] = useState(true)
  const active = ASK_SCREENS[screenId]

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'fixed bottom-[16px] left-1/2 z-50 -translate-x-1/2 rounded-pill border border-brand-primary bg-[#0F1B12] px-[16px] py-[8px] text-[12px] font-semibold text-brand-primary',
          FOCUS_RING,
        )}
      >
        {ASK_DEBUG.open}
      </button>
    )
  }

  return (
    <div className="fixed bottom-[16px] left-1/2 z-50 w-[min(760px,calc(100vw-32px))] -translate-x-1/2 rounded-[16px] border border-[#2c3f33] bg-[#0B1424]/95 p-[14px] shadow-[0_18px_40px_-12px_rgba(0,0,0,0.7)] backdrop-blur">
      <div className="mb-[10px] flex items-center justify-between gap-[12px]">
        <span className="font-plex text-[10px] font-medium uppercase tracking-[1.2px] text-brand-primary">
          {ASK_DEBUG.title}
        </span>
        <span className="flex-1 truncate text-[11px] text-text-tertiary">
          {ASK_DEBUG.note}
        </span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className={cn(
            'rounded-pill border border-border-subtle px-[10px] py-[4px] text-[11px] font-semibold text-text-secondary hover:border-brand-primary hover:text-white',
            FOCUS_RING,
          )}
        >
          {ASK_DEBUG.close}
        </button>
      </div>

      <div className="mb-[10px] flex flex-wrap gap-[6px]">
        {ASK_SCREEN_ORDER.map((id) => {
          const screen = ASK_SCREENS[id]
          const isActive = id === screenId
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              aria-pressed={isActive}
              className={cn(
                'rounded-pill border px-[10px] py-[6px] text-[11.5px] font-semibold leading-none transition-colors duration-reveal ease-reveal motion-reduce:transition-none',
                isActive
                  ? 'border-brand-primary bg-brand-primary text-text-dark'
                  : 'border-border-subtle text-text-secondary hover:border-brand-primary hover:text-white',
                FOCUS_RING,
              )}
            >
              <span className="font-plex">{id}</span>
              <span className="ml-[6px] font-normal">{screen.label}</span>
            </button>
          )
        })}
      </div>

      <dl className="grid grid-cols-2 gap-x-[16px] gap-y-[4px] border-t border-[#1a2740] pt-[10px] @max-[62rem]:grid-cols-1">
        <div className="flex gap-[8px]">
          <dt className="font-plex text-[10px] uppercase tracking-[1px] text-text-tertiary">
            {ASK_DEBUG.triggerLabel}
          </dt>
          <dd className="text-[11.5px] text-text-secondary">{active.trigger}</dd>
        </div>
        <div className="flex gap-[8px]">
          <dt className="font-plex text-[10px] uppercase tracking-[1px] text-text-tertiary">
            {ASK_DEBUG.canvasLabel}
          </dt>
          <dd className="text-[11.5px] text-text-secondary">
            {active.canvasNote}
          </dd>
        </div>
      </dl>
    </div>
  )
}

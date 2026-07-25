'use client'

import { useState } from 'react'

import { cn } from '@/components/ui/_utils/cn'
import type { HubFaq } from '@/data/services'

const GLYPH = { plus: '+', close: '×' } as const

// Interactive numbered FAQ accordion shared by the Services/Technology hubs and
// detail pages (design: numbered rows, +/x lime glyph). Native-ish accordion with
// React state so open/close matches the reference.

// Numbered accordion (Service Detail): lime 01-06 number, question, circular
// +/x toggle, 1px dividers, first row open by default, height+opacity transition.
export function CatalogueFaqNumbered({ items }: { items: HubFaq[] }) {
  const [open, setOpen] = useState<number>(0)
  return (
    <div className="flex flex-col border-t border-[#22314D]">
      {items.map((f, i) => {
        const isOpen = open === i
        const num = String(i + 1).padStart(2, '0')
        return (
          <div key={f.q} className="border-b border-[#22314D]">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? -1 : i)}
              aria-expanded={isOpen}
              className="flex w-full cursor-pointer items-center gap-4 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#070D18]"
            >
              <span aria-hidden="true" className="w-7 shrink-0 text-[14px] font-semibold text-brand-primary">{num}</span>
              <span className="flex-1 text-[16px] font-semibold leading-snug text-white lg:text-[18px]">{f.q}</span>
              <span
                aria-hidden="true"
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[18px] leading-none transition-colors',
                  isOpen ? 'border-brand-primary bg-brand-primary/10 text-brand-primary' : 'border-[#22314D] text-[#7F8CA0]',
                )}
              >
                {isOpen ? GLYPH.close : GLYPH.plus}
              </span>
            </button>
            <div className={cn('grid transition-all duration-300 ease-out', isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}>
              <div className="overflow-hidden">
                <p className="pb-6 pl-11 pr-12 text-[15px] leading-[24px] text-[#B8C2D1] lg:text-[16px]">{f.a}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function CatalogueFaq({ items }: { items: HubFaq[] }) {
  const [open, setOpen] = useState<number>(-1)
  return (
    <div className="flex flex-col gap-3">
      {items.map((f, i) => {
        const isOpen = open === i
        return (
          <div
            key={f.q}
            className={cn(
              'rounded-[16px] border border-[#22314D] bg-[#101B30] transition-colors duration-200',
              isOpen && 'border-brand-primary/40',
            )}
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? -1 : i)}
              aria-expanded={isOpen}
              className="flex w-full cursor-pointer items-center gap-4 p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#070D18]"
            >
              <span className="flex-1 text-[16px] font-semibold leading-snug text-white">{f.q}</span>
              <span
                aria-hidden="true"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand-primary/25 bg-brand-primary/10 text-[18px] leading-none text-brand-primary"
              >
                {isOpen ? GLYPH.close : GLYPH.plus}
              </span>
            </button>
            {isOpen ? (
              <p className="px-5 pb-5 text-[15px] leading-[24px] text-[#B8C2D1]">{f.a}</p>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

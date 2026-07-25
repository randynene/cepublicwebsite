'use client'

import { useState } from 'react'

import { cn } from '@/components/ui/_utils/cn'

const GLYPH = { left: '‹', right: '›' } as const
const EYEBROW = 'text-[12px] font-semibold uppercase tracking-[1.68px] text-brand-primary'
const ACCENT = 'font-serif font-normal italic text-brand-primary'
const BAND = 'mx-auto w-full max-w-[1440px] px-6 lg:px-16'

interface Slide {
  caption: string
  src: string
  alt: string
}

// Ops slideshow (Service/Technology detail). Header (eyebrow + heading) and the
// prev/next controls stay within the 1280 content gutter; the 370x300 slide track
// runs full-bleed edge to edge. Arrows are 40px circles with a 16px icon.
export function OpsSlideshow({ slides, eyebrow, lead, accent }: { slides: Slide[]; eyebrow: string; lead: string; accent: string }) {
  const [idx, setIdx] = useState(0)
  const max = slides.length
  const go = (d: number) => setIdx((i) => (i + d + max) % max)
  return (
    <div>
      {/* Header row - in gutter */}
      <div className={BAND}>
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className={EYEBROW}>{eyebrow}</p>
            <h2 className="mt-3 max-w-[720px] text-[32px] font-semibold leading-[1.1] tracking-[-1.2px] text-white lg:text-[42px] lg:leading-[50px]">
              {lead} <span className={ACCENT}>{accent}</span>
            </h2>
          </div>
          <div className="flex shrink-0 gap-2.5">
            <button type="button" onClick={() => go(-1)} aria-label="Previous" className="flex h-9 w-9 items-center justify-center rounded-full border border-[#22314D] bg-[#101B30] text-[14px] text-white hover:border-brand-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {GLYPH.left}
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Next" className="flex h-9 w-9 items-center justify-center rounded-full border border-[#22314D] bg-[#101B30] text-[14px] text-white hover:border-brand-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {GLYPH.right}
            </button>
          </div>
        </div>

        {/* Slide track - contained within the band, aligned with the header */}
        <div className="mt-8 overflow-hidden">
          <div className="flex gap-5 transition-transform duration-500 ease-out" style={{ transform: `translateX(calc(${-idx} * (370px + 20px)))` }}>
            {slides.map((s) => (
              <div key={s.caption} className="relative h-[300px] w-[370px] shrink-0 overflow-hidden rounded-[20px] border border-[#22314D] bg-[#1B2A45]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.src} alt={s.alt} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#060F1E]/90 to-transparent" />
                <span className="absolute bottom-5 left-5 text-[16px] font-semibold text-white">{s.caption}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination dots */}
        <div className="mt-6 flex gap-2">
          {slides.map((s, i) => (
            <button
              key={s.caption}
              type="button"
              onClick={() => setIdx(i)}
              aria-label={s.caption}
              className={cn('h-2 rounded-full transition-all', i === idx ? 'w-[22px] bg-brand-primary' : 'w-2 bg-[#22314D]')}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

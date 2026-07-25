'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'

import { cn } from '@/components/ui/_utils/cn'
import type { HiwTestimonial } from './content'

// Testimonials slider — reference "Reviews from real teams". A horizontal row
// of fixed-width cards with the neighbouring cards peeking at the edges. Cards
// alternate between a full-bleed member PHOTO card (name + company on the photo,
// quote overlaid) and a solid QUOTE-only card (avatar + name + role at the
// foot). Built on native scroll-snap so it degrades gracefully: with JS off it
// is a scrollable row showing every card, so all copy is crawlable. Auto-
// advances every 6s, disabled under prefers-reduced-motion (DoD a11y gate) and
// while hovering / focused. Prev/next + dots are keyboard-operable.

const QUOTE_GLYPH = '“'
const ARROW_LEFT = '←'
const ARROW_RIGHT = '→'
const AUTOPLAY_MS = 6000

const CONTROLS = {
  prev: 'Previous testimonial',
  next: 'Next testimonial',
  dot: 'Go to testimonial',
} as const

function PhotoCard({ item }: { item: HiwTestimonial }) {
  return (
    <div className="relative h-full w-full overflow-hidden">
      {item.image ? (
        <Image
          src={item.image}
          alt={item.imageAlt ?? item.name}
          fill
          sizes="(max-width: 1024px) 86vw, 560px"
          className="object-cover object-[center_28%]"
        />
      ) : null}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(6,15,30,.55) 0%, rgba(6,15,30,0) 30%), linear-gradient(0deg, rgba(6,15,30,.96) 0%, rgba(6,15,30,.72) 34%, rgba(6,15,30,0) 72%)',
        }}
      />
      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-[16px] p-[28px] lg:p-[32px]">
        <div>
          <div className="text-[18px] font-semibold leading-[23px] text-white">{item.name}</div>
          <div className="text-[12px] font-normal text-white/75">{item.role}</div>
        </div>
      </div>
      <figure className="absolute inset-x-0 bottom-0 flex flex-col gap-[14px] p-[28px] lg:p-[32px]">
        <span
          aria-hidden
          className="block text-[44px] font-extrabold leading-none tracking-[-2px] text-brand-primary"
        >
          {QUOTE_GLYPH}
        </span>
        <blockquote className="text-[17px] font-normal leading-[26px] tracking-[-0.3px] text-white lg:text-[18px] lg:leading-[27px]">
          {item.quote}
        </blockquote>
      </figure>
    </div>
  )
}

function QuoteCard({ item }: { item: HiwTestimonial }) {
  return (
    <figure className="flex h-full w-full flex-col justify-between gap-[24px] bg-[#101B30] px-[32px] py-[36px] lg:px-[40px] lg:py-[44px]">
      <div className="flex flex-col gap-[18px]">
        <span
          aria-hidden
          className="block text-[52px] font-extrabold leading-none tracking-[-2px] text-brand-primary"
        >
          {QUOTE_GLYPH}
        </span>
        <blockquote className="text-[18px] font-normal leading-[28px] tracking-[-0.3px] text-white lg:text-[19px] lg:leading-[29px]">
          {item.quote}
        </blockquote>
      </div>
      <figcaption className="flex items-center gap-[14px]">
        {item.image ? (
          <span className="relative h-[48px] w-[48px] shrink-0 overflow-hidden rounded-full border border-[#22314D]">
            <Image src={item.image} alt={item.imageAlt ?? item.name} fill sizes="48px" className="object-cover" />
          </span>
        ) : null}
        <div>
          <div className="text-[18px] font-semibold leading-[23px] tracking-[-0.38px] text-white">
            {item.name}
          </div>
          <div className="text-[12px] font-normal text-text-tertiary">{item.role}</div>
        </div>
      </figcaption>
    </figure>
  )
}

export function TestimonialsSlider({ items }: { items: HiwTestimonial[] }) {
  const [index, setIndex] = useState(0)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const indexRef = useRef(0)
  const reducedRef = useRef(false)
  const pausedRef = useRef(false)
  const count = items.length

  const goTo = useCallback(
    (i: number) => {
      const clamped = ((i % count) + count) % count
      indexRef.current = clamped
      setIndex(clamped)
      const scroller = scrollerRef.current
      const card = scroller?.children[clamped] as HTMLElement | undefined
      if (scroller && card) {
        // Scroll ONLY the track horizontally (never the page): compute the
        // scrollLeft that lands the card's start at the scroll-padding edge.
        const padL = parseFloat(getComputedStyle(scroller).scrollPaddingLeft) || 0
        const target =
          scroller.scrollLeft +
          (card.getBoundingClientRect().left - scroller.getBoundingClientRect().left) -
          padL
        scroller.scrollTo({ left: target, behavior: reducedRef.current ? 'auto' : 'smooth' })
      }
    },
    [count],
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    reducedRef.current = mq.matches
    const onChange = (e: MediaQueryListEvent) => {
      reducedRef.current = e.matches
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  // Auto-advance, disabled under prefers-reduced-motion. No setState in the
  // effect body — goTo drives both scroll and index.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    let id: number | undefined
    const start = () => {
      if (mq.matches || id !== undefined) return
      id = window.setInterval(() => {
        if (!pausedRef.current) goTo(indexRef.current + 1)
      }, AUTOPLAY_MS)
    }
    const stop = () => {
      if (id !== undefined) {
        window.clearInterval(id)
        id = undefined
      }
    }
    const handler = () => {
      stop()
      start()
    }
    start()
    mq.addEventListener('change', handler)
    return () => {
      stop()
      mq.removeEventListener('change', handler)
    }
  }, [goTo])

  // Keep the active dot in sync when the user scrolls/swipes manually.
  const onScroll = useCallback(() => {
    const scroller = scrollerRef.current
    if (!scroller) return
    const padL = parseFloat(getComputedStyle(scroller).scrollPaddingLeft) || 0
    const origin = scroller.getBoundingClientRect().left + padL
    let nearest = 0
    let min = Infinity
    Array.from(scroller.children).forEach((c, i) => {
      const d = Math.abs((c as HTMLElement).getBoundingClientRect().left - origin)
      if (d < min) {
        min = d
        nearest = i
      }
    })
    if (nearest !== indexRef.current) {
      indexRef.current = nearest
      setIndex(nearest)
    }
  }, [])

  return (
    <div
      className="relative"
      onMouseEnter={() => {
        pausedRef.current = true
      }}
      onMouseLeave={() => {
        pausedRef.current = false
      }}
      onFocusCapture={() => {
        pausedRef.current = true
      }}
      onBlurCapture={() => {
        pausedRef.current = false
      }}
    >
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        aria-roledescription="carousel"
        aria-label="Client testimonials"
        className="flex gap-[24px] overflow-x-auto scroll-smooth snap-x snap-mandatory px-[22px] pb-[4px] scroll-pl-[22px] [scrollbar-width:none] motion-reduce:scroll-auto sm:px-[32px] sm:scroll-pl-[32px] lg:px-[64px] lg:scroll-pl-[64px] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, i) => (
          <div
            key={item.name}
            aria-hidden={i !== index}
            className="h-[480px] w-[86%] shrink-0 snap-start overflow-hidden rounded-[24px] border border-[#22314D] bg-[#101B30] sm:w-[66%] lg:h-[520px] lg:w-[560px]"
          >
            {item.variant === 'photo' ? <PhotoCard item={item} /> : <QuoteCard item={item} />}
          </div>
        ))}
      </div>

      <div className="mt-[24px] flex items-center justify-between">
        <div className="flex items-center gap-[10px]">
          {items.map((item, i) => (
            <button
              key={item.name}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`${CONTROLS.dot} ${i + 1}`}
              aria-current={i === index}
              className={cn(
                'h-[8px] rounded-full transition-all',
                i === index ? 'w-[28px] bg-brand-primary' : 'w-[8px] bg-[#22314D] hover:bg-[#32435F]',
              )}
            />
          ))}
        </div>
        <div className="flex items-center gap-[10px]">
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            aria-label={CONTROLS.prev}
            className="flex h-[44px] w-[44px] items-center justify-center rounded-full border border-[#22314D] bg-[#101B30] text-white transition-colors hover:border-brand-primary hover:text-brand-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
          >
            <span aria-hidden className="text-[18px] leading-none">
              {ARROW_LEFT}
            </span>
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            aria-label={CONTROLS.next}
            className="flex h-[44px] w-[44px] items-center justify-center rounded-full border border-[#22314D] bg-[#101B30] text-white transition-colors hover:border-brand-primary hover:text-brand-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
          >
            <span aria-hidden className="text-[18px] leading-none">
              {ARROW_RIGHT}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

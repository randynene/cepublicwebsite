import type { ReactNode } from 'react'

import { cn } from '@/components/ui/_utils/cn'

// A horizontal auto-scrolling row of cards. Used for the testimonial row on Customer
// Stories and the Glassdoor row on Reviews.
//
// Same seamless-loop technique as the logo marquee: the children are DUPLICATED and
// the track translates 0 -> -50%, so the second copy arrives exactly where the first
// began. CSS-only, no JS. `motion-reduce` stops it and wraps the (single) set instead
// of running two copies past each other.
//
// The duplicate copy is aria-hidden so a screen reader reads each card once. The cards
// are still real, focusable links inside the first (visible) copy.

export function CardMarquee({
  items,
  itemClassName,
  durationClassName = 'animate-marquee-slow',
}: {
  items: ReactNode[]
  /** Width of each card in the track. */
  itemClassName?: string
  durationClassName?: string
}) {
  if (items.length === 0) return null

  return (
    <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]">
      <div
        className={cn(
          'flex w-max gap-6 pr-6',
          durationClassName,
          'hover:[animation-play-state:paused] motion-reduce:animate-none motion-reduce:flex-wrap motion-reduce:justify-center',
        )}
      >
        {items.map((item, i) => (
          <div key={`a-${i}`} className={cn('shrink-0', itemClassName)}>
            {item}
          </div>
        ))}
        {/* Second copy for the seamless loop; hidden from the a11y tree and from
            reduced-motion (where the first copy alone wraps and is enough). */}
        {items.map((item, i) => (
          <div
            key={`b-${i}`}
            aria-hidden="true"
            className={cn('shrink-0 motion-reduce:hidden', itemClassName)}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}

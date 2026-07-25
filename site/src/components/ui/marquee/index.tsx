import { cva, type VariantProps } from 'class-variance-authority'
import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from 'react'

import { cn } from '../_utils/cn'

// A6 Marquee — CSS-keyframe scroller (HALT 2 batch — autonomous).
//
// Probe-driven decisions (Hard Rule #2 — see scripts/design/probe-accordion-marquee-styles.mjs):
//
//   - 10 real animating marquee instances across /, /for-developers,
//     /about-us. ALL use CSS keyframe animation (`animation: 60s linear
//     infinite marquee`). NONE use Swiper. Brief asserted "Built atop
//     bundled Swiper.js" — WRONG. Swiper is reserved for interactive
//     carousels (Glassdoor reviews — Step 4 template concern).
//
//   - Brief asserted .staff-benefits-marquee class with enjoy-marquee
//     slug — DOES NOT EXIST in CE source. Real classes: .marquee,
//     .marquee-list, .marquee-wrap-tech, .cc-marquee, .logos-marquee.
//     The staffBenefit collection (6 items) renders under generic
//     marquee classes when composed by Step-4 templates.
//
//   - Speed range: 60s/90s/120s/140s/160s observed. 60s = dominant
//     (5/10). Speed enum: slow=120s | normal=60s | fast=30s. Outliers
//     (90s/140s/160s) covered by className override at template level.
//
//   - Direction: probe shows direction=normal everywhere — direction
//     encoded in keyframes. Vertical variants exist (.marquee-mob-tb,
//     .marquee-mob-tb-down) on mobile-only patterns. Surface as
//     left|right|up|down enum.
//
//   - Pause-on-hover: 3/10 CE marquees pause via data-marquee-state.
//     Default pauseOnHover=true (UX/a11y improvement per Decision D2 —
//     vestibular-disorder users benefit from hover-pause).
//
//   - Edge-fade: probe found mask=none on all 10 — CE has hard cutoff.
//     NOT shipping edge-fade in primitive (would deviate from CE
//     equivalence). Templates can layer their own gradient overlay if
//     desired.

const SPEED_MAP = {
  slow: '120s',
  normal: '60s',
  fast: '30s',
} as const

const marqueeTrackVariants = cva(
  // Track is the inner element that animates. `w-max` (horizontal) or
  // `h-max` (vertical) prevents children from shrinking to fit container.
  // Children duplicated below render the second set; -50% translate lands
  // exactly one set, producing seamless loop.
  //
  // motion-reduce: pauses the loop outright — vestibular-disorder users get
  // a static strip instead of continuous motion. Additive-only; no change
  // for anyone without that OS/browser preference set.
  ['flex shrink-0 motion-reduce:[animation-play-state:paused]'],
  {
    variants: {
      direction: {
        // Horizontal: track is flex-row, items lay along x; -50% on x.
        left: 'flex-row w-max animate-[marquee-x_var(--marquee-duration)_linear_infinite]',
        right: 'flex-row w-max animate-[marquee-x_var(--marquee-duration)_linear_infinite] [animation-direction:reverse]',
        // Vertical: track is flex-col, items stack along y; -50% on y.
        up: 'flex-col h-max animate-[marquee-y_var(--marquee-duration)_linear_infinite]',
        down: 'flex-col h-max animate-[marquee-y_var(--marquee-duration)_linear_infinite] [animation-direction:reverse]',
      },
      pauseOnHover: {
        true: 'group-hover:[animation-play-state:paused]',
        false: '',
      },
    },
    defaultVariants: {
      direction: 'left',
      pauseOnHover: true,
    },
  },
)

export type MarqueeVariants = VariantProps<typeof marqueeTrackVariants>

export interface MarqueeProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  direction?: MarqueeVariants['direction']
  speed?: keyof typeof SPEED_MAP
  pauseOnHover?: MarqueeVariants['pauseOnHover']
  children: ReactNode
}

// Render children + a hidden duplicate set with unique keys + aria-hidden
// so seamless looping doesn't double-announce content to screen readers.
function renderSet(
  children: ReactNode,
  setIndex: number,
): ReactNode {
  return Children.map(children, (child, i) => {
    if (!isValidElement(child)) return child
    const isDuplicate = setIndex === 1
    type ElProps = { key?: string | number; 'aria-hidden'?: boolean | 'true' | 'false' }
    return cloneElement(child as React.ReactElement<ElProps>, {
      key: `marquee-set${setIndex}-${i}`,
      ...(isDuplicate ? { 'aria-hidden': 'true' as const } : {}),
    })
  })
}

export const Marquee = forwardRef<HTMLDivElement, MarqueeProps>(
  ({ direction, speed = 'normal', pauseOnHover, className, children, style, ...rest }, ref) => {
    const cssVars = {
      '--marquee-duration': SPEED_MAP[speed],
    } as CSSProperties
    return (
      <div
        ref={ref}
        className={cn('group overflow-hidden', className)}
        {...rest}
      >
        <div
          className={marqueeTrackVariants({ direction, pauseOnHover })}
          style={{ ...cssVars, ...style }}
        >
          {renderSet(children, 0)}
          {renderSet(children, 1)}
        </div>
      </div>
    )
  },
)
Marquee.displayName = 'Marquee'

export default Marquee

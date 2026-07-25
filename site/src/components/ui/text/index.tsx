import { cva, type VariantProps } from 'class-variance-authority'
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementType,
  type ReactElement,
  type Ref,
} from 'react'

import { cn } from '../_utils/cn'

// B2 Text — body typography primitive.
//
// Probe-driven decisions (Hard Rule #2 — see scripts/design/probe-text-styles.mjs):
//
//   - 5 representative pages × 3 breakpoints (375 / 768 / 1440px). 4
//     distinct body-text size signatures earn ≥3-instance variant
//     inventory (per the variant-inventory threshold rule).
//
//   - Sizes (probe-derived):
//       default — 16px desktop / weight 400 / 1.5 lh — 214× DOMINANT
//                 (bare <p> across every page)
//       small   — 14px desktop / weight 400 / 1.5 lh — 29×
//                 (.answer-faq accordion bodies 24× + .body-14 hero notes 5×)
//       lead    — 18px desktop / weight 400 / 1.5 lh — 8×
//                 (.large-p footer 5× + .mh-5ch card leads 3×)
//       large   — 20px desktop / weight 500 / 1.5 lh — 28×
//                 (testimonial-card bodies, .company-testimonies-wrap chassis)
//
//   - No tone axis. Color variation observed in CE (white on dark, muted
//     rgba, brand-accent yellow) is surface-context and applies at
//     template level via className — same convention locked at B1 Heading.
//
//   - Mobile/tablet sizes scale ~5% smaller in CE (likely root font-size
//     adjustment). Universal sizing chosen for our system — visually
//     imperceptible delta and matches Heading's universal-size pattern
//     (e.g. h1 = 48px on all viewports post-DEV-13).
//
//   - Weight: default sizes use 400 (regular); large uses 500 (medium —
//     CE testimonial weight). Encoded per-variant in CVA.
//
// Locked decisions:
//
//   1. Polymorphic `as` reuses Card / Heading pattern (forwardRef +
//      restricted-set + per-element prop typing).
//
//   2. `as` defaults to 'p' (the dominant case — consumer overrides for
//      inline 'span' or emphasis 'em' / 'strong' / 'div'). Differs from
//      Heading where `as` is required because semantic h1-h6 choice
//      always matters; for body text 'p' is overwhelmingly correct.
//
//   3. `size` defaults to 'default' (the 214× dominant variant).

const textVariants = cva(
  ['leading-default text-text-default'],
  {
    variants: {
      size: {
        default: 'text-body font-normal',
        small:   'text-body-sm font-normal',
        lead:    'text-body-lead font-normal',
        large:   'text-body-large font-medium',
      },
    },
    defaultVariants: { size: 'default' },
  },
)

export type TextVariants = VariantProps<typeof textVariants>
export type TextSize = NonNullable<TextVariants['size']>

type TextElement = 'p' | 'span' | 'div' | 'em' | 'strong'

type TextOwnProps = {
  size?: TextSize
  className?: string
  children?: React.ReactNode
}

export type TextProps<E extends TextElement = 'p'> =
  & TextOwnProps
  & { as?: E }
  & Omit<ComponentPropsWithoutRef<E>, keyof TextOwnProps | 'as'>

function TextRender<E extends TextElement = 'p'>(
  { as, size, className, children, ...rest }: TextProps<E>,
  ref: Ref<HTMLElement>,
) {
  const Component = (as || 'p') as ElementType
  return (
    <Component
      ref={ref}
      className={cn(textVariants({ size }), className)}
      {...rest}
    >
      {children}
    </Component>
  )
}

// forwardRef + restricted-polymorphic cast — locked at HALT 2 (Card),
// reused at HALT 3 (Heading), here at B2.
export const Text = forwardRef(TextRender) as (<E extends TextElement = 'p'>(
  props: TextProps<E> & { ref?: Ref<HTMLElement> },
) => ReactElement | null) & { displayName?: string }

Text.displayName = 'Text'

export default Text

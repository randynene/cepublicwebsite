import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type HTMLAttributes } from 'react'

import { cn } from '../_utils/cn'

// E4 Divider — separator primitive (autonomous batch).
//
// Probe finding (Hard Rule #2 — see scripts/design/probe-divider-styles.mjs):
//
//   - ZERO native <hr> or .divider/.separator-class elements observed
//     across 5 representative CE pages. CE delineates content via card
//     borders + section background contrast + whitespace; no explicit
//     dividers are part of the design language.
//
//   - DEV-N: ships against modern accessible defaults consistent with our
//     existing border-color pattern. brand-tertiary @10% matches the Card
//     border (HALT 2 lock) and the AccordionItem border-top (A5) — visual
//     coherence with the rest of the system rather than introducing a new
//     border color for one primitive.
//
//   - Horizontal: <hr> (HTML's implicitly-horizontal separator with
//     correct semantic + a11y treatment).
//   - Vertical: <span role="separator" aria-orientation="vertical">
//     (HTML <hr> is implicitly horizontal-only; for inline-flow vertical
//     bars between buttons/breadcrumbs, role+aria pattern is canonical).
//
//   - Server component (no 'use client') — pure rendering.

const dividerVariants = cva(
  // Shared base — border in brand-tertiary @10% matching Card / Accordion.
  ['border-0 bg-brand-tertiary/10'],
  {
    variants: {
      orientation: {
        // Horizontal — full-width 1px line. my-0 by default; consumer
        // applies vertical rhythm via className override.
        horizontal: 'h-px w-full',
        // Vertical — narrow 1px column for inline separator. mx-0 by default;
        // consumer sets height (h-N) via className.
        vertical: 'inline-block w-px h-full self-stretch',
      },
    },
    defaultVariants: { orientation: 'horizontal' },
  },
)

export type DividerVariants = VariantProps<typeof dividerVariants>

// Two underlying element shapes — <hr> for horizontal, <span> for vertical.
// Discriminated union not strictly necessary (orientation is a single string
// prop) but the rendered tag differs, so type ref-target accordingly.
export interface DividerProps
  extends Omit<HTMLAttributes<HTMLHRElement | HTMLSpanElement>, 'role' | 'aria-orientation'> {
  orientation?: DividerVariants['orientation']
}

export const Divider = forwardRef<HTMLHRElement | HTMLSpanElement, DividerProps>(
  ({ orientation = 'horizontal', className, ...rest }, ref) => {
    if (orientation === 'vertical') {
      return (
        <span
          ref={ref as React.Ref<HTMLSpanElement>}
          role="separator"
          aria-orientation="vertical"
          className={cn(dividerVariants({ orientation }), className)}
          {...rest}
        />
      )
    }
    return (
      <hr
        ref={ref as React.Ref<HTMLHRElement>}
        // <hr> is implicitly role="separator" aria-orientation="horizontal" —
        // browsers/screen readers pick up the semantic; no explicit attrs needed.
        className={cn(dividerVariants({ orientation }), className)}
        {...rest}
      />
    )
  },
)
Divider.displayName = 'Divider'

export default Divider

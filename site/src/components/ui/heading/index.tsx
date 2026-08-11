import { cva, type VariantProps } from 'class-variance-authority'
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementType,
  type ReactElement,
  type Ref,
} from 'react'

import { cn } from '../_utils/cn'

// B1 Heading — typography primitive (HALT 3).
//
// Probe-driven decisions (Hard Rule #2 — see scripts/design/probe-heading-styles.mjs):
//
//   - 5 representative pages × 3 breakpoints (375 / 768 / 1440px). One <h1>
//     per page (canonical SEO). 4 of 5 pages render the page <h1> as
//     `<h1 class="u-h2">` (48px desktop, NOT the hero size). Only the
//     homepage uses a true hero-sized <h1> (68.8px desktop, 1× across the
//     entire site).
//
//   - CE explicitly decouples semantic tag from visual size via utility
//     classes (`u-h1`, `u-h2`, `u-h3`, etc.). The Heading API mirrors that:
//     `as` carries the semantic tag, `size` carries the visual treatment.
//
//   - Six visual size categories (probe-derived):
//       display — 60px desktop ("Ready to hire" CTA, 5×)
//       h1      — 48px desktop (bare h2 + u-h2 h1, 24× — DOMINANT)
//       h2      — 40px desktop (u-h3 h2 + bare h3, 9×)
//       h4      — 24px desktop (h4 + h5.comp + h6.cc-yellow, 15×)
//       eyebrow — 18px desktop (h5.label-bold ai/blue/black, 3×)
//
//     Single-instance values (h3 30px outlier, hero h1 68.8px) are NOT
//     primitive variants — they live in template-level className overrides
//     per the variant-inventory threshold rule (≥3 distinct CE instances
//     required for primitive inventory).
//
//   - Note on h3: the h3 size variant is intentionally absent. CE's typical
//     h3 element renders at the h2 visual (40px). Use <Heading as="h3">
//     (defaults to size="h2"). The single 30px instance found in the probe
//     was a styled-down h4 (.u-h3 smaller), not a true h3 visual. If a
//     template needs 30px specifically, override via className.
//
// HALT 3 locked decisions:
//
//   1. Cascade encoding: ENCAPSULATED (Option A). Each `size` variant
//      ships its full responsive cascade inside CVA. Consumer writes
//      `<Heading size="h1">` and gets the right mobile→tablet→desktop
//      progression automatically. Override path: className for one-off
//      adjustments (e.g. homepage hero `className="lg:text-7xl"`).
//
//   2. `as` and `size` are independent axes. `as` defaults to required;
//      `size` defaults via runtime mapping (NOT CVA defaultVariants — CVA
//      can only set one default per axis). Mapping:
//        as="h1" → size="h1"
//        as="h2" → size="h2"
//        as="h3" → size="h2" (h3 size variant dropped per HALT 3 Q3;
//                              closest visual neighbor)
//        as="h4" → size="h4"
//        as="h5" → size="h4"
//        as="h6" → size="h4"
//        as="span"|"p" → size="h4"
//
//   3. Polymorphic `as` reuses the Card-locked pattern (forwardRef +
//      restricted-set + per-element prop typing).

const headingVariants = cva(
  // Shared base — colour + family inherited from html; weight here.
  ['font-medium text-text-default'],
  {
    variants: {
      size: {
        // 5× CE — section CTA heading. Two-breakpoint cascade.
        display: 'text-display-mobile md:text-display-tablet lg:text-display leading-snug',
        // Visible marketing-page H1. One fluid 40px → 60px treatment sitewide.
        hero: 'text-marketing-hero',
        // 24× CE — page title / dominant section heading. Cascade post DEV-13:
        // mobile/tablet/desktop all 48px (single visual; lg: kept for future flex).
        h1: 'text-h1 lg:text-h1-desktop leading-snug',
        // 9× CE — section subhead. Cascade jumps at 992px.
        h2: 'text-h2 lg:text-h2-desktop leading-relaxed',
        // 15× CE — card heading / minor heading. No breakpoint jump.
        h4: 'text-h4 leading-relaxed',
        // 3× CE — kicker / overline. NOT uppercase (probe-verified). 18px.
        eyebrow: 'text-eyebrow leading-default',
      },
    },
    defaultVariants: { size: 'h1' },
  },
)

export type HeadingVariants = VariantProps<typeof headingVariants>
export type HeadingSize = NonNullable<HeadingVariants['size']>

type HeadingElement = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'span' | 'p'

// Runtime as-to-size default mapping. CVA's defaultVariants sets a single
// fallback (we use 'h1') but the spec wants the default to track the
// semantic tag. Resolved per-call before the CVA invocation.
function defaultSizeFor(as: HeadingElement): HeadingSize {
  switch (as) {
    case 'h1':
      return 'h1'
    case 'h2':
      return 'h2'
    case 'h3':
      // h3 size variant dropped at HALT 3 Q3 (single-instance CE outlier).
      // Closest visual neighbor = h2.
      return 'h2'
    case 'h4':
    case 'h5':
    case 'h6':
      return 'h4'
    case 'span':
    case 'p':
      return 'h4'
  }
}

type HeadingOwnProps = {
  size?: HeadingSize
  className?: string
  children?: React.ReactNode
}

export type HeadingProps<E extends HeadingElement = 'h1'> =
  & HeadingOwnProps
  & { as: E }
  & Omit<ComponentPropsWithoutRef<E>, keyof HeadingOwnProps | 'as'>

function HeadingRender<E extends HeadingElement = 'h1'>(
  { as, size, className, children, ...rest }: HeadingProps<E>,
  ref: Ref<HTMLElement>,
) {
  const Component = as as ElementType
  const effectiveSize = size ?? defaultSizeFor(as)
  return (
    <Component
      ref={ref}
      className={cn(headingVariants({ size: effectiveSize }), className)}
      {...rest}
    >
      {children}
    </Component>
  )
}

// forwardRef + restricted-polymorphic cast — same pattern locked at HALT 2
// for Card. Cast preserves per-element prop typing at the call site.
export const Heading = forwardRef(HeadingRender) as (<E extends HeadingElement = 'h1'>(
  props: HeadingProps<E> & { ref?: Ref<HTMLElement> },
) => ReactElement | null) & { displayName?: string }

Heading.displayName = 'Heading'

export default Heading

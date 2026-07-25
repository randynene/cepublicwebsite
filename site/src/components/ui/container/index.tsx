import { cva, type VariantProps } from 'class-variance-authority'
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementType,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react'

import { cn } from '../_utils/cn'

// E3 Container — layout chassis (HALT 8 first-of-kind).
//
// Probe-driven decisions (Hard Rule #2 — see scripts/design/probe-container-styles.mjs):
//
//   - 5 representative pages × 4 viewports (375 / 768 / 1440 / 1920px).
//
//   - Three distinct max-width variants emerge:
//       default — 1384px (CE class `.container`, 35× DOMINANT)
//       wide    — 1440px (CE class `.container.cc-hero`, 4×; full-edge hero)
//       narrow  — 1100px (CE class `.container-1100px`, 4×; article width)
//     Plus full-bleed for decorative backgrounds (3× CE: `.hero-img`,
//     `.blue-bg`, etc.) — represented as `width="full"` (no max-width).
//
//   - Padding cascade observed on `default` variant only:
//       mobile (375px): 22.7px h-padding (≈ px-6 = 24px)
//       tablet (768px): 30.3px (≈ px-8 = 32px)
//       desktop (1440px+): 32px (exact px-8)
//     Sub-2px discrepancy from CE rounded to clean Tailwind utilities;
//     visually imperceptible. `wide`/`narrow`/`full` have NO padding —
//     matches CE pattern (those variants render edge-to-edge with internal
//     padding handled by children).
//
//   - Grids stay OUT of Container per HALT 8 Decision 4 — probe shows 13
//     grids dominantly 2-col footer (10×) with 3 one-offs. Per-layout
//     variation; not a Container concern. Templates compose
//     <Container><div className="grid grid-cols-2 gap-4">...</div></Container>.
//
// HALT 8 locked decisions (6 total):
//
//   1. 4-variant `width` axis: default / wide / narrow / full
//   2. Padding cascade rounded to Tailwind utilities (px-6 sm:px-8) on
//      default only — sub-2px CE discrepancy acceptable
//   3. Polymorphic `as` prop with 6-element restricted enum:
//      div | section | article | main | header | footer
//   4. Grids excluded from Container (per-layout concern)
//   5. ARBITRARY VALUES for max-width in CVA (not tokens) — bulletproof
//      against Tailwind v4 --container-* namespace ambiguity, visibly
//      self-documenting in source. Token discipline boundary: a 3-value
//      width axis used in exactly one primitive doesn't earn token
//      abstraction; arbitrary values are the right choice here.
//   6. Server component — no 'use client'. Pure rendering, no hooks/state.

const containerVariants = cva(
  // Shared base — center horizontally, mx-auto only meaningful when
  // max-width caps the rendered width (default/wide/narrow); harmless
  // on full-bleed (no max-width to constrain).
  ['mx-auto w-full'],
  {
    variants: {
      width: {
        // 1100px — narrow / article-width (CE: .container-1100px, 4×).
        narrow: 'max-w-[1100px]',
        // 1384px — DOMINANT (CE: .container, 35×) + responsive padding cascade.
        // px-6 (24px) at <480px → px-8 (32px) at sm: (≥480px in our system).
        default: 'max-w-[1384px] px-6 sm:px-8',
        // 1440px — full-edge hero (CE: .container.cc-hero, 4×).
        wide: 'max-w-[1440px]',
        // No max-width — full-bleed (CE: .hero-img / .blue-bg, 3×).
        full: '',
      },
    },
    defaultVariants: { width: 'default' },
  },
)

export type ContainerVariants = VariantProps<typeof containerVariants>

type ContainerElement = 'div' | 'section' | 'article' | 'main' | 'header' | 'footer'

type ContainerOwnProps = {
  width?: ContainerVariants['width']
  className?: string
  children?: ReactNode
}

export type ContainerProps<E extends ContainerElement = 'div'> =
  & ContainerOwnProps
  & { as?: E }
  & Omit<ComponentPropsWithoutRef<E>, keyof ContainerOwnProps | 'as'>

function ContainerRender<E extends ContainerElement = 'div'>(
  { as, width, className, children, ...rest }: ContainerProps<E>,
  ref: Ref<HTMLElement>,
) {
  const Component = (as || 'div') as ElementType
  return (
    <Component
      ref={ref}
      className={cn(containerVariants({ width }), className)}
      {...rest}
    >
      {children}
    </Component>
  )
}

// forwardRef + restricted-polymorphic cast — locked at HALT 2 (Card),
// reused at HALT 3 (Heading), B2 (Text), and here at HALT 8.
export const Container = forwardRef(ContainerRender) as (<E extends ContainerElement = 'div'>(
  props: ContainerProps<E> & { ref?: Ref<HTMLElement> },
) => ReactElement | null) & { displayName?: string }

Container.displayName = 'Container'

export default Container

'use client'

import { createElement, type CSSProperties, type ElementType, type ReactNode } from 'react'

import { cn } from '@/components/ui/_utils/cn'
import { useInView } from './use-in-view'

type RevealVariant = 'rise' | 'scale' | 'pop' | 'scale-x'

interface RevealProps {
  /** Tag/component to render as. Defaults to 'div'. */
  as?: ElementType
  /** Optional — decorative reveal targets (e.g. a progress-bar fill) render no children. */
  children?: ReactNode
  /** Stagger delay in ms (applied as --reveal-delay). */
  delay?: number
  /**
   * Entrance style — all defined in globals.css motion-layer block:
   *  - 'rise'    (default) fade + translateY(16px → 0). General sections.
   *  - 'scale'   fade + scale(scaleFrom → 1). Photo/video cards.
   *  - 'pop'     scale(0.7 → 1) while holding a fixed `rotate` — for
   *              elements that already sit at a permanent tilt (e.g. the
   *              calculator's "Save" badge).
   *  - 'scale-x' scaleX(0 → 1) from the left edge, opacity untouched — for
   *              decorative progress-bar fills (no width/height animated,
   *              so this can never cause CLS).
   */
  variant?: RevealVariant
  /** Starting scale for variant="scale" (default 0.96, set via CSS var). */
  scaleFrom?: number
  /** Fixed rotation in degrees, preserved through variant="pop". */
  rotate?: number
  className?: string
  style?: CSSProperties
}

type RevealCSSVars = CSSProperties & {
  '--reveal-delay'?: string
  '--reveal-scale-from'?: string
  '--reveal-rotate'?: string
}

/**
 * Progressive-enhancement reveal wrapper. The hidden state only activates
 * once BOTH `html.motion-ready` is present (see motion-ready.tsx) AND the
 * user has no reduced-motion preference — so no-JS and reduced-motion users
 * always see final, fully visible, unshifted content on first paint. Fires
 * once via useInView; never re-triggers on scroll-up. Animates only
 * transform + opacity (no CLS).
 */
export function Reveal({
  as = 'div',
  children,
  delay = 0,
  variant = 'rise',
  scaleFrom,
  rotate,
  className,
  style: styleProp,
  ...rest
}: RevealProps & Record<string, unknown>) {
  const [ref, inView] = useInView<HTMLElement>()

  // Merge the caller's own style (e.g. a per-instance border) with the
  // reveal CSS vars — must NOT let ...rest below clobber this object.
  const style: RevealCSSVars = { ...styleProp }
  if (delay) style['--reveal-delay'] = `${delay}ms`
  if (scaleFrom !== undefined) style['--reveal-scale-from'] = String(scaleFrom)
  if (rotate !== undefined) style['--reveal-rotate'] = `${rotate}deg`

  return createElement(
    as,
    {
      ref,
      className: cn('reveal', inView && 'is-in-view', className),
      'data-reveal-variant': variant === 'rise' ? undefined : variant,
      style,
      ...rest,
    },
    children,
  )
}

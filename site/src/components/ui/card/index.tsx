import { cva, type VariantProps } from 'class-variance-authority'
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementType,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react'

import { cn } from '../_utils/cn'

// A4 Card — compound primitive (HALT 2).
//
// Probe-driven decisions (Hard Rule #2 — see scripts/design/probe-card-styles.mjs):
//
//   - 167 card-shaped containers across 5 representative pages.
//     ZERO matches by class-token (`*-card*`) — brief inventory was wrong.
//     All matches come from structural fingerprint (radius + padding +
//     border-or-shadow-or-distinct-bg).
//
//   - 4 distinct visual signatures, ALL with radius=24px and ZERO box-shadow.
//     CE is shadowless on cards.
//
//   - Brief asserted variants `content | featured | bordered`. Probe revealed
//     `default | muted | accent`, then accent was reclassified as a separate
//     section-CTA Banner (deferred to Step 4) — leaving `default | muted`.
//       * default (138× = Pattern A 108 + Pattern B 30): white surface +
//         subtle navy border (Pattern A: 10% navy; Pattern B: transparent —
//         folded into one tone with the visible-border treatment).
//       * muted (24× = Pattern C): #f9f9f9 surface + faint teal border —
//         testimonial chassis.
//
//   - Routability: 0 of 167 cards are themselves <a> elements. Cards CONTAIN
//     inner anchors (Link primitive composed inside CardContent or
//     CardFooter). Whole-card clickability is a Step-4 template-level concern,
//     achieved via <Link href><Card/></Link> wrapping. Card stays inert
//     (renders as <div>/<article>/<section>/<li>/<figure> per `as` prop).
//
//   - Bleed-vs-padded: 0 of 162 default+muted cards bleed images to the
//     border-radius edge. 100% are padded. CardHeader defaults to padded
//     (24px); `bleed` is opt-in for hero-style cards in Step 4 templates.
//
// Compound API decisions (HALT 2 locked):
//
//   1. Slot naming: Card / CardHeader / CardContent / CardFooter.
//      (CardContent over CardBody to avoid <body>-element semantic collision;
//      shadcn / MUI convention.)
//
//   2. Default export: Card only. Slots are named exports.
//
//   3. CVA strategy: ROOT-ONLY CVA. Slots are layout-only utility wrappers
//      with no per-slot CVA. Promote to per-slot CVA only when Step-4
//      template work surfaces actual divergence — avoid pre-emptive
//      per-slot variant logic.
//
//   4. Element shape: polymorphic `as` prop, default 'div'. Allowed values:
//      'div' | 'article' | 'section' | 'li' | 'figure'. Template authors pick
//      the semantic element where appropriate (<Card as="article"> for blog
//      posts, default <div> for stat tiles). No discriminated union — `as`
//      has no hard prerequisite, unlike Tag's href-driven span/anchor split.
//
//   5. Padding-on-slots, not padding-on-root: Card root has no internal
//      padding. Each slot owns its own padding (CardHeader 24px / opt-in
//      bleed 0; CardContent 24px; CardFooter 24px). 24px is the dominant
//      observed value (Pattern A, 108× CE); Pattern B (16px) and Pattern C
//      (60/40/24px) are minor variations templates can override via
//      className.
//
//   6. overflow-hidden on Card root: defensive — keeps CardHeader bleed=true
//      images clipped to the rounded corners. Cheap, safe, matches shadcn.

// =============================================================================
// Card root — polymorphic, tone-driven
// =============================================================================

const cardVariants = cva(
  [
    'flex flex-col',
    'rounded-lg overflow-hidden',
  ],
  {
    variants: {
      tone: {
        // Pattern A + B (138× CE) — white surface, subtle navy border.
        default: 'bg-surface-elevated border border-brand-tertiary/10',
        // Pattern C (24× CE) — testimonial chassis: muted gray + faint teal border.
        muted: 'bg-surface-base border border-brand-primary/5',
      },
    },
    defaultVariants: { tone: 'default' },
  },
)

export type CardVariants = VariantProps<typeof cardVariants>

type CardElement = 'div' | 'article' | 'section' | 'li' | 'figure'

type CardOwnProps = {
  tone?: CardVariants['tone']
  className?: string
  children?: ReactNode
}

export type CardProps<E extends CardElement = 'div'> =
  & CardOwnProps
  & { as?: E }
  & Omit<ComponentPropsWithoutRef<E>, keyof CardOwnProps | 'as'>

function CardRender<E extends CardElement = 'div'>(
  { as, tone, className, children, ...rest }: CardProps<E>,
  ref: Ref<HTMLElement>,
) {
  const Component = (as || 'div') as ElementType
  return (
    <Component
      ref={ref}
      className={cn(cardVariants({ tone }), className)}
      {...rest}
    >
      {children}
    </Component>
  )
}

// forwardRef + restricted-polymorphic cast: the cast is required because
// forwardRef's generic inference doesn't propagate the `E extends CardElement`
// constraint through to the consumer's prop typing. The cast preserves
// per-element prop typing at the call site (e.g. <Card as="li" value={1} />).
export const Card = forwardRef(CardRender) as (<E extends CardElement = 'div'>(
  props: CardProps<E> & { ref?: Ref<HTMLElement> },
) => ReactElement | null) & { displayName?: string }

Card.displayName = 'Card'

// =============================================================================
// CardHeader — opt-in `bleed` for edge-to-edge images
// =============================================================================

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * When true, removes header padding so child media (image, video poster)
   * extends to the card border-radius edge. Default false (probe: 0/162 CE
   * cards bleed; padded is the universal CE pattern).
   */
  bleed?: boolean
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ bleed, className, children, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn(bleed ? '' : 'p-6', className)}
      {...rest}
    >
      {children}
    </div>
  ),
)
CardHeader.displayName = 'CardHeader'

// =============================================================================
// CardContent — primary text/content zone
// =============================================================================

export type CardContentProps = HTMLAttributes<HTMLDivElement>

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...rest }, ref) => (
    <div ref={ref} className={cn('p-6', className)} {...rest}>
      {children}
    </div>
  ),
)
CardContent.displayName = 'CardContent'

// =============================================================================
// CardFooter — action / supplementary zone
// =============================================================================

export type CardFooterProps = HTMLAttributes<HTMLDivElement>

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...rest }, ref) => (
    <div ref={ref} className={cn('p-6', className)} {...rest}>
      {children}
    </div>
  ),
)
CardFooter.displayName = 'CardFooter'

export default Card

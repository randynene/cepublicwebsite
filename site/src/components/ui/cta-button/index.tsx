import { cva, type VariantProps } from 'class-variance-authority'
import Link from 'next/link'
import {
  forwardRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
} from 'react'

import { cn } from '../_utils/cn'

// ACCENT CHIP CLUSTER (Jul 2026) — the two CTA archetypes from the header 1E
// reference (docs/design/raw-html/1e-header-reference.html).
//
//   solid   — "Schedule a Call". Lime pill, dark label, trailing arrow tucked
//             against the label. On hover a deeper lime sweeps left-to-right,
//             the arrow slides out, and the pill lifts on a lime shadow.
//   outline — "For Engineers". Transparent chip with a lime hairline border
//             and lime label. On hover lime sweeps in and the label flips dark.
//
// Both share ONE hover language, defined in globals.css under `.cta-sweep`.
// The fill is a `background-position` slide over an oversized two-stop
// gradient rather than a `::before` overlay — see the comment block there.
//
// This is a SEPARATE archetype from MegaMenuPillLabel / `.sf-*`, which keeps
// driving mega-menu section pills, footer pills and template CTAs. Use this
// one wherever "For Engineers" or "Schedule a Call" appears, so those two read
// identically everywhere they show up.

// The trailing glyph is decorative; the label beside it carries the meaning.
// Declared as a constant so it is an expression rather than a JSX string
// literal (react/jsx-no-literals / UI_STRINGS rule).
const ARROW_GLYPH = '\u2192'

export const ctaButtonVariants = cva(
  [
    'cta-sweep',
    'inline-flex items-center justify-center',
    'rounded-pill whitespace-nowrap no-underline',
    // 15px/700 at a normal line-height keeps every variant over the 44px
    // minimum touch target without a hard-coded height.
    'text-[15px] font-bold leading-normal',
    'focus-visible:outline-none',
  ],
  {
    variants: {
      variant: {
        solid: 'cta-sweep-solid',
        outline: 'cta-sweep-outline',
      },
      // Two tiers, mobile-first: tightened padding by default, the reference's
      // full padding from 1360px up.
      //
      // The reference puts that boundary at 1200px because its mock carries
      // four nav links. Production carries five plus a 211px logo, so the
      // full-padding row only keeps a comfortable margin from ~1360px — which
      // is where "tighten before anything wraps" lands here. Below 1280px the
      // nav collapses to the drawer, so the tightened tier renders across
      // 1280-1359px only.
      //
      // Arbitrary values throughout: this project's Tailwind `--spacing`
      // scalar is 0.5rem, so `py-3` would be 24px, not the 12px the reference
      // calls for (tokens.css §Spacing says component-level spacing uses
      // arbitrary values for exactly this reason).
      size: {
        solid:
          'py-[11px] px-[18px] min-[1360px]:py-[12px] min-[1360px]:px-[24px]',
        outline:
          'py-[10px] px-[18px] min-[1360px]:py-[11px] min-[1360px]:px-[20px]',
      },
      // Full-width stacked button (mobile drawer). Suppresses the hover
      // padding trade so a centred label cannot shift.
      block: {
        true: 'cta-sweep-block w-full',
        false: '',
      },
    },
    defaultVariants: {
      block: false,
    },
  },
)

export type CtaButtonVariant = NonNullable<
  VariantProps<typeof ctaButtonVariants>['variant']
>

type CommonProps = {
  label: string
  variant: CtaButtonVariant
  /** Render full-width — used for the stacked pair in the mobile drawer. */
  block?: boolean
  className?: string
}

type AnchorProps = CommonProps
  & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>
  & { as?: 'a'; href: string; external?: boolean }

type ButtonProps = CommonProps
  & ButtonHTMLAttributes<HTMLButtonElement>
  & { as: 'button'; href?: never; external?: never }

export type CtaButtonProps = AnchorProps | ButtonProps

// Strip locally-consumed keys so the remainder is safe to spread onto the
// underlying element. Same helper shape as MegaMenuPillLabel.
const OWN_KEYS = new Set([
  'label',
  'variant',
  'block',
  'className',
  'as',
  'href',
  'external',
])

function htmlAttrs(props: object): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(props)) {
    if (OWN_KEYS.has(key)) continue
    out[key] = value
  }
  return out
}

export const CtaButton = forwardRef<
  HTMLAnchorElement | HTMLButtonElement,
  CtaButtonProps
>((props, ref) => {
  const { label, variant, block, className } = props

  const inner = (
    <>
      <span className="relative -top-px">{label}</span>
      {variant === 'solid' ? (
        <span aria-hidden="true" className="relative -top-px text-[16px] font-extrabold">
          {ARROW_GLYPH}
        </span>
      ) : null}
    </>
  )

  const classes = cn(
    ctaButtonVariants({ variant, size: variant, block: block ?? false }),
    className,
  )

  if (props.as === 'button') {
    const buttonAttrs = htmlAttrs(props) as ButtonHTMLAttributes<HTMLButtonElement>
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type={props.type ?? 'button'}
        className={classes}
        {...buttonAttrs}
      >
        {inner}
      </button>
    )
  }

  const anchorAttrs = htmlAttrs(props) as AnchorHTMLAttributes<HTMLAnchorElement>

  if (props.external) {
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={props.href}
        className={classes}
        target="_blank"
        rel="noopener noreferrer"
        {...anchorAttrs}
      >
        {inner}
      </a>
    )
  }

  return (
    <Link
      ref={ref as React.Ref<HTMLAnchorElement>}
      href={props.href}
      className={classes}
      {...anchorAttrs}
    >
      {inner}
    </Link>
  )
})

CtaButton.displayName = 'CtaButton'

export default CtaButton

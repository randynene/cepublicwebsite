import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type ButtonHTMLAttributes } from 'react'

import { cn } from '../_utils/cn'

export const buttonVariants = cva(
  // Shared base — all variants get these.
  // - rounded-button alias (= rounded-pill = 9999px) per Step 1 TOKENS §4 button-alias decision.
  // - font-medium maps to --font-weight-medium (500) — matches CE primary-button observed weight.
  // - transition uses --duration-reveal + --ease-reveal Tailwind aliases (Step 1 motion §7.2 dual-consumer pattern).
  // - focus-visible ring: ring-2 + ring-offset-2 + ring-ring (--color-ring alias to brand-primary).
  // - aria-busy disables pointer-events while loading.
  [
    'inline-flex items-center justify-center gap-2',
    'rounded-button font-medium leading-default whitespace-nowrap',
    'transition duration-reveal ease-reveal',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring',
    'disabled:opacity-50 disabled:pointer-events-none',
    'aria-busy:opacity-70 aria-busy:pointer-events-none',
  ],
  {
    variants: {
      variant: {
        // Primary (lime pill). D2: lime fill ALWAYS carries dark text (spec
        // §3/§6) — never white on lime. Variant name kept (DEV-1); the full
        // circular-dark-icon pill shape + lime glow is a D4 shape-edit.
        // SWEEP-CTA (Jul 2026): `sf sf-p` is the shared sweep-fill mechanic
        // (globals.css) — every filled CTA site-wide uses it. -teal and
        // -yellow both render as the one "primary" treatment now; the old
        // alt-lime distinction is superseded by the sweep-fill standard
        // (these two names were already flagged stale, see Tech Debt #D4).
        'primary-teal': 'sf sf-p',
        'primary-yellow': 'sf sf-p',
        // Navy pill — dark-ground fill. SWEEP-CTA secondary treatment: dark
        // base, lime sweep-in, content flips to ink.
        'primary-navy': 'sf sf-s',
        // Icon-only — square shape, no text, not a CTA archetype in the
        // sweep-fill brief. Keeps its own simple hover-tint.
        'icon-only':
          'bg-transparent text-text-default hover:bg-text-default/10 active:bg-text-default/20',
      },
      size: {
        sm: 'text-body-sm px-2 py-1',          // 14px font; 16/8 padding
        md: 'text-body px-3 py-1.5',           // 16px font; 24/12 padding (matches CE primary-button)
        lg: 'text-body px-4 py-2',             // 16px font; 32/16 padding (hero CTAs)
      },
    },
    compoundVariants: [
      // Icon-only is square — symmetric padding, no horizontal asymmetry.
      { variant: 'icon-only', size: 'sm', class: 'p-1' },
      { variant: 'icon-only', size: 'md', class: 'p-1.5' },
      { variant: 'icon-only', size: 'lg', class: 'p-2' },
    ],
    defaultVariants: {
      variant: 'primary-teal',
      size: 'md',
    },
  },
)

export type ButtonVariants = VariantProps<typeof buttonVariants>

// Discriminated union: when variant === 'icon-only', aria-label is REQUIRED at the
// type level. Other variants accept aria-label optionally (inherited from ButtonHTMLAttributes).
// Brief Step 2 Locked Rules — Accessibility: "Icon-only buttons require aria-label
// prop (TypeScript-enforced)."
type BaseProps = {
  size?: ButtonVariants['size']
  loading?: boolean
}

type IconOnlyButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'>
  & BaseProps
  & { variant: 'icon-only'; 'aria-label': string }

type RegularButtonProps = ButtonHTMLAttributes<HTMLButtonElement>
  & BaseProps
  & { variant?: Exclude<NonNullable<ButtonVariants['variant']>, 'icon-only'> }

export type ButtonProps = IconOnlyButtonProps | RegularButtonProps

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => {
    const { variant, size, loading, disabled, className, children, ...rest } = props
    return (
      <button
        ref={ref}
        type={rest.type ?? 'button'}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(buttonVariants({ variant, size }), className)}
        {...rest}
      >
        {/* `.c` is the sweep-fill content layer (globals.css `.sf > .c`) —
            it sits above the fill and its colour inverts on hover/focus.
            Keeps the same flex gap/centering the button itself would have
            applied. */}
        <span className="c inline-flex items-center justify-center gap-2">
          {children}
        </span>
      </button>
    )
  },
)

Button.displayName = 'Button'

export default Button

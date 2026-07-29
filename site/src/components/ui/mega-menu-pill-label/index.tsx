import { cva, type VariantProps } from 'class-variance-authority'
import Link from 'next/link'
import {
  forwardRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from 'react'

import { Icon } from '../icon'
import { cn } from '../_utils/cn'

// MYGRATR-STATIC-3 Step 1 — pill-label primitive used across both
// mega-menus (Services / How It Works / Resources section pills) and
// the rebuilt Footer (Our Expertise / Learn more / Talent Locations
// section labels + Project Builds / AI Services bottom pills +
// "Contact us today" secondary CTA).
//
// Five variants per brief §2.3:
//   pill-green          — lime CTA fill, dark text. CE source token
//                         --color-brand-secondary (#dff46e).
//   pill-dark           — near-black fill, light text. Used for
//                         secondary mega-menu section headers.
//   pill-gradient       — purple-to-pink gradient. AI Services pill in
//                         Services mega-menu. Custom CSS background
//                         (no Tailwind utility — gradient stops are
//                         token-driven via inline style).
//   pill-navy           — brand-tertiary fill (#223c6c), light text.
//                         Product Builds pill in Services mega-menu.
//   pill-outline-light  — transparent bg + light border + light text.
//                         Used exclusively on dark backgrounds (navy
//                         footer). WCAG-AA contrast against
//                         --color-brand-tertiary verified at Step 5
//                         axe-core gate.
//   pill-outline-dark   — transparent bg + border-default (#32435F)
//                         border + white text. Header.html frame 03's
//                         uniform section-pill scheme (By Technology /
//                         AI Services / Product Builds) on the dark
//                         mega-menu panel. ADDITIVE (STATIC-3) — the
//                         mega-menu render layer maps seeded
//                         sectionLabelStyle values onto it; Sanity
//                         data untouched.
//
// `as` prop discriminates rendering:
//   - "a"      → next/link <Link href> for client-side nav (default
//                for section pills that ARE clickable links to
//                category pages, e.g. /services).
//   - "span"   → non-link decorative pill (used when Sanity provides
//                no sectionLink — confirmed for "Staff Augmentation"
//                left-column pill in audit-output/static-2/navigation.json).
//   - "button" → in-page action that does not navigate. ADDITIVE
//                (ASK-CLARA P1): `/ask` opens the booking canvas in
//                place rather than routing to /book-a-call, so its
//                Schedule-a-Call control has to be a real <button> for
//                keyboard and screen-reader users. Mirrors the same
//                escape hatch CtaButton already carries.
//
// `hasArrow` adds a trailing arrow glyph (sprite icon → next/link).
// Footer section labels (Our Expertise / Learn more) use hasArrow.
// Talent Locations does NOT (per docs/design/static-3-reference/footer.png).
//
// `size="cta"` — CANONICAL compact CTA pill site-wide. Matches the Header
// "Schedule a Call" control (~28px tall, 20px leading circle, 13px bold
// label). Every lime/outline CTA (footer, templates, subscribe) MUST use
// size="cta" — never ad-hoc large padding or the old 36px-circle treatment.

export const megaMenuPillLabelVariants = cva(
  [
    'inline-flex items-center',
    'rounded-pill whitespace-nowrap',
    'transition duration-reveal ease-reveal motion-reduce:transition-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring',
  ],
  {
    variants: {
      size: {
        default: 'gap-2 px-3 py-1.5 text-body-sm font-medium leading-default',
        // Header "Schedule a Call" reference — slim pill, 20px circle, 13px label.
        cta: 'gap-1.5 py-[4px] pl-[4px] pr-3.5 text-[13px] font-bold leading-none tracking-[-0.08px]',
      },
      // Rest-state colours only. SWEEP-CTA (Jul 2026) owns ALL hover
      // behaviour via the `sf`/`sf-*` classes added at render time (see
      // SWEEP_VARIANT_MAP below) — no `hover:` utility belongs in this cva
      // any more, it would fight the sweep-fill mechanic (globals.css).
      variant: {
        'pill-green': 'bg-brand-secondary text-text-dark',
        'pill-dark': 'bg-brand-tertiary text-text-on-dark',
        // Decorative gradient badge (AI Services) — not a CTA archetype in
        // the sweep-fill brief. Kept on its own simple opacity hover.
        'pill-gradient': 'text-text-on-dark hover:opacity-90',
        'pill-navy': 'bg-brand-tertiary text-text-on-dark',
        'pill-outline-light': 'text-text-on-dark',
        'pill-outline-dark': 'text-text-on-dark',
      },
    },
    compoundVariants: [
      {
        variant: 'pill-green',
        size: 'cta',
        class: 'bg-brand-primary text-text-dark shadow-[0_2px_8px_-3px_rgba(0,0,0,0.45)]',
      },
      {
        variant: 'pill-outline-dark',
        size: 'cta',
        class: 'px-[18px]',
      },
      {
        variant: 'pill-outline-light',
        size: 'cta',
        class: 'px-[18px]',
      },
    ],
    defaultVariants: {
      variant: 'pill-green',
      size: 'default',
    },
  },
)

export type MegaMenuPillLabelVariant = NonNullable<
  VariantProps<typeof megaMenuPillLabelVariants>['variant']
>

// SWEEP-CTA (Jul 2026) — maps each pill colour variant onto the shared
// sweep-fill mechanic (globals.css `.sf` + `.sf-p`/`.sf-g`/`.sf-s`). This is
// THE canonical site-wide CTA control (header Schedule-a-Call, footer CTAs,
// subscribe, mega-menu section pills, template CTAs) so fixing it here fixes
// every consumer at once. `pill-gradient` is excluded on purpose — it's a
// decorative AI-Services badge, not a call-to-action.
const SWEEP_VARIANT: Record<MegaMenuPillLabelVariant, 'sf-p' | 'sf-g' | 'sf-s' | null> = {
  'pill-green': 'sf-p',
  'pill-dark': 'sf-s',
  'pill-navy': 'sf-s',
  'pill-outline-light': 'sf-g',
  'pill-outline-dark': 'sf-g',
  'pill-gradient': null,
}

// pill-gradient renders via inline style so the gradient stops resolve
// from the design tokens at runtime (Tailwind v4 has no gradient
// utility that reads CSS var() stops cleanly — inline is the
// pragmatic substitute here, scoped to this single variant).
const GRADIENT_STYLE: React.CSSProperties = {
  backgroundImage:
    'linear-gradient(135deg, var(--color-pill-gradient-start) 0%, var(--color-pill-gradient-end) 100%)',
}

type CommonProps = {
  label: string
  variant: MegaMenuPillLabelVariant
  size?: NonNullable<VariantProps<typeof megaMenuPillLabelVariants>['size']>
  hasArrow?: boolean
  // Leading circle+arrow per Header.html frame 03/04 section pills.
  // Additive opt-in; default false preserves all existing usages.
  leadingArrow?: boolean
  // Custom glyph inside the leading circle (e.g. Team Member LinkedIn "in").
  leadingGlyph?: ReactNode
  className?: string
  children?: ReactNode
}

type AnchorProps = CommonProps
  & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>
  & { as: 'a'; href: string; external?: boolean }

type SpanProps = CommonProps
  & HTMLAttributes<HTMLSpanElement>
  & { as?: 'span'; href?: never }

type ButtonProps = CommonProps
  & ButtonHTMLAttributes<HTMLButtonElement>
  & { as: 'button'; href?: never; external?: never }

export type MegaMenuPillLabelProps = AnchorProps | SpanProps | ButtonProps

function ArrowGlyph() {
  // Sprite-based chevron-right rotated -45deg to read as ↗ (NE arrow).
  // Decorative; the surrounding label carries semantic meaning.
  return (
    <Icon
      name="chevron-right"
      size="sm"
      className="-rotate-45 shrink-0"
    />
  )
}

function LeadingCircle({
  sweepVariant,
  size,
  glyph,
}: {
  sweepVariant: 'sf-p' | 'sf-g' | 'sf-s' | null
  size: NonNullable<VariantProps<typeof megaMenuPillLabelVariants>['size']>
  glyph?: ReactNode
}) {
  const isCta = size === 'cta'
  const dimension = isCta ? 'h-5 w-5' : 'h-[26px] w-[26px]'

  // `.ic` (globals.css) inherits its rest/hover colours from the parent's
  // `sf-p`/`sf-g` class — no colour utilities needed here any more.
  if (sweepVariant === 'sf-p' || sweepVariant === 'sf-g') {
    return (
      <span
        aria-hidden="true"
        className={cn('ic inline-flex shrink-0 items-center justify-center', dimension)}
      >
        {glyph ?? (
          <Icon
            name="chevron-right"
            size="sm"
            className={cn(isCta ? 'size-2.5' : '', '-rotate-45')}
          />
        )}
      </span>
    )
  }

  // Secondary (sf-s) / no-sweep circles: bordered, lime glyph on transparent.
  // The brief doesn't specify an icon-circle inversion for the secondary
  // archetype, so this one stays static (only the label flips via `.c`).
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full border border-border-default bg-transparent text-brand-primary font-bold',
        dimension,
        isCta ? 'text-[13px]' : 'text-body-sm',
      )}
    >
      {glyph ?? (
        <Icon name="chevron-right" size="sm" className="-rotate-45" />
      )}
    </span>
  )
}

// Strip locally-consumed keys from props so the remainder is safe to
// spread onto the underlying HTML element. Kept as a small helper to
// avoid destructuring-with-_prefix patterns that the project's lint
// config flags as unused-vars (see lint rule local/no-unused-vars).
const OWN_KEYS = new Set([
  'label',
  'variant',
  'size',
  'hasArrow',
  'leadingArrow',
  'leadingGlyph',
  'external',
  'className',
  'children',
  'as',
])

function htmlAttrs(
  props: object,
  alsoStrip: readonly string[] = [],
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(props)) {
    if (OWN_KEYS.has(key)) continue
    if (alsoStrip.includes(key)) continue
    out[key] = value
  }
  return out
}

export const MegaMenuPillLabel = forwardRef<
  HTMLAnchorElement | HTMLSpanElement | HTMLButtonElement,
  MegaMenuPillLabelProps
>((props, ref) => {
  const {
    label,
    variant,
    size = 'default',
    hasArrow,
    leadingArrow,
    leadingGlyph,
    className,
    children,
  } = props
  const styleProp =
    variant === 'pill-gradient' ? GRADIENT_STYLE : undefined
  const sweepVariant = SWEEP_VARIANT[variant]
  // Label + trailing arrow + children share ONE `.c` layer so they invert
  // colour together on hover/focus (globals.css `.sf > .c`). The leading
  // icon circle is deliberately OUTSIDE `.c` — it inverts on its own via `.ic`.
  const inner = (
    <>
      {leadingArrow ? (
        <LeadingCircle
          sweepVariant={sweepVariant}
          size={size}
          glyph={leadingGlyph}
        />
      ) : null}
      <span className={cn(sweepVariant && 'c', 'inline-flex items-center gap-1.5')}>
        <span>{label}</span>
        {hasArrow ? <ArrowGlyph /> : null}
        {children}
      </span>
    </>
  )
  const pillClass = cn(
    megaMenuPillLabelVariants({ variant, size }),
    sweepVariant && ['sf', sweepVariant],
    className,
  )

  if (props.as === 'button') {
    const buttonAttrs = htmlAttrs(props) as ButtonHTMLAttributes<HTMLButtonElement>
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type={props.type ?? 'button'}
        style={styleProp}
        className={pillClass}
        {...buttonAttrs}
      >
        {inner}
      </button>
    )
  }

  if (props.as === 'a') {
    const anchorAttrs = htmlAttrs(props, ['href', 'external']) as AnchorHTMLAttributes<HTMLAnchorElement>
    if (props.external) {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={props.href}
          style={styleProp}
          className={pillClass}
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
        style={styleProp}
        className={pillClass}
        {...anchorAttrs}
      >
        {inner}
      </Link>
    )
  }

  return (
    <span
      ref={ref as React.Ref<HTMLSpanElement>}
      style={styleProp}
      className={pillClass}
      {...htmlAttrs(props)}
    >
      {inner}
    </span>
  )
})

MegaMenuPillLabel.displayName = 'MegaMenuPillLabel'

export default MegaMenuPillLabel

import { cva, type VariantProps } from 'class-variance-authority'
import NextLink from 'next/link'
import { forwardRef, type AnchorHTMLAttributes, type HTMLAttributes, type ReactNode } from 'react'

import { cn } from '../_utils/cn'

// A3 Tag primitive — categorical label, hand-built.
//
// Probe-driven decisions (Hard Rule #2 — see scripts/design/probe-link-tag-styles.mjs):
//   - 52 .tag instances enumerated (29 default + 23 cc-blue + 0 cc-yellow).
//     All 52 rendered as <div>, none routable. Probe is full-enumeration, not sampled.
//   - Tone inversion vs brief: default IS yellow (29×, bg #dff46e); cc-blue IS navy (23×).
//     cc-yellow has 0 matches → DROPPED (would be redundant with default).
//
// Routability decision (per Jake — Hard-Rule-#2-nuance protocol):
//   - CE renders decorative <div> with no anchor wrapping.
//   - But Tag content is blog category names ("Hiring Tips", "Scaling Teams", etc.)
//     mapping to blogCategory Sanity docs; categorical labels in a content site
//     SHOULD route to category pages (canonical IA + SEO + AEO).
//   - Migration improves on CE's decorative-div Webflow workaround per Decision D2
//     (functional + visual equivalence, not byte-equivalent rendering).
//
// Discriminated-union API:
//   - href absent → renders <span> (decorative; matches CE source structure)
//   - href present → renders <a> via next/link (routable; hover + focus ring)

const tagVariants = cva(
  [
    'inline-flex items-center',
    'px-2 py-0.5',
    'text-body-sm font-medium leading-default',
    'whitespace-nowrap',
  ],
  {
    variants: {
      tone: {
        // rounded-xs (4px) lives on the fill tones, not the shared base:
        // tailwind-merge does not know the custom --radius-* utilities, so a
        // base rounded-xs + tone rounded-pill both landed in the DOM and CSS
        // source-order let 4px win. Ghost-lime is the only pill tone.
        default: 'rounded-xs bg-brand-secondary text-text-dark',        // lime fill, dark text (spec §6)
        'cc-blue': 'rounded-xs bg-brand-tertiary text-text-on-dark',    // dark-ground fill, white text
        // Team Member.html .ce-chip / Video.html .ce-tag — ghost lime pills.
        // leading-none matches export line-height:1 (~13.5px cap height).
        'ghost-lime':
          'rounded-pill border border-brand-primary/25 bg-brand-primary/10 px-4 py-[9px] text-[14px] font-medium leading-none text-brand-primary',
      },
      // `interactive` toggles hover/focus-ring treatment. Routable mode sets it true.
      interactive: {
        true: 'transition duration-reveal ease-reveal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring',
        false: '',
      },
    },
    compoundVariants: [
      // Per-tone hover saturation when routable (single top-level opacity would dim text too).
      { tone: 'default', interactive: true, class: 'hover:bg-brand-secondary/85' },
      { tone: 'cc-blue', interactive: true, class: 'hover:bg-brand-tertiary/85' },
    ],
    defaultVariants: { tone: 'default', interactive: false },
  },
)

export type TagVariants = VariantProps<typeof tagVariants>

type SharedTagProps = {
  tone?: TagVariants['tone']
  className?: string
  children: ReactNode
}

// Decorative mode — no href, renders <span>.
type DecorativeTagProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children' | 'className'>
  & SharedTagProps
  & { href?: never; external?: never }

// Routable mode — href required, renders <a> via next/link.
type RoutableTagProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children' | 'className' | 'href'>
  & SharedTagProps
  & { href: string; external?: boolean }

export type TagProps = DecorativeTagProps | RoutableTagProps

export const Tag = forwardRef<HTMLSpanElement | HTMLAnchorElement, TagProps>(
  (props, ref) => {
    const { tone, className, children } = props

    // Discriminator: href presence narrows to RoutableTagProps.
    if ('href' in props && props.href !== undefined) {
      const { href, external, tone: _tone, className: _className, children: _children, ...anchorRest } = props
      const externalAttrs = external
        ? { target: '_blank', rel: 'noopener noreferrer' as const }
        : {}
      return (
        <NextLink
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={cn(tagVariants({ tone, interactive: true }), className)}
          {...externalAttrs}
          {...anchorRest}
        >
          {children}
        </NextLink>
      )
    }

    const { tone: _tone, className: _className, children: _children, ...spanRest } = props as DecorativeTagProps
    return (
      <span
        ref={ref as React.Ref<HTMLSpanElement>}
        className={cn(tagVariants({ tone, interactive: false }), className)}
        {...spanRest}
      >
        {children}
      </span>
    )
  },
)

Tag.displayName = 'Tag'

export default Tag

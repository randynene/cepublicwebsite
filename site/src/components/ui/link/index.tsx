import { cva, type VariantProps } from 'class-variance-authority'
import NextLink from 'next/link'
import { forwardRef, type AnchorHTMLAttributes, type ReactNode } from 'react'

import { cn } from '../_utils/cn'

// A2 Link primitive — inline text link, hand-built atop next/link.
//
// Probe-driven decisions (Hard Rule #2 — see scripts/design/probe-link-tag-styles.mjs):
//   - Probe found .txt-link (340×), .txt-link.cc-blue (50×), .txt-link.cc-white (30×).
//   - .txt-link-arrow: zero matches → cta-arrow variant DROPPED. Use composition:
//       <Link>text <Icon name="chevron-right" size="sm" /></Link>
//   - nav-link variant: 1026 matches but 7 distinct style sigs (no coherent variant) → DROPPED;
//     Step 4 NAV template will handle nav-context styling.
//   - After drops, variant axis collapses to single value → tone-axis-only per the
//     variant-naming meta-rule (Action 3 of HALT 1B): tone axis ONLY when tones compose
//     against a single visual variant.

const linkVariants = cva(
  // Shared base — all tones get these.
  // - inline-block doesn't override default <a> behavior; we leave display alone for inline composition.
  // - leading-default + font-medium match observed CE .txt-link styling.
  // - underline-offset-2 keeps hover underlines from clipping the descenders.
  // - transition timing via duration-reveal + ease-reveal.
  // - focus-visible ring matches Button.
  [
    'font-medium leading-default',
    'transition duration-reveal ease-reveal',
    'hover:underline underline-offset-2',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring',
  ],
  {
    variants: {
      tone: {
        // Default — CE source: `.txt-link` (340× across 5 pages). Brand teal.
        default: 'text-brand-primary hover:text-brand-primary/90',
        // cc-blue — CE source: `.txt-link.cc-blue` (50×). Navy on light surfaces.
        'cc-blue': 'text-brand-tertiary hover:text-brand-tertiary/90',
        // cc-white — CE source: `.txt-link.cc-white` (30×). White on dark surfaces.
        'cc-white': 'text-text-on-dark hover:text-text-on-dark/90',
      },
    },
    defaultVariants: { tone: 'default' },
  },
)

export type LinkVariants = VariantProps<typeof linkVariants>

// `children` is REQUIRED — every link needs visible text (or an Icon-bearing
// composition with a paired aria-label on the Link itself).
//
// `external` — when true, sets `target="_blank"` + `rel="noopener noreferrer"`.
// Defaults false. Consumers know best whether the URL is external; we don't
// auto-detect from href because the host-vs-origin check requires environment
// awareness (NEXT_PUBLIC_SITE_URL) that the primitive shouldn't carry.
export interface LinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children'>,
    LinkVariants {
  href: string
  children: ReactNode
  external?: boolean
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>((props, ref) => {
  const { tone, className, external, href, children, ...rest } = props
  const externalAttrs = external
    ? { target: '_blank', rel: 'noopener noreferrer' as const }
    : {}
  return (
    <NextLink
      ref={ref}
      href={href}
      className={cn(linkVariants({ tone }), className)}
      {...externalAttrs}
      {...rest}
    >
      {children}
    </NextLink>
  )
})

Link.displayName = 'Link'

export default Link

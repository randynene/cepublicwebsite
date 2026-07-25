import Link from 'next/link'

import { cn } from '@/components/ui/_utils/cn'

// Blog-family category pill. Spec §0.
//
// ONE token, two sizes, and no third. The spec singles this out because the pill
// appears on both the listing card and the article-page hero, and given two
// definitions it will drift: a pill that is a slightly different lime on the article
// page than on the card is the kind of thing nobody catches in review and everybody
// feels on the live site.
//
// `self-start w-fit` IS THE FIX, not a nicety. The card is a flex COLUMN, and a flex
// child stretches on the cross axis by default - so an `inline-flex` pill placed
// directly in one grows to the full column width and stops looking like a pill at all.
// It only behaved on the default card because that one happened to wrap it in a div.
// Pinning it here means it cannot regress the next time someone drops it into a new
// layout.
//
// EXPLICIT PIXEL PADDING, not px-3 py-1.5. This project sets `--spacing: 0.5rem`, so
// Tailwind's spacing scale is 8px-based rather than the usual 4px: `px-3 py-1.5` would
// render 24px/12px here, double the 12px/6px the design asks for. Any utility whose
// exact value matters is written in px.
const SIZES = {
  /** On a card. */
  card: 'text-[12px] px-[12px] py-[6px]',
  /** On the article-page hero. */
  hero: 'text-[13px] px-[14px] py-[7px]',
} as const

export type CategoryPillProps = {
  label: string
  /** Renders as a link when the category has a hub of its own. */
  href?: string | null
  size?: keyof typeof SIZES
  className?: string
}

const BASE = cn(
  'inline-flex w-fit shrink-0 self-start items-center rounded-pill',
  'font-semibold leading-none whitespace-nowrap',
  'border border-brand-primary/25 bg-brand-primary/10 text-brand-primary',
)

export function CategoryPill({ label, href, size = 'card', className }: CategoryPillProps) {
  const classes = cn(BASE, SIZES[size], className)

  // A card is a single <a> (spec §2), so a pill inside one must NOT be a second link:
  // nesting anchors is invalid HTML, browsers silently unnest it, and the card's own
  // click target breaks. Callers inside a card pass no href.
  if (!href) {
    return <span className={classes}>{label}</span>
  }

  return (
    <Link
      href={href}
      className={cn(
        classes,
        'transition-colors duration-200 hover:bg-brand-primary/20 motion-reduce:transition-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      )}
    >
      {label}
    </Link>
  )
}

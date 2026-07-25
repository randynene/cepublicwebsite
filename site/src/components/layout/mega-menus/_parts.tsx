'use client'

import Link from 'next/link'

import { Icon } from '@/components/ui/icon'
import {
  MegaMenuPillLabel,
  type MegaMenuPillLabelVariant,
} from '@/components/ui/mega-menu-pill-label'
import { cn } from '@/components/ui/_utils/cn'
import type { Locale } from '@/lib/locale-path'
import { toInternalHref } from '@/lib/url'

// MYGRATR-STATIC-3 Step 3/4 — shared mega-menu content parts.
//
// Small building blocks reused by Services + Resources renderers.
// The focus-trap / dismiss / transition frame lives in _shell.tsx.

// Lime text link with trailing chevron (Services technology View All).
// SWEEP-CTA (Jul 2026): text-link archetype — `sf sf-link`. The small
// negative-margin/padding pair gives the highlighter sweep a real box to
// wipe across without shifting the link's visual position in its row.
export function ViewAllLink({
  link,
  onNavigate,
  className,
  locale,
}: {
  link?: { label?: string | null; url?: string | null } | null
  onNavigate?: () => void
  className?: string
  locale: Locale
}) {
  if (!link?.label || !link?.url) return null
  const { href, isExternal } = toInternalHref(link.url, locale)
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        'sf sf-link -mx-1.5 -my-0.5 inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[13.5px] font-semibold leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring',
        className,
      )}
      {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      <span className="c inline-flex items-center gap-1.5">
        {link.label}
        <Icon name="chevron-right" size="sm" />
      </span>
    </Link>
  )
}

// Column-header View-all pill — frame 04 uses two variants:
//   outline  — Blogs middle column
//   solid-lime — Customer Stories right column
// SWEEP-CTA (Jul 2026): outline → ghost (`sf-g`), solid-lime → primary
// (`sf-p`). Colours + hover now come entirely from the shared classes.
export function ColumnViewAllPill({
  link,
  variant,
  onNavigate,
  locale,
}: {
  link?: { label?: string | null; url?: string | null } | null
  variant: 'outline' | 'solid-lime'
  onNavigate?: () => void
  locale: Locale
}) {
  if (!link?.label || !link?.url) return null
  const { href, isExternal } = toInternalHref(link.url, locale)
  const isOutline = variant === 'outline'
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        'sf inline-flex items-center gap-2 rounded-pill py-[5px] pl-[5px] pr-3.5 text-[13px] font-semibold leading-none no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring',
        isOutline ? 'sf-g' : 'sf-p',
      )}
      {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      <span
        aria-hidden="true"
        className="ic inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center text-[11px]"
      >
        <Icon name="chevron-right" size="sm" className="-rotate-45" />
      </span>
      <span className="c">{link.label}</span>
    </Link>
  )
}

// Header.html frame 03 uses a UNIFORM outline pill for every section
// header except the highlighted lime one (Staff Augmentation). Sanity
// seeds per-section styles from the OLD design (pill-dark /
// pill-gradient / pill-navy) — map those onto the export's
// pill-outline-dark at render time so the data stays design-agnostic
// (no re-seed). pill-green passes through (solid lime, highlighted).
const EXPORT_PILL_VARIANT: Record<
  MegaMenuPillLabelVariant,
  MegaMenuPillLabelVariant
> = {
  'pill-green': 'pill-green',
  'pill-dark': 'pill-outline-dark',
  'pill-gradient': 'pill-outline-dark',
  'pill-navy': 'pill-outline-dark',
  'pill-outline-light': 'pill-outline-dark',
  'pill-outline-dark': 'pill-outline-dark',
}

// Section-header pill (Staff Augmentation / By Technology / etc.).
export function SectionPill({
  label,
  link,
  style,
  onNavigate,
  locale,
}: {
  label?: string | null
  link?: string | null
  style?: MegaMenuPillLabelVariant | null
  onNavigate?: () => void
  locale: Locale
}) {
  if (!label) return null
  const variant: MegaMenuPillLabelVariant = EXPORT_PILL_VARIANT[style ?? 'pill-green']
  // Staff Aug uses export lime #D4FF3C (brand-primary), not brand-secondary.
  // No `hover:` here — MegaMenuPillLabel's own sweep-fill mechanic owns hover.
  const exportPillClass =
    variant === 'pill-green'
      ? 'gap-[9px] bg-brand-primary py-[7px] pl-[7px] pr-[18px] font-bold'
      : 'gap-[9px] py-[7px] pl-[7px] pr-[18px] font-bold'
  const shared = {
    variant,
    label,
    leadingArrow: true as const,
    className: exportPillClass,
  }
  if (link) {
    const { href, isExternal } = toInternalHref(link, locale)
    return (
      <MegaMenuPillLabel
        as="a"
        href={href}
        onClick={onNavigate}
        {...shared}
        {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      />
    )
  }
  return <MegaMenuPillLabel as="span" {...shared} />
}

// Resources left-column navigational pill row (frame 04) — see
// resources.tsx for asset/material-font icon branching.
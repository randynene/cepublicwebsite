'use client'

import { usePathname } from 'next/navigation'
import { useId, type ReactNode } from 'react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Icon } from '@/components/ui/icon'
import { UI_STRINGS } from '@/lib/ui-strings'

// MYGRATR-STATIC-3 Step 1 — Region selector (Footer mount).
//
// Ports the pathname-aware US↔UK locale-switching logic from
// nav-client.tsx LocaleSwitcher (lines 258-310) into a self-contained
// Radix-DropdownMenu-driven component. Built in Step 1 BEFORE Step 2
// strips the Header switcher, so the switching logic stays intact and
// continuously available.
//
// Brief §3 Step 5 §5: "Region: US ▾" or "Region: UK ▾" with chevron.
// Click to open small dropdown with US + UK options. Selection
// navigates to the corresponding /uk/... or / route. Pathname-aware —
// matches STATIC-1 Header locale switcher behaviour.

export type RegionOption = {
  _key?: string
  label: string
  hreflang: string
  url?: string | null
}

const LOCALE_LABELS: Record<string, string> = {
  en: UI_STRINGS['nav.localeUS'],
  'en-GB': UI_STRINGS['nav.localeUK'],
}

// Pure function — pathname-aware UK ↔ US href construction. Imported
// (mentally) from nav-client.tsx LocaleSwitcher.buildHrefFor. Behavior:
//   en      — strip /uk prefix from current path
//   en-GB   — add /uk prefix to current path
//   default — passthrough
function buildHrefFor(pathname: string, hreflang: string): string {
  if (hreflang === 'en') {
    if (pathname === '/uk') return '/'
    if (pathname.startsWith('/uk/')) return pathname.slice(3)
    return pathname
  }
  if (hreflang === 'en-GB') {
    if (pathname.startsWith('/uk')) return pathname
    if (pathname === '/') return '/uk'
    return `/uk${pathname}`
  }
  return pathname
}

export interface RegionSelectorProps {
  options: RegionOption[]
  appearance?: 'footer' | 'inline'
  /** Export footer frame uses static "Region" label (not US/UK in trigger). */
  triggerLabel?: string
  className?: string
}

export function RegionSelector({
  options,
  appearance = 'footer',
  triggerLabel,
  className,
}: RegionSelectorProps): ReactNode {
  const pathname = usePathname() ?? '/'
  const isUk = pathname === '/uk' || pathname.startsWith('/uk/')
  const currentHreflang = isUk ? 'en-GB' : 'en'
  const currentLabel =
    LOCALE_LABELS[currentHreflang] ??
    (options.find((o) => o.hreflang === currentHreflang)?.label ?? currentHreflang)
  const baseId = useId().replace(/:/g, '_')

  const onSelect = (hreflang: string) => {
    const next = buildHrefFor(pathname, hreflang)
    // Hard navigation — locale switch needs to re-evaluate server
    // components + reset the html lang attr, so a client-side
    // router.push() isn't sufficient. window.location.assign() calls a
    // method (no property mutation) which satisfies the project's
    // react-hooks/immutability lint rule.
    if (typeof window !== 'undefined') window.location.assign(next)
  }

  const triggerClasses =
    appearance === 'footer'
      ? 'inline-flex items-center gap-1 rounded-pill px-2.5 py-[5px] text-[13px] font-normal leading-none text-text-on-dark hover:bg-text-on-dark/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring transition duration-reveal ease-reveal motion-reduce:transition-none'
      : 'inline-flex items-center gap-2 rounded-pill border border-brand-tertiary/15 bg-surface-elevated px-3 py-1.5 text-body-sm font-medium text-text-default hover:bg-surface-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring transition duration-reveal ease-reveal motion-reduce:transition-none'

  if (options.length === 0) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={UI_STRINGS['nav.localeLabel']}
        id={`region-trigger-${baseId}`}
        className={`${triggerClasses}${className ? ` ${className}` : ''}`}
      >
        <span>{triggerLabel ?? currentLabel}</span>
        <Icon
          name="chevron-right"
          size="sm"
          className={appearance === 'footer' ? 'size-2.5 rotate-90' : 'rotate-90'}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6}>
        {options.map((opt) => (
          <DropdownMenuItem
            key={opt._key ?? opt.hreflang}
            onSelect={() => onSelect(opt.hreflang)}
            data-active={opt.hreflang === currentHreflang || undefined}
          >
            {LOCALE_LABELS[opt.hreflang] ?? opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default RegionSelector

'use client'

import Link from 'next/link'
import { type ReactNode } from 'react'

import { MaterialIcon } from '@/components/ui/icon'
import { cn } from '@/components/ui/_utils/cn'
import type { SimpleDropdown } from '@/lib/sanity/queries/navigation'
import type { Locale } from '@/lib/locale-path'
import { toInternalHref } from '@/lib/url'

// MYGRATR-NAV-SIMPLE — compact anchored dropdown content (Services + Locations).
//
// A small card (not a full-width mega-menu) rendered inside MegaMenuShell.
// Structure per the reference screenshot: optional uppercase group label, then
// rows of [icon tile] + [title / subtitle]. Groups are separated by a hairline.
//
// Icons are Google Material Symbols ligatures (e.g. 'groups', 'explore') via
// the MaterialIcon branch — the same font path the Resources mega-menu uses,
// so no sprite regeneration is needed.

function SimpleDropdownItemRow({
  label,
  subtitle,
  url,
  icon,
  onNavigate,
  locale,
}: {
  label: string
  subtitle?: string | null
  url: string
  icon?: string | null
  onNavigate?: () => void
  locale: Locale
}) {
  const { href, isExternal } = toInternalHref(url, locale)
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="group flex items-center gap-3 rounded-[9px] px-2 py-[5px] -mx-2 transition duration-reveal ease-reveal motion-reduce:transition-none hover:bg-[#16223A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring"
      {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {icon ? (
        <span className="grid size-7 shrink-0 place-items-center rounded-[7px] border border-[#22314D] bg-[#16223A] text-text-secondary transition-colors duration-reveal ease-reveal group-hover:border-brand-primary/40 group-hover:text-brand-primary motion-reduce:transition-none">
          <MaterialIcon
            name={icon}
            size="sm"
            className="flex items-center justify-center w-4 h-4 text-[16px] leading-none"
          />
        </span>
      ) : null}
      <span className="min-w-0">
        <span className="block text-[13.5px] font-semibold leading-tight text-text-default group-hover:text-brand-primary">
          {label}
        </span>
        {subtitle ? (
          <span className="mt-[2px] block text-[12px] leading-[1.3] text-text-tertiary">
            {subtitle}
          </span>
        ) : null}
      </span>
    </Link>
  )
}

export function SimpleDropdownContent({
  data,
  onNavigate,
  locale,
}: {
  data: SimpleDropdown
  onNavigate?: () => void
  locale: Locale
}): ReactNode {
  const sections = data?.sections ?? []
  if (sections.length === 0) return null

  return (
    <div className="flex flex-col gap-3 px-3.5 py-2">
      {sections.map((section, index) => (
        <div
          key={section._key}
          className={cn(
            index > 0 && 'border-t border-border-subtle pt-3',
          )}
        >
          {section.sectionLabel ? (
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-tertiary">
              {section.sectionLabel}
            </p>
          ) : null}
          <div className="flex flex-col gap-0.5">
            {(section.items ?? []).map((item) => (
              <SimpleDropdownItemRow
                key={item._key}
                label={item.label}
                subtitle={item.subtitle}
                url={item.url}
                icon={item.icon}
                onNavigate={onNavigate}
                locale={locale}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default SimpleDropdownContent

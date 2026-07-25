'use client'

import Link from 'next/link'
import { type ReactNode } from 'react'

import { cn } from '@/components/ui/_utils/cn'
import { Image } from '@/components/ui/image'
import type {
  MegaMenuItemRef,
  PillStyle,
  ServicesMegaMenu,
} from '@/lib/sanity/queries/navigation'
import { refToHref } from '@/lib/sanity/route-map'

import { SectionPill, ViewAllLink } from './_parts'
import type { Locale } from '@/lib/locale-path'

// MYGRATR-STATIC-3 Step 3 — Services mega-menu (Header.html frame 03).

// Header.html frame 03 — left-column export values.
const LEFT_COLUMN_BORDER = 'border-[#22314D]'

function ServiceTextItem({
  item,
  onNavigate,
  locale,
}: {
  item: MegaMenuItemRef
  onNavigate?: () => void
  locale: Locale
}) {
  const href = refToHref({ _type: item._type, slug: item.slug ?? null }, locale)
  if (!href || !item.name) return null
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="group block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring transition duration-reveal ease-reveal motion-reduce:transition-none"
    >
      <span className="mb-[3px] block text-[14.5px] font-semibold leading-none text-text-default group-hover:text-brand-primary">
        {item.name}
      </span>
      {item.tagline ? (
        <span className="block text-[12.5px] leading-[1.3] text-[#7F8CA0]">
          {item.tagline}
        </span>
      ) : null}
    </Link>
  )
}

function HighlightedServiceItem({
  item,
  onNavigate,
  isLast,
  locale,
}: {
  item: MegaMenuItemRef
  onNavigate?: () => void
  isLast: boolean
  locale: Locale
}) {
  const href = refToHref({ _type: item._type, slug: item.slug ?? null }, locale)
  if (!href || !item.name) return null
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="group block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring transition duration-reveal ease-reveal motion-reduce:transition-none"
    >
      <span className="mb-[3px] block text-[14.5px] font-semibold leading-none text-text-default group-hover:text-brand-primary">
        {item.name}
      </span>
      {item.tagline ? (
        <span
          className={cn(
            'block text-[12.5px] leading-[1.3] text-[#7F8CA0]',
            !isLast && 'mb-[13px]',
          )}
        >
          {item.tagline}
        </span>
      ) : null}
    </Link>
  )
}

function TechItem({
  item,
  onNavigate,
  locale,
}: {
  item: MegaMenuItemRef
  onNavigate?: () => void
  locale: Locale
}) {
  const href = refToHref({ _type: item._type, slug: item.slug ?? null }, locale)
  if (!href || !item.name) return null
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="group flex items-start gap-[11px] rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring transition duration-reveal ease-reveal motion-reduce:transition-none"
    >
      {item.icon?.asset ? (
        <span className="mt-0.5 flex h-[34px] w-[34px] shrink-0 items-center justify-center">
          <Image
            source={item.icon}
            alt=""
            width={34}
            height={34}
            className="h-[34px] w-[34px] object-contain"
          />
        </span>
      ) : null}
      <span className="min-w-0">
        <span className="block text-[14.5px] font-semibold leading-none text-text-default group-hover:text-brand-primary">
          {item.name}
        </span>
        {item.tagline ? (
          <span className="mt-[3px] block text-[12.5px] leading-[1.3] text-text-tertiary">
            {item.tagline}
          </span>
        ) : null}
      </span>
    </Link>
  )
}

function Subsection({
  label,
  link,
  style,
  items,
  onNavigate,
  locale,
}: {
  label?: string | null
  link?: string | null
  style?: PillStyle | null
  items?: MegaMenuItemRef[] | null
  onNavigate?: () => void
  locale: Locale
}) {
  return (
    <div className="flex flex-col gap-4">
      <SectionPill label={label} link={link} style={style} onNavigate={onNavigate} locale={locale}/>
      <div className="flex flex-col gap-[13px]">
        {(items ?? []).map((item) => (
          <ServiceTextItem key={item._id} item={item} onNavigate={onNavigate} locale={locale}/>
        ))}
      </div>
    </div>
  )
}

function resolveViewAllLink(
  viewAllLink?: { label?: string | null; url?: string | null } | null,
  sectionLink?: string | null,
) {
  if (viewAllLink?.label && viewAllLink?.url) {
    return { label: viewAllLink.label, url: viewAllLink.url }
  }
  if (sectionLink) {
    return { label: 'View All', url: sectionLink }
  }
  // Staff Augmentation pill is decorative in Sanity (no sectionLink) — services
  // index is the export-intent destination for the left-column View All.
  return { label: 'View All', url: '/services' }
}

export function ServicesMegaContent({
  data,
  onNavigate,
  locale,
}: {
  data: ServicesMegaMenu
  onNavigate?: () => void
  locale: Locale
}): ReactNode {
  if (!data) return null
  const left = data.leftColumn
  const top = data.rightColumnTop
  const bottom = data.rightColumnBottom

  return (
    <div className="grid grid-cols-1 gap-[34px] px-[34px] py-[30px] lg:grid-cols-[300px_1fr]">
      {/* Left column — Staff Augmentation (Header.html frame 03) */}
      <div className="flex flex-col border-border-subtle lg:border-r lg:pr-8">
        <div className="mb-[18px]">
          <SectionPill
            label={left?.sectionLabel}
            link={left?.sectionLink}
            style={left?.sectionLabelStyle}
            onNavigate={onNavigate}
locale={locale}/>
        </div>
        {left?.highlightedItems && left.highlightedItems.length > 0 ? (
          <div
            className={cn(
              'mb-4 rounded-[12px] border bg-[#16223A] px-4 py-[14px]',
              LEFT_COLUMN_BORDER,
            )}
          >
            {left.highlightedItems.map((item, index) => (
              <HighlightedServiceItem
                key={item._id}
                item={item}
                onNavigate={onNavigate}
                isLast={index === left.highlightedItems!.length - 1}
locale={locale}/>
            ))}
          </div>
        ) : null}
        <div className="flex flex-col gap-[13px]">
          {(left?.items ?? []).map((item) => (
            <ServiceTextItem key={item._id} item={item} onNavigate={onNavigate} locale={locale}/>
          ))}
        </div>
        <ViewAllLink
          link={resolveViewAllLink(left?.viewAllLink, left?.sectionLink)}
          onNavigate={onNavigate}
          className="mt-[18px]"
locale={locale}/>
      </div>

      {/* Right area — By Technology + AI Services / Product Builds */}
      <div className="flex flex-col">
        <SectionPill
          label={top?.sectionLabel}
          link={top?.sectionLink}
          style={top?.sectionLabelStyle}
          onNavigate={onNavigate}
locale={locale}/>
        <div className="mt-4 grid grid-cols-1 gap-x-7 gap-y-[14px] sm:grid-cols-2">
          {(top?.items ?? []).map((item) => (
            <TechItem key={item._id} item={item} onNavigate={onNavigate} locale={locale}/>
          ))}
        </div>
        <ViewAllLink
          link={top?.viewAllLink}
          onNavigate={onNavigate}
          className="mb-[26px] mt-[26px]"
locale={locale}/>

        {bottom?.sections && bottom.sections.length > 0 ? (
          <div className="grid grid-cols-1 gap-8 border-t border-border-subtle pt-6 sm:grid-cols-2 sm:gap-8">
            {bottom.sections.map((section) => (
              <Subsection
                key={section._key}
                label={section.sectionLabel}
                link={section.sectionLink}
                style={section.sectionLabelStyle}
                items={section.items}
                onNavigate={onNavigate}
locale={locale}/>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default ServicesMegaContent

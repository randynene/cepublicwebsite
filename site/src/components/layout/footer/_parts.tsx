import Link from 'next/link'
import type { ReactNode } from 'react'

import { Icon } from '@/components/ui/icon'
import { cn } from '@/components/ui/_utils/cn'
import type { FooterLink } from '@/lib/sanity/queries/footer'
import type { Locale } from '@/lib/locale-path'
import { toInternalHref } from '@/lib/url'

// Footer.html export tokens (desktop + mobile frames).
export const FOOTER_SHELL = 'bg-[#070D18] text-text-on-dark'
/** Link-grid band — top CTA is a separate full-width section above this. */
export const FOOTER_PAD_Y = 'pt-10 pb-8 lg:pt-[40px] lg:pb-8'
/** Mobile export uses 22px side inset (Footer.html mobile frame). */
export const FOOTER_PAD_MOBILE_X = 'px-[22px] lg:px-0'
export const FOOTER_GRID =
  'grid grid-cols-1 gap-10 lg:grid-cols-[1.05fr_1fr_0.85fr_1.1fr] lg:gap-[40px]'
/** Hairline only — pair with explicit margin utilities at call sites. */
export const FOOTER_DIVIDER = 'h-px bg-[#22314D]'
/** Footer.html divider before bottom bar: margin 56px 0 32px. */
export const FOOTER_DIVIDER_BEFORE_BOTTOM_BAR =
  'mt-[56px] mb-8 h-px bg-[#22314D] lg:mt-[56px] lg:mb-8'

export const FOOTER_EYEBROW =
  'text-[11.5px] font-semibold uppercase leading-none tracking-[1.68px] text-brand-primary'

export const FOOTER_LINK =
  'text-[14.5px] font-normal leading-none tracking-[-0.08px] text-[#B8C2D1] no-underline transition duration-reveal ease-reveal hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring focus-visible:rounded-sm motion-reduce:transition-none'

export function warnMissingFooterUrl(context: string, label: string) {
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[footer] missing url for ${context}: "${label}"`)
  }
}

export function FooterAnchor({
  link,
  context,
  className,
  locale,
}: {
  link: FooterLink
  context: string
  className?: string
  locale: Locale
}) {
  if (!link.url) {
    warnMissingFooterUrl(context, link.label)
    return null
  }
  const { href, isExternal } = toInternalHref(link.url, locale)
  return (
    <Link
      href={href}
      className={cn(FOOTER_LINK, className)}
      {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {link.label}
    </Link>
  )
}

export function FooterEyebrow({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn(FOOTER_EYEBROW, className)}>{children}</div>
}

export function FooterLinkList({
  links,
  context,
  gapClass = 'gap-[13px]',
  locale,
}: {
  links: FooterLink[]
  context: string
  gapClass?: string
  locale: Locale
}) {
  return (
    <div className={cn('flex flex-col', gapClass)}>
      {links.map((link) => (
        <FooterAnchor key={link._key} link={link} context={context} locale={locale}/>
      ))}
    </div>
  )
}

/** Project Builds / AI Services — Footer.html export arrow row pills. */
export function FooterBottomPillLink({
  label,
  url,
  context,
  locale,
}: {
  label: string
  url: string
  context: string
  locale: Locale
}) {
  if (!url) {
    warnMissingFooterUrl(context, label)
    return null
  }
  const { href, isExternal } = toInternalHref(url, locale)
  return (
    <Link
      href={href}
      className="inline-flex w-fit items-center gap-[9px] text-[14.5px] font-semibold leading-none text-text-default no-underline transition duration-reveal ease-reveal hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring motion-reduce:transition-none"
      {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      <span>{label}</span>
      <span
        aria-hidden="true"
        className="inline-flex size-[22px] items-center justify-center rounded-full border border-[#32435F] text-[11px] text-brand-primary"
      >
        <Icon name="chevron-right" size="sm" className="-rotate-45" />
      </span>
    </Link>
  )
}

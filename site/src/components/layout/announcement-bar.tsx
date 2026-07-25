import Link from 'next/link'

import { CHROME_CONTENT_BAND, CHROME_H_PAD } from '@/components/layout/chrome-band'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/components/ui/_utils/cn'
import type { AnnouncementBar as AnnouncementBarData } from '@/lib/sanity/queries/navigation'
import type { Locale } from '@/lib/locale-path'
import { toInternalHref } from '@/lib/url'

// Header.html frame 01 — slim promo strip above nav (`background:#0A1628`).

export function AnnouncementBar({
  bar,
  locale,
}: {
  bar?: AnnouncementBarData | null
  locale: Locale
}) {
  if (bar?.enabled !== true || !bar.message) return null

  const hasLink = Boolean(bar.linkLabel && bar.linkUrl)
  const linkHref = bar.linkUrl ? toInternalHref(bar.linkUrl, locale) : null

  return (
    <div
      className="h-[var(--announcement-bar-active-height)] bg-[#0A1628] text-text-default"
      role="region"
      aria-label="Site announcement"
    >
      <div className={cn(CHROME_H_PAD, 'flex h-full items-center')}>
        <div
          className={cn(
            CHROME_CONTENT_BAND,
            'flex h-full w-full items-center justify-between gap-3',
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            {bar.badgeLabel ? (
              <span className="inline-flex shrink-0 rounded-pill bg-brand-primary px-2 py-0.5 text-[10px] font-bold uppercase leading-none tracking-[0.06em] text-text-dark">
                {bar.badgeLabel}
              </span>
            ) : null}
            <p className="truncate text-[13px] font-normal leading-none tracking-[-0.08px] text-text-secondary">
              {bar.message}
            </p>
          </div>
          {hasLink && linkHref ? (
            <Link
              href={linkHref.href}
              className="inline-flex shrink-0 items-center gap-1 text-[13px] font-semibold leading-none tracking-[-0.08px] text-brand-primary no-underline transition duration-reveal ease-reveal hover:text-brand-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring focus-visible:rounded-sm motion-reduce:transition-none"
              {...(linkHref.isExternal
                ? { target: '_blank', rel: 'noopener noreferrer' }
                : {})}
            >
              <span>{bar.linkLabel}</span>
              <Icon name="chevron-right" size="sm" className="size-3" />
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  )
}

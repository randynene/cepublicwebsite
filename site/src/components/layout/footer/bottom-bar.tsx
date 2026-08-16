import Image from 'next/image'
import Link from 'next/link'

import { CookieSettingsLink } from '@/components/consent/cookie-settings-link'
import { RegionSelector } from '@/components/layout/region-selector'
import { cn } from '@/components/ui/_utils/cn'
import type { BottomBar, FooterLink } from '@/lib/sanity/queries/footer'
import { resolveCopyright } from '@/lib/sanity/queries/footer'
import type { Locale } from '@/lib/locale-path'
import { toInternalHref } from '@/lib/url'

import { FOOTER_DIVIDER, FOOTER_DIVIDER_BEFORE_BOTTOM_BAR, warnMissingFooterUrl } from './_parts'

function BottomBarLink({ link, locale }: { link: FooterLink; locale: Locale }) {
  if (!link.url) {
    warnMissingFooterUrl('bottomBar.links', link.label)
    return null
  }
  const { href, isExternal } = toInternalHref(link.url, locale)
  return (
    <Link
      href={href}
      className="text-[14px] leading-none text-[#B8C2D1] no-underline transition duration-reveal ease-reveal hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring motion-reduce:transition-none"
      {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {link.label}
    </Link>
  )
}

export function FooterBottomBar({
  bottomBar,
  locale,
}: {
  bottomBar?: BottomBar | null
  locale: Locale
}) {
  if (!bottomBar) return null

  const copyright = resolveCopyright(bottomBar.copyrightText ?? undefined)
  const links = bottomBar.links ?? []
  const regionEnabled = bottomBar.regionSelector?.enabled !== false
  const regionOptions =
    bottomBar.regionSelector?.options?.map((opt) => ({
      _key: opt._key,
      label: opt.label,
      hreflang: opt.hreflang ?? opt.label.toLowerCase(),
      url: opt.url,
    })) ?? []

  return (
    <>
      <div className={FOOTER_DIVIDER_BEFORE_BOTTOM_BAR} aria-hidden="true" />
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 lg:gap-x-4">
          <Image
            src="/ce-logo.svg"
            alt="CloudEmployee"
            width={132}
            height={22}
            className="h-[22px] w-auto shrink-0"
          />
          {copyright ? (
            <p className="whitespace-nowrap text-[14px] leading-none tracking-[-0.08px] text-[#7F8CA0]">
              {copyright}
            </p>
          ) : null}
        </div>
        <nav
          aria-label="Footer legal"
          className="flex flex-wrap items-center gap-5 lg:gap-7"
        >
          {links.map((link) => (
            <BottomBarLink key={link._key} link={link} locale={locale}/>
          ))}
          {/* Sits with the legal links rather than in a Sanity-managed list:
            * it is a control, not a URL, and it must never be editable to
            * absence. Consent has to stay withdrawable from every page. */}
          <CookieSettingsLink />
          {regionEnabled && regionOptions.length > 0 ? (
            <RegionSelector
              options={regionOptions}
              appearance="footer"
              triggerLabel="Region"
              className={cn(
                'gap-1 border border-[#32435F] px-2.5 py-[5px] text-[13px] font-normal leading-none',
                'text-[#B8C2D1] hover:bg-text-on-dark/10',
              )}
            />
          ) : null}
        </nav>
      </div>
    </>
  )
}

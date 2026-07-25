import Link from 'next/link'
import type { ReactNode } from 'react'

import { AnnouncementBar } from '@/components/layout/announcement-bar'
import { CHROME_H_PAD } from '@/components/layout/chrome-band'
import { cn } from '@/components/ui/_utils/cn'
import { env } from '@/lib/env'
import { fetchNavigation, type AnnouncementBar as AnnouncementBarData } from '@/lib/sanity/queries/navigation'
import { UI_STRINGS } from '@/lib/ui-strings'
import type { Locale } from '@/lib/locale-path'
import { buildLocalePath } from '@/lib/locale-path'
import { toInternalHref } from '@/lib/url'

import NavClient from './nav-client'

const ANNOUNCEMENT_BAR_HEIGHT = 'var(--announcement-bar-active-height)'

function BrandLogo() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/ce-logo.svg"
      alt=""
      aria-hidden="true"
      className="h-[30px] w-auto"
    />
  )
}

function isAnnouncementBarActive(bar?: AnnouncementBarData | null) {
  return bar?.enabled === true && Boolean(bar?.message)
}

function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-sm focus:bg-brand-primary focus:px-3 focus:py-2 focus:text-text-dark focus:no-underline"
    >
      {UI_STRINGS['nav.skipToContent']}
    </a>
  )
}

function StickyChrome({
  announcementEnabled,
  announcementBar,
  locale,
  children,
}: {
  announcementEnabled: boolean
  announcementBar?: AnnouncementBarData | null
  locale: Locale
  children: ReactNode
}) {
  return (
    <>
      <style>{`:root { --announcement-bar-height: ${announcementEnabled ? ANNOUNCEMENT_BAR_HEIGHT : '0px'}; }`}</style>
      <div
        className={cn(
          'sticky top-0 z-30',
          '-mt-[calc(var(--header-height-mobile)+var(--announcement-bar-height))]',
          'xl:-mt-[calc(var(--header-height)+var(--announcement-bar-height))]',
        )}
      >
        <AnnouncementBar bar={announcementBar} locale={locale} />
        <header
          role="banner"
          className="bg-brand-tertiary h-[var(--header-height-mobile)] xl:h-[var(--header-height)]"
        >
          <SkipLink />
          <div className={cn('relative flex h-full w-full items-center', CHROME_H_PAD)}>
            {children}
          </div>
        </header>
      </div>
    </>
  )
}

export default async function Nav({ locale }: { locale: Locale }) {
  const navigation = await fetchNavigation()

  if (!navigation) {
    return (
      <StickyChrome announcementEnabled={false} announcementBar={null} locale={locale}>
        <Link
          href={buildLocalePath('/', locale)}
          aria-label={UI_STRINGS['nav.brandAriaLabel']}
          className="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring focus-visible:rounded-sm"
        >
          <BrandLogo />
        </Link>
      </StickyChrome>
    )
  }

  const primaryLinks = navigation.primaryLinks ?? []
  const announcementEnabled = isAnnouncementBarActive(navigation.announcementBar)

  const navigationJsonLd = {
    '@context': 'https://schema.org',
    '@graph': primaryLinks.map((link, idx) => {
      const { href, isExternal } = toInternalHref(link.url, locale)
      const absoluteUrl = isExternal
        ? href
        : new URL(href || '/', env.NEXT_PUBLIC_SITE_URL).toString()
      return {
        '@type': 'SiteNavigationElement',
        position: idx + 1,
        name: link.label,
        url: absoluteUrl,
      }
    }),
  }

  return (
    <>
      <StickyChrome
        announcementEnabled={announcementEnabled}
        announcementBar={navigation.announcementBar}
        locale={locale}
      >
        <NavClient
          logo={
            <Link
              href={buildLocalePath('/', locale)}
              aria-label={UI_STRINGS['nav.brandAriaLabel']}
              className="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring focus-visible:rounded-sm"
            >
              <BrandLogo />
            </Link>
          }
          primaryLinks={primaryLinks}
          locale={locale}
          ctaButton={navigation.ctaButton ?? null}
          servicesMegaMenu={navigation.servicesMegaMenu ?? null}
          resourcesMegaMenu={navigation.resourcesMegaMenu ?? null}
          servicesDropdown={navigation.servicesDropdown ?? null}
          locationsDropdown={navigation.locationsDropdown ?? null}
        />
      </StickyChrome>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(navigationJsonLd),
        }}
      />
    </>
  )
}

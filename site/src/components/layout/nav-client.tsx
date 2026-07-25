'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  forwardRef,
  useCallback,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { Icon } from '@/components/ui/icon'
import { MegaMenuPillLabel } from '@/components/ui/mega-menu-pill-label'
import { cn } from '@/components/ui/_utils/cn'
import type {
  NavigationDoc,
  PrimaryLink,
  ResourcesMegaMenu,
  ServicesMegaMenu,
  SimpleDropdown,
} from '@/lib/sanity/queries/navigation'
import { UI_STRINGS } from '@/lib/ui-strings'
import type { Locale } from '@/lib/locale-path'
import { toInternalHref } from '@/lib/url'

import { MegaMenuShell } from './mega-menus/_shell'
import { ResourcesMegaContent } from './mega-menus/resources'
import { ServicesMegaContent } from './mega-menus/services'
import { SimpleDropdownContent } from './mega-menus/simple-dropdown'
import { CHROME_CONTENT_BAND, CHROME_HEADER_ROW } from './chrome-band'

// MYGRATR-NAV-SIMPLE — Header client island.
//
// Desktop nav: 2 compact anchored dropdowns (Services / Locations) + 3 plain
// links (Case Studies / Pricing / For Engineers) + Schedule a Call CTA.
// The big Services + Resources mega-menus stay in the codebase for regression
// safety but are no longer wired into the nav (Services → compact dropdown,
// Resources → footer). A single `openMenu` key drives whichever dropdown (mega
// OR compact) is open, so only one is ever open at a time.
//
// Mobile: lightweight drawer accordions for every dropdown (frame 06).

const CE_CALENDLY_INTRO_URL =
  'https://calendly.com/d/cwwf-6k5-2qy/intro-call-cloud-employee'

declare global {
  interface Window {
    Calendly?: {
      initPopupWidget: (config: { url: string }) => void
    }
  }
}

type MegaMenuKey = 'services-mega' | 'resources-mega'

function isMegaMenuKey(value: string | null | undefined): value is MegaMenuKey {
  return value === 'services-mega' || value === 'resources-mega'
}

type SimpleDropdownKey = 'services-simple' | 'locations-simple'

function isSimpleDropdownKey(
  value: string | null | undefined,
): value is SimpleDropdownKey {
  return value === 'services-simple' || value === 'locations-simple'
}

type MobileMegaItem = { label: string; href: string }

// Flatten a compact dropdown's sections into a single mobile link list.
function simpleDropdownMobileItems(
  data: SimpleDropdown,
  locale: Locale,
): MobileMegaItem[] {
  const items: MobileMegaItem[] = []
  for (const section of data?.sections ?? []) {
    for (const item of section.items ?? []) {
      items.push({ label: item.label, href: toInternalHref(item.url, locale).href })
    }
  }
  return items
}

function servicesMobileItems(data: ServicesMegaMenu, locale: Locale): MobileMegaItem[] {
  if (!data) return []
  const items: MobileMegaItem[] = []
  const left = data.leftColumn
  if (left?.sectionLabel) {
    items.push({
      label: left.sectionLabel,
      href: toInternalHref(left.sectionLink ?? '/services', locale).href,
    })
  }
  const top = data.rightColumnTop
  if (top?.sectionLabel) {
    items.push({
      label: top.sectionLabel,
      href: toInternalHref(top.sectionLink ?? '/technology', locale).href,
    })
  }
  for (const section of data.rightColumnBottom?.sections ?? []) {
    if (section.sectionLabel) {
      items.push({
        label: section.sectionLabel,
        href: toInternalHref(section.sectionLink ?? '/services', locale).href,
      })
    }
  }
  return items
}

function resourcesMobileItems(data: ResourcesMegaMenu, locale: Locale): MobileMegaItem[] {
  return (data?.leftColumn?.items ?? []).map((item) => {
    const { href } = toInternalHref(item.url, locale)
    return { label: item.label, href }
  })
}

function CalendlyCTA({
  label,
  fallbackHref,
  className,
  locale,
}: {
  label: string
  fallbackHref: string
  className?: string
  locale: Locale
}) {
  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (typeof window !== 'undefined' && window.Calendly) {
      e.preventDefault()
      window.Calendly.initPopupWidget({ url: CE_CALENDLY_INTRO_URL })
    }
  }
  const { href, isExternal } = toInternalHref(fallbackHref, locale)
  return (
    <MegaMenuPillLabel
      as="a"
      href={href}
      variant="pill-green"
      size="cta"
      leadingArrow
      leadingGlyph={<Icon name="chevron-right" size="sm" className="size-2.5" />}
      label={label}
      // `size="cta"` reserves only 4px on the left (icon hugs the edge) vs
      // 14px on the right — correct for an auto-width pill, but once this
      // stretches to `w-full` (mobile drawer) that imbalance reads as the
      // icon+label group sitting left-of-centre. `pl-3.5` matches the right
      // side so `justify-center` centres the whole group truthfully.
      className={cn('w-full justify-center pl-3.5 xl:w-auto xl:pl-[4px]', className)}
      onClick={onClick}
      {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    />
  )
}

// Export frame 01 default circle: 18×18, border #32435F, arrow #7F8CA0, ↓.
// Export frame 03/04 active circle: fill #D4FF3C, arrow #060F1E, ↑, no border.
// Hover matches active (static export has no :hover — sensible equivalent).
function ChevronInCircle({ isActive }: { isActive: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-[9px] leading-none transition-[background-color,border-color,color] duration-reveal ease-reveal motion-reduce:transition-none',
        isActive
          ? 'bg-brand-primary text-text-dark'
          : 'border border-border-default text-text-tertiary group-hover:bg-brand-primary group-hover:text-text-dark group-hover:border-transparent',
      )}
    >
      <Icon
        name="chevron-right"
        size="sm"
        className={cn(
          'transition-transform duration-150 motion-reduce:transition-none',
          isActive ? '-rotate-90' : 'rotate-90 group-hover:-rotate-90',
        )}
      />
    </span>
  )
}

const MegaMenuTrigger = forwardRef<
  HTMLButtonElement,
  {
    link: PrimaryLink
    isOpen: boolean
    onOpen: () => void
    onScheduleClose: () => void
    onCancelClose: () => void
    id?: string
    'aria-controls'?: string
    locale: Locale
  }
>(function MegaMenuTrigger(
  {
    link,
    isOpen,
    onOpen,
    onScheduleClose,
    onCancelClose,
    id,
    'aria-controls': ariaControls,
    locale,
  },
  ref,
) {
  const router = useRouter()
  const triggerHref = toInternalHref(link.url, locale).href

  const onMouseEnter = useCallback(() => {
    onCancelClose()
    router.prefetch(triggerHref)
    onOpen()
  }, [onCancelClose, onOpen, router, triggerHref])

  const onMouseLeave = useCallback(() => {
    onScheduleClose()
  }, [onScheduleClose])

  return (
    <button
      ref={ref}
      id={id}
      type="button"
      aria-haspopup="true"
      aria-expanded={isOpen}
      aria-controls={ariaControls}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onOpen}
      onBlur={onScheduleClose}
      className={cn(
        'group inline-flex items-center gap-[7px] whitespace-nowrap py-2 text-[14.5px] font-medium leading-none tracking-[-0.08px] text-text-secondary transition duration-reveal ease-reveal motion-reduce:transition-none',
        'hover:font-semibold hover:text-brand-primary',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring focus-visible:rounded-sm',
        isOpen && 'font-semibold text-brand-primary',
      )}
    >
      <span>{link.label}</span>
      <ChevronInCircle isActive={isOpen} />
    </button>
  )
})

// Desktop compact dropdown — trigger + small panel anchored under the trigger.
// Reuses MegaMenuShell (focus-trap / escape / outside-click / transition) but
// overrides its full-width positioning with a fixed-width anchored card.
function SimpleNavDropdown({
  link,
  data,
  isOpen,
  onOpen,
  onClose,
  onCancelClose,
  onScheduleClose,
  locale,
}: {
  link: PrimaryLink
  data: SimpleDropdown
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
  onCancelClose: () => void
  onScheduleClose: () => void
  locale: Locale
}) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const baseId = useId().replace(/:/g, '_')
  const panelId = `simple-panel-${baseId}`
  const triggerId = `simple-trigger-${baseId}`

  return (
    <li className="relative">
      <MegaMenuTrigger
        ref={triggerRef}
        link={link}
        isOpen={isOpen}
        onOpen={onOpen}
        onCancelClose={onCancelClose}
        onScheduleClose={onScheduleClose}
        aria-controls={panelId}
        id={triggerId}
        locale={locale}
      />
      <MegaMenuShell
        id={panelId}
        isOpen={isOpen}
        onClose={onClose}
        triggerRef={triggerRef}
        labelledById={triggerId}
        onMouseEnterPanel={onCancelClose}
        onMouseLeavePanel={onScheduleClose}
        className="left-0 right-auto top-full mt-2 w-[344px] max-w-[calc(100vw-2rem)] rounded-[16px]"
      >
        <SimpleDropdownContent data={data} onNavigate={onClose} locale={locale} />
      </MegaMenuShell>
    </li>
  )
}

function MobileMegaAccordion({
  link,
  items,
  onNavigate,
}: {
  link: PrimaryLink
  items: MobileMegaItem[]
  onNavigate?: () => void
}) {
  const [open, setOpen] = useState(false)
  const baseId = useId().replace(/:/g, '_')
  const panelId = `drawer-mega-${baseId}`

  return (
    <li className="flex flex-col border-b border-border-subtle">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between gap-2 px-[18px] py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring transition duration-reveal ease-reveal motion-reduce:transition-none"
      >
        <span
          className={cn(
            'text-[19px] font-semibold leading-none',
            open ? 'text-brand-primary' : 'text-text-default',
          )}
        >
          {link.label}
        </span>
        <span
          aria-hidden="true"
          className={cn(
            'inline-flex h-6 w-6 items-center justify-center rounded-full',
            open
              ? 'bg-brand-primary text-text-dark'
              : 'border border-[#32435F] text-text-tertiary',
          )}
        >
          <Icon
            name="chevron-right"
            size="sm"
            className={cn(
              'transition-transform duration-150 motion-reduce:transition-none',
              open ? '-rotate-90' : 'rotate-90',
            )}
          />
        </span>
      </button>
      <div
        id={panelId}
        className={cn(
          'overflow-hidden transition-[max-height] duration-reveal ease-reveal motion-reduce:transition-none',
          open ? 'max-h-96' : 'max-h-0',
        )}
      >
        <ul className="flex flex-col gap-[11px] px-[18px] pb-4 pl-[22px]">
          {items.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                onClick={onNavigate}
                className="block text-[15px] font-medium leading-none text-text-secondary hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring transition duration-reveal ease-reveal motion-reduce:transition-none"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </li>
  )
}

function MobileDrawer({
  primaryLinks,
  ctaButton,
  servicesMegaMenu,
  resourcesMegaMenu,
  servicesDropdown,
  locationsDropdown,
  locale,
}: {
  primaryLinks: PrimaryLink[]
  ctaButton: NavigationDoc['ctaButton']
  servicesMegaMenu: ServicesMegaMenu
  resourcesMegaMenu: ResourcesMegaMenu
  servicesDropdown: SimpleDropdown
  locationsDropdown: SimpleDropdown
  locale: Locale
}) {
  const [open, setOpen] = useState(false)
  const closeDrawer = useCallback(() => setOpen(false), [])

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label={UI_STRINGS['nav.openMenu']}
          className="inline-flex h-10 w-10 items-center justify-center rounded-sm text-text-default hover:bg-surface-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring transition duration-reveal ease-reveal xl:hidden"
        >
          <Icon name="menu" size="md" />
        </button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-50 bg-bg-primary/70 transition-opacity duration-reveal ease-reveal motion-reduce:transition-none data-[state=open]:opacity-100 data-[state=closed]:opacity-0 xl:hidden"
        />
        <DialogPrimitive.Content
          aria-label="Primary navigation"
          className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-bg-primary shadow-elevated transition-transform duration-reveal ease-reveal motion-reduce:transition-none data-[state=open]:translate-x-0 data-[state=closed]:translate-x-full xl:hidden focus-visible:outline-none"
        >
          <div className="flex h-[62px] items-center justify-between border-b border-border-subtle px-[18px]">
            <DialogPrimitive.Title className="sr-only">
              {UI_STRINGS['nav.menuHeading']}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close asChild>
              <button
                type="button"
                aria-label={UI_STRINGS['nav.closeMenu']}
                className="ml-auto inline-flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-brand-primary text-text-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring"
              >
                <Icon name="close" size="md" />
              </button>
            </DialogPrimitive.Close>
          </div>
          <nav aria-label="Primary" className="flex-1 overflow-y-auto">
            <ul className="flex flex-col px-[18px] py-4">
              {primaryLinks.map((link) => {
                const dropdownType = link.dropdownType ?? null
                if (dropdownType === 'services-simple') {
                  return (
                    <MobileMegaAccordion
                      key={link._key}
                      link={link}
                      items={simpleDropdownMobileItems(servicesDropdown, locale)}
                      onNavigate={closeDrawer}
                    />
                  )
                }
                if (dropdownType === 'locations-simple') {
                  return (
                    <MobileMegaAccordion
                      key={link._key}
                      link={link}
                      items={simpleDropdownMobileItems(locationsDropdown, locale)}
                      onNavigate={closeDrawer}
                    />
                  )
                }
                if (dropdownType === 'services-mega') {
                  return (
                    <MobileMegaAccordion
                      key={link._key}
                      link={link}
                      items={servicesMobileItems(servicesMegaMenu, locale)}
                      onNavigate={closeDrawer}
                    />
                  )
                }
                if (dropdownType === 'resources-mega') {
                  return (
                    <MobileMegaAccordion
                      key={link._key}
                      link={link}
                      items={resourcesMobileItems(resourcesMegaMenu, locale)}
                      onNavigate={closeDrawer}
                    />
                  )
                }
                const { href, isExternal } = toInternalHref(link.url, locale)
                return (
                  <li
                    key={link._key}
                    className="border-b border-border-subtle py-4"
                  >
                    <Link
                      href={href}
                      onClick={closeDrawer}
                      className="block text-[19px] font-semibold leading-none text-text-default hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring transition duration-reveal ease-reveal motion-reduce:transition-none"
                      {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    >
                      {link.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
          {ctaButton?.label && (
            <div className="border-t border-border-subtle p-4">
              <CalendlyCTA
                label={ctaButton.label}
                fallbackHref={ctaButton.link ?? '/contact'}
                className="w-full justify-center"
                locale={locale}
              />
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export default function NavClient({
  logo,
  primaryLinks,
  ctaButton,
  servicesMegaMenu,
  resourcesMegaMenu,
  servicesDropdown,
  locationsDropdown,
  locale,
}: {
  logo: ReactNode
  primaryLinks: PrimaryLink[]
  ctaButton: NavigationDoc['ctaButton']
  servicesMegaMenu: ServicesMegaMenu
  resourcesMegaMenu: ResourcesMegaMenu
  servicesDropdown: SimpleDropdown
  locationsDropdown: SimpleDropdown
  locale: Locale
}): ReactNode {
  // One open key drives whichever dropdown is open. Mega links use their fixed
  // keys ('services-mega' / 'resources-mega'); compact dropdowns use the link's
  // Sanity `_key`. Only one is ever open, so opening any closes the others.
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const servicesTriggerRef = useRef<HTMLButtonElement>(null)
  const resourcesTriggerRef = useRef<HTMLButtonElement>(null)
  const baseId = useId().replace(/:/g, '_')
  const servicesTriggerId = `mega-trigger-services-${baseId}`
  const resourcesTriggerId = `mega-trigger-resources-${baseId}`
  const servicesPanelId = `mega-panel-services-${baseId}`
  const resourcesPanelId = `mega-panel-resources-${baseId}`

  const openMega = useCallback((key: string) => {
    setOpenMenu(key)
  }, [])

  const closeMega = useCallback(() => setOpenMenu(null), [])

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }, [])

  const scheduleClose = useCallback(() => {
    cancelClose()
    closeTimerRef.current = setTimeout(() => {
      closeMega()
      closeTimerRef.current = null
    }, 120)
  }, [cancelClose, closeMega])

  const navLinks = (
    <ul className="flex items-center justify-center gap-4 xl:gap-6">
      {primaryLinks.map((link) => {
        const dropdownType = link.dropdownType ?? null
        if (isSimpleDropdownKey(dropdownType)) {
          const data =
            dropdownType === 'services-simple' ? servicesDropdown : locationsDropdown
          return (
            <SimpleNavDropdown
              key={link._key}
              link={link}
              data={data}
              isOpen={openMenu === link._key}
              onOpen={() => openMega(link._key)}
              onClose={closeMega}
              onCancelClose={cancelClose}
              onScheduleClose={scheduleClose}
              locale={locale}
            />
          )
        }
        if (isMegaMenuKey(dropdownType)) {
          const isOpen = openMenu === dropdownType
          const triggerRef =
            dropdownType === 'services-mega'
              ? servicesTriggerRef
              : resourcesTriggerRef
          const triggerId =
            dropdownType === 'services-mega'
              ? servicesTriggerId
              : resourcesTriggerId
          const panelId =
            dropdownType === 'services-mega'
              ? servicesPanelId
              : resourcesPanelId
          return (
            <li key={link._key}>
              <MegaMenuTrigger
                ref={triggerRef}
                link={link}
                isOpen={isOpen}
                onOpen={() => openMega(dropdownType)}
                onCancelClose={cancelClose}
                onScheduleClose={scheduleClose}
                aria-controls={panelId}
                id={triggerId}
                locale={locale}
              />
            </li>
          )
        }
        const { href, isExternal } = toInternalHref(link.url, locale)
        return (
          <li key={link._key}>
            <Link
              href={href}
              className="inline-block whitespace-nowrap py-2 text-[14.5px] font-medium leading-none tracking-[-0.08px] text-text-secondary hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring focus-visible:rounded-sm transition duration-reveal ease-reveal motion-reduce:transition-none"
              {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              {link.label}
            </Link>
          </li>
        )
      })}
    </ul>
  )

  return (
    <div className="relative w-full">
      {/* Mobile — logo left, drawer right */}
      <div className="flex w-full items-center justify-between xl:hidden">
        {logo}
        <MobileDrawer
          primaryLinks={primaryLinks}
          ctaButton={ctaButton}
          locale={locale}
          servicesMegaMenu={servicesMegaMenu}
          resourcesMegaMenu={resourcesMegaMenu}
          servicesDropdown={servicesDropdown}
          locationsDropdown={locationsDropdown}
        />
      </div>

      {/* Desktop — logo left, nav centred, CTA right; same band width as Footer. */}
      <div className={cn('relative hidden xl:block', CHROME_CONTENT_BAND)}>
        <div className={CHROME_HEADER_ROW}>
          <div className="shrink-0">{logo}</div>
          <nav
            aria-label="Primary"
            className="flex min-w-0 flex-1 items-center justify-center px-3 xl:px-4"
          >
            {navLinks}
          </nav>
          <div className="shrink-0">
            {ctaButton?.label ? (
              <CalendlyCTA
                label={ctaButton.label}
                fallbackHref={ctaButton.link ?? '/contact'}
locale={locale}/>
            ) : null}
          </div>
        </div>
        <MegaMenuShell
          id={servicesPanelId}
          isOpen={openMenu === 'services-mega'}
          onClose={closeMega}
          triggerRef={servicesTriggerRef}
          labelledById={servicesTriggerId}
          onMouseEnterPanel={cancelClose}
          onMouseLeavePanel={scheduleClose}
          className="left-0 right-0 top-full mt-3 max-h-[80vh] overflow-y-auto"
        >
          <ServicesMegaContent data={servicesMegaMenu} onNavigate={closeMega} locale={locale} />
        </MegaMenuShell>
        <MegaMenuShell
          id={resourcesPanelId}
          isOpen={openMenu === 'resources-mega'}
          onClose={closeMega}
          triggerRef={resourcesTriggerRef}
          labelledById={resourcesTriggerId}
          onMouseEnterPanel={cancelClose}
          onMouseLeavePanel={scheduleClose}
          className="left-0 right-0 top-full mt-3 max-h-[80vh] overflow-y-auto"
        >
          <ResourcesMegaContent data={resourcesMegaMenu} onNavigate={closeMega} locale={locale} />
        </MegaMenuShell>
      </div>
    </div>
  )
}

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

import { CtaButton } from '@/components/ui/cta-button'
import { Icon } from '@/components/ui/icon'
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
import { stripLocalePrefix } from '@/lib/locale-path'
import { toInternalHref } from '@/lib/url'

import { MegaMenuShell } from './mega-menus/_shell'
import { ResourcesMegaContent } from './mega-menus/resources'
import { ServicesMegaContent } from './mega-menus/services'
import { SimpleDropdownContent } from './mega-menus/simple-dropdown'
import { CHROME_CONTENT_BAND, CHROME_HEADER_ROW } from './chrome-band'

// MYGRATR-NAV-SIMPLE — Header client island.
//
// Desktop nav: 2 compact anchored dropdowns (Services / Locations) + 2 plain
// links (Case Studies / Pricing), then a right-hand action cluster holding
// For Engineers + Schedule a Call.
// The big Services + Resources mega-menus stay in the codebase for regression
// safety but are no longer wired into the nav (Services → compact dropdown,
// Resources → footer). A single `openMenu` key drives whichever dropdown (mega
// OR compact) is open, so only one is ever open at a time.
//
// Mobile: lightweight drawer accordions for every dropdown (frame 06), with the
// same two CTAs stacked full-width at the foot of the drawer.
//
// ACCENT CHIP CLUSTER (Jul 2026, header 1E): For Engineers was promoted out of
// the nav into the action cluster. Sanity has no field marking a primary link
// as an action, and its label is editable in Studio, so it is matched on its
// destination path — the stable half of the record. If Seb ever repoints it,
// it falls back to rendering as a normal nav link rather than disappearing.

const CE_CALENDLY_INTRO_URL =
  'https://calendly.com/d/cwwf-6k5-2qy/intro-call-cloud-employee'

const ACTION_CLUSTER_PATHS = new Set(['/for-developers'])

function isActionClusterLink(link: PrimaryLink, locale: Locale): boolean {
  const { href, isExternal } = toInternalHref(link.url, locale)
  if (isExternal) return false
  return ACTION_CLUSTER_PATHS.has(stripLocalePrefix(href))
}

// Nav link resting type — 16px/600 muted, per the 1E reference. The centre-out
// lime underline and the white hover colour live in `.nav-underline`
// (globals.css); the weight is set at rest so hover never reflows the row.
//
// The 5px underline gutter is part of this box, so centring the box in the row
// leaves the text 1.25px above the CTA baselines. Transform, not padding: the
// label has to move without changing the row's height.
const NAV_LABEL_CLASS =
  'nav-underline translate-y-[1.25px] pb-[5px] text-[16px] font-semibold leading-none text-text-secondary'

// Every nav item — dropdown trigger and plain link alike — uses this box so the
// row's `items-center` lands all five labels on the same line. The 5px
// underline gutter belongs on the inner label span, never on this element: put
// it here and the padding stops being symmetric and the label drifts down.
const NAV_ITEM_CLASS =
  'nav-item inline-flex items-center gap-[7px] whitespace-nowrap py-2 tracking-[-0.08px]'

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

// Schedule a Call — solid pill. Opens the Calendly popup when the widget has
// loaded, otherwise follows the Sanity href as a plain link.
function CalendlyCTA({
  label,
  fallbackHref,
  block,
  className,
  locale,
}: {
  label: string
  fallbackHref: string
  block?: boolean
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
    <CtaButton
      as="a"
      href={href}
      external={isExternal}
      variant="solid"
      label={label}
      block={block}
      className={className}
      onClick={onClick}
    />
  )
}

// For Engineers — outlined chip. Reads its label and destination from the same
// Sanity primaryLink it used to render as nav text, so Studio still owns both.
function ForEngineersCTA({
  link,
  block,
  locale,
  onClick,
}: {
  link: PrimaryLink
  block?: boolean
  locale: Locale
  onClick?: () => void
}) {
  const { href, isExternal } = toInternalHref(link.url, locale)
  return (
    <CtaButton
      as="a"
      href={href}
      external={isExternal}
      variant="outline"
      label={link.label}
      block={block}
      onClick={onClick}
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
      className={cn(NAV_ITEM_CLASS, 'group')}
    >
      <span className={NAV_LABEL_CLASS}>{link.label}</span>
      {/* Tracks the label's own nudge so the caret stays level with the text
          rather than with the label box, which is 5px taller because of the
          underline gutter. */}
      <span className="inline-flex -translate-y-[1.25px]">
        <ChevronInCircle isActive={isOpen} />
      </span>
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
        // w-max sizes the card to its widest row so every subtitle stays on one
        // line (they used to wrap at the old fixed 344px). min-w keeps the old
        // width as the floor for short menus.
        className="left-0 right-auto top-full mt-2 w-max min-w-[344px] max-w-[calc(100vw-2rem)] rounded-[16px]"
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
  navOnlyLinks,
  actionLinks,
  ctaButton,
  servicesMegaMenu,
  resourcesMegaMenu,
  servicesDropdown,
  locationsDropdown,
  locale,
}: {
  navOnlyLinks: PrimaryLink[]
  actionLinks: PrimaryLink[]
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
              {navOnlyLinks.map((link) => {
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
          {actionLinks.length > 0 || ctaButton?.label ? (
            <div className="flex flex-col gap-[14px] border-t border-border-subtle p-4">
              {actionLinks.map((link) => (
                <ForEngineersCTA
                  key={link._key}
                  link={link}
                  locale={locale}
                  block
                  onClick={closeDrawer}
                />
              ))}
              {ctaButton?.label ? (
                <CalendlyCTA
                  label={ctaButton.label}
                  fallbackHref={ctaButton.link ?? '/contact'}
                  locale={locale}
                  block
                />
              ) : null}
            </div>
          ) : null}
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

  // For Engineers leaves the nav row and joins the action cluster. Anything
  // that isn't an action link keeps its existing order and behaviour.
  const actionLinks = primaryLinks.filter((link) => isActionClusterLink(link, locale))
  const navOnlyLinks = primaryLinks.filter((link) => !isActionClusterLink(link, locale))

  // 24px gap widening to the reference's 36px at 1360px, matching the CTA
  // padding tiers — see components/ui/cta-button for why 1360 and not 1200.
  const navLinks = (
    <ul className="flex items-center justify-center gap-[24px] min-[1360px]:gap-[36px]">
      {navOnlyLinks.map((link) => {
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
              className={NAV_ITEM_CLASS}
              {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              <span className={NAV_LABEL_CLASS}>{link.label}</span>
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
          navOnlyLinks={navOnlyLinks}
          actionLinks={actionLinks}
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
            className="flex min-w-0 flex-1 items-center justify-center px-[12px]"
          >
            {navLinks}
          </nav>
          <div className="flex shrink-0 items-center gap-[14px]">
            {actionLinks.map((link) => (
              <ForEngineersCTA key={link._key} link={link} locale={locale} />
            ))}
            {ctaButton?.label ? (
              <CalendlyCTA
                label={ctaButton.label}
                fallbackHref={ctaButton.link ?? '/contact'}
                locale={locale}
              />
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

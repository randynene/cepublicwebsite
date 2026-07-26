'use client'

import type { MouseEvent, ReactNode } from 'react'

import { MegaMenuPillLabel, type MegaMenuPillLabelVariant } from '@/components/ui/mega-menu-pill-label'
import { CHAT_FALLBACK_HREF, isChatHref } from '@/lib/chat'
import type { Locale } from '@/lib/locale-path'
import { toInternalHref } from '@/lib/url'

// Chat-aware CTA links. See site/src/lib/chat.ts for why the `#chat` token
// exists.
//
// Both components render an ordinary anchor pointing at a REAL page, then
// upgrade the click to the chat widget when it is available. Nothing here can
// produce a dead CTA: if Clara never loads, the click falls through to the
// booking page instead of doing nothing.
//
// Non-chat hrefs pass straight through, so a template can hand these the same
// Sanity field whether Seb points it at the chat or at /pricing.

type ClaraWidget = { open?: () => void }

// `window.ClaraWidget` is defined as soon as the script parses, but its open()
// is a no-op until the widget has fetched its workspace settings and mounted
// its UI — which does not happen on origins Clara's API does not allow (local
// dev, for one). Checking for a mounted root is therefore the only honest test
// of "will clicking this actually do something": every layout the widget can
// render leaves one of these three ids in the DOM.
const CLARA_MOUNTED_SELECTOR = '#clara-widget-trigger, #clara-shadow-host, #clara-widget-frame'

function openClaraChat(): boolean {
  const clara = (window as unknown as { ClaraWidget?: ClaraWidget }).ClaraWidget
  if (!clara || typeof clara.open !== 'function') return false
  if (!document.querySelector(CLARA_MOUNTED_SELECTOR)) return false
  clara.open()
  return true
}

function resolveHref(href: string, fallbackHref: string, locale: Locale): string {
  return toInternalHref(isChatHref(href) ? fallbackHref : href, locale).href
}

function handleClick(event: MouseEvent<HTMLAnchorElement>, href: string): void {
  if (!isChatHref(href)) return
  // Leave modified clicks (new tab, new window) to the browser.
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  if (!openClaraChat()) return
  event.preventDefault()
}

interface ChatTargetProps {
  /** Usually a Sanity field. `#chat` opens the widget; anything else is a normal link. */
  href: string
  fallbackHref?: string
  locale?: Locale
  className?: string
}

export interface ChatLinkProps extends ChatTargetProps {
  children: ReactNode
}

/** Bare anchor. The caller owns all styling. */
export function ChatLink({
  href,
  fallbackHref = CHAT_FALLBACK_HREF,
  locale = 'en-US',
  className,
  children,
}: ChatLinkProps) {
  return (
    <a
      href={resolveHref(href, fallbackHref, locale)}
      onClick={(event) => handleClick(event, href)}
      className={className}
    >
      {children}
    </a>
  )
}

export interface ChatPillProps extends ChatTargetProps {
  label: string
  variant?: MegaMenuPillLabelVariant
  size?: 'default' | 'cta'
  leadingArrow?: boolean
  leadingGlyph?: ReactNode
}

/** The canonical site CTA pill, wired to the chat. */
export function ChatPill({
  href,
  fallbackHref = CHAT_FALLBACK_HREF,
  locale = 'en-US',
  label,
  variant = 'pill-green',
  size = 'cta',
  leadingArrow,
  leadingGlyph,
  className,
}: ChatPillProps) {
  return (
    <MegaMenuPillLabel
      as="a"
      href={resolveHref(href, fallbackHref, locale)}
      onClick={(event) => handleClick(event, href)}
      variant={variant}
      size={size}
      leadingArrow={leadingArrow}
      leadingGlyph={leadingGlyph}
      label={label}
      className={className}
    />
  )
}

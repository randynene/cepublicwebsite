'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import { cn } from '@/components/ui/_utils/cn'
import { buildLocalePath, type Locale } from '@/lib/locale-path'
import type { ConsentState } from '@/lib/consent/types'
import { UI_STRINGS } from '@/lib/ui-strings'

import { useConsent } from './consent-provider'

const COOKIE_POLICY_PATH = '/legals/cookie-policy'

// Shared shell for both surfaces. Bottom-left on desktop so it never collides
// with the Clara chat launcher in the bottom-right; a bottom sheet under 640px,
// where a floating corner card would cover most of the viewport anyway.
//
// Deliberately NOT a modal: no overlay, no focus trap, no scroll lock. The page
// stays fully usable behind it. A consent notice that holds the page hostage is
// the pattern this was built to avoid, and blocking access until an answer is
// given also undermines the argument that the consent was freely given.
const SHELL = cn(
  'fixed z-[60] flex flex-col gap-3',
  'border border-border-subtle bg-section-bg-card text-text-primary',
  'shadow-[0_18px_48px_-14px_rgba(0,0,0,0.75)]',
  'inset-x-0 bottom-0 rounded-t-[20px] border-b-0 p-5',
  'sm:inset-x-auto sm:bottom-6 sm:left-6 sm:rounded-[20px] sm:border-b sm:p-5',
)

const BTN_BASE = cn(
  'rounded-pill px-5 py-2.5 text-[13.5px] font-semibold leading-none',
  'transition duration-reveal ease-reveal motion-reduce:transition-none',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  'focus-visible:ring-offset-section-bg-card',
)
const BTN_PRIMARY = cn(BTN_BASE, 'bg-brand-primary text-text-dark hover:bg-accent-alt')
const BTN_SECONDARY = cn(
  BTN_BASE,
  'border border-[#32435F] text-text-primary hover:border-brand-primary hover:text-brand-primary',
)
const BTN_QUIET = cn(
  'rounded-pill px-2 py-2.5 text-[13.5px] font-semibold leading-none underline underline-offset-[3px]',
  'text-text-secondary transition duration-reveal ease-reveal hover:text-brand-primary',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  'focus-visible:ring-offset-section-bg-card motion-reduce:transition-none',
)

function Toggle({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean
  disabled?: boolean
  onChange?: (next: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        'relative mt-0.5 h-[22px] w-[38px] shrink-0 rounded-pill',
        'transition duration-reveal ease-reveal motion-reduce:transition-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'focus-visible:ring-offset-section-bg-card',
        // Necessary reads as locked, not as switched off: the knob sits in the
        // "on" position but desaturated. An off-looking toggle would tell the
        // visitor they had disabled something they cannot disable.
        disabled ? 'cursor-not-allowed bg-[#2C3D5C]' : checked ? 'bg-brand-primary' : 'bg-border-subtle',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'absolute top-[3px] h-4 w-4 rounded-full transition-all duration-reveal ease-reveal motion-reduce:transition-none',
          disabled
            ? 'right-[3px] bg-text-tertiary'
            : checked
              ? 'right-[3px] bg-text-dark'
              : 'left-[3px] bg-text-tertiary',
        )}
      />
    </button>
  )
}

function Row({
  title,
  body,
  checked,
  disabled,
  onChange,
}: {
  title: string
  body: string
  checked: boolean
  disabled?: boolean
  onChange?: (next: boolean) => void
}) {
  return (
    <div className="flex items-start gap-3.5 border-t border-border-subtle py-3.5">
      <div className="flex-1">
        <h3 className="mb-1 text-[13.5px] font-semibold text-text-primary">{title}</h3>
        <p className="text-[12.5px] leading-[1.5] text-text-tertiary">{body}</p>
      </div>
      <Toggle checked={checked} disabled={disabled} onChange={onChange} label={title} />
    </div>
  )
}

/**
 * Its own component so that its toggle state is initialised on mount, from
 * whatever is currently stored. It only mounts when the panel opens, so
 * reopening from the footer always shows what is actually set. Syncing that
 * with an effect instead would be a cascading render and a lint error, and the
 * remount is the more honest model anyway: this is a fresh reading of a fresh
 * question.
 *
 * Marketing never starts on for an undecided visitor. A pre-ticked box is not
 * consent, so `?? false` here is a compliance detail, not a default.
 */
function PreferencesPanel({
  consent,
  enter,
  onSave,
  onAcceptAll,
  onRejectAll,
}: {
  consent: ConsentState | null
  enter: string
  onSave: (c: { analytics: boolean; marketing: boolean }) => void
  onAcceptAll: () => void
  onRejectAll: () => void
}) {
  const [analytics, setAnalytics] = useState(consent?.analytics ?? false)
  const [marketing, setMarketing] = useState(consent?.marketing ?? false)

  const panelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    panelRef.current?.focus()
  }, [])

  return (
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-label={UI_STRINGS['cookie.panelTitle']}
        className={cn(SHELL, 'sm:w-[420px]', enter)}
      >
        <div>
          <h2 className="text-[15px] font-semibold text-text-primary">
            {UI_STRINGS['cookie.panelTitle']}
          </h2>
          <p className="mt-1 text-[13px] leading-[1.55] text-text-secondary">
            {UI_STRINGS['cookie.panelIntro']}
          </p>
        </div>

        <div className="flex flex-col">
          <Row
            title={UI_STRINGS['cookie.necessaryTitle']}
            body={UI_STRINGS['cookie.necessaryBody']}
            checked
            disabled
          />
          <Row
            title={UI_STRINGS['cookie.analyticsTitle']}
            body={UI_STRINGS['cookie.analyticsBody']}
            checked={analytics}
            onChange={setAnalytics}
          />
          <Row
            title={UI_STRINGS['cookie.marketingTitle']}
            body={UI_STRINGS['cookie.marketingBody']}
            checked={marketing}
            onChange={setMarketing}
          />
        </div>

        {/* Reject all stays reachable from this layer too, so opening the
          * detail view is never a one-way trip into a screen where the only
          * way out is to agree to something. */}
        <div className="flex flex-wrap items-center gap-2 border-t border-border-subtle pt-4">
          <button
            type="button"
            className={BTN_PRIMARY}
            onClick={() => onSave({ analytics, marketing })}
          >
            {UI_STRINGS['cookie.save']}
          </button>
          <button type="button" className={BTN_SECONDARY} onClick={onAcceptAll}>
            {UI_STRINGS['cookie.acceptAll']}
          </button>
          <button type="button" className={BTN_SECONDARY} onClick={onRejectAll}>
            {UI_STRINGS['cookie.rejectAll']}
          </button>
        </div>
      </div>
  )
}

export function CookieBanner({ locale }: { locale: Locale }) {
  const { consent, needsDecision, settingsOpen, acceptAll, rejectAll, save, openSettings } =
    useConsent()

  // Held back briefly so the notice does not compete with the hero for
  // attention during first paint. Purely presentational: nothing loads in the
  // meantime, because the gate is the absence of consent, not the banner.
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = window.setTimeout(() => setVisible(true), 400)
    return () => window.clearTimeout(t)
  }, [])

  if (!needsDecision && !settingsOpen) return null

  const enter = cn(
    'transition-[opacity,transform] duration-reveal ease-reveal motion-reduce:transition-none',
    visible || settingsOpen ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
  )

  if (settingsOpen) {
    return (
      <PreferencesPanel
        consent={consent}
        enter={enter}
        onSave={save}
        onAcceptAll={acceptAll}
        onRejectAll={rejectAll}
      />
    )
  }

  return (
    <div
      role="region"
      aria-label={UI_STRINGS['cookie.bannerAriaLabel']}
      className={cn(SHELL, 'sm:w-96', enter)}
    >
      <p className="text-[15px] font-semibold text-text-primary">
        {UI_STRINGS['cookie.bannerTitle']}
      </p>
      <p className="text-[13.5px] leading-[1.55] text-text-secondary">
        {UI_STRINGS['cookie.bannerBody']}{' '}
        <Link
          href={buildLocalePath(COOKIE_POLICY_PATH, locale)}
          className="text-brand-primary underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-section-bg-card"
        >
          {UI_STRINGS['cookie.policyLink']}
        </Link>
      </p>
      {/* Accept and Reject are the same size, weight and row. The ICO's test is
        * that rejecting is as easy as accepting; anything that shrinks, hides
        * or demotes Reject fails it. Accept carries the lime because it is the
        * primary action, which is allowed - unequal prominence is not. */}
      <div className="mt-0.5 flex flex-wrap items-center gap-2">
        <button type="button" className={cn(BTN_PRIMARY, 'flex-1 sm:flex-none')} onClick={acceptAll}>
          {UI_STRINGS['cookie.acceptAll']}
        </button>
        <button
          type="button"
          className={cn(BTN_SECONDARY, 'flex-1 sm:flex-none')}
          onClick={rejectAll}
        >
          {UI_STRINGS['cookie.rejectAll']}
        </button>
        <button
          type="button"
          className={cn(BTN_QUIET, 'w-full text-center sm:ml-auto sm:w-auto')}
          onClick={openSettings}
        >
          {UI_STRINGS['cookie.choose']}
        </button>
      </div>
    </div>
  )
}

'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'

import { updateGoogleConsent, writeConsentCookie } from '@/lib/consent/client'
import {
  CONSENT_VERSION,
  DENY_ALL,
  GRANT_ALL,
  type ConsentState,
} from '@/lib/consent/types'

type ConsentContextValue = {
  /** null means undecided: the banner is showing and nothing optional loads. */
  consent: ConsentState | null
  /** True when the visitor has never answered, or answered an older version. */
  needsDecision: boolean
  /** The preferences panel is open. */
  settingsOpen: boolean
  acceptAll: () => void
  rejectAll: () => void
  save: (choice: { analytics: boolean; marketing: boolean }) => void
  openSettings: () => void
  closeSettings: () => void
}

const ConsentContext = createContext<ConsentContextValue | null>(null)

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext)
  if (!ctx) throw new Error('useConsent must be used inside ConsentProvider')
  return ctx
}

export function ConsentProvider({
  initialConsent,
  children,
}: {
  /**
   * Read from the cookie on the server. Passing it in rather than reading
   * document.cookie during the first client render is what keeps the server
   * HTML and the first client render identical - reading it in an effect
   * instead would flash the banner at everyone who had already answered.
   */
  initialConsent: ConsentState | null
  children: React.ReactNode
}) {
  const [consent, setConsent] = useState<ConsentState | null>(initialConsent)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const commit = useCallback((choice: { analytics: boolean; marketing: boolean }) => {
    const next: ConsentState = {
      version: CONSENT_VERSION,
      analytics: choice.analytics,
      marketing: choice.marketing,
      decidedAt: new Date().toISOString(),
    }
    writeConsentCookie(next)
    updateGoogleConsent(next)
    setConsent(next)
    setSettingsOpen(false)
  }, [])

  const value = useMemo<ConsentContextValue>(
    () => ({
      consent,
      needsDecision: consent === null,
      settingsOpen,
      acceptAll: () => commit(GRANT_ALL),
      rejectAll: () => commit(DENY_ALL),
      save: commit,
      openSettings: () => setSettingsOpen(true),
      closeSettings: () => setSettingsOpen(false),
    }),
    [consent, settingsOpen, commit],
  )

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
}

'use client'

import {
  CONSENT_COOKIE,
  CONSENT_MAX_AGE_SECONDS,
  type ConsentState,
  encodeConsent,
} from './types'

/**
 * Persist the decision as a first-party cookie.
 *
 * Lax rather than Strict: Strict would withhold the cookie on the first request
 * of any cross-site navigation, so a visitor arriving from a Google result would
 * be re-asked on the page they landed on despite having already answered. Lax
 * still blocks the cross-site POST cases that SameSite exists for.
 *
 * Not HttpOnly, deliberately - the client has to read its own consent to gate
 * scripts after hydration. There is nothing sensitive in it; it holds two
 * booleans and a timestamp.
 */
export function writeConsentCookie(state: ConsentState): void {
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie =
    `${CONSENT_COOKIE}=${encodeConsent(state)}` +
    `; Path=/; Max-Age=${CONSENT_MAX_AGE_SECONDS}; SameSite=Lax${secure}`
}

type ConsentSignal = 'granted' | 'denied'

/**
 * Tell Google Consent Mode about a change.
 *
 * We push the raw `consent` command onto dataLayer rather than calling a
 * `gtag` global, because GA4 here is fired through GTM and no gtag.js is ever
 * loaded, so no `window.gtag` function exists to call. GTM reads consent
 * commands straight off dataLayer, so this is the form that actually works in
 * this setup. Doing it the documented gtag.js way is the obvious mistake here
 * and it fails silently.
 */
export function updateGoogleConsent(state: {
  analytics: boolean
  marketing: boolean
}): void {
  const w = window as Window & { dataLayer?: unknown[] }
  const dataLayer = (w.dataLayer = w.dataLayer ?? [])

  const analytics: ConsentSignal = state.analytics ? 'granted' : 'denied'
  const marketing: ConsentSignal = state.marketing ? 'granted' : 'denied'

  // Must reach dataLayer as a genuine Arguments object, exactly as the gtag
  // shim produces. GTM's consent API inspects the arguments-shaped push; a
  // plain array literal is silently ignored, which is the failure mode that
  // looks like working code and quietly never grants anything.
  function gtag() {
    // eslint-disable-next-line prefer-rest-params
    dataLayer.push(arguments)
  }

  ;(gtag as (...args: unknown[]) => void)('consent', 'update', {
    analytics_storage: analytics,
    ad_storage: marketing,
    ad_user_data: marketing,
    ad_personalization: marketing,
  })
}

import 'server-only'

import { cookies } from 'next/headers'

import { CONSENT_COOKIE, decodeConsent, type ConsentState } from './types'

/**
 * The visitor's stored consent, or null if they have not answered (or answered
 * an older version of the question).
 *
 * The root layout already calls headers(), so this adds no new dynamic
 * behaviour - the app was never statically rendered at the layout level.
 */
export async function readConsent(): Promise<ConsentState | null> {
  const store = await cookies()
  return decodeConsent(store.get(CONSENT_COOKIE)?.value)
}

// Cookie consent state, shared by the server reader and the client provider.
//
// WHY A COOKIE AND NOT localStorage: the choice has to be readable while the
// page is being rendered on the server, so the very first HTML we send already
// omits the scripts a visitor rejected. localStorage is only legible after
// hydration, which means a rejecting visitor would still get one page-load's
// worth of Meta Pixel before React caught up. That single load is the whole
// thing PECR reg 6 prohibits, so the storage choice is a compliance decision,
// not a preference.
//
// The consent cookie itself is strictly necessary and therefore needs no
// consent of its own - it exists solely to honour the answer.

export const CONSENT_COOKIE = 'ce_cookie_consent'

// Twelve months. The ICO does not fix a number; 12 months is the common
// industry reading of "do not nag, but do re-ask periodically".
export const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 365

// Bump when the set of vendors changes in a way a previous answer cannot
// fairly cover. A stored record with an older version is treated as absent,
// so the banner reappears and the visitor answers the new question. This is
// the mechanism that stops us silently reusing consent for a vendor the
// visitor never saw.
export const CONSENT_VERSION = 1

export type ConsentCategory = 'analytics' | 'marketing'

export type ConsentState = {
  version: number
  analytics: boolean
  marketing: boolean
  /** ISO timestamp of the decision. Kept as the record that consent was given. */
  decidedAt: string
}

/** Nothing granted. What we assume until told otherwise, and what Reject all stores. */
export const DENY_ALL: Omit<ConsentState, 'decidedAt'> = {
  version: CONSENT_VERSION,
  analytics: false,
  marketing: false,
}

export const GRANT_ALL: Omit<ConsentState, 'decidedAt'> = {
  version: CONSENT_VERSION,
  analytics: true,
  marketing: true,
}

// Stored compactly because it rides on every single request. Long keys here
// are bytes on the wire for every asset the browser asks us for.
type Encoded = { v: number; a: 0 | 1; m: 0 | 1; t: string }

export function encodeConsent(state: ConsentState): string {
  const payload: Encoded = {
    v: state.version,
    a: state.analytics ? 1 : 0,
    m: state.marketing ? 1 : 0,
    t: state.decidedAt,
  }
  return encodeURIComponent(JSON.stringify(payload))
}

/**
 * Returns null for anything we cannot positively read as a current-version
 * decision: absent, malformed, or stored under an older version. Null means
 * "ask", and until answered nothing non-essential loads. Every failure mode
 * therefore fails closed, which is the only safe direction for a consent gate.
 */
export function decodeConsent(raw: string | undefined | null): ConsentState | null {
  if (!raw) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(decodeURIComponent(raw))
  } catch {
    return null
  }

  if (typeof parsed !== 'object' || parsed === null) return null
  const p = parsed as Partial<Encoded>

  if (p.v !== CONSENT_VERSION) return null
  if (p.a !== 0 && p.a !== 1) return null
  if (p.m !== 0 && p.m !== 1) return null
  if (typeof p.t !== 'string') return null

  return {
    version: p.v,
    analytics: p.a === 1,
    marketing: p.m === 1,
    decidedAt: p.t,
  }
}

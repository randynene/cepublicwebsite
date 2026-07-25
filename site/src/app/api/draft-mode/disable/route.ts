import { draftMode } from 'next/headers'
import { env } from '@/lib/env'

// CMA F-1 v1.3: POST is the right method for disable (button click → fetch, not iframe nav).
// CMA F-3 v1.3 (Option A): Origin AND Referer both checked. Disable has no preview-url secret
// (Sanity convention); this dual-check IS the CSRF barrier. Single-Origin gate is insufficient
// because Origin can be null on some browser/sandbox configs.
export async function POST(request: Request) {
  // -------- STEP 1: build Origin/Referer allow-list (fail closed on malformed env vars) --------
  // CMA F14 v2.1: NEXT_PUBLIC_SANITY_STUDIO_URL is optional in dev only. When unset,
  // Studio-origin requests are rejected with 403 (correct fail-closed). See §8.5 for
  // full rationale; mirrored here.
  // CMA F8 v2.1: explicit exclusion of literal "null" string + empty origin (sandboxed
  // iframes send `Origin: null` as a literal string). See §8.5 for full rationale.
  const rawAllowed = [env.NEXT_PUBLIC_SITE_URL, env.NEXT_PUBLIC_SANITY_STUDIO_URL]
    .filter((v): v is string => typeof v === 'string' && v.length > 0)

  const allowedOrigins = rawAllowed.flatMap((allowed) => {
    try {
      const origin = new URL(allowed).origin
      if (origin === 'null' || origin === '') return []
      return [origin]
    } catch { return [] }
  })

  // CMA BvR #34 v2.2: dev-only serving-origin expansion. NEXT_PUBLIC_SITE_URL is the
  // canonical URL (differs from serving origin in local dev). Same rationale + full
  // Pattern 13 audit lens at enable/route.ts §8.5. NODE_ENV gate keeps production
  // unchanged — dual Origin+Referer check still applies; dev expansion just makes the
  // serving origin (localhost:3000) discoverable so the same-origin disable fetch from
  // the site UI passes both `originAllowed` and `refererAllowed`.
  if (process.env.NODE_ENV === 'development') {
    const servingOrigin = safeUrlOrigin(request.url)
    if (servingOrigin && !allowedOrigins.includes(servingOrigin)) {
      allowedOrigins.push(servingOrigin)
    }
  }

  // -------- STEP 2: dual Origin + Referer check --------
  // SECURITY: disable has no preview-url secret. Origin + Referer dual-check is the only barrier.
  // Both must be present and match — not OR. (CMA F-3 v1.3 Option A.)
  //
  // CMA F11 v2.1: the AND-logic dual-check correctly rejects cross-origin requests, but ALSO
  // rejects legitimate same-origin fetch calls from browsers that strip the Referer header
  // (Referrer-Policy: no-referrer, privacy extensions, sandboxed iframes). Affected users
  // cannot exit draft mode via the UI — fallback is manual cookie deletion (devtools →
  // Application → Cookies → delete `__prerender_bypass` + `__next_preview_data`) or natural
  // cookie expiry. The TEMPLATE-* disable UI must set `Referrer-Policy: strict-origin-when-cross-origin`
  // (or stricter same-origin policy) on the disable-button page to avoid this. Tracked as
  // Tech Debt for TEMPLATE-* (see §6 trigger list + Tech Debt #18 entry queued for CLAUDE.md
  // at HALT 3). The trade-off is documented in CONVENTIONS Entry 3.
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const refererOrigin = referer ? safeUrlOrigin(referer) : null

  // CMA F13 v2.1: normalise to explicit booleans for readability + maintenance safety.
  // v2.0 used `string | boolean | null`-ish truthy/falsy expressions, which are correct
  // by falsy-coercion but obscure the intended semantics ("Origin is a string AND in the
  // allow-list"). Explicit booleans remove the cognitive load on future refactorers.
  const originAllowed = typeof origin === 'string' && allowedOrigins.includes(origin)
  const refererAllowed = typeof refererOrigin === 'string' && allowedOrigins.includes(refererOrigin)

  if (allowedOrigins.length === 0 || !originAllowed || !refererAllowed) {
    return new Response('Origin or Referer not allowed', { status: 403 })
  }

  // -------- STEP 3: disable draft mode --------
  ;(await draftMode()).disable()
  return new Response('Draft mode disabled')
}

function safeUrlOrigin(url: string): string | null {
  try { return new URL(url).origin }
  catch { return null }
}

import { validatePreviewUrl } from '@sanity/preview-url-secret'
import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

import { createClient } from 'next-sanity'
import { env } from '@/lib/env'

// CMA F-7 v1.3: extracted as named helper so the equivalence vs SCAFFOLD-1's separate
// draft-perspective client export (removed at §8.3) is reviewable. Identical config:
// token + draft perspective + no CDN + matching project/dataset.
// CMA F-12 v1.3: module-scope, not constructed per-request.
//
// CMA F12 v2.1 (claude-opus-4.6_data_integrity): defensive runtime check against silent
// failure from circular imports. env.ts is currently a leaf module (imports only `zod`),
// so circular risk is low TODAY. But if a future phase adds an env.ts dependency on a
// Sanity utility that transitively imports enable/route.ts, the circular dependency would
// cause `env` to be `undefined` at construction time, createClient would receive
// `token: undefined`, and validatePreviewUrl would silently return 401 on every request
// with NO diagnostic pointing at the circular import. The explicit check below converts
// the silent 401 into an explicit crash with a clear diagnostic message. The check uses
// the env-validated `env.SANITY_API_READ_TOKEN` rather than process.env directly, so
// D14's z.string().min(1) refinement still applies — this is a belt-and-braces against
// circular-import edge cases, not a substitute for schema validation.
//
// CMA M7 v2.2 (gemini-3-pro_production + gpt-5.4_security, 2-model consensus): optional
// chaining is REQUIRED here. Without `?.`, if `env` itself is `undefined` (the exact
// circular-import case this guard defends against), `env.SANITY_API_READ_TOKEN` throws
// a native `TypeError: Cannot read properties of undefined (reading
// 'SANITY_API_READ_TOKEN')` BEFORE the `if` condition evaluates. The TypeError masks the
// carefully-authored diagnostic Error below and the operator sees a generic native crash
// instead of "possible circular import with env.ts". The `?.` operator short-circuits to
// `undefined` when `env` is undefined, which is then caught by the `!` falsy check,
// allowing the authored diagnostic to fire. This is Pattern 13 (sharpened at v2.2 lock):
// a defensive guard added in response to a prior finding (F12) needed its own
// reachability + side-effect analysis to land correctly.
if (!env?.SANITY_API_READ_TOKEN) {
  throw new Error(
    'SANITY_API_READ_TOKEN is empty at module load in enable/route.ts — ' +
    'possible circular import with env.ts (env undefined at evaluation time) or ' +
    'missing env var that escaped D14 schema validation. ' +
    'See docs/briefs/active/MYGRATR-DESIGN-1-BRIEF-B_v2.2.md §8.3.3 + F12 v2.1 + M7 v2.2.'
  )
}

const previewValidationClient = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-01-01',
  useCdn: false,
  token: env.SANITY_API_READ_TOKEN,
  perspective: 'previewDrafts',
})

// CMA F-1 v1.3: GET (not POST) per Sanity's preview-url-secret iframe-navigation flow.
// §8.4 method probe (2026-05-12) confirmed: GET + top-level navigation + query string
// `?sanity-preview-secret=...&sanity-preview-perspective=drafts&sanity-preview-pathname=/`.
// Studio config wires BOTH presentationTool.previewMode.enable AND draftMode.enable to
// this route (BvR #33); the handler does not need to distinguish — uniform auth barriers
// (Origin/Referer allow-list + secret + redirectTo same-origin) serve both flows.
//
// CMA F-2 v1.3: SECURITY ORDER — origin/referer check → secret → redirectTo → enable → redirect.
// Do NOT reorder. draftMode().enable() must be the LAST operation before redirect.
// Verified by §8.7 integration tests (a)/(b)/(c) — Set-Cookie absent on every failure path.
export async function GET(request: Request) {
  // -------- STEP 1: build Origin/Referer allow-list (fail closed on malformed env vars) --------
  // CMA F-1 v1.3: try/catch around new URL() — fail closed (403) on undefined/malformed env var,
  // never crash with 500. .filter() handles the optional NEXT_PUBLIC_SANITY_STUDIO_URL case.
  //
  // CMA F14 v2.1: NEXT_PUBLIC_SANITY_STUDIO_URL is optional in dev only (D14 + F5 v2.1
  // refinement: required in production + preview, optional in development). When unset
  // in dev, the .filter() below drops it and Studio-origin requests are rejected with 403.
  // This is correct fail-closed behavior — set the env var in `site/.env.local` if the
  // local Studio is running (pre-flight check #17 v2.1 verifies).
  //
  // CMA F8 v2.1: explicit exclusion of the literal-string "null" origin AND empty-string
  // origin. `new URL('/').origin` returns the literal string "null" (not the `null` value)
  // in some environments. Sandboxed iframes send `Origin: null` as a literal string. If
  // any allow-list env var resolved to a "null" origin (e.g., a path-relative URL that
  // passed D14's z.string().url() in some edge case), the allow-list would contain "null"
  // and a sandboxed-iframe request would match. The D14 `.url()` validator partially
  // mitigates this, but the defense must be explicit in the route code.
  const rawAllowed = [env.NEXT_PUBLIC_SITE_URL, env.NEXT_PUBLIC_SANITY_STUDIO_URL]
    .filter((v): v is string => typeof v === 'string' && v.length > 0)

  const allowedOrigins = rawAllowed.flatMap((allowed) => {
    try {
      const origin = new URL(allowed).origin
      // CMA F8 v2.1: reject literal "null" string + empty origin.
      if (origin === 'null' || origin === '') return []
      return [origin]
    } catch { return [] }
  })

  // CMA BvR #34 v2.2: dev-only serving-origin expansion. NEXT_PUBLIC_SITE_URL holds the
  // canonical/hreflang URL (per CLAUDE.md), which differs from the actual serving origin
  // in local dev (canonical = staging.jakevibes.dev; serving = http://localhost:3000).
  // Without this expansion, Sanity Presentation's iframe-initiated enable navigation
  // (Referer = serving origin, set by next-sanity in-iframe JS rather than Studio parent
  // setting iframe.src) fails STEP 2 with 403. The NODE_ENV gate keeps production
  // security identical — Vercel sets NODE_ENV='production' on every deploy tier (dev
  // preview, branch preview, production), so this branch is dead code outside `next dev`.
  // Decision: code fix vs env override (NEXT_PUBLIC_SITE_URL=http://localhost:3000
  // locally). Code fix wins because env override leaks localhost into canonical/hreflang
  // URLs in dev, masking potential SEO bugs and forcing every customer's brief to inherit
  // the same env-quirk workaround. Code fix keeps NEXT_PUBLIC_SITE_URL as the single
  // canonical concept; this route's dev-only branch is the only place the serving-vs-
  // canonical split is handled.
  // Pattern 13 audit (v2.2):
  //   (a) Reachability — NODE_ENV is set deterministically by Next.js + Vercel; reliable.
  //   (b) Side-effects — .push() mutates the local `allowedOrigins` array only; no state
  //       leaks beyond this request.
  //   (c) Bypass surface — production-with-spoofed-NODE_ENV is not a real attack; Vercel
  //       doesn't honour user NODE_ENV overrides, and a self-hosted operator who sets
  //       NODE_ENV=development in production has already opted out of production hardening.
  //   (d) Failure mode — safeUrlOrigin() wraps new URL() in try/catch and returns null on
  //       malformed request.url; the `if (servingOrigin && …)` null-check covers it.
  //   (e) Customer transfer — every customer's TEMPLATE-* phase inherits the same
  //       canonical-vs-serving-origin split. Pattern is reusable as-is.
  if (process.env.NODE_ENV === 'development') {
    const servingOrigin = safeUrlOrigin(request.url)
    if (servingOrigin && !allowedOrigins.includes(servingOrigin)) {
      allowedOrigins.push(servingOrigin)
    }
  }

  // -------- STEP 2: Origin/Referer check --------
  // CMA F-1 + prior-round F-2 v1.3: Origin may be absent on top-level navigation; fall back
  // to Referer (which iframes do send). Either must match the allow-list.
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const refererOrigin = referer ? safeUrlOrigin(referer) : null

  const callerOrigin = origin ?? refererOrigin

  // CMA BvR #35 v2.2: Sanity Presentation strips BOTH Origin and Referer on the enable
  // navigation — observed 2026-05-12 via §6 trigger #11 diagnostic logging. F-1 v1.3's
  // "Origin OR Referer must match" fallback assumed iframe nav carries at least one;
  // Sanity's Referrer-Policy stance (no-referrer or strict-origin equivalent) strips
  // both. D6 v1.3 reframe: the preview-url-secret IS Sanity's documented auth signal,
  // not Origin/Referer. STEP 3 secret validation is the real auth barrier.
  //
  // To accommodate Sanity's protocol without weakening security: accept null/null
  // callerOrigin ONLY when the request bears Sanity's canonical 3-query-param
  // signature (sanity-preview-secret + sanity-preview-perspective + sanity-preview-
  // pathname). The signature is forgeable — it is NOT a security boundary. It is a
  // cheap pre-filter that limits the null/null escape hatch to requests structurally
  // matching Sanity's protocol; STEP 3 secret validation immediately follows and is
  // the actual auth gate. Stolen-secret-via-XSS attackers gain the ability to enable
  // draft mode from any page (not just allow-listed pages), but draft mode is a
  // low-value target (read-only preview of draft content; no write, no auth) and
  // Sanity's secret rotates per preview-url-secret protocol. Acceptable risk delta
  // for matching Sanity's actual implementation.
  //
  // Pattern 13 audit (v2.2 — BvR #35):
  //   (a) Reachability — branch fires only when BOTH origin and refererOrigin are JS
  //       null (header absent). Literal-string "null" Origin/Referer (sandboxed iframe
  //       case, F8 v2.1) still rejects via `!allowedOrigins.includes("null")` because
  //       F8 guard kept "null" out of allowedOrigins. (d.5a/d.5b) tests still pass.
  //   (b) Side-effects — pure boolean evaluation; no state mutation.
  //   (c) Bypass surface — 3-param signature is trivially forgeable from any client;
  //       this is NOT a security boundary. The pre-filter limits null/null to requests
  //       shaped like Sanity's protocol; STEP 3 secret validation is the actual gate.
  //       Risk delta vs F-1 v1.3: stolen-secret attackers can enable draft mode from
  //       any origin (not just allow-listed origins). Draft mode is read-only preview;
  //       acceptable in exchange for matching Sanity's documented protocol.
  //   (d) Failure mode — hasSanityPreviewSignature() wraps `new URL(request.url)` in
  //       try/catch and returns false on parse failure (fail closed). null/null with
  //       a malformed request.url falls through to the rejection branch.
  //   (e) Customer transfer — every customer using Sanity Presentation inherits the
  //       same 3-param protocol. The pre-filter is Sanity-specific; a future CMS
  //       swap requires renaming the helper and the param-name constants. Document
  //       this Sanity-specific coupling in CONVENTIONS Entry 3.
  const callerOriginAllowed = callerOrigin !== null && allowedOrigins.includes(callerOrigin)
  const sanityNullOriginAllowed = callerOrigin === null && hasSanityPreviewSignature(request.url)

  if (allowedOrigins.length === 0 || (!callerOriginAllowed && !sanityNullOriginAllowed)) {
    return new Response('Origin not allowed', { status: 403 })
  }

  // -------- STEP 3: preview-url secret validation --------
  // CMA F-6 v1.3: try/catch around validatePreviewUrl — error may carry token metadata in
  // Authorization header traces. Do not log, do not serialize, do not propagate Error.message.
  //
  // CMA F7 v2.1 (claude-sonnet-4.6_security): explicit named binding `err` + prohibition
  // comment. A well-intentioned future developer might add `captureException(err)` (Sentry,
  // Datadog, etc.) here, which would forward the full error object — including any
  // `Authorization: Bearer <token>` header values carried in validatePreviewUrl's internal
  // HTTP-call traces — to a third-party logging service. The named `err` binding is here
  // SPECIFICALLY so the prohibition can reference it, NOT so it can be logged.
  let validation: { isValid: boolean; redirectTo?: string }
  try {
    validation = await validatePreviewUrl(previewValidationClient, request.url)
  } catch (err) {
    // SECURITY (CMA F-6 v1.3 + F7 v2.1): `err` may contain Authorization header values
    // captured from validatePreviewUrl's internal HTTP calls. DO NOT:
    //   - log err, err.message, err.stack, JSON.stringify(err), or any field of err
    //   - call captureException(err) / Sentry.captureException(err) / similar
    //   - forward err to Datadog, NewRelic, Honeycomb, or any third-party error service
    //   - return err.message in the response body (we return a generic string instead)
    // SAFE: a sanitized indicator without the error object — e.g.:
    //   console.error('[draft-mode/enable] validatePreviewUrl threw — check token config')
    // The framework error handler is intentionally bypassed by returning an explicit
    // Response — Next.js's default 500 page may format and surface err contents in dev.
    void err
    return new Response('Preview validation failed', { status: 500 })
  }
  if (!validation.isValid) return new Response('Invalid secret', { status: 401 })

  // -------- STEP 4: redirectTo same-origin check (BEFORE draftMode().enable()) --------
  // CMA F-2 v1.3: redirectTo same-origin check BEFORE draftMode().enable() — NEVER reorder.
  // An attacker with a valid secret could otherwise leverage an open-redirect into a
  // session-fixation by getting draftMode cookie set before redirect target validated.
  const base = new URL(env.NEXT_PUBLIC_SITE_URL)  // safe per D14 z.string().url()
  const target = new URL(validation.redirectTo ?? '/', base)
  if (target.origin !== base.origin) {
    return new Response('Invalid redirect target', { status: 400 })
  }

  // -------- STEP 5: enable draft mode (ONLY after all validations pass) --------
  ;(await draftMode()).enable()

  // -------- STEP 6: redirect to validated target --------
  redirect(`${target.pathname}${target.search}${target.hash}`)
}

function safeUrlOrigin(url: string): string | null {
  try { return new URL(url).origin }
  catch { return null }
}

// CMA BvR #35 v2.2: Sanity Presentation's preview-url-secret protocol emits these three
// query params on the enable navigation. Sanity-specific by design — see CONVENTIONS
// Entry 3 for the rationale + customer-transfer notes.
function hasSanityPreviewSignature(url: string): boolean {
  try {
    const u = new URL(url)
    return u.searchParams.has('sanity-preview-secret') &&
           u.searchParams.has('sanity-preview-perspective') &&
           u.searchParams.has('sanity-preview-pathname')
  } catch { return false }
}

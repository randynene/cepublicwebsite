'use client'

import Script from 'next/script'
import { useEffect, useId, useRef, useState } from 'react'

// Direct process.env reads — NOT env.ts. Same bridge pattern as the
// Image primitive (Tech Debt #22). env.ts validates server-only secrets
// like SANITY_API_READ_TOKEN as z.string().min(1); importing env.ts in a
// 'use client' bundle would crash hydration because that secret is
// stripped from the client bundle. NEXT_PUBLIC_* vars are inlined at
// build time and validated at the server boundary anyway.
const HUBSPOT_PORTAL_ID_ENV = process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID ?? ''
const FALLBACK_EMAIL_ENV =
  process.env.NEXT_PUBLIC_FALLBACK_EMAIL ?? 'hello@cloudemployee.io'

import { UI_STRINGS } from '@/lib/ui-strings'

import { cn } from '../_utils/cn'

// Module-level split of the load-failed error message around the {{email}}
// placeholder. The string is `as const` and never mutates, so a one-shot
// split at import time is safe and cheaper than per-render destructuring.
const [LOAD_FAILED_BEFORE, LOAD_FAILED_AFTER] =
  UI_STRINGS['form.error.loadFailed'].split('{{email}}')

// C6 HubSpotFormEmbed — vendor-embed wrapper (HALT 6 first-of-kind).
//
// Probe-driven decisions (Hard Rule #2 — see scripts/design/probe-hubspot-embed.mjs):
//
//   - 38 CE pages embed HubSpot forms inline via the Forms v2 API
//     (`hbspt.forms.create({ portalId, formId, region })`). All use a
//     consistent script URL (https://js.hsforms.net/forms/embed/v2.js)
//     and CE's HubSpot portal `22809822`. formId varies per form (UUID).
//     Region is omitted on 2/3 sampled embeds (HubSpot defaults to na1).
//
//   - HubSpot's mounted DOM uses stable, documented class names:
//     .hs-form / .hs-form-field / .hs-form-label / .hs-form-required /
//     .hs-input / .hs-error-msgs / .hs-button. Probe attempts to capture
//     mounted DOM in headless mode were blocked (likely IntersectionObserver-
//     gated lazy-load + bot-detection on CE's Webflow→HubSpot bridge);
//     selectors below target HubSpot's documented Forms v2 structure
//     directly (stable across all HubSpot embeds, well-documented in
//     HubSpot's developer reference).
//
// HALT 6 locked decisions (7 total):
//
//   1. Loading state UX — 200px-tall skeleton matching brand-tertiary @5%
//      tint with sr-only "Loading form…" for screen readers. Replaced
//      when HubSpot's onFormReady fires.
//
//   2. Error state UX — 8s timeout with mailto fallback to a configurable
//      contact email (env-driven default; prop-overridable per
//      customer-2 needs).
//
//   3. Styling override scope — Option A (full visual replacement). CSS
//      target selectors hit HubSpot's mounted classes; chassis matches
//      C1 Input + A1 Button + C5 FormField for cross-form consistency.
//      Required asterisk preserved + styled `text-error ml-0.5` (matches
//      C5 FormField asterisk pattern from HALT 5 Decision 5 — visible
//      sighted asterisk + screen-reader aria-required from HubSpot's
//      native required attribute).
//
//   4. Script-load strategy — next/script with strategy="afterInteractive"
//      (NOT lazyOnload). Conversion-critical pages can't wait for browser
//      idle; afterInteractive loads as soon as page becomes interactive.
//      Single global script registration; multiple <HubSpotFormEmbed>
//      instances share the same loaded script.
//
//   5. Form GUID + portal ID API — formId required prop (UUID per form);
//      portalId from NEXT_PUBLIC_HUBSPOT_PORTAL_ID env var with optional
//      override prop; region restricted to 'na1' | 'eu1' | 'ap1'
//      discriminated union; fallbackEmail from NEXT_PUBLIC_FALLBACK_EMAIL
//      env with override.
//
//   6. Submission analytics — onFormSubmit pushes `{ event: 'form_submit',
//      form_id, form_portal }` to window.dataLayer. GTM (already loaded
//      by GlobalScripts) fans out to GA4 / LinkedIn / Hotjar.
//
//   7. 'use client' — mandatory (script load + window.hbspt + useEffect
//      + useState are all client concerns).

declare global {
  interface Window {
    hbspt?: {
      forms: {
        create: (config: {
          portalId: string
          formId: string
          region?: string
          target: string
          onFormSubmit?: ($form: HTMLFormElement) => void
          onFormReady?: () => void
        }) => void
      }
    }
    dataLayer?: Array<Record<string, unknown>>
  }
}

const LOAD_TIMEOUT_MS = 8000
const HUBSPOT_SCRIPT_SRC = 'https://js.hsforms.net/forms/embed/v2.js'

export interface HubSpotFormEmbedProps {
  /** HubSpot form GUID (per-form UUID). Required. */
  formId: string
  /** HubSpot portal ID. Defaults to NEXT_PUBLIC_HUBSPOT_PORTAL_ID env. */
  portalId?: string
  /** HubSpot region. Defaults to 'na1' (HubSpot's default). */
  region?: 'na1' | 'eu1' | 'ap1'
  /** Email shown in the error fallback. Defaults to NEXT_PUBLIC_FALLBACK_EMAIL env. */
  fallbackEmail?: string
  /** Callback when form is submitted. HubSpot passes the native HTMLFormElement. */
  onSubmit?: ($form: HTMLFormElement) => void
  /** Callback when form has finished mounting. */
  onReady?: () => void
  /** Callback when load fails or times out. */
  onError?: (error: Error) => void
  className?: string
}

export function HubSpotFormEmbed({
  formId,
  portalId = HUBSPOT_PORTAL_ID_ENV,
  region = 'na1',
  fallbackEmail = FALLBACK_EMAIL_ENV,
  onSubmit,
  onReady,
  onError,
  className,
}: HubSpotFormEmbedProps) {
  // Deterministic mount-target id — useId is portable across SSR/CSR.
  // Replace `:` with `_` because HubSpot's `target: '#...'` selector
  // chokes on CSS-special characters.
  const targetId = `hsf-${useId().replace(/:/g, '_')}`
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initializedRef = useRef(false)

  // Runtime guard — empty portalId + no override means env var unset.
  // Render error state immediately rather than calling hbspt with empty.
  const portalIdEmpty = !portalId

  useEffect(() => {
    if (portalIdEmpty) {
      setState('error')
      onError?.(
        new Error(
          'NEXT_PUBLIC_HUBSPOT_PORTAL_ID is not set. Configure it in .env.local or pass portalId prop.',
        ),
      )
      return
    }
    if (initializedRef.current) return
    timeoutRef.current = setTimeout(() => {
      if (!initializedRef.current) {
        setState('error')
        onError?.(
          new Error(`HubSpot form ${formId} did not load within ${LOAD_TIMEOUT_MS}ms`),
        )
      }
    }, LOAD_TIMEOUT_MS)
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [formId, onError, portalIdEmpty])

  // tryCreateForm runs both as the next/script onLoad callback (first-load
  // scenario) and on mount (when the script was already loaded by an
  // earlier instance — window.hbspt already global).
  const tryCreateForm = () => {
    if (initializedRef.current) return
    if (typeof window === 'undefined' || !window.hbspt) return
    if (portalIdEmpty) return
    initializedRef.current = true
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    try {
      window.hbspt.forms.create({
        portalId,
        formId,
        region,
        target: `#${targetId}`,
        onFormSubmit: ($form) => {
          if (typeof window !== 'undefined') {
            window.dataLayer?.push({
              event: 'form_submit',
              form_id: formId,
              form_portal: portalId,
            })
          }
          onSubmit?.($form)
        },
        onFormReady: () => {
          setState('ready')
          onReady?.()
        },
      })
    } catch (e) {
      setState('error')
      onError?.(e instanceof Error ? e : new Error(String(e)))
    }
  }

  // Multi-instance safety — if window.hbspt already loaded (another
  // <HubSpotFormEmbed> already mounted earlier), the next/script onLoad
  // won't fire again. Try to create on every mount.
  useEffect(() => {
    if (typeof window !== 'undefined' && window.hbspt) {
      tryCreateForm()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={cn('relative min-h-[200px]', className)}>
      <Script
        src={HUBSPOT_SCRIPT_SRC}
        strategy="afterInteractive"
        onLoad={tryCreateForm}
      />
      {/* HubSpot mount target — full chassis override targeting documented
          Forms v2 class names. Hidden until ready to prevent layout flash. */}
      <div
        id={targetId}
        className={cn(
          state !== 'ready' && 'invisible',
          // Field wrapper — flex-col with gap matching C5 FormField.
          '[&_.hs-form-field]:mb-4 [&_.hs-form-field]:flex [&_.hs-form-field]:flex-col [&_.hs-form-field]:gap-1',
          // Label
          '[&_.hs-form-label]:block [&_.hs-form-label]:text-body [&_.hs-form-label]:font-medium [&_.hs-form-label]:text-text-default',
          // Required asterisk — visible + error red, matches C5 FormField pattern.
          '[&_.hs-form-required]:ml-0.5 [&_.hs-form-required]:text-error',
          // Description legend — small muted text.
          '[&_.hs-field-desc]:text-body-sm [&_.hs-field-desc]:text-text-default/70',
          // Input — full C1 Input chassis match.
          '[&_.hs-input]:block [&_.hs-input]:w-full [&_.hs-input]:rounded-full [&_.hs-input]:bg-surface-elevated',
          '[&_.hs-input]:h-11 [&_.hs-input]:px-4 [&_.hs-input]:py-2.5',
          '[&_.hs-input]:text-body-sm [&_.hs-input]:font-normal [&_.hs-input]:text-text-default',
          '[&_.hs-input]:placeholder:text-text-default/60',
          '[&_.hs-input]:transition [&_.hs-input]:duration-reveal [&_.hs-input]:ease-reveal',
          '[&_.hs-input]:focus-visible:outline-none [&_.hs-input]:focus-visible:ring-2 [&_.hs-input]:focus-visible:ring-offset-2 [&_.hs-input]:focus-visible:ring-ring',
          '[&_.hs-input.invalid]:ring-2 [&_.hs-input.invalid]:ring-error [&_.hs-input.invalid]:ring-offset-2',
          // Textarea — C2 Textarea chassis match.
          '[&_textarea.hs-input]:min-h-[100px] [&_textarea.hs-input]:rounded-[20px] [&_textarea.hs-input]:resize-y',
          // Error messages list.
          '[&_.hs-error-msgs]:list-none [&_.hs-error-msgs]:p-0 [&_.hs-error-msgs]:m-0 [&_.hs-error-msgs]:text-body-sm [&_.hs-error-msgs]:text-error',
          // Submit button — A1 Button primary-teal chassis. SWEEP-CTA (Jul
          // 2026): HubSpot mounts this as a real form-native element we
          // don't template, so the animated `.sf` wipe can't attach here
          // (no `.c` wrapper is possible). Approximated with the same
          // colour-invert END STATE as `sf-p`'s hover (ink bg, lime text)
          // via a plain transition — same visual family, no directional wipe.
          '[&_.hs-button]:inline-flex [&_.hs-button]:items-center [&_.hs-button]:justify-center [&_.hs-button]:gap-2',
          '[&_.hs-button]:rounded-full [&_.hs-button]:bg-brand-primary [&_.hs-button]:text-text-dark',
          '[&_.hs-button]:h-11 [&_.hs-button]:px-4 [&_.hs-button]:py-1.5',
          '[&_.hs-button]:text-body [&_.hs-button]:font-medium [&_.hs-button]:leading-default',
          '[&_.hs-button]:transition-colors [&_.hs-button]:duration-[350ms] [&_.hs-button]:motion-reduce:transition-none',
          '[&_.hs-button]:hover:bg-text-dark [&_.hs-button]:hover:text-brand-primary',
          '[&_.hs-button]:focus-visible:outline-none [&_.hs-button]:focus-visible:ring-2 [&_.hs-button]:focus-visible:ring-offset-2 [&_.hs-button]:focus-visible:ring-ring',
          '[&_.hs-button]:disabled:opacity-50 [&_.hs-button]:disabled:pointer-events-none',
        )}
      />
      {state === 'loading' && (
        <div
          className="absolute inset-0 rounded-lg bg-brand-tertiary/5"
          aria-hidden
        >
          <span className="sr-only">{UI_STRINGS['form.loading']}</span>
        </div>
      )}
      {state === 'error' && (
        <div className="rounded-lg border border-error/30 bg-error/5 p-4 text-body-sm text-text-default">
          {LOAD_FAILED_BEFORE}
          <a
            className="font-medium text-brand-primary hover:underline"
            href={`mailto:${fallbackEmail}`}
          >
            {fallbackEmail}
          </a>
          {LOAD_FAILED_AFTER}
        </div>
      )}
    </div>
  )
}

export default HubSpotFormEmbed

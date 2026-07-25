import 'server-only'
import { createClient } from 'next-sanity'
import { env } from '@/lib/env'

// CMA F-4 v1.3 (panel 2-model consensus, Sonnet + GPT-5.4): tightened stega gating.
// AND-with-prod-block on the explicit flag closes the regression where a misconfigured
// SANITY_STEGA_ENABLED=1 on production env would have leaked stega into production HTML.
//
// CMA F1 + F2 v2.1 (panel 2-model: claude-sonnet-4.6_security + gemini-3-pro_production):
//   - F2: v2.0's Branch B included `&& NODE_ENV !== 'production'`, which evaluates to FALSE
//     on every Vercel preview deploy because Vercel sets NODE_ENV='production' for ALL
//     builds and runtimes (preview + production + dev-on-vercel). v2.0's Branch B was
//     silently broken — stega never enabled on preview unless SANITY_STEGA_ENABLED=1 was
//     also set, defeating the out-of-the-box preview Visual Editing UX. v2.1 drops the
//     NODE_ENV clause from Branch B; VERCEL_ENV === 'preview' is sufficient and accurate.
//   - F1: see the raw-env guard below (replaces v2.0's unreachable + throw-on-prod guard).
//
// CMA F15 v2.1 (gpt-5.4_logic): Branch A enables stega on any non-production VERCEL_ENV,
// including `undefined` (local dev) and other non-prod values. This is by design — it's
// the explicit opt-in path for local development and any non-production Vercel environment.
// NOT a bug; comment captures intent so future readers don't narrow it.
//
// `let` not `const` because the F1 raw-env guard below may override to `false`.
let stegaEnabled =
  // Branch A: explicit opt-in for local dev AND any non-production Vercel environment.
  (process.env.SANITY_STEGA_ENABLED === '1' && process.env.VERCEL_ENV !== 'production') ||
  // Branch B: automatic enable on Vercel preview deployments.
  // NOTE: NODE_ENV is ALWAYS 'production' on Vercel (preview AND prod), so checking it
  // would always be false here — do not add `&& NODE_ENV !== 'production'`. F2 v2.1.
  (process.env.VERCEL_ENV === 'preview')

// CMA F1 v2.1: independent raw-env check — fires regardless of computed stegaEnabled.
// v2.0's `if (stegaEnabled && VERCEL_ENV === 'production') throw` was:
//   (a) LOGICALLY UNREACHABLE — by construction, stegaEnabled can never be true when
//       VERCEL_ENV === 'production' (Branch A requires VERCEL_ENV !== 'production';
//       Branch B requires VERCEL_ENV === 'preview'). The guard provided ZERO actual
//       protection — a future edit that weakened the gate expression would NOT be
//       caught by it. False-confidence theatre.
//   (b) AN AVAILABILITY RISK — a module-scope `throw` in a file imported by
//       layout.tsx → live.ts → sanityFetch crashes the entire worker on every page
//       render, taking down the production site. Unacceptable cost for a
//       misconfiguration that should be caught by env schema + CI, not at runtime.
//
// v2.1 replacement: check the RAW env vars (not the computed stegaEnabled). This fires
// even if the gate expression is weakened by a future edit. Force stegaEnabled to false
// and emit a diagnostic log. Do NOT throw — preserve availability.
//
// CMA I5 v2.2 (gemini-3-pro_production): severity downgraded from console.error → console.warn.
// Rationale: this is module-scope code, re-evaluated on every cold start of every new
// serverless isolate. Under high traffic, hundreds of concurrent cold starts each emit
// the log line. All major observability platforms (Sentry, Datadog, PagerDuty, NewRelic)
// map severity by JS console method:
//   - console.error → "Error" or "Fatal" → triggers on-call alerts at default thresholds
//   - console.warn  → "Warning"          → captured + visible, no page
// At the misconfiguration severity (admin set a flag wrong; route still serves correctly
// because we force-disable stega), the trade-off is correct: visibility kept (Vercel
// renders console.warn in yellow text, still prominently surfaced in runtime logs),
// alert-noise discipline preserved (no false-positive fatal pages for non-fatal config drift).
// The diagnostic message is unchanged so message-grep alerting rules continue to work.
if (
  process.env.VERCEL_ENV === 'production' &&
  process.env.SANITY_STEGA_ENABLED === '1'
) {
  console.warn(
    'CRITICAL [CMA F1 v2.1 + I5 v2.2]: SANITY_STEGA_ENABLED must not be "1" on production. ' +
    'Forcing stegaEnabled = false. Remove the env var from production immediately. ' +
    'See docs/briefs/active/MYGRATR-DESIGN-1-BRIEF-B_v2.2.md §8.3.2 for context.'
  )
  stegaEnabled = false
}

// CMA F4 v2.1: §8.1.5 probe outcome = THROWS — `createClient({ stega: { enabled: true,
// studioUrl: undefined } })` throws at construction with "stega.studioUrl must be defined
// when stega.enabled is true". §8.3.2 code path therefore gates stega.enabled on the
// presence of NEXT_PUBLIC_SANITY_STUDIO_URL. In local dev with the env var unset, stega
// silently disables (broken overlays in dev is acceptable; module-scope crash is not).
// Production/preview always have the env var set per D14 + F5 v2.1 schema refinement.
export const sanityClient = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-01-01',
  // CMA F-9 v1.3: useCdn depends on stegaEnabled — stega requires fresh API responses
  // (not CDN-cached) for click-to-edit overlay markup. Production-without-stega uses CDN.
  useCdn: process.env.NODE_ENV === 'production' && !stegaEnabled,
  perspective: 'published',
  stega: {
    enabled: stegaEnabled && !!env.NEXT_PUBLIC_SANITY_STUDIO_URL,
    studioUrl: env.NEXT_PUBLIC_SANITY_STUDIO_URL,
  },
  // token: undefined here — server-side reads use defineLive's serverToken (per §8.2 + D5).
})

// CMA-C2 + D4: the separate draft-perspective client export was removed at
// DESIGN-1 Step 8.3 (single-client collapse). `validatePreviewUrl` previously
// used that client; replaced by module-scope `previewValidationClient` helper
// inside enable/route.ts per CMA F-7 + F-12 v1.3.

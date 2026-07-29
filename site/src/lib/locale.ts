// Locale + canonical/hreflang helpers for the Cloud Employee site.
//
// CONTRACT for TEMPLATE-* phases:
//   Always pass the canonical US path (no /uk prefix) to generateCanonical
//   and generateHreflang. Both functions normalise defensively, but callers
//   should pass the US path for clarity. Every page's generateMetadata()
//   must call both — this is the single source of truth for canonical and
//   hreflang URLs across the site.
//
// Usage:
//   export async function generateMetadata({ params }) {
//     // ...fetch doc...
//     return {
//       alternates: {
//         canonical: generateCanonical(doc.slug, locale),
//         languages: generateHreflang(`/${routePrefix}/${doc.slug}`),
//       },
//     }
//   }
//
// This module imports env.ts and is therefore SERVER-ONLY in practice: env.ts
// validates server-only vars at module load, so a client bundle that reaches it
// crashes at init. The env-free primitives (Locale, buildLocalePath,
// getLocaleFromPath) live in lib/locale-path.ts and are re-exported below, so
// client components — nav-client and everything under it — can import them
// without dragging env.ts along.

import { env } from '@/lib/env'
import { stripLocalePrefix } from '@/lib/locale-path'

export {
  LOCALES,
  DEFAULT_LOCALE,
  buildLocalePath,
  getLocaleFromPath,
  stripLocalePrefix,
  type Locale,
} from '@/lib/locale-path'

import type { Locale } from '@/lib/locale-path'

function localePrefixedPath(path: string, locale: Locale): string {
  const usPath = stripLocalePrefix(path)
  if (locale !== 'en-GB') return usPath
  // Homepage must be `/uk`, not `/uk/`. Concatenating `/uk` + `/` produced a
  // trailing slash that fought Next's trailingSlash:false redirect and made
  // Screaming Frog report Canonicalised + Redirected on the UK home.
  if (usPath === '/') return '/uk'
  return `/uk${usPath}`
}

// Generates the canonical URL for a given path + locale.
export function generateCanonical(path: string, locale: Locale): string {
  const base = env.NEXT_PUBLIC_SITE_URL
  return `${base}${localePrefixedPath(path, locale)}`
}

// Generates the hreflang alternates object for Next.js metadata.
export function generateHreflang(usPath: string): Record<string, string> {
  const base = env.NEXT_PUBLIC_SITE_URL
  const normalisedUsPath = stripLocalePrefix(usPath)
  return {
    'en-US': `${base}${localePrefixedPath(normalisedUsPath, 'en-US')}`,
    'en-GB': `${base}${localePrefixedPath(normalisedUsPath, 'en-GB')}`,
    'x-default': `${base}${localePrefixedPath(normalisedUsPath, 'en-US')}`,
  }
}

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

import { env } from '@/lib/env'

export const LOCALES = ['en-US', 'en-GB'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'en-US'

export function getLocaleFromPath(path: string): Locale {
  return path.startsWith('/uk/') || path === '/uk' ? 'en-GB' : 'en-US'
}

export function buildLocalePath(path: string, locale: Locale): string {
  if (locale === 'en-US') return path
  // Guard: only strip /uk if it's actually a locale prefix (startsWith '/uk/' or === '/uk')
  // Avoids corrupting paths like /ukraine/... which also startsWith '/uk'
  const stripped =
    path.startsWith('/uk/')
      ? path.slice(3)
      : path === '/uk'
        ? '/'
        : path
  return `/uk${stripped}`
}

// Generates the canonical URL for a given path + locale.
export function generateCanonical(path: string, locale: Locale): string {
  const base = env.NEXT_PUBLIC_SITE_URL
  // Normalise: strip /uk prefix if caller accidentally passes a UK path
  const usPath = path.startsWith('/uk/')
    ? path.slice(3)
    : path === '/uk' ? '/' : path
  const localePath = locale === 'en-GB' ? `/uk${usPath}` : usPath
  return `${base}${localePath}`
}

// Generates the hreflang alternates object for Next.js metadata.
export function generateHreflang(usPath: string): Record<string, string> {
  const base = env.NEXT_PUBLIC_SITE_URL
  // Normalise: strip /uk prefix if caller accidentally passes a UK path
  const normalisedUsPath = usPath.startsWith('/uk/')
    ? usPath.slice(3)
    : usPath === '/uk' ? '/' : usPath
  return {
    'en-US': `${base}${normalisedUsPath}`,
    'en-GB': `${base}/uk${normalisedUsPath}`,
    'x-default': `${base}${normalisedUsPath}`,
  }
}

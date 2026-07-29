// Locale primitives with NO environment dependency.
//
// Split out of lib/locale.ts so client components can use them. locale.ts
// imports env.ts, which validates server-only vars (SANITY_API_READ_TOKEN and
// friends) at module load; pulling it into a client bundle crashes at init.
// lib/url.ts carries a long-standing comment about exactly this hazard, and it
// is consumed by nav-client, a client component.
//
// Nothing here reads env. Anything that needs NEXT_PUBLIC_SITE_URL to build an
// absolute URL (generateCanonical, generateHreflang) stays in locale.ts, which
// re-exports these so existing imports keep working.

export const LOCALES = ['en-US', 'en-GB'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'en-US'

export function getLocaleFromPath(path: string): Locale {
  return path.startsWith('/uk/') || path === '/uk' ? 'en-GB' : 'en-US'
}

/**
 * Put a path in `locale`. Idempotent: an already-prefixed path is stripped
 * before the prefix is re-applied, so calling this twice is harmless.
 */
export function buildLocalePath(path: string, locale: Locale): string {
  const usPath = stripLocalePrefix(path)
  if (locale === 'en-US') return usPath
  // Homepage must be `/uk`, not `/uk/` — Next default is trailingSlash:false,
  // and a trailing slash here fights the redirect + canonical pair.
  if (usPath === '/') return '/uk'
  return `/uk${usPath}`
}

/**
 * Remove a /uk prefix if present.
 *
 * Guarded against paths that merely START with the letters "uk" — /ukraine-devs
 * is not a UK-locale path, and slicing 3 characters off it would silently
 * produce /aine-devs.
 */
export function stripLocalePrefix(path: string): string {
  if (path === '/uk') return '/'
  if (path.startsWith('/uk/')) return path.slice(3)
  return path
}

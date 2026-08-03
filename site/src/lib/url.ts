// MYGRATR-STATIC-1 — URL normalization for Sanity-stored links.
//
// Sanity navigation / footer / hub / page documents store fully-qualified
// URLs (e.g. https://www.cloudemployee.io/services) because the schema's
// `type: 'url'` field expects a valid URI. The Mygratr-hosted site needs
// these to render as INTERNAL Next.js links (client-side nav, no full
// page reload). This helper strips the host when it matches a known list
// and returns the path. Anything that doesn't match is treated as
// external.
//
// Known hosts (in priority order):
//   1. NEXT_PUBLIC_SITE_URL (production / preview env var)
//   2. www.cloudemployee.io / cloudemployee.io (CE source-of-truth host
//      that all CE_SITE_TRUTH and audit-output URLs reference)
//
// Used by Header (Step 5), Footer (Step 3), 404 page (Step 2), and any
// future component that renders Sanity-stored URLs.

// Direct process.env read, NOT env.ts. nav-client (Step 5) is a client
// component that imports toInternalHref(); env.ts validates server-only
// vars (SANITY_API_READ_TOKEN min(1)) which are undefined in the client
// bundle, so importing env.ts here would crash the client at module
// init. NEXT_PUBLIC_SITE_URL is exposed to the client by Next.js, and
// env.ts validates its presence at the server boundary anyway. Same
// bridge pattern as Image primitive (Tech Debt #22 — split env.ts into
// env-client / env-server, deferred to SCAFFOLD-AUDIT).
// From locale-path, NOT locale: the latter imports env.ts, which validates
// server-only vars at module load and crashes a client bundle. nav-client
// imports this file. Same hazard the comment above describes.
import { buildLocalePath, type Locale } from '@/lib/locale-path'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL

const KNOWN_HOSTS = new Set<string>([
  'www.cloudemployee.io',
  'cloudemployee.io',
])

if (SITE_URL) {
  try {
    const siteUrl = new URL(SITE_URL)
    KNOWN_HOSTS.add(siteUrl.host)
  } catch {
    // NEXT_PUBLIC_SITE_URL is validated as .url() at env.ts on the
    // server. This catch is defensive in case the var was somehow
    // unset at client-bundle time.
  }
}

export type InternalHref = {
  href: string
  isExternal: boolean
}

// Files served from the app root have no locale twin. /sitemap.xml exists;
// /uk/sitemap.xml does not, and neither does it on the live Webflow site, whose
// UK footer also points at the unprefixed /sitemap.xml. Prefixing these produced
// a 404 in the footer of every UK page.
const ROOT_FILE_PATH = /\.[a-z0-9]{2,5}$/i

function isRootFile(path: string): boolean {
  return ROOT_FILE_PATH.test(path.split(/[?#]/)[0] ?? '')
}

/**
 * Normalise a Sanity-stored link to an internal path, and put it in `locale`.
 *
 * Every link in the site chrome — header, mega-menus, announcement bar, footer —
 * passes through here, which makes this the one place that can keep a locale
 * intact. Without the locale argument the chrome rendered US links on UK pages:
 * a visitor on /uk/blog clicking anything in the nav was silently thrown back to
 * the US site, and Google saw ~290 UK pages whose every navigational link
 * pointed at the US cluster. The live Webflow site keeps its UK nav in /uk.
 *
 * Anchors, mailto:, tel: and off-site URLs are returned untouched — a locale
 * prefix on those would be nonsense.
 *
 * Safe to apply to an already-prefixed path: buildLocalePath strips an existing
 * /uk before adding one, so it is idempotent.
 */
export function toInternalHref(
  rawHref: string | null | undefined,
  locale: Locale = 'en-US',
): InternalHref {
  if (!rawHref) return { href: '#', isExternal: false }

  // Bare anchors pass through untouched — they address the current page.
  if (rawHref.startsWith('#')) {
    return { href: rawHref, isExternal: false }
  }

  // Already-relative paths are internal; they just need the locale.
  if (rawHref.startsWith('/')) {
    if (isRootFile(rawHref)) return { href: rawHref, isExternal: false }
    return { href: buildLocalePath(rawHref, locale), isExternal: false }
  }

  // Schemes we never rewrite: mailto, tel, etc.
  if (rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) {
    return { href: rawHref, isExternal: true }
  }

  let parsed: URL
  try {
    parsed = new URL(rawHref)
  } catch {
    return { href: rawHref, isExternal: false }
  }

  if (KNOWN_HOSTS.has(parsed.host)) {
    const path = parsed.pathname + parsed.search + parsed.hash
    if (isRootFile(path)) return { href: path, isExternal: false }
    return { href: buildLocalePath(path || '/', locale), isExternal: false }
  }

  return { href: rawHref, isExternal: true }
}

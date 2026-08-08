// Sanity CDN transform params for raw image URL strings (roadmap W1-07).
//
// Several marketing templates render Sanity photos from a GROQ `asset->url`
// projection, which returns the canonical, UNPARAMETERISED original (no
// `auto=format`, no width cap). Consumed by a raw <img> or by next/image, that
// ships the full-resolution original: the source of the oversized-image finding
// (33 instances, 59.7MB). The E1 Image primitive's own loader is already correct
// (`auto=format` + `fit=max` + per-width) - this helper is for the call sites
// that pass a plain URL string instead of a Sanity asset object.
//
// Appends `auto=format` (format conversion - the .png/.heif -> avif/webp win),
// `fit=max` (never upscale; caps the longest side at the source), an honest
// width matched to the rendered size (not a blanket maximum), and a quality that
// matches next.config's allow-list. Non-Sanity URLs (local /design fallbacks,
// /ce-logo.svg) and already-parameterised URLs pass through untouched, so it is
// safe to apply at a call site whose source may be either.
//
// Pure string transform with no server-only imports, so it is usable from both
// server and client components (unlike urlFor in ./image, which is server-only).

export interface SanityImageParams {
  /** Honest max width in device pixels - match the rendered size, not a blanket max. */
  width: number
  /** JPEG/WebP quality. Must be one of next.config's `images.qualities`. Default 75. */
  quality?: number
}

// Generic preserves the caller's exact nullability: a `string` stays `string`,
// a `string | undefined` stays `string | undefined` - the transform never
// introduces `null` where the input could not be null.
export function withSanityImageParams<T extends string | null | undefined>(
  url: T,
  { width, quality = 75 }: SanityImageParams,
): T | string {
  if (!url) return url
  // Only transform canonical Sanity CDN URLs; pass everything else through.
  if (!url.includes('cdn.sanity.io')) return url
  // Do not double-append if the URL already carries a query string.
  if (url.includes('?')) return url
  const w = Math.max(1, Math.round(width))
  return `${url}?auto=format&fit=max&w=${w}&q=${quality}`
}

'use client'

// Direct process.env reads — NOT env.ts. Design-system primitives are
// bundle-cost-sensitive; importing env.ts (which validates server-only vars
// at module load) breaks client bundles. NEXT_PUBLIC_ vars are safe to read
// directly here because Next.js inlines them at build time and validates
// presence at site/src/lib/env.ts boundary anyway. Tracked as Tech Debt #22
// (HALT 3 close): split env.ts into env-client.ts / env-server.ts so
// primitives can import a validated public-vars module without dragging in
// server-only validation. Until then, these inline reads are the bridge.
import { createImageUrlBuilder } from '@sanity/image-url'
import NextImage, { type ImageProps as NextImageProps } from 'next/image'

import { cn } from '../_utils/cn'
import { parseSanityImageRef } from '../_utils/parse-sanity-image-ref'

const SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET

if (!SANITY_PROJECT_ID || !SANITY_DATASET) {
  throw new Error(
    'E1 Image: NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET ' +
      'must be set in the client bundle. Check Vercel env vars / .env.local.',
  )
}

// E1 Image — Sanity-aware next/image wrapper (HALT 7 first-of-kind).
//
// Client component (TEMPLATE-BLOG HALT 2 finding): Sanity-source mode passes
// a closure to next/image's `loader` prop. next/image itself is internally a
// Client Component, and function props are not serializable across the
// RSC → client boundary. Marking the primitive 'use client' lets the loader
// closure stay co-located in the client context, which is required for the
// per-width srcset generation that powers responsive Sanity-CDN delivery.
// Plain-URL mode (no loader) would work in RSC, but the discriminated-union
// shape would need a server-vs-client split that costs more than the
// minor client-bundle increase. COMPONENTS.md "Type: server" line is
// incorrect; corrected at TEMPLATE-BLOG HALT 3 close.
//
// Probe-driven decisions (Hard Rule #2 — see scripts/design/probe-image-styles.mjs
// + scripts/design/probe-image-quality.mjs + scripts/design/verify-sanity-image-builder.mjs):
//
//   - 1147 image elements across 5 CE pages. Format mix: avif 37.8% +
//     png 34.8% + svg 27.1%. CE's CDN auto-converts to avif. next/image
//     does the same automatically via the @sanity/image-url loader's
//     auto('format') method.
//
//   - LCP migration improvement story: CE's hero images have ZERO
//     `priority` / `sizes` / `fetchpriority` optimization. Webflow does
//     not optimize LCP at all. E1 makes priority an EXPLICIT template-
//     level concern via opt-in `priority` prop. Customer-2 protocol:
//     template authors must consciously decide which image is the LCP
//     candidate per-page.
//
//   - Quality default: 80. CE's bpp average 0.020 (≈ q=60-65, adaptive
//     Webflow compression). 80 chosen as small visual migration
//     improvement + LCP win vs q=85.
//
//   - Real CONTENT-1C asset refs: 90/90 sampled refs match the canonical
//     `image-{hash}-{W}x{H}-{format}` shape. parseSanityImageRef regex
//     handles every real-world ref. Format distribution at storage:
//     png=31, heif=26, jpg=33 (Sanity handles auto-format conversion to
//     avif/webp at delivery via the URL builder).
//
// HALT 7 locked decisions (7 total):
//
//   1. `alt` required at TS level. Empty string `""` allowed for
//      decorative images (valid HTML).
//   2. `source` XOR `src` discriminated union (strict — TS rejects both).
//   3. `width`+`height` XOR `fill` discriminated union (strict).
//   4. Sanity asset shape: SanityImageSource (asset + alt + hotspot + crop).
//      Hotspot/crop honored automatically by image-url builder.
//   5. parseSanityImageRef helper (internal, not exposed) extracts dims
//      from `_ref` for fallback/aspect-ratio scenarios.
//   6. PortableText handoff: B3 image block renderer now uses this
//      primitive (replaces the temp <img> from HALT 4 Decision 3).
//   7. Quality default 80 (probe-grounded); priority default false;
//      placeholder default "empty" (opt-in to "blur" via prop).

// Locally-typed source shape — mirrors @sanity/image-url's SanityImageSource
// without importing the deep types path (which moves between major versions).
// Builder accepts any object with `asset._ref` plus optional hotspot/crop;
// these are the only fields it consumes.
export interface SanityImageSource {
  asset?: { _ref?: string; _type?: string } | null
  alt?: string | null
  hotspot?: { x: number; y: number; height?: number; width?: number }
  crop?: { top: number; bottom: number; left: number; right: number }
  // Allow caller to pass through additional fields the builder ignores.
  [key: string]: unknown
}

const imageUrlBuilder = createImageUrlBuilder({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
})

// parseSanityImageRef moved to ../_utils/parse-sanity-image-ref so server
// components (B3 PortableText) can still call it after E1 went client.

// Custom loader for Sanity-source mode — generates URLs via the image-url
// builder so next/image's srcset uses Sanity's CDN-optimized variants.
function makeSanityLoader(source: SanityImageSource) {
  return ({ width, quality }: { src: string; width: number; quality?: number }) =>
    imageUrlBuilder
      .image(source)
      .width(width)
      .quality(quality ?? 80)
      .auto('format')
      .fit('max')
      .url()
}

// =============================================================================
// Discriminated-union prop types — strict
// =============================================================================

// Common props shared across all 4 modes
type CommonProps = {
  alt: string  // required at TS level (decorative = empty string)
  className?: string
  priority?: boolean
  quality?: number
  sizes?: string
  placeholder?: 'empty' | 'blur'
  blurDataURL?: string
  onLoad?: NextImageProps['onLoad']
  onError?: NextImageProps['onError']
}

// Source-mode props (Sanity asset)
type SanitySourceProps = { source: SanityImageSource; src?: never }
type PlainSrcProps = { src: string; source?: never }

// Sizing modes
type IntrinsicSizing = { width: number; height: number; fill?: never }
type FillSizing = { fill: true; width?: never; height?: never }

export type ImageProps =
  & CommonProps
  & (SanitySourceProps | PlainSrcProps)
  & (IntrinsicSizing | FillSizing)

// =============================================================================
// Image
// =============================================================================

export function Image(props: ImageProps) {
  const {
    alt,
    className,
    priority = false,
    quality = 80,
    sizes,
    placeholder = 'empty',
    blurDataURL,
    onLoad,
    onError,
  } = props

  // Resolve which mode (Sanity vs plain URL) and sizing (intrinsic vs fill)
  // via discriminated narrowing. TypeScript guarantees exclusivity at the
  // call site; we mirror that here.
  const isSanityMode = 'source' in props && props.source !== undefined
  const isFillMode = 'fill' in props && props.fill === true

  if (isSanityMode) {
    const source = props.source as SanityImageSource
    const loader = makeSanityLoader(source)
    // The `src` passed to next/image is bypassed by the loader; pass a
    // syntactically-valid placeholder URL.
    const placeholderSrc = '/__sanity-image__'

    if (isFillMode) {
      return (
        <NextImage
          loader={loader}
          src={placeholderSrc}
          alt={alt}
          fill
          sizes={sizes}
          quality={quality}
          priority={priority}
          placeholder={placeholder}
          {...(blurDataURL ? { blurDataURL } : {})}
          className={cn(className)}
          onLoad={onLoad}
          onError={onError}
        />
      )
    }
    return (
      <NextImage
        loader={loader}
        src={placeholderSrc}
        alt={alt}
        width={(props as Extract<ImageProps, { width: number }>).width}
        height={(props as Extract<ImageProps, { height: number }>).height}
        sizes={sizes}
        quality={quality}
        priority={priority}
        placeholder={placeholder}
        {...(blurDataURL ? { blurDataURL } : {})}
        className={cn(className)}
        onLoad={onLoad}
        onError={onError}
      />
    )
  }

  // Plain-URL mode — pass src directly to next/image (no loader override).
  const src = (props as PlainSrcProps).src
  if (isFillMode) {
    return (
      <NextImage
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        quality={quality}
        priority={priority}
        placeholder={placeholder}
        {...(blurDataURL ? { blurDataURL } : {})}
        className={cn(className)}
        onLoad={onLoad}
        onError={onError}
      />
    )
  }
  return (
    <NextImage
      src={src}
      alt={alt}
      width={(props as Extract<ImageProps, { width: number }>).width}
      height={(props as Extract<ImageProps, { height: number }>).height}
      sizes={sizes}
      quality={quality}
      priority={priority}
      placeholder={placeholder}
      {...(blurDataURL ? { blurDataURL } : {})}
      className={cn(className)}
      onLoad={onLoad}
      onError={onError}
    />
  )
}

// parseSanityImageRef now lives in ../_utils/parse-sanity-image-ref — server
// consumers must import from there directly (importing from this file would
// drag in the 'use client' boundary).

export default Image

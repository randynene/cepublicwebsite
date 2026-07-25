import {
  PortableText as SanityPortableText,
  type PortableTextComponents,
} from '@portabletext/react'
import type { ReactNode } from 'react'

import { Heading } from '../heading'
import { Image } from '../image'
import { Link } from '../link'
import { Text } from '../text'
import { VideoEmbed } from '../video-embed'
import { cn } from '../_utils/cn'
import { parseSanityImageRef } from '../_utils/parse-sanity-image-ref'

// B3 PortableText — Sanity body-content renderer (HALT 4 first-of-kind).
//
// Probe-driven decisions (Hard Rule #2 — see scripts/design/probe-richtext-styles.mjs
// + scripts/design/probe-blockquote-styles.mjs):
//
//   - 5 representative pages × CE rich-content enumerated. Block + mark
//     coverage matches schema-locked Portable-Text shape (SCHEMA-1's
//     `studio/schemas/objects/portable-text.ts`) — no superset, no
//     subset. Migration via `@sanity/block-tools.htmlToBlocks` already
//     emits this exact shape (CONTENT-1C migrators).
//
//   - Schema block styles: normal / h2 / h3 / h4 / blockquote.
//     List items: bullet / number.
//     Decorators: strong / em / code / underline / strike-through.
//     Annotations: link `{ href, blank }`.
//     Other types: image `{ asset, alt }`.
//
// HALT 4 locked decisions:
//
//   1. Library: `@portabletext/react` (canonical Sanity-team-maintained,
//      type-safe Components prop, tree-shakeable).
//
//   2. Component-override: partial `components` prop with deep-merged
//      defaults. 95% of consumers use defaults; override hatch exists
//      for edge templates (drop-cap, prose pull-quote variants, etc.).
//
//   3. Image-block render: temporary inline <img> via @sanity/image-url
//      (already installed). E1 Image is HALT 7 — single-line swap when
//      the primitive ships. PortableText not blocked on E1.
//
//   4. Link annotation routes through A2 Link. `blank: true` → `external`
//      prop (sets target="_blank" rel="noopener noreferrer").
//
//   5. Heading routing: `block.style === 'h2' | 'h3' | 'h4'` →
//      <Heading as={style}>. `as="h3"` HARD-OVERRIDES the size default
//      to "h4" (24px) — see Decision 6 below.
//
//   6. <h3> blocks render at h4 visual size (Decision 6 — migration
//      improvement). HALT 3's `as="h3"` defaults to size="h2" (40px) for
//      general usage, BUT in PortableText specifically (content-authored
//      from Sanity), h2/h3/h4 must be visually distinguishable to
//      preserve author intent. Override default size in this primitive
//      so editorial hierarchy survives migration. Templates that want
//      different h3 treatment (glossary, etc.) override via components
//      prop. Same Hard-Rule-#2 nuance applied to Tag (decorative <div>
//      → routable anchor) and Accordion (plus/minus → chevron).
//
//   7. Unknown handlers — dev warning + production graceful fallback,
//      consistent across all 5 handler types (block / type / mark /
//      list / listItem). Schema drift surfaces in dev; production never
//      crashes.
//
//   8. List-item DOM weight — className directly on <li> (no <Text>
//      wrapper span). Same visual styling, ~50% lighter DOM for long
//      lists.
//
//   9. Server component — no 'use client'. PortableText renders Sanity-
//      fetched body content, dominantly server-side via RSC. Library is
//      RSC-safe; default components are pure renderers; Link (which is
//      'use client' via next/link) renders fine inside RSC.
//
//  10. Blockquote styling — full 4-side border + 24px medium font +
//      auto-quote ::before glyph (probe-confirmed CE pattern, NOT the
//      typical left-border-italic convention). Uses brand-primary @5%
//      border + text-h4 token + line-height 1.6.
//
//      Mobile-probe correction (DEV-19): CE ships uniform 40px/60px
//      padding across all viewports — the 60px h-padding leaves ~255px
//      content width at 375px, visibly bad. Migration improvement
//      cascade applied: 24px → 48px → 60px h-padding (px-6 md:px-12
//      lg:px-[60px]); 24px → 32px → 40px v-padding (py-6 md:py-8 lg:py-10).
//
//      ::after asymmetry (probe-confirmed): CE renders ::before
//      open-quote glyph only; ::after content=none. Asymmetric is
//      intentional CE design — preserved here, not a bug.
//
//      Line-height: CE measured at exactly 1.6 across all viewports.
//      Our --leading-* token range (1.07 / 1.16 / 1.20 / 1.50) overrides
//      Tailwind defaults and contains no 1.6 entry — using arbitrary
//      `leading-[1.6]`. Logged as token-coverage gap for Step 9 review.

const defaultComponents: PortableTextComponents = {
  block: {
    // BvR #42 (TEMPLATE-BLOG HALT 2 visual review): body paragraph size
    // stepped from `default` (16px) to `lead` (18px) to match CE's blog body
    // typography. Sitewide — applies to every PortableText consumer (TL;DR
    // callouts, FAQ accordion bodies, author aboutContent, future templates).
    // Locked decision per Jake (§6.1 visual review): body copy size should
    // be consistent across templates, not per-template-customized.
    normal: ({ children }) => <Text as="p" size="lead">{children}</Text>,
    h2: ({ children }) => <Heading as="h2">{children}</Heading>,
    // Decision 6 — h3 size hard-overridden to h4 (24px). Without this,
    // Heading's HALT-3 default would render h3 at h2 visual (40px) and
    // article hierarchy would collapse to flat 40-or-40 spacing.
    h3: ({ children }) => (
      <Heading as="h3" size="h4">
        {children}
      </Heading>
    ),
    h4: ({ children }) => <Heading as="h4">{children}</Heading>,
    // BvR #46 — h5/h6 handlers added after probe-rich-text-gaps surfaced
    // 51 h5 + 18 h6 instances sitewide falling through to unknownBlockStyle
    // (rendered as <Text as="p">). Both map to size="h4" (24px) by Heading
    // default — visually identical to h4, semantically distinct in HTML.
    h5: ({ children }) => <Heading as="h5">{children}</Heading>,
    h6: ({ children }) => <Heading as="h6">{children}</Heading>,
    blockquote: ({ children }) => (
      <blockquote
        className={cn(
          'my-6 border border-brand-primary/5',
          // Responsive padding cascade (DEV-19 — mobile probe correction).
          // CE ships uniform 60px h-padding which is unusable at 375px.
          'px-6 md:px-12 lg:px-[60px]',
          'py-6 md:py-8 lg:py-10',
          // text-h4 (24px) + 1.6 line-height (probe-measured, no token match).
          'text-h4 font-medium leading-[1.6] text-text-default',
          // Asymmetric open-quote-only — probe-confirmed CE design choice.
          '[quotes:auto] before:content-[open-quote]',
        )}
      >
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="my-4 list-disc space-y-2 pl-6">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="my-4 list-decimal space-y-2 pl-6">{children}</ol>
    ),
  },
  listItem: {
    // Decision 8 — className directly on <li>; no <Text> wrapper.
    // BvR #42 — text-body → text-body-lead to match paragraph step-up above.
    bullet: ({ children }) => (
      <li className="text-body-lead leading-relaxed text-text-default">{children}</li>
    ),
    number: ({ children }) => (
      <li className="text-body-lead leading-relaxed text-text-default">{children}</li>
    ),
  },
  marks: {
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    code: ({ children }) => (
      <code className="rounded bg-surface-base px-1 py-0.5 font-mono text-body-sm">
        {children}
      </code>
    ),
    underline: ({ children }) => <u>{children}</u>,
    'strike-through': ({ children }) => <s>{children}</s>,
    link: ({ children, value }) => {
      const href = (value as { href?: string })?.href ?? '#'
      const blank = !!(value as { blank?: boolean })?.blank
      return (
        <Link href={href} external={blank}>
          {children}
        </Link>
      )
    },
  },
  types: {
    image: ({ value }) => {
      const v = value as {
        asset?: { _ref?: string }
        alt?: string
        caption?: string
        hotspot?: { x: number; y: number; height?: number; width?: number }
        crop?: { top: number; bottom: number; left: number; right: number }
      }
      if (!v?.asset?._ref) return null
      // Resolved at E1 (Step 2.13) — replaces the temp <img> from HALT 4.
      // Pull intrinsic dimensions from the asset _ref so next/image gets
      // proper aspect-ratio + LCP optimization. parseSanityImageRef
      // returns null for legacy refs; in that case we fall back to a
      // sensible 1200×800 default (the dominant CE blog-post image
      // ratio per probe).
      const dims = parseSanityImageRef(v.asset._ref) ?? { width: 1200, height: 800 }
      return (
        <figure className="my-6">
          {/* BvR #42 (HALT 2 visual review): inline body images need rounded
           * corners to match hero (rounded-lg), author thumbnail (rounded-md),
           * and related-post thumbnails. Wrap in a rounded+overflow-hidden
           * container — NOT the figure itself, which must leave the figcaption
           * outside the rounded bounds. */}
          <div className="overflow-hidden rounded-lg">
            <Image
              source={v}
              alt={v.alt ?? ''}
              width={dims.width}
              height={dims.height}
              sizes="(min-width: 768px) 720px, 100vw"
            />
          </div>
          {v.caption && (
            <figcaption className="mt-2 text-body-sm text-text-default/70">
              {v.caption}
            </figcaption>
          )}
        </figure>
      )
    },
    // CONTENT-1E videoEmbed handler — Webflow w-embed recovery (Tech Debt #25).
    // Mode `eager` because PortableText blocks carry no poster image; lite
    // mode would crash on the type-level `poster` requirement. parseVideoUrl
    // extension covers Vimeo / YouTube / LinkedIn URL shapes.
    videoEmbed: ({ value }) => {
      const v = value as { url?: string; caption?: string }
      if (!v?.url) return null
      return (
        <figure className="my-6">
          <VideoEmbed url={v.url} mode="eager" title={v.caption ?? 'Embedded video'} />
          {v.caption && (
            <figcaption className="mt-2 text-body-sm text-text-default/70">
              {v.caption}
            </figcaption>
          )}
        </figure>
      )
    },
    // CONTENT-1E table handler — Webflow w-embed recovery (Tech Debt #25).
    // Locked decision Option α: brand-tertiary token for header bg. No new
    // design tokens. `boldFirstColumn` honours Webflow's `.bold-col-one`
    // class (86% of CE tables, per sweep).
    table: ({ value }) => {
      const v = value as {
        headerRows?: Array<{ cells?: string[] }>
        bodyRows?: Array<{ cells?: string[] }>
        caption?: string
        boldFirstColumn?: boolean
      }
      const headerRows = v.headerRows ?? []
      const bodyRows = v.bodyRows ?? []
      if (headerRows.length === 0 && bodyRows.length === 0) return null
      return (
        <figure className="my-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-text-default/10">
              {headerRows.length > 0 && (
                <thead>
                  {headerRows.map((row, ri) => (
                    <tr key={ri}>
                      {(row.cells ?? []).map((cell, ci) => (
                        <th
                          key={ci}
                          scope="col"
                          className="bg-brand-tertiary px-4 py-3 text-left text-body-sm font-semibold text-text-on-dark"
                        >
                          {cell}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
              )}
              <tbody>
                {bodyRows.map((row, ri) => (
                  <tr key={ri}>
                    {(row.cells ?? []).map((cell, ci) => (
                      <td
                        key={ci}
                        className={cn(
                          'border-t border-text-default/10 px-4 py-3 text-body-sm text-text-default',
                          v.boldFirstColumn && ci === 0 && 'font-semibold',
                        )}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {v.caption && (
            <figcaption className="mt-2 text-body-sm text-text-default/70">
              {v.caption}
            </figcaption>
          )}
        </figure>
      )
    },
  },
  // Decision 7 — dev warning + production graceful fallback, consistent
  // across all five unknown handlers.
  unknownBlockStyle: ({ children, value }) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn(
        '[PortableText] unknown block style:',
        (value as { style?: string })?.style,
      )
    }
    return <Text as="p">{children}</Text>
  },
  unknownType: ({ value }) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn(
        '[PortableText] unknown type:',
        (value as { _type?: string })?._type,
      )
    }
    return null
  },
  unknownMark: ({ children, markType }) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn('[PortableText] unknown mark:', markType)
    }
    return <span>{children}</span>
  },
  unknownList: ({ children }) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn('[PortableText] unknown list type')
    }
    return <ul className="my-4 list-disc pl-6">{children}</ul>
  },
  unknownListItem: ({ children }) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn('[PortableText] unknown listItem')
    }
    return <li>{children}</li>
  },
}

// Deep-merge override (Decision 2) — one level deep covers the
// PortableTextComponents shape: top-level keys (block / list / listItem
// / marks / types) hold objects of renderer functions. Consumer's
// override merges into each top-level key without flattening the rest.
type ComponentsObject = Record<string, unknown>
function mergeComponents(
  base: PortableTextComponents,
  override: Partial<PortableTextComponents>,
): PortableTextComponents {
  const result: ComponentsObject = { ...(base as ComponentsObject) }
  for (const key of Object.keys(override) as Array<keyof PortableTextComponents>) {
    const baseVal = (base as ComponentsObject)[key]
    const overrideVal = (override as ComponentsObject)[key]
    if (
      typeof baseVal === 'object' &&
      baseVal !== null &&
      !Array.isArray(baseVal) &&
      typeof overrideVal === 'object' &&
      overrideVal !== null &&
      !Array.isArray(overrideVal)
    ) {
      result[key] = { ...(baseVal as ComponentsObject), ...(overrideVal as ComponentsObject) }
    } else if (overrideVal !== undefined) {
      result[key] = overrideVal
    }
  }
  return result as PortableTextComponents
}

export interface PortableTextProps {
  value: Parameters<typeof SanityPortableText>[0]['value']
  components?: Partial<PortableTextComponents>
  className?: string
}

export function PortableText({
  value,
  components,
  className,
}: PortableTextProps): ReactNode {
  if (!value || (Array.isArray(value) && value.length === 0)) return null
  const merged = components ? mergeComponents(defaultComponents, components) : defaultComponents
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <SanityPortableText value={value} components={merged} />
    </div>
  )
}

export default PortableText

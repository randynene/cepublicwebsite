import Image from 'next/image'
import type { CSSProperties } from 'react'

import { Marquee } from '@/components/ui/marquee'
import { cn } from '@/components/ui/_utils/cn'

// The rotating client logo strip that sits under every marketing hero.
//
// TWO THINGS THIS FILE IS CAREFUL ABOUT:
//
// 1. NO MARGINS FOR SPACING. The Hire Engineers and Fractional CTO stylesheets
//    open with `.he, .he * { margin: 0 }`. That has the same specificity as a
//    Tailwind margin utility and loads after it, so `mx-[28px]` on a logo was
//    silently zeroed and the logos rendered 1px apart. Spacing here comes from
//    fixed-width cells, which no reset touches. Do not "tidy" this back into
//    margins or gap-x.
//
// 2. OPTICAL BALANCE, NOT LITERAL HEIGHT. These marks have wildly different
//    aspect ratios (Scorpion is 7:1, Tidal is 2:1). Rendering them all at one
//    height makes Scorpion a banner and Tidal a stamp, so each carries its own
//    tuned cap and every logo is additionally bounded by the cell.

export interface ClientLogo {
  name: string
  src: string
  width: number
  height: number
  /**
   * How to treat the asset on the dark ground.
   *   'lineart' (default) - transparent-background mark, flattened to solid
   *      white with brightness(0) invert(1).
   *   'asis' - the asset is ALREADY light-on-dark and needs no filter.
   *      travelex.png is a black card with white type; filtering it either way
   *      produced a lit rectangle sitting in the middle of the row.
   */
  tone?: 'lineart' | 'asis'
  /** Tuned render height in px, for optical balance across mismatched marks. */
  displayH?: number
  /** Opacity override. Defaults to 1. */
  displayOpacity?: number
}

const IMG = '/design/home/logos'

/** The canonical seven. Home imports these too, so there is one list. */
export const CLIENT_LOGOS: ClientLogo[] = [
  { name: 'Virgin Experience Days', src: `${IMG}/virgin.png`, width: 260, height: 105, displayH: 34 },
  { name: 'Salmon', src: `${IMG}/salmon.png`, width: 260, height: 63, displayH: 30 },
  { name: 'Hotelplan', src: `${IMG}/hotelplan.png`, width: 260, height: 55, displayH: 26 },
  { name: 'Willo', src: `${IMG}/willo.png`, width: 260, height: 84, displayH: 30 },
  // travelex.png is a scraped screenshot of a two-tone card, not a logo: a dark
  // panel reading "Travelex" beside a grey panel reading "worldwide money".
  // Every filter treatment left a visible box sitting in the middle of the row.
  // travelex-wordmark.png is that wordmark lifted onto transparency (generated
  // from the original, which is untouched), so it behaves like the other six.
  // CE-31 (Aug 2026): Seb asked for Travelex to be bigger - it sat at 22, the
  // smallest in a row of 26-36. Raised to 28. It cannot go much further: the
  // wordmark asset is natively 103x22, and the only source is the 260x75
  // scraped card above, whose text is barely larger. Past ~28 it visibly softens
  // on retina. A vector Travelex logo from Seb would lift this ceiling.
  { name: 'Travelex', src: `${IMG}/travelex-wordmark.png`, width: 103, height: 22, displayH: 28 },
  { name: 'Tidal', src: `${IMG}/tidal.png`, width: 260, height: 124, displayH: 36 },
  { name: 'Scorpion', src: `${IMG}/scorpion.png`, width: 260, height: 37, displayH: 20, displayOpacity: 0.85 },
  // CE-32 (Aug 2026): added on Seb's request. Source is the SVG he attached to
  // the issue, kept alongside as vector.svg; this PNG is rasterised from it
  // because every other mark here is a PNG and next/image will not run SVG
  // through the optimiser without `dangerouslyAllowSVG`. Black artwork on
  // transparency, so the default 'lineart' treatment flattens it to white. Wide
  // wordmark (4.6:1), hence a lower displayH than the squarer logos beside it -
  // at 26 it renders 120px wide, inside MAX_LOGO_W.
  { name: 'Vector', src: `${IMG}/vector.png`, width: 1040, height: 225, displayH: 26 },
]

/**
 * Assets that must be replaced rather than re-filtered, keyed by logo name.
 *
 * Home and the location pages keep their own Sanity-editable logo lists, and
 * Sanity serves them as CDN URLs, so a path-based match cannot reach them.
 * Sanity's "Travelex" asset is the same scraped card as the local file, and run
 * through the line-art filter it rendered as a solid white rectangle in the
 * middle of the row.
 *
 * REMOVE THIS once a clean transparent wordmark is uploaded to Sanity. The file
 * to upload is the one referenced here.
 */
const ASSET_OVERRIDE: Record<string, ClientLogo> = {
  travelex: {
    name: 'Travelex',
    src: `${IMG}/travelex-wordmark.png`,
    width: 103,
    height: 22,
    // CE-31: keep in step with the Travelex entry in CLIENT_LOGOS above. This
    // override returns a WHOLE logo, so it wins outright - editing displayH in
    // CLIENT_LOGOS alone changes nothing on any page that goes through here.
    displayH: 28,
  },
}

/**
 * Bring a caller-supplied logo up to the canonical rendering treatment.
 *
 * Matching is on NAME, because the same seven companies arrive as local paths
 * on some pages and as Sanity CDN URLs on others. An unrecognised logo passes
 * through untouched, so a new client Seb adds in Studio still renders.
 */
function normalise(logo: ClientLogo): ClientLogo {
  const key = logo.name.trim().toLowerCase()
  const override = ASSET_OVERRIDE[key]
  if (override) return { ...override, name: logo.name }

  const known = CLIENT_LOGOS.find((c) => c.name.trim().toLowerCase() === key)
  if (!known) return logo
  // Treatment and optical sizing come from the canonical entry; the caller
  // keeps its own asset, which may legitimately be a newer upload.
  return {
    ...logo,
    tone: known.tone,
    displayH: known.displayH,
    displayOpacity: known.displayOpacity,
  }
}

/** Cell width. Wide enough that the broadest mark (Scorpion) clears its
 *  neighbours, and it is what creates the gap now that margins cannot. */
const CELL = 'w-[188px]'
/** Nothing may exceed this, so one very wide mark cannot dominate the row. */
const MAX_LOGO_W = 132

export function ClientLogoImage({
  logo,
  className,
  style,
}: {
  logo: ClientLogo
  className?: string
  style?: CSSProperties
}) {
  const filterClass =
    logo.tone === 'asis' ? undefined : '[filter:brightness(0)_invert(1)]'
  return (
    <Image
      src={logo.src}
      alt={logo.name}
      width={logo.width}
      height={logo.height}
      style={style}
      className={cn('h-auto w-auto object-contain', filterClass, className)}
    />
  )
}

/**
 * Scrolling strip of client logos.
 *
 * The list is doubled before it reaches Marquee (which duplicates its children
 * again for the seamless loop) because seven logos alone leave a visible gap on
 * a wide viewport before the track comes round.
 *
 * The gradient masks at each end stop logos from hard-cutting mid-wordmark at
 * the band edge, which is what made the row read as broken rather than moving.
 * `groundColor` must match the section background behind the strip.
 */
export function ClientLogoStrip({
  logos = CLIENT_LOGOS,
  className,
  groundColor = '#070D18',
}: {
  logos?: ClientLogo[]
  className?: string
  groundColor?: string
}) {
  const resolved = logos.map(normalise)
  return (
    <div className={cn('relative min-w-0 flex-1', className)}>
      <Marquee speed="slow" pauseOnHover>
        {[...resolved, ...resolved].map((logo, i) => (
          <div
            key={`${logo.name}-${i}`}
            className={cn(
              CELL,
              'flex shrink-0 items-center justify-center border-l border-[#22314D]',
            )}
          >
            <ClientLogoImage
              logo={logo}
              style={{
                maxHeight: `${logo.displayH ?? 26}px`,
                maxWidth: `${MAX_LOGO_W}px`,
                opacity: logo.displayOpacity ?? 1,
              }}
            />
          </div>
        ))}
      </Marquee>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-[56px]"
        style={{ background: `linear-gradient(to right, ${groundColor}, transparent)` }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-[56px]"
        style={{ background: `linear-gradient(to left, ${groundColor}, transparent)` }}
      />
    </div>
  )
}

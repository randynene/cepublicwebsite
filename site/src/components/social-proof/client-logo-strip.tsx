import Image from 'next/image'
import type { CSSProperties } from 'react'

import { Marquee } from '@/components/ui/marquee'
import { cn } from '@/components/ui/_utils/cn'

// The real client logo strip.
//
// The home page had image logos while Fractional CTO rendered the same seven
// companies as plain text names. Seb asked on the 28 Jul review for the real
// strip, and for the moving version over the static row. This is that strip,
// shared so the pages cannot drift apart again.

export interface ClientLogo {
  name: string
  src: string
  width: number
  height: number
  /** Default true. False for assets with a non-transparent background, which
   *  turn into a white blob under a full invert. */
  invert?: boolean
  /** Rendered max-height in px. Defaults to 22. */
  displayH?: number
  /** Opacity override. Defaults to 1. */
  displayOpacity?: number
}

const IMG = '/design/home/logos'

/** The canonical seven. Home imports these too, so there is one list. */
export const CLIENT_LOGOS: ClientLogo[] = [
  { name: 'Virgin Experience Days', src: `${IMG}/virgin.png`, width: 260, height: 105, displayH: 36 },
  { name: 'Salmon', src: `${IMG}/salmon.png`, width: 260, height: 63, displayH: 28 },
  { name: 'Hotelplan', src: `${IMG}/hotelplan.png`, width: 260, height: 55, displayH: 25 },
  { name: 'Willo', src: `${IMG}/willo.png`, width: 260, height: 84, displayH: 28 },
  { name: 'Travelex', src: `${IMG}/travelex.png`, width: 260, height: 75, invert: false, displayH: 28 },
  { name: 'Tidal', src: `${IMG}/tidal.png`, width: 260, height: 124, displayH: 28 },
  { name: 'Scorpion', src: `${IMG}/scorpion.png`, width: 260, height: 37, displayH: 18, displayOpacity: 0.8 },
]

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
    logo.invert === false
      ? '[filter:grayscale(1)_brightness(1.8)] opacity-95'
      : '[filter:brightness(0)_invert(1)] opacity-100'
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
 */
export function ClientLogoStrip({
  logos = CLIENT_LOGOS,
  className,
}: {
  logos?: ClientLogo[]
  className?: string
}) {
  return (
    <Marquee speed="slow" pauseOnHover className={cn('min-w-0 flex-1', className)}>
      {[...logos, ...logos].map((logo, i) => (
        <div key={`${logo.name}-${i}`} className="flex items-center">
          <span aria-hidden className="h-[24px] w-px shrink-0 bg-[#22314D]" />
          <ClientLogoImage
            logo={logo}
            className="mx-[28px] shrink-0"
            style={{
              maxHeight: `${logo.displayH ?? 22}px`,
              opacity: logo.displayOpacity ?? 1,
            }}
          />
        </div>
      ))}
    </Marquee>
  )
}

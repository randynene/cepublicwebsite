import { cn } from '../_utils/cn'
import { TECH_ICON_BY_SLUG } from '../_tech-icons/tech-icon-map'

// The square badge on a technology card.
//
// Three tiers, in order:
//   1. The real brand mark from Sanity (`technology.techLogo`), migrated from
//      Webflow. 99 of the 101 technologies have one - this is the normal case.
//   2. A sprite glyph, for the technologies that have no logo to have. Only MVVM
//      and IAM: both are concepts, not products.
//   3. The two-letter abbreviation, if a technology is added in Studio with
//      neither. Never blank.
//
// The tile is light because the marks are full-colour artwork drawn for a white
// background - the live site puts them on white cards. AWS's mark is #252f3e,
// which is invisible against our #101B30 card, so the logo brings its own
// ground with it.
//
// The logo is decorative: the technology name sits next to it as real text, so
// announcing the image too would just repeat it.
const SPRITE_URL = '/icons/tech-sprite.svg'

export interface TechBadgeProps {
  slug: string
  /** Real brand mark URL from Sanity. */
  logo?: string
  /** Last-resort label when there is no logo and no glyph. */
  abbr: string
  className?: string
}

export function TechBadge({ slug, logo, abbr, className }: TechBadgeProps) {
  const glyph = TECH_ICON_BY_SLUG[slug]

  if (logo) {
    return (
      <span
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-white p-[7px]',
          className,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt="" aria-hidden loading="lazy" decoding="async" className="h-full w-full object-contain" />
      </span>
    )
  }

  return (
    <span
      className={cn(
        'flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-white text-[13px] font-bold',
        className,
      )}
    >
      {glyph ? (
        <svg aria-hidden className="h-[24px] w-[24px] text-[#33415C]">
          <use href={`${SPRITE_URL}#${glyph}`} />
        </svg>
      ) : (
        <span className="text-[#33415C]">{abbr}</span>
      )}
    </span>
  )
}

export default TechBadge

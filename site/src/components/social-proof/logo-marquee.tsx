import { urlFor } from '@/lib/sanity/image'
import type { StoryCard } from '@/lib/sanity/queries/social-proof'
import { UI_STRINGS } from '@/lib/ui-strings'

// The "Trusted by 300+" auto-scrolling client-logo bar. Shared by both hubs.
//
// CSS-only, no JS library (spec requirement). The list is DUPLICATED and the track
// translates 0 -> -50%, so at the halfway point the second copy is exactly where the
// first began and the loop is seamless. `prefers-reduced-motion` stops it dead and
// leaves a static wrapped row - motion here is decoration, and decoration is the first
// thing that setting exists to remove.
//
// Logos are sourced from customer-story `companyLogo` fields - the "trusted by"
// companies ARE our customer stories, so there is no separate data source to maintain.

// `showHeading` (default true) renders the built-in "Trusted by 300+" line for the
// hubs. Pages with their own trusted-by copy (e.g. Our Work uses "70+") pass false
// and render their own heading above the marquee.
export function LogoMarquee({ logos, showHeading = true }: { logos: StoryCard[]; showHeading?: boolean }) {
  const withLogos = logos.filter((l) => l.companyLogo?.asset)
  if (withLogos.length === 0) return null

  // Two copies for the seamless loop. aria-hidden on the whole strip: it is decorative
  // brand reassurance, and a screen reader announcing 34 duplicated company names is
  // noise, not information.
  const track = [...withLogos, ...withLogos]

  return (
    <section aria-label={UI_STRINGS['socialProof.trustedByLabel']} className="overflow-hidden py-2">
      {showHeading ? (
        <p className="mb-8 text-center text-[15px] text-text-default/70">
          {UI_STRINGS['socialProof.trustedByPrefix']}{' '}
          <span className="font-semibold text-brand-primary">{UI_STRINGS['socialProof.count300']}</span>{' '}
          {UI_STRINGS['socialProof.trustedBySuffix']}
        </p>
      ) : null}

      <div
        aria-hidden="true"
        className="relative flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"
      >
        <div className="flex shrink-0 animate-marquee items-center gap-[64px] pr-[64px] motion-reduce:animate-none motion-reduce:flex-wrap motion-reduce:justify-center">
          {track.map((logo, i) => (
            <span key={`${logo._id}-${i}`} className="flex h-[36px] shrink-0 items-center">
              <img
                src={urlFor(logo.companyLogo as Record<string, unknown>).height(72).fit('max').url()}
                alt=""
                className="h-full w-auto object-contain opacity-60 grayscale"
                loading="lazy"
              />
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

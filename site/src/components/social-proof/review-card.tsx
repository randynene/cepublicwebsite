import Link from 'next/link'

import { Image } from '@/components/ui/image'
import { buildLocalePath, type Locale } from '@/lib/locale'
import { urlFor } from '@/lib/sanity/image'
import type { ReviewCard as ReviewCardData } from '@/lib/sanity/queries/social-proof'
import { UI_STRINGS } from '@/lib/ui-strings'

// A testimonial card. Company logo top, quote, then author avatar + name + role, then
// "Read more" to the review's own page.
//
// Everything is a field on the ONE review document, so the photo, name, role and logo
// always belong together. The design shows some avatars as grey initials and some
// logos as dashed name-chips - that was only because the design tool lacked those
// assets. Our data has all 8 photos and all 8 logos, so the real ones render; the
// initials and the name-chip remain only as graceful fallbacks.

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

export function ReviewCard({
  review,
  locale = 'en-US',
}: {
  review: ReviewCardData
  locale?: Locale
}) {
  const name = review.name?.trim() || null
  const logo = review.companyLogo?.asset ? review.companyLogo : null
  const photo = review.photo?.asset ? review.photo : null
  const href = review.slug
    ? buildLocalePath(`/reviews/${review.slug}`, locale)
    : null

  return (
    <article className="group relative flex h-full flex-col rounded-[20px] border border-[#22314D] bg-[#101B30] p-6">
      {/* Company: real logo if we have it, else the name as a chip.
       *
       * SIZED BY HEIGHT, CAPPED BY WIDTH (Aug 2026). The band was 28px tall,
       * which is fine for a square-ish mark but leaves the wordmark-with-strapline
       * logos unreadable: Salmon Software (2.9:1), Cleanlink (2.1:1) and
       * Healthpointe (2.5:1) rendered their second line at two or three pixels.
       * The band is now 44px, so those three gain about 57%.
       *
       * The width cap is what stops that helping one logo at another's expense:
       * Aspire Creative is 13:1, and at 44px tall it would have run 580px and
       * swamped the card. It lands on the cap instead.
       *
       * The CDN request asks for 3x the rendered height for retina. It was 2x
       * the OLD height, so on a retina screen these marks were being upscaled -
       * which is the blur, and it is fixed by asking for more pixels rather than
       * by replacing any asset. Every source here is an SVG or is at least 249px
       * wide, so there is real detail to serve. */}
      <div className="mb-4 flex h-[44px] items-center">
        {logo ? (
          <img
            src={urlFor(logo as Record<string, unknown>).height(132).fit('max').url()}
            alt=""
            className="max-h-full w-auto max-w-[220px] object-contain opacity-90 [filter:brightness(0)_invert(1)]"
            loading="lazy"
          />
        ) : null}
      </div>

      <span aria-hidden="true" className="mb-2 block text-[28px] leading-none text-brand-primary/70">
        &ldquo;
      </span>
      <p className="flex-1 text-[15px] leading-[24px] text-text-default/85">{review.quote}</p>

      <div className="mt-6 flex items-center gap-3">
        <span className="flex h-[40px] w-[40px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#22314D] bg-[#16223A] text-[13px] font-semibold text-brand-primary">
          {photo ? (
            <Image
              source={photo as Record<string, unknown>}
              alt=""
              width={40}
              height={40}
              className="h-full w-full object-cover"
            />
          ) : name ? (
            <span aria-hidden="true">{initials(name)}</span>
          ) : null}
        </span>
        <span className="min-w-0">
          {name ? (
            <span className="block text-[15px] font-semibold text-text-default">{name}</span>
          ) : null}
          {review.position ? (
            <span className="block text-[13px] text-brand-primary">{review.position.trim()}</span>
          ) : null}
        </span>
      </div>

      {href ? (
        <Link
          href={href}
          className="mt-5 inline-flex w-fit items-center gap-1.5 text-[14px] font-semibold text-brand-primary after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#070D18]"
        >
          {UI_STRINGS['socialProof.readMore']}
          <span
            aria-hidden="true"
            className="transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none"
          >
            {UI_STRINGS['socialProof.arrow']}
          </span>
        </Link>
      ) : null}
    </article>
  )
}

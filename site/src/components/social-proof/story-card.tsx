import Link from 'next/link'

import { Image } from '@/components/ui/image'
import { cn } from '@/components/ui/_utils/cn'
import { buildLocalePath, type Locale } from '@/lib/locale'
import { urlFor } from '@/lib/sanity/image'
import type { StoryCard as StoryCardData } from '@/lib/sanity/queries/social-proof'
import { UI_STRINGS } from '@/lib/ui-strings'

// A customer-story card. Two sizes: `featured` (large, 2-up hero row) and `grid`.
//
// The image and the company logo both come from the SAME story document, so a card
// can never show one company's photo under another's name. When a story has no image
// the design falls back to a diagonal-stripe placeholder (not another client's photo,
// per the spec's hard rule).
//
// The whole card is one anchor to `/customer-stories/<slug>`, stretched over the card
// via ::after so the click target is the whole tile with a single link in the DOM.

const FEATURED_SIZES = '(min-width: 992px) 50vw, 100vw'
const GRID_SIZES = '(min-width: 992px) 33vw, 100vw'

export function StoryCard({
  story,
  variant = 'grid',
  priority = false,
  locale = 'en-US',
}: {
  story: StoryCardData
  variant?: 'featured' | 'grid'
  priority?: boolean
  locale?: Locale
}) {
  const href = buildLocalePath(`/customer-stories/${story.slug}`, locale)
  const isFeatured = variant === 'featured'
  const logo = story.companyLogo?.asset ? story.companyLogo : null

  return (
    <article
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-[20px] border border-[#22314D] bg-[#101B30]',
        'transition-[transform,box-shadow] duration-[250ms] [transition-timing-function:cubic-bezier(.22,.61,.36,1)]',
        'hover:-translate-y-1 hover:shadow-[0_18px_40px_-24px_rgba(0,0,0,.75)]',
        'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
        'focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-[#070D18]',
      )}
    >
      {/* Image with the company logo overlaid bottom-left, as the design draws it. */}
      <div
        className={cn(
          'relative w-full overflow-hidden bg-[#1B2A45]',
          isFeatured ? 'aspect-[16/10]' : 'aspect-[16/9]',
        )}
      >
        {story.image?.asset ? (
          <Image
            source={story.image}
            alt=""
            fill
            priority={priority}
            sizes={isFeatured ? FEATURED_SIZES : GRID_SIZES}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                'repeating-linear-gradient(135deg, #22314D 0 2px, transparent 2px 10px)',
            }}
          />
        )}

        {logo ? (
          <span className="absolute bottom-4 left-4 flex h-[26px] items-center">
            <img
              src={urlFor(logo as Record<string, unknown>).height(52).fit('max').url()}
              alt=""
              className="h-full w-auto object-contain opacity-90 [filter:brightness(0)_invert(1)]"
              loading="lazy"
            />
          </span>
        ) : null}
      </div>

      <div className={cn('flex flex-1 flex-col gap-3', isFeatured ? 'p-6' : 'p-5')}>
        {/* When there is no logo image, the design shows the company NAME as a chip
            fallback so the card is still attributed. */}
        {!logo && story.companyName ? (
          <span className="inline-flex w-fit items-center rounded-md border border-[#22314D] px-2.5 py-1 text-[12px] font-medium uppercase tracking-wide text-text-default/60">
            {story.companyName}
          </span>
        ) : null}

        <h3
          className={cn(
            'font-semibold leading-snug text-text-default',
            isFeatured ? 'text-[22px]' : 'text-[18px]',
          )}
        >
          <Link
            href={href}
            className="after:absolute after:inset-0 after:content-[''] focus:outline-none"
          >
            {story.title}
          </Link>
        </h3>

        <span className="mt-auto inline-flex items-center gap-1.5 text-[14px] font-semibold text-brand-primary">
          {UI_STRINGS['socialProof.readMore']}
          <span
            aria-hidden="true"
            className="transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none"
          >
            {UI_STRINGS['socialProof.arrow']}
          </span>
        </span>
      </div>
    </article>
  )
}

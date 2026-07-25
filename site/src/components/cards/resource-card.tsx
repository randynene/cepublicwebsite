import Link from 'next/link'
import NextImage from 'next/image'

import { formatCardDate, getCardExcerpt, getResourceLabel } from '@/components/cards/_shared'
import { Image } from '@/components/ui/image'
import { cn } from '@/components/ui/_utils/cn'
import { type Locale } from '@/lib/locale'
import {
  getChildHref,
  getChildImage,
  getChildTitle,
  type HubChildItem,
} from '@/lib/sanity/queries/hubs'

// ResourceCard — used by videosHub, toolsHub, downloadsHub, eventsHub.
//
// Re-skinned (HUB-RESOURCE-REBUILD) to share the blog ArticleCard's dark
// surface EXACTLY, so a resource grid and a blog grid look like the same
// site: #101B30 at rest, a 4px hover lift with a lime inset hairline, and a
// stripe placeholder when a doc has no image. The card is ONE anchor,
// stretched over the whole surface via ::after - nesting the type label or a
// "read" link as a second anchor would silently break the click target.
//
// The one resource-specific difference from the blog card: a type label
// (Video / Tool / Download / Event) sits where the blog card puts its
// category pill. No author byline - resources have no author.

const SURFACE = cn(
  'group relative flex h-full flex-col overflow-hidden rounded-md border border-[#22314D] bg-[#101B30]',
  'transition-[background-color,transform,box-shadow] duration-[250ms] [transition-timing-function:cubic-bezier(.22,.61,.36,1)]',
  'hover:-translate-y-1 hover:bg-[#1B2A45]',
  'hover:[box-shadow:inset_0_0_0_1px_rgba(212,255,60,.45),0_18px_40px_-24px_rgba(0,0,0,.75)]',
  'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
  'focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-[#070D18]',
)

export type ResourceCardProps = {
  item: HubChildItem
  priority?: boolean
  sizes?: string
  /** Prefixes card links with /uk so a UK hub links to UK detail pages. */
  locale?: Locale
}

export function ResourceCard({ item, priority = false, sizes, locale = 'en-US' }: ResourceCardProps) {
  const title = getChildTitle(item)
  const image = getChildImage(item)
  const excerpt = getCardExcerpt(item)
  const typeLabel = getResourceLabel(item)
  // getChildHref already returns a locale-correct internal path. Do NOT re-wrap it in
  // toInternalHref: that helper re-runs buildLocalePath with a defaulted en-US locale,
  // which strips the /uk prefix and sends UK hub cards to US detail pages.
  const href = getChildHref(item, locale)
  // Events carry a dateTime; videos / tools / downloads have no card-surface date.
  const date = formatCardDate(item.dateTime)

  return (
    <article className={SURFACE}>
      {/* A FIXED 16:9 box with object-cover keeps every card in a row the same
          height regardless of the source thumbnail's aspect ratio. */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#1B2A45]">
        {image ? (
          <Image
            source={image}
            alt=""
            fill
            priority={priority}
            sizes={sizes ?? '(min-width: 1024px) 50vw, 100vw'}
            className="h-full w-full object-cover"
          />
        ) : (
          // Branded fallback so EVERY card carries a thumbnail, never a blank box:
          // a lime-on-navy glow with the CE mark centred. Decorative, so aria-hidden.
          <div
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center"
            style={{
              backgroundImage:
                'radial-gradient(120% 120% at 50% 0%, rgba(212,255,60,.14) 0%, #16233c 45%, #0c1526 100%)',
            }}
          >
            <NextImage
              src="/ce-logo.svg"
              alt=""
              width={132}
              height={26}
              className="opacity-30"
            />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        {typeLabel ? (
          <span className="text-[12px] font-semibold uppercase leading-none tracking-[1.6px] text-brand-primary">
            {typeLabel}
          </span>
        ) : null}

        <h3 className="line-clamp-2 text-[17px] font-semibold leading-snug text-text-default">
          {/* The single anchor, stretched over the whole card via ::after. */}
          <Link
            href={href}
            className="after:absolute after:inset-0 after:content-[''] focus:outline-none"
          >
            {title}
          </Link>
        </h3>

        {excerpt ? (
          <p className="line-clamp-2 text-[14px] leading-relaxed text-text-default/60">
            {excerpt}
          </p>
        ) : null}

        {date ? (
          <span className="mt-auto text-[12px] text-text-default/50">{date}</span>
        ) : null}
      </div>
    </article>
  )
}

export default ResourceCard

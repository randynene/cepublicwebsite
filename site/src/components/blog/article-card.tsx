import Link from 'next/link'

import { AuthorByline, hasByline } from '@/components/blog/author-byline'
import { CategoryPill } from '@/components/blog/category-pill'
import { formatCardDate, getCardExcerpt } from '@/components/cards/_shared'
import { Image } from '@/components/ui/image'
import { cn } from '@/components/ui/_utils/cn'
import { type Locale } from '@/lib/locale'
import {
  getChildHref,
  getChildImage,
  getChildTitle,
  type HubChildItem,
} from '@/lib/sanity/queries/hubs'
import { UI_STRINGS } from '@/lib/ui-strings'

// The article card. Spec §2.
//
// Three variants, one component, because the spec is explicit that the listing and
// the article page render the SAME card ("they cannot diverge by construction").
//
//   default   the grid card: image, pill, title, excerpt, byline footer
//   feature   large, top-left of the featured block: bigger title, "Read more ->"
//   compact   horizontal, 108px thumb left, no excerpt: the 4 stacked featured items
//
// THE WHOLE CARD IS ONE ANCHOR (spec §2). Not the title, not "Read more" - the card.
// So the pill inside it is rendered without an href: nesting an <a> inside an <a> is
// invalid, browsers silently unnest it, and the card's own click target breaks in a
// way that only shows up when someone clicks the pill and lands on the article.
//
// Every field degrades. Missing image falls back to the stripe placeholder; missing
// author, date, category or excerpt collapses with no empty row and no dangling
// separator. This is the common case, not the edge: only 39 of 74 posts have an
// author and one has no thumbnail.

export type ArticleCardVariant = 'default' | 'feature' | 'compact'

export type ArticleCardProps = {
  item: HubChildItem
  variant?: ArticleCardVariant
  priority?: boolean
  sizes?: string
  locale?: Locale
  className?: string
}

/**
 * The resting surface, the hover lift, and the focus ring. Spec §2 (NEW).
 *
 * #101B30 at rest -> #1B2A45 on hover, a 4px lift, a lime inset hairline and a soft
 * shadow. `prefers-reduced-motion` kills the transform, not just the transition: an
 * instant 4px jump is exactly the thing the setting exists to prevent.
 */
const SURFACE = cn(
  'group relative flex overflow-hidden rounded-md border border-[#22314D] bg-[#101B30]',
  'transition-[background-color,transform,box-shadow] duration-[250ms] [transition-timing-function:cubic-bezier(.22,.61,.36,1)]',
  'hover:-translate-y-1 hover:bg-[#1B2A45]',
  'hover:shadow-[0_18px_40px_-24px_rgba(0,0,0,.75)]',
  'hover:[box-shadow:inset_0_0_0_1px_rgba(212,255,60,.45),0_18px_40px_-24px_rgba(0,0,0,.75)]',
  'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
  'focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-[#070D18]',
)

/** The diagonal-stripe placeholder the design uses when a post has no image. */
function ImageSlot({
  item,
  priority,
  sizes,
  className,
}: {
  item: HubChildItem
  priority: boolean
  sizes: string
  className?: string
}) {
  const image = getChildImage(item)
  return (
    // A FIXED 16:9 box with object-cover. Portrait and landscape thumbnails were
    // previously letterboxing to their own aspect ratios, so no two cards in a row were
    // the same height and the grid looked ragged. The box is the constant now and the
    // image is cropped to fit it - which is what the design draws.
    <div className={cn('relative overflow-hidden bg-[#1B2A45]', className)}>
      {image ? (
        <Image
          source={image}
          alt=""
          fill
          priority={priority}
          sizes={sizes}
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
    </div>
  )
}

export function ArticleCard({
  item,
  variant = 'default',
  priority = false,
  sizes,
  locale = 'en-US',
  className,
}: ArticleCardProps) {
  const title = getChildTitle(item)
  const excerpt = getCardExcerpt(item)
  const date = formatCardDate(item.date)
  // getChildHref already returns a locale-correct internal path. Do NOT re-wrap it in
  // toInternalHref: that helper re-runs buildLocalePath with a defaulted en-US locale,
  // which strips the /uk prefix and sends UK hub cards to US detail pages.
  const href = getChildHref(item, locale)
  const category = item.category?.name ?? item.competitor ?? null
  const author = item.author ?? null
  const showFooter = hasByline(author?.name, date)

  // The single anchor. It is stretched over the whole card via ::after, so the card
  // is one click target while the DOM keeps one link and a readable accessible name.
  const Anchor = (
    <Link
      href={href}
      className="after:absolute after:inset-0 after:content-[''] focus:outline-none"
    >
      {title}
    </Link>
  )

  if (variant === 'compact') {
    return (
      <article className={cn(SURFACE, 'flex-row items-stretch gap-4 p-3', className)}>
        <ImageSlot
          item={item}
          priority={priority}
          sizes="108px"
          className="aspect-[16/9] h-auto w-[108px] shrink-0 self-center rounded-[10px]"
        />
        <div className="flex min-w-0 flex-col justify-center gap-2 py-1 pr-1">
          {category ? <CategoryPill label={category} /> : null}
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-text-default">
            {Anchor}
          </h3>
          {date ? <span className="text-[12px] text-text-default/50">{date}</span> : null}
        </div>
      </article>
    )
  }

  const isFeature = variant === 'feature'

  return (
    <article className={cn(SURFACE, 'h-full flex-col', className)}>
      <ImageSlot
        item={item}
        priority={priority}
        sizes={sizes ?? '(min-width: 992px) 33vw, (min-width: 768px) 50vw, 100vw'}
        className="aspect-[16/9] w-full rounded-t-[16px]"
      />

      <div className={cn('flex flex-1 flex-col gap-3', isFeature ? 'p-6' : 'p-5')}>
        {category ? (
          <div>
            <CategoryPill label={category} />
          </div>
        ) : null}

        <h3
          className={cn(
            'font-semibold leading-snug text-text-default',
            isFeature ? 'text-[22px]' : 'line-clamp-2 text-[17px]',
          )}
        >
          {Anchor}
        </h3>

        {excerpt ? (
          <p className="line-clamp-2 text-[14px] leading-relaxed text-text-default/60">
            {excerpt}
          </p>
        ) : null}

        {/* The footer rule only exists when there is a footer. A rule with nothing
            under it reads as a broken card, and on nearly half these posts there is
            no author to put under it. */}
        {showFooter ? (
          <div className="mt-auto border-t border-[#22314D] pt-4">
            <AuthorByline author={author} date={date} />
          </div>
        ) : null}

        {/* The feature card keeps its "Read more ->" affordance (spec §2). It is not
            a link - the card already is one - so it is aria-hidden and purely
            visual, and it moves on the card's hover, not its own. */}
        {isFeature ? (
          <span
            aria-hidden="true"
            className={cn(
              'inline-flex items-center gap-1.5 text-[14px] font-semibold text-brand-primary',
              showFooter ? 'mt-3' : 'mt-auto pt-3',
            )}
          >
            {UI_STRINGS['blog.readMore']}
            <span className="transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none">
              {UI_STRINGS['blog.readMoreArrow']}
            </span>
          </span>
        ) : null}
      </div>
    </article>
  )
}

export default ArticleCard

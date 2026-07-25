import Link from 'next/link'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Heading } from '@/components/ui/heading'
import { Image } from '@/components/ui/image'
import { Tag } from '@/components/ui/tag'
import { Text } from '@/components/ui/text'
import {
  getChildHref,
  getChildImage,
  getChildTitle,
  type HubChildItem,
} from '@/lib/sanity/queries/hubs'
import { type Locale } from '@/lib/locale'

import { formatCardDate, getCardExcerpt } from './_shared'

// BlogCard — used by blogHub, 6 blog-category hubs, and compareHub.
//
// Card link semantics (locked at Step 4 brief):
//   - <h3> wraps the <Link> — title IS the anchor (single anchor per card)
//   - Image and body are visually within the card's hover surface but
//     are NOT separately linked. No nested anchors.
//   - Category Tag is decorative (no href) for the same reason.
//
// This differs from TEMPLATE-BLOG's related-posts pattern (separate
// "Read article" link). The card link semantics here are explicit per
// Step 4 brief.

export type BlogCardProps = {
  item: HubChildItem
  priority?: boolean
  sizes?: string
  /** Prefixes card links with /uk so a UK hub links to UK detail pages. */
  locale?: Locale
}

export function BlogCard({ item, priority = false, sizes, locale = 'en-US' }: BlogCardProps) {
  const title = getChildTitle(item)
  const image = getChildImage(item)
  const excerpt = getCardExcerpt(item)
  const date = formatCardDate(item.date)
  // getChildHref already returns a locale-correct internal path. Do NOT re-wrap it in
  // toInternalHref: that helper re-runs buildLocalePath with a defaulted en-US locale,
  // which strips the /uk prefix and sends UK hub cards to US detail pages.
  const href = getChildHref(item, locale)
  // blogPost surfaces category.name; compareBlog surfaces competitor.
  const categoryLabel = item.category?.name ?? item.competitor ?? null
  const authorName = item.author?.name ?? null

  return (
    <Card as="article" className="h-full">
      <CardHeader bleed>
        {image && (
          <div className="relative aspect-[16/9] w-full overflow-hidden">
            <Image
              source={image}
              alt=""
              fill
              priority={priority}
              sizes={sizes ?? '(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw'}
            />
          </div>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {categoryLabel && (
          <div>
            <Tag>{categoryLabel}</Tag>
          </div>
        )}
        <Heading as="h3" size="h4">
          <Link href={href} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring focus-visible:rounded-sm hover:text-brand-primary transition duration-reveal ease-reveal">
            {title}
          </Link>
        </Heading>
        {excerpt && (
          <Text as="p" size="small" className="text-text-default/80">
            {excerpt}
          </Text>
        )}
        {(date || authorName) && (
          <div className="mt-1 flex flex-wrap items-center gap-2 text-text-default/70">
            {date && <Text as="span" size="small">{date}</Text>}
            {date && authorName && (
              <Text as="span" size="small" aria-hidden="true">
                ·
              </Text>
            )}
            {authorName && <Text as="span" size="small">{authorName}</Text>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default BlogCard

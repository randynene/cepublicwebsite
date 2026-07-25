import Link from 'next/link'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Heading } from '@/components/ui/heading'
import { Icon } from '@/components/ui/icon'
import { Image } from '@/components/ui/image'
import { Text } from '@/components/ui/text'
import {
  getChildHref,
  getChildImage,
  getChildTitle,
  type HubChildItem,
} from '@/lib/sanity/queries/hubs'
import { type Locale } from '@/lib/locale'

import { getCardExcerpt } from './_shared'

// CollectionCard — used by servicesHub, technologyHub, customerStoriesHub,
// reviewsHub.
//
// Same link semantics as BlogCard and ResourceCard: <h3> wraps <Link>,
// single anchor per card. CTA arrow icon is visually inside the title's
// anchor but unwrapped from any extra <a> element.
//
// Collection-card-specific surface: name + short description + arrow
// affordance. No tags, no date, no author byline. Companies on
// customerStory get the companyName line above the title.

export type CollectionCardProps = {
  item: HubChildItem
  priority?: boolean
  sizes?: string
  /** Prefixes card links with /uk so a UK hub links to UK detail pages. */
  locale?: Locale
}

export function CollectionCard({ item, priority = false, sizes, locale = 'en-US' }: CollectionCardProps) {
  const title = getChildTitle(item)
  const image = getChildImage(item)
  const excerpt = getCardExcerpt(item)
  // getChildHref already returns a locale-correct internal path. Do NOT re-wrap it in
  // toInternalHref: that helper re-runs buildLocalePath with a defaulted en-US locale,
  // which strips the /uk prefix and sends UK hub cards to US detail pages.
  const href = getChildHref(item, locale)
  // customerStory surfaces companyName; review surfaces position.
  const subline = item.companyName ?? item.position ?? null

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
        {subline && (
          <Text as="p" size="small" className="text-text-default/70">
            {subline}
          </Text>
        )}
        <Heading as="h3" size="h4">
          <Link href={href} className="group inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring focus-visible:rounded-sm hover:text-brand-primary transition duration-reveal ease-reveal">
            <span>{title}</span>
            <Icon
              name="chevron-right"
              size="sm"
              className="transition-transform duration-reveal ease-reveal group-hover:translate-x-1"
            />
          </Link>
        </Heading>
        {excerpt && (
          <Text as="p" size="small" className="text-text-default/80">
            {excerpt}
          </Text>
        )}
      </CardContent>
    </Card>
  )
}

export default CollectionCard

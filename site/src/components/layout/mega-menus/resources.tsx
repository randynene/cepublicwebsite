'use client'

import Link from 'next/link'
import { type ReactNode } from 'react'

import { cn } from '@/components/ui/_utils/cn'
import { AssetIcon, MaterialIcon } from '@/components/ui/icon'
import { Image } from '@/components/ui/image'
import type {
  ResourcesIcon,
  ResourcesMegaMenu,
} from '@/lib/sanity/queries/navigation'
import { refToHref } from '@/lib/sanity/route-map'
import { UI_STRINGS } from '@/lib/ui-strings'
import type { Locale } from '@/lib/locale-path'
import { toInternalHref } from '@/lib/url'
import { createImageUrlBuilder } from '@sanity/image-url'

import {
  ColumnViewAllPill,
} from './_parts'

// MYGRATR-STATIC-3 Step 4 — Resources mega-menu (Header.html frame 04).

const SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET

const imageUrlBuilder =
  SANITY_PROJECT_ID && SANITY_DATASET
    ? createImageUrlBuilder({ projectId: SANITY_PROJECT_ID, dataset: SANITY_DATASET })
    : null

function assetIconSrc(icon: ResourcesIcon): string | null {
  if (!icon || icon.source !== 'asset' || !icon.asset?.asset?._ref || !imageUrlBuilder) {
    return null
  }
  return imageUrlBuilder.image(icon.asset).width(28).height(28).url()
}

function LeftNavIcon({ icon }: { icon?: ResourcesIcon }) {
  if (!icon?.source || !icon.name) return null
  if (icon.source === 'material-font') {
    return (
      <MaterialIcon
        name={icon.name}
        size="sm"
        className="!size-auto text-[12px] leading-none text-brand-primary"
      />
    )
  }
  const src = assetIconSrc(icon)
  if (!src) return null
  return <AssetIcon src={src} alt={icon.alt ?? ''} size="sm" className="!size-3" />
}

// Shared card frame — fixed height so Blogs + Customer Stories rows align
// and every bubble is the same size (export: padding 10px, thumb 58px tall).
const MEGA_CARD_FRAME =
  'flex h-[96px] w-full items-center gap-[13px] overflow-hidden rounded-xl p-2.5'

const CARD_ROW_START = [
  'lg:row-start-2',
  'lg:row-start-3',
  'lg:row-start-4',
] as const

function ResourcesLeftPill({
  label,
  url,
  icon,
  onNavigate,
  locale,
}: {
  label: string
  url: string
  icon?: ResourcesIcon
  onNavigate?: () => void
  locale: Locale
}) {
  const { href, isExternal } = toInternalHref(url, locale)
  return (
    <Link
      href={href}
      onClick={onNavigate}
      // aria-label pins the accessible name to the label (roadmap W1-08). The
      // leading icon is a Material Symbols ligature whose text ("event_upcoming",
      // "calculate", ...) crawlers concatenate into the anchor text despite the
      // aria-hidden below; an explicit label keeps the anchor text clean.
      aria-label={label}
      className="flex w-full min-w-0 items-center gap-[10px] rounded-pill border border-border-subtle bg-[#16223A] py-[5px] pl-[6px] pr-5 transition duration-reveal ease-reveal hover:bg-[#16223A]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring motion-reduce:transition-none"
      {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      <span
        aria-hidden="true"
        className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-text-dark text-brand-primary"
      >
        <LeftNavIcon icon={icon} />
      </span>
      <span className="whitespace-nowrap text-[14px] font-medium leading-none text-text-default">
        {label}
      </span>
    </Link>
  )
}

function BlogCard({
  title,
  slug,
  category,
  thumbnail,
  onNavigate,
  className,
  locale,
}: {
  category?: string | null
  locale: Locale
  title?: string | null
  slug?: string | null
  thumbnail?: { asset?: { _ref?: string } | null; alt?: string | null } | null
  onNavigate?: () => void
  className?: string
}) {
  // refToHref returns null when the category is missing, because a blog post's
  // URL is /<category>/<slug> and there is no safe guess. A null href means the
  // card is not rendered, rather than rendered as a 404.
  const href = slug ? refToHref({ _type: 'blogPost', slug, category }, locale) : null
  if (!href || !title) return null
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        MEGA_CARD_FRAME,
        'border border-border-subtle bg-[#16223A] transition duration-reveal ease-reveal hover:bg-[#16223A]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring motion-reduce:transition-none',
        className,
      )}
    >
      {thumbnail?.asset ? (
        <span className="relative h-[58px] w-[78px] shrink-0 overflow-hidden rounded-lg">
          <Image
            source={thumbnail}
            alt={thumbnail.alt ?? ''}
            width={78}
            height={58}
            className="h-full w-full object-cover"
          />
        </span>
      ) : (
        <span className="h-[58px] w-[78px] shrink-0 rounded-lg bg-surface-base" aria-hidden="true" />
      )}
      <span className="line-clamp-3 min-w-0 flex-1 text-[13px] font-semibold leading-[1.3] text-text-default">
        {title}
      </span>
    </Link>
  )
}

function StoryCard({
  headline,
  slug,
  logo,
  onNavigate,
  className,
  locale,
}: {
  locale: Locale
  headline?: string | null
  slug?: string | null
  logo?: { asset?: { _ref?: string } | null; alt?: string | null } | null
  onNavigate?: () => void
  className?: string
}) {
  const href = slug ? refToHref({ _type: 'customerStory', slug }, locale) : null
  if (!href || !headline) return null
  return (
    <div
      className={cn(
        MEGA_CARD_FRAME,
        'border border-[#2c3f33] bg-gradient-to-br from-[#16223A] to-[#16281f]',
        className,
      )}
    >
      {logo?.asset ? (
        <span className="relative h-[58px] w-16 shrink-0 overflow-hidden rounded-lg">
          <Image
            source={logo}
            alt={logo.alt ?? ''}
            width={64}
            height={58}
            className="h-full w-full object-cover"
          />
        </span>
      ) : (
        <span className="h-[58px] w-16 shrink-0 rounded-lg bg-surface-base" aria-hidden="true" />
      )}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-center">
        <p className="line-clamp-2 text-[13px] font-semibold leading-[1.3] text-text-default">
          {headline}
        </p>
        <Link
          href={href}
          onClick={onNavigate}
          className="mt-1.5 shrink-0 text-[12px] font-semibold leading-none text-brand-primary hover:text-brand-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring focus-visible:rounded-sm"
        >
          {UI_STRINGS['nav.readFullStory']}
        </Link>
      </div>
    </div>
  )
}

export function ResourcesMegaContent({
  data,
  onNavigate,
  locale,
}: {
  data: ResourcesMegaMenu
  onNavigate?: () => void
  locale: Locale
}): ReactNode {
  if (!data) return null
  const left = data.leftColumn
  const middle = data.middleColumn
  const right = data.rightColumn

  return (
    <div className="grid grid-cols-1 gap-[34px] px-[34px] py-[30px] lg:grid-cols-[260px_minmax(0,1fr)_minmax(0,1fr)]">
      {/* Left — plain heading + nav pill rows */}
      <div className="flex min-w-[260px] flex-col border-border-subtle lg:border-r lg:pr-[30px]">
        {left?.sectionLabel ? (
          <div className="mb-[18px] whitespace-nowrap text-[18px] font-semibold leading-none tracking-[-0.4px] text-text-default">
            {left.sectionLabel}
          </div>
        ) : null}
        <div className="flex flex-col gap-[11px]">
          {(left?.items ?? []).map((item) => (
            <ResourcesLeftPill
              key={item._key}
              label={item.label}
              url={item.url}
              icon={item.icon}
              onNavigate={onNavigate}
locale={locale}/>
          ))}
        </div>
      </div>

      {/* Middle + Right — Blogs + Customer Stories (row-synced on lg) */}
      <div className="flex flex-col gap-[34px] lg:col-span-2 lg:grid lg:grid-cols-2 lg:gap-x-[34px] lg:gap-y-3">
        <div className="flex flex-col gap-3 lg:contents">
          <div className="mb-[6px] flex min-h-[32px] items-center justify-between gap-3 lg:col-start-1 lg:row-start-1 lg:mb-0">
            {middle?.sectionLabel ? (
              <h3 className="text-[18px] font-semibold leading-none tracking-[-0.4px] text-text-default">
                {middle.sectionLabel}
              </h3>
            ) : null}
            <ColumnViewAllPill
              link={middle?.viewAllLink}
              variant="outline"
              onNavigate={onNavigate}
locale={locale}/>
          </div>
          {(middle?.featuredPosts ?? []).map((post, index) => (
            <BlogCard
              key={post._id}
              title={post.title}
              slug={post.slug}
              category={post.category}
              thumbnail={post.thumbnailImage}
              onNavigate={onNavigate}
              className={cn('lg:col-start-1', CARD_ROW_START[index])}
locale={locale}/>
          ))}
        </div>

        <div className="flex flex-col gap-3 lg:contents">
          <div className="mb-[6px] flex min-h-[32px] items-center justify-between gap-3 lg:col-start-2 lg:row-start-1 lg:mb-0">
            {right?.sectionLabel ? (
              <h3 className="text-[18px] font-semibold leading-none tracking-[-0.4px] text-text-default">
                {right.sectionLabel}
              </h3>
            ) : null}
            <ColumnViewAllPill
              link={right?.viewAllLink}
              variant="solid-lime"
              onNavigate={onNavigate}
locale={locale}/>
          </div>
          {(right?.featuredStories ?? []).map((story, index) => (
            <StoryCard
              key={story._id}
              headline={story.headline}
              slug={story.slug}
              logo={story.companyLogo}
              onNavigate={onNavigate}
              className={cn('lg:col-start-2', CARD_ROW_START[index])}
locale={locale}/>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ResourcesMegaContent

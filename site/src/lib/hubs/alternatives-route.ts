import 'server-only'

import { notFound } from 'next/navigation'

import { buildPagination, HUB_PAGE_SIZE, parsePageParam } from '@/lib/hubs/pagination'
import { buildLocalePath, type Locale } from '@/lib/locale'
import {
  fetchHubChildren,
  fetchHubChildrenCount,
  fetchHubSingleton,
  HUB_CONFIG,
  type HubChildItem,
} from '@/lib/sanity/queries/hubs'

// Data resolver for the /alternatives hub.
//
// Same auto-fill shape as the blog + resource resolvers: featuredItems is empty at
// seed, so a pinned-only featured row would never render. Featured = pinned first,
// then topped up with the most-recent comparisons, page-1 only, excluded from the grid
// so nothing repeats. Kept separate from the resource resolver (different featured
// count, and to avoid destabilising the eight resource routes); consolidate later.

/** Cards in the featured row when it renders (the template draws a 3-up row). */
export const ALTERNATIVES_FEATURED_COUNT = 3

/** Below this total, no featured block: a 3-up feature plus a real grid needs headroom. */
export const ALTERNATIVES_FEATURED_MIN = 8

type SearchParams = { [key: string]: string | string[] | undefined }

export async function resolveAlternativesHubRoute(
  searchParams: SearchParams,
  locale: Locale = 'en-US',
) {
  const hubType = 'alternativesHub' as const
  const cfg = HUB_CONFIG[hubType]
  const hub = await fetchHubSingleton(hubType)
  if (!hub) notFound()

  const currentPage = parsePageParam(searchParams.page)

  const totalItems = await fetchHubChildrenCount(hubType, { excludeIds: [] })

  const pinned = (hub.featuredItems ?? []) as unknown as HubChildItem[]

  let featured: HubChildItem[] = []
  let excludeIds: string[] = []

  if (currentPage === 1 && totalItems >= ALTERNATIVES_FEATURED_MIN) {
    featured = pinned.slice(0, ALTERNATIVES_FEATURED_COUNT)
    const shortfall = ALTERNATIVES_FEATURED_COUNT - featured.length
    if (shortfall > 0) {
      const fill = await fetchHubChildren(hubType, {
        offset: 0,
        limit: shortfall,
        excludeIds: featured.map((i) => i._id),
      })
      featured.push(...fill)
    }
    excludeIds = featured.map((i) => i._id)
  }

  const gridTotal = await fetchHubChildrenCount(hubType, { excludeIds })

  const pagination = buildPagination({
    currentPage,
    totalItems: gridTotal,
    basePath: buildLocalePath(cfg.basePath, locale),
    pageSize: HUB_PAGE_SIZE,
  })

  const items = await fetchHubChildren(hubType, {
    offset: pagination.offset,
    limit: pagination.limit,
    excludeIds,
  })

  return { hub, hubType, items, featured, pagination, locale }
}

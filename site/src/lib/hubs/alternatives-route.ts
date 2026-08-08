import 'server-only'

import { notFound } from 'next/navigation'

import { buildPagination, parsePageParam } from '@/lib/hubs/pagination'
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

  // Internal-link equity (SEO S2, roadmap W1-04): render EVERY compare card on
  // page 1, not the first HUB_PAGE_SIZE. The compare pages are the site's
  // best-positioned URLs (pos 5-7) and carry ~45% of its AI citations, yet 16 of
  // the 27 were reachable only behind ?page=2 - so /compare/toptal-vs-upwork, the
  // biggest non-brand impression earner, had zero in-content inbound links. One
  // paginated hub link is not enough equity for pages that already rank.
  //
  // The catalogue is ~27 docs, so a single band is the honest layout, not a
  // pagination workaround. Sizing the page to the full grid makes buildPagination
  // resolve to one page: BlogPagination self-hides (totalPages <= 1), rel=next is
  // not emitted, and ?page=2 now 404s (currentPage > totalPages) rather than
  // splitting the catalogue. Math.max(_, 1) guards the empty-grid case (pageSize
  // must be positive; ceil(0 / 0) is NaN).
  const pageSize = Math.max(gridTotal, 1)

  const pagination = buildPagination({
    currentPage,
    totalItems: gridTotal,
    basePath: buildLocalePath(cfg.basePath, locale),
    pageSize,
  })

  const items = await fetchHubChildren(hubType, {
    offset: pagination.offset,
    limit: pagination.limit,
    excludeIds,
  })

  return { hub, hubType, items, featured, pagination, locale }
}

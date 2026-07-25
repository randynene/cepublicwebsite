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
  type HubType,
} from '@/lib/sanity/queries/hubs'

// Data resolver for the four resource hubs (videos / tools / downloads / events).
//
// Separate from the generic lib/hubs/render-route because the featured block behaves
// like the blog family's, not the generic hub's: it AUTO-FILLS from the catalogue
// instead of showing only editor-pinned items (which are empty everywhere, so a
// pinned-only block never rendered).
//
// Two rules, mirroring the blog resolver:
//
//   AUTO-FILL. Featured = pinned first (hub.featuredItems), then topped up with the
//   most recent items until it holds RESOURCE_FEATURED_COUNT. Seb can pin items in
//   Studio later to override the slots; nothing else on the page changes.
//
//   SUPPRESSION ON SPARSE HUBS. Featuring 2 of a 2-item catalogue leaves the grid
//   below with nothing. Below RESOURCE_FEATURED_MIN the block is suppressed and the
//   page is a single grid. In practice this leaves featured ON for /videos and OFF
//   for /tools, /downloads and /events, whose catalogues are tiny.
//
// The ordering is load-bearing: the FULL count decides whether featured renders,
// the featured set is resolved from that, then the grid's count and page slice both
// EXCLUDE the featured IDs so no card appears twice.

/** Cards in the featured row when it renders (the template draws a 2-up row). */
export const RESOURCE_FEATURED_COUNT = 2

/** Below this total, no featured block: a 2-up feature plus a real grid needs headroom. */
export const RESOURCE_FEATURED_MIN = 6

type SearchParams = { [key: string]: string | string[] | undefined }

export async function resolveResourceHubRoute(
  hubType: HubType,
  searchParams: SearchParams,
  locale: Locale = 'en-US',
) {
  const cfg = HUB_CONFIG[hubType]
  const hub = await fetchHubSingleton(hubType)
  if (!hub) notFound()

  const currentPage = parsePageParam(searchParams.page)

  // The FULL count, before anything is excluded — the threshold is a property of the
  // catalogue, not of what is left after the featured items are removed.
  const totalItems = await fetchHubChildrenCount(hubType, { excludeIds: [] })

  const pinned = (hub.featuredItems ?? []) as unknown as HubChildItem[]

  let featured: HubChildItem[] = []
  let excludeIds: string[] = []

  // Featured only ever appears on page 1; on page 2 it would repeat the same cards
  // above a different grid the reader has already scrolled past.
  if (currentPage === 1 && totalItems >= RESOURCE_FEATURED_MIN) {
    featured = pinned.slice(0, RESOURCE_FEATURED_COUNT)
    const shortfall = RESOURCE_FEATURED_COUNT - featured.length
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

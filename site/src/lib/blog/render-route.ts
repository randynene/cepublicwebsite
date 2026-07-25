import 'server-only'

import { notFound } from 'next/navigation'

import { resolveFeatured } from '@/lib/blog/featured'
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

// Data resolver for the blog family. Spec §3, §6, §9.
//
// Separate from lib/hubs/render-route because the featured block behaves differently
// here: the generic hub shows ONLY what an editor pinned (always nothing, so the block
// never appears), while the blog family auto-fills to five and suppresses itself below
// eight articles. Bolting that onto the shared resolver would push blog-specific rules
// into the ten hubs that do not want them.
//
// The ordering below is load-bearing and is the whole reason this is one function:
//
//   1. the TOTAL article count decides whether featured renders at all (>= 8)
//   2. the featured set is resolved from that
//   3. the grid's count and its page slice both EXCLUDE the featured IDs
//
// Get that order wrong and the same article appears in the featured block and again in
// the grid below it, or the pagination counts twelve articles per page while showing
// eleven. Both are the kind of bug that looks like a rendering glitch and is actually
// a query.

type SearchParams = { [key: string]: string | string[] | undefined }

export type BlogHubRouteData = {
  hub: Awaited<ReturnType<typeof fetchHubSingleton>>
  hubType: HubType
  items: HubChildItem[]
  featured: HubChildItem[]
  pagination: ReturnType<typeof buildPagination>
  locale: Locale
}

export async function resolveBlogHubRoute(
  hubType: HubType,
  searchParams: SearchParams,
  locale: Locale = 'en-US',
) {
  const cfg = HUB_CONFIG[hubType]
  const hub = await fetchHubSingleton(hubType)
  if (!hub) notFound()

  const currentPage = parsePageParam(searchParams.page)

  // The FULL count, before anything is excluded. The >= 8 threshold is a property of
  // the topic ("does this hub have enough articles to justify a featured block"), not
  // of whatever is left over after the featured five are taken out - which would be a
  // circular question.
  const totalArticles = await fetchHubChildrenCount(hubType, { excludeIds: [] })

  const pinned = (hub.featuredArticles ?? []) as unknown as HubChildItem[]
  const { items: featured, excludeIds } = await resolveFeatured(
    hubType,
    pinned,
    totalArticles,
    currentPage,
  )

  // The grid counts and shows everything EXCEPT the featured five.
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

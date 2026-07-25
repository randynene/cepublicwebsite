import 'server-only'

import { notFound } from 'next/navigation'

import { buildPagination, HUB_PAGE_SIZE, parsePageParam } from '@/lib/hubs/pagination'
import { buildLocalePath, type Locale } from '@/lib/locale'
import {
  fetchHubChildren,
  fetchHubChildrenCount,
  fetchHubSingleton,
  HUB_CONFIG,
  type HubType,
} from '@/lib/sanity/queries/hubs'

// MYGRATR-STATIC-1 Step 4 — shared hub-route data resolver.
//
// One helper per route, called from each page.tsx:
//   const data = await resolveHubRoute('blogHub', searchParams)
//
// Returns everything renderHub needs:
//   - hub singleton
//   - page-slice of child items
//   - featured references (excluded from main list + count)
//   - pagination state
//   - hubType (passed through for renderHub's card dispatch)
//
// Throws notFound() for any of:
//   - hub singleton missing
//   - invalid ?page= param
//   - ?page=N where N exceeds totalPages

type SearchParams = { [key: string]: string | string[] | undefined }

export async function resolveHubRoute(
  hubType: HubType,
  searchParams: SearchParams,
  locale: Locale = 'en-US',
) {
  const cfg = HUB_CONFIG[hubType]
  const hub = await fetchHubSingleton(hubType)
  if (!hub) notFound()

  const currentPage = parsePageParam(searchParams.page)

  // Featured items: blog hubs use `featuredArticles`; collection hubs
  // use `featuredItems`. Always empty at seed but the wiring is in
  // place for Seb-curated pins post-launch.
  const featured =
    (cfg.shape === 'blog' ? hub.featuredArticles : hub.featuredItems) ?? []
  const featuredIds = featured.map((f) => f._id)

  const totalItems = await fetchHubChildrenCount(hubType, { excludeIds: featuredIds })

  const pagination = buildPagination({
    currentPage,
    totalItems,
    // Locale-prefixed, so ?page=2 on a UK hub stays on the UK hub instead of
    // silently throwing the visitor back to the US locale on page two.
    basePath: buildLocalePath(cfg.basePath, locale),
    pageSize: HUB_PAGE_SIZE,
  })

  const items = await fetchHubChildren(hubType, {
    offset: pagination.offset,
    limit: pagination.limit,
    excludeIds: featuredIds,
  })

  return { hub, hubType, items, featured, pagination, locale }
}

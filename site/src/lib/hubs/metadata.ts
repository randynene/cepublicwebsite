import 'server-only'

import type { Metadata } from 'next'

import { env } from '@/lib/env'
import { parsePageParam } from '@/lib/hubs/pagination'
import { generateCanonical, generateHreflang, type Locale } from '@/lib/locale'
import { urlFor } from '@/lib/sanity/image'
import {
  fetchHubSingleton,
  fetchSiteDefaultOgImage,
  HUB_CONFIG,
  type HubType,
} from '@/lib/sanity/queries/hubs'

// MYGRATR-STATIC-1 Step 4 — shared hub metadata builder.
//
// One generator for all 16 hubs. Consumed by each route's
// generateMetadata function. Outputs:
//   - title  (hub.metaTitle)
//   - description  (hub.metaDescription)
//   - alternates.canonical  (page 1 bare URL; page 2+ self-canonical)
//   - alternates.languages  (en-US, en-GB, x-default)
//   - openGraph (title, description, type=website, url, image)
//   - twitter (summary_large_image, title, description, image)
//
// OG image cascade per brief:
//   1. hub.openGraphImage    (if set in Sanity)
//   2. siteSettings.defaultOgImage  (seeded asset)
//   3. Omit entirely  (no inversion or substitution)
//
// robots is not overridden — root layout already exports
// { index: true, follow: true } and hubs inherit it (verified in
// layout.tsx).

type SearchParams = { [key: string]: string | string[] | undefined }

export async function buildHubMetadata(
  hubType: HubType,
  searchParams: SearchParams,
  locale: Locale = 'en-US',
): Promise<Metadata> {
  const hub = await fetchHubSingleton(hubType)
  if (!hub) return {}
  const cfg = HUB_CONFIG[hubType]

  // parsePageParam may call notFound() — caller catches this only inside
  // a request lifecycle. generateMetadata runs in the same lifecycle so
  // it is safe to invoke here.
  const currentPage = parsePageParam(searchParams.page)

  // generateCanonical and generateHreflang take the US path and apply the
  // locale prefix themselves (see the CONTRACT note in lib/locale.ts), so this
  // stays unprefixed. `openGraph.url` below does need the prefix, and gets it
  // from `canonical` rather than being rebuilt from the US path.
  const pagedPath =
    currentPage === 1 ? cfg.basePath : `${cfg.basePath}?page=${currentPage}`

  const canonical = generateCanonical(pagedPath, locale)
  // hreflang alternates point at the base URL (not the paginated URL)
  // because Google treats /page=2 as a distinct page, and hreflang
  // alternates pair distinct content units.
  const hreflang = generateHreflang(cfg.basePath)

  // OG image: hub-specific first, default Sanity asset second, omit otherwise.
  const ogImageSource = hub.openGraphImage ?? (await fetchSiteDefaultOgImage())
  const ogImageUrl = ogImageSource
    ? urlFor(ogImageSource as Record<string, unknown>).width(1200).height(630).url()
    : null

  const ogImages = ogImageUrl ? [{ url: ogImageUrl, width: 1200, height: 630 }] : undefined

  return {
    title: hub.metaTitle,
    description: hub.metaDescription,
    alternates: {
      canonical,
      languages: hreflang,
    },
    openGraph: {
      title: hub.metaTitle,
      description: hub.metaDescription,
      // `canonical`, not a re-derived US path: on a UK hub, og:url must point at
      // the UK URL. Rebuilding it from pagedPath would have every UK hub declare
      // itself as the US one.
      url: canonical,
      type: 'website',
      ...(ogImages ? { images: ogImages } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: hub.metaTitle,
      description: hub.metaDescription,
      ...(ogImageUrl ? { images: [ogImageUrl] } : {}),
    },
  }
}

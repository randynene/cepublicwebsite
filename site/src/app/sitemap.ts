import type { MetadataRoute } from 'next'
import { env } from '@/lib/env'
// Note: sanityClient intentionally omitted from scaffold stub.
// Add it in CONTENT-1 when the full document query is implemented.

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.NEXT_PUBLIC_SITE_URL

  // Scaffold stub — returns homepage only until CONTENT-1 populates Sanity.
  // CONTENT-1 expands this to fetch all published CMS documents and singletons.
  // TODO(CONTENT-1): replace with full document query across all 21 CMS types + singletons.
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${base}/uk/`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
  ]

  return staticRoutes
}

import 'server-only'
import { createImageUrlBuilder, type SanityImageObject } from '@sanity/image-url'

import { env } from '@/lib/env'

// Sanity image URL builder for non-React contexts (generateMetadata, JSON-LD,
// OG fallbacks). The E1 Image React primitive uses its own builder internally
// for srcset generation — this one is the imperative-call counterpart.

const builder = createImageUrlBuilder({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
})

// Accepts the read-model SanityImage shape (which extends SanityImageObject
// via the .passthrough() escape hatch). Callers in generateMetadata pass the
// fetched openGraphImage / thumbnailImage values directly.
export function urlFor(source: SanityImageObject | Record<string, unknown>) {
  return builder.image(source as SanityImageObject)
}

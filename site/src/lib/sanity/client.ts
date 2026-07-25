import 'server-only'
import { createClient } from 'next-sanity'

import { env } from '@/lib/env'

// Per DESIGN-1 Step 8c / F7: explicit SANITY_STEGA_ENABLED wins; otherwise
// stega is on only for Vercel preview deployments. Production stays clean.
function isStegaEnabled(): boolean {
  if (process.env.SANITY_STEGA_ENABLED === 'true') return true
  if (process.env.SANITY_STEGA_ENABLED === 'false') return false
  return process.env.VERCEL_ENV === 'preview'
}

// Single Sanity client. Draft fetches go through defineLive({ serverToken })
// — there is no separate previewClient switch (CMA-C2).
export const sanityClient = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2025-01-01',
  useCdn: true,
  perspective: 'published',
  stega: {
    enabled: isStegaEnabled(),
    studioUrl: env.NEXT_PUBLIC_SANITY_STUDIO_URL,
  },
})

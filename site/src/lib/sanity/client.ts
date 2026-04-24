import 'server-only'
import { createClient } from '@sanity/client'
import { env } from '@/lib/env'

// Stega must only be enabled on actual preview deployments — not just any
// non-production environment. Both conditions required to prevent stega
// metadata leaking into production on misconfigured deployments.
const isPreviewDeployment =
  process.env.VERCEL_ENV === 'preview' && process.env.NODE_ENV !== 'production'

export const sanityClient = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-01-01',
  useCdn: process.env.NODE_ENV === 'production',
  perspective: 'published',
  stega: {
    enabled: isPreviewDeployment,
    studioUrl: process.env.NEXT_PUBLIC_SANITY_STUDIO_URL ?? 'http://localhost:3333',
  },
})

// previewClient: authenticated, no CDN, draft perspective.
// Used for draft-mode/enable secret validation and preview rendering.
// server-only import at top of file prevents accidental client bundle inclusion.
export const previewClient = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-01-01',
  useCdn: false,
  perspective: 'previewDrafts',
  token: env.SANITY_API_READ_TOKEN,
  stega: {
    enabled: true,
    studioUrl: process.env.NEXT_PUBLIC_SANITY_STUDIO_URL ?? 'http://localhost:3333',
  },
})

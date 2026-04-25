import { z } from 'zod'

const schema = z.object({
  NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_SANITY_DATASET: z.string().min(1),
  // Falls back to NEXT_PUBLIC_VERCEL_URL on preview deployments where
  // NEXT_PUBLIC_SITE_URL is not statically set. Prevents build crashes.
  // Known limitation: both variables may be absent during the build step itself
  // on preview deployments, causing canonical/hreflang URLs to fall back to
  // http://localhost:3000 in the build output. This is acceptable for scaffold
  // phase — CONTENT-1 will enforce NEXT_PUBLIC_SITE_URL in Vercel env settings.
  NEXT_PUBLIC_SITE_URL: z.string().url().catch(() => {
    const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL
    return vercelUrl ? `https://${vercelUrl}` : 'http://localhost:3000'
  }),
  SANITY_API_READ_TOKEN: z.string().optional().default(''),
})

export const env = schema.parse({
  NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  SANITY_API_READ_TOKEN: process.env.SANITY_API_READ_TOKEN,
})

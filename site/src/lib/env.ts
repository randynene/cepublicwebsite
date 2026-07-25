import { z } from 'zod'

const schema = z.object({
  NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_SANITY_DATASET: z.string().min(1),
  // Falls back to NEXT_PUBLIC_VERCEL_URL on preview deployments where
  // NEXT_PUBLIC_SITE_URL is not statically set. Prevents build crashes.
  NEXT_PUBLIC_SITE_URL: z.string().url().catch(() => {
    const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL
    return vercelUrl ? `https://${vercelUrl}` : 'http://localhost:3000'
  }),
  // Studio URL for stega click-to-edit overlays. Hosted CE Studio default.
  NEXT_PUBLIC_SANITY_STUDIO_URL: z
    .string()
    .url()
    .catch('https://mygratr-cloudemployee.sanity.studio'),
  // Viewer-scoped read token. Used as defineLive serverToken for draft
  // fetches + draft-mode enable secret validation. Empty string allowed at
  // build time so CI can compile without secrets; draft mode fails closed
  // at runtime if missing.
  SANITY_API_READ_TOKEN: z.string().optional().default(''),
})

export const env = schema.parse({
  NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SANITY_STUDIO_URL: process.env.NEXT_PUBLIC_SANITY_STUDIO_URL,
  SANITY_API_READ_TOKEN: process.env.SANITY_API_READ_TOKEN,
})

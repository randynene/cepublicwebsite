import { z } from 'zod'

const schema = z.object({
  NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_SANITY_DATASET: z.string().min(1),
  // CMA F-1 v1.3 / D14: strict URL — new URL(undefined) throws at runtime in
  // route handlers; fail at startup instead. The SCAFFOLD-1 .catch() fallback
  // to NEXT_PUBLIC_VERCEL_URL was removed at DESIGN-1 Step 8.1 (D14 lock).
  // Vercel preview AND production envs MUST have NEXT_PUBLIC_SITE_URL set.
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  // CMA F5 v2.1: required in production AND preview (NODE_ENV !== 'development'
  // on Vercel — Vercel sets NODE_ENV='production' for ALL builds + runtimes).
  // Optional in local dev only, where Studio runs on localhost:3333 and the var
  // may legitimately be absent. Read by §8.5 + §8.6 route allow-list (Studio
  // origin). See docs/briefs/active/MYGRATR-DESIGN-1-BRIEF-B_v2.2.md §8.0c.
  NEXT_PUBLIC_SANITY_STUDIO_URL: z.string().url().optional().refine(
    (val) => process.env.NODE_ENV === 'development' || val !== undefined,
    { message: 'NEXT_PUBLIC_SANITY_STUDIO_URL is required in production and preview (set on Vercel env vars; see Brief B §8.0b + §8.0c)' },
  ),
  // CMA F-6 v1.3 / D14: empty token causes validatePreviewUrl 401 with unclear
  // error path. .min(1) fails fast at startup if the var is empty/unset.
  // §8.2 retasks this as defineLive's serverToken per D5.
  SANITY_API_READ_TOKEN: z.string().min(1),
  // DEV-23 (Step 2.11 / HALT 6 — C6 HubSpotFormEmbed). Optional with empty
  // default so the rest of the design system builds without HubSpot config.
  // C6 component runtime-checks at mount time and renders the error
  // fallback if portalId is empty + no override prop. Consumer sets via
  // Vercel env settings (or .env.local for local dev).
  NEXT_PUBLIC_HUBSPOT_PORTAL_ID: z.string().optional().default(''),
  // Customer-2-ready: defaults to CE's contact for first customer. Override
  // via Vercel env per customer deployment.
  NEXT_PUBLIC_FALLBACK_EMAIL: z
    .string()
    .email()
    .optional()
    .default('hello@cloudemployee.io'),
})

export const env = schema.parse({
  NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SANITY_STUDIO_URL: process.env.NEXT_PUBLIC_SANITY_STUDIO_URL,
  SANITY_API_READ_TOKEN: process.env.SANITY_API_READ_TOKEN,
  NEXT_PUBLIC_HUBSPOT_PORTAL_ID: process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID,
  NEXT_PUBLIC_FALLBACK_EMAIL: process.env.NEXT_PUBLIC_FALLBACK_EMAIL,
})

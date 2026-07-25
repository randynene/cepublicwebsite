// next-sanity 12 changed the SanityLive integration: instead of a direct
// SanityLive export, you call `defineLive({ client })` and consume the
// returned `sanityFetch` + `SanityLive` pair. Wrapping it once here keeps
// import paths stable across the site.

import 'server-only'
import { defineLive } from 'next-sanity/live'
import { sanityClient } from './client'
import { env } from '@/lib/env'

export const { sanityFetch, SanityLive } = defineLive({
  client: sanityClient,
  // CMA-C2 + D5: serverToken retasks the existing viewer-scoped SANITY_API_READ_TOKEN.
  // Viewer-scope re-confirmed + draft-read scope verified at §8.0a (F3 v2.1 probe);
  // non-empty enforced by D14 schema strictness (env.ts SANITY_API_READ_TOKEN: z.string().min(1)).
  serverToken: env.SANITY_API_READ_TOKEN,
  // browserToken enables LIVE streaming of draft edits into the Presentation
  // preview (without it, only published content live-updates; drafts require a
  // manual refresh). next-sanity ships this to the browser ONLY in draft mode,
  // which is gated behind the secret-protected /api/draft-mode/enable route, so
  // it is exposed only to authenticated preview sessions. Same viewer-scoped,
  // draft-read token as serverToken (Viewer rights only — never a write token).
  browserToken: env.SANITY_API_READ_TOKEN,
})

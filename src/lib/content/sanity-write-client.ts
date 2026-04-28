import { createClient } from '@sanity/client'

import { env } from '@/lib/env'

// Write client — used only by migration scripts, never by the Next.js app.
// Do NOT add 'server-only' here — migration scripts run via tsx, not Next.js.
// SANITY_API_TOKEN must have Editor or above permissions.
export const sanityWriteClient = createClient({
  projectId: env.SANITY_PROJECT_ID,
  dataset: env.SANITY_DATASET,
  apiVersion: '2024-01-01',
  useCdn: false,
  token: env.SANITY_API_TOKEN,
})

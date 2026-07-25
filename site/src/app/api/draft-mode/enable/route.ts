// Presentation Tool pairs with next-sanity's defineEnableDraftMode (GET).
// DESIGN-1 brief v1.5 Step 8d2 proposed POST + custom header secret, but
// next-sanity@12 only exports a GET enable helper for sanity/presentation.
// Using the package-supported path so Seb's Presentation View can open
// draft mode. Same-origin redirect hardening is inside defineEnableDraftMode
// / preview-url-secret validation.

import { defineEnableDraftMode } from 'next-sanity/draft-mode'

import { env } from '@/lib/env'
import { sanityClient } from '@/lib/sanity/client'

export const { GET } = defineEnableDraftMode({
  client: sanityClient.withConfig({
    token: env.SANITY_API_READ_TOKEN || undefined,
    useCdn: false,
  }),
})

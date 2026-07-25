// next-sanity 12: defineLive({ client, serverToken }) returns sanityFetch +
// SanityLive. serverToken lets draft mode fetch draft documents without a
// second client (DESIGN-1 CMA-C2).

import 'server-only'
import { defineLive } from 'next-sanity/live'

import { env } from '@/lib/env'
import { sanityClient } from './client'

export const { sanityFetch, SanityLive } = defineLive({
  client: sanityClient,
  serverToken: env.SANITY_API_READ_TOKEN || false,
})

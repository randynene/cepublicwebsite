// next-sanity 12 changed the SanityLive integration: instead of a direct
// SanityLive export, you call `defineLive({ client })` and consume the
// returned `sanityFetch` + `SanityLive` pair. Wrapping it once here keeps
// import paths stable across the site.

import 'server-only'
import { defineLive } from 'next-sanity/live'
import { sanityClient } from './client'

export const { sanityFetch, SanityLive } = defineLive({ client: sanityClient })

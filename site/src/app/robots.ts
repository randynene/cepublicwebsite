import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'

import { env } from '@/lib/env'

// Indexing is OPT-IN, and the opt-in is the hostname.
//
// This used to gate on `VERCEL_ENV === 'production'`, on the assumption that
// "Vercel production" means "the real website". It does not. staging.jakevibes.dev
// IS the Vercel production deployment of this project — that is simply what Vercel
// calls the main branch — so it was already serving `Allow: /` and a sitemap,
// inviting Google to index it.
//
// That mattered enormously. Deploying the finished site to staging under the old
// rule would have handed Google a complete, indexable duplicate of cloudemployee.io
// on a second domain. Google then has to choose which copy is canonical, and it
// does not always choose the one you want. Competing with yourself is one of the
// classic ways to lose a migration, and it is very hard to undo once the duplicate
// is in the index.
//
// So: the ONLY host that may be indexed is the one named in
// NEXT_PUBLIC_CANONICAL_HOST. Everything else — staging, preview branches, Vercel's
// auto-generated *.vercel.app URLs — is disallowed, whatever Vercel's environment
// label says. Being indexed now requires setting an environment variable on
// purpose. It cannot happen by accident, which is the whole point.
//
// The serving host is read from the REQUEST, not from an environment variable.
// That distinction is load-bearing. staging.jakevibes.dev and www.cloudemployee.io
// are two domains pointing at the SAME Vercel production deployment, so they share
// one set of build-time environment variables. Comparing one env var against
// another would return the same answer for both hosts: the moment cutover set
// NEXT_PUBLIC_CANONICAL_HOST, staging would have started serving `Allow: /` too,
// handing Google exactly the indexable duplicate this file exists to prevent.
//
// Reading the real Host header makes the gate per-domain, so staging stays
// disallowed no matter what the environment says, and stays disallowed even if
// someone forgets to detach it from the project after cutover.
export default async function robots(): Promise<MetadataRoute.Robots> {
  const canonicalHost = process.env.NEXT_PUBLIC_CANONICAL_HOST?.trim().toLowerCase()

  const requestHeaders = await headers()
  // Cloudflare and Vercel both preserve the original Host; x-forwarded-host wins
  // where a proxy rewrote it. Strip any port before comparing.
  const rawHost = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host') ?? ''
  const servingHost = rawHost.split(':')[0]?.trim().toLowerCase() || null

  // Both must be present AND match. An unset canonical host means "not the real
  // site", which is the safe default: a deployment that forgets to configure itself
  // stays out of the index rather than falling into it.
  const isCanonicalSite = !!canonicalHost && !!servingHost && canonicalHost === servingHost

  if (!isCanonicalSite) {
    return { rules: [{ userAgent: '*', disallow: '/' }] }
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Gated lead-magnet pages. Not secret, but there is no reason for them to
        // rank: they are what you see after handing over your email.
        disallow: ['/download-thank-you/'],
      },
    ],
    sitemap: `${env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`,
  }
}

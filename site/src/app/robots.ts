import type { MetadataRoute } from 'next'

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
export default function robots(): MetadataRoute.Robots {
  const canonicalHost = process.env.NEXT_PUBLIC_CANONICAL_HOST

  let servingHost: string | null = null
  try {
    servingHost = new URL(env.NEXT_PUBLIC_SITE_URL).host
  } catch {
    servingHost = null
  }

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

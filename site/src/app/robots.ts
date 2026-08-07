import type { MetadataRoute } from 'next'

import { isCanonicalSite } from '@/lib/canonical-host'
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
// The gate itself is `isCanonicalSite()` in `@/lib/canonical-host`, which reads
// the real request Host rather than an environment variable. See the note there
// for why that distinction is load-bearing; in short, staging.jakevibes.dev and
// www.cloudemployee.io are the same deployment and share one set of build-time
// variables, so only the request tells them apart.
export default async function robots(): Promise<MetadataRoute.Robots> {
  if (!(await isCanonicalSite())) {
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

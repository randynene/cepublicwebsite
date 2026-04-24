import type { NextConfig } from 'next'
import type { Redirect } from 'next/dist/lib/load-custom-routes'

import { crawlRedirects } from './src/lib/redirects/generated-redirects'
import { regexRedirects } from './src/lib/redirects/regex-redirects'
import { webflowRedirects } from './src/lib/redirects/webflow-redirects'

// Locked rules from docs/MYGRATR_SCHEMA_DESIGN_DECISIONS.md §8.
// /live-job-role/* is the catch-all that collapses 336 Webflow rows.
// /team, /our-work, /alternatives are the design-doc renames.
//
// /archive/old-home → 410 Gone is documented in design doc §8 + §9 but
// Next.js redirects() doesn't natively support 410. TEMPLATE-* STATIC
// will render that path with a custom 410 response — TODO at the bottom
// of this file.
const lockedRules: Redirect[] = [
  {
    source: '/live-job-role/:path*',
    destination: 'https://talent.cloudemployee.io/live-job-role/:path*',
    permanent: true,
  },
  { source: '/team', destination: '/about-us', permanent: true },
  { source: '/our-work', destination: '/customer-stories', permanent: true },
  { source: '/alternatives', destination: '/compare', permanent: true },
]

const config: NextConfig = {
  // Pin Turbopack to the site/ directory to silence the multi-lockfile
  // warning (root package.json + site/package.json both exist).
  turbopack: {
    root: __dirname,
  },
  async redirects() {
    return [
      ...crawlRedirects,
      ...regexRedirects,
      ...webflowRedirects,
      ...lockedRules,
    ]
  },
}

// TODO(TEMPLATE-STATIC): emit HTTP 410 for /archive/old-home and
// /uk/archive/old-home (design doc §8 + §9). Next.js redirects() can't
// produce a 410 — handled in the static page route via custom Response
// with status 410.

export default config

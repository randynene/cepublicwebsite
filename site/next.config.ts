import type { NextConfig } from 'next'
import type { Redirect } from 'next/dist/lib/load-custom-routes'

import { crawlRedirects } from './src/lib/redirects/generated-redirects'
import { jobRoleRedirects } from './src/lib/redirects/job-role-redirects'
import { regexRedirects } from './src/lib/redirects/regex-redirects'
import { webflowRedirects } from './src/lib/redirects/webflow-redirects'

// Locked rules from docs/MYGRATR_SCHEMA_DESIGN_DECISIONS.md §8.
// /team, /our-work, /alternatives are the design-doc renames.
//
// /archive/old-home → 410 Gone is documented in design doc §8 + §9 but
// Next.js redirects() doesn't natively support 410. TEMPLATE-* STATIC
// will render that path with a custom 410 response — TODO at the bottom
// of this file.
// Rules that are not derived from the Webflow export.
//
// These were originally written from MYGRATR_SCHEMA_DESIGN_DECISIONS §8 — i.e.
// from what we INTENDED the URL structure to become, not from what the live site
// does. `npm run launch:verify-parity` caught the consequence: /our-work,
// /alternatives and /pricing are all live pages returning 200 on Webflow, and
// three of these rules would have 301'd them away at cutover, deleting them and
// their rankings. They are gone. Those three URLs need real routes; the parity
// gate now fails until they exist, which is the correct place for that pressure.
//
// Verify any rule added here against data/webflow/live-behaviour.json first.
// "What the redesign wants the URL to be" is a migration to run deliberately
// after launch, not a redirect to smuggle in during it.
const lockedRules: Redirect[] = [
  // Job listings moved to a separate subdomain. The rules are NOT here any more:
  // they are one-per-slug in `jobRoleRedirects`, generated from Webflow's export.
  //
  // They used to be a catch-all, `/live-job-role/:path+` -> talent.cloudemployee.io,
  // which read as a tidy collapse of 333 near-identical rows. It was a guess about
  // the list rather than the list, and it was wrong: Webflow has no rule for 29 of
  // the job slugs and serves them a clean 404. The catch-all redirected those 29 as
  // well, to a talent URL that is itself a 404 - turning a 404 into a cross-domain
  // redirect chain that ends in a 404, which is worse for a crawler and for a
  // visitor. The parity gate caught it; see scripts/scaffold/generate-job-role-redirects.ts.

  // Verified against live: /team is a genuine 301 to /about-us.
  { source: '/team', destination: '/about-us', permanent: true },

  // THE TWO LOCALES' FUNNELS ARE NOT THE SAME SHAPE. Assuming they were is how the
  // UK funnel lost its first step.
  //
  //   US: /start-hiring/get-started is a REDIRECT into contact-info. 8 pages.
  //   UK: /uk/start-hiring/get-started is a REAL PAGE ("Let's Find Your Developer",
  //       HubSpot form 05bfad44). 9 pages, and it is the funnel's entry point.
  //
  // That form is the one HubSpot calls "Start Hiring (Part 1/8)". It looked
  // orphaned — on no US page — which is exactly what a UK-only step looks like if
  // you only check the US locale.
  //
  // /start-hiring carries 4 referring domains, so its redirect matters. Its UK
  // counterpart 404s on live and is left alone: mirroring a US redirect onto a UK
  // URL that behaves differently is the mistake this comment exists to prevent.
  { source: '/start-hiring', destination: '/start-hiring/contact-info', permanent: true },
  { source: '/start-hiring/get-started', destination: '/start-hiring/contact-info', permanent: true },
  { source: '/uk/start-hiring-now', destination: '/uk/start-hiring/get-started', permanent: true },

  // DELIBERATE DIVERGENCE FROM LIVE — Jake, Jul 2026.
  //
  // /sourcing, /embedding and /retention return 200 on Webflow. We are choosing
  // not to rebuild them: they are the three chapters of the source-embed-retain
  // story that /how-it-works already tells in full.
  //
  // They are REDIRECTED rather than dropped because they rank. Search Console
  // has them at positions 8.3, 8.9 and 8.5 — page one — on 4,373 combined
  // impressions. Letting them 404 would bin that; a 301 to the page that covers
  // the same subject passes the relevance across. Neither has a single backlink,
  // so a redirect is all they need. Cost: three lines instead of three page builds.
  //
  // /scale-this-week (321 impressions, position 19) is a booking CTA, so it goes
  // to the start-hiring funnel instead.
  //
  // Recorded in data/webflow/parity-exceptions.json so the parity gate reports
  // them as expected, not as failures.
  // Location pages render a bespoke template at the existing ranking service
  // URLs; the short /location/* paths (briefly shipped as static HTML) 301 to
  // them so there is one canonical URL per region.
  { source: '/location/latam', destination: '/services/latam-developers', permanent: true },
  { source: '/location/philippines', destination: '/services/philippines-developers', permanent: true },
  { source: '/location/eastern-europe', destination: '/services/eastern-europe-developers', permanent: true },

  // DELIBERATE DIVERGENCE FROM LIVE - Jake, 22 Jul 2026 (Phase 4.2).
  //
  // /compare and /alternatives are two hubs over the SAME 27 compareBlog docs.
  // Live serves both 200, but they compete for the same "Cloud Employee vs X"
  // intent and /alternatives ranks better (Search Console ~9.1 vs ~25.9). Rather
  // than maintain two pages, we consolidate onto the stronger URL: /alternatives
  // is the rebuilt hub, and the /compare HUB ROOT 301s into it.
  //
  // EXACT-PATH ONLY. This matches /compare, not /compare/:slug - the individual
  // comparison articles keep their URLs (they are the content that ranks, and the
  // /alternatives cards link straight to them). Recorded in parity-exceptions.json.
  { source: '/compare', destination: '/alternatives', permanent: true },
  { source: '/uk/compare', destination: '/uk/alternatives', permanent: true },

  { source: '/sourcing', destination: '/how-it-works', permanent: true },
  { source: '/embedding', destination: '/how-it-works', permanent: true },
  { source: '/retention', destination: '/how-it-works', permanent: true },
  { source: '/scale-this-week', destination: '/start-hiring/contact-info', permanent: true },
  { source: '/uk/sourcing', destination: '/uk/how-it-works', permanent: true },
  { source: '/uk/embedding', destination: '/uk/how-it-works', permanent: true },
  { source: '/uk/retention', destination: '/uk/how-it-works', permanent: true },
  {
    source: '/uk/scale-this-week',
    destination: '/uk/start-hiring/contact-info',
    permanent: true,
  },
]

const config: NextConfig = {
  // Pin Turbopack to the site/ directory to silence the multi-lockfile
  // warning (root package.json + site/package.json both exist).
  turbopack: {
    root: __dirname,
  },
  images: {
    // E1 Image defaults to quality 80 (probe-grounded; see image/index.tsx).
    // Next.js 16 requires explicit listing of allowed quality values.
    qualities: [75, 80],
    // Sanity CDN — the home template renders Sanity-backed photos/logos through
    // raw next/image (not the E1 primitive), so the host must be allow-listed.
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io' }],
  },
  async redirects() {
    return [
      ...crawlRedirects,
      ...regexRedirects,
      ...webflowRedirects,
      ...jobRoleRedirects,
      ...lockedRules,
    ]
  },
}

// TODO(TEMPLATE-STATIC): emit HTTP 410 for /archive/old-home and
// /uk/archive/old-home (design doc §8 + §9). Next.js redirects() can't
// produce a 410 — handled in the static page route via custom Response
// with status 410.

export default config

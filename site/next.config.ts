import type { NextConfig } from 'next'

// The redirect table (assembly order, chain collapsing, and the hand-written
// locked rules) lives in src/lib/redirects/ so app/sitemap.ts can import the
// same list. See src/lib/redirects/index.ts.
import { allRedirects } from './src/lib/redirects'

const config: NextConfig = {
  // Pin Turbopack to the site/ directory to silence the multi-lockfile
  // warning (root package.json + site/package.json both exist).
  turbopack: {
    root: __dirname,
  },
  // Next streams async metadata after <head> for browsers. Screaming Frog (and
  // other HTML-limited crawlers) then report "missing canonical" even when
  // generateMetadata set one. Custom htmlLimitedBots REPLACES the default list,
  // so keep Next's defaults and add Screaming Frog.
  htmlLimitedBots:
    /[\w-]+-Google|Google-[\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight|Screaming Frog/i,
  images: {
    // E1 Image defaults to quality 80 (probe-grounded; see image/index.tsx).
    // Next.js 16 requires explicit listing of allowed quality values.
    qualities: [75, 80],
    // Sanity CDN — the home template renders Sanity-backed photos/logos through
    // raw next/image (not the E1 primitive), so the host must be allow-listed.
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io' }],
  },
  async redirects() {
    return allRedirects
  },
}

// TODO(TEMPLATE-STATIC): emit HTTP 410 for /archive/old-home and
// /uk/archive/old-home (design doc §8 + §9). Next.js redirects() can't
// produce a 410 — handled in the static page route via custom Response
// with status 410.

export default config

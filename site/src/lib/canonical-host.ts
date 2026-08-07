import { headers } from 'next/headers'

// "Am I the real production site?" - one implementation, used everywhere.
//
// This was three implementations. robots.ts read the actual request Host and
// normalised both sides; third-party-scripts.tsx and llms.txt/route.ts compared
// two build-time environment variables to each other with no trim and no
// lowercase. The two build-time copies both returned the wrong answer on
// www.cloudemployee.io: the Marker.io bug-report widget rendered for real paying
// customers, and /llms.txt returned 404. robots.txt, using the request host,
// was correct throughout. That asymmetry is the whole bug, so the logic now
// lives in exactly one place.
//
// Two properties are load-bearing, and both come from robots.ts:
//
// 1. The serving host is read from the REQUEST, never from an environment
//    variable. staging.jakevibes.dev and www.cloudemployee.io are two domains
//    pointing at the SAME Vercel production deployment, so they share one set of
//    build-time variables. Comparing one env var against another returns the same
//    answer for both hosts, which would make staging claim to be the real site.
//    NEXT_PUBLIC_CANONICAL_HOST is also set on the Preview environment, so this
//    is not hypothetical: only the request host tells previews apart.
//
// 2. Both sides are trimmed and lowercased. Hostnames are case-insensitive, and
//    a value typed into a dashboard field can pick up a stray space. Neither
//    should be able to flip a production gate.
//
// An unset canonical host means "not the real site". That is the safe default:
// a deployment that forgets to configure itself stays out of the index and keeps
// its staging tooling, rather than silently promoting itself.
export async function isCanonicalSite(): Promise<boolean> {
  const canonicalHost = process.env.NEXT_PUBLIC_CANONICAL_HOST?.trim().toLowerCase()

  const requestHeaders = await headers()
  // Cloudflare and Vercel both preserve the original Host; x-forwarded-host wins
  // where a proxy rewrote it. Strip any port before comparing.
  const rawHost = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host') ?? ''
  const servingHost = rawHost.split(':')[0]?.trim().toLowerCase() || null

  return !!canonicalHost && !!servingHost && canonicalHost === servingHost
}

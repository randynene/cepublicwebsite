import { draftMode } from 'next/headers'
import { NextResponse } from 'next/server'

import { env } from '@/lib/env'

// Normalise origins so trailing slashes / port quirks don't false-reject.
function originMatches(requestOrigin: string, allowedBase: string): boolean {
  try {
    return new URL(requestOrigin).origin === new URL(allowedBase).origin
  } catch {
    return false
  }
}

function allowedOrigins(): string[] {
  return [
    env.NEXT_PUBLIC_SITE_URL,
    env.NEXT_PUBLIC_SANITY_STUDIO_URL,
    process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : null,
    process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null,
    process.env.NODE_ENV === 'development' ? 'http://localhost:3333' : null,
  ].filter((value): value is string => Boolean(value))
}

// F15 / DESIGN-1: POST-only + origin allowlist. No GET — prevents CSRF
// disable via <img src=".../api/draft-mode/disable">.
export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  if (!origin || !allowedOrigins().some((base) => originMatches(origin, base))) {
    return NextResponse.json({ error: 'forbidden origin' }, { status: 403 })
  }

  ;(await draftMode()).disable()
  return NextResponse.json({ disabled: true })
}

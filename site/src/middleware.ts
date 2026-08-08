import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Whitespace that a URL picked up on its way into someone else's HTML. The
// encoded forms are what actually arrive: %20 for a space, %09 for a tab, and
// the literal characters for clients that do not encode.
const EDGE_WHITESPACE = /^(?:%20|%09|%0a|%0d|\s)+|(?:%20|%09|%0a|%0d|\s)+$/gi

// Strips whitespace off the ends of a path so a link that was typed or pasted
// with a trailing space still lands somewhere.
//
// Tech Debt #65 / SEO session S1. A DR 91 backlink points at one of our URLs
// with a trailing %20 on it. The path does not exist with the space on the end,
// so the redirect table misses it and the visitor, and the equity, hit a 404
// over a character nobody meant to type. Rather than add a %20 twin for each of
// 773 redirect rules, normalise once here.
//
// This costs the malformed URL one extra hop: Next.js evaluates next.config
// redirects BEFORE middleware, so a trailing-space URL misses the table, gets
// trimmed here, and picks up its real redirect on the next request. One extra
// hop on a mistyped inbound link is a good trade against a 404, and the clean
// URLs (all of them, in practice) are untouched.
function trimPath(pathname: string): string {
  return pathname.replace(EDGE_WHITESPACE, '')
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const trimmed = trimPath(pathname)

  if (trimmed !== pathname && trimmed.startsWith('/') && trimmed.length > 1) {
    const url = request.nextUrl.clone()
    url.pathname = trimmed
    return NextResponse.redirect(url, 308)
  }

  // Pass pathname to root layout so <html lang> can follow the same locale
  // signal as hreflang (en-US default, en-GB under /uk).
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)
  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}

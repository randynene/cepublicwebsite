import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Pass pathname to root layout so <html lang> can follow the same locale
// signal as hreflang (en-US default, en-GB under /uk).
export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', request.nextUrl.pathname)
  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}

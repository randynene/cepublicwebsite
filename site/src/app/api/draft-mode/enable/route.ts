import { validatePreviewUrl } from '@sanity/preview-url-secret'
import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

import { previewClient } from '@/lib/sanity/client'
import { env } from '@/lib/env'

function ensureSanityPreviewToken() {
  if (!env.SANITY_API_READ_TOKEN) {
    throw new Error('SANITY_API_READ_TOKEN is required for preview/draft mode')
  }
}

export async function GET(request: Request) {
  ensureSanityPreviewToken()

  // Use previewClient (authenticated, no CDN) for secret validation —
  // not sanityClient.
  const { isValid, redirectTo = '/' } = await validatePreviewUrl(
    previewClient,
    request.url,
  )
  if (!isValid) {
    return new Response('Invalid secret', { status: 401 })
  }

  // F10: validate redirectTo is same-origin before redirecting.
  const base = new URL(env.NEXT_PUBLIC_SITE_URL)
  const target = new URL(redirectTo, base)
  if (target.origin !== base.origin) {
    return new Response('Invalid redirect target', { status: 400 })
  }

  ;(await draftMode()).enable()
  redirect(`${target.pathname}${target.search}${target.hash}`)
}

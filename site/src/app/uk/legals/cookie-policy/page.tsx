import type { Metadata } from 'next'

import { buildLegalMetadata, renderLegalRoute } from '@/lib/legal/render-route'

// /uk/legals/cookie-policy
//
// UK mirror. This is the locale the policy is actually written against: UK GDPR
// and PECR. The US locale serves the same document.

export async function generateMetadata(): Promise<Metadata> {
  return buildLegalMetadata('cookiePolicyPage', '/legals/cookie-policy', 'en-GB')
}

export default async function CookiePolicyUkPage() {
  return renderLegalRoute('cookiePolicyPage', 'en-GB')
}

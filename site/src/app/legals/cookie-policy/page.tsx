import type { Metadata } from 'next'

import { buildLegalMetadata, renderLegalRoute } from '@/lib/legal/render-route'

// /legals/cookie-policy
//
// Net-new (Aug 2026), alongside the consent banner. Unlike the other two legal
// routes there is no Webflow original to migrate from: the legacy site had no
// cookie notice at all. Seeded by npm run content:seed-cookie-policy.

export async function generateMetadata(): Promise<Metadata> {
  return buildLegalMetadata('cookiePolicyPage', '/legals/cookie-policy', 'en-US')
}

export default async function CookiePolicyPage() {
  return renderLegalRoute('cookiePolicyPage', 'en-US')
}

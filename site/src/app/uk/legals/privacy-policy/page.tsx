import type { Metadata } from 'next'

import { buildLegalMetadata, renderLegalRoute } from '@/lib/legal/render-route'

// /legals/privacy-policy (UK locale)
//
// The body is a single richTextSection on the privacyPolicyPage singleton, migrated
// from the Webflow `Legal pages` collection (npm run content:migrate-legal-pages).

export async function generateMetadata(): Promise<Metadata> {
  return buildLegalMetadata('privacyPolicyPage', '/legals/privacy-policy', 'en-GB')
}

export default async function PrivacyPolicyUkPage() {
  return renderLegalRoute('privacyPolicyPage', 'en-GB')
}

import type { Metadata } from 'next'

import { buildLegalMetadata, renderLegalRoute } from '@/lib/legal/render-route'

// /legals/general-terms
//
// The body is a single richTextSection on the generalTermsPage singleton, migrated
// from the Webflow `Legal pages` collection (npm run content:migrate-legal-pages).

export async function generateMetadata(): Promise<Metadata> {
  return buildLegalMetadata('generalTermsPage', '/legals/general-terms', 'en-US')
}

export default async function GeneralTermsPage() {
  return renderLegalRoute('generalTermsPage', 'en-US')
}

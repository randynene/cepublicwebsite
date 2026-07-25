import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import LegalPageTemplate from '@/components/templates/legal'

import { PREVIEW_PRIVACY_BODY } from './_fixture'

// DEV-ONLY design preview for the LEGAL long-form template.
//
// Mirrors the /demo production guard: 404s in production. Exists so the
// reading treatment can be reviewed in the real Header + Footer chrome before
// the real privacy-policy body is authored in Sanity. Uses PLACEHOLDER copy
// (see _fixture.ts) — not Cloud Employee's actual policy.

export const metadata: Metadata = {
  title: 'Legal template preview',
  robots: { index: false, follow: false },
}

export default function PrivacyPolicyPreviewPage() {
  if (process.env.NODE_ENV === 'production') notFound()

  return (
    <main id="main">
      <LegalPageTemplate
        title="Privacy Policy"
        eyebrow="Legal"
        lastUpdated="12 June 2026"
        body={PREVIEW_PRIVACY_BODY}
      />
    </main>
  )
}

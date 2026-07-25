import 'server-only'

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import LegalPageTemplate from '@/components/templates/legal'
import { generateCanonical, generateHreflang, type Locale } from '@/lib/locale'
import {
  fetchLegalPage,
  formatLastUpdated,
  type LegalPageId,
} from '@/lib/sanity/queries/legal-page'

// Shared metadata + render for the four legal routes (2 pages x 2 locales).
//
// The original /legals/privacy-policy route emitted a title and description and
// nothing else — no canonical, no hreflang. Every other template on the site sets
// both (the CONTRACT in lib/locale.ts says so), and a UK legal page with no
// canonical is a duplicate of the US one as far as Google is concerned. Doing
// this once, here, is what stops the four routes drifting apart on it.

export async function buildLegalMetadata(
  id: LegalPageId,
  usPath: string,
  locale: Locale,
): Promise<Metadata> {
  const page = await fetchLegalPage(id)
  if (!page) return {}

  const title = page.metaTitle ?? page.title
  const canonical = generateCanonical(usPath, locale)

  return {
    title,
    ...(page.metaDescription ? { description: page.metaDescription } : {}),
    alternates: {
      canonical,
      languages: generateHreflang(usPath),
    },
    openGraph: {
      title,
      ...(page.metaDescription ? { description: page.metaDescription } : {}),
      url: canonical,
      type: 'website',
    },
  }
}

export async function renderLegalRoute(id: LegalPageId, locale: Locale) {
  const page = await fetchLegalPage(id)

  // An empty body is not a page worth serving. This is what made
  // /legals/privacy-policy 404 for months: the singleton existed with a title but
  // its body was never migrated. The content is there now; the guard stays,
  // because shipping an empty legal page is worse than 404ing one.
  if (!page || !page.body || page.body.length === 0) notFound()

  return (
    <main id="main">
      <LegalPageTemplate
        title={page.title}
        eyebrow={page.eyebrow}
        lastUpdated={formatLastUpdated(page._updatedAt, locale)}
        body={page.body}
      />
    </main>
  )
}

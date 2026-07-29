import type { Metadata } from 'next'

import { HireEngineersTemplate } from '@/components/templates/hire-engineers'
import { HE, HIRE_ENGINEERS_META } from '@/components/templates/hire-engineers/content'
import { generateCanonical, generateHreflang } from '@/lib/locale'
import { fetchHireEngineersPage, toHireEngineersContent } from '@/lib/sanity/queries/hire-engineers-page'
import { resolvePageTitle } from '@/lib/seo/page-title'

// /services/software-engineers - bespoke dark/lime "Hire Engineers" landing page
// (docs/raw-html/Hire Engineers Page). Header and footer come from the shared
// layout; the sections (hero -> final CTA) are the ported design. This static
// route takes precedence over the services/[slug] Sanity route, and is the
// declared destination of the /hire/software-engineers redirect. Copy is now
// editable in Sanity (hireEngineersPage singleton); the static HE stays as the
// fallback when the doc is absent / fails validation.

export async function generateMetadata(): Promise<Metadata> {
  const data = await fetchHireEngineersPage()
  return {
    title: resolvePageTitle(data?.metaTitle ?? HIRE_ENGINEERS_META.title ),
    description: data?.metaDescription ?? HIRE_ENGINEERS_META.description,
    alternates: {
      canonical: generateCanonical('/services/software-engineers', 'en-US'),
      languages: generateHreflang('/services/software-engineers'),
    },
  }
}

export default async function HireEngineersPage() {
  const data = await fetchHireEngineersPage()
  const content = data ? toHireEngineersContent(data) : HE
  return <HireEngineersTemplate content={content} />
}

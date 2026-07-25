import type { Metadata } from 'next'

import { OurWorkTemplate } from '@/components/templates/our-work'
import { OUR_WORK_CONTENT, OUR_WORK_META } from '@/components/templates/our-work/content'
import { generateCanonical, generateHreflang } from '@/lib/locale'
import { fetchOurWorkPage, toOurWorkContent } from '@/lib/sanity/queries/our-work-page'

// /our-work - bespoke dark/lime marketing page (docs/raw-html/Our Work.html).
// Separate from /customer-stories. Header, footer and the closing CTA come from
// the shared layout/footer. Copy + the three photo tiles are now editable in
// Sanity (ourWorkPage singleton); the static OUR_WORK_CONTENT stays as the
// fallback when the doc is absent / fails validation.

export async function generateMetadata(): Promise<Metadata> {
  const data = await fetchOurWorkPage()
  return {
    title: { absolute: data?.metaTitle ?? OUR_WORK_META.title },
    description: data?.metaDescription ?? OUR_WORK_META.description,
    alternates: { canonical: generateCanonical('/our-work', 'en-US'), languages: generateHreflang('/our-work') },
  }
}

export default async function OurWorkPage() {
  const data = await fetchOurWorkPage()
  const content = data ? toOurWorkContent(data) : OUR_WORK_CONTENT
  return <OurWorkTemplate locale="en-US" content={content} />
}

import type { Metadata } from 'next'

import { AskTemplate } from '@/components/ask'
import { ASK_META } from '@/components/ask/content'
import { resolveAskParams } from '@/lib/ask/fixtures'
import { generateCanonical, generateHreflang } from '@/lib/locale'
import { resolvePageTitle } from '@/lib/seo/page-title'

// ASK-CLARA P2 — UK mirror of /ask. Same template, UK canonical.

// noindex until P3, matching /ask. See the note there.
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: resolvePageTitle(ASK_META.title),
    description: ASK_META.description,
    robots: { index: false, follow: true },
    alternates: {
      canonical: generateCanonical('/ask', 'en-GB'),
      languages: generateHreflang('/ask'),
    },
  }
}

export default async function AskUkPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { debug, screenId, fixtureMode, scriptId } = resolveAskParams(
    await searchParams,
  )
  return (
    <AskTemplate
      locale="en-GB"
      screenId={screenId}
      scriptId={scriptId}
      fixtureMode={fixtureMode}
      debug={debug}
    />
  )
}

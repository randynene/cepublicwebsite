import type { Metadata } from 'next'

import { AskTemplate } from '@/components/ask'
import { ASK_META } from '@/components/ask/content'
import { resolveAskParams } from '@/lib/ask/fixtures'
import { generateCanonical, generateHreflang } from '@/lib/locale'
import { resolvePageTitle } from '@/lib/seo/page-title'

// ASK-CLARA P2 — /ask, the Ask AI anything conversation surface.
//
// Default render source is the live mock session (scripted SSE). `?askDebug=1`
// mounts the fixture switcher + mock-script picker. No real Clara calls, no
// HubSpot, no voice. P3 swaps the mock transport for the proxy.

// noindex until P3. The conversation on this page is a scripted mock, so the
// content a crawler would index is invented — an indexed page of fake dialogue
// on a real commercial domain is worse than no page at all. `follow: true`
// because the outbound links are genuine. Absent from the sitemap already, and
// it stays that way until this comes off. Remove both when the live transport
// lands.
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: resolvePageTitle(ASK_META.title),
    description: ASK_META.description,
    robots: { index: false, follow: true },
    alternates: {
      canonical: generateCanonical('/ask', 'en-US'),
      languages: generateHreflang('/ask'),
    },
  }
}

export default async function AskPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { debug, screenId, fixtureMode, scriptId } = resolveAskParams(
    await searchParams,
  )
  return (
    <AskTemplate
      locale="en-US"
      screenId={screenId}
      scriptId={scriptId}
      fixtureMode={fixtureMode}
      debug={debug}
    />
  )
}

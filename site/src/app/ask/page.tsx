import type { Metadata } from 'next'

import { AskTemplate } from '@/components/ask'
import { ASK_META } from '@/components/ask/content'
import { resolveAskParams } from '@/lib/ask/fixtures'
import { generateCanonical, generateHreflang } from '@/lib/locale'
import { resolvePageTitle } from '@/lib/seo/page-title'

// ASK-CLARA P1 — /ask, the Ask AI anything conversation surface.
//
// Indexable with normal meta, per the non-blocking default in the execution plan
// §10 (open item 2). If Jake decides it should be noindex, that is a one-line
// `robots` addition here and in the UK mirror.
//
// No Sanity fetch in P1: every state is a fixture. The `askPage` singleton that
// supplies the proof panel and the Calendly URL arrives with P3/P5.

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: resolvePageTitle(ASK_META.title),
    description: ASK_META.description,
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
  const { debug, screenId } = resolveAskParams(await searchParams)
  return <AskTemplate locale="en-US" screenId={screenId} debug={debug} />
}

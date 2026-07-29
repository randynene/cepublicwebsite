import { AskShell } from './ask-shell'
import { ASK_META } from './content'
import type { AskScreenId } from '@/lib/ask/types'

// Server entry point for /ask and its locale mirrors.
//
// The visible design has no headline - the page opens straight into the
// conversation - so the H1 is screen-reader only. It still has to exist: this is an
// indexable landing page, and a page with no H1 is both an SEO and an
// assistive-tech gap. The heading text is the page's real name, "Ask AI anything",
// not a hidden keyword dump.
//
// No `locale` prop yet. Both locales render the same surface in P1, and the
// canonical/hreflang work happens in each route's generateMetadata. It comes back
// when P3 needs it for the Clara session.

export function AskTemplate({
  screenId,
  debug,
}: {
  screenId: AskScreenId
  debug: boolean
}) {
  return (
    <main>
      <h1 className="sr-only">{ASK_META.title}</h1>
      <AskShell initialScreenId={screenId} debug={debug} />
    </main>
  )
}

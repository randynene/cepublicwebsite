// The one assembled redirect table. next.config.ts serves it to the router and
// app/sitemap.ts filters against it, so the sitemap cannot advertise a URL the
// router redirects.
//
// ORDER IS BEHAVIOUR. Next.js fires the first matching rule, and the collapse
// pass resolves destinations against this same order, so reordering these
// spreads changes where redirects land.
import type { Redirect } from 'next/dist/lib/load-custom-routes'

import { backlinkReclaims } from './backlink-reclaims'
import {
  collapseRedirectChains,
  expandPrefixSwapShortcuts,
  literalRedirectSources,
  specificRulesFirst,
} from './collapse'
import { crawlRedirects } from './generated-redirects'
import { jobRoleRedirects } from './job-role-redirects'
import { lockedRules } from './locked-rules'
import { regexRedirects } from './regex-redirects'
import { webflowRedirects } from './webflow-redirects'

// backlinkReclaims goes FIRST, and that position is the whole point of it: one
// of its rules overrides a generated Webflow rule that sends the same source to
// /blog, and Next.js fires the first match. See ./backlink-reclaims.ts.
const assembled: Redirect[] = [
  ...backlinkReclaims,
  ...crawlRedirects,
  ...regexRedirects,
  ...webflowRedirects,
  ...jobRoleRedirects,
  ...lockedRules,
]

// Collapse first so the per-slug shortcuts point at the end of the chain rather
// than at its second hop.
/** The table as served: same rules, same order, chains collapsed to one hop. */
export const allRedirects: Redirect[] = specificRulesFirst(
  expandPrefixSwapShortcuts(collapseRedirectChains(assembled)),
)

/** Literal paths that answer with a redirect. Nothing here belongs in a sitemap. */
export const redirectedPaths: Set<string> = literalRedirectSources(allRedirects)

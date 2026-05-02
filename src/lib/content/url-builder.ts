// CONTENT-1D §1 — URL construction for the 6 in-scope doc types.
//
// Routes are taken verbatim from MYGRATR_SCHEMA_DESIGN_DECISIONS.md §10
// ROUTING TABLE. Do not improvise — any drift between the routing table
// and the code here breaks the brief's MIGRATION BLOCKS guarantee.
//
// Locale: hardcoded to the US (default) origin. CONTENT-1D scrapes only
// the default locale per §4 Out of Scope ("UK locale scraping" is
// LOCALE-1's job; CE's UK pages are duplicates that won't diverge until
// then).
const BASE = 'https://www.cloudemployee.io'

const ROUTES: Record<string, (slug: string) => string> = {
  technology: (s) => `${BASE}/technology/${s}`,
  service: (s) => `${BASE}/services/${s}`,
  customerStory: (s) => `${BASE}/customer-story/${s}`,
  teamMember: (s) => `${BASE}/team/${s}`,
  review: (s) => `${BASE}/reviews/${s}`,
  bookACall: (s) => `${BASE}/book-a-call/${s}`,
}

export interface DocForUrl {
  _type: string
  slug: { current: string }
}

export function urlForDoc(doc: DocForUrl): string {
  const route = ROUTES[doc._type]
  if (!route) throw new Error(`urlForDoc: unsupported _type "${doc._type}"`)
  if (!doc.slug || typeof doc.slug.current !== 'string' || doc.slug.current.length === 0) {
    throw new Error(`urlForDoc: doc has no slug.current (_type=${doc._type})`)
  }
  return route(doc.slug.current)
}

export function inScopePathPrefixes(): string[] {
  return ['/technology/', '/services/', '/customer-story/', '/team/', '/reviews/', '/book-a-call/']
}

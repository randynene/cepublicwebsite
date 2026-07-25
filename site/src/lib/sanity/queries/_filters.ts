// Shared GROQ predicates.
//
// NOT_RETIRED excludes documents marked `retired: true` in Studio. See
// `retiredField()` in studio/schemas/_shared.ts for why they exist: 35 items
// were deleted or unpublished in Webflow after the CONTENT-1 migration ran, and
// the live site now 301s their URLs to the parent hub. The documents survive in
// Sanity so an accidental upstream deletion is reversible with a Studio toggle,
// but they must never be routed, listed, or put in the sitemap.
//
// `!(retired == true)` and NOT `!retired`. The field is undefined on every
// document that predates it, and in GROQ `!undefined` is not true, so `!retired`
// would silently exclude the entire back catalogue. Comparing to `true`
// explicitly makes undefined behave as "not retired", which is what we want.
//
// Every query that routes or lists documents must include this. It belongs in
// three places per document type: the detail query (a direct hit on a retired
// slug should 404 rather than render), the metadata query, and the params query
// that feeds generateStaticParams.
export const NOT_RETIRED = /* groq */ `!(retired == true)`

// Webflow publishes CMS items PER LOCALE, and our `retired` flag is global. So a
// document can be gone from one locale and still live in another, and retiring it
// kills both.
//
// That is not hypothetical. Caitlin Murray was removed from the US team collection,
// so the drift check correctly flagged her and she was retired, and 404ing
// /team/caitlin-murray matches the live site exactly. But /uk/team/caitlin-murray
// is still a live 200 on cloudemployee.io: her UK bio was never unpublished.
// Retiring her globally dropped a page the live site still serves, which is the
// precise failure the parity gate exists to catch, and it caught it.
//
// `ukOnly` models that state directly: the document renders under /uk/ and 404s on
// the default locale. It is checked against a $locale param rather than baked in,
// because the same document feeds both route trees.
//
// Of the 35 retired documents this applies to exactly one, so the field is
// deliberately narrow. It exists because Webflow's per-locale publishing is a
// standard feature and this will recur on the next customer, not because CE needs
// a general locale-visibility system.
export const VISIBLE_IN_LOCALE = /* groq */ `(!(ukOnly == true) || $locale == "uk")`

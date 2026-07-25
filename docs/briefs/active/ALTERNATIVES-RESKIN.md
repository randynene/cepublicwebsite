# MYGRATR-HUB-ALTERNATIVES - Alternatives hub re-skin + Compare consolidation

> Status: LOCKED (22 Jul 2026). Jake decided Path B + site pattern.
> Branch: `feat/design-1`. Migration state: `content_complete` - does NOT transition.
> Complexity: LOW-MEDIUM. Re-skin of one hub (mirrors HUB-RESOURCE) plus a single
> deliberate redirect. Tier-1 post-phase updates only.

---

## 0. One-paragraph summary (plain English)

`/alternatives` is a live, ranking hub (Search Console position ~9.1) that lists the
27 "Cloud Employee vs X" comparison articles, but it still renders the pre-redesign
grey grid. This phase re-skins it to the site's dark/lime hub look (hero + featured
row + card grid + pagination + intro/FAQ), reusing the pieces already built for the
blog and resource hubs. Separately, `/compare` (the hub ROOT, a weaker-ranking ~25.9
marketing page over the SAME comparison docs) is 301-redirected to `/alternatives` to
kill the two-pages-competing problem and concentrate equity into the stronger URL. The
`/compare/{slug}` DETAIL articles are untouched and stay live. Content, URLs of the
articles, and SEO wiring are not changed; this is skin + one redirect.

## 1. Decisions (Jake, 22 Jul 2026)

- D1 - Consolidate onto the stronger page. Rebuild `/alternatives` as the one good
  page; 301 `/compare` (root only) -> `/alternatives`. Keep `/compare/{slug}` details.
  This is the SAFE direction of consolidation (keeps the higher-ranking URL). It is a
  DELIBERATE DIVERGENCE from live (live serves `/compare` as 200), so it needs a
  recorded parity exception. Confirm `/compare` root traffic/backlinks are thin
  before/at launch; reversible if not.
- D2 - Design = the proven dark/lime hub pattern (no bespoke `/alternatives` design
  exists). Single column, NO cross-link sidebar (alternatives has no sibling hubs),
  NO search. Featured 3-up + 3-col grid to match the live layout shape.
- D3 - Featured auto-fills (pinned first, topped up with most-recent), same reason the
  resource hubs needed it: `featuredItems` is empty at seed so a pinned-only row never
  renders. Seb can pin later.

## 2. What already exists (do NOT rebuild)

- Data: `alternativesHub` in HUB_CONFIG (shape collection, childType compareBlog,
  cardKind blog, basePath /alternatives). GROQ/Zod, metadata, sitemap: unchanged.
- Cards: `BlogCard` (dark/lime, locale-correct as of 22 Jul fix). Reused as-is.
- Shared shell pieces: `BlogBand`, `SectionLabel`, `BlogPagination`, `LongFormBand`.
- `/compare/{slug}` + `/uk/compare/{slug}` detail routes: untouched.

## 3. Build steps

1. `AlternativesHubTemplate` (`site/src/components/templates/alternatives-hub/index.tsx`):
   dark/lime, single column: radial hero (eyebrow + H1 + heroDescription) -> featured
   3-up (gated on length) -> "All alternatives" 3-col grid of BlogCard (or empty state)
   -> BlogPagination -> LongFormBand (intro/FAQ). JSON-LD: CollectionPage +
   BreadcrumbList + ItemList + FAQPage (when faqs), via serializeJsonLd. One H1.
2. Resolver with featured auto-fill for alternatives (count 3). Isolated from the
   resource resolver to avoid destabilising the 8 resource routes; consolidate later.
3. Point `/alternatives` + `/uk/alternatives` at the new template.
4. `/compare` 301 -> `/alternatives` (SEPARATE step): confirm the net-new-redirect
   mechanism first (redirect tables are auto-generated from Webflow; live has no such
   redirect), then add it + a parity exception + delete the `/compare` hub root route.
   Keep `/compare/{slug}`.

## 4. Verify (the gate, no CI net)

- `tsc --noEmit`, `npm run lint` (0 new errors), `npm run build` (exit 0).
- `/alternatives` + `/uk/alternatives` 200; dark/lime; grid from live Sanity data;
  cards link real `/compare/{slug}`; UK carries `/uk/compare/{slug}`.
- No other hub changed (they still call renderHub).
- After step 4: `/compare` 308/301 -> `/alternatives`; `/compare/{slug}` still 200.

## 5. Non-goals

- Not touching Sanity schema/GROQ/Zod, the compareBlog docs, or `/compare/{slug}`.
- Not building the live `/compare` marketing page (it is being retired via redirect).
- Not changing `renderHub` or the other hubs.
- No em dashes in authored copy/comments.

## 6. Post-phase (Tier 1)

Update `docs/ROADMAP_TO_COMPLETION.md` tracker (compare + alternatives rows). Tier-1
context files at phase close.

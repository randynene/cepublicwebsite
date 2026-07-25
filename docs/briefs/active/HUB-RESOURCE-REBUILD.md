# MYGRATR-HUB-RESOURCE — Resource Hub Visual Rebuild (4 hubs, one template)

> Status: LOCKED (Jul 2026). Ready to execute on Jake's go.
> Branch: `feat/design-1`. Migration state: `content_complete` — this phase does
> NOT transition state.
> Complexity: MEDIUM. Re-skin + shell rebuild, not a from-scratch build, not a
> schema change. Tier-1 post-phase updates only.

---

## 0. One-paragraph summary (plain English)

Four pages on the site — `/videos`, `/tools`, `/downloads`, `/events` — are all
the same kind of page: a title, an intro, and a grid of cards. Today they render
through the old generic `renderHub` helper, which draws the stale pre-redesign
grey grid. This phase builds ONE new dark/lime template (`ResourceHubTemplate`)
and points all four routes (plus their `/uk` mirrors) at it. The content, the
Sanity data, the URLs, the images, and the SEO wiring already work and are NOT
touched. We are changing the skin and the layout composition, nothing else. It is
the exact same move that was already made for the seven blog pages, reusing the
patterns that shipped there.

---

## 1. Why this is one template, not four

The four live pages are visually identical bar their content. Confirmed from
fresh live captures (Jul 2026) in `docs/live-captures-jul2026/`:

- `tools-index__desktop.png`
- `videos-index__desktop.png`
- `downloads-index__desktop.png`
- `events-index__desktop.png`

Every one has: eyebrow pill -> big title -> intro paragraph -> a cross-link nav
of the four resource types -> a "Featured X" row -> an "All X" grid -> the
sitewide footer CTA. Events is the same template showing its empty state ("No
upcoming events", "no on-demand content"). So: build once, wire four (eight with
UK mirrors), and events falls out for free.

This mirrors the decision already made and shipped for the blog family
(`site/src/components/templates/blog-hub/index.tsx` — ONE component for
`/blog` + six topic hubs).

---

## 2. What already exists (do NOT rebuild these)

| Thing | File | State |
|---|---|---|
| Route files (US) | `site/src/app/{videos,tools,downloads,events}/page.tsx` | Thin: `resolveHubRoute(...)` then `renderHub(data)`. Only the render call changes. |
| Route files (UK) | `site/src/app/uk/{videos,tools,downloads,events}/page.tsx` | Same shape as US. |
| Data resolver | `site/src/lib/hubs/render-route.ts` | Fetches singleton + paged children + featured + pagination. UNCHANGED. |
| Hub config | `site/src/lib/sanity/queries/hubs.ts` `HUB_CONFIG` | `videosHub / toolsHub / downloadsHub / eventsHub`, all `shape: 'collection'`, `cardKind: 'resource'`. UNCHANGED. |
| GROQ + Zod | `hubs.ts` `HUB_SINGLETON_QUERY`, `HubSingletonSchema`, child queries | UNCHANGED. Projects `eyebrow, title, heroDescription, introContent, faqs, featuredItems`. |
| Card | `site/src/components/cards/resource-card.tsx` | Renders type label + 16:9 image + title + excerpt + date via the `Card` primitive (already reads dark/lime D2 tokens). Light re-skin only if the review shows drift. |
| Card helpers | `site/src/components/cards/_shared.tsx` | `getResourceLabel`, `getCardExcerpt`, `formatCardDate`. UNCHANGED. |
| Metadata | `site/src/lib/hubs/metadata.ts` `buildHubMetadata` | title/description/OG/canonical from Sanity. UNCHANGED. |
| Sitemap entries | `site/src/app/sitemap.ts` | Already present. UNCHANGED. |
| Pagination logic | `site/src/lib/hubs/pagination.ts` | UNCHANGED. |

**Reusable blog-family components to lift (do NOT fork the blog):**

| Component | File | Reuse plan |
|---|---|---|
| `BlogBand` | `site/src/components/blog/container.tsx` | The 1152px content band that lines up with header/footer. Reuse as-is. |
| `BlogPagination` | `site/src/components/blog/pagination.tsx` | Reuse as-is. |
| `LongFormBand` | `site/src/components/blog/long-form-band.tsx` | Renders `introContent` prose + FAQ in a 720px reading column. Reuse as-is. |
| `SectionLabel` | `site/src/components/blog/section-label.tsx` | The eyebrow-style H2 label ("Featured", "All videos"). Reuse as-is. |

---

## 3. The design (ASCII wireframe — desktop)

```
┌──────────────────────────── sitewide header (exists) ─────────────────────────┐
└───────────────────────────────────────────────────────────────────────────────┘

              radial glow ground  (#0c1830 -> #070D18), same as blog hero
        ┌───────────────────────────────────────────────────────────────┐
        │                    [ eyebrow pill ]                            │   centered,
        │                   R E S O U R C E   T I T L E                  │   max ~760px
        │              one-line intro paragraph, muted                   │
        └───────────────────────────────────────────────────────────────┘

   ── 1152px BlogBand ────────────────────────────────────────────────────────
   ┌────────────────┐   ┌──────────────────────────────────────────────────┐
   │  Topics:       │   │  Featured                        ← SectionLabel H2 │
   │                │   │  ┌───────────────┐ ┌───────────────┐              │
   │  ▸ Downloads   │   │  │  ResourceCard │ │  ResourceCard │  (0-2 pinned; │
   │  ▸ Tools       │   │  └───────────────┘ └───────────────┘   hides if 0) │
   │  ▪ Videos ◀ on │   │                                                    │
   │  ▸ Events      │   │  All videos                      ← SectionLabel H2 │
   │                │   │  ┌───────────────┐ ┌───────────────┐              │
   │  (vertical     │   │  │  ResourceCard │ │  ResourceCard │  2-col ≥768   │
   │   nav, active  │   │  └───────────────┘ └───────────────┘  1-col mobile │
   │   = lime)      │   │  ┌───────────────┐ ┌───────────────┐  12 per page  │
   │                │   │  └───────────────┘ └───────────────┘              │
   │  sticky on     │   │                                                    │
   │  desktop       │   │       [ ‹ Prev ]  1  2  3  [ Next › ]  ← Pagination│
   └────────────────┘   └──────────────────────────────────────────────────┘
     ~260px                  content column (2-col grid, fills at any size)

   Long-form prose (introContent) + FAQ, 720px column     ← LongFormBand
   (only when the hub has body copy / FAQs; ALL four resource hubs have none,
    confirmed by probe — so this never renders here. Kept for parity with blog.)
   ────────────────────────────────────────────────────────────────────────────

┌──────────── sitewide footer + "Ready to hire" CTA (exists) ───────────────────┐
└───────────────────────────────────────────────────────────────────────────────┘
```

**Layout:** two-column on desktop (≥1024px) — a ~260px left sidebar nav + a wide
content column carrying a **2-column** card grid. Below 1024px the sidebar stacks
above the content as a horizontal-scroll strip. The 2-column content grid (not
3-column) is deliberate: it keeps the sparse hubs (Tools = 2, Downloads = 2) from
looking like an empty shelf, while Videos (22) still fills cleanly.

**Events empty state:** when `items.length === 0`, the "All X" grid is replaced by
a single muted line (`UI_STRINGS['hub.emptyState']`), and Featured is already
hidden (no pinned items). No upcoming/on-demand split — see Deferred table.

---

## 4. Key decisions (D-prefixed)

- **D1 — Resource-type nav is a LEFT SIDEBAR (Jake's call, Jul 2026).** Mirrors the
  live "Topics:" sidebar: a vertical nav column listing the four resource hubs,
  active one highlighted in lime. Two-column layout on desktop, stacks to a
  horizontal-scroll strip below 1024px. Component: `ResourceHubSidebar` (new).
  **Nav items are real `<a>` per hub, never JS filters** — every hub stays a
  crawlable URL with its own rankings. (Supersedes the earlier pills recommendation.)

- **D2 — Sub-type filter pills are DROPPED, not built (probe-driven, Jul 2026).**
  Live "All X" rows carry a sub-filter (Tools: All/Tools/Calculations; Downloads:
  All/Google Doc/PDF; Videos: All/Interviews/Working-with-us/Fireside-chats). The
  Step 0 probe proved the data cannot drive them: `video.category` is null on all
  22 docs, and tool/download carry no type/format field — only `tags`. Building
  them = schema additions + hand-tagging every doc (out of scope, no schema change)
  AND the catalogs are tiny (Tools 2, Downloads 2, Events 0), so a filter would act
  on almost nothing. Omitted deliberately; a deliberate divergence from live, which
  is itself filtering the same tiny lists. If CE grows the catalogs, adding real
  grouping is its own small phase (add field -> tag docs -> enable filter).

- **D3 — No search bar on resource hubs.** Live tools/videos/downloads have no
  search; events has a stray one tied to on-demand content we are not building.
  Omit. (Blog + customer-stories keep theirs; those are separate phases.)

- **D4 — Featured block is a simple 2-up row of `ResourceCard`, matching the
  content grid, not the blog's 1-big-plus-4-stacked split.** `featuredItems` is
  empty at seed (Seb pins later), so the section is invisible today; a simple row
  keeps scope tight and the whole section gates on `featured.length > 0`.

- **D5 — `renderHub` stays for the other hubs.** This phase forks only the four
  resource hubs onto `ResourceHubTemplate`. `renderHub` still serves services,
  technology, reviews, customer-stories, compare, alternatives until their own
  rebuild phases. No change to `renderHub`'s signature.

- **D6 — Content grid is 2-column, not 3 (sparseness fix, Jul 2026).** With a
  ~260px sidebar eating the left, a 2-column grid in the content column fills its
  rows even at 2 items (Tools, Downloads) and still reads well at 22 (Videos).
  Prevents the "2 lonely cards in a wide 3-col grid" look. Responsive: 2-col
  ≥768px within the content column, 1-col on mobile.

---

## 5. Numbered build steps (every behavior traces to a file)

### Step 0 — Probes (DONE, Jul 2026 — recorded here)
0.1 Git: confirm `git status` clean on `feat/design-1` at build start (re-check).
0.2 Hero copy currency — DONE. All four hubs hold `eyebrow` ("Resources") + `title`
    (Free Downloads / Events & Webinars / Tools & Quizzes / Video Library) +
    `heroDescription` (hasHero=true). `introContent` absent on all four (hasBody=false),
    `faqs` null on all four. **Verdict: no fallback copy table needed; LongFormBand
    + FAQ never render on these hubs.**
0.3 File-path collision: confirm no existing
    `site/src/components/templates/resource-hub/` at build start.
0.4 Catalog sizes + sub-type fields — DONE. Videos 22 (`category` null on all;
    `team` is an internal label, not a user-facing group), Tools 2 (no type field),
    Downloads 2 (no format field), Events 0. **Verdict: D2 filters dropped; D6
    2-column grid to handle the small catalogs.**

### Step 1 — `ResourceHubSidebar` nav component
File: `site/src/components/templates/resource-hub/resource-hub-sidebar.tsx` (new).
- Vertical nav column (~260px on desktop; sticky). Four items in order: Downloads
  `/downloads`, Tools `/tools`, Videos `/videos`, Events `/events`. Active item =
  solid lime + dark text (never white-on-lime); others muted with hover.
- Real `<a>` (Next `Link`) per hub, locale-prefixed via `buildLocalePath`.
  `aria-current="page"` on the active item; `<nav aria-label>` on the wrapper.
- Below 1024px: renders as a horizontal-scroll strip above the content (same markup,
  responsive classes), mirroring the blog `TopicPills` mobile behaviour.
- Labels from new `UI_STRINGS` keys (Step 6).

### Step 2 — `ResourceHubTemplate` shell
File: `site/src/components/templates/resource-hub/index.tsx` (new).
- Props: identical shape to `BlogHubTemplate` (`hub, hubType, items, featured,
  pagination, locale`).
- Renders, in order: JSON-LD scripts (Step 5) -> rel prev/next -> `<main>` ->
  radial-glow hero (eyebrow pill + H1 + intro) -> `BlogBand` { two-column layout:
  LEFT `ResourceHubSidebar`; RIGHT content column = Featured (Step 4) -> "All X"
  2-col grid of `ResourceCard` (or empty state) -> `BlogPagination` ->
  `LongFormBand` (never renders here per probe) }.
- Two-column via CSS grid (e.g. `lg:grid-cols-[260px_1fr]`), collapsing to a
  single column below 1024px with the sidebar strip on top.
- EXACTLY ONE `<h1>` (the title). Section labels are H2. Card titles are H3
  (already so in `ResourceCard`).

### Step 3 — `ResourceCard` verify / light re-skin
File: `site/src/components/cards/resource-card.tsx` (edit only if Step 0.4 shows drift).
- Uses `Card` primitive (dark/lime tokens). Expected: verify, not rebuild. If the
  live-data card looks off on dark ground, minimal token-class fixes only. Log any
  change in the DEV-N block. Do NOT change its data contract or link semantics
  (single `<a>` per card, `<h3>` wraps the link).

### Step 4 — Featured row
Inline in `ResourceHubTemplate` (per D4): `SectionLabel` "Featured" + a
2-column grid of `ResourceCard` (matching the content grid), gated on
`featured.length > 0`. No new file.

### Step 5 — SEO / JSON-LD (specified, not retrofitted)
- Heading hierarchy: one H1 (title); H2 = Featured / All X / FAQ labels; H3 = card
  titles. Verified in Step 2.
- JSON-LD (mirror `blog-hub/index.tsx`, all through `serializeJsonLd`):
  `CollectionPage` + `BreadcrumbList` + `ItemList` (over featured+items in render
  order) + `FAQPage` (only when `faqs.length > 0`).
- Meta: unchanged, from `buildHubMetadata`.
- Canonical + `/uk` hreflang: unchanged (route-level).
- Internal linking: `ResourceTypePills` cross-links the four hubs (net-new internal
  links, an SEO gain).

### Step 6 — UI strings
File: `tools/eslint/ui-strings.json` (canonical SoT) -> run
`npm run generate-ui-strings` -> regenerates `site/src/lib/ui-strings.ts` (do NOT
hand-edit the generated file).
- New keys: `resourceHub.navDownloads`, `resourceHub.navTools`,
  `resourceHub.navVideos`, `resourceHub.navEvents`, `resourceHub.topicsLabel`
  ("Topics:" sidebar heading), `resourceHub.featured`, and the "All videos/tools/
  downloads/events" section-label keys.

### Step 7 — Point the eight routes at the new template
Files: `site/src/app/{videos,tools,downloads,events}/page.tsx` and
`site/src/app/uk/{videos,tools,downloads,events}/page.tsx`.
- Swap `import renderHub from '@/lib/hubs/render-hub'` +
  `return renderHub(data)` for the new `ResourceHubTemplate`.
- The `resolveHubRoute(hubType, ...)` call and `generateMetadata` stay exactly as
  they are. UK routes pass `locale: 'en-GB'` exactly as they do now.

### Step 8 — Verify
- `cd site && npm run lint && npx tsc --noEmit && npm run build` — all clean (no CI
  net; this is the gate).
- Visual eyeball at each of the eight routes in `npm run dev` against the live
  captures. Events must render its empty state cleanly.
- Confirm no other hub (services/technology/reviews/customer-stories/compare/
  alternatives) changed — they still call `renderHub`.

---

## 6. Exit criteria (mapped to paths)

- [ ] `site/src/components/templates/resource-hub/index.tsx` exists and renders the §3 wireframe (two-column, 2-col content grid).
- [ ] `site/src/components/templates/resource-hub/resource-hub-sidebar.tsx` exists; 4 nav links, active state correct, aria-current set, responsive strip below 1024px.
- [ ] All 8 route files import and render `ResourceHubTemplate`; `renderHub` no longer referenced by them.
- [ ] `/videos /tools /downloads /events` + `/uk/*` all HTTP 200; dark/lime; grid populated from live Sanity data; images render from Sanity (no hand-built URLs).
- [ ] `/events` renders the empty state (no crash, no empty "All" heading over a void).
- [ ] One H1 per page; CollectionPage + BreadcrumbList + ItemList JSON-LD present; FAQPage only when faqs exist.
- [ ] `npm run lint`, `tsc --noEmit`, `npm run build` all clean.
- [ ] `renderHub` unchanged; the six non-resource hubs visually unchanged.
- [ ] No em dashes in any authored copy/comment.

## 7. Non-goals (explicit)

- NOT rebuilding services / technology / reviews / customer-stories / compare / alternatives.
- NOT touching Sanity schema, GROQ, Zod, routes' data resolution, sitemap, or redirects.
- NOT building sub-type filter pills (D2, deferred).
- NOT building resource-hub search (D3).
- NOT re-migrating or re-uploading any image or content.
- NOT transitioning `migrations.status`.

## 8. Deferred items

| # | Item | Why deferred | Where it lands |
|---|---|---|---|
| D2 | Sub-type filter pills (All/Tools/Calculations etc.) | Data cannot drive them (no sub-type field); catalogs tiny. Needs schema + tagging | Future content phase if catalogs grow |
| D3 | Resource-hub search | Live has none worth cloning | Phase 2 |
| D-evt | Events upcoming/on-demand two-section split | Events is empty; the split has no content to hold | When CE runs events again |
| D-feat | Fancy 1-big-plus-4 featured split | Featured empty at seed; simple row is enough now | Non-breaking upgrade anytime |

## 9. Decisions for human (Jake) — all resolved Jul 2026

1. **D1 — RESOLVED:** left sidebar nav (Jake's call), not horizontal pills.
2. **D2 — RESOLVED:** ship WITHOUT sub-type filters (probe proved the data can't
   drive them; catalogs tiny).
3. **Hero copy — RESOLVED:** probe confirms all four hubs have eyebrow/title/hero
   intro; no fallback table needed.

**Brief is LOCKED. Ready to execute.**

## BUILD LOG — executed Jul 2026

Built exactly to the locked brief. Files:

- **NEW** `site/src/components/templates/resource-hub/index.tsx` — `ResourceHubTemplate`.
  One shell for all four hubs + UK mirrors. Radial-glow hero on the header band,
  two-column layout (`lg:grid-cols-[240px_minmax(0,1fr)]`), sidebar + content column.
  Emits CollectionPage + BreadcrumbList + ItemList + FAQPage JSON-LD (via
  `serializeJsonLd`) and rel=prev/next. Reuses blog `BlogBand`, `SectionLabel`,
  `BlogPagination`, `LongFormBand`.
- **NEW** `site/src/components/templates/resource-hub/resource-hub-sidebar.tsx` —
  `ResourceHubSidebar`. Sticky vertical nav on desktop, horizontal scroll strip on
  mobile. Four REAL `<a>` cross-links (Downloads / Tools / Videos / Events), active
  item = solid lime + dark text, `aria-current="page"`. Not filters — every hub
  stays crawlable.
- **RE-SKIN** `site/src/components/cards/resource-card.tsx` — now shares the blog
  `ArticleCard` dark surface exactly (#101B30, hover lift, lime inset hairline,
  stripe placeholder, whole-card `::after` anchor). Type label (Video/Tool/…)
  replaces the blog category pill. Data helpers unchanged.
- **WIRING** 8 routes (`/videos /tools /downloads /events` + `/uk` mirrors) swapped
  `renderHub(data)` → `<ResourceHubTemplate {...data} />`. `resolveHubRoute` unchanged.
- **UI_STRINGS** 11 new keys under `resourceHub.*` in `tools/eslint/ui-strings.json`;
  regenerated `site/src/lib/ui-strings.ts` (219 keys).

2-up grid (not 3-up) per brief — sparse catalogues. Featured row gated on
`featured.length > 0`. `/events` renders heading + honest empty-state line.

Gates: `tsc --noEmit` clean; `eslint` — 0 new errors (30 pre-existing = Tech Debt
#36, SCAFFOLD-AUDIT scope); `next build` exit 0, all 8 routes present.
`renderHub.tsx` retained (still serves the 8 collection/catalogue hubs). Not
committed, not pushed, `migrations.status` untouched.

## BUILD LOG 2 — Jake review round 1 (Jul 2026)

Visual review on a fresh `next dev` (the running :3000 server was serving a stale
build). Two changes off Jake's feedback:

1. **Featured now auto-fills** (was pinned-only, so always empty). NEW
   `site/src/lib/hubs/resource-route.ts` — `resolveResourceHubRoute`, mirroring the
   blog resolver: featured = pinned first then topped up with most-recent, page-1
   only, excluded from the grid so nothing repeats. `RESOURCE_FEATURED_COUNT = 2`
   (template draws a 2-up row), `RESOURCE_FEATURED_MIN = 6` (suppressed on sparse
   hubs). Net: Featured ON for /videos, OFF for /tools /downloads /events. 8 routes
   repointed from `resolveHubRoute` → `resolveResourceHubRoute`. Template
   `featured` prop retyped `FeaturedRef[]` → `HubChildItem[]` (casts removed).
2. **Thumbnail fallback** — `ResourceCard` imageless state was a faint stripe; now a
   lime-on-navy glow with the CE mark (`/ce-logo.svg`) centred, so every card
   carries a thumbnail. In practice every current doc has a real image; this is the
   safety net.

Confirmed dark/lime, centered heroes, left sidebar cross-linking all four, thumbs on
every card, /videos featured+grid, sparse hubs single grid, /events empty state.
`tsc` clean, new files lint-clean. Full `next build` deferred (dev server live for
review); run before any commit.

## 10. Post-phase updates (Tier 1 only, per 10-brief-standards)

CHANGELOG.md (1 line) + CLAUDE.md (row/stamp) + PHASE_HISTORY.md (short paragraph).
Tier 2 lookout: COMPONENTS.md gets the new `ResourceHubTemplate` +
`ResourceTypePills` entries; FEATURE_MAP.md resource-hub row updated. Note in one
line if any Tier-2 file is deliberately untouched.

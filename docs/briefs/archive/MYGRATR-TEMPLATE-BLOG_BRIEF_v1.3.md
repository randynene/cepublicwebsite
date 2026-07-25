# MYGRATR-TEMPLATE-BLOG — Phase Brief v1.3

> **Phase identifier:** MYGRATR-TEMPLATE-BLOG
> **Phase ordinal:** First TEMPLATE-* phase (pattern-establishing for
> remaining simple templates: TEAM_MEMBER, REVIEW, VIDEO, DOWNLOAD,
> COMPARE).
> **Brief version:** v1.3 — external cross-model audit applied
> (ChatGPT + Grok). 3 CRITICAL findings (author Zod nullability,
> `category._ref` data-flow break, locale filter contradicting
> single-document mirror) + 6 IMPORTANT findings (JSON-LD XSS via
> `</script>` injection, draft-mode perspective discipline lint,
> broken-category-ref `generateStaticParams` filtering, absent-
> locale-field probe, `urlFor(undefined)` safety, dedup-claim
> retraction) + 7 MINOR findings (FAQPage length guard, category-
> guard redundancy doc'd, related-posts grid spec, areasOfExpertise
> compatibility gate, A2 Link rel verification, GROQ-injection
> discipline lock, UK Visual Editing smoke confirm) integrated.
> 6 dismissed findings logged in §15. Ready for lock + execution.
> **Predecessor:** MYGRATR-DESIGN-1 Brief B Step 8 (commits `b941c5a` +
> `72ea7bf`, HALT 3, May 12 2026). Context-file sync `21c7e8e` (May 13).
> **Authoring posture:** drafted in Planning Claude session; executed by
> Claude Code in a fresh terminal session against this document plus
> all project knowledge files.
> **Critical reading dependency:** `CONVENTIONS.md` Entry 2 (Sanity
> Fetch Pattern) + Entry 3 (Draft-Mode Route Hardening) + Entry 4 (Env
> Schema Strictness) + Entry 5 (Visual Editing Method Probe Discipline)
> + `MYGRATR_SCHEMA_DESIGN_DECISIONS.md` §3.1 + §7.* + §10. Claude Code
> reads these before any code is written.

---

## §0 — Phase Context + Scope Lock + Non-Goals

### Phase context

TEMPLATE-BLOG is the first template-implementation phase after the full
DESIGN-1 deliverable set (tokens, primitives, Visual Editing
infrastructure, v0.dev prompt template, Storybook). It produces the
runtime template that renders 74 `blogPost` Sanity documents at the
`/[category]/[slug]` route pattern per locked routing decision
(`MYGRATR_SCHEMA_DESIGN_DECISIONS.md` §10).

`migrations.status` does NOT transition during this phase. Status
remains `content_complete`. Pipeline state-machine transitions resume
at MYGRATR-QA-1.

### Primary objective

Copy CE's existing blog-post visual presentation to the new Next.js
stack with brand-equivalent fidelity per `MYGRATR_PHASE_ROADMAP_v2.md`
§3.7:

- **Guarantee A — Content fidelity (100%):** every rendered string
  comes from Sanity. Zero invented copy. UI_STRINGS lint rule
  (DESIGN-1 Brief B Step 6) blocks hardcoded English at build time.
- **Guarantee B — SEO-critical fidelity (100%):** route preserved,
  meta tags from Sanity, JSON-LD generated server-side, hreflang +
  canonical from Next.js, redirects already configured at SCAFFOLD-1.
- **Guarantee C — Visual fidelity (95-98% target):** brand-equivalent
  presentation. Not pixel-perfect Webflow→Next.js parity. Animation
  parity is not a TEMPLATE-BLOG concern (blog template has no
  scroll-triggered animation per CE's live site).

### IN SCOPE

1. Dynamic route `site/src/app/[category]/[slug]/page.tsx` with
   category-validation guard (only the 6 `blogCategory` slugs match).
2. Page-level Sanity GROQ query using `sanityFetch` from
   `@/lib/sanity/live` (Visual Editing wired per CONVENTIONS Entry 2).
3. `generateMetadata()` returning title / description / canonical /
   OG image / hreflang.
4. Server-side JSON-LD: `BlogPosting` + `BreadcrumbList` + `FAQPage`
   (the last only when `faqs` is non-empty).
5. `generateStaticParams()` for ISR-compatible builds.
6. v0.dev-generated template component at
   `site/src/components/templates/blog/index.tsx` (async server
   component, Tailwind v4 only, design-system primitives only).
7. Related-posts strip: 3 most recent posts in the same `category`,
   excluding the current post.
8. Author bio card: full card with photo + name + position + about
   paragraph + areas-of-expertise tags + LinkedIn link (rendered when
   `author` ref resolves; hidden when null).
9. Breadcrumbs: `Home / Blog / {Category Name}` rendered above the
   post title, matching CE's live layout pattern.
10. TL;DR callout above content body (rendered only when `tldrSection`
    is non-empty).
11. PortableText rendering for `tldrSection`, `content`, and FAQ
    answers — including inline image blocks routed through the E1
    Image primitive.
12. FAQ accordion using A5 Accordion primitive (rendered only when
    `faqs` is non-empty, max 6 items per schema).
13. UK locale mirror: same content rendered at
    `/uk/[category]/[slug]`; hreflang tags emit both URLs (§7.7).
14. Page-level `<meta>` for Open Graph image (full `MetaFieldsSchema`
    per worked example).

### NON-GOALS (explicit OUT-OF-SCOPE)

1. **Floating table of contents (TOC).** Deferred to a dedicated
   post-launch enhancement phase that rolls TOC across BLOG +
   CUSTOMER_STORY + TECHNOLOGY + SERVICE + STATIC pages as a single
   sitewide feature. §7.3 of `MYGRATR_SCHEMA_DESIGN_DECISIONS.md`
   says TOC is template-level; live-site audit (May 2026) confirms
   TOC currently renders on blog pages only (left side), NOT on
   tech/service pages. Locked spec §7.3 contradicted by live site;
   resolution = treat as redesign, not migration, and defer.
2. **Blog listing pages.** `/blog` (blogHub singleton) and the 6
   category hubs (`/staff-augmentation`, `/scaling-teams`, etc.) are
   Tier-2 singletons handled in a separate phase (likely TEMPLATE-
   BLOG-HUB or rolled into MYGRATR-STATIC-1).
3. **Compare blog posts.** `compareBlog` is a separate doc type with
   its own template at `/compare/[slug]` — handled in TEMPLATE-
   COMPARE.
4. **Auto-TOC schema field.** No schema mutation; TOC deferred entire.
5. **Scroll-triggered animations.** CE's blog template has none;
   neither does the new one.
6. **Custom HubSpot form embed inside post body.** Only 1 of 74 blog
   posts has a HubSpot form embed in its content per
   `MYGRATR_SCHEMA_DESIGN_DECISIONS.md` §7.10 (the specific URL is
   `/scaling-teams/building-a-software-development-team-core-roles-dedicated-developers-and-modern-hiring-models`).
   PortableText's existing block-tools migration should have either
   preserved the embed shape as a custom block or stripped it.
   Claude Code's pre-flight Probe 3a (see §12.1) verifies actual
   state;
   if it's stripped, the form is added back in a follow-up post-
   launch fix, NOT in TEMPLATE-BLOG. Out-of-scope here.
7. **Beem-generated content variants.** Programmatic content
   generation is a post-launch surface; `source` / `generatedAt` /
   `needsReview` schema fields exist but TEMPLATE-BLOG renders all
   posts identically regardless of `source` value.
8. **Tech Debt #18 (Referrer-Policy header on disable UI).** The
   `<VisualEditing />` mount is in root layout (CONVENTIONS Entry 3
   §"Layout integration"). Referrer-Policy applies to whichever
   route renders the disable button — if disable lives in root
   layout, the header is a layout-level concern, not template-level.
   TEMPLATE-BLOG inherits whatever the layout sets. Tech Debt #18
   stays open and gets resolved in a separate sitewide pass (likely
   STATIC-1 or LAUNCH).

### Scope-creep guardrails

If any of the following surface during execution, Claude Code STOPS
and re-briefs:

- A blog-post requirement that needs schema mutation (new field on
  `blogPost` doc type).
- A blog-post visual element that requires a Tier-1 complex component
  not yet built (per `docs/design/TIER_1_INVENTORY.md` — none of the
  5 Tier-1 components are required by BLOG; if Claude Code thinks one
  IS, that's a signal to re-brief, not improvise).
- A blog-post route conflict with another Sanity collection's
  routing (the `/[category]/[slug]` pattern is broad — see §2 for
  the category-guard).

---

## §1 — Inputs

### §1.1 — Sanity schema (`blogPost` document type)

Locked spec: `MYGRATR_SCHEMA_DESIGN_DECISIONS.md` §3.1.

```
title: string (required, max 160 chars)
slug: slug (required, unique)
category: reference → blogCategory (required)
tags: array[reference → tag] (required, category: blogs)
author: reference → teamMember (required-in-schema; null in ~77% of migrated data per audit — see §1.4)
date: date (required)
thumbnailImage: image (required)
openGraphImage: image (optional)
tldrSection: array[portableText block] (optional)
content: array[portableText block] (required)
resourceDescription: text (optional, max 300 chars)
featured: boolean (default false)
metaTitle: string (required, max 60 chars)
metaDescription: string (required, 140-160 chars)
faqs: array[{question: string, answer: array[portableText]}] (optional, max 6)
source: string enum [manual, beem, claude_code, imported] (default 'manual')
generatedAt: datetime (optional)
needsReview: boolean (default false)
locale: string enum [default, uk] (default 'default')
```

Zod twin: `src/types/sanity/documents/blog-post.ts`. Already imported
in worked example `docs/templates/_examples/v0-prompt-blog.md` §4.

**IMPORT, DO NOT RE-DERIVE.** Claude Code at HALT 1 imports the
existing `BlogPostSchema` from `src/types/sanity/documents/blog-post.ts`.
Do NOT author a fresh Zod schema from the §1.1 field list above. The
field list is documentation of the shape; the Zod twin is the
authoritative TypeScript representation. The Zod twin pulls
`metaTitle` / `metaDescription` / `openGraphImage` via
`.merge(MetaFieldsSchema)`, and `source` / `generatedAt` /
`needsReview` via `.merge(SourceTrackingFieldsSchema)` — those
merges supply fields not visible in the top-level `.extend()` block.

**Runtime nullability vs editorial requirement (CMA F1 v1.3).** The
schema marks `author` as "required" for Studio editorial purposes
(Seb bulk-backfills before LAUNCH per WEBFLOW_TO_SANITY_FIELD_MAP
"MIGRATION BLOCKS"), but ~77% of migrated documents have `author`
absent or null at the time of TEMPLATE-BLOG execution. The runtime
read-model Zod schema MUST tolerate this state:
- `author: TeamMemberSchema.nullable().optional()` at the
  page-fetch validation boundary.
- Studio schema STAYS editorially required (separate concern; do
  NOT relax the Studio side).
- Probe 6 (added v1.3 per CMA F1, see §12.1) verifies real-data
  parse before any code is written.

If the existing Zod export at `src/types/sanity/documents/blog-post.ts`
models `author` as non-nullable, Probe 6 will surface a parse failure
and the schema MUST be updated to nullable-optional at the read-
model layer (the Studio-side editorial requirement is unaffected).

Reference resolution: `category` derefs to `blogCategory.{_id, name, slug}`;
`tags[]` derefs to `tag.{_id, name, slug, category}`; `author` derefs to
`teamMember.{_id, name, slug, position, teamMemberImage, aboutContent,
areasOfExpertise, linkedinLink}`.

### §1.2 — Data state

- **74 `blogPost` documents** in Sanity production dataset
  `lzbhll1u/production` (CONTENT-1C close).
- **Deterministic `_id` format:** `blogPost-{24charHexWebflowId}` per
  CONTENT-1C convention.
- **`metaTitle` + `metaDescription`:** 100% populated (Webflow source
  fields were required; migrated via CONTENT-1C; NOT touched by
  CONTENT-1D backfill because they were already present).
- **`thumbnailImage` + `openGraphImage`:** null literals cleaned in
  CONTENT-1D-CLEANUP. Fields are either populated with real Sanity
  asset refs, or absent (undefined, not null literal).
- **Inline `<img>` in `content`:** uploaded to real Sanity assets via
  CONTENT-1C async two-pass walk. Rendered as `image` blocks inside
  PortableText.
- **Dedup model:** "Blogs & Guides" was canonical master; sub-category
  collections contributed unique-only items. 74 unique slugs across
  the union; each post's `category` ref comes from its OWN Webflow
  `resource-category` field (not the source collection it lived in).

### §1.3 — Design tokens

Source of truth: `site/src/app/tokens.css` (DESIGN-1 Step 1) +
`docs/design/TOKENS.md`. Pasted into v0.dev prompt §1 verbatim from
`docs/V0_PROMPT_TEMPLATE.md`. No token mutation in this phase.

### §1.4 — Primitives

22 primitives + Icon foundation, all under
`site/src/components/ui/{name}/index.tsx`. Folder-per-primitive.

Primitives composed by TEMPLATE-BLOG (confirmed by §5 visual
decomposition):

- **B1 Heading** — page `<h1>` for title; default block renderers
  inside PortableText emit h2/h3/h4.
- **B2 Text** — body copy outside PortableText (metadata strip,
  related-posts card labels, breadcrumbs).
- **B3 PortableText** — renders `tldrSection`, `content`, and FAQ
  answers. Image blocks route through E1 Image.
- **A2 Link** — internal navigation (breadcrumbs, related-post cards,
  category tag, LinkedIn link on author card).
- **A3 Tag** — `tags[]` render as routable category-style chips
  (matches CE's yellow "Recruitment" tag style in screenshot).
- **A4 Card** — related-post cards + author bio card.
- **A5 Accordion** — FAQ section. `type="single" collapsible` per
  COMPONENTS.md composition guideline.
- **E1 Image** — `thumbnailImage` hero, inline content images,
  author photo, related-post thumbnails. Hero gets `priority`; no
  other above-the-fold image sets `priority`.
- **E3 Container** — page-level width constraints. `width="narrow"`
  for body content; `width="default"` for related-posts strip + author
  card.
- **E4 Divider** — between content sections (post body / FAQ / author
  / related posts).

NO primitives requiring `'use client'`: BLOG is a server-component
template. PortableText renders server-side. Author card is static
(LinkedIn link is a plain `<Link>`, no interactivity). Breadcrumbs
are static. Related-posts strip is static. FAQ accordion uses A5
Accordion which is `'use client'` internally — that boundary is
within the primitive, not the template.

### §1.5 — Screenshots / visual reference (Playwright captures from AUDIT-1)

AUDIT-1 ran `scripts/audit/02-screenshot-agent.ts` and captured 44
pages × 3 breakpoints under `audit-output/screenshots/{slug}/{bp}.png`
(gitignored — AUDIT-1 artefacts contain PII).

**Per `audit-output/ce-screenshots.json`:** 30 US captures + 14 UK
captures = 44 total; 1 failure across both locales.

**Pre-flight Probe 1 (Claude Code, §6 HALT 1):** read
`audit-output/ce-screenshots.json` and filter to entries where the
captured URL matches the `/[category]/[slug]` pattern (i.e. live blog
post URLs). Confirm at least 3 representative blog captures exist
across desktop / tablet / mobile breakpoints. If <3, fall through to
Probe 1b.

**Pre-flight Probe 1b (conditional):** re-run
`scripts/audit/02-screenshot-agent.ts` with a BLOG-targeted slug list
(3 representative blogs: 1 with TL;DR, 1 with FAQ, 1 with neither).
Use longer wait timing — `waitUntil: 'networkidle'` PLUS a hard 2-3s
delay after navigation to let any scroll-triggered animations settle.
Save to `audit-output/screenshots-template-blog/`.

**Animation-frame audit (Claude Code, §6 HALT 1):** open each
selected blog capture and visually confirm it is NOT mid-animation
(no half-faded text, no partial opacity, no missing elements that
should be present). If any look mid-animation, re-capture per Probe
1b. Pattern 13 layer 4 (manual-smoke-before-curl-tests) applied to
visual references: defensive verification of defensive output.

**Bundled reference for v0.dev:** the 3-5 chosen captures get
referenced (path-only — gitignored) in the v0.dev prompt §3, plus
the live URLs.

### §1.6 — Field-to-UI map (rendered region → Sanity field)

| UI region | Sanity field | Notes |
|---|---|---|
| Page `<h1>` (post title) | `title` | rendered via `<Heading as="h1">` |
| Breadcrumbs above title | derived from route + `category->name` | `Home / Blog / {Category Name}` |
| Metadata strip (date + author byline) | `date`, `author->name` | byline hidden when `author === null` |
| Hero image | `thumbnailImage` | `priority`; LCP candidate |
| Category tag | `category->name`, links to `/{category->slug}` | routable Tag |
| Topic tags | `tags[]->name`, links to filtered listings (post-launch) | routable Tags; click target deferred |
| TL;DR callout | `tldrSection` | hidden when absent |
| Main body | `content` | PortableText with inline images |
| FAQ accordion | `faqs[]` | hidden when absent |
| Author bio card | `author->{name, position, teamMemberImage, aboutContent, areasOfExpertise, linkedinLink}` | full card; hidden when `author === null` |
| Footer breadcrumbs (matches CE) | derived (mirror of top breadcrumbs) | optional — match live |
| Related posts strip (3) | GROQ side-query (see §3) | per category, newest |
| OG image | `openGraphImage` from MetaFieldsSchema | fallback to brand default |
| `<meta name="description">` | `metaDescription` | required, 140-160 chars |
| `<title>` | `metaTitle` (fallback to `title`) | required, max 60 chars |
| JSON-LD `BlogPosting` | derived from above fields + author + publisher | server-side |
| JSON-LD `BreadcrumbList` | derived from route | server-side |
| JSON-LD `FAQPage` | `faqs[]` if present | server-side, conditional |

### §1.7 — Confirmed inheritance from prior phases

- `<SanityLive />` mounted in root layout (CONVENTIONS Entry 2).
- `<VisualEditing />` mounted conditionally on `draftMode().isEnabled`
  in root layout (CONVENTIONS Entry 3).
- `sanityFetch` from `@/lib/sanity/live` is the single fetch surface.
- Locale helpers at `@/lib/locale`: `generateCanonical`,
  `generateHreflang`, `getLocaleFromPath`, `buildLocalePath`.
- Layout providers (TooltipProvider, ToastProvider) mounted at root.
- `next.config.ts` redirects (12 crawl + 12 regex + 316 Webflow + 4
  locked rules) cover any pre-CONTENT-1C blog URLs.
- UI_STRINGS lint rule enforced (DESIGN-1 Brief B Step 6) — any
  hardcoded English string outside the allow-list fails build.
- `MetaFieldsSchema` (from `src/types/sanity/shared.ts`) contains
  `metaTitle`, `metaDescription`, `openGraphImage` — these supply
  the `blogPost` doc via `.merge(MetaFieldsSchema)` in
  `src/types/sanity/documents/blog-post.ts`. Claude Code verifies
  the exact shape at HALT 1 Probe 0 (added v1.2 per F12) before
  composing the `generateMetadata` and OG fallback chain.

---

## §2 — Routes

### §2.1 — Primary detail route

**File:** `site/src/app/[category]/[slug]/page.tsx`

**Pattern:** `/[category]/[slug]` (two dynamic segments at the root).

**Locked decision:** the dynamic segment lives at the root, not under
`/blog/`. This preserves CE's existing URL structure 1:1 (§7.4 slug
preservation). 74 live URLs already exist in this shape; changing it
would force 74 redirects and forfeit SEO equity.

### §2.2 — Category-guard

The route pattern `/[category]/[slug]` is broad — it would match ANY
two-segment path including non-blog routes (`/services/foo`,
`/technology/foo`, `/team/foo`, etc.) if those template phases used
the same pattern. **They don't** — per
`MYGRATR_SCHEMA_DESIGN_DECISIONS.md` §10, each non-blog Tier-1 type
has its own explicit prefix (`/services/[slug]`, `/technology/[slug]`,
etc.). Those explicit prefixes win Next.js App Router precedence over
the broad `[category]` segment.

**However:** the broad pattern still matches anything not claimed by
an explicit prefix. A request to `/foo/bar` where `foo` is not a real
category would otherwise dispatch into this route file.

**Single guard at GROQ level (CMA F11 v1.3).** The page-fetch query
filters `category->slug.current == $category` (see §3.1). This rejects:
- invalid category slugs;
- invalid post slugs;
- mismatched (category, slug) pairs.

All three cases return `null` from the GROQ → `notFound()` dispatch.
**No separate runtime allow-list check is required for correctness.**

(The earlier v1.0-v1.2 brief specified a belt-and-braces runtime
list check; CMA F11 correctly identified that as logically redundant
since both checks call the same `notFound()`. The check is removed
to simplify the implementation. If observability across "bad
category" vs "bad slug" becomes useful for analytics, add structured
logging instead — not a separate guard.)

`generateStaticParams` pre-builds only the valid (category, slug)
pairs that exist as `blogPost` docs. Off-list paths get `notFound()`
at runtime via the GROQ filter (important for ISR / on-demand
revalidation cases where a doc could be created between builds).

### §2.3 — UK locale mirror

**File:** `site/src/app/uk/[category]/[slug]/page.tsx`

**Implementation:** a thin wrapper that imports the default route's
component and passes `locale: 'uk'` through. Same render output, same
data, hreflang emits both URLs.

Per `MYGRATR_SCHEMA_DESIGN_DECISIONS.md` §7.11: single-document locale
strategy. Per CE_SITE_TRUTH §7: every blog has `localeStrategy =
single-document`, `ukOverrideFields = []`. 31 of 31 master-collection
blogs have `draftInUk = 31` — meaning ALL are currently unpublished in
the UK Webflow context. Post-launch MYGRATR-LOCALE-1 phase decides
what to do with that signal. For TEMPLATE-BLOG: render the same
document for both locales.

### §2.4 — Route-file structure

```
site/src/app/
  [category]/
    [slug]/
      page.tsx                # default locale
  uk/
    [...slug]/
      page.tsx                # EXISTING SCAFFOLD-1 catch-all (404 for non-2-segment UK paths)
    [category]/
      [slug]/
        page.tsx              # NEW: UK locale 2-segment route (thin wrapper)
```

The route component itself lives at
`site/src/components/templates/blog/index.tsx` (server async
component) and is imported by both `page.tsx` files.

**Existing `/uk/[...slug]/page.tsx` catch-all is PRESERVED.**
SCAFFOLD-1 shipped this catch-all per FEATURE_MAP — it 404s for any
UK path not explicitly matched by a sibling route file. The new
`/uk/[category]/[slug]/page.tsx` route is more specific (2 segments
exactly) than the catch-all (1+ segments) — Next.js App Router
precedence rules guarantee the 2-segment route wins for 2-segment
paths under `/uk/`. Other-segment-count UK paths (e.g. `/uk/about`)
still fall into the catch-all 404 until their template phase lands.

**Probe 5 verification (HALT 1):** after route files are scaffolded,
curl-test 4 UK paths:
- `/uk/staff-augmentation/what-is-staff-augmentation` (real blog) → 200
- `/uk/staff-augmentation` (1 segment — category-only, falls into catch-all) → 404
- `/uk/about` (1 segment, not a category) → 404 (catch-all)
- `/uk/nonsense-category/nonsense-slug` (2 segments, invalid category) → 404 (category guard)

If any of these fire the wrong route handler, Next.js routing
precedence assumptions are wrong and the brief halts.

### §2.5 — `generateStaticParams`

Each route file ships its own `generateStaticParams` returning 74
paths. Two routes (default + UK) = **148 paths pre-built** at build
time. ISR refreshes on Sanity webhook (post-launch concern).

**Full implementation per §3.5** — GROQ query, broken-ref filter,
TS narrowing, count assertion. `sanityClient` from `@/lib/sanity/client`
is the build-time fetch surface; `sanityFetch` is for runtime
Visual Editing context only (CMA F5 v1.3 hard rule §3.2a).

Both route files share the same query and produce the same params.
Locale mirror is at the route file level — `generateStaticParams`
itself doesn't know about locale.

---

## §3 — Sanity Query Design

### §3.1 — Page-render GROQ

```groq
*[_type == "blogPost"
  && slug.current == $slug
  && category->slug.current == $category
][0]{
  _id,
  _type,
  title,
  "slug": slug.current,
  date,
  thumbnailImage,
  openGraphImage,
  tldrSection,
  content,
  faqs,
  resourceDescription,
  featured,
  locale,
  metaTitle,
  metaDescription,
  category->{ _id, name, "slug": slug.current },
  tags[]->{ _id, name, "slug": slug.current, category },
  author->{
    _id,
    name,
    "slug": slug.current,
    position,
    teamMemberImage,
    aboutContent,
    areasOfExpertise,
    linkedinLink
  }
}
```

**Params:** `$slug` (post slug), `$category` (category slug from route).

**Locale filter REMOVED (CMA F3 + F7 v1.3).** The single-document
mirror strategy (§7.11, §8) means every blog doc serves at BOTH
locale paths regardless of stored `locale` field. Filtering by
`locale == $locale` in the page query would cause the UK route to
return null for every doc not explicitly stored as `locale: 'uk'`
— a 100% 404 rate on the UK mirror. The `locale` filter is dropped
entirely until a future LOCALE-1 phase introduces locale-split
content with a deliberate data migration.

Locale is derived from the **route path** alone for canonical URL,
hreflang, and metadata rendering — never from the doc.

**Category filter at query level:** by filtering
`category->slug.current == $category` inside the GROQ, the query
naturally returns null when:
- the category slug doesn't exist in the `blogCategory` collection;
- the slug doesn't exist in the `blogPost` collection;
- the (category, slug) pair is mismatched (post belongs to a
  different category than the URL claims).

**`notFound()` when result is null** — covers all four cases above.

**`_id` projection on `category`, `tags[]`, and `author` is MANDATORY
(CMA F2 v1.3).** The related-posts side-query (§3.3) joins on
`category._id` from this projection. Without `_id`, related-posts
silently returns 0 cards on every page.

### §3.2 — Fetch invocation (CONVENTIONS Entry 2 compliance)

```ts
// site/src/app/[category]/[slug]/page.tsx
import { sanityFetch } from '@/lib/sanity/live'
import { BLOG_POST_QUERY } from '@/lib/sanity/queries/blog-post'

const { data: post } = await sanityFetch({
  query: BLOG_POST_QUERY,
  params: { slug, category },  // CMA F3 v1.3: no locale param
})
```

**Single client through `defineLive`** per CONVENTIONS Entry 2.
Server-only by design. Visual Editing wires automatically — no
separate draft-perspective fetch. Locale is derived from the route
path in `generateMetadata` only — NOT passed to the page-fetch query.

### §3.2a — Visual Editing draft-mode hookup

Per CONVENTIONS Entry 3 §"Layout integration": `<VisualEditing />` is
rendered in root layout when `(await draftMode()).isEnabled`.
`sanityFetch` reads draft perspective automatically when draft mode
is enabled (single-client architecture per CMA-C2 / D4).

**No per-template draft-mode plumbing required.** The template fetch
is identical whether published or draft; the architecture handles
the perspective switch upstream.

**HARD RULE (CMA F5 v1.3) — perspective is handled ONLY upstream:**

1. Route and template files MUST use `import { sanityFetch } from
   '@/lib/sanity/live'` exclusively for page data reads.
2. NEVER pass `perspective` from template code, route params, search
   params, or props.
3. NEVER import `sanityClient` from `@/lib/sanity/client` into
   route or template files for page-data fetching (build-time
   `generateStaticParams` is the only exception per §2.5).
4. The string literal `'previewDrafts'` MUST NOT appear in any
   file under `site/src/app/` or `site/src/components/templates/`.
5. The template MUST NOT branch on draft mode itself — draft state
   is invisible to the template render layer by design.

These rules carry forward to every TEMPLATE-* phase via
CONVENTIONS.md update (HALT 3 deliverable).

**`stega.enabled` is gated** per CONVENTIONS Entry 2: stega
encoding only happens when `SANITY_STEGA_ENABLED === '1' &&
VERCEL_ENV !== 'production'` OR `VERCEL_ENV === 'preview'`. Click-to-
edit overlays render only in those contexts.

### §3.3 — Related-posts side-query

```groq
*[_type == "blogPost"
  && category->_id == $categoryId
  && slug.current != $currentSlug
] | order(date desc) [0...3] {
  _id,
  title,
  "slug": slug.current,
  date,
  thumbnailImage,
  resourceDescription,
  category->{ _id, name, "slug": slug.current }
}
```

**Params:** `$categoryId` (sourced from the page-fetch result's
`post.category._id` per CMA F2 v1.3), `$currentSlug`.

**`_id` not `_ref` (CMA F2 v1.3).** The page-fetch query dereferences
`category` to `category->{ _id, name, "slug": slug.current }`,
replacing the raw reference object with the target's fields. After
dereference, `category._ref` no longer exists — only `category._id`.
Filtering `category->_id == $categoryId` follows the same deref-and-
compare pattern used on the page query for consistency.

**Locale filter dropped (CMA F3 v1.3).** Same reasoning as §3.1:
single-document mirror strategy. Related posts surface from the same
pool regardless of which locale URL is rendering. If LOCALE-1
splits a doc later, the related-posts query naturally returns the
default-locale sibling; that's correct behaviour for a mirror page.

**Returns:** up to 3 posts. Order: newest first. Excludes current post.
Same category only.

**Edge case:** if the post's category has only 1-2 blog posts total
(some sub-categories have 3-7 items per CE_SITE_TRUTH), return whatever
exists. UI must handle 0/1/2/3 cards gracefully:
- 0 cards → entire "More articles on {Category}..." section collapses
  (no empty heading shell).
- 1-2 cards → render in a CSS Grid that grows responsive columns
  WITHOUT empty placeholder slots (CMA F12 v1.3 — `auto-fit` and
  fixed `grid-cols-3` are not equivalent; see §5.5 for the locked
  grid spec).

### §3.4 — Category-list query (optional — observability only)

```groq
*[_type == "blogCategory"] { "slug": slug.current }
```

Returns the 6 valid category slugs. Per CMA F11 v1.3, this query is
NOT required for correctness — the GROQ filter at §3.1 already
rejects invalid categories with `notFound()`. The category-list
query remains available for observability purposes (e.g.,
distinguishing "bad category" from "bad slug" in structured logging
at error.tsx boundary) but is not invoked in the happy path.

### §3.5 — `generateStaticParams` query

```groq
*[_type == "blogPost"
  && defined(slug.current)
  && defined(category->slug.current)
]{
  "slug": slug.current,
  "category": category->slug.current
}
```

**`defined()` guard at GROQ level (CMA F6 v1.3).** Without the guard,
any blogPost with a broken or missing `category` reference would
emit params like `{ category: null, slug: "..." }` — silently
generating malformed routes. The §13 halt trigger #8 checks raw
count only; broken refs would slip past it. The GROQ guard
combined with the TS narrowing below catches both cases.

**TS narrowing in `generateStaticParams`:**

```ts
import { sanityClient } from '@/lib/sanity/client'

type RawPair = { slug: string | null; category: string | null }

export async function generateStaticParams() {
  const rawPairs = await sanityClient.fetch<RawPair[]>(GENERATE_STATIC_PARAMS_QUERY)
  const pairs = rawPairs.filter(
    (p): p is { slug: string; category: string } => !!p.slug && !!p.category
  )
  if (pairs.length < 74) {
    console.error(
      `[TEMPLATE-BLOG] generateStaticParams: ${pairs.length} routable paths (expected 74)`
    )
  }
  return pairs.map(p => ({ category: p.category, slug: p.slug }))
}
```

**Locale handling at route level, not GROQ.** Single-document mirror
strategy: both `/[category]/[slug]` and `/uk/[category]/[slug]`
routes return the SAME 74 (category, slug) pairs from their
respective `generateStaticParams`. The Sanity `locale` field is NOT
consulted at static-param enumeration time.

`sanityFetch` from `@/lib/sanity/live` is for runtime requests in
Visual Editing context (CONVENTIONS Entry 2). Build-time enumeration
uses the bare `sanityClient` directly — single-client architecture,
just without the `defineLive` runtime wrapper.

**Probe 7 (added v1.3 per CMA F6, see §12.1):** before route file
authoring, count blogPosts with broken category refs and halt if
any exist. Surfaces data-state issues that would silently drop
routes from the build manifest.

### §3.6 — Zod validation at fetch boundary

Per CONVENTIONS Entry 2 patterns established earlier:
- Page-fetch result validated against `BlogPostSchema` from
  `src/types/sanity/documents/blog-post.ts`. Throw on parse fail —
  surfaces schema drift loudly.
- Related-posts query result validated against a narrow Zod schema
  defined locally (only the projected fields).
- Validation runs at fetch boundary; downstream rendering code can
  assume valid data shape.

### §3.7 — GROQ injection discipline (CMA F15 v1.3)

GROQ injection is possible if route segments (`$slug`, `$category`)
are concatenated into query strings rather than passed as
parameterized values. **HARD RULE — parameterized GROQ only:**

1. ALL GROQ queries use `$paramName` placeholders + a `params` object
   passed to `sanityFetch` / `sanityClient.fetch`.
2. NEVER build GROQ with template literals containing route values:
   ```ts
   // FORBIDDEN
   const q = `*[_type == "blogPost" && slug.current == "${slug}"][0]`
   // CORRECT
   const q = `*[_type == "blogPost" && slug.current == $slug][0]`
   sanityFetch({ query: q, params: { slug } })
   ```
3. Slug regex hardening at the route boundary is OPTIONAL
   defense-in-depth (Next.js dynamic segments already exclude `/`
   from segment values), but parameterization is the load-bearing
   protection — not optional.

This rule carries forward to every TEMPLATE-* phase via
CONVENTIONS.md update (HALT 3 deliverable).

---

## §4 — Metadata + SEO Surface

### §4.1 — `generateMetadata()`

```ts
export async function generateMetadata({ params }): Promise<Metadata> {
  const { slug, category } = await params
  const { data: post } = await sanityFetch({
    query: BLOG_POST_META_QUERY,
    params: { slug, category },  // CMA F3 v1.3: no locale param
  })

  if (!post) return {}  // 404 page handles missing

  const localeAtRoute: Locale = 'en-US'  // OR 'en-GB' in /uk route
  const canonical = generateCanonical(`/${category}/${slug}`, localeAtRoute)
  const hreflang = generateHreflang(`/${category}/${slug}`)

  // CMA F8 v1.3: urlFor() safety — never pass undefined
  const ogSource = post.openGraphImage ?? post.thumbnailImage
  const ogUrl = ogSource ? urlFor(ogSource).width(1200).url() : '/og-default.png'

  return {
    title: post.metaTitle,
    description: post.metaDescription,
    alternates: { canonical, languages: hreflang },
    openGraph: {
      title: post.metaTitle,
      description: post.metaDescription,
      url: canonical,
      type: 'article',
      images: [ogUrl],
    },
  }
}
```

**Trimmed meta query.** Pulls only `metaTitle`, `metaDescription`,
`openGraphImage`, `thumbnailImage` (the last as OG fallback per
§4.8). Smaller payload than the full page query.

**Note on request deduplication (CMA F9 v1.3).** Earlier versions
of this brief claimed Next.js dedupes the fetch between
`generateMetadata` and the page component when params match. The
two queries differ (meta query is trimmed; page query is full) so
the dedupe claim does NOT apply. Treat these as two intentional
fetches — server-component-level caching still provides reasonable
performance and the architectural simplicity is worth it. Do NOT
architect around an optimization that the implementation doesn't
actually provide.

### §4.2 — Canonical URL

Generated via `@/lib/locale.generateCanonical()`. For default locale:
`https://cloudemployee.io/{category}/{slug}`. For UK locale:
`https://cloudemployee.io/uk/{category}/{slug}`.

`NEXT_PUBLIC_SITE_URL` is the source; per CONVENTIONS Entry 4 it's
`z.string().url()` strict at validation time.

### §4.3 — Hreflang

Three entries per page: `en-US` (default locale URL), `en-GB` (UK
locale URL), `x-default` (default locale URL). Generated via
`@/lib/locale.generateHreflang()`. Server-side render — no JavaScript
injection.

**Locale-code rationale:** `en-US` is the bare-`en` alternative. Per
CONVENTIONS §"Locale Routing for the Generated Site", the locale
module ships `LOCALES = ['en-US', 'en-GB']` — TEMPLATE-BLOG does NOT
modify the helper. Brief defers to the existing helper's output.

### §4.4 — JSON-LD: `BlogPosting`

Server-rendered inside a `<script type="application/ld+json">` block
in the template. NOT injected client-side. **MUST be authored via
the XSS-safe pattern at §4.6a** — never via template-literal
interpolation of Sanity-authored values.

Shape (build as a plain JS object, then serialize):

```jsonc
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "@id": "{canonical}#blogposting",
  "headline": "{post.title}",
  "description": "{post.metaDescription}",
  "image": "{post.thumbnailImage urlFor 1200x630}",
  "datePublished": "{post.date in ISO 8601}",
  "dateModified": "{post.date — no separate dateModified field per schema}",
  "mainEntityOfPage": { "@type": "WebPage", "@id": "{canonical}" },
  "author": [author block — see §4.4a],
  "publisher": {
    "@type": "Organization",
    "name": "Cloud Employee",
    "url": "https://cloudemployee.io",
    "logo": { "@type": "ImageObject", "url": "{siteSettings.logo url}" }
  }
}
```

**Note on `dateModified`:** the `blogPost` schema has `date` only, no
separate `dateModified` field. JSON-LD emits `datePublished` =
`dateModified` = `post.date` for now. If Seb wants distinct modified
dates post-launch, add a schema field then.

### §4.4a — Author block (conditional)

When `author` is populated:
```jsonc
"author": [{
  "@type": "Person",
  "name": "{author.name}",
  "url": "https://cloudemployee.io/team/{author.slug}",
  "sameAs": ["{author.linkedinLink}"]  // only if populated
}]
```

When `author` is null:
```jsonc
"author": [{
  "@type": "Organization",
  "name": "Cloud Employee",
  "url": "https://cloudemployee.io"
}]
```

Schema.org allows either Person or Organization as `author`. The
fallback to Organization satisfies validators when 77% of posts
currently lack a Person author. Post-Seb-backfill, all posts will
have Person authors.

### §4.5 — JSON-LD: `BreadcrumbList`

Always emitted. Three levels:

```jsonc
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "{canonical-home}" },
    { "@type": "ListItem", "position": 2, "name": "Blog", "item": "{canonical-blog-hub}" },
    { "@type": "ListItem", "position": 3, "name": "{category.name}", "item": "{canonical-category-hub}" }
  ]
}
```

Note position 2 references `/blog` which is the blogHub singleton —
that route doesn't exist yet at TEMPLATE-BLOG time (it's STATIC-1 or
TEMPLATE-BLOG-HUB scope). The breadcrumb link still works (Next.js
will 404 until that route lands, but the URL structure is correct
and JSON-LD validates). Acceptable.

### §4.6 — JSON-LD: `FAQPage` (conditional)

Emitted only when `faqs` is non-empty. **`Array.isArray(post.faqs)
&& post.faqs.length > 0` is the predicate (CMA F10 v1.3) — never a
bare truthy check, since `[]` is truthy in JavaScript and would emit
`{ "@type": "FAQPage", "mainEntity": [] }`, a Search Console
warning.**

Use the SAME predicate at the FAQ accordion render site (§5.2) and
the FAQPage JSON-LD emission. Define it once:

```ts
const hasFaqs = Array.isArray(post.faqs) && post.faqs.length > 0
```

Shape:

```jsonc
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "{faq.question}",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "{PortableText rendered to plaintext}"
      }
    }
    // ... up to 6
  ]
}
```

PortableText→plaintext conversion: use `@portabletext/toolkit`'s
`toPlainText` helper (already a transitive dep of `@portabletext/react`).

### §4.6a — XSS-safe JSON-LD rendering (CMA F4 v1.3)

**MANDATORY pattern for all three JSON-LD blocks** (`BlogPosting`,
`BreadcrumbList`, `FAQPage`). Sanity-authored values can contain
`</script>` or similar control sequences that would terminate the
script tag early and allow arbitrary HTML/JS injection into the
rendered page. This is a real XSS vector sourced from CMS content.

**Pattern:**

```tsx
// site/src/components/templates/blog/json-ld.tsx (or co-located helper)
function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

// In the template:
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: serializeJsonLd(blogPostingObject) }}
/>
```

**Never:**

```tsx
// FORBIDDEN — template-literal interpolation of CMS values
<script type="application/ld+json">
  {`{ "headline": "${post.title}", ... }`}
</script>
```

The Next.js 16 `<Script>` component used at build time still
renders inline JSON-LD as raw HTML; the serialization layer is
what protects against script-tag breakout. The `\\u003c` /
`\\u003e` escapes neutralize any `</script>` inside CMS strings;
the `\u2028` / `\u2029` escapes neutralize JS-only line
terminators that could break JSON.parse on some clients.

**Apply the helper to ALL THREE emission sites uniformly.** No
exceptions for "safe" fields — Sanity is the authoring layer and
ANY field is in scope for a malicious or accidental `</script>`.

### §4.7 — Robots / indexing

Default `<meta name="robots">` is `index, follow` — Next.js default.
No per-page robot override needed for blog posts.

`/uk/[category]/[slug]` is also indexed and follows the same default.

### §4.8 — OpenGraph image fallback chain

Per CMA F8 v1.3, the fallback chain MUST be builder-safe — never
call `urlFor(undefined)` at any site.

```ts
const ogSource = post.openGraphImage ?? post.thumbnailImage
const ogUrl = ogSource ? urlFor(ogSource).width(1200).url() : '/og-default.png'
```

Resolution order:

1. `post.openGraphImage` if populated (full-width OG asset from
   `MetaFieldsSchema`).
2. `post.thumbnailImage` if `openGraphImage` is absent (renders
   square — acceptable fallback per E1 Image's responsive handling).
3. `/og-default.png` brand fallback if both are absent (matches
   SCAFFOLD-1 pattern).

**CONTENT-1D-CLEANUP removed null literals**, so image fields are
either populated with Sanity asset refs or absent (`undefined`). The
`??` nullish-coalescing chain above handles `undefined` correctly;
do NOT use `||` (which would also fall through on empty objects).

**Probe 8 (added v1.3 per CMA F8, see §12.1):** sample 3-5 docs
where `openGraphImage` is absent. Verify the fallback chain
executes without throwing.

---

## §5 — Template Visual Decomposition (Fold-by-Fold)

> **Note on visual reference:** §1.5 Playwright captures provide the
> source-of-truth visuals. The decomposition below references the
> live-site state as observed in the screenshot Jake captured for
> `/staff-augmentation/what-is-staff-augmentation` (May 2026 session)
> plus the AUDIT-1 captures. Discrepancies between this
> decomposition and the captures are resolved in favour of the
> captures.

> **Note on TSX shape correctness:** the TSX in §5.1–§5.5 is
> illustrative pseudocode showing composition shape, NOT a literal
> spec. Claude Code at HALT 2 verifies every primitive prop and
> variant against `docs/design/COMPONENTS.md` before authoring. In
> particular: Text sizes are `body / body-sm / lead / large`;
> Heading sizes are `h1 / h2 / h4 / eyebrow / display`; Tag tones
> are `default / cc-blue`; Card tones are `default / muted`.
> Variant names in this brief that don't match the inventory must
> be replaced with the correct variant (silently — no escalation
> needed unless the desired visual outcome cannot be expressed via
> any existing variant, in which case halt + escalate).

### §5.1 — Top fold (above-the-fold, desktop ~900px first viewport)

**Order top to bottom:**

1. Site nav (inherited from root layout — NOT in template scope).
2. Breadcrumb strip: `Home / Blog / {Category Name}`.
3. Post title (h1).
4. Metadata strip: published date + author byline (when present).
5. Hero image (`thumbnailImage`).

**Composition:**

```tsx
<article>
  <Container width="default">
    <Breadcrumbs items={[
      { name: 'Home', href: '/' },
      { name: 'Blog', href: '/blog' },
      { name: post.category.name, href: `/${post.category.slug}` },
    ]} />
    <Heading as="h1" size="h1">{post.title}</Heading>
    <div className="metadata-strip">
      <Text size="body-sm">{formatDate(post.date)}</Text>
      {post.author && (
        <Text size="body-sm">By {post.author.name}</Text>
      )}
    </div>
    <Image
      source={post.thumbnailImage}
      alt={post.title}
      priority
      sizes="(min-width:768px) 70vw, 100vw"
    />
  </Container>
```

**LCP target:** `thumbnailImage` with `priority`. No other above-the-
fold image sets `priority`.

### §5.2 — Body fold

**Order:**

1. TL;DR callout (conditional on `tldrSection`).
2. Category tag (clickable link to category hub).
3. Topic tags row (clickable links — destination deferred to post-
   launch tag-filter feature).
4. Main content (PortableText).
5. Inline images (rendered by PortableText `image` block renderer).
6. Inline FAQ section (Accordion, conditional on `faqs`).

```tsx
  <Container width="narrow">
    {post.tldrSection && post.tldrSection.length > 0 && (
      <aside className="tldr-callout">
        <Heading as="h2" size="h4">TL;DR</Heading>
        <PortableText value={post.tldrSection} />
      </aside>
    )}

    <div className="tag-row">
      <Tag href={`/${post.category.slug}`}>{post.category.name}</Tag>
      {post.tags.map((tag) => (
        <Tag key={tag._id}>{tag.name}</Tag>
      ))}
    </div>

    <PortableText value={post.content} />

    {/* CMA F10 v1.3: hasFaqs predicate — never bare truthy check */}
    {hasFaqs && (
      <section>
        <Heading as="h2">FAQs</Heading>
        <Accordion type="single" collapsible>
          {post.faqs.map((faq, idx) => (
            <AccordionItem key={faq._key ?? idx} value={faq._key ?? `faq-${idx}`}>
              <AccordionTrigger>{faq.question}</AccordionTrigger>
              <AccordionContent>
                <PortableText value={faq.answer} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    )}
  </Container>
```

**Tag rendering rules:**

- **Category tag** (single, in the tag row): ROUTABLE via `<Tag
  href={`/${post.category.slug}`}>`. Links to the category hub
  (which renders 404 until STATIC-1 / TEMPLATE-BLOG-HUB lands —
  acceptable, forward-compatible).
- **Topic tags** (one or more, after the category tag): DECORATIVE
  via `<Tag>` (no `href`). Renders as `<span>` per A3 Tag's
  discriminated-union default. The Sanity tag data is preserved
  for the post-launch tag-filter feature; rendering is upgradeable.

In CE's live site (May 2026 audit), all visible tags appear
decorative — the yellow "Recruitment" tag in Jake's reference
screenshot is not a link. The brief preserves this behaviour for
topic tags and upgrades the category tag to routable for SEO/IA
benefit (per A3 Tag's "Migration improvement vs CE" note in
COMPONENTS.md — routable mode is supported precisely for this).

### §5.3 — Author bio card

**Conditional on `author !== null`.** When present, full card matching
the screenshot:

```tsx
  <Container width="default">
    <Divider />
    {post.author && (
      <Card as="aside" className="author-card">
        <CardHeader>
          <Image source={post.author.teamMemberImage} alt={post.author.name} />
        </CardHeader>
        <CardContent>
          <Heading as="h3" size="h4">{post.author.name}</Heading>
          <Text size="body-sm">{post.author.position}</Text>
          <Heading as="h4" size="eyebrow">About</Heading>
          {post.author.aboutContent && (
            <PortableText value={post.author.aboutContent} />
          )}
          {post.author.areasOfExpertise && (
            <>
              <Heading as="h4" size="eyebrow">Areas of Expertise</Heading>
              <div className="expertise-tags">
                {/* PortableText with custom render rule for inline tag list,
                    OR if aboutContent stores tags as a plain string array,
                    map directly. Confirm shape during Probe 3b. */}
                <PortableText value={post.author.areasOfExpertise} />
              </div>
            </>
          )}
          {post.author.linkedinLink && (
            <Link href={post.author.linkedinLink} external>
              Read more <Icon name="linkedin" size="sm" />
            </Link>
          )}
        </CardContent>
      </Card>
    )}
  </Container>
```

**LinkedIn link safety (CMA F14 v1.3).** The `external` prop on A2
Link MUST apply `rel="noopener noreferrer"` and `target="_blank"`
when set, per COMPONENTS.md A2 spec. Probe 9 (added v1.3, see
§12.1) verifies the primitive's emitted HTML at Storybook before
template authoring. If A2 Link does NOT consistently emit the safe
rel attribute, fix the primitive once — every external-link call
site benefits, including author cards across all detail templates.

**Open shape question (Probe 3b):** `areasOfExpertise` is `PortableText`
in schema, but the screenshot shows them as inline pill tags. Need to
verify how the migration shaped this field — is it a flat list, or
PortableText with inline `<span>` styling? Probe 3b at §12.1 HALT 1
inspects the Sanity data shape and decides whether a custom
PortableText render rule is needed, or whether the data is plain
enough to map directly.

### §5.4 — Bottom-fold breadcrumbs (mirror)

Per the screenshot, CE renders a second breadcrumb strip BELOW the
content body and ABOVE the related-posts strip. Mirror it:

```tsx
  <Container width="default">
    <Breadcrumbs items={[
      { name: 'Home', href: '/' },
      { name: 'Blog', href: '/blog' },
      { name: post.category.name, href: `/${post.category.slug}` },
    ]} />
  </Container>
```

Decorative breadcrumb mirror — does NOT emit a second `BreadcrumbList`
JSON-LD (one is sufficient).

### §5.5 — Related-posts strip

**Section heading:** "More articles on {Category Name}..." per the
screenshot.

**Grid spec (CMA F12 v1.3 — locked):**

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

Behaviour:
- **3 results** → fill the row at lg breakpoint (1 / 2 / 3 cards
  across mobile / tablet / desktop).
- **2 results** → occupy the first two columns at lg; second column
  empty (no placeholder card).
- **1 result** → occupies the first column at lg; second + third
  columns empty (no placeholder cards).
- **0 results** → entire section collapses including the heading
  (handled at the conditional render at section root, see below).

Do NOT use `auto-fit` + `minmax()` — it stretches 1 or 2 cards to
fill the row width, which doesn't match CE's existing 3-column
layout pattern.

```tsx
{relatedPosts.length > 0 && (
  <Container width="default">
    <Heading as="h2">
      More articles on {post.category.name}...
    </Heading>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {relatedPosts.map((relPost) => (
        <Card as="article" key={relPost._id}>
          <CardHeader bleed>
            <Image
              source={relPost.thumbnailImage}
              alt=""
              fill
              sizes="(min-width:768px) 33vw, 100vw"
            />
          </CardHeader>
          <CardContent>
            <Tag>{relPost.category.name}</Tag>
            <Heading as="h3" size="h4">{relPost.title}</Heading>
            <Link href={localePath(`/${relPost.category.slug}/${relPost.slug}`)}>
              Read more <Icon name="chevron-right" size="sm" />
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  </Container>
)}
```

**Heading copy "More articles on {Category}…":** this is a UI string
that interpolates with Sanity data. The static portion ("More
articles on" + "...") is a UI_STRINGS lint concern.

**Two paths for UI_STRINGS compliance:**
- **A.** Add `MORE_ARTICLES_ON` key to `tools/eslint/ui-strings.json`
  with format like `"More articles on {category}..."` and a
  template function in the template that interpolates. Re-generate
  `ui-strings.ts`. Idiomatic.
- **B.** Allow this specific composition inline via
  `eslint-disable-next-line` and document it as a known exception.

**Decision: A.** Stays compliant. Add the key; regenerate.

### §5.6 — Footer CTA (inherited from root layout — NOT in template scope)

The "Ready to hire your next engineer?" footer CTA in the screenshot
is a global site component, not blog-specific. Inherited from root
layout / nav-footer phase, not implemented here.

### §5.7 — Mobile breakpoint considerations

Per design tokens (`docs/design/TOKENS.md`) breakpoints: mobile-first
default, `md:` at ≥768px, `lg:` at ≥992px.

**Mobile layout differences from desktop:**

- Hero image: full-width, no side margin.
- Body container: `width="narrow"` already constrains to readable
  line length.
- Author card: stacks photo above content (photo no longer on side).
- Related posts: 1 column → 2 → 3 across breakpoints
  (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`).
- Breadcrumbs: smaller font; may need horizontal scroll on very long
  category names (low-priority polish).
- FAQ accordion: full width; tap-target sizing per A5 spec.

### §5.8 — Loading / error / empty states

- **Loading state:** Next.js streaming + suspense boundaries. No
  custom loading.tsx needed for static-generation case (pages
  pre-built). For draft-mode case where revalidation can lag, the
  brief block-level skeleton in B3 PortableText covers in-flight
  data.
- **Error state:** Next.js error.tsx at the route level catches
  unexpected fetch failures. Default Next.js error UI is acceptable
  for this phase; brand customization is post-launch.
- **`notFound()` state:** dispatched from the page component when:
  - Category not in valid-list.
  - Post not found at (category, slug, locale).
  - Standard Next.js `app/not-found.tsx` (already scaffolded at
    SCAFFOLD-1) handles rendering.

---

## §6 — Visual Generation Path (Claude-Code-First, v0.dev Fallback)

**Default path:** Claude Code authors the visual template directly.
v0.dev is a fallback used only when Claude Code's first attempt
materially misses the brand presentation (sub-90% visual fidelity per
§11.3 acceptance criteria).

**Rationale:** BLOG is the simplest template type — no animations, no
scroll triggers, no Tier-1 complex components, no GSAP. The template
is typography + images + an accordion + cards. Claude Code authoring
the visual directly, with the AUDIT-1 Playwright captures as visual
reference and the design-system primitives as composition vocabulary,
should land high-fidelity in one pass. Routing v0.dev through this
loop adds one round-trip without a clear quality benefit on a
template this simple.

**v0.dev preserved as fallback** for templates where Claude Code's
visual output proves insufficient. The v0.dev prompt assets
(`docs/V0_PROMPT_TEMPLATE.md` + worked example
`docs/templates/_examples/v0-prompt-blog.md`) remain intact and
ready to invoke. This brief does not delete them.

### §6.1 — HALT 2 decision point (Claude-Code-first attempt review)

After Claude Code's first visual pass at HALT 2:

1. **Visual review at HALT 2 §12.2 smoke test.** Jake opens 3 sample
   blog URLs in browser. Visual side-by-side comparison against
   AUDIT-1 captures + the live site.
2. **Decision criteria:**
   - **≥ 90% fidelity:** ship Claude Code's output. Iterate inline
     for the remaining polish (specific spacing, font weight, color
     adjustments) via direct chat with Claude Code. No v0.dev needed.
     This is the expected path.
   - **70-89% fidelity:** specific elements are off but the overall
     structure is correct. Iterate inline with Claude Code on the
     broken elements. Still no v0.dev. If 2-3 inline iterations
     don't resolve a specific element, fall through to v0.dev for
     that element only.
   - **< 70% fidelity:** structural problem with Claude Code's
     output. Fall through to v0.dev for a fresh visual pass.

3. **Either outcome closes HALT 2** — the visual is integrated and
   the manual smoke passes. Path taken is logged in the HALT 2
   commit message.

### §6.2 — Claude-Code-first authoring inputs

Claude Code authors `site/src/components/templates/blog/index.tsx`
against:

- **Visual reference:** Playwright captures selected at Probe 1
  (§1.5) — desktop / tablet / mobile.
- **Field-to-UI map:** §1.6 of this brief.
- **Visual decomposition:** §5 of this brief (the TSX-shape sketches
  are pseudocode, not literal — Claude Code adjusts for actual data
  shapes from Probes 3a + 3b).
- **Design tokens:** `site/src/app/tokens.css` + `docs/design/TOKENS.md`.
- **Primitive inventory:** `docs/design/COMPONENTS.md`.
- **Composition patterns:** §5 of this brief (Card composition,
  Heading-eyebrow, FAQ accordion patterns).
- **Constraint set:** same constraints as v0.dev prompt §5 —
  Tailwind classes only, no inline styles, no third-party UI libs,
  semantic landmarks, focus-visible rings, locale-aware URL
  prefixing, UI_STRINGS-compliant strings, server-component default.

### §6.3 — v0.dev fallback workflow (if invoked at HALT 2)

If §6.1 decision criteria say "fall through to v0.dev":

1. **Claude Code prepares the v0.dev prompt.** Uses
   `docs/V0_PROMPT_TEMPLATE.md` + worked example
   `docs/templates/_examples/v0-prompt-blog.md`. Applies the §6.4
   amendments. Outputs the completed prompt text in the terminal.
2. **Jake copies the prompt.** From the terminal output.
3. **Jake pastes into v0.dev** at https://v0.dev. New chat.
4. **v0.dev generates.** Jake iterates with v0.dev directly ("make
   the hero bigger", "tighten the spacing", "match this screenshot")
   until output looks right.
5. **Jake copies v0.dev's component code.** Pastes back into the
   Claude Code terminal as a message ("here's the v0.dev output").
6. **Claude Code does the surgical work:**
   - Replaces v0.dev's mock data with real Zod-typed `BlogPost` shape.
   - Wires the GROQ fetch via `sanityFetch` per CONVENTIONS Entry 2.
   - Fixes UI_STRINGS compliance (any hardcoded strings → enum).
   - Adds locale-aware link helpers from `@/lib/locale`.
   - Adds JSON-LD blocks per §4.4-§4.6.
   - Wires into the route file.
7. **Manual smoke test re-runs** per §12.2.

No file downloads. No file moves. Copy-paste between two browser
tabs (terminal ↔ v0.dev).

### §6.4 — v0.dev prompt amendments (applies only if §6.3 invoked)

Claude Code applies these amendments when assembling the v0.dev
prompt:

**Section 3 (visual reference):**

- Replace `TBD-pending-Step-7` placeholders with actual paths from
  Probe 1 captures.
- Replace `https://cloudemployee.io/blog/{slug}` (worked example
  carry-over from outdated routing) with
  `https://cloudemployee.io/{category}/{slug}` matching the locked
  spec.
- Add 1-2 specific live URLs as canonical samples:
  - `https://cloudemployee.io/staff-augmentation/what-is-staff-augmentation`
    (confirmed; full layout per May 2026 screenshot).
  - 1 sample with TL;DR + 1 sample with FAQs from the migrated 74
    docs (Claude Code picks via GROQ).

**Section 4 (Sanity data shape):** already correct in worked example.
Verify against current
`src/types/sanity/documents/blog-post.ts` Zod export.

**Field-name corrections to worked example (Section 3 field-to-UI
map):** the worked example uses outdated field names from earlier
schema iteration. Patch when assembling the v0.dev prompt:
- `blogCategory.title` → `blogCategory.name`
- `tag.title` → `tag.name`
- `teamMember.name` is correct (no change).
- All `slug` references should be `slug.current` at GROQ time
  but render as bare strings post-projection (worked example is fine).

**Section 5 (constraints):** paste-as-is from canonical template, plus
inline notes:

- Related-posts cards: A4 Card + E1 Image + A3 Tag composition.
- Breadcrumbs: NEW shared component at
  `site/src/components/shared/breadcrumbs.tsx` (used 2× in this
  template — top + bottom).
- TL;DR callout: NEW inline shape using Container + Card + Heading +
  PortableText (factor to shared only if reused).

**Section 6 (output format):** path is
`site/src/components/templates/blog/index.tsx`. Async server
component. `sanityFetch` from `@/lib/sanity/live`.

### §6.5 — Off-ramp to human dev (no change from original posture)

Per Jake's working posture: if even v0.dev produces something
visually broken after 2-3 iterations on a specific element, the off-
ramp is hand-coding that element in Claude Code without escalating
to Upwork. BLOG is a simple template — the success bar is high for
both Claude-Code-first and v0.dev fallback paths.

If escalation to Upwork were needed (extremely unlikely for BLOG),
the brief structure supports clean handoff because §5 visual
decomposition + §1.6 field-to-UI map + §3 GROQ queries collectively
serve as a developer spec.

---

## §7 — Listing Page Strategy

OUT OF SCOPE per §0 NON-GOALS. Listing pages (`/blog`, the 6 category
hubs) are blogHub singletons handled in a separate phase.

For the purposes of TEMPLATE-BLOG:
- Breadcrumb position-2 (`Home / Blog / ...`) links to `/blog` which
  doesn't exist yet. The breadcrumb still renders the link; the
  destination 404s until STATIC-1 lands. Acceptable.
- The category tag in the body links to `/{category-slug}` which
  doesn't exist yet either. Same handling.
- No listing-page work happens here.

---

## §8 — UK Locale Handling

### §8.1 — Single-document strategy (locked, §7.11)

Every blog post is a single Sanity doc rendered at BOTH locale paths:
- `/{category}/{slug}` (default)
- `/uk/{category}/{slug}` (UK mirror)

Same content. Same metadata. Different canonical / hreflang entries.

### §8.2 — Route file split

Two route files per §2.4:
- `site/src/app/[category]/[slug]/page.tsx` — passes `locale: 'default'`.
- `site/src/app/uk/[category]/[slug]/page.tsx` — passes `locale: 'uk'`.

Both import the same `templates/blog/index.tsx` component.

### §8.3 — `generateStaticParams` returns same params for both routes

The Sanity `locale` field tracks editorial intent. The route-level
locale mirror is independent of the doc's stored `locale`. Per §7.11:
single-document strategy means EVERY doc renders at BOTH locale paths
regardless of stored locale value.

Claude Code implements this by having both route files'
`generateStaticParams` return all 74 (category, slug) pairs from
Sanity.

### §8.4 — Hreflang emission

Per `@/lib/locale.generateHreflang()` invoked in `generateMetadata`,
each page emits:

```html
<link rel="alternate" href="https://cloudemployee.io/{cat}/{slug}" hreflang="en-US" />
<link rel="alternate" href="https://cloudemployee.io/uk/{cat}/{slug}" hreflang="en-GB" />
<link rel="alternate" href="https://cloudemployee.io/{cat}/{slug}" hreflang="x-default" />
```

### §8.5 — Canonical per locale

Default-locale page canonical: the default URL.
UK-locale page canonical: the UK URL.

Both are self-canonical. The hreflang relationship is what links them
in Google's index.

### §8.6 — Future LOCALE-1 phase

Post-launch, MYGRATR-LOCALE-1 runs a US-vs-UK content diff and decides
whether to:
- Keep single-document (most common — content is identical).
- Split into separate `locale: 'uk'` docs for the cases where UK
  content genuinely differs.

TEMPLATE-BLOG does NOT need to anticipate the split. When LOCALE-1
splits a doc, the `/uk/[category]/[slug]` route fetches the `locale
== 'uk'` version and the same template renders it. No template change.

---

## §9 — Empty State / Fallback States / Loading / Error States

### §9.1 — `notFound()` dispatch points

- Invalid category slug.
- Invalid post slug.
- Mismatched (category, slug) pair (post exists but in a different
  category than the URL claims).
- Doc not found at the (category, slug, locale) tuple.

All four resolve to the same `app/not-found.tsx` page (SCAFFOLD-1
scaffolded; STATIC-1 may upgrade the design).

### §9.2 — Field-level absence handling

| Field | Absent state | UI behavior |
|---|---|---|
| `tldrSection` (optional) | undefined or empty array | Section collapses entirely (no header, no callout) |
| `author` (required-in-schema but null in ~77% of data) | null | Byline hidden in metadata strip; author card hidden; JSON-LD author falls back to Organization |
| `faqs` (optional) | undefined or empty | FAQ section collapses entirely |
| `openGraphImage` (optional) | undefined | OG image falls back to thumbnailImage → brand default |
| `thumbnailImage` (required) | should never be null per CONTENT-1D-CLEANUP | If null detected at runtime, log warning + render brand fallback placeholder. Should NOT happen post-cleanup. |
| `tags[]` (required, min 1) | empty array | Tag row hidden; no graceful degradation needed (schema enforces min 1) |
| `category` (required) | should never be null | If null, log + `notFound()`. Schema enforces. |
| Related posts (0 results) | empty | "More articles on..." section collapses entirely |
| `author.aboutContent` (optional) | undefined | "About" subsection in author card hidden |
| `author.areasOfExpertise` (optional) | undefined | "Areas of Expertise" subsection in author card hidden |
| `author.linkedinLink` (optional) | undefined | "Read more" CTA in author card hidden |

### §9.3 — Loading state

Next.js App Router streaming. No custom `loading.tsx` at the route
level for build-time-generated pages. PortableText renders server-
side; no client-side hydration delay for content.

For draft-mode case where Sanity revalidation may lag:
- `<SanityLive />` handles live revalidation via SSE — page updates
  reactively when data changes.
- No explicit skeleton needed; the existing rendered state stays
  visible during refetch.

### §9.4 — Error state

Default Next.js error boundary at the route level. No custom
`error.tsx`. Generic error UI is acceptable for this phase; brand
customization happens in STATIC-1 or LAUNCH.

If a Zod validation error fires at fetch boundary (schema drift),
the error boundary catches it. Critical for surfacing schema drift
loudly rather than silently rendering partial data.

---

## §10 — Performance Budget + Lighthouse Acceptance Criteria

### §10.1 — Per-page targets (mobile 4G simulation)

| Metric | Target | Notes |
|---|---|---|
| LCP | < 2.5s | `thumbnailImage` is LCP element with `priority` |
| FCP | < 1.8s | Server-rendered HTML; no client hydration delay for static content |
| CLS | < 0.1 | Image aspect-ratio attrs prevent layout shift |
| TBT | < 200ms | No GSAP, no Swiper, no scroll-triggered JS on this template |
| TTI | < 3.5s | Single client-side interaction surface (FAQ accordion) |
| Page weight | < 500KB initial | Excludes images; image weight controlled by `<Image>` primitive sizing |

### §10.2 — Lighthouse scores (production build)

| Category | Target |
|---|---|
| Performance | ≥ 90 |
| Accessibility | ≥ 95 |
| Best Practices | ≥ 95 |
| SEO | ≥ 95 |

If any score lands below target on a sample blog post at HALT 3:
- Identify the specific failing audit.
- Apply the simplest fix (image optimization, defer non-critical JS,
  add missing alt text, etc.).
- If the fix exceeds 30 minutes of work, log to Tech Debt + flag for
  QA-1 phase.

### §10.3 — Bundle audit

After HALT 2: run `next build` and review the route's bundle output.
TEMPLATE-BLOG should ship ≤ 5KB of route-specific JS (server-component
template + 1 client island for A5 Accordion).

If bundle size exceeds 15KB, investigate. Likely culprit: accidental
client component (`'use client'` somewhere it shouldn't be).

### §10.4 — Image optimization

E1 Image primitive uses Sanity's `@sanity/image-url` builder + Next.js
`<Image>`. Sanity CDN auto-formats (WebP/AVIF). Next.js handles
responsive `srcset` per `sizes` attribute.

Per E1 spec, primitive ships responsive sizing. Template just needs
to pass correct `sizes` prop per usage context:
- Hero: `sizes="(min-width:768px) 70vw, 100vw"`.
- Inline content image: `sizes="(min-width:768px) 600px, 100vw"`.
- Author photo: `sizes="120px"` (fixed-size card photo).
- Related-post thumbnails: `sizes="(min-width:992px) 33vw, (min-width:768px) 50vw, 100vw"`.

---

## §11 — Fidelity Acceptance Criteria

Per `MYGRATR_PHASE_ROADMAP_v2.md` §3.7 guarantees A / B / C, scoped
to blog posts:

### §11.1 — Guarantee A: Content fidelity (100%)

- [ ] All 74 blogPost docs render at expected URLs (default + UK = 148 URLs).
- [ ] Zero hardcoded English marketing copy (UI_STRINGS lint passes).
- [ ] Title / date / author / category / tags / TL;DR / content / FAQs
      / meta fields all sourced from Sanity (verifiable via DOM
      inspection + GROQ comparison).
- [ ] Inline images in body content match Sanity asset references
      (no `webflowImageUrl` strings, no broken refs).

### §11.2 — Guarantee B: SEO-critical fidelity (100%)

- [ ] All 74 default-locale URLs preserve the Webflow URL structure
      exactly (`/{category}/{slug}`).
- [ ] All 74 UK-locale URLs render at `/uk/{category}/{slug}`.
- [ ] `<title>` matches `post.metaTitle`.
- [ ] `<meta name="description">` matches `post.metaDescription`.
- [ ] Canonical URL emitted server-side, matches expected pattern.
- [ ] Hreflang tags emitted server-side for en-US / en-GB / x-default.
- [ ] JSON-LD `BlogPosting` validates at schema.org validator
      (https://validator.schema.org).
- [ ] JSON-LD `BreadcrumbList` validates.
- [ ] JSON-LD `FAQPage` validates (when present).
- [ ] OpenGraph tags present and correct.

### §11.3 — Guarantee C: Visual fidelity (95-98% target)

- [ ] Hero layout matches CE live site at all 3 breakpoints.
- [ ] Typography matches design tokens (font, weight, size, line
      height).
- [ ] Colors match design tokens (no inline color overrides).
- [ ] Spacing scale consistent with design tokens.
- [ ] Author bio card matches CE's existing card layout.
- [ ] Related-posts strip layout matches (3 cards, recruitment tag,
      heading, image, title, "Read more" link).
- [ ] FAQ accordion matches CE's accordion behavior (chevron / plus /
      open behavior per A5 spec).
- [ ] Breadcrumbs match CE's existing breadcrumb visual style.
- [ ] Footer breadcrumb mirror matches.
- [ ] Mobile / tablet / desktop layouts all match.

### §11.4 — Hard rule: NO sub-95% acceptance

If any HALT-3 visual review surfaces sub-95% fidelity on any of the
above checklist items, the template is NOT considered complete.
Either:
- Fix in place at HALT 3.
- Log specific defect to Tech Debt + QA-1 phase if non-blocking.

"Acceptable" defects (logged but not blocking):
- Font rendering hairline differences (anti-aliasing varies between
  systems).
- Animation easing curves landing on slightly different frame
  boundaries (N/A for BLOG — no animations).
- Exact pixel padding within ±2px tolerance.

"Unacceptable" defects (blocking):
- Missing elements present on live site.
- Wrong fonts.
- Wrong colors.
- Wrong content (mismatched title, missing author, etc.).
- Broken responsive behavior.

---

## §12 — Verification Plan

### §12.1 — Pre-flight probes (HALT 1)

0. **Probe 0 (MetaFieldsSchema shape verification — added v1.2 per F12):**
   ```bash
   grep -A 5 "MetaFieldsSchema" src/types/sanity/shared.ts
   ```
   Expected: object with `metaTitle`, `metaDescription`, `openGraphImage`
   as the three fields. If any are missing or the names differ, halt
   + flag — the brief's `generateMetadata` and OG fallback chain
   depend on exact field names.
1. **Probe 1 (visual reference availability):** confirm Playwright
   captures exist for ≥3 blog-post slugs. Re-capture if missing or
   if any look mid-animation.
2. **Probe 2 (meta-fields populated):**
   ```bash
   npm run sanity:exec -- groq '*[_type=="blogPost" && (!defined(metaTitle) || !defined(metaDescription))][0...3]{_id,slug,metaTitle,metaDescription}'
   ```
   Expected: empty array. If any doc returns, flag + halt + escalate
   to Jake (likely needs Seb action).
3. **Probe 3a (Portable Text inline-image rendering):**
   - Render the existing B3 PortableText primitive against the
     `content` of 2 sample blog posts (one with inline images, one
     without). Visually verify inline images render at expected size
     + alt text.
   - Artifact: `audit-output/template-blog/probe-3a-inline-images.md`.
4. **Probe 3b (teamMember.areasOfExpertise data shape — HARD COMPATIBILITY GATE per CMA F13 v1.3):**
   - GROQ the shape of `teamMember.areasOfExpertise` on 2-3 sample
     team members:
     ```bash
     npm run sanity:exec -- groq '*[_type=="teamMember" && defined(areasOfExpertise)][0...3]{_id,name,areasOfExpertise}'
     ```
   - Inspect: is it PortableText with custom marks for pill styling,
     or a plain list, or HTML? Decide author-card render path based
     on actual shape.
   - **Render the raw values through B3 PortableText in a probe page.
     HALT if custom marks or inline objects are present and B3 doesn't
     render them as expected.** A "silent degrade to plain text" is a
     failure, not a soft outcome — areasOfExpertise must render as
     pill tags or the brief gets a v1.4 bump with the render-rule
     shape documented.
   - Artifact: `audit-output/template-blog/probe-3b-expertise-shape.md`.
5. **Probe 4 (route-conflict check):** confirm no other Tier-1 doc
   type uses `/[category]/[slug]` shape. Per §10 of schema doc, all
   other types have explicit prefixes (`/services/`, `/technology/`,
   etc.) — Probe 4 just verifies no drift since SCHEMA-1.
6. **Probe 5 (UK route precedence verification — added v1.2 per F1):**
   curl-test the 4 UK paths enumerated in §2.4. Verify Next.js App
   Router precedence routes 2-segment UK paths to the new route file
   and 1-segment / 3+-segment UK paths to the existing `[...slug]`
   catch-all. Artifact:
   `audit-output/template-blog/probe-5-uk-routing.md`.
7. **Probe 6 (author Zod runtime nullability — added v1.3 per CMA F1):**
   - Fetch 3-5 known null-author blogPost docs:
     ```bash
     npm run sanity:exec -- groq '*[_type=="blogPost" && !defined(author)][0...5]{_id,title,slug}'
     ```
   - For each, run `BlogPostSchema.safeParse(...)` against the
     returned doc. **HALT if any parse fails.**
   - If parse fails, update `src/types/sanity/documents/blog-post.ts`
     to mark `author` as nullable-optional at the read-model layer
     (Studio editorial schema stays unchanged — separate concern).
   - Re-run Probe 6 until all 5 sample docs parse successfully.
   - Artifact: `audit-output/template-blog/probe-6-author-null.md`.
8. **Probe 7 (broken category refs — added v1.3 per CMA F6):**
   ```bash
   npm run sanity:exec -- groq 'count(*[_type=="blogPost" && !defined(category->slug.current)])'
   ```
   - Expected: 0. If non-zero, halt + flag — those docs would
     emit malformed routes from `generateStaticParams`.
   - Artifact: `audit-output/template-blog/probe-7-broken-refs.md`.
9. **Probe 8 (urlFor undefined safety — added v1.3 per CMA F8):**
   - Find 3-5 docs with `openGraphImage` absent:
     ```bash
     npm run sanity:exec -- groq '*[_type=="blogPost" && !defined(openGraphImage)][0...5]{_id,thumbnailImage,openGraphImage}'
     ```
   - Run the §4.8 fallback chain against each in a Node probe.
     **HALT if any throws.**
   - Artifact: `audit-output/template-blog/probe-8-urlfor-safety.md`.
10. **Probe 9 (A2 Link external rel verification — added v1.3 per CMA F14):**
    - Inspect `site/src/components/ui/link/index.tsx` for the
      `external` prop handling.
    - Confirm emitted HTML for `<Link external>` contains both
      `target="_blank"` AND `rel="noopener noreferrer"`.
    - **Fix the primitive if missing — single-source fix, no
      template-side workaround.**
    - Artifact: `audit-output/template-blog/probe-9-link-rel.md`.
11. **Probe 10 (locale field data state — added v1.3 per CMA F7):**
    - Count docs by locale field state:
      ```bash
      npm run sanity:exec -- groq '{
        "undefined": count(*[_type=="blogPost" && !defined(locale)]),
        "default": count(*[_type=="blogPost" && locale=="default"]),
        "uk": count(*[_type=="blogPost" && locale=="uk"])
      }'
      ```
    - Informational only — informs LOCALE-1 planning. Does NOT block
      TEMPLATE-BLOG since the page query no longer filters on locale.
    - Artifact: `audit-output/template-blog/probe-10-locale-state.md`.

All probes produce artifacts under `audit-output/template-blog/`
(gitignored). Pattern 13 layer 4: artifact-backed verification before
implementation.

### §12.2 — Manual smoke test (HALT 2)

Before any curl tests fire, Claude Code:
1. Builds the dev server (`cd site && npm run dev`).
2. Navigates to 3 specific blog-post URLs in a browser:
   - One default-locale URL with TL;DR + FAQ + author + inline images (complex).
   - One default-locale URL with no TL;DR, no FAQ, no author (sparse).
   - One **UK-locale** URL of any blog post — verifies UK routing
     works AND Visual Editing overlays render correctly on UK paths
     (per F13 v1.2: confirms `<SanityLive />` + `<VisualEditing />`
     mount-cascade from root layout flows through to UK layout).
3. Visually confirms each renders without console errors.
4. Confirms Visual Editing overlays render in draft mode (per
   CONVENTIONS Entry 3 manual smoke pattern). MUST be verified on
   the UK-locale sample too — not just default-locale.
5. Confirms hreflang + canonical render in `view-source` on all 3
   samples.

Smoke artifact: `audit-output/template-blog/smoke-test.md`.

### §12.3 — Integration tests (HALT 2 — after smoke)

Per Pattern 13 layer 4 — manual smoke FIRST, then curl tests.

```bash
# Default locale
curl -s -o /dev/null -w "%{http_code}\n" \
  https://staging.jakevibes.dev/staff-augmentation/what-is-staff-augmentation
# Expected: 200

# UK mirror
curl -s -o /dev/null -w "%{http_code}\n" \
  https://staging.jakevibes.dev/uk/staff-augmentation/what-is-staff-augmentation
# Expected: 200

# Invalid category
curl -s -o /dev/null -w "%{http_code}\n" \
  https://staging.jakevibes.dev/nonsense-category/foo
# Expected: 404

# Valid category, invalid slug
curl -s -o /dev/null -w "%{http_code}\n" \
  https://staging.jakevibes.dev/staff-augmentation/nonsense-slug
# Expected: 404

# Mismatched category + slug (slug belongs to a different category)
curl -s -o /dev/null -w "%{http_code}\n" \
  https://staging.jakevibes.dev/scaling-teams/{slug-of-a-staff-aug-blog}
# Expected: 404 (category-filter GROQ returns null)

# Canonical + hreflang in response body
curl -s https://staging.jakevibes.dev/staff-augmentation/what-is-staff-augmentation \
  | grep -E 'canonical|alternate.*hreflang'
# Expected: rel="canonical" + 3 hreflang entries (en-US, en-GB, x-default)

# JSON-LD BlogPosting
curl -s https://staging.jakevibes.dev/staff-augmentation/what-is-staff-augmentation \
  | grep -A 1 'application/ld+json'
# Expected: BlogPosting + BreadcrumbList JSON blocks

# Sitemap inclusion (post-CONTENT-1 will expand sitemap.ts; verify the
# blog routes are listed)
curl -s https://staging.jakevibes.dev/sitemap.xml | grep -c staff-augmentation
# Expected: ≥ 2 (post URLs + category URL when STATIC-1 adds it)
```

### §12.4 — JSON-LD validation

Pipe the rendered HTML through schema.org's validator (or Google's
Rich Results test). HALT 3.

```bash
# Save rendered HTML
curl -s https://staging.jakevibes.dev/staff-augmentation/what-is-staff-augmentation \
  > /tmp/sample-blog.html

# Extract JSON-LD blocks
grep -oP '<script type="application/ld\+json">[\s\S]*?</script>' /tmp/sample-blog.html
```

Validate each emitted JSON-LD block against schema.org. Expected:
- BlogPosting: valid.
- BreadcrumbList: valid.
- FAQPage (if applicable): valid.

### §12.5 — Visual diff plan

Captured at HALT 3:
1. Run Playwright to capture the new template at 3 breakpoints on
   3 sample blog URLs (9 captures).
2. Manually compare against the AUDIT-1 live-site captures.
3. Flag any visual delta > 5% of viewport area.

No automated pixel-diff for this phase (QA-1 sets that up). Manual
review is sufficient at pattern-establishing stage.

### §12.6 — Lighthouse pass

HALT 3:
```bash
npx lighthouse \
  https://staging.jakevibes.dev/staff-augmentation/what-is-staff-augmentation \
  --only-categories=performance,accessibility,best-practices,seo \
  --output=json \
  --output-path=audit-output/template-blog/lighthouse-sample.json
```

Verify scores meet §10.2 targets.

### §12.7 — Final acceptance gate

All §11 checklist items checked. All probes passed. Smoke + curl +
JSON-LD validation green. Lighthouse scores meet targets. Visual diff
within tolerance.

---

## §13 — Critical Halt Triggers

Triggers that fire `process.exit(1)` or hard-halt the execution:

1. **Probe 2 failure (meta fields not populated):** any blogPost doc
   missing `metaTitle` or `metaDescription`. Cannot proceed without
   meta data. Escalate to Jake/Seb.
2. **Probe 4 failure (route conflict):** another doc type detected at
   `/[category]/[slug]` pattern. Schema drift; investigate.
3. **Zod parse error on `BlogPostSchema` against live data:** schema
   shape doesn't match migrated data. Halt; investigate cause; re-
   probe migration state.
4. **Visual Editing roundtrip broken:** if Visual Editing was working
   before this template but stops working during it, suspect the
   template introduced a client/server boundary issue. Halt;
   diagnose.
5. **UI_STRINGS lint failure on v0.dev output:** Claude Code must
   bring v0.dev output into compliance before merging. If 3+
   iterations don't resolve, halt + escalate to Jake.
6. **Lighthouse Performance < 80 after optimization attempt:**
   investigate; potentially halt for diagnosis. (<80 is significantly
   worse than the 90 target and suggests a structural problem.)
7. **Bundle size > 15KB for route JS after investigation:** §10.3
   sets a 5KB target and a 15KB investigate threshold. If
   investigation doesn't reduce the bundle below 15KB, halt + log
   to Tech Debt. (Pre-v1.2 wording said 30KB — corrected for
   internal consistency with §10.3.)
8. **`generateStaticParams` returns fewer than 74 pages:** missing
   data; investigate.
9. **CMA finding during cross-model audit that changes a structural
   decision (route shape, query shape, JSON-LD content):** halt brief
   execution if Brief v1.x is already locked; bump brief version;
   re-audit.
10. **Probe 1 + Probe 1b both fail to produce 3+ valid blog captures
    (added v1.2 per F9):** Playwright errors, network issues, or
    AUDIT-1 script rot. Halt + escalate to Jake — Jake manually
    captures 3 representative blog-post slugs via browser screenshot
    at desktop / tablet / mobile breakpoints and saves to
    `audit-output/screenshots-template-blog/manual/`.
11. **Probe 6 failure — Zod nullability mismatch (added v1.3 per CMA F1):**
    `BlogPostSchema.safeParse` fails on any null-author doc. Halt;
    update read-model Zod to nullable-optional for `author`; re-run.
    The Studio editorial schema stays unchanged — the runtime
    read-model is what needs to tolerate the data state.
12. **Probe 7 failure — broken category refs (added v1.3 per CMA F6):**
    any blogPost doc has missing or invalid `category` reference.
    Halt; escalate to Jake/Seb to repair the data state before
    proceeding. `generateStaticParams` would silently drop those
    routes from the build manifest otherwise.
13. **Probe 3b failure — areasOfExpertise renders as plain text
    instead of pill tags (added v1.3 per CMA F13):** the B3
    PortableText renderer doesn't handle the field's actual shape.
    Halt; document the render-rule shape needed; bump brief to v1.4
    with the new render rule specified. Do NOT silently ship a
    degraded author bio card.

For each halt trigger, Claude Code writes a `DEBUG_CONTEXT.md` at
repo root (per CLAUDE.md Hard Rule §"Diagnosis vs Execution") and
surfaces to Jake. Two failed retry attempts on the same trigger =
confirmed dead end; do not retry a third time.

---

## §14 — HALT Structure

Three HALTs (pattern-establishing first template warrants the extra
checkpoint; subsequent simple templates can collapse to 2).

### HALT 1 — Recon, probes, scope confirmation

**Deliverables:**
- Probes 0 through 10 executed; artifacts under
  `audit-output/template-blog/`.
- Animation-frame audit on Playwright captures complete.
- v0.dev prompt scratchpad prepared (`docs/templates/blog/_active/v0-prompt.md`
  with §6.4 amendments applied — only relevant IF Path B is invoked
  at HALT 2 decision branch; otherwise scratchpad is held in reserve).
- Sanity GROQ queries authored at `site/src/lib/sanity/queries/blog-post.ts`
  + Zod schemas paired.
- Route file skeletons at `site/src/app/[category]/[slug]/page.tsx`
  and `site/src/app/uk/[category]/[slug]/page.tsx` (no rendering yet
  — just `generateMetadata`, `generateStaticParams`, fetch, return
  data through to template component).
- Empty placeholder template at `site/src/components/templates/blog/index.tsx`
  rendering a debug shell (`<pre>{JSON.stringify(post)}</pre>`).
- Smoke test: navigate to a real URL, confirm debug shell renders
  with full Sanity data.

**Commit:** `feat(template-blog): halt 1 — recon, probes, route plumbing`

### HALT 2 — Visual integration

**Path A (default — Claude-Code-first):**
- Claude Code authors `site/src/components/templates/blog/index.tsx`
  directly against §1.5 captures + §5 decomposition + design tokens
  + primitive inventory.
- All primitives correctly composed (§5).
- Author bio card + related-posts strip + breadcrumbs + FAQ accordion
  + TL;DR callout all rendering against real Sanity data.
- UI_STRINGS compliance verified (`npm run lint` clean).
- Manual smoke test passes per §12.2.
- Jake reviews visual fidelity at smoke test against AUDIT-1
  captures + live site per §6.1 decision criteria.

**§6.1 decision branch at smoke review:**
- **≥ 90% fidelity → ship as-is.** Iterate minor polish inline with
  Claude Code. Path A closes. Proceed to integration tests.
- **70-89% fidelity → iterate inline with Claude Code on broken
  elements.** Still Path A. 2-3 inline iterations max per element;
  unresolved elements fall through to v0.dev for that element only.
- **< 70% fidelity → fall through to Path B (full v0.dev pass).**

**Path B (fallback — v0.dev):**
- Claude Code assembles v0.dev prompt per §6.4 amendments.
- Jake runs v0.dev session, copies output back.
- Claude Code does surgical data-layer + UI_STRINGS + locale + JSON-LD
  wiring per §6.3 step 6.
- Manual smoke test re-runs per §12.2.

**Either path closes HALT 2 once:**
- Visual fidelity ≥ 90% on the 3 sample blog URLs.
- UI_STRINGS lint passes.
- Integration tests pass per §12.3.
- Path taken logged in commit message.

**Commit:** `feat(template-blog): halt 2 — visual integration [path A | path B]`

### HALT 3 — SEO surface, polish, close

**Deliverables:**
- JSON-LD `BlogPosting` + `BreadcrumbList` + (conditional) `FAQPage`
  emitted server-side via `serializeJsonLd` XSS-safe helper (CMA
  F4 v1.3). Validation passes per §12.4.
- `generateMetadata` returns full metadata per §4.1.
- Visual diff per §12.5 within tolerance.
- Lighthouse per §12.6 hits targets.
- All §11 acceptance criteria checked.
- CONVENTIONS.md updates (new entries — pattern-establishing for
  all TEMPLATE-* phases):
  - "Detail-Page Template Pattern" — route file → query → template
    composition, for inheritance by TEAM_MEMBER, REVIEW, VIDEO,
    DOWNLOAD, COMPARE.
  - "Sanity Perspective Discipline" (CMA F5 v1.3) — no per-template
    perspective overrides; `sanityFetch` exclusive in route/template
    files; `previewDrafts` string forbidden in `site/src/app/` and
    `site/src/components/templates/`.
  - "Parameterized GROQ Only" (CMA F15 v1.3) — no template-literal
    query construction; `$paramName` placeholders + `params` object
    always.
  - "JSON-LD XSS-Safe Serialization" (CMA F4 v1.3) — the
    `serializeJsonLd` helper pattern with HTML escapes; applies to
    every JSON-LD emission site sitewide.
- FEATURE_MAP.md updated.
- PHASE_HISTORY.md TEMPLATE-BLOG entry written.
- CHANGELOG.md TEMPLATE-BLOG entry written.
- CAPABILITY_LOG.md extended with TEMPLATE-BLOG productisation IP
  (10 probes, 3 CONVENTIONS patterns, 23 locked decisions — the
  template-phase reusability matrix).
- CLAUDE.md current-phase + phase-table updated; tech debt closed
  or extended per discoveries.

**Commit:** `feat(template-blog): halt 3 close — SEO + polish + context-files sync`

---

## §15 — Anticipated CMA Findings (Pattern 13 Application)

Cross-model audit will surface findings in these areas. Pre-emptively
flagged here so the brief can be sharpened before audit, not after.

### §15.1 — Likely structural findings

1. **Route precedence ambiguity.** Reviewer may flag the `/[category]/[slug]`
   broad pattern as a route-conflict risk against future-added top-
   level routes (e.g. if someone adds `/about`, `/pricing`, etc., does
   the broad pattern catch them?). Answer: Next.js App Router
   precedence rules give explicit segments priority over dynamic
   ones; `/about/page.tsx` wins over `/[category]/[slug]/page.tsx`
   for the path `/about`. The risk is real for two-segment paths
   like `/about/team` if no `/about/team/page.tsx` exists — they
   would fall into `/[category]/[slug]` and `notFound()` via the
   category guard. Acceptable.
2. **`generateStaticParams` returning duplicate (category, slug)
   pairs across locales.** Should it? Both routes have their own
   `generateStaticParams`; they're disjoint by route, so no duplicate
   issue. Confirm.
3. **JSON-LD `dateModified` falling back to `datePublished`.** Some
   SEO best-practice guides recommend distinct values. The schema
   doesn't store `dateModified`. Acceptable trade-off; logged for
   post-launch Tech Debt.
4. **Author Organization fallback in JSON-LD.** Schema.org validators
   accept Organization as `author`, but Google's structured data
   testing may prefer Person. Acceptable; will be backfilled to
   Person before launch.
5. **Tag rendering as non-clickable.** Reviewer may flag this as
   missing functionality. Answer: matches live-site behavior; tag-
   filter feature is post-launch.
6. **Top breadcrumb + bottom breadcrumb mirror.** Reviewer may flag
   as redundant or as JSON-LD double-emission. Answer: matches live
   site; JSON-LD emits only once (top instance).
7. **No `loading.tsx`.** Reviewer may want a per-route loading
   skeleton. Answer: static-generation makes this unnecessary; draft-
   mode revalidation is handled by `<SanityLive />`.
8. **`<VisualEditing />` not in template.** Reviewer may expect it
   here. Answer: it's in root layout per CONVENTIONS Entry 3, NOT
   per-template.
9. **Probe 3b (areasOfExpertise shape).** Could surface a finding
   that the PortableText shape can't render as inline pill tags
   without custom render rules. Answer: if so, the brief gets a v1.1
   bump with the specific render-rule shape documented; alternatively,
   a schema relaxation (areasOfExpertise as `array[string]` instead
   of PortableText) might be the correct fix — Tech Debt.
10. **Related-posts query returns 0 cards.** Some sub-category blogs
    have very few posts (AI in Software Dev has 3 total). If a post
    in that category has 0 sibling posts, the strip collapses. CMA
    reviewer may flag as poor UX. Answer: fallback to "Latest from
    Cloud Employee" using newest-across-all-categories? Decision:
    defer this UX-polish enhancement; HALT 3 visual review confirms
    the empty-collapse case is acceptable visually.

### §15.2 — Pattern 13 application: defensive code audit

Each piece of defensive code in this brief gets a Pattern 13 layer
review:

- **Category guard at GROQ level + runtime list check.** Belt-and-
  braces. Reachable? Yes (any URL not matching a real (cat, slug)
  pair). Side-effect free? Yes (just returns `notFound()`). Bypass-
  able? No (both checks fire). Failure-mode tested? Yes (curl test in
  §12.3 dispatches invalid categories). Customer-2 transfer: pattern
  reusable as-is for any multi-segment dynamic route.
- **Zod validation at fetch boundary.** Reachable? Yes (every fetch).
  Side-effect free? No — throws on parse fail. Bypassable? No
  (mandatory at boundary). Failure mode? Schema drift surfaces
  loudly. Customer-2 transfer: pattern reusable for any Sanity-typed
  data layer.
- **`author === null` guards (rendering, JSON-LD).** Reachable? Yes
  (~77% of current data). Side-effect free? Yes. Bypassable? No.
  Failure mode? If schema enforces `author` required (which it does
  per §3.1), the null case is data-state inconsistency, not schema
  shape. Logged for Seb's bulk backfill before LAUNCH.
- **Image absent fallback chain.** Reachable? Yes (OG image is
  optional). Side-effect free? Yes. Bypassable? No. Failure mode? If
  all 3 fallbacks fail (brand default missing), the page still
  renders but OG share preview is bare. Acceptable.
- **PortableText image renderer.** Reachable? Yes (inline images in
  74 docs). Side-effect free? Yes (E1 Image primitive is server-
  component, no side effects). Bypassable? No. Failure mode? Probe 3a
  validates pre-execution.

### §15.3 — Pattern 13 customer-2 transfer

Patterns established in TEMPLATE-BLOG that carry forward to
TEMPLATE-TEAM_MEMBER, TEMPLATE-REVIEW, etc.:

- **Detail-page route file pattern** (route → fetch → typed →
  render).
- **GROQ + Zod paired at `site/src/lib/sanity/queries/{type}.ts`**.
- **Locale mirror via thin wrapper at `uk/` subtree**.
- **JSON-LD pattern per doc type** (specific shape varies; structure
  pattern is reusable).
- **Empty-state handling for optional fields**.
- **Shared component extraction at 2nd use** (Breadcrumbs lands
  here; reused in TEAM_MEMBER + REVIEW + etc. So lands at
  `site/src/components/shared/breadcrumbs.tsx`).
- **HALT 1 probe pattern**: visual-reference availability + meta-
  field completeness + portable-text shape + route-conflict.

---

## §16 — Decisions to Lock + Open Questions

### §16.1 — Locked decisions

| # | Decision | Locked because |
|---|---|---|
| TB1 | URL pattern `/[category]/[slug]` | §10 schema spec + live-site preservation |
| TB2 | Detail page only (listing pages out of scope) | Listing pages are blogHub singletons; separate phase |
| TB3 | Related posts: 3 from same category, newest first | Live-site confirms this behavior |
| TB4 | UK locale: single-document, same render at `/uk/` mirror | §7.11 + locked LOCALE-1 deferral |
| TB5 | Author byline + bio card hidden when `author === null` | 77% of data lacks author; Seb backfills before launch |
| TB6 | JSON-LD: BlogPosting + BreadcrumbList + (conditional) FAQPage | §7.6 schema spec |
| TB7 | Floating TOC: deferred to post-launch sitewide phase | Live site has it left-side blog-only; user prefers right-side sitewide; treated as redesign |
| TB8 | Tech Debt #18 (Referrer-Policy): not in TEMPLATE-BLOG scope | Layout-level concern |
| TB9 | Visual reference: Playwright captures from AUDIT-1, augmented per Probe 1b if needed | Already on disk; automated workflow |
| TB10 | 3 HALTs (recon → visual → SEO/close) | Pattern-establishing |
| TB11 | Tags rendered non-clickable | Matches live-site behavior |
| TB12 | Both top and bottom breadcrumbs rendered | Matches live-site behavior |
| TB13 | Breadcrumb position-2 link to `/blog` even though route doesn't exist yet | Route lands at STATIC-1; breadcrumb is forward-compatible |
| TB14 | Claude-Code-first visual generation; v0.dev as fallback only | BLOG is simple template (no animation, no Tier-1 complex components); Claude Code first-pass expected to hit ≥90% fidelity; v0.dev preserved for genuine visual heavy lifting on later complex templates (HOME, TECHNOLOGY, SERVICE) |
| TB15 | UK `[...slug]` catch-all PRESERVED alongside new `[category]/[slug]` UK route (v1.2 / F1) | Other-segment-count UK paths still need 404 behavior until template phases ship; 2-segment paths win precedence over catch-all per Next.js App Router rules |
| TB16 | Zod twin IMPORTED from `src/types/sanity/documents/blog-post.ts`, never re-derived from §1.1 field list (v1.2 / F3) | MetaFieldsSchema + SourceTrackingFieldsSchema merges supply non-obvious fields; re-derivation risks drift |
| TB17 | Hreflang locale codes are `en-US / en-GB / x-default` per existing `generateHreflang` helper, NOT bare `en` (v1.2 / F7) | Brief defers to SCAFFOLD-1 locale module; do not modify helper |
| TB18 | Read-model Zod `author` is nullable-optional; Studio editorial schema stays "required" (v1.3 / CMA F1) | ~77% of migrated docs lack author; bulk backfill happens pre-LAUNCH; runtime layer tolerates the data state without relaxing editorial intent |
| TB19 | Locale filter REMOVED from page-fetch GROQ + related-posts GROQ (v1.3 / CMA F3) | Single-document mirror strategy; locale derives from route path only; reintroduce only when LOCALE-1 does deliberate locale-split data migration |
| TB20 | Related-posts joins on `category->_id` not `category._ref` (v1.3 / CMA F2) | Page query dereferences `category`, eliminating `_ref`; `_id` is available after deref and is the consistent join key |
| TB21 | JSON-LD rendered via XSS-safe `serializeJsonLd` helper with HTML escapes, never template-literal interpolation (v1.3 / CMA F4) | Sanity-authored values can contain `</script>` or unicode line terminators; this is a real XSS vector from CMS content |
| TB22 | Single category-guard at GROQ level — no separate runtime allow-list check (v1.3 / CMA F11) | GROQ filter `category->slug.current == $category` returns null for all invalid cases; both paths called same `notFound()` — redundancy adds maintenance, not safety |
| TB23 | Parameterized GROQ only — no template-literal query construction (v1.3 / CMA F15) | GROQ injection discipline; carries forward to every TEMPLATE-* phase via CONVENTIONS update at HALT 3 |

### §16.2 — Open questions deferred to execution

| # | Question | Where resolved |
|---|---|---|
| TBO1 | Exact shape of `teamMember.areasOfExpertise` (PortableText with custom marks vs plain list vs HTML)? | Probe 3b at HALT 1 |
| TBO2 | Inline-image render styling inside body PortableText (margin, max-width, caption) | Probe 3a visual inspection at HALT 1 + v0.dev iteration at HALT 2 |
| TBO3 | TL;DR callout exact visual styling (bg color, border, padding) | v0.dev infers from screenshots at HALT 2 |
| TBO4 | Tag pill exact styling on author bio card vs body tag-row | v0.dev iteration at HALT 2 |
| TBO5 | Whether to add `MORE_ARTICLES_ON` UI string to `ui-strings.json` or use inline lint exception | Locked: §5.5 says add the key. Confirmed at HALT 2 implementation. |
| TBO6 | Whether `Breadcrumbs` is a primitive (graduates from shared component to `ui/`) | Decision deferred; lands in `site/src/components/shared/` at TEMPLATE-BLOG; promoted to primitive if used in 4+ templates (DESIGN-1 promotion threshold) |

### §16.3 — Deferred to post-launch enhancement phases

| # | Item | Phase |
|---|---|---|
| TBD1 | Floating right-side TOC sitewide (BLOG + CUSTOMER_STORY + TECHNOLOGY + SERVICE + STATIC) | Post-launch TOC-ROLLOUT phase |
| TBD2 | Tag click-through to `/tag/{slug}` filtered listings | Post-launch tag-filter feature |
| TBD3 | Distinct `dateModified` field on `blogPost` schema | Post-launch schema-v2 |
| TBD4 | Per-post `dateModified` JSON-LD value (separate from `datePublished`) | TBD3 prerequisite |
| TBD5 | Related-posts fallback to "Latest from Cloud Employee" when same-category yields 0 | Post-launch UX-polish |
| TBD6 | UK-content split for blogs that should genuinely differ from US | MYGRATR-LOCALE-1 |

---

*End of MYGRATR-TEMPLATE-BLOG_BRIEF_v1.3.md*

*External CMA pass complete (16 findings actioned: 3 CRITICAL / 6
IMPORTANT / 7 MINOR; 6 dismissed). Combined with v1.2 internal audit
(14 findings) = 30 total findings integrated. v1.3 ready to LOCK and
move to `docs/briefs/active/`. Brief is now Claude-Code-execution
ready. 11 pre-flight probes at HALT 1; 13 halt triggers; 23 locked
decisions.*

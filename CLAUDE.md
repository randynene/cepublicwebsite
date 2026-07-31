# CLAUDE.md — Mygratr

> Read this file first. Every session. No exceptions.
> If this file is getting long, see REGISTRY.md for route/component/table lists.

## What Mygratr Is

Automated website migration platform. Takes a production website on a
legacy CMS (Webflow first, then WordPress/Squarespace/Wix) and rebuilds
it on Next.js + Sanity through a six-phase agentic pipeline:
Audit → Schema → Scaffold → Content → Build → QA → Launch.

Parent brand: Saxon.io. Owner: Jake Hall (non-developer, directs Claude Code).

## Current Phase

> **ACTIVE ACTION PLAN (READ FIRST): `docs/ROADMAP_TO_COMPLETION.md`.** This is the
> definitive, sequenced plan to finish the site and cut over to production cleanly.
> It holds the MASTER PAGE TRACKER (every URL, its real status, the work needed, its
> Marker.io review wave), the 9 execution phases, the SEO/parity launch gate, the
> Marker.io rollout schedule, and the open decisions (D1-D5).
>
> **UPDATE DISCIPLINE (mandatory): every time ANY page or task is implemented, update
> `docs/ROADMAP_TO_COMPLETION.md` IN THE SAME SESSION** - tick the master tracker,
> update the SEO checklist, and state plainly what is now complete vs still
> outstanding. The file is the memory; if it is not kept current it lies. This rule
> sits above the older DESIGN_EXECUTION_ROADMAP.md for day-to-day execution until
> launch.
>
> **The completion standard:** every page must (1) be wired to Sanity (editable in
> Presentation), (2) be SEO-correct (title/description/canonical/hreflang/JSON-LD),
> and (3) match live cloudemployee.io for URL, sitemap, and content - EXCEPT Home and
> How It Works (deliberately redesigned) and net-new pages (Locations, Fractional CTO,
> Managed Pods, Referral) which have no live equivalent to match.
>
> **🔄 DESIGN PIVOT (active).** Visual design is being redone against canonical
> Figma (`CE-REDESIGN.fig` — dark theme, lime accent). **`docs/DESIGN_EXECUTION_ROADMAP.md`
> is authoritative** (D1–D6). Sanity backend, content, 27-template structure, and
> DESIGN-1 infrastructure survive; tokens and some component shapes were stale and
> are being reconciled.
>
> **Code shipped vs design-only (read this before planning builds):**
> - **D2 + STATIC-3 complete (Jul 2026):** D2 tokens; STATIC-3 chrome (header,
>   mega-menus, footer, announcement bar) rebuilt in dark/lime and committed.
> - **TEMPLATE-BLOG complete (May 2026):** 74 blog detail routes, JSON-LD, SEO 100.
> - **STATIC-1 hubs + 404 still live in code** as the original generic `renderHub`
>   grid — functionally correct (routes, Sanity data, pagination, JSON-LD, build-
>   clean for hubs/404) but **visually stale** vs current design. Reconciliation is
>   a later D3/D5 pass after hub content capture (Tech Debt #43–#45).
> - **D3 Claude Design artifacts** exist for chrome, detail templates, 5 hub index
>   designs, Pricing, and Legal — most are **not yet built as Next.js routes** except
>   blog + chrome. Legal privacy route exists on disk but is **uncommitted** and
>   **blocks `npm run build`** (Tech Debt #46).
> - **SEO gate now exists:** `docs/seo/SEO_GEO_PER_TEMPLATE_CHECKLIST.md` (Tier 1 =
>   launch-blocking, referenced by every future TEMPLATE-* brief) +
>   `docs/seo/SEO_GEO_SITEWIDE_GAP_FIX_BRIEF.md` (site-wide fixes; launch-gate items
>   shipped Jul 2026, Tech Debt #47).
> - **Remaining D3 build track:** Figma batch (Home, How It Works, Fractional CTO,
>   Managed Pods, Referral, Locations); Engineering Sign-up + About blocked on Seb;
>   Event deferred (needs screenshot).

**MYGRATR-STATIC-3** — **CLOSED (Jul 2026).** Chrome visual rebuild on dark/lime D2 tokens: flat header bar (Header.html frame 01), Services + Resources mega-menus (Steps 3/4), footer rebuild against Footer.html + STATIC-2 schema (Step 5), header/footer 1152px content-band alignment, 32px CMS-driven announcement bar (`navigation.announcementBar`, Studio deployed, patch-seeded). How It Works = plain nav link. Region selector in footer. Scroll-triggered floating-pill morph deferred to TEMPLATE-HOME. `migrations.status` unchanged at `content_complete`. Next design track: D3 Figma batch (Home, HIW, Fractional CTO, Managed Pods, Referral, Locations).

**MYGRATR-STATIC-3 Step 3/4** — CLOSED (Jul 2026). Mega-menu content renderers wired against `docs/design/raw-html/Header.html` frames 03 (Services) + 04 (Resources) on the dark `#101B30` shell. How It Works demoted to plain nav link (no dropdown; Sanity `howItWorksMegaMenu` left unused). Mobile drawer matches frame 06 (lightweight section lists on `#070D18`). `MegaMenuPillLabel` gained additive `leadingArrow`; shell gained `#22314D` border + 20px radius. Pill-style + left-column View-all data gaps flagged for Jake/Seb.

**MYGRATR-D2** — CLOSED (Jun 2026). Token re-extract. `site/src/app/tokens.css` swapped from the teal era to the new dark-default + lime (`#D4FF3C`) system per the LOCKED `docs/design/VISUAL_LANGUAGE_SPEC.md`: dual-mode semantic tokens (Dark = live `@theme` skin + `[data-theme="light"]` override), canonical dark ground `#070D18`, lime opacity scale (§1c) + contrast/pairing rules (§6) as comments, LIVE Inter Semi Bold type scale (H1 67 / H2 58 / H3 46), Source Serif 4 Italic accent, §5 inferred spacing/radius/shadow (flagged inferred-pending-Figma). Fonts Poppins → Inter + Source Serif 4 Italic (`layout.tsx`); body re-grounded (`globals.css`). **DEV-1**: old token names kept as remapped aliases (D4 migrates components onto the semantic names, then deletes the aliases). On Jake's direction D2 also absorbed two D4 items — the lime-contrast pass (no white-on-lime anywhere + `bg-text-default` dark-surface regression fixes) and the Accordion shape-edit (thin plus + dark dividers). Storybook renders the existing primitives in the new skin. tsc + build clean. D4 carryover recorded in the tokens.css DEV-1 block. `migrations.status` unchanged at `content_complete`. Next: D3. `nav.tsx`/`nav-client.tsx` STATIC-3 work stays uncommitted; the 2 nav contrast fixes ride with STATIC-3.

**MYGRATR-STATIC-2** — CLOSED (May 2026). Chrome schema extensions + reseed: `navigation` global extended with `primaryLinks[].dropdownType` discriminator + `servicesMegaMenu` (hybrid CMS-driven reference unions to service+technology docs, leftColumn highlightedItems max-2 + flat + rightColumnTop + rightColumnBottom.sections max-2) + `howItWorksMegaMenu` (3 cards + bottom panel, inline images per Option B) + `resourcesMegaMenu` (discriminated icon `material-font | asset` with Rule.custom() conditional validation, blogPost + customerStory ref arrays); `footer` extended with `topCtaBlock` + `sections[]` + `talentLocations` + `subscribe` + `bottomBar`; `service.tagline` + `technology.tagline` added. `imageField()` helper extended with `altRequired?: boolean` opt. Legacy fields preserved with `⚠️ Legacy field` markers for STATIC-1 render regression safety. Studio deployed. Reseed via `seed-globals-v2.ts`: 19 taglines patched, 4 HIW inline images uploaded, 25 references resolve (3 hand-curated customerStory via Decision A + 3 hand-curated blogPost via Decision B + 19 service/technology). DELTA-6 `/compare → /alternatives` applied. 4 commits on `feat/design-1`. **Tech Debt #34 closed** (footer social icons — intentionally omitted). Backup at `audit-output/static-2/pre-reseed-backup.tar.gz` (943K, 422 docs). 4 STATIC-2 brief-vs-reality deltas (A: footer CTA "Book A Call"; B: service icons absent — DELTA-1 scope dropped; C: customer-story URL singular; D: blog cards multi-namespace). 1 STATIC-3 delta filed (floating-pill scroll-triggered). 4 Customer-2 IP patterns filed in CAPABILITY_LOG (`__name` shim, plan-mode DOM-confirmation discipline, discriminated icon shape, audit-driven brief refinement). `migrations.status` unchanged at `content_complete`.

**Prior: MYGRATR-STATIC-1** — CLOSED (May 2026). Site chrome: Header (Disclosure-pattern desktop dropdowns + Radix Dialog mobile drawer + Calendly CTA + locale switcher + skip-link), Footer (4 columns + newsletter via C6 HubSpotFormEmbed + legal + `{year}`-token copyright), 16 hub routes (1 generic GROQ over `HUB_CONFIG` + 3 fresh cards + shared `renderHub` helper + `?page=N` pagination + `CollectionPage` + `BreadcrumbList` JSON-LD), 404 page (`notFoundPage` singleton + explicit noindex). 20 Sanity docs seeded with zero em/en-dash residue. 8 commits on `feat/design-1`. Sitemap = 166 entries (16 hub × default-locale only, UK hub routes deferred per Gap 1 learning). Lighthouse desktop Perf 82-99, A11y 96-100, SEO env-gated (100 in prod), Best Practices deferred to SCAFFOLD-AUDIT (Tech Debt #29-#32). `migrations.status` unchanged at `content_complete` — STATIC-1 is chrome work, not a state transition.

**Prior: MYGRATR-CONTENT-1E** — CLOSED (May 2026). Webflow w-embed recovery (Tech Debt #25). 79 docs patched (49 blogPost + 27 compareBlog + 3 customerStory); 149 embeds recovered (142 tables + 7 videoEmbeds); 9 deduped-to-canonical Webflow mirrors skipped with audit log. Schema additions: `videoEmbed` + `table` Portable Text types. B3 PortableText renderers ship for both. `parseVideoUrl` extended for LinkedIn.

**Prior: MYGRATR-TEMPLATE-BLOG** — CLOSED (May 2026, all 3 HALTs landed). Pattern-establishing first detail-page template; SEO 100 + A11y 96 Lighthouse acceptance; BvR ledger #37–#46; Tech Debt #21–#32 opened (predominantly SCAFFOLD-AUDIT scope).

**Next:** Tier-1 remaining detail templates per `docs/DESIGN_EXECUTION_ROADMAP.md` — Session A (Customer Story + Download Thank You), then Service, then Technology. Event parked (no design export). **CLOSED Jul 2026 since REVIEW, all via `docs/templates/TEMPLATE_FIDELITY_LOOP.md`:** **TEMPLATE-VIDEO** (`/videos/[slug]` + UK, 32 docs, VideoObject JSON-LD; commit `f6729d3`), **TEMPLATE-DOWNLOAD + TEMPLATE-TOOL** (`/downloads/[slug]` + UK 5 docs with FaqList, `/tools/[slug]` + UK 2 docs with Loom embeds; commit `8a0e3b2`), **TEMPLATE-BOOK_A_CALL + TEMPLATE-COMPARE** (`/book-a-call/[slug]` + UK 6 docs with self-loading Calendly inline embed, `/compare/[slug]` + UK 30 docs; commit `b85091b`) + header Schedule-a-Call CTA arrow fix (`8a7b660`). **MYGRATR-TEMPLATE-REVIEW CLOSED (Jul 2026).** `/reviews/[slug]` + `/uk/reviews/[slug]` — **11 published** reviews × 2 locales (not 26 — 15 deleted in CONTENT-1D drift cleanup). **MYGRATR-TEMPLATE-TEAM_MEMBER CLOSED (Jul 2026)** — reconciliation complete; fidelity reference for simple detail templates. `/team/[slug]` + `/uk/team/[slug]` — 28 members × 2 locales, dark/lime, Tier-1 SEO complete (Person JSON-LD, twitter card, sitemap). DESIGN-1 Brief B Steps 7, 9, 10, 11 still pending in parallel; they don't block template-* phases.

**MYGRATR-DESIGN-1 Brief A (Steps 4 + 5)** — CLOSED
**MYGRATR-DESIGN-1 Brief B Step 6** — CLOSED (HALT 1)
**MYGRATR-DESIGN-1 Brief B Step 8** — CLOSED (HALT 3)
**Steps 7, 9, 10, 11 of DESIGN-1 pending** — per-template reference docs (Step 7), capability-log finalisation (Step 9), verifier (Step 10), final phase close (Step 11). **Step 8 closed before Step 7 due to phase-2 reordering — do not assume sequential closure.**

`migrations.status` unchanged at `content_complete` — DESIGN-1 + TEMPLATE-* phases do not transition state. State transitions resume at QA-1 / LAUNCH.

| Phase | Name | Status |
|---|---|---|
| MYGRATR-0 | Foundation | ✅ Complete |
| MYGRATR-AUDIT-1 | Site Audit Agent | ✅ Complete |
| MYGRATR-SCHEMA-0 | Schema Design Lock | ✅ Complete |
| MYGRATR-SCHEMA-1 | Sanity Schema Design | ✅ Complete |
| MYGRATR-SCAFFOLD-1 | Next.js Scaffold | ✅ Complete |
| MYGRATR-CONTENT-1A | Content Migration — flat collections | ✅ Complete |
| MYGRATR-CONTENT-1B | Content Migration — reference-light | ✅ Complete |
| MYGRATR-CONTENT-1C | Content Migration — blogs/compare/tech/services/stories | ✅ Complete |
| MYGRATR-CONTENT-1D | Meta backfills + carryover fixes + content_complete | ✅ Complete |
| MYGRATR-CONTENT-1D-CLEANUP | Migrator-pattern null-literal cleanup | ✅ Complete |
| **MYGRATR-DESIGN-1** | **Design System (Tokens, Primitives, Complex Specs, Storybook, v0 Template, Fidelity, Visual Editing)** | 🚧 **In progress — Steps 1-6 + Step 8 closed (Brief B Step 6 = HALT 1; Brief B Step 8 = HALT 3); Steps 7, 9, 10, 11 pending** |
| **MYGRATR-TEMPLATE-BLOG** | **Pattern-establishing first detail-page template (route + GROQ/Zod + template + JSON-LD)** | ✅ **Complete (May 2026)** |
| **MYGRATR-TEMPLATE-TEAM_MEMBER** | **Team member detail page (`/team/[slug]` + UK mirror; Person JSON-LD; author articles section)** | ✅ **Complete (Jul 2026)** |
| **MYGRATR-TEMPLATE-REVIEW** | **Review detail page (`/reviews/[slug]` + UK mirror; Review JSON-LD; related reviews grid; 11 published docs)** | ✅ **Complete (Jul 2026)** |
| **MYGRATR-CONTENT-1E** | **Webflow w-embed recovery (videoEmbed + table PortableText types; post-phase patch on closed CONTENT-1C migration)** | ✅ **Complete (May 2026)** |
| **MYGRATR-STATIC-1** | **Site chrome: Header + Footer + 16 hub routes + 404 page (Sanity-driven, full a11y + SEO + JSON-LD)** | ✅ **Complete (May 2026)** |
| **MYGRATR-STATIC-2** | **Chrome schema extensions + reseed (mega-menu shapes, footer restructure, tagline backfill on service+technology, audit-driven brief refinement)** | ✅ **Complete (May 2026)** |
| **MYGRATR-STATIC-3** | **Chrome visual rebuild (Header + mega-menus + Footer + announcement bar; Steps 3-6 closed Jul 2026)** | ✅ **Complete** |
| **MYGRATR-TEMPLATE-VIDEO** | **Video detail (`/videos/[slug]` + UK; VideoObject JSON-LD; 32 docs)** | ✅ **Complete (Jul 2026)** |
| **MYGRATR-TEMPLATE-DOWNLOAD** | **Download detail (`/downloads/[slug]` + UK; FaqList; 5 docs)** | ✅ **Complete (Jul 2026)** |
| **MYGRATR-TEMPLATE-TOOL** | **Tool detail (`/tools/[slug]` + UK; Loom embeds; 2 docs)** | ✅ **Complete (Jul 2026)** |
| **MYGRATR-TEMPLATE-BOOK_A_CALL** | **Book-a-call detail (`/book-a-call/[slug]` + UK; self-loading Calendly inline embed; 6 docs)** | ✅ **Complete (Jul 2026)** |
| **MYGRATR-TEMPLATE-COMPARE** | **Compare detail (`/compare/[slug]` + UK; 30 docs)** | ✅ **Complete (Jul 2026)** |
| MYGRATR-TEMPLATE-CUSTOMER_STORY / SERVICE / TECHNOLOGY / DOWNLOAD_THANK_YOU | Detail templates — **BUILT AND COMMITTED**, contrary to the "Planned" this row used to claim. Routes, Sanity queries and JSON-LD all ship; `site/src/components/templates/{service,technology,customer-story,download-thank-you}/`. Not yet through TEMPLATE_FIDELITY_LOOP against the D3 designs. | ✅ Built (fidelity pass outstanding) |
| MYGRATR-TEMPLATE-* (remaining) | EVENT (no design export), plus the STATIC marketing pages enumerated by the parity gate (`/about-us`, `/contact`, `/for-developers`, `/pricing`, `/our-work`, `/alternatives`, 16 UK hubs, …) | Planned — see Phase 2 |
| MYGRATR-QA-1 | Visual + Structural QA | Planned |
| MYGRATR-LAUNCH | Cutover + Redirects | Planned |
| MYGRATR-MONITOR-1 | Post-cutover SEO | Planned |

## First Customer: Cloud Employee

### Site + locales

- Source: Webflow (cloudemployee.io)
- Target: Next.js + Sanity, hosted on Vercel
- Staging: staging.jakevibes.dev
- Locales: US (default) + UK (`/uk/` prefix); PH locale discontinued — Geotargetly routes to talent.cloudemployee.io

### Persistent IDs + URLs

- CE org_id: `ce000000-0000-0000-0000-000000000001`
- CE migration_id: `ce000000-0000-0000-0000-000000000002`
- Webflow site ID: `673326831abed6267051fa11`
- Sanity project: `lzbhll1u` (dataset `production`)
- Sanity Studio: `https://mygratr-cloudemployee.sanity.studio/`
- Vercel main app: `https://mygratr-c3utcgloa-cloud-employee.vercel.app` (preview-protected)
- Vercel Storybook: `https://mygratr-cloud-employee-storybook.vercel.app` (Standard Protection)
- `audit_manifests` row: `708d9d52-7721-4c8d-bc78-a6e31ffb3225`
- Third-party IDs: GTM `GTM-WL45TCTW`, GA4 `G-2Q22ZM5PLY`, LinkedIn `4901289`, HubSpot portal `22809822`

### Migration status

`migrations.status = content_complete` — Sanity dataset hydrated with 388 CMS docs across 21 types (CONTENT-1A/1B/1C/1D). DESIGN-1 operates against the `content_complete` baseline and does not transition state (per brief §0). Transitions resume at TEMPLATE-* / QA-1 / LAUNCH.

### History

For phase-by-phase milestone state (audit data, schema build, content migration, scaffold, design system Steps 1–5), see `PHASE_HISTORY.md`. For productisation IP across phases, see `docs/CAPABILITY_LOG.md`. For per-phase narrative summaries, see `CHANGELOG.md`.

**Design system state (as of MYGRATR-DESIGN-1 Brief B Step 8 close — HALT 3):**
- 30 stories on disk: 25 primitive (`site/src/components/ui/{name}/stories.tsx`) + 5 Tier-1 scaffold-stage (`site/src/components/tier-1/{slug}.stories.tsx`).
- Storybook 10.3.6 live on Vercel (Standard Protection): `https://mygratr-cloud-employee-storybook.vercel.app`.
- v0.dev prompt template at `docs/V0_PROMPT_TEMPLATE.md` + 3 worked examples at `docs/templates/_examples/`.
- UI_STRINGS lint rule live — 2-rule architecture (`react/jsx-no-literals` + project-local `local/no-conditional-strings-in-jsx`); canonical SoT at `tools/eslint/ui-strings.json` (14 keys); generated `site/src/lib/ui-strings.ts` (do-not-edit; `npm run generate-ui-strings`).
- Visual Editing wiring complete — single-client architecture (collapsed from SCAFFOLD-1's two-client baseline per CMA-C2 / D4); `defineLive` with viewer-scoped `serverToken` at `site/src/lib/sanity/live.ts`; six-step security order on `/api/draft-mode/enable` (GET) with allow-list + Sanity-null-origin escape hatch (`hasSanityPreviewSignature` 3-param signature) + secret + same-origin redirect; dual Origin+Referer check on `/api/draft-mode/disable` (POST); strict zod env schema (`.url()` / `.min(1)` / conditional required-in-prod refinement) at `site/src/lib/env.ts`.
- `CONVENTIONS.md` "UI_STRINGS Rule (post-DESIGN-1 Brief B)" section live (212 lines). 4 new/revised CONVENTIONS sections at Step 8 close: "Draft-Mode Route Hardening" (Entry 3 rewrite), "Sanity Fetch Pattern" (Entry 2), "Env Schema Strictness" (Entry 4), "Visual Editing Method Probe Discipline" (Entry 5).
- `docs/CAPABILITY_LOG.md` DESIGN-1 H2 extended at Step 8 close: "Visual Editing infrastructure" sub-section filled with 8 productisation patterns + new "ESLint rule adoption methodology" sub-section (6 patterns) + new "Pattern 13 — Defensive code, tests, and probes need their own audit lens" sub-section (4 sharpening layers) + "Customer-2 reusability assessment" extended with Step 8 additions.
- 3 brief-vs-reality findings discovered + resolved during Step 8: BvR #34 (canonical-vs-serving-origin), BvR #35 (Sanity null/null Origin+Referer), BvR #36 (STEP 4 defense-in-depth coverage gap).
- §8.7 integration test coverage: 9 of 10 curl tests PASS (a/b/d.1-4/d.5a/b/e); test (c) STEP 4 not exercisable end-to-end per BvR #36 (defense-in-depth posture, Tech Debt #20). Manual round-trip PASS against real Sanity Presentation flow. Smoke test artifact at `audit-output/design-1/visual-editing-smoke-test.md` per D15.
- `migrations.status` unchanged at `content_complete`; DESIGN-1 does not transition state.
- Brief B Step 7 (per-template reference docs) drafting begins next session.
- Per-step narrative (Steps 1, 2, 3, 4, 5, 6, 8): see PHASE_HISTORY.md DESIGN-1 entries.

## Tech Stack

| Layer | Choice |
|---|---|
| Language | TypeScript (strict) |
| Runtime | Node.js |
| Database | Supabase (mygratr, Singapore) |
| Target CMS | Sanity |
| Generated sites | Next.js 16 + Tailwind |
| Hosting | Vercel |
| QA Agent | Playwright + pixelmatch + Claude vision |
| Source readers | Webflow API v2 + Firecrawl |

## Supabase

- Project: mygratr
- URL: https://xpzrhzfzppypxbipvyzm.supabase.co
- Region: ap-southeast-1 (Singapore)
- RLS: enabled on all tables
- org_id on every table

## Environment Variables

| Variable | Description |
|---|---|
| WEBFLOW_API_TOKEN | Webflow read-only API token |
| WEBFLOW_SITE_ID | 673326831abed6267051fa11 |
| SUPABASE_URL | https://xpzrhzfzppypxbipvyzm.supabase.co |
| SUPABASE_SERVICE_ROLE_KEY | In .env — never commit |
| FIRECRAWL_API_KEY | In .env — never commit |
| ANTHROPIC_API_KEY | In .env — required for Steps 4 and 7 (Claude Opus 4.7) |
| HUBSPOT_ACCESS_TOKEN | In .env — private app token with `forms` scope (AUDIT-1) |
| HUBSPOT_PORTAL_ID | In .env — CE HubSpot portal ID (AUDIT-1) |
| AHREFS_API_KEY | In .env — REST v3 key for SEO baseline (AUDIT-1) |
| SANITY_PROJECT_ID | In .env — for SCHEMA-1 |
| SANITY_DATASET | In .env — for SCHEMA-1 |
| SANITY_API_TOKEN | In .env — legacy; SCHEMA-lane seed scripts only |
| SANITY_MIGRATION_WRITE_TOKEN | In .env — least-privilege migration write token (rotated 2026-05-03 to `mygratr-templates-write` per Tech Debt #15). Single-dataset (`production`) scope; permits document patch/delete + asset upload only. |
| SUPABASE_DB_URL | In .env — Postgres direct URL (migrations) |
| NEXT_PUBLIC_SANITY_PROJECT_ID | In `site/.env.local` — Sanity project ID for the Next.js app (`lzbhll1u`) |
| NEXT_PUBLIC_SANITY_DATASET | In `site/.env.local` — Sanity dataset (`production`) |
| NEXT_PUBLIC_SITE_URL | In `site/.env.local` — public site URL for canonical/hreflang generation |
| NEXT_PUBLIC_SANITY_STUDIO_URL | In `site/.env.local` — Studio URL for stega click-to-edit links |
| SANITY_API_READ_TOKEN | In `site/.env.local` — read token. **DESIGN-1 retasks this as `serverToken` on `defineLive({ client, serverToken })` per CMA-C2 — single-client architecture replaces SCAFFOLD-1's `previewClient` split.** |

## Repo Structure

| Path | Purpose |
|---|---|
| /CLAUDE.md | This file — read first |
| /CONVENTIONS.md | Code patterns and naming rules |
| /CHANGELOG.md | One paragraph per completed phase |
| /PHASE_HISTORY.md | Detailed phase records |
| /docs/SCHEMA.md | Database schema source of truth |
| /docs/FEATURE_MAP.md | Feature → file mapping |
| /docs/CAPABILITY_LOG.md | Per-phase productisation IP — patterns Jake learns, frameworks, debugging approaches |
| /docs/context/REGISTRY.md | Growing lists — tables, routes, scripts, components |
| /docs/design/COMPONENTS.md | DESIGN-1 Step 2 — single-source primitive inventory for Step 4 template authors |
| /docs/design/TOKENS.md | DESIGN-1 Step 1 — per-token catalogue + provenance |
| /docs/briefs/active/ | Current session brief |
| /docs/briefs/archive/ | Completed session briefs |
| /docs/SKILLS/ | Reusable Claude skill definitions (post-phase-update, etc.) |
| /audit-output/ | Audit artefacts (gitignored — contains PII) |
| /audit-output/design-1/ | DESIGN-1 probe outputs + capability-log running draft |
| /scripts/ | One-off run scripts (Webflow, Firecrawl bootstrap) |
| /scripts/audit/ | Full audit pipeline (14 steps + 3 orchestrators) |
| /scripts/scaffold/ | Scaffold scripts: extract-redirects + start/complete phase |
| /scripts/schema/ | Schema seed + record + phase-transition scripts |
| /scripts/content/ | Content migration scripts (per-collection migrators + verify) |
| /scripts/design/ | DESIGN-1 probe scripts + sprite generation + verification |
| /src/orchestrator/ | Job runner and phase orchestration |
| /src/lib/adapters/webflow/ | WebflowAdapter (AUDIT-1 uses REST directly pending adapter) |
| /src/lib/content/ | Content migration lane: webflow read-client, sanity write-client, migration tracker, CE collection IDs |
| /src/lib/types.ts | Domain types + Zod schemas |
| /src/lib/audit-types.ts | Audit pipeline enums and interfaces |
| /studio/ | Sanity Studio v5 (project lzbhll1u, dataset production) |
| /site/ | Customer-facing Next.js 16 app (Vercel root directory) |
| /site/src/components/ui/ | DESIGN-1 Step 2 — 22 primitives + Icon foundation (folder-per-primitive) |
| /site/src/components/ui/_icons/ | Icon sprite source-of-truth + typed `IconName` union |
| /site/src/components/ui/_utils/ | Primitive-internal helpers (`cn`, etc.) |
| /site/src/app/demo/ | DESIGN-1 Step 2 — kitchen-sink primitive showcase (production-guarded) |
| /site/src/app/tokens.css | DESIGN-1 Step 1 — design tokens (Tailwind v4 CSS-first) |
| /site/src/lib/redirects/ | Auto-generated tracked redirect tables (do not hand-edit) |

## Architecture Rules — Non-Negotiable

1. **TypeScript only.** No Python. No shell scripts for logic.
2. **Adapter pattern for all CMS interactions.** No direct Webflow API calls outside `src/lib/adapters/`.
3. **Migrations before code.** Verify SQL runs in Supabase before writing dependent code.
4. **org_id on every table, every query.** No exceptions.
5. **assertValidTransition() before every status update.** No silent phase jumps.
6. **Artefact storage split.** Supabase stores paths. Filesystem stores blobs.
7. **Config maps over conditionals.** No `if (sourceType === 'x')` branches.
8. **Never recreate existing database functions.** Check REGISTRY.md first.
9. **CE-specific values in env or seed data only.** Never hardcoded in lib logic.
10. **Git commit after every working step.** Not at end of session.
11. **If Claude Code needs to make an architecture decision not covered by the brief: STOP and ask.**

## Session Lanes — Stay In Your Lane

| Session Type | Touches | Never Touches |
|---|---|---|
| AUDIT | `/src/lib/adapters/`, `/scripts/`, `audit_manifests` table | QA agent code, template code |
| SCHEMA | `/src/lib/schema/`, `schema_designs` table | Adapter code, QA agent code |
| SCAFFOLD | Generated Next.js site repo | Orchestrator, adapter code |
| CONTENT | `/src/lib/content/`, `content_migrations` table | Template builds, QA agent code |
| BUILD | Template files in generated site | Orchestrator, adapter code |
| QA | `/src/lib/qa/`, `qa_runs` table | Template code, adapter code |
| LAUNCH | `/src/lib/launch/`, `redirects`, `launches` tables | All build/QA code |
| INFRA | Orchestrator, shared types, Supabase schema | Phase-specific lib code |

**If unsure which lane applies: stop and ask before writing any code.**

## Key Conventions

- TypeScript strict mode — no any types
- Zod for all external data validation
- Every Supabase query includes org_id filter
- RLS always on — service role only for migrations and admin scripts
- Git commit after every working step
- Adapter pattern: all CMS interactions through CmsAdapter interface — see CONVENTIONS.md §2
- Phase transitions: always call assertValidTransition() — see CONVENTIONS.md §2
- Artefact storage: Supabase stores paths, filesystem stores blobs — see CONVENTIONS.md §2
- See CONVENTIONS.md for full patterns
- See REGISTRY.md for all tables, templates, and routes

## Hard Rules — Never Violate

- No CE-specific values hardcoded in lib logic (domains, org IDs, site IDs belong in env or seed data)
- No queries without org_id filter
- No CMS API calls outside the adapter
- No phase status updates without assertValidTransition()
- No template build started without audit screenshots confirmed
- No cutover without redirect parity verified (manifest page count = redirect record count)
- No em-dashes in code, copy, or content - use hyphens (applies to design output and all authored text)

## Debugging Rules

- **Never diagnose and fix in the same session.** Diagnosis sessions explore.
  Execution sessions implement. Mixing them causes speculative fixes.
- If a fix attempt fails, do NOT retry the same approach. Write `DEBUG_CONTEXT.md`
  to the repo root: the bug, what was tried, why it failed, current best hypothesis.
- If the same approach is tried twice and fails twice, that approach is a confirmed
  dead end. Log it and never retry it.
- After 2 failed fix attempts on the same bug: **STOP.** Do not improvise a third attempt.
- Every fix must be verified against CONVENTIONS.md before execution. If the fix
  introduces a pattern not in CONVENTIONS.md, that is a blocker — not a note.
- `DEBUG_CONTEXT.md` is temporary. Delete it after the bug is resolved.

## Post-Phase Checklist

After every phase, update in this order:
1. `CHANGELOG.md` — one paragraph: what shipped, what exists
2. `PHASE_HISTORY.md` — detailed record, files created, patterns established, data state
3. `CONVENTIONS.md` — any new patterns that emerged
4. `FEATURE_MAP.md` — new feature entries; update modified feature entries
5. `CLAUDE.md` — phase status, new routes, env vars
6. `SCHEMA.md` — if any migrations ran (do this immediately after migration, before writing dependent code)
7. `REGISTRY.md` — update table, template, and script registries
8. Post-phase code audit — fresh chat, load codebase, verify nothing broken

Only after ALL of the above are complete do you start planning the next phase.

## Known Tech Debt

| # | Source | Description | Fix In |
|---|--------|-------------|--------|
| 1 | MYGRATR-0 | `src/lib/types.ts` is a single flat file — will need splitting by domain once QA and template types are added | MYGRATR-SCAFFOLD-1 |
| 2 | AUDIT-1 | AUDIT-1 called Webflow REST directly instead of using `CmsAdapter` — the adapter interface was not ready. Adapter must wrap Webflow v2 calls before CONTENT-1. | MYGRATR-SCAFFOLD-1 |
| 3 | AUDIT-1 | Firecrawl v4 SDK was bypassed in favour of direct REST calls — align once we upgrade to the new `Firecrawl` / `FirecrawlClient` class. | MYGRATR-CONTENT-1 |
| 4 | AUDIT-1 | Ahrefs account subscription doesn't include cloudemployee.io — baseline snapshot is empty. Needs Ahrefs plan verification before MONITOR-1. | MYGRATR-MONITOR-1 |
| 5 | AUDIT-1 | Nav Technology dropdown merged into Services in `ce-global-components.json` — selector tweak needed before nav is built. | MYGRATR-SCAFFOLD-1 |
| 6 | AUDIT-1 | Playwright `networkidle` times out on Vimeo-embedded video pages (2 captures failed across runs). Switch to `domcontentloaded` for VIDEO template. | MYGRATR-QA-1 |
| 7 | AUDIT-1 | Step 3e `semi_global` count (745+) is inflated because the global-script 80%-of-pages threshold misses scripts that appear on most but not all templates. Consider lowering to 60% or moving more patterns into the explicit `SCRIPT_PATTERNS` list. | MYGRATR-CONTENT-1 |
| 8 | AUDIT-1 | ~~HubSpot access token lacks `automation` scope - workflow cross-reference returned nothing.~~ **RESOLVED Jul 2026 (forms launch track).** Scope granted on the `CE Website` Service Key. `npm run hubspot:audit-forms` now reads workflows for real: 120 exist, 55 enabled. The April audit's `connectedWorkflowIds: []` on every form was the artifact this entry predicted. Material finding: HubSpot **already** notifies Slack for book-a-call and several forms, while the Contact form's Slack workflow is switched off. Evidence in `docs/hubspot-form-audit.md`. | ✅ RESOLVED |
| 9 | AUDIT-1 | 4 canonical URLs remain `UNKNOWN` (Cloudflare challenge script, sitemap.xml, hash URL, `/uk/embedding`). Step 1 content-type filter should drop the first three. | MYGRATR-CONTENT-1 |
| 10 | SCHEMA-1 | Legacy `MigrationStatus` enum in `src/lib/types.ts` uses shortform values — conflicts with canonical string-literal union in `src/lib/pipeline/state-machine.ts`. Needs consolidation. | ✅ Resolved in MYGRATR-CONTENT-1A |
| 11 | SCHEMA-1 | `TemplateType` conflict between string-literal and enum representations across `src/lib/types.ts` and `src/lib/audit-types.ts`. | ✅ Resolved in MYGRATR-CONTENT-1A |
| 12 | CONTENT-1A | Direct Postgres connection from scripts is broken — pooler auth fails with `Tenant or user not found` at both 5432 and 6543, and `db.<ref>.supabase.co` doesn't resolve. REST writes work fine. Means future DDL needs the Supabase SQL editor. Rotate `SUPABASE_DB_URL` so scripts can apply schema changes again. | MYGRATR-INFRA |
| 13 | CONTENT-1D | All 101 `technology` docs hold `associatedTechnologies: []` (CONTENT-1C migrator wrote a service-only field on the wrong type). Inert — Sanity tolerates extra fields silently and the value is empty. Resolution: one-shot `unset(['associatedTechnologies'])` patch on technology docs. | MYGRATR-TEMPLATE-* |
| 14 | CONTENT-1D | ~~Service docs surface "Invalid property value" warnings in Studio for null-valued optional image fields. Inert — null is acceptable for optional fields, but Studio's strict validation flags them.~~ **RESOLVED 2026-05-02 via CONTENT-1D-CLEANUP (DEV-6).** Investigation surfaced the migrator-pattern root cause (uploadImage() returns null when Webflow source is empty; CONTENT-1A/1B/1C migrators wrote null literal rather than omitting via conditional spread). 4 cleanup ops applied across service / technology / customerStory: 158 top-level + 100 nested unsets. CONVENTIONS.md updated with the conditional-spread rule + path-patch primitive to prevent recurrence. See PHASE_HISTORY.md "MYGRATR-CONTENT-1D-CLEANUP" entry. | ✅ RESOLVED |
| 15 | CONTENT-1D | ~~`SANITY_MIGRATION_WRITE_TOKEN` rotation. Token used by all CONTENT-1D migration writes; carries document patch/delete + asset upload permissions.~~ **RESOLVED 2026-05-03** — rotated to `mygratr-templates-write` (least-privilege replacement). New token committed to `.env`; old token revoked in Sanity dashboard. | ✅ RESOLVED |
| 16 | CONTENT-1D-CLEANUP | `customerStory.companyLogo` required-field violation on 1 doc (`customerStory-68754c657697d163dd1a6126` — "Travel Tech Client", an anonymised real customer with substantive narrative + live URL, not a placeholder). Webflow source 16/17 populated; the 1 missing item is intentionally anonymised — no logo exists. Schema declares `Rule.required()` and the doc holds null literal — Studio shows hard validation error on save. **Recommended direction: schema-side fix** — relax `Rule.required()` to optional + add a template fallback (anonymised-customer placeholder logo) for any doc where companyLogo is absent. Don't backfill data (no logo to backfill); don't delete the doc (real production content). | MYGRATR-TEMPLATE-* / separate cycle |
| 17 | CONTENT-1D-CLEANUP | **10 doc types with image fields not yet scanned for the same migrator-pattern null-literal issue addressed in CONTENT-1D-CLEANUP for {service, technology, customerStory}.** Specific types and their image fields (per `studio/schemas/documents/*.ts` and `docs/WEBFLOW_TO_SANITY_FIELD_MAP.md`): **`teamMember`** (teamMemberImage), **`review`** (memberImage, companyLogo, thumbnailImage), **`video`** (backupImage), **`download`** (headerFooterImage, metaThumbnail), **`tool`** (thumbnail), **`event`** (featuredImage, thumbnailImage), **`benefitValue`** (thumbnailImage), **`staffBenefit`** (icon), **`blogPost`** (thumbnailImage, openGraphImage), **`compareBlog`** (thumbnailImage, openGraphImage). Plus `openGraphImage` on every type that uses `metaFields()` with default `og: true`. Doc types EXPLICITLY OUT of scope (no image fields per schema): bookACall, glassdoorReview, tag, blogCategory, downloadAccess, privacyPolicyPage. **Specific scan that closes the loop:** extend `scripts/content/diag-1d-cleanup-scope.ts` to cover the 10 types listed above with their image fields (top-level + nested where applicable — e.g. video has none nested; event has none nested; review has none nested; the others are top-level only). Closure verdict: a single scan-run reporting zero null-literal entries across all 10 types. Any non-zero finding triggers a CONTENT-1D-CLEANUP-2 phase with the same op-pattern (per-doc literal-null-guarded `.unset()` patches + audit-trail rows). The CONVENTIONS.md "Migrator Field-Write Pattern — Conditional Spread" rule prevents new migrators from reintroducing the bug for customer 2+. | MYGRATR-TEMPLATE-* / pre-launch |
| 18 | DESIGN-1 Brief B Step 8 F11 v2.1 | Disable UI must set `Referrer-Policy: strict-origin-when-cross-origin` (or stricter same-origin policy). Without it, browsers that strip the Referer header (Referrer-Policy: no-referrer, privacy extensions, sandboxed iframes) cannot exit draft mode via the UI — fallback is manual cookie deletion. | MYGRATR-TEMPLATE-* |
| 19 | DESIGN-1 Brief B Step 8 BvR #35 follow-up | Brief B v2.2 §8.7 manual round-trip smoke test as specified did not surface the null-Origin/null-Referer case. Customer 2 brief authoring + future Mygratr phase briefs should include explicit DEBUG-logging probe step BEFORE the integration tests fire to capture real-client request shape against the allow-list construction. The probe artifact under `audit-output/design-1/` is the auditable evidence the discipline was followed. | Customer 2 brief authoring + future Mygratr phase briefs |
| 20 | DESIGN-1 Brief B Step 8 BvR #36 | STEP 4 same-origin check is defense-in-depth; no end-to-end integration test exists due to `@sanity/preview-url-secret` API constraints (library reads `sanity-preview-pathname`, not `redirectTo` query param). Optional future work: synthetic unit test or library upgrade-monitoring. | Future testing-infra phase |
| 21 | TEMPLATE-BLOG HALT 2 / BvR #45 | Finsweet `@2` ESM contract change. SCAFFOLD-1 pinned `@finsweet/attributes@2` when v1 was UMD-compatible; v2 rewrite (post-Aug 2024) shipped as ESM-only. Currently fixed via `type="module"` patch in `third-party-scripts.tsx`. Cosmetic side effect: yellow "preload credentials mode mismatch" browser warning post-fix (preload auto-generated for classic-script, mismatched against module-script request — script still loads + executes correctly). Future SCAFFOLD-AUDIT should review whether v2's actual feature set (list-combine + list) is needed sitewide, or if per-page v1 modules per CE's source pattern is better architecture; suppress preload via `crossOrigin` attr or directive remove | MYGRATR-SCAFFOLD-AUDIT |
| 22 | TEMPLATE-BLOG HALT 2 / BvR #37 | `env.ts` split into `env-client.ts` / `env-server.ts` for primitive-safe public-vars import. Current inline `process.env.NEXT_PUBLIC_*` reads in `site/src/components/ui/image/index.tsx` are a bridge — importing `env.ts` (which validates server-only vars at module load) breaks client bundles. The split lets primitives import a validated public-vars module without dragging in server-only validation | MYGRATR-SCAFFOLD-AUDIT |
| 23 | TEMPLATE-BLOG HALT 2 / BvR #41 | Script-tag warning chronic since SCAFFOLD-1 + Next 16 + React 19 (`<GeoTargetlyScript>` + `<GtmHeadScript>` mounted inside `<head>` JSX in root layout). Option A (move to `<body>`) was proposed + reverted at HALT 2 (load-bearing zero — preserved history clean). Investigate in SCAFFOLD-AUDIT | MYGRATR-SCAFFOLD-AUDIT |
| 24 | TEMPLATE-BLOG HALT 2 | ~~Sitewide Header + Footer components — SCAFFOLD-1 shell gap.~~ **RESOLVED via MYGRATR-STATIC-1 + STATIC-3.** Header, footer, and announcement bar now ship sitewide from root layout. | ✅ RESOLVED |
| 25 | TEMPLATE-BLOG HALT 2 + 3 | ~~CONTENT-1E: Webflow w-embed recovery. CONTENT-1C migration used `@sanity/block-tools.htmlToBlocks` which is blind to content inside `<div class="w-embed">` wrappers — that's how Webflow ships free-form HTML/CSS embeds (videos, tables, custom widgets). Confirmed loss patterns: (a) Vimeo videos flattened/absent; (b) data tables flattened to single paragraph (e.g. `content[72]` on onboarding-latam doc = "Checkpoint Metric Target Week 1–2 …" running text). Recovery requires: re-scrape Webflow source, add `videoEmbed` + `table` schema types, add B3 renderers. CONTENT-1E pre-flight should sweep audit corpus for ALL `<div class="w-embed">` instances and classify by inner shape before designing schema additions. ~10–30 docs affected (sweep confirms exact). Runs BEFORE CUSTOMER_STORY template phase. Full diagnosis at `audit-output/template-blog/rich-text-gap-analysis.md`~~ **RESOLVED 2026-05-14 via MYGRATR-CONTENT-1E.** Selector correction at Checkpoint 1: Webflow's RichText API returns `<div data-rt-embed-type='true'>` wrappers (single-quote form) — the `w-embed` CSS class only exists on the published Webflow site, not in the CMS HTML. Original CONTENT-1C diagnosis (and this Tech Debt entry's text above) used the wrong selector; corrected at CONTENT-1E HALT 1 before any schema/migrator work. Scope was 3-8× the original 10-30 estimate (88 sweep docs / 167 embeds). Final outcome: 79 docs patched (49 blogPost + 27 compareBlog + 3 customerStory); 149 embeds recovered (142 tables + 7 videoEmbeds); 9 deduped-to-canonical Webflow mirrors skipped with audit log; 0 orphans. See PHASE_HISTORY.md "MYGRATR-CONTENT-1E" entry. | ✅ RESOLVED |
| 26 | TEMPLATE-BLOG HALT 2 | V1 per-page Finsweet modules (cmsfilter, modal, a11y) not currently loaded by Next.js scaffold. SCAFFOLD-1 only wired the v2 sitewide bundle. Affects feature parity for templates that depend on these modules (likely TECHNOLOGY, SERVICE, HOME filtering UX). Investigate at SCAFFOLD-AUDIT or in pre-LAUNCH feature-parity sweep | MYGRATR-SCAFFOLD-AUDIT / pre-LAUNCH |
| 27 | TEMPLATE-BLOG HALT 2 | Sanity image preload tuning — Next.js auto-emitted preload for hero image carries `as="script"` (or similar mismatch with module-script request). Minor perf-hint warning; not blocking. Post-LAUNCH polish | Post-LAUNCH |
| 28 | TEMPLATE-BLOG HALT 3 / BvR #46 | B3 PortableText h5/h6 handler diagnostic-trail entry. Fix landed in HALT 3 (5-line addition to `block:` components map), but the surfacing context (rich-text gap audit identified 51 h5 + 18 h6 instances falling through to `unknownBlockStyle`) is preserved here for future-phase reference. **Closed-on-commit alongside the fix.** Diagnosis at `audit-output/template-blog/rich-text-gap-analysis.md` | ✅ RESOLVED at HALT 3 |
| 29 | TEMPLATE-BLOG HALT 3 Lighthouse | SCAFFOLD-AUDIT: Third-party script performance budget. Lighthouse Performance score 79 (target 90) traced to 770ms TBT caused by sitewide third-party script load (GTM + GA4 + LinkedIn Insight + HubSpot + Hotjar + Facebook Pixel + Calendly + GSAP + Swiper + Finsweet). Fix: lazy-load + script audit + necessity review per template phase. Out of TEMPLATE-BLOG scope | MYGRATR-SCAFFOLD-AUDIT |
| 30 | TEMPLATE-BLOG HALT 3 Lighthouse | SCAFFOLD-AUDIT: Third-party cookie hygiene. 13 third-party cookies set sitewide from marketing pixels. Best Practices score impact. Review per CSP + consent management strategy at SCAFFOLD-AUDIT phase | MYGRATR-SCAFFOLD-AUDIT |
| 31 | TEMPLATE-BLOG HALT 3 Lighthouse | SCAFFOLD-AUDIT: ClaraChatBot widget WCAG AA contrast violation on chat-launcher pill (`cb-pill-text`, 2.51:1 vs 4.5:1 required). Vendor-side issue, surfaced sitewide. Options: CSS override (fragile, breaks on vendor updates), vendor support request, or widget replacement. Review in SCAFFOLD-AUDIT phase | MYGRATR-SCAFFOLD-AUDIT |
| 32 | TEMPLATE-BLOG HALT 3 Lighthouse | TEMPLATE-* image strategy: blog hero aspect-ratio mismatch. `thumbnailImage` source is 1200×628 (ratio 1.91:1, matches OG spec). Hero container forces `aspect-[16/9]` (ratio 1.78), resulting in clean object-cover crop but Lighthouse `image-aspect-ratio` audit warning (1-point Best Practices weight). Three resolution options documented in `audit-output/template-blog/lighthouse-checkpoint-c.md`. Defer to SCAFFOLD-AUDIT or a dedicated image-strategy review when TEMPLATE-* phase patterns reveal whether 16:9 should be enforced template-side or whether Sanity images should be re-cropped at source | MYGRATR-SCAFFOLD-AUDIT or dedicated image-strategy phase |
| 33 | CONTENT-1E post-phase audit | `docs/SCHEMA.md` version-history table is missing rows for CONTENT-1B / 1C / 1D / 1D-CLEANUP — pre-existing staleness surfaced by CONTENT-1E post-phase audit. Backfill pre-launch. (Not blocking; SCHEMA-1 build records exist in PHASE_HISTORY.md and CHANGELOG.md.) | Pre-launch |
| 34 | STATIC-1 Step 3 | ~~Footer social icons schema gap.~~ **RESOLVED 2026-05-17 via MYGRATR-STATIC-2.** Confirmed by Jake from live-site inspection: CE footer renders NO social icons. Intentionally omitted at STATIC-2 close; no schema field needed. | ✅ RESOLVED (intentionally omitted) |
| 35 | STATIC-1 Step 1 follow-up | `siteSettings.defaultOgImage` was seeded from CE Webflow source (`usthumb.png`, 1470×796, the canonical homepage `og:image`). Functionally correct; curation note only. If Seb wants a different default OG asset (e.g. a Mygratr-rebranded version or a 1200×630-exact crop), he can upload via Sanity Studio at any time — `siteSettings.defaultOgImage` is a normal Sanity image field. No migration impact. | Customer curation in Studio |
| 36 | STATIC-1 Step 6 lint sweep | 10 pre-existing DESIGN-1 lint errors surfaced by Step 6's first sitewide `npm run lint`: 5× `react/no-unescaped-entities` in `site/src/app/demo/_demo-client.tsx` (apostrophes/quotes in demo copy), 2× `react-hooks/set-state-in-effect` in `site/src/components/ui/hubspot-form-embed/index.tsx` (lint rule appears tightened since DESIGN-1 close), 2× `@typescript-eslint/no-empty-object-type` in `site/src/components/ui/{input,textarea}/index.tsx` (`interface ... {}` declarations), 1 additional. Not introduced by STATIC-1; STATIC-1 contributed zero new errors. Batch with SCAFFOLD-AUDIT alongside Tech Debt #21-#35. | MYGRATR-SCAFFOLD-AUDIT |
| 37 | STATIC-1 Step 4 → Step 7 | ~~Regex-redirects generator emits `:slug*` (zero-or-more), swallowing hub roots; hand-patched to `:slug+` inside the auto-generated file, and the patch is destroyed on the next `redirects:extract`.~~ **RESOLVED Jul 2026 (Phase 0.2).** Confirmed exactly as predicted: re-running the generator reverted both hand-patches. `translateWebflowRegex()` now emits `:slug+` for every separator-preceded capture, so no hand-patching is needed. Webflow's `/prefix/(.*)` requires the separating slash and does not match the bare parent either, so `:slug+` is the faithful translation, not a workaround. | ✅ RESOLVED |
| 38 | STATIC-1 Step 6 → Step 7 (Gap 1 learning) | UK hub routes are not built. STATIC-1 Step 4 seeded the sitemap with both locales (32 hub entries) but only built 16 default-locale route files; the 16 `/uk/<hub>` URLs all 404'd. Step 7 dropped the UK hub entries from sitemap (`site/src/app/sitemap.ts`). UK hub routes ship in a future UK-locale phase. **Brief-authoring learning**: any future brief that seeds multi-locale sitemap entries must first confirm routes exist for every locale being seeded. | Future UK-locale phase |
| 39 | STATIC-2 Step 4 — HIW bottomPanel image | Step 1 audit's captureHowItWorksMega image-selection heuristic captured the live `black-arrow.png` UI affordance (chevron/arrow asset) for the bottom-panel `image` field instead of the intended hero photo. Uploaded faithful to audit (`navigation.howItWorksMegaMenu.bottomPanel.image`); STATIC-3 render will show the arrow PNG instead of a hero photo. Resolution: Seb edits in Studio (uploads correct hero photo). **Customer-2 audit refinement candidate**: `extract-chrome.ts`'s HIW image picker should skip UI-affordance assets (filename matches `/arrow|chevron|white-arrow|black-arrow/i`) when detecting hero-style content panel photos. | Editorial fix in Studio + customer-2 audit refinement |
| 40 | STATIC-2 Step 5 → Step 5 follow-up | Legacy field cleanup deferred. `navigation.primaryLinks[].dropdownItems`, `cmsDriven`, `cmsCollection`, `localeDropdown`, plus `footer.{newsletterFormId, copyrightText, columns, legalLinks}` are tagged `⚠️ Legacy field` and stay populated through STATIC-3 for STATIC-1 render regression safety. STATIC-3 swaps Header + Footer reads to the new fields; legacy fields stop being read but remain in schema. Cleanup phase removes them from schema + data afterward. | Future schema cleanup phase (post-STATIC-3) |
| 41 | STATIC-2 Step 5 — Studio verification screenshots | STATIC-2 Step 2.8 + Step 5 verification screenshots deferred (Sanity SSO auth blocker for automated capture). Manual verification by Jake reported clean at deploy + post-reseed checkpoints — that's the actual gate. Screenshots are a documentary artifact for the phase-close record; queued for Jake to capture manually when convenient at `audit-output/static-2/studio-verification-screenshots/` (gitignored). | Jake manual capture (non-blocking) |
| 42 | D3 note | Existing context-doc entries (CHANGELOG.md, CLAUDE.md, etc.) still contain em-dashes predating the no-em-dash standing rule. Sweep and replace with hyphens in a later cleanup pass. Not now; cosmetic only, no behaviour impact. | Future context-doc cleanup pass |
| 43b | Hub rebuild — DECISIONS TAKEN (Jul 2026) | **Read before rebuilding the hubs.** (1) **The design's H1s differ from live on 4 hubs** — design says "Services" / "Technology" / "Reviews" / "Customer Stories"; live says "Full Embedded Tech Teams" / "Your tech-stack, our expertise" / "Cloud Employee Reviews" / "Our Customer Stories". **JAKE DECIDED: keep the LIVE H1s.** Build the design in every other respect; the headline string stays as live has it, because those H1s carry keywords on pages that rank and changing them during a domain migration means two variables at once. `title` is a normal Sanity field, so Seb can override any of them later as a deliberate content decision. This also explains Tech Debt #45: its author was comparing against the DESIGN, not live. Both readings were half right. (2) **`featuredArticles` / `featuredItems` were capped at 2; the design needs 5** (one large hero card + four small). Raised to 5 in `_factories.ts` (Jul 2026). (3) **The Blog Index design adds a search bar and category filter pills** that do not exist in our build at all; the other 4 hub designs have neither. | Hub rebuild |
| 43 | Hub reconciliation (Jul 2026) | ~~**16 hub routes + 404 are built-but-visually-stale.** Real STATIC-1 routes (`renderHub`) still render the generic grid, not the D3 dark/lime hub designs.~~ **RESOLVED Jul 2026 (22 Jul).** No app route imports `renderHub`/`resolveHubRoute` any more (verified by grep). Every hub is on a bespoke/rebuilt template: blog + 6 topic hubs (`blog-hub`), services + technology (`services-hub`/`technology-hub`, Phase 2B), videos/tools/downloads/events (`resource-hub`, MYGRATR-HUB-RESOURCE), alternatives (`alternatives-hub`, Phase 4), and reviews + customer-stories (bespoke `reviews-hub`/`customer-stories-hub` social-proof templates - Jake confirmed launch-ready 22 Jul). `/compare` hub root retired via 301 to `/alternatives` (Phase 4.2). `renderHub` is now dead code, removable in a cleanup pass. | ✅ RESOLVED |
| 44 | Hub content (Jul 2026) | ~~**Hub landing content never migrated.** Live-site intro copy, body/Key-Topics blocks, and FAQs absent from Sanity.~~ **RESOLVED Jul 2026.** `faqs` added to `defineBlogHub` + `defineCollectionHub` (`faqItem[]`, max 20); `introContent` + `faqs` now projected in `hubs.ts` and rendered by `renderHub` below the grid (which is where live puts them), with **FAQPage JSON-LD**. Captured from live via `npm run content:capture-hubs -- --apply`: **6,578 words + 54 FAQs across 14 hubs** (`/reviews` + `/customer-stories` legitimately have no prose - pure card grids). Gate: `npm run content:verify-hubs` asserts every captured word appears on the live page. Three content-loss bugs fixed at capture: `.faq-btn` is the +/- glyph not the question (first pass silently captured 0 FAQs on all 16 hubs); `<strong> </strong>` whitespace-only emphasis glued words ("achievefaster"); textContent capture was dropping every "View related blog" internal link. `featuredArticles` / `featuredItems` remain empty (editorial, Seb picks in Studio). | ✅ RESOLVED |
| 45 | Hub content (Jul 2026) | ~~**14 of 16 hubs have wrong hero text in Sanity.**~~ **MISDIAGNOSIS. CLOSED Jul 2026, no change needed.** Verified against live: **all 16 hub titles match the live H1 exactly.** "Full Embedded Tech Teams" really IS the live `/services` headline, and "Nearshoring that feels in-house..." really IS the live `/compare` headline; they read like meta descriptions but they are the actual on-page H1s. `capture-hub-content.ts` reports title divergence and deliberately writes nothing, so this is now continuously checked rather than assumed. The real gap was the missing lead paragraph + body copy, which is #44. | ✅ RESOLVED (misdiagnosis) |
| 46 | Legal template (Jul 2026) | **ENTRY WAS WRONG — corrected Jul 2026 (Phase 0.2).** The claims that the route is uncommitted and that it breaks `npm run build` are both false: `git ls-files` shows it tracked, the Zod schema already carries `.nullable().optional()` on every optional field, and the build is clean. The REAL problem is content: the `privacyPolicyPage` singleton has `title` but `body` is empty, so the route correctly `notFound()`s and `/legals/privacy-policy` — a live 200 page — 404s on the new site. Parity gate flags it. Fix = migrate the privacy-policy body, not a schema change. | Phase 2 (content) |
| 47 | SEO audit (Jul 2026) | **SEO launch-gate gaps (P0-1, P0-2, P2-2) addressed Jul 2026:** mega-menu deep links now SSR-mounted (CSS-hidden until open); sitewide Organization + WebSite JSON-LD in root layout via `serializeJsonLd()`; `<html lang>` wired to locale path (`en-US` / `en-GB`). **Data gaps remain:** `siteSettings.socialProof.logo` not uploaded in Studio (falls back to `/ce-logo.svg`); no `sameAs` social URLs in schema — add verified LinkedIn etc. before launch if desired. **Post-launch items still open:** P1-1 robots AI stance (needs Jake decision), P1-2 llms.txt, P1-3 dateModified freshness, P2-1 nav JSON-LD `serializeJsonLd` (#49), P2-3 sitemap audit. Per-template gate: `docs/seo/SEO_GEO_PER_TEMPLATE_CHECKLIST.md`. | ✅ Launch-gate items shipped; post-launch in brief |
| 48 | STATIC-3 (Jul 2026) | **`navigation.howItWorksMegaMenu` Sanity data unused.** STATIC-3 demoted How It Works to a plain nav link; mega-menu data preserved in dataset. Decide later whether to remove from schema/data or restore dropdown. | Future schema cleanup |
| 49 | STATIC-3 (Jul 2026) | **Nav JSON-LD skips `serializeJsonLd`.** `nav.tsx` emits SiteNavigationElement via raw `JSON.stringify` while blog/hubs use the XSS-safe helper. Low crawl impact; consistency fix. | SCAFFOLD-AUDIT or SEO gap-fix |
| 50 | TEMPLATE-TEAM_MEMBER (Jul 2026) | **All 28 `teamMember` docs have null `teamMemberImage.alt`.** Template falls back to `name` for the E1 `alt` attribute (G7 compliant but not editorially ideal). Backfill alt text in Studio or via one-shot migrator from name + role. | Editorial / pre-launch content pass |
| 51 | TEMPLATE-REVIEW (Jul 2026) | **NOT A BUG — closed Jul 2026 (Phase 0.2).** The redirects are correct. `/reviews/cameron-pearson`, `/reviews/emsl` and `/reviews/mercato` 301 to the `/reviews` hub **on the live site too** (verified against production, not against the April export): all three reviews were deleted from Webflow after the migration, and Sanity was the thing carrying stale copies. They are now `retired` (Phase 0.1). The 11-published-reviews figure was wrong; 8 are live. Removing these redirects would have resurrected 3 deleted pages. | ✅ NOT A BUG |
| 52 | TEMPLATE-REVIEW (Jul 2026) | **Review H1 company name is derived, not schema-backed.** `getReviewCompanyName()` uses metaTitle prefix when not the generic hub title, else slug humanization. Fragile on docs with generic metaTitle (mercato, emsl, cameron-pearson). Spot-check all 11 labels before launch; consider editorial company-name field if drift is unacceptable. | Pre-launch editorial QA |
| 53 | TEMPLATE-VIDEO Step 0 (Jul 2026) | **`video.team` enum drift: Studio schema vs production data.** Studio `studio/schemas/documents/video.ts` offers unsuffixed values (`talentSuccess`, `clientSuccess`, …); all 31 populated production docs hold `*Team`-suffixed values (`talentSuccessTeam`, `clientSuccessTeam`, …) from the CONTENT-1B migrator. TEMPLATE-VIDEO Zod'd to the live `*Team` values (no Sanity mutation). Not rendered in the template, so not a visual blocker — but a real data-integrity item: a Studio edit would create a third inconsistent value. Reconcile Studio enum + data to one canonical set before launch. Also 2 docs have partial nulls (`de-risked-dev-hiring-for-changing-markets` team=null; `hire-nearshore-developers-that-feel-in-house-from-day-one` type=null). | Pre-launch schema/data reconciliation |
| 54 | TEMPLATE-VIDEO Step 0 (Jul 2026) | **`video.metaTitle` dropped at migration (0/32 fill).** `meta-title` was not present on the Webflow videos collection; TEMPLATE-VIDEO falls back to `name` for `<title>`/OG. Verify against the live site pre-launch whether the original per-video meta titles differed meaningfully from `name`; backfill in Studio if so. `metaDescription` is 32/32 filled. Also: 0/32 `backupImage.alt` (falls back to `name`, same as Tech Debt #50); 1 doc (`matching-company-values`) has null `backupImage` — rendered via eager embed, no fabricated poster (flag to Seb to upload). | Pre-launch editorial content pass |
| 55 | TEMPLATE-COMPARE (Jul 2026) | **NOT A BUG — closed Jul 2026 (Phase 0.2).** Same shape as #51, same verdict. `/compare/dev-agencies`, `/compare/cloud-employee-vs-toptal` and `/compare/cloud-employee-vs-revelo` 301 to the `/compare` hub on the live site too; all three were deleted from Webflow and are now `retired`. `/compare/cloud-employee-vs-arc-dev` also 301s on live even though the page still exists in Webflow (an accidental redirect shadowing a real page, on THEIR side) — mirrored deliberately for launch parity per Jake, to be revisited with Seb post-launch. 27 compare pages are live, not 30. | ✅ NOT A BUG |
| 56 | TEMPLATE-BOOK_A_CALL / chrome (Jul 2026) | **Footer / subscribe / announcement-bar CTA arrows still use the `-rotate-45` diagonal glyph.** The header Schedule-a-Call CTA was corrected to a horizontal `chevron-right` (commit `8a7b660`) by passing an explicit non-rotated `leadingGlyph`; the same diagonal-arrow divergence from the design reference remains on other chrome CTAs that render `MegaMenuPillLabel` with the default `leadingArrow`. Sweep chrome CTAs to the corrected glyph in a chrome fidelity pass. | Chrome fidelity pass / SCAFFOLD-AUDIT |
| 57 | Visual editing enablement (Jul 2026) | **`reveal` scroll-animation hydration mismatch.** `site/src/components/motion/reveal.tsx` (+ `use-in-view.tsx`) toggles an `is-in-view` class off `useInView`; server and client first-render disagree on the class, so React logs a hydration warning (surfaced while enabling Presentation, but present on normal browsing too). Introduced by the sitewide motion layer (`e2b8179`, Jul 9), NOT by the visual-editing work. Dev-console-only (invisible to production visitors); worst case a first-paint flicker of the reveal. Fix: make the initial render deterministic (render un-revealed on both server + first client render, flip in an effect) or `suppressHydrationWarning` on the wrapper. Contained to the two motion files. | Motion-layer fix / SCAFFOLD-AUDIT |

| 58 | Launch / parity (Jul 2026) | **Caitlin Murray is a UK-only team member, and it is probably an editorial mistake on CE's side.** She was removed from Webflow's US team collection (so `/team/caitlin-murray` 404s on live, and on ours) but her UK bio is still a live 200 at `/uk/team/caitlin-murray`: the UK locale was never unpublished. Webflow publishes CMS items PER LOCALE; our `retired` flag is global, so retiring her killed both and dropped a page live still serves. Modelled faithfully via `teamMember.ukOnly` + `VISIBLE_IN_LOCALE` (`site/src/lib/sanity/queries/_filters.ts`). All 35 retired docs were checked against both locales; she is the only one. **Ask Seb**: if she has left, unpublish the UK page properly and set `retired: true` again; if not, nothing to do. | Editorial (Seb) |
| 59 | Launch / pricing (Jul 2026) | **`/pricing` does not render the hiring-cost calculator.** On live, `/pricing` embeds `/hiring-cost-calculator` in an iframe. Our `/pricing` is the captured static page (prose only), so the calculator is absent from it. `HiringCostCalculator` is now a real component (`site/src/components/templates/hiring-cost-calculator/calculator.tsx`) - when `/pricing` is redesigned it should render the component DIRECTLY, not iframe our own site to load our own component. | Pricing redesign |
| 61 | Migrator design (Jul 2026) | **Migrators key `_id` on the Webflow item ID (`blogPost-${item.id}`), and no document stores a `webflowId` field - so that ID IS the only link back to the source.** Webflow item IDs churn when an item is deleted and recreated, so re-running a migrator against a churned item CREATES A DUPLICATE rather than updating the original. **Deliberately NOT fixed for CE.** Re-keying to slug would mean re-IDing all 399 documents and rewriting every reference between them: a large, risky data operation to solve a problem we cannot hit, because content migration is closed and Webflow goes away at cutover. **This is a customer-2 authoring rule, not a CE bug:** derive `_id` from the SLUG (stable, human-meaningful, and the thing the URL is built from), and store the Webflow ID in a `webflowId` field for traceability. That way a re-run is idempotent and a churned upstream ID is visible rather than silently duplicating. | Customer-2 brief authoring (CE: won't fix) |
| 60 | Calculators (Jul 2026) | **Both calculators work but are undesigned.** Rebuilt from CE's real cost models and verified exact against live (price-comparison: 60 scenarios; hiring-cost: 900 figures via `npm run verify:hiring-cost`). They render in default dark/lime, not to a design, because no design exists for them. When Jake supplies one it is a restyle, not a rebuild. Rate cards: price-comparison lives in Sanity (`priceComparisonCalculatorPage.rates`, editable by Seb); hiring-cost is in code (`site/src/lib/calculators/hiring-cost.ts`) because it was recovered from a minified bundle rather than authored - move it to Sanity if CE want to self-serve it. | Design + optional Sanity move |

*Last updated: Jul 2026 (LAUNCH-PARITY track). **The build is in a launch-parity push, not a template push.** The governing artefact is now the PARITY GATE (`npm run launch:verify-parity`): capture what the LIVE site does for every known URL (6,937 of them, from the April crawl + Webflow's redirect export + the live sitemap + Search Console + Ahrefs + Webflow's page-list API), replay it against the new site, and fail on any behavioural difference. Deliberate divergences are recorded in `data/webflow/parity-exceptions.json` with who decided them and why - it is an allowlist, not a mute button.

**Shipped in this track:** the whole redirect layer (Next runs `redirects()` BEFORE routing, Webflow does the opposite, which is why redirect bugs are invisible on Webflow and fatal on Next); locale-awareness across chrome, hubs and the start-hiring funnel; EVERY HubSpot form (the portal ID was never exposed to the app - every form on the site rendered nothing, silently); the legal pages; 8 marketing pages captured from live; the 7 post-conversion pages (book-a-call + the thank-yous - what forms and Calendly redirect TO, and the easiest pages in a migration to forget); hub body copy + FAQs (6,578 words, 54 FAQs, #44); and BOTH calculators, rebuilt from CE's real cost models and verified exact against live.

**robots.ts is a landmine and is now defused.** Indexing is OPT-IN, gated on the HOSTNAME (`NEXT_PUBLIC_CANONICAL_HOST`), not on Vercel's environment label. staging.jakevibes.dev IS the Vercel *production* deployment of this project, so the old rule was serving `Allow: /` and a sitemap. **Never set `NEXT_PUBLIC_CANONICAL_HOST` on staging.** It gets set once, on the deployment serving www.cloudemployee.io, on cutover day. `npm run launch:verify-noindex` checks it.

**JAKE'S HARD RULE: nothing goes to production until the design matches the live site.** Production is design-gated, not parity-gated. Parity is nearly closed; design is the critical path, and it is Jake's to supply. Designs EXIST (docs/raw-html/) and are BUILT for: chrome, Home, How It Works, the blog/review/video/tool/download/book-a-call/compare/team detail pages, Customer Story + Download Thank You + 404 (re-skinned 22 Jul), and the net-new **Location** (Philippines/Eastern Europe/LATAM, one bespoke `LocationTemplate` + cost calculator, committed), **Fractional CTO** (`/services/fractional-ctos`, `2951a2c`), and **Software Engineers / Hire Engineers** (`/services/software-engineers`, `a9cf250`) pages (both bespoke, committed + pushed to staging 22 Jul). **Caveat on the 3 net-new families:** design (G1) is done but their copy is STATIC `content.ts`, NOT Sanity-wired (G2 open) - a wiring pass is outstanding before they count as fully done. Designs exist but are NOT built for: **Managed Pods** (net-new, not built) and **Referral** (`/referrals` is built + Sanity-wired but still on the generic shell - needs a design pass, not a build). ALL hub index pages are now built to their designs (blog + 6 topic hubs, services, technology, reviews, customer-stories, videos/tools/downloads/events, alternatives); `/compare` retired via 301 (22 Jul, Phase 4.2). Service + Technology detail + hub pages are now Sanity-wired to the approved design (Phase 2A + 2B). NO DESIGN EXISTS for: About Us, For Developers, Pricing, Our Work, Contact, both calculators, the thank-you pages, or Event detail.

**DESIGN TRACK STARTED - blog family DONE (Jul 2026).** The 7 blog-family listing pages (`/blog` + 6 topic hubs + UK mirrors) and the article detail template are rebuilt to the D3 spec `docs/blog_topic_hubs.pdf`: shared shell (`site/src/components/templates/blog-hub/`), 3-variant ArticleCard, featured auto-fill/≥8-suppression, long-form + FAQ 720px band, numbered pagination, and an H2-only floating auto-generated TOC on the article page (`site/src/lib/blog/toc.ts`). Live H1s kept verbatim per Jake (design demotes them to eyebrow/section-label; the ranking phrase stays in the H1). Search + pill FILTERING is deferred Phase 2 (pills already real `<a>` links, search already `<form method=get>`). Read the DECISIONS block at Tech Debt #43b before touching hubs. **All hubs are now on their designs (22 Jul):** reviews/customer-stories bespoke social-proof templates; videos/tools/downloads/events via `resource-hub`; alternatives via `alternatives-hub`; `/compare` retired via 301 to `/alternatives`. The generic STATIC-1 grid (`renderHub`) is no longer imported by any route (#43 RESOLVED). **Production remains DESIGN-gated** (Jake's hard rule); parity is closed at 6,937/6,937.

**SERVICES + TECHNOLOGY WIRED TO SANITY (Phase 2A + 2B, Jul 2026).** The `/services` and `/technology` **DETAIL** pages (`[slug]` + UK) now read Sanity via the CatalogueDetail transform (`site/src/lib/catalogue/content.ts`) with a two-layer shared/per-page FAQ block + FAQPage JSON-LD (commit `b95b1ae`); unknown slugs 404 (no duplicate-content boilerplate). The `/services` + `/technology` **HUB** index pages (+ UK mirrors) are Sanity-wired too (**Phase 2B, UNCOMMITTED**): data-driven card grouping off `type`/`aiOffering`/`location` (2 featured / 12 specialists / 3 AI / 3 builds, the exact live split), real-slug links, locale-correct `/uk/` hrefs, hub meta + FAQs from the hub singleton. New files: `site/src/lib/sanity/queries/catalogue-hub.ts` + `site/src/lib/catalogue/hub-content.ts`; both hub templates now take `content` + `pathPrefix` props. tsc + lint clean; 4 routes 200. Featured 2-up uses a fixed fallback until Seb curates `servicesHub.featuredItems` in Studio. These hubs are the D3 bespoke design, NOT the generic grid.

Prior: Visual Editing go-live (stega-tolerant enums `dd4fff2`, browserToken `d22b1f9`, reveal hydration warning #57). TEMPLATE-VIDEO / DOWNLOAD / TOOL / BOOK_A_CALL / COMPARE / REVIEW / TEAM_MEMBER complete. DESIGN-1 Brief B Steps 7, 9, 10, 11 still pending.*

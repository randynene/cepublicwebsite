# CHANGELOG.md

## MYGRATR-SCAFFOLD-1 — Next.js Scaffold (April 2026)
Next.js 16.2.4 site scaffolded at `site/` (App Router, TypeScript, Tailwind v4)
in the same monorepo as `studio/` and `src/`. Sanity wiring lives in
`site/src/lib/sanity/`: `sanityClient` (published + CDN in production, stega
disabled outside preview deploys), `previewClient` (authenticated, draft
perspective, stega on), and `live.ts` which calls `defineLive({ client })`
to expose `<SanityLive />` and `sanityFetch` (next-sanity 12 replaced the
direct `SanityLive` export with this factory). Site-level env validator at
`site/src/lib/env.ts` uses Zod with a `NEXT_PUBLIC_VERCEL_URL` fallback so
preview builds don't crash. Locale routing: `site/src/lib/locale.ts` exports
`LOCALES`, `getLocaleFromPath`, `buildLocalePath`, `generateCanonical`,
`generateHreflang` — every TEMPLATE-* `generateMetadata()` consumes those two
generators for canonical + hreflang. UK locale mirror under `site/src/app/uk/`
(`layout.tsx` wraps in `LocaleProvider`, `page.tsx` mirrors the home, catch-all
404s until TEMPLATE-* defines explicit dynamic segments). Root layout loads
17 confirmed third-party scripts via `next/script` with brief-spec strategies
(GeoTargetly beforeInteractive; GTM/LinkedIn/Clara/Hotjar/Facebook/HubSpot/
GSAP/Swiper/Finsweet afterInteractive; Calendly lazyOnload; GA4 fired through
GTM, not loaded directly). Inter font (300–700) wired via `next/font/google` —
extracted from CE's WebFont.load call in `audit-output/pages/home/content.json`.
Robots disallows `/download-thank-you/` per design doc §10; sitemap.ts is a
homepage-only stub for CONTENT-1 to expand. OG fallback `public/og-default.png`
(1×1 PNG) with override-pattern comment in layout for TEMPLATE-* phases. Nav
and footer are server-component stubs that null-guard the
`getSiteSettings()` result; both will be populated from Sanity globals in
TEMPLATE-NAV / TEMPLATE-FOOTER. Redirects: `scripts/scaffold/extract-redirects.ts`
(`npm run redirects:extract`) reads gitignored `audit-output/` and writes
three tracked TS files inside `site/src/lib/redirects/`: 12 crawl-discovered
301/302s (from `ce-canonical-urls.json`, null-target rows dropped), 12 regex
rules (from `ce-regex-redirects.json`, Webflow `(.*)` → Next.js `:slug*`
with split-pattern handling for `/foo(.*)` cases), 316 heterogeneous
Webflow rules (from `webflow-redirects.csv`, deduped against locked rules,
336 `/live-job-role/*` rows collapsed into the locked catch-all regex).
`next.config.ts` composes them with the four locked rules from design doc §8.
Sanity Presentation Tool wired in `studio/sanity.config.ts` (imported from
`sanity/presentation` — the standalone `@sanity/presentation` package is
deprecated). Draft-mode enable/disable routes under
`site/src/app/api/draft-mode/`: enable validates the preview-url-secret with
`previewClient` and same-origin checks the redirect target before flipping
the cookie. `<VisualEditing />` from `next-sanity/visual-editing` renders
conditionally on `draftMode().isEnabled`. Phase scripts under
`scripts/scaffold/`: start-scaffold-phase (transition to scaffold_running)
and complete-scaffold-phase (transition to scaffold_complete + record
Vercel preview URL in `metadata.scaffold_phase`). All 11 commits green
locally; Vercel preview deploy at
`https://mygratr-c3utcgloa-cloud-employee.vercel.app` smoke-tested through
`vercel curl` (deployment protection on). `migrations.status =
scaffold_complete` for CE migration.

## MYGRATR-SCHEMA-1 — Sanity Schema Design (April 2026)
Translated the locked design doc into working code. Sanity Studio v5
scaffolded at `studio/` against project `lzbhll1u` / dataset `production`.
71 schema types registered: 16 shared objects (portableText, faqItem,
quoteBlock, fold, and 12 polymorphic section variants), 21 CMS document
types (tag, blogCategory, glassdoorReview, benefitValue, staffBenefit,
downloadAccess, teamMember, review, video, download, bookACall, event,
tool, compareBlog, blogPost, customerStory, technology, service,
industry, persona, location), 31 singletons (7 blog hubs, 4 resource
hubs, 5 collection indexes, 13 static content pages, 2 calculator
pages), and 3 globals (siteSettings, navigation, footer). Studio build
passes (`npx sanity build` — ~20s). Zod types mirror every schema under
`src/types/sanity/` (discriminated-union for 12 section variants;
z.unknown for Portable Text per brief §3.2). Pre-requisite infra added
inside this session: `src/lib/env.ts` with Zod validation + runtime
guards, `src/lib/supabase.ts` createServerClient, and
`src/lib/pipeline/state-machine.ts` with assertValidTransition plus
canonical `MigrationStatus` string-literal type. Studio structure config
groups the 34 singleton/global docs into 6 nav sections and filters
them out of the "new document" menu. Four scripts under
`scripts/schema/`: start-schema-phase, seed-singletons (seeded 34 stubs
via createIfNotExists), smoke-test-seed (5 test docs incl. 3-fold
technology + reference chains — all accepted by Sanity API), and
record-schema-designs (inserted 21 rows into `schema_designs`, all with
`status='approved'` and org_id filter, then advanced
`migrations.status` to `schema_complete` via assertValidTransition).
`docs/WEBFLOW_TO_SANITY_FIELD_MAP.md` (500 lines) provides field-level
mapping for every Webflow collection → Sanity document, with DROPPED
FIELDS, NEW FIELDS, and MIGRATION BLOCKS sections for CONTENT-1. Every
design decision consumed from v1.2 of the design doc without
modification. No architecture decisions taken in this phase.

## MYGRATR-SCHEMA-0 — Schema Design Lock (April 2026)
Doc-only preparation phase that produced the authoritative input to
MYGRATR-SCHEMA-1. No code, no migrations, no routes. Four artefacts
committed: `docs/CE_RAW_EXTRACT.md` (91,269-line verbatim audit output
kept as reference), `docs/CE_SITE_TRUTH.md` (3,615-line structured
source-of-truth derived from the extract), `docs/MYGRATR_SCHEMA_DESIGN_DECISIONS.md`
(the locked design doc, v1.2 — 33 Webflow collections → 21 Sanity
document types + ~30 singletons + 3 hardcoded routes; 32 design
decisions enumerated in §12), and `docs/SCHEMA_DECISIONS_AUDIT_REPORT.md`
(v1.0 red-team audit finding 5 HIGH + 6 MEDIUM + 5 coverage items —
all HIGH items and all coverage items fixed in v1.1 and v1.2).
Investigation outputs (`docs/investigations-2026-04-23/`) closed three
open questions before lock: static-pages inventory, customer-stories
video-field validity, Glassdoor reviews rendering locations. Redirects
verification against `audit-output/webflow-redirects.csv` established
that 336 of 653 Webflow-configured redirects target `/live-job-role/*`
and collapse to a single catch-all regex; the remaining 317 non-job-role
redirects must be preserved individually — locked in §8 of the design
doc. No structural blockers for SCHEMA-1: doc is READY FOR consumption.

## MYGRATR-AUDIT-1 — Site Audit Agent (April 2026)
Complete authoritative inventory of cloudemployee.io built and written to
Supabase `audit_manifests`. Fourteen audit scripts run in three chunks:
URL reconciliation from four sources (Screaming Frog + sitemap.xml +
Firecrawl + Webflow redirects) yields 636 canonical URLs (602 indexable,
288 US + 314 UK). Firecrawl deep-extracts 312 US pages to
`audit-output/pages/{slug}/content.json`. Webflow API pulls field
population and EN/EN-GB locale diff for all 33 collections (451 items).
Global components, 608 CDN assets, 44 Playwright screenshots across three
breakpoints, and 17 global third-party scripts (GTM, GA4, LinkedIn
Insight, Clara chat, Hotjar, GeoTargetly, GSAP, Swiper, Finsweet,
Calendly) are inventoried. Three HubSpot forms verified live via Forms
v2 API. Claude Opus 4.7 drives tier-2 interaction analysis on 248
content-complex pages (5560 content-affecting + 2021 cosmetic elements)
and template classification for the 41 URLs rules couldn't match (only
4 remain UNKNOWN — Cloudflare scripts, sitemap.xml, a hash URL, and
`/uk/embedding`). Migration manifest (119 MB) upserted to Supabase;
`migrations.current_phase = audit_complete`. Zero critical anomalies.

## MYGRATR-0 — Foundation (April 2026)
Project foundation established. Repo scaffolded with TypeScript strict mode,
all dependencies installed, Supabase schema live with 10 tables and RLS
enabled on all. CE org and migration seeded with fixed UUIDs. All context
files written at root level. Webflow inventory and Firecrawl sitemap scripts
complete from pre-session work — full CE audit data in audit-output/.

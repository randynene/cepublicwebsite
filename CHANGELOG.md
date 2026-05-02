# CHANGELOG.md

## MYGRATR-CONTENT-1D-CLEANUP — Migrator-pattern null-image-field unsets (May 2026)
Post-phase patch on a closed CONTENT-1D. Tech Debt #14 surfaced a
systemic migrator-pattern bug: `uploadImage()` in
`src/lib/content/migration-helpers.ts` returns `null` when the Webflow
source field is empty, and the CONTENT-1A/1B/1C migrators wrote that
null literal directly into the doc (`thumbnail: await uploadImage(...)`)
rather than omitting the field via conditional spread. Studio's strict
validation flags every such doc with "Invalid property value" because a
null literal stored where the schema declares `image` doesn't match the
expected type. Scope-expansion across `service`, `technology`,
`customerStory` confirmed 158 affected docs × 6 fields top-level + 100
nested fold-level entries. Brief deviation **DEV-6** authorised; 4 ops
applied with explicit per-doc guards:
**Op A** unset `thumbnail` on 23 service docs;
**Op B** unset `thumbnail` on 101 + `techLogo` on 2 technology docs in
atomic per-doc patches;
**Op C** unset `folds[_key=="..."].featuredImage` on 100 technology
docs via the new path-patch primitive
(`client.patch(id).unset(['folds[_key=="fold-1"].featuredImage'])`) —
syntax probed in advance via a read-only dry-run that called
`PatchBuilder.toJSON()` without committing;
**Op D** unset `companyProductImage` on 5, `thumbnail` on 10,
`openGraphImage` on 17 customerStory docs in atomic per-doc patches.
Per-op halt-on-first-guard semantic: a literal-null assertion mismatch
on any doc would have fired `process.exit(1)` and skipped subsequent
ops; zero guard failures across all 4 ops. 4 new `content_migrations`
audit-trail rows added (`service-null-thumbnail-unset`,
`technology-null-image-fields-unset`,
`technology-null-folds-featured-image-unset`,
`customer-story-null-image-fields-unset`); CE total now 42 rows
(38 CONTENT-1D + 4 cleanup). `migrations.status` stayed
`content_complete` — no transition. Verifier check #8 row-count check
relaxed from `===` to `>=` so post-phase patches don't trip it; the
ALL_NEW_1D_SLUGS-membership check still enforces every CONTENT-1D row
is present. Tech Debt #14 RESOLVED 2026-05-02. Two items remain
deferred to separate cycles: `customerStory.companyLogo` required-field
violation on Travel Tech Client (anonymised real customer; intentional
missing logo; schema-side fix expected — relax `Rule.required()` to
optional with template placeholder fallback), and a broader scan of the
9 other doc types that may carry the same migrator-pattern null
literals. CONVENTIONS.md gained two new sections: "Migrator
Field-Write Pattern — Conditional Spread" (the rule that prevents this
bug recurring in customer-2+ migrators) and "Path-Patch Primitive for
Nested Array-of-Object Fields" (the `_key`-addressed unset shape with
its `_key`-validation guard).

## MYGRATR-CONTENT-1D — Meta Backfills + Carryover Fixes + content_complete (May 2026)
Closing slice of CONTENT-1. Meta tags scraped live from cloudemployee.io
via Playwright across 6 doc types (technology 101, service 23,
customerStory 18, teamMember 28, review 26, bookACall 6 — title only;
description was already populated in CONTENT-1B). New
`src/lib/content/meta-backfill-runner.ts` enforces every structural
protection in one place: F1 phase-wide 20-minute wall-clock abort gate
with hard `process.exit(1)` (NOT break) and failure row written
before exit; F4 monotonic `needsReview` (omitted from patch when
computed false, never overwrites prior `true`); F5 `metaTitle` never
written empty (omitted on null/empty so verifier catches it);
F6 `FieldPolicy` enum honoured structurally (`description: never-touch`
skips scrape + normalisation + validation entirely); F7 pre-scrape
hook evaluated BEFORE URL construction (customerStory `virgin`
short-circuits to a hardcoded placeholder patch); F8 `snippetForMeta`
copy path with post-truncation length assertion; F13 1.5s
inter-request delay; F21 split per-field provenance
(`metaTitleSource` + `metaDescriptionSource`). Step 0a retroactively
applied §7.2 source-tracking (`source` / `generatedAt` /
`needsReview`) to the 4 schemas that lacked it (customerStory,
teamMember, review, bookACall) and added the provenance pair to all 6
in-scope types; `sourceTrackingFieldsCarryover` (hidden
source/generatedAt, no `required` validation) carries the
"initialValue does not retroactively populate" caveat from F18.
Step 0.1 introduced `SANITY_MIGRATION_WRITE_TOKEN` (single-dataset,
least-privilege) replacing the legacy `SANITY_API_TOKEN` for migration
scripts; module-load assertion in `sanity-write-client.ts` throws if
the new token is missing OR if `SANITY_API_READ_TOKEN` is also
present (path-alias collision guard, F14). 4 carryover scripts
resolved CONTENT-1A image staging (9 `benefitValue.thumbnailImage`
+ 6 `staffBenefit.icon` uploaded as real Sanity assets) plus the
CONTENT-1B `video.backupImage` retry and `mainVideoEmbedLink`
encoding fix (both vacuous — 0 docs needed work). Smoke-test cleanup
(`deleteByIdStrict` enforces `_id`-only, `_type`-validated deletion;
query-based deletes forbidden in migration scripts) deleted all 5
SCHEMA-1 smoke-test docs in ref-graph order
(`smoke-test-blog-post` first; the rest in any order — Decision B,
brief originally specified 3 + 2 deferred but the ref chain made the
larger scope cleaner). Verifier rewritten as `verifyContent1D()`
that throws on any failure (F2): the state-transition script calls
it WITHOUT try/catch, unhandled rejection propagates to Node
top-level, the `assertValidTransition` and Supabase update lines are
structurally unreachable on verification failure. Three brief
deviations applied with explicit per-doc guards: DEV-3 deleted 16
drift docs (1 customerStory + 15 reviews — Webflow CMS items whose
slugs return 404 on the live site; D1 + D2 + D5 confirmed each is
HTTP 404 + zero inbound refs + zero singleton/global mentions),
DEV-4 truncated 6 bookACall metaDescriptions to 160 chars at word
boundary (CONTENT-1B carryover bug — Webflow `title` field
mislabelled and oversized, never-touch policy explicitly overridden
with state-snapshot guard against the 184/186/188/190/191/192
lengths from D3), DEV-5 unset `needsReview` on 6 bookACall docs
flagged by the buggy initial `shouldFlagForReview` pass
(monotonic-flag rule overridden with two-factor guard:
`needsReview === true` AND `metaTitleSource.scrapedAt` startsWith
`'2026-05-02'` — re-running the migrator moves scrapedAt forward
and structurally blocks accidental clearance of any future
legitimate flag). Final state: `migrations.status = content_complete`
with `metadata.content_phase` block recording 388 CMS docs (404
baseline − 16 drift), 0 smoke-test docs remaining, 38
content_migrations rows for CE (24 prior + 14 new — 11 brief
baseline + 3 deviation rows). Studio production deploy at
`https://mygratr-cloudemployee.sanity.studio/`. New
`SANITY_MIGRATION_WRITE_TOKEN` rotation flagged as Tech Debt #15 —
**MUST resolve before MYGRATR-LAUNCH** (Exit Criterion #10).

## MYGRATR-CONTENT-1C — Blogs / Tech / Services / Stories Migration (April 2026)
Third slice of CONTENT-1: 246 Webflow items migrated into Sanity across
5 document types (`blogPost` 74, `compareBlog` 30, `technology` 101,
`service` 23, `customerStory` 18). Brief said 269 expected; reality
landed at 246 because the 6 sub-category blog collections turned out to
be near-complete duplicates of the canonical `Blogs & Guides` master
(31 + 67 raw → 74 unique after slug dedup against the master). The
brief's pre-flight slug-collision check fired with 31 collisions and
halted the migrator on the first run; Jake's clarification 2026-04-30
established `Blogs & Guides` as the canonical master and re-cast the
sub-category collections as "anything not already in master" — each
item's `blogCategory` comes from its own `resource-category` ref, not
its source collection. Step 0a upgraded `toPortableText()` from a
synchronous helper to an async two-pass walk: Pass 1 JSDOM-parses the
HTML, extracts every `<img>` src, and uploads each via
`Promise.allSettled` (one broken CDN image cannot abort the document);
Pass 2 deserialises with custom rules emitting image blocks for
`<img>` and `<figure><img>` (iframe-in-figure / Vimeo embeds skipped),
all hooked into a registered `image` type on the compiled block-tools
schema. Null guard at entry returns `[]` for null/undefined/empty
strings (catches every nullable RichText call site). Step 0b lifted
`fetchOptionIdMap` and `resolveOption` out of `migrate-videos.ts` and
`migrate-benefit-values.ts` into `migration-helpers.ts`. Step 0c added
`decodeHtmlEntities` for VideoLink URLs (Webflow returns
`?h=xxx&amp;title=0`). `toRefs` now validates every Webflow ref ID
against `/^[a-f0-9]{24}$/i` before constructing a `_ref` and uses the
full ID as the deterministic `_key` (was a sliced 8-char prefix). Five
new migrators under `scripts/content/`
(`migrate-blog-posts`, `-compare-blogs`, `-technology`, `-services`,
`-customer-stories`) plus a CONTENT-1C-specific pre-flight
(`verify-content-1c-prereqs`) and verifier (`verify-content-1c`) that
runs 29 hard-gate checks (Sanity counts, Supabase parity, slug
uniqueness, reference integrity, compareBlog-no-`category` invariant,
fold structure, customerStory section packing, inline-image presence
end-to-end). `migration-tracker.ts` now accepts an optional
`parityBaselineCount` so blog sub-category rows record
`source_item_count` = full Webflow count while `parity_score` is
measured against the deduplicated set; vacuous-success edge case
(denominator=0, migrated=0, no errors) yields 100 instead of 0. Live
counts logged: `blogs-and-guides` 31/31, `staff-augmentation-blogs`
34→28 unique, `nearshoring-offshoring-blogs` 13→7,
`scaling-teams-blogs` 10→3, `hiring-tips-blogs` 7→3,
`managing-engineers-blogs` 7→2, `ai-software-dev-blogs` 3→0,
`compare-blogs` 30 (brief said 29 — live API delta), `technology` 101
(1 outlier handled per brief §5.9), `services` 23,
`customer-stories` 18 (3 full narratives + 4 impact-quote-only + 11
empty shells, exactly as brief §2.5 predicted). All 11 CONTENT-1C
`content_migrations` rows show `parity_score=100` and `status=complete`.
`migrations.status` remains `content_running` — `content_complete`
fires after CONTENT-1D per the reconciled CLAUDE.md.
metaTitle/metaDescription on technology/service/customerStory left
null pending CONTENT-1D backfill.

## MYGRATR-CONTENT-1B — Reference-Light Collections Migration (April 2026)
Second slice of CONTENT-1: 105 Webflow items migrated into Sanity across 8
collection slugs (team-members 28, reviews 26, videos 32, book-a-call 6,
events 1, tools 2, downloads 5, downloads-access 5). Images now upload
as real Sanity assets via the new `uploadImage()` helper — no more
`webflowImageUrl` staging strings. New shared helpers under
`src/lib/content/migration-helpers.ts`: `toPortableText` (HTML → Portable
Text via `@sanity/block-tools` with a JSDOM-backed `parseHtml` injection,
since `@sanity/block-tools` defaults to the browser DOMParser global which
doesn't exist in Node), `extractUrl` (accepts both Webflow Link objects
and plain-string Link fields), `uploadImage` (fetches the Webflow CDN URL,
uploads via `sanityWriteClient.assets.upload`, returns null on failure
with a console warning rather than crashing the migrator), `toRefs`
(MultiReference fields → Sanity references using deterministic
`{type}-{webflowId}` IDs; accepts both the legacy `{id}` object form and
the modern plain-string ID form Webflow returns on video/download/event
tags), `extractOption`, and `webflowSlug` (reads `fieldData.slug` first
since Webflow v2 returns `null` at the top level for some collections).
The slug fix was retroactively applied to all 5 CONTENT-1A migrators —
every CONTENT-1A document had `slug.current = null` until they were
re-run; backfilled idempotently via `createOrReplace`. CONVENTIONS.md
§"Content Migration Conventions" updated to show the corrected pattern
and document the historical bug. Three field-name corrections from
live-API verification (Jake-approved 2026-04-28): teamMember image is
`team-member` (not `team-member-image`); event post-event description
is `header-description---post-event` (three dashes); tool FAQ slugs are
`faq-header-1..10` (not `faq-title-`); download metaThumbnail reads
from Webflow `meta-thunbnail` (Webflow's own typo). Two field-mapping
calls: review `nameClient` ← Webflow `name-client` (the personal name)
with company `name` dropped (no Sanity destination); video `meta-title`
dropped (not present on the videos collection). Video `type` and `team`
Option fields resolve via `fetchOptionIdMap()` → `TYPE_MAP`/`TEAM_MAP`
camelCase normalisation. Culture Match `hidden-code` migrates with
quoted-property API-key stripping; empirically all `<script>` content
falls out during HTML→Portable Text conversion so no key text reaches
Sanity (verified by grep on the live key prefix). Final parity check
script `content:verify-1b` reads `content_migrations` for all 8 slugs
and asserts 100% parity; exits 0. `migrations.status = content_running`
remains (still partial — CONTENT-1A + 1B done; `content_complete`
ships with CONTENT-1C).

## MYGRATR-CONTENT-1A — Flat Collections Migration (April 2026)
First slice of CONTENT-1: 53 reference-free Webflow items migrated into Sanity
across 5 collection slugs. New shared infrastructure under `src/lib/content/`
(`sanity-write-client`, `webflow-read-client` with offset+limit pagination,
`migration-tracker` upserting via the new `(org_id, migration_id,
collection_slug)` unique key, and `ce-collection-ids` as the seed-data map of
the 10 Webflow collection IDs in scope for CONTENT-1A). Five idempotent
migrators under `scripts/content/` (`migrate-tags`, `migrate-blog-categories`,
`migrate-glassdoor-reviews`, `migrate-benefit-values`, `migrate-staff-benefits`)
each call `ensureSanity()` + `ensureWebflow()` up front, `createOrReplace`
documents using deterministic `_id`s (`{type}-{webflowId}`), and call
`recordMigration()` with `status: complete | failed` plus an error log. Tags
collapse 6 Webflow collections into one `tag` document type with `category`
discriminator (D2). Hubs become `blogCategory` documents (D13 — order left
unset for Studio). Glassdoor reviews map per `WEBFLOW_TO_SANITY_FIELD_MAP §14`
(`name → clientName`, `review-description → reviewDescription`,
`work-field → workField`). Benefit values resolve the Webflow `category` Option
field by fetching the collection schema once and looking up option IDs
(`21c1...→ benefits`, `c0ff...→ values`). Image fields on benefitValue and
staffBenefit are stored as a `webflowImageUrl` staging string per brief §"Known
Risks / Image fields" — Sanity asset upload is CONTENT-1C work. Final
parity-check script (`content:verify-1a`) reads `content_migrations` and asserts
`migrated_item_count === expected && status === complete` across all 5 slugs;
exits 0. Tech debt #10 + #11 cleared (legacy `MigrationStatus` enum and
duplicate `TemplateType` enum removed from `src/lib/types.ts`; canonical
`MigrationStatus` lives in `pipeline/state-machine.ts`, canonical `TemplateType`
in `audit-types.ts`). One pre-flight DDL gap: the
`content_migrations_org_migration_collection_unique` constraint did not exist
on the table; added by Jake via the Supabase SQL editor before the migrators
ran (the pooler password in `.env` no longer authenticates direct DDL — REST
writes work fine). `migrations.status = content_running` (partial — CONTENT-1A
of 3); `content_complete` ships with CONTENT-1C.

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

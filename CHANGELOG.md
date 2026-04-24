# CHANGELOG.md

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

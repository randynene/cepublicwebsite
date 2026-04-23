# PHASE_HISTORY.md

## MYGRATR-SCHEMA-0 — Schema Design Lock (April 2026)

### What Was Built
- `docs/CE_RAW_EXTRACT.md` (91,269 lines) — verbatim audit output kept
  as an unedited reference. Not structured for reading; used as the
  source the SITE_TRUTH doc derives from.
- `docs/CE_SITE_TRUTH.md` (3,615 lines) — structured authoritative
  source-of-truth document. Section 1 enumerates every CMS collection
  with field counts, item counts, and field-population rates. Section 2
  enumerates every page template with URL patterns. Section 10 lists
  every existing Webflow redirect behaviour that must be preserved.
- `docs/MYGRATR_SCHEMA_DESIGN_DECISIONS.md` v1.0 → v1.1 → v1.2
  (1,190 lines locked) — the authoritative input to MYGRATR-SCHEMA-1.
  Defines 21 Sanity document types (16 core CMS types + 2 supporting
  embedded types + 3 AI-search placeholders), ~30 singletons, 3
  hardcoded Next.js routes, 6 global schemas, redirect preservation
  strategy, and 32 locked design decisions (D1–D32 in §12).
- `docs/SCHEMA_DECISIONS_AUDIT_REPORT.md` (251 lines) — red-team audit
  of v1.0 against ground truth (`audit-output/*.json` + CE_SITE_TRUTH).
  5 HIGH findings, 6 MEDIUM findings, 5 missing-coverage items, 5
  unverifiable claims. Zero critical structural errors.
- `docs/SCHEMA_DECISIONS_AUDIT_REPORT_V2.md` — re-audit of v1.1
  confirming all 5 HIGH and all 5 missing-coverage findings were
  correctly fixed; flagged one residual "40 flat fields" text error
  (NEW-1) and recommended referencing the completed redirects
  verification instead of deferring to CONTENT-1.
- `docs/investigations-2026-04-23/` — three investigations that
  unblocked open schema questions:
  - Investigation 1: static pages inventory (37 US paths)
  - Investigation 2: customer-stories `video-url-2` field validity
    (confirmed 2/17 populated, both malformed — DROP decision)
  - Investigation 3: Glassdoor reviews rendering locations
    (183 hits on `/for-developers`, 183 on `/reviews` — separate
    `glassdoorReview` doc type decision)
  - Redirects verification: 653 Webflow-configured redirects
    broken down: 336 `/live-job-role/*` (collapse to 1 regex),
    317 non-job-role (preserve individually). No `/live-job-role/*`
    URLs active in current crawl or sitemap. Ahrefs baseline empty
    per Tech Debt #4 — backlink value unverifiable.

### Decisions Locked (32)
Full list in `docs/MYGRATR_SCHEMA_DESIGN_DECISIONS.md` §12. Highlights:
- D1: Consolidate 7 blog collections → single `blogPost` with category field
- D2: Consolidate 6 taxonomy collections → single `tag` with category field
- D3/D4: Typed `folds` array replaces 34 flat fold-related fields on
  Technology Pages (and same pattern for Services)
- D5: Drop `Customer Stories.video-url-2` — broken data
- D6/D7: Add `metaDescription` to Technology and Services (missing in Webflow schema)
- D8: Replace `faq-schema-2` PlainText with structured `faqs` array
- D9: Rename Book A Call `title` field to `metaDescription` (Webflow naming bug)
- D10: Add industry/persona/location placeholder schemas for AI-search strategy
- D11: Author field REQUIRED on `blogPost` and `compareBlog`
- D14/D15/D16: Do NOT migrate Insights (1), New Blog Templates (5), Lead magnets (17)
- D18: Culture Match tool PARKED — placeholder page, logic rebuilt post-launch
- D21: UK/US content duplicated by default; split post-launch in MYGRATR-LOCALE-1
- D25: Single global blog (not separate US/UK)
- D26: Preserve Webflow slugs exactly — no slug cleanup
- D27–D29: JSON-LD, canonicals, hreflang — all server-side
- D32: GeoTargetly preserved via `siteSettings` global script list

### Pre-Session Inputs Verified
- `audit-output/ce-inventory.json` — 33 collections, 451 items
- `audit-output/ce-canonical-urls.json` — 636 URLs, 602 indexable
- `audit-output/ce-sitemap-xml.json` — 522 indexable URLs from sitemap
- `audit-output/ce-field-population.json` — 0%-fill justifications
- `audit-output/ce-forms.json` — 3 verified HubSpot form GUIDs
- `audit-output/webflow-redirects.csv` — 653 source→target rows
- `audit-output/ce-regex-redirects.json` — 11 regex patterns

### Key Discoveries During Lock
- Technology Pages CMS schema has no `meta-description` field at the
  CMS layer; SEO metadata currently lives in Webflow's template SEO
  settings. Migration must backfill metaTitle/metaDescription on all
  101 technology pages.
- Services collection has the same missing-metaDescription bug (23 items).
- Tools & Quizzes has a `hidden-code` RichText field that is not in
  Section 9 (excluded) and was missing from v1.0 — now mapped to
  `hiddenCode: array[portableText]` in v1.1 with Culture Match API key
  explicitly excluded during migration.
- `/archive/old-home` and `/uk/archive/old-home` both return HTTP 200
  with a "Not Found" template body (soft 404). LAUNCH must emit proper
  HTTP 410 Gone on both paths — locked in §8.
- Webflow primary `name` field (100% populated on every collection)
  wasn't explicitly mapped in v1.0; v1.1 added §7.13 as a cross-cutting
  migration rule.
- Legal pages collection (1 item, 4 fields) wasn't mapped in Section 3
  of v1.0; v1.1 added §7.14 with full field mapping to
  `privacyPolicyPage` singleton.

### Surprises
- v1.0 audit's "17 Sanity document types" count matched no clean
  subset of the enumerated types. v1.1 restated as "21 types
  (16 core + 2 supporting + 3 placeholders)" with the math verifiable
  against §3.1–§3.20 directly.
- v1.0 said "5 taxonomy collections" but listed 6 (Blogs, Downloads,
  Tools & Quizzes, Video Library, Alternatives, Events & Webinars).
  Fixed in v1.1.
- v1.0 typed Videos `backgroundVideoPreviewLink` and
  `vimeoYoutubeStandardLink` as `url` — but Webflow stores both as
  `PlainText`. Sanity `url` validator would reject malformed strings
  at migration time. Fixed in v1.1 to `string` with a post-launch
  validate/normalise note.
- Ahrefs baseline is empty — not only does the subscription not cover
  cloudemployee.io (Tech Debt #4), the two API calls that ran also
  failed with `400: missing argument date`. Backlink value for retired
  URLs can't be assessed from this artefact. Deferred to MONITOR-1 or
  resolved via GSC Links / Semrush before LAUNCH.

### Data State After This Phase
- Supabase: unchanged from AUDIT-1. `audit_manifests` row
  `708d9d52-7721-4c8d-bc78-a6e31ffb3225` still authoritative.
  `migrations.current_phase = audit_complete` still the state.
  No schema_designs rows yet — those get inserted in SCHEMA-1.
- Filesystem: 5 new doc artefacts in `docs/`. 1 new directory
  `docs/investigations-2026-04-23/` with 11 files. 1 new directory
  `docs/SKILLS/` with 2 skill definitions (post-phase-update, red-team-audit).
- Git: 4 commits since AUDIT-1 closeout (398aa4f, 1ee0911, e9cda38, 07ba8cf).

### Patterns Established (see CONVENTIONS.md)
No new code patterns — doc-only phase. The decision-doc lifecycle
(CE_RAW_EXTRACT → CE_SITE_TRUTH → DESIGN_DECISIONS → red-team audit
→ surgical fixes → re-audit → lock) is a repeatable process for
future phases but is a workflow, not a code convention, so it's not
added to CONVENTIONS.md Section 1/2 patterns.

## MYGRATR-AUDIT-1 — Site Audit Agent (April 2026)

### What Was Built
- `src/lib/audit-types.ts` — shared enums and interfaces for the audit
  pipeline (UrlStatus, TemplateType, ClassificationMethod, InteractionType,
  CanonicalUrl, ScreenshotRecord, PageContent, ThirdPartyScript,
  ScriptInventory, HubSpotForm, TemplateClassification, CollectionRecord,
  AuditAnomaly)
- `scripts/audit/00-verify-inputs.ts` — pre-flight env + file check
- `scripts/audit/00-ahrefs-baseline.ts` — Ahrefs REST v3 SEO snapshot
- `scripts/audit/01-reconcile-urls.ts` — merges Screaming Frog +
  sitemap.xml + Firecrawl + Webflow redirects → canonical URL list,
  regex-redirect extraction, HTTP-429 fallback (trusts sitemap/Firecrawl)
- `scripts/audit/02-screenshot-agent.ts` — Playwright 3-breakpoint capture
  with GSAP scroll-trigger priming; resumable (skip if PNGs on disk);
  rules-only template classifier inlined for sample selection
- `scripts/audit/03-content-extractor.ts` — Firecrawl `/scrape` per URL,
  concurrency 5, circuit breaker, 4-min phase timeout, resumable
- `scripts/audit/03b-field-population.ts` — Webflow API field-population
  + EN vs EN-GB diff for all collections
- `scripts/audit/03c-global-components.ts` — nav, footer, Clara widget,
  Finsweet attributes, newsletter form GUID, locale dropdown
- `scripts/audit/03d-asset-manifest.ts` — `<img>` + `<source>` + inline
  CSS url() dedup; site/CMS/external CDN classification
- `scripts/audit/03e-template-custom-code.ts` — per-template script diff
  against global inventory, SEO-critical flagging
- `scripts/audit/04-interaction-inventory.ts` — tier-1 CSS selector +
  class pattern detection, tier-2 Claude Opus 4.7 analysis for
  technology pages and pages with >3 content-affecting elements
- `scripts/audit/05-script-inventory.ts` — 27-pattern detector (GTM,
  GA4, LinkedIn, HubSpot, Hotjar, FullStory, Intercom, Drift, Crisp,
  Cloudflare Turnstile, Cloudflare Insights, Cookiebot, OneTrust,
  Ahrefs, Vector, GeoTargetly, Calendly, socks-ui, Swiper, GSAP, Clara,
  Finsweet, Vimeo, YouTube)
- `scripts/audit/06-forms-inventory.ts` — hbspt.forms.create() +
  data-webflow-hubspot-api-form-url extraction, HubSpot Forms v2 API
  verification, workflow cross-reference
- `scripts/audit/07-template-classifier.ts` — hybrid rules (URL pattern
  match) + LLM fallback (Claude Opus 4.7, 20-URL batches)
- `scripts/audit/08-manifest-builder.ts` — assembles full
  MigrationManifest from all step outputs, strips rawHtml
- `scripts/audit/09-manifest-writer.ts` — upserts audit_manifests,
  updates migrations.current_phase = audit_complete
- `scripts/audit/run-audit.ts` — orchestrator for Steps 00–3e
- `scripts/audit/run-audit-chunk2.ts` — orchestrator for Steps 4–9
- `scripts/audit/run-audit-chunk3.ts` — orchestrator for LLM refresh
  of Steps 4, 7, 3e, 8, 9
- `package.json` — added `audit:run`, `audit:chunk2`, `audit:chunk3`
- `.gitignore` — added `audit-output/` and `.audit/` (audit outputs
  contain PII and infrastructure identifiers)

### Pre-Session Inputs Verified
- `audit-output/screaming-frog-export.csv` (692 KB) — full-site crawl
- `audit-output/screaming-frog-redirects.csv` (742 KB) — redirect chains
- `audit-output/webflow-redirects.csv` (58 KB) — 653 rows, 11 regex
- `audit-output/ce-inventory.json` (213 KB) — 33 collections from WF API
- `audit-output/ce-sitemap.json` (46 KB) — 620 URLs from Firecrawl
- HubSpot private-app token with `forms` scope active
- Ahrefs API key active (but subscription lacks cloudemployee.io data)

### Outputs Written to `audit-output/`
- `ce-ahrefs-baseline.json` — SEO baseline (empty — not in Ahrefs sub)
- `ce-canonical-urls.json` — 636 URLs, 602 indexable, 30 redirects
- `ce-regex-redirects.json` — 11 patterns for `next.config.js`
- `ce-sitemap-xml.json` — 522 URLs cached from sitemap.xml
- `ce-content-extraction-summary.json` — 312/312 extracted
- `pages/{slug}/content.json` (×312) — full extracted content
- `pages/{slug}/interactions.json` (×308) — per-page interactions
- `ce-field-population.json` + `-summary.json` — 33 collections
- `ce-global-components.json` — nav + footer + widgets
- `ce-assets.json` — 608 unique CDN assets
- `ce-template-map-rules.json` — rules-only pass
- `ce-screenshots.json` + `screenshots/{slug}/{bp}.png` (×44)
- `ce-interactions-summary.json` — 5560 content + 2021 cosmetic
- `ce-scripts.json` — 17 global + 261 pages with unique scripts
- `ce-forms.json` — 3 verified HubSpot forms
- `ce-template-map.json` + `ce-template-map-llm-review.json` — 602
  classified (561 rules, 41 LLM)
- `ce-template-custom-code.json` + `-review.json` — 14 templates, 789
  review items, 31 SEO-critical
- `ce-manifest.json` — full MigrationManifest (119 MB)

### Key CE Discoveries
- Tracking stack: GTM `GTM-WL45TCTW`, GA4 `G-2Q22ZM5PLY`, LinkedIn
  Insight `4901289`, Hotjar, Clara chat workspace
  `09aa62df-5af6-4cec-b565-c335e907327d`
- No cookie-consent tool detected globally — worth confirming via GTM
- Only 3 HubSpot forms are embedded live (vs. 25 in portal) — the other
  22 forms are either retired or email-campaign-only
- Every collection uses `single-document` locale strategy — UK
  variations are done via client-side JSON-LD swap script
  (currency/address), not Webflow locale overrides
- `Blogs & Guides` collection: 31/31 items draft-in-UK (100%)
- Nav Technology dropdown merged into Services dropdown in extraction
  (selector issue — needs tweak before SCAFFOLD-1)

### Surprises
- Screaming Frog CSV had HTTP 429 rate-limits on 49 URLs (24 US pages
  missed initially). Step 1 now falls back to `UrlStatus.OK` if URL is
  confirmed in sitemap or Firecrawl.
- Firecrawl v4 SDK restructured (`FirecrawlApp` → `FirecrawlAppV1`) —
  used REST API directly instead of SDK to match existing scripts.
- 2 Playwright `networkidle` timeouts on Vimeo-embedded video pages
  (`/work-with-shawnee`, `/videos/how-cloud-employee-keeps-remote-developers-motivated`).
- Ahrefs API v3 requires a `select` parameter — brief's sample code
  omitted it, fix applied post-run.

### Data State After This Phase
- Supabase `audit_manifests`: row `708d9d52-7721-4c8d-bc78-a6e31ffb3225`
  for CE migration (602 indexable, 33 collections, 451 items, 3 forms)
- Supabase `migrations`: `current_phase = audit_complete`,
  `status = audit_complete`, metadata with counts + 4 manual-review URLs
- 312 page content JSON files on disk (+308 interactions)
- 44 screenshot directories with 3 breakpoints each
- 4 remaining manual-review URLs: `/cdn-cgi/.../main.js`, `/sitemap.xml`,
  `/haqt6iy0.../a`, `/uk/embedding`

### Patterns Established (see CONVENTIONS.md)
- Resumable orchestrator chunks with skip-if-exists
- Tier-1/tier-2 LLM degradation (rules always run; Claude optional)
- Inline rules-based classifier for cross-step dependencies
- Phase-timeout + circuit-breaker for API-driven batch steps
- PII-safe audit outputs via `.gitignore`

## MYGRATR-0 — Foundation (April 2026)

### What Was Built
- Repo structure scaffolded with /src/, /briefs/, /audit-output/
- TypeScript configured (strict mode, ES2022)
- All production and dev dependencies installed
- Supabase schema: 10 tables, RLS on all, org_id on all
- CE org seeded: ce000000-0000-0000-0000-000000000001
- CE migration seeded: ce000000-0000-0000-0000-000000000002
- Shared TypeScript types in src/lib/types.ts
- Context files at root: CLAUDE.md, SCHEMA.md, CONVENTIONS.md,
  CHANGELOG.md, PHASE_HISTORY.md, FEATURE_MAP.md, REGISTRY.md

### Pre-Session Work (Already Complete)
- scripts/webflow-inventory.js — Webflow API inventory
- scripts/firecrawl-sitemap.js — Firecrawl full crawl
- audit-output/ce-inventory.json — 33 collections, 435 items, 25 forms
- audit-output/ce-sitemap.json — 643 crawled URLs
- audit-output/ce-sitemap-xml.json — 522 indexable URLs
- audit-output/ce-sitemap-diff.json — crawl vs sitemap diff

### Key CE Facts Confirmed by Audit
- 522 indexable pages (sitemap.xml source of truth)
- 643 crawled URLs (includes pagination, archives, locale mirrors)
- Locales: US (default) + UK (/uk/ prefix)
- PH locale discontinued — Geotargetly → talent.cloudemployee.io
- 33 CMS collections — most are simple taxonomy tables
- Technology Pages: 101 items, 43 fields, fold-based conditional layout
- 25 forms — HubSpot — decision pending before MYGRATR-CONTENT-1
- Custom code: Webflow API blocked (plan limit) → Firecrawl in AUDIT-1

### Data State After This Phase
- Supabase: schema live, CE org and migration seeded
- Webflow: read-only API token active
- Firecrawl: key in .env, initial crawl complete
- GitHub: galaxyfunk/mygratr (private)

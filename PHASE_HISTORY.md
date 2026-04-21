# PHASE_HISTORY.md

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

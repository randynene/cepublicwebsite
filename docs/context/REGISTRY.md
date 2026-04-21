# REGISTRY.md — Mygratr

> Growing reference lists. Overflow from CLAUDE.md.
> Update after each phase as new routes, templates, and components are added.

## Database Tables

| Table | Purpose | Phase Built |
|---|---|---|
| organisations | Customer orgs | MYGRATR-0 |
| migrations | One per site migration | MYGRATR-0 |
| audit_manifests | Phase 1 audit output | MYGRATR-0 |
| schema_designs | Sanity schema per collection | MYGRATR-0 |
| content_migrations | Per-collection migration state | MYGRATR-0 |
| template_builds | Per-template build attempt | MYGRATR-0 |
| qa_runs | Per-page QA results | MYGRATR-0 |
| redirects | URL preservation map | MYGRATR-0 |
| launches | Post-launch monitoring | MYGRATR-0 |

## Template Types

| TemplateType | URL Pattern | Collections | Phase Built |
|---|---|---|---|
| HOME | / | — | TBD |
| TECHNOLOGY | /technology/[slug] | Technology Pages | TBD |
| SERVICE | /services/[slug] | Services | TBD |
| BLOG | /[category]/[slug] | 7 blog collections | TBD |
| COMPARE | /compare/[slug] | Compare Blogs | TBD |
| CUSTOMER_STORY | /customer-story/[slug] | Customer Stories | TBD |
| TEAM_MEMBER | /team/[slug] | Team Members | TBD |
| VIDEO | /videos/[slug] | Videos | TBD |
| REVIEW | /reviews/[slug] | Reviews | TBD |
| BOOK_A_CALL | /book-a-call/[slug] | Book A Call Pages | TBD |
| DOWNLOAD | /download/[slug] | Downloads | TBD |
| TOOL | /tools/[slug] | Tools & Quizzes | TBD |
| STATIC | Various | — | TBD |

## CMS Collections (CE — 33 total)

| Collection | Items | Complexity | Template |
|---|---|---|---|
| Technology Pages | 101 | HIGH (43 fields, fold structure) | TECHNOLOGY |
| Videos | 32 | LOW | VIDEO |
| Blogs & Guides | 31 | LOW | BLOG |
| Compare Blogs | 29 | LOW | COMPARE |
| Team Members | 28 | LOW | TEAM_MEMBER |
| Staff Augmentation Blogs | 28 | LOW | BLOG |
| Reviews | 26 | LOW | REVIEW |
| Services | 23 | MEDIUM | SERVICE |
| Customers / Customer Stories | 18 | MEDIUM | CUSTOMER_STORY |
| Lead magnets / Tags | 17 | LOW (taxonomy) | — |
| Nearshoring & Offshoring Blogs | 13 | LOW | BLOG |
| Glassdoor reviews | 10 | LOW | — |
| Client Benefits & Company Values | 9 | LOW | — |
| Scaling Teams Blogs | 9 | LOW | BLOG |
| Tags >> Blogs | 8 | LOW (taxonomy) | — |
| Hiring Tips Blogs | 7 | LOW | BLOG |
| Managing Engineers Blogs | 7 | LOW | BLOG |
| Hubs | 6 | LOW | — |
| Staff Benefits | 6 | LOW | — |
| Book A Call Pages | 6 | LOW | BOOK_A_CALL |
| Downloads | 5 | LOW | DOWNLOAD |
| Downloads Access Pages | 5 | LOW (gated) | — |
| New Blog Templates | 5 | LOW | BLOG |
| Tags >> Alternatives | 4 | LOW (taxonomy) | — |
| AI in Software Development Blogs | 3 | LOW | BLOG |
| Tags >> Tools & Quizzes | 3 | LOW (taxonomy) | — |
| Tags >> Video Library | 3 | LOW (taxonomy) | — |
| Tools & Quizzes | 2 | MEDIUM | TOOL |
| Tags >> Downloads | 2 | LOW (taxonomy) | — |
| Tags >> Events & Webinars | 2 | LOW (taxonomy) | — |
| Events & Webinars | 1 | LOW | STATIC |
| Legal pages | 1 | LOW | STATIC |
| Insights | 1 | LOW | STATIC |

## API Routes

None yet. Updated as MYGRATR-SCAFFOLD-1 and later sessions build them.

## Scripts

| Script | Purpose | Output | Phase |
|---|---|---|---|
| scripts/webflow-inventory.js | Webflow API full inventory | audit-output/ce-inventory.json | MYGRATR-0 |
| scripts/firecrawl-sitemap.js | Full site crawl via Firecrawl | audit-output/ce-sitemap.json | MYGRATR-0 |
| scripts/run-migrations.js | Applies Supabase SQL migrations | Supabase schema | MYGRATR-0 |
| scripts/audit/00-verify-inputs.ts | Pre-flight env + file check | — | AUDIT-1 |
| scripts/audit/00-ahrefs-baseline.ts | Ahrefs REST v3 SEO snapshot | audit-output/ce-ahrefs-baseline.json | AUDIT-1 |
| scripts/audit/01-reconcile-urls.ts | URL reconciliation (4 sources) | audit-output/ce-canonical-urls.json, ce-regex-redirects.json, ce-sitemap-xml.json | AUDIT-1 |
| scripts/audit/02-screenshot-agent.ts | Playwright 3-breakpoint capture | audit-output/ce-screenshots.json, screenshots/{slug}/ | AUDIT-1 |
| scripts/audit/03-content-extractor.ts | Firecrawl deep content extraction | audit-output/pages/{slug}/content.json | AUDIT-1 |
| scripts/audit/03b-field-population.ts | Webflow field + locale diff | audit-output/ce-field-population.json + summary | AUDIT-1 |
| scripts/audit/03c-global-components.ts | Nav/footer/Clara/Finsweet inventory | audit-output/ce-global-components.json | AUDIT-1 |
| scripts/audit/03d-asset-manifest.ts | CDN asset manifest | audit-output/ce-assets.json | AUDIT-1 |
| scripts/audit/03e-template-custom-code.ts | Per-template script diff | audit-output/ce-template-custom-code.json + review | AUDIT-1 |
| scripts/audit/04-interaction-inventory.ts | Tier-1 patterns + Claude tier-2 | audit-output/pages/{slug}/interactions.json | AUDIT-1 |
| scripts/audit/05-script-inventory.ts | 27-pattern third-party script scan | audit-output/ce-scripts.json | AUDIT-1 |
| scripts/audit/06-forms-inventory.ts | HubSpot Forms v2 API verification | audit-output/ce-forms.json | AUDIT-1 |
| scripts/audit/07-template-classifier.ts | Rules + Claude LLM hybrid | audit-output/ce-template-map.json, ce-template-map-llm-review.json | AUDIT-1 |
| scripts/audit/08-manifest-builder.ts | Assemble MigrationManifest | audit-output/ce-manifest.json | AUDIT-1 |
| scripts/audit/09-manifest-writer.ts | Upsert to Supabase audit_manifests | DB write | AUDIT-1 |
| scripts/audit/run-audit.ts | Orchestrator for Steps 00–3e | via npm run audit:run | AUDIT-1 |
| scripts/audit/run-audit-chunk2.ts | Orchestrator for Steps 4–9 | via npm run audit:chunk2 | AUDIT-1 |
| scripts/audit/run-audit-chunk3.ts | LLM refresh for 4, 7, 3e, 8, 9 | via npm run audit:chunk3 | AUDIT-1 |

## Lib Files

| File | Exports | Purpose | Phase |
|---|---|---|---|
| src/lib/types.ts | MigrationStatus, PhaseStatus, CmsAdapter interface, Zod schemas | Shared domain types + validation | MYGRATR-0 |
| src/lib/audit-types.ts | UrlStatus, TemplateType, ClassificationMethod, InteractionType, CanonicalUrl, ScreenshotRecord, PageContent, ThirdPartyScript, ScriptInventory, HubSpotForm, TemplateClassification, CollectionRecord, AuditAnomaly | Audit pipeline types | AUDIT-1 |

## npm Scripts

| Command | Runs |
|---|---|
| `npm run audit:run` | Steps 00 → 3e (URL reconciliation through template custom code) |
| `npm run audit:chunk2` | Steps 4 → 9 (interactions, scripts, forms, classifier, manifest, DB write) |
| `npm run audit:chunk3` | LLM refresh for Steps 4, 7, 3e, 8, 9 (requires ANTHROPIC_API_KEY) |

## Audit Output Files (populated by AUDIT-1)

| File | Contents | Writer |
|---|---|---|
| ce-ahrefs-baseline.json | Domain rating, keywords, top pages | Step 00 |
| ce-canonical-urls.json | 636 URLs with status + source | Step 1 |
| ce-regex-redirects.json | 11 Webflow regex redirects for next.config.js | Step 1 |
| ce-sitemap-xml.json | 522 URLs cached from /sitemap.xml | Step 1 helper |
| ce-content-extraction-summary.json | Step 3 counts + failures | Step 3 |
| pages/{slug}/content.json | 312 per-page extracted content | Step 3 |
| pages/{slug}/interactions.json | 308 per-page interaction lists | Step 4 |
| ce-field-population.json + summary | 33 collections × fields + UK diff | Step 3b |
| ce-global-components.json | Nav/footer/Clara/Finsweet/newsletter | Step 3c |
| ce-assets.json | 608 unique CDN assets | Step 3d |
| ce-template-map-rules.json | Rules-only classification (Chunk 1) | Step 2 helper |
| ce-template-map.json | 602 classified URLs (rules + LLM) | Step 7 |
| ce-template-map-llm-review.json | LLM-classified subset for review | Step 7 |
| ce-screenshots.json + screenshots/{slug}/ | 44 captured × 3 breakpoints | Step 2 |
| ce-interactions-summary.json | Step 4 counts | Step 4 |
| ce-scripts.json | 17 global + per-page third-party scripts | Step 5 |
| ce-forms.json | 3 verified HubSpot forms | Step 6 |
| ce-template-custom-code.json + review | 14 templates × script diff | Step 3e |
| ce-manifest.json | Full assembled MigrationManifest (119 MB) | Step 8 |

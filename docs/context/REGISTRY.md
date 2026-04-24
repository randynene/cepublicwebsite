# REGISTRY.md — Mygratr

> Growing reference lists. Overflow from CLAUDE.md.
> Update after each phase as new routes, templates, and components are added.

## Phase Design-Doc Artefacts

| Artefact | Phase | Purpose |
|---|---|---|
| `docs/CE_RAW_EXTRACT.md` | SCHEMA-0 | Verbatim audit output — reference only |
| `docs/CE_SITE_TRUTH.md` | SCHEMA-0 | Structured source-of-truth (3,615 lines) |
| `docs/MYGRATR_SCHEMA_DESIGN_DECISIONS.md` | SCHEMA-0 | LOCKED v1.2 — input to SCHEMA-1 |
| `docs/SCHEMA_DECISIONS_AUDIT_REPORT.md` | SCHEMA-0 | v1.0 red-team audit |
| `docs/SCHEMA_DECISIONS_AUDIT_REPORT_V2.md` | SCHEMA-0 | v1.1 re-audit |
| `docs/investigations-2026-04-23/` | SCHEMA-0 | Static pages, customer-story videos, Glassdoor rendering, redirects verification |
| `docs/SKILLS/post-phase-update/SKILL.md` | SCHEMA-0 | Reusable skill definition |
| `docs/SKILLS/red-team-audit/SKILL.md` | SCHEMA-0 | Reusable skill definition |
| `docs/WEBFLOW_TO_SANITY_FIELD_MAP.md` | SCHEMA-1 | Field-level migration map consumed by CONTENT-1 |

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

## Sanity Document Types (21 — CMS content)

| Type | Webflow source | Route prefix | File |
|---|---|---|---|
| blogPost | 7 blog collections (consolidated, D1) | /[category-slug]/[slug] | studio/schemas/documents/blog-post.ts |
| compareBlog | Compare Blogs | /compare/[slug] | studio/schemas/documents/compare-blog.ts |
| technology | Technology Pages | /technology/[slug] | studio/schemas/documents/technology.ts |
| service | Services | /services/[slug] | studio/schemas/documents/service.ts |
| customerStory | Customers / Customer Stories | /customer-story/[slug] | studio/schemas/documents/customer-story.ts |
| teamMember | Team Members | /team/[slug] | studio/schemas/documents/team-member.ts |
| review | Reviews | /reviews/[slug] | studio/schemas/documents/review.ts |
| video | Videos | /videos/[slug] | studio/schemas/documents/video.ts |
| download | Downloads | /download/[slug] | studio/schemas/documents/download.ts |
| downloadAccess | > Downloads Access Pages | /download-thank-you/[slug] (noindex) | studio/schemas/documents/download-access.ts |
| tool | Tools & Quizzes | /tools/[slug] | studio/schemas/documents/tool.ts |
| bookACall | Book A Call Pages | /book-a-call/[slug] | studio/schemas/documents/book-a-call.ts |
| event | Events & Webinars | /events/[slug] | studio/schemas/documents/event.ts |
| glassdoorReview | -- Glassdoor reviews | (reference-only, consumed by /for-developers + /reviews) | studio/schemas/documents/glassdoor-review.ts |
| benefitValue | -- Client Benefits & Company Values | (reference-only) | studio/schemas/documents/benefit-value.ts |
| staffBenefit | -- Staff Benefits | (reference-only, consumed by /for-developers) | studio/schemas/documents/staff-benefit.ts |
| tag | 6 tag collections (consolidated, D2) | (taxonomy) | studio/schemas/documents/tag.ts |
| blogCategory | -- Hubs | (taxonomy) | studio/schemas/documents/blog-category.ts |
| industry | NEW placeholder (AI-search) | /industry/[slug] | studio/schemas/documents/industry.ts |
| persona | NEW placeholder (AI-search) | /persona/[slug] | studio/schemas/documents/persona.ts |
| location | NEW placeholder (AI-search) | /location/[slug] | studio/schemas/documents/location.ts |

## Sanity Singletons (31 — Tier 2 + Tier 3)

Grouped in `studio/schemas/structure.ts` into six Studio nav sections.

**Blog hubs (7):** blogHub (/blog), staffAugmentationHub, nearshoringOffshoringHub, scalingTeamsHub, hiringTipsHub, managingEngineersHub, aiInSoftwareDevelopmentHub.

**Resource hubs (4):** videosHub (/videos), toolsHub (/tools), downloadsHub (/downloads), eventsHub (/events).

**Collection indexes (5):** servicesHub (/services), technologyHub (/technology), customerStoriesHub (/customer-stories + /our-work alias), reviewsHub (/reviews), compareHub (/compare + /alternatives alias). `teamHub` dropped — `/team` is a 301 to `/about-us`.

**Static content (13):** homePage (/), aboutUsPage (/about-us), howItWorksPage (/how-it-works), contactPage (/contact), forDevelopersPage (/for-developers), retentionPage (/retention), sourcingPage (/sourcing), embeddingPage (/embedding), scaleThisWeekPage (/scale-this-week), workWithShawneePage (/work-with-shawnee), startHiringPage (/start-hiring/contact-info), notFoundPage (/404), privacyPolicyPage (/legals/privacy-policy — migrated from Webflow Legal pages collection).

**Calculator pages (2):** hiringCostCalculatorPage (/hiring-cost-calculator), priceComparisonCalculatorPage (/price-comparison-calculator). Logic hardcoded in Next.js; singletons hold marketing copy only.

## Sanity Globals (3)

- siteSettings — defaults for meta/OG, Organization JSON-LD, Clara chat, announcement bar, HubSpot portal ID (22809822)
- navigation — primary links, CTA button, locale dropdown
- footer — newsletter form ID, columns, legal links

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
| scripts/schema/start-schema-phase.ts | Transitions CE migration audit_complete → schema_running | `migrations` row update | SCHEMA-1 |
| scripts/schema/seed-singletons.ts | createIfNotExists for 34 singleton/global stubs | 34 docs in Sanity prod dataset | SCHEMA-1 |
| scripts/schema/smoke-test-seed.ts | 5-doc integration test (blogCategory, tag, teamMember, technology 3-fold, blogPost) | 5 `smoke-test-*` docs in Sanity | SCHEMA-1 |
| scripts/schema/record-schema-designs.ts | Inserts 21 schema_designs rows + advances to schema_complete | `schema_designs` rows + `migrations.status` update | SCHEMA-1 |

## Lib Files

| File | Exports | Purpose | Phase |
|---|---|---|---|
| src/lib/types.ts | MigrationStatus (legacy — see Tech Debt #10), PhaseStatus, CmsAdapter interface, Zod schemas | Shared domain types + validation | MYGRATR-0 |
| src/lib/audit-types.ts | UrlStatus, TemplateType, ClassificationMethod, InteractionType, CanonicalUrl, ScreenshotRecord, PageContent, ThirdPartyScript, ScriptInventory, HubSpotForm, TemplateClassification, CollectionRecord, AuditAnomaly | Audit pipeline types | AUDIT-1 |
| src/lib/env.ts | env (parsed Zod schema), ensureWebflow/Firecrawl/Anthropic/Hubspot/Ahrefs/Sanity/SupabaseDb runtime guards | Validated env loader — single source of env access | SCHEMA-1 |
| src/lib/supabase.ts | createServerClient() | Supabase admin client (service role; bypasses RLS) | SCHEMA-1 |
| src/lib/pipeline/state-machine.ts | MigrationStatus (canonical string-literal union), assertValidTransition(), validNextStatuses() | Migration pipeline state machine | SCHEMA-1 |

## npm Scripts

| Command | Runs |
|---|---|
| `npm run audit:run` | Steps 00 → 3e (URL reconciliation through template custom code) |
| `npm run audit:chunk2` | Steps 4 → 9 (interactions, scripts, forms, classifier, manifest, DB write) |
| `npm run audit:chunk3` | LLM refresh for Steps 4, 7, 3e, 8, 9 (requires ANTHROPIC_API_KEY) |
| `npm run schema:start` | Step 0: transition CE migration to schema_running |
| `npm run schema:seed-singletons` | Step 4a: seed 34 singleton/global stubs (needs `-- --confirm-production`) |
| `npm run schema:smoke-test` | Step 9B: 5-doc integration test (needs `-- --confirm-production`) |
| `npm run schema:record` | Step 10: insert 21 schema_designs rows + advance to schema_complete |

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

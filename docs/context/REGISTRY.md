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

## Site Components (`site/src/components/`)

| Component | Type | File | Purpose | Phase |
|---|---|---|---|---|
| LocaleProvider | client | locale-provider.tsx | Provides `Locale` via React context; useLocale() hook | SCAFFOLD-1 |
| GeoTargetlyScript | server | third-party-scripts.tsx | beforeInteractive GeoTargetly redirect | SCAFFOLD-1 |
| GtmHeadScript / GtmNoScript | server | third-party-scripts.tsx | GTM head + body iframe | SCAFFOLD-1 |
| GlobalScripts | server | third-party-scripts.tsx | LinkedIn, Hotjar, Clara, FB Pixel, HubSpot, GSAP, Swiper, Finsweet, Calendly | SCAFFOLD-1 |
| Nav | server stub | layout/nav.tsx | TEMPLATE-NAV will source from Sanity navigation global | SCAFFOLD-1 |
| Footer | server stub | layout/footer.tsx | TEMPLATE-FOOTER will source from Sanity footer global | SCAFFOLD-1 |

## Site Routes (`site/src/app/`)

| Route | File | Type | Purpose | Phase |
|---|---|---|---|---|
| `/` | page.tsx | static | homePage placeholder; TEMPLATE-HOME fills folds | SCAFFOLD-1 |
| `/uk` | uk/page.tsx | static | UK locale home placeholder | SCAFFOLD-1 |
| `/uk/[...slug]` | uk/[...slug]/page.tsx | dynamic | catch-all 404 placeholder until TEMPLATE-* defines explicit routes | SCAFFOLD-1 |
| `/sitemap.xml` | sitemap.ts | file convention | homepage + UK homepage stub (CONTENT-1 expands) | SCAFFOLD-1 |
| `/robots.txt` | robots.ts | file convention | Disallow: /download-thank-you/ | SCAFFOLD-1 |

## API Routes

| Route | Method | File | Purpose | Phase |
|---|---|---|---|---|
| `/api/draft-mode/enable` | GET | site/src/app/api/draft-mode/enable/route.ts | Validate Sanity preview-url-secret + same-origin check + draftMode().enable() | SCAFFOLD-1 |
| `/api/draft-mode/disable` | GET | site/src/app/api/draft-mode/disable/route.ts | draftMode().disable() | SCAFFOLD-1 |

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
| scripts/scaffold/extract-redirects.ts | Reads gitignored audit-output and writes 3 tracked redirect TS files into site/ | site/src/lib/redirects/{generated,regex,webflow}-redirects.ts | SCAFFOLD-1 |
| scripts/scaffold/start-scaffold-phase.ts | Transitions CE migration schema_complete → scaffold_running | `migrations` row update | SCAFFOLD-1 |
| scripts/scaffold/complete-scaffold-phase.ts | Transitions scaffold_running → scaffold_complete + records preview URL in metadata | `migrations` row update | SCAFFOLD-1 |
| scripts/content/start-content-phase.ts | Transitions CE migration scaffold_complete → content_running (idempotent, requires `--confirm`) | `migrations` row update | CONTENT-1A |
| scripts/content/migrate-tags.ts | 6 Webflow tag collections → Sanity `tag` (consolidated, D2) | 22 Sanity docs + 1 `content_migrations` row (`tags-consolidated`) | CONTENT-1A |
| scripts/content/migrate-blog-categories.ts | Webflow `hubs` → Sanity `blogCategory` (D13) | 6 Sanity docs + 1 `content_migrations` row (`blog-categories`) | CONTENT-1A |
| scripts/content/migrate-glassdoor-reviews.ts | Webflow `-- Glassdoor reviews` → Sanity `glassdoorReview` | 10 Sanity docs + 1 `content_migrations` row (`glassdoor-reviews`) | CONTENT-1A |
| scripts/content/migrate-benefit-values.ts | Webflow `-- Client Benefits & Company Values` → Sanity `benefitValue` (Option-field resolved via collection schema) | 9 Sanity docs + 1 `content_migrations` row (`benefit-values`) | CONTENT-1A |
| scripts/content/migrate-staff-benefits.ts | Webflow `-- Staff Benefits` → Sanity `staffBenefit` | 6 Sanity docs + 1 `content_migrations` row (`staff-benefits`) | CONTENT-1A |
| scripts/content/verify-content-1a.ts | Final parity check — exits 0 only when all 5 CONTENT-1A slugs hit migrated_count == expected and status == 'complete' | stdout summary; exits 0 / 1 | CONTENT-1A |
| scripts/content/migrate-team-members.ts | Webflow `team` → Sanity `teamMember` (28); image upload, RichText → Portable Text | 28 Sanity docs + 1 `content_migrations` row (`team-members`) | CONTENT-1B |
| scripts/content/migrate-reviews.ts | Webflow `reviews` → Sanity `review` (26); `nameClient` ← `name-client`, drops Webflow `name` | 26 Sanity docs + 1 `content_migrations` row (`reviews`) | CONTENT-1B |
| scripts/content/migrate-videos.ts | Webflow `videos` → Sanity `video` (32); resolves `type` and `team` Option fields via `fetchOptionIdMap()` | 32 Sanity docs + 1 `content_migrations` row (`videos`) | CONTENT-1B |
| scripts/content/migrate-book-a-call.ts | Webflow `book-a-call` → Sanity `bookACall` (6); Webflow `title` → Sanity `metaDescription` | 6 Sanity docs + 1 `content_migrations` row (`book-a-call`) | CONTENT-1B |
| scripts/content/migrate-events.ts | Webflow `events` → Sanity `event` (1); resolves `event-type` from string ID | 1 Sanity doc + 1 `content_migrations` row (`events`) | CONTENT-1B |
| scripts/content/migrate-tools.ts | Webflow `tools` → Sanity `tool` (2); strips API keys from Culture Match `hidden-code` | 2 Sanity docs + 1 `content_migrations` row (`tools`) | CONTENT-1B |
| scripts/content/migrate-downloads.ts | Webflow `download` → Sanity `download` (5); reads `meta-thunbnail` (Webflow's typo) for `metaThumbnail` | 5 Sanity docs + 1 `content_migrations` row (`downloads`) | CONTENT-1B |
| scripts/content/migrate-downloads-access.ts | Webflow `download-thank-you` → Sanity `downloadAccess` (5) | 5 Sanity docs + 1 `content_migrations` row (`downloads-access`) | CONTENT-1B |
| scripts/content/verify-content-1b.ts | Final parity check for CONTENT-1B — exits 0 only when all 8 collections hit 100% | stdout summary; exits 0 / 1 | CONTENT-1B |
| scripts/content/verify-content-1c-prereqs.ts | Pre-flight: assert `migrations.status = content_running` and that every required brief §2 slug exists on the union of fields across the 11 CONTENT-1C source collections | stdout pass/fail; exits 0 / 1 | CONTENT-1C |
| scripts/content/migrate-blog-posts.ts | 7 Webflow blog collections → Sanity `blogPost` (canonical-master dedup against `Blogs & Guides`; 74 unique items written; each item's blogCategory comes from its own `resource-category` ref) | 74 Sanity docs + 7 `content_migrations` rows (one per source collection) | CONTENT-1C |
| scripts/content/migrate-compare-blogs.ts | Webflow `Compare Blogs` → Sanity `compareBlog` (30); `tags-2` slug; payload omits `category` (no resource-category on this collection); competitor extracted via three explicit regex patterns | 30 Sanity docs + 1 `content_migrations` row (`compare-blogs`) | CONTENT-1C |
| scripts/content/migrate-technology.ts | Webflow `Technology Pages` → Sanity `technology` (101, single pass — `associated-technologies` is 0% populated); §2.3 slug sweep verbatim; `focus-3-title` read once and used in both fold-2 bullet-3 and fold-3 label; 1 outlier handled gracefully | 101 Sanity docs + 1 `content_migrations` row (`technology`) | CONTENT-1C |
| scripts/content/migrate-services.ts | Webflow `Services` → Sanity `service` (23); `fetchOptionIdMap` hoisted above item loop; SERVICE_TYPE_MAP / PREFIX_MAP camelCase enums; `short-label` slug; `fold-2---paragraph-2` (trailing -2) | 23 Sanity docs + 1 `content_migrations` row (`services`) | CONTENT-1C |
| scripts/content/migrate-customer-stories.ts | Webflow `Customers / Customer Stories` → Sanity `customerStory` (18); switch slug corrections; VideoLink `.url` + `decodeHtmlEntities`; `the-` content prefixes; triple-dash quote slugs; problem/solution/impact packed independently | 18 Sanity docs + 1 `content_migrations` row (`customer-stories`) | CONTENT-1C |
| scripts/content/verify-content-1c.ts | Final verifier — 29 hard-gate checks: Sanity counts (excluding `smoke-test-*`), Supabase parity for 11 rows, blogPost slug uniqueness, compareBlog `category` absence, reference integrity spot-checks, fold structure, customerStory section packing, inline-image presence end-to-end | stdout summary; exits 0 / 1 | CONTENT-1C |
| scripts/content/verify-content-1d-prereqs.ts | Pre-flight: 32 checks across token presence/absence, migration state, doc counts (smoke-test excluded), live scrape scope build, UNKNOWN URL overlap, smoke-test doc existence + ref graph, Playwright availability, forbidden-import grep (F14 ESLint-equivalent), Step 0a schema/Zod field-presence | stdout summary; exits 0 / 1 | CONTENT-1D |
| scripts/content/test-url-builder.ts | Two-tier URL builder assertion: HARD known-good slugs (one per type, hardcoded from audit canonical set) + INFO Sanity-data coverage report. Halts only on Tier 1 fail. | stdout summary; exits 0 / 1 | CONTENT-1D |
| scripts/content/migrate-meta-technology.ts | Live-scrape `metaTitle` + `metaDescription` for 101 technology docs via shared runner (`runMetaBackfill`); both fields `scrape-always` | 101 patches + 1 row (`meta-backfill-technology`) | CONTENT-1D |
| scripts/content/migrate-meta-service.ts | Same pattern for 23 service docs | 23 patches + 1 row (`meta-backfill-service`) | CONTENT-1D |
| scripts/content/migrate-meta-customer-story.ts | Same pattern for 18 customerStory docs; pre-scrape hook short-circuits `/customer-story/virgin` to a hardcoded placeholder patch (provider: 'placeholder') | 18 patches (1 bypassed) + 1 row (`meta-backfill-customer-story`) | CONTENT-1D |
| scripts/content/migrate-meta-team-member.ts | Same pattern for 28 teamMember docs | 28 patches + 1 row (`meta-backfill-team-member`) | CONTENT-1D |
| scripts/content/migrate-meta-review.ts | 26 review docs; `description: 'snippet-copy-else-scrape'` — copies `snippetForMeta` (truncated to 160 via truncateAtWord) to metaDescription if present, scrapes otherwise | 26 patches + 1 row (`meta-backfill-review`) | CONTENT-1D |
| scripts/content/migrate-meta-book-a-call.ts | 6 bookACall docs; `description: 'never-touch'` (CONTENT-1B-populated, IMMUTABLE per brief). metaTitle scraped fresh. | 6 patches + 1 row (`meta-backfill-book-a-call`) | CONTENT-1D |
| scripts/content/migrate-benefit-value-thumbnails.ts | F16 idempotency: 9 `benefitValue` docs with `webflowImageUrl` → upload via `uploadImage`, set `thumbnailImage`, unset `webflowImageUrl` (same-commit) | 9 patches + 1 row (`image-carryover-benefit-values`) | CONTENT-1D |
| scripts/content/migrate-staff-benefit-icons.ts | Same pattern for 6 `staffBenefit.icon` | 6 patches + 1 row (`image-carryover-staff-benefits`) | CONTENT-1D |
| scripts/content/migrate-video-backup-image-retry.ts | F20 vacuous-success — record migration row (0/0/complete) when query returns 0 docs (CONTENT-1B's earlier carryover already resolved) | 1 row (`image-carryover-video-backup`) | CONTENT-1D |
| scripts/content/fix-video-embed-link-encoding.ts | Vacuous-success — `mainVideoEmbedLink` `&amp;` decode via `decodeHtmlEntities`. 0 docs needed it. | 1 row (`video-embed-link-encoding-fix`) | CONTENT-1D |
| scripts/content/cleanup-smoke-test-docs.ts | Decision B 5-doc scope. `deleteByIdStrict` for 5 hardcoded SCHEMA-1 smoke-test `_id`s; `smoke-test-blog-post` deleted FIRST (only ref-holder). External-ref pre-flight check halts if any non-in-scope referrer. | 5 deletions + 1 row (`smoke-test-cleanup`) | CONTENT-1D |
| scripts/content/cleanup-drift-docs.ts | DEV-3 brief deviation. Pre-flight: re-runs D2 inbound-ref check + single-sample live 404 retest. Then `deleteByIdStrict` for 16 hardcoded `_id`s (1 customerStory + 15 review). Post-delete confirmation pass. | 16 deletions + 1 row (`drift-cleanup`) | CONTENT-1D |
| scripts/content/truncate-bookacall-metadescription.ts | DEV-4 brief deviation. Per-doc guards: `_type === 'bookACall'`, `metaDescription.length` matches D3 snapshot, truncated length ∈ [140, 160]. Surgical `.set` on metaDescription only. | 6 patches + 1 row (`bookacall-metadescription-truncation`) | CONTENT-1D |
| scripts/content/unset-bookacall-stale-needsreview.ts | DEV-5 brief deviation. Two-factor guard: `needsReview === true` AND `metaTitleSource.scrapedAt` startsWith '2026-05-02'. Surgical `.unset(['needsReview'])`. | 6 unsets + 1 row (`bookacall-stale-needsreview-unset`) | CONTENT-1D |
| scripts/content/verify-content-1d.ts | Throws-on-failure verifier (F2). Exports `verifyContent1D({skipStateCheck?})`. 9 hard-gate checks. Never returns boolean. | (export) | CONTENT-1D |
| scripts/content/run-verify-content-1d.ts | CLI entrypoint. Calls `verifyContent1D` without try/catch. `--skip-state-check` flag for pre-Step-8 runs. | stdout; exits 0 / 1 | CONTENT-1D |
| scripts/content/complete-content-phase.ts | Step 8 state transition. Calls `verifyContent1D({skipStateCheck: true})` WITHOUT try/catch (F2). `--confirm` required. Updates `migrations.status = content_complete` with `metadata.content_phase` block (388 docs / 0 smoke-test / 38 rows / phases list). | `migrations` row update | CONTENT-1D |
| scripts/content/inspect-smoke-test-state.ts | Read-only diagnostic — enumerates every smoke-test doc in dataset. Reusable for customer 2+. | stdout | CONTENT-1D |
| scripts/content/inspect-validation-issues.ts | Read-only diagnostic — walks every CONTENT-1D in-scope doc and asserts top-level field primitive shape against expected types. Reusable for schema-vs-data drift investigation. | stdout | CONTENT-1D |
| scripts/content/diag-1d-canonical-cross-check.ts | Read-only diagnostic for the 16 drift `_id`s — audit-output canonical-list check + live 5s Playwright fetch with 1.5s inter-request delay. | stdout markdown table | CONTENT-1D |
| scripts/content/diag-2-1d-inbound-refs.ts | Read-only diagnostic — `*[references($id)]` per drift `_id`, classifies referrers (drift / smoke-test / external / draft). | stdout markdown table | CONTENT-1D |
| scripts/content/diag-3-1d-bookacall-truncation-preview.ts | Read-only diagnostic — side-by-side current / `truncateAtWord(s, 160)` / dropped tail for 6 bookACall metaDescriptions. | stdout | CONTENT-1D |
| scripts/content/diag-4-1d-runner-bug-postmortem.ts | Read-only diagnostic — plain-English writeup of the buggy `shouldFlagForReview` pass + current state of the 6 affected bookACall docs. | stdout | CONTENT-1D |
| scripts/content/diag-5-1d-builder-orphan-check.ts | Read-only diagnostic — triple sub-check on the customerStory builder doc (refs / singletons+globals / audit-output presence). | stdout | CONTENT-1D |
| scripts/content/diag-tech-debt-14-service-nulls.ts | Read-only — service-only null-image scan (Tech Debt #14 original investigation). Walks every schema-declared non-primitive field on each service doc and classifies (null / undefined / valid / invalid). Reusable for customer 2+. | stdout | CONTENT-1D-CLEANUP (investigation) |
| scripts/content/diag-1d-cleanup-scope.ts | Read-only — generalised null-literal scope check across service / technology / customerStory. Distinguishes "null literal stored" from "field absent" via direct getDocument key inspection (GROQ projection conflates both). Cross-references audit-output Webflow population. Also serves as post-cleanup re-verification. | stdout | CONTENT-1D-CLEANUP (scope check) |
| scripts/content/probe-path-patch-syntax.ts | Read-only — picks one technology doc, constructs `client.patch(id).unset(['folds[_key=="..."].featuredImage'])`, calls `PatchBuilder.toJSON()` to inspect serialised payload. Confirms Sanity client accepts the path-patch syntax before destructive use. | stdout | CONTENT-1D-CLEANUP (probe) |
| scripts/content/cleanup-service-null-thumbnail.ts | DEV-6 Op A. 23 service docs; `_type` + `thumbnail === null literal` guard; surgical `.unset(['thumbnail'])`. Audit row: service-null-thumbnail-unset. | 23 unsets + 1 row | CONTENT-1D-CLEANUP |
| scripts/content/cleanup-technology-null-image-fields.ts | DEV-6 Op B. 101 technology docs; atomic per-doc patch covering 1–2 fields (thumbnail always; techLogo on 2 hardcoded _ids). Per-doc literal-null assertion + scope-membership consistency check. Audit row: technology-null-image-fields-unset. | 101 patches + 1 row | CONTENT-1D-CLEANUP |
| scripts/content/cleanup-technology-null-folds-featured-image.ts | DEV-6 Op C. Path-patch primitive (`folds[_key=="..."].featuredImage`). Walks each doc's folds[], collects _keys for null-featuredImage entries, validates _key is non-empty string, issues atomic patch per doc. 100 docs patched. Audit row: technology-null-folds-featured-image-unset. | 100 path-patches + 1 row | CONTENT-1D-CLEANUP |
| scripts/content/cleanup-customerstory-null-image-fields.ts | DEV-6 Op D. 17 customerStory docs; atomic per-doc patch covering 1–3 fields (companyProductImage on 5, thumbnail on 10, openGraphImage on 17). EXPLICITLY out of scope: companyLogo (Travel Tech Client deferred). Audit row: customer-story-null-image-fields-unset. | 17 patches + 1 row | CONTENT-1D-CLEANUP |

## Lib Files

| File | Exports | Purpose | Phase |
|---|---|---|---|
| src/lib/types.ts | PhaseStatus, Locale, MigrationTier, CmsAdapter interface, Zod schemas (FieldRecord/CollectionRecord/PageRecord) | Shared domain types + validation. Legacy `MigrationStatus` and `TemplateType` enums removed in CONTENT-1A — those now live in `pipeline/state-machine.ts` and `audit-types.ts` respectively. | MYGRATR-0 |
| src/lib/audit-types.ts | UrlStatus, TemplateType (canonical UPPERCASE enum), ClassificationMethod, InteractionType, CanonicalUrl, ScreenshotRecord, PageContent, ThirdPartyScript, ScriptInventory, HubSpotForm, TemplateClassification, CollectionRecord, AuditAnomaly | Audit pipeline types + canonical TemplateType | AUDIT-1 |
| src/lib/env.ts | env (parsed Zod schema), ensureWebflow/Firecrawl/Anthropic/Hubspot/Ahrefs/Sanity/SupabaseDb runtime guards | Validated env loader — single source of env access | SCHEMA-1 |
| src/lib/supabase.ts | createServerClient() | Supabase admin client (service role; bypasses RLS) | SCHEMA-1 |
| src/lib/pipeline/state-machine.ts | MigrationStatus (canonical string-literal union), assertValidTransition(), validNextStatuses() | Migration pipeline state machine | SCHEMA-1 |
| site/src/lib/env.ts | env (Zod-validated), site-scoped env loader with NEXT_PUBLIC_VERCEL_URL fallback | Validated env access for the Next.js app | SCAFFOLD-1 |
| site/src/lib/locale.ts | LOCALES, Locale, getLocaleFromPath, buildLocalePath, generateCanonical, generateHreflang | Locale routing + canonical/hreflang single source of truth | SCAFFOLD-1 |
| site/src/lib/sanity/client.ts | sanityClient (published + CDN), previewClient (drafts, authenticated) | Sanity clients for the Next.js app | SCAFFOLD-1 |
| site/src/lib/sanity/queries.ts | getSiteSettings | GROQ query stubs (CONTENT-1 expands) | SCAFFOLD-1 |
| site/src/lib/sanity/live.ts | sanityFetch, SanityLive | defineLive factory for live revalidation | SCAFFOLD-1 |
| site/src/lib/redirects/generated-redirects.ts | crawlRedirects | Auto-generated from ce-canonical-urls.json | SCAFFOLD-1 |
| site/src/lib/redirects/regex-redirects.ts | regexRedirects | Auto-generated from ce-regex-redirects.json | SCAFFOLD-1 |
| site/src/lib/redirects/webflow-redirects.ts | webflowRedirects | Auto-generated from webflow-redirects.csv | SCAFFOLD-1 |
| src/lib/content/sanity-write-client.ts | sanityWriteClient | `@sanity/client` write client for migration scripts. CONTENT-1D: switched to `SANITY_MIGRATION_WRITE_TOKEN` (least-privilege, single-dataset); module-load assertion throws if migration token missing OR if `SANITY_API_READ_TOKEN` also present (path-alias collision guard, F14). | CONTENT-1A (extended CONTENT-1D) |
| src/lib/content/webflow-read-client.ts | getCollectionItems(collectionId), WebflowItem type | Paginated Webflow REST v2 reader (offset+limit) | CONTENT-1A |
| src/lib/content/migration-tracker.ts | recordMigration({ collectionSlug, source, migrated, status, errorLog, parityBaselineCount }) | Upsert into content_migrations keyed by (org_id, migration_id, collection_slug). `parityBaselineCount` (CONTENT-1C) makes parity_score measure on the deduplicated set; vacuous success (denominator=0, migrated=0, no errors) yields 100. | CONTENT-1A (extended CONTENT-1C) |
| src/lib/content/ce-collection-ids.ts | CE_COLLECTION_IDS (29-key as-const map: 10 CONTENT-1A + 8 CONTENT-1B + 11 CONTENT-1C). CE_BLOG_COLLECTIONS (typed iteration array for the 7 blog source collections). | CE-specific Webflow collection IDs in scope for CONTENT-1A/1B/1C | CONTENT-1A (extended CONTENT-1B + 1C) |
| src/lib/content/migration-helpers.ts | toPortableText (async; two-pass JSDOM walk uploading inline `<img>` to real Sanity assets via `Promise.allSettled`; null guard at entry; `<figure>` rule skips iframe-in-figure), extractUrl, uploadImage, toRefs (validates `/^[a-f0-9]{24}$/i` and uses full Webflow ID as `_key`), extractOption, webflowSlug, fetchOptionIdMap (CONTENT-1C lift), resolveOption (CONTENT-1C lift), decodeHtmlEntities (CONTENT-1C), `deleteByIdStrict(client, id, expectedType)` (CONTENT-1D — `_id`-only deletion with `_type` validation before delete) | Shared helpers for every CONTENT-1B+ migrator | CONTENT-1B (extended CONTENT-1C, CONTENT-1D) |
| src/lib/content/url-builder.ts | urlForDoc({_type, slug}), inScopePathPrefixes() | URL construction for the 6 CONTENT-1D in-scope doc types (technology/service/customerStory/teamMember/review/bookACall); routes from `MYGRATR_SCHEMA_DESIGN_DECISIONS.md §10` | CONTENT-1D |
| src/lib/content/meta-scraper.ts | scrapeMeta(browser, url), withBrowser(fn), ScrapedMeta | Playwright-backed live-page meta extractor; `waitUntil: 'domcontentloaded'`, 20s per-page timeout, custom UA | CONTENT-1D |
| src/lib/content/meta-normaliser.ts | normaliseMeta({rawTitle, rawDescription}), truncateAtWord(s, max), NormaliseResult (titleWarnings/descriptionWarnings/warnings split) | Brand-suffix strip + length compliance + word-boundary truncation with whitespace-prefix fallback (F17). Hard rule: never pad/fabricate metaDescription. | CONTENT-1D |
| src/lib/content/meta-backfill-runner.ts | runMetaBackfill(opts), FieldPolicy enum, PreScrapeDecision, SanityDocLite | Shared runner enforcing every CONTENT-1D structural protection (F1 abort gate / F4 monotonic needsReview / F5 metaTitle-never-empty / F6 never-touch structural / F7 hook-before-URL / F8 truncation assertion / F13 1.5s delay / F21 split provenance) + hard-failure vs soft-warning row-status separation. | CONTENT-1D |

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
| `npm run redirects:extract` | Regenerate site/src/lib/redirects/* from audit-output (run after audit refresh) |
| `npm run scaffold:start` | Transition CE migration to scaffold_running (needs `-- --confirm`) |
| `npm run scaffold:complete` | Transition CE migration to scaffold_complete (needs `-- --confirm --preview-url=...`) |
| `npm run content:start` | Transition CE migration to content_running (needs `-- --confirm`) |
| `npm run content:migrate-tags` | Migrate 6 Webflow tag collections → Sanity `tag` (22 items) |
| `npm run content:migrate-blog-categories` | Migrate Webflow hubs → Sanity `blogCategory` (6 items) |
| `npm run content:migrate-glassdoor-reviews` | Migrate Webflow Glassdoor reviews → Sanity `glassdoorReview` (10 items) |
| `npm run content:migrate-benefit-values` | Migrate Webflow Client Benefits & Company Values → Sanity `benefitValue` (9 items) |
| `npm run content:migrate-staff-benefits` | Migrate Webflow Staff Benefits → Sanity `staffBenefit` (6 items) |
| `npm run content:verify-1a` | Final parity check for CONTENT-1A — exits 0 when all 5 collections hit 100% |
| `npm run content:migrate-team-members` | Migrate Webflow team → Sanity `teamMember` (28 items, real image asset uploads) |
| `npm run content:migrate-reviews` | Migrate Webflow reviews → Sanity `review` (26 items) |
| `npm run content:migrate-videos` | Migrate Webflow videos → Sanity `video` (32 items, Option-field resolution) |
| `npm run content:migrate-book-a-call` | Migrate Webflow book-a-call → Sanity `bookACall` (6 items) |
| `npm run content:migrate-events` | Migrate Webflow events → Sanity `event` (1 item) |
| `npm run content:migrate-tools` | Migrate Webflow tools → Sanity `tool` (2 items, API-key stripping) |
| `npm run content:migrate-downloads` | Migrate Webflow download → Sanity `download` (5 items) |
| `npm run content:migrate-downloads-access` | Migrate Webflow download-thank-you → Sanity `downloadAccess` (5 items) |
| `npm run content:verify-1b` | Final parity check for CONTENT-1B — exits 0 when all 8 collections hit 100% |
| `npm run content:verify-1c-prereqs` | Pre-flight: assert `migrations.status = content_running` and brief §2 slugs exist on each of the 11 CONTENT-1C collections |
| `npm run content:migrate-blog-posts` | Migrate 7 Webflow blog collections → Sanity `blogPost` (74 unique items after dedup against `Blogs & Guides` master) |
| `npm run content:migrate-compare-blogs` | Migrate Webflow `Compare Blogs` → Sanity `compareBlog` (30 items) |
| `npm run content:migrate-technology` | Migrate Webflow `Technology Pages` → Sanity `technology` (101 items, single pass) |
| `npm run content:migrate-services` | Migrate Webflow `Services` → Sanity `service` (23 items, Option-field enum resolution) |
| `npm run content:migrate-customer-stories` | Migrate Webflow `Customers / Customer Stories` → Sanity `customerStory` (18 items) |
| `npm run content:verify-1c` | Final verifier for CONTENT-1C — 29 hard-gate checks; exits 0 only when all pass |
| `npm run content:verify-1d-prereqs` | CONTENT-1D pre-flight verifier — 32 checks (token presence, migration state, doc counts, scrape scope, UNKNOWN URL overlap, smoke-test refs, Playwright, forbidden imports, Step 0a field presence) |
| `npm run content:test-url-builder` | Two-tier URL-builder assertion (Tier 1 known-good HARD; Tier 2 coverage INFO) |
| `npm run content:migrate-meta-technology` | Live-scrape meta backfill for 101 technology docs |
| `npm run content:migrate-meta-service` | Live-scrape meta backfill for 23 service docs |
| `npm run content:migrate-meta-customer-story` | Live-scrape meta backfill for 18 customerStory docs (virgin pre-scrape bypass) |
| `npm run content:migrate-meta-team-member` | Live-scrape meta backfill for 28 teamMember docs |
| `npm run content:migrate-meta-review` | Meta backfill for 26 review docs (description: snippet-copy-else-scrape) |
| `npm run content:migrate-meta-book-a-call` | metaTitle scrape for 6 bookACall docs (description: never-touch) |
| `npm run content:migrate-benefit-value-thumbnails` | F16 idempotent thumbnailImage upload for 9 benefitValue docs |
| `npm run content:migrate-staff-benefit-icons` | F16 idempotent icon upload for 6 staffBenefit docs |
| `npm run content:migrate-video-backup-image-retry` | F20 vacuous-success — record migration row when 0 videos need retry |
| `npm run content:fix-video-embed-link-encoding` | F20 vacuous-success — decode `&amp;` in mainVideoEmbedLink (0 docs needed it) |
| `npm run content:cleanup-smoke-test-docs` | Decision B: deleteByIdStrict on 5 SCHEMA-1 smoke-test docs in ref-graph order |
| `npm run content:cleanup-drift-docs` | DEV-3: deleteByIdStrict on 16 drift _ids (1 customerStory + 15 review) with pre-flight inbound-ref recheck + sample 404 retest |
| `npm run content:truncate-bookacall-metadescription` | DEV-4: truncate 6 bookACall metaDescriptions to ≤160 chars (per-doc length-snapshot guard) |
| `npm run content:unset-bookacall-stale-needsreview` | DEV-5: unset stale needsReview on 6 bookACall _ids (two-factor: needsReview===true + scrapedAt prefix) |
| `npm run content:verify-1d` | Final verifier for CONTENT-1D — `verifyContent1D()` throws on failure (F2). Use `-- --skip-state-check` pre-Step-8. |
| `npm run content:complete` | Step 8 state transition (`-- --confirm` required). Calls verifier WITHOUT try/catch (F2); transitions content_running → content_complete with metadata.content_phase block. |
| `npm run content:probe-path-patch-syntax` | CONTENT-1D-CLEANUP probe — confirms Sanity client accepts `folds[_key=="..."].featuredImage` path syntax via PatchBuilder.toJSON() (no commit) |
| `npm run content:cleanup-service-null-thumbnail` | CONTENT-1D-CLEANUP DEV-6 Op A — unset thumbnail on 23 service docs (literal-null guarded) |
| `npm run content:cleanup-technology-null-image-fields` | CONTENT-1D-CLEANUP DEV-6 Op B — unset thumbnail on 101 + techLogo on 2 technology docs (atomic per-doc) |
| `npm run content:cleanup-technology-null-folds-featured-image` | CONTENT-1D-CLEANUP DEV-6 Op C — path-patch unset `folds[_key="..."].featuredImage` on 100 technology docs |
| `npm run content:cleanup-customerstory-null-image-fields` | CONTENT-1D-CLEANUP DEV-6 Op D — unset companyProductImage / thumbnail / openGraphImage on customerStory docs (atomic per-doc; companyLogo OUT OF SCOPE) |

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

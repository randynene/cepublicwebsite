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
| `docs/design/TOKENS.md` | DESIGN-1 Step 1 | Per-token catalogue + provenance (Tailwind v4 CSS-first) |
| `docs/design/COMPONENTS.md` | DESIGN-1 Step 2 | Single-source primitive inventory for Step 4 template authors (806 lines) |
| `docs/CAPABILITY_LOG.md` | DESIGN-1 Step 9 (scaffolded at Step 2 milestone; Step 3 productisation IP consolidated at Step 3 close per Jake's direction) | Per-phase productisation IP — patterns Jake learns, frameworks, debugging approaches |
| `docs/design/TIER_1_INVENTORY.md` | DESIGN-1 Step 3 | LOCKED v1.0 — 5 Tier-1 components (1 High + 3 Medium + 1 Low); inventory contract for Step 3b/3c/3d/3e specs and TEMPLATE-* phases |
| `docs/design/components/{slug}.md` (×5) | DESIGN-1 Step 3 | 8-section complex-component specs — Behaviour · State machine · Tech stack · Timing · Breakpoints · Data binding · Edge cases · Acceptance criteria + Schema-vs-reality findings |
| `docs/briefs/active/MYGRATR-DESIGN-1_BRIEF_v2.0.md` | DESIGN-1 | Active phase brief (DEV-1 through DEV-12 logged in §15) |
| `docs/V0_PROMPT_TEMPLATE.md` | DESIGN-1 Step 5 | Canonical v0.dev prompt template — 6-section format; Sections 1/2/5/6 paste-as-is, Sections 3/4 per-template fill-in |
| `docs/templates/_examples/v0-prompt-{blog,team-member,review}.md` | DESIGN-1 Step 5 | 3 worked examples — detail-by-slug (blog, team-member) vs listing-no-slug (review); REVIEW carries both testimonial-swiper schema-vs-reality findings forward |
| `docs/design/storybook-deploy.md` | DESIGN-1 Step 4 | Customer-2 Vercel deploy runbook for Storybook (Framework Preset `Other`, `NEXT_PUBLIC_*` env-vars requirement, Standard Deployment Protection) |
| `tools/eslint/ui-strings.json` | DESIGN-1 Step 6 | Canonical chrome-string SoT — 14 keys with `_meta` provenance block; generator input for `site/src/lib/ui-strings.ts` |
| `docs/briefs/active/MYGRATR-DESIGN-1-BRIEF-A_v1.2.md` | DESIGN-1 Brief A | Brief A phase brief (Steps 4 + 5, closed) |
| `docs/briefs/active/MYGRATR-DESIGN-1-BRIEF-B_v1.3.md` | DESIGN-1 Brief B | Brief B phase brief (Steps 6 + 8); Step 6 closed at HALT 1 |

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
| REVIEW | /reviews/[slug] | Reviews | TEMPLATE-REVIEW (Jul 2026) |
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

**Static content (9):** homePage (/), aboutUsPage (/about-us), howItWorksPage (/how-it-works), contactPage (/contact), forDevelopersPage (/for-developers), workWithShawneePage (/work-with-shawnee), startHiringPage (/start-hiring/contact-info), notFoundPage (/404), privacyPolicyPage (/legals/privacy-policy — migrated from Webflow Legal pages collection).

**Removed 26 Jul 2026 (4):** retentionPage (/retention), sourcingPage (/sourcing), embeddingPage (/embedding), scaleThisWeekPage (/scale-this-week). All four URLs 301 rather than render — the first three to /how-it-works, the last to the homepage — so the documents backed no route. Schema types deleted; documents removed from the dataset via `npm run static:delete-retired-singletons`. See the deliberate-divergence block in `site/next.config.ts` and `data/webflow/parity-exceptions.json`.

**Calculator pages (2):** hiringCostCalculatorPage (/hiring-cost-calculator), priceComparisonCalculatorPage (/price-comparison-calculator). Logic hardcoded in Next.js; singletons hold marketing copy only.

## Sanity Globals (3)

- siteSettings — defaults for meta/OG, Organization JSON-LD, Clara chat, announcement bar, HubSpot portal ID (22809822)
- navigation — primary links, CTA button, locale dropdown
- footer — newsletter form ID, columns, legal links

## Site Components (`site/src/components/`)

### SCAFFOLD-1 components

| Component | Type | File | Purpose | Phase |
|---|---|---|---|---|
| LocaleProvider | client | locale-provider.tsx | Provides `Locale` via React context; useLocale() hook | SCAFFOLD-1 |
| GeoTargetlyScript | server | third-party-scripts.tsx | beforeInteractive GeoTargetly redirect | SCAFFOLD-1 |
| GtmHeadScript / GtmNoScript | server | third-party-scripts.tsx | GTM head + body iframe | SCAFFOLD-1 |
| GlobalScripts | server | third-party-scripts.tsx | LinkedIn, Hotjar, Clara, FB Pixel, HubSpot, GSAP, Swiper, Finsweet, Calendly | SCAFFOLD-1 |
| Nav | server stub | layout/nav.tsx | TEMPLATE-NAV will source from Sanity navigation global | SCAFFOLD-1 |
| Footer | server stub | layout/footer.tsx | TEMPLATE-FOOTER will source from Sanity footer global | SCAFFOLD-1 |

### DESIGN-1 Step 2 — primitives (`site/src/components/ui/`)

22 brand-inventory primitives + Icon foundation. Hand-built atop @radix-ui directly (no shadcn). CVA standardised for variant API. Folder-per-primitive structure: `site/src/components/ui/{name}/index.tsx`. Per-primitive source-of-truth comments document probe-driven decisions; full reference at `docs/design/COMPONENTS.md`.

| Primitive | Category | Path | Radix dep | Phase |
|---|---|---|---|---|
| Button | A — Foundation | `button/index.tsx` | — | DESIGN-1 Step 2 |
| Link | A — Foundation | `link/index.tsx` | — | DESIGN-1 Step 2 |
| Tag | A — Foundation | `tag/index.tsx` | — | DESIGN-1 Step 2 |
| Card | A — Foundation | `card/index.tsx` | — | DESIGN-1 Step 2 |
| Accordion | A — Foundation | `accordion/index.tsx` | `@radix-ui/react-accordion` | DESIGN-1 Step 2 (HALT 10 fix `4c0514f`) |
| Marquee | A — Foundation | `marquee/index.tsx` | — | DESIGN-1 Step 2 |
| Heading | B — Typography | `heading/index.tsx` | — | DESIGN-1 Step 2 |
| Text | B — Typography | `text/index.tsx` | — | DESIGN-1 Step 2 |
| PortableText | B — Typography | `portable-text/index.tsx` | `@portabletext/react` | DESIGN-1 Step 2 |
| Input | C — Forms | `input/index.tsx` | — | DESIGN-1 Step 2 |
| Textarea | C — Forms | `textarea/index.tsx` | — | DESIGN-1 Step 2 |
| Select | C — Forms | `select/index.tsx` | `@radix-ui/react-select` | DESIGN-1 Step 2 |
| Checkbox | C — Forms | `checkbox/index.tsx` | `@radix-ui/react-checkbox` | DESIGN-1 Step 2 |
| RadioGroup | C — Forms | `radio-group/index.tsx` | `@radix-ui/react-radio-group` | DESIGN-1 Step 2 |
| FormField | C — Forms | `form-field/index.tsx` | `react-hook-form` | DESIGN-1 Step 2 |
| HubSpotFormEmbed | C — Forms | `hubspot-form-embed/index.tsx` | — | DESIGN-1 Step 2 |
| Dialog | D — Overlays | `dialog/index.tsx` | `@radix-ui/react-dialog` | DESIGN-1 Step 2 |
| Tooltip | D — Overlays | `tooltip/index.tsx` | `@radix-ui/react-tooltip` | DESIGN-1 Step 2 |
| DropdownMenu | D — Overlays | `dropdown-menu/index.tsx` | `@radix-ui/react-dropdown-menu` | DESIGN-1 Step 2 |
| Toast | D — Overlays | `toast/index.tsx` | `@radix-ui/react-toast` | DESIGN-1 Step 2 |
| Image | E — Media + Layout | `image/index.tsx` | `@sanity/image-url` | DESIGN-1 Step 2 |
| VideoEmbed | E — Media + Layout | `video-embed/index.tsx` | — | DESIGN-1 Step 2 |
| Container | E — Media + Layout | `container/index.tsx` | — | DESIGN-1 Step 2 |
| Divider | E — Media + Layout | `divider/index.tsx` | — | DESIGN-1 Step 2 |
| Icon | Foundation | `icon/index.tsx` | — (sprite-based; 9 CE-derived glyphs) | DESIGN-1 Step 2 |

### DESIGN-1 Step 3 — Tier-1 components (`docs/design/components/`)

5 Tier-1 component specs locked at HALT 1 of Step 3. Each has an 8-section spec at `docs/design/components/{slug}.md`. Implementation paths under `site/src/components/` are TBD at TEMPLATE-* phases — likely `site/src/components/tier-1/` (cross-template) or `site/src/components/templates/{template-slug}/components/` (template-specific). Render utilities (#1) live at `site/src/components/utilities/` or `/animations/` (TBD).

| # | Spec slug | Scope | Live URL | Complexity | Tech stack | 3b/3d role |
|---|---|---|---|---|---|---|
| 1 | `section-fade-reveal-global` | GLOBAL render utility (14 templates) | sitewide | High | GSAP attribute-selector orchestration | 3d stress-test (HALT 3) |
| 2 | `home-hero-scale-in` | HOME | `/` | Medium | GSAP fromTo single-property | 3c batch |
| 3 | `nav-sticky-transition-global` | GLOBAL | sitewide | Medium | GSAP ScrollTrigger + plain JS handler | 3c batch |
| 4 | `testimonial-swiper-global` | GLOBAL (HOME, /reviews, /services) | various | Medium | Swiper 11 (library-mediated) | 3b first-spec (HALT 2 format-lock) |
| 5 | `service-card-grid-hover-reveal` | SERVICE landing | `/services` | Low (down-classified at HALT 1 L3) | CSS-only | 3c batch |

### DESIGN-1 Step 3 — Capture-asset directories (`docs/design/components/_assets/`)

5 component dirs × 2 leaf dirs (`screenshots/` + `recordings/`) = 10 leaf dirs. Empty at HALT 4 (Step 3 close); populated during TEMPLATE-* phases per Step-3 brief §4.

| Component slug | Asset dir |
|---|---|
| section-fade-reveal-global | `_assets/section-fade-reveal-global/{screenshots,recordings}/` |
| home-hero-scale-in | `_assets/home-hero-scale-in/{screenshots,recordings}/` |
| nav-sticky-transition-global | `_assets/nav-sticky-transition-global/{screenshots,recordings}/` |
| testimonial-swiper-global | `_assets/testimonial-swiper-global/{screenshots,recordings}/` |
| service-card-grid-hover-reveal | `_assets/service-card-grid-hover-reveal/{screenshots,recordings}/` |

### DESIGN-1 Step 4 — Storybook stories (`site/src/components/**/stories.tsx`)

30 stories on disk — Pair-rule one `stories.tsx` per primitive folder (25) + 5 Tier-1 scaffold-stage previews under `site/src/components/tier-1/`. Storybook 10.3.6 running `@storybook/nextjs` (webpack5 forced per Brief A v1.2 D2 lock). Tier-1 stories ship as primitive-composition previews per Hard Rule #7 — NO library wiring (no `gsap`, no `swiper` init, no working `ScrollTrigger`, no autoplay) until TEMPLATE-* time. Live on Vercel separate project at `https://mygratr-cloud-employee-storybook.vercel.app` (Standard Deployment Protection). Mechanical Pair-rule check: `find site/src/components/ui -mindepth 2 -name stories.tsx | wc -l` returns 25.

| Group | Count | Paths | Phase |
|---|---|---|---|
| A — Foundation | 6 | `site/src/components/ui/{button,link,tag,card,accordion,marquee}/stories.tsx` | DESIGN-1 Step 4 |
| B — Typography | 3 | `site/src/components/ui/{heading,text,portable-text}/stories.tsx` | DESIGN-1 Step 4 |
| C — Forms | 7 | `site/src/components/ui/{input,textarea,select,checkbox,radio-group,form-field,hubspot-form-embed}/stories.tsx` | DESIGN-1 Step 4 |
| D — Overlays | 4 | `site/src/components/ui/{dialog,tooltip,dropdown-menu,toast}/stories.tsx` | DESIGN-1 Step 4 |
| E — Media + Layout | 4 | `site/src/components/ui/{image,video-embed,container,divider}/stories.tsx` | DESIGN-1 Step 4 |
| Icon foundation | 1 | `site/src/components/ui/icon/stories.tsx` | DESIGN-1 Step 4 |
| Tier-1 (scaffold-stage) | 5 | `site/src/components/tier-1/home-hero-scale-in.stories.tsx` · `site/src/components/tier-1/nav-sticky-transition-global.stories.tsx` · `site/src/components/tier-1/section-fade-reveal-global.stories.tsx` · `site/src/components/tier-1/service-card-grid-hover-reveal.stories.tsx` · `site/src/components/tier-1/testimonial-swiper-global.stories.tsx` | DESIGN-1 Step 4 |
| **Total** | **30** | 25 primitive (Pair-rule) + 5 Tier-1 | |

Storybook config: `site/.storybook/main.ts` (22 lines incl. HALT 1 `env: (config) => ({...config, NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET})` fix) + `site/.storybook/preview.tsx` (26 lines; imports `globals.css` for Tailwind v4 utility availability).

### TEMPLATE-BLOG — template + shared components

| Component | Type | File | Purpose | Phase |
|---|---|---|---|---|
| BlogTemplate | server | `templates/blog/index.tsx` | Pattern-establishing first detail-page template — 277 lines composing Heading + Text + Image + PortableText + Card + Tag + Accordion + Container + Divider + Icon + Link + Breadcrumbs against the BlogPost read-model | TEMPLATE-BLOG |
| BlogPostJsonLd | server | `templates/blog/json-ld.tsx` | Builds BlogPosting + BreadcrumbList + (conditional) FAQPage schema.org objects + renders `<script type="application/ld+json">` blocks via `serializeJsonLd` | TEMPLATE-BLOG |
| Breadcrumbs | server | `shared/breadcrumbs.tsx` | Shared accessible breadcrumbs primitive — `<nav aria-label="Breadcrumb">` + ordered list with home/blog/category links. Reusable across detail-page templates | TEMPLATE-BLOG |

### TEMPLATE-TEAM_MEMBER — template + query module

| Component | Type | File | Purpose | Phase |
|---|---|---|---|---|
| TeamMemberTemplate | server | `templates/team-member/index.tsx` | Second pattern-apply detail template — hero + about + CTAs + time/expertise sidebar + author articles grid; dark/lime D2 skin; reconciliation complete (Team Member.html export = fidelity reference for simple detail templates) | TEMPLATE-TEAM_MEMBER |
| TeamMemberJsonLd | server | `templates/team-member/json-ld.tsx` | Builds Person + BreadcrumbList schema.org objects via `serializeJsonLd`; `worksFor` from siteSettings | TEMPLATE-TEAM_MEMBER |
| ReviewTemplate | server | `templates/review/index.tsx` | Third detail template — Review.html export fidelity; hero review card + related reviews grid; company H1 via `getReviewCompanyName()` | TEMPLATE-REVIEW |
| ReviewJsonLd | server | `templates/review/json-ld.tsx` | Builds Review + BreadcrumbList via `serializeJsonLd`; fixed 5-star rating | TEMPLATE-REVIEW |

### STATIC-1 — chrome components

| Component | Type | File | Purpose | Phase |
|---|---|---|---|---|
| Nav (Header) | server shell | `layout/nav.tsx` | Replaces SCAFFOLD-1 stub. Fetches `navigation` global, renders skip-link + logo + Container, hands data to NavClient client island. `role="banner"` landmark. | STATIC-1 |
| NavClient | client island | `layout/nav-client.tsx` | All interactive nav surface: hand-built Disclosure-pattern desktop dropdowns (Services 19 items + Resources 6 items), Radix Dialog mobile drawer with accordion sections + focus trap + scroll lock + Escape, pathname-aware locale switcher, Calendly CTA wired to canonical CE intro popup URL. | STATIC-1 |
| Footer | server | `layout/footer.tsx` | Replaces SCAFFOLD-1 stub. Fetches `footer` global. 4 columns + HubSpot newsletter via C6 HubSpotFormEmbed + legal links row + copyright with `{year}` token substituted at render. Dark-navy brand-tertiary surface. `role="contentinfo"` landmark. | STATIC-1 |
| BlogCard | server | `cards/blog-card.tsx` | Used by blogHub + 6 category hubs + compareHub. Image + category Tag + h3-wrapped Link title + excerpt + date + author byline. Single anchor per card on the title. | STATIC-1 |
| ResourceCard | server | `cards/resource-card.tsx` | Used by videosHub + toolsHub + downloadsHub + eventsHub. Image + type label (Video / Tool / Download / Event) + h3-wrapped Link title + excerpt + event date (when applicable). | STATIC-1 |
| CollectionCard | server | `cards/collection-card.tsx` | Used by servicesHub + technologyHub + customerStoriesHub + reviewsHub. Image + subline (companyName / position) + h3-wrapped Link title + arrow icon + excerpt. | STATIC-1 |

### Blog family (`site/src/components/blog/` + `templates/blog-hub/`) — design Jul 2026

| Component | Type | File | Purpose |
|---|---|---|---|
| BlogHubTemplate | server | `templates/blog-hub/index.tsx` | Shared shell for all 7 blog-family listing pages: hero (eyebrow/H1/lead/search) → topic pills → featured → grid → pagination → long-form + FAQ. CollectionPage + BreadcrumbList + ItemList + FAQPage JSON-LD. |
| ArticleCard | server | `blog/article-card.tsx` | 3 variants (default/feature/compact), single-anchor, hover lift (§2), 16:9 object-cover thumbs, degrade-clean byline. |
| FeaturedBlock | server | `blog/featured-block.tsx` | 1 large + 4 compact; logic in `lib/blog/featured.ts` (auto-fill to 5, suppress <8). |
| CategoryPill / AuthorByline | server | `blog/category-pill.tsx`, `blog/author-byline.tsx` | Shared atoms (spec §0), `self-start w-fit` pill, full-name byline with photo→initials fallback. |
| TopicPills / BlogSearchForm | server | `blog/topic-pills.tsx`, `blog/search-form.tsx` | §4 markup-only for Phase 1: pills = real `<a>` to topic hubs; search = real `<form method=get>`. |
| LongFormBand / BlogFaqAccordion | server | `blog/long-form-band.tsx`, `blog/faq-accordion.tsx` | 720px reading column + `<details>` FAQ, topic hubs only. |
| BlogPagination / SectionLabel / BlogBand | server | `blog/pagination.tsx`, `blog/section-label.tsx`, `blog/container.tsx` | Numbered 42px tiles; lime `<h2>` section labels; BlogBand imports header's own `CHROME_CONTENT_BAND`/`CHROME_H_PAD` for edge alignment. |
| ArticleBody / TableOfContents | server / **client** | `blog/article-body.tsx`, `blog/table-of-contents.tsx` | Anchored-heading prose (18px/29px, per-element font, gap-based rhythm); H2-only auto-generated floating TOC (sticky offset bound to header vars, scroll-tracking, active-item auto-scroll). TOC is the one client component. |

### Calculators (`site/src/components/templates/{price-comparison,hiring-cost}-calculator/`) — Jul 2026

| Component | Type | File | Purpose |
|---|---|---|---|
| PriceComparisonCalculator | client | `templates/price-comparison-calculator/calculator.tsx` | In-house vs CE by region/seniority/headcount; state in URL query (shareable). Model + rates in `lib/calculators/price-comparison.ts` (rates from Sanity). |
| HiringCostCalculator | client | `templates/hiring-cost-calculator/calculator.tsx` | CE cost + saving by company/talent region + currency; model recovered empirically in `lib/calculators/hiring-cost.ts` (50-dev clamp). |

## Site Routes (`site/src/app/`)

| Route | File | Type | Purpose | Phase |
|---|---|---|---|---|
| `/` | page.tsx | static | homePage placeholder; TEMPLATE-HOME fills folds | SCAFFOLD-1 |
| `/uk` | uk/page.tsx | static | UK locale home placeholder; wraps content in `<main id="main">` (STATIC-1 Step 6 fix) | SCAFFOLD-1 + STATIC-1 |
| `/[category]/[slug]` | `[category]/[slug]/page.tsx` | dynamic (static-generated × 74) | TEMPLATE-BLOG default locale — `generateStaticParams` returns 74 (cat,slug) pairs; `generateMetadata` returns title/description/canonical/3-hreflang/OG; renders `<BlogTemplate locale="en-US">` wrapped in `<main id="main">` (STATIC-1 Step 6 fix) | TEMPLATE-BLOG + STATIC-1 |
| `/uk/[category]/[slug]` | `uk/[category]/[slug]/page.tsx` | dynamic (static-generated × 74) | TEMPLATE-BLOG UK mirror — single-document strategy; locale `'en-GB'`; same 74 (cat,slug) pairs as default; wrapped in `<main id="main">` (STATIC-1 Step 6 fix) | TEMPLATE-BLOG + STATIC-1 |
| `/team/[slug]` | `team/[slug]/page.tsx` | dynamic (static-generated × 28) | TEMPLATE-TEAM_MEMBER default locale — `generateStaticParams` returns 28 slugs; full Tier-1 metadata + Person JSON-LD + author blog-posts side query | TEMPLATE-TEAM_MEMBER |
| `/uk/team/[slug]` | `uk/team/[slug]/page.tsx` | dynamic (static-generated × 28) | TEMPLATE-TEAM_MEMBER UK mirror — same 28 docs; locale `'en-GB'` | TEMPLATE-TEAM_MEMBER |
| `/reviews/[slug]` | `reviews/[slug]/page.tsx` | dynamic (static-generated × 11) | TEMPLATE-REVIEW default locale — 11 published review docs; Review JSON-LD + related reviews side query | TEMPLATE-REVIEW |
| `/uk/reviews/[slug]` | `uk/reviews/[slug]/page.tsx` | dynamic (static-generated × 11) | TEMPLATE-REVIEW UK mirror — same 11 docs; locale `'en-GB'` | TEMPLATE-REVIEW |
| `/videos/[slug]` | `videos/[slug]/page.tsx` | dynamic (static-generated × 32) | TEMPLATE-VIDEO default locale — 32 `video` docs; VideoObject + BreadcrumbList JSON-LD; eager embed + backup-image poster | TEMPLATE-VIDEO |
| `/uk/videos/[slug]` | `uk/videos/[slug]/page.tsx` | dynamic (static-generated × 32) | TEMPLATE-VIDEO UK mirror — same 32 docs; locale `'en-GB'` | TEMPLATE-VIDEO |
| `/downloads/[slug]` | `downloads/[slug]/page.tsx` | dynamic (static-generated × 5) | TEMPLATE-DOWNLOAD default locale — 5 `download` docs; gated-asset layout + FaqList | TEMPLATE-DOWNLOAD |
| `/uk/downloads/[slug]` | `uk/downloads/[slug]/page.tsx` | dynamic (static-generated × 5) | TEMPLATE-DOWNLOAD UK mirror — same 5 docs; locale `'en-GB'` | TEMPLATE-DOWNLOAD |
| `/tools/[slug]` | `tools/[slug]/page.tsx` | dynamic (static-generated × 2) | TEMPLATE-TOOL default locale — 2 `tool` docs; calculator/tool layout + Loom embeds | TEMPLATE-TOOL |
| `/uk/tools/[slug]` | `uk/tools/[slug]/page.tsx` | dynamic (static-generated × 2) | TEMPLATE-TOOL UK mirror — same 2 docs; locale `'en-GB'` | TEMPLATE-TOOL |
| `/book-a-call/[slug]` | `book-a-call/[slug]/page.tsx` | dynamic (static-generated × 6) | TEMPLATE-BOOK_A_CALL default locale — 6 `bookACall` docs; self-loading Calendly inline scheduler (`calendly-inline-embed.tsx`) | TEMPLATE-BOOK_A_CALL |
| `/uk/book-a-call/[slug]` | `uk/book-a-call/[slug]/page.tsx` | dynamic (static-generated × 6) | TEMPLATE-BOOK_A_CALL UK mirror — same 6 docs; locale `'en-GB'` | TEMPLATE-BOOK_A_CALL |
| `/compare/[slug]` | `compare/[slug]/page.tsx` | dynamic (static-generated × 30) | TEMPLATE-COMPARE default locale — 30 `compareBlog` docs. **Pre-launch redirect collision with legacy `/compare → /alternatives` (Tech Debt #55).** | TEMPLATE-COMPARE |
| `/uk/compare/[slug]` | `uk/compare/[slug]/page.tsx` | dynamic (static-generated × 30) | TEMPLATE-COMPARE UK mirror — same 30 docs; locale `'en-GB'` | TEMPLATE-COMPARE |
| `/uk/[...slug]` | uk/[...slug]/page.tsx | dynamic | catch-all 404 placeholder until TEMPLATE-* defines explicit routes | SCAFFOLD-1 |
| `/not-found` | not-found.tsx | file convention | STATIC-1 404 page rendering `notFoundPage` singleton via Next.js App Router convention. Returns HTTP 404 + auto-injected + explicit `robots: noindex, nofollow` | STATIC-1 |
| `/blog` | blog/page.tsx | dynamic | STATIC-1 blog hub (74 posts → 7 pages). `generateMetadata` via `buildHubMetadata('blogHub')`; renders `renderHub(resolveHubRoute('blogHub'))` | STATIC-1 |
| `/staff-augmentation` | staff-augmentation/page.tsx | dynamic | STATIC-1 staff-augmentation blog category hub | STATIC-1 |
| `/nearshoring-offshoring` | nearshoring-offshoring/page.tsx | dynamic | STATIC-1 nearshoring + offshoring blog category hub | STATIC-1 |
| `/scaling-teams` | scaling-teams/page.tsx | dynamic | STATIC-1 scaling-teams blog category hub | STATIC-1 |
| `/hiring-tips` | hiring-tips/page.tsx | dynamic | STATIC-1 hiring-tips blog category hub | STATIC-1 |
| `/managing-engineers` | managing-engineers/page.tsx | dynamic | STATIC-1 managing-engineers blog category hub | STATIC-1 |
| `/ai-in-software-development` | ai-in-software-development/page.tsx | dynamic | STATIC-1 AI in software development blog category hub | STATIC-1 |
| `/videos` | videos/page.tsx | dynamic | STATIC-1 video library resource hub (ResourceCard surface) | STATIC-1 |
| `/tools` | tools/page.tsx | dynamic | STATIC-1 tools + quizzes resource hub | STATIC-1 |
| `/downloads` | downloads/page.tsx | dynamic | STATIC-1 free-downloads resource hub (filters `comingSoon != true`) | STATIC-1 |
| `/events` | events/page.tsx | dynamic | STATIC-1 events + webinars resource hub | STATIC-1 |
| `/services` | services/page.tsx | dynamic | STATIC-1 services collection-index hub (CollectionCard) | STATIC-1 |
| `/technology` | technology/page.tsx | dynamic | STATIC-1 technology collection-index hub (filters `listItemOnly != true`) | STATIC-1 |
| `/customer-stories` | customer-stories/page.tsx | dynamic | STATIC-1 customer-stories hub. `/our-work` 308s here. STATIC-1 Step 4 fixed an inherited regex-redirect that swallowed the bare hub root (`:slug*` → `:slug+`; Tech Debt #37) | STATIC-1 |
| `/reviews` | reviews/page.tsx | dynamic | STATIC-1 reviews hub | STATIC-1 |
| `/compare` | compare/page.tsx | dynamic | STATIC-1 compare hub. `/alternatives` 308s here | STATIC-1 |
| `/pricing` | — | redirect | STATIC-1 Step 5 — 308 to `/services` in `lockedRules` (locked Open Decision #1; restore real route when a future cycle adds a `pricingPage` schema) | STATIC-1 |
| `/sitemap.xml` | sitemap.ts | file convention | 2 static + 16 default-locale hub + 148 blog × 2 locales + 56 team × 2 locales + 22 review × 2 locales = **244 entries** via `URL_BUILDERS` (`blogPost` + `teamMember` + `review`) + `buildHubSitemapEntries`. UK hub entries dropped at Step 7 (Gap 1 — UK hub routes deferred). | SCAFFOLD-1 + TEMPLATE-BLOG + TEMPLATE-TEAM_MEMBER + TEMPLATE-REVIEW + STATIC-1 |
| `/robots.txt` | robots.ts | file convention | Env-gated: prod (`VERCEL_ENV === 'production'`) → `Allow: /` + sitemap; non-prod → `Disallow: /` | SCAFFOLD-1 |
| `/demo` | demo/page.tsx | static (production-guarded) | DESIGN-1 Step 2 — kitchen-sink primitive showcase; renders all 22 primitives + ~200+ mutation cases on one page; **NOT included in production builds** | DESIGN-1 Step 2 |

## API Routes

| Route | Method | File | Purpose | Phase |
|---|---|---|---|---|
| `/api/draft-mode/enable` | GET | site/src/app/api/draft-mode/enable/route.ts | 6-step security-ordered handler (CMA F-2 v1.3): Origin/Referer allow-list (fail-closed + F8 literal-`null` guard + BvR #34 v2.2 NODE_ENV-gated dev expansion via `safeUrlOrigin(request.url)`) → Origin/Referer check (with BvR #35 v2.2 null-origin escape hatch via `hasSanityPreviewSignature(url, origin, referer)` 3-param helper gating null/null on Sanity's 3-query-param signature) → preview-url-secret validation (F-6 try/catch + F7 no-leak) → redirectTo same-origin check (defense-in-depth per BvR #36 v2.2 — library API doesn't expose off-origin `redirectTo`; Tech Debt #20) → `draftMode().enable()` → redirect. Module-scope `previewValidationClient` helper (F-7 + F-12 + F12 v2.1 + M7 v2.2). | SCAFFOLD-1 + DESIGN-1 Brief B §8.5 (HALT 2 + HALT 3) |
| `/api/draft-mode/disable` | POST | site/src/app/api/draft-mode/disable/route.ts | Dual Origin AND Referer allow-list check (CMA F-3 Option A v1.3) + F8 v2.1 literal-`null` guard + F13 v2.1 explicit booleans + F11 v2.1 Referer-stripping edge-case comment (Tech Debt #18 for TEMPLATE-*) + BvR #34 v2.2 NODE_ENV-gated dev expansion (mirrored from enable route) → `draftMode().disable()`. GET→POST conversion per CMA F-1 v1.3 (button-click fetch, not iframe navigation). Disable has no preview-url secret; the dual-check IS the CSRF barrier. | SCAFFOLD-1 + DESIGN-1 Brief B §8.6 (HALT 2 + HALT 3) |

## Scripts

| Script | Purpose | Output | Phase |
|---|---|---|---|
| scripts/seo/gsc-pull.ts | Search Console performance pull (page / query / date dimensions) against the `sc-domain:cloudemployee.io` DOMAIN property, which spans www, non-www and subdomains so history is continuous across the cutover. Window ends 3 days back because GSC data is not final before then. `--days N`. | audit-output/seo-post-launch/gsc-{pages,queries,daily}.json | LAUNCH |
| scripts/seo/verify-gsc-urls.ts | Replays every URL with GSC impressions against production; collapses host/trailing-slash variants onto one path, then reports status, redirect target, title, canonical and noindex. Findings weighted by clicks so a broken URL that earns nothing is not ranked beside one that does. | audit-output/seo-post-launch/gsc-url-health.json | LAUNCH |
| scripts/seo/ahrefs-pull.ts | Ahrefs v3 pull: top pages, best-by-external-links, broken backlinks, organic keywords. Endpoints are attempted independently (plans differ in what they expose, one 403 must not abort the run) and column names are read off the API's available-columns error rather than assumed. | audit-output/seo-post-launch/ahrefs-*.json | LAUNCH |
| scripts/audit/static-2/extract-chrome.ts | Playwright-driven live-site chrome audit. Captures header + 3 mega-menus + footer from cloudemployee.io. GeoTargetly bypass + `__name` shim. 5-strategy icon extraction. Strategy 6 for Resources featured-card detection. | audit-output/static-2/{navigation,footer,scroll-behavior,slug-match-report,how-it-works-photo-comparison,assets-manifest,static-2-brief-deltas,static-3-brief-deltas}.json + assets/ | STATIC-2 |
| scripts/audit/static-2/probe-panel-shape.ts | Diagnostic probe of mega-menu DOM structure. Captures anchorOuterHtml + pseudo-element styles + sibling sweep + icon-class sweep + Resources card-shape sweep. One-off; informs Strategy 6 design. | audit-output/static-2/panel-shape-probe.json | STATIC-2 |
| scripts/static/seed-globals-v2.ts | STATIC-2 reseed. Resolves 25 references by slug (3 hand-curated customerStory via Decision A + 3 hand-curated blogPost via Decision B + 19 service/technology). Patches taglines (19 docs). Uploads 4 HIW inline images. createOrReplace on navigation + footer with v2 structure + legacy preservation + DELTA-6 /alternatives rewrite. Includes `announcementBar` default (STATIC-3). | navigation + footer Sanity globals; service/technology tagline patches | STATIC-2 / STATIC-3 |
| scripts/static/patch-announcement-bar.ts | STATIC-3 additive patch. Sets `navigation.announcementBar` only (no full reseed). Jake-run with `SANITY_MIGRATION_WRITE_TOKEN`. | navigation global patch | STATIC-3 |
| scripts/static/verify-static-2.ts | Phase-close gate. 6 GROQ-based checks: navigation new fields populated, footer new + legacy populated, 25 refs resolve, ≥19 taglines, /alternatives used (DELTA-6). Exit 1 on any fail. | stdout pass/fail per check | STATIC-2 |
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
| scripts/design/preflight-migrations-check.ts | Step 0 pre-flight: assert `migrations.status = content_complete` before any DESIGN-1 work | stdout | DESIGN-1 Step 0 |
| scripts/design/refresh-content-migrations-rows.ts | Step 0a: refresh `migrations.metadata.content_phase.content_migrations_rows` from stale 38 to actual 42 (REST-based; direct Postgres broken per Tech Debt #12) | Supabase metadata patch | DESIGN-1 Step 0a |
| scripts/design/verify-token-scope.mjs | Step 0c: probe Sanity token via `create()` + cleanup; only `statusCode: 403` or `401` proves read-only | stdout | DESIGN-1 Step 0c |
| scripts/design/diagnostic-1-type-source.mjs / diagnostic-2-navy-contexts / diagnostic-3-gap-probes / diagnostic-4 | Step 1 diagnostic probes (type-source classification, navy-context coverage, namespace gap probes, colour-aliasing diagnostic) | `audit-output/design-1/diagnostic-*.json` | DESIGN-1 Step 1 |
| scripts/design/extract-design-tokens.mjs | Step 1: extract design tokens from live CE source at 1440×900 + 768 + 375 breakpoints | TOKENS.md draft | DESIGN-1 Step 1 |
| scripts/design/extract-gsap-timings.ts | Step 1: GSAP runtime instrumentation shim (best-effort per F10/F11/F12 caveats) | `audit-output/design-1/gsap-{home,about,technology}.json` | DESIGN-1 Step 1 |
| scripts/design/measure-third-party-weight.mjs | Pre-Step-2 (DEV-6): measure third-party JS weight from CE live site (Node-built-in https + Accept-Encoding gzip; counts wire bytes) | `audit-output/design-1/third-party-weight.json` | DESIGN-1 DEV-6 |
| scripts/design/probe-{21 probes}.mjs | Step 2: Per-primitive CE-source pattern probes — `accordion-chevron`, `accordion-marquee-styles`, `blockquote-mobile`, `blockquote-styles`, `button-styles`, `card-styles`, `checkbox-radio-textarea`, `container-styles`, `divider-styles`, `eyebrow-styles`, `heading-styles`, `hubspot-embed`, `hubspot-mounted-dom`, `icon-inventory`, `image-quality`, `image-styles`, `input-styles`, `link-tag-styles`, `richtext-styles`, `text-styles`, `video-embeds`. Outputs consumed by per-primitive source comments. | `audit-output/design-1/{name}-probe.json` | DESIGN-1 Step 2 |
| scripts/design/build-icon-sprite.mjs / emit-icon-sprite.mjs / refetch-full-svgs.mjs / check-probe-doc-cleanup.mjs | Step 2: Icon sprite generation pipeline (build source-of-truth at `_icons/sprite.svg`, emit to `public/icons/sprite.svg`, refetch full SVGs from CDN, post-build cleanup) | `site/public/icons/sprite.svg` | DESIGN-1 Step 2 |
| scripts/design/verify-sanity-image-builder.mjs | Step 2: verify `@sanity/image-url` builder produces correct CDN URLs for E1 Image primitive | stdout | DESIGN-1 Step 2 |
| scripts/design/generate-ui-strings.mjs | Step 6: byte-idempotent generator — reads `tools/eslint/ui-strings.json` (canonical 14-key SoT) and emits `site/src/lib/ui-strings.ts` (do-not-edit TS const). Re-run is byte-idempotent on unchanged JSON input. | `site/src/lib/ui-strings.ts` | DESIGN-1 Step 6 |
| scripts/design/probe-ui-strings-reality.mjs | Step 6 §6.0a probe: one-shot seed-list provenance script — walks codebase JSX for visible chrome strings, emits inventory used to seed `tools/eslint/ui-strings.json`. Archived after one-shot use. | `audit-output/design-1/ui-strings-reality.json` | DESIGN-1 Step 6 |
| scripts/template-blog/probe-batch.ts | HALT 1 Probes 0–10 orchestrator (meta-fields, visual-reference, content-types, route-conflict, locale-state, etc.) | `audit-output/template-blog/probe-*.md` | TEMPLATE-BLOG |
| scripts/template-blog/capture-blogs.ts | HALT 1 Probe 1b — Playwright capture of 3 sample blog URLs on live CE (3 breakpoints each) | `audit-output/screenshots-template-blog/{complex,sparse}/{mobile,tablet,desktop}.png` | TEMPLATE-BLOG |
| scripts/template-blog/select-capture-targets.ts | HALT 1 Probe 1b — target slug selection helper | stdout | TEMPLATE-BLOG |
| scripts/template-blog/find-thumb-missing.ts | HALT 1 audit — thumbnail-image presence check across blogPost corpus | stdout | TEMPLATE-BLOG |
| scripts/template-blog/probe-content-block-types.ts | HALT 2 audit artifact — enumerate distinct `_type` values inside `blogPost.content[]` (surfaced the video gap, then the table gap at HALT 3) | stdout | TEMPLATE-BLOG |
| scripts/template-blog/probe-video-references.ts | HALT 2 audit artifact — Vimeo embed block enumeration across blogPost corpus (CONTENT-1E evidence) | stdout | TEMPLATE-BLOG |
| scripts/template-blog/probe-video-block-context.ts | HALT 2 audit artifact — per-video-block context drill (raw JSON of surrounding blocks) | stdout | TEMPLATE-BLOG |
| scripts/template-blog/probe-spot-check-urls.ts | HALT 3 pre-flight — variation-axis URL selection (6 axes × 14 URLs greedy coverage); writes `audit-output/template-blog/spot-check-urls.md` | markdown table | TEMPLATE-BLOG |
| scripts/template-blog/probe-spot-check-corpus.ts | HALT 3 pre-flight — corpus-shape verification (category count + TL;DR shape) | stdout | TEMPLATE-BLOG |
| scripts/template-blog/probe-rich-text-gaps.ts | HALT 3 pre-flight — corpus-wide table + blockquote + callout shape analysis (surfaced Tech Debt #25 expanded scope) | stdout | TEMPLATE-BLOG |
| scripts/template-blog/probe-rich-text-doc-drill.ts | HALT 3 pre-flight — per-doc `content[]` dump for onboarding-latam table-loss evidence | stdout | TEMPLATE-BLOG |
| scripts/content/probe-w-embed-sweep.ts | Step 1 read-only sweep probe across 5 doc types. Surfaces every `<div data-rt-embed-type>` + `<figure class="w-richtext-figure-type-video">` instance with classification (table / iframe / script / style-only / other). | `audit-output/content-1e/w-embed-sweep-inventory.json` | CONTENT-1E |
| scripts/content/migrate-w-embed-recovery.ts | Step 4 migrator. HARD GATE comment top (Studio deploy must precede). Dedup-aware pre-flight (classifies sweep targets as existing / dedupedToCanonical / orphan; halt on orphan). Halt-on-first-failure per-doc guards. Atomic `.patch.set({ [field]: newPortableText }).commit()`. Pre-patch snapshot per doc (Override 2). | Sanity patches + `content_migrations` row `w-embed-recovery` + snapshot files | CONTENT-1E |
| scripts/content/verify-content-1e.ts | Throws-on-failure verifier. Exports `verifyContent1E()`. 5 hard-gate checks: schema deployed (round-trip a `videoEmbed` block), `_type` frequencies match sweep (deduped-aware arithmetic), `migrations.status` unchanged at `content_complete`, `w-embed-recovery` row healthy, no regression on prior-phase rows. | (export) | CONTENT-1E |
| scripts/content/run-verify-content-1e.ts | CLI entrypoint. Calls `verifyContent1E()` without try/catch. | stdout; exits 0 / 1 | CONTENT-1E |
| scripts/content/patch-content-1e-parity-score.ts | One-shot Supabase row patch (commit 43fd606). Corrects the `w-embed-recovery` row's `parity_score` 89.77 → 100 (denominator was sweep-total instead of eligible-after-dedup) and appends a dedup-semantics note to `error_log`. Idempotent re-runs (no-op when already corrected). Companion fix in `migrate-w-embed-recovery.ts` switches `parityBaselineCount` to eligible count for future re-runs. | Supabase row update | CONTENT-1E |
| scripts/static/seed-globals.ts | Step 1 seeder. `createOrReplace` on the 3 Sanity globals (`navigation`, `footer`, `siteSettings`). Locked decisions threaded through (Embedding relabel, 19-item Services dropdown, 6-item Resources dropdown mirroring footer column 4). Visible `normalize()` helper strips em/en dashes from every string. | 3 Sanity docs | STATIC-1 |
| scripts/static/seed-hubs.ts | Step 1 seeder. `createOrReplace` on the 16 hub singletons + `notFoundPage`. Reads `audit-output/pages/<slug>/content.json` for 14 hubs; uses Jake-authored copy for `videosHub` + `staffAugmentationHub` (no Webflow source). Eyebrow + topicsHeader populated. | 17 Sanity docs | STATIC-1 |
| scripts/static/patch-hub-metadescriptions.ts | Step 1 follow-up. `.patch().set()` (NOT createOrReplace) on `videosHub` + `staffAugmentationHub` `metaDescription` (148 + 147 chars; clears the 140-160 Studio publish-warning floor). | Sanity patches | STATIC-1 |
| scripts/static/seed-default-og-image.ts | Step 1 follow-up. Sources CE Webflow homepage og:image (`usthumb.png`, 1470×796 PNG); validates PNG signature; uploads to Sanity as asset; patches `siteSettings.defaultOgImage` with the asset ref. Idempotent (re-runs upload a new asset + update the ref). | Sanity asset + patch | STATIC-1 |
| scripts/static/axe-not-found.ts | Step 2 gate. Playwright + axe-core scan of `/this-does-not-exist`. WCAG 2.1 AA ruleset; exits non-zero on any violation. | stdout + exit code | STATIC-1 |
| scripts/static/axe-hub.ts | Step 4 + Step 6 gate. Playwright + axe-core sweep across hub URLs (default: all 16; takes path args for a subset). | stdout + exit code | STATIC-1 |
| scripts/static/probe-nav-interactive.ts | Step 5 keyboard contract probe. Dropdown ArrowDown opens + Escape closes + focus returns to trigger; drawer Enter opens + Escape closes. | stdout + exit code | STATIC-1 |
| scripts/static/sweep-routes.ts | Step 6 gate. 11-route Playwright sweep + browser-console capture. Confirms `role="banner"` + `role="contentinfo"` + `<main id="main">` + skip link on every route. Filters expected third-party noise. | stdout + exit code | STATIC-1 |
| scripts/static/validate-json-ld.ts | Step 6 gate. JSDOM-parse every `<script type="application/ld+json">` on /services, a blog post, and the 404. Confirms expected schema.org types (CollectionPage + BreadcrumbList on hubs, BlogPosting + BreadcrumbList on posts, none on 404). | stdout + exit code | STATIC-1 |
| scripts/static/verify-static-1.ts | Phase-close gate. Combines every Step 1-6 check into a single pass/fail script. Pre-requisite: dev server running on localhost:3000. Exits 0 on full pass. | stdout + exit code | STATIC-1 Step 7 |

## Lib Files

| File | Exports | Purpose | Phase |
|---|---|---|---|
| src/lib/types.ts | PhaseStatus, Locale, MigrationTier, CmsAdapter interface, Zod schemas (FieldRecord/CollectionRecord/PageRecord) | Shared domain types + validation. Legacy `MigrationStatus` and `TemplateType` enums removed in CONTENT-1A — those now live in `pipeline/state-machine.ts` and `audit-types.ts` respectively. | MYGRATR-0 |
| src/lib/audit-types.ts | UrlStatus, TemplateType (canonical UPPERCASE enum), ClassificationMethod, InteractionType, CanonicalUrl, ScreenshotRecord, PageContent, ThirdPartyScript, ScriptInventory, HubSpotForm, TemplateClassification, CollectionRecord, AuditAnomaly | Audit pipeline types + canonical TemplateType | AUDIT-1 |
| src/lib/env.ts | env (parsed Zod schema), ensureWebflow/Firecrawl/Anthropic/Hubspot/Ahrefs/Sanity/SupabaseDb runtime guards | Validated env loader — single source of env access | SCHEMA-1 |
| src/lib/supabase.ts | createServerClient() | Supabase admin client (service role; bypasses RLS) | SCHEMA-1 |
| src/lib/pipeline/state-machine.ts | MigrationStatus (canonical string-literal union), assertValidTransition(), validNextStatuses() | Migration pipeline state machine | SCHEMA-1 |
| site/src/lib/env.ts | env (Zod-validated), site-scoped env loader with NEXT_PUBLIC_VERCEL_URL fallback. DESIGN-1 Brief B §8.1 tightened 3 vars (D14): `NEXT_PUBLIC_SITE_URL` `.catch()` fallback stripped → `z.string().url()`; `NEXT_PUBLIC_SANITY_STUDIO_URL` NEW (`.url().optional()` + conditional `.refine()` enforcing presence in non-development per F5 v2.1); `SANITY_API_READ_TOKEN` `.optional().default('')` → `z.string().min(1)`. | Validated env access for the Next.js app | SCAFFOLD-1 (extended DESIGN-1 Step 8) |
| site/src/lib/locale.ts | LOCALES, Locale, getLocaleFromPath, buildLocalePath, generateCanonical, generateHreflang | Locale routing + canonical/hreflang single source of truth | SCAFFOLD-1 |
| site/src/lib/sanity/client.ts | sanityClient (single client per CMA-C2 + D4; DESIGN-1 Brief B §8.3 collapsed SCAFFOLD-1's two-client baseline — `previewClient` export removed; draft perspective requested via per-fetch options). Stega gating per F1/F2/F4/F15 v2.1/I5 v2.2: explicit opt-in branch (`SANITY_STEGA_ENABLED=='1' && VERCEL_ENV!='production'`) + Vercel preview branch (NODE_ENV clause dropped per F2) + raw-env safety check (console.warn on prod+stega co-occurrence per I5 v2.2) + `stega.enabled` gated on `!!env.NEXT_PUBLIC_SANITY_STUDIO_URL` (F4 v2.1). `useCdn` gated on `!stegaEnabled` per F-9 v1.3. | Sanity client for the Next.js app | SCAFFOLD-1 (extended DESIGN-1 Step 8) |
| site/src/lib/sanity/queries.ts | getSiteSettings | GROQ query stubs (CONTENT-1 expands) | SCAFFOLD-1 |
| site/src/lib/sanity/live.ts | sanityFetch, SanityLive | `defineLive({ client: sanityClient, serverToken: env.SANITY_API_READ_TOKEN })` factory for live revalidation. DESIGN-1 Brief B §8.2 added the viewer-scoped `serverToken` slot per CMA-C2 + D5 — retasks `SANITY_API_READ_TOKEN` from SCAFFOLD-1's `previewClient` token role to the `serverToken` slot. | SCAFFOLD-1 (extended DESIGN-1 Step 8) |
| site/src/lib/redirects/generated-redirects.ts | crawlRedirects | Auto-generated from ce-canonical-urls.json | SCAFFOLD-1 |
| site/src/lib/redirects/regex-redirects.ts | regexRedirects | Auto-generated from ce-regex-redirects.json | SCAFFOLD-1 |
| site/src/lib/redirects/webflow-redirects.ts | webflowRedirects | Auto-generated from webflow-redirects.csv | SCAFFOLD-1 |
| src/lib/content/sanity-write-client.ts | sanityWriteClient | `@sanity/client` write client for migration scripts. CONTENT-1D: switched to `SANITY_MIGRATION_WRITE_TOKEN` (least-privilege, single-dataset); module-load assertion throws if migration token missing OR if `SANITY_API_READ_TOKEN` also present (path-alias collision guard, F14). | CONTENT-1A (extended CONTENT-1D) |
| src/lib/content/webflow-read-client.ts | getCollectionItems(collectionId), WebflowItem type | Paginated Webflow REST v2 reader (offset+limit) | CONTENT-1A |
| site/src/lib/seo/serialize-json-ld.ts | serializeJsonLd | XSS-safe JSON-LD serializer (CMA F4 v1.3 pattern). Escapes `<` / `>` / `&` (Unicode escapes) + U+2028 / U+2029 (JS-only line terminators). Used by all JSON-LD emission sites; locked in CONVENTIONS.md §"JSON-LD XSS-Safe Serialization". | TEMPLATE-BLOG |
| site/src/lib/sanity/image.ts | urlFor(source) | Sanity image-url builder for non-React contexts (generateMetadata, JSON-LD, OG fallbacks). E1 Image primitive uses its own builder internally for srcset; this is the imperative-call counterpart. | DESIGN-1 Step 2 / TEMPLATE-BLOG |
| site/src/lib/sanity/queries/blog-post.ts | BLOG_POST_QUERY, BLOG_POST_META_QUERY, RELATED_BLOG_POSTS_QUERY, BLOG_POST_PARAMS_QUERY, fetchBlogPost, fetchBlogPostMeta, fetchRelatedBlogPosts, fetchBlogPostParams | Parameterized GROQ queries + Zod parse boundary for blogPost type. Pattern-establishing for the 12 future TEMPLATE-* query modules. | TEMPLATE-BLOG |
| site/src/lib/sanity/queries/team-member.ts | TEAM_MEMBER_QUERY, TEAM_MEMBER_META_QUERY, AUTHOR_BLOG_POSTS_QUERY, TEAM_MEMBER_PARAMS_QUERY, fetchTeamMember, fetchTeamMemberMeta, fetchAuthorBlogPosts, fetchTeamMemberParams | Parameterized GROQ + Zod for teamMember detail + author blog-post side query + static params | TEMPLATE-TEAM_MEMBER |
| site/src/lib/sanity/queries/review.ts | REVIEW_QUERY, REVIEW_META_QUERY, RELATED_REVIEWS_QUERY, REVIEW_PARAMS_QUERY, fetchReview, fetchReviewMeta, fetchRelatedReviews, fetchReviewParams | Parameterized GROQ + Zod for review detail + related reviews side query + static params | TEMPLATE-REVIEW |
| site/src/lib/sanity/queries/service.ts | SERVICE_QUERY, SERVICE_META_QUERY, SERVICE_PARAMS_QUERY, fetchService, fetchServiceMeta, fetchAllServiceSlugs | Parameterized GROQ + Zod for service detail (`folds`, `associatedTechnologies`, `faqs`) + meta + static params | Phase 2A |
| site/src/lib/sanity/queries/technology.ts | TECHNOLOGY_QUERY, TECHNOLOGY_META_QUERY, TECHNOLOGY_PARAMS_QUERY, fetchTechnology, fetchTechnologyMeta, fetchAllTechnologySlugs | Parameterized GROQ + Zod for technology detail + meta + static params (listItemOnly deliberately routed, sitemap-excluded) | Phase 2A |
| site/src/lib/sanity/queries/shared-faqs.ts | SHARED_SERVICE_FAQS_QUERY, fetchSharedServiceFaqs | Fetches the `sharedServiceFaqs` singleton (three faqItem groups) for the two-layer FAQ model on service/technology detail pages | Phase 2A |
| site/src/lib/sanity/queries/catalogue-hub.ts | SERVICES_HUB_DATA_QUERY, TECHNOLOGY_HUB_DATA_QUERY, fetchServicesHubData, fetchTechnologyHubData (+ Zod schemas) | One round-trip per hub returning the hub singleton (hero/meta/FAQs) + full child list with grouping fields (`type`, `aiOffering`, `location`, `order`) | Phase 2B |
| site/src/lib/catalogue/content.ts | CatalogueContent + mapServiceToContent, mapTechnologyToContent | Sanity doc -> CatalogueDetail transform (folds -> sections, associatedTechnologies -> tech coverage, two-layer FAQs). Server-only. | Phase 2A |
| site/src/lib/catalogue/hub-content.ts | ServicesHubContent, TechnologyHubContent + mapServicesHubData, mapTechnologyHubData | Sanity hub data -> hub-template content. Data-driven service grouping; fixed brand furniture kept in template. Server-only. | Phase 2B |
| site/src/lib/review/display-name.ts | getReviewCompanyName, slugToDisplayName | H1/breadcrumb company label derivation (metaTitle prefix or slug humanization) | TEMPLATE-REVIEW |
| site/src/types/sanity/shared.ts | SanityImageSchema, PortableTextSchema (narrowed to TypedObject[]), FaqItemSchema, LocaleFieldSchema + types | Site-bound shared read-model Zod schemas. Read-model vs Studio write-model split per CONVENTIONS.md §"Read-Model Zod Co-Location". | TEMPLATE-BLOG (HALT 1) |
| site/src/types/sanity/documents/blog-post.ts | BlogPostSchema, BlogPostMetaSchema, RelatedBlogPostSchema, BlogPostAuthorSchema, BlogPostCategorySchema, BlogPostTagSchema + types | Read-model Zod for blogPost full + meta + related-post + dereferenced projections. Nullable adjustments at TB18 (author / date) match migrated data state. | TEMPLATE-BLOG (HALT 1) |
| site/src/types/sanity/documents/team-member.ts | TeamMemberSchema, TeamMemberMetaSchema, AuthorBlogPostSchema + types | Read-model Zod for teamMember detail + meta + author-post side query | TEMPLATE-TEAM_MEMBER |
| site/src/types/sanity/documents/review.ts | ReviewSchema, ReviewMetaSchema, RelatedReviewSchema + types | Read-model Zod for review detail + meta + related-review side query | TEMPLATE-REVIEW |
| site/src/components/ui/_utils/parse-sanity-image-ref.ts | parseSanityImageRef | Server-import-safe helper extracting `{width, height}` from Sanity asset `_ref` strings (`image-{hash}-{W}x{H}-{format}`). Extracted from E1 Image at HALT 2 (BvR #38) so server consumers can call without crossing the `'use client'` boundary. | TEMPLATE-BLOG (BvR #38) |
| src/lib/content/migration-tracker.ts | recordMigration({ collectionSlug, source, migrated, status, errorLog, parityBaselineCount }) | Upsert into content_migrations keyed by (org_id, migration_id, collection_slug). `parityBaselineCount` (CONTENT-1C) makes parity_score measure on the deduplicated set; vacuous success (denominator=0, migrated=0, no errors) yields 100. | CONTENT-1A (extended CONTENT-1C) |
| src/lib/content/ce-collection-ids.ts | CE_COLLECTION_IDS (29-key as-const map: 10 CONTENT-1A + 8 CONTENT-1B + 11 CONTENT-1C). CE_BLOG_COLLECTIONS (typed iteration array for the 7 blog source collections). | CE-specific Webflow collection IDs in scope for CONTENT-1A/1B/1C | CONTENT-1A (extended CONTENT-1B + 1C) |
| src/lib/content/migration-helpers.ts | toPortableText (async; two-pass JSDOM walk uploading inline `<img>` to real Sanity assets via `Promise.allSettled`; null guard at entry; `<figure>` rule skips iframe-in-figure), extractUrl, uploadImage, toRefs (validates `/^[a-f0-9]{24}$/i` and uses full Webflow ID as `_key`), extractOption, webflowSlug, fetchOptionIdMap (CONTENT-1C lift), resolveOption (CONTENT-1C lift), decodeHtmlEntities (CONTENT-1C), `deleteByIdStrict(client, id, expectedType)` (CONTENT-1D — `_id`-only deletion with `_type` validation before delete) | Shared helpers for every CONTENT-1B+ migrator | CONTENT-1B (extended CONTENT-1C, CONTENT-1D) |
| src/lib/content/url-builder.ts | urlForDoc({_type, slug}), inScopePathPrefixes() | URL construction for the 6 CONTENT-1D in-scope doc types (technology/service/customerStory/teamMember/review/bookACall); routes from `MYGRATR_SCHEMA_DESIGN_DECISIONS.md §10` | CONTENT-1D |
| src/lib/content/meta-scraper.ts | scrapeMeta(browser, url), withBrowser(fn), ScrapedMeta | Playwright-backed live-page meta extractor; `waitUntil: 'domcontentloaded'`, 20s per-page timeout, custom UA | CONTENT-1D |
| src/lib/content/meta-normaliser.ts | normaliseMeta({rawTitle, rawDescription}), truncateAtWord(s, max), NormaliseResult (titleWarnings/descriptionWarnings/warnings split) | Brand-suffix strip + length compliance + word-boundary truncation with whitespace-prefix fallback (F17). Hard rule: never pad/fabricate metaDescription. | CONTENT-1D |
| src/lib/content/meta-backfill-runner.ts | runMetaBackfill(opts), FieldPolicy enum, PreScrapeDecision, SanityDocLite | Shared runner enforcing every CONTENT-1D structural protection (F1 abort gate / F4 monotonic needsReview / F5 metaTitle-never-empty / F6 never-touch structural / F7 hook-before-URL / F8 truncation assertion / F13 1.5s delay / F21 split provenance) + hard-failure vs soft-warning row-status separation. | CONTENT-1D |
| site/src/lib/ui-strings.ts | UI_STRINGS const (49 keys post-STATIC-1) | Generated chrome-strings map (do-not-edit; regenerate via `npm run generate-ui-strings`). Enforced by `react/jsx-no-literals` (upstream) + `local/no-conditional-strings-in-jsx` (project-local) per CONVENTIONS.md §UI_STRINGS Rule. STATIC-1 Step 6 added 19 chrome keys (nav.* + footer.* + hub.*). | DESIGN-1 Step 6 (extended STATIC-1) |
| site/src/lib/url.ts | toInternalHref(rawHref) | URL normalization helper. Strips known CE hosts (`www.cloudemployee.io`, `cloudemployee.io`, `NEXT_PUBLIC_SITE_URL`) and returns bare pathname so `next/link` routes Sanity-stored URLs as internal navs. Direct `process.env.NEXT_PUBLIC_SITE_URL` read (Tech Debt #22 bridge — client components can't import `@/lib/env`). Used by Header, Footer, 404 CTA, hub cards. | STATIC-1 Step 2 |
| site/src/lib/sanity/queries/navigation.ts | NavigationSchema (Zod) + types + fetchNavigation | Fetches `navigation` global via `sanityFetch`. Zod parse at boundary. `hasDropdown(link)` predicate. | STATIC-1 Step 5 |
| site/src/lib/sanity/queries/footer.ts | FooterSchema (Zod) + types + fetchFooter + resolveCopyright | Fetches `footer` global via `sanityFetch`. `resolveCopyright(text)` substitutes `{year}` with `new Date().getFullYear()` so the copyright string auto-updates without re-seeding. | STATIC-1 Step 3 |
| site/src/lib/sanity/queries/not-found-page.ts | NotFoundPageSchema (Zod) + types + fetchNotFoundPage + findCtaSection | Fetches `notFoundPage` singleton. `findCtaSection(page)` returns the first `ctaSection` from the `sections[]` polymorphic array. | STATIC-1 Step 2 |
| site/src/lib/sanity/queries/hubs.ts | HUB_CONFIG (16-row table: shape, childType, childSort, childFilter, categorySlug, cardKind, basePath, breadcrumbName, underBlog), HubSingletonSchema + HubChildItemSchema (Zod), fetchHubSingleton, fetchHubChildren, fetchHubChildrenCount, fetchSiteDefaultOgImage, getChildHref / getChildTitle / getChildImage helpers | One generic Sanity helper for all 16 hubs. Adding a hub is one row in `HUB_CONFIG`; no fetcher duplication. Sort orders locked per Amendment #3. | STATIC-1 Step 4 |
| site/src/lib/hubs/pagination.ts | HUB_PAGE_SIZE (12), parsePageParam, buildPagination, buildPageNumbers | URL-driven pagination: `?page=N` search param, page 1 has no suffix in canonical, page 2+ self-canonical. `notFound()` on invalid input or out-of-range. | STATIC-1 Step 4 |
| site/src/lib/hubs/render-hub.tsx | renderHub({ hub, hubType, items, featured, pagination }) | Shared hub render helper. Breadcrumbs → hero → featured (if any) → topicsHeader (blog hubs) or sr-only h2 (collection hubs, Step 6 heading-order fix) → main paginated grid → PaginationControl (prev/next + numbered badges). Inline `<script type="application/ld+json">` for CollectionPage + BreadcrumbList (via `serializeJsonLd`). React 19 hoists `<link rel="prev"/"next">` to head. | STATIC-1 Step 4 (+ Step 6 fix) |
| site/src/lib/hubs/metadata.ts | buildHubMetadata(hubType, searchParams) | Shared metadata builder. Returns `Metadata` with title, description, alternates (canonical with `?page=N` suffix on page 2+; hreflang languages), openGraph (with image cascade hub.openGraphImage → siteSettings.defaultOgImage → omit), twitter. | STATIC-1 Step 4 |
| site/src/lib/hubs/render-route.ts | resolveHubRoute(hubType, searchParams) | Orchestrator: fetches hub singleton + computes pagination + fetches page slice. `notFound()` on missing singleton or invalid page. | STATIC-1 Step 4 |

## npm Scripts

### Launch-parity + design (Jul 2026)

| Command | Runs |
|---|---|
| `npm run launch:capture-live` | Record what LIVE does for all 6,937 corpus URLs → `data/webflow/live-behaviour.json` (concurrency 2, retries, refuses partial baseline) |
| `npm run launch:verify-parity` | THE LAUNCH GATE — replay corpus vs target, compare by status class + destination-resolves; reads `parity-exceptions.json`. Run against a `npm start` production server |
| `npm run launch:verify-noindex` | Assert every non-canonical host serves `Disallow: /` |
| `npm run launch:verify-hubspot-forms` | Portal ID exposed + every form resolves + Sanity funnel order matches HubSpot redirect chain |
| `npm run content:capture-hubs` / `content:verify-hubs` | Capture hub lead + body + FAQs from live (dry-run default, `--apply`); verifier asserts every captured word is on the live page |
| `npm run content:capture-marketing` | Capture the marketing + post-conversion pages (incl. `calendlyUrl`) into their singletons |
| `npm run content:seed-blog-hero` | Seed §7 blog hero copy; MOVES the long lead into the long-form band (idempotent) |
| `npm run content:seed-calculator-rates` | Seed the 6-row price-comparison rate card from live |
| `npm run verify:hiring-cost` | Re-check the hiring-cost model against the live widget (900 figures) |
| `npm run redirects:job-roles` | Generate one-per-slug `/live-job-role/*` redirects from Webflow's export (NOT a catch-all) |
| `npm run content:retire-orphans` | Retire docs deleted from Webflow (dry-run default, `--apply`; ledger in audit-output) |

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
| `npm run generate-ui-strings` | DESIGN-1 Step 6: regenerate `site/src/lib/ui-strings.ts` from `tools/eslint/ui-strings.json` (byte-idempotent on unchanged input). 49 keys at STATIC-1 close. |
| `npm run static:seed-globals` | STATIC-1 Step 1: seed `navigation` + `footer` + `siteSettings` Sanity globals via `createOrReplace` |
| `npm run static:seed-hubs` | STATIC-1 Step 1: seed 16 hub singletons + `notFoundPage` via `createOrReplace` |
| `npm run static:verify` | STATIC-1 Step 7 phase-close gate: re-runs every check from Steps 1-6 against the dev server; exits 0 on full pass |

## ESLint Custom Tooling (`tools/eslint/`)

DESIGN-1 Step 6 introduced a project-local ESLint plugin under `tools/eslint/` to supplement upstream `react/jsx-no-literals` for the UI_STRINGS chrome-string discipline. Plugin namespace is `local/`. Test harness uses `Linter.verify` directly (not `RuleTester`) because ESLint 9 `RuleTester` silently no-ops on plugin-namespaced rules (BvR #26, logged for HALT 3 consolidation).

| File | Purpose | Phase |
|---|---|---|
| `tools/eslint/ui-strings.json` | Canonical SoT — 14 chrome-string keys + `_meta` provenance block. Consumed by `scripts/design/generate-ui-strings.mjs` to emit `site/src/lib/ui-strings.ts`. | DESIGN-1 Step 6 |
| `tools/eslint/plugin-local.js` | Plugin wrapper — exposes project-local rules under `local/` namespace for `site/eslint.config.mjs` registration | DESIGN-1 Step 6 |
| `tools/eslint/rules/no-conditional-strings-in-jsx.js` | Project-local rule (~65 lines) — covers the upstream `ConditionalExpression` branch gap left by `react/jsx-no-literals` (surfaced in Brief B §6.4) | DESIGN-1 Step 6 |
| `tools/eslint/__tests__/ui-strings.test.mjs` | 8-fixture `Linter.verify` AST-coverage harness — F7a regression-catch for upstream gap; F7b verifies custom rule. Plugin-namespace silent failure on ESLint 9 `RuleTester` (BvR #26) motivated the `Linter.verify` direct approach. | DESIGN-1 Step 6 |

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

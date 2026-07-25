# CHANGELOG.md

## Services + Technology wired to Sanity: detail pages, shared FAQs, and hubs (Phase 2A + 2B, Jul 2026)

The `/services` and `/technology` pages moved off hardcoded data files onto Sanity, rendering the approved design. **Detail pages** (`[slug]` + UK, commit `b95b1ae`): a transform (`site/src/lib/catalogue/content.ts`) maps each Sanity doc's `folds` into the CatalogueDetail design with zero content loss, and unknown slugs now 404 instead of serving generic boilerplate (which was silent duplicate content). FAQs use a **two-layer model matching live**: a shared Sanity singleton (`sharedServiceFaqs`, three groups) renders by default, and an optional per-page `faqs` override replaces it for any page that wants unique FAQs, a clean AEO upgrade path; FAQPage JSON-LD is emitted from a shared builder. **Hub index pages** (`/services`, `/technology` + UK, Phase 2B, uncommitted): a new data layer (`site/src/lib/sanity/queries/catalogue-hub.ts`) + transform (`site/src/lib/catalogue/hub-content.ts`) group the real Sanity services into the live sections **without a schema change**, using fields that already exist: featured (from Studio-editable `servicesHub.featuredItems`, with a fallback), specialists (`type==staffAugmentation` && not AI && not a location page), AI (`aiOffering`), and product builds (`type==productBuilds`). Verified live: 20 grid cards in the exact live split (2 / 12 / 3 / 3), every card links to a real page (no dead links), tech-coverage chips resolve to real technology slugs, UK mirrors carry the `/uk/` prefix, the technology directory lists the real Sanity techs A-Z, and page title/description read from the hub singleton. Live H1s kept per Jake. tsc + lint clean; all four hub routes 200. `migrations.status` unchanged at `content_complete`.

## Blog family rebuilt to spec: 7 listing pages + article template + floating TOC (Jul 2026)

The blog family (`/blog` + 6 topic hubs + UK mirrors) was rebuilt to the D3 spec (`docs/blog_topic_hubs.pdf`), and the article detail template was widened and given an auto-generated floating table of contents. One shared shell (`site/src/components/templates/blog-hub/`) drives all 7 listing pages; the pieces (`site/src/components/blog/`) are the 3-variant ArticleCard with a hover lift, a featured block that auto-fills to 5 and suppresses itself below 8 articles, a full-width long-form + FAQ band in a 720px reading column (topic hubs only), and numbered pagination. The §7 hero table is seeded into Sanity with the LIVE H1s kept verbatim (Jake's call — the ranking phrase stays in the H1, no headline changed); the six topic hubs' long opening paragraph was MOVED into the long-form band, not overwritten. Two bugs surfaced and fixed while building: the featured block was showing 5 arbitrary UNDATED posts because 18 of 74 blog posts have no date and null sorts first in GROQ (`defined(date) desc` now leads every date-sorted hub); and every card had an empty excerpt because the one field most posts have — `metaDescription` — was neither projected nor in the excerpt chain. The article page (`site/src/components/templates/blog/`) moved its image into the body above the TL;DR (not a hero), dropped both breadcrumbs and the tag pills (BreadcrumbList JSON-LD retained), set body type to 18px/29px with consistent 20px rhythm, and got an H2-only TOC generated from the body (`site/src/lib/blog/toc.ts`) that sticks below the 126px header (offset bound to header CSS vars), tracks scroll, and auto-scrolls its own content to keep the active section visible on long articles. Search + pill FILTERING is deliberately Phase 2 — the pills ship as real `<a>` links and search as a real `<form method="get">` so no re-markup is needed later. `npm run generate-ui-strings` regenerated (208 keys). Parity held at 6,937/6,937 throughout. `migrations.status` unchanged at `content_complete`.

## MYGRATR-LAUNCH-PARITY — the parity gate, and everything it caught (Jul 2026)

The build moved from "add templates" to "prove the migration is safe". The governing artefact is now the **parity gate** (`npm run launch:verify-parity`): capture what the LIVE site does for every known URL, replay it against the new site, fail on any behavioural difference. The corpus is **6,937 URLs**, assembled from six sources because each has a blind spot the others cover: the April crawl, Webflow's redirect export, the live sitemap, Search Console, Ahrefs, and Webflow's page-list API (the only one that sees a page with no links and no rankings). Deliberate divergences live in `data/webflow/parity-exceptions.json`, each with who decided it and why: an allowlist, not a mute button, because a gate that accumulates known-red entries stops catching the unintended ones, which is the only thing it was built for.

**It found things nothing else could.** Every HubSpot form on the site was dead (`NEXT_PUBLIC_HUBSPOT_PORTAL_ID` was never exposed to the app, so forms rendered nothing at all: no error, no empty box). The Resources mega-menu's blog links 404'd on every page, SSR-mounted for crawlers. Site chrome ignored the locale, so ~290 UK pages linked into the US cluster. `/pricing`, `/our-work` and `/alternatives` would have been 301'd away at cutover: all three are live 200 pages, and the rules came from a design doc rather than from the live site. **robots.ts was serving `Allow: /` on staging**, because it gated indexing on `VERCEL_ENV === 'production'` and staging.jakevibes.dev IS this project's Vercel production deployment; indexing is now OPT-IN on the hostname, so a second indexed copy of the site cannot happen by accident. 29 dead job URLs were being redirected into a cross-domain 404 by a catch-all that had been "simplified" from Webflow's 336 explicit per-slug rules: a pattern that obviously generalises a list is a guess about the list.

**Built to close the gaps:** the 7 post-conversion pages x 2 locales (`/book-a-call` + the thank-yous, what forms and Calendly redirect TO, and the easiest pages in a migration to forget); hub body copy and FAQs (6,578 words, 54 FAQs, FAQPage JSON-LD, Tech Debt #44 - three content-loss bugs fixed at capture, including `.faq-btn` being the +/- glyph rather than the question, which silently captured zero FAQs on all sixteen hubs while appearing to work); and **both calculators**, rebuilt from CE's real cost models. The price-comparison model was readable in the page source and reproduces live across 60 scenarios; the hiring-cost model was buried in a minified bundle and was recovered by driving the live widget, reproducing **900 figures** exactly, re-checked on demand by `npm run verify:hiring-cost` so it fails loudly if CE change their rates rather than our pricing page quietly disagreeing with theirs.

**Two decisions recorded.** The hub designs rename the H1 on four ranking pages (`/services` becomes "Services", losing "Full Embedded Tech Teams"); **Jake chose to keep the live H1s** - changing headline copy during a domain migration means two variables at once, and `title` is a normal Sanity field Seb can change deliberately later. And `teamMember.ukOnly` exists because Webflow publishes per-locale: Caitlin Murray was removed from CE's US team but her UK bio is still live, so retiring her globally dropped a page live still serves (checked all 35 retired docs; she is the only one).

The last divergence of 6,937 was the gate catching the one mistake already warned about in a comment and then made again: the redirect generator collapsed `/uk/start-hiring/get-started` into `contact-info`, which is right for the US (where it IS a redirect) and wrong for the UK (where it is a real 200 page - the funnel's entry form). The two locales' funnels are not the same shape. `migrations.status` unchanged at `content_complete`.

## Visual Editing: live draft click-to-edit enabled end-to-end (Jul 2026)

Sanity Presentation click-to-edit now works site-wide, and draft edits stream into the preview live without publishing. Two fixes on `feat/design-1`, both surfaced while wiring the home page to Sanity. **(1) Stega-tolerant enums (`dd4fff2`):** draft/Presentation mode auto-enables stega (invisible per-field markers that power click-to-edit overlays), which broke every strict `z.enum` parse at the Sanity fetch boundary (`sectionLabelStyle` etc.) and 500'd every page in draft mode, the root cause of a run of "unable to connect" / "stale error" symptoms that did not reproduce in normal browsing (stega is off outside draft mode). New isomorphic `stegaEnum()` helper (`site/src/lib/sanity/stega-enum.ts`) `stegaClean`s the value before matching; applied to nav, footer, service, video, and locale enums. Display strings keep their stega so overlays still work; only logic/style fields are cleaned. **(2) Live draft streaming (`d22b1f9`):** added a viewer-scoped `browserToken` to `defineLive` so draft edits refresh the preview live (previously only published content live-updated; drafts needed a manual refresh). next-sanity ships `browserToken` to the browser only in draft mode, gated behind the secret-protected enable route. New CONVENTIONS section "Stega-Tolerant Enums at the Sanity Fetch Boundary". Pre-existing `reveal`-animation hydration warning logged as Tech Debt #57 (dev-only, from the Jul 9 motion layer, not this work). Not pushed. `migrations.status` unchanged at `content_complete`.

## MYGRATR-TEMPLATE-BOOK_A_CALL + TEMPLATE-COMPARE — detail pages (Jul 2026)

Two detail templates shipped together on `feat/design-1` via `docs/templates/TEMPLATE_FIDELITY_LOOP.md`. **Book-a-call: `/book-a-call/[slug]` + `/uk/book-a-call/[slug]`** — 6 `bookACall` docs × 2 locales, dark/lime layout with a **self-loading Calendly inline scheduler** (`calendly-inline-embed.tsx`): because the sitewide `widget.js` loads `lazyOnload`, the component now injects the Calendly stylesheet + script itself and polls for `window.Calendly.initInlineWidget` before mounting (a one-shot `getElementById` + `load` listener raced and silently never rendered). **Compare: `/compare/[slug]` + `/uk/compare/[slug]`** — 30 `compareBlog` docs × 2 locales. Both carry Tier-1 SEO (`generateMetadata` + twitter card, JSON-LD, sitemap builders). Also folded in: header Schedule-a-Call CTA arrow fix (`8a7b660`) — explicit non-rotated `chevron-right` `leadingGlyph` on `MegaMenuPillLabel` replaces the clipped `-rotate-45` diagonal. **PRE-LAUNCH blocker:** legacy `/compare → /alternatives` redirect (STATIC-2 DELTA-6) may swallow compare detail routes at cutover (Tech Debt #55). Remaining diagonal-arrow chrome CTAs logged as Tech Debt #56. Commits: `b85091b` (templates), `8a7b660` (chrome CTA). `migrations.status` unchanged at `content_complete`. PHASE_HISTORY.md detailed record deferred.

## MYGRATR-TEMPLATE-DOWNLOAD + TEMPLATE-TOOL — detail pages (Jul 2026)

Two detail templates shipped together on `feat/design-1` via the fidelity loop. **Download: `/downloads/[slug]` + `/uk/downloads/[slug]`** — 5 `download` docs × 2 locales, gated-asset layout with FaqList section. **Tool: `/tools/[slug]` + `/uk/tools/[slug]`** — 2 `tool` docs × 2 locales, calculator/tool layout with Loom embeds. Both carry Tier-1 SEO (`generateMetadata` + twitter card, JSON-LD, sitemap builders). Commit `8a0e3b2`. `migrations.status` unchanged at `content_complete`. PHASE_HISTORY.md detailed record deferred.

## MYGRATR-TEMPLATE-VIDEO — Video detail page (Jul 2026)

First template built through the reusable **`docs/templates/TEMPLATE_FIDELITY_LOOP.md`** (Conductor → Builder → QA loop: Step 0 probe, export-spec, computed diffs, Gate 6 visual review). **`/videos/[slug]` + `/uk/videos/[slug]`** — 32 `video` docs × 2 locales, dark/lime layout with eager video embed + backup-image poster, VideoObject + BreadcrumbList JSON-LD, Tier-1 `generateMetadata` + twitter card, sitemap `video` builder. Data gaps found at Step 0 and logged rather than mutated: `video.team` enum drift Studio-vs-data (Tech Debt #53), `metaTitle` 0/32 fill + `backupImage.alt` 0/32 + 1 null `backupImage` (Tech Debt #54). Commit `f6729d3`. `migrations.status` unchanged at `content_complete`. PHASE_HISTORY.md detailed record deferred.

## MYGRATR-TEMPLATE-REVIEW — Review detail page (Jul 2026)

Pattern-apply third detail template on `feat/design-1`, fidelity-matched to `docs/raw-html/Review.html` export (Team Member reconciliation is the reference for simple detail templates). **`/reviews/[slug]` + `/uk/reviews/[slug]`** — **11 published** `review` docs × 2 locales = 22 static routes (Sanity holds **11 total, 0 drafts**; CONTENT-1B migrated 26, CONTENT-1D drift cleanup deleted 15 — the other 15 are **missing from the dataset**, not unpublished drafts). Dark/lime layout: intro + 5-star badge, hero review card (company logo + reviewer + `testimonyParagraph` quote), `additionalInfo` box, 3-card related reviews grid. Case study link omitted (no `customerStory` ref on schema). H1 company label derived via `getReviewCompanyName()` (metaTitle when clean, else slug humanization — Tech Debt #52). Tier-1 SEO: `generateMetadata` + twitter card, `Review` + `BreadcrumbList` JSON-LD, sitemap `review` builder (**244** entries total), `validate-json-ld.ts` Review probe on `/reviews/salmon-software`. **PRE-LAUNCH blocker:** 3 slugs have legacy Webflow redirects to `/reviews` hub (`cameron-pearson`, `emsl`, `mercato`) — detail routes built but unreachable until redirect table fixed (Tech Debt #51). **Infra:** SanityLive refresh helpers scoped to draft mode only in root layout (`d876add`) — removes `BAILOUT_TO_CLIENT_SIDE_RENDERING` on published pages. Commits: `d22613f` (template stack), `d876add` (SanityLive). `migrations.status` unchanged at `content_complete`. Full record at PHASE_HISTORY.md.

## MYGRATR-TEMPLATE-TEAM_MEMBER — Team member detail page (Jul 2026)

Pattern-apply second detail template on `feat/design-1`. **`/team/[slug]` + `/uk/team/[slug]`** (56 static routes, 28 members × 2 locales) render all migrated `teamMember` docs in the dark/lime D2 skin: hero photo + name/position, About PortableText, optional Book-a-call + LinkedIn CTAs, time-at-CE stat, expertise lime pills, and **Articles from {name}** section (39/74 blogPosts carry `author→teamMember` refs; empty-state when none). Tier-1 SEO complete: `generateMetadata` with canonical/hreflang/OG/**twitter card**, `Person` + `BreadcrumbList` JSON-LD via `serializeJsonLd`, sitemap `teamMember` builder (222 entries total), `validate-json-ld.ts` Person probe on `/team/seb-hall`. Four-file convention matches TEMPLATE-BLOG. Data gap flagged: all 28 docs have null `teamMemberImage.alt` (template falls back to name). `migrations.status` unchanged at `content_complete`. Full record at PHASE_HISTORY.md.

## SEO/GEO reference docs (Jul 2026)

Infrastructure audit distilled into two gates on `feat/design-1`: `docs/seo/SEO_GEO_PER_TEMPLATE_CHECKLIST.md` (Tier 1 launch-blocking SEO/AEO criteria for every future TEMPLATE-* brief) and `docs/seo/SEO_GEO_SITEWIDE_GAP_FIX_BRIEF.md` (fix-once site-wide gaps: mega-menu SSR link visibility, Organization/WebSite JSON-LD, UK `lang` attribute). Logged as Tech Debt #47 in CLAUDE.md.

## MYGRATR-STATIC-3 — Chrome visual rebuild CLOSED (Jul 2026)

STATIC-3 closed on `feat/design-1`. **Step 5 — Footer rebuild** against `docs/raw-html/Footer.html`: modular `site/src/components/layout/footer/` (link grid mapped from STATIC-2 `sections[]` + `talentLocations`, HubSpot subscribe with export-matching shell, bottom bar with compact Region selector, `topCtaBlock` from Sanity). **Header/footer alignment** via shared `chrome-band.tsx` (`CHROME_CONTENT_BAND` 1152px + `CHROME_HEADER_ROW` flex nav). **Step 5+ polish:** tighter nav link gap, logo/menu/CTA spacing, footer bottom-bar logo + inline copyright, subscribe placeholder until HubSpot mounts. **Announcement bar** (Header.html frame 01): additive `navigation.announcementBar` schema (Studio deployed), `AnnouncementBar` render (32px slim strip, `#0A1628`, enabled=false collapses space + fixes reserved-gap bug), body padding via `--announcement-bar-height` with negative-margin sticky offset, seed via `scripts/static/patch-announcement-bar.ts` (linkUrl `/pricing`). **Step 6:** `validate-json-ld.ts` extended for `@graph` SiteNavigationElement flattening. `migrations.status` unchanged at `content_complete`. Full record at PHASE_HISTORY.md.

## MYGRATR-STATIC-3 — Mega-menu renderers + nav close (Jul 2026)

STATIC-3 Step 3/4 closed: Services + Resources mega-menus wired against Header.html frames 03/04 on the dark `#101B30` shell; How It Works demoted to a plain nav link (no dropdown); mobile drawer matches frame 06 lightweight section lists on `#070D18`. `MegaMenuPillLabel` gained additive `leadingArrow`; shell gained `#22314D` border + 20px radius. Sanity `howItWorksMegaMenu` data left in place but unused pending cleanup decision. Pill-style + left-column View-all data gaps flagged for Jake/Seb.

## MYGRATR-D3 - Entire screenshot-driven / existing-site category COMPLETE (Jun 2026)

D3 closes the full screenshot-driven category: chrome, all content-detail pages, all 5 index/hub pages, plus Pricing and Legal now designed in Claude Design. Remaining D3 is the Figma batch ONLY (Home, How It Works, Fractional CTO, Managed Pods, Referral, Locations); Engineering Sign-up + About blocked on Seb, Event deferred (needs screenshot).

## MYGRATR-D3 - All screenshot-driven detail + index templates designed (Jun 2026)

D3 detail + index templates designed in Claude Design: chrome, all content-detail pages (incl. Service/Technology built on the 5-fold modular system), and all 5 hub/index pages. Closes the screenshot-driven category; remaining D3 is Pricing + Legal, then the Figma batch (Home, How It Works, Fractional CTO, Managed Pods, Referral, Locations); Engineering Sign-up + About blocked on Seb.

## MYGRATR-D3 - Design progress: chrome + all content-detail templates + all 5 index/hub pages designed (Jun 2026)

D3 design now covers: chrome (Header, Footer, 404) done; all content-detail templates done (Team Member, Review, Video, Download + Thank You, Tool, Book a Call, Compare, Customer Story); all 5 index/hub pages done (Blog, Reviews, Customer Stories, Services, Technology, built from 2 card types: BlogCard + CollectionCard). Remaining D3: Service detail + Technology detail (HIGH), Home + How It Works (bespoke Figma reproduction), Legal; Event deferred (needs screenshot).

## MYGRATR-D3 - Chrome designed in Claude Design (Jun 2026)

D3 chrome (Header, Footer, 404) designed in Claude Design in the new dark/lime language: fonts confirmed (Inter + Source Serif 4 Italic), real logo in, em-dashes replaced with hyphens (now a standing rule in CLAUDE.md). Chrome done; page templates next.

## MYGRATR-D2 — Token re-extract: new dark/lime skin (Jun 2026)

Design-restart D2 (`docs/DESIGN_EXECUTION_ROADMAP.md`). Swapped the stale teal-era tokens for the new design's dark-default + lime (`#D4FF3C`) system in `site/src/app/tokens.css`, sourced from the LOCKED `docs/design/VISUAL_LANGUAGE_SPEC.md`: dual-mode semantic tokens (Dark = live `@theme` skin, Light via a `[data-theme="light"]` override), canonical dark ground `#070D18`, lime opacity scale (§1c) + contrast/pairing rules (§6) as comments, LIVE Inter Semi Bold type scale (H1 67 / H2 58 / H3 46), Source Serif 4 Italic accent, and §5 inferred spacing/radius/shadow flagged inferred-pending-Figma. Fonts swapped Poppins → Inter + Source Serif 4 Italic (`layout.tsx`); body re-grounded on the dark tokens (`globals.css`). DEV-1: old token names kept as remapped aliases so all ~30 primitives re-skin with zero edits; D4 migrates components onto the semantic names then deletes the aliases. On Jake's direction D2 also absorbed two D4 items: the lime-contrast pass (no white text on lime anywhere, plus the bg-text-default dark-surface regression fixes the text-default flip exposed) and the Accordion shape-edit (thin plus glyph + dark dividers, per the new FAQ reference). Storybook renders the existing primitives in the new skin; tsc + build clean (lint unchanged — pre-existing Tech Debt #36 only). `migrations.status` unchanged at `content_complete`. Full record at PHASE_HISTORY.md.

## MYGRATR-STATIC-2 — Chrome schema extensions + reseed (May 2026)

Schema + content phase closing the gap between STATIC-1's structurally-correct chrome and CE's live-site surface (STATIC-3 ships the visual rebuild on top). Five steps, 4 commits on `feat/design-1`. **Step 1 — Live-site audit script** (`scripts/audit/static-2/extract-chrome.ts`, ~2100 lines): Playwright-driven capture of header + 3 mega-menus + footer from cloudemployee.io with GeoTargetly bypass (en-US Accept-Language + script-route stub) + `__name` shim via `context.addInitScript` (tsx/esbuild emits `__name(fn, "name")` wrappers that break `page.evaluate`; the shim is the durable fix). Webflow ancestor-walk for dropdown triggers: nav-link anchor → `.w-dropdown-toggle` ancestor → sibling `.w-dropdown-list` panel; both tagged with `data-mygratr-toggle/panel` for deterministic re-query. 5-strategy icon extraction (img-src / svg-use / inline-svg / background-image / material-font with `.md-icon` class-name fallback). Strategy 6 added for Resources featured-card detection via `.resources-item-link` overlay anchors after DOM probe surfaced a structural gap (panel-shape-probe.json — diagnostic script). 4 STATIC-2 brief-vs-reality deltas surfaced + filed: A (footer CTA "Book A Call" not "Start building your team"), B (service mega-menu items render text-only on live site — DELTA-1 `service.thumbnail` backfill dropped from scope mid-phase), C (customer-story URL is singular `/customer-story/<slug>`), D (blog cards span multiple URL namespaces). 1 STATIC-3 delta filed (floating-pill scroll-triggered, not steady-state). 7 JSON outputs + asset downloads + 2 deltas files. **Step 2 — Schema extensions** (7 files, commit `26b06f0`): `studio/schemas/_shared.ts` extended `imageField()` with `altRequired?: boolean` opt; `studio/schemas/globals/navigation.ts` rewrite adds `primaryLinks[].dropdownType` discriminator + `servicesMegaMenu` (hybrid CMS-driven with reference unions to service+technology docs: leftColumn highlightedItems max-2 + flat items + rightColumnTop + rightColumnBottom.sections max-2) + `howItWorksMegaMenu` (3 cards + bottom panel, inline images per Option B) + `resourcesMegaMenu` (discriminated icon shape `material-font | asset` with `Rule.custom()` conditional validation, blogPost + customerStory ref arrays); `studio/schemas/globals/footer.ts` rewrite adds `topCtaBlock` + `sections[]` (with bottomPillLinks) + `talentLocations` + `subscribe` + `bottomBar` (with regionSelector); `service.tagline` + `technology.tagline` (optional, max 80 chars). Legacy fields preserved with `⚠️ Legacy field` markers for regression safety on STATIC-1 reads. Zod read-model types co-located with queries at `site/src/lib/sanity/queries/{navigation,footer}.ts` (NOT separate `types/sanity/globals/` — brief assumption corrected); service+technology Zod deferred to TEMPLATE-* phases. Studio deployed via `sanity deploy` (16.8s build, pinned `appId`). Pre-deploy backup at `audit-output/static-2/pre-reseed-backup.tar.gz` (943K, 422 docs, `--no-drafts --no-assets`). **Step 3 — Studio data backup verification**: backup integrity confirmed via 2nd-doc extraction (`service-685c184f00c519ab885df8e2` "iOS Developers" parses cleanly, pre-STATIC-2 `tagline` absent — correct rollback target); restore command documented at `audit-output/static-2/restore-instructions.md`. **Step 4 — Reseed** (`scripts/static/seed-globals-v2.ts`, ~700 lines, commit `0ee2548`): 19 taglines patched (1 skipped — empty captured tagline), 4 HIW inline images uploaded (2 unique net delta by Sanity content-hash dedupe), 25/25 references resolve (0 broken), 3 hand-curated customerStory refs (Salmon Software / Willo® / Event Connections) + 3 hand-curated blogPost refs (Decisions A + B), `createOrReplace` on navigation + footer with new structure + legacy fields preserved, footer `copyrightText` sanitized (audit regex over-grabbed), `/compare` rewritten to `/alternatives` (DELTA-6, HUB_CONFIG canonical). 1 query GROQ fix surfaced by Step 4 verify-pass: `featuredStories[]->{ "headline": coalesce(customerStoryTitle, companyName) }` — initial assumption used non-existent `headline` field. **Step 5 — Cross-cutting verification + phase close** (this commit): site `npm run build` passes after a 2nd query GROQ fix (drop explicit `hotspot, crop` projection — was triggering Zod null-tolerance vs `SanityImageSource` type mismatch on the `Image` consumer; now `image{asset, alt}` projection); studio + site tsc pass; STATIC-1 regression spot-check via local dev curl on `/blog` + `/services` + `/this-does-not-exist` confirms Header (6-link nav with "Our Clients" label) + Footer (legacy columns + legal links + copyright) still render; `scripts/static/verify-static-2.ts` gate runs 6 checks all PASS (nav new fields populated / footer new + legacy preserved / 25 refs resolve / 19 taglines / `/alternatives` used not `/compare`). `migrations.status` unchanged at `content_complete` — STATIC-2 is schema + content work, not a state transition. **Tech Debt #34 closed** (footer social icons — confirmed intentionally omitted from live site). **Known issue**: HIW bottomPanel image was the live black-arrow.png affordance (capture heuristic picked wrong image); uploaded faithful to audit. Seb edits in Studio when convenient. Customer-2 audit refinement candidate filed: image capture heuristic should skip UI-affordance assets when detecting hero-style content panel photos. 4 commits on `feat/design-1`. Full record at PHASE_HISTORY.md.

## MYGRATR-STATIC-1 — Site chrome: Header, Footer, 16 Hubs, 404 (May 2026)

Foundational chrome layer landed across 7 steps. Every template phase that follows renders inside this chrome. **Step 1 — Sanity seed**: 20 docs (3 globals + 16 hubs + 1 404) seeded via `createOrReplace` with locked decisions threaded through (Embedding relabel of one of two source "How It Works" labels, 19 hand-curated Services dropdown items, 6 Resources items mirroring footer column 4, hub URL pattern `/<category>` not `/blog/<category>` per Amendment #1, sort orders per Amendment #3). Author-voice rule observed: zero em or en dashes, including in copy lifted from `audit-output/pages/<slug>/content.json` (visible `normalize()` helper at the top of each seed script). **Step 1 follow-ups**: `videosHub` + `staffAugmentationHub` metaDescription patched to 148/147 chars (clears the 140-160 Studio publish-warning floor); `siteSettings.defaultOgImage` sourced from CE Webflow `og:image` (`usthumb.png` 1470×796 PNG), uploaded to Sanity assets, patched. **Step 2 — 404 page** wires `notFoundPage` singleton via Next.js App Router `not-found.tsx`; explicit `robots: noindex, nofollow` alongside Next's auto-injected noindex; new `toInternalHref()` helper at `site/src/lib/url.ts` strips known CE hosts → bare pathname (used by 404 now, reused by Footer + Header). **Step 3 — Footer** renders the seeded `footer` global on the dark-navy brand-tertiary surface; 4 columns (8/9/6/6 link counts), `{year}` token substituted at render time via `resolveCopyright()`, HubSpot newsletter via the existing C6 `HubSpotFormEmbed` primitive (form GUID `deac2450-b51b-4630-b9e2-47017a13da15`, portal `22809822`). **Step 4 — 16 hub routes** built on shared infrastructure (`site/src/lib/hubs/{pagination,render-hub,metadata,render-route}.*`) consuming `HUB_CONFIG` from `site/src/lib/sanity/queries/hubs.ts` (1 generic Sanity helper, 16 hubs × 23-line page.tsx files); pagination via `?page=N` (page 1 has no suffix in canonical), invalid input or out-of-range → `notFound()`; 3 fresh cards (BlogCard / ResourceCard / CollectionCard) with title-as-link single-anchor semantics; inline JSON-LD `CollectionPage` + `BreadcrumbList` via `serializeJsonLd`; sitemap extended with default-locale hub entries; 1 regex-redirect manual edit (`/customer-stories/:slug*` → `:slug+`, tech-debt flagged on the auto-generator). **Step 5 — Header** replaces SCAFFOLD-1 stub with server shell (skip-link + logo + Container) + a single client island for the desktop dropdowns (hand-built Disclosure-pattern, NOT Radix `DropdownMenu` whose `role=menu` is for application commands), mobile drawer (Radix Dialog for focus-trap + scroll-lock + Escape), locale switcher, Calendly CTA wired to the canonical CE intro popup URL (provenance: `audit-output/pages/contact/content.json`); `/pricing → /services` 308 added to `lockedRules`; two latent Tech Debt #22 bridge fixes pulled forward — `site/src/lib/url.ts` and `site/src/components/ui/hubspot-form-embed/index.tsx` swapped `import { env }` for direct `process.env.NEXT_PUBLIC_*` reads (the env.ts SANITY_API_READ_TOKEN `z.string().min(1)` would crash client hydration). **Step 6 — Cross-cutting verification**: 11-route sweep + console capture, JSON-LD validation across 3 page types, axe-core 0 violations across 6 pages, Lighthouse desktop Performance 82-99 + Accessibility 96-100 (after a heading-order fix on collection hubs — sr-only `<h2>` bridge between hub `<h1>` and card `<h3>` since collection hubs lack `topicsHeader`). 19 chrome strings converted to `UI_STRINGS` keys (49 total now in `tools/eslint/ui-strings.json`); 4 routes wrapped in `<main id="main">` so the skip-link target exists everywhere; 2 SCAFFOLD-1 placeholders had em dashes scrubbed. **Step 7 — Phase close**: dropped 16 `/uk/<hub>` sitemap entries (Gap 1; Step 4 brief seeded both locales but only built default-locale routes, so UK URLs 404 — cleaner to omit than to ask Google to crawl 404s; sitemap dropped from 182 → 166 entries; UK hub routes deferred to a future UK-locale phase). `migrations.status` unchanged at `content_complete`. **Tech debt added**: #34 (Footer social icons schema gap), #35 (defaultOgImage seeded from CE Webflow source, Seb may curate in Studio), #36 (10 pre-existing DESIGN-1 lint errors surfaced by Step 6 build-sanity check). **Tech debt learning**: future briefs that seed multi-locale sitemap entries must first confirm routes exist for every locale being seeded. 8 commits on `feat/design-1`. Full record at PHASE_HISTORY.md.

## MYGRATR-CONTENT-1E — Webflow w-embed recovery (May 2026)

Post-phase content patch on the closed CONTENT-1C migration; resolves Tech Debt #25. `migrations.status` unchanged at `content_complete`. CONTENT-1C used `@sanity/block-tools.htmlToBlocks` which flattens content inside Webflow RichText's custom-embed wrappers; CONTENT-1E recovers that lost content as structured Sanity types. **Schema additions**: `videoEmbed` + `table` PortableText types in `studio/schemas/objects/portable-text.ts` (deployed to production Studio at Checkpoint 2). **`toPortableText` deserializer extended** with 3 new branches: `figure.w-richtext-figure-type-video` → videoEmbed; `div[data-rt-embed-type]` containing `<table>` → table block (with first-row-`<th>` header detection regardless of `<thead>` wrapper + `.bold-col-one` → `boldFirstColumn`); `div[data-rt-embed-type]` containing `<iframe>` → videoEmbed; defensive catch-all → console.warn. Deterministic `_key`s: `{type}-{webflowId}-{position}`. **Migrator** `scripts/content/migrate-w-embed-recovery.ts` patches 79 docs (49 blogPost + 27 compareBlog + 3 customerStory) via field-level `.set({ content })` / `.set({ hiringNeedsTable })`; halt-on-first-failure + dedup-aware pre-flight (9 multi-collection blog mirrors deduped-to-canonical, skipped with audit log; 0 orphans). 149 embeds recovered (142 tables + 7 videoEmbeds). Pre-patch snapshots written to `audit-output/content-1e/pre-patch-snapshots/` (rollback escape hatch — OVERRIDE 2). **B3 PortableText renderers** for videoEmbed + table at `site/src/components/ui/portable-text/index.tsx` (brand-tertiary token for table header — locked Option α — no new design tokens). **`parseVideoUrl` extended** for LinkedIn URLs (`linkedin.com/embed/feed/update/urn:li:share:{id}` → `{provider: 'linkedin', id}`); LinkedIn iframes render via eager mode only (no autoplay query param). **Selector correction** at Checkpoint 1: Webflow's RichText API returns `<div data-rt-embed-type='true'>` wrappers (NOT `<div class="w-embed">` — that class only exists on the published Webflow site). Plan-encoded prior-diagnosis bug caught by the Checkpoint 1 probe before propagating downstream — Pattern 13 Layer 4 6th sub-example, extends the TEMPLATE-BLOG matrix from 5 → 6. Scope variance: planned 10-30 docs / 7.5h, actual 88 docs / 149 embeds / ~10-12h. Verifier `scripts/content/verify-content-1e.ts` + `run-verify-content-1e.ts` ships with 5 hard-gate checks. **New CONVENTIONS section**: "Post-Phase Content Mirror Constraint" — `content[]` is canonical mirror of Webflow RichText source until ContentReady-1; manual Studio edits don't survive re-migration. Tech Debt #25 resolved.

## MYGRATR-TEMPLATE-BLOG — Pattern-establishing first detail-page template (May 2026)

First TEMPLATE-* phase landed across 3 HALTs (recon → visual integration → SEO + close). Detail-page layout locks for the remaining 12 template phases: four-file fixed structure (route + GROQ/Zod + template + JSON-LD per `site/src/{app,lib/sanity/queries,components/templates}/`). 148 blog routes built across 2 locales; sitemap expanded from 2 → 150 entries. JSON-LD `BlogPosting` + `BreadcrumbList` + (conditional) `FAQPage` emitted server-side via the new `serializeJsonLd` XSS-safe helper at `site/src/lib/seo/`. Lighthouse acceptance hit: **SEO 100** (target ≥95) + **A11y 96** (target ≥95); Performance 79 + Best Practices 54 documented as SCAFFOLD-AUDIT scope (Tech Debt #29/#30/#31/#32 — third-party scripts + cookies + ClaraChatBot contrast + hero aspect-ratio). 6 new CONVENTIONS entries lock the template-* patterns (Detail-Page Template Pattern, Sanity Perspective Discipline, Parameterized GROQ Only, JSON-LD XSS-Safe Serialization, Read-Model Zod Co-Location, Next.js Statically-Generated Routes + VERCEL_ENV at Build Time). BvR ledger #37–#46 surfaced 10 brief-vs-reality findings (RSC→client cascade in E1 Image; B3 PortableText body→lead + inline-image rounded-lg + h5/h6 handlers; @sanity/image-url named export; Finsweet v2 ESM type="module"; PortableTextSchema TypedObject narrowing; parseSanityImageRef extraction; next.config qualities; layout.tsx revert). BvR #47 cancelled — robots.ts was already correctly env-driven; the Lighthouse SEO failure was a test-methodology artifact (build-time `VERCEL_ENV` needed). Pattern 13 Layer 4 sharpening — 5 sub-examples captured in CAPABILITY_LOG (status≠hydration · diagnosis≠Pattern13-exempt · HTTP-200≠script-executed · probes-need-probing · build-time-env). Brief archived to `docs/briefs/archive/`. `migrations.status` unchanged at `content_complete`. Full record at PHASE_HISTORY.md.

## MYGRATR-DESIGN-1 Brief B Step 8 — Visual Editing wiring + draft-mode route hardening (HALTs 2 + 3 close, May 2026)
Step-8-milestone partial-phase update on an open DESIGN-1 phase
(`migrations.status` unchanged at `content_complete`; DESIGN-1 does
not transition state per brief §0). 2 commits closed Step 8 across
HALTs 2 + 3: `b941c5a` (HALT 2 infrastructure — 7-file diff,
+367/-75) and `72ea7bf` (HALT 3 close — 5-file diff, +683/-32).
**Single-client architecture** collapses SCAFFOLD-1's two-client
baseline (`sanityClient` + `previewClient`) to a single `sanityClient`
export at `site/src/lib/sanity/client.ts` (per CMA-C2 + D4); draft
perspective is now requested via per-fetch options. Stega gating
rewritten per F1 / F2 / F4 / F15 v2.1 / I5 v2.2 — the
`NODE_ENV === 'development'` clause was dropped per F2 (always false
on Vercel preview, silently broke out-of-the-box Visual Editing),
raw-env safety check downgraded from throw to `console.warn` per
I5 v2.2 (alert-storm risk on module-scope cold-start traffic).
**`defineLive` with viewer-scoped `serverToken`** at
`site/src/lib/sanity/live.ts` retasks `SANITY_API_READ_TOKEN` from
SCAFFOLD-1's `previewClient` role to the `serverToken` slot per
CMA-C2. **Six-step security order on `/api/draft-mode/enable`
(GET)** per CMA F-2 v1.3 — invariant ordering of allow-list build
(F8 v2.1 literal-`"null"` + empty-string guard + F-1 fail-closed),
Origin/Referer check, preview-url-secret validation (F-6 try/catch +
F7 v2.1 no-Sentry-leak comment), `redirectTo` same-origin check
(defense-in-depth per BvR #36), `draftMode().enable()`, redirect.
Module-scope `previewValidationClient` helper extracted per F-7 +
F-12 v1.3 + F12 v2.1 + M7 v2.2 (optional chaining for the env-
missing diagnostic). **Dual Origin+Referer check on
`/api/draft-mode/disable` (POST)** per CMA F-3 Option A v1.3 — both
headers must match (NOT OR); disable has no preview-url secret, so
the dual-check IS the CSRF barrier. GET → POST conversion (button-
click fetch, not iframe nav). **Strict zod env schema** at
`site/src/lib/env.ts` per F-1 + F-6 v1.3 + F5 v2.1 + F12 v2.1 + M7
v2.2 — `NEXT_PUBLIC_SITE_URL` strips SCAFFOLD-1 `.catch()` fallback
→ `z.string().url()`; `NEXT_PUBLIC_SANITY_STUDIO_URL` NEW with
`.url().optional()` + conditional `.refine()` enforcing presence in
non-development; `SANITY_API_READ_TOKEN` tightens `.optional().default('')`
→ `z.string().min(1)`. **3 brief-vs-reality findings** discovered +
resolved during §8.7 manual smoke (HALT 3 BLOCK 3a) with full Pattern
13 audit lens applied: **BvR #34** — `NEXT_PUBLIC_SITE_URL`
canonical-vs-serving-origin split (canonical = `staging.jakevibes.dev`,
serving = `localhost:3000` in dev); resolved via NODE_ENV-gated dev-
only expansion of `allowedOrigins` (code fix over env override, to
avoid leaking localhost into canonical/hreflang URLs); **BvR #35** —
Sanity Presentation strips BOTH Origin and Referer on enable nav (D6
v1.3 reframe applied: preview-url-secret IS the auth signal; STEP 3
is the real gate, STEP 2 is supplementary CSRF defense); resolved
via null-origin escape hatch gated on Sanity's 3-query-param
signature (`hasSanityPreviewSignature(url, origin, referer)`
3-param helper); **BvR #36** — STEP 4 same-origin check not
exercisable end-to-end via `@sanity/preview-url-secret` library API
(library reads `sanity-preview-pathname` and parses it as same-
origin); STEP 4 retained as defense-in-depth (Tech Debt #20).
**Pattern 13 sharpened twice** in a single HALT (4 total layers at
v2.2): Layer 2 = defensive tests share authoring blindspot of the
finding they respond to (BvR #35); Layer 3 = 3rd-party library tests
need library-behavior probes before assertion design (BvR #36);
Layer 4 = manual smoke test as FIRST verification gate (invert v2.2
brief's §8.7 ordering for customer 2). **§8.7 integration test
coverage** — 9 of 10 curl tests PASS (a/b/d.1-4/d.5a/b/e); test (c)
STEP 4 not exercisable per BvR #36; manual round-trip PASS verified
against real Sanity Presentation flow. **4 CONVENTIONS.md entries
shipped** at §8.8: Entry 3 (Draft-Mode Route Hardening — full
rewrite supersedes SCAFFOLD-1 baseline) + Entry 2 (Sanity Fetch
Pattern) + Entry 4 (Env Schema Strictness) + Entry 5 (Visual
Editing Method Probe Discipline). **18 productisation patterns**
consolidated to `docs/CAPABILITY_LOG.md` DESIGN-1 H2 at HALT 3
BLOCK 3 (8 Visual Editing infrastructure + 6 ESLint rule adoption
methodology — Brief B Step 6 deferred IP + 4 Pattern 13 sharpening
layers); Customer-2 reusability matrix extended with all Step 8
patterns. **Tech Debt #18 / #19 / #20** added: Referrer-Policy at
disable UI page (TEMPLATE-*), DEBUG-logging probe step in future
brief authoring (customer 2 + future phases), STEP 4 defense-in-
depth coverage gap (future testing-infra phase). `tsc --noEmit`
clean. `npm run lint` returns 25 problems (unchanged pre-existing
baseline from HALT 1; all outside Brief B scope). `npm run build`
clean. Brief B Step 7 (per-template reference docs) drafting begins
next session — Step 8 closed before Step 7 due to phase-2 reordering;
DESIGN-1 Steps 7, 9, 10, 11 remain pending until phase close.

## MYGRATR-DESIGN-1 Step 6 — UI_STRINGS lint rule + canonical SoT (Brief B HALT 1 close, May 2026)
Step-6-milestone partial-phase update on an open DESIGN-1 phase
(`migrations.status` unchanged at `content_complete`; DESIGN-1 does
not transition state per brief §0). 1 commit closed Step 6 / Brief B
HALT 1: `5726e38` (13-file diff). Establishes UI_STRINGS as the
chrome-string canonical map enforced by two ESLint rules. Two-rule
architecture: upstream `react/jsx-no-literals` (from
`eslint-plugin-react@7.37.5`) with `noStrings: true` +
`allowedStrings` + `ignoreProps` covers most JSX text;
project-local `local/no-conditional-strings-in-jsx` covers the
upstream `ConditionalExpression` branch gap surfaced in Brief B
§6.4 (custom rule motivated by AST-coverage gap, not preference —
upstream rule skips conditional-expression branches that hold
literal strings). Canonical SoT at `tools/eslint/ui-strings.json`
(14 keys + `_meta` provenance block); byte-idempotent generator at
`scripts/design/generate-ui-strings.mjs` consumes JSON → emits
`site/src/lib/ui-strings.ts` (do-not-edit). `npm run
generate-ui-strings` added. 9 exemption file patterns registered
in `site/eslint.config.mjs` (Storybook stories Pair-rule +
flat-file, tests, demo route, Next.js framework templates, vendor
SDK init, generated `ui-strings.ts` itself). AST coverage:
8-fixture `Linter.verify` harness at
`tools/eslint/__tests__/ui-strings.test.mjs` — F7a regression-
catch for upstream gap, F7b verifies custom rule.
`Linter.verify` chosen over `RuleTester` because ESLint 9
`RuleTester` silently no-ops on plugin-namespaced rules (logged as
BvR #26 for HALT 3 capability-log consolidation). §6.3 codebase
fixes: `site/src/app/page.tsx` + `site/src/app/uk/page.tsx`
received 4 SCAFFOLD-1 comment-disables with TEMPLATE-HOME
reference (visible chrome strings on placeholder home stubs that
TEMPLATE-HOME will replace); `site/src/components/ui/hubspot-form-
embed/index.tsx` migrated 3 strings to UI_STRINGS via the
placeholder-as-split-template pattern; 2 new UI_STRINGS keys
added — `form.loading` and `form.error.loadFailed`. CONVENTIONS.md
gained a 212-line "UI_STRINGS Rule (post-DESIGN-1 Brief B)"
section covering both rules, 5-path violation triage, exemption
table, naming convention table, test infrastructure, generator
discipline. Brief-vs-Reality findings logged to gitignored
`audit-output/design-1/capability-log-draft.md` for HALT 3
consolidation: BvR #23 (§6.1.1 tsc CLI shape), BvR #24 (D3
exemption glob mismatch with Brief A Pair-rule), BvR #25
(`storybook-static/**` missing from `globalIgnores`), BvR #26
(ESLint 9 `RuleTester` plugin-namespace silent failure). 3
productisation IP patterns staged for HALT 3: placeholder-as-
split-template, two-gate ESLint rule verification, narrow custom-
rule supplement (capability-log consolidation deferred to Brief B
close per v1.3 protocol — HALT 1 does not consolidate). Lint
state at HALT 1 close: 25 problems (9 errors + 16 warnings), all
pre-existing rules outside Brief B scope — 5
`react/no-unescaped-entities` in `demo/_demo-client.tsx`, 2
`react-hooks/set-state-in-effect` in `hubspot-form-embed/index.tsx`,
2 `@typescript-eslint/no-empty-object-type` in `input`/`textarea`,
16 warnings (all flagged for HALT 3 tech debt log). Zero new
violations on either Brief B rule. `tsc --noEmit` clean. Brief B
Step 8 (Visual Editing wiring — HALTs 2 + 3) drafting begins next
session.

## MYGRATR-DESIGN-1 Step 4 + Step 5 — Brief A close (May 2026)
Brief-A-milestone partial-phase update on an open DESIGN-1 phase
(`migrations.status` unchanged at `content_complete`; DESIGN-1 does
not transition state per brief §0). 7 commits closed Brief A:
`bf2d6b6` (brief doc), `bd54c68` (build infrastructure §4.0–§4.3),
`268520e` (HALT 1 env-vars bug fix), `cde66ca` (§4.5 + §4.6 +
deploy runbook — HALT 1 closed), `e18bd3a` (Step 4 capability log
consolidation), `620a3b5` (Step 5 close — HALT 2 closed),
`64ef3fc` (Brief A close consolidation). Storybook scaffold:
30 stories (25 primitive Pair-rule per folder + 5 Tier-1
scaffold-stage). Pair-rule reconciled the brief's "23 stories"
logical-primitive count to 25 mechanical-folder count via BvR
finding #6 (C4 splits Checkbox + RadioGroup); Tier-1 stories
ship as primitive-composition previews per Hard Rule #7 (no
library wiring; ScaffoldNote panel describes what wires at
TEMPLATE-* time). Vercel separate-project deploy with Standard
Deployment Protection at
`https://mygratr-cloud-employee-storybook.vercel.app`. HALT 1
env-vars bug fixed: `@storybook/nextjs` does NOT auto-pass-through
`NEXT_PUBLIC_*` env vars to webpack DefinePlugin (semantic
divergence from Next.js conventions despite the framework name);
explicit `env: (config) => ({...config, NEXT_PUBLIC_X: ...})`
config function added to `.storybook/main.ts`. Two surface symptoms
(cn-undefined TypeError on Tier-1 stories; TDZ ReferenceError on
Image primitive's own meta export) traced to single env-throw
root cause. v0.dev prompt template: canonical
`docs/V0_PROMPT_TEMPLATE.md` (406 lines, 6-section format from
v2.0 brief §Step 5) + 3 worked examples (BLOG / TEAM_MEMBER /
REVIEW) at `docs/templates/_examples/` covering shape variation
(detail-page-by-slug vs listing-page-no-slug query; full-meta vs
no-OG-image meta). REVIEW example carries forward both schema-vs-
reality findings from `docs/design/components/testimonial-swiper-
global.md` per brief mandate (5-star rating field deferred to
STATIC-1 / SCHEMA-2; sibling `.swiper.testimonies` variant
decision deferred to TEMPLATE-REVIEW). 19 productisation IP
patterns captured in `docs/CAPABILITY_LOG.md` (13 Storybook setup
+ 6 v0.dev prompt template) plus 9 brief-vs-reality findings +
DEV-2 update + 1 new Tech Debt entry (Storybook adapter migration
to `@storybook/nextjs-vite` when `storybookjs/storybook#34688`
closes — defer to post-DESIGN-1 / customer-2 onboarding).
CONVENTIONS.md gained "Storybook Story Pattern" section
(72 lines) covering Pair-rule, primitive + Tier-1 story shapes,
mock-data discipline, render-only over args, env-vars gotcha,
mechanical Pair-rule check. Customer-2 deploy runbook at
`docs/design/storybook-deploy.md` (157 lines) captures the Vercel
project setup checklist + env-vars requirement + deployment-
protection mode + customer-2 reusability notes. Brief A's BvR
finding velocity (9 across Step 4 + 0 at Step 5) confirmed the
brief-quality-metric pattern: Step 5's zero-finding result
validates that Step 4's mental-model-gap captures landed.
Brief B (Steps 6 + 8 — ESLint rule + Visual Editing wiring)
drafting begins next session.

## MYGRATR-DESIGN-1 Step 3 — Tier-1 audit + 5 complex-component specs (May 2026)
Step-3-milestone partial-phase update on an open DESIGN-1 phase
(`migrations.status` unchanged at `content_complete`; DESIGN-1 does
not transition state). Tier-1 inventory locked at 5 components
(1 High + 3 Medium + 1 Low) — at the low end of the brief estimate
range (5–10), above the halt-trigger floor of 4. Components: #1
section-fade-reveal-global (High, GSAP attribute-selector
orchestration sitewide on 14 templates), #2 home-hero-scale-in
(Medium, GSAP fromTo single-property), #3 nav-sticky-transition-
global (Medium, GSAP ScrollTrigger + plain JS handler), #4
testimonial-swiper-global (Medium, Swiper 11), #5 service-card-
grid-hover-reveal (Low, CSS-only — down-classified from Medium at
HALT 1 lock L3 fallback after 3b probe). All 5 specs drafted at
`docs/design/components/{slug}.md` under the 8-section format
(Behaviour · State machine · Tech stack · Timing · Breakpoints ·
Data binding · Edge cases · Acceptance criteria + trailing Schema-
vs-reality findings). 1,044 lines total across inventory + 5 specs.
4 HALTs landed clean: HALT 1 (inventory lock, 4 lock decisions
L1–L4), HALT 2 (first-spec format-lock on testimonial-swiper, 6
format locks captured), HALT 3 (stress-test format finalisation
on section-fade-reveal, Path A mechanical trigger approved for
§6 GROQ-mandate utility-shape edge case), HALT 4 (Step 3 close,
2 decision-needed findings deferred per phase-pin). 9 schema-vs-
reality findings logged across 5 specs (1 schema-relax, 4
template-fallback, 1 N/A render-discipline, 3 decision-needed of
which 1 resolved at HALT 3 via Path A). 5 distinct §4 Timing
provenance shapes named explicitly (productisation IP): library-
mediated, GSAP-clean, GSAP-mixed, CSS-only, GSAP-attribute-
selector orchestration. Render-utility classification added as
third component category alongside primitive and Tier-1
component. Path A mechanical trigger ("does this component touch
Sanity data? if yes → GROQ; if no → N/A — render utility"
allowed) removes per-author judgment ambiguity. 2 decision-needed
findings deferred per phase-pin: testimonial F2 (sibling
`.swiper.testimonies` variant) → TEMPLATE-REVIEW; service-card-
grid F1 (`folds[0].subhead` projection) → TEMPLATE-SERVICE. Both
log as Tech Debt at Step 11 DESIGN-1 close. Capture-asset
directory tree skeleton at `docs/design/components/_assets/{slug}/
{screenshots,recordings}/` ready for population during TEMPLATE-*
phases. Brief-vs-reality finding pattern surfaced at HALT 4
(parallel to schema-vs-reality discipline) — when brief literal
conflicts with structural rule, structural wins; specific
instance: brief 3f.d "git add capability-log-draft.md" vs
audit-output/ gitignore — gitignore rule wins; running draft
stays gitignored, Step 9 consolidates into tracked
`docs/CAPABILITY_LOG.md`. Steps 4–11 of DESIGN-1 remain pending.

## MYGRATR-DESIGN-1 Step 2 — 22 primitives + Icon system + HALT 10 accordion correction (May 2026)
Step-2-milestone partial-phase update on an open DESIGN-1 phase
(`migrations.status` unchanged at `content_complete`; DESIGN-1 does
not transition state). 22 brand-inventory primitives shipped under
`site/src/components/ui/{name}/index.tsx` (folder-per-primitive per
v2.0 supersession of v1.5's flat shape) across categories A
Foundation (Button, Link, Tag, Card, Accordion, Marquee), B
Typography (Heading, Text, PortableText), C Forms (Input, Textarea,
Select, Checkbox, RadioGroup, FormField, HubSpotFormEmbed), D
Overlays (Dialog, Tooltip, DropdownMenu, Toast), E Media + Layout
(Image, VideoEmbed, Container, Divider). Icon foundation primitive
sprite-served from `/icons/sprite.svg` with typed `IconName` union
of 9 CE-derived glyphs (probe-driven from a candidate pool of 70+
via `probe-icon-inventory.mjs` + `icon-classification.json`). All
primitives hand-built atop @radix-ui directly — no shadcn (CE brand
is opinionated enough to warrant audit-driven probing; shadcn's
AI-aesthetic defaults net higher unwind cost than starting from
raw Radix). CVA standardised for the variant API across all 22.
GSAP banned from primitives (CSS transitions only); 21 probe
scripts in `scripts/design/probe-*.mjs` capture CE-source patterns;
25 DEV-N findings logged across primitives (DEV-13/14/20/24 token
amendments to `tokens.css`; DEV-23 `env.ts` amendment). Layout-root
providers (TooltipProvider + ToastProvider) mounted once at
`site/src/app/layout.tsx`; primitives consume context, never bring
their own. C5 FormField smart wrapper auto-handles ids + aria +
error reading via `useFormContext()` — register-based for
Input/Textarea/Checkbox/RadioGroup; Controller-based for Radix-
controlled Select. `/demo` kitchen-sink route (production-guarded,
dev-only visual reference) renders all 22 primitives + ~200+
mutation test cases on one page. tsc + build clean throughout.
HALT 10 visual eyeball confirmed all interactive primitives
functional. **One corrective patch landed** (commit `4c0514f`):
A5 Accordion icon restored from chevron-rotation to CE's plus → ×
in 24px black circle pattern (probe-verified across /services and
/technology FAQs; original HALT 2 framing as "Webflow artifact /
migration improvement" rescinded per DEV-12 retroactive correction
— Hard Rule #2 visual fidelity overrides "modern convention"
assumptions when a custom-named class signals intentional brand
design). One marquee placeholder-logo observation deferred to
Step 4 prep checklist (logo SVG asset gathering is a template-level
concern; primitives are width-agnostic by design — width is
parent-controlled). `docs/design/COMPONENTS.md` (806 lines) is the
single-source primitive inventory for Step 4 template authors;
`docs/CAPABILITY_LOG.md` created (NEW) with the token-system
architecture entry + 10 categorical primitive patterns harvested
from Step 2 + 4 HALT-discipline patterns captured at HALT 10. Steps
3–11 of DESIGN-1 remain pending. Brief deviations DEV-1 through
DEV-12 logged in §15 of v2.0 brief.

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

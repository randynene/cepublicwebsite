# MYGRATR-STATIC-2 — Session Brief

**Phase:** MYGRATR-STATIC-2 (Schema + Content)
**Phase weight:** Foundational (full Tier 3 discipline)
**Branch:** `feat/design-1` (continues from STATIC-1 close at commit `4f6d911`)
**State on entry:** `migrations.status = content_complete`
**State on exit:** `migrations.status = content_complete` (unchanged — chrome data work, no state transition)

**Revision history:**
- v1 — initial brief authored before STATIC-2 execution
- v1.1 — DELTA-B revisions applied after Step 1 audit (commit `0586eaf`). Service icon backfill (DELTA-1) dropped from scope after live-site probe confirmed service items render text-only. Resources left-column icon schema updated to discriminated `material-font | asset` shape. Asset count expectation revised downward (~7-9 new uploads, not 15-27). 4 brief-vs-reality findings logged in `audit-output/static-2/static-2-brief-deltas.json` (A: footer CTA label; B: service icons absent; C: customer-story URL singular; D: blog cards span multiple namespaces). 1 finding logged for STATIC-3 in `static-3-brief-deltas.json` (floating-pill is scroll-triggered, not steady-state).
- v1.2 — phase-close revisions applied after Step 5 close. §4 Files Modified list reconciled to actual commit scope: Step 2 = 7 files (not anticipated 10 — Zod types co-located in `site/src/lib/sanity/queries/` not `site/src/types/sanity/`; service+technology Zod types deferred to TEMPLATE-* phases; +1 `studio/schemas/_shared.ts` for `imageField` `altRequired` extension); Step 4 = 4 files (seed-globals-v2.ts + package.json + 1-line GROQ fix on navigation.ts + tsconfig.scripts-check.json). §3 Step 4 HIW bottomPanel data-quality note added: capture heuristic picked the live black-arrow.png affordance image instead of the intended hero photo; uploaded faithful to audit, Seb edits in Studio post-reseed. Customer-2 audit refinement candidate filed: image capture heuristic should skip UI-affordance assets when detecting hero-style content panel photos.

**Step status at v1.2 issue (final — all steps closed):**
- Step 0 — Plan-mode pre-flight: COMPLETE (resolved 8 deltas; all 11 brief-verification markers PASS)
- Step 1 — Live-site audit script: COMPLETE (commit `0586eaf`)
- Step 2 — Schema extensions: COMPLETE (commit `26b06f0`)
- Step 3 — Studio data backup: COMPLETE (verified Step 5; backup at `audit-output/static-2/pre-reseed-backup.tar.gz`, 943K, 422 docs)
- Step 4 — Reseed globals + tagline patches: COMPLETE (commit `0ee2548`; 19 taglines patched, 4 HIW assets uploaded, 25/25 refs resolve)
- Step 5 — Cross-cutting verification + phase close: COMPLETE (this commit)

---

## §1 — Purpose

STATIC-1 shipped a structurally-correct, SEO-clean chrome layer (Header + Footer + Hubs + 404). The visual surface does not match CE's live site. STATIC-2 closes the schema + content gap so STATIC-3 can rebuild the visual layer with no schema blockers and no missing content.

Specifically:
- Header dropdowns need group structure, icons, taglines, and image-card support (How It Works)
- Footer needs section grouping (Our Expertise / Learn more), Talent Locations column, restructured Subscribe block, bottom-bar links (Sitemap, Region, General Terms), CTA block at top ("Ready to hire your next engineer?")
- "How It Works" stops being a flat link and becomes the third mega-menu dropdown, linking to existing `/sourcing` + `/embedding` + `/retention` singletons
- "Embedding" stops being a top-nav primary link (the duplicate that STATIC-1 relabelled goes away)

STATIC-2 does **only** schema work + fresh content extraction + reseeding. Visual components stay as STATIC-1 shipped them. STATIC-3 picks up the visual rebuild against the new schemas + content.

**Architecture decision — hybrid CMS-driven Services mega-menu:** The Services mega-menu's items are NOT stored inline in `navigation.servicesMegaMenu`. They are `reference` arrays pointing to the existing `service` + `technology` Sanity docs. Each referenced doc supplies its own `name`, `thumbnail` / `techLogo` (icon — type-aware per DELTA-7, technology only), and a new `tagline` field added to those doc schemas. The `navigation.servicesMegaMenu` schema stores ONLY the structural template (which column / which section grouping / order). This means: editing "Software Engineers" service in Studio auto-updates the mega-menu. No drift. Customer-2 reusable.

**Note on service icons:** Step 1 audit (commit `0586eaf`) confirmed via panel-shape probe + reference screenshot that service mega-menu items render text-only on the live CE site — no icons. Service item DOM is just two text divs (name + tagline). The previously-planned `service.thumbnail` backfill (DELTA-1) is dropped from STATIC-2 scope. Services mega-menu renders text-only, matching the live site. `service.thumbnail` stays null on all 23 docs; the schema field is preserved for future editorial use. Technology mega-menu items continue to render icons via `technology.techLogo` (99/101 docs already populated from CONTENT-1A/1B). Type-aware GROQ projection (DELTA-7) still applies — services return `null` for icon, technologies return their `techLogo`.

Trade-off accepted: STATIC-2 extends `service` + `technology` schemas (adds `tagline`) and patches `tagline` on matched docs. Plan-mode + backup + reseed discipline applies.

**Migration discipline:** All schema changes are additive. The current `navigation` schema (per `MYGRATR_SCHEMA_DESIGN_DECISIONS.md §6.2`) ships with `primaryLinks[]` + `ctaButton` + `localeDropdown` + dead-on-arrival `cmsDriven` / `cmsCollection` scaffolding fields (the scaffolding was never wired; STATIC-1 set `cmsDriven: false` everywhere — marked deprecated alongside the legacy fields, removed in a future cleanup phase). The current `footer` schema (§6.3) ships with `newsletterFormId` + `copyrightText` + `columns[]` + `legalLinks[]`. The current `service` + `technology` schemas (per SCHEMA-1 build) have no `tagline` field — STATIC-2 adds it as optional. None of the existing fields get removed in STATIC-2 — STATIC-1's Header and Footer keep rendering against legacy fields throughout STATIC-2 and into STATIC-3 (regression-safety). STATIC-3 swaps reads to the new fields; legacy fields get cleaned up in a future schema-cleanup phase (Tech Debt entry at STATIC-3 close).

---

## §2 — Scope

### §2.1 — In scope

1. **Fresh audit of CE's live chrome** via a new dedicated audit script:
   - Header navigation (every primary link, every dropdown item, every icon URL, every tagline, every image)
   - Footer (every column, every link, every section grouping, every block)
   - **Per-item slug matching**: when scraping mega-menu items, match each item's URL (e.g. `/services/software-engineers`) to an existing Sanity `service` or `technology` doc by slug. This is the bridge that makes the hybrid CMS-driven approach work — Step 4 reseed populates the `navigation.servicesMegaMenu` with references to matched docs, NOT inline duplicates.
   - Scroll behavior of the header (capture the floating-pill transition CSS/timing for STATIC-3 reference — even though STATIC-3 ships the pill visual treatment, scroll-triggered animation refinement lands at TEMPLATE-HOME)
   - Output: `audit-output/static-2/{nav,footer,scroll-behavior,slug-match-report}.json` + asset downloads under `audit-output/static-2/assets/`

2. **Schema extensions** (Sanity Studio + corresponding Zod types):
   - `navigation` global — dropdown groups + image-card variant for How It Works + reference arrays to service/technology docs for Services mega-menu
   - `footer` global — top CTA block + section grouping + Talent Locations + restructured Subscribe + bottom-bar links
   - `service` document — add `tagline: string` (optional, max 80 chars, used by Services mega-menu)
   - `technology` document — add `tagline: string` (optional, max 80 chars, used by Services mega-menu "By Technology" column)
   - `notFoundPage` — no changes (current shape works)
   - `siteSettings` — no changes (defaultOgImage already seeded; nothing else needed)
   - **Image alt text**: every NEW image field in the schema extensions requires `alt: string` with `Rule.required()` validation. Existing image fields stay as-is (don't retrofit STATIC-2 — that's a separate scope).

3. **Reseed Sanity from fresh extract** via `scripts/static/seed-globals-v2.ts`:
   - `service` + `technology` docs: PATCH `tagline` field on each matched doc (don't `createOrReplace` — that would overwrite Seb's edits to other fields). Use `client.patch(id).set({ tagline: '...' })`.
   - `navigation` global with new structure (Services mega-menu references + How It Works + Resources mega-menu)
   - `footer` global with new structure (CTA block + grouped columns + Talent Locations + Subscribe + bottom-bar)
   - All asset URLs uploaded to Sanity as proper image refs (icons for items that DON'T match an existing service/technology doc, photos for How It Works cards, etc.)
   - Slug-match report from Step 1 surfaces any mega-menu item that DOESN'T match an existing service/technology doc → plan-mode decision: create the doc as a stub OR remove the item from the mega-menu (probably the former — the live site has the item, so the doc should exist).

4. **Embedding link removal from primary nav**:
   - The standalone `/embedding` primary link goes away
   - `/embedding` becomes a CTA inside the new How It Works mega-menu (alongside `/sourcing` and `/retention`)
   - No URL changes; `/embedding`, `/sourcing`, `/retention` singletons stay where they are
   - Header reorder: **Services / Our Clients / How It Works / Resources / Pricing / About Us** (6 primary links total, down from 7)

5. **Header label corrections** from the live site (STATIC-1 used CE_SITE_TRUTH which was thin):
   - **Primary nav 2nd link label is "Our Clients" (NOT "Customer Stories").** Confirmed via reference screenshots `docs/design/static-3-reference/header.png` + `mega-menu-resources.png`. "Customer Stories" is the heading of the THIRD column inside the Resources mega-menu — it is NOT the primary nav label. STATIC-2 reseed populates the primary nav with "Our Clients".
   - Re-extract confirms current live labels for all other primary nav items; align Sanity content to whatever the live site shows
   - URL for "Our Clients" link → confirm in audit (likely `/customer-stories` or `/our-clients`; the LABEL is "Our Clients" regardless of route slug)

### §2.2 — Out of scope

- Visual components — Header / Footer / mega-menus stay rendering the STATIC-1 structure. STATIC-3 rebuilds visuals.
- Homepage, service pages, technology pages — those are TEMPLATE-* work.
- Hub page redesign — STATIC-1 hubs stay as shipped.
- Performance / Lighthouse improvements — SCAFFOLD-AUDIT batch.
- UK-locale hub routes — future UK-locale phase.

### §2.3 — Locked decisions (decided before this brief)

- **/embedding stops being a top-nav primary link.** Becomes a CTA inside How It Works mega-menu.
- **How It Works mega-menu links to `/sourcing` + `/embedding` + `/retention`** (existing singletons, no new pages).
- **No social icons in footer** — confirmed by Jake from live site inspection. Tech Debt #34 is formally closed at STATIC-2 Step 5 phase-close commit: CLAUDE.md tech debt table entry #34 moves from "active" to "closed (intentionally omitted)" with phase reference STATIC-2.
- **Re-extract from live site is authoritative** — CE_SITE_TRUTH is no longer the source of truth for chrome content. Future briefs should treat `audit-output/static-2/*` as canonical for header + footer. CE_SITE_TRUTH stays canonical for everything else (template content, hub counts, etc.).
- **All schema changes are additive.** No field removals in STATIC-2. Legacy fields kept populated through STATIC-3 to preserve regression safety on STATIC-1's Header + Footer render.

---

## §3 — Build Order

Five steps. Each step ends with a verification gate before the next begins.

### Step 0 — Plan-mode pre-flight

Standard Step 0 discipline: validate every assumption this brief makes against actual state before any code runs.

**FIRST ACTIONS in Step 0 (before any item below):**

1. **View every reference screenshot** at `docs/design/static-3-reference/` (header.png, footer.png, mega-menu-services.png, mega-menu-how-it-works.png, mega-menu-resources.png). These are the visual source of truth for what STATIC-2 reseed populates. Treat them as the contract — if anything in the brief contradicts what the screenshots show, the screenshots win and you raise the contradiction as a plan-mode finding.

2. **Read this image-source principle and apply it to every image-related decision in this phase:**

   Every visual asset in STATIC-2 traces to one of two sources — never invented, never AI-generated, never placeholder:

   - **Existing Sanity content (preferred)** — for any image already owned by a Sanity doc from previous content phases. The image stays in its home doc; STATIC-2 references it via `reference[]` arrays + GROQ dereference. Zero new uploads. This applies to:
     - Technology icons (Services mega-menu "By Technology" column) — `technology.techLogo` already populated from CONTENT-1A/1B
     - Blog thumbnails (Resources middle column) — already in `blogPost.thumbnailImage` from CONTENT-1C
     - Customer story logos (Resources right column) — already in `customerStory.logo` / `customerStory.companyLogo` from CONTENT-1C
     - Cloud Employee wordmark logo (Header + Footer) — already in `siteSettings` or `navigation` global from STATIC-1

   - **Live cloudemployee.io site (audit-script download fallback)** — for new chrome surfaces that don't have a Sanity-resident asset. Step 1 audit script's image-download pass (`fetch()` against the live HTML's `<img src>` URLs) downloads these to `audit-output/static-2/assets/{nav,footer,how-it-works-photos}/`. Step 4 reseed uploads them to Sanity. This applies to:
     - How It Works card photos (3 cards + 1 panel) per Option B locked in Step 0 item 14 — downloaded from live site and uploaded as inline image fields
     - Footer wordmark / decorative images — ~3-5 small assets per `docs/design/static-3-reference/footer.png` reference screenshot

   - **Live cloudemployee.io site (render-only, no asset upload)** — for visual elements that render from font glyphs rather than image files. STATIC-3 components render these as Material Icons class glyphs; Sanity stores only the ligature name string, not an asset. This applies to:
     - Resources mega-menu left column icons (4 ligatures: `download` / `calculate` / `video_library` / `event_upcoming`) — captured via Step 1 audit Material-font class detection; persisted as `{ source: 'material-font', name: string }` schema shape

   - **Live cloudemployee.io site (rendered text-only)** — for surfaces that render without icons or images at all. Schema doesn't add an icon field for these. This applies to:
     - Services mega-menu service items (Software Engineers, Mobile Developers, etc.) — confirmed text-only via Step 1 panel-shape probe + reference screenshot. DELTA-1 dropped; `service.thumbnail` stays null.

   **What this rules out:** No AI-generated images. No stock photo libraries. No Webflow CDN URLs left as raw `<img src>` (every downloaded asset must be ingested to Sanity for hosting on Sanity's CDN). No SVG icons hand-coded from descriptions in screenshots. No fabricated icons for surfaces that the live site renders text-only or via icon font.

   **What this rules in:** Sanity is the single source of truth for every image in production. The audit script + reseed is the bridge between "live CE site has it" and "Sanity owns it." Service/technology/blog/customerStory docs continue to own their assets — STATIC-2 doesn't duplicate them, it references them. When the live site renders without an image (text-only items, icon-font glyphs), the schema mirrors that rendering rather than fabricating an asset.

**Plan-mode items (after the first actions above):**

1. **Live-site reachability** — confirm `https://www.cloudemployee.io` is reachable and CDN-cacheable for the audit script. If rate-limited, document the retry strategy.

2. **Existing Sanity schemas** — read the current `studio/schemas/globals/{navigation,footer,siteSettings}.ts` files + `studio/schemas/documents/{service,technology}.ts` files. Surface deltas vs the brief's assumptions about current shape.

3. **Existing seeded content** — GROQ-query the current `navigation` + `footer` globals. Brief expects clean STATIC-1 seed; if Seb has edited anything via Studio, the reseed must preserve those edits OR be explicit about overwriting.

4. **`/sourcing`, `/embedding`, `/retention` singletons** — confirm all 3 exist in Sanity, confirm their slugs match expected paths, confirm they're not stub-only (have real content). Confirm each has a usable hero image asset that the How It Works mega-menu cards can reference.

5. **Service + technology doc inventory** — GROQ-query all `service` + `technology` docs. List slugs. Document expected count (per REGISTRY: ~23 services, ~101 technologies). Confirm each has a populated `thumbnail` / `techLogo` field where applicable. Per Step 1 audit (commit `0586eaf`), services are expected to have null `thumbnail` and that is correct — service mega-menu items render text-only on the live site; DELTA-1 backfill scope dropped. Technology `techLogo` is populated on 99/101 docs (CONTENT-1A/1B). The 2 docs missing techLogo are surfaced as plan-mode findings (decision: editorial backfill OR accept text-only rendering on those 2).

6. **Existing asset references** — `siteSettings.defaultOgImage` is already populated (STATIC-1 Step 1 follow-up). Confirm new icon/photo assets we're adding don't collide with existing Sanity asset IDs.

7. **Schema migration concerns** — adding fields to `navigation`, `footer`, `service`, and `technology` is additive (safe). Adding `tagline` to `service` + `technology` doesn't affect existing rendering (those templates don't render at TEMPLATE-* phases yet — SERVICE and TECHNOLOGY are HIGH-complexity templates scheduled post-STATIC-3). Plan-mode confirms no field removals are needed.

8. **Studio deployment** — schema changes need to be deployed to Sanity Studio (`npx sanity deploy` or equivalent). Confirm the deployment process is documented and Jake has the right credentials.

9. **Slug-match readiness probe** — write a one-shot read-only probe: for each known top-level Services mega-menu item URL from Jake's reference screenshots (Software Engineers, Fractional CTOs, Mobile Developers, QA Analysts & Testers, DevOps Engineers, Data Scientists, No-Code Developers, React Developers, Node.js Developers, Python Developers, TypeScript Developers, AWS Developers, .NET Developers, AI Engineers, AI Consulting, AI Product Builds, MVP Development, Mobile Apps, Web-Based Apps), confirm a matching `service` or `technology` doc exists in Sanity. **Also probe Java** (appears in footer Technology column per `docs/design/static-3-reference/footer.png`). Surface any missing matches as plan-mode findings — they need to be decided (stub-create the doc OR drop the menu item) BEFORE Step 1 audit runs.

10. **Primary nav label confirmation** — confirm via live-site audit + Jake's `docs/design/static-3-reference/header.png` screenshot that primary nav 2nd link reads "Our Clients" not "Customer Stories". Any mismatch between live site + reference screenshot surfaces as plan-mode finding. **Default authority:** live site at audit time.

11. **Pill variant inventory** — Jake's reference screenshots show FIVE distinct pill styles in use:
    - `pill-green` (lime green filled, dark text) — Staff Augmentation header pill, Schedule a Call CTA, "View all" CTAs on dark backgrounds, footer Subscribe button
    - `pill-dark` (dark navy filled, light text) — By Technology header pill, "Discover how we do it" CTA in How It Works panel, footer "Start building your team" CTA
    - `pill-gradient` (purple-to-pink gradient, light text) — AI Services header pill in Services mega-menu
    - `pill-navy` (deep navy filled, light text) — Product Builds header pill
    - `pill-outline-light` (transparent bg, light/white border + text) — footer section labels (Our Expertise / Learn more / Talent Locations), Project Builds + AI Services pills WITHIN footer (NOT same styling as mega-menu equivalents), footer "Contact us today" CTA

    Plan-mode confirms the 5-variant set against `docs/design/static-3-reference/`. STATIC-2 schema's `sectionLabelStyle` enum extended accordingly.

12. **Footer-specific link list confirmation** — Jake's `docs/design/static-3-reference/footer.png` shows the footer "Our Expertise" + "Learn more" sections use EDITORIAL curated link lists, NOT references to service/technology docs (different from Services mega-menu hybrid CMS-driven approach). Footer Resources column has 6 items vs mega-menu Resources column has 4 items — different surfaces. Plan-mode confirms this architecture decision; STATIC-2 footer schema uses inline link lists not references.

13. **"Reviews" + "CE vs. Alternatives" route surfaces** — both appear in footer `Learn more` columns per reference screenshot. Plan-mode confirms whether these routes exist in Sanity (likely standalone `page` docs or singletons) or need stub-creation. If they don't exist, decision: stub-create OR drop from footer.

14. **How It Works mega-menu photo source — LOCKED to Option B (inline image fields)**. Plan-mode probe of singletons `sourcingPage` / `embeddingPage` / `retentionPage` / `howItWorksPage` returned empty stubs (only `_id`, `_type`, `_createdAt`, `_rev`, `_updatedAt`, `locale`, `title` — no hero, no heroImage, no body content). These singletons are scheduled to be populated by future TEMPLATE-SOURCING / TEMPLATE-EMBEDDING / TEMPLATE-RETENTION / TEMPLATE-HOW_IT_WORKS phases, not by STATIC-2. Option A (singletonRef → singleton.heroImage) is structurally non-viable for STATIC-2.

    **Locked architecture:**
    - Schema `howItWorksMegaMenu.cards[]` carries inline `image: { asset, alt }` field per card (required, `alt` Rule.required()) — NO `singletonRef` field
    - Schema `howItWorksMegaMenu.bottomPanel` carries inline `image: { asset, alt }` field — NO `singletonRef` field
    - Step 1 audit downloads 4 photos from live CE mega-menu (3 card photos + 1 bottom panel photo)
    - Step 4 reseed uploads photos to Sanity as inline image assets
    - 4 new photo uploads expected
    - Customer-2 future-extensibility: if a customer's singletons carry hero images that should drive the mega-menu, a future schema iteration adds `useSingletonHero: boolean` toggle. Not in STATIC-2 scope.

    Step 1 audit-script's "How It Works photo source comparison" pass is reduced to: download the 4 live photos and write `audit-output/static-2/how-it-works-photo-comparison.json` with `{"decision": "B", "reason": "Sanity singletons are empty stubs; no hero URLs to compare against"}`. Deterministic; preserves script shape for customer-2 reusability.

15. **Image source architecture summary** — confirm understanding before Step 1 audit:

    | Surface | Image source | New uploads in STATIC-2 |
    |---|---|---|
    | Header logo | `navigation` global or `siteSettings` (STATIC-1 seeded) | No |
    | Services mega-menu icons — services | **None — service items render text-only on live site (DELTA-1 dropped per Step 1 probe; see static-2-brief-deltas.json STATIC-2-DELTA-B)** | No |
    | Services mega-menu icons — technologies | Referenced `technology.techLogo` field (99/101 docs already populated; type-aware GROQ projection per DELTA-7) | No |
    | How It Works card photos (3) + panel photo (1) | Inline `image` field (Option B locked per item 14) | Yes (4) |
    | Resources left column icons (4) | Material font ligatures (`download` / `calculate` / `video_library` / `event_upcoming`) — rendered as Material Icons class glyphs in STATIC-3 components, NOT uploaded as Sanity assets. Schema field shape: `{ source: 'material-font', name: string }` instead of `{ asset: image, alt: string }`. | No |
    | Resources blog cards (3) | Referenced `blogPost.thumbnailImage` field | No |
    | Resources customer story cards (3) | Referenced `customerStory.companyLogo` field (actual field name is `companyLogo`, not `logo` — plan-mode confirmed) | No |
    | Footer wordmark | `siteSettings` or `footer` global (STATIC-1 seeded) | No |
    | Footer images | Section labels + small inline assets (~3-5 small assets per footer.png reference) | Yes (~3-5) |

    Expected new asset count in Sanity: **~7-9 images** (4 How It Works photos + ~3-5 footer assets). Revised downward from earlier "15-27" estimate after DELTA-1 service-thumbnail backfill was dropped (service items render text-only) and Resources left-column icons resolved to Material font (no asset upload needed).

    Architectural principle: prefer referenced doc fields over inline duplicates wherever the destination doc owns the canonical image. When the live site renders a UI element without a downloadable image (text-only items, Material font icons), the schema accepts that rendering — no fabrication. The hybrid CMS-driven approach scales to customer-2 navigation work.

Plan-mode output format same as STATIC-1: structured delta report with `ITEM N: ✅ PASS / ⚠️ DELTA — [details]`, recommended next move, no code or data changes.

### Step 1 — Live-site audit script

Build `scripts/audit/static-2/extract-chrome.ts`.

**Playwright config (matches CONTENT-1D pattern):**
- `waitUntil: 'networkidle'` (not `domcontentloaded` — mega-menu HTML is JS-rendered by Webflow runtime; needs to settle)
- 30s per-page timeout (mega-menus open via JS; allow time)
- Custom UA: `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36`
- **Critical: GeoTargetly bypass.** Live site uses GeoTargetly to redirect non-US/UK visitors to `talent.cloudemployee.io` (PH locale, discontinued). Script MUST either (a) set `Accept-Language: en-US` + disable JS redirects, OR (b) intercept the GeoTargetly script and short-circuit, OR (c) navigate directly to `https://www.cloudemployee.io/` and verify the page didn't redirect. Plan-mode picks the strategy; (a) is simplest if it works.

The script does:

1. **Launch Playwright** with `cloudemployee.io` loaded under the GeoTargetly-bypass config above; verify URL didn't redirect.
2. **Capture the header in default state** — full HTML of the header element + computed CSS for the header surface (background, shadow, padding, border-radius, position, transition properties)
3. **Trigger scroll** to capture the floating-pill state — same header element after scrolling 100px+; capture computed CSS diff (the values that changed between default and scrolled state); record the scroll-trigger threshold + transition duration + easing. Note: the header is already a floating-pill visual at scroll position 0 — what changes on scroll is the animation REFINEMENT (deferred to TEMPLATE-HOME), not the visual treatment itself.
4. **Open each dropdown** in turn (Services, How It Works, Resources) by **clicking** the trigger (click + hover both work, click is more reliable for Playwright); capture:
   - Full mega-menu HTML
   - Every text node (labels, taglines, headings, pill button labels)
   - Every icon URL (img src or svg use href)
   - Every image URL (full-resolution where available — Webflow typically serves multiple sizes; use the `1080w` / largest variant)
   - **Every link's `href` value** — these are the URLs that get matched to Sanity service/technology slugs in Step 4
   - **Alt text** on every image found (capture `alt=""` attribute; flag empty alts as plan-mode findings)
   - Layout structure (column count, grouping, which items belong to which group, which items have sub-card highlighting vs flat list)
5. **Capture the footer** — full HTML; every link; every column heading; every image; the top CTA block ("Ready to hire your next engineer?"); the Subscribe block; the bottom-bar. **Specifically capture as separate structured outputs:**
   - `footer.topCtaBlock` — heading + statRow + 2 CTAs (label + url)
   - `footer.sections[].columns[].links[]` — editorial-curated link lists (NOT references). Per reference screenshot `docs/design/static-3-reference/footer.png`:
     - "Our Expertise" → Full-time Staff Augmentation column (8 items) + Technology column (7 items including "Java")
     - "Learn more" → About column (5 items including "Reviews") + Resources column (6 items including "Customer Stories", "CE vs. Alternatives")
   - `footer.sections[].bottomPillLinks[]` — Project Builds + AI Services pills under Our Expertise section, styled `pill-outline-light` (NOT lime/gradient)
   - `footer.talentLocations` — section pill label + 2 items
   - `footer.subscribe` — heading + description + form GUID + submit label
   - `footer.bottomBar` — copyright + legal links + region selector
6. **Download every image asset** to `audit-output/static-2/assets/{nav,footer}/` with stable filenames derived from URL hashes (sha256 first 8 chars + original extension). Use `fetch()` not Playwright's `download` event — assets are linked, not user-downloaded.
7. **Slug-match pass**: for each captured mega-menu item URL, query Sanity for matching service/technology doc by slug. Output `audit-output/static-2/slug-match-report.json` with per-item `{label, url, capturedTagline, matchedDocId, matchedDocType, matchedDocThumbnail}` records. Items that don't match get flagged for plan-mode review (`matchStatus: 'orphan'`). **Also probe footer link surfaces** — "Java" (technology doc), "Reviews" (page singleton or route), "CE vs. Alternatives" (page singleton or route). Report orphans the same way; resolution (stub-create vs decorative-only link vs drop) decided in plan-mode.
8. **How It Works photo capture** (Option B locked per Step 0 item 14):
   - Capture the 3 card photo URLs + 1 bottom panel photo URL from the live mega-menu
   - Download each to `audit-output/static-2/assets/how-it-works-photos/`
   - Write `audit-output/static-2/how-it-works-photo-comparison.json` with deterministic stub:
     ```json
     {
       "decision": "B",
       "reason": "Sanity singletons (sourcingPage / embeddingPage / retentionPage / howItWorksPage) are empty stubs; no hero URLs exist to compare against. Locked at plan-mode close.",
       "capturedPhotos": [
         {"card": "betterHiring", "liveUrl": "...", "localPath": "audit-output/static-2/assets/how-it-works-photos/..."},
         {"card": "betterDelivery", "liveUrl": "...", "localPath": "..."},
         {"card": "betterRetention", "liveUrl": "...", "localPath": "..."},
         {"panel": "bottomPanel", "liveUrl": "...", "localPath": "..."}
       ]
     }
     ```
   - Customer-2 reusability preserved: when a future customer's singletons carry hero images, the same script can extend to do a genuine URL comparison. STATIC-2 doesn't need that branch.

9. **(Removed.)** Service icon capture was previously scoped as Step 1 item 9 to download service icons from the live mega-menu for `service.thumbnail` backfill. Step 1 execution (commit `0586eaf`) confirmed via panel-shape probe + reference screenshot that service items render text-only on the live site — no icons to capture. DELTA-1 dropped. See STATIC-2-DELTA-B in `audit-output/static-2/static-2-brief-deltas.json`.

10. **Write structured JSON outputs**:
   - `audit-output/static-2/navigation.json` — full nav structure with slug-match references
   - `audit-output/static-2/footer.json` — full footer structure
   - `audit-output/static-2/scroll-behavior.json` — scroll-trigger threshold + before/after CSS diff + transition timing
   - `audit-output/static-2/assets-manifest.json` — every downloaded asset with original URL + local path + sha256
   - `audit-output/static-2/slug-match-report.json` — per-item Sanity doc match results
   - `audit-output/static-2/how-it-works-photo-comparison.json` — Option B deterministic stub
   - `audit-output/static-2/static-2-brief-deltas.json` — brief-vs-reality findings (A: footer CTA label; B: service icons absent; C: customer-story URL singular; D: blog cards span multiple namespaces)
   - `audit-output/static-2/static-3-brief-deltas.json` — STATIC-3-DELTA-1 (floating-pill is scroll-triggered, not steady-state)

The script is idempotent (re-running re-downloads + re-writes, no Sanity writes). Sanity writes happen in Step 4. The script lives under `scripts/audit/` (matches existing AUDIT-1 conventions) NOT `audit-output/` (which is gitignored per `CLAUDE.md` repo structure rule).

**Step 1 gate:**
- Six required JSON files exist with non-empty content (`navigation.json`, `footer.json`, `scroll-behavior.json`, `slug-match-report.json`, `how-it-works-photo-comparison.json`, `assets-manifest.json`) + 2 deltas files (`static-2-brief-deltas.json`, `static-3-brief-deltas.json`)
- Asset manifest lists: 4 Resources icons (as `material-font` records; ligature names captured, no asset upload) + 4 How It Works photos (Option B locked) + 6 Resources featured-card thumbnails (3 blog + 3 customer-story) + footer logo/wordmark assets + the subscribe form (HubSpot form GUID confirmed matches `deac2450-b51b-4630-b9e2-47017a13da15`). Expected new asset count: ~15-25 image downloads (Resources blog thumbnails + customer-story logos + footer assets + How It Works photos; Resources left-column icons are Material font ligatures, not asset downloads). No service icons (DELTA-1 dropped).
- Slug-match report classifies every Services mega-menu item: `matched` (has a Sanity service/technology doc) or `orphan` (no match). Plan-mode confirms acceptable orphans (Reviews + CE vs. Alternatives expected); gate fails if any UNEXPECTED orphans surface (would indicate live site changed since plan-mode).
- How It Works photo comparison file present with `{"decision": "B", ...}` deterministic stub
- Alt text captured on every image; empty `alt=""` instances counted and reported as plan-mode findings (need to be replaced with meaningful alt before reseed)
- Brief-vs-reality deltas surfaced in `static-2-brief-deltas.json` (A/B/C/D) and `static-3-brief-deltas.json` (D-1) for downstream phase consumption
- Manual spot-check by Jake: open 3 random assets, confirm they look correct

### Step 2 — Schema extensions

Extend Sanity Studio schemas + Zod types in lockstep.

**Integration principle:** Both schemas already exist (per `MYGRATR_SCHEMA_DESIGN_DECISIONS.md §6.2 + §6.3` and the SCHEMA-1 build). STATIC-2 adds new fields alongside the existing ones. Existing fields stay required-validated as-is. New fields are optional (so Seb's existing Studio docs don't get marked invalid the moment the schema deploys). New fields become required at STATIC-3 close once they're populated.

**Studio editor UX:** Legacy fields (`navigation.primaryLinks[].dropdownItems`, `footer.columns[]`, `footer.legalLinks[]`, `footer.newsletterFormId`, `footer.copyrightText`) get marked with `description: '⚠️ Legacy field — populated by STATIC-2 reseed but no longer rendered. Will be removed in a future cleanup phase.'` so Seb knows not to edit them. No `hidden:` callback (which would break the regression-safety reads from STATIC-1 components).

**`navigation` global — new structure:**

```typescript
navigation = {
  // Primary links — flat label/url pairs as before, but with a new `dropdownType` discriminator.
  // The 6-link primary nav after STATIC-2 reseed: Services / Our Clients / How It Works /
  // Resources / Pricing / About Us. `dropdownType: 'none'` for the 3 flat links (Our Clients, Pricing, About Us).
  primaryLinks: [
    {
      label: string,
      url: url,
      dropdownType: 'none' | 'services-mega' | 'how-it-works-mega' | 'resources-mega',
      // Existing dropdownItems[] kept for backwards-compat (STATIC-1 Header still reads this);
      // unused by STATIC-3 Header. Deprecated at STATIC-3 close, removed in future cleanup phase.
    }
  ],

  // NEW: Services mega-menu structure — hybrid CMS-driven.
  // Each `items[]` entry is a REFERENCE to an existing service or technology doc.
  // Items resolve at render time to pull name + thumbnail + tagline + URL from the referenced doc.
  // Hand-curated fields in this schema: only the structural template (sections + ordering + section labels).
  servicesMegaMenu: {
    leftColumn: {
      sectionLabel: string,         // "Staff Augmentation" (also a link — see sectionLink)
      sectionLink: url,             // e.g. /services/staff-augmentation (the pill label IS clickable)
      sectionLabelStyle: 'pill-green' | 'pill-dark' | 'pill-gradient' | 'pill-navy' | 'pill-outline-light',
      // 2-item highlighted sub-card (e.g. Software Engineers + Fractional CTOs)
      highlightedItems: reference[] → service | technology,  // exactly 2 expected
      // Flat list below the highlighted sub-card
      items: reference[] → service | technology,
      viewAllLink: { label: string, url: url } | null,
    },
    rightColumnTop: {                // "By Technology" section
      sectionLabel: string,
      sectionLink: url,
      sectionLabelStyle: 'pill-green' | 'pill-dark' | 'pill-gradient' | 'pill-navy' | 'pill-outline-light',
      items: reference[] → service | technology,
      viewAllLink: { label: string, url: url } | null,
    },
    rightColumnBottom: {             // "AI Services" + "Product Builds" sub-sections
      sections: [
        {
          sectionLabel: string,
          sectionLink: url,
          sectionLabelStyle: 'pill-green' | 'pill-dark' | 'pill-gradient' | 'pill-navy' | 'pill-outline-light',
          items: reference[] → service | technology,
        }
      ],
    },
  },

  // NEW: How It Works mega-menu structure
  //
  // IMAGE SOURCE: Locked to inline image fields (Option B) per Step 0 plan-mode item 14.
  // Singletons sourcingPage / embeddingPage / retentionPage / howItWorksPage are empty
  // stubs scheduled to be populated by future TEMPLATE-* phases; STATIC-2 cannot
  // dereference singleton heroes that don't yet exist.
  howItWorksMegaMenu: {
    cards: [
      {
        title: string,               // "Better hiring"
        subtitle: string,            // "Role-specific sourcing every time"
        image: { asset: image, alt: string },  // Required; alt Rule.required()
        ctaLabel: string,            // "How we source talent"
        ctaUrl: url,                 // /sourcing
      }
    ],
    bottomPanel: {
      heading: string,               // "How does partnering with Cloud Employee work?"
      subheading: string,            // "This is nearshoring that actually works..."
      ctaLabel: string,              // "Discover how we do it"
      ctaUrl: url,                   // /how-it-works
      image: { asset: image, alt: string },  // Required; alt Rule.required()
    },
  },

  // NEW: Resources mega-menu structure
  resourcesMegaMenu: {
    leftColumn: {                    // "Resources" pill links
      sectionLabel: string,          // "Resources"
      items: [
        {
          label: string,             // "Free Downloads"
          // Discriminated icon shape — Step 1 audit confirmed live site uses Material font icons
          // (`.md-icon` class with ligature text). Schema supports both sources for future-proofing:
          icon: {
            source: 'material-font' | 'asset',
            // When source === 'material-font': ligature name (e.g. 'download', 'calculate',
            //   'video_library', 'event_upcoming'). STATIC-3 components render via Material Icons class.
            name: string | null,
            // When source === 'asset': uploaded Sanity asset + alt (alt Rule.required() when asset present).
            asset: image | null,
            alt: string | null,
          },
          url: url,
        }
      ],
    },
    middleColumn: {                  // "Blogs" with featured posts
      sectionLabel: string,          // "Blogs"
      viewAllLink: { label: string, url: url },
      featuredPosts: reference[blogPost],   // 3 references; rendered as image+title cards
    },
    rightColumn: {                   // "Customer Stories" with featured stories
      sectionLabel: string,          // "Customer Stories"
      viewAllLink: { label: string, url: url },
      featuredStories: reference[customerStory],  // 3 references; dark-green-bg cards
    },
  },

  // Kept from STATIC-1
  ctaButton: { label: string, link: url, type: enum [calendly, link, hubspotForm] },
  localeDropdown: { enabled: bool, options: [...] },  // DEPRECATED — STATIC-3 removes Header
                                                       // locale switcher; field stays in schema for
                                                       // a future cleanup phase
}
```

**`service` document — new field:**

```typescript
// Add to existing service schema (alongside name, slug, thumbnail, folds, etc.)
tagline: {
  type: 'string',
  max: 80,
  optional: true,
  description: 'Short tagline used by Services mega-menu (e.g. "Scalable product-builders on demand"). Renders below the service name in the mega-menu item.'
}
```

**`technology` document — new field:**

```typescript
// Same shape as service.tagline
tagline: {
  type: 'string',
  max: 80,
  optional: true,
  description: 'Short tagline used by Services mega-menu "By Technology" column.'
}
```

**`footer` global — new structure:**

Footer link lists are **editorial-curated** (NOT references to service/technology docs — unlike Services mega-menu which is hybrid CMS-driven). This is a deliberate architecture choice: the footer is the primary SEO link-juice surface and Seb needs editorial control over which exact items appear, in what order. Some footer items overlap with mega-menu content; the lists are intentionally different (e.g., footer Resources column has 6 items vs mega-menu Resources column has 4).

```typescript
footer = {
  // NEW: Top CTA block
  topCtaBlock: {
    enabled: boolean,
    heading: string,                 // "Ready to hire your next engineer?"
    statRow: string,                 // "300+ teams built · 97% stay 2+ years · Cancel anytime"
    primaryCta: { label: string, url: url },   // "Start building your team" → pill-green
    secondaryCta: { label: string, url: url }, // "Contact us today" → pill-outline-light
  },

  // NEW: Section-grouped columns (Our Expertise + Learn more — both follow same shape)
  // Each section is a labeled group with one or more sub-columns.
  // Per reference screenshot: Our Expertise has 2 sub-columns + bottomPillLinks (Project Builds, AI Services)
  //                          Learn more has 2 sub-columns only (no bottom pills)
  sections: [
    {
      sectionLabel: string,          // "Our Expertise" / "Learn more"
      sectionLabelStyle: 'pill-outline-light',  // Locked to outline-light per reference screenshot
      columns: [
        {
          heading: string,           // "Full-time Staff Augmentation" / "Technology" / "About" / "Resources"
          headingHasArrow: boolean,  // small ↗ icon next to heading indicating it's a link
          headingUrl: url | null,    // If headingHasArrow, where the heading itself links
          links: [{ label: string, url: url }],  // editorial-curated list
        }
      ],
      // Optional bottom pill row (Our Expertise has this; Learn more does not)
      bottomPillLinks: [
        {
          label: string,             // "Project Builds" / "AI Services"
          url: url,
          hasArrow: boolean,         // ↗ icon affordance
          variant: 'pill-outline-light',  // Locked per reference screenshot — NOT lime green or gradient
        }
      ] | null,
    }
  ],

  // NEW: Talent Locations column
  // Section label only — NO clickable section heading (unlike Our Expertise / Learn more columns which DO have arrow-affordance heading links)
  talentLocations: {
    sectionLabel: string,            // "Talent Locations"
    sectionLabelStyle: 'pill-outline-light',
    items: [{ label: string, url: url }],  // LATAM Developers, Philippines Developers
  },

  // NEW: Restructured Subscribe block
  // Visual treatment: white input field on dark navy footer bg + lime green pill submit button
  subscribe: {
    heading: string,                 // "Subscribe"
    description: string,             // "Everything you need to find, manage and retain..."
    formId: string,                  // HubSpot form GUID — already known
    submitLabel: string,             // "Subscribe" — pill-green variant
  },

  // NEW: Bottom-bar links (NO arrow icons; plain text links)
  bottomBar: {
    copyrightText: string,           // "© {year} Cloud Employee. All rights reserved."
    links: [
      { label: string, url: url },   // "General Terms", "Privacy Policy", "Sitemap"
    ],
    regionSelector: {
      enabled: boolean,
      options: [{ label: string, hreflang: string, url: url }],  // "Region" dropdown
    },
  },

  // Kept from STATIC-1 — legacy columns + legalLinks + newsletterFormId + copyrightText
  // marked DEPRECATED; reads fall back to the new structure
}
```

**Architecture note — footer link lists are editorial, not reference-based:**
- Footer "Our Expertise" → Full-time Staff Augmentation column lists 8 items (Software Engineers / AI Engineers / Fractional CTOs / Mobile Developers / QA Analysts & Testers / DevOps Engineers / Data Scientists / No-Code Developers)
- Footer "Our Expertise" → Technology column lists 7 items (React / Node.js / Python / TypeScript / AWS / .NET / Java)
- Footer "Learn more" → About column lists 5 items (How it works / About us / Pricing / Reviews / Careers)
- Footer "Learn more" → Resources column lists 6 items (Customer Stories / CE vs. Alternatives / Blogs / Free Downloads / Tools / Video Library)
- These are CURATED EDITORIAL LISTS. Not derived from service/technology doc collections. Seb edits in Studio.
- Some items (e.g., "Reviews", "CE vs. Alternatives", "Java") may not have corresponding service/technology docs yet — plan-mode resolves whether to stub-create or treat the link as decorative-only.

**Migration strategy for the schema change:**
- All new fields are additive
- Old fields (legacy `columns[]`, `legalLinks[]`, `newsletterFormId`, `copyrightText`) stay in the schema marked deprecated
- Reseed populates the new fields; old fields stay populated for STATIC-1's render (so the site keeps working)
- STATIC-3 swaps Footer to read from new fields; legacy fields stop being read but stay in schema until a future cleanup phase

**Studio deployment:**
- Schema changes deployed via `npx sanity deploy` from the `studio/` directory
- Pre-deploy backup of the production dataset via `npx sanity dataset export production backup-static-2.tar.gz`
- Plan-mode confirms the backup step happened before deploy

**Step 2 gate:**
- Schemas committed to `studio/schemas/globals/`
- Zod types committed to `site/src/types/sanity/globals/`
- `cd studio && npx sanity build` passes (Studio bundle)
- `cd studio && npx tsc --noEmit` passes (Studio schema TS)
- `cd site && npx tsc --noEmit` passes (Site Zod types)
- Pre-deploy backup file exists at `audit-output/static-2/pre-reseed-backup.tar.gz`
- Studio deployed; manual visual verification: open the deployed Studio at the Sanity URL, navigate to navigation + footer globals, confirm new field groups render in the form (no schema errors)
- **UI_STRINGS audit:** identify which new text fragments will be CMS-driven (in Sanity globals) vs static UI strings (in `tools/eslint/ui-strings.json`). Document the split in `audit-output/static-2/ui-strings-audit.md`. Editorial-changeable content → Sanity. UX-affordance text like "View All", "Subscribe", "Region" → UI_STRINGS (decided per-string, defaults to CMS when in doubt).

### Step 3 — Studio data backup

Before reseeding, snapshot the current state.

```bash
cd studio
npx sanity dataset export production ../audit-output/static-2/pre-reseed-backup.tar.gz \
  --no-drafts \
  --no-assets
```

- `--no-drafts`: backup published docs only (drafts in Studio are unstable references; reseed handles published state)
- `--no-assets`: assets are immutable in Sanity by ID; backup is for doc data, not asset blobs (assets stay in place across the reseed)
- Document the restore command in the phase commit message: `npx sanity dataset import <backup.tar.gz> production --replace`
- Save a copy of the backup outside `audit-output/` if Jake wants extra protection (audit-output is gitignored; a backup outside the repo is safer for rollback scenarios)

**Step 3 gate:**
- Backup file exists at the documented path
- Backup file size > 1MB (sanity check that it's not empty)
- Manual import test: extract a single doc from backup (e.g. the `navigation` global) and confirm it parses
- Restore command documented in commit message
- Optional: out-of-repo backup copy made (Jake's call)

### Step 4 — Reseed globals + tagline patches

Build `scripts/static/seed-globals-v2.ts`.

The script reads the Step 1 audit outputs (`audit-output/static-2/*.json` + assets), uploads images to Sanity, writes the `navigation` + `footer` globals with the new structure, and patches `tagline` + `thumbnail` on matched service/technology docs.

Order of operations (idempotent across re-runs):

1. **PATCH `tagline` on matched service + technology docs** — for every entry in `slug-match-report.json` with `matchStatus: 'matched'` and a captured tagline, run `client.patch(docId).set({ tagline: '...' }).commit()`. Per CONTENT-1D-CLEANUP conditional-spread pattern: only patch when tagline is non-empty string. Don't write `tagline: null`.

2. **(Removed.)** Step 4 previously patched `service.thumbnail` for DELTA-1 backfill. Dropped from STATIC-2 scope (see §1, Step 1 item 9, and `static-2-brief-deltas.json` STATIC-2-DELTA-B). Service mega-menu items render text-only; `service.thumbnail` remains null on all 23 docs. Technology mega-menu items continue to dereference `techLogo` (already populated).

3. **Upload assets for new mega-menu surfaces** — Option B locked per DELTA-2/4:
   - 4 How It Works photos (3 card photos + 1 bottom panel) — uploaded as inline `image` asset references on `navigation.howItWorksMegaMenu.cards[].image` and `navigation.howItWorksMegaMenu.bottomPanel.image`
   - Resources mega-menu left column items get `icon.source = 'material-font'` + `icon.name = <ligature>` (download / calculate / video_library / event_upcoming) — no asset upload; STATIC-3 components render via Material Icons CSS class

4. **createOrReplace `navigation` global** — using new structure (Services mega-menu as references; How It Works mega-menu with inline images per Option B; Resources mega-menu with its nested structure).

5. **createOrReplace `footer` global** — using new structure (top CTA + sections + Talent Locations + Subscribe + bottom-bar). Footer link lists are **editorial-curated inline data** (NOT references to service/technology docs). Captured directly from Step 1 audit; reseed writes the captured `label` + `url` pairs into `footer.sections[].columns[].links[]` arrays. Also populate legacy fields (`columns[]`, `legalLinks[]`, `newsletterFormId`, `copyrightText`) for regression-safety on STATIC-1 Footer reads. **Note for footer link URLs:** "CE vs. Alternatives" link target is `/alternatives` (HUB_CONFIG canonical, matches Webflow `hrefLang="x-default"` declaration), NOT `/compare` (which is the live alias that STATIC-1 footer seed incorrectly used — DELTA-6 correction).

Patterns reused from STATIC-1:
- `createOrReplace` for globals (clean overwrite)
- `.patch().set()` for service/technology tagline patches (preserves Seb's other edits)
- `normalize()` helper for em/en dash stripping
- Asset uploads via `sanityWriteClient.assets.upload('image', buffer, { filename })`
- Reference resolution via slug-based GROQ lookup
- All Sanity-stored URLs in fully-qualified form (matches schema's `type: 'url'`)
- Idempotent — re-running uploads new asset versions + rewrites globals + re-patches taglines

**Special handling:**
- The 3 featured posts in Resources mega-menu: default sort `*[_type == 'blogPost' && defined(thumbnailImage.asset)] | order(_createdAt desc)[0..2]` — NOT `publishedAt desc` because `publishedAt` is null sitewide (DELTA-8). Plan-mode confirms whether Seb wants specific picks before reseed runs.
- The 3 featured customer stories: hand-curated against the live mega-menu visible 3 (Salmon / Willo / Event Connections per `mega-menu-resources.png`). No date field to sort by; editorial pick locked at plan-mode close.
- How It Works card images: inline `image` field per Option B lock; no `singletonRef` field exists in schema.
- Conditional-spread on every optional field per CONTENT-1D-CLEANUP pattern: never write `null` literal to a Sanity field.

**Step 4 gate:**
- GROQ query confirms `navigation` global has the new fields populated with non-null values; reference arrays resolve to real service/technology docs (no broken refs)
- GROQ query confirms `footer` global has the new fields populated + legacy fields ALSO still populated (regression safety)
- GROQ query confirms `tagline` is populated on every matched service + technology doc (per slug-match report)
- For How It Works cards: `image.asset` populated on all 3 cards + bottom panel; alt text non-empty
- Asset count in Sanity increased by **~13-15 images** (4 How It Works photos + 3 Resources blog thumbnails + 3 Resources customer-story logos + ~3-5 footer assets; technology icons stay as existing techLogo assets — zero duplicate uploads for technologies; service icons NOT uploaded — DELTA-1 dropped)
- All references in Services mega-menu items resolve to real service/technology docs
- All references in Resources featuredPosts/featuredStories resolve to existing Sanity docs
- Footer `/alternatives` URL used (not `/compare`) — DELTA-6 correction verified via GROQ search on footer.sections[].columns[].links[]
- No `null` literals written to any image-type field (manual GROQ check; per CONVENTIONS.md Conditional Spread rule)

### Step 5 — Cross-cutting verification + phase close

Verification:

1. **GROQ shape check** — both globals match the new schemas exactly
2. **Asset existence check** — every image ref in the navigation + footer globals resolves to a real Sanity asset (no broken refs)
3. **STATIC-1 render regression check** — visit `/blog`, `/services`, `/this-does-not-exist`. Header + Footer still render (STATIC-1 components read legacy fields which we preserved). No console errors, no Zod validation failures.
4. **`/embedding` route still works** — URL stays alive even though the standalone primary link is gone
5. **Build sanity** — `npm run build` passes, `npx tsc --noEmit` passes

Phase-close gate via `scripts/static/verify-static-2.ts`:
- Sanity schemas deployed
- Both globals have all new fields populated
- All asset refs resolve
- Backup file exists at `audit-output/static-2/pre-reseed-backup.tar.gz`
- Audit output files exist
- STATIC-1 render still works (regression check)

Tier 3 context-file updates:
- `CHANGELOG.md` — STATIC-2 paragraph
- `CLAUDE.md` — phase table row + tech-debt entries + **Tech Debt #34 moved to closed (intentionally omitted)**
- `PHASE_HISTORY.md` — full STATIC-2 entry
- `FEATURE_MAP.md` — schema extension noted
- `CONVENTIONS.md` — note: "audit-output/static-2/ is canonical for chrome content going forward, supersedes CE_SITE_TRUTH for header/footer"
- `REGISTRY.md` — new audit script + new seed script
- `COMPONENTS.md` — no changes (no new components yet, those land in STATIC-3)
- `SCHEMA.md` — new schema version row
- `CAPABILITY_LOG.md` — productisation IP entry: "additive-schema migration pattern with legacy-field preservation" (customer-2 reusability — any chrome rebuild on customer-2 will follow the same shape)

---

## §4 — Files Created / Modified

**Create:**
- `scripts/audit/static-2/extract-chrome.ts` — Playwright audit script
- `scripts/static/seed-globals-v2.ts` — new seed script for navigation + footer
- `scripts/static/verify-static-2.ts` — phase-close gate
- `audit-output/static-2/{navigation,footer,scroll-behavior,assets-manifest}.json` — extracted data
- `audit-output/static-2/assets/{nav,footer}/*.{png,svg,jpg}` — downloaded assets
- `audit-output/static-2/pre-reseed-backup.tar.gz` — Sanity backup

**Modify:**
- `studio/schemas/globals/navigation.ts` — schema extension (additive; hybrid CMS-driven mega-menu references)
- `studio/schemas/globals/footer.ts` — schema extension (additive)
- `studio/schemas/documents/service.ts` — add `tagline` field (optional, max 80 chars)
- `studio/schemas/documents/technology.ts` — add `tagline` field (optional, max 80 chars)
- `site/src/types/sanity/globals/navigation.ts` — Zod type extension
- `site/src/types/sanity/globals/footer.ts` — Zod type extension
- `site/src/types/sanity/documents/service.ts` — Zod tagline addition
- `site/src/types/sanity/documents/technology.ts` — Zod tagline addition
- `site/src/lib/sanity/queries/navigation.ts` — GROQ projection extended with reference-dereferencing for mega-menu items. **Type-aware icon projection** per DELTA-7: `servicesMegaMenu.leftColumn.items[]->{name, "slug": slug.current, "icon": select(_type == 'service' => thumbnail, _type == 'technology' => techLogo, null), tagline, _type}` — service docs use `thumbnail`, technology docs use `techLogo`. Render layer reads the unified `icon` field. Old fields preserved.
- `site/src/lib/sanity/queries/footer.ts` — same pattern
- `package.json` — new npm scripts: `audit:static-2`, `static:seed-globals-v2`, `static:verify-2`

**Do NOT modify:**
- Any STATIC-1 component (Header / Footer / hubs / 404). Visual rebuild is STATIC-3.
- Any TEMPLATE-BLOG file.
- Any hub render helper.
- Existing tagline-less behavior of service/technology docs in Studio (the field is optional; existing rendering paths unaffected).

---

## §5 — Risks + Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **GeoTargetly redirects audit script away from cloudemployee.io** | High | High | Step 1 Playwright config explicitly handles this (Accept-Language EN-US, GeoTargetly script interception, or direct navigation with redirect check). Plan-mode picks the strategy and verifies before bulk extraction. |
| **JS-rendered mega-menu HTML not captured by Playwright** | Medium | High | `waitUntil: 'networkidle'` + 30s timeout. If mega-menu still empty post-load, switch to explicit `page.waitForSelector('[data-mega-menu]')` per Webflow's actual mark-up classes. Plan-mode confirms selector strategy. |
| **Slug-match orphans — mega-menu item points to a service/technology doc that doesn't exist** | Medium | High | Step 1 slug-match report surfaces every orphan; Step 0 plan-mode resolves each (stub-create OR drop from menu) BEFORE Step 4 reseed. Reseed refuses to commit if orphans remain unresolved. Step 1 audit (commit `0586eaf`) found 2 expected orphans (Reviews + CE vs. Alternatives); zero Services mega-menu orphans. |
| **DELTA-6: STATIC-1 footer seeded `/compare` but HUB_CONFIG + Webflow canonical is `/alternatives`** | Confirmed | Low | Step 4 reseed uses `/alternatives` (correction). Both URLs return 200 on live CE so no broken-link concern; the canonical alignment matters for SEO consistency (avoids splitting link equity between two URLs). |
| **STATIC-2-DELTA-A: Footer primary CTA label mismatch** | Confirmed | Low | Brief originally specified "Start building your team" for footer top CTA. Live site shows "Book A Call" → `/book-a-call`. Audit captured the live truth. Step 4 reseed populates with the captured label + URL (not the brief's original). If editorial wants the original label, Seb updates in Studio post-reseed. |
| CE updates the live site mid-extract | Low | Medium | Audit script captures everything in one pass; re-run if site changes |
| Webflow CDN serves different image variants per request | Medium | Low | Use first response; document the canonical URL + sha256 in manifest |
| Schema migration accidentally removes data | Low | High | Pre-reseed backup (Step 3) `--no-drafts --no-assets`; all changes additive; restore command documented in commit message |
| Sanity Studio deployment fails | Low | High | Local `npx sanity build` passes before deploy; documented restore procedure |
| Featured posts/stories selection doesn't match Seb's intent | Medium | Low | Plan-mode flags this; default = 3 most recent; Seb edits in Studio post-seed |
| New icon assets collide with existing Sanity asset IDs | Low | Low | Sanity auto-generates unique IDs; collisions are computationally improbable |
| /embedding primary-link removal breaks SEO | Low | Medium | The /embedding URL itself stays alive; only the nav link is removed. No 301 needed (page still exists, just not in primary nav) |
| STATIC-1 Header component fails to render with the new schema | Low | High | New fields are additive; STATIC-1 Header reads existing fields which we preserve. Legacy fields stay populated by reseed. Step 5 regression check catches any break. |
| **Studio Editor confusion over legacy + new fields side-by-side** | Medium | Low | Legacy fields tagged with `description: '⚠️ Legacy field...'` so Seb knows not to edit them. Field group ordering puts new fields first. |
| **Tagline patches accidentally overwrite Seb's existing tagline edits** | Low | Low | `.patch().set({ tagline })` is idempotent; on first run all matched docs get the live-site tagline; on subsequent runs the tagline gets re-applied (overwriting any manual edits). Document this in CONVENTIONS.md as the "audit-driven content sync" pattern. If Seb edits a tagline manually and wants it preserved, he flags it pre-reseed. |

---

## §6 — Phase Close Definition

STATIC-2 is closed when:

1. All Step gates pass
2. `scripts/static/verify-static-2.ts` exits 0
3. Sanity Studio shows the new schema fields populated for `navigation` + `footer`
4. STATIC-1 components still render without errors (regression check)
5. Context files updated and committed in one final commit
6. Final commit pushed to `origin/feat/design-1`

State on close: `migrations.status = content_complete` (unchanged). Next phase: STATIC-3 (visual rebuild).

---

**End of STATIC-2 brief. Plan-mode validation required before execution.**

# BRIEF: Wire the bespoke pages to Sanity (MYGRATR-WIRE-BESPOKE)

> Status: ACTIVE. Author: planning brain. Opened 23 Jul 2026.
> Governing plan: docs/ROADMAP_TO_COMPLETION.md. Orientation: CLAUDE.md.

## Why
Seb needs to edit page text himself in Sanity Studio. Most of the site is already
Sanity-wired and editable (blog, services, technology, team, reviews, hubs, About,
Contact, Referrals, Home, How It Works, Pricing). The gap is five BESPOKE pages
whose copy still lives in code `content.ts` files, so Studio shows nothing to edit.

## Scope (the five, all bespoke templates)
1. Location x3 - `/services/{latam,philippines,eastern-europe}-developers`
   - One template: `site/src/components/templates/location/` + `content.ts`
     (LATAM_CONTENT / EASTERN_EUROPE_CONTENT / PHILIPPINES_CONTENT) + registry
     `site/src/lib/location/registry.ts`. Dispatched from `/services/[slug]`.
2. Fractional CTO - `/services/fractional-ctos` (+ /uk)
   - `site/src/components/templates/fractional-cto/` + `content.ts` (FCTO / FRACTIONAL_CTO_META)
3. Software Engineers / Hire Engineers - `/services/software-engineers` (+ /uk)
   - `site/src/components/templates/hire-engineers/` + `content.ts` (HE / CALC / HIRE_ENGINEERS_META)
4. For Developers - `/for-developers`
   - `site/src/components/templates/for-engineers/` + `content.ts` (ForEngineersTemplate / FOR_ENGINEERS_META)
   - NOTE: a `forDevelopersPage` singleton ALREADY EXISTS holding OLD generic captured
     content (from the static-page pattern). It must be reconciled: extend/replace it to
     the bespoke shape, or add a new singleton and retire the old one. Do not assume empty.
5. Our Work - `/our-work`
   - `site/src/components/templates/our-work/` + `content.ts` (OurWorkTemplate / OUR_WORK_META)
   - Same reconciliation caveat: `ourWorkPage` singleton already exists with generic content.

## Approach - copy the proven Home-page pattern exactly
Reference implementation (do it the same way):
- Schema:  `studio/schemas/singletons/home-page.ts` (bespoke object-per-section shape;
  every string plain; images via `imageField`). Registered in
  `studio/schemas/singletons/index.ts`.
- Query:   `site/src/lib/sanity/queries/home-page.ts` (GROQ projection 1:1 with the
  template's content shape + lenient Zod boundary + `toXContent()` cast).
- Route:   `site/src/app/page.tsx` - `const data = await fetchX(); const content = data ? toXContent(data) : STATIC_FALLBACK`.
- Fallback: the existing code `content.ts` STAYS as the fallback when the Sanity doc
  is absent / fails Zod. Never delete it.

Per page:
- (a) Add a Studio schema mirroring that template's content shape (singleton for the
  single-page ones; a `locationPage` DOCUMENT type with 3 docs for Location since it
  has three regional instances keyed by slug).
- (b) Add a GROQ+Zod+transform module under `site/src/lib/sanity/queries/`.
- (c) Update the route(s) to fetch Sanity with the code `content.ts` as fallback.
- (d) Write a seed script under `scripts/static/` that transcribes the existing
  `content.ts` into the Sanity doc(s), no-em-dash enforced.

## Decisions (locked unless Jake overrides)
- IMAGE HANDLING - v1 keeps images as STRING path fields (matches the templates, which
  already consume string image paths; keeps the seed simple and gets TEXT editable fast,
  which is what Seb asked for). Upgrading to drag-and-drop uploadable Sanity image assets
  is a later, additive pass. Recommendation, proceed.
- Location model = one `locationPage` document type, 3 docs (slugs: latam-developers,
  eastern-europe-developers, philippines-developers). Route keeps the registry as the
  code fallback; fetch `*[_type=="locationPage" && slug.current==$slug][0]` first.
- SEO/meta (metaTitle/metaDescription) come into the Sanity doc too so Seb can edit them.

## Safety gates (30-safety)
- The agent WRITES schema + seed scripts + route wiring. The agent does NOT run seeds
  against the production dataset and does NOT deploy Studio unattended.
- Jake (by hand): `npx sanity deploy` (or the project's deploy step) for the Studio, and
  running each `npm run static:seed-*` seed against `production`. Agent hands over the exact
  command per page.
- `migrations.status` stays `content_complete`. No dataset mutation without sign-off.

## Order
Location (highest leverage: 1 template, 3 pages) -> Fractional CTO -> Software Engineers
-> For Developers (reconcile existing singleton) -> Our Work (reconcile existing singleton).

## Done = per page
- tsc + lint + `npm run build` clean.
- Route(s) still 200 (US + UK where applicable), design visually unchanged.
- Studio shows the page's fields, editable.
- After Jake runs the seed: editing a field in Studio changes the page on staging.
- `content.ts` fallback retained; unknown/empty doc still renders via fallback (no crash).
- ROADMAP_TO_COMPLETION.md tracker updated (page moves from G2-open to wired).

## Progress log
- **Location family (1 template, 3 pages) - CODE COMPLETE, awaiting Jake's Studio
  deploy + seed (23 Jul 2026).** Landed exactly on the Home-page pattern:
  - Schema: `studio/schemas/documents/location-page.ts` - a `locationPage` DOCUMENT
    type (3 docs keyed by slug), registered in `studio/schemas/documents/index.ts`.
    Auto-appears as a regular document list in Studio (no structure.ts change).
    Images are STRING path fields (locked decision); calculator holds COPY only
    (numeric config stays code-driven).
  - Query: `site/src/lib/sanity/queries/location-page.ts` - GROQ projection 1:1 with
    LocationContent + lenient Zod + `toLocationContent(data, fallback)` (splices the
    code calculator numerics back in).
  - Routes: `/services/[slug]` + `/uk/services/[slug]` location branch now fetches
    the Sanity doc first and falls back to `LOCATION_REGISTRY` content when absent/
    invalid. Meta title/description come from Sanity with the registry as fallback.
  - Seed: `scripts/static/seed-location-pages.ts` (`npm run static:seed-location-pages`)
    transcribes the 3 registry content objects into 3 docs; string images; no-em-dash
    normalised; SEO-compliant metaTitle (<=60) + metaDescription (140-160).
  - Verified: studio tsc + site tsc + lint clean; `next build` clean (706 pages);
    all 6 location routes (US+UK) 200 via the fallback; unknown slug 404s; a real
    service slug still 200s. Design visually unchanged.
  - GATES for Jake (by hand, 30-safety): (1) deploy Studio; (2) run the seed against
    `production`. Commands handed over at session end. `migrations.status` unchanged.
- **Location family v2 - FULL IMAGE + VIDEO EDITABILITY (23 Jul 2026, Jake request).**
  Reversed the v1 "images as string paths" decision: every image is now a real Sanity
  image asset, mirroring the homePage singleton, so Seb edits all photos/logos/video in
  Studio.
  - Schema: hero cards -> `{name, role, skills, flag, image(asset)}` (up to 3, polished
    stack); `logos[]` editable array (image asset + invert/displayHeight/displayOpacity);
    `logosLabelLines[]` (3-line "Trusted by / 300+ / engineering teams"); video gains
    `videoUrl` (YouTube/Vimeo/Loom) + poster `image(asset)`; onGround, primaryHub banner
    + secondary hubs, and engineer profiles all converted to `image(asset)`. Calculator
    still copy-only. Dropped `logosLabel` (single string) in favour of the line array.
  - Query: GROQ now dereferences every asset to a URL (`image.asset->url`) + a logo
    `WH` fragment; Zod + `toLocationContent` updated (logos/label lines fall back to the
    code set; calculator numerics still spliced from code).
  - Template: hero stack fed from the region's own `hero.cards` (was hardcoded home
    cards); logo strip reads `content.logos` + renders the 3-line label; new
    `location/video.tsx` client component does poster -> click-to-play when a `videoUrl`
    is set (static poster otherwise). Reused shared `parseVideoUrl`.
  - Seed: uploads all images as assets (hero cards topped to 3 from engineer profiles,
    logos x7, poster, onGround, hubs, profiles); writes the 3-line label; leaves
    `videoUrl` empty for Seb to paste.
  - Verified: studio tsc + site tsc + lint (0 errors) + `next build` clean; all 6 routes
    200 via fallback. `migrations.status` unchanged.
  - GATES for Jake (unchanged, by hand): (1) `cd studio && npm run deploy`; (2) `npm run
    static:seed-location-pages` against `production`. Deploy BEFORE seed so Studio shows
    the new fields.
- **Fractional CTO (1 singleton, 2 routes) - CODE COMPLETE, awaiting Jake's Studio deploy
  + seed (23 Jul 2026).** Text wiring on the Home-page pattern, plus an editable video URL.
  - DESIGN REALITY: this page has NO photographs by design - the hero "cards" are
    anonymised CTO cards with CSS avatars, the logos are text names in a marquee, and the
    video is a stylised placeholder tile. So there are no image assets to wire (unlike
    Location). The ONLY media control added is a `videoUrl` (YouTube/Vimeo/Loom): when set,
    the tile plays a real embed; empty keeps the placeholder. Adding real photos where the
    design uses abstract placeholders would be a DESIGN change, not wiring - flagged, not done.
  - Schema: `studio/schemas/singletons/fractional-cto-page.ts` - `fractionalCtoPage`
    singleton mirroring FctoContent (11 sections, all copy as plain string/text + `video.videoUrl`).
    Registered in `singletons/index.ts` + grouped under Static Pages in `structure.ts`.
    Layout fields (card offsets/rot, status-pill icon/offsets, option width) are seeded but
    `hidden` in Studio so Seb sees only editable copy and cannot break the layout.
  - Query: `site/src/lib/sanity/queries/fractional-cto-page.ts` - GROQ projection 1:1 with
    FctoContent + lenient Zod + `toFctoContent()` blunt cast (identical to homePage).
  - Routes: `/services/fractional-ctos` + `/uk/services/fractional-ctos` now fetch the
    singleton first, fall back to static `FCTO`; meta title/description from Sanity with the
    static META as fallback. Template refactored to accept a `content` prop (default `FCTO`),
    threaded through every sub-component; new video embed via shared `parseVideoUrl`.
  - Seed: `scripts/static/seed-fractional-cto-page.ts` (`npm run static:seed-fractional-cto-page`)
    transcribes `FCTO` into the singleton; no images; `videoUrl` left empty for Seb; no-em-dash
    normalised; metaTitle 30 chars, metaDescription ~145 chars (140-160 compliant).
  - Verified: studio tsc + site tsc clean; my files lint-clean (repo baseline lint errors are
    pre-existing, Tech Debt #36); `next build` clean; both routes 200 via fallback.
  - GATES for Jake (by hand, 30-safety): (1) `cd studio && npm run deploy`; (2) `npm run
    static:seed-fractional-cto-page` against `production`. Deploy BEFORE seed.
- **Software Engineers / Hire Engineers (1 singleton, 2 routes) - CODE COMPLETE, awaiting
  Jake's Studio deploy + seed (23 Jul 2026).** Full text + image + video wiring on the
  Fractional CTO recipe.
  - `content.ts`: `HE` retyped from `as const` to a mutable `HireEngineersContent`
    interface; optional `image?` added to every placeholder slot (2 hero shortlist
    avatars, offer feature photo, sample-profile avatar, case-study author avatar, proof
    side + visit photos, 2 match-result photos, form-side photo); `vet.tourVideoUrl?` +
    `vet.tourPoster?` added for the 90-second tour. `CALC` numeric tables unchanged.
  - Template: `HireEngineersTemplate` now takes a `content` prop (default `HE`), threaded
    into `Calculator` (price prop), `FindForm` (find prop), `ProfileExplorer` (vet prop).
    Each image slot renders `<img>` when set, else the original CSS placeholder. The tour
    link plays a real embed via `parseVideoUrl` when `tourVideoUrl` is set (poster ->
    click-to-play, or auto YouTube thumb); otherwise the source's inert placeholder.
  - Schema: `studio/schemas/singletons/hire-engineers-page.ts` - `hireEngineersPage`
    singleton mirroring the content shape; all copy plain string/text; images via
    `imageField`; `tourVideoUrl` as `url`. The 3 calculator option arrays are seeded but
    `hidden` (they double as CALC lookup keys). Registered in `singletons/index.ts` +
    grouped under Static Pages in `structure.ts`.
  - Query: `site/src/lib/sanity/queries/hire-engineers-page.ts` - GROQ 1:1 (every image
    dereferenced to a URL) + lenient Zod + `toHireEngineersContent()` which splices the
    calculator option arrays from code `HE` and stega-cleans `vet.tourVideoUrl`.
  - Routes: `/services/software-engineers` + `/uk` fetch the singleton first, fall back to
    static `HE`; meta title/description from Sanity with `HIRE_ENGINEERS_META` as fallback.
  - Seed: `scripts/static/seed-hire-engineers-page.ts` (`npm run static:seed-hire-engineers-page`)
    transcribes `HE` 1:1; image/video fields left EMPTY (Seb uploads in Studio); no-em-dash
    normalised; metaTitle 31 chars, metaDescription 147 chars (140-160 compliant).
  - Verified: studio tsc + site tsc clean; new files lint-clean; `next build` clean (706
    pages); both routes 200 via fallback (hero + calculator copy confirmed rendered).
  - GATES for Jake (by hand, 30-safety): (1) `cd studio && npm run deploy`; (2) `npm run
    static:seed-hire-engineers-page` against `production`. Deploy BEFORE seed. NEVER re-seed
    after Seb uploads images (createOrReplace wipes them).
- **Our Work (1 singleton reconcile, 2 routes) - CODE COMPLETE, awaiting Jake's Studio deploy
  + seed (23 Jul 2026).** Reconciled the generic `ourWorkPage` singleton to a bespoke shape
  on the Fractional CTO recipe.
  - RECONCILE: `ourWorkPage` existed as the generic `defineStaticPage` shape (title + body
    sections), which the `/our-work` route NEVER read - the page rendered from static code.
    Replaced it with a bespoke `defineType` mirroring `OurWorkContent`. `createOrReplace` on
    `_id "ourWorkPage"` cleanly overwrites the old doc. Removed the `our-work` entry from
    `scripts/content/capture-marketing-pages.ts` so the generic capture can't clobber it.
  - DESIGN REALITY: the customer stories, logo marquee, reviews and the bento image/video
    grid are ALREADY Sanity-driven from their OWN documents (customer story + review docs) -
    editing a story edits the grid; not part of this singleton. The gap this closes: the
    fixed copy, the editable stat numbers (8x / 1,000+ / 7 days / +15-25% / 300+), and the
    3 decorative "customer photo" tiles (stat strip, beyond-hiring, mid CTA). Each photo is
    an optional image asset - empty keeps the striped placeholder.
  - `content.ts`: `OUR_WORK_CONTENT` retyped from `as const` to a mutable `OurWorkContent`
    interface; optional `statsPhoto?` / `beyondHiring.photo?` / `midCta.photo?` URL fields.
  - Template: `OurWorkTemplate` takes a `content` prop (default `OUR_WORK_CONTENT`); `PhotoTile`
    renders `<img>` when a URL is set, else the striped placeholder.
  - Schema: `studio/schemas/singletons/our-work-page.ts` - bespoke; copy plain string/text;
    3 photos via `imageField`; NO `ctaHref`/labels (code-owned, spliced site-side). Already
    registered in `index.ts` + `structure.ts` (was the generic singleton).
  - Query: `site/src/lib/sanity/queries/our-work-page.ts` - GROQ (photos dereferenced to URLs)
    + lenient Zod + `toOurWorkContent()` which splices `ctaHref` + labels from static and falls
    each section back to static when absent. No stega clean needed (all editable fields are
    plain text; no URLs/CSS keys exposed).
  - Routes: `/our-work` + `/uk/our-work` fetch the singleton first, fall back to static
    `OUR_WORK_CONTENT`; meta from Sanity with `OUR_WORK_META` as fallback.
  - Seed: `scripts/static/seed-our-work-page.ts` (`npm run static:seed-our-work-page`)
    transcribes copy + stat numbers; photos left EMPTY (Seb uploads); no-em-dash normalised;
    metaTitle 25 chars; metaDescription 144 chars (the 132-char static fallback + "engineering"
    to clear the Studio 140 floor, meaning unchanged).
  - Verified: studio tsc + site tsc clean; new files lint-clean; `next build` clean; both
    routes 200 via fallback (hero accent + stat strip + Trusted-by confirmed rendered).
  - SHIPPED + SEEDED + DONE 23 Jul: commit `5bd39df`, pushed to `feat/design-1` (staging
    rebuilds), Studio deployed, and `ourWorkPage` seeded to `production` (verified: bespoke doc
    landed, old generic `sections` gone). /our-work + /uk/our-work are now fully editable in
    Studio. The seed initially failed on the attribute-limit blocker below; resolved by the plan
    upgrade, then re-run cleanly. NEVER re-seed after Seb uploads photos (createOrReplace wipes them).
- **BLOCKER (23 Jul 2026) - RESOLVED via plan upgrade.** Seeding `ourWorkPage` first failed:
  `Total attribute/datatype count 2102 exceeds limit of 2000 (including submitted mutations)`.
  This is a HARD Sanity platform limit on the number of unique attribute/datatype PATHS THAT
  HOLD CONTENT across the whole `production` dataset (not per document, not schema-only). The
  project was on the Free 2,000-attribute plan; the bespoke singleton seeds shipped this session
  (Location, Fractional CTO, Hire Engineers) consumed the headroom, and Our Work's new fields
  tipped it over. **Jake upgraded the Sanity project to the Growth plan (2,000 -> 10,000
  attributes)**; the seed then succeeded. This headroom also covers the upcoming For Developers
  rebuild + future bespoke wiring. Live count: `https://lzbhll1u.api.sanity.io/v1/data/stats/production`
  (`fields.count.value` vs `fields.count.limit`). NOTE for future phases: bespoke singletons each
  add many uniquely-named nested fields - if we approach 10,000, consolidate onto SHARED named
  object types (shared stat/hero/section objects) so duplicate paths collapse, rather than
  upgrading again.
- **For Developers - REBUILD, scoped (23 Jul 2026).** This page is NOT the content-const shape
  the recipe assumes. Its entire visible body (hero, problem, how-it-works, benefits,
  testimonials, video, photos, closing CTA) is a frozen Figma HTML export injected via
  `dangerouslySetInnerHTML` (`FE2_PRE_HTML`/`FE2_POST_HTML` in `for-engineers/fe2-body.ts`);
  the copy is baked into positioned `<span>`s and the photos into the CSS blob. Only the
  "build your profile" form (`JoinForm`) reads from `FOR_ENGINEERS_CONTENT`. There is NO
  additive path to make its text+images editable - it needs a REBUILD to render from a content
  object first, then wire like the others. Jake approved the rebuild.
  **Reconnaissance done 23 Jul (findings, so the rebuild session starts hot):**
  - Prettified export = **5,225 lines** of deeply-nested, inline-styled `<div>`s. Layout is
    plain **flexbox** with CSS-variable tokens (NOT absolute positioning) -> reproducible.
    Fixed **1920px canvas** scaled down by a JS zoom-scaler (`.fe2-canvas`, transform-origin
    top center). Tokens in `fe2-css.ts` (`FE2_TOKENS_CSS`) map onto the site brand vars.
  - Visible text runs are **clean and contiguous** in spans (e.g. the hero H1 is one span with
    a nested italic accent span) -> maps cleanly to `FOR_ENGINEERS_CONTENT`.
  - **11 real bitmap photos** positioned via `.fig-asset-*` background classes ->
    `/assets/img/for-engineers/*.{png,jpg}`. These are the editable image slots (benefits x3,
    testimonials video poster, hero/mission decor).
  - The full copy for EVERY section is ALREADY structured in `FOR_ENGINEERS_CONTENT`
    (`content.ts`, 251 lines) - hero (+ profile card), problem (4 stats), how (4 steps incl a
    syntax-highlighted code snippet), benefits (5 items + 3 photos), mission, tests (video + 3
    PLACEHOLDER quotes - do not ship invented quotes), join (multi-step `JoinForm`, already
    React + interactive), final CTA. Nothing needs re-authoring; it needs re-RENDERING.
  - Scratch: prettified export dumped to `/tmp/fe2-pre.html` (5,225 ln) + `/tmp/fe2-post.html`
    for study (regenerate any time via a 3-line tsx importing the two strings + `prettier`).
  **DECISION LOCKED (Jake, 23 Jul): EXACT PIXEL-PARITY with the frozen export, made editable.**
  Not a clean re-interpretation - the rebuilt page must render pixel-identical to the current
  frozen `FE2_PRE_HTML`/`FE2_POST_HTML` output, but with every text node + photo fed from
  `content` (and thus Sanity) instead of being hard-baked.
  **Approach this forces (transcription, not re-styling):**
  1. Reproduce the export's exact DOM + inline styles in JSX, section by section, so the rendered
     result is byte-for-byte the same look. Keep the `.fe2` scope, `FE2_TOKENS_CSS`, the 1920px
     `.fe2-canvas` + zoom-scaler, and `FE2_UI_CSS` exactly as-is (they own the pixels).
  2. At each visible text node, swap the hard-coded string for the matching `content` value.
     WATCH: the export splits some text in ways `content.ts` does not - e.g. the hero H1 is one
     span "Get matched to the best companies," + a nested italic accent span "wherever you are",
     while `content.hero.title` holds the whole sentence. Where they disagree, restructure the
     CONTENT field (split title into lead + italic accent, like the other pages' titleLead /
     titleAccent) so a Sanity edit maps to exactly one visible run. Do NOT change the visual.
  3. At each `.fig-asset-*` photo, replace the baked background class with a content-driven image
     (URL from Sanity, with the export's exact box/position as the fallback/placeholder).
  4. Keep `JoinForm` as-is (already React + interactive, already reads `content`).
  5. Then wire to Sanity with the standard recipe (bespoke singleton reconciling the generic
     `forDevelopersPage` + GROQ/Zod/transform + US/UK routes + seed).
  **Verify:** screenshot the rebuilt route and diff it against the current frozen render at the
  same width(s); they must match. Testimonial quotes are PLACEHOLDERS - keep the placeholder
  markers, do not ship invented quotes.
  **Run as its own dedicated session** (this brief is the memory; recon above makes it start
  hot). A ~5,200-line pixel-parity transcription is one-phase-per-session work, not a
  tail-of-session grind - that is how we get it exactly right.
  **DONE - built + wired, pixel-parity PROVEN, build green (23 Jul 2026).** Approach taken was
  TOKENISE-AND-HYDRATE, not hand-transcription (safer for a 5,200-line export - no chance of a
  typo drifting a pixel):
  - The frozen body is stored ONCE, tokenised: every editable text node is a unique token
    (`\u27E6path\u27E7`) and every photo keeps its original `.fig-asset` class
    (`for-engineers/fe2-body.ts`, GENERATED). `hydrateFe2()` (`fe2-hydrate.ts`) fills each token
    from the content object and overrides a photo background ONLY when a Sanity image URL is set,
    else the baked Figma image shows. `FE2_TOKENS_CSS`, `FE2_UI_CSS`, the 1920px canvas + zoom
    scaler are untouched (they own the pixels).
  - Parity is a hard gate, not a claim: `npm run static:verify-fe2-parity` asserts
    `hydrate(tokenised, static defaults) === the frozen export`, BYTE-FOR-BYTE, against a pristine
    snapshot at `scripts/static/__fe2-original.json`. PRE (93,756 chars) + POST (4,988) both PASS.
  - `content.ts` restructured to a mutable `ForEngineersContent`: H1s split lead/accent, the
    profile card, 4 problem stats, 4 how-it-works steps (the Go code block stays FROZEN, not
    editable), 4 benefits + 3 photos, mission, 3 PLACEHOLDER testimonials, final CTA, plus 10
    empty image slots (hero card, 2 video-call stills, 3 benefit photos, video poster, 3 quote
    photos). Defaults are the EXACT export strings (derived programmatically from the export, not
    retyped). `JoinForm` + `JOIN_CONTENT` kept as-is (code-owned, not in Sanity).
  - Bespoke `forDevelopersPage` schema replaces the old generic singleton (same registration in
    `index.ts` + `structure.ts`); GROQ + lenient Zod + `toForEngineersContent` transform
    (`site/src/lib/sanity/queries/for-developers-page.ts`) - text keeps stega for click-to-edit,
    image URLs are stega-cleaned (they land in a CSS `url()`), sections fall back to static when
    absent. US + `/uk` routes fetch Sanity with the static fallback. Seed:
    `scripts/static/seed-for-developers-page.ts` (`npm run static:seed-for-developers-page`),
    image slots empty, testimonials flagged PLACEHOLDER, no em dashes.
  - Verified locally: studio tsc clean, site tsc clean, `npm run build` green, both routes 200
    with ZERO leftover tokens, full-page screenshot matches the frozen export.
  - NOT yet seeded to production + NOT pushed (Jake's gates). Commands handed over at session end.

## Notes for the executor
- No em dashes anywhere (code, schema copy, seed data).
- Do not rebuild the templates; this is additive wiring only.
- Do not touch the calculators' logic (Location cost calculator + hire-engineers cost
  calculator stay code-driven; only their surrounding copy is content).
- This is multiple sessions of work; do one page fully, verify, commit at a named HALT
  (with Jake's push approval), then the next. Keep this brief current as each page lands.

## STATUS (23 Jul 2026)
- DONE + LIVE on staging + seeded to production dataset + Studio deployed:
  **Location x3** and **Fractional CTO**. Fractional CTO shipped in 3 commits: text+video
  wiring, a stega fix (`fc4808e`), then editable images (`da27a01`) - hero avatars, the
  "Tell us what you need" feature photo, and video poster + auto-YouTube-thumbnail.
- DONE + LIVE on staging + seeded to production + Studio deployed: **Our Work** (commit
  `5bd39df`) and **Software Engineers / Hire Engineers** (commit `cf0b5f2`; seeded 23 Jul after
  the Growth upgrade, verified `hireEngineersPage` landed with all sections). Both fully editable
  in Studio.
  NOTE: the Sanity project is now on the **Growth plan (10,000 attributes)**, so future seeds
  no longer hit the 2,000 limit.
- DONE - built + wired, pixel-parity PROVEN, build green, verified locally (23 Jul 2026):
  **For Developers** (`/for-developers` + `/uk`). Tokenise-and-hydrate rebuild (see the For
  Developers progress-log entry above for the full method); `npm run static:verify-fe2-parity`
  asserts the served body is byte-identical to the frozen export. NOT yet seeded to production +
  NOT pushed (Jake's gates). This was the LAST of the 6 bespoke pages.
  Remaining before seed/push: Jake runs `npm run static:seed-for-developers-page`, redeploys
  Studio, then pushes for staging.

## REUSABLE RECIPE - copy the Fractional CTO implementation exactly
Reference the shipped Fractional CTO files as the template for each remaining page:
- Schema singleton: `studio/schemas/singletons/fractional-cto-page.ts`
- Query (GROQ + lenient Zod + transform): `site/src/lib/sanity/queries/fractional-cto-page.ts`
- Routes: `site/src/app/services/fractional-ctos/page.tsx` (+ `/uk` mirror)
- Seed: `scripts/static/seed-fractional-cto-page.ts` (+ `package.json` script)
- Template prop-threading + image/video rendering: `site/src/components/templates/fractional-cto/`

Steps per page:
1. `content.ts`: add a mutable `XContent` interface (the templates are `as const`); add
   optional `image?: string` to every image slot, `videoUrl?`/`poster?` where a video/tile
   exists. Type the exported const as `XContent`.
2. Template: if it is a client component reading the const directly, refactor it to accept
   a `content` prop (default = the static const) and thread it through EVERY sub-component.
   Render `<img>` in each placeholder slot when the field is set, else keep the existing CSS
   placeholder. For video: play a real embed via `parseVideoUrl` when `videoUrl` set; show
   `poster` (or auto YouTube thumb `https://img.youtube.com/vi/{id}/hqdefault.jpg`) as the still.
3. Schema singleton mirroring the content shape: all copy plain string/text; images via
   `imageField(...)`; `videoUrl` as `type:'url'`. Keep pure-LAYOUT strings (offsets, rotation,
   icon-map keys, option width) as `hidden` seeded fields. Register in
   `studio/schemas/singletons/index.ts` AND add the name to `STATIC_PAGE_NAMES` in
   `studio/schemas/structure.ts`.
4. Query: GROQ 1:1 with the content shape, dereferencing every image to a URL
   (`"image": image.asset->url`); lenient Zod; `toXContent()`.
   **STEGA GOTCHA (mandatory):** in Presentation, Sanity injects invisible chars into every
   string. That is fine for prose (it powers click-to-edit) but CORRUPTS strings used as CSS
   values / lookup keys / URLs, which collapses layouts. In the transform, splice code-owned
   layout values from the static const by index, and `stegaClean(...)` any URL used in
   `parseVideoUrl`/iframe src (see `fractional-cto-page.ts` `toFctoContent` and how-it-works
   `barWidth`). Image asset URLs do NOT need cleaning (homePage proves this).
5. Routes (US + UK): `const data = await fetchX(); const content = data ? toXContent(data) : STATIC`.
   Meta title/description from Sanity with the static META as fallback.
6. Seed: transcribe the static const into the singleton; no-em-dash `normalizeDeep`; `keyed()`
   object arrays; leave new image/videoUrl fields EMPTY (Seb uploads in Studio). metaTitle <=60,
   metaDescription 140-160.
7. Verify: `cd site && npx tsc --noEmit && npm run build`; `cd studio && npx tsc --noEmit`;
   routes 200 via fallback. Lint: only your files must be clean (repo has pre-existing
   Tech Debt #36 lint errors in other files - ignore those).
8. Gates: commit (explicit paths, single-line msg), push on Jake's OK, `cd studio && npm run
   deploy`, then `npm run static:seed-<page>`. Deploy BEFORE seed. NEVER re-seed a page after
   Seb has uploaded images (createOrReplace wipes them).

## Per-remaining-page specifics (already analysed)
### 1. Software Engineers / Hire Engineers - `/services/software-engineers` (+ /uk)
- Files: `site/src/components/templates/hire-engineers/{index.tsx,content.ts}` (const `HE`,
  meta `HIRE_ENGINEERS_META`, calc tables `CALC`). Client component. Routes render `<HireEngineersTemplate />`
  with NO Sanity fetch today. No singleton exists yet -> FULL wiring (new singleton `hireEngineersPage`).
- Cost calculator: numeric tables (`CALC`) stay in code; only the surrounding copy (labels,
  options, notes, initial figures) is content - same split as Location.
- Image/placeholder slots to make editable (the blank `.imgslot` "Image suggestion" tiles +
  photo placeholders): `offer.img`, `proof.sideImg`, `proof.visitImg`, `find.img` (4 imgslots);
  `find.step3.matches[].face` (currently `ftag:'photo'`); `hero.card.candidates[].av` and
  `vet.profile.av` and `proof` author avatar are letter-avatars - offer optional photo fields.
- Video: no real video element; the vet "90-second tour" is a link + a faux placeholder modal.
  Optional: add a `videoUrl` for the tour. Confirm with Jake whether to add a real video tile.
### 2. For Developers - `/for-developers` (+ /uk)
- Files: `site/src/components/templates/for-engineers/{index.tsx,content.ts}` (+ `fe2-body.ts`;
  const `ForEngineersTemplate`, meta `FOR_ENGINEERS_META`). Route renders static template.
- RECONCILE: a generic `forDevelopersPage` singleton already exists via `defineStaticPage`
  (title/body/meta only - the OLD captured shape). Replace it with a bespoke `forDevelopersPage`
  schema matching the template, wire the route, retire the generic one. The generic doc in the
  `production` dataset is overwritten by the bespoke seed (createOrReplace, same `_id`).
### 3. Our Work - `/our-work` (+ /uk)
- Files: `site/src/components/templates/our-work/{index.tsx,content.ts}` (const `OurWorkTemplate`,
  meta `OUR_WORK_META`). Route renders static template.
- RECONCILE: generic `ourWorkPage` singleton exists via `defineStaticPage` - same reconciliation
  as For Developers. Do NOT merge with `/customer-stories` (SEO note in the singleton file).

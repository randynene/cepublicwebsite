# PHASE_HISTORY.md

## MYGRATR-LAUNCH — cutover CLOSED (3 Aug 2026) + post-launch audit (4 Aug 2026)

**Scope:** DNS cutover of cloudemployee.io from Webflow to Vercel, plus the pre-cutover fixes the parity and SEO gates surfaced, plus the first post-launch audit. 56 commits since 1 Aug.

**DNS + certificates.** Registrar is name.com but nameservers point at Cloudflare, so all record changes were made in Cloudflare. `www` CNAME → `8baa634dd683a50a.vercel-dns-016.com`; apex CNAME flattened to the same target. **Both records un-proxied (grey cloud)** because Vercel requires the proxy off for its own hostnames. `_vercel` TXT verification records added for both apex and www. Certificate for `www` issued 13:55 UTC; the apex lagged and served a 308 to an address it had no certificate for, so the bare domain failed the TLS handshake for roughly 20 minutes; resolved by a domain Refresh in Vercel, cert issued 14:16 UTC (Let's Encrypt, CN=cloudemployee.io, valid to 1 Nov 2026). Final state: `http://cloudemployee.io`, `https://cloudemployee.io`, `http://www.cloudemployee.io` all 308 to `https://www.cloudemployee.io` (200).

**Consequences of dropping the Cloudflare proxy, and what replaced them.** Grey-cloud records mean every Cloudflare edge feature stops running for those hostnames. Two were load-bearing. The `country-check` **Worker** injected `window.VISITOR_COUNTRY` off the `CF-IPCountry` header, used to gate Hotjar to US/GB (a cost control); replaced with a server component reading Vercel's native `x-vercel-ip-country` and emitting the same global (`VisitorCountryScript` in `site/src/components/third-party-scripts.tsx`, mounted in `<head>` before dependants). The **WAF + rate-limit rules** were to be recreated in Vercel's firewall; the WAF port caused the launch-day outage below and the rate-limit rule was subsequently dropped as not worth the risk.

**Launch-day incident — Vercel firewall challenge on the Philippines.** A custom rule ("Challenge high-spam countries": PH, CN, RU, SG) was published shortly before cutover, mirroring the old Cloudflare list. Effect: every request from those countries, on every path, returned HTTP 429 with `x-vercel-mitigated: challenge` and a `<title>Vercel Security Checkpoint</title>` interstitial. CE's whole Philippines delivery team plus the Filipino engineer audience were locked out. Surfaced by a Slack screenshot from staff, not by monitoring. Diagnosis was direct: the served HTML was the checkpoint, and `x-vercel-id: sin1::` confirmed the Asia-Pacific edge. Fixed by toggling the rule off (applies without redeploy). **Root cause is a reasoning failure, not a tooling one:** the country list was ported from Cloudflare without asking whether it made sense for a business whose staff and talent pool are Filipino. Jake had explicitly questioned the country choice at the time it was added and the question was not taken seriously enough. **Do not re-enable.** If protection is wanted later it must exclude the team's countries and start in Log mode.

**Pre-cutover fixes (all committed).** `0d67ae4` — host-aware `robots.ts` (reads `x-forwarded-host`/`host` per request instead of `NEXT_PUBLIC_CANONICAL_HOST` at build time, which would otherwise have made staging indexable the moment the variable was set for production); all three Geotargetly rules restored verbatim (ids, timestamps, callback names and query-string shape are a contract with the GeoTargetly account, not incidental); Hotjar gated to US/GB. `c9fab0b` + `8be3172` — `resolvePageTitle` now treats stored Sanity titles as absolute, collapsing accidental doubled brand suffixes rather than appending; legal routes routed through the same helper; the meta backfill skips URLs that redirect on live (a redirect has no title of its own, and following it stamps the destination's title onto the source). `78a8adf` — `/compare` and `/start-hiring` retirement knock-on redirects recorded as parity exceptions. `d63b1b5` — real 1200x630 OG default replacing a 1x1 transparent pixel. `791c577` — Anto C. removed from the talent roster, Marcelo P. moved to Eastern Europe (his source photo was always `europe/EU 3.png`, so he had been an Eastern European face carrying an Argentine flag).

**Post-launch audit (4 Aug).** Data sources verified working, not assumed: GSC service account `gsc-reader@cloud-employee-seo.iam.gserviceaccount.com` is `siteFullUser` on `sc-domain:cloudemployee.io` (a DOMAIN property — spans www/non-www/subdomains, so history is continuous across the cutover and no new property is needed); the `googleapis` client library was missing and was installed. Ahrefs v3 returns data for the domain (DR 36, rank 2,140,702), which **resolves Tech Debt #4** — the subscription now covers cloudemployee.io.

New scripts: `scripts/seo/gsc-pull.ts` (performance by page/query/date, any window, respecting GSC's 2-3 day lag), `scripts/seo/verify-gsc-urls.ts` (replays every URL with impressions against production, collapsing host variants, weighting findings by clicks), `scripts/seo/ahrefs-pull.ts` (top pages, best-by-external-links, broken backlinks, organic keywords; endpoint columns differ by plan, so the script reads the available-columns error rather than assuming a schema).

**Result: 309/330 URLs clean, zero regressions.** Every exception traced to one of three benign causes, each verified rather than assumed: URLs on the separate `talent.cloudemployee.io` Webflow site (my first pass wrongly tested those against www); pages already 404 on Webflow before cutover (`/team/shawnee-malesich`, `/team/jimmy-mclellan` — both `retired: true` in Sanity and both already 404 in the captured pre-cutover behaviour, so their Search Console clicks are historical); and intentional redirects already recorded as parity exceptions (`/retention`, `/embedding`, `/sourcing` → `/how-it-works`; `/compare` → `/alternatives`).

**Findings that are real but not migration damage.** 8 Webflow per-category RSS feeds are registered as sitemaps in Search Console and now all 404, which will pollute sitemap error reporting. 24 URLs hold live backlinks and return 404, including from DR 91/75/73 sources; **23 of the 24 were already 404 before cutover**, making this years-old inherited link rot and a reclaim opportunity. Strategically: 514,635 impressions per 90 days → 1,616 clicks (0.31% CTR), ~50% brand, so non-brand organic is ~9 clicks/day against DR 36; the high-impression pages sit at average position 25-40, which is a ranking problem no title rewrite fixes. Full record and prioritised list: `docs/seo/POST_LAUNCH_AUDIT.md`.

**Not done in this phase:** Screaming Frog production crawl (all existing crawls targeted staging and are superseded; spec written, awaiting Jake's run with GSC/Ahrefs/PageSpeed APIs connected), Core Web Vitals measurement at scale, and the `migrations.status` transition — still `content_complete`, since the Supabase state change is a separate gated action.

## MYGRATR-TEMPLATE-REVIEW — Review detail page CLOSED (Jul 2026)

Pattern-apply build on `feat/design-1`, third detail template. Fidelity reference: **Team Member reconciliation** (`Review.html` export, dark/lime D2 tokens). **Routes:** `/reviews/[slug]` (default) + `/uk/reviews/[slug]` (UK mirror). **Step 0 probes:** **11 published** `review` docs (not 26 — stale count from CONTENT-1B migration; **0 drafts**; 15 of the original 26 were **deleted** in CONTENT-1D drift cleanup via `cleanup-drift-docs.ts`, not sitting as unpublished drafts). All 11 routable; core fields populated; `thumbnailImage` 8/11. **Four-file structure:** `site/src/lib/sanity/queries/review.ts`, `site/src/types/sanity/documents/review.ts`, `site/src/components/templates/review/index.tsx` (hero card + related grid), `site/src/components/templates/review/json-ld.tsx` (`Review` + `BreadcrumbList`; fixed 5-star rating visible in UI). **Company H1:** `site/src/lib/review/display-name.ts` — metaTitle prefix when not generic hub title, else slug humanization (Tech Debt #52). **Omitted by design:** case study link (export shows it; no `customerStory` ref on schema). **SEO Tier-1:** twitter card, OG from thumbnail/member/company logo, sitemap `URL_BUILDERS.review` (+22 URLs → **244** total), `validate-json-ld.ts` Review checks on `/reviews/salmon-software`. **PRE-LAUNCH blocker (Tech Debt #51):** legacy Webflow redirects send `/reviews/cameron-pearson`, `/reviews/emsl`, `/reviews/mercato` → `/reviews` hub — 3 of 11 detail pages unreachable until redirect table fixed at LAUNCH. **Infra (same push):** SanityLive `refreshOnFocus`/`refreshOnReconnect` scoped to draft mode in `layout.tsx` (`d876add`) — published pages no longer emit `BAILOUT_TO_CLIENT_SIDE_RENDERING`. **Commits:** `d22613f` (template stack), `d876add` (SanityLive). `migrations.status` unchanged at `content_complete`.

## MYGRATR-TEMPLATE-TEAM_MEMBER — Team member detail page CLOSED (Jul 2026)

Pattern-apply build on `feat/design-1`, second detail template after TEMPLATE-BLOG. **Routes:** `/team/[slug]` (default) + `/uk/team/[slug]` (UK mirror) — 28 members × 2 locales = 56 static paths; `/team` index 301 to `/about-us` unchanged (no team listing). **Reconciliation (Jul 2026):** template updated to match `Team Member.html` export — now the fidelity reference for simple detail templates (Review detail followed same discipline). **Step 0 probes:** 28 published `teamMember` docs confirmed; fill rates — image/about/expertise/time 28/28, linkedin 26/28, bookACall 5/28; `blogPost.author→teamMember` ref exists (39/74 posts), so Articles section built with empty-state. **Four-file structure:** `site/src/lib/sanity/queries/team-member.ts` (full + meta + author-posts + params queries + Zod boundary), `site/src/types/sanity/documents/team-member.ts`, `site/src/components/templates/team-member/index.tsx` (dark/lime layout from screenshot structure), `site/src/components/templates/team-member/json-ld.tsx` (`Person` + `BreadcrumbList`; `worksFor` from `siteSettings`). **SEO Tier-1:** twitter card included (blog omission not copied); OG falls back to cropped `teamMemberImage` then `/og-default.png`; sitemap `URL_BUILDERS.teamMember` adds 56 URLs (222 total with blog + hubs); `validate-json-ld.ts` extended for `Person` field checks. **Build:** `npm run build` clean (232 pages). **Data gaps (not fabricated):** all 28 `teamMemberImage.alt` null (Tech Debt #50); `timeAtCloudEmployee` stores bare numbers ("11", "3 ") — template appends "year/s" label. **Commits:** `dfb4078` query+types, `d0eb9bf` template+ui-strings, `04c210f` routes+json-ld+sitemap+validator. `migrations.status` unchanged at `content_complete`.

## Context sync — Jul 2026 (post STATIC-3, pre next build track)

**STATIC-3 complete and committed** on `feat/design-1`: header, Services + Resources mega-menus, footer rebuild, announcement bar, chrome-band alignment. `migrations.status` unchanged at `content_complete`.

**Built-but-stale discovery (hubs + 404):** STATIC-1's 16 hub routes and `not-found.tsx` remain the live code path — real routes, Sanity singletons, pagination, `CollectionPage` + `BreadcrumbList` JSON-LD, build-clean for those pages. They still render the generic STATIC-1 `renderHub` card grid, not the D3 dark/lime hub designs (design artifacts exist for 5 index pages; 6 blog-category hubs inherit blog-card pattern; videos/tools/downloads/events/compare use the generic collection/resource pattern). Reconciliation is a later D3/D5 pass, not a greenfield build. Tech Debt #43.

**Hub content gaps (verified against schema + seed + queries):** Live-site hub intro copy, body/Key-Topics blocks, and FAQs were never migrated. `introContent` exists in hub schema but was left empty at seed and is neither queried nor rendered; `featuredArticles` / `featuredItems` empty; no `faqs` field on `defineBlogHub` / `defineCollectionHub`. Fourteen of sixteen hubs have wrong `heroDescription` (STATIC-1 seed used `metaDescription` as hero text; only `videosHub` + `staffAugmentationHub` have proper authored copy). Tech Debt #44, #45.

**SEO infrastructure audit + gates:** Read-only audit confirmed TEMPLATE-BLOG SEO scaffolding (metadata helpers, JSON-LD, sitemap, robots) and surfaced launch blockers. Gates now on disk: `docs/seo/SEO_GEO_PER_TEMPLATE_CHECKLIST.md` + `docs/seo/SEO_GEO_SITEWIDE_GAP_FIX_BRIEF.md`. Tier 1 items include mega-menu deep links absent from initial HTML, missing sitewide Organization/WebSite JSON-LD, static `<html lang="en">` on UK routes. Tech Debt #47.

**Other flags logged:** `/legals/privacy-policy` route fails `npm run build` (Zod null vs undefined on empty Sanity fields); uncommitted on disk. `navigation.howItWorksMegaMenu` data unused after STATIC-3 plain-link demotion (#48).

## MYGRATR-STATIC-3 — Chrome Visual Rebuild CLOSED (Steps 5-6, Jul 2026)

STATIC-3 phase close on `feat/design-1`. Steps 3/4 (mega-menus) were closed earlier; this entry covers Steps 5-6.

**Step 5 — Footer rebuild** (`ab85d72` + follow-on commits): deleted monolithic `footer.tsx`; modular `site/src/components/layout/footer/` reads STATIC-2 `footer` global. Layout maps `sections[0/1]` to Footer.html flat eyebrows (Roles / Technologies / Company / Resources), not Studio section pills. `topCtaBlock`, HubSpot subscribe (`FooterSubscribeForm` export shell + `HubSpotFormEmbed`), `bottomBar` with `RegionSelector` (pathname-aware US/UK logic from STATIC-1). **Alignment pass:** `chrome-band.tsx` introduces `CHROME_CONTENT_BAND` (1152px) shared by header + footer; header uses `CHROME_HEADER_ROW` (logo left, nav cluster centre, CTA right, `gap-4` link spacing).

**Announcement bar** (Header.html frame 01): additive `navigation.announcementBar` on `studio/schemas/globals/navigation.ts` (`enabled`, `badgeLabel`, `message`, `linkLabel`, `linkUrl` plain string for internal paths). Studio deployed (`sanity deploy` → `mygratr-cloudemployee.sanity.studio`). Render at `site/src/components/layout/announcement-bar.tsx`; wired in `nav.tsx` `StickyChrome` wrapper. `enabled: false` → null render + `--announcement-bar-height: 0`. Enabled height 32px (`--announcement-bar-active-height`); body `padding-top` uses calc + sticky wrapper negative margin to prevent double-offset gap. Seed: `scripts/static/patch-announcement-bar.ts` + `seed-globals-v2.ts` default (`enabled: true`, message per export, `linkUrl: /pricing`).

**Step 6 — Verification artifacts:** `scripts/static/validate-json-ld.ts` flattens `@graph` wrappers + expects `SiteNavigationElement` on hub/blog/404 probes. tsc clean.

**Brief-vs-reality / data gaps (not blockers):** Footer export uses flat eyebrows not "Our Expertise" pills; `topCtaBlock` has no `description` in schema; subscribe relies on HubSpot mount (export-matching placeholder until ready); announcement `linkUrl` seeded to `/pricing` (calculator merge path — Seb may retarget in Studio); Services mega-menu `viewAllLink` + pill-style data gaps from Step 3/4 remain.

**Data state:** `migrations.status` unchanged at `content_complete`. Navigation global patched in production with `announcementBar` via Jake-run patch script.

## MYGRATR-STATIC-3 — Mega-Menu Renderers (Steps 3/4 close, Jul 2026)

STATIC-3 Step 3/4 closed the mega-menu content layer against `docs/design/raw-html/Header.html`. **Services** (`site/src/components/layout/mega-menus/services.tsx`) renders frame 03: 300px/1fr grid, Staff Augmentation highlighted card on `#16223A`, leading-arrow section pills, real techLogo images, bottom AI Services / Product Builds row with top divider. **Resources** (`resources.tsx`) renders frame 04: 240px/1fr/1fr grid, plain Resources heading + four left nav pills (Material Symbols icons), Blogs column with outline View-all pill + thumbnail cards, Customer Stories column with solid-lime View-all + green-gradient story cards + `nav.readFullStory` UI string. Shared parts at `mega-menus/_parts.tsx`; shell at `_shell.tsx` gained `border-border-subtle` + `rounded-[20px]`. **Nav wiring** (`nav-client.tsx`): only Services + Resources are mega-menu triggers; How It Works renders as a plain link despite legacy `dropdownType: how-it-works-mega` in Sanity (`howItWorksMegaMenu` data preserved but unused). Mobile drawer (frame 06): `#070D18` background, lightweight section-name lists (no full desktop grid), lime active label, no `{category} list` link. **Primitive**: `MegaMenuPillLabel.leadingArrow` additive opt-in. **Flagged, not fixed**: Sanity `sectionLabelStyle` values (pill-dark/gradient/navy) do not match export's uniform outline pill (`transparent + #32435F border`); `servicesMegaMenu.leftColumn.viewAllLink` null in Sanity. tsc + lint clean. `migrations.status` unchanged at `content_complete`. Footer Step 5 remains.

## MYGRATR-D3 - Entire Screenshot-Driven / Existing-Site Category Complete (Jun 2026)

Pricing and Legal designed in Claude Design (no code shipped - design artifacts only), closing the entire screenshot-driven / existing-site design category. The full set now done: chrome (Header, Footer, 404), all content-detail templates (incl. Service/Technology on the 5-fold modular system), all 5 hub/index pages (2 card types), plus Pricing and Legal.

Remaining D3 is the Figma-driven bespoke batch ONLY: Home, How It Works, Fractional CTO, Managed Pods, Referral, Locations. Engineering Sign-up + About stay blocked on Seb; Event deferred pending a screenshot. `migrations.status` unchanged at `content_complete` - D3 is design work, not a state transition.

## MYGRATR-D3 - Screenshot-Driven Detail + Index Templates Designed (Jun 2026)

D3 design run completed the entire screenshot-driven template category in Claude Design (no code shipped this milestone - design artifacts only). Scope landed: chrome (Header, Footer, 404); all content-detail templates (Team Member, Review, Video, Download + Thank You, Tool, Book a Call, Compare, Customer Story); Service detail + Technology detail (both on the shared 5-fold modular system, matching the `service`/`technology` schemas which both drive body content through the same `folds` array of `fold` objects); and all 5 hub/index pages (Blog, Reviews, Customer Stories, Services, Technology).

The bulk of the work was carried by a small set of reusable atoms rather than per-page bespoke design: 2 card types (BlogCard + CollectionCard) cover all 5 index/hub pages, 5 fold types cover the Service/Technology modular bodies, and 1 accordion (the D2 shape-edit) covers FAQ surfaces across templates. This atom-first approach is the reason a large template count closed in a single design run.

Remaining D3: Pricing, Legal, then the Figma-driven bespoke batch (Home, How It Works, Fractional CTO, Managed Pods, Referral, Locations). Engineering Sign-up + About are blocked on Seb. Event is deferred pending a screenshot. `migrations.status` unchanged at `content_complete` - D3 is design work, not a state transition.

## MYGRATR-D2 — Token Re-Extract (Jun 2026)

D2 of the design restart (`docs/DESIGN_EXECUTION_ROADMAP.md`), against the LOCKED `docs/design/VISUAL_LANGUAGE_SPEC.md`. Replaced the teal-era tokens in `site/src/app/tokens.css` with the new visual language: dual-mode semantic colour tokens (Dark is the live `@theme` skin, Light via a `[data-theme="light"]` override block), canonical dark ground `#070D18` (the two-navies resolved to bg/primary), lime accent `#D4FF3C` with the §1c opacity scale + §6 contrast/pairing rules captured as comments; the LIVE Inter Semi Bold type scale (H1 67 / H2 58 / new H3 46 with paired line-height/tracking/weight via Tailwind v4 `--text-*--*`), Source Serif 4 Italic accent; §5 inferred spacing/radius/shadow flagged inferred-pending-Figma. Fonts swapped Poppins → Inter + Source Serif 4 Italic in `layout.tsx`; `globals.css` body re-grounded on the dark tokens (`color-scheme: dark`). **DEV-1**: old token names (brand-primary/secondary/tertiary, surface-base/elevated, text-default) kept as remapped aliases so all ~30 primitives re-skin with zero edits; D4 migrates components onto the semantic names then deletes the aliases. **D2 absorbed two D4 items on Jake's direction** (boundary recorded honestly): (1) the lime-contrast pass — no white text on lime (button, tag, mega pill, checkbox glyph, header skip-link, HubSpot submit, hub pagination, service-card CTA) plus the `bg-text-default` dark-surface regressions the text-default flip exposed (tooltip, dialog + mobile-drawer scrims, video backgrounds, mega pill-dark); (2) the Accordion shape-edit — thin plus glyph (no black circle) + continuous dark ground with dividers, per the new FAQ reference. Verified after every edit batch: tsc clean, `npm run build` clean (174 routes), lint unchanged (pre-existing Tech Debt #36 only). Remaining D4 carryover recorded in the `tokens.css` DEV-1 block. `migrations.status` unchanged at `content_complete` — D2 does not transition state. **Not committed here**: `nav.tsx` + `nav-client.tsx` carry pre-existing STATIC-3 floating-pill work; the 2 nav contrast fixes ride with STATIC-3.

## MYGRATR-STATIC-2 — Chrome Schema Extensions + Reseed (May 2026)

### Phase context

Schema + content phase between STATIC-1 (chrome shipped) and STATIC-3 (visual rebuild). STATIC-1 shipped a structurally-correct, SEO-clean chrome layer but the schema didn't support CE's live-site mega-menu shapes (Services hybrid CMS-driven references with name + tagline + icon, How It Works image cards, Resources featured posts + stories on dark-green bg, footer top CTA + section grouping + Talent Locations + restructured Subscribe). STATIC-2 extends the schema additively (no removals; legacy fields preserved for STATIC-1 render regression safety), captures CE's live chrome content via a fresh audit script, and reseeds Sanity with the v2 structure. STATIC-3 then rebuilds the visual layer on top.

`migrations.status` unchanged at `content_complete` throughout — STATIC-2 is schema + content work, not a state-machine transition. Brief was `docs/briefs/active/MYGRATR-STATIC-2-BRIEF.md`, revised through v1 → v1.1 (DELTA-B applied) → v1.2 (phase-close reconciliation); moved to archive at this commit.

### Commits + step-by-step

- **`0586eaf` feat(static): STATIC-2 Step 1, live-site chrome audit script.** `scripts/audit/static-2/extract-chrome.ts` (~2100 lines) + companion diagnostic `probe-panel-shape.ts`. Playwright launches Chromium with GeoTargetly bypass (en-US Accept-Language header + script-route stub via `context.route(/geotargetly\.com/, ...)`) and a `__name` shim via `context.addInitScript` — tsx/esbuild's named-function transpilation injects `__name(fn, "name")` wrappers that travel with `fn.toString()` into `page.evaluate` callbacks, where the browser has no `__name` global → `ReferenceError`. The shim is the durable fix: `(window).__name = (fn) => fn`. Webflow nav structure: nav-link anchor → `.w-dropdown-toggle` ancestor (within 5 levels) → sibling `.w-dropdown-list` panel; both tagged with `data-mygratr-toggle/panel` for deterministic re-query. 5-strategy icon extraction (img-src / svg-use / inline-svg / background-image / Material font via fontFamily AND `.md-icon` class-name fallback). Strategy 6 added for Resources featured cards via `.resources-item-link` overlay anchors (empty textContent, aria-label only) wrapping `.resources-item` containers — discovered via the `panel-shape-probe.json` diagnostic. Label-blocklist filter (`/^(learn more|view all|...)$/i`) applied at `captureServicesMega` + `captureResourcesMega` item-extraction sites with Sanity-doc collision check confirming 0 real-doc collisions before applying. 4 STATIC-2 brief-vs-reality deltas surfaced + filed in `static-2-brief-deltas.json`: A (footer CTA labeled "Book A Call" not "Start building your team"), B (service mega-menu items render text-only on live site — DELTA-1 `service.thumbnail` backfill dropped from scope mid-phase), C (customer-story URL singular `/customer-story/<slug>` not plural), D (blog cards span multiple URL namespaces: `/nearshoring-offshoring/`, `/hiring-tips/`, `/scaling-teams/`). 1 STATIC-3 delta filed in `static-3-brief-deltas.json` (floating-pill scroll-triggered, not steady-state). Outputs: 7 structured JSON + asset downloads (23 assets total: 4 HIW photos + 6 Resources blog/story thumbs + 13 footer entries deduped to 5 sha256-unique files). AVIF extension added to `extFromUrl` allowlist (live site serves blog thumbnails + customer-story logos as AVIF). 4 phase-close tasks queued from this step: `__name` shim pattern in CAPABILITY_LOG, DELTA-5 ("Our Clients" → `/our-work`) in CHANGELOG + CONVENTIONS, DELTA-B 7 brief edits, customer-2 methodology insight.

- **`26b06f0` feat(static): STATIC-2 Step 2, schema extensions + Zod types.** 7 files. Studio: `studio/schemas/_shared.ts` extended `imageField()` helper with `altRequired?: boolean` opt (Customer-2-reusable for chrome image fields that always need a11y alt). `studio/schemas/globals/navigation.ts` rewrite: `primaryLinks[].dropdownType` discriminator enum (`none | services-mega | how-it-works-mega | resources-mega`) + `servicesMegaMenu` (hybrid CMS-driven — leftColumn with `highlightedItems` max-2 + `items` reference arrays both unioning `[service, technology]`; rightColumnTop; rightColumnBottom.sections max-2 — schema stores ONLY structural template, name/tagline/icon dereference at render time) + `howItWorksMegaMenu` (3 cards + bottom panel, each inline `image` field with `altRequired: true, required: true` per Option B locked at STATIC-2-DELTA-2/4) + `resourcesMegaMenu` (left column items with discriminated icon shape `{source: 'material-font'|'asset', name, asset, alt}` validated via `Rule.custom()` — `material-font` requires `name` ligature, `asset` requires `asset + alt`; middle column blogPost ref array max-3; right column customerStory ref array max-3). `studio/schemas/globals/footer.ts` rewrite: `topCtaBlock` (heading + statRow + primaryCta + secondaryCta) + `sections[]` (sectionLabel + 5-variant `sectionLabelStyle` + columns with `headingHasArrow` + `headingUrl` + links + optional `bottomPillLinks`) + `talentLocations` + `subscribe` + `bottomBar` (with `regionSelector` and `hreflang`-aware options). `service.tagline` + `technology.tagline` (optional, max 80 chars; brief-spec descriptions). All legacy fields (`primaryLinks[].dropdownItems`, `cmsDriven`, `cmsCollection`, `localeDropdown`; footer `newsletterFormId`, `copyrightText`, `columns`, `legalLinks`) preserved with `⚠️ Legacy field — populated by STATIC-2 reseed but no longer rendered. Will be removed in a future cleanup phase.` description markers for STATIC-1 render regression safety. Site Zod: read-model types co-located with queries at `site/src/lib/sanity/queries/{navigation,footer}.ts` (extended in place with `nullable.optional` on every new field per TB18 read-model tolerance; reference unions; pill-style + dropdownType enums; type-aware icon `select()` projection in GROQ per DELTA-7: service → null icon, technology → techLogo). Brief assumed Zod types should live in `site/src/types/sanity/{globals,documents}/...` but those paths don't exist in the codebase — actual pattern is co-located queries. Service + technology Zod types deferred to TEMPLATE-SERVICE / TEMPLATE-TECHNOLOGY phases (Step 4 reseed writes via raw `@sanity/client.patch()`; site doesn't parse during STATIC-2). Studio deployed via `npx sanity deploy` (16.8s build, pinned `deployment.appId = d5ohi4btklbv9gr4ew7da04j` so no prompt). Pre-deploy backup created at `audit-output/static-2/pre-reseed-backup.tar.gz` (943K, 422 docs across 53 doc types, `--no-drafts --no-assets`). Studio verification manually confirmed by Jake post-deploy: all new field groups render in Studio forms (navigation 3 mega-menus + footer 5 new groups + service/technology tagline with description). Screenshots deferred to phase close (Sanity SSO auth blocker; manual verification = the actual gate).

- **(no commit)** Step 3 — Studio data backup verification. Pre-existing Step 2.7 backup verified: file integrity confirmed via 2nd-doc extraction (service `iOS Developers` parses cleanly, `tagline` absent — correct pre-STATIC-2 rollback target). 422 docs / 53 doc types: 101 technology + 23 service + 74 blogPost + 17 customerStory + 32 video + 30 compareBlog + 28 teamMember + 22 tag + ... Restore command documented at `audit-output/static-2/restore-instructions.md`: `cd studio && npx sanity dataset import ../audit-output/static-2/pre-reseed-backup.tar.gz production --replace` (rollback overwrites data, NOT schema — schema rollback requires `git revert 26b06f0` + `sanity deploy`).

- **`0ee2548` feat(static): STATIC-2 Step 4, seed globals + tagline patches.** 4 files. `scripts/static/seed-globals-v2.ts` (~700 lines) reads 5 audit JSON inputs + asset files, resolves references by slug (fail-loudly on misses — all 25 resolved: 19 service+technology items via mega-menu URL → slug → `_id`; 3 customerStory by Decision A; 3 blogPost by Decision B), patches `tagline` on matched docs via `.patch().set({tagline})` (19 patched, 1 skipped — empty captured tagline), uploads 4 HIW inline images via `sanityWriteClient.assets.upload()` (2 net new assets — 2 deduped by Sanity content-hash; Sanity-idempotent), `createOrReplace` navigation + footer with v2 structure + legacy fields preserved (regression-safety). Locked decisions threaded: Decision A (3 hand-curated customerStory refs — Salmon Software / Willo® / Event Connections — exact-slug match, fail-loudly), Decision B (3 hand-curated blogPost refs spanning `/nearshoring-offshoring/`, `/hiring-tips/`, `/scaling-teams/` namespaces per DELTA-D), Decision C (footer primary CTA = "Book A Call" → `/book-a-call` per DELTA-A live-capture; brief's "Start building your team" superseded). DELTA-6 (`/compare` → `/alternatives` rewrite at the link.url layer for both new sections + legacy columns) confirmed in post-write GROQ verify. Footer `copyrightText` sanitized via `sanitizeCopyright()` (audit regex over-grabbed trailing junk: `"...All rights reserved.General TermsPrivacy PolicySitemapRegionUnited StatesUnited Kingdom"` → `"© {year} Cloud Employee. All rights reserved."`). Author-voice rule preserved (`normalize()` strips em/en dashes, applied to every string written). 1 Zod query bug surfaced + fixed in same commit: `featuredStories[]->{ "headline": coalesce(customerStoryTitle, companyName) }` — initial assumption used non-existent `headline` field. Tagline samples: Software Engineers → "Scalable product-builders on demand", Fractional CTOs → "Startup-savvy technical leadership", TypeScript Developers → "Typed safety meets modern JavaScript". Post-write GROQ verify: 25 references resolve (0 broken), all new fields populated, legacy fields preserved, `/alternatives` present + `/compare` absent. 1 known data-quality issue: HIW bottomPanel image is the live black-arrow.png affordance (capture heuristic picked wrong image during Step 1) — uploaded faithful to audit; Seb edits in Studio when convenient. Customer-2 audit refinement candidate filed.

- **(this commit)** Step 5 — Cross-cutting verification + phase close. Site `npm run build` passes (after 2 GROQ projection fixes: the `featuredStories.headline` coalesce fix from Step 4, and a 2nd fix here — drop explicit `hotspot, crop` from image projections because customerStory.companyLogo asset returns `hotspot: null` / `crop: null` from GROQ when not set on the upload, which broke the Zod parse against the strict `SanityImageSource`-compatible image schema; new projection `image{asset, alt}` lets Sanity decide field presence per asset). Studio + site tsc pass. STATIC-1 regression spot-check via local dev curl on `/blog` + `/services` + `/this-does-not-exist`: STATIC-1 Header renders against legacy `primaryLinks[].dropdownItems` + `ctaButton` reads + the new 6-link primaryLinks order ("Services / Our Clients / How It Works / Resources / Pricing / About Us") + Calendly CTA "Schedule a Call"; STATIC-1 Footer renders against legacy `columns[]` + `legalLinks[]` + `newsletterFormId` + `copyrightText` reads (4 columns: Full-time Staff Augmentation 8 + Technology 7 + About 5 + Resources 6); 404 page renders with `noindex`. `scripts/static/verify-static-2.ts` gate runs 6 checks all PASS. **Tech Debt #34 closed** (footer social icons schema gap — confirmed intentionally omitted from live site, no schema field needed; resolution: intentionally-omitted). UI_STRINGS audit at `audit-output/static-2/ui-strings-audit.md` documents the CMS-driven vs static split (default-to-CMS applied to "View all" / "Subscribe" labels; "Region:" prefix deferred to STATIC-3 UI_STRINGS).

### Locked decisions threaded through

- **DELTA-1 dropped mid-phase.** Brief v1 scoped `service.thumbnail` backfill from live mega-menu icons. Step 1 panel-shape probe confirmed live service mega-menu items are pure text divs (`<div class="h6-nav">name</div><div class="small-p grey">tagline</div>`) — NO icons. Reference screenshot (`docs/design/static-3-reference/mega-menu-services.png`) also confirms text-only items. Scope dropped at v1.1 brief revision; Services mega-menu renders text-only matching live site; `service.thumbnail` stays null on all 23 docs. Schema field preserved for future editorial use.
- **DELTA-2/4 Option B locked.** Sanity singletons `sourcingPage` / `embeddingPage` / `retentionPage` / `howItWorksPage` are empty stubs (no `heroImage` to dereference); HIW mega-menu uses inline `image` fields per `howItWorksMegaMenu.cards[].image` and `bottomPanel.image`. Singleton-deref (Option A) deferred to a future schema iteration if customer-2 has populated singletons.
- **DELTA-5: "Our Clients" → `/our-work`.** Audit-captured primary nav 2nd link points to `/our-work` (not `/customer-stories` as brief §5 guessed; not `/our-clients`). Live-faithful seed.
- **DELTA-6: `/alternatives` not `/compare`.** Live site footer captures `/compare` for "CE vs. Alternatives" but STATIC-1 footer seed already had this URL; STATIC-2 rewrites to `/alternatives` (HUB_CONFIG canonical, matches Webflow `hrefLang="x-default"` declaration). Both `/compare` + `/alternatives` return 200 on live site; canonical alignment matters for SEO link-equity consistency.
- **DELTA-7 type-aware icon projection.** Services mega-menu items resolve icon differently per type: `service → null` (no icons per DELTA-B), `technology → techLogo`. Implemented via GROQ `select(_type == 'service' => null, _type == 'technology' => techLogo, null)`.

### Customer-2 reusable IP

Filed to CAPABILITY_LOG (this commit):

1. **Playwright + tsx `__name` shim.** tsx/esbuild emits `__name(fn, "name")` for named arrows + function declarations inside `page.evaluate` callbacks; shim via `context.addInitScript(() => { window.__name = (fn) => fn })` on the BrowserContext before any page is created. One-line global no-op.
2. **Plan-mode requires DOM-level confirmation for image-related work.** Brief authoring inferred service mega-menu icons from screenshot visual; live DOM probe showed text-only items. Lesson: schema sections that depend on image presence need a DOM probe at plan-mode entry, not a screenshot inference.
3. **Discriminated icon shape (`material-font | asset`).** Schema models tagged-union via single object + `Rule.custom()` conditional validation. Caller reads `source` to pick the branch. Supports editorial flexibility (toggle between Material font + uploaded asset per item).
4. **Audit-driven brief refinement pattern.** Probe → drop assumptions → file deltas as JSON artifacts in `audit-output/<phase>/` → defer brief edits to phase close (v1 → v1.1 → v1.2). Keeps code execution unblocked while preserving the paper trail for phase-close brief updates.

### Tech debt

- **Closed:** #34 (footer social icons — intentionally omitted from live site).
- **Filed:** HIW bottomPanel image capture heuristic refinement (Customer-2 candidate — should skip UI-affordance assets like arrow/chevron PNGs when detecting hero-style content panel photos).
- **Carried:** legacy field cleanup (deferred to a future schema-cleanup phase per brief §1).

### Data state on close

- `migrations.status` = `content_complete` (unchanged)
- navigation global: 6 primaryLinks, 3 mega-menus populated, 19 mega-menu refs + 6 featuredPosts/featuredStories refs all resolve
- footer global: 5 new groups + 4 legacy fields populated
- 19 service + technology docs have `tagline`
- 422 → 424 image assets in Sanity (+2 net new HIW photos; 2 deduped by content-hash)

---

## MYGRATR-STATIC-1 — Site Chrome: Header, Footer, 16 Hubs, 404 (May 2026)

### Phase context

Foundational chrome phase. Header + Footer + 16 hub routes + 404 page shipped end-to-end against the existing `content_complete` Sanity dataset. Strategically reordered earlier in the queue than original plan (originally scheduled after TEMPLATE-CUSTOMER_STORY) because every template phase that follows renders inside this chrome — building templates against placeholder chrome means re-verifying everything twice. `migrations.status` stayed `content_complete` throughout — STATIC-1 is chrome work, not a state-machine transition. Sanity ops were write-once in Step 1 (seed) then strictly read-only for Steps 2-7.

Pattern-establishing for the chrome layer; subsequent UK-locale work and TEMPLATE-* phases inherit the patterns locked here. Brief was `docs/briefs/active/MYGRATR-STATIC-1-BRIEF.md` (move to archive at phase close).

### 7-step execution summary

**Step 1 — Sanity seed (commit `8fcd293`)**: 20 docs via `createOrReplace` using `SANITY_MIGRATION_WRITE_TOKEN`. 3 globals (`navigation`, `footer`, `siteSettings`) + 16 hub singletons (7 blog-hub + 4 resource-hub + 5 collection-index) + `notFoundPage`. 14 hubs pull `h1` + `metaDescription` from `audit-output/pages/<slug>/content.json`; `videosHub` + `staffAugmentationHub` use Jake-authored copy locked at plan-mode close (no Webflow source for those two). Visible `normalize()` helper at the top of each seed script strips em + en dashes from every string before write — enforces the persistent author-voice rule even on copy lifted from external sources.

**Step 1 follow-ups (commit `d488dc9`)**: `videosHub` + `staffAugmentationHub` `metaDescription` patched to 148/147 chars (cleared the 140-160 Studio publish-warning floor); `siteSettings.defaultOgImage` sourced from CE Webflow `og:image` (canonical homepage `usthumb.png`, 1470×796 PNG, valid signature), uploaded to Sanity as `image-33d40e77adf86c0867bc3b2e531421123295108e-1470x796-png`, patched. Reused not invented — no synthesis.

**Step 2 — 404 page (commit `d488dc9`)**: `site/src/app/not-found.tsx` renders the `notFoundPage` singleton via Next.js App Router convention. Explicit `metadata.robots = { index: false, follow: false }` alongside Next's auto-injected `noindex` meta. New `site/src/lib/url.ts` `toInternalHref()` strips known CE hosts → bare pathname; used immediately by the 404 CTA, reused by Footer + Header. Schema reconciliation done inline: the brief asked for `primaryCta.label/link` but the actual `ctaSection` schema is `buttonText`/`buttonLink` — seeded data already matched the schema, render used schema field names. One-line export added: `buttonVariants` from `site/src/components/ui/button/index.tsx` so `<Link>` can reuse Button styling without `<button>` inside `<a>` (invalid HTML).

**Step 3 — Site Footer (commit `028eab2`)**: 21-line SCAFFOLD-1 stub replaced. Server component reading the seeded `footer` global. 4 columns (Full-time Staff Augmentation 8 links / Technology 9 / About 6 / Resources 6 — counts match CE_SITE_TRUTH), HubSpot newsletter via the existing C6 `HubSpotFormEmbed` primitive (form GUID `deac2450-b51b-4630-b9e2-47017a13da15`, portal `22809822`), legal links + copyright with `{year}` token substituted at render time via `resolveCopyright()`. Brand-tertiary (navy `#223c6c`) bg, `text-text-on-dark` foreground, brand-secondary hover. DESIGN-1 A2 Link primitive intentionally drops nav-context tones — Footer uses `next/link` directly with footer-specific classes; same pattern Header adopts in Step 5.

**Step 4 — 16 hub routes (commit `fd65151`)**: Largest step. Shared infrastructure under `site/src/lib/hubs/`: `pagination.ts` (`parsePageParam` + `buildPagination` + `buildPageNumbers`, `notFound()` on invalid input or out-of-range), `render-hub.tsx` (hero + featured + paginated grid + prev/next + inline `<script type="application/ld+json">` × 2), `metadata.ts` (one `buildHubMetadata` for all 16 routes; OG image cascade: hub.openGraphImage → siteSettings.defaultOgImage → omit), `render-route.ts` (`resolveHubRoute` orchestrator). `site/src/lib/sanity/queries/hubs.ts` holds the `HUB_CONFIG` table — adding a hub is one row, no fetcher duplication. Each of the 16 hub `page.tsx` files is 23 lines. 3 fresh card components at `site/src/components/cards/{blog,resource,collection}-card.tsx` plus a `_shared.tsx` with excerpt + date + label helpers; **title-as-link semantics locked**: `<h3><Link>title</Link></h3>` single anchor, image + body decorative, category Tags rendered with no `href`. Proof-hub mid-gate ran on `/blog` (largest dataset, 74 posts → 7 pages); caught two issues before bulk-building the other 15 routes: ZodError on `featuredItems` (fixed by `.nullable()` on both `featuredArticles` and `featuredItems` since the union is shape-driven) + a color-contrast violation on disabled pagination placeholders (fixed by rendering nothing when there's no prev/next target). Sitemap extended with 16 default-locale + 16 UK hub entries × 3 hreflang alternates = 32 hub entries + 96 alternates (the UK entries were removed at Step 7 close — see Gap 1 below). One manual edit at `site/src/lib/redirects/regex-redirects.ts`: `/customer-stories/:slug*` and `/uk/customer-stories/:slug*` → `:slug+` because the zero-or-more form swallowed the bare hub root and redirected it to the legacy `/customer-story` singular path. Tech Debt #37 logs the generator-side fix.

**Step 5 — Header + /pricing redirect (commit `5096a2a`)**: 28-line SCAFFOLD-1 stub replaced. Server shell at `site/src/components/layout/nav.tsx` (skip link + logo + Container) + single client island `nav-client.tsx` for all interactive concerns. Desktop dropdowns are **hand-built** using the WAI-ARIA Disclosure pattern, NOT Radix DropdownMenu — Radix uses `role=menu/menuitem` semantics for application commands, semantically wrong for site navigation. Mobile drawer uses **Radix Dialog** for its proven focus-trap + scroll-lock + Escape plumbing. Locale switcher is pathname-aware via `usePathname()`. Calendly CTA opens the canonical CE intro popup URL `https://calendly.com/d/cwwf-6k5-2qy/intro-call-cloud-employee` (provenance: `audit-output/pages/contact/content.json` — same URL the `/contact` page embeds). Click behaviour: trigger always opens (Escape / click-outside / 150ms hover-leave close) — avoids the mouseenter-then-click toggle race. `/pricing → /services` 308 added to `next.config.ts` `lockedRules` (locked Open Decision #1). **Two latent Tech Debt #22 bridge fixes pulled forward**: `site/src/lib/url.ts` and `site/src/components/ui/hubspot-form-embed/index.tsx` swapped `import { env }` for direct `process.env.NEXT_PUBLIC_*` reads (`env.ts` validates `SANITY_API_READ_TOKEN` as `z.string().min(1)`, which crashes client hydration because that secret is stripped from the client bundle). Bug was latent since Step 3 — invisible because Steps 1-4 didn't require working client hydration; Step 5 needed it for dropdowns and drawer, surfaced the issue. Icon set fallback: sprite has no `chevron-down` or `x`; used `chevron-right` with CSS rotation + `close` for drawer dismiss.

**Step 6 — Cross-cutting verification (commit `bf40f9a`)**: Two new probe scripts under `scripts/static/`: `sweep-routes.ts` (Playwright across 11 representative URLs, console-error capture, banner + footer + #main + skip-link assertion) and `validate-json-ld.ts` (JSDOM-parses `<script type="application/ld+json">` on `/services`, a real blog post, and the 404; confirms expected schema.org types). axe-core sweep zero violations across 6 routes including TEMPLATE-BLOG. Lighthouse desktop on `/blog` + `/services` + a blog post (404 refused by Lighthouse — non-200): Perf 82-99 ✅, A11y 95-96 → 96-100 after a heading-order fix (collection hubs lack `topicsHeader`, so renderHub now emits a sr-only `<h2>` bridging `<h1>` and card `<h3>`), SEO 66-69 (single failing audit: `is-crawlable`, env-gated `robots.txt Disallow:/` in non-prod, flips to `Allow:/` and 100 in prod), Best Practices 50-54 (all Tech Debt #29-#32 — Clara widget contrast, third-party cookies, LinkedIn deprecated APIs, third-party console 404s — deferred to SCAFFOLD-AUDIT). 4 routes wrapped in `<main id="main">` so the skip-link target exists everywhere (`/`, `/uk`, default + UK TEMPLATE-BLOG). 19 chrome strings converted to UI_STRINGS keys (49 keys total at `tools/eslint/ui-strings.json`; STATIC-1 jsx-no-literals lint errors went 18 → 0). 2 SCAFFOLD-1 placeholders had em dashes scrubbed.

**Step 7 — Phase close (this commit)**: Gap 1 fix in `site/src/app/sitemap.ts` — 16 `/uk/<hub>` entries dropped along with all hreflang alternates on hub URLs. Sitemap 182 → 166 entries (2 static + 16 default-locale hub + 148 blog post). `scripts/static/verify-static-1.ts` ships as the single-command phase-close gate — re-runs every check from Steps 1-6 and exits 0 on full pass. Context-file updates per Tier 3 discipline. Final commit pushed to `origin/feat/design-1`.

### Files shipped (counts per category)

| Category | Count | Where |
|---|---|---|
| New scripts | 7 | `scripts/static/seed-globals.ts`, `seed-hubs.ts`, `patch-hub-metadescriptions.ts`, `seed-default-og-image.ts`, `axe-not-found.ts`, `axe-hub.ts`, `probe-nav-interactive.ts`, `sweep-routes.ts`, `validate-json-ld.ts`, `verify-static-1.ts` (10 total; 3 npm script entries added) |
| Replaced stubs | 2 | `site/src/components/layout/nav.tsx`, `site/src/components/layout/footer.tsx` |
| New hub helpers | 4 | `site/src/lib/hubs/pagination.ts`, `render-hub.tsx`, `metadata.ts`, `render-route.ts` |
| New Sanity queries | 4 | `site/src/lib/sanity/queries/{navigation,footer,hubs,not-found-page}.ts` |
| New URL helper | 1 | `site/src/lib/url.ts` (`toInternalHref()`) |
| New cards | 4 | `site/src/components/cards/{blog-card,resource-card,collection-card,_shared}.tsx` |
| New routes | 17 | 16 hub `page.tsx` + 1 `not-found.tsx` |
| Modified routes | 4 | `app/page.tsx`, `app/uk/page.tsx`, `app/[category]/[slug]/page.tsx`, `app/uk/[category]/[slug]/page.tsx` (Step 6 `<main id="main">` wraps) |
| Modified design system | 2 | `site/src/components/ui/button/index.tsx` (1-line `export buttonVariants`), `site/src/components/ui/hubspot-form-embed/index.tsx` (Tech Debt #22 bridge) |
| Modified config | 2 | `site/next.config.ts` (/pricing redirect), `site/src/app/sitemap.ts` (Step 4 add, Step 7 UK drop) |
| Modified redirect tables | 1 | `site/src/lib/redirects/regex-redirects.ts` (2 manual `:slug+` edits; see Tech Debt #37) |
| UI_STRINGS additions | 19 keys | `tools/eslint/ui-strings.json` 30 → 49 keys; `site/src/lib/ui-strings.ts` regenerated |
| Persistent memory | 1 | `feedback_no_em_dashes.md` (Jake-locked author-voice rule, persistent across phases) |

### Locked decisions

1. **Embedding relabel**: CE source has two primary nav links both labelled "How It Works"; one to `/embedding` is relabelled to "Embedding". Zero URL change, zero SEO impact.
2. **2 dropdowns not 3**: brief assumed Services + How It Works + Resources dropdowns; actual CE source has only Services (19 items) + Resources (6 items, mirroring footer column 4 per Open Decision #2). "How It Works" is a flat link.
3. **Hub URL pattern `/<category>`** not `/blog/<category>` (Amendment #1). Matches schema `defineBlogHub({ route: '/staff-augmentation' })` and Webflow audit-output URL structure.
4. **`/pricing → /services` 308** in `lockedRules`. `/pricing` has no schema or singleton; CE source has the link in nav + footer; cleanest fix until a dedicated `pricingPage` schema-extension cycle ships (Open Decision #1).
5. **Sort orders** per Amendment #3 table (`HUB_CONFIG.childSort`): blog & compare by `date desc`; service/technology/customerStory/review by `order asc`; tool/download by `featured desc, name asc`; event by `dateTime desc`. `technology` filters `listItemOnly != true`. `download` filters `comingSoon != true`.
6. **Title-as-link card semantics**: `<h3><Link>title</Link></h3>` single anchor per card. Image and body are decorative-clickable via card-level hover styling but NOT separately linked. Tags use decorative `<span>` (no href). No nested anchors. No JS-driven whole-card click.
7. **Pagination URL convention**: `?page=N` search param (not `/page/N` route segment). Page 1 canonical has no suffix; page 2+ self-canonical includes `?page=N`.
8. **URL normalization**: every Sanity-stored fully-qualified CE URL passes through `toInternalHref()` from `@/lib/url` before reaching `next/link` so internal navs stay client-side. Same helper used by Footer, Header dropdowns + drawer, and card components.
9. **Desktop dropdowns hand-built** (WAI-ARIA Disclosure pattern with `aria-haspopup="true"` + `aria-expanded` + `aria-controls`), NOT Radix DropdownMenu. Mobile drawer uses Radix Dialog. Rationale: Radix DropdownMenu uses `role=menu/menuitem` semantics for application commands; site navigation needs proper `<nav><ul><li><a>` structure.
10. **UK sitemap learning** (Step 7 Gap 1): future briefs that seed multi-locale sitemap entries must first confirm routes exist for every locale being seeded. Step 4 brief seeded 32 hub entries (default + UK) but only built default-locale routes; the 16 UK URLs all 404'd until Step 7 dropped them from sitemap.

### Gates passed

| Step | Gate | Result |
|---|---|---|
| 1 | 20 Sanity docs seeded with content; zero em/en dash residue across all seeded text | PASS |
| 2 | `/this-does-not-exist` returns HTTP 404, renders title + heroDescription + CTA, `<meta name="robots" content="noindex">` present; axe-core 0 violations | PASS |
| 3 | Footer: 4 columns with correct headings and link counts (8/9/6/6); `{year}` token substituted; HubSpot form GUID + script + mount point present; role=contentinfo + 5 ARIA labels; axe-core 0 violations | PASS |
| 4 | 16/16 hubs HTTP 200; /our-work, /alternatives 308; ?page=99/abc/-1 → 404; ?page=2 → 200; /blog has 7 pages; /technology applies listItemOnly filter; 16 CollectionPage + 16 BreadcrumbList JSON-LD; 32 sitemap entries (later 16 at Step 7); axe-core 0 violations on 4 sampled hubs | PASS |
| 5 | /pricing 308 → /services; Header on every page; 7 primary links rendered; Services 19 + Resources 6 dropdown items; CTA + locale switcher; mobile hamburger + drawer (Enter opens, Escape closes); skip link present; axe-core 0 violations on /, /blog, /services | PASS |
| 6 | 11-route sweep zero console errors; axe-core 0 violations on 6 routes incl. TEMPLATE-BLOG; sitemap shape correct; JSON-LD shape valid; Lighthouse Perf ≥75, A11y ≥96, SEO 100-in-prod, BP deferred; build + tsc clean; STATIC-1 lint errors 18 → 0 | PASS |
| 7 (close) | `verify-static-1.ts` runs all of the above as a single script; sitemap = 166 entries (16 default-locale hub, 0 UK, 0 hreflang); all 6 checks pass | PASS |

### Deltas vs brief

- **Brief §2.3 / Amendment #1 — hub URL pattern**: brief assumed `/blog/<category>` for the 6 blog category hubs; actual schema + Webflow source URLs use `/<category>`. Corrected at plan-mode before code; documented inline in `HUB_CONFIG`.
- **Brief §2.1 / Amendment #5 — dropdown count**: brief assumed 3 dropdowns; CE source has 2 (Services + Resources). Flat "How It Works" + "Embedding" links.
- **Brief §6.5 / Amendment #2 — 404 schema shape**: brief assumed `{ title, description, ctaLabel, ctaLink }`; actual `defineStaticPage` factory uses `sections[]` with at least one `ctaSection`. Seeded data matches the schema.
- **Brief §2.1 / Amendment #6 — hub schema richness**: hubs additionally have `eyebrow` + `featuredArticles`/`featuredItems` + `introContent` + `topicsHeader` (blog only). Seeded `eyebrow` + `topicsHeader` where natural; `featuredArticles`/`featuredItems` + `introContent` left empty for Seb to curate in Studio.
- **Open Decision #1 — /pricing**: 301 to /services. Documented inline.
- **Open Decision #2 — Resources dropdown items**: mirror footer column 4. Documented in seed script.
- **Brief §6 Gap 1 (Step 7 close) — UK hub sitemap entries dropped**: Step 4 brief seeded both locales but only built default-locale routes. See "UK sitemap learning" in locked decisions and Tech Debt #38.

### Tech debt added

- **#34** Footer social icons schema gap (QA-1).
- **#35** `siteSettings.defaultOgImage` seeded from CE Webflow `usthumb.png` — curation note, not a real debt (Seb can replace via Studio).
- **#36** 10 pre-existing DESIGN-1 lint errors surfaced by Step 6 build sanity (SCAFFOLD-AUDIT batch).
- **#37** Regex-redirects generator emits `:slug*` for every `(.*)` translation; manual `:slug+` edits at `regex-redirects.ts` for `/customer-stories` and `/uk/customer-stories` are fragile across `npm run redirects:extract` regeneration. Fix at generator level (SCAFFOLD-AUDIT batch).
- **#38** UK hub routes deferred (see Gap 1 + learning above).

### Brief-vs-reality discipline (Pattern 13 sub-examples observed)

- BvR (plan-mode): brief assumed `/blog/<category>` hub URLs but the schema route was `/<category>` — caught at plan mode by reading the actual schema factory, not the brief description.
- BvR (Step 4 mid-gate): Zod schema for hub singleton assumed `featuredArticles` would only exist on blog hubs; GROQ projects both `featuredArticles` and `featuredItems` so the non-applicable field comes back as `null`, not missing. Fixed at mid-gate before bulk-building 15 more routes.
- BvR (Step 4 mid-gate): color-contrast violation on disabled prev/next pagination placeholders. axe-core flagged a span using `text-text-default/40` (40% opacity) that was intentionally aria-hidden. Fixed by not rendering disabled placeholders at all.
- BvR (Step 5): Playwright `.click()` on the hamburger button didn't open the Radix Dialog drawer because Radix uses `onPointerDown` which Playwright's synthetic pointer events don't always dispatch. Keyboard Enter worked. Real-browser mouse clicks work normally. Switched the interactive probe to keyboard-driven assertions, documented inline.
- BvR (Step 5): The brief's `primaryCta.label`/`primaryCta.link` field names didn't match the actual `ctaSection` schema (`buttonText`/`buttonLink`); seeded data already matched the schema, so the render used schema field names directly.
- BvR (Step 5): latent Tech Debt #22 client-bundle env validation crash. Invisible since Step 3 (Footer's HubSpotFormEmbed imported `env.ts` which validates `SANITY_API_READ_TOKEN` as `z.string().min(1)`, but the secret is stripped from the client bundle). Steps 1-4 didn't require working client hydration so the ZodError was silent. Surfaced when Step 5 needed working dropdowns + drawer.
- BvR (Step 6): heading-order skip from `<h1>` to card `<h3>` on collection hubs that don't have `topicsHeader`. Lighthouse caught it; axe-core didn't.
- BvR (Step 6 → Step 7 — Gap 1): sitemap had 32 hub entries but only 16 routes existed. Caught by the 11-route sweep in Step 6. Locked as the UK sitemap learning above.

### Notes for the next phase

- The Template Phase Runbook (next session) should codify the proof-hub-mid-gate pattern from Step 4 as the default for any phase that bulk-generates more than 3-4 similar routes / components. Building 1, verifying, then bulk-building the rest caught two issues that would have propagated × 15 had Step 4 just generated all 16 hub routes up front.
- The "tech debt pulled forward" pattern (env split bridge fixes from Tech Debt #22) is worth noting: latent issues from earlier phases that don't visibly break anything can surface unexpectedly in a later phase that exercises a different code path. Tier 3 verification (sweep all routes + capture console + test interactive contracts) catches them.
- `verify-static-1.ts` is the template for future phase-close gates. Self-contained TypeScript script consuming the dev server, runs every previously-verified check, exits 0 on success — single command to run before committing phase close.

---

## MYGRATR-CONTENT-1E — Webflow w-embed Recovery (May 2026)

### Phase context

Post-phase content patch resolving Tech Debt #25 (logged at TEMPLATE-BLOG
HALT 2/3 close). CONTENT-1C migration used `@sanity/block-tools.htmlToBlocks`,
which flattens content inside Webflow's RichText custom-embed wrappers; this
phase recovers the lost content as structured Sanity types. `migrations.status`
stayed `content_complete` throughout (post-phase patch invariant — Sanity-side
data fix only; no state-machine transition). Pattern-applying, not
pattern-establishing — reuses CONTENT-1A → CONTENT-1D-CLEANUP migrator
infrastructure.

### Scope variance — planned vs actual

| Aspect | Plan estimate | Actual | Ratio |
|---|---|---|---|
| Affected docs | 10–30 | 88 (sweep) / 79 (patched) | ~3–8× |
| Embeds | not estimated | 167 (sweep) / 149 (recovered) | — |
| Doc types | 5 in scope | 3 carried embeds (blogPost, compareBlog, customerStory) — technology + service confirmed zero | narrower |
| Time | 7.5h | ~10–12h | ~1.4× |

The 3-8× doc-count overshoot did NOT translate proportionally to
time because:
- Two of the five doc types (technology, service) were zero-embed,
  reducing field-level migrator complexity.
- All embeds concentrated in a single Webflow field per type
  (`content` / `hiringNeedsTable`) — no per-field branching needed.
- 9 of 88 sweep docs were deduped-to-canonical (CONTENT-1C dedup
  invariant), reducing patch count from 88 → 79 actually-patched.

### Commit chain

| Commit | Description |
|---|---|
| _t.b.d._ | `feat(scripts): CONTENT-1E w-embed sweep probe` |
| _t.b.d._ | `feat(schema): CONTENT-1E videoEmbed + table portable-text types` |
| _t.b.d._ | `feat(content): CONTENT-1E w-embed recovery migrator` |
| _t.b.d._ | `feat(site): CONTENT-1E PortableText videoEmbed + table renderers + verifier + context sync` |

### Critical selector correction — Checkpoint 1 discovery

The plan (CONTENT-1E_OPTIMIZED_MOON.md), CLAUDE.md Tech Debt #25, and
the original TEMPLATE-BLOG HALT 3 diagnostic at
`audit-output/template-blog/rich-text-gap-analysis.md` all asserted the
embed wrapper was `<div class="w-embed">`. **This was wrong.**

The Webflow RichText API returns `<div data-rt-embed-type='true'>`
(single-quote form) as the wrapper attribute. The `w-embed` CSS class
only exists on the published Webflow site (post-render); CMS HTML never
carries it. Checkpoint 1's probe run against this selector found ZERO
table embeds across the entire corpus — surfacing the misdiagnosis
before any schema or migrator work landed. Probe re-authored with the
corrected selector immediately surfaced the actual 167 embeds.

This correction propagated through every subsequent artifact: deserializer
rule selector, sweep inventory, migrator design, verifier checks, and
CONVENTIONS.md.

### Architecture decisions (locked at planning, all held through execution)

1. **Option B — full content[] rebuild via `.set({ content })`.** Migrator
   rebuilds the entire PortableText array per doc, not field-level merge.
   Constraint: manual Studio edits to `content[]` will be overwritten on
   re-run; locked in new CONVENTIONS section "Post-Phase Content Mirror
   Constraint".
2. **Option α — `brand-tertiary` token for table header bg.** No new
   design tokens; renderer uses existing CE navy (`#223c6c`).
3. **Approach B — LinkedIn handled by `parseVideoUrl` extension.**
   Schema stays as planned (`url` + `caption` only); provider-detection
   lives in the renderer. No separate `iframeEmbed` block type. LinkedIn
   embeds render via VideoEmbed eager mode (no autoplay — LinkedIn doesn't
   support autoplay query).

### Files created

- `scripts/content/probe-w-embed-sweep.ts` — Step 1 read-only sweep
  probe; emits `audit-output/content-1e/w-embed-sweep-inventory.json`
  with per-embed classification (table / iframe / script / style-only /
  other).
- `scripts/content/migrate-w-embed-recovery.ts` — Step 4 migrator with
  HARD GATE comment + dedup-aware pre-flight (`classifySweepTargets()`
  → `{existing, dedupedToCanonical, orphan}`) + halt-on-first-failure
  per-doc guards + pre-patch snapshot to
  `audit-output/content-1e/pre-patch-snapshots/`.
- `scripts/content/verify-content-1e.ts` + `run-verify-content-1e.ts` —
  Step 6 verifier (5 hard-gate checks: schema round-trip, _type
  frequencies, migrations.status invariant, w-embed-recovery row exists
  + healthy, no regression on prior phases).
- `audit-output/content-1e/w-embed-sweep-inventory.json` — sweep
  inventory (gitignored).
- `audit-output/content-1e/pre-patch-snapshots/*.json` — 79 per-doc
  rollback snapshots (gitignored).
- `audit-output/content-1e/render-coverage-check.md` — Checkpoint 4
  variation-coverage URL list (gitignored).

### Files modified

- `studio/schemas/objects/portable-text.ts` (+2 `defineArrayMember`
  entries: `videoEmbed` + `table`; deployed to production Studio at
  Checkpoint 2 via `sanity deploy`).
- `src/lib/content/migration-helpers.ts` (block-tools `defaultSchema`
  registration + 3 new deserializer rule branches; `webflowId` opt-param
  on `toPortableText`; deterministic `_key` counters).
- `site/src/components/ui/video-embed/index.tsx` (`parseVideoUrl`
  extended for LinkedIn; `buildEmbedUrl` branches per provider;
  `LINKEDIN_ALLOW` constant; LinkedIn iframes ignore autoplay).
- `site/src/components/ui/portable-text/index.tsx` (+2 type handlers:
  videoEmbed eager-mode iframe; table with `bold-col-one` →
  `boldFirstColumn` + responsive horizontal-scroll wrapper +
  brand-tertiary header bg).
- `CLAUDE.md` (Tech Debt #25 → RESOLVED + selector-correction note +
  phase table row).
- `CONVENTIONS.md` (new section "Post-Phase Content Mirror Constraint"
  + Section 4 phase row).
- `CHANGELOG.md` (top entry).
- `docs/FEATURE_MAP.md` (CONTENT-1E entry).
- `docs/context/REGISTRY.md` (probe, migrator, verifier, schema types).
- `docs/CAPABILITY_LOG.md` (Pattern 13 Layer 4 6th sub-example).

### Sanity-side production state (post-migrator)

- 142 `table` blocks across blogPost+compareBlog `content` and
  customerStory `hiringNeedsTable`.
- 7 `videoEmbed` blocks across blogPost `content`.
- 46 of ~74 blogPosts carry ≥1 table; 4 carry ≥1 videoEmbed.
- 27 of 30 compareBlogs carry ≥1 table; 0 carry videoEmbed.
- 3 of 18 customerStories carry ≥1 table (`hiringNeedsTable` field).
- Sweep totals (167 = 153 tables + 14 iframes) minus deduped
  (18 = 11 table + 7 video, all from 9 multi-collection blog mirrors) =
  149 expected = 149 actual. ✅

### Dedup discovery during migrator run

First-run halt on `blogPost-68f668fffa9f57187c396b32` ("Sanity doc not
found") surfaced 9 multi-collection blog mirrors that CONTENT-1C
deduplicated against slug-canonical siblings — these IDs exist in
Webflow but were never created in Sanity. The migrator was extended
with `classifySweepTargets()` pre-flight:

- **existing** (79): patch normally
- **dedupedToCanonical** (9): canonical sibling exists at same slug;
  skip with audit log, content covered by canonical's own patch
- **orphan** (0): hard halt (would indicate true content loss)

All 9 deduped mirrors share prefix `68f668...` (the staff-augmentation
sub-collection); they're byte-identical copies of the canonical content
in `blogs-and-guides`. CONTENT-1C dedup is consistent and correct.

### Pattern 13 Layer 4 — 6th sub-example

Plan locked from prior-phase diagnostics may carry forward incorrect
technical assumptions. Checkpoint 1 probe execution is the validation
layer that surfaces these before they propagate downstream.

The 6th sub-example extends the TEMPLATE-BLOG 5-example matrix
(status≠hydration · diagnosis≠Pattern13-exempt · HTTP200≠script-executed ·
probes-need-probing · build-time-env). Documented in CAPABILITY_LOG.md.

### Tech Debt

- Tech Debt #25 RESOLVED (this phase).
- No new tech debt entries introduced.

### Verifier hard-gate checks (verify-content-1e.ts)

1. Schema deployed — round-trip a `videoEmbed` block (create/read/delete
   smoke-test doc; throws if Studio rejects unknown type).
2. Sitewide `_type` frequencies match sweep expectations (deduped-aware
   arithmetic).
3. `migrations.status` unchanged at `content_complete` (post-phase patch
   invariant).
4. `content_migrations` row exists for `w-embed-recovery` with
   `status='complete'` + `parity_score >= 95`.
5. No regression on CONTENT-1A → CONTENT-1D-CLEANUP rows (floor check:
   ≥ 36 prior rows + all at `status='complete'`).

---

## MYGRATR-TEMPLATE-BLOG — Pattern-establishing first detail-page template (May 2026)

### Phase context

First TEMPLATE-* phase in the MYGRATR pipeline; pattern-establishing
for the 12 subsequent template types (TEAM_MEMBER, REVIEW, VIDEO,
SERVICE, TECHNOLOGY, COMPARE, CUSTOMER_STORY, TOOL, BOOK_A_CALL,
DOWNLOAD, STATIC, HOME). `migrations.status` unchanged at
`content_complete` — TEMPLATE-* phases do not transition state
machine; that resumes at QA-1 / LAUNCH. Brief locked at v1.3 across
internal + external CMA passes prior to execution. 3 HALTs structured:
recon/probes (HALT 1), visual integration (HALT 2), SEO + close
(HALT 3).

### Commit chain

| Commit | HALT | Description |
|--------|------|-------------|
| `bed2972` | HALT 1 | recon, probes (10 incl. video-references variants), GROQ + Zod modules, route plumbing, debug-shell template |
| `6073865` | HALT 2 | Finsweet Attributes `type="module"` — BvR #45 (SCAFFOLD-1 escape surfaced) |
| `c454d77` | HALT 2 | E1 Image `'use client'` + inline `NEXT_PUBLIC` env reads + `@sanity/image-url` named import — BvR #37 + #38 + #39 + #44 |
| `930c2a3` | HALT 2 | B3 PortableText body→lead + inline image rounded-lg — BvR #42 + #43 |
| `b96a394` | HALT 2 | Visual integration [Path A] — 7 files, +591/-34 |
| pending #1 | HALT 3 | `serializeJsonLd` helper + per-blog JSON-LD object builders |
| pending #2 | HALT 3 | Emit BlogPosting + BreadcrumbList + (conditional) FAQPage on both locales |
| pending #3 | HALT 3 | sitemap.ts blog-row expansion — 74 docs × 2 locales = 148 entries |
| pending #4 | HALT 3 | B3 PortableText h5/h6 handlers — BvR #46 |
| pending #5 | HALT 3 | HALT 3 close — link-text fixes + context-files sync + brief archive |

### Files created

| Path | Role |
|------|------|
| `site/src/app/[category]/[slug]/page.tsx` | Default-locale route — `generateStaticParams` + `generateMetadata` + page component |
| `site/src/app/uk/[category]/[slug]/page.tsx` | UK-locale mirror route |
| `site/src/lib/sanity/queries/blog-post.ts` | GROQ queries + Zod read-model parsing helpers |
| `site/src/types/sanity/documents/blog-post.ts` | Read-model Zod schemas for BlogPost / BlogPostMeta / RelatedBlogPost / BlogPostAuthor / BlogPostCategory / BlogPostTag |
| `site/src/types/sanity/shared.ts` | Shared read-model Zod (SanityImage, PortableText, FaqItem) |
| `site/src/components/templates/blog/index.tsx` | Blog post template — 277 lines, all primitives composed |
| `site/src/components/templates/blog/json-ld.tsx` | JSON-LD builders for BlogPosting + BreadcrumbList + FAQPage |
| `site/src/components/shared/breadcrumbs.tsx` | Shared breadcrumbs primitive (reusable for other templates) |
| `site/src/components/ui/_utils/parse-sanity-image-ref.ts` | Image-ref dimensions helper (extracted for server-component consumers) |
| `site/src/lib/seo/serialize-json-ld.ts` | XSS-safe JSON-LD serializer (shared helper for all templates) |
| `scripts/template-blog/probe-batch.ts` | Probe 0–10 orchestrator |
| `scripts/template-blog/capture-blogs.ts` | Probe 1b Playwright capture (live CE) |
| `scripts/template-blog/select-capture-targets.ts` | Probe 1b target selection |
| `scripts/template-blog/find-thumb-missing.ts` | Thumbnail audit |
| `scripts/template-blog/probe-content-block-types.ts` | _type frequency probe (surfaced video gap, then table gap) |
| `scripts/template-blog/probe-video-references.ts` | Video block enumeration (Tech Debt #25 evidence) |
| `scripts/template-blog/probe-video-block-context.ts` | Video block context drill |
| `scripts/template-blog/probe-spot-check-urls.ts` | Variation-axis URL selection probe |
| `scripts/template-blog/probe-spot-check-corpus.ts` | Corpus-shape verification probe |
| `scripts/template-blog/probe-rich-text-gaps.ts` | Rich-text gap analysis (tables + h5/h6 latent) |
| `scripts/template-blog/probe-rich-text-doc-drill.ts` | Per-doc content[] drill |

### Files modified

| Path | Change |
|------|--------|
| `site/next.config.ts` | `images.qualities: [75, 80]` (Next 16 strict-listing requirement) — BvR #39 |
| `site/src/app/sitemap.ts` | `URL_BUILDERS` dispatch + blogPost path builder + Sanity fetch + 148 blog row emission |
| `site/src/components/ui/image/index.tsx` | `'use client'` + inline `NEXT_PUBLIC_*` env reads + `createImageUrlBuilder` named import + `parseSanityImageRef` extraction — BvR #37 + #44 + #38 |
| `site/src/components/ui/portable-text/index.tsx` | Inline-image `rounded-lg`, body `Text size="lead"`, listItem `text-body-lead`, h5/h6 handlers — BvR #42 + #43 + #46 |
| `site/src/components/third-party-scripts.tsx` | `type="module"` on Finsweet Attributes `<Script>` — BvR #45 (SCAFFOLD-1 escape) |
| `site/src/types/sanity/shared.ts` | `PortableTextSchema` narrowed to `TypedObject[]` for direct template handoff — BvR #40 |
| `tools/eslint/ui-strings.json` | `+blogPost.readArticle`, `+blogPost.viewOnLinkedin`, `-blogPost.readMoreLink` (descriptive-text fix per Lighthouse `link-text`) |
| `site/src/lib/ui-strings.ts` | Generated from above SoT |

### BvR ledger (Brief-vs-Reality findings — 10 surfaced; 1 reframed)

| # | Finding | Resolution |
|---|---------|------------|
| 37 | E1 Image hits Sanity-loader closure across RSC→client boundary | Marked `'use client'` + inline `NEXT_PUBLIC_*` env reads (env.ts would drag server-only validation into client bundle) |
| 38 | `parseSanityImageRef` needed by B3 PortableText (server component) but lives inside client-marked E1 | Extracted to `_utils/parse-sanity-image-ref.ts` (server-import-safe) |
| 39 | Next 16 requires explicit `images.qualities` listing | `[75, 80]` matching E1 default + Lighthouse-style q=75 |
| 40 | `PortableTextSchema` typed as `z.array(z.unknown())` forced `as unknown as` casts at template handoff | Narrowed inferred type to `TypedObject[]` via `as unknown as z.ZodType<TypedObject[]>` |
| 41 | layout.tsx Option A proposed for script-tag warning + reverted | Load-bearing zero — kept history clean; deferred SCAFFOLD-1 work; warning remains chronic (Tech Debt #23) |
| 42 | B3 PortableText inline image without rounded corners visually inconsistent with hero (rounded-lg) | Inline image wrapped in `overflow-hidden rounded-lg` container inside the `<figure>` |
| 43 | B3 PortableText body 16px too small vs CE live 18px lead body | Sitewide `<Text size="lead">` for `normal` style + `text-body-lead` on list items |
| 44 | `@sanity/image-url` default export deprecated (browser console warning on every page) | Switched to named export `createImageUrlBuilder` |
| 45 | Finsweet Attributes v2 ships as ESM; loaded via `<Script>` (classic script) throws `Cannot use import statement outside a module` | Added `type="module"` attribute (SCAFFOLD-1 escape — Webflow Finsweet v1→v2 contract change) |
| 46 | B3 PortableText handles `h2/h3/h4` + `blockquote`; corpus has 51 h5 + 18 h6 instances falling through to `unknownBlockStyle` | Added `h5`/`h6` handlers mapping to `<Heading as="h5"|"h6">` (both visually 24px per design-system Decision Q3) |
| 47 | (cancelled) `robots.txt` hardcoded sitewide-block — REFRAMED as test-methodology issue | robots.ts already env-driven correctly per F7 v1.5; Lighthouse-against-local needs `VERCEL_ENV=production npm run build` at BUILD time. Documented in `audit-output/template-blog/lighthouse-methodology.md`. Slot #47 reused for next genuine finding. |

### Tech Debt opened

| # | Source | Scope |
|---|--------|-------|
| 21 | HALT 2 / BvR #45 | Finsweet `@2` ESM contract change + cosmetic preload credentials-mode mismatch addendum (browser yellow warning post-fix) — review at SCAFFOLD-AUDIT |
| 22 | HALT 2 / BvR #37 | `env.ts` split into `env-client.ts` / `env-server.ts` for primitive-safe public-vars import (current inline-`process.env` reads in E1 Image are a bridge) |
| 23 | HALT 2 / BvR #41 | Script-tag warning chronic since SCAFFOLD-1 + Next 16 + React 19; investigate in SCAFFOLD-AUDIT |
| 24 | HALT 2 | Sitewide Header + Footer components (SCAFFOLD-1 shell gap; template renders without nav chrome) |
| 25 | HALT 2 + 3 | CONTENT-1E: Webflow w-embed recovery. Migration tool blind to `<div class="w-embed">` wrappers — confirmed loss patterns: videos (flattened/absent) + tables (flattened to single paragraph). Recovery requires re-scrape + `videoEmbed` + `table` schema types + B3 renderers. Sweep audit corpus for all `w-embed` shapes before designing schema additions. ~10–30 docs affected. Runs BEFORE TEMPLATE-CUSTOMER_STORY |
| 26 | HALT 2 | V1 per-page Finsweet modules (cmsfilter, modal, a11y) not currently loaded by Next.js scaffold — feature-parity gap for TECHNOLOGY/SERVICE/HOME filtering UX. Investigate at SCAFFOLD-AUDIT or pre-LAUNCH sweep |
| 27 | HALT 2 | Sanity image preload tuning (perf hint) — post-LAUNCH |
| 28 | HALT 3 BvR #46 | h5/h6 finding's surfacing context preserved for diagnostic trail — closed-on-commit at HALT 3 alongside the fix; reference `audit-output/template-blog/rich-text-gap-analysis.md` |
| 29 | HALT 3 Lighthouse | SCAFFOLD-AUDIT: Third-party script performance budget. Lighthouse Performance 79 (target 90) traced to 770ms TBT from sitewide third-party script load (GTM + GA4 + LinkedIn Insight + HubSpot + Hotjar + Facebook Pixel + Calendly + GSAP + Swiper + Finsweet). Fix: lazy-load + script audit + necessity review per template phase |
| 30 | HALT 3 Lighthouse | SCAFFOLD-AUDIT: Third-party cookie hygiene. 13 third-party cookies set sitewide from marketing pixels; Best Practices score impact. Review per CSP + consent management strategy at SCAFFOLD-AUDIT phase |
| 31 | HALT 3 Lighthouse | SCAFFOLD-AUDIT: ClaraChatBot widget WCAG AA contrast violation on chat-launcher pill (`cb-pill-text`, 2.51:1 vs 4.5:1 required). Vendor-side issue, surfaced sitewide. Options: CSS override (fragile, breaks on vendor updates), vendor support request, or widget replacement. Review in SCAFFOLD-AUDIT phase |
| 32 | HALT 3 Lighthouse | TEMPLATE-* image strategy: blog hero aspect-ratio mismatch. `thumbnailImage` source is 1200×628 (ratio 1.91:1, matches OG spec). Hero container forces `aspect-[16/9]` (ratio 1.78), resulting in clean object-cover crop but Lighthouse `image-aspect-ratio` audit warning (1-point Best Practices weight). Three resolution options documented in `audit-output/template-blog/lighthouse-checkpoint-c.md`. Defer to SCAFFOLD-AUDIT or a dedicated image-strategy review when TEMPLATE-* phase patterns reveal whether 16:9 should be enforced template-side or whether Sanity images should be re-cropped at source |

### Acceptance gate (per Brief §13)

- **§12.3 Tests 1–9: ALL PASS** (status codes 200/200/404/404/404 · canonical+3 hreflang · BlogPosting+BreadcrumbList+FAQPage JSON-LD · sitemap 132 staff-augmentation matches · Lighthouse SEO 100 + A11y 96)
- **Visual fidelity ≥ 90%** — Jake browser-verified on 3 sample URLs at HALT 2 review; Path A approved, Path B (v0.dev) not invoked
- **UI_STRINGS lint clean** — `npm run lint` passes; 25 keys in canonical SoT
- **Lighthouse §12.6** — SEO 100 (target ≥95, overshot by 5) · A11y 96 (target ≥95) · Performance 79 (Tech Debt #29) · Best Practices 54 (Tech Debt #30/#31/#32). Performance & BP gaps documented as SCAFFOLD-AUDIT scope, not optimization-attempted in this phase per Brief §13 #6
- **JSON-LD validation §12.4** — manual schema.org eyeball at HALT 3 Checkpoint A confirmed (BlogPosting required fields complete, entity-linking via `author.sameAs`, BreadcrumbList 3-level hierarchy with absolute URLs, FAQPage 6 questions with plaintext answers)

### Pattern 13 Layer 4 sharpening — 5 sub-examples surfaced this phase

1. **Status-code probes ≠ hydration probes** — curl-200 doesn't exercise React hydration (BvR #41 era)
2. **Diagnosis itself needs Pattern 13** — layout.tsx false-fix proposed, reverted at execution (BvR #41 reset)
3. **HTTP 200 ≠ script executed** — Finsweet ESM silent failure under classic script tag throws on parse but doesn't degrade response status (BvR #45)
4. **Diagnostic probes themselves need probing** — grep case-sensitivity false-positive on `hrefLang` vs `hreflang` almost halted §12.3 Test 6 (HALT 2 self-correction)
5. **Build-time-generated routes need build-time env vars** — Next.js `MetadataRoute.*` (robots.ts, sitemap.ts) bake env at `npm run build`, not at `npm run start`; Lighthouse false-fail at C2 until corrected. New CONVENTIONS entry locks the pattern

Collectively the load-bearing CAPABILITY_LOG entry for the phase.

### Browser fidelity sign-off (HALT 2)

Jake browser-verified all 3 sample URLs at ≥90% fidelity vs live CE:
- `/nearshoring-offshoring/7-benefits-of-outsourcing-web-development-for-startups` (complex variant — TL;DR + FAQ + author + inline images)
- `/managing-engineers/how-peer-forums-are-changing-remote-work-at-cloud-employee` (sparse variant — no TL;DR + no FAQ + null author + inline images)
- `/uk/nearshoring-offshoring/7-benefits-of-outsourcing-web-development-for-startups` (UK mirror)

Path A approved with video-deferral noted (Tech Debt #25). No Path B
(v0.dev) fallback invoked.

### Artifacts retained on disk

- `audit-output/template-blog/halt-1-summary.md` — HALT 1 close summary
- `audit-output/template-blog/halt-2-smoke.md` — HALT 2 close smoke report
- `audit-output/template-blog/halt-3-backlog.md` — HALT 3 entry-state backlog (created at HALT 2 close)
- `audit-output/template-blog/spot-check-urls.md` — variation-axis URL sampling for browser review
- `audit-output/template-blog/rich-text-gap-analysis.md` — table + h5/h6 + video gap probe report
- `audit-output/template-blog/lighthouse-sample.json` — pre-fix Lighthouse run (SEO 61)
- `audit-output/template-blog/lighthouse-sample-vercel-env.json` — post-fix Lighthouse run (SEO 100)
- `audit-output/template-blog/lighthouse-checkpoint-c.md` — pre-fix diagnosis snapshot (Tech Debt #32 references it)
- `audit-output/template-blog/lighthouse-methodology.md` — `VERCEL_ENV` at build-time testing-methodology note
- `audit-output/template-blog/probe-*.md` — Probes 0 through 10 artifacts
- Brief archived to `docs/briefs/archive/MYGRATR-TEMPLATE-BLOG_BRIEF_v1.3.md`

### Data state at close

- 74 blogPost docs in Sanity production (unchanged — TEMPLATE-* phases do not touch CMS data)
- 158 static pages built (74 default-locale + 74 UK-mirror blog + 1 default home + 1 UK home + 8 demo/storybook supporting routes)
- Sitemap emits 150 entries (1 default home + 1 UK home + 74 blog × 2 locales = 150)
- 0 schema migrations applied
- `migrations.status` unchanged at `content_complete`

---

## MYGRATR-DESIGN-1 Brief B Step 8 — Visual Editing wiring + draft-mode route hardening (May 2026)

### Phase context

Step-8-milestone partial entry on an open DESIGN-1 phase. `migrations.status`
remained `content_complete` throughout — DESIGN-1 explicitly does not
transition state per brief §0 (no `design_running` / `design_complete` in
`pipeline/state-machine.ts`; DESIGN-1 operates against the
`content_complete` baseline). Brief B v2.2 split DESIGN-1 Step 6 + Step 8
across 3 HALTs: HALT 1 (Step 6 — UI_STRINGS lint rule + canonical SoT,
closed at `5726e38` — see prior entry), HALT 2 (Step 8 §8.1–§8.6
infrastructure), HALT 3 (Step 8 §8.7 smoke test + §8.8 CONVENTIONS
Entries 2-5 + capability-log consolidation + Brief B close). This entry
covers HALTs 2 + 3 — Brief B Step 8 in full. Steps 7, 9, 10, 11 of
DESIGN-1 remain pending; Step 8 closed before Step 7 due to phase-2
reordering (Step 7 per-template reference docs do not block Step 8
Visual Editing wiring) — do not assume sequential closure.

2 commits closed Step 8 this session:
- `b941c5a` — feat(design-1): brief B step 8 infrastructure — env schema + single-client collapse + defineLive serverToken + draft-mode hardening (GET enable / POST disable per CMA F-1 v1.3) (HALT 2 closed)
- `72ea7bf` — feat(design-1): brief B step 8 close — HALT 3

### What Was Built

**Single-client architecture (collapsed from SCAFFOLD-1 two-client baseline)
— CMA-C2 + D4.** SCAFFOLD-1 shipped two Sanity clients (`sanityClient` +
`previewClient`) on the assumption that Visual Editing required a
distinct draft-perspective client. DESIGN-1 §8.3 collapses this to a
single `sanityClient` export at `site/src/lib/sanity/client.ts`. Draft
perspective is now requested via per-fetch options (`{ perspective:
'previewDrafts' }` when `draftMode().isEnabled` evaluates true at fetch
time) rather than via a separate client export. Stega gating rewritten
per CMA F-4 v1.3 + F1 + F2 + F4 + F15 v2.1 + I5 v2.2:
- Branch A: `SANITY_STEGA_ENABLED == '1' && VERCEL_ENV != 'production'`
  (explicit opt-in).
- Branch B: `VERCEL_ENV == 'preview'` (the `NODE_ENV === 'development'`
  clause was dropped per F2 — it was always false on Vercel preview, which
  silently broke out-of-the-box Visual Editing).
- Raw-env safety check (F1): independent fire if `prod + stega` co-occur;
  `console.warn` (NOT throw — preserves availability), force
  `stegaEnabled = false`. Severity downgrade per I5 v2.2 — module-scope
  cold-start traffic + Sentry/Datadog/PagerDuty fatal mapping → alert-
  storm risk vs warn = visible without paging.
- `stega.enabled` gated on `!!env.NEXT_PUBLIC_SANITY_STUDIO_URL` per F4
  v2.1 §8.1.5 probe (createClient throws on `studioUrl: undefined`;
  confirmed empirically).
- `useCdn` gated on `!stegaEnabled` per F-9 v1.3.

**`defineLive` with viewer-scoped `serverToken` — D5.** `site/src/lib/
sanity/live.ts` extended to call `defineLive({ client: sanityClient,
serverToken: env.SANITY_API_READ_TOKEN })`. The `SANITY_API_READ_TOKEN`
env var is retasked from SCAFFOLD-1's `previewClient` token role to the
viewer-scoped `serverToken` slot per CMA-C2 — same env var, new
architectural position. `<SanityLive />` (consumed in the root layout)
renders unconditionally so that live-revalidating fetches keep flowing
on the published site too; `<VisualEditing />` renders only when
`(await draftMode()).isEnabled`.

**Six-step security order on `/api/draft-mode/enable` (GET) — CMA F-2
v1.3.** `site/src/app/api/draft-mode/enable/route.ts` (241 lines). Order
is invariant — never reorder:

- **STEP 1** — Build Origin/Referer allow-list from `[NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SANITY_STUDIO_URL]`. Each entry passes through `new URL().origin`
  inside try/catch (F-1 fail-closed-on-malformed-env). F8 v2.1 literal-`"null"`
  + empty-string guard rejects the literal string `"null"` (sandboxed iframes
  send `Origin: null` as a literal string — must not enter the allow-list).
  **BvR #34 v2.2 dev-only expansion** appends `safeUrlOrigin(request.url)` to
  `allowedOrigins` when `NODE_ENV === 'development'`; production untouched.
- **STEP 2** — Origin/Referer check. Reads `request.headers.get('origin')` and
  parses `request.headers.get('referer')` via `safeUrlOrigin`. The caller
  origin is `origin ?? refererOrigin`. **BvR #35 v2.2** null-origin escape
  hatch accepts `callerOrigin === null` ONLY when the request bears Sanity's
  canonical 3-query-param signature (`sanity-preview-secret` +
  `sanity-preview-perspective` + `sanity-preview-pathname`), checked via
  the file-local `hasSanityPreviewSignature` helper. The signature is
  forgeable — it is NOT a security boundary; STEP 3 secret validation is
  the actual auth gate.
- **STEP 3** — Preview-url secret validation. `validatePreviewUrl(client,
  request.url)` from `@sanity/preview-url-secret`. Wrapped in try/catch
  (F-6 v1.3); the exception path returns 500 WITHOUT enabling draft mode
  (F6 v2.1). The `previewValidationClient` is constructed module-scope
  (F-7 + F-12 v1.3 + F-12 v2.1 + M7 v2.2 optional chaining for the env-
  missing diagnostic). The catch-block ID-binding is named `err` but MUST
  NEVER be logged / serialized / forwarded — Authorization header values
  may be captured inside `validatePreviewUrl`'s internal HTTP-call traces
  (F7 v2.1 prohibition comment).
- **STEP 4** — `redirectTo` same-origin check. `new URL(validation.redirectTo
  ?? '/', base)` where `base = new URL(NEXT_PUBLIC_SITE_URL)`. If
  `target.origin !== base.origin` → 400. STEP 4 is **defense-in-depth**:
  per BvR #36 v2.2, `@sanity/preview-url-secret` does not currently expose
  an off-origin `validation.redirectTo` value (the library reads
  `sanity-preview-pathname` and parses it as same-origin), so STEP 4
  cannot be exercised end-to-end through the real library API. Never
  reorder ahead of STEP 5 — Set-Cookie-on-400 would be the open-redirect-
  into-session-fixation chain F-2 v1.3 specifically guards against.
- **STEP 5** — `(await draftMode()).enable()`. Last operation before
  redirect; never moved earlier in the chain.
- **STEP 6** — Same-origin redirect to validated target. Next.js issues 307.

**Dual Origin+Referer check on `/api/draft-mode/disable` (POST) — CMA F-3
v1.3 Option A.** `site/src/app/api/draft-mode/disable/route.ts` (75
lines). GET → POST conversion: POST is appropriate for button-click
fetch (not iframe navigation). Both `Origin` AND `Referer` must match
(NOT OR). Disable has no preview-url secret — the dual-check IS the CSRF
barrier. Mirrors F8 v2.1 literal-`"null"` guard + F13 v2.1 explicit
booleans + F14 v2.1 optional-Studio-URL inline + BvR #34 v2.2 dev
expansion from the enable route. F11 v2.1 acknowledged trade-off
captured as Tech Debt #18 for TEMPLATE-* (disable-button page must set
`Referrer-Policy: strict-origin-when-cross-origin` or stricter, else
browsers stripping Referer cannot exit draft mode via the UI).

**Strict zod env schema — CMA F-1 + F-6 v1.3 + F5 v2.1 + F12 v2.1 + M7
v2.2.** `site/src/lib/env.ts` (47 lines) tightens three vars:
- `NEXT_PUBLIC_SITE_URL`: strip SCAFFOLD-1 `.catch()` fallback →
  `z.string().url()`. URL semantics enforced at validation time, not at
  runtime first-use.
- `NEXT_PUBLIC_SANITY_STUDIO_URL`: NEW — `z.string().url().optional()`
  with conditional `.refine()` enforcing presence in non-development
  (F5 v2.1; required in production + preview, optional in dev).
- `SANITY_API_READ_TOKEN`: `.optional().default('')` →
  `z.string().min(1)`. Empty-string token was a SCAFFOLD-1 hold-over;
  D14 requires a real token at validation time.

**`previewValidationClient` module-scope helper.** Extracted as a named
module-scope const in `enable/route.ts` (F-7 v1.3 + F-12 v1.3). Module-
scope avoids per-request re-instantiation overhead. F12 v2.1 defensive
throw if `env?.SANITY_API_READ_TOKEN` is missing (circular-import edge).
M7 v2.2: optional chaining (`env?.X`) required — without `?.`, a native
TypeError fires BEFORE the if-check and masks the authored diagnostic
Error.

**3 brief-vs-reality findings discovered + resolved during §8.7 manual
smoke testing (HALT 3 BLOCK 3a).** Each ran the full Pattern 13 audit
lens before resolution:

- **BvR #34** — `NEXT_PUBLIC_SITE_URL` canonical-vs-serving-origin
  split. The env var holds the canonical/hreflang URL (e.g.
  `https://staging.jakevibes.dev`), which differs from the local
  serving origin (`http://localhost:3000`). Sanity Presentation's
  iframe-initiated enable navigation sends Referer = serving origin,
  so STEP 2 returned 403 in dev despite correct production config.
  Resolution: NODE_ENV-gated dev-only expansion of `allowedOrigins`
  with `safeUrlOrigin(request.url)`. Code fix over env override
  (env override leaks localhost into canonical URLs, masking SEO bugs).
- **BvR #35** — Sanity Presentation strips BOTH Origin and Referer on
  the enable navigation (observed 2026-05-12 via §6 trigger #11
  diagnostic logging). F-1 v1.3's "Origin OR Referer must match"
  fallback assumed iframe nav carries at least one header; Sanity's
  Referrer-Policy stance (no-referrer or strict-origin equivalent)
  strips both. D6 v1.3 reframe applied: the preview-url-secret IS
  Sanity's documented auth signal — STEP 3 secret validation is the
  real auth barrier; STEP 2 is supplementary CSRF defense. Resolution:
  null-origin escape hatch via `hasSanityPreviewSignature(url, origin,
  referer)` 3-param helper that gates the null/null path on the
  presence of Sanity's canonical 3-query-param signature. The signature
  is forgeable — it is a cheap pre-filter, not an auth boundary.
- **BvR #36** — STEP 4 same-origin defense-in-depth not exercisable
  end-to-end via `@sanity/preview-url-secret` library API. The library
  reads `sanity-preview-pathname` (a query param) and parses it as
  same-origin; it does not expose an off-origin `validation.redirectTo`
  path. STEP 4 is structurally correct but cannot be reached through
  the real library API. Resolution: documented coverage gap (Tech Debt
  #20); STEP 4 retained as defense-in-depth against future library
  regressions where `redirectTo` could become externally controllable.

**Pattern 13 sharpened twice during BvR resolution.** Pattern 13
originated at v2.1 lock ("defensive code added in response to findings
needs its own audit lens"). Brief B v2.2 §8.7 manual smoke surfaced two
sharpening layers:
- **Layer 2 (BvR #35 sharpening)** — defensive *tests* share the same
  authoring blindspot as the finding they respond to. Brief B v2.2 §8.7
  curl tests against the allow-list construction were authored under
  the same Origin-OR-Referer assumption that the production code
  reflected; they did not surface the Sanity null/null case because
  they didn't probe the real-client request shape first.
- **Layer 3 (BvR #36 sharpening)** — defensive tests against 3rd-party
  libraries need library-behavior probes before assertion design. STEP
  4 was tested via curl assuming `redirectTo` could be a full URL; the
  library's actual contract (query-param-driven, same-origin-parsed)
  was never empirically verified. The probe artifact under
  `audit-output/design-1/` is the auditable evidence the discipline was
  followed.

**§8.7 integration test coverage — 9 of 10 curl tests PASS.** Manual
round-trip PASS verified against real Sanity Presentation flow. Test
matrix (per Brief B v2.2 §8.7):
- (a) STEP 2 disallowed-origin reject — PASS
- (b) STEP 3 secret missing/invalid reject — PASS
- (c) STEP 4 off-origin redirectTo reject — **NOT EXERCISABLE** via
  real library API (BvR #36; Tech Debt #20)
- (d.1)–(d.4) disable route dual-check matrix — PASS (4/4)
- (d.5a) enable route literal-`"null"` origin reject — PASS
- (d.5b) disable route literal-`"null"` origin reject — PASS
- (e) STEP 3 catch-block 500-path Set-Cookie absent — PASS

Smoke test artifact: `audit-output/design-1/visual-editing-smoke-test.md`
(gitignored per D15).

**4 CONVENTIONS.md entries shipped at §8.8.** Entry 3 — "Draft-Mode
Route Hardening (MYGRATR-DESIGN-1 Brief B Step 8 supersedes SCAFFOLD-1
baseline)" — full rewrite of the existing section, documenting the
6-step security order + dual-check disable + helpers + customer 2
transfer notes. Entries 2 / 4 / 5 — "Sanity Fetch Pattern", "Env Schema
Strictness", "Visual Editing Method Probe Discipline" — new sections
at end of file. All four entries are working references for TEMPLATE-*
authors.

**18 productisation patterns consolidated to `docs/CAPABILITY_LOG.md`
at HALT 3 BLOCK 3.** DESIGN-1 H2 extended per C1–C4:
- "Visual Editing infrastructure" sub-section — 8 patterns (single-
  client architecture; six-step security order; F8 literal-`"null"`
  guard + Pattern 13 (a) verification; BvR #34 dev expansion; BvR #35
  null-origin escape hatch; BvR #36 defense-in-depth posture; Env
  Schema Strictness Zod refinements; Sanity Presentation single-route
  wiring).
- "ESLint rule adoption methodology — Brief B Step 6 productisation IP"
  sub-section — 6 patterns (two-gate verification; narrow custom-rule
  supplement; placeholder-as-split-template; coverage finding F8;
  canonical SoT + generated-TS file; BvR #26 ESLint 9 RuleTester
  plugin-namespace silent no-op).
- "Pattern 13 — Defensive code, tests, and probes need their own audit
  lens" sub-section — 4 sharpening layers (v2.1 original; BvR #35
  sharpening; BvR #36 sharpening; manual smoke test as first
  verification gate).
- "Customer-2 reusability assessment" extended with all Step 8
  patterns slotted into the running matrix.

### Files Created

```
audit-output/design-1/visual-editing-method-probe.md       (NEW; gitignored — §8.4 GET-vs-POST method probe artifact per D15)
audit-output/design-1/visual-editing-smoke-test.md          (NEW; gitignored — §8.7 manual round-trip + 10-test integration matrix per D15)
```

### Files Modified

```
site/src/lib/env.ts                                         (47 lines; +30/-2 across HALT 2 — §8.1 D14 strictness for 3 vars)
site/src/lib/sanity/client.ts                               (96 lines; HALT 2 rewrite +107/-15 — single-client collapse, stega gating per F2/F4/F15/I5)
site/src/lib/sanity/live.ts                                 (17 lines; +9/-1 at HALT 2 — defineLive serverToken)
site/src/app/api/draft-mode/enable/route.ts                 (241 lines; +153 at HALT 2 + +88/-13 at HALT 3 — 6-step handler + BvR #34/#35 + previewValidationClient)
site/src/app/api/draft-mode/disable/route.ts                (75 lines; +58 at HALT 2 + +13 at HALT 3 — GET → POST + dual-check + BvR #34 dev expansion)
CONVENTIONS.md                                              (HALT 2 — Sanity Client Pattern rewrite; HALT 3 — Entry 3 rewrite + Entries 2/4/5 NEW; +346 lines cumulative across HALTs)
docs/context/REGISTRY.md                                    (+4 lines at HALT 2 — API routes table updated for enable + disable)
docs/CAPABILITY_LOG.md                                      (+243 lines at HALT 3 — DESIGN-1 H2 extended per C1–C4)
CLAUDE.md                                                   (+25 lines at HALT 3 — Current Phase, phase table, design system state, Tech Debt #18/#19/#20, footer)
```

### HALTs Landed (2 of 3 for Brief B — HALT 1 closed in prior entry)

- **HALT 2 — Step 8 §8.1–§8.6 infrastructure.** Mandatory probes all
  PASS (§8.0 next-sanity exports; §8.0a Step 2 draft-read; §8.0a Step
  3 previewSecret-read; §8.1.5 createClient stega-with-undefined-
  studioUrl; §8.3.0 pre-refactor symbol/path grep; §8.3.N post-
  refactor symbol/path grep). REGISTRY.md API routes table updated.
  CONVENTIONS "Sanity Client Pattern" rewritten as single-client.
  Entries 2-5 deferred to §8.8 at HALT 3 per Brief B v2.2 + user
  clarification. HALT 2 closed at commit `b941c5a`.
- **HALT 3 — Step 8 §8.7 smoke + §8.8 CONVENTIONS + capability-log
  consolidation + Brief B close.** §8.7 manual round-trip PASS + 9/10
  integration tests PASS (test (c) not exercisable per BvR #36).
  Three BvR findings discovered + resolved with Pattern 13 audit lens
  + 2 Pattern 13 sharpening layers added. CONVENTIONS Entry 3 rewrite
  + Entries 2/4/5 NEW. docs/CAPABILITY_LOG.md DESIGN-1 H2 extended
  per C1–C4 (18 patterns added). CLAUDE.md phase status + Tech Debt
  #18/#19/#20. `tsc --noEmit` clean. `npm run lint` returns 25
  problems (unchanged pre-existing baseline from HALT 1). `npm run
  build` clean. HALT 3 closed at commit `72ea7bf`.

### Patterns Established

CONVENTIONS.md gained 4 sections at Step 8 close:
- **Entry 3 (rewrite)** — Draft-Mode Route Hardening (supersedes
  SCAFFOLD-1 baseline). 6-step enable order + dual-check disable +
  helpers (`safeUrlOrigin`, `hasSanityPreviewSignature`) + layout
  integration + studio side + customer 2 transfer notes.
- **Entry 2 (new)** — Sanity Fetch Pattern. Single client at
  `site/src/lib/sanity/client.ts` + `defineLive` wrapper at
  `site/src/lib/sanity/live.ts` + layout integration + what this
  pattern is NOT + customer 2 transfer.
- **Entry 4 (new)** — Env Schema Strictness. Required strings
  `.min(1)` not `.string()`; URLs `.url()` not `.string()`;
  conditional required-in-prod / optional-in-dev `.refine()`;
  optional-with-default; customer 2 transfer; anti-pattern.
- **Entry 5 (new)** — Visual Editing Method Probe Discipline. Why
  this pattern exists; the probe pattern; what goes in the artifact;
  counter-pattern; customer 2 transfer.

`docs/CAPABILITY_LOG.md` DESIGN-1 H2 was extended with 18 patterns
across 3 sub-sections (Visual Editing infrastructure — 8; ESLint rule
adoption methodology — 6; Pattern 13 sharpening — 4) plus the
"Customer-2 reusability assessment" matrix extended with Step 8
entries. This consolidates both Step 6 deferred IP (3 patterns staged
at HALT 1) and Step 8 IP (the remaining 15) per Brief B v2.2 §8.8
two-phase capability log protocol.

### Tech Debt Logged

3 entries added to CLAUDE.md Known Tech Debt table at HALT 3:
- **#18 DESIGN-1 Brief B Step 8 F11 v2.1** — Disable UI must set
  `Referrer-Policy: strict-origin-when-cross-origin` (or stricter) at
  TEMPLATE-* time. Without it, browsers stripping the Referer header
  (Referrer-Policy: no-referrer, privacy extensions, sandboxed
  iframes) cannot exit draft mode via the UI — fallback is manual
  cookie deletion. Fix in MYGRATR-TEMPLATE-*.
- **#19 DESIGN-1 Brief B Step 8 BvR #35 follow-up** — Brief B v2.2
  §8.7 manual round-trip smoke test as specified did not surface the
  null-Origin/null-Referer case. Customer 2 brief authoring + future
  Mygratr phase briefs should include explicit DEBUG-logging probe
  step BEFORE the integration tests fire, to capture real-client
  request shape against the allow-list construction. The probe
  artifact under `audit-output/design-1/` is the auditable evidence
  the discipline was followed. Fix in Customer 2 brief authoring +
  future Mygratr phase briefs.
- **#20 DESIGN-1 Brief B Step 8 BvR #36** — STEP 4 same-origin check
  is defense-in-depth; no end-to-end integration test exists due to
  `@sanity/preview-url-secret` API constraints (library reads
  `sanity-preview-pathname`, not `redirectTo` query param). Optional
  future work: synthetic unit test or library upgrade-monitoring. Fix
  in future testing-infra phase.

The pre-existing 25-problem lint baseline from HALT 1 is unchanged
(9 errors + 16 warnings, all outside Brief B scope) — flagged for
DESIGN-1 Step 11 final tech debt rollup.

### Discoveries / Surprises

- **Sanity Presentation strips Origin AND Referer on enable nav
  (BvR #35) — D6 v1.3 reframe applied.** Discovered 2026-05-12 via
  §6 trigger #11 diagnostic logging during manual round-trip smoke
  test. Brief B v1.3 + v2.0–v2.2 all assumed Origin OR Referer would
  survive Sanity's Presentation iframe nav. Sanity's Referrer-Policy
  stance (no-referrer or strict-origin equivalent) strips both. The
  resolution rests on D6 v1.3's reframe: the preview-url-secret IS
  Sanity's documented auth signal; STEP 3 is the real auth gate; STEP
  2 is supplementary CSRF defense. The null-origin escape hatch via
  `hasSanityPreviewSignature` gates the null/null path on Sanity's
  3-query-param signature presence — forgeable, but a cheap pre-
  filter limiting the escape hatch to requests structurally matching
  Sanity's protocol. The 3-param helper signature (`url`, `origin`,
  `referer`) was deliberate: Pattern 13 audit demanded the helper
  prove it cannot be called accidentally on non-null/non-null
  callers (the `callerOrigin === null` gate at the call site is the
  documented entry condition; the helper itself accepts the 3 inputs
  to keep its scope inspectable).
- **`NEXT_PUBLIC_SITE_URL` canonical-vs-serving-origin split (BvR
  #34) — code fix over env override.** Local dev surfaces the split
  (canonical = `https://staging.jakevibes.dev`, serving =
  `http://localhost:3000`). Two resolution paths considered: (1) env
  override (set `NEXT_PUBLIC_SITE_URL=http://localhost:3000` in
  `.env.local`); (2) code fix (NODE_ENV-gated dev expansion of
  `allowedOrigins`). Code fix won — env override leaks localhost
  into canonical/hreflang URLs in dev, masking SEO bugs and forcing
  every customer's brief to inherit the same env-quirk workaround.
  Code fix keeps `NEXT_PUBLIC_SITE_URL` as the single canonical
  concept; the dev branch in the enable route is the only place the
  serving-vs-canonical split is handled. Pattern 13 audit confirmed
  reachability, side-effect scope, bypass surface (production
  NODE_ENV override is not a real attack — Vercel doesn't honour it),
  failure mode (try/catch + null check), and customer transfer
  (every TEMPLATE-* customer inherits the split — reusable as-is).
- **STEP 4 not exercisable end-to-end via library API (BvR #36).**
  `@sanity/preview-url-secret` reads `sanity-preview-pathname` (a
  query param) and parses it as same-origin internally; it does not
  expose an off-origin `validation.redirectTo` path. STEP 4 was
  authored as a guard against open-redirect-into-session-fixation
  per F-2 v1.3, but the real library API never produces an off-
  origin `redirectTo`. STEP 4 retained as defense-in-depth against
  future library regressions; no synthetic unit test added in this
  phase (Tech Debt #20 captures the optional future work).
- **Pattern 13 sharpened twice in a single HALT (v2.2 → 4 layers).**
  Originally a single-layer rule at v2.1 ("defensive guards added in
  response to findings need their own audit lens"). BvR #35
  surfaced Layer 2 (defensive *tests* share the authoring blindspot
  of the finding they respond to); BvR #36 surfaced Layer 3 (3rd-
  party library tests need library-behavior probes before assertion
  design). Manual smoke test as FIRST verification gate added as
  Layer 4 — the v2.2 brief's §8.7 ordered integration tests before
  manual smoke; for customer 2 this inverts (smoke first, then
  curl). All 4 layers documented in `docs/CAPABILITY_LOG.md` Pattern
  13 sub-section.
- **CMA D6 v1.3 reframe is the load-bearing decision for BvR #35
  resolution.** D6 was authored at brief lock as "preview-url-secret
  is Sanity's documented auth signal, not Origin/Referer". At brief
  lock the framing felt theoretical — Origin/Referer was still the
  visible auth surface. BvR #35 made D6 operational: STEP 2 became
  supplementary CSRF defense; STEP 3 became the actual auth gate;
  the null-origin escape hatch is the architectural cost of honouring
  D6's framing against Sanity's protocol reality.

### Final Repo State (Brief B HALT 3 close)

- `migrations.status` = `content_complete` (unchanged; DESIGN-1 does
  not transition).
- 30 stories on disk (unchanged from Brief A / HALT 1).
- 22 primitives + Icon foundation (unchanged from Brief A Step 2).
- 14 UI_STRINGS keys (unchanged from HALT 1) at
  `tools/eslint/ui-strings.json` → `site/src/lib/ui-strings.ts`.
- Single-client architecture live at `site/src/lib/sanity/client.ts`
  (96 lines); SCAFFOLD-1 `previewClient` export removed.
- `defineLive` with viewer-scoped `serverToken` at
  `site/src/lib/sanity/live.ts` (17 lines).
- `/api/draft-mode/enable` GET handler at 241 lines — 6-step security-
  ordered handler with BvR #34 dev expansion + BvR #35 null-origin
  escape hatch + module-scope `previewValidationClient`.
- `/api/draft-mode/disable` POST handler at 75 lines — dual Origin+
  Referer check with BvR #34 dev expansion.
- Strict zod env schema at `site/src/lib/env.ts` (47 lines) — `.url()`
  / `.min(1)` / conditional required-in-prod refinement.
- `tsc --noEmit` clean. `npm run lint` returns 25 problems (unchanged
  pre-existing baseline from HALT 1; all outside Brief B scope —
  flagged for DESIGN-1 Step 11 rollup). `npm run build` clean.
- `npm run build-storybook` exits 0 (unchanged from Brief A — Step 8
  did not touch Storybook).
- CONVENTIONS.md gained 4 sections (Entry 3 rewrite + Entries 2/4/5
  NEW) cumulating ~346 lines.
- `docs/CAPABILITY_LOG.md` DESIGN-1 H2 extended by 243 lines — 18
  productisation patterns + Customer-2 reusability matrix Step 8
  additions.
- Tech Debt #18 / #19 / #20 added to CLAUDE.md Known Tech Debt table.
- §8.7 smoke test artifact at
  `audit-output/design-1/visual-editing-smoke-test.md` (gitignored
  per D15) — 9 of 10 curl tests PASS + manual round-trip PASS.
- §8.4 method probe artifact at
  `audit-output/design-1/visual-editing-method-probe.md` (gitignored
  per D15).
- Branch `feat/design-1` at `72ea7bf` (HALT 3 close), pushed to
  `origin/feat/design-1`.

---

## MYGRATR-DESIGN-1 Step 6 — UI_STRINGS lint rule + canonical SoT (Brief B HALT 1 close, May 2026)

### Phase context

Step-6-milestone partial entry on an open DESIGN-1 phase. `migrations.status`
remained `content_complete` throughout — DESIGN-1 explicitly does not
transition state per brief §0 (no `design_running` / `design_complete` in
`pipeline/state-machine.ts`; DESIGN-1 operates against the
`content_complete` baseline). Brief B v1.3 splits DESIGN-1 Step 6 + Step 8
across 3 HALTs: HALT 1 (after Step 6 — ESLint rule + canonical SoT),
HALT 2 (after Step 8a-8e Visual Editing infrastructure), HALT 3 (after
Step 8 smoke test + Brief B close + capability-log consolidation). This
entry covers HALT 1 only. Steps 7, 8, 9, 10, 11 of DESIGN-1 remain
pending. HALTs 2 + 3 of Brief B remain ahead — this entry will be
extended in place as Step 8 lands and Brief B closes.

1 commit closed Step 6 / Brief B HALT 1 this session:
- `5726e38` — feat(design-1): brief B step 6 — UI_STRINGS lint rule + canonical SoT files (HALT 1 closed)

### What Was Built

**Two-rule chrome-string architecture.** Brief B Step 6 establishes
`UI_STRINGS` as the canonical chrome-string map enforced by two ESLint
rules running together in `site/eslint.config.mjs`:

1. **Upstream `react/jsx-no-literals`** (from
   `eslint-plugin-react@7.37.5`, already a transitive dep via
   `eslint-config-next` — SA-1 finding at brief v1.2 corrected the
   non-existent `eslint-plugin-jsx-no-literals` reference in the v2.0
   parent brief). Config: `noStrings: true` + `allowedStrings` (the
   exemption list) + `ignoreProps: true` (props-only strings stay
   inline). Covers most JSX text contexts including JSXText nodes,
   string literals inside JSXExpressionContainer, and template literals
   without expressions.

2. **Project-local `local/no-conditional-strings-in-jsx`** (~65 lines
   at `tools/eslint/rules/no-conditional-strings-in-jsx.js`). Plugin
   wrapper at `tools/eslint/plugin-local.js` exposes the rule under the
   `local/` namespace. This rule was added because Brief B §6.4
   fixture-verification surfaced an AST-coverage gap in
   `react/jsx-no-literals`: the upstream rule skips
   `ConditionalExpression` branches that hold literal strings (e.g.
   `{cond ? 'A' : 'B'}` inside JSX). The custom rule walks JSX subtrees,
   finds `ConditionalExpression` nodes whose consequent or alternate is
   a string literal, and reports. F8 of the cross-model audit (v1.3)
   pre-§6.4 gate-verified this gap with a fixture before custom-rule
   work began.

The two rules together cover the JSX chrome-string surface that
TEMPLATE-* authors will hit. Custom rule scope is intentionally narrow
(`ConditionalExpression` only) — not a generalised replacement.

**Canonical SoT + byte-idempotent generator.** Chrome strings live in
`tools/eslint/ui-strings.json` as a 14-key flat map with a top-level
`_meta` provenance block (`reconciled_at`, `seed_provenance`, brief
reference). Generator at `scripts/design/generate-ui-strings.mjs` reads
the JSON and emits `site/src/lib/ui-strings.ts` as a do-not-edit TS
const. Re-running the generator on unchanged JSON input is byte-
idempotent on the output (F10 from v1.3 audit). `package.json` gained
`npm run generate-ui-strings`. The `_meta.reconciled_at` timestamp is
only touched on content change, not every re-run — F10 idempotency
discipline.

**9 exemption file patterns** registered in `site/eslint.config.mjs`
override the rule for paths where chrome-string discipline doesn't
apply: (1) Storybook stories Pair-rule per folder
(`site/src/components/ui/**/stories.tsx`), (2) Storybook flat-file
Tier-1 stories (`site/src/components/tier-1/*.stories.tsx`), (3)
ESLint tests (`tools/eslint/__tests__/**`), (4) Demo route
(`site/src/app/demo/**`), (5)-(7) Next.js framework templates
(`layout.tsx`, `not-found.tsx`, `error.tsx` patterns), (8) Vendor SDK
init blocks, (9) The generated `site/src/lib/ui-strings.ts` itself.
BvR #24 corrected D3 exemption glob mismatch with Brief A Pair-rule;
BvR #25 added `storybook-static/**` to `globalIgnores`.

**AST coverage harness.** `tools/eslint/__tests__/ui-strings.test.mjs`
is an 8-fixture coverage harness. Fixtures F1-F6 cover canonical
positive + negative cases for `react/jsx-no-literals` (allowed strings
pass; raw chrome strings fail). F7a is the regression-catch fixture
for the upstream `ConditionalExpression` branch gap — it must FAIL the
upstream rule alone (proving the gap exists) and PASS the
upstream + custom-rule pair (proving the gap is covered). F7b is a
positive fixture for the custom rule's targeted AST shape. F8 is the
gate-verification fixture from v1.3 F8 audit. Harness uses
`Linter.verify` directly rather than ESLint 9's `RuleTester` —
`RuleTester` silently no-ops on plugin-namespaced rules (rule registers
but assertions never fire). Logged as BvR #26 for HALT 3.

**§6.3 codebase fixes.** Brief B §6.3 mandated cleaning up pre-existing
chrome-string violations before lint enforcement went live:

- `site/src/app/page.tsx` + `site/src/app/uk/page.tsx`: 4 lines that
  hold visible chrome strings on the SCAFFOLD-1 home-page stubs (which
  TEMPLATE-HOME will replace at template-phase time) received targeted
  `// eslint-disable-next-line react/jsx-no-literals` comments with an
  inline `// TEMPLATE-HOME` reference so the disables show up in TODO
  greps when TEMPLATE-HOME work begins.
- `site/src/components/ui/hubspot-form-embed/index.tsx`: 3 strings
  migrated from inline literals to `UI_STRINGS` references. The
  `form.loading` string is a simple lookup. The `form.error.loadFailed`
  string interpolates a HubSpot form-ID into an error message — solved
  with the **placeholder-as-split-template** pattern (one of the 3
  productisation IP patterns staged for HALT 3): the SoT entry stores
  the string with a `{formId}` placeholder, and the consumer splits
  on that placeholder at render time, rendering surrounding text via
  `UI_STRINGS` and the variable via plain JSX child. Keeps the
  canonical map free of runtime templating while satisfying the
  `react/jsx-no-literals` rule.
- 2 new UI_STRINGS keys: `form.loading`, `form.error.loadFailed`.
  Total key count after §6.3: 14.

**CONVENTIONS.md** received a new 212-line "UI_STRINGS Rule
(post-DESIGN-1 Brief B)" section covering: both rules and their
combined coverage, a 5-path violation triage tree (rename / migrate to
SoT / add to exemption / re-extract for i18n / disable inline with
justification), the exemption table, the naming convention table
(domain-dot-suffix keys; consistent prefix scoping), test
infrastructure pointers, and generator discipline. This section is
the working reference for TEMPLATE-* authors.

### Files Created

```
tools/eslint/ui-strings.json                      (NEW; 30 lines — 14 keys + _meta provenance)
tools/eslint/rules/no-conditional-strings-in-jsx.js  (NEW; 87 lines — project-local custom rule)
tools/eslint/plugin-local.js                      (NEW; 19 lines — plugin wrapper, local/ namespace)
tools/eslint/__tests__/ui-strings.test.mjs        (NEW; 169 lines — 8-fixture Linter.verify harness)
scripts/design/generate-ui-strings.mjs            (NEW; 86 lines — byte-idempotent JSON → TS generator)
scripts/design/probe-ui-strings-reality.mjs       (NEW; 287 lines — §6.0a one-shot seed-list provenance probe)
site/src/lib/ui-strings.ts                        (NEW; 21 lines — generated, do-not-edit)
```

### Files Modified

```
CONVENTIONS.md                                    (+212 lines: "UI_STRINGS Rule (post-DESIGN-1 Brief B)" section)
package.json                                      (+1 line: generate-ui-strings npm script)
site/eslint.config.mjs                            (+62 lines: rule registration, 9 exemption globs, plugin import)
site/src/app/page.tsx                             (+2 lines: 2 SCAFFOLD-1 comment-disables with TEMPLATE-HOME reference)
site/src/app/uk/page.tsx                          (+2 lines: 2 SCAFFOLD-1 comment-disables with TEMPLATE-HOME reference)
site/src/components/ui/hubspot-form-embed/index.tsx  (+15 / -5 lines: 3 strings → UI_STRINGS via placeholder-as-split-template)
audit-output/design-1/capability-log-draft.md     (gitignored running draft; BvR #23-#26 + 3 productisation IP patterns staged for HALT 3)
```

### HALTs Landed (1 of 3 for Brief B)

- **HALT 1 — UI_STRINGS lint rule + canonical SoT + AST coverage
  harness + §6.3 codebase fixes.** Eyeballed the rule-enforcement state
  on disk via the 8-fixture harness (F1-F8 all pass). `tsc --noEmit`
  clean. `npm run lint` returns 25 problems, all pre-existing rules
  outside Brief B scope (see Final Repo State below for breakdown).
  Zero `react/jsx-no-literals` or `local/no-conditional-strings-in-jsx`
  violations — both rules are running cleanly across the codebase
  after the §6.3 fixes. HALT 1 closed at commit `5726e38`.

### Patterns Established

CONVENTIONS.md gained the 212-line "UI_STRINGS Rule (post-DESIGN-1
Brief B)" section as the working reference for TEMPLATE-* authors —
both rules, 5-path violation triage, exemption table, naming
convention table, test infrastructure, generator discipline.

**Capability log consolidation defers to HALT 3** per Brief B v1.3
protocol. HALT 1 logs Brief-vs-Reality findings + productisation IP
candidates to the gitignored
`audit-output/design-1/capability-log-draft.md` running draft. At
HALT 3 (Brief B close), the consolidated capability IP from both
Step 6 (this) and Step 8 (Visual Editing wiring) lands in
`docs/CAPABILITY_LOG.md` in a single commit. This mirrors Brief A's
two-phase consolidation pattern (Step 4 close + Brief A close).

3 productisation IP patterns staged for HALT 3 from Step 6:
1. **Placeholder-as-split-template** — handles runtime interpolation
   into chrome strings without dynamic templating in the canonical SoT
   map. Consumer splits on a `{placeholder}` token at render time;
   each split fragment renders as either a `UI_STRINGS` lookup or a
   plain JSX child holding the runtime variable.
2. **Two-gate ESLint rule verification** — fixture-verify the
   upstream-rule AST-coverage gap BEFORE writing a custom rule (Brief
   B v1.3 F8 added this gate explicitly). Without the gate, the custom
   rule risks duplicating upstream coverage rather than supplementing
   it.
3. **Narrow custom-rule supplement** — custom rules should target the
   smallest AST shape that closes the upstream gap, not the broadest
   plausible scope. Brief B's `local/no-conditional-strings-in-jsx`
   targets only `ConditionalExpression` literal-string branches; it
   does not duplicate the broader chrome-string coverage that
   `react/jsx-no-literals` already provides.

### Tech Debt Logged

No new Tech Debt entries at HALT 1 (capability log + Known Tech Debt
table both consolidate at HALT 3 / Step 11 respectively per protocol).

The pre-existing 25-problem lint baseline (9 errors + 16 warnings,
all outside Brief B scope) is flagged for HALT 3 tech debt rollup —
specifically:
- 5 `react/no-unescaped-entities` in `site/src/app/demo/_demo-client.tsx`
  (DESIGN-1 Step 2 demo route; production-guarded)
- 2 `react-hooks/set-state-in-effect` in `site/src/components/ui/hubspot-form-embed/index.tsx`
  (SCAFFOLD-1 HubSpot mount pattern)
- 2 `@typescript-eslint/no-empty-object-type` in `input` + `textarea`
  primitives (DESIGN-1 Step 2 — empty `Props extends X {}` shapes)
- 16 warnings (mixed; flagged en bloc for HALT 3 triage)

These have not been touched by Brief B Step 6 — they were the noise
floor before Step 6 began and remain the noise floor after.

### Discoveries / Surprises

- **Upstream `ConditionalExpression` branch gap — architectural rationale
  for the custom rule.** Brief B v1.0 / v1.1 / v1.2 assumed
  `react/jsx-no-literals` would cover all JSX literal-string contexts.
  Brief B §6.4 fixture-verification surfaced the gap: the upstream rule
  skips literal strings appearing as `consequent` or `alternate` of a
  `ConditionalExpression` inside a JSXExpressionContainer. This isn't
  documented in `eslint-plugin-react`'s rule docs — it surfaced only
  via fixture-driven AST traversal. The narrow custom-rule supplement
  was the cheapest fix (vs. fork-and-patch upstream or migrate to a
  different rule pack). Cross-model audit (v1.3) added the F8 gate-
  verification fixture to lock the gap-discovery discipline in for
  future custom-rule decisions.
- **Placeholder-as-split-template pattern (productisation IP staged for
  HALT 3).** Solved the `{formId}` interpolation problem in
  `hubspot-form-embed` without polluting the canonical map with
  templating logic. Generalisable: any chrome string with a runtime
  variable can use this pattern. Trade-off: the consumer carries
  slightly more rendering complexity (one `.split()` call + a
  `.map()`); the canonical SoT stays a flat string-to-string map.
- **ESLint 9 `RuleTester` plugin-namespace silent failure (BvR #26).**
  Discovered when the initial test harness used `RuleTester` and all
  assertions appeared to pass — including assertions on rule shapes
  that hadn't been implemented yet. Probe via `RuleTester.run('local/
  no-conditional-strings-in-jsx', rule, { valid: [], invalid: [...] })`
  showed that ESLint 9 silently skips plugin-namespaced rules in
  `RuleTester` (the rule registers via plugin wiring, but the test
  runner's rule lookup uses unqualified names). Fix: switched the
  entire harness to `Linter.verify` direct construction. Logged for
  HALT 3 productisation IP — the lesson is that ESLint 9 testing for
  custom plugin-namespaced rules requires `Linter.verify`, not
  `RuleTester`.
- **`react/jsx-no-literals` is a transitive dep — no new direct
  dependency needed.** Brief B v2.0 + v1.0 / v1.1 referenced a
  non-existent `eslint-plugin-jsx-no-literals` package (SA-1 audit
  finding at v1.2). The rule actually ships in `eslint-plugin-react`,
  which is already a transitive dep via `eslint-config-next`. Net dep
  change for Brief B Step 6: zero. Confirmed via
  `npm ls eslint-plugin-react`.

### Final Repo State (Brief B HALT 1 close)

- `migrations.status` = `content_complete` (unchanged; DESIGN-1 does
  not transition).
- 30 stories on disk (unchanged from Brief A). 22 primitives + Icon
  foundation (Brief A Step 2-derived inventory) all carry chrome-string
  discipline going forward.
- 14 UI_STRINGS keys live at `tools/eslint/ui-strings.json` →
  `site/src/lib/ui-strings.ts`. Generator byte-idempotent on unchanged
  input.
- Two-rule ESLint enforcement live in `site/eslint.config.mjs`.
  Zero violations of either Brief B rule across the repo.
- `tsc --noEmit` clean.
- `npm run lint` returns 25 problems (9 errors + 16 warnings), all
  pre-existing rules outside Brief B scope — flagged for HALT 3
  tech debt rollup.
- `npm run build-storybook` exits 0 (unchanged from Brief A — Step 6
  did not touch Storybook).
- CONVENTIONS.md "UI_STRINGS Rule (post-DESIGN-1 Brief B)" section
  live (212 lines).
- 8-fixture AST-coverage harness at
  `tools/eslint/__tests__/ui-strings.test.mjs` running clean
  (`node --experimental-strip-types tools/eslint/__tests__/ui-strings.test.mjs`).
- Capability-log running draft at
  `audit-output/design-1/capability-log-draft.md` (gitignored)
  preserved with BvR #23-#26 + 3 productisation IP patterns staged
  for HALT 3 consolidation. NOT consolidated into
  `docs/CAPABILITY_LOG.md` at HALT 1 per Brief B v1.3 protocol.
- Branch `feat/design-1` ahead of `origin/feat/design-1` by 1 commit
  (`5726e38`) after HALT 1 close — will be +1 after this context-
  refresh commit lands.

---

## MYGRATR-DESIGN-1 Step 4 + Step 5 — Brief A close (May 2026)

### Phase context

Brief-A-milestone partial entry on an open DESIGN-1 phase. `migrations.status`
remained `content_complete` throughout — DESIGN-1 explicitly does not
transition state per brief §0 (no `design_running` / `design_complete` in
`pipeline/state-machine.ts`; DESIGN-1 operates against the
`content_complete` baseline). Steps 6, 7, 8, 9, 10, 11 of DESIGN-1 remain
pending; this entry will be extended in place as those steps land.

7 commits closed Brief A this session:
- `bf2d6b6` — docs(design-1): brief A v1.2 (audit-patched from v1.1; v1.1 removed; superseded)
- `bd54c68` — feat(design-1): brief A §4.0-§4.3 — Storybook scaffold + config + 30 stories (uncommitted at §4.4 deploy time)
- `268520e` — fix(design-1): brief A §4.4 — expose NEXT_PUBLIC_* env vars to Storybook bundle (HALT 1 bug fix)
- `cde66ca` — feat(design-1): brief A step 4 close — §4.5 verifier + §4.6 CONVENTIONS.md + deploy runbook (HALT 1 closed)
- `e18bd3a` — chore(design-1): brief A step 4 capability log consolidation (Storybook setup → docs/CAPABILITY_LOG.md)
- `620a3b5` — feat(design-1): brief A step 5 close — V0 prompt template + 3 worked examples (HALT 2 closed)
- `64ef3fc` — chore(design-1): brief A close — capability log consolidation (v0.dev prompt template → docs/CAPABILITY_LOG.md)

### What Was Built

**Storybook scaffold** at `site/.storybook/{main.ts, preview.tsx}` running
`@storybook/nextjs@10.3.6` (webpack5 force per Brief A v1.2 D2 lock —
`nextjs-vite` deferred until `storybookjs/storybook#34688` closes).
30 stories shipped:

| Group | Primitives | Stories | Path |
|---|---|---|---|
| A Foundation | 6 | 6 | `site/src/components/ui/{button,link,tag,card,accordion,marquee}/stories.tsx` |
| B Typography | 3 | 3 | `site/src/components/ui/{heading,text,portable-text}/stories.tsx` |
| C Forms | 7 | 7 | `site/src/components/ui/{input,textarea,select,checkbox,radio-group,form-field,hubspot-form-embed}/stories.tsx` |
| D Overlays | 4 | 4 | `site/src/components/ui/{dialog,tooltip,dropdown-menu,toast}/stories.tsx` |
| E Media + Layout | 4 | 4 | `site/src/components/ui/{image,video-embed,container,divider}/stories.tsx` |
| Icon | 1 | 1 | `site/src/components/ui/icon/stories.tsx` |
| **Tier-1** | 5 | 5 | `site/src/components/tier-1/{home-hero-scale-in, nav-sticky-transition-global, section-fade-reveal-global, service-card-grid-hover-reveal, testimonial-swiper-global}.stories.tsx` |
| **Total** | **25 + 5** | **30** | |

Tier-1 stories ship as scaffold-stage primitive-composition previews per
Hard Rule #7 — primitives from each spec's §3 Tech stack composed with
§6-shaped mock data + visible `<ScaffoldNote>` panel. NO library wiring
(no `gsap`, no `swiper` init, no working `ScrollTrigger`, no autoplay).

**Vercel deploy** — separate Vercel project at
`https://mygratr-cloud-employee-storybook.vercel.app`. Framework Preset:
`Other` (NOT Next.js — would invoke `next build` instead of
`storybook build`). Root Directory: `site`. Build Command:
`npm run build-storybook`. Output Directory: `storybook-static`.
Standard Deployment Protection enabled.

**v0.dev prompt template** — canonical `docs/V0_PROMPT_TEMPLATE.md`
(406 lines, 6-section format from v2.0 brief §Step 5: Design system
constraints / Primitive components available / Visual reference /
Sanity data shape / Constraints / Output format). Sections 1, 2, 5, 6
paste-as-is per template; Sections 3, 4 per-template fill-in. Storybook
URL cross-referenced in Section 2 as live primitive-shape reference.

**3 worked examples** at `docs/templates/_examples/`:

| Example | Lines | Doc type | URL pattern |
|---|---|---|---|
| `v0-prompt-blog.md` | 168 | `blogPost` (74 docs) | detail page `/blog/{slug}` |
| `v0-prompt-team-member.md` | 166 | `teamMember` (28 docs) | detail page `/team/{slug}` |
| `v0-prompt-review.md` | 224 | `review` (26 docs) | listing page `/reviews` |

REVIEW example carries forward both schema-vs-reality findings from
`docs/design/components/testimonial-swiper-global.md` per Brief A v1.2
§5.2 mandate.

**HALT 1 env-vars bug + fix.** First Vercel deploy at §4.4 surfaced
`TypeError: Cannot read properties of undefined (reading 'cn')` on 3
Tier-1 stories (Image primitive importers) and `ReferenceError:
Cannot access '__WEBPACK_DEFAULT_EXPORT__' before initialization` on
the Image primitive's own story. Probe via bundle inspection at
`storybook-static/image-stories.*.iframe.bundle.js` revealed root cause:
`@storybook/nextjs` does NOT auto-pass-through `NEXT_PUBLIC_*` env vars
to its webpack DefinePlugin. `process.env` inlined as
`{NODE_ENV, NODE_PATH, STORYBOOK, PUBLIC_URL}` only — Sanity vars
resolved to undefined, Zod's `schema.parse()` threw at module evaluation,
cascade halted module evaluation mid-way producing two distinct surface
symptoms. Fix: `env: (config) => ({...config, NEXT_PUBLIC_SANITY_PROJECT_ID:
process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? '', NEXT_PUBLIC_SANITY_DATASET:
process.env.NEXT_PUBLIC_SANITY_DATASET ?? '' })` config function added to
`.storybook/main.ts`. Both surfaces resolved.

**Productisation IP capture.** 19 numbered patterns landed in
`docs/CAPABILITY_LOG.md` (13 Storybook setup at Step 4 close + 6 v0.dev
prompt template at Step 5 close) plus 19 new Customer-2 reusability
assessment matrix rows. CONVENTIONS.md gained 72-line "Storybook Story
Pattern" section. Customer-2 deploy runbook at
`docs/design/storybook-deploy.md` (157 lines) captures the Vercel
project setup checklist.

### Files Created

```
site/.storybook/main.ts                                                    (NEW; 22 lines including env config)
site/.storybook/preview.tsx                                                (NEW; 26 lines, imports globals.css)
site/src/components/ui/{primitive}/stories.tsx                             (NEW; ×25 across all primitive folders)
site/src/components/tier-1/{slug}.stories.tsx                              (NEW; ×5 Tier-1 scaffold-stage)
docs/V0_PROMPT_TEMPLATE.md                                                 (NEW; 406 lines, 6-section format)
docs/templates/_examples/v0-prompt-blog.md                                 (NEW; 168 lines)
docs/templates/_examples/v0-prompt-team-member.md                          (NEW; 166 lines)
docs/templates/_examples/v0-prompt-review.md                               (NEW; 224 lines)
docs/design/storybook-deploy.md                                            (NEW; 157 lines, customer-2 runbook)
```

### Files Modified

```
site/.gitignore                       (Storybook init: *storybook.log + storybook-static)
site/eslint.config.mjs                (Storybook init: eslint-plugin-storybook flat-config integration)
site/package.json                     (added storybook + build-storybook scripts; 7 devDeps incl. prop-types §4.0 workaround)
site/package-lock.json                (mechanical lockfile for new Storybook 10.3.6 deps)
CONVENTIONS.md                        (+72 lines: Storybook Story Pattern section before Section 4 Phase History)
docs/CAPABILITY_LOG.md                (+275 / -3 lines Step 4 consolidation; +119 / -3 lines Step 5 consolidation; total +394 / -6 across 19 patterns + 19 customer-2 reusability rows)
audit-output/design-1/capability-log-draft.md  (gitignored running draft; +9 BvR findings + DEV-2 update + Tech Debt entry across Brief A)
```

### HALTs Landed (2 of 2)

- **HALT 1 — Storybook scaffold + 30 stories + Vercel deploy + env-vars bug fix.** Eyeballed the deployed Storybook on Vercel; spot-checked 3 stories (Primitives/Image Default + Tier-1/home-hero-scale-in Default + Primitives/Tag Default no-regression) post-fix. All 3 rendered cleanly. HALT 1 closed at commit `cde66ca` (Step 4 close commit covering §4.5 verifier + §4.6 CONVENTIONS.md + deploy runbook). 1 round of HALT-1-bug-fix iterations: bug surfaced; probed via bundle inspection; root cause identified (env throw cascade); fix landed at commit `268520e`; re-verified.
- **HALT 2 — v0.dev prompt template + 3 worked examples.** Read the 4 surfaced files (964 lines total). 2 clarification edits requested + applied: (1) Section 3 placeholder block replaced with self-explaining REFERENCE-doc workflow (no roadmap-leaky "TBD-pending-Step-7" references); (2) Section 4 schema placeholder renamed to `PLACEHOLDER_REPLACE_ME_Schema` to prevent accidental copy-paste. HALT 2 closed at commit `620a3b5`.

### Patterns Established

19 productisation IP patterns across Brief A (consolidated in
`docs/CAPABILITY_LOG.md`):

**Storybook setup (13 patterns at Step 4 close):**
1. Storybook 10 install workarounds (prop-types + `-y --no-dev` + `--builder webpack5`)
2. ESLint flat-config + eslint-plugin-storybook integration
3. Framework auto-mocks for next/{image,link,font} — no decorators needed
4. `globals.css` over `tokens.css` for Tailwind v4 utility availability
5. `NEXT_PUBLIC_*` env config function — required for any schema-validated env module
6. Build-time exit-0 is necessary but not sufficient — runtime spot-check required
7. Pair-rule per folder — mechanical count beats logical count
8. Render-only stories preferred over `args` + `argTypes`
9. Mock data discipline — Hard Rule #1 exception scoped to story files
10. Tier-1 scaffold-stage rule — primitive-composition preview, not working impl
11. Vercel separate-project deploy + Standard Protection
12. Build-infrastructure-before-deploy commit cadence (CI/CD-aware ordering)
13. Brief-vs-reality finding velocity — 9 instances at Brief A indicate brief-drafter mental-model gaps

**v0.dev prompt template (6 patterns at Step 5 close):**
1. 6-section format with paste-as-is vs fill-in split
2. Self-explaining placeholder discipline (HALT 2 lesson)
3. Worked-example-as-clarification pattern
4. Schema-vs-reality findings carried into example bodies
5. Storybook URL as Section 2 cross-reference
6. Per-doc-type variation surfaced in worked examples (canonical stays universal)

CONVENTIONS.md gained "Storybook Story Pattern" section (72 lines) —
covers Pair-rule, primitive + Tier-1 story shapes (incl. Hard Rule #7
scaffold-stage rule), mock-data discipline, render-only-over-args lock,
env-vars gotcha (BvR #8) + canonical fix shape, Pair-rule mechanical
check + BvR #6 count reconciliation.

### Tech Debt Logged

1 new Tech Debt entry at Brief A close — to add to CLAUDE.md's Known
Tech Debt table at Step 11 DESIGN-1 final close (NOT this partial
refresh):

| # (TBD at Step 11) | Source | Description | Defer to |
|---|---|---|---|
| (next) | DESIGN-1 Brief A | Storybook adapter migration from `@storybook/nextjs` (webpack) to `@storybook/nextjs-vite` when [storybookjs/storybook#34688](https://github.com/storybookjs/storybook/issues/34688) closes (`ServerInsertedHTMLContext` export missing in dev mode for Storybook 10 + Next 16 + React 19 + Vite 8 + nextjs-vite framework; production builds unaffected, dev mode unusable) | post-DESIGN-1 / customer-2 onboarding |

The 2 prior decision-needed Step 3 entries (testimonial F2 →
TEMPLATE-REVIEW; service-card-grid F1 → TEMPLATE-SERVICE) remain
pending Step 11 rollup as previously logged.

### Discoveries / Surprises

- **HALT 1 env-vars bug — single root, two surface symptoms.** Tier-1 stories failed with `TypeError: Cannot read properties of undefined (reading 'cn')` at render time; Image primitive's own story failed with `ReferenceError: Cannot access '__WEBPACK_DEFAULT_EXPORT__' before initialization` at processCSFFile. Both cascaded from `src/lib/env.ts`'s Zod parse throwing at module evaluation when `process.env.NEXT_PUBLIC_SANITY_PROJECT_ID` resolved to undefined. The cn-TypeError was the proximate symptom for stories that consumed Image at render; the TDZ was the proximate symptom for Image's own story (the throw halted module evaluation before `const __WEBPACK_DEFAULT_EXPORT__ = {...}` could initialise, and Storybook's CSF processor read the registered `default` getter against the still-uninitialised const). Bundle inspection at `storybook-static/image-stories.2091d001.iframe.bundle.js` revealed both the env-throw site and the cn cascade pattern.
- **Pair-rule mechanical count beats logical count (BvR #6).** Brief literal said "23 stories" (22 logical primitives + Icon foundation). Pair-rule applies per-folder, and C4 Checkbox + C4b RadioGroup ship as separate folders → 24 + Icon = 25 primitive stories. Total Brief A: 25 + 5 Tier-1 = 30 stories, not 28. Mechanical check `find site/src/components/ui -mindepth 2 -name stories.tsx | wc -l` returns the exact integer.
- **Zero fresh BvR findings at Step 5 validates Step 4 Pattern 13.** Brief A surfaced 9 BvR findings during Steps 2/4 (mostly framework gotchas + brief-drafter mental-model gaps). Step 5 (v0.dev template authoring + HALT 2 with 2 clarification edits) produced ZERO new findings. Validates the BvR-velocity-as-brief-quality-metric pattern: Brief A's discipline lessons landed by Step 5 because the brief-drafter learned them by Step 4. Calibration data point for Brief B: low BvR count = lessons landed; high BvR count = new mental-model gaps to harvest.
- **Brief-drafter mental-model gaps cluster.** Across 9 Brief A BvR findings, three cross-cutting gaps emerged that customer-2 brief checklist should bring forward: (a) non-interactive CLI flags (`-y`, `--no-dev`, equivalent) for automation-executed steps; (b) CI/CD-aware commit ordering (commit before deploy, not after); (c) build-vs-runtime correctness for any schema-validated module load. All three invisible until they break, all three cheap to plan around if anticipated.
- **`@storybook/nextjs` framework name suggests parity that doesn't hold.** `next/image` + `next/link` + `next/font` are auto-mocked by the framework (good). But `NEXT_PUBLIC_*` env vars are NOT auto-passed-through to the webpack DefinePlugin (gotcha). Customer-2 capability take-away: when a framework-named adapter ships, audit which Next.js conventions actually inherit and which require explicit config — don't assume parity.

### Final Repo State (Brief A close)

- `migrations.status` = `content_complete` (unchanged; DESIGN-1 does not transition).
- 30 stories on disk (25 primitive + 5 Tier-1 scaffold-stage). `npx tsc --noEmit` clean. `npm run build-storybook` exits 0.
- Storybook live on Vercel at `https://mygratr-cloud-employee-storybook.vercel.app` with Standard Deployment Protection.
- `docs/V0_PROMPT_TEMPLATE.md` + 3 worked examples on disk; HALT 2 clarifications applied.
- CONVENTIONS.md "Storybook Story Pattern" section live.
- `docs/CAPABILITY_LOG.md` extended with 19 productisation IP patterns + 19 customer-2 reusability matrix rows. Brief A officially closed in the file's phase context.
- Customer-2 deploy runbook at `docs/design/storybook-deploy.md` shipped.
- Capability-log running draft at `audit-output/design-1/capability-log-draft.md` (gitignored) preserved as seed for Brief B/C.
- Branch `feat/design-1` even with `origin/feat/design-1` after Brief A close commits (will be +1 after this context-refresh commit lands).

---

## MYGRATR-DESIGN-1 Step 3 — Tier-1 audit + 5 complex-component specs (May 2026)

### Phase context

Step-3-milestone partial entry on an open DESIGN-1 phase. `migrations.status`
remained `content_complete` throughout — DESIGN-1 explicitly does not
transition state per brief §0. Steps 4–11 of DESIGN-1 remain pending;
this entry will be extended in place as those steps land.

5 commits closed Step 3:
- `e54b818` — docs(design-1): step 3a — Tier-1 component inventory locked at HALT 1 (5 components)
- `e82d987` — docs(design-1): step 3b — engage L3 fallback (#5 down-classified to Low; 3b target = #4)
- `00b14f0` — docs(design-1): step 3b — testimonial-swiper-global spec (8-section format-locked at HALT 2)
- `126acac` — docs(design-1): step 3c+3d — Tier-1 specs for #2 / #3 / #5 / #1 (4 specs; HALT 3 closed)
- `c895033` — docs(design-1): step 3 close — Path A propagation (HALT 4)

### What Was Built

**Tier-1 inventory** at `docs/design/TIER_1_INVENTORY.md` v1.0 — 5 components locked (1 High + 3 Medium + 1 Low) within the brief estimate range of 5–10:

| # | Component | Scope | Live URL | Complexity | Tech stack |
|---|---|---|---|---|---|
| 1 | Section fade-reveal cascade | GLOBAL (14 templates) | sitewide | High | GSAP attribute-selector orchestration |
| 2 | Hero scale-in animation | HOME | `/` | Medium | GSAP fromTo (single-property) |
| 3 | Sticky nav transition | GLOBAL | sitewide | Medium | GSAP ScrollTrigger + plain JS handler |
| 4 | Testimonial Swiper carousel | GLOBAL (HOME, /reviews, /services) | various | Medium | Swiper 11 |
| 5 | Service card-grid hover-reveal | SERVICE landing | `/services` | Low (down-classified at HALT 1 L3) | CSS-only |

**5 × 8-section specs** at `docs/design/components/{slug}.md`:

| Spec | Lines | Schema-vs-reality findings |
|---|---|---|
| `section-fade-reveal-global.md` | 216 | 3 (1 resolved at HALT 3 via Path A; 2 template-fallback) |
| `nav-sticky-transition-global.md` | 198 | 2 (1 template-fallback; 1 N/A render-discipline note) |
| `testimonial-swiper-global.md` | 180 | 2 (1 schema-relax → STATIC-1/SCHEMA-2; 1 decision-needed → TEMPLATE-REVIEW) |
| `service-card-grid-hover-reveal.md` | 165 | 2 (1 decision-needed → TEMPLATE-SERVICE; 1 template-fallback) |
| `home-hero-scale-in.md` | 135 | 0 |

**Capture-asset directory tree skeleton** at `docs/design/components/_assets/{slug}/{screenshots,recordings}/` — 5 component dirs × 2 leaf dirs = 10 leaf dirs (empty at HALT 4; populated during TEMPLATE-* phases).

**Capability-log-draft additions** at `audit-output/design-1/capability-log-draft.md` (gitignored) — +32 lines, 6 productisation-IP entries under new "Step 3 — Tier-1 audit + complex-component specs" section. Consolidated into canonical `docs/CAPABILITY_LOG.md` at this Step 11 partial refresh per Jake's direction (don't wait for Step 9).

### Files Created

```
docs/design/TIER_1_INVENTORY.md                                            (NEW)
docs/design/components/section-fade-reveal-global.md                       (NEW; 3d stress-test)
docs/design/components/home-hero-scale-in.md                               (NEW; 3c batch)
docs/design/components/nav-sticky-transition-global.md                     (NEW; 3c batch)
docs/design/components/service-card-grid-hover-reveal.md                   (NEW; 3c batch)
docs/design/components/testimonial-swiper-global.md                        (NEW; 3b first-spec)
docs/design/components/_assets/{section-fade-reveal-global,
  home-hero-scale-in, nav-sticky-transition-global,
  testimonial-swiper-global, service-card-grid-hover-reveal}/
  {screenshots,recordings}/                                                (10 leaf dirs)
```

### Files Modified

```
docs/briefs/active/MYGRATR-DESIGN-1-STEP-3_BRIEF_v1.1.md                   (committed at 7ec77f4 by Jake)
audit-output/design-1/capability-log-draft.md                              (gitignored; +32 lines)
```

### HALTs Landed (4 of 4)

- **HALT 1 — Tier-1 inventory eyeball.** 4 lock decisions captured: L1 globals stay as Tier-1 (not Step-4 utility lane); L2 3d stress-test = #1 section-fade-reveal (evidence > working hypothesis); L3 #5 accepted as Medium-pending-DevTools-verification with #4 fallback; L4 #1 stays as Tier-1 (not utility). Inventory: 5 components.
- **HALT 2 — first-spec format-lock.** 6 format locks captured on `testimonial-swiper-global.md`: 8 mandatory sections, §4 Timing provenance per-spec adapting to tech stack, §3 Tech stack lists ALL primitives (no cap), §6 Data binding requires field paths AND GROQ query shape, Schema-vs-reality findings as separate trailing section with enum-tagged resolution direction, TBD-pending-capture pattern OK at first-spec. **Finding-1 correction landed:** testimonial spec F1 (5-star rating) revised from `decision-needed` to `schema-relax` (add `review.rating: number` in STATIC-1/SCHEMA-2; hardcoded fallback would be CE-specific scope bleed against productisation IP).
- **HALT 3 — stress-test format finalisation.** Path A mechanical trigger approved for §6 GROQ-mandate edge case: spec may declare "N/A — render utility" ONLY when component does not touch Sanity data anywhere. Removes per-author judgment ambiguity. `section-fade-reveal-global.md` qualifies cleanly (orchestration utility, no data).
- **HALT 4 — Step 3 final close.** 3 decisions captured: (1) Option B for capability-log-draft.md commit-config (stays gitignored — brief-vs-reality finding: structural rule wins over brief literal); (2) both decision-needed findings deferred with explicit phase pins (testimonial F2 → TEMPLATE-REVIEW; service-card-grid F1 → TEMPLATE-SERVICE), log as Tech Debt at Step 11 DESIGN-1 close; (3) commit message edits applied (drop the audit-output line; add capability-log-draft existence pointer line for Step 9 consolidation).

### Patterns Established

5 new patterns captured (see CONVENTIONS.md updates + CAPABILITY_LOG.md Step 3 section):

1. **Tier-1 Component Spec Pattern** — 8-section mandatory format; per-component spec at `docs/design/components/{slug}.md`. Verifier asserts file structure at Step 10.
2. **5 §4 Timing Provenance Shapes** named explicitly: library-mediated, GSAP-clean, GSAP-mixed, CSS-only, GSAP-attribute-selector orchestration. Per-spec authoring picks the matching shape; copy-paste boilerplate destroys the section's purpose.
3. **Render-Utility Classification** — third component category alongside primitive (Step 2) and Tier-1 component (Step 3). Tier-1 specs that orchestrate without composing primitives and without touching Sanity data. Live outside `site/src/components/ui/`.
4. **Path A Mechanical Trigger** for §6 GROQ-mandate — "does this component touch Sanity data? if yes → GROQ + field paths required; if no → N/A — render utility allowed." Removes ambiguity.
5. **Brief-vs-reality finding** — parallel discipline to schema-vs-reality. When brief literal conflicts with structural rule (gitignore, framework convention, etc.), structural wins. Surfaced at HALT 4 via the audit-output/ gitignore vs brief 3f.d "git add capability-log-draft.md" tension.

### Tech Debt Logged

2 Tech Debt entries to add at Step 11 DESIGN-1 close (NOT this partial refresh — the Step 11 tech-debt rollup happens at end-of-DESIGN-1):

| # (TBD at Step 11) | Source | Description | Defer to |
|---|---|---|---|
| (next) | DESIGN-1 Step 3 | Sibling `.swiper.testimonies` variant on `/reviews` (prev/next arrows + dynamicBullets + no autoplay; distinct from `.swiper.company-testimonies` autoplay variant) — same-component-prop-driven vs separate spec | TEMPLATE-REVIEW |
| (next+1) | DESIGN-1 Step 3 | `service.folds[0].subhead` description-preview projection accuracy — confirm CE editorial puts preview-quality copy in fold 0 vs adding `service.descriptionPreview: text` field | TEMPLATE-SERVICE |

### Discoveries / Surprises

- **Brief speculation vs probe truth.** v1.1 brief candidate list named "TECHNOLOGY filter grid" as a Tier-1 candidate. Live-site probe on `/technology` confirmed **no filter UI exists** — alphabetical 150-card list, no chips/dropdowns/search/tabs. Lesson: brief candidate categories are hypotheses to verify, not facts to spec from. Same probe-first dismissal protocol from Step 2 HALT 10 applied at inventory-walk time.
- **Audit-walk Explore agent over-listed.** Agent surfaced 10 candidates; critical review removed 5 (TECHNOLOGY filter grid speculative; FAQ/SERVICE/COMPARE accordions just A5 primitive use; team-bio "toggle" actually a page link to `/team/[name]`; Hotjar/Clara/GeoTargetly third-party scripts; Calendly third-party iframe). Agents over-list because they don't apply the Tier-1-mechanism vs primitive-use distinction. Budget time for "candidate refinement" between agent walk and inventory lock.
- **HOME hero scale-in is Medium, not High.** gsap-home.json shows `gsap.fromTo('img.hero-img.align-top', { scale: 1.2 }, { scale: 1, duration: 1.5, ease: 'power2.out' })` — single property, single timeline, single element. Initially flagged as High by the audit-walk agent based on "hero" framing; actual GSAP capture shows contained single-fromTo. Per HALT 1 lock L2, evidence wins over working hypothesis (v1.1 audit patch A2 — role not identity). Stress-test target shifted to #1 section-fade-reveal-global which is the true highest-complexity surface.
- **#5 service-card-grid down-classified at HALT 1 L3 probe.** DevTools-equivalent CSS inspection on `/services` confirmed pure CSS hover transitions: `transform: translateY(-16px)` + box-shadow + padding-left grow + arrow icon swap. No JS state machine; no library; no multi-stage timeline. Per brief criteria ("Low — interactive but mostly CSS / single-axis transitions"), this is Low not Medium. L3 fallback engaged: 3b first-spec target shifted from #5 to #4 testimonial-swiper-global. #5 stays in Tier-1 inventory at Low complexity.
- **Library-mediated components stress-tested format cleanly.** Testimonial Swiper carousel (3b first-spec) tested the §4 Timing provenance section's adaptability to non-GSAP tech stacks. Provenance paragraph cleanly states "Library-mediated, not GSAP-driven. Shim does not capture Swiper internals — structural gap, not F10/F11/F12 failure." This is the productisation pattern: provenance adapts to tech stack rather than copy-pasting GSAP language.
- **Brief-vs-reality finding emerged at HALT 4.** Brief 3f.d literal instruction (`git add audit-output/design-1/capability-log-draft.md`) conflicts with `audit-output/` gitignore rule per CLAUDE.md. Resolution: structural rule wins. Same logic as schema-vs-reality. New productisation pattern named.

### Final Repo State (Step 3 close)

- `migrations.status` = `content_complete` (unchanged; DESIGN-1 does not transition).
- 5 Tier-1 component specs committed under `docs/design/components/`. tsc + build clean.
- TIER_1_INVENTORY.md locked at v1.0 with 5 components.
- Capture-asset directory tree skeleton ready (empty; populated during TEMPLATE-*).
- 2 decision-needed findings deferred with phase pins (TEMPLATE-REVIEW, TEMPLATE-SERVICE) — log as Tech Debt at Step 11.
- Capability-log running draft at `audit-output/design-1/capability-log-draft.md` (gitignored) extended with Step 3 productisation IP. Consolidated into `docs/CAPABILITY_LOG.md` at this partial refresh per Jake's direction.
- Branch `feat/design-1` 11 commits ahead of `origin/feat/design-1` after Step 3 close commits (will be 12 after this post-Step-3 refresh commit). Not pushed.

---

## MYGRATR-DESIGN-1 Step 2 — 22 primitives + Icon system + HALT 10 accordion correction (May 2026)

### Phase context

Step-2-milestone partial entry on an open DESIGN-1 phase. `migrations.status`
remained `content_complete` throughout — DESIGN-1 explicitly does not
transition state per brief §0 (no `design_running` / `design_complete` in
`pipeline/state-machine.ts`; DESIGN-1 operates against the
`content_complete` state without transitioning out of it). Steps 3–11 of
DESIGN-1 remain pending; this entry will be extended in place as those
steps land.

Two commits closed the Step-2 milestone:
- `e761a76` — feat(design-1): Step 2 — 22 primitive components + Icon system
- `4c0514f` — fix(design-1): A5 Accordion — restore CE plus/× icon pattern (HALT 10)

### What Was Built

**22 brand-inventory primitives** under `site/src/components/ui/{name}/index.tsx`
(folder-per-primitive per v2.0 supersession of v1.5's flat shape):

| Category | Primitives |
|---|---|
| A — Foundation | A1 Button, A2 Link, A3 Tag, A4 Card, A5 Accordion, A6 Marquee |
| B — Typography | B1 Heading, B2 Text, B3 PortableText |
| C — Forms | C1 Input, C2 Textarea, C3 Select, C4a Checkbox, C4b RadioGroup, C5 FormField, C6 HubSpotFormEmbed |
| D — Overlays | D1 Dialog, D2 Tooltip, D3 DropdownMenu, D4 Toast |
| E — Media + Layout | E1 Image, E2 VideoEmbed, E3 Container, E4 Divider |

**Icon foundation primitive** at `site/src/components/ui/icon/index.tsx` —
sprite-served from `/icons/sprite.svg` with typed `IconName` union of 9
CE-derived glyphs (`menu`, `copy-link`, `linkedin`, `linkedin-filled`,
`x-twitter`, `facebook`, `chevron-right`, `close`, `more-vertical`).
Probe-driven from a candidate pool of 70+ via `probe-icon-inventory.mjs`
+ `icon-classification.json`. Sprite source-of-truth at
`site/src/components/ui/_icons/sprite.svg`; copied to public asset path
via `scripts/design/emit-icon-sprite.mjs`.

**21 probe scripts** at `scripts/design/probe-*.mjs` capturing CE-source
patterns: `accordion-chevron`, `accordion-marquee-styles`,
`blockquote-mobile`, `blockquote-styles`, `button-styles`, `card-styles`,
`checkbox-radio-textarea`, `container-styles`, `divider-styles`,
`eyebrow-styles`, `heading-styles`, `hubspot-embed`, `hubspot-mounted-dom`,
`icon-inventory`, `image-quality`, `image-styles`, `input-styles`,
`link-tag-styles`, `richtext-styles`, `text-styles`, `video-embeds`. Each
emits a JSON file under `audit-output/design-1/` consumed by the
corresponding primitive's source comment for probe-driven decisions.

**1 Sanity image-builder verify script** at
`scripts/design/verify-sanity-image-builder.mjs`.

**`docs/design/COMPONENTS.md`** (806 lines) — single-source primitive
inventory for Step 4 template authors. Front-matter covers layout-root
providers, react-hook-form integration patterns, Sanity-data shapes,
PortableText handoffs, icon sprite reference, token quick-lookup. One
table row per primitive with path, type, deps, variants, migration
improvement, usage notes. Per-primitive source comments document
probe-driven decisions and capability-log items.

**`/demo` kitchen-sink route** at `site/src/app/demo/page.tsx` —
production-guarded, dev-only visual reference. Renders all 22 primitives
+ ~200+ mutation test cases on one page. Confirmed at HALT 10 visual
eyeball. NOT included in production builds.

**`docs/CAPABILITY_LOG.md` (NEW)** — root-level capability log doc per
brief §Step 9. Token-system architecture entry (consolidates Step 0+1
running draft from `audit-output/design-1/capability-log-draft.md`) +
10 categorical primitive patterns harvested from Step 2 + 4
HALT-discipline patterns captured at HALT 10. Steps 3–8 sections
present as `TBD` placeholders for future extension.

### Files Created

```
docs/CAPABILITY_LOG.md                                          (NEW)
docs/design/COMPONENTS.md                                       (806 lines)
docs/design/TOKENS.md                                           (Step 1 carryover; amended)
site/src/components/ui/_icons/icon-names.ts                     (typed IconName union)
site/src/components/ui/_icons/sprite.svg                        (source-of-truth)
site/src/components/ui/_utils/cn.ts                             (clsx + tailwind-merge)
site/src/components/ui/{22 primitives}/index.tsx                (folder-per-primitive; 25 source files counting C4 split into Checkbox + RadioGroup)
site/src/components/ui/icon/index.tsx                           (Icon foundation)
site/public/icons/sprite.svg                                    (emitted from source)
site/src/app/demo/page.tsx                                      (kitchen-sink)
scripts/design/build-icon-sprite.mjs
scripts/design/emit-icon-sprite.mjs
scripts/design/refetch-full-svgs.mjs
scripts/design/check-probe-doc-cleanup.mjs
scripts/design/verify-sanity-image-builder.mjs
scripts/design/probe-{21 probes}.mjs
audit-output/design-1/{probe outputs}.json
audit-output/design-1/icon-classification.json
audit-output/design-1/icon-inventory.json
```

### Files Modified

```
site/src/app/tokens.css                                         (DEV-13/14/20/24 amendments)
site/src/app/layout.tsx                                         (TooltipProvider + ToastProvider mount)
site/src/lib/env.ts                                             (DEV-23 amendment)
site/src/components/ui/accordion/index.tsx                      (HALT 10 — chevron → plus/× pattern; commit 4c0514f)
```

### Patterns Established

10 categorical primitive patterns + 4 HALT-discipline patterns documented
in `docs/CAPABILITY_LOG.md`. Summary:

**Primitive patterns (1–10):** hand-built atop @radix-ui (no shadcn);
CVA-standardised variant API; no-className-variants rule; SVG sprite
for icons; GSAP banned from primitives; probe-first discipline (Hard
Rule #2); per-primitive folder structure; inline source-comment as
primitive-level spec; layout-root provider mount; form integration
split (register-based vs Controller-based via FormField smart wrapper).

**HALT-discipline patterns (11–14):** probe-first dismissal protocol
(burden of proof on dismissal, not adoption); HALT 10 visual eyeball
as last-line defense; browser cache trap during HALT 10; demo route
width misalignment is a layout-context observation, not a primitive
bug.

### Tech Debt Logged

None new. #16 (`customerStory.companyLogo` required-field violation)
and #17 (10 doc types not yet scanned for migrator-pattern null
literals) carried forward.

### Discoveries / Surprises

- **The accordion HALT 10 catch.** Original HALT 2 batch shipped
  A5 Accordion with `chevron-right` rotation, framed in the source
  comment as "migration improvement over CE's plus/minus toggle
  (likely Webflow component template artifact)". HALT 10 visual
  eyeball + a probe of /services and /technology raw HTML confirmed
  CE's pattern is **plus → × in 24px black circle**, custom-named
  classes (`faq-btn`, `line-1`, `line-2`, `toogle-top`) — sitewide,
  intentional brand design, not a Webflow artifact. The original
  framing was speculation, not evidence; the dismissal was wrong.
  **DEV-12 retroactive correction** captures this: Hard Rule #2
  visual fidelity overrides "modern convention" assumptions when a
  custom-named class (not `w-*`) signals intentional brand design.
  Fix landed in commit `4c0514f`: literal hex `bg-[#0e100f]` on a
  24×24 rounded-full span containing two `h-px w-3 bg-surface-elevated`
  spans (one default-horizontal, one `rotate-90`-vertical), with
  `group-data-[state=open]:rotate-45` on the parent to morph + into ×.
  Inline cubic-bezier easing `(.165,.84,.44,1)` matches CE's
  `.faq-btn` transition exactly. No sprite addition; no token
  addition (no near-black token exists; `brand-tertiary` is navy
  `#223c6c`, `text-default` is `#212121`, neither matches CE's
  `#0e100f`; literal hex was the right call for one-off use).
- **The marquee placeholder-logo non-bug.** /demo route renders
  marquee with placeholder text instead of customer logos. This is
  acceptable for HALT 10 / kitchen-sink demo purposes — the demo
  validates primitive behaviour (scroll, pause-on-hover, item
  rendering), not brand-asset fidelity. Real customer logo SVGs
  are a Step 4 (template-level) concern. Added to Step 4 prep
  checklist: logo SVG asset gathering required before HOME /
  customer-facing template builds.
- **Demo accordion width.** Demo accordion appears wider than CE's
  FAQ section because the demo renders inside the full kitchen-sink
  Container. CE wraps FAQs in a narrower section column. This is
  correct primitive behaviour — width is parent-controlled. Step 4
  templates will wrap accordions in `Container width='narrow'` or
  a max-width-constrained section per CE's measured FAQ-column
  widths.

### Final Repo State (Step 2 milestone)

- `migrations.status` = `content_complete` (unchanged; DESIGN-1 does
  not transition).
- `migrations.metadata.content_phase.content_migrations_rows` = 42
  (refreshed from 38 at Step 0a per brief I5).
- 22 primitives + Icon foundation = 23 components live under
  `site/src/components/ui/`. tsc + build clean.
- `docs/CAPABILITY_LOG.md` exists at `docs/` (path per brief §Step 9
  line 2097). Token-system + primitive-pattern + HALT-discipline
  sections complete; Steps 3/4/5/6/8 sections marked TBD.
- DESIGN-1 verifier (`tools/qa/verify-design-1.ts`) NOT YET written —
  Step 10 deliverable. Manual checks for Step 2 scope are tsc + build
  clean (verified) + HALT 10 visual eyeball (confirmed).

---

## MYGRATR-CONTENT-1D-CLEANUP — Migrator-pattern null-image-field unsets (May 2026)

### Brief Deviation DEV-6

This is a post-phase patch on a closed CONTENT-1D — `migrations.status`
remained `content_complete` throughout. The deviation: applying writes
against the closed-phase scope while the context was fresh, rather than
deferring all 158+100 corrections to a future TEMPLATE-* phase. Rationale
for inline application:

- Tech Debt #14 had been documented as inert during CONTENT-1D
  post-phase, but the scope-expansion check (read-only) showed the
  migrator pattern affected 158 top-level + 100 nested fields across 3
  doc types — large enough that deferring meant carrying a substantial
  block of editorial-noise tech debt past the closed phase.
- The fix is mechanical (unset null literals) and idempotent.
- Per-doc guard discipline mirrors the CONTENT-1D Op-pattern (DEV-3
  through DEV-5), so the safety story is identical.
- The bug's root cause (a migrator-pattern habit of writing
  `field: null` rather than conditionally spreading) is a learn-once
  CONVENTIONS.md update; we want it captured before customer-2's first
  migration pass.

### Root Cause — Migrator Pattern That Wrote Null Literals

CONTENT-1A/1B/1C migrators uniformly wrote image-typed Sanity fields
via:

```typescript
const doc = {
  // ...
  thumbnail: await uploadImage(f['thumbnail']),    // ← null when
                                                    //   Webflow source
                                                    //   field is empty
  // ...
}
await sanityWriteClient.createOrReplace(doc)
```

`uploadImage(field)` (defined in `src/lib/content/migration-helpers.ts`)
returns `null` when the Webflow input is empty/missing. The migrator
took that null and wrote it into the doc literal under a key the schema
declares as `image`. Sanity's strict validation flags this combination
("schema says image, value is null") with "Invalid property value — The
property value is stored as a value type that does not match the
expected type". The fix-after-the-fact is to unset the null literals so
the field is *absent* (Studio is happy with absent for an optional
image field). The fix-going-forward (CONVENTIONS.md update below) is to
use conditional spread instead of writing null:

```typescript
// CORRECT pattern — field absent on doc when source is empty
const thumbnail = await uploadImage(f['thumbnail'])
const doc = {
  // ...
  ...(thumbnail ? { thumbnail } : {}),
  // ...
}
```

Worst offender: `migrate-customer-stories.ts:143` — the CONTENT-1C
customerStory migrator EXPLICITLY wrote `openGraphImage: null` for
every doc, ensuring every customerStory tripped the warning even
though the schema already accepts an absent value as the empty state.

### Scope Across 3 Doc Types

Read-only scope check (`scripts/content/diag-1d-cleanup-scope.ts`)
enumerated:

| Doc type | Field (top-level) | Required? | null-literal docs |
|---|---|---|---|
| service | thumbnail | no | 23/23 |
| technology | techLogo | no | 2/101 |
| technology | thumbnail | no | 101/101 |
| customerStory | companyProductImage | no | 5/17 |
| customerStory | thumbnail | no | 10/17 |
| customerStory | openGraphImage | no | 17/17 |

Plus **100 nested entries** in `technology.folds[].featuredImage` (the
fold object's optional image was set to null by `migrate-technology.ts`
when the Webflow `fold-1---featured-image` was empty; `foldHasContent()`
kept the fold alive because of header/paragraph/bullet content).

Two scope deviations from the original Tech Debt #14 prediction were
surfaced and routed to separate cycles:

- **`customerStory.companyLogo` required-field violation** on
  `customerStory-68754c657697d163dd1a6126` ("Travel Tech Client" — an
  anonymised real customer, not a placeholder shell). The Webflow
  source for company-logo is 16/17 populated; the 1 missing item is
  intentionally anonymised. Schema declares `Rule.required()` and the
  doc holds a literal null, which is a real schema violation.
  Deferred to its own investigation cycle for a schema-side fix
  (relax `Rule.required()` to optional, add a template fallback for
  anonymised customers).
- **Other 9 doc types** (teamMember, review, bookACall, video, event,
  tool, download, benefitValue, staffBenefit, blogPost, compareBlog)
  not surveyed. May carry the same migrator pattern. Deferred for a
  separate read-only diagnostic.

### What Was Built

**Step 1 — Read-only scope check (already on `main`):**

`scripts/content/diag-1d-cleanup-scope.ts` enumerates every
schema-declared image field per type, fetches each doc fully, and
classifies each value as `absent` / `null` / `valid-image` / `invalid`.
Critically, it disambiguates "null literal stored" from "field absent"
by walking the raw doc shape — GROQ projection conflates the two.
Cross-references `audit-output/ce-field-population.json` for Webflow
source attribution. Reusable for customer-2+ migrations.

**Step 2 — Op C path-patch syntax probe (read-only, no commit):**

`scripts/content/probe-path-patch-syntax.ts` picks one technology doc
known to have `folds[].featuredImage: null`, constructs the unset patch
via `sanityWriteClient.patch(id).unset([...])`, calls
`PatchBuilder.toJSON()` to inspect the serialised payload — and stops
there. Verified that `@sanity/client` accepts the path syntax
`folds[_key=="fold-1"].featuredImage` and emits the expected
`{ id, unset: [<paths>] }` shape. **Probe before destructive primitives
that haven't been exercised in this codebase yet** is now an established
pattern (see CONVENTIONS.md "Path-Patch Primitive" section).

**Step 3 — 4 cleanup ops + per-doc guards:**

- `cleanup-service-null-thumbnail.ts` (Op A) — 23 service docs;
  `_type === 'service'` AND `thumbnail === null literal` →
  `.unset(['thumbnail'])`.
- `cleanup-technology-null-image-fields.ts` (Op B) — 101 technology docs;
  atomic per-doc patches covering 1–2 fields; per-doc literal-null
  assertion AND scope-membership consistency check (catches drift if
  scope expanded since scope check).
- `cleanup-technology-null-folds-featured-image.ts` (Op C) — 100
  technology docs; walks each doc's `folds[]`, collects `_key`s of
  in-scope entries (`'featuredImage' in fold` AND `featuredImage === null`),
  validates each `_key` is a non-empty string, builds an atomic patch
  per doc with all collected paths.
- `cleanup-customerstory-null-image-fields.ts` (Op D) — 17 customerStory
  docs; atomic per-doc patches covering 1–3 fields. `openGraphImage`
  unset on every doc (universal); `thumbnail` and `companyProductImage`
  unset conditionally with literal-null assertions. **`companyLogo`
  explicitly NOT touched.**

Halt-on-first-guard-failure semantic per Op: a literal-null assertion
mismatch on any doc fires `process.exit(1)` after writing a
`status='failed'` audit-trail row. Cross-op orchestration: subsequent
ops do NOT run if an earlier op exited non-zero. **Recovery is
"re-run the phase from scratch"** — re-do the scope-check, build a
fresh plan, re-authorise.

**Step 4 — Path-patch primitive established in code:**

```typescript
client.patch(id).unset([
  `folds[_key=="${k1}"].featuredImage`,
  `folds[_key=="${k2}"].featuredImage`,
]).commit()
```

`@sanity/client`'s path-patch syntax addresses array elements by their
`_key` rather than positional index — robust against array reordering.
The guard MUST validate `_key` is a non-empty string before constructing
the path; otherwise the patch silently no-ops or targets the wrong
element.

### Files Created (5 + diagnostics already on main)

```
scripts/content/cleanup-service-null-thumbnail.ts
scripts/content/cleanup-technology-null-image-fields.ts
scripts/content/cleanup-technology-null-folds-featured-image.ts
scripts/content/cleanup-customerstory-null-image-fields.ts
scripts/content/probe-path-patch-syntax.ts
```

### Files Modified

- `scripts/content/verify-content-1d.ts` — check #8 row-count relaxed
  from `===` to `>=`. The ALL_NEW_1D_SLUGS-membership check still
  enforces every CONTENT-1D row is present; the floor check tolerates
  growth from post-phase patches.
- `package.json` — 5 new npm scripts (4 cleanup ops + probe).
- `scripts/content/diag-tech-debt-14-service-nulls.ts` +
  `diag-1d-cleanup-scope.ts` — pre-existing TS narrowing fix on
  `T | T[]` JSON parse.

### Final Data State

- **0 null-literal entries** on the 6 in-scope top-level fields across
  service, technology, customerStory.
- **0 null-literal entries** in `technology.folds[].featuredImage`.
- **1 null-literal entry remains:** `customerStory.companyLogo` on
  `customerStory-68754c657697d163dd1a6126` (deferred — separate cycle).
- `content_migrations` total CE rows: **42** (38 CONTENT-1D + 4
  CONTENT-1D-CLEANUP). All `status='complete'`, `parity_score=100`.
- `migrations.status` unchanged: `content_complete`.
- `metadata.content_phase` block unchanged (`total_cms_docs: 388`,
  `smoke_test_docs_remaining: 0`); `content_migrations_rows: 38` is now
  stale-but-low (actual is 42); chose not to re-run the state
  transition just to refresh metadata.

### Patterns Established (for CONVENTIONS.md)

- **Migrator field-write conditional-spread rule.** Migrators that read
  an optional source field and may produce null MUST omit the field via
  conditional spread rather than writing null into the doc literal.
- **Path-patch primitive for nested array-of-object fields.**
  `_key`-addressed unset shape with `_key`-validation guard. Probe
  syntax via `PatchBuilder.toJSON()` before any destructive use.
- **Floor-check for content_migrations row count.** Verifier check #8
  uses `>=` rather than `===` so post-phase patches add rows without
  breaking the verifier; membership-set check still enforces every
  in-phase row is present.

### Tech Debt Resolution

- **#14 (CONTENT-1D)** — RESOLVED 2026-05-02 via this cleanup phase
  for the scoped {service, technology, customerStory} types.

### Tech Debt Logged

- **#16 (CONTENT-1D-CLEANUP)** — `customerStory.companyLogo` required-
  field violation on `customerStory-68754c657697d163dd1a6126` (Travel
  Tech Client). 1 doc; anonymised customer; intentional missing logo.
  Recommended fix: schema-side — relax `Rule.required()` to optional,
  add a template fallback (anonymised placeholder logo) for any doc
  where companyLogo is absent. Deferred to separate cycle.
- **#17 (CONTENT-1D-CLEANUP)** — Other 9 doc types (teamMember,
  review, bookACall, video, event, tool, download, benefitValue,
  staffBenefit, blogPost, compareBlog) not surveyed for the same
  migrator-pattern null-literal issue. Inert until Studio surfaces
  warnings or render-time issues appear. Resolution: optional
  follow-up read-only diagnostic + per-type cleanup if needed.

### Discoveries / Surprises

- **`customerStory.openGraphImage` was the worst offender** (17/17
  null literal) because `migrate-customer-stories.ts:143` explicitly
  wrote `openGraphImage: null` rather than omitting the key. Same
  pattern but more visible than the other migrators which simply
  didn't include the key in the doc literal.
- **Verifier check #8 needed updating** post-cleanup. The original
  CONTENT-1D verifier hard-coded `=== 38` total rows; adding 4 audit
  rows tripped it. Floor-check (`>=`) is the correct semantic for a
  closed-phase verifier facing post-phase patches.
- **One technology doc (`technology-685d6a68391b571d12d62ccf`) was
  already clean** at the fold level (Op C reported `alreadyClean=1`)
  — most likely it had `featuredImage` populated (one of the 2 docs
  in TECHLOGO_NULL_IDS is also in this small subset, plausibly the
  same doc).

---

## MYGRATR-CONTENT-1D — Meta Backfills + Carryover Fixes + content_complete (May 2026)

### What Was Built

**Step 0.1 — Token scoping (`src/lib/env.ts`, `src/lib/content/sanity-write-client.ts`, `.env.example`):**

- Added `SANITY_MIGRATION_WRITE_TOKEN` (least-privilege, single-dataset
  `production`, document patch + delete + asset upload only — no
  project-admin / no all-datasets) to env schema.
- Added `SANITY_API_READ_TOKEN` to env schema (always expected absent
  in migration script context).
- New `ensureSanityMigrationWriteToken()` helper throws if write token
  missing OR if `SANITY_API_READ_TOKEN` is also present.
  `sanity-write-client.ts` calls this at module load — every CONTENT-1D
  script that imports `sanityWriteClient` triggers the assertion.
- Legacy `SANITY_API_TOKEN` retained for SCHEMA-lane seed scripts
  (`scripts/schema/seed-singletons.ts`, `smoke-test-seed.ts`) which
  create their own clients locally; out of scope for CONTENT-1D's
  least-privilege migration.
- Token rotation post-1D tracked as Tech Debt — **MUST resolve
  before MYGRATR-LAUNCH** (Exit Criterion #10).

**Step 0a — Retroactive §7.2 source-tracking + split per-field
provenance (6 schemas + 6 Zod twins):**

- 4 schemas (`customer-story`, `team-member`, `review`, `book-a-call`)
  lacked the §7.2 source-tracking triplet. Added via new
  `sourceTrackingFieldsCarryover()` helper in `studio/schemas/_shared.ts`:
  `source` and `generatedAt` are `hidden: true` and NOT required
  (F18 — `initialValue` does NOT retroactively populate existing docs;
  marking required would fail validation on every existing doc),
  `needsReview` is visible (drives Seb's review queue).
- All 6 in-scope schemas (above 4 + `technology` + `service`) gained
  `metaTitleSource` and `metaDescriptionSource` via new
  `metaSourceFields()` helper. Both are hidden `object` types with
  `provider`, `scrapedAt`, `url` sub-fields. Splitting per-field
  (vs single `metaSource`) is required because review docs may have
  title from live-scrape AND description from snippetForMeta-copy —
  a single object can't represent both accurately (F21).
- Zod twins extended with new optional schemas in
  `src/types/sanity/shared.ts`: `MetaSourceFieldsSchema` and
  `SourceTrackingFieldsCarryoverSchema` (all fields optional). Each of
  the 6 doc twin files (`technology.ts`, `service.ts`, `customer-story.ts`,
  `team-member.ts`, `review.ts`, `book-a-call.ts`) imports + merges the
  appropriate combo. Top-of-file comment in each carryover twin:
  *"Pre-CONTENT-1D docs have source: undefined despite initialValue.
  See Finding F18."*
- Studio production deploy at
  `https://mygratr-cloudemployee.sanity.studio/` (first-ever deploy;
  hostname `mygratr-cloudemployee` chosen by user). `appId` pinned in
  `studio/sanity.cli.ts` for non-interactive future deploys.
- Hard ordering gate (F22): every meta-backfill script carries a
  top-of-file `// HARD GATE` comment forbidding execution before
  Studio deploy + Seb confirmation. Applied: Seb confirmed
  `needsReview` toggle visible on all 4 carryover doc types in his
  Studio session before Steps 5–7 ran.

**Step 0.2 + 0a.2 — Pre-flight verifier
(`scripts/content/verify-content-1d-prereqs.ts`):**

- 32 checks across 8 categories: token presence/absence, migration
  state, doc counts per type with smoke-test exclusion (F9), live
  scrape scope build + plausibility guard, UNKNOWN URL overlap with
  in-scope routes, smoke-test doc existence + reference graph,
  Playwright availability, ESLint-equivalent forbidden-import grep
  on `scripts/**` and `src/lib/content/**` (F14 — runtime token
  assertion is the load-bearing guard; the grep catches wrong
  imports at edit time without adding ESLint as a root devDep), and
  Step 0a schema/Zod field-presence (helper-based wiring accepted —
  greps for the helper invocation OR a direct field declaration).

**Step 1 — `urlForDoc` + canonical assertion
(`src/lib/content/url-builder.ts`, `scripts/content/test-url-builder.ts`):**

- `urlForDoc({_type, slug})` switch over the 6 in-scope types using
  routes from `MYGRATR_SCHEMA_DESIGN_DECISIONS.md §10`. Throws on
  unsupported `_type` and on empty `slug.current`.
- Two-tier test: Tier 1 (HARD) round-trips hardcoded known-good slugs
  from the audit canonical set — confirms `urlForDoc` semantics
  independent of Sanity data quality. Tier 2 (INFO) walks every
  Sanity doc per type and reports drift coverage; tier 2 surfaces 32
  conservative drift candidates (5 technology, 9 customerStory, 17
  review, 1 bookACall) but the live scrape later resolved most as
  true HTTP 200 — only 16 turned out to be real drift.

**Steps 2 + 3 — Playwright meta scraper + normaliser
(`src/lib/content/meta-scraper.ts`, `meta-normaliser.ts`):**

- `scrapeMeta(browser, url)` with `waitUntil: 'domcontentloaded'`,
  20s per-page timeout, custom User-Agent
  (`Mygratr-MetaBackfill/1.0`). Returns HTTP status + raw title + raw
  description + scrapedAt + optional errorMessage. Non-200 returns
  null meta with status preserved (drift handled gracefully).
  `withBrowser(fn)` factory ensures clean browser lifecycle.
- `normaliseMeta({rawTitle, rawDescription})` strips 6 brand-suffix
  variants ("| Cloud Employee", etc.), enforces 60/140-160 length
  compliance, truncates at word boundary via `truncateAtWord` with
  the F17 whitespace-prefix fallback (never returns empty for
  non-empty input). Hard rule: never pad / fabricate a description
  to hit 140 chars — short is recoverable in Studio, fabricated is
  not. Warnings split into `titleWarnings` and `descriptionWarnings`
  so the runner can apply only relevant warnings to
  `shouldFlagForReview` (the never-touch path on bookACall is
  insulated from description-side warnings).

**Step 5 — Shared backfill runner
(`src/lib/content/meta-backfill-runner.ts` + 6 thin per-collection
scripts):**

- `runMetaBackfill({type, policy, collectionSlug, preScrapeHook})`
  enforces every CONTENT-1D structural protection in one place:
  - **F1** phase-wide 20-min wall-clock abort gate, hard
    `process.exit(1)` (NOT break) — failure row written before exit.
  - **F4** monotonic `needsReview` (omitted from patch when
    computed false; never overwrites prior `true`).
  - **F5** `metaTitle` never written empty (omitted on null/empty;
    verifier catches it).
  - **F6** `FieldPolicy.description: 'never-touch' | 'scrape-always' |
    'snippet-copy-else-scrape' | 'skip-if-present-else-scrape'`
    honoured structurally — `never-touch` skips scrape, normalisation,
    and validation entirely.
  - **F7** `preScrapeHook` evaluated BEFORE URL construction; bypass
    docs receive a hardcoded patch and skip the scrape.
  - **F8** snippet-copy path routes through `truncateAtWord(s, 160)`
    with post-truncation length assertion (`>0 && ≤160`).
  - **F13** 1.5-second inter-request delay (skipped on last
    iteration).
  - **F21** split per-field provenance written via separate
    `metaTitleSource` and `metaDescriptionSource` patches.
- Hard-failure / soft-warning separation: HTTP non-200 (drift) and
  length warnings are SOFT (logged, surfaced via `needsReview=true`,
  do NOT mark the row failed); only `patch.commit()` errors,
  `urlForDoc` throws, and bypass-patch errors are HARD (mark the row
  `status='failed'`). Lets verifier check #8 demand
  `status='complete'` on every row even when drift exists.
- 6 per-collection scripts under `scripts/content/migrate-meta-*.ts`
  are thin wrappers invoking `runMetaBackfill` with their type +
  policy + optional hook:
  - technology / service / customerStory / teamMember — both fields
    `scrape-always`; customerStory has the `/customer-story/virgin`
    pre-scrape hook (hardcoded placeholder patch with
    `provider: 'placeholder'`).
  - review — title `scrape-always`, description
    `snippet-copy-else-scrape`.
  - bookACall — title `scrape-always`, description `never-touch`
    (IMMUTABLE policy declared in script header per CONTENT-1B
    history).
- Initial buggy `shouldFlagForReview` pass on bookACall flagged all 6
  docs (description warnings on a never-touch policy were counted in
  the catch-all `warnings.length > 0` check); fix split warnings into
  title vs description and applied descriptionWarnings only when the
  run actually wrote the description (live-scrape /
  snippetForMeta-copy paths). 6 false-positive flags persisted from
  the buggy pass; cleared in DEV-5 (Op 3).

**Step 6 — 4 carryover scripts (3 image + 1 encoding):**

- `migrate-benefit-value-thumbnails.ts` (9 docs) +
  `migrate-staff-benefit-icons.ts` (6 docs) — F16 idempotency:
  fetch-and-skip if target field already set, single-`.commit()`
  set + unset, on upload failure only patch `needsReview: true`
  (never unset webflowImageUrl until asset attached).
- `migrate-video-backup-image-retry.ts` +
  `fix-video-embed-link-encoding.ts` — F20 vacuous-success ordering:
  when query returns 0 docs, record migration row (0/0/complete)
  BEFORE returning so verifier's row-count check passes. Both ran
  vacuous (CONTENT-1B's earlier carryovers had already resolved).

**Step 7 — Smoke-test cleanup (Decision B: 5-doc scope):**

- Brief originally specified 3 in-scope smoke-test deletions and 2
  deferred to pre-launch. Diagnostics revealed `smoke-test-blog-post`
  references all 3 of the in-scope docs — the brief's halt-on-refs
  guard would have fired. Decision B (Jake authorisation 2026-05-02):
  delete all 5 SCHEMA-1 smoke-test artefacts in this phase.
  `smoke_test_docs_remaining: 0`, no pre-launch smoke-test cleanup
  tech debt, exit criterion #7 wording shifted accordingly.
- Deletion order enforced by `cleanup-smoke-test-docs.ts`:
  `smoke-test-blog-post` (the only ref-holder) FIRST, then the
  other 4 in any order. Each delete via new `deleteByIdStrict()`
  helper in `migration-helpers.ts` — `_id`-only with `_type`
  validation before delete; the helper logs `_id`, `_type`, and a
  human label before calling `client.delete()`.
- Brief deviation DEV-2: production "Scaling Teams" `tag` safety
  check relaxed (replaced with `_id`-prefix sanity check). The
  brief's check assumed a tag-vs-tag confusion that doesn't apply —
  the production analog is a `blogCategory`, type-distinct from the
  smoke-test tag; `deleteByIdStrict`'s `_type` validation is the
  load-bearing structural protection.

**Step 9 — Verifier
(`scripts/content/verify-content-1d.ts` + `run-verify-content-1d.ts`):**

- F2 STRUCTURAL: `verifyContent1D()` throws a typed error on any
  failure. Never returns a boolean. Collects all failures into an
  array and throws once at the end with all failures joined — gives
  Seb a complete picture rather than fail-on-first.
- 9 hard-gate checks: meta coverage, length compliance, per-field
  provenance presence, provider value sanity, image carryovers
  cleared, encoding fix applied, smoke-test cleanup
  (Decision B 5/0), 14 new content_migrations rows + 38 total CE
  rows + all `status=complete` + `parity_score=100`, optional state
  check (skipped pre-Step-8).
- `run-verify-content-1d.ts` CLI entrypoint with
  `--skip-state-check` flag.

**Step 8 — State transition
(`scripts/content/complete-content-phase.ts`):**

- F2 STRUCTURAL: calls `verifyContent1D()` WITHOUT try/catch. On
  failure, the unhandled rejection propagates to Node's top-level
  handler → process exits non-zero → the `assertValidTransition` and
  Supabase update lines are structurally unreachable. The state
  transition cannot run if verification fails. `main()` is called
  WITHOUT `.catch()` per F2 spec.
- `--confirm` flag gates HUMAN INTENT; the verifier is the
  CORRECTNESS gate. Both required.
- `metadata.content_phase`: `total_cms_docs: 388` (404 baseline − 16
  drift), `smoke_test_docs_remaining: 0` (Decision B),
  `content_migrations_rows: 38`, phases list, completed_at
  timestamp.

**Brief deviations applied with explicit per-doc guards (Op 1+):**

- **DEV-3** — `cleanup-drift-docs.ts` deleted 16 docs (1
  customerStory + 15 reviews) whose slugs return HTTP 404 on
  cloudemployee.io and have zero inbound references. Pre-flight
  re-runs the inbound-ref check from D2 + a single-sample live 404
  retest before any delete — halts if state changed since
  diagnostics. Each delete via `deleteByIdStrict`. Post-delete
  confirmation pass.
- **DEV-4** — `truncate-bookacall-metadescription.ts` truncated 6
  bookACall metaDescriptions exceeding the 140–160 schema bound.
  Per-doc guards: `_type === 'bookACall'`, `metaDescription.length`
  matches the D3 snapshot (184/186/188/190/191/192), truncated
  length ∈ [140, 160]. Surgical `.set` on metaDescription only —
  never-touch policy explicitly overridden as a one-off CONTENT-1B
  carryover correction.
- **DEV-5** — `unset-bookacall-stale-needsreview.ts` cleared the 6
  false-positive `needsReview` flags from the buggy initial runner
  pass. Two-factor guard: `needsReview === true` AND
  `metaTitleSource.scrapedAt` startsWith `'2026-05-02'` (re-running
  the migrator moves the scrapedAt forward and structurally blocks
  accidental clearance of any future legitimate flag). Surgical
  `.unset(['needsReview'])` only — monotonic-flag rule explicitly
  overridden for these 6 _ids only.

### Files Created (~25)

**Library:**
- `src/lib/content/url-builder.ts`
- `src/lib/content/meta-scraper.ts`
- `src/lib/content/meta-normaliser.ts`
- `src/lib/content/meta-backfill-runner.ts`

**Scripts (executed):**
- `scripts/content/verify-content-1d-prereqs.ts`
- `scripts/content/test-url-builder.ts`
- `scripts/content/migrate-meta-{technology,service,customer-story,team-member,review,book-a-call}.ts`
- `scripts/content/migrate-{benefit-value-thumbnails,staff-benefit-icons,video-backup-image-retry}.ts`
- `scripts/content/fix-video-embed-link-encoding.ts`
- `scripts/content/cleanup-smoke-test-docs.ts`
- `scripts/content/cleanup-drift-docs.ts`
- `scripts/content/truncate-bookacall-metadescription.ts`
- `scripts/content/unset-bookacall-stale-needsreview.ts`
- `scripts/content/verify-content-1d.ts` + `run-verify-content-1d.ts`
- `scripts/content/complete-content-phase.ts`

**Scripts (read-only diagnostics, kept as reusable tools):**
- `scripts/content/inspect-smoke-test-state.ts`
- `scripts/content/inspect-validation-issues.ts`
- `scripts/content/diag-1d-canonical-cross-check.ts`
- `scripts/content/diag-2-1d-inbound-refs.ts`
- `scripts/content/diag-3-1d-bookacall-truncation-preview.ts`
- `scripts/content/diag-4-1d-runner-bug-postmortem.ts`
- `scripts/content/diag-5-1d-builder-orphan-check.ts`

**Modified:**
- `src/lib/env.ts` — token scoping
- `src/lib/content/sanity-write-client.ts` — module-load assertions
- `src/lib/content/migration-helpers.ts` — `deleteByIdStrict`
- `src/types/sanity/shared.ts` — `MetaSourceFieldsSchema`,
  `SourceTrackingFieldsCarryoverSchema`
- `src/types/sanity/documents/{customer-story,team-member,review,book-a-call,technology,service}.ts`
- `studio/schemas/_shared.ts` — `sourceTrackingFieldsCarryover`,
  `metaSourceFields`
- `studio/schemas/documents/{customer-story,team-member,review,book-a-call,technology,service}.ts`
- `studio/sanity.cli.ts` — `appId` pinned post-deploy
- `package.json` — 17 new npm scripts
- `.env.example` — created, documents both Sanity tokens

### Patterns Established

- **Live-Site Meta Backfill Pattern.** Playwright + `urlForDoc` switch
  + normaliser + per-field provenance. Reusable for customer 2+
  via `meta-scraper.ts` + `meta-normaliser.ts` (brand-suffix list is
  the only customer-specific bit; lift into Mygratr.MetaBackfill
  module post-CE).
- **`FieldPolicy` enum + pre-scrape hook.** `runMetaBackfill` accepts
  a `policy: {title, description}` and optional `preScrapeHook(doc)`
  → `{kind: 'continue'} | {kind: 'bypass', patch}`. Lets per-collection
  scripts stay thin wrappers.
- **Hard-failure vs soft-warning separation.** Runner distinguishes
  script failures (HTTP non-200 → soft, since the runner did its job;
  `patch.commit()` error → hard) from data warnings (length, missing
  optional fields → soft, surfaced via `needsReview=true`). Lets the
  row's `status` semantically reflect "did the migration step
  succeed" while error_log captures everything for audit.
- **Verifier-throws structural pattern.** Verifier exports
  `verifyContent1D()` that throws on failure; state-transition script
  calls it WITHOUT try/catch; unhandled rejection propagates → exit
  non-zero → state transition is structurally unreachable on
  verification failure. `main()` itself called WITHOUT `.catch()`.
- **Two-factor scrapedAt-guarded unset.** When clearing a
  monotonically-set flag is necessary as a one-off correction,
  guard with `flag === true` AND
  `metaTitleSource.scrapedAt` startsWith the known buggy-run date.
  Re-running the migrator moves the scrapedAt forward; the guard
  refuses to fire on any future legitimate flag.
- **`deleteByIdStrict` deletion safety.** All migration-script
  deletions go through this helper: `_id`-only (no querying), fetch
  doc, assert `_type` matches expected before any destructive call.
  Query-based delete patterns (`*[name == ...]` or
  `*[slug.current == ...]` then iterate-and-delete) forbidden in
  migration scripts — `name` and `slug` are mutable and using either
  as a deletion key is a single-keystroke disaster.
- **Token scoping.** Migration scripts use a least-privilege
  single-dataset token. Module-load assertion in the write client
  rejects the wrong token context (read token presence triggers
  immediate throw).
- **Studio deploy ordering gate.** Schema modifications require a
  Studio deploy AND human confirmation that new fields are visible
  in the editor's session BEFORE any data write touches the new
  fields. Top-of-file `// HARD GATE` comment in every migration
  script that touches new fields.

### Final Data State

- Sanity production dataset:
  - **388 CMS docs** (53 CONTENT-1A + 105 CONTENT-1B + 246 CONTENT-1C
    minus 16 DEV-3 drift deletions). Brief baseline 404; deviation
    documented.
  - 0 SCHEMA-1 smoke-test docs remaining (all 5 deleted in Step 7
    Decision B).
  - 0 docs with `webflowImageUrl` staging string + missing target
    image field.
  - 0 docs with `&amp;` in `mainVideoEmbedLink`.
  - All 6 in-scope meta types have `metaTitle` + `metaDescription`
    populated (technology 101, service 23, customerStory 17,
    teamMember 28, review 11, bookACall 6 — counts post-DEV-3).
  - All 6 in-scope types carry `metaTitleSource` provenance; 5 of 6
    carry `metaDescriptionSource` (bookACall description came from
    CONTENT-1B without provenance tracking — verifier accepts this).
  - All 6 bookACall metaDescriptions ≤ 160 chars (post-DEV-4).
  - 0 bookACall docs with stale `needsReview = true` (post-DEV-5).
- Supabase `migrations` (CE):
  - `status = content_complete`, `current_phase = content_complete`.
  - `metadata.content_phase`: `started_at: null` (CONTENT-1A start
    not recorded), `completed_at: 2026-05-02T07:36:52.008Z`,
    `total_cms_docs: 388`, `smoke_test_docs_remaining: 0`,
    `content_migrations_rows: 38`,
    `phases: [CONTENT-1A, CONTENT-1B, CONTENT-1C, CONTENT-1D]`.
- Supabase `content_migrations` (CE): **38 rows** (24 prior + 14
  CONTENT-1D — 11 brief baseline + 3 deviation rows). All
  `status='complete'` + `parity_score=100`.

### Brief Deviations (5 total in CONTENT-1D)

| ID | Description | Rationale |
|---|---|---|
| DEV-1 | Smoke-test cleanup scope 3 → 5 (Decision B) | `smoke-test-blog-post` references all 3 in-scope docs; brief halt-on-refs guard would fire. Cleaner to delete all 5 in this phase. |
| DEV-2 | Production "Scaling Teams" `tag` safety check relaxed | No production `tag` exists with that slug; production analog is a `blogCategory` (different type). `deleteByIdStrict`'s `_type` validation is the load-bearing protection. |
| DEV-3 | 16 drift docs deleted; `total_cms_docs: 404 → 388` | Diagnostics confirmed all 16 are HTTP 404 + zero inbound refs + zero singleton/global mentions. Brief expected manual remediation; bulk delete is unambiguously safe and unblocks `content_complete`. |
| DEV-4 | bookACall metaDescription `never-touch` overridden for 6 docs | CONTENT-1B carryover bug (Webflow `title` field mislabelled and oversized). Length-snapshot guard prevents drift. Surgical `.set` on description only. |
| DEV-5 | bookACall `needsReview` monotonic-flag rule overridden for 6 docs | Initial buggy `shouldFlagForReview` pass. Two-factor guard (flag value + scrapedAt prefix) prevents collateral on any future legitimate flag. |

### Discoveries / Surprises

- **Tier 2 drift estimate was conservative.** The pre-scrape Tier 2
  check estimated 32 drift docs across 4 types; live HTTP fetches
  showed only 16 — many "drift" slugs had been added to Webflow
  after AUDIT-1 ran and DO have live URLs.
- **CONTENT-1B's bookACall.metaDescription violated the schema.**
  The Webflow `title` field (which CONTENT-1B copied) runs 184–192
  chars; the schema constraint is 140–160. The brief's "never-touch"
  was based on the assumption CONTENT-1B's data was schema-compliant.
  Required DEV-4.
- **Initial `shouldFlagForReview` ran too greedily.** Treating any
  warning as a flag-trigger conflated description-side warnings on a
  never-touch description policy. Required the warnings split + the
  hard/soft hardFailures-vs-warnings refactor. Caught early
  (bookACall smoke run, before any of the other 5 collections ran).
- **`technology.associatedTechnologies = []` on all 101 docs.** A
  CONTENT-1C migrator wrote a service-only field onto every
  technology doc (empty arrays — Sanity tolerates silently). Logged
  as Tech Debt #13.

### Resolved Tech Debt

- **#15 (CONTENT-1D introduced)** — bookACall metaDescription
  length-violation pattern. **Resolved in CONTENT-1D Op 2** (DEV-4
  truncation).
- **#16 (CONTENT-1D introduced)** — drift docs disposition.
  **Resolved in CONTENT-1D Op 1** (DEV-3 deletion).

### New Tech Debt Logged (Inert)

- **#13** — 101 technology docs hold `associatedTechnologies: []`
  (CONTENT-1C migrator wrote a service-only field). Inert. Resolution:
  one-shot unset patch in TEMPLATE-* phase or pre-launch.
- **#14** — Service docs surface "Invalid property value" warnings in
  Studio for null-valued optional image fields. Inert (null is
  acceptable for optional fields, Studio's strict validation flags
  them anyway). Resolution: investigate post-CONTENT-1D, then either
  adjust schema field types or unset the null values.

### New Tech Debt Logged (Blocking — pre-launch)

- **#15 (post-CONTENT-1D rotation)** — `SANITY_MIGRATION_WRITE_TOKEN`
  rotation. **MUST resolve before MYGRATR-LAUNCH** (Exit Criterion #10).

---

## MYGRATR-CONTENT-1C — Blogs / Compare / Tech / Services / Stories Migration (April 2026)

### What Was Built

**Step 0a — `toPortableText()` upgraded to async with inline image
support (`src/lib/content/migration-helpers.ts`):**

- Function signature changed from `(html) => unknown[]` to
  `async (html) => Promise<unknown[]>`. Every existing caller in
  `scripts/content/` (migrate-team-members, -reviews, -book-a-call,
  -events, -tools, -downloads, -videos) updated to `await` the call.
  Two FAQ-loop sites (migrate-tools, migrate-downloads) wrapped with
  `await Promise.all(...)` over the inner map.
- Null guard at entry — `null`, `undefined`, or empty string returns
  `[]`. Protects every call site (customerStory empty fields, FAQ
  answers, any future nullable RichText).
- Compiled block-tools schema now registers an `image` type alongside
  `block` so `htmlToBlocks` can emit image blocks.
- Two-pass walk:
  - **Pass 1** — JSDOM-parse the HTML, find every `<img>` and collect
    its `src`, then upload via `Promise.allSettled` over
    `uploadAssetFromUrl(src)`. A single broken CDN image logs a warning
    and is skipped — it cannot abort the whole document. Both passes
    use JSDOM so src URLs decode identically (no entity-encoding
    mismatch between regex extraction and DOM parsing).
  - **Pass 2** — `htmlToBlocks` with custom rules. The `<img>` rule
    looks up src in the map and emits an image block with optional
    `alt`. The `<figure>` rule first checks for an `<img>` child —
    Vimeo embeds (`<figure><iframe>`) lack one and are skipped
    entirely. When a child `<img>` is found and its src is in the map,
    the rule emits an image block with the `<figcaption>` text as
    `caption`. Failed uploads return `undefined` from the rule, so the
    block is dropped rather than emitted with a broken `_ref`.
- A private `uploadAssetFromUrl(url)` helper extracted so both the
  inline image upload (Step 0a) and the public `uploadImage(field)`
  helper share the same fetch+upload+filename logic.

**Step 0b — `fetchOptionIdMap` and `resolveOption` lifted to shared
helpers:**

- Both functions previously existed as near-duplicate copies in
  `scripts/content/migrate-videos.ts` and
  `scripts/content/migrate-benefit-values.ts`. Moved to
  `src/lib/content/migration-helpers.ts` and exported. Both scripts
  now import from shared.
- The shared `resolveOption` takes an `itemId` string parameter so
  callers can prefix their warnings (`video ${id}`, `service ${id}`)
  rather than the helper hardcoding `[video ${id}]`.

**Step 0c — `decodeHtmlEntities(str)` helper added:**

- Replaces `&amp;` / `&lt;` / `&gt;` / `&quot;` / `&#39;` with their
  literal characters. Used by the customerStory migrator to clean up
  Webflow VideoLink URLs (`?h=xxx&amp;title=0` → `?h=xxx&title=0`).

**Step 0 — `toRefs` validation (carried in the same helpers diff):**

- Every Webflow ref ID extracted from a multiRef field is validated
  against `/^[a-f0-9]{24}$/i` (Webflow ObjectId shape) before being
  used to construct a `_ref`. Malformed entries are logged
  (`[toRefs:{prefix}] dropping malformed ref id: ...`) and dropped
  rather than written as broken refs (`tag-[object Object]` was the
  failure mode the brief audit flagged).
- `_key` is now the full Webflow ID, not the sliced 8-char prefix —
  matches the brief's "deterministic patterns, not random generation"
  rule and avoids any theoretical key collision.

**Step 1 — Branch + collection IDs + pre-flight verifier
(`scripts/content/verify-content-1c-prereqs.ts`):**

- 11 new collection IDs added to
  `src/lib/content/ce-collection-ids.ts` (7 blog collections,
  compareBlog, technology, service, customerStory). A typed
  `CE_BLOG_COLLECTIONS` array fixes the iteration order so logging
  is deterministic.
- `verify-content-1c-prereqs` asserts `migrations.status =
  content_running`, then fetches every item from each of the 11
  source collections and asserts the union of `fieldData` keys
  contains every required slug from the brief §2 sweep. Optional
  slugs are listed too (warned but not failed). Pre-flight passed
  clean on first run — every required slug present.

**Step 2 — `blogPost` migrator (`scripts/content/migrate-blog-posts.ts`)
— 74 unique items across 7 collections:**

- **The dedup model.** Pre-flight slug-collision check fired with 31
  collisions on first run. Per Jake's clarification 2026-04-30,
  `Blogs & Guides` (`67459ce1ce88de64c07213a7`) is the canonical
  master collection; the 6 sub-category collections (Staff
  Augmentation, Nearshoring & Offshoring, Scaling Teams, Hiring Tips,
  Managing Engineers, AI in Software Dev — all created together with
  Webflow IDs `68f668xx…`) are mostly duplicates of master entries
  with new IDs. The migrator iterates `Blogs & Guides` first, builds
  a running slug set seeded with Sanity-existing slugs, then for each
  sub-category skips items whose slug is already in the set. Each
  item's `blogCategory` ref comes from its own `resource-category`
  field, never from its source collection.
- **Brief-mandated rules applied:**
  - Author slug = `author-2` (NEVER `author`); ~25% fill rate, null
    is expected and triggers `needsReview = true`.
  - Date parsed via `/^(\d{4}-\d{2}-\d{2})/` regex prefix — never
    `new Date(raw).toISOString().slice(0,10)` (timezone shift).
  - FAQ loop is `for (let i = 1; i <= 6; i++)` (1-indexed
    inclusive). Skip pairs with empty question. `_key = faq-{n}`.
  - Every Webflow ref ID validated `/^[a-f0-9]{24}$/i` before
    constructing `_ref`. Malformed → null + needsReview.
- **Live counts** (`source` / `eligible` / `migrated`):
  - Blogs & Guides — 31 / 31 / 31
  - Staff Augmentation Blogs — 34 / 28 / 28
  - Nearshoring & Offshoring Blogs — 13 / 7 / 7
  - Scaling Teams Blogs — 10 / 3 / 3
  - Hiring Tips Blogs — 7 / 3 / 3
  - Managing Engineers Blogs — 7 / 2 / 2
  - AI in Software Development Blogs — 3 / 0 / 0
  - **Total unique migrated: 74** (brief expected 98 — based on raw
    collection sums and didn't account for master/sub-category
    duplication).
- **Supabase tracking:** 7 rows in `content_migrations`, one per source
  collection. For sub-categories, `source_item_count` records the full
  Webflow count and `migrated_item_count` records the unique-only
  count; parity is measured against the deduplicated set via the new
  `parityBaselineCount` parameter on `recordMigration`.

**Step 3 — `compareBlog` migrator
(`scripts/content/migrate-compare-blogs.ts`) — 30 items:**

- Brief said 29; live Webflow API returned 30. No internal slug
  collisions; cross-type collisions with blogPost are tolerated as
  warnings (different type, different routes).
- **Brief-mandated rules:**
  - tags slug = `tags-2` (NOT `tags`).
  - author slug = `author-2`.
  - **No `category` field on the payload** — compareBlog has no
    resource-category. Step 7 verifier asserts
    `*[_type=="compareBlog" && defined(category)] | count == 0`.
  - `competitor` extracted via three explicit regex patterns
    (`Cloud Employee vs X`, `X vs Cloud Employee`,
    `Cloud Employee Alternatives to X`) — failed extraction emits
    `competitor: null` + `needsReview: true`.
- 30/30 migrated cleanly with zero errors.

**Step 4 — `technology` migrator
(`scripts/content/migrate-technology.ts`) — 101 items, single pass:**

- `associated-technologies` is 0% populated, so no second pass.
- **Slug sweep §2.3 honored — these slugs are chaotic and the brief
  table is authoritative:** `technology-name`, `short-description`,
  `header-blurb`, `fold-1---paragraph`, `section-1-label`,
  `section-1-header`, `section-1-description`, `focus-1-title`,
  `focus-1-blurb`, `fold-2---paragraph`, `focus-2-title`,
  `focus-2-blurb`, `focus-3-title`, `focus-3-blurb`,
  `fold-3---item-{n}-header/description`, `fold-4---label/header`,
  `fold-5---{label,header,description,bullet-1..3}`,
  `fold-6---label/header`.
- **`focus-3-title` double-duty:** read once, used in BOTH fold-2
  bullet 3 AND fold-3 label (Webflow template field shared).
- **Fold 3 item filter** is `header || description` (not just
  `header`) — 0/101 items have `fold-3---item-1-header` populated but
  100/101 have `fold-3---item-1-description`.
- Deterministic `_key`: fold = `fold-{n}`, fold item =
  `fold-{n}-item-{m}`. Empty folds (no header/label/paragraph/bullets/
  items/featuredImage) dropped from the array — fold-4 is 0% fill
  across all 101 items and never emits.
- All `uploadImage()` calls explicitly awaited (brief Finding 4).
- **Outlier handled** per §5.9: 1/101 items (Android Studio, Webflow
  id `685d6a6617a25b3c61fd3ec1`) is missing `technology-name` and all
  fold content. Migrator falls back to `name` for `technologyName`,
  ships `folds: []`, sets `needsReview: true`. No throw.
- 101/101 migrated, 1 outlier flagged. metaTitle/metaDescription left
  null — backfill in CONTENT-1D. All 101 ship `needsReview: true` to
  surface the universal meta-backfill requirement.

**Step 5 — `service` migrator
(`scripts/content/migrate-services.ts`) — 23 items:**

- `fetchOptionIdMap` calls hoisted ABOVE the item loop (brief Finding
  9 — Webflow rate-limit avoidance).
- `SERVICE_TYPE_MAP` and `PREFIX_MAP` resolve opaque Webflow Option
  IDs to camelCase Sanity enum values.
- Brief-mandated slug fixes:
  - `short-label` (NOT `short-description` — that belongs to
    Technology).
  - `fold-2---paragraph-2` (trailing `-2`) — NOT
    `fold-2---paragraph`.
- `associated-technologies` refs validated against the Webflow
  ObjectId regex; resolve to `technology-{id}` _refs created in Step 4.
- Same fold packing rules as Technology — deterministic `_keys`,
  awaited `uploadImage`, empty folds dropped.
- 23/23 migrated cleanly. metaTitle/metaDescription deferred to
  CONTENT-1D.

**Step 6 — `customerStory` migrator
(`scripts/content/migrate-customer-stories.ts`) — 18 items:**

- **Field mapping** per brief §2.5:
  - `name` → `companyName`, `customer-story-title` →
    `customerStoryTitle`.
  - Switch slugs corrected: `feature-in-home-page-header-scrolls`,
    `feature-in-featured-customers-section`, `featured-on-cs-page`.
  - VideoLink: extract `.url` from object, run through
    `decodeHtmlEntities` (Step 0c).
  - Content slugs use `the-` prefix (`the-customer-content`,
    `the-problem-content`, `the-solution-content`,
    `the-impact-content`).
  - Quote slugs use triple-dash (`problem-quote---paragraph`,
    `problem-quote---person-image`, `problem-quote---person-name`,
    `problem-quote---person-title`; same for solution/impact).
  - `video-testimonial-intro-content` (NOT `video-intro-content`).
  - `video-url-2` dropped per D5.
- **problem/solution/impact packed independently** — quote is NOT
  gated on content presence (brief Step 6 fix vs v1.0). If content is
  empty but quote exists, still emit the quote with
  `content: null`.
- **No `source` / `generatedAt` / `needsReview` fields** — schema
  doesn't have them on customerStory. Empty-shell tracking via
  console + carryover table only.
- Live distribution exactly as brief §2.5 predicted:
  - 3/18 full narratives — Event Connections, Salmon Software,
    Willo®.
  - 4/18 impact-quote-only — SQR, Travel Tech Client, Mercato,
    CleanLink.
  - 11/18 empty shells (content pending from CE).
- metaTitle / metaDescription / openGraphImage left null.

**Step 7 — Verification (`scripts/content/verify-content-1c.ts`):**

- 29 hard-gate checks. Live state: ALL PASSED.
  - Sanity counts: 74 / 30 / 101 / 23 / 18 (matches expectations).
  - Supabase: 11 CONTENT-1C tracking rows present, every
    `parity_score == 100`, every `status == complete`.
  - blogPost slug uniqueness — 74 / 74 distinct.
  - compareBlog: zero docs with `category` defined.
  - Reference integrity spot-checks: 3 blogPost (tags + category +
    author all resolve), 3 compareBlog (tags all
    `category="alternatives"`), 3 service
    (associatedTechnologies refs resolve to technology docs — actual
    sample empty because all 23 had 0% Webflow fill, expected).
  - service type/prefix enums valid (`staffAugmentation` etc.).
  - shortLabel cross-check populated on both technology and service.
  - blogPost contains inline image blocks — verified end-to-end via
    GROQ count of `content[_type == "image"]`.
  - Technology fold spot-checks: every sample emits the expected
    headerIntro / featureBullets / itemList / paragraphSection /
    headerOnly sequence.
  - customerStory: Event Connections has problem+solution+impact;
    SQR has impact.quote with null content and no problem; empty
    shells render without crash.
- One vacuous-success edge case fixed mid-verification:
  `ai-software-dev-blogs` had `parity_score=0` because eligible=0
  and migrated=0. `recordMigration` patched so when denominator is 0
  AND migrated is 0 AND no errors, parity is 100 (vacuous success).
  Re-ran the row update; verifier passed on second attempt.

**Step 8 — Push and merge:**

- 10 commits on `feat/content-1c` pushed to origin. Merged to main
  via `--no-ff` (matching past phases: see commit
  `Merge branch 'feat/content-1b' — MYGRATR-CONTENT-1B complete`).
  Main pushed by Jake.

### Patterns Established

- **`toPortableText` is async and does inline image upload.** Every
  caller of `toPortableText` (existing or new) must `await` the call.
  When called inside `.map()` callbacks, wrap with
  `await Promise.all(...)`. The function null-guards at entry so
  passing `null` / `undefined` / `""` is always safe; image upload
  failures degrade gracefully (skip the block, keep the rest of the
  document). The two-pass walk uses JSDOM in BOTH passes so src URLs
  decode identically; never use a regex to extract src from raw HTML
  (entity-encoding mismatch with the DOM-parsed src in pass 2).
- **`<figure>` deserializer must check for an `<img>` child.**
  iframe-in-figure (Vimeo embeds) is the false-positive trap:
  emitting an image block with `_ref: undefined` corrupts Sanity
  references. The rule: if `figure.querySelector('img')` is null,
  return `undefined` — the body of the figure falls through to text
  rules.
- **Cross-collection dedup via `parityBaselineCount`.** When
  multiple Webflow source collections consolidate into one Sanity
  type and contain duplicate items (slug collision), the canonical-
  master pattern applies: pick one collection as authoritative, build
  a running slug set, skip duplicates in subsequent collections. The
  migration tracker records `source_item_count` = full Webflow count
  for the row but accepts an optional `parityBaselineCount` =
  unique-eligible count, so `parity_score = migrated /
  parityBaselineCount * 100` shows 100 when every unique item
  successfully migrates. Vacuous success (denominator=0,
  migrated=0, no errors) yields 100, not 0.
- **Every Webflow ref ID validated `/^[a-f0-9]{24}$/i` before
  `_ref` construction.** Webflow occasionally returns object-shape
  ref values where the API typing claims plain string; without
  validation those round-trip into Sanity as `tag-[object Object]`.
  `toRefs` now drops malformed entries with a console warning. Apply
  the same guard for any single-reference field (resource-category,
  author-2, eventType) — see the inline `validRefId(value)` helper
  pattern in migrate-blog-posts.ts.
- **Deterministic `_key` from Webflow ID, not random.** Array
  members in Sanity (faqItem, references, fold items) need stable
  `_key` values across re-runs so `createOrReplace` doesn't shuffle
  Studio selection state. Use the full Webflow ID for ref `_key`s,
  positional indices for FAQ (`faq-{n}`) and fold items
  (`fold-{n}-item-{m}`).
- **Date parsing via regex prefix, not `new Date()`.** Webflow
  returns ISO datetimes; `new Date(raw).toISOString().slice(0,10)`
  shifts items close to UTC boundary. Use
  `/^(\d{4}-\d{2}-\d{2})/.exec(raw)[1]` to lift the date prefix
  unchanged.
- **Pre-flight slug collision check is a hard gate.** Before
  writing any documents in a multi-collection migrator, fetch every
  slug across the union of source collections and assert no
  duplicates. Stop and report on collision — never silently skip,
  never silently overwrite. (Step 2 would have written 31 broken
  blogPost docs without this.)
- **Option-field map fetches must hoist above the item loop.**
  Webflow rate-limits at 60 req/min; calling `fetchOptionIdMap`
  once per service (×23) instead of once per migrator burns an extra
  46 requests for nothing. See `migrate-services.ts` `Promise.all`
  hoisting at the top of `migrateServices()`.

### Data State After Phase

- Sanity production dataset (`lzbhll1u/production`):
  - 53 CONTENT-1A docs.
  - 105 CONTENT-1B docs.
  - 246 CONTENT-1C docs (74 blogPost + 30 compareBlog + 101
    technology + 23 service + 18 customerStory).
  - **404 CMS docs total.** Plus 34 SCHEMA-1 stubs + 5 smoke-test
    docs.
- Inline images on Webflow blog content uploaded as real Sanity
  assets (verified via the `count(content[_type == "image"]) > 0`
  GROQ query — sample blogPost
  `staff-augmentation-vs-consulting-outsourcing-and-managed-services`
  has 2 inline image blocks).
- `content_migrations` table: 24 rows for CE migration (5
  CONTENT-1A + 8 CONTENT-1B + 11 CONTENT-1C). Every CONTENT-1C row
  shows `status='complete'`, `parity_score=100`, `error_log=[]`.
- `migrations.status = content_running` (still partial — 3 of 4
  CONTENT slices done; `content_complete` ships after CONTENT-1D
  per the reconciled CLAUDE.md).

### Tech Debt Tracked

- **Meta backfill carryover:** technology (101), service (23),
  customerStory (18 — including `/customer-story/virgin` placeholder
  text), teamMember (28), review (26), bookACall (6) all need
  `metaTitle` / `metaDescription` populated before launch. Total ~
  202 fields. Scope of CONTENT-1D.
- **Author backfill:** every blogPost and compareBlog with
  `author: null` ships with `needsReview: true`. Seb assigns bulk
  defaults in Studio post-migration (~127 items per the design doc
  open-question table).
- **CONTENT-1A image upload carryovers:**
  `benefitValue.thumbnailImage` (9) and `staffBenefit.icon` (6)
  still hold `webflowImageUrl` staging strings. Scope of CONTENT-1D.
- **CONTENT-1B carryovers:** 1 `video.backupImage` CDN failure; 1
  video URL with `&amp;` entity-encoded query string (now have
  `decodeHtmlEntities` available — can be re-run idempotently).
- **Smoke-test cleanup:** `scaling-teams (SMOKE TEST)` tag,
  `smoke-test-blog-category-scaling-teams`, `smoke-test-team-member`
  persist from SCHEMA-1. Pre-launch cleanup.

---

## MYGRATR-CONTENT-1B — Reference-Light & Standalone Collections Migration (April 2026)

### What Was Built

**Step 1 — `CE_COLLECTION_IDS` extended:**

- 8 new collection IDs added to `src/lib/content/ce-collection-ids.ts`
  (teamMembers, reviews, videos, bookACall, eventsWebinars, toolsQuizzes,
  downloads, downloadsAccess), all verified against
  `GET /v2/sites/{siteId}/collections` on 2026-04-28.

**Step 1a — Shared helpers (`src/lib/content/migration-helpers.ts`):**

- `toPortableText(html)` — Converts Webflow RichText HTML to a Sanity
  Portable Text array via `@sanity/block-tools`. Critical fix: the
  package's default `parseHtml` uses the browser `DOMParser` global,
  which doesn't exist in Node.js. Injects `(html) => new JSDOM(html).window.document`
  via the `parseHtml` option. `jsdom` + `@types/jsdom` added to deps.
  Without this fix every RichText field falls back to a single
  plain-text block — caught during the team-members spot-check.
- `extractUrl(linkField)` — Accepts both Webflow Link objects (with
  `.url`/`.href`) and plain-string Link fields. Trims whitespace,
  treats empty strings as null. Webflow returns Link fields in both
  shapes depending on collection (team `linkedin-link` is a string;
  video `main-video-embed-link` is an object).
- `uploadImage(imageField)` — Fetches the Webflow CDN URL, uploads
  via `sanityWriteClient.assets.upload('image', Buffer, { filename })`,
  returns a Sanity image asset reference. Logs a warning and returns
  null on failure — a missing image is acceptable; a crashed migration
  is not. Replaces the CONTENT-1A `webflowImageUrl` staging pattern.
- `toRefs(field, refPrefix)` — MultiReference fields → Sanity
  references using deterministic `{prefix}-{webflowId}` IDs. Accepts
  both the legacy `{id: string}` object form and the modern
  plain-string ID form Webflow returns on video/download/event tags.
- `extractOption(field)` — Pull `.name` from a Webflow Option field
  object. Note: Webflow v2 returns Option fields as opaque ID strings
  for most collections, so this helper is only useful when an Option
  arrives as an object. Video/tool migrators use `fetchOptionIdMap()`
  instead — fetch the collection schema once, build an ID→name map.
- `webflowSlug(item)` — Reads `item.fieldData.slug` first, falls back
  to top-level `item.slug`. Webflow v2 returns the slug only on
  `fieldData.slug` for some collections (every team member has
  `item.slug === null`).

**Step 1b — Slug fix retroactively applied to CONTENT-1A:**

- During team-members spot-check, every CONTENT-1A document was found
  to have `slug.current = null` because the original CONTENT-1A
  migrators referenced `item.slug` directly. The 5 CONTENT-1A
  migrators (migrate-tags, migrate-blog-categories,
  migrate-glassdoor-reviews, migrate-benefit-values,
  migrate-staff-benefits) were updated to use `webflowSlug(item)` and
  re-run idempotently via `createOrReplace`. After the fix:
  53 CONTENT-1A docs + 28 team-member docs all carry populated slugs
  (verified via GROQ count query — 0 missing across 6 doc types).
- CONVENTIONS.md §"Content Migration Conventions" updated to show the
  helper and document the historical bug.

**Step 2 — Migrate teamMembers (28):**

- `scripts/content/migrate-team-members.ts`. Field-name corrections
  from live-API verification: image is `team-member` (not
  `team-member-image`); tenure is `time-at-cloudemployee` (not
  `time-at-cloud-employee`). Both `linkedin-link` and `book-a-call-link`
  arrive as plain strings, handled via the loosened `extractUrl`.
  metaTitle/metaDescription deferred to CONTENT-1C backfill.

**Step 3 — Migrate reviews (26):**

- `scripts/content/migrate-reviews.ts`. Sanity `nameClient` ← Webflow
  `name-client` (the personal name, e.g. "Euan Cameron"). Webflow
  `name` (the company name, e.g. "Willo®") is dropped — there is no
  Sanity destination for it on the current `review` schema. Drops
  legacy `featured-in-which-page` and `webpage-for-testimonial`
  fields. metaTitle/metaDescription deferred to CONTENT-1C backfill.

**Step 4 — Migrate videos (32):**

- `scripts/content/migrate-videos.ts`. Webflow `meta-title` does not
  exist on this collection — dropped from the migrator. `type` and
  `team` resolve via `fetchOptionIdMap()` (CONTENT-1A pattern from
  migrate-benefit-values.ts) → TYPE_MAP / TEAM_MAP camelCase. Video
  tags use the plain-string ID form, handled by `toRefs` after a
  helper loosening (matches the extractUrl precedent).

**Step 5 — Migrate book-a-call (6):**

- `scripts/content/migrate-book-a-call.ts`. Webflow `name` →
  `firstName`, `last-name` → `lastName`. Webflow `title` field is
  mislabelled and contains meta description copy — maps to
  `metaDescription` per field map §12.

**Step 6 — Migrate events (1):**

- `scripts/content/migrate-events.ts`. Webflow slug is
  `header-description---post-event` (three dashes). Webflow
  `speakers-header` is dropped — no Sanity destination on the event
  schema. Topics filter is `t.title && t.description` (not `||`)
  because the Sanity `topicItem` sub-schema requires both fields.
  `event-type` resolves from a single string ID via `tag-{id}`.

**Step 7 — Migrate tools (2):**

- `scripts/content/migrate-tools.ts`. FAQ slugs are `faq-header-1..10`
  (not the brief's `faq-title-`). Webflow `blurbs` →
  `metaDescription`. Culture Match `hidden-code` runs through
  `stripApiKeys` (covers quoted-property forms; Webflow's embedded JS
  uses unquoted property names so the regex doesn't actually match).
  Empirically safe in this batch because `htmlToBlocks` discards
  `<script>` content — both tools land in Sanity with `hiddenCode: []`
  and zero key text. Verified by grep on the live key prefix.

**Step 8 — Migrate downloads (5):**

- `scripts/content/migrate-downloads.ts`. `metaThumbnail` reads from
  Webflow `meta-thunbnail` (sic — Webflow's own typo). Three-dash
  slugs throughout (`faq-title---N`, `button-text---N`,
  `button-link---N`). `youllGet` packed into a `string[]` from three
  separate Webflow fields. `howToUseIt`, `theImpact`, `getItNow`
  packed into Sanity object fields.

**Step 9 — Migrate downloads-access (5):**

- `scripts/content/migrate-downloads-access.ts`. Three fields:
  `name`, `slug`, `download-file-link`. Required `downloadFileLink`
  validated explicitly (throws if missing).

**Step 10 — Verification (`scripts/content/verify-content-1b.ts`):**

- Reads `content_migrations` for the 8 CONTENT-1B collections, asserts
  each has `migrated_item_count === expected && status === 'complete'`.
  Final state: 8/8 collections at parity 100, exit 0.

### Patterns Established

- **JSDOM-injected `parseHtml` for `@sanity/block-tools` in Node.**
  The package defaults to `DOMParser` which is browser-only. Always
  pass `{ parseHtml: (html) => new JSDOM(html).window.document }` as
  the third argument to `htmlToBlocks` in any Node-side migrator.
- **Image upload at write time, not staging.** CONTENT-1A used a
  `webflowImageUrl` string staged on the doc root. CONTENT-1B uploads
  via `sanityWriteClient.assets.upload`. Failures are non-fatal: log
  + return null + continue.
- **MultiReference loosening parallels Link loosening.** Both
  `extractUrl` and `toRefs` now accept the plain-string form Webflow
  returns alongside the object form. Apply the same pattern to any
  future helpers that wrap Webflow field shapes.
- **`webflowSlug(item)` is mandatory.** Never reference `item.slug`
  directly — top-level slug is `null` for some collections. CONTENT-1A
  shipped with this bug; never repeat it.
- **Field names verified against the live API before writing the
  migrator.** Six of the eight CONTENT-1B collections had at least
  one slug or shape mismatch between the brief / field map and the
  live Webflow API. The DEBUG_CONTEXT.md sweep that surfaced these
  is the recommended pre-flight for every future migrator.

### Data State After Phase

- Sanity production dataset (`lzbhll1u/production`):
  - 53 CONTENT-1A docs (re-run with slugs backfilled).
  - 105 CONTENT-1B docs across 8 types.
  - 158 CMS docs total. Plus 34 SCHEMA-1 stubs + 5 smoke-test docs.
- Image fields uploaded as real Sanity assets (no staging URLs)
  except where the Webflow CDN was unhappy on the day. One
  `backupImage` upload failed in videos (logged); 3 nullable
  team-member `bookACallLink` strings were null in source (already
  expected per brief §2 "18% fill rate").
- `content_migrations` table: 13 rows for the CE migration (5
  CONTENT-1A + 8 CONTENT-1B), all `status='complete'`,
  `parity_score=100`, `error_log=[]`.
- `migrations.status = content_running` (still partial — content
  complete ships with CONTENT-1C).

### Tech Debt Tracked

- One `scaling-teams (SMOKE TEST)` tag document persists in Sanity
  from SCHEMA-1; reference resolution from CONTENT-1A used the real
  Webflow IDs so it's harmless, but should be deleted in Studio
  before launch.
- `stripApiKeys` regex only matches quoted-property forms
  (`'key': '...'`); Webflow's embedded JS uses unquoted property
  names (`key: '...'`). Currently safe because `htmlToBlocks`
  discards `<script>` content, but the regex would not protect a
  future migrator that preserves script content. Tighten before
  CONTENT-1C if any RichText body could carry a credential.

---

## MYGRATR-CONTENT-1A — Flat Collections Migration (April 2026)

### What Was Built

**Step 0a — Tech debt #10 and #11:**

- Deleted the legacy `MigrationStatus` enum (shortform values like `'audit'`,
  `'schema'`) and the duplicate `TemplateType` enum from `src/lib/types.ts`.
- Replaced internal references with imports from the canonical sources:
  `MigrationStatus` (string-literal union) from
  `src/lib/pipeline/state-machine.ts`, and `TemplateType` (UPPERCASE enum
  matching all audit scripts) from `src/lib/audit-types.ts`.
- Locale, Migration, Organisation, PageRecord, QAResult, etc. all kept;
  none are imported externally — types.ts is internal scaffolding only.
- `npx tsc --noEmit` clean.

**Step 0b — Phase transition:**

- `scripts/content/start-content-phase.ts` mirrors the
  `start-scaffold-phase.ts` shape exactly: `--confirm` required, idempotent
  on re-run if status is already `content_running`, calls
  `assertValidTransition()` from `pipeline/state-machine.ts` before update.
- `migrations.status` and `current_phase` moved
  `scaffold_complete → content_running`.

**Step 1 — Migration infrastructure (`src/lib/content/`):**

- `sanity-write-client.ts` — `@sanity/client` write client with
  `apiVersion: '2024-01-01'`, `useCdn: false`, token from
  `env.SANITY_API_TOKEN`. No `'server-only'` import (CLI scripts run via
  `tsx`, not Next.js).
- `webflow-read-client.ts` — single `getCollectionItems(collectionId)`
  helper with offset+limit pagination at 100 per page (exits when a page
  returns fewer items than the limit; safer than comparing against
  `pagination.total` which can shift on live data). All migrators read
  Webflow exclusively through this module.
- `migration-tracker.ts` — `recordMigration({ collectionSlug, source,
  migrated, status, errorLog })` upserts to `content_migrations` with
  `onConflict: 'org_id,migration_id,collection_slug'`. Computes
  `parity_score` as `migrated/source*100` (or 0 if source is 0). Includes
  `org_id` filter via the upsert payload.
- `ce-collection-ids.ts` — typed `as const` map of the 10 Webflow
  collection IDs in scope for CONTENT-1A, fetched live from
  `GET /v2/sites/{siteId}/collections` and committed as seed data per
  CONVENTIONS.md §"CE-Specific vs Reusable Discipline".

**Step 1d — DDL gap:**

- Brief §1d requires the `content_migrations_org_migration_collection_unique`
  constraint on `(org_id, migration_id, collection_slug)`. A REST-side probe
  (upsert with `onConflict` spec) returned `42P10`, confirming the
  constraint was missing. Direct `pg` connection to the Supabase pooler
  failed with `Tenant or user not found` at both 5432 and 6543, and the
  `db.<ref>.supabase.co` direct hostname doesn't resolve — REST works
  but DDL-via-pg is blocked. Per the brief's stop-on-ambiguity protocol,
  DEBUG_CONTEXT.md was created with the exact ALTER TABLE; Jake ran it
  via the Supabase SQL editor; the probe was re-run and confirmed the
  constraint after which the migrators were written.

**Step 2 — Tags (22 items, D2):**

- `migrate-tags.ts` iterates a 6-key `CATEGORY_MAP`
  (`tagsBlogs/Alternatives/Tools/VideoLibrary/Downloads/EventsWebinars`)
  and writes Sanity `tag` documents with deterministic `_id: tag-{webflowId}`,
  `slug: { _type: 'slug', current: webflowSlug }`, `category` from the map,
  and `singularName` only when the source is `eventsWebinars` and Webflow
  has a `singular-name` value. 22/22 migrated, 0 errors.

**Step 3 — Blog categories (6 items, D13):**

- `migrate-blog-categories.ts` reads the Webflow `hubs` collection and
  writes `blogCategory-{webflowId}` Sanity docs. `name → name`,
  `slug → slug.current`. `order` left unset — Seb sets it in Studio. 6/6.

**Step 4 — Glassdoor reviews (10 items):**

- `migrate-glassdoor-reviews.ts` follows the field map (`§14`):
  `name → clientName` (required), `title → title`,
  `review-description → reviewDescription`, `work-field → workField`.
  Brief's indicative table (rating/date/source-url) was discarded in favour
  of the actual field map per its own instruction. 10/10.

**Step 5 — Benefit values (9 items):**

- Webflow Option fields are stored as opaque IDs in `fieldData`. The
  migrator first fetches `GET /v2/collections/{id}` to build an
  `optionId → name` map for the `category` field, then resolves
  `21c13274484fde9403a3d56c33fe7160 → benefits` and
  `c0ffb288e564af046e3d5dfe99d1b52f → values`. The Sanity enum values
  are lowercase (`benefits`/`values`) per the schema. Image handling:
  `thumbnail-image.url` written to a `webflowImageUrl` staging string;
  no Sanity asset upload (CONTENT-1C). 9/9.

**Step 6 — Staff benefits (6 items):**

- Same image strategy: `icon.url` stored at `webflowImageUrl`. No category
  field on this collection. 6/6.

**Step 7 — Verification:**

- `verify-content-1a.ts` reads all rows for the CE migration from
  `content_migrations`, compares `migrated_item_count` against an
  `EXPECTED` map for the 5 slugs, and exits 1 on any mismatch. All 5
  rows show `migrated/source = 22/22 | 6/6 | 10/10 | 9/9 | 6/6` and
  `parity_score = 100`. Exits 0.

### Patterns Established (added to CONVENTIONS.md)

- **Single read-client + write-client per source/target.** Webflow reads
  go through `src/lib/content/webflow-read-client.ts`; Sanity writes go
  through `src/lib/content/sanity-write-client.ts`. Migration scripts
  never call the Webflow REST API or `@sanity/client` constructors
  directly. Adapter pattern doesn't apply yet (we're still single-source
  CE/Webflow); these clients are the migration-lane equivalents and will
  graduate to `CmsAdapter` implementations in a follow-up.
- **Deterministic Sanity `_id`s** of the form `{typeName}-{sourceId}`
  for every migrated doc. Idempotent re-runs use `createOrReplace`;
  reference resolution (CONTENT-1B/C) becomes a string-template lookup
  with no need for an ID translation table.
- **Webflow Option-field resolution.** Webflow stores Option fields as
  opaque IDs in `fieldData`. Resolve by fetching the collection schema
  (`GET /v2/collections/{id}`) once per migrator and building an
  `optionId → name` map; then map names to the target Sanity enum.
- **Image staging.** Webflow CDN URLs land at `webflowImageUrl` on the
  Sanity doc rather than triggering a Sanity asset upload during
  CONTENT-1A. CONTENT-1C handles the actual asset migration.
- **Pre-flight env guards.** Every migrator opens with `ensureSanity()`
  + `ensureWebflow()` from `src/lib/env.ts` so a missing token throws
  immediately with a clear message rather than failing mid-migration.
- **Per-script `content_migrations` upsert.** Each migrator records its
  own `parity_score`, `error_log[]`, and `status` ('complete' | 'failed')
  via `recordMigration()`. The verifier is the single readout.

### Files Created / Modified

- `src/lib/content/{sanity-write-client,webflow-read-client,migration-tracker,ce-collection-ids}.ts`
- `scripts/content/{start-content-phase,migrate-tags,migrate-blog-categories,migrate-glassdoor-reviews,migrate-benefit-values,migrate-staff-benefits,verify-content-1a}.ts`
- `src/lib/types.ts` — removed `MigrationStatus` and `TemplateType` enums;
  imports replaced with the canonical sources.
- `package.json` — 7 new scripts: `content:start`, `content:migrate-tags`,
  `content:migrate-blog-categories`, `content:migrate-glassdoor-reviews`,
  `content:migrate-benefit-values`, `content:migrate-staff-benefits`,
  `content:verify-1a`.
- Database: `content_migrations` got the
  `content_migrations_org_migration_collection_unique` constraint via
  the SQL editor (no migration script committed — DDL was a one-off
  unblock).
- DEBUG_CONTEXT.md created mid-phase for the constraint blocker; deleted
  after verification.

### Data State After Phase

- Supabase `migrations` (CE): `status = content_running`,
  `current_phase = content_running`. `metadata.scaffold_phase` block
  preserved from SCAFFOLD-1; no `content_phase` block written yet
  (closes when `content_complete` ships in CONTENT-1C).
- Supabase `content_migrations`: 5 rows for CE migration —
  `tags-consolidated 22/22`, `blog-categories 6/6`,
  `glassdoor-reviews 10/10`, `benefit-values 9/9`,
  `staff-benefits 6/6`. All `status = 'complete'`, `parity_score = 100`,
  `error_log = []`.
- Sanity production dataset (project `lzbhll1u`): 53 new CMS docs across
  5 types — `tag` (22), `blogCategory` (6), `glassdoorReview` (10),
  `benefitValue` (9), `staffBenefit` (6). The 34 SCHEMA-1 stub
  singletons/globals untouched.
- Filesystem: `src/lib/content/` (4 files), `scripts/content/` (7 files).
- 7 commits on `feat/content-1a` (tech debt + transition + infra +
  5 migrator slices + verifier).

### Surprises / Brief Deviations

- **Constraint missing** on `content_migrations`. Brief anticipated this
  and explicitly said "add it via the Supabase SQL editor before
  proceeding". Direct `pg` from the script can't apply DDL — pooler auth
  fails with `Tenant or user not found` at both 5432 and 6543, and the
  direct DB hostname doesn't resolve. Resolved by Jake via SQL editor.
  Minor follow-up for INFRA: rotate `SUPABASE_DB_URL` so future scripts
  can apply DDL automatically.
- **Glassdoor field map.** Brief's indicative table named
  `rating/date/source-url`, but the actual `WEBFLOW_TO_SANITY_FIELD_MAP §14`
  documents `clientName/title/reviewDescription/workField` — the brief
  itself instructs "use the exact Webflow API field slugs listed there".
  Followed the field map.
- **Benefit values category.** Webflow Option fields ship as opaque IDs
  rather than the Sanity enum string. Resolved by fetching the collection
  schema and translating once. New pattern noted above.
- **Image fields.** benefitValue and staffBenefit both have image fields
  in their Sanity schemas (typed `image`), but the brief explicitly
  defers asset migration to CONTENT-1C. Stored as `webflowImageUrl`
  string at the doc root. Sanity is permissive about extra fields not in
  the schema; they're stored on the doc and ignored by Studio.
- **Tech Debt #11 wording.** Brief says "Standardise on the string-literal
  union in `src/lib/audit-types.ts`", but `audit-types.ts` has
  `TemplateType` as an UPPERCASE enum (and is heavily referenced by
  `TemplateType.HOME` syntax across 4 audit scripts). Rewriting it as a
  literal union would have broken those callsites. Took the pragmatic
  read: "remove the duplicate from `src/lib/types.ts` and standardise on
  whatever lives in audit-types.ts" — kept the enum, deleted the
  duplicate. Type-checker clean.

---

## MYGRATR-SCAFFOLD-1 — Next.js Scaffold (April 2026)

### What Was Built

**Step 0a — pre-flight context update (`CLAUDE.md`):**

- Phase status table: SCHEMA-1 → ✅ Complete; SCAFFOLD-1 → 🔄 In Progress.
- Tech debt rows 10/11 (legacy `MigrationStatus` enum, `TemplateType` clash)
  reassigned `Fix In: MYGRATR-CONTENT-1` per brief — those clean-ups are
  out of the SCAFFOLD lane.

**Step 1 — Next.js app scaffold:**

- `npx create-next-app@latest site/` produced Next.js 16.2.4 (App Router,
  TypeScript strict, Tailwind v4, ESLint, src-dir, `@/*` alias). Brief
  permits 15+; 16 is the current latest.
- Sanity dependencies installed in `site/`: `next-sanity@12`,
  `@sanity/client`, `@sanity/image-url`, `@sanity/presentation`,
  `@sanity/visual-editing`, plus `clsx` and `tailwind-merge`.
- Root `.gitignore` extended: `site/.next/`, `site/node_modules/` ignored;
  `.audit/` restored (had been removed by an earlier edit).
- Site `.gitignore` modified: `!.env.local.example` exception so the
  template stays tracked while `.env.local` itself remains ignored.

**Step 2 — Sanity client + env:**

- `site/.env.local.example` (committed) and `site/.env.local` (ignored)
  with `NEXT_PUBLIC_SANITY_PROJECT_ID=lzbhll1u`,
  `NEXT_PUBLIC_SANITY_DATASET=production`,
  `NEXT_PUBLIC_SITE_URL=https://staging.jakevibes.dev`,
  `NEXT_PUBLIC_SANITY_STUDIO_URL=http://localhost:3333`,
  `SANITY_API_READ_TOKEN`.
- `site/src/lib/env.ts` — Zod-validated env loader scoped to the Next.js
  app. `NEXT_PUBLIC_SITE_URL` falls back to
  `https://${NEXT_PUBLIC_VERCEL_URL}` then `http://localhost:3000` so
  preview builds never crash.
- `site/src/lib/sanity/client.ts` — `sanityClient` (perspective
  `published`, `useCdn` only in production, stega gated by
  `VERCEL_ENV === 'preview' && NODE_ENV !== 'production'`) +
  `previewClient` (`previewDrafts`, no CDN, authenticated, stega on).
  `'server-only'` import at the top of the file prevents accidental
  client-bundle inclusion.
- `site/src/lib/sanity/queries.ts` — single `getSiteSettings` smoke-test
  query stub; CONTENT-1 / TEMPLATE-* expand.

**Step 3 — locale routing:**

- `site/src/lib/locale.ts` — `LOCALES` (en-US, en-GB), `DEFAULT_LOCALE`,
  `getLocaleFromPath`, `buildLocalePath`, `generateCanonical`,
  `generateHreflang`. Both generators normalise defensively (strip a
  leading `/uk/` if a UK path is passed). The `/uk` prefix guard
  explicitly checks `=== '/uk'` and `startsWith('/uk/')` so paths like
  `/ukraine/...` aren't mangled. A header comment block locks the
  contract for TEMPLATE-* phases — every `generateMetadata()` calls
  both helpers.
- `site/src/components/locale-provider.tsx` — client `LocaleContext`
  with `useLocale()` hook.
- UK route stubs: `site/src/app/uk/layout.tsx` wraps in `LocaleProvider
  locale="en-GB"`; `site/src/app/uk/page.tsx` mirrors `/`;
  `site/src/app/uk/[...slug]/page.tsx` calls `notFound()` (Next 16 async
  params) until TEMPLATE-* defines explicit dynamic segments.

**Step 4 — root layout, scripts, fonts, metadata, robots, sitemap:**

- `site/src/components/third-party-scripts.tsx` — three exports:
  `GeoTargetlyScript` (beforeInteractive, GeoTargetly inline redirect),
  `GtmHeadScript` + `GtmNoScript` (afterInteractive head + body iframe),
  and `GlobalScripts` for the rest. Each component renders its
  `<Script>` only when the corresponding identifier is confirmed in
  `audit-output/ce-scripts.json`. IDs sourced verbatim:
  GTM-WL45TCTW, LinkedIn 4901289, Hotjar 4985481, Clara workspace
  09aa62df-5af6-4cec-b565-c335e907327d, Facebook Pixel 160820827844254,
  HubSpot 22809822. GA4 (G-2Q22ZM5PLY) is fired through GTM and not
  loaded as a separate tag. GSAP/Swiper/Finsweet load
  afterInteractive; Calendly is `lazyOnload` globally for now (TEMPLATE-BAC
  may scope to /book-a-call/* later). Vector Tag, Ahrefs Analytics, and
  Cloudflare Insights are deliberately omitted — they appear in the
  audit but lack confirmed CE-tied identifiers; CONTENT-1 confirms.
- `site/src/app/layout.tsx` — async server component, `<html lang="en">`
  (UK pages override via `LocaleProvider` + per-page metadata), Inter
  font (300/400/500/600/700) loaded via `next/font/google` —
  confirmed in audit-output/pages/home/content.json customHeadCode
  (`WebFont.load: Inter:300,400,500,600,700`). `metadataBase` from
  `env.NEXT_PUBLIC_SITE_URL`, `title.template` "%s | Cloud Employee",
  `openGraph.images` defaults to `/og-default.png`. The OG override
  pattern for TEMPLATE-* phases is documented as a top-of-file comment.
  Body order: GTM noscript → Nav → children → Footer → SanityLive →
  conditional VisualEditing (draftMode().isEnabled) → GlobalScripts.
- `site/public/og-default.png` — 1×1 transparent PNG written via Node
  base64 decode. Seb replaces with the real 1200×630 brand asset
  pre-launch.
- `site/src/app/robots.ts` — `Disallow: /download-thank-you/` (design
  doc §10), sitemap link to `/sitemap.xml`.
- `site/src/app/sitemap.ts` — homepage + UK homepage stub. CONTENT-1
  expands across all 21 CMS types + singletons.

**Step 5 — nav and footer stubs:**

- `site/src/components/layout/nav.tsx` and `footer.tsx` — both server
  components. Each calls `getSiteSettings()` and null-guards before
  reading any properties (Sanity returns `null` if the singleton hasn't
  been created yet). Tech Debt #5 noted in `nav.tsx`: AUDIT-1's selector
  merged Technology dropdown into Services in
  `ce-global-components.json`; TEMPLATE-NAV will source the canonical
  link tree from the Sanity `navigation` global.

**Step 6 — redirects:**

- `scripts/scaffold/extract-redirects.ts` (`npm run redirects:extract`)
  reads three gitignored audit artefacts and writes three tracked TS
  files inside `site/src/lib/redirects/`:
  - `generated-redirects.ts` — 12 entries from
    `audit-output/ce-canonical-urls.json` (filter status=301/302, drop
    null `redirectTarget`, dedupe against locked rules).
  - `regex-redirects.ts` — 12 entries from
    `audit-output/ce-regex-redirects.json`. Webflow `(.*)` becomes
    Next.js `:slug*`; Webflow `%1` becomes `:slug*`. Webflow rules
    where the capture has no slash separator (`/foo(.*)`) are split
    into two rules — exact match + `/foo/:slug*` — because
    path-to-regexp can't repeat a parameter without a separator.
  - `webflow-redirects.ts` — 316 entries from
    `audit-output/webflow-redirects.csv` (drop 336 `/live-job-role/*`
    rows handled by the locked catch-all regex; drop the `/team` row
    that overlaps with the locked rule; strip query strings; dedupe
    against `regex-redirects.ts` entries that also live in the CSV).
- `site/next.config.ts` composes `[crawlRedirects, regexRedirects,
  webflowRedirects, lockedRules]` in that order. Locked rules from
  design doc §8: `/live-job-role/:path*` → talent.cloudemployee.io
  (308), `/team` → /about-us, `/our-work` → /customer-stories,
  `/alternatives` → /compare. Pinned `turbopack.root` to `__dirname`
  to silence the multi-lockfile warning. The `/archive/old-home` 410
  Gone behaviour is parked with a TODO for TEMPLATE-STATIC.
- Brief deviation: brief Step 6d says `webflow-redirects.ts` is
  "hand-authored from the verified markdown source" but the markdown
  only contains summary statistics + 5 examples — the 317 actual rows
  live in the gitignored CSV. The same Step 6c extraction-script
  pattern was applied. Tracked in commit `a61a161` and originally
  documented in `DEBUG_CONTEXT.md` (cleared at end of phase).

**Step 7 — Presentation Tool + draft mode:**

- `studio/sanity.config.ts` adds `presentationTool({ previewUrl: …
  previewMode/draftMode → '/api/draft-mode/enable' })`. Imported from
  `sanity/presentation` (the bundled path) — the standalone
  `@sanity/presentation` package is now a deprecated re-export that
  would crash at runtime. `@sanity/presentation` is still listed as a
  dependency to satisfy the brief's install step but the actual import
  path is the bundled one.
- `site/src/app/api/draft-mode/enable/route.ts` — calls
  `validatePreviewUrl(previewClient, request.url)`,
  same-origin-checks the redirectTo against
  `env.NEXT_PUBLIC_SITE_URL` (F10 hardening), then
  `(await draftMode()).enable()` and redirects to
  `pathname + search + hash` only.
- `site/src/app/api/draft-mode/disable/route.ts` — disables the cookie
  and returns "Draft mode disabled". F15 (POST-only + origin check) is
  deferred per brief.
- `site/src/lib/sanity/live.ts` — `defineLive({ client: sanityClient })`
  exposes `sanityFetch` and `SanityLive`. The brief's
  `export { SanityLive } from 'next-sanity'` form doesn't exist in
  next-sanity@12; the factory pattern is the current API.
- Layout renders `<SanityLive />` always and `<VisualEditing />` only
  when `(await draftMode()).isEnabled`. `VisualEditing` imported from
  `next-sanity/visual-editing` (the brief's `next-app-router` subpath
  also doesn't exist in this version).

**Step 8 — phase scripts + smoke test + Vercel deploy:**

- `scripts/scaffold/start-scaffold-phase.ts` requires `--confirm`,
  asserts the schema_complete → scaffold_running transition, idempotent
  on re-run.
- `scripts/scaffold/complete-scaffold-phase.ts` requires `--confirm`
  and `--preview-url`, transitions to scaffold_complete and writes
  `metadata.scaffold_phase = { completed_at, vercel_preview_url }`.
- `npm run build` passes locally with zero TS / ESLint errors. `npm
  run start` smoke tests on http://localhost:3000 confirmed `/`,
  `/uk`, `/team→/about-us`, `/our-work→/customer-stories`,
  `/live-job-role/x→talent.cloudemployee.io/x`, sample webflow
  `/after-care→/how-it-works`, `/sitemap.xml`, `/robots.txt`, GTM and
  GeoTargetly tags all working.
- Preview deploy at
  `https://mygratr-c3utcgloa-cloud-employee.vercel.app` (Vercel
  deployment protection on; smoke-tested via the project owner's
  account, all 9 brief-spec checks pass).
- `migrations.status = scaffold_complete` for CE migration; metadata
  includes the preview URL.

### Patterns Established (added to CONVENTIONS.md)

- **Next.js App Router conventions for the generated site**: every
  page's `generateMetadata()` calls `generateCanonical(path, locale)`
  and `generateHreflang(usPath)` from `site/src/lib/locale.ts`. The
  canonical/hreflang generators normalise paths defensively and are
  the single source of truth.
- **UK locale via URL prefix, not Next.js i18n**: handled by an
  explicit `site/src/app/uk/` segment, never the framework's i18n
  config.
- **Third-party scripts only render with confirmed identifiers**: each
  script in `site/src/components/third-party-scripts.tsx` is gated on
  a constant pulled verbatim from audit output. Unconfirmed IDs return
  `null` — never fabricated values.
- **Redirect data extraction pattern**: gitignored audit artefacts go
  through `scripts/scaffold/extract-redirects.ts` and produce tracked
  TS files inside `site/`. `next.config.ts` only imports tracked files
  so Vercel builds don't depend on `audit-output/`.
- **Sanity Live factory**: `defineLive({ client })` in
  `site/src/lib/sanity/live.ts` exports `sanityFetch` + `SanityLive`
  for the rest of the site.

### Files Created / Modified

- `site/` — entire Next.js 16 app (≈40 files including create-next-app
  scaffold).
- `site/src/lib/env.ts`, `locale.ts`, `sanity/{client,queries,live}.ts`,
  `redirects/{generated,regex,webflow}-redirects.ts`.
- `site/src/components/locale-provider.tsx`, `third-party-scripts.tsx`,
  `layout/{nav,footer}.tsx`.
- `site/src/app/{layout,page,robots,sitemap}.ts(x)`,
  `uk/{layout,page,[...slug]/page}.tsx`,
  `api/draft-mode/{enable,disable}/route.ts`.
- `site/next.config.ts` (overwrote create-next-app stub).
- `studio/sanity.config.ts` (added `presentationTool`).
- `studio/package.json` + `studio/package-lock.json` (added
  `@sanity/presentation`).
- `scripts/scaffold/{extract-redirects,start-scaffold-phase,complete-scaffold-phase}.ts`.
- `package.json` — three new scripts: `redirects:extract`,
  `scaffold:start`, `scaffold:complete`.
- `.gitignore` extended; `site/.gitignore` exception for
  `.env.local.example`.

### Data State After Phase

- `migrations` row CE: `status = scaffold_complete`,
  `current_phase = scaffold_complete`,
  `metadata.scaffold_phase = { completed_at, vercel_preview_url }`.
- Vercel preview URL: `https://mygratr-c3utcgloa-cloud-employee.vercel.app`.
- 11 commits on `feat/scaffold-1`; merging to `main` closes the phase.

### Surprises / Brief Deviations

- **Next.js 16 instead of 15.** create-next-app installs 16.2.4; brief
  permits 15+. Recorded for context only — no code adjustments needed.
- **Brief mentioned three import paths that don't exist in the current
  package versions**:
  `@sanity/visual-editing/next-app-router` (use
  `@sanity/visual-editing/react` or `next-sanity/visual-editing`),
  `@sanity/presentation` direct import (use `sanity/presentation`),
  `next-sanity` root re-export of `SanityLive` (use
  `defineLive({ client })`). All three resolved by the more current
  recommended path.
- **Webflow redirects source.** Brief says hand-authored from
  redirects-verification.md, but that markdown only contains summary
  statistics + 5 examples; the 317 actual rows live in
  webflow-redirects.csv (gitignored). Resolved by extending the
  Step 6c extraction-script pattern.
- **Path-to-regexp parameter rules.** Webflow `/foo(.*)` doesn't
  translate cleanly because path-to-regexp can't repeat without a
  separator. Split into two rules per affected pattern.
- **Vercel deployment protection.** Preview URL returned 401 to
  ordinary curl; Jake verified the smoke checklist against the
  protected URL through `vercel curl` / browser auth.

---

## MYGRATR-SCHEMA-1 — Sanity Schema Design (April 2026)

### What Was Built

**Pre-requisite infrastructure (Step 0a — not in original brief scope; the
brief referenced these as existing but they were not yet in the repo):**

- `tsconfig.json` — added `paths: { "@/*": ["./src/*"] }` (no baseUrl;
  TypeScript 5+ supports paths without it, and TS6 deprecated baseUrl)
- `src/lib/env.ts` — Zod-validated env loader with runtime guards
  (`ensureSanity`, `ensureWebflow`, etc.) for optional service keys
- `src/lib/supabase.ts` — `createServerClient()` for admin/migrations
- `src/lib/pipeline/state-machine.ts` — canonical `MigrationStatus`
  string-literal union + VALID_TRANSITIONS map + `assertValidTransition()`.
  The legacy `MigrationStatus` enum in `src/lib/types.ts` predates the
  running/complete/failed split and uses shortform values; state-machine.ts
  defines its own type locally (flagged in Known Tech Debt).
- `studio/` — Sanity v5 Studio scaffold: package.json, sanity.cli.ts,
  sanity.config.ts, tsconfig.json, .gitignore. `sanity` + `@sanity/vision`
  + `react` + `styled-components` installed. Structure tool enabled;
  singletons filtered out of "new document" menu + duplicate/delete
  disabled via document actions filter.

**Shared object schemas (Step 2):**

- `studio/schemas/objects/portable-text.ts` — named array type; styles
  (normal, h2, h3, h4, blockquote), bullet/numbered lists, 5 decorators,
  link annotation with href + blank-target, inline image with hotspot
- `studio/schemas/objects/faq-item.ts` — `{question, answer:portableText}`
- `studio/schemas/objects/quote-block.ts` —
  `{paragraph, personImage, personName, personTitle}` for customerStory
- `studio/schemas/objects/fold.ts` — typed fold per §3.4 with FOLD_TYPES
  enum [headerIntro, featureBullets, itemList, paragraphSection, headerOnly]
- `studio/schemas/objects/section.ts` — 12 polymorphic variants per §4.4
  (richTextSection, twoColumnSection, ctaSection, imageSection,
  videoSection, testimonialSection, benefitsGrid, staffBenefitsGrid,
  glassdoorGrid, customerStoriesGrid, faqSection, hubspotFormSection)
- `studio/schemas/_shared.ts` — `localeField()`, `sourceTrackingFields()`,
  `metaFields({og})`, `slugField()`, `imageField()` reusable field builders

**21 CMS document types (Step 3):**

Simple leaf types: tag, blogCategory, glassdoorReview, benefitValue,
staffBenefit, downloadAccess, teamMember, review.

Reference-heavy types: video (→ tag), download (→ tag), bookACall (custom
slug from firstName+lastName), event (→ tag, teamMember), tool (→ tag),
compareBlog (→ tag, teamMember), blogPost (→ blogCategory, tag, teamMember).

Complex types: customerStory (problem/solution/impact with quoteBlock),
technology (typed folds replacing 34 flat fields), service (folds +
associatedTechnologies ref array), industry/persona/location (three
AI-search landing-page types sharing a factory in
`_landing-page-factory.ts`).

**31 singletons (Step 4):**

Four factory functions in `studio/schemas/singletons/_factories.ts` keep
shape consistent across all 31 files:

- `defineBlogHub` — §4.1 — blogHub + 6 category hubs (7 files)
- `defineCollectionHub` — §4.2/§4.3 — 4 resource hubs + 5 collection-index
  hubs (9 files; teamHub dropped per brief §6 deferred note since /team
  is a 301 to /about-us)
- `defineStaticPage` — §4.4 — 13 static content singletons with the
  12-variant sections array + locale
- `defineCalculatorPage` — §5 — 2 Tier-3 calculator pages (marketing
  copy wrappers; logic hardcoded in Next.js)

**3 globals (Step 5):** siteSettings, navigation, footer per §6.1–§6.3.

**Studio structure config (Step 6):**

`studio/schemas/structure.ts` groups the 34 singleton/global docs into
six nav sections: Static Pages, Blog Hubs, Resource Hubs, Collection
Indexes, Calculator Pages, Site Globals. Each surfaces as a direct
single-document nav item (not a list view). Regular CMS document types
appear below a divider using `S.documentTypeListItems()` filtered to
exclude singletons. `sanity.config.ts` also filters singletons from the
"new document" templates menu and strips duplicate/delete from their
document actions.

**Zod types mirroring every schema (Step 7):**

- `src/types/sanity/shared.ts` — primitives (SanityImage, SanitySlug,
  SanityRef), PortableTextSchema (z.unknown-backed array per brief §3.2),
  enums (Locale, Source, FoldType), shared embedded objects
  (FoldSchema, FaqItemSchema, QuoteBlockSchema), discriminated-union
  SectionSchema across 12 variants, MetaFieldsSchema /
  MetaFieldsNoOgSchema / SourceTrackingFieldsSchema factories,
  SanityBaseDocumentSchema (system fields)
- `src/types/sanity/documents/` — 21 files + `_landing-page-factory.ts`
- `src/types/sanity/singletons/` — 31 files + `_factories.ts`
  (blogHubSchema, collectionHubSchema, staticPageSchema,
  calculatorPageSchema)
- `src/types/sanity/globals/` — 3 files
- All types `export *`-ed through `src/types/sanity/index.ts`

**Migration-map doc (Step 8):**

`docs/WEBFLOW_TO_SANITY_FIELD_MAP.md` (500 lines, v1.0): 20 sections
covering all 33 Webflow collections (7 blogs consolidate under §1, 6 tags
under §17, 17 single-mapping types across §2–§19, 3 dropped under §20).
Each section has a field mapping table + DROPPED FIELDS + NEW FIELDS
callouts. MIGRATION BLOCKS table at the bottom lists pre-launch blockers:
meta backfills (157 items across technology/service/teamMember/review/
bookACall), required author refs (127 blog+compare items),
`/customer-story/virgin` placeholder text, and the 4 UNKNOWN canonical
URLs (tech-debt #9).

**Four scripts under `scripts/schema/`:**

- `start-schema-phase.ts` — assertValidTransition audit_complete →
  schema_running, update migrations row
- `seed-singletons.ts` — createIfNotExists for 34 singleton/global docs
  with per-type minimal shapes; requires --confirm-production; 34 docs
  seeded in production dataset (logged created vs already-exists)
- `smoke-test-seed.ts` — self-contained integration test; createOrReplace
  with deterministic _ids; seeds dummy blogCategory/tag/teamMember,
  then technology with 3 typed folds, then a blogPost referencing all
  three. All 5 docs accepted by the Sanity API.
- `record-schema-designs.ts` — 21 schema_designs inserts with curated
  sanity_schema JSONB summaries (typeName, schemaFile, sourceCollections,
  sourceItemCount, fieldCount, requiredFields, referenceFields, notes),
  then assertValidTransition schema_running → schema_complete and
  metadata.schema_phase = {document_types:21, singletons:31, globals:3,
  objects:16, completed_at}

### Data State After This Phase

- Supabase `migrations` (CE): `status = schema_complete`,
  `current_phase = schema_complete`,
  `metadata.schema_phase = {document_types:21, singletons:31, globals:3, objects:16, completed_at:"2026-04-24T11:08:54.363Z"}`
- Supabase `schema_designs`: 21 rows for CE migration, all at
  `version=1`, `status='approved'`, `specialist_reviewed=false`.
  Slugs: blogs-consolidated, compare-blogs, technology-pages, services,
  customer-stories, team-members, reviews, videos, downloads,
  downloads-access-pages, tools-quizzes, book-a-call-pages,
  events-webinars, glassdoor-reviews, client-benefits-company-values,
  staff-benefits, tags-consolidated, hubs, industry-placeholder,
  persona-placeholder, location-placeholder.
- Sanity production dataset (project `lzbhll1u`): 34 singleton/global
  stub docs + 5 smoke-test docs with `smoke-test-*` prefix. Stub docs
  have placeholder titles and trivial fields; required content
  (metaTitle, metaDescription, required images) intentionally omitted
  so Studio flags them as TODOs for content migration.
- Filesystem: studio/ (Sanity project), studio/schemas/ (71 schema
  types), src/types/sanity/ (55 Zod files), scripts/schema/ (4 scripts),
  docs/WEBFLOW_TO_SANITY_FIELD_MAP.md.

### Key Decisions / Interpretations

The brief and the design doc both referenced infrastructure
(`src/lib/env.ts`, `src/lib/supabase.ts`, `src/lib/pipeline/state-machine.ts`)
that did not exist in the repo. Jake authorised creating it inside this
session rather than splitting into a separate INFRA brief — patterns were
fully documented in CONVENTIONS.md §69-101 / §142-184 / §402-435, so no
architecture decisions were taken. The SCHEMA lane (brief §7) was
extended to include `src/lib/*` prereqs.

Brief step order (Step 4 → 4a → 5) reordered to Step 4 → 5 → 4a, because
Step 4a seeds all 34 singleton/global docs and needed the global schemas
registered first. Idempotent `createIfNotExists` means the reorder is
safe either way.

TeamHub singleton dropped (brief §6 deferred note — `/team` is a 301 to
`/about-us`, so 5 collection-index singletons instead of 6). Total 31
singletons matches the brief's Step 6 SINGLETON_TYPES list.

Sanity Studio v5 (latest `sanity` package) used; the brief's "Sanity v3"
reference means the v3 Studio API (`defineType` / `defineField` /
`defineArrayMember`), which is still current in v5. No
`__experimental_actions` — singleton enforcement via the `document.actions`
filter in sanity.config.ts + the grouped structure in structure.ts.

`sanity_schema` JSONB column stores a curated summary, not a full
`defineType` serialisation. The `fields[].validation` callbacks aren't
JSON-safe, and the `sanity` package is only installed in `studio/` (not
root), so serialising from root scripts would require ESM/CJS bridging.
The summary (typeName, fieldCount, requiredFields, referenceFields,
notes) captures the design decisions that matter for provenance and
diffing; the full schema lives in code.

### Patterns Established (see CONVENTIONS.md)

- Sanity v3 schema conventions (`defineType` / `defineField` /
  `defineArrayMember`; default-export per file; registry aggregated in
  `studio/schemas/index.ts`)
- Factory functions for repeated schema shapes (singleton factories,
  landing-page factory; same pattern on the Zod side)
- Zod mirror pattern: every Sanity schema has a matching Zod schema
  with inferred type alias; PortableText is z.unknown() pending
  TEMPLATE-* when renderers are built
- Curated `sanity_schema` JSONB summaries (not full serialisation)
- Studio structure config pattern: group singletons into topical nav
  lists; hide them from new-doc menu; strip duplicate/delete actions

### Surprises

- Sanity v3's `templates` filter in `schema.templates: (templates) =>
  templates.filter(...)` is the v5-current way to hide types from the
  new-doc menu. The brief mentioned `structureTool` is "no longer" the
  place for this filter, but didn't spell out the `templates` or
  `document.actions` filters — the canonical v5 approach landed on
  checking the installed Sanity package and using whichever API is live.
- TypeScript 6 deprecated `baseUrl` at the tsconfig level. Adding
  `paths: { "@/*": ["./src/*"] }` without baseUrl works cleanly (TS 5+).
- The existing `MigrationStatus` enum in `src/lib/types.ts` uses shortform
  values (`'audit'`, `'schema'`) that don't match the actual Supabase
  data (`'audit_complete'`, `'schema_running'`). Not used anywhere in
  working code, but it's dead-code tech debt flagged for future cleanup.

### Known Tech Debt Added

Logged in CLAUDE.md — see the Known Tech Debt table. In short:
- `src/lib/types.ts` MigrationStatus enum is out of sync with
  `state-machine.ts`'s canonical string-literal type and with the
  Supabase `migrations.status` column. Delete the enum or align values.
  Dead code today (no import sites) but a trap for future contributors.

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

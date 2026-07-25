# MYGRATR-STATIC-3 — Session Brief

**Phase:** MYGRATR-STATIC-3 (Visual Rebuild)
**Phase weight:** Foundational (full Tier 3 discipline)
**Branch:** `feat/design-1` (continues from STATIC-2 close)
**State on entry:** `migrations.status = content_complete`
**State on exit:** `migrations.status = content_complete` (unchanged — visual rebuild, no state transition)
**Prerequisite:** STATIC-2 closed (schemas extended, content reseeded from live-site audit)

---

## §1 — Purpose

STATIC-2 extended the schemas and reseeded Sanity with the full content needed to match CE's live chrome. STATIC-3 rebuilds the visual surface to consume that content — with a narrow carve-out on animation only.

Specifically in scope:
- **Header floating-pill VISUAL TREATMENT** at all scroll positions (rounded container, margin from screen edges, shadow, navy bg showing behind). This is pure CSS. The live CE site shows the floating pill at scroll-position-0; it is not a scrolled state.
- Services dropdown becomes a two-column mega-menu with grouped sections, icons, taglines, and a highlighted-items sub-card in the left column
- How It Works dropdown becomes a three-card mega-menu with photos + a bottom CTA panel
- Resources dropdown becomes a three-column mega-menu (links column + Blogs column + Customer Stories column on dark-green bg)
- Footer rebuild: top CTA block, Our Expertise + Learn more two-section grouping, Talent Locations column, restructured Subscribe block, bottom bar with Sitemap + Region + General Terms
- Primary nav order: **Services / Our Clients / How It Works / Resources / Pricing / About Us** (6 links, Embedding removed from primary nav). "Our Clients" is the primary nav label — NOT "Customer Stories" (which is the heading of the third column inside the Resources mega-menu).
- Header locale switcher removed (live CE site has no Header locale switcher; region selection lives in Footer)
- Active-state indicators on dropdown triggers: chevron-down inside thin circle outline when closed, chevron rotated 180° (chevron-up) when open. Flat links (Our Clients / Pricing / About Us) have no arrow.

**Carve-out — scroll-triggered animation refinement is NOT in STATIC-3.** STATIC-3 ships the floating-pill VISUAL state. Whatever subtle morph happens on scroll (specific transitions captured by STATIC-2's `scroll-behavior.json`) ships at TEMPLATE-HOME against the existing Tier-1 spec at `docs/design/components/nav-sticky-transition-global.md` (GSAP ScrollTrigger driven by `.cc-hero`, which doesn't exist until HOME ships). STATIC-3 header uses `position: sticky` only; no scroll listener, no GSAP, no scroll-triggered transitions. Visual treatment is identical at all scroll positions until HOME upgrades it.

When STATIC-3 closes, the site's chrome layout, content, and visual treatment matches `cloudemployee.io`. The only delta until TEMPLATE-HOME is whatever subtle scroll-tied morph the live site has (reference material captured for HOME phase). Reference screenshots are authoritative for visual layout decisions; the STATIC-2 audit outputs are authoritative for content + structure; the existing `nav-sticky-transition-global.md` spec is the contract for the deferred animation.

---

## §2 — Scope

### §2.1 — In scope

1. **Header rebuild (visual + structural):**
   - **Floating-pill visual treatment** at all scroll positions: white rounded container (border-radius from STATIC-2 audit), margin from screen edges (~12-24px depending on captured CSS), shadow (token from STATIC-2 audit), navy/brand-tertiary background visible behind
   - `position: sticky` with `top: 0` (no scroll listener; no animation transitions between scroll states)
   - 6 primary nav links in correct order (**Services / Our Clients / How It Works / Resources / Pricing / About Us**)
   - Three mega-menu dropdowns (Services, How It Works, Resources) replacing STATIC-1's simple dropdowns
   - **Active-state indicators:** dropdown triggers show chevron-down inside thin circle outline (1.5px stroke, ~20px diameter) when closed. When open, chevron rotates 180° (becomes chevron-up). Smooth CSS transition (150ms) on the rotation. Flat links (Our Clients / Pricing / About Us) have no arrow.
   - **Header locale switcher REMOVED** (live CE site has no Header locale switcher; region selection lives in Footer)
   - Schedule a Call CTA — same lime green pill from STATIC-1, same canonical Calendly URL (`https://calendly.com/d/cwwf-6k5-2qy/intro-call-cloud-employee`)
   - **No scroll-triggered animations.** Reference screenshots for any scroll-tied morph filed at `docs/design/components/_assets/nav-sticky-transition-global/screenshots/` for TEMPLATE-HOME consumption.

2. **Three mega-menu components:**
   - `ServicesMegaMenu` — two-column layout with pill section headers (clickable links), icons, taglines. Left column has a 2-item highlighted sub-card (Software Engineers + Fractional CTOs) above a flat list (Mobile Developers + 5 more). Right column top: By Technology pill (6 items). Right column bottom: AI Services + Product Builds pills + items.
   - `HowItWorksMegaMenu` — three image cards + bottom CTA panel (pale teal/mint background)
   - `ResourcesMegaMenu` — three-column with Resources pill links + Blog cards + Customer Story cards (dark-green bg)
   - **Mega-menu container width matches header pill width** (not full-screen overlay). Visually appears as an extension of the header pill, same border-radius and margin from screen edges. Same shadow.

3. **Footer rebuild:**
   - Top CTA block ("Ready to hire your next engineer?" + stat row + two CTAs)
   - Our Expertise section (Full-time Staff Augmentation + Technology columns + Project Builds + AI Services pill buttons)
   - Learn more section (About + Resources columns)
   - Talent Locations column (LATAM + Philippines Developers)
   - Subscribe block (heading + description + HubSpot form + button)
   - Bottom bar (copyright + General Terms + Privacy Policy + Sitemap + Region selector)

4. **Mobile responsiveness for all of the above** — mega-menus collapse to accordion sections inside the existing Radix Dialog drawer; footer columns stack into single column.

5. **Accessibility parity with STATIC-1** — every interaction keyboard-accessible, focus management correct, axe-core 0 violations, Lighthouse A11y ≥96.

6. **SEO additions:**
   - `SiteNavigationElement` JSON-LD emitted at site layout level (listing primary nav items)
   - Every mega-menu link is a real `<a href>` (progressive enhancement; works without JS)
   - Internal linking graph grows by ~30 deep-links surfaced in mega-menus (icons + taglines + names from referenced service/technology docs)
   - No sitemap.xml changes (mega-menu links to existing routes)

7. **Performance additions:**
   - Lazy-render mega-menu content on first open (`useState`-gated mount; closed by default)
   - Mega-menu icons load with `loading="lazy"` (below the fold until dropdown opens)
   - Header CSS-critical for the floating pill (no FOUC of full-width bar state)
   - Reserve header height in body padding-top to prevent CLS
   - Hover prefetch on primary nav buttons for routes referenced inside the mega-menu

8. **Legacy schema field cleanup** — once STATIC-3 reads new fields exclusively, mark the legacy `columns[]` / `legalLinks[]` / `newsletterFormId` / `copyrightText` / `primaryLinks[].dropdownItems` / `localeDropdown` fields for removal in a future schema cleanup phase (Tech Debt entry at STATIC-3 close, not removed in STATIC-3).

### §2.2 — Out of scope

- **Scroll-triggered animation refinement** — deferred to TEMPLATE-HOME (batched with HOME hero scale-in + section-fade-reveal). Per `docs/design/components/nav-sticky-transition-global.md` the component uses GSAP ScrollTrigger driven by `.cc-hero` which doesn't exist until HOME ships. STATIC-3 ships the visual treatment; HOME ships the morph between scroll states.
- **Page-level "Build the team / We'll handle the rest" CTA panel** — visible in `docs/design/static-3-reference/footer.png` ABOVE the footer (the card with the photo of two women + Schedule a Call CTA + stat block "Start hiring in 7 days / No fees, no lock-in contracts"). This is a reusable page-level section component, NOT chrome. Belongs to TEMPLATE-HOME or a future section-level work batch. STATIC-3 does not build this.
- **Clara Chatbot widget** — the floating "🔍 Ask about our services..." search-style bar visible at viewport bottom in reference screenshots is already shipped from SCAFFOLD-1. Portal-mounted overlay, not part of footer DOM. STATIC-3 makes NO changes to it.
- Schema work (done in STATIC-2)
- Content seeding (done in STATIC-2)
- Hub page redesign — hubs stay as STATIC-1 shipped them
- TEMPLATE-* work — visual rebuild is chrome only
- Performance optimization beyond what's listed in §2.1.7 — SCAFFOLD-AUDIT batch
- New motion / animation libraries — STATIC-3 uses only CSS transitions for mega-menu open/close
- Removing legacy schema fields (deferred to future cleanup phase)
- Storybook stories for mega-menu components — these are layout-level, not primitives. Pair-rule applies to `site/src/components/ui/` only. `<MegaMenuPillLabel>` IS a primitive and DOES get a story.

### §2.3 — Locked decisions (from STATIC-2 close and STATIC-1 phase-close)

- 6 primary nav links: **Services / Our Clients / How It Works / Resources / Pricing / About Us**. The 2nd link label is "Our Clients" (NOT "Customer Stories" — that is the heading of the third column inside the Resources mega-menu).
- /embedding URL stays alive but is not in the primary nav
- How It Works mega-menu has 3 cards linking to /sourcing + /embedding + /retention
- No social icons in footer (Tech Debt #34 closed at STATIC-2)
- Reference screenshots are visual authority; STATIC-2 audit outputs are content authority; existing Tier-1 spec at `docs/design/components/nav-sticky-transition-global.md` is the contract for header animation when it ships at TEMPLATE-HOME
- **Header has no locale switcher.** Region selection lives in Footer only (matches live CE site).
- **Floating-pill VISUAL TREATMENT ships in STATIC-3.** Only scroll-triggered animation refinement deferred to TEMPLATE-HOME.
- Mega-menus are NOT primitives — they live at `site/src/components/layout/mega-menus/` and use CSS-only transitions.
- **Services mega-menu uses hybrid CMS-driven references** — items reference existing service/technology docs in Sanity; `name`, `thumbnail`, and `tagline` resolve from the referenced doc at render time (per STATIC-2 schema architecture).
- **Active-state arrow indicators:** chevron-down icon inside thin circle outline (1.5px stroke, ~20px circle diameter) when closed; rotates 180° (becomes chevron-up) when open. CSS transition 150ms on the rotation. No arrow on flat links.
- **Mega-menu container width matches header pill width** (not full-screen overlay).
- **Section pill labels in mega-menus are clickable links** (to category pages), not just headers.
- **Customer Story cards in Resources mega-menu use dark-green background** (not just generic "dark").
- **5 `<MegaMenuPillLabel>` variants** (not 4): `pill-green` (lime filled), `pill-dark` (navy filled), `pill-gradient` (purple-to-pink), `pill-navy` (deep navy filled), `pill-outline-light` (transparent bg, light border + text — used on dark/navy footer bg). 5th variant required for footer section labels + Project Builds / AI Services footer pills + "Contact us today" secondary CTA.

---

## §3 — Build Order

Six steps. Each step ends with a verification gate.

### Step 0 — Plan-mode pre-flight

**FIRST ACTIONS in Step 0 (before any item below):**

1. **View every reference screenshot** at `docs/design/static-3-reference/` (header.png, footer.png, mega-menu-services.png, mega-menu-how-it-works.png, mega-menu-resources.png). These are the visual source of truth for the chrome rebuild. Treat them as the contract — if anything in the brief contradicts what the screenshots show, the screenshots win and you raise the contradiction as a plan-mode finding.

2. **View the scroll-overlap reference screenshot** at `docs/design/components/_assets/nav-sticky-transition-global/screenshots/` showing pill sticking while content scrolls underneath. This is informational for STATIC-3 (the animation refinement deferred to TEMPLATE-HOME) — confirms the expected sticky behavior, NOT a target to implement.

3. **Read this image-source principle and apply it to every image-rendering decision in this phase:**

   STATIC-3 renders chrome by READING images from Sanity. STATIC-3 does NOT upload, generate, fetch, or create images. STATIC-2 already did all image work. Every `<Image>` component in STATIC-3 sources its data from:

   - **Referenced doc fields via GROQ dereference** (preferred) — e.g., `servicesMegaMenu.leftColumn.items[]->{name, "icon": select(_type == 'service' => thumbnail, _type == 'technology' => techLogo, null), tagline}` (type-aware icon projection per STATIC-2 DELTA-7), `featuredPosts[]->{thumbnailImage}`, `featuredStories[]->{companyLogo}` (note: actual field is `companyLogo`, not `logo`)
   - **Inline image fields on the navigation global** (only where STATIC-2 explicitly populated them) — e.g., `resourcesMegaMenu.leftColumn.items[].icon`, `howItWorksMegaMenu.cards[].image` if Option B

   If a GROQ query returns no image (null dereference, missing field, deleted doc), STATIC-3 logs a console.warn in dev and renders without the image — **never** invents a placeholder, never uses a stock photo, never AI-generates anything. The Step 6 verification confirms no warnings fired in production read paths.

   **What this rules out:** Hand-coding SVG icons from descriptions in screenshots. Generating placeholder images. Hardcoding image URLs to external CDNs. Embedding base64 image data in component code.

   **What this rules in:** Sanity is the single source of truth. STATIC-3 is a render layer over Sanity content. If an image is wrong, the fix is in Sanity Studio (or a STATIC-2 reseed re-run), not in STATIC-3 component code.

**Plan-mode items (after the first actions above):**

1. **STATIC-2 close confirmation** — `verify-static-2.ts` passes; all new schema fields populated in Sanity; tagline patches applied to service + technology docs; `service.thumbnail` backfilled on every service doc referenced in the Services mega-menu (per STATIC-2 DELTA-1); backup exists. How It Works mega-menu uses inline `image` fields (Option B locked per STATIC-2 DELTA-2/4); no `singletonRef` field in schema.

2. **Primary nav label confirmation** — confirm via `docs/design/static-3-reference/header.png` that the 2nd primary nav link is "Our Clients" (NOT "Customer Stories"). STATIC-2 reseed should have populated this; verify via GROQ `*[_type == 'navigation'][0].primaryLinks[1].label`. Mismatch surfaces as plan-mode finding before Step 2.

3. **STATIC-2 scroll-behavior.json review** — the captured CSS for the floating pill (border-radius, margin, shadow, background, padding) IS the implementation spec for STATIC-3's header visual treatment. Plan-mode extracts exact values: `border-radius`, `margin-{top,left,right}` from screen edge, `box-shadow`, `padding`, `background-color`. Anything ambiguous goes back to Jake before Step 1.

4. **DESIGN-1 design token availability** — confirm tokens for: lime green CTA (`--color-cta` or named brand token from DESIGN-1 Step 1), navy footer (`--color-footer-bg` likely `brand-tertiary`), dark green for customer story cards (NEW token — capture from screenshots), pale teal/mint for How It Works bottom panel (NEW token), **outline-light border color for footer pill variant (NEW)**, shadow tokens, border-radius tokens. Mega-menu pill labels need **5 variants** (green / dark / gradient / navy / outline-light). Confirm exists or plan to add.

5. **CLS reservation strategy** — floating pill at top creates risk if body lacks `padding-top` matching header height. Decision: reserve space exactly via a `:root { --header-height: Npx }` token + `body { padding-top: var(--header-height) }`. Header height is fixed (no responsive variants other than at the mobile breakpoint where it might shrink). Plan-mode locks the value from STATIC-2 audit data.

6. **Mega-menu container shared shell** — Decision: shared `<MegaMenu>` shell at `site/src/components/layout/mega-menus/_shell.tsx` (handles open/close + focus management + z-index + max-width + outside-click + visual extension of header pill). Build the shell first as Step 1, prove with one mega-menu (Services) in Step 3 proof-component.

7. **Asset CDN routing** — Sanity images served via Sanity's CDN by default. Confirm `next.config.ts` `images.remotePatterns` includes `cdn.sanity.io`. STATIC-1 Step 4 image work confirms this is already configured; verify with a grep.

8. **Z-index audit** — mega-menus need to overlay the page content but stay below the mobile drawer overlay. STATIC-1 confirmed Radix Dialog uses high z-index for mobile drawer. Plan-mode confirms z-index scale: mega-menu = `z-40`, mobile drawer = `z-50`, header bar = `z-30`.

9. **Schedule a Call CTA** — confirmed: same canonical Calendly URL as STATIC-1 (`https://calendly.com/d/cwwf-6k5-2qy/intro-call-cloud-employee`), same Calendly popup pattern. No changes from STATIC-1.

10. **Defensive read pattern for new schema fields** — STATIC-1 BvR Step 4 surfaced that ZodErrors fire when nullable fields are missing vs null in GROQ projections. STATIC-3 must use the same `.nullable()` Zod pattern on every new mega-menu field that could be optional in the seeded data. **Plus:** mega-menu reference dereferencing in GROQ uses `->{...}` projection; if the referenced doc is deleted or unpublished, the ref returns `null` — Zod schema must handle that.

11. **SiteNavigationElement JSON-LD** — add to the root layout. Schema.org definition emits primary nav as structured data. Implementation: server-render a `<script type="application/ld+json">` block in `site/src/app/layout.tsx` (or its Sanity-driven equivalent) listing the 6 primary nav items + their URLs. **2nd item name MUST be "Our Clients"** per primary nav label decision.

12. **Hover prefetch behavior** — confirm Next.js Link `prefetch={true}` default works for the mega-menu trigger pattern. The mega-menu items inside aren't rendered until open, so they prefetch only after first open. Adding `onMouseEnter` prefetch on the primary nav buttons themselves would prefetch the *most-likely target route per category* before the mega-menu even opens. Decide in plan-mode: ship the optimization in STATIC-3 or defer to SCAFFOLD-AUDIT.

Plan-mode output same format as STATIC-2.

### Step 1 — Foundation work (tokens + shared infrastructure)

Build the substrate that the components consume.

1. **Add missing design tokens** identified in Step 0:
   - Lime-green CTA color (if not already a named brand token)
   - Footer navy (likely `brand-tertiary` from STATIC-1; reuse)
   - **Dark green** for Customer Story cards in Resources mega-menu (NEW token — exact value from STATIC-2 audit)
   - **Pale teal/mint** for How It Works bottom panel (NEW token — exact value from STATIC-2 audit)
   - Mega-menu pill label colors: green (CTA), dark (`--color-dark` or near-black), gradient (purple-to-pink for AI Services pill from screenshot), navy (brand-tertiary), **outline-light (light/white border + text on transparent bg — used on footer dark bg)**
   - Mega-menu container border-radius + shadow
   - **`--header-height` CSS variable** — fixed value (from STATIC-2 audit; likely ~80-100px desktop, smaller mobile). Used by `body { padding-top: var(--header-height) }` to reserve space and prevent CLS from the floating pill.
   - **Arrow-circle indicator** — for dropdown trigger chevron-inside-circle visual treatment. Circle: 1.5px stroke, ~20px diameter, transparent fill, navy border on header pill. Chevron inside: same navy stroke. Rotates 180° on open.

   Per DESIGN-1 token-system pattern: dual-consumer where applicable, raw-value rule with the two narrow exceptions. Document new tokens in `docs/design/TOKENS.md`.

2. **Header height reservation in body** — add `body { padding-top: var(--header-height) }` to global CSS. This prevents CLS from the sticky pill. Confirm in Step 2 gate that Lighthouse Perf's CLS metric is 0.

3. **Critical-CSS path for header** — header CSS must be in the critical path (Next.js automatically inlines critical CSS for above-the-fold content). Verify no FOUC of full-width-bar state by hard-refresh + cache-disabled probe (per DESIGN-1 HALT-discipline browser-cache trap pattern).

4. **Build `<MegaMenuPillLabel>` primitive** at `site/src/components/ui/mega-menu-pill-label/index.tsx`:
   - Renders the colored pill labels seen in the live site
   - Props: `label`, `variant` (5 variants: `pill-green` / `pill-dark` / `pill-gradient` / `pill-navy` / `pill-outline-light`), `as` (renders as `<a>` when section pill is a link, `<span>` when decorative), optional `hasArrow` (renders ↗ icon for footer pill links)
   - Variant API via CVA (per DESIGN-1 Primitive Component Pattern)
   - Per Pair-rule: `stories.tsx` co-located showing all 5 variants × 2 `as` modes = 10 cells (+ optional hasArrow variants)
   - Hand-built atop @radix-ui where applicable; no shadcn
   - `pill-outline-light` is used on dark backgrounds (footer); has transparent bg, ~1.5px light border, light text. Different from `pill-dark` which has filled dark bg.

5. **Build shared `<MegaMenu>` shell component** at `site/src/components/layout/mega-menus/_shell.tsx`:
   - NOT a primitive (layer-classified: layout component)
   - Props: `isOpen`, `onClose`, `triggerRef` (for outside-click + Escape handling), `children`, `aria-labelledby` (id of the nav trigger button)
   - **Visual treatment matches header pill**: rounded container, same margin from screen edges, same shadow, white bg
   - Positioned absolutely below header pill (top edge aligned to header bottom + small gap)
   - Width matches header pill width (NOT full-screen overlay)
   - Handles focus trap when open (use Radix `FocusScope` from `@radix-ui/react-focus-scope` — already a project dependency for Dialog)
   - Handles Escape to close
   - Handles outside-click to close
   - **Lazy-render children** — `children` prop only renders when `isOpen === true` on first open; stays mounted after that (avoid re-render thrash on subsequent opens). Pattern: `const [hasOpened, setHasOpened] = useState(false); useEffect(() => { if (isOpen && !hasOpened) setHasOpened(true) }, [isOpen, hasOpened]); return hasOpened ? <FocusScope>{children}</FocusScope> : null`
   - Open/close transition: CSS-only fade + slide-down (200ms), `@media (prefers-reduced-motion: reduce)` disables transition
   - Z-index: `z-40` (below mobile drawer's `z-50`, above page content `z-30` header)
   - No Storybook story (per §2.2)

**Step 1 gate:**
- `<MegaMenu>` rendered in isolation with placeholder content; focus trap + Escape + outside-click + reduced-motion + lazy-render all work (manual probe + axe-core)
- `<MegaMenuPillLabel>` rendered in all 5 variants via its Storybook story; visual match to screenshot reference; renders as `<a>` and `<span>` per `as` prop; `hasArrow` variant shipped
- New tokens documented in TOKENS.md including `--header-height` + dark-green + pale-teal + outline-light border color
- `body { padding-top: var(--header-height) }` applied; verified with manual probe (no header-overlap on hero content)
- Build passes; tsc passes

### Step 2 — Header rebuild (floating-pill visual + structural)

Following STATIC-1's proof-component pattern in a lighter form: the header rebuild is visual + structural (6 primary links + remove locale switcher + wire mega-menu triggers + ship the floating-pill visual treatment + arrow indicators). Mega-menus stay as STATIC-1's simple dropdowns wired to the 2 existing dropdownItems-driven primary links until Step 3 lands the first real mega-menu.

1. **Rewrite `site/src/components/layout/nav.tsx`** (server shell):
   - Logo + 6 primary links + Schedule a Call CTA (no locale switcher)
   - Server-renders the structural HTML
   - **Floating-pill outer wrapper:** white bg, rounded corners, margin from screen edges, shadow (CSS values from STATIC-2 audit). Navy bg of the page shows behind the pill.
   - Hands data to `nav-client.tsx`
   - **Emit SiteNavigationElement JSON-LD** as `<script type="application/ld+json">` listing the 6 primary nav items + URLs (server-rendered; helps Google's sitelinks generation)

2. **Rewrite `site/src/components/layout/nav-client.tsx`** (client island):
   - 6 primary nav buttons (3 with `dropdownType !== 'none'` → mega-menu triggers; 3 with `dropdownType === 'none'` → plain `<Link>` to URL)
   - **Active-state arrow indicators:** dropdown triggers render a chevron-down icon **inside a thin circle outline** (1.5px stroke, ~20px diameter circle, transparent fill). When dropdown is open, chevron rotates 180° (visually becomes chevron-up). Smooth CSS transition (150ms) on the rotation via `transform: rotate(180deg)`. Flat links render NO arrow. Arrow icon uses the existing `<Icon>` primitive with sprite-based glyph; circle is a wrapper `<span>` with border + border-radius CSS.
   - **No `useScrollPosition` hook, no scroll listener, no scroll-triggered animations.** Header visual is identical at all scroll positions.
   - Header uses `position: sticky` + `top: 0`
   - **Locale switcher removed.** Pathname-aware logic gone; Region selector in Footer takes over.
   - Mega-menu trigger buttons render with `aria-haspopup="true"` + `aria-expanded` + `aria-controls` (matches STATIC-1 hand-built Disclosure pattern)
   - **Hover prefetch:** `onMouseEnter` on each mega-menu trigger calls `router.prefetch()` on the most-likely target route (e.g., `/services` for Services trigger). Marginal perf benefit; deferred to SCAFFOLD-AUDIT if Lighthouse doesn't show improvement.
   - Until Step 3 lands the first mega-menu, mega-menu triggers open STATIC-1's simple dropdownItems-driven dropdowns as a transitional state. Step 3 replaces the Services trigger content; Step 4 replaces How It Works + Resources.

3. **Header positioning:**
   - `position: sticky` (matches STATIC-1; no change)
   - `top: 0`
   - Z-index `z-30` (below mega-menu `z-40`, below mobile drawer `z-50`)
   - **No transition / no scroll-tied animation in STATIC-3** — the floating pill is the steady state at all scroll positions.

**Step 2 gate (visual + structural):**
- Header renders as floating pill at all scroll positions (visual match to live-site screenshots at top of page + scrolled)
- 6 primary links in correct order — **Services / Our Clients / How It Works / Resources / Pricing / About Us**
- Active-state arrows: chevron-in-circle on 3 mega-menu triggers, no arrow on 3 flat links (Our Clients / Pricing / About Us). Confirm visually + via DOM probe; on dropdown-open, chevron rotates 180° via CSS.
- Header locale switcher gone (not rendered)
- All STATIC-1 functionality preserved (keyboard nav, CTA, mobile drawer)
- Mega-menu triggers visible with correct `aria-*` attributes
- Triggers temporarily open the STATIC-1 simple dropdown content (placeholder until Step 3)
- SiteNavigationElement JSON-LD present in page source (verified by Playwright probe); JSON-LD `name` field for 2nd nav item is "Our Clients"
- Body has `padding-top: var(--header-height)` reserved — CLS = 0 in Lighthouse
- axe-core 0 violations
- Lighthouse Perf no regression vs STATIC-1 baseline
- Hard-refresh + cache-disabled probe: no FOUC of full-width-bar state
- Jake visual review before proceeding to Step 3

### Step 3 — Services mega-menu (proof-mega-menu before bulk-build)

Build the Services mega-menu first as the proof-component for the mega-menu pattern. Step 4 bulk-builds the remaining two against the locked pattern.

1. **Build `<ServicesMegaMenu>` component** at `site/src/components/layout/mega-menus/services.tsx`:
   - Consumes `navigation.servicesMegaMenu` from Sanity (hybrid CMS-driven; references resolved via GROQ `->{...}` projection)
   - GROQ projection dereferences each `items[]` ref to pull `name`, `slug`, `thumbnail`, `tagline` from the referenced service/technology doc:
     ```groq
     servicesMegaMenu {
       leftColumn {
         sectionLabel,
         sectionLink,
         sectionLabelStyle,
         highlightedItems[]->{_id, _type, name, slug, thumbnail, tagline},
         items[]->{_id, _type, name, slug, thumbnail, tagline},
         viewAllLink
       },
       rightColumnTop {...same pattern...},
       rightColumnBottom { sections[] {...same pattern...} }
     }
     ```
   - Defensive Zod parse — `.nullable()` on every optional sub-field; reference dereference can return `null` if the referenced doc is unpublished/deleted (Zod schema must handle that and the rendering must filter null entries out before mapping)
   - URL composed from `_type` + `slug` via existing route mapping (per STATIC-1 toInternalHref pattern): service → `/services/{slug}`, technology → `/technology/{slug}`
   - Two-column layout
   - **Left column:**
     - Section pill at top: `<MegaMenuPillLabel as="a" href={sectionLink} variant={sectionLabelStyle} label={sectionLabel} />` — pill IS a clickable link (e.g., "Staff Augmentation" → /services or /staff-augmentation)
     - **Highlighted sub-card** below the pill: rounded inner container (pale background, subtle inset) wrapping the 2 `highlightedItems[]` (Software Engineers + Fractional CTOs). Each item: name (bold) + tagline (lighter weight). Hover: subtle bg shift.
     - Below the highlighted sub-card: flat list of `items[]` (Mobile Developers, QA Analysts, DevOps Engineers, Data Scientists, No-Code Developers). Each item: name + tagline. No sub-card wrapper.
     - "View All" link at the bottom if `viewAllLink` is non-null (matches live site — Jake's reference screenshot shows "View All ▸" at the bottom of the left column)
   - **Right column top — "By Technology":**
     - Section pill: `<MegaMenuPillLabel as="a" href={sectionLink} variant="pill-dark" label="By Technology" />` — clickable
     - Items rendered in 2-column sub-grid (per screenshot: 3 items on left, 3 on right within this section)
     - Each item: icon (thumbnail from the referenced technology doc, 24×24) + name (bold) + tagline (smaller, lighter)
     - "View All" link at the bottom
   - **Right column bottom — "AI Services" + "Product Builds":**
     - Two grouped sub-sections side-by-side
     - Each sub-section: clickable `<MegaMenuPillLabel as="a" ...>` (AI Services = gradient pill, Product Builds = navy pill) + flat items list below
     - No "View All" links per screenshot
   - Each item is a single `<Link>` wrapping the whole item content (single anchor per item, per STATIC-1 title-as-link lock)
   - URL passes through `toInternalHref()` from `@/lib/url` per STATIC-1 URL normalization rule
   - **Image alt text:** each icon uses `alt` from the referenced doc's `thumbnail.alt` field. Required (per STATIC-2 schema `Rule.required()` validation); never empty.
   - **Loading:** each icon `loading="lazy"` (mega-menu is below-the-fold until opened)

2. **Wire to header trigger:**
   - "Services" primary link button → opens `<ServicesMegaMenu>` via `<MegaMenu>` shell
   - Trigger state managed in `nav-client.tsx` — toggle `openMenu === 'services'`
   - Arrow indicator on trigger flips: ↓ closed → ↑ open
   - Click to toggle (NOT hover-only — matches STATIC-1 hand-built Disclosure pattern; click is more reliable for mobile parity + accessibility). Hover prefetches `/services` (per Step 2's hover prefetch decision).

3. **Card semantics (matches STATIC-1 title-as-link lock):**
   - Single `<a>` per item, wrapping the whole item content
   - Icon + tagline visually clickable via card-level hover but NOT separately anchored
   - No nested anchors
   - Section pill labels (`<MegaMenuPillLabel as="a">`) are separately anchored — they're top-level links to category pages, not nested inside item anchors

4. **UI_STRINGS sweep:** Hard-coded UX affordance text like "View All", section labels in dev-only debug helpers, etc. go through `tools/eslint/ui-strings.json`. Section labels coming from Sanity (`servicesMegaMenu.leftColumn.sectionLabel`) do NOT — they're editorial. The "View All" string IS hardcoded and goes through UI_STRINGS (matches STATIC-1 UI_STRINGS rule).

**Step 3 gate (proof-mega-menu):**
- Visual match to live-site Services dropdown screenshot (sub-card on Software Engineers + Fractional CTOs, flat list below, pill section labels visually clickable)
- All 19 items render with correct icons + taglines + URLs (resolved from referenced service/technology docs)
- Highlighted sub-card renders distinctly from flat list
- Section pills render as `<a>` with correct hrefs
- Open/close interactions work: click trigger to open, click outside to close, Escape to close
- Arrow indicator on Services trigger flips correctly between ↓ closed / ↑ open
- Keyboard nav works: Tab cycles through items in DOM order, Shift+Tab reverses. Section pill links + item links all reachable.
- Focus returns to trigger on close
- Mobile: dropdown collapses to accordion section inside drawer (no mega-menu on mobile — accordion section labeled "Services" containing flat list of all 19 items grouped under sub-headings)
- `prefers-reduced-motion: reduce` disables open/close transition
- axe-core 0 violations
- All URLs resolve to real routes — no 404s
- Lazy-render verified: first open mounts content; subsequent opens are instant (manual DOM-inspector check)
- All `alt` attributes non-empty (DOM probe + axe-core)
- Jake visual review before proceeding to Step 4

### Step 4 — How It Works + Resources mega-menus (bulk-build after proof)

Pattern from Services mega-menu propagates. Two components built in parallel against the established pattern.

1. **Build `<HowItWorksMegaMenu>`:**
   - Consumes `navigation.howItWorksMegaMenu` from Sanity
   - Three image cards (Better hiring / Better delivery / Better retention)
   - Each card: photo on top (rounded corners) from inline `card.image` field (Option B locked per STATIC-2 DELTA-2/4), title + subtitle below, lime-green pill CTA at the bottom ("How we source talent" → /sourcing, "How we embed talent" → /embedding, "How we retain talent" → /retention)
   - Defensive read: `card.image.asset` should always be populated post-STATIC-2; if null in production (data integrity failure), log a console.warn in dev and render without the image — never invent a placeholder.
   - Each card is single-anchored on the title (per title-as-link lock); the CTA pill at the bottom is decoratively styled but the click target is the whole card
   - **Bottom panel** below the 3 cards: `pale-teal/mint` background container (uses new `--color-mint` token from Step 1), heading ("How does partnering with Cloud Employee work?") + subheading + dark navy CTA pill ("Discover how we do it" → /how-it-works) + decorative photo on the right. Photo from inline `bottomPanel.image` field (Option B locked).
   - Wired to "How It Works" primary nav trigger; arrow indicator on trigger flips ↓ closed → ↑ open
   - Images use `loading="lazy"`; alt text required (per STATIC-2 schema)
   - Hover prefetch on trigger: `/how-it-works`

2. **Build `<ResourcesMegaMenu>`:**
   - Consumes `navigation.resourcesMegaMenu` from Sanity
   - Three-column layout
   - **Left column — Resources:**
     - Section pill: `<MegaMenuPillLabel as="span" variant="pill-dark" label="Resources" />` (or `as="a"` if Sanity provides `sectionLink` — most likely no link here, plan-mode confirms)
     - 4 icon-pill links rendered as rounded outline-style pills (Free Downloads, Tools & Quizzes, Video Library, Events & Webinars). Each is a single anchor.
     - Each link has an icon (24×24) + label
   - **Middle column — Blogs:**
     - Heading "Blogs" (h3-styled) + dark navy "View all" pill button (top-right of column) linking to /blog
     - 3 featured blog cards stacked vertically: thumbnail (left, rounded) + title (right). Single anchor per card.
     - Thumbnail from referenced blogPost doc's `thumbnailImage` field; alt from `thumbnailImage.alt`
   - **Right column — Customer Stories:**
     - Heading "Customer Stories" (h3-styled) + lime-green "View all" pill button (top-right of column) linking to /customer-stories
     - 3 featured customer story cards stacked vertically: **dark-green background** (uses new `--color-dark-green` token from Step 1), rounded corners, customer logo (left, on dark bg) + headline (right, light text) + "Read full story ▸" affordance at bottom. Single anchor per card.
     - Logo from referenced customerStory doc's `logo` or `thumbnailImage` field; alt from corresponding alt field
   - Wired to "Resources" primary nav trigger; arrow indicator on trigger flips ↓ closed → ↑ open
   - All images use `loading="lazy"`; alt text required
   - Hover prefetch on trigger: `/blog` (most likely first-click destination)

3. **Mobile parity for both:**
   - On mobile, both collapse to accordion sections inside the existing Radix Dialog drawer
   - Section headings show in the drawer; tapping expands the section to reveal items
   - Each item is a direct link (no nested mega-menu structure on mobile)
   - Dark-green Customer Story cards: visual treatment preserved on mobile (don't strip the dark bg in the accordion view)

**Step 4 gate:**
- Both mega-menus visually match the screenshot references
- How It Works bottom panel uses pale-teal/mint background (new token applied)
- Resources Customer Story cards use dark-green background (new token applied)
- All references (blog posts, customer stories) resolve to real Sanity docs (no broken refs)
- All CTAs link to correct URLs (/sourcing, /embedding, /retention, /how-it-works, /blog, /customer-stories)
- Section pill labels render correctly (link or non-link per Sanity)
- Arrow indicators on triggers flip correctly between ↓ / ↑
- Lazy-render verified for both menus (first open mounts; subsequent opens instant)
- All `alt` attributes non-empty
- Mobile collapse works for both; dark-green styling preserved on mobile Customer Story items
- axe-core 0 violations
- Build + tsc pass

### Step 5 — Footer rebuild

1. **Port locale switcher logic to RegionSelector FIRST** (before Step 2 stripped the Header switcher; this is a sequencing note for Claude Code — the actual port should land in Step 1 foundation work to avoid losing the logic):
   - Build `site/src/components/layout/region-selector.tsx` using Radix DropdownMenu
   - Port the pathname-aware US↔UK switching logic from STATIC-1's `nav-client.tsx` locale switcher
   - Component is self-contained; both the legacy Header switcher (during Step 2 transitional state) and the new Footer can mount it
   - Step 2 strips the Header switcher mount; Step 5 mounts it in Footer

2. **Rewrite `site/src/components/layout/footer.tsx`:**
   - Consumes new `footer` global fields (top CTA block, sections, talentLocations, subscribe, bottomBar) from STATIC-2 schema
   - **Defensive read:** Zod schema with `.nullable()` on every new field; if any new field is null (STATIC-2 reseed missed it for some reason), fall back to STATIC-1 legacy field rendering for that section + log a console.warn in dev. Step 5 gate verifies no fallbacks fired against real Sanity data.

3. **Layout (top to bottom):**
   - **Top CTA block:** Heading "Ready to hire your next engineer?" (large display heading, white on navy bg) / description copy below / two pill CTAs on the right: "Start building your team" (`pill-green`) + "Contact us today" (`pill-outline-light` — transparent bg, light border + text). Stat row text below: "300+ teams built · 97% stay 2+ years · Cancel anytime" (lime green color). Stat row text is one Sanity field; if Sanity provides separated segments, render each; otherwise render the single string.
   - **Divider line**
   - **Our Expertise section:**
     - Section label pill "Our Expertise" rendered as `<MegaMenuPillLabel variant="pill-outline-light" hasArrow as="span" />` — outline-light styling (transparent bg, light border + text) with arrow icon
     - Two columns side-by-side:
       - **Full-time Staff Augmentation** column: heading text with small arrow-affordance icon (↗) to the right of the heading, indicating link. Heading itself is a link (e.g., `/services/staff-augmentation`). Editorial link list below — each link with hover state. 8 items per reference screenshot.
       - **Technology** column: same pattern — arrow-affordance heading link to `/technology` + editorial link list below. 7 items per reference screenshot (React / Node.js / Python / TypeScript / AWS / .NET / Java).
     - **Below the two columns:** two pill buttons side-by-side — "Project Builds" + "AI Services". Both rendered as `<MegaMenuPillLabel as="a" variant="pill-outline-light" hasArrow />` — **outline-light styling, NOT lime green or gradient like the mega-menu equivalents**. This is a deliberate footer visual choice per `docs/design/static-3-reference/footer.png`.
   - **Learn more section:** (positioned to the right of Our Expertise on desktop)
     - Section label pill "Learn more" rendered as `<MegaMenuPillLabel variant="pill-outline-light" hasArrow as="span" />`
     - Two columns: "About" (arrow-affordance heading link → /about) with 5 editorial items (How it works / About us / Pricing / Reviews / Careers); "Resources" (arrow-affordance heading link → /resources or /blog) with 6 editorial items (Customer Stories / CE vs. Alternatives / Blogs / Free Downloads / Tools / Video Library)
     - No bottom pill buttons (unlike Our Expertise)
   - **Talent Locations column:** (below Our Expertise on desktop)
     - Section label pill "Talent Locations" rendered as `<MegaMenuPillLabel variant="pill-outline-light" as="span" />` — **NO arrow on this section label** (different from Our Expertise + Learn more which DO have arrows). The items below are simple link list (LATAM Developers, Philippines Developers).
   - **Subscribe block** (positioned right of Talent Locations on desktop):
     - "Subscribe" heading (white, h3-styled)
     - Description copy "Everything you need to find, manage and retain exceptional tech talent — delivered monthly." (light grey)
     - Small inline form: white email input field (rounded, on dark footer bg) + lime green pill submit button "Subscribe" (`pill-green` variant)
   - **Divider line**
   - **Bottom bar:** Cloud Employee wordmark logo (left) / "© 2026 Cloud Employee. All rights reserved." copyright text / "General Terms" / "Privacy Policy" / "Sitemap" (plain text links, NO arrow icons) / "Region ▾" dropdown (right)

4. **HubSpot form embed:**
   - Reuse existing C6 `HubSpotFormEmbed` primitive
   - Form GUID stays `deac2450-b51b-4630-b9e2-47017a13da15`, portal `22809822`
   - **Visual treatment per reference screenshot:** white/light input field (rounded, on dark navy footer bg) + lime green pill submit button (`pill-green` variant) labeled "Subscribe". Use existing primitive's variant API to apply this styling; do not fork the primitive. If primitive lacks this variant, add it as a CVA variant (`variant="footer-inline"` or similar).

5. **Region dropdown mount (replaces Header locale switcher):**
   - Mount `<RegionSelector>` (built in Step 1)
   - "Region: US ▾" or "Region: UK ▾" with chevron
   - Click to open small dropdown with US + UK options
   - Selection navigates to the corresponding `/uk/...` or `/` route
   - Pathname-aware (ported from STATIC-1 Header locale switcher logic — same behavior)

6. **Sitemap link:**
   - Points to `/sitemap.xml`? Or a human-readable sitemap page?
   - Plan-mode confirms what the live CE site links to (the screenshot just shows "Sitemap" — needs the actual href)
   - Most likely `/sitemap.xml` (matches the URL_BUILDERS dispatch from STATIC-1)

**Step 5 gate:**
- Visual match to footer screenshot reference (`docs/design/static-3-reference/footer.png`)
- Section label pills (Our Expertise / Learn more) render as `pill-outline-light` with arrow icons
- Talent Locations section label pill renders as `pill-outline-light` WITHOUT arrow (per reference)
- Project Builds + AI Services bottom pills render as `pill-outline-light` (NOT lime/gradient) with arrow icons
- "Contact us today" secondary CTA renders as `pill-outline-light`; "Start building your team" primary CTA renders as `pill-green`
- Subscribe form: white/light input on dark navy bg + lime green pill submit button
- Arrow-affordance icons on Our Expertise + Learn more column headings render correctly (link to category pages)
- All links resolve to real routes or external URLs
- HubSpot form embed renders; submission works (manual test)
- Region dropdown switches locales correctly (test US → UK and back on home / blog post / hub / 404 — same test matrix as STATIC-1 Header locale switcher)
- axe-core 0 violations
- `role="contentinfo"` landmark preserved
- ARIA labels on every nav section
- Mobile layout: all columns stack into single column, CTA block stays prominent at top
- No console warnings about missing schema fields (confirms STATIC-2 reseed populated everything)

### Step 6 — Cross-cutting verification + phase close

Verification:

1. **Visual diff against live site** — manually compare every chrome surface (header default, all 3 mega-menus open, footer) at desktop (1440px) + tablet (768px) + mobile (375px) using reference screenshots at `docs/design/static-3-reference/` (header.png + footer.png + mega-menu-services.png + mega-menu-how-it-works.png + mega-menu-resources.png). Document any intentional deltas. The scroll-tied animation refinement is the one known delta and is expected — deferred to TEMPLATE-HOME.

2. **Sticky-pill overlap probe** — manually scroll a long page (home or any blog post). Confirm:
   - At scroll = 0: hero H1 fully visible below the pill, no overlap (validates `body padding-top: var(--header-height)` reservation)
   - On scroll-down: page content scrolls UP under the pill (expected sticky behavior; pill stays at top of viewport)
   - Pill is fully opaque white — content visible underneath should NOT show through the pill
   - Reference: `docs/design/components/_assets/nav-sticky-transition-global/screenshots/` shows the scrolling-overlap state captured from the live CE site — this state is the input for TEMPLATE-HOME's animation refinement work (e.g., HOME may add subtle backdrop-filter blur on pill, or scroll-triggered pill shrink to reduce visual overlap area). STATIC-3 ships the floating pill at steady state only; overlap with scrolling content is expected sticky behavior.

3. **Sweep all routes** — Playwright across the 11-route STATIC-1 sweep + 3 new mega-menu opens. Confirm no console errors. Confirm new chrome renders everywhere.

4. **axe-core** — 0 violations on header + each mega-menu open + footer + mobile drawer + each mobile accordion section + Region dropdown open.

5. **Lighthouse desktop** — Perf ≥80, A11y ≥96, SEO 100-in-prod. (Best Practices stays deferred to SCAFFOLD-AUDIT.) CLS = 0 (header height reservation working).

6. **JSON-LD validation** — extend `validate-json-ld.ts` to verify the new SiteNavigationElement block:
   - Block present in `<head>` or `<body>` of all routes
   - Schema.org valid (parses as `SiteNavigationElement`)
   - Lists all 6 primary nav items with non-null `name` + `url`
   - **2nd nav item `name` is "Our Clients" (NOT "Customer Stories")**
   - URLs are absolute (not relative)

7. **Keyboard contract probe** — extend `probe-nav-interactive.ts` to cover all 3 mega-menus (click trigger + Escape close + focus return + Tab order + section pill link Tab-reachable). Click + keyboard activation paths both verified. Arrow indicator state transitions verified via `aria-expanded` attribute changes; chevron-rotate CSS confirmed via computed-style probe.

8. **Hover prefetch perf measurement** — Lighthouse before/after probe on a representative click flow (e.g., hover Services trigger → click first item). If hover prefetch shows measurable TTFB improvement on the destination route, keep it. If not, file Tech Debt to remove (kept simple to avoid bloat).

9. **Critical-CSS / FOUC probe** — hard-refresh + cache-disabled + slow-3G throttle in Chrome DevTools. Header should appear as the floating pill on first paint — no flash of full-width-bar state. Manual probe.

10. **UI_STRINGS sweep** — every new piece of static UX-affordance copy in mega-menus + footer becomes a UI_STRINGS key. Editorial-changeable content stays in Sanity globals. Likely 15-30 new UI_STRINGS keys.

11. **Lazy-render probe** — open each mega-menu via Playwright; verify DOM has mega-menu content nodes only after first open (initial page-load DOM doesn't include them). Confirms the lazy-render pattern works.

12. **Page-level CTA panel + Clara verification** — confirm the page-level "Build the team / We'll handle the rest" CTA panel (visible above footer in `docs/design/static-3-reference/footer.png`) is NOT in the STATIC-3 footer DOM (it's a page-level section component, deferred to HOME). Confirm Clara Chatbot widget continues rendering as it did pre-STATIC-3 (no regression in SCAFFOLD-1 chatbot mount).

13. **Legacy field deprecation Tech Debt** — add Tech Debt entry: "STATIC-2 legacy navigation + footer fields (`primaryLinks[].dropdownItems`, `columns[]`, `legalLinks[]`, `newsletterFormId`, `copyrightText`, `localeDropdown`) are no longer read; remove from schema + delete from seed data in a future cleanup phase."

14. **TEMPLATE-HOME pin Tech Debt** — add Tech Debt entry: "Scroll-tied sticky-nav animation refinement deferred from STATIC-3 to TEMPLATE-HOME per locked spec `docs/design/components/nav-sticky-transition-global.md` (GSAP ScrollTrigger driven by `.cc-hero`). STATIC-3 shipped the floating-pill visual treatment; HOME ships the morph between scroll states. Reference: scrolling-overlap screenshot stored at `docs/design/components/_assets/nav-sticky-transition-global/screenshots/` shows the steady-state sticky overlap behavior — HOME may add backdrop-filter blur or scroll-triggered pill shrink to reduce visual overlap with hero content."

15. **TEMPLATE-HOME pin Tech Debt — page-level CTA panel** — add Tech Debt entry: "Page-level 'Build the team / We'll handle the rest' CTA panel above footer is NOT chrome — needs to be built as a reusable page-level section component during TEMPLATE-HOME or a section-level work batch. Reference: `docs/design/static-3-reference/footer.png` shows the panel above the footer."

Phase-close gate via `scripts/static/verify-static-3.ts`:
- All visual surfaces pass manual visual diff (modulo the documented scroll-tied animation delta)
- All sweeps + axe + Lighthouse pass
- SiteNavigationElement JSON-LD validates; 2nd item name is "Our Clients"
- New chrome reads new schema fields exclusively (legacy field reads gone from new component code; defensive fallbacks present but should never fire)
- STATIC-1 components fully replaced (no orphan code)
- Mobile parity confirmed across header + 3 mega-menus + footer
- Lazy-render works (DOM-inspector verified)
- CLS = 0 (Lighthouse)
- Clara Chatbot widget continues rendering (no regression)

Tier 3 context-file updates: same set as STATIC-2 (CHANGELOG, CLAUDE, PHASE_HISTORY, FEATURE_MAP, CONVENTIONS, REGISTRY, COMPONENTS, SCHEMA, CAPABILITY_LOG).

---

## §4 — Files Created / Modified

**Create:**
- `site/src/components/layout/mega-menus/_shell.tsx` — shared `<MegaMenu>` shell (layout component, not primitive); includes lazy-render via `hasOpened` useState
- `site/src/components/layout/mega-menus/services.tsx` — `<ServicesMegaMenu>` (hybrid CMS-driven; consumes reference-dereferenced service/technology docs)
- `site/src/components/layout/mega-menus/how-it-works.tsx` — `<HowItWorksMegaMenu>` (with pale-teal bottom panel)
- `site/src/components/layout/mega-menus/resources.tsx` — `<ResourcesMegaMenu>` (with dark-green Customer Story cards)
- `site/src/components/ui/mega-menu-pill-label/index.tsx` — pill label primitive (folder-per-primitive per DESIGN-1); supports `as="a"` and `as="span"` for clickable section pills
- `site/src/components/ui/mega-menu-pill-label/stories.tsx` — Pair-rule Storybook story (5 variants × 2 `as` modes + hasArrow variants)
- `site/src/components/layout/region-selector.tsx` — Footer Region dropdown (uses Radix DropdownMenu — correct semantics for application command, not site nav). Built in Step 1 foundation so locale switcher logic is preserved before Step 2 strips Header switcher.
- `scripts/static/verify-static-3.ts` — phase-close gate; includes SiteNavigationElement JSON-LD validation + lazy-render DOM probe + CLS check
- New design tokens in `tailwind.config.ts` and/or `site/src/styles/tokens.css`:
  - `--header-height` (CLS reservation)
  - `--color-dark-green` (Customer Story cards)
  - `--color-mint` or `--color-pale-teal` (How It Works bottom panel)
  - Any other newly-needed tokens captured from STATIC-2 audit

**Modify:**
- `site/src/components/layout/nav.tsx` — server shell rewrite (no locale switcher, 6 primary links, floating-pill outer wrapper, SiteNavigationElement JSON-LD emission)
- `site/src/components/layout/nav-client.tsx` — client island rewrite (no scroll hook, no `useScrollPosition`, 3 mega-menu triggers + 3 plain links, active-state arrow indicators, hover prefetch)
- `site/src/components/layout/footer.tsx` — full rewrite (new field reads + Region selector mount + arrow-affordance heading icons + Project Builds/AI Services pill buttons)
- `site/src/styles/globals.css` — `body { padding-top: var(--header-height) }` rule
- `tools/eslint/ui-strings.json` — 15-30 new keys
- `site/src/lib/ui-strings.ts` — regenerated via `npm run generate-ui-strings`
- `scripts/static/probe-nav-interactive.ts` — extended for 3 mega-menus + arrow indicators + section pill links
- `scripts/static/validate-json-ld.ts` — extended for SiteNavigationElement validation
- `package.json` — `static:verify-3` npm script
- `docs/design/TOKENS.md` — new tokens documented (header-height + dark-green + mint)

**Do NOT modify:**
- Any STATIC-1 hub component
- Any TEMPLATE-BLOG file
- Any Sanity schema (STATIC-2 did that work; STATIC-3 only consumes)
- `docs/design/components/nav-sticky-transition-global.md` — locked Tier-1 spec; STATIC-3 doesn't ship the scroll animation refinement
- `useScrollPosition` hook — NOT created in STATIC-3 (removed from original brief; no scroll listener needed since pill visual is steady state)

---

## §5 — Risks + Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Mega-menu DOM grows too large; Lighthouse Perf drops | Medium | Medium | Lazy-render mega-menu content on first open (`hasOpened` useState gate in `_shell.tsx`); mega-menus closed by default; images use `next/image` with proper sizing + `loading="lazy"` |
| Focus management breaks across 3 mega-menus | Medium | High | Shared `<MegaMenu>` shell with Radix `FocusScope` tested in isolation in Step 1; each mega-menu reuses; one focus implementation, not three |
| Mobile mega-menu UX degrades vs current STATIC-1 drawer | Medium | Medium | On mobile, mega-menus collapse to accordion sections in the existing Radix Dialog drawer; preserves the working STATIC-1 pattern; don't try to render mega-menu visual on small screens |
| Sanity image references slow page-load (each mega-menu has 25+ icons) | Medium | Medium | Icons load lazily (only when mega-menu opens via `useState`-gated render); `loading="lazy"` on each image; preload optimization deferred to SCAFFOLD-AUDIT |
| **Reference dereference returns null for unpublished/deleted docs** | Medium | Medium | Zod schema models references as `nullable`; component code filters null entries before mapping; Step 3 gate confirms no broken refs in production seed data |
| **Header locale switcher logic gets lost when porting to Footer Region selector** | Medium | Medium | Step 1 foundation work BUILDS RegionSelector before Step 2 strips it from Header. Logic ported intact. Step 5 gate tests US↔UK round-trip on multiple route shapes (home, blog post, hub, 404). |
| Legacy footer field reads break if STATIC-2 reseed missed a field | Low | Medium | Defensive fallback in new Footer component; falls back to legacy fields if new ones are null; Step 5 gate's "no console warnings" check catches this |
| New CSS variables conflict with DESIGN-1 token names | Low | Low | Step 0 plan-mode audits existing token namespace; use distinct prefixes only where needed (DESIGN-1 tokens cover most cases already) |
| **New dark-green + pale-teal tokens visually mismatch the screenshot reference** | Low | Low | STATIC-2 audit captures exact hex values; Step 1 token addition uses those exact values; Jake visual review at Step 4 gate confirms match |
| Mega-menu CSS-only transitions perform poorly vs GSAP | Low | Low | Transitions are simple fade + slide-down 200ms; CSS handles this fine at 60fps; if jank surfaces, escalate to Tech Debt and consider Tier-1 spec promotion (would force scope into a future phase) |
| **Floating-pill CLS hit if `--header-height` mismatches actual rendered height** | Medium | Medium | Step 1 locks `--header-height` value from STATIC-2 audit data; Step 2 gate measures actual rendered height via Playwright; mismatch surfaces as plan-mode finding before phase close. Lighthouse CLS = 0 check enforces. |
| **Critical-CSS path doesn't inline header styles → FOUC of unstyled bar** | Low | Medium | Next.js automatic critical-CSS inlining covers above-the-fold content; Step 2 gate's hard-refresh + cache-disabled probe catches FOUC. If it fires, add explicit `<style>` inline in `nav.tsx` server shell. |
| **SiteNavigationElement JSON-LD malformed → Google Search Console flags structured data error** | Low | Low | `validate-json-ld.ts` extended in Step 6 to parse the block via the same Schema.org validator as existing org/breadcrumb JSON-LD. Fails build if malformed. |
| **Lazy-render first-open INP hit** | Medium | Low | One-time mount cost on first open is acceptable; subsequent opens are instant. If INP exceeds 200ms threshold on first open in Lighthouse, escalate. |
| **Hover prefetch adds bandwidth waste** | Low | Low | `router.prefetch()` only fires on `onMouseEnter`, not on every hover state; Next.js dedupes; if Lighthouse shows no improvement, file Tech Debt to remove the hover handlers (deferred to SCAFFOLD-AUDIT) |
| **"Our Clients" label gets shipped as "Customer Stories" by mistake** | Medium | Medium | Step 0 plan-mode item 3 explicitly verifies via GROQ query before Step 1 build. Step 2 gate + Step 6 JSON-LD validation both check the label. Three independent checkpoints make this hard to slip through. |
| **Footer Project Builds / AI Services pills ship as lime/gradient instead of outline-light** | Medium | Low | Step 5 gate explicitly checks pill variants by inspecting computed CSS on each pill button. Default tendency to "match the mega-menu style" is the trap; brief Step 5 §3 explicitly calls out the variant difference. |
| **Page-level "Build the team" CTA panel accidentally built as part of footer** | Low | Medium | Explicit out-of-scope callout in §2.2; Step 6 verification item 12 confirms it's NOT in footer DOM. If Claude Code starts building it, plan-mode review catches before Step 5 ships. |
| **5th pill variant `pill-outline-light` ships with wrong contrast against navy footer bg** | Low | Low | Step 1 token addition specifies "light/white border + text on transparent bg"; Step 5 gate axe-core check enforces WCAG AA contrast on the variant rendering against actual footer bg. |
| Storybook story for `<MegaMenuPillLabel>` missing/incomplete | Low | Low | Pair-rule check at Step 1 gate via `find site/src/components/ui -mindepth 2 -name stories.tsx | wc -l` should return 26 after Step 1 (25 + new pill label). 5 variants documented in single stories.tsx file. |

---

## §6 — Phase Close Definition

STATIC-3 is closed when:

1. All Step gates pass
2. `scripts/static/verify-static-3.ts` exits 0
3. Visual diff against live site shows no unintended deltas at desktop + tablet + mobile breakpoints. The scroll-tied animation refinement IS an intended delta — documented, deferred to TEMPLATE-HOME. Floating-pill VISUAL TREATMENT matches live site at all scroll positions.
4. New chrome reads new schema fields exclusively (legacy fields untouched but unused; defensive fallbacks never fired in production read paths)
5. Header has no locale switcher; Footer Region selector works for US↔UK navigation; Region selector logic preserved intact from STATIC-1 Header switcher
6. Primary nav 2nd link label is "Our Clients" (not "Customer Stories")
7. All 3 mega-menus open/close correctly on desktop with chevron-in-circle active-state arrow indicators; collapse to drawer accordions on mobile
8. Hybrid CMS-driven Services mega-menu works: items resolve from referenced service/technology docs; null references handled gracefully; tagline patches from STATIC-2 reflected in render
9. SiteNavigationElement JSON-LD emitted on all routes; validates against Schema.org; 2nd item name is "Our Clients"
10. Footer uses 5-variant pill primitive correctly: `pill-outline-light` on section labels (Our Expertise / Learn more / Talent Locations), Project Builds + AI Services bottom pills, and "Contact us today" CTA. `pill-green` on "Start building your team" + Subscribe button.
11. Page-level "Build the team / We'll handle the rest" CTA panel NOT built in STATIC-3 (deferred to TEMPLATE-HOME)
12. Clara Chatbot widget continues rendering as it did pre-STATIC-3 (no regression)
13. Lighthouse CLS = 0 (header height reservation working); Perf ≥80; A11y ≥96; SEO 100-in-prod
14. Hard-refresh + cache-disabled probe: no FOUC of unstyled or full-width-bar header state
15. Tech Debt entries opened: legacy schema field cleanup + TEMPLATE-HOME scroll-tied animation refinement pin + TEMPLATE-HOME page-level CTA panel pin
16. Context files updated and committed in one final commit (Tier 3 discipline)
17. Final commit pushed to `origin/feat/design-1`

State on close: `migrations.status = content_complete` (unchanged). Next phase: Template Phase Runbook design session, then TEMPLATE-TEAM_MEMBER as the first template build.

The chrome layer is complete for templates to render inside. Floating-pill VISUAL ships in STATIC-3; TEMPLATE-HOME adds the scroll-tied morph refinement when HOME's `.cc-hero` element ships, plus the page-level "Build the team" CTA panel.

---

**End of STATIC-3 brief. STATIC-2 must close before this brief enters plan-mode.**

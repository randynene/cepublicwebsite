# Tier-1 Component Inventory

**Version:** v1.0 — LOCKED at HALT 1
**Locked at:** MYGRATR-DESIGN-1 Step 3a — 2026-05-07
**Total components:** 5 (1 High + 3 Medium + 1 Low — see "3b L3 resolution" below)
**Estimate range from brief:** 5–10. **Actual: 5** — at the low end of the range; above the brief's halt-trigger floor of 4.

> Adding to this list post-lock requires a Step-3 brief deviation entry + version bump (per Step-3 brief Hard Rule #4).

## HALT 1 lock decisions (2026-05-07)

| Lock | Decision |
|---|---|
| L1 | Globals (#1, #3, #4) **stay as Tier-1 components** — load-bearing enough to deserve 8-section specs, not just CONVENTIONS.md entries. Inventory total = 5 (confirmed). |
| L2 | **3d stress-test target = #1 section-fade-reveal-global.** Evidence wins over working hypothesis (per v1.1 audit patch A2 — role not identity). HOME hero at Medium per actual gsap-home.json capture is correct; preserving it as stress-test would defeat the stress-test purpose. |
| L3 | **#5 service-card-grid-hover-reveal accepted as "Medium pending DevTools verification at 3b drafting."** Probe-first per Hard Rule #2. If 3b live-site DevTools inspection down-classifies to Low, fall back to **#4 testimonial-swiper-global** as 3b first-spec target — bounded library state, sitewide reuse, existing `audit-output/pages/__home/interactions.json` data. **RESOLVED 2026-05-07 — see "3b L3 resolution" below.** |
| L4 | **#1 section-fade-reveal stays as Tier-1, not a Step-4 shared-utility lane.** Most load-bearing animation pattern on the site; Step-4-utility-with-no-spec means TEMPLATE-* phases reverse-engineer it — exactly the failure mode the spec system prevents. |

## Locked 3b / 3d assignments

- **3b first-spec (format-lock, simplest medium-complexity):** **#4 testimonial-swiper-global** (L3 fallback engaged 2026-05-07 — see "3b L3 resolution" below). No remaining fallback.
- **3d stress-test (format-finalisation, highest-complexity):** **#1 section-fade-reveal-global**.

## 3b L3 resolution (2026-05-07)

**Probe finding:** #5 service-card-grid-hover-reveal is **CSS-only single-axis transitions** — down-classifies from Medium to Low.

**Evidence** (from `cloudemployee.shared.eecb71bdf.min.css`):

```css
.difference-grid-item.link               { transition: all .2s; }
.difference-grid-item.link:hover         { transform: translateY(-16px); box-shadow: 0 2px 16px #0003; }
.switch-button.small:hover               { padding-left: 45px; }   /* grows from 40px */
.arrow-img.default                       { position: absolute; }   /* yellow arrow — default */
.arrow-img.hover                         { position: absolute; }   /* black arrow — hover swap */
```

Complete hover surface: card lifts -16px + soft shadow; CTA padding-left grows 5px; arrow icon swaps yellow → black via stacked absolute-positioned imgs. All transitions `.2s` linear. **No JS state machine. No library involvement. No multi-stage timeline.** A4 Card primitive + `:hover` modifier covers the entire mechanism.

Per brief Tier-1 criteria ("Low — interactive but mostly CSS / single-axis transitions"), this is **Low complexity**, not Medium.

**Resolution per L3 fallback (pre-approved at HALT 1):**

- **3b first-spec target shifts from #5 to #4 testimonial-swiper-global.**
- **#5 inventory complexity revised: Medium → Low.** #5 stays in Tier-1 inventory (per L1; 5 components total unchanged) and still gets an 8-section spec — just drafted at 3c or 3e (mid-tier autonomous batch or remaining batch close), not as the 3b format-lock first-spec.
- **No remaining fallback.** #4's complexity (Swiper-mediated bounded state machine) is the next-simplest medium and is the engaged target.

---

## Inventory

| # | Component | Scope | Live URL | Complexity | Screenshot ref | Recording ref |
|---|---|---|---|---|---|---|
| 1 | Section fade-reveal cascade | GLOBAL | sitewide (driven by `[fade-animation]` / `[cms-fade-animation]` attribute selectors) | High | `_assets/section-fade-reveal-global/screenshots/` (TBD — captured at 3d) | `_assets/section-fade-reveal-global/recordings/` (TBD — captured at 3d) |
| 2 | Hero scale-in animation | HOME | `/` | Medium | `_assets/home-hero-scale-in/screenshots/` (TBD — captured at 3c or 3e) | `_assets/home-hero-scale-in/recordings/` (TBD) |
| 3 | Sticky nav transition | GLOBAL | sitewide | Medium | `_assets/nav-sticky-transition-global/screenshots/` (TBD) | `_assets/nav-sticky-transition-global/recordings/` (TBD) |
| 4 | Testimonial Swiper carousel | GLOBAL (used on `/`, `/reviews`, `/services`) | various | Medium | `_assets/testimonial-swiper-global/screenshots/` (TBD) | `_assets/testimonial-swiper-global/recordings/` (TBD) |
| 5 | Service card-grid hover-reveal | SERVICE (landing) | `/services` | Low (revised from Medium — see 3b L3 resolution) | `_assets/service-card-grid-hover-reveal/screenshots/` (TBD — captured at 3c or 3e) | `_assets/service-card-grid-hover-reveal/recordings/` (TBD — captured at 3c or 3e) |

---

## Per-component complexity rationale

### 1. Section fade-reveal cascade (Complexity: High)

**Evidence:** `audit-output/design-1/gsap-home.json` shows 6 distinct `gsap.from()` scroll-triggered timelines on `/` alone (yPercent 10→0, opacity 0→1, stagger 0.1s, ease `power2.out`, ScrollTrigger start `top 90%`). All 6 share the same config but target different DOM regions (`.building-list`, `.title-left.cc-smaller`, `.grid.cc-3-col-grid`, `.title-center`, `.gap-10.mt-20`). `audit-output/ce-template-custom-code.json` confirms the source uses `[fade-animation]` and `[cms-fade-animation]` attribute selectors — the same orchestration runs sitewide on every CMS-driven page (TECHNOLOGY, SERVICE, blog posts, etc., per `gsap-technology.json` corroboration).

**Why High:** multi-stage timeline orchestration via attribute selectors, sitewide reach (every long-form page), ScrollTrigger lifecycle management, performance-sensitive (cascading staggers must not jank on mid-tier mobile). This is the load-bearing animation surface for the entire site.

### 2. Hero scale-in animation (Complexity: Medium)

**Evidence:** `audit-output/design-1/gsap-home.json` — single `gsap.fromTo('img.hero-img.align-top', { scale: 1.2 }, { scale: 1, duration: 1.5, ease: 'power2.out' })`. No ScrollTrigger; runs on page load. Single-property animation.

**Why Medium not High:** one timeline, one property, one element. Bounded behaviour. Initially flagged as High by the audit-walk agent based on the "hero" framing, but the actual GSAP capture shows a contained single-fromTo. The "high" framing in CE_SITE_TRUTH was about visibility, not animation complexity.

### 3. Sticky nav transition (Complexity: Medium)

**Evidence:** `audit-output/ce-template-custom-code.json` shows two separate `DOMContentLoaded` handlers managing `.navbar` + `.logo-nav` with viewport-aware state changes (load event binding, scroll-based class toggle).

**Why Medium:** position-sticky CSS + class-toggle JS based on scroll position; single state axis (above/below threshold). Library-supportable but has bespoke transition timing CE wants preserved. Sitewide.

### 4. Testimonial Swiper carousel (Complexity: Medium)

**Evidence:** `audit-output/ce-template-custom-code.json` shows Swiper initialization with autoplay, pagination, centered slides (per Swiper 11 from `audit-output/ce-scripts.json`). `audit-output/pages/__home/interactions.json` shows `.swiper.testimonies` with auto-advance + click-driven content updates.

**Why Medium:** Swiper-mediated state machine with bounded surface (autoplay timer, pagination state, drag-or-click navigation). Library-supportable. Used on multiple templates so spec is shared.

### 5. Service card-grid hover-reveal (Complexity: Low — revised from Medium at 3b probe)

**Evidence:** `cloudemployee.shared.eecb71bdf.min.css` rules for `.difference-grid-item.link:hover` and `.switch-button.small:hover` show pure CSS hover transitions: `transform: translateY(-16px)` + `box-shadow` on the card; padding-left grows 5px on the CTA; arrow icon swaps yellow → black via stacked absolute-positioned imgs. All transitions `.2s` linear. No JS state machine; no library; no multi-stage timeline.

**Why Low (revised):** initially flagged Medium pending DevTools verification at 3b. The probe (CSS rule inspection on the live `/services` markup classes) confirms single-axis CSS transitions on each property. Per brief criteria ("Low — interactive but mostly CSS / single-axis transitions"), this is Low complexity. A4 Card primitive + `:hover` modifier covers the entire mechanism. Spec is still drafted (Tier-1 inventory unchanged per L1) but at 3c or 3e batch, not as the 3b format-lock first-spec.

---

## What was DROPPED from the candidate list (and why)

| Candidate | Why dropped |
|---|---|
| TECHNOLOGY filter grid | **Does not exist on the live site.** WebFetch on `/technology` confirms an alphabetical list of 150+ technology cards with **no filter UI** (no chips, dropdowns, search, or tabs). The brief's hypothesis was speculative; reality contradicts it. |
| TECHNOLOGY / SERVICE / COMPARE accordion | These are just instances of A5 Accordion primitive in different page contexts — not Tier-1 mechanisms. The primitive ships with all required behaviour. |
| TEAM_MEMBER bio-toggle / team grid | `/about-us` "Read bio" links navigate to `/team/[name]` — page navigation, not in-place hover-reveal. No Tier-1 mechanism observed. |
| Calendly book-a-call embed | Third-party iframe widget, not a Tier-1 component requiring an 8-section spec. Integration handled at the BOOK_A_CALL template level. |
| Hotjar / Clara / GeoTargetly | Third-party scripts handled at SCAFFOLD-1's `third-party-scripts.tsx` level. Not Tier-1 components. |
| Multi-step form interactions | No multi-step form observed on CE — HubSpot embeds are single-step. |
| Video player wrappers with custom controls | VIDEO template uses Vimeo embeds with default controls per `audit-output/ce-template-custom-code.json`; no custom wrapper observed. |

---

## 3b / 3d assignments (locked — see top of doc)

Per HALT 1 locks L2 + L3 (with L3 fallback engaged at 3b probe — see "3b L3 resolution"):

- **3b first-spec:** #4 testimonial-swiper-global (L3 fallback engaged; no remaining fallback)
- **3d stress-test:** #1 section-fade-reveal-global

---

## Capture-asset directory tree

```
docs/design/components/_assets/
├── section-fade-reveal-global/
│   ├── screenshots/
│   └── recordings/
├── home-hero-scale-in/
│   ├── screenshots/
│   └── recordings/
├── nav-sticky-transition-global/
│   ├── screenshots/
│   └── recordings/
├── testimonial-swiper-global/
│   ├── screenshots/
│   └── recordings/
└── service-card-grid-hover-reveal/
    ├── screenshots/
    └── recordings/
```

Capture is empty at HALT 1 — populated per-spec during 3b/3c/3d/3e drafting per Step-3 brief §4 ("Capture references" line 135).

---

## HALT 1 resolution log

The four open questions surfaced at HALT 1 surfacing were resolved 2026-05-07 — see "HALT 1 lock decisions" table at the top of this doc. All four locks captured. Inventory locks at v1.0.

---

*End of TIER_1_INVENTORY.md v1.0 — LOCKED at HALT 1.*

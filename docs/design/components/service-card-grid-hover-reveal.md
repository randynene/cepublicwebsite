# Service Card-Grid Hover-Reveal

**Live URL pattern:** `/services` (services landing).
**Sanity document type:** `service` (per `MYGRATR_SCHEMA_DESIGN_DECISIONS.md §3.5`, line 186–215; 23 service docs migrated in CONTENT-1C).
**Complexity:** Low (revised from Medium at 3b probe — see TIER_1_INVENTORY.md "3b L3 resolution" block).
**Visual fidelity target:** SERVICE 92% per v2.0 brief §7 fidelity table (note: this is the SERVICE template's overall target; this component is one mechanism within that template).
**Inventory entry:** [TIER_1_INVENTORY.md](../TIER_1_INVENTORY.md#inventory) row 5.

---

## 1. Behaviour

A grid of clickable service cards on `/services`. Each card presents a background image, an overlay gradient for legibility, a service title, a short description, and a yellow CTA button (`.switch-button`) with an arrow icon. On hover:

1. **Card lifts.** `transform: translateY(-16px)` with a soft shadow (`0 2px 16px #0003`).
2. **CTA button widens slightly.** `padding-left` grows from 40px to 45px (drawing the eye to the arrow).
3. **Arrow icon swaps colour.** Yellow → black (`.arrow-img.default` fades out / `.arrow-img.hover` fades in via stacked `position: absolute` layering — implementation depends on opacity transition, to confirm during 3c capture pass).

All transitions: `.2s` linear (CSS default `transition-timing-function`). The cards click through to individual service pages (`/services/{slug}`).

The cards form a responsive CSS grid — column count varies by breakpoint (see §5).

---

## 2. State machine

```
       ┌────────┐    pointer-enter   ┌────────┐
       │  IDLE  │ ─────────────────▶ │ HOVER  │
       └────────┘                    └────────┘
            ▲                            │
            └────── pointer-leave ───────┘
```

Single binary state per card. CSS `:hover` pseudo-class — no JS. Touch devices: `:hover` does not engage; cards click through directly. (`@media (hover: none)` could disable transitions cleanly if needed — to confirm.)

---

## 3. Tech stack

**Library:** None — pure CSS.

**Why CSS-only:** the live site uses pure CSS hover transitions per `cloudemployee.shared.eecb71bdf.min.css` rules `.difference-grid-item.link:hover`, `.switch-button.small:hover`. No GSAP, no JS state machine, no library. The L3 probe (HALT 1 → 3b drafting) verified this. Per Step-3 brief §3 Tech stack guidance: "**CSS-only if the live site is also CSS-only.**" Reproducing with GSAP or framer-motion is no-value.

**Primitives composed (per `docs/design/COMPONENTS.md`):**
- **A4 Card** — outer card chassis; the rebuild applies the lift/shadow on `:hover` via the Card's `interactive` variant (or equivalent — exact variant API to be confirmed against COMPONENTS.md row).
- **A1 Button** — the yellow CTA `.switch-button` with arrow swap. Variant: `cta` / `yellow` / `arrow-swap` (to be confirmed).
- **B1 Heading** — service title.
- **B2 Text** — description (`.cc-white.small-p`).
- **E1 Image** — background image (`<img class="difference-img">` — Next.js `<Image fill>` with `object-fit: cover`).

---

## 4. Timing

**Provenance.** This component is **CSS-only**. There is **no GSAP, no JS, no library** to extract timings from. The Step-1 GSAP shim (`scripts/design/extract-gsap-timings.ts`) is structurally inapplicable — there is nothing for the shim to capture. F10/F11/F12 v2.0-§15 caveats do not apply. **All timings below are CSS-source-extracted from `cloudemployee.shared.eecb71bdf.min.css`** at the L3 probe (HALT 1 → 3b drafting on 2026-05-07). Verbatim CSS rules:

```css
.difference-grid-item.link               { transition: all .2s; }
.difference-grid-item.link:hover         { transform: translateY(-16px); box-shadow: 0 2px 16px #0003; }
.switch-button.small:hover               { padding-left: 45px; }   /* grows from 40px */
.arrow-img.default                       { position: absolute; }   /* yellow arrow — default */
.arrow-img.hover                         { position: absolute; }   /* black arrow — hover swap */
```

| Phase | Trigger | Duration | Easing | Property |
|---|---|---|---|---|
| Card lift | `:hover` on `.difference-grid-item.link` | 200ms | linear (CSS `transition-timing-function` default) | `transform: translateY(0 → -16px)`; `box-shadow: 0 → "0 2px 16px #0003"` |
| CTA button widen | `:hover` on `.switch-button.small` | 200ms | linear (default) | `padding-left: 40px → 45px` |
| Arrow icon swap | `:hover` on `.switch-button.small` | TBD-pending-capture (likely opacity transition on `.arrow-img.default` / `.hover`) | TBD-pending-capture | `opacity` toggle on stacked absolute-positioned imgs |

**TBD-pending-capture entries:** the arrow-icon opacity transition rules were not in the extracted CSS slice during the L3 probe; resolve during 3c capture pass via DevTools inspection of `.arrow-img.default` / `.arrow-img.hover` styles. **Format-acceptable per HALT 2 lock 6** (TBD-pending-capture pattern OK at first-spec).

**Reduced-motion override:** all hover transitions collapse to 0ms via `@media (prefers-reduced-motion: reduce) { .difference-grid-item.link, .switch-button.small { transition-duration: 0ms; } }` — to be added by the rebuild's `tokens.css` (or equivalent reduced-motion utility).

---

## 5. Breakpoints

`/services` renders the grid in CE's responsive 3-column → 2-column → 1-column flow per `cloudemployee.shared.eecb71bdf.min.css` grid rules.

- **Desktop (≥1024px):** 3 columns. Cards hover-active on pointer devices.
- **Tablet (768–1023px):** 2 columns. `:hover` engages on hybrid devices (some 2-in-1 tablets); fine to leave active.
- **Mobile (<768px):** 1 column. `:hover` does not engage on touch — cards click through directly without intermediate hover state. Acceptable per CE.

Pixel-perfect column widths and gap dimensions to be confirmed during 3c capture pass via DevTools (TBD-pending-capture per HALT 2 lock 6).

---

## 6. Data binding

| UI region | Sanity field path | Document type | Required? |
|---|---|---|---|
| Background image | `service.thumbnail` | service | optional (template falls back to a brand-default image when absent) |
| Service title | `service.shortLabel` (preferred) OR `service.name` (fallback) | service | `service.name` required; `shortLabel` optional |
| Service description | `service.folds[0].subhead` (or per-template introductory copy field — to be confirmed against `service` schema folds usage) | service | `folds` required, but specific `subhead` field is per-fold and optional |
| CTA button label | hardcoded "Hire Now" / "Learn More" / "Build with [Service]" — driven by `service.prefix` enum (`hire` / `build` / `expert` / `endToEnd`) and template-mapped to a UI string | service | `prefix` optional (template fallback to "Learn More") |
| CTA button link | computed: `/services/${service.slug.current}` | service | `slug` required |
| Service order | `service.order` (used in GROQ ordering) | service | optional |

**GROQ query shape (consumed by the `/services` listing page):**

```groq
*[_type == "service"] | order(coalesce(order, 9999) asc) {
  _id,
  name,
  slug,
  shortLabel,
  prefix,
  type,
  thumbnail {
    asset->{ _id, url, metadata { lqip, dimensions } },
    alt
  },
  // first-fold subhead for description preview
  "description": folds[0].subhead,
  order,
}
```

**Field paths verified against `MYGRATR_SCHEMA_DESIGN_DECISIONS.md §3.5`** (line 186–215). The `folds[0].subhead` projection requires the `service` doc's `folds` array to have the first fold include a `subhead` field — verify against the actual fold schema during template-build (deferred to TEMPLATE-SERVICE phase).

---

## 7. Edge cases

- **Empty services collection:** template renders the page header but no grid; no layout-collapse (use a min-height on the grid container).
- **Single service:** grid renders 1 card centred / left-aligned per the 3-column rule's behaviour at low item counts.
- **Missing `thumbnail`:** template falls back to a brand-default image (`/images/service-default.avif` or token reference). Per Step-3 brief §3 Hard Rule #5: do NOT modify schema in Step 3 — surface as Schema-vs-reality finding only if missing thumbnail breaks rendering.
- **Missing `shortLabel`:** template uses `service.name` (always present per schema required).
- **Missing `prefix`:** template defaults CTA label to "Learn More".
- **Slow image load (LCP impact):** the first 3 above-the-fold cards use `<Image priority>`; remaining cards use lazy loading. Background images are AVIF — preserve the AVIF pipeline.
- **Reduced motion** (`prefers-reduced-motion: reduce`): all hover transitions collapse to 0ms via media query. Card still highlights on hover (via colour change or border, no transform). **Mandatory per Step-3 brief §3 Hard Rules.**
- **Touch devices:** `:hover` does not engage; cards click through directly. No fallback "press" state — the click event handles navigation.
- **Keyboard navigation:** Tab focus traverses cards in DOM order; focus-visible ring on `.difference-grid-item.link:focus-visible` — same lift effect as hover (via shared CSS rule using `:hover, :focus-visible`). Enter/Space activates the link.
- **Screen reader:** `<a>` element with `aria-label="${service.name}"` (the link is the entire card; image and text inside are decorative for SR purposes). The CTA button text is announced separately if the link is a nested-button pattern — to confirm during template-build.

---

## 8. Acceptance criteria

- [ ] Hover on a card lifts it -16px with soft shadow over 200ms
- [ ] CTA button padding-left grows from 40px to 45px on hover
- [ ] Arrow icon swaps yellow → black on hover (opacity-driven; transition smooth)
- [ ] All hover transitions complete in 200ms; no jank
- [ ] `prefers-reduced-motion: reduce` collapses transition durations to 0ms; cards still indicate hover via non-motion means (colour or border)
- [ ] Click-through navigates to `/services/{slug}` per `service.slug.current`
- [ ] Touch devices skip hover state cleanly
- [ ] Keyboard: Tab focus visible (focus-visible ring); Enter/Space activates link
- [ ] Screen reader: card announced as `<a aria-label="${service.name}">`
- [ ] Sanity field changes propagate to preview within 5s (Visual Editing wired in Step 8)
- [ ] Lighthouse performance budget intact per `docs/design/PERFORMANCE_BUDGETS.md`
- [ ] Visual diff against captured live recording at desktop / tablet / mobile within structural-diff threshold per `tools/qa/structural-diff.config.ts`

---

## Schema-vs-reality findings

1. **`service.folds[0].subhead` description-preview projection** — the spec assumes the first fold's `subhead` is the right field for card-grid description text. Actual mapping depends on whether CE's editorial flow puts the description-preview-quality copy in fold 0 or in a dedicated field. **Resolution direction:** `decision-needed`. Verify against actual `service` doc data in CONTENT-1C output during template-build phase. If the projection mismatches editorial expectation, surface as `schema-relax` (add `service.descriptionPreview: text (optional)` field for clean separation). No blocker for spec format — spec ships with the `folds[0].subhead` assumption.

2. **Card CTA label derivation from `service.prefix` enum** — the spec maps `prefix` enum values (`hire` / `build` / `expert` / `endToEnd`) to UI strings ("Hire Now" / "Build with X" / "Expert in X" / "End-to-end X"). The exact UI-string templating is a TEMPLATE-* concern but the schema field is in place. **Resolution direction:** `template-fallback`. No schema change needed.

---

*End of service-card-grid-hover-reveal.md v1.0 (3c batch — autonomous, format-locked at HALT 2).*

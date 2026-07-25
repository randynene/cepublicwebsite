# Sticky Nav with Transition

**Live URL pattern:** sitewide (every page).
**Sanity document type:** `navigation` singleton (per `MYGRATR_SCHEMA_DESIGN_DECISIONS.md §6.2`, line 860–877).
**Complexity:** Medium
**Visual fidelity target:** N/A as a global utility — applies to every page; consuming templates inherit their fidelity targets.
**Inventory entry:** [TIER_1_INVENTORY.md](../TIER_1_INVENTORY.md#inventory) row 3.

---

## 1. Behaviour

The site's primary navigation is fixed to the top of the viewport on every page. As the user scrolls past the home hero (`.cc-hero`), the navbar transitions from its **transparent-over-hero** state to its **active-over-content** state. The transition flips colours, swaps the logo treatment, and inverts the dropdown arrows. Scrolling back up reverses the transition.

Two distinct mechanisms compose this behaviour:

### 1.1 Scroll-driven sticky transition (desktop)

GSAP **ScrollTrigger** observes the home hero section (`.cc-hero`). When the user scrolls past the hero (`onLeave`), CE's nav handler adds these classes:
- `.navbar` → `.active-nav`
- `.logo-nav` → `.active-logo`
- `.toggle-menu` → `.active-btn`
- `.nav-arrow`, `.nav-arrow-res`, `.nav-arrow-why` → `.invert`
- `.nav-link` (each, via `forEach`) → `.active-link`

Reversing scroll past the hero (`onEnterBack`) removes these classes. The CSS for `.active-nav` etc. defines the target visual state — typically a colour flip (white-on-dark → dark-on-white or vice versa) and a logo-swap.

### 1.2 Mobile menu open/close

Separate plain-JS handler bound to the Webflow menu button (`.w-nav-button`). On click:
- `.navbar` → toggle `.is-open`
- `.logo-nav` → toggle `.open-logo`

Two state axes: scroll position (above/below hero) and menu state (open/closed). Both axes operate independently; their CSS combines (e.g., a closed-menu nav past the hero has `.active-nav`; opening the menu adds `.is-open` on top).

---

## 2. State machine

```
                                 ┌──────────────┐
                                 │   AT-HERO    │
                                 │ (transparent)│
                                 └──────┬───────┘
                                        │ scroll past hero
                                        ▼
                                 ┌──────────────┐
                                 │  PAST-HERO   │
                                 │  (active)    │
                                 └──────┬───────┘
                                        │ scroll back to hero
                                        ▼
                                  return to AT-HERO

  Independent axis (mobile only):
    closed ⇄ open     (driven by .w-nav-button click)
```

Two orthogonal axes; CSS handles every combination via class-stacking.

---

## 3. Tech stack

**Library:** GSAP 3.12.5 + ScrollTrigger plugin — pinned via npm (per `audit-output/ce-scripts.json`).
**Plus:** plain JS event handler for mobile menu toggle (no library).

**Why GSAP ScrollTrigger:** the live site uses `ScrollTrigger.create({ trigger: ccHero, start: "top top", end: "bottom bottom", onLeave: ..., onEnterBack: ... })` per `audit-output/ce-template-custom-code.json`. The ScrollTrigger pattern handles enter/leave precisely (no scroll-listener jank, no manual threshold math) and integrates with the rest of CE's GSAP usage cleanly. Reproducing this with `IntersectionObserver` is feasible but adds a second observer pattern to the page. Since GSAP + ScrollTrigger are already loaded site-wide for #1 section-fade-reveal-global, marginal cost is zero.

**Why plain JS for mobile menu:** the open/close toggle is single-state-flip; library is overkill. Inline `addEventListener('click', ...)` matches CE's existing pattern.

**Primitives composed (per `docs/design/COMPONENTS.md`):**
- **A2 Link** — primary nav link items.
- **D3 DropdownMenu** — service/resources dropdown surfaces (uses `@radix-ui/react-dropdown-menu`).
- **Icon (foundation)** — chevrons / nav arrows (the `.invert` class is applied to existing icon components).
- **A1 Button** — CTA button (`navigation.ctaButton` schema field).

---

## 4. Timing

**Provenance.** This component is **partially shim-extracted, partially source-code-extracted, and partially library-default.** The Step-1 GSAP shim (`scripts/design/extract-gsap-timings.ts`) **did not capture the ScrollTrigger.create() call** for the navbar — `audit-output/design-1/gsap-home.json` and `gsap-about.json` show only `gsap.from()` / `gsap.fromTo()` calls, plus `registerPlugin` entries. This is a **structural shim gap** (likely F11 from v2.0 §15 — interaction-driven / lazy ScrollTrigger.create — though the ST.create here runs at DOMContentLoaded, not on interaction; the shim's instrumentation point may simply not cover ST static methods). **All ScrollTrigger config below was extracted manually from `audit-output/ce-template-custom-code.json` source code.** The CSS class-toggle timings (transition-duration / easing) are **CSS-source-extracted** from `cloudemployee.shared.eecb71bdf.min.css` for `.active-nav`, `.active-logo`, etc. (target rules to be confirmed during 3c capture pass — TBD-pending-capture per HALT 2 lock 6).

| Phase | Trigger | Duration | Easing | Mechanism |
|---|---|---|---|---|
| Sticky transition (transparent → active) | ScrollTrigger `onLeave` (past `.cc-hero` bottom) | TBD-pending-capture (CSS transition on `.navbar`) | TBD-pending-capture (likely `ease-in-out`) | CSS class-add: `.active-nav` |
| Sticky transition (active → transparent) | ScrollTrigger `onEnterBack` | (same as above; symmetric) | (same) | CSS class-remove |
| Mobile menu open | `.w-nav-button` click | TBD-pending-capture | TBD-pending-capture | CSS class-add: `.is-open` |
| Mobile menu close | `.w-nav-button` click (toggle) | (same) | (same) | CSS class-remove |

Verbatim ScrollTrigger config from `audit-output/ce-template-custom-code.json`:

```js
ScrollTrigger.create({
  trigger: ccHero,
  start: "top top",
  end: "bottom bottom",
  onLeave: () => {
    navbar.classList.add('active-nav');
    logoNav.classList.add('active-logo');
    menuButton.classList.add('active-btn');
    navArrow.classList.add('invert');
    navArrowRes.classList.add('invert');
    navArrowWhy.classList.add('invert');
    navLinks.forEach((link) => link.classList.add('active-link'));
  },
  // onEnterBack: symmetric class-remove (verified in source)
});
```

The transition is **CSS-driven**, not GSAP-driven. ScrollTrigger only flips the class; CSS handles the timing/easing. This means the actual transition timing lives in the compiled CSS, not in the GSAP source — extract during the rebuild's Step-3c capture pass.

---

## 5. Breakpoints

- **Desktop (≥1024px):** ScrollTrigger active. Full nav links visible inline. Dropdown menus on hover. Mobile menu toggle (`.w-nav-button`) hidden.
- **Tablet (768–1023px):** ScrollTrigger active. Nav collapses to logo + hamburger toggle. Click-to-open menu.
- **Mobile (<768px):** ScrollTrigger active (CE applies same scroll-driven class flip). Hamburger toggle. Full-screen overlay nav when open.

**Reduced motion** (`prefers-reduced-motion: reduce`): the class flip still happens, but CSS transition durations on `.navbar` collapse to `0ms` via a `@media (prefers-reduced-motion: reduce)` block. No fade — instant swap.

---

## 6. Data binding

| UI region | Sanity field path | Document type | Required? |
|---|---|---|---|
| Primary nav link label | `navigation.primaryLinks[].label` | navigation (singleton) | required |
| Primary nav link URL | `navigation.primaryLinks[].url` | navigation (singleton) | required |
| Dropdown items (per primary link) | `navigation.primaryLinks[].dropdownItems[]` | navigation (singleton) | optional |
| CMS-driven dropdown source | `navigation.primaryLinks[].cmsCollection` (when `cmsDriven: true`) | navigation (singleton) | optional |
| CTA button label | `navigation.ctaButton.label` | navigation (singleton) | required |
| CTA button link | `navigation.ctaButton.link` | navigation (singleton) | required |
| CTA button type | `navigation.ctaButton.type` (enum: calendly / link / hubspotForm) | navigation (singleton) | required |
| Locale dropdown options | `navigation.localeDropdown.options[]` | navigation (singleton) | optional (rendered when `localeDropdown.enabled === true`) |

**GROQ query shape (consumed by app `<Header>`):**

```groq
*[_type == "navigation"][0] {
  primaryLinks[] {
    label, url, cmsDriven, cmsCollection,
    dropdownItems[] { label, url }
  },
  ctaButton { label, link, type },
  localeDropdown {
    enabled,
    options[] { label, url, hreflang }
  }
}
```

Singleton fetch; single result. **Field paths verified against `MYGRATR_SCHEMA_DESIGN_DECISIONS.md §6.2`.**

**CMS-driven dropdown caveat:** when `primaryLinks[].cmsDriven === true`, the `dropdownItems[]` array is empty and the rendered dropdown items come from a secondary GROQ fetch against the named `cmsCollection` (e.g., latest 5 services for a "Services" dropdown). Schema accommodates this; render-discipline implements the secondary fetch. **Tech Debt #5 from AUDIT-1** noted: nav Technology dropdown was merged into Services in `ce-global-components.json` — selector tweak before nav is built.

---

## 7. Edge cases

- **Pages with no `.cc-hero` element:** ScrollTrigger has no trigger, so the navbar stays in the active-from-load state. Implementation: when no `.cc-hero` exists, mount the navbar already with `.active-nav` class (skip ScrollTrigger setup). Per inspection of CE's audit data — most non-home pages do not have `.cc-hero`; they ship the navbar in active state from page-load.
- **Mobile menu open when scroll-state changes:** both axes coexist (e.g., `.navbar.is-open.active-nav`). CSS handles every combination cleanly (no override conflicts).
- **Reduced motion** (`prefers-reduced-motion: reduce`): class flip still happens; CSS transitions collapse to 0ms. No fade. **Mandatory per Step-3 brief §3 Hard Rules.**
- **Slow GSAP load:** if GSAP fails to load, ScrollTrigger never attaches. Mitigation: ship the navbar with a default-state class; the `.active-nav` flip becomes a progressive enhancement. No JS error visible to user.
- **Keyboard navigation:** Tab focus flows through nav links in source order. Focus-visible ring matches CE's brand (token via `--color-ring` from `tokens.css`). Dropdowns open on Enter/Space (Radix `DropdownMenu` handles natively). Escape closes open dropdown.
- **Screen reader:** `<header role="banner">` wraps. `<nav aria-label="Primary">` for the main nav. Mobile menu toggle has `aria-expanded` reflecting state. Dropdowns expose Radix's built-in ARIA tree.
- **Locale dropdown:** when `enabled === true`, renders a `<button>`-triggered Radix DropdownMenu listing locales with `hreflang` attributes on `<a>` tags.
- **Webflow `.w-dropdown` markup:** existing CE Webflow markup uses `.w-dropdown` / `.w-dropdown-toggle` / `.w-dropdown-list` classes. The rebuild ships the Radix DropdownMenu (D3 from primitives) and the CSS `[data-state]` selectors; do NOT preserve the `.w-*` Webflow classes per Step-2 capability-log "Probe-first dismissal protocol" — `.w-*` IS a Webflow framework artifact (unlike `.faq-btn`).

---

## 8. Acceptance criteria

- [ ] On home page (`/`), navbar transitions from transparent to active state when user scrolls past the hero
- [ ] On non-hero pages, navbar mounts in active state immediately (no transition needed)
- [ ] Mobile menu toggle opens / closes the full-screen menu overlay
- [ ] Both state axes (sticky position + mobile open) compose cleanly
- [ ] `prefers-reduced-motion: reduce` collapses transition durations to 0ms
- [ ] Sanity field changes propagate to preview within 5s (Visual Editing wired in Step 8)
- [ ] Keyboard navigation: Tab through links, Enter/Space opens dropdowns, Escape closes
- [ ] Screen reader: `<header>` + `<nav aria-label="Primary">`; mobile toggle has `aria-expanded`
- [ ] Locale dropdown renders when `localeDropdown.enabled === true`
- [ ] CMS-driven dropdowns fetch their items from the named `cmsCollection` (e.g., Services dropdown shows latest services)
- [ ] No FOUC on initial paint (navbar styles applied pre-hydration via static layout)
- [ ] Visual diff against captured live recording at desktop / tablet / mobile within structural-diff threshold per `tools/qa/structural-diff.config.ts`

---

## Schema-vs-reality findings

1. **AUDIT-1 Tech Debt #5 carried forward** — the live nav merges Technology dropdown into Services in `audit-output/ce-global-components.json`. The selector tweak / mapping is a TEMPLATE-NAV implementation concern, not a schema-vs-reality issue per se. **Resolution direction:** `template-fallback`. Schema is fine (`primaryLinks[].cmsDriven` + `cmsCollection` accommodates either grouping); the rendered decision is editorial. CE editor (Seb) can re-organize via Studio.

2. **Webflow `.w-dropdown` artifact classes — per probe-first dismissal protocol — IS Webflow framework boilerplate.** Distinction from `.faq-btn` (custom brand class): `.w-*` is Webflow's framework prefix, present on every Webflow site. The brand-design framing of HALT 10 lesson does not apply — these classes can be replaced with Radix DropdownMenu's `[data-state]` selectors in the rebuild without fidelity loss. **Resolution direction:** N/A — not a schema-vs-reality finding; documented as a render-discipline note.

---

*End of nav-sticky-transition-global.md v1.0 (3c batch — autonomous, format-locked at HALT 2).*

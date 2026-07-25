# Section Fade-Reveal Cascade

**Live URL pattern:** sitewide — every CMS-driven page (per AUDIT-1 Step 3e: "Appears on 14 template types").
**Sanity document type:** N/A — this is a **render utility** applied to any DOM section, not a data-driven component. Spec describes the orchestration; consuming templates wire any section into it via the equivalent of CE's `[fade-animation]` / `[cms-fade-animation]` attribute selectors (in the rebuild, likely a `data-fade-animation` attribute or React `<FadeReveal>` wrapper).
**Complexity:** **High** — multi-stage timeline orchestration via attribute selectors, sitewide reach, ScrollTrigger lifecycle management, performance-sensitive (cascading staggers must not jank on mid-tier mobile). This is the load-bearing animation surface for the entire site.
**Visual fidelity target:** N/A as a utility — applies on every page; consuming templates inherit their fidelity targets. **Stress-test spec for the 8-section format-lock (HALT 3).**
**Inventory entry:** [TIER_1_INVENTORY.md](../TIER_1_INVENTORY.md#inventory) row 1.

---

## 1. Behaviour

CE has two complementary animation mechanisms that cover every long-form page:

### 1.1 `[fade-animation]` — parent-with-children-stagger

Any element with the `fade-animation` attribute has its **children** revealed on scroll-into-view. The children translate up from `yPercent: 10` to `0` and fade in from `opacity: 0` to `1`, with a `stagger: 0.1s` between siblings. Easing is `power2.out`. Trigger fires when the parent's top edge enters the viewport at the 90% mark (`scrollTrigger: { trigger: fadeElement, start: "top 90%" }`).

Use cases (observed on home page per `audit-output/design-1/gsap-home.json`): titles + supporting text reveals, three-column grid reveals, building-list reveals, two-line title reveals.

### 1.2 `[cms-fade-animation]` — single-element-no-stagger

Any element with the `cms-fade-animation` attribute reveals **itself** (not its children) on scroll-into-view. Same yPercent 10 → 0 + opacity 0 → 1 + power2.out + top 90% trigger, but **without the stagger** (single element). Designed for individual CMS-rendered cards in lists — each card fires its own ScrollTrigger as it scrolls in (loose cascade emerges naturally from card spacing).

Both mechanisms run **once per element** — no replay on scroll-back-up (default ScrollTrigger behaviour: `once: false` is implicit; replay would require explicit `toggleActions`). Verified against `audit-output/ce-template-custom-code.json` source (no toggleActions / once / scrub config).

The two attribute selectors are queried at `DOMContentLoaded` and the GSAP timelines are created eagerly (not lazy). Initial-load reveals fire as soon as the relevant elements scroll past the viewport threshold.

---

## 2. State machine

Per element (both mechanisms):

```
                       ┌──────────────────┐
                       │  HIDDEN (initial) │
                       │  yPercent: 10     │
                       │  opacity: 0       │
                       └────────┬──────────┘
                                │ scroll-trigger fires
                                │ (parent top hits viewport 90%)
                                ▼
                       ┌──────────────────┐
                       │   REVEAL ANIM    │
                       │   ~600ms          │
                       │   stagger 0.1s   │
                       │   (children) OR  │
                       │   instant element│
                       └────────┬──────────┘
                                │ animation completes
                                ▼
                       ┌──────────────────┐
                       │     SETTLED       │
                       │     (no replay)   │
                       └──────────────────┘
```

Once SETTLED, the element does not re-animate on scroll-back-up.

**Sitewide-orchestration shape:** every page calls the orchestration script at `DOMContentLoaded`, queries `[fade-animation]` and `[cms-fade-animation]`, and wires up GSAP+ScrollTrigger for each match. There is one orchestration call per page; per-element state is independent.

---

## 3. Tech stack

**Library:** GSAP 3.12.5 + ScrollTrigger plugin — pinned via npm (per `audit-output/ce-scripts.json` GSAP version pin).

**Why GSAP+ScrollTrigger:** the live site uses this exact pair (per `audit-output/ce-template-custom-code.json` source code + `audit-output/design-1/gsap-home.json` runtime capture confirming 6 instances on `/`, plus `gsap-technology.json` confirming the same pattern on `/technology`). The `power2.out` easing curve is opinionated CE brand timing — reproducing with `framer-motion` or `cubic-bezier(...)` CSS approximation drifts on the curve. Reproducing with IntersectionObserver + plain CSS transitions is feasible but loses the stagger semantics for free (would need manual stagger calc per child). Per Step-3 brief §3 Tech stack guidance: "**GSAP if reproducing live-site timelines.**" Reproducing the live site's exact timeline is the entire point of this spec.

**Primitives composed (per `docs/design/COMPONENTS.md`):**
- None — this is a render utility, not a primitive composition. The utility wraps arbitrary DOM (any primitive can be the staggered child).

**Implementation pattern in the rebuild:**

The CE attribute-selector pattern (`document.querySelectorAll("[fade-animation]")` at `DOMContentLoaded`) is replaced by a React `<FadeReveal>` wrapper component (or a hook) that manages the GSAP timeline lifecycle within React's component lifecycle:

```tsx
'use client'
// usage shape (illustrative, not implementation):
<FadeReveal stagger>
  <h2>Title</h2>
  <p>Supporting copy</p>
  <div className="grid">{items.map(...)}</div>
</FadeReveal>

// or for single-element cards:
<FadeReveal mode="single">
  <Card data={...} />
</FadeReveal>
```

The `<FadeReveal>` wrapper:
1. Imports GSAP + ScrollTrigger via dynamic import (`const gsap = await import('gsap')`).
2. Registers ScrollTrigger plugin once per app lifecycle.
3. Creates the timeline in `useEffect` using `useRef` for the wrapper element.
4. Cleans up via `gsap.context()` and `ctx.revert()` on unmount.
5. Respects `prefers-reduced-motion: reduce` via `useReducedMotion()` hook — skips the animation, renders elements in their final-state styles.

**No Webflow-Designer guard needed.** CE's source wraps the orchestration in `if (!window.Webflow?.env("editor"))` because Webflow's Designer environment runs the page's JS but with stubs that break the orchestration. The rebuild has no Webflow Designer; the guard is a probe finding (sitewide pattern in CE custom code) but does not transfer.

---

## 4. Timing

**Provenance.** This component is **GSAP-driven, partially shim-extracted, partially source-code-extracted.** The Step-1 GSAP shim (`scripts/design/extract-gsap-timings.ts`) **captured 6 instances of the `[fade-animation]` mechanism on `/`** in `audit-output/design-1/gsap-home.json` (entries 4–9, all `gsap.from(<HTMLCollection n=N>, { yPercent: 10, opacity: 0, stagger: 0.1, ease: 'power2.out', scrollTrigger: { trigger: <DOM>, start: "top 90%" } })`). `gsap-technology.json` confirms the same pattern is active on `/technology` (different DOM targets, same config). **Both files are clean shim captures with no F10/F11/F12 caveats** — calls are post-assignment, ScrollTrigger configs are eagerly created at DOMContentLoaded (not interaction-driven), and the captured config objects serialize cleanly. Same orchestration source code per `audit-output/ce-template-custom-code.json`. **The configuration values below are extracted with high confidence from the runtime shim AND cross-referenced with the source code.**

**One additional reliability note:** the shim does NOT capture the `[cms-fade-animation]` mechanism on `/` because the home page's CMS-rendered card patterns happen to use `[fade-animation]` with parent-stagger. The `[cms-fade-animation]` shape is documented from source code only — relevant pages (e.g., individual blog post listing rendering) would need a dedicated shim run during 3c capture pass to runtime-verify.

| Phase | Trigger | Property | From | To | Stagger | Duration | Easing |
|---|---|---|---|---|---|---|---|
| `[fade-animation]` reveal (children) | ScrollTrigger `start: "top 90%"` on parent | `yPercent` | 10 | 0 | 0.1s between children | implicit (~600ms via GSAP defaults) | `power2.out` |
| `[fade-animation]` reveal (children) | (same) | `opacity` | 0 | 1 | 0.1s | implicit (~600ms) | `power2.out` |
| `[cms-fade-animation]` reveal (single element) | ScrollTrigger `start: "top 90%"` on element itself | `yPercent` | 10 | 0 | n/a | implicit (~600ms) | `power2.out` |
| `[cms-fade-animation]` reveal (single element) | (same) | `opacity` | 0 | 1 | n/a | implicit (~600ms) | `power2.out` |

**Implicit duration:** GSAP's default duration when not explicitly set is 0.5s (500ms). The CE source does not set `duration` — implicit 500ms applies. **Slightly different from the 600ms note above** — to confirm during 3c capture pass which value GSAP 3.12.5 uses (default may be configurable). Verbatim source from `audit-output/ce-template-custom-code.json`:

```js
// [fade-animation] — parent with children stagger
const fadeAnimation = document.querySelectorAll("[fade-animation]");
fadeAnimation.forEach(fadeElement => {
  if (!fadeElement || !fadeElement.children.length) return;
  gsap.from(fadeElement.children, {
    yPercent: 10,
    opacity: 0,
    stagger: 0.1,
    ease: "power2.out",
    scrollTrigger: { trigger: fadeElement, start: "top 90%" },
  });
});

// [cms-fade-animation] — single element no stagger
const cmsFadeAnimation = document.querySelectorAll("[cms-fade-animation]");
cmsFadeAnimation.forEach(fadeElement => {
  if (!fadeElement) return;
  gsap.from(fadeElement, {
    yPercent: 10,
    opacity: 0,
    ease: "power2.out",
    scrollTrigger: { trigger: fadeElement, start: "top 90%" },
  });
});
```

Wrapped in `if (!window.Webflow?.env("editor"))` (Webflow Designer guard — does not apply to the rebuild).

---

## 5. Breakpoints

The animation runs identically at all breakpoints; only the trigger geometry changes (different viewports → different "top 90%" pixel positions).

- **Desktop (≥1024px):** Animation engages cleanly. The cascading stagger reads as a fluid reveal.
- **Tablet (768–1023px):** Same behaviour. Stagger spacing may feel marginally faster relative to vertical scroll velocity (mobile users scroll slower per pixel) — still within brand intent.
- **Mobile (<768px):** Animation engages but **mid-tier mobile performance is the at-risk axis**. Cascading reveals on a long page can chain >20 ScrollTriggers active simultaneously. Mitigation in the rebuild: dynamic-import GSAP+ScrollTrigger only on pages that mount `<FadeReveal>` (avoid 30+ KB on text-only pages); use `markers: false` (default) and `fastScrollEnd: true` on ScrollTrigger.create to avoid scroll-velocity-induced stutter. Verified against `docs/design/PERFORMANCE_BUDGETS.md` budget for mobile JS.

**Reduced motion** (`prefers-reduced-motion: reduce`): `<FadeReveal>` skips the animation entirely. Children render at their final-state styles (`yPercent: 0`, `opacity: 1`). No fallback fade — CE's brand pattern is "still content" for reduced-motion users, not a softer animation. Implementation: `useReducedMotion()` from a small utility, gated at the wrapper level — never enters the GSAP code path.

---

## 6. Data binding

**N/A — this is a render utility, not a data-driven component.** The wrapper itself has no Sanity field paths. Templates that consume `<FadeReveal>` bring their own field paths from their parent doc type (e.g., a `<FadeReveal>` wrapping a hero section reads `homePage.heroDescription`; a `<FadeReveal>` wrapping a service card reads `service.*` fields).

**No GROQ query** for this spec — the wrapper does not query Sanity. **Format note (per HALT 2 lock 4 mandating GROQ inclusion in §6):** acceptable to omit a query for utility-shape components where there is genuinely no data binding. Surfacing this as a format-edge-case at HALT 3 — does the lock require a GROQ entry on every spec, or is "N/A — render utility" an acceptable explicit declaration?

---

## 7. Edge cases

- **Empty parent `[fade-animation]` (no children):** orchestration source includes `if (!fadeElement || !fadeElement.children.length) return;` — skips the animation cleanly. The rebuild's `<FadeReveal>` wrapper checks `React.Children.count` and renders without effect when zero. No crash.
- **Element scrolls in then out before animation completes:** GSAP timeline plays through to completion regardless. ScrollTrigger does not interrupt the `from` tween once started.
- **User scrolls past the trigger without pausing (fast scroll):** `fastScrollEnd: true` on ScrollTrigger causes the timeline to skip-to-end if scroll velocity exceeds the threshold. Visual: element appears already-revealed when user lands. Acceptable for fast-scroll readers — nobody pauses to watch reveals at high scroll velocity.
- **Element below the fold on initial load:** `start: "top 90%"` means the reveal fires when the element's top edge is 90% down the viewport. Works for both above-fold (already-past-trigger; element renders revealed) and below-fold (fires when scrolled into view).
- **Element above the fold on initial load:** ScrollTrigger detects "already-past-trigger" state and the element renders in its final-state styles (yPercent 0, opacity 1) without animating. CE source verified — no startle-on-load.
- **Reduced motion** (`prefers-reduced-motion: reduce`): wrapper bypasses GSAP entirely. Children render in final state. **Mandatory per Step-3 brief §3 Hard Rules.**
- **Slow GSAP load (race):** wrapper dynamic-imports GSAP. If the import fails, the wrapper falls back to rendering children in their final state (no animation, no error visible). Children always render — animation is progressive enhancement.
- **Memory leak prevention:** wrapper uses `gsap.context(() => { ... }, scope)` and calls `ctx.revert()` in `useEffect` cleanup. ScrollTrigger instances are destroyed when the component unmounts. Critical for SPA navigation (CE's full-page-load semantics in Webflow vs Next.js client-side routing).
- **Server-side rendering:** wrapper renders children in their **initial** state (yPercent 10, opacity 0) on the server — wait, no. **The initial state is hidden, which would cause a Flash-of-Hidden-Content if SSR'd.** Mitigation: SSR renders children in **final** state (no inline transforms); the wrapper applies the `from` state on `useEffect` mount, then animates to final. Hydration-safe; LCP-safe (no hidden content blocks LCP measurement).
- **Keyboard navigation:** N/A at the utility level. Children retain their own keyboard semantics. The wrapper does not add ARIA roles or focus traps.
- **Screen reader:** the wrapper does not announce the reveal — purely visual. Children retain their own SR semantics. No `aria-live` regions added (reveals are decorative, not informational).
- **Page with 0 instances of `[fade-animation]` / `[cms-fade-animation]`:** rebuild dynamic-imports GSAP only when at least one `<FadeReveal>` wrapper mounts. Static pages (e.g., `/legals/privacy-policy`) skip the GSAP bundle entirely.

---

## 8. Acceptance criteria

- [ ] `<FadeReveal>` wrapper with children (parent-stagger mode) replicates CE's `[fade-animation]` exactly — yPercent 10 → 0, opacity 0 → 1, stagger 0.1s, ease power2.out, ScrollTrigger top 90%
- [ ] `<FadeReveal mode="single">` wrapper replicates CE's `[cms-fade-animation]` — same config without stagger
- [ ] Animation runs once per element (no replay on scroll-back-up)
- [ ] `prefers-reduced-motion: reduce` skips the animation; children render in final state
- [ ] Above-the-fold elements render in final state on initial paint (no flash-of-hidden-content)
- [ ] Below-the-fold elements fire animation when scrolled into view
- [ ] Fast scroll past trigger skips-to-end via `fastScrollEnd: true`
- [ ] Memory leaks prevented via `gsap.context()` + cleanup
- [ ] SSR renders children in final state; client-side animation runs on mount
- [ ] LCP not blocked by hidden content (children render in final state on first paint)
- [ ] Lighthouse performance budget intact per `docs/design/PERFORMANCE_BUDGETS.md`
- [ ] Visual diff against captured live recording on `/`, `/technology`, `/services`, blog post page within structural-diff threshold per `tools/qa/structural-diff.config.ts`
- [ ] Mid-tier mobile (e.g., Pixel 5 emulation) does not jank with 6+ active ScrollTriggers
- [ ] Pages with no `<FadeReveal>` wrappers skip the GSAP bundle (dynamic import gating)

---

## Schema-vs-reality findings

1. **§6 Data binding GROQ-mandate edge case (RESOLVED at HALT 3 via Path A).** This spec is a render utility with no data binding. HALT 2 lock 4 mandated GROQ query shape in §6 for every spec. **Resolution:** Path A approved at HALT 3 with mechanical trigger — §6 may declare `N/A — render utility` ONLY when the component does not touch Sanity data anywhere. This spec qualifies cleanly (no Sanity data flows through the wrapper). No back-port required. **Resolution direction:** `template-fallback` (format-mandate refined to accommodate utility-shape; section-fade-reveal-global ships with explicit `N/A — render utility` in §6 per the new mechanical trigger).

2. **Implicit GSAP duration value (500ms vs 600ms).** CE's source does not set `duration` on the `gsap.from(...)` calls — GSAP's implicit default applies. GSAP 3.12.5's default is documented as 0.5s (500ms). Spec ships with 500ms; verify against runtime measurement during 3c capture pass to confirm the value used. **Resolution direction:** `template-fallback` (no schema involved); locked to GSAP 3.12.5's documented default with a verify-in-capture-pass note. Not a blocker.

3. **`[cms-fade-animation]` runtime evidence missing.** The Step-1 GSAP shim ran on `/`, `/about-us`, `/technology` — none of which exercise the `[cms-fade-animation]` selector with high-volume CMS lists. Source code is documented; runtime verification is deferred to a 3c capture pass against a CMS-list-rendering page (e.g., `/blogs` or `/customer-story` listing). **Resolution direction:** `template-fallback` with capture-pass verification. Not a blocker for the spec format-lock; resolves at template-build for the consuming list page.

---

*End of section-fade-reveal-global.md v1.0 — 3d stress-test spec (HALT 3 surface candidate). 4 specs total drafted across 3b/3c/3d.*

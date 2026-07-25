# Home Hero Scale-In

**Live URL pattern:** `/` (and `/uk` UK locale mirror — same animation).
**Sanity document type:** `homePage` singleton (per `MYGRATR_SCHEMA_DESIGN_DECISIONS.md §4.4` static content singletons block, line 743).
**Complexity:** Medium
**Visual fidelity target:** HOME 88% per v2.0 brief §7 fidelity table.
**Inventory entry:** [TIER_1_INVENTORY.md](../TIER_1_INVENTORY.md#inventory) row 2.

---

## 1. Behaviour

The home page hero image (`<img class="hero-img align-top">`) starts at 1.2× scale on page load and animates down to 1.0× scale over 1.5 seconds with `power2.out` easing. The animation runs once on initial page load (no scroll-trigger; no replay on re-navigation under client-side routing — runs once per `useEffect` mount).

Visual effect: the hero image appears slightly oversized at first frame, then settles in to its natural size as the page becomes interactive. Common cinematic-establish pattern.

The hero image is positioned `align-top` (alignment handled by the `.cc-hero` section's container layout) with a complementary `<img class="circle-hero">` decorative graphic and a `<div class="gradient-top">` overlay that handles the contrast wash for the fold's headline. **Only `.hero-img` animates** — the gradient and circle are static.

---

## 2. State machine

Single-state. Animation runs once on mount, then settles. No interaction.

```
mount → animate (1.5s) → settled
```

If the user navigates away and back via client-side routing (Next.js App Router), the component re-mounts and the animation re-plays. This matches CE's behaviour because Webflow does a full page load per navigation; in the rebuild, `useEffect` runs on each mount.

---

## 3. Tech stack

**Library:** GSAP 3.12.5 — pinned via npm (per `audit-output/ce-scripts.json` GSAP version pin).

**Why:** CE's live site uses GSAP for this exact animation (per `audit-output/design-1/gsap-home.json` line 134-145). Reproducing 1.5s `power2.out` ease with framer-motion or CSS transitions either drifts on easing curves or loses the pinned-version timing reproducibility. GSAP is already loaded for #1 section-fade-reveal-global (sitewide); marginal cost is zero.

**Primitives composed (per `docs/design/COMPONENTS.md`):**
- **E1 Image** — the hero image element itself (Next.js `<Image>` with `priority` and `fetchPriority="high"` for LCP).
- (No other primitives — this is a single-element animation.)

---

## 4. Timing

**Provenance.** This component is **GSAP-driven and clean**. The Step-1 GSAP shim (`scripts/design/extract-gsap-timings.ts`) captured this animation cleanly in `audit-output/design-1/gsap-home.json` — entry index 10 (`fromTo` on `<img.hero-img.align-top>`). No F10 (pre-assignment) caveat — the call is post-assignment. No F11 (lazy ScrollTrigger) caveat — this is not a ScrollTrigger animation. No F12 (serializer fragility) caveat — single primitive value, no NodeList/HTMLCollection. **All timings below are shim-extracted with no concerns.**

| Phase | Duration | Easing | Property |
|---|---|---|---|
| Hero scale-in | 1500ms | `power2.out` | `scale: 1.2 → 1` |

The GSAP fromTo call captured verbatim from `gsap-home.json`:

```js
gsap.fromTo('img.hero-img.align-top',
  { scale: 1.2 },
  { scale: 1, duration: 1.5, ease: 'power2.out' }
);
```

Single property, single timeline, single element. No stagger, no ScrollTrigger, no nested timelines.

---

## 5. Breakpoints

The animation runs identically at all breakpoints — only the source-image dimensions and CSS layout change.

- **Desktop (≥1024px):** full-bleed hero image fills `.cc-hero._90vh` (90vh height container). Scale-in covers ~85% viewport area.
- **Tablet (768–1023px):** image reflows to fit container width per `srcset`/`sizes`; animation duration unchanged.
- **Mobile (<768px):** image reflows; animation duration unchanged. Test target: animation does not jank on mid-tier mobile (verified in QA-1 against `docs/design/PERFORMANCE_BUDGETS.md` LCP budget).

**Reduced motion** (`prefers-reduced-motion: reduce`): animation is skipped — image renders at scale 1 on mount, no transition. See §7.

---

## 6. Data binding

| UI region | Sanity field path | Document type | Required? |
|---|---|---|---|
| Hero image source | `homePage.heroImage` | homePage (singleton) | optional per schema; required in render-discipline (template falls back to `<div class="cc-hero">` empty if missing) |
| Hero image alt text | `homePage.heroImage.alt` | homePage (singleton) | optional (Sanity image alt is conventionally optional) |

**GROQ query shape:**

```groq
*[_type == "homePage"][0] {
  heroImage {
    asset->{ _id, url, metadata { lqip, dimensions } },
    alt
  }
}
```

Singleton fetch (no slug); single result. `metadata.lqip` provides the low-quality blur placeholder for first-paint before the AVIF source loads. `metadata.dimensions` enables aspect-ratio-preserving CLS prevention. **Field paths verified against `MYGRATR_SCHEMA_DESIGN_DECISIONS.md §4.4` (line 758–762) — `homePage` singleton inherits the static-content singleton schema with `heroImage: image (optional)`.**

**Decorative siblings (no Sanity binding):**
- `<img class="circle-hero">` — static brand asset; ships with the rebuild's `public/` directory or via tokens reference, not CMS-controlled per CE's pattern.
- `<div class="gradient-top">` — pure CSS gradient overlay defined in tokens.

---

## 7. Edge cases

- **Empty `heroImage` field:** template renders the `.cc-hero` section with the gradient-top + circle-hero decorations only; no scale-in animation runs (no element to animate).
- **Slow image load (LCP impact):** image uses `<Image priority fetchPriority="high">` per Next.js. The scale-in animation is purely a CSS `transform: scale(...)` (no opacity, no filter) — element renders into LCP at scale 1.2 immediately, GSAP animates to 1.0 over 1.5s. **LCP element is the hero image; transform does not affect LCP measurement.** Verified in QA-1 against PERFORMANCE_BUDGETS.md.
- **Reduced motion** (`prefers-reduced-motion: reduce`): animation is skipped via `useReducedMotion()` hook (or media-query check). Image renders at scale 1.0 on mount. No fallback-to-fade — CE's brand pattern is "still image" for reduced-motion users, not "fade in".
- **Client-side re-navigation:** `useEffect` re-mount re-plays the animation. Acceptable per CE's full-page-load semantics on the live site.
- **GSAP not loaded yet (race):** the animation hook waits for GSAP via dynamic import (`const gsap = await import('gsap')`) inside `useEffect`. If GSAP fails to load, image renders at scale 1.0 (no animation, but no error).
- **Keyboard navigation:** N/A — hero image is decorative (alt text optional) and not a focus target. Tab order skips it.
- **Screen reader:** `<img alt={heroImage.alt || ''}>` — empty alt for decorative use; populated alt for meaningful images per Sanity author choice. The animation itself is silent (no live region).

---

## 8. Acceptance criteria

- [ ] On page load at desktop, hero image scales from 1.2 to 1.0 over 1.5s with `power2.out` easing matching live site
- [ ] LCP measurement is the hero image (transform does not block LCP)
- [ ] `prefers-reduced-motion: reduce` skips the animation; image renders at 1.0 immediately
- [ ] Animation re-plays on client-side re-navigation to `/`
- [ ] Sanity field changes propagate to preview within 5s (Visual Editing wired in Step 8)
- [ ] No layout shift during animation (scale on image with fixed container)
- [ ] Lighthouse performance budget intact per `docs/design/PERFORMANCE_BUDGETS.md`
- [ ] Visual diff against captured live recording at desktop / tablet / mobile within structural-diff threshold per `tools/qa/structural-diff.config.ts`

---

## Schema-vs-reality findings

None. `homePage.heroImage` field is present in the schema; live UI region maps cleanly. The optional/required mismatch (schema optional, render-discipline expects present) is template-fallback-handled — not a schema-vs-reality finding requiring resolution.

---

*End of home-hero-scale-in.md v1.0 (3c batch — autonomous, format-locked at HALT 2).*

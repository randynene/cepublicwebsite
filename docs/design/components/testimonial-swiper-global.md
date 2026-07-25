# Testimonial Swiper Carousel (Company Testimonies)

**Live URL pattern:** sitewide (`/`, `/services`, plus 2 other template types — `semi_global` scope per `audit-output/ce-template-custom-code.json` "appears on 4 template types").
**Sanity document type:** `review` (per `MYGRATR_SCHEMA_DESIGN_DECISIONS.md §3.8` — 26 review docs).
**Complexity:** Medium
**Visual fidelity target:** N/A as a primitive component — applies to consuming templates' targets (HOME 88%, SERVICE 92%, others per v2.0 brief §7 fidelity table).
**Inventory entry:** [TIER_1_INVENTORY.md](../TIER_1_INVENTORY.md#inventory) row 4 (3b first-spec — L3 fallback engaged).

---

## 1. Behaviour

A horizontally-scrolling carousel of customer-testimony cards. Auto-advances every 6s through the slide set; loops to the first slide after the last. Each slide presents a setting photo, a 5-star rating image, the customer's company logo, a quote, and the author's avatar + name + title.

User interaction:
- **Click a pagination bullet** → carousel jumps to that slide; autoplay timer restarts.
- **Touch drag / mouse drag** (`grabCursor: true`) → user manually advances or rewinds; autoplay timer restarts.
- **Keyboard tab** → focus moves into the bullet pagination; `Enter` / `Space` activates the focused bullet.
- **No prev/next buttons.** This variant uses bullet-pagination-only navigation, distinguishing it from the sibling `.swiper.testimonies` variant (see §1.1 Variant note below).

The carousel is **CMS-driven** via Webflow's `w-dyn-list` markers in the source; in the rebuild, slide content comes from a GROQ query against the `review` doc type with explicit ordering (per `review.order` field).

### 1.1 Sibling variant — `.swiper.testimonies` (NOT this spec)

`audit-output/ce-template-custom-code.json` shows a second Swiper testimonial variant initialised against `.swiper.testimonies` (note the missing `company-` prefix). That variant has prev/next arrow navigation (`.swiper-btn-next-testimony` / `.swiper-btn-prev-testimony`), `dynamicBullets: true`, no autoplay, and `spaceBetween: 24`. It appears on a different surface (likely `/reviews` listing). **This spec covers `.swiper.company-testimonies` only.** The variant is captured as a Schema-vs-reality finding below — Step 4 templates that need the variant either compose a different `<TestimonialCarousel>` instance with overridden props, or get a separate component depending on how Step 4 carousel patterns shake out.

---

## 2. State machine

```
                                  ┌──────────────────┐
                                  │  AUTOPLAY (6s)   │
                                  │  (looping)       │
                                  └────────┬─────────┘
                                           │
                                           ▼
                       ┌──────────────────────────────────────┐
                       │  user clicks bullet / drags / focuses │
                       └────────────────┬─────────────────────┘
                                        │
                                        ▼
                                ┌────────────────┐
                                │  JUMP TO SLIDE │
                                │  (timer reset) │
                                └────────┬───────┘
                                         │
                                         ▼
                                  resume AUTOPLAY (6s)
```

Single-axis state — only the active-slide index changes. Loop wraps invisibly via Swiper's `loop: true`.

---

## 3. Tech stack

**Library:** [Swiper 11](https://swiperjs.com/) — pinned via npm at the SCAFFOLD-1-confirmed version (per `audit-output/ce-scripts.json` GSAP-style version pin convention).

**Why:** CE's live site uses Swiper 11 directly (per `audit-output/ce-template-custom-code.json` — inline `new Swiper(...)` init script is a `semi_global` artifact appearing on 4 template types). Swiper ships full keyboard/touch/ARIA handling, autoplay/loop/pagination management, and is library-supportable (bounded API surface). Reproducing this with hand-rolled JS is a no-value re-invention. Per Step-3 brief §3 Tech stack guidance ("GSAP if reproducing live-site timelines; ... CSS-only if the live site is also CSS-only"), the rule extends to other libraries: **library if the live site uses one.**

**Primitives composed (per `docs/design/COMPONENTS.md`):**
- **A4 Card** — outer slide chassis (white bg, 16px radius — verify against actual CE testimonial-card class `.company-testimonies-wrap`)
- **B1 Heading** — author name (semantic level: `<p>` with weight class, not a heading per CE markup `<div class="u-weight-med">`; treat as styled body text in the rebuild)
- **B2 Text** — quote body, author title (`.testimont-content` rich text + `.body-14` author title)
- **E1 Image** — setting photo, customer logo, author avatar, hardcoded star-rating image
- **B3 PortableText** — only if `review.testimonyParagraph` (Portable Text) is rendered instead of `review.testimonyShort` (plain string). Per current schema both are optional; spec assumes `testimonyShort` for short quote display.

---

## 4. Timing

**Provenance.** This component is **library-mediated, not GSAP-driven.** The Step-1 GSAP shim at `scripts/design/extract-gsap-timings.ts` does not and cannot capture Swiper internals — it intercepts `gsap.*` API calls, while Swiper has its own RAF loop. `audit-output/design-1/gsap-{home,about,technology}.json` correctly contain zero Swiper-related entries — this is a structural shim gap, not an F10/F11/F12 v2.0-§15 shim failure. **All timings below were extracted manually from the inline `new Swiper(...)` init script captured in `audit-output/ce-template-custom-code.json` (the `semi_global` script "appearing on 4 template types").** The Swiper-default values (slide transition speed, easing) are inherited from Swiper 11's documented defaults — values explicitly set in the init are listed below; values not set fall through to library defaults.

| Phase | Duration | Easing | Notes |
|---|---|---|---|
| Auto-advance interval | 6000ms | n/a | `autoplay.delay: 6000` — per init |
| Slide transition speed | 300ms | `cubic-bezier(.65,0,.35,1)` (Swiper 11 default) | Not overridden in init; documented default |
| Bullet click → jump | 300ms | (same as slide transition) | Pagination uses same transition speed |
| Touch drag follow | 1:1 (`touchRatio: 1` is Swiper default; not set explicitly) | none | Real-time pointer tracking |
| Loop wrap | 0ms (visually invisible) | n/a | Swiper duplicates first/last slides for seamless wrap |

No multi-stage timeline. Single-property animation per slide change (translateX on `.swiper-wrapper`).

---

## 5. Breakpoints

`slidesPerView: 'auto'` means each slide's CSS width determines layout. Per CE's compiled CSS (`cloudemployee.shared.eecb71bdf.min.css`):

- **Desktop (≥1024px):** slide width determined by `.company-testimonies-wrap` content width (~480–600px); typically 1–1.5 slides visible. Pagination bullets below the carousel.
- **Tablet (768–1023px):** Single slide visible; pagination centred below.
- **Mobile (<768px):** Single slide; full-width; pagination below; touch-drag remains primary navigation; autoplay still runs.

**Reduced-motion behaviour at all breakpoints:** autoplay disabled (per §7 Edge cases). User retains manual navigation via bullets / drag / keyboard.

(Specific pixel widths to be confirmed during rebuild against measured CE sources — capture references in `_assets/testimonial-swiper-global/screenshots/` populated at 3c batch.)

---

## 6. Data binding

| UI region | Sanity field path | Document type | Required? |
|---|---|---|---|
| Customer setting photo | `review.thumbnailImage` | review | optional |
| Customer company logo | `review.companyLogo` | review | optional |
| Quote text (short form) | `review.testimonyShort` | review | optional |
| Quote text (rich form, alternative) | `review.testimonyParagraph` (Portable Text array) | review | optional |
| Author avatar | `review.memberImage` | review | optional |
| Author name | `review.nameClient` | review | **required** |
| Author title / role | `review.position` | review | optional |
| Slide order | `review.order` (number, used in GROQ `order(order asc)`) | review | optional |
| Star rating | `review.rating` — **deferred to STATIC-1 / SCHEMA-2** per §Schema-vs-reality finding 1 (schema-relax). Render hardcoded 5-star asset in interim. | review | (will be required, default 5, after schema update) |

**GROQ query shape (consumed by the Step-4 component):**

```groq
*[_type == "review"] | order(coalesce(order, 9999) asc) [0..9] {
  _id,
  nameClient,
  position,
  testimonyShort,
  testimonyParagraph,
  memberImage,
  companyLogo,
  thumbnailImage,
  order,
}
```

Slice limit (`[0..9]`) is template-author's choice — CE renders 6+ slides on `/services`, 6+ on home; cap is editorial. Field paths verified against `MYGRATR_SCHEMA_DESIGN_DECISIONS.md §3.8`. **No invented fields.**

---

## 7. Edge cases

- **Zero reviews:** the entire carousel section does not render (component returns `null` when input array is empty). Templates avoid layout-collapse by not reserving carousel space when no reviews query.
- **Single review:** autoplay + loop disabled (`autoplay: false`, `loop: false` overrides applied programmatically when `slides.length === 1`); pagination hidden; component degrades to a single static testimonial card.
- **Two slides:** autoplay + loop active but with shorter pagination; Swiper handles natively.
- **Slow image load (LCP impact):** slides use `loading="lazy"` for non-first-slide images. The first slide's images use `priority` per `next/image` to avoid LCP regression. Setting photos are AVIF-compressed at the source — preserve the AVIF pipeline.
- **Reduced motion** (`prefers-reduced-motion: reduce`): autoplay disabled at component mount via `useReducedMotion()` hook (or media-query check). Slide transitions still work on user input but use the system's "instant" preference — Swiper supports this via `speed: 0` or by disabling transitions in CSS. **Mandatory per Step-3 brief §3 Hard Rules.**
- **Keyboard navigation:** Tab focus enters pagination bullets; Enter / Space activates focused bullet; arrow keys (Left/Right) navigate slides when carousel has focus (Swiper's `keyboard` module enabled). Focus indicator visible.
- **Screen reader:** `<div role="region" aria-label="Customer testimonials" aria-roledescription="carousel">`. Active slide gets `aria-current="true"`; non-active slides `aria-hidden="true"` only when offscreen (Swiper handles via `a11y` module). Live region announces slide changes politely (not assertively, since autoplay is decorative).
- **Touch / pointer:** `simulateTouch: true` (Swiper default) gives mouse drag parity with touch. `grabCursor: true` shows the grab affordance.
- **Empty optional fields:** if `companyLogo` is absent, slide renders without it (no placeholder). Same for `thumbnailImage`, `memberImage`, `position`. `nameClient` is required by schema — render-discipline assumption holds.
- **CMS-published-but-no-quote:** if both `testimonyShort` and `testimonyParagraph` are empty, slide is hidden from the carousel via the GROQ query (or component-level filter). This is editorial-shape; flag in PHASE_HISTORY for content guardrail.

---

## 8. Acceptance criteria

- [ ] Carousel auto-advances every 6000ms on desktop matching live site
- [ ] Loop wraps cleanly (last slide → first slide without visible gap)
- [ ] Bullet pagination is clickable; bullet click jumps to that slide and restarts autoplay timer
- [ ] Touch drag works on tablet/mobile; mouse drag works on desktop
- [ ] `prefers-reduced-motion: reduce` disables autoplay
- [ ] Keyboard navigation: Tab into pagination, Enter/Space activates, Left/Right arrow keys advance/rewind when carousel is focused
- [ ] Screen reader announces active-slide change politely; carousel has `aria-roledescription="carousel"` and `aria-label`
- [ ] No layout shift when slide images load (LCP for first slide; lazy for rest)
- [ ] Sanity field changes propagate to preview within 5s (Visual Editing wired in Step 8)
- [ ] Lighthouse performance not degraded vs current site (verified in QA-1 against `docs/design/PERFORMANCE_BUDGETS.md`)
- [ ] Visual diff against captured live recording at desktop / tablet / mobile within structural-diff threshold per `tools/qa/structural-diff.config.ts` (DESIGN-1 Step 6)
- [ ] Zero-state (no reviews) renders nothing, doesn't reserve layout space
- [ ] Single-review state degrades to static card without pagination

---

## Schema-vs-reality findings

1. **Hardcoded 5-star rating image — no data field.** The live markup hardcodes `_stars.png` for every slide. There is no `review.rating` field in `MYGRATR_SCHEMA_DESIGN_DECISIONS.md §3.8`.

   **Resolution direction:** `schema-relax`. Add `review.rating: number (min: 1, max: 5, default: 5)` to the schema. CE backfill defaults to 5 (curatorial reality — every featured testimonial is 5-star), with editorial override available for future non-5-star testimonials. Hardcoding "5 stars" in the template would ship CE-specific fallback as Mygratr productisation IP — scope bleed against the customer-2-reusable framing in `docs/CAPABILITY_LOG.md`. **Schema not modified in DESIGN-1 Step 3** (per Step-3 brief Hard Rule #5 — "spec discovers Sanity schema is missing a load-bearing field — surface for STATIC-1 / SCHEMA-2 mini-phase. Do NOT modify schema in Step 3"). This finding is the surface; field addition lands in STATIC-1 / SCHEMA-2.

   **§6 Data binding entry to add post-schema-update:** `Star rating | review.rating | review | required (default 5)`. Until then, §6 carries the row marked "(deferred to STATIC-1 / SCHEMA-2; render hardcoded 5-star asset in interim)." Template-time interim renders the hardcoded asset; once `review.rating` lands, swap to `<StarRating value={review.rating} />` reading from the field.

2. **Sibling Swiper variant `.swiper.testimonies` not specced here.** Variant has prev/next arrows + `dynamicBullets` + no autoplay; appears on a different surface (likely `/reviews`). **Resolution direction:** `decision-needed`. Either (a) spec-relax — accept that one component handles both variants via prop-driven config (autoplay on/off, navigation arrows on/off, dynamicBullets on/off), or (b) deferred-to-STATIC-1 — write a separate spec for `.swiper.testimonies` if it diverges enough. No blocker for this spec.

---

*End of testimonial-swiper-global.md v1.0 (3b first-spec, draft pending HALT 2 format-lock).*

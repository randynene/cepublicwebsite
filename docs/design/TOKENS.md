# Design Tokens — Mygratr / Cloud Employee

> Single source of truth for design tokens consumed by every TEMPLATE-*
> phase. Extracted from cloudemployee.io live site; cross-referenced
> against `audit-output/`. Values resolve via `site/src/app/tokens.css`
> (`@theme {…}` block, Tailwind v4 CSS-first config).

**Status:** MYGRATR-DESIGN-1 Step 1 — initial token set. Locked at
v1.0 of this document; revisions track via `## Changelog` at bottom.

**Locked:** 2026-05-04 (DESIGN-1 Step 1 close).

---

## How to use

- **Tailwind utilities** generated from `@theme {…}` declarations.
  Tailwind v4 is **namespace-driven** — utility classes are produced
  from specific `--<namespace>-*` prefixes per property type, NOT from
  arbitrary semantic names. See §0 below.
- **CSS variables** available at runtime via `var(--text-h1)`,
  `var(--color-brand-primary)`, etc. Use only when a Tailwind utility
  doesn't exist for the property (e.g., custom CSS in component files,
  GSAP timeline values).
- **Aliases** (per Refinement B / DEV-5 dual-consumer pattern) declared
  in `@theme` via `var()` — single source of truth, runtime cascade.
  Example: `--color-text-link: var(--color-brand-primary)` means
  changing `--color-brand-primary` automatically updates `text-link`
  everywhere.
- **Type scale is mobile-first.** Components add Tailwind responsive
  prefixes for desktop upsizing. Example:
  `<h1 class="text-h1 sm:text-h1-md lg:text-h1-desktop">`.

### 0. Tailwind v4 namespace map (DEV-5 reference)

These are the namespaces this token set uses; each maps to a specific
utility class generation rule:

| CSS-var prefix | Tailwind utility | Property |
|---|---|---|
| `--color-{name}` | `bg-{name}`, `text-{name}`, `border-{name}`, `fill-{name}`, etc. | color |
| `--text-{name}` | `text-{name}` | font-size |
| `--font-{name}` | `font-{name}` | font-family |
| `--font-weight-{name}` | `font-{name}` | font-weight (the `weight-` namespace is the property selector; `{name}` becomes the utility suffix — `--font-weight-medium` → `.font-medium`, NOT `.font-weight-medium`) |
| `--leading-{name}` | `leading-{name}` | line-height |
| `--spacing` (single scalar) | `p-N`, `m-N`, `gap-N`, `space-x-N`, etc. via `calc(var(--spacing) * N)` | spacing |
| `--radius-{name}` | `rounded-{name}` | border-radius |
| `--shadow-{name}` | `shadow-{name}` | box-shadow |
| `--breakpoint-{name}` | `{name}:` responsive prefix | media query |
| `--duration-{name}` | `duration-{name}` | transition-duration |
| `--ease-{name}` | `ease-{name}` | transition-timing-function |

Multi-hyphen suffixes (e.g. `--text-h1-desktop` → `text-h1-desktop`)
generate cleanly — verified via Revision 1 probe.

**Customer-2 note:** verify this mapping against the Tailwind major
version installed in the customer repo. Tailwind v3 used JS-config
(`theme.extend.fontSize`, etc.); v4 is CSS-first with these namespaces.

---

## 1. Colors

Extraction methodology: computed-style scan via Playwright at 1440×900
across /, /about-us, /technology, /services, /blog. Cross-referenced
with `audit-output/design-1/styles-*.json`, `diagnostic-2.json`,
`diagnostic-3.json`.

### 1.1 Brand

| Token | Value | Source / context | Frequency |
|---|---|---|---|
| `--color-brand-primary` | `#1c787c` (teal) | `<a>` color, `.primary-button.w-button` bg, ScrollTo target | 120 element matches across 5 pages |
| `--color-brand-secondary` | `#dff46e` (lime) | `.primary-button.cc-yellow` bg ("Book A Call") | 50 matches |
| `--color-brand-tertiary` | `#223c6c` (navy) | `<footer>` bg + `.cc-blue` / `.blue` modifier convention (text 120, border 123, bg 66 across 5 pages) | 166 matches via Diagnostic 2 |

**Brand-tertiary multi-property usage:** CE applies navy via the
`.cc-blue` / `.blue` class modifier convention. Examples: `.txt-link.cc-blue`
(text + border + outline), `.tag.cc-blue` (bg), `.label-bold.cc-blue` (bg),
`.primary-button.cc-blue` (bg), `.switch-button.blue` (bg),
`<footer class="section footer">` (bg).

**Footer is uniformly `#223c6c` across all 5 pages** (Diagnostic 3) —
already covered by `--color-brand-tertiary`.

### 1.2 Text

| Token | Value | Source | Notes |
|---|---|---|---|
| `--color-text-default` | `#212121` | body / h2 / h3 / h4 / p across all pages | 188 element matches |
| `--color-text-on-dark` | `#ffffff` | h1 over hero `#223c6c` bg + nav links over dark sections | 211 text matches as `#ffffff`; CE source uses `#f9f9f9` on hero h1 specifically (deliberate slight-off-white). Tokenized as `#ffffff` because visual difference at body-text rendering is below QA threshold; if a future audit surfaces meaningful contrast issue with this normalization, introduce `--color-text-on-hero: #f9f9f9` as discrete token. |
| `--color-text-link` | `var(--color-brand-primary)` | alias | `<a>` default state matches brand-primary; aliased per Refinement B |

**No `--color-text-muted` token.** CE relies on font-weight + size for
hierarchy, not greyscale (Refinement A). Confirmed via:
- Zero matches for `.muted` / `.caption` / `.helper-text` / `.subtitle` /
  `.subhead` / `.byline` / `<small>` selectors across live probe.
- `#222222` source declarations (28 occurrences) all on Webflow native
  components (`.w-dropdown-link`, `.w-nav-link`, `.w-tab-link`,
  `.form_input-2::placeholder`, `.testimont-content p`) — these don't
  carry over to the new Next.js stack.

### 1.3 Surfaces

| Token | Value | Source | Notes |
|---|---|---|---|
| `--color-surface-base` | `#f9f9f9` | body bg | Off-white page background |
| `--color-surface-elevated` | `#ffffff` | Card surfaces sitting on `#f9f9f9` | 300 matches as `#fff` |
| `--color-surface-overlay` | `rgba(255, 255, 255, 0.1)` | Overlays on dark sections | 29 matches |
| `--color-surface-tint-brand` | `rgba(28, 120, 124, 0.05)` | Subtle teal-tinted accent panels | 10 matches |

**`--color-surface-dark` was dropped** (Diagnostic 3). The `#101828`
4-occurrence outlier turned out to be **input text color** on
`input.input-field.noborder.w-input` only — not a surface. If Step 2's
Input primitive needs a dark text variant, it can introduce
`--color-text-input` then with explicit context.

---

## 2. Typography

### 2.1 Font families

| Token | Value | Source |
|---|---|---|
| `--font-base` | `var(--font-poppins)` | Universal — body / h1-h6 / p / a / buttons; computed style "Poppins, Arial, sans-serif" on 162 of 166 elements |

`--font-poppins` is set on `<html>` by `next/font/google` in
`site/src/app/layout.tsx` (DEV-4 swap from Inter, 2026-05-04).
**`next/font/google` manages the full font stack including fallbacks
and metric matching; we trust its output** — no trailing `, Arial,
sans-serif` chain in our token. Weights loaded: 400 / 500 / 600 — the
only weights observed in CE computed styles.

**Excluded fonts:**
- **Inter** — loaded by Webflow boilerplate but never applied to any
  rendered element across 5-page probe. Confirmed via
  `document.fonts` enumeration + per-element computed font-family scan.
  Excluded on absence of current use; revisit if Step 7 surfaces
  unexpected Inter usage.
- **Material Symbols** — used in 4 elements as icon font. Deferred to
  Step 2 Icon primitive (fewer fonts means CLS-free first paint; load
  decision belongs with the Icon primitive author). Will introduce
  `--font-icon` token when the primitive lands.

### 2.2 Type scale (mobile-first)

| Token | Value | px | Source | Use |
|---|---|---|---|---|
| `--text-h1` | `3rem` | 48 | CE `h1 @≤479` (`var(--size--48px)`) | Mobile h1 base — applies by default |
| `--text-h1-desktop` | `3rem` | 48 | DEV-13 probe-measured dominant H1 visual (Step 2.6 HALT 3) | Desktop (≥992px) — apply via `lg:`. Same value as `--text-h1` post-DEV-13 (no breakpoint jump until templates require it). |
| `--text-h2` | `2rem` | 32 | (inferred) CE `.heading-style-h2 @≤767`; token applies to all `h2` consistently | Mobile h2 base — applies by default |
| `--text-h2-desktop` | `2.5rem` | 40 | CE bare `h2` selector (40px observed on /technology, /blog) | Desktop bare h2 (≥992px) — apply via `lg:` (DEV-13: probe corrected from `md:`). |
| `--text-h4` | `1.5rem` | 24 | CE h4 / h6 across all pages | Single size (no responsive variant observed) |
| `--text-h5` | `1.125rem` | 18 | CE h5 on /technology, /services | Single size |
| `--text-display-mobile` | `2.375rem` | 38 | DEV-13 probe of "Ready to hire?" section CTA (5× across pages) | Mobile baseline for `display` size variant |
| `--text-display-tablet` | `2.8125rem` | 45 | DEV-13 probe (rounded from 45.4px tablet measurement) | Apply via `md:` |
| `--text-display` | `3.75rem` | 60 | DEV-13 probe (recurring CTA heading at desktop) | Desktop — apply via `lg:` |
| `--text-eyebrow` | `var(--text-h5)` | 18 | Verification 1 confirmed CE `.label-bold` is 18px / weight 500 / line-height 1.5 / NO uppercase / NO tracking | Semantic alias of h5 for kicker / overline labels |
| `--text-body` | `1rem` | 16 | body, `<a>` | Universal |
| `--text-body-sm` | `0.875rem` | 14 | `<p>` | Universal |

**Source-unit verification (Diagnostic 1):** every CE heading
declaration is rem-based at root 16px. Zero em (parent-relative)
declarations on meaningful selectors. CE has its own
`var(--size--Npx)` CSS-var system at root — **not adopted**; our
tokens supersede.

**Naming convention note:** suffixes encode the **source-CE-breakpoint
range a value applies to** (`-mobile` / `-tablet` / `-desktop`), not
a 1:1 mapping to Tailwind's prefix names. Each token's "Use" column
above lists which Tailwind prefix applies it. Per probe-measured
cascade (Step 2.6 HALT 3): h1 / h2 jump only at 992px (`lg:`); display
jumps at 768px (`md:`) AND 992px (`lg:`); h4 / eyebrow show no
breakpoint jumps in CE.

**Homepage hero variant (`.hero-heading.new` = 4.3rem / 68.8px):**
single-component variation, **not tokenized**. The Tier-1 Hero
component spec (Step 7) will document this as a Tailwind arbitrary
value at component level: `<Heading as="h1" size="display" className="lg:text-[4.3rem]">`.

**DEV-13 cleanup note (Step 2.6 HALT 3):** `--text-h1-tablet` (4rem)
and `--text-h2-large` (3rem) were removed at Step 2.6. Both tokens
were Step-1-scaffolded with no consumer references and (post-probe)
no probe-grounded values matching CE-rendered output. The
`--text-h1-tablet` 64px tablet jump never fires in CE; `--text-h2-large`
was a redundant alias of `--text-h1-desktop`. Customer-2 protocol:
token cleanup pass at end of Step 2 removes Step-1 aspirational tokens
that haven't earned consumer references.

### 2.3 Weights

| Token | Value | Source |
|---|---|---|
| `--font-weight-regular` | `400` | body, p |
| `--font-weight-medium` | `500` | h1, h2, h3, h4, links, buttons |
| `--font-weight-semibold` | `600` | h5, h6 |

### 2.4 Line heights

| Token | Value | Source |
|---|---|---|
| `--leading-tight` | `1.07` | h1 (107% in CE source) |
| `--leading-snug` | `1.16` | h2 (computed 55.68/48 = 1.16) |
| `--leading-relaxed` | `1.20` | h4 (computed 28.8/24 = 1.20) |
| `--leading-default` | `1.50` | body, p, links (universal) |

**Note on `leading-default` vs `leading-normal`:** Tailwind v4 ships
`leading-normal: 1.5` by default. Defining `--leading-default: 1.5`
creates a parallel utility (`leading-default`) with the same resolved
value. Both classes render identically. **Components should prefer
`leading-default`** for source-attribution clarity — it's our token
extracted from CE measurement, not Tailwind's built-in default.

### 2.5 Component examples

```html
<!-- Post-DEV-13: prefer the <Heading> primitive over hand-rolled markup;
     these examples document the underlying utility cascade for reference. -->

<!-- generic h1: cascade jumps only at 992px (lg:) — no tablet step in CE -->
<h1 class="text-h1 lg:text-h1-desktop font-medium leading-snug">…</h1>

<!-- generic h2: 2-step cascade (32px mobile → 40px desktop at lg:/992) -->
<h2 class="text-h2 lg:text-h2-desktop font-medium leading-relaxed">…</h2>

<!-- display CTA (probe: "Ready to hire?" pattern, 5× across pages) -->
<h2 class="text-display-mobile md:text-display-tablet lg:text-display font-medium leading-snug">…</h2>

<!-- eyebrow / kicker — 18px, NOT uppercase, NOT tracked -->
<span class="text-eyebrow font-medium leading-default">Category</span>

<!-- body text inherits via globals.css; explicit override only if needed -->
<p>…</p>
```

The token suffix names self-document which CE breakpoint range each
value applies to: `-mobile` is the ≤767px range, `-tablet` is 768-991px,
`-desktop` is ≥992px. Component authors pick the matching
Tailwind prefix per the §2.2 "Use" column.

---

## 3. Spacing — Tailwind base-multiplier

`--spacing: 0.5rem` (8px). Tailwind v4 generates spacing utilities via
`calc(var(--spacing) * N)`. Examples:

| Tailwind utility | Resolved value | CE source / use |
|---|---|---|
| `p-1` | 8px | Tight gaps |
| `p-2` | 16px | Common gaps |
| `p-3` | 24px | Card padding-x, button padding-x |
| `p-4` | 32px | (inferred — not directly observed; standard 8×4) |
| `p-5` | 40px | Section internal padding |
| `p-10` | 80px | Section vertical padding |
| `p-20` | 160px | Hero outer rhythm |

**4px-granular spacing** (border widths, hairline rhythm) lives in
component CSS as literal px, **NOT on the scale.** Don't pollute the
scale with fractional values.

**60px off-grid value (CE `cta-tile` top padding):** handled via
Tailwind arbitrary value `pt-[3.75rem]` at the component level (not
tokenized). If a future audit surfaces 60px in ≥3 distinct components,
promote to a semantic token at that point.

**Step 2 primitive build will surface gaps.** If a primitive needs a
spacing value not in the standard scale, surface to Jake — propose
either an addition or a documented one-off at component level.

---

## 4. Radii

| Token | Value | px | Source / use |
|---|---|---|---|
| `--radius-xs` | `0.25rem` | 4 | Rare; observed once |
| `--radius-sm` | `0.75rem` | 12 | 4× across decorated elements |
| `--radius-md` | `1rem` | 16 | 9× — likely inputs, small cards |
| `--radius-lg` | `1.5rem` | 24 | 21× — default card radius (most common) |
| `--radius-xl` | `2.5rem` | 40 | 4× |
| `--radius-2xl` | `5rem` | 80 | 8× — large cards |
| `--radius-3xl` | `10rem` | 160 | 8× — hero/oversized shapes |
| `--radius-pill` | `9999px` | — | 15× — badges, full-pill elements |
| `--radius-circle` | `50%` | — | Avatars, dots |
| `--radius-button` | `var(--radius-pill)` | — | Alias — see tradeoff note |

### Button radius tradeoff note

CE source declares `.primary-button { border-radius: 80px }`. The CSS
spec caps `border-radius` at `min(width, height) / 2` — at typical
button heights (36-44px), the effective radius is **18-22px**, which
is visually identical to a full pill. Aliasing `--radius-button` to
`--radius-pill` (`9999px`) preserves the pill behavior across all
observed CE button sizes. The aliased value would only diverge from CE
source at buttons taller than ~80px (CE has none observed).

If a future component needs CE-source-faithful `80px` radius
specifically (e.g., a tall featured CTA), use `rounded-[5rem]`
Tailwind arbitrary value or introduce a new token at that time.

**Excluded (asymmetric, component-specific):** `0px 20px 20px 0px`,
`24px 24px 0px 0px`. Not tokenized; component-level CSS handles these.

---

## 5. Shadows

| Token | Value | Source |
|---|---|---|
| `--shadow-elevated` | `0px 2px 14px -5px rgba(0, 0, 0, 0.2)` | The only shadow CE uses; consistent across all 5 pages |

**CE has no other elevation tier.** Brief Step 1 reserved space for
`elevation-1` through `elevation-4` but Hard Rule #2 (no fabrication of
CE site facts) blocks defining values that aren't observed. Reserved
names but not values:

- `--shadow-base` / `--shadow-2` / `--shadow-3` / `--shadow-4`: undefined.

If Step 2 / Tier-1 component specs surface a real elevation need
(e.g., modal, dropdown), introduce the token then with explicit context.

---

## 6. Breakpoints — CE-tuned, Tailwind utility names

CE uses Webflow-standard breakpoints + a custom large-desktop break
at 1280px. Tailwind v4 defaults (640 / 768 / 1024 / 1280 / 1536) don't
match. Override `sm` and `lg` to align with CE's actual break points;
keep `md` and `xl` (already match):

| Token | Value | px | Tailwind default | CE source |
|---|---|---|---|---|
| `--breakpoint-sm` | `30rem` | 480 | 40rem (640) — overridden | Webflow mobile-portrait break (≤479) |
| `--breakpoint-md` | `48rem` | 768 | 48rem — match | Webflow tablet break |
| `--breakpoint-lg` | `62rem` | 992 | 64rem (1024) — overridden | Webflow desktop break |
| `--breakpoint-xl` | `80rem` | 1280 | 80rem — match | CE custom large-desktop break |

**Mobile-first / min-width semantics:** Tailwind v4 generates
`@media (min-width: …)` queries. So `lg:text-h1-desktop` applies at
≥992px (Webflow desktop range). Webflow's `max-width` queries
(`@media (max-width: 991px)`) translate to "no `lg:` prefix" in
mobile-first.

**Verification:** `grep -rn 'sm:|md:|lg:|xl:' site/src/` on
2026-05-04 returned zero hits — no existing components depended on the
default breakpoint values. Override is safe.

---

## 7. Motion (dual-consumer pattern — DEV-5)

GSAP runtime data + source-code cross-reference confirmed CE uses
**GSAP Standard ($0) plugins only** — Core, ScrollTrigger,
ScrollToPlugin. No Club GreenSock dependency (§12.3 RESOLVED). See
`audit-output/design-1/gsap-{home,about,technology}.json` and
`audit-output/ce-template-custom-code.json` for source provenance.

### 7.1 Source-of-truth (`--motion-*`) — read by GSAP via `getComputedStyle`

**Note:** `--motion-easing-*` tokens are deliberately outside the
Tailwind `--ease-*` namespace. They are the GSAP source-of-truth
values, not utility-class generators. Tailwind utility aliases
(`--ease-reveal`, etc.) live in §7.2.

| Token | Value | Source / use |
|---|---|---|
| `--motion-reveal-duration` | `500ms` | GSAP default (CE didn't specify; accepted default) |
| `--motion-reveal-stagger` | `100ms` | Universal in CE source (`stagger: 0.1`) |
| `--motion-reveal-y-offset` | `10%` | Universal (`yPercent: 10`) |
| `--motion-hero-duration` | `1500ms` | `.hero-img` scale-in (`duration: 1.5`) |
| `--motion-hero-scale-from` | `1.2` | `.hero-img` start scale (`scale: 1.2`) |
| `--motion-easing-reveal` | `cubic-bezier(0.165, 0.84, 0.44, 1)` | CSS approximation of GSAP `power2.out` |
| `--motion-easing-accordion` | `cubic-bezier(0.645, 0.045, 0.355, 1)` | CSS approximation of GSAP `power3.inOut` |

GSAP code reads these directly:
```typescript
const dur = parseFloat(getComputedStyle(document.documentElement)
  .getPropertyValue('--motion-reveal-duration')) / 1000;  // → 0.5
gsap.from(el, { duration: dur, ease: 'power2.out' });
```

**GSAP-name vs CSS-easing distinction:** the cubic-bezier values are
CSS approximations of GSAP's named eases. For GSAP-driven animations
(Tier-1 components), use GSAP's named eases directly (`power2.out`,
`power3.inOut`) — the source-faithful values. Use the cubic-bezier only
in CSS transitions where GSAP isn't involved.

### 7.2 Tailwind utility aliases (`--duration-*` / `--ease-*`)

These are `var()` aliases pointing at the source-of-truth values above.
Generated via Tailwind v4's namespace mapping → utility classes for
CSS transitions.

| Alias token | Resolves to | Tailwind utility |
|---|---|---|
| `--duration-reveal` | `var(--motion-reveal-duration)` | `duration-reveal` |
| `--duration-hero` | `var(--motion-hero-duration)` | `duration-hero` |
| `--ease-reveal` | `var(--motion-easing-reveal)` | `ease-reveal` |
| `--ease-accordion` | `var(--motion-easing-accordion)` | `ease-accordion` |

CSS transition consumer:
```html
<a class="transition duration-reveal ease-reveal hover:bg-brand-primary">…</a>
```

**Single source, two consumers, no drift.** Editing a `--motion-*`
value automatically propagates to the Tailwind utility via the alias
chain.

---

## 8. Aliases (Refinement B)

`@theme` self-aliasing pattern verified via Diagnostic 4 (Tailwind
v4.2.4). `var()` references inside `@theme` cascade through to utility
classes AND `:root` vars, producing a single source of truth.

| Alias token | Resolves to | Why |
|---|---|---|
| `--color-text-link` | `var(--color-brand-primary)` | Links match brand primary; renaming the brand color updates link color automatically |
| `--radius-button` | `var(--radius-pill)` | Button pill is the same as pill primitive; rename point of truth |
| `--font-base` | `var(--font-poppins)` | Sources from `next/font/google` variable on `<html>`; updating font in layout.tsx propagates here |
| `--duration-reveal` | `var(--motion-reveal-duration)` | Tailwind-side alias for GSAP timing source-of-truth |
| `--duration-hero` | `var(--motion-hero-duration)` | (same pattern) |
| `--ease-reveal` | `var(--motion-easing-reveal)` | (same pattern) |
| `--ease-accordion` | `var(--motion-easing-accordion)` | (same pattern) |

`--color-text-on-dark` was considered as an alias but is kept literal
(`#ffffff`) because CE's hero h1 uses `#f9f9f9` (rounding equivalent of
white on a dark bg), not a relationship to another color in the
palette.

---

## 9. Uncertainties

Items still flagged for verification or decision in subsequent steps:

1. **`--text-h2: 2rem` (mobile h2 base) is inferred,** not directly
   source-verified by Diagnostic 1 (which probed h1 mobile sizes
   specifically). Inferred from the responsive-cascade pattern observed
   in `.heading-style-h2 @≤767: 2rem`. Validate during Step 2 primitive
   build / Step 7 per-template reference docs.
2. **`p-4: 32px` is inferred,** not directly observed. Standard 8×4
   step on the `--spacing: 0.5rem` base; placeholder until a primitive
   needs it.
3. **Shadow elevation tiers 2-4** reserved by name but undefined.
   Step 2 / Tier-1 specs may surface real elevation needs.
4. **Material Symbols icon font** — deferred to Step 2 Icon primitive.
   `--font-icon` will be introduced then.
5. **Reduced-motion (`prefers-reduced-motion: reduce`)** handling not
   tokenized at Step 1. Tier-1 component specs (Step 3) require an
   explicit `prefers-reduced-motion` section per Hard Rule §7.A; tokens
   referenced by those reduced-motion paths can be added then.
   **Note:** Tailwind v4 ships `motion-safe:` and `motion-reduce:`
   responsive prefixes by default. Step 2 primitives can use these
   inline without requiring tokens. Token-side support (e.g.
   `--motion-reveal-duration-reduced`) is for Step 3+ when shared
   reduced-motion values are needed across multiple components.
6. **CSS easing approximations** (`--motion-easing-*`) are visually
   close but not byte-equivalent to GSAP's `power2.out` / `power3.inOut`.
   Acceptable for Decision D2 (functional + visual equivalence, not
   pixel-perfect parity); verify during Step 7 Tier-1 specs that the
   visual difference is below QA-1's diff threshold.
7. **Footer locale-switcher contrast (HALT 4 Gap 1 probe).** Most
   footer text on CE is properly contrasted (40 elements at `#ffffff`
   on `#223c6c` = 10.88:1 ✓ AA; 5 at `#f9f9f9` = 10.33:1 ✓; 5 at
   `#dff46e` lime = 8.96:1 ✓). However, two locale-switcher elements
   on every page fail WCAG:
   - `<a class="txt-link local-link w--current">` (active locale) —
     `#1c787c` on `#223c6c` = 2.09:1 (fails AA 4.5:1).
   - `<a class="txt-link local-link">` (inactive locale) — `#223c6c`
     on `#223c6c` = 1.00:1 (effectively invisible).
   These are likely intentional state styling (active = brand color,
   inactive = invisible-until-hover) but flagged for Step 7 footer
   template build: (a) preserve as-is for fidelity, (b) introduce
   `--color-text-on-navy: #ffffff` for the inactive state and a
   higher-contrast brand variant for the active state, or (c) raise
   with CE stakeholder before fix. Earlier "footer text = `#212121`
   on `#223c6c`" framing was inaccurate — that was the parent
   `<footer>`'s default color; text-bearing descendants override to
   white via `.cc-white` modifiers. The 4 `#212121` matches inside
   the footer scope are the lime "Book A Call" CTA's text on its
   own `#dff46e` bg — false negative on the contrast probe.
8. **Z-index tokens not yet defined.** Step 2's first overlay-class
   primitive (Nav fixed-positioning, Dropdown, or Modal) introduces
   the `--z-*` set. Proposed standard tiers (probe CE's existing
   z-index values before locking — CE may have specific stacking
   that needs alignment):
   - `--z-base: 0`
   - `--z-dropdown: 100`
   - `--z-sticky: 200`
   - `--z-fixed: 300`
   - `--z-modal-backdrop: 400`
   - `--z-modal: 500`
   - `--z-popover: 600`
   - `--z-toast: 700`
9. **Container max-width — variance documented, tokenization deferred
   to Step 2** (HALT 4 Gap 3 probe). CE has 4 distinct content widths
   across pages plus an outer-section outlier:

   | max-width | Pages observed | CE class | Use context |
   |---|---|---|---|
   | `1100px` | all 5 | `.container-1100px` | Body content / blog |
   | `1384px` | all 5 (most common) | `.container`, `.container.nav` | Default content + nav |
   | `1440px` | all 5 | `.container.cc-hero` | Hero sections |
   | `2400px` | home, about | `.section.cc-hero._90vh` | Outer section bound (effectively unbounded; treat as `max-w-none`) |
   | `1080px` | technology only | `.container.gap-20.mw-1080px` | Tech page one-off |
   | `90%` | all 5 | `.cta-wrapper-txt.lr.middle.mobiletb` | Responsive CTA wrapper |

   Step 2's Container primitive decides the tokenization strategy.
   Three plausible directions: (a) single `--container-max` at
   `1384px` (most common) + arbitrary values for the variants,
   (b) multi-tier (`--container-content: 1100px`,
   `--container-default: 1384px`, `--container-hero: 1440px`),
   (c) container queries instead of fixed widths.
10. **Scrollbar styling not tokenized at Step 1.** Step 2's first
    scroll-container component (likely Modal, Dropdown menu, or
    horizontal blog carousel) will probe CE's existing scrollbar
    styling and introduce `--scrollbar-*` tokens if needed.
11. **Focus-visible ring styling not tokenized at Step 1.**
    Accessibility-critical for Step 2 interactive primitives (Button,
    Input, Link, Select). Step 2's first interactive primitive will
    probe CE's existing focus styles and introduce `--ring-*` tokens
    (color, width, offset, optionally a focus-ring shadow). Likely
    shape:
    - `--ring-color: var(--color-brand-primary)`
    - `--ring-width: 2px`
    - `--ring-offset: 2px`

---

## 10. Customer-2 reusability

Per Brief §11 reusable primitives:

- **Token category structure** (Colors / Typography / Spacing / Radii /
  Shadows / Breakpoints / Motion sections): 100% reusable template.
  Customer-2 fills the values.
- **Naming conventions** (Tailwind v4 namespaces per §0; mobile-first
  scale with breakpoint-range-encoding suffixes — `-tablet` /
  `-desktop` for h1, `-desktop` / `-large` for h2 where `-large` is a
  role variant; `--motion-*` source-of-truth + `--duration-*` /
  `--ease-*` Tailwind aliases): reusable as starting point,
  customer-specific overrides expected.
- **Source attribution discipline** (every token cites the live-site
  selector + observed frequency + uncertainty flag): 100% reusable
  methodology.
- **Token extraction methodology** (Step 1 process): 100% reusable —
  Playwright + computed-style scan + `@media` parse + GSAP shim +
  source-CSS probe via stylesheet walk. The scripts live at
  `scripts/design/extract-design-tokens.mjs`,
  `scripts/design/extract-gsap-timings.ts`,
  `scripts/design/diagnostic-1-type-source.mjs`,
  `scripts/design/diagnostic-2-navy-contexts.mjs`. Plug in a new
  customer's URL set.
- **GSAP plugin tier classification pattern** (live-site script-tag
  inspection vs shim registration count): 100% reusable.
- **`@theme` self-aliasing pattern** (Diagnostic 4): 100% reusable —
  Tailwind v4 standard.
- **Tailwind v4 namespace verification probe** (DEV-5 lesson):
  customer-2 onboarding MUST run a multi-namespace probe before locking
  tokens, not just color aliasing. Test cases per namespace; verify
  utility generation in output.css.

---

## 11. STATIC-3 additions (chrome visual rebuild)

Tokens added at MYGRATR-STATIC-3 Step 1 to support the floating-pill
header + 3 mega-menus + Footer rebuild. Defined at the tail of
`@theme {…}` in `site/src/app/tokens.css` so existing DESIGN-1 tokens
keep their lock-date provenance.

| Token | Value | Provenance / context | Refinement gate |
|---|---|---|---|
| `--header-height` | `76px` | `audit-output/static-2/scroll-behavior.json` — measured live-site header height at 1440×900. Used by `body { padding-top: var(--header-height) }` in `globals.css` (desktop ≥ 992px) to reserve space + prevent CLS from the sticky pill. | Step 2 visual-review gate |
| `--header-height-mobile` | `64px` | Inherits STATIC-1 nav `h-16` mobile value; preserved for continuity. Applied to body `padding-top` below the 992px breakpoint. | Step 2 visual-review gate |
| `--color-dark-green` | `#0f2d24` | `docs/design/static-3-reference/mega-menu-resources.png` — Customer Story cards background. Estimated from screenshot; refined at Step 4 visual review against live site. | Step 4 visual-review gate |
| `--color-mint` | `#d8efe1` | `docs/design/static-3-reference/mega-menu-how-it-works.png` — How It Works bottom-panel pale-teal background. Estimated from screenshot; refined at Step 4. | Step 4 visual-review gate |
| `--color-outline-light-border` | `rgba(255, 255, 255, 0.3)` | Footer pill outline against navy (`--color-brand-tertiary`). WCAG-AA contrast verified at Step 5 axe-core gate. | Step 5 axe-core gate |
| `--color-outline-light-text` | `var(--color-text-on-dark)` (alias) | Footer pill text on dark backgrounds; reuses existing white-on-dark text token. | n/a (alias) |
| `--color-pill-gradient-start` | `#5b3aa8` | `docs/design/static-3-reference/mega-menu-services.png` — AI Services pill gradient start. Inline-applied via `linear-gradient(135deg, ...)` style on `<MegaMenuPillLabel variant="pill-gradient">`. | Step 3 visual-review gate |
| `--color-pill-gradient-end` | `#a259ca` | Same — gradient end. | Step 3 visual-review gate |

### Consumer surfaces

- `--header-height` / `--header-height-mobile` → `globals.css` body
  padding-top (CLS reservation).
- `--color-dark-green` → Customer Story card background in
  `<ResourcesMegaMenu>` (Step 4).
- `--color-mint` → How It Works bottom-panel background (Step 4).
- `--color-outline-light-*` → `pill-outline-light` variant in
  `<MegaMenuPillLabel>` primitive (Step 1) + Footer surface (Step 5).
- `--color-pill-gradient-*` → `pill-gradient` variant in
  `<MegaMenuPillLabel>` primitive via inline style; pattern: gradient
  stops are token-driven via runtime `var()`, not hardcoded into the
  CVA class string.

### Notes on estimated values

`--color-dark-green`, `--color-mint`, `--color-pill-gradient-*` are
visually estimated from the reference screenshots and locked in code
as initial values. Each step's visual-review gate is the redirect
point: Jake confirms the exact hex via live-site eyedropper or
redirects to a refined value. The token names are stable; only the
hex values may shift.

---

## Changelog

- **v1.1 (2026-05-17):** STATIC-3 additions — `--header-height`,
  `--header-height-mobile`, `--color-dark-green`, `--color-mint`,
  `--color-outline-light-{border,text}`, `--color-pill-gradient-{start,end}`.
  Locked at MYGRATR-STATIC-3 Step 1 substrate; estimated values
  refined per per-step visual-review gates.
- **v1.0 (2026-05-04):** Initial token set. Locked at MYGRATR-DESIGN-1
  Step 1 close. Source: `audit-output/design-1/styles-*.json` +
  `gsap-*.json` + `diagnostic-{1,2,4}.json`. Namespaces corrected per
  DEV-5 (Tailwind v4 utility-generation requires specific prefixes;
  `--text-*` not `--font-size-*`, etc.).

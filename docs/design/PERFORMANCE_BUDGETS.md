# Performance Budgets — Mygratr / Cloud Employee

> Locked targets for QA-1 to verify against. All measurements gzipped
> on the wire (what users actually download).

**Status:** MYGRATR-DESIGN-1 DEV-6 — locked 2026-05-05.

---

## Targets

### Core Web Vitals

- **LCP** (Largest Contentful Paint): < 2.5s
- **INP** (Interaction to Next Paint): < 200ms
- **CLS** (Cumulative Layout Shift): < 0.1

### Bundle weight

- **JS per route**: < 180 KB gzipped (Next.js per-page bundle, excluding
  third-party).
- **Total third-party script weight**: < **320 KB gzipped**.

### Image policy

- All CMS images via `next/image` with explicit `width` / `height`
  (prevents CLS).
- AVIF + WebP via Next.js defaults.
- Sanity images use `urlFor(...)` from the project's image helper to
  serve correctly-sized variants per breakpoint.

### Third-party loading strategy

- `next/script strategy="afterInteractive"`:
  GTM, GA4, LinkedIn Insight Tag, Vector Tag, Ahrefs Analytics,
  HubSpot Tracking, GeoTargetly.
- `next/script strategy="lazyOnload"`:
  Hotjar, Clara Chat Widget, Calendly Widget.
- **GSAP**: imported per-component via npm (bundled into app code,
  removed from third-party fetch). Deferred until after hydration.
- **Swiper**: imported per-component via npm (bundled).
- **Finsweet Attributes**: dropped — Webflow-specific helper; not
  needed in Next.js stack.

### Font loading

- `next/font/google` with `display: 'swap'` (already implemented via
  DEV-4 Poppins swap in `site/src/app/layout.tsx`).

### Layout shift discipline

- No layout shift from late-loading animations. Cross-reference
  F12 v1.5 GSAP shim caveat (Tier-1 specs must reserve space for
  animated elements via initial CSS sizing — animation modulates
  visual properties, not layout).

---

## Baseline measurement (2026-05-05)

Source: `scripts/design/measure-third-party-weight.mjs`. Output:
`audit-output/design-1/third-party-weight.json`.

**Current third-party weight: 404.37 KB gzipped.**

| Script | KB | Treatment per loading-strategy section |
|---|---|---|
| Google Tag Manager | 117.99 | afterInteractive (retain) |
| Facebook Pixel | 96.94 | afterInteractive (retain) |
| Vector Tag | 58.20 | afterInteractive (retain — business-critical lead-gen, see below) |
| Swiper.js | 42.99 | bundle via npm → frees from third-party |
| GSAP core | 28.41 | bundle via npm → frees |
| GSAP ScrollTrigger | 17.59 | bundle via npm → frees |
| Clara Chat Widget | 14.88 | lazyOnload (retain) |
| Cloudflare Insights | 10.53 | retain (Cloudflare-injected; out of our control) |
| Hotjar | 5.76 | lazyOnload (retain) |
| Calendly Widget | 3.97 | lazyOnload (retain) |
| Ahrefs Analytics | 2.63 | afterInteractive (retain) |
| GSAP ScrollToPlugin | 1.97 | bundle via npm → frees |
| Finsweet Attributes | 1.35 | drop entirely (Webflow-specific) |
| HubSpot Tracking | 0.65 | afterInteractive (retain) |
| GeoTargetly | 0.38 | afterInteractive (retain) |
| GA4 entry | 0.13 | afterInteractive (retain) |
| **Subtotal removable by Step 8 wiring** | **~92 KB** | (GSAP family + Swiper + Finsweet) |
| **Post-bundle baseline** | **~312 KB** | |
| **Locked target** | **320 KB** | (+8 KB cushion for incidental drift) |

### Improvement narrative

**21% reduction**: 404 KB → 320 KB. Achievable without CE stakeholder
involvement. Step 8 (Visual Editing infrastructure / template wiring)
implements the GSAP / Swiper bundling and Finsweet drop.

### Vector Tag retained — business rationale

Vector.co is CE's active lead-gen / prospect-identification tool.
Pipes inbound site visitor data (name, email, LinkedIn, company,
page visited, UTM source) into a dedicated Slack channel
(`#icp-vector`). Sales / business-dev act on these leads.
Live, revenue-relevant. **Retained on confirmation 2026-05-05.**

### Review trigger — baseline drift

Step 8 wiring frees ~92 KB by bundling GSAP family + Swiper via npm
and dropping Finsweet. Post-Step-8 baseline projected at ~312 KB,
leaving 8 KB headroom against the 320 KB target. This is intentionally
tight to maintain the 21% improvement narrative.

**IF** post-Step-8 measurement shows baseline > 312 KB, raise budget
to **340 KB (16% improvement)** and document the baseline drift in
`CHANGELOG.md`. Do NOT silently exceed 320 KB. The budget is a
contract, not an aspiration.

---

## QA-1 verification

QA-1 phase verifies all targets against the production deployment:

1. Lighthouse / PageSpeed Insights runs at 25th-percentile mobile +
   desktop simulated network across 5 representative pages
   (home, blog index, blog post, technology grid, customer story).
2. WebPageTest production runs to validate CWV under real-world
   conditions.
3. Bundle analyzer (e.g. `@next/bundle-analyzer`) for JS-per-route
   verification.
4. `scripts/design/measure-third-party-weight.mjs` re-run against
   production deployment to verify ≤ 320 KB; diff against the 2026-05-05
   baseline surfaces any drift.

Failures → halt LAUNCH cutover; remediate before redirect parity check.

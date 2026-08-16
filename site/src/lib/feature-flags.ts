// Build-time switches for work that is finished but not trusted yet.
//
// These are deliberately NOT part of `@/lib/env`. That module validates
// server-only vars at import time, so pulling it into a client component
// breaks the browser bundle (Tech Debt #22). A flag has to be readable from
// both sides, so it lives here on its own with no dependencies.

/**
 * CE-67. Whether to render the two UNVERIFIED cost calculators.
 *
 * The site carries three separate cost models and only one of them has ever
 * been checked against what CE actually charges:
 *
 *   - `lib/calculators/next-hire.ts` (home + Hire Engineers) was copied
 *     verbatim out of a `<script>` tag in a Figma export. Nobody has confirmed
 *     a single number in it.
 *   - `components/templates/location/calculator.tsx` (the three location
 *     pages) applies region multipliers from the same unverified source.
 *   - `lib/calculators/hiring-cost.ts` (/pricing and /hiring-cost-calculator)
 *     is CE's real model, verified exact across 900 figures. It is NOT gated
 *     by this flag and must never be.
 *
 * Seb reported the homepage figures as wrong (CE-67, high priority). Jake's
 * instruction was to hide rather than delete, because the layout is fine and
 * the models can be corrected later.
 *
 * DEFAULT IS OFF, and that is the whole point. An unset variable has to mean
 * "the wrong numbers are not on the site", otherwise the fix for a live
 * inaccuracy would sit dormant behind a deploy step nobody remembers to take.
 * Set the var to `true` once the models are verified, and the sections come
 * back exactly as they were.
 *
 * NEXT_PUBLIC_ because `hire-engineers/index.tsx` is a client component. Next
 * inlines the literal at build time and drops the dead branch, so with the
 * flag off the calculator markup is not merely hidden with CSS: it never
 * reaches the browser and there is nothing for a crawler to find.
 */
export const SHOW_UNVERIFIED_CALCULATORS =
  process.env.NEXT_PUBLIC_SHOW_UNVERIFIED_CALCULATORS === 'true'

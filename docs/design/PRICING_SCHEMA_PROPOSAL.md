# Pricing Page — Schema Design Proposal (DRAFT)

> **Status: PROPOSAL / planning artifact only.** No schema files, no migrations,
> no build. This is the design to reach for when the `/pricing` page gets built
> in a future TEMPLATE-* / D3 session. Nothing here touches the live Sanity
> dataset.
>
> **Basis:** redesign screenshot (`docs/re-design/screenshots/marketing/pricing__desktop.png`)
> + existing schema patterns (`studio/schemas/_shared.ts`, `singletons/_factories.ts`,
> `objects/section.ts`, `objects/faq-item.ts`).
>
> **No-fabrication note (per 20-probes):** the exact row labels, dollar figures,
> and FAQ wording below are *illustrative placeholders read off the redesign
> screenshot thumbnail*. They show the SHAPE the schema must hold. The real
> labels/values get confirmed against the live page (and Seb) at build time. The
> schema design does not depend on the exact numbers.

---

## 0. The merge decision (record this)

The old standalone **price comparison calculator merges INTO `/pricing`.** This
is already locked by the redirects:

```
/tools/price-comparison-calculator(.*)  ->  /pricing   (301, permanent)
/uk/tools/price-comparison-calculator   ->  (redirected)
```

Consequences for schema:

- The `priceComparisonCalculatorPage` singleton (currently
  `studio/schemas/singletons/price-comparison-calculator-page.ts`, built on the
  `defineCalculatorPage` §5 factory) is **superseded.** Its job — wrap marketing
  copy around a hardcoded calculator — folds into the new `pricingPage`
  singleton.
- The separate `hiringCostCalculatorPage` singleton is a *different* tool
  (`/hiring-cost-calculator`, no redirect into `/pricing`) and is **out of scope
  here.** Do not touch it.
- At build, the old `priceComparisonCalculatorPage` singleton should be retired
  (deprecate, then remove in a later schema-cleanup phase — same discipline as
  the STATIC-2 legacy-field handling). Don't delete it in the same step that
  introduces `pricingPage`.

---

## 1. The one architecture decision this proposal makes

**Question:** are the numbers in the two comparison tables (salaries, taxes,
benefit costs) *CMS-editable rows* or *hardcoded calculation output*?

**Recommendation: hybrid.** The numeric engine (how a region + currency +
developer-count + seniority turn into a price range and a per-row dollar figure)
lives **hardcoded in Next.js**, exactly like the old calculator did
(`defineCalculatorPage` is described in-schema as *"calculator logic is hardcoded
in Next.js (§5)"*). Sanity owns the **shell**: hero copy, the table row *labels*
and *which rows exist*, the marketing blocks, the disclaimer, and the FAQ.

*One-line tradeoff:* hardcoding the math keeps regional salary/tax data in one
typed, testable config file instead of scattered across editable CMS fields
(where a fat-finger silently breaks every quoted price); the cost is Seb cannot
re-tune the salary tables from Studio — that's a code change. For a
numbers-must-be-right pricing page, that's the safer default.

This means the table-row schemas below carry **labels and structure, not the live
dollar amounts.** The amounts are rendered by the calculator engine keyed off the
row's stable `key`. (If Seb later needs to edit raw figures from Studio, a
follow-up phase can promote the engine's config into a CMS `pricingData`
singleton — noted as a parked option, not built now.)

---

## 2. Page anatomy (from the redesign screenshot)

Top to bottom on the desktop redesign:

1. **Hero** — eyebrow "Pricing", H1 "World-class `Senior` engineers at a fair
   price" (one word lime-highlighted), short supporting line.
2. **Seniority / role selector pills** — Junior / Mid / Senior (drives the
   calculator).
3. **Two headline price cards** — "Hiring with Cloud Employee" (a range, e.g.
   `$4,000 - $6,000 /mo`) vs "Hiring in `United States`" (a range, e.g.
   `$13,079 - $25,461 /mo`). The comparison region is selectable.
4. **Calculator input panel** — "What are you looking for?" (developers / region
   / currency, plus the seniority pills above).
5. **Comparison Table 1 — Employment cost breakdown** (2 value columns).
6. **Comparison Table 2 — Additional benefits** (2 value columns).
7. **Currency disclaimer line** — "One fixed monthly fee in your currency. No
   hourly rates. No variable invoices. No surprises." + a CTA.
8. **"Hire with confidence" block** — feature pills + star rating.
9. **"Trusted by founders and tech leaders"** — testimonials with video cards.
10. **FAQs** — accordion.
11. **"Ready to hire your next engineer?" CTA band.**
12. (Global footer — not part of this schema.)

---

## 3. Proposed schema: `pricingPage` singleton

A new singleton document type, `pricingPage`, route `/pricing`. It does **not**
fit `defineStaticPage` (the 12 generic section types can't express the calculator
or the comparison tables), so it gets a bespoke shape — but it reuses the shared
field helpers (`metaFields`, `imageField`, `localeField`) for consistency.

Pseudo-schema (drop-in reference for build, NOT a file to create now):

```ts
// studio/schemas/singletons/pricing-page.ts  (FUTURE — do not create yet)
defineType({
  name: 'pricingPage',
  title: 'Pricing Page',
  type: 'document',
  description: 'Singleton for /pricing. Absorbs the retired price-comparison-calculator. Calculator math is hardcoded in Next.js; this holds shell copy + table structure.',
  fields: [
    // --- HERO ---
    { name: 'eyebrow',           type: 'string' },                 // "Pricing"
    { name: 'title',             type: 'string', required, max 200 }, // "World-class Senior engineers at a fair price"
    { name: 'titleHighlight',    type: 'string' },                 // the word rendered in lime, e.g. "Senior"
    { name: 'heroDescription',   type: 'portableText' },

    // --- CALCULATOR CONFIG (see §4) ---
    { name: 'calculator',        type: 'pricingCalculatorConfig' },

    // --- TWO COMPARISON TABLES (see §5) ---
    { name: 'costBreakdownTable', type: 'pricingComparisonTable' },  // "Employment cost breakdown"
    { name: 'benefitsTable',      type: 'pricingComparisonTable' },  // "Additional benefits"

    // --- DISCLAIMER + INLINE CTA ---
    { name: 'currencyDisclaimer', type: 'text' },                    // "One fixed monthly fee..."
    { name: 'disclaimerCta',      type: 'ctaLink' },                 // label + href (reuse pattern)

    // --- MARKETING BLOCKS (see §6) ---
    { name: 'confidenceBlock',    type: 'pricingConfidenceBlock' },  // "Hire with confidence"
    { name: 'testimonials',       type: 'array', of: [reference -> review], max 3 }, // "Trusted by founders..."
    { name: 'closingCta',         type: 'ctaSection' },              // reuse existing ctaSection object

    // --- FAQ ---
    { name: 'faqHeading',         type: 'string' },                  // "FAQs"
    { name: 'faqs',               type: 'array', of: [faqItem], max 12 }, // reuse existing faqItem

    // --- SEO + locale (shared helpers) ---
    ...metaFields(),
    localeField(),
  ],
})
```

### Why a singleton (not a document)
There is exactly one `/pricing` page per locale. That's the singleton pattern
every other marketing page uses (`homePage`, `aboutUsPage`, the calculator
pages). The `localeField()` handles US-default vs `/uk/` the same way the rest of
the site does.

---

## 4. Calculator config + price-range logic

### 4a. The inputs (CMS holds the *option lists*, engine holds the *math*)

New object type `pricingCalculatorConfig`:

```ts
defineType({
  name: 'pricingCalculatorConfig',
  type: 'object',
  fields: [
    { name: 'heading', type: 'string' },          // "What are you looking for?"

    // Developer count — a slider/stepper. CMS sets bounds + default.
    { name: 'developersMin',     type: 'number', initialValue: 1 },
    { name: 'developersMax',     type: 'number', initialValue: 50 },
    { name: 'developersDefault', type: 'number', initialValue: 1 },

    // Seniority pills (Junior / Mid / Senior). CMS sets labels + default.
    { name: 'seniorityLevels', type: 'array', of: [{
        type: 'object',
        fields: [
          { name: 'key',   type: 'string' },   // stable: 'junior' | 'mid' | 'senior'
          { name: 'label', type: 'string' },   // display: "Senior"
        ],
    }]},
    { name: 'seniorityDefault', type: 'string' }, // 'senior'

    // Comparison region (US / UK / etc). CMS sets the label; engine holds the data.
    { name: 'regions', type: 'array', of: [{
        type: 'object',
        fields: [
          { name: 'key',   type: 'string' },   // stable: 'us' | 'uk' | 'eu' ...
          { name: 'label', type: 'string' },   // "United States"
        ],
    }]},
    { name: 'regionDefault', type: 'string' },    // 'us'

    // Currency selector. CMS sets the displayed options.
    { name: 'currencies', type: 'array', of: [{
        type: 'object',
        fields: [
          { name: 'code',   type: 'string' },  // 'USD' | 'GBP' | 'EUR' ...
          { name: 'symbol', type: 'string' },  // '$' | '£' | '€'
          { name: 'label',  type: 'string' },  // "US Dollar (USD)"
        ],
    }]},
    { name: 'currencyDefault', type: 'string' },  // 'USD'

    // Labels for the two headline cards (values come from the engine).
    { name: 'ceCardLabel',         type: 'string' }, // "Hiring with Cloud Employee"
    { name: 'comparisonCardLabel', type: 'string' }, // "Hiring in {region}"
  ],
})
```

### 4b. The price-range logic (hardcoded in Next.js — described, not built)

The engine is a typed config + a pure function. Pseudocode:

```
priceRange(input) where input = { developers, region, seniority, currency }:

  1. Look up Cloud Employee monthly rate band for { seniority }:
       ceLow, ceHigh   (per developer, in base currency USD)
  2. Look up the comparison region's fully-loaded monthly cost for { seniority, region }:
       regionLow, regionHigh  (per developer — base salary + the cost-breakdown rows)
  3. Multiply both bands by `developers`.
  4. Convert from USD to the chosen `currency` via a static FX table.
  5. Round for display.
  6. Return:
       ceMonthly       = { low, high }       -> CE headline card
       comparisonMonthly = { low, high }     -> comparison headline card
       costRows[]      = per-row { ceValue, comparisonValue }  -> Table 1
       benefitRows[]   = per-row { ceValue, comparisonValue }  -> Table 2
```

Key points:
- **All salary/tax/benefit source data and FX rates live in one typed file** in
  `site/src/lib/pricing/` (e.g. `pricing-data.ts`), not in Sanity. This matches
  the §5 "logic hardcoded" precedent and keeps the numbers testable.
- Each comparison-table row in Sanity has a **stable `key`** (e.g.
  `annual-salary`, `social-security`). The engine maps `key -> computed value per
  column`. So Sanity controls *which rows show and what they're called*; the
  engine controls *the dollar figures*.
- Currency conversion is display-only; the canonical numbers are USD.

---

## 5. The two comparison tables (shared shape)

Both tables are the same shape, so they share one object type
`pricingComparisonTable`. Each has a heading, an ordered list of **column
definitions**, and an ordered list of **rows**, where every row carries one value
*per column*.

```ts
defineType({
  name: 'pricingComparisonTable',
  type: 'object',
  fields: [
    { name: 'heading', type: 'string' },   // "Employment cost breakdown" / "Additional benefits"

    // COLUMN HEADERS — the two value columns (CE vs comparison region).
    { name: 'columns', type: 'array', max 3, of: [{
        type: 'object',
        fields: [
          { name: 'key',         type: 'string' },  // 'cloudEmployee' | 'comparison'
          { name: 'headerLabel', type: 'string' },  // "Cloud Employee" | "In USA" (or {region})
          { name: 'highlighted', type: 'boolean' }, // CE column visually emphasised
        ],
    }]},

    // ROWS — label + how each column's value is produced.
    { name: 'rows', type: 'array', of: [{
        type: 'object',
        fields: [
          { name: 'key',      type: 'string' },  // stable engine key, e.g. 'annual-salary'
          { name: 'label',    type: 'string' },  // row label shown on the left
          { name: 'tooltip',  type: 'string' },  // optional "?" explainer

          // valueMode decides where each column's cell value comes from:
          //   'computed' -> rendered by the calculator engine (keyed off `key`)
          //   'static'   -> editorial value typed here (for non-numeric rows)
          { name: 'valueMode', type: 'string', options: ['computed','static'] },

          // Only used when valueMode = 'static' (e.g. checkmark / "Included" / text).
          // One entry per column, matched to columns[].key.
          { name: 'staticValues', type: 'array', of: [{
              type: 'object',
              fields: [
                { name: 'columnKey', type: 'string' },  // matches columns[].key
                { name: 'kind',      type: 'string', options: ['check','cross','text'] },
                { name: 'text',      type: 'string' },  // when kind = 'text'
              ],
          }]},
        ],
    }]},
  ],
})
```

### Table 1 — "Employment cost breakdown" (illustrative rows, `valueMode: 'computed'`)
| Row label (illustrative) | `key` (stable) | Cloud Employee col | Comparison col |
|---|---|---|---|
| Annual salary | `annual-salary` | computed | computed |
| Social security / payroll tax | `payroll-tax` | computed | computed |
| Healthcare / health insurance | `healthcare` | computed | computed |
| Federal unemployment tax | `unemployment-tax` | computed | computed |
| Equipment + software | `equipment` | computed | computed |
| Recruitment / onboarding | `recruitment` | computed | computed |
| **Total monthly cost** | `total` | computed | computed |

### Table 2 — "Additional benefits" (illustrative rows, mostly `valueMode: 'static'`)
| Row label (illustrative) | `key` | Cloud Employee col | Comparison col |
|---|---|---|---|
| Dedicated account manager | `account-manager` | check | cross |
| Replacement guarantee | `replacement` | check | cross |
| No long-term contract | `no-lock-in` | check | cross |
| Office space + equipment provided | `office` | check | cross |
| HR + payroll handled | `hr-payroll` | check | cross |

> Exact rows, labels, and which are computed vs static get confirmed against the
> live page at build. The shape above covers both cases without change.

---

## 6. Marketing blocks

### 6a. "Hire with confidence" — `pricingConfidenceBlock` (new object)
```ts
defineType({
  name: 'pricingConfidenceBlock',
  type: 'object',
  fields: [
    { name: 'heading', type: 'string' },           // "Hire with confidence."
    { name: 'features', type: 'array', of: [{      // the pill row
        type: 'object',
        fields: [
          { name: 'label', type: 'string' },        // "No upfront fees", "60-day...", etc.
          { name: 'icon',  type: 'string' },         // optional icon key (reuse Icon system)
        ],
    }], max 8 },
    { name: 'ratingValue', type: 'number' },         // e.g. 4.9
    { name: 'ratingLabel', type: 'string' },         // "Rated 4.9/5 on..."
  ],
})
```

### 6b. "Trusted by founders and tech leaders" — testimonials
Reuse existing infrastructure: an `array` of `reference -> review` (the same
pattern as `testimonialSection` in `objects/section.ts`). Video cards come from
the referenced `review` / `video` docs. No new type needed beyond a heading
string on the `pricingPage`.

### 6c. "Ready to hire your next engineer?" — closing CTA
Reuse the existing **`ctaSection`** object type as-is (`heading`, `description`,
`buttonText`, `buttonLink`). No new type.

### 6d. Inline disclaimer CTA
Small `ctaLink`-style object (`label` + `href`) under the currency disclaimer.
Can reuse a minimal CTA object or inline two string fields.

---

## 7. FAQ

Reuse the existing **`faqItem`** object (`question: string`, `answer:
portableText`) — identical to how `faqSection` and `defineCalculatorPage` already
do it. On `pricingPage`: `faqHeading: string` + `faqs: array[faqItem]` (max 12).
No new FAQ type.

---

## 8. Reuse vs new (summary)

| Piece | Decision |
|---|---|
| `pricingPage` singleton | **NEW** (bespoke; doesn't fit `defineStaticPage`) |
| `pricingCalculatorConfig` object | **NEW** |
| `pricingComparisonTable` object | **NEW** (shared by both tables) |
| `pricingConfidenceBlock` object | **NEW** |
| `metaFields()`, `imageField()`, `localeField()` | **REUSE** (`_shared.ts`) |
| `ctaSection` (closing CTA) | **REUSE** (`objects/section.ts`) |
| testimonials (`reference -> review`) | **REUSE** pattern |
| `faqItem` | **REUSE** (`objects/faq-item.ts`) |
| Calculator math + salary/tax/FX data | **HARDCODED** in `site/src/lib/pricing/` (Next.js), per §5 precedent |
| `priceComparisonCalculatorPage` singleton | **RETIRE** (superseded by merge) |
| `hiringCostCalculatorPage` singleton | **LEAVE ALONE** (different tool, out of scope) |

---

## 9. Open decisions to settle at build time (not now)

1. **Comparison regions:** which regions besides US does the calculator support
   (UK? EU? "in-house local"?) — confirm against the live calculator + Seb.
2. **Seniority granularity:** Junior/Mid/Senior only, or more bands?
3. **Currency list + FX source:** static FX table (simple, drifts) vs a live FX
   fetch (accurate, adds a dependency). Recommend static, refreshed per release.
4. **Exact cost-breakdown rows + figures:** read off the live page / Seb at
   build; the schema doesn't change with them.
5. **Should raw salary/tax data ever be Studio-editable?** Parked. If yes, promote
   the engine config into a `pricingData` singleton in a later phase.
6. **`migrations.status`** stays `content_complete` — building `/pricing` is
   template work, not a state transition.

---

*Last updated: Jun 2026 — initial DRAFT. Planning artifact for the future
`/pricing` build. No schema, no migration, no data touched.*

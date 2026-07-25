# CAPABILITY_LOG.md — Mygratr

> Tracks what Jake learns per phase — frameworks, patterns, debugging
> approaches. This is the productisation IP. Customer-2+ migrations
> should reference this to bypass first-principles work.
>
> Voice: retrospective and pedagogical. Each entry follows the form
> "the load-bearing finding from {context} was that {insight}; this
> informs customer-2 {capability} phases by {actionable take-away}."
>
> Maintained per phase. Append-only.

---

## STATIC-2 — Chrome schema extensions + reseed (May 2026)

### Pattern 1 — Playwright + tsx `__name` shim

The load-bearing finding from running tsx-transpiled Playwright scripts that use `page.evaluate(() => {...})` was that tsx/esbuild's keep-names transpilation injects `__name(fn, "name")` wrappers around named arrow constants AND named function declarations. Those wrappers travel with `fn.toString()` into the browser context where Playwright ships the evaluate callback. The browser has no `__name` global → `ReferenceError: __name is not defined` on first execution.

The durable fix is a one-line no-op shim registered on the BrowserContext via `addInitScript` BEFORE any page is created:

```ts
const context = await browser.newContext({...})
await context.addInitScript(() => {
  ;(window as unknown as { __name: (fn: unknown) => unknown }).__name = (fn) => fn
})
const page = await context.newPage()
```

The shim runs on every navigation in every page within the context. Covers every `page.evaluate` callback without requiring per-callsite refactoring (e.g., avoiding named arrow consts). Lower-friction than the alternatives:
- Option 1 (inline-only style) — fragile discipline; one new named arrow brings the bug back
- Option 2 (force tsx to skip name-keeping) — env vars unstable across tsx versions
- Option 4 (`page.evaluate(string, args)` instead of fn) — loses TypeScript type-checking on the callback

**Customer-2 take-away:** any Playwright-based audit script transpiled via tsx (or esbuild keep-names mode) should mount the shim on the context as the first init script. Pattern is in `scripts/audit/static-2/extract-chrome.ts` `launchBrowser()` for reference.

### Pattern 2 — Plan-mode requires DOM-level confirmation for image-related work

The load-bearing finding from STATIC-2's DELTA-1 dropped-mid-phase was that brief authoring inferred service-mega-menu icon presence from a reference screenshot's visual treatment, but the live DOM showed pure text divs — no icons. The brief scoped a `service.thumbnail` backfill premised on assets that didn't exist. Step 1 audit's 5-strategy icon extraction returned `iconSource: null` for all 13 service items; reference screenshot re-inspection confirmed text-only. DELTA-1 dropped from scope at v1.1 brief revision.

The pattern: when a brief includes image-related scope (icon backfill, hero photo upload, asset migration), the brief assumption MUST be confirmed via a DOM-level probe at plan-mode entry, not from screenshot visual inference. Screenshots show rendered output but not source structure — icons may be CSS pseudo-elements, font glyphs, background-images, or simply absent under that visual treatment.

**Customer-2 take-away:** any phase brief that scopes asset uploads / image backfills must have a Step 0 plan-mode item: "DOM-probe the relevant page surface; confirm asset presence and discoverable shape before locking scope." Pattern artifacts: `panel-shape-probe.json` + `<phase>-brief-deltas.json` for the audit trail.

### Pattern 3 — Discriminated icon shape (`material-font | asset`) for editorial flexibility

The load-bearing finding from STATIC-2's Resources mega-menu left-column icons was that the live CE site uses Material Icons font ligatures (4 of 4 icons via `<div class="md-icon circle">download</div>` pattern), but Customer-2 might use uploaded assets, AND Seb may want to toggle between them per item without a schema change. Modeling as a single object with a discriminated `source` enum + conditional `Rule.custom()` validation gave us schema-side flexibility:

```ts
icon: {
  source: 'material-font' | 'asset' | undefined,
  name: string | null,    // ligature when source = 'material-font'
  asset: image | null,    // upload when source = 'asset'
  alt: string | null,
}
Rule.custom((value) => {
  if (value?.source === 'material-font' && !value?.name?.trim()) return 'name required'
  if (value?.source === 'asset' && (!value?.asset || !value?.alt?.trim())) return 'asset + alt required'
  return true
})
```

Caller (STATIC-3 render) reads `source` to pick the rendering branch. No schema migration needed when Seb edits an icon — just toggle `source` in Studio. Sanity has no native tagged-union support; this pattern is the workable substitute.

**Customer-2 take-away:** for any chrome surface that mixes asset-sourced and font/icon-glyph rendering, model the schema as a single discriminated object + `Rule.custom()`. Sanity Studio's enum-driven UX shows only the relevant subfield based on `source` selection (with `hidden:` callbacks if desired). Skip the multi-table / multi-document approaches; the single-object pattern is the lowest-friction.

### Pattern 4 — Audit-driven brief refinement (probe → defer → reconcile)

The load-bearing finding from STATIC-2's brief execution was that the brief made 4 wrong assumptions (DELTA-A, B, C, D) that only surfaced after the Step 1 audit ran. Trying to update the brief mid-execution would have blocked code work; trying to rigidly follow the brief would have produced wrong data.

The pattern adopted:

1. Run an audit/probe at plan-mode entry. Save raw output as JSON artifacts under `audit-output/<phase>/` (gitignored — fresh per-phase, not part of source).
2. When the probe surfaces brief-vs-reality findings, write them to `<phase>-brief-deltas.json` (also gitignored — documentary trail).
3. Continue executing against the probe truth, NOT the brief assumption. Cite the delta in code comments where the divergence matters (`// DELTA-X: live site uses X not Y per audit; brief outdated`).
4. At phase close: update the brief to v1.N, reconciling the §4 file list + spec sections against actuals. Note the revision history at the top of the brief.
5. Document the discipline in CHANGELOG + PHASE_HISTORY post-phase entries.

STATIC-2 went through v1 → v1.1 (DELTA-B applied mid-phase after Step 1) → v1.2 (phase-close reconciliation across all 4 deltas + actuals reconciliation on the file lists). Pattern preserves brief integrity (always up-to-date when archived) without blocking code execution (deltas accepted mid-flight without rewriting the brief).

**Customer-2 take-away:** for any phase with non-trivial scope-from-screenshots / scope-from-prior-audit assumptions, plan for v1 → v1.N brief refinement at phase close. The audit-output JSON deltas file is the canonical record; the brief revisions are the cleaned-up retrospective. Don't pause execution to fix a brief mid-phase.

---

## DESIGN-1 — Design tokens, primitives, complex specs, Visual Editing, fidelity guarantees (May 2026)

**Phase status as of this entry:** Step 0 (pre-flight + sub-steps) complete; Step 1 (design tokens) complete; pre-Step-2 DEV-6/DEV-7 cycle complete; Step 2 (22 primitives + Icon) complete with HALT 10 visual eyeball confirmed and one corrective patch landed (commit `4c0514f` — A5 Accordion plus/× icon pattern restored); **Step 3 (Tier-1 audit + 5 complex-component specs) complete (commits `e54b818..c895033`); 4 HALTs landed clean.** Steps 4 (Storybook decision + scaffold), 5 (v0.dev prompt template), 6 (fidelity guarantees), 7 (per-template reference docs), 8 (Visual Editing wiring), 9 (capability-log finalisation), 10 (verifier), 11 (final phase close) **PENDING**. This entry is a Step-3-milestone partial extension on the Step-2 baseline; will be extended in place as Steps 4+ land.

---

### Token system architecture (Step 0 + Step 1)

**The load-bearing finding** was that Tailwind v4's CSS-first model couples token names to specific CSS-property namespaces (`--text-*` for font-size, `--leading-*` for line-height, `--ease-*` for timing-function, etc.) — and that semantically named alternatives (`--font-size-*`, `--line-height-*`, `--motion-easing-*`) silently fail to generate utility classes. Verifying utility generation in `output.css` *after* a multi-namespace probe is the only way to lock tokens safely on a v4 stack. Customer-2 onboarding MUST run a multi-namespace probe (not just colour aliasing) before locking tokens. Logged as DEV-5.

**Dual-consumer pattern.** Tokens read by both Tailwind utilities AND non-Tailwind code (e.g. GSAP via `getComputedStyle`) declare a `--{semantic}-*` source-of-truth group plus `--{tailwind-namespace}-*` aliases via `var()`. Single source, two consumers, no drift:

```css
--motion-reveal-duration: 500ms;                    /* GSAP source-of-truth */
--duration-reveal: var(--motion-reveal-duration);   /* Tailwind alias */
```

Customer-2 capability take-away: token systems extracted from the live source site (1440×900 + 768 + 375 breakpoints) cross-referenced against `audit-output` are the right shape; per-token `source` annotation in TOKENS.md keeps provenance auditable. Specific values are CE-only; **methodology is reusable**.

**Pre-Step-1 stack-version probe (DEV-3).** Tailwind major version (v3 JS-config vs v4 CSS-first) and `globals.css` location (`app/`-co-located vs separate `styles/`) are structurally different deliverables. Customer-2 onboarding MUST inspect `site/package.json` for tailwind major + check globals.css location BEFORE drafting Step 1 output paths.

**Pre-flight third-party weight measurement (DEV-6).** Never lock perf budget without measuring current state AND classifying each script by business function. CE measured 404 KB (64% over assumed 250 KB target); investigation surfaced one large script (Vector Tag, 58 KB) as business-critical lead-gen, retained. Heavy ≠ removable; classification is a business decision, not a technical one. Reusable: `scripts/design/measure-third-party-weight.mjs`. Run before locking any customer's perf budget.

**Token-scope verification at phase boundaries (Step 0c).** `SANITY_API_READ_TOKEN` was discovered to have write capability despite the `_READ_` infix in the env name. Token names lie. Customer-2 protocol: run `verify-token-scope.mjs` at phase boundaries; only `statusCode: 403` or `401` proves read-only. Other non-2xx codes (404, 409, 422, 429) do not prove read-only and surface as inconclusive.

---

### Primitive component patterns — 10 categorical patterns harvested from Step 2

**Phase context.** 22 primitives across 5 categories (A–E) + Icon foundation, hand-built in `site/src/components/ui/`. ~200+ mutation test cases verified across the kitchen-sink `/demo` route. 21 probe scripts captured CE-source patterns; 25 DEV-N findings logged across primitives. tsc + build clean throughout.

#### 1. Hand-built atop @radix-ui — no shadcn dependency

**The load-bearing finding** was that consuming @radix-ui primitives directly (and wrapping them with CVA + Tailwind v4 utility classes) gives finer control over CE-brand expression than installing shadcn's pre-styled wrappers. shadcn embeds AI-aesthetic defaults (rounded corners, neutral greys, generic focus rings) that have to be unwound before they can be re-styled to CE — net cost is higher than starting from raw Radix. Customer-2 capability take-away: for any customer whose brand is opinionated enough to warrant audit-driven probing in the first place, **consume Radix directly, skip shadcn**. shadcn is the right call when the brand is generic or undefined.

#### 2. CVA-standardised variant API

**The load-bearing finding** was that one variant library (`class-variance-authority`) used uniformly across 22 primitives gives Step 4 template authors a predictable API surface (`variant`, `size`, `tone`, etc. — always props, never `className` magic strings). The `variants` object in each `index.tsx` is the contract. Customer-2 capability take-away: pick CVA at primitive-pattern lock-in and resist the temptation to mix in `cn()`-only primitives or hand-rolled variant objects — consistency at the primitive layer pays dividends at the template layer.

#### 3. No-className-variants rule

**The load-bearing finding** was that variants live in CVA `variants:` blocks; `className` props are for one-off layout adjustments (margins, widths) only. Variant-shaped behaviour (tone, size, density) MUST go through CVA — never as a magic-string `className`. This makes the variant surface enumerable and lintable. Customer-2 capability take-away: enforce the rule at code-review time on customer-2; consider an ESLint rule that detects variant-shaped class strings on primitives at TEMPLATE-* phases.

#### 4. SVG sprite for icons — no lucide-react, no Material Symbols

**The load-bearing finding** was that probing CE's actual icon set surfaced 9 distinct glyphs across the entire site (`probe-icon-inventory.mjs` → `icon-classification.json` from a candidate pool of 70+). Shipping an icon library would have been gross overkill. The sprite at `site/public/icons/sprite.svg` is generated from `site/src/components/ui/_icons/sprite.svg` source-of-truth via `scripts/design/emit-icon-sprite.mjs`; consumed via `<Icon name="..." />` with typed `IconName` union. Customer-2 capability take-away: probe before installing — most customers have far fewer icons than the icon-library worldview assumes. Reusable: `probe-icon-inventory.mjs` + the sprite-generation pipeline.

#### 5. GSAP banned from primitives — CSS transitions only

**The load-bearing finding** was that primitives have predictable hover/focus/state transitions, and CSS transitions/animations cover them at 0 KB JS cost. GSAP earns its weight on Tier-1 composite components (hero scale-in, scroll-triggered section reveals) where the timeline orchestration is non-trivial. Customer-2 capability take-away: scope GSAP to Tier-1; wire a per-folder lint or convention rule if customer-2's primitive library shows GSAP creep.

#### 6. Probe-first discipline (Hard Rule #2)

**The load-bearing finding** was that every primitive shipping decision (variants, sizes, default states, animation easing, hover behaviour) was backed by a `probe-*.mjs` script that captured the live CE source pattern + a JSON output committed to `audit-output/design-1/`. 21 probes ran across Step 2. Decisions made *without* a probe outcome were inevitably wrong (see HALT-discipline pattern §1 below — the accordion icon was the canonical case). Customer-2 capability take-away: write the probe before writing the primitive. The probe is cheap (most run in seconds against the live page); the wrong-direction primitive rewrite is expensive.

#### 7. Per-primitive folder structure

**The load-bearing finding** was that `site/src/components/ui/{name}/index.tsx` (folder-per-primitive) enables three things flat-file structure (`{name}.tsx`) cannot: a co-located `stories.tsx` sibling for Storybook (Path-A-conditional at Step 4), a co-located `index.test.tsx` sibling, and natural homes for primitive-internal helpers (`{name}/_utils/*`). v1.5 of the brief still mandated the flat shape; v2.0 corrected it. Customer-2 capability take-away: adopt folder-per-primitive from the first primitive — retrofitting from flat is per-primitive churn.

#### 8. Inline source-comment as primitive-level spec

**The load-bearing finding** was that primitives don't need an external spec doc — the `index.tsx` source comment at the top of each file documents probe-driven decisions, DEV-N references, and pattern rationale in a form that lives next to the code it describes. Tier-1 composite components still get external specs at Step 3 (8-section template — load-bearing for cross-team consumption). Primitives, by contrast, have an audience of one: the next person reading the source. Customer-2 capability take-away: reserve external spec docs for components that cross team boundaries. Self-documenting code with structured top-of-file comments is the right shape for design-system primitives.

#### 9. Layout-root provider mount pattern

**The load-bearing finding** was that Radix's `TooltipProvider` and `ToastProvider` (D2/D4) mount once at `site/src/app/layout.tsx` — never per-primitive. Provider-per-consumer leads to portal collisions, double-mounted toast viewports, and unpredictable z-index stacking. Step 2 established the layout-root provider mount as the discipline; primitives consume the provider context, never bring their own. `delayDuration={300}` overrides Radix's 700ms tooltip default (sluggish for modern UX). Customer-2 capability take-away: identify provider-shaped primitives early (Tooltip, Toast, possibly Dialog if multi-instance) and lock the layout-root mount before the first primitive ships.

#### 10. Form integration split — register-based vs Controller-based

**The load-bearing finding** was that react-hook-form integrates two different ways depending on whether the underlying input is a native HTML element or a Radix-controlled component. C1 Input / C2 Textarea / C4a Checkbox use `register('name')` spread on the input. C3 Select (Radix-controlled) requires `Controller` because the value is set via `onValueChange`, not a DOM event. C5 FormField is the smart wrapper that papers over the difference + auto-handles ids + aria + error reading via `useFormContext()`. Customer-2 capability take-away: a generic FormField wrapper that auto-detects child type (or accepts a Controller passthrough for controlled children) is essential — without it, every form template in TEMPLATE-* would re-derive the integration shape.

---

### HALT-discipline patterns captured at HALT 10

**Phase context.** HALT 10 visual eyeball on the kitchen-sink `/demo` route surfaced two items: (1) A5 Accordion icon was wrong (chevron-rotation instead of CE's plus → × in black circle); (2) marquee logos rendered placeholder text. Item 1 was a real fidelity bug; item 2 was a layout-context observation deferred to Step 4. The catch + correction protocol is captured below as 4 HALT-discipline patterns — these are catch-protocol patterns, not primitive patterns, so kept in a separate section per Jake's direction.

#### 1. Probe-first dismissal protocol

**The load-bearing finding** was that when a probe surfaces an unfamiliar pattern in the source site, the burden of proof is on DISMISSAL, not on adoption. Phrases like "likely Webflow artifact" or "modern convention is better" are speculation, not evidence. Absence of `w-*` prefix in class names, presence of custom-named classes (`faq-btn`, `line-1`, `toogle-top`), and pattern consistency across multiple pages are evidence AGAINST artifact dismissal — they signal intentional brand design. **Customer-2 protocol:** any "migration improvement" that diverges from a probe-confirmed CE pattern requires explicit documented evidence (accessibility regression, broken behavior, performance issue). "Modern accordion convention from Notion/Linear/Stripe" is NOT evidence — it's preference. Hard Rule #2 (visual fidelity) overrides modern-convention assumptions when the source pattern is sitewide and intentional.

#### 2. HALT 10 visual eyeball as last-line defense

**The load-bearing finding** was that HALT 10 visual eyeball catches what static checks miss. Visual brand-pattern divergences pass tsc + build cleanly because they're not type errors or runtime errors — they're fidelity errors. The kitchen-sink demo route + a real human comparing against the live source site is the ONLY safety net for these. **Customer-2 protocol:** HALT 10 is non-negotiable. Schedule explicit time for human review against the live source site, side-by-side in two browser windows. Specifically check: button text colors, icon patterns within components (accordion toggles, dropdown indicators, close buttons), hover states, focus states, animation timing/easing. Static probes capture markup; visual review captures intent.

#### 3. Browser cache trap during HALT 10

**The load-bearing finding** was that browser-cached CSS from earlier dev iterations can mask correct production output OR create false-positive bugs. **Customer-2 protocol:** HALT 10 checklist line item #1 = hard-refresh (Cmd-Shift-R) + DevTools cache-disabled before any visual review. False-positive bugs caught at HALT 10 should ALWAYS verify against probe data + compiled CSS before triggering a fix cycle. The accordion fix at HALT 10 was real; the (separately observed) button text-color flag was a cache artefact.

#### 4. Demo route width misalignment is not a primitive bug

**The load-bearing finding** was that demo-route width misalignment is a visualization artifact, not a primitive bug. Primitives are width-agnostic by design — width is parent-controlled. **Customer-2 protocol:** distinguish primitive bugs (rendering wrong content/styling) from layout-context observations (rendering correctly but in different parent context than production templates). Layout-context observations defer to template phase, never trigger primitive fixes. Specific to CE: A5 Accordion appears wider on `/demo` than on CE's `/services` because CE wraps FAQs in a narrower section column. Step 4 templates wrap accordions in `Container width='narrow'` or a max-width-constrained section per CE's measured FAQ-column widths.

---

### Storybook setup — Brief A Step 4 productisation IP

**Phase context.** Path A locked at Brief A v1.2 — Storybook IN. Adapter:
`@storybook/nextjs@10.3.6` (webpack-based; `nextjs-vite` deferred until
[storybookjs/storybook#34688](https://github.com/storybookjs/storybook/issues/34688)
closes — `ServerInsertedHTMLContext` export missing in dev mode for
Storybook 10 + Next 16 + React 19 + Vite 8 + nextjs-vite, dev mode
unusable, production unaffected; revisit at customer-2 onboarding or
when issue resolves). Brief A Step 4 close deliverables: 30 stories
(25 primitive Pair-rule per folder + 5 Tier-1 scaffold-stage), Storybook
Story Pattern entry in `CONVENTIONS.md`, Vercel separate-project deploy
with Standard Protection, customer-2 runbook at
`docs/design/storybook-deploy.md`. **Source for this consolidation:**
`audit-output/design-1/capability-log-draft.md` Brief A sections
(gitignored running draft — 9 BvR findings + DEV-2 update + Tech Debt
entry; consolidated here at HALT 1 close).

#### 1. Storybook 10 install workarounds — three one-time gotchas

**The load-bearing finding** was that Storybook 10's `npx storybook init`
ships three rough edges that the brief literal didn't anticipate. (a)
Init scaffolds a demo `stories/Header.jsx` that imports `prop-types`
without declaring it as a dep — first `build-storybook` fails. Workaround:
`npm install --save-dev prop-types` after init, then delete the demo
`src/stories/` directory before authoring real stories. (b) Init is
interactive by default; without `-y --no-dev` the CLI blocks on addon-vitest
prompt + auto-launches a dev server, both fatal for automation. (c) Init's
recommended-default builder shifted between probe time (Step 0d) and
execution time — the ".storybook recommends nextjs-vite" prompt is now
default; pin explicitly via `--builder webpack5` to keep the brief D2
adapter lock stable across drift. Customer-2 capability take-away: brief
authors should include `-y --no-dev --builder webpack5` (or vite-equivalent)
in CLI command literals when the executor is automated tooling, AND ship
`prop-types` install in the same step. Both invisible until they break,
both cheap to plan around if anticipated.

#### 2. ESLint flat-config + eslint-plugin-storybook integration

**The load-bearing finding** was that Storybook init's ESLint patch is
flat-config-aware and Just Works — no manual `fixupPluginRules` needed
when the host repo's ESLint is already flat-config (per Brief A §0b
discriminator). Add `import storybook from "eslint-plugin-storybook"`
+ `...storybook.configs["flat/recommended"]` to `eslint.config.mjs`.
Customer-2 capability take-away: this integration assumes flat-config
host; legacy-shape (`.eslintrc.*`) repos need `fixupPluginRules`
wrapping per F27 v1.5. Per-repo discriminator is "which config file is
present", not "which ESLint major version is installed".

#### 3. Framework auto-mocks for `next/image` + `next/link` + `next/font` — no decorators needed

**The load-bearing finding (BvR #4)** was that `@storybook/nextjs@10.3.6`
ships built-in handlers for all three: `dist/images/next-image.js` +
`dist/image-context.js` (image stub), `dist/export-mocks/link/`
(passthrough Link mock), `dist/font/webpack/` (webpack loader transforming
`next/font/local` and `next/font/google` call expressions at compile time).
Plus `next/navigation`, `next/router`, `next/headers`, `next/cache` via
the same `export-mocks/` directory. Brief literal mandated authoring
preview.tsx decorators for image/link/font; structural reality already
provided them. Authoring decorators for `next/font` would not even work —
it's a compile-time transform of source-file `import` statements, not a
runtime React boundary that a decorator can wrap. Customer-2 capability
take-away: when a brief's adapter already supplies a structural facility,
manual implementation is double-work AND can be incorrect. Brief authors
should describe the *outcome* ("stories must render with `next/image`
rendering as `<img>`"), not the *implementation* ("author a decorator
that..."). Lets executors choose between adapter-built-in vs hand-rolled
per the actual framework state.

#### 4. `globals.css` over `tokens.css` for Tailwind v4 utility availability

**The load-bearing finding (BvR #5)** was that brief literal pointed
preview.tsx at `tokens.css` ("the import alone suffices, no JS config
to wire"). Structural reality: `tokens.css` is `@theme { ... }`-only —
declares CSS custom properties but does NOT bring Tailwind's utility CSS
layer. Only `globals.css` imports both: `@import "tailwindcss"; @import
"./tokens.css";`. Importing tokens.css alone exposes tokens
(`var(--color-brand-primary)` resolves) but Tailwind utility classes
(`bg-brand-primary`, `text-h1`, `ease-reveal`) aren't generated → stories
render unstyled. Customer-2 capability take-away: at preview-config-time,
ALWAYS import the file that itself imports `tailwindcss` — typically
`globals.css` or equivalent. Discriminator is "does this CSS file
contain `@import \"tailwindcss\"`?" via `grep -l 'tailwindcss' src/app/*.css`,
not "is this the tokens file?".

#### 5. `NEXT_PUBLIC_*` env config function — required for any schema-validated env module

**The load-bearing finding (BvR #8 — the HALT 1 bug)** was that
`@storybook/nextjs` does NOT auto-pass-through `NEXT_PUBLIC_*` env vars
to its webpack DefinePlugin. Bundle inspection at
`storybook-static/image-stories.*.iframe.bundle.js` showed `process.env`
inlined to a literal containing only `NODE_ENV` / `NODE_PATH` / `STORYBOOK`
/ `PUBLIC_URL` — Storybook's built-in env set, NOT Next.js's `NEXT_PUBLIC_*`
augmentation. `src/lib/env.ts`'s `Zod.string().min(1)` schema threw at
module evaluation time when the required Sanity vars resolved to
undefined. The throw cascaded — webpack module wrapper halted mid-evaluation,
downstream `var _utils_cn__... = require(...)` never assigned, and the
hoisted `Image` function's call site `(0, _utils_cn__.cn)(className)`
failed at render time with `Cannot read properties of undefined
(reading 'cn')`. **Two distinct surface symptoms** traced to this single
root: (a) Tier-1 stories — TypeError on cn at render call site;
(b) Image primitive's own story — TDZ ReferenceError on
`__WEBPACK_DEFAULT_EXPORT__` at processCSFFile (the throw halted before
the `const __WEBPACK_DEFAULT_EXPORT__ = {...}` assignment could initialise).
**Canonical fix:** `env: (config) => ({ ...config, NEXT_PUBLIC_X:
process.env.NEXT_PUBLIC_X ?? '' })` config function in `.storybook/main.ts`,
mapping every required `NEXT_PUBLIC_*` env var explicitly. Vercel-portable
as long as the project's environment variables are set. Customer-2
capability take-away: any phase that uses Storybook 10 + Zod-validated
env modules MUST include the `env` config function in `main.ts` from the
start. The framework-name suggests Next.js parity but the env-handling
does NOT inherit. Add to customer-2 onboarding checklist: *"if `src/lib/env.ts`
(or equivalent schema-validated env module) is in scope, configure
`.storybook/main.ts` `env` field to mirror the schema's required keys."*

#### 6. Build-time exit-0 is necessary but not sufficient — runtime spot-check required

**The load-bearing finding (BvR #9 — the HALT 1 bug missed by the verifier)**
was that Zod's `schema.parse()` runs at module-evaluation runtime in the
browser, NOT at webpack build time. The webpack build emits a bundle
whether or not env vars are wired correctly — failures surface only when
a story actually loads in a browser and the env-importing module evaluates.
Brief A §4.4 prep flagged this caveat (*"build itself still likely
passes... but it's worth confirming"*) but the verifier still ran with
exit-0 alone. Bug shipped to Vercel; HALT 1 walkthrough was the first
runtime evaluation. Customer-2 capability take-away: for any phase using
schema-validated module loads (Zod, io-ts, ArkType, etc.), exit-0 alone
is not enough. Required minimum: exit-0 + at least one schema-touching
story loaded in a real browser (locally via `npx http-server
storybook-static` is enough — no need for a Vercel round-trip).
Pre-deploy local spot-check is cheap; post-deploy spot-check via Standard
Deployment Protection is the slow path. Concrete brief-drafting rule:
*"any phase that ends with a 'build exits 0' verifier MUST also specify
the runtime evaluation entry-point (URL or dev-server command) and at
least one mandatory spot-check before considering the verifier passed."*

#### 7. Pair-rule per folder — mechanical count beats logical count

**The load-bearing finding (BvR #6)** was that brief literal counted
"22 logical primitives + Icon = 23 stories" while the per-folder Pair-rule
(D5: "every primitive folder gets a stories.tsx sibling to index.tsx")
applies mechanically per directory. C4 Checkbox + C4b RadioGroup ship
as separate folders → Pair-rule produces 25 stories (24 + Icon). Total
Brief A: 25 primitive + 5 Tier-1 = 30 stories, not the brief literal 28.
Mechanical check: `find site/src/components/ui -mindepth 2 -name
stories.tsx | wc -l` returns the exact integer. Customer-2 capability
take-away: when a brief mixes "logical entity count" and "per-folder
rule count" without reconciling, the per-folder rule wins because it's
the mechanically-verifiable one. Brief authors should use one count
basis throughout — preferably the mechanically-verifiable one — and
call out splits explicitly (*"22 logical primitives, but C4 splits to
2 folders, so the Pair-rule produces 24 + Icon = 25 files"*).

#### 8. Render-only stories preferred over `args` + `argTypes`

**The load-bearing finding** was that polymorphic primitives (Card,
Heading, Text, Container — forwardRef + restricted-set + per-element
prop typing per the HALT-2-locked Card pattern) don't fit cleanly into
Storybook's argTypes generic inference. Render-only stories with inline
JSX keep stories deterministic and tightly typed without fighting the
inference. Brief D3 ("dev sandbox not stakeholder showcase") justifies
the simpler shape. Customer-2 capability take-away: when a primitive
inventory contains polymorphic-via-`as` components, default to render-only
stories. Args + argTypes pay off for stable-prop primitives (Button,
Input, Tag) but the friction-cost-vs-typing-benefit tilts toward render-only
across the inventory; consistency of story shape across primitives matters
more than per-primitive optimisation.

#### 9. Mock data discipline — Hard Rule #1 exception scoped to story files

**The load-bearing finding** was that Brief A Hard Rule #1 ("no fabrication
of CE site facts") needed an explicit exception for story mock data —
generic placeholders (`Sample Author Name`, `/og-default.png`,
lorem-ipsum-style copy) are explicitly permitted in story files because
stories are NOT a CE-site claim, they are dev-sandbox primitives. Real
CE marketing copy in stories is forbidden; outside story files (specs,
briefs, docs), Hard Rule #1 stands without exception. Stories must be
deterministic + runnable offline (no Sanity fetches). Customer-2 capability
take-away: scope-limited exceptions to project-wide rules are cleaner than
case-by-case judgment. Name the exception, scope it, document the boundary.

#### 10. Tier-1 scaffold-stage rule — primitive-composition preview, not working impl

**The load-bearing finding** was that Tier-1 stories ship as
*primitive-composition previews*, NOT working implementations. Brief A
Hard Rule #7 forbids library wiring at scaffold stage: no `gsap` import,
no `swiper` init, no working ScrollTrigger, no autoplay logic. Each
Tier-1 story renders the primitives listed in the spec's §3 Tech stack
composed with mock data per §6 Data binding shape, plus a visible
`ScaffoldNote` panel describing what library wires in at TEMPLATE-* time,
the §6 GROQ query, and relevant §4 Timing values. Story file header
comment notes implementation lands at the relevant TEMPLATE-* phase.
Customer-2 capability take-away: the spec system + Storybook scaffold-stage
pattern lets you ship a design system before any pages exist — the
dev-handoff value of Storybook is the primitive set; the educational
value of Tier-1 stories is the *decomposition*, not the working
implementation. Customer-2 onboarding can adopt this pattern from
day one without waiting for TEMPLATE-* completeness.

#### 11. Vercel separate-project deploy + Standard Protection

**The load-bearing finding** was that Storybook deploys cleanly as a
separate Vercel project pointed at the same Git repo with Root Directory
override (not the same project as the main customer site, to avoid build
command conflicts). Framework Preset MUST be set to `Other` (not
auto-detected Next.js, which would invoke `next build` instead of
`storybook build`). Build Command override: `npm run build-storybook`;
Output Directory override: `storybook-static`. Standard Deployment
Protection sufficient for owner-only review (no bypass tokens needed
when only the owner reviews at HALT 1). Customer-2 capability take-away:
runbook at `docs/design/storybook-deploy.md` captures the per-project
configuration + the env-vars gotcha + the project-naming convention
(`mygratr-{customer-slug}-storybook`). Deploy reusable as-is for
customer-2; the only customer-specific step is setting the two
`NEXT_PUBLIC_SANITY_*` env-var values from the customer's Sanity project.

#### 12. Build-infrastructure-before-deploy commit cadence (CI/CD-aware ordering)

**The load-bearing finding (BvR #7)** was that the brief's implied
sequence — "do all the work → deploy → verify → commit at HALT" — is
structurally impossible for any Git-driven CI/CD platform. Vercel
deploys from a Git push; a push requires a commit; build infrastructure
(scripts, config, source) must be committed and pushed *before* the
deploy step can run. First Vercel deploy attempt at §4.4 failed because
the pushed branch on origin sat at the last pre-§4.0 commit while all 36
build-infrastructure files (`.storybook/`, 30 stories, modified
`package.json` + `eslint.config.mjs` + `.gitignore` + `package-lock.json`)
sat uncommitted in the local working tree. Resolution: split the HALT
commit into two — pre-deploy commit covers build infrastructure, post-deploy
commit covers verifier output + per-phase docs. Brief intent (eyeball
before commit) preserved by moving the eyeball moment from "pre-commit
local review" to "post-deploy CI/CD review" — same approval gate,
different visual surface. Customer-2 capability take-away: brief drafters
must verify build-infrastructure-vs-deployment-step ordering. **If a
phase deploys to a CI/CD platform, all build infrastructure must be
committed before the deploy step.** Concrete brief-drafting rule: when
a phase has both an "author" sub-step and a "deploy to CI/CD" sub-step,
schedule the commit *between* them, not after the deploy. Commit cadence
in such phases is *write → commit → push → deploy → verify →
commit-verifier-output*, not *write → deploy → verify →
commit-everything*.

#### 13. Brief-vs-reality finding velocity — 9 instances at Brief A indicate brief-drafter mental-model gaps

**The load-bearing finding** was that Brief A v1.2 surfaced 9 BvR
findings across §2 + §4.0–§4.4 + HALT 1 — a higher density than Step 3
(6 findings) or Step 2 (no formal BvR tracking yet). Synthesising the 9
across themes: file-location/path expectations (#1 + #2), CLI execution
model (#3), framework-shape vs literal instructions (#4 + #5 + #8),
counting-basis discipline (#6), CI/CD ordering (#7), build-vs-runtime
verifier (#9). The cluster reveals **three brief-drafter mental-model
gaps** that customer-2 brief checklist should bring forward: (a)
non-interactive CLI flags (`-y`, `--no-dev`, equivalent) for
automation-executed steps; (b) CI/CD-aware commit ordering (commit before
deploy, not after); (c) build-vs-runtime correctness for any
schema-validated module load. All three are invisible until they break
and cheap to plan around if anticipated. Customer-2 capability take-away:
the BvR finding pattern (named at Step 3 HALT 4) does its job — the
workflow that catches these tensions is more valuable than perfect
brief drafting. Track BvR finding velocity per phase as a brief-quality
metric: low velocity = brief was thorough; high velocity = brief assumed
particular evaluation models that customer-2 onboarding should
anticipate explicitly.

---

### Complex-component specification methodology — Step 3 productisation IP

**Phase context.** 5 Tier-1 component specs locked at HALT 1 (1 High + 3 Medium + 1 Low). 4 HALTs landed clean across drafting (1: inventory; 2: first-spec format-lock; 3: stress-test format finalisation; 4: Step 3 close). Total spec output: 1,044 lines across `TIER_1_INVENTORY.md` + 5 specs at `docs/design/components/{slug}.md`. **Source for this consolidation:** `audit-output/design-1/capability-log-draft.md` Step 3 section (gitignored running draft; consolidated here at Step 3 close per Jake's direction — early consolidation rather than waiting for Step 9 finalisation).

#### 1. Tier-1 audit pass — brief speculation vs probe truth

**The load-bearing finding** was that brief candidate categories are *hypotheses to verify*, not *facts to spec from*. The v1.1 brief's "TECHNOLOGY filter grid" Tier-1 candidate was speculative — live-site probe on `/technology` confirmed an alphabetical 150-card list with **no filter UI**. Removing speculative entries via probe is the same probe-first dismissal protocol from Step 2 HALT 10, applied at inventory-walk time. Customer-2 capability take-away: budget time for "candidate refinement" between agent-walk and inventory lock — agents over-list because they don't apply the Tier-1-mechanism vs primitive-use distinction.

#### 2. The 5 §4 Timing Provenance Shapes (productisation IP, named explicitly)

**The load-bearing finding** was that the §4 Timing provenance paragraph is the spec section most likely to drift into copy-paste boilerplate. Per HALT 2 lock 2, the paragraph must adapt per-spec to the component's tech stack. **5 distinct shapes** documented across DESIGN-1 Step 3 stress-test:

| Shape | When | Provenance template |
|---|---|---|
| **Library-mediated** | Component uses a JS library other than GSAP (Swiper, framer-motion, etc.) | "Library-mediated, not GSAP-driven. Shim does not capture library internals — structural gap, not F10/F11/F12 failure. Timings extracted manually from inline init script in `audit-output/ce-template-custom-code.json`." |
| **GSAP-clean** | Single GSAP call, post-assignment, no caveats | "GSAP-driven and clean. Shim captured the call. No F10/F11/F12 caveats. All timings shim-extracted with no concerns." |
| **GSAP-mixed** | GSAP + plain JS, or `ScrollTrigger.create()` static methods that bypass shim | "Partially shim-extracted, partially source-code-extracted, partially library-default. Per-call provenance noted." |
| **CSS-only** | No GSAP, no JS, no library | "No GSAP, no JS, no library. Shim structurally inapplicable — nothing to capture. F10/F11/F12 do not apply. All timings CSS-source-extracted from compiled CSS." |
| **GSAP attribute-selector orchestration** | Sitewide pattern via attribute selectors; multi-instance per page | "Partially shim-extracted (multiple instances captured cleanly across multiple pages), partially source-code-extracted (full orchestration source in custom-code.json). Cross-page corroboration plus source confirms config." |

Customer-2 capability take-away: classify the component's tech stack first; pick the matching shape; fill in specifics. The shapes name the productisation IP explicitly so spec-author cognitive load drops on subsequent specs.

#### 3. Render-utility classification (third component category)

**The load-bearing finding** was that Step 2 introduced primitives (`site/src/components/ui/`); Step 3 introduces Tier-1 components (8-section specs); but the stress-test surfaced a third category — **render utilities**. These are Tier-1 specs that orchestrate other components rather than composing primitives, and that do not touch Sanity data. Live outside `site/src/components/ui/`; exact path (`site/src/components/utilities/` vs `site/src/components/animations/`) deferred to TEMPLATE-* time. The §6 Data binding mandate is gated on this classification — render utilities declare "N/A — render utility"; data-binding components require GROQ + field paths. Customer-2 capability take-away: the three-category breakdown (primitive / Tier-1 component / render utility) is a productisation pattern. Customer-2 design systems should expect all three; primitives compose, Tier-1 components data-bind, render utilities orchestrate.

#### 4. Path A mechanical trigger (§6 GROQ-mandate refinement)

**The load-bearing finding** was that ambiguous format mandates degrade into per-author interpretation drift over time. HALT 3 finalisation refined the §6 GROQ-mandate with a mechanical trigger: "**does this component touch Sanity data?** If yes → GROQ + field paths required. If no → 'N/A — render utility' allowed." The trigger removes per-author judgment. Customer-2 capability take-away: tighten format mandates with mechanical triggers; ambiguity is the failure mode that erodes structural rules across phases.

#### 5. TBD-pending-capture pattern (two-pass workflow)

**The load-bearing finding** was that spec format-lock and value-capture are separable concerns. Format-lock proves the section structure works; value-capture populates specific values via DevTools inspection. Sections that depend on visual capture (especially §5 Breakpoints; sometimes §4 Timing for CSS transitions) carry `TBD-pending-capture` markers at first-spec — not an oversight, a deliberate two-pass workflow that accelerates HALT cadence. Used in `nav-sticky-transition-global` (CSS transition durations on `.active-nav`/`.is-open`) and `service-card-grid-hover-reveal` (arrow-icon opacity transition rules). Customer-2 capability take-away: two-pass review is faster than blocking format-lock until every value is captured; explicitly authorise the marker at HALT-2-equivalent.

#### 6. Cross-spec consistency — no back-port required

**The load-bearing finding** was that 3c batch (3 specs) + 3d stress-test (1 spec) drafted under the format locked at HALT 2 forced no retroactive edits to the first-spec (`testimonial-swiper-global.md`). Confirms the format-lock at HALT 2 was sturdy. Customer-2 capability take-away: format-lock at the second halt (after first-spec stress-test on a medium-complexity component) is the right cadence — high-complexity stress-test second (not first) lets the format absorb the test without compounding "is the format wrong?" with "is this content extraction wrong?".

#### 7. Brief-vs-reality finding (new productisation pattern, named at HALT 4)

**The load-bearing finding** was that brief writers cannot anticipate every structural rule downstream. When brief literal conflicts with structural rule (gitignore, framework convention, tooling constraint, etc.), the **structural rule wins**. Surface the conflict explicitly, choose the structural path, document the resolution. Parallel discipline to schema-vs-reality. Canonical instance at HALT 4: brief 3f.d literal instruction (`git add audit-output/design-1/capability-log-draft.md`) vs the `audit-output/` gitignore rule per `CLAUDE.md` repo structure. Structural rule won — the running draft stays gitignored; Step 9 (or earlier per Jake's direction) consolidation into the canonical `docs/CAPABILITY_LOG.md` is the productisation-IP preservation path. Customer-2 capability take-away: name the pattern. The workflow that catches brief-vs-reality conflicts is more valuable than perfect brief drafting.

---

### Complex-component specification methodology

**Step 3 productisation IP consolidated above.** Step 9 finalisation will revisit if any additional patterns surface during Steps 4–8.

---

### v0.dev prompt template — Brief A Step 5 productisation IP

**Phase context.** Brief A Step 5 closed at HALT 2 with one round of
clarification edits (no implementation rounds, no CI/CD bug surprises,
zero fresh BvR findings). Total deliverables: 4 files / 964 lines —
canonical `docs/V0_PROMPT_TEMPLATE.md` (406 lines) + 3 worked examples
under `docs/templates/_examples/` (BLOG 168 + TEAM_MEMBER 166 + REVIEW
224 lines). Storybook deploy from Step 4 wired into Section 2 as
live primitive-shape reference. **Source for this consolidation:**
the running draft at `audit-output/design-1/capability-log-draft.md`
needed no Step 5 BvR-finding section — zero finding velocity at Step 5
validates Step 4 Pattern 13 (BvR velocity as brief-quality metric) in
the small. Brief A officially closes with this consolidation; Brief B
(Steps 6 + 8 — ESLint rule + Visual Editing wiring) drafting can begin.

#### 1. 6-section format with paste-as-is vs fill-in split

**The load-bearing finding** was that splitting the 6 sections into
*paste-as-is* (Sections 1, 2, 5, 6 — design system constraints,
primitive inventory, output-shape constraints, output format) vs
*per-template fill-in* (Sections 3, 4 — visual reference, Sanity data
shape) lets template authors invest ~5 minutes per template instead
of re-authoring the constraints each time. The paste-as-is sections
ARE the productisation IP; the fill-in sections ARE the per-template
work. Customer-2 capability take-away: when productising a prompt
template, identify which sections are universally applicable and
lock them as paste-as-is. Per-template work shrinks accordingly.

#### 2. Self-explaining placeholder discipline (HALT 2 lesson)

**The load-bearing finding (HALT 2 round, two clarification edits)**
was that placeholders must self-explain without referencing roadmap
context customer-2 won't have. Original Section 3 used
"TBD-pending-Step-7" markers — opaque without knowing what Step 7
delivers. HALT 2 Edit 1 replaced with a self-contained REFERENCE-doc
workflow ("Each template has a REFERENCE doc at
`docs/templates/{template-slug}/REFERENCE.md`... if it doesn't exist
yet, capture screenshots first"). HALT 2 Edit 2 replaced Section 4's
bland `TemplateSchema` placeholder name with
`PLACEHOLDER_REPLACE_ME_Schema` — visibly demands replacement, can't
be silently copy-pasted. Customer-2 capability take-away: placeholder
names must visibly demand replacement; internal phase references
("Step N", "TBD-pending-Step-N") are roadmap-leaky and don't survive
customer-2 onboarding. The two-edit HALT 2 round is itself a pattern —
review the canonical artefact for placeholder names and roadmap
references at HALT-equivalent before committing.

#### 3. Worked-example-as-clarification pattern

**The load-bearing finding** was that 3 worked examples (BLOG /
TEAM_MEMBER / REVIEW) clarify the per-template fill-in pattern by
example — readers learn how to fill Sections 3 + 4 by reading three
concrete instances rather than abstract instruction. The 3 examples
were chosen to span shape-variation in the schema set: detail-page-by-
slug (BLOG, TEAM_MEMBER) vs listing-page-no-slug (REVIEW); full-meta
(BLOG) vs no-OG-image meta (TEAM_MEMBER, REVIEW); reference-heavy
(BLOG with category/tags/author) vs flat (TEAM_MEMBER). Customer-2
capability take-away: budget 2-3 worked examples per productisation
template; choose examples that exercise distinct shape-variations in
the underlying schema set, not the simplest 3.

#### 4. Schema-vs-reality findings carried into example bodies

**The load-bearing finding** was that Brief A v1.2 §5.2 mandated
carrying forward findings already logged in
`docs/design/components/testimonial-swiper-global.md` (Finding 1:
hardcoded 5-star rating field deferred to STATIC-1 / SCHEMA-2;
Finding 2: sibling `.swiper.testimonies` variant decision deferred to
TEMPLATE-REVIEW) into the REVIEW worked example. Without the carry-
forward, v0.dev would receive an incomplete picture and might invent
a `review.rating` GROQ projection or assume a single Swiper variant.
Worked examples are the right host for findings because findings ride
alongside the prompt v0.dev consumes. Customer-2 capability take-away:
cross-reference findings from adjacent specs into derivative artefacts
(worked examples, prompt templates) — not just into the canonical
findings index. Findings must travel with the artefact that generates
the output, or they go un-applied at generation time.

#### 5. Storybook URL as Section 2 cross-reference

**The load-bearing finding** was that the Storybook deployment from
Step 4 (Vercel-hosted, Standard Protection) becomes a *live primitive-
shape reference* for the v0.dev workflow when its URL is wired into
the prompt template's Section 2. Template authors using v0.dev can
verify what `<Button variant="primary-yellow">` actually looks like in
real CE design tokens before pasting v0.dev output. Closes the loop
between the dev sandbox (Storybook) and the template author (v0.dev
prompt). Customer-2 capability take-away: when Storybook IS deployed
at the design system phase, wire its URL into the prompt template
Section 2 from day one. The cross-reference makes Storybook genuinely
useful for production workflow, not just review.

#### 6. Per-doc-type variation surfaced in worked examples (canonical stays universal)

**The load-bearing finding** was that not every Sanity-doc-driven
template fits the same shape. Two distinct variations surfaced across
the 3 worked examples:

- **Listing vs detail-page query shape.** BLOG and TEAM_MEMBER are
  detail pages with `*[_type == "X" && slug.current == $slug][0]` and
  a `[slug]` route param. REVIEW is a listing with `*[_type == "X"]`
  array query and no slug.
- **MetaFields vs MetaFieldsNoOg.** `blogPost` ships `openGraphImage`
  (full `MetaFieldsSchema`); `teamMember` and `review` use
  `MetaFieldsNoOgSchema` and require a brand-default OG fallback in
  `generateMetadata`.

Worked examples surface these per-template; the canonical template's
Section 6 + Section 4 hold the most-common shape only. Customer-2
capability take-away: per-doc-type variations (query shape, meta-
variant, optional-vs-required fields) travel in worked examples, not
in the canonical template. Canonical stays locked + universal;
examples flex per-template.

---

### Fidelity guarantee mechanisms

**TBD — Step 6 pending.**

---

### Visual Editing go-live: stega-vs-enum + browserToken (Jul 2026 productisation IP)

Brief B Step 8 (May 2026) shipped the runtime *infrastructure*; actually
turning on Presentation click-to-edit against real content (Jul 2026, while
wiring the home page) surfaced two customer-transferable lessons:

- **Strict enums are a hidden landmine for Visual Editing.** Draft /
  Presentation mode auto-enables stega (invisible per-field markers), which
  makes every string fail a strict `z.enum` / `z.literal` equality check,
  500-ing the page and showing Studio "Unable to connect". The vicious part:
  it is **invisible outside draft mode** (stega is off in normal browsing), so
  it presents as intermittent "stale error" ghosts and burns diagnosis time.
  Diagnostic tell: a page that renders 200 to cookie-less `curl` but 500s in
  the Presentation iframe → the difference is draft-mode stega, not the data.
  Fix pattern: an isomorphic `stegaEnum()` helper that `stegaClean`s the value
  before matching (keeps stega on display strings so overlays still work).
  **Transfer:** any Sanity-migration customer with strict read-model enums
  hits this the moment Visual Editing is enabled, so bake `stegaEnum` into the
  read-model scaffold from day one; never author a bare `z.enum` on fetched data.
- **`browserToken` is required for live DRAFT streaming, and it is a
  deliberate, gated exposure.** `serverToken` alone live-updates only
  published content; draft edits need a viewer-scoped `browserToken` that
  next-sanity ships to the browser *only in draft mode* (behind the
  secret-protected enable route). The security-review instinct ("no tokens in
  the client bundle") is right for write tokens and the published site, but a
  viewer/draft-read token in draft mode is the intended trade-off for the
  "edits appear live without publishing" UX. Decide it explicitly, document
  the gating, don't let a blanket rule silently disable the feature.

### Visual Editing infrastructure

Brief B Step 8 (May 2026) shipped the runtime infrastructure for
Sanity Visual Editing — single-client architecture, hardened
draft-mode routes, and the v2.2-locked CONVENTIONS entries.
Carry-forward from Step 0c: `SANITY_API_READ_TOKEN` viewer-scope
verified (only `statusCode: 403` accepted as proof per F4 v1.5;
manual Sanity dashboard confirmation 2026-05-04 —
`mygratr-design-1-read`, role=viewer, dataset=production); the
same token retasked as `defineLive` `serverToken` at Step 8.2.

#### 1. Single-client architecture (collapsed from SCAFFOLD-1 two-client baseline)

SCAFFOLD-1 shipped two Sanity clients (published + draft). DESIGN-1
Step 8.3 collapsed to a single `sanityClient` at
`site/src/lib/sanity/client.ts` (server-only) per CMA-C2 + D4. The
former draft-perspective export is replaced by a module-scope
`previewValidationClient` constructed inside `enable/route.ts` (CMA
F-7 v1.3 / F-12 v2.1). One client, two consumers, both module-scope.
The `previewClient` symbol is removed repo-wide (verified by §8.3.N
zero-match grep).

#### 2. Six-step security order — enable route invariants (never reorder)

`/api/draft-mode/enable` (GET): STEP 1 build allow-list (fail closed
on malformed env) → STEP 2 Origin/Referer check → STEP 3 secret
validation (try/catch with sanitized error per F6 + F7 v2.1) →
STEP 4 redirectTo same-origin check → STEP 5 `draftMode().enable()`
→ STEP 6 redirect. The dangerous failure mode is Set-Cookie present
on a 4XX/5XX response — proves draft-mode enabled BEFORE validation.
Tests (a)/(b)/(d.5b)/(e) verify Set-Cookie absent on every failure
path.

#### 3. F8 v2.1 literal-`"null"` guard + Pattern 13 question (a) empirical verification

Sandboxed iframes send `Origin: null` as a literal string. The allow-
list construction explicitly excludes the literal-string `"null"` and
empty-string origins inside the `.flatMap()`. Pattern 13 question (a)
was empirically verified at Step 8 close: literal-string `"null"`
(string type, not JS null) still rejects via the `callerOriginAllowed`
path because `"null"` is not in `allowedOrigins`. The two null types
(literal-string vs JS-null) are correctly distinguished by the code.
Tests (d.5a)/(d.5b) provide the regression coverage.

#### 4. BvR #34 — `NEXT_PUBLIC_SITE_URL` canonical-vs-serving-origin split

`NEXT_PUBLIC_SITE_URL` is the canonical/hreflang URL (per CLAUDE.md
Environment Variables table) — `https://staging.jakevibes.dev` for CE
— not the serving origin. In `NODE_ENV === 'development'`, the route
handler pushes `safeUrlOrigin(request.url)` (the actual serving
origin, `http://localhost:3000`) into `allowedOrigins`. Production
untouched — Vercel sets `NODE_ENV='production'` on every deploy tier.
Code fix wins over env override because env override would leak
localhost into canonical/hreflang URLs in dev, masking SEO bugs and
forcing every customer's brief to inherit the same workaround.

#### 5. BvR #35 — Sanity Presentation null/null Origin+Referer; null-origin escape hatch

Sanity Presentation strips BOTH `Origin` and `Referer` on the
iframe-initiated enable navigation — JS-null, not literal-string
`"null"`. F-1 v1.3's "Origin OR Referer must match" fallback failed
because both inputs were absent. Resolution: accept `null/null`
callerOrigin ONLY when the request bears Sanity's canonical
3-query-param signature (`sanity-preview-secret` +
`sanity-preview-perspective` + `sanity-preview-pathname`), checked via
the `hasSanityPreviewSignature` helper. The signature is trivially
forgeable — it is NOT a security boundary. STEP 3 secret validation is
the actual auth gate. Risk delta: stolen-secret attackers can enable
draft mode from any origin; draft mode is read-only preview with no
write capability, acceptable trade for matching Sanity's documented
protocol.

#### 6. BvR #36 — STEP 4 same-origin check defense-in-depth (coverage gap)

`@sanity/preview-url-secret`'s `validatePreviewUrl()` reads
`sanity-preview-pathname`, NOT a `redirectTo` query param. Brief B
v2.2 §8.7 test (c) was authored assuming the latter; result was HTTP
307 (success path) instead of the expected 400. STEP 4's same-origin
check (`target.origin !== base.origin`) is structurally correct but
cannot be exercised end-to-end through the real library API.
Documented as defense-in-depth against future library regressions.
Tech Debt #20 captures the optional synthetic unit test or
library-upgrade monitoring as future work.

#### 7. Env Schema Strictness — Zod refinements (D14 + F5 v2.1 + F12 v2.1 + M7 v2.2)

`site/src/lib/env.ts` validates every env var at module load via Zod.
Required strings use `.min(1)` (empty values fail fast); required URLs
use `.url()`; `NEXT_PUBLIC_SANITY_STUDIO_URL` uses `.optional().refine(
(val) => NODE_ENV === 'development' || val !== undefined, ...)` for
required-in-prod / optional-in-dev. The `env` import is the only
legitimate source — direct `process.env` access bypasses validation.
Module-scope defensive guards (F12 v2.1 circular-import check; M7 v2.2
optional-chaining defense) handle the case where `env` is undefined at
evaluation time.

#### 8. Sanity Presentation tool wires both `previewMode.enable` and `draftMode.enable` to a single route

`studio/sanity.config.ts` wires `presentationTool.previewMode.enable`
AND `presentationTool.draftMode.enable` BOTH to
`/api/draft-mode/enable`. The hardened handler does not need to
distinguish — uniform auth barriers (secret + Origin/Referer +
null-origin escape hatch + redirectTo same-origin) serve both flows.
Transferable rule: when a brief documents an HTTP route's behavior,
check the upstream framework's wiring configuration (not just the
route's own code) to verify whether multiple framework features share
the route.

---

### ESLint rule adoption methodology — Brief B Step 6 productisation IP

Step 6 (May 2026) closed the UI_STRINGS rule with a 2-rule architecture
(`react/jsx-no-literals` + project-local
`local/no-conditional-strings-in-jsx`). These patterns transfer to any
customer's UI_STRINGS-equivalent literal-string enforcement.

#### 1. Two-gate verification (schema introspection + fixture verification)

Before adopting a third-party ESLint rule, run two gates: (a) schema
introspection — read the rule's `meta.schema` and confirm the option
shape matches what the brief expects; (b) fixture verification — write
a minimal `RuleTester` fixture asserting the rule fires/skips on
representative inputs. Gate (a) catches version drift in rule options;
gate (b) catches behavioural drift in rule implementation. Both
mandatory.

#### 2. Narrow custom-rule supplements for known upstream AST gaps

When an upstream rule has a known AST coverage gap (e.g.,
`react/jsx-no-literals@7.37.5` misses ConditionalExpression branches),
ship a narrow custom rule supplement rather than waiting for upstream.
The supplement must be: (a) named for its specific gap
(`local/no-conditional-strings-in-jsx`); (b) scoped to ONLY the gap
(not a re-implementation of the upstream rule); (c) documented with
the upstream issue link + version reference so future upgrades can
drop the supplement when upstream catches up.

#### 3. Placeholder-as-split-template for sentence-with-link substring composition

When a UI string contains an embedded link or interactive element
(e.g., "Read our terms or contact us"), use placeholder tokens in the
canonical SoT (`{0}`, `{1}`) that split the sentence into substring
parts. The rendering layer maps placeholders to React nodes at JSX
time. Keeps the canonical string lint-clean (no embedded JSX) AND
keeps the rendered output composable.

#### 4. Coverage finding: `react/jsx-no-literals@7.37.5` ConditionalExpression branches gap

Known upstream AST coverage gap documented at Brief B Step 6.
ConditionalExpression branches (`{cond ? "a" : "b"}`) are not flagged
by the rule's current implementation. The
`local/no-conditional-strings-in-jsx` supplement closes the gap.
Re-check on every upstream upgrade — drop the supplement if/when
upstream catches up.

#### 5. UI_STRINGS canonical SoT + generated-TS file pattern (byte-idempotent, JSON/TS parity CI assertion)

`tools/eslint/ui-strings.json` (the `strings` block) is the canonical
SoT. `scripts/design/generate-ui-strings.mjs` reads the JSON and
writes `site/src/lib/ui-strings.ts`. The generator is byte-idempotent
on the TS file — re-running with no JSON changes produces a no-op git
diff. The JSON's `_meta.provenance.reconciled_at` is bumped only when
the `strings` block actually changes (not on every run). Future CI
assertion: `git diff --exit-code site/src/lib/ui-strings.ts` after
running the generator enforces parity.

#### 6. BvR #26 — ESLint 9 RuleTester silently no-ops on plugin-namespaced rules

ESLint 9's `RuleTester` silently skips test cases when passed a
plugin-namespaced rule name (`plugin/rule-name`) directly. The
RuleTester emits no failures — but no tests actually run. Resolution:
load the rule via the plugin's `rules['rule-name']` index access, NOT
via the namespaced string. Transferable rule: when a test mechanism
silent-passes, distrust the signal until you've verified it actually
executed (add a deliberate-failure case as a canary).

---

### Pattern 13 — Defensive code, tests, and probes need their own audit lens

Pattern 13 originated at v2.1 lock and was sharpened twice during Brief
B Step 8. Four layers; each layer extends the previous lens to a new
artifact type.

#### 1. Original (v2.1) — defensive guards added in response to findings need their own audit lens

When a defensive guard is added in response to a finding (e.g., F12
v2.1 circular-import check; M7 v2.2 optional-chaining defense), the
guard itself needs the same 5-question audit lens — reachability, side
effects, bypass surface, failure mode, customer transfer. Without the
lens, the guard ships untested and may itself harbour the same class
of bug it was added to prevent.

#### 2. BvR #35 sharpening (v2.2) — defensive tests share the same authoring blindspot as the finding they respond to

Curl integration tests authored from the same brief that produced the
route code encode the same assumptions as the route code. If the brief
assumed `NEXT_PUBLIC_SITE_URL` IS the serving origin (BvR #34) or
assumed iframe nav carries Origin/Referer (BvR #35), the curl tests
will encode the same assumption in their `$STUDIO_ORIGIN` /
`$ATTACKER_ORIGIN` env vars and pass cleanly while a real client sends
a DIFFERENT shape that the tests never exercise. The bug is
structurally invisible to the synthetic-origin curl test suite.

#### 3. BvR #36 sharpening (v2.2) — defensive tests against 3rd-party libraries need library-behavior probes before assertion design

When integration tests assert against a third-party library's return
value (e.g., `@sanity/preview-url-secret`'s
`validatePreviewUrl().redirectTo`), the test surface is doubly
assumption-bound — assumptions about route logic AND assumptions about
library surface. Mitigation: run a 5-minute library-behavior probe
(`console.log(validation)` for one representative request) BEFORE
writing assertion-based tests. The probe captures what the library
actually returns; assertions are written against observed behavior,
not assumed behavior.

#### 4. Manual smoke test as FIRST verification gate (3-occurrence customer 2 implication)

Brief B Step 8 surfaced three architectural findings via manual smoke
test that the synthetic-origin curl suite missed: BvR #34, BvR #35,
BvR #36. All three were structurally invisible to the suite AND
trivially visible the moment a real-client probe ran. Customer 2 brief
authoring discipline: invert the gate order — manual smoke test runs
FIRST after route hardening lands. Curl integration tests run AFTER
smoke confirms the real-client request shape. Curl tests then verify
edge cases and security regressions in a synthetic-origin envelope
that's been validated by the smoke test.

Customer 2's brief authoring inherits all 4 Pattern 13 layers as discipline.

---

### Customer-2 reusability assessment (running)

| Pattern | CE-specific | Reusable for customer-2 |
|---|---|---|
| Token values (colours, type scale, spacing) | ✅ Yes | ❌ — re-derive per customer via probe |
| Token extraction methodology (live + audit cross-reference + breakpoint sweep) | — | ✅ Methodology is fully reusable |
| Multi-namespace probe (Tailwind v4) | — | ✅ Required for any v4 customer |
| Dual-consumer motion-token pattern (`--motion-*` + `--{namespace}-*` aliases) | — | ✅ Reusable for any GSAP+Tailwind customer |
| Pre-flight third-party weight measurement | — | ✅ Reusable; `measure-third-party-weight.mjs` |
| Token-scope verification (`verify-token-scope.mjs`) | — | ✅ Reusable; `403/401-only` gate is universal |
| Hand-built-atop-Radix posture | ⚠️ Conditional | Right call when brand is opinionated; default to shadcn otherwise |
| CVA-standardised variant API | — | ✅ Reusable |
| No-className-variants rule | — | ✅ Reusable |
| SVG sprite (no icon lib) | ⚠️ Conditional | Probe icon count first; sprite wins below ~30 glyphs |
| GSAP-banned-from-primitives | — | ✅ Reusable rule of thumb |
| Probe-first discipline (Hard Rule #2) | — | ✅ Reusable; `probe-*.mjs` shape is the template |
| Per-primitive folder structure | — | ✅ Reusable; adopt from first primitive |
| Inline source-comment as primitive-level spec | — | ✅ Reusable |
| Layout-root provider mount pattern | — | ✅ Reusable |
| Form integration split (register vs Controller via FormField smart wrapper) | — | ✅ Reusable |
| HALT 10 visual-eyeball protocol | — | ✅ Reusable; non-negotiable for any customer with brand fidelity requirements |
| Probe-first dismissal protocol | — | ✅ Reusable |
| Browser cache trap (hard-refresh + cache-disabled before HALT 10) | — | ✅ Reusable |
| Demo-route width context-vs-bug distinction | — | ✅ Reusable |
| Tier-1 Component Spec Pattern (8-section format) | — | ✅ Reusable; verifier-asserted at Step 10 |
| 5 §4 Timing Provenance Shapes (named explicitly) | — | ✅ Reusable; classify tech stack first, pick matching shape |
| Render-Utility Classification (3rd category) | — | ✅ Reusable; primitive + Tier-1 component + render utility |
| Path A Mechanical Trigger (§6 GROQ-mandate gating) | — | ✅ Reusable; removes per-author ambiguity |
| TBD-pending-capture pattern (two-pass workflow) | — | ✅ Reusable; authorise at HALT-2-equivalent |
| Brief-vs-Reality Finding (parallel to schema-vs-reality) | — | ✅ Reusable; structural rule wins over brief literal |
| Tier-1 inventory walk — 4 HALT cadence (1 inventory / 2 first-spec / 3 stress-test / 4 close) | — | ✅ Reusable; format-lock-second on stress-test is the right cadence |
| Storybook 10 install workarounds (`prop-types` + `-y --no-dev` + `--builder webpack5`) | — | ✅ Reusable; ship in customer-2 onboarding CLI literal |
| ESLint flat-config + `eslint-plugin-storybook` integration | — | ✅ Reusable when host repo is flat-config |
| Framework auto-mocks awareness (`@storybook/nextjs` ships next/{image,link,font} mocks) | — | ✅ Reusable; describe outcome not implementation in briefs |
| `globals.css` over `tokens.css` for Tailwind v4 utility availability | — | ✅ Reusable; `grep -l 'tailwindcss' src/app/*.css` is the discriminator |
| `NEXT_PUBLIC_*` env config function in `.storybook/main.ts` | — | ✅ Reusable; mandatory for any schema-validated env module |
| Build-time exit-0 verifier discipline upgrade — runtime spot-check required | — | ✅ Reusable; `npx http-server storybook-static` + load one schema-touching story |
| Pair-rule per folder — mechanical count via `find ... -name stories.tsx \| wc -l` | — | ✅ Reusable; per-folder counting beats logical counting |
| Render-only stories over `args` + `argTypes` for polymorphic primitive inventories | — | ✅ Reusable when polymorphic-via-`as` primitives exist |
| Mock data discipline — Hard Rule #1 exception scoped to story files only | — | ✅ Reusable; name the exception, scope it, document the boundary |
| Tier-1 scaffold-stage rule — primitive-composition preview + ScaffoldNote panel | — | ✅ Reusable; ship design system before any pages exist |
| Vercel separate-project deploy + Framework Preset `Other` + Standard Protection | — | ✅ Reusable; `docs/design/storybook-deploy.md` runbook is the customer-2 hand-off |
| Build-infrastructure-before-deploy commit cadence (CI/CD-aware ordering) | — | ✅ Reusable; "commit between author and deploy steps, not after" |
| Brief-drafter mental-model gaps tracked as BvR finding velocity | — | ✅ Reusable as a brief-quality metric per phase |
| 6-section v0.dev prompt template — paste-as-is + per-template fill-in split | — | ✅ Reusable; identify universal sections, lock as paste-as-is |
| Self-explaining placeholder discipline (no roadmap-leaky "Step N" refs; PLACEHOLDER_REPLACE_ME naming) | — | ✅ Reusable; review at HALT-equivalent for placeholder names |
| Worked-example-as-clarification (2-3 examples spanning schema shape-variation) | — | ✅ Reusable; choose examples that exercise distinct variations |
| Schema-vs-reality findings carried into derivative artefacts (worked examples) | — | ✅ Reusable; findings travel with the artefact that generates output |
| Storybook URL as live primitive-shape reference in prompt template Section 2 | — | ✅ Reusable when Storybook IS deployed at design system phase |
| Per-doc-type variation in worked examples; canonical template stays universal | — | ✅ Reusable; query shape + meta-variant + optional-fields all flex per-example |
| Single-client architecture (collapsed from SCAFFOLD-1 two-client) | — | ✅ Reusable; default architecture for any Sanity-migration customer |
| `defineLive` + viewer-scoped `serverToken` pattern | — | ✅ Reusable as-is |
| Six-step security order on `/api/draft-mode/enable` (GET) | — | ✅ Reusable; never reorder; F-2 v1.3 invariant |
| Dual Origin+Referer check on `/api/draft-mode/disable` (POST) | — | ✅ Reusable; CMA F-3 v1.3 Option A |
| F8 literal-`"null"` allow-list guard | — | ✅ Reusable; sandboxed-iframe defense applies to any web stack |
| BvR #34 dev-only allow-list expansion (NODE_ENV-gated) | — | ✅ Reusable; canonical-vs-serving split is universal |
| BvR #35 Sanity null-origin escape hatch (`hasSanityPreviewSignature`) | ⚠️ Sanity-specific | Sanity migrations: as-is. Future CMS swap: rename helper + signature constants; architecture pattern transfers |
| BvR #36 STEP 4 defense-in-depth posture | — | ✅ Reusable; document coverage gap in customer 2 brief §8.7 equivalent |
| Env Schema Strictness — Zod `.url()` / `.min(1)` / conditional `.refine()` | — | ✅ Reusable verbatim; customer-2 overrides only the per-customer defaults |
| `previewValidationClient` module-scope instance pattern | — | ✅ Reusable; one client per security boundary, not on long-lived module export |
| Manual smoke test as FIRST verification gate (Pattern 13 layer 4) | — | ✅ Reusable; invert v2.2 brief's §8.7 ordering for customer 2 |
| Library-behavior probe before assertion design (Pattern 13 layer 3) | — | ✅ Reusable; 5-min probe closes the assumption gap |
| Visual Editing Method Probe Discipline (§8.4 probe artifact pattern) | — | ✅ Reusable; capture observed shape under `audit-output/{phase}/` per D15 |
| §8.7 integration test corpus (a/b/d.1-4/d.5a/b/e) | — | ✅ Reusable; STEP 4 negative test still missing (Tech Debt #20) |

> **TODO (post-customer-2 onboarding):** add an "effort estimate" column
> to this matrix once customer-2 onboarding generates real data points.
> Initial unmeasured guesses to anchor: token extraction methodology
> ~1–2 days probe + extraction; probe-first discipline ongoing during
> build; HALT 10 protocol ~half-day visual review. Replace these with
> measured numbers when customer-2 actually runs.

---

## TEMPLATE-BLOG — Pattern-establishing first detail-page template (May 2026)

### Pattern 13 Layer 4 sharpening — load-bearing productisation IP for this phase

TEMPLATE-BLOG surfaced **five distinct sub-examples** of Pattern 13
Layer 4 ("probes need probing") during execution. Collectively, they
sharpen the productisation rule from a single-layer principle into a
five-layer audit lens that customer 2's template phases will inherit.
Each sub-example was a near-miss in HALT 2 or HALT 3 — caught at the
self-correction window, not at user-facing impact.

1. **Status-code probes ≠ hydration probes.** `curl -w "%{http_code}"`
   returning HTTP 200 does NOT exercise React hydration. A page can
   200-OK at the server while a `<script>` mounted inside JSX
   `<head>` blocks client hydration (Next.js 16 + React 19 warning
   "Encountered a script tag while rendering React component"). Caught
   at BvR #41 era — Jake's browser-DevTools eyeball found it after
   §12.3 curl tests all green.

2. **Diagnosis itself needs Pattern 13.** The first proposed fix for
   the layout.tsx script-tag warning (Option A — move scripts to
   `<body>`) was a Pattern 13 layer 4 violation BY THE DIAGNOSIS
   ITSELF. The proposed fix was speculation; reverting it (load-bearing
   zero) preserved the actual current behavior intact for SCAFFOLD-AUDIT
   to address properly. Self-correction at execution time.

3. **HTTP 200 ≠ script executed.** Finsweet Attributes v2 ESM loaded
   via a classic `<Script>` tag returns HTTP 200 + correct
   `Content-Type: application/javascript` from the CDN, but throws
   `Cannot use import statement outside a module` at the BROWSER on
   parse — completely invisible to status-code probes. The script
   never executes; downstream features that depend on it (CMS-list,
   list-combine) silently fail. BvR #45, surfaced only when Jake's
   DevTools showed the red error. **Status checks don't prove
   execution.**

4. **Diagnostic probes themselves need probing.** A grep regex like
   `hreflang="[^"]+"` is case-sensitive in standard regex flavors.
   Next.js metadata API emits the attribute as `hrefLang` (React JSX
   camelCase). My grep missed all 3 hreflang tags + I almost halted
   §12.3 Test 6 on a false-positive. The fix wasn't a code change;
   it was widening the regex's case-sensitivity. **Your own
   diagnostic tool's behavior is a probe-able assumption.**

5. **Build-time-generated routes need build-time env vars.** Next.js
   `MetadataRoute.*` file-based routes (`robots.ts`, `sitemap.ts`,
   `opengraph-image.ts`) are STATICALLY GENERATED at `npm run build`
   unless explicitly marked `dynamic = 'force-dynamic'`. Setting
   `VERCEL_ENV=production` only on `npm run start` leaves a stale
   build artifact. Caught at HALT 3 Checkpoint C2 when robots.txt
   STILL served `Disallow: /` after `VERCEL_ENV=production npm run start`.
   Solution: mirror Vercel's deploy semantics — set the env on `npm run build`
   too. Locked as new CONVENTIONS entry "Next.js Statically-Generated
   Routes + VERCEL_ENV at Build Time."

6. **Plans encode prior-phase diagnoses verbatim. Checkpoint 1 is the
   validation layer.** Surfaced at MYGRATR-CONTENT-1E HALT 1 (the 6th
   sub-example, added after the TEMPLATE-BLOG matrix of 5). The
   CONTENT-1E plan, CLAUDE.md Tech Debt #25, and the TEMPLATE-BLOG
   HALT 3 diagnostic at `audit-output/template-blog/rich-text-gap-analysis.md`
   all asserted the Webflow embed wrapper was `<div class="w-embed">`.
   This was wrong: the Webflow RichText API returns
   `<div data-rt-embed-type='true'>`; the `w-embed` class only exists
   on the published Webflow site (post-render). The first probe run
   against `div.w-embed` found ZERO table embeds across the entire
   corpus — surfacing the misdiagnosis BEFORE any schema or migrator
   work landed. Probe re-authored with corrected selector, 167 embeds
   immediately surfaced. **The pattern:** a plan locked from
   prior-phase diagnostic notes may carry forward incorrect technical
   assumptions — Checkpoint 1's probe execution is the structural
   validation layer that catches these before they propagate
   downstream into schema, migrator, renderer, and verifier code. The
   same skepticism principle as sub-examples 1-5, applied one level
   up: "don't trust the plan's encoded diagnoses; probe them at
   Checkpoint 1 against current reality."

### Customer-2 reusability

This 6-sub-example matrix becomes the canonical audit lens for any
template-* / content-* phase debugging. Each sub-example reinforces
the others — status≠hydration in (1) parallels HTTP200≠script-executed
in (3); the self-referential "diagnosis itself" in (2) parallels
"probes need probing" in (4); the build-vs-runtime gap in (5) is its
own structural class but follows the same skepticism principle; (6)
extends the skepticism one level up to the plan-encoded prior-phase
diagnosis. **Apply all six when triaging a Lighthouse / curl /
browser-console / build-output / plan-vs-reality gap that doesn't
match the assumed cause.**

### Other productisation IP surfaced in this phase

| Pattern | Reusability | Notes |
|---------|-------------|-------|
| Detail-Page Template Pattern (four-file layout) | ✅ Locks for all 12 future TEMPLATE-* phases | Route + GROQ/Zod + template + JSON-LD; single-responsibility per file |
| Sanity Perspective Discipline | ✅ Customer-2 inherits as-is | `sanityFetch` exclusive in app/ + components/templates/; bare client for build-time |
| Parameterized GROQ Only | ✅ Customer-2 inherits as-is | `$paramName` + `params` object; no template-literal interpolation |
| JSON-LD XSS-Safe Serialization | ✅ Customer-2 inherits as-is | `serializeJsonLd` helper applied uniformly; CMA F4 v1.3 pattern |
| Read-Model Zod Co-Location | ✅ Customer-2 inherits as-is | site/src/types/sanity/ holds runtime-fetch types; orchestrator src/ holds Studio editorial types |
| `URL_BUILDERS` sitemap dispatch | ✅ Each TEMPLATE-* adds one entry | Single-fetch + per-type path composition; future templates extend `URL_BUILDERS` only |
| Spot-check variation-axis URL selection | ✅ Reusable across templates | Greedy coverage across 6 variation axes (per-category + nullable-author + tldr + faq + images + body-length) |
| BvR ledger pattern | ✅ Continuing from DESIGN-1 | 10 new findings #37-#46 + 1 cancelled #47; ledger lives in PHASE_HISTORY entry; numbering monotonic |

## CONTENT-1E — Webflow w-embed Recovery (May 2026)

### Pattern 13 Layer 4 — 6th sub-example added (see above)

Plan-encoded prior-phase diagnoses need Checkpoint 1 validation.
Extends TEMPLATE-BLOG's 5-example matrix; same skepticism principle
applied to the plan itself.

### Other productisation IP surfaced in this phase

| Pattern | Reusability | Notes |
|---------|-------------|-------|
| Post-Phase Content Mirror Constraint | ✅ Customer-2 inherits as-is | `content[]` is canonical mirror of Webflow RichText until ContentReady-1; manual Studio edits don't survive re-migration; locked in new CONVENTIONS section |
| Webflow RichText Embed Selector | ✅ Customer-2 inherits as-is | Use `div[data-rt-embed-type]` (NOT `div.w-embed`) and `figure.w-richtext-figure-type-video`; `w-embed` class only exists on published site |
| Dedup-aware migrator pre-flight | ✅ Customer-2 inherits as-is | `classifySweepTargets()` → {existing, dedupedToCanonical, orphan}; skip deduped with audit log; halt on orphan; patch existing. Required wherever CONTENT-1C-analog multi-collection dedup runs |
| Pre-patch snapshot escape hatch | ✅ Customer-2 inherits as-is | Write current Sanity field state to `audit-output/{phase}/pre-patch-snapshots/` BEFORE `.set()`. Disk-side rollback for destructive content patches |
| Halt-on-first-failure with full-context recordMigration | ✅ Continuing from CONTENT-1D-CLEANUP | Per-doc guards trigger `break` on mismatch; recordMigration captures `errorLog` + partial-progress count; re-run from scratch model |
| Deterministic _key for migrated blocks | ✅ Customer-2 inherits as-is | `{type}-{webflowId}-{position}` scheme via opt-param to `toPortableText`; idempotent across re-runs against unchanged source. Plain text-block `_key`s remain block-tools-random (acceptable — semantic content stable) |
| Header-row promotion regardless of `<thead>` wrapper | ✅ Customer-2 inherits as-is | Detect any `<tr>` whose direct cells are all `<th>` and promote to `headerRows[]`; handles Webflow tables that put header inside `<tbody>` (7 of 153 in CE corpus) |
| Schema round-trip as deploy verifier | ✅ Customer-2 inherits as-is | Write a smoke-test doc carrying the new `_type`, read back, delete. If Studio rejects unknown type, the write throws — caught by the verifier before claiming "deployed" |
| Scope variance accounted for in PHASE_HISTORY | ✅ Customer-2 inherits as-is | When plan estimate proves materially wrong (3-8× here), document ratio explicitly so future-phase planning is informed by past variance |

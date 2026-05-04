# MYGRATR-DESIGN-1 — Design Tokens, Primitive Components, Complex-Component Specs, Storybook, Visual Editing, Fidelity Guarantees

| Field | Value |
|---|---|
| Phase ID | MYGRATR-DESIGN-1 |
| Brief version | v1.2 |
| Status | DRAFT — pending cross-model audit (preset:full) |
| Predecessor | MYGRATR-CONTENT-1D-CLEANUP (closed 2026-05-02) |
| Successor | MYGRATR-TEMPLATE-* (simple templates first: BLOG, TEAM_MEMBER, REVIEW, VIDEO, BOOK_A_CALL, DOWNLOAD) |
| Operating posture | Jake + Claude Code primary executor. Surgical dev consult only on blockers exceeding the half-day rule (Roadmap §0). Budget envelope $0–2000 across entire CE migration. |
| Estimated runtime | ~2.5–3 weeks of focused work (~21 working days). Heavily front-loaded: ~65% spec-writing, ~35% code construction. Rebaselined from v1.0's 1.5–2 weeks after self-audit; per-step numbers in §13 honestly reflect the locked scope. |
| Cross-model audit target | `preset:full` (~$1.00–$2.00). Justified: structural patterns being established, fidelity-guarantee mechanisms must hold under adversarial review, Visual Editing infrastructure has known import-path drift across Sanity/next-sanity versions. |

---

## Brief changelog

- **v1.2 (2026-05-03):** Second self-audit pass — caught residual v1.0 fragments missed by v1.1's surgical sweep. 4 critical / 5 important / 3 minor. All landed. Key corrections: (C1.1) Hard Rule #5 rewritten to remove wrapper-component framing; (C1.2) Hard Rule #7 path corrected to `site/src/components/templates/`; (C1.3) Step 5 v0.dev prompt template path + slug case corrected; (C1.4) Step 6 Output line rewritten with correct rule name + path + ESLint version attribution; (I1.1) §0 authoritative-inputs convention count corrected from 4 to 6 with updated names; (I1.2) Step 9 capability-log structure guidance unstaled; (I1.3) §11 reusable-primitives table row for Visual Editing rewritten; (I1.4) §13 runtime arithmetic made explicit (19.5 build + 1.5 recovery = ~21); (I1.7) Step 11 "five new sections" → "six"; minors: heading consistency, audit-output sub-dir reference, TIER_1_INVENTORY versioning note.
- **v1.1 (2026-05-03):** Self-audit findings applied (4 critical / 9 important / 7 minor). Surgical edits, no structural reflow. Key corrections: (C1) Step 7 worked example rewritten to cite only schema-verifiable fields, schema-vs-reality reconciliation sub-step added; (C2) Sub-step 8d Vercel routing rewritten to use dashboard "Domains" config rather than bogus `vercel.json` aliasing; (C3) verifier check #19 uses `previewClient.config()` not source-text grep; (C4) Step 8 smoke test now renders `homePage.heroHeadline` from seeded singleton to give stega payload to click; (I1) UNKNOWN dropped from 15-template set, TAXONOMY surfaced for Jake verification, count adjusted to 13 confirmed + 1 pending; (I2) runtime rebaselined to 2.5–3 weeks; (I3) lint rule rewritten using `eslint-plugin-jsx-no-literals` with `allowedStrings`; (I4) GSAP timing extraction uses Playwright instrumentation shim; (I5) Step 0 metadata refresh sub-step added; (I6) round-trip targets distinguished (10s click→Studio, 5s publish→preview); (I7) Vercel plan question surfaced in §12; (I8) `<VisualEditingProvider>` wrapper component dropped — replaced with `sanityFetch` data-fetch pattern + render-discipline conventions; (I9) `site/src/components/templates/` location locked.
- **v1.0 (2026-05-03):** Initial draft. Six locked scoping decisions from prior planning session embedded. Step ordering: 0 → 11. Tier-1 audit (Step 3) precedes complex-component spec writing. Step 6 (fidelity mechanisms) precedes Step 7 (per-template reference docs) so the structural-diff config has a concrete consumer pattern when reference docs are produced.

---

## 0. Authoritative inputs

Read in this order before executing any step:

1. `MYGRATR_PHASE_ROADMAP_v2.md` — §0 operating posture, §3.0 spec-quality reframe, §3.1–§3.7 DESIGN-1 deliverables, §3.7 fidelity guarantees, §3.9 (this brief introduces §3.9 — Visual Editing infrastructure as a sub-section), §5 risk register (§5.7–§5.9 directly relevant), §11 capability development.
2. `MYGRATR_FULL_SCOPE_v0_1.md` — master scope.
3. `CLAUDE.md` — current state. `migrations.status = content_complete`. 388 CMS docs. Tech Debt #15 closed; #16 and #17 open and not blocking.
4. `CONVENTIONS.md` — 7 patterns established through CONTENT-1D-CLEANUP. DESIGN-1 adds 6 more (Token System, Component Specification, Storybook Story, Sanity Fetch, Render-Discipline, Template Location — see Step 11). Total post-DESIGN-1: 13.
5. `CE_SITE_TRUTH.md` — 15 template types, 33 collections, 602 indexable pages, 17 global third-party scripts, GSAP 3.12.5 in use, Swiper, Finsweet, Calendly.
6. `MYGRATR_SCHEMA_DESIGN_DECISIONS.md` v1.2 — especially §10 routing table for the per-template reference doc pass.
7. `MYGRATR-CONTENT-1D_BRIEF_v1.2.md` — structural template. Mirror its section ordering, the changelog block, the audit-prompts pattern (§10), the hard rules section, the post-phase update protocol.

If any of these conflict with this brief, halt and escalate to Jake. Do not silently reconcile.

---

## 1. Locked scoping decisions (from prior planning session, do not re-litigate)

| # | Decision | Lock |
|---|---|---|
| D1 | Success criteria | **Option B — Comprehensive specification system.** All Tier-1 specs written upfront before any TEMPLATE-* phase starts. Per-template reference docs for the 13 confirmed template types (UNKNOWN dropped per I1; TAXONOMY conditional on §12.6). Some Tier-2 primitives included (Modal, Dialog, Tooltip, Badge, Tag). Capability log scaffolded with first entry. |
| D2 | Designer consult | **None.** Jake + Claude Code clone the site. Goal: functional and visual equivalence, not byte-equivalent rendering. Targets: 100% content / 100% SEO / 95–98% visual on simple templates / 85–95% on animation-heavy templates. |
| D3 | Visual Editing wiring | **Option C — Foundation in DESIGN-1, applied incrementally per template.** Stega encoding, draft mode handlers, Vercel preview routing all set up here. The "applied incrementally per template" piece is **two CONVENTIONS.md patterns** (Sanity Fetch Pattern + Render-Discipline Pattern), not a wrapper component — the wrapper-component framing in v1.0 was corrected via I8 self-audit. Each TEMPLATE-* follows the conventions; verifier and lint rule enforce structurally. Workflow goal: Seb clicks any text/image on the live preview → jumps directly into Studio at that exact field. **Two distinct round-trips** (per I6 self-audit): **A** click-to-edit ~10s; **B** publish-to-preview ~5s (per Roadmap §4.4). |
| D4 | Tier-1 component count | **Option C — Half-day audit pass at start of Step 3.** Best estimate 5–10 components. Lock the count from the audit. Output: `docs/design/TIER_1_INVENTORY.md` — markdown doc listing each Tier-1 component with screenshot/screen-recording references, behaviour summary, complexity rating (Tier 1 high / medium / low). Deliverable, not a vibe check. |
| D5 | Storybook scope | **Option B — Primitives + Tier-1 complex components.** Each gets a story showing variants/states/breakpoints (primitives) or animation/interaction in isolation (complex). Tier-2 composition examples NOT in scope. Storybook deployed to a subdomain so reviews can be shared. |
| D6 | Capability log | **Option A — DESIGN-1 creates `docs/CAPABILITY_LOG.md` as Step 9 deliverable.** First entry covers token system architecture decisions, primitive component patterns adopted, Storybook setup approach, complex-component specification methodology, Visual Editing infrastructure choices. Maintained per phase from here. |

**Spec-quality framing (Roadmap §3.0):** DESIGN-1 is not a "build a design system" phase. It's a "build a specification system precise enough that the next phase produces correct first drafts" phase. Time allocation: ~65% spec / ~35% code. The four-tier specificity model applies (Tier 1 max-spec, Tier 2 convergent, Tier 3 medium, Tier 4 low).

---

## 2. Pre-phase state (verified)

### Repo state

- Current branch: `main`. Last merge: `feat/content-1d-cleanup` (CONTENT-1D-CLEANUP).
- `site/` exists, Next.js 16 app, Vercel root directory. Layout, root page, UK locale routes, third-party-scripts component, locale provider, draft-mode handlers, Sanity client + preview client, redirects pipeline — all live from SCAFFOLD-1.
- `studio/` exists, Sanity Studio v5 deployed at `mygratr-cloudemployee.sanity.studio`. 71 schema types. Presentation Tool wired in `sanity.config.ts` (imported from `sanity/presentation`).
- `site/src/components/ui/` does **not** yet exist. shadcn/ui not yet initialised. Tailwind config is the create-next-app default (overwriting that is part of Step 1).
- `.storybook/` does **not** yet exist.
- `docs/design/`, `docs/templates/`, `docs/components/` do **not** yet exist.
- `docs/CAPABILITY_LOG.md` does **not** yet exist.
- ESLint config is the Next.js default. No string-literal lint rule yet.
- Playwright is installed (used in CONTENT-1D for live-site meta scraping). No structural-diff config yet.

### Data state

- `migrations.status = content_complete`, `current_phase = content_complete`, `metadata.content_phase = { total_cms_docs: 388, smoke_test_docs_remaining: 0, content_migrations_rows: 38 (stale-low; actual 42 incl. CONTENT-1D-CLEANUP audit rows), completed_at: 2026-05-02 }`.
- 388 CMS docs in Sanity production. All `parity_score=100` across 42 `content_migrations` rows.
- DESIGN-1 does **not** transition `migrations.status`. There is no `design_running` / `design_complete` state in `pipeline/state-machine.ts`. DESIGN-1 is a **build phase that operates against the `content_complete` state without transitioning out of it**. Step 11 confirms this is intentional and reflects it in the post-phase docs.

### Token state (open)

- Tech Debt #15 — `SANITY_MIGRATION_WRITE_TOKEN` rotation: **CLOSED** 2026-05-03 (rotated to `mygratr-templates-write`). DESIGN-1 does not write any documents to Sanity. Read-only token (`SANITY_API_READ_TOKEN`) used by `previewClient` is sufficient.
- Tech Debt #16 (`customerStory.companyLogo` schema relax): **OPEN, not blocking.** DESIGN-1 surfaces this as a per-template visual reference doc note for the customerStory template in Step 7 (template fallback for missing logo).
- Tech Debt #17 (10 doc types not yet scanned for migrator-pattern null-literal issue): **OPEN, not blocking.** DESIGN-1 does not run the closure scan. Step 11 carries the reminder forward.

---

## 3. Out of scope (explicit)

To prevent scope creep, none of the following are in DESIGN-1:

- Designer engagement of any kind. Goal is functional + visual equivalence, not pixel-perfect parity (Decision D2).
- Tier-2 composition examples in Storybook (decision D5).
- Byte-perfect Webflow → Next.js parity. Reverse-engineering Webflow's rendering quirks is wasted effort.
- TEMPLATE-* component construction. DESIGN-1 produces specs and primitives; TEMPLATE-* phases compose primitives + Sanity data into pages.
- Animations beyond the Tier-1 set identified in Step 3 audit. Scroll-triggered effects on non-Tier-1 sections are TEMPLATE-* concerns.
- Studio UX upgrades (custom inputs, structure tool refinement, plugin installation). That's STATIC-1.
- Closure scan for Tech Debt #17.
- `customerStory.companyLogo` schema relax for Tech Debt #16. Surfaced as a template-fallback note only.
- Lighthouse / Core Web Vitals tuning. That's QA-1.
- Redirect verification. That's QA-1.
- Studio bulk operations panels. STATIC-1.
- Beem `SanityAdapter` work. Separate product; do not let scope bleed.

---

## 4. Hard rules (non-negotiable)

These hold across every step of this phase. Violating any one is grounds to halt and escalate.

1. **Sanity is the source of truth for all rendered marketing copy.** No template renders an English string literal that will appear as marketing copy on the live site. Step 6 enforces this with a lint rule.
2. **No fabrication of CE site facts.** If a piece of CE design / behaviour information is not in `CE_SITE_TRUTH.md`, not in `audit-output/`, and Jake hasn't explicitly confirmed it from the live site, the brief / spec / reference doc says **unknown** and prompts Jake. The audit was done so architectural decisions could be made on real data.
3. **Tier-1 audit (Step 3) locks the Tier-1 set before any complex-component spec is written.** No spec is drafted for a component not in `TIER_1_INVENTORY.md`. Adding a component post-lock requires explicit brief deviation entry and version bump.
4. **Storybook stories are a deliverable, not aspirational.** A primitive without a story is not Done. A Tier-1 complex component without a story is not Done. The Step 10 verifier asserts file existence per primitive / per Tier-1 component.
5. **Visual Editing wiring uses the import paths that exist in the current package versions.** SCAFFOLD-1 already discovered three brief-mandated import paths that don't exist in current `next-sanity` / `sanity` versions (recorded in PHASE_HISTORY MYGRATR-SCAFFOLD-1 §"Surprises"). Step 8 uses the verified-current paths: `next-sanity/visual-editing` for the layout-level `<VisualEditing />` component (already in place from SCAFFOLD-1), `sanity/presentation` (not `@sanity/presentation`) for Studio config, `defineLive({ client })` (not the deprecated re-export) for live queries. There is no per-template wrapper component (per I8 self-audit) — per-template wiring is the Sanity Fetch + Render-Discipline conventions documented in Step 11.
6. **Capability log entries are written during the phase, not after.** Each step that introduces a pattern adds a paragraph to the running CAPABILITY_LOG draft (in `/tmp/` or a working file) before moving on. Step 9 consolidates and formalises. Writing the log after the fact loses the texture of the actual decisions.
7. **No string literal in template files (`site/src/components/templates/**`) outside the defined enum exemptions.** Step 6 ESLint rule (`eslint-plugin-jsx-no-literals` configured with `allowedStrings: Object.values(UI_STRINGS)`) enforces this. UI chrome (button labels, error messages) lives in design tokens or the `UI_STRINGS` enum.
8. **The Step 10 verifier throws on first failure.** Same pattern as `verifyContent1D`. Never returns boolean. CLI entrypoint runs without try/catch so the exit code propagates.

---

## 5. Step-by-step build order

### Step 0 — Pre-flight + branch

**Pre-flight checks (read-only; halt on any failure):**

1. `git status` clean, on `main`, up to date with `origin/main`.
2. `npm run build` in repo root passes.
3. `npm run build` in `site/` passes (Next.js).
4. `npm run build` in `studio/` passes (Sanity Studio).
5. Read `migrations.status` from Supabase. Assert `=== 'content_complete'`.
6. Assert `metadata.content_phase.total_cms_docs === 388`.
7. Assert `SANITY_MIGRATION_WRITE_TOKEN` and `SANITY_API_TOKEN` (legacy) are present in `.env` for inventory completeness, and `SANITY_API_READ_TOKEN` is present in `site/.env.local`. **None of these are written to in DESIGN-1.**
8. Assert `audit-output/` exists locally (gitignored — Jake confirms presence). Required for Step 7 reference doc construction. Step 1 sub-step 1a creates `audit-output/design-1/` for GSAP timing extraction output. If `audit-output/` absent, halt.

**Branch:**

```bash
git checkout -b feat/design-1
```

**Working directories created:**

```bash
mkdir -p docs/design docs/design/components docs/templates
mkdir -p site/src/components/ui site/src/components/templates
mkdir -p tools/qa
mkdir -p .storybook
```

`.gitignore` extension if needed: `.audit/output/` already covered, no new ignores expected.

**Sub-step 0a — Stale metadata refresh (I5):**

`migrations.metadata.content_phase.content_migrations_rows` is recorded as 38 (CONTENT-1D state) but actual is 42 (38 + 4 CONTENT-1D-CLEANUP audit rows). PHASE_HISTORY notes the deferred fix. DESIGN-1 is a phase boundary; cheaper to fix it now than read-and-reconcile every future planning session.

```sql
-- Run via Supabase SQL editor (direct Postgres still broken per Tech Debt #12)
update migrations
set metadata = jsonb_set(
  metadata,
  '{content_phase,content_migrations_rows}',
  to_jsonb(
    (select count(*) from content_migrations
     where migration_id = 'ce000000-0000-0000-0000-000000000002'
       and org_id = 'ce000000-0000-0000-0000-000000000001')
  )
)
where id = 'ce000000-0000-0000-0000-000000000002';
```

Verify: `select metadata->'content_phase'->'content_migrations_rows' from migrations where id = 'ce000000-0000-0000-0000-000000000002';` → expect `42`.

This is a metadata refresh, not a state transition. `migrations.status` stays `content_complete`.

**Sub-step 0b — Lock ESLint config style (M7):**

```bash
# Determine which config the repo uses
ls -la eslint.config.* .eslintrc.* 2>&1 | grep -v "No such"
cat package.json | grep eslint
```

Lock the answer in this brief's working notes before writing the custom rule in Step 6. ESLint 9 (flat config, `eslint.config.mjs`) and ESLint 8 (legacy, `.eslintrc.cjs`) have different rule registration mechanics.

**Commit point:** `chore(design-1): branch + scaffold dirs + metadata refresh`.

---

### Step 1 — Design tokens audit + Tailwind config (~1 day)

**Output:**

- `docs/design/TOKENS.md` — markdown reference (single source of truth for what each token *means* and where it was extracted from on the live site).
- `site/tailwind.config.ts` — overwrites the create-next-app stub.
- `site/src/styles/tokens.css` — CSS-var consumption layer.
- `site/src/styles/globals.css` — imports `tokens.css`, base resets, Tailwind directives.

**Process:**

1. **Extract tokens from the live site, not from inference.** Use Playwright (already installed) or a one-shot script that loads `cloudemployee.io` in headless Chromium and extracts:
   - Computed colors of brand-significant elements (primary CTA, secondary CTA, body text, headings, link colours, focus rings, dark surfaces).
   - Computed typography (font-family, weights actually loaded, base size, line-heights, scale ratios).
   - Computed spacing of section padding, gutter widths.
   - Border radii used on cards, buttons, inputs.
   - Shadow definitions if any (`getComputedStyle(...).boxShadow`).
   - Responsive breakpoints from CSS media queries (parse the loaded stylesheets).
   - Animation durations from GSAP timeline configs. **GSAP 3.12.5 is in `body_start` per CE_SITE_TRUTH.md §5.** Timeline definitions live in CE's Webflow custom code (minified), so reading them by hand is tractable but tedious. Use the runtime instrumentation approach in Sub-step 1a instead.

**Sub-step 1a — GSAP timing extraction via instrumentation shim:**

GSAP timelines are constructed at runtime by minified Webflow custom code. Reading the source is unreliable. Instead, ship a Playwright script that injects an instrumentation shim *before* GSAP loads, capturing every `gsap.to`, `gsap.from`, `gsap.fromTo`, `gsap.timeline`, and `gsap.set` call's args.

```ts
// scripts/design/extract-gsap-timings.ts (skeleton)
import { chromium } from 'playwright';
import fs from 'fs/promises';

const SHIM = `
  (() => {
    const log = [];
    window.__gsapShim = log;
    let realGsap = null;
    Object.defineProperty(window, 'gsap', {
      configurable: true,
      get() { return new Proxy({}, {
        get: (_, prop) => {
          if (!realGsap) return () => {}; // not yet loaded
          const orig = realGsap[prop];
          if (typeof orig !== 'function') return orig;
          return (...args) => {
            log.push({ method: String(prop), args: JSON.parse(JSON.stringify(args, replacer)) });
            return orig.apply(realGsap, args);
          };
        }
      }); },
      set(v) { realGsap = v; }
    });
    function replacer(_, v) {
      if (typeof v === 'function') return '<fn>';
      if (v instanceof Element) return '<' + v.tagName.toLowerCase() + '>';
      return v;
    }
  })();
`;

async function extract(url: string, slug: string) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.addInitScript(SHIM);
  await page.goto(url, { waitUntil: 'networkidle' });
  // Scroll through to trigger scroll-bound timelines
  await page.evaluate(async () => {
    const total = document.body.scrollHeight;
    for (let y = 0; y <= total; y += window.innerHeight / 2) {
      window.scrollTo(0, y);
      await new Promise(r => setTimeout(r, 400));
    }
  });
  const log = await page.evaluate(() => (window as any).__gsapShim);
  await fs.writeFile(`audit-output/design-1/gsap-${slug}.json`, JSON.stringify(log, null, 2));
  await browser.close();
}
```

Run against the homepage and any Tier-1 candidate page identified in Step 3. Output captures `duration`, `ease`, `stagger`, `delay` fields directly from the timeline construction calls. Token extraction reads from `audit-output/design-1/gsap-*.json` and consolidates duration/easing values into named tokens.

This script is a customer-2 reusable primitive. Record in CAPABILITY_LOG.

2. **Cross-reference with CE_SITE_TRUTH.md** where the audit captured them. Where audit data is silent, the live extraction wins; record the source per token.
3. **Document each token with its source:** `--color-primary: #XXX (extracted from .cta-primary on /, computed at 1440×900)`. This is the audit trail that survives a "did we actually look at the live site or did the LLM invent this" question.
4. **Tailwind config:** named tokens only. No raw hex / px / ms in template files (Step 6 lint rule will not block these in `tailwind.config.ts` itself — only in template files).
5. **CSS variables in `tokens.css`** for runtime themability (light/dark if CE has either; if not, single mode but the architecture supports adding one).

**Token categories (locked):**

- Color: brand, neutral grayscale (10 steps), semantic (success/warning/danger/info), surface (card / nav / modal backgrounds).
- Typography: font family (loaded fonts only), weight set, type scale (display/h1/h2/h3/body/small/caption).
- Spacing: 4px-base scale, named section padding (small/medium/large/xl).
- Radii: button-sm / button-md / card / input / pill.
- Shadows: elevation-1 through elevation-4 (define if CE doesn't have a shadow system; record decision in TOKENS.md).
- Motion: duration-fast / duration-base / duration-slow, easing-standard / easing-emphasized / easing-decelerate, plus any GSAP-specific values found.
- Breakpoints: lock CE's actual responsive breakpoints. Tailwind defaults likely won't match — overwrite.

**Capability log draft:** add paragraph on token extraction methodology — "extracted from live site at 1440×900 + 768 + 375 breakpoints, cross-referenced with audit-output, source recorded per token."

**Commit point:** `feat(design-1): design tokens + Tailwind config`.

---

### Step 2 — Primitive component inventory + build (~2.5 days)

**Output:**

- `docs/design/COMPONENTS.md` — primitive inventory with anatomy, states, variants per primitive.
- `site/src/components/ui/{component}.tsx` — one file per primitive.
- `site/src/components/ui/{component}.stories.tsx` — Storybook story per primitive (Step 4 wires Storybook itself; the stories themselves are written here so primitives ship with their stories in the same commit).

**Primitives (locked set; ~20 components):**

Use shadcn/ui where applicable (`npx shadcn@latest init`, then `npx shadcn@latest add <component>` per primitive). Hand-tune away from defaults per Roadmap §5.8 (AI-aesthetic perception risk).

| # | Primitive | Source | Variants / States |
|---|---|---|---|
| 1 | Button | shadcn base, hand-tuned | primary / secondary / tertiary / icon-only / with-arrow / ghost; default / hover / active / focus / disabled / loading |
| 2 | Card | hand-built | article / customer-story / technology / team-member / review / generic |
| 3 | Input (text) | shadcn base | default / focus / error / disabled |
| 4 | Input (email) | shadcn base | same as text |
| 5 | Textarea | shadcn base | same as text |
| 6 | Select | shadcn base | default / open / focus / disabled |
| 7 | Checkbox | shadcn base | unchecked / checked / indeterminate / disabled |
| 8 | Radio | shadcn base | unchecked / checked / disabled |
| 9 | FileUpload | hand-built | empty / selected / uploading / error |
| 10 | NavLink | hand-built | default / hover / active / current-route |
| 11 | Breadcrumb | hand-built | full / truncated |
| 12 | Pagination | hand-built | first / middle / last / single-page |
| 13 | Badge | shadcn base | default / outline / muted / accent |
| 14 | Tag | hand-built (CMS-driven, similar to Badge but routable) | default / hover |
| 15 | Modal | shadcn dialog base | default / scrollable-content |
| 16 | Dialog | shadcn dialog base | confirmation / form-embedded |
| 17 | Tooltip | shadcn base | top / bottom / left / right |
| 18 | Loading state | hand-built | skeleton / spinner / progressive |
| 19 | Empty state | hand-built | no-results / empty-collection / error-fallback |
| 20 | Icon | hand-built wrapper around CE's icon set | sized variants (16/20/24/32) |

**For each primitive, the file structure:**

```
site/src/components/ui/button.tsx           — component code
site/src/components/ui/button.stories.tsx   — Storybook story (renders in Step 4 once Storybook is wired)
docs/design/COMPONENTS.md#button             — anatomy + variants + when to use
```

**COMPONENTS.md per-primitive entry shape:**

```markdown
### Button

**Anatomy:** label, optional leading icon, optional trailing icon (arrow variant)
**States:** default / hover / active / focus / disabled / loading
**Variants:** primary / secondary / tertiary / icon-only / with-arrow / ghost
**Tokens consumed:** --color-primary, --color-primary-hover, --radius-button-md, --duration-fast, --easing-standard
**Accessibility:** focus ring uses --color-focus-ring, aria-disabled when loading, role="button" on non-button elements
**Live-site reference:** Hero CTA on /, secondary CTA throughout footers
**Variants NOT supported:** none of the live-site buttons use destructive styling — omitted to prevent template-side invention
```

**Icon set:** CE_SITE_TRUTH.md does not include an explicit icon catalogue. Step 2 includes a sub-pass to enumerate every `<svg>` and `<i class="...">` icon usage from `audit-output/` plus a live-site sweep. Output: `docs/design/ICONS.md` with the icon set inventoried. If the live site uses Lucide / Heroicons / a custom set, identify which. **If the icon set is custom (likely, given Webflow), capture every used SVG into `site/src/components/ui/icons/` as a typed enum.**

**Capability log draft:** add paragraph on "primitive selection rationale — shadcn for form / overlay primitives because they ship with accessibility built in, hand-built for everything that has CE-specific brand expression. Hand-tuned away from shadcn defaults to avoid AI-aesthetic perception."

**Commit points:** one per primitive, or one per logical group (forms / overlays / navigation / state). Don't batch all 20 into one commit.

---

### Step 3 — Tier-1 audit pass + complex-component decomposition specs (~3 days)

**Output:**

- `docs/design/TIER_1_INVENTORY.md` — locked inventory with screenshot/screen-recording references, behaviour summary, complexity rating.
- `docs/design/components/{component-name}.md` — one ultra-specific spec per Tier-1 component (5–10 docs).

**Sub-step 3a — Half-day audit pass (locked Decision D4):**

Walk every page in the 15 template types. Identify components that meet the Tier-1 criteria:

- Hero animations (likely GSAP scroll-triggered on /)
- Interactive state machines (Technology grid filtering, Compare tool if present)
- Carousels with non-trivial behaviour (Customer story carousel)
- Hover-state reveal grids (Team member grid)
- Sticky nav with transition behaviour
- Page-load reveal sequences
- Multi-step form interactions
- Video player wrappers with custom controls
- Calendly-embedded book-a-call interaction (third-party integration surface)
- Hotjar/Clara chat trigger surfaces

**The audit produces `TIER_1_INVENTORY.md` — markdown table format:**

```markdown
# Tier-1 Component Inventory

Locked at v1.0 by MYGRATR-DESIGN-1 Step 3a (2026-05-XX). Adding to this list post-lock requires brief deviation + version bump.

| # | Component | Live URL | Complexity | Screenshots | Screen recording |
|---|---|---|---|---|---|
| 1 | Hero animation (homepage) | / | High | screenshots/tier-1/hero/01-fold.png … 06-mobile.png | recordings/tier-1/hero.mp4 |
| 2 | Technology grid filter | /technology | High | … | … |
| 3 | Customer story carousel | /customer-stories/* | Medium | … | … |
| ... |
```

**Complexity ratings:**

- **High** — multi-stage timeline animation, non-trivial state machine, performance-sensitive
- **Medium** — interactive but with bounded state, library-supportable
- **Low** — interactive but mostly CSS / single-axis transitions

**Best estimate locked at the start of the brief: 5–10 components.** The actual count is locked at the end of Step 3a. Write that count into TIER_1_INVENTORY.md header and update this brief with the actual count via a v1.1 amendment.

**Sub-step 3b — One spec per Tier-1 component:**

Each gets `docs/design/components/{component-name}.md` with the following sections (mandatory; verifier asserts file structure):

```markdown
# {Component Name}

**Live URL(s):** /, /technology, ...
**Complexity:** High / Medium / Low
**Reference:** screenshots/tier-1/{name}/, recordings/tier-1/{name}.mp4

## 1. Behaviour

[Plain language. What does it do, in what order, in response to what triggers.]

## 2. State machine

[ASCII or mermaid diagram if non-trivial. Skip if single-state.]

## 3. Tech stack

**Library:** GSAP 3.12.5 / Framer Motion / CSS-only / Swiper 11
**Why:** [If GSAP, because the live site already uses it and we're reproducing existing timelines. If Framer Motion, because the live site uses CSS-only and we're rebuilding from scratch with a more agent-friendly API. Justify per component.]

## 4. Timing

| Phase | Duration | Easing | Stagger |
|---|---|---|---|
| Initial reveal | 600ms | --easing-emphasized | 80ms |
| ... |

## 5. Breakpoints

**Desktop (≥1024px):** [behaviour]
**Tablet (768–1023px):** [behaviour]
**Mobile (<768px):** [behaviour, often simplified or disabled]

## 6. Data binding

| UI region | Sanity field path | Document type |
|---|---|---|
| Hero headline | `homePage.heroHeadline` | homePage singleton |
| Hero subhead | `homePage.heroSubhead` | homePage singleton |
| ... |

## 7. Edge cases

- Empty data: [behaviour]
- Slow load: [behaviour, including LCP impact mitigation]
- Reduced motion (`prefers-reduced-motion: reduce`): [behaviour, must be respected]
- Keyboard navigation: [tab order, focus management]
- Screen reader: [aria-live region usage if animation conveys information]

## 8. Acceptance criteria

- [ ] Plays through full timeline on desktop matching screen recording
- [ ] Falls back gracefully on `prefers-reduced-motion`
- [ ] Sanity field changes propagate to preview within 5s
- [ ] No layout shift after animation completes
- [ ] Lighthouse performance not degraded vs current site (verified in QA-1)
```

**The spec is the contract.** A TEMPLATE-* phase reads this and ships a first-draft implementation. The contract holds Claude Code (or any subsequent dev) accountable to a specific behaviour, not "make it like CE's site."

**Capability log draft:** "Complex-component spec methodology — 8 mandatory sections; the data-binding section ties UI directly to schema field paths so any drift between schema and template is caught at spec-review time, not at render time."

**Commit points:** one per spec doc.

---

### Step 4 — Storybook scaffold + primitive stories + Tier-1 stories (~1.5 days)

**Output:**

- `.storybook/main.ts`, `.storybook/preview.ts` — Storybook config.
- `package.json` — Storybook scripts added.
- All `*.stories.tsx` files written in Steps 2 and 3 now actually render.
- Storybook deployed to a subdomain so reviews can be shared with Seb / Jake reviewing on different machines.

**Process:**

1. `npx storybook@latest init` from `site/`. **Pin Storybook 9.x** (M5 self-audit: Storybook 9 has shipped; `@latest` will pull 9. Document the major version in CAPABILITY_LOG). Use `@storybook/nextjs` framework adapter (or `@storybook/nextjs-vite` if Vite-based — pick at install time per current maintained option, record choice).
2. Configure Storybook to read Tailwind from `site/tailwind.config.ts` and import `tokens.css` in `preview.ts` so stories render with real CE design tokens.
3. Write stories for every primitive (using the spec from Step 2). Story shape:

```tsx
// site/src/components/ui/button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: { layout: 'centered' },
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'tertiary', 'icon-only', 'with-arrow', 'ghost'] },
    state:   { control: 'select', options: ['default', 'hover', 'active', 'focus', 'disabled', 'loading'] },
  },
};
export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story   = { args: { variant: 'primary',   children: 'Primary CTA' } };
export const Secondary: Story = { args: { variant: 'secondary', children: 'Secondary CTA' } };
// ... one story per variant
export const AllVariants: Story = { render: () => <ButtonGrid /> };
```

4. Write stories for each Tier-1 component (decomposed primitives + the composite). Animation Tier-1 stories run their timeline in isolation — Storybook's animation controls let Jake scrub to specific frames. Story decorators provide mock Sanity data inline (NOT fetched from Sanity in Storybook — explicit mock to keep stories deterministic).

5. **Deployment:**
   - **Recommended:** Vercel as a separate project pointed at `site/` with `--storybook` build script. Subdomain: `storybook.mygratr-cloudemployee.dev` or similar — pick one and record in CAPABILITY_LOG. Alternative: Chromatic free tier (also gives visual regression testing, which is a nice-to-have not in DESIGN-1 scope but might fold in later).
   - **Decision locked here:** Vercel separate project. Avoids paying for Chromatic, keeps tooling within the existing Vercel account, and lets Storybook be password-protected via Vercel deployment protection (same pattern as the main preview from SCAFFOLD-1).

6. **Storybook story discipline (CONVENTIONS.md addition):** every component file `foo.tsx` MUST have a `foo.stories.tsx` sibling. The Step 10 verifier asserts pair existence. A primitive without a story is not Done.

**Capability log draft:** "Storybook scaffold — Vercel-hosted, deployment-protected, separate Vercel project from main site. Stories use mock Sanity data, not real fetches. Pair-rule enforced by verifier."

**Commit points:** Storybook init + config (one); stories deployed and Vercel project linked (one).

---

### Step 5 — v0.dev prompt template (~0.5 day)

**Output:**

- `docs/V0_PROMPT_TEMPLATE.md` — standardised prompt structure for every TEMPLATE-* simple template.
- `docs/templates/_examples/v0-prompt-blog.md`, `v0-prompt-team-member.md`, `v0-prompt-review.md` — 3 worked examples for the simpler templates.

**Template structure:**

```markdown
# V0.dev Prompt Template — Mygratr CE Migration

Use this template for every simple TEMPLATE-* phase (BLOG, TEAM_MEMBER, REVIEW, VIDEO, BOOK_A_CALL, DOWNLOAD).
Do NOT use v0.dev for Tier-1 complex components — those go through hand-coded specs in docs/design/components/.

---

## Section 1 — Design system constraints

[Pasted from docs/design/TOKENS.md — colors, typography, spacing, radii, shadows, motion, breakpoints. Tailwind classes only.]

## Section 2 — Primitive components available

You MUST use these primitives, imported from @/components/ui/:
- <Button variant="primary | secondary | ..." />
- <Card variant="article | customer-story | ..." />
- ... [full list from docs/design/COMPONENTS.md]

DO NOT invent new primitives. If a UI need isn't covered by the available primitives, halt and surface to Jake.

## Section 3 — Visual reference

Live URL: [link to CE's existing template, e.g. cloudemployee.io/blog/some-post]
Screenshots: [paste 4–6 from docs/templates/{template-slug}/REFERENCE.md]
Field-to-UI map: [paste from docs/templates/{template-slug}/REFERENCE.md]

## Section 4 — Sanity data shape

[Paste the TypeScript / Zod type for the document type from src/types/sanity/{type}.ts]

```ts
type BlogPost = {
  title: string;
  slug: { current: string };
  // ... full type
};
```

## Section 5 — Constraints

- No inline styles. Tailwind classes only, using design-token classes.
- No third-party UI libraries (no react-bootstrap, no chakra, no MUI). shadcn primitives via @/components/ui/ only.
- Accessibility: focus rings on all interactive elements, aria-labels on icon-only buttons, semantic landmarks (<main>, <article>, <nav>).
- No hardcoded English strings outside button labels and error messages from UI_STRINGS enum (Step 6 lint rule will fail otherwise).
- Locale-aware: render the URL prefix correctly per data.locale ('default' / 'uk').
- SEO: page-level <Head> uses metaTitle / metaDescription / openGraphImage from data, never hardcoded.

## Section 6 — Output format

Produce a single TSX file ready to paste into `site/src/components/templates/{template-slug}/index.tsx` (kebab-case slug, matching `TIER_1_INVENTORY.md` and `docs/templates/{template-slug}/REFERENCE.md` conventions).
File structure:
- imports from next, react, @/components/ui, @/lib/sanity
- async server component
- Sanity query function call (use sanityFetch from @/lib/sanity/live)
- Render
```

**Capability log draft:** "v0.dev prompt template — 6-section structure. Sections 1–4 are pasted from existing artefacts (no copy-paste of CE marketing copy). Section 5 is the constraint set that aligns v0.dev outputs with the lint rule from Step 6."

**Commit point:** `feat(design-1): v0.dev prompt template + 3 worked examples`.

---

### Step 6 — Fidelity guarantee mechanisms (~1 day)

**Output:**

- `eslint.config.mjs` (or `.eslintrc.cjs` per Step 0b ESLint-version lock) — extended with `eslint-plugin-jsx-no-literals` configured with `allowedStrings: Object.values(UI_STRINGS)`, scoped to `site/src/components/templates/**`.
- `site/src/lib/ui-strings.ts` — defined enum of permitted UI strings.
- `tools/qa/structural-diff.config.ts` — Playwright structural-diff config (run in QA-1, configured here so reference docs in Step 7 have a concrete consumer).
- `tools/qa/structural-diff.test.ts` — test runner reading reference docs from Step 7 and capturing screenshots for diff. Skeleton only; full execution is QA-1.
- `package.json` — `npm run qa:structural-diff` script added (skipped in CI / prepush; manual invoke).

**Sub-step 6a — Content fidelity lint rule:**

Goal: structurally prevent any template file from rendering a hardcoded English marketing string. Sanity is the source of truth.

**Approach:** Use `eslint-plugin-jsx-no-literals` configured with an `allowedStrings` whitelist sourced from `UI_STRINGS`. Reasons (revised from v1.0):

- The off-the-shelf plugin handles `JSXText` and `JSXExpressionContainer` correctly — exactly the visitor shape needed. A custom rule would need to reproduce this and is more failure-prone.
- `allowedStrings` accepts an array; we generate it at lint time from `Object.values(UI_STRINGS)`. Enum exemption falls out naturally.
- Customer-2 reusable: same plugin, same UI_STRINGS pattern, configurable `allowedStrings`.

**Lock locations (per I9 in v1.1 self-audit):** templates live at `site/src/components/templates/{template-slug}/`. Route segments under `site/src/app/` import them. Lint rule scopes to `site/src/components/templates/`.

**Configuration** (assumes ESLint 9 flat config; if Step 0b determined ESLint 8 legacy, translate to `.eslintrc.cjs` overrides format):

```js
// eslint.config.mjs (relevant excerpt)
import jsxNoLiterals from 'eslint-plugin-jsx-no-literals';
import { UI_STRINGS } from './site/src/lib/ui-strings.js'; // or build-time generated list

export default [
  // ... existing config
  {
    files: ['site/src/components/templates/**/*.{ts,tsx}'],
    plugins: { 'jsx-no-literals': jsxNoLiterals },
    rules: {
      'jsx-no-literals/jsx-no-literals': ['error', {
        allowedStrings: Object.values(UI_STRINGS),
        ignoreProps: false,           // also scan prop string values
        noStrings: true,              // catch JSXText
        noAttributeStrings: false,    // permit className, etc.
        // a11y attributes that hold user-visible strings
        elementOverrides: {
          'img': { allowedStrings: [] },     // alt must come from data
          'button': { allowedStrings: Object.values(UI_STRINGS) },
        },
      }],
    },
  },
];
```

**Allowed-by-design exceptions:** `className`, `style`, `data-*`, `id`, `name`, `type`, `role`, `aria-*` (when the value is a token like `"button"`, not a label). `aria-label`, `alt`, `title` — these contain user-visible text and should come from data; the plugin's default catches these via `ignoreProps: false`.

**`UI_STRINGS` enum** in `site/src/lib/ui-strings.ts`:

```ts
// Enum of permitted UI chrome strings. NEVER add marketing copy here.
export const UI_STRINGS = {
  // Form labels (when not driven by data)
  EMAIL_LABEL: 'Email',
  NAME_LABEL: 'Name',
  // Buttons that aren't CTAs (CTAs come from Sanity)
  SUBMIT: 'Submit',
  CLOSE: 'Close',
  CANCEL: 'Cancel',
  RETRY: 'Try again',
  // Error messages
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
  EMPTY_RESULTS: 'No results found.',
  // a11y
  LOADING: 'Loading',
  MENU: 'Menu',
} as const;

export type UIStringKey = keyof typeof UI_STRINGS;
```

**Test the rule:** create `tests/lint/jsx-no-literals.test.ts` that runs ESLint programmatically against fixture template files (one passing, one failing). The Step 10 verifier runs this test.

```ts
// tests/lint/jsx-no-literals.test.ts (skeleton)
import { ESLint } from 'eslint';

const eslint = new ESLint({ overrideConfigFile: 'eslint.config.mjs' });

const passingFixture = `
  // site/src/components/templates/_fixtures/passing.tsx
  import { UI_STRINGS } from '@/lib/ui-strings';
  export default function T({ data }: { data: { title: string } }) {
    return <div><h1>{data.title}</h1><button>{UI_STRINGS.SUBMIT}</button></div>;
  }
`;

const failingFixture = `
  // site/src/components/templates/_fixtures/failing.tsx
  export default function T() {
    return <div><h1>Cloud Employee helps you scale</h1></div>;
  }
`;

// Assert passing has zero errors; failing has at least one with the jsx-no-literals rule id.
```

**Sub-step 6b — Playwright structural-diff config:**

Goal: per-template visual regression detection with sane diff thresholds (per Decision D2: 95–98% on simple, 85–95% on animation-heavy).

```ts
// tools/qa/structural-diff.config.ts
export type DiffThreshold = number; // 0..1, fraction of pixels permitted to differ

export type TemplateDiffSpec = {
  templateSlug: string;          // e.g. 'blog', 'home'
  liveUrlSample: string;         // e.g. 'https://cloudemployee.io/blog/scaling-your-engineering-team'
  newUrlSample: string;          // e.g. 'https://preview-mygratr-cloudemployee.vercel.app/blog/scaling-your-engineering-team'
  breakpoints: Array<{ width: number; height: number }>;
  threshold: DiffThreshold;
  ignoreSelectors: string[];     // selectors stripped before diff (chat widgets, ad slots, dynamic dates)
};

export const STRUCTURAL_DIFF_SPECS: TemplateDiffSpec[] = [
  // populated in Step 7 from per-template reference docs
];
```

`structural-diff.test.ts` is a skeleton Playwright test that loops over `STRUCTURAL_DIFF_SPECS`. Captures live + new at each breakpoint, masks `ignoreSelectors`, computes pixel diff via `pixelmatch` or `looks-same`. Fails the test if `> threshold`. Wired in Step 7 once reference docs populate the array.

**Sub-step 6c — SEO fidelity verification scaffold:**

Skeleton `tools/qa/seo-parity.test.ts` that QA-1 will run. Asserts for every page on every template:

- `<title>` matches `data.metaTitle`
- `<meta name="description">` matches `data.metaDescription`
- `<link rel="canonical">` matches expected per locale-routing rules
- `<meta property="og:image">` resolves to `data.openGraphImage`
- JSON-LD payload validates against the schema spec for the document type

Test stays a skeleton in DESIGN-1; QA-1 plugs in actual page sets.

**Capability log draft:** "Three fidelity guarantees made structural rather than aspirational. Content via custom ESLint rule scoped to templates only. Visual via Playwright structural-diff with per-template thresholds. SEO via per-page assertion harness. The mechanisms exist before TEMPLATE-* phases so each template ships against the harness, not despite it."

**Commit points:** lint rule + test (one), UI_STRINGS enum (one), structural-diff config (one), SEO scaffold (one).

---

### Step 7 — Per-template visual reference docs (~3 days)

**Output:**

- `docs/templates/{template-slug}/REFERENCE.md` for each of the **13 confirmed template types** (UNKNOWN dropped per I1; TAXONOMY pending Jake verification — see Decisions for Jake §12.6): BLOG, BOOK_A_CALL, COMPARE, CUSTOMER_STORY, DOWNLOAD, HOME, REVIEW, SERVICE, STATIC, TEAM_MEMBER, TECHNOLOGY, TOOL, VIDEO. Plus TAXONOMY conditional on §12.6 resolution.
- `docs/templates/_resolved-classifications.md` — one-paragraph note recording that AUDIT-1 UNKNOWN URLs (CLAUDE.md Tech Debt #9) resolve to: 3 not-real-pages (Cloudflare challenge script, sitemap.xml, hash URL — to be filtered out by AUDIT-1 content-type fix carried as Tech Debt #9), and `/uk/embedding` → STATIC (UK locale variant of /embedding singleton).
- `docs/templates/{template-slug}/screenshots/` — 8–10 screenshots per template (hover, active, scroll-triggered, fold states, mobile/tablet/desktop). Captured fresh — do not rely on AUDIT-1 captures, which were 44 across three breakpoints (insufficient for per-template fidelity work).
- `docs/templates/{template-slug}/recordings/` — screen recordings for templates with animation behaviour (HOME, TECHNOLOGY, SERVICE, COMPARE, CUSTOMER_STORY).

**Process per template:**

1. **Capture screenshots** at desktop (1440), tablet (768), mobile (375). Include hover and active states for interactive elements. Capture at scroll positions that reveal each fold.
2. **Annotate** the screenshots with field-to-UI overlays showing which Sanity field maps to which UI region. Use Excalidraw or similar; SVG overlays acceptable.
3. **Schema-vs-reality reconciliation** (NEW sub-step per C1): for each template, list every required schema field that holds null in the migrated dataset. These are Tech-Debt-#16-shaped issues — schema declares required, data doesn't have it, Studio shows hard validation error. **DESIGN-1 does not fix these** — the brief's role is to surface them so STATIC-1 (or a SCHEMA-2 mini-phase) can decide schema-relax-with-fallback per template. Output: a `## Schema-vs-reality findings` section in each REFERENCE.md.
4. **Write the reference doc** in this shape (BLOG worked example below uses ONLY fields verified in `MYGRATR_SCHEMA_DESIGN_DECISIONS.md §3.1` and `WEBFLOW_TO_SANITY_FIELD_MAP.md §1`; live-site-derived UI regions are marked "verify against live URL" until Jake confirms):

```markdown
# Template: BLOG

**Document type:** blogPost
**Live URL pattern:** /blog/{slug}, /blog (index)
**Singleton index:** blogHub (singleton — confirm name against schema doc §4.1)
**Live URL sample:** https://cloudemployee.io/blog/{specific-slug-jake-confirms}
**Sanity document type:** blogPost (74 docs)
**Routing:** see MYGRATR_SCHEMA_DESIGN_DECISIONS.md §10

## Complexity rating

**Simple** (Tier 3 — composition of primitives + Sanity data binding)

## Builder assignment

Jake + Claude Code + v0.dev (Tier 3 simple — uses V0_PROMPT_TEMPLATE.md from Step 5)

## Visual fidelity target

97% (per Decision D2 — simple template)

## Field-to-UI map (schema-verified fields only)

The following fields exist in the locked schema (verified against MYGRATR_SCHEMA_DESIGN_DECISIONS.md §3.1 and WEBFLOW_TO_SANITY_FIELD_MAP.md §1). UI regions marked "verify against live" must be confirmed against the actual live page before this doc locks.

| UI region | Sanity field | Required? | Component | Verified? |
|---|---|---|---|---|
| Hero title | `blogPost.title` | required | text-h1 utility | ✓ schema |
| Author | `blogPost.author` (ref → teamMember) | **REQUIRED** | TBD per live-site review | ✓ schema; ⚠ see Schema-vs-reality |
| Date | `blogPost.date` | required | `<time>` formatted ISO | ✓ schema |
| Body | `blogPost.content` (Portable Text) | required | `<PortableTextBlock />` | ✓ schema |
| Inline images | `blogPost.content[].image` | optional within body | `<Image />` with alt from data | ✓ schema |
| FAQ accordion | `blogPost.faqs[]` (max 6) | optional | `<Accordion />` primitive | ✓ schema |
| Thumbnail | `blogPost.thumbnailImage` | required | listing card / OG fallback | ✓ schema |
| Open Graph image | `blogPost.openGraphImage` | optional | `<Head>` | ✓ schema |
| Tags | `blogPost.tags[]` (ref → tag) | required | `<Tag />` primitive list | ✓ schema |
| Category | `blogPost.blogCategory` (ref → blogCategory) | per schema-design §3.3 | breadcrumb segment / hub link | ✓ schema |
| Meta title | `blogPost.metaTitle` | required (60 chars) | `<Head>` | ✓ schema |
| Meta description | `blogPost.metaDescription` | required (140-160 chars) | `<Head>` | ✓ schema |
| Related posts section | NOT in schema | n/a | verify against live: does CE actually render related posts? If yes, computed how? Surface as Decision for Jake. | ✗ unverified — Hard Rule #2 forbids fabricating |
| Author bio block | NOT in schema as expanded fields | n/a | verify against live: does CE render author bio inline? | ✗ unverified |
| Share buttons | NOT in schema | n/a | UI chrome — drives `UI_STRINGS` only | ✓ chrome |

## Schema-vs-reality findings (per C1 reconciliation pass)

- **`blogPost.author`** declared `REQUIRED` in schema (§3.1) but CHANGELOG records "~25% fill rate, null is expected and triggers `needsReview = true`" — i.e. **~75% of migrated `blogPost` docs hold null on a required ref**. Studio surfaces hard validation error. Resolution direction (NOT for DESIGN-1): schema-side relax to optional + template fallback ("Cloud Employee Team" placeholder card). Same shape as Tech Debt #16. Surface to STATIC-1 / separate SCHEMA-2 cycle.
- **`blogPost.metaTitle` / `metaDescription`**: backfilled in CONTENT-1D — verify all 74 docs have these populated (audit query: `count(*) where _type=='blogPost' and !defined(metaTitle)`).
- Run the audit query for every required schema field on `blogPost` and append findings here.

## Edge cases

- `blogPost.author` null (per Schema-vs-reality finding above): **template MUST handle gracefully even though schema says required** — render "Cloud Employee Team" fallback card, do not break render. This is the temporary template-side mitigation until schema is relaxed.
- `blogPost.faqs` empty: omit the accordion section entirely (do not render empty heading).
- `blogPost.openGraphImage` null: behaviour determined by `<Head>` OG fallback chain — confirm against schema-design §7.2 source-tracking. Recommend: fall back to `blogPost.thumbnailImage` (which IS required, so always populated).
- Locale 'uk': prefix URL with /uk/ per locale-routing rules; hreflang link to default counterpart if exists.

## Notes / known divergences

[Anything DESIGN-1 has identified will not match exactly between live and new — record it here so QA-1 doesn't flag as a regression.]

## Structural-diff entry (added to tools/qa/structural-diff.config.ts)

```ts
{
  templateSlug: 'blog',
  liveUrlSample: 'https://cloudemployee.io/blog/{slug-jake-confirms}',
  newUrlSample: 'https://preview-mygratr-cloudemployee.vercel.app/blog/{same-slug}',
  breakpoints: [{ width: 1440, height: 900 }, { width: 768, height: 1024 }, { width: 375, height: 812 }],
  threshold: 0.03, // 97% pixel match
  ignoreSelectors: ['#hotjar-widget', '.clara-chat-widget', '[data-dynamic-date]'],
}
```
```

**Per-template assignments locked here based on Decision D4 + Tier-1 audit from Step 3:**

| Template | Tier | Builder | Target fidelity | Status |
|---|---|---|---|---|
| BLOG | 3 | Jake + Claude Code + v0.dev | 97% | confirmed |
| BOOK_A_CALL | 3 | Jake + Claude Code + v0.dev | 96% | confirmed |
| COMPARE | 1 high | Jake + Claude Code (Tier-1 spec referenced) | 92% | confirmed |
| CUSTOMER_STORY | 1 medium | Jake + Claude Code (Tier-1 spec referenced) | 93% | confirmed |
| DOWNLOAD | 3 | Jake + Claude Code + v0.dev | 96% | confirmed |
| HOME | 1 high | Jake + Claude Code (Tier-1 spec referenced) | 88% | confirmed |
| REVIEW | 3 | Jake + Claude Code + v0.dev | 97% | confirmed |
| SERVICE | 1 medium | Jake + Claude Code (Tier-1 spec referenced) | 92% | confirmed |
| STATIC | 4 | Jake + Claude Code + v0.dev | 97% | confirmed |
| TAXONOMY | 3 | Jake + Claude Code | 96% | **PENDING — see §12.6** |
| TEAM_MEMBER | 3 | Jake + Claude Code + v0.dev | 97% | confirmed |
| TECHNOLOGY | 1 high | Jake + Claude Code (Tier-1 spec referenced) | 90% | confirmed |
| TOOL | 3 | Jake + Claude Code | 95% | confirmed |
| VIDEO | 3 | Jake + Claude Code + v0.dev | 96% | confirmed |

13 confirmed + 1 pending. UNKNOWN dropped from REFERENCE.md set per I1 — handled in `docs/templates/_resolved-classifications.md` instead.

(Tier ratings here are approximate; locked Tier-1 list in Step 3 supersedes.)

**TAXONOMY handling:** TAXONOMY is listed in CE_SITE_TRUTH.md §1's template-type enum but the project knowledge does not establish a clean mapping to a Sanity document type or singleton. Schema-design §3.3 has `blogCategory` (used in `/[category-slug]/[post-slug]` routing) and §3.1 has `tag` (referenced from blogPost, compareBlog, download). One of these likely renders TAXONOMY listing pages, but the live-site URL pattern is unverified. Surface to Jake for resolution before Step 7 starts on TAXONOMY (see §12.6). If unanswerable from project knowledge, brief deviation pass against the live site before this template's REFERENCE.md is written.

**Capability log draft:** "Per-template reference docs — field-to-UI map is the load-bearing artefact, AND the schema-vs-reality reconciliation pass is the second load-bearing artefact. Without the first, TEMPLATE-* phases reverse-engineer the binding from screenshots. Without the second, templates ship against schemas that don't match what the data actually contains. Both are contractual."

**Commit points:** one per template doc, plus one for `_resolved-classifications.md`.

---

### Step 8 — Visual Editing infrastructure (~1.5 days)

**Output:**

- `site/src/lib/sanity/client.ts` — extended with stega config on `previewClient` (the load-bearing change).
- `site/src/lib/sanity/live.ts` — already exists from SCAFFOLD-1; verify it uses the stega-configured `previewClient` for draft mode.
- `site/src/app/layout.tsx` — `<VisualEditing />` from `next-sanity/visual-editing` already conditionally rendered when `draftMode().isEnabled` per SCAFFOLD-1; verify it hasn't been removed.
- `site/src/app/api/draft-mode/enable/route.ts` — already exists per SCAFFOLD-1; verify same-origin + secret validation are still present.
- `studio/sanity.config.ts` — `presentationTool` `previewUrl` config: confirm or update preview URL pattern.
- `site/src/app/page.tsx` — extended to render `homePage.heroHeadline` from seeded singleton via `sanityFetch` (smoke-test prerequisite per C4).
- `docs/design/VISUAL_EDITING.md` — operator-facing doc explaining the round-trip workflow for Seb.

**Reframing per I8 self-audit finding:** v1.0's `<VisualEditingProvider>` wrapper-per-template was a non-thing — `<VisualEditing />` is rendered once at layout level (already done in SCAFFOLD-1), not per template. What is actually per-template is **how data is fetched and rendered**: stega payloads only survive when (a) data is fetched via `previewClient` with `stega.enabled: true`, and (b) Sanity strings are rendered directly into JSX without intermediate transformations that strip the payload. v1.1 replaces the wrapper component with two conventions documented in CONVENTIONS.md (Step 11).

**Sub-step 8a — Pick the preview URL pattern. Lock it.**

**Decision (locked here, per Decision D3 instruction "pick one, don't defer"):**

`preview-mygratr-cloudemployee.vercel.app`

**Rationale:**
- Stable subdomain on Vercel that doesn't require pre-cutover DNS work on `cloudemployee.io`. A custom domain like `preview.cloudemployee.io` would require Cloudflare/Webflow record changes that risk the live site. Defer custom-domain preview until LAUNCH.
- Vercel deployment protection (already in use per SCAFFOLD-1) covers access control without DNS work.

**Action (corrected per C2 self-audit finding):** the `vercel.json` `alias` field does NOT bind a stable subdomain to "latest deployment" — that field is per-deployment. The correct approach is via the Vercel dashboard:

1. Open the Vercel project (the `cloud-employee` project that SCAFFOLD-1 deployed).
2. Settings → Domains → Add `preview-mygratr-cloudemployee.vercel.app`.
3. In the Domain settings for this entry, attach to the production branch (`main`). Vercel will route the subdomain to the latest production deployment automatically.
4. Verify deployment protection is still enabled on the project (carried from SCAFFOLD-1).
5. Smoke check: `curl -I https://preview-mygratr-cloudemployee.vercel.app/` returns 401 (deployment protection) — expected. Authenticated browser fetch returns 200.

If the project is currently set up such that `main` is *production* (i.e., this becomes the live site post-cutover), an alternative to consider before LAUNCH is creating a *separate* Vercel project pointed at `site/` whose production branch is a `preview` branch we maintain. Surface to Jake as Decision §12.7. For now, use the existing project + subdomain attached to `main`.

Record decision and approach in CAPABILITY_LOG.

**Sub-step 8b — Stega encoding configuration:**

```ts
// site/src/lib/sanity/client.ts
import { createClient } from 'next-sanity';
import { env } from '@/lib/env';

export const sanityClient = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset:   env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2025-01-01',
  useCdn: true,
  perspective: 'published',
});

export const previewClient = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset:   env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2025-01-01',
  useCdn: false,
  perspective: 'previewDrafts',
  token: env.SANITY_API_READ_TOKEN,
  stega: {
    enabled: true,
    studioUrl: env.NEXT_PUBLIC_SANITY_STUDIO_URL, // 'https://mygratr-cloudemployee.sanity.studio'
  },
});
```

Stega is on `previewClient` only — `sanityClient` ships clean strings to production. Drafts carry stega payload markers so the visual-editing overlay can map clicks to Studio fields.

**Sub-step 8c — Data fetch + render conventions (replaces v1.0's `<VisualEditingProvider>` wrapper per I8):**

The following conventions are CONVENTIONS.md additions. Every TEMPLATE-* phase MUST follow them; the verifier and lint rule together enforce structural compliance.

**Convention 1 — Sanity Fetch Pattern (Visual Editing compatibility):**

Templates fetch via `sanityFetch` from `@/lib/sanity/live`, never directly via `previewClient` or `sanityClient`. `sanityFetch` automatically routes to `previewClient` (with stega) when draft mode is enabled, and to `sanityClient` (no stega) otherwise. This is the only path that preserves stega payloads for click-to-edit while keeping production builds clean.

```tsx
// CORRECT — site/src/components/templates/blog/index.tsx
import { sanityFetch } from '@/lib/sanity/live';

export async function BlogTemplate({ slug }: { slug: string }) {
  const data = await sanityFetch({ query: BLOG_POST_QUERY, params: { slug } });
  return <article>{data.title}</article>;
}

// FORBIDDEN — bypasses sanityFetch, breaks Visual Editing in draft mode
import { sanityClient } from '@/lib/sanity/client';
export async function BlogTemplate({ slug }: { slug: string }) {
  const data = await sanityClient.fetch(BLOG_POST_QUERY, { slug });
  return <article>{data.title}</article>;
}
```

**Convention 2 — Render-Discipline Pattern:**

Sanity-derived strings render directly into JSX. Forbidden transformations (these strip the stega payload):

- `.replace()`, `.replaceAll()` on Sanity strings before render
- Regex transforms on Sanity strings before render
- Manual concatenation that re-wraps strings (`String(data.title)`, `data.title.toString()`)
- Capitalisation transforms — use CSS `text-transform` instead

```tsx
// CORRECT
<h1>{data.title}</h1>
<h1 className="uppercase">{data.title}</h1>  // CSS transform, payload survives

// FORBIDDEN — payload stripped
<h1>{data.title.toUpperCase()}</h1>
<h1>{data.title.replace('foo', 'bar')}</h1>
<h1>{`${data.title}`}</h1>  // template literal interpolation strips
```

Allowed:
- Direct JSX expression (`{data.title}`)
- Wrapping in JSX (`<span>{data.title}</span>`)
- Conditional rendering (`{data.title && <h1>{data.title}</h1>}`)
- CSS-based visual transformation (text-transform, text-decoration)
- Portable Text rendering via `@portabletext/react` (preserves stega via the library's encoding-aware path)

These conventions ARE the Visual Editing wiring at the template level. There is no wrapper component.

**Sub-step 8d — Smoke-test prerequisite: render Sanity-driven text in homepage placeholder (per C4):**

The existing `site/src/app/page.tsx` is a placeholder that doesn't fetch or render Sanity-driven text. Without rendered text there is no stega payload to click. Extend the placeholder to render `homePage.heroHeadline` from the seeded `homePage` singleton. After Step 8 smoke test, leave this minimal render in place for TEMPLATE-HOME to extend (TEMPLATE-HOME builds on this, not over it).

```tsx
// site/src/app/page.tsx
import { sanityFetch } from '@/lib/sanity/live';

const HOME_HERO_QUERY = `*[_type == "homePage"][0]{ heroHeadline, _id }`;

export default async function Home() {
  const data = await sanityFetch({ query: HOME_HERO_QUERY });
  return (
    <main>
      <h1>{data?.heroHeadline ?? 'Cloud Employee'}</h1>
    </main>
  );
}
```

Confirm `homePage` singleton was seeded by SCHEMA-1 (`scripts/schema/seed-singletons.ts` — per PHASE_HISTORY MYGRATR-SCHEMA-1, "34 stub singleton/global docs seeded"). If `heroHeadline` field is empty on the seeded stub, populate it with placeholder text via Studio so the smoke test has something to click.

**Sub-step 8e — Studio Presentation Tool preview URL update:**

```ts
// studio/sanity.config.ts
import { presentationTool } from 'sanity/presentation';

// ...
plugins: [
  presentationTool({
    previewUrl: {
      origin: 'https://preview-mygratr-cloudemployee.vercel.app',
      previewMode: { enable: '/api/draft-mode/enable' },
      draftMode:  { enable: '/api/draft-mode/enable' },
    },
  }),
  // ...
],
```

**Sub-step 8f — Operator doc for Seb:**

`docs/design/VISUAL_EDITING.md` — plain-English explanation of the workflow. Two distinct round-trips, both load-bearing (per I6 self-audit):

**Round-trip A — Click-to-edit (target ~10s):**
1. In Studio, click the Presentation icon (top nav).
2. Click any text or image on the rendered preview.
3. Studio focuses the corresponding field.
- *Latency:* mostly browser navigation + Studio panel load. ~10s end-to-end.

**Round-trip B — Publish-to-preview (target ~5s, per Roadmap §4.4):**
1. Edit the field in Studio.
2. Hit publish.
3. Preview reflects the change.
- *Latency:* `defineLive` revalidation + Sanity CDN propagation. ~5s end-to-end.

Include screenshots once both round-trips are verified end-to-end on the homePage placeholder smoke test.

**Smoke test in Step 8 (per C4 — now actually runnable):** with the Sub-step 8d render in place, deploy to preview, open Presentation Tool in Studio, click the rendered `heroHeadline` text. Verify Studio focuses the right field within 10s (Round-trip A). Edit the field, publish, time how long the preview takes to reflect the change (Round-trip B). Record both timings in PHASE_HISTORY: "Visual Editing round-trip A measured at Xs; Round-trip B measured at Ys; both within target."

If either round-trip exceeds target by >2x, log as risk and continue (QA-1 retests post-template-build).

**Capability log draft:** "Visual Editing infrastructure — stega on previewClient only, `<VisualEditing>` rendered at layout level (carried from SCAFFOLD-1), per-template wiring via Sanity Fetch Pattern + Render-Discipline Pattern conventions (NOT a wrapper component — that mental model was a v1.0 misconception caught in self-audit). Two distinct round-trips: A (click-to-edit) target 10s, B (publish-to-preview) target 5s. Preview URL pinned to a stable subdomain alias attached to production branch via Vercel dashboard."

**Commit points:** stega config (one), `app/page.tsx` extension + smoke-test fixture (one), Studio config + Vercel domain attached (one), operator doc + smoke test recording (one).

---

### Step 9 — Capability log scaffold + first entry (~0.5 day)

**Output:**

- `docs/CAPABILITY_LOG.md` — root-level capability log doc (NOT under `docs/design/` — spans all phases, lives at the same level as PHASE_HISTORY.md).

**Voice / tense (per M4 self-audit):** capability log entries are *retrospective and pedagogical* — what Jake learned, not what the script did. Before consolidating the running drafts from Steps 1–8 into the final entry, rewrite each in the form "the load-bearing finding from {step} was that {insight}; this informs customer-2 {capability} phases by {actionable take-away}." This is the productisation-IP framing.

**Structure:**

```markdown
# CAPABILITY_LOG.md — Mygratr

> Tracks what Jake learns per phase — frameworks, patterns, debugging approaches.
> This is the productisation IP. Customer-2+ migrations should reference this to bypass first-principles work.
> Maintained per phase. Append-only.

## DESIGN-1 — Design tokens, primitives, complex specs, Storybook, Visual Editing, fidelity guarantees (May 2026)

### Token system architecture

[Consolidates the Step 1 capability draft. Methodology + token categories + extraction approach.]

### Primitive component patterns

[Consolidates the Step 2 capability draft. shadcn for forms/overlays, hand-built for brand expression. Tuning approach away from defaults.]

### Storybook setup

[Consolidates the Step 4 capability draft. Vercel-hosted, deployment-protected, separate Vercel project. Pair-rule enforced.]

### Complex-component specification methodology

[Consolidates the Step 3 capability draft. 8-section spec template. Data-binding section ties UI directly to schema field paths.]

### v0.dev prompt template

[Consolidates the Step 5 capability draft.]

### Fidelity guarantee mechanisms

[Consolidates the Step 6 capability draft. Three structural mechanisms.]

### Visual Editing infrastructure

[Consolidates the Step 8 capability draft. Stega on previewClient only, two CONVENTIONS.md patterns (Sanity Fetch + Render-Discipline) replace per-template wrapper, stable preview URL alias attached to production branch.]

### Customer-2 reusability assessment

[For each pattern: which parts are CE-specific, which parts are reusable. e.g. Token system: extraction methodology reusable; specific values CE-only. Lint rule: 100% reusable.]
```

**Capability log update protocol (CONVENTIONS.md addition):** every phase from DESIGN-1 forward appends one section to CAPABILITY_LOG.md before phase closes. Step 11 of every brief includes a checkbox.

**Commit point:** `feat(design-1): capability log scaffold + DESIGN-1 entry`.

---

### Step 10 — Verifier (~0.5 day)

**Output:**

- `tools/qa/verify-design-1.ts` — throws-on-failure verifier following CONTENT-1D pattern. Never returns boolean.
- `tools/qa/run-verify-design-1.ts` — CLI entrypoint. Calls `verifyDesign1()` without try/catch.
- `package.json` — `npm run design:verify` script.

**Verifier checks (hard gates — fail-fast on first):**

1. `docs/design/TOKENS.md` exists and is non-empty.
2. `site/tailwind.config.ts` differs from create-next-app default (sentinel: includes one of the locked CE token names).
3. `site/src/styles/tokens.css` exists.
4. `site/src/styles/globals.css` imports `tokens.css`.
5. `docs/design/COMPONENTS.md` exists and contains a section per primitive in the locked Step 2 set (assert by header text).
6. Each primitive in Step 2 has a `.tsx` file at `site/src/components/ui/{name}.tsx`.
7. Each primitive in Step 2 has a `.stories.tsx` file at `site/src/components/ui/{name}.stories.tsx`.
8. `docs/design/TIER_1_INVENTORY.md` exists and contains a non-empty table.
9. For each Tier-1 component listed in TIER_1_INVENTORY.md, a spec exists at `docs/design/components/{slug}.md` with the 8 mandatory sections.
10. Each Tier-1 component has a `.stories.tsx` file in Storybook.
11. `.storybook/main.ts` exists. Storybook build passes (`npm run build-storybook` in `site/`).
12. `docs/V0_PROMPT_TEMPLATE.md` exists. Three example prompts exist under `docs/templates/_examples/`.
13. `eslint-plugin-jsx-no-literals` is configured for `site/src/components/templates/**` with `allowedStrings` sourced from `UI_STRINGS`. ESLint rule unit test passes (`npm run test:lint`).
14. `site/src/lib/ui-strings.ts` exists and exports `UI_STRINGS` const.
15. `tools/qa/structural-diff.config.ts` exists and exports `STRUCTURAL_DIFF_SPECS`. Length matches the count of confirmed templates from Step 7 (13 confirmed + 1 conditional on §12.6 TAXONOMY resolution).
16. `docs/templates/{slug}/REFERENCE.md` exists for each of the 13 confirmed template types (BLOG, BOOK_A_CALL, COMPARE, CUSTOMER_STORY, DOWNLOAD, HOME, REVIEW, SERVICE, STATIC, TEAM_MEMBER, TECHNOLOGY, TOOL, VIDEO). If TAXONOMY resolved per §12.6 then assert 14. UNKNOWN dropped per I1; `docs/templates/_resolved-classifications.md` exists instead.
17. Each REFERENCE.md has the field-to-UI map section AND the schema-vs-reality findings section (assert by header).
18. **REMOVED in v1.1** — `VisualEditingProvider.tsx` was a non-thing per I8 self-audit. Replaced by check 18a.
18a. `site/src/app/page.tsx` calls `sanityFetch` from `@/lib/sanity/live` (assert by AST or grep for `sanityFetch(`).
18b. `site/src/app/layout.tsx` still renders `<VisualEditing />` conditional on `draftMode().isEnabled` (carried from SCAFFOLD-1 — assert it hasn't been removed).
19. **Revised per C3 self-audit:** import `previewClient` in the verifier and assert `previewClient.config().stega?.enabled === true`. Robust against formatting changes; bypasses the brittle source-grep approach from v1.0.
20. `studio/sanity.config.ts` `presentationTool.previewUrl.origin` matches the locked URL `https://preview-mygratr-cloudemployee.vercel.app`.
21. `docs/design/VISUAL_EDITING.md` exists and documents both round-trip A (click-to-edit, ~10s) and round-trip B (publish-to-preview, ~5s).
22. `docs/CAPABILITY_LOG.md` exists at repo root and contains a `## DESIGN-1` section.
23. **C4 smoke test recorded:** PHASE_HISTORY entry for DESIGN-1 contains "Visual Editing round-trip A measured at Xs" and "round-trip B measured at Ys" with actual numeric values.
24. `npm run build` passes from repo root (TS + ESLint clean).
25. `npm run build` passes in `site/`.
26. `npm run build` passes in `studio/`.
27. `npm run build-storybook` passes in `site/`.
28. **I5 metadata refresh confirmed:** `migrations.metadata.content_phase.content_migrations_rows === 42` for the CE migration.

**No state machine transition.** DESIGN-1 does not call `assertValidTransition()` (DESIGN does not exist as a `MigrationStatus`). The verifier asserts `migrations.status === 'content_complete'` on entry and exit. Step 11 carries the implication forward.

**Commit point:** `feat(design-1): verifier + CLI entrypoint`.

---

### Step 11 — Post-phase doc updates

**Order:** CHANGELOG → PHASE_HISTORY → CONVENTIONS → FEATURE_MAP → CLAUDE.md → SCHEMA.md → REGISTRY.md.

**CHANGELOG.md** — one paragraph at top, prepend pattern:

```markdown
## MYGRATR-DESIGN-1 — Design tokens + primitives + Tier-1 specs + Storybook + Visual Editing + fidelity guarantees (May 2026)
[Prose paragraph: what shipped. Token extraction from live + audit cross-reference + GSAP runtime instrumentation shim. ~20 primitives in site/src/components/ui/ with shadcn for forms/overlays + hand-built for brand expression. Tier-1 inventory locked at N components (use actual count from Step 3a). N complex-component specs at docs/design/components/. Storybook deployed to a Vercel project subdomain (deployment-protected). v0.dev prompt template + 3 worked examples. ESLint `jsx-no-literals` configured for site/src/components/templates/** with allowedStrings sourced from UI_STRINGS enum. Playwright structural-diff config skeleton at tools/qa/. Per-template reference docs for 13 confirmed template types (+ TAXONOMY conditional on §12.6); UNKNOWN dropped from set per audit, resolved in docs/templates/_resolved-classifications.md. Visual Editing wired via stega encoding on previewClient (sanityClient ships clean to production), Sanity Fetch Pattern + Render-Discipline Pattern conventions enforce per-template wiring (no wrapper component). Preview URL preview-mygratr-cloudemployee.vercel.app attached to production branch via Vercel dashboard. Both round-trips smoke-tested: A click-to-edit Xs, B publish-to-preview Ys. Capability log scaffolded with first entry. migrations.metadata.content_phase.content_migrations_rows refreshed from stale 38 to actual 42. migrations.status unchanged at content_complete.]
```

**PHASE_HISTORY.md** — full entry under `## MYGRATR-DESIGN-1`. Sections: What Was Built (per-step), Files Created, Files Modified, Patterns Established, Tech Debt Logged (#16, #17 carried forward; new debt if any), Discoveries / Surprises, Final Repo State.

**CONVENTIONS.md** — append six new sections (revised from v1.0's four per I8 + I9 self-audit):

1. **Token System Pattern** — every Tailwind class in template files MUST resolve to a token defined in `tailwind.config.ts`. Raw hex / px / ms forbidden. Source recorded in TOKENS.md.
2. **Component Specification Pattern** — Tier-1 components have an 8-section spec at `docs/design/components/{name}.md`. Tier-2 primitives have an entry in COMPONENTS.md plus a Storybook story. The pair-rule (component + story) is enforced by the verifier.
3. **Storybook Story Pattern** — every component file `foo.tsx` has a sibling `foo.stories.tsx`. Stories use mock data, not real Sanity fetches. Argtypes mirror component variant + state surface.
4. **Sanity Fetch Pattern (Visual Editing compatibility)** — templates fetch via `sanityFetch` from `@/lib/sanity/live`, never directly via `previewClient` or `sanityClient`. `sanityFetch` routes to the stega-configured `previewClient` in draft mode and to `sanityClient` (no stega) otherwise. This is the only path that preserves stega payloads for click-to-edit while keeping production builds clean.
5. **Render-Discipline Pattern** — Sanity-derived strings render directly into JSX. Forbidden transformations (these strip the stega payload): `.replace()`, `.replaceAll()`, regex transforms, `.toString()` re-wrapping, template literal interpolation, capitalisation transforms via JS (use CSS `text-transform` instead). Allowed: direct JSX expression, JSX wrapping, conditional rendering, CSS-based visual transformation, Portable Text via `@portabletext/react` (preserves stega).
6. **Template Location Pattern** — templates live under `site/src/components/templates/{template-slug}/`. Route segments under `site/src/app/` import them. ESLint `jsx-no-literals` rule scopes to this path.

**FEATURE_MAP.md** — new section "Design system + Visual Editing infrastructure" listing files, scripts, patterns established.

**CLAUDE.md** — update:
- Current Phase: DESIGN-1 complete; next phase TEMPLATE-* simple.
- Add new file references for `docs/design/`, `docs/templates/`, `docs/CAPABILITY_LOG.md`, `tools/qa/`.
- Architecture rules: add "Templates render Sanity data, never invent it. ESLint `jsx-no-literals` rule + Sanity Fetch Pattern + Render-Discipline Pattern enforce structurally."
- Tech Debt: confirm #16, #17 still open. Log any new debt found in DESIGN-1.

**SCHEMA.md** — no changes (no DB migrations).

**REGISTRY.md** — extend:
- "Site Components" — add all 20 primitives.
- "Phase Design-Doc Artefacts" — add TOKENS.md, COMPONENTS.md, TIER_1_INVENTORY.md, V0_PROMPT_TEMPLATE.md, VISUAL_EDITING.md, CAPABILITY_LOG.md.
- "Scripts" — add `npm run design:verify`, Storybook scripts, `npm run qa:structural-diff`.
- New "Design Tokens" section listing every named token.

**Capability log** — already created in Step 9; no further update needed.

**State transition:** none. DESIGN-1 ends with `migrations.status = content_complete` (unchanged). Step 11 explicitly notes this in CLAUDE.md so a future planning session doesn't expect a state move.

**Commit point:** `chore(design-1): post-phase doc updates`. Final merge: `feat/design-1` → `main`.

---

## 6. Files created / modified summary

### Files created

```
docs/design/TOKENS.md
docs/design/COMPONENTS.md
docs/design/ICONS.md
docs/design/TIER_1_INVENTORY.md
docs/design/VISUAL_EDITING.md
docs/design/components/{tier-1-component-1}.md
docs/design/components/{tier-1-component-2}.md
... (one per locked Tier-1 component)
docs/templates/_resolved-classifications.md           (NEW per I1 — UNKNOWN handling)
docs/templates/blog/REFERENCE.md
docs/templates/blog/screenshots/*
docs/templates/blog/recordings/*
docs/templates/book-a-call/REFERENCE.md
... (one per template; 13 confirmed + TAXONOMY conditional on §12.6)
docs/templates/_examples/v0-prompt-blog.md
docs/templates/_examples/v0-prompt-team-member.md
docs/templates/_examples/v0-prompt-review.md
docs/V0_PROMPT_TEMPLATE.md
docs/CAPABILITY_LOG.md
site/tailwind.config.ts                                  (overwrites stub)
site/src/styles/tokens.css
site/src/styles/globals.css                              (replaces stub)
site/src/components/ui/{20 primitives}.tsx               (one per primitive)
site/src/components/ui/{20 primitives}.stories.tsx       (one per primitive)
site/src/components/ui/icons/index.ts
site/src/components/ui/icons/{n icons}.tsx
site/src/lib/ui-strings.ts
.storybook/main.ts
.storybook/preview.ts
tests/lint/jsx-no-literals.test.ts
tools/qa/structural-diff.config.ts
tools/qa/structural-diff.test.ts                          (skeleton)
tools/qa/seo-parity.test.ts                                (skeleton)
tools/qa/verify-design-1.ts
tools/qa/run-verify-design-1.ts
scripts/design/extract-gsap-timings.ts                    (NEW per I4)
audit-output/design-1/gsap-*.json                          (gitignored output of GSAP shim)
```

**REMOVED from v1.0 file list:**
- `site/src/components/visual-editing/VisualEditingProvider.tsx` — wrapper component dropped per I8 self-audit; replaced by Sanity Fetch + Render-Discipline conventions documented in CONVENTIONS.md.
- `eslint-rules/no-marketing-string-literals.js` — custom rule replaced by configured `eslint-plugin-jsx-no-literals` per I3 self-audit.
- `tests/lint/no-marketing-string-literals.test.ts` — superseded by `tests/lint/jsx-no-literals.test.ts`.
- `vercel.json` — bogus alias config dropped per C2 self-audit; preview URL routing now via Vercel dashboard.

### Files modified

```
site/src/lib/sanity/client.ts            (extends previewClient with stega config)
site/src/app/page.tsx                    (extended to render homePage.heroHeadline via sanityFetch — smoke test prerequisite per C4)
site/src/app/layout.tsx                  (verify VisualEditing conditional render still in place — no functional change expected)
site/src/app/api/draft-mode/enable/route.ts  (verify same-origin + secret validation; no functional change expected)
studio/sanity.config.ts                  (presentationTool.previewUrl.origin updated to locked URL)
eslint.config.mjs (or .eslintrc.cjs per Step 0b lock)  (registers jsx-no-literals plugin scoped to site/src/components/templates/)
package.json                             (Storybook scripts, design:verify, qa:structural-diff, test:lint, design:extract-gsap)
site/package.json                        (Storybook deps + jsx-no-literals plugin)
CHANGELOG.md
PHASE_HISTORY.md
CONVENTIONS.md
FEATURE_MAP.md
CLAUDE.md
REGISTRY.md
migrations.metadata.content_phase        (Supabase row update — refresh content_migrations_rows from 38 to 42 per I5)
```

### Files NOT touched (verify post-phase)

```
SCHEMA.md                                 (no DB changes)
src/lib/pipeline/state-machine.ts         (no MigrationStatus changes)
src/lib/content/                          (CONTENT-* code untouched)
scripts/content/                          (CONTENT-* scripts untouched)
studio/schemas/                           (schema files untouched; only sanity.config.ts updated)
```

---

## 7. Edge cases / risk register

### A. Animation parity risks

- **GSAP version drift.** CE_SITE_TRUTH §5 confirms `GSAP 3.12.5` from CDN. New site should pin the same version via npm to avoid behaviour drift between minor versions. Step 3 specs lock the version per Tier-1 component.
- **Reduced-motion compliance.** `prefers-reduced-motion: reduce` MUST be respected on every Tier-1 animation. Step 3 spec template makes this a mandatory section.
- **Mobile animation cost.** Some scroll-triggered hero animations are too expensive on mid-tier mobile. The Step 3 breakpoint section forces explicit mobile behaviour (often disable, not down-scale).
- **First Tier-1 hero is the most expensive.** Per Roadmap §11: budget more time for the first one. Step 3 ordering: HOME hero first, in part because it's the learning piece.

### B. AI-aesthetic perception (Roadmap §5.8)

- v0.dev defaults read as "AI-generated" if used naively. Mitigation: Step 1 token extraction from live site forces CE-specific values into Tailwind config; Step 5 v0.dev prompt template injects those tokens into every prompt. Step 4 Storybook review by Jake (and optionally Seb) flags any drift before TEMPLATE-* signs off.
- Generic border-radius / shadow / spacing rhythms are the easiest tells. Step 1 explicitly extracts these per-token from the live site.

### C. Visual Editing pitfalls

- **Stega encoding leaks into production strings.** Mitigation: stega is on `previewClient` only. Production `sanityClient` ships clean. Step 8 verifier check 19 asserts the config flag.
- **Import path drift between Sanity / next-sanity versions.** SCAFFOLD-1 already encountered three brief-mandated paths that don't exist in current versions. Step 8 uses the verified-current paths: `next-sanity/visual-editing`, `sanity/presentation`, `defineLive({ client })`. Hard rule #5 codifies this.
- **Same-origin + secret on draft-mode route.** Existing per SCAFFOLD-1. Step 8 Sub-step 8a re-asserts; functional change not expected.
- **Preview URL DNS dependency.** Locked decision: `preview-mygratr-cloudemployee.vercel.app` to avoid touching DNS pre-cutover. Custom domain preview deferred to LAUNCH.
- **Round-trip latencies (per I6 self-audit — two distinct round-trips):** A click-to-edit ~10s (browser navigation + Studio panel load); B publish-to-preview ~5s (`defineLive` revalidation + Sanity CDN). If Step 8 smoke test exceeds either by >2× target, log as risk; QA-1 retests post-template-build.

### D. Lint rule false positives

- The `jsx-no-literals` plugin scoped to `site/src/components/templates/**` is restrictive. Templates that legitimately render short UI chrome ("Read more", "Loading…") will trip it unless the string is in `UI_STRINGS` (passed via `allowedStrings`). Mitigation: `UI_STRINGS` enum is the explicit allow-list. Add as needed via PR; don't relax the plugin config.
- JSX whitespace and short punctuation are exempted by the plugin's defaults.
- `aria-label`, `alt`, `title` props are scanned (set via `ignoreProps: false`) — these contain user-visible text and should come from data, not literals.

### E. Storybook deployment cost / Vercel plan posture (per I7 self-audit)

Vercel Hobby has a *commercial use* restriction in its TOS — "personal, non-commercial use" — not a project count limit. Mygratr is a commercial product (Saxon.io); CE is a paying customer; both projects (main `cloud-employee` + Storybook) are commercial use. Either:
- The Vercel team is already on Pro (likely if SCAFFOLD-1's deployment-protection feature was used — that's a Pro feature for unlimited password-protected previews), in which case adding a Storybook project costs nothing extra in seats and is unbounded in count.
- OR the Vercel team is on Hobby and there's a TOS issue independent of DESIGN-1.

This is an awareness question, not a DESIGN-1 blocker. Surface to Jake (§12.8). Pre-Step-4 confirmation that Pro is in place avoids a billing surprise mid-phase.

Deployment protection: Storybook URLs are not publicly accessible by default. Reviewers must be added to the Vercel team or use Vercel's protection-bypass tokens. Document in CAPABILITY_LOG.

### F. Tier-1 audit miscount

- Best-estimate 5–10 components; actual count locked at end of Step 3a. If actual count is >10, time budget for Step 3 expands proportionally and the brief gets a v1.1 amendment. If actual is <5, double-check the audit didn't miss anything before locking — under-counting is the more dangerous direction.

### G. Decision fatigue (Roadmap §5.7)

- DESIGN-1 has 11 steps. Steps 2 and 3 are heavy. Take a recovery day between Step 3 and Step 4. Don't compress steps.

### H. Self-execution complexity ceiling (Roadmap §5.9)

- Most likely blocker: a Tier-1 animation that won't reproduce cleanly in GSAP/Framer Motion within Jake + Claude Code's working capability. Half-day decision rule: scope a tactical dev consult against the specific block. Budget envelope $0–2000 enforces discipline.

### I. Schema-vs-template drift discovered late

- The field-to-UI map in per-template REFERENCE.md is the load-bearing artefact for catching schema-vs-render drift. If Step 7 surfaces a missing or mis-mapped field (e.g. SEO field on a Sanity doc that the live page doesn't actually expose), surface immediately to Jake as a brief deviation rather than ad-libbing.

### J. UNKNOWN templates (per I1 self-audit)

- The 4 UNKNOWN URLs from AUDIT-1 (Cloudflare challenge, sitemap.xml, hash URL, `/uk/embedding`) are tracked in CLAUDE.md Tech Debt #9. v1.1 dropped UNKNOWN from the per-template REFERENCE.md set. Resolution recorded in `docs/templates/_resolved-classifications.md`: `/uk/embedding` → STATIC (UK locale variant of /embedding singleton); the other three are not real pages and resolve via the AUDIT-1 content-type filter fix carried as Tech Debt #9.

---

## 8. Exit criteria

DESIGN-1 is Done when **all** of these hold:

1. `npm run design:verify` exits 0. All 28 verifier checks pass (count revised in v1.1).
2. `npm run build` passes from repo root.
3. `npm run build` passes in `site/`.
4. `npm run build` passes in `studio/`.
5. `npm run build-storybook` passes in `site/` and Storybook is reachable at the locked Vercel preview-storybook URL.
6. `docs/design/TIER_1_INVENTORY.md` is locked at its own v1.0 (this is the inventory's first version) with the actual Tier-1 component count.
7. Every primitive (Step 2 set) has component file + Storybook story + COMPONENTS.md entry.
8. Every Tier-1 component (Step 3 locked set) has 8-section spec + Storybook story.
9. Every confirmed template (13 from §7 table + TAXONOMY conditional on §12.6) has `docs/templates/{slug}/REFERENCE.md` with field-to-UI map AND schema-vs-reality findings sections. `docs/templates/_resolved-classifications.md` exists for UNKNOWN handling.
10. Visual Editing round-trip smoke test on the homePage placeholder passes both round-trips: A click rendered text → Studio focuses correct field within ~10s; B Studio publish → preview reflects within ~5s. Both timings recorded in PHASE_HISTORY.
11. `eslint-plugin-jsx-no-literals` configured with `allowedStrings` from `UI_STRINGS`, scoped to `site/src/components/templates/**`. Unit test passes — passing fixture has zero errors, failing fixture surfaces the rule.
12. `STRUCTURAL_DIFF_SPECS` in `tools/qa/structural-diff.config.ts` has 13 entries (or 14 if TAXONOMY resolved per §12.6) with thresholds matching Decision D2 + Step 7 per-template fidelity targets.
13. `docs/CAPABILITY_LOG.md` exists at repo root with the DESIGN-1 entry covering all 8 sub-section topics from Step 9 (written in retrospective voice per M4).
14. CHANGELOG.md, PHASE_HISTORY.md, CONVENTIONS.md (5 new patterns per Step 11), FEATURE_MAP.md, CLAUDE.md, REGISTRY.md updated per Step 11.
15. `migrations.status === 'content_complete'` (unchanged from phase start). `migrations.metadata.content_phase.content_migrations_rows === 42` (refreshed from stale 38 per Step 0a).
16. `feat/design-1` merged to `main` and pushed to `origin/main`.

---

## 9. Cross-model audit targets

Run before marking brief READY FOR BUILD. Locked at `preset:full` (~$1.00–$2.00).

```bash
npx tsx .audit/scripts/audit-distribute.ts \
  --brief=docs/briefs/active/MYGRATR-DESIGN-1_BRIEF_v1.2.md \
  --models=preset:full
```

Six frontier models. Justified scope:

- Structural patterns being established (token system, component spec, Storybook pattern, Sanity Fetch + Render-Discipline conventions per I8) — these set precedent for every subsequent phase. Cheaper to find a flaw at brief-audit time than at phase-close.
- Visual Editing infrastructure is known to drift across Sanity/next-sanity package versions (per SCAFFOLD-1 surprises). Multi-model review increases the chance of catching a current-API mismatch.
- ESLint plugin configuration needs adversarial review for false-positive risk (the v1.0 custom rule was caught broken by self-audit; v1.1 swap to `eslint-plugin-jsx-no-literals` needs cross-model verification).
- Fidelity guarantees include a structural-diff config that QA-1 will rely on — getting the threshold-per-template right at brief time is high-leverage.

After synthesis, triage with the standard template (FIX NOW / DEFER / DISMISS). Apply FIX NOW items to brief. Bump v1.2 → v1.3. v1.3 is the LOCKED version that goes to Claude Code for execution.

---

## 10. Audit prompts (per CONTENT-1D §10 pattern)

For human reviewers (or Cross-Model Audit Kit specialist prompts), here are domain-specific prompt augmentations to send alongside the brief:

### 10a. Visual Editing infrastructure auditor

> You are reviewing a Sanity Visual Editing setup using `next-sanity` and `sanity/presentation` under Next.js 16 App Router. Specifically check:
> 1. Stega encoding is on the preview client only, not the production client.
> 2. Import paths used in the brief actually exist in current package versions (next-sanity ≥ 12, sanity ≥ 4). If any import path is outdated, name the current correct path.
> 3. The draft-mode enable route validates same-origin and secret. Any missing security check?
> 4. v1.1 dropped the `<VisualEditingProvider>` wrapper-per-template in favour of two CONVENTIONS.md patterns (Sanity Fetch Pattern + Render-Discipline Pattern). Are these conventions sufficient, or is there a case where stega payloads are stripped that the conventions don't cover (e.g., Portable Text custom serialisers, image alt-text rendering, structured data JSON-LD generation)?
> 5. Click-to-edit round-trip A (target ~10s) and publish-to-preview round-trip B (target ~5s): is the path complete for both? Where could each break?

### 10b. Lint rule auditor

> You are reviewing the use of `eslint-plugin-jsx-no-literals` (configured with `allowedStrings: Object.values(UI_STRINGS)`) scoped to `site/src/components/templates/**`. Check:
> 1. False positive rate: what real template patterns will trip it that shouldn't?
> 2. False negative rate: what marketing-string patterns slip through (template literals with interpolation, computed strings, conditional rendering of literal arms)?
> 3. Is the file-path scoping (`site/src/components/templates/**`) sufficient, or does it under-cover (e.g., shared layout files that contain marketing copy, route segments that render content directly)?
> 4. Is `Object.values(UI_STRINGS)` resolvable at lint time? It requires importing TS at lint config load — consider whether a build-time JSON dump is more reliable.
> 5. The `elementOverrides` for `img` (alt must come from data) and `button` (allowedStrings UI_STRINGS only) — sufficient? Missing element overrides?

### 10c. Spec quality auditor

> You are reviewing the Tier-1 complex-component spec template (8 mandatory sections). For a hero animation built from this spec by a non-author dev:
> 1. Is the spec self-contained, or are there gaps that require asking the original author?
> 2. Is the data-binding section precise enough that a Sanity-schema-vs-render mismatch surfaces at spec-review, not at runtime?
> 3. Is the timing table sufficient for animation reproduction without screen-recording playback?
> 4. Are accessibility / reduced-motion concerns adequately addressed?
> 5. Does the acceptance criteria checklist actually verify what the spec says?

### 10d. Structural-diff config auditor

> You are reviewing per-template structural-diff thresholds. Check:
> 1. Are the per-template thresholds (97% simple, 88–93% complex) reasonable given that the new site renders on a different stack (Next.js + Tailwind) than the live site (Webflow + custom CSS)?
> 2. Are the `ignoreSelectors` lists comprehensive enough to cover dynamic content (chat widgets, dates, ad slots) without over-masking?
> 3. Is the breakpoint set (1440 / 768 / 375) sufficient, or should additional breakpoints be added per template?
> 4. Is the live-vs-new URL pairing strategy resilient to URL pattern changes between live and new (e.g. /blog/{slug} unchanged, but /uk/blog/{slug} was new)?

### 10e. Capability log auditor

> You are reviewing the CAPABILITY_LOG scaffold. Check:
> 1. Are the topic areas in the DESIGN-1 entry sufficient for customer-2 to bypass first-principles work, or are key learning topics missing?
> 2. Is the customer-2 reusability assessment going to be tractable to maintain per phase?
> 3. Is the append-only discipline going to hold under the post-phase-update protocol pressure (CHANGELOG → ... → CAPABILITY_LOG ordering)?

---

## 11. Mygratr-reusable primitives established

These are the primitives DESIGN-1 produces that are reusable for customer 2+ and should be treated as Mygratr productisation IP:

| Primitive | Reusability | Customer-2 effort to reuse |
|---|---|---|
| Token extraction methodology (Step 1) | 100% reusable | half-day per customer (extraction itself is the work; methodology is free) |
| Tailwind config + token CSS structure (Step 1) | Structure 100%, values customer-specific | 1 hour to swap values |
| Primitive component set (~20) (Step 2) | 80% reusable (form/overlay/state primitives are universal; brand-tuned variants are CE-specific) | 2 days per customer to retune |
| Storybook scaffold + story pattern (Step 4) | 100% reusable | 1 hour per customer |
| v0.dev prompt template structure (Step 5) | 100% reusable | 0 effort per customer; the template is the artefact |
| Custom ESLint rule + UI_STRINGS pattern (Step 6) | 100% reusable | 0 effort per customer |
| Playwright structural-diff config (Step 6) | Structure 100%, per-template values customer-specific | 1 hour per customer |
| Per-template REFERENCE.md template (Step 7) | 100% reusable | template-by-template work is the same per customer |
| Visual Editing config (stega + Sanity Fetch + Render-Discipline patterns) (Step 8) | 100% reusable | 0 effort per customer |
| Capability log structure (Step 9) | 100% reusable | append a new entry per customer |
| Verifier pattern (Step 10) | Structure 100%, asserts customer-specific | 2 hours per customer to adapt assertions |
| Tier-1 spec template (Step 3) | 100% reusable; specifics per customer | template is free; specifics scale with site complexity |
| Complex-component spec methodology (Step 3) | 100% reusable | 0 effort per customer |

**Customer-2 fast-path projection (with DESIGN-1 IP in hand):**
- Steps 1, 4, 5, 6, 8, 9 → ~3 days total (vs ~5 days in CE first-time)
- Steps 2, 3, 7 → scale with customer site complexity, but informed by templates not first-principles. ~5 days for a CE-equivalent customer (vs ~7 days first-time).
- Total customer-2 DESIGN-equivalent phase: ~8 days vs CE's ~10–14 days. Roughly 1.5x speedup at this phase. The compounding effect across TEMPLATE-* phases is where the 5x estimate from Roadmap §11 lands.

---

## 12. Decisions for Jake (open questions)

These need explicit Jake judgment before Step start. Surface in v1.1 audit if not resolved before lock:

1. **Storybook hosting:** locked decision is Vercel separate project at `preview-storybook-mygratr-cloudemployee.vercel.app`. Confirm Vercel team supports adding a third project on current plan (main, storybook, plus any Beem/other shared with this account).
2. **Icon set source:** Step 2 sub-pass identifies whether CE uses Lucide / Heroicons / custom. If custom, whether to extract every used SVG into `site/src/components/ui/icons/` as Step 2 specifies, or to import from a CDN. Recommend: extract — CDN dependency is fragile and the icon set is small.
3. **GSAP license:** GSAP 3.12.5 was used on CE's live site under GSAP's Standard No Charge license (which covers most public sites including commercial). The migration triggers a fresh license evaluation, but **Standard license is sufficient for CE's use case** unless a Tier-1 component (per Step 3 audit) requires premium plugins (DrawSVG, MorphSVG, ScrollSmoother, SplitText, MotionPath, Inertia). If Step 3 identifies a premium-plugin dependency, Club GreenSock at ~$99/year covers it. Alternative: rebuild that timeline in Framer Motion or CSS. Surface to Jake when Step 3 audit completes — not a pre-Step blocker.
4. **Vercel deployment protection on Storybook:** confirm Jake wants password-protected Storybook (default) vs. publicly accessible. Default is protected; public makes review easier but exposes work-in-progress visuals.
5. **ESLint rule strictness for short alphanumerics:** the off-the-shelf `jsx-no-literals` plugin will flag strings like "v10", "Q1 '26", "$99" that are 3+ char alphanumerics in template files. Recommend: add these as needed to `UI_STRINGS` (or a sibling enum like `UI_PATTERNS`) rather than relaxing the rule. The point of structural enforcement is that exceptions go through a reviewable allow-list, not a fuzzy threshold. Confirm approach with Jake.
6. **TAXONOMY template mapping (per I1 self-audit):** TAXONOMY appears in CE_SITE_TRUTH.md §1's template-type enum but has no clean mapping to a Sanity document type or singleton in MYGRATR_SCHEMA_DESIGN_DECISIONS.md. Likely candidates: `blogCategory` (the `/[category-slug]/[post-slug]` pattern in §3.3), `tag` (referenced from blogPost / compareBlog / download), or a hub singleton. **Pre-Step-7 question:** which URL pattern on the live CE site does TAXONOMY actually correspond to, and which Sanity type renders it? If unanswerable from project knowledge, brief deviation pass against the live site before TAXONOMY's REFERENCE.md is written. Step 7 verifier check 16 is conditional on this resolution.
7. **Vercel preview routing — production-branch alias vs separate project (per C2 self-audit):** Sub-step 8a locks `preview-mygratr-cloudemployee.vercel.app` as the preview URL, attached to the `cloud-employee` project's production branch (`main`). Question: when the site goes live post-LAUNCH, `main`'s deployment becomes the actual live `cloudemployee.io`. At that point, do we want the preview subdomain to *still* point at production (i.e., preview = live), or to a separate `preview` branch? Recommend: separate preview branch post-LAUNCH; until then, production-branch alias is fine because main is not yet pointing at the customer-facing domain. Confirm before Step 8.
8. **Vercel plan tier (per I7 self-audit):** is the Vercel team running Mygratr's projects on Hobby or Pro? Hobby has commercial-use restrictions that may apply to a paying-customer migration site. Pro has no such restriction and supports unlimited projects. If currently Hobby, evaluate whether the CE migration needs Pro before launch. This is a tracker question, not a DESIGN-1 blocker — surface for Jake's awareness.

---

## 13. Estimated runtime breakdown (rebaselined per I2 self-audit)

| Step | Effort | Notes |
|---|---|---|
| 0 — Pre-flight + branch + metadata refresh + ESLint config check | 0.5 day | Includes I5 metadata refresh, M7 ESLint config lock |
| 1 — Tokens + Tailwind config + GSAP instrumentation | 1.5 days | Live extraction is the load-bearing part; GSAP shim adds ~3 hours |
| 2 — Primitive components + stories | 4 days | 20 primitives @ ~1.5–2 hours each (component + variant tuning + COMPONENTS.md entry + story); v1.0's 1 hour each was unrealistic |
| 3 — Tier-1 audit + complex specs | 4.5 days | Half-day audit + 5–10 specs @ 0.5–1 day each (HOME hero is the learning piece per Roadmap §11) |
| 4 — Storybook scaffold + deployment | 1.5 days | Init + config + Vercel deploy + protection + tokens.css imported into preview |
| 5 — v0.dev prompt template | 0.5 day | Template + 3 worked examples |
| 6 — Fidelity guarantee mechanisms | 1 day | Lint config + test + structural-diff skeleton + SEO skeleton |
| 7 — Per-template visual references | 3 days | 13 confirmed (+ 1 conditional) templates @ 1.5–2 hours each (8–10 screenshots × 3 breakpoints + annotation + field-to-UI map + schema-vs-reality reconciliation per C1) |
| 8 — Visual Editing infrastructure | 1.5 days | Stega config + smoke-test fixture + Studio config + Vercel domain + operator doc + actual smoke test with timing |
| 9 — Capability log scaffold + entry | 0.5 day | Consolidates running drafts from Steps 1–8 |
| 10 — Verifier | 0.5 day | 28 checks + CLI |
| 11 — Post-phase docs | 1 day | CHANGELOG + PHASE_HISTORY + CONVENTIONS + FEATURE_MAP + CLAUDE.md + REGISTRY.md |

**Total: ~19.5 build days + 1.5 recovery days = ~21 working days = ~3 weeks of focused work.** Within Jake-wide tolerance. **Rebaselined from v1.0's 14-day claim** which was calibrated for an experienced developer, not for "Jake + Claude Code under dev-light operating posture."

If Jake wants to compress: drop UNKNOWN handling work (already done in v1.1), defer one Tier-1 component spec to TEMPLATE-* learning (caveat: this gives up the spec contract for that component), or trim the Tier-2 primitive set from 20 to 15 (drop Modal+Dialog redundancy, drop FileUpload until needed). None of these are recommended without explicit Jake call.

**Recovery days (Roadmap §5.7):** half-day after Step 3, half-day after Step 7, plus 0.5 day of slack. Counted in the 21-day total (1.5 of which is recovery/slack on top of the 19.5 build sum).

---

## 14. Halt-and-escalate triggers

If any of the following occur during execution, halt and surface to Jake before continuing:

1. Pre-flight check failure in Step 0.
2. Live-site token extraction yields values that contradict CE_SITE_TRUTH.md (recent design changes on live site mean audit data is stale).
3. Step 3 audit yields >10 Tier-1 components — time budget needs re-baselining.
4. Visual Editing smoke test in Step 8: round-trip A (click-to-edit) exceeds 20s OR round-trip B (publish-to-preview) exceeds 10s. (Targets are 10s/5s; halt threshold is 2× target per I6.)
5. ESLint rule + UI_STRINGS configuration cannot achieve clean separation (false-positive rate too high to ship; UI_STRINGS would need to grow to >50 entries to suppress real-template noise).
6. Tier-1 complex-component spec discovers that Sanity schema is missing a field needed by the live UI — schema change is out of scope for DESIGN-1; surface for STATIC-1 or a SCHEMA-2 mini-phase.
7. Vercel project quota / TOS issue blocks adding the Storybook project (per §12.8 Vercel plan tier question).
8. Sanity preview client stega config disabled by package version regression — investigate before committing the broken config.
9. Any failure of Tech Debt #16 (`customerStory.companyLogo`) to render gracefully under template fallback — surface for the recommended schema-side fix.
10. Schema-vs-reality reconciliation pass in Step 7 surfaces a Tech-Debt-#16-shaped issue on a non-trivial field set across multiple doc types — STATIC-1 / SCHEMA-2 mini-phase scoping conversation needed.

---

## 15. Brief lifecycle

- **v1.0 (2026-05-03):** Initial draft. Self-audit pass produced 4 critical / 9 important / 7 minor findings.
- **v1.1 (2026-05-03):** Self-audit findings applied surgically. No structural reflow. Second self-audit caught residual v1.0 fragments.
- **v1.2 (2026-05-03):** Second self-audit findings applied (4 critical / 5 important / 3 minor — all stale-reference cleanup from v1.1's surgical sweep). HALT FOR REVIEW after this version. Jake reviews v1.2; resolves §12 open questions (especially §12.6 TAXONOMY and §12.7 Vercel project structure) before lock.
- **v1.3 (next, post-cross-model-audit):** `preset:full` audit findings applied. Synthesis triaged FIX NOW / DEFER / DISMISS. v1.3 is the LOCKED version that goes to Claude Code for execution.
- Brief deviations during execution → tracked as DEV-N entries appended to this brief, surfaced in PHASE_HISTORY.

After v1.2 lock, this brief moves from `docs/briefs/active/` to `docs/briefs/archive/` at phase close.

---

*End of MYGRATR-DESIGN-1_BRIEF_v1.2.md*

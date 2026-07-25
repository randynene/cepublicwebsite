# MYGRATR-DESIGN-1 — Design Tokens, Primitive Components, Complex-Component Specs, Visual Editing, Fidelity Guarantees

| Field | Value |
|---|---|
| Phase ID | MYGRATR-DESIGN-1 |
| Brief version | v2.0 |
| Status | LOCKED for execution |
| Predecessor | MYGRATR-CONTENT-1D-CLEANUP (closed 2026-05-02) |
| Successor | MYGRATR-TEMPLATE-* (simple templates first: BLOG, TEAM_MEMBER, REVIEW, VIDEO, BOOK_A_CALL, DOWNLOAD) |
| Operating posture | Jake + Claude Code primary executor. Surgical dev consult only on blockers exceeding the half-day rule (Roadmap §0). Budget envelope $0–2000 across entire CE migration. |
| Current state | Step 0 closed (commit `95de0e6`). Step 1 closed (commit `95cb9b9`). DEV-6 + DEV-7 closed (commit `199c952`). Branch `feat/design-1` is 5 commits ahead of `origin/main`, pushed to `origin/feat/design-1`. About to start Step 2. |
| Estimated runtime | ~3 weeks of focused work (~22 working days). Heavily front-loaded: ~65% spec-writing, ~35% code construction. Rebaselined from v1.0's 1.5–2 weeks after self-audit; per-step numbers in §13 honestly reflect the locked scope. |
| Cross-model audit target | `preset:full` (~$1.00–$2.00) for v1.0–v1.5 was applied (3 audits, 50+ findings). v2.0 is a structural rewrite reflecting lived execution; cross-model audit on v2.0 is OPTIONAL (`preset:quick` if run at all — diminishing returns established). |

---

## Brief changelog

- **v2.0 (2026-05-05):** Structural rewrite reflecting lived execution. **Three completed steps now reflect what actually shipped** (Step 0 close commit `95de0e6`, Step 1 close commit `95cb9b9`, DEV-6 + DEV-7 close commit `199c952`). DEV-1 through DEV-7 entries reflected against current step content. **Cross-cutting decisions surfaced during Step 0–1 execution and pre-Step-2 planning, propagated consistently across the brief:** (1) **shadcn DROPPED** — primitives hand-built atop `@radix-ui/*` directly (Step 2 §5 re-locked); shadcn's default styling is friction when matching CE exactly. (2) **Storybook deferral hardened** — explicitly NOT installed at Step 2; revisited as explicit decision at Step 4 entry depending on whether external dev handoff is in play. The `.stories.tsx` pair-rule from v1.5 is dropped. Verifier check #11 (build-storybook) becomes conditional on Step 4 decision. (3) **Material Symbols DROPPED** — pre-Step-2 icon probe confirmed zero rendered usage on CE. Icon strategy: SVG sprite extracted from CE's actual icons (~10–20 distinct after vendor-filtering YouTube + chat widgets). No `lucide-react`. (4) **CVA standardized** — `class-variance-authority` is the variant API for all hand-built primitives. (5) **No-className-variants rule** added project-wide — primitives expose all visual variations as typed props (variant / size / tone / state); future content-driven workflows (Sanity payloads, AI-generated landing pages, A/B variant routing) require structured props, not classnames. (6) **GSAP boundary explicit** — primitives MAY NOT import `gsap` or `framer-motion`. Templates (Step 4+) handle all GSAP work. Primitive hover transitions are CSS-only via Tailwind utilities derived from Step 1 motion tokens. (7) **Storybook references purged from Steps 4, 6, 9, 10, 11** where they would otherwise leave stale references. (8) **§15 deviations log carries DEV-1 through DEV-7** as recorded during Step 0–1 + DEV-6/7 execution. Step 2 re-locked under §5 with the locked decisions, primitive inventory (22 + Icon = 23 components), build sequence with first-of-kind halt cadence, and verifier checks. Cross-model audit not run on v2.0 (diminishing returns established at v1.5; the changes are structural reflection of lived execution, not new architecture).
- **v1.5 (2026-05-03):** Third cross-model audit applied (verdict FIXES NEEDED — 3 critical / 18 important / 9 minor / 4 dismissed). All 30 findings applied surgically (or explicitly dismissed/deferred with rationale). **F1 (critical):** prebuild path resolution — switched to Option B (pre-generate `site/src/lib/ui-strings.ts` and commit; CI `git diff --exit-code` enforces sync; removes runtime `tsx` dependency entirely; eliminates Vercel root-directory path-resolution failure mode). **F2 (critical):** explicit pre-execution checklist item added — "confirm SCAFFOLD-1 enable route replaced before Step 8d2 verifier"; `SANITY_PREVIEW_SECRET` added to env Zod schema. **F3 (critical):** `pkg.exports` probe replaced with actual `import()` resolution probe; verifier re-runs at execution time. **F4** token-scope probe accepts only 403/401 as definitive read-only proof; other statuses surface as "inconclusive — manual verification required." **F5/F8** origin allowlist normalised via `URL` parsing; Vercel preview URL added to allowlist when `VERCEL_ENV === 'preview'`; localhost added when `NODE_ENV === 'development'`. **F6** bypass token CI guidance hardened — Vercel per-deployment bypass over shared secret; status-code-only error logging. **F7** `SANITY_STEGA_ENABLED` explicit boolean primary gate with `VERCEL_ENV === 'preview'` default; documented for non-Vercel deployments. **F9** mandatory non-skippable Studio Presentation Tool POST-verification step inserted between smoke test items 5 and 6; new verifier #19e. **F10** draft-fetch smoke assertion added (CDN-bypass tested, not assumed). **F11** verifier #13a uses TS AST extraction + semantic deep-compare only (byte comparison removed). **F12/F13/F14** GSAP shim caveats sharpened: pre-assignment buffer, ScrollTrigger.create direct instrumentation noted as v2 hardening, robust serializer requirements documented. **F15** behavioral stega regex scoped to `<h1>` test-id wrapper, not whole HTML. **F16** corrected `curl` syntax to `-H "$(cat ~/.mygratr/vercel-bypass-header.txt)"` (`@file` is for `-d`, not `-H`). **F17** F15-Closed Pattern renamed to "draft-mode route hardening" (covers both enable + disable). **F18** verifier numbering convention formalised (preserved suffixes for audit continuity); count claims replaced with "all verifier assertions pass." **F19** Render-Discipline Pattern count corrected to "five sub-rules (6a–6e)." **F20** resolution-direction enum formalised in Step 7 + CONVENTIONS.md with `decision-needed` value added. **F21** Storybook compat probe extended to install-and-build test in throwaway directory; half-day rule clarified to "wall-clock from Step 4 start." **Minors F22–F30** all applied (CONVENTIONS.md status header refresh, §0 pattern count claim removed, warm-vs-cold round-trip B protocol, Storybook pair-rule file location, ESLint Step 6 mutually-exclusive branch blocks, Hard Rule #7 two-rule reference, AST coverage non-goals, `@eslint/compat` placement). **Dismissed (4):** Storybook script location (deliberate monorepo pattern), tombstone numbering meta-convention (absorbed into F18), pair-rule consolidation (refactor preference, not correctness), production stega minor logic angle (subsumed by F7). **Brief-state assessment:** 3 cross-model audits, 50+ findings applied across 5 versions. Architectural patterns held cleanly under three audits. Lock as v1.5 immediately after self-review; do NOT run a 4th audit (diminishing returns established).
- **v1.4 (2026-05-03):** Second cross-model audit applied (run `2026-05-03T09-43-24-392-fkhg`, $1.53 + $0.15 synthesis, 5 diverse-provider panels: Opus 4.7 / GPT-5.4 / Gemini 2.5 Pro / Grok 4.20 / DeepSeek V3.2). Verdict: 3 critical / 11 important / 6 minor / 7 dismissed. **All 9 v1.3-introduced architectural patterns held up cleanly** — findings are integration defects on the new patterns, not architectural flaws. v1.4 applies 11 fixes + 5 stale-reference cleanups Claude Code spotted during the read-through. Key corrections: **(F3 critical)** seed-hero-headline.ts reverted to manual Studio seed (token misuse on `SANITY_MIGRATION_WRITE_TOKEN`); **(F5 important)** symmetric F15 hardening on `enable` route (CSRF gap); **(F13 important, 2-model consensus)** `tsx` added to devDependencies + `mkdir -p` guard in generate-ui-strings; **(F7 important, 2-model consensus)** token-scope probe error-code logic + cleanup-on-write-success; **(F14 important)** `org_id` filter added to SQL subquery; **(F4 important)** production behavioral stega check carried forward to QA-1 as Tech Debt #18; **(F8/F9/F6/F18/F19)** wording narrowed and small precision edits. **(F10/F11/F12)** GSAP shim hardening deferred to v2 with CAPABILITY_LOG note (best-effort by design). **Dismissed:** F1 (blogPost.author already in Step 7), F2 (TAXONOMY already in §12.6), F15/F16/F17/F20 (out of scope or moot post-F3 revert). **Stale-reference cleanups:** §7C v1.2 URL, Exit #11/#14 stale counts, §0.4 patterns count, §10b.4 stale framing, Tech Debt #15 line about `previewClient`. **Re-audit plan:** `preset:quick` on v1.4 to catch regressions, then LOCK.
- **v1.3 (2026-05-03):** Cross-model audit applied (run `2026-05-03T09-05-40-413-j0a8`, $1.90 + $0.18 synthesis). Verdict: 3 critical / 11 important / 7 minor. All 3 criticals fixed with cascading consequences (4 importants collapse into critical fixes). Key corrections: **(CMA-C1) ESLint `UI_STRINGS` import via JSON source-of-truth + generation script** — replaces the unworkable TS import in v1.2's Step 6; new Step 0c added; cascades into #5 (lint coverage) and #13 (`@eslint/compat` `fixupPluginRules`). **(CMA-C2) Sanity Fetch Pattern rewritten end-to-end** — `defineLive` takes one client, `serverToken` for draft fetches, conditional stega gated on `VERCEL_ENV` on `sanityClient` itself; cascades into #6 (Render-Discipline expansion to Portable Text serialisers / JSON-LD / alt-aria / derived labels), #7 (symmetric stega-disable assertion on production client), #14 (behavioral verifier replaces config-shape check). **(CMA-C3) Pre-Step-8 `pkg.exports` probe** — Hard Rule #5 references probe output rather than mandating sub-paths; protects against `next-sanity` version drift. **(CMA-I10 — Vercel domain — DECISION A)** dropped `.vercel.app` custom subdomain plan (Vercel reserves the TLD); now using auto-generated stable Vercel project URL for DESIGN-1, custom domain deferred to LAUNCH. **(CMA-I8)** SCAFFOLD-1 deferred F15 closed in Step 8 (POST-only + origin check on draft-mode disable route). **(CMA-I9)** `SANITY_API_READ_TOKEN` viewer-scope verification added to Step 0. **(CMA-I11)** Storybook ↔ Next.js 16 compatibility probe added pre-Step-4. **(CMA-I12)** §14 wins on halt thresholds; diagnostic checklist added. **(CMA-I4)** Verifier #17 tightened — non-empty + resolution-direction assertion. Minors #15, #17, #18 applied. Minors #19, #20, #21 captured as caveats. **Re-audit plan:** `preset:quick` on v1.3 to catch regressions, then LOCK.
- **v1.2 (2026-05-03):** Second self-audit pass — caught residual v1.0 fragments missed by v1.1's surgical sweep. 4 critical / 5 important / 3 minor. All landed. Key corrections: (C1.1) Hard Rule #5 rewritten to remove wrapper-component framing; (C1.2) Hard Rule #7 path corrected to `site/src/components/templates/`; (C1.3) Step 5 v0.dev prompt template path + slug case corrected; (C1.4) Step 6 Output line rewritten with correct rule name + path + ESLint version attribution; (I1.1) §0 authoritative-inputs convention count corrected from 4 to 6 with updated names; (I1.2) Step 9 capability-log structure guidance unstaled; (I1.3) §11 reusable-primitives table row for Visual Editing rewritten; (I1.4) §13 runtime arithmetic made explicit (19.5 build + 1.5 recovery = ~21); (I1.7) Step 11 "five new sections" → "six"; minors: heading consistency, audit-output sub-dir reference, TIER_1_INVENTORY versioning note.
- **v1.1 (2026-05-03):** Self-audit findings applied (4 critical / 9 important / 7 minor). Surgical edits, no structural reflow. Key corrections: (C1) Step 7 worked example rewritten to cite only schema-verifiable fields, schema-vs-reality reconciliation sub-step added; (C2) Sub-step 8d Vercel routing rewritten to use dashboard "Domains" config rather than bogus `vercel.json` aliasing; (C3) verifier check #19 uses `previewClient.config()` not source-text grep; (C4) Step 8 smoke test now renders `homePage.heroHeadline` from seeded singleton to give stega payload to click; (I1) UNKNOWN dropped from 15-template set, TAXONOMY surfaced for Jake verification, count adjusted to 13 confirmed + 1 pending; (I2) runtime rebaselined to 2.5–3 weeks; (I3) lint rule rewritten using `eslint-plugin-jsx-no-literals` with `allowedStrings`; (I4) GSAP timing extraction uses Playwright instrumentation shim; (I5) Step 0 metadata refresh sub-step added; (I6) round-trip targets distinguished (10s click→Studio, 5s publish→preview); (I7) Vercel plan question surfaced in §12; (I8) `<VisualEditingProvider>` wrapper component dropped — replaced with `sanityFetch` data-fetch pattern + render-discipline conventions; (I9) `site/src/components/templates/` location locked.
- **v1.0 (2026-05-03):** Initial draft. Six locked scoping decisions from prior planning session embedded. Step ordering: 0 → 11. Tier-1 audit (Step 3) precedes complex-component spec writing. Step 6 (fidelity mechanisms) precedes Step 7 (per-template reference docs) so the structural-diff config has a concrete consumer pattern when reference docs are produced.

---

## 0. Authoritative inputs

Read in this order before executing any step:

1. `MYGRATR_PHASE_ROADMAP_v2.md` — §0 operating posture, §3.0 spec-quality reframe, §3.1–§3.7 DESIGN-1 deliverables, §3.7 fidelity guarantees, §3.9 (this brief introduces §3.9 — Visual Editing infrastructure as a sub-section), §5 risk register (§5.7–§5.9 directly relevant), §11 capability development.
2. `MYGRATR_FULL_SCOPE_v0_1.md` — master scope.
3. `CLAUDE.md` — current state. `migrations.status = content_complete`. 388 CMS docs. Tech Debt #15 closed; #16 and #17 open and not blocking.
4. `CONVENTIONS.md` — authoritative established patterns through CONTENT-1D-CLEANUP (per F23 v1.5 — count claim removed; see file for current set). DESIGN-1 adds patterns: Token System, Component Specification, Sanity Client, Sanity Fetch, Render-Discipline, Template Location, Draft-Mode Route Hardening (see Step 11). **Storybook Story pattern is conditional** — added IF Storybook IN per Step 4 entry decision; omitted IF OUT.
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
| D5 | Storybook scope | **v2.0 supersession — conditional, decided at Step 4 entry.** Original v1.5 lock (Option B — primitives + Tier-1, Vercel-deployed) is preserved as the Path A scope IF Storybook IN. Path B (Storybook OUT) is the alternative if dev-light execution + kitchen-sink demo continue to suffice. See Step 4 for decision criteria. |
| D6 | Capability log | **Option A — DESIGN-1 creates `docs/CAPABILITY_LOG.md` as Step 9 deliverable.** First entry covers token system architecture decisions, primitive component patterns adopted, Storybook setup approach (or deferral rationale per D5), complex-component specification methodology, Visual Editing infrastructure choices. Maintained per phase from here. |

**Spec-quality framing (Roadmap §3.0):** DESIGN-1 is not a "build a design system" phase. It's a "build a specification system precise enough that the next phase produces correct first drafts" phase. Time allocation: ~65% spec / ~35% code. The four-tier specificity model applies (Tier 1 max-spec, Tier 2 convergent, Tier 3 medium, Tier 4 low).

---

## 2. Pre-phase state (verified)

### Repo state

- Current branch: `main`. Last merge: `feat/content-1d-cleanup` (CONTENT-1D-CLEANUP).
- `site/` exists, Next.js 16 app, Vercel root directory. Layout, root page, UK locale routes, third-party-scripts component, locale provider, draft-mode handlers, Sanity client + preview client, redirects pipeline — all live from SCAFFOLD-1. **Updated through Step 1:** `site/src/app/tokens.css` + `site/src/app/globals.css` (token-driven body styles) + `site/src/app/layout.tsx` (Inter → Poppins via DEV-4) all shipped.
- `studio/` exists, Sanity Studio v5 deployed at `mygratr-cloudemployee.sanity.studio`. 71 schema types. Presentation Tool wired in `sanity.config.ts` (imported from `sanity/presentation`).
- `site/src/components/ui/` does **not** yet exist. **No shadcn init planned** (decision locked at Step 2). Tailwind v4 CSS-first config in `site/src/app/tokens.css` per DEV-3.
- `site/.storybook/` does **not** yet exist. Storybook 10 throwaway compat probe passed at Step 0d (DEV-2). Real install deferred to Step 4 conditional.
- `docs/design/` exists with `TOKENS.md` (561 lines) + `PERFORMANCE_BUDGETS.md` (131 lines) shipped. `docs/templates/`, `docs/design/components/` do **not** yet exist.
- `docs/CAPABILITY_LOG.md` does **not** yet exist (Step 9 deliverable; running notes at `audit-output/design-1/capability-log-draft.md`).
- ESLint config locked to flat config style at `site/eslint.config.mjs` (Step 0b, DEV via the locked-style probe). No string-literal lint rule yet (Step 6 deliverable).
- Playwright is installed (used in CONTENT-1D for live-site meta scraping; reused in Step 1 diagnostics). No structural-diff config yet.

### Data state

- `migrations.status = content_complete`, `current_phase = content_complete`, `metadata.content_phase = { total_cms_docs: 388, smoke_test_docs_remaining: 0, content_migrations_rows: 38 (stale-low; actual 42 incl. CONTENT-1D-CLEANUP audit rows), completed_at: 2026-05-02 }`.
- 388 CMS docs in Sanity production. All `parity_score=100` across 42 `content_migrations` rows.
- DESIGN-1 does **not** transition `migrations.status`. There is no `design_running` / `design_complete` state in `pipeline/state-machine.ts`. DESIGN-1 is a **build phase that operates against the `content_complete` state without transitioning out of it**. Step 11 confirms this is intentional and reflects it in the post-phase docs.

### Token state (open)

- Tech Debt #15 — `SANITY_MIGRATION_WRITE_TOKEN` rotation: **CLOSED** 2026-05-03 (rotated to `mygratr-templates-write`). DESIGN-1 does not write any documents to Sanity at the template-rendering layer. Read-only token (`SANITY_API_READ_TOKEN`) is used as `serverToken` on `defineLive` (per CMA-C2 corrected pattern); it is sufficient.
- Tech Debt #16 (`customerStory.companyLogo` schema relax): **OPEN, not blocking.** DESIGN-1 surfaces this as a per-template visual reference doc note for the customerStory template in Step 7 (template fallback for missing logo).
- Tech Debt #17 (10 doc types not yet scanned for migrator-pattern null-literal issue): **OPEN, not blocking.** DESIGN-1 does not run the closure scan. Step 11 carries the reminder forward.

---

## 3. Out of scope (explicit)

To prevent scope creep, none of the following are in DESIGN-1:

- Designer engagement of any kind. Goal is functional + visual equivalence, not pixel-perfect parity (Decision D2).
- Tier-2 composition examples in Storybook (decision D5 — moot if Storybook OUT path taken at Step 4).
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
4. **Storybook stories — conditional rule, decided at Step 4 entry.** IF Storybook IN (Path A): a primitive without a story is not Done; a Tier-1 complex component without a story is not Done; Step 10 verifier asserts file existence per primitive / per Tier-1 component. IF Storybook OUT (Path B): rule is dropped; verifier check #11 is no-op. v2.0 supersession of v1.5's unconditional pair-rule.
5. **Visual Editing wiring uses the import paths the installed package versions actually expose.** SCAFFOLD-1 already burned on three brief-mandated import paths that didn't exist (recorded in PHASE_HISTORY MYGRATR-SCAFFOLD-1 §"Surprises"). Cross-model audit caught that v1.2 was about to burn the same way: `next-sanity/visual-editing` and `next-sanity/live` are sub-path exports that may or may not exist depending on the installed `next-sanity` version (v9+ exports both from the package root). **Step 8a runs a `pkg.exports` probe before any import is written.** The probe output is the source of truth for import paths used in this phase. If the probe shows `./visual-editing` → use it; else use `next-sanity` root. Same for `./live`. Record resolved paths in CAPABILITY_LOG. There is no per-template wrapper component (per I8 self-audit) — per-template wiring is the Sanity Fetch + Render-Discipline conventions in Step 11.
6. **Capability log entries are written during the phase, not after.** Each step that introduces a pattern adds a paragraph to the running CAPABILITY_LOG draft (in `/tmp/` or a working file) before moving on. Step 9 consolidates and formalises. Writing the log after the fact loses the texture of the actual decisions.
7. **No string literal in template files (`site/src/components/templates/**`) outside the defined enum exemptions.** Step 6 ESLint template-fidelity rules — both **`jsx-no-literals` AND `mygratr/no-template-literals-in-render`** (per F28 v1.5 — was understated as single rule in v1.4) — enforce this together with `allowedStrings: Object.values(UI_STRINGS)` (resolved from the JSON SoT per F1 v1.5). UI chrome (button labels, error messages) lives in design tokens or the `UI_STRINGS` enum.
8. **The Step 10 verifier throws on first failure.** Same pattern as `verifyContent1D`. Never returns boolean. CLI entrypoint runs without try/catch so the exit code propagates.

---

## 5. Step-by-step build order

### Step 0 — Pre-flight + branch

**v2.0 status: CLOSED.** Step 0 executed and closed at commit `95de0e6`. Branch `feat/design-1` created and pushed. All pre-flight checks passed; sub-steps 0a, 0b, 0c, 0d landed cleanly. Sub-step 0d (Storybook compat probe) verified Storybook 10.x + Next.js 16.2.4 + React 19.2.4 build successfully in a throwaway directory; logged as DEV-2 (Storybook 9.x → 10.x supersession). The actual Storybook scaffold-into-`site/` decision now sits at Step 4 entry per v2.0's Storybook deferral.

The original Step 0 plan is preserved below for the historical record and customer-2 reuse pattern.

---

**Pre-flight checks (read-only; halt on any failure):**

1. `git status` clean, on `main`, up to date with `origin/main`.
2. `npm run build` in repo root passes. **DEV-1:** redefined to `npx tsc --noEmit` because root has no build target. Logged as deviation.
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
```

(Storybook directory `site/.storybook/` NOT created at Step 0 in v2.0; deferred to Step 4 conditional.)

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

Lock the answer in this brief's working notes before writing the custom rule in Step 6. **The branching variable is config style, not ESLint version (per F9):** flat config (`eslint.config.{mjs,js,cjs,ts}`) requires plugin-object registration and may need `fixupPluginRules()` for legacy-shaped plugins; legacy config (`.eslintrc.{js,cjs,json,yml}`) uses `plugins: ['name']` with no fixup. ESLint 9 defaults to flat but supports legacy via `ESLINT_USE_FLAT_CONFIG=false`; ESLint 8 supports flat experimentally. Determine the actual style in use by checking which config file is present, not by checking the ESLint major version.

**Sub-step 0c — `SANITY_API_READ_TOKEN` viewer-scope verification (per CMA-I9):**

The brief assumes `SANITY_API_READ_TOKEN` is `viewer`-scoped on dataset `production` only. Cross-model audit flagged this was never verified. A write-capable token in the Next.js runtime exposes blast radius for SSRF, supply-chain compromise, or accidental client-bundle inclusion.

Verify in two ways:

1. **Manual:** open Sanity management console → API tokens → confirm `SANITY_API_READ_TOKEN` row shows role `viewer` (not `editor`, not `developer`).
2. **Programmatic probe** (run once, record outcome in CAPABILITY_LOG):
   ```js
   // scripts/design/verify-token-scope.mjs
   // Plain Node ESM — no tsx dependency (consistent with F1 v1.5 — runtime tooling stays out of devDeps unless on critical path).
   import { createClient } from '@sanity/client';
   const probe = createClient({
     projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
     dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
     apiVersion: '2025-01-01',
     useCdn: false,
     token: process.env.SANITY_API_READ_TOKEN,
   });

   // Per F7 — use create() with a unique ID rather than patch() against nonexistent _id.
   // patch() against nonexistent ID may return 404 (not 403/401), causing false "manual verification" outcomes
   // for write-capable tokens. create() forces an actual write attempt.
   const probeId = `design1-token-probe-${Date.now()}`;
   try {
     await probe.create({ _id: probeId, _type: 'probeCheck', ephemeral: true });
     // If we reach here, the token has WRITE permissions. Clean up before throwing.
     try { await probe.delete(probeId); } catch { /* best-effort cleanup */ }
     throw new Error('Token has WRITE permissions — rotate to viewer-scoped before proceeding');
   } catch (err) {
     if (err.message?.includes('WRITE permissions')) throw err; // re-throw the explicit write-detected error
     // Per F4 (v1.5 — tightened from v1.4) — ONLY 403 or 401 reliably proves read-only.
     // Other non-2xx (400 schema, 409 ID conflict, 422 validation, 429 rate-limit) do NOT prove read-only;
     // a write-capable token could have hit one of those for unrelated reasons.
     if (err.statusCode === 403 || err.statusCode === 401) {
       console.log('✓ Token is read-only (statusCode:', err.statusCode, ')');
       process.exit(0);
     }
     throw new Error(
       `Token scope probe inconclusive (statusCode: ${err.statusCode}). ` +
       `Only 403/401 reliably proves read-only. Verify manually in Sanity management console before proceeding.`
     );
   }
   ```
   The CAPABILITY_LOG entry MUST record the actual statusCode observed, not just "✓ read-only."

If token is write-capable, halt — rotate to a viewer-scoped token before proceeding.

**Sub-step 0d — Storybook ↔ Next.js 16 compatibility probe (per CMA-I11; extended v1.5 per F21):**

**v2.0 status: COMPLETED.** Probe ran in throwaway dir at Step 0 close. Outcome documented as DEV-2: Storybook 10.x (the `@storybook/nextjs` adapter at `@latest`) builds successfully with Next.js 16.2.4 + React 19.2.4. Install workaround required: Storybook 10 init scaffolds a `Header.jsx` that imports `prop-types` without declaring it as a dependency; install `prop-types` to unblock the throwaway `build-storybook`. The probe's purpose (de-risk a Storybook-blocked Step 4) was satisfied — Storybook 10 IS viable on this stack, so Step 4's Path A IF chosen will not be blocked by adapter incompat.

**v2.0 note:** the actual install of Storybook into `site/` is now deferred to Step 4 conditional (Path A). The compat probe's value carries forward — it proved the install will work IF triggered. The original probe procedure is preserved below for the historical record + customer-2 reuse pattern.

---

Storybook adapters historically lag Next.js major releases. Next.js 16 with Turbopack default has internal API changes from Next.js 15. Cross-model audit flagged that committing to `@storybook/nextjs` without verifying compat is a hard exit-criterion blocker (Verifier #11 + #27).

**Two-phase probe (v1.5 — declarative phase + behavioral phase):**

**Phase 1 — declarative check** (run before Step 4 begins):

```bash
cd site
npx storybook@latest doctor 2>&1 | tee /tmp/storybook-doctor.log
npm info @storybook/nextjs peerDependencies
npm info @storybook/nextjs-vite peerDependencies
```

**Phase 2 — behavioral check (NEW v1.5 per F21):** declarative `peerDependencies` may state compatibility while runtime APIs differ. Install in a throwaway directory and run a minimal `build-storybook`:

```bash
mkdir -p /tmp/storybook-compat-probe && cd /tmp/storybook-compat-probe
npm init -y
npm install --save-dev @storybook/nextjs next@latest react@latest react-dom@latest
npx storybook init --type nextjs --skip-install --yes
npm install
npm run build-storybook 2>&1 | tee /tmp/storybook-build-probe.log
echo "Exit code: $?"
```

If the throwaway build passes → declarative AND behavioral both green → use the chosen adapter. If declarative passes but throwaway build fails → adapter has runtime incompatibilities not surfaced by `peerDependencies` → fall back to `@storybook/react-vite` (next decision branch).

**Decision tree:**

- **If `@storybook/nextjs` declarative + behavioral both pass:** use it.
- **Else if `@storybook/nextjs-vite` declarative + behavioral both pass:** use it (preferred — Vite faster than Webpack).
- **If neither passes both phases:** fall back to `@storybook/react-vite`. **Minimum mock set required (NEW v1.5 per F21):** create `.storybook/preview.tsx` with decorators that mock (a) `next/image` → plain `<img>` with the same props; (b) `next/link` → plain `<a>` with `href` from `props.href`; (c) `next/font` → no-op (return empty string for `className`/`style`). These three cover ~95% of template-component imports. Components using `next/navigation`, `next/dynamic`, or `next/headers` need additional decorators; document any such cases in CAPABILITY_LOG.

**Half-day rule (clarified v1.5 per F21):** wall-clock total from Step 4 start, NOT just probe time. **If the chosen adapter's `build-storybook` does not pass within 4 hours of starting Step 4 (including probe time, install time, debugging),** surface to Jake for dev consult.

Document the chosen adapter and verified Next.js 16 compatibility (declarative + behavioral) in CAPABILITY_LOG.

**Commit point:** `chore(design-1): branch + scaffold dirs + metadata refresh + token scope check + storybook compat probe (declarative + behavioral)`.

---

### Step 1 — Design tokens audit + Tailwind config (~1 day)

**v2.0 status: CLOSED.** Step 1 executed and closed at commit `95cb9b9`. DEV-3 (Tailwind v4 CSS-first + Next.js 16 globals co-location override Step 1 file structure assumptions), DEV-4 (Inter → Poppins font swap in layout.tsx), and DEV-5 (Tailwind v4 namespace correction + dual-consumer motion pattern) all logged in §15. The original Step 1 plan is preserved below for the historical record and customer-2 reuse pattern.

**Final shipped artifacts:**

- `docs/design/TOKENS.md` (561 lines) — single source of truth for design tokens with per-token provenance, uncertainties, customer-2 reusability annotation.
- `site/src/app/tokens.css` (121 lines, Tailwind v4 namespace-correct) — `@theme {…}` block with all tokens.
- `site/src/app/globals.css` — token-driven body styles.
- `site/src/app/layout.tsx` — Inter → Poppins via `next/font/google` (DEV-4).
- 5 scripts under `scripts/design/` (extract-design-tokens, extract-gsap-timings, diagnostic-1-type-source, diagnostic-2-navy-contexts, diagnostic-3-gap-probes).

**Key decisions locked in TOKENS.md:**

- Tailwind v4 namespace-correct token set (per DEV-5): `--text-*`, `--font-*`, `--leading-*`, `--ease-*`, `--duration-*`, `--spacing` scalar, `--radius-*`, `--breakpoint-*`, `--shadow-*`, `--color-*`. Multi-hyphen suffixes (e.g. `text-h1-desktop`) verified to generate utilities.
- Dual-consumer motion pattern: `--motion-*` group is GSAP source-of-truth; `--duration-*` and `--ease-*` are Tailwind utility aliases via `var()`.
- Type scale mobile-first; suffix names encode source-CE-breakpoint range, not Tailwind responsive prefix.
- 4 distinct CE breakpoints overriding Tailwind defaults (sm/lg overridden; md/xl match defaults).
- 9 uncertainties documented including: container max-width variance (Step 2 E3 Container resolves), z-index tier proposal (Step 2 introduces if first overlay primitive needs it), focus-visible ring tokens (Step 2 introduces with first interactive primitive), scrollbar styling deferral, footer locale-switcher contrast issue (inherited a11y issue, flagged for Step 7 footer template).

The original Step 1 plan is preserved below.

---

**Output (v1.5 plan, superseded by DEV-3):**

- `docs/design/TOKENS.md` — markdown reference (single source of truth for what each token *means* and where it was extracted from on the live site).
- `site/tailwind.config.ts` — overwrites the create-next-app stub. **DROPPED in v2.0 per DEV-3** (Tailwind v4 CSS-first; no JS config).
- `site/src/styles/tokens.css` — CSS-var consumption layer. **Relocated to `site/src/app/tokens.css` per DEV-3.**
- `site/src/styles/globals.css` — imports `tokens.css`, base resets, Tailwind directives. **Relocated to `site/src/app/globals.css` per DEV-3.**

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

**Shim is best-effort — known limitations (per F10/F11/F12 cross-model audit):**

- **F10 — pre-assignment calls dropped.** Site code that reads `window.gsap` and calls methods *before* `realGsap` is assigned is silently lost (the proxy returns no-op functions during this window). Minified Webflow startup may race exactly here. **Mitigation:** record this gap in CAPABILITY_LOG; manually inspect the live site's network tab for early `gsap.*` calls if Tier-1 timings look incomplete.
- **F11 — ScrollTrigger lazy-init.** GSAP `ScrollTrigger.create` configs that initialise on resize, media-query match, intersection, or delayed callbacks are NOT captured by scroll-only automation. The script scrolls in `innerHeight/2` increments after `networkidle`; lazy ScrollTriggers may set up after that window or in response to interactions the script doesn't simulate. **Mitigation:** for any Tier-1 component identified as scroll-driven, manually verify the captured timing matches the live site behaviour; if discrepancy, instrument `ScrollTrigger.create` directly in v2 of the shim.
- **F12 — serializer fragility.** The `JSON.stringify` replacer handles functions and `Element` instances, but breaks on `NodeList`, `HTMLCollection`, `window`/`document`, and circular references. GSAP commonly accepts these as targets. Output may be corrupt or missing entries on real-world pages. **Mitigation:** if `gsap-*.json` output is empty or contains parse errors for a known-animated page, the serializer hit one of these surfaces; fall back to manual timing inspection for that page.

This shim is a customer-2 reusable primitive (records the methodology). v2 hardening covers pre-assignment buffering, `ScrollTrigger.create` instrumentation, and a robust serializer with `WeakSet` cycle detection. **v2 is out of DESIGN-1 scope** — log as Tech Debt #20 (GSAP shim hardening) for a future productisation pass.

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

Step 2 is locked under v2.0. Pre-Step-2 planning thread surfaced a series of decisions that contradicted v1.5's framing (shadcn drop, Storybook deferral, Material Symbols drop, CVA standard, no-className-variants, GSAP boundary). Those decisions are reflected here.

#### Step 2 — Locked decisions (do not relitigate during execution)

These were settled in the pre-Step-2 planning thread. Cross-cutting decisions appear elsewhere in the brief (Steps 4, 6, 9, 10, 11) and must stay consistent.

1. **shadcn is NOT used.** Hand-build atop `@radix-ui/*` primitives directly for accessibility-heavy primitives (Dialog, Tooltip, Dropdown, Toast) and for form controls that need keyboard / focus management (Select, Checkbox). Pure hand-built for everything else. shadcn's default styling is a fight when matching CE exactly, and the fidelity goal (clone CE) makes shadcn's value-add (pre-styled defaults) a net cost.
2. **Variant API uses `class-variance-authority` (CVA).** Standard pattern across all hand-built primitives. Variants exposed as typed props.
3. **Icons via SVG sprite extracted from CE.** No `lucide-react`, no Material Symbols. The `<Icon>` primitive consumes a sprite generated by a Step 2 sub-task (§Step 2.1) that filters vendor SVGs (YouTube player, chat widget) from the 78 distinct SVGs identified in the pre-Step-2 icon probe. Expected post-filter count: ~10–20 CE-brand icons.
4. **Forms use `react-hook-form` + `zod` + `@hookform/resolvers`.** Same `zod` already in use by `src/types/sanity/`. Form validation derives from Sanity Zod schemas where applicable.
5. **Marquee is a primitive.** Built atop bundled Swiper.js. Scrolls horizontally with hover-pause. CMS source: `staffBenefit` (Webflow collection slug `enjoy-marquee`; 6 items already migrated to Sanity).
6. **No primitive imports `gsap`.** GSAP lives only in template-level components (Step 4+). Primitives use CSS transitions for hover states (`duration-reveal`, `ease-reveal` Tailwind utilities per Step 1 §7.2 of `docs/design/TOKENS.md`). Same applies to `framer-motion` — banned in primitives.
7. **No primitive uses `className` for variant resolution.** All visual variations expressed as typed CVA props (`variant`, `size`, `tone`, `state`, etc.). Future content-driven workflows (Sanity payloads, AI-generated landing pages, A/B variant routing) require structured props, not classnames. Internal `className` parameter is allowed for layout overrides only (margin, custom positioning), never for variant styling.
8. **`COMPONENTS.md` is a single document, table format.** One row per primitive: name, file path, variants, dependencies, status. NOT per-primitive markdown files (rejected v1.5 approach).
9. **Per-primitive cadence: first-of-kind halt + autonomous follow-on.** 7 first-of-kind primitives get explicit HALT for spec eyeball. The rest of each category builds autonomously and gets eyeballed in batch at category close.
10. **Source fidelity standard: clone CE exactly.** Every primitive's variants, sizes, states, hover effects, transitions match what CE renders today. Polish-debt avoidance is the priority. If a CE detail seems "weird," it ships as-is — fidelity over opinion.
11. **Storybook is NOT scaffolded at Step 2.** Deferred to Step 4 entry as an explicit decision (depends on whether external dev handoff is in play during template work). NO `.stories.tsx` files written at Step 2. The pair-rule from v1.5 is dropped.

#### Step 2 — Output

- 22 primitives in `site/src/components/ui/` (one folder per primitive). The 22 are A1–A6, B1–B3, C1–C6, D1–D4, E1–E4 (full inventory below).
- Plus 1 `<Icon>` primitive in `site/src/components/ui/icon/`, treated as foundation infrastructure rather than counted in the brand inventory but materially a primitive.
- A single `docs/design/COMPONENTS.md` (one row per primitive — table format, 23 rows including Icon).
- Updated `site/package.json` with locked dependencies.
- All primitives pass `npx tsc --noEmit` AND `npm run build` clean.
- A temporary `site/src/app/_demo/page.tsx` route renders a kitchen-sink preview of every primitive for visual integration check (production-guarded; removed at Step 4 close).
- Verifier script `scripts/design/verify-step-2.mjs` (throws-on-failure pattern per CONVENTIONS.md).

#### Step 2 — Out of scope

These are NOT done at Step 2; they live elsewhere.

- Storybook installation. Deferred to Step 4 entry decision.
- Template-level components (Hero, TeamGrid, BlogCard composition). Step 4 (TEMPLATE-* phases).
- GSAP-driven animations beyond CSS hover transitions. Step 4 templates.
- Sanity-driven Nav and Footer wiring. Existing stubs from SCAFFOLD-1; populated by TEMPLATE-NAV / TEMPLATE-FOOTER (Step 4 sub-phases).
- A/B testing infrastructure, AI-generated landing pages. Post-launch workstream.
- Visual regression testing (Playwright structural diff). Step 6 (QA-1).

#### Step 2.0 — Pre-flight (dependency install + scaffold)

Before any primitive is built, complete in order:

**2.0a Install runtime dependencies:**

```bash
cd site/
npm install \
  class-variance-authority \
  react-hook-form \
  zod \
  @hookform/resolvers \
  swiper \
  @sanity/image-url
```

**NOT installed at Step 2:**
- `gsap` — primitives are banned from importing it (Decision #6). GSAP installs at Step 4 when template-level animation work begins. Pre-installing creates dead weight + tempts accidental imports.
- `@radix-ui/*` packages — installed JIT per primitive that needs them (Step 2.0b below).
- `lucide-react` — banned. Icons via SVG sprite (§Step 2.1).
- Storybook — deferred to Step 4 entry decision.

**Version pins:** Use the latest stable as of execution. Lock the resolved versions into `package-lock.json` (default npm behaviour). Brief intentionally does not pin specific versions — the brief executes within a small window and pinning ahead of execution date risks pinning to a version with a known issue.

**2.0b Radix primitives — installed JIT per primitive:**

Listed here for reference; installed during the primitive's build sub-step:

```
@radix-ui/react-dialog       → D1
@radix-ui/react-tooltip      → D2
@radix-ui/react-dropdown-menu → D3
@radix-ui/react-toast        → D4
@radix-ui/react-select       → C3
@radix-ui/react-checkbox     → C4
@radix-ui/react-label        → C5
@radix-ui/react-accordion    → A5
```

**2.0c Verify install + build:**

```bash
cd site/
npm run build         # must exit 0
npx tsc --noEmit      # must exit 0
```

**2.0d Create `site/src/components/ui/` directory tree:**

```
site/src/components/ui/
├── _utils/
│   └── cn.ts              # clsx + tailwind-merge wrapper
├── _icons/                # populated by Step 2.1 (sprite.svg)
└── (per-primitive folders added during build)
```

The `cn()` utility:

```typescript
// site/src/components/ui/_utils/cn.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
```

**2.0e HALT 0** — surface for Jake's eyeball:
- `site/package.json` updated dependencies
- Build clean confirmation
- Directory tree

Proceed only after Jake approves.

#### Step 2 — Primitive inventory (locked)

22 primitives across 5 categories + 1 Icon foundation primitive. Status column tracks build progress.

**Category A — Brand Expression (6 primitives, all hand-built)**

| # | Primitive | First-of-kind | Variant axes | CE source pattern |
|---|---|---|---|---|
| A1 | `Button` | ✓ HALT 1B | `variant`: `primary-teal` \| `primary-yellow` \| `primary-navy` \| `secondary-outline` \| `tertiary-ghost` \| `icon-only`<br>`size`: `sm` \| `md` \| `lg`<br>`disabled`, `loading` props | `.primary-button.w-button`, `.primary-button.cc-yellow`, `.primary-button.cc-blue`, `.secondary-button` |
| A2 | `Link` | — (batch with A1) | `variant`: `inline` \| `cta-arrow` \| `nav`<br>`tone`: `default` \| `cc-blue` \| `cc-white` | `.txt-link`, `.txt-link.cc-blue`, `.txt-link.cc-white`, `.txt-link-arrow` |
| A3 | `Tag` | — (batch) | `tone`: `default` \| `cc-blue` \| `cc-yellow` | `.tag`, `.tag.cc-blue` |
| A4 | `Card` | ✓ HALT 2 | `variant`: `content` \| `featured` \| `bordered`<br>Compound API: `<Card>` `<CardHeader>` `<CardBody>` `<CardFooter>` | Cards across team-member, technology, blog, customer-story sections |
| A5 | `Accordion` | — (batch with A4) | Wraps `@radix-ui/react-accordion`; transitions via `--ease-accordion` CSS easing token | `/technology` page accordion (uses GSAP `power3.inOut` per Step 1 motion tokens) |
| A6 | `Marquee` | — (batch) | `direction`: `left` \| `right`<br>`speed`: `slow` \| `medium` \| `fast`<br>`pauseOnHover`: bool<br>Children rendered into a Swiper loop | `.staff-benefits-marquee` (6 staffBenefit items; Webflow collection slug `enjoy-marquee`) and any client-logo strip |

**Category B — Typography (3 primitives, hand-built)**

| # | Primitive | First-of-kind | Variant axes | Notes |
|---|---|---|---|---|
| B1 | `Heading` | ✓ HALT 3 | `as`: `h1` \| `h2` \| `h3` \| `h4` \| `h5` \| `h6`<br>`size`: `display` \| `h1` \| `h1-tablet` \| `h1-desktop` \| `h2` \| `h2-desktop` \| `h2-large` \| `h4` \| `h5` | Encodes responsive cascade per `docs/design/TOKENS.md` §2.5. `as` (semantic) decoupled from `size` (visual). |
| B2 | `Text` | — (batch with B1) | `as`: `p` \| `span` \| `div`<br>`size`: `body` \| `body-sm`<br>`weight`: `regular` \| `medium` \| `semibold` | Default body text wrapper. |
| B3 | `PortableText` | ✓ HALT 4 | Sanity Portable Text renderer. Maps blocks → Heading / Text / Link / Image primitives. | Wired against `PortableTextSchema` in `src/types/sanity/shared.ts`. First Sanity-data-driven primitive — locks the pattern for Step 4 templates. |

**Category C — Forms (6 primitives, hand-built atop Radix where applicable)**

| # | Primitive | First-of-kind | Variant axes | Backing |
|---|---|---|---|---|
| C1 | `Input` | ✓ HALT 5 | `state`: `default` \| `focus` \| `error` \| `disabled`<br>`size`: `sm` \| `md` \| `lg` | Native `<input>` (no Radix needed for plain text inputs) |
| C2 | `Textarea` | — (batch with C1) | Same as Input | Native `<textarea>` |
| C3 | `Select` | — (batch) | Same state/size axes | `@radix-ui/react-select` |
| C4 | `Checkbox` | — (batch) | `state`: `default` \| `checked` \| `indeterminate` \| `disabled` | `@radix-ui/react-checkbox` |
| C5 | `FormField` | — (batch) | Composition wrapper: `<FormField>` `<FormLabel>` `<FormControl>` `<FormMessage>` `<FormHelperText>` | Hand-composed; integrates with `react-hook-form` |
| C6 | `HubSpotFormEmbed` | ✓ HALT 6 | `formId` prop. Renders raw HubSpot form HTML with CE styling overlay. Lifecycle: load `//js.hsforms.net/forms/embed/v2.js` lazily via `next/script` `lazyOnload`. | Hand-built. CE has 3 live HubSpot forms per AUDIT-1. |

**Category D — Overlays (4 primitives, all atop Radix)**

| # | Primitive | First-of-kind | Variant axes | Backing |
|---|---|---|---|---|
| D1 | `Dialog` | — (batch — Radix-wrap pattern locked by C3) | Open/closed state controlled. Surface tokens, radii, `--shadow-elevated`, `--motion-hero-duration` for entrance. | `@radix-ui/react-dialog` |
| D2 | `Tooltip` | — (batch) | `placement`: `top` \| `right` \| `bottom` \| `left` | `@radix-ui/react-tooltip` |
| D3 | `Dropdown` | — (batch) | Trigger + menu items. Used by Nav (Step 4). | `@radix-ui/react-dropdown-menu` |
| D4 | `Toast` | — (batch) | `tone`: `info` \| `success` \| `warning` \| `error` | `@radix-ui/react-toast` |

**Category E — Media + Layout (4 primitives, hand-built)**

| # | Primitive | First-of-kind | Variant axes | Notes |
|---|---|---|---|---|
| E1 | `Image` | ✓ HALT 7 | `next/image` wrapper with Sanity image-URL builder integration. Props: `image: SanityImage \| string`, `alt: string` (required), `priority?: boolean`, `aspectRatio?: number`, `sizes?: string`. | Per `PERFORMANCE_BUDGETS.md` image policy (explicit width/height; AVIF + WebP via Next.js defaults). |
| E2 | `VideoEmbed` | — (batch with E1) | `source`: `youtube` \| `vimeo` \| `mp4`<br>`videoId` \| `url`. Lazy-loaded iframe via `youtube-nocookie.com` for YouTube. | CE `Videos` collection (32 items). |
| E3 | `Container` | ✓ HALT 8 | `width`: `narrow-1100` \| `default-1384` \| `hero-1440` \| `full` \| `responsive-90` | Resolves Step 1 `TOKENS.md` §9 entry 9 deferred decision. CE has 4 distinct content widths. |
| E4 | `Divider` | — (batch with E3) | `tone`: `subtle` \| `default` \| `bold`<br>`spacing`: `sm` \| `md` \| `lg` | Section dividers. |

**Plus — Icon system (Step 2.1 sub-task before A1, see §Step 2.1)**

`<Icon name="..." size="..." ariaLabel="..." />` backed by an extracted SVG sprite. NOT part of the 22 primitive count — it's foundation for primitives that consume icons (Button icon-only variant, Accordion chevron, Dialog close button, etc.).

#### Step 2 — Build sequence (locked order)

13 explicit halts + 5 batch eyeballs = 18 stop points. Each first-of-kind primitive has explicit HALT. Each non-first-of-kind primitive is built autonomously and batch-eyeballed at category close.

```
Step 2.0   Pre-flight                                   HALT 0

Step 2.1   Icon system extraction + <Icon> primitive    HALT 1A (extraction probe + sprite eyeball)

Step 2.2   A1 Button                                    HALT 1B (first-of-kind: variant API conventions)
Step 2.3   A2 Link, A3 Tag                              [autonomous]
Step 2.4   A4 Card                                      HALT 2 (first-of-kind: compound primitive pattern)
Step 2.5   A5 Accordion, A6 Marquee                     [autonomous]
           BATCH EYEBALL — Category A close

Step 2.6   B1 Heading                                   HALT 3 (first-of-kind: responsive cascade encoding)
Step 2.7   B2 Text                                      [autonomous]
Step 2.8   B3 PortableText                              HALT 4 (first-of-kind: Sanity-data primitive)
           BATCH EYEBALL — Category B close

Step 2.9   C1 Input                                     HALT 5 (first-of-kind: form control pattern)
Step 2.10  C2 Textarea, C3 Select, C4 Checkbox, C5 FormField   [autonomous]
Step 2.11  C6 HubSpotFormEmbed                          HALT 6 (first-of-kind: third-party embed pattern)
           BATCH EYEBALL — Category C close

Step 2.12  D1 Dialog, D2 Tooltip, D3 Dropdown, D4 Toast    [autonomous, all Radix-wrap pattern]
           BATCH EYEBALL — Category D close

Step 2.13  E1 Image                                     HALT 7 (first-of-kind: next/image + Sanity URL)
Step 2.14  E2 VideoEmbed                                [autonomous]
Step 2.15  E3 Container                                 HALT 8 (first-of-kind: resolves §9 entry 9 token decision)
Step 2.16  E4 Divider                                   [autonomous]
           BATCH EYEBALL — Category E close

Step 2.17  COMPONENTS.md (single doc, table)            HALT 9 (final eyeball)
Step 2.18  Kitchen-sink demo route /_demo               HALT 10 (visual integration check)
Step 2.19  Step 2 close — verifier + commit             HALT 11 (Jake green-lights commit)
```

#### Step 2 — Per-HALT eyeball expectations

| Halt | Surface | Jake's check |
|---|---|---|
| 0 | Pre-flight diff | package.json deps correct, builds clean |
| 1A | Icon extraction probe + 5 sample sprite icons | CE icons faithful; vendor noise filtered; ambiguous icons surfaced for manual classify |
| 1B | A1 Button code + variants table | Variant API conventions feel right; CVA usage idiomatic |
| 2 | A4 Card code + compound API | Slot composition feels natural; tokens applied correctly |
| 3 | B1 Heading code + responsive cascade | `as`/`size` decoupling correct; Tailwind prefixes match Step 1 `TOKENS.md` §2.5 |
| 4 | B3 PortableText code | Sanity block mapping correct; renderer fallbacks sensible |
| 5 | C1 Input code | Form control pattern; focus/error states match CE |
| 6 | C6 HubSpotFormEmbed code | Script lifecycle correct; CE styling overlay matches form rendering |
| 7 | E1 Image code | Sanity image-URL builder usage correct; AVIF/WebP defaults applied |
| 8 | E3 Container code + token decision surface | TOKENS.md §9 entry 9 deferred decision lands honestly |
| 9 | COMPONENTS.md | All 23 primitives documented; table scannable |
| 10 | /_demo route render | Visual integration matches expectations (kitchen-sink) |
| 11 | Commit diff | Final review before Step 2 close |

Each halt is small. Most halts: 2–5 minute eyeball. HALT 1A and HALT 10 may take 10–15 minutes (icon visual review and full kitchen-sink scan).

#### Step 2 — Locked rules (DO NOT VIOLATE)

These are the rules that protect future-state workflows and customer-2 reuse.

**Variant API:**
- Every primitive's visual variations expressed as typed CVA props.
- No primitive accepts a `className` override for variant resolution. Internal `className` parameter is allowed for layout overrides only.
- Every primitive has a `cn()` invocation with token-driven classes, never raw color hex codes.

**Animation:**
- No primitive imports `gsap` or `framer-motion`. Hover transitions use CSS via `transition duration-reveal ease-reveal` Tailwind utilities.
- Accordion uses Radix's built-in animation (CSS-based) plus `--ease-accordion` token for timing.
- The Marquee primitive may import Swiper.js (locked dependency); that's not GSAP and is allowed.

**Tokens:**
- All colors in **project-authored** files (`site/src/**`) via `--color-*` tokens. No hex codes outside `tokens.css`. Vendor-injected CSS (Swiper, Radix internals via npm) is exempt — those are inside `node_modules` and out of our control.
- All typography via `--text-*`, `--font-*`, `--leading-*`, `--font-weight-*` tokens.
- All radii via `--radius-*` tokens.
- All spacing via Tailwind utilities (`p-*`, `m-*`, `gap-*`) which derive from `--spacing` scalar. Off-grid values handled via `pt-[3.75rem]` arbitrary value pattern (Step 1 spacing notes).

**File organization:**
- One folder per primitive: `site/src/components/ui/{primitive-name}/`
- Folder contents: `index.tsx` (the component), `types.ts` (the typed props if non-trivial). NO `.stories.tsx` files (Storybook deferred per Decision #11).
- All primitives default-exported AND named-exported: `export function Button(...)` AND `export default Button`.

**Accessibility:**
- All interactive primitives keyboard-navigable.
- Focus-visible states use the `--ring-*` tokens (introduced in this phase as part of A1 Button — see TOKENS.md §9 entry 11).
- All form primitives have associated labels (FormField wrapper enforces this composition pattern).
- Icon-only buttons require `aria-label` prop (TypeScript-enforced).

**Performance (per `PERFORMANCE_BUDGETS.md`):**
- All client-side state primitives use React Server Component pattern where possible (no `'use client'` directive unless required by interactivity).
- Image primitive uses `next/image` exclusively. No raw `<img>` tags.
- No primitive triggers a layout shift on hover (transitions stay within transform / opacity, not width/height).

**SEO / AEO:**
- Heading primitive uses semantic HTML (`<h1>` through `<h6>`) — `as` prop enforces this.
- All Image alt text is required (TypeScript-enforced).
- **Standalone icons** (icon-only buttons, decorative-but-meaningful icons) render `<svg role="img" aria-label="...">` — TypeScript-enforced via `ariaLabel` required prop in those contexts.
- **Decorative icons** (chevrons next to "Read more" text, indicator arrows where the surrounding text is the meaning) render `<svg aria-hidden="true">` — `ariaLabel` omitted.
- All overlay primitives (Dialog, Tooltip, Dropdown) preserve content in DOM for screen readers and crawlers.

#### Step 2 — Per first-of-kind HALT decisions

Each first-of-kind HALT requires Jake to eyeball a specific decision before the rest of that category builds autonomously. The decision locked at first-of-kind propagates through subsequent batch primitives.

**HALT 1B (A1 Button):** Variant API conventions
- CVA invocation pattern (single root `cva()` call vs slot-style)
- Prop naming conventions (`variant`, `size`, `tone`, `state`)
- Default variant resolution (when no prop passed)
- TypeScript prop type derivation pattern (`VariantProps<typeof buttonVariants>`)

**HALT 2 (A4 Card):** Compound primitive pattern
- Slot naming (`<Card>` `<CardHeader>` `<CardBody>` `<CardFooter>`)
- Default-export naming (parent only vs all slots)
- Inner-slot CVA usage (each slot has its own variants vs single shared)

**HALT 3 (B1 Heading):** Responsive cascade encoding
- Whether `size="h1"` triggers responsive cascade automatically (preferred — encapsulation) OR whether component author writes `<Heading size="h1" md:size="h1-tablet">` (explicit)
- The token-suffix-to-Tailwind-prefix mapping per TOKENS.md §2.5

**HALT 4 (B3 PortableText):** Sanity-data primitive pattern
- Component-injection pattern (`portableText` accepts a `components` prop OR has fixed mapping)
- Fallback rendering for unrecognized block types
- Image-block rendering via E1 Image primitive
- Link-block rendering via A2 Link primitive

**HALT 5 (C1 Input):** Form control pattern
- `react-hook-form` integration pattern (`Controller` vs `register`)
- Error-state derivation from `formState.errors`
- TypeScript inference from a `zod` schema
- `aria-invalid` and `aria-describedby` wiring

**HALT 6 (C6 HubSpotFormEmbed):** Third-party embed pattern
- Script lifecycle (load via `next/script` `lazyOnload`)
- CSS-overlay strategy for vendor styles
- Cleanup on component unmount
- Server-component-friendliness (where to put `'use client'` boundary)

**HALT 7 (E1 Image):** next/image + Sanity URL pattern
- Sanity image-URL builder usage (`@sanity/image-url`)
- AVIF/WebP defaults via `next.config.js` (verify SCAFFOLD-1 didn't disable)
- Aspect-ratio props vs `width`/`height` props
- Loading priority (`priority` prop wiring for hero images)

**HALT 8 (E3 Container):** Resolves TOKENS.md §9 entry 9
- Three plausible directions surfaced in TOKENS.md: (a) Single `--container-max: 1384px` + arbitrary values for variants; (b) Multi-tier semantic tokens (`--container-content: 1100px`, `--container-default: 1384px`, `--container-hero: 1440px`); (c) Container queries instead of fixed widths.
- Surface at HALT 8: which direction Claude Code recommends + 5-line rationale. Jake decides.

#### Step 2.1 — Icon system sub-task

Sequenced before A1 Button because Button's `icon-only` variant depends on it.

**2.1a Vendor-filter the 78-icon inventory**

Pre-Step-2 probe surfaced 78 distinct SVGs in CE's rendered HTML across 312 pages. Most are vendor-injected:

- YouTube player UI (8 distinct, ~414+ uses each) — **filter out** (E2 VideoEmbed uses lazy iframe from youtube-nocookie.com)
- Clara/Hotjar chat widget (1 icon × 924 uses) — **filter out** (loaded by GlobalScripts; lives inside chat iframe)
- GTM/GA4 wrappers — **filter out** (no rendered SVG)

Expected post-filter count: **10–20 CE-brand icons.**

**2.1b Filter heuristics**

```
EXCLUDE if:
  - viewBox matches /^36 36$/ AND class contains "ytp-"
  - viewBox matches /^67 60$/  (YouTube logo)
  - viewBox matches /^110 26$/  (YouTube wordmark)
  - parent element has data-testid containing "clara" OR "hotjar"
  - SVG appears inside an iframe (skip iframe content entirely)
  - hash matches one of the YouTube/chat hashes from probe output

INCLUDE all else.
```

**2.1c Sprite generation**

Generate `site/src/components/ui/_icons/sprite.svg` containing all post-filter icons as `<symbol id="...">` elements. Naming convention: `kebab-case` derived from CE class context (e.g. icon used inside `.txt-link-arrow` becomes `<symbol id="arrow-link">`).

**2.1d `<Icon>` primitive**

```typescript
// site/src/components/ui/icon/index.tsx
import sprite from '../_icons/sprite.svg'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../_utils/cn'

const iconVariants = cva('inline-block', {
  variants: {
    size: {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
      xl: 'w-8 h-8',
    },
  },
  defaultVariants: { size: 'md' },
})

type IconName = 'arrow-link' | 'chevron-down' | /* ...generated */

export interface IconProps extends VariantProps<typeof iconVariants> {
  name: IconName
  className?: string
  ariaLabel?: string  // required for standalone icons; omit for decorative-only
}

export function Icon({ name, size, className, ariaLabel }: IconProps) {
  return (
    <svg
      role={ariaLabel ? 'img' : 'presentation'}
      aria-label={ariaLabel}
      aria-hidden={!ariaLabel}
      className={cn(iconVariants({ size }), className)}
    >
      <use href={`${sprite}#${name}`} />
    </svg>
  )
}

export default Icon
```

`IconName` type is generated by the sprite-build script; never hand-edited. New icons surface in Step 4+ template work and get added then.

**2.1e HALT 1A surface:**
- Vendor-filter pass output (count before/after filter)
- 5 sample post-filter SVGs rendered as markdown
- The generated `IconName` type union
- Any ambiguous icons flagged for Jake's manual classify/discard

#### Step 2 — COMPONENTS.md format

```markdown
# Component Inventory — site/src/components/ui/

> Per-primitive index of every component shipped in MYGRATR-DESIGN-1 Step 2.
> One row per primitive. Source of truth for Step 4 TEMPLATE-* phases composing
> these primitives.

| # | Primitive | Path | Variants | Backing | Imports | Status |
|---|---|---|---|---|---|---|
| A1 | Button | `ui/button/` | 6 variants × 3 sizes × disabled/loading | hand-built | none | ✅ |
| A2 | Link | `ui/link/` | 3 variants × 3 tones | hand-built | next/link | ✅ |
| A3 | Tag | `ui/tag/` | 3 tones | hand-built | none | ✅ |
| ... | ... | ... | ... | ... | ... | ... |
```

After the per-primitive rows, append a "Composition guidelines" section with:
- The locked rules (Variant API, Animation, Tokens, File org, A11y, Perf, SEO)
- Common composition patterns (Card with Image + Heading + Text + Button)
- Locked-not-shipped items (focus-ring tokens, scrollbar tokens — Step 1 TOKENS.md §9 entries 10/11)

#### Step 2.18 — Kitchen-sink demo route

`site/src/app/_demo/page.tsx` — temporary route that renders every primitive once with all variants. NOT shipped to production.

**Production safety (mandatory):**

```typescript
// site/src/app/_demo/page.tsx
import { notFound } from 'next/navigation'
import { Heading } from '@/components/ui/heading'
// ... primitive imports

export default function DemoPage() {
  // Production safety guard — return 404 in production builds
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production') {
    notFound()
  }

  return (
    <div className="p-10 space-y-20">
      <section>
        <Heading as="h2" size="h2-large">Buttons</Heading>
        {/* All Button variants × sizes */}
      </section>
      {/* ... one section per primitive */}
    </div>
  )
}
```

**Belt-and-suspenders:** also add `_demo` to `site/src/app/robots.ts` disallow list.

Three layers of protection: (1) `notFound()` returns a 404 in production (functional block); (2) `robots.ts` tells crawlers not to index (SEO block); (3) the route lives under `/_demo` with a leading underscore (visual signal that it's internal).

Purpose: visual integration check before Step 2 close. Jake views the route in the local dev server (`npm run dev`) and side-by-side compares specific primitives to CE's live site.

`/_demo` route is removed at Step 4 close (or earlier — Step 4 templates implicitly replace its purpose).

#### Step 2.19 — Step 2 close

**2.19a Verifier — `scripts/design/verify-step-2.mjs`**

Checks (all must pass; verifier throws on any failure per CONVENTIONS.md verifier-throws pattern):

1. `site/src/components/ui/` contains 23 primitive sub-folders (the 22 brand inventory items A1–A6, B1–B3, C1–C6, D1–D4, E1–E4, plus `icon/`) + 2 utility folders (`_icons/` for the sprite, `_utils/` for `cn.ts`).
2. Each primitive folder has `index.tsx`.
3. `site/src/components/ui/_icons/sprite.svg` exists and contains at least 10 `<symbol>` elements.
4. `docs/design/COMPONENTS.md` exists and contains 23 primitive rows (22 + Icon).
5. `npm run build` in `site/` exits 0.
6. `npx tsc --noEmit` in `site/` exits 0.
7. No file under `site/src/components/ui/` contains `import.*from.*['"]gsap['"]`.
8. No file under `site/src/components/ui/` contains `import.*from.*['"]framer-motion['"]`.
9. No file under `site/src/components/ui/` (project source only — `node_modules` exempt) contains a hardcoded hex color outside `tokens.css` (regex `/#[0-9a-f]{3,6}/i`).
10. `site/src/app/_demo/page.tsx` exists.
11. `site/src/app/robots.ts` includes `_demo` in the disallow list.

**2.19b Commit**

```bash
cd /Users/jakehall/Documents/CE\ Ops/Ab3lton/SEO/Code/MASTER\ PROJECTS_1/Mygratr
git add site/package.json site/package-lock.json
git add site/src/components/ui/
git add site/src/app/_demo/
git add site/src/app/robots.ts
git add docs/design/COMPONENTS.md
git add scripts/design/verify-step-2.mjs
git commit -m "feat(design-1): step 2 — primitive components (22 primitives + Icon sprite + kitchen-sink demo)"
git push origin feat/design-1
```

**2.19c Brief §15 deviations**

Append any DEV-N entries that surfaced during Step 2 (likely candidates: Sanity image-URL builder version mismatch, Radix primitive version pinning, Swiper config gotchas).

**2.19d Capability log entry**

Append to `audit-output/design-1/capability-log-draft.md`:
- Variant API pattern lessons (CVA conventions that worked)
- Compound primitive pattern (slot composition gotchas)
- Sanity-data primitive pattern (PortableText component-injection model)
- Third-party embed pattern (HubSpot script lifecycle)
- Icon sprite extraction pattern (vendor filtering heuristic)
- Per-customer reusability annotation per pattern

**2.19e HALT 11**

Surface for Jake:
- Verifier output (all checks pass)
- Commit diff
- Final tree of `site/src/components/ui/`
- COMPONENTS.md table

Jake green-lights commit. Push to `origin/feat/design-1`. Step 2 closes.

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

### Step 4 — Storybook decision + conditional scaffold (~0.5 day if scaffolded, ~5 minutes if deferred)

**v2.0 change:** Step 4 was a Storybook scaffold step in v1.5. Pre-Step-2 planning thread re-evaluated whether Storybook earns its place under the dev-light operating posture. Decision: **defer the install/scaffold decision to this step's entry**, after Step 2 primitives have shipped and Step 3 Tier-1 specs have surfaced.

**Decision criteria — Storybook IN if any of these are true:**

1. Step 2 close + kitchen-sink demo route showed real value in side-by-side primitive review (i.e., Jake actively wants more isolated component preview surface than the live preview gives).
2. An external dev engagement is now scoped or imminent for any Tier-1 component (per Roadmap §0 half-day rule). Storybook becomes the handoff surface.
3. Step 3 Tier-1 audit revealed components where animation isolation review is materially harder in the live preview than it would be in Storybook (e.g., scroll-triggered timelines that require a specific scroll position to trigger).

**Decision criteria — Storybook OUT (deferred indefinitely or to QA-1) if:**

- Solo + Claude Code execution continues with no external dev handoff.
- Kitchen-sink demo + live preview are sufficient for Jake's review of Tier-1 components.
- The cost of installing + maintaining + deploying Storybook exceeds the value of the isolation surface.

**Step 4 — HALT 4 (entry decision)**

Surface to Jake:
- Status of Step 2 kitchen-sink demo (was it useful? did Jake actually use it?)
- Tier-1 inventory from Step 3 (which components, complexity ratings)
- External dev engagement status (any Upwork engagement scoped?)
- Recommendation: IN or OUT, with 5-line rationale

Jake decides.

#### Step 4 — Path A: Storybook IN (~1.5 days)

If Jake decides IN, execute the v1.5 scaffold plan:

**Output:**

- `site/.storybook/main.ts`, `site/.storybook/preview.ts` — Storybook config.
- `site/package.json` — Storybook scripts added (`storybook`, `build-storybook`).
- Stories written for every primitive shipped in Step 2 (`{primitive}.stories.tsx` siblings) and every Tier-1 component spec from Step 3.
- Storybook deployed to a subdomain (Vercel separate project, deployment-protected).

**Process:**

0. Write the decision artifact: `audit-output/design-1/step-4-storybook-decision.txt` with `IN` as the single-line content. Verifier checks read this to determine path.
1. `cd site/ && npx storybook@latest init`. Per Step 0d compat probe (DEV-2): Storybook 10.x with `@storybook/nextjs` adapter on Next.js 16.2.4 + React 19.2.4 builds clean in throwaway dir. Install `prop-types` after init to unblock Storybook 10's scaffolded `Header.jsx` (probe finding).
2. Configure Storybook to import `tokens.css` in `preview.ts` so stories render with real CE design tokens. Tailwind v4 CSS-first config means the import alone suffices; no JS config to wire.
3. Write stories for every primitive (one grid story per primitive showing all variants × sizes in one canvas — minimal investment, treating Storybook as a dev sandbox not a stakeholder showcase).
4. Write stories for each Tier-1 component (decomposed primitives + the composite). Animation Tier-1 stories run their timeline in isolation. Story decorators provide mock Sanity data inline (NOT fetched from Sanity in Storybook — explicit mock to keep stories deterministic).
5. **Deployment:** Vercel separate project pointed at `site/` with `build-storybook` build command. Subdomain: `storybook.mygratr-cloudemployee.dev` or similar — pick one and record in CAPABILITY_LOG. Avoids Chromatic costs; uses existing Vercel account; Storybook password-protected via Vercel deployment protection.

**Storybook story discipline (CONVENTIONS.md addition, Path A only):** every primitive `index.tsx` gets a `stories.tsx` sibling. Step 10 verifier asserts pair existence under the Path A branch.

**Capability log draft (Path A):** "Storybook scaffold — Vercel-hosted, deployment-protected, separate Vercel project from main site. Stories use mock Sanity data, not real fetches. Pair-rule enforced by verifier."

**Commit points (Path A):** Storybook init + config (one); stories deployed and Vercel project linked (one).

#### Step 4 — Path B: Storybook OUT (~5 minutes)

If Jake decides OUT:

1. Write the decision artifact: `audit-output/design-1/step-4-storybook-decision.txt` containing one of two literals: `IN` or `OUT` (single line). Verifier checks #7 + #11 + exit criterion #5 read this file to determine which Path is active.
2. Document the rationale in `audit-output/design-1/capability-log-draft.md`: "Step 4 — Storybook OUT. Rationale: [Jake's reasoning, 3–5 lines]. Revisit at QA-1 if Tier-1 spec verification reveals isolation gaps."
3. Update Step 11 post-phase doc updates to skip Storybook references (CONVENTIONS.md item 3 omitted; verifier checks 7/11/27 + exit criterion 5 are no-op per artifact).
4. Move on to Step 5.

**No commit needed.** Path B is purely a documented decision, not a code change.

**Symmetric Path A artifact requirement:** if Jake decides IN, write the same artifact with `IN` as the literal contents at the start of Path A execution, before running `npx storybook init`. This means the artifact file is ALWAYS present at Step 4 close regardless of path; the verifier behaves accordingly.

**Capability log draft (Path B):** "Storybook deferred indefinitely under dev-light posture. Live preview + kitchen-sink demo + Tier-1 specs suffice for Jake's review. Customer-2 onboarding may revisit if external dev engagement is in play."

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
- No third-party UI libraries (no react-bootstrap, no chakra, no MUI, no shadcn). Use the local primitives at `@/components/ui/` only — these are hand-built atop Radix where applicable, exposed via typed CVA props (no className-only variants).
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

- `tools/eslint/ui-strings.json` — **canonical source of truth** for permitted UI chrome strings (per CMA-C1). Both ESLint and TypeScript consume this. JSON because Node.js natively supports JSON imports in `.mjs`; TS cannot be imported from `eslint.config.mjs` runtime.
- `site/src/lib/ui-strings.ts` — **committed file** generated from the JSON via `scripts/design/generate-ui-strings.mjs` (per F1 v1.5 — Option B). Sync between JSON and TS enforced by CI `git diff --exit-code` after re-running the generator, NOT by `prebuild` runtime. Eliminates Vercel root-directory path resolution failures and removes `tsx` runtime dependency entirely.
- `scripts/design/generate-ui-strings.mjs` — generation script (plain Node ESM, no `tsx` dependency per F1 Option C-style script fix). Reads JSON, emits typed TS const.
- `eslint.config.mjs` (or `.eslintrc.cjs` per Step 0b ESLint-version lock) — extended with `eslint-plugin-jsx-no-literals` (configured with `allowedStrings` from the JSON) **plus a complementary AST rule** (per CMA-I5) covering precomputed-const, ternary-arm, template-literal, and helper-wrapped literal evasions. Both rules scoped to `site/src/components/templates/**`.
- `eslint-rules/no-template-literals-in-render.js` — local AST rule covering 4 named evasion patterns `jsx-no-literals` doesn't catch (precomputed const, ternary literal arm, template literal in render, helper-wrapped literal). **Coverage scope (per F8 v1.4 + F29 v1.5):** rule catches the 4 *named* patterns as written. **Explicit non-goals:** outer-scope `const heading = '...'` declared at module level, destructured aliases (`const { x } = { x: '...' }`), reassigned `let` bindings, helper calls nested under conditionals or logical expressions. These are NOT guaranteed by `context.getScope()`-based local-scope lookup. Future hardening: reference-analysis-based rule with broader cross-scope coverage (out of DESIGN-1 scope; deferred as Tech Debt #22 if needed in TEMPLATE-* execution).
- `tools/qa/structural-diff.config.ts` — Playwright structural-diff config (run in QA-1, configured here so reference docs in Step 7 have a concrete consumer).
- `tools/qa/structural-diff.test.ts` — test runner reading reference docs from Step 7 and capturing screenshots for diff. Skeleton only; full execution is QA-1. Includes explicit `STRUCTURAL_DIFF_ENABLED !== 'true'` skip guard so CI can never accidentally run it (per CMA-Minor-15).
- `package.json` — `npm run qa:structural-diff` script (skipped in CI / prepush; manual invoke), `npm run generate:ui-strings` (manual regeneration; CI runs `git diff --exit-code site/src/lib/ui-strings.ts` post-regeneration to enforce sync per F1 Option B).

**Sub-step 6a — Content fidelity lint rule (rewritten end-to-end per CMA-C1):**

Goal: structurally prevent any template file from rendering a hardcoded English marketing string. Sanity is the source of truth.

**v1.2's approach was broken.** Cross-model audit caught that `eslint.config.mjs` runs in raw Node.js context and cannot import a `.ts` file. The `@/` path alias is a Next.js/TypeScript construct that doesn't exist in the ESLint config's Node.js runtime. v1.2's `Object.values(UI_STRINGS)` would have resolved to undefined or crashed the config — silently disabling the entire fidelity guard. This is the load-bearing fix in v1.3.

**v1.3 architecture:**

```
tools/eslint/ui-strings.json          ← canonical source (Node + TS both read)
            │
            ├──→ eslint.config.mjs    (imports JSON directly, no transpilation)
            │
            └──→ scripts/design/generate-ui-strings.mjs
                       │
                       └──→ site/src/lib/ui-strings.ts  (generated, gitignored OR committed-with-hash-check)
```

**1. Canonical JSON** — `tools/eslint/ui-strings.json`:

```json
{
  "EMAIL_LABEL": "Email",
  "NAME_LABEL": "Name",
  "SUBMIT": "Submit",
  "CLOSE": "Close",
  "CANCEL": "Cancel",
  "RETRY": "Try again",
  "REQUIRED_FIELD": "This field is required",
  "INVALID_EMAIL": "Please enter a valid email address",
  "GENERIC_ERROR": "Something went wrong. Please try again.",
  "EMPTY_RESULTS": "No results found.",
  "LOADING": "Loading",
  "MENU": "Menu"
}
```

**2. Generation script** — `scripts/design/generate-ui-strings.mjs`:

```js
import fs from 'node:fs/promises';
import path from 'node:path';

const JSON_PATH = path.resolve('tools/eslint/ui-strings.json');
const TS_PATH = path.resolve('site/src/lib/ui-strings.ts');

async function generate() {
  const raw = await fs.readFile(JSON_PATH, 'utf8');
  const data = JSON.parse(raw);
  const banner = `// AUTO-GENERATED from tools/eslint/ui-strings.json — do not edit.\n// Regenerate via: npm run generate:ui-strings\n\n`;
  const body = `export const UI_STRINGS = ${JSON.stringify(data, null, 2)} as const;\n\nexport type UIStringKey = keyof typeof UI_STRINGS;\n`;
  // Per F13 — ensure destination directory exists before writeFile (clean CI environments may not have it).
  await fs.mkdir(path.dirname(TS_PATH), { recursive: true });
  await fs.writeFile(TS_PATH, banner + body);
  console.log(`Generated ${TS_PATH} from ${JSON_PATH}`);
}

generate().catch(err => { console.error('generate-ui-strings failed:', err); process.exit(1); });
```

**Wire as a manual regeneration script + CI diff check (per F1 v1.5 — Option B):**

```json
{
  "scripts": {
    "generate:ui-strings": "node scripts/design/generate-ui-strings.mjs",
    "ci:check-ui-strings-sync": "node scripts/design/generate-ui-strings.mjs && git diff --exit-code site/src/lib/ui-strings.ts"
  }
}
```

`site/src/lib/ui-strings.ts` is a **committed file**. Editing the JSON requires running `npm run generate:ui-strings` and committing the regenerated TS in the same commit. CI enforces this via `npm run ci:check-ui-strings-sync` — if the regenerator produces a diff against the committed TS, the build fails with a clear "JSON and TS are out of sync — regenerate and commit" message.

**Why Option B (per F1 critical finding):** v1.4's `prebuild` script approach failed in three compounding ways on Vercel: `tsx` not in `site/package.json` devDeps, script path didn't resolve from `site/` cwd, JSON path didn't resolve from `site/` cwd. Option B eliminates all three by removing the runtime dependency entirely. Trade-off: requires manual regeneration discipline; CI diff check catches drift.

`node` is always available in CI; no `tsx`/TypeScript transpilation dependency. `.mjs` extension means native ESM with no toolchain. (Script body shown above in section 2.)

**Verifier check #13b (revised v1.5 per F1):** assert `site/src/lib/ui-strings.ts` is committed (not gitignored), AND `npm run ci:check-ui-strings-sync` exits 0 (proves JSON and TS are in sync). The `tsx` devDep requirement from v1.4 is REMOVED for **build-path scripts** — no longer needed since `generate-ui-strings.mjs` is plain Node ESM. **Dev-time scripts that humans invoke manually (e.g. `extract-gsap-timings.ts`, anything Playwright-based)** may still use `tsx` if convenient; F1's correctness concern was specifically about the Vercel `prebuild` path, not all repo tooling. Document any `tsx`-using dev-time scripts in CAPABILITY_LOG so a future CI integration knows to add `tsx` if it needs to invoke them automatically.

**3. ESLint config — branch on Step 0b output (per F27 v1.5; mutually exclusive — choose one block):**

**3a. If Step 0b determined FLAT CONFIG (`eslint.config.mjs` or similar):**

```js
// eslint.config.mjs
import jsxNoLiterals from 'eslint-plugin-jsx-no-literals';
import { fixupPluginRules } from '@eslint/compat';
import noTemplateLiteralsInRender from './eslint-rules/no-template-literals-in-render.js';
import uiStringsData from './tools/eslint/ui-strings.json' with { type: 'json' };

const allowedStrings = Object.values(uiStringsData);

export default [
  // ... existing config
  {
    files: ['site/src/components/templates/**/*.{ts,tsx}'],
    plugins: {
      // fixupPluginRules required: jsx-no-literals may not be flat-config native (per CMA-I13)
      'jsx-no-literals': fixupPluginRules(jsxNoLiterals),
      'mygratr': { rules: { 'no-template-literals-in-render': noTemplateLiteralsInRender } },
    },
    rules: {
      'jsx-no-literals/jsx-no-literals': ['error', {
        allowedStrings,
        ignoreProps: false,
        noStrings: true,
        noAttributeStrings: false,
        elementOverrides: {
          'img': { allowedStrings: [] },              // alt must come from data
          'button': { allowedStrings },
        },
      }],
      'mygratr/no-template-literals-in-render': 'error',
    },
  },
];
```

**3b. If Step 0b determined LEGACY CONFIG (`.eslintrc.cjs` or similar):**

```js
// .eslintrc.cjs
const uiStringsData = require('./tools/eslint/ui-strings.json');
const allowedStrings = Object.values(uiStringsData);

module.exports = {
  // ... existing config
  overrides: [
    {
      files: ['site/src/components/templates/**/*.{ts,tsx}'],
      plugins: ['jsx-no-literals', 'mygratr'],  // No fixupPluginRules in legacy config
      rules: {
        'jsx-no-literals/jsx-no-literals': ['error', {
          allowedStrings,
          ignoreProps: false,
          noStrings: true,
          noAttributeStrings: false,
          elementOverrides: {
            'img': { allowedStrings: [] },
            'button': { allowedStrings },
          },
        }],
        'mygratr/no-template-literals-in-render': 'error',
      },
    },
  ],
};
```

**Branching rule (per F9 v1.4 + F27 v1.5):** the branching variable is config style (flat vs legacy), NOT ESLint version. ESLint 9 supports legacy config via `ESLINT_USE_FLAT_CONFIG=false`; ESLint 8 supports flat experimentally. Step 0b determines actual style from which config file is present.

**4. Complementary AST rule** — `eslint-rules/no-template-literals-in-render.js`:

`eslint-plugin-jsx-no-literals` catches direct `JSXText` cases. It misses (per CMA-I5):
- Precomputed const literals: `const heading = 'Cloud Employee helps you scale'; return <h1>{heading}</h1>`
- Conditional literal arms: `{condition ? 'Read more' : data.ctaLabel}`
- Template literals in render: `<h1>{\`Trusted by ${count} teams\`}</h1>`
- Literal arguments to render-time helpers: `<h1>{formatTitle('Cloud Employee helps you scale')}</h1>`

Local AST rule covers these four patterns:

```js
// eslint-rules/no-template-literals-in-render.js
import uiStrings from '../tools/eslint/ui-strings.json' with { type: 'json' };

const allowed = new Set(Object.values(uiStrings));

export default {
  meta: {
    type: 'problem',
    messages: {
      precomputed: 'Precomputed string literal "{{value}}" rendered in JSX. Use Sanity data or UI_STRINGS.',
      ternaryArm: 'String literal "{{value}}" in conditional arm rendered in JSX. Use Sanity data or UI_STRINGS.',
      templateLiteral: 'Template literal in JSX render path. Use Sanity data; do not compose marketing copy in templates.',
      helperLiteral: 'String literal "{{value}}" passed to render-time helper. Use Sanity data or UI_STRINGS.',
    },
    schema: [],
  },
  create(context) {
    const fileName = context.getFilename();
    if (!fileName.includes('/site/src/components/templates/')) return {};

    function isLiteralOver2Chars(node) {
      return node?.type === 'Literal' && typeof node.value === 'string' && node.value.trim().length > 2;
    }
    function isAllowed(value) {
      return allowed.has(value.trim());
    }

    return {
      // Pattern 1: precomputed const rendered in JSX
      'JSXExpressionContainer Identifier'(node) {
        const scope = context.getScope();
        const variable = scope.variables.find(v => v.name === node.name);
        if (!variable) return;
        const def = variable.defs[0];
        if (def?.node?.init && isLiteralOver2Chars(def.node.init) && !isAllowed(def.node.init.value)) {
          context.report({ node, messageId: 'precomputed', data: { value: def.node.init.value } });
        }
      },
      // Pattern 2: ternary literal arm
      'JSXExpressionContainer ConditionalExpression'(node) {
        for (const arm of [node.consequent, node.alternate]) {
          if (isLiteralOver2Chars(arm) && !isAllowed(arm.value)) {
            context.report({ node: arm, messageId: 'ternaryArm', data: { value: arm.value } });
          }
        }
      },
      // Pattern 3: template literal in JSX render
      'JSXExpressionContainer TemplateLiteral'(node) {
        // Empty template literals (no quasis content) are noise; skip.
        if (node.quasis.every(q => !q.value.cooked.trim())) return;
        context.report({ node, messageId: 'templateLiteral' });
      },
      // Pattern 4: literal argument to render-time helper
      'JSXExpressionContainer CallExpression'(node) {
        for (const arg of node.arguments) {
          if (isLiteralOver2Chars(arg) && !isAllowed(arg.value)) {
            context.report({ node: arg, messageId: 'helperLiteral', data: { value: arg.value } });
          }
        }
      },
    };
  },
};
```

**5. Test fixtures** — `tests/lint/jsx-no-literals.test.ts` covers the 4 named evasion patterns plus a passing fixture. **Verifier scope (per F8):** the test proves the 5 sample fixtures behave as expected (1 passing → 0 errors; 4 failing → ≥1 error each). It does NOT prove the rule catches all semantically equivalent variants (e.g., outer-scope const, destructured alias). The Step 10 verifier runs this test as a hard gate against the named patterns; broader coverage is a future hardening concern.

```ts
// tests/lint/jsx-no-literals.test.ts (skeleton)
import { ESLint } from 'eslint';

const eslint = new ESLint({ overrideConfigFile: 'eslint.config.mjs' });

const fixtures = {
  passing: `
    import { UI_STRINGS } from '@/lib/ui-strings';
    export default function T({ data }: { data: { title: string } }) {
      return <div><h1>{data.title}</h1><button>{UI_STRINGS.SUBMIT}</button></div>;
    }
  `,
  failing_directJsxText: `
    export default function T() { return <h1>Cloud Employee helps you scale</h1>; }
  `,
  failing_precomputedConst: `
    export default function T() {
      const heading = 'Cloud Employee helps you scale';
      return <h1>{heading}</h1>;
    }
  `,
  failing_ternaryArm: `
    export default function T({ x }: { x: boolean }) {
      return <h1>{x ? 'Read more about Cloud Employee' : 'Click here'}</h1>;
    }
  `,
  failing_templateLiteral: `
    export default function T({ count }: { count: number }) {
      return <h1>{\`Trusted by \${count} engineering teams\`}</h1>;
    }
  `,
  failing_helperLiteral: `
    function format(s: string) { return s.toUpperCase(); }
    export default function T() { return <h1>{format('Cloud Employee helps you scale')}</h1>; }
  `,
};

// For each: assert passing has 0 errors, each failing has ≥1 error.
```

**Verifier check #13 (revised in v1.3):** runs all 6 fixtures. Asserts the passing fixture has zero errors; each of the 5 failing fixtures triggers at least one error from either `jsx-no-literals/jsx-no-literals` or `mygratr/no-template-literals-in-render`. Per CMA-I5, this is the load-bearing assertion that the rule actually catches what we claim it catches.

**Verifier check #13a (new in v1.3):** asserts `tools/eslint/ui-strings.json` and `site/src/lib/ui-strings.ts` are in sync. Hash check or schema validation. Prevents drift if someone manually edits the generated TS file.

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
3. **Schema-vs-reality reconciliation** (NEW sub-step per C1): for each template, list every required schema field that holds null in the migrated dataset. These are Tech-Debt-#16-shaped issues — schema declares required, data doesn't have it, Studio shows hard validation error. **DESIGN-1 does not fix these** — the brief's role is to surface them so STATIC-1 (or a SCHEMA-2 mini-phase) can decide schema-relax-with-fallback per template. Output: a `## Schema-vs-reality findings` section in each REFERENCE.md. **Each finding MUST have a `resolution-direction` field set to exactly one of (per F20 v1.5 enum):** `schema-relax`, `template-fallback`, `data-backfill`, `deferred-to-STATIC-1`, `deferred-to-SCHEMA-2`, `decision-needed`. Verifier #17 enforces this.
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

### Step 8 — Visual Editing infrastructure (~2 days, rebaselined from 1.5 in v1.2 per added probe + diagnostic + F15 closure)

**Output:**

- `site/src/lib/sanity/client.ts` — single client with conditional stega gated on `VERCEL_ENV` (per CMA-C2 + CMA-I7).
- `site/src/lib/sanity/live.ts` — already exists from SCAFFOLD-1; verify it uses single-client `defineLive({ client, serverToken })` pattern, not client-switching.
- `site/src/app/layout.tsx` — `<VisualEditing />` already conditionally rendered when `draftMode().isEnabled` per SCAFFOLD-1; verify it hasn't been removed.
- `site/src/app/api/draft-mode/enable/route.ts` — **F5 hardened in v1.4**: POST-only with origin check + header-based secret. SCAFFOLD-1 GET-with-query-string-secret shape removed.
- `site/src/app/api/draft-mode/disable/route.ts` — **F15 closed in v1.3 per CMA-I8.** Convert to `POST` only with origin check.
- `studio/sanity.config.ts` — `presentationTool` `previewUrl` config: confirm or update preview URL pattern.
- `site/src/app/page.tsx` — extended to render `homePage.heroHeadline` from seeded singleton via `sanityFetch` (smoke-test prerequisite per C4). **No marketing-copy fallback** (per CMA-Minor-17). **Seed via Studio UI manually** per F3 (v1.3's programmatic seed script removed).
- `docs/design/VISUAL_EDITING.md` — operator-facing doc explaining the round-trip workflow for Seb.

**Reframing per v1.1 + cross-model audit:** v1.0's `<VisualEditingProvider>` wrapper-per-template was a non-thing (I8). v1.2's "`sanityFetch` automatically routes to `previewClient` based on draft mode" was *also* a non-thing (CMA-C2). The accurate model is:

- **One `sanityClient`.** Stega is conditionally enabled on it via `VERCEL_ENV === 'preview'`.
- **`defineLive({ client: sanityClient, serverToken })` takes one client.** `serverToken` lets the live client fetch draft content when the request is in draft mode. There is no client-switching.
- **`<VisualEditing />` rendered once at layout level** (carried from SCAFFOLD-1).
- **Per-template:** templates use `sanityFetch` from `@/lib/sanity/live` so they go through the live client + serverToken path. They render Sanity strings directly into JSX without stega-stripping transforms.

**Sub-step 8a — Pre-flight: `next-sanity` import resolution probe (per CMA-C3, hardened v1.5 per F3):**

Before any import is written, run the probe to lock the actual import paths the installed version exposes. SCAFFOLD-1 already burned on three brief-mandated paths that didn't exist.

**v1.5 correction per F3 critical:** v1.4's probe used `Object.keys(pkg.exports)` which inspects keys but does not resolve them. A key may exist while its `import` condition resolves to `null` (a valid way to mark a sub-path as unavailable). v1.5 uses **actual `import()` resolution** — the only way to know whether a path resolves AND exposes the named export.

```bash
cd site
node --input-type=module <<'EOF'
const paths = ['next-sanity/visual-editing', 'next-sanity/live', 'next-sanity'];
const results = {};
for (const p of paths) {
  try {
    const mod = await import(p);
    results[p] = {
      ok: true,
      hasVisualEditing: 'VisualEditing' in mod,
      hasDefineLive: 'defineLive' in mod,
    };
  } catch (e) {
    results[p] = { ok: false, error: e.message };
  }
}
console.log(JSON.stringify(results, null, 2));
EOF
```

**Decision rule:** use the **first path that successfully resolves the named export**. Examples:

- If `next-sanity/visual-editing` resolves with `hasVisualEditing: true` → use it.
- Else if `next-sanity` resolves with `hasVisualEditing: true` → use root.
- Else → halt; package version mismatch, surface to Jake.

Same decision for `defineLive`. The two imports may resolve via different paths (one via sub-path, the other via root) — record both independently.

**Record in CAPABILITY_LOG:**

```
Resolved import paths for next-sanity (Sub-step 8a probe, [date]):
- VisualEditing: <path that resolved>
- defineLive:    <path that resolved>
- next-sanity version: <pkg.version>
```

**Verifier check #19a-extended (revised v1.5 per F3):** re-runs the resolution probe at execution time and asserts the recorded paths still resolve. Catches package upgrades between probe time and build time. The build-pass gate (`npm run build` in `site/`) is the secondary safety net.

**Sub-step 8b — Vercel preview URL (DECISION A — auto-generated stable URL, per CMA-I10):**

Cross-model audit caught that `preview-mygratr-cloudemployee.vercel.app` cannot be added as a custom domain — Vercel reserves the `.vercel.app` TLD. v1.2's locked URL would have failed silently and broken the entire smoke test. v1.3 corrects to **Decision A** (auto-generated Vercel stable URL).

**Locked URL:** Vercel's auto-generated production URL for the `cloud-employee` project.

To find it:

```bash
# In Vercel CLI (or check the project's "Domains" tab in dashboard):
vercel inspect --scope=cloud-employee | grep -A2 "Production"
# Likely format: cloud-employee.vercel.app or cloud-employee-{team}.vercel.app
```

Record the actual URL in CAPABILITY_LOG once confirmed. All downstream references (Studio Presentation Tool config, structural-diff specs, operator doc) use this URL.

**Why not custom domain in DESIGN-1:**
- `preview.cloudemployee.io` requires DNS work on CE's live domain pre-cutover. Risky.
- A real custom domain like `preview.mygratr.dev` requires registering a domain Mygratr/Saxon.io controls. Defer to LAUNCH; not blocking DESIGN-1.

**Custom domain timing:** the `preview.mygratr.dev` (or equivalent) custom domain is a LAUNCH-phase deliverable. DESIGN-1 uses the auto-generated URL; the smoke test still validates the entire Visual Editing flow against that URL.

**Vercel deployment protection** is already in use per SCAFFOLD-1. No changes here.

**Smoke check after recording the URL:**

```bash
curl -I https://{auto-generated-url}/
# Expected: 401 (deployment protection) or 200 if bypass-token query string included
```

DNS-resolution failure → halt; the URL we recorded is wrong.

**Sub-step 8c — Single-client + conditional stega (corrected per CMA-C2 + CMA-I7):**

```ts
// site/src/lib/sanity/client.ts
import { createClient } from 'next-sanity';
import { env } from '@/lib/env';

// Single client — conditional stega gated on Vercel preview env.
// In production: stega disabled (clean strings shipped).
// In preview deployment: stega enabled (zero-width markers for click-to-edit).
// Per F19 — useCdn: true is correct for published reads. defineLive's serverToken-authenticated
// draft requests bypass CDN automatically (Sanity's CDN does not serve draft perspectives), so
// draft freshness is preserved. If smoke test round-trip B exceeds target, verify this assumption
// holds in the installed next-sanity version (Sub-step 8a probe also surfaces version).
//
// Per F7 v1.5 — stega gating uses an EXPLICIT boolean env var SANITY_STEGA_ENABLED
// as the primary gate, falling back to VERCEL_ENV === 'preview' when not set.
// This makes non-Vercel deployments safe (VERCEL_ENV is undefined off-Vercel; default to false)
// AND provides an explicit override path for non-Vercel preview environments
// (a future Render/Fly/etc deployment sets SANITY_STEGA_ENABLED=true on its preview env).
function isStegaEnabled(): boolean {
  if (process.env.SANITY_STEGA_ENABLED === 'true') return true;
  if (process.env.SANITY_STEGA_ENABLED === 'false') return false;
  return process.env.VERCEL_ENV === 'preview'; // fallback when not explicitly set
}

export const sanityClient = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset:   env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2025-01-01',
  useCdn: true,
  perspective: 'published',
  stega: {
    enabled: isStegaEnabled(),
    studioUrl: env.NEXT_PUBLIC_SANITY_STUDIO_URL,
  },
});
```

```ts
// site/src/lib/sanity/live.ts
import { defineLive } from 'next-sanity'; // or 'next-sanity/live' per Sub-step 8a probe
import { sanityClient } from './client';

// defineLive takes ONE client + serverToken.
// serverToken lets the live client fetch draft content when request is in draft mode.
// There is no client-switching based on draft mode (corrected from v1.0–v1.2 misconception per CMA-C2).
export const { sanityFetch, SanityLive } = defineLive({
  client: sanityClient,
  serverToken: process.env.SANITY_API_READ_TOKEN, // server-only, viewer-scoped (verified Step 0c)
});
```

**Production safety (per CMA-I7 — symmetric assertion):**

`VERCEL_ENV` is set automatically by Vercel:
- `production` on the production deployment
- `preview` on preview deployments  
- `development` on local dev

The above config means stega is OFF in production (correct) and ON in preview (correct). But **a misset/missing `VERCEL_ENV` could cause stega to leak into production strings**. Verifier check #19b (new in v1.3) asserts:

```ts
// In a production build context (NODE_ENV === 'production' && VERCEL_ENV === 'production'):
assert(sanityClient.config().stega?.enabled !== true, 'sanityClient must NOT have stega enabled in production');
```

This is the symmetric check the v1.2 verifier was missing.

**Sub-step 8d — F15 closure: harden draft-mode disable route (per CMA-I8):**

SCAFFOLD-1 deferred POST-only + origin check on `/api/draft-mode/disable` to "TEMPLATE-* or pre-launch" (deferred item F15). Cross-model audit flagged this as a CSRF vector: a GET-accepting disable route lets any external page silently disable draft mode for any authenticated user via `<img src=".../api/draft-mode/disable">`. The disable route is exercised by Step 8's smoke test — close F15 here, not at TEMPLATE-* time.

```ts
// site/src/app/api/draft-mode/disable/route.ts
import { draftMode } from 'next/headers';
import { NextResponse } from 'next/server';
import { env } from '@/lib/env';

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  const allowed = [
    env.NEXT_PUBLIC_SITE_URL,
    env.NEXT_PUBLIC_SANITY_STUDIO_URL,
  ].filter(Boolean);

  if (!origin || !allowed.some(a => origin === a)) {
    return NextResponse.json({ error: 'forbidden origin' }, { status: 403 });
  }

  (await draftMode()).disable();
  return NextResponse.json({ disabled: true });
}

// No GET export — old behaviour explicitly removed.
```

Studio Presentation Tool's "exit preview mode" calls this endpoint. Confirm the call uses POST (Studio respects `previewUrl` config — should already be POST in current `sanity/presentation` versions).

Verifier check #19c (new in v1.3): grep `disable/route.ts` for `export async function POST` (must exist) and `export async function GET` (must NOT exist).

**Sub-step 8d2 — Symmetric `enable` route hardening (NEW v1.4 per F5; revised v1.5 per CMA-Round-3 F2/F5/F8):**

Cross-model audit caught that v1.3 closed F15 on `disable` but left `enable` with SCAFFOLD-1's GET-with-secret-in-query-string shape. Same CSRF surface: an attacker can silently *enable* draft mode via `<img src=".../enable?secret=...">` (which leaks the secret on referer headers + browser history if the attacker observes traffic) or with a leaked secret (which by design is shared with anyone in the team via Studio config). v1.4 closes this asymmetry: convert `enable` to POST-only with origin check + body-or-header secret validation, mirroring `disable`.

**Pre-execution checklist (NEW v1.5 per F2 — critical):** before running the Step 8d2 verifier, manually confirm:

- [ ] `site/src/app/api/draft-mode/enable/route.ts` SCAFFOLD-1 baseline (GET with `?secret=` query param) has been removed.
- [ ] New POST-only handler is in place (code below).
- [ ] `SANITY_PREVIEW_SECRET` is added to `site/src/lib/env.ts` Zod schema as a required string. Without this, a missing secret causes `undefined !== undefined` → silent always-pass on the equality check.
- [ ] `SANITY_PREVIEW_SECRET` is set as a Vercel project env var (production + preview scopes). Same value in Studio's `presentationTool` config.

```ts
// site/src/lib/env.ts (relevant addition per F2)
import { z } from 'zod';

const serverEnvSchema = z.object({
  // ... existing
  SANITY_PREVIEW_SECRET: z.string().min(16, 'SANITY_PREVIEW_SECRET must be set (≥16 chars)'),
});
```

```ts
// site/src/app/api/draft-mode/enable/route.ts
import { draftMode } from 'next/headers';
import { NextResponse } from 'next/server';
import { env } from '@/lib/env';

// Per F5 — normalise origins via URL parsing to handle trailing slashes / port inconsistencies.
function originMatches(requestOrigin: string, allowedBase: string): boolean {
  try {
    return new URL(requestOrigin).origin === new URL(allowedBase).origin;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) {
    return NextResponse.json({ error: 'missing origin' }, { status: 403 });
  }

  // Per F8 — Vercel preview URL must be in allowlist when running in preview deployment.
  // Per F5 — localhost added when in development.
  const allowed = [
    env.NEXT_PUBLIC_SITE_URL,
    env.NEXT_PUBLIC_SANITY_STUDIO_URL,
    process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : null,
    process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null,
    process.env.NODE_ENV === 'development' ? 'http://localhost:3333' : null,
  ].filter((a): a is string => Boolean(a));

  if (!allowed.some(a => originMatches(origin, a))) {
    return NextResponse.json({ error: 'forbidden origin' }, { status: 403 });
  }

  // Secret read from header, not query string (per F5)
  const secret = request.headers.get('x-sanity-preview-secret');
  if (secret !== env.SANITY_PREVIEW_SECRET) {
    return NextResponse.json({ error: 'invalid secret' }, { status: 401 });
  }

  (await draftMode()).enable();
  return NextResponse.json({ enabled: true });
}

// No GET export — old query-string-secret behaviour explicitly removed.
```

**Studio Presentation Tool integration:** the `presentationTool({ previewUrl: { previewMode: { enable: '/api/draft-mode/enable' } } })` config in `studio/sanity.config.ts` MAY use GET in some versions of `sanity/presentation`. Cross-model audit Finding 9 caught that this assumption was unverified in v1.4. **Step 8g now includes a mandatory non-skippable verification step** (between items 5 and 6) that opens DevTools network tab and asserts the request method.

**The disable route receives the same F5/F8 treatment.** Update `site/src/app/api/draft-mode/disable/route.ts` to use `originMatches()` and include the Vercel preview URL in its allowlist. (Code identical structure; only `enable()` → `disable()` differs.)

Verifier check #19d (revised v1.5 per F2/F5/F8): assert (a) `enable/route.ts` exports `POST` and NOT `GET`; (b) secret is read via `request.headers.get(...)` not `URL.searchParams`; (c) `originMatches` helper is used (grep for the function name); (d) `SANITY_PREVIEW_SECRET` is in `site/src/lib/env.ts` Zod schema. Same assertions for `disable/route.ts` minus the secret check.

CONVENTIONS.md draft-mode route hardening pattern (renamed from F15-Closed per F17 v1.5) updated to cover both `enable` and `disable` symmetrically with all three protections (POST-only, normalised origin check, secret-in-header).

**Sub-step 8e — Smoke-test prerequisite: seed homepage hero via Studio (revised v1.4 per F3):**

Two corrections from v1.2, revised per v1.4 cross-model audit:

1. **No marketing-copy fallback.** v1.2's `data?.heroHeadline ?? 'Cloud Employee'` violates Hard Rules #1 and #7 (hardcoded marketing). Worse: if `heroHeadline` is null, the fallback string renders without stega encoding (it's a JS literal, not a Sanity-fetched string), so click-to-edit fails — *and the smoke test silently records a false positive*. Drop the fallback entirely.

2. **Seed `heroHeadline` via Studio UI manually (revised v1.4 per F3):** v1.3 introduced `scripts/design/seed-hero-headline.ts` using `SANITY_MIGRATION_WRITE_TOKEN` to programmatically seed. Cross-model audit (Finding 3, escalated to Critical) caught this as a security regression: DESIGN-1 is not a migration phase, and reaching for the migration write token outside migration phases blurs the token-scoping discipline established by CONVENTIONS.md and Tech Debt #15. v1.4 reverts to the manual approach: open Studio, navigate to the `homePage` singleton, set `heroHeadline` to `DESIGN-1 smoke-test placeholder — replace via Studio`, publish.

   Manual seed has no token requirement and no risk of token-scope confusion. Verifier check #20a asserts `heroHeadline` is non-empty before the smoke test runs, catching human-error skip.

```tsx
// site/src/app/page.tsx
import { sanityFetch } from '@/lib/sanity/live';

const HOME_HERO_QUERY = `*[_type == "homePage"][0]{ heroHeadline, _id }`;

export default async function Home() {
  const data = await sanityFetch({ query: HOME_HERO_QUERY });
  // No fallback — if heroHeadline is missing, render empty <h1>.
  // Empty <h1> is preferable to a hardcoded string with no stega payload (false-positive smoke test).
  // Manual Studio seed is the prerequisite (per F3); verifier #20a catches missed seed.
  return (
    <main>
      <h1>{data?.heroHeadline}</h1>
    </main>
  );
}
```

Verifier check #20a (revised v1.4 per F3): `*[_type == "homePage"][0].heroHeadline` is a non-empty string AND not equal to a known empty-state sentinel. If empty: halt smoke test; instruct operator to seed via Studio. **No automated seed script** — Studio UI is the canonical path. This explicitly NOT a regression to v1.2's "if empty, populate via Studio" — verifier #20a closes the manual-step gap by catching skip programmatically.

**Sub-step 8f — Studio Presentation Tool preview URL update:**

```ts
// studio/sanity.config.ts
import { presentationTool } from 'sanity/presentation';

// ...
plugins: [
  presentationTool({
    previewUrl: {
      // Use the auto-generated Vercel URL from Sub-step 8b — record actual URL in CAPABILITY_LOG.
      origin: process.env.SANITY_STUDIO_PREVIEW_URL_ORIGIN!, // e.g. 'https://cloud-employee.vercel.app'
      previewMode: { enable: '/api/draft-mode/enable' },
      draftMode:  { enable: '/api/draft-mode/enable' },
    },
  }),
  // ...
],
```

Studio reads `SANITY_STUDIO_PREVIEW_URL_ORIGIN` from `studio/.env` so the URL isn't hardcoded; CAPABILITY_LOG documents the actual value used during DESIGN-1.

**Sub-step 8g — Operator doc for Seb:**

`docs/design/VISUAL_EDITING.md` — plain-English explanation of the workflow. Two distinct round-trips:

**Round-trip A — Click-to-edit (target ~10s):**
1. In Studio, click the Presentation icon (top nav).
2. Click any text or image on the rendered preview.
3. Studio focuses the corresponding field.

*Latency:* mostly browser navigation + Studio panel load. ~10s end-to-end.

**Round-trip B — Publish-to-preview (target ~5s, per Roadmap §4.4):**
1. Edit the field in Studio.
2. Hit publish.
3. Preview reflects the change.

*Latency:* `defineLive` revalidation + Sanity CDN propagation. ~5s end-to-end.

Include screenshots once both round-trips are verified end-to-end on the homePage placeholder smoke test.

**Smoke test — runnable end-to-end:**

1. Run `npm run generate:ui-strings` (one-off if JSON edited; v1.5 dropped `prebuild` per F1).
2. **Verify `homePage.heroHeadline` is seeded via Studio UI** (per F3 — no programmatic script). If empty, open Studio, navigate to `homePage` singleton, set `heroHeadline` to `DESIGN-1 smoke-test placeholder — replace via Studio`, publish. Verifier check #20a halts smoke test if `heroHeadline` is empty.
3. Verify `*[_type == "homePage"][0].heroHeadline` is non-empty (or run verifier check #20a).
4. Push to a branch that deploys to Vercel preview.
5. Open Studio, navigate to Presentation Tool.
5a. **(NEW v1.5 per F9 — mandatory non-skippable):** Open browser DevTools → Network tab. Filter by "enable".
5b. In Studio, click the Presentation Tool icon to activate preview mode.
5c. Assert: method is POST (not GET). Assert: response status is 200 (not 405).
5d. **If method is GET:** do NOT proceed. Check installed `sanity` package version. If upgrade available, upgrade. If not, revert enable route to accept GET with normalised origin check + secret-in-header (still non-trivial security posture vs query string), document as Tech Debt #21, surface to Jake.
5e. Record in PHASE_HISTORY: `Studio Presentation Tool sends [GET|POST] to /api/draft-mode/enable — verified via DevTools network tab on [date]`. (Verifier check #19e asserts this string is present.)
6. **Round-trip A:** click the rendered `heroHeadline` text. Verify Studio focuses the right field within 10s. Record timing.
7. **Round-trip B:** edit the field in Studio. Hit publish — twice. Record both **cold-CDN** (first publish) and **warm-CDN** (second publish) timings (per F24 minor — cold-vs-warm distinction). Apply halt threshold to the warm-CDN measurement only.
8. Record all timings in PHASE_HISTORY: `Visual Editing round-trip A measured at Xs; Round-trip B (cold) Ys; Round-trip B (warm) Zs.`
9. **Behavioral stega assertion (per CMA-I14, scoped v1.5 per F15):** in the deployed preview HTML, verify stega zero-width markers are present **specifically within the `<h1>` containing the `heroHeadline`**, not anywhere in the page (third-party scripts, embedded metadata, etc. can produce false positives). Wrap the smoke-test render with `data-testid="hero-headline"` to make this targetable.

```bash
# Per F16 v1.5 — corrected curl syntax. -H @file is INVALID in curl; @file applies to -d (body), not -H (headers).
# Use shell command substitution to read the header from a gitignored file.
# Create ~/.mygratr/vercel-bypass-header.txt containing the single line:
#   x-vercel-protection-bypass: <secret>
# File mode 0600. Excluded from Time Machine / Dropbox / iCloud backups (per F6).
# Then:
curl -s -H "$(cat ~/.mygratr/vercel-bypass-header.txt)" \
  "https://{preview-url}/?_disableDraftMode=false" \
  | tee /tmp/preview.html > /dev/null

# Per F15 v1.5 — scope to the heroHeadline element specifically (data-testid="hero-headline"),
# not the whole HTML. Extract the h1 content and check for stega markers within it only.
node -e "
  const html = require('fs').readFileSync('/tmp/preview.html', 'utf8');
  const m = html.match(/<h1[^>]*data-testid=[\"']hero-headline[\"'][^>]*>([\s\S]*?)<\/h1>/);
  if (!m) { console.error('✗ hero-headline element not found in preview HTML'); process.exit(1); }
  const inner = m[1];
  const hasStega = /[\u200B\u200C\u200D\uFEFF]/.test(inner);
  console.log(hasStega ? '✓ Stega markers present in hero-headline' : '✗ No stega markers in hero-headline — Visual Editing broken');
  process.exit(hasStega ? 0 : 1);
"
```

**Bypass token policy (revised v1.5 per F6):**
- File at `~/.mygratr/vercel-bypass-header.txt` is gitignored, mode 0600, NOT committed to repo.
- **Backup-system exclusion (NEW v1.5 per F6):** add `~/.mygratr/` to Time Machine exclusions, exclude from Dropbox/iCloud Drive sync, document in onboarding for any other reviewers (Seb).
- Token rotated post-DESIGN-1 close — track in CLAUDE.md as Tech Debt #19 (rotation cadence). **Add reminder to post-phase checklist** (not just Tech Debt — per F6 v1.5, Tech Debt entries get missed).
- Never echo the token in verifier output, even on failure. Verifier wraps the fetch and **logs only HTTP status code on failure** (per F6 v1.5 — full request object would leak the token in CI logs).
- **CI runs MUST use Vercel's per-deployment bypass mechanism** (set per build via Vercel API), NOT the long-lived shared `VERCEL_AUTOMATION_BYPASS_SECRET`. Per-deployment bypass auto-expires; shared secret persists indefinitely if leaked.
- Shell-history exposure: corrected curl syntax is `-H "$(cat ~/.mygratr/...)"` (per F16 v1.5 — `-H @file` is invalid in curl; `@file` semantics apply to `-d`/body, not headers).

**Draft-fetch smoke assertion (NEW v1.5 per F10):**

Before recording smoke-test pass, prove the `defineLive` CDN-bypass behavior with a direct test:

10. In Studio, edit `heroHeadline` to a draft-only value (DO NOT publish). Note the value.
11. With draft mode enabled (Presentation Tool), fetch the homepage via `sanityFetch`. Assert the draft value appears in rendered HTML.
12. Without draft mode (open page in a separate browser without Studio cookies), fetch the homepage. Assert the draft value does NOT appear (published version still shown).
13. Record in PHASE_HISTORY: `Draft-fetch smoke assertion: draft value [X] visible in draft mode, hidden in published view — verified [date]`.
14. **Discard the draft** (revert in Studio) before continuing other work.

This converts v1.4's "useCdn:true with serverToken bypasses CDN for drafts" from an assumption into a tested invariant. Verifier check #20b (NEW v1.5): PHASE_HISTORY contains the draft-fetch assertion record.

**Halt thresholds (resolved per CMA-I12 — §14 wins; revised v1.5 per F24 — warm-CDN measurement):**

Halt threshold applies to the **warm-CDN measurement** of round-trip B, not the cold-CDN first publish (per F24 minor — first publish includes cold-CDN propagation, which is not the steady-state experience).

If round-trip A within 10–20s OR round-trip B (warm) within 5–10s: log as risk and continue. QA-1 retests post-template-build.

If round-trip A >20s OR round-trip B (warm) >10s: **halt per §14.**

Diagnostic checklist on halt:
1. Re-measure with deployment protection bypassed (`x-vercel-protection-bypass` header) to isolate auth-latency contribution.
2. Re-measure round-trip B with warm CDN (already done in step 7; if cold and warm differ wildly, that's the diagnosis).
3. Verify `defineLive({ client, serverToken })` actually has `serverToken` set (missing token forces fallback to public CDN, slowing draft fetches).
4. Check browser DevTools → Network for stega payload size on the preview response. Excessive size suggests stega is encoding too aggressively.
5. Independently load the Studio Presentation Tool iframe URL and time it — slow Studio loads inflate round-trip A.
6. Check region of Vercel deployment vs Sanity API — cross-region adds latency.

If diagnosis points to `defineLive` misconfiguration → fix and retry. If diagnosis points to network/CDN that won't resolve at this layer → surface to Jake; QA-1 has the budget to retest with realistic data volume.

**Capability log draft:** "Visual Editing infrastructure — single client with conditional stega gated on `SANITY_STEGA_ENABLED` env var (defaults to `VERCEL_ENV === 'preview'` per F7), `defineLive({ client, serverToken })` takes one client (NOT client-switching, per CMA-C2), `<VisualEditing>` rendered at layout level (carried from SCAFFOLD-1). Per-template wiring via Sanity Fetch + Render-Discipline conventions in CONVENTIONS.md. Two distinct round-trips: A (click-to-edit) target 10s, B (publish-to-preview, warm CDN) target 5s. Preview URL is the auto-generated Vercel project URL (custom domain deferred to LAUNCH per CMA-I10 Decision A). F15 closed in DESIGN-1 with symmetric enable+disable hardening — see CONVENTIONS.md Draft-Mode Route Hardening Pattern."

**Commit points:** probe + import-path lock (one), client config + symmetric stega assertion (one), F15 closure on disable route (one), `app/page.tsx` extension + seed script (one), Studio config (one), operator doc + smoke test recording with both timings + behavioral stega assertion (one).

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

## DESIGN-1 — Design tokens, primitives, complex specs, Visual Editing, fidelity guarantees (May 2026)

### Token system architecture

[Consolidates the Step 1 capability draft. Methodology + token categories + extraction approach. Tailwind v4 namespace gotchas (per DEV-5) — multi-namespace probe required before locking. Dual-consumer motion pattern (`--motion-*` source-of-truth read by GSAP; `--duration-*` / `--ease-*` Tailwind utility aliases).]

### Primitive component patterns

[Consolidates the Step 2 capability draft. Hand-built atop @radix-ui primitives directly (no shadcn). CVA standardized for variant API. No-className-variants rule. SVG sprite for icons (no lucide-react, no Material Symbols). GSAP banned from primitives — CSS transitions only for hover states.]

### Storybook setup (conditional)

[Consolidates the Step 4 capability draft IF Storybook IN per Step 4 entry decision. If OUT, this section documents the deferral rationale and revisit trigger (Tier-1 spec verification gaps surfaced at QA-1).]

### Complex-component specification methodology

[Consolidates the Step 3 capability draft. 8-section spec template. Data-binding section ties UI directly to schema field paths.]

### v0.dev prompt template

[Consolidates the Step 5 capability draft.]

### Fidelity guarantee mechanisms

[Consolidates the Step 6 capability draft. Three structural mechanisms.]

### Visual Editing infrastructure

[Consolidates the Step 8 capability draft. Single client + conditional stega (gated on VERCEL_ENV=preview), defineLive({ client, serverToken }) takes one client, two CONVENTIONS.md patterns (Sanity Fetch + Render-Discipline) replace per-template wrapper, auto-generated Vercel preview URL (custom domain deferred to LAUNCH). F15 closed in DESIGN-1.]

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
2. **DEV-3 supersession:** Original v1.5 check was "`site/tailwind.config.ts` differs from create-next-app default." Tailwind v4 is CSS-first; `tailwind.config.ts` was DROPPED. Replacement check: `site/src/app/tokens.css` contains a `@theme {…}` block with at least one `--color-*` token AND at least one `--text-*` token (sentinel: includes one of the locked CE token names, e.g. `--color-cc-yellow` or `--text-h1-desktop`).
3. `site/src/app/tokens.css` exists (per DEV-3 — Tailwind v4 CSS-first; v1.5 specified `site/src/styles/tokens.css`).
4. `site/src/app/globals.css` imports `tokens.css` (paths corrected per DEV-3).
5. `docs/design/COMPONENTS.md` exists. Single doc, table format. Contains 23 rows (the 22 brand inventory + Icon foundation primitive — assert by row count, not header text per F18 v1.5).
6. Each primitive in Step 2 has an `index.tsx` file at `site/src/components/ui/{name}/index.tsx` (per-primitive folder structure per v2.0 Step 2 file org).
7. **Storybook pair-rule — Path-A-conditional (v2.0 supersession):** IF Storybook IN at Step 4, each primitive has a `stories.tsx` sibling at `site/src/components/ui/{name}/stories.tsx` AND each Tier-1 component has a stories file. IF Storybook OUT, this check is no-op. Verifier reads the Step 4 decision artifact (`audit-output/design-1/step-4-storybook-decision.txt`) to determine path.
8. `docs/design/TIER_1_INVENTORY.md` exists and contains a non-empty table.
9. For each Tier-1 component listed in TIER_1_INVENTORY.md, a spec exists at `docs/design/components/{slug}.md` with the 8 mandatory sections.
10. **Storybook Tier-1 pair-rule — Path-A-conditional (v2.0):** IF Storybook IN, each Tier-1 component has a stories file. IF OUT, no-op.
11. **Storybook scaffold + build — Path-A-conditional (v2.0):** IF Storybook IN, `site/.storybook/main.ts` exists AND `npm run build-storybook` passes in `site/`. IF OUT, no-op.
12. `docs/V0_PROMPT_TEMPLATE.md` exists. Three example prompts exist under `docs/templates/_examples/`.
13. **Lint coverage (revised v1.3 per CMA-I5):** `eslint-plugin-jsx-no-literals` AND `mygratr/no-template-literals-in-render` are configured for `site/src/components/templates/**`. The fixture suite at `tests/lint/jsx-no-literals.test.ts` includes 1 passing fixture + 5 failing fixtures (direct JSX text, precomputed const, ternary arm, template literal, helper-wrapped literal). All 6 fixtures produce expected outcomes (`npm run test:lint`).
13a. **JSON ↔ TS sync (revised v1.5 per F11):** `tools/eslint/ui-strings.json` and `site/src/lib/ui-strings.ts` are semantically in sync. Implementation: parse JSON; parse `site/src/lib/ui-strings.ts` via TypeScript AST (`ts-morph` or `typescript` compiler API); locate the `UI_STRINGS = { ... } as const` object literal; extract key/value pairs; deep-compare against JSON. **Compare keys and string values only.** Byte-comparison and full-file regeneration-and-diff are explicitly NOT correct strategies — both are sensitive to non-semantic formatting (key order, whitespace, banner text) that doesn't affect lint-time behavior. (v1.4's "Alternative: regenerate TS to a temp string and byte-compare" path is REMOVED in v1.5.) The CI sync check from F1 (`git diff --exit-code` after regeneration) is a separate enforcement layer — that one IS byte-sensitive, but it's a pre-commit/pre-push gate, not a verifier semantic check.
14. `site/src/lib/ui-strings.ts` exists and exports `UI_STRINGS` const, generated from `tools/eslint/ui-strings.json`.
15. **Structural-diff specs (revised v1.3 per CMA-Minor-15):** `tools/qa/structural-diff.config.ts` exists and exports `STRUCTURAL_DIFF_SPECS`. Length matches the count of confirmed templates from Step 7 (13 confirmed + 1 conditional on §12.6 TAXONOMY resolution). **No entry contains curly-brace placeholders** in `liveUrlSample` or `newUrlSample` (regex `/{[^}]+}/`).
16. `docs/templates/{slug}/REFERENCE.md` exists for each of the 13 confirmed template types (BLOG, BOOK_A_CALL, COMPARE, CUSTOMER_STORY, DOWNLOAD, HOME, REVIEW, SERVICE, STATIC, TEAM_MEMBER, TECHNOLOGY, TOOL, VIDEO). If TAXONOMY resolved per §12.6 then assert 14. UNKNOWN dropped per I1; `docs/templates/_resolved-classifications.md` exists instead.
17. **Schema-vs-reality findings (tightened v1.3 per CMA-I4; enum formalised v1.5 per F20):** each REFERENCE.md has the field-to-UI map section AND the schema-vs-reality findings section. **The schema-vs-reality section is non-empty AND each finding has a resolution direction from the canonical enum** (one of: `schema-relax`, `template-fallback`, `data-backfill`, `deferred-to-STATIC-1`, `deferred-to-SCHEMA-2`, `decision-needed`). The `decision-needed` value (NEW v1.5) covers Jake-decision/unresolved cases that the previous five values had no neutral bucket for. Specifically for `blogPost`, the section MUST contain a finding for `blogPost.author` with resolution direction.
18. **REMOVED in v1.1.**
18a. `site/src/app/page.tsx` calls `sanityFetch` from `@/lib/sanity/live` (assert by AST or grep for `sanityFetch(`).
18b. `site/src/app/layout.tsx` still renders `<VisualEditing />` conditional on `draftMode().isEnabled` (carried from SCAFFOLD-1 — assert it hasn't been removed).
19. **Behavioral stega assertion (revised v1.3 per CMA-I14):** in deployed preview HTML for the homepage, assert zero-width Unicode markers (U+200B, U+200C, U+200D, U+FEFF) are present in the rendered `heroHeadline` text. This is the version-invariant authoritative gate. Implementation:
    ```ts
    const html = await fetch(previewUrl, { headers: { 'x-vercel-protection-bypass': bypassSecret } }).then(r => r.text());
    if (!/[\u200B\u200C\u200D\uFEFF]/.test(html)) throw new Error('No stega markers in preview HTML — Visual Editing broken');
    ```
19a. **Build-pass import-path gate (new v1.3 per CMA-C3):** `npm run build` passes in `site/`. This is the load-bearing assertion that the import paths resolved by Sub-step 8a's `pkg.exports` probe actually compile. The probe + this assertion together close the SCAFFOLD-1 import-drift class of failures.
19b. **Production stega isolation (revised v1.4 per F4):** in a production-build context (`NODE_ENV === 'production' && VERCEL_ENV !== 'preview'`), assert `sanityClient.config().stega?.enabled !== true`. Config-shape check at build time. **Note (per F4):** this is config-shape only, not behavioral. The brief itself argues elsewhere that "behavioral check is authoritative; config-shape inspection is informational only" — that argument applies symmetrically. **Carry-forward (NEW v1.4 — Tech Debt #18):** post-LAUNCH (and pre-template-launch in QA-1), run the symmetric behavioral check against the *production* deployment URL: `fetch(PROD_URL).then(r => r.text())` then assert no zero-width markers. Cannot run in DESIGN-1 because production deployment doesn't exist yet. Tech Debt #18 logged in CLAUDE.md.
19c. **F15 closure (new v1.3 per CMA-I8):** `site/src/app/api/draft-mode/disable/route.ts` exports `POST` only. No `GET` export. Origin check exists in the POST handler (grep for `request.headers.get('origin')`).
20. `studio/sanity.config.ts` `presentationTool.previewUrl.origin` matches the auto-generated Vercel URL recorded in CAPABILITY_LOG (per CMA-I10 Decision A — no longer `preview-mygratr-cloudemployee.vercel.app`).
20a. **Hero headline seeded (new v1.3 per CMA-Minor-18):** `*[_type == "homePage"][0].heroHeadline` is a non-empty string.
21. `docs/design/VISUAL_EDITING.md` exists and documents both round-trip A (click-to-edit, ~10s) and round-trip B (publish-to-preview, ~5s) AND the diagnostic checklist for halt thresholds (per CMA-I12).
22. `docs/CAPABILITY_LOG.md` exists at repo root and contains a `## DESIGN-1` section.
23. **Smoke test recorded:** PHASE_HISTORY entry for DESIGN-1 contains "Visual Editing round-trip A measured at Xs" and "round-trip B measured at Ys" with actual numeric values.
24. `npm run build` passes from repo root (TS + ESLint clean). CI sync check `ci:check-ui-strings-sync` exits 0 (per F1 v1.5 Option B — no prebuild script in v1.5).
25. `npm run build` passes in `site/`.
26. `npm run build` passes in `studio/`.
27. **Storybook build — Path-A-conditional (v2.0):** IF Storybook IN, `npm run build-storybook` passes in `site/`. IF OUT, no-op. (Duplicate of #11 — kept for verifier numbering continuity per F18 v1.5.)
28. **I5 metadata refresh confirmed:** `migrations.metadata.content_phase.content_migrations_rows === 42` for the CE migration.
29. **Token scope verified (new v1.3 per CMA-I9):** CAPABILITY_LOG contains a confirmation entry that `SANITY_API_READ_TOKEN` is `viewer`-scoped (manual confirmation + write-probe outcome).

**No state machine transition.** DESIGN-1 does not call `assertValidTransition()` (DESIGN does not exist as a `MigrationStatus`). The verifier asserts `migrations.status === 'content_complete'` on entry and exit. Step 11 carries the implication forward.

**Commit point:** `feat(design-1): verifier + CLI entrypoint`.

---

### Step 11 — Post-phase doc updates

**Order:** CHANGELOG → PHASE_HISTORY → CONVENTIONS → FEATURE_MAP → CLAUDE.md → SCHEMA.md → REGISTRY.md.

**CHANGELOG.md** — one paragraph at top, prepend pattern:

```markdown
## MYGRATR-DESIGN-1 — Design tokens + primitives + Tier-1 specs + Visual Editing + fidelity guarantees (May 2026)
[Prose paragraph: what shipped. Token extraction from live + audit cross-reference + GSAP runtime instrumentation shim (best-effort — see Tech Debt #20). 22 primitives + Icon foundation primitive in site/src/components/ui/ — hand-built atop @radix-ui where applicable, no shadcn. CVA standardized for variant API. SVG sprite for icons (no lucide-react, no Material Symbols — confirmed unused on CE). Tier-1 inventory locked at N components (use actual count from Step 3a). N complex-component specs at docs/design/components/. Storybook scaffolded IF Path A taken at Step 4 entry, deferred IF Path B (record decision and rationale). v0.dev prompt template + 3 worked examples. ESLint `jsx-no-literals` + complementary AST rule (`mygratr/no-template-literals-in-render`) configured for site/src/components/templates/** with allowedStrings sourced from tools/eslint/ui-strings.json (canonical SoT; site/src/lib/ui-strings.ts committed and CI-diff-checked per F1 v1.5 Option B; no prebuild). Playwright structural-diff config skeleton at tools/qa/. Per-template reference docs for 13 confirmed template types (+ TAXONOMY conditional on §12.6); UNKNOWN dropped from set per audit, resolved in docs/templates/_resolved-classifications.md. Visual Editing wired via single sanityClient with conditional stega gated on SANITY_STEGA_ENABLED env var (VERCEL_ENV='preview' fallback per F7 v1.5), defineLive({ client, serverToken }) takes one client (CMA-C2 correction), Sanity Client + Sanity Fetch + Render-Discipline conventions enforce per-template wiring (no wrapper component). F15 (Tech Debt #14) closed: draft-mode enable AND disable routes are POST-only with normalised origin check (per F5/F8 v1.5). Preview URL is auto-generated Vercel project URL (custom domain deferred to LAUNCH per CMA-I10 Decision A). Both round-trips smoke-tested with behavioral stega assertion (scoped to <h1 data-testid="hero-headline"> per F15 v1.5): A click-to-edit Xs, B (warm CDN) Ys. Draft-fetch smoke assertion proves CDN-bypass invariant. Studio Presentation Tool POST-verification confirmed via DevTools network tab (per F9 v1.5). Capability log scaffolded with first entry. SANITY_API_READ_TOKEN viewer-scope verified (only 403/401 accepted as proof per F4 v1.5). migrations.metadata.content_phase.content_migrations_rows refreshed from stale 38 to actual 42. migrations.status unchanged at content_complete. Brief deviations DEV-1 through DEV-7 + any new ones logged in §15.]
```

**PHASE_HISTORY.md** — full entry under `## MYGRATR-DESIGN-1`. Sections: What Was Built (per-step), Files Created, Files Modified, Patterns Established, Tech Debt Logged (#16, #17 carried forward; new debt if any), Discoveries / Surprises, Final Repo State.

**CONVENTIONS.md** — (1) refresh stale status header from `**Status:** MYGRATR-CONTENT-1B Complete` to `**Status:** MYGRATR-CONTENT-1D-CLEANUP Complete` (per F22 v1.5 — header was stale through CONTENT-1D), then to `**Status:** MYGRATR-DESIGN-1 Complete` after this phase ships. (2) Append the following sections — v2.0 supersession: Storybook Story Pattern is conditional (added IF Path A taken at Step 4, omitted IF Path B). v1.5's count of "8 new sections" becomes 7 OR 8 depending on Step 4 outcome.

1. **Token System Pattern** — every Tailwind class in template files MUST resolve to a token defined in `site/src/app/tokens.css` (Tailwind v4 CSS-first, per DEV-3). Raw hex / px / ms forbidden in project source files (`site/src/**`). Source recorded in TOKENS.md. Vendor CSS in `node_modules` exempt.

2. **Component Specification Pattern** — Tier-1 components have an 8-section spec at `docs/design/components/{name}.md`. Primitives have a row in COMPONENTS.md (single doc, table format per v2.0 Step 2). **Pair-rule (component + story) — Path-A-conditional:** enforced by verifier IF Storybook IN at Step 4.

3. **Storybook Story Pattern — Path-A-conditional (v2.0)** — IF Storybook IN at Step 4 entry, every primitive folder `site/src/components/ui/{name}/` has a `stories.tsx` sibling to `index.tsx`. Stories use mock data, not real Sanity fetches. Argtypes mirror component variant + state surface. **File location for Tier-1 composite components:** `site/src/components/templates/{template-slug}/components/` (template-specific) OR `site/src/components/tier-1/` (cross-template); pair-rule applies in both locations. Primitives stay in `site/src/components/ui/`. The verifier checks pair-rule across all three locations. IF Storybook OUT at Step 4 entry, this pattern is omitted from CONVENTIONS.md and the verifier check is no-op.

4. **Sanity Client Pattern (per CMA-I7; gating revised v1.5 per F7)** — there is one `sanityClient`. Stega is conditionally enabled on it via `isStegaEnabled()` helper that reads `SANITY_STEGA_ENABLED` env var (explicit boolean, primary gate) with `VERCEL_ENV === 'preview'` as fallback when env var is unset (per F7 v1.5 — explicit gate is safer for non-Vercel deployments and gives a future override path). **Never gate stega on multiple combined environment variables** (rejected approach). `sanityClient` in production deployments has stega disabled and ships clean strings (no zero-width markers in HTML). **Verification asymmetry (per F25 v1.5 — downgrade claim):** preview stega correctness is verified behaviorally in DESIGN-1 (verifier #19, scoped to `<h1 data-testid="hero-headline">` per F15); production stega absence is verified via config-shape only in DESIGN-1 (verifier #19b — `sanityClient.config().stega?.enabled !== true`). The symmetric behavioral check against production HTML is **deferred to QA-1 as Tech Debt #18** because no production deployment exists in DESIGN-1. The brief explicitly downgrades this claim: "preview stega behavior is proven in-phase; production stega absence is configuration-asserted in-phase and behaviorally verified in QA-1."

5. **Sanity Fetch Pattern (revised per CMA-C2)** — templates fetch via `sanityFetch` from `@/lib/sanity/live`, never directly via `sanityClient`. `defineLive({ client: sanityClient, serverToken })` takes ONE client; `serverToken` lets the live client fetch draft content when the request is in draft mode. There is no client-switching based on draft mode (correcting v1.0–v1.2 misconception). The Visual Editing click-to-edit flow works because: (a) stega is conditionally enabled on `sanityClient` for preview deployments; (b) `serverToken` allows the live client to fetch drafts; (c) `<VisualEditing />` at layout level reads stega markers from the rendered HTML.

6. **Render-Discipline Pattern (expanded per CMA-I6 — five sub-rules 6a-6e, count corrected v1.5 per F19):**

    **6a. Direct JSX rendering rule.** Sanity-derived strings render directly into JSX. Forbidden: `.replace()`, `.replaceAll()`, regex transforms, `.toString()` re-wrapping, template literal interpolation (`{`${data.title}`}`), JS-side capitalisation transforms. Use CSS `text-transform` instead. Allowed: direct JSX expression, JSX wrapping, conditional rendering, CSS visual transforms.

    **6b. Portable Text serialiser rule.** Custom `@portabletext/react` serialisers must NOT apply JS string transforms (`.trim()`, `.replace()`, template literals, concatenation) to mark/block content. If text processing is unavoidable, import `stegaClean` from `@sanity/client/stega`, apply it, and document inline that click-to-edit is sacrificed for that node. Default Portable Text rendering preserves stega; it's custom serialisers that strip it.

    **6c. Metadata / structured-data rule.** Stega is explicitly OUT OF SCOPE for `<head>` metadata, JSON-LD via `JSON.stringify`, OpenGraph image alt-text composed at build time, and any `<meta>` tag. These are non-interactive surfaces. Document as a known limitation in VISUAL_EDITING.md — Seb cannot click-to-edit meta titles via the rendered preview; Studio editing for these fields is field-panel only.

    **6d. Accessibility-attribute rule.** `alt`, `title`, `aria-label`, `aria-describedby` values from Sanity must be passed directly without JS transforms. If a Sanity image has both `image.alt` (data) and `image.title` (data), pass each directly. Derived alt text (e.g., `alt={imageAsset.alt || derivedFromContext}`) breaks click-to-edit on the alt — use a Sanity field as the source or accept the click-to-edit limitation for that attribute.

    **6e. Derived-label rule.** Human-readable labels derived from slugs, IDs, or computed values are NOT click-to-edit-compatible unless backed by a real Sanity field. Example: a breadcrumb label generated from `slug.current.split('-').join(' ')` cannot be edited via click. Add a dedicated `breadcrumbLabel` field to the schema, or accept the limitation and document it.

7. **Template Location Pattern** — templates live under `site/src/components/templates/{template-slug}/`. Route segments under `site/src/app/` import them. ESLint `jsx-no-literals` rule + complementary AST rule (`mygratr/no-template-literals-in-render`) scope to this path.

8. **Draft-Mode Route Hardening Pattern (renamed from F15-Closed v1.5 per F17; covers both `enable` and `disable` symmetrically).** SCAFFOLD-1 deferred F15 (POST-only + origin check on `/api/draft-mode/disable`) to TEMPLATE-* / pre-launch. DESIGN-1 closes F15 AND the symmetric enable-route gap (per F5 v1.4) in Step 8. **Both** `enable` and `disable` routes export POST only (no GET); use the `originMatches()` URL-parsing helper for origin checks (per F5 v1.5); allowlist includes `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SANITY_STUDIO_URL`, the Vercel preview URL when `VERCEL_ENV === 'preview'`, and localhost when `NODE_ENV === 'development'`. The `enable` route additionally requires a header-based `SANITY_PREVIEW_SECRET` (in env Zod schema per F2 v1.5). Tech Debt #14 (F15) marked CLOSED in CHANGELOG.

**FEATURE_MAP.md** — new section "Design system + Visual Editing infrastructure" listing files, scripts, patterns established.

**CLAUDE.md** — update:
- Current Phase: DESIGN-1 complete; next phase TEMPLATE-* simple.
- Add new file references for `docs/design/`, `docs/templates/`, `docs/CAPABILITY_LOG.md`, `tools/qa/`.
- Architecture rules: add "Templates render Sanity data, never invent it. ESLint `jsx-no-literals` rule + Sanity Fetch Pattern + Render-Discipline Pattern enforce structurally."
- Tech Debt: confirm #16 (`customerStory.companyLogo`), #17 (10 doc types null-literal scan) still open. **Log new debt items from v1.4 + v1.5 audits:**
  - **#18 (Production behavioral stega check, deferred to QA-1 per F4):** symmetric behavioral check against production deployment URL — fetch HTML, assert no zero-width markers. Cannot run in DESIGN-1 (production deployment doesn't exist yet). Run in QA-1 against production preview before LAUNCH.
  - **#19 (Vercel bypass token rotation cadence per F6):** rotate `VERCEL_AUTOMATION_BYPASS_SECRET` post-DESIGN-1 close. Document rotation policy in CONVENTIONS.md (separate from #15 Sanity token rotation).
  - **#20 (GSAP shim v2 hardening per F10/F11/F12 v1.4 + F12/F13/F14 v1.5):** future productisation pass — (a) pre-assignment call buffering: capture method calls into a queue when `window.gsap` is read before `realGsap` is assigned, replay queue on assignment; (b) `ScrollTrigger.create` direct instrumentation: log every `ScrollTrigger.create(...)` config regardless of whether triggered during scripted scroll; add resize and `matchMedia` stimulation; (c) robust serializer: walk values recursively with `WeakSet` cycle detection, normalize `NodeList`/`HTMLCollection` to arrays of element tag/selector summaries, special-case `window` and `document`, emit structured placeholder rather than dropping the call on serialization failure. Best-effort shim is sufficient for CE Tier-1 timing extraction; v2 is for customer-2 productisation when timing extraction is on the critical path.
  - **#21 (Studio GET fallback per F9 v1.5):** if Step 8 smoke test verifies (per items 5a-5e) that Studio's Presentation Tool sends GET (not POST) to `/api/draft-mode/enable`, document the version of `sanity/presentation` and Studio behaviour. Either upgrade Studio or revert enable route to GET-with-secret-in-header (still avoids query-string-secret leak). Open until version upgrade resolves it.
  - **#22 (ESLint AST broader-scope rule per F29 v1.5):** `mygratr/no-template-literals-in-render` covers 4 named patterns; semantic equivalents (outer-scope const, destructured alias, reassigned `let`, helper nested under conditional) are explicit non-goals. If TEMPLATE-* execution surfaces a real evasion attempt that slips past, upgrade to reference-analysis-based rule with cross-scope coverage.
- F15 (Tech Debt #14): mark CLOSED in CHANGELOG — closed in DESIGN-1 Step 8 (POST-only + origin check on draft-mode disable AND enable routes, per v1.3 + v1.4 F5).

**SCHEMA.md** — no changes (no DB migrations).

**REGISTRY.md** — extend:
- "Site Components" — add all 22 primitives + Icon foundation = 23 entries.
- "Phase Design-Doc Artefacts" — add TOKENS.md, COMPONENTS.md, PERFORMANCE_BUDGETS.md, TIER_1_INVENTORY.md, V0_PROMPT_TEMPLATE.md, VISUAL_EDITING.md, CAPABILITY_LOG.md.
- "Scripts" — add `npm run design:verify`, `npm run qa:structural-diff`. Storybook scripts added IF Path A taken at Step 4.
- New "Design Tokens" section listing every named token.

**Capability log** — already created in Step 9; no further update needed.

**State transition:** none. DESIGN-1 ends with `migrations.status = content_complete` (unchanged). Step 11 explicitly notes this in CLAUDE.md so a future planning session doesn't expect a state move.

**Commit point:** `chore(design-1): post-phase doc updates`. Final merge: `feat/design-1` → `main`.

---

## 6. Files created / modified summary

**v2.0 supersessions (apply throughout this section):**
- `site/tailwind.config.ts` — DROPPED per DEV-3 (Tailwind v4 CSS-first; no JS config).
- `site/src/styles/tokens.css` and `site/src/styles/globals.css` — relocated to `site/src/app/tokens.css` and `site/src/app/globals.css` per DEV-3.
- `site/src/components/ui/{20 primitives}.tsx` (flat) — superseded by `site/src/components/ui/{primitive-name}/index.tsx` (folder-per-primitive); 22 primitives + 1 Icon foundation.
- `site/src/components/ui/{N}.stories.tsx` and `.storybook/main.ts`, `.storybook/preview.ts` — Path-A-conditional per Step 4 entry decision. Created IF Storybook IN, omitted IF OUT.
- `docs/design/ICONS.md` — superseded by SVG sprite at `site/src/components/ui/_icons/sprite.svg` + per-row entries in COMPONENTS.md.
- `docs/PERFORMANCE_BUDGETS.md` (NEW per DEV-6) — added to created list.
- `site/src/app/sitemap.ts` and `site/src/app/robots.ts` (refreshed per DEV-7) — added to modified list.

The original v1.5 file lists are preserved below for the historical record.

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
site/src/lib/ui-strings.ts                              (GENERATED from JSON, per CMA-C1)
tools/eslint/ui-strings.json                            (NEW v1.3 — canonical SoT per CMA-C1)
eslint-rules/no-template-literals-in-render.js          (NEW v1.3 — complementary AST rule per CMA-I5)
.storybook/main.ts
.storybook/preview.ts
tests/lint/jsx-no-literals.test.ts                      (1 passing + 5 failing fixtures per CMA-I5)
tools/qa/structural-diff.config.ts
tools/qa/structural-diff.test.ts                          (skeleton)
tools/qa/seo-parity.test.ts                                (skeleton)
tools/qa/verify-design-1.ts
tools/qa/run-verify-design-1.ts
scripts/design/extract-gsap-timings.ts                    (per I4 — best-effort shim, F10/F11/F12 caveats documented)
scripts/design/generate-ui-strings.mjs                     (manual + CI diff-checked per F1 v1.5 Option B; mkdir -p guard per F13 v1.4)
scripts/design/verify-token-scope.mjs                      (NEW v1.3 — viewer-scope probe per CMA-I9; F7 cleanup-on-write-success added v1.4)
audit-output/design-1/gsap-*.json                          (gitignored output of GSAP shim)
```

**REMOVED in v1.4:**
- `scripts/design/seed-hero-headline.ts` — per F3 critical, reverted to manual Studio UI seed (used `SANITY_MIGRATION_WRITE_TOKEN` outside migration phase, blurring token-scoping discipline). Verifier #20a still asserts non-empty `heroHeadline` — manual-step gap closed by verifier, not by script.

**REMOVED from v1.0/v1.1/v1.2 file list:**
- `site/src/components/visual-editing/VisualEditingProvider.tsx` — wrapper component dropped per I8 self-audit (v1.1).
- `eslint-rules/no-marketing-string-literals.js` — custom rule replaced by configured `eslint-plugin-jsx-no-literals` per I3 (v1.1).
- `tests/lint/no-marketing-string-literals.test.ts` — superseded by `tests/lint/jsx-no-literals.test.ts` (v1.1).
- `vercel.json` — bogus alias config dropped per C2 (v1.1); preview URL routing now via Vercel dashboard (auto-generated URL per CMA-I10 in v1.3).
- `previewClient` as a separate exported client — per CMA-C2, replaced with single `sanityClient` + conditional stega.

### Files modified

```
site/src/lib/sanity/client.ts            (single sanityClient with conditional stega gated on VERCEL_ENV; previewClient export removed per CMA-C2)
site/src/lib/sanity/live.ts              (defineLive({ client: sanityClient, serverToken }) — single client + serverToken pattern)
site/src/app/page.tsx                    (renders homePage.heroHeadline via sanityFetch — NO marketing-copy fallback per CMA-Minor-17)
site/src/app/layout.tsx                  (verify VisualEditing conditional render still in place — no functional change expected)
site/src/app/api/draft-mode/enable/route.ts  (F5 hardened v1.4 per CMA-Round-2: POST-only + origin check + header-based secret; GET-with-query-string-secret shape removed)
site/src/app/api/draft-mode/disable/route.ts  (F15 closed v1.3 per CMA-I8 — POST-only + origin check)
studio/sanity.config.ts                  (presentationTool.previewUrl.origin updated to auto-generated Vercel URL)
studio/.env                              (NEW env var: SANITY_STUDIO_PREVIEW_URL_ORIGIN)
eslint.config.mjs (or .eslintrc.cjs per Step 0b lock)  (registers jsx-no-literals via fixupPluginRules + complementary AST rule per CMA-I13)
package.json                             (Storybook scripts, design:verify, qa:structural-diff, test:lint, generate:ui-strings (manual; CI diff-checked per F1 v1.5), verify-token-scope, design:extract-gsap, ci:check-ui-strings-sync; `@eslint/compat` in devDependencies per F30 v1.5)
site/package.json                        (Storybook deps + jsx-no-literals)
package.json (root)                      (Per F30 v1.5: `@eslint/compat` added here, NOT in site/. Reason: root-level `eslint.config.mjs` is what loads `fixupPluginRules`; lint-runtime dependencies belong with the config that executes them. F13's `tsx` requirement REMOVED in v1.5 per F1 Option B — no longer a runtime dependency.)
CHANGELOG.md                             (DESIGN-1 entry; F15 (Tech Debt #14) marked CLOSED per CMA-I8)
PHASE_HISTORY.md
CONVENTIONS.md                           (7 new patterns minimum + 1 IF Path A; per Step 11)
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

- **Stega encoding leaks into production strings.** Mitigation: stega is conditionally enabled on the single `sanityClient` gated by `VERCEL_ENV === 'preview'` (per CMA-I7). Production deployments have `VERCEL_ENV === 'production'` → stega disabled → clean strings. Verifier check #19 asserts behavioral presence in preview; verifier check #19b asserts symmetric absence in production-build context.
- **Import path drift between Sanity / next-sanity versions.** SCAFFOLD-1 already encountered three brief-mandated paths that don't exist in current versions. Step 8a runs a `pkg.exports` probe BEFORE any import is written; resolved paths recorded in CAPABILITY_LOG. Hard Rule #5 codifies the probe-then-import pattern (v1.3 correction).
- **Same-origin + secret on draft-mode route.** Existing per SCAFFOLD-1. Step 8 Sub-step 8a re-asserts; functional change not expected.
- **Preview URL DNS dependency.** Decision A (locked v1.3): use the auto-generated Vercel stable project URL, NOT a `.vercel.app` custom subdomain (Vercel reserves the TLD). No DNS work required pre-cutover. Custom domain preview (e.g. `preview.mygratr.dev`) deferred to LAUNCH.
- **Round-trip latencies (per I6 self-audit — two distinct round-trips):** A click-to-edit ~10s (browser navigation + Studio panel load); B publish-to-preview ~5s (`defineLive` revalidation + Sanity CDN). **Halt rule resolved per CMA-I12:** if within 2× target (A: 10–20s, B: 5–10s), log as risk and continue (QA-1 retests post-template-build). **If exceeds 2× target (A: >20s OR B: >10s), halt per §14 and apply Step 8g diagnostic checklist.**

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

1. `npm run design:verify` exits 0. All verifier assertions pass (numbering retains historical suffixes for audit traceability per F18 v1.5 — `13a`, `13b`, `18a`, `18b`, `19a`, `19b`, `19c`, `19d`, `19e`, `20a`, `20b`; check `18` is a removed tombstone). **Verifier numbering convention:** historical check numbers are preserved for audit traceability; removed checks retain tombstones; inserted checks use suffix letters rather than renumbering prior checks.
2. `npm run build` passes from repo root.
3. `npm run build` passes in `site/`.
4. `npm run build` passes in `studio/`.
5. **Storybook build — Path-A-conditional (v2.0):** IF Storybook IN at Step 4, `npm run build-storybook` passes in `site/` and Storybook is reachable at the locked Vercel preview-storybook URL. IF OUT, this criterion is no-op and `audit-output/design-1/step-4-storybook-decision.txt` records the decision.
6. `docs/design/TIER_1_INVENTORY.md` is locked at its own v1.0 (this is the inventory's first version) with the actual Tier-1 component count.
7. Every primitive (Step 2 set — 22 primitives + Icon foundation) has component folder + index.tsx + COMPONENTS.md row. **Storybook story — Path-A-conditional (v2.0):** required IF IN, omitted IF OUT.
8. Every Tier-1 component (Step 3 locked set) has 8-section spec. **Storybook story — Path-A-conditional (v2.0).**
9. Every confirmed template (13 from §7 table + TAXONOMY conditional on §12.6) has `docs/templates/{slug}/REFERENCE.md` with field-to-UI map AND schema-vs-reality findings sections. `docs/templates/_resolved-classifications.md` exists for UNKNOWN handling.
10. Visual Editing round-trip smoke test on the homePage placeholder passes both round-trips: A click rendered text → Studio focuses correct field within ~10s; B Studio publish → preview reflects within ~5s. Both timings recorded in PHASE_HISTORY.
11. `eslint-plugin-jsx-no-literals` AND `mygratr/no-template-literals-in-render` configured with `allowedStrings` from `tools/eslint/ui-strings.json`, scoped to `site/src/components/templates/**`. Unit test passes — 1 passing fixture has zero errors; 4 failing fixtures (precomputed const, ternary arm, template literal, helper-wrapped literal) plus 1 direct-JSX-text failing fixture each surface ≥1 lint error. Coverage scope per F8: rule catches the named patterns; broader semantic equivalents not guaranteed.
12. `STRUCTURAL_DIFF_SPECS` in `tools/qa/structural-diff.config.ts` has 13 entries (or 14 if TAXONOMY resolved per §12.6) with thresholds matching Decision D2 + Step 7 per-template fidelity targets.
13. `docs/CAPABILITY_LOG.md` exists at repo root with the DESIGN-1 entry covering all sub-section topics from Step 9 (written in retrospective voice per M4). Storybook section is conditional per Step 4 outcome.
14. CHANGELOG.md, PHASE_HISTORY.md, CONVENTIONS.md (7 new patterns minimum — Token System, Component Specification, Sanity Client, Sanity Fetch, Render-Discipline, Template Location, Draft-Mode Route Hardening; +1 Storybook Story Pattern IF Path A taken at Step 4), FEATURE_MAP.md, CLAUDE.md, REGISTRY.md updated per Step 11.
15. `migrations.status === 'content_complete'` (unchanged from phase start). `migrations.metadata.content_phase.content_migrations_rows === 42` (refreshed from stale 38 per Step 0a).
16. `feat/design-1` merged to `main` and pushed to `origin/main`.

---

## 9. Cross-model audit history

**v1.2 audit — `preset:full` — COMPLETED 2026-05-03**

```
Run ID:    2026-05-03T09-05-40-413-j0a8
Cost:      $1.90 (panels) + $0.18 (synthesis) = $2.08
Panels:    5 (security, logic, production, dx, data_integrity)
Models:    Sonnet 4.6, GPT-5.4, Opus 4.6, Grok 4.20, Opus 4.6
Verdict:   FIXES NEEDED — 3 critical / 11 important / 7 minor / 5 dismissed
Synthesis: .audit/output/2026-05-03T09-05-40-413-j0a8/synthesis.md
```

Three criticals all surfaced API-shape misconceptions self-audit could not catch:
- **CMA-C1** ESLint `UI_STRINGS` TS import is unworkable in raw Node.js context — silent lint failure.
- **CMA-C2** `sanityFetch` does NOT auto-route based on draft mode — `defineLive` takes one client + `serverToken`. v1.2's "Sanity Fetch Pattern" was based on the wrong mental model.
- **CMA-C3** `next-sanity/visual-editing` and `next-sanity/live` sub-paths may not exist in v9+ — exports moved to package root.

All three landed in v1.3 with cascading fixes (4 importants collapse into critical fixes — see v1.3 changelog for detail).

**v1.3 audit — `preset:quick` — PLANNED, then LOCK**

```bash
npx tsx .audit/scripts/audit-distribute.ts \
  --brief=docs/briefs/active/MYGRATR-DESIGN-1_BRIEF_v1.3.md \
  --models=preset:quick
```

`preset:quick` rationale: the v1.2 audit's findings were applied surgically with cascading consequences. Re-running `preset:full` is overkill — the structural patterns are now correct. `preset:quick` is cheap insurance ($0.15) to catch regressions introduced by the v1.3 edits before LOCK. If `preset:quick` returns clean, lock at v1.3 and ship to Claude Code. If `preset:quick` returns ≥3 FIX NOW items touching structural decisions, escalate back to `preset:full`.

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

> You are reviewing the use of `eslint-plugin-jsx-no-literals` (configured with `allowedStrings` derived from `tools/eslint/ui-strings.json` — JSON SoT, with `site/src/lib/ui-strings.ts` regenerated manually and committed; CI enforces sync via `git diff --exit-code` per F1 v1.5) scoped to `site/src/components/templates/**`. Check:
> 1. False positive rate: what real template patterns will trip it that shouldn't?
> 2. False negative rate: what marketing-string patterns slip through (template literals with interpolation, computed strings, conditional rendering of literal arms)?
> 3. Is the file-path scoping (`site/src/components/templates/**`) sufficient, or does it under-cover (e.g., shared layout files that contain marketing copy, route segments that render content directly)?
> 4. Does the JSON SoT + manual generation + CI diff-check pattern (`tools/eslint/ui-strings.json` → `scripts/design/generate-ui-strings.mjs` → committed `site/src/lib/ui-strings.ts` → CI `git diff --exit-code` enforces sync; per F1 v1.5 Option B) close the gap that v1.2's `Object.values(UI_STRINGS)` TS-import-from-eslint.config.mjs left open? Are the two artefacts (JSON + committed TS) provably in sync at CI time? Verifier check #13a precision per F11.
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
| Primitive component set (22 + Icon foundation) (Step 2) | 80% reusable (form/overlay/state primitives are universal; brand-tuned variants are CE-specific) | 2 days per customer to retune |
| Storybook scaffold + story pattern (Step 4) — Path-A-conditional | 100% reusable IF customer needs Storybook (external dev handoff) | 1 hour per customer IF Path A taken; 0 effort IF Path B |
| v0.dev prompt template structure (Step 5) | 100% reusable | 0 effort per customer; the template is the artefact |
| Custom ESLint rule + UI_STRINGS pattern (Step 6) | 100% reusable | 0 effort per customer |
| Playwright structural-diff config (Step 6) | Structure 100%, per-template values customer-specific | 1 hour per customer |
| Per-template REFERENCE.md template (Step 7) | 100% reusable | template-by-template work is the same per customer |
| Visual Editing config (single client + conditional stega + serverToken + Sanity Fetch + Render-Discipline patterns) (Step 8) | 100% reusable | 0 effort per customer; pkg.exports probe locks correct import paths per customer's installed `next-sanity` version |
| ESLint UI_STRINGS JSON SoT + generation script (Step 6, new in v1.3) | 100% reusable | 0 effort per customer; values-only customisation via JSON edit |
| Pre-Step `pkg.exports` probe pattern (Step 8a, new in v1.3) | 100% reusable | 0 effort per customer; protects against import-path drift across `next-sanity` versions |
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

1. **Storybook hosting — Path-A-conditional (v2.0):** IF Storybook IN at Step 4 entry, locked decision is Vercel separate project at `preview-storybook-mygratr-cloudemployee.vercel.app`. Confirm Vercel team supports adding a third project on current plan (main, storybook, plus any Beem/other shared with this account). IF Storybook OUT, this question is moot.
2. **Icon set source — RESOLVED via pre-Step-2 probe:** CE uses neither Lucide nor Heroicons nor a recognized library. 78 distinct SVGs identified across 312 pages, but most are vendor-injected (YouTube ~414+ uses, Hotjar/Clara chat 924 uses). Real CE-brand icon count after vendor filter: ~10-20. Decision: **extract** — sprite-based at `site/src/components/ui/_icons/sprite.svg`, generated by Step 2.1 sub-task. No CDN dependency, no `lucide-react`, no Material Symbols (zero rendered usage on CE).
3. **GSAP license:** GSAP 3.12.5 was used on CE's live site under GSAP's Standard No Charge license (which covers most public sites including commercial). The migration triggers a fresh license evaluation, but **Standard license is sufficient for CE's use case** unless a Tier-1 component (per Step 3 audit) requires premium plugins (DrawSVG, MorphSVG, ScrollSmoother, SplitText, MotionPath, Inertia). If Step 3 identifies a premium-plugin dependency, Club GreenSock at ~$99/year covers it. Alternative: rebuild that timeline in Framer Motion or CSS. Surface to Jake when Step 3 audit completes — not a pre-Step blocker.
4. **Vercel deployment protection on Storybook — Path-A-conditional (v2.0):** IF Storybook IN, confirm Jake wants password-protected Storybook (default) vs. publicly accessible. Default is protected; public makes review easier but exposes work-in-progress visuals. IF OUT, moot.
5. **ESLint rule strictness for short alphanumerics:** the off-the-shelf `jsx-no-literals` plugin will flag strings like "v10", "Q1 '26", "$99" that are 3+ char alphanumerics in template files. Recommend: add these as needed to `UI_STRINGS` (or a sibling enum like `UI_PATTERNS`) rather than relaxing the rule. The point of structural enforcement is that exceptions go through a reviewable allow-list, not a fuzzy threshold. Confirm approach with Jake.
6. **TAXONOMY template mapping (per I1 self-audit):** TAXONOMY appears in CE_SITE_TRUTH.md §1's template-type enum but has no clean mapping to a Sanity document type or singleton in MYGRATR_SCHEMA_DESIGN_DECISIONS.md. Likely candidates: `blogCategory` (the `/[category-slug]/[post-slug]` pattern in §3.3), `tag` (referenced from blogPost / compareBlog / download), or a hub singleton. **Pre-Step-7 question:** which URL pattern on the live CE site does TAXONOMY actually correspond to, and which Sanity type renders it? If unanswerable from project knowledge, brief deviation pass against the live site before TAXONOMY's REFERENCE.md is written. Step 7 verifier check 16 is conditional on this resolution.
7. **Vercel preview routing — production-branch alias vs separate project (per C2 self-audit, refined v1.3 per CMA-I10 Decision A):** Sub-step 8b locks the auto-generated Vercel stable project URL as the preview URL (NOT `preview-mygratr-cloudemployee.vercel.app` — Vercel reserves the `.vercel.app` TLD). Question: when the site goes live post-LAUNCH and `main`'s deployment becomes the actual live `cloudemployee.io`, do we want the preview subdomain to *still* point at production (preview = live), or to a separate `preview` branch? Recommend: separate preview branch post-LAUNCH; until then, production-branch alias is fine because main is not yet pointing at the customer-facing domain. Confirm before Step 8.
8. **Vercel plan tier (per I7 self-audit):** is the Vercel team running Mygratr's projects on Hobby or Pro? Hobby has commercial-use restrictions that may apply to a paying-customer migration site. Pro has no such restriction and supports unlimited projects. If currently Hobby, evaluate whether the CE migration needs Pro before launch. This is a tracker question, not a DESIGN-1 blocker — surface for Jake's awareness.

---

## 13. Estimated runtime breakdown (rebaselined per I2 self-audit)

| Step | Effort | Notes |
|---|---|---|
| 0 — Pre-flight + branch + metadata refresh + ESLint config check | 0.5 day | Includes I5 metadata refresh, M7 ESLint config lock |
| 1 — Tokens + Tailwind config + GSAP instrumentation | 1.5 days | Live extraction is the load-bearing part; GSAP shim adds ~3 hours |
| 2 — Primitive components (+ stories conditional on Step 4 path) | 2.5 days | 22 primitives + Icon foundation. Halt-and-eyeball cadence (7 first-of-kind halts + 5 batch eyeballs) absorbs spec time. Stories deferred from Step 2 to Step 4 path A per v2.0. |
| 3 — Tier-1 audit + complex specs | 4.5 days | Half-day audit + 5–10 specs @ 0.5–1 day each (HOME hero is the learning piece per Roadmap §11) |
| 4 — Storybook decision + conditional scaffold | 0.1–1.5 days | Path A (Storybook IN): ~1.5 days install + config + Vercel deploy + protection + tokens.css imported into preview + write stories (now writing stories here, not in Step 2). Path B (Storybook OUT): ~5 minutes to record decision in capability log. |
| 5 — v0.dev prompt template | 0.5 day | Template + 3 worked examples |
| 6 — Fidelity guarantee mechanisms | 1 day | Lint config + test + structural-diff skeleton + SEO skeleton |
| 7 — Per-template visual references | 3 days | 13 confirmed (+ 1 conditional) templates @ 1.5–2 hours each (8–10 screenshots × 3 breakpoints + annotation + field-to-UI map + schema-vs-reality reconciliation per C1) |
| 8 — Visual Editing infrastructure | 2 days | Pkg.exports probe + stega config + F15 closure + smoke-test fixture + Studio config + Vercel domain + operator doc + actual smoke test with timing + behavioral stega assertion (rebaselined from 1.5 in v1.2 per CMA-C2/C3/I8) |
| 9 — Capability log scaffold + entry | 0.5 day | Consolidates running drafts from Steps 1–8 |
| 10 — Verifier | 0.5 day | All assertions + CLI (numbering retains audit-history suffixes per F18) |
| 11 — Post-phase docs | 1 day | CHANGELOG + PHASE_HISTORY + CONVENTIONS + FEATURE_MAP + CLAUDE.md + REGISTRY.md |

**Total: ~20.5 build days + 1.5 recovery days = ~22 working days = ~3 weeks of focused work.** Within Jake-wide tolerance. **Rebaselined progressively:** v1.0 claimed 14 days (too optimistic for dev-light posture); v1.1 corrected to 19.5 build / 21 total; v1.3 adds 0.5 day on Step 8 for CMA-mandated probe + F15 closure + behavioral assertion work; v1.5 corrects an arithmetic drift caught in final review (table sums to 20.5, not 20), bringing total to ~22 working days.

If Jake wants to compress: drop UNKNOWN handling work (already done in v1.1), defer one Tier-1 component spec to TEMPLATE-* learning (caveat: this gives up the spec contract for that component), or trim the Tier-2 primitive set from 20 to 15 (drop Modal+Dialog redundancy, drop FileUpload until needed). None of these are recommended without explicit Jake call.

**Recovery days (Roadmap §5.7):** half-day after Step 3, half-day after Step 7, plus 0.5 day of slack. Counted in the 22-day total (1.5 of which is recovery/slack on top of the 20.5-day build sum).

---

## 14. Halt-and-escalate triggers

If any of the following occur during execution, halt and surface to Jake before continuing:

1. Pre-flight check failure in Step 0.
2. Live-site token extraction yields values that contradict CE_SITE_TRUTH.md (recent design changes on live site mean audit data is stale).
3. Step 3 audit yields >10 Tier-1 components — time budget needs re-baselining.
4. Visual Editing smoke test in Step 8: round-trip A (click-to-edit) exceeds 20s OR round-trip B (publish-to-preview, **warm CDN — second publish per F24 v1.5**) exceeds 10s. **§14 supersedes §7C** (per CMA-I12 resolution): if within 2× target log as risk and continue per §7C; if exceeds 2× target halt per §14 and apply Step 8g diagnostic checklist. Halt threshold applies to warm measurement only — first publish (cold CDN) is recorded but not gating.
5. ESLint rule + UI_STRINGS configuration cannot achieve clean separation (false-positive rate too high to ship; UI_STRINGS would need to grow to >50 entries to suppress real-template noise).
6. Tier-1 complex-component spec discovers that Sanity schema is missing a field needed by the live UI — schema change is out of scope for DESIGN-1; surface for STATIC-1 or a SCHEMA-2 mini-phase.
7. Vercel project quota / TOS issue blocks adding the Storybook project (per §12.8 Vercel plan tier question). **Path-A-conditional (v2.0):** triggers only IF Storybook IN at Step 4 entry.
8. Sanity preview client stega config disabled by package version regression — investigate before committing the broken config.
9. Any failure of Tech Debt #16 (`customerStory.companyLogo`) to render gracefully under template fallback — surface for the recommended schema-side fix.
10. Schema-vs-reality reconciliation pass in Step 7 surfaces a Tech-Debt-#16-shaped issue on a non-trivial field set across multiple doc types — STATIC-1 / SCHEMA-2 mini-phase scoping conversation needed.

---

## 15. Deviations log + brief lifecycle

### Deviations (DEV-N) — recorded during execution

These are the deviations from the brief that surfaced during Step 0, Step 1, and the DEV-6/7 cycle. New deviations appended as Step 2+ surface them.

- **DEV-1 (Step 0 sub-step 0a, pre-flight #2):** Pre-flight check #2 (`npm run build` in repo root) redefined to `npx tsc --noEmit` because root has no build target. Logged so customer-2's planning Claude doesn't repeat the assumption.

- **DEV-2 (Step 0 sub-step 0d, Storybook compat probe):** Brief specified Storybook 9.x. Throwaway probe found Storybook 10.x + Next.js 16.2.4 + React 19.2.4 builds successfully. The 9.x → 10.x supersession is automatic via `npx storybook@latest init`. Customer-2 reuse note: install workaround required (Storybook 10 init scaffolds Header.jsx without declaring `prop-types` dep; install `prop-types` to unblock).

- **DEV-3 (Step 1, Tailwind v4 + Next.js 16 file structure):** Brief assumed `site/tailwind.config.ts` + `site/src/styles/tokens.css` + `site/src/styles/globals.css` file structure. Tailwind v4 is CSS-first (no JS config); Next.js 16 prefers `globals.css` co-located in `app/`. Resolved to `site/src/app/tokens.css` (NEW) + `site/src/app/globals.css` (rewrite). `tailwind.config.ts` DROPPED entirely. Brief intent preserved: single source of truth for tokens, CSS-var consumption layer, Tailwind classes resolve from named tokens.

- **DEV-4 (Step 1 HALT 3 cycle, Inter → Poppins font swap):** SCAFFOLD-1 loaded Inter via `next/font/google` based on a `WebFont.load` reference in `audit-output/pages/home/content.json`. Step 1 Diagnostic 1 source-CSS probe + computed-style scan across 5 pages showed every rendered element resolves to `"Poppins", Arial, sans-serif` — Inter was loaded but never applied (matching the document.fonts-loaded-but-unused observation). Swapped to Poppins weights 400/500/600 (only observed weights), `variable: '--font-poppins'`. Tokens reference `var(--font-poppins)` (next/font manages the full fallback stack).

- **DEV-5 (Step 1 HALT 4 cycle, Tailwind v4 namespace correction + dual-consumer motion):** Initial token draft used semantic prefixes (`--font-size-*`, `--font-family-*`, `--line-height-*`, `--motion-easing-*`, `--space-N`) that did NOT generate Tailwind utilities. Tailwind v4 requires specific namespaces per property type: colors → `--color-*`, font-size → `--text-*` (NOT `--font-size-*`), font-family → `--font-*`, font-weight → `--font-weight-*`, line-height → `--leading-*`, duration → `--duration-*`, timing-function → `--ease-*`, spacing → `--spacing` (single scalar; utilities use multiplier), radius → `--radius-*`, shadow → `--shadow-*`, breakpoint → `--breakpoint-*`. Customer-2 onboarding MUST run a multi-namespace probe (not just color aliasing) before locking tokens. Dual-consumer pattern locked: `--motion-*` group is GSAP source-of-truth; `--duration-*` and `--ease-*` are Tailwind utility aliases via `var()`. Single source, two consumers, no drift.

- **DEV-6 (Step 6 sub-step 6d, pre-Step-2 perf budgets doc):** Pre-flight third-party weight measurement revealed CE's current global third-party script weight is 404.37 KB gzipped — 64% over the brief's assumed 250 KB target. Investigation surfaced Vector Tag (58.20 KB) as confirmed business-critical lead-gen instrument piped to Slack `#icp-vector` channel; retained. **Locked target: 320 KB gzipped** (Option A). Step 8 wiring frees ~92 KB by bundling GSAP family + Swiper via npm imports and dropping Finsweet. Post-bundle baseline ~312 KB + 8 KB headroom = 320 KB. Improvement narrative: 21% reduction (404 → 320). QA-1 verifies post-cutover. Customer-2 lesson: never lock perf budget without measuring current state AND classifying each script by business function. Heavy ≠ removable; classification is a business decision, not a technical one.

- **DEV-7 (Step 6 sub-step 6e, pre-Step-2 sitemap + robots refresh):** Both `site/src/app/sitemap.ts` and `site/src/app/robots.ts` existed from SCAFFOLD-1 with stub content. `sitemap.ts` updated with `URL_BUILDERS` extension-point pattern (each TEMPLATE-* phase adds its document type's URL function + filters into the query). Stale `TODO(CONTENT-1)` retargeted to TEMPLATE-*. Static routes (home + UK home) preserved unchanged. Full Sanity-fetch query left as commented pseudocode pending first TEMPLATE-* wiring. `robots.ts` extended with `VERCEL_ENV !== 'production'` no-index gate (preview deployments now disallow all crawlers; production rules unchanged).

### Brief lifecycle

- **v1.0 (2026-05-03):** Initial draft. Self-audit pass produced 4 critical / 9 important / 7 minor findings.
- **v1.1 (2026-05-03):** Self-audit findings applied surgically. No structural reflow.
- **v1.2 (2026-05-03):** Second self-audit — caught residual v1.0 fragments. 4 critical / 5 important / 3 minor cleanup.
- **v1.3 (2026-05-03):** First cross-model audit (`preset:full`) findings applied. 3 critical / 11 important / 7 minor / 5 dismissed. All criticals fixed with cascading consequences.
- **v1.4 (2026-05-03):** Second cross-model audit (5 diverse-provider panels) findings applied. 3 critical / 11 important / 6 minor / 7 dismissed.
- **v1.5 (2026-05-03):** Third cross-model audit applied. 3 critical / 18 important / 9 minor / 4 dismissed. All 30 findings applied. Brief locked, executed against. Step 0 → DEV-6/7 cycle closed under v1.5.
- **v2.0 (2026-05-05 — current):** Structural rewrite reflecting lived execution. Step 0, Step 1, DEV-6, DEV-7 all reflected as closed with their actual outcomes. Step 2 re-locked from pre-Step-2 planning thread (shadcn dropped, Storybook deferred to Step 4 conditional, Material Symbols dropped, CVA standardized, no-className-variants rule, GSAP boundary explicit, SVG sprite icons). Step 4 rewritten as conditional Storybook scaffold. Cross-cutting decisions propagated through Steps 4, 6, 9, 10, 11. **No cross-model audit run on v2.0** — changes are structural reflection of lived execution, not new architecture; diminishing returns established at v1.5 (3 audits, 60+ findings).
- Future deviations during execution → appended as DEV-N entries to this section, surfaced in PHASE_HISTORY at phase close.

After phase close, this brief moves from `docs/briefs/active/` to `docs/briefs/archive/`.

---

*End of MYGRATR-DESIGN-1_BRIEF_v2.0.md*

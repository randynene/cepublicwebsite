# MYGRATR-DESIGN-1 Context-Doc Catch-Up Cycle — Brief A drift + Brief B Step 6 (HALT 1) post-phase

| Field | Value |
|---|---|
| Phase ID | MYGRATR-DESIGN-1 (meta-cycle — no step number) |
| Brief version | v1.0 |
| Status | LOCKED for execution |
| Trigger | Commit `5726e38` (Brief B Step 6 close, HALT 1) needs post-phase docs; Brief A close (`c4fd58a`) left REGISTRY/FEATURE_MAP/CONVENTIONS.md status untouched |
| Predecessor | `5726e38` feat(design-1): brief B step 6 — UI_STRINGS lint rule + canonical SoT files |
| Successor | Brief B Step 8 execution (Visual Editing wiring; HALTs 2 + 3) |
| Operating posture | Auto-mode; docs-only; no code/config edits |
| Estimated runtime | ~20-30 min wall-time |
| Halts | 1 (after surface-diff of all 6 files; one go/no-go before commit) |
| Commit count | 1 (chore-tagged) |

---

## Why this exists

Two parallel debts to settle in one cycle:

1. **Brief A drift** — Brief A's consolidation commit (`c4fd58a`) updated `CHANGELOG.md` + `PHASE_HISTORY.md` + `CLAUDE.md` per the post-phase checklist's first 3 items, but **stopped there**. `CONVENTIONS.md` status line still reads "Step 3 milestone." `FEATURE_MAP.md` ends at "Tier-1 Component Specs (Step 3 milestone)" — Brief A's Storybook scaffold + v0.dev prompt template authoring landed zero feature entries. `REGISTRY.md` has **no** entries for Storybook (`.storybook/`), 30 stories, `tier-1/` component dir, `docs/V0_PROMPT_TEMPLATE.md`, worked examples, or `docs/design/storybook-deploy.md` deploy runbook.

2. **Brief B Step 6 (HALT 1) close** — `5726e38` shipped UI_STRINGS lint rule + canonical SoT files + 13-file diff. CONVENTIONS.md already got its `UI_STRINGS Rule (post-DESIGN-1 Brief B)` section in that commit. But the standing post-phase checklist (`CHANGELOG.md` → `PHASE_HISTORY.md` → `CLAUDE.md` → `FEATURE_MAP.md` → `REGISTRY.md`) hasn't run yet.

These collapse cleanly into one docs-only chore commit. Capability log consolidation is **explicitly out of scope** here — HALT 3 (Brief B close) does that. The gitignored `audit-output/design-1/capability-log-draft.md` stays as-is.

---

## 0. Read first (in order)

1. **This brief, in full.**
2. **`CLAUDE.md`** — note the Current Phase block at lines 13-20 and the "Design system state" subsection (~line 60). Both need updates.
3. **Commit body of `5726e38`**: `git show 5726e38` — the Step 6 commit message is the authoritative narrative source for the new CHANGELOG/PHASE_HISTORY entry. Pull facts from there, don't invent.
4. **`CHANGELOG.md` lines 1-55** (Brief A entry) — pattern-match the new Brief B Step 6 entry to the same shape (≈50 lines, dense paragraph, leads with milestone framing + commit list, ends with "Brief X step Y drafting begins next session" or equivalent forward pointer).
5. **`PHASE_HISTORY.md` lines 1-195** (Brief A entry) — pattern-match the new Brief B Step 6 entry to the same shape (Phase context / Commits closed / What Was Built / Files Created / Files Modified / HALTs Landed / Patterns Established / Tech Debt Logged / Discoveries / Surprises / Final Repo State).
6. **`docs/FEATURE_MAP.md` lines 568-709** (Step 2 + Step 3 entries) — pattern-match new feature entries to the same shape (Description / Files created / Files modified / Patterns established / Reference docs / Phase footer).
7. **`docs/context/REGISTRY.md`** — note the section headings (Phase Design-Doc Artefacts / Site Components / Site Routes / Scripts / Lib Files / npm Scripts). Brief A + B Step 6 additions slot into 4-5 of these.
8. **`CONVENTIONS.md` line 7** — the stale status line.

---

## 1. Scope (deliverable)

One commit, chore-tagged (docs-only, no logic changes), touching exactly **6 files**:

| File | Change type | Driver |
|---|---|---|
| `CONVENTIONS.md` | Status line bump (line 7) | Brief A drift + Brief B Step 6 close — bump from "Step 3 milestone" to "Brief B Step 6 close (HALT 1); Steps 7, 8, 9, 10, 11 pending" |
| `docs/FEATURE_MAP.md` | Append 3 new feature sections | Brief A: "Storybook Scaffold (Step 4 milestone)" + "v0.dev Prompt Template (Step 5 milestone)"; Brief B: "UI_STRINGS Lint Rule (Step 6 milestone)" |
| `docs/context/REGISTRY.md` | Multiple additions across existing sections | Brief A + Brief B Step 6 catch-up (see §3 below for line-item list) |
| `CHANGELOG.md` | One new entry at top | Brief B Step 6 (HALT 1) close paragraph |
| `PHASE_HISTORY.md` | One new entry at top | Brief B Step 6 (HALT 1) full record |
| `CLAUDE.md` | Current Phase block + Design system state subsection | Step 6 close reflected; "Next: Brief B Step 8" forward pointer |

**Explicit non-scope:**
- `docs/CAPABILITY_LOG.md` — untouched. Brief B's capability IP consolidates at HALT 3, not HALT 1. Capability-log-draft stays gitignored.
- `docs/SCHEMA.md` — no migrations. Untouched.
- Any code or config file — docs-only commit. If a code change is identified mid-execution, STOP and flag.

---

## 2. Execution sequence

Strict sequential order; each step ends with the user surfacing the diff before moving on. The HALT is **once at the end** before the commit lands (not per-file) — but each file write is its own surface gate so the user can spot drift early.

### Step 2.1 — `CONVENTIONS.md` status line bump

Surgical 1-line edit at line 7. Old: `**Status:** MYGRATR-DESIGN-1 Step 3 milestone (DESIGN-1 in progress; Steps 4–11 pending)`. New: `**Status:** MYGRATR-DESIGN-1 Brief B Step 6 close (HALT 1); Steps 7, 8, 9, 10, 11 pending`.

Surface diff. Move on if clean.

### Step 2.2 — `docs/FEATURE_MAP.md` — 3 new sections appended after line 709

Each section follows the established shape from §568-709. Required content per section:

**A. "Storybook Scaffold (Step 4 milestone)"**
- Description: 30 stories on disk (25 primitive Pair-rule per folder + 5 Tier-1 scaffold-stage); Storybook 10.3.6 (`@storybook/nextjs` webpack5 force per Brief A v1.2 D2 lock); live on Vercel separate project with Standard Protection.
- Files (created): `site/.storybook/main.ts`, `site/.storybook/preview.tsx`, `site/src/components/ui/{primitive}/stories.tsx` (×25), `site/src/components/tier-1/{slug}.stories.tsx` (×5), `docs/design/storybook-deploy.md` (customer-2 runbook).
- Files (modified): `site/.gitignore`, `site/eslint.config.mjs`, `site/package.json`, `site/package-lock.json`, `CONVENTIONS.md` (Storybook Story Pattern section).
- Vercel project: `https://mygratr-cloud-employee-storybook.vercel.app` — Framework Preset `Other` (NOT Next.js); Root Directory `site`; Build Command `npm run build-storybook`; Output Directory `storybook-static`; Standard Deployment Protection.
- Patterns established (CONVENTIONS.md): "Storybook Story Pattern" section — Pair-rule, primitive + Tier-1 story shapes, mock-data discipline, render-only over args, env-vars gotcha, mechanical Pair-rule check.
- HALT 1 env-vars bug + fix: `@storybook/nextjs` does NOT auto-pass-through `NEXT_PUBLIC_*` env vars to webpack DefinePlugin — explicit `env: (config) => ({...config, NEXT_PUBLIC_X: ...})` config required.
- Reference docs: `docs/design/storybook-deploy.md`, `docs/CAPABILITY_LOG.md` (13 Storybook setup patterns).
- Phase: MYGRATR-DESIGN-1 (Step 4 milestone — Brief A close; Steps 5+ pending at time of Step 4).

**B. "v0.dev Prompt Template (Step 5 milestone)"**
- Description: 6-section canonical template (Design system constraints / Primitive components available / Visual reference / Sanity data shape / Constraints / Output format); Sections 1, 2, 5, 6 paste-as-is per template; Sections 3, 4 per-template fill-in. Storybook URL cross-referenced in Section 2.
- Files (created): `docs/V0_PROMPT_TEMPLATE.md` (406 lines), `docs/templates/_examples/v0-prompt-blog.md` (168 lines, blogPost detail), `docs/templates/_examples/v0-prompt-team-member.md` (166 lines, teamMember detail), `docs/templates/_examples/v0-prompt-review.md` (224 lines, review listing).
- REVIEW example carries forward both schema-vs-reality findings from `docs/design/components/testimonial-swiper-global.md` per Brief A v1.2 §5.2 mandate.
- Patterns established (CAPABILITY_LOG.md): 6 productisation IP patterns — 6-section paste-as-is/fill-in split; self-explaining placeholder discipline; worked-example-as-clarification; schema-vs-reality carry-forward; Storybook URL as cross-reference; per-doc-type variation surfaced via examples.
- Reference docs: `docs/V0_PROMPT_TEMPLATE.md`, `docs/templates/_examples/`, `docs/CAPABILITY_LOG.md`.
- Phase: MYGRATR-DESIGN-1 (Step 5 milestone — Brief A close; Steps 6+ pending).

**C. "UI_STRINGS Lint Rule + Canonical SoT (Step 6 milestone)"**
- Description: Two-rule chrome-string discipline. Upstream `react/jsx-no-literals` (from `eslint-plugin-react@7.37.5`) with `noStrings: true` + `allowedStrings` + `ignoreProps` covers most JSX text. Project-local `local/no-conditional-strings-in-jsx` covers the upstream `ConditionalExpression` branch gap surfaced in §6.4. 9 exemption file patterns (stories Pair-rule + flat-file, tests, demo route, Next.js framework templates, vendor SDK init, generated ui-strings.ts itself).
- Files (created):
  - `tools/eslint/ui-strings.json` (canonical SoT — 14 keys with `_meta` provenance block)
  - `tools/eslint/rules/no-conditional-strings-in-jsx.js` (~65 lines)
  - `tools/eslint/plugin-local.js` (plugin wrapper, `local/` namespace)
  - `tools/eslint/__tests__/ui-strings.test.mjs` (8-fixture Linter.verify harness)
  - `scripts/design/generate-ui-strings.mjs` (byte-idempotent JSON → TS generator)
  - `scripts/design/probe-ui-strings-reality.mjs` (one-shot seed-list provenance script — archived after use)
  - `site/src/lib/ui-strings.ts` (generated, do-not-edit; 21 lines)
- Files (modified): `package.json` (+`generate-ui-strings` script), `site/eslint.config.mjs` (+62 lines: rule registration, exemption globs, plugin import), `site/src/app/page.tsx` + `site/src/app/uk/page.tsx` (4 SCAFFOLD-1 comment-disables with TEMPLATE-HOME reference), `site/src/components/ui/hubspot-form-embed/index.tsx` (3 strings migrated to UI_STRINGS — `form.loading` + `form.error.loadFailed` with placeholder-as-split-template pattern), `CONVENTIONS.md` (+212 lines: "UI_STRINGS Rule (post-DESIGN-1 Brief B)" section).
- Patterns established (CONVENTIONS.md): UI_STRINGS Rule section — both rules, 5-path violation triage, exemption table, naming convention table, test infrastructure, generator discipline. (Capability IP consolidation deferred to HALT 3.)
- Brief-vs-Reality findings logged to gitignored capability-log-draft.md: BvR #23 (§6.1.1 tsc CLI shape), #24 (D3 exemption glob mismatch with Brief A Pair-rule), #25 (storybook-static/** missing from globalIgnores), #26 (ESLint 9 RuleTester plugin-namespace silent failure). 3 productisation IP patterns staged for HALT 3 consolidation: placeholder-as-split-template, two-gate ESLint rule verification, narrow custom-rule supplement.
- Lint state at HALT 1 close: 25 problems (9 errors + 16 warnings), all pre-existing rules outside Brief B scope. Zero `react/jsx-no-literals` or `local/no-conditional-strings-in-jsx` violations. `tsc --noEmit` clean.
- Reference docs: `tools/eslint/ui-strings.json`, `CONVENTIONS.md` §UI_STRINGS Rule, `docs/briefs/active/MYGRATR-DESIGN-1-BRIEF-B_v1.3.md` §6.
- Phase: MYGRATR-DESIGN-1 (Step 6 milestone — Brief B HALT 1 close; Steps 7, 8, 9, 10, 11 pending).

Surface diff. Move on.

### Step 2.3 — `docs/context/REGISTRY.md` — additions across sections

**Phase Design-Doc Artefacts table (after line 24):**
- `docs/V0_PROMPT_TEMPLATE.md` | DESIGN-1 Step 5 | Canonical v0.dev prompt template — 6-section format; Sections 1/2/5/6 paste-as-is, 3/4 per-template fill-in
- `docs/templates/_examples/v0-prompt-{blog,team-member,review}.md` | DESIGN-1 Step 5 | 3 worked examples covering detail-by-slug vs listing-no-slug; REVIEW carries both testimonial-swiper schema-vs-reality findings forward
- `docs/design/storybook-deploy.md` | DESIGN-1 Step 4 | Customer-2 Vercel deploy runbook for Storybook (Framework Preset `Other`, env-vars requirement, Standard Protection)
- `tools/eslint/ui-strings.json` | DESIGN-1 Step 6 | Canonical chrome-string SoT (14 keys, `_meta` provenance); generator input for `site/src/lib/ui-strings.ts`
- `docs/briefs/active/MYGRATR-DESIGN-1-BRIEF-A_v1.2.md` | DESIGN-1 Brief A | Brief A phase brief (Steps 4 + 5, closed)
- `docs/briefs/active/MYGRATR-DESIGN-1-BRIEF-B_v1.3.md` | DESIGN-1 Brief B | Brief B phase brief (Steps 6 + 8, Step 6 closed at HALT 1)

**New "DESIGN-1 Step 4 — Storybook stories" subsection under "Site Components" (after line 209):**

Add 30-row table (25 primitive + 5 Tier-1) listing `Story | Path | Category | Phase`. Compress to ranges if natural — but enumerate each Tier-1 by full path since they live outside `ui/`. Note Pair-rule mechanical check command.

**Site Routes table (line 213) — no changes** (Brief A + B Step 6 added no new routes; demo route already there).

**API Routes table (line 224) — no changes** (Step 6 didn't touch routes; Step 8 will).

**Scripts table (line 230) — add 2 rows:**
- `scripts/design/generate-ui-strings.mjs` | Step 6 generator — byte-idempotent JSON (`tools/eslint/ui-strings.json`) → TS (`site/src/lib/ui-strings.ts`) | `site/src/lib/ui-strings.ts` | DESIGN-1 Step 6
- `scripts/design/probe-ui-strings-reality.mjs` | Step 6 §6.0a probe — one-shot seed-list provenance script (archived after use) | `audit-output/design-1/ui-strings-reality.json` | DESIGN-1 Step 6

**Lib Files table (line 330) — add 1 row:**
- `site/src/lib/ui-strings.ts` | UI_STRINGS const (14 keys) | Generated chrome-strings map (do-not-edit; regenerate via `npm run generate-ui-strings`); enforced by `react/jsx-no-literals` + `local/no-conditional-strings-in-jsx` | DESIGN-1 Step 6

**npm Scripts table (line 357) — add 1 row:**
- `npm run generate-ui-strings` | Regenerate `site/src/lib/ui-strings.ts` from `tools/eslint/ui-strings.json` (byte-idempotent)

**New "ESLint Custom Tooling (`tools/eslint/`)" section** — add at end of REGISTRY.md or between npm Scripts and Audit Output Files:

| File | Purpose | Phase |
|---|---|---|
| `tools/eslint/ui-strings.json` | Canonical SoT — 14 chrome-string keys + `_meta` provenance block | DESIGN-1 Step 6 |
| `tools/eslint/plugin-local.js` | Plugin wrapper — exposes project-local rules under `local/` namespace | DESIGN-1 Step 6 |
| `tools/eslint/rules/no-conditional-strings-in-jsx.js` | Project-local rule — covers upstream `ConditionalExpression` branch gap left by `react/jsx-no-literals` | DESIGN-1 Step 6 |
| `tools/eslint/__tests__/ui-strings.test.mjs` | 8-fixture Linter.verify AST-coverage harness (RuleTester silently no-ops on plugin-namespaced rules in ESLint 9 — BvR #26 logged for HALT 3) | DESIGN-1 Step 6 |

Surface diff. Move on.

### Step 2.4 — `CHANGELOG.md` — new top entry

Insert above the existing line-3 entry. ~40-55 lines, single dense paragraph, matches Brief A entry shape. Title: `## MYGRATR-DESIGN-1 Step 6 — UI_STRINGS lint rule + canonical SoT (Brief B HALT 1 close, May 2026)`.

Required facts (pull from `git show 5726e38` commit body — don't invent):
- Step-6-milestone partial-phase update on open DESIGN-1 phase; `migrations.status` unchanged at `content_complete`.
- Commit `5726e38` closed HALT 1; 13-file diff.
- Two-rule architecture: upstream `react/jsx-no-literals` + project-local `local/no-conditional-strings-in-jsx`; rationale (upstream `ConditionalExpression` branch gap surfaced in §6.4).
- Canonical SoT at `tools/eslint/ui-strings.json` (14 keys + `_meta` provenance). Byte-idempotent generator at `scripts/design/generate-ui-strings.mjs`; consumes JSON → emits `site/src/lib/ui-strings.ts`. `npm run generate-ui-strings` added.
- 9 exemption file patterns (stories Pair-rule + flat-file, tests, demo, Next.js framework templates, vendor SDK init, generated ui-strings.ts).
- AST coverage: 8-fixture Linter.verify harness; F7a regression-catch for upstream gap; F7b verifies custom rule.
- §6.3 codebase fixes: 4 SCAFFOLD-1 comment-disables in home pages (TEMPLATE-HOME reference); 3 hubspot-form-embed strings migrated to UI_STRINGS with placeholder-as-split-template pattern; 2 new keys (`form.loading`, `form.error.loadFailed`).
- CONVENTIONS.md: 212-line "UI_STRINGS Rule (post-DESIGN-1 Brief B)" section covering both rules, 5-path violation triage, exemption table, naming convention table, test infrastructure, generator discipline.
- BvR findings to gitignored draft: #23 (tsc CLI shape), #24 (D3 exemption glob mismatch with Brief A Pair-rule), #25 (storybook-static/** missing from globalIgnores), #26 (ESLint 9 RuleTester plugin-namespace silent failure). 3 productisation IP patterns staged for HALT 3.
- Lint state: 25 problems (9 errors + 16 warnings), all pre-existing outside Brief B scope. Zero new violations on either Brief B rule. `tsc --noEmit` clean.
- Forward pointer: Brief B Step 8 (Visual Editing wiring; HALTs 2 + 3) drafting next session.

Surface diff. Move on.

### Step 2.5 — `PHASE_HISTORY.md` — new top entry

Insert above the existing line-3 entry. Full record per the Brief A entry shape (≈200 lines acceptable; depth over brevity here — this is the durable record). Section structure:

- `## MYGRATR-DESIGN-1 Step 6 — UI_STRINGS lint rule + canonical SoT (Brief B HALT 1 close, May 2026)`
- `### Phase context` — content_complete unchanged; Steps 7, 8, 9, 10, 11 pending; HALT 1 of Brief B's 3 closed.
- `### What Was Built` — Two-rule architecture rationale; canonical SoT shape; 9 exemption patterns; AST coverage harness; codebase fixes.
- `### Files Created` — code block listing all 7 new files with line counts.
- `### Files Modified` — code block listing all 6 modified files with diff stats.
- `### HALTs Landed (1 of 3)` — HALT 1 close detail.
- `### Patterns Established` — point to CONVENTIONS.md "UI_STRINGS Rule" section; note that capability IP consolidation defers to HALT 3 per Brief B v1.3.
- `### Tech Debt Logged` — none new at HALT 1; flag pre-existing 25-problem baseline as candidate for HALT 3 rollup.
- `### Discoveries / Surprises` — placeholder-as-split-template pattern (BvR-adjacent); ESLint 9 RuleTester silent failure (BvR #26); upstream `ConditionalExpression` branch gap as architectural rationale for narrow custom-rule supplement.
- `### Final Repo State (Brief B HALT 1 close)` — bullet list mirroring Brief A's final-state bullets (migrations.status, file counts, lint state, tsc state, branch state, capability-log-draft state).

Surface diff. Move on.

### Step 2.6 — `CLAUDE.md` — Current Phase block + Design system state subsection

**Current Phase block (lines 13-20):**
- Line 13: `**MYGRATR-DESIGN-1 Brief A (Steps 4 + 5)** — CLOSED` → keep, but add a sibling line below: `**MYGRATR-DESIGN-1 Brief B Step 6** — CLOSED (HALT 1)`.
- Line 14: `**Next: Brief B (Steps 6 + 8 — ESLint rule + Visual Editing wiring).** Fresh-context recommended.` → replace with `**Next: Brief B Step 8 (Visual Editing wiring — HALTs 2 + 3).** Fresh-context recommended.`
- Line 15: `**Steps 6, 7, 8, 9, 10, 11 of DESIGN-1 pending**` → update to `**Steps 7, 8, 9, 10, 11 of DESIGN-1 pending**` (Step 6 dropped from list; narrative updated accordingly).

**Phase table row (line 31):**
- `🚧 **In progress — Steps 1-5 closed; 6-11 pending**` → `🚧 **In progress — Steps 1-6 closed (Step 6 = Brief B HALT 1); Steps 7-11 pending**`.

**"Design system state" subsection (around lines 60-68):**
- Bump header to `Design system state (as of MYGRATR-DESIGN-1 Brief B Step 6 close — HALT 1):`.
- Add 2 new bullets between existing bullets:
  - `UI_STRINGS lint rule live — 2-rule architecture (\`react/jsx-no-literals\` + project-local \`local/no-conditional-strings-in-jsx\`); canonical SoT at \`tools/eslint/ui-strings.json\` (14 keys); generated \`site/src/lib/ui-strings.ts\` (do-not-edit; \`npm run generate-ui-strings\`).`
  - `\`CONVENTIONS.md\` "UI_STRINGS Rule (post-DESIGN-1 Brief B)" section live (212 lines).`
- Update the bottom-most "Brief B drafting next session" bullet to `Brief B Step 8 (Visual Editing wiring — HALTs 2 + 3) drafting begins next session.`

Surface diff.

---

## 3. HALT — go/no-go before commit

Once all 6 file diffs surfaced, pause for user review. Required signals before proceeding:
- [ ] All 6 files patched (no missing scope; no unintended files touched)
- [ ] No code/config files in the diff (docs-only verified)
- [ ] CHANGELOG + PHASE_HISTORY entries inserted at top, not appended
- [ ] CLAUDE.md status block + Design system state both updated coherently (Brief B Step 6 closed, Step 8 next)
- [ ] REGISTRY additions slot into existing sections cleanly; no duplicate rows
- [ ] FEATURE_MAP gained exactly 3 new sections matching established shape
- [ ] No edits to `docs/CAPABILITY_LOG.md` or `audit-output/design-1/capability-log-draft.md`

If any signal is red: stop, fix, re-surface diff. If all green: proceed.

---

## 4. Commit

Single commit, chore-tagged, message identifying both drivers:

```
chore(design-1): brief A drift catch-up + brief B step 6 post-phase doc cycle

Two parallel docs debts settled in one commit:

(1) Brief A drift catch-up. Brief A's consolidation commit (c4fd58a)
    landed CHANGELOG.md + PHASE_HISTORY.md + CLAUDE.md updates but
    stopped before CONVENTIONS.md status line + FEATURE_MAP.md +
    REGISTRY.md. This commit closes those.

(2) Brief B Step 6 (HALT 1) post-phase doc cycle for commit 5726e38.
    Step 6 shipped UI_STRINGS lint rule + canonical SoT + generator
    + custom rule + AST coverage harness; CONVENTIONS.md got the
    UI_STRINGS Rule section in 5726e38 itself. This commit completes
    the standing post-phase checklist (CHANGELOG → PHASE_HISTORY →
    CLAUDE.md → FEATURE_MAP → REGISTRY).

Files touched (6, docs-only):
- CONVENTIONS.md             — status line bump (line 7)
- docs/FEATURE_MAP.md        — 3 new sections (Storybook scaffold,
                               v0.dev prompt template, UI_STRINGS rule)
- docs/context/REGISTRY.md   — Phase Design-Doc Artefacts (+6 rows),
                               Site Components (new Step 4 stories
                               subsection), Scripts (+2 rows), Lib
                               Files (+1 row), npm Scripts (+1 row),
                               new ESLint Custom Tooling section
- CHANGELOG.md               — Step 6 entry (top)
- PHASE_HISTORY.md           — Step 6 record (top)
- CLAUDE.md                  — Current Phase block + Design system
                               state subsection bumped to Brief B
                               Step 6 close

Explicit non-scope:
- docs/CAPABILITY_LOG.md untouched. Brief B capability IP consolidates
  at HALT 3 (Brief B close), not HALT 1.
- audit-output/design-1/capability-log-draft.md remains gitignored.

Brief B Step 8 (Visual Editing wiring; HALTs 2 + 3) drafting begins
next session.
```

Co-author trailer per CLAUDE.md convention.

Do NOT push automatically. User pushes (or chains a separate request) once they've eyeballed the commit on disk.

---

## 5. Brief lifecycle

After commit lands cleanly, move this brief from `docs/briefs/active/` to `docs/briefs/archive/`. The move can be part of the same commit OR a follow-up — author's choice based on whether the archive-move triggers any new diff drift. Default: same commit.

---

## 6. Pre-flight checks (do before §2.1)

1. `git status` — working tree must be clean (or at minimum: no uncommitted edits to any of the 6 target files outside this cycle).
2. `git log --oneline -3` — confirm HEAD is `5726e38` or descendant; if not, stop and ask.
3. `git show --stat 5726e38` — confirm Step 6 file list matches §1's narrative facts. If divergent, treat `git show 5726e38` as source-of-truth and update brief facts inline (note divergence at HALT).
4. Verify gitignored capability-log-draft state: `git check-ignore audit-output/design-1/capability-log-draft.md` should exit 0. If not, stop — gitignore drift outside this brief's scope.

---

## 7. Anti-patterns to avoid

- Don't pull facts from memory or this brief alone — the commit body of `5726e38` is the authoritative source for what shipped at Step 6.
- Don't inflate line counts in REGISTRY's new Step 4 stories subsection. Pair-rule mechanical count is 25 + 5 = 30; that's the number.
- Don't reorder existing CHANGELOG / PHASE_HISTORY entries — only insert at top.
- Don't touch any file outside the 6 listed.
- Don't add or modify any capability log content. HALT 3 only.
- Don't open the gitignored capability-log-draft.md to "verify" BvR numbers — the commit body has them; re-reading the draft just risks accidental edits.
- If anything outside this brief's scope surfaces (broken link, stale fact in another doc, drift in a related file): log it as a follow-up, don't fix it here.

---

**End of brief. Estimated execution: ~20-30 min. One commit. One HALT.**

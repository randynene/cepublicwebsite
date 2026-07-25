# MYGRATR-DESIGN-1 Brief A — Steps 4 + 5: Storybook Scaffold + v0.dev Prompt Template

| Field | Value |
|---|---|
| Phase ID | MYGRATR-DESIGN-1 (Steps 4 + 5 of 11) |
| Brief version | v1.2 |
| Status | LOCKED for execution |
| Predecessor | Step 3 closed (commit trail `e54b818..c895033` + post-phase refresh `1a0d9fc`) |
| Successor | Brief B (Steps 6 + 8 — ESLint rule + Visual Editing wiring) |
| Operating posture | Jake + Claude Code primary executor. Surgical Upwork dev consult only on blockers exceeding the half-day rule. |
| Estimated runtime | ~2 working days (1.5 for Step 4, 0.5 for Step 5) |
| Halts | 2 (after Storybook scaffold complete; after v0.dev template + examples drafted) |
| Parent brief | `docs/briefs/active/MYGRATR-DESIGN-1_BRIEF_v2.0.md` §Step 4 + §Step 5 |

---

## Brief changelog

- **v1.2** — Pre-Brief-A context-gathering pass surfaced three real corrections. **C1:** §5.2 Sanity Zod type paths corrected — actual location is `src/types/sanity/documents/{kebab-case}.ts` (NOT `src/types/sanity/{camelCase}.ts`); files export Zod schemas with `*Schema` suffix (e.g. `BlogPostSchema = SanityBaseDocumentSchema.extend({ ... })`). **C2:** `_demo` route corrected to `demo` (no underscore — `site/src/app/demo/page.tsx`); pre-flight check #5 reference updated. **C3:** Swiper version note added — installed package is Swiper 12.1.4 (not Swiper 11 as stated in testimonial-swiper-global spec); not a Brief A blocker because Tier-1 stories ship as scaffold-stage previews per Hard Rule #7 (no library import); flagged as schema-vs-reality finding for spec patch at TEMPLATE-REVIEW.
- **v1.1** — Audit pass against v1.0 surfaced 6 findings; all landed. **A1:** D5 self-contradiction on Tier-1 story location resolved (location is `site/src/components/tier-1/{slug}.stories.tsx`, full stop; spec doc is documentation only). **A2 + A4:** §4.3 Tier-1 story scaffold-stage rule made consistent across all 5 stories — no library wiring (no `gsap`, no Swiper init, no ScrollTrigger), all stories render primitive composition + mock data + scaffold-stage notes. Hard-coded primitive list dropped — Claude Code reads §3 Tech stack from each spec instead. **A3:** Hard Rule #1 mock data exception clause added explicitly — generic placeholders permitted in story files only; real CE marketing copy still forbidden. New Hard Rule #7 added locking the scaffold-stage discipline structurally. **A5:** capability log consolidation timing locked at Brief A close per Step 3 HALT 4 precedent (don't re-ask at HALT 2; Claude Code commits canonical CAPABILITY_LOG.md update as third Brief A commit). Files Modified + Files NOT touched + Exit criteria updated to reflect 3-commit close (was 2). **A6:** ambiguous "Jake's call" line on Brief B drafting dropped — three briefs drafted together in same planning conversation while context is live.
- **v1.0** — Initial draft. Locked Storybook IN, Path A from v2.0 brief §Step 4. 28 stories total (23 primitives + 5 Tier-1). 2 halts. Tier-1 stories in scope (Jake's explicit decision after audit-question Q1).

---

## 0. Read first (in order)

1. **CLAUDE.md** — current phase state (Step 3 closed, Steps 4-11 pending), hard rules, Two-Brain Model
2. **`docs/briefs/active/MYGRATR-DESIGN-1_BRIEF_v2.0.md` §Step 4 + §Step 5** — parent brief; this Brief A refines and supersedes those sections
3. **`docs/CAPABILITY_LOG.md`** — established patterns through Step 3 (probe-first, HALT-discipline, render-utility classification, Path A mechanical trigger, brief-vs-reality finding, 5 GSAP provenance shapes)
4. **`docs/design/COMPONENTS.md`** — 22 primitives + Icon foundation; Storybook stories generate from this inventory
5. **`docs/design/TIER_1_INVENTORY.md`** — 5 Tier-1 components; Storybook stories also generate for these
6. **`docs/design/components/{slug}.md`** (×5) — Tier-1 specs; story decorators reference the §6 data-binding sections for mock data
7. **`docs/design/TOKENS.md`** — design tokens; Storybook config imports `tokens.css` so stories render with real CE design

If any of these conflict with this brief, halt and surface to Jake. Do not silently reconcile.

---

## 1. Locked decisions (do not relitigate)

These were settled across the prior planning conversation. Apply throughout execution.

| # | Decision | Lock |
|---|---|---|
| D1 | Storybook IN | **Path A from v2.0 brief §Step 4.** Optionality rationale: dev engagement probability ~35-40% (genuine uncertainty, especially around #1 section-fade-reveal-global). Maintenance cost confirmed low (Claude Code maintains stories incidentally; doesn't change Jake's daily workflow). Install now while primitive context is fresh; revisit indefinite-defer trigger only if 6 weeks pass without engaging Storybook for review. |
| D2 | Storybook adapter | **`@storybook/nextjs` 10.x** per Step 0d compat probe (DEV-2). Compat verified at probe time on Next.js 16.2.4 + React 19.2.4. `prop-types` install-workaround required after `npx storybook init`. **Swiper version note:** installed package is Swiper 12.1.4 (per context-gathering pass A2; testimonial-swiper-global spec says Swiper 11 — schema-vs-reality finding logged for spec patch at TEMPLATE-REVIEW). Tier-1 stories don't import Swiper anyway per Hard Rule #7 (scaffold-stage only). |
| D3 | Story scope | **All 22 primitives + Icon foundation + 5 Tier-1 components = 28 stories total.** Single grid story per primitive showing all variants × sizes on one canvas (minimal investment, dev-sandbox not stakeholder showcase). Tier-1 component stories use mock Sanity data inline (NOT real Sanity fetches — keeps stories deterministic). |
| D4 | Deployment | **Vercel separate project pointed at `site/` with `build-storybook` build command.** Deployment-protected via Vercel deployment protection (existing Vercel team feature; no Chromatic costs). Subdomain pattern: TBD at scaffold time per Vercel naming constraints — record final URL in CAPABILITY_LOG. |
| D5 | Pair-rule | **Every primitive folder `site/src/components/ui/{name}/` gets a `stories.tsx` sibling to `index.tsx`.** Tier-1 component stories live at `site/src/components/tier-1/{slug}.stories.tsx` — placeholder location until TEMPLATE-* settles the architecture per `MYGRATR-DESIGN-1-STEP-3_BRIEF_v1.1.md` HALT 1 lock L4. The story file path is the operative location; the Tier-1 spec at `docs/design/components/{slug}.md` is documentation only. |
| D6 | v0.dev prompt template | **Per v2.0 brief §Step 5 — 6-section format.** No structural changes. Three worked examples: BLOG, TEAM_MEMBER, REVIEW (the simplest data-driven templates per fidelity table; show the prompt template in action across realistic Tier-3 templates). |

---

## 2. Pre-flight checks (read-only; halt on any failure)

1. `git status` clean, on `feat/design-1`, working tree clean.
2. Branch is 12 commits ahead of `origin/feat/design-1` (per "do not push" standing instruction).
3. `npm run build` in `site/` passes.
4. `npx tsc --noEmit` in `site/` passes.
5. `migrations.status === 'content_complete'` in Supabase (DESIGN-1 doesn't transition state; verify unchanged).
6. `audit-output/design-1/` exists and contains Step 0d Storybook compat probe output.
7. Working directory check:
   ```bash
   ls -la site/.storybook 2>&1  # expect: directory does not exist (Brief A creates it)
   ls -la site/src/components/ui/  # expect: 25 source files (22 inventory primitives + Icon foundation; C4 Checkbox+RadioGroup splits across 2 files)
   ls -la docs/design/components/  # expect: TIER_1_INVENTORY.md + 5 spec files + _assets/
   ls -la site/src/app/demo/  # expect: page.tsx + _demo-client.tsx (kitchen-sink demo route from Step 2; no underscore on parent)
   ```

If `site/.storybook/` already exists, halt — Storybook already installed by some prior path; surface and reconcile before proceeding.

---

## 3. Hard rules (carried forward; non-negotiable)

1. **No fabrication of CE site facts.** Hard Rule #2. **Defined exception for Storybook story mock data:** generic placeholder values (`'Sample Author'`, `/sample.jpg`, lorem-ipsum-style copy, `'example-company.com'`) are explicitly permitted in story files because stories are NOT a CE-site claim — they are dev-sandbox primitives. Real CE marketing copy in stories is forbidden; use generic placeholders. Outside story files (specs, briefs, docs), Hard Rule #2 stands without exception.
2. **Probe-first dismissal protocol.** Burden of proof on dismissal, not adoption. Step 2 HALT 10 lesson.
3. **No commit until Jake approves diff.** Hard Rule #3.
4. **Brief-vs-reality finding discipline.** When brief literal conflicts with structural rule (gitignore, framework convention, tooling constraint), structural wins. Surface explicitly. Pattern named at HALT 4 of Step 3 close.
5. **Storybook stories use mock data, not real Sanity fetches.** Per D3. Stories must be deterministic and runnable offline.
6. **No dev-only code lands in production paths.** Storybook config + stories live in clearly Storybook-scoped directories (`site/.storybook/`, `site/src/components/ui/{name}/stories.tsx`, `site/src/components/tier-1/{slug}.stories.tsx`). Production routes import primitives, never stories.
7. **Tier-1 stories are scaffold-stage previews, not working implementations.** All 5 Tier-1 stories render the primitives listed in the spec's §3 Tech stack composed with mock data per §6, plus visible labels/notes describing what the working implementation will do at TEMPLATE-* time. NO library wiring (no `gsap`, no actual Swiper init, no working ScrollTrigger). NO animation execution. NO carousel autoplay. The story is a primitive-composition preview, not a functional component. This is consistent across all 5 Tier-1 stories — no exceptions for "but Swiper is already a dep."

---

## 4. Step-by-step build order

### Step 4 — Storybook install + scaffold + primitive stories + Tier-1 stories + Vercel deployment (~1.5 days)

#### 4.0 — Pre-Step-4 install workaround verification (~5 minutes)

Per Step 0d compat probe (DEV-2), `npx storybook@latest init --type nextjs` scaffolds a demo `Header.jsx` that imports `prop-types` without declaring it as a dep. Workaround: install `prop-types` after init to unblock `build-storybook`.

Capture this in install order before running init:

```bash
cd site
# Run init first — accept the scaffolded files, we delete the demos later
npx storybook@latest init --type nextjs --skip-install
# Workaround: install prop-types so the demo Header.jsx (which init creates) builds
npm install --save-dev prop-types
# Now full install
npm install
```

If `npx storybook@latest init` fails or produces unexpected output (different Storybook major version, different adapter, different scaffold), halt and surface — DEV-2 probe finding may have drifted between probe time (Step 0d) and now.

#### 4.1 — Configure Storybook for CE design tokens

`site/.storybook/main.ts` — Storybook config. Adapter `@storybook/nextjs`. Stories glob covers two locations:

```ts
stories: [
  '../src/components/ui/**/stories.tsx',
  '../src/components/tier-1/**/*.stories.tsx',
],
```

`site/.storybook/preview.tsx` — global decorators. Import `../src/app/tokens.css` so all stories render with real CE design tokens (Tailwind v4 CSS-first; the import alone suffices, no JS config to wire). Set up minimum mock decorators per v2.0 brief Sub-step 0d Phase 2 mock-set:

- `next/image` → plain `<img>` with same props
- `next/link` → plain `<a>` with `href` from `props.href`
- `next/font` → no-op (return empty `className`/`style`)

If any primitive uses `next/navigation`, `next/dynamic`, or `next/headers`, document the additional decorator in CAPABILITY_LOG.

#### 4.2 — Auto-generate primitive stories (22 primitives + Icon = 23 stories)

For each primitive in `site/src/components/ui/{name}/`:

1. Read `index.tsx` to identify variant/size/state CVA prop types.
2. Read `docs/design/COMPONENTS.md` row to identify documented variant axes.
3. Generate `site/src/components/ui/{name}/stories.tsx`:
   - One default-export `Meta` with title `'Primitives/{Name}'`
   - One `Default` story showing the primitive with default props
   - One `AllVariants` story rendering a grid of every variant × size combination on a single canvas (per D3: minimal investment, dev sandbox)
   - State-bearing primitives (Input, Textarea, Select, Checkbox, Accordion, Dialog, Tooltip, Dropdown, Toast) get an additional `States` story showing default / hover / focus / error / disabled where applicable

**Pair-rule per D5:** every primitive folder must have `index.tsx` AND `stories.tsx` after this step. Verifier asserts at HALT (Step 4 close).

**Mock data discipline:** stories use literal mock data inline (`{ name: 'Sample Author', avatar: '/sample.jpg' }`). NO Sanity fetches. NO real CE data. Any mock that looks like real CE marketing copy gets generic placeholder text instead.

#### 4.3 — Generate Tier-1 component stories (5 stories)

For each Tier-1 spec at `docs/design/components/{slug}.md`:

1. Read the spec's §3 Tech stack (which primitives compose the component) and §6 Data binding (Sanity fields + GROQ query).
2. Generate `site/src/components/tier-1/{slug}.stories.tsx`:
   - **All 5 stories follow the scaffold-stage rule (Hard Rule #7):** render the primitives listed in §3 Tech stack composed with mock data per §6, plus visible labels/notes describing what the working implementation will do at TEMPLATE-* time. NO library wiring (no `gsap` import, no actual Swiper init, no working ScrollTrigger, no autoplay logic).
   - Read §3 Tech stack from the spec to determine which primitives to compose. Do NOT hard-code from the brief — the spec is canonical.
   - Mock data follows the §6 Data binding shape — if the spec lists 9 review fields, mock data has 9 fields; if it lists 4 service-card fields, mock data has 4 fields. Generic placeholder values per Hard Rule #1 exception.
   - Each Tier-1 story file gets a `<ScaffoldNote>` component or top-of-story comment block describing what's missing: what library wiring lands at TEMPLATE-* time, what timing values the working implementation will use, which §6 GROQ query feeds it.

**Render-utility note:** #1 section-fade-reveal-global is a render utility (per Step 3 HALT 3 Path A trigger). Story renders the wrapper component pattern with placeholder children — animation timing values from §4 Timing as visible labels rather than actual GSAP execution. Consistent with Hard Rule #7 across all 5 Tier-1 stories.

**TBD-pending-implementation pattern:** every Tier-1 story file's header comment states: *"Story placeholder — Tier-1 composite component not yet implemented (lands at TEMPLATE-* phases per Step 3 brief HALT 1 lock L4). Story renders primitive decomposition per §3 Tech stack with mock data per §6 Data binding. NO library wiring per Brief A Hard Rule #7. Update at TEMPLATE-{slug} phase to reflect actual implementation."*

#### 4.4 — Vercel deployment setup

Per D4: separate Vercel project, pointed at `site/`, build command `npm run build-storybook`.

Steps:
1. Create new Vercel project via `vercel` CLI or dashboard.
2. Link to same Git repo, target the `feat/design-1` branch.
3. Set `Root Directory` to `site`.
4. Set `Build Command` to `npm run build-storybook`.
5. Set `Output Directory` to `storybook-static`.
6. Enable Vercel Deployment Protection (Standard Protection or Advanced — same posture as the main `cloud-employee` project's preview deployments).
7. Record the auto-generated subdomain in CAPABILITY_LOG (`storybook-{project-slug}.vercel.app` likely, but Vercel naming is opaque — record actual).

**Brief-vs-reality finding watch:** if Vercel constraints prevent the locked subdomain pattern (`.vercel.app` reserved per CMA-I10 from v2.0), use whatever auto-generated stable URL Vercel produces. Same logic as the Step 8 preview URL decision in v2.0.

#### 4.5 — Verify Storybook builds + deploys end-to-end

```bash
cd site
npm run build-storybook  # must exit 0
```

If `build-storybook` fails:
- Check `prop-types` was installed per 4.0 workaround
- Check stories glob in `main.ts` matches actual file locations
- Check `tokens.css` import path in `preview.tsx`
- Check no story file imports `gsap`, `framer-motion`, or other primitives-banned deps

Deploy to Vercel; confirm deployment protection active; confirm Storybook loads and stories render with CE tokens (Inter font swap to Poppins per DEV-4 should be visible; CE colors per `tokens.css` should be visible).

#### 4.6 — Add CONVENTIONS.md Storybook Story Pattern entry

Per v2.0 brief Step 11 deliverable list (this is the "IF Path A" addition referenced in v2.0):

Append to `CONVENTIONS.md` Section 3 (or wherever the existing patterns live):

> **Storybook Story Pattern (Path A, locked at Brief A).** Every primitive folder `site/src/components/ui/{name}/` has a `stories.tsx` sibling to `index.tsx`. Stories use mock data, not real Sanity fetches. Argtypes mirror component variant + state surface. Tier-1 component stories at `site/src/components/tier-1/{slug}.stories.tsx` (placeholder location pending TEMPLATE-* architecture lock) render primitive-composition preview with mock §6 data; story file header comment notes Tier-1 implementation lands at TEMPLATE-* phases. Pair-rule enforced at Step 10 verifier IF Storybook IN at Brief A entry decision.

#### HALT 1 — Storybook scaffold complete, surface for eyeball

Surface to Jake:
- The Vercel-deployed Storybook URL (loaded with deployment protection bypass for Jake)
- A screenshot or live walkthrough showing 3-4 sample stories (Button + Card + a Tier-1 spec)
- Verifier-readiness summary: 23 primitive stories + 5 Tier-1 stories = 28 stories total, all build clean
- CONVENTIONS.md Storybook Story Pattern entry diff
- `package.json` diff showing new Storybook scripts + `prop-types` devDep

Jake eyeballs. Adjustments if needed (mock data corrections, missing variants, broken stories). After approval, Step 4 commits.

**Commit point:** `feat(design-1): brief A step 4 — Storybook scaffold + 28 stories + Vercel deployment (HALT 1 closed)`

---

### Step 5 — v0.dev prompt template + 3 worked examples (~0.5 day)

#### 5.1 — Draft `docs/V0_PROMPT_TEMPLATE.md`

Use the 6-section format from v2.0 brief §Step 5 verbatim. Six sections:

1. **Section 1 — Design system constraints** — pasted from `docs/design/TOKENS.md` (colors, typography, spacing, radii, shadows, motion, breakpoints; Tailwind classes only)
2. **Section 2 — Primitive components available** — pasted from `docs/design/COMPONENTS.md` (the 22 primitives + Icon foundation, with import paths from `@/components/ui/`)
3. **Section 3 — Visual reference** — placeholder for live URL + screenshots + field-to-UI map (filled in per template)
4. **Section 4 — Sanity data shape** — placeholder for the TypeScript / Zod type from `src/types/sanity/`
5. **Section 5 — Constraints** — locked rules: Tailwind classes only, no third-party UI libraries, no `lucide-react`, accessibility requirements, `UI_STRINGS` discipline (Step 6 lint rule will enforce; v0.dev outputs must comply preemptively), locale-aware URL prefixing, SEO via `data.metaTitle` / `data.metaDescription`
6. **Section 6 — Output format** — single TSX file ready to paste into `site/src/components/templates/{template-slug}/index.tsx`; async server component using `sanityFetch` from `@/lib/sanity/live` (Step 8 wires this; v0.dev output assumes the convention exists)

#### 5.2 — Three worked examples

Generate at `docs/templates/_examples/v0-prompt-{template}.md` for:

- **`v0-prompt-blog.md`** — fills in Sections 3-4 with real BLOG template data: live URL `https://cloudemployee.io/blog/{slug}` with sample slug, 4-6 screenshots (TBD-pending-capture per Step 3 brief HALT 2 lock 6 — placeholder noted in example), Zod type `BlogPostSchema` from `src/types/sanity/documents/blog-post.ts`
- **`v0-prompt-team-member.md`** — TEAM_MEMBER template; live URL `/team/[name]`, Zod type `TeamMemberSchema` from `src/types/sanity/documents/team-member.ts`
- **`v0-prompt-review.md`** — REVIEW template (note this is the page-level template, not the testimonial Swiper component which is Tier-1); live URL `/reviews`, Zod type `ReviewSchema` from `src/types/sanity/documents/review.ts`

**Type path notes (verified at context-gathering pass):** Zod schemas live in subdirectory `documents/` (NOT at `src/types/sanity/` top level). Filenames are kebab-case (`blog-post.ts`, NOT `blogPost.ts`). All three extend `SanityBaseDocumentSchema` from `../shared` and reference shared schemas (`MetaFieldsSchema`, `LocaleSchema`, `PortableTextSchema`, etc.). The v0.dev prompt's Section 4 should paste the relevant Zod schema definition inline rather than only naming it — v0.dev outputs are sharper when the actual field shape is visible.

**Schema-vs-reality findings carried forward:** the testimonial-swiper-global F2 finding (sibling `.swiper.testimonies` variant deferred to TEMPLATE-REVIEW) means the REVIEW template example must surface this — the v0.dev prompt for REVIEW template should include a note that the testimonial component variant decision is pending TEMPLATE-REVIEW.

#### 5.3 — Cross-reference with Step 4 deliverables

The v0.dev prompt template's Section 2 (Primitive components available) should reference the Storybook URL from Step 4. Add a line: *"For visual reference of any primitive in this list, see Storybook at {URL}."*

This makes Storybook genuinely useful for v0.dev workflow — when v0.dev produces code that imports `<Button variant="primary">`, the spec author can verify what Button-with-primary-variant looks like in Storybook before pasting v0.dev output into a template file.

#### HALT 2 — v0.dev prompt template + examples complete, surface for eyeball

Surface to Jake:
- The complete `docs/V0_PROMPT_TEMPLATE.md` (6 sections, lockable as the canonical template)
- The 3 worked examples (BLOG, TEAM_MEMBER, REVIEW)
- The Storybook cross-reference line in Section 2
- Schema-vs-reality findings carried forward (REVIEW example's note about TEMPLATE-REVIEW deferral)

Jake eyeballs. Format adjustments if needed. After approval, Step 5 commits.

**Commit point:** `feat(design-1): brief A step 5 — v0.dev prompt template + 3 worked examples (HALT 2 closed)`

---

### Brief A close — capability-log-draft additions + final state

After both halts close and both commits land:

#### Capability-log-draft additions (`audit-output/design-1/capability-log-draft.md`)

Append Brief A productisation IP entries:

1. **Storybook scaffold lessons** — `prop-types` install workaround, mock decorator set (`next/image`, `next/link`, `next/font`), Tailwind v4 CSS-first import in `preview.tsx`, deterministic mock data discipline. Customer-2 take-away: `prop-types` is a Storybook 10 init hazard; document the workaround upfront so customer-2 onboarding doesn't burn the same cycle.
2. **Tier-1 story scaffold-stage pattern** — Tier-1 stories ship as primitive-composition previews, NOT working implementations. Story file headers explicitly note implementation lands at TEMPLATE-* phases. Customer-2 take-away: the spec system + Storybook scaffold-stage pattern lets you ship a design system before any pages exist; the dev-handoff value of Storybook is the primitive set, the educational value of Tier-1 stories is the decomposition.
3. **v0.dev prompt template structure** — 6-section format, Storybook cross-reference in Section 2, Schema-vs-reality findings carried forward into per-template examples. Customer-2 take-away: v0.dev workflow requires a structured prompt to produce on-brand output; the prompt is the productisation IP, not v0.dev itself.

These run as draft updates to the gitignored `audit-output/design-1/capability-log-draft.md` file (Brief-vs-Reality Finding from HALT 4 of Step 3 — gitignored running draft).

**Capability log canonical consolidation:** consolidates into `docs/CAPABILITY_LOG.md` at Brief A close per the Step 3 HALT 4 precedent (Jake's direction: *"don't wait for Step 9, consolidate the productisation IP into canonical CAPABILITY_LOG.md early"*). Locked here — Claude Code does NOT re-ask at HALT 2; it consolidates the 3 entries into canonical CAPABILITY_LOG.md as a small post-HALT-2 commit. The running draft stays gitignored.

**Brief A close commit sequence after HALT 2 approval:**
1. `feat(design-1): brief A step 5 — v0.dev prompt template + 3 worked examples (HALT 2 closed)` — Step 5 deliverables
2. `chore(design-1): brief A close — capability log consolidation (Storybook scaffold + Tier-1 scaffold-stage + v0.dev template)` — canonical CAPABILITY_LOG.md update with 3 entries

#### No post-Brief-A context refresh required

CHANGELOG, PHASE_HISTORY, CONVENTIONS, FEATURE_MAP, CLAUDE.md, REGISTRY all get refreshed at end-of-DESIGN-1 (Step 11 final close per v2.0 brief). Brief A is a sub-phase milestone; doesn't trigger the full refresh cadence. EXCEPT: CONVENTIONS.md gets the Storybook Story Pattern entry per §4.6 above (that's a Brief-A-time addition because the pattern is established at Brief A; deferring it would mean Brief B/C executors can't reference it).

---

## 5. Files created / modified

### Created

```
site/.storybook/main.ts
site/.storybook/preview.tsx
site/src/components/ui/{primitive}/stories.tsx              (×23)
site/src/components/tier-1/{slug}.stories.tsx               (×5)
docs/V0_PROMPT_TEMPLATE.md
docs/templates/_examples/v0-prompt-blog.md
docs/templates/_examples/v0-prompt-team-member.md
docs/templates/_examples/v0-prompt-review.md
```

### Modified

```
site/package.json                                           (Storybook scripts + prop-types devDep)
site/package-lock.json                                      (lockfile updates)
CONVENTIONS.md                                              (Storybook Story Pattern entry)
docs/CAPABILITY_LOG.md                                      (3 Brief A entries consolidated at close per Step 3 HALT 4 precedent)
audit-output/design-1/capability-log-draft.md               (gitignored; +3 entries — running draft)
```

### Files NOT touched

```
SCHEMA.md                                                   (no DB DDL)
src/lib/pipeline/state-machine.ts                           (no state transition)
docs/design/COMPONENTS.md                                   (canonical inventory; not modified)
docs/design/TIER_1_INVENTORY.md                             (canonical inventory; not modified)
docs/design/TOKENS.md                                       (canonical tokens; not modified)
docs/design/components/{slug}.md                            (×5 Tier-1 specs; not modified)
site/src/components/ui/{primitive}/index.tsx                (primitives unchanged)
CHANGELOG.md, PHASE_HISTORY.md, FEATURE_MAP.md,             (Step 11 final close handles these;
CLAUDE.md, REGISTRY.md                                       Brief A is sub-phase milestone)
```

---

## 6. Halt-and-escalate triggers

Halt and surface to Jake before continuing if any of these occur:

1. **Pre-flight check failure** in §2.
2. **Storybook 10 install behaviour drifted from DEV-2 probe.** Different major version, different adapter scaffold, different `prop-types` workaround needed.
3. **Build-storybook fails after install + workaround** — investigate per §4.5 troubleshooting list before improvising fixes.
4. **Vercel deployment fails or naming pattern unavailable** — apply Brief-vs-Reality Finding discipline; use whatever stable auto-generated URL Vercel produces; record actual URL in CAPABILITY_LOG.
5. **Primitive variant inventory unclear** — if a primitive's CVA prop types or COMPONENTS.md row don't make the variant axes obvious, halt and surface; do NOT improvise variants.
6. **Tier-1 story can't be decomposed** — if §3 Tech stack of a spec doesn't cleanly map to existing primitives, that's a Step-3 brief deviation, not a Brief-A improvisation. Surface.
7. **v0.dev prompt template format requires structural change** — if Sections 1-6 from v2.0 brief §Step 5 don't fit a real template's needs (e.g., a template needs a 7th section), surface as a brief deviation; v2.0 brief §Step 5 is canonical.
8. **Two failed attempts at any sub-step** — write `DEBUG_CONTEXT.md` per CLAUDE.md debugging rules.

---

## 7. Operating discipline

- **Probe-first.** Every CE-pattern decision backed by probe output or live-site visual confirmation.
- **No fabrication.** If schema doesn't have it AND probe doesn't show it AND Jake didn't confirm it — say "unknown" and ask.
- **Halt cadence is non-negotiable.** HALT 1 (Storybook scaffold), HALT 2 (v0.dev template). Do not skip halts.
- **No commit until Jake approves diff.** Always surface diff for review.
- **Mock data discipline.** Stories never use real CE marketing copy. Generic placeholders only.
- **Brief-vs-reality findings** — if any Vercel / Storybook / npm constraint conflicts with this brief's literal instruction, structural rule wins. Surface the conflict.

---

## 8. Exit criteria

Brief A is Done when **all** of these hold:

1. `site/.storybook/main.ts` and `site/.storybook/preview.tsx` exist and configure Storybook for CE tokens.
2. `site/src/components/ui/{name}/stories.tsx` exists for all 22 primitives + Icon = 23 files.
3. `site/src/components/tier-1/{slug}.stories.tsx` exists for all 5 Tier-1 components = 5 files.
4. `npm run build-storybook` in `site/` exits 0.
5. Storybook deployed to Vercel; URL recorded in CAPABILITY_LOG; deployment protection active.
6. `docs/V0_PROMPT_TEMPLATE.md` exists with 6-section format.
7. 3 worked examples at `docs/templates/_examples/v0-prompt-{blog,team-member,review}.md` exist.
8. `CONVENTIONS.md` Storybook Story Pattern entry added.
9. `docs/CAPABILITY_LOG.md` extended with 3 Brief A entries (Storybook scaffold lessons, Tier-1 scaffold-stage pattern, v0.dev prompt template structure) per Step 3 HALT 4 precedent.
10. `audit-output/design-1/capability-log-draft.md` extended with the same 3 Brief A entries (running draft).
11. Three commits landed on `feat/design-1` with Jake's explicit approval: HALT 1 close (Step 4), HALT 2 close (Step 5), Brief A close (capability log consolidation).
12. `npm run build` and `npx tsc --noEmit` in `site/` still pass.
13. `migrations.status === 'content_complete'` (unchanged).

---

## 9. Next phase entry conditions

Brief B (Steps 6 + 8 — ESLint rule + Visual Editing wiring) entry requires:
- Brief A closed per §8 above
- Storybook URL accessible (Brief B's Step 8 will reference it for stega-encoding visual review)
- v0.dev prompt template stable (Brief B's Step 6 ESLint rule's `UI_STRINGS` enum is referenced from v0.dev outputs)

Brief B is drafted in the same planning conversation that produced Brief A — three briefs (A, B, C) drafted together while context is live.

---

*End of MYGRATR-DESIGN-1-BRIEF-A_v1.2.md*

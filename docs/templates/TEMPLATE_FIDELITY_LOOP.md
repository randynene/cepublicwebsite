# Template Fidelity Loop

A repeatable CONDUCTOR → BUILDER → QA loop for shipping a detail-page template
from a committed HTML export to **computed-value fidelity** (not "looks close"),
with Tier-1 SEO and JSON-LD. First run: MYGRATR-TEMPLATE-VIDEO (Jul 2026, clean
pass at iteration 3 of 6). Parameterise the `{Template}` slots and re-run for
Download, Book-a-Call, Tool, Compare, etc.

Plain-English: three AI agents play distinct roles. The Conductor (the planning
chat) holds the plan and never writes code. The Builder builds the page. The QA
agent measures the built page against the design export **in actual pixels** and
returns a pass/fail table. The Conductor feeds only the failing rows back to the
Builder and repeats until zero fails, Gate 6 passes, or the iteration cap hits.

**Target:** one-shot (iteration 1 CLEAN) on every template after VIDEO. Iteration
2–3 is acceptable for the first template in a batch that re-validates chrome;
templates 2+ in the same batch should one-shot if Step 0 + export-spec + scaffold
copy are done. See **§9 Cost mode** and **§10 One-shot discipline**.

---

## 0a. Design reference hierarchy (read before every template)

Three sources exist. **Do not mix them up** — VIDEO-era mistakes included QA
scoped to the wrong surface and Jake reviewing against old-site captures.

| Priority | Source | Path | Use for |
|---|---|---|---|
| **1 — Computed fidelity (primary)** | Claude design HTML export | `docs/raw-html/{Template}.html` | Automated QA diff (Step 0.5 + Playwright). Dark/lime D3 design in code form. **This is the numeric source of truth.** |
| **2 — Visual design (secondary)** | Design PDFs (desktop + mobile artboards) | `docs/raw-html-pdf/` | Builder layout orientation; optional Gate 5.5 vision check; **Gate 6** Jake eyeball. What the page should *look* like. |
| **3 — Legacy capture (do not use for design QA)** | Old live-site screenshots | `docs/re-design/screenshots/catalog-details/` | **Structure/archival only.** Teal-era live site — wrong colours, wrong chrome. Never diff the built page against these for design fidelity. |

**Batch ×4 PDF map:**

| Template | HTML export | Design PDF |
|---|---|---|
| Download | `docs/raw-html/Download.html` | `docs/raw-html-pdf/Download Page.pdf` |
| Tool | `docs/raw-html/Tool.html` | `docs/raw-html-pdf/Tool Page.pdf` |
| Book A Call | `docs/raw-html/Book A Call.html` | `docs/raw-html-pdf/Book A Call.pdf` |
| Compare | `docs/raw-html/Compare.html` | `docs/raw-html-pdf/Compare Page.pdf` |

PDFs may bundle desktop + mobile as separate pages — use page 1 (or the wide
artboard) for desktop computed diff scope; mobile PDF page for a future
mobile-fidelity pass or Gate 6 spot-check only (desktop is the launch gate today).

**Builder prompt must cite:** HTML export + design PDF path. **Never** cite
`docs/re-design/screenshots/` for design targets.

---

## 0. The one hard rule

**Fidelity = computed values from the Claude design HTML export**, not screenshot
similarity to old live-site captures. QA must extract real `getComputedStyle()`
values from BOTH `docs/raw-html/{Template}.html` (desktop frame) and the built
page, then diff them. A pass without a value table is invalid.

**Visual design PDFs** (`docs/raw-html-pdf/`) are for layout/orientation and
optional Gate 5.5 — they do **not** replace the computed diff (see §0a).

A **material fail** = any delta beyond tolerance on: `font-size`, `font-weight`,
`line-height`, `letter-spacing`, `color`, `background`, `border`, `border-radius`,
`padding`, `margin`, `width`, `height`, grid columns / gap.

---

## 1. Roles

| Role | Who | Does | Never |
|---|---|---|---|
| **CONDUCTOR** | The planning chat (this Cursor session) | Orchestrates the loop, holds state, enforces the iteration cap, decides architecture questions, verifies QA root-cause claims before feeding them back, commits on clean pass | Build or QA directly |
| **BUILDER** | A subagent on the **strongest** model (Opus-class) | Writes the four/six-file stack; reuses locked primitives; runs `build` + `lint` | Commit, push, mutate Sanity, invent content, fork primitives to chase fidelity |
| **QA** | A subagent on a **lighter** model (Sonnet-class) | Renders export + built page in Playwright, extracts computed styles, diffs, runs the structural gate, returns PASS/FAIL table | Edit template code, pass on screenshot similarity, soften a real delta |

**Per-agent model assignment** via the Task tool's `model` param:

| Role | Default (quality) | Cost mode (§9) |
|---|---|---|
| Builder — **first build** | Opus-class | Opus-class |
| Builder — **fix iterations** | Opus-class (resume same subagent) | Sonnet/Codex-class (failing rows only) |
| QA | Sonnet-class | Sonnet-class |
| Conductor | Default / lighter | Default / lighter |

Resume the SAME Builder / QA subagent across fix iterations so each keeps file
context. **Exception (Cost mode):** Book A Call may be built by the main agent
(no subagent) — see §9.

---

## 2. Pre-flight: Step 0 probe (HALT)

Before any build, run a **read-only** Sanity probe and report to Jake. Wait for
approval. Report:

- Doc count + locale split.
- Field fill rates (which export sections have no data → will be omitted).
- Enum drift: Studio schema values vs live production values (log as tech debt;
  Zod to the LIVE values, never mutate Sanity to match the schema).
- `metaTitle` / `metaDescription` fill (fallbacks).
- Edge cases (null poster, partial enums) and how each is handled.
- Recommended QA slug: the doc that best matches the export + screenshots and has
  the fullest field coverage.
- **Export section map** (desktop frame): every export block classified
  schema-backed | omit (no data) | sitewide chrome (see §8).
- **Product decisions for Jake:** visible breadcrumbs y/n; any export-only blocks
  that look like template fields but are not in Sanity.

Probe script pattern: `scripts/template-video/probe-step0-sanity.ts`.

### Step 0.5 — export-spec (no LLM, one-shot enabler)

Before Builder runs, Conductor (or a Node script) extracts desktop-frame computed
targets from `docs/raw-html/{Template}.html` into:

`audit-output/{template}/export-spec.json`

Minimum keys per measured element: selector label, `fontSize`, `lineHeight`,
`letterSpacing`, `padding*`, `gap`, `gridTemplateColumns`, `color`/`backgroundColor`,
`borderRadius`. Builder reads this JSON — **not** the full bundled HTML string.

Script pattern: extend `scripts/template-video/qa-computed-diff.mjs` with an
`--extract-spec` mode, or add `scripts/template/extract-export-spec.mjs` (shared,
`--template=download`). Zero token cost; removes export-parsing guesswork from
the Builder's first pass.

---

## 3. Conductor flow

```
Step 0 (HALT)     → Sanity probe + export section map; wait for Jake
Step 0.5          → export-spec.json (script, not agent)
Conductor→Builder → build (Opus first pass; copy scaffold — §10)
Conductor→QA      → computed diff + chrome rows (§5, §8)
  if FAIL:
    Conductor verifies root-cause against codebase BEFORE feeding back
    Conductor→Builder: fix ONLY failing rows (Cost mode: lighter model OK)
    Conductor→QA: re-diff
  repeat until 0 material fails
Gate 5.5 (opt)   → vision compare: built screenshot vs design PDF (§0a) — advisory
Gate 6            → localhost product checklist + design PDF side-by-side (§8)
Cap               → 6 iterations (quality) / 4 (Cost mode §9)
On done           → commit (explicit paths, no push) + diff table + iteration count
```

**Session split (Cost mode):** max **2 templates per Conductor chat**. Fresh chat
per pair; files + export-spec + probe outputs are the memory (see §9).

**Conductor discipline that mattered on VIDEO:** when QA blamed a "doubled spacing
scale" and "double-padding", the Conductor verified `--spacing: 0.5rem` in
`tokens.css` and the `Container` padding itself before feeding fixes back — because
other templates use the same utilities and a wrong hypothesis wastes an iteration.
Verify QA's root cause; don't relay it blind.

---

## 4. Builder prompt template

Swap the `{Template}` / `{template}` / route / schema slots.

> You are the BUILDER for MYGRATR-TEMPLATE-{TEMPLATE}. Branch `feat/design-1`.
> Build only; no commit, no push, no Sanity mutation; don't touch chrome or other
> templates.
>
> **Goal:** ship `/{template}s/[slug]` + `/uk/{template}s/[slug]` reproducing
> `docs/raw-html/{Template}.html` to computed-value fidelity, Tier-1 SEO, and the
> correct JSON-LD `@type`. EDIT/COMPOSE reusing locked primitives — do NOT
> reinvent.
>
> **Source of truth:** (1) `audit-output/{template}/export-spec.json` from Step
> 0.5 (extracted from `docs/raw-html/{Template}.html`); (2) **visual layout:**
> `docs/raw-html-pdf/{pdf}` — dark/lime design reference; **NOT**
> `docs/re-design/screenshots/`; (3) **scaffold copy** — duplicate Video commit
> `f6729d3` file set (§10), or Blog stack for compare-shaped templates; (4) reuse
> primitives:
> `Container`, `Heading`, `Text`, `PortableText`, `Tag` (`tone="ghost-lime"`),
> `MegaMenuPillLabel` (`size="cta" + leadingArrow`), `VideoEmbed` / relevant leaf.
>
> **Sanity reality (from Step 0 — do not re-probe, do not mutate):** {fill rates,
> enum drift → Zod to LIVE values, metaTitle fallback, null edge cases, QA slug}.
>
> **Field → element mapping:** {table}. Render only schema-backed fields; OMIT +
> flag export elements with no Sanity data (share rows, closing CTAs, decorative
> imgs); never invent relationships or related grids; **no visible breadcrumbs**
> in `<main>` unless Step 0 approved — always emit `BreadcrumbList` JSON-LD via
> `serializeJsonLd()`; **no inline closing CTA** (sitewide footer owns that band).
>
> **CRITICAL token facts (this repo):**
> - `--spacing: 0.5rem` → every Tailwind spacing unit = **8px**, not 4px
>   (`px-4`=32px, `py-2`=16px, `gap-12`=96px). **Use arbitrary px** (`px-[16px]`,
>   `gap-[48px]`) for any spacing that must match an exact export value.
> - `Container width="default"` already applies `sm:px-8` = **64px** horizontal.
>   Do NOT add a second horizontal padding layer inside it. If the export uses
>   per-section 64px padding with the wash on one block only, use
>   `Container width="full"` + a `mx-auto max-w-[frame]` band + per-section
>   `lg:px-[64px]`.
> - `cn.ts` / tailwind-merge does NOT know custom `--radius-*` names
>   (`rounded-pill`, `rounded-card`): a base `rounded-xs` + variant `rounded-pill`
>   will NOT dedupe, and `rounded-xs` (4px) wins by source order. Verify pill/card
>   radii actually render; override with arbitrary `rounded-[Npx]` or a `className`
>   in the standard `rounded` group if needed.
> - Colors: confirm `brand-primary` = `#D4FF3C` and `text-secondary` = `#B8C2D1`
>   in `tokens.css`; use exact hex via arbitrary class when a token diverges.
>
> **Files:** `site/src/types/sanity/documents/{template}.ts` (Zod, incl. a lighter
> Meta schema), `site/src/lib/sanity/queries/{template}.ts` (`fetch*` +
> `*_PARAMS_QUERY`, `sanityFetch` for detail/meta, bare `sanityClient` for params),
> `site/src/components/templates/{template}/index.tsx` + `json-ld.tsx`,
> `site/src/app/{template}s/[slug]/page.tsx` + `site/src/app/uk/{template}s/[slug]/page.tsx`,
> edit `site/src/app/sitemap.ts` (+ URL builder + query), edit
> `scripts/static/validate-json-ld.ts` (+ target + field check), edit
> `tools/eslint/ui-strings.json` (add keys) then `npm run generate-ui-strings`.
> ALL literal UI text in `templates/**` via `UI_STRINGS` (ESLint rule scoped there).
>
> **JSON-LD:** correct `@type` + `BreadcrumbList` via `serializeJsonLd()`. Include
> only fields the schema backs; omit `uploadDate` / `duration` / etc. when not
> present — never fabricate from `_createdAt` / `_updatedAt`.
>
> **Verify before reporting:** `cd site && npm run build` GREEN;
> `npm run lint` no new errors; content stays server-rendered (native `<details>`
> for collapsibles, not a client island); no `'use client'` on content-bearing
> components. Report: files, build result, elements omitted + why, any residual
> fidelity delta you could NOT hit with a reused primitive (do NOT fork to chase
> it), enum/metaTitle confirmations.

On a fail iteration, resume the Builder with ONLY the failing rows + the verified
root cause + the exact fix per row.

---

## 5. QA prompt / checklist + diff-table schema

QA renders BOTH surfaces in Playwright (`playwright` + chromium are installed).
Use **one shared script** parameterized by template:

`node scripts/template/qa-computed-diff.mjs --template={template}`

(Fallback per-template copy: `scripts/template-video/qa-computed-diff.mjs`.)
Raw output: `audit-output/{template}/qa-diff-run.json` (gitignored).

**Chrome rows (mandatory on first template in a batch; Cost mode §9 skips on 2+):**

1. Footer top CTA vs `Footer.html` — 2-col, italic lime "hire", pills ≤32px tall.
2. Header Schedule a Call pill vs page primary CTAs — ≤2px height delta.
3. No visible breadcrumb nav inside `<main>` (unless Step 0 exception documented).

**Export rendering gotcha:** the committed `docs/raw-html/{Template}.html` is a
"bundled page" — the real markup is a JSON-escaped string inside the file
(`JSON.parse` the literal starting at `"<!DOCTYPE html>`), and it contains MULTIPLE
artboard frames (desktop / tablet / mobile). **Scope every export measurement to
the DESKTOP frame** (the one whose sections use `64px` horizontal padding and whose
H1 computes to the desktop font-size). Extract to a temp `.html`, load via
`file://` at viewport 1280×2000.

**Built page:** `cd site && npm run build` then `PORT=<free> npm run start`
(do NOT reuse stale dev servers); load `http://localhost:<port>/{template}s/{qa-slug}`
at 1280×2000. Kill the server when done.

**Per element compare:** `fontSize`, `fontWeight`, `lineHeight`, `letterSpacing`,
`color`, `backgroundColor`, border (`width`+`style`+`color`), `borderRadius`,
`padding*`, `margin*`; for grids `gridTemplateColumns` + `gap`/`columnGap`; for
media `width`/`height`. Normalise colours to rgb/rgba before comparing.

**Tolerances (MATCH within):** colours/weights/border-width/grid-columns EXACT;
`border-radius` ≤1px; `font-size` ≤0.5px; `line-height` ≤1px; `letter-spacing`
≤0.1px; `padding`/`margin`/`gap` ≤1px. Media dimensions ≤1px EXCEPT a
primitive-owned residual the Builder documented (e.g. a fixed-height hero vs an
aspect-ratio primitive) — report it, classify NON-material. Trailing bottom
whitespace before the sitewide footer = NON-material.

**Diff-table schema:**

| element | property | export value | built value | MATCH/FAIL |
|---|---|---|---|---|

Return: (1) the full table, FAILs first; (2) material FAIL count + the precise
failing `element → property → export → built` rows (Conductor feeds these back);
(3) the structural gate below; (4) verdict CLEAN PASS or FAIL.

**Structural gate (all must PASS):**

1. `npm run build` GREEN.
2. JSON-LD: exactly one primary `@type` + one `BreadcrumbList`, correct required
   fields, zero forbidden types.
3. Both locale routes return HTTP 200.
4. `<meta name="description">` present in `<head>`.
5. No `BAILOUT_TO_CLIENT_SIDE_RENDERING` in the built HTML.

---

## 6. Definition of done

- 0 material fails on the computed-value diff (template body + chrome rows when
  applicable).
- 5/5 structural gate PASS.
- **Gate 6 product pass PASS** (localhost checklist — §8).
- Any residuals explicitly documented + classified non-material.
- Iteration count ≤ cap (6 quality / 4 Cost mode).
- Commit: single-line message, explicit path staging (never `git add -A`), no push
  until Jake approves.
- Step 0.5 `export-spec.json` exists in `audit-output/{template}/` (gitignored).

---

## 7. First-run reference (VIDEO)

- Iterations: 3 (24 → 2 → 0 material fails).
- The three root causes that will recur on every template in this repo:
  1. **Doubled `--spacing` scale** — scale utilities render at 2× px.
  2. **Double horizontal padding** — a second padding layer inside `Container`.
  3. **Custom-radius merge gap** — `rounded-pill` not deduped against `rounded-xs`.
- Structural artefacts: `scripts/template-video/probe-step0-sanity.ts`,
  `scripts/template-video/qa-computed-diff.mjs`.

---

## 8. Loop v2 learnings (post-VIDEO Jake review, Jul 2026)

The VIDEO computed diff reached **0 material fails** at iteration 3, but localhost
review still found wrong footer CTA, oversized pills, visible breadcrumbs, and
footer spacing. **Root cause: QA scoped only the template body against
`Video.html`, not sitewide chrome.**

### What to do differently

1. **Chrome boundary table in Step 0** — For every export section, classify:
   schema-backed | omit (no data) | sitewide chrome (verify against `Footer.html`
   / header, not the template export clone). Inline "Ready to hire…" closing bands
   in template exports are **not** template fields; the sitewide `FooterTopCta`
   must match `Footer.html`.

2. **Expanded QA (mandatory rows beyond template body):**
   - Footer top CTA: 2-col layout, italic lime "hire", compact pills.
   - Header "Schedule a Call" pill height = canonical reference for all CTAs
     (`MegaMenuPillLabel size="cta"`, ~28px tall — not the old 36px circle).
   - Visible breadcrumbs: FAIL if rendered in `<main>` (JSON-LD only is OK when
     Jake wants content pulled up — confirm per template at Step 0).

3. **Gate 6 — Product pass** — After computed CLEAN + structural 5/5, Jake (or
   Conductor on localhost) compares the built page against the **design PDF** in
   `docs/raw-html-pdf/` (desktop artboard; mobile page for spot-check). Also
   checks footer, breadcrumbs, CTA heights, no duplicate closing band. **Do not**
   use `docs/re-design/screenshots/catalog-details/` as the visual target. A
   computed pass without Gate 6 is **not** done.

### Gate 5.5 — Optional visual sanity (after computed CLEAN)

**Not a substitute for computed diff.** Run once per template when layout fidelity
matters (recommended for batch template #1 and Compare).

1. QA captures built page screenshot at 1280×2000 (Playwright).
2. QA agent with vision reads the matching `docs/raw-html-pdf/*.pdf` desktop
   artboard (and mobile page if present).
3. Report **layout-level** mismatches only: missing sections, wrong column order,
   obvious dark/lime vs teal drift, hero structure wrong.
4. Material layout fails feed back to Builder like computed fails. QA still does
   not edit code.

Skip Gate 5.5 in Cost mode unless iteration 1 computed pass had >0 fails or Jake
requests it.

4. **Batch templates** — Step 0 probe all types in the batch; build simplest →
   hardest, each to CLEAN before the next; shared primitive fixes carry forward.
   Current batch handover (×4): `docs/briefs/active/TEMPLATE-BATCH-4-HANDOVER.md`.

5. **HALT 0** — Commit post-VIDEO chrome fixes (footer top CTA, compact
   `size="cta"`, video breadcrumb hide) before measuring the next template.

---

## 9. Cost mode

Cost mode keeps the **same quality bar** (computed diff + Gate 6). It cuts spend
on discovery, context bloat, and redundant chrome checks. Enable explicitly in the
Conductor prompt: `Cost mode: on`.

### Where tokens burn (typical batch)

| Driver | Share | Cost-mode fix |
|---|---|---|
| Opus Builder first pass + fix loops | ~50–60% | Opus first pass only; Sonnet/Codex for fixes |
| Conductor context in long chats | ~20–25% | Max 2 templates per chat; commit between |
| QA subagent × iterations | ~15–20% | Shared script; chrome QA on batch template #1 only |
| Re-exploring file patterns | Multiplier | Scaffold copy (§10); export-spec (Step 0.5) |

### Cost-mode rules

1. **Session split** — Two templates max per Conductor chat. Chat A: simple pair;
   Chat B: next pair. Handover on disk is the memory.
2. **Tiered Builder models** — Opus for first build; lighter model for fix
   iterations with **only** the failing diff rows + verified root cause.
3. **Chrome QA once per batch** — Full footer/header/breadcrumb rows on **template
   #1 only**. Templates #2+ in the same batch: template-body diff only, unless
   Builder edited chrome files.
4. **Iteration cap 4** (not 6) — STOP at 4 and report; do not lower tolerances.
5. **Step 0.5 mandatory** — export-spec.json before every Builder launch.
6. **Book A Call lite path** — 6 docs, one embed field: main agent builds (no Opus
   subagent); one QA run; still requires Gate 6.
7. **Compare = fork Blog** — Builder prompt must say "copy `templates/blog/` stack,
   edit these N sections" — never greenfield a blog-shaped template.
8. **No `git add -A`** — explicit paths; one commit per template keeps the next
   chat cheap to orient.

### What Cost mode does NOT cut

- Step 0 HALT (prevents wrong-slug / empty-field rebuilds).
- Computed-value diff (screenshot-only QA is forbidden).
- Gate 6 Jake-visible checklist (free; catches what diff missed on VIDEO).
- Conductor verifying QA root-cause before relaying to Builder.

### Expected savings

Versus naive "one chat, Opus every iteration, full chrome QA × N templates":
**~40–55% fewer tokens** with the same done definition, assuming templates 2+
one-shot or two-shot.

---

## 10. One-shot discipline

Everything below exists because VIDEO needed **3 iterations** for three **repo-wide**
bugs now documented. Templates after VIDEO should not re-pay that discovery tax.

### Before Builder touches code (Conductor checklist)

- [ ] Step 0 approved by Jake (slug, omit list, breadcrumb policy, enum drift).
- [ ] `export-spec.json` written (Step 0.5).
- [ ] Chrome HALT 0 satisfied (footer CTA + `size="cta"` shipped — commit `1c3547d+`).
- [ ] Scaffold path chosen: Video six-file stack | Blog fork | Book A Call lite.
- [ ] Builder prompt includes **only** Step 0 row + export-spec path — not whole HTML.

### Builder non-negotiables (paste every time)

These five rules prevent ~80% of VIDEO iteration failures:

1. **Arbitrary px** for export-matched spacing — never Tailwind scale utilities
   for fidelity-critical values (`--spacing: 0.5rem` = 8px per unit).
2. **No double horizontal padding** — `Container width="default"` already = 64px;
   use `width="full"` + `max-w-[1280px]` + per-section `lg:px-[64px]` when export
   shows section-owned padding.
3. **Pill radii** — verify `rounded-pill` vs `rounded-xs` merge; use arbitrary
   `rounded-[Npx]` on Tags if needed.
4. **CTAs** — `MegaMenuPillLabel size="cta"` only (~28px tall); header Schedule a
   Call is the reference.
5. **Chrome boundaries** — no inline closing CTA; no visible breadcrumbs in
   `<main>` unless Step 0 exception; JSON-LD always.

### Scaffold copy (Video commit `f6729d3`)

Duplicate and rename — do not re-derive routes or query shape:

| File | Action |
|---|---|
| `site/src/types/sanity/documents/video.ts` | → `{template}.ts` |
| `site/src/lib/sanity/queries/video.ts` | → `{template}.ts` |
| `site/src/components/templates/video/index.tsx` | → `{template}/index.tsx` |
| `site/src/components/templates/video/json-ld.tsx` | → `{template}/json-ld.tsx` |
| `site/src/app/videos/[slug]/page.tsx` | → correct path (watch hyphen routes) |
| `site/src/app/uk/videos/[slug]/page.tsx` | → UK mirror |
| `site/src/app/sitemap.ts` | add entries |
| `scripts/static/validate-json-ld.ts` | add target |
| `tools/eslint/ui-strings.json` + generate | new keys only |

**Blog-shaped templates (Compare):** copy from `templates/blog/` instead; diff
against `Compare.html` export-spec for hero/TL;DR deltas only.

### QA one-shot helpers

- Parameterized `qa-computed-diff.mjs --template=X` (one script, not N copies).
- Pre-seed element selectors in the script from export-spec labels so QA does not
  re-parse bundled HTML each run.
- Fail fast: if material fail count >10 on iteration 1, Conductor stops loop and
  checks whether Builder ignored §10 non-negotiables before burning iteration 2.

### Honest one-shot expectations

| Template shape | Realistic first-pass |
|---|---|
| Simple (Download, Tool, Book A Call) | One-shot achievable with Step 0.5 + §10 |
| Blog fork (Compare) | One-shot achievable if Blog fork explicit |
| Medium unique (Customer Story) | 1–2 iterations likely |
| HIGH (Service, Technology) | Do not batch; expect 2–4 iterations |

**One-shot is a target, not a guarantee.** Gate 6 + iteration cap are the safety
net. Cost mode trades Opus fix loops and chat length — not fidelity.

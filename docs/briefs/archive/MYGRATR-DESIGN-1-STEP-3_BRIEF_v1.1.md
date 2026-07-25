# MYGRATR-DESIGN-1 Step 3 — Tier-1 Audit + Complex-Component Specs

| Field | Value |
|---|---|
| Phase ID | MYGRATR-DESIGN-1 (Step 3 of 11) |
| Brief version | v1.1 |
| Status | LOCKED for execution |
| Predecessor | Step 2 milestone closed (commits `e761a76` + `4c0514f`) |
| Successor | Step 4 — Storybook decision + conditional scaffold |
| Operating posture | Jake + Claude Code primary executor. Surgical Upwork dev consult only on blockers exceeding the half-day rule. |
| Estimated runtime | 4–5 working days |
| Parent brief | `docs/briefs/active/MYGRATR-DESIGN-1_BRIEF_v2.0.md` §Step 3 |

---

## Brief changelog

- **v1.1** — Audit pass against v1.0 surfaced six findings; four landed. **A1:** scope clarification — Step 3 produces specs for **complex components** (subset of UI mechanisms inside templates), not for whole templates. Best estimate 5–10 components, NOT 13 templates. **A2:** D1 + §3b + §3d restated to lock the **role** (simplest medium-complexity / highest-complexity) rather than identity (SERVICE / HOME). SERVICE and HOME remain working hypotheses; HALT 1 inventory confirms or replaces. **A3:** template walk corrected from "15" to "13 confirmed + 1 conditional TAXONOMY." **A4:** §4 Timing provenance reframed as per-spec thinking aid (which specific timings are shim-extracted vs manual vs CSS-inferred), explicitly NOT copy-paste boilerplate. **A5:** pre-flight #5 wording — proceed silently if `42`; only halt on unexpected values. **A6:** §0 read list extended to include `audit-output/design-1/probe-*.json` so Step 2 probe outputs inform spec drafting.
- **v1.0** — Initial draft. Locked decisions for SERVICE-first / HOME-second / section-level GSAP provenance / 4-halt cadence.

---

## 0. Read first (in order)

1. **CLAUDE.md** — current phase state, hard rules, debugging discipline
2. **`docs/briefs/active/MYGRATR-DESIGN-1_BRIEF_v2.0.md`** — parent brief; this Step 3 brief refines and supersedes §Step 3 within v2.0
3. **`docs/CE_SITE_TRUTH.md`** — template types and counts (13 confirmed + 1 TAXONOMY conditional per v2.0; UNKNOWN dropped), 33 collections, GSAP 3.12.5 in use
4. **`docs/MYGRATR_SCHEMA_DESIGN_DECISIONS.md`** — locked schema v1.2; the data-binding section of every spec references field paths from here
5. **`docs/CAPABILITY_LOG.md`** — Step 2 patterns (probe-first, HALT-discipline, Hard Rule #2)
6. **`docs/design/COMPONENTS.md`** — 22 primitives + Icon; Tier-1 specs reference these as composable inputs
7. **`docs/design/TOKENS.md`** — design tokens; spec timing values reference `--motion-*` / `--ease-*` / `--duration-*` tokens
8. **`audit-output/design-1/gsap-*.json`** — GSAP timeline captures (if present from Step 1; if absent, Step 3a regenerates for the pages hosting Tier-1 components)
9. **`audit-output/design-1/probe-*.json`** — Step 2 probe outputs (richtext, card, accordion-marquee, etc.). Scan these before drafting any spec — relevant probes already capture CE-source patterns that inform spec sections, especially §1 Behaviour and §3 Tech stack.

**Scope clarification.** Step 3 produces specs for **complex components**, not for whole templates. A "complex component" is a self-contained UI mechanism within a template (hero animation, filter grid, sticky reveal section, carousel) that meets the Tier-1 bar in §3a. One template may contain zero, one, or multiple Tier-1 components. Per-template REFERENCE.md docs are a separate Step 7 deliverable, not Step 3 output. Best estimate is 5–10 Tier-1 components total across all templates — actual count locked at HALT 1.

If any of these conflict with this brief, halt and surface to Jake. Do not silently reconcile.

---

## 1. Locked decisions (do not relitigate)

These were settled in pre-Step-3 planning. Apply throughout execution.

| # | Decision | Lock |
|---|---|---|
| D1 | First spec drafted | **The simplest medium-complexity Tier-1 component identified at HALT 1.** Working hypothesis: a Tier-1 component within the SERVICE template (per v2.0 brief §7 page-level fidelity target of 92%, suggesting medium complexity). If HALT 1's inventory surfaces a cleaner medium-complexity candidate elsewhere — or if SERVICE's Tier-1 component(s) roll up to "same as HOME" (i.e., shared hero pattern, no SERVICE-specific component) — that one goes first instead. The decision is the **role** (simplest medium-complexity), not the **identity** (SERVICE). |
| D2 | Halt cadence | **First medium-complexity (format-lock) + one high-complexity (stress-test) + batch eyeball at Step 3 close.** Specs between the two halt points run autonomous; specs after the second halt run autonomous to batch close. Working hypothesis: format-lock spec is SERVICE-something, stress-test is HOME hero. Confirmed at HALT 1. |
| D3 | GSAP shim provenance | **Section-level paragraph at top of §4 Timing, written per-spec — NOT copy-pasted boilerplate.** Each spec's provenance paragraph names which specific timings in that spec were shim-extracted vs manually-verified vs inferred from CSS, and surfaces concerns about that page's shim output if any (per F10/F11/F12 from v2.0 §15 DEV log). NO per-row provenance columns. The paragraph is a thinking aid for Claude Code AND a reliability signal for the spec reader, not decoration. |
| D4 | Tier-1 audit pass | **Half-day inventory walk before any spec is drafted.** Output: `docs/design/TIER_1_INVENTORY.md`. Locks the Tier-1 component count for the rest of Step 3. |
| D5 | Spec format | **8-section format from v2.0 brief §Step 3b.** Mandatory sections (verifier asserts file structure at Step 10). |
| D6 | Spec location | **`docs/design/components/{component-slug}.md`** — kebab-case slug. One spec per Tier-1 component. |

---

## 2. Pre-flight checks (read-only; halt on any failure)

1. `git status` clean, on `feat/design-1`, up to date with `origin/feat/design-1`.
2. `npm run build` in `site/` passes.
3. `npx tsc --noEmit` in `site/` passes.
4. `audit-output/design-1/` exists and contains Step 1 + Step 2 probe outputs.
5. **Supabase metadata refresh check (carried from v2.0 Step 0a):**
   ```sql
   SELECT metadata->'content_phase'->'content_migrations_rows'
   FROM migrations
   WHERE id = 'ce000000-0000-0000-0000-000000000002';
   ```
   Expected: `42`. If `42`, no action — proceed silently. If `38`, run the refresh from v2.0 brief §Step 0a, re-verify, then surface the action to Jake before continuing. If anything other than `42` or `38`, halt and surface immediately.
6. Working directories ready:
   ```bash
   mkdir -p docs/design/components
   ```

---

## 3. Hard rules (carried forward from v2.0; non-negotiable)

1. **No fabrication of CE site facts.** If a piece of CE design / behaviour information is not in `CE_SITE_TRUTH.md`, not in `audit-output/`, and Jake hasn't explicitly confirmed it from the live site, the spec says **unknown** and prompts Jake. Hard Rule #2.
2. **Probe-first dismissal protocol** (HALT 10 catch). Burden of proof is on dismissing a CE pattern, not adopting it. Custom class names (`faq-btn`, `line-1`) signal intentional brand design — evidence AGAINST artifact dismissal.
3. **No commit until Jake approves diff.** Always surface diff for review before committing.
4. **Tier-1 audit (Step 3a) locks the Tier-1 set before any complex-component spec is written.** Adding a component post-lock requires explicit brief deviation entry and version bump.
5. **The data-binding section of every spec references real Sanity field paths from MYGRATR_SCHEMA_DESIGN_DECISIONS.md.** No invented fields. If the live UI region doesn't have a clean schema field, surface as Schema-vs-reality finding (per v2.0 Step 7 reconciliation pattern, applied here in advance).

---

## 4. Step-by-step build order

### Step 3a — Tier-1 audit pass (~0.5 day)

**Output:** `docs/design/TIER_1_INVENTORY.md` — locked inventory locking the Tier-1 set for the remainder of Step 3.

**Process:**

Walk the **13 confirmed template types** (BLOG, BOOK_A_CALL, COMPARE, CUSTOMER_STORY, DOWNLOAD, HOME, REVIEW, SERVICE, STATIC, TEAM_MEMBER, TECHNOLOGY, TOOL, VIDEO) per CE_SITE_TRUTH.md §1 + v2.0 brief §7. Plus TAXONOMY conditional on §12.6 resolution if applicable. UNKNOWN was dropped during DESIGN-1 audit and is not in the walk set. For each template, identify components meeting Tier-1 criteria:

- Hero animations (likely GSAP scroll-triggered on /)
- Interactive state machines (TECHNOLOGY filter grid, COMPARE tool if present)
- Carousels with non-trivial behaviour (CUSTOMER_STORY)
- Hover-state reveal grids (TEAM_MEMBER)
- Sticky nav with transition behaviour
- Page-load reveal sequences
- Multi-step form interactions
- Video player wrappers with custom controls
- Calendly book-a-call interaction
- Hotjar/Clara chat trigger surfaces

**Tier-1 criteria (locked):**

- **High** — multi-stage timeline animation, non-trivial state machine, performance-sensitive
- **Medium** — interactive but with bounded state, library-supportable
- **Low** — interactive but mostly CSS / single-axis transitions

**TIER_1_INVENTORY.md format:**

```markdown
# Tier-1 Component Inventory

Locked at v1.0 by MYGRATR-DESIGN-1 Step 3a ({date}). Adding to this list 
post-lock requires brief deviation + version bump.

| # | Component | Live URL | Complexity | Screenshot ref | Recording ref |
|---|---|---|---|---|---|
| 1 | Hero animation | / | High | screenshots/tier-1/hero/01-fold.png … | recordings/tier-1/hero.mp4 |
| 2 | Technology grid filter | /technology | High | … | … |
| ... | ... | ... | ... | ... | ... |
```

**Best estimate locked at brief start: 5–10 components.** Actual count locked at end of Step 3a. Write that count into TIER_1_INVENTORY.md header.

**Halt-and-escalate triggers (Step 3a):**

- If actual count is **>10**, halt and surface to Jake. Time budget needs re-baselining.
- If actual count is **<4**, double-check the audit didn't miss anything before locking.

**Capture references:** screenshots and screen recordings live under `docs/design/components/_assets/{component-slug}/`. Capture fresh; don't rely on AUDIT-1 captures (44 total, insufficient for Tier-1 fidelity work).

**HALT 1 — Tier-1 inventory eyeball.** Surface to Jake:
- TIER_1_INVENTORY.md with locked count
- One-line rationale per component for the complexity rating
- Capture-asset directory tree

Jake approves count + complexity ratings. Then proceed to 3b.

---

### Step 3b — First spec (format-lock) (~1 day)

**Output:** `docs/design/components/{first-spec-slug}.md` — 8-section spec following the v2.0 brief §Step 3b template. The slug is determined by the component selected at HALT 1 as the simplest medium-complexity Tier-1 component.

**Working hypothesis: a SERVICE Tier-1 component.** Likely candidates per CE_SITE_TRUTH.md and v2.0 brief §7's 92% page-level fidelity target: a scroll-triggered section reveal, a sticky CTA, or a service-card hover-reveal grid. Confirmed at HALT 1.

**Why the first spec must be medium-complexity, not high:**

- The 8-section format is being stress-tested for the first time
- A medium-complexity component lets the format absorb the test without compounding "is the format wrong?" with "is this content extraction wrong?"
- High-complexity stress comes at HALT 3 (HOME), where the format is already validated

**The 8 mandatory sections (verifier-asserted at Step 10):**

```markdown
# {Component name}

**Live URL pattern:** {URL pattern where component appears}
**Sanity document type:** {document type if data-driven; "n/a — UI chrome" if not}
**Complexity:** High / Medium / Low
**Visual fidelity target:** {%} (per v2.0 brief §7 fidelity table)

## 1. Behaviour
[Plain language. What does the component do, in what order, in 
response to what triggers. No jargon. A non-author dev should be 
able to read this section and visualize the behaviour.]

## 2. State machine
[ASCII or mermaid diagram if non-trivial. Skip if single-state.]

## 3. Tech stack
**Library:** GSAP 3.12.5 / Framer Motion / CSS-only / Swiper 11
**Why:** [Justification per component. GSAP if reproducing live-site 
timelines; Framer Motion only if rebuilding from scratch with no 
live-site precedent; CSS-only if the live site is also CSS-only.]

## 4. Timing
**Provenance:** [Per-spec paragraph. Name which timings below were 
extracted via the Step 1 GSAP shim at 
`scripts/design/extract-gsap-timings.ts` (and from which 
`audit-output/design-1/gsap-*.json` file), which were 
manually verified against the live site with DevTools open, and 
which were inferred from CSS computed values. If the shim returned 
empty or partial output for this page — likely F10 pre-assignment 
or F11 lazy ScrollTrigger from v2.0 §15 — call that out here. If 
all timings on this spec are shim-extracted with no concerns, say 
so explicitly. This paragraph is a thinking aid and a reliability 
signal — boilerplate copy-paste defeats the purpose.]

| Phase | Duration | Easing | Stagger |
|---|---|---|---|
| Initial reveal | 600ms | --ease-emphasized | 80ms |
| ... | ... | ... | ... |

## 5. Breakpoints
**Desktop (≥1024px):** [behaviour]
**Tablet (768–1023px):** [behaviour]
**Mobile (<768px):** [behaviour, often simplified or disabled]

## 6. Data binding
| UI region | Sanity field path | Document type | Required? |
|---|---|---|---|
| Hero title | `service.title` | service | required |
| ... | ... | ... | ... |

(Verify every field path against MYGRATR_SCHEMA_DESIGN_DECISIONS.md 
§3 — DO NOT invent fields. If a UI region has no clean schema 
mapping, surface as Schema-vs-reality finding.)

## 7. Edge cases
- Empty data: [behaviour]
- Slow load / LCP: [behaviour, including LCP impact mitigation]
- Reduced motion (`prefers-reduced-motion: reduce`): [MUST be respected]
- Keyboard navigation: [tab order, focus management]
- Screen reader: [aria-live region usage if animation conveys information]

## 8. Acceptance criteria
- [ ] Plays through full timeline on desktop matching screen recording
- [ ] Falls back gracefully on `prefers-reduced-motion`
- [ ] Sanity field changes propagate to preview within 5s (Visual Editing wired in Step 8)
- [ ] No layout shift after animation completes
- [ ] Lighthouse performance not degraded vs current site (verified in QA-1)

## Schema-vs-reality findings (if any)
[If a live UI region requires data not in the schema, log here per 
v2.0 brief §Step 7 reconciliation pattern. Each finding gets a 
resolution-direction tag from the canonical enum: schema-relax, 
template-fallback, data-backfill, deferred-to-STATIC-1, 
deferred-to-SCHEMA-2, decision-needed.]
```

**Process:**

1. **Capture live-site behaviour.** Watch the page hosting the component (per HALT 1 inventory) on cloudemployee.io with DevTools open at desktop, tablet, mobile. Record video of scroll progression. Note hover states. Write §1 Behaviour from observation, not inference.

2. **GSAP timing extraction.** Run `scripts/design/extract-gsap-timings.ts` against the page hosting the component if not already in `audit-output/design-1/gsap-*.json`. Read the JSON. Write §4 Timing with the per-spec provenance paragraph at the top (per D3).

3. **Sanity data binding.** Open MYGRATR_SCHEMA_DESIGN_DECISIONS.md §3 for the relevant document type. Map every live UI region to a schema field. Where a region has no clean schema field, log as Schema-vs-reality finding.

4. **Edge cases + acceptance criteria.** Don't pad. Cover the cases that matter. Reduced-motion and keyboard nav are mandatory for any animation-heavy component.

5. **Cross-reference primitives.** §3 Tech stack and §1 Behaviour should reference primitives from `docs/design/COMPONENTS.md` where applicable (e.g., "uses A1 Button, A4 Card, B1 Heading"). The spec is a contract for composing existing primitives, not building new ones.

**HALT 2 — First-spec format eyeball.** Surface to Jake:
- The complete `docs/design/components/{first-spec-slug}.md`
- Screenshot reference set under `_assets/{first-spec-slug}/`
- One-line summary of any Schema-vs-reality findings
- Format adjustments requested (if any)

Jake locks the format. Then proceed to 3c.

---

### Step 3c — Mid-tier specs (autonomous batch) (~1.5 days)

**Output:** Specs for all medium-complexity Tier-1 components from the locked inventory (TIER_1_INVENTORY.md) that aren't the first spec (3b) or the high-complexity stress-test spec (3d).

Likely candidates per CE_SITE_TRUTH.md (verify against actual Step 3a inventory):
- TECHNOLOGY filter grid behaviour
- CUSTOMER_STORY carousel
- COMPARE interactive tool

**Process:**

For each component:
1. Capture live-site references (screenshots + recording).
2. Run GSAP timing extraction if not already captured.
3. Draft the 8-section spec following the format locked at HALT 2.
4. Cross-reference primitives.
5. Log Schema-vs-reality findings if any.
6. Write the §4 Timing provenance paragraph per-spec (D3) — not copy-pasted from the first spec.

**No halt during 3c.** All specs run autonomous to batch eyeball at Step 3 close. If a spec hits a blocker (schema field missing for a load-bearing UI region; GSAP timing shim returns empty for the page; live-site behaviour contradicts CE_SITE_TRUTH.md), halt and surface to Jake — Hard Rule #2.

---

### Step 3d — High-complexity stress-test spec (~1 day)

**Output:** `docs/design/components/{stress-test-slug}.md` — 8-section spec for the highest-complexity Tier-1 component identified at HALT 1.

**Working hypothesis: HOME hero animation.** Per v2.0 brief §7, HOME has the lowest fidelity target (88%) — i.e., the most complex animation surface. Confirmed at HALT 1.

**Why a high-complexity spec second:**

- Stress-tests the format under maximum animation complexity
- Surfaces format gaps the simpler first spec didn't reveal
- Locks the format finally before remaining specs run autonomous

**Process:** same as Step 3b but applied to the high-complexity component. Expected to surface format gaps. If gaps emerge, propose adjustments at HALT 3 — and back-port them to the first spec (3b) before proceeding to 3e.

**HALT 3 — Stress-test spec eyeball + format finalisation.** Surface to Jake:
- The complete `docs/design/components/{stress-test-slug}.md`
- Any proposed format adjustments observed during drafting (and back-port plan to first spec if changes needed)
- Schema-vs-reality findings count
- §4 Timing provenance — explicit honesty about which timings are reliable (per D3)

Jake approves. Format locks finally. Then proceed to 3e.

---

### Step 3e — Remaining specs (autonomous batch close) (~1 day)

**Output:** Specs for all remaining Tier-1 components in the inventory.

**Process:**

For each remaining component:
1. Capture references.
2. Run GSAP extraction if needed.
3. Draft 8-section spec.
4. Cross-reference primitives.
5. Log Schema-vs-reality findings.

**No halt.** All specs run autonomous to batch eyeball at Step 3 close.

---

### Step 3f — Step 3 close (~0.5 day)

**3f.a — Verifier readiness:**
- Each component in TIER_1_INVENTORY.md has `docs/design/components/{slug}.md` with all 8 sections present.
- Every spec's data-binding section references real fields from MYGRATR_SCHEMA_DESIGN_DECISIONS.md.
- Schema-vs-reality findings (if any) tagged with resolution-direction enum value.
- All capture assets under `docs/design/components/_assets/{slug}/`.

**3f.b — Capability log update.** Append to `audit-output/design-1/capability-log-draft.md`:
- Spec format methodology lessons (what sections worked; what was over- or under-spec'd)
- GSAP shim provenance pattern (section-level, not per-row — and why)
- Schema-vs-reality reconciliation patterns observed
- Customer-2 reusability annotation per pattern

**3f.c — Brief §15 deviation log.** Append any DEV-N entries that surfaced during Step 3 to v2.0 brief §15.

**3f.d — Commit:**

```bash
git add docs/design/TIER_1_INVENTORY.md
git add docs/design/components/
git add audit-output/design-1/capability-log-draft.md
git commit -m "feat(design-1): step 3 — tier-1 audit + complex-component specs (N components)"
# DO NOT push without Jake's explicit approval
```

**HALT 4 — Step 3 final close.** Surface to Jake:
- All specs for batch eyeball
- TIER_1_INVENTORY.md final
- Verifier-readiness summary
- Capability-log-draft additions
- Commit diff

Jake green-lights commit. Push only after Jake explicitly says "push." Step 3 closes.

---

## 5. Files created / modified

### Created

```
docs/design/TIER_1_INVENTORY.md
docs/design/components/{tier-1-component-1-slug}.md          (count from 3a)
docs/design/components/{tier-1-component-2-slug}.md
docs/design/components/{...all remaining Tier-1 components}.md
docs/design/components/_assets/{component-slug}/screenshots/*.png
docs/design/components/_assets/{component-slug}/recordings/*.mp4
audit-output/design-1/gsap-{page-slug}.json                  (if regenerated for any Tier-1 page)
```

### Modified

```
audit-output/design-1/capability-log-draft.md     (extended with Step 3 findings)
docs/briefs/active/MYGRATR-DESIGN-1_BRIEF_v2.0.md  (§15 deviations log if new DEV-N entries)
```

### Files NOT touched

```
SCHEMA.md                                          (no DB changes in Step 3)
src/lib/pipeline/state-machine.ts                  (no MigrationStatus changes)
docs/CAPABILITY_LOG.md                             (Step 9 consolidates the running draft)
CHANGELOG.md / PHASE_HISTORY.md / CONVENTIONS.md   (Step 11 updates these)
site/                                              (no code changes in Step 3)
```

**`migrations.status` unchanged at `content_complete`.** Step 3 is a spec-writing step; no state transition.

---

## 6. Halt-and-escalate triggers

Halt and surface to Jake before continuing if any of these occur:

1. Pre-flight check failure in Step 3 §2.
2. Tier-1 audit (Step 3a) yields >10 components — time budget needs re-baselining.
3. GSAP shim returns empty JSON for a Tier-1 page — investigate before drafting that page's §4 Timing (likely F10 pre-assignment issue or F11 lazy ScrollTrigger).
4. Live-site behaviour contradicts CE_SITE_TRUTH.md — recent design change on live site means audit data is stale.
5. Spec discovers Sanity schema is missing a load-bearing field — surface for STATIC-1 / SCHEMA-2 mini-phase. Do NOT modify schema in Step 3.
6. Two failed attempts at extracting timings for the same component — write `DEBUG_CONTEXT.md` per CLAUDE.md debugging rules. Do not improvise a third attempt.

---

## 7. Operating discipline

- **Probe-first.** Every CE-pattern decision backed by probe output or live-site visual confirmation. If you find yourself reasoning toward a "modern convention" that contradicts a probe-confirmed CE pattern, the CE pattern wins (HALT 10 lesson from Step 2).
- **No fabrication.** If schema doesn't have it AND probe doesn't show it AND Jake didn't confirm it — say "unknown" and ask.
- **Halt cadence is non-negotiable.** HALT 1 (Tier-1 inventory), HALT 2 (first-spec format lock), HALT 3 (stress-test spec format finalisation), HALT 4 (Step 3 close). Do not skip halts.
- **No commit until Jake approves diff.** Always surface diff for review.
- **Spec is the contract.** A subsequent TEMPLATE-* phase reads the spec and ships first-draft implementation. The contract holds Claude Code (or any subsequent dev) accountable to specific behaviour, not "make it like CE's site."

---

## 8. Exit criteria

Step 3 is Done when **all** of these hold:

1. `docs/design/TIER_1_INVENTORY.md` exists with locked component count.
2. Every component in TIER_1_INVENTORY.md has `docs/design/components/{slug}.md` with all 8 mandatory sections.
3. Every spec's §6 Data binding references real Sanity fields from MYGRATR_SCHEMA_DESIGN_DECISIONS.md (no invented fields).
4. Every spec's §4 Timing has the section-level GSAP shim provenance paragraph.
5. Schema-vs-reality findings (if any) tagged with resolution-direction enum value.
6. Capture assets under `docs/design/components/_assets/{slug}/` for every spec.
7. `audit-output/design-1/capability-log-draft.md` extended with Step 3 findings.
8. `npx tsc --noEmit` and `npm run build` in `site/` still pass (Step 3 should not touch `site/` source).
9. Commit landed on `feat/design-1` with Jake's explicit approval.
10. `migrations.status === 'content_complete'` (unchanged).

---

## 9. Next phase entry conditions

Step 4 (Storybook decision + conditional scaffold) entry requires:
- Step 3 closed per §8 above
- TIER_1_INVENTORY.md locked (Step 4 entry decision references the inventory)
- Capability-log-draft updated

Step 4 brief drafted in a new planning session after Step 3 close and post-phase doc refresh.

---

*End of MYGRATR-DESIGN-1-STEP-3_BRIEF_v1.0.md*

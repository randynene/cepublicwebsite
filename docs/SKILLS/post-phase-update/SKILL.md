**VERIFY:**
````bash
git diff PHASE_HISTORY.md | grep "^+" | wc -l
````

Expected: 30+ added lines for a normal phase. If fewer, the entry is too thin.

---

### STEP 3 — CONVENTIONS.md

**EVIDENCE:** Patterns you identified in the code. Not every phase establishes 
new patterns.

**UPDATE:**

**3a) For each genuinely new pattern**, add a section at the bottom:

````markdown
## [Pattern Name] ([Phase])

[2-3 sentence description of what the pattern is and why it exists]

```typescript
// Code example showing the pattern
```

**Rules:**
- [Bullet rules that must be followed when using this pattern]
````

**3b) Update the phase history table** at the bottom — ALWAYS, even if no new 
patterns:

````markdown
| [Phase] | Complete | [patterns established, or "No new patterns"] |
````

**VERIFY:**
````bash
git diff CONVENTIONS.md | grep "^+## " 
git diff CONVENTIONS.md | grep "^+|" | tail -5
````

Expected: Either new pattern headings OR a new row in the phase history table. 
One of these must be present.

**ANTI-RATIONALIZATION CHECK:** A "new pattern" is only a new pattern if 
someone in a future phase needs to know about it. One-off implementation 
details don't belong here.

---

### STEP 4 — FEATURE_MAP.md

**EVIDENCE:** Every new route, component, and lib file from Step 0.2.

**UPDATE:**

For each new feature:

````markdown
## [Feature Area]

### [Feature Name]
- **Description:** [What it does]
- **Page:** [Route or "None"]
- **API Routes:**
  - `[METHOD] /api/path` — [what it does]
- **Components:**
  - `src/components/path.tsx` — [what it does]
- **Lib Modules:**
  - `src/lib/path.ts` — [functions it exports]
- **DB Tables:** [tables read/written]
- **Phase:** [phase name]
````

For existing features that were modified: update the entry in place and append 
`(modified [Phase])` to the Phase field.

**VERIFY:** 
````bash
git diff FEATURE_MAP.md | grep "^+### " | wc -l
````

Expected: One new heading per new feature. Zero means either no new features 
(rare) or you forgot to update.

---

### STEP 5 — CLAUDE.md

**CLAUDE.md must stay under 40k characters.** Detail belongs in REGISTRY.md.

**EVIDENCE:** Phase status needs updating. New pages/routes/env vars from Step 0.2.

**UPDATE — six specific edits:**

**a) Phase status table** — mark completed phase ✅ AND update "Next" pointer:
````markdown
| [Phase] | [Name] | ✅ Complete |
| **[Next Phase]** | **[Name]** | 🔜 **Next** |
````

**ANTI-RATIONALIZATION CHECK:** Look at the entire phase table. Are there 
OTHER phases still marked "🔜 Next" or "Planned" that have actually shipped? 
If yes, update them too. Drift accumulates when only the current phase is 
updated.

**b) Pages table** — add any new authenticated routes (not API routes):
````markdown
| `/new/route` | Page description | [Phase] |
````

**c) API routes table** — add new API route groups:
````markdown
| [Area] | `/api/path/*` | [methods available] |
````

**d) Data state paragraph** — update if tables/rows changed materially:
````markdown
**Data state:** [Updated summary]
````

**e) Environment variables** — if new vars added, move from "To be added" to 
"Currently active":
````markdown
NEW_VAR=  (optional — purpose, [phase])
````

**f) Footer timestamp** — update the last line:
````markdown
*Last updated: [Month Year] — [Phase] complete. [Next Phase] next.*
````

**VERIFY:**
````bash
wc -c CLAUDE.md
git diff CLAUDE.md | grep "^+" | head -20
````

Expected: character count under 40,000. Diff shows updates to the 6 areas above.

**If CLAUDE.md truly needs no changes (rare — only pure doc-only phases):** 
produce evidence. Show that the phase status was already ✅ in a prior commit, 
show no new routes, no new env vars, no data state changes. Do not just say 
"looks complete."

---

### STEP 6 — docs/context/REGISTRY.md

**EVIDENCE:** Every new route, table, lib file, and component from Step 0.2.

**UPDATE — 4 sub-registries:**

**6a) Routes** — every new API route:
````markdown
| METHOD | Path | Handler file | Auth | Purpose |
|--------|------|-------------|------|---------|
| METHOD | /api/path | src/app/api/.../route.ts | Required | [What it does] |
````

**6b) Tables** — every new table:
````markdown
| Table | Phase | RLS | Purpose | Key columns |
|-------|-------|-----|---------|-------------|
| table_name | [Phase] | ✅ | [Purpose] | [key columns] |
````

**6c) Lib files** — every new lib file:
````markdown
| File | Exports | Purpose | Server/Client |
|------|---------|---------|--------------|
| src/lib/path.ts | functions | [Purpose] | Server/Client |
````

**6d) Components** — every new component:
````markdown
| Component | File | Props | Purpose |
|-----------|------|-------|---------|
| Name | src/components/path.tsx | props | [Purpose] |
````

**VERIFY:**
````bash
git diff docs/context/REGISTRY.md | grep "^+|" | wc -l
````

Expected: At least 1 new row per new route/table/lib/component. Compare 
against the count from Step 0.2.

**ANTI-RATIONALIZATION CHECK:** Go back to Step 0.2 output. Count new routes, 
new lib files, new components. REGISTRY.md must have that many new rows (at 
minimum).

---

### STEP 7 — SCHEMA.md

**EVIDENCE:** Migration list from Step 0.2.

**TWO PATHS:**

**Path A — No migrations this phase:**
No update needed TO TABLE DEFINITIONS. But you MUST still:
- Add a version history entry noting "No schema changes this phase"
- Update the header date if this phase post-dates it

Do not skip the version history entry. Every phase gets one.

**Path B — Migrations ran this phase:**

**7a) Update the Schema Overview table** — add new tables with 🆕 New marker.

**7b) Add full table definitions** for new tables in the New Tables section 
(all columns, types, CHECK constraints, indexes, RLS policies).

**7c) Update existing table definitions** if columns were added/modified.

**7d) Add a Schema Version History entry** — ALWAYS, regardless of Path:
````markdown
| v[X.Y] | [Date] | [Phase]: [What changed. Include: new tables, new columns 
(on which tables), new CHECK constraints, new indexes, new RPC functions, 
prompt changes, data migrations (gate_config resets, column backfills), 
model swaps. If "No schema changes this phase", say so explicitly.] |
````

**7e) Update the header date** at top of file to match the latest version 
entry.

**VERIFY:**
````bash
git diff docs/SCHEMA.md | grep "^+| v" 
git diff docs/SCHEMA.md | head -40
````

Expected: One new version history row. Header date updated. If migrations ran, 
also table definition changes.

**ANTI-RATIONALIZATION CHECKS (this is where Fix Sprint 2 failed):**

- **"Migrations were in an earlier commit, so SCHEMA.md is fine."** Wrong. The 
  version history entry is still required NOW. Mid-sprint commits capture 
  DDL. Post-phase updates capture the narrative version entry.

- **"No new tables were created, so SCHEMA.md doesn't need updating."** Wrong. 
  New COLUMNS on existing tables require updating the existing table 
  definition. Column additions, CHECK constraint additions, index additions, 
  RPC changes, prompt changes, data migrations — all need the version 
  history entry.

- **"Only prompts changed, not schema."** Prompt changes to the `prompts` 
  table count. Model swaps count. Prompts deactivated count. Version entry 
  required.

---

### STEP 8 — DECISIONS.md

**EVIDENCE:** Decisions locked during the phase (from the planning chat, from 
the brief, from execution surprises).

**TWO PATHS:**

**Path A — No new decisions locked:**
No update needed. Confirm in Step 9 report: "No new decisions locked this 
phase."

**Path B — Decisions locked:**

````markdown
## [Decision Title] ([Phase], [Date])

**Decision:** [What was decided, one sentence]
**Rationale:** [Why — 2-3 sentences]
**Implications:** [What this means for future builds]
**Locked:** Yes — do not re-open without explicit discussion
````

**VERIFY:**
````bash
git diff docs/DECISIONS.md | grep "^+## "
````

Expected: Either one or more new headings (Path B), or confirmed Path A in 
the final report.

**ANTI-RATIONALIZATION CHECK:** Decisions are architectural choices that 
future phases must respect. Implementation notes don't belong here. If in 
doubt, ask the planning chat.

---

## Step 9 — Final Verification Gate

Before declaring the skill complete, run these 8 checks. ALL must pass.

````bash
# Check 1: CHANGELOG has new entry
git diff CHANGELOG.md | grep -c "^+## \[Phase"

# Check 2: PHASE_HISTORY has new entry with 30+ lines
git diff PHASE_HISTORY.md | grep "^+" | wc -l

# Check 3: CONVENTIONS has phase row update
git diff CONVENTIONS.md | grep -c "^+| \["

# Check 4: FEATURE_MAP has new entries (if features were built)
git diff FEATURE_MAP.md | grep -c "^+### "

# Check 5: CLAUDE.md is under 40k and has updates
wc -c CLAUDE.md
git diff CLAUDE.md | grep -c "^+"

# Check 6: REGISTRY has row additions matching Step 0.2 counts
git diff docs/context/REGISTRY.md | grep -c "^+|"

# Check 7: SCHEMA.md version history has new entry
git diff docs/SCHEMA.md | grep -c "^+| v"

# Check 8: Type generation ran
ls -la src/types/supabase.ts
# Modified time should be today
````

If ANY check fails or returns 0 when it shouldn't, STOP and fix before 
committing.

---

## Step 10 — Commit

Single commit for the entire post-phase update:

````bash
git add CHANGELOG.md PHASE_HISTORY.md CONVENTIONS.md FEATURE_MAP.md \
        CLAUDE.md docs/context/REGISTRY.md docs/SCHEMA.md docs/DECISIONS.md \
        src/types/supabase.ts

git commit -m "docs([area]): [Phase] - post-phase context updates

- CHANGELOG.md: new [Phase] entry
- PHASE_HISTORY.md: detailed phase record
- CONVENTIONS.md: [N patterns added / phase row only]
- FEATURE_MAP.md: [N features added / N modified]
- CLAUDE.md: phase status, [pages/routes/env] updated
- REGISTRY.md: [N routes, N tables, N lib files, N components]
- SCHEMA.md: v[X.Y] [entry only / table definition changes]
- DECISIONS.md: [N decisions locked / none]
- src/types/supabase.ts: regenerated from live schema"
````

---

## Reporting Format

When complete, produce this report. Every line must have evidence backing it.

````markdown
## Post-Phase Update Complete — [Phase Name]

### Evidence
- Commits: [first-hash]..[last-hash] (N commits)
- Files changed: N
- Migrations applied: N (or "none")
- New routes: N (or "none")
- New lib files: N
- New components: N

### Files Updated
- CHANGELOG.md — ✅ [X]-line entry added
- PHASE_HISTORY.md — ✅ [X]-line entry added
- CONVENTIONS.md — ✅ [N patterns added / phase row only]
- FEATURE_MAP.md — ✅ [N new / N modified]
- CLAUDE.md — ✅ [Xk chars, N edits]
- REGISTRY.md — ✅ [N routes / N tables / N lib / N components]
- SCHEMA.md — ✅ v[X.Y] entry added [+ N table definition changes]
- DECISIONS.md — ✅ [N decisions / none]
- src/types/supabase.ts — ✅ regenerated

### Surprises / Drift Caught
[Any drift fixed beyond the phase scope, e.g. "Also marked SOC-1.2 as ✅ in 
CLAUDE.md — it had shipped but wasn't updated."]
[Or: "None."]

### Commit
[commit hash]

### Ready For
Red team audit → then next phase brief planning
````

---

## What This Skill Does NOT Do

- Does not write session briefs — that's the planning conversation
- Does not make architectural decisions — escalate to planning
- Does not run the red team audit — separate skill, runs after this
- Does not delete or rewrite existing entries — append only
- Does not add detail to CLAUDE.md that belongs in REGISTRY.md
- Does not skip files because they "look complete" — requires proof

---

## Failure Modes to Avoid

**1. Memory-based execution.** Updating files from what you remember about the 
phase instead of from git diff output. Always gather evidence in Step 0 first.

**2. Mid-sprint commit rationalization.** "This was already committed in 
commit X." Mid-sprint commits capture code. Post-phase captures narrative. 
BOTH required.

**3. Phase status update only on current phase.** The phase table in CLAUDE.md 
can drift across multiple phases. Always audit the entire table, not just 
the current row.

**4. Thin CHANGELOG entries.** One paragraph for a 12-commit sprint is 
inadequate. Expand.

**5. Skipping SCHEMA.md version entry.** Every phase needs a version history 
entry, even "no schema changes" phases.

**6. Skipping verification diffs.** The 8 checks in Step 9 are mandatory. 
Skipping them is how drift enters the codebase.
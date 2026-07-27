---
name: post-phase-update
description: Run the tiered post-phase context-file updates for Clara (CE Sales Brain) after a completed phase. Trigger when the user says the phase is done, "update the context files", "do the post-phase updates", "run the post-phase checklist", or when a build session has just sealed.
---

# post-phase-update (Clara / CE Sales Brain)

Runs the context-file updates after a completed phase, in the correct order, on
the TIERED CADENCE (not the old 8-file-every-time gate). The goal is to keep the
sacred docs accurate without paying an 8-file tax on every phase. This copy is
Clara-specific; it mirrors the post-phase gate in
`.cursor/rules/10-brief-standards.mdc`.

Trigger when the user says: "update the context files", "do the post-phase
updates", "run the post-phase checklist", "phase is complete, update everything",
or when a phase session has just ended.

---

## Canonical file paths (Clara repo: `ce-sales-brain`)

All `git` commands below run from the repo root. There is NO `insight-bank/`
prefix and NO `docs/context/` folder here. Clara's sacred docs split across the
repo root, `Master Docs/`, and `docs/`. Quote paths containing spaces
(`"Master Docs/..."`).

| File | Path (from repo root) |
|------|-----------------------|
| CURRENT_SPRINT.md | `Master Docs/CURRENT_SPRINT.md` |
| FULL_SCOPE.md | `Master Docs/FULL_SCOPE.md` |
| CLAUDE.md | `CLAUDE.md` |
| SCHEMA.md | `docs/SCHEMA.md` |
| REGISTRY.md | `docs/REGISTRY.md` |
| CONVENTIONS.md | `docs/CONVENTIONS.md` |
| CHANGELOG.md | `docs/CHANGELOG.md` |
| PHASE_HISTORY.md | `docs/PHASE_HISTORY.md` |
| PATCHES.md | `docs/PATCHES.md` |
| DECISIONS.md | `docs/DECISIONS.md` |
| WISHLIST.md | `docs/WISHLIST.md` (planning-owned, do NOT auto-edit) |

Clara has NO `FEATURE_MAP.md` and NO `src/types/supabase.ts` / type-gen step.
Do not invent or reintroduce either. Clara uses raw `pg` directly, never the
Supabase JS client.

---

## The cadence (read this first, it is the whole point)

Files split by how often they need updating. This matches
`10-brief-standards.mdc` exactly:

- **ALWAYS (every phase):** `Master Docs/CURRENT_SPRINT.md` (it drifts; keep it
  honest about what shipped, sessions added/reordered and why, forward plan
  re-pointed).
- **WHEN CHANGED:** `docs/SCHEMA.md`, `docs/REGISTRY.md`, `docs/CONVENTIONS.md`.
- **WHEN THERE IS SOMETHING REAL TO RECORD:** `docs/CHANGELOG.md`,
  `docs/PHASE_HISTORY.md`.
- **BRIEF-VS-REALITY DIVERGENCES:** `docs/PATCHES.md` (severity-labeled).
- **BIG PRODUCT / ARCHITECTURE CALLS ONLY:** `docs/DECISIONS.md` (append-only,
  D-B numbering; the D-B76 gap is INTENTIONAL, do not "fix" it).
- **CLAUDE.md:** status/orientation update whenever status or data state changed
  (it is the build-status spine and an always-applied workspace rule).

NO SILENT SKIPS. If a normally-updated file is left untouched, the final report
must say why in one line ("SCHEMA.md: no DDL, no version entry needed" is a valid
reason; silence is not).

---

## Verify (one rule, applies to every step)

- Every file you claim to update must show a real diff: `git diff <file>`.
- Every file you skip must carry a one-line reason in the final report.

That is the whole verification gate. No per-step grep ceremony.

---

## Step 0 — Evidence first (mandatory, never skip)

Never update a doc from memory (anti-memory discipline, per `00-core.mdc`).
Gather ground truth:

```bash
git log --oneline <phase-base>..HEAD
git diff --name-only <phase-base>..HEAD
git diff --name-only <phase-base>..HEAD | grep -E 'route.ts|lib/|apps/extension/|migrations/'
```

From this output, build the fact list the rest of the skill works from: new
routes, new tables/columns (DDL yes/no), new lib files, new components,
migrations WRITTEN (Jake applies them, never the agent), prompt changes,
decisions locked, brief-vs-reality divergences. Everything below traces to this
list.

---

## Step 1 — CURRENT_SPRINT.md (ALWAYS)

`Master Docs/CURRENT_SPRINT.md` is the one file that updates every phase. The
living record of plan-versus-reality. It drifts (hand-synced, was once frozen 9
briefs), so keep it honest.

Update:
- What shipped this phase (one or two lines).
- Any sessions ADDED or REORDERED mid-sprint, and WHY. This divergence log is the
  most valuable part.
- The forward plan / execution order, re-pointed to match reality.

---

## Step 2 — SCHEMA / REGISTRY / CONVENTIONS (WHEN CHANGED)

Update ONLY if this phase changed it. Use the Step 0 fact list to decide.

### SCHEMA.md — only if DDL ran or schema/prompts/data changed
SCHEMA.md is AUTHORITATIVE over migration history. If a migration was written:
update the overview table + table count, add/modify table definitions, add a
version-history entry, update the header date. (Note: the agent WRITES
migrations; Jake APPLIES them. Reflect what Jake confirmed applied.)
If NO DDL: a version entry is OPTIONAL, skip unless prompts/indexes/RPCs/data
migration changed. State the skip reason.

### REGISTRY.md — only if new routes / crons / jobs / skills / lib files / tables
One row per new item (webhook routes, cron routes, job endpoints, skill
endpoints + markdown, Slack channels, integration IDs). Count matches the Step 0
fact list.

### CONVENTIONS.md — only if a genuinely new, reusable guardrail emerged
A convention belongs here only after a pattern has survived and a FUTURE phase
needs it. One-offs do not. Conventions are proposed in DECISIONS.md, signed off
by Jake, then added here — never silently. (Clara is at 23 conventions.)

---

## Step 3 — CHANGELOG / PHASE_HISTORY (WHEN THERE IS SOMETHING REAL)

Not mandatory every phase. Update when the phase shipped something worth a
narrative record. Trivial phases skip both, stated in the report.

- CHANGELOG.md: terse per-phase delta, reverse-chronological — what shipped and
  what now exists.
- PHASE_HISTORY.md: the narrative paragraph per phase (files, patterns, data
  state, costs, prod-smoke result).

---

## Step 4 — PATCHES.md (BRIEF-VS-REALITY DIVERGENCES)

Log every divergence between what the brief said and what reality required,
severity-labeled. This is a Clara-specific tier. If the brief was silent on
something and a decision had to be made mid-build, or the spec drifted from the
code, it gets a PATCHES entry. WISHLIST candidates are surfaced from here (Jake
moves them into WISHLIST.md; the agent never edits WISHLIST.md directly).

---

## Step 5 — DECISIONS.md (BIG PRODUCT / ARCHITECTURE CALLS ONLY)

Append-only, rarely touched, D-B numbering. Add an entry ONLY for a decision a
future phase must respect. The agent NEVER invents a decision — only records ones
Jake authorized. Implementation notes do NOT belong here. The D-B76 gap is
intentional; do not renumber to close it.

```markdown
### D-B[NN]. [Decision Title] ([Brief], [Date])
**Decision:** [one sentence]
**Rationale:** [2-3 sentences]
**Implications:** [what this means for future builds]
**Locked:** Yes, do not re-open without explicit discussion
```

---

## Step 6 — CLAUDE.md (status spine)

`CLAUDE.md` lives at the repo root and is an always-applied workspace rule, so a
fresh session reads it wholesale every time. Keep it tight and current. Update
when status or data state changed:
- Mark the completed phase, update the "Next =" pointer.
- Audit the whole state for other items that shipped but still read "next" or
  "planned".
- Update the data-state paragraph (table count, signal counts, scored counts) if
  it changed.
- Update any live flags / gates a fresh session must know.
- Update the table count line and conventions count if SCHEMA/CONVENTIONS moved.

### Layering — if CLAUDE.md is getting heavy, relocate by type (never delete)
CLAUDE.md is the top sheet; REGISTRY.md and PHASE_HISTORY.md are the depth. When
it gets heavy, MOVE detail down, do not lose it:
- Per-phase narrative / footers → PHASE_HISTORY.md
- Route / cron / table / file / function inventories → REGISTRY.md
- Keep in CLAUDE.md ONLY: the current-state summary, the live data-state line,
  the active gates/flags, and the "Next =" pointer.
A trim is a MOVE. After relocating, the fact still lives somewhere a fresh
session can grep it.

---

## Step 7 — Final report

```markdown
## Post-Phase Update Complete — [Brief Name]

### Evidence
- Commits: [range] (N commits)
- DDL this phase: [yes, migration NNNN written/applied / no]
- New routes / crons / lib / components: N / N / N / N
- Decisions locked: N
- Patches logged: N

### Files updated (tiered cadence)
- Master Docs/CURRENT_SPRINT.md — ALWAYS — updated (incl. divergence log)
- docs/SCHEMA.md — [updated vX.Y / skipped: no DDL]
- docs/REGISTRY.md — [N rows / skipped: nothing new]
- docs/CONVENTIONS.md — [N guardrails / skipped: no new reusable pattern]
- docs/CHANGELOG.md — [updated / skipped: nothing narrative-worthy]
- docs/PHASE_HISTORY.md — [updated / skipped: nothing narrative-worthy]
- docs/PATCHES.md — [N divergences / skipped: brief matched reality]
- docs/DECISIONS.md — [N decisions / skipped: no architectural call]
- CLAUDE.md — [status + data-state updated / skipped: no status change]

### Drift caught
[e.g. "CLAUDE.md still said 22 conventions; corrected to 23." or "None."]

### Commit
[hash]

### Ready for
Red-team / cross-model audit, then next phase brief.
```

Every "skipped" line carries its one-line reason. That is the no-silent-skips
rule.

---

## Step 8 — Commit

Stage ONLY the files you actually changed (explicit paths, never `git add -A` or
`git add .`). Jake approves the commit message before committing.

```bash
git add "Master Docs/CURRENT_SPRINT.md" \
        CLAUDE.md \
        docs/REGISTRY.md
        # ...and any other docs/ or Master Docs/ files you touched this phase

git commit -m "docs: [Brief] post-phase context updates (tiered)"
```

---

## What this skill does NOT do
- Does not write session briefs (that is planning / Plan mode).
- Does not make architectural decisions (escalate to Jake; record only what was
  authorized).
- Does not run the red-team / cross-model audit (separate step, after this).
- Does not rewrite history docs to match the present.
- Does not edit `docs/WISHLIST.md` (planning-owned; surface candidates via
  PATCHES.md instead).
- Does NOT apply migrations, touch env vars, or deploy. Those are Jake-only gates
  (see `.cursor/rules/30-safety.mdc`).

---
name: red-team-audit
description: >
  Performs a systematic architectural and code quality audit on the cited.io codebase.
  Use this skill whenever the user asks to: "run a red team audit", "audit the codebase",
  "check for technical debt", "clean up the code", "verify conventions", "check for drift",
  "pre-phase cleanup", or "post-phase audit". Also trigger when the user asks whether the
  code is consistent with CONVENTIONS.md or CLAUDE.md. This skill should be used after
  every completed phase and before starting any new phase brief.
---

#  Red Team Audit

You are performing a systematic code quality and architectural audit on the cited.io codebase.
This is a **post-phase verification pass** — not a feature build. Do not change logic. Do not
refactor beyond what the checklist items explicitly require. Fix only what fails a check.

## Before You Start

1. Read `CLAUDE.md` — understand current phase status and what was just built
2. Read `CONVENTIONS.md` — this is the source of truth for all patterns
3. Read `FEATURE_MAP.md` — know what files exist and what they own
4. Identify the **session type** of the last phase (Type A AEO / Type B Social / Type C Infra)
   and scope the audit accordingly. Type A only touches AEO files. Type B only Social files.
   Type C touches shared infrastructure.

---

## Audit Checklist

Work through each section in order. For each item: CHECK → REPORT → FIX (if failing).
Report all findings before fixing anything — give the user a full picture first.

---

### SECTION 1 — FILE NAMING

- [ ] All API routes are in `kebab-case` folders with a `route.ts` file
  - Check: `src/app/api/**`
  - Fail pattern: `camelCase` folder names, non-`route.ts` filenames
- [ ] All lib modules are `kebab-case.ts`
  - Check: `src/lib/**`
- [ ] All components are `kebab-case.tsx`
  - Check: `src/components/**`
- [ ] All type files are `kebab-case.ts` (plural noun preferred)
  - Check: `src/types/**`

---

### SECTION 2 — FUNCTION NAMING

- [ ] All exported lib functions are `camelCase` verb-first (e.g. `extractInsights`, `listPillars`)
- [ ] All components are `PascalCase`
- [ ] All type interfaces are `PascalCase`
- [ ] All type constants are `SCREAMING_SNAKE_CASE`

---

### SECTION 3 — ROUTE HYGIENE

For every `route.ts` file touched in the last phase:

- [ ] Route handler contains NO business logic — all logic is delegated to `/lib`
- [ ] Route is wrapped in try-catch
- [ ] Route returns `{ success: boolean, ...data }` on success
- [ ] Route returns `{ success: false, error: string }` with appropriate status code on failure
- [ ] Error message extracted via `error instanceof Error ? error.message : 'Unknown error'`

If a route file contains conditional logic, data transformation, or AI calls beyond a simple delegation call — that logic belongs in `/lib`. Flag it.

---

### SECTION 4 — ORG_ID COMPLIANCE

This is the most critical multi-tenancy check.

- [ ] Every AEO table query includes `.eq('org_id', ...)` filter
  - Check all files in `src/lib/aeo/**`
  - A missing `org_id` filter is a **P0 issue** — flag it prominently
- [ ] No new AEO tables were created without an `org_id uuid` column
  - Cross-reference `SCHEMA.md` for any new tables added this phase
- [ ] Every occurrence of `DEFAULT_ORG_ID` has a `// TODO: MULTI_TENANT_MIGRATION` comment on the same line

Search command:
```bash
grep -rn "DEFAULT_ORG_ID" src/ --include="*.ts" --include="*.tsx"
```

Report every file and line. Add the TODO comment to any missing one.

---

### SECTION 5 — ERROR HANDLING

- [ ] No silent catches — every catch block either throws, logs, or pushes to an errors array
- [ ] Fatal errors (missing env vars, API failures) use `throw new Error(...)`
- [ ] Recoverable errors in batch operations use `result.errors.push(...)` pattern
- [ ] No empty catch blocks: `catch (e) {}`

Search:
```bash
grep -rn "catch" src/lib/ --include="*.ts" -A 1
```

Flag any catch block followed by a blank line or closing brace.

---

### SECTION 6 — ENV VAR COMPLIANCE

- [ ] No direct `process.env.X` access in any `/lib` file
  - All env vars must come from `src/lib/env.ts`
- [ ] Any new env vars added this phase are defined in `src/lib/env.ts`
- [ ] Optional env vars (DataForSEO, Firecrawl, Perplexity) have runtime guards before use

Search:
```bash
grep -rn "process\.env\." src/lib/ --include="*.ts"
```

Any result that isn't inside `src/lib/env.ts` itself is a fail.

---

### SECTION 7 — SUPABASE CLIENT USAGE

Three clients exist for three contexts. Wrong client = auth bypass or context errors.

| Context | Correct Client |
|---------|---------------|
| API routes (service role, bypasses RLS) | `createServerClient()` from `@/lib/supabase/server` |
| Server Components with user context | `createAuthClient()` from `@/lib/supabase/auth-server` |
| Client components (`'use client'`) | `createClient()` from `@/lib/supabase/client` |

- [ ] No `createServerClient()` inside a `'use client'` component
- [ ] No `createAuthClient()` inside an API route
- [ ] No mixing of client types within a single file

---

### SECTION 8 — DEPRECATED CODE

These functions are deprecated and must not be called anywhere.

Deprecated in AEO-S1d (`src/lib/aeo/keyword-clusters.ts`):
- [ ] No calls to `expandPillarKeywords`
- [ ] No calls to `deriveSeedKeywords`
- [ ] No calls to `filterKeywordsByRelevance`

Deprecated in AEO-S1c (`src/lib/aeo/keyword-expansion.ts`):
- [ ] No calls to `generateTofuCandidates`
- [ ] No calls to `importCandidates`

Search:
```bash
grep -rn "expandPillarKeywords\|deriveSeedKeywords\|filterKeywordsByRelevance\|generateTofuCandidates\|importCandidates" src/ --include="*.ts" --include="*.tsx"
```

If found in any file other than their definition file: remove the call.
If the function bodies themselves still exist with no callers: **delete them** (do not leave dead code).

---

### SECTION 9 — TYPE SAFETY

- [ ] No untyped `any` without an explanatory comment: `// eslint-disable-next-line @typescript-eslint/no-explicit-any — [reason]`
- [ ] All external API response shapes are typed before use (DataForSEO, Firecrawl, Anthropic, OpenAI)
- [ ] Interface and type definitions live in `src/types/*.ts` — not inline inside lib files

Search:
```bash
grep -rn ": any" src/ --include="*.ts" --include="*.tsx"
grep -rn "as any" src/ --include="*.ts" --include="*.tsx"
```

---

### SECTION 10 — STYLING COMPLIANCE

CONVENTIONS.md enforces Tailwind-only styling. These are hard rules, not preferences.

- [ ] No `style={{}}` props on any element
- [ ] No `style={}` attribute usage anywhere in `.tsx` files
- [ ] No hardcoded hex values in components (e.g. `#0B1A2E`, `#B8E62E`) — must use brand tokens
- [ ] No `<style>` tags inside component files
- [ ] No CSS module imports (`*.module.css`)
- [ ] No styled-components or Emotion imports

Search:
```bash
grep -rn "style={{" src/components/ src/app/ --include="*.tsx"
grep -rn "#[0-9A-Fa-f]\{6\}" src/components/ src/app/ --include="*.tsx"
```

For each hit: replace inline style with equivalent Tailwind class. Replace hardcoded hex with the appropriate brand token (`ce-navy`, `ce-lime`, `ce-teal`, `ce-surface`, `ce-muted`, `ce-text`, `ce-text-muted`, `ce-border`).

---

### SECTION 11 — IMPORT ORDERING

Spot-check 5 files from the last phase. Correct order:

1. `'use client'` directive (if needed)
2. React
3. Next.js
4. External libraries
5. Internal lib (`@/lib/...`)
6. Internal types (`@/types/...`)
7. Internal components (`@/components/...`)

Flag any file with imports clearly out of order.

---



### SECTION 12 — WORKSPACE ISOLATION

**If last session was Type A (AEO):**
- [ ] No files in `src/app/social/**` were modified
- [ ] No social tables touched (`generated_posts`, `content_ideas`, `radar_jobs`)

**If last session was Type B (Social):**
- [ ] No files in `src/app/aeo/**` were modified
- [ ] No AEO tables touched (`content_pillars`, `topic_groups`, `content_records`, `research_jobs`)

**If last session was Type C (Infra):**
- [ ] Changes were limited to shared surfaces: sidebar nav, pipeline, auth, insights
- [ ] Both workspace teams notified via CLAUDE.md update

---

## Reporting Format

After running all checks, produce a report in this format:

```
## Red Team Audit Report — [Phase Name] — [Date]

### ✅ Passed
- [list of sections that passed cleanly]

### ⚠️ Minor Issues (fixed)
- [description + file + line + what was changed]

### 🚨 Critical Issues (requires attention)
- [P0 issues — org_id leaks, silent auth bypasses, deprecated function calls]

### �� Deferred (tracked debt)
- [issues that are real but not safe to fix without a dedicated session]

### Recommendation
[One paragraph: is this codebase ready to proceed to the next phase brief?]
```

---

## After the Audit

If the audit passes (or minor issues are fixed):

1. Update `CHANGELOG.md` with a one-line audit entry
2. Tell the user: **"Codebase is clean. Ready to plan [next phase]."**

If critical issues are found:

1. Do NOT proceed to the next phase brief
2. Create a focused fix session scoped only to the failing items
3. Re-run the audit after fixes before moving on

---

## What This Skill Does NOT Do

- Does not refactor working logic for style
- Does not change data models or schema
- Does not touch files outside the last session's workspace type
- Does not make architectural decisions — escalate those to the planning conversation

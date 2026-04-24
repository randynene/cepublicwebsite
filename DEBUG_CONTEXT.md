# DEBUG_CONTEXT — MYGRATR-SCAFFOLD-1

## 2026-04-25 — Step 6d brief inconsistency: 317 Webflow redirects source

**Where I was:** Step 6d (next.config.ts redirects), specifically constructing
`site/src/lib/redirects/webflow-redirects.ts`.

**The conflict in the brief:**

Step 6a lists three redirect sources:

> 3. `docs/investigations-2026-04-23/redirects-verification.md` — 317 individual
>    heterogeneous Webflow redirects + 1 catch-all regex for `/live-job-role/*`

Step 6d says:

> The 317 heterogeneous redirects from `redirects-verification.md` — create
> `site/src/lib/redirects/webflow-redirects.ts` as follows:
> 1. Open `docs/investigations-2026-04-23/redirects-verification.md`
> 2. Extract every redirect entry into a typed array...
> ...
> This file is hand-authored from the verified markdown source, not generated
> by a script.

**The reality:** `redirects-verification.md` (154 lines) contains only summary
statistics + 5 illustrative examples. It does NOT contain 317 redirect entries.
The actual 317 heterogeneous rows are in `audit-output/webflow-redirects.csv`
(653 rows total: 336 `/live-job-role/*` collapsed to one regex + 317 others),
which is gitignored.

The brief's other guidance contradicts the "hand-authored" instruction:

> **Critical:** `audit-output/` is gitignored and will not exist on Vercel's
> build server. `next.config.ts` must never import directly from
> `audit-output/`. Instead, run a one-time extraction script that reads from
> `audit-output/` and writes the redirect data into a tracked file inside
> `site/`.

That establishes the pattern already used for `ce-canonical-urls.json`
(`scripts/scaffold/extract-redirects.ts`).

**Decision taken (deviation from literal brief):**

I extended `scripts/scaffold/extract-redirects.ts` to also read
`audit-output/webflow-redirects.csv`, filter out `/live-job-role/*` rows
(covered by the locked catch-all regex) and rows that overlap with
`lockedRules` in `next.config.ts`, and write
`site/src/lib/redirects/webflow-redirects.ts` (tracked) using the same
generated-file convention as `generated-redirects.ts`.

**Why this is the most-defensible path:**

- Preserves the brief's stated *goal* (all 317 entries in
  `next.config.ts`).
- Preserves the brief's stated *constraint* (next.config.ts only imports
  tracked files).
- Matches the existing extraction-script pattern from Step 6c.
- "Hand-authoring" 317 entries from a markdown that doesn't list them is
  impossible.

**What needs review by Jake:**

If the brief intended `webflow-redirects.ts` to be hand-curated rather than
auto-generated, the file should be edited manually after a CONTENT-1
review pass. As of SCAFFOLD-1 it is auto-generated and re-running
`npm run redirects:extract` would overwrite local edits. A header comment
on the generated file warns of this.

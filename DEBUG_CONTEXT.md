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

---

## 2026-04-25 — Step 8c gate: Vercel deploy + scaffold:complete

**Where I am:** Step 8c (Vercel preview deploy) and Step 8d
(scaffold_complete transition). Both require user-driven actions —
auto mode does not permit pushing to remote or modifying shared
deployment settings without explicit confirmation.

**Current state of the branch (`feat/scaffold-1`, local only):**

- 9 commits, all green locally.
- `npm run build` passes in `site/` with zero TS / ESLint errors.
- `migrations.status = scaffold_running` already set via
  `npm run scaffold:start -- --confirm`.

**Local smoke test results (against `npm run start` on
http://localhost:3000):**

| Check | Result |
|---|---|
| `/` returns 200 | ✓ |
| `/uk` returns 200 (308 redirect to `/uk/` for the trailing slash) | ✓ |
| `/uk/` returns 200 | ✓ |
| `/team` → `/about-us` (308) | ✓ |
| `/our-work` → `/customer-stories` (308) | ✓ |
| `/live-job-role/some-test-slug` → `talent.cloudemployee.io` (308) | ✓ |
| `/after-care` → `/how-it-works` (308) — sample webflow row | ✓ |
| `/sitemap.xml` returns 200 with valid XML containing homepage | ✓ |
| `/robots.txt` returns 200 with `Disallow: /download-thank-you/` | ✓ |
| GTM `GTM-WL45TCTW` present in page source | ✓ |
| GeoTargetly inline tag present in page source | ✓ |

Note: Next.js's `permanent: true` emits HTTP 308 (preserves request
method) rather than 301. The brief's "(301)" wording is functionally
equivalent for SEO; this is the documented Next.js behaviour.

**What's left for Jake to drive:**

1. Confirm Vercel project root directory is set to `site`. If the
   Vercel project doesn't exist yet, create it and point Root Directory
   to `site` before pushing.
2. Confirm I have permission to push `feat/scaffold-1`, OR push it
   yourself with `git push -u origin feat/scaffold-1`.
3. Once the Vercel preview deploy is live, give me the preview URL.
4. I'll then re-run the smoke tests against the preview URL and run
   `npm run scaffold:complete -- --confirm --preview-url=<url>` to
   transition to `scaffold_complete`, then proceed to Step 9 (merge +
   post-phase docs).

The branch is locally complete and ready to ship — the only outstanding
items are the deploy + verification on the preview URL.

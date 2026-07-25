# MYGRATR-DESIGN-1 Brief B — Step 8: Visual Editing Wiring

| Field | Value |
|---|---|
| Phase ID | MYGRATR-DESIGN-1 (Step 8 of 11) |
| Brief version | v2.2 |
| Status | **LOCKED** (post-aop0 cross-model audit absorption — 3 new findings I5/M7/M9 absorbed; 7 prior v2.1 findings re-confirmed as already-absorbed verification reminders) |
| Predecessor | `5726e38` (Brief B HALT 1 closed — Step 6 UI_STRINGS lint + canonical SoT) + `de773ad` (context-catchup landed — Brief A drift + Brief B Step 6 post-phase doc cycle) |
| Successor | Brief C (Steps 7 + 9 + 10 + 11 — per-template REFERENCE.md docs + capability log final + verifier + DESIGN-1 close) |
| Operating posture | Jake + Claude Code primary executor. Surgical Upwork dev consult only on blockers exceeding the half-day rule. |
| Estimated runtime | ~1.5 working days for Step 8 (5 architectural pieces + 2 pre-flight passes + smoke test + integration tests + CONVENTIONS) |
| Halts | 2 (HALT 2 = Step 8 infrastructure 8.1–8.6 close; HALT 3 = Brief B close after smoke test + CONVENTIONS + capability log consolidation) |
| Commits | 2 (1 per halt) |
| Parent brief | `docs/briefs/active/MYGRATR-DESIGN-1_BRIEF_v2.0.md` §Step 8 |

---

## Section index (for spot-check before deep read)

- **§0** Read first (in order) — 7 inputs
- **§1** Locked decisions (carry-forward from Brief B v1.3) — D4, D5, D6, D14 + new D15
- **§2** Pre-flight checks (read-only; halt on failure) — 17 items, post-Step-6 baseline (item #17 added per F14 v2.1)
- **§3** Hard rules (carried forward; non-negotiable) — 9 rules
- **§4** Step-by-step build order
  - **§8.0** Pre-Step-8 environment probe (~10 min)
  - **§8.0a** Token scope re-confirmation + draft-read probe (F3 v2.1) + previewSecret read probe (F9 v2.1) (~5 min)
  - **§8.0b** Studio URL env var on Vercel preview (~5 min)
  - **§8.0c** Studio URL env var on Vercel production (~5 min)
  - **§8.1** Tighten env schema (per D14; F5 v2.1 Zod refinement)
  - **§8.1.5** Probe `createClient` stega behavior with `studioUrl: undefined` (F4 v2.1)
  - **§8.2** Add serverToken to defineLive (per D5)
  - **§8.3.0** Pre-refactor previewClient grep evidence (BEFORE state)
  - **§8.3** Single-client collapse with tightened stega gating (per D4 + D5 + F-4)
  - **§8.3.N** Post-refactor previewClient grep evidence (AFTER state)
  - **§8.4** presentationTool method probe via DevTools network inspection (per F-1 + F-5)
  - **§8.5** Enable route: GET with hardened Referer/Origin + secret + same-origin redirect (per D6 + F-1/F-2/F-6/F-7/F-12)
  - **§8.6** Disable route: POST with dual Origin + Referer check (per D6 + F-3 Option A)
  - **HALT 2** — Step 8 infrastructure 8.1–8.6 complete, surface for eyeball
  - **§8.7** Smoke test + integration tests (a)/(b)/(c)/(d.1–d.4)/(d.5)/(e) — manual round-trip + security-order verification + null-origin guard (F8 v2.1) + 500-path Set-Cookie absence (F6 v2.1)
  - **§8.8** CONVENTIONS.md additions (1 supersession + 4 new patterns)
  - **§Brief B close** — capability log consolidation (pull from running draft at HALT 3)
  - **HALT 3** — Brief B close, surface for eyeball
- **§5** Files created / modified
- **§6** Halt-and-escalate triggers — 21 items (6 added vs v2.0: F3/F4/F6/F8/F9/F10 v2.1)
- **§7** Operating discipline
- **§8** Exit criteria — 14 items
- **§9** Next phase entry conditions (Brief C)

---

## v2.1 + v2.2 quick-reference for execution

This brief is 1800+ lines. The vast majority is v2.0 content carried forward verbatim, with v2.1 adding panel-audit absorptions and v2.2 adding 3 surgical fixes on top. If you have already executed against v2.0 mentally and are now re-reading the locked v2.2, **these are the only sections that changed** — skim past everything else:

### v2.2 additions (3 surgical sites, all mechanical fixes):

| Section | v2.2 change | Finding |
|---|---|---|
| §8.3.2 | `console.error` → `console.warn` in raw-env safety check (alert-storm mitigation); comment block expanded with Sentry/Datadog/PagerDuty severity-mapping rationale | I5 v2.2 |
| §8.3.3 + §8.5 | `!env.SANITY_API_READ_TOKEN` → `!env?.SANITY_API_READ_TOKEN` (optional chaining); inline comment explaining native-TypeError mask without `?.` | M7 v2.2 |
| §8.1.5 | Probe emits single-token `OUTCOME: THROWS` or `OUTCOME: ACCEPTS` + detail lines; dispatcher uses `grep -q "^OUTCOME: THROWS$"` exact match | M9 v2.2 |

### v2.1 additions (the deeper structural absorptions — still load-bearing in v2.2):

| Section | Change | Finding(s) |
|---|---|---|
| §8.0a | Steps 2 + 3 added: draft-read probe + previewSecret-read probe | F3 v2.1 + F9 v2.1 |
| §8.0c | Prose corrected: v2.0 claimed env startup-fail; was untrue with `.optional()` alone | F5 v2.1 |
| §8.1 | Zod `.refine()` added to `NEXT_PUBLIC_SANITY_STUDIO_URL` — enforces presence in non-dev | F5 v2.1 |
| **§8.1.5** | **NEW section** — `createClient` stega behavior probe with `studioUrl: undefined`; shell-level outcome dispatcher selects §8.3.2 code path | F4 v2.1 |
| §8.3.0 + §8.3.N | Secondary path-based grep added alongside symbol grep (catches dynamic imports + barrel re-exports) | F10 v2.1 |
| §8.3.2 | Stega gate rewrite: Branch B drops `NODE_ENV` clause; v2.0 unreachable throw replaced with reachable raw-env `console.error` + force `stegaEnabled = false`; `let` not `const`; Branch A intent comment | F1 + F2 + F15 v2.1 |
| §8.3.3 (and mirror in §8.5) | Defensive throw on `!env.SANITY_API_READ_TOKEN` at module-scope helper construction — converts silent 401 into explicit startup crash on circular-import edge | F12 v2.1 |
| §8.5 enable route | (1) Allow-list construction adds explicit `"null"` + empty-string guard; (2) catch block: bare `catch {}` → `catch (err)` with prohibition comment + Sentry/Datadog forwarding ban; (3) F14 inline comment on allow-list optional-Studio-URL behavior | F7 + F8 + F14 v2.1 |
| §8.6 disable route | (1) Same `"null"` + empty-string guard as §8.5; (2) `originAllowed`/`refererAllowed` normalised to explicit booleans; (3) Referer-stripping edge-case comment + Tech Debt #18 queued for TEMPLATE-*; (4) F14 inline comment | F8 + F11 + F13 + F14 v2.1 |
| §8.7 | 3 new sub-tests added — (d.5a) disable + literal `Origin: null`; (d.5b) enable + literal `Origin: null`; (e) `validatePreviewUrl` exception 500 with Set-Cookie absent. Test (e) uses inline-env override (`SANITY_API_READ_TOKEN=invalid_token_for_test_e npm run dev`) — `.env.local` is never modified. ALL curls now include `--cookie /dev/null --cookie-jar /dev/null` | F6 + F8 v2.1 |
| §8.8 CONVENTIONS Entry 3 | Mirrors §8.5 catch-block prohibition; documents F8/F11/F13/F14 amendments in prose | F7 + F8 + F11 + F13 + F14 v2.1 |
| §2 pre-flight | Check #17 added: `NEXT_PUBLIC_SANITY_STUDIO_URL` local presence if local Studio is running | F14 v2.1 |
| §6 halt triggers | 6 new triggers (was 14, now 21) — F3/F4/F6/F8/F9/F10 | — |
| §1 locks (D5, D14) | Lock prose updated to reflect v2.1 stega gate shape + F5 schema refinement | F1+F2+F5 v2.1 |
| §5 artifact list | 4 new artifact files (draft-read-probe.md, preview-secret-read-probe.md, stega-studio-url-undefined-probe.md, sanity-client-path-callers-{before,after}.txt) | F3+F4+F9+F10 v2.1 |

**Important reference correction:** the §8.5 catch block (NOT §8.6) is where F7's `catch (err)` + Sentry-prohibition lives. The disable route (§8.6) has no `validatePreviewUrl` call and therefore no catch block to harden.

**v2.1 ships 4 new mandatory probes vs v2.0:** F3 draft-read + F9 previewSecret-read (both at §8.0a) + F4 `createClient` stega (at §8.1.5) + F10 path-based grep (at §8.3.0/§8.3.N). Probe-first discipline (D9 + Brief A lesson) carries through.

Everything else in the brief is v2.0 carry-forward.

---

## Brief changelog

- **v1.0** — Initial draft. Pre-Brief-B context-gathering pass surfaced critical prerequisite state from SCAFFOLD-1: ESLint flat config (eslint.config.mjs, ESLint 9), all 3 UI_STRINGS files MISSING (Brief B creates from scratch), two-client setup at `site/src/lib/sanity/client.ts`, `defineLive` missing `serverToken` arg, draft-mode routes are GET-only with no POST hardening, `<VisualEditing />` correctly conditional on draftMode, `presentationTool` correctly wired. 3 halts. 8 locked decisions.

- **v1.1** — Pre-audit refresh against Brief A's 19 productisation IP patterns + 5 specific Brief A lessons. Six BvR findings folded in (BvR #10–15). **Structural rewrite of §8 and D4:** Brief B v1.0 incorrectly preserved SCAFFOLD-1's two-client setup as a "deliberate deviation"; CLAUDE.md scaffold-state and env-vars table both record DESIGN-1's locked plan as single-client collapse per CMA-C2 + F7 of canonical v2.0 brief Step 8. Two-client is SCAFFOLD-1 state-of-record; single-client is the DESIGN-1 forward plan. v1.0 misread "preservation" as policy. v1.1 corrects: D4 now mandates single-client collapse with `serverToken` retasking the existing read token. Knock-on edits across §1, §2, §4 (Step 8.1–8.6 substantially rewritten), §5, §8.

- **v1.2** — Second-pass surgical audit before cross-model panel run. 7 findings folded in (BvR #16–22, all pre-audit). SA-1 corrected non-existent `eslint-plugin-jsx-no-literals` reference to `react/jsx-no-literals` from `eslint-plugin-react`. SA-2 demoted §8.0a token-scope probe to re-confirmation. SA-3 added §8.0b Vercel preview env-var check. SA-4 stopped hardcoding `apiVersion` in examples. SA-5 swapped `npx tsx` for Node 22.6+ native strip-types. No structural rewrite; surgical edits only.

- **v1.3** — Post-cross-model audit refresh (preset:full panel run 2026-05-10T07-58-24-771-5lsq). 11 panel findings + 5 carry-forwards from a prior single-model audit. 21 unique edits combining both rounds. **Two structural rewrites:**
  1. **CMA-F-1 — POST conversion incompatible with Sanity's preview-url-secret iframe-navigation flow.** §8.3 enable route reverts to GET (with hardened Referer/Origin allow-list + secret + same-origin redirect); §8.4 disable route stays POST + adds Referer check (Option A — close the disable-route gap now rather than deferring to QA-1). §8.5 reordered to run BEFORE §8.3/§8.4 (presentationTool capability probe must run before route-method conversion). D6 reframed. Single-model audit catch the panel missed (Gemini's production-role silent failure left coverage gap).
  2. **F-1 (panel-Sonnet) — Origin allow-list construction throws on undefined env vars.** Both routes' allow-list construction now uses `.filter()` + try/catch around `new URL()` to fail closed (403) instead of crashing (500). Env schema tightened via D14.

  **Other critical/important folds:** F-2 explicit security-order comment + integration test; F-3 (Option A) Referer check on disable route + threat-model reframe in D6; F-4 stega gating tightened to AND-with-prod-block + runtime throw guard + prose ambiguity removed; F-5 §8.5 probe corrected to DevTools network inspection; F-6 try/catch around `validatePreviewUrl` + token comment; F-7 `previewValidationClient` extracted as named module-scope helper; F-8 `noStrings: true` baked into rule config from start. F-9 useCdn dependency documented; F-10 generator idempotency precisely defined; F-11 Node 22.6+ detection moved to pre-flight; F-12 module-scope tokenedClient; F-13 explicit grep-for-apiVersion step; F-14 framework-template exemptions added to D3; F-15 `**/ui-strings.ts` glob.

- **v2.0** — **Brief split + post-Step-6 execution rebaseline.** v1.3 covered Steps 6 + 8 together. Step 6 closed at commit `5726e38` (Brief B HALT 1) and its post-phase doc cycle closed at `de773ad`. v2.0 narrows scope to Step 8 ONLY. Step 6 carry-forward state is given as input. Specific v2.0 deltas vs v1.3:

  1. **Frontmatter:** Phase ID narrowed to "Step 8 of 11"; halts reduced from 3 to 2 (HALT 1 already closed at `5726e38`); commits reduced to 2.
  2. **Pre-flight inversion:** v1.3 pre-flight items #9–#11 ("ui-strings.json does NOT exist", "ui-strings.ts does NOT exist", "generate-ui-strings.mjs does NOT exist") now invert to POSITIVE assertions reflecting Step 6's deliverables: ui-strings.json exists with 14 keys + `_meta` block; `npm run generate-ui-strings` is byte-idempotent; `tools/eslint/__tests__/ui-strings.test.mjs` exits clean. Pre-flight item count: 16 (was 17 in v1.3).
  3. **Exit criteria pruning:** v1.3 exit criteria #1–#7 (UI_STRINGS, lint, generator, fixtures) are already met at Step 6 close; v2.0 drops them. Renumbered #8–#21 of v1.3 become #1–#14 of v2.0.
  4. **§8.3 grep evidence formalised:** previewClient repo-wide grep now ships pre-refactor AND post-refactor artifact files (`preview-client-callers-before.txt`, `preview-client-callers-after.txt`) plus a `validate-preview-url-inline-client-after.txt` artifact for the F-7/F-12 module-scope helper verification. HALT 2 surface includes the diff. Closes the "intermediate-references" failure mode that inline-only verification misses. Mirrors Step 6's BvR #26 lesson on artifact-level evidence over verbal/inline confirmation.
  5. **§8.7 integration tests concretised:** v1.3 specified scenarios + expected outcomes in prose. v2.0 ships exact `curl -i` invocations + `Set-Cookie` header inspection via `grep -i 'set-cookie'`. Tests (a)/(b)/(c) from v1.3 preserved + new test (d) added for disable-route dual-check verification per F-3 Option A. "Set-Cookie absent on failure path" is the critical assertion across all 4. Matches Step 6's BvR #26 lesson — lowest-level test mechanism with unambiguous pass/fail signal.
  6. **§Brief-B-close capability log consolidation reframed:** v1.3 pre-architected a 9-entry list. v2.0 points to the running draft at `audit-output/design-1/capability-log-draft.md` (gitignored) and enumerates its Step 6 close baseline (9 items: 4 BvR findings #23–#26 + 3 productisation IP patterns + 2 tech debt rollup candidates) as INPUT state, not final structure. Final consolidation structure decided at HALT 3 execution time based on what's accumulated through Step 8.
  7. **§5 file lists:** Created/modified blocks narrowed to Step 8 only. Step 6 files (ui-strings.json/ts, generator, probe, eslint.config.mjs, hubspot-form-embed migrations, page.tsx + uk/page.tsx disables, CONVENTIONS UI_STRINGS section) are listed in §2.0 as "already-shipped state at Step 6 close" rather than as Brief B v2.0 deliverables.
  8. **D15 added:** Artifact-level evidence over verbal confirmation. Codifies the §8.3 grep + §8.7 Set-Cookie inspection patterns into a brief-layer rule. Mirrors Step 6's BvR #26 finding (ESLint 9 RuleTester silently no-oped on plugin-namespaced rules; switching to `Linter.verify` direct construction gave unambiguous pass/fail signal). At Step 8, the equivalent risk is "intermediate-references" surviving a refactor or "Set-Cookie present despite 4XX" being missed by UX-level smoke alone.
  9. **CMA findings carry-forward verified:** F-1 + F-2 + F-3 + F-4 + F-6 + F-7 + F-12 still apply unchanged. F-8 (rule schema gate) + F-10 (generator idempotency) + F-11 (Node 22.6+) are Step-6-specific and drop. F-13 (grep-for-apiVersion) carries forward in §8.3. F-14 + F-15 (framework-template + generated-file exemptions) are Step-6-specific and drop.

  **Structural rewrites in v2.0: 0. Surgical edits + scope narrowing: comprehensive. No new audit findings expected — this is rebaseline, not restructure. Submit to cross-model audit at preset:full after Jake spot-check; lock at v2.1+ per audit findings.**

- **v2.1** — **Cross-model audit absorption from preset:full panel run 2026-05-11T07-41-00-315-biif.** 15 non-dismissed findings triaged; 14 absorbed as surgical/structural edits; 1 (F9) absorbed as new probe step. 7 dismissals confirmed (all self-refuting per audit synthesis). Specific v2.1 deltas vs v2.0:

  **Critical (2 findings — both at §8.3.2 stega gate, same code shape):**
  1. **F1 — stega belt-and-braces guard is logically unreachable AND throws at module scope (availability risk).** v2.0's `if (stegaEnabled && process.env.VERCEL_ENV === 'production') throw new Error(...)` cannot fire (by construction, `stegaEnabled` is always false when `VERCEL_ENV === 'production'`) AND if it ever did fire, it would crash every page render via the `layout.tsx → live.ts → sanityFetch` import chain. v2.1 replaces with an **independent raw-env check** (fires regardless of computed `stegaEnabled`) + `console.error` + force `stegaEnabled = false` (no throw). `stegaEnabled` changes from `const` to `let` to permit override.
  2. **F2 — Vercel preview Branch B always false; preview Visual Editing silently broken.** v2.0's `(VERCEL_ENV === 'preview' && NODE_ENV !== 'production')` evaluates to `false` on every Vercel preview deploy because Vercel sets `NODE_ENV='production'` for ALL builds and runtimes (preview + production). v2.1 removes the `NODE_ENV !== 'production'` clause from Branch B. Production safety is preserved by Branch A's `VERCEL_ENV !== 'production'` guard + F1's new independent raw-env check.

  **Important (7 findings):**
  3. **F3 — `defineLive` `serverToken` may lack draft-read permission.** v2.1 adds an explicit draft-read probe to §8.0a — runs against the actual `SANITY_API_READ_TOKEN` value before §8.2 retasks it.
  4. **F4 — `stega.studioUrl: undefined` passed to `createClient` — behavior unverified.** v2.1 adds §8.1.5 probe (new step) — empirically tests whether `createClient({ stega: { enabled: true, studioUrl: undefined } })` throws at construction or silently accepts. Outcome drives §8.3.2 — if throws, gate `stega.enabled` on `!!env.NEXT_PUBLIC_SANITY_STUDIO_URL`; if silently accepts, ship the dev-only fallback as default code path.
  5. **F5 — env schema contradiction: `.optional()` does NOT fail startup when `NEXT_PUBLIC_SANITY_STUDIO_URL` unset.** v2.0 §8.0c prose claimed "D14 env schema will fail startup on production deploys" — incorrect (`.optional()` allows `undefined` and parses silently). v2.1 adds a **Zod `.refine()`** to enforce non-development presence + corrects §8.0c prose.
  6. **F6 — Missing 500-path integration test + curl cookie-jar isolation gap.** v2.1 adds integration test (e) for the `validatePreviewUrl` exception path (500 response must not set draft-mode cookie) + adds `--cookie /dev/null --cookie-jar /dev/null` flags to all §8.7 curl commands.
  7. **F7 — `validatePreviewUrl` error leakage risk via future Sentry/Datadog instrumentation.** v2.1 replaces bare `catch {}` with explicit `catch (err)` named binding + inline security comment prohibiting `captureException(err)` or any external error-reporting forward. CONVENTIONS Entry 3 mirrors the prohibition.
  8. **F8 — Allow-list `"null"` string origin not explicitly excluded.** v2.1 adds an explicit guard against the literal string `"null"` (which sandboxed iframes send as `Origin: null`) AND empty string in both §8.5 and §8.6 allow-list constructions. New integration test (d.5) — `Origin: null` literal must 403.
  9. **F9 — `previewValidationClient` token may lack permission to read `sanity.previewSecret` documents.** v2.1 adds an explicit `*[_type == "sanity.previewSecret"][0]` read probe to §8.0a. A `null` result is expected on a fresh project; a 401/403 is a deployment blocker before §8.3.3 assigns the token to `previewValidationClient`.

  **Minor (6 findings):**
  10. **F10 — `previewClient` deletion grep misses dynamic imports / barrel re-exports.** v2.1 adds a secondary path-based grep (`from.*sanity/client` excluding `next-sanity`) to §8.3.0 and §8.3.N alongside the symbol grep.
  11. **F11 — Disable route dual-check rejects legitimate Referer-stripping requests.** v2.1 adds an explicit comment in §8.6 documenting the Referer-stripping edge case (Referrer-Policy: no-referrer, privacy extensions, sandboxed iframes) + the fallback (manual cookie deletion / natural expiry). New Tech Debt note for TEMPLATE-* disable UI to set `Referrer-Policy: strict-origin-when-cross-origin`.
  12. **F12 — `previewValidationClient` module-scope construction circular-import silent failure.** v2.1 adds a defensive runtime check at the construction site: `if (!env.SANITY_API_READ_TOKEN) throw new Error(...)`. Converts a silent 401 into an explicit crash with a diagnostic message pointing at the circular import.
  13. **F13 — `originAllowed` / `refererAllowed` non-boolean coercion.** v2.1 normalises both expressions to explicit booleans in §8.6 (`typeof origin === 'string' && allowedOrigins.includes(origin)`) for readability.
  14. **F14 — `NEXT_PUBLIC_SANITY_STUDIO_URL` undef silently 403s Studio requests.** v2.1 adds inline comments in §8.5/§8.6 allow-list construction documenting the fail-closed behavior + new pre-flight check #17 (verify env var set if local Studio is running).
  15. **F15 — Stega Branch A enables on any non-prod `VERCEL_ENV`.** v2.1 adds intent comment to §8.3.2 confirming this is by design (local dev + any non-prod Vercel env), not a bug.

  **Dismissed (7 findings):** synthesis confirms all 7 are self-refuting or out-of-scope — `safeUrlOrigin` AND vs OR (self-refuted), protocol-relative redirectTo (self-refuted), `useCdn: production && !stegaEnabled` (self-refuted), `previewValidationClient` perspective (self-refuted), `grok-4.20_dx` zero findings (valid result, not a finding), `ui-strings.ts` byte-idempotency (self-dismissed), Vercel auto-deploy race (out of scope — operational concern, not a code defect). No v2.1 action.

  **Structural rewrites in v2.1: 0** (no architectural rethinks). **New steps in v2.1: 2** (§8.1.5 createClient stega probe; §8.7 integration test (e) for 500 path + test (d.5) for `Origin: null` literal). **Code-shape changes in v2.1: 4 sections** (§8.1 env schema refinement; §8.3.2 stega gate rewrite — F1+F2+F15; §8.3.3/§8.5 previewValidationClient defensive guard — F12 + F14 comment; §8.6 disable route — F8 null guard + F11 Referer comment + F13 boolean normalisation + F14 comment). **Documentation-only changes in v2.1: §8.0c prose (F5) + CONVENTIONS Entry 3 (F7).** **Pre-flight check count: 17 (was 16); §8.7 integration tests: 8 sub-cases (was 7) across tests (a)/(b)/(c)/(d.1–d.4)/(d.5)/(e).**

  **Capability log addition queued for HALT 3 (Pattern TBD):** v2.0's two final revisions introduced 2 new gaps (F1 + F2 — both rooted in the belt-and-braces guard added at v2.0). The transferable lesson: defensive runtime checks require the same logical-reachability analysis as the original gate expression. "Belt-and-braces" code can be unreachable, and unreachable defensive code is worse than no defensive code — it provides false confidence. Add to `audit-output/design-1/capability-log-draft.md` at v2.1 lock; consolidate at HALT 3.

  **Workflow:** v2.1 author (this draft) → Jake review v2.1 diff → spot-audit at preset:quick (2 models, ~$0.15, ~3 min) targeting F1+F2+F3+F4+F5 fixes to verify no new gaps in the stega gate, env schema, or new probe steps → if clean, lock as v2.2 → Step 8 execution. If spot-audit surfaces new findings → triage + v2.2 → re-spot-audit until clean. v2.0 is preserved on disk until v2.2 locks (do not delete until lock-and-rename completes).

- **v2.2 — LOCKED** — **Cross-model audit absorption from preset:full panel run 2026-05-11T09-00-11-411-aop0.** Spot-audit was bumped from preset:quick to preset:full (4 models in panel mode: gpt-5.4_security + gpt-5.4_logic + gemini-3-pro_production + grok-4.20_dx; claude-sonnet-4.6_security got swapped to gpt-5.4 on context overflow — brief was 143.8KB / 1804 lines pre-v2.2). Cost: $1.80 panel + $0.08 synthesis. 11 findings raw, 4 dismissed (self-refuting or out-of-scope), 7 already-absorbed verification reminders (the models re-discovered fixes already in v2.1 — strong signal v2.1 was structurally sound), 3 NEW findings absorbed:

  1. **I5 (Important — gemini-3-pro_production) — Module-scope `console.error` triggers alert storms on cold starts.** v2.1's §8.3.2 F1 raw-env safety check used `console.error`. Under serverless cold-start traffic, every new isolate re-evaluates module-scope code; hundreds of concurrent cold starts each emit the log line. All major observability platforms (Sentry, Datadog, PagerDuty, NewRelic) map `console.error` to "Error"/"Fatal" severity → triggers on-call alerts at default thresholds → alert fatigue → legitimate critical alerts get ignored. **v2.2 fix:** `console.error` → `console.warn`. Vercel still displays in yellow (highly visible), but observability tools map to "Warning" severity, preventing false-positive fatal pages. Diagnostic message preserved verbatim so message-grep alert rules continue to work. Comment block expanded with the severity-mapping rationale.

  2. **M7 (Minor — gemini-3-pro_production + gpt-5.4_security, 2-model consensus) — F12 defensive guard masks its own diagnostic via native `TypeError`.** v2.1's §8.3.3 + §8.5 F12 guards used `if (!env.SANITY_API_READ_TOKEN)`. If `env` is itself `undefined` (the exact circular-import case F12 defends against), `env.SANITY_API_READ_TOKEN` throws `TypeError: Cannot read properties of undefined` BEFORE the `if` condition evaluates. The native TypeError masks the carefully-authored diagnostic Error and the operator sees a generic crash instead of "possible circular import with env.ts". **v2.2 fix:** add optional chaining → `if (!env?.SANITY_API_READ_TOKEN)`. The `?.` operator short-circuits to `undefined` when `env` is undefined, the `!` falsy check catches it, and the authored diagnostic fires. Applied at BOTH §8.3.3 (canonical helper construction) AND §8.5 (full enable route shape mirror).

  3. **M9 (Minor — gpt-5.4_logic) — §8.1.5 probe outcome dispatcher fragile against multi-line OUTCOME.** v2.1's Gap-1 fix added a shell dispatcher `grep "^OUTCOME:" ... | head -1` with downstream substring-match on `THROWS` / `accepts`. If the probe script is later edited to emit multiple OUTCOME-prefixed lines or to decorate the line with descriptive text, `head -1` silently picks the wrong line. **v2.2 fix:** (a) tightened probe emission — the canonical result is a single-token line `OUTCOME: THROWS` or `OUTCOME: ACCEPTS`, followed by separate `detail:` / `decision:` lines for human readability; (b) dispatcher switched to exact-token matching `grep -q "^OUTCOME: THROWS$"` with `^...$` end-anchors. Eliminates the ambiguity class entirely; HALT trigger #9 now fires unambiguously on any unanticipated outcome.

  **Already-absorbed verification reminders dismissed (7):** Critical F1 + F2 + F3 of aop0 (security ordering, redirectTo placement, disable AND-logic) all reaffirm v2.1's §8.5/§8.6 + tests (a)/(b)/(c)/(d). Important F4 (Branch B NODE_ENV dead-clause) is exactly v2.1 F2 — model didn't notice fix landed. Important F6 (allow-list null guard) is exactly v2.1 F8. Minor F8 (catch-block secret leak) is exactly v2.1 F7. Minors F10 + F11 are verification passes (correct-as-written, no defect).

  **Dismissed (4 from synthesis):** all self-confirmed correct or meta-caveats about implementation verification (not standalone defects).

  **Pattern 13 sharpened (capability-log running draft updated):** the v2.1→v2.2 cycle is the SECOND consecutive confirmed instance of "defensive code added in response to a prior finding can itself contain logic, reachability, or side-effect gaps." Three findings (I5 + M7 + M9) all rooted in v2.1's own absorptions of biif findings. The transferable rule: every defensive guard added to absorb a prior finding needs the same reachability + side-effect analysis as the original gate. Five-question audit lens documented in `audit-output/design-1/capability-log-draft.md` for HALT 3 consolidation. Customer-2 takeaway: budget for AT LEAST 2 audit-and-absorb cycles per material structural change.

  **Structural rewrites in v2.2: 0** (no architectural changes). **New steps in v2.2: 0.** **Code-shape changes in v2.2: 3 surgical sites** — §8.3.2 raw-env guard severity downgrade (I5); §8.3.3 + §8.5 optional-chaining in F12 guards (M7); §8.1.5 probe + dispatcher tightening (M9). **Documentation-only changes in v2.2: comment blocks + capability-log Pattern 13 sharpening.** **Pre-flight check count: 17 (unchanged from v2.1).** **§8.7 integration tests: 8 sub-cases (unchanged from v2.1).**

  **Lock decision:** capped at 3 audit cycles per project protocol. 7 of 11 aop0 findings were verification reminders (v2.1 was structurally sound); 3 new findings all mechanical surgical fixes. No structural follow-on risk visible. Locked at v2.2. Step 8 execution prep begins post-lock.

---

## 0. Read first (in order)

1. **CLAUDE.md** — current phase state (Steps 1–6 closed, Steps 7–11 pending). Pay specific attention to:
   - The "Current Phase" section recording "Step 6 closed; Step 8 next."
   - The "Design system state (as of MYGRATR-DESIGN-1 Brief B Step 6 close — HALT 1)" subsection — records 14 UI_STRINGS keys, 2-rule architecture, 212-line CONVENTIONS section, capability-log draft accumulated state.
   - The env-vars table entry for `SANITY_API_READ_TOKEN` — records the `serverToken` retasking as the locked DESIGN-1 plan (DESIGN-1 retasks this as `serverToken` on `defineLive({ client, serverToken })` per CMA-C2).
   - The Repo Structure table — confirms `tools/eslint/` and `scripts/design/` paths.

2. **`docs/briefs/active/MYGRATR-DESIGN-1_BRIEF_v2.0.md` §Step 8** — parent brief. v2.0 brief §Step 8 was audited 3 times (F1–F30 surgical fixes); the CMA-C2 finding (collapsed-client architecture) and F7 finding (stega gating env var) are load-bearing. Reference its sub-step structure (8a probe, 8b URL, 8c stega, 8d-d2 route hardening, 8e seed, 8f Studio config, 8g operator doc + smoke test) and apply Brief B's locked decisions on top.

3. **`docs/CAPABILITY_LOG.md`** — established patterns through Brief A (19 entries) + Brief B Step 6 patterns are still in the running draft (not yet consolidated; HALT 3 lands them). Specifically inherit:
   - Pattern 1 — non-interactive CLI flags (D9)
   - Pattern 2 — self-explaining placeholders (`_meta` block discipline)
   - Pattern 4 — schema-vs-reality findings carried into derivative artefacts
   - Pattern 6 — build-vs-runtime correctness for schema-validated module loads
   - Pattern 12 — CI/CD-aware commit ordering (D10)
   - Brief A's 5 calibration lessons inform Step 8's discipline.

4. **`docs/CONVENTIONS.md`** — code patterns through Brief B Step 6:
   - "Storybook Story Pattern" (Brief A)
   - "Sanity Client Pattern in the Generated Site" — currently documents SCAFFOLD-1's two-client baseline. Brief B Step 8.3 supersedes this section with the single-client pattern; the supersession is part of §8.3's CONVENTIONS edit. **Locate the section by exact heading match (`grep -n "Sanity Client Pattern"`) before editing — Step 6's 212-line UI_STRINGS section may have shifted line offsets.**
   - "UI_STRINGS Rule (post-DESIGN-1 Brief B)" — 212 lines covering both rules, 5-path violation triage, exemption table, naming convention table, test infrastructure pointers, generator discipline. Brief B Step 8 does NOT modify this section.

5. **`audit-output/design-1/capability-log-draft.md`** (gitignored) — Step 6 close baseline:
   - 4 BvR findings: #23 (§6.1.1 tsc CLI shape), #24 (D3 exemption glob mismatch with Brief A Pair-rule), #25 (`storybook-static/**` missing from globalIgnores), #26 (ESLint 9 RuleTester plugin-namespace silent failure).
   - 3 productisation IP patterns: placeholder-as-split-template, two-gate ESLint rule verification, narrow custom-rule supplement.
   - 2 pre-existing tech debt rollup candidates: hubspot-form-embed `react-hooks/set-state-in-effect` (2 violations), `demo/_demo-client.tsx` `react/no-unescaped-entities` (5 violations).
   - Step 8 execution adds further entries throughout; HALT 3 consolidates whatever's there at that point.

6. **`site/src/lib/sanity/client.ts`** — current two-client setup; Brief B Step 8.3 collapses to a single client and deletes `previewClient`.

7. **`site/src/app/api/draft-mode/{enable,disable}/route.ts`** — current GET-only routes; Brief B converts disable to POST (with dual Origin+Referer check); enable stays GET (with hardened allow-list + secret + same-origin redirect) per CMA F-1 v1.3.

If any of these conflict with this brief, halt and surface to Jake. Do not silently reconcile.

---

## 1. Locked decisions (do not relitigate)

These were settled at Brief B v1.1 drafting against context-gathering pass evidence + Brief A's 5 lessons, refined at v1.2 (surgical pass) and v1.3 (post-CMA panel run). v2.0 preserves them unchanged + adds D15 (artifact-level evidence).

| # | Decision | Lock |
|---|---|---|
| D4 | Sanity client structure | **Single-client collapse per CMA-C2 + F7.** Replaces v1.0's two-client preservation framing. CLAUDE.md scaffold-state and env-vars table both record this as the locked DESIGN-1 plan. Brief B Step 8.3 collapses `sanityClient` + `previewClient` into one `sanityClient`; stega is conditional on `SANITY_STEGA_ENABLED` (AND-with-prod-block fallback `VERCEL_ENV === 'preview'`); `serverToken` on `defineLive` retasks the existing `SANITY_API_READ_TOKEN`. The previously-separate `previewClient` (used by `validatePreviewUrl` in the enable route) is replaced by a module-scope named helper `previewValidationClient` at the call site per CMA F-7 + F-12 v1.3. Refactor cost is contained inside §8.3 and surfaces via HALT 2 grep-evidence artifacts (per D15). |
| D5 | `defineLive` serverToken + stega gating | **`defineLive({ client: sanityClient, serverToken: env.SANITY_API_READ_TOKEN })` per CMA-C2.** Stega gating per CMA F-4 v1.3 refined by CMA F1+F2+F15 v2.1: `(SANITY_STEGA_ENABLED === '1' && VERCEL_ENV !== 'production') \|\| (VERCEL_ENV === 'preview')`. **v2.1 corrects two v2.0 defects:** (F2) the v2.0 Branch B `&& NODE_ENV !== 'production'` clause was always false on Vercel preview (Vercel sets `NODE_ENV='production'` for ALL builds + runtimes), silently disabling stega on every Vercel preview — v2.1 drops the clause; (F1) the v2.0 belt-and-braces `if (stegaEnabled && VERCEL_ENV === 'production') throw new Error(...)` was logically unreachable (by construction, `stegaEnabled` cannot be true when `VERCEL_ENV === 'production'`) AND would have crashed the entire production worker if it ever fired (module-scope throw in a file imported by layout.tsx) — v2.1 replaces with an INDEPENDENT raw-env check that fires regardless of computed `stegaEnabled`, emits `console.error`, and forces `stegaEnabled = false` (no throw). **The new check provides actual protection** (does not depend on the computed gate) and preserves availability (no module-scope throw). `stegaEnabled` is declared as `let` to permit override. The `SANITY_API_READ_TOKEN` is the existing viewer-scoped read token from SCAFFOLD-1 (verified at DESIGN-1 Step 0c, re-confirmed at §8.0a Step 1, draft-read scope verified at §8.0a Step 2 per F3 v2.1, previewSecret-read scope verified at §8.0a Step 3 per F9 v2.1); env schema strictness is locked in D14 + F5 v2.1 refinement. |
| D6 | Draft-mode route hardening | **GET on enable with hardened Referer/Origin allow-list + secret + same-origin redirect; POST on disable with dual Origin + Referer check.** Reframed in v1.3 per CMA F-1 (single-model audit catch; panel missed because Gemini's production-role silently failed). Sanity's `presentationTool` initiates preview by top-level iframe navigation to `<site>/api/draft-mode/enable?sanity-preview-secret=...` — a GET with query string, by `@sanity/preview-url-secret`'s design. POST-only enable is incompatible with iframe-driven navigation; redirect-after-POST cannot drive the iframe to the preview URL. The enable route's actual auth barriers are (a) the preview-url secret, (b) same-origin `redirectTo` validation, (c) Referer/Origin allow-list — POST conversion was security theatre that broke functionality. Disable has no preview-url secret in Sanity convention; closing that gap (v1.3 Option A) requires Referer match in addition to Origin (per CMA panel F-3 — not deferring to QA-1). §8.4 presentationTool method probe runs BEFORE §8.5/§8.6 route conversion (sequencing critical). |
| D14 | Env schema strictness | **`NEXT_PUBLIC_SITE_URL: z.string().url()`, `NEXT_PUBLIC_SANITY_STUDIO_URL: z.string().url().optional().refine(...)`, `SANITY_API_READ_TOKEN: z.string().min(1)`.** Per CMA panel F-1 + F-6, refined by CMA F5 v2.1. The previous `z.string()` allowed undefined / empty / malformed values that surfaced as runtime exceptions (`new URL(undefined)` throws `TypeError`; empty token causes `validatePreviewUrl` 401 with unclear error path). Strict schema fails at startup not at request time. **v2.1 closes a v2.0 documentation/behavior gap (F5):** v2.0 §8.0c claimed an unset `NEXT_PUBLIC_SANITY_STUDIO_URL` on production "will fail startup," but `z.string().url().optional()` allows `undefined` and parses silently. v2.1 adds a `.refine()` that enforces presence in non-development environments — production/preview deploys with the var unset now actually fail at env-validation startup with a clear error message (matching the §8.0c prose). Step 8.1 verifies the env schema before adding `serverToken` to `defineLive`; if the schema isn't already strict, Step 8.1 tightens it as the first sub-edit. Halt-and-escalate if any of these env vars are missing on the local dev machine — the brief proceeds against the Vercel preview/prod deployment env vars per §8.0b + §8.0c. |
| **D15** | **Artifact-level evidence over verbal confirmation** | **NEW in v2.0.** Structural refactors that delete or relocate symbols across the codebase (e.g., the single-client collapse) AND security-sensitive changes (e.g., draft-mode route hardening) ship paired pre-state / post-state artifact files saved under `audit-output/design-1/` (gitignored — survives across sessions in the working tree). HALT 2 + HALT 3 surfaces include the artifact paths + diffs, not verbal "I ran the grep and it was empty." Specific applications at Step 8: (a) §8.3.0 / §8.3.N — `preview-client-callers-{before,after}.txt` artifacts for the previewClient repo-wide grep, plus `validate-preview-url-inline-client-after.txt` for the F-7/F-12 module-scope helper verification; (b) §8.4 — `visual-editing-method-probe.md` capturing observed HTTP method + transport + query-string before route conversion; (c) §8.7 — `visual-editing-smoke-test.md` consolidating manual round-trip results + integration test (a)/(b)/(c)/(d) curl-response outputs with Set-Cookie inspection. Rationale: Step 6's BvR #26 surfaced a class of failure where the test mechanism silently produced false positives (ESLint 9 RuleTester no-op on plugin-namespaced rules). The transferable lesson is "use the lowest-level mechanism that gives unambiguous pass/fail signal, and preserve the signal as an artifact." Verbal/inline confirmation loses signal between session boundaries; artifact files preserve it. |

### Carry-forward locks from Brief B v1.3 (D1, D2, D3, D7–D13)

D1 (ESLint flat config), D2 (UI_STRINGS canonical SoT), D3 (UI_STRINGS scope), D11 (generator build-vs-runtime), D12 (UI_STRINGS schema-vs-reality probe), D13 (UI_STRINGS key naming) are Step-6-specific and already discharged at commit `5726e38` + `de773ad`. They do not appear in v2.0's active decision table because Step 6 is closed. They remain referenced by §0 read-first item #4 (CONVENTIONS.md "UI_STRINGS Rule" section) for any TEMPLATE-* author inheriting them.

D7 (stega production behavioural verification deferred to QA-1), D8 (smoke test mechanism — manual round-trip per Step 8.7), D9 (non-interactive CLI flags everywhere), D10 (no CI/CD deploy in Brief B) all carry forward unchanged.

---

## 2. Pre-flight checks (read-only; halt on any failure)

Run all 16 checks before opening any code file. Halts on failure surface to Jake with the specific check + observed state.

### State-of-repo checks

1. `git status` clean, on `feat/design-1`, working tree clean (any untracked from prior session must be triaged before Step 8 begins).
2. Brief A closed per Brief A v1.2 §8 exit criteria (commits `cde66ca`, `e18bd3a`, `620a3b5`, `64ef3fc`) + Brief B HALT 1 closed at `5726e38` + Brief B context-catchup landed at `de773ad`. `git log --oneline -10` confirms these commits in order.
3. Branch `feat/design-1` is ahead of `origin/feat/design-1` by 0 commits after `de773ad` push lands (or 1 commit if push pending). v2.0 drafting itself adds untracked files under `docs/briefs/active/` which do not affect the ahead-count.

### Build / type-check / Storybook checks

4. `npm run build` in `site/` passes.
5. `npx tsc --noEmit` in `site/` passes.
6. `npm run build-storybook` in `site/` passes (confirms Brief A Storybook scaffold still functions — Step 8 should not affect Storybook, but build-storybook is the cheapest smoke for unrelated regressions).
7. `migrations.status === 'content_complete'` in Supabase (DESIGN-1 doesn't transition state; verify unchanged via `npm run db:migrations-status` or equivalent supabase-js read).

### Step 6 deliverables — present and clean (v2.0 inversion of v1.3 #9–#11)

8. `tools/eslint/ui-strings.json` exists. `jq '.strings | keys | length' tools/eslint/ui-strings.json` returns `14`. `_meta` block present with `reconciled_at`, `seed_provenance`, brief reference.
9. `site/src/lib/ui-strings.ts` exists, byte-identical to a fresh `npm run generate-ui-strings` run (byte-idempotent per F-10 carry-forward; check with `cp site/src/lib/ui-strings.ts /tmp/ui-strings-before.ts && npm run generate-ui-strings && diff /tmp/ui-strings-before.ts site/src/lib/ui-strings.ts`).
10. `tools/eslint/__tests__/ui-strings.test.mjs` exits clean: `node --experimental-strip-types tools/eslint/__tests__/ui-strings.test.mjs` reports all 8 fixtures pass.
11. `npm run lint` in `site/` returns the known 25-problem noise floor (9 errors + 16 warnings, all outside Brief B scope per Step 6 PHASE_HISTORY entry). Zero `react/jsx-no-literals` or `local/no-conditional-strings-in-jsx` violations. If lint surfaces NEW violations of either rule, halt — that suggests a session-boundary edit reintroduced a chrome-string regression.

### Step 8 starting-state expectations

12. `site/src/lib/sanity/live.ts` exists with `defineLive({ client: sanityClient })` — no `serverToken` yet (Step 8.2 adds it). `grep -E 'defineLive\(' site/src/lib/sanity/live.ts` confirms shape.
13. `site/src/lib/sanity/client.ts` exports BOTH `sanityClient` AND `previewClient` (the SCAFFOLD-1 two-client baseline; Step 8.3 collapses). `grep -E '^export.*Client' site/src/lib/sanity/client.ts` lists both.
14. `site/src/app/api/draft-mode/enable/route.ts` exports `GET` (currently). §8.5 KEEPS GET per D6 v1.3 reframe + CMA F-1; adds hardening. Do NOT convert to POST.
15. `site/src/app/api/draft-mode/disable/route.ts` exports `GET` (currently). §8.6 CONVERTS to POST + adds dual Origin/Referer check.
16. `SANITY_API_READ_TOKEN` exists in `site/.env.local` and is viewer-scoped (verified at DESIGN-1 Step 0c per capability-log-draft.md; §8.0a re-confirms + adds draft-read + previewSecret-read probes per F3/F9 v2.1; D14 enforces non-empty).

### NEW v2.1: Studio URL local presence check (per CMA F14)

17. **`NEXT_PUBLIC_SANITY_STUDIO_URL` is set in `site/.env.local` if the local Studio is running** (CMA F14 v2.1). The env var is optional in dev per D14 + F5 v2.1 refinement, but if Studio is running on `localhost:3333` and this var is unset locally, §8.5 / §8.6 route allow-lists will drop the (missing) Studio URL, and Studio-initiated preview requests will be rejected with 403. This is correct fail-closed behavior, but easy to misdiagnose as a security regression during the §8.7 smoke test. Quick check:

    ```bash
    grep -E '^NEXT_PUBLIC_SANITY_STUDIO_URL=' site/.env.local || echo "MISSING — set to http://localhost:3333 if running local Studio"
    ```

    If running local Studio + var missing: set `NEXT_PUBLIC_SANITY_STUDIO_URL=http://localhost:3333` in `site/.env.local`. If NOT running local Studio (using remote `https://mygratr-cloudemployee.sanity.studio` for the smoke test): the var can stay unset locally — but understand the smoke test will then verify against the remote Studio's origin, not localhost. Either is valid; the check ensures the choice is conscious.

If any pre-flight check returns unexpected state, halt — Brief A or Brief B Step 6 may have changed assumptions Brief B Step 8 is built on.

---

## 3. Hard rules (carried forward; non-negotiable)

1. **No fabrication of CE site facts.** Hard Rule #2 from earlier briefs. Defined exception for story-file mock data per Brief A Hard Rule #1; otherwise stands.
2. **Probe-first dismissal protocol.** Burden of proof on dismissal, not adoption.
3. **No commit until Jake approves diff.** Hard Rule #3.
4. **Brief-vs-reality finding discipline.** When brief literal conflicts with structural rule (gitignore, framework convention, tooling constraint), structural wins. Surface explicitly. Specifically watched at: §8.4 method probe (if Sanity's actual HTTP method differs from D6's reframe, halt and reframe in real time); §8.3 grep-for-callers (if a `previewClient` caller exists outside the brief's anticipated set, halt and surface — don't silently rewrite).
5. **Single-client collapse is non-negotiable per D4.** v1.0's "two-client preservation" framing was a v1.0 misread, corrected in v1.1. The collapse is the canonical DESIGN-1 plan recorded in CLAUDE.md. If any sub-step seems easier with two-client preserved, that's a sign the sub-step needs rework, not a sign D4 should bend.
6. **Security hardening is non-negotiable for production paths.** Draft-mode routes must be hardened per D6 reframe (GET enable with allow-list + secret + same-origin redirect; POST disable with dual-check) before Brief B closes. Security order on enable (origin/referer → secret → redirectTo same-origin → `draftMode().enable()` → redirect) is non-negotiable per CMA F-2 v1.3. Integration tests (§8.7 a/b/c) verify the order via Set-Cookie absence on failure paths.
7. **No commits between halts** — each commit lands at a halt close (HALT 2, HALT 3). Mid-halt work-in-progress is on the working tree only.
8. **Non-interactive CLI flags everywhere per D9.** Any `npm install` or `npx` command Claude Code introduces mid-execution must use the flags in D9. If a command Claude Code wants to run doesn't have a non-interactive equivalent, halt and surface.
9. **No CI/CD deploy precedes its commit per D10.** If §8.4 changes Studio config and a redeploy is needed, the redeploy is a separate operation AFTER HALT 2's commit lands, not before.

---

## 4. Step-by-step build order

### §8.0 — Pre-Step-8 environment probe (~10 minutes)

Per v2.0 brief §Step 8a probe (CMA-D1 finding from audit):

```bash
cd "/Users/jakehall/Documents/CE Ops/Ab3lton/SEO/Code/MASTER PROJECTS_1/Mygratr/site"
node -e "console.log(JSON.stringify(require('next-sanity/package.json').exports, null, 2))"
node -e "console.log(JSON.stringify(require('next-sanity/live/package.json'), null, 2))"
```

Verify `defineLive` is exported from `next-sanity/live` (current usage). If `pkg.exports` has changed in `next-sanity` 12.3.0+, brief-vs-reality finding — surface and use whatever entry point is actually documented in the installed version.

Confirm the installed version matches expectations:

```bash
npm ls next-sanity --depth=0
```

Expected: `next-sanity@12.3.x` or later (SCAFFOLD-1 baseline). If older, surface — the `defineLive` API shape may differ.

Save the probe output verbatim to `audit-output/design-1/next-sanity-probe.md` (gitignored). Per D15, artifact-level evidence over verbal confirmation.

### §8.0a — Token scope re-confirmation + draft-read probe + previewSecret read probe (~5 minutes; per D5 + F3 v2.1 + F9 v2.1)

**SA-2 finding (v1.2 preserved into v2.0):** the same token Brief B retasks was already verified at DESIGN-1 Step 0c per `audit-output/design-1/capability-log-draft.md`:

> *"`SANITY_API_READ_TOKEN` viewer-scope verified (only `statusCode: 403` accepted as proof per F4 v1.5; manual Sanity dashboard confirmation 2026-05-04 — `mygratr-design-1-read`, role=viewer, dataset=production)."*

v1.1's active re-probe was redundant. v2.0 kept the re-confirmation procedure (no active probe by default); v2.1 adds two NEW active probes per F3 + F9 panel findings to verify draft-read scope and `sanity.previewSecret` read scope explicitly before §8.2 / §8.3.3 retask the token.

#### Step 1: Token scope re-confirmation (carry-forward from v2.0)

1. Read `audit-output/design-1/capability-log-draft.md` Step 0c entry.
2. Confirm the `mygratr-design-1-read` token name + viewer role still appears.
3. Confirm `site/.env.local` `SANITY_API_READ_TOKEN` first 8 chars still match the dashboard token (if Jake has Sanity dashboard access — if not, skip).

**Active probe fallback (per F4 v1.5):** if capability-log-draft.md no longer carries the carry-forward note (e.g., HALT 3 consolidation moves it out of the running draft), fall back to:

```bash
node scripts/design/verify-token-scope.mjs
```

Only `403` or `401` on `client.create()` proves read-only. Any success on `create()` (200/2xx) means the token is over-scoped — halt and surface for token rotation before §8.1 retasks it as `serverToken`.

#### Step 2: Draft-read probe (NEW v2.1 per F3)

**Why this probe exists (F3 v2.1):** `SANITY_API_READ_TOKEN` is verified as viewer-scoped (role=viewer, dataset=production). v2.0 retasks this token as `defineLive`'s `serverToken`, which `next-sanity/live` uses for server-side draft fetches and real-time listener subscriptions. A viewer role grants read access to **published** documents, but **draft document access** (the `drafts.**` path) and **listener/subscribe permissions** may require an editor role or an explicit dataset-level read grant. If the token lacks draft-read scope, `defineLive` silently degrades to published-only fetches — the site compiles and runs, but draft edits never propagate to the preview iframe. §8.7's smoke test step 6 ("edit a field → confirm preview updates within 2 seconds") would catch this only if the tester notices the absence of updates. This probe makes the failure mode explicit before §8.2 retasks the token.

```bash
cd "/Users/jakehall/Documents/CE Ops/Ab3lton/SEO/Code/MASTER PROJECTS_1/Mygratr/site"
node --experimental-strip-types -e "
import { createClient } from '@sanity/client'
const c = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_READ_TOKEN,
})
const drafts = await c.fetch('*[_id in path(\"drafts.**\")][0..0]')
console.log('Draft read test: PASS (viewer token can read drafts)')
" 2>&1 || { echo 'FAIL: token cannot read drafts — rotate to editor-scoped or explicit-grant token before §8.2'; exit 1; }
```

**Expected outcome:** the probe prints `Draft read test: PASS`. A `null` or `[]` query result is also PASS — proves the token can list drafts and just found none in this slice. The probe FAILs only if `@sanity/client` throws (typically with a `403`/`401` HTTP error message).

**Halt-and-escalate trigger (added to §6):** if the probe fails with 401 or 403, the token cannot be retasked as `serverToken`. Rotate the token to one with an explicit dataset-level read grant (or editor role) BEFORE §8.2 — once §8.2 ships with a viewer-only token, draft mode is broken in production and §8.7's smoke test will only catch the symptom (preview not updating) not the cause.

Save the probe output verbatim to `audit-output/design-1/draft-read-probe.md` (gitignored). Per D15.

#### Step 3: `sanity.previewSecret` read probe (NEW v2.1 per F9)

**Why this probe exists (F9 v2.1):** `validatePreviewUrl` from `@sanity/preview-url-secret` reads `sanity.previewSecret` system documents to validate rotating preview secrets. The viewer-scoped `SANITY_API_READ_TOKEN` is confirmed as read-only for regular content, but Step 1 does NOT verify that the token can read `sanity.previewSecret` documents specifically. If a dataset-level ACL or Sanity project configuration restricts system document access, `validatePreviewUrl` will throw or return `isValid: false` for all requests, making the entire preview system non-functional. The root cause would be obscure — §8.7's smoke test would show preview failing but not why. This probe makes the failure mode explicit before §8.3.3 assigns the token to `previewValidationClient`.

```bash
cd "/Users/jakehall/Documents/CE Ops/Ab3lton/SEO/Code/MASTER PROJECTS_1/Mygratr/site"
node --experimental-strip-types -e "
import { createClient } from '@sanity/client'
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_READ_TOKEN,
})
client.fetch('*[_type == \"sanity.previewSecret\"][0]')
  .then(doc => console.log('previewSecret read: PASS (null on fresh project is expected; got:', doc, ')'))
  .catch(err => { console.error('FAIL:', err.message); process.exit(1) })
"
```

**Expected outcome:**
- `null` result → PASS (fresh project; no `sanity.previewSecret` doc exists yet — first `validatePreviewUrl` call will create one).
- A document object → PASS (existing secret; token can read it).
- 401 or 403 HTTP error → FAIL (token lacks system-document read scope).

**Halt-and-escalate trigger (added to §6):** if the probe fails with 401/403, the token needs an upgraded scope before §8.3.3 assigns it to `previewValidationClient`. Treat as deployment blocker — `validatePreviewUrl` will silently return `isValid: false` for all requests once shipped, breaking the entire preview-secret round-trip.

Save the probe output verbatim to `audit-output/design-1/preview-secret-read-probe.md` (gitignored). Per D15.

#### Investigation note (F9 v2.1)

F9 was absorbed as a probe step (not a code change) because the **outcome of the probe determines whether any code-shape change is needed.** Three possible outcomes:
- **PASS (null or existing doc):** no further action; v2.1 stands as-is.
- **PASS with explicit secret doc:** confirms token has scope; no action.
- **FAIL (401/403):** deployment blocker; halt and surface to Jake for token rotation. Do NOT proceed to §8.3.3 with an under-scoped token.

The investigation completes when the probe runs; the result is acted on at probe time, not pre-determined at brief-authoring time.

### §8.0b — Studio URL env var verification on Vercel preview (~5 minutes; per SA-3 v1.2)

**SA-3 finding (v1.2 preserved into v2.0):** `NEXT_PUBLIC_SANITY_STUDIO_URL` in `site/.env.local.example` (committed) is `http://localhost:3333` per SCAFFOLD-1 record. On Vercel preview deploys, this env var must be set to the deployed Studio URL (`https://mygratr-cloudemployee.sanity.studio`) — otherwise §8.5's origin allow-list will reject preview-init requests from Studio because Studio's iframe origin won't match the (still-localhost) allow-list value, and §8.7's smoke test will fail at step 4 (preview iframe doesn't load).

Verify before Step 8.7:

1. Open Vercel project settings → Environment Variables → preview env.
2. Confirm `NEXT_PUBLIC_SANITY_STUDIO_URL` is set to `https://mygratr-cloudemployee.sanity.studio`.
3. If it's set to localhost or unset, update it to the deployed Studio URL. Trigger a preview redeploy (push a commit, or use Vercel UI redeploy).
4. The localhost value remains in `site/.env.local` (developer machines) and `site/.env.local.example` (default). Only the **Vercel preview env** needs the deployed URL.

If Vercel access is gated to Jake only and Claude Code can't read/write env vars directly: surface to Jake before §8.7 with the exact variable name + expected value. Jake confirms in Vercel UI; Claude Code proceeds.

Halt-and-escalate trigger if the env var is wrong AND can't be corrected in-session (added to §6 trigger list).

### §8.0c — Studio URL env var verification on Vercel production (~5 minutes; per prior-round F-10 v1.3)

**Prior-round F-10 v1.3 (preserved into v2.0):** `NEXT_PUBLIC_SANITY_STUDIO_URL` is read by §8.5 (route allow-list) at runtime. Both routes run on production deploys, not just preview. If production has the wrong value or unset, the production allow-list either rejects legitimate Studio interactions (D14 strict env schema 500s on missing) or — under v1.2's permissive fallback (now removed in v1.3) — would have silently included localhost in the production allow-list (CMA prior-round F-4 attack vector).

Verify on Vercel **production** env in addition to preview:

1. Open Vercel project settings → Environment Variables → production env.
2. Confirm `NEXT_PUBLIC_SANITY_STUDIO_URL` is set to `https://mygratr-cloudemployee.sanity.studio`.
3. If unset on production: **(v2.0 prose corrected per F5 v2.1 panel finding)** — v2.0 incorrectly claimed "D14 env schema will fail startup on production deploys." This was wrong: §8.1 v2.0 defined `NEXT_PUBLIC_SANITY_STUDIO_URL: z.string().url().optional()`, and Zod's `.optional()` allows `undefined` and does NOT throw on parse. With v2.0's permissive schema, the app silently boots, the undefined Studio URL is filtered out of `allowedOrigins` in both draft-mode routes, and Studio-initiated preview requests are rejected with 403 in production/preview with NO startup warning and NO actionable error message. **v2.1 closes this gap via a Zod `.refine()` on the env var** (see §8.1 below) — the refinement makes the env var **required in production and preview** (and stays optional in development), so production deploys with an unset Studio URL now fail at env-validation startup with a clear error message. Set the var on Vercel production env, redeploy.
4. If set to localhost on production: that's the F-4 attack-vector vulnerability v1.3 closes by removing the `?? 'http://localhost:3333'` fallback from §8.5/§8.6 route code. Update to deployed URL, redeploy.

Halt-and-escalate trigger added to §6 list. Same surface-to-Jake fallback as §8.0b if Vercel access is gated.

### §8.1 — Tighten env schema (per D14)

Per CMA F-1 + F-6 v1.3: env schema strictness is the foundation of §8.5/§8.6 route safety. Tighten the schema BEFORE any route code touches `env.NEXT_PUBLIC_SITE_URL` or `env.SANITY_API_READ_TOKEN`.

Edit `site/src/lib/env.ts`. Locate the existing schema (likely a Zod `z.object({...})` definition consumed by `import { env } from '@/lib/env'`) and tighten the three vars:

```ts
// site/src/lib/env.ts (target schema shape after §8.1)
import { z } from 'zod'

const envSchema = z.object({
  // ... existing schema entries above ...

  // CMA F-1 v1.3: NEXT_PUBLIC_SITE_URL must be a valid URL — new URL(undefined) throws.
  NEXT_PUBLIC_SITE_URL: z.string().url(),

  // CMA F5 v2.1: v2.0 declared this as `.optional()` only and §8.0c prose claimed
  // production deploys would fail startup on unset — that prose was wrong (Zod
  // `.optional()` allows `undefined` and parses silently). v2.1 adds a `.refine()` so
  // the var is REQUIRED in production AND preview (NODE_ENV !== 'development' on
  // Vercel) and remains optional in local dev (where Studio runs on localhost:3333
  // and the env var may not be set). Production/preview deploys with an unset
  // Studio URL now fail at env-validation startup with a clear actionable error.
  NEXT_PUBLIC_SANITY_STUDIO_URL: z.string().url().optional().refine(
    (val) => process.env.NODE_ENV === 'development' || val !== undefined,
    { message: 'NEXT_PUBLIC_SANITY_STUDIO_URL is required in production and preview environments (set on Vercel project env vars; see §8.0b + §8.0c)' },
  ),

  // CMA F-6 v1.3: SANITY_API_READ_TOKEN must be non-empty — empty string passes
  // z.string() but causes validatePreviewUrl 401 with unclear error path.
  // Step 8.2 retasks this as defineLive's serverToken per D5.
  SANITY_API_READ_TOKEN: z.string().min(1),

  // ... existing schema entries below ...
})
```

If the schema currently uses `z.string()` for these, tighten as shown. If `NEXT_PUBLIC_SANITY_STUDIO_URL` is currently `z.string()` (required), make it `.url().optional()` — `.optional()` is for explicit handling of the dev-only case where Studio runs on localhost and the env var may not be set; production and preview must have it (enforced by Vercel env config + §8.0b + §8.0c).

Verify the env loads cleanly with current `.env.local`:

```bash
cd "/Users/jakehall/Documents/CE Ops/Ab3lton/SEO/Code/MASTER PROJECTS_1/Mygratr/site"
npx tsc --noEmit
node --experimental-strip-types -e "import('./src/lib/env.ts').then(m => console.log('ENV OK')).catch(e => { console.error('ENV LOAD FAILED:', e.message); process.exit(1) })"
```

If env load fails: at least one production-required env var is missing or malformed locally. Halt and surface — fix the local `.env.local` before proceeding.

### §8.1.5 — Probe `createClient` stega behavior with `studioUrl: undefined` (NEW v2.1 per F4)

**Why this probe exists (F4 v2.1):** §8.1's D14 schema (with the F5 v2.1 refinement) makes `NEXT_PUBLIC_SANITY_STUDIO_URL` **optional in development only** — dev environments may legitimately have it unset. §8.3.2's target shape passes the value directly to `stega: { studioUrl: env.NEXT_PUBLIC_SANITY_STUDIO_URL }`. The behavior of `@sanity/client`'s `createClient` when `stega: { enabled: true, studioUrl: undefined }` is not specified in the docs and was not probed in v2.0. Two failure modes exist:

1. **Eager validation throws at construction time** — `client.ts` module crashes at load, taking down every page render via the `layout.tsx → live.ts → sanityFetch` import chain. Affects local dev when stega is on + Studio URL unset.
2. **Silent acceptance** — produces stega-encoded markup with broken overlay URLs on every preview response. §8.7's smoke test runs with `NEXT_PUBLIC_SANITY_STUDIO_URL` presumably set, so it will NOT catch the undefined path.

The probe determines which outcome holds, and the result drives the §8.3.2 implementation:

```bash
cd "/Users/jakehall/Documents/CE Ops/Ab3lton/SEO/Code/MASTER PROJECTS_1/Mygratr/site"
node --experimental-strip-types -e "
import { createClient } from 'next-sanity'
try {
  const c = createClient({
    projectId: 'test',
    dataset: 'test',
    apiVersion: '2024-01-01',
    useCdn: false,
    perspective: 'published',
    stega: { enabled: true, studioUrl: undefined },
  })
  // CMA M9 v2.2: OUTCOME line is a single-token authoritative result. Detail lines emit
  // separately on subsequent lines so the dispatcher's exact-match grep cannot collide
  // with descriptive text on the same line. The dispatcher matches '^OUTCOME: ACCEPTS\$'
  // EXACTLY (no trailing content allowed).
  console.log('OUTCOME: ACCEPTS')
  console.log('detail: createClient accepts studioUrl:undefined silently — stega overlays will be broken but no construction crash')
  console.log('decision: §8.3.2 code path = ship dev-only fallback (studioUrlForStega) as default')
} catch (e) {
  // CMA M9 v2.2: same single-token discipline on the THROWS branch.
  console.log('OUTCOME: THROWS')
  console.log('detail: createClient throws on studioUrl:undefined: ' + e.message)
  console.log('decision: §8.3.2 code path = gate stega.enabled on !!env.NEXT_PUBLIC_SANITY_STUDIO_URL')
  process.exit(0)
}
" 2>&1 | tee audit-output/design-1/stega-studio-url-undefined-probe.md
```

**Expected outcomes + decision tree:**

- **If `createClient` THROWS at construction:** §8.3.2's `stega.enabled` must be gated on `studioUrl` being defined. Use the following shape in §8.3.2 instead of the version specified there:

  ```ts
  stega: {
    enabled: stegaEnabled && !!env.NEXT_PUBLIC_SANITY_STUDIO_URL,
    studioUrl: env.NEXT_PUBLIC_SANITY_STUDIO_URL,
  },
  ```

  This silently disables stega in dev when Studio URL is unset — broken overlays in dev are still bad UX, but better than a module-scope construction crash.

- **If `createClient` SILENTLY ACCEPTS `studioUrl: undefined`:** §8.3.2's optional dev-only fallback (`studioUrlForStega`) is **mandatory not optional** when local dev stega is required. Make the fallback the default code path:

  ```ts
  const studioUrlForStega = env.NEXT_PUBLIC_SANITY_STUDIO_URL
    ?? (process.env.NODE_ENV === 'development' ? 'http://localhost:3333' : undefined)
  // ...
  stega: { enabled: stegaEnabled, studioUrl: studioUrlForStega },
  ```

  Production/preview will always have the env var set (per the F5 refinement). Dev gets the localhost fallback.

#### Shell-level outcome dispatcher (mandatory)

The probe output is parsed mid-execution to select the §8.3.2 code path. Run this dispatcher immediately after the probe block; it makes §6 trigger #9 actually fire on unanticipated outcomes (rather than relying on Claude Code to notice ambiguity by eye).

**CMA M9 v2.2 (gpt-5.4_logic):** the dispatcher uses **exact-token matching** on each branch, not substring match on a single captured line. The v2.1 form (`grep "^OUTCOME:" ... | head -1` plus substring-match) was fragile against probe-script edits that emit multiple OUTCOME-prefixed lines or that decorate the line with descriptive text — `head -1` would silently pick the wrong line. The v2.2 form anchors each branch to a single canonical token (`OUTCOME: THROWS` or `OUTCOME: ACCEPTS`) with `^...$` end-anchors, eliminating the ambiguity class entirely. The probe (above) is paired with this discipline: it emits the single-token result line followed by separate `detail:` / `decision:` lines for human readability.

```bash
PROBE_FILE="audit-output/design-1/stega-studio-url-undefined-probe.md"

if grep -q "^OUTCOME: THROWS$" "$PROBE_FILE"; then
  echo "§8.3.2 code path selected: gate stega.enabled on !!env.NEXT_PUBLIC_SANITY_STUDIO_URL"
elif grep -q "^OUTCOME: ACCEPTS$" "$PROBE_FILE"; then
  echo "§8.3.2 code path selected: ship dev-only fallback (studioUrlForStega) as default"
else
  echo "HALT: §6 trigger #9 — unanticipated outcome from createClient stega probe."
  echo "Probe output (full):"
  cat "$PROBE_FILE"
  echo
  echo "Expected exactly ONE of these canonical lines in the probe output:"
  echo "  OUTCOME: THROWS"
  echo "  OUTCOME: ACCEPTS"
  echo "Neither was found, or both were found, or a near-match was emitted."
  echo "Surface to Jake before §8.3.2 — do NOT guess the code path."
  exit 1
fi
```

The dispatcher uses three branches:
1. **`OUTCOME: THROWS` (exact match)** — the probe caught a construction-time exception. §8.3.2 gates `stega.enabled` on `!!env.NEXT_PUBLIC_SANITY_STUDIO_URL`.
2. **`OUTCOME: ACCEPTS` (exact match)** — the probe constructed the client without throwing. §8.3.2 ships the `studioUrlForStega` dev-fallback as the default code path (not optional).
3. **Neither** — the probe output is malformed, the canonical token line is missing or decorated, or the probe emitted both tokens (indicating it was edited to a different shape). Halt; do NOT guess. §6 trigger #9 fires.

Capture the selected code path in `audit-output/design-1/stega-studio-url-undefined-probe.md` as a final line (e.g., `# §8.3.2 code path selected: gate stega.enabled on !!env.NEXT_PUBLIC_SANITY_STUDIO_URL`). Surface in HALT 2.

#### Halt-and-escalate trigger (added to §6)

If the probe's outcome is one Claude Code did not anticipate (neither clean throw nor clean silent-accept — e.g., logs a warning then accepts, or accepts but then crashes at first stega-encoded fetch), the shell dispatcher above exits with code 1 and §6 trigger #9 fires. Surface to Jake before §8.3.2 lands. The probe's purpose is to make this behavior explicit; an unexpected outcome means §8.3.2's design assumptions need re-derivation.

Save the probe output verbatim to `audit-output/design-1/stega-studio-url-undefined-probe.md` (gitignored). Per D15.

### §8.2 — Add serverToken to defineLive (per D5)

Edit `site/src/lib/sanity/live.ts`. Target shape:

```ts
import 'server-only'
import { defineLive } from 'next-sanity/live'
import { sanityClient } from './client'
import { env } from '@/lib/env'

export const { sanityFetch, SanityLive } = defineLive({
  client: sanityClient,
  // CMA-C2 + D5: serverToken retasks the existing viewer-scoped SANITY_API_READ_TOKEN.
  // Token viewer-scope re-confirmed at §8.0a; non-empty enforced by D14 schema strictness.
  serverToken: env.SANITY_API_READ_TOKEN,
})
```

If the file currently uses `process.env.SANITY_API_READ_TOKEN` directly (instead of going through the Zod-validated `env` object), switch to `env.SANITY_API_READ_TOKEN` so the D14 strictness applies. The previously-separate `previewClient` is removed at §8.3 — `live.ts` only ever needed `sanityClient`.

Verify:

```bash
cd "/Users/jakehall/Documents/CE Ops/Ab3lton/SEO/Code/MASTER PROJECTS_1/Mygratr/site"
npx tsc --noEmit
```

### §8.3.0 — Pre-refactor previewClient grep evidence (BEFORE state; per D15)

Before any code edits to single-client collapse, save the BEFORE state of all `previewClient` call sites + references repo-wide:

```bash
cd "/Users/jakehall/Documents/CE Ops/Ab3lton/SEO/Code/MASTER PROJECTS_1/Mygratr"
grep -rn "previewClient" \
  --exclude-dir=node_modules \
  --exclude-dir=.audit \
  --exclude-dir=_archive \
  --exclude-dir=audit-output \
  --exclude-dir=.next \
  --exclude-dir=storybook-static \
  site/ studio/ scripts/ src/ 2>&1 \
  | tee audit-output/design-1/preview-client-callers-before.txt
```

Expected output: list of all call sites that import or reference `previewClient`. Count + paths recorded for the HALT 2 surface. Confirm at least the following call sites appear (SCAFFOLD-1 baseline):

- `site/src/lib/sanity/client.ts` — the `export const previewClient = createClient(...)` definition.
- `site/src/app/api/draft-mode/enable/route.ts` — the `validatePreviewUrl(previewClient, request.url)` call site.

If grep returns empty BEFORE the refactor, halt and check why — the assumption is SCAFFOLD-1 shipped `previewClient` and it has callers. Empty BEFORE-state means either the file was already refactored mid-session, or the grep is missing a glob.

If grep surfaces UNANTICIPATED `previewClient` callers (anything outside `site/src/lib/sanity/client.ts` + `site/src/app/api/draft-mode/enable/route.ts`), halt — Hard Rule #4 brief-vs-reality finding. Surface to Jake. Do NOT silently rewrite unanticipated callers.

Artifact saved to `audit-output/design-1/preview-client-callers-before.txt` (gitignored under the audit-output/ pattern; survives across sessions in the working tree per D15).

#### Secondary grep for module path (NEW v2.1 per F10)

The literal-symbol grep above catches direct `previewClient` references but misses two known patterns:

1. **Dynamic imports:** `await import('./client')).previewClient` — string-literal module path not exposed to symbol grep.
2. **Barrel re-exports:** consumers importing via an index path (`from '@/lib/sanity'` rather than `from '@/lib/sanity/client'`).

Add a secondary path-based grep alongside the symbol grep:

```bash
cd "/Users/jakehall/Documents/CE Ops/Ab3lton/SEO/Code/MASTER PROJECTS_1/Mygratr"
grep -rn "from.*sanity/client" \
  --exclude-dir=node_modules \
  --exclude-dir=.audit \
  --exclude-dir=_archive \
  --exclude-dir=audit-output \
  --exclude-dir=.next \
  --exclude-dir=storybook-static \
  site/ studio/ scripts/ src/ 2>&1 \
  | grep -v "next-sanity" \
  | tee audit-output/design-1/sanity-client-path-callers-before.txt
```

The `| grep -v "next-sanity"` filter excludes the legitimate `from 'next-sanity'` package imports (which contain the substring `sanity/client` but are unrelated to our local `./sanity/client` module). The remaining matches are call sites that import from the local `./sanity/client` module by path — they need the same refactor pass as the symbol-grep matches.

Combined coverage at HALT 2 = symbol grep + path grep + `tsc --noEmit` static-type check. The three together comprehensively cover both static and dynamic import paths. F10 v2.1 closes the dynamic-import / barrel-re-export coverage gap.

### §8.3 — Single-client collapse with tightened stega gating (per D4 + D5 + F-4)

**Structural change.** Replace `site/src/lib/sanity/client.ts` two-client setup with a single client. CLAUDE.md scaffold-state and env-vars table both record this as the canonical DESIGN-1 plan.

#### §8.3.1 — Capture existing apiVersion (per F-13 v1.2)

```bash
grep -E '^\s*apiVersion' site/src/lib/sanity/client.ts
```

Capture the literal string value (e.g., `'2026-05-01'`) for substitution into the new client.ts. **CMA F-13 v1.2: do NOT write the literal string `<PRESERVE_FROM_EXISTING_CLIENT_TS>` into code.** Use the actual captured value.

If `grep` returns nothing, the SCAFFOLD-1 client.ts may use a different shape (e.g., `apiVersion` set via a constant import). Halt and surface — brief-vs-reality finding.

#### §8.3.2 — New client.ts target shape

```ts
import 'server-only'
import { createClient } from 'next-sanity'
import { env } from '@/lib/env'

// CMA F-4 v1.3 (panel 2-model consensus, Sonnet + GPT-5.4): tightened stega gating.
// AND-with-prod-block on the explicit flag closes the regression where a misconfigured
// SANITY_STEGA_ENABLED=1 on production env would have leaked stega into production HTML.
//
// CMA F1 + F2 v2.1 (panel 2-model: claude-sonnet-4.6_security + gemini-3-pro_production):
//   - F2: v2.0's Branch B included `&& NODE_ENV !== 'production'`, which evaluates to FALSE
//     on every Vercel preview deploy because Vercel sets NODE_ENV='production' for ALL
//     builds and runtimes (preview + production + dev-on-vercel). v2.0's Branch B was
//     silently broken — stega never enabled on preview unless SANITY_STEGA_ENABLED=1 was
//     also set, defeating the out-of-the-box preview Visual Editing UX. v2.1 drops the
//     NODE_ENV clause from Branch B; VERCEL_ENV === 'preview' is sufficient and accurate.
//   - F1: see the raw-env guard below (replaces v2.0's unreachable + throw-on-prod guard).
//
// CMA F15 v2.1 (gpt-5.4_logic): Branch A enables stega on any non-production VERCEL_ENV,
// including `undefined` (local dev) and other non-prod values. This is by design — it's
// the explicit opt-in path for local development and any non-production Vercel environment.
// NOT a bug; comment captures intent so future readers don't narrow it.
//
// `let` not `const` because the F1 raw-env guard below may override to `false`.
let stegaEnabled =
  // Branch A: explicit opt-in for local dev AND any non-production Vercel environment.
  (process.env.SANITY_STEGA_ENABLED === '1' && process.env.VERCEL_ENV !== 'production') ||
  // Branch B: automatic enable on Vercel preview deployments.
  // NOTE: NODE_ENV is ALWAYS 'production' on Vercel (preview AND prod), so checking it
  // would always be false here — do not add `&& NODE_ENV !== 'production'`. F2 v2.1.
  (process.env.VERCEL_ENV === 'preview')

// CMA F1 v2.1: independent raw-env check — fires regardless of computed stegaEnabled.
// v2.0's `if (stegaEnabled && VERCEL_ENV === 'production') throw` was:
//   (a) LOGICALLY UNREACHABLE — by construction, stegaEnabled can never be true when
//       VERCEL_ENV === 'production' (Branch A requires VERCEL_ENV !== 'production';
//       Branch B requires VERCEL_ENV === 'preview'). The guard provided ZERO actual
//       protection — a future edit that weakened the gate expression would NOT be
//       caught by it. False-confidence theatre.
//   (b) AN AVAILABILITY RISK — a module-scope `throw` in a file imported by
//       layout.tsx → live.ts → sanityFetch crashes the entire worker on every page
//       render, taking down the production site. Unacceptable cost for a
//       misconfiguration that should be caught by env schema + CI, not at runtime.
//
// v2.1 replacement: check the RAW env vars (not the computed stegaEnabled). This fires
// even if the gate expression is weakened by a future edit. Force stegaEnabled to false
// and emit a diagnostic log. Do NOT throw — preserve availability.
//
// CMA I5 v2.2 (gemini-3-pro_production): severity downgraded from console.error → console.warn.
// Rationale: this is module-scope code, re-evaluated on every cold start of every new
// serverless isolate. Under high traffic, hundreds of concurrent cold starts each emit
// the log line. All major observability platforms (Sentry, Datadog, PagerDuty, NewRelic)
// map severity by JS console method:
//   - console.error → "Error" or "Fatal" → triggers on-call alerts at default thresholds
//   - console.warn  → "Warning"          → captured + visible, no page
// At the misconfiguration severity (admin set a flag wrong; route still serves correctly
// because we force-disable stega), the trade-off is correct: visibility kept (Vercel
// renders console.warn in yellow text, still prominently surfaced in runtime logs),
// alert-noise discipline preserved (no false-positive fatal pages for non-fatal config drift).
// The diagnostic message is unchanged so message-grep alerting rules continue to work.
if (
  process.env.VERCEL_ENV === 'production' &&
  process.env.SANITY_STEGA_ENABLED === '1'
) {
  console.warn(
    'CRITICAL [CMA F1 v2.1 + I5 v2.2]: SANITY_STEGA_ENABLED must not be "1" on production. ' +
    'Forcing stegaEnabled = false. Remove the env var from production immediately. ' +
    'See docs/briefs/active/MYGRATR-DESIGN-1-BRIEF-B_v2.2.md §8.3.2 for context.'
  )
  stegaEnabled = false
}

export const sanityClient = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '<paste captured value from §8.3.1 grep>',
  // CMA F-9 v1.3: useCdn depends on stegaEnabled — stega requires fresh API responses
  // (not CDN-cached) for click-to-edit overlay markup. Production-without-stega uses CDN.
  useCdn: process.env.NODE_ENV === 'production' && !stegaEnabled,
  perspective: 'published',
  // NOTE: stega.studioUrl behavior with `undefined` is verified at §8.1.5 probe (F4 v2.1).
  // If the probe finds createClient throws on undefined, replace `enabled: stegaEnabled`
  // below with `enabled: stegaEnabled && !!env.NEXT_PUBLIC_SANITY_STUDIO_URL`.
  stega: { enabled: stegaEnabled, studioUrl: env.NEXT_PUBLIC_SANITY_STUDIO_URL },
  // token: undefined here — server-side reads use defineLive's serverToken (per §8.2 + D5).
})
```

Note `stega.studioUrl` no longer carries `?? 'http://localhost:3333'` fallback — D14 makes the env var required on prod/preview; for dev the env var may legitimately be unset and stega just doesn't initialise (the explicit `optional()` in D14 handles this). If you need the fallback for dev-only stega, add it inside the dev-only branch explicitly:

```ts
const studioUrlForStega = env.NEXT_PUBLIC_SANITY_STUDIO_URL
  ?? (process.env.NODE_ENV === 'development' ? 'http://localhost:3333' : undefined)
```

Use this only if dev-environment stega is required for local Visual Editing testing. Production and preview MUST have `NEXT_PUBLIC_SANITY_STUDIO_URL` set explicitly per §8.0b/§8.0c.

#### §8.3.3 — Migrate validatePreviewUrl caller (per F-7 + F-12 v1.3)

The previously-separate `previewClient` is removed. The single anticipated caller in the SCAFFOLD-1 baseline is `validatePreviewUrl(previewClient, request.url)` in `site/src/app/api/draft-mode/enable/route.ts`. Migrate to a NAMED module-scope helper per CMA F-7 + F-12 v1.3:

```ts
// site/src/app/api/draft-mode/enable/route.ts (top-of-file, before the GET handler)
import { createClient } from 'next-sanity'
import { env } from '@/lib/env'

// CMA F-7 v1.3: extracted as named helper so the equivalence vs SCAFFOLD-1's previewClient
// is reviewable. Identical config: token + draft perspective + no CDN + matching project/dataset.
// CMA F-12 v1.3: module-scope, not constructed per-request.
//
// CMA F12 v2.1 (claude-opus-4.6_data_integrity): defensive runtime check against silent
// failure from circular imports. env.ts is currently a leaf module (imports only `zod`),
// so circular risk is low TODAY. But if a future phase adds an env.ts dependency on a
// Sanity utility that transitively imports enable/route.ts, the circular dependency would
// cause `env` to be `undefined` at construction time, createClient would receive
// `token: undefined`, and validatePreviewUrl would silently return 401 on every request
// with NO diagnostic pointing at the circular import. The explicit check below converts
// the silent 401 into an explicit crash with a clear diagnostic message. The check uses
// the env-validated `env.SANITY_API_READ_TOKEN` rather than process.env directly, so
// D14's z.string().min(1) refinement still applies — this is a belt-and-braces against
// circular-import edge cases, not a substitute for schema validation.
//
// CMA M7 v2.2 (gemini-3-pro_production + gpt-5.4_security, 2-model consensus): optional
// chaining is REQUIRED here. Without `?.`, if `env` itself is `undefined` (the exact
// circular-import case this guard defends against), `env.SANITY_API_READ_TOKEN` throws
// a native `TypeError: Cannot read properties of undefined (reading
// 'SANITY_API_READ_TOKEN')` BEFORE the `if` condition evaluates. The TypeError masks the
// carefully-authored diagnostic Error below and the operator sees a generic native crash
// instead of "possible circular import with env.ts". The `?.` operator short-circuits to
// `undefined` when `env` is undefined, which is then caught by the `!` falsy check,
// allowing the authored diagnostic to fire. This is Pattern 13 (sharpened at v2.2 lock):
// a defensive guard added in response to a prior finding (F12) needed its own
// reachability + side-effect analysis to land correctly.
if (!env?.SANITY_API_READ_TOKEN) {
  throw new Error(
    'SANITY_API_READ_TOKEN is empty at module load in enable/route.ts — ' +
    'possible circular import with env.ts (env undefined at evaluation time) or ' +
    'missing env var that escaped D14 schema validation. ' +
    'See docs/briefs/active/MYGRATR-DESIGN-1-BRIEF-B_v2.2.md §8.3.3 + F12 v2.1 + M7 v2.2.'
  )
}

const previewValidationClient = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '<paste captured value from §8.3.1>',
  useCdn: false,
  token: env.SANITY_API_READ_TOKEN,
  perspective: 'previewDrafts',
})
```

Defined at the top of `route.ts`, used inside the handler. Module-scope avoids re-instantiation per-request (F-12). Naming `previewValidationClient` (not `previewClient`) keeps the post-refactor grep clean. The F12 v2.1 defensive throw is a module-scope check (NOT in the request handler) — it fires at module evaluation time, BEFORE any request is served, so it cannot be exercised by a request and cannot crash a request-scoped worker. If it fires, the deploy fails at startup — the correct fail-fast outcome.

#### §8.3.4 — Repo-wide grep for any other unanticipated callers (per F-9 v1.3 carry-forward)

Repeat the §8.3.0 grep at this point as a sanity check that no caller has been missed during the refactor edits:

```bash
cd "/Users/jakehall/Documents/CE Ops/Ab3lton/SEO/Code/MASTER PROJECTS_1/Mygratr"
grep -rn "previewClient" \
  --exclude-dir=node_modules \
  --exclude-dir=.audit \
  --exclude-dir=_archive \
  --exclude-dir=audit-output \
  --exclude-dir=.next \
  --exclude-dir=storybook-static \
  site/ studio/ scripts/ src/ 2>&1
```

Expected interim output (post-edits, pre-§8.3.N): the file `site/src/lib/sanity/client.ts` no longer exports `previewClient`; the file `site/src/app/api/draft-mode/enable/route.ts` no longer imports `previewClient` (uses `previewValidationClient` instead). Any caller not yet migrated surfaces here — Hard Rule #4 brief-vs-reality finding.

#### §8.3.5 — CONVENTIONS.md supersession (in-line within §8.3 commit)

Update `CONVENTIONS.md` "Sanity Client Pattern in the Generated Site" section: replace the SCAFFOLD-1 two-client documentation with the single-client pattern. **Locate the section by exact heading match** (Step 6's 212-line UI_STRINGS section may have shifted line offsets in CONVENTIONS.md; do NOT assume the v1.3 line numbers still hold):

```bash
grep -n "Sanity Client Pattern" CONVENTIONS.md
```

The supersession-by-DESIGN-1 is recorded inline in the section header (e.g., "Sanity Client Pattern in the Generated Site (DESIGN-1 supersedes SCAFFOLD-1's two-client baseline)"). The full prose for the supersession is drafted in §8.8 below — at §8.3.5 you only replace the existing section content; the §8.8 step lists the 5 entries (1 supersession + 4 new) as a single deliverable surfaced at HALT 3.

### §8.3.N — Post-refactor previewClient grep evidence (AFTER state; per D15)

After all refactor edits committed-to-disk but BEFORE HALT 2 commit:

```bash
cd "/Users/jakehall/Documents/CE Ops/Ab3lton/SEO/Code/MASTER PROJECTS_1/Mygratr"
grep -rn "previewClient" \
  --exclude-dir=node_modules \
  --exclude-dir=.audit \
  --exclude-dir=_archive \
  --exclude-dir=audit-output \
  --exclude-dir=.next \
  --exclude-dir=storybook-static \
  site/ studio/ scripts/ src/ 2>&1 \
  | tee audit-output/design-1/preview-client-callers-after.txt
```

**Expected output: empty (zero matches).** If grep returns ANY remaining references to `previewClient`, halt — refactor incomplete. The brief's success criterion for §8.3 is grep returns empty.

Also verify the F-7/F-12 named-helper migration via a complementary grep for any inline `createClient({...})` calls inside `validatePreviewUrl`'s former scope:

```bash
grep -nE "createClient\(\{" site/src/app/api/draft-mode/enable/route.ts \
  | tee audit-output/design-1/validate-preview-url-inline-client-after.txt
```

Expected: exactly ONE match, on the line declaring `const previewValidationClient = createClient({` at module scope (top of file). If grep shows TWO matches (e.g., one at module scope + one inside the handler), the F-12 module-scope discipline was violated — halt and refactor.

If `preview-client-callers-after.txt` is NOT empty, do NOT proceed to HALT 2 commit. Re-grep, identify the missed reference, refactor it, re-save after-file.

#### Secondary path-based grep AFTER state (NEW v2.1 per F10)

Mirror the §8.3.0 secondary grep to verify dynamic-import / barrel-re-export coverage post-refactor:

```bash
cd "/Users/jakehall/Documents/CE Ops/Ab3lton/SEO/Code/MASTER PROJECTS_1/Mygratr"
grep -rn "from.*sanity/client" \
  --exclude-dir=node_modules \
  --exclude-dir=.audit \
  --exclude-dir=_archive \
  --exclude-dir=audit-output \
  --exclude-dir=.next \
  --exclude-dir=storybook-static \
  site/ studio/ scripts/ src/ 2>&1 \
  | grep -v "next-sanity" \
  | tee audit-output/design-1/sanity-client-path-callers-after.txt
```

**Expected output state:** the after-state SHOULD contain only the import lines that still reference the local `./sanity/client` module post-refactor (e.g., `import { sanityClient } from '@/lib/sanity/client'` in `live.ts`). What the after-state must NOT contain: any line that imports `previewClient` by name via a barrel re-export, dynamic import, or path-by-name reference.

Cross-check: any line in `sanity-client-path-callers-after.txt` that also matches the pattern `previewClient` (case-sensitive) is a missed migration:

```bash
grep "previewClient" audit-output/design-1/sanity-client-path-callers-after.txt && echo "FAIL: missed migration" || echo "PASS: no previewClient via path imports"
```

If FAIL: halt, identify the missed reference, refactor it, re-save both after-files. Do not proceed to HALT 2 commit.

Combined evidence at HALT 2 = symbol grep + path grep + `tsc --noEmit` + complementary inline-client grep. Four artifact files surfaced at HALT 2 per D15 + F10 v2.1.

### §8.4 — presentationTool method probe via DevTools network inspection (per F-1 + F-5 v1.3)

**Reordered to run BEFORE route conversion per CMA F-1 v1.3.** The §8.5/§8.6 route conversions depend on knowing what HTTP method Sanity's `presentationTool` uses to drive the iframe. v1.2 (and parent v2.0) ordered this probe AFTER route conversion — that's a sequencing bug that ships POST-only routes and only catches the iframe break at §8.7 smoke test (HALT 3, AFTER infrastructure committed to git).

**The probe v1.2 specified (`Object.keys(p)`) does NOT reveal HTTP method.** That probe was a brief-authoring placeholder. Per CMA F-5 v1.3: the only reliable verification is browser DevTools network inspection during a live Studio session.

#### Procedure

1. Start Studio: `cd studio && npm run dev` (typically `localhost:3333`)
2. Start site: `cd site && npm run dev` (typically `localhost:3000`) — this still has the SCAFFOLD-1 GET handlers; that's expected for the probe. The probe observes Sanity's outbound request shape, not the route's response handling.
3. Open Studio in browser. Open DevTools → Network tab → filter for `draft-mode`.
4. Open Studio's Presentation tool. Navigate to a known document (any `blogPost` from CONTENT-1C will do).
5. Observe the request to `/api/draft-mode/enable`:
   - **Method?** (GET or POST)
   - **Sent as iframe top-level navigation, or as fetch?** (top-level nav appears as document-type request; fetch appears as xhr/fetch)
   - **Query string?** (look for `?sanity-preview-secret=...`)
   - **Headers?** (Origin? Referer? Authorization?)

#### Expected outcome (per CMA F-1 v1.3)

Sanity's `presentationTool` initiates preview by **top-level iframe navigation with GET + `?sanity-preview-secret=...` query string.** This is `@sanity/preview-url-secret`'s documented design. POST-only enable cannot be driven by iframe top-level navigation.

If the observed method is **GET-with-querystring as expected**: §8.5 keeps GET on enable (with hardened Referer/Origin + secret + redirect — see §8.5 below).

If the observed method is **POST or fetch-based**: that's a brief-vs-reality finding. Halt and surface — D6 must be reframed in real time, and Brief B's §8.5/§8.6 examples need rewriting against the actual API contract.

#### Artifact (per D15)

Document the observation in `audit-output/design-1/visual-editing-method-probe.md` (gitignored). Capture:
- Method (GET / POST / other)
- Transport (top-level navigation vs xhr/fetch)
- Query string contents (full URL, with `sanity-preview-secret` value redacted to `***REDACTED***`)
- Request headers (Origin, Referer, Accept, User-Agent, Cookie presence/absence)
- Response handling observed in DevTools

This is reference data for §8.5/§8.6 implementation and for the §8.7 smoke test. Surface in HALT 2 review for Jake.

### §8.5 — Enable route: GET with hardened Referer/Origin + secret + same-origin redirect (per D6 reframe + F-1/F-2/F-6/F-7/F-12 v1.3)

Edit `site/src/app/api/draft-mode/enable/route.ts`. **GET-only**, not POST. The auth barriers are: (a) preview-url secret, (b) same-origin `redirectTo`, (c) Referer/Origin allow-list.

Target shape (full file, including the §8.3.3 module-scope helper):

```ts
import { validatePreviewUrl } from '@sanity/preview-url-secret'
import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from 'next-sanity'
import { env } from '@/lib/env'

// CMA F-7 v1.3: extracted as named helper so the equivalence vs SCAFFOLD-1's previewClient
// is reviewable. Identical config: token + draft perspective + no CDN + matching project/dataset.
// CMA F-12 v1.3: module-scope, not constructed per-request.
// CMA F12 v2.1: defensive throw guards against silent 401 from circular-import edge case
// (env undefined at module evaluation). Module-scope check, not request-scope — fires at
// deploy/startup time. See §8.3.3 for full rationale.
// CMA M7 v2.2: optional chaining (?.) ensures the diagnostic Error fires even when `env`
// itself is undefined (the exact circular-import case F12 defends against). Without ?.,
// `env.SANITY_API_READ_TOKEN` throws native TypeError BEFORE the if-check, masking the
// authored diagnostic. See §8.3.3 for full rationale.
if (!env?.SANITY_API_READ_TOKEN) {
  throw new Error(
    'SANITY_API_READ_TOKEN is empty at module load in enable/route.ts — ' +
    'possible circular import with env.ts or missing env var. See §8.3.3 + F12 v2.1 + M7 v2.2.'
  )
}

const previewValidationClient = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '<paste captured value from §8.3.1>',
  useCdn: false,
  token: env.SANITY_API_READ_TOKEN,
  perspective: 'previewDrafts',
})

// CMA F-1 v1.3: GET (not POST) per Sanity's preview-url-secret iframe-navigation flow.
// CMA F-2 v1.3: SECURITY ORDER — origin/referer check → secret → redirectTo → enable → redirect.
// Do NOT reorder. draftMode().enable() must be the LAST operation before redirect.
export async function GET(request: Request) {
  // -------- STEP 1: build Origin/Referer allow-list (fail closed on malformed env vars) --------
  // CMA F-1 v1.3: try/catch around new URL() — fail closed (403) on undefined/malformed env var,
  // never crash with 500. .filter() handles the optional NEXT_PUBLIC_SANITY_STUDIO_URL case.
  //
  // CMA F14 v2.1: NEXT_PUBLIC_SANITY_STUDIO_URL is optional in dev only (D14 + F5 v2.1
  // refinement: required in production + preview, optional in development). When unset
  // in dev, the .filter() below drops it and Studio-origin requests are rejected with 403.
  // This is correct fail-closed behavior — set the env var in `site/.env.local` if the
  // local Studio is running (pre-flight check #17 v2.1 verifies).
  //
  // CMA F8 v2.1: explicit exclusion of the literal-string "null" origin AND empty-string
  // origin. `new URL('/').origin` returns the literal string "null" (not the `null` value)
  // in some environments. Sandboxed iframes send `Origin: null` as a literal string. If
  // any allow-list env var resolved to a "null" origin (e.g., a path-relative URL that
  // passed D14's z.string().url() in some edge case), the allow-list would contain "null"
  // and a sandboxed-iframe request would match. The D14 `.url()` validator partially
  // mitigates this, but the defense must be explicit in the route code.
  const rawAllowed = [env.NEXT_PUBLIC_SITE_URL, env.NEXT_PUBLIC_SANITY_STUDIO_URL]
    .filter((v): v is string => typeof v === 'string' && v.length > 0)

  const allowedOrigins = rawAllowed.flatMap((allowed) => {
    try {
      const origin = new URL(allowed).origin
      // CMA F8 v2.1: reject literal "null" string + empty origin.
      if (origin === 'null' || origin === '') return []
      return [origin]
    } catch { return [] }
  })

  // -------- STEP 2: Origin/Referer check --------
  // CMA F-1 + prior-round F-2 v1.3: Origin may be absent on top-level navigation; fall back
  // to Referer (which iframes do send). Either must match the allow-list.
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const refererOrigin = referer ? safeUrlOrigin(referer) : null

  const callerOrigin = origin ?? refererOrigin
  if (allowedOrigins.length === 0 || !callerOrigin || !allowedOrigins.includes(callerOrigin)) {
    return new Response('Origin not allowed', { status: 403 })
  }

  // -------- STEP 3: preview-url secret validation --------
  // CMA F-6 v1.3: try/catch around validatePreviewUrl — error may carry token metadata in
  // Authorization header traces. Do not log, do not serialize, do not propagate Error.message.
  //
  // CMA F7 v2.1 (claude-sonnet-4.6_security): explicit named binding `err` + prohibition
  // comment. A well-intentioned future developer might add `captureException(err)` (Sentry,
  // Datadog, etc.) here, which would forward the full error object — including any
  // `Authorization: Bearer <token>` header values carried in validatePreviewUrl's internal
  // HTTP-call traces — to a third-party logging service. The named `err` binding is here
  // SPECIFICALLY so the prohibition can reference it, NOT so it can be logged.
  let validation: { isValid: boolean; redirectTo?: string }
  try {
    validation = await validatePreviewUrl(previewValidationClient, request.url)
  } catch (err) {
    // SECURITY (CMA F-6 v1.3 + F7 v2.1): `err` may contain Authorization header values
    // captured from validatePreviewUrl's internal HTTP calls. DO NOT:
    //   - log err, err.message, err.stack, JSON.stringify(err), or any field of err
    //   - call captureException(err) / Sentry.captureException(err) / similar
    //   - forward err to Datadog, NewRelic, Honeycomb, or any third-party error service
    //   - return err.message in the response body (we return a generic string instead)
    // SAFE: a sanitized indicator without the error object — e.g.:
    //   console.error('[draft-mode/enable] validatePreviewUrl threw — check token config')
    // The framework error handler is intentionally bypassed by returning an explicit
    // Response — Next.js's default 500 page may format and surface err contents in dev.
    return new Response('Preview validation failed', { status: 500 })
  }
  if (!validation.isValid) return new Response('Invalid secret', { status: 401 })

  // -------- STEP 4: redirectTo same-origin check (BEFORE draftMode().enable()) --------
  // CMA F-2 v1.3: redirectTo same-origin check BEFORE draftMode().enable() — NEVER reorder.
  // An attacker with a valid secret could otherwise leverage an open-redirect into a
  // session-fixation by getting draftMode cookie set before redirect target validated.
  const base = new URL(env.NEXT_PUBLIC_SITE_URL)  // safe per D14 z.string().url()
  const target = new URL(validation.redirectTo ?? '/', base)
  if (target.origin !== base.origin) {
    return new Response('Invalid redirect target', { status: 400 })
  }

  // -------- STEP 5: enable draft mode (ONLY after all validations pass) --------
  ;(await draftMode()).enable()

  // -------- STEP 6: redirect to validated target --------
  redirect(`${target.pathname}${target.search}${target.hash}`)
}

function safeUrlOrigin(url: string): string | null {
  try { return new URL(url).origin }
  catch { return null }
}
```

#### Critical: security order is non-negotiable

Steps 1 → 6 above are the **canonical security order** per CMA F-2 v1.3. **Do NOT reorder.** Specifically:

- `draftMode().enable()` must be **STEP 5**, not earlier. Setting the `__prerender_bypass` / draft-mode cookie BEFORE secret validation or BEFORE redirect-target validation creates session-fixation risk.
- The Origin/Referer check (STEP 2) must be **BEFORE** the secret check (STEP 3) — early-rejection on bad origin saves a Sanity API roundtrip and reduces information leakage to unauthorized callers.
- The redirect-target same-origin check (STEP 4) must be **BEFORE** `draftMode().enable()` — see CMA F-2 v1.3 for the open-redirect-into-session-fixation chain.

Integration tests (a)/(b)/(c) at §8.7 verify the order via `Set-Cookie` absence on failure paths. If any of (a), (b), (c) reveals a cookie set on a 4XX response, the security order is broken — halt and reorder per the example above.

#### REGISTRY.md update

Update `REGISTRY.md` to note the route is GET with new hardening (CMA F-2 v1.3 + F-5 v1.3 — REGISTRY.md was previously documenting both routes as GET with no note about the planned conversion; v1.3 keeps enable as GET so REGISTRY.md needs only the new hardening note, not a method change for this route).

Locate the relevant table by `grep -n "draft-mode" REGISTRY.md`.

### §8.6 — Disable route: POST with dual Origin + Referer check (per D6 reframe + F-3 Option A v1.3)

Edit `site/src/app/api/draft-mode/disable/route.ts`. **POST**, not GET. Disable is triggered by a button click that issues a `fetch`, NOT by iframe navigation — so POST is appropriate here. Origin + Referer both checked (Option A: close the gap that v1.2 deferred to QA-1).

Target shape:

```ts
import { draftMode } from 'next/headers'
import { env } from '@/lib/env'

// CMA F-1 v1.3: POST is the right method for disable (button click → fetch, not iframe nav).
// CMA F-3 v1.3 (Option A): Origin AND Referer both checked. Disable has no preview-url secret
// (Sanity convention); this dual-check IS the CSRF barrier. Single-Origin gate is insufficient
// because Origin can be null on some browser/sandbox configs.
export async function POST(request: Request) {
  // -------- STEP 1: build Origin/Referer allow-list (fail closed on malformed env vars) --------
  // CMA F14 v2.1: NEXT_PUBLIC_SANITY_STUDIO_URL is optional in dev only. When unset,
  // Studio-origin requests are rejected with 403 (correct fail-closed). See §8.5 for
  // full rationale; mirrored here.
  // CMA F8 v2.1: explicit exclusion of literal "null" string + empty origin (sandboxed
  // iframes send `Origin: null` as a literal string). See §8.5 for full rationale.
  const rawAllowed = [env.NEXT_PUBLIC_SITE_URL, env.NEXT_PUBLIC_SANITY_STUDIO_URL]
    .filter((v): v is string => typeof v === 'string' && v.length > 0)

  const allowedOrigins = rawAllowed.flatMap((allowed) => {
    try {
      const origin = new URL(allowed).origin
      if (origin === 'null' || origin === '') return []
      return [origin]
    } catch { return [] }
  })

  // -------- STEP 2: dual Origin + Referer check --------
  // SECURITY: disable has no preview-url secret. Origin + Referer dual-check is the only barrier.
  // Both must be present and match — not OR. (CMA F-3 v1.3 Option A.)
  //
  // CMA F11 v2.1: the AND-logic dual-check correctly rejects cross-origin requests, but ALSO
  // rejects legitimate same-origin fetch calls from browsers that strip the Referer header
  // (Referrer-Policy: no-referrer, privacy extensions, sandboxed iframes). Affected users
  // cannot exit draft mode via the UI — fallback is manual cookie deletion (devtools →
  // Application → Cookies → delete `__prerender_bypass` + `__next_preview_data`) or natural
  // cookie expiry. The TEMPLATE-* disable UI must set `Referrer-Policy: strict-origin-when-cross-origin`
  // (or stricter same-origin policy) on the disable-button page to avoid this. Tracked as
  // Tech Debt for TEMPLATE-* (see §6 trigger list + Tech Debt #18 entry queued for CLAUDE.md
  // at HALT 3). The trade-off is documented in CONVENTIONS Entry 3.
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const refererOrigin = referer ? safeUrlOrigin(referer) : null

  // CMA F13 v2.1: normalise to explicit booleans for readability + maintenance safety.
  // v2.0 used `string | boolean | null`-ish truthy/falsy expressions, which are correct
  // by falsy-coercion but obscure the intended semantics ("Origin is a string AND in the
  // allow-list"). Explicit booleans remove the cognitive load on future refactorers.
  const originAllowed = typeof origin === 'string' && allowedOrigins.includes(origin)
  const refererAllowed = typeof refererOrigin === 'string' && allowedOrigins.includes(refererOrigin)

  if (allowedOrigins.length === 0 || !originAllowed || !refererAllowed) {
    return new Response('Origin or Referer not allowed', { status: 403 })
  }

  // -------- STEP 3: disable draft mode --------
  ;(await draftMode()).disable()
  return new Response('Draft mode disabled')
}

function safeUrlOrigin(url: string): string | null {
  try { return new URL(url).origin }
  catch { return null }
}
```

#### Threat model note (per CMA F-3 v1.3)

Single-Origin gate insufficient because Origin can be null on some browser/sandbox configs — an attacker can craft a CSRF payload that triggers a disable on the current editor session, ejecting them from preview mid-edit. Threat upgraded from "user logs out of preview" (low-stakes) to "DoS against editorial workflow mid-session" (medium-stakes) per CMA F-3 v1.3 — Option A folds the fix into Brief B rather than deferring to QA-1.

Note: any UI caller of `/api/draft-mode/disable` must issue a `fetch` with both Origin and Referer set. Standard same-origin `fetch` from the site origin will send both automatically. Cross-origin or sandboxed iframe callers may need explicit `credentials: 'same-origin'` + a `Referrer-Policy: strict-origin-when-cross-origin` directive — defer to the UI integration in TEMPLATE-* phases. Out of scope for Brief B.

#### Referer-stripping edge case (CMA F11 v2.1)

**Tech debt note for TEMPLATE-***. The AND-logic dual-check correctly rejects cross-origin requests but also rejects legitimate same-origin fetches from browsers that strip the Referer header. Specific triggers:

- `Referrer-Policy: no-referrer` set on the page issuing the disable fetch.
- Browser privacy extensions (uBlock Origin, Privacy Badger) configured to strip Referer.
- Sandboxed iframes without `allow-same-origin` token.
- Some niche browser configurations (Brave aggressive shields, Firefox enhanced tracking protection in strict mode on certain domains).

A user in this situation cannot exit draft mode via the UI. The fallback path is manual cookie deletion (DevTools → Application → Cookies → delete `__prerender_bypass` + `__next_preview_data`) or natural cookie expiry (Next.js draft-mode cookies are session-only by default — closing the browser tab/window clears them).

**Tech debt entry queued for CLAUDE.md at HALT 3 / DESIGN-1 close (TBD-numbered, likely #18):**

> *Tech Debt: TEMPLATE-* disable-mode UI must set `Referrer-Policy: strict-origin-when-cross-origin` (or stricter same-origin policy) on the page hosting the disable button. Without this header, browsers that strip Referer by default will be unable to exit draft mode via the UI. Fallback path documented in Brief B v2.1 §8.6 + CONVENTIONS Entry 3.*

Brief B does NOT ship the disable UI — that's a TEMPLATE-* deliverable. Brief B only ships the route. The route's correct behavior is to reject the no-Referer call (security trade-off accepted per F-3 Option A v1.3); the UI's correct behavior is to ensure Referer is always sent.

#### REGISTRY.md update

Update `REGISTRY.md` to reflect the GET → POST conversion on the disable route. Locate by `grep -n "draft-mode/disable" REGISTRY.md`.

### HALT 2 — Step 8 infrastructure (8.1–8.6) complete, surface for eyeball

Surface to Jake. Required surface artifacts:

#### Diffs

- `site/src/lib/env.ts` — schema strictness (D14: `z.string().url()` + `z.string().min(1)` on the three vars)
- `site/src/lib/sanity/live.ts` — serverToken addition (D5)
- `site/src/lib/sanity/client.ts` — single-client collapse (D4) + tightened stega gating (F-4 v1.3: AND-with-prod-block + runtime throw guard) + previewClient export removed
- `site/src/app/api/draft-mode/enable/route.ts` — GET with 6-step security-ordered handler (F-1 fail-closed allow-list + F-2 ordering + F-6 try/catch + F-7 named helper + F-12 module-scope)
- `site/src/app/api/draft-mode/disable/route.ts` — GET → POST with dual Origin + Referer check (F-3 Option A)
- `REGISTRY.md` — disable route method change + enable route hardening note
- `CONVENTIONS.md` — "Sanity Client Pattern in the Generated Site" section superseded inline (full §8.8 entries drafted at HALT 3)

#### Artifact files (per D15)

- `audit-output/design-1/preview-client-callers-before.txt` — pre-refactor grep (§8.3.0)
- `audit-output/design-1/preview-client-callers-after.txt` — post-refactor grep (§8.3.N); must be empty
- `audit-output/design-1/validate-preview-url-inline-client-after.txt` — F-7/F-12 module-scope helper verification (exactly one match expected)
- `audit-output/design-1/visual-editing-method-probe.md` — §8.4 DevTools observation
- `audit-output/design-1/next-sanity-probe.md` — §8.0 environment probe output

#### Diff between before/after grep states

```bash
diff -u audit-output/design-1/preview-client-callers-before.txt audit-output/design-1/preview-client-callers-after.txt
```

Expected: the diff shows N lines removed (the before-state) and 0 lines added (the after-state). Surface the line-count delta + path-count delta + confirmation that the after-file is empty.

#### Verification commands (must all pass)

```bash
cd "/Users/jakehall/Documents/CE Ops/Ab3lton/SEO/Code/MASTER PROJECTS_1/Mygratr/site"
npx tsc --noEmit
npm run build
npm run lint  # Expected: 25 problems (the Step 6 noise floor); ZERO new violations
```

If lint surfaces NEW violations (beyond the 25 known pre-existing), halt and triage — Step 8 should not introduce new lint problems.

#### Studio config check

Confirm `studio/sanity.config.ts` was NOT modified unless §8.4 method probe surfaced a coordination need with presentationTool. If unchanged: confirm verbally. If changed: surface the diff + plan the Studio redeploy as a separate operation AFTER HALT 2 commit lands (per D10).

Jake eyeballs. Adjustments if needed (origin allow-list scope, error response format, Studio config). After approval, Step 8 infrastructure commits.

**Commit point:**

```
feat(design-1): brief B step 8 infrastructure — env schema + single-client collapse + defineLive serverToken + draft-mode hardening (GET enable / POST disable per CMA F-1 v1.3) (HALT 2 closed)
```

AFTER the commit lands, if Studio config changed in §8.4 (presentationTool method-coordination edit), redeploy Studio as a separate operation per D10.

### §8.7 — Smoke test + integration tests (a)/(b)/(c)/(d.1–d.4)/(d.5)/(e) — manual round-trip + security-order verification (per D8 + F-2 v1.3 + F6 + F8 v2.1)

Per D8: manual round-trip smoke test is the primary mechanism. Per F-2 v1.3: integration tests verify the security order on the enable route — without these, the order is unverified and could regress under a future edit.

#### Manual round-trip smoke test (per D8)

1. Start Studio: `cd studio && npm run dev` (typically `localhost:3333`)
2. Start site: `cd site && npm run dev` (typically `localhost:3000`)
3. Open Studio's presentation tool, navigate to a known document (e.g., a `blogPost` from CONTENT-1C)
4. Verify the embedded preview loads the corresponding site page
5. Edit a field in the document panel (e.g., change `metaTitle`)
6. Confirm the preview iframe updates within 2 seconds (live preview latency target)
7. Click the pencil icon overlay on a stega-encoded element in the preview
8. Confirm Studio navigates to the correct document/field

Document the result of each step (pass/fail + observed behavior) in `audit-output/design-1/visual-editing-smoke-test.md` (gitignored running notes per D15; consolidated to canonical CAPABILITY_LOG at Brief B close).

#### Integration tests — security-order verification (per F-2 v1.3 + D15)

Beyond "did the smoke test pass," verify the security order in the enable route is correct via curl + `Set-Cookie` header inspection. Four tests total: (a)/(b)/(c) on enable, (d) on disable.

**Setup (one-time before all 8 sub-tests — a/b/c/d.1–d.4/d.5/e):**

```bash
# Site running on localhost:3000 (per smoke-test step 2 above)
# Capture a VALID sanity-preview-secret for tests (b)+(c) by triggering one normal preview-init
# round-trip via Studio's presentation tool and copying the value from DevTools Network tab
# (see §8.4 procedure). Save to local shell var:
VALID_SECRET="<paste the captured secret value>"
SITE_ORIGIN="http://localhost:3000"
STUDIO_ORIGIN="http://localhost:3333"
ATTACKER_ORIGIN="https://attacker.example.com"
```

The valid secret is needed only for tests (b) and (c) — test (a), test (d.*), and test (e) do not need a valid secret.

**CMA F6 v2.1 — curl cookie-jar isolation.** Every curl command in this section MUST include `--cookie /dev/null --cookie-jar /dev/null` flags. Without them, a persistent cookie jar from a prior successful enable round-trip (e.g., a smoke-test step 4 manual session earlier in the same shell session) could produce false negatives on the `Set-Cookie` grep — curl would re-send the old cookie, the route would still issue Set-Cookie (because it correctly enables draft mode for an already-valid request), and the test would erroneously report PASS by missing the regression. The flags isolate each test from the user's cookie state.

##### Integration test (a) — Off-origin request rejected before any cookie set

**What it verifies:** CMA F-2 v1.3 STEP 2 (Origin/Referer check) runs FIRST in the security order. Off-origin requests are rejected with 403 before reaching secret validation or draft-mode enablement.

**Test invocation:**

```bash
curl -i -X GET \
  --cookie /dev/null --cookie-jar /dev/null \
  "http://localhost:3000/api/draft-mode/enable?sanity-preview-secret=irrelevant" \
  -H "Origin: $ATTACKER_ORIGIN" \
  -H "Referer: $ATTACKER_ORIGIN/" \
  2>&1 | tee /tmp/test-a-response.txt
```

**Expected response:**
- HTTP status: `403`
- Response body: `Origin not allowed`
- Set-Cookie header: ABSENT

**Verification:**

```bash
# Status code check
grep "^HTTP/" /tmp/test-a-response.txt
# Expected: "HTTP/1.1 403 ..." (or HTTP/2)

# Set-Cookie absence check
grep -i "^set-cookie:" /tmp/test-a-response.txt && echo "FAIL: cookie set on 403" || echo "PASS: no cookie set"
# Expected: "PASS: no cookie set"
```

**Expected behavior chain:** STEP 1 (build allow-list) → STEP 2 (Origin check) → **REJECT 403**. STEPs 3–6 NEVER reached.

**Failure mode if security order is wrong:** if Set-Cookie present on the 403 response, then `draftMode().enable()` fired before the Origin check — security order is broken. Halt and reorder per §8.5 example.

##### Integration test (b) — Bad secret with allowed origin rejected before any cookie set

**What it verifies:** CMA F-2 v1.3 STEP 3 (secret validation) runs after origin check; secret-validation failure rejects with 401 before draft-mode enablement.

**Test invocation:**

```bash
curl -i -X GET \
  --cookie /dev/null --cookie-jar /dev/null \
  "http://localhost:3000/api/draft-mode/enable?sanity-preview-secret=BOGUS_INVALID_SECRET" \
  -H "Origin: $STUDIO_ORIGIN" \
  -H "Referer: $STUDIO_ORIGIN/" \
  2>&1 | tee /tmp/test-b-response.txt
```

**Expected response:**
- HTTP status: `401`
- Response body: `Invalid secret`
- Set-Cookie header: ABSENT

**Verification:**

```bash
grep "^HTTP/" /tmp/test-b-response.txt
# Expected: "HTTP/1.1 401 ..."

grep -i "^set-cookie:" /tmp/test-b-response.txt && echo "FAIL: cookie set on 401" || echo "PASS: no cookie set"
# Expected: "PASS: no cookie set"
```

**Expected behavior chain:** STEP 1 → STEP 2 (origin pass) → STEP 3 (secret check) → **REJECT 401**. STEPs 4–6 NEVER reached.

**Failure mode if security order is wrong:** if Set-Cookie present on the 401 response, then `draftMode().enable()` fired before secret validation — critical security order break. The most dangerous regression of all because it means anyone reaching the origin allow-list (e.g., a sub-origin attack from Studio iframe) bypasses the secret entirely.

##### Integration test (c) — Off-origin redirectTo with valid secret rejected before any cookie set

**What it verifies:** CMA F-2 v1.3 STEP 4 (redirectTo same-origin check) runs after secret pass; off-origin redirect rejected with 400 before draft-mode enablement.

**Test invocation:**

```bash
curl -i -X GET \
  --cookie /dev/null --cookie-jar /dev/null \
  "http://localhost:3000/api/draft-mode/enable?sanity-preview-secret=$VALID_SECRET&redirectTo=https://attacker.example.com/" \
  -H "Origin: $STUDIO_ORIGIN" \
  -H "Referer: $STUDIO_ORIGIN/" \
  2>&1 | tee /tmp/test-c-response.txt
```

**Expected response:**
- HTTP status: `400`
- Response body: `Invalid redirect target`
- Set-Cookie header: ABSENT

**Verification:**

```bash
grep "^HTTP/" /tmp/test-c-response.txt
# Expected: "HTTP/1.1 400 ..."

grep -i "^set-cookie:" /tmp/test-c-response.txt && echo "FAIL: cookie set on 400" || echo "PASS: no cookie set"
# Expected: "PASS: no cookie set"
```

**Expected behavior chain:** STEP 1 → STEP 2 (origin pass) → STEP 3 (secret pass) → STEP 4 (redirectTo same-origin check) → **REJECT 400**. STEPs 5–6 NEVER reached.

**Failure mode if security order is wrong:** if Set-Cookie present on the 400 response, then `draftMode().enable()` fired before redirect-target validation. This is the open-redirect-into-session-fixation chain that CMA F-2 v1.3 specifically guards against — an attacker with a valid secret could leverage the open redirect into a hostile origin where the draft-mode cookie has already been issued.

##### Integration test (d) — Disable route dual-check verification (per F-3 Option A v1.3)

**What it verifies:** CMA F-3 v1.3 Option A — disable route requires BOTH Origin AND Referer to match (not OR). Single-header attacks (Origin present + Referer missing, or vice versa) rejected with 403.

**Test invocation (d.1) — Origin present + Referer missing:**

```bash
curl -i -X POST \
  --cookie /dev/null --cookie-jar /dev/null \
  "http://localhost:3000/api/draft-mode/disable" \
  -H "Origin: $STUDIO_ORIGIN" \
  2>&1 | tee /tmp/test-d1-response.txt
```

**Expected response (d.1):**
- HTTP status: `403`
- Response body: `Origin or Referer not allowed`

**Test invocation (d.2) — Referer present + Origin missing:**

```bash
curl -i -X POST \
  --cookie /dev/null --cookie-jar /dev/null \
  "http://localhost:3000/api/draft-mode/disable" \
  -H "Referer: $STUDIO_ORIGIN/" \
  2>&1 | tee /tmp/test-d2-response.txt
```

**Expected response (d.2):**
- HTTP status: `403`
- Response body: `Origin or Referer not allowed`

**Test invocation (d.3) — Both Origin AND Referer mismatched:**

```bash
curl -i -X POST \
  --cookie /dev/null --cookie-jar /dev/null \
  "http://localhost:3000/api/draft-mode/disable" \
  -H "Origin: $ATTACKER_ORIGIN" \
  -H "Referer: $ATTACKER_ORIGIN/" \
  2>&1 | tee /tmp/test-d3-response.txt
```

**Expected response (d.3):**
- HTTP status: `403`
- Response body: `Origin or Referer not allowed`

**Test invocation (d.4) — Both Origin AND Referer match (positive case):**

```bash
curl -i -X POST \
  --cookie /dev/null --cookie-jar /dev/null \
  "http://localhost:3000/api/draft-mode/disable" \
  -H "Origin: $STUDIO_ORIGIN" \
  -H "Referer: $STUDIO_ORIGIN/" \
  2>&1 | tee /tmp/test-d4-response.txt
```

**Expected response (d.4):**
- HTTP status: `200`
- Response body: `Draft mode disabled`

**Verification (across d.1–d.4):**

```bash
for f in /tmp/test-d{1,2,3,4}-response.txt; do
  echo "=== $f ==="
  grep "^HTTP/" "$f"
done
# Expected:
# === /tmp/test-d1-response.txt === HTTP/1.1 403 ...
# === /tmp/test-d2-response.txt === HTTP/1.1 403 ...
# === /tmp/test-d3-response.txt === HTTP/1.1 403 ...
# === /tmp/test-d4-response.txt === HTTP/1.1 200 ...
```

**Failure mode if dual-check is wrong:** if test (d.1) returns 200 (Origin alone allows the call), then the dual-check degenerated to OR — F-3 Option A violated. Halt and re-edit §8.6 to enforce AND.

##### Integration test (d.5) — Literal-string `Origin: null` rejected (NEW v2.1 per F8)

**What it verifies:** CMA F8 v2.1 — the route's allow-list construction excludes literal-string `"null"` origin. Sandboxed iframes send `Origin: null` as a literal string; if the allow-list ever contained `"null"` (e.g., from a malformed env var), the request would match and bypass the origin check. This test exercises both the enable route (§8.5) and the disable route (§8.6).

**Test invocation (d.5a) — disable route with literal `Origin: null`:**

```bash
curl -i -X POST \
  --cookie /dev/null --cookie-jar /dev/null \
  "http://localhost:3000/api/draft-mode/disable" \
  -H "Origin: null" \
  -H "Referer: null" \
  2>&1 | tee /tmp/test-d5a-response.txt
```

**Expected response (d.5a):**
- HTTP status: `403`
- Response body: `Origin or Referer not allowed`

**Test invocation (d.5b) — enable route with literal `Origin: null`:**

```bash
curl -i -X GET \
  --cookie /dev/null --cookie-jar /dev/null \
  "http://localhost:3000/api/draft-mode/enable?sanity-preview-secret=irrelevant" \
  -H "Origin: null" \
  -H "Referer: null" \
  2>&1 | tee /tmp/test-d5b-response.txt
```

**Expected response (d.5b):**
- HTTP status: `403`
- Response body: `Origin not allowed`
- Set-Cookie header: ABSENT

**Verification (d.5a + d.5b):**

```bash
for f in /tmp/test-d5a-response.txt /tmp/test-d5b-response.txt; do
  echo "=== $f ==="
  grep "^HTTP/" "$f"
  grep -i "^set-cookie:" "$f" && echo "FAIL: cookie set" || echo "PASS: no cookie set"
done
# Expected for both:
# HTTP/1.1 403 ...
# PASS: no cookie set
```

**Failure mode:** if either test returns 200 or any non-403 status, then the allow-list contains the literal string `"null"` (or a path that resolved to `"null"` origin escaped the F8 guard). Halt and verify both §8.5 and §8.6 contain the explicit `if (origin === 'null' || origin === '') return []` guard inside the `.flatMap()` allow-list construction.

##### Integration test (e) — `validatePreviewUrl` exception path 500 — Set-Cookie absent (NEW v2.1 per F6)

**What it verifies:** CMA F6 v2.1 — the §8.5 enable route's `validatePreviewUrl` catch block returns a 500 response WITHOUT enabling draft mode. The session-fixation risk closed by this test: if a future refactor accidentally moves `draftMode().enable()` ABOVE the try/catch, the 500 path would set the draft-mode cookie before validation could complete — an attacker triggering the exception (e.g., via a malformed `request.url`) could acquire a draft-mode session with no validation. Tests (a)/(b)/(c) cover the 403/401/400 paths; test (e) covers the 500 path.

**Setup — force the exception (inline env override; `.env.local` is NEVER modified):** stop the dev server (Ctrl+C) and restart it with the bad token supplied as an inline env var. The `previewValidationClient` will be constructed against this bad token; when `validatePreviewUrl` runs, the underlying HTTP call to Sanity will fail and throw. The catch block returns 500. **Critical: do NOT edit `site/.env.local`.** That file holds the genuine token, and an edit-then-restore dance has a permanent-overwrite failure mode — recovery would require Sanity dashboard access to mint a replacement token. The inline-env approach below leaves `.env.local` untouched.

```bash
# Stop the current dev server (Ctrl+C) first.
# Then restart with the override supplied inline — .env.local is never edited.
cd "/Users/jakehall/Documents/CE Ops/Ab3lton/SEO/Code/MASTER PROJECTS_1/Mygratr/site"
SANITY_API_READ_TOKEN=invalid_token_for_test_e npm run dev
```

The inline env var takes precedence over the `.env.local` value for the duration of THIS server process only. When you stop the server, the override evaporates — the original token in `.env.local` is unmodified throughout.

**Test invocation:**

```bash
curl -i -X GET \
  --cookie /dev/null --cookie-jar /dev/null \
  "http://localhost:3000/api/draft-mode/enable?sanity-preview-secret=$VALID_SECRET" \
  -H "Origin: $STUDIO_ORIGIN" \
  -H "Referer: $STUDIO_ORIGIN/" \
  2>&1 | tee /tmp/test-e-response.txt
```

**Expected response:**
- HTTP status: `500`
- Response body: `Preview validation failed` (or empty if the framework hijacks the body — the route's intent is to return the explicit string, see §8.5)
- Set-Cookie header: ABSENT (this is the critical assertion)

**Verification:**

```bash
grep "^HTTP/" /tmp/test-e-response.txt
# Expected: "HTTP/1.1 500 ..."

grep -i "^set-cookie:" /tmp/test-e-response.txt && echo "FAIL: cookie set on 500 — session fixation risk" || echo "PASS: no cookie set"
# Expected: "PASS: no cookie set"
```

**Expected behavior chain:** STEP 1 → STEP 2 (origin pass) → STEP 3 (secret validation throws) → catch block → **REJECT 500**. STEPs 4–6 (redirectTo check + draftMode().enable() + redirect) NEVER reached.

**Failure mode (CRITICAL):** if Set-Cookie is present on the 500 response, the catch block was placed AFTER `draftMode().enable()` — meaning an attacker who can trigger the exception path (e.g., via a network-layer fault, Sanity API outage, malformed request that crashes the validator, etc.) acquires a draft-mode session with no validation. Halt and verify the security order on §8.5 — the `try { validation = ... } catch { return 500 }` block MUST sit between STEP 2 (origin check) and STEP 5 (draftMode().enable()).

**Cleanup after test (e):** stop the dev server (Ctrl+C) and restart it without the env override. The original `SANITY_API_READ_TOKEN` from `site/.env.local` resumes effect automatically — no file restoration required.

```bash
# Stop the server (Ctrl+C). Then restart without the override:
cd "/Users/jakehall/Documents/CE Ops/Ab3lton/SEO/Code/MASTER PROJECTS_1/Mygratr/site"
npm run dev
```

Re-run smoke-test step 4 (open Studio Presentation tool → navigate to a blogPost → confirm preview loads) to verify normal operation resumed. If preview does not load, the dev server is still running with the override, or another env-loading issue exists — debug from there, do NOT edit `.env.local`.

#### Common failure modes (updated for v2.0 architecture)

- **Preview doesn't load (smoke step 4 fails):** check `NEXT_PUBLIC_SANITY_STUDIO_URL` is set on Vercel preview env (per §8.0b) AND production env (per §8.0c). If localhost-only set, the production allow-list rejects Studio's iframe.
- **Live updates don't propagate (smoke step 6 fails):** check `defineLive` setup; verify `<SanityLive />` component is rendered (typically via `<VisualEditing />` parent in `layout.tsx`).
- **Pencil icons don't appear (smoke step 7 fails):** stega config issue. Check `client.ts` `stegaEnabled` evaluates to `true` in the dev environment — that requires either `SANITY_STEGA_ENABLED=1` in `site/.env.local` (will work because dev has `VERCEL_ENV` unset, so the F-4 v1.3 prod-block doesn't trigger) OR the preview-fallback condition needs `VERCEL_ENV=preview` simulated. CMA F-4 v1.3 changed the gating: `SANITY_STEGA_ENABLED=1` alone is no longer sufficient on production.
- **Pencil click goes to wrong document (smoke step 8 fails):** `studioUrl` mismatch in stega config — `client.ts` reads `env.NEXT_PUBLIC_SANITY_STUDIO_URL`; verify that resolves to the correct Studio URL for the current environment.
- **Disable button does nothing in UI (manual test outside integration test (d)):** check Origin AND Referer both set on the fetch. Disable is dual-checked per F-3 Option A v1.3; either missing returns 403.
- **Integration test (a) / (b) / (c) Set-Cookie present:** security ordering broken. Halt and reorder per §8.5 example.
- **Integration test (d.1) or (d.2) returns 200:** dual-check degenerated to OR. Halt and re-edit §8.6 to enforce AND.
- **Integration test (d.5a) or (d.5b) returns non-403:** allow-list contains literal `"null"` string. Halt and verify §8.5/§8.6 F8 v2.1 guard (`if (origin === 'null' || origin === '') return []`).
- **Integration test (e) Set-Cookie present on 500:** `draftMode().enable()` is firing BEFORE the validatePreviewUrl try/catch — session fixation risk. Halt and reorder per §8.5 example.

#### Artifact

Consolidate the manual round-trip results + the 4 integration test outputs into `audit-output/design-1/visual-editing-smoke-test.md` (gitignored). Structure:

```markdown
# Visual Editing smoke test results (Brief B Step 8.7)

## Manual round-trip (steps 1-8 per D8)
- Step 1 — Studio start: <PASS / FAIL + observed behavior>
- Step 2 — Site start: <PASS / FAIL + observed behavior>
- ... [steps 3-8]

## Integration tests (per CMA F-2 v1.3 + F-3 Option A v1.3 + v2.1 F6 + F8 additions)
- Test (a) off-origin: <PASS / FAIL + curl response summary + Set-Cookie verification>
- Test (b) bad secret: <PASS / FAIL + ...>
- Test (c) off-origin redirectTo: <PASS / FAIL + ...>
- Test (d.1) Origin only: <PASS / FAIL + ...>
- Test (d.2) Referer only: <PASS / FAIL + ...>
- Test (d.3) both mismatched: <PASS / FAIL + ...>
- Test (d.4) both matched (positive): <PASS / FAIL + ...>
- Test (d.5a) disable route literal `Origin: null` (F8 v2.1): <PASS / FAIL + ...>
- Test (d.5b) enable route literal `Origin: null` (F8 v2.1): <PASS / FAIL + ...>
- Test (e) validatePreviewUrl exception 500 — Set-Cookie absent (F6 v2.1): <PASS / FAIL + ...>

## Overall verdict
<PASS / FAIL / FIXES_REQUIRED>
```

Surface in HALT 3 review.

### §8.8 — CONVENTIONS.md additions (1 supersession + 4 new patterns)

§8.3.5 already replaced the "Sanity Client Pattern in the Generated Site" section content inline. §8.8 covers the FULL CONVENTIONS.md edit set surfaced at HALT 3 review. Locate insertion points by `grep -n "<heading>" CONVENTIONS.md` — do NOT rely on v1.3 line offsets (Step 6's 212-line UI_STRINGS section may have shifted them).

#### Entry 1 (supersession) — Sanity Single-Client Pattern

Replace the existing "Sanity Client Pattern in the Generated Site" section content with:

> **Sanity Single-Client Pattern (DESIGN-1 supersedes SCAFFOLD-1's two-client setup).** `site/src/lib/sanity/client.ts` exports a single `sanityClient` (perspective `published`, stega gating per CMA F-4 v1.3 — `(SANITY_STEGA_ENABLED === '1' && VERCEL_ENV !== 'production') || (VERCEL_ENV === 'preview' && NODE_ENV !== 'production')`, with a runtime throw if stega-and-prod ever co-occur). Server-side draft fetches use `defineLive`'s `serverToken` (the existing viewer-scoped `SANITY_API_READ_TOKEN`, env-validated as `z.string().min(1)`). Where a draft-perspective client is required at a specific call site (e.g., `validatePreviewUrl` in the draft-mode enable route), construct it as a NAMED module-scope helper (e.g., `previewValidationClient`) per CMA F-7 v1.3 — equivalence vs SCAFFOLD-1's `previewClient` is reviewable; module-scope avoids per-request instantiation per CMA F-12. Do NOT export a module-level `previewClient`. Server-only import at file top. CMA-C2 + F7 of v2.0 brief Step 8 lock this pattern; CMA F-4 + F-7 + F-12 v1.3 refine it.

The section header carries an inline supersession marker: `Sanity Client Pattern in the Generated Site (DESIGN-1 supersedes SCAFFOLD-1's two-client baseline)`.

#### Entry 2 (new) — Sanity Fetch Pattern with Live Preview (Step 8)

Append below Entry 1:

> **Sanity Fetch Pattern with Live Preview (Step 8).** `site/src/lib/sanity/live.ts` calls `defineLive({ client: sanityClient, serverToken: env.SANITY_API_READ_TOKEN })` to enable server-side draft fetches without client token exposure. Server components use `sanityFetch` for data fetching. `<SanityLive />` rendered globally (via `<VisualEditing />` conditional wrapping in `layout.tsx`) provides client-side update propagation when in draft mode.

#### Entry 3 (new) — Draft-Mode Route Hardening (Step 8, v1.3 reframe per CMA F-1)

Append below Entry 2:

> **Draft-Mode Route Hardening (Step 8, v1.3 reframe per CMA F-1; v2.1 F7 + F8 + F11 + F13 + F14 amendments).** `/api/draft-mode/enable` is **GET** with hardened Referer/Origin allow-list + preview-url secret + same-origin `redirectTo` check. GET (not POST) is required because Sanity's `presentationTool` initiates preview by top-level iframe navigation — POST cannot drive iframe load. The auth barrier is the preview-url secret, not the HTTP method. Allow-list construction wraps `new URL()` in try/catch and fails closed (403) on any malformed env var per CMA F-1; the construction also explicitly excludes the literal-string `"null"` origin and empty-string origin per CMA F8 v2.1 (sandboxed iframes send `Origin: null` as a literal string — any allow-list path that resolves to `"null"` would match and bypass the origin check). Origin may be absent on top-level nav; Referer is the fallback per CMA prior-round F-2. `NEXT_PUBLIC_SANITY_STUDIO_URL` is optional in dev (per D14 + F5 v2.1 refinement) — if unset, Studio-origin requests are correctly rejected with 403; this is fail-closed by design, NOT a regression (per F14 v2.1 inline comment). **`/api/draft-mode/disable` is POST** with **dual** Origin AND Referer allow-list check (both must match) per CMA F-3 Option A v1.3 — disable has no preview-url secret in Sanity convention; the dual-check IS the CSRF barrier. Both checks are normalised to explicit booleans per CMA F13 v2.1 (`typeof origin === 'string' && allowedOrigins.includes(origin)`). Disable is triggered by button-click fetch, not iframe nav, so POST is correct. The AND-logic dual-check correctly rejects cross-origin requests, but per CMA F11 v2.1 may also reject legitimate same-origin `fetch` calls from browsers that strip the Referer header (Referrer-Policy: no-referrer, privacy extensions, iframe sandboxing) — affected users fall back to manual cookie deletion or natural expiry. TEMPLATE-* disable UI must set a `Referrer-Policy` of at least `strict-origin-when-cross-origin` to avoid this. **Security order on enable** (per CMA F-2 v1.3): origin/referer → secret → redirectTo same-origin → `draftMode().enable()` → redirect. NEVER reorder — `draftMode().enable()` must be the LAST operation before redirect, or an attacker with a valid secret can leverage an open-redirect into a session-fixation. Errors from `validatePreviewUrl` are caught and not propagated (CMA F-6 — error objects may carry `Authorization: Bearer <token>` traces). **CMA F7 v2.1: do NOT forward the caught `err` to any external error-reporting service** (Sentry, Datadog, Honeycomb, NewRelic, etc.). `captureException(err)` would leak `Authorization: Bearer <token>` values from validatePreviewUrl's internal HTTP-call traces to third-party logging infrastructure. The catch block uses an explicit named binding `catch (err)` specifically so this prohibition can reference it — NOT so the error can be logged. Safe loggable indicator: a fixed-string `console.error('[draft-mode/enable] validatePreviewUrl threw — check token config')` with no err reference.

#### Entry 4 (new) — Env Schema Strictness for Production Paths (Step 8, v1.3 D14)

Append below Entry 3:

> **Env Schema Strictness for Production Paths (Step 8, v1.3 D14).** Env vars consumed by route allow-lists or token-validating clients use strict Zod validators: `NEXT_PUBLIC_SITE_URL: z.string().url()`, `NEXT_PUBLIC_SANITY_STUDIO_URL: z.string().url().optional()`, `SANITY_API_READ_TOKEN: z.string().min(1)`. Fail-at-startup on misconfiguration is the safer default vs runtime crashes (`new URL(undefined)` throws `TypeError`; empty token throws unclear `validatePreviewUrl` 401). Pattern applies broadly: any env var consumed in route handlers, middleware, or production code paths gets a strict validator. CMA F-1 + F-6 v1.3 lock this.

#### Entry 5 (new) — Visual Editing Method Probe Discipline (Step 8, v1.3 §8.4)

Append below Entry 4:

> **Visual Editing Method Probe Discipline (Step 8, v1.3 §8.4).** Before converting any route's HTTP method, verify Sanity's actual usage via browser DevTools Network tab during a live Studio session. Inspecting exported keys (`Object.keys(p)`) does NOT reveal HTTP method. CMA F-1 + F-5 v1.3: this is the discipline that catches sequencing bugs where a brief assumes one method and Sanity uses another. Document observed method, transport (top-level navigation vs fetch), and query-string contents in the per-phase audit-output folder before route conversion lands.

### §Brief B close — capability log consolidation (pull from running draft at HALT 3)

At HALT 3, consolidate the running draft at `audit-output/design-1/capability-log-draft.md` (gitignored) into `docs/CAPABILITY_LOG.md`. **Final consolidation structure decided at HALT 3 execution time** based on what's accumulated through Step 8. Do NOT pre-architect the consolidation list in this brief.

#### Step 6 close baseline (already in the running draft as of `5726e38` + `de773ad`)

As of Brief B HALT 1 close, the running draft contains 9 items:

**4 Brief-vs-Reality findings:**
- BvR #23 — §6.1.1 `tsc` CLI shape (target-file argument vs glob)
- BvR #24 — D3 exemption glob mismatch with Brief A Pair-rule (Storybook stories per-folder layout)
- BvR #25 — `storybook-static/**` missing from `globalIgnores`
- BvR #26 — ESLint 9 `RuleTester` silent no-op on plugin-namespaced rules (forced switch to `Linter.verify` direct construction)

**3 productisation IP patterns staged for HALT 3:**
- Placeholder-as-split-template — runtime interpolation into chrome strings without dynamic templating in the canonical SoT map
- Two-gate ESLint rule verification — fixture-verify the upstream-rule AST-coverage gap BEFORE writing a custom rule
- Narrow custom-rule supplement — target the smallest AST shape that closes the upstream gap, not the broadest plausible scope

**2 pre-existing tech debt rollup candidates flagged:**
- `hubspot-form-embed/index.tsx` `react-hooks/set-state-in-effect` (2 violations; SCAFFOLD-1 HubSpot mount pattern)
- `demo/_demo-client.tsx` `react/no-unescaped-entities` (5 violations; DESIGN-1 Step 2 demo route; production-guarded)

Step 8 execution adds further entries throughout — new BvR findings as they arise, new productisation IP patterns surfaced by §8.3–§8.7 (specific patterns surfaced by execution will be logged to the running draft as they occur; the count and shape are not pre-locked).

HALT 3 consolidates whatever's in the running draft at that point. The brief does NOT pre-lock the count or structure — that's decided at consolidation time based on actual accumulated findings.

### HALT 3 — Brief B close, surface for eyeball

Surface to Jake. Required surface artifacts:

#### Smoke test + integration test results

- `audit-output/design-1/visual-editing-smoke-test.md` — full output from §8.7
  - Manual round-trip steps 1–8 (PASS/FAIL each)
  - Integration tests (a) / (b) / (c) on enable route (PASS/FAIL each + Set-Cookie verification)
  - Integration tests (d.1) / (d.2) / (d.3) / (d.4) on disable route (PASS/FAIL each)
  - Overall verdict

If any test FAILED, do NOT proceed to HALT 3 commit. Surface the failure mode + the proposed fix; iterate until all tests pass.

#### CONVENTIONS.md diff

- "Sanity Client Pattern in the Generated Site" — supersession (Entry 1 of §8.8)
- 4 new entries appended (Entries 2–5 of §8.8)

#### Capability log consolidation diff

- `docs/CAPABILITY_LOG.md` updated with whatever entries accumulated in the running draft (count + structure determined at this halt, not pre-locked).
- `audit-output/design-1/capability-log-draft.md` may be cleared or archived per consolidation discipline (decision at this halt).

#### Final state checks

```bash
cd "/Users/jakehall/Documents/CE Ops/Ab3lton/SEO/Code/MASTER PROJECTS_1/Mygratr/site"
npx tsc --noEmit  # Expected: clean
npm run build     # Expected: clean
npm run lint      # Expected: 25 problems (Step 6 noise floor); ZERO new
npm run build-storybook  # Expected: clean (unchanged from Brief A)
```

Jake eyeballs. After approval, Brief B close commit lands.

**Commit point:**

```
chore(design-1): brief B close — Visual Editing smoke test + CONVENTIONS + capability log consolidation (HALT 3 closed)
```

---

## 5. Files created / modified

### Files NOT created at Step 8 (Step 6 deliverables, already shipped at `5726e38` + `de773ad`)

These files exist as input state; Step 8 does NOT touch them:

```
tools/eslint/ui-strings.json                                 (Step 6: 14 keys + _meta)
tools/eslint/rules/no-conditional-strings-in-jsx.js          (Step 6: custom rule)
tools/eslint/plugin-local.js                                 (Step 6: plugin wrapper)
tools/eslint/__tests__/ui-strings.test.mjs                   (Step 6: 8-fixture harness)
scripts/design/generate-ui-strings.mjs                       (Step 6: byte-idempotent generator)
scripts/design/probe-ui-strings-reality.mjs                  (Step 6: schema-vs-reality probe — archived per SA-6 at Brief B close)
site/src/lib/ui-strings.ts                                   (Step 6: generated, do-not-edit)
```

### Files MODIFIED at Step 8

```
site/src/lib/env.ts                                          (§8.1: D14 z.string().url() + z.string().min(1) on 3 vars)
site/src/lib/sanity/live.ts                                  (§8.2: defineLive serverToken — D5)
site/src/lib/sanity/client.ts                                (§8.3: TWO-CLIENT → SINGLE-CLIENT collapse per D4 + tightened stega per F-4 v1.3 + runtime throw guard + previewClient export removed)
site/src/app/api/draft-mode/enable/route.ts                  (§8.5: GET-with-hardening per CMA F-1 v1.3 — Referer/Origin allow-list with try/catch fail-closed + secret + same-origin redirect + try/catch around validatePreviewUrl per F-6 + named previewValidationClient per F-7 module-scope per F-12 + 6-step security ordering per F-2)
site/src/app/api/draft-mode/disable/route.ts                 (§8.6: GET → POST per CMA F-1 v1.3 + dual Origin+Referer check per F-3 Option A)
studio/sanity.config.ts                                      (§8.4: ONLY if method probe surfaces presentationTool coordination need; not expected to change)
REGISTRY.md                                                  (§8.5 + §8.6: disable route GET → POST; enable route hardening note)
CONVENTIONS.md                                               (§8.8: Sanity Client Pattern supersession + 4 new entries)
docs/CAPABILITY_LOG.md                                       (Brief B close: HALT 3 consolidation from running draft — count/structure decided at execution time)
```

### Artifact files (gitignored under audit-output/; per D15)

```
audit-output/design-1/next-sanity-probe.md                   (§8.0 environment probe)
audit-output/design-1/draft-read-probe.md                    (§8.0a draft-read probe — NEW v2.1 per F3)
audit-output/design-1/preview-secret-read-probe.md           (§8.0a previewSecret read probe — NEW v2.1 per F9)
audit-output/design-1/stega-studio-url-undefined-probe.md    (§8.1.5 createClient stega probe — NEW v2.1 per F4)
audit-output/design-1/preview-client-callers-before.txt      (§8.3.0 pre-refactor symbol grep)
audit-output/design-1/preview-client-callers-after.txt       (§8.3.N post-refactor symbol grep — expected empty)
audit-output/design-1/sanity-client-path-callers-before.txt  (§8.3.0 pre-refactor path grep — NEW v2.1 per F10)
audit-output/design-1/sanity-client-path-callers-after.txt   (§8.3.N post-refactor path grep — NEW v2.1 per F10)
audit-output/design-1/validate-preview-url-inline-client-after.txt  (§8.3.N F-7/F-12 verification — exactly 1 match expected)
audit-output/design-1/visual-editing-method-probe.md         (§8.4 DevTools observation)
audit-output/design-1/visual-editing-smoke-test.md           (§8.7 manual + 8 integration test results — v2.1: a/b/c/d.1–d.4/d.5/e)
audit-output/design-1/capability-log-draft.md                (running draft; existing file appended throughout Step 8 — v2.1 adds F1+F2 "unreachable defensive code is false confidence" lesson at v2.1 lock)
```

### Files NOT touched at Step 8

```
SCHEMA.md                                                    (no DB DDL)
src/lib/pipeline/state-machine.ts                            (no state transition)
site/src/app/layout.tsx                                      (VisualEditing conditional render already correct from SCAFFOLD-1)
docs/V0_PROMPT_TEMPLATE.md                                   (Brief A artefact; not modified)
docs/design/COMPONENTS.md, TIER_1_INVENTORY.md, TOKENS.md    (canonical inventories; not modified)
docs/design/components/{slug}.md                             (×5 Tier-1 specs; not modified)
site/src/components/ui/{primitive}/index.tsx                 (primitives unchanged)
CHANGELOG.md, PHASE_HISTORY.md, FEATURE_MAP.md, CLAUDE.md    (Step 11 final close handles these; Brief B is sub-phase milestone — REGISTRY.md + CONVENTIONS.md + CAPABILITY_LOG.md DO update at Step 8 per the lists above)
```

---

## 6. Halt-and-escalate triggers

Halt and surface to Jake before continuing if any of these occur:

1. **Pre-flight check failure** in §2 — any of **17** checks returning unexpected state (v2.1: count bumped from 16; check #17 added per F14 v2.1 for `NEXT_PUBLIC_SANITY_STUDIO_URL` local presence).
2. **§8.0 next-sanity probe shows changed exports shape** — if `defineLive` no longer exists at `next-sanity/live` or has different argument shape, halt and surface for v2.0 brief CMA-D1 re-audit.
3. **§8.0a token-scope probe returns success on `create()`** — token is over-scoped; halt for rotation before retasking.
4. **§8.0a draft-read probe FAILS with 401/403 (NEW v2.1 per F3)** — viewer-scoped token cannot read drafts; `defineLive` would silently degrade to published-only fetches and break preview updates. Halt and surface for token-rotation to editor-scoped or explicit-grant token BEFORE §8.2 retasks the token as `serverToken`.
5. **§8.0a previewSecret-read probe FAILS with 401/403 (NEW v2.1 per F9)** — token cannot read `sanity.previewSecret` system documents; `validatePreviewUrl` will silently return `isValid: false` for all requests. Halt and surface for token-rotation BEFORE §8.3.3 assigns the token to `previewValidationClient`.
6. **§8.0b finds `NEXT_PUBLIC_SANITY_STUDIO_URL` set to `localhost:3333` (or unset) on Vercel preview env AND Vercel access is gated to Jake-only** — surface to Jake before §8.7. Smoke test will fail at preview-iframe load otherwise.
7. **§8.0c finds production env `NEXT_PUBLIC_SANITY_STUDIO_URL` missing or wrong** (per prior-round F-10 v1.3 + F5 v2.1 schema refinement) — env validation will fail at startup on production deploys due to the F5 v2.1 Zod refinement (v2.0 prose claimed this incorrectly; v2.1 makes it actually true). Surface and require fix before HALT 2 commits.
8. **§8.1 env load fails locally** — at least one production-required env var is missing or malformed. Halt and surface — fix `.env.local` before proceeding.
9. **§8.1.5 createClient stega probe surfaces an unanticipated outcome (NEW v2.1 per F4)** — neither clean throw nor clean silent-accept (e.g., warns then accepts, or accepts then crashes at first stega fetch). Halt and surface before §8.3.2 lands — the design assumes one of the two clean outcomes; an in-between behavior invalidates §8.3.2's `stega` config shape.
10. **§8.3.0 grep returns empty BEFORE the refactor** — SCAFFOLD-1 baseline assumption wrong; surface for re-derivation of refactor scope.
11. **§8.3.0 or §8.3.4 grep surfaces unanticipated `previewClient` callers** (anything outside `site/src/lib/sanity/client.ts` + `site/src/app/api/draft-mode/enable/route.ts`) — halt for migration-path review before silent rewrite. Hard Rule #4.
12. **§8.3.N post-refactor grep is NOT empty** — refactor incomplete. Halt, identify missed reference, refactor it, re-save artifact. Do not proceed to HALT 2 commit.
13. **§8.3.N validate-preview-url inline-client grep shows multiple matches** — F-12 module-scope discipline violated; helper instantiated inside handler. Halt and refactor.
14. **§8.3.N secondary path-grep surfaces dynamic-import / barrel-re-export `previewClient` references (NEW v2.1 per F10)** — refactor incomplete via dynamic-import / barrel pathway. Halt and refactor.
15. **§8.4 method probe shows Sanity's actual HTTP method differs from D6's reframe** (e.g., enable is observed as POST or fetch-based, not iframe-GET) — halt for D6 reframe in real-time and §8.5/§8.6 example rewrite. CMA F-1 v1.3.
16. **§8.7 integration test (a) / (b) / (c) reveals security-order bug** (`draftMode().enable()` firing before any of the 4 earlier validation steps; visible as Set-Cookie present on 4XX response) — halt and reorder per §8.5 example. CMA F-2 v1.3.
17. **§8.7 integration test (d.1) or (d.2) returns 200** — disable route dual-check degenerated to OR. Halt and re-edit §8.6 to enforce AND. F-3 Option A v1.3.
18. **§8.7 integration test (d.5a) or (d.5b) returns non-403 (NEW v2.1 per F8)** — allow-list contains literal `"null"` string. Halt and verify F8 v2.1 guard (`if (origin === 'null' || origin === '') return []`) is present in BOTH §8.5 and §8.6.
19. **§8.7 integration test (e) Set-Cookie present on 500 (NEW v2.1 per F6)** — `draftMode().enable()` is firing BEFORE the validatePreviewUrl try/catch; session-fixation risk. Halt and reorder.
20. **§8.7 manual round-trip fails at any step** — capture the specific failure mode and surface; common failures listed inline in §8.7. Do NOT improvise fixes; surface so Jake can choose whether to fix-forward or halt.
21. **Two failed attempts at any sub-step** — write `DEBUG_CONTEXT.md` per CLAUDE.md debugging rules.

---

## 7. Operating discipline

- **Probe-first.** §8.0 environment probe, §8.0a token scope re-confirmation + draft-read probe (F3 v2.1) + previewSecret-read probe (F9 v2.1), §8.0b Studio URL env-var on preview, §8.0c Studio URL on production, §8.1.5 createClient stega-with-undefined-studioUrl probe (F4 v2.1), §8.3.0 pre-refactor symbol grep + path grep (F10 v2.1), §8.4 presentationTool method probe (DevTools network inspection — runs BEFORE §8.5/§8.6 per CMA F-1 v1.3) — all mandatory before their respective work begins. Brief A's lesson — assume nothing about external package shapes or upstream data. v2.1 adds 4 NEW mandatory probes vs v2.0 (F3 / F4 / F9 / F10).
- **No fabrication.** If schema doesn't have it AND probe doesn't show it AND Jake didn't confirm it — say "unknown" and ask.
- **Halt cadence is non-negotiable.** HALT 2 (Step 8 infrastructure), HALT 3 (Brief B close after smoke test + CONVENTIONS + capability-log consolidation). Do not skip halts.
- **No commit until Jake approves diff.** Always surface diff for review.
- **Single-client collapse is canonical** per D4. v1.0's two-client preservation framing was a brief-authoring error corrected in v1.1. If mid-execution the collapse seems harder than expected, that's a sign the migration paths in §8.3 need more probing — NOT a sign the canonical plan should bend.
- **Method probe before route conversion** per CMA F-1 v1.3. Never convert HTTP methods on routes that interact with an upstream framework's iframe / fetch / preview machinery without first verifying the framework's actual usage via DevTools Network tab. Inspecting exported keys does NOT reveal HTTP method.
- **Security ordering is non-negotiable** per CMA F-2 v1.3. On the enable route: origin/referer → secret → redirectTo same-origin → `draftMode().enable()` → redirect. NEVER reorder. Verified by §8.7 integration tests (a)/(b)/(c) — Set-Cookie absent on every failure path is the canonical proof.
- **Artifact-level evidence over verbal confirmation** per D15. Refactors and security-sensitive changes ship paired pre-state / post-state artifact files saved under `audit-output/design-1/`. HALT surfaces include the artifact paths + diffs, not verbal "I ran the grep and it was empty." Mirrors Step 6's BvR #26 lesson — lowest-level mechanism with unambiguous signal, preserved across session boundaries.
- **Brief-vs-reality findings** — if any Sanity / Next.js / Vercel constraint conflicts with this brief's literal instruction, structural rule wins. Surface the conflict.
- **Non-interactive CLI flags everywhere** per D9.
- **Commit before deploy** per D10. Studio redeploy (if needed at §8.4) is post-HALT-2-commit.
- **Brief A's 5 lessons + Brief B Step 6's 3 patterns are inherited discipline.** Pattern 1 (CLI flags), Pattern 2 (self-explaining placeholders — D2 `_meta` block), Pattern 4 (schema-vs-reality), Pattern 6 (build-vs-runtime), Pattern 12 (CI/CD-aware commit ordering — D10). Plus Brief B Step 6: placeholder-as-split-template, two-gate ESLint verification, narrow custom-rule supplement. Plus BvR #26's transferable lesson — use the lowest-level test mechanism that gives unambiguous pass/fail signal (informs §8.7 Set-Cookie inspection over UX-level smoke-only). If a sub-step seems easier by skipping one of these, surface — don't skip.

---

## 8. Exit criteria

Brief B Step 8 is Done when **all** of these hold (v2.0 renumbered #1–#14; v1.3 #1–#7 dropped as Step-6-specific and already met):

1. `site/src/lib/env.ts` has `NEXT_PUBLIC_SITE_URL: z.string().url()`, `NEXT_PUBLIC_SANITY_STUDIO_URL: z.string().url().optional()` with the F5 v2.1 `.refine()` enforcing presence in non-development environments, `SANITY_API_READ_TOKEN: z.string().min(1)` per D14.
2. `site/src/lib/sanity/client.ts` is single-client (no `previewClient` export); stega gated per F-4 v1.3 + F1 + F2 v2.1 (Branch A: `SANITY_STEGA_ENABLED === '1' && VERCEL_ENV !== 'production'`; Branch B: `VERCEL_ENV === 'preview'` — F2 v2.1 drops the always-false `NODE_ENV !== 'production'` clause); independent raw-env safety check (F1 v2.1) replaces the v2.0 unreachable throw with `console.error` + force `stegaEnabled = false`; `stegaEnabled` declared as `let` to permit override; preserved `apiVersion` from existing client.ts (no hardcode).
3. `site/src/lib/sanity/live.ts` calls `defineLive({ client: sanityClient, serverToken: env.SANITY_API_READ_TOKEN })`.
4. `site/src/app/api/draft-mode/enable/route.ts` is **GET** with hardened Referer/Origin allow-list + secret + same-origin redirect; allow-list construction wraps `new URL()` in try/catch and fails closed (403) on malformed env vars per F-1; `validatePreviewUrl` wrapped in try/catch per F-6; `previewValidationClient` is a named module-scope helper per F-7 + F-12; security order verified via integration tests per F-2.
5. `site/src/app/api/draft-mode/disable/route.ts` is **POST** with **dual** Origin AND Referer allow-list check per F-3 Option A v1.3.
6. §8.3.N post-refactor grep artifact `audit-output/design-1/preview-client-callers-after.txt` is empty (zero matches).
7. §8.3.N validate-preview-url inline-client grep artifact `audit-output/design-1/validate-preview-url-inline-client-after.txt` has exactly ONE match (the module-scope `previewValidationClient` declaration).
8. §8.4 method probe output documented in `audit-output/design-1/visual-editing-method-probe.md`; confirms Sanity's actual HTTP method aligns with D6 reframe (GET enable / fetch-POST disable).
9. §8.7 smoke test passes manual round-trip per D8 (8 steps) + integration tests (a) / (b) / (c) per F-2 v1.3 (security order verified — Set-Cookie absent on every failure path) + integration tests (d.1) / (d.2) / (d.3) / (d.4) per F-3 Option A v1.3 (disable dual-check verified) + integration tests (d.5a) / (d.5b) per F8 v2.1 (literal `"null"` origin rejected on both routes) + integration test (e) per F6 v2.1 (500-path Set-Cookie absent). All 10 sub-results documented in `audit-output/design-1/visual-editing-smoke-test.md`.
10. `CONVENTIONS.md` Sanity Client Pattern section superseded with single-client pattern + 4 new entries (Sanity Fetch + Draft-Mode Route Hardening + Env Schema Strictness + Visual Editing Method Probe Discipline) — 1 supersession + 4 new = 5 entries total per §8.8.
11. `REGISTRY.md` updated for disable route GET → POST conversion + enable route hardening note per F-2 + F-5.
12. `docs/CAPABILITY_LOG.md` has Brief B productisation IP entries consolidated from the running draft at `audit-output/design-1/capability-log-draft.md` (count + structure decided at HALT 3 execution time based on accumulated findings; Step 6 close baseline of 9 items + Step 8 execution additions).
13. Two commits landed on `feat/design-1` with Jake's explicit approval: HALT 2 close (Step 8 infrastructure §8.1–§8.6) and HALT 3 close (Brief B close + smoke test + integration tests + CONVENTIONS + capability log).
14. Studio redeployed (if §8.4 changed studio config) AFTER HALT 2 commit landed, never before. `npm run build`, `npx tsc --noEmit`, `npm run lint` (Step 6 noise floor only), `npm run build-storybook` in `site/` all pass. `migrations.status === 'content_complete'` (unchanged).

---

## 9. Next phase entry conditions

Brief C (Steps 7 + 9 + 10 + 11 — per-template REFERENCE.md docs + capability log final + verifier + DESIGN-1 close) entry requires:

- Brief B closed per §8 above (all 14 exit criteria met)
- UI_STRINGS rule operational from Step 6 (Brief C's per-template REFERENCE.md docs reference `UI_STRINGS.{key}` patterns per D13 naming convention)
- Visual Editing operational with single-client + GET-enable + POST-disable architecture (Brief C verifier asserts the round-trip from §8.7 + integration tests (a)/(b)/(c)/(d) still pass)
- Env schema strictness in place per D14 (Brief C verifier asserts schema didn't loosen)
- All structural patterns established by end of Brief B (Brief C is documentation + verification work, not new infrastructure)

Brief C is drafted in the same planning conversation pattern that produced Briefs A and B — three briefs drafted together while context is live.

---

*End of MYGRATR-DESIGN-1-BRIEF-B_v2.0.md*

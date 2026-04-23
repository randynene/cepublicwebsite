# SCHEMA DECISIONS AUDIT REPORT — V2

Auditor: Claude Code, run 2026-04-23 against `docs/MYGRATR_SCHEMA_DESIGN_DECISIONS.md` v1.1 (LOCKED 2026-04-23, commit `07ba8cf`).
Method: re-audit scoped to the 16 findings in v1.0 audit report (`docs/SCHEMA_DECISIONS_AUDIT_REPORT.md`). For each, confirm whether v1.1 applies the correction and whether the correction is factually right against `audit-output/ce-inventory.json` / `ce-canonical-urls.json`.

## Summary

- v1.0 findings re-checked: 16 (5 HIGH, 6 MEDIUM, 5 missing coverage)
- v1.1 explicitly claims fixes for: **B1, B2, B3, B4, B5, D1, D2, D3, D4** (9 items)
- **HIGH fixes correctly applied: 4 of 5** (B1 ✓, B2 ✓, B4 ✓, B5 ✓)
- **HIGH fix partially applied: 1 of 5** (B3 — prose corrected to 34, but line 148 still reads "replaces 40 flat fields")
- **Coverage fixes correctly applied: 4 of 4 claimed** (D1 ✓, D2 ✓, D3 ✓, D4 ✓)
- **MEDIUM issues resolved as side-effects:** C1 (via §7.13), C2 (via D3 / §3.13)
- **MEDIUM issues unresolved (not claimed as fixed):** C3, C4, C5, C6
- **New issues introduced by v1.1:** 1 (the B3 inconsistency at line 148)
- **Overall verdict: READY FOR SCHEMA-1** with one trivial text cleanup (line 148) recommended. All HIGH-severity structural corrections are in place and factually correct. The unresolved MEDIUM items are low-risk design notes, not blockers.

---

## A. HIGH-severity findings from v1.0 — verification

### B1. "17 Sanity document types" count → **FIXED ✓**

- **v1.0 text** (line 43): `"33 Webflow collections map to 17 Sanity document types."`
- **v1.1 text** (line 46): `"33 Webflow collections consolidate into 21 Sanity document types (16 core CMS types + 2 supporting embedded types + 3 AI-search placeholders), plus ~30 singletons defined in Section 4."`
- **Verification of the new count:**
  - 16 core CMS types in §3.1–3.16: blogPost, tag, blogCategory, technology, service, customerStory, teamMember, review, video, compareBlog, download, downloadAccess, tool, bookACall, event, glassdoorReview ✓
  - 2 supporting embedded types in §3.17: benefitValue, staffBenefit ✓
  - 3 AI-search placeholders in §3.20: industry, persona, location ✓
  - Sum = 21 ✓
- **Status:** Correctly fixed. Count now matches enumeration.

### B2. "5 taxonomy collections" → **FIXED ✓**

- **v1.0 text** (line 92): `"All 5 taxonomy collections consolidate into one tag document type…"`
- **v1.1 text** (line 95): `"All 6 taxonomy collections consolidate into one tag document type…"`
- **Verification against `ce-inventory.json`:** six collections with `-- Tags >>` prefix confirmed (Blogs 8, Downloads 2, Tools & Quizzes 3, Video Library 3, Events & Webinars 2, Alternatives 4 → total items 22 ✓).
- **Status:** Correctly fixed.

### B3. "40 flat fold fields" → **PARTIALLY FIXED ⚠️**

- **v1.0 text** (line 178): `"Migration script reads the 40 flat fold fields…"`
- **v1.1 fix in prose** (line 181): `"Migration script reads the 34 fold-related fields (Technology Pages has 43 total fields; 9 are non-fold: name, slug, list-item-only, technology-name, order, short-description, tech-logo, thumbnail, faq-schema-2)…"` ✓
- **v1.1 RESIDUAL ERROR** (line 148, inside the schema snippet): `"# FOLDS as typed array (replaces 40 flat fields)"` — **still says 40**.
- **Ground truth:** `ce-inventory.json` confirms 43 total fields in Technology Pages. Using the v1.0 audit's classification (9 obviously-non-fold fields), 34 fold-related fields. "40" has no factual basis.
- **Impact:** Low — the prose number drives migration planning, the stale number is in a comment. But v1.1 is internally inconsistent on the same question in the same section.
- **Recommended fix:** change `# FOLDS as typed array (replaces 40 flat fields)` to `# FOLDS as typed array (replaces 34 flat fold-related fields)` at line 148.
- **Status:** Fix applied in prose, not applied in the code-comment snippet. Half-done.

### B4. Videos `url`-typed fields stored as PlainText in Webflow → **FIXED ✓**

- **v1.0 text** (lines 350–351): `"backgroundVideoPreviewLink: url (optional)"` and `"vimeoYoutubeStandardLink: url (optional)"`.
- **v1.1 text** (lines 353–354): both now typed `string (optional)` with the explicit note `"Webflow type is PlainText; preserved as string to avoid migration failures on malformed values. Validate/normalise post-launch."`
- **Verification against `ce-inventory.json`:** confirmed — `background-video-preview-link` and `vimeo-youtube-standard-link` both `"type": "PlainText"`. (`main-video-embed-link` is `VideoLink`, so keeping that as `url` in v1.1 is correct.)
- **Status:** Correctly fixed with the right rationale recorded inline.

### B5. `/uk/archive/old-home` "returning 404" imprecise → **FIXED ✓**

- **v1.0 text** (line 1003): `"/uk/archive/old-home page | Archived page returning 404"`.
- **v1.1 text** (line 1037): `"/uk/archive/old-home page | Soft 404 — URL returns HTTP 200 with "Not Found" template body. LAUNCH must emit a proper HTTP 410 Gone response at this path in `next.config.js` to fix the existing soft-404 bug."`
- **v1.1 also adds** (line 1015, Section 8 cleanup rules): `"/archive/old-home and /uk/archive/old-home → emit HTTP 410 Gone (fixes pre-existing soft-404 bug — both URLs currently return HTTP 200 with 404 template body)"` — and importantly this addresses **both** US and UK variants, resolving the inconsistent-template-map issue the v1.0 audit flagged.
- **Verification against `ce-canonical-urls.json`:** both URLs confirmed `status: 200` ✓.
- **Status:** Correctly fixed. Stronger fix than the v1.0 audit asked for — explicit 410 remediation is now locked in Section 8.

---

## B. MISSING-COVERAGE findings from v1.0 — verification

### D1. `Legal pages` collection not in Section 3 → **FIXED ✓**

- **v1.1 adds new §7.14** (lines 980–989) "Legal pages collection — explicit migration mapping" with per-field mapping:
  - `Legal pages.name` → `privacyPolicyPage.title`
  - `Legal pages.legals-content` (RichText) → `privacyPolicyPage.sections` (as `richTextSection`)
  - `Legal pages.meta-description` → `privacyPolicyPage.metaDescription`
  - `Legal pages.slug` → hardcoded route `/legals/privacy-policy`
- **Verification against `ce-inventory.json`:** Legal pages has exactly these 4 fields (`name: PlainText`, `slug: PlainText`, `legals-content: RichText`, `meta-description: PlainText`) — every one is mapped. ✓
- **Plus a forward-looking note:** "If CE adds more legal pages post-launch… they become additional static singletons or a new `legalPage` CMS document type — deferred to post-launch." Good hedge.
- **Status:** Correctly fixed.

### D2. Webflow primary `name` field mapping rule → **FIXED ✓** (also resolves C1)

- **v1.1 adds new §7.13** (lines 976–978) as a cross-cutting rule: `"the Webflow name field maps to the schema's primary title field unless the schema defines a different primary (e.g. technologyName, nameClient, customerStoryTitle, firstName+lastName, clientName, etc.). Migration script preserves the Webflow name value exactly in whichever Sanity field is designated as the primary title."`
- **Coverage check:** the examples cover the three specific sections C1 flagged (3.4 technology, 3.8 review, 3.9 video) plus customerStory, bookACall, glassdoorReview. Complete.
- **Status:** Correctly fixed. Also dissolves MEDIUM finding C1 as a side-effect.

### D3. Tools & Quizzes `hidden-code` field → **FIXED ✓** (also resolves C2)

- **v1.1 adds field** to `tool` schema (§3.13, line 493):
  `"hiddenCode: array[portableText] (optional) — generic field for custom HTML/scripts required by a tool (e.g. tracking pixels, embed configs). Maps from Webflow hidden-code RichText field. Culture Match's API key value is explicitly excluded from this field during migration."`
- **Type verification against `ce-inventory.json`:** Tools & Quizzes `hidden-code` is `RichText`, `displayName: "Hidden Code"`. Mapping to `array[portableText]` is the correct Sanity equivalent ✓.
- **Security note is a valuable addition:** explicitly excluding the Culture Match API key is exactly the right scope decision.
- **Status:** Correctly fixed. Also dissolves MEDIUM finding C2.

### D4. 653 Webflow redirects not addressed → **FIXED ✓** (with a caveat)

- **v1.1 §8 expansion** (lines 999–1009) explicitly lists all three redirect sources: 11 regex, 30 crawl-discovered, **653 Webflow-configured**. Adds a CONTENT-1 verification strategy with three branches (all-PH collapse to one regex / mixed — preserve non-PH individually / skip — preserve all 653).
- **Caveat:** the v1.1 doc defers the collapse/preserve decision to CONTENT-1, even though today's `docs/investigations-2026-04-23/redirects-verification.md` already established the answer (336 `/live-job-role/*` rows collapse to one regex; 317 heterogeneous non-job-role rows stay individual). The v1.1 text still says "CONTENT-1 brief must include the verification script and produce a webflow-redirects-verification.md report" — but that report now exists. Not wrong, just a little behind today's state.
- **Status:** Coverage gap closed. Minor follow-up: v1.2 could point at the already-completed verification doc instead of re-requesting it.

### D5. Doc type count claim → **FIXED ✓** (subsumed by B1)

- Same issue as B1; fixed via the same change at line 46.

---

## C. MEDIUM-severity findings from v1.0 — status check

v1.1's revision history does **not** claim to fix the C-series findings. Checking each for incidental changes:

| v1.0 ID | Finding | v1.1 status | Notes |
|---|---|---|---|
| C1 | Webflow `name` mapping implicit in §3.4/3.8/3.9 | **Resolved** via §7.13 (D2 fix) | Side-effect of D2 — the cross-cutting rule covers these sections. |
| C2 | Tools & Quizzes `hidden-code` unaddressed | **Resolved** via §3.13 (D3 fix) | Side-effect of D3. |
| C3 | Technology `thumbnail` 0% fill not documented | **Unchanged** | Still `thumbnail: image (optional)` at line 146, no 0%-fill note. Low risk — optional field behaves correctly either way. |
| C4 | `/uk/embedding` UNKNOWN in template-map | **Unchanged** | §4.4 and §10 define `embeddingPage` singleton and the UK mirror rule. UK `/embedding` is resolved implicitly but not called out explicitly. Low risk — routing works. |
| C5 | `totalItems` vs `itemCount` divergence note | **Unchanged** | This was flagged as a heads-up for SCHEMA-1, not a doc bug. Noted here for SCHEMA-1 awareness. |
| C6 | `max 100 chars` tighter than Webflow's 256 | **Unchanged** | Design choice was not revisited. Spot-check recommended in CONTENT-1 when real values flow through validation. |

None of the unresolved C items blocks SCHEMA-1. They are all either design-intent (C6), heads-ups for downstream sessions (C5), or minor documentation tidy-ups (C3, C4).

---

## D. Unverifiable (E-series) — unchanged

All v1.0 E-series items remain unverifiable by nature (GTM contents, token scopes, future-state claims) and were not in scope for this re-audit.

---

## E. New issues introduced by v1.1

### NEW-1. Internal inconsistency on fold field count (§3.4)

- **Location:** `docs/MYGRATR_SCHEMA_DESIGN_DECISIONS.md:148`
- **Problem:** The schema snippet comment reads `# FOLDS as typed array (replaces 40 flat fields)` while the migration-handling prose 33 lines later (line 181) correctly states `34 fold-related fields`.
- **Severity:** LOW — a one-word cleanup.
- **Recommended edit:**
  ```
  # FOLDS as typed array (replaces 34 flat fold-related fields)
  ```
  Optionally also tighten line 179 (`"The existing 43 flat fields…"`) — 43 is the total-field count, not the fold count, so the phrasing is technically ambiguous.
- **This is the only net-new issue introduced by v1.1.**

No other regressions found. All other v1.0 clean checks (Section F of v1.0 report: item counts, form GUIDs, 0%-fill justifications, investigation cross-references, Section 8 redirect counts, Section 6 globals, Section 10 route-source mapping, Tier 2 reference integrity) remain correct in v1.1 — v1.1's edits were strictly additive to §3.13, §7.13, §7.14, §8, §9 and did not touch any clean-check area.

---

## F. Verdict and recommendation

**v1.1 is ready for MYGRATR-SCHEMA-1.**

- All five HIGH-severity v1.0 findings are addressed. Four are clean fixes; B3 is correct in prose but has one stale "40" in a code-comment that should be updated.
- All five missing-coverage items are addressed (four explicit fixes + one subsumed in B1).
- Two MEDIUM items (C1, C2) were dissolved as side-effects of D2/D3.
- Four MEDIUM items (C3, C4, C5, C6) remain open by design — not blockers.
- One new minor issue (NEW-1) was introduced.

**Recommended v1.2 delta:** one-line edit at `docs/MYGRATR_SCHEMA_DESIGN_DECISIONS.md:148` to fix the residual "40". Optional: reference today's completed `redirects-verification.md` in §8 so CONTENT-1 doesn't re-run a job that's already done.

*End of SCHEMA_DECISIONS_AUDIT_REPORT_V2.md*

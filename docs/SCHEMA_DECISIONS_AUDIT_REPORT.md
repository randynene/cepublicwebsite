# SCHEMA DECISIONS AUDIT REPORT

Auditor: Claude Code, run 2026-04-23 against `docs/MYGRATR_SCHEMA_DESIGN_DECISIONS.md` v1.0 (LOCKED 2026-04-23).
Method: exhaustive verification per `docs/Briefs/active/` audit brief. Ground truth = `audit-output/` JSON artefacts + `docs/CE_SITE_TRUTH.md` + `docs/investigations-2026-04-23/REPORT.md`.

## Summary

- Total claims checked: ~180 (item counts across 33 collections; 16 document-type field lists; Section 9 deletions; Section 10 routing table; Section 7.10 form GUIDs; Section 6 globals; Section 8 redirect counts; investigation cross-references)
- Critical errors: **0**
- Warnings / data mismatches (HIGH): **5**
- Ambiguities (MEDIUM): **6**
- Missing coverage items: **5**
- Unverifiable items: **5**
- Overall verdict: **REQUIRES V1.1** — no structural blockers, but five HIGH-severity data corrections and five coverage gaps should be resolved before SCHEMA-1 consumes the doc verbatim.

---

## A. CRITICAL STRUCTURAL ERRORS (stop-and-fix)

None detected. Every source collection in `ce-inventory.json` is either migrated in Section 3, referenced in Section 4 (singleton source), or excluded in Section 9. Every reference target named in a schema is a defined doc type elsewhere in the doc. Every CMS route in Section 10 has a document-type source. No orphan URL classifications that break routing at the doc level.

---

## B. DATA MISMATCHES (must fix before SCHEMA-1) — severity HIGH

### B1. Section 3 opener — "17 Sanity document types" count is wrong

- Location: `docs/MYGRATR_SCHEMA_DESIGN_DECISIONS.md:43`
- Claim (verbatim): `"33 Webflow collections map to 17 Sanity document types. Every consolidation is documented with rationale."`
- Reality: Section 3 actually defines 16 core doc types (3.1 blogPost; 3.2 tag; 3.3 blogCategory; 3.4 technology; 3.5 service; 3.6 customerStory; 3.7 teamMember; 3.8 review; 3.9 video; 3.10 compareBlog; 3.11 download; 3.12 downloadAccess; 3.13 tool; 3.14 bookACall; 3.15 event; 3.16 glassdoorReview), plus 2 supporting types in 3.17 (benefitValue, staffBenefit), plus 3 placeholders in 3.20 (industry, persona, location) = **21** distinct doc types. Even excluding the AI-search placeholders, the count is 18. The "17" figure doesn't align with any natural subset.
- Evidence: decision-doc sections 3.1–3.20 enumerated directly.
- Severity: HIGH

### B2. Section 3.2 opener — "5 taxonomy collections" is wrong; 6 listed

- Location: `docs/MYGRATR_SCHEMA_DESIGN_DECISIONS.md:92`
- Claim (verbatim): `"Decision: All 5 taxonomy collections consolidate into one tag document type with a category field."`
- Reality: Section 3.2 lists **six** source collections immediately underneath: Tags >> Blogs (8), Tags >> Alternatives (4), Tags >> Tools & Quizzes (3), Tags >> Video Library (3), Tags >> Downloads (2), Tags >> Events & Webinars (2). Total 22 items ✓, but the collection count "5" is wrong — should be "6".
- Evidence: `audit-output/ce-inventory.json` confirms six collections with `-- Tags >> ` prefix / `tags-*` slug. The doc itself lists all six.
- Severity: HIGH

### B3. Section 3.4 Migration handling — "40 flat fold fields" is wrong

- Location: `docs/MYGRATR_SCHEMA_DESIGN_DECISIONS.md:178`
- Claim (verbatim): `"Migration script reads the 40 flat fold fields, identifies which folds are populated..."`
- Reality: Technology Pages has **43 total fields** in `ce-inventory.json`. Of those, 9 are non-fold (`name`, `slug`, `list-item-only`, `technology-name`, `order`, `short-description`, `tech-logo`, `thumbnail`, `faq-schema-2`), leaving **34 fold-related fields** — not 40.
- Evidence: `audit-output/ce-inventory.json` → `.collections[] | select(.displayName == "Technology Pages") | .fields | length = 43`.
- Severity: HIGH — the migration script estimate feeds CONTENT-1 planning.

### B4. Section 3.9 Videos — `backgroundVideoPreviewLink` / `vimeoYoutubeStandardLink` typed as `url`, but Webflow stores PlainText

- Location: `docs/MYGRATR_SCHEMA_DESIGN_DECISIONS.md:350–351`
- Claim (verbatim): `"backgroundVideoPreviewLink: url (optional)" / "vimeoYoutubeStandardLink: url (optional)"`
- Reality: in `ce-inventory.json` these Webflow fields are `PlainText` type (free-form strings), not `Link` or `VideoLink`. Sanity `url` validator will reject any malformed string at content-migration time. Data is likely valid URLs in practice, but the type mismatch means the migration must strip/validate rather than pass through.
- Evidence: `.collections[] | select(.displayName == "Videos") | .fields[] | select(.slug == "background-video-preview-link" or .slug == "vimeo-youtube-standard-link")` returns `"type": "PlainText"` for both.
- Severity: HIGH — silent migration failure risk unless SCHEMA-1/CONTENT-1 expects soft-validation.

### B5. Section 9 — `/uk/archive/old-home` "returning 404" is imprecise

- Location: `docs/MYGRATR_SCHEMA_DESIGN_DECISIONS.md:1003`
- Claim (verbatim): `"/uk/archive/old-home page | Archived page returning 404"`
- Reality: the URL returns HTTP **200** (soft 404). The page body is a "404 / Oops! Page Not Found" template.
- Evidence:
  - `audit-output/ce-canonical-urls.json` → `.canonicalUrls[] | select(.url == "https://cloudemployee.io/uk/archive/old-home")` shows `"status": "200"`.
  - `audit-output/pages/archive__old-home/content.json` → `"title": "Not Found"`, `"headings": [{"level":1,"text":"404"}]`.
  - `audit-output/ce-template-map.json` classifies `/archive/old-home` as STATIC but `/uk/archive/old-home` as HOME — the two paths have inconsistent LLM classifications.
- Severity: HIGH — LAUNCH cutover needs an actual 410/404 redirect rule; the doc's blanket "returning 404" is wrong at the HTTP layer and will leak a soft-404 to Sanity/Next.js if not explicitly excluded.

---

## C. AMBIGUITIES AND WARNINGS (should fix) — severity MEDIUM

### C1. Webflow primary `name` field mapping is implicit across multiple Section 3 schemas

- Location: Sections 3.4 (technology), 3.8 (review), 3.9 (video)
- Claim: e.g. 3.4 `"technologyName: string (required, max 100 chars) — maps to \`technology-name\`"` — doc names `technologyName` but Webflow Technology Pages has TWO fields: `name` (Name, PlainText, required, maxLength 256) and `technology-name` (Developer Name, PlainText). The doc only maps `technology-name`.
- Reality: the Webflow `name` field is the system-required primary (used for URL slug derivation and default listing). It exists in every collection and is 100% populated. In most Section 3 schemas the Sanity equivalent is declared implicitly (`nameClient`, `technologyName`, etc.) without stating how the Webflow `name` data is handled.
- Similar pattern in Reviews (`name` = "Company name" vs `name-client` = "Name Client") and Videos (`name` primary vs other label fields).
- Severity: MEDIUM — migration script needs explicit rule; low risk because the data is typically synonymous.

### C2. Section 3.13 Tools & Quizzes — `hidden-code` Webflow field is not migrated and not in Section 9

- Location: Section 3.13
- Claim: Section 3.13 enumerates Sanity `tool` fields; Section 9 lists exclusions.
- Reality: Webflow Tools & Quizzes has a `hidden-code` field (displayName "Hidden Code", type RichText). It is NOT in the `tool` Sanity schema and NOT in the Section 9 deletion table.
- Evidence: `ce-inventory.json` → `.collections[] | select(.displayName == "Tools & Quizzes") | .fields[] | select(.slug == "hidden-code")` returns a valid field.
- Severity: MEDIUM — either add to schema, or explicitly exclude in Section 9.

### C3. Section 3.4 Technology `thumbnail` field claim

- Location: Section 3.4 fields block — `"thumbnail: image (optional)"`
- Reality: `ce-field-population.json` shows `thumbnail` at **0% fill rate** for Technology Pages. Schema includes it as an optional image; no migration data exists. Fine to keep as empty, but inconsistent with the same-section treatment of `fold-1---featured-image` (which is also 0% and silently folded into `folds`).
- Severity: MEDIUM / noise — document that this field is intentionally empty at migration.

### C4. Section 10 — `/uk/embedding` UNKNOWN in template-map

- Location: Section 10 "UK locale mirror"
- Claim: `"All routes above are served at /uk/[original-path] until LOCALE-1 decides otherwise."`
- Reality: `audit-output/ce-template-map.json` classifies `/uk/embedding` as **UNKNOWN** (1 of 4 UNKNOWN URLs). The UK locale-mirror catch-all in Section 10 resolves it implicitly, but because this URL appears unresolved in the source data (CLAUDE.md tech debt #9 flags it), SCHEMA-1 / CONTENT-1 should know this is not an orphan.
- Severity: MEDIUM — addressable by a one-line note in Section 10 confirming the UK `/embedding` maps to `embeddingPage` singleton.

### C5. Field-population "totalItems" vs inventory itemCount divergence (not a doc issue, but flagged for SCHEMA-1)

- Location: N/A (source-data note)
- Reality: `ce-field-population-summary.json` "totalItems" for several collections (Reviews 11, Customer Stories 17) is lower than `ce-inventory.json` `itemCount` (Reviews 26, Customer Stories 18). The doc uses the inventory figures throughout. SCHEMA-1/CONTENT-1 should treat the inventory `itemCount` as authoritative (US + UK total) and interpret field-population `totalItems` as the US-only published subset.
- Severity: MEDIUM — doc is correct; this note is a heads-up for downstream sessions.

### C6. Sanity `max 100 chars` on `nameClient`, `technologyName`, etc. — tighter than Webflow's 256

- Location: many Section 3 schemas
- Claim: e.g. `"nameClient: string (required, max 100 chars)"`
- Reality: Webflow stores these with `maxLength: 256`. Sanity tightening to 100 is a design choice, not an error, but content over 100 chars will fail migration validation. Spot-check recommended before CONTENT-1.
- Severity: MEDIUM — design choice worth confirming.

---

## D. MISSING COVERAGE (Webflow data not addressed in the doc)

### D1. `Legal pages` collection not in Section 3

- Webflow collection: `Legal pages` (1 item, 4 fields: `name`, `slug`, `legals-content`, `meta-description`).
- Expected treatment: migrate — it is the source for the `/legals/privacy-policy` page.
- Current doc treatment: referenced only in Section 4.4 table as `"privacyPolicyPage | Migrated from Webflow Legal pages collection (1 item)"`. Section 3 opener states "33 Webflow collections map to 17 Sanity document types" — but this collection migrates to a singleton, not a doc type.
- Recommendation: add a note in Section 3 (or Section 4.4) mapping `Legal pages` → `privacyPolicyPage` singleton with explicit field mapping (`legals-content` → `sections[portableText]`, `meta-description` → `metaDescription`).

### D2. Webflow `name` primary-field mapping rule

- Across Section 3 schemas (Reviews, Technology, Videos and others), the Webflow `name` field isn't explicitly mapped to a Sanity field.
- Expected treatment: migrate — `name` is 100% populated in every collection.
- Recommendation: add a cross-cutting rule in Section 7 stating "Webflow `name` field maps to Sanity primary title field (e.g. `title`, `technologyName`, `nameClient`, etc.) unless otherwise specified".

### D3. Tools & Quizzes `hidden-code` field

- Webflow field: `hidden-code` (RichText).
- Expected treatment: unclear — either migrate (preserve for embedded custom HTML) or delete (if legacy).
- Recommendation: either add to `tool` schema as `hiddenCode: array[portableText]` or add to Section 9.

### D4. ~653 Webflow redirect rules in `webflow-redirects.csv` not addressed by Section 8

- Location: Section 8 claim `"All 11 regex redirects and 30 individual redirects from ce-regex-redirects.json and ce-canonical-urls.json preserved"`.
- Reality: `audit-output/webflow-redirects.csv` contains 653 explicit `source,target` pairs, mostly `/live-job-role/*` → `talent.cloudemployee.io/live-job-role/*`. These are separate from the 30 crawl-discovered redirects.
- Expected treatment: preserve via `next.config.js` redirects or rely on the Geotargetly PH-traffic routing.
- Recommendation: Section 8 should explicitly state which of the three redirect sources is authoritative and how the 653 Webflow-config redirects are preserved (or confirm they're subsumed by existing regex patterns).

### D5. Doc type count claim

- Section 3 says "17 Sanity document types". See B1 above — count is either 16, 18, or 21 depending on what's included. Recommendation: correct the count or clarify the scope.

---

## E. UNVERIFIABLE CLAIMS (flagged for manual check)

- **E1.** GTM container contents, including the `Pricing Calculator Confirmed` GA4 event firing logic referenced in Sections 5 and 7.10. GTM exports were not committed to repo.
- **E2.** Section 11 "HubSpot workflow cross-reference — Requires automation scope on HubSpot token" — token scope is env-level, outside repo.
- **E3.** Strategic rationale in Section 1 (guiding principles) and Section 7 (cross-cutting decisions) — non-factual, design intent.
- **E4.** Future-state claims: programmatic content generation (Section 7.2), Beem / Claude Code content pipelines (Section 3.20), MYGRATR-LOCALE-1 US/UK diff (Section 7.11).
- **E5.** Assertion that `@sanity/presentation`, `@sanity/visual-editing`, `@sanity/document-internationalization` will be installed in SCAFFOLD-1 (Sections 7.11, 7.12). SCAFFOLD-1 has not run.

---

## F. CLEAN CHECKS — verified and found correct

### Item counts (Tier 1b)

All Section 3 and Section 10 collection item counts match `audit-output/ce-inventory.json` exactly:

- Team Members 28 ✓ (3.7, 10)
- Reviews 26 ✓ (3.8, 10)
- Customer Stories 18 ✓ (3.6, 10)
- Client Benefits & Company Values 9 ✓ (3.17)
- Staff Benefits 6 ✓ (3.17)
- Blogs & Guides 31, Staff Augmentation Blogs 28, Nearshoring & Offshoring Blogs 13, Scaling Teams Blogs 9, Hiring Tips Blogs 7, Managing Engineers Blogs 7, AI in Software Development Blogs 3 → **sum 98** ✓ (3.1, 10)
- Hubs 6 ✓ (3.3)
- Downloads 5 ✓ (3.11, 10)
- Lead magnets / Tags 17 ✓ (Section 9)
- Glassdoor reviews 10 ✓ (3.16)
- Technology Pages 101 ✓ (3.4, 10)
- Downloads Access Pages 5 ✓ (3.12, 10)
- Services 23 ✓ (3.5, 10)
- Videos 32 ✓ (3.9, 10)
- Tags >> {Blogs 8, Downloads 2, Tools & Quizzes 3, Video Library 3, Alternatives 4, Events & Webinars 2} → sum 22 ✓ (3.2)
- Tools & Quizzes 2 ✓ (3.13, 10)
- Book A Call Pages 6 ✓ (3.14, 10)
- Compare Blogs 29 ✓ (3.10, 10)
- Events & Webinars 1 ✓ (3.15, 10)
- Insights 1, New Blog Templates 5 ✓ (Section 9 exclusions)

### Section 7.10 form IDs (Tier 1j)

All three HubSpot form GUIDs and their target pages match `audit-output/ce-forms.json` exactly:

- `24f5bd5f-3532-4c4e-908f-1266809bc897` → `/price-comparison-calculator` (Start Hiring Request) ✓
- `444bfbf1-2018-456c-b8fd-932d909b0888` → `/scaling-teams/building-a-software-development-team-core-roles-dedicated-developers-and-modern-hiring-models` (Blog form) ✓
- `1578f9b5-fb43-4772-83df-79c51c120a92` → `/start-hiring/contact-info` (Start Hiring Part 2/8) ✓
- HubSpot portal `22809822` ✓

### Section 9 deletion justifications (Tier 1g)

Every "0% fill rate" claim confirmed in `audit-output/ce-field-population.json`:

- `Downloads.code-rich-text` 0% ✓
- `Downloads.you-ll-get-tag--4-2` 0% ✓
- `Downloads.you-ll-get-tag--5-2` 0% ✓
- `Downloads.faq-title---7` / `faq-answer---7` 0% ✓
- `Downloads.faq-title---8` / `faq-answer---8` 0% ✓
- `Glassdoor reviews.review-link` 0% ✓
- `Technology Pages.faq-schema-2` 5% ✓ (matches Section 3.4 claim "currently stores raw JSON-LD string on 5% of items")
- `Customer Stories.video-url-2` 12% fill (2 of ~17 items) ✓ — matches Investigation-2

### Investigation cross-references (Tier 1)

- Investigation-2 `video-url-2` claim: `"only 2 items have it populated and both are malformed YouTube embed URLs"` — exact match with `docs/investigations-2026-04-23/REPORT.md` Investigation 2.
- Investigation-3 Glassdoor rendering: `"Consumed by: /for-developers and /reviews pages (confirmed by Investigation 3 — 183 hits on each)"` — exact match with Investigation 3 findings.
- Investigation-1 static pages: 37 US static paths found; doc Section 4.4 lists 13 static content singletons + 11 hub singletons (Section 4.1) + 4 resource-hub singletons (Section 4.2) + 6 collection-index singletons (Section 4.3) ≈ 34, consistent with the "~20 bespoke static pages" finding.

### Section 8 redirect count (cross-source)

- Regex redirects: 11 ✓ (`ce-regex-redirects.json` array length = 11).
- Crawl-discovered redirects (301 + 302): 30 ✓ (`ce-canonical-urls.json` status counts 29×301 + 1×302).
- (See D4 for the webflow-redirects.csv gap.)

### Section 6 globals

- HubSpot portal ID `22809822` matches ce-forms.json portal entry ✓.
- Clara workspace ID matches `audit-output/ce-global-components.json` ✓.
- Newsletter form GUID `deac2450-b51b-4630-b9e2-47017a13da15` present in global-components ✓.
- Nav primary links, footer column structure, locale dropdown presence match global-components ✓.

### Section 10 route-source mapping (Tier 1h)

Every CMS-driven route row maps to a document type also defined in Section 3; every singleton route row maps to a singleton defined in Section 4. No orphan URL patterns.

### Tier 2 reference-target integrity

Every `reference → X` or `array[reference → X]` in a schema resolves to a doc type defined elsewhere in the doc: `blogCategory`, `tag`, `teamMember`, `technology`, `review`, `benefitValue`, `staffBenefit`, `glassdoorReview`, `customerStory`, `video`, `tool`, `download`, `event`. Clean.

### Section 3 → Section 9 → Section 10 closure

Every Webflow collection in `ce-inventory.json` is addressed:
- 29 migrated (7 blogs + 6 taxonomy + Hubs + Technology + Services + Customer Stories + Team Members + Reviews + Videos + Compare Blogs + Downloads + Downloads Access Pages + Tools & Quizzes + Book A Call Pages + Events & Webinars + Glassdoor reviews + Client Benefits & Company Values + Staff Benefits + Legal pages)
- 3 excluded (Insights, New Blog Templates, Lead magnets / Tags)
- Total 32 unique, + 1 (Legal pages) addressed only in Section 4.4 = 33 ✓
- (D1 flags the Legal pages documentation gap, but no collection is unaddressed in substance.)

---

## Recommendation for SCHEMA-1

The document is substantively correct — no structural blockers, no missing document types for routable URLs, all form IDs and redirect counts verified. The five HIGH-severity items in Section B and five coverage items in Section D should be resolved in a v1.1 revision before SCHEMA-1 consumes the doc verbatim. None of the issues require a re-architecture: they are counts, type mismatches, and coverage notes.

*End of SCHEMA_DECISIONS_AUDIT_REPORT.md*

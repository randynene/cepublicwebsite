# Investigation — Tech Debt #14 (service doc Studio "Invalid property value" warnings)

**Date:** 2026-05-02
**Scope:** `service` doc type only (23 docs in Sanity production)
**Mode:** Read-only — no Sanity writes, no schema modifications, no migration scripts
**Time spent:** ~15 min of the 30-min budget

## TL;DR

The "Invalid property value" warning Studio surfaces on service docs has a **single root cause**: every one of the 23 service docs was migrated with `thumbnail: null` written into the doc. Sanity's schema declares `thumbnail` as type `image`; a literal `null` stored where Studio expects an image object (or the field absent) trips the strict-validation message. **Recommended fix is Option B (data-side `unset(['thumbnail'])` on all 23 docs)**, an idempotent one-shot patch via the existing migration tooling — trivial effort, zero render-time impact, removes the cosmetic warning entirely.

`openGraphImage` was a false alarm in my initial scan (GROQ projection returned `null` on a missing key — the field is actually absent, and Studio is not complaining about it). No other non-primitive fields on `service` are affected.

---

## Findings

### 1. Scope check — Sanity field state

I scanned all 23 service docs and classified every schema-declared
non-primitive field by stored shape:

| Field | Schema type | Required? | null literal | absent | valid | invalid |
|---|---|---|---|---|---|---|
| `thumbnail` | image | no | **23** | 0 | 0 | 0 |
| `associatedTechnologies` | array (refs) | no | 0 | 0 | 23 | 0 |
| `folds` | array (folds) | yes (`Rule.required().min(1)`) | 0 | 0 | 23 | 0 |
| `openGraphImage` | image | no | 0 | **23** | 0 | 0 |
| `metaTitleSource` | object | no | 0 | 0 | 23 | 0 |
| `metaDescriptionSource` | object | no | 0 | 0 | 23 | 0 |

Initial pass conflated "null literal stored" with "field absent" because
the GROQ projection `{openGraphImage}` returns null for a missing key. A
follow-up using `defined(openGraphImage)` confirmed the true picture: 0
service docs have `openGraphImage` defined, and 0 store null literally —
the field is simply not present on the doc, which Studio handles
silently.

The doc-shape inspection on `service-6838a77728cdcf2275bb7b31`
("MVP Development") confirms the asymmetry:

```
keys on doc:    ..., thumbnail, ...   // ← thumbnail key IS present
                                       // (openGraphImage absent)
thumbnail value: null
openGraphImage value: undefined
```

**Nested check** — `folds[].featuredImage` is also typed `image` and
optional. The diagnostic scanned every fold object on every service doc
and found **zero null entries**. The migrator's `foldHasContent()` filter
(see `scripts/content/migrate-services.ts:70-78`) drops folds without
content; folds that survive that filter all carry real, uploaded images.

### 2. Categorisation per field

| Field | Category | Studio impact | Render-time impact |
|---|---|---|---|
| `thumbnail` | Optional in schema (no validation rule); Webflow source field is 0/23 populated; null is benign in template logic but Studio flags as "Invalid property value" because the stored value type (null) doesn't match the declared type (image object). | Cosmetic warning on every service doc | None — templates check truthy/asset presence anyway |
| `associatedTechnologies` | Optional, properly populated as a reference array | Clean | Renders correctly |
| `folds` | Required, properly populated | Clean | Renders correctly |
| `openGraphImage` | Optional, **absent from doc shape** (not null) | Clean — Studio shows empty field, not error | None — falls back to default OG image |
| `metaTitleSource` / `metaDescriptionSource` | Optional, populated by CONTENT-1D | Clean | n/a (hidden audit-trail) |

The user's original report mentioned "serviceLogo or similar" — there is
no `serviceLogo` field on the schema. The field Studio flagged was
**`thumbnail`**, which the user paraphrased.

### 3. Cause attribution — cross-reference to Webflow source

`audit-output/ce-field-population.json` reports the following for
the Webflow Services collection (23 items):

```
fold-1---featured-image    Image           23/23 (100%)
fold-2---featured-image    Image           23/23 (100%)
associated-technologies    MultiReference  23/23 (100%)
thumbnail                  Image           0/23   (0%)   ← here
```

So **the Webflow `thumbnail` field is empty on all 23 source items**.
The CONTENT-1C migrator at `scripts/content/migrate-services.ts:209`
calls `await uploadImage(f['thumbnail'])` — that helper's contract
(see `src/lib/content/migration-helpers.ts:201-209`) is "returns null
when the input field is missing OR upload fails." Because every
Webflow item lacks the field, every call returns null, and the
migrator writes `thumbnail: null` into the doc literal:

```typescript
const doc = {
  _id: `service-${item.id}`,
  ...
  thumbnail: await uploadImage(f['thumbnail']),  // ← null for all 23
  ...
}
await sanityWriteClient.createOrReplace(doc)
```

This is **cause (a) — Webflow source field empty**, compounded by a
secondary cause: the migrator pattern of writing `null` rather than
omitting the field. If the migrator had used a conditional spread (e.g.
`...(thumbnailAsset ? { thumbnail: thumbnailAsset } : {})`), `thumbnail`
would have been absent on the doc rather than `null`, and Studio
would not flag.

`openGraphImage` is **not** in the migrator's doc literal at all —
that's why the field ends up absent (the source-of-truth being "the
migrator never wrote it"). This corroborates the cause split: the
migrator only writes `null` for fields it explicitly mentions; absent
fields are silently absent.

The same pattern is also visible in the migrator for `metaTitle: null`
and `metaDescription: null` (CONTENT-1C wrote those, CONTENT-1D
backfilled them). For `thumbnail`, no backfill phase was scheduled —
it's a content-team decision whether services need thumbnails at all.

### 4. Per-field recommendations

| Field | Recommended path | Rationale |
|---|---|---|
| `thumbnail` | **Option B — data-side `unset(['thumbnail'])` on all 23 docs** | Trivial idempotent patch. Removes the cosmetic warning. Identical render-time semantics (null and absent are both falsy in template checks). If/when Seb wants thumbnail images, he populates them via Studio normally — Option C (backfill) becomes a future content-team task with no engineering blocker. |
| All others | **Option D — leave as-is** | Either properly populated or properly absent. Studio is not flagging them. |

**Option A (schema-side fix) rejected** because Sanity does not have a
"nullable" or "allow null" flag for object types — `type: 'image'` always
expects an object or for the field to be absent. The schema is correct
as written; the data is what's wrong.

**Option C (backfill) deferred** to a future phase if/when CE decides
service docs need thumbnails. That's a content-team decision, not a
technical one. No blocker.

---

## If you authorise the fix — effort estimate

A `scripts/content/unset-service-thumbnail-nulls.ts` script following
the established CONTENT-1D Op pattern:

```typescript
// ~50 lines. Per-doc guard sequence:
//   1. Fetch doc by _id; throw if not found.
//   2. Assert _type === 'service'.
//   3. Assert thumbnail === null (rules out: someone uploaded an image
//      between this audit and execution).
// Then surgical .unset(['thumbnail']).commit().
// Records one new content_migrations row: 'service-thumbnail-null-unset'.
```

**Estimated build + execute + commit + verifier-update + post-phase
note:** ~30 minutes. Same shape as the bookACall stale-needsReview
unset (DEV-5) just executed — including the per-doc guard sequence,
audit-trail row, and brief-deviation logging.

If you authorise, the deviation slug would be `service-thumbnail-null-unset`
and the verifier would extend `ALL_NEW_1D_SLUGS` to 15 (or roll under
a "post-1D corrections" identifier — your call). Total CE
content_migrations rows: 38 → 39. `total_cms_docs` unchanged (no
deletions, no creations).

The runtime monotonic-flag rule does NOT apply here — `thumbnail` is a
plain image field, not a flag, and unsetting null is the correct
Sanity-idiomatic operation. No new structural protection required
beyond the existing per-doc guards.

---

## Risk assessment of leaving it unresolved

**Risk: low — the warning is functionally cosmetic.**

| Vector | Impact |
|---|---|
| Render-time | None. Templates evaluate `doc.thumbnail` as truthy/asset-present checks; null and absent behave identically. |
| Editor confusion | Mild. Seb sees an "Invalid property value" warning on every service doc and may investigate / try to "fix" it (no fix available from Studio UI for a field that's already null — the "Reset value" button itself does nothing useful since the underlying data is the issue). |
| `needsReview` queue noise | Indirect. The current migrator wrote `needsReview: true` on all 23 service docs at CONTENT-1C time — orthogonal to this issue, but the Studio warning may distract attention from real review concerns. |
| Future migration risk | Low — pattern is documented now. New migrators can adopt the conditional-spread idiom to avoid writing `null` for empty image fields. |
| Pre-launch gate | None. No exit criterion in any phase fails because `thumbnail` is null. |

**Systemic note (do not act on without authorisation — out of scope per the brief):**
The same migrator pattern is present in `migrate-technology.ts` and
`migrate-customer-stories.ts` (both call `await uploadImage(...)` and
write the result into the doc literal). They may have the same issue
on their image fields if any Webflow source field is unpopulated. If
you want a follow-up scan across all 6 in-scope CONTENT-1D doc types, I
can produce one in a separate read-only diagnostic; halting here per
the time + scope budget you set.

---

## Files touched by this investigation

**Created (this session):**
- `scripts/content/diag-tech-debt-14-service-nulls.ts` — read-only
  diagnostic, reusable for follow-up scans on other doc types.
- `docs/investigations/2026-05-02-tech-debt-14/REPORT.md` — this file.

**Read (no modifications):**
- `CLAUDE.md` (Tech Debt section)
- `CONVENTIONS.md` (Live-Site Meta Backfill Pattern, Deletion Safety Rule)
- `studio/schemas/documents/service.ts`
- `studio/schemas/_shared.ts` (for `imageField` definition)
- `scripts/content/migrate-services.ts` (CONTENT-1C original migrator)
- `src/lib/content/migration-helpers.ts` (for `uploadImage` semantics)
- `audit-output/ce-inventory.json` (Webflow Services field list)
- `audit-output/ce-field-population.json` (Webflow Services population rates)
- `PHASE_HISTORY.md` (CONTENT-1B note — services were actually migrated
  in CONTENT-1C; the brief's pointer was approximate)

No Sanity writes. No schema modifications. No migration scripts run
beyond the read-only diagnostic. Tech Debt #14 entry in `CLAUDE.md`
unchanged pending your decision on Option B.

---

## What I recommend next

1. You approve / decline Option B for `thumbnail`.
2. If approved, I scope a small fix (one new script + one audit-trail row + verifier expectations bump + a short PHASE_HISTORY append) as a separate plan-mode round before any writes.
3. Optional follow-up (a separate read-only investigation, no scope creep here): scan `technology`, `customerStory`, `teamMember`, `review`, `bookACall`, `event`, `tool`, `download`, `video`, `benefitValue`, `staffBenefit` for the same null-image pattern. ~10 minutes if you want it.

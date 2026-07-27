# ANNOUNCEMENT_BAR_SCHEMA_DRAFT — `announcementBar` on the navigation global

**Status:** DRAFT — awaiting Jake lock. Doc only, no code. Folds into STATIC-3 chrome-finishing (with the footer rebuild).
**Where it lives:** an object field on the existing `navigation` global (`studio/schemas/globals/navigation.ts`), NOT a new document type. It's site-wide chrome, one instance, edited alongside the rest of the nav.
**Evidence base:** `docs/design/raw-html/Header.html` frame 01 — the 44px top bar above the nav ("NEW — Compare engineer costs by region with our live Price Calculator. — Open calculator →").

---

## 0. Why CMS-driven, not hardcoded

An announcement bar's whole purpose is to change often — new promo, seasonal message, or turned off entirely when nothing's running. Hardcoding it guarantees a code edit every time Seb wants to change or hide it. So it's CMS-driven with an explicit on/off toggle. The toggle also cleanly solves the reserved-empty-space bug: when `enabled` is false, the bar doesn't render AND its layout space collapses (no reserved gap).

## 1. Field spec — `announcementBar` object on `navigation`

```
announcementBar   object   optional
  └ enabled        boolean   required   initialValue false
                              # master on/off. When false, the bar does not render
                              # and reserves no layout space. Default false so the
                              # bar only appears when Seb deliberately turns it on.
  └ badgeLabel     string    optional   max 20
                              # the lime pill text, e.g. "NEW". Optional — bar can
                              # render without a badge.
  └ message        string    required (if enabled)   max 120
                              # "Compare engineer costs by region with our live Price Calculator."
  └ linkLabel      string    optional   max 40
                              # "Open calculator" — the CTA text on the right
  └ linkUrl        string    optional
                              # where the CTA points. Internal path (/pricing,
                              # /tools/...) or full URL. Optional so the bar can be
                              # message-only with no CTA.
```

**Validation notes:**
- `enabled` drives everything. When false, renderer returns null (no DOM, no reserved height).
- `message` required only when `enabled` is true — use a `Rule.custom()` so an empty draft with `enabled: false` still validates. (Same pattern as other conditionally-required fields in the repo.)
- `linkLabel` + `linkUrl` are a pair — if one is set, the other should be too. Soft-validate or flag; don't hard-block (a message-only bar is valid).

## 2. Render behaviour (D5 / component note, not schema)

- `enabled: false` → render nothing, collapse the space. This fixes the current empty-reserved-gap bug regardless of whether a promo is running.
- `enabled: true` → render the 44px bar per `Header.html` frame 01: `background:#0A1628`, lime badge pill, message text, right-aligned CTA link with arrow. Match the export's exact values.
- The bar sits ABOVE the nav bar, full-width, per the export.
- Internal `linkUrl` → real `<a href>` (crawlable — it's a live internal link, matters for the link graph).

## 3. Seed

Seed with `enabled: false` initially (or `true` with the export's Price Calculator copy if that promo is live now — Jake's call). Seeding it enabled with real copy also lets you verify the render matches the export immediately.

## 4. Reusability note (Customer-2)

Generic shape — `announcementBar` with enabled/badge/message/link is not CE-specific. Reusable for any customer's site chrome. No CE-coupled field names. ✅

## 5. Open questions

| # | Question | Default |
|---|---|---|
| Q1 | Seed `enabled: true` with the Price Calculator promo now, or `false` (bar off until Seb sets it)? | Seed `true` with the export copy so it renders + verifies against frame 01; Seb can toggle off later |
| Q2 | Should `linkUrl` be a proper Sanity `url` type (validates format) or a plain string (allows internal paths like `/pricing`)? Internal paths fail `url` validation. | Plain string — internal paths are the common case; validate lightly |

Neither blocks locking.

## 6. What locking this unblocks

- The `announcementBar` object is added to the navigation global schema (additive, alongside the footer rebuild in STATIC-3 chrome-finishing).
- The 44px bar renders per `Header.html` frame 01, CMS-controlled, with the empty-space bug fixed via the `enabled: false` → collapse behaviour.

No code from this doc. Additive schema change only — does not touch existing navigation fields.

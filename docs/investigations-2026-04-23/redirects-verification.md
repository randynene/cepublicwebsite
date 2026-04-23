# Redirects Verification — 2026-04-23

Verification of `audit-output/webflow-redirects.csv` against the current crawl,
sitemap, and Ahrefs baseline to understand how much of the Webflow redirect
table is devoted to the discontinued `/live-job-role/*` pattern vs. genuine
SEO-critical redirects that must be carried through to Next.js.

Source files examined:
- `audit-output/webflow-redirects.csv` (653 rows + header)
- `audit-output/ce-canonical-urls.json` (640 canonical entries)
- `audit-output/ce-sitemap-xml.json` (522 URLs)
- `audit-output/screaming-frog-redirects.csv` (1,029 redirect rows)
- `audit-output/ce-ahrefs-baseline.json` (empty — see Tech Debt #4)

---

## 1. Row breakdown — `/live-job-role/*` vs. other

**Total rows in `webflow-redirects.csv`: 653** (excluding header).

| Pattern | Rows | % of file |
|---|---:|---:|
| `/live-job-role/<slug>` (US) | 111 | 17.0% |
| `/uk/live-job-role/<slug>` (UK) | 111 | 17.0% |
| `/ph/live-job-role/<slug>` (PH) | 111 | 17.0% |
| `/live-job-role`, `/uk/live-job-role`, `/ph/live-job-role` (bare index) | 3 | 0.5% |
| **Job-role subtotal** | **336** | **51.5%** |
| Everything else | 317 | 48.5% |

Every job-role entry (US/UK/PH) points at
`https://talent.cloudemployee.io/live-job-role/<slug>` (or the bare
`https://talent.cloudemployee.io/` for the three index rows), which aligns with
the decision recorded in `CLAUDE.md`: PH locale discontinued, job-role traffic
delegated to the `talent.cloudemployee.io` subdomain via Geotargetly.

**Breakdown of the 317 non-job-role redirects by target:**

| Target | Count | Notes |
|---|---:|---|
| `/blog` | 77 | Dead blog-post slugs rolled up to the index |
| `/` | 14 | Retired landing pages → homepage |
| `/videos` | 10 | Old video pages consolidated |
| `/about-us` | 8 | |
| `/technology` | 7 | |
| `/how-it-works` | 7 | |
| `/pricing` | 6 | |
| `/start-hiring`, `/reviews`, `/downloads`, `/contact`, `/compare` | 4 each | |
| `/for-developers` | 3 | Old `/careers`, `/refer-a-candidate` consolidation |
| everything else | ~170 | Tail of one-off URL moves |

By source prefix: 77 `/blog/…`, 48 `/uk/…` (non job-role), 43 `/ph/…`
(non job-role), 15 `/hire/…`, 10 `/videos/…`, 10 `/resources/…`,
7 `/technology/…`, plus a long tail.

---

## 2. Five examples of non-`/live-job-role/*` redirects

Drawn from different areas of the tail to show the shape of the remaining 317:

| # | Source | Target | Category |
|---|---|---|---|
| 1 | `/after-care` | `/how-it-works` | Retired top-level page consolidated |
| 2 | `/blog/tips-to-building-and-keeping-your-dream-web-team` | `/blog` | Dead blog post → index rollup |
| 3 | `/careers` | `/for-developers` | Section rename |
| 4 | `/ph/resources` | `/ph/downloads` | Locale-scoped section rename (PH) |
| 5 | `/start-hiring/get-started` | `/start-hiring/contact-info` | Funnel step rename |

These are the kinds of redirects that **must** be preserved in the Next.js site
(`redirects()` in `next.config.js` or equivalent), because users and backlinks
still reach them. Contrast with the 336 job-role rows, which can be handled by
a single regex rule pointing at `talent.cloudemployee.io`.

---

## 3. Are any `/live-job-role/*` URLs still active?

**No — none appear in the current crawl or sitemap.**

| Source | `live-job-role` matches |
|---|---:|
| `ce-canonical-urls.json` (640 canonicals) | **0** |
| `ce-sitemap-xml.json` (522 URLs from `sitemap.xml`) | **0** |
| `screaming-frog-redirects.csv` (1,029 redirect rows) | **0** |
| `screaming-frog-export.csv` (full crawl) | **0** |
| `ce-sitemap.json` | **0** |

Also checked for looser variants (`job-role` without the `live-` prefix, case
variations) — zero matches across all five files.

The only `talent.cloudemployee.io` references in the Screaming Frog redirect
export are three rows all pointing at `https://talent.cloudemployee.io/apply`
from the `/uk/for-developers` page — unrelated to job-role URLs.

**Conclusion:** the 336 `/live-job-role/*` redirect rules are serving historical
traffic (backlinks, bookmarks, old Google results) only. None of those URLs
exist on the live site or in its sitemap anymore. They are safe to implement
as a single regex rule rather than 336 individual redirects.

---

## 4. Ahrefs baseline for backlinks

**`ce-ahrefs-baseline.json` contains no backlink data**, confirming Known
Tech Debt #4 in `CLAUDE.md`:

```json
{
  "domainRating": null,
  "referringDomains": null,
  "organicKeywords": 0,
  "topKeywords": [],
  "topPages": [],
  "notes": [
    "Could not fetch organic keywords: ... Ahrefs API ... returned 400: missing argument date",
    "Could not fetch top pages: ... Ahrefs API ... returned 400: missing argument date"
  ]
}
```

Two separate issues compound here:
1. The Ahrefs subscription on file does not cover `cloudemployee.io` (Tech Debt #4).
2. The two API calls that ran also failed with a `missing argument date` 400,
   so even if the subscription were in place this capture would be empty.

**We cannot currently assess backlink value on `/live-job-role/*` URLs from
this artefact.** If backlinks to retired job-role URLs matter for the cutover,
that verification needs to come from a working Ahrefs (or Semrush / GSC Links
report) pull before MYGRATR-LAUNCH. Per `CLAUDE.md`, the planned remediation
is in MYGRATR-MONITOR-1 — but for **launch redirect decisions** we may need it
sooner.

---

## Recommendation for MYGRATR-SCHEMA-1 / MYGRATR-LAUNCH

1. **Collapse 336 job-role rows into a single regex redirect.**
   `^/(?:uk/|ph/)?live-job-role(?:/(.*))?$  →  https://talent.cloudemployee.io/live-job-role/$1`
   (matching the existing `ce-regex-redirects.json` pattern).
   Keeps the redirect table auditable and avoids 336 discrete `next.config.js`
   entries.

2. **Keep all 317 non-job-role redirects as explicit rules.** They are
   heterogeneous (page renames, blog rollups, retired sections, locale moves)
   and can't be expressed as a small regex set without risk of collateral damage.

3. **Before launch: get a real backlink signal.** Resolve Tech Debt #4 or
   substitute GSC Links / Semrush so we know whether any retired URL (job-role
   or otherwise) is carrying enough backlink equity to warrant a smarter
   destination than the current catch-all.

4. **Sitemap cleanup is already complete.** No `live-job-role/*` URL exists in
   the sitemap or canonical list, so nothing on the live site actively links
   to these paths — the redirects are strictly for inbound legacy traffic.

# Investigations — 2026-04-23

Three targeted investigations run against the AUDIT-1 output and live Webflow API for Cloud Employee.

Artefacts in this folder:

| File | Source |
|---|---|
| `investigation-1-static-pages-raw.txt` | User's original script, adjusted only for `www.` |
| `investigation-1-static-pages-clean.txt` | Deduped, query-stripped, noise-filtered |
| `investigation-2-customer-stories-videos.json` | Full Webflow API payload (18 items) |
| `investigation-2-customer-stories-videos.txt` | Raw log from query run |
| `investigation-2-customer-stories-videos-flat.txt` | Flat table with resolved URLs |
| `investigation-3-grep-results.txt` | Raw `grep -l` output (17 files) |
| `investigation-3-glassdoor-contexts.json` | Every hit with ±60-char context |
| `investigation-3-glassdoor-contexts.txt` | Human-readable context dump |
| `investigation-3-summary.txt` | Per-page hit counts |

---

## Investigation 1 — Non-CMS static Webflow pages (US only)

**Finding.** The user's original script returned only 6 URLs because it filtered `https://cloudemployee.io` (non-www), which is the 301-source. The live origin in Screaming Frog data is `https://www.cloudemployee.io`. After adjusting for `www.`, deduping, stripping query strings, and removing noise (PH locale, Cloudflare challenge endpoints `/cdn-cgi/*`, GTM tracking beacons at `/haqt6...` and `/nvhc9u...`, sitemap.xml, API routes), **37 US static paths remain**:

```
/
/about-us
/ai-in-software-development          ← CMS collection landing
/alternatives
/archive/old-pricing                 ← unexpected
/blog                                ← CMS collection landing
/book-a-call                         ← CMS collection landing
/compare                             ← CMS collection landing
/contact
/customer-stories
/downloads                           ← CMS collection landing (note: slug is `/downloads` not `/download`)
/embedding                           ← unexpected, also flagged as UNKNOWN in tech debt #9
/events                              ← CMS collection landing
/for-developers
/hiring-cost-calculator
/hiring-tips                         ← CMS collection landing
/how-it-works
/impact
/managing-engineers                  ← CMS collection landing
/nearshoring-offshoring              ← CMS collection landing
/our-work
/price-comparison-calculator
/pricing
/retention
/reviews                             ← CMS collection landing
/scaling-teams                       ← CMS collection landing
/services                            ← CMS collection landing
/sourcing
/staff-augmentation                  ← CMS collection landing
/start-hiring/contact-info
/start-hiring/get-started
/team                                ← CMS collection landing
/team/                                ← duplicate (trailing slash)
/technology                          ← CMS collection landing
/tools                               ← CMS collection landing
/videos                              ← CMS collection landing
/work-with-shawnee                   ← personal landing
```

**Notes / things to flag.**
- The user's original filter kept CMS *collection landing pages* (single-segment paths like `/blog`, `/services`, `/reviews`) — these are static templates that render a CMS index, not CMS items. 17 of the 37 paths are collection landings. The remaining **~20 are truly bespoke static pages**.
- `/team` and `/team/` are both present — trailing-slash duplicate worth canonicalising at cutover.
- `/archive/old-pricing` is a legacy archive route — worth deciding whether to port or redirect.
- `/embedding` matches the tech-debt #9 UNKNOWN entry — content-type filter should drop it.
- `customer-stories` (plural) appears in SF but the CMS collection path is `/customer-story/` — inconsistency between landing URL and item URL pattern.

---

## Investigation 2 — `video-url-2` in Customer Stories (Webflow API)

Collection `673a5beebf20965117eab8f4` returned **18 items**. Of those:
- 6 have `video-testimonial-if-available` populated (field type: video/embed object with `.url`)
- **Only 2 have `video-url-2` populated** (field type: plain string)

| slug | `video-testimonial-if-available` (url) | `video-url-2` |
|---|---|---|
| sqr | `https://player.vimeo.com/video/1110779695?h=031795f3d1&...` | — |
| event-connections | — | — |
| travel-tech-client | `https://player.vimeo.com/video/1094749643?autoplay=1&muted=1&loop=1` | — |
| mercato | `https://player.vimeo.com/video/1092738250?autoplay=1&muted=1&loop=1` | — |
| cleanlink | `https://player.vimeo.com/video/1092736875?autoplay=1&muted=1&loop=1` | — |
| **salmon-software** | `https://player.vimeo.com/video/1145433775?autoplay=1&muted=1&loop=1` | **`https://www.youtube.com/embed/?v=VcTsMI6M-sA`** |
| waya | — | — |
| virgin | — | — |
| travelx | — | — |
| fulfillment | — | — |
| builder | — | — |
| hotelplan | — | — |
| jetaboard | — | — |
| tidal | — | — |
| scorpion | — | — |
| g | — | — |
| **willo** | `https://player.vimeo.com/video/1092726413?autoplay=1&muted=1&loop=1` | **`https://www.youtube.com/embed/?v=bqZ90UopRjg`** |
| engage | — | — |

**Observations.**
- `video-testimonial-if-available` is a Vimeo-hosted object (with full `metadata.html` iframe, thumbnail, title, description). Primary video source.
- `video-url-2` is a plain string, always a malformed YouTube embed URL: `https://www.youtube.com/embed/?v=<id>` — the standard form is `https://www.youtube.com/embed/<id>`. The `?v=` query is YouTube *watch* syntax, not *embed* syntax; this likely renders broken if used as an iframe src. Worth treating as low-signal and probably deprecated in favour of `video-testimonial-if-available`.
- Full payload (incl. isArchived/isDraft flags) in `investigation-2-customer-stories-videos.json`.

---

## Investigation 3 — Which pages render the Glassdoor Reviews collection

17 pages contain the string `glassdoor`. Hit counts:

| hits | URL |
|---:|---|
| **183** | https://cloudemployee.io/for-developers |
| **183** | https://cloudemployee.io/reviews |
| 16 | https://cloudemployee.io/compare/toptal-vs-cloud-employee-freelance-marketplace-vs-dedicated-staff-augmentation |
| 12 | https://cloudemployee.io/staff-augmentation/cloud-employee-vs-in-house-total-cost-ownership |
| 12 | https://cloudemployee.io/staff-augmentation/what-is-staff-augmentation |
| 10 | https://cloudemployee.io/scaling-teams/cloud-employee-pricing-team-size-scenarios |
| 8 | https://cloudemployee.io/compare/dedicated-teams-vs-toptal |
| 8 | https://cloudemployee.io/scaling-teams/scaling-latam-developers-1-to-10-strategy |
| 8 | https://cloudemployee.io/staff-augmentation/best-staff-augmentation-companies-in-latin-america-2026-a-ranked-comparison |
| 4 | https://cloudemployee.io/compare/toptal-vs-upwork |
| 4 | https://cloudemployee.io/hiring-tips/developer-vetting-in-latam-live-pair-programming-coding-tests-and-quality-signals-that-matter |
| 4 | https://cloudemployee.io/ |
| 4 | https://cloudemployee.io/staff-augmentation/best-staff-augmentation-companies-2026 |
| 4 | https://cloudemployee.io/staff-augmentation/cloud-employee-pricing-checklist-before-hire |
| 4 | https://cloudemployee.io/staff-augmentation/using-latam-staff-augmentation-to-scale-early-stage-saas |
| 4 | https://cloudemployee.io/work-with-shawnee |
| 2 | https://cloudemployee.io/compare/switching-from-arc-dev-to-a-dedicated-development-team |

**Which page *renders* the collection?** Two pages:

1. **`/for-developers`** — 183 hits. Every hit is the asset `674f5d389a9a23077949ec4a_glassdoor-logo.avif` attached to review cards. Alt-text cycles through reviewer names (`Robert Lee`, `Patricia Rodriguez`, `James Garcia`, `Laura Martinez`, `John Doe`…) — the same set repeats, which implies this page renders the Glassdoor Reviews collection as a carousel/grid with duplication (likely a looping slider).

2. **`/reviews`** — 183 hits. Same pattern, but with some entries showing empty `alt: ""` (likely the slider clones Webflow generates for infinite scroll) followed by the same named reviewers. This is the canonical reviews landing page.

All other 15 pages are **referential** — they mention Glassdoor as:
- An external link to `glassdoor.com/Overview/...` or `glassdoor.com/Reviews/...`
- A verbatim review quote attributed to "Verified Glassdoor review of Cloud Employee"
- A rating call-out (e.g., "Our Glassdoor rating of 4.8/5 across 152 reviews")

These pages do **not** render the Glassdoor Reviews collection — they just cite it. Example (from `/compare/toptal-vs-cloud-employee-...`):

```
…his figure is covered in detail on our YouTube channel. Our Glassdoor rating of 4.8/5 across 152 reviews, with 99% of employees s…
…th and workload. Provides support. Great perks" - Verified Glassdoor review of Cloud Employee
```

**Takeaway for SCHEMA-1.** The Glassdoor Reviews collection is rendered on exactly two templates — `/for-developers` and `/reviews`. On SCAFFOLD, these become two routes consuming the same Sanity `glassdoorReview` document type. All other Glassdoor mentions are literal strings/links in page copy and should stay as rich-text content, not structured references.

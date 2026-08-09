# S2 - Internal link equity: Sanity link-rewrite plan (roadmap W1-05 + W1-06)

> AUTHORED, NOT APPLIED. This report and the script that writes it
> (`scripts/seo/rewrite-sanity-links.ts`) are complete and reviewable, but no
> production Sanity write has happened. Applying items 3 and 4 requires a local
> run with `SANITY_MIGRATION_WRITE_TOKEN` (gitignored, absent from the cloud
> session that authored this). S2 is not complete until that run lands.

Redirect table loaded from: **site/next.config.ts redirects() (assembled at runtime)** (693 rules).

Destinations are re-derived at run time by following the assembled redirect
table to its terminal hop, NOT from any static map or the analysis 166-list, so
S1's concurrent chain-collapse cannot make this script write a stale target.
Report generated at: run locally to stamp a time (Date.* is intentionally not called here).

## Item 4 - scripted link rewrite (W1-06)

Four link classes, three of them mechanically rewritten to the final URL, the
fourth surfaced for an editorial decision. Class counts below are the analysis
estimates (TECH-03, QW-04, QW-09); the "found" column is populated only when the
script runs against production with a token.

| Class | Rewrite rule | Analysis estimate | Found this run |
|---|---|---|---|
| Apex-host internal links | host `cloudemployee.io` -> `www`, then resolve path | ~434 | n/a (no token) |
| Retired calculator links | `/tools/price-comparison-calculator*` -> `/pricing` | ~49 | n/a (no token) |
| Other internal redirects | follow the table to the final destination | ~166 | n/a (no token) |
| Dead external links | reported with location for an editorial replace/remove in Studio | ~27 | n/a (needs --check-external) |

Also handled: an internal path that 308s **offsite** (e.g. `/live-job-role/*` ->
`talent.cloudemployee.io`) is rewritten straight to that host, skipping our hop.

### Resolver self-check (no Sanity access needed)

Each sample below is classified and resolved by the live loader, proving the
re-derivation logic end to end. `->` shows every redirect hop the script
collapses; it always writes the FINAL column.

| Input link | Class | Rewrite target | Hops followed |
|---|---|---|---|
| `https://cloudemployee.io/services/philippines-developers` | apex | `https://www.cloudemployee.io/services/philippines-developers` | (none) |
| `https://cloudemployee.io/compare/toptal-vs-upwork` | apex | `https://www.cloudemployee.io/compare/toptal-vs-upwork` | (none) |
| `/tools/price-comparison-calculator` | calculator | `/pricing` | /tools/price-comparison-calculator -> /pricing |
| `/uk/tools/price-comparison-calculator` | internal-ok | (no change) | (none) |
| `/compare/cloud-employee-vs-arc-dev` | redirect | `/alternatives` | /compare/cloud-employee-vs-arc-dev -> /compare -> /alternatives |
| `/customer-stories/salmon-software` | redirect | `/customer-story/salmon-software` | /customer-stories/salmon-software -> /customer-story/salmon-software |
| `/developers/react` | redirect | `/technology` | /developers/react -> /technology |
| `/start-hiring/get-started` | redirect | `/book-a-call` | /start-hiring/get-started -> /start-hiring/contact-info -> /book-a-call |
| `/services/philippines-developers` | internal-ok | (no change) | (none) |

### Definitive per-document findings

Not available in this credential-free run. Re-run `--dry-run` locally with
`SANITY_MIGRATION_WRITE_TOKEN` set to list every offending document and path.

## Item 3 - contextual internal links to starved pages (W1-05)

These are IN-CONTENT links (not nav / mega-menu). Adding a nav link does not
satisfy this item. Placement and anchor text are editorial, so this is a plan
for a human/Studio pass, not a mechanical rewrite - injecting a link into prose
blind would mangle sentences. The definitive one-in-content-link set lives in the
crawl CSV `Notice-indexable-Page_has_only_one_dofollow_incoming_internal_link.csv`
(not on this filesystem); the pages below are the analysis-named priorities.

### The 7 zero-inlink new posts (CONT-06)

| Starved page | Why it matters | Suggested in-content link sources |
|---|---|---|
| `/staff-augmentation/staff-augmentation-vs-outsourcing` | New cited.io piece, 0 in-content inlinks. | the staff-augmentation pillar (what-is-staff-augmentation...) and /nearshoring-offshoring/what-is-it-outsourcing-definition-models-when-to-use-it |
| `/staff-augmentation/latam-staff-augmentation-trends-2026` | 680 imp, 5 Copilot citations, 0 inlinks. | /services/latam-developers and the LATAM staff-augmentation ranked-list pages |
| `/staff-augmentation/staff-augmentation-fintech-security-compliance` | 61 Copilot citations, 0 inlinks - the most-cited of the starved set. | the staff-augmentation pillar and best-staff-augmentation-companies-2026 |
| `/staff-augmentation/staff-augmentation-myths-debunked` | 0 inlinks. | the staff-augmentation pillar and its sibling explainer posts |
| `/staff-augmentation/staff-augmentation-pricing-models-in-latam` | 526 imp, 0 inlinks. | /services/latam-developers, the costs post, and the staff-augmentation pillar |
| `/staff-augmentation/cloud-employee-pricing (post 1 of 2)` | Zero-inlink pricing post (confirm exact slug against the dataset). | /pricing and the staff-augmentation pillar |
| `/staff-augmentation/cloud-employee-pricing (post 2 of 2)` | Zero-inlink pricing post (confirm exact slug against the dataset). | /pricing and the staff-augmentation pillar |

### The impression-bearing one-in-content-link pages (QW-03 / AUTH-03)

| Starved page | Signal | Suggested in-content link sources |
|---|---|---|
| `/compare/toptal-vs-upwork` | 44,019 imp/90d, pos 7.0 - the biggest non-brand impression earner, 0-1 inlink. | ADDRESSED STRUCTURALLY by items 1+2 (now on /alternatives page 1 and linked by the related-comparisons module on sibling compare pages). Add a body link from the staff-augmentation pillar too. |
| `/scaling-teams/why-consider-alternatives-to-software-development-outsourcing (arc-dev alternatives guide)` | 5,286 imp, pos 8.4, 1 inlink. | /alternatives and the outsourcing definition/explainer posts |
| `/services/front-end-developers` | 3,665 imp, 1 inlink. | the front-end / javascript blog posts and /technology/react-developers |
| `/services/android-developers` | 3,067 imp, 1 inlink. | the mobile-hiring blog posts and /services (hub prose) |
| `/technology/laravel-developers` | 2,544 imp, 1 inlink. | /technology/php-developers and the PHP/Laravel blog posts |
| `/technology/php-developers` | 2,511 imp, 1 inlink. | /technology/laravel-developers and the PHP blog posts |
| `/services/cloud-engineers` | 2,435 imp, 1 inlink. | /services/devops-engineers and /technology/aws-developers |
| `/compare/cloud-employee-vs-andela` | 2,409 imp, pos 5.7, 1 inlink. | ADDRESSED STRUCTURALLY by items 1+2. Add a body link from the LATAM/Africa staff-augmentation posts. |
| `/nearshoring-offshoring/nearshore-vs-offshore-costs-2026-software-development-rates` | 27,802 imp, pos 7.2, ~4 inlinks - the top non-brand CLICK earner (24 clicks/90d). | the outsourcing/offshoring definition posts and /services/latam-developers, /services/philippines-developers |

Note the synergy: items 1 (all 27 compare cards on /alternatives page 1) and 2
(the related-comparisons module) already give the compare pages above their
lateral in-content links, so the remaining item-3 work is mostly the blog and
service/technology targets.

## How to apply (the exact local commands)

Prerequisite: S1 (PR #93) merged, so the assembled redirect table is complete,
and `SANITY_MIGRATION_WRITE_TOKEN` set in the gitignored root `.env`.

```sh
# 1. Review the definitive per-document plan (writes this report, no mutations):
npx tsx scripts/seo/rewrite-sanity-links.ts --dry-run --check-external

# 2. Apply the three internal rewrite classes (idempotent, logs every path):
npx tsx scripts/seo/rewrite-sanity-links.ts --apply

# 3. Item 3 - add the contextual links above by hand in Studio (editorial).

# 4. Guard against recurrence (expect exit 0):
npx tsx scripts/seo/rewrite-sanity-links.ts --lint
```

Dead external links (class 4) are listed for a replace-or-remove decision, which
is applied by hand in Studio - the script detects and locates them but never
rewrites an external link to a guessed target.


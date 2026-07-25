# SEO exports — drop the CSVs here

These files feed the launch parity gate (`npm run launch:capture-live`). Their job
is to answer one question: **which URLs does the outside world still point at?**

The parity corpus is otherwise built from the April crawl, Webflow's redirect
export, and the live sitemap. All three describe the site as it exists *today*.
None of them knows about a URL that was deleted in 2023 but still has a backlink
from a partner site, or that Google still has in its index. Those URLs are the
ones carrying accumulated ranking equity, and a cutover that 404s them loses it
silently.

Google and Ahrefs are the only sources that know about them. Webflow does not.

## Expected files

| File | Source | Why it matters |
|---|---|---|
| `gsc-pages.csv` | Search Console → Performance → Pages | Every URL that earned impressions or clicks in the last 16 months. The pages that are actually working. |
| `gsc-redirects.csv` | Search Console → Indexing → Pages → "Page with redirect" | Legacy URLs Google still tracks and follows. Prime redirect targets. |
| `gsc-404s.csv` | Search Console → Indexing → Pages → "Not found (404)" | URLs Google is still asking for. If any have links, they deserve a redirect. |
| `ahrefs-best-by-links.csv` | Ahrefs → Site Explorer → Pages → Best by links | URLs ranked by inbound links, INCLUDING dead ones. The single highest-value list for protecting rankings. |

Any subset is useful. Missing files are skipped, not an error.

## Notes

- Column layouts differ between Google and Ahrefs, and Google changes theirs
  periodically. The ingest sniffs for a column containing URLs rather than
  assuming a fixed schema, so an unexpected export format is tolerated.
- Google's UI exports cap at 1,000 rows per report. For a ~600-page site that is
  ample for the indexed set; the "not indexed" buckets can exceed it, which is
  another reason the Ahrefs list matters.
- These are URL lists, not analytics. No PII, safe to track in git.

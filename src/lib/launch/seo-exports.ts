// Ingest the Search Console and Ahrefs exports in data/seo-exports/.
//
// The parity corpus is otherwise assembled from the April crawl, Webflow's
// redirect export, and the live sitemap. Every one of those describes the site
// as it exists today. None of them knows about a URL that was deleted in 2023
// and still has a backlink from a partner site, or that Google still has in its
// index. Those URLs carry accumulated ranking equity, and a cutover that 404s
// them loses it silently, which is the exact failure this whole gate exists to
// prevent. Google and Ahrefs are the only sources that know about them.
//
// Deliberately format-agnostic. Google changes its CSV column names periodically
// and Ahrefs' layout differs entirely, so rather than bind to a schema (and
// break silently the next time either vendor renames a header) this scrapes URLs
// out of the raw text and filters by host. A column we did not expect costs us
// nothing; a column that quietly disappears would have cost us the whole file.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

export const SEO_EXPORTS_DIR = 'data/seo-exports'

const URL_RE = /https?:\/\/[^\s,"']+/g

export type SeoExportSummary = {
  file: string
  urlsFound: number
  onSite: number
}

function listCsvFiles(dir: string): string[] {
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return [] // No exports supplied. Not an error: the gate still runs without them.
  }

  const files: string[] = []
  for (const entry of entries) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) {
      files.push(...listCsvFiles(path))
    } else if (entry.toLowerCase().endsWith('.csv')) {
      files.push(path)
    }
  }
  return files
}

/**
 * Pull every path on the target site out of the SEO exports.
 *
 * `hosts` are matched with the `www.` prefix ignored, so an export that uses the
 * apex and one that uses www both resolve to the same site. Other subdomains are
 * excluded on purpose: `info.cloudemployee.io` (HubSpot landing pages) and
 * `talent.cloudemployee.io` (the jobs board) are separate properties that are not
 * moving to Vercel, so their URLs are not ours to serve and probing them would
 * manufacture divergences we cannot act on.
 */
export function collectSeoExportPaths(
  hosts: string[],
  dir = SEO_EXPORTS_DIR,
): { paths: Set<string>; summaries: SeoExportSummary[] } {
  const bare = (host: string) => host.replace(/^www\./, '').toLowerCase()
  const wanted = new Set(hosts.map(bare))

  const paths = new Set<string>()
  const summaries: SeoExportSummary[] = []

  for (const file of listCsvFiles(dir)) {
    const text = readFileSync(file, 'utf-8')
    const matches = text.match(URL_RE) ?? []
    let onSite = 0

    for (const raw of matches) {
      let url: URL
      try {
        // Trailing punctuation from CSV quoting would otherwise poison the path.
        url = new URL(raw.replace(/[),.;]+$/, ''))
      } catch {
        continue
      }
      if (!wanted.has(bare(url.host))) continue

      // Query strings and fragments are not distinct pages for our purposes: the
      // redirect table matches on path, so ?utm_source=... collapses to the same
      // check and would otherwise inflate the corpus by thousands of duplicates.
      const path = url.pathname.replace(/\/$/, '') || '/'
      paths.add(path)
      onSite++
    }

    summaries.push({ file, urlsFound: matches.length, onSite })
  }

  return { paths, summaries }
}

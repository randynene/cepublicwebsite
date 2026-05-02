// CONTENT-1D §1 — URL builder unit assertion (HARD GATE) +
// data-coverage report (INFO).
//
// Two-tier check:
//
// Tier 1 (HARD — halts phase): hardcoded known-good slugs (sourced
// directly from audit-output/ce-canonical-urls.json) round-trip through
// urlForDoc() and the result MUST be in the canonical set. This tests
// urlForDoc() semantics — does it match the live routing table for
// every in-scope type. Independent of Sanity data quality.
//
// Tier 2 (INFO — never halts): coverage report. For each in-scope
// type, query every Sanity doc and count how many produce a URL that
// hits the canonical set. URL drift surfaces here (e.g. Webflow
// review slugs are person-names but live URLs use company-slugs;
// drift docs get needsReview:true at scrape time per Step 2 risk
// register). Reported but not blocking — the scraper handles drift.
import * as fs from 'node:fs'
import * as path from 'node:path'

import { urlForDoc, inScopePathPrefixes } from '@/lib/content/url-builder'
import { sanityWriteClient } from '@/lib/content/sanity-write-client'

const REPO_ROOT = process.cwd()

interface CanonicalUrlsFile {
  canonicalUrls: Array<{ url: string; path: string; status: string | number }>
}

// Known-good live slugs per type, picked from
// audit-output/ce-canonical-urls.json. Each is a confirmed 200-status
// URL on cloudemployee.io. If any of these stops being canonical,
// halt — the routing table itself moved.
const KNOWN_GOOD: Record<string, string> = {
  technology: 'flutter-developers', //   /technology/flutter-developers
  service: 'mvp-development', //         /services/mvp-development
  customerStory: 'willo', //             /customer-story/willo
  teamMember: 'viktoria-mangarin', //    /team/viktoria-mangarin
  review: 'tidal', //                    /reviews/tidal  (note: live uses
  //                                       company-slugs even though
  //                                       Sanity review.slug.current
  //                                       holds person-name slugs)
  bookACall: 'seb', //                   /book-a-call/seb
}

async function main(): Promise<void> {
  console.log('=== url-builder canonical-set assertion ===\n')

  const file = path.join(REPO_ROOT, 'audit-output', 'ce-canonical-urls.json')
  const data = JSON.parse(fs.readFileSync(file, 'utf-8')) as CanonicalUrlsFile
  const canonicalUrlSet = new Set(data.canonicalUrls.map((u) => u.url.replace(/\/$/, '')))
  const canonicalPathSet = new Set(data.canonicalUrls.map((u) => u.path.replace(/\/$/, '')))
  console.log(`  Canonical set: ${canonicalUrlSet.size} URLs / ${canonicalPathSet.size} paths`)
  console.log(`  In-scope route prefixes: ${inScopePathPrefixes().join(', ')}\n`)

  function urlInCanonicalSet(url: string): boolean {
    const noSlash = url.replace(/\/$/, '')
    const pathOnly = new URL(url).pathname.replace(/\/$/, '')
    return canonicalUrlSet.has(noSlash) || canonicalPathSet.has(pathOnly)
  }

  // ---------- Tier 1 — HARD ----------
  const failures: string[] = []
  console.log('Tier 1 — known-good slug round-trip:')
  for (const [type, slug] of Object.entries(KNOWN_GOOD)) {
    const built = urlForDoc({ _type: type, slug: { current: slug } })
    const ok = urlInCanonicalSet(built)
    console.log(`  ${ok ? '✅' : '❌'} ${type.padEnd(16)} ${built}`)
    if (!ok) failures.push(`${type}: known-good slug "${slug}" → ${built} not in canonical set`)
  }
  let unsupportedRejected = false
  try {
    urlForDoc({ _type: 'bogusType', slug: { current: 'x' } })
  } catch {
    unsupportedRejected = true
  }
  if (unsupportedRejected) console.log('  ✅ urlForDoc throws on unsupported _type')
  else failures.push('urlForDoc did not throw on unsupported _type')

  let missingSlugRejected = false
  try {
    urlForDoc({ _type: 'technology', slug: { current: '' } })
  } catch {
    missingSlugRejected = true
  }
  if (missingSlugRejected) console.log('  ✅ urlForDoc throws on empty slug.current')
  else failures.push('urlForDoc did not throw on empty slug.current')

  console.log('')

  // ---------- Tier 2 — INFO ----------
  console.log('Tier 2 — Sanity-data coverage report (informational):')
  const types = ['technology', 'service', 'customerStory', 'teamMember', 'review', 'bookACall']
  type Drift = { docId: string; slug: string; url: string }
  const allDrift: Record<string, Drift[]> = {}
  for (const type of types) {
    const docs = await sanityWriteClient.fetch<
      Array<{ _id: string; _type: string; slug?: { current?: string } }>
    >(
      `*[_type == $type && !(_id match "smoke-test-*") && defined(slug.current)]{_id, _type, slug}`,
      { type },
    )
    let inSet = 0
    const drift: Drift[] = []
    for (const d of docs) {
      const slugCurrent = d.slug?.current
      if (typeof slugCurrent !== 'string' || slugCurrent.length === 0) continue
      const url = urlForDoc({ _type: type, slug: { current: slugCurrent } })
      if (urlInCanonicalSet(url)) {
        inSet++
      } else {
        drift.push({ docId: d._id, slug: slugCurrent, url })
      }
    }
    allDrift[type] = drift
    const total = docs.length
    const pct = total === 0 ? 0 : Math.round((inSet / total) * 100)
    console.log(`  ${type.padEnd(16)} ${inSet}/${total} (${pct}%) hit canonical set, ${drift.length} drift`)
  }
  console.log('')
  // Detail per drifting doc — these will get needsReview:true at scrape time.
  for (const [type, drift] of Object.entries(allDrift)) {
    if (drift.length === 0) continue
    console.log(`  ${type} drift detail:`)
    for (const d of drift.slice(0, 30)) {
      console.log(`    ${d.docId.padEnd(50)} slug="${d.slug}" → ${d.url}`)
    }
    if (drift.length > 30) console.log(`    … +${drift.length - 30} more`)
    console.log('')
  }

  if (failures.length > 0) {
    console.error('=== TIER 1 FAILED ===')
    for (const f of failures) console.error(`  • ${f}`)
    process.exit(1)
  }
  console.log('=== TIER 1 PASSED ===')
  console.log(
    'Tier 2 drift is INFO ONLY — drifting docs receive needsReview:true at scrape time per Step 2 risk register.',
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

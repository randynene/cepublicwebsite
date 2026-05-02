// CONTENT-1D Diagnostic 5 — customerStory/builder orphan check (READ-ONLY).
//
// Three sub-checks for the lowest-confidence deletion candidate
// customerStory-6762ed76b66ee8b78291fa47 (slug: "builder"):
//   (a) Inbound refs from any doc.
//   (b) Site singletons / globals that reference it (incl. boolean
//       feature-flag style references via featureInHomeHeader etc.).
//   (c) audit-output presence — was Webflow's customerStory item with
//       slug "builder" populated with anything beyond companyName?
import * as fs from 'node:fs'
import * as path from 'node:path'

import { sanityWriteClient } from '@/lib/content/sanity-write-client'

const REPO_ROOT = process.cwd()
const TARGET_ID = 'customerStory-6762ed76b66ee8b78291fa47'

// All 31 singletons + 3 globals from studio/schemas/{singletons,globals}/index.ts
const SINGLETON_TYPES = [
  'blogHub', 'staffAugmentationHub', 'nearshoringOffshoringHub', 'scalingTeamsHub',
  'hiringTipsHub', 'managingEngineersHub', 'aiInSoftwareDevelopmentHub',
  'videosHub', 'toolsHub', 'downloadsHub', 'eventsHub',
  'servicesHub', 'technologyHub', 'customerStoriesHub', 'reviewsHub', 'compareHub',
  'homePage', 'aboutUsPage', 'howItWorksPage', 'contactPage', 'forDevelopersPage',
  'retentionPage', 'sourcingPage', 'embeddingPage', 'scaleThisWeekPage',
  'workWithShawneePage', 'startHiringPage', 'notFoundPage', 'privacyPolicyPage',
  'hiringCostCalculatorPage', 'priceComparisonCalculatorPage',
]
const GLOBAL_TYPES = ['siteSettings', 'navigation', 'footer']

async function main(): Promise<void> {
  console.log('\n=== Diagnostic 5 — customerStory/builder orphan check ===\n')

  // The doc itself first.
  const doc = await sanityWriteClient.fetch<Record<string, unknown> | null>(
    `*[_id == $id][0]`,
    { id: TARGET_ID },
  )
  console.log('## (0) The doc itself\n')
  if (!doc) {
    console.log(`  ❌ ${TARGET_ID} not found in Sanity — already gone?`)
    return
  }
  console.log(`  _id:                            ${doc._id}`)
  console.log(`  _type:                          ${doc._type}`)
  console.log(`  customerStoryTitle:             ${JSON.stringify(doc.customerStoryTitle)}`)
  console.log(`  companyName:                    ${JSON.stringify(doc.companyName)}`)
  console.log(`  slug:                           ${JSON.stringify((doc.slug as { current?: string } | undefined)?.current)}`)
  console.log(`  featureInHomeHeader:            ${doc.featureInHomeHeader}`)
  console.log(`  featureInFeaturedCustomers:     ${doc.featureInFeaturedCustomers}`)
  console.log(`  featuredOnCustomerStoriesPage:  ${doc.featuredOnCustomerStoriesPage}`)
  // Count populated portable-text / image fields
  const popKeys: string[] = []
  for (const [k, v] of Object.entries(doc)) {
    if (k.startsWith('_') || k === 'customerStoryTitle' || k === 'companyName' || k === 'slug' || k.startsWith('feature')) continue
    if (v === null || v === undefined) continue
    if (Array.isArray(v) && v.length === 0) continue
    if (typeof v === 'object' && Object.keys(v as object).length === 0) continue
    popKeys.push(k)
  }
  console.log(`  other populated fields:         ${popKeys.length === 0 ? '(none)' : popKeys.join(', ')}`)
  console.log('')

  // (a) Inbound refs (from any doc).
  console.log('## (a) Inbound references\n')
  const refs = await sanityWriteClient.fetch<Array<{ _id: string; _type: string }>>(
    `*[references($id)]{_id, _type}`,
    { id: TARGET_ID },
  )
  if (refs.length === 0) {
    console.log('  ✅ No inbound references from any document in the dataset.\n')
  } else {
    for (const r of refs) {
      console.log(`  • ${r._id} (${r._type})`)
    }
    console.log('')
  }

  // (b) Singleton / global references.
  console.log('## (b) Singleton + global references\n')
  const allConfigTypes = [...SINGLETON_TYPES, ...GLOBAL_TYPES]
  const configRefs = await sanityWriteClient.fetch<Array<{ _id: string; _type: string }>>(
    `*[_type in $types && references($id)]{_id, _type}`,
    { types: allConfigTypes, id: TARGET_ID },
  )
  if (configRefs.length === 0) {
    console.log('  ✅ No singleton or global references this doc.')
  } else {
    for (const r of configRefs) {
      console.log(`  • ${r._id} (${r._type})`)
    }
  }
  // The boolean feature flags on the doc itself act like template-side
  // references — surface their state.
  const flags = ['featureInHomeHeader', 'featureInFeaturedCustomers', 'featuredOnCustomerStoriesPage']
  const flagsTrue = flags.filter((f) => doc[f] === true)
  if (flagsTrue.length > 0) {
    console.log(`  ⚠ feature flags TRUE on the doc itself: ${flagsTrue.join(', ')}`)
    console.log('     (template logic likely surfaces this doc by-flag — review template code before deletion)')
  } else {
    console.log('  ✅ No feature flags TRUE on the doc itself.')
  }
  console.log('')

  // (c) audit-output presence.
  console.log('## (c) audit-output presence\n')

  // ce-canonical-urls.json — direct path lookup
  type CanonicalFile = { canonicalUrls: Array<{ url: string; path: string; status: string | number }> }
  const canonical = JSON.parse(
    fs.readFileSync(path.join(REPO_ROOT, 'audit-output', 'ce-canonical-urls.json'), 'utf-8'),
  ) as CanonicalFile
  const builderCanonical = canonical.canonicalUrls.filter((u) =>
    u.path.includes('builder') || u.url.includes('builder'),
  )
  console.log(`  ce-canonical-urls.json: ${builderCanonical.length} entries containing "builder"`)
  for (const e of builderCanonical) {
    console.log(`    ${e.status}  ${e.path}`)
  }

  // ce-inventory.json — Webflow CMS items
  const inventoryFile = path.join(REPO_ROOT, 'audit-output', 'ce-inventory.json')
  if (fs.existsSync(inventoryFile)) {
    const text = fs.readFileSync(inventoryFile, 'utf-8')
    // Search for "builder" matches in CMS items context
    const matches = (text.match(/"slug"\s*:\s*"builder"/g) ?? []).length
    const nameMatches = (text.match(/"name"\s*:\s*"builder"/gi) ?? []).length
    console.log(`  ce-inventory.json: slug:"builder" occurrences = ${matches}, name:"builder" = ${nameMatches}`)
    if (matches > 0 || nameMatches > 0) {
      // Try to extract the surrounding context for the first hit
      const slugIdx = text.indexOf('"slug": "builder"')
      const idx = slugIdx >= 0 ? slugIdx : text.toLowerCase().indexOf('"name": "builder"')
      if (idx > 0) {
        const start = Math.max(0, idx - 400)
        const end = Math.min(text.length, idx + 600)
        console.log(`    Context (excerpt around first match):`)
        console.log(`    ${text.slice(start, end).replace(/\s+/g, ' ').slice(0, 800)}`)
      }
    }
  } else {
    console.log('  ce-inventory.json: file not found')
  }

  // pages/ directory — content extraction
  const pagesDir = path.join(REPO_ROOT, 'audit-output', 'pages')
  if (fs.existsSync(pagesDir)) {
    const all = fs.readdirSync(pagesDir)
    const builderPages = all.filter((d) => d.includes('builder'))
    console.log(`  audit-output/pages/: ${builderPages.length} subdirs matching "builder"`)
    for (const p of builderPages) console.log(`    ${p}`)
  } else {
    console.log('  audit-output/pages/: not found')
  }

  // ce-content-extraction-summary.json
  const extractFile = path.join(REPO_ROOT, 'audit-output', 'ce-content-extraction-summary.json')
  if (fs.existsSync(extractFile)) {
    const text = fs.readFileSync(extractFile, 'utf-8')
    const m = (text.match(/builder/gi) ?? []).length
    console.log(`  ce-content-extraction-summary.json: "builder" occurrences = ${m}`)
  }

  console.log('')
  console.log('## Summary')
  console.log('')
  console.log('Inbound refs (a):       ' + (refs.length === 0 ? '0 — safe by reference graph' : `${refs.length} — review`))
  console.log('Singleton/global (b):   ' + (configRefs.length === 0 && flagsTrue.length === 0 ? '0 — safe by config graph' : 'see above'))
  console.log('audit-output (c):       ' + (builderCanonical.length === 0 ? 'no live URL recorded — confirms drift' : 'audit found a URL — investigate'))
  console.log('')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

// MYGRATR-STATIC-2 Step 5 — phase-close verification gate.
//
// Asserts the STATIC-2 reseeded state in production Sanity meets the brief
// §3 Step 4 gate + Step 5 cross-cutting check:
//   1. navigation new fields populated (services + how-it-works + resources)
//   2. footer new fields populated (topCtaBlock + sections + talent + subscribe + bottomBar)
//   3. All 25 references resolve (no broken refs)
//   4. Legacy fields still populated (regression safety for STATIC-1 reads)
//   5. Tagline populated on 19/20 matched service+technology docs
//   6. /alternatives URL used not /compare (DELTA-6)
//
// Exit 0 on all-pass, exit 1 on any failure.
// Run: `npm run static:verify-2`

import 'dotenv/config'

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.SANITY_PROJECT_ID ?? 'lzbhll1u',
  dataset: process.env.SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
})

interface Check {
  name: string
  pass: boolean
  detail: string
}

async function main(): Promise<void> {
  console.log('STATIC-2 Step 5: phase-close verification gate\n')
  const checks: Check[] = []

  // ── (1) navigation new fields populated
  const nav = await sanity.fetch<{
    primaryLinks?: unknown[]
    servicesMegaMenu?: unknown
    howItWorksMegaMenu?: { cards?: unknown[]; bottomPanel?: unknown }
    resourcesMegaMenu?: { leftColumn?: unknown; middleColumn?: { featuredPosts?: unknown[] }; rightColumn?: { featuredStories?: unknown[] } }
    resolvedRefs?: Array<string | null>
    resolvedFeaturedPosts?: Array<string | null>
    resolvedFeaturedStories?: Array<string | null>
  } | null>(
    `*[_id == "navigation"][0]{
      primaryLinks,
      servicesMegaMenu,
      howItWorksMegaMenu,
      resourcesMegaMenu,
      "resolvedRefs":
        servicesMegaMenu.leftColumn.highlightedItems[]->_id
        + servicesMegaMenu.leftColumn.items[]->_id
        + servicesMegaMenu.rightColumnTop.items[]->_id
        + servicesMegaMenu.rightColumnBottom.sections[].items[]->_id,
      "resolvedFeaturedPosts": resourcesMegaMenu.middleColumn.featuredPosts[]->_id,
      "resolvedFeaturedStories": resourcesMegaMenu.rightColumn.featuredStories[]->_id
    }`,
  )
  checks.push({
    name: 'navigation new fields populated',
    pass: !!nav?.servicesMegaMenu && !!nav?.howItWorksMegaMenu && !!nav?.resourcesMegaMenu,
    detail: `services=${!!nav?.servicesMegaMenu} hiw=${!!nav?.howItWorksMegaMenu} resources=${!!nav?.resourcesMegaMenu}`,
  })

  // ── (2) footer new fields populated + legacy retained
  const footer = await sanity.fetch<{
    topCtaBlock?: unknown
    sections?: unknown[]
    talentLocations?: unknown
    subscribe?: unknown
    bottomBar?: unknown
    columns?: unknown[]
    legalLinks?: unknown[]
    newsletterFormId?: string
    copyrightText?: string
  } | null>(
    `*[_id == "footer"][0]{
      topCtaBlock,
      sections,
      talentLocations,
      subscribe,
      bottomBar,
      columns,
      legalLinks,
      newsletterFormId,
      copyrightText
    }`,
  )
  checks.push({
    name: 'footer new fields populated',
    pass:
      !!footer?.topCtaBlock &&
      Array.isArray(footer?.sections) &&
      footer.sections.length > 0 &&
      !!footer?.talentLocations &&
      !!footer?.subscribe &&
      !!footer?.bottomBar,
    detail: `topCta=${!!footer?.topCtaBlock} sections=${footer?.sections?.length ?? 0} talent=${!!footer?.talentLocations} subscribe=${!!footer?.subscribe} bottomBar=${!!footer?.bottomBar}`,
  })

  // ── (3) references all resolve
  const allRefs = [
    ...(nav?.resolvedRefs ?? []),
    ...(nav?.resolvedFeaturedPosts ?? []),
    ...(nav?.resolvedFeaturedStories ?? []),
  ]
  const broken = allRefs.filter((r) => r === null || r === undefined).length
  checks.push({
    name: 'all references resolve (25 expected, 0 broken)',
    pass: broken === 0,
    detail: `resolved=${allRefs.length - broken}/${allRefs.length}, broken=${broken}`,
  })

  // ── (4) legacy fields populated (STATIC-1 render regression safety)
  checks.push({
    name: 'footer legacy fields preserved',
    pass:
      Array.isArray(footer?.columns) &&
      footer.columns.length > 0 &&
      Array.isArray(footer?.legalLinks) &&
      footer.legalLinks.length > 0 &&
      !!footer?.newsletterFormId &&
      !!footer?.copyrightText,
    detail: `columns=${footer?.columns?.length ?? 0} legalLinks=${footer?.legalLinks?.length ?? 0} newsletterFormId=${!!footer?.newsletterFormId} copyrightText=${!!footer?.copyrightText}`,
  })

  // ── (5) taglines populated on service + technology docs
  const taglineCount = await sanity.fetch<number>(
    `count(*[_type in ["service", "technology"] && defined(tagline) && tagline != ""])`,
  )
  checks.push({
    name: 'taglines populated on matched docs (≥19 expected)',
    pass: taglineCount >= 19,
    detail: `${taglineCount} docs have populated tagline`,
  })

  // ── (6) /alternatives URL DELTA-6
  const altLinks = await sanity.fetch<Array<{ url: string }>>(
    `*[_id == "footer"][0].sections[].columns[].links[label match "CE vs*"]{ url }`,
  )
  const compareLinks = await sanity.fetch<Array<{ url: string }>>(
    `*[_id == "footer"][0].sections[].columns[].links[url match "*compare*"]{ url }`,
  )
  checks.push({
    name: 'footer uses /alternatives not /compare (DELTA-6)',
    pass: (altLinks ?? []).some((l) => l.url.includes('/alternatives')) && (compareLinks ?? []).length === 0,
    detail: `alt=${(altLinks ?? []).map((l) => l.url).join(', ')} compare=${(compareLinks ?? []).map((l) => l.url).join(', ') || '(none)'}`,
  })

  // ── Report
  const passing = checks.filter((c) => c.pass).length
  const total = checks.length
  console.log(`Results: ${passing}/${total} checks passing\n`)
  for (const c of checks) {
    const mark = c.pass ? '✅ PASS' : '❌ FAIL'
    console.log(`  ${mark} — ${c.name}`)
    console.log(`           ${c.detail}`)
  }
  if (passing !== total) {
    console.error(`\nverify-static-2: GATE FAILED (${total - passing} check(s) failed)`)
    process.exit(1)
  }
  console.log('\nverify-static-2: all gates PASS — STATIC-2 ready for phase close.')
}

main().catch((err) => {
  console.error('\nverify-static-2: FAILED', err)
  process.exit(1)
})

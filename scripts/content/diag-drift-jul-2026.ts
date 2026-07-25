// Phase 0.1 diagnostic — content drift since the April 2026 audit.
//
// Read-only. Reports what changed in Webflow after CONTENT-1 migrated it, so we
// know what a cutover today would get wrong. The analysis itself lives in
// src/lib/content/drift.ts and is shared with retire-orphaned-docs.ts, so the
// report and the action can never disagree about what an orphan is.
//
// Run: npm run content:diag-drift
import { ensureSanity, ensureWebflow } from '@/lib/env'
import { analyseAllDrift, type Drift } from '@/lib/content/drift'

ensureSanity()
ensureWebflow()

async function main(): Promise<void> {
  console.log('Content drift: Webflow (live) vs Sanity (production). Keyed by slug.\n')

  const drifts = await analyseAllDrift()

  console.log('Type                 Webflow  Sanity  Missing  Orphan  Churn  Stale')
  console.log('--------------------------------------------------------------------')
  for (const d of drifts) {
    console.log(
      `${d.source.sanityType.padEnd(20)} ${String(d.webflowCount).padStart(7)} ${String(d.sanityCount).padStart(7)} ` +
        `${String(d.missing.length).padStart(8)} ${String(d.orphan.length).padStart(7)} ` +
        `${String(d.idChurn.length).padStart(6)} ${String(d.stale.length).padStart(6)}`,
    )
  }

  for (const d of drifts) {
    if (!d.missing.length && !d.orphan.length && !d.idChurn.length && !d.stale.length) continue
    console.log(`\n=== ${d.source.label} (${d.source.sanityType}) ===`)
    for (const m of d.missing) console.log(`  MISSING   /${m.slug}\n            "${m.title}"`)
    for (const o of d.orphan) {
      console.log(`  ORPHAN    /${o.slug}  (${o.id})${o.alreadyRetired ? '  [already retired]' : ''}`)
    }
    for (const c of d.idChurn) {
      console.log(`  ID_CHURN  /${c.slug}\n            sanity=${c.sanityId}\n            webflow=${c.expectedId}`)
    }
    for (const s of d.stale) {
      console.log(`  STALE     /${s.slug}  webflow=${s.webflow.slice(0, 10)} sanity=${s.sanity.slice(0, 10)}`)
    }
  }

  const total = (pick: (d: Drift) => unknown[]) => drifts.reduce((n, d) => n + pick(d).length, 0)
  const unretired = drifts.reduce((n, d) => n + d.orphan.filter((o) => !o.alreadyRetired).length, 0)

  console.log(
    `\nTotals: ${total((d) => d.missing)} missing, ${total((d) => d.orphan)} orphan ` +
      `(${unretired} not yet retired), ${total((d) => d.idChurn)} id-churn, ${total((d) => d.stale)} stale.`,
  )
  console.log('\nMISSING  → migrate.')
  console.log('ORPHAN   → npm run content:retire-orphans (sets retired: true; reversible).')
  console.log('ID_CHURN → do NOT re-run the affected migrator: it keys _id on the Webflow')
  console.log('           item ID, which has changed, so it would duplicate rather than update.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

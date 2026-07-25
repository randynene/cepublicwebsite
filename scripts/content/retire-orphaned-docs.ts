// Phase 0.1 — retire the documents Webflow no longer serves.
//
// CONTENT-1 migrated a 2026-04 snapshot. Since then items were deleted or
// unpublished in Webflow; the live site now 301s their URLs to the parent hub
// (or 404s them). Sanity still holds the documents, so without this the new site
// would resurrect pages the customer deliberately took down, and advertise them
// in the sitemap.
//
// Sets `retired: true`. It does NOT delete: an upstream deletion could have been
// a mistake, and Seb can reverse any of these with one toggle in Studio. Every
// routing, listing and sitemap query filters on NOT_RETIRED
// (site/src/lib/sanity/queries/_filters.ts), so a retired document simply stops
// existing as far as the site is concerned. The legacy 301 keeps serving the URL.
//
// Dry-run by default. Pass --apply to write.
//
//   npm run content:retire-orphans            # show what would change
//   npm run content:retire-orphans -- --apply # write it
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

import { ensureSanity, ensureWebflow } from '@/lib/env'
import { analyseAllDrift } from '@/lib/content/drift'
import { recordMigration } from '@/lib/content/migration-tracker'
import { sanityWriteClient } from '@/lib/content/sanity-write-client'

ensureSanity()
ensureWebflow()

const APPLY = process.argv.includes('--apply')

// Reversal ledger. Setting `retired: true` is undone by unsetting the field, so
// this list is the whole backup we need: it names exactly which documents were
// touched, and nothing else about them changed.
const LEDGER_PATH = 'audit-output/phase-0/retired-docs.json'

async function main(): Promise<void> {
  const drifts = await analyseAllDrift()

  const toRetire = drifts.flatMap((d) =>
    d.orphan
      .filter((o) => !o.alreadyRetired)
      .map((o) => ({ type: d.source.sanityType, id: o.id, slug: o.slug })),
  )
  const alreadyRetired = drifts.reduce(
    (n, d) => n + d.orphan.filter((o) => o.alreadyRetired).length,
    0,
  )

  if (toRetire.length === 0) {
    console.log(`Nothing to retire. (${alreadyRetired} document(s) already retired.)`)
    return
  }

  console.log(
    `${toRetire.length} document(s) are in Sanity but no longer live in Webflow` +
      `${alreadyRetired > 0 ? `, and ${alreadyRetired} already retired` : ''}:\n`,
  )
  for (const doc of toRetire) {
    console.log(`  ${doc.type.padEnd(15)} /${doc.slug}`)
  }

  if (!APPLY) {
    console.log('\nDry run. Nothing written. Re-run with --apply to set retired: true.')
    return
  }

  mkdirSync(dirname(LEDGER_PATH), { recursive: true })
  writeFileSync(
    LEDGER_PATH,
    JSON.stringify(
      {
        retiredAt: new Date().toISOString(),
        reason: 'Deleted or unpublished in Webflow after the CONTENT-1 migration; live 301s or 404s these URLs.',
        undo: 'For each id: sanityWriteClient.patch(id).unset([\'retired\']).commit()',
        docs: toRetire,
      },
      null,
      2,
    ),
  )

  // One transaction: either every orphan is retired or none is. A partial retire
  // would leave the sitemap and the hub grids disagreeing about which pages exist.
  const tx = sanityWriteClient.transaction()
  for (const doc of toRetire) {
    tx.patch(doc.id, (p) => p.set({ retired: true }))
  }
  await tx.commit()

  await recordMigration({
    collectionSlug: 'retire-orphaned-docs',
    sourceItemCount: toRetire.length,
    migratedItemCount: toRetire.length,
    status: 'complete',
    errorLog: [],
  })

  console.log(`\nRetired ${toRetire.length} document(s). Ledger: ${LEDGER_PATH}`)
  console.log('Reversible in Studio via the Retired toggle, per document.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

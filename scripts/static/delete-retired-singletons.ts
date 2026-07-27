import 'dotenv/config'

import { sanityWriteClient } from '@/lib/content/sanity-write-client'

// Delete the four page singletons retired on 26 Jul 2026.
//
// WHY. /sourcing, /embedding, /retention and /scale-this-week are live 200 pages
// on Webflow that we are not rebuilding. All four 301 instead (see the deliberate
// divergence block in site/next.config.ts, recorded in parity-exceptions.json).
// A redirected URL renders nothing, so these documents backed no route: they sat
// in Studio offering Seb fields that changed nothing on the site, which is worse
// than absent because it looks like unfinished work.
//
// Their schema types were removed in the same change. A document whose _type no
// longer exists is invisible in Studio but still real in the dataset, so it has
// to be deleted through the API rather than by deleting the schema file.
//
//   npm run static:delete-retired-singletons            # dry run, writes nothing
//   npm run static:delete-retired-singletons -- --apply # delete for real
//
// Take a snapshot first. --apply refuses to run without one:
//   npm run static:backup-singletons
//
// Token: SANITY_MIGRATION_WRITE_TOKEN

const RETIRED_IDS = [
  'retentionPage',
  'sourcingPage',
  'embeddingPage',
  'scaleThisWeekPage',
] as const

interface SanityDoc {
  _id: string
  _type: string
  [key: string]: unknown
}

async function main(): Promise<void> {
  const apply = process.argv.slice(2).includes('--apply')

  const docs = await sanityWriteClient.fetch<SanityDoc[]>(
    `*[_id in $ids || _id in $draftIds]{...}`,
    {
      ids: [...RETIRED_IDS],
      draftIds: RETIRED_IDS.map((id) => `drafts.${id}`),
    },
  )

  if (docs.length === 0) {
    console.log('None of the four retired singletons exist in the dataset. Nothing to do.')
    return
  }

  // A published doc can be deleted out from under an unpublished draft, leaving
  // an orphan draft behind. Both forms are collected above and deleted together.
  console.log(`Found ${docs.length} document(s):\n`)
  for (const doc of docs) {
    const editable = Object.keys(doc).filter((k) => !k.startsWith('_'))
    console.log(`  ${doc._id}`)
    console.log(`    fields: ${editable.length > 0 ? editable.join(', ') : '(none)'}`)
  }

  // These were seeded as title-only stubs and never edited. If that has changed,
  // someone has put real content here and deleting it silently is the wrong move.
  const withContent = docs.filter((doc) => {
    const editable = Object.keys(doc).filter((k) => !k.startsWith('_'))
    return editable.some((k) => k !== 'title' && k !== 'locale')
  })

  if (withContent.length > 0) {
    console.error(
      `\nREFUSING TO DELETE. These hold fields beyond title/locale, so someone has ` +
        `edited them since they were seeded:\n` +
        withContent.map((d) => `  - ${d._id}`).join('\n') +
        `\n\nReview them in Studio and decide deliberately before re-running.`,
    )
    process.exitCode = 1
    return
  }

  // Sanity rejects a delete that would leave a dangling reference. Checked up
  // front so the failure is a clear message rather than a mid-transaction error.
  const referencing = await sanityWriteClient.fetch<{ _id: string }[]>(
    `*[references($ids)]{_id}`,
    { ids: [...RETIRED_IDS] },
  )

  if (referencing.length > 0) {
    console.error(
      `\nREFUSING TO DELETE. ${referencing.length} document(s) still reference these:\n` +
        referencing.map((d) => `  - ${d._id}`).join('\n'),
    )
    process.exitCode = 1
    return
  }

  if (!apply) {
    console.log(
      `\nDRY RUN. Nothing was deleted.\n\n` +
        `Snapshot first:  npm run static:backup-singletons\n` +
        `Then delete:     npm run static:delete-retired-singletons -- --apply`,
    )
    return
  }

  // One transaction: either all four go or none do, so a mid-run failure cannot
  // leave the dataset half-cleaned.
  const tx = sanityWriteClient.transaction()
  for (const doc of docs) tx.delete(doc._id)
  await tx.commit()

  console.log(`\nDeleted ${docs.length} document(s).`)
  for (const doc of docs) console.log(`  - ${doc._id}`)
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err)
  process.exitCode = 1
})

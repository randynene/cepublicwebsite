// CONTENT-1D Op 3 — bookACall stale needsReview unset (6 docs).
//
// Brief deviation DEV-5 (Jake authorisation 2026-05-02):
// Clears the false-positive `needsReview: true` flag set by the buggy
// initial migrate-meta-book-a-call run. The bug: shouldFlagForReview()
// originally treated any normaliser warning as a flag-for-review
// trigger, including descriptionWarnings on a never-touch description
// policy. All 6 bookACall docs picked up a false `true` flag.
//
// Two-factor guard before unset (rules out accidental future-flag
// clearing):
//   1. needsReview === true (flag must currently be the buggy artefact)
//   2. metaTitleSource.scrapedAt startsWith '2026-05-02' (rules out
//      that the flag was set by a real review pass after the
//      corrected runner re-ran)
//
// If anyone re-runs the migrator after 2026-05-02 and a doc gets a new
// scrapedAt prefix, this guard refuses to clear the flag — the
// protection is structural.

import { sanityWriteClient } from '@/lib/content/sanity-write-client'
import { recordMigration } from '@/lib/content/migration-tracker'

const STALE_TARGETS = [
  'bookACall-68cc216479deb50634b0b643', // Seb
  'bookACall-68d10cd781fd6b44c8caac3a', // Shawnee
  'bookACall-68d10f1fc4318da4b305736d', // Brooke
  'bookACall-68d110720afdfa5ff8cce1b1', // AJ
  'bookACall-68d1112b65230295ab2126e8', // Stephanie
  'bookACall-68d6a93806b49024c065063b', // Anto
] as const

interface UnsetRecord {
  id: string
  scrapedAt: string
}

async function main(): Promise<void> {
  console.log('=== Op 3 — bookACall stale needsReview unset ===\n')

  const errors: string[] = []
  const unset: UnsetRecord[] = []

  for (const id of STALE_TARGETS) {
    try {
      const doc = await sanityWriteClient.getDocument(id)
      if (!doc) throw new Error('not found')
      if (doc._type !== 'bookACall') {
        throw new Error(`_type mismatch: expected bookACall, got ${doc._type}`)
      }

      const docRec = doc as Record<string, unknown>

      // Guard 1: needsReview === true.
      if (docRec.needsReview !== true) {
        throw new Error(
          `needsReview=${String(docRec.needsReview)}, expected true — flag may already be cleared, or never set. Halt.`,
        )
      }

      // Guard 2: metaTitleSource.scrapedAt starts with '2026-05-02'.
      const mts = docRec.metaTitleSource as { scrapedAt?: string } | undefined
      const scrapedAt = mts?.scrapedAt
      if (typeof scrapedAt !== 'string' || !scrapedAt.startsWith('2026-05-02')) {
        throw new Error(
          `metaTitleSource.scrapedAt=${String(scrapedAt)}, expected 2026-05-02 prefix — flag may have been set by a later legitimate review pass. Halt.`,
        )
      }

      // Both guards passed — surgical unset.
      await sanityWriteClient.patch(id).unset(['needsReview']).commit()
      unset.push({ id, scrapedAt })
      console.log(`  ✅ ${id}: needsReview=true → unset (scrapedAt=${scrapedAt})`)
    } catch (e) {
      const msg = `${id}: ${(e as Error).message}`
      errors.push(msg)
      console.error(`  ❌ ${msg}`)
      // Halt at first guard failure.
      break
    }
  }

  // Audit-trail row.
  await recordMigration({
    collectionSlug: 'bookacall-stale-needsreview-unset',
    sourceItemCount: STALE_TARGETS.length,
    migratedItemCount: unset.length,
    status: errors.length === 0 ? 'complete' : 'failed',
    errorLog: [
      'CONTENT-1D Brief Deviation DEV-5 (authorised 2026-05-02): needsReview monotonic-flag rule explicitly overridden for 6 bookACall _ids as a one-off correction of the buggy initial shouldFlagForReview pass.',
      'Two-factor guard applied: needsReview===true AND metaTitleSource.scrapedAt prefix === "2026-05-02". Future re-runs of the migrator move the scrapedAt forward and structurally block this clearance from firing on any unrelated future flag.',
      ...unset.map((u) => `${u.id}: needsReview=true → unset (scrapedAt=${u.scrapedAt})`),
      ...errors,
    ],
  })

  console.log(`\n[bookacall-stale-needsreview-unset] cleared=${unset.length}/${STALE_TARGETS.length}, errors=${errors.length}`)
  if (errors.length > 0) process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

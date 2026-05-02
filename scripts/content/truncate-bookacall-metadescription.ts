// CONTENT-1D Op 2 — bookACall metaDescription truncation (6 docs).
//
// Brief deviation DEV-4 (Jake authorisation 2026-05-02):
// 6 bookACall docs hold metaDescription values that exceed the schema's
// 160-char limit. CONTENT-1B copied Webflow's `title` field
// (mislabelled — actually description copy) and the Webflow values run
// 184–192 chars. The brief specified bookACall.metaDescription is
// "never-touch" in CONTENT-1D, but the existing data violates the
// schema bound. This script applies a one-off length correction.
//
// Per-doc guard sequence (no patch unless every assertion passes):
//   1. _type === 'bookACall'
//   2. metaDescription.length === expectedLength (D3 snapshot — protects
//      against patching a doc whose state has changed since D3 ran)
//   3. truncateAtWord(metaDescription, 160) length ∈ [140, 160]
//
// The patch is .set({metaDescription: truncated}) only — does NOT touch
// metaTitle, metaTitleSource, metaDescriptionSource, needsReview, or
// any other field.

import { sanityWriteClient } from '@/lib/content/sanity-write-client'
import { recordMigration } from '@/lib/content/migration-tracker'
import { truncateAtWord } from '@/lib/content/meta-normaliser'

interface TruncationTarget {
  id: string
  expectedLength: number
}

const TRUNCATION_TARGETS: TruncationTarget[] = [
  { id: 'bookACall-68cc216479deb50634b0b643', expectedLength: 184 }, // Seb
  { id: 'bookACall-68d10cd781fd6b44c8caac3a', expectedLength: 192 }, // Shawnee
  { id: 'bookACall-68d10f1fc4318da4b305736d', expectedLength: 191 }, // Brooke
  { id: 'bookACall-68d110720afdfa5ff8cce1b1', expectedLength: 186 }, // AJ
  { id: 'bookACall-68d1112b65230295ab2126e8', expectedLength: 190 }, // Stephanie
  { id: 'bookACall-68d6a93806b49024c065063b', expectedLength: 188 }, // Anto
]

interface PatchedRecord {
  id: string
  beforeLength: number
  afterLength: number
}

async function main(): Promise<void> {
  console.log('=== Op 2 — bookACall metaDescription truncation ===\n')

  const errors: string[] = []
  const patched: PatchedRecord[] = []

  for (const t of TRUNCATION_TARGETS) {
    try {
      // Guard 1: _type validation.
      const doc = await sanityWriteClient.getDocument(t.id)
      if (!doc) {
        throw new Error('not found')
      }
      if (doc._type !== 'bookACall') {
        throw new Error(`_type mismatch: expected bookACall, got ${doc._type}`)
      }

      // Guard 2: metaDescription is a string with exactly the snapshotted length.
      const current = (doc as Record<string, unknown>).metaDescription
      if (typeof current !== 'string') {
        throw new Error(
          `metaDescription is not a string (got ${typeof current})`,
        )
      }
      if (current.length !== t.expectedLength) {
        throw new Error(
          `metaDescription length=${current.length}, expected ${t.expectedLength} — state changed since D3 ran; halt for re-diagnosis.`,
        )
      }

      // Compute truncation. Guard 3: bounds check.
      const truncated = truncateAtWord(current, 160)
      if (truncated.length < 140 || truncated.length > 160) {
        throw new Error(
          `truncated length ${truncated.length} outside [140,160] — halt.`,
        )
      }

      // All guards passed — apply surgical .set on metaDescription only.
      await sanityWriteClient.patch(t.id).set({ metaDescription: truncated }).commit()
      patched.push({ id: t.id, beforeLength: current.length, afterLength: truncated.length })
      console.log(`  ✅ ${t.id}: ${current.length} → ${truncated.length}`)
    } catch (e) {
      const msg = `${t.id}: ${(e as Error).message}`
      errors.push(msg)
      console.error(`  ❌ ${msg}`)
      // Halt at first guard failure per user's "do not proceed past a guard failure" instruction.
      break
    }
  }

  // Audit-trail row.
  await recordMigration({
    collectionSlug: 'bookacall-metadescription-truncation',
    sourceItemCount: TRUNCATION_TARGETS.length,
    migratedItemCount: patched.length,
    status: errors.length === 0 ? 'complete' : 'failed',
    errorLog: [
      'CONTENT-1D Brief Deviation DEV-4 (authorised 2026-05-02): bookACall.metaDescription "never-touch" policy explicitly overridden for 6 docs as a one-off CONTENT-1B carryover correction.',
      'Per-doc guards: _type validation + length-snapshot match (184/186/188/190/191/192) + truncated bounds [140,160].',
      'Truncation via truncateAtWord(s, 160) — same helper used by the snippetForMeta-copy path in the runner.',
      ...patched.map((p) => `${p.id}: ${p.beforeLength} → ${p.afterLength}`),
      ...errors,
    ],
  })

  console.log(`\n[bookacall-metadescription-truncation] patched=${patched.length}/${TRUNCATION_TARGETS.length}, errors=${errors.length}`)
  if (errors.length > 0) process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

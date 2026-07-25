// CONTENT-1E parity_score correction.
//
// The original CONTENT-1E migrator computed parity_score against the wrong
// denominator: `byDoc.size` (88 sweep docs) instead of eligible-after-dedup
// (79 — the 9 deduped-to-canonical Webflow mirrors are CONTENT-1C dedup
// artefacts whose embed content is recovered via their slug-canonical
// siblings, not unrecovered loss).
//
// Result: parity_score = 79/88 = 89.77 — artificially low and misleading.
// True eligible coverage = 79/79 = 100%.
//
// This one-shot script patches the existing Supabase `content_migrations`
// row for `w-embed-recovery`:
//   - parity_score: 89.77 → 100.00
//   - error_log: append explanatory note documenting the dedup semantics
//
// Idempotent: re-running checks current state; only patches if score is
// not already 100 OR the dedup note is absent.
//
// Run: npx tsx scripts/content/patch-content-1e-parity-score.ts
import { createServerClient } from '@/lib/supabase'

const ORG_ID = 'ce000000-0000-0000-0000-000000000001'
const MIGRATION_ID = 'ce000000-0000-0000-0000-000000000002'

const DEDUP_NOTE =
  'parity_score reflects eligible coverage (79/79 = 100%); 9 deduped-to-canonical Webflow mirrors excluded from denominator per CONTENT-1C dedup.'

async function main(): Promise<void> {
  const client = createServerClient()
  const { data: row, error: readErr } = await client
    .from('content_migrations')
    .select('parity_score, error_log')
    .eq('org_id', ORG_ID)
    .eq('migration_id', MIGRATION_ID)
    .eq('collection_slug', 'w-embed-recovery')
    .single()
  if (readErr || !row) {
    throw new Error(
      `w-embed-recovery row not found: ${readErr?.message ?? '(no error)'}`,
    )
  }

  const currentLog: string[] = Array.isArray(row.error_log) ? row.error_log : []
  const alreadyAnnotated = currentLog.some((line) => line.includes(DEDUP_NOTE))
  const alreadyCorrected = row.parity_score === 100

  if (alreadyCorrected && alreadyAnnotated) {
    console.log('✅ row already at parity_score=100 + dedup note present — no-op')
    return
  }

  const newLog = alreadyAnnotated ? currentLog : [...currentLog, DEDUP_NOTE]
  const { error: updErr } = await client
    .from('content_migrations')
    .update({
      parity_score: 100,
      error_log: newLog,
      last_run_at: new Date().toISOString(),
    })
    .eq('org_id', ORG_ID)
    .eq('migration_id', MIGRATION_ID)
    .eq('collection_slug', 'w-embed-recovery')
  if (updErr) {
    throw new Error(`update failed: ${updErr.message}`)
  }

  console.log(
    `✅ patched: parity_score ${row.parity_score} → 100, error_log entries ${currentLog.length} → ${newLog.length}`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

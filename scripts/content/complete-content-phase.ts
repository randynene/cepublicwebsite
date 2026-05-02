// CONTENT-1D §8 — state transition (HARD GATE).
//
// F2 — STRUCTURAL: verifyContent1D() throws on failure. This script
// MUST NOT wrap it in try/catch. The unhandled rejection propagates
// to Node's top-level handler → process exits non-zero → the
// assertValidTransition + Supabase update lines below are
// structurally unreachable. The state transition cannot run if
// verification fails.
//
// --confirm flag gates HUMAN INTENT. The verifier is the
// CORRECTNESS gate. Both are required.
//
// Usage: npm run content:complete -- --confirm
//
// Decision B (Jake, 2026-05-02): smoke_test_docs_remaining = 0
// (5 deleted in Step 7, none deferred to pre-launch).

import { assertValidTransition } from '@/lib/pipeline/state-machine'
import { createServerClient } from '@/lib/supabase'

import { verifyContent1D } from './verify-content-1d'

const ORG_ID = 'ce000000-0000-0000-0000-000000000001'
const MIGRATION_ID = 'ce000000-0000-0000-0000-000000000002'

async function main(): Promise<void> {
  if (!process.argv.includes('--confirm')) {
    console.error('Refusing to run without --confirm flag.')
    process.exit(1)
  }

  // F2: no try/catch around the verifier. If it throws, the unhandled
  // rejection propagates → process exits non-zero → state stays
  // content_running. Do not wrap. Ever.
  await verifyContent1D({ skipStateCheck: true })

  const supabase = createServerClient()
  const { data: current, error: fetchError } = await supabase
    .from('migrations')
    .select('id, status, current_phase, metadata')
    .eq('id', MIGRATION_ID)
    .eq('org_id', ORG_ID)
    .single()
  if (fetchError) throw new Error(`Fetch migration failed: ${fetchError.message}`)
  if (!current) throw new Error(`Migration ${MIGRATION_ID} not found for org ${ORG_ID}`)

  console.log(`Current: status=${current.status} current_phase=${current.current_phase}`)
  assertValidTransition(current.status, 'content_complete')

  // Count CE content_migrations rows for the metadata block.
  const { data: rows, error: rowsError } = await supabase
    .from('content_migrations')
    .select('collection_slug')
    .eq('org_id', ORG_ID)
    .eq('migration_id', MIGRATION_ID)
  if (rowsError) throw new Error(`content_migrations count failed: ${rowsError.message}`)
  const rowCount = rows?.length ?? 0

  const existingMetadata = (current.metadata ?? {}) as Record<string, unknown>
  const existingContentPhase = (existingMetadata['content_phase'] ?? {}) as Record<string, unknown>
  const startedAt = (existingContentPhase['started_at'] as string | undefined) ?? null

  const metadata = {
    ...existingMetadata,
    content_phase: {
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      // DEV-3 (authorised 2026-05-02): drift cleanup deleted 16 orphan
      // docs (1 customerStory + 15 reviews). Brief baseline was 404
      // (53 + 105 + 246); post-deviation = 404 − 16 = 388.
      total_cms_docs: 388,
      // Decision B: 0 (5 in-scope smoke-test docs deleted in Step 7,
      // none deferred to pre-launch). Brief originally specified 2.
      smoke_test_docs_remaining: 0,
      content_migrations_rows: rowCount,
      phases: ['CONTENT-1A', 'CONTENT-1B', 'CONTENT-1C', 'CONTENT-1D'],
    },
  }

  const { error: updateError } = await supabase
    .from('migrations')
    .update({
      status: 'content_complete',
      current_phase: 'content_complete',
      metadata,
    })
    .eq('id', MIGRATION_ID)
    .eq('org_id', ORG_ID)
  if (updateError) throw new Error(`Update migration failed: ${updateError.message}`)

  console.log(`Transitioned: ${current.status} → content_complete`)
  console.log(`metadata.content_phase = ${JSON.stringify(metadata.content_phase, null, 2)}`)
}

// F2: NO .catch(). Unhandled rejection on verifier failure intentionally
// propagates to Node top-level → process exits non-zero → state
// transition lines above are unreachable. Do NOT add `.catch(...)` here.
main()

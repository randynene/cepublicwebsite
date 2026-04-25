// Transitions the CE migration row from schema_complete → scaffold_running.
// Idempotent: re-running while already in scaffold_running is a no-op.
//
// Usage: npm run scaffold:start -- --confirm
//
// --confirm is required. The script throws immediately if it is missing —
// no interactive prompts (the script must be safe to run in CI).

import { assertValidTransition } from '@/lib/pipeline/state-machine'
import { createServerClient } from '@/lib/supabase'

const ORG_ID = 'ce000000-0000-0000-0000-000000000001'
const MIGRATION_ID = 'ce000000-0000-0000-0000-000000000002'

async function main(): Promise<void> {
  if (!process.argv.includes('--confirm')) {
    throw new Error('Missing --confirm flag. Run with --confirm to proceed.')
  }

  const supabase = createServerClient()

  const { data: current, error: fetchError } = await supabase
    .from('migrations')
    .select('id, status, current_phase')
    .eq('id', MIGRATION_ID)
    .eq('org_id', ORG_ID)
    .single()

  if (fetchError) throw new Error(`Fetch migration failed: ${fetchError.message}`)
  if (!current) throw new Error(`Migration ${MIGRATION_ID} not found for org ${ORG_ID}`)

  console.log(`Current: status=${current.status} current_phase=${current.current_phase}`)

  if (current.status === 'scaffold_running') {
    console.log('Already in scaffold_running — nothing to do.')
    return
  }

  assertValidTransition(current.status, 'scaffold_running')

  const { error: updateError } = await supabase
    .from('migrations')
    .update({ status: 'scaffold_running', current_phase: 'scaffold_running' })
    .eq('id', MIGRATION_ID)
    .eq('org_id', ORG_ID)

  if (updateError) throw new Error(`Update migration failed: ${updateError.message}`)

  console.log(`Transitioned: ${current.status} → scaffold_running`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

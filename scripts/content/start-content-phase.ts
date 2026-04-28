// Transitions the CE migration row from scaffold_complete → content_running.
// Idempotent: re-running while already in content_running is a no-op.
//
// Usage: npm run content:start -- --confirm
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

  if (current.status === 'content_running') {
    console.log('Already in content_running — nothing to do.')
    return
  }

  assertValidTransition(current.status, 'content_running')

  const { error: updateError } = await supabase
    .from('migrations')
    .update({ status: 'content_running', current_phase: 'content_running' })
    .eq('id', MIGRATION_ID)
    .eq('org_id', ORG_ID)

  if (updateError) throw new Error(`Update migration failed: ${updateError.message}`)

  console.log(`Transitioned: ${current.status} → content_running`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

import { assertValidTransition } from '@/lib/pipeline/state-machine'
import { createServerClient } from '@/lib/supabase'

const ORG_ID = 'ce000000-0000-0000-0000-000000000001'
const MIGRATION_ID = 'ce000000-0000-0000-0000-000000000002'

async function main(): Promise<void> {
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

  if (current.status === 'schema_running') {
    console.log('Already in schema_running — nothing to do.')
    return
  }

  assertValidTransition(current.status, 'schema_running')

  const { error: updateError } = await supabase
    .from('migrations')
    .update({ status: 'schema_running', current_phase: 'schema_running' })
    .eq('id', MIGRATION_ID)
    .eq('org_id', ORG_ID)

  if (updateError) throw new Error(`Update migration failed: ${updateError.message}`)

  console.log(`Transitioned: ${current.status} → schema_running`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

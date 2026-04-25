// Transitions the CE migration row from scaffold_running → scaffold_complete.
// Records the Vercel preview URL in metadata.scaffold_phase.
//
// Usage: npm run scaffold:complete -- --confirm --preview-url=https://...
//
// --confirm is required. --preview-url is required. The script throws
// immediately if either is missing — no interactive prompts (CI-safe).

import { assertValidTransition } from '@/lib/pipeline/state-machine'
import { createServerClient } from '@/lib/supabase'

const ORG_ID = 'ce000000-0000-0000-0000-000000000001'
const MIGRATION_ID = 'ce000000-0000-0000-0000-000000000002'

function getFlagValue(flag: string): string | null {
  const arg = process.argv.find((a) => a.startsWith(`${flag}=`))
  return arg ? arg.slice(flag.length + 1) : null
}

async function main(): Promise<void> {
  if (!process.argv.includes('--confirm')) {
    throw new Error('Missing --confirm flag. Run with --confirm to proceed.')
  }
  const previewUrl = getFlagValue('--preview-url')
  if (!previewUrl) {
    throw new Error('Missing --preview-url. Pass --preview-url=https://<vercel-preview>.vercel.app')
  }

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

  if (current.status === 'scaffold_complete') {
    console.log('Already in scaffold_complete — updating metadata only.')
  } else {
    assertValidTransition(current.status, 'scaffold_complete')
  }

  const metadata = {
    ...((current.metadata ?? {}) as Record<string, unknown>),
    scaffold_phase: {
      completed_at: new Date().toISOString(),
      vercel_preview_url: previewUrl,
    },
  }

  const { error: updateError } = await supabase
    .from('migrations')
    .update({
      status: 'scaffold_complete',
      current_phase: 'scaffold_complete',
      metadata,
    })
    .eq('id', MIGRATION_ID)
    .eq('org_id', ORG_ID)

  if (updateError) throw new Error(`Update migration failed: ${updateError.message}`)

  console.log(`Transitioned: ${current.status} → scaffold_complete`)
  console.log(`metadata.scaffold_phase = ${JSON.stringify(metadata.scaffold_phase, null, 2)}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

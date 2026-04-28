import { createServerClient } from '@/lib/supabase'

const ORG_ID = 'ce000000-0000-0000-0000-000000000001'
const MIGRATION_ID = 'ce000000-0000-0000-0000-000000000002'

export async function recordMigration(params: {
  collectionSlug: string
  sourceItemCount: number
  migratedItemCount: number
  status: 'complete' | 'failed'
  errorLog?: string[]
}): Promise<void> {
  const client = createServerClient()
  const { error } = await client
    .from('content_migrations')
    .upsert(
      {
        org_id: ORG_ID,
        migration_id: MIGRATION_ID,
        collection_slug: params.collectionSlug,
        source_item_count: params.sourceItemCount,
        migrated_item_count: params.migratedItemCount,
        parity_score:
          params.sourceItemCount > 0
            ? (params.migratedItemCount / params.sourceItemCount) * 100
            : 0,
        status: params.status,
        last_run_at: new Date().toISOString(),
        error_log: params.errorLog ?? [],
      },
      { onConflict: 'org_id,migration_id,collection_slug' },
    )

  if (error) throw new Error(`recordMigration failed: ${error.message}`)
}

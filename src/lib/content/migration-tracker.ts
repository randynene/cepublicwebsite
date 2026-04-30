import { createServerClient } from '@/lib/supabase'

const ORG_ID = 'ce000000-0000-0000-0000-000000000001'
const MIGRATION_ID = 'ce000000-0000-0000-0000-000000000002'

export async function recordMigration(params: {
  collectionSlug: string
  sourceItemCount: number
  migratedItemCount: number
  status: 'complete' | 'failed'
  errorLog?: string[]
  // Optional parity denominator. Defaults to sourceItemCount. Override when
  // the collection participates in cross-collection deduplication and the
  // "expected to migrate" count is smaller than the source count (e.g. blog
  // sub-category collections in CONTENT-1C, where most items are already
  // covered by the canonical Blogs & Guides master).
  parityBaselineCount?: number
}): Promise<void> {
  const client = createServerClient()
  const denominator = params.parityBaselineCount ?? params.sourceItemCount
  // Vacuous success: when nothing was eligible to migrate (e.g. a blog
  // sub-category whose every item already lives in the master collection)
  // AND nothing was migrated AND there were no errors, parity is 100%.
  // 0/0 falling back to 0 would falsely fail Step 7 verification.
  const errorCount = params.errorLog?.length ?? 0
  const parityScore =
    denominator > 0
      ? (params.migratedItemCount / denominator) * 100
      : params.migratedItemCount === 0 && errorCount === 0
        ? 100
        : 0
  const { error } = await client
    .from('content_migrations')
    .upsert(
      {
        org_id: ORG_ID,
        migration_id: MIGRATION_ID,
        collection_slug: params.collectionSlug,
        source_item_count: params.sourceItemCount,
        migrated_item_count: params.migratedItemCount,
        parity_score: parityScore,
        status: params.status,
        last_run_at: new Date().toISOString(),
        error_log: params.errorLog ?? [],
      },
      { onConflict: 'org_id,migration_id,collection_slug' },
    )

  if (error) throw new Error(`recordMigration failed: ${error.message}`)
}

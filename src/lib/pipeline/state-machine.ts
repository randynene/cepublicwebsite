// Migration pipeline state machine — CONVENTIONS.md §402-435
//
// Canonical string values match the `migrations.status` column in Supabase
// (see SCHEMA.md). These strings are the source of truth for the DB; the
// `MigrationStatus` enum in `src/lib/types.ts` is a legacy shortform that
// predates the running/complete/failed split and is not used here.

export type MigrationStatus =
  | 'pending'
  | 'audit_running'
  | 'audit_complete'
  | 'audit_failed'
  | 'schema_running'
  | 'schema_complete'
  | 'schema_failed'
  | 'scaffold_running'
  | 'scaffold_complete'
  | 'scaffold_failed'
  | 'content_running'
  | 'content_complete'
  | 'content_failed'
  | 'build_running'
  | 'build_complete'
  | 'build_failed'
  | 'qa_running'
  | 'qa_complete'
  | 'qa_failed'
  | 'launch_running'
  | 'launch_complete'
  | 'launch_failed'
  | 'cutover_complete'
  | 'archived'

const VALID_TRANSITIONS: Record<MigrationStatus, MigrationStatus[]> = {
  pending: ['audit_running', 'archived'],

  audit_running: ['audit_complete', 'audit_failed'],
  audit_complete: ['schema_running', 'archived'],
  audit_failed: ['audit_running', 'archived'],

  schema_running: ['schema_complete', 'schema_failed'],
  schema_complete: ['scaffold_running', 'archived'],
  schema_failed: ['schema_running', 'archived'],

  scaffold_running: ['scaffold_complete', 'scaffold_failed'],
  scaffold_complete: ['content_running', 'archived'],
  scaffold_failed: ['scaffold_running', 'archived'],

  content_running: ['content_complete', 'content_failed'],
  content_complete: ['build_running', 'archived'],
  content_failed: ['content_running', 'archived'],

  build_running: ['build_complete', 'build_failed'],
  build_complete: ['qa_running', 'archived'],
  build_failed: ['build_running', 'archived'],

  qa_running: ['qa_complete', 'qa_failed'],
  qa_complete: ['launch_running', 'archived'],
  qa_failed: ['qa_running', 'build_running', 'archived'],

  launch_running: ['launch_complete', 'launch_failed'],
  launch_complete: ['cutover_complete', 'archived'],
  launch_failed: ['launch_running', 'archived'],

  cutover_complete: [],
  archived: [],
}

export function assertValidTransition(from: MigrationStatus, to: MigrationStatus): void {
  const valid = VALID_TRANSITIONS[from] ?? []
  if (!valid.includes(to)) {
    throw new Error(`Invalid migration status transition: ${from} → ${to}`)
  }
}

export function validNextStatuses(from: MigrationStatus): MigrationStatus[] {
  return [...(VALID_TRANSITIONS[from] ?? [])]
}

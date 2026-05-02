// CONTENT-1D §7 — smoke-test cleanup (Decision B: 5-doc scope).
//
// Brief deviation: the v1.2 brief targeted 3 smoke-test docs and
// deferred 2 to pre-launch. Decision B (Jake, 2026-05-02) expanded to
// all 5 because smoke-test-blog-post references the original 3 — the
// brief's halt-on-refs guard would fire otherwise. Outcomes:
//   - smoke_test_docs_remaining: 0
//   - No pre-launch smoke-test cleanup tech debt
//   - Brief Exit Criterion #7 wording shifts (3 deleted → 5 deleted)
//
// Deletion uses deleteByIdStrict() — _id-only with _type validation
// before delete (F11, F19). Query-based deletes are forbidden in
// migration scripts.
//
// Order matters: smoke-test-blog-post FIRST (it's the only ref-holder).
// Deleting it first means none of the subsequent 4 deletes can fail
// the "any inbound refs?" defensive check.
//
// Vacuous-success on idempotent re-run: if all 5 are already gone,
// record migration row (0/0/complete) and return.
import { sanityWriteClient } from '@/lib/content/sanity-write-client'
import { recordMigration } from '@/lib/content/migration-tracker'
import { deleteByIdStrict } from '@/lib/content/migration-helpers'

interface DeletionTarget {
  id: string
  expectedType: string
  description: string
}

// Order: ref-holder FIRST so subsequent deletes have no inbound refs.
const TARGETS: DeletionTarget[] = [
  { id: 'smoke-test-blog-post', expectedType: 'blogPost', description: 'SCHEMA-1 smoke-test blog post (references the 3 below)' },
  { id: 'smoke-test-tag-scaling-teams', expectedType: 'tag', description: 'SCHEMA-1 smoke-test tag (name="scaling-teams (SMOKE TEST)")' },
  { id: 'smoke-test-blog-category-scaling-teams', expectedType: 'blogCategory', description: 'SCHEMA-1 smoke-test blog category (name="Scaling Teams (SMOKE TEST)")' },
  { id: 'smoke-test-team-member', expectedType: 'teamMember', description: 'SCHEMA-1 smoke-test team member (name="Smoke Test Author")' },
  { id: 'smoke-test-technology-with-folds', expectedType: 'technology', description: 'SCHEMA-1 smoke-test technology' },
]

async function main(): Promise<void> {
  console.log(`=== smoke-test cleanup (5-doc scope, Decision B) ===`)

  // Pre-flight: confirm targets exist (or are already gone — vacuous success).
  const presence: Array<{ id: string; exists: boolean; type?: string }> = []
  for (const t of TARGETS) {
    const doc = await sanityWriteClient.getDocument(t.id)
    presence.push({ id: t.id, exists: !!doc, type: doc?._type })
  }
  const missing = presence.filter((p) => !p.exists)
  const present = presence.filter((p) => p.exists)
  console.log(`Pre-flight: ${present.length} targets present, ${missing.length} already gone`)
  for (const p of presence) {
    console.log(`  ${p.exists ? '•' : '✓'} ${p.id} ${p.exists ? `(${p.type})` : '(already deleted)'}`)
  }

  if (present.length === 0) {
    // Vacuous success — every target already deleted. Idempotent re-run.
    await recordMigration({
      collectionSlug: 'smoke-test-cleanup',
      sourceItemCount: 5,
      migratedItemCount: 0,
      status: 'complete',
      errorLog: ['All 5 smoke-test targets already absent — idempotent no-op'],
    })
    console.log('Vacuous success — all 5 smoke-test docs already gone; row recorded.')
    return
  }

  // Reference check: every inbound ref must be from another in-scope
  // smoke-test target. Any external referrer halts the cleanup.
  const inScopeIds = new Set(TARGETS.map((t) => t.id))
  const externalRefs: Array<{ id: string; refs: string[] }> = []
  for (const t of TARGETS) {
    if (!presence.find((p) => p.id === t.id)?.exists) continue
    const refs = await sanityWriteClient.fetch<Array<{ _id: string }>>(
      `*[references($id)]{_id}`,
      { id: t.id },
    )
    const external = refs.map((r) => r._id).filter((id) => !inScopeIds.has(id))
    if (external.length > 0) externalRefs.push({ id: t.id, refs: external })
  }
  if (externalRefs.length > 0) {
    console.error('=== HALT — external refs to smoke-test docs ===')
    for (const e of externalRefs) {
      console.error(`  ${e.id} ← referenced by: ${e.refs.join(', ')}`)
    }
    console.error('Manual intervention required (rewrite refs, then re-run).')
    await recordMigration({
      collectionSlug: 'smoke-test-cleanup',
      sourceItemCount: 5,
      migratedItemCount: 0,
      status: 'failed',
      errorLog: externalRefs.map((e) => `${e.id} referenced by external doc(s): ${e.refs.join(', ')}`),
    })
    process.exit(1)
  }

  // Delete in order — ref-holder first.
  const errors: string[] = []
  let deleted = 0
  for (const t of TARGETS) {
    const exists = presence.find((p) => p.id === t.id)?.exists
    if (!exists) {
      console.log(`  ⏭  ${t.id} already deleted — skipping`)
      continue
    }
    try {
      await deleteByIdStrict(sanityWriteClient, t.id, t.expectedType)
      deleted++
    } catch (e) {
      const msg = `${t.id}: ${(e as Error).message}`
      errors.push(msg)
      console.error(`  ❌ ${msg}`)
    }
  }

  // Post-delete: confirm all targets are gone.
  const stillThere: string[] = []
  for (const t of TARGETS) {
    const doc = await sanityWriteClient.getDocument(t.id)
    if (doc) stillThere.push(t.id)
  }
  if (stillThere.length > 0) {
    errors.push(`Post-delete check failed — still present: ${stillThere.join(', ')}`)
  }

  await recordMigration({
    collectionSlug: 'smoke-test-cleanup',
    sourceItemCount: 5,
    migratedItemCount: deleted,
    status: errors.length === 0 ? 'complete' : 'failed',
    errorLog: errors,
  })
  console.log(`\n[smoke-test cleanup] deleted=${deleted}, errors=${errors.length}`)
  if (errors.length > 0) process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

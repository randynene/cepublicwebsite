// CONTENT-1E — verifier (throws-on-failure).
//
// Pattern mirrors verify-content-1d.ts: collect failures, throw once with the
// full picture rather than fail-on-first. CLI entrypoint at
// scripts/content/run-verify-content-1e.ts calls this WITHOUT try/catch — on
// failure the unhandled rejection propagates → process exits non-zero.
//
// Five hard-gate checks per plan §Step 6:
//   1. Schema deployed — round-trip a `videoEmbed` block. If the studio
//      production schema lacks the videoEmbed type, the smoke-test write
//      throws ("Invalid property value" or similar) and the check fails.
//   2. Sitewide _type frequencies match sweep expectations. The sweep file
//      is the canonical source-of-truth; verifier compares against
//      post-dedup arithmetic.
//   3. migrations.status === 'content_complete' (CONTENT-1E is a post-phase
//      patch; it does NOT transition state).
//   4. content_migrations row exists for `w-embed-recovery` with
//      status=complete and parity_score >= 95.
//   5. No regression on CONTENT-1A through CONTENT-1D-CLEANUP rows.
import fs from 'node:fs'

import { createServerClient } from '@/lib/supabase'
import { sanityWriteClient } from '@/lib/content/sanity-write-client'

const ORG_ID = 'ce000000-0000-0000-0000-000000000001'
const MIGRATION_ID = 'ce000000-0000-0000-0000-000000000002'

// Check 5 floor count — minimum rows in content_migrations expected from
// CONTENT-1A → CONTENT-1D-CLEANUP (CONTENT-1E adds 1 more: w-embed-recovery).
// FLOOR rather than equality so future post-phase patches (additional
// cleanup rows) don't break the verifier. Discovery via Supabase row
// inventory at CONTENT-1E close: 36 prior rows + 1 CONTENT-1E row = 37 total.
const MIN_PRIOR_ROWS = 36

const SMOKE_TEST_ID = 'smoke-test-content-1e-videoembed'
const SWEEP_INVENTORY_FILE = 'audit-output/content-1e/w-embed-sweep-inventory.json'

type SweepEntry = {
  docId: string
  slug: string | null
  docType: string
  embedType: string
}

function loadSweepCounts(): {
  expectedTable: number
  expectedVideoEmbed: number
  sweepDocs: number
} {
  if (!fs.existsSync(SWEEP_INVENTORY_FILE)) {
    throw new Error(`Sweep inventory missing at ${SWEEP_INVENTORY_FILE}`)
  }
  const data = JSON.parse(fs.readFileSync(SWEEP_INVENTORY_FILE, 'utf-8')) as {
    entries: SweepEntry[]
  }
  // Group by docId
  const byDoc = new Map<string, SweepEntry[]>()
  for (const e of data.entries) {
    const list = byDoc.get(e.docId) ?? []
    list.push(e)
    byDoc.set(e.docId, list)
  }
  // We compare deduped-aware expected counts at runtime by inspecting which
  // sweep docIds are present in Sanity; deduped Webflow mirrors' embeds are
  // covered by the canonical doc's own embeds (CONTENT-1C dedup invariant).
  return {
    expectedTable: 0, // populated at runtime in Check 2
    expectedVideoEmbed: 0,
    sweepDocs: byDoc.size,
  }
}

export async function verifyContent1E(): Promise<void> {
  const failures: string[] = []
  const note = (line: string): void => {
    console.log(`  ${line}`)
  }
  const fail = (line: string): void => {
    failures.push(line)
    console.log(`  ❌ ${line}`)
  }

  console.log('=== verifyContent1E ===')

  // ---------- Check 1 — Schema deployed (round-trip a videoEmbed block) ----------
  console.log('\n[1] Schema deployed — round-trip videoEmbed block')
  try {
    const probeUrl = 'https://player.vimeo.com/video/999999999'
    await sanityWriteClient.createOrReplace({
      _id: SMOKE_TEST_ID,
      _type: 'blogPost',
      title: 'CONTENT-1E schema probe',
      slug: { _type: 'slug', current: SMOKE_TEST_ID },
      content: [
        {
          _type: 'videoEmbed',
          _key: 'probe-0',
          url: probeUrl,
          caption: 'schema round-trip probe',
        },
      ],
    })
    const readBack = await sanityWriteClient.fetch<{
      content?: Array<{ _type?: string; url?: string }>
    } | null>(`*[_id == $id][0]{ content }`, { id: SMOKE_TEST_ID })
    const block = readBack?.content?.[0]
    if (block?._type === 'videoEmbed' && block.url === probeUrl) {
      note('✅ videoEmbed block round-tripped through Sanity (schema deployed)')
    } else {
      fail(
        `videoEmbed block did not round-trip cleanly. Read back: ${JSON.stringify(block)}`,
      )
    }
    // Clean up probe doc regardless of success
    await sanityWriteClient.delete(SMOKE_TEST_ID)
  } catch (e) {
    fail(`schema probe write/read failed: ${(e as Error).message}`)
    // Best-effort cleanup
    try {
      await sanityWriteClient.delete(SMOKE_TEST_ID)
    } catch {
      /* swallow */
    }
  }

  // ---------- Check 2 — Sitewide _type frequencies ----------
  console.log('\n[2] Sitewide _type frequencies (videoEmbed + table)')
  // Load sweep; compute deduped-aware expectation by classifying each sweep
  // docId against current Sanity state.
  const { sweepDocs } = loadSweepCounts()
  const sweepData = JSON.parse(fs.readFileSync(SWEEP_INVENTORY_FILE, 'utf-8')) as {
    entries: SweepEntry[]
  }
  // Build per-doc sweep aggregates
  const sweepByDoc = new Map<string, SweepEntry[]>()
  for (const e of sweepData.entries) {
    const list = sweepByDoc.get(e.docId) ?? []
    list.push(e)
    sweepByDoc.set(e.docId, list)
  }
  // Sanity-side: which sweep docIds exist?
  const sanityRows = await sanityWriteClient.fetch<Array<{ _id: string; slug: string | null }>>(
    `*[_type in ["blogPost","compareBlog","customerStory"] && !(_id match "smoke-test-*")]{_id, "slug": slug.current}`,
  )
  const sanityIds = new Set(sanityRows.map((r) => r._id))
  // Expected counts = sweep counts minus deduped (sweep entries on docIds
  // not present in Sanity — their content is covered by slug-canonical).
  let expectedTable = 0
  let expectedVideoEmbed = 0
  for (const [docId, entries] of sweepByDoc) {
    if (!sanityIds.has(docId)) continue
    for (const e of entries) {
      if (e.embedType === 'table') expectedTable++
      else if (e.embedType === 'iframe') expectedVideoEmbed++
    }
  }
  // Actual counts in production
  const bcContent = await sanityWriteClient.fetch<Array<{ types: string[] }>>(
    `*[_type in ["blogPost","compareBlog"] && defined(content)]{"types": content[]._type}`,
  )
  const csContent = await sanityWriteClient.fetch<Array<{ types: string[] }>>(
    `*[_type=="customerStory" && defined(hiringNeedsTable)]{"types": hiringNeedsTable[]._type}`,
  )
  let actualTable = 0
  let actualVideoEmbed = 0
  for (const r of [...bcContent, ...csContent]) {
    for (const t of r.types ?? []) {
      if (t === 'table') actualTable++
      else if (t === 'videoEmbed') actualVideoEmbed++
    }
  }
  if (actualTable >= expectedTable) {
    note(`✅ table blocks: ${actualTable} ≥ ${expectedTable} expected`)
  } else {
    fail(`table blocks: ${actualTable} < ${expectedTable} expected (regression)`)
  }
  if (actualVideoEmbed >= expectedVideoEmbed) {
    note(`✅ videoEmbed blocks: ${actualVideoEmbed} ≥ ${expectedVideoEmbed} expected`)
  } else {
    fail(`videoEmbed blocks: ${actualVideoEmbed} < ${expectedVideoEmbed} expected (regression)`)
  }
  note(`   sweep docs: ${sweepDocs}, in-Sanity: ${[...sweepByDoc.keys()].filter((id) => sanityIds.has(id)).length}, deduped: ${[...sweepByDoc.keys()].filter((id) => !sanityIds.has(id)).length}`)

  // ---------- Check 3 — migrations.status unchanged ----------
  console.log('\n[3] migrations.status unchanged (content_complete)')
  const supabase = createServerClient()
  const { data: mig, error: migErr } = await supabase
    .from('migrations')
    .select('status, current_phase')
    .eq('org_id', ORG_ID)
    .eq('id', MIGRATION_ID)
    .single()
  if (migErr) {
    fail(`migrations row fetch error: ${migErr.message}`)
  } else if (!mig) {
    fail('CE migrations row missing')
  } else if (mig.status === 'content_complete' && mig.current_phase === 'content_complete') {
    note(`✅ status + current_phase = content_complete (post-phase patch invariant)`)
  } else {
    fail(`expected content_complete; got status=${mig.status} current_phase=${mig.current_phase}`)
  }

  // ---------- Check 4 — w-embed-recovery row exists + healthy ----------
  console.log('\n[4] content_migrations row for w-embed-recovery')
  const { data: ourRow, error: rowErr } = await supabase
    .from('content_migrations')
    .select('collection_slug, status, parity_score, migrated_item_count, source_item_count')
    .eq('org_id', ORG_ID)
    .eq('migration_id', MIGRATION_ID)
    .eq('collection_slug', 'w-embed-recovery')
    .maybeSingle()
  if (rowErr) {
    fail(`Supabase fetch error: ${rowErr.message}`)
  } else if (!ourRow) {
    fail(`w-embed-recovery row missing from content_migrations`)
  } else {
    if (ourRow.status === 'complete') {
      note(`✅ status=complete (${ourRow.migrated_item_count}/${ourRow.source_item_count} migrated)`)
    } else {
      fail(`status=${ourRow.status} (expected complete)`)
    }
    if ((ourRow.parity_score ?? 0) >= 95) {
      note(`✅ parity_score=${ourRow.parity_score} (>=95 threshold)`)
    } else {
      fail(`parity_score=${ourRow.parity_score} below 95 threshold`)
    }
  }

  // ---------- Check 5 — no regression on prior phase rows ----------
  console.log('\n[5] No regression on CONTENT-1A → CONTENT-1D-CLEANUP rows')
  const { data: allRows, error: allErr } = await supabase
    .from('content_migrations')
    .select('collection_slug, status')
    .eq('org_id', ORG_ID)
    .eq('migration_id', MIGRATION_ID)
  if (allErr) {
    fail(`content_migrations fetch error: ${allErr.message}`)
  } else if (!allRows) {
    fail('content_migrations returned no rows')
  } else {
    const priorRows = allRows.filter((r) => r.collection_slug !== 'w-embed-recovery')
    if (priorRows.length >= MIN_PRIOR_ROWS) {
      const extra = priorRows.length - MIN_PRIOR_ROWS
      const suffix = extra > 0 ? ` (+${extra} post-phase row${extra === 1 ? '' : 's'})` : ''
      note(`✅ ${priorRows.length} prior-phase rows present (≥ ${MIN_PRIOR_ROWS} minimum${suffix})`)
    } else {
      fail(`prior-phase row count = ${priorRows.length}, expected ≥ ${MIN_PRIOR_ROWS}`)
    }
    const notComplete = priorRows.filter((r) => r.status !== 'complete')
    if (notComplete.length > 0) {
      fail(
        `prior-phase rows not at status=complete: ${notComplete.map((r) => `${r.collection_slug}(${r.status})`).join(', ')}`,
      )
    } else if (priorRows.length > 0) {
      note(`✅ all ${priorRows.length} prior-phase rows at status=complete`)
    }
  }

  console.log('')
  if (failures.length > 0) {
    throw new Error(
      `Content-1E verification failed:\n${failures.map((f) => `  - ${f}`).join('\n')}`,
    )
  }
  console.log('=== verifyContent1E PASSED ===')
}

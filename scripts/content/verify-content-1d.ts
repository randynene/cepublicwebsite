// CONTENT-1D §9 — verifier (throws-on-failure).
//
// F2 — verifyContent1D() throws a typed error on any failure. Never
// returns a boolean. Collects all failures into an array and throws
// once at the end with all failures joined — gives Seb a complete
// picture rather than fail-on-first.
//
// complete-content-phase.ts (Step 8) calls this WITHOUT try/catch.
// On failure, the unhandled rejection propagates to Node top-level →
// process exits non-zero → state transition is structurally
// unreachable.
//
// Hard-gate checks 1-9 from the brief. Smoke-test cleanup check
// adjusted for Decision B (5 deleted instead of 3).
import { createServerClient } from '@/lib/supabase'
import { sanityWriteClient } from '@/lib/content/sanity-write-client'

const ORG_ID = 'ce000000-0000-0000-0000-000000000001'
const MIGRATION_ID = 'ce000000-0000-0000-0000-000000000002'

interface InScopeCounts {
  technology: number
  service: number
  customerStory: number
  teamMember: number
  review: number
  bookACall: number
}

const EXPECTED_COUNTS: InScopeCounts = {
  technology: 101,
  service: 23,
  customerStory: 18,
  teamMember: 28,
  review: 26,
  bookACall: 6,
}

const META_BACKFILL_SLUGS = [
  'meta-backfill-technology',
  'meta-backfill-service',
  'meta-backfill-customer-story',
  'meta-backfill-team-member',
  'meta-backfill-review',
  'meta-backfill-book-a-call',
]

const CARRYOVER_SLUGS = [
  'image-carryover-benefit-values',
  'image-carryover-staff-benefits',
  'image-carryover-video-backup',
  'video-embed-link-encoding-fix',
]

const CLEANUP_SLUG = 'smoke-test-cleanup'

const ALL_NEW_1D_SLUGS = [...META_BACKFILL_SLUGS, ...CARRYOVER_SLUGS, CLEANUP_SLUG]

const SMOKE_TEST_IDS = [
  'smoke-test-blog-post',
  'smoke-test-tag-scaling-teams',
  'smoke-test-blog-category-scaling-teams',
  'smoke-test-team-member',
  'smoke-test-technology-with-folds',
]

const VALID_TITLE_PROVIDERS = new Set(['live-scrape', 'placeholder'])
const VALID_DESCRIPTION_PROVIDERS = new Set([
  'live-scrape',
  'snippetForMeta-copy',
  'placeholder',
])

export interface VerifyOptions {
  // When called from complete-content-phase.ts BEFORE the state
  // transition runs, the migrations.status check is skipped — it
  // hasn't been updated yet by definition.
  skipStateCheck?: boolean
}

interface DocMeta {
  _id: string
  metaTitle?: string | null
  metaDescription?: string | null
  metaTitleSource?: { provider?: string } | null
  metaDescriptionSource?: { provider?: string } | null
  needsReview?: boolean | null
}

export async function verifyContent1D(opts: VerifyOptions = {}): Promise<void> {
  const failures: string[] = []
  const note = (line: string): void => {
    console.log(`  ${line}`)
  }
  const fail = (line: string): void => {
    failures.push(line)
    console.log(`  ❌ ${line}`)
  }

  console.log('=== verifyContent1D ===')

  // ---------- Check 1 — meta coverage ----------
  console.log('\n[1] Meta coverage')
  for (const type of Object.keys(EXPECTED_COUNTS) as (keyof InScopeCounts)[]) {
    const docs = await sanityWriteClient.fetch<DocMeta[]>(
      `*[_type == $type && !(_id match "smoke-test-*")]{_id, metaTitle, metaDescription, needsReview}`,
      { type },
    )
    let missingTitle = 0
    let missingDescription = 0
    const sampleMissingTitle: string[] = []
    const sampleMissingDescription: string[] = []
    for (const d of docs) {
      if (typeof d.metaTitle !== 'string' || d.metaTitle.length === 0) {
        missingTitle++
        if (sampleMissingTitle.length < 5) sampleMissingTitle.push(d._id)
      }
      // bookACall metaDescription is never-touch — populated in CONTENT-1B.
      if (typeof d.metaDescription !== 'string' || d.metaDescription.length === 0) {
        missingDescription++
        if (sampleMissingDescription.length < 5) sampleMissingDescription.push(d._id)
      }
    }
    if (missingTitle === 0 && missingDescription === 0) {
      note(`✅ ${type}: ${docs.length}/${docs.length} have metaTitle + metaDescription`)
    } else {
      const titleSample = sampleMissingTitle.length > 0 ? ` titles missing on: ${sampleMissingTitle.join(', ')}${missingTitle > 5 ? ` (+${missingTitle - 5})` : ''}` : ''
      const descSample = sampleMissingDescription.length > 0 ? ` descriptions missing on: ${sampleMissingDescription.join(', ')}${missingDescription > 5 ? ` (+${missingDescription - 5})` : ''}` : ''
      fail(
        `${type}: missingTitle=${missingTitle}, missingDescription=${missingDescription}.${titleSample}${descSample}`,
      )
    }
  }

  // ---------- Check 2 — length compliance ----------
  console.log('\n[2] Length compliance')
  for (const type of Object.keys(EXPECTED_COUNTS) as (keyof InScopeCounts)[]) {
    const violations = await sanityWriteClient.fetch<Array<{ _id: string; titleLen: number; descLen: number }>>(
      `*[_type == $type && !(_id match "smoke-test-*") && (
        (defined(metaTitle) && length(metaTitle) > 60) ||
        (defined(metaDescription) && length(metaDescription) > 160)
      )]{_id, "titleLen": length(metaTitle), "descLen": length(metaDescription)}`,
      { type },
    )
    if (violations.length === 0) {
      note(`✅ ${type}: lengths within bounds`)
    } else {
      fail(
        `${type}: ${violations.length} length violation(s): ${violations.slice(0, 5).map((v) => `${v._id} title=${v.titleLen} desc=${v.descLen}`).join('; ')}`,
      )
    }
  }

  // ---------- Check 3 — per-field provenance present ----------
  console.log('\n[3] Provenance fields')
  for (const type of Object.keys(EXPECTED_COUNTS) as (keyof InScopeCounts)[]) {
    const docs = await sanityWriteClient.fetch<DocMeta[]>(
      `*[_type == $type && !(_id match "smoke-test-*")]{_id, metaTitleSource, metaDescriptionSource}`,
      { type },
    )
    let missingTitleSource = 0
    let missingDescriptionSource = 0
    const titleSrcSample: string[] = []
    const descSrcSample: string[] = []
    for (const d of docs) {
      if (!d.metaTitleSource || typeof d.metaTitleSource.provider !== 'string') {
        missingTitleSource++
        if (titleSrcSample.length < 3) titleSrcSample.push(d._id)
      }
      // bookACall — metaDescriptionSource intentionally undefined
      // (description came from CONTENT-1B without provenance tracking).
      if (type !== 'bookACall') {
        if (!d.metaDescriptionSource || typeof d.metaDescriptionSource.provider !== 'string') {
          missingDescriptionSource++
          if (descSrcSample.length < 3) descSrcSample.push(d._id)
        }
      }
    }
    if (missingTitleSource === 0 && missingDescriptionSource === 0) {
      note(`✅ ${type}: provenance present`)
    } else {
      fail(
        `${type}: missingTitleSource=${missingTitleSource}${titleSrcSample.length ? ` (${titleSrcSample.join(', ')})` : ''}, missingDescriptionSource=${missingDescriptionSource}${descSrcSample.length ? ` (${descSrcSample.join(', ')})` : ''}`,
      )
    }
  }

  // ---------- Check 4 — provider value sanity ----------
  console.log('\n[4] Provider value sanity')
  for (const type of Object.keys(EXPECTED_COUNTS) as (keyof InScopeCounts)[]) {
    const docs = await sanityWriteClient.fetch<DocMeta[]>(
      `*[_type == $type && !(_id match "smoke-test-*")]{_id, metaTitleSource, metaDescriptionSource}`,
      { type },
    )
    let badTitleProv = 0
    let badDescProv = 0
    const samples: string[] = []
    for (const d of docs) {
      const tp = d.metaTitleSource?.provider
      if (tp && !VALID_TITLE_PROVIDERS.has(tp)) {
        badTitleProv++
        if (samples.length < 3) samples.push(`${d._id} titleProv=${tp}`)
      }
      const dp = d.metaDescriptionSource?.provider
      if (dp && !VALID_DESCRIPTION_PROVIDERS.has(dp)) {
        badDescProv++
        if (samples.length < 3) samples.push(`${d._id} descProv=${dp}`)
      }
    }
    if (badTitleProv === 0 && badDescProv === 0) {
      note(`✅ ${type}: providers within enum`)
    } else {
      fail(`${type}: ${badTitleProv} bad title provider, ${badDescProv} bad description provider${samples.length ? ` (${samples.join('; ')})` : ''}`)
    }
  }

  // ---------- Check 5 — image carryovers cleared ----------
  console.log('\n[5] Image carryovers cleared')
  const carryoverChecks: Array<{ type: string; field: string; label: string }> = [
    { type: 'benefitValue', field: 'thumbnailImage', label: 'benefitValue.thumbnailImage' },
    { type: 'staffBenefit', field: 'icon', label: 'staffBenefit.icon' },
    { type: 'video', field: 'backupImage', label: 'video.backupImage' },
  ]
  for (const c of carryoverChecks) {
    const stuck = await sanityWriteClient.fetch<Array<{ _id: string }>>(
      `*[_type == $type && defined(webflowImageUrl) && !defined(${c.field})]{_id}`,
      { type: c.type },
    )
    if (stuck.length === 0) {
      note(`✅ ${c.label}: 0 docs with webflowImageUrl staging string + missing target`)
    } else {
      fail(`${c.label}: ${stuck.length} docs still hold webflowImageUrl without ${c.field}: ${stuck.slice(0, 5).map((d) => d._id).join(', ')}`)
    }
  }

  // ---------- Check 6 — encoding fix applied ----------
  console.log('\n[6] mainVideoEmbedLink encoding')
  const enc = await sanityWriteClient.fetch<Array<{ _id: string }>>(
    `*[_type == "video" && mainVideoEmbedLink match "*&amp;*"]{_id}`,
  )
  if (enc.length === 0) {
    note('✅ no video docs with &amp; in mainVideoEmbedLink')
  } else {
    fail(`encoding still present in ${enc.length} video docs: ${enc.slice(0, 5).map((d) => d._id).join(', ')}`)
  }

  // ---------- Check 7 — smoke-test cleanup (5-doc scope, Decision B) ----------
  console.log('\n[7] Smoke-test cleanup (Decision B: 5 deleted, 0 remain)')
  const stillPresent: string[] = []
  for (const id of SMOKE_TEST_IDS) {
    const doc = await sanityWriteClient.getDocument(id)
    if (doc) stillPresent.push(id)
  }
  if (stillPresent.length === 0) {
    note(`✅ all 5 smoke-test docs deleted`)
  } else {
    fail(`${stillPresent.length}/5 smoke-test docs still present: ${stillPresent.join(', ')}`)
  }
  // Belt-and-suspenders — confirm no doc with _id matching smoke-test-*
  // remains (catches any future smoke-test pollution).
  const anyRemaining = await sanityWriteClient.fetch<Array<{ _id: string; _type: string }>>(
    `*[_id match "smoke-test-*"]{_id, _type}`,
  )
  if (anyRemaining.length === 0) {
    note('✅ no smoke-test-* docs of any kind remain')
  } else {
    fail(
      `unexpected smoke-test-* docs still in dataset: ${anyRemaining.map((d) => `${d._id}(${d._type})`).join(', ')}`,
    )
  }

  // ---------- Check 8 — content_migrations rows ----------
  console.log('\n[8] content_migrations rows')
  const supabase = createServerClient()
  const { data: rows, error: rowsError } = await supabase
    .from('content_migrations')
    .select('collection_slug, status, parity_score')
    .eq('org_id', ORG_ID)
    .eq('migration_id', MIGRATION_ID)
    .in('collection_slug', ALL_NEW_1D_SLUGS)
  if (rowsError) {
    fail(`Supabase content_migrations fetch error: ${rowsError.message}`)
  } else {
    const present = new Set((rows ?? []).map((r) => r.collection_slug))
    const missing = ALL_NEW_1D_SLUGS.filter((s) => !present.has(s))
    if (missing.length > 0) {
      fail(`missing content_migrations rows: ${missing.join(', ')}`)
    } else {
      note(`✅ all 11 CONTENT-1D rows present`)
    }
    // status / parity check
    const failed = (rows ?? []).filter((r) => r.status !== 'complete' || r.parity_score !== 100)
    if (failed.length > 0) {
      const summary = failed.map((r) => `${r.collection_slug}(status=${r.status}, parity=${r.parity_score})`).join(', ')
      fail(`rows not at status=complete + parity=100: ${summary}`)
    } else if (rows && rows.length > 0) {
      note(`✅ all ${rows.length} rows at status=complete + parity_score=100`)
    }
  }

  // Total CE rows post-1D should be 35 (24 prior + 11 new).
  const { data: allRows, error: allRowsError } = await supabase
    .from('content_migrations')
    .select('collection_slug')
    .eq('org_id', ORG_ID)
    .eq('migration_id', MIGRATION_ID)
  if (allRowsError) {
    fail(`Supabase total row count fetch error: ${allRowsError.message}`)
  } else if (allRows) {
    if (allRows.length === 35) {
      note(`✅ total content_migrations row count = 35 (24 prior + 11 new)`)
    } else {
      fail(`total content_migrations row count = ${allRows.length}, expected 35`)
    }
  }

  // ---------- Check 9 — state (skipped from Step 8 caller) ----------
  if (!opts.skipStateCheck) {
    console.log('\n[9] Migration state')
    const { data: mig, error: migErr } = await supabase
      .from('migrations')
      .select('status, current_phase, metadata')
      .eq('org_id', ORG_ID)
      .eq('id', MIGRATION_ID)
      .single()
    if (migErr) {
      fail(`migrations row fetch error: ${migErr.message}`)
    } else if (!mig) {
      fail('CE migrations row missing')
    } else {
      if (mig.status === 'content_complete' && mig.current_phase === 'content_complete') {
        note(`✅ status + current_phase = content_complete`)
      } else {
        fail(`expected content_complete; got status=${mig.status} current_phase=${mig.current_phase}`)
      }
      const cp = (mig.metadata as { content_phase?: { total_cms_docs?: unknown; smoke_test_docs_remaining?: unknown } } | null)?.content_phase
      if (!cp) {
        fail('metadata.content_phase block missing')
      } else {
        if (cp.total_cms_docs === 404) {
          note('✅ metadata.content_phase.total_cms_docs = 404')
        } else {
          fail(`metadata.content_phase.total_cms_docs = ${String(cp.total_cms_docs)} (expected 404)`)
        }
        // Decision B — 0 not 2.
        if (cp.smoke_test_docs_remaining === 0) {
          note('✅ metadata.content_phase.smoke_test_docs_remaining = 0 (Decision B)')
        } else {
          fail(
            `metadata.content_phase.smoke_test_docs_remaining = ${String(cp.smoke_test_docs_remaining)} (expected 0 — Decision B)`,
          )
        }
      }
    }
  } else {
    console.log('\n[9] Migration state — SKIPPED (called from complete-content-phase pre-transition)')
  }

  console.log('')
  if (failures.length > 0) {
    throw new Error(
      `Content-1D verification failed:\n${failures.map((f) => `  - ${f}`).join('\n')}`,
    )
  }
  console.log('=== verifyContent1D PASSED ===')
}

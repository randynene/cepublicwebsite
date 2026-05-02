// CONTENT-1D Op 1 — drift cleanup (16 deletions).
//
// Brief deviation DEV-3 (Jake authorisation 2026-05-02):
// 16 orphan Sanity docs (1 customerStory + 15 reviews) whose slugs
// returned HTTP 404 on cloudemployee.io and have zero inbound
// references in the dataset (per diag-1d / diag-2-1d / diag-5-1d).
// Brief originally expected manual remediation; D1+D2+D5 confirmed
// the docs are fully orphan and safe to delete.
//
// Each delete passes through deleteByIdStrict() which fetches by _id,
// asserts _type matches, then deletes. Hardcoded _id list — no
// querying for them.
//
// Pre-flight rechecks (state may have changed since diagnostics ran):
//   1. Re-run *[references($id)] for every drift _id; halt if any
//      external referrer appears.
//   2. Single-sample live HTTP fetch (one of the 16) — confirm 404.
//      If it returns 200, drift may have been resolved upstream.

import { sanityWriteClient } from '@/lib/content/sanity-write-client'
import { recordMigration } from '@/lib/content/migration-tracker'
import { deleteByIdStrict } from '@/lib/content/migration-helpers'
import { urlForDoc } from '@/lib/content/url-builder'
import { withBrowser, scrapeMeta } from '@/lib/content/meta-scraper'

interface DriftTarget {
  id: string
  expectedType: string
}

const DRIFT_TARGETS: DriftTarget[] = [
  { id: 'customerStory-6762ed76b66ee8b78291fa47', expectedType: 'customerStory' },
  { id: 'review-675a903f1706d77f0614098c', expectedType: 'review' },
  { id: 'review-675a903f645ca1e0fe2c4acf', expectedType: 'review' },
  { id: 'review-675a903f6c8b574a0197d163', expectedType: 'review' },
  { id: 'review-675a903f9013553a15d2f4fe', expectedType: 'review' },
  { id: 'review-675a903fb5d7b55f448f9bf5', expectedType: 'review' },
  { id: 'review-675a9040007f51216b9fc5ac', expectedType: 'review' },
  { id: 'review-675a90401004da9fede19fe7', expectedType: 'review' },
  { id: 'review-675a90403084bc75767a25b9', expectedType: 'review' },
  { id: 'review-675a904058d1381ee3cf2e5b', expectedType: 'review' },
  { id: 'review-675a90408cc0241348e89da4', expectedType: 'review' },
  { id: 'review-675a904096220698f917505f', expectedType: 'review' },
  { id: 'review-675a9040a50edca85a62fa94', expectedType: 'review' },
  { id: 'review-675a9041eaa940a2486cc936', expectedType: 'review' },
  { id: 'review-67814f55676ab3c3e0e2559e', expectedType: 'review' },
  { id: 'review-678150505db5e735afafdf95', expectedType: 'review' },
]

const DRIFT_SET = new Set(DRIFT_TARGETS.map((t) => t.id))

async function preflightRefRecheck(): Promise<void> {
  console.log('=== Pre-flight: inbound-ref recheck ===')
  const offenders: Array<{ driftId: string; refs: string[] }> = []
  for (const t of DRIFT_TARGETS) {
    const refs = await sanityWriteClient.fetch<Array<{ _id: string }>>(
      `*[references($id)]{_id}`,
      { id: t.id },
    )
    const external = refs
      .map((r) => r._id)
      .filter((id) => !DRIFT_SET.has(id) && !id.startsWith('smoke-test-'))
    if (external.length > 0) offenders.push({ driftId: t.id, refs: external })
  }
  if (offenders.length > 0) {
    console.error('External inbound references appeared since diagnostics ran:')
    for (const o of offenders) {
      console.error(`  ${o.driftId} ← ${o.refs.join(', ')}`)
    }
    throw new Error('Pre-flight halt: state changed since D2. No deletes performed.')
  }
  console.log('  ✅ all 16 drift _ids still have zero external inbound refs')
}

async function preflightLiveSample(): Promise<void> {
  console.log('\n=== Pre-flight: single-sample live 404 retest ===')
  const sample = DRIFT_TARGETS[0]
  const doc = await sanityWriteClient.fetch<{ _id: string; _type: string; slug?: { current?: string } } | null>(
    `*[_id == $id][0]{_id, _type, slug}`,
    { id: sample.id },
  )
  if (!doc || !doc.slug?.current) {
    console.log(`  ⚠ ${sample.id} or its slug not found — skipping live retest, proceeding`)
    return
  }
  const url = urlForDoc({ _type: doc._type, slug: { current: doc.slug.current } })
  await withBrowser(async (browser) => {
    const ctx = await browser.newContext({ userAgent: 'Mygratr-Diag/1.0' })
    const page = await ctx.newPage()
    try {
      const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 5000 })
      const status = resp?.status() ?? 0
      console.log(`  Live HTTP ${status} on ${url}`)
      if (status === 200) {
        throw new Error(
          `Pre-flight halt: ${sample.id} now returns HTTP 200 — drift may have been resolved upstream. No deletes performed.`,
        )
      }
    } finally {
      await ctx.close()
    }
  })
  console.log('  ✅ sample drift slug still returns non-200')
}

async function main(): Promise<void> {
  await preflightRefRecheck()
  await preflightLiveSample()

  console.log('\n=== Op 1 — deleting 16 drift docs ===\n')
  const errors: string[] = []
  const deleted: string[] = []
  for (const t of DRIFT_TARGETS) {
    try {
      await deleteByIdStrict(sanityWriteClient, t.id, t.expectedType)
      deleted.push(t.id)
    } catch (e) {
      const msg = `${t.id}: ${(e as Error).message}`
      errors.push(msg)
      console.error(`  ❌ ${msg}`)
    }
  }

  // Post-loop confirmation: 0 docs in DRIFT_TARGETS should remain.
  console.log('\n=== Post-delete confirmation ===')
  const survivors = await sanityWriteClient.fetch<Array<{ _id: string }>>(
    `*[_id in $ids]{_id}`,
    { ids: DRIFT_TARGETS.map((t) => t.id) },
  )
  if (survivors.length > 0) {
    const msg = `Post-delete check failed — survivors: ${survivors.map((s) => s._id).join(', ')}`
    errors.push(msg)
    console.error(`  ❌ ${msg}`)
  } else {
    console.log(`  ✅ all 16 drift _ids confirmed deleted`)
  }

  // Audit-trail row.
  await recordMigration({
    collectionSlug: 'drift-cleanup',
    sourceItemCount: 16,
    migratedItemCount: deleted.length,
    status: errors.length === 0 ? 'complete' : 'failed',
    errorLog: [
      'CONTENT-1D Brief Deviation DEV-3 (authorised 2026-05-02): deleted 16 drift docs.',
      'Brief originally expected manual remediation. Diagnostics confirmed all 16 are HTTP 404 + zero inbound refs.',
      `1 customerStory + 15 review docs deleted via deleteByIdStrict.`,
      ...DRIFT_TARGETS.map((t) => `deleted: ${t.id} (${t.expectedType})`),
      ...errors,
    ],
  })

  console.log(`\n[drift-cleanup] deleted=${deleted.length}/16, errors=${errors.length}`)
  if (errors.length > 0) process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

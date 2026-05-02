// CONTENT-1D Diagnostic 4 — runner bug post-mortem (READ-ONLY).
//
// Prints a plain-English writeup of the buggy first runner pass +
// what the corrected version changed + what corrective action is
// still outstanding. Confirms by querying current state of the 6
// bookACall docs.
import { sanityWriteClient } from '@/lib/content/sanity-write-client'

const BOOKACALL_IDS = [
  'bookACall-68cc216479deb50634b0b643',
  'bookACall-68d10cd781fd6b44c8caac3a',
  'bookACall-68d10f1fc4318da4b305736d',
  'bookACall-68d110720afdfa5ff8cce1b1',
  'bookACall-68d1112b65230295ab2126e8',
  'bookACall-68d6a93806b49024c065063b',
]

interface BACState {
  _id: string
  needsReview?: boolean | null
  metaTitle?: string | null
  metaDescription?: string | null
  metaTitleSource?: { provider?: string; scrapedAt?: string } | null
  metaDescriptionSource?: { provider?: string } | null
}

async function main(): Promise<void> {
  console.log('\n=== Diagnostic 4 — runner bug post-mortem ===\n')

  console.log('## (a) Which docs were touched by the buggy pass?\n')
  console.log('Only the 6 bookACall docs from the very first migrate-meta-book-a-call run.')
  console.log('The other 5 backfill scripts (technology / service / customerStory / teamMember /')
  console.log('review) were never run with the buggy version — the bug was caught after bookACall')
  console.log('returned all 6 flagged with needsReview=true and was fixed before the rest ran.\n')

  console.log('## What was the bug?\n')
  console.log('shouldFlagForReview() in meta-backfill-runner.ts originally treated *any*')
  console.log('normaliser warning as a flag-for-review trigger:')
  console.log('')
  console.log('    if (normalised.warnings.length > 0) return true   // OLD')
  console.log('')
  console.log('For bookACall, policy.description is "never-touch" — the runner does NOT write')
  console.log('metaDescription, but it still calls scrapeMeta() (which returns rawDescription)')
  console.log('and still calls normaliseMeta() over the raw values for symmetry. The normaliser')
  console.log('produced descriptionWarnings ("rawDescription under 140 chars" / "rawDescription')
  console.log('missing on live page") for every bookACall doc — and those warnings flowed into')
  console.log('the catch-all warnings.length > 0 check, flagging all 6 for review even though')
  console.log('the description side was never written and was already populated correctly')
  console.log('upstream in CONTENT-1B.\n')

  console.log('## What changed in the corrected version?\n')
  console.log('Two refactors:\n')
  console.log('  1. NormaliseResult split into titleWarnings + descriptionWarnings (still')
  console.log('     surfaces a combined `warnings` field for back-compat in error_log).')
  console.log('  2. shouldFlagForReview now applies titleWarnings always (we always scrape')
  console.log('     and write the title) but descriptionWarnings ONLY when the run is')
  console.log('     actually writing the description (descriptionPath ∈ {live-scrape,')
  console.log('     snippetForMeta-copy}). never-touch and no-write paths are insulated from')
  console.log('     description-side warnings.\n')
  console.log('A separate fix later split hardFailures from warnings entirely — non-200')
  console.log('scrapes, length issues, and missing fields are now warnings (logged for')
  console.log('visibility, do not fail the row); only patch.commit() / urlForDoc / bypass')
  console.log('errors are hardFailures that mark the content_migrations row failed.\n')

  console.log('## (b) Were non-needsReview fields affected?\n')
  console.log('Yes — metaTitle and metaTitleSource were also written on the buggy pass. But')
  console.log('these writes are CORRECT: scraping cloudemployee.io/book-a-call/<slug>, pulling')
  console.log('the live <title>, normalising, and storing as metaTitle is the intended behaviour')
  console.log('regardless of which version of shouldFlagForReview is in play. The corrected')
  console.log('runner produces the same metaTitle value (and the same metaTitleSource shape')
  console.log('with provider="live-scrape") on re-run — these are idempotent.')
  console.log('')
  console.log('The corrective second run (post-fix) overwrote both metaTitle and metaTitleSource')
  console.log('with fresh values + new scrapedAt timestamp, AND overwrote the content_migrations')
  console.log('row to status="complete". So the only artifact still carried over from the buggy')
  console.log('pass is the false-positive `needsReview: true` value on those 6 docs.\n')

  console.log('## (c) Does re-running fix anything else?\n')
  console.log('No. The corrected runner has already been re-run on bookACall:')
  console.log('  - metaTitle data is correct.')
  console.log('  - metaTitleSource has fresh scrapedAt timestamps.')
  console.log('  - content_migrations row is `status=complete, parity=100`.')
  console.log('  - shouldFlagForReview correctly returns false for all 6 (no titleWarnings,')
  console.log('    descriptionPath=never-touch so descriptionWarnings ignored).')
  console.log('')
  console.log('The runner OMITS needsReview from the patch when the computed value is false')
  console.log('(F4 monotonicity rule — only ever patched true, never written false). So the')
  console.log('stale TRUE values cannot be cleared by re-running. They require an explicit')
  console.log('unset(["needsReview"]) operation, which is itself a one-off authorised deviation')
  console.log('(currently blocked by the user permission policy + the brief\'s monotonic-flag')
  console.log('hard rule).\n')

  console.log('## Current state of the 6 bookACall docs (live query):\n')
  const docs = await sanityWriteClient.fetch<BACState[]>(
    `*[_id in $ids]{_id, needsReview, metaTitle, metaDescription, metaTitleSource, metaDescriptionSource} | order(_id asc)`,
    { ids: BOOKACALL_IDS },
  )
  for (const d of docs) {
    console.log(`  ${d._id}`)
    console.log(`    needsReview:           ${d.needsReview}`)
    console.log(`    metaTitle (len ${d.metaTitle?.length ?? 0}):    "${(d.metaTitle ?? '').slice(0, 60)}"`)
    console.log(`    metaDescription (len ${d.metaDescription?.length ?? 0}):  "${(d.metaDescription ?? '').slice(0, 60)}…"`)
    console.log(`    metaTitleSource:       provider=${d.metaTitleSource?.provider ?? '—'}, scrapedAt=${d.metaTitleSource?.scrapedAt ?? '—'}`)
    console.log(
      `    metaDescriptionSource: ${d.metaDescriptionSource ? `provider=${d.metaDescriptionSource.provider}` : '(undefined — correct, description came from CONTENT-1B without provenance)'}`,
    )
  }
  console.log('')
  console.log('## Summary')
  console.log('')
  console.log('The complete remediation for the runner bug is one operation:')
  console.log('  unset([\'needsReview\']) on the 6 bookACall _ids listed above.')
  console.log('')
  console.log('No other corrective action is needed. No re-runs, no patches, no schema changes.')
  console.log('The other 5 backfill collections were never touched by the bug.')
  console.log('')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

// CONTENT-1D Diagnostic 2 — inbound reference check (READ-ONLY).
//
// For each of the 16 drift _ids, run *[references($id)] and emit a row
// per referrer. Flag refs from outside the drift set as "EXTERNAL —
// blocker for deletion".
import { sanityWriteClient } from '@/lib/content/sanity-write-client'

const DRIFT_IDS = [
  'customerStory-6762ed76b66ee8b78291fa47',
  'review-675a903f1706d77f0614098c',
  'review-675a903f645ca1e0fe2c4acf',
  'review-675a903f6c8b574a0197d163',
  'review-675a903f9013553a15d2f4fe',
  'review-675a903fb5d7b55f448f9bf5',
  'review-675a9040007f51216b9fc5ac',
  'review-675a90401004da9fede19fe7',
  'review-675a90403084bc75767a25b9',
  'review-675a904058d1381ee3cf2e5b',
  'review-675a90408cc0241348e89da4',
  'review-675a904096220698f917505f',
  'review-675a9040a50edca85a62fa94',
  'review-675a9041eaa940a2486cc936',
  'review-67814f55676ab3c3e0e2559e',
  'review-678150505db5e735afafdf95',
]
const DRIFT_SET = new Set(DRIFT_IDS)

async function main(): Promise<void> {
  console.log('\n=== Diagnostic 2 — inbound reference check ===\n')
  console.log(
    '| drift_id                                    | referenced_by_id                            | referrer_type    | classification |',
  )
  console.log(
    '|---------------------------------------------|---------------------------------------------|------------------|----------------|',
  )

  let externalRefCount = 0
  for (const id of DRIFT_IDS) {
    const refs = await sanityWriteClient.fetch<Array<{ _id: string; _type: string }>>(
      `*[references($id)]{_id, _type}`,
      { id },
    )
    if (refs.length === 0) {
      console.log(
        `| ${id.padEnd(43)} | (no inbound refs)                           | —                | safe-to-delete |`,
      )
      continue
    }
    for (const r of refs) {
      let classification = 'EXTERNAL — blocker'
      if (DRIFT_SET.has(r._id)) classification = 'inside drift set'
      else if (r._id.startsWith('smoke-test-')) classification = 'smoke-test (already deleted)'
      else if (r._id.startsWith('drafts.')) {
        // Drafts are usually copies of published docs; check if the
        // base doc is in the drift set.
        const baseId = r._id.slice('drafts.'.length)
        if (DRIFT_SET.has(baseId)) classification = 'draft of drift doc'
        else classification = 'EXTERNAL draft — review'
      } else {
        externalRefCount++
      }
      console.log(
        `| ${id.padEnd(43)} | ${r._id.padEnd(43)} | ${r._type.padEnd(16)} | ${classification.padEnd(14)} |`,
      )
    }
  }

  console.log('')
  if (externalRefCount === 0) {
    console.log(
      '✅ No external inbound references — every drift doc can be deleted without orphaning production refs.',
    )
  } else {
    console.log(
      `❌ ${externalRefCount} external inbound reference(s) found — deletion of those drift docs would orphan production refs. Review the rows marked EXTERNAL.`,
    )
  }
  console.log('')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

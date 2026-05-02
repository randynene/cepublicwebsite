// CONTENT-1D Diagnostic 3 — bookACall truncation preview (READ-ONLY).
//
// For each of the 6 bookACall docs, print current full metaDescription,
// truncateAtWord(s, 160), and the exact dropped tail. Side-by-side so
// we can eyeball whether truncation loses meaningful content.
//
// truncateAtWord is the existing helper from
// src/lib/content/meta-normaliser.ts — same function the runner uses
// for the snippetForMeta-copy path.
import { sanityWriteClient } from '@/lib/content/sanity-write-client'
import { truncateAtWord } from '@/lib/content/meta-normaliser'

interface BookACallDoc {
  _id: string
  firstName?: string
  lastName?: string
  metaDescription?: string
}

async function main(): Promise<void> {
  const docs = await sanityWriteClient.fetch<BookACallDoc[]>(
    `*[_type == "bookACall" && !(_id match "smoke-test-*")]{_id, firstName, lastName, metaDescription} | order(_id asc)`,
  )

  console.log('\n=== Diagnostic 3 — bookACall truncation preview ===\n')
  console.log(
    'Schema bound: 140 ≤ length ≤ 160. truncateAtWord(s, 160) is the proposed correction.\n',
  )

  for (const doc of docs) {
    const md = doc.metaDescription ?? ''
    const truncated = truncateAtWord(md, 160)
    const dropped = md.slice(truncated.length)
    const name = [doc.firstName, doc.lastName].filter(Boolean).join(' ') || '(no name)'
    console.log(`${doc._id} (${name})`)
    console.log(`  current   (len=${md.length}):`)
    console.log(`    "${md}"`)
    console.log(`  truncated (len=${truncated.length}):`)
    console.log(`    "${truncated}"`)
    console.log(`  dropped   (len=${dropped.length}):`)
    console.log(`    ${dropped.length === 0 ? '(nothing — current already fits)' : `"${dropped}"`}`)
    if (truncated.length < 140 && truncated.length > 0) {
      console.log(`  ⚠ truncated falls below 140-char floor — manual rewrite preferred.`)
    }
    console.log('  ─'.repeat(40))
  }
  console.log('')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

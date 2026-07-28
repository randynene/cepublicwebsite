/**
 * Copy edits from Seb's 28 Jul page-by-page review.
 *
 * WHY THIS EXISTS: Home and Hire Engineers read their copy from Sanity, and
 * fall back to the code in `content.ts` only when the Sanity doc is absent.
 * Both docs exist, so editing `content.ts` alone changes NOTHING on the live
 * site — the Sanity value wins. Those code fallbacks have been updated in the
 * same commit as this script; this applies the matching change to the data.
 *
 * WHAT THIS TOUCHES — two documents, three fields:
 *   1. homePage.calculator.cta
 *        "Get matched at this rate"  ->  "Ask our AI"
 *      (the button also stopped scrolling to the video and now opens the chat)
 *   2. homePage.process.steps[1].body
 *        "psychometrics"  ->  "psychometric testing"
 *      (Seb: "it's not psychometrics")
 *   3. hireEngineersPage.vet.profile.openBtn
 *        "Explore a real profile"  ->  "Tell our AI what you need"
 *
 * SAFE BY CONSTRUCTION: each field is only written when it still holds the
 * exact expected old value. If Seb has already edited it in Studio, the script
 * reports "changed in Studio, skipping" and leaves his text alone. Nothing else
 * in either document is touched, and re-running is a no-op.
 *
 * Usage (from repo root, with SANITY_MIGRATION_WRITE_TOKEN in .env):
 *   npx tsx scripts/static/patch-seb-copy-edits.ts            # dry run
 *   npx tsx scripts/static/patch-seb-copy-edits.ts --apply    # writes
 */

import 'dotenv/config'

import { createClient } from '@sanity/client'

const projectId =
  process.env.SANITY_PROJECT_ID ?? process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? 'lzbhll1u'
const dataset =
  process.env.SANITY_DATASET ?? process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'
const token = process.env.SANITY_MIGRATION_WRITE_TOKEN
const APPLY = process.argv.includes('--apply')

if (!token) {
  console.error('Missing SANITY_MIGRATION_WRITE_TOKEN in .env (repo root).')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2024-01-01',
  useCdn: false,
})

interface Edit {
  doc: string
  /** Dot path, as accepted by patch().set(). */
  path: string
  from: string
  to: string
  note: string
}

const EDITS: Edit[] = [
  {
    doc: 'homePage',
    path: 'calculator.cta',
    from: 'Get matched at this rate',
    to: 'Ask our AI',
    note: 'the button now opens the chat instead of scrolling to the video',
  },
  {
    doc: 'homePage',
    path: 'process.steps[1].body',
    from: 'Live coding on your stack. Cultural fit, psychometrics, background checks, KYC.',
    to: 'Live coding on your stack. Cultural fit, psychometric testing, background checks, KYC.',
    note: 'Seb: "it is not psychometrics"',
  },
  {
    doc: 'hireEngineersPage',
    path: 'vet.profile.openBtn',
    from: 'Explore a real profile',
    to: 'Tell our AI what you need',
    note: 'the profile CTA now opens the chat',
  },
]

/** Read a dot/bracket path out of a fetched document. */
function read(doc: unknown, path: string): unknown {
  return path
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .reduce<unknown>((acc, key) => {
      if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key]
      return undefined
    }, doc)
}

async function main() {
  console.log(`Seb 28 Jul copy edits — ${projectId}/${dataset}`)
  console.log(APPLY ? 'MODE: apply\n' : 'MODE: dry run (pass --apply to write)\n')

  const docIds = [...new Set(EDITS.map((e) => e.doc))]
  const docs = new Map<string, unknown>()
  for (const id of docIds) {
    docs.set(id, await client.fetch(`*[_id == $id][0]`, { id }))
  }

  let toWrite = 0
  let skipped = 0

  for (const edit of EDITS) {
    const doc = docs.get(edit.doc)
    const label = `${edit.doc}.${edit.path}`
    if (!doc) {
      console.log(`  SKIP  ${label} — document not found`)
      skipped += 1
      continue
    }
    const current = read(doc, edit.path)
    if (current === edit.to) {
      console.log(`  DONE  ${label} — already "${edit.to}"`)
      continue
    }
    if (current !== edit.from) {
      console.log(`  SKIP  ${label} — changed in Studio, leaving it alone`)
      console.log(`          expected: "${edit.from}"`)
      console.log(`          found:    "${String(current)}"`)
      skipped += 1
      continue
    }
    console.log(`  EDIT  ${label}  (${edit.note})`)
    console.log(`          "${edit.from}"`)
    console.log(`       -> "${edit.to}"`)
    toWrite += 1
    if (APPLY) {
      await client.patch(edit.doc).set({ [edit.path]: edit.to }).commit()
      console.log('          written')
    }
  }

  console.log(
    `\n${toWrite} field(s) ${APPLY ? 'written' : 'would be written'}, ${skipped} skipped.`,
  )
  if (!APPLY && toWrite > 0) console.log('Re-run with --apply to write.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

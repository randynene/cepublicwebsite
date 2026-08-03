// Shorten one line of Home copy in Sanity.
//
// WHY A SCRIPT AND NOT A CODE EDIT. Home is Sanity-wired: `content.ts` is only
// the fallback used when the document is missing a value. The document HAS a
// value for this field, so the document wins and editing the code changed nothing
// on the deployed page. This is the trap recorded at the top of
// docs/ROADMAP_TO_COMPLETION.md, and it cost a round trip here to rediscover.
//
// WHAT IT CHANGES. One document, one field:
//
//   homePage . readyToFind.paragraph
//     from  "Four quick questions. See who we'd build your team with."
//     to    "See who we'd build your team with."
//
// Jake's call, 3 Aug: the form now sits directly beneath this line and shows its
// own step count in the rail, so "Four quick questions" both repeats it and
// contradicts it (there are six steps, or five when the role is prefilled).
//
// SAFETY. A `.patch().set()` on one named field of one named document. It does
// not touch drafts, does not create or replace a document, and re-running it is a
// no-op. It reads the current value first and refuses if it is not the expected
// string, so it cannot quietly stamp over an edit Seb has made in Studio.
//
// Run: DRY_RUN=1 npx tsx scripts/static/patch-home-ready-to-find-lead.ts
//      npx tsx scripts/static/patch-home-ready-to-find-lead.ts

export {}

const PROJECT_ID = 'lzbhll1u'
const DATASET = 'production'
const TOKEN = process.env.SANITY_MIGRATION_WRITE_TOKEN
const DRY_RUN = process.env.DRY_RUN === '1'

const FIELD = 'readyToFind.paragraph'
const EXPECTED = "Four quick questions. See who we'd build your team with."
const NEXT = "See who we'd build your team with."

const API = `https://${PROJECT_ID}.api.sanity.io/v2024-01-01`

async function query<T>(groq: string): Promise<T> {
  const url = new URL(`${API}/data/query/${DATASET}`)
  url.searchParams.set('query', groq)
  const res = await fetch(url, TOKEN ? { headers: { Authorization: `Bearer ${TOKEN}` } } : {})
  if (!res.ok) throw new Error(`query -> ${res.status}: ${(await res.text()).slice(0, 200)}`)
  return (await res.json()).result as T
}

async function main(): Promise<void> {
  const doc = await query<{ _id: string; readyToFind?: { paragraph?: string } } | null>(
    `*[_type=="homePage" && !(_id in path("drafts.**"))][0]{_id, readyToFind}`,
  )
  if (!doc) throw new Error('No published homePage document found.')

  const current = doc.readyToFind?.paragraph
  console.log(`document: ${doc._id}`)
  console.log(`field:    ${FIELD}`)
  console.log(`current:  ${JSON.stringify(current)}`)

  if (current === NEXT) {
    console.log('\nAlready set. Nothing to do.')
    return
  }
  if (current !== EXPECTED) {
    console.error('\nREFUSING TO WRITE.')
    console.error('The current value is not the string this script expects, which means')
    console.error('someone has edited it since. Read it, decide, and update EXPECTED if the')
    console.error('change is still wanted. Overwriting an unknown value is how edits vanish.')
    process.exitCode = 1
    return
  }

  if (DRY_RUN || !TOKEN) {
    console.log(`\nWOULD SET to: ${JSON.stringify(NEXT)}`)
    if (!TOKEN) {
      console.log('')
      console.log('SANITY_MIGRATION_WRITE_TOKEN is not set, so this run cannot write.')
      console.log('That token carries patch + delete + asset-upload power, so it is Jake\'s')
      console.log('to supply. Set it in the shell and re-run without DRY_RUN.')
    }
    return
  }

  const res = await fetch(`${API}/data/mutate/${DATASET}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mutations: [{ patch: { id: doc._id, set: { [FIELD]: NEXT } } }],
    }),
  })
  if (!res.ok) throw new Error(`mutate -> ${res.status}: ${(await res.text()).slice(0, 300)}`)

  const after = await query<string | null>(
    `*[_id=="${doc._id}"][0].readyToFind.paragraph`,
  )
  console.log(`\nSET. Read back: ${JSON.stringify(after)}`)
  if (after !== NEXT) {
    console.error('Read-back does not match. Investigate before assuming this worked.')
    process.exitCode = 1
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})

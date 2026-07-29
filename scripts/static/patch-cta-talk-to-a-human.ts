/**
 * Rename the CTA copy "Schedule a Call" -> "Talk to a human" in Sanity.
 *
 * WHY THIS SCRIPT EXISTS: most of the phrase lives in committed source and is
 * already changed (the /ask header and its in-page booking CTAs, the static
 * location-page fallback, the service/technology detail pages, the seed fallbacks).
 * These fields are the ones that live in the dataset, so code alone cannot move
 * them - and the sitewide header CTA is one of them.
 *
 * SCOPE — 4 fields across 4 documents, all of them BUTTON LABELS:
 *   navigation.ctaButton.label                                (sitewide header CTA)
 *   locationPage-philippines-developers.start.cards[start-1].cta
 *   locationPage-eastern-europe-developers.start.cards[start-1].cta
 *   locationPage-latam-developers.start.cards[start-1].cta
 *
 * DELIBERATELY NOT TOUCHED. A dataset scan on 29 Jul found the phrase in 21 fields.
 * The 17 below are left alone because they are not button labels, and changing them
 * has consequences this script should not decide:
 *
 *   - `bookACall-*.metaTitle` (6 docs, e.g. "Schedule a call with Seb Hall") are
 *     <title> tags on indexed pages. Rewriting page titles mid domain-migration is
 *     the same trap the hub H1s were kept out of (see Tech Debt #43b): it changes two
 *     variables at once and muddies the SEO read. Needs Jake's explicit call.
 *   - `bookACallPage.title` ("Schedule a call with us today") is the /book-a-call H1.
 *     Same reasoning.
 *   - 10 portable-text runs inside blogPost / compareBlog / customerStory bodies and
 *     CTA blocks. That is migrated article copy held for parity with the live site;
 *     editing article bodies is an editorial decision, not a CTA rename.
 *
 * Re-run `npm run static:scan-schedule-a-call` to regenerate that list.
 *
 * Idempotent — re-running is a no-op once applied. Safe by default: the dry-run needs
 * no token and writes nothing. Pass --apply to commit to the live `production`
 * dataset, which needs SANITY_MIGRATION_WRITE_TOKEN.
 *
 * NOTE BEFORE APPLYING: this overwrites whatever is in Studio for those four fields,
 * so if Seb has edited any of them since the last seed, his wording is what gets
 * replaced. The dry-run prints every current value first.
 *
 * Usage (from repo root):
 *   npm run static:patch-cta-talk-to-a-human            # dry-run, no token needed
 *   npm run static:patch-cta-talk-to-a-human -- --apply # write
 */

import 'dotenv/config'

import { createClient } from '@sanity/client'

/** Must match ASK_LABELS.talkToHuman in site/src/components/ask/content.ts. */
const NEW_LABEL = 'Talk to a human'
const APPLY = process.argv.includes('--apply')

const projectId =
  process.env.SANITY_PROJECT_ID ??
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ??
  'lzbhll1u'
const dataset =
  process.env.SANITY_DATASET ?? process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'
const token = process.env.SANITY_MIGRATION_WRITE_TOKEN

/** Reads work against the CDN without a token, so a dry-run needs no credentials. */
const reader = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: true,
})

const LOCATION_IDS = [
  'locationPage-philippines-developers',
  'locationPage-eastern-europe-developers',
  'locationPage-latam-developers',
] as const

interface Target {
  docId: string
  /** Patch path, and the GROQ needed to read the current value back. */
  path: string
  readPath: string
  what: string
}

const TARGETS: Target[] = [
  {
    docId: 'navigation',
    path: 'ctaButton.label',
    readPath: 'ctaButton.label',
    what: 'sitewide header CTA',
  },
  ...LOCATION_IDS.map((docId) => ({
    docId,
    path: 'start.cards[_key=="start-1"].cta',
    readPath: 'start.cards[_key=="start-1"][0].cta',
    what: 'location page "Talk to a CTO" card CTA',
  })),
]

async function main() {
  console.log(`CTA rename -> "${NEW_LABEL}"  (dataset: ${dataset})`)
  console.log(
    APPLY
      ? 'MODE: APPLY (will write)\n'
      : 'MODE: dry-run (no write) — pass --apply to commit\n',
  )

  const pending: Target[] = []

  for (const target of TARGETS) {
    const current = await reader.fetch<string | null>(
      `*[_id == $id][0].${target.readPath}`,
      { id: target.docId },
    )

    if (current === null || current === undefined) {
      console.log(`  SKIP  ${target.docId}\n        ${target.path} — field absent\n`)
      continue
    }
    if (current === NEW_LABEL) {
      console.log(`  DONE  ${target.docId}\n        already "${NEW_LABEL}"\n`)
      continue
    }

    console.log(`  TODO  ${target.docId}  (${target.what})`)
    console.log(`        ${target.path}`)
    console.log(`        "${current}"  ->  "${NEW_LABEL}"\n`)
    pending.push(target)
  }

  if (pending.length === 0) {
    console.log('Nothing to change.')
    return
  }

  if (!APPLY) {
    console.log(
      `Dry-run only. ${pending.length} field(s) would change across ${new Set(pending.map((t) => t.docId)).size} document(s).`,
    )
    console.log('Re-run with --apply to write.')
    return
  }

  if (!token) {
    console.error(
      '\nMissing SANITY_MIGRATION_WRITE_TOKEN in .env (repo root). Nothing written.',
    )
    process.exit(1)
  }

  const writer = createClient({
    projectId,
    dataset,
    token,
    apiVersion: '2024-01-01',
    useCdn: false,
  })

  for (const target of pending) {
    await writer
      .patch(target.docId)
      .set({ [target.path]: NEW_LABEL })
      .commit()
    const check = await writer.fetch<string | null>(
      `*[_id == $id][0].${target.readPath}`,
      { id: target.docId },
    )
    console.log(`  written  ${target.docId}.${target.path} = "${check}"`)
  }

  console.log(`\nDone. ${pending.length} field(s) updated.`)
}

main().catch((err) => {
  console.error('\nFAIL:', err)
  process.exit(1)
})

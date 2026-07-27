import 'dotenv/config'

import { sanityWriteClient } from '@/lib/content/sanity-write-client'

import { PHILIPPINES_CONTENT } from '../../site/src/components/templates/location/content'

// One-time correction for the Philippines "What's included" section.
//
// The section was redesigned (one bordered card, two-up "We" list, lime as an
// accent only) and its copy was rewritten at the same time: labels now carry
// their item counts, the "We" list splits liability insurance and IP/data
// protection into two entries, the payroll line names the Philippines instead
// of "their country", and four new fields exist (youBody, youFootnote, wePill,
// weBody). The seeded Sanity doc still holds the old block, and Sanity wins
// over the code registry, so the page renders a mix of old and new until this
// runs.
//
// Sets the whole `included` object from PHILIPPINES_CONTENT on BOTH the
// published doc and its draft (if one exists), so the live site, localhost and
// Studio agree. Every other field on the document is left untouched.
//
// Idempotent: it sets one plain object, no assets, no array keys.
//
// Run:   npm run static:patch-ph-included
// Token: SANITY_MIGRATION_WRITE_TOKEN

const PUBLISHED_ID = 'locationPage-philippines-developers'
const DRAFT_ID = `drafts.${PUBLISHED_ID}`

// Author-voice rule (no em/en dashes) - mirror the seed script's normalizer.
function normalizeStr(s: string): string {
  return s.replace(/—/g, ', ').replace(/–/g, '-').replace(/[ \t]+/g, ' ').trim()
}

async function patchDocIfExists(id: string, fields: Record<string, unknown>): Promise<boolean> {
  const existing = await sanityWriteClient.getDocument(id)
  if (!existing) return false
  await sanityWriteClient.patch(id).set(fields).commit()
  return true
}

async function main() {
  const inc = PHILIPPINES_CONTENT.included
  if (!inc) throw new Error('PHILIPPINES_CONTENT.included is missing.')

  const included = {
    eyebrow: normalizeStr(inc.eyebrow),
    titleLead: normalizeStr(inc.titleLead),
    titleAccent: normalizeStr(inc.titleAccent),
    youLabel: normalizeStr(inc.youLabel),
    ...(inc.youSubhead ? { youSubhead: normalizeStr(inc.youSubhead) } : {}),
    ...(inc.youBody ? { youBody: normalizeStr(inc.youBody) } : {}),
    you: inc.you.map(normalizeStr),
    ...(inc.youFootnote ? { youFootnote: normalizeStr(inc.youFootnote) } : {}),
    weLabel: normalizeStr(inc.weLabel),
    ...(inc.wePill ? { wePill: normalizeStr(inc.wePill) } : {}),
    ...(inc.weSubhead ? { weSubhead: normalizeStr(inc.weSubhead) } : {}),
    ...(inc.weBody ? { weBody: normalizeStr(inc.weBody) } : {}),
    we: inc.we.map(normalizeStr),
    footnote: normalizeStr(inc.footnote),
  }

  const publishedPatched = await patchDocIfExists(PUBLISHED_ID, { included })
  const draftPatched = await patchDocIfExists(DRAFT_ID, { included })

  console.log(
    [
      `included set: ${included.you.length} you items, ${included.we.length} we items`,
      `published (${PUBLISHED_ID}): ${publishedPatched ? 'patched' : 'not found (skipped)'}`,
      `draft (${DRAFT_ID}): ${draftPatched ? 'patched' : 'none present'}`,
    ].join('\n'),
  )

  if (!publishedPatched && !draftPatched) {
    throw new Error(
      'No Philippines locationPage document found to patch. Run `npm run static:seed-location-pages` first.',
    )
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

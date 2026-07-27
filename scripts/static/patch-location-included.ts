import 'dotenv/config'

import { sanityWriteClient } from '@/lib/content/sanity-write-client'

import {
  EASTERN_EUROPE_CONTENT,
  LATAM_CONTENT,
  PHILIPPINES_CONTENT,
  type LocationContent,
} from '../../site/src/components/templates/location/content'

// Narrow, idempotent patch for one locationPage document's `included` block.
// It never replaces a whole document. Run once per slug so each invocation has
// a one-document blast radius (plus that document's draft, when one exists).
//
// Run:
//   npm run static:patch-location-included -- --slug latam-developers
//   npm run static:patch-location-included -- --slug eastern-europe-developers
//
// Token: SANITY_MIGRATION_WRITE_TOKEN

const CONTENT_BY_SLUG: Record<string, LocationContent> = {
  [LATAM_CONTENT.slug]: LATAM_CONTENT,
  [EASTERN_EUROPE_CONTENT.slug]: EASTERN_EUROPE_CONTENT,
  [PHILIPPINES_CONTENT.slug]: PHILIPPINES_CONTENT,
}

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function normalize(value: string): string {
  return value.replace(/—/g, ', ').replace(/–/g, '-').replace(/[ \t]+/g, ' ').trim()
}

function buildIncluded(content: LocationContent): Record<string, unknown> {
  const included = content.included
  if (!included) throw new Error(`${content.slug} has no included content.`)

  return {
    eyebrow: normalize(included.eyebrow),
    titleLead: normalize(included.titleLead),
    titleAccent: normalize(included.titleAccent),
    youLabel: normalize(included.youLabel),
    ...(included.youSubhead ? { youSubhead: normalize(included.youSubhead) } : {}),
    ...(included.youBody ? { youBody: normalize(included.youBody) } : {}),
    you: included.you.map(normalize),
    ...(included.youFootnote ? { youFootnote: normalize(included.youFootnote) } : {}),
    weLabel: normalize(included.weLabel),
    ...(included.wePill ? { wePill: normalize(included.wePill) } : {}),
    ...(included.weSubhead ? { weSubhead: normalize(included.weSubhead) } : {}),
    ...(included.weBody ? { weBody: normalize(included.weBody) } : {}),
    we: included.we.map(normalize),
    footnote: normalize(included.footnote),
  }
}

async function patchIfPresent(id: string, included: Record<string, unknown>): Promise<boolean> {
  const existing = await sanityWriteClient.getDocument(id)
  if (!existing) return false
  await sanityWriteClient.patch(id).set({ included }).commit()
  return true
}

async function main() {
  const slug = argument('--slug')
  if (!slug || !CONTENT_BY_SLUG[slug]) {
    throw new Error(`Pass --slug with one of: ${Object.keys(CONTENT_BY_SLUG).join(', ')}`)
  }

  const included = buildIncluded(CONTENT_BY_SLUG[slug])
  const publishedId = `locationPage-${slug}`
  const draftId = `drafts.${publishedId}`
  const publishedPatched = await patchIfPresent(publishedId, included)
  const draftPatched = await patchIfPresent(draftId, included)

  console.log(
    [
      `included set for ${slug}`,
      `published (${publishedId}): ${publishedPatched ? 'patched' : 'not found'}`,
      `draft (${draftId}): ${draftPatched ? 'patched' : 'none present'}`,
    ].join('\n'),
  )

  if (!publishedPatched && !draftPatched) {
    throw new Error(`No locationPage document found for ${slug}.`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

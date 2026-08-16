import 'dotenv/config'

import { sanityWriteClient } from '@/lib/content/sanity-write-client'

import { UHE, US_HIRE_ENGINEERS_META } from '../../site/src/components/templates/hire-engineers-market/content.us'
import { UKHE, UK_HIRE_ENGINEERS_META } from '../../site/src/components/templates/hire-engineers-market/content.uk'
import type { HireEngineersMarketContent } from '../../site/src/components/templates/hire-engineers-market/content-types'

// Seed the two Hire Engineers MARKET singletons from the static content that
// already ships with the template, so the documents start out byte-identical to
// what the pages render today. Wiring a page to Sanity should be invisible on
// the day it happens; the only change is that the copy becomes editable.
//
//   hireUsEngineersPage  <- content.us.ts (UHE)   -> /services/hire-us-engineers + /uk/...
//   hireUkEngineersPage  <- content.uk.ts (UKHE)  -> /services/hire-uk-engineers + /uk/...
//
// Run: npm run static:seed-hire-engineers-market
// Token: SANITY_MIGRATION_WRITE_TOKEN
//
// Array members need a stable `_key` and the `_type` their schema member
// declares, or Studio renders them as "unknown type" and drag-reorder breaks.
// Both are stamped here from ARRAY_MEMBER_TYPES rather than by hand, so adding
// a field to the factory does not mean editing keying logic in two places.

const STRUCTURAL_KEYS = new Set(['_ref', '_type', '_key', 'asset'])

// Author-voice rule: no em/en dashes anywhere in seeded copy.
function normalizeStr(s: string): string {
  return s.replace(/—/g, ', ').replace(/–/g, '-')
}

/** Maps a dotted path inside the document to the schema's array member type. */
const ARRAY_MEMBER_TYPES: Record<string, string> = {
  'hero.card.profiles': 'hemProfile',
  'problem.floatCards': 'hemFloatCard',
  'process.stages': 'hemStage',
  'process.brief.requirements': 'hemRequirement',
  'process.code.lines': 'hemCodeLine',
  'process.code.rail': 'hemImageSlot',
  'process.report.scores': 'hemScore',
  'process.funnel.rows': 'hemFunnelRow',
  'differentiators.cards': 'hemDiffCard',
  'faq.items': 'hemFaqItem',
}

/**
 * Normalise copy, and stamp `_key` + `_type` onto object array members.
 * Arrays of plain strings (ticks, stack, claims, tabs) are left alone: Sanity
 * keys those internally and adding wrappers would change their shape.
 */
function prepare(value: unknown, path = ''): unknown {
  if (typeof value === 'string') return normalizeStr(value)
  if (Array.isArray(value)) {
    const memberType = ARRAY_MEMBER_TYPES[path]
    return value.map((item, i) => {
      const prepared = prepare(item, path)
      if (prepared && typeof prepared === 'object' && !Array.isArray(prepared)) {
        return {
          _key: `${path.split('.').pop()}-${i}`,
          ...(memberType ? { _type: memberType } : {}),
          ...(prepared as Record<string, unknown>),
        }
      }
      return prepared
    })
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = STRUCTURAL_KEYS.has(k) ? v : prepare(v, path ? `${path}.${k}` : k)
    }
    return out
  }
  return value
}

function buildDoc(
  id: string,
  title: string,
  content: HireEngineersMarketContent,
  meta: { title: string; description: string },
) {
  const { market, ...sections } = content
  return {
    _id: id,
    _type: id,
    title,
    metaTitle: normalizeStr(meta.title),
    metaDescription: normalizeStr(meta.description),
    market,
    ...(prepare(sections) as Record<string, unknown>),
  }
}

async function main() {
  const docs = [
    buildDoc('hireUsEngineersPage', 'Hire US Engineers Page', UHE, US_HIRE_ENGINEERS_META),
    buildDoc('hireUkEngineersPage', 'Hire UK Engineers Page', UKHE, UK_HIRE_ENGINEERS_META),
  ]

  for (const doc of docs) {
    const faq = (doc.faq as { items?: unknown[] })?.items ?? []
    const stages = (doc.process as { stages?: unknown[] })?.stages ?? []
    console.log(`\n${doc._id}`)
    console.log(`  metaTitle:       ${String(doc.metaTitle).length} chars`)
    console.log(`  metaDescription: ${String(doc.metaDescription).length} chars`)
    console.log(`  process stages:  ${stages.length}`)
    console.log(`  faq items:       ${faq.length}`)
    await sanityWriteClient.createOrReplace(doc)
    console.log(`  createOrReplace OK`)
  }

  console.log('\nBoth market singletons seeded.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

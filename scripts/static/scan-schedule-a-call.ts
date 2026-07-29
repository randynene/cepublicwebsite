/**
 * Find every field in the live dataset whose text contains "schedule a call".
 *
 * Written for the 29 Jul CTA rename ("Schedule a Call" -> "Talk to a human"): code
 * occurrences are greppable, dataset ones are not, and guessing which fields exist
 * would have meant either missing the sitewide header CTA or silently rewriting six
 * indexed page titles. This walks every published document and reports the exact
 * document id and patch path for each hit, split into what is a button label and what
 * is not.
 *
 * Read-only. No token needed - published content is CDN-readable.
 *
 * Usage (from repo root):
 *   npm run static:scan-schedule-a-call
 *   npm run static:scan-schedule-a-call -- "book a call"    # any phrase
 */

import 'dotenv/config'

import { createClient } from '@sanity/client'

const phraseArg = process.argv.slice(2).find((arg) => !arg.startsWith('-'))
const PHRASE = phraseArg ?? 'schedule a call'
/** Collapse whitespace in the phrase so "schedule a call" matches line breaks too. */
const PATTERN = new RegExp(PHRASE.trim().split(/\s+/).join('\\s+'), 'i')

const projectId =
  process.env.SANITY_PROJECT_ID ??
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ??
  'lzbhll1u'
const dataset =
  process.env.SANITY_DATASET ?? process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: true,
})

interface Hit {
  docId: string
  docType: string
  path: string
  value: string
}

/** Portable-text body copy, as opposed to a label a visitor clicks. */
const BODY_COPY_PATHS = /^(content|ctaContent|body|introContent)\b/
/** Page titles and meta - SEO-sensitive, never rename without a decision. */
const SEO_PATHS = /^(metaTitle|metaDescription|title)$/

function classify(hit: Hit): 'label' | 'seo' | 'body' {
  if (BODY_COPY_PATHS.test(hit.path)) return 'body'
  if (SEO_PATHS.test(hit.path)) return 'seo'
  return 'label'
}

function walk(node: unknown, path: string, doc: Record<string, unknown>, hits: Hit[]) {
  if (typeof node === 'string') {
    if (PATTERN.test(node)) {
      hits.push({
        docId: String(doc._id),
        docType: String(doc._type),
        path,
        value: node.trim(),
      })
    }
    return
  }
  if (Array.isArray(node)) {
    node.forEach((item, index) => {
      // Prefer _key over index: an index is meaningless as a patch path because
      // Sanity arrays reorder, whereas _key is stable and is what a patch must use.
      const key =
        item && typeof item === 'object' && '_key' in item
          ? (item as { _key?: string })._key
          : undefined
      const segment = key ? `[_key=="${key}"]` : `[${index}]`
      walk(item, `${path}${segment}`, doc, hits)
    })
    return
  }
  if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      if (key.startsWith('_')) continue
      walk(value, path ? `${path}.${key}` : key, doc, hits)
    }
  }
}

async function main() {
  console.log(`Scanning ${dataset} for "${PHRASE}"\n`)

  const docs = await client.fetch<Record<string, unknown>[]>(
    `*[!(_id in path("drafts.**"))]`,
  )
  console.log(`${docs.length} published documents scanned.`)

  const hits: Hit[] = []
  for (const doc of docs) walk(doc, '', doc, hits)
  hits.sort((a, b) => a.docId.localeCompare(b.docId) || a.path.localeCompare(b.path))

  const groups = {
    label: [] as Hit[],
    seo: [] as Hit[],
    body: [] as Hit[],
  }
  for (const hit of hits) groups[classify(hit)].push(hit)

  const headings = {
    label: 'BUTTON / LABEL fields — safe to rename',
    seo: 'TITLE / META fields — SEO-sensitive, needs a decision',
    body: 'BODY COPY (portable text) — editorial, held for live parity',
  } as const

  for (const kind of ['label', 'seo', 'body'] as const) {
    const group = groups[kind]
    console.log(`\n=== ${headings[kind]} (${group.length}) ===`)
    for (const hit of group) {
      console.log(`  ${hit.docId}  (${hit.docType})`)
      console.log(`    ${hit.path || '(root)'}`)
      console.log(`    "${hit.value.slice(0, 100)}"`)
    }
  }

  console.log(`\n${hits.length} field(s) total.`)
}

main().catch((err) => {
  console.error('\nFAIL:', err)
  process.exit(1)
})

// Probe — diagnose rich-text rendering gaps surfaced during HALT 3 pre-flight
// URL spot-check. Focuses on:
//   1. Table blocks (any _type or block-style indicating tabular content)
//   2. Quote-callout blocks (blockquote vs custom callout types)
//   3. The specific onboarding-latam URL Jake reported the table on
//
// Read-only. Mirrors the diagnostic pattern in probe-content-block-types.ts.

import { createClient } from '@sanity/client'

import { env, ensureSanity } from '@/lib/env'

ensureSanity()

const c = createClient({
  projectId: env.SANITY_PROJECT_ID,
  dataset: env.SANITY_DATASET,
  apiVersion: '2024-01-01',
  useCdn: false,
  token: env.SANITY_API_TOKEN,
  perspective: 'published',
})

type Block = { _type: string; style?: string; _key?: string; [k: string]: unknown }

async function main() {
  // ---------------------------------------------------------------
  // 1. Locate the onboarding-latam doc — Jake reported the URL but
  //    localhost 404s, so the slug may be elsewhere.
  // ---------------------------------------------------------------
  console.log('=== STEP 1 — Locate onboarding-latam doc(s) ===')
  type SlugHit = { _id: string; slug: string | null; categorySlug: string | null; title: string }
  const matches = await c.fetch<SlugHit[]>(
    `*[_type == "blogPost" && (
       slug.current match "*onboarding-latam*" ||
       slug.current match "*latam*" ||
       title match "*LATAM*" ||
       title match "*onboarding*"
     )]{
       _id, "slug": slug.current, "categorySlug": category->slug.current, title
     } | order(slug asc)`,
  )
  if (matches.length === 0) {
    console.log('  (no matches — slug not in Sanity dataset under any category)')
  } else {
    for (const m of matches) {
      console.log(
        `  ${m.categorySlug ?? '(null-cat)'}/${m.slug ?? '(null-slug)'}  —  ${m.title}`,
      )
    }
  }

  // ---------------------------------------------------------------
  // 2. Sitewide _type frequencies across all blogPost.content blocks
  // ---------------------------------------------------------------
  console.log('\n=== STEP 2 — Sitewide blogPost.content _type frequencies ===')
  const sitewide = await c.fetch<{ types: string[] }[]>(
    `*[_type == "blogPost" && defined(content)]{
       "types": content[]._type
     }`,
  )
  const sitewideTypeCounts: Record<string, number> = {}
  for (const doc of sitewide) {
    for (const t of doc.types ?? []) {
      sitewideTypeCounts[t] = (sitewideTypeCounts[t] ?? 0) + 1
    }
  }
  console.log(JSON.stringify(sitewideTypeCounts, null, 2))

  // ---------------------------------------------------------------
  // 3. Block-style frequencies for `_type == "block"` entries
  // ---------------------------------------------------------------
  console.log('\n=== STEP 3 — Sitewide block-style frequencies (blocks only) ===')
  const blockStyles = await c.fetch<{ styles: (string | null)[] }[]>(
    `*[_type == "blogPost" && defined(content)]{
       "styles": content[_type == "block"].style
     }`,
  )
  const styleCounts: Record<string, number> = {}
  for (const doc of blockStyles) {
    for (const s of doc.styles ?? []) {
      const k = s ?? '(undefined)'
      styleCounts[k] = (styleCounts[k] ?? 0) + 1
    }
  }
  console.log(JSON.stringify(styleCounts, null, 2))

  // ---------------------------------------------------------------
  // 4. Hunt for table-shaped types — exact match + fuzzy substring
  // ---------------------------------------------------------------
  console.log('\n=== STEP 4 — Table-shaped blocks: exact-type hunt ===')
  const tableCandidateTypes = Object.keys(sitewideTypeCounts).filter((t) =>
    /table|grid|tabular|cells?|rows?|columns?/i.test(t),
  )
  if (tableCandidateTypes.length === 0) {
    console.log('  (no _type values match table-shape pattern)')
  } else {
    console.log(`  candidate _types: ${tableCandidateTypes.join(', ')}`)
    for (const t of tableCandidateTypes) {
      const samples = await c.fetch<Block[]>(
        `*[_type == "blogPost" && defined(content)]{
           "hits": content[_type == "${t}"][0..1]
         }.hits[]`,
      )
      console.log(`\n  Sample of _type "${t}":`)
      for (const s of samples.slice(0, 2)) console.log(JSON.stringify(s, null, 2))
    }
  }

  // ---------------------------------------------------------------
  // 5. Drill into the longest blogPost — Jake's reported article had a
  //    Checkpoint × Metric × Target table that's currently flowing-text.
  //    The longest doc is "best-staff-augmentation-companies-in-latam-2026"
  //    (170¶). Check its content for any table-like patterns. Also drill
  //    into 5 docs randomly to look for tabular rendering markers.
  // ---------------------------------------------------------------
  console.log('\n=== STEP 5 — Drill: any "Checkpoint" / "Metric" / "Target" / pipe-tabular text in body? ===')
  type ContentDoc = { slug: string | null; categorySlug: string | null; content: Block[] | null }
  const allDocs = await c.fetch<ContentDoc[]>(
    `*[_type == "blogPost" && defined(content)]{
       "slug": slug.current, "categorySlug": category->slug.current, content
     }`,
  )
  // Look for any block whose text concatenation contains "checkpoint" + "metric" + "target" together
  for (const doc of allDocs) {
    const blocks = doc.content ?? []
    const allText = blocks
      .filter((b) => b._type === 'block')
      .map((b) => {
        const children = (b as { children?: Array<{ text?: string }> }).children ?? []
        return children.map((c) => c.text ?? '').join(' ')
      })
      .join(' ')
      .toLowerCase()
    const hits = ['checkpoint', 'metric', 'target', 'productivity curve', 'ramp-up', 'ramp up']
      .filter((kw) => allText.includes(kw))
    if (hits.length >= 3) {
      console.log(`  ${doc.categorySlug}/${doc.slug}  →  matches: ${hits.join(', ')}`)
    }
  }

  // ---------------------------------------------------------------
  // 6. Quote / blockquote sampling — verify blockquote shape +
  //    look for any custom callout / pull-quote _type
  // ---------------------------------------------------------------
  console.log('\n=== STEP 6 — blockquote style frequency + samples ===')
  const blockquoteCount = styleCounts['blockquote'] ?? 0
  console.log(`  blocks with style=="blockquote": ${blockquoteCount}`)
  if (blockquoteCount > 0) {
    const samples = await c.fetch<Block[]>(
      `*[_type == "blogPost" && defined(content)]{
         "hits": content[_type == "block" && style == "blockquote"][0..1]
       }.hits[]`,
    )
    console.log(`\n  First 3 blockquote samples (truncated):`)
    for (const s of samples.slice(0, 3)) {
      const text = ((s as { children?: Array<{ text?: string }> }).children ?? [])
        .map((c) => c.text ?? '')
        .join('')
        .slice(0, 200)
      console.log(`    - "${text}${text.length === 200 ? '...' : ''}"`)
      console.log(`      markDefs: ${JSON.stringify((s as { markDefs?: unknown }).markDefs ?? [])}`)
    }
  }

  // Look for non-block callout/quote _types
  console.log('\n=== STEP 7 — Custom callout / quote _types (non-block) ===')
  const calloutCandidateTypes = Object.keys(sitewideTypeCounts).filter((t) =>
    /quote|callout|aside|pullquote|highlight|note|tldr/i.test(t) && t !== 'block',
  )
  if (calloutCandidateTypes.length === 0) {
    console.log('  (no _type values match callout/quote-shape pattern; quotes live as block-style)')
  } else {
    console.log(`  candidate _types: ${calloutCandidateTypes.join(', ')}`)
    for (const t of calloutCandidateTypes) {
      const samples = await c.fetch<Block[]>(
        `*[_type == "blogPost" && defined(content)]{
           "hits": content[_type == "${t}"][0..1]
         }.hits[]`,
      )
      console.log(`\n  Sample of _type "${t}":`)
      for (const s of samples.slice(0, 2)) console.log(JSON.stringify(s, null, 2))
    }
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

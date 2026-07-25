// Probe — enumerate ALL distinct _type values appearing inside blogPost.content
// PortableText arrays, to surface unknown block types that B3 PortableText
// renderer may not handle (e.g. videoEmbed). Surfaced during HALT 2 visual
// review when inline Vimeo videos did not render.

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

type Block = { _type: string; [k: string]: unknown }

async function main() {
  const sampleSlug =
    '7-benefits-of-outsourcing-web-development-for-startups'

  const sampleBlocks = await c.fetch<Block[]>(
    `*[_type=="blogPost" && slug.current==$slug][0].content`,
    { slug: sampleSlug },
  )

  console.log(`\n=== Sample doc "${sampleSlug}" content block _types ===`)
  const typeCounts: Record<string, number> = {}
  for (const b of sampleBlocks ?? []) {
    typeCounts[b._type] = (typeCounts[b._type] ?? 0) + 1
  }
  console.log(JSON.stringify(typeCounts, null, 2))

  // Drill into non-block / non-image types — these are the unknown ones
  console.log(`\n=== First instance of each non-block / non-image _type ===`)
  const seen = new Set<string>()
  for (const b of sampleBlocks ?? []) {
    if (b._type === 'block') continue
    if (b._type === 'image') continue
    if (seen.has(b._type)) continue
    seen.add(b._type)
    console.log(`\n--- ${b._type} ---`)
    console.log(JSON.stringify(b, null, 2))
  }

  // Sitewide enumeration — _types across all 74 blogPost.content arrays
  console.log(`\n=== Sitewide blogPost.content _type frequencies (all 74 docs) ===`)
  const sitewide = await c.fetch<{ types: string[] }[]>(
    `*[_type=="blogPost" && defined(content)]{
       "types": content[]._type
     }`,
  )
  const sitewideCounts: Record<string, number> = {}
  for (const doc of sitewide) {
    for (const t of doc.types ?? []) {
      sitewideCounts[t] = (sitewideCounts[t] ?? 0) + 1
    }
  }
  console.log(JSON.stringify(sitewideCounts, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

// Throwaway corpus-verification probe — confirms (a) total blogCategory doc
// count vs the assumed-13 in the spot-check task instruction, and (b) the
// actual shape of `tldrSection` so we can tell whether the universal hasTldr
// signal is real or a defined()-false-positive on empty arrays.

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

async function main() {
  const cats = await c.fetch<Array<{ slug: string; name: string }>>(
    `*[_type == "blogCategory"]{ "slug": slug.current, name } | order(slug asc)`,
  )
  console.log(`blogCategory docs in dataset: ${cats.length}`)
  for (const cat of cats) console.log(`  - ${cat.slug} (${cat.name})`)

  // How many blogPosts reference each category?
  const usage = await c.fetch<Array<{ catSlug: string | null; n: number }>>(
    `*[_type == "blogPost" && defined(slug.current)]{
       "catSlug": category->slug.current
     } | { "catSlug": catSlug } | { "groups": array::unique(@) }`,
  )
  // simpler: aggregate manually
  const docs = await c.fetch<Array<{ catSlug: string | null }>>(
    `*[_type == "blogPost" && defined(slug.current)]{ "catSlug": category->slug.current }`,
  )
  const tally: Record<string, number> = {}
  for (const d of docs) {
    const k = d.catSlug ?? '(null)'
    tally[k] = (tally[k] ?? 0) + 1
  }
  console.log(`\nblogPost count per category:`)
  for (const [k, v] of Object.entries(tally).sort()) console.log(`  - ${k}: ${v}`)

  // tldrSection shape sample
  console.log(`\ntldrSection shape (first 3 blogPosts):`)
  type Sample = { slug: string; tldrSection: unknown }
  const samples = await c.fetch<Sample[]>(
    `*[_type == "blogPost" && defined(slug.current)][0..2]{ "slug": slug.current, tldrSection }`,
  )
  for (const s of samples) {
    const t = s.tldrSection
    if (Array.isArray(t)) {
      console.log(`  ${s.slug}: array(len=${t.length})`)
      if (t.length > 0) {
        console.log(`    first: ${JSON.stringify(t[0]).slice(0, 200)}`)
      }
    } else if (t === null || t === undefined) {
      console.log(`  ${s.slug}: ${t === null ? 'null' : 'undefined'}`)
    } else {
      console.log(`  ${s.slug}: ${typeof t} → ${JSON.stringify(t).slice(0, 200)}`)
    }
  }

  // How many have tldrSection with content (length > 0)?
  const withContent = await c.fetch<number>(
    `count(*[_type == "blogPost" && defined(slug.current) && defined(tldrSection) && length(tldrSection) > 0])`,
  )
  const withDefined = await c.fetch<number>(
    `count(*[_type == "blogPost" && defined(slug.current) && defined(tldrSection)])`,
  )
  const total = await c.fetch<number>(
    `count(*[_type == "blogPost" && defined(slug.current)])`,
  )
  console.log(`\nTL;DR coverage: total=${total} defined=${withDefined} nonempty=${withContent}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

// Pick 3 representative blog URLs for Probe 1b targeted capture.
// Criteria:
//   1. Complex — has TL;DR + FAQ + author + inline images
//   2. Medium  — has FAQ but no TL;DR (or has TL;DR but no FAQ)
//   3. Sparse  — has neither TL;DR nor FAQ, no author (worst-case null-author render)

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
  const complex = await c.fetch<unknown[]>(
    `*[_type=="blogPost"
       && defined(tldrSection) && count(tldrSection) > 0
       && defined(faqs) && count(faqs) > 0
       && defined(author)
       && count(content[_type=="image"]) > 0
     ][0...1]{ _id, title, "slug": slug.current, "category": category->slug.current }`,
  )
  const medium = await c.fetch<unknown[]>(
    `*[_type=="blogPost"
       && defined(faqs) && count(faqs) > 0
       && (!defined(tldrSection) || count(tldrSection) == 0)
     ][0...1]{ _id, title, "slug": slug.current, "category": category->slug.current }`,
  )
  const sparse = await c.fetch<unknown[]>(
    `*[_type=="blogPost"
       && (!defined(tldrSection) || count(tldrSection) == 0)
       && (!defined(faqs) || count(faqs) == 0)
       && !defined(author)
     ][0...1]{ _id, title, "slug": slug.current, "category": category->slug.current }`,
  )
  console.log(JSON.stringify({ complex, medium, sparse }, null, 2))
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})

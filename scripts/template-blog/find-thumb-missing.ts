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
  const r = await c.fetch<unknown[]>(
    `*[_type=='blogPost' && !defined(thumbnailImage)]{_id, title, "slug": slug.current, thumbnailImage, openGraphImage}`,
  )
  console.log(JSON.stringify(r, null, 2))
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})

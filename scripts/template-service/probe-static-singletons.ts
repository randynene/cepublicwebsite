/**
 * Read-only Sanity probe — static-page singletons (home, how-it-works, etc.).
 * Reports whether each singleton is populated: hero fields, section count +
 * section _type frequencies, meta fill, hero image. Read-only.
 */
import { createClient } from '@sanity/client'

import { ensureSanity, env } from '@/lib/env'

ensureSanity()

const client = createClient({
  projectId: env.SANITY_PROJECT_ID,
  dataset: env.SANITY_DATASET,
  apiVersion: '2024-01-01',
  useCdn: false,
  token: env.SANITY_API_TOKEN,
  perspective: 'published',
})

type Section = { _type?: string | null }
type Singleton = {
  _id: string
  _type: string
  title?: string | null
  eyebrow?: string | null
  heroDescription?: unknown[] | null
  heroImage?: { asset?: { url?: string | null } | null } | null
  sections?: Section[] | null
  metaTitle?: string | null
  metaDescription?: string | null
} | null

async function probe(type: string): Promise<void> {
  const doc = await client.fetch<Singleton>(
    `*[_type == "${type}" && !(_id match "drafts.*")][0]{
      _id, _type, title, eyebrow, heroDescription,
      heroImage{ asset->{ url } },
      sections[]{ _type },
      metaTitle, metaDescription
    }`,
  )
  console.log(`\n${'='.repeat(60)}`)
  console.log(`${type}`)
  console.log('='.repeat(60))
  if (!doc) {
    console.log('  (NO PUBLISHED DOCUMENT — singleton is empty/unseeded)')
    return
  }
  console.log(`  _id: ${doc._id}`)
  console.log(`  title: ${doc.title ?? '(empty)'}`)
  console.log(`  eyebrow: ${doc.eyebrow ?? '(empty)'}`)
  console.log(
    `  heroDescription: ${Array.isArray(doc.heroDescription) && doc.heroDescription.length ? `${doc.heroDescription.length} blocks` : '(empty)'}`,
  )
  console.log(`  heroImage: ${doc.heroImage?.asset?.url ?? '(empty)'}`)
  const sections = Array.isArray(doc.sections) ? doc.sections : []
  console.log(`  sections: ${sections.length}`)
  const freq = new Map<string, number>()
  for (const s of sections) {
    const t = s._type ?? '(null)'
    freq.set(t, (freq.get(t) ?? 0) + 1)
  }
  for (const [t, c] of [...freq.entries()]) console.log(`     ${t}: ${c}`)
  console.log(`  metaTitle: ${doc.metaTitle ?? '(empty)'}`)
  console.log(`  metaDescription: ${doc.metaDescription ? 'present' : '(empty)'}`)
}

async function main(): Promise<void> {
  console.log(`Dataset: ${env.SANITY_DATASET} — READ ONLY static-singleton probe`)
  for (const t of ['homePage', 'howItWorksPage']) await probe(t)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

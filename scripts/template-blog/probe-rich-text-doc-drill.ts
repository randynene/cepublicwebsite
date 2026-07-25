// Probe — drill into ONE specific blogPost doc (onboarding-latam) and dump
// every content[] block in order. Identifies (a) where the table SHOULD
// have been (now flowing text or missing) and (b) the blockquote shape.

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

type Block = {
  _type: string
  _key?: string
  style?: string
  children?: Array<{ _type?: string; text?: string; marks?: string[] }>
  markDefs?: Array<{ _type?: string; _key?: string; href?: string }>
  [k: string]: unknown
}

async function main() {
  const slug =
    'onboarding-latam-developers-90-day-ramp-up-timeline-productivity-curve-and-integration-playbook'
  const doc = await c.fetch<{ content: Block[] } | null>(
    `*[_type == "blogPost" && slug.current == $slug][0]{ content }`,
    { slug },
  )
  if (!doc || !doc.content) {
    console.log(`NOT FOUND in Sanity: ${slug}`)
    return
  }

  console.log(`Doc has ${doc.content.length} content blocks. Dumping in order:\n`)
  doc.content.forEach((b, i) => {
    const text = (b.children ?? []).map((c) => c.text ?? '').join('')
    const preview = text.length > 180 ? text.slice(0, 180) + '...' : text
    const meta = `[${i}] _type=${b._type}${b.style ? ` style=${b.style}` : ''}`
    if (b._type === 'block') {
      console.log(`${meta}: ${JSON.stringify(preview)}`)
    } else {
      console.log(`${meta}: ${JSON.stringify(b).slice(0, 300)}`)
    }
  })

  // Targeted look: blocks containing "Checkpoint" or "Week 1" etc — the table data
  console.log(`\n=== TABLE-DATA HUNT ===`)
  const tableKeywords = ['Checkpoint', 'Week 1-2', 'Week 3-4', 'Week 5-8', 'Week 9-12', 'Yes/No checklist', 'Story points vs', 'Sprint velocity vs', 'Feature ownership']
  doc.content.forEach((b, i) => {
    const text = (b.children ?? []).map((c) => c.text ?? '').join('')
    const hits = tableKeywords.filter((kw) => text.includes(kw))
    if (hits.length > 0) {
      console.log(`  block[${i}] _type=${b._type} style=${b.style}  → hits: ${hits.join(', ')}`)
      console.log(`    text: ${JSON.stringify(text.slice(0, 300))}`)
    }
  })

  // Targeted look: blockquote blocks — show full content
  console.log(`\n=== BLOCKQUOTE BLOCKS (full dump) ===`)
  doc.content.forEach((b, i) => {
    if (b._type === 'block' && b.style === 'blockquote') {
      console.log(`\n  block[${i}]:`)
      console.log(JSON.stringify(b, null, 2))
    }
  })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

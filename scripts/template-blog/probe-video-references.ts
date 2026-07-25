// Probe — find any Vimeo / YouTube / Loom / Wistia URL references inside
// blogPost.content, regardless of how they're encoded (block markDef link
// annotations, span text containing URLs, embedded iframes serialised as
// text, etc.). Surface the actual storage shape so HALT 2 can render them.

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

const VIDEO_HOSTS = /(vimeo\.com|youtu\.be|youtube\.com|loom\.com|wistia\.com|wistia\.net)/i

async function main() {
  const docs = await c.fetch<
    { _id: string; slug: string; content: unknown[] }[]
  >(
    `*[_type=="blogPost" && defined(content)]{
      _id,
      "slug": slug.current,
      content
    }`,
  )

  console.log(`Scanning ${docs.length} blogPosts for video-host references…\n`)

  const hits: Array<{
    slug: string
    via: string
    sample: string
  }> = []

  for (const doc of docs) {
    for (const blk of doc.content ?? []) {
      const blkAny = blk as Record<string, unknown>
      // Path A: markDef annotations of type=link with href pointing to a
      // video host.
      const markDefs = Array.isArray(blkAny.markDefs)
        ? (blkAny.markDefs as Array<{ _type?: string; href?: string }>)
        : []
      for (const md of markDefs) {
        if (md._type === 'link' && md.href && VIDEO_HOSTS.test(md.href)) {
          hits.push({
            slug: doc.slug,
            via: 'markDef.link.href',
            sample: md.href,
          })
        }
      }
      // Path B: child span text containing a video URL (the legacy / raw
      // pattern — Webflow HTML import sometimes leaves URLs as plain text).
      const children = Array.isArray(blkAny.children)
        ? (blkAny.children as Array<{ text?: string }>)
        : []
      for (const ch of children) {
        if (ch.text && VIDEO_HOSTS.test(ch.text)) {
          hits.push({
            slug: doc.slug,
            via: 'span.text',
            sample: ch.text.slice(0, 160),
          })
        }
      }
    }
  }

  console.log(`Found ${hits.length} video-host references across the dataset.\n`)
  // De-dup and show first 25
  const seen = new Set<string>()
  for (const h of hits) {
    const key = `${h.slug}|${h.via}|${h.sample}`
    if (seen.has(key)) continue
    seen.add(key)
    console.log(JSON.stringify(h))
    if (seen.size >= 25) break
  }

  console.log(
    `\nUnique-by-slug docs with at least one video reference: ${new Set(hits.map((h) => h.slug)).size}`,
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

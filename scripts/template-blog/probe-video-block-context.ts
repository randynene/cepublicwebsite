// Probe — for blocks that contain a video-host link annotation, show the
// FULL block shape so we know what text the link wraps and the surrounding
// editorial context. Drives the HALT 2 inline-video rendering decision:
// is this a text link (current state) or should it lift to an inline
// embedded player?

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

const VIDEO_HOSTS =
  /(vimeo\.com|youtu\.be|youtube\.com|loom\.com|wistia\.com|wistia\.net)/i

async function main() {
  // Pull the doc Jake referenced + the brief canonical sample
  const slugs = [
    '7-benefits-of-outsourcing-web-development-for-startups',
    'what-is-staff-augmentation',
    'best-staff-augmentation-companies-in-latin-america-2026-a-ranked-comparison',
  ]

  for (const slug of slugs) {
    console.log(`\n========================================`)
    console.log(`SLUG: ${slug}`)
    console.log(`========================================`)
    const content = await c.fetch<unknown[]>(
      `*[_type=="blogPost" && slug.current==$slug][0].content`,
      { slug },
    )
    let videoBlockCount = 0
    for (const blk of content ?? []) {
      const blkAny = blk as Record<string, unknown>
      const markDefs = Array.isArray(blkAny.markDefs)
        ? (blkAny.markDefs as Array<{ _type?: string; href?: string; _key?: string }>)
        : []
      const videoMarks = markDefs.filter(
        (md) => md._type === 'link' && md.href && VIDEO_HOSTS.test(md.href),
      )
      if (videoMarks.length > 0) {
        videoBlockCount += 1
        console.log(`\n--- BLOCK WITH VIDEO LINK ---`)
        console.log(JSON.stringify(blkAny, null, 2))
      }
    }
    console.log(
      `\n  → ${videoBlockCount} blocks containing video-host link annotations`,
    )
  }

  // Also: enumerate distinct video HOSTS sitewide
  console.log(`\n========================================`)
  console.log(`DISTINCT VIDEO HOSTS sitewide`)
  console.log(`========================================`)
  const all = await c.fetch<{ markDefs: Array<{ _type?: string; href?: string }> }[]>(
    `*[_type=="blogPost"]{
       "markDefs": content[]{markDefs}.markDefs[]
     }`,
  )
  const hosts = new Set<string>()
  for (const doc of all) {
    const mds = doc.markDefs ?? []
    for (const md of mds) {
      if (md && md._type === 'link' && md.href && VIDEO_HOSTS.test(md.href)) {
        try {
          const u = new URL(md.href)
          hosts.add(u.hostname)
        } catch {
          /* ignore malformed */
        }
      }
    }
  }
  console.log(JSON.stringify([...hosts].sort(), null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

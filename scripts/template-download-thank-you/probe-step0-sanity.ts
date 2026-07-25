/**
 * TEMPLATE-DOWNLOAD-THANK-YOU Step 0 — read-only Sanity probe.
 * downloadAccess is a thin private lead-magnet type (name, slug, downloadFileLink).
 * Rendered at /download-thank-you/[slug] with noindex. Read-only. No mutation.
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

type Row = {
  _id: string
  name?: string | null
  slug?: string | null
  downloadFileLink?: string | null
}

async function main(): Promise<void> {
  const docs = await client.fetch<Row[]>(
    `*[_type == "downloadAccess" && !(_id match "drafts.*")] | order(name asc) {
      _id, name, "slug": slug.current, downloadFileLink
    }`,
  )
  const total = docs.length
  console.log(`\n=== TEMPLATE-DOWNLOAD-THANK-YOU Step 0 — Sanity probe ===`)
  console.log(`Dataset: ${env.SANITY_DATASET} | Total downloadAccess docs: ${total}`)

  const withName = docs.filter((d) => d.name?.trim()).length
  const withSlug = docs.filter((d) => d.slug?.trim()).length
  const withLink = docs.filter((d) => d.downloadFileLink?.trim()).length
  console.log(`\nField fill:`)
  console.log(`  name             ${withName}/${total}`)
  console.log(`  slug             ${withSlug}/${total}`)
  console.log(`  downloadFileLink ${withLink}/${total}`)

  const hosts = new Map<string, number>()
  for (const d of docs) {
    if (!d.downloadFileLink) continue
    let h = 'invalid'
    try {
      h = new URL(d.downloadFileLink).hostname.replace(/^www\./, '')
    } catch {
      h = 'invalid-url'
    }
    hosts.set(h, (hosts.get(h) ?? 0) + 1)
  }
  console.log(`\ndownloadFileLink hosts:`)
  for (const [h, c] of [...hosts.entries()].sort()) console.log(`  ${h}: ${c}`)

  console.log(`\nAll docs:`)
  for (const d of docs) {
    console.log(`  /download-thank-you/${d.slug}  name="${d.name}"  link=${d.downloadFileLink}`)
  }

  const slugPick = docs.find((d) => d.name && d.slug && d.downloadFileLink) ?? docs[0]
  console.log(`\nRecommended QA slug: ${slugPick?.slug ?? '(none)'} — "${slugPick?.name ?? ''}"`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

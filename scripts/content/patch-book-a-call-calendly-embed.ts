// One-shot patch — repopulates bookACall.calendlyEmbed from live Webflow
// calendly-embed RichText. CONTENT-1B migrator lost script-based Calendly
// widgets (only iframe/table shapes survived toPortableText).
//
// Jake runs after review:
//   npx tsx scripts/content/patch-book-a-call-calendly-embed.ts
//
// Dry-run (no writes):
//   DRY_RUN=1 npx tsx scripts/content/patch-book-a-call-calendly-embed.ts

import { ensureSanity, ensureWebflow } from '@/lib/env'
import { CE_COLLECTION_IDS } from '@/lib/content/ce-collection-ids'
import { sanityWriteClient } from '@/lib/content/sanity-write-client'
import { getCollectionItems } from '@/lib/content/webflow-read-client'

ensureSanity()
ensureWebflow()

const DRY_RUN = process.env.DRY_RUN === '1'

function extractEmbedUrl(html: string): string | null {
  const iframeSrc = html.match(/<iframe[^>]+src=["']([^"']+)["']/i)?.[1]
  if (iframeSrc?.trim()) return iframeSrc.trim()

  const dataSrc = html.match(/data-src=["']([^"']+)["']/i)?.[1]
  if (dataSrc?.trim()) return dataSrc.trim()

  const calendly = html.match(/https?:\/\/calendly\.com[^\s"'<>]+/i)?.[0]
  if (calendly) return calendly

  const hubspot = html.match(/https?:\/\/meetings\.hubspot\.com[^\s"'<>]+/i)?.[0]
  if (hubspot) return hubspot

  return null
}

async function main(): Promise<void> {
  const items = await getCollectionItems(CE_COLLECTION_IDS.bookACall)
  let patched = 0
  let skipped = 0

  for (const item of items) {
    const f = item.fieldData
    const firstName = f['name'] as string
    const docId = `bookACall-${item.id}`
    const html = String(f['calendly-embed'] ?? '')
    const url = extractEmbedUrl(html)

    if (!url) {
      console.warn(`[skip] ${firstName} (${docId}) — no embed URL in Webflow HTML`)
      skipped++
      continue
    }

    const calendlyEmbed = [
      {
        _type: 'videoEmbed',
        _key: `embed-${item.id}`,
        url,
        caption: firstName,
      },
    ]

    console.log(`${DRY_RUN ? '[dry-run]' : '[patch]'} ${firstName} → ${url}`)

    if (!DRY_RUN) {
      await sanityWriteClient
        .patch(docId)
        .set({ calendlyEmbed })
        .commit()
    }
    patched++
  }

  console.log(
    `\nDone. Patched: ${patched}, skipped: ${skipped}, dry-run: ${DRY_RUN}`,
  )
  if (skipped > 0) process.exitCode = 1
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

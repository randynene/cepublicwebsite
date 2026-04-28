// Migrates the Webflow `tools` collection into Sanity `tool`
// documents. Field mapping per WEBFLOW_TO_SANITY_FIELD_MAP §11 with
// the CONTENT-1B brief correction (Jake-approved 2026-04-28):
// - FAQ question slugs are `faq-header-1..10` (not `faq-title-1..10`).
//
// SECURITY (§3.13 / D3): Culture Match `hidden-code` contains
// embedded JS with API keys. Strip them before writing to Sanity. If
// stripping outcome is uncertain, write null and warn loudly.
import { ensureSanity, ensureWebflow } from '@/lib/env'
import { CE_COLLECTION_IDS } from '@/lib/content/ce-collection-ids'
import {
  extractUrl,
  toPortableText,
  toRefs,
  uploadImage,
  webflowSlug,
} from '@/lib/content/migration-helpers'
import { recordMigration } from '@/lib/content/migration-tracker'
import { sanityWriteClient } from '@/lib/content/sanity-write-client'
import { getCollectionItems } from '@/lib/content/webflow-read-client'

ensureSanity()
ensureWebflow()

// Conservative regex pair — replaces "key": "..." and "api": "..." style
// JS object literals with [REDACTED]. Both single- and double-quoted
// variants of the property name and value are covered.
function stripApiKeys(html: string | null): {
  cleaned: string | null
  modified: boolean
  uncertain: boolean
} {
  if (!html) return { cleaned: null, modified: false, uncertain: false }
  const before = html
  let cleaned = html
    .replace(/(['"])key\1\s*:\s*(['"])[^'"]+\2/g, '"key": "[REDACTED]"')
    .replace(/(['"])api\s*\1\s*:\s*(['"])[^'"]+\2/g, '"api": "[REDACTED]"')

  // Heuristic: any other long opaque string literal that looks like a
  // key/secret/token? If so, mark uncertain so we drop the field.
  const opaqueLong =
    /(['"])(?:secret|token|access_token|client_secret|x-api-key)\1\s*:\s*(['"])[^'"]+\2/i.test(
      cleaned,
    )
  return {
    cleaned,
    modified: cleaned !== before,
    uncertain: opaqueLong,
  }
}

async function migrateTools(): Promise<void> {
  const items = await getCollectionItems(CE_COLLECTION_IDS.toolsQuizzes)
  let migrated = 0
  const errors: string[] = []

  for (const item of items) {
    try {
      const f = item.fieldData

      const faqs = Array.from({ length: 10 }, (_, i) => i + 1)
        .map((n) => ({
          _key: `faq-${n}`,
          question: (f[`faq-header-${n}`] as string) ?? null,
          answer: toPortableText(f[`faq-answer-${n}`]),
        }))
        .filter((faq) => faq.question)

      const rawHidden = (f['hidden-code'] as string) ?? null
      const { cleaned, modified, uncertain } = stripApiKeys(rawHidden)
      if (modified) {
        console.warn(`[tool ${item.id}] hidden-code: API key stripped to [REDACTED]`)
      }
      let hiddenCode: unknown[] = []
      if (uncertain) {
        console.warn(
          `WARN: hiddenCode omitted — API key stripping uncertain for tool ${item.id}`,
        )
        hiddenCode = []
      } else if (cleaned) {
        hiddenCode = toPortableText(cleaned)
      }

      const doc = {
        _id: `tool-${item.id}`,
        _type: 'tool',
        name: f['name'] as string,
        slug: { _type: 'slug', current: webflowSlug(item) },
        subHeader: (f['sub-header'] as string) ?? null,
        headerBlurb: toPortableText(f['header-blurb']),
        description: toPortableText(f['description']),
        button1Text: (f['button-1-text'] as string) ?? null,
        button1Link: extractUrl(f['button-1-link']),
        button2Text: (f['button-2-text'] as string) ?? null,
        button2Link: extractUrl(f['button-2-link']),
        toolEmbed: toPortableText(f['tool-embed']),
        hiddenCode,
        videoOverview: toPortableText(f['video-overview']),
        faqs,
        thumbnail: await uploadImage(f['thumbnail']),
        metaTitle: (f['meta-title'] as string) ?? null,
        metaDescription: (f['blurbs'] as string) ?? null,
        tags: toRefs(f['tags'], 'tag'),
        featured: (f['featured'] as boolean) ?? false,
        locale: 'default',
      }
      await sanityWriteClient.createOrReplace(doc)
      migrated++
      console.log(`✓ tool: ${doc.name}`)
    } catch (err) {
      const msg = `Failed tool ${item.id}: ${err instanceof Error ? err.message : String(err)}`
      errors.push(msg)
      console.error(`✗ ${msg}`)
    }
  }

  await recordMigration({
    collectionSlug: 'tools',
    sourceItemCount: items.length,
    migratedItemCount: migrated,
    status: errors.length === 0 ? 'complete' : 'failed',
    errorLog: errors,
  })

  console.log(`\nTools: ${migrated}/${items.length} migrated. Errors: ${errors.length}`)
  if (errors.length > 0) process.exit(1)
}

migrateTools().catch((err) => {
  console.error(err)
  process.exit(1)
})

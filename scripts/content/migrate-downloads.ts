// Migrates the Webflow `download` collection into Sanity `download`
// documents. Field mapping per WEBFLOW_TO_SANITY_FIELD_MAP §9 with the
// CONTENT-1B brief correction (Jake-approved 2026-04-28):
// - The Sanity `metaThumbnail` field reads from Webflow `meta-thunbnail`
//   (Webflow's typo — sic). The brief's `open-graph-wide-image` slug
//   does not exist on this collection.
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

async function migrateDownloads(): Promise<void> {
  const items = await getCollectionItems(CE_COLLECTION_IDS.downloads)
  let migrated = 0
  const errors: string[] = []

  for (const item of items) {
    try {
      const f = item.fieldData

      const youllGet = [
        f['you-ll-get-tag--1'],
        f['you-ll-get-tag--2'],
        f['you-ll-get-tag--3'],
      ]
        .filter(Boolean)
        .map(String)

      const faqs = Array.from({ length: 6 }, (_, i) => i + 1)
        .map((n) => ({
          _key: `faq-${n}`,
          question: (f[`faq-title---${n}`] as string) ?? null,
          answer: toPortableText(f[`faq-answer---${n}`]),
        }))
        .filter((faq) => faq.question)

      const doc = {
        _id: `download-${item.id}`,
        _type: 'download',
        name: f['name'] as string,
        slug: { _type: 'slug', current: webflowSlug(item) },
        title: (f['title'] as string) ?? null,
        featured: (f['featured'] as boolean) ?? false,
        comingSoon: (f['coming-soon'] as boolean) ?? false,
        tags: toRefs(f['tags'], 'tag'),
        mainDescription: toPortableText(f['main-description']),
        headerFooterImage: await uploadImage(f['benefits-image']),
        button1Text: (f['button-text---1'] as string) ?? null,
        button1Link: extractUrl(f['button-link---1']),
        button2Text: (f['button-text---2'] as string) ?? null,
        button2Link: extractUrl(f['button-link---2']),
        youllGet,
        howToUseIt: {
          videoThumbnail: await uploadImage(f['how-to-use-it-video-thumbnail']),
          videoUrl: extractUrl(f['how-to-use-it-video-link']),
          title: (f['how-to-use-it-title'] as string) ?? null,
          description: toPortableText(f['how-to-use-it-description']),
        },
        theImpact: {
          image: await uploadImage(f['thumbnail-image']),
          title: (f['benefits-title'] as string) ?? null,
          description: toPortableText(f['the-impact-description']),
        },
        faqs,
        getItNow: {
          title: (f['get-it-now-title'] as string) ?? null,
          description: toPortableText(f['get-it-now-description']),
        },
        metaTitle: (f['meta-title'] as string) ?? null,
        metaDescription: (f['meta-description'] as string) ?? null,
        metaThumbnail: await uploadImage(f['meta-thunbnail']),
        hubspotFormId: (f['hubspot-form-id'] as string) ?? null,
        locale: 'default',
      }
      await sanityWriteClient.createOrReplace(doc)
      migrated++
      console.log(`✓ download: ${doc.name}`)
    } catch (err) {
      const msg = `Failed download ${item.id}: ${err instanceof Error ? err.message : String(err)}`
      errors.push(msg)
      console.error(`✗ ${msg}`)
    }
  }

  await recordMigration({
    collectionSlug: 'downloads',
    sourceItemCount: items.length,
    migratedItemCount: migrated,
    status: errors.length === 0 ? 'complete' : 'failed',
    errorLog: errors,
  })

  console.log(`\nDownloads: ${migrated}/${items.length} migrated. Errors: ${errors.length}`)
  if (errors.length > 0) process.exit(1)
}

migrateDownloads().catch((err) => {
  console.error(err)
  process.exit(1)
})

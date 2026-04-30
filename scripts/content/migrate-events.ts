// Migrates the Webflow `events` collection into Sanity `event`
// documents. Field mapping per WEBFLOW_TO_SANITY_FIELD_MAP §13 with
// the CONTENT-1B brief corrections (Jake-approved 2026-04-28):
// - `header-description---post-event` (three dashes, not one).
// - Webflow `speakers-header` is dropped — there is no Sanity
//   destination for it on the current `event` schema.
// - topics.items[] filter is `t.title && t.description` (both required
//   per the Sanity topicItem sub-schema), not `t.title || t.description`.
import { ensureSanity, ensureWebflow } from '@/lib/env'
import { CE_COLLECTION_IDS } from '@/lib/content/ce-collection-ids'
import {
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

async function migrateEvents(): Promise<void> {
  const items = await getCollectionItems(CE_COLLECTION_IDS.eventsWebinars)
  let migrated = 0
  const errors: string[] = []

  for (const item of items) {
    try {
      const f = item.fieldData

      const topicsItems = [1, 2, 3, 4]
        .map((n) => ({
          _key: `topic-${n}`,
          title: (f[`topics-section---title-${n}`] as string) ?? null,
          description:
            (f[`topics-section---description-${n}`] as string) ?? null,
        }))
        .filter((t): t is { _key: string; title: string; description: string } =>
          Boolean(t.title && t.description),
        )

      const eventTypeId = f['event-type']
      const eventTypeRef =
        typeof eventTypeId === 'string' && eventTypeId.trim() !== ''
          ? { _type: 'reference', _ref: `tag-${eventTypeId}` }
          : null

      const doc = {
        _id: `event-${item.id}`,
        _type: 'event',
        name: f['name'] as string,
        slug: { _type: 'slug', current: webflowSlug(item) },
        dateTime: (f['date-time'] as string) ?? null,
        headerDescription: await toPortableText(f['header-description']),
        headerDescriptionPostEvent: await toPortableText(
          f['header-description---post-event'],
        ),
        headerButtonText: (f['header-button-text'] as string) ?? null,
        featuredImage: await uploadImage(f['featured-image']),
        thumbnailImage: await uploadImage(f['thumbnail-image']),
        topics: {
          header: (f['topics-header'] as string) ?? null,
          description: await toPortableText(f['topics-description']),
          items: topicsItems,
        },
        speakers: toRefs(f['speakers'], 'teamMember'),
        signUp: {
          header: (f['sign-up-header'] as string) ?? null,
          description: await toPortableText(f['sign-up-description']),
          formEmbed: await toPortableText(f['sign-up-form-embed']),
        },
        onDemandEmbedDescription: await toPortableText(
          f['on-demand-embed-description'],
        ),
        eventType: eventTypeRef,
        eventCategory: toRefs(f['event-category'], 'tag'),
        metaTitle: (f['meta-title'] as string) ?? null,
        metaDescription: (f['meta-description'] as string) ?? null,
        locale: 'default',
      }
      await sanityWriteClient.createOrReplace(doc)
      migrated++
      console.log(`✓ event: ${doc.name}`)
    } catch (err) {
      const msg = `Failed event ${item.id}: ${err instanceof Error ? err.message : String(err)}`
      errors.push(msg)
      console.error(`✗ ${msg}`)
    }
  }

  await recordMigration({
    collectionSlug: 'events',
    sourceItemCount: items.length,
    migratedItemCount: migrated,
    status: errors.length === 0 ? 'complete' : 'failed',
    errorLog: errors,
  })

  console.log(`\nEvents: ${migrated}/${items.length} migrated. Errors: ${errors.length}`)
  if (errors.length > 0) process.exit(1)
}

migrateEvents().catch((err) => {
  console.error(err)
  process.exit(1)
})

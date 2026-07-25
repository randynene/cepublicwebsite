// Migrates the Webflow `team` collection into Sanity `teamMember`
// documents. Field mapping per WEBFLOW_TO_SANITY_FIELD_MAP §6 with the
// CONTENT-1B brief slug corrections (Jake-approved 2026-04-28):
//   - image is on `team-member` (not `team-member-image`)
//   - tenure is on `time-at-cloudemployee` (not `time-at-cloud-employee`)
//   - linkedin-link / book-a-call-link are plain strings, handled by the
//     loosened extractUrl helper.
import { ensureSanity, ensureWebflow } from '@/lib/env'
import { CE_COLLECTION_IDS } from '@/lib/content/ce-collection-ids'
import {
  extractUrl,
  filterToMissingBySlug,
  onlyMissingRequested,
  toPortableText,
  uploadImage,
  webflowSlug,
} from '@/lib/content/migration-helpers'
import { recordMigration } from '@/lib/content/migration-tracker'
import { sanityWriteClient } from '@/lib/content/sanity-write-client'
import { getCollectionItems } from '@/lib/content/webflow-read-client'

ensureSanity()
ensureWebflow()

async function migrateTeamMembers(): Promise<void> {
  const all = await getCollectionItems(CE_COLLECTION_IDS.teamMembers)
  const items = onlyMissingRequested() ? await filterToMissingBySlug(all, 'teamMember') : all
  if (onlyMissingRequested()) {
    console.log(`--only-missing: ${items.length} of ${all.length} item(s) not yet in Sanity.`)
  }
  let migrated = 0
  const errors: string[] = []

  for (const item of items) {
    try {
      const f = item.fieldData
      const doc = {
        _id: `teamMember-${item.id}`,
        _type: 'teamMember',
        name: f['name'] as string,
        slug: { _type: 'slug', current: webflowSlug(item) },
        order: (f['order'] as number) ?? null,
        position: (f['position'] as string) ?? null,
        teamMemberImage: await uploadImage(f['team-member']),
        aboutContent: await toPortableText(f['about-content']),
        timeAtCloudEmployee: (f['time-at-cloudemployee'] as string) ?? null,
        areasOfExpertise: await toPortableText(f['areas-of-expertise']),
        linkedinLink: extractUrl(f['linkedin-link']),
        bookACallLink: extractUrl(f['book-a-call-link']),
        hideFromTeamAboutPage: (f['hide-from-team-about-page'] as boolean) ?? false,
      }
      await sanityWriteClient.createOrReplace(doc)
      migrated++
      console.log(`✓ teamMember: ${doc.name}`)
    } catch (err) {
      const msg = `Failed teamMember ${item.id}: ${err instanceof Error ? err.message : String(err)}`
      errors.push(msg)
      console.error(`✗ ${msg}`)
    }
  }

  await recordMigration({
    collectionSlug: 'team-members',
    sourceItemCount: items.length,
    migratedItemCount: migrated,
    status: errors.length === 0 ? 'complete' : 'failed',
    errorLog: errors,
  })

  console.log(`\nTeam Members: ${migrated}/${items.length} migrated. Errors: ${errors.length}`)
  if (errors.length > 0) process.exit(1)
}

migrateTeamMembers().catch((err) => {
  console.error(err)
  process.exit(1)
})

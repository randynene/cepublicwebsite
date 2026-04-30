// Migrates the Webflow `videos` collection into Sanity `video`
// documents. Field mapping per WEBFLOW_TO_SANITY_FIELD_MAP §8 with the
// CONTENT-1B brief corrections (Jake-approved 2026-04-28):
// - `meta-title` is not present on the videos collection — dropped.
// - `type` and `team` are stored as opaque Webflow Option IDs; we
//   resolve them via fetchOptionIdMap() (CONTENT-1A pattern from
//   migrate-benefit-values.ts) before applying TYPE_MAP / TEAM_MAP
//   to camelCase the Sanity enum value.
import { ensureSanity, ensureWebflow } from '@/lib/env'
import { CE_COLLECTION_IDS } from '@/lib/content/ce-collection-ids'
import {
  extractUrl,
  fetchOptionIdMap,
  resolveOption,
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

const TYPE_MAP: Record<string, string> = {
  'Fireside chats': 'firesideChats',
  'Working with us': 'workingWithUs',
  Interviews: 'interviews',
}

const TEAM_MAP: Record<string, string> = {
  'Talent Success Team': 'talentSuccessTeam',
  'Client Success Team': 'clientSuccessTeam',
  'People and Culture Team': 'peopleAndCultureTeam',
  'Engineering Team': 'engineeringTeam',
  'Leadership Team': 'leadershipTeam',
  'Talent Recruitment Team': 'talentRecruitmentTeam',
  'Technical Vetting Team': 'technicalVettingTeam',
  'HR, Compliance and Legal Team': 'hrComplianceAndLegalTeam',
  'Learning & Development Team': 'learningAndDevelopmentTeam',
  'Employee Experience Team': 'employeeExperienceTeam',
}

async function migrateVideos(): Promise<void> {
  const collectionId = CE_COLLECTION_IDS.videos
  const [typeIdMap, teamIdMap] = await Promise.all([
    fetchOptionIdMap(collectionId, 'type'),
    fetchOptionIdMap(collectionId, 'team'),
  ])

  const items = await getCollectionItems(collectionId)
  let migrated = 0
  const errors: string[] = []

  for (const item of items) {
    try {
      const f = item.fieldData
      const doc = {
        _id: `video-${item.id}`,
        _type: 'video',
        name: f['name'] as string,
        slug: { _type: 'slug', current: webflowSlug(item) },
        label: (f['label-short-name-like-talent-retention'] as string) ?? null,
        type: resolveOption(f['type'], typeIdMap, TYPE_MAP, 'type', `video ${item.id}`),
        team: resolveOption(f['team'], teamIdMap, TEAM_MAP, 'team', `video ${item.id}`),
        order: (f['order'] as number) ?? null,
        featured: (f['featured'] as boolean) ?? false,
        mainVideoEmbedLink: extractUrl(f['main-video-embed-link']),
        backgroundVideoPreviewLink:
          (f['background-video-preview-link'] as string) ?? null,
        vimeoYoutubeStandardLink:
          (f['vimeo-youtube-standard-link'] as string) ?? null,
        backupImage: await uploadImage(f['backup-image']),
        descriptionOfVideo: await toPortableText(f['description-of-video']),
        fullVideoTranscript: await toPortableText(f['full-video-transcript']),
        linksMentionedInVideo: await toPortableText(f['links-mentioned-in-video']),
        linkedinProfilesOfSpeakersInVideo: await toPortableText(
          f['linkedin-profiles-of-speakers-in-video'],
        ),
        tags: toRefs(f['tags'], 'tag'),
        metaDescription: (f['meta-description'] as string) ?? null,
        locale: 'default',
      }
      await sanityWriteClient.createOrReplace(doc)
      migrated++
      console.log(`✓ video: ${doc.name}`)
    } catch (err) {
      const msg = `Failed video ${item.id}: ${err instanceof Error ? err.message : String(err)}`
      errors.push(msg)
      console.error(`✗ ${msg}`)
    }
  }

  await recordMigration({
    collectionSlug: 'videos',
    sourceItemCount: items.length,
    migratedItemCount: migrated,
    status: errors.length === 0 ? 'complete' : 'failed',
    errorLog: errors,
  })

  console.log(`\nVideos: ${migrated}/${items.length} migrated. Errors: ${errors.length}`)
  if (errors.length > 0) process.exit(1)
}

migrateVideos().catch((err) => {
  console.error(err)
  process.exit(1)
})

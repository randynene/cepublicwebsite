/**
 * TEMPLATE-VIDEO Step 0 — read-only Sanity probe.
 * Reports doc count, locale split, field fill rates, enum drift, QA slug pick.
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

type VideoRow = {
  _id: string
  name: string
  slug: string
  label?: string | null
  type?: string | null
  team?: string | null
  order?: number | null
  featured?: boolean | null
  mainVideoEmbedLink?: string | null
  backgroundVideoPreviewLink?: string | null
  vimeoYoutubeStandardLink?: string | null
  backupImage?: { asset?: unknown; alt?: string | null } | null
  descriptionOfVideo?: unknown[] | null
  fullVideoTranscript?: unknown[] | null
  linksMentionedInVideo?: unknown[] | null
  linkedinProfilesOfSpeakersInVideo?: unknown[] | null
  tags?: unknown[] | null
  metaTitle?: string | null
  metaDescription?: string | null
  locale?: string | null
}

const SCHEMA_TEAM = new Set([
  'talentSuccess',
  'clientSuccess',
  'peopleAndCulture',
  'engineering',
  'leadership',
  'talentRecruitment',
  'technicalVetting',
  'hrComplianceLegal',
  'learningDevelopment',
  'employeeExperience',
])

const SCHEMA_TYPE = new Set(['firesideChats', 'workingWithUs', 'interviews'])

const FIELDS: Array<keyof VideoRow> = [
  'name',
  'label',
  'type',
  'team',
  'order',
  'featured',
  'mainVideoEmbedLink',
  'backgroundVideoPreviewLink',
  'vimeoYoutubeStandardLink',
  'backupImage',
  'descriptionOfVideo',
  'fullVideoTranscript',
  'linksMentionedInVideo',
  'linkedinProfilesOfSpeakersInVideo',
  'tags',
  'metaTitle',
  'metaDescription',
  'locale',
]

function hasPortableText(value: unknown[] | null | undefined): boolean {
  return Array.isArray(value) && value.length > 0
}

function pct(n: number, total: number): string {
  if (total === 0) return '0%'
  return `${Math.round((n / total) * 100)}%`
}

function isFilled(doc: VideoRow, field: keyof VideoRow): boolean {
  const value = doc[field]
  if (field === 'backupImage') {
    return Boolean(doc.backupImage?.asset)
  }
  if (
    field === 'descriptionOfVideo' ||
    field === 'fullVideoTranscript' ||
    field === 'linksMentionedInVideo' ||
    field === 'linkedinProfilesOfSpeakersInVideo'
  ) {
    return hasPortableText(value as unknown[] | null | undefined)
  }
  if (field === 'tags') {
    return Array.isArray(value) && value.length > 0
  }
  if (field === 'featured') {
    return value === true
  }
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  return true
}

async function main(): Promise<void> {
  const docs = await client.fetch<VideoRow[]>(
    `*[_type == "video"] | order(name asc) {
      _id,
      name,
      "slug": slug.current,
      label,
      type,
      team,
      order,
      featured,
      mainVideoEmbedLink,
      backgroundVideoPreviewLink,
      vimeoYoutubeStandardLink,
      backupImage,
      descriptionOfVideo,
      fullVideoTranscript,
      linksMentionedInVideo,
      linkedinProfilesOfSpeakersInVideo,
      tags,
      metaTitle,
      metaDescription,
      locale
    }`,
  )

  const total = docs.length
  console.log(`\n=== TEMPLATE-VIDEO Step 0 — Sanity probe ===`)
  console.log(`Dataset: ${env.SANITY_DATASET} | Total video docs: ${total}`)
  console.log(`Expected: 32 (CONTENT-1B parity)`)

  const locales = new Map<string, number>()
  for (const doc of docs) {
    const loc = doc.locale ?? '(missing)'
    locales.set(loc, (locales.get(loc) ?? 0) + 1)
  }
  console.log(`\nLocale split:`)
  for (const [loc, count] of [...locales.entries()].sort()) {
    console.log(`  ${loc}: ${count}`)
  }

  console.log(`\nField fill rates (${total} docs):`)
  for (const field of FIELDS) {
    const filled = docs.filter((d) => isFilled(d, field)).length
    console.log(`  ${field.padEnd(36)} ${String(filled).padStart(2)}/${total} (${pct(filled, total)})`)
  }

  const backupAltFilled = docs.filter((d) => Boolean(d.backupImage?.alt?.trim())).length
  console.log(`\nbackupImage.alt (editorial): ${backupAltFilled}/${total} (${pct(backupAltFilled, total)})`)

  const typeValues = new Map<string, number>()
  const teamValues = new Map<string, number>()
  for (const doc of docs) {
    if (doc.type) typeValues.set(doc.type, (typeValues.get(doc.type) ?? 0) + 1)
    if (doc.team) teamValues.set(doc.team, (teamValues.get(doc.team) ?? 0) + 1)
  }

  console.log(`\ntype enum values in live data:`)
  for (const [value, count] of [...typeValues.entries()].sort()) {
    const ok = SCHEMA_TYPE.has(value) ? 'OK' : 'SCHEMA DRIFT'
    console.log(`  ${value}: ${count} (${ok})`)
  }

  console.log(`\nteam enum values in live data:`)
  for (const [value, count] of [...teamValues.entries()].sort()) {
    const ok = SCHEMA_TEAM.has(value) ? 'OK' : 'SCHEMA DRIFT'
    console.log(`  ${value}: ${count} (${ok})`)
  }

  const embedHosts = new Map<string, number>()
  for (const doc of docs) {
    const url = doc.mainVideoEmbedLink ?? ''
    if (!url) continue
    let host = 'unknown'
    try {
      host = new URL(url).hostname.replace(/^www\./, '')
    } catch {
      host = 'invalid-url'
    }
    embedHosts.set(host, (embedHosts.get(host) ?? 0) + 1)
  }
  console.log(`\nmainVideoEmbedLink hosts:`)
  for (const [host, count] of [...embedHosts.entries()].sort()) {
    console.log(`  ${host}: ${count}`)
  }

  const missingBackup = docs.filter((d) => !d.backupImage?.asset)
  if (missingBackup.length) {
    console.log(`\nDocs missing backupImage.asset (${missingBackup.length}):`)
    for (const d of missingBackup.slice(0, 10)) {
      console.log(`  ${d.slug} (${d._id})`)
    }
  }

  const slugPick =
    docs.find((d) => d.slug === 'hiring-one-dev-backed-by-200') ??
    docs.find(
      (d) =>
        isFilled(d, 'descriptionOfVideo') &&
        isFilled(d, 'fullVideoTranscript') &&
        isFilled(d, 'linksMentionedInVideo') &&
        isFilled(d, 'linkedinProfilesOfSpeakersInVideo') &&
        isFilled(d, 'mainVideoEmbedLink'),
    ) ??
    docs[0]

  console.log(`\nRecommended QA slug (matches Video.html export + screenshot):`)
  console.log(`  slug: ${slugPick?.slug ?? '(none)'}`)
  console.log(`  name: ${slugPick?.name ?? '(none)'}`)
  console.log(`  type: ${slugPick?.type ?? '(none)'}`)
  console.log(`  team: ${slugPick?.team ?? '(none)'}`)

  const sparseSidebar = docs.filter(
    (d) =>
      !isFilled(d, 'linksMentionedInVideo') && !isFilled(d, 'linkedinProfilesOfSpeakersInVideo'),
  )
  console.log(`\nDocs with BOTH sidebar blocks empty: ${sparseSidebar.length}/${total}`)

  const noTranscript = docs.filter((d) => !isFilled(d, 'fullVideoTranscript')).length
  const noDescription = docs.filter((d) => !isFilled(d, 'descriptionOfVideo')).length
  console.log(`Docs missing descriptionOfVideo: ${noDescription}/${total}`)
  console.log(`Docs missing fullVideoTranscript: ${noTranscript}/${total}`)

  console.log(`\nSample slugs (first 8):`)
  for (const d of docs.slice(0, 8)) {
    console.log(`  /videos/${d.slug}`)
  }

  const missingTypeTeam = await client.fetch<
    Array<{ _id: string; slug: string; name: string; type?: string | null; team?: string | null }>
  >(
    `*[_type == "video" && (!defined(type) || !defined(team))]{
      _id, "slug": slug.current, name, type, team
    }`,
  )
  console.log(`\nDocs missing type or team (${missingTypeTeam.length}):`)
  for (const d of missingTypeTeam) {
    console.log(`  ${d.slug} | type=${d.type ?? 'null'} | team=${d.team ?? 'null'}`)
  }

  const qa = await client.fetch<{
    name: string
    label?: string
    type?: string
    team?: string
    hasLinks: boolean
    hasSpeakers: boolean
    tagCount: number
    tagsResolved: Array<{ name: string; slug?: { current?: string } }>
    mainVideoEmbedLink?: string
    metaDescription?: string
    descBlocks: number
    transcriptBlocks: number
  } | null>(
    `*[_type == "video" && slug.current == "hiring-one-dev-backed-by-200"][0]{
      name, label, type, team,
      "hasLinks": count(linksMentionedInVideo) > 0,
      "hasSpeakers": count(linkedinProfilesOfSpeakersInVideo) > 0,
      "tagCount": count(tags),
      "tagsResolved": tags[]->{name, slug},
      mainVideoEmbedLink,
      metaDescription,
      "descBlocks": count(descriptionOfVideo),
      "transcriptBlocks": count(fullVideoTranscript)
    }`,
  )
  console.log(`\nQA slug (hiring-one-dev-backed-by-200) snapshot:`)
  console.log(JSON.stringify(qa, null, 2))

  const linksFilled = docs.filter((d) => isFilled(d, 'linksMentionedInVideo'))
  console.log(`\nDocs WITH linksMentionedInVideo (${linksFilled.length}):`)
  for (const d of linksFilled) {
    console.log(`  /videos/${d.slug}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

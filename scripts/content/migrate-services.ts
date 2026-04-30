// Migrates the Webflow `Services` collection into Sanity `service` documents.
// Field mapping per WEBFLOW_TO_SANITY_FIELD_MAP §4 with CONTENT-1C brief
// corrections (Jake-approved 2026-04-30):
//
//   - `short-label` slug (NOT `short-description` — that's Technology).
//   - Fold 2 paragraph slug is `fold-2---paragraph-2` (trailing -2).
//   - `type` and `prefix` are Option fields; opaque IDs resolved via
//     fetchOptionIdMap (hoisted ABOVE the item loop, not inside).
//   - `associated-technologies` resolves to technology refs after Step 4.
//
// Fold packing rules same as Technology (Step 4):
//   - Deterministic _keys (`fold-{n}`, `fold-{n}-item-{m}`).
//   - All `uploadImage()` awaited.
//   - Empty folds dropped from the array.
//
// metaTitle / metaDescription deferred to CONTENT-1D backfill.
// All ship needsReview = true.
import { ensureSanity, ensureWebflow } from '@/lib/env'
import { CE_COLLECTION_IDS } from '@/lib/content/ce-collection-ids'
import {
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

const SERVICE_TYPE_MAP: Record<string, string> = {
  'Staff Augmentation': 'staffAugmentation',
  'Product Builds': 'productBuilds',
  'Consulting Services': 'consultingServices',
}

const PREFIX_MAP: Record<string, string> = {
  Hire: 'hire',
  Build: 'build',
  Expert: 'expert',
  'End-to-End': 'endToEnd',
}

type Fold = {
  _key: string
  _type: 'fold'
  type: 'headerIntro' | 'featureBullets' | 'itemList' | 'paragraphSection' | 'headerOnly'
  label?: string | null
  header?: string | null
  paragraph?: unknown[]
  bullets?: string[]
  items?: Array<{ _key: string; header: string | null; description: string | null }>
  featuredImage?: unknown | null
}

function nonEmpty(s: unknown): string | null {
  return typeof s === 'string' && s.trim() !== '' ? s : null
}

function packBullets(values: unknown[]): string[] {
  return values
    .filter((v): v is string => typeof v === 'string' && v.trim() !== '')
    .map((s) => s.trim())
}

function foldHasContent(fold: Fold): boolean {
  if (nonEmpty(fold.label)) return true
  if (nonEmpty(fold.header)) return true
  if (Array.isArray(fold.paragraph) && fold.paragraph.length > 0) return true
  if (Array.isArray(fold.bullets) && fold.bullets.length > 0) return true
  if (Array.isArray(fold.items) && fold.items.length > 0) return true
  if (fold.featuredImage) return true
  return false
}

async function buildFolds(f: Record<string, unknown>): Promise<Fold[]> {
  const folds: Fold[] = []

  // ---- Fold 1: headerIntro ----
  const fold1: Fold = {
    _key: 'fold-1',
    _type: 'fold',
    type: 'headerIntro',
    header: nonEmpty(f['fold-1---header-pre']),
    paragraph: await toPortableText(f['fold-1---paragraph']),
    bullets: packBullets([
      f['fold-1---bullet-1'],
      f['fold-1---bullet-2'],
      f['fold-1---bullet-3'],
    ]),
    featuredImage: await uploadImage(f['fold-1---featured-image']),
  }
  if (foldHasContent(fold1)) folds.push(fold1)

  // ---- Fold 2: featureBullets — note `fold-2---paragraph-2` trailing -2 ----
  const fold2: Fold = {
    _key: 'fold-2',
    _type: 'fold',
    type: 'featureBullets',
    label: nonEmpty(f['fold-2---label']),
    header: nonEmpty(f['fold-2---header']),
    paragraph: await toPortableText(f['fold-2---paragraph-2']),
    bullets: packBullets([
      f['fold-2---bullet-1'],
      f['fold-2---bullet-2'],
      f['fold-2---bullet-3'],
    ]),
    featuredImage: await uploadImage(f['fold-2---featured-image']),
  }
  if (foldHasContent(fold2)) folds.push(fold2)

  // ---- Fold 3: itemList ----
  const items: Array<{ _key: string; header: string | null; description: string | null }> = []
  for (let n = 1; n <= 6; n++) {
    const header = nonEmpty(f[`fold-3---item-${n}-header`])
    const description = nonEmpty(f[`fold-3---item-${n}-description`])
    if (header || description) {
      items.push({ _key: `fold-3-item-${n}`, header, description })
    }
  }
  const fold3: Fold = {
    _key: 'fold-3',
    _type: 'fold',
    type: 'itemList',
    label: nonEmpty(f['fold-3---label']),
    header: nonEmpty(f['fold-3---header']),
    items,
  }
  if (foldHasContent(fold3)) folds.push(fold3)

  // ---- Fold 4: headerOnly ----
  const fold4: Fold = {
    _key: 'fold-4',
    _type: 'fold',
    type: 'headerOnly',
    label: nonEmpty(f['fold-4---label']),
    header: nonEmpty(f['fold-4---header']),
  }
  if (foldHasContent(fold4)) folds.push(fold4)

  // ---- Fold 5: paragraphSection ----
  const fold5: Fold = {
    _key: 'fold-5',
    _type: 'fold',
    type: 'paragraphSection',
    label: nonEmpty(f['fold-5---label']),
    header: nonEmpty(f['fold-5---header']),
    paragraph: await toPortableText(f['fold-5---description']),
    bullets: packBullets([
      f['fold-5---bullet-1'],
      f['fold-5---bullet-2'],
      f['fold-5---bullet-3'],
    ]),
  }
  if (foldHasContent(fold5)) folds.push(fold5)

  // ---- Fold 6: headerOnly ----
  const fold6: Fold = {
    _key: 'fold-6',
    _type: 'fold',
    type: 'headerOnly',
    label: nonEmpty(f['fold-6---label']),
    header: nonEmpty(f['fold-6---header']),
  }
  if (foldHasContent(fold6)) folds.push(fold6)

  return folds
}

async function migrateServices(): Promise<void> {
  const collectionId = CE_COLLECTION_IDS.services

  // Hoist option fetches OUTSIDE the item loop (Webflow rate-limits).
  const [serviceTypeIdToName, prefixIdToName] = await Promise.all([
    fetchOptionIdMap(collectionId, 'type'),
    fetchOptionIdMap(collectionId, 'prefix'),
  ])

  const items = await getCollectionItems(collectionId)
  let migrated = 0
  const errors: string[] = []

  for (const item of items) {
    try {
      const f = item.fieldData
      const itemId = `service ${item.id}`

      const type = resolveOption(f['type'], serviceTypeIdToName, SERVICE_TYPE_MAP, 'type', itemId)
      const prefix = resolveOption(f['prefix'], prefixIdToName, PREFIX_MAP, 'prefix', itemId)

      const folds = await buildFolds(f)
      const associatedTechnologies = toRefs(f['associated-technologies'], 'technology')

      const doc = {
        _id: `service-${item.id}`,
        _type: 'service',
        name: (f['name'] as string) ?? null,
        slug: { _type: 'slug', current: webflowSlug(item) },
        order: typeof f['order'] === 'number' ? (f['order'] as number) : null,
        type,
        prefix,
        aiOffering: (f['ai-offering'] as boolean) ?? false,
        location: (f['location'] as boolean) ?? false,
        shortLabel: nonEmpty(f['short-label']),
        thumbnail: await uploadImage(f['thumbnail']),
        associatedTechnologies,
        folds,
        // CONTENT-1D backfill.
        metaTitle: null,
        metaDescription: null,
        source: 'imported',
        needsReview: true,
        locale: 'default',
      }
      await sanityWriteClient.createOrReplace(doc)
      migrated++
      console.log(`✓ service: ${doc.name} [type=${type ?? 'null'} prefix=${prefix ?? 'null'}]`)
    } catch (err) {
      const msg = `Failed service ${item.id}: ${err instanceof Error ? err.message : String(err)}`
      errors.push(msg)
      console.error(`✗ ${msg}`)
    }
  }

  await recordMigration({
    collectionSlug: 'services',
    sourceItemCount: items.length,
    migratedItemCount: migrated,
    status: errors.length === 0 ? 'complete' : 'failed',
    errorLog: errors,
  })

  console.log(`\nServices: ${migrated}/${items.length} migrated. Errors: ${errors.length}`)
  if (errors.length > 0) process.exit(1)
}

migrateServices().catch((err) => {
  console.error(err)
  process.exit(1)
})

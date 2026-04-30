// Migrates the Webflow `Technology Pages` collection into Sanity `technology`
// documents. Field mapping per WEBFLOW_TO_SANITY_FIELD_MAP §3 with the
// CONTENT-1C brief slug sweep §2.3 — the Technology collection uses chaotic
// field slugs with no consistent naming pattern, so the brief's verified
// table is the authority.
//
// Single pass: `associated-technologies` is 0% populated, so no second
// pass is needed (CONTENT-1C v1.1 / v1.2 brief change).
//
// Fold packing rules (brief §4.4):
//   - `focus-3-title` is read once and used in BOTH fold-2 bullets AND
//     fold-3 label (double-duty Webflow template field).
//   - Fold 3 item-1 has `header: null, description: "..."` on 100/101 items
//     — filter is `i.header || i.description`, not just `i.header`.
//   - Fold object _key = `fold-{n}`; fold item _key = `fold-{n}-item-{m}`.
//   - All `uploadImage()` calls explicitly awaited.
//   - Empty folds (no header/label/paragraph/bullets/items/featuredImage)
//     are dropped from the array.
//
// Outlier handling: one item is missing `technology-name` and all fold
// content. Migrator falls back to `name` for technologyName and ships
// `folds: []` + `needsReview: true` rather than throwing.
//
// metaTitle / metaDescription left empty — backfilled in CONTENT-1D.
// All technology docs ship needsReview = true (universal meta backfill
// pending).
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

  // focus-3-title double-duty: fold 2 bullet 3 AND fold 3 label.
  const focus3Title = nonEmpty(f['focus-3-title'])

  // ---- Fold 1: headerIntro ----
  const fold1: Fold = {
    _key: 'fold-1',
    _type: 'fold',
    type: 'headerIntro',
    header: nonEmpty(f['header-blurb']),
    paragraph: await toPortableText(f['fold-1---paragraph']),
    bullets: packBullets([
      f['section-1-label'],
      f['section-1-header'],
      f['section-1-description'],
    ]),
    featuredImage: await uploadImage(f['fold-1---featured-image']),
  }
  if (foldHasContent(fold1)) folds.push(fold1)

  // ---- Fold 2: featureBullets ----
  const fold2: Fold = {
    _key: 'fold-2',
    _type: 'fold',
    type: 'featureBullets',
    label: nonEmpty(f['focus-1-title']),
    header: nonEmpty(f['focus-1-blurb']),
    paragraph: await toPortableText(f['fold-2---paragraph']),
    bullets: packBullets([
      f['focus-2-title'],
      f['focus-2-blurb'],
      focus3Title, // same field as fold-3 label
    ]),
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
    label: focus3Title,
    header: nonEmpty(f['focus-3-blurb']),
    items,
  }
  if (foldHasContent(fold3)) folds.push(fold3)

  // ---- Fold 4: headerOnly (0% fill on all 101 — almost always dropped) ----
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

  // ---- Fold 6: headerOnly (44% fill) ----
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

async function migrateTechnology(): Promise<void> {
  const items = await getCollectionItems(CE_COLLECTION_IDS.technologyPages)
  let migrated = 0
  const errors: string[] = []
  let outliers = 0

  for (const item of items) {
    try {
      const f = item.fieldData

      const technologyNameRaw = nonEmpty(f['technology-name'])
      const fallbackName = nonEmpty(f['name'])
      const technologyName = technologyNameRaw ?? fallbackName ?? '(unnamed)'
      if (!technologyNameRaw && fallbackName) {
        console.warn(`[technology ${item.id}] technology-name empty; falling back to name="${fallbackName}"`)
      }

      const folds = await buildFolds(f)
      const isOutlier = !technologyNameRaw && folds.length === 0
      if (isOutlier) outliers++

      // associated-technologies — 0% populated. Read defensively; if
      // somehow populated, validate IDs and emit refs.
      const associatedTechnologies = toRefs(f['associated-technologies'], 'technology')

      const doc = {
        _id: `technology-${item.id}`,
        _type: 'technology',
        technologyName,
        slug: { _type: 'slug', current: webflowSlug(item) },
        order: typeof f['order'] === 'number' ? (f['order'] as number) : null,
        shortLabel: nonEmpty(f['short-description']),
        techLogo: await uploadImage(f['tech-logo']),
        listItemOnly: (f['list-item-only'] as boolean) ?? false,
        thumbnail: await uploadImage(f['thumbnail']),
        folds,
        associatedTechnologies,
        // Meta backfill in CONTENT-1D — leave null for now.
        metaTitle: null,
        metaDescription: null,
        // Every technology doc needs review (meta backfill pending);
        // outliers additionally flagged.
        source: 'imported',
        needsReview: true,
        locale: 'default',
      }
      await sanityWriteClient.createOrReplace(doc)
      migrated++
      console.log(`✓ technology: ${technologyName}${isOutlier ? ' [OUTLIER — empty folds]' : ''}`)
    } catch (err) {
      const msg = `Failed technology ${item.id}: ${err instanceof Error ? err.message : String(err)}`
      errors.push(msg)
      console.error(`✗ ${msg}`)
    }
  }

  await recordMigration({
    collectionSlug: 'technology',
    sourceItemCount: items.length,
    migratedItemCount: migrated,
    status: errors.length === 0 ? 'complete' : 'failed',
    errorLog: errors,
  })

  console.log(
    `\nTechnology: ${migrated}/${items.length} migrated. Outliers: ${outliers}. Errors: ${errors.length}`,
  )
  if (errors.length > 0) process.exit(1)
}

migrateTechnology().catch((err) => {
  console.error(err)
  process.exit(1)
})

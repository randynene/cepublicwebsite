/**
 * Read-only Sanity probe — image inventory for service + technology docs.
 * Reports, per type: which image FIELDS carry an asset, how many docs fill
 * each, per-fold featuredImage fill, and a sample of resolved asset URLs +
 * original filenames so we can see exactly what art is designated to each
 * template. Read-only. Never mutates the dataset.
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

type AssetMeta = {
  url?: string | null
  originalFilename?: string | null
} | null
type ImageRef = { asset?: AssetMeta; alt?: string | null } | null
type Fold = { type?: string | null; featuredImage?: ImageRef }
type Row = {
  _id: string
  name?: string | null
  slug?: string | null
  thumbnail?: ImageRef
  openGraphImage?: ImageRef
  techLogo?: ImageRef
  folds?: Fold[] | null
}

function pct(n: number, total: number): string {
  if (total === 0) return '0%'
  return `${Math.round((n / total) * 100)}%`
}

function assetUrl(img: ImageRef): string | null {
  return img?.asset?.url ?? null
}

function assetName(img: ImageRef): string {
  return img?.asset?.originalFilename ?? '(no filename)'
}

async function probe(
  type: 'service' | 'technology',
  imageFields: string[],
): Promise<void> {
  const docs = await client.fetch<Row[]>(
    `*[_type == "${type}" && !(_id match "smoke-test-*") && !(_id match "drafts.*")] | order(name asc) {
      _id, name, "slug": slug.current,
      thumbnail{ alt, asset->{ url, originalFilename } },
      openGraphImage{ alt, asset->{ url, originalFilename } },
      ${type === 'technology' ? 'techLogo{ alt, asset->{ url, originalFilename } },' : ''}
      folds[]{ type, featuredImage{ alt, asset->{ url, originalFilename } } }
    }`,
  )

  const total = docs.length
  console.log(`\n${'='.repeat(64)}`)
  console.log(`${type.toUpperCase()} — ${total} docs`)
  console.log('='.repeat(64))

  // Top-level image field fill
  console.log(`\nTop-level image-field fill:`)
  for (const field of imageFields) {
    const filled = docs.filter(
      (d) => (d[field as keyof Row] as ImageRef)?.asset?.url,
    ).length
    console.log(
      `  ${field.padEnd(16)} ${String(filled).padStart(3)}/${total} (${pct(filled, total)})`,
    )
  }

  // Fold featuredImage fill
  let totalFolds = 0
  let foldsWithImage = 0
  const docsWithAnyFoldImage: string[] = []
  for (const d of docs) {
    let anyFoldImg = false
    for (const f of d.folds ?? []) {
      totalFolds++
      if (f.featuredImage?.asset?.url) {
        foldsWithImage++
        anyFoldImg = true
      }
    }
    if (anyFoldImg) docsWithAnyFoldImage.push(d.slug ?? d._id)
  }
  console.log(
    `\nfold.featuredImage fill: ${foldsWithImage}/${totalFolds} folds carry an asset (${pct(foldsWithImage, totalFolds)})`,
  )
  console.log(
    `  docs with >=1 in-fold image: ${docsWithAnyFoldImage.length}/${total}`,
  )
  if (docsWithAnyFoldImage.length)
    console.log(`  ${docsWithAnyFoldImage.slice(0, 20).join(', ')}`)

  // Sample resolved URLs (first 6 docs that fill anything)
  console.log(`\nResolved asset URLs (first 8 docs with any image):`)
  let shown = 0
  for (const d of docs) {
    const lines: string[] = []
    for (const field of imageFields) {
      const img = d[field as keyof Row] as ImageRef
      if (img?.asset?.url)
        lines.push(`      ${field}: ${assetName(img)}\n        ${assetUrl(img)}`)
    }
    ;(d.folds ?? []).forEach((f, i) => {
      if (f.featuredImage?.asset?.url)
        lines.push(
          `      fold[${i}] (${f.type}): ${assetName(f.featuredImage)}\n        ${assetUrl(f.featuredImage)}`,
        )
    })
    if (lines.length) {
      console.log(`  ${d.slug} — "${d.name}"`)
      console.log(lines.join('\n'))
      shown++
      if (shown >= 8) break
    }
  }
  if (shown === 0) console.log('  (no docs carry any image asset)')
}

async function main(): Promise<void> {
  console.log(`Dataset: ${env.SANITY_DATASET} — READ ONLY image inventory`)
  await probe('service', ['thumbnail', 'openGraphImage'])
  await probe('technology', ['thumbnail', 'openGraphImage', 'techLogo'])
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

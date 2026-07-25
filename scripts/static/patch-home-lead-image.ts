import 'dotenv/config'

import * as fs from 'node:fs/promises'
import * as path from 'node:path'

import { createClient } from '@sanity/client'

// Surgical patch: swap ONLY homePage.whyDifferent.leadImage (the "Engineers vet
// engineers" section photo) to a new local image. Does not touch any other
// field, so Studio edits elsewhere on the homePage doc are preserved.
//
// Dry-run by default (reads + reports, writes nothing). Pass --apply to upload
// the new asset and patch the single field.
//
// Run: npx tsx scripts/static/patch-home-lead-image.ts            (dry-run)
//      npx tsx scripts/static/patch-home-lead-image.ts --apply    (writes)
// Token: SANITY_MIGRATION_WRITE_TOKEN

const LOCAL_IMAGE = 'site/public/design/home/media/coding-interview-v2.jpg'
const ALT = 'Cloud Employee engineers in a live coding interview'
const APPLY = process.argv.includes('--apply')

const projectId =
  process.env.SANITY_PROJECT_ID ?? process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? 'lzbhll1u'
const dataset = process.env.SANITY_DATASET ?? process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'
const token = process.env.SANITY_MIGRATION_WRITE_TOKEN

if (!token) {
  console.error('Missing SANITY_MIGRATION_WRITE_TOKEN in .env (repo root).')
  process.exit(1)
}

const client = createClient({ projectId, dataset, token, apiVersion: '2024-01-01', useCdn: false })

async function main() {
  console.log(`Home leadImage patch  (dataset: ${dataset})`)
  console.log(APPLY ? 'MODE: APPLY (will write)\n' : 'MODE: dry-run (no write) — pass --apply to commit\n')

  const current = await client.fetch<{
    ref?: string
    url?: string
  } | null>(
    `*[_id == "homePage"][0].whyDifferent.leadImage{ "ref": asset._ref, "url": asset->url }`,
  )

  const localPath = path.resolve(process.cwd(), LOCAL_IMAGE)
  const buf = await fs.readFile(localPath)

  console.log('  current leadImage asset:')
  console.log(`    ref: ${current?.ref ?? '(none)'}`)
  console.log(`    url: ${current?.url ?? '(none)'}`)
  console.log(`\n  new image (local): ${LOCAL_IMAGE}  (${(buf.length / 1024).toFixed(0)} KB)`)

  if (!APPLY) {
    console.log('\nDry-run only. Re-run with --apply to upload + patch this single field.')
    return
  }

  console.log('\n  uploading new asset...')
  const asset = await client.assets.upload('image', buf, {
    filename: path.basename(LOCAL_IMAGE),
    contentType: 'image/jpeg',
  })
  console.log(`  uploaded: ${asset._id}`)

  await client
    .patch('homePage')
    .set({
      'whyDifferent.leadImage': {
        _type: 'image',
        asset: { _type: 'reference', _ref: asset._id },
        alt: ALT,
      },
    })
    .commit()

  const check = await client.fetch<{ ref?: string; url?: string } | null>(
    `*[_id == "homePage"][0].whyDifferent.leadImage{ "ref": asset._ref, "url": asset->url }`,
  )
  console.log(`\nWritten. Live leadImage asset is now:`)
  console.log(`    ref: ${check?.ref}`)
  console.log(`    url: ${check?.url}`)
}

main().catch((err) => {
  console.error('\nFAIL:', err)
  process.exit(1)
})

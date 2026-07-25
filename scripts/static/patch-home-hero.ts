import 'dotenv/config'

import * as fs from 'node:fs/promises'
import * as path from 'node:path'

import { sanityWriteClient } from '@/lib/content/sanity-write-client'

import { HOME_CONTENT as HC } from '../../site/src/components/templates/home/content'

// One-time correction for the homePage HERO CARD STACK.
//
// Sets hero.profiles (the three engineer photo cards: name / role / flag /
// skill tags / photo) and hero.floatingPills ("Live pair programming" and
// "7-day shortlist") to the canonical set defined in content.ts
// (Marcelo D. / Petar K. / Kyla T.), uploading the photos from the repo.
//
// It applies the change to BOTH the published document AND its draft (if a
// draft exists), so the live site, localhost, and Sanity Studio all agree —
// otherwise a stale draft keeps showing the old people in Studio / preview.
// Every OTHER home-page field is left untouched.
//
// Idempotent: image assets are content-hashed by Sanity (a re-upload returns
// the same reference) and profile _keys are deterministic.
//
// Run:   npm run static:patch-home-hero
// Token: SANITY_MIGRATION_WRITE_TOKEN

const PUBLIC_ROOT = path.resolve(process.cwd(), 'site', 'public')
const PUBLISHED_ID = 'homePage'
const DRAFT_ID = 'drafts.homePage'

function contentType(p: string): string {
  const ext = path.extname(p).toLowerCase()
  if (ext === '.png') return 'image/png'
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.webp') return 'image/webp'
  if (ext === '.avif') return 'image/avif'
  return 'application/octet-stream'
}

// Author-voice rule (no em/en dashes) — mirror the seed script's normalizer.
function normalizeStr(s: string): string {
  return s.replace(/—/g, ', ').replace(/–/g, '-').replace(/[ \t]+/g, ' ').trim()
}

async function uploadAsset(publicPath: string): Promise<string> {
  const buf = await fs.readFile(path.join(PUBLIC_ROOT, publicPath))
  const asset = await sanityWriteClient.assets.upload('image', buf, {
    filename: path.basename(publicPath),
    contentType: contentType(publicPath),
  })
  return asset._id
}

async function patchDocIfExists(
  id: string,
  fields: Record<string, unknown>,
): Promise<boolean> {
  const existing = await sanityWriteClient.getDocument(id)
  if (!existing) return false
  await sanityWriteClient.patch(id).set(fields).commit()
  return true
}

async function main() {
  const profiles = await Promise.all(
    HC.hero.profiles.map(async (p, i) => ({
      _key: `hero-prof-${i}`,
      name: normalizeStr(p.name),
      role: normalizeStr(p.role),
      flag: p.flag,
      tags: p.tags.map(normalizeStr),
      image: {
        _type: 'image' as const,
        asset: { _type: 'reference' as const, _ref: await uploadAsset(p.image) },
        alt: normalizeStr(p.name),
      },
    })),
  )

  const floatingPills = HC.hero.floatingPills.map(normalizeStr)
  const fields = { 'hero.profiles': profiles, 'hero.floatingPills': floatingPills }

  const publishedPatched = await patchDocIfExists(PUBLISHED_ID, fields)
  const draftPatched = await patchDocIfExists(DRAFT_ID, fields)

  console.log(
    [
      `hero cards set to: ${profiles.map((p) => p.name).join(', ')}`,
      `published (${PUBLISHED_ID}): ${publishedPatched ? 'patched' : 'not found (skipped)'}`,
      `draft (${DRAFT_ID}): ${draftPatched ? 'patched' : 'none present'}`,
    ].join('\n'),
  )

  if (!publishedPatched && !draftPatched) {
    throw new Error(
      'No homePage document found to patch. Run `npm run static:seed-home-page` first.',
    )
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

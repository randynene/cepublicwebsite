import 'dotenv/config'

import * as fs from 'node:fs/promises'
import * as path from 'node:path'

import { sanityWriteClient } from '@/lib/content/sanity-write-client'

import {
  EASTERN_EUROPE_CONTENT,
  LATAM_CONTENT,
  PHILIPPINES_CONTENT,
} from '../../site/src/components/templates/location/content'
import {
  HERO_SLIDESHOW_PROFILES,
  REAL_ENGINEER_PROFILES,
} from '../../site/src/lib/talent/home-profiles'

// Align every talent-profile surface on the shared roster.
//
// Sanity WINS over the code fallbacks for all of these fields, so editing
// site/src/lib/talent/roster.ts alone changes nothing on staging. This script
// pushes the resolved code content into the four documents that render faces:
//
//   homePage.hero.profiles            <- the 4 hero slideshow cards
//   homePage.realEngineers.profiles   <- the whole roster, region-interleaved
//   locationPage-*.hero.cards         <- that region's three roster faces
//   locationPage-*.engineers.profiles <- the placed-engineer grid
//
// It reads the already-composed content modules rather than the roster
// directly, so what lands in Sanity is exactly what the code fallback renders.
//
// Before this ran the dataset held three different "Petar K." with three
// different flags (PL, BR, HR) across those docs, and the home marquee listed
// Kyla as Colombian. Region is now a property of the person.
//
// SCOPE: four documents addressed BY ID, four named fields. It overwrites any
// Studio edit to those specific arrays. Everything else on each doc is
// untouched (patch/set, not createOrReplace).
//
// Idempotent: photo assets are content-hashed by Sanity so re-uploads return
// the same ref, and array _keys are derived from the image filename.
//
// Run: npx tsx scripts/static/patch-talent-profiles.ts
// Token: SANITY_MIGRATION_WRITE_TOKEN

const PUBLIC_ROOT = path.resolve(process.cwd(), 'site', 'public')

const LOCATION_DOCS = [
  { id: 'locationPage-latam-developers', content: LATAM_CONTENT },
  { id: 'locationPage-eastern-europe-developers', content: EASTERN_EUROPE_CONTENT },
  { id: 'locationPage-philippines-developers', content: PHILIPPINES_CONTENT },
]

const assetCache = new Map<string, string>()

async function uploadPhoto(publicPath: string): Promise<string> {
  const cached = assetCache.get(publicPath)
  if (cached) return cached
  const localPath = path.join(PUBLIC_ROOT, publicPath.replace(/^\//, ''))
  const buf = await fs.readFile(localPath)
  const asset = await sanityWriteClient.assets.upload('image', buf, {
    filename: path.basename(publicPath),
    contentType: 'image/jpeg',
  })
  assetCache.set(publicPath, asset._id)
  return asset._id
}

async function imageRef(publicPath: string, alt: string) {
  const assetId = await uploadPhoto(publicPath)
  return {
    _type: 'image' as const,
    asset: { _type: 'reference' as const, _ref: assetId },
    alt,
  }
}

/** Stable array _key from the photo filename, so re-runs don't churn keys. */
function keyFor(prefix: string, image: string): string {
  return `${prefix}-${path.basename(image).replace(/\.[a-z]+$/i, '')}`
}

async function main() {
  // ── Home hero slideshow ─────────────────────────────────────────────
  const heroProfiles = await Promise.all(
    HERO_SLIDESHOW_PROFILES.map(async (p) => ({
      _key: keyFor('hero', p.image),
      _type: 'profile',
      name: p.name,
      role: p.role,
      flag: p.flag,
      tags: [...p.tags],
      image: await imageRef(p.image, `${p.name}, ${p.role}`),
      objectPosition: p.objectPosition ?? 'center',
    })),
  )
  await sanityWriteClient
    .patch('homePage')
    .set({ 'hero.profiles': heroProfiles })
    .commit()
  console.log(`homePage.hero.profiles <- ${heroProfiles.map((p) => p.name).join(', ')}`)

  // ── Home marquee: the whole roster, region-interleaved ──────────────
  const marquee = await Promise.all(
    REAL_ENGINEER_PROFILES.map(async (p) => ({
      _key: keyFor('talent', p.image),
      _type: 'profile',
      name: p.name,
      role: p.role,
      flag: p.flag,
      tags: [...p.tags],
      image: await imageRef(p.image, `${p.name}, ${p.role}`),
      objectPosition: 'center',
    })),
  )
  await sanityWriteClient
    .patch('homePage')
    .set({ 'realEngineers.profiles': marquee })
    .commit()
  console.log(
    `homePage.realEngineers.profiles <- ${marquee.length}: ${marquee
      .map((p) => p.flag)
      .join(' ')}`,
  )

  // ── Location pages: hero card stack + placed-engineer grid ──────────
  for (const { id, content } of LOCATION_DOCS) {
    const cards = await Promise.all(
      content.hero.cards.map(async (c) => ({
        _key: keyFor('hero', c.image),
        _type: 'heroCard',
        name: c.name,
        role: c.role,
        skills: [...c.skills],
        flag: c.flag,
        image: await imageRef(c.image, `${c.name}, ${c.role}`),
      })),
    )
    const placed = await Promise.all(
      content.engineers.profiles.map(async (p) => ({
        _key: keyFor('placed', p.image),
        _type: 'engineerProfile',
        name: p.name,
        role: p.role,
        skills: [...p.skills],
        years: p.years,
        bio: p.bio,
        flag: p.flag,
        image: await imageRef(p.image, `${p.name}, ${p.role}`),
      })),
    )
    await sanityWriteClient
      .patch(id)
      .set({ 'hero.cards': cards, 'engineers.profiles': placed })
      .commit()
    console.log(
      `${id}\n  hero.cards        <- ${cards.map((c) => c.name).join(', ')}` +
        `\n  engineers.profiles <- ${placed.map((c) => c.name).join(', ')}`,
    )
  }

  // ── Verify ──────────────────────────────────────────────────────────
  const check = await sanityWriteClient.fetch(`{
    "homeHero": *[_id=="homePage"][0].hero.profiles[].name,
    "homeMarquee": *[_id=="homePage"][0].realEngineers.profiles[].flag,
    "locations": *[_type=="locationPage"]{
      "slug": slug.current,
      "hero": hero.cards[].name,
      "placed": engineers.profiles[].name
    }
  }`)
  console.log('\nVerified:', JSON.stringify(check, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

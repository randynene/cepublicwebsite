import 'dotenv/config'

import { sanityWriteClient } from '@/lib/content/sanity-write-client'

// CE-30: drop Grace O. from the homepage hero rotation, and fly the right flag
// for her in the "Real engineers" marquee.
//
// Seb: "Delete Grace photo from this part. Can keep in the lower scrolling
// section but make her flag Colombia not Nigeria."
//
// The roster change in site/src/lib/talent/roster.ts is not enough on its own.
// homePage.hero.profiles and homePage.realEngineers.profiles are Sanity-owned
// copies with their own name/role/flag/photo, and the document wins over the
// code list - so the hero would have kept showing her, under a Nigerian flag.
//
// Idempotent: re-running once she is out of the hero and flying 🇨🇴 reports no
// change.
//
// Run:   npm run static:patch-home-grace-colombia -- --apply
// Token: SANITY_MIGRATION_WRITE_TOKEN

const NAME = 'Grace O.'
const NEW_FLAG = '🇨🇴'

type Profile = { _key?: string; name?: string; flag?: string }

const isGrace = (p: Profile) => (p.name ?? '').trim() === NAME

async function main() {
  const apply = process.argv.includes('--apply')

  const doc = await sanityWriteClient.fetch<{
    hero?: Profile[]
    real?: Profile[]
  } | null>(
    `*[_id == "homePage"][0]{
      "hero": hero.profiles,
      "real": realEngineers.profiles
    }`,
  )
  if (!doc) throw new Error('homePage document not found.')

  const hero = doc.hero ?? []
  const real = doc.real ?? []

  const heroWithout = hero.filter((p) => !isGrace(p))
  const heroNeedsChange = heroWithout.length !== hero.length

  const graceInReal = real.find(isGrace)
  const realNeedsChange = Boolean(graceInReal) && graceInReal?.flag !== NEW_FLAG

  console.log(`hero.profiles: ${hero.length} (${hero.map((p) => p.name).join(', ')})`)
  console.log(
    heroNeedsChange
      ? `  - remove ${NAME} -> ${heroWithout.length} profiles`
      : `  - ${NAME} already absent`,
  )

  if (!graceInReal) {
    console.log(`realEngineers.profiles: ${NAME} NOT FOUND - Seb asked for her to stay here.`)
  } else {
    console.log(
      realNeedsChange
        ? `realEngineers.profiles: ${NAME} flag ${graceInReal.flag} -> ${NEW_FLAG}`
        : `realEngineers.profiles: ${NAME} already ${NEW_FLAG}`,
    )
  }

  if (!heroNeedsChange && !realNeedsChange) {
    console.log('\nNothing to do.')
    return
  }

  if (!apply) {
    console.log('\nDry run complete. Re-run with -- --apply to write.')
    return
  }

  const patch = sanityWriteClient.patch('homePage')
  if (heroNeedsChange) patch.set({ 'hero.profiles': heroWithout })
  if (realNeedsChange) {
    patch.set({
      'realEngineers.profiles': real.map((p) => (isGrace(p) ? { ...p, flag: NEW_FLAG } : p)),
    })
  }
  await patch.commit()
  console.log('\ncommitted.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

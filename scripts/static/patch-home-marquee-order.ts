import 'dotenv/config'

import { sanityWriteClient } from '@/lib/content/sanity-write-client'
import { marqueeOrder } from '../../site/src/lib/talent/roster'

// CE: move Mateo R. later in the home "Real engineers, real backgrounds"
// marquee (Jake, 13 Aug) - he was the third card in.
//
// Same trap as patch-home-grace-colombia.ts: reordering the roster in
// site/src/lib/talent/roster.ts changes nothing on the live page, because
// homePage.realEngineers.profiles is a Sanity-owned copy and the document wins.
// Playwright against production confirmed the old order was still serving after
// the roster commit deployed.
//
// So rather than hand-moving one entry, this re-sorts the Sanity array into the
// roster's own marqueeOrder() - which keeps the two in step and keeps the "no
// two neighbours from the same region" rule the roster enforces. Profiles in
// Sanity that the roster does not know about keep their relative order and are
// appended, so nothing is dropped.
//
// Idempotent: re-running once the order matches reports no change.
//
// Run:   npm run static:patch-home-marquee-order -- --apply
// Token: SANITY_MIGRATION_WRITE_TOKEN

type Profile = { _key?: string; name?: string }

const nameOf = (p: Profile) => (p.name ?? '').trim()

async function main() {
  const apply = process.argv.includes('--apply')

  const doc = await sanityWriteClient.fetch<{ real?: Profile[] } | null>(
    `*[_id == "homePage"][0]{ "real": realEngineers.profiles }`,
  )
  if (!doc) throw new Error('homePage document not found.')

  const real = doc.real ?? []
  if (real.length === 0) throw new Error('realEngineers.profiles is empty.')

  const wanted = marqueeOrder().map((p) => p.name)
  const rank = new Map(wanted.map((name, i) => [name, i]))

  const known = real.filter((p) => rank.has(nameOf(p)))
  const unknown = real.filter((p) => !rank.has(nameOf(p)))
  known.sort((a, b) => rank.get(nameOf(a))! - rank.get(nameOf(b))!)
  const next = [...known, ...unknown]

  const before = real.map(nameOf)
  const after = next.map(nameOf)

  console.log(`current: ${before.join(', ')}`)
  console.log(`roster:  ${after.join(', ')}`)
  if (unknown.length > 0) {
    console.log(`not in roster (kept, appended): ${unknown.map(nameOf).join(', ')}`)
  }
  const missing = wanted.filter((n) => !before.includes(n))
  if (missing.length > 0) {
    console.log(`in roster but not in Sanity (not added): ${missing.join(', ')}`)
  }

  if (before.join('|') === after.join('|')) {
    console.log('\nNothing to do.')
    return
  }
  if (!apply) {
    console.log('\nDry run complete. Re-run with -- --apply to write.')
    return
  }

  await sanityWriteClient.patch('homePage').set({ 'realEngineers.profiles': next }).commit()
  console.log('\ncommitted.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

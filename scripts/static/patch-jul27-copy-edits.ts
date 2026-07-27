/**
 * Jul 2026 copy + content edits that live in Sanity, not in code.
 *
 * The code-side changes ship in the same commit; these five values are stored
 * on the `homePage` and `hireEngineersPage` singletons, so the live pages keep
 * showing the old text until this runs.
 *
 *   1. homePage.hero.paragraphLines  - drop "Plus we handle HR, payroll, and
 *                                      retention for one monthly fee."
 *   2. homePage.hero.bottomPills     - 3 trust points (One monthly fee /
 *                                      We handle HR & payroll / 300+ teams built)
 *   3. homePage.clientStory.eyebrow  - "Client story" -> "Jobs boards don't work anymore"
 *   4. homePage.whereWeWork.hubs     - remove the Cape Town panel (6 -> 5)
 *   5. hireEngineersPage.final.cta   - "Start hiring" -> "Contact us today"
 *
 * Surgical: only the five paths above are written. Idempotent - re-running once
 * applied reports "already correct" and writes nothing.
 *
 * Safe by default: prints current vs intended and DOES NOT WRITE.
 * Pass --apply to commit to the live `production` dataset.
 *
 * Usage (repo root, with SANITY_MIGRATION_WRITE_TOKEN in .env):
 *   npx tsx scripts/static/patch-jul27-copy-edits.ts            # dry-run
 *   npx tsx scripts/static/patch-jul27-copy-edits.ts --apply    # write
 */

import 'dotenv/config'

import { createClient } from '@sanity/client'

const APPLY = process.argv.includes('--apply')

const HERO_PARAGRAPH_LINES = [
  'Not recruiters guessing. We embed senior engineers full-time in your team, your tools, and your timezone - in 7 days',
]
const HERO_BOTTOM_PILLS = ['One monthly fee', 'We handle HR & payroll', '300+ teams built']
const CLIENT_STORY_EYEBROW = "Jobs boards don't work anymore"
const REMOVE_HUB = 'cape town'
const HIRE_FINAL_CTA = 'Contact us today'

const projectId =
  process.env.SANITY_PROJECT_ID ?? process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? 'lzbhll1u'
const dataset =
  process.env.SANITY_DATASET ?? process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'
const token = process.env.SANITY_MIGRATION_WRITE_TOKEN

if (!token) {
  console.error('Missing SANITY_MIGRATION_WRITE_TOKEN in .env (repo root).')
  process.exit(1)
}

const client = createClient({ projectId, dataset, token, apiVersion: '2024-01-01', useCdn: false })

interface Hub {
  _key?: string
  name?: string
  href?: string
}
interface HomeDoc {
  hero?: { paragraphLines?: string[]; bottomPills?: string[] }
  clientStory?: { eyebrow?: string }
  whereWeWork?: { hubs?: Hub[] }
}
interface HireDoc {
  final?: { cta?: string }
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

async function main() {
  console.log(`Jul-27 copy edits  (dataset: ${dataset})`)
  console.log(
    APPLY ? 'MODE: APPLY (will write)\n' : 'MODE: dry-run (no write) - pass --apply to commit\n',
  )

  const home = await client.fetch<HomeDoc | null>(
    `*[_id == "homePage"][0]{ hero{ paragraphLines, bottomPills }, clientStory{ eyebrow }, whereWeWork{ hubs[]{ _key, name, href } } }`,
  )
  const hire = await client.fetch<HireDoc | null>(
    `*[_id == "hireEngineersPage"][0]{ final{ cta } }`,
  )

  if (!home) {
    console.error('homePage singleton not found. Nothing changed.')
    process.exit(1)
  }
  if (!hire) {
    console.error('hireEngineersPage singleton not found. Nothing changed.')
    process.exit(1)
  }

  const hubs = home.whereWeWork?.hubs ?? []
  const keptHubs = hubs.filter((h) => (h.name ?? '').trim().toLowerCase() !== REMOVE_HUB)

  const homeSet: Record<string, unknown> = {}

  console.log('1. homePage.hero.paragraphLines')
  console.log(`   current: ${JSON.stringify(home.hero?.paragraphLines ?? null)}`)
  console.log(`   target : ${JSON.stringify(HERO_PARAGRAPH_LINES)}`)
  if (!same(home.hero?.paragraphLines, HERO_PARAGRAPH_LINES)) {
    homeSet['hero.paragraphLines'] = HERO_PARAGRAPH_LINES
  } else console.log('   -> already correct')

  console.log('2. homePage.hero.bottomPills')
  console.log(`   current: ${JSON.stringify(home.hero?.bottomPills ?? null)}`)
  console.log(`   target : ${JSON.stringify(HERO_BOTTOM_PILLS)}`)
  if (!same(home.hero?.bottomPills, HERO_BOTTOM_PILLS)) {
    homeSet['hero.bottomPills'] = HERO_BOTTOM_PILLS
  } else console.log('   -> already correct')

  console.log('3. homePage.clientStory.eyebrow')
  console.log(`   current: ${JSON.stringify(home.clientStory?.eyebrow ?? null)}`)
  console.log(`   target : ${JSON.stringify(CLIENT_STORY_EYEBROW)}`)
  if (home.clientStory?.eyebrow !== CLIENT_STORY_EYEBROW) {
    homeSet['clientStory.eyebrow'] = CLIENT_STORY_EYEBROW
  } else console.log('   -> already correct')

  console.log('4. homePage.whereWeWork.hubs')
  console.log(`   current: ${hubs.length} hubs -> ${hubs.map((h) => h.name).join(', ')}`)
  console.log(`   target : ${keptHubs.length} hubs -> ${keptHubs.map((h) => h.name).join(', ')}`)
  if (keptHubs.length !== hubs.length) {
    // Reuse the fetched objects only for identity; write back the FULL hub
    // objects so nothing else on them is lost.
    const fullHubs = await client.fetch<Hub[] | null>(`*[_id == "homePage"][0].whereWeWork.hubs`)
    const keptFull = (fullHubs ?? []).filter(
      (h) => ((h as Hub).name ?? '').trim().toLowerCase() !== REMOVE_HUB,
    )
    homeSet['whereWeWork.hubs'] = keptFull
  } else console.log('   -> already correct (no Cape Town hub found)')

  console.log('5. hireEngineersPage.final.cta')
  console.log(`   current: ${JSON.stringify(hire.final?.cta ?? null)}`)
  console.log(`   target : ${JSON.stringify(HIRE_FINAL_CTA)}`)
  const patchHire = hire.final?.cta !== HIRE_FINAL_CTA
  if (!patchHire) console.log('   -> already correct')

  const changes = Object.keys(homeSet).length + (patchHire ? 1 : 0)
  console.log(`\n${changes} field(s) need writing.`)

  if (changes === 0) return
  if (!APPLY) {
    console.log('Dry-run only. Re-run with --apply to write.')
    return
  }

  if (Object.keys(homeSet).length > 0) {
    await client.patch('homePage').set(homeSet).commit()
  }
  if (patchHire) {
    await client.patch('hireEngineersPage').set({ 'final.cta': HIRE_FINAL_CTA }).commit()
  }

  const check = await client.fetch<{ home: HomeDoc; hire: HireDoc }>(
    `{
      "home": *[_id == "homePage"][0]{ hero{ paragraphLines, bottomPills }, clientStory{ eyebrow }, whereWeWork{ hubs[]{ name } } },
      "hire": *[_id == "hireEngineersPage"][0]{ final{ cta } }
    }`,
  )
  console.log('\nWritten. Live values now:')
  console.log(JSON.stringify(check, null, 2))
}

main().catch((err) => {
  console.error('\nFAIL:', err)
  process.exit(1)
})

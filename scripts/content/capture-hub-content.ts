// Capture the live hub pages' prose into their Sanity singletons.
//
// Closes Tech Debt #44. The 16 hubs shipped as a headline over a grid of cards,
// because `introContent` was never projected and no hub schema could hold FAQs.
// The live pages carry a lead paragraph, several hundred words of body copy, and
// an FAQ block, and on the six Knowledge Hubs that prose IS the page.
//
// Renders with a real browser rather than fetching HTML, because the hub card
// grids are Webflow CMS lists that only exist after JavaScript runs, and the body
// copy sits after them in document order.
//
//   npm run content:capture-hubs                      # dry run, writes nothing
//   npm run content:capture-hubs -- --apply           # write to Sanity
//   npm run content:capture-hubs -- --apply blog      # one hub
//
// The title is REPORTED, never written. Tech Debt #45 claimed 14 of 16 hubs had
// the wrong H1; they do not. "Full Embedded Tech Teams" really is the live
// /services headline. The seed was right and the tech-debt note was wrong, so this
// prints any divergence for a human to judge and changes nothing.
import { chromium } from 'playwright'

import { captureHub } from '@/lib/content/capture-hub'
import { dashesStripped, resetDashCount } from '@/lib/content/capture-page'
import { recordMigration } from '@/lib/content/migration-tracker'
import { sanityWriteClient } from '@/lib/content/sanity-write-client'
import { ensureSanity } from '@/lib/env'

ensureSanity()

const LIVE_ORIGIN = 'https://www.cloudemployee.io'

type Hub = { key: string; id: string; path: string }

// Every hub in HUB_CONFIG. The six Knowledge Hubs are the ones with real body copy
// and FAQs; the rest have a lead paragraph and nothing else, which is fine and is
// what the capture will report.
const HUBS: Hub[] = [
  { key: 'blog', id: 'blogHub', path: '/blog' },
  { key: 'staff-augmentation', id: 'staffAugmentationHub', path: '/staff-augmentation' },
  { key: 'nearshoring-offshoring', id: 'nearshoringOffshoringHub', path: '/nearshoring-offshoring' },
  { key: 'scaling-teams', id: 'scalingTeamsHub', path: '/scaling-teams' },
  { key: 'hiring-tips', id: 'hiringTipsHub', path: '/hiring-tips' },
  { key: 'managing-engineers', id: 'managingEngineersHub', path: '/managing-engineers' },
  { key: 'ai-in-software-development', id: 'aiInSoftwareDevelopmentHub', path: '/ai-in-software-development' },
  { key: 'videos', id: 'videosHub', path: '/videos' },
  { key: 'tools', id: 'toolsHub', path: '/tools' },
  { key: 'downloads', id: 'downloadsHub', path: '/downloads' },
  { key: 'events', id: 'eventsHub', path: '/events' },
  { key: 'services', id: 'servicesHub', path: '/services' },
  { key: 'technology', id: 'technologyHub', path: '/technology' },
  { key: 'customer-stories', id: 'customerStoriesHub', path: '/customer-stories' },
  { key: 'reviews', id: 'reviewsHub', path: '/reviews' },
  { key: 'compare', id: 'compareHub', path: '/compare' },
]

const APPLY = process.argv.includes('--apply')

function selected(): Hub[] {
  const keys = process.argv.slice(2).filter((a) => !a.startsWith('-'))
  if (keys.length === 0) return HUBS
  const picked = HUBS.filter((h) => keys.includes(h.key))
  const unknown = keys.filter((k) => !HUBS.some((h) => h.key === k))
  if (unknown.length > 0) {
    throw new Error(`Unknown hub(s): ${unknown.join(', ')}. Known: ${HUBS.map((h) => h.key).join(', ')}`)
  }
  return picked
}

async function main(): Promise<void> {
  const hubs = selected()
  resetDashCount()

  console.log(APPLY ? 'APPLY — writing to Sanity.\n' : 'DRY RUN — nothing is written. Pass --apply to write.\n')

  const browser = await chromium.launch()
  const page = await browser.newPage()

  const titleDivergences: Array<{ path: string; sanity: string; live: string }> = []
  let written = 0

  try {
    for (const hub of hubs) {
      const url = `${LIVE_ORIGIN}${hub.path}`
      const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 })

      // Refuse to capture a page we did not actually get. Capturing a 404 would
      // wipe a hub's content with an empty result, which is strictly worse than
      // leaving it as it is.
      if (!res || res.status() !== 200) {
        console.error(`  FAIL  ${hub.path} — HTTP ${res?.status() ?? 'no response'}, skipped`)
        continue
      }

      // The card grids are CMS lists; the body copy sits after them in document
      // order, so it is not in the DOM until Webflow has rendered them.
      await page.waitForTimeout(2_000)

      const html = await page.content()
      const cap = await captureHub(html, url)

      const existing = await sanityWriteClient.fetch<{ title?: string } | null>(
        `*[_id == $id][0]{title}`,
        { id: hub.id },
      )

      if (existing?.title && cap.liveTitle && existing.title !== cap.liveTitle) {
        titleDivergences.push({ path: hub.path, sanity: existing.title, live: cap.liveTitle })
      }

      const hero = cap.heroDescription.length
      const body = cap.introContent.length
      const faqs = cap.faqs.length

      console.log(
        `  ${hub.path.padEnd(28)} lead:${hero > 0 ? 'yes' : 'no '}  body:${String(body).padStart(3)} blocks  faqs:${String(faqs).padStart(2)}`,
      )

      if (!APPLY) continue

      // Only patch what we actually found. A hub with no body copy on the live site
      // (/reviews, /compare) must not have its existing fields unset by an empty
      // capture — absence of content in the capture is not an instruction to delete.
      const patch: Record<string, unknown> = {}
      if (hero > 0) patch.heroDescription = cap.heroDescription
      if (body > 0) patch.introContent = cap.introContent
      if (faqs > 0) patch.faqs = cap.faqs

      if (Object.keys(patch).length === 0) {
        console.log(`         nothing to write`)
        continue
      }

      await sanityWriteClient.patch(hub.id).set(patch).commit()
      written++
    }
  } finally {
    await browser.close()
  }

  if (APPLY) {
    await recordMigration({
      collectionSlug: 'hub-content',
      sourceItemCount: hubs.length,
      migratedItemCount: written,
      status: written === hubs.length ? 'complete' : 'failed',
    })
  }

  console.log(`\n${written} hub(s) written. ${dashesStripped} em/en dash(es) normalised to house style.`)

  if (titleDivergences.length > 0) {
    console.log(`\n${titleDivergences.length} hub title(s) differ from the live H1. NOT changed — read and decide:`)
    for (const d of titleDivergences) {
      console.log(`  ${d.path}`)
      console.log(`    sanity: ${d.sanity}`)
      console.log(`    live:   ${d.live}`)
    }
  } else {
    console.log(`\nEvery hub title matches the live H1.`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

import 'dotenv/config'

import { sanityWriteClient } from '@/lib/content/sanity-write-client'

// CE-71 — put Petra first in the homepage hero slideshow.
//
// Why the code change alone did nothing: commit 489e64b reordered
// HERO_SLIDESHOW_PROFILES in site/src/lib/talent/home-profiles.ts, which reads
// like the source of truth but is not. content.ts labels that list
// "Fallback slideshow when Sanity hero.profiles is empty / invalid", and the
// canonical order is homePage.hero.profiles in Sanity. That array is populated,
// so the fallback never runs and the code edit was inert. Kyla stayed first on
// localhost and on production, which is exactly what was reported.
//
// This is the same failure shape as Tech Debt #70: the page reads Sanity
// correctly, the document holds different content from the code, and nothing
// errors. It just quietly serves the data.
//
// What this does: moves the Petra entry to index 0 of homePage.hero.profiles
// and leaves every other entry in its existing relative order, so Kyla drops to
// second exactly as the code comment intended. Position 0 is the only slot that
// matters here - it is the desktop auto-cycle start AND the single photo shown
// on mobile.
//
// Scope note: this writes to the PRODUCTION Sanity dataset, and the site reads
// Sanity live. The change is visible on www.cloudemployee.io as soon as it is
// applied, with no deploy. It is reversible by re-running with a different
// target name, or by dragging the entry in Studio.
//
// Idempotent: bails out if Petra is already at index 0.
//
// Run (preview):  npx tsx scripts/content/patch-hero-slideshow-order.ts
// Run (write):    npx tsx scripts/content/patch-hero-slideshow-order.ts --apply
// Token: SANITY_MIGRATION_WRITE_TOKEN

const DOC_TYPE = 'homePage'
const LEAD_NAME = 'Petra'

interface HeroProfile {
  _key?: string
  name?: string
  role?: string
}

interface HomePageDoc {
  _id: string
  hero?: { profiles?: HeroProfile[] }
}

async function main(): Promise<void> {
  const apply = process.argv.includes('--apply')

  const doc = await sanityWriteClient.fetch<HomePageDoc | null>(
    `*[_type == $type][0]{ _id, hero { profiles[]{ _key, name, role } } }`,
    { type: DOC_TYPE },
  )

  if (!doc) {
    throw new Error(`No ${DOC_TYPE} document found in the dataset.`)
  }

  const profiles = doc.hero?.profiles
  if (!profiles || profiles.length === 0) {
    throw new Error(
      `${DOC_TYPE}.hero.profiles is empty. The code fallback would be serving the ` +
        `slideshow, and reordering here would achieve nothing.`,
    )
  }

  console.log(`Current order in Sanity (${doc._id}):`)
  profiles.forEach((p, i) => console.log(`  [${i}] ${p.name ?? '(unnamed)'}`))

  const leadIndex = profiles.findIndex((p) => (p.name ?? '').startsWith(LEAD_NAME))
  if (leadIndex === -1) {
    throw new Error(
      `No profile whose name starts with "${LEAD_NAME}" is in the slideshow. ` +
        `Add her in Studio first; this script only reorders what is already there.`,
    )
  }

  if (leadIndex === 0) {
    console.log(`\n${LEAD_NAME} is already first. Nothing to do.`)
    return
  }

  const lead = profiles[leadIndex]
  const reordered = [lead, ...profiles.filter((_, i) => i !== leadIndex)]

  console.log(`\nNew order:`)
  reordered.forEach((p, i) => console.log(`  [${i}] ${p.name ?? '(unnamed)'}`))

  if (!apply) {
    console.log(`\nPreview only. Re-run with --apply to write it.`)
    return
  }

  await sanityWriteClient.patch(doc._id).set({ 'hero.profiles': reordered }).commit()
  console.log(`\nWritten. ${LEAD_NAME} now leads the homepage hero slideshow.`)
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})

// Capture the live marketing pages into their Sanity singletons.
//
// These are the pages with no new design yet. They must exist at cutover or their
// URLs 404 and their rankings go; they do not have to look final. So: take the
// live content, put it in Sanity in the shape the redesign will use, restyle when
// the design lands. A missing page is unrecoverable. A page that looks old is a
// template change.
//
// Renders with a real browser rather than fetching HTML, because parts of these
// pages are Webflow CMS lists that only exist after JavaScript runs.
//
//   npm run content:capture-marketing              # all of them
//   npm run content:capture-marketing -- about-us  # just one
import { chromium } from 'playwright'

import { ensureSanity } from '@/lib/env'
import { capturePage, dashesStripped, resetDashCount } from '@/lib/content/capture-page'
import { recordMigration } from '@/lib/content/migration-tracker'
import { sanityWriteClient } from '@/lib/content/sanity-write-client'

ensureSanity()

const LIVE_ORIGIN = 'https://www.cloudemployee.io'

type Target = {
  /** Sanity singleton _id and _type. */
  id: string
  /** Path on the live site. */
  path: string
  /** Key used to select a single page from the command line. */
  key: string
}

// /alternatives is NOT here: it turned out to be a hub (30 compare cards, almost
// no prose), so it uses the HUB_CONFIG machinery instead. Capturing it as a static
// page produced an empty page, which is what surfaced the mistake.
const TARGETS: Target[] = [
  // 'about-us' removed 25 Jul 2026 (WP-04): aboutUsPage is now a BESPOKE singleton
  // wired to the /about-us template (seed-about-us-page.ts). Re-running generic
  // capture would clobber team/values/reviews chrome with flat rich-text sections.
  // 'contact' removed 25 Jul 2026 (WP-05): contactPage is now a BESPOKE singleton
  // wired to the /contact template (seed-contact-page.ts). The generic capture
  // reads prose only, so re-running it would flatten the offices grid and the
  // quick-contact strip into rich text and drop the HubSpot form id.
  { key: 'for-developers', id: 'forDevelopersPage', path: '/for-developers' },
  { key: 'work-with-shawnee', id: 'workWithShawneePage', path: '/work-with-shawnee' },
  // 'our-work' removed 23 Jul 2026: ourWorkPage is now a BESPOKE singleton wired to
  // the /our-work template (seed-our-work-page.ts), not the generic captured-prose
  // shape. Re-running the generic capture here would clobber the bespoke doc.
  { key: 'pricing', id: 'pricingPage', path: '/pricing' },
  { key: 'referrals', id: 'referralsPage', path: '/referrals' },

  // The post-conversion pages. Nobody navigates to these, which is why they are
  // the easiest pages in a migration to forget: they are what a HubSpot form or a
  // Calendly booking redirects TO. A 404 here breaks every form on the site, and
  // it breaks it silently - the form still submits, the lead is still captured,
  // and the person who filled it in lands on a broken page.
  { key: 'book-a-call', id: 'bookACallPage', path: '/book-a-call' },
  { key: 'book-a-call-confirmed', id: 'bookACallConfirmedPage', path: '/book-a-call-confirmed' },
  { key: 'book-a-call-thank-you', id: 'bookACallThankYouPage', path: '/book-a-call-thank-you' },
  { key: 'thank-you', id: 'thankYouPage', path: '/thank-you' },
  { key: 'thank-you-culture-match', id: 'thankYouCultureMatchPage', path: '/thank-you-culture-match' },
  { key: 'thank-you-for-your-message', id: 'thankYouForYourMessagePage', path: '/thank-you-for-your-message' },
  { key: 'thank-you-now-book-a-call', id: 'thankYouNowBookACallPage', path: '/thank-you-now-book-a-call' },
]

function selected(): Target[] {
  const keys = process.argv.slice(2).filter((a) => !a.startsWith('-'))
  if (keys.length === 0) return TARGETS
  const picked = TARGETS.filter((t) => keys.includes(t.key))
  const unknown = keys.filter((k) => !TARGETS.some((t) => t.key === k))
  if (unknown.length > 0) {
    throw new Error(`Unknown page(s): ${unknown.join(', ')}. Known: ${TARGETS.map((t) => t.key).join(', ')}`)
  }
  return picked
}

async function main(): Promise<void> {
  const targets = selected()
  const browser = await chromium.launch()
  const page = await browser.newPage()
  const errors: string[] = []
  let captured = 0

  for (const target of targets) {
    const url = `${LIVE_ORIGIN}${target.path}`
    try {
      // domcontentloaded, not networkidle: the site's ten third-party scripts keep
      // the network busy forever and networkidle never fires (Tech Debt #6).
      const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
      if (!res || res.status() !== 200) {
        throw new Error(`live page returned ${res?.status() ?? 'no response'}`)
      }
      await page.waitForTimeout(2500)

      const html = await page.content()
      resetDashCount()
      const result = await capturePage(html, url)

      // A booking widget counts as content. /book-a-call is a headline over a
      // Calendly embed with no prose whatsoever, so a guard that only counts words
      // rejects the one page whose entire purpose is the thing it is not counting.
      const gotSomething =
        result.sections.length > 0 ||
        result.heroDescription.length > 0 ||
        !!result.calendlyUrl
      if (!gotSomething) {
        throw new Error('captured nothing — the selectors probably do not match this page')
      }

      // createIfNotExists + patch, never createOrReplace: several of these
      // singletons already carry hero copy or meta edited in Studio, and a content
      // capture has no business discarding it. The fields we write are the ones we
      // captured; everything else is left alone.
      await sanityWriteClient
        .transaction()
        .createIfNotExists({ _id: target.id, _type: target.id })
        .patch(target.id, (p) =>
          p.set({
            title: result.title,
            eyebrow: result.eyebrow,
            heroDescription: result.heroDescription,
            calendlyUrl: result.calendlyUrl,
            sections: result.sections,
            metaTitle: result.metaTitle,
            metaDescription: result.metaDescription,
          }),
        )
        .commit()

      captured++
      console.log(
        `✓ ${target.path.padEnd(28)} -> ${target.id.padEnd(26)} ` +
          `hero: ${result.heroDescription.length} block(s), ${result.sections.length} section(s)` +
          (result.calendlyUrl ? ', calendly' : ''),
      )
      for (const s of result.sections) {
        console.log(`    ${String(s.content.length).padStart(3)} blocks  ${s.heading ?? '(no heading)'}`)
      }
      if (dashesStripped > 0) {
        console.log(`    ${dashesStripped} em/en dash(es) normalised to house style`)
      }
      for (const s of result.skipped) {
        console.log(`    SKIPPED   ${s.heading}`)
        console.log(`              ${s.why}`)
      }
    } catch (err) {
      const msg = `${target.path}: ${err instanceof Error ? err.message : String(err)}`
      errors.push(msg)
      console.error(`✗ ${msg}`)
    }
  }

  await browser.close()

  await recordMigration({
    collectionSlug: 'marketing-pages',
    sourceItemCount: targets.length,
    migratedItemCount: captured,
    status: errors.length === 0 ? 'complete' : 'failed',
    errorLog: errors,
  })

  console.log(`\n${captured}/${targets.length} captured. Errors: ${errors.length}`)
  if (errors.length > 0) process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

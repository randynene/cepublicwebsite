import 'dotenv/config'

import { sanityWriteClient } from '@/lib/content/sanity-write-client'

// CE-41: fix the post-booking thank-you page.
//
// Seb: "Thank you page after booking a call is broken. It takes you back to the
// calendar."
//
// He was right, and the cause was content, not code: `calendlyUrl` was populated
// on this singleton (carried over from the Webflow capture), and the shared
// static-page template renders a Calendly embed whenever that field is set. So
// someone who had just booked was shown the booking calendar again.
//
// Three changes here:
//   1. unset calendlyUrl            - removes the calendar
//   2. new title                    - warmer, and says what happens next
//   3. rewrite heroDescription      - it held a lone "Discover our latest
//                                     articles:" h3 with nothing beneath it (the
//                                     empty carousel). The real articles now come
//                                     from the PostBookingNext component, so this
//                                     field becomes the supporting line instead.
//
// heroDescription MUST stay non-empty. renderStaticPage() treats a page with no
// heroDescription, no sections and no calendlyUrl as "not a page" and 404s it -
// so clearing the prose while also clearing the calendar would take the page
// down. That guard is correct; this script just has to respect it.
//
// One document serves both /book-a-call-thank-you and /uk/book-a-call-thank-you.
//
// Idempotent: re-running once applied reports no change.
//
// Run:   npm run static:patch-book-a-call-thank-you -- --apply
// Token: SANITY_MIGRATION_WRITE_TOKEN

const DOC_ID = 'bookACallThankYouPage'

// Two lines, deliberately (Jake, Aug 2026): "You're booked." lands on its own,
// then the promise. The newline is honoured by `whitespace-pre-line` on the H1
// in templates/static-page/index.tsx - without that class this renders as one
// run-on line.
const TITLE = "You're booked.\nHere's what happens next."

/** Portable Text: one plain paragraph. */
const HERO_DESCRIPTION = [
  {
    _key: 'ce41-intro',
    _type: 'block',
    style: 'normal',
    markDefs: [],
    children: [
      {
        _key: 'ce41-intro-0',
        _type: 'span',
        marks: [],
        text: 'A calendar invite is on its way to your inbox. On the call we will walk through the roles you need, the timezones and rates that fit, and how quickly we can have someone embedded in your team.',
      },
    ],
  },
]

type Doc = { title?: string; calendlyUrl?: string | null; heroDescription?: unknown[] | null }

async function main() {
  const apply = process.argv.includes('--apply')

  const doc = await sanityWriteClient.fetch<Doc | null>(
    `*[_id == $id][0]{ title, calendlyUrl, heroDescription }`,
    { id: DOC_ID },
  )
  if (!doc) throw new Error(`${DOC_ID} not found.`)

  const needsCalendlyUnset = Boolean(doc.calendlyUrl)
  const needsTitle = doc.title !== TITLE
  const firstSpan = (doc.heroDescription?.[0] as { children?: { text?: string }[] } | undefined)
    ?.children?.[0]?.text
  const needsHero = firstSpan !== HERO_DESCRIPTION[0].children[0].text

  console.log(DOC_ID)
  console.log(
    needsCalendlyUnset
      ? `  - unset calendlyUrl (${doc.calendlyUrl}) -> calendar removed`
      : '  - calendlyUrl already absent',
  )
  console.log(needsTitle ? `  - title: "${doc.title}" -> "${TITLE}"` : '  - title already set')
  console.log(
    needsHero
      ? `  - heroDescription: "${firstSpan ?? '(empty)'}" -> supporting paragraph`
      : '  - heroDescription already set',
  )

  if (!needsCalendlyUnset && !needsTitle && !needsHero) {
    console.log('\nNothing to do.')
    return
  }

  if (!apply) {
    console.log('\nDry run complete. Re-run with -- --apply to write.')
    return
  }

  const patch = sanityWriteClient.patch(DOC_ID)
  if (needsCalendlyUnset) patch.unset(['calendlyUrl'])
  if (needsTitle || needsHero) {
    patch.set({
      ...(needsTitle ? { title: TITLE } : {}),
      ...(needsHero ? { heroDescription: HERO_DESCRIPTION } : {}),
    })
  }
  await patch.commit()
  console.log('\ncommitted.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

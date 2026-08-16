import 'dotenv/config'

import { randomUUID } from 'node:crypto'

import { sanityWriteClient } from '@/lib/content/sanity-write-client'

// CE-63 — add a "Contact us" link to the sitewide footer.
//
// Why: /contact exists and is a real page, but nothing in the footer points at
// it. Every route to talking to a human ran through "Book a call", so a visitor
// who wants to send a message rather than put a meeting in the diary had no
// obvious way through.
//
// Where it goes: the "About" column of the "Learn more" section. That column is
// already the who-we-are/how-to-reach-us list (How it works, About us, Pricing,
// Reviews, Careers), so Contact us reads as one of the set. The alternative was
// bottomBar.links, but that row is legal boilerplate (General Terms, Privacy
// Policy, Sitemap) and Contact would have been buried in it.
//
// The footer is Sanity-driven, so this adds a normal link to the `footer`
// global rather than hardcoding JSX. Seb can reorder or relabel it in Studio
// afterwards like any other footer link, and no code change is involved.
//
// House style: absolute https://www.cloudemployee.io/... URLs, matching every
// other link already in the document. No em/en dashes.
//
// Idempotent: bails out if a link to /contact already exists in that column, so
// re-running cannot produce a duplicate.
//
// Run (preview):  npx tsx scripts/content/patch-footer-contact-link.ts
// Run (write):    npx tsx scripts/content/patch-footer-contact-link.ts --apply
// Token: SANITY_MIGRATION_WRITE_TOKEN

const SECTION_LABEL = 'Learn more'
const COLUMN_HEADING = 'About'
const LINK_LABEL = 'Contact us'
const LINK_URL = 'https://www.cloudemployee.io/contact'

interface FooterLink {
  _key: string
  _type?: string
  label: string
  url: string
}

interface FooterColumn {
  _key: string
  heading: string
  links?: FooterLink[]
}

interface FooterSection {
  _key: string
  sectionLabel: string
  columns?: FooterColumn[]
}

const apply = process.argv.includes('--apply')

async function main(): Promise<void> {
  const doc = await sanityWriteClient.fetch<{ _id: string; sections?: FooterSection[] } | null>(
    '*[_type == "footer"][0]{ _id, sections }',
  )

  if (!doc) throw new Error('No footer document found.')

  const sections = doc.sections ?? []
  const section = sections.find((s) => s.sectionLabel === SECTION_LABEL)
  if (!section) throw new Error(`No "${SECTION_LABEL}" section in the footer.`)

  const column = section.columns?.find((c) => c.heading === COLUMN_HEADING)
  if (!column) throw new Error(`No "${COLUMN_HEADING}" column in "${SECTION_LABEL}".`)

  const links = column.links ?? []
  if (links.some((l) => l.url.endsWith('/contact'))) {
    console.log('Contact link already present. Nothing to do.')
    return
  }

  const newLink: FooterLink = {
    _key: randomUUID().replace(/-/g, '').slice(0, 12),
    _type: links[0]?._type ?? 'footerLink',
    label: LINK_LABEL,
    url: LINK_URL,
  }

  // Append to the end of the About column, so nothing above it moves.
  const nextSections = sections.map((s) =>
    s._key !== section._key
      ? s
      : {
          ...s,
          columns: s.columns?.map((c) =>
            c._key !== column._key ? c : { ...c, links: [...(c.links ?? []), newLink] },
          ),
        },
  )

  console.log(
    `${SECTION_LABEL} > ${COLUMN_HEADING} links after patch:`,
    [...links.map((l) => l.label), newLink.label].join(', '),
  )

  if (!apply) {
    console.log('\nDry run. Pass --apply to write.')
    return
  }

  await sanityWriteClient.patch(doc._id).set({ sections: nextSections }).commit()
  console.log('Written.')
}

main().catch((err: unknown) => {
  console.error(err)
  process.exitCode = 1
})

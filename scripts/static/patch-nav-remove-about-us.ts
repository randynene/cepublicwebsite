import 'dotenv/config'

import { sanityWriteClient } from '@/lib/content/sanity-write-client'

// Move "About Us" out of the header nav. The footer Company column already
// carries it ("About us" -> /about-us); this script only removes the header
// primary link, and adds the footer entry if it is somehow missing.
//
// Narrow, idempotent: one document field at a time (navigation.primaryLinks,
// then footer.sections when a footer insert is needed). Re-running is a no-op
// once About Us is gone from the header and present in the footer.
//
// Run:   npm run static:patch-nav-remove-about-us
// Token: SANITY_MIGRATION_WRITE_TOKEN

const ABOUT_URL = 'https://www.cloudemployee.io/about-us'

type Link = {
  _key?: string
  label?: string
  url?: string
  dropdownType?: string
  cmsDriven?: boolean
  dropdownItems?: unknown[]
  _type?: string
}

type FooterColumn = {
  _key?: string
  heading?: string
  links?: Link[]
}

type FooterSection = {
  _key?: string
  sectionLabel?: string
  columns?: FooterColumn[]
}

function isAboutLink(link: Link): boolean {
  const url = typeof link.url === 'string' ? link.url : ''
  const label = typeof link.label === 'string' ? link.label.toLowerCase() : ''
  return url.includes('/about-us') || label === 'about us'
}

async function main() {
  const nav = await sanityWriteClient.fetch<{ primaryLinks?: Link[] } | null>(
    `*[_id == "navigation"][0]{ primaryLinks }`,
  )
  const primaryLinks = nav?.primaryLinks ?? []
  const nextPrimary = primaryLinks.filter((link) => !isAboutLink(link))
  const removedCount = primaryLinks.length - nextPrimary.length

  if (removedCount === 0) {
    console.log('navigation.primaryLinks: About Us already absent.')
  } else {
    await sanityWriteClient.patch('navigation').set({ primaryLinks: nextPrimary }).commit()
    console.log(
      `navigation.primaryLinks: removed About Us (${primaryLinks.length} -> ${nextPrimary.length}).`,
    )
  }

  const footer = await sanityWriteClient.fetch<{ sections?: FooterSection[] } | null>(
    `*[_id == "footer"][0]{ sections }`,
  )
  const sections = footer?.sections ?? []
  const companyColumn = sections[1]?.columns?.[0]
  const companyLinks = companyColumn?.links ?? []
  const footerHasAbout = companyLinks.some(isAboutLink)

  if (footerHasAbout) {
    console.log('footer Company column: About Us already present.')
    return
  }

  if (!sections[1] || !companyColumn) {
    throw new Error('footer.sections[1].columns[0] (Company) is missing - cannot insert About Us.')
  }

  const nextSections = sections.map((section, sectionIndex) => {
    if (sectionIndex !== 1) return section
    return {
      ...section,
      columns: (section.columns ?? []).map((column, columnIndex) => {
        if (columnIndex !== 0) return column
        return {
          ...column,
          links: [
            {
              _key: 'fs-1-c-0-l-about-us',
              _type: 'footerLink',
              label: 'About us',
              url: ABOUT_URL,
            },
            ...(column.links ?? []),
          ],
        }
      }),
    }
  })

  await sanityWriteClient.patch('footer').set({ sections: nextSections }).commit()
  console.log('footer Company column: inserted About us at the top.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

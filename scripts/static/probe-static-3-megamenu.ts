// MYGRATR-STATIC-3 Step 0 — read-only mega-menu data confirmation probe.
//
// Runs the exact production NAVIGATION_QUERY projection (dereferences +
// type-aware icon select) and reports whether the three mega-menu blocks
// on the `navigation` doc actually hold populated content.
//
// READ ONLY. No writes, no patches. Exit 0 always; this is a report.
// Run: `tsx scripts/static/probe-static-3-megamenu.ts`

import 'dotenv/config'

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.SANITY_PROJECT_ID ?? 'lzbhll1u',
  dataset: process.env.SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
})

const MEGA_MENU_ITEM_PROJECTION = /* groq */ `
  _id, _type,
  "name": coalesce(name, technologyName),
  "slug": slug.current,
  "icon": select(
    _type == 'service' => null,
    _type == 'technology' => techLogo,
    null
  ),
  tagline
`

const NAVIGATION_QUERY = /* groq */ `
*[_id == "navigation"][0]{
  servicesMegaMenu{
    leftColumn{
      sectionLabel, sectionLink, sectionLabelStyle,
      highlightedItems[]->{ ${MEGA_MENU_ITEM_PROJECTION} },
      items[]->{ ${MEGA_MENU_ITEM_PROJECTION} },
      viewAllLink{ label, url }
    },
    rightColumnTop{
      sectionLabel, sectionLink, sectionLabelStyle,
      items[]->{ ${MEGA_MENU_ITEM_PROJECTION} },
      viewAllLink{ label, url }
    },
    rightColumnBottom{
      sections[]{ _key, sectionLabel, sectionLink, sectionLabelStyle, items[]->{ ${MEGA_MENU_ITEM_PROJECTION} } }
    }
  },
  howItWorksMegaMenu{
    cards[]{ _key, title, subtitle, image{ asset, alt }, ctaLabel, ctaUrl },
    bottomPanel{ heading, subheading, ctaLabel, ctaUrl, image{ asset, alt } }
  },
  resourcesMegaMenu{
    leftColumn{ sectionLabel, items[]{ _key, label, url, icon{ source, name, asset{ asset, alt }, alt } } },
    middleColumn{ sectionLabel, viewAllLink{ label, url }, featuredPosts[]->{ _id, _type, title, "slug": slug.current, thumbnailImage{ asset, alt } } },
    rightColumn{ sectionLabel, viewAllLink{ label, url }, featuredStories[]->{ _id, _type, "headline": coalesce(customerStoryTitle, companyName), "slug": slug.current, companyLogo{ asset, alt } } }
  }
}
`

async function main(): Promise<void> {
  const nav = await sanity.fetch(NAVIGATION_QUERY)
  if (!nav) {
    console.log('RESULT: navigation doc NOT FOUND — STOP.')
    return
  }

  const s = nav.servicesMegaMenu
  const h = nav.howItWorksMegaMenu
  const r = nav.resourcesMegaMenu

  console.log('=== SERVICES MEGA-MENU ===')
  console.log('leftColumn.sectionLabel     :', s?.leftColumn?.sectionLabel ?? '(none)')
  console.log('leftColumn.highlightedItems :', s?.leftColumn?.highlightedItems?.length ?? 0)
  console.log('leftColumn.items            :', s?.leftColumn?.items?.length ?? 0)
  console.log('rightColumnTop.sectionLabel :', s?.rightColumnTop?.sectionLabel ?? '(none)')
  console.log('rightColumnTop.items        :', s?.rightColumnTop?.items?.length ?? 0)
  console.log('rightColumnBottom.sections  :', s?.rightColumnBottom?.sections?.length ?? 0)
  if (s?.rightColumnBottom?.sections) {
    for (const sec of s.rightColumnBottom.sections) {
      console.log(`  - "${sec.sectionLabel}" items:`, sec.items?.length ?? 0)
    }
  }
  const firstTech = [
    ...(s?.leftColumn?.items ?? []),
    ...(s?.rightColumnTop?.items ?? []),
  ].find((i: { _type?: string }) => i?._type === 'technology')
  console.log('sample technology item      :', firstTech ? `${firstTech.name} icon=${firstTech.icon ? 'yes' : 'no'}` : '(none)')

  console.log('\n=== HOW IT WORKS MEGA-MENU ===')
  console.log('cards                       :', h?.cards?.length ?? 0)
  if (h?.cards) for (const c of h.cards) console.log(`  - "${c.title}" image=${c.image ? 'yes' : 'no'} cta="${c.ctaLabel}"`)
  console.log('bottomPanel.heading         :', h?.bottomPanel?.heading ?? '(none)')
  console.log('bottomPanel.image           :', h?.bottomPanel?.image ? 'yes' : 'no')

  console.log('\n=== RESOURCES MEGA-MENU ===')
  console.log('leftColumn.items            :', r?.leftColumn?.items?.length ?? 0)
  if (r?.leftColumn?.items) for (const i of r.leftColumn.items) console.log(`  - "${i.label}" iconSource=${i.icon?.source ?? '(none)'}`)
  console.log('middleColumn.featuredPosts  :', r?.middleColumn?.featuredPosts?.length ?? 0)
  console.log('rightColumn.featuredStories :', r?.rightColumn?.featuredStories?.length ?? 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

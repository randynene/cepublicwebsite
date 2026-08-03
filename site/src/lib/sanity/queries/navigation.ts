import 'server-only'

import { z } from 'zod'

import { sanityFetch } from '@/lib/sanity/live'
import { stegaEnum } from '@/lib/sanity/stega-enum'
import { SanityImageSchema } from '@/types/sanity/shared'

// MYGRATR-STATIC-2 Step 2 — navigation global fetch.
//
// Schema source of truth: studio/schemas/globals/navigation.ts.
//
// STATIC-1 baseline fields (kept):
//   primaryLinks[] (label, url, cmsDriven, cmsCollection, dropdownItems[]),
//   ctaButton ({ label, link, type }),
//   localeDropdown ({ enabled, options[{ label, url, hreflang }] })
//
// STATIC-2 additions (new):
//   primaryLinks[].dropdownType — 'none' | 'services-mega' | 'how-it-works-mega' | 'resources-mega'
//   servicesMegaMenu — hybrid CMS-driven; items are references to service/technology docs
//   howItWorksMegaMenu — 3 inline-image cards + inline-image bottom panel (Option B)
//   resourcesMegaMenu — left pill links (with discriminated icon), middle Blogs (refs),
//                       right Customer Stories (refs)
//
// Read-model nullability per TB18: every STATIC-2-added field is .nullable().optional().
// At STATIC-2 reseed completion (Step 4), all fields will be populated; the
// nullable shape preserves regression safety against STATIC-1's render which
// continues to read legacy fields throughout STATIC-2.

// ─── Pill style enum (5 variants per brief §3 Step 0 item 11)
const PillStyleSchema = stegaEnum([
  'pill-green',
  'pill-dark',
  'pill-gradient',
  'pill-navy',
  'pill-outline-light',
])
export type PillStyle = z.infer<typeof PillStyleSchema>

// ─── Dereferenced service/technology projection (used inside mega-menu items).
// Type-aware icon select() per DELTA-7: services have no icons (DELTA-B),
// technologies use techLogo.
const MegaMenuItemRefSchema = z.object({
  _id: z.string(),
  _type: stegaEnum(['service', 'technology']),
  name: z.string().nullable().optional(),
  slug: z.string().nullable().optional(),
  icon: SanityImageSchema.nullable().optional(),
  tagline: z.string().nullable().optional(),
})
export type MegaMenuItemRef = z.infer<typeof MegaMenuItemRefSchema>

// ─── Legacy primaryLink shape (kept) + new dropdownType discriminator
const DropdownItemSchema = z.object({
  _key: z.string(),
  label: z.string(),
  url: z.string(),
})

const PrimaryLinkSchema = z.object({
  _key: z.string(),
  label: z.string(),
  url: z.string(),
  dropdownType: stegaEnum([
    'none',
    'services-simple',
    'locations-simple',
    'services-mega',
    'how-it-works-mega',
    'resources-mega',
  ])
    .nullable()
    .optional(),
  // Legacy (kept; deprecated):
  cmsDriven: z.boolean().nullable().optional(),
  cmsCollection: z.string().nullable().optional(),
  dropdownItems: z.array(DropdownItemSchema).nullable().optional(),
})

// ─── Services mega-menu
const ViewAllLinkSchema = z
  .object({
    label: z.string().nullable().optional(),
    url: z.string().nullable().optional(),
  })
  .nullable()
  .optional()

const ServicesLeftColumnSchema = z.object({
  sectionLabel: z.string().nullable().optional(),
  sectionLink: z.string().nullable().optional(),
  sectionLabelStyle: PillStyleSchema.nullable().optional(),
  highlightedItems: z.array(MegaMenuItemRefSchema).nullable().optional(),
  items: z.array(MegaMenuItemRefSchema).nullable().optional(),
  viewAllLink: ViewAllLinkSchema,
})

const ServicesRightColumnTopSchema = z.object({
  sectionLabel: z.string().nullable().optional(),
  sectionLink: z.string().nullable().optional(),
  sectionLabelStyle: PillStyleSchema.nullable().optional(),
  items: z.array(MegaMenuItemRefSchema).nullable().optional(),
  viewAllLink: ViewAllLinkSchema,
})

const ServicesSubsectionSchema = z.object({
  _key: z.string(),
  sectionLabel: z.string().nullable().optional(),
  sectionLink: z.string().nullable().optional(),
  sectionLabelStyle: PillStyleSchema.nullable().optional(),
  items: z.array(MegaMenuItemRefSchema).nullable().optional(),
})

const ServicesRightColumnBottomSchema = z.object({
  sections: z.array(ServicesSubsectionSchema).nullable().optional(),
})

const ServicesMegaMenuSchema = z
  .object({
    leftColumn: ServicesLeftColumnSchema.nullable().optional(),
    rightColumnTop: ServicesRightColumnTopSchema.nullable().optional(),
    rightColumnBottom: ServicesRightColumnBottomSchema.nullable().optional(),
  })
  .nullable()
  .optional()

// ─── How It Works mega-menu (Option B locked — inline images)
const HowItWorksCardSchema = z.object({
  _key: z.string(),
  title: z.string(),
  subtitle: z.string().nullable().optional(),
  image: SanityImageSchema.nullable().optional(),
  ctaLabel: z.string(),
  ctaUrl: z.string(),
})

const HowItWorksBottomPanelSchema = z.object({
  heading: z.string().nullable().optional(),
  subheading: z.string().nullable().optional(),
  ctaLabel: z.string().nullable().optional(),
  ctaUrl: z.string().nullable().optional(),
  image: SanityImageSchema.nullable().optional(),
})

const HowItWorksMegaMenuSchema = z
  .object({
    cards: z.array(HowItWorksCardSchema).nullable().optional(),
    bottomPanel: HowItWorksBottomPanelSchema.nullable().optional(),
  })
  .nullable()
  .optional()

// ─── Resources mega-menu
const ResourcesIconSchema = z
  .object({
    source: stegaEnum(['material-font', 'asset']).nullable().optional(),
    name: z.string().nullable().optional(),
    asset: SanityImageSchema.nullable().optional(),
    alt: z.string().nullable().optional(),
  })
  .nullable()
  .optional()

const ResourcesLeftItemSchema = z.object({
  _key: z.string(),
  label: z.string(),
  url: z.string(),
  icon: ResourcesIconSchema,
})

const ResourcesLeftColumnSchema = z.object({
  sectionLabel: z.string().nullable().optional(),
  items: z.array(ResourcesLeftItemSchema).nullable().optional(),
})

const ResourcesFeaturedPostSchema = z.object({
  _id: z.string(),
  _type: z.literal('blogPost'),
  title: z.string().nullable().optional(),
  slug: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  thumbnailImage: SanityImageSchema.nullable().optional(),
})

const ResourcesFeaturedStorySchema = z.object({
  _id: z.string(),
  _type: z.literal('customerStory'),
  headline: z.string().nullable().optional(),
  slug: z.string().nullable().optional(),
  companyLogo: SanityImageSchema.nullable().optional(),
})

const ResourcesMiddleColumnSchema = z.object({
  sectionLabel: z.string().nullable().optional(),
  viewAllLink: ViewAllLinkSchema,
  featuredPosts: z.array(ResourcesFeaturedPostSchema).nullable().optional(),
})

const ResourcesRightColumnSchema = z.object({
  sectionLabel: z.string().nullable().optional(),
  viewAllLink: ViewAllLinkSchema,
  featuredStories: z.array(ResourcesFeaturedStorySchema).nullable().optional(),
})

const ResourcesMegaMenuSchema = z
  .object({
    leftColumn: ResourcesLeftColumnSchema.nullable().optional(),
    middleColumn: ResourcesMiddleColumnSchema.nullable().optional(),
    rightColumn: ResourcesRightColumnSchema.nullable().optional(),
  })
  .nullable()
  .optional()

// ─── Compact dropdowns (MYGRATR-NAV-SIMPLE) — Services + Locations.
// Small anchored dropdowns that replace the big Services mega-menu in the nav.
// Icons are Google Material Symbols ligature strings (e.g. 'groups').
const SimpleDropdownItemSchema = z.object({
  _key: z.string(),
  label: z.string(),
  subtitle: z.string().nullable().optional(),
  url: z.string(),
  icon: z.string().nullable().optional(),
})

const SimpleDropdownSectionSchema = z.object({
  _key: z.string(),
  sectionLabel: z.string().nullable().optional(),
  items: z.array(SimpleDropdownItemSchema).nullable().optional(),
})

const SimpleDropdownSchema = z
  .object({
    sections: z.array(SimpleDropdownSectionSchema).nullable().optional(),
  })
  .nullable()
  .optional()

// ─── CTA + locale dropdown (kept from STATIC-1)
const CtaButtonSchema = z
  .object({
    label: z.string().optional(),
    link: z.string().optional(),
    type: stegaEnum(['calendly', 'link', 'hubspotForm']).optional(),
  })
  .nullable()
  .optional()

const LocaleOptionSchema = z.object({
  _key: z.string(),
  label: z.string(),
  url: z.string(),
  hreflang: z.string(),
})

const LocaleDropdownSchema = z
  .object({
    enabled: z.boolean().optional(),
    options: z.array(LocaleOptionSchema).optional(),
  })
  .nullable()
  .optional()

const AnnouncementBarSchema = z
  .object({
    enabled: z.boolean().nullable().optional(),
    badgeLabel: z.string().nullable().optional(),
    message: z.string().nullable().optional(),
    linkLabel: z.string().nullable().optional(),
    linkUrl: z.string().nullable().optional(),
  })
  .nullable()
  .optional()

// ─── Top-level navigation
export const NavigationSchema = z.object({
  _id: z.string(),
  _type: z.string(),
  primaryLinks: z.array(PrimaryLinkSchema).optional(),
  ctaButton: CtaButtonSchema,
  localeDropdown: LocaleDropdownSchema,
  announcementBar: AnnouncementBarSchema,
  // STATIC-2 additions:
  servicesMegaMenu: ServicesMegaMenuSchema,
  howItWorksMegaMenu: HowItWorksMegaMenuSchema,
  resourcesMegaMenu: ResourcesMegaMenuSchema,
  // MYGRATR-NAV-SIMPLE additions:
  servicesDropdown: SimpleDropdownSchema,
  locationsDropdown: SimpleDropdownSchema,
})

export type NavigationDoc = z.infer<typeof NavigationSchema>
export type AnnouncementBar = z.infer<typeof AnnouncementBarSchema>
export type PrimaryLink = z.infer<typeof PrimaryLinkSchema>
export type DropdownItem = z.infer<typeof DropdownItemSchema>
export type LocaleOption = z.infer<typeof LocaleOptionSchema>
export type ServicesMegaMenu = z.infer<typeof ServicesMegaMenuSchema>
export type HowItWorksMegaMenu = z.infer<typeof HowItWorksMegaMenuSchema>
export type ResourcesMegaMenu = z.infer<typeof ResourcesMegaMenuSchema>
export type HowItWorksCard = z.infer<typeof HowItWorksCardSchema>
export type ResourcesLeftItem = z.infer<typeof ResourcesLeftItemSchema>
export type ResourcesIcon = z.infer<typeof ResourcesIconSchema>
export type SimpleDropdown = z.infer<typeof SimpleDropdownSchema>
export type SimpleDropdownSection = z.infer<typeof SimpleDropdownSectionSchema>
export type SimpleDropdownItem = z.infer<typeof SimpleDropdownItemSchema>

// ─── GROQ projection — dereferences mega-menu service/technology references
// with type-aware icon select() per DELTA-7 (service → null, technology → techLogo).
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
  _id,
  _type,
  primaryLinks[]{
    _key,
    label,
    url,
    dropdownType,
    cmsDriven,
    cmsCollection,
    dropdownItems[]{ _key, label, url }
  },
  ctaButton{ label, link, type },
  announcementBar{
    enabled,
    badgeLabel,
    message,
    linkLabel,
    linkUrl
  },
  localeDropdown{
    enabled,
    options[]{ _key, label, url, hreflang }
  },
  servicesDropdown{
    sections[]{
      _key,
      sectionLabel,
      items[]{ _key, label, subtitle, url, icon }
    }
  },
  locationsDropdown{
    sections[]{
      _key,
      sectionLabel,
      items[]{ _key, label, subtitle, url, icon }
    }
  },
  servicesMegaMenu{
    leftColumn{
      sectionLabel,
      sectionLink,
      sectionLabelStyle,
      highlightedItems[]->{ ${MEGA_MENU_ITEM_PROJECTION} },
      items[]->{ ${MEGA_MENU_ITEM_PROJECTION} },
      viewAllLink{ label, url }
    },
    rightColumnTop{
      sectionLabel,
      sectionLink,
      sectionLabelStyle,
      items[]->{ ${MEGA_MENU_ITEM_PROJECTION} },
      viewAllLink{ label, url }
    },
    rightColumnBottom{
      sections[]{
        _key,
        sectionLabel,
        sectionLink,
        sectionLabelStyle,
        items[]->{ ${MEGA_MENU_ITEM_PROJECTION} }
      }
    }
  },
  howItWorksMegaMenu{
    cards[]{
      _key,
      title,
      subtitle,
      image{ asset, alt },
      ctaLabel,
      ctaUrl
    },
    bottomPanel{
      heading,
      subheading,
      ctaLabel,
      ctaUrl,
      image{ asset, alt }
    }
  },
  resourcesMegaMenu{
    leftColumn{
      sectionLabel,
      items[]{
        _key,
        label,
        url,
        icon{
          source,
          name,
          asset{ asset, alt },
          alt
        }
      }
    },
    middleColumn{
      sectionLabel,
      viewAllLink{ label, url },
      featuredPosts[]->{
        _id,
        _type,
        title,
        "slug": slug.current,
        // Blog posts route at /<category>/<slug>, so the category IS part of the
        // URL. Without it refToHref fell back to /blog/<slug> — a path that
        // matches no route, because "blog" is not one of the six categories. The
        // Resources mega-menu's featured post links were 404s on every page of
        // the site, and SSR-mounted for crawlers (Tech Debt #47 P0-1), so Google
        // was being fed them too.
        "category": category->slug.current,
        thumbnailImage{ asset, alt }
      }
    },
    rightColumn{
      sectionLabel,
      viewAllLink{ label, url },
      featuredStories[]->{
        _id,
        _type,
        "headline": coalesce(customerStoryTitle, companyName),
        "slug": slug.current,
        companyLogo{ asset, alt }
      }
    }
  }
}
`

/**
 * Canonical order for the talent locations, by URL slug: Eastern Europe, then
 * Latin America, then Philippines (Seb, 28 Jul).
 *
 * Applied in code rather than left to the dataset because the Sanity document
 * is still in the old order and the fix is a business decision, not an
 * editorial one. `scripts/static/reorder-locations.ts` puts the DATA into the
 * same order; once that has run this sort is a no-op, and it can be deleted
 * if Seb should be free to reorder these in Studio.
 */
const LOCATION_ORDER = [
  'eastern-europe-developers',
  'latam-developers',
  'philippines-developers',
] as const

function locationRank(url: string | null | undefined): number {
  const i = LOCATION_ORDER.findIndex((slug) => (url ?? '').includes(slug))
  return i === -1 ? LOCATION_ORDER.length : i
}

/** Stable sort — anything not in LOCATION_ORDER keeps its authored position,
 *  after the three known regions. */
export function orderLocations<T extends { url?: string | null }>(items: T[]): T[] {
  return items
    .map((item, i) => ({ item, i, rank: locationRank(item.url) }))
    .sort((a, b) => a.rank - b.rank || a.i - b.i)
    .map((entry) => entry.item)
}

/**
 * Services-dropdown sections hidden from the nav for now (Jake, 3 Aug).
 * "Build With Us" (Product delivery + AI services) comes back later, so the
 * data stays in Sanity untouched and this list is the only thing to empty.
 * Matched on section key and label, because a section re-created in Studio
 * gets a fresh key.
 */
const HIDDEN_SERVICES_SECTIONS = {
  keys: ['svc-build'],
  labels: ['build with us'],
} as const

function visibleServicesSections(dropdown: SimpleDropdown): SimpleDropdown {
  const sections = dropdown?.sections
  if (!sections?.length) return dropdown
  return {
    ...dropdown,
    sections: sections.filter((section) => {
      const key = section._key ?? ''
      const label = (section.sectionLabel ?? '').trim().toLowerCase()
      return (
        !HIDDEN_SERVICES_SECTIONS.keys.includes(key as never) &&
        !HIDDEN_SERVICES_SECTIONS.labels.includes(label as never)
      )
    }),
  }
}

export async function fetchNavigation(): Promise<NavigationDoc | null> {
  const { data } = await sanityFetch({ query: NAVIGATION_QUERY })
  if (data === null || data === undefined) return null
  const nav = NavigationSchema.parse(data)

  const normalised: NavigationDoc = {
    ...nav,
    servicesDropdown: visibleServicesSections(nav.servicesDropdown),
  }

  const sections = normalised.locationsDropdown?.sections
  if (sections?.length) {
    return {
      ...normalised,
      locationsDropdown: {
        ...normalised.locationsDropdown,
        sections: sections.map((section) => ({
          ...section,
          items: section.items ? orderLocations(section.items) : section.items,
        })),
      },
    }
  }
  return normalised
}

// Predicate — a primary link has a non-empty dropdown rendered in
// desktop and accordion-rendered in the mobile drawer.
// STATIC-1 used `dropdownItems.length > 0`. STATIC-2+ should use
// `dropdownType !== 'none'`; both predicates kept for regression safety.
export function hasDropdown(link: PrimaryLink): boolean {
  return Array.isArray(link.dropdownItems) && link.dropdownItems.length > 0
}

export function hasMegaMenu(link: PrimaryLink): boolean {
  return link.dropdownType !== undefined && link.dropdownType !== null && link.dropdownType !== 'none'
}

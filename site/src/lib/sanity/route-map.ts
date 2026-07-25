// MYGRATR-STATIC-3 Step 1 — typed reference-to-route mapper.
//
// Used by the Services and Resources mega-menus (and any future surface that
// renders Sanity reference items as links) to compose an internal href from a
// dereferenced doc's `_type` + `slug`. The Sanity reference itself doesn't carry
// a URL — only `_id`, `_type`, and `slug.current` (per MEGA_MENU_ITEM_PROJECTION
// in site/src/lib/sanity/queries/navigation.ts).
//
// Distinct from `toInternalHref()` at `site/src/lib/url.ts`, which strips
// fully-qualified host prefixes. This helper composes routes from doc shapes,
// and applies the locale itself.
//
// Returns null when the route cannot be built. Callers filter those entries out
// before rendering: a link that is not drawn is strictly better than one that
// 404s.

import { buildLocalePath, type Locale } from '@/lib/locale-path'

export type RoutableRefShape = {
  _type: string
  slug: string | null | undefined
  /** Category slug. Required for blogPost — it is part of the URL. */
  category?: string | null
}

export function refToHref(item: RoutableRefShape, locale: Locale = 'en-US'): string | null {
  if (!item.slug) return null

  const path = ((): string | null => {
    switch (item._type) {
      case 'service':
        return `/services/${item.slug}`
      case 'technology':
        return `/technology/${item.slug}`
      case 'customerStory':
        return `/customer-story/${item.slug}`
      case 'blogPost':
        // Blog posts route at /<category>/<slug>. This used to return
        // `/blog/${slug}`, which matches NO route — "blog" is a hub, not one of
        // the six categories — so every featured-post link in the Resources
        // mega-menu 404'd, on every page of the site, including for crawlers
        // (the mega-menu links are SSR-mounted per Tech Debt #47 P0-1, so Google
        // was being fed them).
        //
        // Returning null when the category is missing is deliberate. A missing
        // category means we cannot know the URL, and inventing one is precisely
        // what caused the bug.
        return item.category ? `/${item.category}/${item.slug}` : null
      default:
        return null
    }
  })()

  return path === null ? null : buildLocalePath(path, locale)
}

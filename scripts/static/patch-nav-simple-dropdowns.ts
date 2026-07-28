/**
 * MYGRATR-NAV-SIMPLE — rewrite the nav to compact Services + Locations
 * dropdowns, and add Eastern Europe to the footer's Talent Locations.
 *
 * WHAT THIS DOES (additive + targeted .set — does NOT touch the CTA,
 * announcement bar, or the legacy mega-menu data, which stay in the doc):
 *   1. navigation.primaryLinks → the new 6-item nav:
 *        Services (compact) / Locations (compact) / Case Studies /
 *        Pricing / For Engineers   (+ the existing Schedule a Call CTA)
 *   2. navigation.servicesDropdown → Hire Talent + Build With Us groups
 *   3. navigation.locationsDropdown → Eastern Europe / LATAM / Philippines
 *   4. footer.talentLocations.items → add Eastern Europe if missing
 *
 * ⚠️ CONFIRM BEFORE/AFTER RUN — two Services destinations have no exact
 *    1:1 page on the live site, so they point at the closest REAL page
 *    (no 404). Change them in Studio (Navigation → Services dropdown) or
 *    edit SERVICES_DROPDOWN below and re-run:
 *      - "Product delivery" → /services/mvp-development   (best-fit)
 *      - "AI services"      → /services/ai-consulting     (best-fit)
 *    Confirmed-exact: Hire engineers → software-engineers,
 *    Fractional CTO → fractional-ctos, all 3 Locations.
 *
 * Idempotent: re-running overwrites the same fields with the same values.
 *
 * Usage (from repo root, with SANITY_MIGRATION_WRITE_TOKEN in .env):
 *   npx tsx scripts/static/patch-nav-simple-dropdowns.ts
 */

import 'dotenv/config'

import { createClient } from '@sanity/client'

const projectId =
  process.env.SANITY_PROJECT_ID ??
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ??
  'lzbhll1u'
const dataset =
  process.env.SANITY_DATASET ?? process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'
const token = process.env.SANITY_MIGRATION_WRITE_TOKEN

if (!token) {
  console.error('Missing SANITY_MIGRATION_WRITE_TOKEN in .env (repo root).')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2024-01-01',
  useCdn: false,
})

// Sanity `url` fields store fully-qualified CE URLs; the app strips the host
// to render them as internal Next.js links (see site/src/lib/url.ts).
const CE_HOST = 'https://www.cloudemployee.io'
const url = (p: string) => `${CE_HOST}${p}`

// ── Primary links (left→right). CTA "Schedule a Call" is left untouched.
const PRIMARY_LINKS = [
  { _key: 'pl-services', label: 'Services', url: url('/services'), dropdownType: 'services-simple' },
  { _key: 'pl-locations', label: 'Locations', url: url('/services/latam-developers'), dropdownType: 'locations-simple' },
  { _key: 'pl-case-studies', label: 'Case Studies', url: url('/our-work'), dropdownType: 'none' },
  { _key: 'pl-pricing', label: 'Pricing', url: url('/pricing'), dropdownType: 'none' },
  { _key: 'pl-for-engineers', label: 'For Engineers', url: url('/for-developers'), dropdownType: 'none' },
].map((l) => ({ _type: 'primaryLink' as const, cmsDriven: false, dropdownItems: [] as unknown[], ...l }))

// ── Services compact dropdown (matches the reference screenshot).
const SERVICES_DROPDOWN = {
  _type: 'object' as const,
  sections: [
    {
      _key: 'svc-hire',
      _type: 'servicesDropdownSection' as const,
      sectionLabel: 'Hire Talent',
      items: [
        {
          _key: 'svc-hire-eng',
          _type: 'servicesDropdownItem' as const,
          label: 'Hire engineers',
          subtitle: '2 matched profiles in 7 days',
          url: url('/services/software-engineers'),
          icon: 'groups',
        },
        {
          _key: 'svc-hire-cto',
          _type: 'servicesDropdownItem' as const,
          label: 'Fractional CTO',
          subtitle: 'Senior tech leadership, 1-2 days a week',
          url: url('/services/fractional-ctos'),
          icon: 'explore',
        },
      ],
    },
    {
      _key: 'svc-build',
      _type: 'servicesDropdownSection' as const,
      sectionLabel: 'Build With Us',
      items: [
        {
          _key: 'svc-build-prod',
          _type: 'servicesDropdownItem' as const,
          label: 'Product delivery',
          subtitle: 'From idea to shipped product',
          // ⚠️ best-fit real page — confirm/repoint (no /services/product-delivery exists)
          url: url('/services/mvp-development'),
          icon: 'rocket_launch',
        },
        {
          _key: 'svc-build-ai',
          _type: 'servicesDropdownItem' as const,
          label: 'AI services',
          subtitle: 'We find what to automate, then build it',
          // ⚠️ best-fit real page — confirm/repoint (no /services/ai-services exists)
          url: url('/services/ai-consulting'),
          icon: 'auto_awesome',
        },
      ],
    },
  ],
}

// ── Locations compact dropdown (single unlabelled group).
const LOCATIONS_DROPDOWN = {
  _type: 'object' as const,
  sections: [
    {
      _key: 'loc-group',
      _type: 'locationsDropdownSection' as const,
      // Order per Seb, 28 Jul review: Eastern Europe, Latin America,
      // Philippines. Kept in sync with scripts/static/reorder-locations.ts so
      // re-running this seed does not undo that reorder.
      items: [
        {
          _key: 'loc-ee',
          _type: 'locationsDropdownItem' as const,
          label: 'Eastern Europe',
          subtitle: 'Top-tier technical and AI talent',
          url: url('/services/eastern-europe-developers'),
          icon: 'location_on',
        },
        {
          _key: 'loc-latam',
          _type: 'locationsDropdownItem' as const,
          label: 'Latin America',
          subtitle: 'Real-time overlap with US teams',
          url: url('/services/latam-developers'),
          icon: 'location_on',
        },
        {
          _key: 'loc-ph',
          _type: 'locationsDropdownItem' as const,
          label: 'Philippines',
          subtitle: 'Exceptional English, UK-friendly hours',
          url: url('/services/philippines-developers'),
          icon: 'location_on',
        },
      ],
    },
  ],
}

const EASTERN_EUROPE_FOOTER_ITEM = {
  _key: 'tl-eastern-europe',
  _type: 'talentLocationItem' as const,
  label: 'Eastern Europe Developers',
  url: url('/services/eastern-europe-developers'),
}

async function main() {
  console.log('MYGRATR-NAV-SIMPLE — patching navigation + footer\n')

  // 1-3. Navigation.
  console.log('[1/2] navigation.primaryLinks + servicesDropdown + locationsDropdown...')
  await client
    .patch('navigation')
    .set({
      primaryLinks: PRIMARY_LINKS,
      servicesDropdown: SERVICES_DROPDOWN,
      locationsDropdown: LOCATIONS_DROPDOWN,
    })
    .commit()
  console.log('  navigation OK')

  // 4. Footer talent locations — append Eastern Europe if missing.
  console.log('[2/2] footer.talentLocations (add Eastern Europe)...')
  const footer = await client.fetch<{
    talentLocations?: { items?: Array<{ _key: string; url?: string }> }
  } | null>(`*[_id == "footer"][0]{ talentLocations }`)
  const existing = footer?.talentLocations?.items ?? []
  const hasEE = existing.some((i) => (i.url ?? '').includes('/services/eastern-europe-developers'))
  if (hasEE) {
    console.log('  Eastern Europe already present — no change')
  } else {
    await client
      .patch('footer')
      .setIfMissing({ 'talentLocations.items': [] })
      .append('talentLocations.items', [EASTERN_EUROPE_FOOTER_ITEM])
      .commit()
    console.log('  footer OK (Eastern Europe appended)')
  }

  console.log('\nDone. Nav = Services / Locations / Case Studies / Pricing / For Engineers + Schedule a Call.')
  console.log('⚠️ Confirm the 2 flagged Services destinations (Product delivery, AI services).')
}

main().catch((err) => {
  console.error('\nFAIL:', err)
  process.exit(1)
})

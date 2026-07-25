import {
  EASTERN_EUROPE_CONTENT,
  LATAM_CONTENT,
  PHILIPPINES_CONTENT,
} from '@/components/templates/location/content'
import type { LocationContent } from '@/components/templates/location/content'

// Registry of location pages served by the bespoke Location template at the
// existing ranking service URLs (/services/<slug>). The /services/[slug] route
// (+ UK mirror) checks this before fetching a Sanity service doc: a hit renders
// LocationTemplate + location JSON-LD + region metadata; a miss falls through to
// the generic service-detail template.
//
// latam-developers / philippines-developers are existing Sanity service slugs;
// eastern-europe-developers is net-new (no service doc) - the branch renders it
// regardless, and generateStaticParams unions these slugs so all three
// pre-render.

export interface LocationEntry {
  slug: string
  content: LocationContent
  metaTitle: string
  metaDescription: string
}

export const LOCATION_REGISTRY: Record<string, LocationEntry> = {
  'latam-developers': {
    slug: 'latam-developers',
    content: LATAM_CONTENT,
    metaTitle: 'Hire senior engineers in Latin America',
    metaDescription: LATAM_CONTENT.hero.paragraph,
  },
  'eastern-europe-developers': {
    slug: 'eastern-europe-developers',
    content: EASTERN_EUROPE_CONTENT,
    metaTitle: 'Hire senior engineers in Eastern Europe',
    metaDescription: EASTERN_EUROPE_CONTENT.hero.paragraph,
  },
  'philippines-developers': {
    slug: 'philippines-developers',
    content: PHILIPPINES_CONTENT,
    metaTitle: 'Hire senior engineers in the Philippines',
    metaDescription: PHILIPPINES_CONTENT.hero.paragraph,
  },
}

export const LOCATION_SLUGS = Object.keys(LOCATION_REGISTRY)

export function getLocationEntry(slug: string): LocationEntry | null {
  return LOCATION_REGISTRY[slug] ?? null
}

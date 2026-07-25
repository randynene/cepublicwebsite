import 'server-only'

import {
  fetchHubChildren,
  type HubChildItem,
  type HubType,
} from '@/lib/sanity/queries/hubs'

// Which articles are featured, and which are left for the grid. Spec §3 and §9.
//
// This is the only place that answers that question, because the two halves of the
// answer must agree: an article in the featured block must NOT also appear in the grid
// below it, or the same post is on the page twice. So the grid's exclusion list is
// derived from the featured set, not computed separately.
//
// Two rules from the spec, both of which exist because of what the data actually looks
// like rather than as abstractions:
//
//   AUTO-FILL. No editor has pinned anything on any of the seven pages, so a
//   "pinned-only" block would render empty everywhere - which is why the block was
//   never built in the first place. Featured = pinned first, then topped up with the
//   most recent articles until it has five. Editors can pin 1-5 later to override
//   slots left to right, and nothing about the page changes when they do.
//
//   SUPPRESSION AT FEWER THAN 8. Featuring five of a six-article set means the grid
//   below shows one card, and featuring five of three is impossible. Below eight
//   articles the block is suppressed and the page is a single grid. This is not a
//   hypothetical: it hits /hiring-tips (6), /managing-engineers (6) and
//   /ai-in-software-development (3), and leaves featured on /blog (70),
//   /staff-augmentation (34), /nearshoring-offshoring (12) and /scaling-teams (9).

/** Items in the featured block when it renders at all. */
export const FEATURED_COUNT = 5

/**
 * Below this, no featured block: five featured plus a meaningful grid needs eight.
 * Spec §9.
 */
export const FEATURED_MIN_ARTICLES = 8

export type FeaturedResult = {
  /** The five cards, or empty when the block is suppressed. */
  items: HubChildItem[]
  /** IDs the grid must exclude, so nothing appears twice. */
  excludeIds: string[]
}

/**
 * The featured set for a hub.
 *
 * `pinned` are the editor's `featuredArticles` refs, already in their chosen order.
 * `totalArticles` is the hub's FULL article count, before any exclusion - the
 * threshold is a property of the topic, not of what is left after filtering.
 *
 * Featured only ever appears on page 1. On page 2 of /blog, a "Featured" block would
 * be repeating the same five posts above a different twelve, and the reader has
 * already scrolled past them once.
 */
export async function resolveFeatured(
  hubType: HubType,
  pinned: HubChildItem[],
  totalArticles: number,
  page: number,
): Promise<FeaturedResult> {
  if (page !== 1 || totalArticles < FEATURED_MIN_ARTICLES) {
    return { items: [], excludeIds: [] }
  }

  const items = pinned.slice(0, FEATURED_COUNT)
  const shortfall = FEATURED_COUNT - items.length

  if (shortfall > 0) {
    // Top up with the most recent, skipping anything already pinned. Fetched through
    // the hub's own child query so the top-ups obey the hub's sort and its filters -
    // a hand-rolled "latest posts" query here would quietly diverge from the grid's
    // idea of what belongs on this page.
    const fill = await fetchHubChildren(hubType, {
      offset: 0,
      limit: shortfall,
      excludeIds: items.map((i) => i._id),
    })
    items.push(...fill)
  }

  return { items, excludeIds: items.map((i) => i._id) }
}

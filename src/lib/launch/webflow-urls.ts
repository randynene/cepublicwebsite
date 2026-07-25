// Every URL the live Webflow site serves, straight from Webflow.
//
// This is the authoritative source, and it closes a hole the other corpus
// sources could not. The April crawl, the redirect export, the live sitemap and
// the Search Console / Ahrefs exports all describe pages that someone has
// LOOKED AT — crawled, linked, ranked. A page that exists, is published, and
// happens to have no inbound links and no ranking is invisible to every one of
// them, and would have been silently dropped at cutover with nothing to catch it.
//
// /legals/general-terms is exactly that: a live 200 page in both locales, absent
// from all five sources. So is the seven-page /start-hiring funnel beyond the two
// steps that happen to rank. Asking Webflow directly is the only way to see them.
//
// Two halves:
//   - STATIC pages, from GET /sites/{id}/pages. `publishedPath` is the URL.
//     CMS template pages (those with a collectionId) are excluded: they are the
//     templates that render collection items, not addressable pages themselves.
//   - CMS items, from each collection, with the route prefix that collection's
//     detail template uses. That mapping cannot be read from the API, so it lives
//     in COLLECTION_ROUTES below, verified against the live site.
import { env } from '@/lib/env'
import { CE_BLOG_COLLECTIONS, CE_COLLECTION_IDS } from '@/lib/content/ce-collection-ids'
import { getLiveCollectionItems } from '@/lib/content/webflow-read-client'

type WebflowPage = {
  slug: string | null
  publishedPath: string | null
  draft?: boolean
  archived?: boolean
  collectionId?: string | null
}

/**
 * Route prefix per CMS collection, verified against production one type at a
 * time. Webflow is NOT consistent about pluralisation — the download hub is
 * /downloads but its detail pages are /download/<slug>, and the customer-stories
 * hub is plural while its detail pages are /customer-story/<slug>. Assuming the
 * hub's plural form is the detail prefix is what put the download route at a URL
 * that 404s. Never infer these; check them.
 *
 * Blog posts are absent on purpose: they route at /<category>/<slug>, so the URL
 * depends on a reference the collection item does not carry. They are covered
 * anyway — every blog post is in the live sitemap.
 */
const COLLECTION_ROUTES: Array<{ collectionId: string; prefix: string }> = [
  { collectionId: CE_COLLECTION_IDS.compareBlogs, prefix: '/compare' },
  { collectionId: CE_COLLECTION_IDS.customerStories, prefix: '/customer-story' },
  { collectionId: CE_COLLECTION_IDS.services, prefix: '/services' },
  { collectionId: CE_COLLECTION_IDS.technologyPages, prefix: '/technology' },
  { collectionId: CE_COLLECTION_IDS.teamMembers, prefix: '/team' },
  { collectionId: CE_COLLECTION_IDS.reviews, prefix: '/reviews' },
  { collectionId: CE_COLLECTION_IDS.videos, prefix: '/videos' },
  { collectionId: CE_COLLECTION_IDS.toolsQuizzes, prefix: '/tools' },
  { collectionId: CE_COLLECTION_IDS.downloads, prefix: '/download' },
  { collectionId: CE_COLLECTION_IDS.downloadsAccess, prefix: '/download-thank-you' },
  { collectionId: CE_COLLECTION_IDS.bookACall, prefix: '/book-a-call' },
  { collectionId: CE_COLLECTION_IDS.eventsWebinars, prefix: '/events' },
  // Not migrated to Sanity as a collection — the two legal pages become
  // singletons. Included here because they are live URLs and therefore in scope
  // for parity, which is how /legals/general-terms was found at all.
  { collectionId: '673b0e5be824148d8429f0f4', prefix: '/legals' },
]

async function fetchAllPages(): Promise<WebflowPage[]> {
  const pages: WebflowPage[] = []
  let offset = 0
  const limit = 100

  for (;;) {
    const res = await fetch(
      `https://api.webflow.com/v2/sites/${env.WEBFLOW_SITE_ID}/pages?limit=${limit}&offset=${offset}`,
      {
        headers: {
          Authorization: `Bearer ${env.WEBFLOW_API_TOKEN}`,
          'accept-version': '2.0.0',
        },
      },
    )
    if (!res.ok) throw new Error(`Webflow pages API: ${res.status} ${await res.text()}`)
    const data = (await res.json()) as { pages: WebflowPage[] }
    pages.push(...data.pages)
    if (data.pages.length < limit) break
    offset += limit
  }

  return pages
}

export type WebflowUrls = {
  staticPaths: string[]
  cmsPaths: string[]
}

export async function collectWebflowUrls(): Promise<WebflowUrls> {
  const pages = await fetchAllPages()

  const staticPaths = pages
    .filter((p) => p.draft !== true && p.archived !== true && !p.collectionId)
    .map((p) => p.publishedPath)
    .filter((path): path is string => !!path && path.startsWith('/'))
    // Webflow's own utility pages. /401 and /404 are error pages Webflow serves
    // directly; /search is its site-search page. None has an equivalent on Next,
    // and probing them tells us nothing actionable.
    .filter((path) => !['/401', '/404', '/search'].includes(path))
    .map((path) => path.replace(/\/$/, '') || '/')

  const cmsPaths: string[] = []
  for (const { collectionId, prefix } of COLLECTION_ROUTES) {
    const items = await getLiveCollectionItems(collectionId)
    for (const item of items) {
      const slug = item.fieldData['slug']
      if (typeof slug === 'string' && slug) cmsPaths.push(`${prefix}/${slug}`)
    }
  }

  // Blog collections are enumerated for completeness of the SLUG set even though
  // their URL needs the category; the sitemap already carries their real URLs.
  void CE_BLOG_COLLECTIONS

  return {
    staticPaths: [...new Set(staticPaths)].sort(),
    cmsPaths: [...new Set(cmsPaths)].sort(),
  }
}

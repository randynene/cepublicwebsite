import type { MetadataRoute } from 'next'

import { env } from '@/lib/env'
import { generateCanonical, generateHreflang, LOCALES } from '@/lib/locale'
import { HUB_CONFIG, type HubType } from '@/lib/sanity/queries/hubs'
import { redirectedPaths } from '@/lib/redirects'
import { NOT_RETIRED } from '@/lib/sanity/queries/_filters'
import { sanityClient } from '@/lib/sanity/client'

// Per-document-type URL builders. Each TEMPLATE-* phase adds its
// builder entry as it ships. Build-time evaluation only — sitemap
// runs at build / revalidate, not at request render, so the bare
// sanityClient is correct (not sanityFetch / Visual Editing wrapper)
// per CMA F5 v1.3.

type SitemapDocBase = { _type: string; _updatedAt: string }

type BlogSitemapDoc = SitemapDocBase & {
  _type: 'blogPost'
  slug: string
  category: string
}

type TeamMemberSitemapDoc = SitemapDocBase & {
  _type: 'teamMember'
  slug: string
  /** UK page only; the US page 404s. See VISIBLE_IN_LOCALE in queries/_filters.ts. */
  ukOnly?: boolean
}

type ReviewSitemapDoc = SitemapDocBase & {
  _type: 'review'
  slug: string
}

type VideoSitemapDoc = SitemapDocBase & {
  _type: 'video'
  slug: string
}

type ToolSitemapDoc = SitemapDocBase & {
  _type: 'tool'
  slug: string
}

type DownloadSitemapDoc = SitemapDocBase & {
  _type: 'download'
  slug: string
}

type BookACallSitemapDoc = SitemapDocBase & {
  _type: 'bookACall'
  slug: string
}

type CompareBlogSitemapDoc = SitemapDocBase & {
  _type: 'compareBlog'
  slug: string
}

type CustomerStorySitemapDoc = SitemapDocBase & {
  _type: 'customerStory'
  slug: string
}

type ServiceSitemapDoc = SitemapDocBase & {
  _type: 'service'
  slug: string
}

type TechnologySitemapDoc = SitemapDocBase & {
  _type: 'technology'
  slug: string
}

type AnySitemapDoc =
  | BlogSitemapDoc
  | TeamMemberSitemapDoc
  | ReviewSitemapDoc
  | VideoSitemapDoc
  | ToolSitemapDoc
  | DownloadSitemapDoc
  | BookACallSitemapDoc
  | CompareBlogSitemapDoc
  | CustomerStorySitemapDoc
  | ServiceSitemapDoc
  | TechnologySitemapDoc

const URL_BUILDERS: Record<
  string,
  (doc: AnySitemapDoc, locale: 'default' | 'uk') => string
> = {
  blogPost: (doc, locale) => {
    if (doc._type !== 'blogPost') return ''
    const prefix = locale === 'uk' ? '/uk' : ''
    return `${prefix}/${doc.category}/${doc.slug}`
  },
  teamMember: (doc, locale) => {
    if (doc._type !== 'teamMember') return ''
    // A ukOnly person has no US page: /team/<slug> 404s, matching live. Listing it
    // would put a guaranteed 404 in the sitemap, which is the fastest way to lose
    // Google's trust in the rest of the file.
    if (doc.ukOnly && locale === 'default') return ''
    const prefix = locale === 'uk' ? '/uk' : ''
    return `${prefix}/team/${doc.slug}`
  },
  review: (doc, locale) => {
    if (doc._type !== 'review') return ''
    const prefix = locale === 'uk' ? '/uk' : ''
    return `${prefix}/reviews/${doc.slug}`
  },
  video: (doc, locale) => {
    if (doc._type !== 'video') return ''
    const prefix = locale === 'uk' ? '/uk' : ''
    return `${prefix}/videos/${doc.slug}`
  },
  tool: (doc, locale) => {
    if (doc._type !== 'tool') return ''
    const prefix = locale === 'uk' ? '/uk' : ''
    return `${prefix}/tools/${doc.slug}`
  },
  // SINGULAR /download/<slug>, not /downloads/. The hub is /downloads (plural)
  // but Webflow serves the detail pages from /download/ — verified against live,
  // where /downloads/10-ai-prompts 404s and /download/10-ai-prompts returns 200.
  // Emitting the plural form 404'd the two real, ranking URLs and advertised four
  // invented ones in the sitemap. Same class of bug as the customer-story cards.
  download: (doc, locale) => {
    if (doc._type !== 'download') return ''
    const prefix = locale === 'uk' ? '/uk' : ''
    return `${prefix}/download/${doc.slug}`
  },
  bookACall: (doc, locale) => {
    if (doc._type !== 'bookACall') return ''
    const prefix = locale === 'uk' ? '/uk' : ''
    return `${prefix}/book-a-call/${doc.slug}`
  },
  compareBlog: (doc, locale) => {
    if (doc._type !== 'compareBlog') return ''
    const prefix = locale === 'uk' ? '/uk' : ''
    return `${prefix}/compare/${doc.slug}`
  },
  // Detail route is SINGULAR (/customer-story/[slug]); the hub is plural.
  customerStory: (doc, locale) => {
    if (doc._type !== 'customerStory') return ''
    const prefix = locale === 'uk' ? '/uk' : ''
    return `${prefix}/customer-story/${doc.slug}`
  },
  service: (doc, locale) => {
    if (doc._type !== 'service') return ''
    const prefix = locale === 'uk' ? '/uk' : ''
    return `${prefix}/services/${doc.slug}`
  },
  // Detail route is SINGULAR (/technology/[slug]); the hub is /technology.
  technology: (doc, locale) => {
    if (doc._type !== 'technology') return ''
    const prefix = locale === 'uk' ? '/uk' : ''
    return `${prefix}/technology/${doc.slug}`
  },
}

const BLOG_SITEMAP_QUERY = /* groq */ `
*[_type == "blogPost" && defined(slug.current) && defined(category->slug.current) && ${NOT_RETIRED}]{
  _type,
  "slug": slug.current,
  "category": category->slug.current,
  _updatedAt
}
`

const TEAM_MEMBER_SITEMAP_QUERY = /* groq */ `
*[_type == "teamMember"
  && defined(slug.current)
  && _id != "smoke-test-team-member"
  && ${NOT_RETIRED}
]{
  _type,
  "slug": slug.current,
  ukOnly,
  _updatedAt
}
`

const REVIEW_SITEMAP_QUERY = /* groq */ `
*[_type == "review" && defined(slug.current) && ${NOT_RETIRED}]{
  _type,
  "slug": slug.current,
  _updatedAt
}
`

const VIDEO_SITEMAP_QUERY = /* groq */ `
*[_type == "video" && defined(slug.current) && ${NOT_RETIRED}]{
  _type,
  "slug": slug.current,
  _updatedAt
}
`

const DOWNLOAD_SITEMAP_QUERY = /* groq */ `
*[_type == "download" && defined(slug.current) && ${NOT_RETIRED}]{
  _type,
  "slug": slug.current,
  _updatedAt
}
`

const TOOL_SITEMAP_QUERY = /* groq */ `
*[_type == "tool" && defined(slug.current) && ${NOT_RETIRED}]{
  _type,
  "slug": slug.current,
  _updatedAt
}
`

const BOOK_A_CALL_SITEMAP_QUERY = /* groq */ `
*[_type == "bookACall" && defined(slug.current) && ${NOT_RETIRED}]{
  _type,
  "slug": slug.current,
  _updatedAt
}
`

const COMPARE_BLOG_SITEMAP_QUERY = /* groq */ `
*[_type == "compareBlog" && defined(slug.current) && ${NOT_RETIRED}]{
  _type,
  "slug": slug.current,
  _updatedAt
}
`

const CUSTOMER_STORY_SITEMAP_QUERY = /* groq */ `
*[_type == "customerStory" && defined(slug.current) && ${NOT_RETIRED}]{
  _type,
  "slug": slug.current,
  _updatedAt
}
`

const SERVICE_SITEMAP_QUERY = /* groq */ `
*[_type == "service" && defined(slug.current) && ${NOT_RETIRED}]{
  _type,
  "slug": slug.current,
  _updatedAt
}
`

// listItemOnly technologies (1 of 101: android-studio) ARE routed and serve a 200,
// and Webflow serves them too. They used to be filtered out here, because live's
// sitemap omits them.
//
// SEO session S1, 8 Aug 2026: the filter is gone. Faithfulness to Webflow's
// sitemap was the right default during the cutover; it is not a reason to keep a
// live, indexable, 200-serving page out of the file that tells Google our pages
// exist. /technology/android-studio and its UK twin are now listed like every
// other technology page. See docs/seo/EXECUTION_SESSIONS.md S1.
//
// Do not "fix" this by excluding them from ROUTING: see the note on
// TECHNOLOGY_PARAMS_QUERY in queries/technology.ts.
const TECHNOLOGY_SITEMAP_QUERY = /* groq */ `
*[_type == "technology" && defined(slug.current) && ${NOT_RETIRED}]{
  _type,
  "slug": slug.current,
  _updatedAt
}
`

// Drops any entry whose path the redirect table intercepts.
//
// SEO session S1, 8 Aug 2026. The August crawl found four: /customer-story/virgin
// in both locales, /tools/price-comparison-calculator, and
// /compare/cloud-employee-vs-arc-dev. Each is a Sanity document that still
// exists, so the dynamic builders emit it, while a locked rule 301s the URL away.
// A sitemap that lists a redirect asks Google to crawl a URL we have already told
// it is not the answer, and repeated often enough it is the sitemap that stops
// being trusted.
//
// This reads the SAME assembled table next.config.ts serves (src/lib/redirects),
// rather than a hand-kept list of the four. A hand-kept list is a copy of a
// derived fact and goes stale the first time someone adds a redirect: the four
// URLs here are all documents that were retired one at a time, and there will be
// a fifth.
//
// Literal sources only. Parameterised rules are not matched, because doing so
// means re-implementing the router; no sitemap entry has ever hit one.
function dropRedirectedEntries(entries: MetadataRoute.Sitemap): MetadataRoute.Sitemap {
  const base = env.NEXT_PUBLIC_SITE_URL
  return entries.filter((entry) => {
    const path = entry.url.startsWith(base) ? entry.url.slice(base.length) : entry.url
    return !redirectedPaths.has(path || '/')
  })
}

// MYGRATR-STATIC-1 — hub URL builders.
//
// 32 entries: 16 hubs x 2 locales, with hreflang alternates.
//
// STATIC-1 Step 7 had dropped the UK entries because Step 4 emitted both
// locales while only the default-locale route files existed, so every /uk/<hub>
// URL in the sitemap 404'd. Its comment said to reinstate both locales once the
// UK routes shipped. They have (Phase 2a), so this does.
//
// The 404 page emits no sitemap entry (per Step 4 brief).
function buildHubSitemapEntries(base: string): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = []
  const hubTypes = Object.keys(HUB_CONFIG) as HubType[]
  for (const hubType of hubTypes) {
    // The /compare hub root is retired via a permanent 301 to /alternatives
    // (Phase 4.2, 22 Jul 2026 - see next.config.ts lockedRules). A redirected
    // URL must not appear in the sitemap. The /compare/{slug} detail articles
    // are emitted separately via buildDynamicRoutes and are unaffected.
    if (hubType === 'compareHub') continue
    const path = HUB_CONFIG[hubType].basePath
    const languages = generateHreflang(path)
    for (const locale of LOCALES) {
      entries.push({
        url: generateCanonical(path, locale),
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
        alternates: { languages },
      })
    }
  }
  return entries
}

function buildDynamicRoutes(
  base: string,
  docs: AnySitemapDoc[],
): MetadataRoute.Sitemap {
  const dynamicRoutes: MetadataRoute.Sitemap = []
  for (const doc of docs) {
    const builder = URL_BUILDERS[doc._type]
    if (!builder) continue
    for (const locale of ['default', 'uk'] as const) {
      const path = builder(doc, locale)
      if (!path) continue
      dynamicRoutes.push({
        url: `${base}${path}`,
        lastModified: new Date(doc._updatedAt),
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    }
  }
  return dynamicRoutes
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.NEXT_PUBLIC_SITE_URL

  // Static routes — homepage + UK locale + How It Works (+ UK mirror).
  // Hand-listed static pages. Each is emitted in both locales with hreflang,
  // built from the same generateCanonical / generateHreflang helpers the routes'
  // generateMetadata uses — so the sitemap and the pages cannot disagree about
  // what a page's canonical URL is. Add a route here when you add a static page.
  const STATIC_PAGES: Array<{ path: string; changeFrequency: 'daily' | 'monthly' | 'yearly'; priority: number }> = [
    { path: '/', changeFrequency: 'daily', priority: 1.0 },
    { path: '/how-it-works', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/about-us', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/contact', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/for-developers', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/our-work', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/pricing', changeFrequency: 'monthly', priority: 0.8 },
    // Location page with no Sanity service doc (latam/philippines-developers are
    // service docs already covered by the dynamic service entries; eastern-europe
    // is net-new and rendered by the Location template branch, so list it here).
    { path: '/services/eastern-europe-developers', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/referrals', changeFrequency: 'monthly', priority: 0.5 },
    { path: '/work-with-shawnee', changeFrequency: 'monthly', priority: 0.4 },
    // A real landing page with a booking widget, indexable and in live's sitemap.
    { path: '/book-a-call', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/legals/privacy-policy', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/legals/general-terms', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/legals/cookie-policy', changeFrequency: 'yearly', priority: 0.3 },
    // The two hire-engineers MARKET pages. Both exist in both locales, so both
    // are ordinary two-locale entries here.
    //
    // Locale and market are different axes (see the note on
    // services/hire-us-engineers/page.tsx): the locale prefix says who is
    // reading, the slug says where the engineers are. So hreflang pairs each
    // page with the SAME MARKET in the other locale, which is what
    // generateHreflang emits, and the two markets are never declared as
    // alternates of each other - they answer different searches and pairing
    // them invites Google to collapse one.
    { path: '/services/hire-us-engineers', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/services/hire-uk-engineers', changeFrequency: 'monthly', priority: 0.8 },
  ]

  // NOT in the sitemap, matching live, and each for its own reason:
  //
  //   the six post-conversion pages   noindex. A page reading "thanks, your form has
  //                                   been submitted" has nothing to offer a searcher,
  //                                   and one that ranks puts the end of the funnel in
  //                                   front of someone who never entered it.
  //   /price-comparison-calculator    noindex on live. Not an oversight: the canonical
  //                                   copy is /tools/price-comparison-calculator and CE
  //                                   decline to compete with themselves for it.
  //   /hiring-cost-calculator         indexable, but absent from live's sitemap. It is
  //                                   an iframe target for /pricing, not a destination.
  //
  // A sitemap that lists a noindex page tells Google two contradictory things about the
  // same URL, and it is the sitemap that ends up distrusted.

  const staticRoutes: MetadataRoute.Sitemap = STATIC_PAGES.flatMap(
    ({ path, changeFrequency, priority }) => {
      const languages = generateHreflang(path)
      return LOCALES.map((locale) => ({
        url: generateCanonical(path, locale),
        lastModified: new Date(),
        changeFrequency,
        // The UK mirror is a translation of the US page, not a page in its own
        // right, so it ranks a notch below it.
        priority: locale === 'en-US' ? priority : Math.max(0.1, priority - 0.1),
        alternates: { languages },
      }))
    },
  )


  // Hub routes — 32 entries (16 hubs x 2 locales).
  const hubRoutes = buildHubSitemapEntries(base)

  const [blogDocs, teamDocs, reviewDocs, videoDocs, toolDocs, downloadDocs, bookACallDocs, compareDocs, customerStoryDocs, serviceDocs, technologyDocs] =
    await Promise.all([
      sanityClient.fetch<BlogSitemapDoc[]>(BLOG_SITEMAP_QUERY),
      sanityClient.fetch<TeamMemberSitemapDoc[]>(TEAM_MEMBER_SITEMAP_QUERY),
      sanityClient.fetch<ReviewSitemapDoc[]>(REVIEW_SITEMAP_QUERY),
      sanityClient.fetch<VideoSitemapDoc[]>(VIDEO_SITEMAP_QUERY),
      sanityClient.fetch<ToolSitemapDoc[]>(TOOL_SITEMAP_QUERY),
      sanityClient.fetch<DownloadSitemapDoc[]>(DOWNLOAD_SITEMAP_QUERY),
      sanityClient.fetch<BookACallSitemapDoc[]>(BOOK_A_CALL_SITEMAP_QUERY),
      sanityClient.fetch<CompareBlogSitemapDoc[]>(COMPARE_BLOG_SITEMAP_QUERY),
      sanityClient.fetch<CustomerStorySitemapDoc[]>(CUSTOMER_STORY_SITEMAP_QUERY),
      sanityClient.fetch<ServiceSitemapDoc[]>(SERVICE_SITEMAP_QUERY),
      sanityClient.fetch<TechnologySitemapDoc[]>(TECHNOLOGY_SITEMAP_QUERY),
    ])

  const dynamicRoutes = buildDynamicRoutes(base, [
    ...blogDocs,
    ...teamDocs,
    ...reviewDocs,
    ...videoDocs,
    ...toolDocs,
    ...downloadDocs,
    ...bookACallDocs,
    ...compareDocs,
    ...customerStoryDocs,
    ...serviceDocs,
    ...technologyDocs,
  ])

  return dropRedirectedEntries([...staticRoutes, ...hubRoutes, ...dynamicRoutes])
}

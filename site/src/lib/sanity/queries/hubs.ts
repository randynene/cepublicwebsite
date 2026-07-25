import 'server-only'

import { z } from 'zod'

import { buildLocalePath, type Locale } from '@/lib/locale'
import { sanityFetch } from '@/lib/sanity/live'
import { NOT_RETIRED } from '@/lib/sanity/queries/_filters'

// MYGRATR-STATIC-1 Step 4 — hub singleton + child query helpers.
//
// 16 hubs share a uniform shape (defineBlogHub or defineCollectionHub
// factory output). Instead of 16 fetchers, we build:
//   - 1 generic singleton fetcher parameterised by hub type
//   - 1 generic child fetcher parameterised by hub type
//   - 1 generic count fetcher for pagination total
//
// Per-hub config lives in HUB_CONFIG below. Adding a hub = add one row
// to that table; no fetcher duplication.
//
// All sort orders are locked in plan-mode Amendment #3.

// ────────────────────────────────────────────────────────────────────────
// Hub configuration table
// ────────────────────────────────────────────────────────────────────────

export type HubType =
  | 'blogHub'
  | 'staffAugmentationHub'
  | 'nearshoringOffshoringHub'
  | 'scalingTeamsHub'
  | 'hiringTipsHub'
  | 'managingEngineersHub'
  | 'aiInSoftwareDevelopmentHub'
  | 'videosHub'
  | 'toolsHub'
  | 'downloadsHub'
  | 'eventsHub'
  | 'servicesHub'
  | 'technologyHub'
  | 'customerStoriesHub'
  | 'reviewsHub'
  | 'compareHub'
  | 'alternativesHub'

export type HubShape = 'blog' | 'collection'
export type CardKind = 'blog' | 'resource' | 'collection'

export type HubConfig = {
  shape: HubShape
  childType: string
  /** GROQ ORDER clause without the leading `| order(...)`. */
  /**
   * GROQ order clause.
   *
   * Date-sorted hubs MUST lead with `defined(date) desc`. In GROQ a null sorts FIRST
   * under `date desc`, and 18 of the 74 blog posts have no date - so `order(date desc)`
   * put the dateless ones at the top and buried every genuinely recent article beneath
   * them. The featured block, which tops itself up with "the most recent", was
   * therefore showing five arbitrary undated posts.
   */
  childSort: string
  /** Extra GROQ filter (joined with &&). Optional. */
  childFilter?: string
  /** Category slug for blog category hubs (filters blogPost on category->slug.current). */
  categorySlug?: string
  cardKind: CardKind
  basePath: string
  /** Human title for the breadcrumb trail. */
  breadcrumbName: string
  /** When true the hub is a sub-section of /blog for breadcrumb purposes. */
  underBlog: boolean
}

export const HUB_CONFIG: Record<HubType, HubConfig> = {
  // 7 blog hubs (defineBlogHub shape — featuredArticles + topicsHeader)
  blogHub: {
    shape: 'blog',
    childType: 'blogPost',
    childSort: 'defined(date) desc, date desc, featured desc',
    cardKind: 'blog',
    basePath: '/blog',
    breadcrumbName: 'Blog',
    underBlog: false,
  },
  staffAugmentationHub: {
    shape: 'blog',
    childType: 'blogPost',
    childSort: 'defined(date) desc, date desc',
    categorySlug: 'staff-augmentation',
    cardKind: 'blog',
    basePath: '/staff-augmentation',
    breadcrumbName: 'Staff Augmentation',
    underBlog: true,
  },
  nearshoringOffshoringHub: {
    shape: 'blog',
    childType: 'blogPost',
    childSort: 'defined(date) desc, date desc',
    categorySlug: 'nearshoring-offshoring',
    cardKind: 'blog',
    basePath: '/nearshoring-offshoring',
    breadcrumbName: 'Nearshoring and Offshoring',
    underBlog: true,
  },
  scalingTeamsHub: {
    shape: 'blog',
    childType: 'blogPost',
    childSort: 'defined(date) desc, date desc',
    categorySlug: 'scaling-teams',
    cardKind: 'blog',
    basePath: '/scaling-teams',
    breadcrumbName: 'Scaling Teams',
    underBlog: true,
  },
  hiringTipsHub: {
    shape: 'blog',
    childType: 'blogPost',
    childSort: 'defined(date) desc, date desc',
    categorySlug: 'hiring-tips',
    cardKind: 'blog',
    basePath: '/hiring-tips',
    breadcrumbName: 'Hiring Tips',
    underBlog: true,
  },
  managingEngineersHub: {
    shape: 'blog',
    childType: 'blogPost',
    childSort: 'defined(date) desc, date desc',
    categorySlug: 'managing-engineers',
    cardKind: 'blog',
    basePath: '/managing-engineers',
    breadcrumbName: 'Managing Engineers',
    underBlog: true,
  },
  aiInSoftwareDevelopmentHub: {
    shape: 'blog',
    childType: 'blogPost',
    childSort: 'defined(date) desc, date desc',
    categorySlug: 'ai-in-software-development',
    cardKind: 'blog',
    basePath: '/ai-in-software-development',
    breadcrumbName: 'AI in Software Development',
    underBlog: true,
  },

  // 4 resource hubs (defineCollectionHub shape — featuredItems)
  videosHub: {
    shape: 'collection',
    childType: 'video',
    childSort: 'featured desc, order asc, name asc',
    cardKind: 'resource',
    basePath: '/videos',
    breadcrumbName: 'Video Library',
    underBlog: false,
  },
  toolsHub: {
    shape: 'collection',
    childType: 'tool',
    childSort: 'featured desc, name asc',
    cardKind: 'resource',
    basePath: '/tools',
    breadcrumbName: 'Tools and Quizzes',
    underBlog: false,
  },
  downloadsHub: {
    shape: 'collection',
    childType: 'download',
    childSort: 'featured desc, name asc',
    childFilter: 'comingSoon != true',
    cardKind: 'resource',
    basePath: '/downloads',
    breadcrumbName: 'Free Downloads',
    underBlog: false,
  },
  eventsHub: {
    shape: 'collection',
    childType: 'event',
    childSort: 'defined(dateTime) desc, dateTime desc',
    cardKind: 'resource',
    basePath: '/events',
    breadcrumbName: 'Events and Webinars',
    underBlog: false,
  },

  // 5 collection-index hubs (defineCollectionHub shape)
  servicesHub: {
    shape: 'collection',
    childType: 'service',
    childSort: 'order asc, name asc',
    cardKind: 'collection',
    basePath: '/services',
    breadcrumbName: 'Services',
    underBlog: false,
  },
  technologyHub: {
    shape: 'collection',
    childType: 'technology',
    childSort: 'order asc, technologyName asc',
    childFilter: 'listItemOnly != true',
    cardKind: 'collection',
    basePath: '/technology',
    breadcrumbName: 'Technology',
    underBlog: false,
  },
  customerStoriesHub: {
    shape: 'collection',
    childType: 'customerStory',
    childSort: 'order asc, _createdAt desc',
    cardKind: 'collection',
    basePath: '/customer-stories',
    breadcrumbName: 'Customer Stories',
    underBlog: false,
  },
  reviewsHub: {
    shape: 'collection',
    childType: 'review',
    childSort: 'order asc, _createdAt desc',
    cardKind: 'collection',
    basePath: '/reviews',
    breadcrumbName: 'Reviews',
    underBlog: false,
  },
  compareHub: {
    shape: 'collection',
    childType: 'compareBlog',
    childSort: 'defined(date) desc, date desc, featured desc',
    cardKind: 'blog', // BlogCard surface — compareBlog uses the same projection
    basePath: '/compare',
    breadcrumbName: 'Compare',
    underBlog: false,
  },

  // A SECOND hub over the same compareBlog documents. That is not a mistake and
  // not a duplicate to be tidied away: /alternatives and /compare both exist on
  // the live site, both rank, and /alternatives ranks BETTER (Search Console
  // position 9.1 vs 25.9). An early redirect rule would have collapsed it into
  // /compare and deleted the stronger page.
  alternativesHub: {
    shape: 'collection',
    childType: 'compareBlog',
    childSort: 'defined(date) desc, date desc, featured desc',
    cardKind: 'blog',
    basePath: '/alternatives',
    breadcrumbName: 'Alternatives',
    underBlog: false,
  },
}

// ────────────────────────────────────────────────────────────────────────
// Hub singleton — Zod + GROQ
// ────────────────────────────────────────────────────────────────────────

const ImageSchema = z
  .object({ asset: z.object({ _ref: z.string().optional() }).passthrough().optional() })
  .passthrough()
  .nullable()
  .optional()

const PortableBlockSchema = z.object({ _type: z.string() }).passthrough()

// Single reference projection used for featuredArticles / featuredItems.
// Wide enough to cover any child type the cards render.
const FeaturedRefSchema = z
  .object({
    _id: z.string(),
    _type: z.string(),
    title: z.string().nullable().optional(),
    name: z.string().nullable().optional(),
    nameClient: z.string().nullable().optional(),
    customerStoryTitle: z.string().nullable().optional(),
    technologyName: z.string().nullable().optional(),
    slug: z.string().nullable().optional(),
    thumbnailImage: ImageSchema,
    thumbnail: ImageSchema,
    backupImage: ImageSchema,
    headerFooterImage: ImageSchema,
    featuredImage: ImageSchema,
    techLogo: ImageSchema,
    companyLogo: ImageSchema,
    date: z.string().nullable().optional(),
    resourceDescription: z.string().nullable().optional(),
    description: z.array(PortableBlockSchema).nullable().optional(),
    category: z
      .object({ name: z.string().optional(), slug: z.string().optional() })
      .passthrough()
      .nullable()
      .optional(),
  })
  .passthrough()

export const HubSingletonSchema = z.object({
  _id: z.string(),
  _type: z.string(),
  title: z.string(),
  eyebrow: z.string().optional(),
  heroDescription: z.array(PortableBlockSchema).optional(),
  heroImage: ImageSchema,
  metaTitle: z.string(),
  metaDescription: z.string(),
  openGraphImage: ImageSchema,
  topicsHeader: z.string().nullable().optional(),
  // The body copy that sits BELOW the card grid on the live hub: "Key Topics",
  // "Key Market Insights", the prose an answer engine actually reads. The field
  // has existed on the hub factories since STATIC-1 but was never projected, so
  // every hub shipped as a headline over a grid. Named "intro" and rendered last:
  // the name is a misnomer inherited from the schema, not a placement instruction.
  introContent: z.array(PortableBlockSchema).nullable().optional(),
  faqs: z
    .array(
      z.object({
        _key: z.string().optional(),
        question: z.string(),
        answer: z.array(PortableBlockSchema),
      }),
    )
    .nullable()
    .optional(),
  // null when the doc shape is the other factory (blog hubs project
  // featuredItems = null and vice versa). Normalised to [] downstream.
  featuredArticles: z.array(FeaturedRefSchema).nullable().optional(),
  featuredItems: z.array(FeaturedRefSchema).nullable().optional(),
})

export type HubSingleton = z.infer<typeof HubSingletonSchema>
export type FeaturedRef = z.infer<typeof FeaturedRefSchema>

// Single GROQ template — uses defined() guards on per-shape fields so
// the projection works for both blog and collection hubs. The hub _id
// equals its _type for singletons.
const HUB_SINGLETON_QUERY = /* groq */ `
*[_id == $hubId][0]{
  _id,
  _type,
  title,
  eyebrow,
  heroDescription,
  heroImage,
  metaTitle,
  metaDescription,
  openGraphImage,
  topicsHeader,
  introContent,
  faqs[]{ _key, question, answer },
  "featuredArticles": featuredArticles[]->{
    _id, _type,
    title, name, nameClient, customerStoryTitle, technologyName,
    "slug": slug.current,
    thumbnailImage, thumbnail, backupImage, headerFooterImage, featuredImage, techLogo, companyLogo,
    date,
    resourceDescription,
    "category": category->{ name, "slug": slug.current }
  },
  "featuredItems": featuredItems[]->{
    _id, _type,
    title, name, nameClient, customerStoryTitle, technologyName,
    "slug": slug.current,
    thumbnailImage, thumbnail, backupImage, headerFooterImage, featuredImage, techLogo, companyLogo,
    date,
    resourceDescription,
    "category": category->{ name, "slug": slug.current }
  }
}
`

export async function fetchHubSingleton(hubType: HubType): Promise<HubSingleton | null> {
  const { data } = await sanityFetch({
    query: HUB_SINGLETON_QUERY,
    params: { hubId: hubType },
  })
  if (data === null || data === undefined) return null
  return HubSingletonSchema.parse(data)
}

// ────────────────────────────────────────────────────────────────────────
// Child items — Zod + GROQ
// ────────────────────────────────────────────────────────────────────────

export const HubChildItemSchema = z
  .object({
    _id: z.string(),
    _type: z.string(),
    // Title fields vary by type — every doc surfaces one of these.
    title: z.string().nullable().optional(),
    name: z.string().nullable().optional(),
    nameClient: z.string().nullable().optional(),
    customerStoryTitle: z.string().nullable().optional(),
    technologyName: z.string().nullable().optional(),
    slug: z.string().nullable().optional(),
    // Image variants — first defined() wins at render time.
    thumbnailImage: ImageSchema,
    thumbnail: ImageSchema,
    backupImage: ImageSchema,
    headerFooterImage: ImageSchema,
    featuredImage: ImageSchema,
    techLogo: ImageSchema,
    companyLogo: ImageSchema,
    // Date / dateTime for sort surfaces.
    date: z.string().nullable().optional(),
    dateTime: z.string().nullable().optional(),
    // Body for excerpt.
    resourceDescription: z.string().nullable().optional(),
    subHeader: z.string().nullable().optional(),
    headerDescription: z.array(PortableBlockSchema).nullable().optional(),
    mainDescription: z.array(PortableBlockSchema).nullable().optional(),
    descriptionOfVideo: z.array(PortableBlockSchema).nullable().optional(),
    snippetForMeta: z.string().nullable().optional(),
    reviewSnippetForMeta: z.string().nullable().optional(),
    shortLabel: z.string().nullable().optional(),
    competitor: z.string().nullable().optional(),
    // The excerpt of last resort, and in practice the FIRST one that exists: almost
    // every blogPost has a metaDescription and none of the fields above it. Declared
    // rather than left to .passthrough(), so the card can read it with a type.
    metaDescription: z.string().nullable().optional(),
    // Author + category for blogPost-shape items.
    author: z
      .object({
        name: z.string().nullable().optional(),
        // The byline avatar. Falls back to lime initials when a teamMember has no
        // photo, which is the common case: the alt text on all 28 is null too.
        teamMemberImage: ImageSchema,
      })
      .passthrough()
      .nullable()
      .optional(),
    category: z
      .object({ name: z.string().nullable().optional(), slug: z.string().nullable().optional() })
      .passthrough()
      .nullable()
      .optional(),
    // Customer story extras.
    companyName: z.string().nullable().optional(),
    position: z.string().nullable().optional(),
  })
  .passthrough()

export type HubChildItem = z.infer<typeof HubChildItemSchema>

// Build the child-list GROQ for a given hub. Inline composition keeps
// the per-hub branching tight without dragging in heavy GROQ-generators.
function buildChildQuery(cfg: HubConfig, excludeIdsParam = '$excludeIds') {
  const filters: string[] = [`_type == "${cfg.childType}"`]
  if (cfg.categorySlug) {
    filters.push(`category->slug.current == "${cfg.categorySlug}"`)
  }
  if (cfg.childFilter) filters.push(cfg.childFilter)
  filters.push(`!(_id in ${excludeIdsParam})`)
  filters.push(`defined(slug.current)`)
  filters.push(NOT_RETIRED)
  const filterClause = filters.join(' && ')

  return /* groq */ `
*[${filterClause}]
  | order(${cfg.childSort})
  [$offset...$end]{
    _id, _type,
    title, name, nameClient, customerStoryTitle, technologyName,
    "slug": slug.current,
    thumbnailImage, thumbnail, backupImage, headerFooterImage, featuredImage, techLogo, companyLogo,
    date, dateTime,
    resourceDescription, subHeader, headerDescription, mainDescription, descriptionOfVideo,
    snippetForMeta, reviewSnippetForMeta, shortLabel, competitor,
    metaDescription,
    "author": author->{ name, teamMemberImage },
    "category": category->{ name, "slug": slug.current },
    companyName, position
  }
`
}

function buildCountQuery(cfg: HubConfig, excludeIdsParam = '$excludeIds') {
  const filters: string[] = [`_type == "${cfg.childType}"`]
  if (cfg.categorySlug) {
    filters.push(`category->slug.current == "${cfg.categorySlug}"`)
  }
  if (cfg.childFilter) filters.push(cfg.childFilter)
  filters.push(`!(_id in ${excludeIdsParam})`)
  filters.push(`defined(slug.current)`)
  filters.push(NOT_RETIRED)
  return /* groq */ `count(*[${filters.join(' && ')}])`
}

export async function fetchHubChildren(
  hubType: HubType,
  opts: { offset: number; limit: number; excludeIds: string[] },
): Promise<HubChildItem[]> {
  const cfg = HUB_CONFIG[hubType]
  const query = buildChildQuery(cfg)
  const { data } = await sanityFetch({
    query,
    params: {
      offset: opts.offset,
      end: opts.offset + opts.limit,
      excludeIds: opts.excludeIds,
    },
  })
  if (!Array.isArray(data)) return []
  return data.map((d) => HubChildItemSchema.parse(d))
}

export async function fetchHubChildrenCount(
  hubType: HubType,
  opts: { excludeIds: string[] },
): Promise<number> {
  const cfg = HUB_CONFIG[hubType]
  const query = buildCountQuery(cfg)
  const { data } = await sanityFetch({
    query,
    params: { excludeIds: opts.excludeIds },
  })
  if (typeof data !== 'number') return 0
  return data
}

// ────────────────────────────────────────────────────────────────────────
// siteSettings.defaultOgImage fetch — OG fallback for hub metadata
// ────────────────────────────────────────────────────────────────────────

const DEFAULT_OG_QUERY = /* groq */ `
*[_id == "siteSettings"][0]{
  "defaultOgImage": defaultOgImage
}
`

export async function fetchSiteDefaultOgImage(): Promise<
  Record<string, unknown> | null
> {
  const { data } = await sanityFetch({ query: DEFAULT_OG_QUERY })
  const og = (data as { defaultOgImage?: Record<string, unknown> } | null)?.defaultOgImage
  return og ?? null
}

// ────────────────────────────────────────────────────────────────────────
// Card link helpers
// ────────────────────────────────────────────────────────────────────────

// Per-child-type slug-prefix mapping. Detail-page routes for non-blogPost
// types are planned in later TEMPLATE-* phases; today these href values
// will resolve to 404 in the live site. That's expected pre-launch.
/**
 * The URL a hub card points at.
 *
 * `locale` prefixes /uk, so a UK hub links to UK detail pages and a visitor
 * never gets bounced back to the US locale by clicking a card.
 *
 * customerStory routes at /customer-story/<slug>, SINGULAR. This used to emit
 * the plural /customer-stories/<slug>, which is a redirect (see
 * regex-redirects.ts) — so every customer-story card on every hub was an
 * internal link that 301'd. Internal links should point at the final URL:
 * a redirect hop wastes crawl budget and leaks a little link equity on a link
 * we control completely.
 */
export function getChildHref(item: HubChildItem, locale: Locale = 'en-US'): string {
  const slug = item.slug
  if (!slug) return '#'

  const path = ((): string => {
    switch (item._type) {
      case 'blogPost': {
        const cat = item.category?.slug
        return cat ? `/${cat}/${slug}` : `/blog/${slug}`
      }
      case 'compareBlog':
        return `/compare/${slug}`
      case 'customerStory':
        return `/customer-story/${slug}`
      case 'service':
        return `/services/${slug}`
      case 'technology':
        return `/technology/${slug}`
      case 'review':
        return `/reviews/${slug}`
      case 'video':
        return `/videos/${slug}`
      case 'tool':
        return `/tools/${slug}`
      case 'download':
        // SINGULAR — the hub is /downloads, the detail pages are /download/<slug>.
        // Verified against live. See the note in app/sitemap.ts.
        return `/download/${slug}`
      case 'event':
        return `/events/${slug}`
      default:
        return '#'
    }
  })()

  return path === '#' ? path : buildLocalePath(path, locale)
}

// Surface a single "title-ish" string regardless of which field a given
// doc type carries it on.
export function getChildTitle(item: HubChildItem): string {
  return (
    item.title ??
    item.name ??
    item.nameClient ??
    item.customerStoryTitle ??
    item.technologyName ??
    'Untitled'
  )
}

// First non-null image from the candidate fields each doc type uses.
export function getChildImage(item: HubChildItem): Record<string, unknown> | null {
  const candidates = [
    item.thumbnailImage,
    item.thumbnail,
    item.featuredImage,
    item.headerFooterImage,
    item.backupImage,
    item.companyLogo,
    item.techLogo,
  ]
  for (const c of candidates) {
    if (c && (c as { asset?: unknown }).asset) return c as Record<string, unknown>
  }
  return null
}

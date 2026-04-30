// CE-specific Webflow collection IDs for the CONTENT-1 migration.
// Source of truth: Webflow API (`GET /v2/sites/{siteId}/collections`).
// Last verified: 2026-04-30 (CONTENT-1C additions).
//
// Per CONVENTIONS.md §"CE-Specific vs Reusable Discipline", CE-specific
// values live in seed data only. This file is the seed data for the CE
// CONTENT-1 migration scripts; it is imported by name from each migration
// script and never embedded in lib logic.
export const CE_COLLECTION_IDS = {
  // CONTENT-1A
  tagsBlogs: '68a75db7c8e5e19116c69835',
  tagsAlternatives: '68d2f613feb6d6f660a9e95c',
  tagsTools: '68adfbb8b04bf90be89253c8',
  tagsVideoLibrary: '68adfc4b958d615bd521b67d',
  tagsDownloads: '68acd74f1f02ea30f900f25a',
  tagsEventsWebinars: '68adfc67a5687dd561c0d476',
  hubs: '67459cfaa9262fed6e8eb9d9',
  glassdoorReviews: '674ef8fc1f14b706295a5f3f',
  clientBenefits: '673b079ec2ec5c9208429616',
  staffBenefits: '673db88247fa67e4e5718326',

  // CONTENT-1B
  teamMembers: '673766d51434465f74c59142',
  reviews: '673a50eebf20965117e1fa9f',
  videos: '685d8ce311e274210e36fdca',
  bookACall: '68cc200833fe6f7277646d72',
  eventsWebinars: '68d585745aa126329fe687ee',
  toolsQuizzes: '68b893c2861ab8104a00477f',
  downloads: '6749e40f04d10cf9b88d5bb3',
  downloadsAccess: '67e18cb55008a1170e325a83',

  // CONTENT-1C — 7 blog collections consolidate into one Sanity blogPost type
  blogsAndGuides: '67459ce1ce88de64c07213a7',
  staffAugmentationBlogs: '68f65c9a068e55b032b196ab',
  nearshoringOffshoringBlogs: '68f65d73dbe40dd7e103ef15',
  scalingTeamsBlogs: '68f65dbd5dfc1bedb4edb50b',
  hiringTipsBlogs: '68f65d2c0e71fdbba5046b0e',
  managingEngineersBlogs: '68f65d86e9f1630e92f762ec',
  aiSoftwareDevBlogs: '68f65dd531a77bd2a3936581',

  // CONTENT-1C — single source per type
  compareBlogs: '68d2ef79fb8136fee577c68e',
  technologyPages: '67bcf13e56583ba5581b1d38',
  services: '6838a76ae8981810f6c2089b',
  customerStories: '673a5beebf20965117eab8f4',
} as const

// Iteration helper — the 7 source collections that consolidate into the
// single `blogPost` Sanity type. Order matches the brief's iteration
// order so logging/error messages stay deterministic.
export const CE_BLOG_COLLECTIONS: Array<{
  id: string
  name: string
  collectionSlug: string
}> = [
  { id: CE_COLLECTION_IDS.blogsAndGuides, name: 'Blogs & Guides', collectionSlug: 'blogs-and-guides' },
  { id: CE_COLLECTION_IDS.staffAugmentationBlogs, name: 'Staff Augmentation Blogs', collectionSlug: 'staff-augmentation-blogs' },
  { id: CE_COLLECTION_IDS.nearshoringOffshoringBlogs, name: 'Nearshoring & Offshoring Blogs', collectionSlug: 'nearshoring-offshoring-blogs' },
  { id: CE_COLLECTION_IDS.scalingTeamsBlogs, name: 'Scaling Teams Blogs', collectionSlug: 'scaling-teams-blogs' },
  { id: CE_COLLECTION_IDS.hiringTipsBlogs, name: 'Hiring Tips Blogs', collectionSlug: 'hiring-tips-blogs' },
  { id: CE_COLLECTION_IDS.managingEngineersBlogs, name: 'Managing Engineers Blogs', collectionSlug: 'managing-engineers-blogs' },
  { id: CE_COLLECTION_IDS.aiSoftwareDevBlogs, name: 'AI in Software Development Blogs', collectionSlug: 'ai-software-dev-blogs' },
]

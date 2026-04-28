// CE-specific Webflow collection IDs for the CONTENT-1 migration.
// Source of truth: Webflow API (`GET /v2/sites/{siteId}/collections`).
// Last verified: 2026-04-28 (CONTENT-1B additions).
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
} as const

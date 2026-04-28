// CE-specific Webflow collection IDs for the CONTENT-1A batch.
// Source of truth: Webflow API (`GET /v2/sites/{siteId}/collections`).
// Last fetched: 2026-04-28.
//
// Per CONVENTIONS.md §"CE-Specific vs Reusable Discipline", CE-specific
// values live in seed data only. This file is the seed data for the CE
// CONTENT-1A migration scripts; it is imported by name from each migration
// script and never embedded in lib logic.
export const CE_COLLECTION_IDS = {
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
} as const

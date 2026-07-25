import type { HubType } from '@/lib/sanity/queries/hubs'

// The §7 hero table, verbatim.
//
// THE H1 HOLDS THE KEYWORD. The spec deliberately reverses the pattern used on
// Technology Index (where the ranking phrase became a decorative pill and the H1
// collapsed to one word): here the ranking phrase stays in the H1 and the eyebrow is
// a small kicker. These seven headlines carry Google rankings, and an <h1> is the one
// heading a crawler is guaranteed to weigh.
//
// Every H1 below is IDENTICAL to the one the live site serves today, so this is not an
// SEO change at all - it is the design being built around the existing headline rather
// than replacing it. That was checked, not assumed.
//
// The LEADS are new, shorter copy. On the six topic hubs the live site's long opening
// paragraph is NOT discarded: it moves down into the long-form band, which is where
// the spec says it belongs ("short lead in hero; the long-form lead paragraph lives in
// the long-form block below"). Nothing is lost; it is re-homed.
//
// These are the fallbacks, not the source of truth. Sanity holds the real values, so
// Seb can edit any of them without a deploy. They exist here so a hub with an
// unseeded field still renders the spec's copy rather than a blank hero.

export type BlogHeroCopy = {
  eyebrow: string
  h1: string
  lead: string
}

export const BLOG_HERO_COPY: Record<string, BlogHeroCopy> = {
  blogHub: {
    eyebrow: 'Cloud Employee Blog',
    h1: 'All Blogs & Guides',
    lead: 'Expert insights on hiring, managing, and retaining top engineers.',
  },
  staffAugmentationHub: {
    eyebrow: 'Knowledge Hub',
    h1: 'Staff Augmentation Knowledge Hub',
    lead: 'Everything on augmenting your team with vetted, embedded engineers.',
  },
  nearshoringOffshoringHub: {
    eyebrow: 'Knowledge Hub',
    h1: 'Nearshoring & Offshoring Knowledge Hub',
    lead: 'Choosing, scoping, and running a nearshore partner that delivers.',
  },
  scalingTeamsHub: {
    eyebrow: 'Knowledge Hub',
    h1: 'Scaling Software Teams Knowledge Hub',
    lead: 'Keeping velocity and culture intact as engineering headcount grows.',
  },
  hiringTipsHub: {
    eyebrow: 'Knowledge Hub',
    h1: 'Hiring Developers Knowledge Hub',
    lead: 'Practical playbooks for assessing and hiring real engineering ability.',
  },
  managingEngineersHub: {
    eyebrow: 'Knowledge Hub',
    h1: 'Managing Engineers Knowledge Hub',
    lead: 'Leading distributed engineering teams without burning them out.',
  },
  aiInSoftwareDevelopmentHub: {
    eyebrow: 'Knowledge Hub',
    h1: 'AI in Software Development Knowledge Hub',
    lead: 'Shipping AI features safely - validation, risk, and standards.',
  },
}

/** The 7 hubs in the blog family. The other 10 keep the generic renderHub for now. */
export const BLOG_FAMILY: HubType[] = [
  'blogHub',
  'staffAugmentationHub',
  'nearshoringOffshoringHub',
  'scalingTeamsHub',
  'hiringTipsHub',
  'managingEngineersHub',
  'aiInSoftwareDevelopmentHub',
]

export function isBlogFamily(hubType: HubType): boolean {
  return BLOG_FAMILY.includes(hubType)
}

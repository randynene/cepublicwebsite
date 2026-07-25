// Our Work page - static furniture (eyebrows, headings, captions, button labels).
// 1:1 with docs/raw-html/Our Work.html. The customer stories, logos, reviews and
// the bento image/video tiles are Sanity-driven from their OWN documents (customer
// story + review docs). The fixed copy, the editable stat numbers, and the three
// decorative "customer photo" tiles are the ourWorkPage singleton (wired 23 Jul
// 2026). This object is the STATIC FALLBACK used when that singleton is absent or
// fails validation. Author voice: no em/en dashes - hyphens only.

export const OUR_WORK_META = {
  title: 'Our Work | Cloud Employee',
  description:
    'See what less recruitment and more development looks like. Real customer stories, results and reviews from the teams we have scaled.',
} as const

export interface OwStat {
  value: string
  lead: string
  rest: string
}

export interface OurWorkContent {
  hero: {
    eyebrow: string
    titleLead: string
    titleAccent: string
    titleRest: string
    intro: string
    cta: string
    ctaHref: string
  }
  trusted: { pre: string; highlight: string; post: string }
  statsPrimary: OwStat[]
  /** Photo tile in the stat strip (section 3). Empty = the striped placeholder. */
  statsPhoto?: string
  impact: { eyebrow: string; heading: string; cta: string; ctaHref: string }
  beyondHiring: {
    headingLead: string
    headingAccent: string
    stats1525: OwStat
    // 4.8/5 value comes from GLASSDOOR_SUMMARY at render time.
    rating: { lead: string; rest: string }
    stats300: OwStat
    /** Photo tile beside the "beyond hiring" stats. Empty = the striped placeholder. */
    photo?: string
  }
  reviews: { eyebrow: string; headingLead: string; headingAccent: string; headingRest: string }
  midCta: {
    eyebrow: string
    heading: string
    cta: string
    ctaHref: string
    micro: string
    /** Photo tile in the mid-page CTA card. Empty = the striped placeholder. */
    photo?: string
  }
  labels: { readMore: string; photoPlaceholder: string }
}

export const OUR_WORK_CONTENT: OurWorkContent = {
  hero: {
    eyebrow: 'Our Work',
    titleLead: 'See what less recruitment &',
    titleAccent: 'more development',
    titleRest: 'looks like.',
    intro:
      'We help teams break free from hiring slowdowns. Global talent is found quickly, embedded deeply, and retained long-term to help you scale.',
    cta: 'View all customer stories',
    ctaHref: '/customer-stories',
  },
  trusted: {
    pre: 'Trusted by',
    highlight: '70+',
    post: 'leading CTOs, founders and engineering teams',
  },
  // Section 3 - four columns: three stats + one photo tile (photo is index 2).
  statsPrimary: [
    { value: '8x', lead: 'Hiring speed', rest: ' compared to traditional recruitment cycles, from brief to onboarding.' },
    { value: '1,000+', lead: 'Developers deployed', rest: ' into client teams worldwide, delivering long-term value and impact.' },
    { value: '7 days', lead: 'Average time', rest: ' from role briefing to developer start - fully vetted, best-fit, and embedded.' },
  ],
  impact: {
    eyebrow: 'Customer Impact',
    heading: 'Trusted to deliver results for scaling businesses:',
    cta: 'All customer stories',
    ctaHref: '/customer-stories',
  },
  // Section 5 - "Our impact beyond hiring": two stats, photo tile, 4.8/5, 300+.
  beyondHiring: {
    headingLead: 'Our impact',
    headingAccent: 'beyond hiring:',
    stats1525: { value: '+15-25%', lead: 'Est. increase', rest: ' in EBITDA for clients via reduced costs, faster releases and better retention.' },
    rating: { lead: 'Average satisfaction', rest: ' score across developers, customer stories, and reviews.' },
    stats300: { value: '300+', lead: 'Tech businesses', rest: ' helped to scale faster and smarter with Cloud Employee.' },
  },
  reviews: {
    eyebrow: 'Reviews from real teams',
    headingLead: 'What the',
    headingAccent: 'difference',
    headingRest: 'feels like',
  },
  midCta: {
    eyebrow: 'Scalable tech talent',
    heading: "Tell us who you need. We'll handle the rest.",
    cta: 'Book a Call',
    ctaHref: '/book-a-call',
    micro: 'Start hiring in 7 days. No fees, no lock-in contracts.',
  },
  labels: {
    readMore: 'Read more',
    photoPlaceholder: 'customer photo',
  },
}

export type OurWorkContentType = OurWorkContent

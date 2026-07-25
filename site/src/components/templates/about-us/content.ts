// About Us (/about-us) — static defaults / Sanity fallback.
// Live structure (D3): hero → trusted-by → stats/story → team grid → values →
// reviews → mid CTA. Team / values / reviews cards come from their own docs;
// this object holds page chrome copy only.
//
// Author voice: no em/en dashes — hyphens only.

export const ABOUT_US_META = {
  title: 'About Us | Cloud Employee',
  description:
    'Meet the Cloud Employee team. We embed senior engineers full-time in your team, tools, and timezone. Vetted by engineers, not recruiters.',
} as const

export interface AuStat {
  value: string
  label: string
}

export interface AboutUsContent {
  hero: {
    eyebrow: string
    titleLead: string
    titleAccent: string
    intro: string
    cta: string
    ctaHref: string
  }
  trusted: {
    pre: string
    highlight: string
    post: string
  }
  stats: AuStat[]
  founderImage?: string
  story: {
    eyebrow: string
    titleLead: string
    titleAccent: string
    body: string
  }
  team: {
    eyebrow: string
    titleLead: string
    titleAccent: string
    intro: string
  }
  values: {
    eyebrow: string
    titleLead: string
    titleAccent: string
    intro: string
  }
  reviews: {
    eyebrow: string
    titleLead: string
    titleAccent: string
  }
  midCta: {
    eyebrow: string
    heading: string
    cta: string
    ctaHref: string
    micro: string
  }
}

export const ABOUT_US_CONTENT: AboutUsContent = {
  hero: {
    eyebrow: 'About us',
    titleLead: 'Built by engineers,',
    titleAccent: 'for engineering teams',
    intro:
      'Cloud Employee embeds senior engineers full-time in your team, tools, and timezone. We source, vet, employ, and retain — you direct the work.',
    cta: 'Talk to us',
    ctaHref: '/book-a-call',
  },
  trusted: {
    pre: 'Trusted by',
    highlight: '300+',
    post: 'engineering teams worldwide',
  },
  stats: [
    { value: '300+', label: 'Teams built' },
    { value: '97%', label: 'Stay 2+ years' },
    { value: '7 days', label: 'To first shortlist' },
    { value: '10', label: 'Hubs across 3 continents' },
  ],
  founderImage: '',
  story: {
    eyebrow: 'Our story',
    titleLead: 'We started because hiring was broken.',
    titleAccent: 'It still is — unless you change who does the vetting.',
    body:
      'Recruiters guessing at stack fit. Hundreds of CVs. Engineers who ghost after month three. We built Cloud Employee so senior engineers run the live coding sessions, every placement is full-time and employed properly, and retention is our problem - not yours.',
  },
  team: {
    eyebrow: 'The team',
    titleLead: 'Meet the people',
    titleAccent: 'behind the placements',
    intro: 'Account managers, talent partners, and engineers who still ship — so every shortlist is judged by someone who knows the work.',
  },
  values: {
    eyebrow: 'What we believe',
    titleLead: 'How we work',
    titleAccent: 'with every team',
    intro: 'These are the values we hire to and operate by — on both the client and engineer side.',
  },
  reviews: {
    eyebrow: 'From clients',
    titleLead: 'What it feels like',
    titleAccent: 'when the match is right',
  },
  midCta: {
    eyebrow: 'Ready when you are',
    heading: 'Tell us what you need. We will send two profiles in 7 days.',
    cta: 'Book a call',
    ctaHref: '/book-a-call',
    micro: 'No placement fees. Rolling contracts. Free to interview.',
  },
}
